// shortcut: React only, add the other frameworks when a framework-specific regression slips through.
// Consumer bundle size of single semi-ui-react exports against the built workspace `dist` (run `pnpm build` first):
// each export is built alone with React external, no tarballs.
// Usage: node scripts/size.ts            check every runtime export against size-budget.json
//        node scripts/size.ts --update   rewrite size-budget.json from the current sizes
//        node scripts/size.ts Button Spin   print the size breakdown of single exports
import { readFileSync, writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { gzipSync } from 'node:zlib';
import { build, type Rolldown } from 'vite';

const root = fileURLToPath(new URL('../website', import.meta.url));
const budgetFile = fileURLToPath(new URL('../size-budget.json', import.meta.url));
const entryId = '\0size-entry';
// Absorbs gzip and dependency-patch noise; a real regression is far larger.
const tolerance = 0.03;

function gzip(texts: string[]) {
    return gzipSync(texts.join(''), { level: 9 }).length;
}

async function bundle(source: string) {
    const result = (await build({
        root,
        configFile: false,
        logLevel: 'silent',
        plugins: [
            {
                name: 'size-entry',
                resolveId: (id) => (id === 'size-entry' ? entryId : null),
                load: (id) => (id === entryId ? source : null),
            },
        ],
        build: {
            write: false,
            cssCodeSplit: false,
            rolldownOptions: {
                input: 'size-entry',
                preserveEntrySignatures: 'strict',
                external: (id) => /^react(-dom)?(\/|$)/.test(id),
            },
        },
    })) as Rolldown.RolldownOutput;
    return result.output;
}

async function runtimeExports() {
    const output = await bundle(`export * from '@fibrae/semi-ui-react';`);
    return output
        .filter((item) => item.type === 'chunk')
        .find((chunk) => chunk.isEntry)!
        .exports.toSorted();
}

// Sizes in gzip bytes: initial JS (the entry plus its static imports), lazy JS, and CSS.
async function measure(name: string) {
    const output = await bundle(`export { ${name} } from '@fibrae/semi-ui-react';`);
    const chunks = output.filter((item) => item.type === 'chunk');
    // `imports` also lists the external react, hence the chunk check
    const initial = new Set([chunks.find((chunk) => chunk.isEntry)!.fileName]);
    for (const file of initial) {
        for (const dep of chunks.find((chunk) => chunk.fileName === file)!.imports) {
            if (chunks.some((chunk) => chunk.fileName === dep)) initial.add(dep);
        }
    }
    const pick = (lazy: boolean) => chunks.filter((chunk) => initial.has(chunk.fileName) !== lazy).map((chunk) => chunk.code);
    const css = output.filter((item) => item.type === 'asset' && item.fileName.endsWith('.css')).map((item) => String((item as Rolldown.OutputAsset).source));
    return { js: gzip(pick(false)), lazy: gzip(pick(true)), css: gzip(css) };
}

async function mapConcurrent<T, R>(items: T[], run: (item: T) => Promise<R>) {
    const results: R[] = [];
    let next = 0;
    await Promise.all(
        Array.from({ length: availableParallelism() }, async () => {
            while (next < items.length) {
                const index = next++;
                results[index] = await run(items[index]);
            }
        })
    );
    return results;
}

const { values: flags, positionals: names } = parseArgs({ options: { update: { type: 'boolean', default: false } }, allowPositionals: true });

if (names.length) {
    for (const name of names) {
        const size = await measure(name);
        console.log(`${name}: JS ${size.js} B (gzip); lazy JS ${size.lazy} B; CSS ${size.css} B`);
    }
} else {
    const exportNames = await runtimeExports();
    // CSS is part of what an app ships for the export; lazy chunks are not (they load on demand).
    const measured = await mapConcurrent(exportNames, measure);
    const sizes: Record<string, number> = Object.fromEntries(exportNames.map((name, index) => [name, measured[index].js + measured[index].css]));
    if (flags.update) {
        writeFileSync(budgetFile, `${JSON.stringify(sizes, null, 4)}\n`);
        console.log(`size-budget.json: ${exportNames.length} entries`);
    } else {
        const budget: Record<string, number> = JSON.parse(readFileSync(budgetFile, 'utf8'));
        const failures: string[] = [];
        for (const name of exportNames) {
            if (!(name in budget)) failures.push(`${name}: exported but has no budget (run pnpm size --update)`);
            else if (sizes[name] > budget[name] * (1 + tolerance)) {
                failures.push(`${name}: ${sizes[name]} B > budget ${budget[name]} B (+${sizes[name] - budget[name]} B, tolerance ${tolerance * 100}%)`);
            }
        }
        for (const name of Object.keys(budget)) {
            if (!exportNames.includes(name)) failures.push(`${name}: in budget but no longer exported (run pnpm size --update)`);
        }
        if (failures.length) {
            console.error(failures.join('\n'));
            process.exit(1);
        }
        console.log(`size: ${exportNames.length} entries within budget`);
    }
}
