import { useQuery } from '@tanstack/react-query';
import { dropsService } from '@/services/drops.service';

export const dropKeys = {
  mine: () => ['drops', 'mine'] as const,
  detail: (id: string) => ['drops', id] as const,
  byJoinCode: (joinCode: string) => ['drops', 'join', joinCode] as const,
};

export function useMyDrops(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: dropKeys.mine(),
    queryFn: () => dropsService.getMyDrops(),
    enabled: options?.enabled ?? true,
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
