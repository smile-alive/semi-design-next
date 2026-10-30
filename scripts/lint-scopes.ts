// Shows each linted file's framework under lint/framework.ts's naming rule and fails on drift: a file claimed by two
// frameworks, a `packages` list differing from the claimed directories, a glob matching no file, or an override or
// exemption reaching a file of another framework or of none.
// Usage: node scripts/lint-scopes.ts [file...]; without files it prints a count per area.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { baseLint, baseOverrides } from '../lint/base.ts';
import { exemptions } from '../lint/exemptions.ts';
import { frameworks } from '../lint/index.ts';

const root = path.resolve(import.meta.dirname, '..');
const COMMON = 'common';

// What oxlint lints: parsed extensions minus .gitignore and the config's ignorePatterns
const files = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 1 << 28,
})
    .stdout.split('\n')
    // --cached still lists files deleted in the worktree but not yet staged
    .filter((file) => /\.(?:[cm]?[jt]s|[jt]sx|vue|svelte|astro)$/.test(file) && fs.existsSync(path.join(root, file)))
    .filter((file) => !baseLint.ignorePatterns.some((glob) => path.matchesGlob(file, glob)));

const matched = new Map<string, Set<string>>();
function filesOf(glob: string) {
    let set = matched.get(glob);
    if (!set) {
        set = new Set(files.filter((file) => path.matchesGlob(file, glob)));
        matched.set(glob, set);
    }
    return set;
}

function ownersOf(file: string) {
    return frameworks.filter((framework) => framework.files.some((glob) => filesOf(glob).has(file))).map((framework) => framework.name);
}

const errors = new Set<string>();

for (const file of files) {
    const owners = ownersOf(file);
    if (owners.length > 1) errors.add(`${file} belongs to ${owners.join(' and ')}`);
    // path.matchesGlob skips dot segments for `*` and `**` but oxlint does not, so the scope would be wrong
    if (
        file
            .split('/')
            .slice(0, -1)
            .some((dir) => dir.startsWith('.'))
    ) {
        errors.add(`${file} sits in a dot directory this script cannot classify`);
    }
}

const packageDirs = fs
    .readdirSync(path.join(root, 'packages'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
for (const framework of frameworks) {
    const named = packageDirs.filter((dir) => framework.files.some((glob) => path.matchesGlob(`packages/${dir}/index.ts`, glob)));
    if (named.toSorted().join() !== framework.packages.toSorted().join()) {
        errors.add(`${framework.name} lists packages ${framework.packages.join(', ')}; its naming claims ${named.join(', ')}`);
    }
}

// Only hand-written globs: the naming rule's globs and the boundaries derived from it may match nothing yet
const namingGlobs = new Set(frameworks.flatMap((framework) => framework.files));
const written = [...baseOverrides, ...exemptions, ...frameworks.flatMap((framework) => [...framework.overrides, ...framework.exemptions])];
for (const { files: globs } of written) {
    for (const glob of globs) {
        if (!namingGlobs.has(glob) && filesOf(glob).size === 0) errors.add(`${glob} matches no file`);
    }
}

for (const framework of frameworks) {
    for (const { files: globs } of [...framework.overrides, ...framework.exemptions]) {
        for (const glob of globs) {
            for (const file of filesOf(glob)) {
                const owners = ownersOf(file);
                if (!owners.includes(framework.name)) {
                    errors.add(`${framework.name} glob ${glob} reaches ${file}, a ${owners[0] ?? COMMON} file`);
                }
            }
        }
    }
}
for (const { files: globs } of exemptions) {
    for (const glob of globs) {
        for (const file of filesOf(glob)) {
            const owners = ownersOf(file);
            if (owners.length) errors.add(`lint/exemptions.ts glob ${glob} reaches ${file}, a ${owners[0]} file`);
        }
    }
}

// lint-private reads these keys by path; a key outside its framework never matches and exempts nothing
for (const framework of frameworks) {
    for (const file of Object.keys(framework.iconOnClickExemptions ?? {})) {
        if (!ownersOf(file).includes(framework.name)) errors.add(`${framework.name} iconOnClickExemptions key ${file} is not a ${framework.name} file`);
    }
}

const args = process.argv.slice(2);
if (args.length) {
    const linted = new Set(files);
    for (const arg of args) {
        const file = path.relative(root, path.resolve(arg));
        console.log(`${linted.has(file) ? (ownersOf(file)[0] ?? COMMON) : 'not linted'}\t${file}`);
    }
} else {
    const scopes = [...frameworks.map((framework) => framework.name), COMMON];
    const counts = new Map<string, Map<string, number>>();
    for (const file of files) {
        const parts = file.split('/');
        const area = parts.length === 1 ? '(root)' : parts.length > 2 && ['packages', 'website'].includes(parts[0]) ? `${parts[0]}/${parts[1]}` : parts[0];
        const scope = ownersOf(file)[0] ?? COMMON;
        const row = counts.get(area) ?? new Map<string, number>();
        row.set(scope, (row.get(scope) ?? 0) + 1);
        counts.set(area, row);
    }
    console.log(['area'.padEnd(32), ...scopes.map((scope) => scope.padStart(7))].join(''));
    for (const [area, row] of [...counts].toSorted(([a], [b]) => a.localeCompare(b))) {
        console.log([area.padEnd(32), ...scopes.map((scope) => String(row.get(scope) ?? '').padStart(7))].join(''));
    }
}

for (const error of errors) console.error(error);
if (errors.size) process.exit(1);
