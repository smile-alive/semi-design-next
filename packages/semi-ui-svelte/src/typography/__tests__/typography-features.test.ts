import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import FormatNumeral from '@fibrae/semi-foundation/typography/format-numeral';
import { createStore } from '../../_base/__tests__/store.svelte';
import Fixture from './typography-fixture.svelte';

const prefix = 'semi-typography';
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const lineHeight = 'line-height: 20px';

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
    vi.restoreAllMocks();
});

describe('Svelte Typography 复制', () => {
    it('点击复制图标写入剪贴板，onCopy 收到事件、内容与结果，复制后显示已复制状态', async () => {
        const onCopy = vi.fn<(event: MouseEvent, content: string, success: boolean) => void>();
        const { container, state } = setup({ kind: 'paragraph', text: 'Semi Design', props: { copyable: { onCopy } } });
        const icon = container.querySelectorAll('.semi-icon-copy');
        expect(icon).toHaveLength(1);
        await fireEvent.click(icon[0]);
        await vi.waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
        expect(writeText).toHaveBeenCalledWith('Semi Design');
        const [event, content, success] = onCopy.mock.calls[0];
        expect(event).toBeInstanceOf(MouseEvent);
        expect([content, success]).toEqual(['Semi Design', true]);
        await vi.waitFor(() => expect(container.querySelectorAll(`.${prefix}-action-copied`)).toHaveLength(1));
        state.props = { copyable: false };
        flushSync();
        expect(container.querySelector('.semi-icon-copy')).toBeNull();
    });

    it('复制按钮以语言包文案命名，copyIcon 自带 aria-label 时以它命名', async () => {
        const { container } = setup({ kind: 'paragraph', text: 'Semi Design', props: { copyable: true } });
        expect(screen.getByRole('button', { name: zh_CN.Typography.copy })).toBeInTheDocument();
        expect(container.querySelector('button')).not.toHaveAttribute('tabindex');
    });

    it('copyable.content 优先，否则复制文本内容；写入被拒绝时 onCopy 的结果为 false 且保持未复制', async () => {
        writeText.mockRejectedValue(new Error('denied'));
        const onCopy = vi.fn<(event: MouseEvent, content: string, success: boolean) => void>();
        const { container } = setup({ text: 'Key: code', props: { copyable: { content: 'code', onCopy } } });
        await fireEvent.click(container.querySelector('.semi-icon-copy') as Element);
        await vi.waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
        expect(onCopy.mock.calls[0].slice(1)).toEqual(['code', false]);
        expect(container.querySelector(`.${prefix}-action-copied`)).toBeNull();
    });

    it('不带 content 时复制渲染出的文本，不含展开按钮与复制按钮的文字', async () => {
        const { container } = setup({ text: '  Semi Design  ', props: { copyable: true } });
        await vi.waitFor(() => expect(container.querySelector('.semi-icon-copy')).not.toBeNull());
        await fireEvent.click(container.querySelector('.semi-icon-copy') as Element);
        await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('Semi Design'));
    });
});

