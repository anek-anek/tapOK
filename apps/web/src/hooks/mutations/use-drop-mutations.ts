import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { CreateDropDto, UpdateDropDto, Drop, DropCrew } from '@/types/drop';
import { dropsService } from '@/services/drops.service';
import { dropKeys } from '@/hooks/queries/use-drops';

export function useCreateDrop(): UseMutationResult<Drop, Error, CreateDropDto> {
  return useMutation({
    mutationFn: (dto: CreateDropDto) => dropsService.create(dto),
  });
}

export function useUpdateDrop(id: string): UseMutationResult<Drop, Error, UpdateDropDto> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateDropDto) => dropsService.update(id, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dropKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: dropKeys.mine() });
    },
  });
}

export function useJoinDrop(dropId: string): UseMutationResult<DropCrew, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dropsService.joinDrop(dropId),
    onSuccess: (data) => {
      queryClient.setQueryData(dropKeys.crewMe(dropId), data);
      void queryClient.invalidateQueries({ queryKey: dropKeys.detail(dropId) });
    },
  });
}
