// Checks the consumer bundle size of every runtime export of semi-ui-react against size-budget.json.
// Usage: node scripts/size.ts [--update | <ExportName>...]
// Output: one line per violation or the summary line, exit code 1 on an export over budget, without a budget, or in the budget but no longer exported.
// shortcut: React only, add the other frameworks when a framework-specific regression slips through.
// Each export is built alone against the built workspace `dist` (run `pnpm build` first) with React external.
//   (no argument)        check every runtime export against size-budget.json
//   --update             rewrite size-budget.json from the current sizes
//   Button Spin          print the size breakdown of single exports
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { gzipSync } from 'node:zlib';
import { build, type Rolldown } from 'vite';
import { readJson } from './lib/json.ts';
import { root, website } from './lib/paths.ts';
import { mapConcurrent } from './lib/pool.ts';
import { progress } from './lib/progress.ts';

const budgetFile = path.join(root, 'size-budget.json');
const entryId = '\0size-entry';
// Absorbs gzip and dependency-patch noise; a real regression is far larger
const tolerance = 0.03;

const gzip = (texts: string[]) => gzipSync(texts.join(''), { level: 9 }).length;

async function bundle(entrySource: string) {
    const result = (await build({
        root: website,
        configFile: false,
        logLevel: 'silent',
        plugins: [
            {
                name: 'size-entry',
                resolveId: (id) => (id === 'size-entry' ? entryId : null),
                load: (id) => (id === entryId ? entrySource : null),
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
    const chunkByName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
    const initial = new Set([chunks.find((chunk) => chunk.isEntry)!.fileName]);
    // `imports` also lists the external react, hence the chunkByName check; the Set grows while it is iterated
    for (const file of initial) {
        for (const dep of chunkByName.get(file)!.imports) {
            if (chunkByName.has(dep)) initial.add(dep);
        }
    }
    const codeOf = (lazy: boolean) => chunks.filter((chunk) => initial.has(chunk.fileName) !== lazy).map((chunk) => chunk.code);
    const css = output.filter((item) => item.type === 'asset' && item.fileName.endsWith('.css')).map((item) => String((item as Rolldown.OutputAsset).source));
    return { js: gzip(codeOf(false)), lazy: gzip(codeOf(true)), css: gzip(css) };
}

// CSS is part of what an app ships for the export; lazy chunks are not (they load on demand).
async function measureBudgetSizes(exportNames: string[]) {
    const bar = progress('Measuring exports', exportNames.length);
    const measured = await mapConcurrent(exportNames, bar.track(measure));
    bar.done();
    return Object.fromEntries(exportNames.map((name, index) => [name, measured[index].js + measured[index].css]));
}

function budgetViolations(sizes: Record<string, number>, budget: Record<string, number>) {
    const overBudget = Object.entries(sizes).flatMap(([name, size]) => {
        if (!(name in budget)) return [`${name}: exported but has no budget (run pnpm size --update)`];
        if (size <= budget[name] * (1 + tolerance)) return [];
        return [`${name}: ${size} B > budget ${budget[name]} B (+${size - budget[name]} B, tolerance ${tolerance * 100}%)`];
    });
    const stale = Object.keys(budget)
        .filter((name) => !(name in sizes))
        .map((name) => `${name}: in budget but no longer exported (run pnpm size --update)`);
    return [...overBudget, ...stale];
}

const { values: flags, positionals: names } = parseArgs({ options: { update: { type: 'boolean', default: false } }, allowPositionals: true });

if (names.length) {
    for (const name of names) {
        const size = await measure(name);
        console.log(`${name}: JS ${size.js} B (gzip); lazy JS ${size.lazy} B; CSS ${size.css} B`);
    }
} else {
    const exportNames = await runtimeExports();
    const sizes = await measureBudgetSizes(exportNames);
    if (flags.update) {
        writeFileSync(budgetFile, `${JSON.stringify(sizes, null, 4)}\n`);
        console.log(`size-budget.json: ${exportNames.length} entries`);
    } else {
        const violations = budgetViolations(sizes, readJson(budgetFile));
        if (violations.length) {
            console.error(violations.join('\n'));
            process.exit(1);
        }
        console.log(`size: ${exportNames.length} entries within budget`);
    }
}
