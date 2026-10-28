/** @jsxImportSource vue */
import { describe, expect, it } from 'vite-plus/test';
import { expectCleanServerRender, uncoveredExports } from '@test/utils/vue.ssr';
import * as ai from '..';
import { nonComponentExports, ssrCases } from './ssr-cases';

describe('守卫', () => {
    it('每个导出都有用例或在非组件清单中，清单没有过期的名字', () => {
        expect(uncoveredExports(Object.keys(ai), ssrCases, nonComponentExports)).toEqual({ uncovered: [], stale: [] });
    });
});

for (const item of ssrCases) {
    it(`${item.name}`, () => expectCleanServerRender(item));
}
