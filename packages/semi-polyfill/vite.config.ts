import { defineConfig } from 'vite-plus';

export default defineConfig({
    pack: {
        entry: ['src/index.ts', 'src/abort-signal-any.ts', 'src/check-visibility.ts'],
        // keep one module per shim so a single-shim entry does not load the other
        unbundle: true,
        platform: 'browser',
        outDir: 'dist',
        dts: false,
    },
});
