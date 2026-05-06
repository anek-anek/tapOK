import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageClient } from '@supabase/storage-js';

@Injectable()
export class SupabaseStorageService {
  public readonly storage: StorageClient;
  private readonly bucket = 'drops';
  private readonly signedReadUrlCache = new Map<string, { url: string; expiresAt: number }>();
  private static readonly SIGNED_READ_URL_TTL_SECONDS = 60 * 60;
  private static readonly SIGNED_READ_URL_CACHE_SKEW_MS = 5 * 60 * 1000;

  constructor(private readonly config: ConfigService) {
    const url = config.getOrThrow<string>('SUPABASE_URL');
    const key = config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.storage = new StorageClient(`${url}/storage/v1`, {
      apikey: key,
      Authorization: `Bearer ${key}`,
    });
  }

  async uploadDropCover(dropId: string, buffer: Buffer, mimeType: string): Promise<string> {
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';
    const path = `drops/${dropId}/cover.${ext}`;
    const bucket = this.storage.from(this.bucket);

    const { error } = await bucket.upload(path, buffer, {
      contentType: mimeType,
      upsert: true,
    });

    if (error) throw new InternalServerErrorException(`Storage upload failed: ${error.message}`);

    const { data } = bucket.getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  }

  async uploadPhoto(dropId: string, photoId: string, buffer: Buffer, mimeType: string): Promise<string> {
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';
    const path = `drops/${dropId}/photos/${photoId}.${ext}`;
    const bucket = this.storage.from(this.bucket);

    const { error } = await bucket.upload(path, buffer, {
      contentType: mimeType,
      upsert: true,
    });

    if (error) throw new InternalServerErrorException(`Storage upload failed: ${error.message}`);

    const { data } = bucket.getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  }

  async deleteDropCover(dropId: string): Promise<void> {
    const extensions = ['jpg', 'png'];
    const paths = extensions.map((ext) => `drops/${dropId}/cover.${ext}`);
    await this.storage.from(this.bucket).remove(paths);
  }

  async deletePhoto(dropId: string, photoId: string): Promise<void> {
    const extensions = ['jpg', 'png'];
    const paths = extensions.map((ext) => `drops/${dropId}/photos/${photoId}.${ext}`);
    await this.storage.from(this.bucket).remove(paths);
  }

  async createSignedPhotoUpload(storagePath: string): Promise<{ token: string }> {
    const { data, error } = await this.storage.from(this.bucket).createSignedUploadUrl(storagePath);
    if (error || !data?.token) {
      throw new InternalServerErrorException(
        `Storage signed upload URL creation failed: ${error?.message ?? 'missing token'}`,
      );
    }
    return { token: data.token };
  }

  async storageObjectExists(storagePath: string): Promise<boolean> {
    const normalized = storagePath.replace(/^\/+/, '');
    const slash = normalized.lastIndexOf('/');
    const folder = slash >= 0 ? normalized.slice(0, slash) : '';
    const file = slash >= 0 ? normalized.slice(slash + 1) : normalized;
    const { data, error } = await this.storage.from(this.bucket).list(folder, {
      search: file,
      limit: 1,
    });
    if (error) {
      throw new InternalServerErrorException(`Storage existence check failed: ${error.message}`);
    }
    return Boolean(data?.some((entry) => entry.name === file));
  }

  async resolvePhotoReadUrl(storagePath: string): Promise<string> {
    const now = Date.now();
    const cached = this.signedReadUrlCache.get(storagePath);
    if (cached && cached.expiresAt > now) {
      return cached.url;
    }

    const { data, error } = await this.storage
      .from(this.bucket)
      .createSignedUrl(storagePath, SupabaseStorageService.SIGNED_READ_URL_TTL_SECONDS);
    if (error || !data?.signedUrl) {
      throw new InternalServerErrorException(
        `Storage signed read URL creation failed: ${error?.message ?? 'missing signed URL'}`,
      );
    }

    this.signedReadUrlCache.set(storagePath, {
      url: data.signedUrl,
      expiresAt:
        now +
        SupabaseStorageService.SIGNED_READ_URL_TTL_SECONDS * 1000 -
        SupabaseStorageService.SIGNED_READ_URL_CACHE_SKEW_MS,
    });
    return data.signedUrl;
  }

  async tryResolvePhotoReadUrl(storagePath: string): Promise<string | null> {
    const now = Date.now();
    const cached = this.signedReadUrlCache.get(storagePath);
    if (cached && cached.expiresAt > now) {
      return cached.url;
    }

    const { data, error } = await this.storage
      .from(this.bucket)
      .createSignedUrl(storagePath, SupabaseStorageService.SIGNED_READ_URL_TTL_SECONDS);
    if (error || !data?.signedUrl) {
      return null;
    }

    this.signedReadUrlCache.set(storagePath, {
      url: data.signedUrl,
      expiresAt:
        now +
        SupabaseStorageService.SIGNED_READ_URL_TTL_SECONDS * 1000 -
        SupabaseStorageService.SIGNED_READ_URL_CACHE_SKEW_MS,
    });
    return data.signedUrl;
  }
}