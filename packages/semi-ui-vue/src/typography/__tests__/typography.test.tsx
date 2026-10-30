/** @jsxImportSource vue */
import { defineComponent, nextTick, type StyleValue } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { escapeRegExp } from 'es-toolkit';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, onTestFinished, vi, type Mock } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconSetting } from '@fibrae/semi-icons-vue';
import { render, sleep } from '@test/utils/vue';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import { DropdownItem } from '../../dropdown';
import Typography, { TypographyNumeral, TypographyParagraph, TypographyText, TypographyTitle, type TypographyCopyActionProps, type TypographyCopyableConfig, type TypographyEllipsisTooltipProps, type TypographyNumeralProps, type TypographyTitleProps } from '../index';
import type { TypographyBaseProps } from '../internal';
import Conditional from './fixtures/conditional.vue';
import InlineEllipsis from './fixtures/inline-ellipsis.vue';
import MultilineCopy from './fixtures/multiline-copy.vue';
import NumeralNested from './fixtures/numeral-nested.vue';
import NumeralScoped from './fixtures/numeral-scoped.vue';
import NumeralStatic from './fixtures/numeral-static.vue';
import NumeralTemplate from './fixtures/numeral-template.vue';
import ParagraphText from './fixtures/paragraph-text.vue';
import Roots from './fixtures/roots.vue';
import TemplateText from './fixtures/template-text.vue';

const prefix = 'semi-typography';
const Text = TypographyText;
const Title = TypographyTitle;
const Paragraph = TypographyParagraph;
const Numeral = TypographyNumeral;
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const lineHeight = { lineHeight: '20px' };
type CopyPayload = [MouseEvent, string, boolean];

const Box = defineComponent({
    setup:
        (_, { slots }) =>
        () => <em>{slots.default?.()}</em>,
});

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

// Vue leaves empty text anchors and comments among the root's child nodes; like in a browser they take no width
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

const root = (container: Element = document.body) => container.querySelector<HTMLElement>(`.${prefix}`) as HTMLElement;
const textSlot = (value: string) => ({ default: () => value });

let writeText: Mock<(data: string) => Promise<void>>;

beforeEach(() => {
    // jsdom has no Clipboard API
    writeText = vi.fn<(data: string) => Promise<void>>().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

afterEach(() => {
    vi.useRealTimers();
    semiGlobal.config = {};
});

describe('Typography', () => {
    it('自定义组件', () => {
        const title = render(Title, { props: { component: 'div', heading: 1 }, slots: textSlot('Semi Design') });
        expect(title.container.querySelectorAll(`div.${prefix}-h1`)).toHaveLength(1);
        const text = render(Text, { props: { component: 'div' }, attrs: { id: 'text' }, slots: textSlot('Semi') });
        const nodes = text.container.querySelectorAll(`div.${prefix}`);
        expect(nodes).toHaveLength(1);
        expect(nodes[0]).toHaveAttribute('id', 'text');
        const paragraph = render(Paragraph, { props: { component: 'div' }, slots: textSlot('Semi Design') });
        expect(paragraph.container.querySelectorAll(`div.${prefix}-paragraph`)).toHaveLength(1);
    });

    it('typography 可复制', async () => {
        const view = render(Paragraph, { props: { copyable: true }, slots: textSlot('Semi Design') });
        const icons = view.container.querySelectorAll('.semi-icon-copy');
        expect(icons).toHaveLength(1);
        await userEvent.click(icons[0]);
        await waitFor(() => expect(view.emitted('copy')).toHaveLength(1));
        expect(writeText).toHaveBeenCalledWith('Semi Design');
        const [event, ...rest] = view.emitted<CopyPayload>('copy')[0];
        expect(event).toBeInstanceOf(MouseEvent);
        expect(rest).toEqual(['Semi Design', true]);
        await waitFor(() => expect(view.container.querySelectorAll(`.${prefix}-action-copied`)).toHaveLength(1));
        await view.rerender({ copyable: false });
        expect(view.container.querySelector('.semi-icon-copy')).toBeNull();
    });

    it('复制按钮有可访问名称，按 Enter 和 Space 可复制', async () => {
        const view = render(Paragraph, { props: { copyable: { duration: 0.01 } }, slots: textSlot('Semi Design') });
        screen.getByRole('button', { name: zh_CN.Typography.copy }).focus();
        await userEvent.keyboard(' ');
        await waitFor(() => expect(view.emitted('copy')).toHaveLength(1));
        await waitFor(() => expect(screen.getByRole('button', { name: zh_CN.Typography.copy })).toBeInTheDocument());
        screen.getByRole('button', { name: zh_CN.Typography.copy }).focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(view.emitted('copy')).toHaveLength(2));
        view.unmount();

        const named = render(Paragraph, {
            props: { copyable: true },
            slots: { default: () => 'Semi Design', copyIcon: () => <IconSetting aria-label="Copy code" /> },
        });
        expect(await screen.findByRole('button', { name: 'Copy code' })).toBeInTheDocument();
        named.unmount();
        render(Paragraph, {
            props: { copyable: true },
            slots: { default: () => 'Semi Design', copyIcon: () => <IconSetting /> },
        });
        expect(screen.getByRole('button', { name: zh_CN.Typography.copy })).toBeInTheDocument();
    });

    it.each([
        ['default icon', undefined],
        ['custom icon', () => <IconSetting />],
    ])('%s 按钮在已复制状态下保持焦点，且仅在未复制时才复制', async (_, copyIcon) => {
        const view = render(Paragraph, {
            props: { copyable: { duration: 0.2 } },
            slots: { default: () => 'Semi Design', ...(copyIcon && { copyIcon }) },
        });
        const button = screen.getByRole('button', { name: zh_CN.Typography.copy });
        button.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(button).toHaveAccessibleName(zh_CN.Typography.copied));
        expect(button).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        await userEvent.click(button);
        expect(view.emitted('copy')).toHaveLength(1);
        await waitFor(() => expect(button).toHaveAccessibleName(zh_CN.Typography.copy));
        expect(button).toHaveFocus();
    });

    it('焦点在其他元素时复制，不会抢走焦点', async () => {
        const other = document.createElement('button');
        other.textContent = 'other';
        document.body.append(other);
        onTestFinished(() => other.remove());
        render(Paragraph, { props: { copyable: { duration: 0.05 } }, slots: textSlot('Semi Design') });
        other.focus();
        await fireEvent.click(screen.getByRole('button', { name: zh_CN.Typography.copy }));
        await waitFor(() => expect(document.querySelector(`.${prefix}-action-copied`)).toBeInTheDocument());
        expect(other).toHaveFocus();
    });

    it('typography 可复制时，剪贴板写入被拒绝会报错且保持未复制状态', async () => {
        writeText.mockRejectedValue(new Error('NotAllowedError'));
        const view = render(Paragraph, { props: { copyable: true }, slots: textSlot('Semi Design') });
        await userEvent.click(view.container.querySelector('.semi-icon-copy') as Element);
        await waitFor(() => expect(view.emitted('copy')).toHaveLength(1));
        expect(view.emitted<CopyPayload>('copy')[0].slice(1)).toEqual(['Semi Design', false]);
        expect(view.container.querySelector(`.${prefix}-action-copied`)).toBeNull();
    });

    it('typography 可复制时，重复复制会重新计时已复制状态', async () => {
        vi.useFakeTimers();
        render(Paragraph, {
            props: { copyable: { duration: 3 } },
            slots: {
                default: () => 'Semi Design',
                copyAction: ({ copied, copy }: TypographyCopyActionProps) => <button onClick={copy}>{copied ? 'copied' : 'copy'}</button>,
            },
        });
        const button = screen.getByRole('button');
        await fireEvent.click(button);
        await vi.advanceTimersByTimeAsync(2000);
        await fireEvent.click(button);
        await vi.advanceTimersByTimeAsync(2000);
        expect(button).toHaveTextContent('copied');
        await vi.advanceTimersByTimeAsync(1000);
        expect(button).toHaveTextContent('copy');
    });

    it('typography link 用法', async () => {
        const view = render(Text, { props: { link: { href: 'https://semi.design/' } }, slots: textSlot('链接文本') });
        expect(view.container.querySelectorAll(`.${prefix}.${prefix}-link`)).toHaveLength(1);
        expect(screen.getByRole('link', { name: '链接文本' })).toHaveAttribute('href', 'https://semi.design/');
        await view.rerender({ disabled: true, link: { href: 'https://semi.design/' } });
        expect(view.container.querySelectorAll(`.${prefix}.${prefix}-disabled`)).toHaveLength(1);
        await view.rerender({ disabled: true, link: false, underline: true });
        expect(view.container.querySelectorAll(`.${prefix} u`)).toHaveLength(1);
    });

    it('typography 省略号用法', async () => {
        const view = render(ParagraphText, {
            props: { text: '是一个很长很长很长很长5号标题' },
            attrs: { style: { width: '250px' }, ellipsis: { showTooltip: true } },
        });
        const paragraph = () => root(view.container);
        // jsdom has no layout, so only the ellipsis strategy (css single line by default) is observable
        expect(paragraph()).toHaveClass(`${prefix}-ellipsis`, `${prefix}-ellipsis-single-line`);
        expect(paragraph()).toHaveClass(`${prefix}-ellipsis-overflow-ellipsis`);
        expect(paragraph()).toHaveTextContent(/^是一个很长很长很长很长5号标题$/);

        await view.rerender({ text: '的撒的撒打算的撒的撒的撒打算打的撒的撒打算的撒的撒的撒打算打' });
        expect(paragraph()).toHaveClass(`${prefix}-ellipsis-overflow-ellipsis`);
        expect(paragraph()).toHaveTextContent(/^的撒的撒打算的撒的撒的撒打算打的撒的撒打算的撒的撒的撒打算打$/);

        await view.rerender({
            ellipsis: {
                expandText: 'expandText',
                collapseText: 'collapseText',
                rows: 1,
                showTooltip: { type: 'popover' },
                suffix: 'suffix',
            },
        });
        expect(paragraph()).toHaveClass(`${prefix}-ellipsis`, `${prefix}-ellipsis-single-line`);
        expect(paragraph()).not.toHaveClass(`${prefix}-ellipsis-overflow-ellipsis`);
    });

    it('typography JS 省略号截断', async () => {
        mockTextHeight(2);
        const view = render(Paragraph, {
            props: {
                ellipsis: { suffix: 'SF', expandable: true, expandText: 'EX', collapsible: true, collapseText: 'CO' },
            },
            attrs: { style: lineHeight },
            slots: textSlot(LETTERS),
        });
        const paragraph = root(view.container);
        await waitFor(() => expect(paragraph).toHaveTextContent(/^abcdefghijkl\.\.\.SFEX$/));
        await userEvent.click(screen.getByRole('button', { name: 'EX' }));
        expect(paragraph).toHaveTextContent(new RegExp(`^${LETTERS}SFCO$`));
        await userEvent.click(screen.getByRole('button', { name: 'CO' }));
        expect(paragraph).toHaveTextContent(/^abcdefghijkl\.\.\.SFEX$/);
        view.unmount();

        const middle = render(Paragraph, {
            props: { ellipsis: { pos: 'middle' } },
            attrs: { style: lineHeight },
            slots: textSlot(LETTERS),
        });
        await waitFor(() => expect(root(middle.container)).toHaveTextContent(/^abcdefgh\.\.\.stuvwxyz$/));
        middle.unmount();

        const rows = render(Text, {
            props: { ellipsis: { rows: 2, suffix: 'SF' }, strong: true },
            attrs: { style: lineHeight },
            slots: textSlot(LETTERS + LETTERS),
        });
        expect(root(rows.container)).toHaveClass(`${prefix}-ellipsis-multiple-line`);
        await waitFor(() => expect(root(rows.container)).toHaveTextContent(/^abcdefghijklmnopqrstuvwx\.\.\.SF$/));
    });

    it('isSingleRowOverflowing 亚像素与 border 语义（回归 #2350/#3340）', async () => {
        // jsdom has no layout: container rect, text Range rect and padding/border are mocked; the verdict is observed
        // through the ellipsisTooltip slot (rendered only on overflow)
        const originalGetComputedStyle = window.getComputedStyle;
        const setup = (containerWidth: number, textWidth: number, padding: string, border: string) => {
            vi.restoreAllMocks();
            mockRangeWidth(() => textWidth);
            const containerRect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: containerWidth } as DOMRect);
            vi.spyOn(window, 'getComputedStyle').mockImplementation((elt, ...rest) =>
                elt.classList.contains(prefix)
                    ? ({
                          paddingLeft: padding,
                          paddingRight: padding,
                          borderLeftWidth: border,
                          borderRightWidth: border,
                      } as CSSStyleDeclaration)
                    : originalGetComputedStyle.call(window, elt, ...rest)
            );
            return containerRect;
        };
        const getRowOverflow = async (containerRect: ReturnType<typeof setup>) => {
            const view = render(Text, {
                props: { ellipsis: { showTooltip: true } },
                slots: {
                    default: () => 'test',
                    ellipsisTooltip: ({ trigger }: TypographyEllipsisTooltipProps) => <b data-testid="tip">{trigger}</b>,
                },
            });
            await waitFor(() => expect(containerRect).toHaveBeenCalled());
            await nextTick();
            const result = screen.queryByTestId('tip') !== null;
            view.unmount();
            return result;
        };

        expect(await getRowOverflow(setup(32.3046875, 32.3046875, '0px', '0px'))).toBe(false);
        expect(await getRowOverflow(setup(100, 98, '0px', '2px'))).toBe(true);
        expect(await getRowOverflow(setup(100, 90, '10px', '0px'))).toBe(true);
        expect(await getRowOverflow(setup(100, 30, '0px', '2px'))).toBe(false);
    });

    it('typography Numeral 用法', async () => {
        const view = render(NumeralTemplate);
        // the template joins the interpolations into one text node, which formats as one
        // string; React formats its three children separately and drops the comma before -1.00
        expect(view.container.querySelector('.price')?.textContent?.replace(/\s/g, '')).toBe('1.56,-1.00,0.56');
        expect(view.container.querySelector('.total')).toHaveTextContent(/^Total revenue: \$ 1\.99e\+3$/);
        await view.rerender({ parser: (oldVal: string) => oldVal.replace(/[^\d.]/g, '') });
        expect(view.container.querySelector('.total')).toHaveTextContent(/^1992\.15$/);
    });

    it('Numeral 中的组件节点原样渲染，不格式化其内部文本', () => {
        const view = render(Numeral, {
            props: { precision: 1 },
            slots: { default: () => [<Box>{() => '1.234'}</Box>, '2.345'] },
        });
        expect(root(view.container)).toHaveTextContent(/^1\.2342\.3$/);
    });

    it('children 为模板字符串', () => {
        const view = render(TemplateText);
        expect(root(view.container)).toHaveTextContent(/^Key: code$/);
    });

    it('省略测量前后文本一致，不带模板在首尾保留的空格', async () => {
        const view = render(Text, { props: { ellipsis: { showTooltip: true } }, slots: textSlot(' init.txt ') });
        const before = root(view.container).textContent;
        await sleep(50);
        expect(before).toBe('init.txt');
        expect(root(view.container).textContent).toBe('init.txt');
    });

    it('自定义复制渲染', async () => {
        const view = render(Text, {
            props: {
                copyable: { content: 'code' },
                ellipsis: { showTooltip: { opts: { style: { wordBreak: 'break-word' } } } },
            },
            slots: {
                default: () => 'Key: code',
                copyAction: ({ copied, copy, config }: TypographyCopyActionProps) => (
                    <button class="test-copy-button" onClick={copy}>
                        <span class="test-copied">{String(copied)}</span>
                        <span class="test-copy-content">{config.content}</span>
                    </button>
                ),
            },
        });
        expect(view.container.querySelector('.test-copied')).toHaveTextContent(/^false$/);
        expect(view.container.querySelector('.test-copy-content')).toHaveTextContent(/^code$/);
        const triggers = view.container.querySelectorAll('.test-copy-button');
        expect(triggers).toHaveLength(1);
        await userEvent.click(triggers[0]);
        await waitFor(() => expect(view.container.querySelector('.test-copied')).toHaveTextContent(/^true$/));
    });
});

