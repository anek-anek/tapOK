import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

const API_BASE = '/feedback';

export type FeedbackType = 'bug' | 'feature';
export type FeedbackStatus = 'pending' | 'investigating' | 'resolved' | 'rejected';

export interface Feedback {
  id: string;
  title: string;
  description: string;
  type: FeedbackType;
  status: FeedbackStatus;
  score: number;
  creatorId: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    userHandle?: string;
  };
  viewerVote: number;
  createdAt: string;
  updatedAt: string;
}

export function useFeedback(type?: FeedbackType, sortBy?: 'createdAt' | 'score') {
  return useQuery({
    queryKey: ['feedback', type, sortBy],
    queryFn: async () => {
      const { data } = await api.get<Feedback[]>(API_BASE, {
        params: { type, sortBy },
      });
      return data;
    },
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; description: string; type: FeedbackType }) => {
      const { data } = await api.post<Feedback>(API_BASE, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });
}

export function useVoteFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, value }: { id: string; value: number }) => {
      const { data } = await api.post<Feedback>(`${API_BASE}/${id}/vote`, { value });
      return data;
    },
    onMutate: async ({ id, value }) => {
      await queryClient.cancelQueries({ queryKey: ['feedback'] });
      const previous = queryClient.getQueryData<Feedback[]>(['feedback']);
      
      if (previous) {
        queryClient.setQueryData<Feedback[]>(['feedback'], (old) => {
          return old?.map((f) => {
            if (f.id === id) {
              const oldVote = f.viewerVote;
              const newScore = f.score - oldVote + value;
              return { ...f, score: newScore, viewerVote: value };
            }
            return f;
          });
        });
      }

      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['feedback'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });
}

export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FeedbackStatus }) => {
      const { data } = await api.patch<Feedback>(`${API_BASE}/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${API_BASE}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });
}
