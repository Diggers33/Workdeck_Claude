import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 minutes — matches dashboard-api DEFAULT TTL
      gcTime: 10 * 60 * 1000,          // 10 minutes garbage collection
      refetchOnWindowFocus: false,     // don't refetch on tab focus (SWR handles freshness)
      retry: 1,                        // one retry on failure
      refetchOnMount: false,           // trust staleTime instead
    },
  },
});
