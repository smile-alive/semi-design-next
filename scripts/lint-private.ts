// Project rules that oxlint has no rule for:
// 1. Classes use JS `#` for private members, so the TS `private` keyword is rejected.
// 2. Icons render a non-focusable span, so a bare `onClick` is invisible to jsx-a11y and keyboard users: it needs
//    `role="button"` and `tabIndex`, or belongs on a Button.
// 3. Vue .tsx files start with the `@jsxImportSource vue` pragma: the website's plugin-react sets a global React
//    importSource that only the per-file pragma overrides, and no lint sees the runtime import the compiler injects.
// 4. An AI package imports its UI package only by a subpath the UI package publishes, never by its root entry, which
//    would pull in every component.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { frameworks } from '../lint/index.ts';

const iconOnClickExemptions: Record<string, string | string[]> = Object.assign({}, ...frameworks.map((framework) => framework.iconOnClickExemptions));

let failed = false;

const { status } = spawnSync('git', ['grep', '--untracked', '-nE', '^[[:space:]]*private[[:space:]]', '--', '*.ts', '*.tsx', '*.vue', '*.svelte', ':!legacy'], {
    stdio: 'inherit',
});
// git grep exits 1 when nothing matches; anything else is a match (0) or a git error
if (status !== 1) {
    if (status === 0) console.error('Use a `#` private member instead of the TS `private` keyword.');
    failed = true;
}

const listFiles = (...pathspecs: string[]) =>
    spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', ...pathspecs], {
        encoding: 'utf8',
    })
        .stdout.split('\n')
        // --cached still lists files deleted in the worktree but not yet staged
        .filter((file) => file && fs.existsSync(file));

const files = listFiles('*.tsx', ':!legacy');

for (const file of files.filter((name) => /^packages\/semi-[^/]+-vue\//.test(name))) {
    if (fs.readFileSync(file, 'utf8').split('\n', 1)[0] !== '/** @jsxImportSource vue */') {
        console.error(`${file}:1: a Vue .tsx file must start with /** @jsxImportSource vue */`);
        failed = true;
    }
}

const publishedSubpath: Record<string, (subpath: string) => string | undefined> = {
    // A bare SFC subpath does not resolve (no `.vue` in resolve.extensions), and a `.vue` one is published as
    // `.vue.js`, which `./*` does not map
    vue: (subpath) => (subpath.endsWith('.vue') ? undefined : ['.ts', '.tsx'].map((ext) => `${subpath}${ext}`).find((source) => fs.existsSync(path.join('packages/semi-ui-vue/src', source)))),
    // `./*.svelte.js` maps to a rune module `<name>.svelte.ts`, `./*.svelte` to a component, and `./*` to `<name>.ts`
    svelte: (subpath) => {
        const source = subpath.endsWith('.svelte.js') ? `${subpath.slice(0, -3)}.ts` : subpath.endsWith('.svelte') ? subpath : `${subpath}.ts`;
        return fs.existsSync(path.join('packages/semi-ui-svelte/src', source)) ? source : undefined;
    },
};
for (const [framework, resolve] of Object.entries(publishedSubpath)) {
    const specifiers = new RegExp(`['"]@fibrae/semi-ui-${framework}(?:/([^'"]*))?['"]`, 'g');
    for (const file of listFiles(`packages/semi-ai-${framework}/src`).filter((name) => !name.includes('/__tests__/'))) {
        const source = fs.readFileSync(file, 'utf8');
        for (const { 0: specifier, 1: subpath, index } of source.matchAll(specifiers)) {
            if (!subpath || !resolve(subpath)) {
                console.error(`${file}:${source.slice(0, index).split('\n').length}: ${specifier} is not a published subpath of @fibrae/semi-ui-${framework}`);
                failed = true;
            }
        }
    }
}

const iconPackages = new Set(
    frameworks
        .flatMap((framework) => framework.packages)
        .filter((name) => name.startsWith('semi-icons-'))
        .map((name) => `@fibrae/${name}`)
);

for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    if (![...iconPackages].some((name) => source.includes(name))) continue;
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

    // local names of imported Icon* components, so a renamed import (`IconX as Y`) is tracked as Y
    const icons = new Set<string>();
    for (const statement of sourceFile.statements) {
        if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier) && iconPackages.has(statement.moduleSpecifier.text)) {
            const bindings = statement.importClause?.namedBindings;
            if (bindings && ts.isNamedImports(bindings)) {
                for (const { name, propertyName } of bindings.elements) {
                    if ((propertyName ?? name).text.startsWith('Icon')) icons.add(name.text);
                }
            }
        }
    }
    if (!icons.size) continue;

    const visit = (node: ts.Node) => {
        if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && icons.has(node.tagName.getText())) {
            const names = new Set<string>();
            let isButton = false;
            for (const attribute of node.attributes.properties) {
                if (!ts.isJsxAttribute(attribute)) continue;
                const name = attribute.name.getText();
                names.add(name);
                const value = attribute.initializer;
                if (name === 'role' && value && ts.isStringLiteral(value) && value.text === 'button') isButton = true;
            }
            // JSX dialects spell it tabIndex or tabindex
            if (names.has('onClick') && !(isButton && (names.has('tabIndex') || names.has('tabindex'))) && ![iconOnClickExemptions[file]].flat().includes(node.tagName.getText())) {
                const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                console.error(`${file}:${line + 1}: <${node.tagName.getText()}> has onClick but is not keyboard operable; add role="button" and tabIndex, or use a Button.`);
                failed = true;
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);
}

if (failed) process.exit(1);
