import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi, type Mock } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import Extras from './extras-fixture.svelte';
import Fixture from './typography-fixture.svelte';

const prefix = 'semi-typography';
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

function setup(store: { kind?: 'text' | 'title' | 'paragraph' | 'numeral'; text?: string; props?: Record<string, unknown> }) {
    const state = createStore(store);
    const view = render(Fixture, { props: { store: state } });
    return { state, ...view };
}

const root = (container: Element) => container.querySelector(`.${prefix}`) as HTMLElement;

// The full text stays in the DOM, hidden, while the truncated text shows; what a reader sees skips it
function visibleText(node: Element): string {
    return [...node.childNodes].map((child) => (child.nodeType === Node.TEXT_NODE ? child.textContent : child instanceof HTMLElement && child.hidden ? '' : visibleText(child as Element))).join('');
}

// jsdom has no layout: the measuring container's height grows `factor` px per character; with line-height 20px a
// single row fits while scrollHeight < 40, i.e. fewer than 40 / factor characters in the container
function mockTextHeight(factor = 2) {
    vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(function (this: Element) {
        return (this.textContent?.length ?? 0) * factor;
    });
}

let writeText: Mock<(data: string) => Promise<void>>;

beforeEach(() => {
    // jsdom has no Clipboard API
    writeText = vi.fn<(data: string) => Promise<void>>().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('Svelte Typography 复制：交互', () => {
    it('复制按钮按 Space 和 Enter 都能复制', async () => {
        const onCopy = vi.fn<(event: MouseEvent, content: string, success: boolean) => void>();
        setup({ kind: 'paragraph', text: 'Semi Design', props: { copyable: { duration: 0.01, onCopy } } });
        screen.getByRole('button', { name: zh_CN.Typography.copy }).focus();
        await userEvent.keyboard(' ');
        await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(screen.getByRole('button', { name: zh_CN.Typography.copy })).toBeInTheDocument());
        screen.getByRole('button', { name: zh_CN.Typography.copy }).focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(2));
    });

    it.each([
        ['默认图标', 'default'],
        ['自定义图标', 'custom'],
    ] as const)('%s 的按钮在已复制状态下保持焦点，且仅在未复制时才复制', async (_, kind) => {
        const onCopy = vi.fn<(event: MouseEvent, content: string, success: boolean) => void>();
        if (kind === 'default') {
            setup({ kind: 'paragraph', text: 'Semi Design', props: { copyable: { duration: 0.2, onCopy } } });
        } else {
            render(Extras, { props: { mode: 'gearCopyIcon', duration: 0.2 } });
        }
        const button = screen.getByRole('button', { name: zh_CN.Typography.copy });
        button.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(button).toHaveAccessibleName(zh_CN.Typography.copied));
        expect(button).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        await userEvent.click(button);
        expect(writeText).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(button).toHaveAccessibleName(zh_CN.Typography.copy));
        expect(button).toHaveFocus();
    });

    it('焦点在其他元素时复制，不会抢走焦点', async () => {
        const other = document.createElement('button');
        other.textContent = 'other';
        document.body.append(other);
        onTestFinished(() => other.remove());
        const { container } = setup({ kind: 'paragraph', text: 'Semi Design', props: { copyable: { duration: 0.05 } } });
        other.focus();
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Typography.copy }));
        other.focus();
        await waitFor(() => expect(container.querySelector(`.${prefix}-action-copied`)).toBeInTheDocument());
        expect(other).toHaveFocus();
    });

    it('重复复制会重新计时已复制状态', async () => {
        vi.useFakeTimers();
        render(Extras, { props: { mode: 'copyActionOnly' } });
        const button = screen.getByRole('button');
        const click = async () => {
            button.click();
            await vi.advanceTimersByTimeAsync(0);
        };
        await click();
        await vi.advanceTimersByTimeAsync(2000);
        await click();
        await vi.advanceTimersByTimeAsync(2000);
        expect(button).toHaveTextContent('copied');
        await vi.advanceTimersByTimeAsync(1000);
        expect(button).toHaveTextContent('copy');
        expect(writeText).toHaveBeenCalledTimes(2);
    });

    it('卸载时清除已复制计时器，不再回写状态', async () => {
        vi.useFakeTimers();
        const view = render(Extras, { props: { mode: 'copyActionOnly' } });
        screen.getByRole('button').click();
        await vi.advanceTimersByTimeAsync(0);
        expect(screen.getByRole('button')).toHaveTextContent('copied');
        const pending = vi.getTimerCount();
        expect(pending).toBeGreaterThan(0);
        view.unmount();
        expect(vi.getTimerCount()).toBeLessThan(pending);
    });
});

