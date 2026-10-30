import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { createStore } from '../../_base/__tests__/store.svelte';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import { registerCodeHighlight } from '../index';
import type { CodeHighlightProps } from '../interface';
import CodeHighlightStore from './code-highlight-store.svelte';
import { grammar } from './grammars';

// counts the highlights that actually start, to tell a skipped update from a repeated one
const highlights = vi.hoisted(() => ({ count: 0 }));
vi.mock('@fibrae/semi-foundation/code-highlight/highlighter', async (importOriginal) => {
    const original = await importOriginal<typeof import('@fibrae/semi-foundation/code-highlight/highlighter')>();
    return {
        ...original,
        highlight: (...args: Parameters<typeof original.highlight>) => {
            highlights.count++;
            return original.highlight(...args);
        },
    };
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const waitForShiki = (container: Element) => vi.waitFor(() => expect(container.querySelector('pre.shiki')).not.toBeNull(), { timeout: 5000 });
function getRoot(container: Element) {
    const root = container.querySelector<HTMLElement>('.semi-codeHighlight');
    if (!root) throw new Error('missing .semi-codeHighlight');
    return root;
}

function setup(props: CodeHighlightProps, context?: Map<unknown, unknown>) {
    const store = createStore<CodeHighlightProps>(props);
    const view = render(CodeHighlightStore, { props: { store }, ...(context ? { context } : {}) });
    return { store, container: view.container, unmount: view.unmount };
}

describe('Svelte CodeHighlight', () => {
    beforeAll(() => {
        registerCodeHighlight({ languages: [grammar('javascript', ['js']), grammar('typescript', ['ts']), grammar('css')] });
    });

    beforeEach(() => {
        highlights.count = 0;
    });

    it('已知语言同时输出两套主题配色，且每行源码对应一行', async () => {
        const { container } = setup({ code: 'const a = 1;\nconst b = 2;\n', language: 'js' });
        await waitForShiki(container);
        expect(getRoot(container)).toHaveClass('semi-codeHighlight', 'semi-codeHighlight-lineNumber');
        expect(container.querySelectorAll('.line')).toHaveLength(2);
        expect(container.querySelector('.line span')?.getAttribute('style')).toMatch(/--shiki-light:.*--shiki-dark:/);
    });

    it('未知语言保持纯文本', async () => {
        const { container } = setup({ code: 'plain <b>text</b>', language: 'not-a-language' });
        await sleep(50);
        expect(container.querySelector('.shiki')).toBeNull();
        expect(container.querySelector('pre code')).toHaveTextContent('plain <b>text</b>');
        expect(container.querySelector('pre code b')).toBeNull();
    });

    it('语言变化时重新高亮', async () => {
        const { store, container } = setup({ code: 'a { color: red }', language: 'not-a-language' });
        store.language = 'css';
        flushSync();
        await waitForShiki(container);
        expect(container.querySelector('pre.shiki')).toHaveTextContent('a { color: red }');
    });

    it('高亮完成前，首帧以纯文本渲染代码', () => {
        const { container } = setup({ code: 'const a = 1;', language: 'js' });
        expect(container.querySelector('.shiki')).toBeNull();
        expect(container.querySelector('.semi-codeHighlight > pre > code')).toHaveTextContent('const a = 1;');
    });

    it('class、style、lineNumber 与 data-* 属性应用到根元素', () => {
        const { container } = setup({ class: 'custom', style: 'color: red', 'data-testid': 'code', code: 'x', language: 'js', lineNumber: false });
        const root = getRoot(container);
        expect(root).toHaveClass('semi-codeHighlight', `${BASE_CLASS_PREFIX}-scrollbar`, 'custom');
        expect(root).not.toHaveClass('semi-codeHighlight-lineNumber');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(root).toHaveAttribute('data-testid', 'code');
    });

    it('从 overrideDefaultProps 读取 lineNumber，显式属性优先', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { CodeHighlight: { lineNumber: false } };
        const context = new Map([[semiGlobalKey, semi]]);
        const fromGlobal = setup({ code: 'x', language: 'js' }, context);
        expect(getRoot(fromGlobal.container)).not.toHaveClass('semi-codeHighlight-lineNumber');
        const explicit = setup({ code: 'x', language: 'js', lineNumber: true }, context);
        expect(getRoot(explicit.container)).toHaveClass('semi-codeHighlight-lineNumber');
    });

    it('代码变化时重新高亮', async () => {
        const { store, container } = setup({ code: 'const first = 1;', language: 'js' });
        await waitForShiki(container);
        store.code = 'const second = 2;\nconst third = 3;';
        flushSync();
        await vi.waitFor(() => expect(container.querySelector('pre.shiki')).toHaveTextContent('const second = 2;'), { timeout: 5000 });
        expect(container.querySelectorAll('.line')).toHaveLength(2);
    });

    it('高亮进行中时，新代码先以纯文本显示', async () => {
        const { store, container } = setup({ code: 'const first = 1;', language: 'js' });
        await waitForShiki(container);
        store.code = 'const second = 2;';
        flushSync();
        expect(container.querySelector('.shiki')).toBeNull();
        expect(container.querySelector('.semi-codeHighlight > pre > code')).toHaveTextContent('const second = 2;');
        await vi.waitFor(() => expect(container.querySelector('pre.shiki')).toHaveTextContent('const second = 2;'), { timeout: 5000 });
    });

    it('连续更新时只保留最新代码的结果', async () => {
        const { store, container } = setup({ code: 'const a = 1;', language: 'js' });
        store.code = 'const b = 2;';
        flushSync();
        store.code = 'const c = 3;';
        flushSync();
        await waitForShiki(container);
        await sleep(50);
        expect(container.querySelectorAll('pre.shiki')).toHaveLength(1);
        expect(container.querySelector('pre.shiki')).toHaveTextContent('const c = 3;');
    });

    it('code 为 undefined 时视为空文本', async () => {
        const { container } = setup({ language: 'js' });
        await waitForShiki(container);
        expect(container.querySelector('pre.shiki')).toHaveTextContent(/^$/);
    });

    it('代码块切换到未知语言时回退为纯文本，根元素的属性保留', async () => {
        const { store, container } = setup({ class: 'custom', 'data-testid': 'code', code: 'const a = 1;', language: 'js' });
        await waitForShiki(container);
        store.code = 'still plain';
        store.language = 'not-a-language';
        flushSync();
        await vi.waitFor(() => expect(container.querySelector('.shiki')).toBeNull());
        expect(container.querySelector('pre code')).toHaveTextContent('still plain');
        const root = getRoot(container);
        expect(root).toHaveClass(`${BASE_CLASS_PREFIX}-scrollbar`, 'custom');
        expect(root).toHaveAttribute('data-testid', 'code');
    });

    it('输入已变化时丢弃待完成的高亮', async () => {
        const { store, container } = setup({ code: 'const stale: number = 1;', language: 'ts' });
        store.code = 'latest';
        store.language = 'not-a-language';
        flushSync();
        // a second block in the same language finishes after the first block's pending request
        const other = setup({ code: 'const other: number = 2;', language: 'ts' });
        await waitForShiki(other.container);
        await sleep(50);
        expect(container.querySelector('.shiki')).toBeNull();
        expect(container.querySelector('pre code')).toHaveTextContent('latest');
    });

    it('重复挂载与卸载后只渲染一个高亮代码块', async () => {
        const first = setup({ code: 'const a = 1;', language: 'js' });
        first.unmount();
        const { container } = setup({ code: 'const a = 1;\nconst b = 2;', language: 'js' });
        await waitForShiki(container);
        await sleep(50);
        expect(container.querySelectorAll('pre.shiki')).toHaveLength(1);
        expect(container.querySelectorAll('.line')).toHaveLength(2);
    });

    it('id 与 aria-label 落在根元素，有名称时根带 role=group', () => {
        const { container } = setup({ id: 'code-id', 'aria-label': 'code', code: 'x', language: 'js' });
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'code-id');
        expect(root).toHaveAttribute('aria-label', 'code');
        expect(root).toHaveAttribute('role', 'group');
    });

    it('aria-labelledby 同样加 role=group，使用方的 role 优先，无名称时没有 role', () => {
        const labelled = setup({ 'aria-labelledby': 'x', code: 'x', language: 'js' });
        expect(getRoot(labelled.container)).toHaveAttribute('role', 'group');
        const own = setup({ 'aria-label': 'code', role: 'region', code: 'x', language: 'js' });
        expect(getRoot(own.container)).toHaveAttribute('role', 'region');
        const plain = setup({ code: 'x', language: 'js' });
        expect(getRoot(plain.container)).not.toHaveAttribute('role');
    });

    it('高亮后的根元素同样带 role=group', async () => {
        const { container } = setup({ 'aria-label': 'code', code: 'const a = 1;', language: 'js' });
        await waitForShiki(container);
        expect(getRoot(container)).toHaveAttribute('role', 'group');
    });

    it('languages 引用不变时，其他属性无关的更新不重复高亮', async () => {
        const languages = [grammar('javascript', ['js'])];
        const { store, container } = setup({ code: 'const a = 1;', language: 'js', languages });
        await waitForShiki(container);
        const settled = highlights.count;
        store.lineNumber = false;
        flushSync();
        await sleep(50);
        expect(highlights.count).toBe(settled);
    });
});
