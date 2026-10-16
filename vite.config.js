import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages publica este projeto em um subdiretório do domínio.
  base: '/Hospital-Sao-Dridri-MOBILE-APP-AULA-8/',
  // A pasta www também é usada pelo Capacitor para Android.
  build: {
    outDir: 'www',
    emptyOutDir: true
  }
});
