import { api } from './api';
import type { User, CreateUserDto, UpdateUserDto } from '@/types/user';

export const usersService = {
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

  remove(id: string): Promise<void> {
    return api.delete(`/users/${id}`).then(() => undefined);
  },
};
