// Enforces source rules oxlint has no rule for: TS `private`, icon onClick, Vue JSX pragma, AI-to-UI imports, infrastructure entry imports.
// Usage: node scripts/lint-private.ts
// Output: git grep matches on stdout and one `file:line: message` per violation on stderr, exit code 1 on any violation.
// 1. Classes use JS `#` for private members, so the TS `private` keyword is rejected.
// 2. Icons render a non-focusable span, so a bare `onClick` is invisible to jsx-a11y and keyboard users: it needs
//    `role="button"` and `tabIndex`, or belongs on a Button.
// 3. Vue .tsx files start with the `@jsxImportSource vue` pragma: the website's plugin-react sets a global React
//    importSource that only the per-file pragma overrides, and no lint sees the runtime import the compiler injects.
// 4. An AI package imports its UI package only by a subpath the UI package publishes: the root entry pulls in every component.
// 5. Files inside an infrastructure directory never import a directory entry (their own or a sibling's): entries
//    re-export the whole directory, so such an import forms a cycle.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { frameworks } from '../lint/index.ts';
import { lineAt } from './lib/ast.ts';
import { gitFiles } from './lib/git-files.ts';

const iconOnClickExemptions: Record<string, string | string[]> = Object.assign({}, ...frameworks.map((framework) => framework.iconOnClickExemptions));

const isTest = (file: string) => file.includes('/__tests__/');

function tsPrivateFailed() {
    const { status } = spawnSync('git', ['grep', '--untracked', '-nE', '^[[:space:]]*private[[:space:]]', '--', '*.ts', '*.tsx', '*.vue', '*.svelte', ':!legacy'], {
        stdio: 'inherit',
    });
    // git grep exits 1 when nothing matches; anything else is a match (0) or a git error
    if (status === 0) console.error('Use a `#` private member instead of the TS `private` keyword.');
    return status !== 1;
}

