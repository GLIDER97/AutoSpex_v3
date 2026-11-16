import path from 'path';
import { defineConfig } from 'vitest/config';

// Unit tests for the server functions in api/ (npm test). Separate from
// vite.config.ts so the dev-server plugins don't load.
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
