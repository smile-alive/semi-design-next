// Fails on Sass variables no stylesheet reads and on `var(--semi-*)` tokens no stylesheet declares.
// Usage: node scripts/lint-scss-variables.ts
// Output: the offending `file: $name` or `file: var(--token)` lines on stderr, exit code 1 on any.
// stylelint cannot see unread Sass variables across files, and an undeclared `var(--semi-*)` is valid CSS that fails only at runtime.
import fs from 'node:fs';
import path from 'node:path';
import { root } from './lib/paths.ts';

const stylesheets = ['semi-foundation', 'semi-ai-foundation'].flatMap((name) => {
    const foundation = path.join(root, 'packages/shared', name, 'src');
    return fs.globSync('*/**/*.scss', { cwd: foundation }).map((file) => path.join(foundation, file));
});
const readers = [...stylesheets, ...fs.globSync(path.join(root, 'packages/shared/semi-icons-core/src/styles/*.scss'))];

// Comments do not count as a use; line comments first, as one may contain `/*`
const stripComments = (scss: string) => scss.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
const code = readers.map((file) => stripComments(fs.readFileSync(file, 'utf8')));

const relative = (file: string) => path.relative(root, file);

const unusedVariables = stylesheets
    .filter((file) => /\/(variables|animation)\.scss$/.test(file))
    .flatMap((file) =>
        fs
            .readFileSync(file, 'utf8')
            .matchAll(/^\$([\w-]+)\s*:/gm)
            .map(([, name]) => ({ file, name }))
            .toArray()
    )
    .filter(({ name }) => {
        // Sass treats `-` and `_` in identifiers as the same character
        const reference = new RegExp(`\\$${name.replace(/[-_]/g, '[-_]')}(?![\\w-])(?!\\s*:)`);
        return !code.some((text) => reference.test(text));
    })
    .map(({ file, name }) => `${relative(file)}: $${name}`);

if (unusedVariables.length) {
    console.error(unusedVariables.join('\n'));
    console.error('\nNo stylesheet reads these variables; delete them or use them.');
    process.exit(1);
}

const declaredTokens = new Set(
    code.flatMap((text) =>
        text
            .matchAll(/(--semi-[\w-]+)\s*:/g)
            .map(([, name]) => name)
            .toArray()
    )
);
const undeclaredTokens = new Set(
    readers.flatMap((file, i) =>
        code[i]
            .matchAll(/var\((--semi-[\w-]+)\s*\)/g)
            .map(([, name]) => name)
            .filter((name) => !declaredTokens.has(name))
            .map((name) => `${relative(file)}: var(${name})`)
            .toArray()
    )
);

if (undeclaredTokens.size) {
    console.error([...undeclaredTokens].join('\n'));
    console.error('\nNo stylesheet declares these tokens; fix the name or give the reference a fallback value.');
    process.exit(1);
}