describe('Typography 行为基线', () => {
    it('非 link 时的 type、size、spacing 与装饰标签', () => {
        const view = render(Text, {
            props: {
                type: 'danger',
                code: true,
                delete: true,
                mark: true,
                size: 'small',
                strong: true,
                underline: true,
            },
            slots: textSlot('T'),
        });
        expect(root(view.container).tagName).toBe('SPAN');
        expect(root(view.container)).toHaveClass(`${prefix}-danger`, `${prefix}-small`, `${prefix}-normal`);
        expect(root(view.container).querySelector(':scope > del > strong > u > code > mark')).toHaveTextContent(/^T$/);

        const paragraph = render(Paragraph, { props: { spacing: 'extended' }, slots: textSlot('P') });
        expect(root(paragraph.container).tagName).toBe('P');
        expect(root(paragraph.container)).toHaveClass(`${prefix}-paragraph`, `${prefix}-primary`, `${prefix}-normal`, `${prefix}-extended`);
        expect(root(paragraph.container).children).toHaveLength(0);
    });

    it('link 包裹所有装饰，下划线改为类名，并去掉 type 类名', async () => {
        const view = render(Text, {
            props: {
                type: 'danger',
                code: true,
                delete: true,
                link: { href: '#target', target: '_blank' },
                mark: true,
                strong: true,
                underline: true,
            },
            slots: textSlot('L'),
        });
        const element = root(view.container);
        expect(element).toHaveClass(`${prefix}-link`);
        expect(element).not.toHaveClass(`${prefix}-danger`);
        const anchor = element.querySelector(':scope > a') as HTMLElement;
        expect(anchor).toHaveAttribute('href', '#target');
        expect(anchor).toHaveAttribute('target', '_blank');
        const inner = anchor.querySelector(`:scope > del > strong > code > mark > span.${prefix}-link-text.${prefix}-link-underline`);
        expect(inner).toHaveTextContent(/^L$/);
        expect(element.querySelector('u')).toBeNull();

        await view.rerender({
            type: 'primary',
            code: false,
            delete: false,
            mark: false,
            strong: false,
            underline: false,
            disabled: true,
            link: { href: '#target' },
        });
        expect(element.querySelector('a')).toBeNull();
        expect(element.querySelector(`:scope > span > span.${prefix}-link-text`)).toHaveTextContent(/^L$/);
    });

    it('Base 的 headingTag 只接受 h1 到 h6，Title 的 heading 只接受 1 到 6', () => {
        expectTypeOf<TypographyBaseProps['headingTag']>().toEqualTypeOf<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | undefined>();
        expectTypeOf<TypographyTitleProps['heading']>().toEqualTypeOf<1 | 2 | 3 | 4 | 5 | 6 | undefined>();
    });

    it('Title 映射 heading 与 weight', async () => {
        const view = render(Title, { props: { heading: 3 }, slots: textSlot('H') });
        expect(root(view.container).tagName).toBe('H3');
        expect(root(view.container)).toHaveClass(`${prefix}-h3`, `${prefix}-primary`);

        await view.rerender({ heading: 7 as unknown as TypographyTitleProps['heading'] });
        expect(root(view.container).tagName).toBe('H1');
        expect(root(view.container)).toHaveClass(`${prefix}-h1`);

        await view.rerender({ heading: 2, weight: 'semibold' });
        expect(root(view.container)).toHaveClass(`${prefix}-h2-weight-semibold`);
        expect(root(view.container).style.fontWeight).toBe('');

        await view.rerender({ style: { color: 'red' }, heading: 2, weight: 600 });
        expect(root(view.container).className).not.toMatch(/weight/);
        expect(root(view.container).style.fontWeight).toBe('600');
        expect(root(view.container).style.color).toBe('red');

        await view.rerender({ style: { fontWeight: 300 }, heading: 2, weight: 600 });
        expect(root(view.container).style.fontWeight).toBe('300');
    });

    it('icon 插槽，size inherit 读取外层 size', () => {
        const view = render(Paragraph, {
            props: { size: 'small' },
            slots: {
                default: () => (
                    <>
                        <Text size="inherit">
                            {{
                                default: () => 'inherit',
                                icon: () => <IconSetting />,
                            }}
                        </Text>
                        <Text>{{ default: () => 'plain', icon: () => '*' }}</Text>
                    </>
                ),
            },
        });
        const [inherit, plain] = view.container.querySelectorAll(`.${prefix}-paragraph > .${prefix}`);
        expect(inherit).toHaveClass(`${prefix}-small`);
        expect(inherit).not.toHaveClass(`${prefix}-inherit`);
        const icon = inherit.querySelector(`:scope > span.${prefix}-icon[x-semi-prop="icon"]`) as Element;
        expect(icon.querySelector('.semi-icon')).toHaveClass('semi-icon-small');
        expect(plain).toHaveClass(`${prefix}-normal`);
        expect(plain.querySelector(`.${prefix}-icon`)).toHaveTextContent(/^\*$/);
    });

    it('将 data-* 及其他 DOM 属性透传到根元素', () => {
        const onClick = vi.fn<() => void>();
        const views = [
            render(Text, { attrs: { id: 't', 'data-x': 'text', onClick }, slots: textSlot('a') }),
            render(Title, { attrs: { 'data-x': 'title' }, slots: textSlot('b') }),
            render(Paragraph, { attrs: { 'data-x': 'paragraph' }, slots: textSlot('c') }),
            render(Numeral, { attrs: { 'data-x': 'numeral' }, slots: textSlot('1') }),
            render(Typography, { attrs: { 'data-x': 'typography' }, slots: textSlot('d') }),
        ];
        const nodes = views.map((view) => view.container.querySelector<HTMLElement>('[data-x]') as HTMLElement);
        expect(nodes.map((node) => [node.tagName, node.dataset.x])).toEqual([
            ['SPAN', 'text'],
            ['H1', 'title'],
            ['P', 'paragraph'],
            ['SPAN', 'numeral'],
            ['ARTICLE', 'typography'],
        ]);
        nodes.forEach((node) => expect(node).toHaveClass(prefix));
        expect(nodes[0]).toHaveAttribute('id', 't');
        const other = render(Text, {
            props: {
                code: true,
                copyable: false,
                delete: true,
                ellipsis: false,
                mark: true,
                strong: true,
                underline: true,
            },
            slots: textSlot('x'),
        });
        expect(root(other.container).getAttributeNames()).toEqual(['class']);
        const passthrough = render(Text, { attrs: { editable: 'yes' }, slots: textSlot('x') });
        expect(root(passthrough.container)).toHaveAttribute('editable', 'yes');
    });

    it('裸 Typography 读取 semiGlobal overrideDefaultProps，Text 保留自己的标签', () => {
        semiGlobal.config.overrideDefaultProps = { Typography: { component: 'section' } };
        const bare = render(Typography, { slots: textSlot('bare') });
        const text = render(Text, { slots: textSlot('text') });
        expect(root(bare.container).tagName).toBe('SECTION');
        expect(root(text.container).tagName).toBe('SPAN');
        semiGlobal.config.overrideDefaultProps = {};
        const view = render(Typography, { attrs: { class: 'x' }, slots: textSlot('bare') });
        expect(root(view.container).tagName).toBe('ARTICLE');
        expect(root(view.container)).toHaveClass(prefix, 'x');
    });

    it('CSS 省略号类名与 line clamp', async () => {
        const view = render(Text, { props: { ellipsis: true }, slots: textSlot('t') });
        expect(root(view.container)).toHaveClass(`${prefix}-ellipsis`, `${prefix}-ellipsis-single-line`, `${prefix}-ellipsis-overflow-ellipsis`, `${prefix}-ellipsis-overflow-ellipsis-text`);
        await view.rerender({ ellipsis: { rows: 2 } });
        expect(root(view.container)).toHaveClass(`${prefix}-ellipsis-multiple-line`, `${prefix}-ellipsis-multiple-line-text`);
        expect(root(view.container)).not.toHaveClass(`${prefix}-ellipsis-overflow-ellipsis`);
        expect(root(view.container).style.webkitLineClamp).toBe('2');
        view.unmount();

        const paragraph = render(Paragraph, { props: { ellipsis: { rows: 3 } }, slots: textSlot('t') });
        const element = root(paragraph.container);
        expect(element).toHaveClass(`${prefix}-ellipsis-multiple-line`);
        expect(element).not.toHaveClass(`${prefix}-ellipsis-multiple-line-text`);
        expect(element.style.webkitLineClamp).toBe('3');
        await paragraph.rerender({ ellipsis: { rows: 3, pos: 'middle' } });
        expect(element).toHaveClass(`${prefix}-ellipsis-multiple-line`);
        expect(element.style.webkitLineClamp).toBe('');
        await paragraph.rerender({ ellipsis: false });
        expect(element.className).not.toMatch(/ellipsis/);
    });

    it('CSS 省略号在行溢出时显示包含完整文本的 Tooltip', async () => {
        mockSingleRowOverflow(200);
        const view = render(Text, {
            props: { ellipsis: { showTooltip: true } },
            attrs: { style: { width: '100px' } },
            slots: textSlot('overflowing text'),
        });
        await waitFor(() => expect(root(view.container)).toHaveAttribute('tabindex', '0'));
        await userEvent.hover(root(view.container));
        await waitFor(() => expect(document.querySelector('.semi-tooltip-content')).toHaveTextContent('overflowing text'));
        expect(document.querySelector('.semi-popover-content')).toBeNull();
    });

    it('showTooltip 的 popover 合并自身 opts 并保留箭头', async () => {
        mockSingleRowOverflow(200);
        const view = render(Text, {
            props: {
                ellipsis: { showTooltip: { type: 'popover', opts: { class: 'user-pop', style: { color: 'red' } } } },
            },
            attrs: { style: { width: '100px' } },
            slots: textSlot('popover text'),
        });
        await waitFor(() => expect(root(view.container)).toHaveAttribute('tabindex', '0'));
        await userEvent.hover(root(view.container));
        await waitFor(() => expect(document.querySelector('.semi-popover-content')).not.toBeNull());
        const popover = document.querySelector<HTMLElement>(`.${prefix}-ellipsis-popover`) as HTMLElement;
        expect(popover).toHaveClass('user-pop');
        expect(popover).toHaveTextContent('popover text');
        expect(popover.style.color).toBe('red');
        expect(document.querySelector('.semi-popover-icon-arrow')).not.toBeNull();
    });

    it('文本未溢出时不显示 Tooltip，悬停时重新检查 CSS 溢出', async () => {
        const width = mockSingleRowOverflow(10);
        render(Text, {
            props: { ellipsis: { showTooltip: true } },
            attrs: { style: { width: '100px' } },
            slots: {
                default: () => 'fits',
                ellipsisTooltip: ({ content, trigger }: TypographyEllipsisTooltipProps) => (
                    <b data-testid="tip" data-content={content}>
                        {trigger}
                    </b>
                ),
            },
        });
        await sleep(50);
        expect(screen.queryByTestId('tip')).toBeNull();
        width.textWidth = 200;
        await fireEvent.mouseEnter(screen.getByText('fits'));
        expect(screen.getByTestId('tip')).toHaveAttribute('data-content', 'fits');
        expect(screen.getByTestId('tip').querySelector(`.${prefix}`)).toHaveTextContent(/^fits$/);
    });

    it('首帧渲染完整文本和展开按钮，之后再进行截断', async () => {
        mockTextHeight(2);
        const view = render(Paragraph, {
            props: { ellipsis: { expandable: true, expandText: 'EX' } },
            attrs: { style: lineHeight },
            slots: textSlot(LETTERS),
        });
        expect(root(view.container)).toHaveTextContent(new RegExp(`^${LETTERS}EX$`));
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));

        const fits = render(Paragraph, {
            props: { ellipsis: { expandable: true, expandText: 'EX' } },
            attrs: { style: lineHeight },
            slots: textSlot('short'),
        });
        expect(screen.getAllByRole('button', { name: 'EX' })).toHaveLength(2);
        await waitFor(() => expect(root(fits.container)).toHaveTextContent(/^short$/));
        expect(fits.container.querySelector(`.${prefix}-ellipsis-expand`)).toBeNull();
    });

    it('JS 省略只在插槽含组件节点时警告，多段文本、数字与元素不警告', async () => {
        mockTextHeight(2);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const view = render(Paragraph, {
            props: { ellipsis: { expandable: true } },
            attrs: { style: lineHeight },
            slots: { default: () => [LETTERS.slice(0, 10), LETTERS.slice(10), 1, <b>element</b>] },
        });
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/\.\.\./));
        expect(warn).not.toHaveBeenCalled();
        render(Paragraph, {
            props: { ellipsis: { expandable: true } },
            slots: { default: () => [<Box>{() => 'component'}</Box>] },
        });
        await waitFor(() => expect(warn).toHaveBeenCalledWith(expect.stringContaining('pure text')));
    });

    it('expandable 未设置 collapsible 时：expand 参数正确，展开后的文本不含收起文案，焦点移到文字', async () => {
        mockTextHeight(2);
        const view = render(Paragraph, {
            props: { ellipsis: { expandable: true, expandText: 'EX' } },
            attrs: { style: lineHeight },
            slots: textSlot(LETTERS),
        });
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        const button = screen.getByRole('button', { name: 'EX' });
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(root(view.container)).not.toHaveAttribute('tabindex');
        button.focus();
        await userEvent.keyboard('{Enter}');
        const [[expanded, event]] = view.emitted<[boolean, MouseEvent]>('expand');
        expect(expanded).toBe(true);
        expect(event).toBeInstanceOf(MouseEvent);
        expect(root(view.container)).toHaveTextContent(new RegExp(`^${LETTERS}$`));
        expect(view.container.querySelector(`.${prefix}-ellipsis-expand`)).toBeNull();
        await waitFor(() => expect(root(view.container)).toHaveFocus());
        expect(root(view.container)).toHaveAttribute('tabindex', '-1');
    });

    it('component 为有状态组件时仍能截断，展开后焦点落在该组件的根元素', async () => {
        mockTextHeight(2);
        const Box = defineComponent({
            render: function render() {
                return <div class="box">{this.$slots.default?.()}</div>;
            },
        });
        const view = render(Paragraph, {
            props: { component: Box, ellipsis: { expandable: true, expandText: 'EX' } },
            attrs: { style: lineHeight },
            slots: textSlot(LETTERS),
        });
        const box = () => view.container.querySelector<HTMLElement>('.box') as HTMLElement;
        await waitFor(() => expect(box()).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        await userEvent.click(screen.getByRole('button', { name: 'EX' }));
        await waitFor(() => expect(box()).toHaveFocus());
    });

    it('展开按钮与原生按钮一样响应 Space，aria-expanded 反映展开状态', async () => {
        mockTextHeight(2);
        const view = render(Paragraph, {
            props: { ellipsis: { expandable: true, collapsible: true } },
            attrs: { style: lineHeight },
            slots: textSlot(LETTERS),
        });
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/\.\.\.展开$/));
        screen.getByRole('button', { name: '展开' }).focus();
        await userEvent.keyboard(' ');
        expect(root(view.container)).toHaveTextContent(new RegExp(`^${LETTERS}收起$`));
        expect(screen.getByRole('button', { name: '收起' })).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('button', { name: '收起' })).toHaveFocus();
        expect(root(view.container)).not.toHaveAttribute('tabindex');
    });

    it('语言包中的展开与收起文案为默认值', async () => {
        mockTextHeight(2);
        const view = render(Paragraph, {
            props: { ellipsis: { expandable: true, collapsible: true } },
            attrs: { style: lineHeight },
            slots: textSlot(LETTERS),
        });
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/\.\.\.展开$/));
        await userEvent.click(screen.getByRole('button', { name: '展开' }));
        expect(root(view.container)).toHaveTextContent(new RegExp(`^${LETTERS}收起$`));
    });

    it('新插槽文本会重置展开状态并重新截断，重测前显示新的完整文本', async () => {
        mockTextHeight(2);
        const ellipsis = { expandable: true, expandText: 'EX', collapsible: true, collapseText: 'CO' };
        const view = render(ParagraphText, { props: { text: LETTERS }, attrs: { style: lineHeight, ellipsis } });
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        await userEvent.click(screen.getByRole('button', { name: 'EX' }));
        expect(root(view.container)).toHaveTextContent(/CO$/);

        await view.rerender({ text: LETTERS.toUpperCase() });
        expect(root(view.container)).toHaveTextContent(new RegExp(`^${LETTERS.toUpperCase()}EX$`));
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/^ABCDEFGHIJKLMN\.\.\.EX$/));
    });

    it('父组件重渲染且插槽文本不变时保持展开状态', async () => {
        mockTextHeight(2);
        const ellipsis = { expandable: true, expandText: 'EX', collapsible: true, collapseText: 'CO' };
        const view = render(ParagraphText, { props: { text: LETTERS }, attrs: { style: lineHeight, ellipsis } });
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        await userEvent.click(screen.getByRole('button', { name: 'EX' }));
        expect(root(view.container)).toHaveTextContent(/CO$/);

        await view.rerender({ tick: 1 });
        await sleep(50);
        expect(root(view.container)).toHaveTextContent(new RegExp(`^${LETTERS}CO$`));

        await view.rerender({ text: `${LETTERS}XYZ` });
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
    });

    it('内联的 ellipsis 对象在父组件重渲染时不重新测量', async () => {
        const height = mockTextHeight(2);
        const view = render(InlineEllipsis, { props: { text: LETTERS } });
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        await sleep(50);
        const calls = height.calls;
        await view.rerender({ tick: 1 });
        await sleep(50);
        expect(height.calls).toBe(calls);
    });

    it('挂载后容器尺寸变化会重新测量 JS 截断', async () => {
        const height = mockTextHeight(2);
        const { report } = captureResizeObserver();
        const view = render(Paragraph, {
            props: { ellipsis: { expandable: true, expandText: 'EX' } },
            attrs: { style: lineHeight },
            slots: textSlot(LETTERS),
        });
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        await sleep(20);
        height.factor = 4;
        report([{ target: root(view.container), contentRect: { width: 50, height: 20 } }]);
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/^abcd\.\.\.EX$/));
    });

    it('监听根元素及其父元素，Tooltip 开始包裹后同样生效', async () => {
        mockSingleRowOverflow(200);
        const { observers } = captureResizeObserver();
        // Testing Library moves the mounted nodes out of their mount element afterwards, so the parent comes from
        // a wrapper that stays put
        const Host = defineComponent({
            setup: () => () => (
                <section>
                    <Text ellipsis={{ showTooltip: true }} style={{ width: '100px' }}>
                        {() => 'overflowing text'}
                    </Text>
                </section>
            ),
        });
        const view = render(Host);
        const before = root(view.container);
        await waitFor(() => expect(root(view.container)).toHaveAttribute('tabindex', '0'));
        expect(root(view.container)).toBe(before);
        const targets = observers.flatMap((observer) => observer.targets);
        expect(targets).toContain(before);
        expect(targets).toContain(view.container.querySelector('section'));
    });

    it('showTooltip 的提示随溢出状态开关，根元素保持同一个节点', async () => {
        const width = mockSingleRowOverflow(10);
        const view = render(Text, {
            props: { ellipsis: { showTooltip: true } },
            attrs: { style: { width: '100px' } },
            slots: textSlot('overflowing text'),
        });
        const before = root(view.container);
        await sleep(50);
        expect(before).not.toHaveAttribute('tabindex');
        width.textWidth = 200;
        await fireEvent.mouseEnter(screen.getByText('overflowing text'));
        await waitFor(() => expect(before).toHaveAttribute('tabindex', '0'));
        expect(root(view.container)).toBe(before);
        await userEvent.hover(before);
        await waitFor(() => expect(document.querySelector('.semi-tooltip-content')).toHaveTextContent('overflowing text'));
    });

    it.each([['tooltip'], ['popover']] as const)('省略且 showTooltip（%s）的文字位于 activedescendant 条目内时不注入 tabindex，提示仍可悬停显示', async (type) => {
        mockSingleRowOverflow(200);
        const option = document.createElement('div');
        option.setAttribute('role', 'option');
        document.body.append(option);
        onTestFinished(() => option.remove());
        render(Text, {
            props: { ellipsis: { showTooltip: { type } } },
            attrs: { style: { width: '100px' } },
            slots: textSlot('option text'),
            container: option,
        });
        await sleep(50);
        await userEvent.hover(root(option));
        await waitFor(() => expect(document.querySelector(`.semi-${type}-content`)).toHaveTextContent('option text'));
        expect(root(option)).not.toHaveAttribute('tabindex');
    });

    it.each([
        ['button', {}],
        ['div', { role: 'button' }],
        ['a', { href: '#' }],
        ['div', { role: 'menuitemradio' }],
    ] as const)('省略且 showTooltip 的文字位于 %s 内时不成为独立的 Tab 停靠点，提示仍可悬停显示', async (tag, attrs) => {
        mockSingleRowOverflow(200);
        const host = document.createElement(tag);
        Object.entries(attrs).forEach(([name, value]) => host.setAttribute(name, value));
        document.body.append(host);
        onTestFinished(() => host.remove());
        render(Text, {
            props: { ellipsis: { showTooltip: true } },
            attrs: { style: { width: '100px' } },
            slots: textSlot('host text'),
            container: host,
        });
        await sleep(50);
        await userEvent.hover(root(host));
        await waitFor(() => expect(document.querySelector('.semi-tooltip-content')).toHaveTextContent('host text'));
        expect(root(host)).not.toHaveAttribute('tabindex');
    });

    it('省略且 showTooltip 的文字不在组合控件条目内时注入 tabindex', async () => {
        mockSingleRowOverflow(200);
        const view = render(Text, {
            props: { ellipsis: { showTooltip: true } },
            attrs: { style: { width: '100px' } },
            slots: textSlot('plain text'),
        });
        await waitFor(() => expect(root(view.container)).toHaveAttribute('tabindex', '0'));
    });

    it('省略且 showTooltip 的文字位于带对勾的 Dropdown.Item 内时不成为独立的 Tab 停靠点', async () => {
        mockSingleRowOverflow(200);
        render(DropdownItem, {
            props: { active: true, showTick: true },
            slots: {
                default: () => (
                    <Text ellipsis={{ showTooltip: true }} style={{ width: '100px' }}>
                        {() => 'checked text'}
                    </Text>
                ),
            },
        });
        const item = screen.getByRole('menuitemcheckbox');
        await sleep(50);
        await userEvent.hover(root(item));
        await waitFor(() => expect(document.querySelector('.semi-tooltip-content')).toHaveTextContent('checked text'));
        expect(root(item)).not.toHaveAttribute('tabindex');
    });

    it('JS 省略号配合 showTooltip 时，仅在截断时显示提示', async () => {
        mockTextHeight(2);
        const tip = ({ trigger }: TypographyEllipsisTooltipProps) => <b data-testid="tip">{trigger}</b>;
        const view = render(Paragraph, {
            props: { ellipsis: { suffix: '!', showTooltip: true } },
            attrs: { style: lineHeight },
            slots: { default: () => LETTERS, ellipsisTooltip: tip },
        });
        await waitFor(() => expect(screen.getByTestId('tip')).toHaveTextContent(/^abcdefghijklmno\.\.\.!$/));
        view.unmount();

        render(Paragraph, {
            props: { ellipsis: { suffix: '!', showTooltip: true } },
            attrs: { style: lineHeight },
            slots: { default: () => 'short', ellipsisTooltip: tip },
        });
        expect(screen.getByTestId('tip')).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByTestId('tip')).toBeNull());
        expect(screen.getByText('short!').closest(`.${prefix}`)).toHaveTextContent(/^short!$/);
    });

    it('省略号在无插槽内容时不渲染也不测量', async () => {
        render(Text, { props: { ellipsis: { rows: 3, pos: 'middle', expandable: true } } });
        render(Text, { props: { ellipsis: true } });
        await sleep(50);
        expect(document.querySelectorAll(`.${prefix}-ellipsis`)).toHaveLength(2);
        expect(document.querySelector(`.${prefix}-ellipsis-expand`)).toBeNull();
    });

    it('copyable 复制配置的内容，并显示自定义成功提示与复制提示', async () => {
        const view = render(Text, {
            props: { copyable: { content: 'configured' } },
            slots: { default: () => 'children', copySuccessTip: () => 'done', copyTip: () => 'press' },
        });
        expect((view.container.querySelector(`.${prefix}-action-copy`) as HTMLElement).style.marginLeft).toBe('');
        await userEvent.hover(view.container.querySelector('.semi-icon-copy') as Element);
        await waitFor(() => expect(document.querySelector('.semi-tooltip-content')).toHaveTextContent('press'));
        await userEvent.click(view.container.querySelector('.semi-icon-copy') as Element);
        expect(writeText).toHaveBeenCalledWith('configured');
        await waitFor(() => expect(view.container.querySelector(`.${prefix}-action-copied`)).toHaveTextContent(/^done$/));
    });

    it('copyable 自定义图标位于复制按钮内', async () => {
        const view = render(Text, {
            props: { copyable: true },
            slots: { default: () => 'gear', copyIcon: () => <IconSetting /> },
        });
        const button = screen.getByRole('button', { name: zh_CN.Typography.copy });
        expect(button).toContainElement(view.container.querySelector('.semi-icon-setting'));
        await userEvent.click(button);
        await waitFor(() => expect(writeText).toHaveBeenCalledWith('gear'));
        await waitFor(() => expect(view.container.querySelector(`.${prefix}-action-copied`)).toHaveTextContent('复制成功'));
    });

    it('copyable 的非元素图标原样显示，按钮以语言包文案命名', () => {
        render(Text, { props: { copyable: true }, slots: { default: () => 'text', copyIcon: () => '复制' } });
        const button = screen.getByRole('button', { name: zh_CN.Typography.copy });
        expect(button).toHaveAttribute('aria-label', zh_CN.Typography.copy);
        expect(button).toHaveTextContent(/^复制$/);
        expect(button.querySelector('.semi-icon-copy')).toBeNull();
    });

    it('copyable 卸载时清除已复制计时器', async () => {
        vi.useFakeTimers();
        const view = render(Paragraph, {
            props: { copyable: true },
            slots: {
                default: () => 'Semi',
                copyAction: ({ copied, copy }: TypographyCopyActionProps) => <button onClick={copy}>{copied ? 'copied' : 'copy'}</button>,
            },
        });
        await fireEvent.click(screen.getByRole('button'));
        await vi.advanceTimersByTimeAsync(0);
        expect(screen.getByRole('button')).toHaveTextContent('copied');
        expect(vi.getTimerCount()).toBe(1);
        view.unmount();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('自定义复制渲染与 JS 截断同时使用', async () => {
        mockTextHeight(2);
        const view = render(Paragraph, {
            props: {
                copyable: true,
                ellipsis: { expandable: true, expandText: 'EX', collapsible: true, collapseText: 'CO' },
            },
            attrs: { style: lineHeight },
            slots: {
                default: () => LETTERS,
                copyAction: ({ copied, copy }: TypographyCopyActionProps) => (
                    <button class="copy" onClick={copy}>
                        {String(copied)}
                    </button>
                ),
            },
        });
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/^abcdefghi\.\.\.EXfalse$/));
        await userEvent.click(screen.getByRole('button', { name: 'EX' }));
        expect(root(view.container)).toHaveTextContent(new RegExp(`^${LETTERS}COfalse$`));
        await userEvent.click(view.container.querySelector('.copy') as Element);
        await waitFor(() => expect(view.container.querySelector('.copy')).toHaveTextContent('true'));
        expect(view.emitted('copy')).toHaveLength(1);
    });

    const expectNumeral = (cases: [TypographyNumeralProps, string, string][]) =>
        cases.forEach(([props, input, output]) => {
            const view = render(Numeral, { props, slots: textSlot(input) });
            expect(root(view.container).tagName).toBe('SPAN');
            expect(root(view.container)).toHaveTextContent(new RegExp(`^${escapeRegExp(output)}$`));
            view.unmount();
        });

    it('Numeral 截断不受二进制浮点误差影响', () => {
        // 0.58 * 100 is 57.99999999999999, 0.07 * 100 is 7.000000000000001 and 1.005 * 100 is 100.49999999999999
        expectNumeral([
            [{ rule: 'text', precision: 2, truncate: 'floor' }, '0.58', '0.58'],
            [{ rule: 'text', precision: 2, truncate: 'ceil' }, '0.07', '0.07'],
            [{ rule: 'text', precision: 2, truncate: 'round' }, '1.005', '1.01'],
            [{ rule: 'percentages', truncate: 'floor' }, '0.58', '58%'],
            [{ rule: 'percentages', truncate: 'ceil' }, '0.07', '7%'],
            [{ rule: 'text', precision: 2 }, '1e-7', '0.00'],
            [{ rule: 'text', precision: 1, truncate: 'ceil' }, '1.1e3', '1100.0'],
        ]);
    });

    it('Numeral 规则', () => {
        expectNumeral([
            [{ rule: 'text', precision: 2 }, 'a 1.234 b -2', 'a 1.23 b -2.00'],
            [{ rule: 'numbers', precision: 1, truncate: 'floor' }, 'x 1.99 y 2', '1.9,2.0'],
            [{ rule: 'bytes-decimal', precision: 1 }, '1500', '1.5 KB'],
            [{ rule: 'bytes-binary' }, '2048 and 1048576', '2 KiB and 1 MiB'],
            [{ rule: 'percentages', precision: 1 }, '0.256', '25.6%'],
            [{ rule: 'exponential', precision: 1, truncate: 'ceil' }, '12345', '1.3e+4'],
            [{ parser: (value) => `<${value}>` }, 'raw 1.5', '<raw 1.5>'],
        ]);
    });

    it('Numeral exponential 只舍入一次，进位后尾数规范化', () => {
        expectNumeral([
            [{ rule: 'exponential', precision: 1, truncate: 'floor' }, '1.99999', '1.9e+0'],
            [{ rule: 'exponential', precision: 0, truncate: 'floor' }, '19999', '1e+4'],
            [{ rule: 'exponential', precision: 1, truncate: 'ceil' }, '9.99', '1.0e+1'],
            [{ rule: 'exponential', precision: 0, truncate: 'round' }, '1.4996', '1e+0'],
            [{ rule: 'exponential', precision: 1, truncate: 'floor' }, '-9.99', '-1.0e+1'],
            [{ rule: 'exponential', precision: 1, truncate: 'round' }, '0.00123', '1.2e-3'],
        ]);
    });

    it('Numeral 保留不贴着数字的 - 和 . 字符', () => {
        expectNumeral([
            [{ rule: 'text', precision: 0 }, 'Total: 3 items.', 'Total: 3 items.'],
            [{ rule: 'text', precision: 0 }, 'a - b', 'a - b'],
            [{ rule: 'percentages' }, '0.5.', '50%.'],
            [{ rule: 'numbers', precision: 0 }, '1. 2 - 3', '1,2,3'],
        ]);
    });

    it('disabled 的 link 不触发 onClick，也不把 href 写到 span', async () => {
        const onClick = vi.fn<() => void>();
        const view = render(Text, {
            props: { disabled: true, link: { href: '#target', target: '_blank', onClick, class: 'extra' } },
            slots: textSlot('L'),
        });
        const span = root(view.container).querySelector(':scope > span.extra');
        expect(span).toBeInTheDocument();
        expect(span).not.toHaveAttribute('href');
        expect(span).not.toHaveAttribute('target');
        await userEvent.click(screen.getByText('L'));
        expect(onClick).not.toHaveBeenCalled();
    });

    it('条件渲染为假的 v-if 不会被复制成字面文本，也不进入 JS 截断的文本', async () => {
        mockTextHeight(2);
        const view = render(Conditional);
        await userEvent.click(view.container.querySelector('.semi-icon-copy') as Element);
        expect(writeText).toHaveBeenLastCalledWith('Bob');
        const paragraph = view.container.querySelector<HTMLElement>(`.${prefix}-paragraph`) as HTMLElement;
        await waitFor(() => expect(paragraph).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
    });

    it('没有插槽内容时复制空字符串', async () => {
        const view = render(Text, { props: { copyable: true } });
        await userEvent.click(view.container.querySelector('.semi-icon-copy') as Element);
        expect(writeText).toHaveBeenLastCalledWith('');
    });

    it('先能放下的文本在容器变窄后截断时，按展开按钮的宽度预留', async () => {
        const height = mockTextHeight(1);
        const { report } = captureResizeObserver();
        const view = render(Paragraph, {
            props: { ellipsis: { expandable: true, expandText: 'EX' } },
            attrs: { style: lineHeight },
            slots: textSlot(LETTERS),
        });
        await waitFor(() => expect(root(view.container)).toHaveTextContent(new RegExp(`^${LETTERS}$`)));
        expect(view.container.querySelector(`.${prefix}-ellipsis-expand`)).toBeNull();
        await sleep(20);
        height.factor = 2;
        report([{ target: root(view.container), contentRect: { width: 50, height: 20 } }]);
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
    });
});

