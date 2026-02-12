import { defineConfig } from 'vite';

export default defineConfig({
    base: '/snake-pwa/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    }
});
