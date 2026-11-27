import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const envDir = resolve(__dirname, '..');

export default defineConfig(({ mode }) => {
  const { PORT = '3000' } = loadEnv(mode, envDir, 'PORT');

  return {
    root: resolve(__dirname),
    envDir,
    plugins: [react()],
    build: { outDir: resolve(__dirname, '../dist/web'), emptyOutDir: true },
    server: {
      port: 5173,
      strictPort: true,
      proxy: { '/api/v1': { target: `http://127.0.0.1:${PORT}` } },
    },
  };
});
