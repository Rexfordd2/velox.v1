import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      lines: 90,
      functions: 90,
      branches: 85,
      exclude: [
        'src/test/**',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/types.ts'
      ]
    }
  }
}); 