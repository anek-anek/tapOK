import { api } from './api';
import type { Drop, CreateDropDto, UpdateDropDto, DropActivityLog, DropCrew, CrewMember, ActivityLogsPage, DiscoverDropsPayload } from '@/types/drop';
import { uploadToSignedDropPhotoUrl } from '@/lib/supabase-storage';

interface CreatePhotoUploadSessionDto {
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

interface PhotoUploadSession {
  photoId: string;
  storagePath: string;
  uploadToken: string;
}


export const dropsService = {
  getMyDrops(): Promise<Drop[]> {
    return api.get<Drop[]>('/drops/mine').then((r) => r.data);
  },

  getOne(id: string): Promise<Drop> {
    return api.get<Drop>(`/drops/${id}`).then((r) => r.data);
  },

  getByJoinCode(joinCode: string): Promise<Drop> {
    return api.get<Drop>(`/drops/join/${joinCode}`).then((r) => r.data);
  },

  create(dto: CreateDropDto): Promise<Drop> {
    return api.post<Drop>('/drops', dto).then((r) => r.data);
  },

  update(id: string, dto: UpdateDropDto): Promise<Drop> {
    return api.patch<Drop>(`/drops/${id}`, dto).then((r) => r.data);
  },
  
  delete(id: string): Promise<void> {
    return api.delete(`/drops/${id}`).then(() => undefined);
  },

  joinDrop(id: string): Promise<DropCrew> {
    return api.post<DropCrew>(`/drops/${id}/join`).then((r) => r.data);
  },

  inviteToDrop(id: string, userId: string): Promise<void> {
    return api.post(`/drops/${id}/invite/${userId}`).then(() => undefined);
  },

  getMyCrewStatus(id: string): Promise<DropCrew> {
    return api.get<DropCrew>(`/drops/${id}/crew/me`).then((r) => r.data);
  },

  leaveDrop(id: string): Promise<void> {
    return api.delete(`/drops/${id}/crew/me`).then(() => undefined);
  },

  getMyActivity(page = 1, limit = 15): Promise<DropActivityLog[]> {
    return api.get<DropActivityLog[]>('/drops/activity/mine', { params: { page, limit } }).then((r) => r.data);
  },

  getCrew(id: string): Promise<CrewMember[]> {
    return api.get<CrewMember[]>(`/drops/${id}/crew`).then((r) => r.data);
  },

  approveJoinRequest(dropId: string, userId: string): Promise<void> {
    return api.patch(`/drops/${dropId}/crew/${userId}/approve`).then(() => undefined);
  },

  rejectJoinRequest(dropId: string, userId: string): Promise<void> {
    return api.patch(`/drops/${dropId}/crew/${userId}/reject`).then(() => undefined);
  },

  removeCrewMember(dropId: string, userId: string): Promise<void> {
    return api.patch(`/drops/${dropId}/crew/${userId}/remove`).then(() => undefined);
  },

  updatePresence(dropId: string, isPresent: boolean): Promise<void> {
    return api.patch(`/drops/${dropId}/crew/me/presence`, { isPresent }).then(() => undefined);
  },

  getActivityLogs(dropId: string, page: number, limit = 6): Promise<ActivityLogsPage> {
    return api.get<ActivityLogsPage>(`/drops/${dropId}/activity`, { params: { page, limit } }).then((r) => r.data);
  },
  
  getDiscoverData(page = 1, limit = 6, category?: string): Promise<DiscoverDropsPayload> {
    return api.get('/drops/discover', { params: { page, limit, category } }).then((r) => r.data);
  },

  uploadCoverPhoto(id: string, file: File): Promise<Drop> {
    const form = new FormData();
    form.append('file', file);
    return api.post<Drop>(`/drops/${id}/cover-photo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  deleteCoverPhoto(id: string): Promise<void> {
    return api.delete(`/drops/${id}/cover-photo`).then(() => undefined);
  },

  getPhotos(dropId: string, page = 1, limit = 20): Promise<{ data: any[]; total: number; page: number; totalPages: number }> {
    return api.get(`/drops/${dropId}/photos`, { params: { page, limit } }).then((r) => r.data);
  },

  getPhotoDetail(dropId: string, photoId: string): Promise<any> {
    return api.get(`/drops/${dropId}/photos/${photoId}`).then((r) => r.data);
  },

  createPhotoUploadSession(dropId: string, dto: CreatePhotoUploadSessionDto): Promise<PhotoUploadSession> {
    return api.post<PhotoUploadSession>(`/drops/${dropId}/photos/upload-url`, dto).then((r) => r.data);
  },

  completePhotoUpload(dropId: string, photoId: string): Promise<any> {
    return api.post<any>(`/drops/${dropId}/photos/${photoId}/complete`).then((r) => r.data);
  },

  async uploadPhoto(dropId: string, file: File, imageSize?: { width: number; height: number }): Promise<any> {
    const session = await this.createPhotoUploadSession(dropId, {
      mimeType: file.type,
      sizeBytes: file.size,
      width: imageSize?.width,
      height: imageSize?.height,
    });
    await uploadToSignedDropPhotoUrl(session.storagePath, session.uploadToken, file);
    return this.completePhotoUpload(dropId, session.photoId);
  },

  featurePhoto(dropId: string, photoId: string): Promise<any> {
    return api.patch<any>(`/drops/${dropId}/photos/${photoId}/feature`).then((r) => r.data);
  },

  deletePhoto(dropId: string, photoId: string): Promise<void> {
    return api.delete(`/drops/${dropId}/photos/${photoId}`).then(() => undefined);
  },
  
  spark(id: string): Promise<void> {
    return api.post(`/drops/${id}/spark`).then(() => undefined);
  },

  unspark(id: string): Promise<void> {
    return api.delete(`/drops/${id}/spark`).then(() => undefined);
  },
  
  addItem(dropId: string, name: string): Promise<any> {
    return api.post(`/drops/${dropId}/items`, { name }).then((r) => r.data);
  },

  renameItem(dropId: string, itemId: string, name: string): Promise<void> {
    return api.patch(`/drops/${dropId}/items/${itemId}`, { name }).then(() => undefined);
  },

  removeItem(dropId: string, itemId: string): Promise<void> {
    return api.delete(`/drops/${dropId}/items/${itemId}`).then(() => undefined);
  },

  assignItem(dropId: string, itemId: string, assignedUserId: string): Promise<void> {
    return api.post(`/drops/${dropId}/items/${itemId}/assign`, { assignedUserId }).then(() => undefined);
  },

  unassignItem(dropId: string, itemId: string): Promise<void> {
    return api.post(`/drops/${dropId}/items/${itemId}/unassign`).then(() => undefined);
  },

  randomAssignItems(dropId: string): Promise<void> {
    return api.post(`/drops/${dropId}/items/random-assign`).then(() => undefined);
  },

  pickItem(dropId: string, itemId: string): Promise<void> {
    return api.post(`/drops/${dropId}/items/${itemId}/pick`).then(() => undefined);
  },
  
  confirmItem(dropId: string, itemId: string): Promise<void> {
    return api.patch(`/drops/${dropId}/items/${itemId}/confirm`).then(() => undefined);
  },
};
