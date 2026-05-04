import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DropStatus, MediaAssetsService } from '../../common';
import { DropsRepository } from './drops.repository';
import {
  STALE_AVATAR_UPLOAD_TTL_MINUTES,
  STALE_PHOTO_UPLOAD_TTL_MINUTES,
} from './drop-photo.constants';
import { UsersRepository } from '../users/users.repository';

const DROP_DURATION_MS = 4 * 60 * 60 * 1000;

@Injectable()
export class DropsCronService {
  private readonly logger = new Logger(DropsCronService.name);

  constructor(
    private readonly dropsRepository: DropsRepository,
    private readonly mediaAssets: MediaAssetsService,
    private readonly usersRepository: UsersRepository,
  ) {}

  @Cron('* * * * *')
  async transitionDropStatuses(): Promise<{ toOngoing: number; toCompleted: number }> {
    const now = new Date();
    const toOngoing = await this.transitionActiveToOngoing(now);
    const toCompleted = await this.transitionOngoingToCompleted(now);
    await this.cleanupStalePendingPhotoUploads(now);
    await this.cleanupStalePendingAvatarUploads(now);
    await this.repairDeadCoverPhotos();
    return { toOngoing, toCompleted };
  }

  private async transitionActiveToOngoing(now: Date): Promise<number> {
    const drops = await this.dropsRepository.findActiveDueForOngoing(now);
    if (drops.length === 0) return 0;

    const ids = drops.map((d) => d.id);
    await this.dropsRepository.bulkTransitionStatus(ids, DropStatus.ONGOING);
    await this.dropsRepository.bulkWriteLogs(
      drops.map((d) => ({ dropId: d.id, userId: d.organiserId, action: 'marked_ongoing' })),
    );

    this.logger.log(
      `Drop activity (cron): ${JSON.stringify({ action: 'marked_ongoing', count: ids.length })}`,
    );
    this.logger.log(`Transitioned ${ids.length} drop(s) ACTIVE → ONGOING`);
    return ids.length;
  }

  private async transitionOngoingToCompleted(now: Date): Promise<number> {
    const cutoff = new Date(now.getTime() - DROP_DURATION_MS);
    const drops = await this.dropsRepository.findOngoingDueForCompletion(cutoff);
    if (drops.length === 0) return 0;

    const ids = drops.map((d) => d.id);
    await this.dropsRepository.bulkTransitionStatus(ids, DropStatus.COMPLETED);
    
    // Clean up non-featured photos for the completed drops (storage + DB).
    await this.cleanupNonFeaturedPhotos(ids);

    await this.dropsRepository.bulkWriteLogs(
      drops.map((d) => ({ dropId: d.id, userId: d.organiserId, action: 'marked_completed' })),
    );

    this.logger.log(
      `Drop activity (cron): ${JSON.stringify({ action: 'marked_completed', count: ids.length })}`,
    );
    this.logger.log(`Transitioned ${ids.length} drop(s) ONGOING → COMPLETED (Curation Complete)`);
    return ids.length;
  }

  private async cleanupStalePendingPhotoUploads(now: Date): Promise<void> {
    const cutoff = new Date(now.getTime() - STALE_PHOTO_UPLOAD_TTL_MINUTES * 60 * 1000);
    const stale = await this.dropsRepository.findStalePendingUploadPhotos(cutoff);
    if (stale.length === 0) return;

    for (const photo of stale) {
      if (!photo.storagePath) continue;
      try {
        await this.mediaAssets.deleteByPath(photo.storagePath);
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Failed to delete stale upload object (dropId=${photo.dropId}, photoId=${photo.id}): ${detail}`,
        );
      }
    }

    await this.dropsRepository.deletePhotosByIds(stale.map((p) => p.id));
    this.logger.log(
      `Cleaned up stale pending photo uploads: ${JSON.stringify({ count: stale.length })}`,
    );
  }

  private async cleanupNonFeaturedPhotos(dropIds: string[]): Promise<void> {
    const nonFeatured = await this.dropsRepository.findNonFeaturedPhotosForDrops(dropIds);
    await this.mediaAssets.deleteManyByPath(
      nonFeatured
        .map((photo) => photo.storagePath)
        .filter((path): path is string => Boolean(path)),
    );
    await this.dropsRepository.deleteNonFeaturedPhotosForDrops(dropIds);
  }

  private async cleanupStalePendingAvatarUploads(now: Date): Promise<void> {
    const cutoff = new Date(now.getTime() - STALE_AVATAR_UPLOAD_TTL_MINUTES * 60 * 1000);
    const staleUsers = await this.usersRepository.findStalePendingAvatarUploads(cutoff);
    if (staleUsers.length === 0) return;

    for (const user of staleUsers) {
      if (user.avatarStoragePath) {
        try {
          await this.mediaAssets.deleteByPath(user.avatarStoragePath);
        } catch (err) {
          const detail = err instanceof Error ? err.message : String(err);
          this.logger.warn(
            `Failed to delete stale avatar upload object (userId=${user.id}): ${detail}`,
          );
        }
      }

      // Revert pending pointer back to the finalized avatar path, if any.
      const finalizedPath = user.avatar ? this.mediaAssets.extractStoragePath(user.avatar) : null;
      await this.usersRepository.updateAvatarStoragePath(user.id, finalizedPath);
    }

    this.logger.log(
      `Cleaned up stale pending avatar uploads: ${JSON.stringify({ count: staleUsers.length })}`,
    );
  }

  private async repairDeadCoverPhotos(): Promise<void> {
    const drops = await this.dropsRepository.findDropsWithCoverPhoto();
    if (drops.length === 0) return;

    const deadIds: string[] = [];
    for (const drop of drops) {
      const cover = drop.coverPhoto;
      if (!cover || cover.startsWith('/')) continue;
      const storagePath = this.mediaAssets.extractStoragePath(cover);
      if (!storagePath) continue;
      const exists = await this.mediaAssets.storageObjectExists(storagePath);
      if (!exists) {
        deadIds.push(drop.id);
      }
    }

    if (deadIds.length === 0) return;
    for (const id of deadIds) {
      await this.dropsRepository.update(id, { coverPhoto: null });
    }
    this.logger.warn(
      `Auto-cleared dead coverPhoto references: ${JSON.stringify({ count: deadIds.length })}`,
    );
  }
}
