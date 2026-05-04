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

export function useDeleteDrop(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dropsService.delete(id),
    onSuccess: () => {
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

export function useUpdatePresence(dropId: string): UseMutationResult<void, Error, boolean> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isPresent: boolean) => dropsService.updatePresence(dropId, isPresent),
    onMutate: async (isPresent) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: dropKeys.crewMe(dropId) });
      await queryClient.cancelQueries({ queryKey: dropKeys.crew(dropId) });

      // Snapshot the previous value
      const previousStatus = queryClient.getQueryData<DropCrew>(dropKeys.crewMe(dropId));

      // Optimistically update to the new value
      queryClient.setQueryData(dropKeys.crewMe(dropId), (old: any) =>
        old ? { ...old, isPresent } : old
      );

      // Return a context object with the snapshotted value
      return { previousStatus };
    },
    onError: (_err, _isPresent, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousStatus) {
        queryClient.setQueryData(dropKeys.crewMe(dropId), context.previousStatus);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we're in sync with the server
      void queryClient.invalidateQueries({ queryKey: dropKeys.crewMe(dropId) });
      void queryClient.invalidateQueries({ queryKey: dropKeys.crew(dropId) });
      void queryClient.invalidateQueries({ queryKey: dropKeys.detail(dropId) });
    },
  });
}

export function useUploadCoverPhoto(dropId: string): UseMutationResult<Drop, Error, File> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => dropsService.uploadCoverPhoto(dropId, file),
    onSuccess: (data) => {
      queryClient.setQueryData(dropKeys.detail(dropId), data);
      void queryClient.invalidateQueries({ queryKey: dropKeys.minePrefix() });
    },
  });
}

export function useDeleteCoverPhoto(dropId: string): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dropsService.deleteCoverPhoto(dropId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dropKeys.detail(dropId) });
      void queryClient.invalidateQueries({ queryKey: dropKeys.minePrefix() });
    },
  });
}

export function useUploadPhoto(
  dropId: string,
): UseMutationResult<any, Error, { file: File; width?: number; height?: number }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, width, height }) =>
      dropsService.uploadPhoto(dropId, file, width && height ? { width, height } : undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dropKeys.photos(dropId) });
    },
  });
}

export function useFeaturePhoto(dropId: string): UseMutationResult<any, Error, string> {
  const queryClient = useQueryClient();
  const photoKey = ['drops', dropId, 'photos'];

  return useMutation({
    mutationFn: (photoId: string) => dropsService.featurePhoto(dropId, photoId),
    onMutate: async (photoId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: photoKey });

      // Snapshot the previous value
      const previousPhotos = queryClient.getQueryData<any>(photoKey);

      // Optimistically update to the new value
      if (previousPhotos?.pages) {
        queryClient.setQueryData(photoKey, {
          ...previousPhotos,
          pages: previousPhotos.pages.map((page: any) => ({
            ...page,
            data: page.data.map((p: any) =>
              p.id === photoId ? { ...p, isFeatured: !p.isFeatured } : p
            ),
          })),
        });
      }

      return { previousPhotos };
    },
    onError: (_err, _photoId, context) => {
      // Roll back on error
      if (context?.previousPhotos) {
        queryClient.setQueryData(photoKey, context.previousPhotos);
      }
    },
    onSettled: (_data, _error, photoId) => {
      // Refresh to ensure sync
      void queryClient.invalidateQueries({ queryKey: dropKeys.photos(dropId) });
      void queryClient.invalidateQueries({ queryKey: dropKeys.photoDetail(dropId, photoId) });
      void queryClient.invalidateQueries({ queryKey: dropKeys.detail(dropId) });
    },
  });
}

export function useDeletePhoto(dropId: string): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) => dropsService.deletePhoto(dropId, photoId),
    onSuccess: (_data, photoId) => {
      void queryClient.invalidateQueries({ queryKey: dropKeys.photos(dropId) });
      queryClient.removeQueries({ queryKey: dropKeys.photoDetail(dropId, photoId) });
    },
  });
}
