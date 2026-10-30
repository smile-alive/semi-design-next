/** @jsxImportSource vue */
import { createSSRApp, reactive } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { waitFor } from '@testing-library/vue';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { register as foundationRegister } from '@fibrae/semi-foundation/code-highlight/registry';
import { render, sleep } from '@test/utils/vue';
import CodeHighlight from '..';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
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

const waitForShiki = (container: Element) => waitFor(() => expect(container.querySelector('pre.shiki')).not.toBeNull(), { timeout: 5000 });
function getRoot(container: Element) {
    const root = container.querySelector<HTMLElement>('.semi-codeHighlight');
    if (!root) throw new Error('missing .semi-codeHighlight');
    return root;
}

describe('CodeHighlight', () => {
    beforeAll(() => {
        CodeHighlight.register({
            languages: [grammar('javascript', ['js']), grammar('typescript', ['ts']), grammar('css')],
        });
    });

    beforeEach(() => {
        highlights.count = 0;
    });

    it('已知语言同时输出两套主题配色，且每行源码对应一行', async () => {
        const { container } = render(CodeHighlight, {
            props: { code: 'const a = 1;\nconst b = 2;\n', language: 'js' },
        });
        await waitForShiki(container);
        expect(getRoot(container)).toHaveClass('semi-codeHighlight', 'semi-codeHighlight-lineNumber');
        expect(container.querySelectorAll('.line')).toHaveLength(2);
        expect(container.querySelector('.line span')?.getAttribute('style')).toMatch(/--shiki-light:.*--shiki-dark:/);
    });

    it('未知语言保持纯文本', async () => {
        const { container } = render(CodeHighlight, {
            props: { code: 'plain <b>text</b>', language: 'not-a-language' },
        });
        await sleep(50);
        expect(container.querySelector('.shiki')).toBeNull();
        expect(container.querySelector('pre code')).toHaveTextContent('plain <b>text</b>');
        expect(container.querySelector('pre code b')).toBeNull();
    });

    it('语言变化时重新高亮', async () => {
        const view = render(CodeHighlight, { props: { code: 'a { color: red }', language: 'not-a-language' } });
        await view.rerender({ code: 'a { color: red }', language: 'css' });
        await waitForShiki(view.container);
        expect(view.container.querySelector('pre.shiki')).toHaveTextContent('a { color: red }');
    });

    it('高亮完成前，首帧以纯文本渲染代码', () => {
        const { container } = render(CodeHighlight, { props: { code: 'const a = 1;', language: 'js' } });
        expect(container.querySelector('.shiki')).toBeNull();
        expect(container.querySelector('.semi-codeHighlight > pre > code')).toHaveTextContent('const a = 1;');
    });

    it('class、style、lineNumber 与 data-* 属性应用到根元素', () => {
        const { container } = render(CodeHighlight, {
            attrs: { class: 'custom', style: { color: 'red' }, 'data-testid': 'code' },
            props: { code: 'x', language: 'js', lineNumber: false },
        });
        const root = getRoot(container);
        expect(root).toHaveClass('semi-codeHighlight', `${BASE_CLASS_PREFIX}-scrollbar`, 'custom');
        expect(root).not.toHaveClass('semi-codeHighlight-lineNumber');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(root).toHaveAttribute('data-testid', 'code');
    });

    it('从 overrideDefaultProps 读取 lineNumber', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { CodeHighlight: { lineNumber: false } };
        const global = { provide: { [semiGlobalKey]: semi } };
        const { container } = render(
            () => (
                <div>
                    <CodeHighlight code="x" language="js" />
                    <CodeHighlight code="x" language="js" lineNumber />
                </div>
            ),
            { global }
        );
        const [fromGlobal, explicit] = container.querySelectorAll('.semi-codeHighlight');
        expect(fromGlobal).not.toHaveClass('semi-codeHighlight-lineNumber');
        expect(explicit).toHaveClass('semi-codeHighlight-lineNumber');
    });

    it('props 运行时：lineNumber 有 default 键', () => {
        const declared = (CodeHighlight as unknown as { props: Record<string, { type?: unknown; default?: unknown }> }).props;
        const missingDefault = Object.entries(declared)
            .filter(([, option]) => [option.type].flat().includes(Boolean) && !('default' in option))
            .map(([key]) => key);
        expect(missingDefault).toEqual([]);
    });

    it('代码变化时重新高亮', async () => {
        const view = render(CodeHighlight, { props: { code: 'const first = 1;', language: 'js' } });
        await waitForShiki(view.container);
        await view.rerender({ code: 'const second = 2;\nconst third = 3;', language: 'js' });
        await waitFor(() => expect(view.container.querySelector('pre.shiki')).toHaveTextContent('const second = 2;'), {
            timeout: 5000,
        });
        expect(view.container.querySelectorAll('.line')).toHaveLength(2);
    });

    it('高亮进行中时，新代码先以纯文本显示', async () => {
        const view = render(CodeHighlight, { props: { code: 'const first = 1;', language: 'js' } });
        await waitForShiki(view.container);
        await view.rerender({ code: 'const second = 2;', language: 'js' });
        expect(view.container.querySelector('.shiki')).toBeNull();
        expect(view.container.querySelector('.semi-codeHighlight > pre > code')).toHaveTextContent('const second = 2;');
        await waitFor(() => expect(view.container.querySelector('pre.shiki')).toHaveTextContent('const second = 2;'), {
            timeout: 5000,
        });
    });

    it('连续更新时只保留最新代码的结果', async () => {
        const view = render(CodeHighlight, { props: { code: 'const a = 1;', language: 'js' } });
        await view.rerender({ code: 'const b = 2;', language: 'js' });
        await view.rerender({ code: 'const c = 3;', language: 'js' });
        await waitForShiki(view.container);
        await sleep(50);
        expect(view.container.querySelectorAll('pre.shiki')).toHaveLength(1);
        expect(view.container.querySelector('pre.shiki')).toHaveTextContent('const c = 3;');
    });

    it('code 为 undefined 时视为空文本', async () => {
        const { container } = render(CodeHighlight, { props: { language: 'js' } });
        await waitForShiki(container);
        expect(container.querySelector('pre.shiki')).toHaveTextContent(/^$/);
    });

    it('代码块切换到未知语言时回退为纯文本，根元素的属性保留', async () => {
        const view = render(CodeHighlight, {
            attrs: { class: 'custom', 'data-testid': 'code' },
            props: { code: 'const a = 1;', language: 'js' },
        });
        await waitForShiki(view.container);
        await view.rerender({ code: 'still plain', language: 'not-a-language' });
        await waitFor(() => expect(view.container.querySelector('.shiki')).toBeNull());
        expect(view.container.querySelector('pre code')).toHaveTextContent('still plain');
        const root = getRoot(view.container);
        expect(root).toHaveClass(`${BASE_CLASS_PREFIX}-scrollbar`, 'custom');
        expect(root).toHaveAttribute('data-testid', 'code');
    });

    it('输入已变化时丢弃待完成的高亮', async () => {
        const view = render(CodeHighlight, { props: { code: 'const stale: number = 1;', language: 'ts' } });
        await view.rerender({ code: 'latest', language: 'not-a-language' });
        // a second block in the same language finishes after the first block's pending request
        const other = render(CodeHighlight, { props: { code: 'const other: number = 2;', language: 'ts' } });
        await waitForShiki(other.container);
        await sleep(50);
        expect(view.container.querySelector('.shiki')).toBeNull();
        expect(view.container.querySelector('pre code')).toHaveTextContent('latest');
    });

    it('重复挂载与卸载后只渲染一个高亮代码块', async () => {
        const first = render(CodeHighlight, { props: { code: 'const a = 1;', language: 'js' } });
        first.unmount();
        const { container } = render(CodeHighlight, { props: { code: 'const a = 1;\nconst b = 2;', language: 'js' } });
        await waitForShiki(container);
        await sleep(50);
        expect(container.querySelectorAll('pre.shiki')).toHaveLength(1);
        expect(container.querySelectorAll('.line')).toHaveLength(2);
    });

    it('id 与 aria-label 落在根元素，有名称时根带 role=group', () => {
        const { container } = render(CodeHighlight, {
            attrs: { id: 'code-id', 'aria-label': 'code' },
            props: { code: 'x', language: 'js' },
        });
        const root = getRoot(container);
        expect(root).toHaveAttribute('id', 'code-id');
        expect(root).toHaveAttribute('aria-label', 'code');
        expect(root).toHaveAttribute('role', 'group');
    });

    it('aria-labelledby 同样加 role=group，使用方的 role 优先，无名称时没有 role', () => {
        const { container: labelled } = render(CodeHighlight, {
            attrs: { 'aria-labelledby': 'x' },
            props: { code: 'x', language: 'js' },
        });
        expect(getRoot(labelled)).toHaveAttribute('role', 'group');
        const { container: own } = render(CodeHighlight, {
            attrs: { 'aria-label': 'code', role: 'region' },
            props: { code: 'x', language: 'js' },
        });
        expect(getRoot(own)).toHaveAttribute('role', 'region');
        const { container: plain } = render(CodeHighlight, { props: { code: 'x', language: 'js' } });
        expect(getRoot(plain)).not.toHaveAttribute('role');
    });

    it('高亮后的根元素同样带 role=group', async () => {
        const { container } = render(CodeHighlight, {
            attrs: { 'aria-label': 'code' },
            props: { code: 'const a = 1;', language: 'js' },
        });
        await waitForShiki(container);
        expect(getRoot(container)).toHaveAttribute('role', 'group');
    });

    it('languages 与 themes 引用不变时，父级重渲染不重复高亮', async () => {
        const languages = [grammar('javascript', ['js'])];
        const view = render(CodeHighlight, { props: { code: 'const a = 1;', language: 'js', languages } });
        await waitForShiki(view.container);
        const settled = highlights.count;
        await view.rerender({ code: 'const a = 1;', language: 'js', languages });
        await sleep(50);
        expect(highlights.count).toBe(settled);
    });

    it('响应式数组形式的 languages 仍能高亮', async () => {
        const vala = grammar('vala');
        const { container } = render(CodeHighlight, {
            props: { code: 'int main () { return 0; }', language: 'vala', languages: reactive([vala]) },
        });
        await waitForShiki(container);
        expect(container.querySelector('pre.shiki')).toHaveTextContent('int main () { return 0; }');
    });

    it('register 与基础库共用同一个函数', () => {
        expect(CodeHighlight.register).toBe(foundationRegister);
    });

    it('服务端渲染只输出纯文本 pre > code', async () => {
        const html = await renderToString(createSSRApp({ render: () => <CodeHighlight code="const a = 1;" language="js" /> }));
        const host = document.createElement('div');
        host.innerHTML = html;
        expect(host.querySelector('.semi-codeHighlight > pre > code')).toHaveTextContent('const a = 1;');
        expect(host.querySelector('.shiki')).toBeNull();
    });
});
