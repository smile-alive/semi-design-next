// Shared Vite setup for consuming the Semi packages from source: used by the root Vitest config and the docs site
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type * as sass from 'sass';
import { build, type Alias, type Plugin, type Rolldown } from 'vite-plus';
// Relative source paths: configs must load on a fresh checkout without building
import { compileSemiAiCss, compileSemiCss, compileTailwindTheme } from './packages/semi-scss-compile/src/index.ts';
import { compileSemiScss, semiImporters, type SemiScssOptions } from './packages/semi-theme-shared/src/index.ts';

export const rootDir = fileURLToPath(new URL('.', import.meta.url));
function resolve(p: string) {
    return path.resolve(rootDir, p);
}

const sourceTheme: SemiScssOptions = {
    resolveFoundation: (subpath) => resolve(`packages/semi-foundation/src/${subpath}.scss`),
};
const fatalDeprecations: sass.DeprecationOrId[] = ['import', 'global-builtin'];

// package.json main points at the built lib/, so imports are mapped to source explicitly
const sourcePackages = [
    { name: '@fibrae/semi-ui-vue', dir: 'packages/semi-ui-vue/src', entry: 'index.ts' },
    { name: '@fibrae/semi-ai-vue', dir: 'packages/semi-ai-vue/src', entry: 'index.ts' },
    { name: '@fibrae/semi-ui-react', dir: 'packages/semi-ui-react/src', entry: 'index.ts' },
    { name: '@fibrae/semi-ai-react', dir: 'packages/semi-ai-react/src', entry: 'index.ts' },
    { name: '@fibrae/semi-ui-solid', dir: 'packages/semi-ui-solid/src', entry: 'index.ts' },
    { name: '@fibrae/semi-ai-solid', dir: 'packages/semi-ai-solid/src', entry: 'index.ts' },
    { name: '@fibrae/semi-foundation', dir: 'packages/semi-foundation/src' },
    { name: '@fibrae/semi-ai-foundation', dir: 'packages/semi-ai-foundation/src' },
];

export const semiSourceAliases: Alias[] = [
    ...sourcePackages.flatMap(({ name, dir, entry }) => [...(entry ? [{ find: new RegExp(`^${name}/?$`), replacement: resolve(`${dir}/${entry}`) }] : []), { find: new RegExp(`^${name}/`), replacement: `${resolve(dir)}/` }]),
    { find: '@fibrae/semi-illustrations-react', replacement: resolve('packages/semi-illustrations-react/src') },
    { find: '@fibrae/semi-illustrations-vue', replacement: resolve('packages/semi-illustrations-vue/src') },
    { find: '@fibrae/semi-illustrations-solid', replacement: resolve('packages/semi-illustrations-solid/src') },
    { find: '@fibrae/semi-icons-core', replacement: resolve('packages/semi-icons-core/src') },
    { find: '@fibrae/semi-icons-react', replacement: resolve('packages/semi-icons-react/src') },
    { find: '@fibrae/semi-icons-vue', replacement: resolve('packages/semi-icons-vue/src') },
    { find: '@fibrae/semi-icons-solid', replacement: resolve('packages/semi-icons-solid/src') },
    { find: '@fibrae/semi-json-viewer-core', replacement: resolve('packages/semi-json-viewer-core/src') },
];

// semi-json-viewer-core starts its worker from a blob URL, so the worker is bundled and inlined as a string
let jsonWorker: Promise<string> | undefined;
function buildJsonWorker() {
    jsonWorker ??= build({
        configFile: false,
        logLevel: 'silent',
        build: {
            write: false,
            minify: true,
            target: 'esnext',
            lib: {
                entry: resolve('packages/semi-json-viewer-core/src/worker/json.worker.ts'),
                formats: ['iife'],
                name: 'semiJsonWorker',
            },
        },
    }).then((result) => {
        const [{ output }] = result as Rolldown.RolldownOutput[];
        return output[0].code;
    });
    return jsonWorker;
}