describe('Typography 类型', () => {
    it('TypographyCopyableConfig 含可选的 duration、class 与 style', () => {
        expectTypeOf<TypographyCopyableConfig['duration']>().toEqualTypeOf<number | undefined>();
        expectTypeOf<TypographyCopyableConfig['class']>().toEqualTypeOf<unknown>();
        expectTypeOf<TypographyCopyableConfig['style']>().toEqualTypeOf<StyleValue | undefined>();
        expectTypeOf<{ duration: number }>().toExtend<TypographyCopyableConfig>();
    });
});

describe('Typography 函数组件', () => {
    it('模板 ref 的 $el 是各组件的根元素', () => {
        const view = render(Roots);
        expect(view.emitted<[unknown[]]>('roots')[0][0]).toEqual([...view.container.querySelectorAll(`.${prefix}`)]);
    });

    it('Numeral 保留精度，且 truncate 不写入 DOM', () => {
        const view = render(Numeral, { props: { precision: 2, truncate: 'ceil' }, slots: textSlot('1.111') });
        expect(root(view.container)).toHaveTextContent(/^1\.12$/);
        expect(root(view.container)).not.toHaveAttribute('precision');
        expect(root(view.container)).not.toHaveAttribute('truncate');
    });

    it('Numeral 格式化 v-for 与嵌套元素并跳过 v-if，混合文字与元素时没有 Vue 警告', () => {
        const warn = vi.spyOn(console, 'warn');
        const view = render(NumeralNested);
        const [nested, mixed] = view.container.querySelectorAll(`.${prefix}`);
        expect(nested).toHaveTextContent(/^1\.02\.0x3\.0$/);
        expect(mixed).toHaveTextContent(/^Stars 1\.0Fork 2\.0$/);
        expect(warn).not.toHaveBeenCalled();
    });

    it('h() 构造的元素子节点中的字符串与数字同样格式化', () => {
        const view = render(Numeral, {
            props: { precision: 1 },
            slots: {
                default: () => (
                    <p>
                        {'a '}
                        {1}
                        {null}
                        {[<b>2</b>]}
                    </p>
                ),
            },
        });
        expect(root(view.container)).toHaveTextContent(/^a 1\.02\.0$/);
    });

    it('省略号配置变化后重新测量截断', async () => {
        mockTextHeight(2);
        const view = render(Paragraph, {
            props: { ellipsis: { expandable: true, expandText: 'EX' } },
            attrs: { style: lineHeight },
            slots: textSlot(LETTERS),
        });
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        await view.rerender({ ellipsis: { expandable: true, expandText: 'EX', suffix: 'SUFFIX' } });
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/^abcdefgh\.\.\.SUFFIXEX$/));
    });
});

