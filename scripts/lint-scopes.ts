// Shows each linted file's framework under the lint naming rule and fails when the lint scopes drift.
// Usage: node scripts/lint-scopes.ts [file...]   (without files it prints a file count per area and framework)
// Output: framework per file, or the area table, then one drift message per line on stderr, exit code 1 on any drift.
// Drift: a file claimed by two frameworks, a `packages` list differing from the claimed directories, a glob matching
// no file, or an override or exemption reaching a file of another framework or of none.
import fs from 'node:fs';
import path from 'node:path';
import { countBy } from 'es-toolkit';
import { baseLint, baseOverrides } from '../lint/base.ts';
import { exemptions } from '../lint/exemptions.ts';
import { frameworks } from '../lint/index.ts';
import { gitFiles } from './lib/git-files.ts';
import { root } from './lib/paths.ts';

const COMMON = 'common';

// What oxlint lints: parsed extensions minus .gitignore and the config's ignorePatterns
const files = gitFiles()
    .filter((file) => /\.(?:[cm]?[jt]s|[jt]sx|vue|svelte|astro)$/.test(file))
    .filter((file) => !baseLint.ignorePatterns.some((glob) => path.matchesGlob(file, glob)));

const matched = new Map<string, Set<string>>();
const filesOf = (glob: string) => matched.getOrInsertComputed(glob, () => new Set(files.filter((file) => path.matchesGlob(file, glob))));

const ownersOf = (file: string) => frameworks.filter((framework) => framework.files.some((glob) => filesOf(glob).has(file))).map((framework) => framework.name);

const scopeOf = (file: string) => ownersOf(file)[0] ?? COMMON;

// path.matchesGlob skips dot segments for `*` and `**` but oxlint does not, so the scope would be wrong
const inDotDirectory = (file: string) =>
    file
        .split('/')
        .slice(0, -1)
        .some((dir) => dir.startsWith('.'));

const checkOwnership = () =>
    files.flatMap((file) => {
        const owners = ownersOf(file);
        const problems: string[] = [];
        if (owners.length > 1) problems.push(`${file} belongs to ${owners.join(' and ')}`);
        if (inDotDirectory(file)) problems.push(`${file} sits in a dot directory this script cannot classify`);
        return problems;
    });

function checkPackageLists() {
    const packageDirs = fs
        .readdirSync(path.join(root, 'packages'), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    return frameworks.flatMap((framework) => {
        const named = packageDirs.filter((dir) => framework.files.some((glob) => path.matchesGlob(`packages/${dir}/index.ts`, glob)));
        return named.toSorted().join() === framework.packages.toSorted().join() ? [] : [`${framework.name} lists packages ${framework.packages.join(', ')}; its naming claims ${named.join(', ')}`];
    });
}

// Only hand-written globs: the naming rule's globs and the boundaries derived from it may match nothing yet
function checkUnmatchedGlobs() {
    const namingGlobs = new Set(frameworks.flatMap((framework) => framework.files));
    const written = [...baseOverrides, ...exemptions, ...frameworks.flatMap((framework) => [...framework.overrides, ...framework.exemptions])];
    return written
        .flatMap((entry) => entry.files)
        .filter((glob) => !namingGlobs.has(glob) && filesOf(glob).size === 0)
        .map((glob) => `${glob} matches no file`);
}

const checkFrameworkReach = () =>
    frameworks.flatMap((framework) => [...framework.overrides, ...framework.exemptions].flatMap((entry) => entry.files).flatMap((glob) => [...filesOf(glob)].filter((file) => !ownersOf(file).includes(framework.name)).map((file) => `${framework.name} glob ${glob} reaches ${file}, a ${scopeOf(file)} file`)));

const checkCommonExemptions = () => exemptions.flatMap((entry) => entry.files).flatMap((glob) => [...filesOf(glob)].filter((file) => ownersOf(file).length).map((file) => `lint/exemptions.ts glob ${glob} reaches ${file}, a ${scopeOf(file)} file`));

// lint-private reads these keys by path; a key outside its framework never matches and exempts nothing
const checkIconOnClickKeys = () =>
    frameworks.flatMap((framework) =>
        Object.keys(framework.iconOnClickExemptions ?? {})
            .filter((file) => !ownersOf(file).includes(framework.name))
            .map((file) => `${framework.name} iconOnClickExemptions key ${file} is not a ${framework.name} file`)
    );

function printFileScopes(args: string[]) {
    const linted = new Set(files);
    for (const arg of args) {
        const file = path.relative(root, path.resolve(arg));
        console.log(`${linted.has(file) ? scopeOf(file) : 'not linted'}\t${file}`);
    }
}

function areaOf(file: string) {
    const parts = file.split('/');
    if (parts.length === 1) return '(root)';
    return parts.length > 2 && ['packages', 'website'].includes(parts[0]) ? `${parts[0]}/${parts[1]}` : parts[0];
}

function printAreaCounts() {
    const scopes = [...frameworks.map((framework) => framework.name), COMMON];
    console.log(['area'.padEnd(32), ...scopes.map((scope) => scope.padStart(7))].join(''));
    for (const [area, areaFiles] of [...Map.groupBy(files, areaOf)].toSorted(([a], [b]) => a.localeCompare(b))) {
        const counts = countBy(areaFiles, scopeOf);
        console.log([area.padEnd(32), ...scopes.map((scope) => String(counts[scope] ?? '').padStart(7))].join(''));
    }
}

const errors = new Set([...checkOwnership(), ...checkPackageLists(), ...checkUnmatchedGlobs(), ...checkFrameworkReach(), ...checkCommonExemptions(), ...checkIconOnClickKeys()]);

const args = process.argv.slice(2);
if (args.length) printFileScopes(args);
else printAreaCounts();

for (const error of errors) console.error(error);
if (errors.size) process.exit(1);
