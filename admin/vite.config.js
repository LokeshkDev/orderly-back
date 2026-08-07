import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = (env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
  const proxyTarget = apiBase.startsWith('http') ? apiBase.replace(/\/api$/, '') : null;

  return {
    plugins: [react()],
    server: {
      port: 5174,
      proxy: proxyTarget ? { '/api': proxyTarget } : {}
    }
  };
});