describe('Svelte Typography 省略号', () => {
    it('CSS 省略号：单行类名，默认不截断文字', () => {
        const { container } = setup({ kind: 'paragraph', text: '是一个很长很长很长很长5号标题', props: { ellipsis: { showTooltip: true } } });
        const node = root(container);
        expect(node).toHaveClass(`${prefix}-ellipsis`, `${prefix}-ellipsis-single-line`, `${prefix}-ellipsis-overflow-ellipsis`);
        expect(node).toHaveTextContent(/^是一个很长很长很长很长5号标题$/);
    });

    it('CSS 省略号：多行时写入 line clamp', () => {
        const { container } = setup({ kind: 'paragraph', text: LETTERS, props: { ellipsis: { rows: 3 } } });
        const node = root(container);
        expect(node).toHaveClass(`${prefix}-ellipsis-multiple-line`);
        expect(node.style.webkitLineClamp).toBe('3');
    });

    it('JS 省略号：截断、展开、收起，展开按钮与 aria-expanded', async () => {
        mockTextHeight(2);
        const onExpand = vi.fn<(expanded: boolean, event: MouseEvent) => void>();
        const { container } = setup({
            kind: 'paragraph',
            text: LETTERS,
            props: { style: lineHeight, ellipsis: { suffix: 'SF', expandable: true, expandText: 'EX', collapsible: true, collapseText: 'CO', onExpand } },
        });
        const node = root(container);
        await vi.waitFor(() => expect(visibleText(node)).toBe('abcdefghijkl...SFEX'));
        const expand = screen.getByRole('button', { name: 'EX' });
        expect(expand).toHaveAttribute('aria-expanded', 'false');
        await fireEvent.click(expand);
        flushSync();
        expect(visibleText(node)).toBe(`${LETTERS}SFCO`);
        expect(onExpand).toHaveBeenLastCalledWith(true, expect.any(MouseEvent));
        expect(screen.getByRole('button', { name: 'CO' })).toHaveAttribute('aria-expanded', 'true');
        await fireEvent.click(screen.getByRole('button', { name: 'CO' }));
        flushSync();
        expect(onExpand).toHaveBeenLastCalledWith(false, expect.any(MouseEvent));
        await vi.waitFor(() => expect(visibleText(node)).toBe('abcdefghijkl...SFEX'));
    });

    it('JS 省略号：pos 为 middle 时保留首尾', async () => {
        mockTextHeight(2);
        const { container } = setup({ kind: 'paragraph', text: LETTERS, props: { style: lineHeight, ellipsis: { pos: 'middle' } } });
        await vi.waitFor(() => expect(visibleText(root(container))).toBe('abcdefgh...stuvwxyz'));
    });

    it('JS 省略号：多行', async () => {
        mockTextHeight(2);
        const { container } = setup({ text: LETTERS + LETTERS, props: { style: lineHeight, strong: true, ellipsis: { rows: 2, suffix: 'SF' } } });
        expect(root(container)).toHaveClass(`${prefix}-ellipsis-multiple-line`);
        await vi.waitFor(() => expect(visibleText(root(container))).toBe('abcdefghijklmnopqrstuvwx...SF'));
    });

    it('首帧显示完整内容与展开按钮，文本变化后重新截断', async () => {
        mockTextHeight(2);
        const { container, state } = setup({ kind: 'paragraph', text: LETTERS, props: { style: lineHeight, ellipsis: { expandable: true } } });
        expect(visibleText(root(container))).toBe(`${LETTERS}展开`);
        await vi.waitFor(() => expect(visibleText(root(container))).toBe('abcdefghijklmn...展开'));
        state.text = LETTERS.toUpperCase();
        flushSync();
        await vi.waitFor(() => expect(visibleText(root(container))).toBe('ABCDEFGHIJKLMN...展开'));
    });

    it('文本能放下时不截断，也不显示展开按钮', async () => {
        mockTextHeight(2);
        const { container } = setup({ kind: 'paragraph', text: 'abc', props: { style: lineHeight, ellipsis: { expandable: true } } });
        await vi.waitFor(() => expect(container.querySelector(`.${prefix}-ellipsis-expand`)).toBeNull());
        expect(visibleText(root(container))).toBe('abc');
    });

    it('语言包中的展开与收起文案为默认值', async () => {
        mockTextHeight(2);
        setup({ kind: 'paragraph', text: LETTERS, props: { style: lineHeight, ellipsis: { expandable: true, collapsible: true } } });
        expect(await screen.findByRole('button', { name: zh_CN.Typography.expand })).toBeInTheDocument();
    });

    it('expandable 且无 collapseText 时展开后移除按钮，焦点移到文字', async () => {
        mockTextHeight(2);
        const { container } = setup({ kind: 'paragraph', text: LETTERS, props: { style: lineHeight, ellipsis: { expandable: true, expandText: 'EX' } } });
        const button = await screen.findByRole('button', { name: 'EX' });
        button.focus();
        await fireEvent.click(button);
        await vi.waitFor(() => expect(document.activeElement).toBe(root(container)));
        expect(root(container)).toHaveAttribute('tabindex', '-1');
        expect(container.querySelector(`.${prefix}-ellipsis-expand`)).toBeNull();
    });

    it('CSS 省略加 showTooltip：未溢出的文字不是 Tab 停靠点，溢出后获得 tabindex', async () => {
        const fits = setup({ kind: 'paragraph', text: LETTERS, props: { ellipsis: { showTooltip: true } } });
        await new Promise((resolve) => requestAnimationFrame(resolve));
        expect(root(fits.container).hasAttribute('tabindex')).toBe(false);
        fits.unmount();

        // a text wider than its box: the container has no width in jsdom, the text does
        vi.spyOn(Range.prototype, 'getBoundingClientRect').mockImplementation(function (this: Range) {
            return { width: this.toString() ? 200 : 0 } as DOMRect;
        });
        const overflowing = setup({ kind: 'paragraph', text: LETTERS, props: { ellipsis: { showTooltip: true } } });
        await vi.waitFor(() => expect(root(overflowing.container)).toHaveAttribute('tabindex', '0'));
    });

    it('showTooltip 的 popover 合并自身 opts 并保留箭头', async () => {
        mockTextHeight(2);
        const { container } = setup({ kind: 'paragraph', text: LETTERS, props: { style: lineHeight, ellipsis: { pos: 'middle', showTooltip: { type: 'popover', opts: { class: 'user-pop' } } } } });
        await vi.waitFor(() => expect(visibleText(root(container))).toContain('...'));
        await fireEvent.mouseEnter(root(container));
        await vi.waitFor(() => expect(document.querySelector(`.${prefix}-ellipsis-popover`)).not.toBeNull());
        const popup = document.querySelector(`.${prefix}-ellipsis-popover`) as HTMLElement;
        expect(popup).toHaveClass('user-pop');
        expect(popup).toHaveTextContent(LETTERS);
        expect(popup.querySelector('.semi-popover-icon-arrow')).not.toBeNull();
    });

    it('showTooltip 的文字保留使用方的 tabindex', async () => {
        const { container } = setup({ kind: 'paragraph', text: LETTERS, props: { tabindex: -1, ellipsis: { showTooltip: true } } });
        await new Promise((resolve) => requestAnimationFrame(resolve));
        expect(root(container)).toHaveAttribute('tabindex', '-1');
    });
});

