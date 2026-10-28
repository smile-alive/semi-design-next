import { describe, expect, it } from 'vite-plus/test';
import globalTypes from '../semi-global.ts?raw';

const sources = import.meta.glob<string>(['../../*/**/*.{ts,tsx}', '!../../**/__tests__/**', '!../../_utils/semi-global.ts'], {
    eager: true,
    query: '?raw',
    import: 'default',
});

const declared = [...globalTypes.matchAll(/^ {4}(\w+)\?: GlobalDefaults</gm)].map((match) => match[1]);
const consumed = new Set(Object.values(sources).flatMap((source) => [...source.matchAll(/useDefaultProps\(\s*'(\w+)'/g)].map((match) => match[1])));

describe('overrideDefaultProps 覆盖所有顶层组件 (F7)', () => {
    it('semi-global 声明的每个组件名都有组件读取全局默认值', () => {
        expect(declared.length).toBeGreaterThan(90);
        expect(declared.filter((name) => !consumed.has(name))).toEqual([]);
    });

    it('每个读取全局默认值的组件名都在 semi-global 中声明', () => {
        expect([...consumed].filter((name) => !declared.includes(name))).toEqual([]);
    });
});
