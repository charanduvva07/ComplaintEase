import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Manual code-splitting chunks for better caching
        manualChunks: {
          'vendor-react':   ['react', 'react-dom', 'react-router-dom'],
          'vendor-query':   ['@tanstack/react-query'],
          'vendor-framer':  ['framer-motion'],
          'vendor-charts':  ['recharts'],
          'vendor-forms':   ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-socket':  ['socket.io-client'],
          'vendor-ui':      ['lucide-react', 'react-hot-toast'],
        },
      },
    },
    // Target modern browsers for smaller bundle
    target: 'es2020',
    // Warn if any chunk exceeds 800KB
    chunkSizeWarningLimit: 800,
  },

  preview: {
    port: 4173,
  },
});
