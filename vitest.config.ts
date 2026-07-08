import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
  test: {
    // jsdom is needed for React Testing Library (window/document/etc.)
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'lib/flowchart-engine/**/*.ts',
        'utils/**/*.ts',
        'lib/services/**/*.ts',
        'components/**/*.tsx',
      ],
      exclude: ['**/*.d.ts', '**/index.ts'],
    },
  },
});
