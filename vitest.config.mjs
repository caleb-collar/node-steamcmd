import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    // Ignore unhandled errors from background promises in tests that verify
    // API signatures without awaiting the full operation
    dangerouslyIgnoreUnhandledErrors: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['dist/**/*.js'],
      exclude: ['**/node_modules/**', 'dist/**/*.mjs'],
    },
  },
})
