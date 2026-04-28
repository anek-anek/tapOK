import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { CreateDropDto, UpdateDropDto, Drop, DropCrew } from '@/types/drop';
import { dropsService } from '@/services/drops.service';
import { dropKeys } from '@/hooks/queries/use-drops';

export function useApproveJoinRequest(dropId: string): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => dropsService.approveJoinRequest(dropId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dropKeys.crew(dropId) });
      void queryClient.invalidateQueries({ queryKey: dropKeys.detail(dropId) });
    },
  });
}

export function useRejectJoinRequest(dropId: string): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => dropsService.rejectJoinRequest(dropId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dropKeys.crew(dropId) });
      void queryClient.invalidateQueries({ queryKey: dropKeys.detail(dropId) });
    },
  });
}

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
      void queryClient.invalidateQueries({ queryKey: dropKeys.minePrefix() });
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

export function useLeaveDrop(dropId: string): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dropsService.leaveDrop(dropId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: dropKeys.crewMe(dropId) });
      void queryClient.invalidateQueries({ queryKey: dropKeys.detail(dropId) });
    },
  });
}

export function useRemoveCrewMember(dropId: string): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => dropsService.removeCrewMember(dropId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dropKeys.crew(dropId) });
      void queryClient.invalidateQueries({ queryKey: dropKeys.detail(dropId) });
    },
  });
}
