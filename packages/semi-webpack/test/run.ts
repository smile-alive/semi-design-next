#!/usr/bin/env node
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import webpack from 'webpack';
import SemiWebpackPlugin, { type SemiWebpackPluginOptions } from '../dist/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(__dirname, 'fixture');

function write(p: string, content: string) {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
}

function writePackageJson(nm: string, name: string, fields: Record<string, unknown> = {}) {
    const pkg = { name: `@fibrae/${name}`, version: '0.0.0', ...fields };
    write(path.join(nm, name, 'package.json'), JSON.stringify(pkg, null, 2));
}

function setupFixtureNodeModules() {
    const nm = path.join(fixture, 'node_modules', '@fibrae');
    fs.rmSync(nm, { recursive: true, force: true });

    writePackageJson(nm, 'semi-foundation', {
        exports: { './*.css': './dist/*.css', './*.scss': './dist/*.scss', './package.json': './package.json', './*': './dist/*.js' },
    });
    // The theme `semi:theme` serves, at the published path semi-foundation/dist/theme/
    write(path.join(nm, 'semi-foundation/dist/theme/index.scss'), "$prefix: 'semi';\n$color-primary: red;\n");
    write(path.join(nm, 'semi-foundation/dist/button/button.scss'), '@use "semi:theme" as *;\n@use "variables" as *;\n\n.#{$prefix}-button {\n    color: $color-primary;\n    font-size: $font-size-small;\n}\n');
    write(path.join(nm, 'semi-foundation/dist/button/variables.scss'), '@use "semi:theme" as *;\n\n$font-size-small: 12px;\n');
    write(path.join(nm, 'semi-foundation/dist/button/button.css'), '/* placeholder */\n');
    write(path.join(nm, 'semi-foundation/dist/base/env.js'), "export const BASE_CLASS_PREFIX = 'semi';\n");

    const uiExports = { '.': './dist/index.js', './styles.css': './dist/styles.css', './package.json': './package.json', './*': './dist/*.js' };
    writePackageJson(nm, 'semi-ui-react', { exports: { ...uiExports, './tailwind.css': './dist/tailwind.css' } });
    write(path.join(nm, 'semi-ui-react/dist/button/index.js'), "import '@fibrae/semi-foundation/button/button.css';\n\nexport function Button() {\n    return 'button';\n}\n");

    for (const name of ['ui-vue', 'icons-vue', 'ai-react', 'ai-vue']) {
        const exports = name === 'icons-vue' ? { '.': './dist/index.js', './lab': './dist/lab/index.js', './package.json': './package.json', './*': './dist/*.js' } : name === 'ui-vue' ? { ...uiExports, './tailwind.css': './dist/tailwind.css' } : uiExports;
        writePackageJson(nm, `semi-${name}`, { exports });
        write(path.join(nm, `semi-${name}/dist/sample.js`), `import './sample.css';\nexport const sample = '${name}';\n`);
        write(path.join(nm, `semi-${name}/dist/sample.css`), `.plain-${name} { color: green; }\n`);
        write(path.join(nm, `semi-${name}/dist/sample.scss`), `@use "semi:theme" as *;\n.#{$prefix}-${name} { color: $color-primary; }\n`);
    }
}

setupFixtureNodeModules();

function runCase(label: string, options: SemiWebpackPluginOptions, entry = './src/entry.js') {
    const outDir = path.join(__dirname, 'dist', label);
    const compiler = webpack({
        mode: 'none',
        devtool: false,
        context: fixture,
        entry,
        output: { path: outDir, filename: 'bundle.js', clean: true },
        plugins: [new SemiWebpackPlugin(options)],
    });
    return new Promise<string>((resolve, reject) => {
        compiler.run((err, stats) => {
            compiler.close(() => {});
            if (err) return reject(err);
            if (stats.hasErrors()) return reject(new Error(stats.toString('errors-only')));
            resolve(fs.readFileSync(path.join(outDir, 'bundle.js'), 'utf-8'));
        });
    });
}

console.log('== case 1: defaults (default prefix) ==');
{
    const bundle = await runCase('defaults', {});
    assert.match(bundle, /\.semi-button/, 'default prefix `semi` should be kept');
    assert.match(bundle, /color: red/, 'semi:theme comes from semi-foundation/theme');
    assert.match(bundle, /font-size: 12px/, 'the component variable should be 12px');
    assert.match(bundle, /BASE_CLASS_PREFIX = 'semi'/, 'env.js BASE_CLASS_PREFIX should be untouched');
    assert.doesNotMatch(bundle, /\/\/ import '[^']+\.css'/, 'css import should not be commented out');
    assert.match(bundle, /@layer\s+semi/, 'CSS is wrapped in the semi layer by default');
}

