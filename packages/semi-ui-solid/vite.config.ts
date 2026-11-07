import { fileURLToPath } from 'node:url';
import solid from 'unplugin-solid/rolldown';
import { defineConfig } from 'vite-plus';
import { semiSolidPack } from '../../vite.semi.solid.ts';
import { semiLocaleReexports, semiPackStyles, semiUiBundles } from '../../vite.semi.ts';

const notShipped = ['**/__tests__/**'];

export default defineConfig({
    pack: semiSolidPack({
        entry: ['src/**/*.{ts,tsx}', '!**/*.d.ts', ...notShipped.map((glob) => `!src/${glob}`)],
        unbundle: true,
        platform: 'browser',
        define: { 'process.env.NODE_ENV': 'process.env.NODE_ENV' },
        outDir: 'dist',
        dts: true,
        plugins: [solid(), semiPackStyles(fileURLToPath(new URL('src', import.meta.url)), { ignore: notShipped, bundles: semiUiBundles }), semiLocaleReexports({ jsx: true })],
    }),
});
