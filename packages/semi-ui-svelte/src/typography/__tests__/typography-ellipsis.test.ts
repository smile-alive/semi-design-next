import { flushSync } from 'svelte';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import Extras from './extras-fixture.svelte';
import Fixture from './typography-fixture.svelte';

const prefix = 'semi-typography';
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const lineHeight = 'line-height: 20px';
const width100 = 'width: 100px';

type Store = { kind?: 'text' | 'title' | 'paragraph' | 'numeral'; text?: string; props?: Record<string, unknown> };

function setup(store: Store, target?: HTMLElement) {
    const state = createStore(store);
    const view = render(Fixture, { props: { store: state }, ...(target && { target }) });
    return { state, ...view };
}

const root = (container: Element = document.body) => container.querySelector(`.${prefix}`) as HTMLElement;
const settle = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));
// mouseenter does not bubble: the hover listener sits on the span wrapping the text, a pointer over the text enters it first
const enterText = (node: HTMLElement) => fireEvent.mouseEnter(node.firstElementChild as Element);

// The full text stays in the DOM, hidden, while the truncated text shows; what a reader sees skips it
function visibleText(node: Element): string {
    return [...node.childNodes].map((child) => (child.nodeType === Node.TEXT_NODE ? child.textContent : child instanceof HTMLElement && child.hidden ? '' : visibleText(child as Element))).join('');
}

// jsdom has no layout: the measuring container's height grows `factor` px per character; with line-height 20px a
// single row fits while scrollHeight < 40, i.e. fewer than 40 / factor characters in the container
function mockTextHeight(factor = 2) {
    const state = { factor, calls: 0 };
    vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(function (this: Element) {
        state.calls += 1;
        return (this.textContent?.length ?? 0) * state.factor;
    });
    return state;
}

function mockRangeWidth(width: () => number) {
    vi.spyOn(Range.prototype, 'getBoundingClientRect').mockImplementation(function (this: Range) {
        return { width: this.toString() ? width() : 0 } as DOMRect;
    });
}

function mockSingleRowOverflow(textWidth = 200) {
    const state = { textWidth };
    mockRangeWidth(() => state.textWidth);
    return state;
}

interface FakeObserver {
    callback: ResizeObserverCallback;
    targets: Element[];
}

function captureResizeObserver() {
    const observers: FakeObserver[] = [];
    vi.stubGlobal(
        'ResizeObserver',
        class {
            callback: ResizeObserverCallback;
            targets: Element[] = [];
            constructor(callback: ResizeObserverCallback) {
                this.callback = callback;
                observers.push(this);
            }
            observe(target: Element) {
                this.targets.push(target);
            }
            unobserve(target: Element) {
                this.targets = this.targets.filter((item) => item !== target);
            }
            disconnect() {
                this.targets = [];
            }
        }
    );
    const report = (entries: { target: Element; contentRect: { width: number; height: number } }[]) => observers.forEach(({ callback }) => callback(entries as unknown as ResizeObserverEntry[], {} as ResizeObserver));
    return { observers, report };
}

// An element the text is mounted inside, standing for a composite widget item
function mountIn(tag: string, attrs: Record<string, string>, store: Store) {
    const host = document.createElement(tag);
    Object.entries(attrs).forEach(([name, value]) => host.setAttribute(name, value));
    document.body.append(host);
    onTestFinished(() => host.remove());
    return { host, ...setup(store, host) };
}

