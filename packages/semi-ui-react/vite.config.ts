import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';
import { semiUseClient } from '../../vite.semi.react.ts';
import { semiLocaleReexports, semiPackStyles, semiUiBundles } from '../../vite.semi.ts';

const notShipped = ['**/__tests__/**'];

export default defineConfig({
    pack: {
        // components are deep-import targets (e.g. .../locale/locale-provider), so every source is an entry
        entry: ['src/**/*.{ts,tsx}', '!**/*.d.ts', ...notShipped.map((glob) => `!src/${glob}`)],
        unbundle: true,
        platform: 'browser',
        // the browser platform would fold NODE_ENV at build time; dev-only checks must follow the consumer's bundler
        define: { 'process.env.NODE_ENV': 'process.env.NODE_ENV' },
        outDir: 'dist',
        dts: true,
        plugins: [semiPackStyles(fileURLToPath(new URL('src', import.meta.url)), { ignore: notShipped, bundles: semiUiBundles }), semiLocaleReexports(), semiUseClient],
    },
});
