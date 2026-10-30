// Type-checks the projects in parallel, one per CPU, and prints each project's output as a block once it finishes
import { spawn, spawnSync } from 'node:child_process';
import { globSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { frameworks } from '../lint/index.ts';

const configs = ['tsconfig.node.json', ...globSync('packages/*/tsconfig.json').toSorted(), ...globSync('website/tsconfig*.json').toSorted(), ...globSync('vitest/tsconfig*.json').toSorted(), ...globSync('vitest/*/tsconfig*.json').toSorted()];
const failed: string[] = [];
// A vitest config missing from the root references is not type-checked by the editor or by `tsc -b`
const referenced = new Set<string>(ts.readConfigFile('tsconfig.json', (file) => ts.sys.readFile(file)).config.references.map((reference: { path: string }) => path.normalize(reference.path)));
for (const config of globSync('vitest/**/tsconfig*.json')) {
    if (referenced.has(config)) continue;
    console.error(`${config} is missing from tsconfig.json references`);
    failed.push(config);
}
// website/tsconfig.json includes Astro's generated .astro/types.d.ts, which a fresh checkout does not have yet
const sync = spawnSync('pnpm', ['exec', 'astro', 'sync'], { cwd: 'website', stdio: 'inherit' });
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
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    const status = await new Promise<number | null>((resolve, reject) => {
        child.once('error', reject);
        child.once('close', resolve);
    });
    if (status !== 0) failed.push(config);
    console.log(`${status === 0 ? 'PASS' : 'FAIL'} ${tool} ${config} ${seconds(start)}${output.trim() ? `\n${output.trimEnd()}` : ''}`);
}

const queue = [...configs];
const worker = async () => {
    for (let config = queue.shift(); config; config = queue.shift()) {
        await check(config);
    }
};
await Promise.all(Array.from({ length: Math.min(os.availableParallelism(), queue.length) }, worker));

console.log(`\n${configs.length - failed.length} PASS, ${failed.length} FAIL in ${seconds(started)}`);
if (failed.length) {
    console.error(failed.map((config) => `FAIL ${config}`).join('\n'));
    process.exit(1);
}