const overflowing = (props: Record<string, unknown> = {}, text = 'overflowing text'): Store => ({ text, props: { style: width100, ...props } });

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('Svelte Typography CSS 省略', () => {
    it('自定义 component 的省略类名与 line clamp', async () => {
        const { container, state } = setup({ text: 't', props: { ellipsis: true } });
        expect(root(container)).toHaveClass(`${prefix}-ellipsis`, `${prefix}-ellipsis-single-line`, `${prefix}-ellipsis-overflow-ellipsis`, `${prefix}-ellipsis-overflow-ellipsis-text`);
        state.props = { ellipsis: { rows: 2 } };
        flushSync();
        expect(root(container)).toHaveClass(`${prefix}-ellipsis-multiple-line`, `${prefix}-ellipsis-multiple-line-text`);
        expect(root(container)).not.toHaveClass(`${prefix}-ellipsis-overflow-ellipsis`);
        expect(root(container).style.webkitLineClamp).toBe('2');
    });

    it('Paragraph 多行省略：块级元素没有 -text 类名，pos 为 middle 时改用 JS 省略不写 line clamp，关闭后清掉省略类名', () => {
        const { container, state } = setup({ kind: 'paragraph', text: 't', props: { ellipsis: { rows: 3 } } });
        const element = root(container);
        expect(element).toHaveClass(`${prefix}-ellipsis-multiple-line`);
        expect(element).not.toHaveClass(`${prefix}-ellipsis-multiple-line-text`);
        expect(element.style.webkitLineClamp).toBe('3');
        state.props = { ellipsis: { rows: 3, pos: 'middle' } };
        flushSync();
        expect(element).toHaveClass(`${prefix}-ellipsis-multiple-line`);
        expect(element.style.webkitLineClamp).toBe('');
        state.props = { ellipsis: false };
        flushSync();
        expect(element.className).not.toMatch(/ellipsis/);
    });

    it('省略配置变化：带 expandText 或 popover 时改为 JS 省略，不再使用 CSS 溢出省略', () => {
        const { container, state } = setup({ kind: 'paragraph', text: '是一个很长很长很长很长5号标题', props: { style: 'width: 250px', ellipsis: { showTooltip: true } } });
        expect(root(container)).toHaveClass(`${prefix}-ellipsis`, `${prefix}-ellipsis-single-line`, `${prefix}-ellipsis-overflow-ellipsis`);
        state.text = '的撒的撒打算的撒的撒的撒打算打的撒的撒打算的撒的撒的撒打算打';
        flushSync();
        expect(root(container)).toHaveClass(`${prefix}-ellipsis-overflow-ellipsis`);
        expect(root(container)).toHaveTextContent(/^的撒的撒打算的撒的撒的撒打算打的撒的撒打算的撒的撒的撒打算打$/);
        state.props = { style: 'width: 250px', ellipsis: { expandText: 'expandText', collapseText: 'collapseText', rows: 1, showTooltip: { type: 'popover' }, suffix: 'suffix' } };
        flushSync();
        expect(root(container)).toHaveClass(`${prefix}-ellipsis`, `${prefix}-ellipsis-single-line`);
        expect(root(container)).not.toHaveClass(`${prefix}-ellipsis-overflow-ellipsis`);
    });

    it('showTooltip.type 或 suffix 显式为 undefined 时按缺省处理', () => {
        const { container } = setup({ text: 'text', props: { ellipsis: { showTooltip: { type: undefined }, suffix: undefined } } });
        expect(root(container)).toHaveClass(`${prefix}-ellipsis-overflow-ellipsis`);
    });

    it('CSS 省略在行溢出时显示包含完整文本的 Tooltip', async () => {
        mockSingleRowOverflow(200);
        const { container } = setup(overflowing({ ellipsis: { showTooltip: true } }));
        await waitFor(() => expect(root(container)).toHaveAttribute('tabindex', '0'));
        await userEvent.hover(root(container));
        await waitFor(() => expect(document.querySelector('.semi-tooltip-content')).toHaveTextContent('overflowing text'));
        expect(document.querySelector('.semi-popover-content')).toBeNull();
    });

    it('showTooltip 的 popover 合并自身 opts（class、style）并保留箭头', async () => {
        mockSingleRowOverflow(200);
        const { container } = setup(overflowing({ ellipsis: { showTooltip: { type: 'popover', opts: { class: 'user-pop', style: 'color: red' } } } }, 'popover text'));
        await waitFor(() => expect(root(container)).toHaveAttribute('tabindex', '0'));
        await userEvent.hover(root(container));
        await waitFor(() => expect(document.querySelector('.semi-popover-content')).not.toBeNull());
        const popover = document.querySelector(`.${prefix}-ellipsis-popover`) as HTMLElement;
        expect(popover).toHaveClass('user-pop');
        expect(popover).toHaveTextContent('popover text');
        expect(popover.style.color).toBe('red');
        expect(document.querySelector('.semi-popover-icon-arrow')).not.toBeNull();
    });

    it('文本未溢出时不显示 Tooltip，悬停时重新检查 CSS 溢出', async () => {
        const width = mockSingleRowOverflow(10);
        const { container } = render(Extras, { props: { mode: 'tip', text: 'fits', props: { ellipsis: { showTooltip: true }, style: width100 } } });
        await settle();
        expect(screen.queryByTestId('tip')).toBeNull();
        width.textWidth = 200;
        await enterText(root(container));
        await waitFor(() => expect(screen.getByTestId('tip')).toHaveAttribute('data-content', 'fits'));
        expect(screen.getByTestId('tip').querySelector(`.${prefix}`)).toHaveTextContent(/^fits$/);
    });

    it('单行溢出判断按子像素与 border 语义计算（回归 #2350/#3340）', async () => {
        // jsdom has no layout: container rect, text Range rect and padding/border are mocked; the verdict is observed
        // through the ellipsisTooltip snippet (rendered only on overflow)
        const originalGetComputedStyle = window.getComputedStyle;
        const verdict = async (containerWidth: number, textWidth: number, padding: string, border: string) => {
            vi.restoreAllMocks();
            mockRangeWidth(() => textWidth);
            const containerRect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: containerWidth } as DOMRect);
            vi.spyOn(window, 'getComputedStyle').mockImplementation((element, ...rest) => (element.classList.contains(prefix) ? ({ paddingLeft: padding, paddingRight: padding, borderLeftWidth: border, borderRightWidth: border } as CSSStyleDeclaration) : originalGetComputedStyle.call(window, element, ...rest)));
            const view = render(Extras, { props: { mode: 'tip', text: 'test', props: { ellipsis: { showTooltip: true } } } });
            await waitFor(() => expect(containerRect).toHaveBeenCalled());
            await settle();
            const result = screen.queryByTestId('tip') !== null;
            view.unmount();
            return result;
        };
        expect(await verdict(32.3046875, 32.3046875, '0px', '0px')).toBe(false);
        expect(await verdict(100, 98, '0px', '2px')).toBe(true);
        expect(await verdict(100, 90, '10px', '0px')).toBe(true);
        expect(await verdict(100, 30, '0px', '2px')).toBe(false);
    });

    it('ellipsisContent snippet 替换 tooltip 与 popover 的内容', async () => {
        for (const type of ['tooltip', 'popover'] as const) {
            mockSingleRowOverflow(200);
            const { container, unmount } = render(Extras, { props: { mode: 'ellipsisContent', type } });
            await waitFor(() => expect(root(container)).toHaveAttribute('tabindex', '0'));
            await userEvent.hover(root(container));
            await waitFor(() => expect(document.querySelector(`.semi-${type}-content`)).toHaveTextContent('custom content'));
            unmount();
            vi.restoreAllMocks();
        }
    });

    it('提供 ellipsisTooltip snippet 时不再渲染内置 Tooltip', async () => {
        mockSingleRowOverflow(200);
        render(Extras, { props: { mode: 'tip', text: 'text', props: { ellipsis: { showTooltip: true }, style: width100 } } });
        await waitFor(() => expect(screen.getByTestId('tip')).toBeInTheDocument());
        await userEvent.hover(screen.getByText('text'));
        await settle();
        expect(document.querySelector('.semi-tooltip-content')).toBeNull();
    });

    it('ellipsisTooltip 的 content 是去掉首尾空白的全文，copyAction 的 config 为解析后的配置', async () => {
        mockSingleRowOverflow(200);
        const { container } = render(Extras, { props: { mode: 'tipWithCopyAction', text: '  full text  ' } });
        await waitFor(() => expect(screen.getByTestId('tip')).toBeInTheDocument());
        expect(screen.getByTestId('tip')).toHaveAttribute('data-content', 'full text');
        await waitFor(() => expect(container.querySelector('.copy')).toHaveAttribute('data-content', 'full text'));
        expect(container.querySelector('.copy')).toHaveAttribute('data-duration', '5');
    });

    it('带 showTooltip 时属性与监听落在文字根元素，不落在弹层', async () => {
        mockSingleRowOverflow(200);
        const onclick = vi.fn<(event: MouseEvent) => void>();
        const { container } = setup({ text: 'text', props: { ellipsis: { rows: 2, showTooltip: true }, weight: 600, id: 'own', 'data-x': 'x', class: 'user', style: 'font-weight: 300; -webkit-line-clamp: 5', onclick } });
        const element = root(container);
        expect(element).toHaveAttribute('id', 'own');
        expect(element).toHaveAttribute('data-x', 'x');
        expect(element).toHaveClass('user');
        expect(element.style.fontWeight).toBe('300');
        expect(element.style.webkitLineClamp).toBe('2');
        await userEvent.click(element);
        expect(onclick).toHaveBeenCalledTimes(1);
        await userEvent.hover(element);
        expect(document.querySelector('.semi-tooltip-wrapper #own, .semi-tooltip-wrapper .user')).toBeNull();
    });

    it('没有内容时不渲染截断文本，也不显示展开按钮', async () => {
        render(Extras, { props: { mode: 'noContent' } });
        await settle();
        expect(document.querySelectorAll(`.${prefix}-ellipsis`)).toHaveLength(2);
        expect(document.querySelector(`.${prefix}-ellipsis-expand`)).toBeNull();
    });

    it('测量前后文本一致，不因测量改写文字', async () => {
        const { container } = setup({ text: ' init.txt ', props: { ellipsis: { showTooltip: true } } });
        const before = root(container).textContent;
        await settle();
        expect(root(container).textContent).toBe(before);
        expect(root(container)).toHaveTextContent('init.txt');
    });
});

