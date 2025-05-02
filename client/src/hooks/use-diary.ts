import { useQuery, useMutation } from '@tanstack/react-query';
import { DiaryEntry } from '@shared/schema';
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

export function useDiaryEntry(id: number | undefined) {
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
