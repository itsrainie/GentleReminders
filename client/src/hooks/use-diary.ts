import { useQuery, useMutation } from '@tanstack/react-query';
import { DiaryEntry, EntryComment } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';

export function useDiaryEntries(limit?: number, offset?: number) {
  return useQuery<DiaryEntry[]>({
    queryKey: ['/api/entries', offset],
    queryFn: async () => {
      const url = limit && offset !== undefined
        ? `/api/entries?limit=${limit}&offset=${offset}`
        : '/api/entries';
      
      return await fetch(url).then(res => res.json());
    }
  });
}

export function useDiaryEntry(id: string | number | undefined) {
  return useQuery<DiaryEntry>({
    queryKey: ['/api/entries', id],
    queryFn: async () => {
      if (!id) throw new Error('Entry ID is required');
      return await fetch(`/api/entries/${id}`).then(res => res.json());
    },
    enabled: !!id
  });
}

export function useSearchDiaryEntries(searchTerm: string) {
  return useQuery<DiaryEntry[]>({
    queryKey: ['/api/search', searchTerm],
    queryFn: async () => {
      return await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`).then(res => res.json());
    },
    enabled: searchTerm.length > 0
  });
}

export function useCreateDiaryEntry() {
  return useMutation({
    mutationFn: async (entryData: Omit<DiaryEntry, 'id' | 'createdAt'>) => {
      const res = await apiRequest('POST', '/api/entries', entryData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
    }
  });
}

// Comment-related hooks
export function useEntryComments(entryId: string | number | undefined) {
  return useQuery<EntryComment[]>({
    queryKey: ['/api/entries', entryId, 'comments'],
    queryFn: async () => {
      if (!entryId) throw new Error('Entry ID is required');
      return await fetch(`/api/entries/${entryId}/comments`).then(res => res.json());
    },
    enabled: !!entryId
  });
}

export function useCreateComment() {
  return useMutation({
    mutationFn: async ({ 
      entryId, 
      comment 
    }: { 
      entryId: string | number, 
      comment: { 
        content: string; 
        authorName: string; 
      } 
    }) => {
      const res = await apiRequest('POST', `/api/entries/${entryId}/comments`, comment);
      return res.json();
    },
    onSuccess: (_, { entryId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/entries', entryId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/entries', entryId] });
      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
    }
  });
}

export function useDeleteComment() {
  return useMutation({
    mutationFn: async ({ 
      commentId, 
      password,
      entryId
    }: { 
      commentId: string | number, 
      password: string,
      entryId: string | number
    }) => {
      const res = await apiRequest('DELETE', `/api/comments/${commentId}`, { password });
      return res.json();
    },
    onSuccess: (_, { entryId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/entries', entryId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/entries', entryId] });
      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
    }
  });
}

// Like entry hook
export function useLikeEntry() {
  return useMutation({
    mutationFn: async (entryId: string | number) => {
      const res = await apiRequest('POST', `/api/entries/${entryId}/like`);
      return res.json();
    },
    onSuccess: (_, entryId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/entries', entryId] });
      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
    }
  });
}
