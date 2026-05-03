import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageClient } from '@supabase/storage-js';

@Injectable()
export class SupabaseStorageService {
  public readonly storage: StorageClient;

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
    const bucket = this.storage.from('drops');

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
    const bucket = this.storage.from('drops');

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
    await this.storage.from('drops').remove(paths);
  }
}