describe('Typography Tab 焦点停靠', () => {
    it('copyable 复制按钮是唯一的 Tab 停靠点，其 Tooltip 描述了该按钮', async () => {
        render(Text, {
            props: { copyable: true },
            slots: { default: () => 'Semi Design', copyTip: () => 'Copy the text' },
        });
        await userEvent.tab();
        const button = document.activeElement as HTMLElement;
        expect(button.tagName).toBe('BUTTON');
        await waitFor(() => expect(button).toHaveAccessibleDescription('Copy the text'));
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });
});

describe('Typography Vue', () => {
    it('全局默认值：app 实例注入的配置同样生效，显式 component 优先', () => {
        const instance = new SemiGlobal();
        instance.config.overrideDefaultProps = { Typography: { component: 'aside' } };
        const injected = render(Typography, {
            slots: textSlot('a'),
            global: { provide: { [semiGlobalKey as symbol]: instance } },
        });
        expect(root(injected.container).tagName).toBe('ASIDE');
        semiGlobal.config.overrideDefaultProps = { Typography: { component: 'section' } };
        const explicit = render(Typography, { props: { component: 'div' }, slots: textSlot('b') });
        expect(root(explicit.container).tagName).toBe('DIV');
    });

    it('带 showTooltip 时属性与监听落在文字根元素，不落在弹层', async () => {
        mockSingleRowOverflow(200);
        const onClick = vi.fn<(e: MouseEvent) => void>();
        const view = render(Text, {
            props: { ellipsis: { rows: 2, showTooltip: true }, weight: 600 },
            attrs: {
                id: 'own',
                'data-x': 'x',
                class: 'user',
                style: { fontWeight: 300, WebkitLineClamp: 5 },
                onClick,
            },
            slots: textSlot('text'),
        });
        const element = root(view.container);
        expect(element).toHaveAttribute('id', 'own');
        expect(element).toHaveAttribute('data-x', 'x');
        expect(element).toHaveClass('user');
        expect(element.style.fontWeight).toBe('300');
        expect(element.style.webkitLineClamp).toBe('2');
        await userEvent.click(element);
        expect(onClick).toHaveBeenCalledTimes(1);
        await userEvent.hover(element);
        expect(document.querySelector('.semi-tooltip-wrapper #own, .semi-tooltip-wrapper .user')).toBeNull();

        const paragraph = render(Paragraph, { attrs: { class: 'mine' }, slots: textSlot('p') });
        expect(root(paragraph.container)).toHaveClass(`${prefix}-paragraph`, 'mine');
    });

    it('icon 插槽中只有 Semi 图标得到 size', () => {
        const view = render(Text, {
            props: { size: 'small' },
            slots: {
                default: () => 'a',
                icon: () => (
                    <>
                        <IconSetting />
                        <i class="plain">x</i>
                    </>
                ),
            },
        });
        expect(view.container.querySelector('.semi-icon')).toHaveClass('semi-icon-small');
        expect(view.container.querySelector('.plain')).not.toHaveAttribute('size');
    });

    it.each([['tooltip'], ['popover']] as const)('ellipsisContent 插槽替换 %s 的内容', async (type) => {
        mockSingleRowOverflow(200);
        const view = render(Text, {
            props: { ellipsis: { showTooltip: { type } } },
            attrs: { style: { width: '100px' } },
            slots: { default: () => 'text', ellipsisContent: () => <i>custom content</i> },
        });
        await waitFor(() => expect(root(view.container)).toHaveAttribute('tabindex', '0'));
        await userEvent.hover(root(view.container));
        await waitFor(() => expect(document.querySelector(`.semi-${type}-content`)).toHaveTextContent('custom content'));
    });

    it('ellipsisTooltip 的 content 是去掉首尾空白的全文，copyAction 的 config 为解析后的配置', async () => {
        mockSingleRowOverflow(200);
        const contents: string[] = [];
        const configs: TypographyCopyableConfig[] = [];
        render(Text, {
            props: { copyable: { duration: 5 }, ellipsis: { showTooltip: true } },
            attrs: { style: { width: '100px' } },
            slots: {
                default: () => '  full text  ',
                ellipsisTooltip: ({ content, trigger }: TypographyEllipsisTooltipProps) => {
                    contents.push(content);
                    return <b data-testid="tip">{trigger}</b>;
                },
                copyAction: ({ config }: TypographyCopyActionProps) => {
                    configs.push(config);
                    return <button>copy</button>;
                },
            },
        });
        await waitFor(() => expect(screen.getByTestId('tip')).toBeInTheDocument());
        expect(contents.at(-1)).toBe('full text');
        expect(configs.at(-1)).toMatchObject({ content: 'full text', duration: 5 });
    });

    it('copy 与 expand 的载荷；@copy 不再监听根元素的原生 copy 事件', async () => {
        mockTextHeight(2);
        const onCopy = vi.fn<(...args: unknown[]) => void>();
        const view = render(Paragraph, {
            props: { copyable: true, ellipsis: { expandable: true, collapsible: true } },
            attrs: { style: lineHeight, onCopy },
            slots: textSlot(LETTERS),
        });
        root(view.container).dispatchEvent(new Event('copy', { bubbles: true }));
        expect(onCopy).not.toHaveBeenCalled();
        await waitFor(() => expect(screen.getByRole('button', { name: '展开' })).toBeInTheDocument());
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/\.\.\.展开/));
        await userEvent.click(screen.getByRole('button', { name: '展开' }));
        await userEvent.click(screen.getByRole('button', { name: '收起' }));
        expect(view.emitted<[boolean, MouseEvent]>('expand').map(([expanded]) => expanded)).toEqual([true, false]);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Typography.copy }));
        await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
        expect(onCopy.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
        expect(onCopy.mock.calls[0].slice(1)).toEqual([LETTERS, true]);
    });

    it('复制内容：多行模板文本去掉首尾空白，content 显式为 undefined 时复制插槽文本', async () => {
        const multiline = render(MultilineCopy);
        await userEvent.click(multiline.container.querySelector('.semi-icon-copy') as Element);
        expect(writeText).toHaveBeenLastCalledWith('Semi Design copies trimmed text');
        multiline.unmount();
        const view = render(Text, { props: { copyable: { content: undefined } }, slots: textSlot('abc') });
        await userEvent.click(view.container.querySelector('.semi-icon-copy') as Element);
        expect(writeText).toHaveBeenLastCalledWith('abc');
    });

    it.each([['tooltip'], ['popover']] as const)('%s 分支未溢出时文字不是 Tab 停靠点', async (type) => {
        mockSingleRowOverflow(10);
        const view = render(Text, {
            props: { ellipsis: { showTooltip: { type } } },
            attrs: { style: { width: '100px' } },
            slots: textSlot('fits'),
        });
        await sleep(50);
        expect(root(view.container)).not.toHaveAttribute('tabindex');
    });

    it('opts.condition 为 false 时已溢出的文字不是 Tab 停靠点，使用方的 tabindex 保留', async () => {
        mockSingleRowOverflow(200);
        const view = render(Text, {
            props: { ellipsis: { showTooltip: { opts: { condition: false } } } },
            attrs: { style: { width: '100px' } },
            slots: textSlot('text'),
        });
        await sleep(50);
        expect(root(view.container)).not.toHaveAttribute('tabindex');
        const own = render(Text, {
            props: { ellipsis: { showTooltip: true } },
            attrs: { style: { width: '100px' }, tabindex: -1 },
            slots: textSlot('text'),
        });
        await sleep(50);
        expect(root(own.container)).toHaveAttribute('tabindex', '-1');
    });

    it('popover 分支溢出切换时根元素节点不变', async () => {
        const width = mockSingleRowOverflow(10);
        const view = render(Text, {
            props: { ellipsis: { showTooltip: { type: 'popover' } } },
            attrs: { style: { width: '100px' } },
            slots: textSlot('popover'),
        });
        const before = root(view.container);
        await sleep(50);
        width.textWidth = 200;
        await fireEvent.mouseEnter(screen.getByText('popover'));
        await waitFor(() => expect(before).toHaveAttribute('tabindex', '0'));
        expect(root(view.container)).toBe(before);
    });

    it('showTooltip.type 或 suffix 显式为 undefined 时按缺省处理', () => {
        const view = render(Text, {
            props: { ellipsis: { showTooltip: { type: undefined }, suffix: undefined } },
            slots: textSlot('text'),
        });
        expect(root(view.container)).toHaveClass(`${prefix}-ellipsis-overflow-ellipsis`);
    });

    it('无 href 的 link 只有 @click.once（onClickOnce）时也可聚焦且角色为 link', () => {
        render(Text, { props: { link: true }, attrs: { onClickOnce: vi.fn<(e: MouseEvent) => void>() }, slots: textSlot('once') });
        expect(screen.getByRole('link', { name: 'once' })).toHaveAttribute('tabindex', '0');
    });

    it('无 href 的 link 有点击监听时可聚焦、角色为 link 且 Enter 触发点击，否则只保留样式', async () => {
        const onClick = vi.fn<(e: MouseEvent) => void>();
        const view = render(Text, { props: { link: true }, attrs: { onClick }, slots: textSlot('go') });
        const link = screen.getByRole('link', { name: 'go' });
        expect(link).toHaveAttribute('tabindex', '0');
        link.focus();
        await userEvent.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(1);
        view.unmount();

        const own = vi.fn<(e: MouseEvent) => void>();
        render(Text, { props: { link: { onClick: own } }, slots: textSlot('own') });
        screen.getByRole('link', { name: 'own' }).focus();
        await userEvent.keyboard('{Enter}');
        expect(own).toHaveBeenCalledTimes(1);

        const plain = render(Text, { props: { link: true }, slots: textSlot('plain') });
        const anchor = plain.container.querySelector('a') as HTMLElement;
        expect(anchor).not.toHaveAttribute('role');
        expect(anchor).not.toHaveAttribute('tabindex');
    });

    it('size inherit 嵌套多层时取最近一层非 inherit 的值', () => {
        const view = render(Paragraph, {
            props: { size: 'small' },
            slots: {
                default: () => (
                    <Text size="inherit" class="outer">
                        {() => (
                            <Text size="inherit" class="inner">
                                {() => 'deep'}
                            </Text>
                        )}
                    </Text>
                ),
            },
        });
        expect(view.container.querySelector('.outer')).toHaveClass(`${prefix}-small`);
        expect(view.container.querySelector('.inner')).toHaveClass(`${prefix}-small`);
    });

    it('size inherit 取最近一层非 inherit 的值，中间层的 normal 优先于外层 small', () => {
        const view = render(Paragraph, {
            props: { size: 'small' },
            slots: {
                default: () => (
                    <Text size="normal" class="mid">
                        {() => (
                            <Text size="inherit" class="inner">
                                {() => 'x'}
                            </Text>
                        )}
                    </Text>
                ),
            },
        });
        const inner = view.container.querySelector('.inner');
        expect(inner).toHaveClass(`${prefix}-normal`);
        expect(inner).not.toHaveClass(`${prefix}-small`);
    });

    it('Numeral 重建的元素保留使用方的 scoped 属性', () => {
        const view = render(NumeralScoped);
        const paragraph = view.container.querySelector('p.x') as HTMLElement;
        expect(paragraph).toHaveTextContent(/^1\.2$/);
        expect(paragraph.getAttributeNames().some((name) => name.startsWith('data-v-'))).toBe(true);
    });

    it('Numeral 中超过字符串化阈值的大段静态内容同样格式化', () => {
        const view = render(NumeralStatic);
        const items = [...view.container.querySelectorAll('i')].map((item) => item.textContent);
        expect(items).toHaveLength(21);
        expect(new Set(items)).toEqual(new Set(['1.6']));
    });

    it('使用方全局注册同名的 Decorate、NumeralNodes 时，库内部的递归仍渲染自身', () => {
        const stub = defineComponent({ setup: () => () => <output>stub</output> });
        const text = render(Text, { props: { delete: true, strong: true }, slots: textSlot('deco'), global: { components: { Decorate: stub } } });
        expect(text.container.querySelector('del strong')).toHaveTextContent('deco');
        const numeral = render(Numeral, {
            props: { precision: 1 },
            slots: {
                default: () => (
                    <b>
                        <i>1.23</i>
                    </b>
                ),
            },
            global: { components: { NumeralNodes: stub } },
        });
        expect(numeral.container.querySelector('b i')).toHaveTextContent(/^1\.2$/);
        expect(document.querySelector('output')).toBeNull();
    });

    it('Text 的 copyAction 插槽拿到 copied、copy 与 config', async () => {
        const scopes: TypographyCopyActionProps[] = [];
        render(Text, {
            props: { copyable: true },
            slots: {
                default: () => 'abc',
                copyAction: (scope: TypographyCopyActionProps) => {
                    scopes.push(scope);
                    return <button onClick={scope.copy}>{scope.copied ? 'done' : 'copy'}</button>;
                },
            },
        });
        expect(Object.keys(scopes[0]).toSorted()).toEqual(['config', 'copied', 'copy']);
        expect(scopes[0].config).toMatchObject({ content: 'abc' });
        await userEvent.click(screen.getByRole('button', { name: 'copy' }));
        expect(await screen.findByRole('button', { name: 'done' })).toBeInTheDocument();
        expect(writeText).toHaveBeenLastCalledWith('abc');
    });

    it('Text 提供 ellipsisTooltip 插槽时不再渲染内置 Tooltip', async () => {
        mockSingleRowOverflow(200);
        render(Text, {
            props: { ellipsis: { showTooltip: true } },
            attrs: { style: { width: '100px' } },
            slots: { default: () => 'text', ellipsisTooltip: ({ trigger }: TypographyEllipsisTooltipProps) => <b data-testid="tip">{trigger}</b> },
        });
        await waitFor(() => expect(screen.getByTestId('tip')).toBeInTheDocument());
        await userEvent.hover(screen.getByText('text'));
        await sleep(50);
        expect(document.querySelector('.semi-tooltip-content')).toBeNull();
    });

    it.each([
        ['Title', Title],
        ['Paragraph', Paragraph],
    ] as const)('%s 没有 icon 插槽，误传的 #icon 不渲染', (_, component) => {
        const view = render(component, { slots: { default: () => 'a', icon: () => <i class="custom-icon">x</i> } });
        expect(view.container.querySelector(`.${prefix}-icon`)).toBeNull();
        expect(view.container.querySelector('.custom-icon')).toBeNull();
    });

    it('Numeral 经透传带上 ellipsis 时，不渲染 ellipsisContent 插槽', async () => {
        mockSingleRowOverflow(200);
        const view = render(Numeral, {
            attrs: { ellipsis: { showTooltip: true }, style: { width: '100px' } },
            slots: { default: () => '12345', ellipsisContent: () => <i>custom content</i> },
        });
        await waitFor(() => expect(root(view.container)).toHaveAttribute('tabindex', '0'));
        await userEvent.hover(root(view.container));
        await waitFor(() => expect(document.querySelector('.semi-tooltip-content')).toHaveTextContent('12345'));
        expect(screen.queryByText('custom content')).toBeNull();
    });
});

