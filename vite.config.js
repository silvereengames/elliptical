import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

import url from 'node:url';

export default defineConfig({
    plugins: [
        vue(),
    ],
    resolve: {
        alias: {
            '@': url.fileURLToPath(new URL('./src', import.meta.url))
        }
    }
});