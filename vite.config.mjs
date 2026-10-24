import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/electrolite/',
  plugins: [react()],
  test: {
    environment: 'node',
    coverage: {
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: ['**/index.{js,jsx,ts,tsx}'],
    },
  },
});
