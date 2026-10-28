// Unread Sass variables are dead code stylelint cannot see across files; an undeclared `var(--semi-*)` without
// fallback is valid CSS, so a typo would only show at runtime.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const stylesheets = ['semi-foundation', 'semi-ai-foundation'].flatMap((name) => {
    const foundation = path.join(root, 'packages', name, 'src');
    return fs.globSync('*/**/*.scss', { cwd: foundation }).map((f) => path.join(foundation, f));
});
const readers = [...stylesheets, ...fs.globSync(path.join(root, 'packages/semi-icons-core/src/styles/*.scss'))];

// Comments do not count as a use; line comments first, as one may contain `/*`
const code = readers.map((file) =>
    fs
        .readFileSync(file, 'utf8')
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
);

const unused: string[] = [];
for (const file of stylesheets.filter((f) => /\/(variables|animation)\.scss$/.test(f))) {
    for (const [, name] of fs.readFileSync(file, 'utf8').matchAll(/^\$([\w-]+)\s*:/gm)) {
        // Sass treats `-` and `_` in identifiers as the same character
        const reference = new RegExp(`\\$${name.replace(/[-_]/g, '[-_]')}(?![\\w-])(?!\\s*:)`);
        if (!code.some((text) => reference.test(text))) {
            unused.push(`${path.relative(root, file)}: $${name}`);
        }
    }
}

if (unused.length) {
    console.error(unused.join('\n'));
    console.error('\nNo stylesheet reads these variables; delete them or use them.');
    process.exit(1);
}

const declaredTokens = new Set(code.flatMap((text) => [...text.matchAll(/(--semi-[\w-]+)\s*:/g)].map(([, name]) => name)));
const undeclared = readers.flatMap((file, i) =>
    [...code[i].matchAll(/var\((--semi-[\w-]+)\s*\)/g)]
        .map(([, name]) => name)
        .filter((name) => !declaredTokens.has(name))
        .map((name) => `${path.relative(root, file)}: var(${name})`)
);
if (undeclared.length) {
    console.error([...new Set(undeclared)].join('\n'));
    console.error('\nNo stylesheet declares these tokens; fix the name or give the reference a fallback value.');
    process.exit(1);
}
