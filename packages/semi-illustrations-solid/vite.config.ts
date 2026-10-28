import { defineConfig } from 'vite-plus';
import { semiSolidPack } from '../../vite.semi.solid.ts';

export default defineConfig({
    pack: semiSolidPack({ entry: ['src/index.ts'], unbundle: true, platform: 'browser', outDir: 'dist', dts: true }),
});
