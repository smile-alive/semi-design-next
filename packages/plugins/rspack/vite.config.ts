import { defineConfig } from 'vite-plus';

export default defineConfig({
    pack: {
        // Loaders are referenced by file path (src/constants.ts); a re-export-only one would fold into its importer
        entry: ['src/index.ts', 'src/loaders/*.ts'],
        unbundle: true,
        dts: { eager: true },
    },
});
