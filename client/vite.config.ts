import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function getBackendPort(): string {
  try {
    const envPath = path.resolve(__dirname, '../server/.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(/^PORT\s*=\s*(\d+)/m);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch (e) {}
  return process.env.PORT || '5006';
}

const backendPort = getBackendPort();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __BACKEND_PORT__: JSON.stringify(backendPort),
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
});
