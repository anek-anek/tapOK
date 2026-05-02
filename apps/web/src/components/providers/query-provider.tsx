'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 10 * 60 * 1000,          // Keep cache 10 minutes
            retry: 1,
            refetchOnWindowFocus: false,      // Prevent surprise refetches on alt-tab
            refetchOnReconnect: true,
            refetchIntervalInBackground: false, // Stop polling in background tabs
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}