describe('Svelte Typography 省略与 Tab 停靠点', () => {
    it('showTooltip 的提示随溢出状态开关，根元素保持同一个节点', async () => {
        const width = mockSingleRowOverflow(10);
        const { container } = setup(overflowing({ ellipsis: { showTooltip: true } }));
        const before = root(container);
        await settle();
        expect(before).not.toHaveAttribute('tabindex');
        width.textWidth = 200;
        await enterText(before);
        await waitFor(() => expect(before).toHaveAttribute('tabindex', '0'));
        expect(root(container)).toBe(before);
        await userEvent.hover(before);
        await waitFor(() => expect(document.querySelector('.semi-tooltip-content')).toHaveTextContent('overflowing text'));
    });

    it('popover 分支溢出切换时根元素节点不变', async () => {
        const width = mockSingleRowOverflow(10);
        const { container } = setup(overflowing({ ellipsis: { showTooltip: { type: 'popover' } } }, 'popover'));
        const before = root(container);
        await settle();
        width.textWidth = 200;
        await enterText(before);
        await waitFor(() => expect(before).toHaveAttribute('tabindex', '0'));
        expect(root(container)).toBe(before);
    });

    it.each(['tooltip', 'popover'] as const)('%s 分支未溢出时文字不是 Tab 停靠点', async (type) => {
        mockSingleRowOverflow(10);
        const { container } = setup(overflowing({ ellipsis: { showTooltip: { type } } }, 'fits'));
        await settle();
        expect(root(container)).not.toHaveAttribute('tabindex');
    });

    it('opts.condition 为 false 时已溢出的文字不是 Tab 停靠点，使用方的 tabindex 保留', async () => {
        mockSingleRowOverflow(200);
        const { container } = setup(overflowing({ ellipsis: { showTooltip: { opts: { condition: false } } } }, 'text'));
        await settle();
        expect(root(container)).not.toHaveAttribute('tabindex');
        const own = setup(overflowing({ ellipsis: { showTooltip: true }, tabindex: -1 }, 'text'));
        await settle();
        expect(root(own.container)).toHaveAttribute('tabindex', '-1');
    });

    it('文字不在组合控件条目内时注入 tabindex', async () => {
        mockSingleRowOverflow(200);
        const { container } = setup(overflowing({ ellipsis: { showTooltip: true } }, 'plain text'));
        await waitFor(() => expect(root(container)).toHaveAttribute('tabindex', '0'));
    });

    it.each(['tooltip', 'popover'] as const)('位于 activedescendant 条目内的文字（%s）不注入 tabindex，提示仍可悬停显示', async (type) => {
        mockSingleRowOverflow(200);
        const { host } = mountIn('div', { role: 'option' }, overflowing({ ellipsis: { showTooltip: { type } } }, 'option text'));
        await settle();
        await userEvent.hover(root(host));
        await waitFor(() => expect(document.querySelector(`.semi-${type}-content`)).toHaveTextContent('option text'));
        expect(root(host)).not.toHaveAttribute('tabindex');
    });

    it.each([
        ['button', {}],
        ['div', { role: 'button' }],
        ['a', { href: '#' }],
        ['div', { role: 'menuitemradio' }],
    ] as const)('位于 %s 内的文字不成为独立的 Tab 停靠点，提示仍可悬停显示', async (tag, attrs) => {
        mockSingleRowOverflow(200);
        const { host } = mountIn(tag, attrs, overflowing({ ellipsis: { showTooltip: true } }, 'host text'));
        await settle();
        await userEvent.hover(root(host));
        await waitFor(() => expect(document.querySelector('.semi-tooltip-content')).toHaveTextContent('host text'));
        expect(root(host)).not.toHaveAttribute('tabindex');
    });

    it('位于带对勾的 DropdownItem 内的文字不成为独立的 Tab 停靠点', async () => {
        mockSingleRowOverflow(200);
        render(Extras, { props: { mode: 'dropdownItem' } });
        const item = screen.getByRole('menuitemcheckbox');
        await settle();
        await userEvent.hover(root(item));
        await waitFor(() => expect(document.querySelector('.semi-tooltip-content')).toHaveTextContent('checked text'));
        expect(root(item)).not.toHaveAttribute('tabindex');
    });

    it('文字含 href 链接时，根元素不再成为第二个 Tab 停靠点', async () => {
        mockSingleRowOverflow(200);
        const { container } = setup(overflowing({ link: { href: '#' }, ellipsis: { showTooltip: true } }, 'link text'));
        await settle();
        expect(root(container)).not.toHaveAttribute('tabindex');
        expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('文字含可点击的 link 时，根元素不再成为第二个 Tab 停靠点', async () => {
        mockSingleRowOverflow(200);
        const { container } = setup(overflowing({ link: true, ellipsis: { showTooltip: true }, onclick: vi.fn<(event: MouseEvent) => void>() }, 'link text'));
        await settle();
        expect(root(container)).not.toHaveAttribute('tabindex');
    });

    it('文字含 href 链接时，提示的 aria-describedby 落在链接上而不是根元素', async () => {
        mockSingleRowOverflow(200);
        const { container } = setup(overflowing({ link: { href: '#' }, ellipsis: { showTooltip: true } }, 'link text'));
        await settle();
        await userEvent.hover(screen.getByRole('link'));
        const tip = await screen.findByRole('tooltip');
        await waitFor(() => expect(screen.getByRole('link')).toHaveAttribute('aria-describedby', tip.id));
        expect(root(container)).not.toHaveAttribute('aria-describedby');
    });

    it('文字没有可聚焦的链接时，aria-describedby 仍在根元素上', async () => {
        mockSingleRowOverflow(200);
        const { container } = setup(overflowing({ ellipsis: { showTooltip: true } }, 'plain text'));
        await settle();
        await enterText(root(container));
        await userEvent.hover(root(container));
        const tip = await screen.findByRole('tooltip');
        await waitFor(() => expect(root(container)).toHaveAttribute('aria-describedby', tip.id));
    });

    it('文字含按钮但没有 link 装饰时，aria-describedby 仍在根元素上', async () => {
        mockSingleRowOverflow(200);
        const { container } = render(Extras, { props: { mode: 'buttonInside' } });
        await settle();
        await userEvent.hover(root(container));
        const tip = await screen.findByRole('tooltip');
        await waitFor(() => expect(root(container)).toHaveAttribute('aria-describedby', tip.id));
    });

    it('监听根元素及其父元素，Tooltip 开始包裹后同样生效', async () => {
        mockSingleRowOverflow(200);
        const { observers } = captureResizeObserver();
        const { container } = render(Extras, { props: { mode: 'section' } });
        const before = root(container);
        await waitFor(() => expect(root(container)).toHaveAttribute('tabindex', '0'));
        expect(root(container)).toBe(before);
        const targets = observers.flatMap((observer) => observer.targets);
        expect(targets).toContain(before);
        expect(targets).toContain(container.querySelector('section'));
    });
});

describe('Svelte Typography JS 省略', () => {
    it('首帧渲染完整文本和展开按钮，之后再进行截断；放得下的文本不显示展开按钮', async () => {
        mockTextHeight(2);
        const { container } = setup({ kind: 'paragraph', text: LETTERS, props: { style: lineHeight, ellipsis: { expandable: true, expandText: 'EX' } } });
        expect(visibleText(root(container))).toBe(`${LETTERS}EX`);
        await waitFor(() => expect(visibleText(root(container))).toBe('abcdefghijklmn...EX'));

        const fits = setup({ kind: 'paragraph', text: 'short', props: { style: lineHeight, ellipsis: { expandable: true, expandText: 'EX' } } });
        expect(screen.getAllByRole('button', { name: 'EX' })).toHaveLength(2);
        await waitFor(() => expect(visibleText(root(fits.container))).toBe('short'));
        expect(fits.container.querySelector(`.${prefix}-ellipsis-expand`)).toBeNull();
    });

    it('expandable 未设置 collapsible 时：展开按钮是 type=button 的原生按钮，展开后文本不含收起文案，焦点移到文字', async () => {
        mockTextHeight(2);
        const onExpand = vi.fn<(expanded: boolean, event: MouseEvent) => void>();
        const { container } = setup({ kind: 'paragraph', text: LETTERS, props: { style: lineHeight, ellipsis: { expandable: true, expandText: 'EX', onExpand } } });
        await waitFor(() => expect(visibleText(root(container))).toBe('abcdefghijklmn...EX'));
        const button = screen.getByRole('button', { name: 'EX' });
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(root(container)).not.toHaveAttribute('tabindex');
        button.focus();
        await userEvent.keyboard('{Enter}');
        expect(onExpand).toHaveBeenCalledTimes(1);
        expect(onExpand.mock.calls[0][0]).toBe(true);
        expect(onExpand.mock.calls[0][1]).toBeInstanceOf(MouseEvent);
        expect(visibleText(root(container))).toBe(LETTERS);
        expect(container.querySelector(`.${prefix}-ellipsis-expand`)).toBeNull();
        await waitFor(() => expect(root(container)).toHaveFocus());
        expect(root(container)).toHaveAttribute('tabindex', '-1');
    });

    it('展开按钮与原生按钮一样响应 Space，aria-expanded 反映展开状态', async () => {
        mockTextHeight(2);
        const { container } = setup({ kind: 'paragraph', text: LETTERS, props: { style: lineHeight, ellipsis: { expandable: true, collapsible: true } } });
        await waitFor(() => expect(visibleText(root(container))).toMatch(/\.\.\.展开$/));
        screen.getByRole('button', { name: zh_CN.Typography.expand }).focus();
        await userEvent.keyboard(' ');
        expect(visibleText(root(container))).toBe(`${LETTERS}收起`);
        expect(screen.getByRole('button', { name: zh_CN.Typography.collapse })).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('button', { name: zh_CN.Typography.collapse })).toHaveFocus();
        expect(root(container)).not.toHaveAttribute('tabindex');
    });

    it('显式 expandText、collapseText 为 undefined 时回落到语言包文案', async () => {
        mockTextHeight(2);
        setup({ kind: 'paragraph', text: LETTERS, props: { style: lineHeight, ellipsis: { expandable: true, collapsible: true, expandText: undefined, collapseText: undefined } } });
        await userEvent.click(await screen.findByRole('button', { name: zh_CN.Typography.expand }));
        expect(screen.getByRole('button', { name: zh_CN.Typography.collapse })).toBeInTheDocument();
    });

    it('只设 expandText 而不可展开时，按钮不带 aria-expanded', async () => {
        mockTextHeight(2);
        setup({ kind: 'paragraph', text: LETTERS, props: { style: lineHeight, ellipsis: { expandText: 'EX' } } });
        expect(await screen.findByRole('button', { name: 'EX' })).not.toHaveAttribute('aria-expanded');
    });

    it('新文本会重置展开状态并重新截断，重测前显示新的完整文本', async () => {
        mockTextHeight(2);
        const ellipsis = { expandable: true, expandText: 'EX', collapsible: true, collapseText: 'CO' };
        const { container, state } = setup({ kind: 'paragraph', text: LETTERS, props: { style: lineHeight, ellipsis } });
        await waitFor(() => expect(visibleText(root(container))).toBe('abcdefghijklmn...EX'));
        await userEvent.click(screen.getByRole('button', { name: 'EX' }));
        expect(visibleText(root(container))).toMatch(/CO$/);
        state.text = LETTERS.toUpperCase();
        flushSync();
        await waitFor(() => expect(visibleText(root(container))).toBe('ABCDEFGHIJKLMN...EX'));
    });

    it('无关的状态变化且文本不变时保持展开状态', async () => {
        mockTextHeight(2);
        const ellipsis = { expandable: true, expandText: 'EX', collapsible: true, collapseText: 'CO' };
        const { container, state } = setup({ kind: 'paragraph', text: LETTERS, props: { style: lineHeight, ellipsis, 'data-tick': 0 } });
        await waitFor(() => expect(visibleText(root(container))).toBe('abcdefghijklmn...EX'));
        await userEvent.click(screen.getByRole('button', { name: 'EX' }));
        expect(visibleText(root(container))).toMatch(/CO$/);
        state.props = { style: lineHeight, ellipsis, 'data-tick': 1 };
        flushSync();
        await settle();
        expect(visibleText(root(container))).toBe(`${LETTERS}CO`);
        state.text = `${LETTERS}XYZ`;
        flushSync();
        await waitFor(() => expect(visibleText(root(container))).toBe('abcdefghijklmn...EX'));
    });

    it('内联的 ellipsis 对象重新求值但取值不变时，不重新测量', async () => {
        const height = mockTextHeight(2);
        const counter = createStore({ n: 1 });
        const { container } = render(Extras, { props: { mode: 'derivedEllipsis', counter } });
        await waitFor(() => expect(visibleText(root(container))).toBe('abcdefghijklmn...EX'));
        await settle();
        const calls = height.calls;
        counter.n = 2;
        flushSync();
        await settle();
        expect(height.calls).toBe(calls);
    });

    it('省略号配置变化后重新测量截断', async () => {
        mockTextHeight(2);
        const { container, state } = setup({ kind: 'paragraph', text: LETTERS, props: { style: lineHeight, ellipsis: { expandable: true, expandText: 'EX' } } });
        await waitFor(() => expect(visibleText(root(container))).toBe('abcdefghijklmn...EX'));
        state.props = { style: lineHeight, ellipsis: { expandable: true, expandText: 'EX', suffix: 'SUFFIX' } };
        flushSync();
        await waitFor(() => expect(visibleText(root(container))).toBe('abcdefgh...SUFFIXEX'));
    });

    it('挂载后容器尺寸变化会重新测量 JS 截断', async () => {
        const height = mockTextHeight(2);
        const { report } = captureResizeObserver();
        const { container } = setup({ kind: 'paragraph', text: LETTERS, props: { style: lineHeight, ellipsis: { expandable: true, expandText: 'EX' } } });
        await waitFor(() => expect(visibleText(root(container))).toBe('abcdefghijklmn...EX'));
        await settle(20);
        height.factor = 4;
        report([{ target: root(container), contentRect: { width: 50, height: 20 } }]);
        await waitFor(() => expect(visibleText(root(container))).toBe('abcd...EX'));
    });

    it('先能放下的文本在容器变窄后截断时，按展开按钮的宽度预留', async () => {
        const height = mockTextHeight(1);
        const { report } = captureResizeObserver();
        const { container } = setup({ kind: 'paragraph', text: LETTERS, props: { style: lineHeight, ellipsis: { expandable: true, expandText: 'EX' } } });
        await waitFor(() => expect(visibleText(root(container))).toBe(LETTERS));
        expect(container.querySelector(`.${prefix}-ellipsis-expand`)).toBeNull();
        await settle(20);
        height.factor = 2;
        report([{ target: root(container), contentRect: { width: 50, height: 20 } }]);
        await waitFor(() => expect(visibleText(root(container))).toBe('abcdefghijklmn...EX'));
    });

    it('展开期间容器变窄，收起后按新宽度重新截断', async () => {
        const height = mockTextHeight(2);
        const { report } = captureResizeObserver();
        const { container } = setup({ kind: 'paragraph', text: LETTERS, props: { style: lineHeight, ellipsis: { expandable: true, collapsible: true, expandText: 'EX', collapseText: 'CO' } } });
        await waitFor(() => expect(visibleText(root(container))).toBe('abcdefghijklmn...EX'));
        await settle(20);
        await userEvent.click(screen.getByRole('button', { name: 'EX' }));
        expect(visibleText(root(container))).toBe(`${LETTERS}CO`);
        height.factor = 4;
        report([{ target: root(container), contentRect: { width: 50, height: 20 } }]);
        // the measurement frame of this report runs while the text is expanded
        await settle();
        await userEvent.click(screen.getByRole('button', { name: 'CO' }));
        await waitFor(() => expect(visibleText(root(container))).toBe('abcd...EX'));
    });

    it('展开后改为可用 CSS 省略的配置，回到收起状态并用 CSS 省略', async () => {
        mockTextHeight(2);
        const { container, state } = setup({ kind: 'paragraph', text: LETTERS, props: { style: lineHeight, ellipsis: { expandable: true, collapsible: true } } });
        await userEvent.click(await screen.findByRole('button', { name: zh_CN.Typography.expand }));
        state.props = { style: lineHeight, ellipsis: { rows: 1 } };
        flushSync();
        await waitFor(() => expect(root(container)).toHaveClass(`${prefix}-ellipsis-overflow-ellipsis`));
    });

    it('JS 省略配合 showTooltip 时，仅在截断时显示提示', async () => {
        mockTextHeight(2);
        const config = { kind: 'paragraph' as const, props: { style: lineHeight, ellipsis: { suffix: '!', showTooltip: true } } };
        const first = render(Extras, { props: { mode: 'tip', text: LETTERS, ...config } });
        await waitFor(() => expect(visibleText(screen.getByTestId('tip'))).toBe('abcdefghijklmno...!'));
        first.unmount();

        render(Extras, { props: { mode: 'tip', text: 'short', ...config } });
        expect(screen.getByTestId('tip')).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByTestId('tip')).toBeNull());
        expect(visibleText(root())).toBe('short!');
    });

    it('JS 省略对多段文本、数字与元素都不警告', async () => {
        mockTextHeight(2);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { container } = render(Extras, { props: { mode: 'conditional' } });
        await waitFor(() => expect(visibleText(container.querySelector(`.${prefix}-paragraph`) as HTMLElement)).toContain('...'));
        expect(warn).not.toHaveBeenCalled();
    });
});
