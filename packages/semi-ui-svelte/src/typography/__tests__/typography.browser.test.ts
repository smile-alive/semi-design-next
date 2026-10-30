import { flushSync } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import Fixture from './typography-fixture.svelte';

const prefix = 'semi-typography';
const LONG = 'The quick brown fox jumps over the lazy dog and keeps running through the forest';
// Longer than two rows of a 300px box, so a two-row ellipsis truncates it
const LONGER = `${LONG} `.repeat(4);

function setup(store: { kind?: 'text' | 'title' | 'paragraph' | 'numeral'; text?: string; props?: Record<string, unknown> }) {
    const state = createStore(store);
    const view = render(Fixture, { props: { store: state } });
    return { state, ...view, node: () => view.container.querySelector(`.${prefix}`) as HTMLElement };
}

// What the reader sees: the full text stays in the DOM, hidden, while the truncated text shows
const visibleText = (node: Element): string => [...node.childNodes].map((child) => (child.nodeType === Node.TEXT_NODE ? child.textContent : child instanceof HTMLElement && child.hidden ? '' : visibleText(child as Element))).join('');

describe('Svelte Typography（浏览器）', () => {
    it('CSS 单行省略：溢出后悬停显示包含全文的 Tooltip，且文字成为 Tab 停靠点', async () => {
        const { node } = setup({ kind: 'paragraph', text: LONG, props: { style: 'width: 120px', ellipsis: { showTooltip: true } } });
        await waitFor(() => expect(node()).toHaveAttribute('tabindex', '0'));
        expect(node().scrollWidth).toBeGreaterThan(node().clientWidth);
        await userEvent.hover(node());
        const tip = await screen.findByRole('tooltip');
        expect(tip).toHaveTextContent(LONG);
        await expect.element(tip).toBeVisible();
    });

    it('CSS 单行省略：放得下的文字没有 tabindex，也不显示 Tooltip', async () => {
        const { node } = setup({ kind: 'paragraph', text: 'short', props: { style: 'width: 300px', ellipsis: { showTooltip: true } } });
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        expect(node().hasAttribute('tabindex')).toBe(false);
        await userEvent.hover(node());
        await new Promise((resolve) => setTimeout(resolve, 300));
        expect(screen.queryByRole('tooltip')).toBeNull();
    });

    it('JS 省略：按真实宽度截断为中间省略，放宽容器后重新测量', async () => {
        const { node, state } = setup({ kind: 'paragraph', text: LONG, props: { style: 'width: 160px', ellipsis: { pos: 'middle' } } });
        await waitFor(() => expect(visibleText(node())).toContain('...'));
        const narrow = visibleText(node());
        expect(node().scrollWidth).toBeLessThanOrEqual(node().clientWidth + 1);
        state.props = { style: 'width: 400px', ellipsis: { pos: 'middle' } };
        flushSync();
        await waitFor(() => expect(visibleText(node()).length).toBeGreaterThan(narrow.length));
        expect(node().scrollWidth).toBeLessThanOrEqual(node().clientWidth + 1);
    });

    it('JS 省略：可展开，展开后显示全文，收起后回到截断', async () => {
        const { node } = setup({ kind: 'paragraph', text: LONG, props: { style: 'width: 200px', ellipsis: { rows: 2, expandable: true, collapsible: true } } });
        const expand = await screen.findByRole('button', { name: '展开' });
        await waitFor(() => expect(visibleText(node())).toContain('...'));
        await userEvent.click(expand);
        await waitFor(() => expect(visibleText(node())).toContain(LONG));
        await userEvent.click(screen.getByRole('button', { name: '收起' }));
        await waitFor(() => expect(visibleText(node())).toContain('...'));
    });

    it('copyable 的复制按钮是唯一的 Tab 停靠点，Enter 复制', async () => {
        // the headless browser has no clipboard permission
        vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
        const { container } = setup({ kind: 'paragraph', text: 'Semi Design', props: { copyable: true } });
        await userEvent.tab();
        const button = screen.getByRole('button', { name: '复制' });
        expect(document.activeElement).toBe(button);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(container.querySelector(`.${prefix}-action-copied`)).not.toBeNull());
        expect(document.activeElement).toBe(screen.getByRole('button'));
    });

    it('悬停复制按钮并点击后，不再显示「复制」提示', async () => {
        vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
        setup({ kind: 'paragraph', text: '点击复制', props: { copyable: { duration: 5 } } });
        const button = screen.getByRole('button', { name: '复制' });
        await userEvent.hover(button);
        await waitFor(() => expect(document.querySelector('[role="tooltip"].semi-tooltip-wrapper-show')).not.toBeNull());
        await userEvent.click(button);
        await waitFor(() => expect(button).toHaveTextContent('复制成功'));
        await waitFor(() => expect(document.querySelector('[role="tooltip"].semi-tooltip-wrapper-show')).toBeNull());
    });

    it('复制按钮变为已复制提示时保持焦点并显示主题焦点环', async () => {
        vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
        setup({ kind: 'paragraph', text: '点击复制', props: { copyable: { duration: 0.3 } } });
        const button = screen.getByRole('button', { name: '复制' });
        await tabTo(button);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(button).toHaveTextContent('复制成功'));
        expect(document.activeElement).toBe(button);
        expectThemeFocusRing(button);
        await waitFor(() => expect(button).toHaveAccessibleName('复制'));
        expect(document.activeElement).toBe(button);
    });

    it('复制按钮的焦点环贴合图标，键盘聚焦不移动文字', async () => {
        const { node } = setup({ kind: 'paragraph', text: '点击复制', props: { copyable: true } });
        const button = screen.getByRole('button', { name: '复制' });
        const icon = button.querySelector('svg') as SVGElement;
        const rect = (element: Element) => element.getBoundingClientRect().toJSON() as DOMRect;
        const before = { paragraph: rect(node()), button: rect(button) };
        const buttonRect = button.getBoundingClientRect();
        const iconRect = icon.getBoundingClientRect();
        for (const side of ['left', 'top', 'right', 'bottom'] as const) {
            expect(Math.abs(buttonRect[side] - iconRect[side])).toBeLessThanOrEqual(1);
        }
        await tabTo(button);
        expectThemeFocusRing(button);
        expect({ paragraph: rect(node()), button: rect(button) }).toEqual(before);
    });

    it.each([
        ['展开按钮', { rows: 2, expandable: true }, 'button.semi-typography-ellipsis-expand'],
        ['复制按钮', undefined, 'button.semi-typography-action-copy-icon'],
        ['带 Tooltip 的截断文字', { rows: 1, showTooltip: true }, `.${prefix}-ellipsis[tabindex="0"]`],
        ['带 Popover 的截断文字', { rows: 1, showTooltip: { type: 'popover' } }, `.${prefix}-ellipsis[tabindex="0"]`],
    ])('%s 显示主题焦点环', async (_, ellipsis, selector) => {
        vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
        const { container } = setup({ kind: 'paragraph', text: LONGER, props: { style: 'width: 300px', ellipsis, copyable: ellipsis === undefined } });
        const element = await waitFor(() => {
            const found = container.querySelector(selector);
            expect(found).not.toBeNull();
            return found as HTMLElement;
        });
        await tabTo(element);
        expectThemeFocusRing(element);
    });

    it('不可收起的展开按钮激活后，焦点移到展开的文字上', async () => {
        const { node } = setup({ kind: 'paragraph', text: LONGER, props: { style: 'width: 300px', ellipsis: { rows: 2, expandable: true } } });
        const button = await screen.findByRole('button', { name: '展开' });
        await tabTo(button);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(node()).toHaveFocus());
        expect(node()).toHaveAttribute('tabindex', '-1');
        expect(screen.queryByRole('button', { name: '展开' })).toBeNull();
    });

    it('ShadowRoot 内不可收起的展开按钮激活后，焦点移到展开的文字上', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const state = createStore({ kind: 'paragraph' as const, text: LONGER, props: { style: 'width: 300px', ellipsis: { rows: 2, expandable: true } } });
        const view = render(Fixture, { props: { store: state }, target: mount });
        try {
            const button = await waitFor(() => {
                const found = shadow.querySelector<HTMLElement>(`.${prefix}-ellipsis-expand`);
                expect(found).not.toBeNull();
                return found as HTMLElement;
            });
            button.focus();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(shadow.activeElement).toBe(shadow.querySelector(`.${prefix}`)));
        } finally {
            view.unmount();
            host.remove();
        }
    });

    it('长度刚好放得下的文本不省略，不显示展开按钮', async () => {
        const { container } = setup({
            kind: 'paragraph',
            text: 'case 3：长度刚好符合预期，不应该省略，不应该显示展开按钮。长度刚好符合预期，不应该省略，不应该显示展开按钮。不应该显示展开的。',
            props: { style: 'width: 300px', ellipsis: { pos: 'middle', rows: 3, expandable: true, collapsible: true, collapseText: '折叠我吧' } },
        });
        // let the resize-observer driven truncation settle before asserting an absence
        await new Promise((resolve) => setTimeout(resolve, 300));
        expect(container.querySelector(`.${prefix}-ellipsis-expand`)).toBeNull();
        expect(visibleText(container.querySelector(`.${prefix}`) as HTMLElement)).toContain('不应该显示展开的。');
    });

    it('JS 省略下文本放得下时不截断，不显示 Tooltip', async () => {
        const { node } = setup({ kind: 'title', text: 'data_tns', props: { heading: 5, style: 'width: 250px; word-break: break-all', ellipsis: { showTooltip: true, suffix: ' ' } } });
        await userEvent.hover(node());
        // wait past the tooltip's open delay before asserting it stayed closed
        await new Promise((resolve) => setTimeout(resolve, 500));
        expect(document.querySelector('.semi-tooltip-content')).toBeNull();
    });

    it('复制按钮的间距只在文字的行内起始侧，RTL 下不会两侧都有', () => {
        const host = document.createElement('div');
        host.dir = 'rtl';
        document.body.append(host);
        const state = createStore({ kind: 'text' as const, text: 'text', props: { copyable: true } });
        const view = render(Fixture, { props: { store: state }, target: host });
        try {
            const style = getComputedStyle(host.querySelector(`.${prefix}-action-copy`) as Element);
            expect(style.marginRight).toBe('4px');
            expect(style.marginLeft).toBe('0px');
        } finally {
            view.unmount();
            host.remove();
        }
    });
});
