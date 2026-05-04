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
import type { CrewMember, DiscoverDropsPayload, DropCrew } from '@/types/drop';

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
  photos: (id: string) => ['drops', id, 'photos'] as const,
  photoDetail: (id: string, photoId: string) => ['drops', id, 'photos', photoId] as const,
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
    staleTime: 600_000,
    refetchInterval: 600_000,
  });
}

export function useMyDrops(options?: { enabled?: boolean }) {
  const { dbUser, isReady } = useAuth();
  const uid = dbUser?.id ?? '';
  return useQuery({
    queryKey: dropKeys.mine(uid),
    queryFn: () => dropsService.getMyDrops(),
    enabled: (options?.enabled ?? true) && Boolean(uid) && isReady,
  });
}


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
  });
}

export function useSuspenseDrop(id: string) {
  return useSuspenseQuery({
    queryKey: dropKeys.detail(id),
    queryFn: () => dropsService.getOne(id),
  });
}

export function useDropByJoinCode(joinCode: string, options?: { enabled?: boolean }) {
  const authOk = useFirebaseAuthReadyForProtectedDropRoutes();
  return useQuery({
    queryKey: dropKeys.byJoinCode(joinCode),
    queryFn: () => dropsService.getByJoinCode(joinCode),
    enabled: (options?.enabled ?? true) && Boolean(joinCode) && authOk,
    refetchInterval: 300_000,
    staleTime: 300_000,
  });
}

export function useMyActivity(options?: { enabled?: boolean, page?: number, limit?: number }) {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 15;
  return useQuery({
    queryKey: ['activity', 'me', page, limit],
    queryFn: () => dropsService.getMyActivity(page, limit),
    enabled: (options?.enabled ?? true) && Boolean(uid),
    placeholderData: keepPreviousData,
    refetchInterval: 300_000,
  });
}

export function useMyCrewStatus(dropId: string, options?: { enabled?: boolean }) {
  const authOk = useFirebaseAuthReadyForProtectedDropRoutes();
  return useQuery({
    queryKey: dropKeys.crewMe(dropId),
    queryFn: async (): Promise<DropCrew | null> => {
      try {
        return await dropsService.getMyCrewStatus(dropId);
      } catch (e: unknown) {
        if (axios.isAxiosError(e) && e.response?.status === 404) {
          return null;
        }
        throw e;
      }
    },
    enabled: (options?.enabled ?? true) && Boolean(dropId) && authOk,
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
}

export function useDropActivityLogs(dropId: string, page: number, options?: { enabled?: boolean, limit?: number }) {
  const authOk = useFirebaseAuthReadyForProtectedDropRoutes();
  const limit = options?.limit ?? 5;
  return useQuery({
    queryKey: dropKeys.activityLogs(dropId, page),
    queryFn: () => dropsService.getActivityLogs(dropId, page, limit),
    enabled: (options?.enabled ?? true) && Boolean(dropId) && authOk,
    placeholderData: keepPreviousData,
    refetchInterval: 300_000,
  });
}

export function useSuspenseDropActivityLogs(dropId: string, page: number) {
  return useSuspenseQuery({
    queryKey: dropKeys.activityLogs(dropId, page),
    queryFn: () => dropsService.getActivityLogs(dropId, page),
  });
}

export function useDropCrew(dropId: string, options?: { enabled?: boolean }): UseQueryResult<CrewMember[]> {
  const authOk = useFirebaseAuthReadyForProtectedDropRoutes();
  return useQuery({
    queryKey: dropKeys.crew(dropId),
    queryFn: () => dropsService.getCrew(dropId),
    enabled: (options?.enabled ?? true) && Boolean(dropId) && authOk,
  });
}

export function useSuspenseDropCrew(dropId: string) {
  return useSuspenseQuery({
    queryKey: dropKeys.crew(dropId),
    queryFn: () => dropsService.getCrew(dropId),
  });
}

export function useInfinitePhotos(dropId: string, options?: { enabled?: boolean; limit?: number }) {
  const authOk = useFirebaseAuthReadyForProtectedDropRoutes();
  const limit = options?.limit ?? 20;

  return useInfiniteQuery({
    queryKey: dropKeys.photos(dropId),
    queryFn: ({ pageParam = 1 }) => dropsService.getPhotos(dropId, pageParam as number, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: Boolean(dropId) && authOk && (options?.enabled ?? true),
    staleTime: 600_000, // 10 minutes
    refetchInterval: 600_000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

export function usePhotoDetail(dropId: string, photoId: string, options?: { enabled?: boolean }) {
  const authOk = useFirebaseAuthReadyForProtectedDropRoutes();
  return useQuery({
    queryKey: dropKeys.photoDetail(dropId, photoId),
    queryFn: () => dropsService.getPhotoDetail(dropId, photoId),
    enabled: Boolean(dropId) && Boolean(photoId) && authOk && (options?.enabled ?? true),
    staleTime: Infinity, // Photos don't change
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}
