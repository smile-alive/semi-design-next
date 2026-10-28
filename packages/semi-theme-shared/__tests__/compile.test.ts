import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as sass from 'sass';
import { expect, it } from 'vite-plus/test';
import { compileSemiScss, semiImporters } from '../src/index';

const packagesDir = path.resolve(import.meta.dirname, '../..');
const foundationPath = path.join(packagesDir, 'semi-foundation/src');
const options = {
    resolveFoundation: (subpath: string) => path.join(foundationPath, `${subpath}.scss`),
};

it('semi:theme 来自 semi-foundation/theme，输出包在 @layer semi 中', () => {
    const requested: string[] = [];
    const { css, loadedFiles } = compileSemiScss(path.join(foundationPath, 'button/button.scss'), {
        resolveFoundation: (subpath) => {
            requested.push(subpath);
            return options.resolveFoundation(subpath);
        },
    });
    expect(requested).toContain('theme/index');
    expect(loadedFiles).toContain(path.join(foundationPath, 'theme/variables.scss'));
    expect(css).toMatch(/^@layer semi\s*\{/);
    expect(css).toContain('.semi-button');
});

it('prefixCls 同时改写组件类名和 global.scss 中的明暗子树类名', () => {
    const button = compileSemiScss(path.join(foundationPath, 'button/button.scss'), { ...options, prefixCls: 'x' }).css;
    expect(button).toContain('.x-button');
    expect(button).not.toContain('.semi-button');
    const tokens = compileSemiScss(path.join(foundationPath, 'base/tokens.scss'), { ...options, prefixCls: 'x' }).css;
    expect(tokens).toContain('.x-always-dark');
    expect(tokens).not.toContain('.semi-always-dark');
});

it('cssLayer 为 false 时 tokens.scss 只留下 semi-base 层，不产生顶层 base 层', () => {
    const { css } = compileSemiScss(path.join(foundationPath, 'base/tokens.scss'), { ...options, cssLayer: false });
    expect(css).toContain('--semi-color-primary');
    expect([...css.matchAll(/@layer\s+([\w-]+)\s*\{/g)].map(([, name]) => name)).toEqual(['semi-base']);
    expect(css).not.toMatch(/@layer\s+base\b/);
});

it('Semi 自身样式里的弃用写法让编译失败', () => {
    const deprecated = '.a { width: percentage(0.5); }';
    expect(() => compileSemiScss(path.join(foundationPath, 'button/button.scss'), options, deprecated)).toThrow(/global-builtin|math\.percentage/);
});

it('主题入口在全部弃用项 fatal 下可编译（经 importer 加载时它们被静默）', () => {
    for (const entry of ['index.scss', 'global.scss', 'animation.scss']) {
        expect(() => compileSemiScss(path.join(foundationPath, 'theme', entry), options)).not.toThrow();
    }
});

// Semi's components do not include these mixins, but apps do through `semi:theme`, so an unused-code sweep must not
// remove them
it('semi:theme 暴露 hor-center 与 no-scrollbar mixin', () => {
    const { css } = sass.compileString('@use "semi:theme" as *;\n.a { @include hor-center; }\n.b { @include no-scrollbar; }\n', { importers: semiImporters(options) });
    expect(css).toMatch(/\.a \{\s*display: flex;\s*justify-content: center;\s*\}/);
    expect(css).toMatch(/\.b \{\s*scrollbar-width: none;\s*\}/);
    expect(css).toMatch(/\.b:hover \{\s*scrollbar-color: var\(--semi-color-fill-2\) transparent;\s*scrollbar-width: thin;/);
});

it.each(['semi-ui-react', 'semi-ui-vue'])('隔离安装下通过 %s 从图标目录或应用根目录找到 semi-foundation/theme', (uiPackage) => {
    // pnpm layout: the app sees only its UI package, while semi-foundation sits next to it in the store
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'semi-resolve-'));
    const storeScope = path.join(dir, 'store/node_modules/@fibrae');
    const write = (file: string, content: string) => {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, content);
    };
    write(path.join(storeScope, uiPackage, 'package.json'), JSON.stringify({ name: `@fibrae/${uiPackage}`, exports: { './package.json': './package.json' } }));
    write(path.join(storeScope, 'semi-foundation/package.json'), JSON.stringify({ name: '@fibrae/semi-foundation', exports: { './*.scss': './dist/*.scss' } }));
    const themeIndex = path.join(storeScope, 'semi-foundation/dist/theme/index.scss');
    write(themeIndex, '');
    const appDir = path.join(dir, 'app');
    fs.mkdirSync(path.join(appDir, 'node_modules/@fibrae'), { recursive: true });
    fs.symlinkSync(path.join(storeScope, uiPackage), path.join(appDir, 'node_modules/@fibrae', uiPackage), 'dir');
    const iconsDir = path.join(dir, 'icons/dist/styles');
    fs.mkdirSync(iconsDir, { recursive: true });
    // The pnpm bin shim of vp exports NODE_PATH (hoisted store), a global fallback that would find the repo's
    // semi-foundation; resolve in a child process without it
    const env = { ...process.env };
    delete env.NODE_PATH;
    const script = `import { resolveFoundationFromNode as r } from ${JSON.stringify(pathToFileURL(path.resolve(import.meta.dirname, '../src/theme.ts')).href)};
console.log(JSON.stringify([r('theme/index', ${JSON.stringify(iconsDir)}, ${JSON.stringify(appDir)}), r('theme/index', undefined, ${JSON.stringify(appDir)}), r('theme/index', undefined, ${JSON.stringify(iconsDir)}) ?? null]));`;
    try {
        const [fromIcons, fromApp, fromIconsOnly] = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], { env, encoding: 'utf8' }));
        expect(fromIcons).toBe(fs.realpathSync(themeIndex));
        expect(fromApp).toBe(fs.realpathSync(themeIndex));
        expect(fromIconsOnly).toBeNull();
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

// Compiles every component stylesheet in one test, so its CPU time is real work; the default timeout leaves no margin
// when the suite shares a busy machine
it('semi-foundation 的全部组件样式入口都可编译', { timeout: 20_000 }, () => {
    const files = fs.globSync('*/*.scss', { cwd: foundationPath, exclude: ['theme/**'] }).filter((file) => !path.basename(file).startsWith('_'));
    expect(files.length).toBeGreaterThan(80);
    const failures = files.flatMap((file) => {
        try {
            compileSemiScss(path.join(foundationPath, file), options);
            return [];
        } catch (error) {
            return [`${file}: ${error}`];
        }
    });
    expect(failures).toEqual([]);
});
