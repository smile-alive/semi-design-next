import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import semiGlobal from '../../_utils/semi-global';
import Fixture from './snippets-fixture.svelte';

const prefix = 'semi-typography';

beforeEach(() => {
    // jsdom has no Clipboard API
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn<(data: string) => Promise<void>>().mockResolvedValue(undefined) }, configurable: true });
});

afterEach(() => {
    vi.restoreAllMocks();
    semiGlobal.config = {};
});

describe('Svelte Typography snippet', () => {
    it('copyAction 拿到 copied、copy 与解析后的 config，自定义节点替代内置按钮', async () => {
        const { container } = render(Fixture, { props: { mode: 'copyAction' } });
        await vi.waitFor(() => expect(container.querySelector('.test-copy-content')).toHaveTextContent('code'));
        expect(container.querySelector('.test-copied')).toHaveTextContent('false');
        expect(container.querySelector(`.${prefix}-action-btn`)).toBeNull();
        await fireEvent.click(container.querySelector('.test-copy-button') as Element);
        await vi.waitFor(() => expect(container.querySelector('.test-copied')).toHaveTextContent('true'));
    });

    it('copyIcon 自带 aria-label 时以它命名复制按钮，否则用语言包文案', async () => {
        const labeled = render(Fixture, { props: { mode: 'copyIcon', labeled: true } });
        await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Copy code' })).toBeInTheDocument());
        labeled.unmount();
        render(Fixture, { props: { mode: 'copyIcon' } });
        expect(screen.getByRole('button', { name: zh_CN.Typography.copy })).toBeInTheDocument();
    });

    it.each([
        ['text', 'Done'],
        ['icon', zh_CN.Typography.copied],
        ['label', 'Done'],
    ] as const)('copySuccessTip（%s）在复制成功后替代已复制提示，按钮名为 %s', async (tip, name) => {
        const { container } = render(Fixture, { props: { mode: 'copySuccessTip', tip } });
        await fireEvent.click(container.querySelector('button') as Element);
        await vi.waitFor(() => expect(container.querySelector(`.${prefix}-action-copied`)).not.toBeNull());
        await vi.waitFor(() => expect(screen.getByRole('button', { name })).toBeInTheDocument());
    });

    it('icon 位于 icon 容器内，Semi 图标按文字尺寸取 size', async () => {
        const normal = render(Fixture, { props: { mode: 'icon' } });
        await vi.waitFor(() => expect(normal.container.querySelector(`.${prefix}-icon .semi-icon`)).toHaveClass('semi-icon-default'));
        normal.unmount();
        const small = render(Fixture, { props: { mode: 'icon', size: 'small' } });
        await vi.waitFor(() => expect(small.container.querySelector(`.${prefix}-icon .semi-icon`)).toHaveClass('semi-icon-small'));
    });

    it('size inherit 嵌套多层时取最近一层非 inherit 的值', () => {
        const { container } = render(Fixture, { props: { mode: 'inherit' } });
        for (const name of ['outer', 'middle', 'inner']) {
            expect(container.querySelector(`.${name}`)).toHaveClass(`${prefix}-small`);
        }
    });

    it('ellipsisTooltip 在溢出后接管提示，content 是去掉首尾空白的全文，trigger 渲染文字元素', async () => {
        vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(function (this: Element) {
            return (this.textContent?.length ?? 0) * 2;
        });
        const { container } = render(Fixture, { props: { mode: 'ellipsisTooltip' } });
        await vi.waitFor(() => expect(container.querySelector('.test-popup')).not.toBeNull());
        expect(container.querySelector('.test-popup')).toHaveAttribute('data-content', 'abcdefghijklmnopqrstuvwxyz');
        expect(container.querySelectorAll(`.test-popup > .${prefix}`)).toHaveLength(1);
    });

    it('Typography 默认渲染 article，读取全局默认值的 component，显式 component 优先', () => {
        const plain = render(Fixture, { props: { mode: 'root' } });
        expect(plain.container.querySelector(`article.${prefix}.root`)).not.toBeNull();
        plain.unmount();
        semiGlobal.config = { overrideDefaultProps: { Typography: { component: 'section' } } };
        const global = render(Fixture, { props: { mode: 'root' } });
        expect(global.container.querySelector(`section.${prefix}.root`)).not.toBeNull();
    });
});
