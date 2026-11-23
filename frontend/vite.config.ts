import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(__dirname),
  envDir: resolve(__dirname, '..'),
  plugins: [react()],
  build: { outDir: resolve(__dirname, '../dist/web'), emptyOutDir: true },
  server: { port: 5173, strictPort: true },
});
