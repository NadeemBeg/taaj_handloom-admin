import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Admin dashboard — dev server on port 3002.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    strictPort: true,
  },
  preview: {
    port: 3002,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts-vendor': ['recharts'],
        },
      },
    },
  },
});
