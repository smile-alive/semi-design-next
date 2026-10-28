import { fileURLToPath } from 'node:url';
import solid from 'unplugin-solid/rolldown';
import { defineConfig } from 'vite-plus';
import { semiSolidPack } from '../../vite.semi.solid.ts';
import { semiPackStyles } from '../../vite.semi.ts';

export default defineConfig({
    pack: semiSolidPack({
        entry: ['src/index.ts', 'src/lab/index.ts', 'src/components/create-icon.tsx'],
        unbundle: true,
        platform: 'browser',
        outDir: 'dist',
        dts: true,
        plugins: [solid(), semiPackStyles(fileURLToPath(new URL('./src', import.meta.url)))],
    }),
});