describe('Svelte Typography 复制：内容与外观', () => {
    it('没有内容时复制空字符串', async () => {
        const { container } = setup({ text: '', props: { copyable: true } });
        await userEvent.click(container.querySelector('.semi-icon-copy') as Element);
        await waitFor(() => expect(writeText).toHaveBeenLastCalledWith(''));
    });

    it('复制内容为 content 显式 undefined 时取渲染出的文本', async () => {
        const { container } = setup({ text: 'abc', props: { copyable: { content: undefined } } });
        await userEvent.click(container.querySelector('.semi-icon-copy') as Element);
        await waitFor(() => expect(writeText).toHaveBeenLastCalledWith('abc'));
    });

    it('条件渲染为假的 {#if} 不进入复制内容，也不进入 JS 截断的文本', async () => {
        mockTextHeight(2);
        const { container } = render(Extras, { props: { mode: 'conditional' } });
        await userEvent.click(container.querySelector('.semi-icon-copy') as Element);
        await waitFor(() => expect(writeText).toHaveBeenLastCalledWith('Bob'));
        const paragraph = container.querySelector(`.${prefix}-paragraph`) as HTMLElement;
        await waitFor(() => expect(visibleText(paragraph)).toBe('abcdefghijklmn...EX'));
    });

    it('copyable 复制配置的内容，并显示自定义成功提示与复制提示', async () => {
        const { container } = render(Extras, { props: { mode: 'copyTips' } });
        // the tooltip wraps the button, so the action's own span carries no inline margin
        expect(container.querySelector(`.${prefix}-action-copy`)).not.toHaveAttribute('style');
        await userEvent.hover(container.querySelector('.semi-icon-copy') as Element);
        await waitFor(() => expect(screen.getByRole('tooltip')).toHaveTextContent('press'));
        await userEvent.click(container.querySelector('.semi-icon-copy') as Element);
        expect(writeText).toHaveBeenCalledWith('configured');
        await waitFor(() => expect(container.querySelector(`.${prefix}-action-copied`)).toHaveTextContent(/^done$/));
    });

    it('copyable 自定义图标位于复制按钮内，复制后显示已复制文案', async () => {
        const { container } = render(Extras, { props: { mode: 'gearCopyIcon' } });
        const button = screen.getByRole('button', { name: zh_CN.Typography.copy });
        expect(button).toContainElement(container.querySelector('.semi-icon-setting'));
        await userEvent.click(button);
        await waitFor(() => expect(writeText).toHaveBeenCalledWith('gear'));
        await waitFor(() => expect(container.querySelector(`.${prefix}-action-copied`)).toHaveTextContent(zh_CN.Typography.copied));
    });

    it('copyable 的非元素图标原样显示，按钮以语言包文案命名', () => {
        render(Extras, { props: { mode: 'plainCopyIcon' } });
        const button = screen.getByRole('button', { name: zh_CN.Typography.copy });
        expect(button).toHaveAttribute('aria-label', zh_CN.Typography.copy);
        expect(button).toHaveTextContent(/^复制$/);
        expect(button.querySelector('.semi-icon-copy')).toBeNull();
    });

    it('复制按钮是唯一的 Tab 停靠点，其 Tooltip 描述了该按钮', async () => {
        render(Extras, { props: { mode: 'copyTipOnly' } });
        await userEvent.tab();
        const button = document.activeElement as HTMLElement;
        expect(button.tagName).toBe('BUTTON');
        await waitFor(() => expect(button).toHaveAccessibleDescription('Copy the text'));
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('Title 与 Paragraph 同样可复制', async () => {
        const title = setup({ kind: 'title', text: 'Heading', props: { copyable: true } });
        await userEvent.click(title.container.querySelector('.semi-icon-copy') as Element);
        await waitFor(() => expect(writeText).toHaveBeenLastCalledWith('Heading'));
    });
});

describe('Svelte Typography 复制与省略同时使用', () => {
    it('自定义复制渲染与 JS 截断同时使用，自定义节点的内容跟随复制状态', async () => {
        mockTextHeight(2);
        const { container } = render(Extras, { props: { mode: 'copyActionExpand' } });
        const paragraph = root(container);
        await vi.waitFor(() => expect(visibleText(paragraph)).toBe('abcdefghi...EXfalse'));
        await userEvent.click(screen.getByRole('button', { name: 'EX' }));
        expect(visibleText(paragraph)).toBe(`${LETTERS}COfalse`);
        await userEvent.click(container.querySelector('.copy') as Element);
        await vi.waitFor(() => expect(container.querySelector('.copy')).toHaveTextContent('true'));
        expect(writeText).toHaveBeenCalledTimes(1);
    });

    it('copyAction 的自定义节点同样为 JS 省略预留宽度', async () => {
        mockTextHeight(2);
        const { container } = render(Extras, { props: { mode: 'copyActionReserve' } });
        await vi.waitFor(() => expect(visibleText(root(container))).toBe('abcdefghijkl...CCCC'));
    });

    it('复制成功后按已复制提示的宽度重新截断，恢复后回到原截断', async () => {
        mockTextHeight(2);
        const { container } = setup({ kind: 'paragraph', text: LETTERS, props: { style: 'line-height: 20px', copyable: { duration: 0.3 }, ellipsis: { rows: 1 } } });
        const shown = () => visibleText(root(container));
        await vi.waitFor(() => expect(shown()).toBe('abcdefghijklmnop...'));
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Typography.copy }));
        // the copied tip is wider than the icon, so fewer letters fit before it
        await vi.waitFor(() => expect(shown()).toBe('abcdefghijkl...复制成功'));
        await vi.waitFor(() => expect(shown()).toBe('abcdefghijklmnop...'));
    });
});
