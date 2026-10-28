import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite-plus';
import { semiAiBundles, semiPackStyles, semiVueEntryFileNames, semiVueInputOptions } from '../../vite.semi.ts';

const notShipped = ['**/__tests__/**'];

export default defineConfig({
    pack: {
        // Components are deep-import targets, so every source is an entry
        entry: ['src/**/*.{ts,tsx,vue}', '!**/*.d.ts', ...notShipped.map((glob) => `!src/${glob}`)],
        unbundle: true,
        platform: 'browser',
        // The browser platform folds NODE_ENV to the build mode; dev-only checks must follow the consumer's bundler
        define: { 'process.env.NODE_ENV': 'process.env.NODE_ENV' },
        inputOptions: semiVueInputOptions,
        outputOptions: { entryFileNames: semiVueEntryFileNames },
        outDir: 'dist',
        dts: { vue: true },
        // tsdown never calls configResolved, so production mode must be explicit. Comments are dropped because a comment
        // beside the root element makes a Fragment root, and the production runtime discards fallthrough attrs on those.
        plugins: [vue({ isProduction: true, template: { compilerOptions: { comments: false } } }), semiPackStyles(fileURLToPath(new URL('src', import.meta.url)), { ignore: notShipped, bundles: semiAiBundles })],
    },
});
