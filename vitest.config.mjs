import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["dist/**/*.js"],
      exclude: ["**/node_modules/**", "dist/**/*.mjs"],
    },
  },
});
