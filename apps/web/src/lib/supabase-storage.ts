import { StorageClient } from '@supabase/storage-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Returns a StorageClient instance.
 * During build time, if env vars are missing, it returns a placeholder client 
 * to avoid ERR_INVALID_URL crashes during module evaluation.
 */
function getStorageClient(token?: string) {
  const url = supabaseUrl || 'https://placeholder.supabase.co';
  const key = supabaseAnonKey || 'none';
  
  return new StorageClient(`${url}/storage/v1`, {
    apikey: key,
    Authorization: `Bearer ${token || key}`,
  });
}

export const COVER_PHOTO_BUCKET = 'drops';
export const MAX_COVER_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_COVER_PHOTO_TYPES = ['image/jpeg', 'image/png'];

export async function uploadDropCover(dropId: string, file: File, userToken: string): Promise<string> {
  const ext = file.type === 'image/png' ? 'png' : 'jpg';
  const path = `drops/${dropId}/cover.${ext}`;

  if (!supabaseUrl) throw new Error('Supabase URL is not configured');

  // Use the user's JWT so RLS policies apply
  const authedClient = getStorageClient(userToken);

  const { error } = await authedClient.from(COVER_PHOTO_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = authedClient.from(COVER_PHOTO_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function deleteDropCover(dropId: string, userToken: string): Promise<void> {
  const authedClient = getStorageClient(userToken);

  const paths = [`drops/${dropId}/cover.jpg`, `drops/${dropId}/cover.png`];
  await authedClient.from(COVER_PHOTO_BUCKET).remove(paths);
}

export async function uploadToSignedDropPhotoUrl(
  storagePath: string,
  uploadToken: string,
  file: File,
): Promise<void> {
  const client = getStorageClient();
  const { error } = await client.from(COVER_PHOTO_BUCKET).uploadToSignedUrl(storagePath, uploadToken, file, {
    contentType: file.type,
  });
  if (error) {
    throw new Error(`Signed upload failed: ${error.message}`);
  }
}

// Export a getter-based client to maintain compatibility if used as an object
export const storageClient = getStorageClient();
