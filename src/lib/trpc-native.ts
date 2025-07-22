import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@velox/api';
import Constants from 'expo-constants';

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // 1) EXPO_PUBLIC_API_URL override (prod / emulator)
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  // 2) LAN IP inferred from Expo dev server (e.g., 192.168.x.x:8081)
  const debuggerHost = Constants?.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (debuggerHost) {
    const [host] = debuggerHost.split(':');
    return `http://${host}:3000/api/trpc`;
  }

  // 3) Fallback localhost (web)
  return 'http://localhost:3000/api/trpc';
};

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: getBaseUrl(),
    }),
  ],
});

// Use <TRPCProvider client={trpcClient}> higher in tree if you prefer,
// but QueryClient already lives at root so we'll just use hooks directly 