import { defineConfig } from 'vite-plus';

export default defineConfig({
    pack: {
        entry: ['src/index.ts', 'src/bin.ts', 'src/core/index.ts'],
        dts: true,
    },
});
