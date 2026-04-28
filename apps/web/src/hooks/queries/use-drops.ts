import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import axios from 'axios';
import { dropsService } from '@/services/drops.service';
import { useAuth } from '@/components/providers/auth-provider';
import type { CrewMember } from '@/types/drop';

export const dropKeys = {
  mine: (uid: string) => ['drops', 'mine', uid] as const,
  minePrefix: () => ['drops', 'mine'] as const,
  detail: (id: string) => ['drops', id] as const,
  byJoinCode: (joinCode: string) => ['drops', 'join', joinCode] as const,
  crewMe: (id: string) => ['drops', id, 'crew', 'me'] as const,
  crew: (id: string) => ['drops', id, 'crew'] as const,
  myActivity: (uid: string) => ['drops', 'activity', 'mine', uid] as const,
  myActivityPrefix: () => ['drops', 'activity', 'mine'] as const,
};

export function useMyDrops(options?: { enabled?: boolean }) {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  return useQuery({
    queryKey: dropKeys.mine(uid),
    queryFn: () => dropsService.getMyDrops(),
    enabled: (options?.enabled ?? true) && Boolean(uid),
    refetchInterval: 30_000,
  });
}

export function useDrop(id: string) {
  return useQuery({
    queryKey: dropKeys.detail(id),
    queryFn: () => dropsService.getOne(id),
    enabled: Boolean(id),
    refetchInterval: 30_000,
  });
}

export function useDropByJoinCode(joinCode: string) {
  return useQuery({
    queryKey: dropKeys.byJoinCode(joinCode),
    queryFn: () => dropsService.getByJoinCode(joinCode),
    enabled: Boolean(joinCode),
    refetchInterval: 30_000,
  });
}

export function useMyActivity(options?: { enabled?: boolean }) {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  return useQuery({
    queryKey: dropKeys.myActivity(uid),
    queryFn: () => dropsService.getMyActivity(),
    enabled: (options?.enabled ?? true) && Boolean(uid),
    refetchInterval: 30_000,
  });
}

export function useMyCrewStatus(dropId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: dropKeys.crewMe(dropId),
    queryFn: () => dropsService.getMyCrewStatus(dropId),
    enabled: (options?.enabled ?? true) && Boolean(dropId),
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
}

export function useDropCrew(dropId: string, options?: { enabled?: boolean }): UseQueryResult<CrewMember[]> {
  return useQuery({
    queryKey: dropKeys.crew(dropId),
    queryFn: () => dropsService.getCrew(dropId),
    enabled: (options?.enabled ?? true) && Boolean(dropId),
    refetchInterval: 5_000,
  });
}
