// Installs the packed Semi packages into a throwaway Vite + React/Vue app and builds it the way a user would, checking
// the published contract instead of workspace sources: exports maps, the dist/ layout the Semi plugins rewrite, and the
// whole-package stylesheets. Run after `pnpm build`.
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type * as Vite from 'vite';
import type * as SemiVite from '../../packages/semi-vite/src/index.ts';

const rootDir = path.resolve(import.meta.dirname, '../..');
const packages = [
    'semi-ai-react',
    'semi-ai-solid',
    'semi-ai-svelte',
    'semi-ai-vue',
    'semi-ai-foundation',
    'semi-animation',
    'semi-foundation',
    'semi-icons-core',
    'semi-icons-react',
    'semi-icons-solid',
    'semi-icons-svelte',
    'semi-icons-vue',
    'semi-illustrations-react',
    'semi-illustrations-solid',
    'semi-illustrations-svelte',
    'semi-illustrations-vue',
    'semi-json-viewer-core',
    'semi-scss-compile',
    'semi-ui-react',
    'semi-ui-solid',
    'semi-ui-svelte',
    'semi-ui-vue',
    'semi-vite',
];

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'semi-packed-'));
const tarballDir = path.join(workDir, 'tarballs');
const appDir = path.join(workDir, 'app');
function write(file: string, content: string) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
}

for (const dir of packages) {
    execFileSync('pnpm', ['pack', '--pack-destination', tarballDir], {
        cwd: path.join(rootDir, 'packages', dir),
        stdio: ['ignore', 'ignore', 'inherit'],
    });
}
const tarballs = Object.fromEntries(
    fs.readdirSync(tarballDir).map((file) => {
        const name = file.replace(/-\d+\.\d+\.\d+.*\.tgz$/, '').replace(/^fibrae-/, '@fibrae/');
        return [name, `file:${path.join(tarballDir, file)}`];
    })
);

