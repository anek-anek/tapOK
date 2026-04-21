import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export function useHealth() {
  const { data, isError } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('/health'),
    retry: false,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  if (!data && !isError) return 'loading' as const;
  if (isError) return 'down' as const;
  return 'up' as const;
}
