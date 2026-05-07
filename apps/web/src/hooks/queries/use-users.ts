import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';
import type { User, UserProfile, FrequentCrewMember } from '@/types/user';

export const userKeys = {
  all: ['users'] as const,
  meBase: ['users', 'me'] as const,
  meFrequentCrewBase: ['users', 'me', 'frequent-crew'] as const,
  me: (include: string) => ['users', 'me', include] as const,
  meFrequentCrew: (include: string) => ['users', 'me', 'frequent-crew', include] as const,
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

export function useCurrentUser(
  include: Array<'stats' | 'avatar'> = [],
): UseQueryResult<UserProfile> {
  const includeKey = include.slice().sort().join(',');
  return useQuery({
    queryKey: userKeys.me(includeKey),
    queryFn: () => usersService.getMe(include),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useFrequentCrew(include: Array<'avatar'> = []): UseQueryResult<FrequentCrewMember[]> {
  const includeKey = include.slice().sort().join(',');
  return useQuery({
    queryKey: userKeys.meFrequentCrew(includeKey),
    queryFn: () => usersService.getFrequentCrew(include),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
