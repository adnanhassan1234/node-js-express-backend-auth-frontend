import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5170,
    open: true,
    /**
     * Dev proxy: frontend `/api/...` call karta hai aur Vite usay
     * backend (http://localhost:3000) par bhej deta hai.
     * Is se CORS ka koi masla nahi hota.
     */
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
