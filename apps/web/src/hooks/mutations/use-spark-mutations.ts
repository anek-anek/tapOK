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

        const bumpMineDrop = (d: any) => {
          if (!d || d.id !== dropId) return d;
          const prevCount =
            typeof d.sparkCount === 'number' ? d.sparkCount : (d.sparks?.length ?? 0);
          return {
            ...d,
            sparks: updateSparks(d.sparks),
            sparkCount: prevCount + 1,
            sparkedByViewer: true,
          };
        };

        if (old.id === dropId) {
          return bumpMineDrop(old);
        }

        if (Array.isArray(old)) {
          return old.map(bumpMineDrop);
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
      toast.success('YOU SPARKED THIS DROP');
    },
    onError: (err: any, _, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      const rawMsg = err.response?.data?.message || 'FAILED TO SPARK THIS DROP';
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

        const lowerMineDrop = (d: any) => {
          if (!d || d.id !== dropId) return d;
          const filtered = filterSparks(d.sparks);
          const prevCount =
            typeof d.sparkCount === 'number' ? d.sparkCount : (d.sparks?.length ?? 0);
          return {
            ...d,
            sparks: filtered,
            sparkCount: Math.max(0, prevCount - 1),
            sparkedByViewer: false,
          };
        };

        // 1. Single Drop
        if (old.id === dropId) {
          return lowerMineDrop(old);
        }

        // 2. Array of Drops
        if (Array.isArray(old)) {
          return old.map(lowerMineDrop);
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
      toast.success('YOU UNSPARKED THIS DROP');
    },
    onError: (err: any, _, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      const rawMsg = err.response?.data?.message || 'FAILED TO UNSPARK THIS DROP';
      const msg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
      toast.error(String(msg).toUpperCase());
    },
  });
}


