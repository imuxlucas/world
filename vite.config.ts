import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/world/' : '/',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5178, strictPort: true },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        tadUniversal: 'demos/tad-universal/index.html',
        lipPrompt: 'demos/lip-prompt/index.html',
      },
    },
  },
}));
