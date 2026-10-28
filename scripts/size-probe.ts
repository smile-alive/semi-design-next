import { fileURLToPath } from 'node:url';
// Consumer bundle size of single semi-ui-react exports against the built workspace `dist` (run `pnpm build` first):
// each export is built alone with React external, no tarballs.
// Usage: node scripts/size-probe.ts Button Spin
import { gzipSync } from 'node:zlib';
import { build, type Rolldown } from 'vite';

const root = fileURLToPath(new URL('../website', import.meta.url));
const entryId = '\0size-probe-entry';
function kb(bytes: number) {
    return (bytes / 1024).toFixed(1);
}
function measure(texts: string[]) {
    const text = texts.join('');
    return `${kb(Buffer.byteLength(text))} / ${kb(gzipSync(text, { level: 9 }).length)} KB`;
}

for (const name of process.argv.slice(2)) {
    const result = (await build({
        root,
        configFile: false,
        logLevel: 'silent',
        plugins: [
            {
                name: 'size-probe-entry',
                resolveId: (id) => (id === 'size-probe-entry' ? entryId : null),
                load: (id) => (id === entryId ? `export { ${name} } from '@fibrae/semi-ui-react';` : null),
            },
        ],
        build: {
            write: false,
            cssCodeSplit: false,
            rolldownOptions: {
                input: 'size-probe-entry',
                preserveEntrySignatures: 'strict',
                external: (id) => /^react(-dom)?(\/|$)/.test(id),
            },
        },
    })) as Rolldown.RolldownOutput;
    const chunks = result.output.filter((item) => item.type === 'chunk');
    // initial JS: the entry plus its static imports (`imports` also lists the external react, hence the chunk check)
    const initial = new Set([chunks.find((chunk) => chunk.isEntry).fileName]);
    for (const file of initial) {
        for (const dep of chunks.find((chunk) => chunk.fileName === file).imports) {
            if (chunks.some((chunk) => chunk.fileName === dep)) initial.add(dep);
        }
    }
    const pick = (lazy: boolean) => chunks.filter((chunk) => initial.has(chunk.fileName) !== lazy).map((chunk) => chunk.code);
    const css = result.output.filter((item) => item.type === 'asset' && item.fileName.endsWith('.css')).map((item) => String((item as Rolldown.OutputAsset).source));
    console.log(`${name}: JS ${measure(pick(false))} (min / gzip); lazy JS ${measure(pick(true))}; CSS ${measure(css)}`);
}
