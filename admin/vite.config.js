import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = (env.VITE_API_BASE_URL || 'http://127.0.0.1:5001/api').replace(/\/$/, '');
  const proxyTarget = apiBase.startsWith('http') ? apiBase.replace(/\/api$/, '') : 'http://127.0.0.1:5001';

  return {
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
