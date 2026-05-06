import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';
import type { User, UserProfile, FrequentCrewMember } from '@/types/user';

export const userKeys = {
  all: ['users'] as const,
  me: ['users', 'me'] as const,
  meFrequentCrew: ['users', 'me', 'frequent-crew'] as const,
  detail: (id: string) => ['users', id] as const,
};

export function useUsers(): UseQueryResult<User[]> {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: () => usersService.getAll(),
  });
}

export function useUser(id: string): UseQueryResult<User> {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersService.getOne(id),
    enabled: Boolean(id),
  });
}

export function useCurrentUser(): UseQueryResult<UserProfile> {
  return useQuery({
    queryKey: userKeys.me,
    queryFn: () => usersService.getMe(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useFrequentCrew(): UseQueryResult<FrequentCrewMember[]> {
  return useQuery({
    queryKey: userKeys.meFrequentCrew,
    queryFn: () => usersService.getFrequentCrew(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
