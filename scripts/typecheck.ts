// Type-checks each project in turn and prints which one is running, so a long run shows its progress
import { spawnSync } from 'node:child_process';
import { globSync } from 'node:fs';
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

for (const [index, config] of configs.entries()) {
    // a framework whose files plain tsc cannot resolve declares its own checker
    const tool = frameworks.find((framework) => framework.files.some((glob) => path.matchesGlob(config, glob)))?.typecheck ?? 'tsc';
    console.log(`[${index + 1}/${configs.length}] ${tool} -p ${config}`);
    const start = performance.now();
    const { status, error } = spawnSync(tool, ['-p', config, '--noEmit'], { stdio: 'inherit' });
    if (error) throw error;
    if (status !== 0) failed.push(config);
    console.log(`${status === 0 ? 'PASS' : 'FAIL'} ${config} ${seconds(start)}`);
}

console.log(`\n${configs.length - failed.length} PASS, ${failed.length} FAIL in ${seconds(started)}`);
if (failed.length) {
    console.error(failed.map((config) => `FAIL ${config}`).join('\n'));
    process.exit(1);
}
