#!/usr/bin/env node
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rspack, type Stats } from '@rspack/core';
import { SemiRspackPlugin, type SemiWebpackPluginOptions } from '../dist/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(__dirname, 'fixture');

function write(p: string, content: string) {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
}

// Shipped stylesheets load the theme through the plugin's `semi:theme` importer
const componentScss = '@use "semi:theme" as *;\n@use "variables" as *;\n\n.#{$prefix}-button {\n    color: $color-primary;\n    font-size: $font-size-small;\n}\n';

function setupFixtureNodeModules() {
    const nm = path.join(fixture, 'node_modules', '@fibrae');
    fs.rmSync(nm, { recursive: true, force: true });

    // The theme `semi:theme` serves, at the published path semi-foundation/dist/theme/
    write(path.join(nm, 'semi-foundation/dist/theme/index.scss'), "$prefix: 'semi';\n$color-primary: red;\n");
    write(path.join(nm, 'semi-foundation/dist/env.js'), "export const BASE_CLASS_PREFIX = 'semi';\n");

    write(path.join(nm, 'semi-ui-react/dist/button.js'), "import './button.css';\n\nexport function Button() {\n    return 'button';\n}\n");
    write(path.join(nm, 'semi-ui-react/dist/env.js'), "export const BASE_CLASS_PREFIX = 'semi';\n");
    write(path.join(nm, 'semi-ui-react/dist/button.css'), '.semi-button-plain-css { color: green; }\n');
    write(path.join(nm, 'semi-ui-react/dist/button.scss'), componentScss);
    write(path.join(nm, 'semi-ui-react/dist/variables.scss'), '@use "semi:theme" as *;\n\n$font-size-small: 12px;\n');

    // Published subpath exports: `semi:theme` resolves `@fibrae/semi-foundation/theme/index.scss` through them
    const uiExports = { '.': './dist/index.js', './styles.css': './dist/styles.css', './package.json': './package.json', './*': './dist/*.js' };
    write(
        path.join(nm, 'semi-foundation/package.json'),
        JSON.stringify({
            name: '@fibrae/semi-foundation',
            version: '0.0.0',
            exports: { './*.css': './dist/*.css', './*.scss': './dist/*.scss', './package.json': './package.json', './*': './dist/*.js' },
        })
    );
    write(
        path.join(nm, 'semi-ui-react/package.json'),
        JSON.stringify({
            name: '@fibrae/semi-ui-react',
            version: '0.0.0',
            exports: { ...uiExports, './tailwind.css': './dist/tailwind.css' },
        })
    );

    for (const name of ['ui-vue', 'icons-vue', 'ai-react', 'ai-vue']) {
        const exports = name === 'icons-vue' ? { '.': './dist/index.js', './lab': './dist/lab/index.js', './package.json': './package.json', './*': './dist/*.js' } : name === 'ui-vue' ? { ...uiExports, './tailwind.css': './dist/tailwind.css' } : uiExports;
        write(path.join(nm, `semi-${name}/package.json`), JSON.stringify({ name: `@fibrae/semi-${name}`, exports }));
        write(path.join(nm, `semi-${name}/dist/sample.js`), `import './sample.css';\nexport const sample = '${name}';\n`);
        write(path.join(nm, `semi-${name}/dist/sample.css`), `.plain-${name} { color: green; }\n`);
        write(path.join(nm, `semi-${name}/dist/sample.scss`), `@use "semi:theme" as *;\n.#{$prefix}-${name} { color: $color-primary; }\n`);
    }
}

setupFixtureNodeModules();

async function runCase(label: string, options: SemiWebpackPluginOptions, entry = 'src/entry.js') {
    const outDir = path.join(__dirname, 'dist', label);
    fs.rmSync(outDir, { recursive: true, force: true });

    const stats = await new Promise<Stats>((resolve, reject) => {
        rspack(
            {
                mode: 'none',
                context: fixture,
                entry: path.join(fixture, entry),
                output: { path: outDir, filename: 'entry.js', cssFilename: 'entry.css' },
                module: { rules: [{ test: /\.s?css$/, type: 'css' }] },
                plugins: [new SemiRspackPlugin(options)],
            },
            (err, result) => (err ? reject(err) : resolve(result))
        );
    });
    assert.ok(!stats.hasErrors(), stats.toString({ all: false, errors: true }));

    const read = (f: string) => (fs.existsSync(path.join(outDir, f)) ? fs.readFileSync(path.join(outDir, f), 'utf-8') : '');
    return {
        jsContent: read('entry.js'),
        cssContent: read('entry.css'),
        hasCss: fs.existsSync(path.join(outDir, 'entry.css')),
    };
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
    assert.doesNotMatch(cssContent, /\.semi-button/, 'old prefix should not appear');
    assert.match(cssContent, /color:\s*red/, 'semi:theme comes from semi-foundation/theme');
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
    const { cssContent } = await runCase('no-layer', { cssLayer: false });
    assert.doesNotMatch(cssContent, /@layer/, 'no layer when cssLayer is false');
    assert.match(cssContent, /\.semi-button/, 'component CSS is still emitted');
}

console.log('\n== case 3: omitCss (semi pkg .css imports should be stripped) ==');
{
    const { jsContent, hasCss } = await runCase('omit-css', { omitCss: true }, 'src/omit-entry.js');
    assert.ok(!hasCss, 'no CSS bundle should be emitted when omitCss is true');
    assert.match(jsContent, /\/\/ import '\.\/button\.css'/, 'css import should be commented out');
}

console.log('\n== case 3c: omitCss + prefixCls (JS prefix rewritten for a prebuilt stylesheet) ==');
{
    const { jsContent, hasCss } = await runCase('omit-css-prefix', { omitCss: true, prefixCls: 'qiang' });
    assert.ok(!hasCss, 'no CSS bundle should be emitted when omitCss is true');
    assert.match(jsContent, /BASE_CLASS_PREFIX\s*=\s*["']qiang["']/, 'env.js BASE_CLASS_PREFIX should be rewritten');
}

console.log('\n== case 3b: without omitCss (semi pkg .css imports should produce CSS) ==');
{
    const { hasCss, cssContent } = await runCase('omit-css-disabled', {}, 'src/omit-entry.js');
    assert.ok(hasCss, 'CSS bundle should be emitted when omitCss is false');
    assert.match(cssContent, /\.semi-button/, 'semi pkg style should pass through');
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
    assert.equal((jsContent.match(/\/\/ import '\.\/sample\.css'/g) ?? []).length, 2, '两个 Vue 包都应移除样式导入');
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
    assert.equal((jsContent.match(/\/\/ import '\.\/sample\.css'/g) ?? []).length, 2, '两个 AI 包都应移除样式导入');
}

console.log('\nAll assertions passed');
