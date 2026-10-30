import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';
import { semiPackStyles } from '../../vite.semi.ts';

export default defineConfig({
    pack: {
        // semi-illustrations-react imports createSvgComponent by deep path, so createIcon needs its own .d.ts
        entry: ['src/index.ts', 'src/lab/index.ts', 'src/components/create-icon.ts'],
        unbundle: true,
        platform: 'browser',
        outDir: 'dist',
        dts: true,
        // rewrites Icon's import of the semi-icons-core stylesheet to the CSS shipped there
        plugins: [semiPackStyles(fileURLToPath(new URL('./src', import.meta.url)))],
    },
});
