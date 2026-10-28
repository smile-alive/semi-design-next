import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';
import { semiPackStyles } from '../../vite.semi.ts';

export default defineConfig({
    pack: {
        entry: ['src/index.ts', 'src/lab/index.ts', 'src/illustrations/index.ts'],
        // one module per icon or illustration, so importing one loads only its data
        unbundle: true,
        platform: 'neutral',
        outDir: 'dist',
        dts: true,
        // Framework-free icon styles, shared by every framework's icon package
        plugins: [
            semiPackStyles(fileURLToPath(new URL('./src', import.meta.url)), {
                sourceOnly: ['styles/variables.scss'],
            }),
        ],
    },
});
