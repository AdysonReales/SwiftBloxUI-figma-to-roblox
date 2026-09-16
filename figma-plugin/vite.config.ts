import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';

export default defineConfig({
  root: 'src/ui',
  plugins: [viteSingleFile()],
  build: {
    outDir: '../../dist',
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/ui/index.html'),
    },
  },
});