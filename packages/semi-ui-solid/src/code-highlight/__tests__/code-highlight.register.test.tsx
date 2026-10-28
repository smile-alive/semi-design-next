// A separate file starts from an empty registry: registration is module-wide
import { render, waitFor } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { sleep } from '@test/utils/solid';
import CodeHighlight from '..';
import { grammar, theme } from './grammars';

const waitForShiki = (container: HTMLElement) => waitFor(() => expect(container.querySelector('pre.shiki')).not.toBeNull(), { timeout: 5000 });
const settle = () => sleep(100);

const python = grammar('python', ['py']);
const vala = grammar('vala');

describe('CodeHighlight 注册', () => {
    it('未注册的语言以纯文本显示，注册后高亮', async () => {
        const { container } = render(() => <CodeHighlight code="print(1)" language="python" />);
        await settle();
        expect(container.querySelector('.shiki')).toBeNull();
        expect(container.querySelector('pre code')).toHaveTextContent('print(1)');

        CodeHighlight.register({ languages: [python] });
        await waitForShiki(container);
        const alias = render(() => <CodeHighlight code="x = 1" language="py" />);
        await waitForShiki(alias.container);
    });

    it('将 languages 属性加载到共享高亮器', async () => {
        const own = render(() => <CodeHighlight code="int main () { return 0; }" language="vala" languages={[vala]} />);
        await waitForShiki(own.container);
        const other = render(() => <CodeHighlight code="int x = 1;" language="vala" />);
        await waitForShiki(other.container);
        expect(other.container.querySelector('pre.shiki')).toHaveTextContent('int x = 1;');
    });

    it('默认使用 github 主题，可通过 themes 属性覆盖', async () => {
        const plain = render(() => <CodeHighlight code="x = 1" language="python" />);
        await waitForShiki(plain.container);
        expect(plain.container.querySelector('pre.shiki')?.getAttribute('style')).toMatch(/--shiki-light-bg:#fff.*--shiki-dark-bg:#24292e/i);

        const themed = render(() => <CodeHighlight code="x = 1" language="python" themes={{ light: theme('test-light', 'light', '#fafafa'), dark: theme('test-dark', 'dark', '#101010') }} />);
        await waitForShiki(themed.container);
        expect(themed.container.querySelector('pre.shiki')?.getAttribute('style')).toMatch(/--shiki-light-bg:#fafafa.*--shiki-dark-bg:#101010/i);
    });

    it('已注册的主题应用到每个代码块', async () => {
        CodeHighlight.register({ themes: { dark: theme('registered-dark', 'dark', '#202020') } });
        const { container } = render(() => <CodeHighlight code="x = 1" language="python" />);
        await waitForShiki(container);
        expect(container.querySelector('pre.shiki')?.getAttribute('style')).toMatch(/--shiki-dark-bg:#202020/i);
    });
});
