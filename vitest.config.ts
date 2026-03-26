import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "node-cron": path.resolve(__dirname, "__mocks__/node-cron.ts"),
    },
  },
  test: {
    // ...
  },
});
