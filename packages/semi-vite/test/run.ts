#!/usr/bin/env node
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build, createServer, resolveConfig, type PluginOption } from 'vite';
import { semiTheming, type SemiVitePluginOptions } from '../dist/index.mjs';

const __dirname = import.meta.dirname;
const fixture = path.join(__dirname, 'fixture');

function write(p: string, content: string) {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
}

// Shipped stylesheets load the theme through the plugin's `semi:theme` importer
const BUTTON_SCSS = '@use "semi:theme" as *;\n@use "variables" as *;\n\n.#{$prefix}-button {\n    color: $color-primary;\n    font-size: $font-size-small;\n}\n';
const VARIABLES_SCSS = '@use "semi:theme" as *;\n\n$font-size-small: 12px;\n';

function setupFixtureNodeModules() {
    const nodeModules = path.join(fixture, 'node_modules');
    const nm = path.join(nodeModules, '@fibrae');
    fs.rmSync(nodeModules, { recursive: true, force: true });

    // Foundation dependencies for the Solid pre-bundle list: one with a root entry, one with subpath exports only
    write(path.join(nodeModules, 'cjs-dep/package.json'), JSON.stringify({ name: 'cjs-dep', version: '0.0.0', main: 'index.js' }));
    write(path.join(nodeModules, 'cjs-dep/index.js'), 'module.exports = 1;\n');
    write(path.join(nodeModules, 'subpath-only/package.json'), JSON.stringify({ name: 'subpath-only', version: '0.0.0', exports: { './x': './x.js', './esm': { import: './esm.js' }, './package.json': './package.json' } }));
    write(path.join(nodeModules, 'subpath-only/x.js'), 'module.exports = 1;\n');
    write(path.join(nodeModules, 'subpath-only/esm.js'), 'export default 1;\n');

    write(
        path.join(nm, 'semi-foundation/package.json'),
        JSON.stringify(
            {
                name: '@fibrae/semi-foundation',
                version: '0.0.0',
                dependencies: { 'cjs-dep': '0.0.0', 'subpath-only': '0.0.0' },
                exports: {
                    './*.css': './dist/*.css',
                    './*.scss': './dist/*.scss',
                    './package.json': './package.json',
                    './*': './dist/*.js',
                },
            },
            null,
            2
        )
    );
    // The theme `semi:theme` serves, at the published path semi-foundation/dist/theme/
    write(path.join(nm, 'semi-foundation/dist/theme/index.scss'), "$prefix: 'semi';\n$color-primary: red;\n");
    write(path.join(nm, 'semi-foundation/dist/button.css'), '/* placeholder */\n');
    write(path.join(nm, 'semi-foundation/dist/button.scss'), BUTTON_SCSS);
    write(path.join(nm, 'semi-foundation/dist/variables.scss'), VARIABLES_SCSS);
    write(path.join(nm, 'semi-foundation/dist/env.js'), '"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\nexports.BASE_CLASS_PREFIX = void 0;\nexports.BASE_CLASS_PREFIX = \'semi\';\n');

    const uiExports = { '.': './dist/index.js', './package.json': './package.json', './*': './dist/*.js' };
    const packageExports: Record<string, Record<string, string>> = {
        'ui-react': { ...uiExports, './tailwind.css': './dist/tailwind.css' },
        'ui-vue': { ...uiExports, './tailwind.css': './dist/tailwind.css' },
        'ai-react': uiExports,
        'ai-vue': uiExports,
        'icons-vue': { '.': './dist/index.js', './lab': './dist/lab/index.js', './package.json': './package.json', './*': './dist/*.js' },
        // The `.jsx` tree the Solid packages publish for the `solid` condition
        'ui-solid': { './package.json': './package.json', './*': './dist/*.jsx' },
    };
    const packageJson = (name: string, dependencies: Record<string, string> = {}) => JSON.stringify({ name: `@fibrae/semi-${name}`, version: '0.0.0', dependencies, exports: packageExports[name] }, null, 2);

    write(path.join(nm, 'semi-ui-react/package.json'), packageJson('ui-react'));
    write(path.join(nm, 'semi-ui-react/dist/button.js'), "import './button.css';\n\nexport function Button() {\n    return 'button';\n}\n");
    write(path.join(nm, 'semi-ui-react/dist/client.js'), "'use client';\n\nexport const Client = 'client';\n");
    write(path.join(nm, 'semi-ui-react/dist/button.css'), '/* placeholder */\n');
    write(path.join(nm, 'semi-ui-react/dist/button.scss'), BUTTON_SCSS);
    write(path.join(nm, 'semi-ui-react/dist/variables.scss'), VARIABLES_SCSS);

    write(path.join(nm, 'semi-ui-solid/package.json'), packageJson('ui-solid', { '@fibrae/semi-foundation': '0.0.0' }));
    write(path.join(nm, 'semi-ui-solid/dist/sample.jsx'), "import './sample.css';\nexport const sample = 'ui-solid';\n");
    write(path.join(nm, 'semi-ui-solid/dist/sample.css'), '.plain-ui-solid { color: green; }\n');
    write(path.join(nm, 'semi-ui-solid/dist/sample.scss'), '@use "semi:theme" as *;\n.#{$prefix}-ui-solid { color: $color-primary; }\n');
    // ai-solid depends on foundation directly, as the published package does
    write(path.join(nm, 'semi-ai-solid/package.json'), packageJson('ai-solid', { '@fibrae/semi-ai-foundation': '0.0.0', '@fibrae/semi-foundation': '0.0.0' }));
    write(path.join(nm, 'semi-ai-foundation/package.json'), JSON.stringify({ name: '@fibrae/semi-ai-foundation', version: '0.0.0', dependencies: { '@fibrae/semi-foundation': '0.0.0', 'cjs-dep': '0.0.0' }, exports: { './package.json': './package.json', './*': './dist/*.js' } }));

    for (const name of ['ui-vue', 'icons-vue', 'ai-react', 'ai-vue']) {
        write(path.join(nm, `semi-${name}/package.json`), packageJson(name));
        write(path.join(nm, `semi-${name}/dist/sample.js`), `import './sample.css';\nexport const sample = '${name}';\n`);
        write(path.join(nm, `semi-${name}/dist/sample.css`), `.plain-${name} { color: green; }\n`);
        write(path.join(nm, `semi-${name}/dist/sample.scss`), `@use "semi:theme" as *;\n.#{$prefix}-${name} { color: $color-primary; }\n`);
    }
}