describe('Svelte Typography Numeral', () => {
    it('按 rule 与 precision 格式化文本，改 props 后重新格式化', async () => {
        const expected = (rule: 'percentages' | 'exponential', precision: number) => new FormatNumeral('1992.1536', rule, precision, 'round').format();
        const { container, state } = setup({ kind: 'numeral', text: '1992.1536', props: { rule: 'percentages', precision: 2 } });
        await vi.waitFor(() => expect(root(container).textContent).toBe(expected('percentages', 2)));
        state.props = { rule: 'exponential', precision: 1 };
        flushSync();
        await vi.waitFor(() => expect(root(container).textContent).toBe(expected('exponential', 1)));
        expect(expected('exponential', 1)).not.toBe(expected('percentages', 2));
    });

    it('parser 在格式化前处理文本', async () => {
        const parser = (value: string) => value.replace(/[^\d.]/g, '');
        const { container } = setup({ kind: 'numeral', text: '$ 1,992.15', props: { precision: 1, parser } });
        await vi.waitFor(() => expect(root(container).textContent).toBe('1992.15'));
    });

    it('文本变化后重新格式化', async () => {
        const { container, state } = setup({ kind: 'numeral', text: '1.234', props: { precision: 1 } });
        await vi.waitFor(() => expect(root(container)).toHaveTextContent(/^1\.2$/));
        state.text = '2.345';
        flushSync();
        await vi.waitFor(() => expect(root(container)).toHaveTextContent(/^2\.3$/));
    });
});
