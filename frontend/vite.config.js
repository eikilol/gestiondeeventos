import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    /* Sin proxy. Las llamadas al backend usan axios contra VITE_API_URL
       (o http://localhost:3000 por defecto). El proxy viejo interceptaba
       rutas del SPA como /eventos/:id y rompía el refresh del navegador. */
  },
  build: {
    /* Separa los vendors pesados en chunks propios para mejor cache
       (cambian poco) y para que el chunk principal no los arrastre. */
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('@supabase'))                 return 'vendor-supabase';
          if (id.includes('@dnd-kit'))                  return 'vendor-dnd';
          if (id.includes('qrcode') || id.includes('html5-qrcode')) return 'vendor-qr';
          if (id.includes('react-router'))              return 'vendor-router';
          if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
          return 'vendor';
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
});
