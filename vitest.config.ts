import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: `${root}src/$1` },
      { find: "server-only", replacement: `${root}src/test/server-only.ts` },
    ],
  },
  test: {
    environment: "node",
    restoreMocks: true,
  },
});
