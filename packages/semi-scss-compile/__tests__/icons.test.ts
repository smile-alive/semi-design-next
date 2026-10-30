import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, beforeAll, expect, it } from 'vite-plus/test';
import { resolveFoundationPath, resolveIconPath } from '../src/icons';

// pnpm's isolated layout: the app links only scss-compile, whose own dependencies sit beside its real directory in
// .pnpm; neither semi-icons-core nor semi-foundation is installed in the app
let root: string;
let app: string;
function write(file: string, text: string) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
}

beforeAll(() => {
    root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'semi-icons-')));
    const store = path.join(root, 'node_modules/.pnpm/scss-compile@1/node_modules/@fibrae');
    write(path.join(store, 'semi-scss-compile/dist/index.mjs'), '');
    // the real exports map, so a change to it breaks this test
    const iconsCore = fs.readFileSync(path.resolve(import.meta.dirname, '../../semi-icons-core/package.json'), 'utf8');
    write(path.join(store, 'semi-icons-core/package.json'), iconsCore);
    write(path.join(store, 'semi-icons-core/dist/styles/icons.scss'), '');
    const foundation = fs.readFileSync(path.resolve(import.meta.dirname, '../../semi-foundation/package.json'), 'utf8');
    write(path.join(store, 'semi-foundation/package.json'), foundation);
    app = path.join(root, 'app');
    fs.mkdirSync(path.join(app, 'node_modules/@fibrae'), { recursive: true });
    fs.symlinkSync(path.join(store, 'semi-scss-compile'), path.join(app, 'node_modules/@fibrae/semi-scss-compile'));
});

afterAll(() => {
    fs.rmSync(root, { recursive: true, force: true });
});

// Node reports a loaded module by its real path, which is what import.meta.url holds
const compiledFrom = () => pathToFileURL(fs.realpathSync(path.join(app, 'node_modules/@fibrae/semi-scss-compile/dist/index.mjs')));

it('在 pnpm 隔离布局下，从 scss-compile 自身的依赖解析 icons-core 的 dist', () => {
    expect(fs.existsSync(path.join(app, 'node_modules/@fibrae/semi-icons-core'))).toBe(false);
    expect(resolveIconPath(compiledFrom())).toBe(path.join(root, 'node_modules/.pnpm/scss-compile@1/node_modules/@fibrae/semi-icons-core/dist'));
});

it('在 pnpm 隔离布局下，从 scss-compile 自身的依赖解析 foundation 的 dist', () => {
    expect(fs.existsSync(path.join(app, 'node_modules/@fibrae/semi-foundation'))).toBe(false);
    expect(resolveFoundationPath(compiledFrom())).toBe(path.join(root, 'node_modules/.pnpm/scss-compile@1/node_modules/@fibrae/semi-foundation/dist'));
});
