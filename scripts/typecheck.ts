// Type-checks every tsconfig project (tsc, or the checker a framework declares), running them in parallel.
// Usage: node scripts/typecheck.ts [source|vitest]
// Output: one PASS/FAIL line per project with its compiler output, then a summary; exit code 1 on a failing project or a vitest tsconfig missing from tsconfig.json references.
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { globSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { frameworks } from '../lint/index.ts';
import { website } from './lib/paths.ts';
import { mapConcurrent } from './lib/pool.ts';
import { progress } from './lib/progress.ts';

const readConfig = (config: string) => ts.readConfigFile(config, (file) => ts.sys.readFile(file)).config;
// a container config (no files, only references) has nothing to check; the projects it lists are matched on their own
const isContainer = (config: string) => readConfig(config).files?.length === 0;
const sorted = (pattern: string) => globSync(pattern).toSorted();

const source = [
    'tsconfig.node.json',
    ...globSync(['packages/*/tsconfig{,.lib}.json', 'packages/*/*/tsconfig.json'])
        .filter((config) => !isContainer(config))
        .toSorted(),
    ...sorted('website/tsconfig*.json'),
];
const vitest = [...sorted('vitest/tsconfig*.json'), ...sorted('vitest/*/tsconfig*.json')];

// CI checks the two parts in parallel jobs; together they cover every config, so a new one cannot fall outside both
const part = process.argv[2];
if (part !== undefined && part !== 'source' && part !== 'vitest') throw new Error(`Unknown part "${part}", expected source or vitest`);
const configs = part === 'source' ? source : part === 'vitest' ? vitest : [...source, ...vitest];

const failed = new Set<string>();

// A vitest config missing from the root references is not type-checked by the editor or by `tsc -b`
if (part !== 'source') {
    const referenced = new Set<string>(readConfig('tsconfig.json').references.map((reference: { path: string }) => path.normalize(reference.path)));
    for (const config of globSync('vitest/**/tsconfig*.json').filter((config) => !referenced.has(config))) {
        console.error(`${config} is missing from tsconfig.json references`);
        failed.add(config);
    }
}

// website/tsconfig.json includes Astro's generated .astro/types.d.ts, which a fresh checkout does not have yet
const sync = spawnSync('pnpm', ['exec', 'astro', 'sync'], { cwd: website, stdio: 'inherit' });
if (sync.error) throw sync.error;
if (sync.status !== 0) process.exit(sync.status ?? 1);

const started = performance.now();
const seconds = (since: number) => `${((performance.now() - since) / 1000).toFixed(1)}s`;

async function check(config: string) {
    // a framework whose files plain tsc cannot resolve declares its own checker
    const tool = frameworks.find((framework) => framework.files.some((glob) => path.matchesGlob(config, glob)))?.typecheck ?? 'tsc';
    // svelte-check takes warnings (template a11y) as failures and has no -p or --noEmit
    const args = tool === 'svelte-check' ? ['--tsconfig', config, '--fail-on-warnings'] : ['-p', config, '--noEmit'];
    const start = performance.now();
    const child = spawn(tool, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    // stdout and stderr share one buffer so the output keeps the order the tool wrote it in
    let output = '';
    const append = (chunk: Buffer) => (output += chunk);
    child.stdout.on('data', append);
    child.stderr.on('data', append);
    const [status] = await once(child, 'close');
    if (status !== 0) failed.add(config);
    return `${status === 0 ? 'PASS' : 'FAIL'} ${tool} ${config} ${seconds(start)}${output.trim() ? `\n${output.trimEnd()}` : ''}`;
}

// Printed after the bar is gone, in config order
const bar = progress('Type-checking', configs.length);
const reports = await mapConcurrent(configs, bar.track(check));
bar.done();
console.log(reports.join('\n'));

const passed = configs.filter((config) => !failed.has(config)).length;
console.log(`\n${passed} PASS, ${failed.size} FAIL in ${seconds(started)}`);
if (failed.size) {
    console.error([...failed].map((config) => `FAIL ${config}`).join('\n'));
    process.exit(1);
}
