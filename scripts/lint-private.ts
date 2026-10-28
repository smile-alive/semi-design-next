// Project rules that oxlint has no rule for:
// 1. Classes use JS `#` for private members, so the TS `private` keyword is rejected.
// 2. Icons render a non-focusable span, so a bare `onClick` is invisible to jsx-a11y and keyboard users: it needs
//    `role="button"` and `tabIndex`, or belongs on a Button.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import ts from 'typescript';
import { frameworks } from '../lint/index.ts';

const iconOnClickExemptions: Record<string, string | string[]> = Object.assign({}, ...frameworks.map((framework) => framework.iconOnClickExemptions));

let failed = false;

const { status } = spawnSync('git', ['grep', '--untracked', '-nE', '^[[:space:]]*private[[:space:]]', '--', '*.ts', '*.tsx', '*.vue', ':!legacy'], {
    stdio: 'inherit',
});
// git grep exits 1 when nothing matches; anything else is a match (0) or a git error
if (status !== 1) {
    if (status === 0) console.error('Use a `#` private member instead of the TS `private` keyword.');
    failed = true;
}

const files = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', '*.tsx', ':!legacy'], {
    encoding: 'utf8',
})
    .stdout.split('\n')
    // --cached still lists files deleted in the worktree but not yet staged
    .filter((file) => file && fs.existsSync(file));

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
