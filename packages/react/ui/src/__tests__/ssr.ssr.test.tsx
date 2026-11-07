import { createElement, type ComponentType, type ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { prerender } from 'react-dom/static';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import * as icons from '@fibrae/semi-icons-react';
import * as illustrations from '@fibrae/semi-illustrations-react';
import * as semi from '../index';
import { ssrCases } from './ssr-cases';

// Exports that are not components: the guard covers every other capitalized export
const notComponents = ['BaseFoundation', 'ToastFactory'];

let consoleError: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
    consoleError.mockRestore();
});

async function prerenderToString(element: ReactElement) {
    const { prelude } = await prerender(element);
    return new Response(prelude).text();
}

describe('服务端渲染', () => {
    it('运行在没有 DOM 的环境中', () => {
        expect(typeof document).toBe('undefined');
        expect(typeof window).toBe('undefined');
    });

    it('用例表覆盖 index.ts 的全部组件导出', () => {
        const covered = new Set(ssrCases.flatMap((ssrCase) => ssrCase.covers));
        const components = Object.keys(semi).filter((name) => /^[A-Z]/.test(name) && !notComponents.includes(name));
        expect(components.filter((name) => !covered.has(name))).toEqual([]);
        expect([...covered].filter((name) => !components.includes(name))).toEqual([]);
    });

    it.each(ssrCases.map((ssrCase) => [ssrCase.name, ssrCase] as const))('%s', async (_, { element, html = [], check }) => {
        const markup = renderToString(element());
        // prerender waits for lazy boundaries that renderToString leaves to the client
        expect(await prerenderToString(element())).toBe(markup);
        expect(consoleError.mock.calls).toEqual([]);
        for (const text of html) {
            expect(markup).toContain(text);
        }
        check?.(markup);
    });

    it.each([
        ['Toast.info', () => semi.Toast.info('hi'), 'Toast.useToast()'],
        ['Notification.info', () => semi.Notification.info({ content: 'hi' }), 'Notification.useNotification()'],
        ['Modal.info', () => semi.Modal.info({ content: 'hi' }), 'Modal.useModal()'],
    ])('命令式 API 在服务端抛说明性错误：%s', (_, call, hook) => {
        expect(call).toThrow(`can only be called in the browser: call it from an event handler or an effect, or render the holder returned by ${hook} instead.`);
    });

    it('Typography 子组件的命名导出与点语法是同一组件', () => {
        expect(semi.TypographyTitle).toBe(semi.Typography.Title);
        expect(semi.TypographyText).toBe(semi.Typography.Text);
        expect(semi.TypographyParagraph).toBe(semi.Typography.Paragraph);
        expect(semi.TypographyNumeral).toBe(semi.Typography.Numeral);
    });

    it('全部图标导出', () => {
        const entries = Object.entries(icons).filter(([name]) => /^Icon./.test(name));
        expect(entries.length).toBeGreaterThan(500);
        for (const [, SvgIcon] of entries) {
            expect(renderToString(createElement(SvgIcon as ComponentType))).toContain('<svg');
        }
        expect(consoleError.mock.calls).toEqual([]);
    });

    it('全部插画导出', () => {
        const entries = Object.entries(illustrations);
        expect(entries.length).toBeGreaterThan(10);
        for (const [, Illustration] of entries) {
            expect(renderToString(createElement(Illustration))).toContain('<svg');
        }
        expect(consoleError.mock.calls).toEqual([]);
    });
});
