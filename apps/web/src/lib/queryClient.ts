import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // paired with WebSocket-driven invalidation — see useLiveInvalidation
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});
