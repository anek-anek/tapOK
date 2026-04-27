import { api } from './api';
import type { Drop, CreateDropDto, UpdateDropDto } from '@/types/drop';

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
};
