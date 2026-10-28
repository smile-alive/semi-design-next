import { createSignal } from 'solid-js';
import { render, waitFor } from '@solidjs/testing-library';
import { afterEach, beforeAll, describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { sleep } from '@test/utils/solid';
import CodeHighlight from '..';
import semiGlobal from '../../_utils/semi-global';
import { grammar } from './grammars';

const waitForShiki = (container: HTMLElement) => waitFor(() => expect(container.querySelector('pre.shiki')).not.toBeNull(), { timeout: 5000 });

describe('CodeHighlight', () => {
    beforeAll(() => {
        CodeHighlight.register({ languages: [grammar('javascript', ['js']), grammar('typescript', ['ts']), grammar('css')] });
    });

    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('已知语言同时输出两套主题配色，且每行源码对应一行', async () => {
        const { container } = render(() => <CodeHighlight code={'const a = 1;\nconst b = 2;\n'} language="js" />);
        await waitForShiki(container);
        expect(container.firstChild).toHaveClass('semi-codeHighlight', 'semi-codeHighlight-lineNumber');
        expect(container.querySelectorAll('.line')).toHaveLength(2);
        expect(container.querySelector('.line span')?.getAttribute('style')).toMatch(/--shiki-light:.*--shiki-dark:/);
    });

    it('未知语言保持纯文本', async () => {
        const { container } = render(() => <CodeHighlight code="plain <b>text</b>" language="not-a-language" />);
        await sleep(50);
        expect(container.querySelector('.shiki')).toBeNull();
        expect(container.querySelector('pre code')).toHaveTextContent('plain <b>text</b>');
    });

    it('语言变化时重新高亮', async () => {
        const [language, setLanguage] = createSignal('not-a-language');
        const { container } = render(() => <CodeHighlight code="a { color: red }" language={language()} />);
        setLanguage('css');
        await waitForShiki(container);
        expect(container.querySelector('pre.shiki')).toHaveTextContent('a { color: red }');
    });

    it('高亮完成前，首帧以纯文本渲染代码', () => {
        const { container } = render(() => <CodeHighlight code="const a = 1;" language="js" />);
        expect(container.querySelector('.shiki')).toBeNull();
        expect(container.querySelector('.semi-codeHighlight > pre > code')).toHaveTextContent('const a = 1;');
    });

    it('class、style、lineNumber 与 data-* 属性应用到根元素', () => {
        const { container } = render(() => <CodeHighlight class="custom" style={{ color: 'red' }} data-testid="code" code="x" language="js" lineNumber={false} />);
        const root = container.firstChild;
        expect(root).toHaveClass('semi-codeHighlight', `${BASE_CLASS_PREFIX}-scrollbar`, 'custom');
        expect(root).not.toHaveClass('semi-codeHighlight-lineNumber');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(root).toHaveAttribute('data-testid', 'code');
    });

    it('从 semiGlobal overrideDefaultProps 读取 lineNumber', () => {
        semiGlobal.config.overrideDefaultProps = { CodeHighlight: { lineNumber: false } };
        const { container } = render(() => (
            <div>
                <CodeHighlight code="x" language="js" />
                <CodeHighlight code="x" language="js" lineNumber />
            </div>
        ));
        const [fromGlobal, explicit] = container.querySelectorAll('.semi-codeHighlight');
        expect(fromGlobal).not.toHaveClass('semi-codeHighlight-lineNumber');
        expect(explicit).toHaveClass('semi-codeHighlight-lineNumber');
    });

    it('代码变化时重新高亮', async () => {
        const [code, setCode] = createSignal('const first = 1;');
        const { container } = render(() => <CodeHighlight code={code()} language="js" />);
        await waitForShiki(container);
        setCode('const second = 2;\nconst third = 3;');
        await waitFor(() => expect(container.querySelector('pre.shiki')).toHaveTextContent('const second = 2;'), { timeout: 5000 });
        expect(container.querySelectorAll('.line')).toHaveLength(2);
    });

    it('高亮进行中时，新代码先以纯文本显示', async () => {
        const [code, setCode] = createSignal('const first = 1;');
        const { container } = render(() => <CodeHighlight code={code()} language="js" />);
        await waitForShiki(container);
        setCode('const second = 2;');
        expect(container.querySelector('.shiki')).toBeNull();
        expect(container.querySelector('.semi-codeHighlight > pre > code')).toHaveTextContent('const second = 2;');
        await waitFor(() => expect(container.querySelector('pre.shiki')).toHaveTextContent('const second = 2;'), { timeout: 5000 });
    });

    it('连续更新时只保留最新代码的结果', async () => {
        const [code, setCode] = createSignal('const a = 1;');
        const { container } = render(() => <CodeHighlight code={code()} language="js" />);
        setCode('const b = 2;');
        setCode('const c = 3;');
        await waitForShiki(container);
        await sleep(50);
        expect(container.querySelectorAll('pre.shiki')).toHaveLength(1);
        expect(container.querySelector('pre.shiki')).toHaveTextContent('const c = 3;');
    });

    it('code 为 undefined 时视为空文本', async () => {
        const { container } = render(() => <CodeHighlight language="js" />);
        await waitForShiki(container);
        expect(container.querySelector('pre.shiki')).toHaveTextContent(/^$/);
    });

    it('代码块切换到未知语言时回退为纯文本', async () => {
        const [props, setProps] = createSignal({ code: 'const a = 1;', language: 'js' });
        const { container } = render(() => <CodeHighlight {...props()} />);
        await waitForShiki(container);
        setProps({ code: 'still plain', language: 'not-a-language' });
        await waitFor(() => expect(container.querySelector('.shiki')).toBeNull());
        expect(container.querySelector('pre code')).toHaveTextContent('still plain');
    });

    it('输入已变化时丢弃待完成的高亮', async () => {
        const [props, setProps] = createSignal({ code: 'const stale: number = 1;', language: 'ts' });
        const { container } = render(() => <CodeHighlight {...props()} />);
        setProps({ code: 'latest', language: 'not-a-language' });
        const other = render(() => <CodeHighlight code="const other: number = 2;" language="ts" />);
        await waitForShiki(other.container);
        await sleep(50);
        expect(container.querySelector('.shiki')).toBeNull();
        expect(container.querySelector('pre code')).toHaveTextContent('latest');
    });

    it('根元素有 aria-label 或 aria-labelledby 时带 role=group，使用方的 role 优先，无名称时没有 role', () => {
        const { container: named } = render(() => <CodeHighlight aria-label="code" code="x" language="js" />);
        expect(named.firstChild).toHaveAttribute('role', 'group');
        const { container: labelled } = render(() => <CodeHighlight aria-labelledby="x" code="x" language="js" />);
        expect(labelled.firstChild).toHaveAttribute('role', 'group');
        const { container: own } = render(() => <CodeHighlight aria-label="code" role="note" code="x" language="js" />);
        expect(own.firstChild).toHaveAttribute('role', 'note');
        const { container: plain } = render(() => <CodeHighlight code="x" language="js" />);
        expect(plain.firstChild).not.toHaveAttribute('role');
    });

    it('ref 指向根元素，其他属性传给根元素', () => {
        let ref: HTMLDivElement | undefined;
        const { container } = render(() => <CodeHighlight ref={(node) => (ref = node)} id="code-id" aria-label="code" code="x" language="js" />);
        const root = container.firstChild;
        expect(ref).toBe(root);
        expect(root).toHaveAttribute('id', 'code-id');
        expect(root).toHaveAttribute('aria-label', 'code');
    });
});