describe('Typography 省略与装饰的边界', () => {
    it('展开期间容器变窄，收起后按新宽度重新截断', async () => {
        const height = mockTextHeight(2);
        const { report } = captureResizeObserver();
        const view = render(Paragraph, {
            props: { ellipsis: { expandable: true, collapsible: true, expandText: 'EX', collapseText: 'CO' } },
            attrs: { style: lineHeight },
            slots: textSlot(LETTERS),
        });
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        await sleep(20);
        await userEvent.click(screen.getByRole('button', { name: 'EX' }));
        expect(root(view.container)).toHaveTextContent(new RegExp(`^${LETTERS}CO$`));
        height.factor = 4;
        report([{ target: root(view.container), contentRect: { width: 50, height: 20 } }]);
        // the measurement frame of this report runs while the text is expanded
        await sleep(50);
        await userEvent.click(screen.getByRole('button', { name: 'CO' }));
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/^abcd\.\.\.EX$/));
    });

    it('展开后改为可用 CSS 省略的配置，回到收起状态并用 CSS 省略', async () => {
        mockTextHeight(2);
        const view = render(Paragraph, {
            props: { ellipsis: { expandable: true, collapsible: true } },
            attrs: { style: lineHeight },
            slots: textSlot(LETTERS),
        });
        await userEvent.click(await screen.findByRole('button', { name: '展开' }));
        await view.rerender({ ellipsis: { rows: 1 } });
        await waitFor(() => expect(root(view.container)).toHaveClass(`${prefix}-ellipsis-overflow-ellipsis`));
    });

    it('显式 expandText、collapseText 为 undefined 时回落到语言包文案', async () => {
        mockTextHeight(2);
        render(Paragraph, {
            props: { ellipsis: { expandable: true, collapsible: true, expandText: undefined, collapseText: undefined } },
            attrs: { style: lineHeight },
            slots: textSlot(LETTERS),
        });
        await userEvent.click(await screen.findByRole('button', { name: zh_CN.Typography.expand }));
        expect(screen.getByRole('button', { name: zh_CN.Typography.collapse })).toBeInTheDocument();
    });

    it('只设 expandText 不可展开时，按钮不带 aria-expanded', async () => {
        mockTextHeight(2);
        render(Paragraph, {
            props: { ellipsis: { expandText: 'EX' } },
            attrs: { style: lineHeight },
            slots: textSlot(LETTERS),
        });
        expect(await screen.findByRole('button', { name: 'EX' })).not.toHaveAttribute('aria-expanded');
    });

    it('link 对象的 onKeydown 与内置的 Enter 激活同时生效', async () => {
        const onKeydown = vi.fn<(e: KeyboardEvent) => void>();
        const onClick = vi.fn<(e: MouseEvent) => void>();
        render(Text, { props: { link: { onKeydown, onClick } }, slots: textSlot('x') });
        await userEvent.tab();
        await userEvent.keyboard('{Enter}');
        expect(onKeydown).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('link 对象的 onKeydown 调用 preventDefault 后不再触发内置的 Enter 激活', async () => {
        const onClick = vi.fn<(e: MouseEvent) => void>();
        render(Text, { props: { link: { onKeydown: (e: KeyboardEvent) => e.preventDefault(), onClick } }, slots: textSlot('x') });
        await userEvent.tab();
        await userEvent.keyboard('{Enter}');
        expect(onClick).not.toHaveBeenCalled();
    });

    it('copyAction 插槽的自定义节点同样为 JS 省略预留宽度', async () => {
        mockTextHeight(2);
        const view = render(Paragraph, {
            props: { copyable: true, ellipsis: { rows: 1 } },
            attrs: { style: lineHeight },
            slots: { default: () => LETTERS, copyAction: () => <button type="button">CCCC</button> },
        });
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/^abcdefghijkl\.\.\.CCCC$/));
    });

    it('复制成功后按已复制提示的宽度重新截断，恢复后回到原截断', async () => {
        mockTextHeight(2);
        const view = render(Paragraph, {
            props: { copyable: { duration: 0.3 }, ellipsis: { rows: 1 } },
            attrs: { style: lineHeight },
            slots: textSlot(LETTERS),
        });
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/^abcdefghijklmnop\.\.\.$/));
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Typography.copy }));
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/^abcdefghijkl\.\.\.复制成功$/));
        await waitFor(() => expect(root(view.container)).toHaveTextContent(/^abcdefghijklmnop\.\.\.$/));
    });

    it('已复制期间，只有图标的 copySuccessTip 以语言包文案或其 aria-label 命名按钮', async () => {
        const first = render(Text, { props: { copyable: true }, slots: { default: () => 'Semi', copySuccessTip: () => <IconSetting /> } });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Typography.copy }));
        expect(await screen.findByRole('button', { name: zh_CN.Typography.copied })).toBeInTheDocument();
        first.unmount();

        render(Text, { props: { copyable: true }, slots: { default: () => 'Semi', copySuccessTip: () => <IconSetting aria-label="Done" /> } });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Typography.copy }));
        expect(await screen.findByRole('button', { name: 'Done' })).toBeInTheDocument();
    });

    it('省略加 showTooltip 的文字含 href 链接时，根元素不再成为第二个 Tab 停靠点', async () => {
        mockSingleRowOverflow(200);
        const view = render(Text, {
            props: { link: { href: '#' }, ellipsis: { showTooltip: true } },
            attrs: { style: { width: '100px' } },
            slots: textSlot('link text'),
        });
        await sleep(50);
        expect(root(view.container)).not.toHaveAttribute('tabindex');
        expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('省略加 showTooltip 的文字含可点击的 link 时，根元素不再成为第二个 Tab 停靠点', async () => {
        mockSingleRowOverflow(200);
        const view = render(Text, {
            props: { link: true, ellipsis: { showTooltip: true } },
            attrs: { style: { width: '100px' }, onClick: vi.fn<(e: MouseEvent) => void>() },
            slots: textSlot('link text'),
        });
        await sleep(50);
        expect(root(view.container)).not.toHaveAttribute('tabindex');
    });

    it('省略加 showTooltip 的文字含 href 链接时，提示的 aria-describedby 落在链接上而不是根元素', async () => {
        mockSingleRowOverflow(200);
        const view = render(Text, {
            props: { link: { href: '#' }, ellipsis: { showTooltip: true } },
            attrs: { style: { width: '100px' } },
            slots: textSlot('link text'),
        });
        await sleep(50);
        await userEvent.hover(screen.getByRole('link'));
        const tip = await screen.findByRole('tooltip');
        await waitFor(() => expect(screen.getByRole('link')).toHaveAttribute('aria-describedby', tip.id));
        expect(root(view.container)).not.toHaveAttribute('aria-describedby');
    });

    it('省略加 showTooltip 的文字没有可聚焦的链接时，aria-describedby 仍在根元素上', async () => {
        mockSingleRowOverflow(200);
        const view = render(Text, {
            props: { ellipsis: { showTooltip: true } },
            attrs: { style: { width: '100px' } },
            slots: textSlot('plain text'),
        });
        await sleep(50);
        await fireEvent.mouseEnter(screen.getByText('plain text'));
        await userEvent.hover(root(view.container));
        const tip = await screen.findByRole('tooltip');
        await waitFor(() => expect(root(view.container)).toHaveAttribute('aria-describedby', tip.id));
    });

    it('省略加 showTooltip 的文字含按钮但没有 link 装饰时，aria-describedby 仍在根元素上', async () => {
        mockSingleRowOverflow(200);
        const view = render(Text, {
            props: { ellipsis: { showTooltip: true } },
            attrs: { style: { width: '100px' } },
            slots: { default: () => ['text ', <button type="button">action</button>] },
        });
        await sleep(50);
        await userEvent.hover(root(view.container));
        const tip = await screen.findByRole('tooltip');
        await waitFor(() => expect(root(view.container)).toHaveAttribute('aria-describedby', tip.id));
    });
});
