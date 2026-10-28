import { defineConfig } from 'vite-plus';
import { semiInlineJsonWorker } from '../../vite.semi.ts';

export default defineConfig({
    pack: {
        entry: ['src/index.ts'],
        platform: 'browser',
        target: 'esnext',
        outDir: 'dist',
        dts: true,
        // jsonc-parser's main is a UMD build whose dynamic require('./impl/format') fails under webpack (Next Pages Router); bundling its ESM build keeps consumers off it
        deps: { alwaysBundle: ['jsonc-parser'], onlyBundle: ['jsonc-parser'] },
        plugins: [semiInlineJsonWorker],
    },
});
