import { existsSync, globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vite-plus/test';
import * as exported from '@fibrae/semi-ai-vue';

const root = path.resolve(import.meta.dirname, '..');
const uiVueRoot = path.resolve(root, '../../semi-ui-vue/src');

function collect(value: unknown, depth: number): object[] {
    if (!value || typeof value !== 'object' || depth > 2) {
        return [];
    }
    return [value, ...Object.values(value).flatMap((child) => collect(child, depth + 1))];
}

describe('所有导出组件', () => {
    it('Boolean 有 default，Function 默认值为 undefined', () => {
        const violations: string[] = [];
        for (const component of Object.values(exported).flatMap((value) => collect(value, 0))) {
            if (!('props' in component) || !component.props || typeof component.props !== 'object') {
                continue;
            }
            for (const [key, option] of Object.entries(component.props as Record<string, { type?: unknown; default?: unknown } | null>)) {
                // `prop: null` is Vue's any-type declaration, neither Boolean nor Function
                if (option === null) {
                    continue;
                }
                const types = [option.type].flat();
                if (types.includes(Boolean) && !Object.hasOwn(option, 'default')) {
                    violations.push(`${key}: Boolean prop must declare default`);
                }
                if (types.includes(Function) && option.default !== undefined) {
                    violations.push(`${key}: Function prop must use undefined default`);
                }
            }
        }
        expect(violations).toEqual([]);
    });
});

describe('源码约定', () => {
    // The website's plugin-react sets a global React importSource that only the per-file pragma overrides
    it('每个 .tsx 首行声明 @jsxImportSource vue', () => {
        const files = globSync('**/*.tsx', { cwd: root });
        const missing = files.filter((file) => readFileSync(path.join(root, file), 'utf8').split('\n', 1)[0] !== '/** @jsxImportSource vue */');
        expect(missing).toEqual([]);
    });

    // A bare SFC subpath does not resolve (no `.vue` in resolve.extensions), a `.vue` one is published as `.vue.js`
    // which `./*` does not map, and lib files must not reach the root index (vitest/packed asserts it)
    it('不按子路径导入 semi-ui-vue 的 .vue 文件，也不导入其根入口', () => {
        const files = globSync('**/*.{ts,tsx,vue}', { cwd: root, exclude: ['**/__tests__/**'] });
        const violations = files.flatMap((file) =>
            [...readFileSync(path.join(root, file), 'utf8').matchAll(/['"]@fibrae\/semi-ui-vue(\/[^'"]*)?['"]/g)]
                .map(([specifier, subpath]) => ({ specifier, subpath }))
                .filter(({ subpath }) => !subpath || subpath.endsWith('.vue') || !['.ts', '.tsx'].some((ext) => existsSync(path.join(uiVueRoot, `${subpath}${ext}`))))
                .map(({ specifier }) => `${file}: ${specifier}`)
        );
        expect(violations).toEqual([]);
    });
});
