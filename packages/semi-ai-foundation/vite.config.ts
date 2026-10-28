import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';
import { semiPackStyles } from '../../vite.semi.ts';

export default defineConfig({
    pack: {
        // Every module is a deep-import target (@fibrae/semi-ai-foundation/<component>/<file>)
        entry: ['src/**/*.ts', '!**/*.d.ts', '!src/**/__tests__/**'],
        unbundle: true,
        platform: 'browser',
        // Keep NODE_ENV for the consumer's bundler; the browser platform would fold it to this build's mode
        define: { 'process.env.NODE_ENV': 'process.env.NODE_ENV' },
        outDir: 'dist',
        dts: true,
        plugins: [
            semiPackStyles(fileURLToPath(new URL('src', import.meta.url)), {
                sourceOnly: ['**/rtl.scss', '**/variables.scss', '**/animation.scss'],
            }),
        ],
    },
});
