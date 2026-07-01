import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const root = path.resolve(__dirname, '..');

export default defineConfig({
  plugins: [react()],
  root,
  test: {
    root,
    include: ['web/src/__tests__/**/*.test.{ts,tsx}'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: path.resolve(__dirname, 'coverage'),
      include: ['src/**/*.js', 'web/src/lib/**/*.ts'],
      exclude: ['src/data.js', 'src/fuel.js', '**/*.config.*', '**/node_modules/**'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@sfstlr/resolver': path.resolve(__dirname, '../src/resolver.js'),
      '@sfstlr/blacklist': path.resolve(__dirname, '../src/blacklist.js'),
      '@sfstlr/data': path.resolve(__dirname, '../src/data.js'),
    },
  },
});
