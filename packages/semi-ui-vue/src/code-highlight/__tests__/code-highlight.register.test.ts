// A separate file starts from an empty registry: registration is module-wide
import { waitFor } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { render, sleep } from '@test/utils/vue';
import CodeHighlight from '..';
import { grammar, theme } from './grammars';

const waitForShiki = (container: Element) => waitFor(() => expect(container.querySelector('pre.shiki')).not.toBeNull(), { timeout: 5000 });
const settle = () => sleep(100);

const vala = grammar('vala');
const python = grammar('python', ['py']);

describe('CodeHighlight 注册', () => {
    it('未注册的语言以纯文本显示，注册后高亮', async () => {
        const { container } = render(CodeHighlight, { props: { code: 'print(1)', language: 'python' } });
        await settle();
        expect(container.querySelector('.shiki')).toBeNull();
        expect(container.querySelector('pre code')).toHaveTextContent('print(1)');

        // the block mounted first: registering later highlights it again
        CodeHighlight.register({ languages: [python] });
        await waitForShiki(container);
        // an alias of a registered grammar works too
        const alias = render(CodeHighlight, { props: { code: 'x = 1', language: 'py' } });
        await waitForShiki(alias.container);
    });

    it('将 languages 属性加载到共享高亮器', async () => {
        const own = render(CodeHighlight, {
            props: { code: 'int main () { return 0; }', language: 'vala', languages: [vala] },
        });
        await waitForShiki(own.container);
        // the grammar is now loaded, so a later block without the prop finds it too
        const other = render(CodeHighlight, { props: { code: 'int x = 1;', language: 'vala' } });
        await waitForShiki(other.container);
        expect(other.container.querySelector('pre.shiki')).toHaveTextContent('int x = 1;');
    });

    it('默认使用 github 主题，可通过 themes 属性覆盖', async () => {
        const plain = render(CodeHighlight, { props: { code: 'x = 1', language: 'python' } });
        await waitForShiki(plain.container);
        expect(plain.container.querySelector('pre.shiki')?.getAttribute('style')).toMatch(/--shiki-light-bg:#fff.*--shiki-dark-bg:#24292e/i);

        const themed = render(CodeHighlight, {
            props: {
                code: 'x = 1',
                language: 'python',
                themes: { light: theme('test-light', 'light', '#fafafa'), dark: theme('test-dark', 'dark', '#101010') },
            },
        });
        await waitForShiki(themed.container);
        expect(themed.container.querySelector('pre.shiki')?.getAttribute('style')).toMatch(/--shiki-light-bg:#fafafa.*--shiki-dark-bg:#101010/i);
    });

    it('已注册的主题应用到每个代码块', async () => {
        CodeHighlight.register({ themes: { dark: theme('registered-dark', 'dark', '#202020') } });
        const { container } = render(CodeHighlight, { props: { code: 'x = 1', language: 'python' } });
        await waitForShiki(container);
        expect(container.querySelector('pre.shiki')?.getAttribute('style')).toMatch(/--shiki-dark-bg:#202020/i);
    });
});
