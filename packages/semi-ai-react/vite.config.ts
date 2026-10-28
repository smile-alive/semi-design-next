import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';
import { semiUseClient } from '../../vite.semi.react.ts';
import { semiAiBundles, semiPackStyles } from '../../vite.semi.ts';

const notShipped = ['**/__tests__/**'];

export default defineConfig({
    pack: {
        // Components are deep-import targets, so every source is an entry
        entry: ['src/**/*.{ts,tsx}', '!**/*.d.ts', ...notShipped.map((glob) => `!src/${glob}`)],
        unbundle: true,
        platform: 'browser',
        // The browser platform folds NODE_ENV to the build mode; dev-only checks must follow the consumer's bundler
        define: { 'process.env.NODE_ENV': 'process.env.NODE_ENV' },
        outDir: 'dist',
        dts: true,
        plugins: [semiPackStyles(fileURLToPath(new URL('src', import.meta.url)), { ignore: notShipped, bundles: semiAiBundles }), semiUseClient],
    },
});
