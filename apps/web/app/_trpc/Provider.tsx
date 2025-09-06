'use client';

import { useState } from 'react';
import { QueryCache, QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/api/root';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const trpc = createTRPCReact<AppRouter>();

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error: any) => {
          const code = error?.data?.code || error?.shape?.data?.code;
          if (code === 'UNAUTHORIZED' || code === 'FORBIDDEN' || code === 'NOT_FOUND') return false;
          return failureCount < 2;
        },
      },
    },
    queryCache: new QueryCache({
      onError: (error: any) => {
        const message = (error as any)?.data?.message || (error as any)?.message || 'Request failed';
        toast({ title: 'Error', description: message, variant: 'destructive' });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error: any) => {
        const message = (error as any)?.data?.message || (error as any)?.message || 'Request failed';
        toast({ title: 'Error', description: message, variant: 'destructive' });
      },
    }),
  }));
  const [trpcClient] = useState(() => {
    const supabase = getSupabaseBrowserClient();
    
    return trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          async headers() {
            const { data: { session } } = await supabase.auth.getSession();
            return {
              authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
            };
          },
        }),
      ],
    });
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
} 