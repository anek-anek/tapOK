import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dropsService } from '@/services/drops.service';
import { toast } from 'react-hot-toast';

export function useSparkDrop(dropId: string, userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dropsService.spark(dropId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['drops'] });

      const previousQueries = queryClient.getQueriesData({ queryKey: ['drops'] });
      const spark = { userId, dropId };

      queryClient.setQueriesData({ queryKey: ['drops'] }, (old: any) => {
        if (!old || !userId) return old;

        const updateSparks = (sparks: any[]) => [...(sparks || []), spark];

        if (old.id === dropId) {
          return { ...old, sparks: updateSparks(old.sparks) };
        }

        if (Array.isArray(old)) {
          return old.map(d => d.id === dropId ? { ...d, sparks: updateSparks(d.sparks) } : d);
        }

        if (old.featured !== undefined || old.allPublic !== undefined) {
          const update = (d: any) => {
            if (!d || d.id !== dropId) return d;
            if ('sparkCount' in d && typeof d.sparkCount === 'number') {
              return {
                ...d,
                sparkCount: d.sparkCount + 1,
                sparkedByViewer: true,
              };
            }
            return { ...d, sparks: updateSparks(d.sparks) };
          };
          return {
            ...old,
            featured: update(old.featured),
            recentChiefsDrops: old.recentChiefsDrops?.map(update),
            allPublic: old.allPublic ? {
              ...old.allPublic,
              data: old.allPublic.data?.map(update)
            } : old.allPublic
          };
        }

        return old;
      });

      return { previousQueries };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drops'] });
    },
    onError: (err: any, _, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      const rawMsg = err.response?.data?.message || 'FAILED TO SPARK DROP';
      const msg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
      toast.error(String(msg).toUpperCase());
    },
  });
}

export function useUnsparkDrop(dropId: string, userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dropsService.unspark(dropId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['drops'] });

      const previousQueries = queryClient.getQueriesData({ queryKey: ['drops'] });

      queryClient.setQueriesData({ queryKey: ['drops'] }, (old: any) => {
        if (!old || !userId) return old;

        const filterSparks = (sparks: any[]) => (sparks || []).filter((s: any) => s.userId !== userId);

        // 1. Single Drop
        if (old.id === dropId) {
          return { ...old, sparks: filterSparks(old.sparks) };
        }

        // 2. Array of Drops
        if (Array.isArray(old)) {
          return old.map(d => d.id === dropId ? { ...d, sparks: filterSparks(d.sparks) } : d);
        }

        // 3. Discover Data Object
        if (old.featured !== undefined || old.allPublic !== undefined) {
          const update = (d: any) => {
            if (!d || d.id !== dropId) return d;
            if ('sparkCount' in d && typeof d.sparkCount === 'number') {
              return {
                ...d,
                sparkCount: Math.max(0, d.sparkCount - 1),
                sparkedByViewer: false,
              };
            }
            return { ...d, sparks: filterSparks(d.sparks) };
          };
          return {
            ...old,
            featured: update(old.featured),
            recentChiefsDrops: old.recentChiefsDrops?.map(update),
            allPublic: old.allPublic ? {
              ...old.allPublic,
              data: old.allPublic.data?.map(update)
            } : old.allPublic
          };
        }

        return old;
      });

      return { previousQueries };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drops'] });
    },
    onError: (err: any, _, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      const rawMsg = err.response?.data?.message || 'FAILED TO UNSPARK DROP';
      const msg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
      toast.error(String(msg).toUpperCase());
    },
  });
}


