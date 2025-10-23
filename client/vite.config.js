import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // ✅ localhost, bukan 127.0.0.1
        changeOrigin: true,
        secure: false,
        // Log untuk debug
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 Proxying:', req.method, req.url, '→', options.target + req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('❌ Proxy error:', err);
          });
        }
      },
    },
  },
});