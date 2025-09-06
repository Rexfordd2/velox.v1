import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "packages/core/**/__tests__/**/*.ts",
      "packages/music-sync/**/__tests__/**/*.ts",
      "packages/ai-analysis/src/utils/__tests__/**/*.ts"
    ],
    environment: "jsdom",
    setupFiles: ["./vitest.phase1.setup.ts"],
  },
}); 