export const semiInlineJsonWorker: Plugin = {
    name: 'semi:inline-json-worker',
    async transform(code, id) {
        if (!id.endsWith('jsonWorkerManager.ts')) {
            return null;
        }
        const worker = JSON.stringify(await buildJsonWorker());
        // Either quote (the TS transform may normalize it); a function replacement avoids `$` expansion in the worker
        return code.replace(/(['"])%WORKER_RAW%\1/, () => worker);
    },
};

interface SemiPackStylesOptions {
    // Globs relative to srcDir, neither shipped nor compiled
    ignore?: string[];
    // Globs shipped as SCSS only (modules other stylesheets load)
    sourceOnly?: string[];
    // Whole-package stylesheets written to the output root, by file name
    bundles?: Record<string, () => string>;
}

const foundationSrc = resolve('packages/semi-foundation/src');

export const semiUiBundles = {
    'styles.css': () => compileSemiCss({ foundationPath: foundationSrc, iconPath: resolve('packages/semi-icons-core/src'), isMin: true }),
    'tailwind.css': () => compileTailwindTheme({ foundationPath: foundationSrc }),
};

// Loaded after the UI package's styles.css, which carries the tokens
export const semiAiBundles = {
    'styles.css': () => compileSemiAiCss({ foundationPath: foundationSrc, aiFoundationPath: resolve('packages/semi-ai-foundation/src'), isMin: true }),
};

// plugin-vue splits each SFC into a `<name>.vue?vue&type=script&setup=true&lang` virtual module, which would otherwise be
// written as `<name>.vue_vue_type_script_setup_true_lang.js`. Substring checks for `.vue` (Nuxt's default inlineStyles filter
// is one) would match that plain JS module, so the file is named `<name>.script.js` and only real SFCs carry `.vue`
// Rolldown may hand over the id raw (`.vue?vue&type=...`) or already sanitized (`.vue_vue_type_...`)
export const semiVueEntryFileNames = (chunk: { name: string }) => `${chunk.name.replace(/\.vue(?:\?|_vue_type_).*$/, '.script')}.js`;

// The Vue packages' tsconfig keeps `jsx: preserve`: vue-tsc checks Vue's slot children only under it. The pack therefore
// reads no tsconfig, and its JSX transform is stated here in full; JSX is the only transform option the tsconfig sets.
export const semiVueInputOptions = { tsconfig: false, transform: { jsx: { runtime: 'automatic', importSource: 'vue' } } } as const;

// Style imports in the sources name SCSS; the published files import the compiled CSS next to them
export const semiScssToCss: Plugin = {
    name: 'semi:scss-to-css',
    resolveId(source) {
        return source.endsWith('.scss') ? { id: source.replace(/\.scss$/, '.css'), external: true } : null;
    },
    renderChunk(code, chunk) {
        // TypeScript cannot resolve a stylesheet side-effect import in a declaration file
        if (/\.d\.[cm]?ts$/.test(chunk.fileName)) {
            return code.replace(/^import ['"][^'"]+\.s?css['"];\n?/gm, '');
        }
        // Another package's stylesheet is externalised before resolveId runs
        return code.replace(/^(import ['"][^'"]+)\.scss(['"];)$/gm, '$1.css$2');
    },
};

// For `vp pack` with `unbundle`: CSS ships next to its SCSS source; the Semi plugins swap the import back to .scss
export function semiPackStyles(srcDir: string, { ignore = [], sourceOnly = [], bundles = {} }: SemiPackStylesOptions = {}): Plugin {
    const compile = (file: string) => compileSemiScss(path.join(srcDir, file), { ...sourceTheme, charset: false, fatalDeprecations }).css;
    return {
        ...semiScssToCss,
        name: 'semi:pack-styles',
        generateBundle() {
            for (const file of fs.globSync('**/*.scss', { cwd: srcDir, exclude: ['**/node_modules/**', ...ignore] })) {
                const scss = fs.readFileSync(path.join(srcDir, file), 'utf-8');
                this.emitFile({ type: 'asset', fileName: file, source: scss });
                if (path.basename(file).startsWith('_') || sourceOnly.some((glob) => path.matchesGlob(file, glob))) {
                    continue;
                }
                this.emitFile({
                    type: 'asset',
                    fileName: file.replace(/\.scss$/, '.css'),
                    source: compile(file),
                });
            }
            for (const [fileName, build] of Object.entries(bundles)) {
                this.emitFile({ type: 'asset', fileName, source: build() });
            }
        },
    };
}

// The locale packs live in semi-foundation; each UI package republishes them as one-line re-exports so an app can
// import `@fibrae/semi-ui-<framework>/locale/source/<name>` without installing foundation itself. Solid needs a `.jsx`
// twin because its `./*` export resolves to `.jsx` under the `solid` condition.
export function semiLocaleReexports({ jsx = false }: { jsx?: boolean } = {}): Plugin {
    const sourceDir = resolve('packages/semi-foundation/src/locale/source');
    return {
        name: 'semi:locale-reexports',
        generateBundle() {
            const extensions = jsx ? ['.js', '.jsx', '.d.ts'] : ['.js', '.d.ts'];
            for (const file of fs.globSync('*.ts', { cwd: sourceDir })) {
                const name = path.basename(file, '.ts');
                const source = `export { default } from '@fibrae/semi-foundation/locale/source/${name}';\n`;
                for (const extension of extensions) {
                    this.emitFile({ type: 'asset', fileName: `locale/source/${name}${extension}`, source });
                }
            }
        },
    };
}

export const semiScssOptions = { importers: semiImporters(sourceTheme), fatalDeprecations };

// Unit tests assert DOM only and component SCSS needs the theme pipeline, so style imports become empty
export const semiStubStyles: Plugin = {
    name: 'semi:stub-styles',
    enforce: 'pre',
    resolveId(source) {
        return /\.(css|scss)$/.test(source) ? '\0semi-style-stub' : null;
    },
    load(id) {
        return id === '\0semi-style-stub' ? 'export default {};' : null;
    },
};

const themedPackages = ['semi-foundation', 'semi-ai-foundation', 'semi-icons-core'].map((name) => resolve(`packages/${name}`) + path.sep);

// A module-system stylesheet cannot be wrapped before compiling, so the `semi` layer is applied on the CSS
export const semiCssLayer = {
    postcssPlugin: 'semi-css-layer',
    Once(root: any, { AtRule }: any) {
        const from = root.source?.input.file ?? '';
        if (!themedPackages.some((dir) => from.startsWith(dir))) {
            return;
        }
        const layer = new AtRule({ name: 'layer', params: 'semi' });
        root.each((node: any) => {
            if (!(node.type === 'atrule' && node.name === 'charset')) {
                layer.append(node);
            }
        });
        root.append(layer);
    },
};
