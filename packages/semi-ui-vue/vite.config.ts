import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite-plus';
import { semiLocaleReexports, semiPackStyles, semiUiBundles, semiVueEntryFileNames, semiVueInputOptions } from '../../vite.semi.ts';

const notShipped = ['**/__tests__/**'];

export default defineConfig({
    pack: {
        entry: ['src/**/*.{ts,tsx,vue}', '!**/*.d.ts', ...notShipped.map((glob) => `!src/${glob}`)],
        unbundle: true,
        platform: 'browser',
        define: { 'process.env.NODE_ENV': 'process.env.NODE_ENV' },
        inputOptions: semiVueInputOptions,
        outputOptions: { entryFileNames: semiVueEntryFileNames },
        outDir: 'dist',
        dts: { vue: true },
        // tsdown never calls configResolved, so production mode must be explicit. Comments are dropped because a comment
        // beside the root element makes a Fragment root, and the production runtime discards fallthrough attrs on those.
        plugins: [vue({ isProduction: true, template: { compilerOptions: { comments: false } } }), semiPackStyles(fileURLToPath(new URL('src', import.meta.url)), { ignore: notShipped, bundles: semiUiBundles }), semiLocaleReexports()],
    },
});
