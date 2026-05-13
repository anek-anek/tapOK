import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseStorageService } from './supabase-storage.service';

@Injectable()
export class MediaAssetsService {
  constructor(private readonly storage: SupabaseStorageService) {}

  buildDropCoverPath(dropId: string, mimeType: string): string {
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';
    return `drops/${dropId}/cover.${ext}`;
  }

  buildDropPhotoPath(dropId: string, photoId: string, mimeType: string): string {
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';
    return `drops/${dropId}/photos/${photoId}.${ext}`;
  }

  buildUserAvatarPath(userId: string, mimeType: string): string {
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';
    return `users/${userId}/avatar_${Date.now()}.${ext}`;
  }

  buildAmotProofPath(dropId: string, userId: string, mimeType: string): string {
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';
    return `drops/${dropId}/amot-proofs/${userId}_${Date.now()}.${ext}`;
  }

  async uploadImage(path: string, buffer: Buffer, mimeType: string): Promise<string> {
    const { error } = await this.storage.storage.from('drops').upload(path, buffer, {
      contentType: mimeType,
      upsert: true,
    });
    if (error) {
      throw new InternalServerErrorException(`Storage upload failed: ${error.message}`);
    }
    return this.storage.resolvePhotoReadUrl(path);
  }

  createSignedUpload(path: string): Promise<{ token: string }> {
    return this.storage.createSignedPhotoUpload(path);
  }

  storageObjectExists(path: string): Promise<boolean> {
    return this.storage.storageObjectExists(path);
  }

  resolveReadUrl(path: string): Promise<string> {
    return this.storage.resolvePhotoReadUrl(path);
  }

  tryResolveReadUrl(path: string): Promise<string | null> {
    return this.storage.tryResolvePhotoReadUrl(path);
  }

  async deleteByPath(path: string): Promise<void> {
    const { error } = await this.storage.storage.from('drops').remove([path]);
    if (error) {
      throw new InternalServerErrorException(`Storage delete failed: ${error.message}`);
    }
  }

  async deleteManyByPath(paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    const { error } = await this.storage.storage.from('drops').remove(paths);
    if (error) {
      throw new InternalServerErrorException(`Storage bulk delete failed: ${error.message}`);
    }
  }

  extractStoragePath(reference: string): string | null {
    if (!reference) return null;
    if (reference.startsWith('drops/') || reference.startsWith('users/')) return reference;

    try {
      const url = new URL(reference);
      const pathname = decodeURIComponent(url.pathname);
      const publicPrefix = '/storage/v1/object/public/drops/';
      const signedPrefix = '/storage/v1/object/sign/drops/';
      if (pathname.startsWith(publicPrefix)) {
        return pathname.slice(publicPrefix.length);
      }
      if (pathname.startsWith(signedPrefix)) {
        return pathname.slice(signedPrefix.length);
      }
    } catch {
      return null;
    }
    return null;
  }
}