setupFixtureNodeModules();

async function runCase(label: string, options: SemiVitePluginOptions, entry = 'src/entry.js') {
    const outDir = path.join(__dirname, 'dist', label);
    fs.rmSync(outDir, { recursive: true, force: true });

    await build({
        root: fixture,
        logLevel: 'error',
        configFile: false,
        build: {
            outDir,
            emptyOutDir: true,
            lib: {
                entry: path.join(fixture, entry),
                name: 'fixture',
                formats: ['es'],
                fileName: 'entry',
            },
            cssCodeSplit: false,
            rollupOptions: {
                output: { assetFileNames: 'assets/[name][extname]' },
            },
        },
        plugins: [semiTheming(options)],
    });

    const jsFile = fs.readdirSync(outDir).find((f) => /\.(c|m)?js$/.test(f));
    const assetsDir = path.join(outDir, 'assets');
    const cssFile = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir).find((f) => f.endsWith('.css')) : undefined;

    const jsContent = jsFile ? fs.readFileSync(path.join(outDir, jsFile), 'utf-8') : '';
    const cssContent = cssFile ? fs.readFileSync(path.join(assetsDir, cssFile), 'utf-8') : '';

    return { jsContent, cssContent, hasCss: Boolean(cssFile) };
}

console.log('== case 1: prefixCls + cssLayer ==');
{
    const { jsContent, cssContent } = await runCase('full', {
        prefixCls: 'qiang',
        cssLayer: true,
    });
    console.log('CSS:', cssContent);
    assert.match(cssContent, /@layer\s+semi/, 'cssLayer wrapper should be present');
    assert.match(cssContent, /\.qiang-button/, 'prefixCls should rewrite selector');
    assert.match(cssContent, /color:\s*red/, 'semi:theme comes from semi-foundation/theme');
    assert.doesNotMatch(cssContent, /\.semi-button/, 'old prefix should not appear');
    assert.match(jsContent, /BASE_CLASS_PREFIX\s*=\s*["']qiang["']/, 'env.js BASE_CLASS_PREFIX should be rewritten');
}

console.log('\n== case 2: defaults (no prefix, CSS in the semi layer) ==');
{
    const { jsContent, cssContent } = await runCase('defaults', {});
    console.log('CSS:', cssContent);
    assert.match(cssContent, /@layer\s+semi/, 'CSS is wrapped in the semi layer by default');
    assert.match(cssContent, /\.semi-button/, 'default prefix `semi` should be kept');
    assert.match(cssContent, /font-size:\s*12px/, 'the component variable should be 12px');
    assert.match(cssContent, /color:\s*red/, 'semi:theme comes from semi-foundation/theme');
    assert.match(jsContent, /BASE_CLASS_PREFIX\s*=\s*["']semi["']/, 'env.js BASE_CLASS_PREFIX should be untouched');
}

console.log('\n== case 2b: cssLayer: false (unlayered CSS) ==');
{
    const { cssContent } = await runCase('no-layer', {
        cssLayer: false,
    });
    assert.doesNotMatch(cssContent, /@layer/, 'no layer when cssLayer is false');
    assert.match(cssContent, /\.semi-button/, 'component CSS is still emitted');
}

console.log('\n== case 3: omitCss (semi pkg .css imports should be stripped) ==');
{
    const { hasCss } = await runCase(
        'omit-css',
        {
            omitCss: true,
        },
        'src/omit-entry.js'
    );
    assert.ok(!hasCss, 'no CSS bundle should be emitted when omitCss is true');
}

console.log('\n== case 3b: without omitCss (semi pkg .css imports should produce CSS) ==');
{
    const { hasCss, cssContent } = await runCase('omit-css-disabled', {}, 'src/omit-entry.js');
    assert.ok(hasCss, 'CSS bundle should be emitted when omitCss is false');
    assert.match(cssContent, /\.semi-button/, 'CSS from semi pkg should pass through');
}

console.log('\n== Vue 包的主题编译与 omitCss ==');
{
    const { cssContent } = await runCase('vue-prefix', { prefixCls: 'custom' }, 'src/vue-entry.js');
    assert.match(cssContent, /\.custom-ui-vue/, 'semi-ui-vue 应编译主题并替换前缀');
    assert.match(cssContent, /\.custom-icons-vue/, 'semi-icons-vue 应编译主题并替换前缀');
    assert.match(cssContent, /@layer\s+semi/, 'Vue 包样式应置于 semi layer');
    const { jsContent, hasCss } = await runCase('vue-omit-css', { omitCss: true }, 'src/vue-entry.js');
    assert.ok(!hasCss, 'omitCss 应移除两个 Vue 包的 CSS');
    assert.match(jsContent, /ui-vue/, 'semi-ui-vue 的 JS 应保留');
    assert.match(jsContent, /icons-vue/, 'semi-icons-vue 的 JS 应保留');
}

console.log('\n== AI 包的主题编译与 omitCss ==');
{
    const { cssContent } = await runCase('ai-prefix', { prefixCls: 'custom' }, 'src/ai-entry.js');
    assert.match(cssContent, /\.custom-ai-react/, 'semi-ai-react 应编译主题并替换前缀');
    assert.match(cssContent, /\.custom-ai-vue/, 'semi-ai-vue 应编译主题并替换前缀');
    assert.match(cssContent, /@layer\s+semi/, 'AI 包样式应置于 semi layer');
    const { jsContent, hasCss } = await runCase('ai-omit-css', { omitCss: true }, 'src/ai-entry.js');
    assert.ok(!hasCss, 'omitCss 应移除两个 AI 包的 CSS');
    assert.match(jsContent, /ai-react/, 'semi-ai-react 的 JS 应保留');
    assert.match(jsContent, /ai-vue/, 'semi-ai-vue 的 JS 应保留');
}

console.log('\n== Solid 包的 .jsx 产物：主题编译与 omitCss ==');
{
    const { cssContent } = await runCase('solid-prefix', { prefixCls: 'custom' }, 'src/solid-entry.js');
    assert.match(cssContent, /\.custom-ui-solid/, 'semi-ui-solid 的 .jsx 导入的样式应编译主题并替换前缀');
    const { jsContent, hasCss } = await runCase('solid-omit-css', { omitCss: true }, 'src/solid-entry.js');
    assert.ok(!hasCss, 'omitCss 应移除 .jsx 中的 CSS 导入');
    assert.match(jsContent, /ui-solid/, 'semi-ui-solid 的 JS 应保留');
}

console.log('\n== server 环境的 noExternal ==');
{
    // Nuxt leaves `consumer` unset; React Router's serverBundles adds environments named ssrBundle_*
    const config = await resolveConfig({ root: fixture, configFile: false, logLevel: 'error', plugins: [semiTheming()], environments: { ssr: {}, ssrBundle_a: {}, ssrBundle_b: {}, browser: { consumer: 'client' } } }, 'build');
    const noExternalOf = (name: string) => config.environments[name].resolve.noExternal;
    const [pattern] = noExternalOf('ssr') as RegExp[];
    assert.ok(pattern instanceof RegExp, 'ssr 环境（consumer 未设）应打进 Semi 包');
    for (const name of ['ssrBundle_a', 'ssrBundle_b']) {
        assert.deepStrictEqual(noExternalOf(name), [pattern], `${name} 环境（consumer 未设）应打进 Semi 包`);
    }
    for (const name of ['client', 'browser']) {
        assert.deepStrictEqual(noExternalOf(name), [], `${name} 环境不设 noExternal`);
    }
    assert.ok(pattern.test('/app/node_modules/.pnpm/@fibrae+semi-ui-vue@0.0.0/node_modules/@fibrae/semi-ui-vue/dist/button/index.js'), 'Nuxt dev 的 vite-node 按绝对路径匹配');
    for (const id of ['@fibrae/semi-ui-react', '@fibrae/semi-ai-vue/chat', '@fibrae/semi-icons-react', '@fibrae/semi-illustrations-vue']) {
        assert.ok(pattern.test(id), `${id} 应打进服务端产物`);
    }
    for (const id of ['@fibrae/semi-foundation/env', '@fibrae/semi-ui-solid', '@fibrae/semi-icons-core', '@fibrae/semi-ui-reactive']) {
        assert.ok(!pattern.test(id), `${id} 保持 external`);
    }

    // foundation 持有 BASE_CLASS_PREFIX：设了 prefixCls 时必须打进服务端产物，类名才与客户端一致
    const prefixed = await resolveConfig({ root: fixture, configFile: false, logLevel: 'error', plugins: [semiTheming({ prefixCls: 'my' })], environments: { ssr: {}, browser: { consumer: 'client' } } }, 'build');
    const [, foundation] = prefixed.environments.ssr.resolve.noExternal as RegExp[];
    assert.ok(foundation instanceof RegExp, 'prefixCls 时 ssr 环境追加 foundation');
    for (const id of ['@fibrae/semi-foundation/button/constants', '@fibrae/semi-ai-foundation/chat/foundation', '/app/node_modules/@fibrae/semi-foundation/dist/base/env.js']) {
        assert.ok(foundation.test(id), `${id} 在 prefixCls 下打进服务端产物`);
    }
    assert.deepStrictEqual(prefixed.environments.browser.resolve.noExternal, [], 'prefixCls 时客户端环境仍不设 noExternal');

    // vite-plugin-solid 在 dev 中把 foundation 写进 ssr 的 resolve.external，Vite 先查 external 再查 noExternal
    const solidLike: PluginOption = {
        name: 'solid-like-external',
        enforce: 'pre',
        configEnvironment(name, config) {
            if (name === 'ssr') {
                config.resolve ??= {};
                config.resolve.external = [...(Array.isArray(config.resolve.external) ? config.resolve.external : []), '@fibrae/semi-foundation', '@fibrae/semi-icons-core'];
            }
        },
    };
    const ssrExternal = async (plugins: PluginOption[]) => (await resolveConfig({ root: fixture, configFile: false, logLevel: 'error', plugins, environments: { ssr: {} } }, 'serve')).environments.ssr.resolve.external;
    for (const order of [
        [solidLike, semiTheming({ prefixCls: 'my' })],
        [semiTheming({ prefixCls: 'my' }), solidLike],
    ]) {
        assert.deepStrictEqual(await ssrExternal(order), ['@fibrae/semi-icons-core'], 'prefixCls 时无论插件顺序，foundation 都移出 ssr 的 external');
    }
    assert.deepStrictEqual(await ssrExternal([solidLike, semiTheming()]), ['@fibrae/semi-foundation', '@fibrae/semi-icons-core'], '不设 prefixCls 时 external 保持原样');
}

console.log('\n== React 包的 "use client" 警告 ==');
{
    const directiveWarnings = async (plugins: PluginOption[]) => {
        const seen: string[] = [];
        await build({
            root: fixture,
            logLevel: 'silent',
            configFile: false,
            build: {
                write: false,
                lib: { entry: path.join(fixture, 'src/client-entry.js'), formats: ['es'], fileName: 'entry' },
                rolldownOptions: {
                    onLog(_level, log) {
                        seen.push(log.code ?? '');
                    },
                },
            },
            plugins,
        });
        return seen.filter((code) => code === 'MODULE_LEVEL_DIRECTIVE');
    };
    assert.ok((await directiveWarnings([])).length > 0, '没有插件时 rolldown 对 "use client" 模块告警');
    assert.deepStrictEqual(await directiveWarnings([semiTheming()]), [], 'Semi React 包的指令警告被丢弃');
}

console.log('\n== Solid 的 optimizeDeps.include ==');
{
    const { optimizeDeps } = await resolveConfig({ root: fixture, configFile: false, logLevel: 'error', plugins: [semiTheming()] }, 'serve');
    assert.deepStrictEqual(
        optimizeDeps.include,
        [
            '@fibrae/semi-ui-solid > @fibrae/semi-foundation > cjs-dep',
            '@fibrae/semi-ui-solid > @fibrae/semi-foundation > subpath-only/x',
            '@fibrae/semi-ui-solid > @fibrae/semi-foundation > subpath-only/esm',
            '@fibrae/semi-ai-solid > @fibrae/semi-ai-foundation > cjs-dep',
            '@fibrae/semi-ai-solid > @fibrae/semi-foundation > cjs-dep',
            '@fibrae/semi-ai-solid > @fibrae/semi-foundation > subpath-only/x',
            '@fibrae/semi-ai-solid > @fibrae/semi-foundation > subpath-only/esm',
        ],
        'foundation 与 ai-foundation 的依赖经直接依赖它们的每个 Solid 包预构建：有根入口的列包名，只有子路径导出的逐个列出子路径（含只有 import 条件的，不含 ./package.json）；只有通配导出的 Semi 自身 foundation 不列入'
    );

    // pnpm strict: an app that installs only ai-solid cannot resolve ui-solid from its root, so foundation is reachable
    // only through ai-solid. The root sits under test/dist, outside fixture/node_modules that holds ui-solid
    const aiOnly = path.join(__dirname, 'dist', 'ai-only');
    fs.rmSync(aiOnly, { recursive: true, force: true });
    const aiOnlyModules = path.join(aiOnly, 'node_modules');
    const aiOnlyPackage = (name: string, dependencies: Record<string, string>) => JSON.stringify({ name, version: '0.0.0', dependencies, exports: { './package.json': './package.json' } });
    write(path.join(aiOnly, 'package.json'), '{}');
    write(path.join(aiOnlyModules, 'cjs-dep/package.json'), JSON.stringify({ name: 'cjs-dep', version: '0.0.0', main: 'index.js' }));
    write(path.join(aiOnlyModules, 'cjs-dep/index.js'), 'module.exports = 1;\n');
    write(path.join(aiOnlyModules, '@fibrae/semi-foundation/package.json'), aiOnlyPackage('@fibrae/semi-foundation', { 'cjs-dep': '0.0.0' }));
    write(path.join(aiOnlyModules, '@fibrae/semi-ai-foundation/package.json'), aiOnlyPackage('@fibrae/semi-ai-foundation', { 'cjs-dep': '0.0.0' }));
    write(path.join(aiOnlyModules, '@fibrae/semi-ai-solid/package.json'), aiOnlyPackage('@fibrae/semi-ai-solid', { '@fibrae/semi-ai-foundation': '0.0.0', '@fibrae/semi-foundation': '0.0.0' }));
    const aiOnlyConfig = await resolveConfig({ root: aiOnly, configFile: false, logLevel: 'error', plugins: [semiTheming()] }, 'serve');
    assert.deepStrictEqual(aiOnlyConfig.optimizeDeps.include, ['@fibrae/semi-ai-solid > @fibrae/semi-ai-foundation > cjs-dep', '@fibrae/semi-ai-solid > @fibrae/semi-foundation > cjs-dep'], '解析不到 ui-solid 时，foundation 的依赖仍经 ai-solid 列入');

    // pnpm's bin shims set NODE_PATH to the hoisted `.pnpm/node_modules`, where `require` reaches ui-solid although Vite
    // does not. Node reads NODE_PATH only at startup, so the same root is resolved again in a child process
    const script = `import { resolveConfig } from 'vite';
import { semiTheming } from ${JSON.stringify(pathToFileURL(path.join(__dirname, '../dist/index.mjs')).href)};
const config = await resolveConfig({ root: ${JSON.stringify(aiOnly)}, configFile: false, logLevel: 'error', plugins: [semiTheming()] }, 'serve');
console.log(JSON.stringify(config.optimizeDeps.include));
`;
    const output = execFileSync(process.execPath, ['--input-type=module', '--eval', script], { cwd: __dirname, encoding: 'utf-8', env: { ...process.env, NODE_PATH: path.join(fixture, 'node_modules') } });
    assert.deepStrictEqual(JSON.parse(output.trim().split('\n').at(-1) ?? ''), aiOnlyConfig.optimizeDeps.include, 'NODE_PATH 上有 ui-solid 时，不列出 Vite 解析不到的链');
}

console.log('\n== dev 预构建剥离组件 CSS ==');
{
    // Dev serves semi-ui-react from the dependency pre-bundle, which the plugin's transform hook never sees
    const preBundled = async (options: SemiVitePluginOptions) => {
        const server = await createServer({
            root: fixture,
            logLevel: 'error',
            configFile: false,
            plugins: [semiTheming(options)],
            optimizeDeps: { include: ['@fibrae/semi-ui-react/button'], noDiscovery: true, force: true },
            server: { middlewareMode: true, ws: false },
        });
        try {
            const entry = await server.transformRequest('/src/omit-entry.js');
            const depUrl = entry?.code.match(/from ["']([^"']*\.vite\/deps\/@fibrae_semi-ui-react_button\.js[^"']*)["']/)?.[1];
            assert.ok(depUrl, 'semi-ui-react/button is served from the dependency pre-bundle');
            return (await server.transformRequest(depUrl))?.code ?? '';
        } finally {
            await server.close();
        }
    };
    assert.match(await preBundled({}), /button\.css/, '不开 omitCss 时预构建保留 CSS 导入');
    assert.doesNotMatch(await preBundled({ omitCss: true }), /import\s+["'][^"']+\.css["']/, 'omitCss 也作用于 dev 预构建');
}

console.log('\nAll assertions passed');
