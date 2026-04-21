import { useQuery } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';

export const userKeys = {
  all: ['users'] as const,
  detail: (id: string) => ['users', id] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: () => usersService.getAll(),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersService.getOne(id),
    enabled: Boolean(id),
  });
}