console.log('== case 1b: cssLayer: false (unlayered CSS) ==');
{
    const bundle = await runCase('no-layer', { cssLayer: false });
    assert.match(bundle, /\.semi-button/, 'component CSS is still emitted');
    // style-loader's runtime has `@layer` code of its own, so match the layer name
    assert.doesNotMatch(bundle, /@layer\s+semi/, 'no layer when cssLayer is false');
}

console.log('== case 3: prefixCls (selector and BASE_CLASS_PREFIX rewritten) ==');
{
    const bundle = await runCase('prefix', { prefixCls: 'custom' });
    assert.match(bundle, /\.custom-button/, 'prefixCls should rewrite the selector');
    assert.doesNotMatch(bundle, /\.semi-button/, 'old prefix should not appear');
    assert.match(bundle, /BASE_CLASS_PREFIX = ["']custom["']/, 'env.js BASE_CLASS_PREFIX should be rewritten');
}

console.log('== case 4: omitCss (semi package .css imports stripped) ==');
{
    const bundle = await runCase('omit-css', { omitCss: true });
    assert.match(bundle, /\/\/ import '[^']+\/button\.css'/, 'css import should be commented out');
    assert.doesNotMatch(bundle, /semi-button/, 'no semi CSS should be bundled');
}

console.log('== case 4b: omitCss + prefixCls (JS prefix rewritten for a prebuilt stylesheet) ==');
{
    const bundle = await runCase('omit-css-prefix', { omitCss: true, prefixCls: 'custom' });
    assert.match(bundle, /BASE_CLASS_PREFIX = ["']custom["']/, 'env.js BASE_CLASS_PREFIX should be rewritten');
    assert.doesNotMatch(bundle, /custom-button \{/, 'no semi CSS should be bundled');
}

console.log('\n== Vue 包的主题编译与 omitCss ==');
{
    const bundle = await runCase('vue-prefix', { prefixCls: 'custom' }, './src/vue-entry.js');
    assert.match(bundle, /\.custom-ui-vue/, 'semi-ui-vue 应编译主题并替换前缀');
    assert.match(bundle, /\.custom-icons-vue/, 'semi-icons-vue 应编译主题并替换前缀');
    assert.match(bundle, /@layer\s+semi/, 'Vue 包样式应置于 semi layer');
    const omitted = await runCase('vue-omit-css', { omitCss: true }, './src/vue-entry.js');
    assert.doesNotMatch(omitted, /@layer\s+semi/, 'omitCss 应移除两个 Vue 包的 CSS');
    assert.match(omitted, /ui-vue/, 'semi-ui-vue 的 JS 应保留');
    assert.match(omitted, /icons-vue/, 'semi-icons-vue 的 JS 应保留');
    assert.equal((omitted.match(/\/\/ import '\.\/sample\.css'/g) ?? []).length, 2, '两个 Vue 包都应移除样式导入');
}

console.log('\n== AI 包的主题编译与 omitCss ==');
{
    const bundle = await runCase('ai-prefix', { prefixCls: 'custom' }, './src/ai-entry.js');
    assert.match(bundle, /\.custom-ai-react/, 'semi-ai-react 应编译主题并替换前缀');
    assert.match(bundle, /\.custom-ai-vue/, 'semi-ai-vue 应编译主题并替换前缀');
    assert.match(bundle, /@layer\s+semi/, 'AI 包样式应置于 semi layer');
    const omitted = await runCase('ai-omit-css', { omitCss: true }, './src/ai-entry.js');
    assert.doesNotMatch(omitted, /@layer\s+semi/, 'omitCss 应移除两个 AI 包的 CSS');
    assert.match(omitted, /ai-react/, 'semi-ai-react 的 JS 应保留');
    assert.match(omitted, /ai-vue/, 'semi-ai-vue 的 JS 应保留');
    assert.equal((omitted.match(/\/\/ import '\.\/sample\.css'/g) ?? []).length, 2, '两个 AI 包都应移除样式导入');
}

console.log('\nAll assertions passed');
