import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';
import { semiPackStyles } from '../../vite.semi.ts';

export default defineConfig({
    pack: {
        entry: ['index.ts'],
        unbundle: true,
        platform: 'browser',
        outDir: 'dist',
        dts: true,
        plugins: [semiPackStyles(fileURLToPath(new URL('./src', import.meta.url)))],
    },
});