write(
    path.join(appDir, 'package.json'),
    JSON.stringify(
        {
            name: 'semi-packed-probe',
            private: true,
            type: 'module',
            dependencies: {
                ...tarballs,
                '@types/node': '^26.6.4',
                '@types/react': '^19.3.0',
                motion: '^14.0.0',
                react: '^19.3.0',
                'react-dom': '^19.3.0',
                'solid-js': '^1.9.17',
                '@sveltejs/vite-plugin-svelte': '^7.3.1',
                svelte: '^5.57.3',
                'svelte-check': '^4.7.7',
                typescript: '^6.0.3',
                'unplugin-solid': '^2.0.0',
                vite: '^8.0.0',
                'vite-plugin-solid': '^2.11.14',
                vue: '3.5.44',
                'vue-tsc': '3.3.13',
            },
        },
        null,
        4
    )
);
write(
    path.join(appDir, 'pnpm-workspace.yaml'),
    [
        // The tarballs depend on each other by version; point those ranges at the local tarballs too
        'overrides:',
        ...Object.entries(tarballs).map(([name, spec]) => `  '${name}': '${spec}'`),
        'allowBuilds:',
        // sass's optional native watcher; the build does not watch
        "  '@parcel/watcher': false",
        '',
    ].join('\n')
);
write(path.join(appDir, 'src/components.js'), "export { Button } from '@fibrae/semi-ui-react';\n");
write(path.join(appDir, 'src/deep.js'), "export { default as Button } from '@fibrae/semi-ui-react/button/index';\n");
write(path.join(appDir, 'src/tokens-only.js'), "import '@fibrae/semi-ui-react/tokens';\n");
write(path.join(appDir, 'src/tokens-entry.js'), "import '@fibrae/semi-ui-react/tokens';\nexport { Button } from '@fibrae/semi-ui-react';\n");
write(path.join(appDir, 'src/vue-tokens-only.js'), "import '@fibrae/semi-ui-vue/tokens';\n");
write(path.join(appDir, 'src/vue-tokens-entry.js'), "import '@fibrae/semi-ui-vue/tokens';\nexport { default as Button } from '@fibrae/semi-ui-vue/button/index';\n");
write(path.join(appDir, 'src/tokens-lazy.js'), "import '@fibrae/semi-ui-react/tokens';\nimport('@fibrae/semi-ui-react/button/index').then(console.log);\n");
write(path.join(appDir, 'src/vue-tokens-lazy.js'), "import '@fibrae/semi-ui-vue/tokens';\nimport('@fibrae/semi-ui-vue/button/index').then(console.log);\n");
write(path.join(appDir, 'src/deep-ai.js'), "export { default as AIChatInput } from '@fibrae/semi-ai-react/ai-chat-input/index';\n");
write(path.join(appDir, 'src/lab-icons.js'), "export { IconAvatar } from '@fibrae/semi-icons-react/lab';\n");
write(path.join(appDir, 'src/vue-components.js'), "export { BaseFoundation, semiGlobal } from '@fibrae/semi-ui-vue';\nexport { IconHome } from '@fibrae/semi-icons-vue';\n");
write(path.join(appDir, 'src/vue-deep.js'), "export { default as Icon } from '@fibrae/semi-ui-vue/icons/index';\n");
write(path.join(appDir, 'src/vue-deep-ai.js'), "export { default as AIChatInput } from '@fibrae/semi-ai-vue/ai-chat-input/index';\n");
write(path.join(appDir, 'src/vue-lab-icons.js'), "export { IconAvatar } from '@fibrae/semi-icons-vue/lab';\n");
write(path.join(appDir, 'src/vue-full-css.js'), ["import '@fibrae/semi-ui-vue/styles.css';", "import '@fibrae/semi-ai-vue/styles.css';", "export { default as Icon } from '@fibrae/semi-ui-vue/icons/index';", ''].join('\n'));
write(
    path.join(appDir, 'src/vue-ssr.js'),
    [
        "import { createSSRApp, h } from 'vue';",
        "import { renderToString } from 'vue/server-renderer';",
        "import { BaseFoundation, Button } from '@fibrae/semi-ui-vue';",
        "import Icon from '@fibrae/semi-ui-vue/icons/index';",
        "import { IconHome } from '@fibrae/semi-icons-vue';",
        "import { IconAvatar } from '@fibrae/semi-icons-vue/lab';",
        "import { IllustrationSuccess } from '@fibrae/semi-illustrations-vue';",
        'export { BaseFoundation };',
        'export function render() {',
        "    return renderToString(createSSRApp({ render: () => h('main', [",
        "        h(Button, {}, { default: () => 'ssr-button' }),",
        "        h(Icon, {}, { default: () => h('svg', { id: 'ssr-custom' }) }),",
        "        h(IconHome, { 'aria-label': 'home' }), h(IconAvatar), h(IllustrationSuccess),",
        '    ]) }));',
        '}',
        '',
    ].join('\n')
);
write(
    path.join(appDir, 'src/react-ssr.js'),
    [
        "import { createElement } from 'react';",
        "import { renderToString } from 'react-dom/server';",
        "import { Button } from '@fibrae/semi-ui-react';",
        "import { AIChatInput } from '@fibrae/semi-ai-react';",
        "import { IconHome } from '@fibrae/semi-icons-react';",
        'export function render() {',
        "    return renderToString(createElement('main', null, createElement(Button, null, 'ssr-button'), createElement(IconHome, { 'aria-label': 'home' }), createElement(AIChatInput)));",
        '}',
        '',
    ].join('\n')
);
write(
    path.join(appDir, 'src/animation.js'),
    [
        "import '@fibrae/semi-animation/styles/viewTransition.css';",
        "import { animate } from 'motion';",
        "import { easings, springs } from '@fibrae/semi-animation';",
        'export const fade = (el) => animate(el, { opacity: [0, 1] }, { ease: easings.easeInOutCubic });',
        'export const pop = (el) => animate(el, { scale: [0.9, 1] }, springs.gentle);',
        '',
    ].join('\n')
);
write(path.join(appDir, 'src/full-css.js'), ["import '@fibrae/semi-ui-react/styles.css';", "import '@fibrae/semi-ai-react/styles.css';", "export { Button } from '@fibrae/semi-ui-react';", "export { AIChatInput } from '@fibrae/semi-ai-react';", ''].join('\n'));
// A strict consumer that checks declaration files too (skipLibCheck off), resolving through the exports maps
write(
    path.join(appDir, 'tsconfig.json'),
    JSON.stringify(
        {
            compilerOptions: {
                strict: true,
                skipLibCheck: false,
                module: 'esnext',
                moduleResolution: 'bundler',
                target: 'esnext',
                jsx: 'react-jsx',
                noEmit: true,
                // vite's declarations (semi-vite-plugin's option types) name Node globals
                types: ['node', 'react'],
            },
            include: ['src/types-probe.ts'],
        },
        null,
        4
    )
);
write(
    path.join(appDir, 'src/types-probe.ts'),
    [
        "import type * as Ui from '@fibrae/semi-ui-react';",
        "import type * as Ai from '@fibrae/semi-ai-react';",
        "import type { ButtonProps } from '@fibrae/semi-ui-react/button/index';",
        "import type { ColumnProps } from '@fibrae/semi-ui-react/table/interface';",
        "import type { useForm } from '@fibrae/semi-ui-react/form/hooks/index';",
        "import type * as Foundation from '@fibrae/semi-foundation/transfer/foundation';",
        "import type * as TableFoundation from '@fibrae/semi-foundation/table/foundation';",
        "import type * as EnUS from '@fibrae/semi-foundation/locale/source/en_US';",
        "import type * as ReactEnUS from '@fibrae/semi-ui-react/locale/source/en_US';",
        "import type * as VueEnUS from '@fibrae/semi-ui-vue/locale/source/en_US';",
        "import type * as ChatFoundation from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';",
        "import type * as Icons from '@fibrae/semi-icons-react';",
        "import type * as LabIcons from '@fibrae/semi-icons-react/lab';",
        "import type * as IconData from '@fibrae/semi-icons-core';",
        "import type * as Illustrations from '@fibrae/semi-illustrations-react';",
        "import type * as Animation from '@fibrae/semi-animation';",
        "import type * as SemiVite from '@fibrae/semi-vite-plugin';",
        "import '@fibrae/semi-ui-react/tokens';",
        'export type Probe = [',
        '    typeof Ui,',
        '    typeof Ai,',
        '    typeof Foundation,',
        '    typeof TableFoundation,',
        '    typeof EnUS,',
        '    typeof ReactEnUS,',
        '    typeof VueEnUS,',
        '    typeof ChatFoundation,',
        '    typeof Icons,',
        '    typeof LabIcons,',
        '    typeof IconData,',
        '    typeof Illustrations,',
        '    typeof Animation,',
        '    typeof SemiVite,',
        '];',
        'export const button: ButtonProps = {};',
        'export const column: ColumnProps<{ a: number }> = { dataIndex: "a", render: (_text, record) => record.a };',
        'export type FormApi = ReturnType<typeof useForm>;',
        '',
    ].join('\n')
);
execFileSync('pnpm', ['install'], { cwd: appDir, stdio: ['ignore', 'ignore', 'inherit'] });
// A failing tsc throws, so declaration errors in the published packages fail the run
execFileSync(process.execPath, [path.join(appDir, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json'], {
    cwd: appDir,
    stdio: 'inherit',
});
write(
    path.join(appDir, 'tsconfig.vue.json'),
    JSON.stringify(
        {
            compilerOptions: {
                strict: true,
                skipLibCheck: false,
                module: 'esnext',
                moduleResolution: 'bundler',
                target: 'esnext',
                jsx: 'preserve',
                jsxImportSource: 'vue',
                noEmit: true,
                noUncheckedSideEffectImports: true,
                types: ['node'],
            },
            include: ['src/types-probe-vue.ts', 'src/vue-probe.vue'],
            vueCompilerOptions: { strictTemplates: true },
        },
        null,
        4
    )
);
write(
    path.join(appDir, 'src/types-probe-vue.ts'),
    [
        "import type * as Ui from '@fibrae/semi-ui-vue';",
        "import type * as Ai from '@fibrae/semi-ai-vue';",
        "import type * as Icons from '@fibrae/semi-icons-vue';",
        "import type * as LabIcons from '@fibrae/semi-icons-vue/lab';",
        "import type * as Illustrations from '@fibrae/semi-illustrations-vue';",
        "import type { IconProps } from '@fibrae/semi-ui-vue/icons/index';",
        "import type { ChatProps } from '@fibrae/semi-ai-vue/chat/interface';",
        "import '@fibrae/semi-ui-vue/tokens';",
        'export type Probe = [typeof Ui, typeof Ai, typeof Icons, typeof LabIcons, typeof Illustrations, ChatProps];',
        "export const props: IconProps = { size: 'small', spin: false, rotate: 90 };",
        '',
    ].join('\n')
);
write(
    path.join(appDir, 'src/vue-probe.vue'),
    [
        '<script setup lang="ts">',
        "import Icon from '@fibrae/semi-ui-vue/icons/index';",
        "import { IconHome } from '@fibrae/semi-icons-vue';",
        "import { IconAvatar } from '@fibrae/semi-icons-vue/lab';",
        "import { IllustrationSuccess } from '@fibrae/semi-illustrations-vue';",
        "import Chat from '@fibrae/semi-ai-vue/chat/index';",
        '</script>',
        '<template>',
        '    <Icon :rotate="90"><svg /></Icon>',
        '    <IconHome size="small" />',
        '    <IconAvatar :spin="true" />',
        '    <IllustrationSuccess />',
        '    <Chat :chats="[]" />',
        '</template>',
        '',
    ].join('\n')
);
execFileSync(process.execPath, [path.join(appDir, 'node_modules/vue-tsc/bin/vue-tsc.js'), '-p', 'tsconfig.vue.json'], {
    cwd: appDir,
    stdio: 'inherit',
});

write(
    path.join(appDir, 'tsconfig.solid.json'),
    JSON.stringify(
        {
            compilerOptions: {
                strict: true,
                skipLibCheck: false,
                module: 'esnext',
                moduleResolution: 'bundler',
                target: 'esnext',
                jsx: 'preserve',
                jsxImportSource: 'solid-js',
                noEmit: true,
                // vite/client declares the stylesheet side-effect imports
                types: ['vite/client'],
            },
            include: ['src/solid-app.tsx'],
        },
        null,
        4
    )
);
write(
    path.join(appDir, 'src/solid-app.tsx'),
    [
        "import '@fibrae/semi-ui-solid/styles.css';",
        "import '@fibrae/semi-ai-solid/styles.css';",
        "import { createSignal } from 'solid-js';",
        "import { render } from 'solid-js/web';",
        "import { Button, Switch, Tabs, Tooltip } from '@fibrae/semi-ui-solid';",
        "import Input from '@fibrae/semi-ui-solid/input/index';",
        "import { AIChatInput } from '@fibrae/semi-ai-solid';",
        "import { IconHome } from '@fibrae/semi-icons-solid';",
        "import { IllustrationSuccess } from '@fibrae/semi-illustrations-solid';",
        'function App() {',
        '    const [count, setCount] = createSignal(0);',
        '    return (',
        '        <main>',
        '            <Button icon={<IconHome />} onClick={() => setCount((n) => n + 1)}>clicked {count()}</Button>',
        '            <Tooltip content="tip">{(getTriggerProps) => <span {...getTriggerProps({})} tabIndex={0}>hover me</span>}</Tooltip>',
        '            <Switch aria-label="switch" />',
        '            <Input placeholder="input" />',
        '            <Tabs><Tabs.TabPane itemKey="a" tab="A">pane a</Tabs.TabPane></Tabs>',
        '            <AIChatInput />',
        '            <IllustrationSuccess />',
        '        </main>',
        '    );',
        '}',
        'export const mount = (el: HTMLElement) => render(() => <App />, el);',
        '',
    ].join('\n')
);
execFileSync(process.execPath, [path.join(appDir, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.solid.json'], {
    cwd: appDir,
    stdio: 'inherit',
});

{
    // Shipped CSS sits in the same `semi` layer the theme plugins emit, so it cascades the same with or without one
    const scope = path.join(appDir, 'node_modules/@fibrae');
    const cssFiles = fs.globSync('semi-{ui-react,ui-vue,ai-react,ai-vue,foundation,ai-foundation,icons-core,animation}/dist/**/*.css', { cwd: scope });
    for (const name of ['semi-ui-react', 'semi-ui-vue', 'semi-ai-react', 'semi-ai-vue']) {
        assert.ok(cssFiles.includes(`${name}/dist/styles.css`), `${name} ships dist/styles.css`);
    }
    assert.ok(cssFiles.includes('semi-icons-core/dist/styles/icons.css'), 'Vue icons share the shipped icon CSS');
    // Component and token stylesheets live in semi-foundation; semi-ui-react only imports them
    assert.ok(cssFiles.includes('semi-foundation/dist/base/tokens.css'), 'semi-foundation ships the token entry as dist/base/tokens.css');
    assert.ok(
        cssFiles.some((file) => file.startsWith('semi-foundation/dist/button/')),
        'semi-foundation ships component CSS'
    );
    // The theme is loaded only through semi:theme, so it ships as SCSS
    assert.ok(fs.existsSync(path.join(scope, 'semi-foundation/dist/theme/index.scss')), 'semi-foundation ships the theme as dist/theme/*.scss');
    assert.ok(!cssFiles.some((file) => file.startsWith('semi-foundation/dist/theme/')), 'the theme is not compiled');
    // tailwind.css is a Tailwind `@theme` file, which must stay at the top level
    for (const file of cssFiles.filter((file) => !file.endsWith('/tailwind.css'))) {
        const css = fs.readFileSync(path.join(scope, file), 'utf-8');
        assert.ok(css.startsWith('@layer semi{') && css.trimEnd().endsWith('}'), `${file} is wrapped in @layer semi`);
        // A top-level `base` layer would merge into Tailwind's own; the sub-layer inside `semi` is harmless
        let depth = 0;
        for (let index = 0; index < css.length; index++) {
            depth += css[index] === '{' ? 1 : css[index] === '}' ? -1 : 0;
            assert.ok(!(depth === 0 && /^\s*@layer base\s*\{/.test(css.slice(index + 1, index + 40))), `${file} has no top-level @layer base`);
        }
    }
    for (const name of ['semi-ui-solid', 'semi-ai-solid', 'semi-ui-svelte', 'semi-ai-svelte']) {
        assert.ok(fs.existsSync(path.join(scope, `${name}/dist/styles.css`)), `${name} ships dist/styles.css`);
    }
    for (const name of ['semi-ui-vue', 'semi-ai-vue']) {
        const vueNamed = fs.globSync('**/*.vue*', { cwd: path.join(scope, name, 'dist') });
        assert.deepStrictEqual(vueNamed, [], `${name} ships no file whose name contains .vue`);
    }
    const fullCss = fs.readFileSync(path.join(scope, 'semi-ui-react/dist/styles.css'), 'utf-8');
    // `semi-base` is how the base sub-layer is named once it cannot collide with Tailwind's `base`
    const layers = [...fullCss.matchAll(/@layer ([\w-]+)\s*\{/g)].map(([, name]) => (name === 'semi-base' ? 'base' : name));
    assert.deepStrictEqual(layers, ['semi', 'base'], 'styles.css declares the semi layer and its base sub-layer, in order');
    for (const name of ['semi-ui-react', 'semi-ui-vue', 'semi-ui-solid', 'semi-ui-svelte']) {
        const tailwindTheme = fs.readFileSync(path.join(scope, `${name}/dist/tailwind.css`), 'utf-8');
        assert.ok(tailwindTheme.includes('--color-semi-color-primary: var(--semi-color-primary);'), `${name} tailwind.css maps the Semi tokens for Tailwind`);
    }
}

{
    // Module specifiers only: bundler region comments and strings may still name a bundled dependency
    const specifiersOf = (distDir: string, pattern: string) => fs.globSync(pattern, { cwd: distDir }).flatMap((file) => [...fs.readFileSync(path.join(distDir, file), 'utf-8').matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)["']([^"']+)["']/g)].map(([, specifier]) => specifier));
    const scope = path.join(appDir, 'node_modules/@fibrae');
    const jsonViewer = specifiersOf(path.join(scope, 'semi-json-viewer-core/dist'), 'index.{js,d.ts}');
    assert.deepStrictEqual(
        jsonViewer.filter((specifier) => specifier.startsWith('jsonc-parser')),
        [],
        'semi-json-viewer-core bundles jsonc-parser instead of importing it'
    );
    const shiki = specifiersOf(path.join(scope, 'semi-foundation/dist'), '**/*.{js,d.ts}').filter((specifier) => /^@?shiki/.test(specifier));
    assert.ok(shiki.includes('@shikijs/core'), 'the import scan finds the shiki specifiers in semi-foundation');
    // shiki/core is the full bundle's entry; the highlighter comes from @shikijs/core with the JavaScript regex engine
    assert.deepStrictEqual(
        shiki.filter((specifier) => specifier !== '@shikijs/core' && specifier !== 'shiki/engine/javascript' && !specifier.startsWith('shiki/themes/')),
        [],
        'semi-foundation imports only @shikijs/core, shiki/engine/javascript and shiki/themes/*'
    );
    // A Solid-aware bundler takes `.jsx`; every other consumer takes the dom `.js` twin
    for (const name of ['semi-ui-solid', 'semi-ai-solid', 'semi-icons-solid', 'semi-illustrations-solid']) {
        const { exports } = JSON.parse(fs.readFileSync(path.join(scope, name, 'package.json'), 'utf-8'));
        for (const key of ['.', './*', ...(name === 'semi-icons-solid' ? ['./lab'] : [])]) {
            const entry = exports[key];
            // Conditions match in key order, so `solid` must precede `default`
            assert.ok(entry?.default?.endsWith('.js') && entry.solid === entry.default.replace(/\.js$/, '.jsx') && Object.keys(entry).indexOf('solid') < Object.keys(entry).indexOf('default'), `${name} exports ${key} maps the solid condition to .jsx before default to .js`);
        }
    }
}

{
    // Svelte ships `.svelte` sources (compiled output would import svelte/internal, Y-H9); Svelte-aware bundlers pick them
    // up through the `svelte` condition; the bundler checks further down build them with vite-plugin-svelte
    const scope = path.join(appDir, 'node_modules/@fibrae');
    for (const name of ['semi-ui-svelte', 'semi-ai-svelte', 'semi-icons-svelte', 'semi-illustrations-svelte']) {
        const root = path.join(scope, name);
        const { exports } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
        for (const [key, entry] of Object.entries<string | Record<string, string>>(exports)) {
            if (typeof entry === 'string') {
                assert.ok(key === './package.json' || fs.existsSync(path.join(root, entry)), `${name} exports ${key} points at a shipped file`);
                continue;
            }
            // Conditions match in key order, so `svelte` must precede `default`
            assert.ok(entry.types && entry.svelte && Object.keys(entry).indexOf('svelte') < Object.keys(entry).indexOf('default'), `${name} exports ${key} has types, then svelte before default`);
        }
        assert.ok(fs.existsSync(path.join(root, exports['.'].svelte)) && fs.existsSync(path.join(root, exports['.'].types)), `${name} exports . points at files that exist`);
        assert.deepStrictEqual(fs.globSync('**/__tests__', { cwd: path.join(root, 'dist') }), [], `${name} ships no __tests__`);
        for (const file of fs.globSync('dist/**/*.{svelte,js,d.ts}', { cwd: root })) {
            assert.doesNotMatch(fs.readFileSync(path.join(root, file), 'utf-8'), /(?:\bfrom|\bimport)\s*['"][^'"]+\.scss['"]/, `${name}/${file} does not import a .scss file`);
        }
    }
    const ui = path.join(scope, 'semi-ui-svelte');
    assert.strictEqual(fs.globSync('*.js', { cwd: path.join(ui, 'dist/locale/source') }).length, fs.globSync('*.js', { cwd: path.join(scope, 'semi-foundation/dist/locale/source') }).length, 'semi-ui-svelte re-exports every foundation locale pack');
    // Svelte-aware tools resolve with the `svelte` condition; plain Node and other bundlers take `default`. The AI package
    // reaches the UI package's internals by deep path: a `.ts` module without extension, a `.svelte.ts` one as `.svelte.js`
    const subpaths = ['hooks', 'tokens', 'locale/source/en_US', 'styles.css', 'tailwind.css', 'switch/switch.svelte', '_base/create-context', '_base/use-foundation.svelte.js'];
    for (const condition of [[], ['--conditions=svelte']]) {
        const resolved = execFileSync(process.execPath, [...condition, '--input-type=module', '-e', 'for (const specifier of process.argv.slice(1)) console.log(import.meta.resolve(specifier));', ...subpaths.map((subpath) => `@fibrae/semi-ui-svelte/${subpath}`)], { cwd: appDir, encoding: 'utf-8' })
            .trim()
            .split('\n')
            .map((url) => {
                assert.ok(fs.existsSync(fileURLToPath(url)), `${url} exists`);
                return url.replace(/^.*\/@fibrae\//, '');
            });
        assert.deepStrictEqual(
            resolved,
            ['hooks.js', 'tokens.js', 'locale/source/en_US.js', 'styles.css', 'tailwind.css', 'switch/switch.svelte', '_base/create-context.js', '_base/use-foundation.svelte.js'].map((file) => `semi-ui-svelte/dist/${file}`),
            `the semi-ui-svelte subpaths resolve ${condition.join(' ') || 'by default'}`
        );
    }
}

{
    // The documented custom-prefix commands pass neither -f nor -i; the CLI resolves both from its own dependencies
    const bin = path.join(appDir, 'node_modules/.bin/semi-build-scss');
    const prefixed = path.join(workDir, 'semi-my.css');
    execFileSync(bin, ['--prefix', 'my', '-o', prefixed], { cwd: appDir, stdio: ['ignore', 'ignore', 'inherit'] });
    assert.ok(fs.readFileSync(prefixed, 'utf-8').includes('.my-button'), 'semi-build-scss --prefix my emits .my- class names without -f or -i');
    const prefixedAi = path.join(workDir, 'semi-ai-my.css');
    execFileSync(bin, ['--ai', path.join(appDir, 'node_modules/@fibrae/semi-ai-foundation/dist'), '--prefix', 'my', '-o', prefixedAi], { cwd: appDir, stdio: ['ignore', 'ignore', 'inherit'] });
    assert.ok(fs.readFileSync(prefixedAi, 'utf-8').includes('.my-ai-'), 'semi-build-scss --ai emits .my-ai- class names without -f');
}

{
    // A server runtime loads the published modules straight from Node: every module must evaluate with no DOM, and
    // under React Server Components the 'use client' modules must be the only ones that touch client-only React APIs
    const scope = path.join(appDir, 'node_modules/@fibrae');
    const distDirs = (names: string[]) => names.map((name) => path.join(scope, name, 'dist'));
    const reactDists = distDirs(['semi-ui-react', 'semi-ai-react', 'semi-icons-react', 'semi-illustrations-react']);
    const importDist = path.join(import.meta.dirname, 'import-dist.ts');
    const exportsFile = path.join(workDir, 'dist-exports.json');
    execFileSync(process.execPath, [importDist, 'collect', exportsFile, ...reactDists, ...distDirs(['semi-ui-vue', 'semi-ai-vue', 'semi-icons-vue', 'semi-illustrations-vue'])], { stdio: 'inherit' });

    const startsWithUseClient = (distDir: string, file: string) => /^["']use client["']/.test(fs.readFileSync(path.join(distDir, file), 'utf-8').slice(0, 20));
    // The root entry only re-exports, and the locale re-exports are plain data
    const isUnmarked = (file: string) => file === 'index.js' || file.startsWith('locale/source/');
    for (const name of ['semi-ui-react', 'semi-ai-react']) {
        const distDir = path.join(scope, name, 'dist');
        const missing = fs.globSync('**/*.js', { cwd: distDir }).filter((file) => !isUnmarked(file) && !startsWithUseClient(distDir, file));
        assert.deepStrictEqual(missing, [], `every ${name} module but the root entry starts with 'use client'`);
        assert.ok(!startsWithUseClient(distDir, 'index.js'), `the ${name} root entry is not marked 'use client'`);
    }
    for (const name of ['semi-icons-react', 'semi-illustrations-react']) {
        const distDir = path.join(scope, name, 'dist');
        const marked = fs.globSync('**/*.js', { cwd: distDir }).filter((file) => startsWithUseClient(distDir, file));
        assert.deepStrictEqual(marked, [], `${name} modules are not marked 'use client'`);
    }
    execFileSync(process.execPath, ['--conditions=react-server', importDist, 'rsc', exportsFile, ...reactDists], { stdio: 'inherit' });

    // `./*` serves the locale re-exports; Solid's `solid` condition picks the JSX twin
    const resolveLocale = (condition: string[]) =>
        execFileSync(process.execPath, [...condition, '--input-type=module', '-e', 'for (const specifier of process.argv.slice(1)) console.log(import.meta.resolve(specifier));', ...['react', 'vue', 'solid'].map((framework) => `@fibrae/semi-ui-${framework}/locale/source/en_US`)], { cwd: appDir, encoding: 'utf-8' })
            .trim()
            .split('\n')
            .map((url) => {
                // import.meta.resolve maps the exports pattern without checking that the file exists
                assert.ok(fs.existsSync(fileURLToPath(url)), `${url} exists`);
                return url.replace(/^.*\/@fibrae\//, '');
            });
    assert.deepStrictEqual(resolveLocale([]), ['semi-ui-react/dist/locale/source/en_US.js', 'semi-ui-vue/dist/locale/source/en_US.js', 'semi-ui-solid/dist/locale/source/en_US.js'], 'the locale subpath resolves by default');
    assert.deepStrictEqual(resolveLocale(['--conditions=solid']), ['semi-ui-react/dist/locale/source/en_US.js', 'semi-ui-vue/dist/locale/source/en_US.js', 'semi-ui-solid/dist/locale/source/en_US.jsx'], 'the locale subpath resolves under the solid condition');
}

// The app's own copies, typed by the workspace sources they were packed from
const { build, createServer }: typeof Vite = await import(path.join(appDir, 'node_modules/vite/dist/node/index.js'));
const { default: semiTheming }: typeof SemiVite = await import(path.join(appDir, 'node_modules/@fibrae/semi-vite-plugin/dist/index.mjs'));

async function bundle(entry: string, options: SemiVite.SemiVitePluginOptions | null) {
    // build() returns a watcher only with build.watch set, which this never does
    const result = (await build({
        root: appDir,
        logLevel: 'error',
        plugins: options ? [semiTheming(options)] : [],
        build: {
            write: false,
            cssCodeSplit: false,
            lib: { entry, formats: ['es'] },
            rolldownOptions: { external: [/^react($|\/)/, /^react-dom($|\/)/, /^vue($|\/)/] },
        },
    })) as Vite.Rolldown.RolldownOutput | Vite.Rolldown.RolldownOutput[];
    const { output } = Array.isArray(result) ? result[0] : result;
    return {
        css: output
            .filter((file): file is Vite.Rolldown.OutputAsset => file.fileName.endsWith('.css'))
            .map((file) => file.source)
            .join('\n'),
        js: output
            .filter((file) => file.type === 'chunk')
            .map((file) => file.code)
            .join('\n'),
    };
}

// An app build with Vite's default CSS code splitting, reporting the CSS loaded with the entry and with the lazy chunks
async function splitBundle(entry: string) {
    const result = (await build({
        root: appDir,
        logLevel: 'error',
        build: {
            write: false,
            rolldownOptions: { input: path.join(appDir, entry), external: [/^react($|\/)/, /^react-dom($|\/)/, /^vue($|\/)/] },
        },
    })) as Vite.Rolldown.RolldownOutput | Vite.Rolldown.RolldownOutput[];
    const { output } = Array.isArray(result) ? result[0] : result;
    const chunks = output.filter((file): file is Vite.Rolldown.OutputChunk => file.type === 'chunk');
    const cssOf = (selected: Vite.Rolldown.OutputChunk[]) =>
        selected
            .flatMap((chunk) => [...(chunk.viteMetadata?.importedCss ?? [])])
            .map((name) => output.find((file): file is Vite.Rolldown.OutputAsset => file.fileName === name && file.type === 'asset')?.source)
            .join('\n');
    return { entryCss: cssOf(chunks.filter((chunk) => chunk.isEntry)), lazyCss: cssOf(chunks.filter((chunk) => !chunk.isEntry)) };
}

{
    const { css, js } = await bundle('src/components.js', { prefixCls: 'xprobe' });
    assert.match(css, /\.xprobe-button\b/, 'prefixCls rewrites the component CSS');
    assert.doesNotMatch(css, /\.semi-button\b/, 'no default prefix left in the component CSS');
    assert.match(css, /--semi-color-primary/, 'the token entry compiles, reaching semi:theme in semi-foundation/theme through its exports');
    assert.match(js, /["']xprobe["']/, 'prefixCls rewrites BASE_CLASS_PREFIX in env.js');
}
{
    // The getting-started path: no Semi plugin, only the root entry
    const { css } = await bundle('src/components.js', null);
    assert.match(css, /--semi-color-primary/, 'the root entry brings the tokens without any plugin');
    assert.match(css, /\.semi-button\b/, 'the root entry brings the component CSS without any plugin');
    assert.doesNotMatch(css, /\.semi-datepicker\b/, 'unused components add no CSS');
    const tokensAt = css.search(/--semi-color-primary\s*:/);
    const buttonAt = css.indexOf('.semi-button');
    assert.ok(tokensAt >= 0 && tokensAt < buttonAt, `base rules come before component rules (${tokensAt} vs ${buttonAt})`);
}
{
    // A deep path is a top-level entry too: the tokens come with the component, not with the root entry
    const { css } = await bundle('src/deep.js', null);
    assert.match(css, /--semi-color-primary/, 'a deep import brings the tokens without any plugin');
    assert.match(css, /\.semi-button\b/, 'a deep import brings the component CSS');
    assert.doesNotMatch(css, /\.semi-datepicker\b/, 'a deep import adds no unrelated component CSS');
}
for (const ui of ['', 'vue-']) {
    // The public token entry is a bare side-effect import, so it must survive the package's sideEffects list
    const only = await bundle(`src/${ui}tokens-only.js`, null);
    assert.match(only.css, /--semi-color-primary\s*:/, `${ui}tokens-only: the token entry brings the tokens on its own`);
    // Imported first by the app, it shares one module with the tokens the components import
    const countTokens = (css: string) => css.match(/--semi-color-primary\s*:/g)?.length ?? 0;
    const plain = await bundle(`src/${ui}tokens-entry.js`, null);
    assert.strictEqual(countTokens(plain.css), 1, `${ui}tokens-entry: the entry and the components share one copy of the tokens`);
    // What the entry is for: with the first component loaded lazily, the tokens still load with the entry chunk
    const lazy = await splitBundle(`src/${ui}tokens-lazy.js`);
    assert.strictEqual(countTokens(lazy.entryCss), 1, `${ui}tokens-lazy: the tokens load with the entry chunk`);
    assert.strictEqual(countTokens(lazy.lazyCss), 0, `${ui}tokens-lazy: the lazy chunk carries no second copy`);
    assert.match(lazy.lazyCss, /\.semi-button\b/, `${ui}tokens-lazy: the component CSS stays with the lazy chunk`);
    const themed = await bundle(`src/${ui}tokens-entry.js`, { prefixCls: 'xprobe' });
    assert.strictEqual(countTokens(themed.css), 1, `${ui}tokens-entry: one copy of the tokens with prefixCls`);
    assert.match(themed.css, /\.xprobe-always-dark\b/, `${ui}tokens-entry: prefixCls reaches the token entry`);
    assert.doesNotMatch(themed.css, /\.semi-always-dark\b/, `${ui}tokens-entry: no default prefix left in the tokens`);
    const omitted = await bundle(`src/${ui}tokens-only.js`, { omitCss: true });
    assert.strictEqual(omitted.css, '', `${ui}tokens-only: omitCss drops the token entry like any component stylesheet`);
}
{
    // Components import their dependencies by direct path, so a deep import must not pull in dist/index.js
    // (which re-exports every component) of its own package or of semi-ui-react
    for (const name of ['semi-ui-react', 'semi-ai-react', 'semi-ui-vue', 'semi-ai-vue', 'semi-icons-vue', 'semi-illustrations-vue']) {
        const distDir = path.join(appDir, 'node_modules/@fibrae', name, 'dist');
        const importsRootIndex = fs
            .readdirSync(distDir, { recursive: true, encoding: 'utf8' })
            .filter((file) => file.endsWith('.js') && file !== 'index.js')
            .filter((file) => {
                const specifiers = [...fs.readFileSync(path.join(distDir, file), 'utf8').matchAll(/from\s*["']([^"']+)["']/g)];
                return specifiers.some(([, specifier]) => specifier === `@fibrae/${name}` || specifier === '@fibrae/semi-ui-react' || specifier === '@fibrae/semi-ui-vue' || path.resolve(path.dirname(path.join(distDir, file)), specifier) === path.join(distDir, 'index.js'));
            });
        assert.deepStrictEqual(importsRootIndex, [], `no ${name} dist file imports a root index.js`);
    }
    // A template comment beside the root element makes a Fragment root, and the production runtime discards fallthrough
    // attrs on it; only `v-if` placeholders may remain as comment vnodes
    for (const name of ['semi-ui-vue', 'semi-ai-vue']) {
        const distDir = path.join(appDir, 'node_modules/@fibrae', name, 'dist');
        const withComments = fs
            .readdirSync(distDir, { recursive: true, encoding: 'utf8' })
            .filter((file) => file.endsWith('.js'))
            .filter((file) => /createCommentVNode\("[^v]/.test(fs.readFileSync(path.join(distDir, file), 'utf8')));
        assert.deepStrictEqual(withComments, [], `no ${name} dist file compiles a template comment into a vnode`);
    }
    const { css } = await bundle('src/deep-ai.js', null);
    assert.match(css, /\.semi-aiChatInput\b/i, 'the deep aiChatInput import brings its component CSS');
    // AIChatInput reaches Input, whose group rules name .semi-datepicker; match a class only DatePicker's own sheet has
    assert.doesNotMatch(css, /\.semi-datepicker-month-grid\b/, 'the deep aiChatInput import adds no unrelated component CSS');
}
{
    const { css, js } = await bundle('src/lab-icons.js', { prefixCls: 'xprobe' });
    assert.match(js, /["']avatar["']/, 'the full-colour icons resolve through @fibrae/semi-icons-react/lab');
    assert.match(css, /\.xprobe-icon\b/, 'lab icons share the themed icon stylesheet');
}
{
    const { css, js } = await bundle('src/vue-components.js', { prefixCls: 'xprobe' });
    assert.match(css, /\.xprobe-icon\b/, 'Vue icon CSS accepts prefixCls');
    assert.doesNotMatch(css, /\.semi-icon\b/, 'Vue icon CSS has no default prefix left');
    assert.match(js, /["']xprobe["']/, 'prefixCls reaches the Vue icon environment');
    assert.match(js, /from\s*["']vue["']/, 'Vue stays external in the consumer bundle');
    assert.doesNotMatch(js, /from\s*["']react(?:\/|["'])/, 'Vue packages do not import React');
}
{
    const { css } = await bundle('src/vue-deep.js', null);
    assert.match(css, /\.semi-icon\b/, 'the Vue deep entry brings icon styles without a plugin');
    assert.doesNotMatch(css, /\.semi-button\b/, 'the Vue deep entry brings no unrelated component CSS');
    const omitted = await bundle('src/vue-deep.js', { omitCss: true });
    assert.strictEqual(omitted.css, '', 'omitCss removes Vue icon stylesheet imports');
}
{
    const { css, js } = await bundle('src/vue-deep-ai.js', null);
    assert.match(css, /\.semi-aiChatInput\b/i, 'the Vue deep aiChatInput import brings its component CSS');
    // AIChatInput reaches Input, whose group rules name .semi-datepicker; match a class only DatePicker's own sheet has
    assert.doesNotMatch(css, /\.semi-datepicker-month-grid\b/, 'the Vue deep aiChatInput import adds no unrelated component CSS');
    assert.match(js, /from\s*["']vue["']/, 'Vue stays external in the Vue AI bundle');
    assert.doesNotMatch(js, /from\s*["']react(?:\/|["'])/, 'the Vue AI package does not import React');
}
{
    const { css, js } = await bundle('src/vue-lab-icons.js', { prefixCls: 'xprobe' });
    assert.match(js, /["']avatar["']/, 'Vue lab icons resolve through the published subpath');
    assert.match(css, /\.xprobe-icon\b/, 'Vue lab icons share the themed icon stylesheet');
}
{
    const { css } = await bundle('src/vue-full-css.js', { omitCss: true });
    assert.match(css, /\.semi-button\b/, 'the Vue full stylesheet is importable with omitCss');
    assert.match(css, /\.semi-icon\b/, 'the Vue full stylesheet includes icon styles');
    assert.match(css, /\.semi-aiChatInput\b/, 'the semi-ai-vue styles.css entry is importable');
}
{
    // The server environment bundles the Semi packages through Vite (their CSS imports cannot load in Node) while the
    // framework runtimes stay external; the plugin does both with no host configuration
    const server = await createServer({
        root: appDir,
        logLevel: 'error',
        plugins: [semiTheming({ prefixCls: 'my' })],
        server: { middlewareMode: true, ws: false },
    });
    try {
        const vue = (await server.ssrLoadModule('/src/vue-ssr.js')) as {
            BaseFoundation: unknown;
            render(): Promise<string>;
        };
        assert.strictEqual(typeof vue.BaseFoundation, 'function', 'the Vue root entry imports during SSR');
        const vueHtml = await vue.render();
        assert.match(vueHtml, /\bmy-button\b/, 'the Vue Button renders with the prefixCls during SSR');
        assert.doesNotMatch(vueHtml, /\bsemi-button\b/, 'no default prefix left in the Vue SSR output');
        assert.match(vueHtml, /id="ssr-custom"/, 'the Vue deep Icon entry renders its slot during SSR');
        assert.match(vueHtml, /my-icon-home/, 'the root Vue icon entry renders during SSR');
        assert.match(vueHtml, /my-icon-avatar/, 'the Vue lab entry renders during SSR');
        const react = (await server.ssrLoadModule('/src/react-ssr.js')) as { render(): string };
        const reactHtml = react.render();
        assert.match(reactHtml, /\bmy-button\b/, 'the React Button renders with the prefixCls during SSR');
        assert.doesNotMatch(reactHtml, /\bsemi-button\b/, 'no default prefix left in the React SSR output');
        assert.match(reactHtml, /my-icon-home/, 'the React icon renders with the prefixCls during SSR');
        // The AI classes take their prefix from ai-foundation's import of foundation's BASE_CLASS_PREFIX
        assert.match(reactHtml, /\bmy-aiChatInput\b/, 'the React AIChatInput renders with the prefixCls during SSR');
        assert.doesNotMatch(reactHtml, /\bsemi-aiChatInput\b/, 'no default prefix left in the AIChatInput SSR output');
    } finally {
        await server.close();
    }
}
{
    // Users install Motion themselves and hand it the presets
    const { css, js } = await bundle('src/animation.js', {});
    assert.match(js, /\.645/, 'the easing presets reach the bundle next to Motion');
    assert.match(js, /stiffness/, 'the spring presets reach the bundle next to Motion');
    assert.match(css, /::view-transition-new\(\.semi-fade\)/, 'the View Transition Classes survive the CSS side effects');
}
{
    const { css, js } = await bundle('src/full-css.js', { omitCss: true });
    assert.doesNotMatch(js, /import\s+["'][^"']+\.css["']/, 'omitCss drops the component stylesheet imports');
    assert.match(css, /\.semi-button\b/, 'the semi-ui-react styles.css entry is importable');
    assert.match(css, /\.semi-aiChatInput\b/, 'the semi-ai-react styles.css entry is importable');
}
{
    // Dev serves semi-ui-react from the dependency pre-bundle, which the plugin's transform hook never sees
    const server = await createServer({
        root: appDir,
        logLevel: 'error',
        plugins: [semiTheming({ prefixCls: 'xprobe' })],
        optimizeDeps: { include: ['@fibrae/semi-ui-react'], noDiscovery: true, force: true },
        server: { middlewareMode: true, ws: false },
    });
    const entry = await server.transformRequest('/src/components.js');
    const depUrl = entry.code.match(/from ["']([^"']*\.vite\/deps\/@fibrae_semi-ui-react\.js[^"']*)["']/)?.[1];
    assert.ok(depUrl, 'semi-ui-react is served from the dependency pre-bundle');
    const dep = await server.transformRequest(depUrl);
    // lazy parts (ResizableTable, the sortable lists) split shared modules such as env.js into chunks the entry imports
    // statically, so the replaced constant may live in one of them
    const chunkUrls = [...dep.code.matchAll(/from ["']([^"']*\.vite\/deps\/[^"']+\.js[^"']*)["']/g)].map(([, url]) => url);
    const codes = [dep.code];
    for (const url of chunkUrls) {
        codes.push((await server.transformRequest(url)).code);
    }
    await server.close();
    // assert.ok, not assert.match: a failure would print the whole multi-megabyte bundle
    assert.ok(
        codes.some((code) => /BASE_CLASS_PREFIX\s*=\s*["']xprobe["']/.test(code)),
        'prefixCls reaches the pre-bundled env.js'
    );
}
{
    const { default: solid }: { default: () => Vite.Plugin } = await import(path.join(appDir, 'node_modules/unplugin-solid/dist/vite.mjs'));
    const result = (await build({
        root: appDir,
        logLevel: 'error',
        plugins: [solid()],
        build: {
            write: false,
            cssCodeSplit: false,
            lib: { entry: 'src/solid-app.tsx', formats: ['es'] },
            rolldownOptions: { external: [/^solid-js($|\/)/] },
        },
    })) as Vite.Rolldown.RolldownOutput | Vite.Rolldown.RolldownOutput[];
    const { output } = Array.isArray(result) ? result[0] : result;
    const css = output
        .filter((file): file is Vite.Rolldown.OutputAsset => file.fileName.endsWith('.css'))
        .map((file) => file.source)
        .join('\n');
    const js = output
        .filter((file) => file.type === 'chunk')
        .map((file) => file.code)
        .join('\n');
    assert.match(css, /\.semi-button\b/, 'the Solid styles.css entry brings the component CSS');
    assert.match(css, /--semi-color-primary/, 'the Solid styles.css entry brings the tokens');
    assert.match(css, /\.semi-aiChatInput\b/, 'the semi-ai-solid styles.css entry is importable');
    assert.match(js, /from\s*["']solid-js(?:\/web)?["']/, 'solid-js stays external in the Solid bundle');
    assert.doesNotMatch(js, /from\s*["'](?:react|vue)(?:\/|["'])/, 'Solid packages import neither React nor Vue');
}
{
    // SolidStart resolves the `solid` condition to the `.jsx` tree and compiles it itself, with `generate: 'ssr'` on the
    // server. Every module must compile that way, and each must export what its dom `.js` twin does
    const { default: solid }: { default: (options?: object) => Vite.Plugin } = await import(path.join(appDir, 'node_modules/vite-plugin-solid/dist/esm/index.mjs'));
    const scope = path.join(appDir, 'node_modules/@fibrae');
    const names = ['semi-ui-solid', 'semi-ai-solid', 'semi-icons-solid', 'semi-illustrations-solid'];
    async function compileTree(extension: '.js' | '.jsx') {
        // `_virtual/` holds the bundler's own helpers, which only the pass that needs them emits
        const input = Object.fromEntries(names.flatMap((name) => fs.globSync(`**/*${extension}`, { cwd: path.join(scope, name, 'dist'), exclude: ['_virtual/**'] }).map((file) => [`${name}/${file.slice(0, -extension.length)}`, path.join(scope, name, 'dist', file)])));
        const result = (await build({
            root: appDir,
            logLevel: 'error',
            plugins: extension === '.jsx' ? [solid({ ssr: true })] : [],
            build: {
                ssr: true,
                write: false,
                // Only the package's own modules are compiled; dependencies, stylesheets included, stay imports
                rolldownOptions: { input, external: (id) => !/^[./\0]/.test(id) && !path.isAbsolute(id) },
            },
        })) as Vite.Rolldown.RolldownOutput | Vite.Rolldown.RolldownOutput[];
        const { output } = Array.isArray(result) ? result[0] : result;
        const chunks = output.filter((file): file is Vite.Rolldown.OutputChunk => file.type === 'chunk');
        return {
            exports: Object.fromEntries(chunks.filter((chunk) => chunk.isEntry).map((chunk) => [chunk.name, chunk.exports.toSorted()])),
            code: chunks.map((chunk) => chunk.code).join('\n'),
        };
    }
    const jsx = await compileTree('.jsx');
    const dom = await compileTree('.js');
    assert.ok(Object.keys(jsx.exports).length > 1000, 'the whole .jsx tree compiled');
    assert.deepStrictEqual(jsx.exports, dom.exports, 'the .jsx and .js trees export the same names, module by module');
    assert.match(jsx.code, /\bssr\(/, 'the .jsx tree compiled to server rendering calls');
    assert.doesNotMatch(jsx.code, /\btemplate\(/, 'the .jsx tree compiled no DOM templates');
}
{
    // A Svelte app as a user builds it: vite-plugin-svelte resolves the `svelte` condition and compiles the shipped
    // `.svelte` sources together with the app, in the browser build and in SSR
    write(
        path.join(appDir, 'src/svelte-app.svelte'),
        [
            '<script lang="ts">',
            "    import { Button, LocaleProvider, Switch } from '@fibrae/semi-ui-svelte';",
            "    import en_US from '@fibrae/semi-ui-svelte/locale/source/en_US';",
            "    import { IconHome } from '@fibrae/semi-icons-svelte';",
            "    import { IllustrationIdle } from '@fibrae/semi-illustrations-svelte';",
            '</script>',
            '',
            '<LocaleProvider locale={en_US}>',
            '    <main>',
            '        <Button theme="solid" type="primary">ssr-button</Button>',
            '        <Switch aria-label="switch" />',
            '        <IconHome aria-label="home" />',
            '        <IllustrationIdle />',
            '    </main>',
            '</LocaleProvider>',
            '',
        ].join('\n')
    );
    write(
        path.join(appDir, 'src/svelte-entry.js'),
        ["import '@fibrae/semi-ui-svelte/tokens';", "import { mount } from 'svelte';", "import App from './svelte-app.svelte';", "export { observeResize, useClickOutside, useCopied, useLocale } from '@fibrae/semi-ui-svelte/hooks';", 'export const start = (target) => mount(App, { target });', ''].join('\n')
    );
    write(path.join(appDir, 'src/svelte-full-css.js'), ["import '@fibrae/semi-ui-svelte/styles.css';", "export { Button } from '@fibrae/semi-ui-svelte';", ''].join('\n'));
    write(path.join(appDir, 'src/svelte-ssr.js'), ["import { render } from 'svelte/server';", "import App from './svelte-app.svelte';", 'export const html = () => render(App).body;', ''].join('\n'));
    write(path.join(appDir, 'tsconfig.svelte.json'), JSON.stringify({ compilerOptions: { strict: true, skipLibCheck: false, module: 'esnext', moduleResolution: 'bundler', target: 'esnext', noEmit: true, types: [] }, include: ['src/svelte-app.svelte', 'src/types-probe-svelte.ts'] }, null, 4));
    write(
        path.join(appDir, 'src/types-probe-svelte.ts'),
        [
            "import type * as Ui from '@fibrae/semi-ui-svelte';",
            "import type * as Hooks from '@fibrae/semi-ui-svelte/hooks';",
            "import type * as Ai from '@fibrae/semi-ai-svelte';",
            "import type * as Icons from '@fibrae/semi-icons-svelte';",
            "import type * as LabIcons from '@fibrae/semi-icons-svelte/lab';",
            "import type * as Illustrations from '@fibrae/semi-illustrations-svelte';",
            "import type * as EnUS from '@fibrae/semi-ui-svelte/locale/source/en_US';",
            'export type Probe = [typeof Ui, typeof Hooks, typeof Ai, typeof Icons, typeof LabIcons, typeof Illustrations, typeof EnUS];',
            '',
        ].join('\n')
    );
    // A failing svelte-check throws, so declaration errors in the published Svelte packages fail the run
    execFileSync(process.execPath, [path.join(appDir, 'node_modules/svelte-check/bin/svelte-check'), '--workspace', appDir, '--tsconfig', path.join(appDir, 'tsconfig.svelte.json'), '--fail-on-warnings'], { cwd: appDir, stdio: 'inherit' });

    const { svelte }: { svelte: () => Vite.Plugin[] } = await import(path.join(appDir, 'node_modules/@sveltejs/vite-plugin-svelte/src/index.js'));
    async function bundleSvelte(entry: string, options: SemiVite.SemiVitePluginOptions | null) {
        const result = (await build({
            root: appDir,
            logLevel: 'error',
            plugins: [svelte(), options ? semiTheming(options) : []],
            build: {
                write: false,
                cssCodeSplit: false,
                lib: { entry, formats: ['es'] },
                rolldownOptions: { external: [/^svelte($|\/)/] },
            },
        })) as Vite.Rolldown.RolldownOutput | Vite.Rolldown.RolldownOutput[];
        const { output } = Array.isArray(result) ? result[0] : result;
        return {
            css: output
                .filter((file): file is Vite.Rolldown.OutputAsset => file.fileName.endsWith('.css'))
                .map((file) => file.source)
                .join('\n'),
            js: output
                .filter((file) => file.type === 'chunk')
                .map((file) => file.code)
                .join('\n'),
        };
    }
    const plain = await bundleSvelte('src/svelte-entry.js', null);
    assert.match(plain.css, /--semi-color-primary\s*:/, 'the Svelte token entry brings the tokens without any plugin');
    for (const block of ['button', 'switch', 'icon']) {
        assert.match(plain.css, new RegExp(`\\.semi-${block}\\b`), `the Svelte ${block} brings its CSS without any plugin`);
    }
    assert.doesNotMatch(plain.css, /\.semi-datepicker\b/, 'unused Svelte components add no CSS');
    assert.match(plain.js, /from\s*["']svelte(?:\/[\w/-]+)?["']/, 'svelte stays external in the Svelte bundle');
    assert.doesNotMatch(plain.js, /from\s*["'](?:react|vue|solid-js)(?:\/|["'])/, 'Svelte packages import no other framework');
    const themed = await bundleSvelte('src/svelte-entry.js', { prefixCls: 'xprobe' });
    assert.match(themed.css, /\.xprobe-button\b/, 'prefixCls rewrites the CSS the Svelte components import');
    assert.doesNotMatch(themed.css, /\.semi-(button|switch|icon)\b/, 'no default prefix left in the Svelte component CSS');
    assert.match(themed.js, /["']xprobe["']/, 'prefixCls rewrites BASE_CLASS_PREFIX for the Svelte components');
    const omitted = await bundleSvelte('src/svelte-entry.js', { omitCss: true });
    assert.strictEqual(omitted.css, '', 'omitCss drops the stylesheet imports of the Svelte components and the token entry');
    const full = await bundleSvelte('src/svelte-full-css.js', { omitCss: true });
    const buttonRules = (css: string) => css.match(/\.semi-button\{/g)?.length ?? 0;
    const sheet = fs.readFileSync(path.join(appDir, 'node_modules/@fibrae/semi-ui-svelte/dist/styles.css'), 'utf-8');
    assert.ok(buttonRules(sheet) > 0 && buttonRules(full.css) === buttonRules(sheet), 'the semi-ui-svelte styles.css entry is importable and, with omitCss, the only copy of the component CSS');

    const server = await createServer({
        root: appDir,
        logLevel: 'error',
        plugins: [svelte(), semiTheming({ prefixCls: 'my' })],
        server: { middlewareMode: true, ws: false },
    });
    try {
        const svelteSsr = (await server.ssrLoadModule('/src/svelte-ssr.js')) as { html(): string };
        const markup = svelteSsr.html();
        assert.match(markup, /\bmy-button\b/, 'the Svelte Button renders with the prefixCls during SSR');
        assert.match(markup, /\bmy-switch\b/, 'the Svelte Switch renders with the prefixCls during SSR');
        assert.match(markup, /my-icon-home/, 'the Svelte icon renders with the prefixCls during SSR');
        assert.doesNotMatch(markup, /\bsemi-(button|switch|icon)\b/, 'no default prefix left in the Svelte SSR output');
    } finally {
        await server.close();
    }
}

execFileSync('trash', [workDir]);
console.log('packed packages: all assertions passed');
