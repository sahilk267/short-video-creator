import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "node-cron": path.resolve(__dirname, "__mocks__/node-cron.ts"),
    },
  },
  test: {
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "src/**/*.spec.ts",
      "src/**/*.spec.tsx",
    ],
    exclude: [
      "data/**",
      "dist/**",
      "node_modules/**",
    ],
  },
});
