import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';
import { semiPackStyles } from '../../vite.semi.ts';

export default defineConfig({
    pack: {
        // components/create-icon is a public deep path (createSvgComponent), so it needs its own .d.ts
        entry: ['src/index.ts', 'src/lab/index.ts', 'src/illustrations/index.ts', 'src/components/create-icon.ts'],
        unbundle: true,
        platform: 'browser',
        outDir: 'dist',
        dts: true,
        // rewrites Icon's import of the semi-icons-core stylesheet to the CSS shipped there
        plugins: [semiPackStyles(fileURLToPath(new URL('./src', import.meta.url)))],
    },
});
