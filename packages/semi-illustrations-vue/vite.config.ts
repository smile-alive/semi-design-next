import { defineConfig } from 'vite-plus';

export default defineConfig({
    pack: { entry: ['src/index.ts'], unbundle: true, platform: 'browser', outDir: 'dist', dts: true },
});