const checkVuePragma = (tsxFiles: string[]) =>
    tsxFiles
        .filter((file) => /^packages\/semi-[^/]+-vue\//.test(file))
        .filter((file) => fs.readFileSync(file, 'utf8').split('\n', 1)[0] !== '/** @jsxImportSource vue */')
        .map((file) => `${file}:1: a Vue .tsx file must start with /** @jsxImportSource vue */`);

// Mirrors the UI packages' exports map: entry files and the infrastructure directories sit under src/ as written, every
// other subpath is a component under src/components/
const uiDirs = new Set(['base', 'utils', 'hooks', 'composables', 'primitives', 'internal']);
const uiSource = (framework: string, source: string) => path.join(`packages/semi-ui-${framework}/src`, source.includes('/') && !uiDirs.has(source.split('/')[0]) ? 'components' : '', source);
// Directory entries the exports map lists explicitly
const uiEntries = new Set(['base', 'utils', 'internal']);

const publishedSubpath: Record<string, (subpath: string) => string | undefined> = {
    // A bare SFC subpath does not resolve (no `.vue` in resolve.extensions), and a `.vue` one is published as
    // `.vue.js`, which `./*` does not map
    vue: (subpath) => (uiEntries.has(subpath) ? `${subpath}/index.ts` : subpath.endsWith('.vue') ? undefined : ['.ts', '.tsx'].map((ext) => `${subpath}${ext}`).find((source) => fs.existsSync(uiSource('vue', source)))),
    // `./*.svelte.js` maps to a rune module `<name>.svelte.ts`, `./*.svelte` to a component, and `./*` to `<name>.ts`
    svelte: (subpath) => {
        if (uiEntries.has(subpath)) return `${subpath}/index.ts`;
        const source = subpath.endsWith('.svelte.js') ? `${subpath.slice(0, -3)}.ts` : subpath.endsWith('.svelte') ? subpath : `${subpath}.ts`;
        return fs.existsSync(uiSource('svelte', source)) ? source : undefined;
    },
};

const checkAiSubpaths = () =>
    Object.entries(publishedSubpath).flatMap(([framework, resolve]) => {
        const specifiers = new RegExp(`['"]@fibrae/semi-ui-${framework}(?:/([^'"]*))?['"]`, 'g');
        return gitFiles(`packages/semi-ai-${framework}/src`)
            .filter((file) => !isTest(file))
            .flatMap((file) => {
                const source = fs.readFileSync(file, 'utf8');
                return source
                    .matchAll(specifiers)
                    .filter(({ 1: subpath }) => !subpath || !resolve(subpath))
                    .map(({ 0: specifier, index }) => `${file}:${lineAt(source, index)}: ${specifier} is not a published subpath of @fibrae/semi-ui-${framework}`)
                    .toArray();
            });
    });

const entryImport = /from\s+['"]([^'"]*\/(?:base|utils|hooks|composables|primitives|internal)\/index(?:\.js)?|@fibrae\/semi-[a-z-]+\/(?:base|utils|internal))['"]/g;

const checkInfraEntryImports = () =>
    gitFiles('packages/**/src/base/*', 'packages/**/src/utils/*', 'packages/**/src/hooks/*', 'packages/**/src/composables/*', 'packages/**/src/primitives/*', 'packages/**/src/internal/*', 'packages/**/src/locale/*')
        .filter((file) => /\.(ts|tsx|vue|svelte)$/.test(file) && !isTest(file))
        .flatMap((file) => {
            const source = fs.readFileSync(file, 'utf8');
            return source
                .matchAll(entryImport)
                .map(({ 1: specifier, index }) => `${file}:${lineAt(source, index)}: an infrastructure directory imports the module directly, not the entry ${specifier}`)
                .toArray();
        });

const iconPackages = new Set(
    frameworks
        .flatMap((framework) => framework.packages)
        .filter((name) => name.startsWith('semi-icons-'))
        .map((name) => `@fibrae/${name}`)
);

const importedIcons = (sourceFile: ts.SourceFile) =>
    new Set(
        sourceFile.statements
            .filter(ts.isImportDeclaration)
            .filter((statement) => ts.isStringLiteral(statement.moduleSpecifier) && iconPackages.has(statement.moduleSpecifier.text))
            .flatMap(({ importClause }) => (importClause?.namedBindings && ts.isNamedImports(importClause.namedBindings) ? importClause.namedBindings.elements : []))
            .filter(({ name, propertyName }) => (propertyName ?? name).text.startsWith('Icon'))
            .map(({ name }) => name.text)
    );

function checkIconOnClick(file: string) {
    const source = fs.readFileSync(file, 'utf8');
    if (![...iconPackages].some((name) => source.includes(name))) return [];

    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const icons = importedIcons(sourceFile);
    const errors: string[] = [];

    const visit = (node: ts.Node) => {
        if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && icons.has(node.tagName.getText())) {
            const tag = node.tagName.getText();
            const attributes = node.attributes.properties.filter(ts.isJsxAttribute);
            const names = new Set(attributes.map((attribute) => attribute.name.getText()));
            const isButton = attributes.some((attribute) => attribute.name.getText() === 'role' && attribute.initializer && ts.isStringLiteral(attribute.initializer) && attribute.initializer.text === 'button');
            // JSX dialects spell it tabIndex or tabindex
            const operable = isButton && (names.has('tabIndex') || names.has('tabindex'));
            if (names.has('onClick') && !operable && ![iconOnClickExemptions[file]].flat().includes(tag)) {
                const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                errors.push(`${file}:${line + 1}: <${tag}> has onClick but is not keyboard operable; add role="button" and tabIndex, or use a Button.`);
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return errors;
}

const tsxFiles = gitFiles('*.tsx', ':!legacy');
const privateFailed = tsPrivateFailed();
const errors = [...checkVuePragma(tsxFiles), ...checkAiSubpaths(), ...checkInfraEntryImports(), ...tsxFiles.flatMap(checkIconOnClick)];

for (const error of errors) console.error(error);
if (privateFailed || errors.length) process.exit(1);
