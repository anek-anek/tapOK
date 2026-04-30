import { api } from './api';
import type { Drop, CreateDropDto, UpdateDropDto, DropActivityLog, DropCrew, CrewMember, ActivityLogsPage } from '@/types/drop';


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

  joinDrop(id: string): Promise<DropCrew> {
    return api.post<DropCrew>(`/drops/${id}/join`).then((r) => r.data);
  },

  getMyCrewStatus(id: string): Promise<DropCrew> {
    return api.get<DropCrew>(`/drops/${id}/crew/me`).then((r) => r.data);
  },

  leaveDrop(id: string): Promise<void> {
    return api.delete(`/drops/${id}/crew/me`).then(() => undefined);
  },

  getMyActivity(): Promise<DropActivityLog[]> {
    return api.get<DropActivityLog[]>('/drops/activity/mine').then((r) => r.data);
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
};
