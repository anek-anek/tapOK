import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useSuspenseQuery,
  type UseQueryResult,
} from '@tanstack/react-query';
import axios from 'axios';
import { dropsService } from '@/services/drops.service';
import { useAuth } from '@/components/providers/auth-provider';
import type { CrewMember, DiscoverDropsPayload } from '@/types/drop';

export const dropKeys = {
  mine: (uid: string) => ['drops', 'mine', uid] as const,
  minePrefix: () => ['drops', 'mine'] as const,
  detail: (id: string) => ['drops', id] as const,
  byJoinCode: (joinCode: string) => ['drops', 'join', joinCode] as const,
  crewMe: (id: string) => ['drops', id, 'crew', 'me'] as const,
  crew: (id: string) => ['drops', id, 'crew'] as const,
  myActivity: (uid: string) => ['drops', 'activity', 'mine', uid] as const,
  myActivityPrefix: () => ['drops', 'activity', 'mine'] as const,
  activityLogs: (id: string, page: number) => ['drops', id, 'activity', page] as const,
  discoverLayout: (uid?: string) => ['drops', 'discover', 'layout', uid] as const,
  discoverStream: (category?: string, uid?: string) => ['drops', 'discover', 'stream', category, uid] as const,
};

export function useDiscoverLayout() {
  const { dbUser, isReady } = useAuth();
  const uid = dbUser?.id;

  return useQuery({
    queryKey: dropKeys.discoverLayout(uid),
    queryFn: () => dropsService.getDiscoverData(1, 1),
    enabled: isReady,
    staleTime: 5 * 60_000,
  });
}

export function useInfiniteDiscoverDrops(options?: { category?: string; limit?: number; uid?: string }) {
  const category = options?.category;
  const limit = options?.limit ?? 15;
  const uid = options?.uid;

  return useInfiniteQuery({
    queryKey: dropKeys.discoverStream(category, uid),
    queryFn: ({ pageParam = 1 }) => 
      dropsService.getDiscoverData(pageParam as number, limit, category === 'all' ? undefined : category),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.allPublic.page < lastPage.allPublic.totalPages) {
        return lastPage.allPublic.page + 1;
      }
      return undefined;
    },
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
    staleTime: 60_000,
  });
}

export function useMyDrops(options?: { enabled?: boolean }) {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  return useQuery({
    queryKey: dropKeys.mine(uid),
    queryFn: () => dropsService.getMyDrops(),
    enabled: (options?.enabled ?? true) && Boolean(uid),
    refetchInterval: 30_000,
    staleTime: 30_000,
  });
}

/** Endpoints protected by FirebaseAuthGuard: wait until auth is resolved and a user is signed in (avoids 401 before axios has a token on cold load). */
function useFirebaseAuthReadyForProtectedDropRoutes() {
  const { user, loading } = useAuth();
  return !loading && Boolean(user);
}

export function useDrop(id: string, options?: { enabled?: boolean }) {
  const authOk = useFirebaseAuthReadyForProtectedDropRoutes();
  return useQuery({
    queryKey: dropKeys.detail(id),
    queryFn: () => dropsService.getOne(id),
    enabled: (options?.enabled ?? true) && Boolean(id) && authOk,
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}

export function useSuspenseDrop(id: string) {
  return useSuspenseQuery({
    queryKey: dropKeys.detail(id),
    queryFn: () => dropsService.getOne(id),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}

export function useDropByJoinCode(joinCode: string, options?: { enabled?: boolean }) {
  const authOk = useFirebaseAuthReadyForProtectedDropRoutes();
  return useQuery({
    queryKey: dropKeys.byJoinCode(joinCode),
    queryFn: () => dropsService.getByJoinCode(joinCode),
    enabled: (options?.enabled ?? true) && Boolean(joinCode) && authOk,
    refetchInterval: 30_000,
    staleTime: 25_000,
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
    staleTime: 30_000,
  });
}

export function useMyCrewStatus(dropId: string, options?: { enabled?: boolean }) {
  const authOk = useFirebaseAuthReadyForProtectedDropRoutes();
  return useQuery({
    queryKey: dropKeys.crewMe(dropId),
    queryFn: () => dropsService.getMyCrewStatus(dropId),
    enabled: (options?.enabled ?? true) && Boolean(dropId) && authOk,
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
}

export function useDropActivityLogs(dropId: string, page: number, options?: { enabled?: boolean }) {
  const authOk = useFirebaseAuthReadyForProtectedDropRoutes();
  return useQuery({
    queryKey: dropKeys.activityLogs(dropId, page),
    queryFn: () => dropsService.getActivityLogs(dropId, page),
    enabled: (options?.enabled ?? true) && Boolean(dropId) && authOk,
    refetchInterval: 30_000,
    staleTime: 30_000,
  });
}

export function useSuspenseDropActivityLogs(dropId: string, page: number) {
  return useSuspenseQuery({
    queryKey: dropKeys.activityLogs(dropId, page),
    queryFn: () => dropsService.getActivityLogs(dropId, page),
    refetchInterval: 30_000,
    staleTime: 30_000,
  });
}

export function useDropCrew(dropId: string, options?: { enabled?: boolean }): UseQueryResult<CrewMember[]> {
  const authOk = useFirebaseAuthReadyForProtectedDropRoutes();
  return useQuery({
    queryKey: dropKeys.crew(dropId),
    queryFn: () => dropsService.getCrew(dropId),
    enabled: (options?.enabled ?? true) && Boolean(dropId) && authOk,
    refetchInterval: 20_000,
    staleTime: 15_000,
  });
}

export function useSuspenseDropCrew(dropId: string) {
  return useSuspenseQuery({
    queryKey: dropKeys.crew(dropId),
    queryFn: () => dropsService.getCrew(dropId),
    refetchInterval: 20_000,
    staleTime: 15_000,
  });
}
