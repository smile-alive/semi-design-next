import { defineConfig } from 'vite-plus';

export default defineConfig({
    pack: {
        // Webpack loads each loader by file path, so every source file must stay a separate dist file
        entry: ['src/*.ts'],
        unbundle: true,
        dts: { eager: true },
    },
});
