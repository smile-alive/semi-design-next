// Packages the Svelte package in the current directory into dist/ with svelte-package, then applies the Semi publish contract.
// Usage: node ../../scripts/svelte-package.ts [--bundles ui|ai]   (run from a package root)
// Output: svelte-package's own output, exit code 1 on a missing svelte-package, a missing declaration or an invalid --bundles
// On top of svelte-package: stylesheets are imported as `.css`, tests are not published, and the files `vp pack` emits
// for the other frameworks are written by hand.
//   --bundles  whole-package stylesheets of vite.semi.ts (`ui`: styles.css and tailwind.css, `ai`: styles.css)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { root } from './lib/paths.ts';

const { values: options } = parseArgs({ options: { bundles: { type: 'string' } } });
const cwd = process.cwd();
const dist = path.join(cwd, 'dist');
const bin = [path.join(cwd, 'node_modules/.bin/svelte-package'), path.join(root, 'node_modules/.bin/svelte-package')].find((file) => fs.existsSync(file));
if (!bin) {
    throw new Error('svelte-package is not installed in this package or at the repository root');
}

const removeDir = (dir: string) => fs.rmSync(dir, { recursive: true, force: true });
const globDist = (pattern: string) => fs.globSync(pattern, { cwd: dist });

// Foundation publishes compiled CSS next to every SCSS file, so the import only needs its extension swapped. Indented:
// in a `.svelte` file the import sits inside `<script>`
const scssImport = /^(\s*import ['"][^'"]+)\.scss(['"];?)$/gm;
// TypeScript cannot resolve a stylesheet side-effect import in a declaration file
const styleImport = /^\s*import ['"][^'"]+\.s?css['"];?\n?/gm;

function rewriteStyleImports() {
    for (const file of globDist('**/*.{svelte,js,d.ts}')) {
        const target = path.join(dist, file);
        const source = fs.readFileSync(target, 'utf-8');
        const output = file.endsWith('.d.ts') ? source.replace(styleImport, '') : source.replace(scssImport, '$1.css$2');
        if (output !== source) {
            fs.writeFileSync(target, output);
        }
    }
}

// tsc skips a declaration it cannot name (an inferred type inlining a dependency's types) without failing the build
function assertDeclarations() {
    const undeclared = globDist('**/*.js').filter((file) => !file.endsWith('.svelte.js') && !fs.existsSync(path.join(dist, file.replace(/\.js$/, '.d.ts'))));
    if (undeclared.length) {
        console.error(`svelte-package emitted no declaration for:\n${undeclared.map((file) => `  dist/${file}`).join('\n')}`);
        process.exit(1);
    }
}

async function writeBundles(name: string) {
    // vite.semi.ts imports the Sass compiler from source with extensionless specifiers, which plain Node cannot load
    const { createJiti } = await import('jiti');
    const { semiAiBundles, semiUiBundles } = await createJiti(import.meta.url).import<typeof import('../vite.semi.ts')>('../vite.semi.ts');
    const bundles = { ui: semiUiBundles, ai: semiAiBundles }[name];
    if (!bundles) {
        throw new Error(`--bundles takes ui or ai, got ${name}`);
    }
    for (const [fileName, build] of Object.entries(bundles)) {
        fs.writeFileSync(path.join(dist, fileName), build());
    }
}

// svelte-package never deletes stale output, so a removed component would linger in dist
removeDir(dist);
execFileSync(bin, ['-i', 'src', '-o', 'dist', '--tsconfig', 'tsconfig.lib.json'], { cwd, stdio: 'inherit' });

// svelte-package leaves its type-generation scratch output behind, which the formatter and linters would pick up
removeDir(path.join(cwd, '.svelte-kit'));

for (const directory of globDist('**/__tests__')) {
    removeDir(path.join(dist, directory));
}

assertDeclarations();
rewriteStyleImports();
if (options.bundles) await writeBundles(options.bundles);
