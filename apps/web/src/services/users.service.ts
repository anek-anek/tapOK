import { api } from './api';
import type { User, UserProfile, CreateUserDto, UpdateUserDto, FrequentCrewMember } from '@/types/user';
import { uploadToSignedDropPhotoUrl } from '@/lib/supabase-storage';

interface CreateAvatarUploadSessionDto {
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

interface AvatarUploadSession {
  userId: string;
  storagePath: string;
  uploadToken: string;
}

export const usersService = {
  getMe(): Promise<UserProfile> {
    return api.get<UserProfile>('/users/me').then((r) => r.data);
  },

  getFrequentCrew(): Promise<FrequentCrewMember[]> {
    return api.get<FrequentCrewMember[]>('/users/me/frequent-crew').then((r) => r.data);
  },

  getAll(): Promise<User[]> {
    return api.get<User[]>('/users').then((r) => r.data);
  },

  getOne(id: string): Promise<User> {
    return api.get<User>(`/users/${id}`).then((r) => r.data);
  },

  create(dto: CreateUserDto): Promise<User> {
    return api.post<User>('/users', dto).then((r) => r.data);
  },

  update(id: string, dto: UpdateUserDto): Promise<User> {
    return api.patch<User>(`/users/${id}`, dto).then((r) => r.data);
  },

  createAvatarUploadSession(id: string, dto: CreateAvatarUploadSessionDto): Promise<AvatarUploadSession> {
    return api.post<AvatarUploadSession>(`/users/${id}/avatar/upload-url`, dto).then((r) => r.data);
  },

  completeAvatarUpload(id: string): Promise<User> {
    return api.post<User>(`/users/${id}/avatar/complete`).then((r) => r.data);
  },

  async uploadAvatar(id: string, file: File, imageSize?: { width: number; height: number }): Promise<User> {
    const session = await this.createAvatarUploadSession(id, {
      mimeType: file.type,
      sizeBytes: file.size,
      width: imageSize?.width,
      height: imageSize?.height,
    });
    await uploadToSignedDropPhotoUrl(session.storagePath, session.uploadToken, file);
    return this.completeAvatarUpload(id);
  },

  remove(id: string): Promise<void> {
    return api.delete(`/users/${id}`).then(() => undefined);
  },
};
