import { Injectable, Logger } from '@nestjs/common';
import { DropStatus } from '../../common';
import { DropsRepository } from './drops.repository';

const DROP_DURATION_MS = 4 * 60 * 60 * 1000;

@Injectable()
export class DropsCronService {
  private readonly logger = new Logger(DropsCronService.name);

  constructor(private readonly dropsRepository: DropsRepository) {}

  async transitionDropStatuses(): Promise<{ toOngoing: number; toCompleted: number }> {
    const now = new Date();
    const toOngoing = await this.transitionActiveToOngoing(now);
    const toCompleted = await this.transitionOngoingToCompleted(now);
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

    this.logger.log(`Transitioned ${ids.length} drop(s) ACTIVE → ONGOING`);
    return ids.length;
  }

  private async transitionOngoingToCompleted(now: Date): Promise<number> {
    const cutoff = new Date(now.getTime() - DROP_DURATION_MS);
    const drops = await this.dropsRepository.findOngoingDueForCompletion(cutoff);
    if (drops.length === 0) return 0;

    const ids = drops.map((d) => d.id);
    await this.dropsRepository.bulkTransitionStatus(ids, DropStatus.COMPLETED);
    
    // Clean up non-featured photos for the completed drops
    await this.dropsRepository.deleteNonFeaturedPhotosForDrops(ids);

    await this.dropsRepository.bulkWriteLogs(
      drops.map((d) => ({ dropId: d.id, userId: d.organiserId, action: 'marked_completed' })),
    );

    this.logger.log(`Transitioned ${ids.length} drop(s) ONGOING → COMPLETED (Curation Complete)`);
    return ids.length;
  }
}
