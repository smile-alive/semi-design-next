// Checks what differs from the merge base with release, plus uncommitted and untracked files. CI still runs everything.
// Usage: node scripts/check-changed.ts
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { frameworks } from '../lint/index.ts';

const root = path.resolve(import.meta.dirname, '..');
const scripts: Record<string, string> = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).scripts;

function git(...args: string[]) {
    const { status, stdout, stderr } = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
    if (status !== 0) throw new Error(`git ${args.join(' ')} failed: ${stderr.trim()}`);
    return stdout.split('\n').filter(Boolean);
}

function run(command: string, ...args: string[]) {
    console.log(`\n$ ${command} ${args.join(' ')}`);
    const { status, error } = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
    if (error) throw error;
    if (status !== 0) process.exit(status ?? 1);
}

const [base] = git('merge-base', 'HEAD', 'release');
const changed = [...new Set([...git('diff', '--name-only', '--diff-filter=d', base), ...git('ls-files', '--others', '--exclude-standard')])];

if (!changed.length) {
    console.log(`No changes since ${base}`);
    process.exit(0);
}

const pick = (pattern: RegExp) => changed.filter((file) => pattern.test(file));
const code = pick(/\.(?:[cm]?[jt]s|[jt]sx|vue|svelte|astro)$/);
const styles = pick(/\.(?:scss|css|astro)$/);

run('pnpm', 'run', 'lint:rules');
if (code.length) run('vp', 'lint', '--deny-warnings', '--no-error-on-unmatched-pattern', ...code);
if (styles.length) run('stylelint', '--max-warnings', '0', '--allow-empty-input', ...styles);
if (changed.some((file) => file.startsWith('website/content/'))) run('pnpm', 'run', 'lint:docs');

// A framework's own lint script, when it has one, covers its templates and compiler checks
for (const { name, files } of frameworks) {
    const script = `lint:${name.toLowerCase()}`;
    if (script in scripts && changed.some((file) => files.some((glob) => path.matchesGlob(file, glob)))) run('pnpm', 'run', script);
}

run('vp', 'fmt', '--check', '--no-error-on-unmatched-pattern', ...changed);
// --changed follows each test's imports, so a foundation change also selects the frameworks that use it
run('vp', 'test', 'run', '--silent', '--changed', base, '--project', '!*-browser', '--passWithNoTests');
