import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: [
      // Put most specific first
      { find: '@/lib/vision/detectGreenBar', replacement: path.resolve(__dirname, 'tests/mocks/detectGreenBar.ts') },
      { find: '@/lib/trpc', replacement: path.resolve(__dirname, 'tests/mocks/trpc.ts') },
      { find: '@jest/globals', replacement: 'vitest' },
      { find: 'react-native', replacement: path.resolve(__dirname, 'tests/mocks/react-native.ts') },
      { find: 'react-native-svg', replacement: path.resolve(__dirname, 'tests/mocks/react-native.ts') },
      { find: '@/components/ui/avatar', replacement: path.resolve(__dirname, 'tests/mocks/ui-avatar.tsx') },
      { find: '@/components/ui/button', replacement: path.resolve(__dirname, 'tests/mocks/ui-button.tsx') },
      { find: '@/components/ui/card', replacement: path.resolve(__dirname, 'tests/mocks/ui-card.tsx') },
      { find: '@/components/ui/tabs', replacement: path.resolve(__dirname, 'tests/mocks/ui-tabs.tsx') },
      { find: '@/components/ui/input', replacement: path.resolve(__dirname, 'tests/mocks/ui-input.tsx') },
      { find: '@/components/ui/use-toast', replacement: path.resolve(__dirname, 'tests/mocks/ui-use-toast.ts') },
      { find: '@/hooks/useAuth', replacement: path.resolve(__dirname, 'tests/mocks/useAuth.ts') },
      { find: 'expo-haptics', replacement: path.resolve(__dirname, 'tests/mocks/expo-haptics.ts') },
      { find: '@/', replacement: path.resolve(__dirname, 'apps/web/') + '/' },
      { find: '@', replacement: path.resolve(__dirname, 'apps/mobile/src/') },
      { find: '@/lib/supabase-native', replacement: path.resolve(__dirname, 'apps/mobile/src/lib/supabase.ts') },
      { find: 'react-dom/client', replacement: path.resolve(__dirname, 'tests/mocks/react-dom-client.ts') },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      '**/__tests__/**/*.{test,spec}.?(c|m)[jt]s?(x)'
    ],
    exclude: [
      // Keep e2e and Cypress/Jest configs out
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/cypress/**',
      // Mobile e2e or platform-bound tests can be re-enabled later if needed
      'apps/mobile/**/__tests__/**',
    ],
    server: {
      deps: {
        inline: ['react-native', 'react-native-svg', 'expo-modules-core'],
      },
    },
    testTimeout: 20000,
    hookTimeout: 20000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});