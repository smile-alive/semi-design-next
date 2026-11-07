import { defineConfig } from 'vite-plus';

export default defineConfig({
    pack: {
        entry: ['src/module.ts'],
        dts: true,
    },
});
