import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';
import { semiPackStyles } from '../../vite.semi.ts';

export default defineConfig({
    pack: {
        // every module is a deep-import target, so all sources are entries
        entry: ['src/**/*.ts', '!**/*.d.ts', '!src/**/__tests__/**'],
        unbundle: true,
        platform: 'browser',
        // keep NODE_ENV for the consumer's bundler; the browser platform would fold it to the build mode
        define: { 'process.env.NODE_ENV': 'process.env.NODE_ENV' },
        outDir: 'dist',
        dts: true,
        plugins: [
            semiPackStyles(fileURLToPath(new URL('src', import.meta.url)), {
                sourceOnly: [
                    '**/rtl.scss',
                    '**/variables.scss',
                    '**/animation.scss',
                    '**/mixin.scss',
                    'base/base.scss',
                    'auto-complete/option.scss',
                    'button/split-button-group.scss',
                    'select/option.scss',
                    'steps/bacis-steps.scss',
                    'steps/fill-steps.scss',
                    'steps/nav-steps.scss',
                    'table/operation-panel.scss',
                    'tooltip/arrow.scss',
                    'tooltip/position.scss',
                    // loaded through semi:theme; its tokens ship compiled in base/tokens.css
                    'theme/**',
                ],
            }),
        ],
    },
});
