// Packages the Svelte package in the current directory into dist/: svelte-package ships `.svelte` sources and `.d.ts`,
// then the Semi publish contract is applied on top (Y8): stylesheets are imported as `.css`, tests are not published,
// and the files `vp pack` emits for the other frameworks are written by hand.
// Run from a package root: node ../../scripts/svelte-package.ts [--bundles ui|ai] [--locale]
//   --bundles  whole-package stylesheets of vite.semi.ts (`ui`: styles.css and tailwind.css, `ai`: styles.css)
//   --locale   dist/locale/source/<name> re-exports of the foundation locale packs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { values: options } = parseArgs({ options: { bundles: { type: 'string' }, locale: { type: 'boolean' } } });
const cwd = process.cwd();
const dist = path.join(cwd, 'dist');
const bin = [path.join(cwd, 'node_modules/.bin/svelte-package'), path.resolve(import.meta.dirname, '../node_modules/.bin/svelte-package')].find((file) => fs.existsSync(file));
if (!bin) {
    throw new Error('svelte-package is not installed in this package or at the repository root');
}

// svelte-package never deletes stale output, so a removed component would linger in dist
fs.rmSync(dist, { recursive: true, force: true });
execFileSync(bin, ['-i', 'src', '-o', 'dist'], { cwd, stdio: 'inherit' });

// svelte-package leaves its type-generation scratch output behind, which the formatter and linters would pick up
fs.rmSync(path.join(cwd, '.svelte-kit'), { recursive: true, force: true });

for (const directory of fs.globSync('**/__tests__', { cwd: dist })) {
    fs.rmSync(path.join(dist, directory), { recursive: true, force: true });
}

// tsc skips a declaration it cannot name (an inferred type inlining a dependency's types) without failing the build
const undeclared = fs.globSync('**/*.js', { cwd: dist }).filter((file) => !file.endsWith('.svelte.js') && !fs.existsSync(path.join(dist, file.replace(/\.js$/, '.d.ts'))));
if (undeclared.length) {
    console.error(`svelte-package emitted no declaration for:\n${undeclared.map((file) => `  dist/${file}`).join('\n')}`);
    process.exit(1);
}

// Foundation publishes compiled CSS next to every SCSS file, so the import only needs its extension swapped. Indented:
// in a `.svelte` file the import sits inside `<script>`
const scssImport = /^(\s*import ['"][^'"]+)\.scss(['"];?)$/gm;
// TypeScript cannot resolve a stylesheet side-effect import in a declaration file
const styleImport = /^\s*import ['"][^'"]+\.s?css['"];?\n?/gm;
for (const file of fs.globSync('**/*.{svelte,js,d.ts}', { cwd: dist })) {
    const target = path.join(dist, file);
    const source = fs.readFileSync(target, 'utf-8');
    const output = file.endsWith('.d.ts') ? source.replace(styleImport, '') : source.replace(scssImport, '$1.css$2');
    if (output !== source) {
        fs.writeFileSync(target, output);
    }
}

if (options.bundles) {
    // vite.semi.ts imports the Sass compiler from source with extensionless specifiers, which plain Node cannot load
    const { createJiti } = await import('jiti');
    const { semiAiBundles, semiUiBundles } = await createJiti(import.meta.url).import<typeof import('../vite.semi.ts')>('../vite.semi.ts');
    const bundles = { ui: semiUiBundles, ai: semiAiBundles }[options.bundles];
    if (!bundles) {
        throw new Error(`--bundles takes ui or ai, got ${options.bundles}`);
    }
    for (const [fileName, build] of Object.entries(bundles)) {
        fs.writeFileSync(path.join(dist, fileName), build());
    }
}

// Same files as semiLocaleReexports in vite.semi.ts: an app imports `@fibrae/semi-ui-svelte/locale/source/<name>`
// without installing foundation itself
if (options.locale) {
    const sourceDir = path.resolve(import.meta.dirname, '../packages/semi-foundation/src/locale/source');
    const outDir = path.join(dist, 'locale/source');
    fs.mkdirSync(outDir, { recursive: true });
    for (const file of fs.globSync('*.ts', { cwd: sourceDir })) {
        const name = path.basename(file, '.ts');
        const source = `export { default } from '@fibrae/semi-foundation/locale/source/${name}';\n`;
        for (const extension of ['.js', '.d.ts']) {
            fs.writeFileSync(path.join(outDir, `${name}${extension}`), source);
        }
    }
}
