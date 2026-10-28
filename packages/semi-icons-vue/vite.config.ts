import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite-plus';
import { semiPackStyles } from '../../vite.semi.ts';

export default defineConfig({
    pack: {
        entry: ['src/index.ts', 'src/lab/index.ts', 'src/components/create-icon.ts'],
        unbundle: true,
        platform: 'browser',
        outDir: 'dist',
        dts: { vue: true },
        plugins: [vue({ isProduction: true }), semiPackStyles(fileURLToPath(new URL('./src', import.meta.url)))],
    },
});
