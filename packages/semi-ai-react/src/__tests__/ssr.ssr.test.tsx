import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { prerender } from 'react-dom/static';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import * as semiAi from '../index';
import { ssrCases } from './ssr-cases';

let consoleError: ReturnType<typeof vi.spyOn>;
let consoleWarn: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
    consoleError.mockRestore();
    consoleWarn.mockRestore();
});

async function prerenderToString(element: ReactElement) {
    const { prelude } = await prerender(element);
    return new Response(prelude).text();
}

describe('服务端渲染', () => {
    it('运行在没有 DOM 的环境中', () => {
        expect(typeof document).toBe('undefined');
    });

    // Lowercase exports are the data-adapter functions and getConfigureItem
    it('用例表覆盖 index.ts 的全部组件导出', () => {
        const covered = new Set(ssrCases.flatMap((ssrCase) => ssrCase.covers));
        const components = Object.keys(semiAi).filter((name) => /^[A-Z]/.test(name));
        expect(components.filter((name) => !covered.has(name))).toEqual([]);
        expect([...covered].filter((name) => !components.includes(name))).toEqual([]);
    });

    it.each(ssrCases.map((ssrCase) => [ssrCase.name, ssrCase] as const))('%s', async (_, { element, html = [] }) => {
        const markup = renderToString(element());
        expect(await prerenderToString(element())).toBe(markup);
        expect(consoleError.mock.calls).toEqual([]);
        expect(consoleWarn.mock.calls).toEqual([]);
        for (const text of html) {
            expect(markup).toContain(text);
        }
    });
});
