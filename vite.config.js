import { defineConfig } from 'vite';

// base: './' 保证部署到任意子路径（如 GitHub Pages）时资源路径正确
export default defineConfig({
  base: './',
  server: { port: 5173, host: true },
  build: { outDir: 'dist' }
});
