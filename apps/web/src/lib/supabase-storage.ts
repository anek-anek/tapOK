import { StorageClient } from '@supabase/storage-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const storageClient = new StorageClient(`${supabaseUrl}/storage/v1`, {
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${supabaseAnonKey}`,
});

export const COVER_PHOTO_BUCKET = 'drops';
export const MAX_COVER_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_COVER_PHOTO_TYPES = ['image/jpeg', 'image/png'];

export async function uploadDropCover(dropId: string, file: File, userToken: string): Promise<string> {
  const ext = file.type === 'image/png' ? 'png' : 'jpg';
  const path = `drops/${dropId}/cover.${ext}`;

  // Use the user's JWT so RLS policies apply
  const authedClient = new StorageClient(`${supabaseUrl}/storage/v1`, {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${userToken}`,
  });

  const { error } = await authedClient.from(COVER_PHOTO_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = authedClient.from(COVER_PHOTO_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function deleteDropCover(dropId: string, userToken: string): Promise<void> {
  const authedClient = new StorageClient(`${supabaseUrl}/storage/v1`, {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${userToken}`,
  });

  const paths = [`drops/${dropId}/cover.jpg`, `drops/${dropId}/cover.png`];
  await authedClient.from(COVER_PHOTO_BUCKET).remove(paths);
}

export { storageClient };
