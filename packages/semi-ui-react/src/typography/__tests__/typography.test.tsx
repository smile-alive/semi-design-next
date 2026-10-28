import { StrictMode, createContext, createRef, type ComponentProps, type CSSProperties } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconSetting } from '@fibrae/semi-icons-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import { sleep } from '@test/utils/react';
import Dropdown from '../../dropdown';
import type Base from '../base';
import Typography, { type Ellipsis, type TitleProps } from '../index';
import type { CopyableConfig } from '../interface';
import type { NumeralProps } from '../numeral';

const prefixCls = 'semi-typography';
const { Text, Title, Paragraph, Numeral } = Typography;
type CopyHandler = NonNullable<CopyableConfig['onCopy']>;
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

// jsdom has no layout: the measuring container's height grows `factor` px per character; with line-height 20px a
// single row fits while scrollHeight < 40, i.e. fewer than 40 / factor characters in the container
function mockTextHeight(factor = 2) {
    const state = { factor };
    vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(function () {
        return this.textContent.length * state.factor;
    });
    return state;
}

// a single-line text node wider than its container: CSS ellipsis reports an overflow
function mockSingleRowOverflow(textWidth = 200) {
    const state = { textWidth };
    vi.spyOn(Range.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width: state.textWidth }) as DOMRect);
    return state;
}

// captures the ResizeObserver callback so a test can report a size change
function captureResizeObserver() {
    const observers = [];
    vi.stubGlobal(
        'ResizeObserver',
        class {
            constructor(callback) {
                observers.push(callback);
            }
            observe() {}
            unobserve() {}
            disconnect() {}
        }
    );
    return (entries) => observers.forEach((callback) => callback(entries));
}

describe(`Typography`, () => {
    beforeEach(() => {
        // jsdom has no Clipboard API
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: vi.fn<(data: string) => Promise<void>>().mockResolvedValue(undefined) },
            configurable: true,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('自定义组件', () => {
        let props = { component: 'div' as const };
        const { container: titleContainer } = render(
            <Typography.Title {...props} heading={1}>
                Semi Design
            </Typography.Title>
        );
        expect(titleContainer.querySelectorAll(`div.${prefixCls}-h1`)).toHaveLength(1);

        const { container: textContainer } = render(
            <Typography.Text {...props} id="text">
                Semi Design
            </Typography.Text>
        );
        const text = textContainer.querySelectorAll(`div.${prefixCls}`);
        expect(text).toHaveLength(1);
        expect(text[0]).toHaveAttribute('id', 'text');

        const { container: paragraphContainer } = render(<Typography.Paragraph {...props}>Semi Design</Typography.Paragraph>);
        expect(paragraphContainer.querySelectorAll(`div.${prefixCls}-paragraph`)).toHaveLength(1);
    });

    it('typography 可复制', async () => {
        const onCopy = vi.fn<CopyHandler>();
        const { container, rerender } = render(<Typography.Paragraph copyable={{ onCopy }}>Semi Design</Typography.Paragraph>);
        const icons = container.querySelectorAll(`.semi-icon-copy`);
        expect(icons).toHaveLength(1);
        await userEvent.click(icons[0]);
        await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Semi Design');
        expect(onCopy.mock.calls[0].slice(1)).toEqual(['Semi Design', true]);
        expect(container.querySelectorAll(`.${prefixCls}-action-copied`)).toHaveLength(1);
        rerender(<Typography.Paragraph copyable={false}>Semi Design</Typography.Paragraph>);
        expect(container.querySelector(`.semi-icon-copy`)).toBeNull();
    });

    it('复制按钮有可访问名称，按 Enter 和 Space 可复制', async () => {
        const onCopy = vi.fn<CopyHandler>();
        const { rerender } = render(<Paragraph copyable={{ duration: 0.01, onCopy }}>Semi Design</Paragraph>);
        const button = screen.getByRole('button', { name: zh_CN.Typography.copy });
        act(() => {
            button.focus();
        });
        await userEvent.keyboard(' ');
        await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(screen.getByRole('button', { name: zh_CN.Typography.copy })).toBeInTheDocument());
        act(() => {
            screen.getByRole('button', { name: zh_CN.Typography.copy }).focus();
        });
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(2));

        rerender(<Paragraph copyable={{ icon: <IconSetting aria-label="Copy code" /> }}>Semi Design</Paragraph>);
        expect(await screen.findByRole('button', { name: 'Copy code' })).toBeInTheDocument();
        rerender(<Paragraph copyable={{ icon: <IconSetting /> }}>Semi Design</Paragraph>);
        expect(screen.getByRole('button', { name: zh_CN.Typography.copy })).toBeInTheDocument();
    });

    it.each([
        ['default icon', undefined],
        ['custom icon', <IconSetting key="icon" />],
    ])('%s 按钮在已复制状态下保持焦点，且仅在未复制时才复制', async (_, icon) => {
        const onCopy = vi.fn<CopyHandler>();
        render(<Paragraph copyable={{ duration: 0.2, icon, onCopy }}>Semi Design</Paragraph>);
        const button = screen.getByRole('button', { name: zh_CN.Typography.copy });
        act(() => {
            button.focus();
        });
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(button).toHaveAccessibleName(zh_CN.Typography.copied));
        expect(button).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        await userEvent.click(button);
        expect(onCopy).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(button).toHaveAccessibleName(zh_CN.Typography.copy));
        expect(button).toHaveFocus();
    });

    it('焦点在其他元素时复制，不会抢走焦点', async () => {
        render(
            <>
                <button>other</button>
                <Paragraph copyable={{ duration: 0.05 }}>Semi Design</Paragraph>
            </>
        );
        act(() => {
            screen.getByRole('button', { name: 'other' }).focus();
        });
        fireEvent.click(screen.getByRole('button', { name: zh_CN.Typography.copy }));
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-action-copied`)).toBeInTheDocument());
        expect(screen.getByRole('button', { name: 'other' })).toHaveFocus();
    });

    it('typography 可复制时，剪贴板写入被拒绝会报错且保持未复制状态', async () => {
        vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('NotAllowedError'));
        const onCopy = vi.fn<CopyHandler>();
        const { container } = render(<Typography.Paragraph copyable={{ onCopy }}>Semi Design</Typography.Paragraph>);
        await userEvent.click(container.querySelector(`.semi-icon-copy`));
        await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
        expect(onCopy.mock.calls[0].slice(1)).toEqual(['Semi Design', false]);
        expect(container.querySelector(`.${prefixCls}-action-copied`)).toBeNull();
    });

    it('typography 可复制时，重复复制会重新计时已复制状态', async () => {
        vi.useFakeTimers();
        const renderCopy = (copied, doCopy) => <button onClick={doCopy}>{copied ? 'copied' : 'copy'}</button>;
        render(<Typography.Paragraph copyable={{ duration: 3, render: renderCopy }}>Semi Design</Typography.Paragraph>);
        const button = screen.getByRole('button');
        await act(async () => fireEvent.click(button));
        await act(async () => vi.advanceTimersByTime(2000));
        await act(async () => fireEvent.click(button));
        await act(async () => vi.advanceTimersByTime(2000));
        expect(button).toHaveTextContent('copied');
        await act(async () => vi.advanceTimersByTime(1000));
        expect(button).toHaveTextContent('copy');
    });

    it('typography link 用法', () => {
        const { container, rerender } = render(<Typography.Text link={{ href: 'https://semi.design/' }}>链接文本</Typography.Text>);
        expect(container.querySelectorAll(`.${prefixCls}.${prefixCls}-link`)).toHaveLength(1);
        expect(screen.getByRole('link', { name: '链接文本' })).toHaveAttribute('href', 'https://semi.design/');
        rerender(
            <Typography.Text disabled link={{ href: 'https://semi.design/' }}>
                链接文本
            </Typography.Text>
        );
        expect(container.querySelectorAll(`.${prefixCls}.${prefixCls}-disabled`)).toHaveLength(1);
        rerender(
            <Typography.Text disabled link={false} underline>
                链接文本
            </Typography.Text>
        );
        expect(container.querySelectorAll(`.${prefixCls} u`)).toHaveLength(1);
    });

    it('typography 省略号用法', () => {
        const { container, rerender } = render(
            <Typography.Paragraph style={{ width: 250 }} ellipsis={{ showTooltip: true }}>
                是一个很长很长很长很长5号标题
            </Typography.Paragraph>
        );
        const getParagraph = () => container.querySelector(`.${prefixCls}-paragraph`);
        // jsdom has no layout, so only the ellipsis strategy (css single line by default) is observable
        expect(getParagraph()).toHaveClass(`${prefixCls}-ellipsis`, `${prefixCls}-ellipsis-single-line`);
        expect(getParagraph()).toHaveClass(`${prefixCls}-ellipsis-overflow-ellipsis`);
        expect(getParagraph()).toHaveTextContent(/^是一个很长很长很长很长5号标题$/);

        rerender(
            <Typography.Paragraph style={{ width: 250 }} ellipsis={{ showTooltip: true }}>
                的撒的撒打算的撒的撒的撒打算打的撒的撒打算的撒的撒的撒打算打
            </Typography.Paragraph>
        );
        expect(getParagraph()).toHaveClass(`${prefixCls}-ellipsis-overflow-ellipsis`);
        expect(getParagraph()).toHaveTextContent(/^的撒的撒打算的撒的撒的撒打算打的撒的撒打算的撒的撒的撒打算打$/);

        rerender(
            <Typography.Paragraph
                style={{ width: 250 }}
                ellipsis={{
                    expandText: 'expandText',
                    collapseText: 'collapseText',
                    rows: 1,
                    showTooltip: {
                        type: 'popover',
                    },
                    suffix: 'suffix',
                }}
            >
                的撒的撒打算的撒的撒的撒打算打的撒的撒打算的撒的撒的撒打算打
            </Typography.Paragraph>
        );
        expect(getParagraph()).toHaveClass(`${prefixCls}-ellipsis`, `${prefixCls}-ellipsis-single-line`);
        expect(getParagraph()).not.toHaveClass(`${prefixCls}-ellipsis-overflow-ellipsis`);
    });

    it('typography JS 省略号截断', async () => {
        // jsdom has no layout: the measuring container height is 2px per character with line-height 20px,
        // so a single row (limit round(20 * 2) = 40px) holds at most 19 characters
        vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(function () {
            return this.textContent.length * 2;
        });
        const text = 'abcdefghijklmnopqrstuvwxyz';
        const style = { lineHeight: '20px' };

        const { container, unmount } = render(
            <Typography.Paragraph style={style} ellipsis={{ suffix: 'SF', expandable: true, expandText: 'EX', collapsible: true, collapseText: 'CO' }}>
                {text}
            </Typography.Paragraph>
        );
        const paragraph = container.querySelector(`.${prefixCls}-paragraph`);
        await waitFor(() => expect(paragraph).toHaveTextContent(/^abcdefghijkl\.\.\.SFEX$/));
        await userEvent.click(screen.getByRole('button', { name: 'EX' }));
        expect(paragraph).toHaveTextContent(new RegExp(`^${text}SFCO$`));
        await userEvent.click(screen.getByRole('button', { name: 'CO' }));
        expect(paragraph).toHaveTextContent(/^abcdefghijkl\.\.\.SFEX$/);
        unmount();

        const { container: middleContainer, unmount: unmountMiddle } = render(
            <Typography.Paragraph style={style} ellipsis={{ pos: 'middle' }}>
                {text}
            </Typography.Paragraph>
        );
        const middle = middleContainer.querySelector(`.${prefixCls}-paragraph`);
        await waitFor(() => expect(middle).toHaveTextContent(/^abcdefgh\.\.\.stuvwxyz$/));
        unmountMiddle();

        const { container: rowsContainer } = render(
            <Typography.Text style={style} ellipsis={{ rows: 2, suffix: 'SF' }} strong>
                {text + text}
            </Typography.Text>
        );
        const rowsText = rowsContainer.querySelector(`.${prefixCls}`);
        expect(rowsText).toHaveClass(`${prefixCls}-ellipsis-multiple-line`);
        await waitFor(() => expect(rowsText).toHaveTextContent(/^abcdefghijklmnopqrstuvwx\.\.\.SF$/));
    });

    it('isSingleRowOverflowing 亚像素与 border 语义（回归 #2350/#3340）', async () => {
        // jsdom has no layout: the container rect, the text Range rect and the container padding/border are mocked,
        // and the single-row overflow verdict is observed through showTooltip.renderTooltip (rendered only on overflow)
        const originalGetComputedStyle = window.getComputedStyle;

        const setup = ({ containerWidth, textWidth, padding, border }) => {
            vi.restoreAllMocks();
            vi.spyOn(Range.prototype, 'getBoundingClientRect').mockReturnValue({ width: textWidth } as DOMRect);
            const containerRect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: containerWidth } as DOMRect);
            vi.spyOn(window, 'getComputedStyle').mockImplementation((elt, ...rest) =>
                elt.classList.contains(prefixCls)
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

        const getRowOverflow = async (containerRect) => {
            const { unmount } = render(<Typography.Text ellipsis={{ showTooltip: { renderTooltip: (_children, node) => <b data-testid="tip">{node}</b> } }}>test</Typography.Text>);
            // overflow is measured in a requestAnimationFrame after mount
            await waitFor(() => expect(containerRect).toHaveBeenCalled());
            const result = screen.queryByTestId('tip') !== null;
            unmount();
            return result;
        };

        // 1. Sub-pixel: exact text width 32.3046875 and an equally wide container rect (a rounded clientWidth of 32 would report a false overflow)
        let rect = setup({ containerWidth: 32.3046875, textWidth: 32.3046875, padding: '0px', border: '0px' });
        expect(await getRowOverflow(rect)).toBe(false);

        // 2. Bordered container: rect.width=100 includes 2*2px border, content box 96, text 98 is a real overflow
        //    (rect.width - padding alone gives 100 and would miss it)
        rect = setup({ containerWidth: 100, textWidth: 98, padding: '0px', border: '2px' });
        expect(await getRowOverflow(rect)).toBe(true);

        // 3. Padded container: rect.width=100 includes 2*10px padding, content box 80, text 90 is a real overflow
        rect = setup({ containerWidth: 100, textWidth: 90, padding: '10px', border: '0px' });
        expect(await getRowOverflow(rect)).toBe(true);

        // 4. No overflow: text 30 < content box 96
        rect = setup({ containerWidth: 100, textWidth: 30, padding: '0px', border: '2px' });
        expect(await getRowOverflow(rect)).toBe(false);
    });

    it('typography Numeral 用法', () => {
        const { container, unmount } = render(
            <Typography.Numeral precision={2} rule="numbers" truncate="ceil">
                <div className="price">
                    <span>预期价格:{1.555}; 成本: -1; 盈利: 0.555</span>
                    <b>Currency symbols: $</b>
                </div>
            </Typography.Numeral>
        );
        expect(container.querySelector('.price').textContent).toEqual('1.56-1.00,0.56');
        unmount();

        const children = (
            <div className="price">
                Total revenue: <b>$ 1992.15</b>
            </div>
        );
        const { container: container2, rerender } = render(
            <Typography.Numeral precision={2} rule="exponential" truncate="floor">
                {children}
            </Typography.Numeral>
        );
        expect(container2.querySelector('.price').textContent).toEqual('Total revenue: $ 1.99e+3');
        rerender(
            <Typography.Numeral parser={(oldVal) => oldVal.replace(/[^\d.]/g, '')} precision={2} rule="exponential" truncate="floor">
                {children}
            </Typography.Numeral>
        );
        expect(container2.querySelector('.price').textContent).toEqual('1992.15');
    });

    it('Numeral 不调用函数 children，元素自带的 render 函数（Context.Consumer）按原样工作', () => {
        const Ctx = createContext('ctx 1.234');
        const { container } = render(
            <Numeral precision={1}>
                <Ctx.Consumer>{(value) => <i>{value}</i>}</Ctx.Consumer>
                2.345
            </Numeral>
        );
        expect(container.querySelector(`.${prefixCls}`)).toHaveTextContent('ctx 1.2342.3');
    });

    it('children 为模板字符串', () => {
        const { Text } = Typography;
        const code = 'code';

        const { container } = render(
            <Text style={{ marginTop: 6, color: 'var(--semi-color-text-2)' }} copyable={{ content: code }} ellipsis={{ showTooltip: { opts: { style: { wordBreak: 'break-word' } } } }}>
                Key: {code}
            </Text>
        );
        expect(container.querySelector(`.${prefixCls}`).firstChild.textContent).toEqual('Key: code');
    });

    it('自定义复制渲染', async () => {
        const { Text } = Typography;
        const code = 'code';

        const { container } = render(
            <Text
                style={{ marginTop: 6, color: 'var(--semi-color-text-2)' }}
                copyable={{
                    content: code,
                    render: (copied, doCopy, config) => {
                        return (
                            <button className="test-copy-button" onClick={doCopy}>
                                <span className="test-copied">{String(copied)}</span>
                                <span className="test-copy-content">{config.content}</span>
                            </button>
                        );
                    },
                }}
                ellipsis={{ showTooltip: { opts: { style: { wordBreak: 'break-word' } } } }}
            >
                Key: {code}
            </Text>
        );

        expect(container.querySelector('.test-copied')).toHaveTextContent(/^false$/);
        expect(container.querySelector('.test-copy-content')).toHaveTextContent(new RegExp(`^${code}$`));

        const triggers = container.querySelectorAll('.test-copy-button');
        expect(triggers).toHaveLength(1);
        await userEvent.click(triggers[0]);
        await waitFor(() => expect(container.querySelector('.test-copied')).toHaveTextContent(/^true$/));
    });
});

describe('Typography 行为基线', () => {
    beforeEach(() => {
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: vi.fn<(data: string) => Promise<void>>().mockResolvedValue(undefined) },
            configurable: true,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const root = (container) => container.querySelector(`.${prefixCls}`);

    it('非 link 时的 type、size、spacing 与装饰标签', () => {
        const { container, rerender } = render(
            <Text type="danger" code delete mark size="small" strong underline>
                T
            </Text>
        );
        expect(root(container).tagName).toBe('SPAN');
        expect(root(container)).toHaveClass(`${prefixCls}-danger`, `${prefixCls}-small`, `${prefixCls}-normal`);
        expect(root(container).querySelector(':scope > del > strong > u > code > mark')).toHaveTextContent(/^T$/);

        rerender(<Paragraph spacing="extended">P</Paragraph>);
        expect(root(container).tagName).toBe('P');
        expect(root(container)).toHaveClass(`${prefixCls}-paragraph`, `${prefixCls}-primary`, `${prefixCls}-normal`, `${prefixCls}-extended`);
        expect(root(container).children).toHaveLength(0);
    });

    it('link 包裹所有装饰，下划线改为类名，并去掉 type 类名', () => {
        const { container, rerender } = render(
            <Text type="danger" code delete link={{ href: '#target', target: '_blank' }} mark strong underline>
                L
            </Text>
        );
        expect(root(container)).toHaveClass(`${prefixCls}-link`);
        expect(root(container)).not.toHaveClass(`${prefixCls}-danger`);
        const anchor = root(container).querySelector(':scope > a');
        expect(anchor).toHaveAttribute('href', '#target');
        expect(anchor).toHaveAttribute('target', '_blank');
        const inner = anchor.querySelector(`:scope > del > strong > code > mark > span.${prefixCls}-link-text.${prefixCls}-link-underline`);
        expect(inner).toHaveTextContent(/^L$/);
        expect(root(container).querySelector('u')).toBeNull();

        rerender(
            <Text disabled link={{ href: '#target' }}>
                L
            </Text>
        );
        expect(root(container).querySelector('a')).toBeNull();
        expect(root(container).querySelector(`:scope > span > span.${prefixCls}-link-text`)).toHaveTextContent(/^L$/);
    });

    it('Base 的 headingTag 只接受 h1 到 h6，BaseTypographyProps 不从入口导出', () => {
        expectTypeOf<ComponentProps<typeof Base>['headingTag']>().toEqualTypeOf<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | undefined>();
        // @ts-expect-error Base's props are internal
        type Internal = import('../index').BaseTypographyProps;
        expectTypeOf<Internal>().toBeAny();
    });

    it('Title 映射 heading 与 weight', () => {
        const { container, rerender } = render(<Title heading={3}>H</Title>);
        expect(root(container).tagName).toBe('H3');
        expect(root(container)).toHaveClass(`${prefixCls}-h3`, `${prefixCls}-primary`);

        rerender(<Title heading={7 as unknown as TitleProps['heading']}>H</Title>);
        expect(root(container).tagName).toBe('H1');
        expect(root(container)).toHaveClass(`${prefixCls}-h1`);

        rerender(
            <Title heading={2} weight="semibold">
                H
            </Title>
        );
        expect(root(container)).toHaveClass(`${prefixCls}-h2-weight-semibold`);
        expect(root(container).style.fontWeight).toBe('');

        rerender(
            <Title style={{ color: 'red' }} heading={2} weight={600}>
                H
            </Title>
        );
        expect(root(container).className).not.toMatch(/weight/);
        expect(root(container).style.fontWeight).toBe('600');
        expect(root(container).style.color).toBe('red');

        rerender(
            <Title style={{ fontWeight: 300 }} heading={2} weight={600}>
                H
            </Title>
        );
        expect(root(container).style.fontWeight).toBe('300');
    });

    it('icon 插槽，size inherit 读取外层 size', () => {
        const { container } = render(
            <Paragraph size="small">
                <Text size="inherit" icon={<IconSetting />}>
                    inherit
                </Text>
                <Text icon="*">plain</Text>
            </Paragraph>
        );
        const [inherit, plain] = container.querySelectorAll(`.${prefixCls}-paragraph > .${prefixCls}`);
        expect(inherit).toHaveClass(`${prefixCls}-small`);
        expect(inherit).not.toHaveClass(`${prefixCls}-inherit`);
        const icon = inherit.querySelector(`:scope > span.${prefixCls}-icon[x-semi-prop="icon"]`);
        expect(icon.querySelector('.semi-icon')).toHaveClass('semi-icon-small');
        expect(plain).toHaveClass(`${prefixCls}-normal`);
        expect(plain.querySelector(`.${prefixCls}-icon`)).toHaveTextContent(/^\*$/);
    });

    it('将 data-* 及其他 DOM 属性透传到根元素', () => {
        const { container } = render(
            <div>
                <Text id="t" data-x="text" onClick={() => {}}>
                    a
                </Text>
                <Title data-x="title">b</Title>
                <Paragraph data-x="paragraph">c</Paragraph>
                <Numeral data-x="numeral">1</Numeral>
                <Typography data-x="typography">d</Typography>
            </div>
        );
        const nodes = [...container.querySelectorAll<HTMLElement>('[data-x]')];
        expect(nodes.map((node) => [node.tagName, node.dataset.x])).toEqual([
            ['SPAN', 'text'],
            ['H1', 'title'],
            ['P', 'paragraph'],
            ['SPAN', 'numeral'],
            ['ARTICLE', 'typography'],
        ]);
        nodes.forEach((node) => expect(node).toHaveClass(prefixCls));
        expect(nodes[0]).toHaveAttribute('id', 't');
        const { container: other } = render(
            <Text code copyable={false} delete ellipsis={false} mark strong underline>
                x
            </Text>
        );
        expect(root(other).getAttributeNames()).toEqual(['class']);
        // undeclared props pass through; the spread skips the excess property check
        const removedProps = { editable: 'yes' };
        const { container: passthrough } = render(<Text {...removedProps}>x</Text>);
        expect(root(passthrough)).toHaveAttribute('editable', 'yes');
    });

    it('裸 Typography 读取 semiGlobal overrideDefaultProps，Text 保留自己的标签', () => {
        semiGlobal.config.overrideDefaultProps = { Typography: { component: 'section' } };
        try {
            const { container } = render(
                <div>
                    <Typography>bare</Typography>
                    <Text>text</Text>
                </div>
            );
            const [bare, text] = container.querySelectorAll(`.${prefixCls}`);
            expect(bare.tagName).toBe('SECTION');
            expect(text.tagName).toBe('SPAN');
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
        const { container } = render(<Typography className="x">bare</Typography>);
        expect(root(container).tagName).toBe('ARTICLE');
        expect(root(container)).toHaveClass(prefixCls, 'x');
    });

    it('CSS 省略号类名与 line clamp', () => {
        const { container, rerender } = render(<Text ellipsis>t</Text>);
        expect(root(container)).toHaveClass(`${prefixCls}-ellipsis`, `${prefixCls}-ellipsis-single-line`, `${prefixCls}-ellipsis-overflow-ellipsis`, `${prefixCls}-ellipsis-overflow-ellipsis-text`);

        rerender(<Text ellipsis={{ rows: 2 }}>t</Text>);
        expect(root(container)).toHaveClass(`${prefixCls}-ellipsis-multiple-line`, `${prefixCls}-ellipsis-multiple-line-text`);
        expect(root(container)).not.toHaveClass(`${prefixCls}-ellipsis-overflow-ellipsis`);
        expect(root(container).style.webkitLineClamp).toBe('2');

        rerender(<Paragraph ellipsis={{ rows: 3 }}>t</Paragraph>);
        expect(root(container)).toHaveClass(`${prefixCls}-ellipsis-multiple-line`);
        expect(root(container)).not.toHaveClass(`${prefixCls}-ellipsis-multiple-line-text`);
        expect(root(container).style.webkitLineClamp).toBe('3');

        rerender(<Paragraph ellipsis={{ rows: 3, pos: 'middle' }}>t</Paragraph>);
        expect(root(container)).toHaveClass(`${prefixCls}-ellipsis-multiple-line`);
        expect(root(container).style.webkitLineClamp).toBe('');

        rerender(<Paragraph>t</Paragraph>);
        expect(root(container).className).not.toMatch(/ellipsis/);
    });

    it('CSS 省略号在行溢出时显示包含完整文本的 Tooltip', async () => {
        mockSingleRowOverflow(200);
        render(
            <Text style={{ width: 100 }} ellipsis={{ showTooltip: true }}>
                overflowing text
            </Text>
        );
        await sleep(50);
        await userEvent.hover(screen.getByText('overflowing text').closest(`.${prefixCls}`));
        await waitFor(() => expect(document.querySelector('.semi-tooltip-content')).not.toBeNull());
        expect(document.querySelector('.semi-tooltip-content')).toHaveTextContent('overflowing text');
        expect(document.querySelector('.semi-popover-content')).toBeNull();
    });

    it('showTooltip 的 popover 合并自身 opts 并保留箭头', async () => {
        mockSingleRowOverflow(200);
        render(
            <Text
                style={{ width: 100 }}
                ellipsis={{
                    showTooltip: { type: 'Popover', opts: { className: 'user-pop', style: { color: 'red' } } },
                }}
            >
                popover text
            </Text>
        );
        await sleep(50);
        await userEvent.hover(screen.getByText('popover text').closest(`.${prefixCls}`));
        await waitFor(() => expect(document.querySelector('.semi-popover-content')).not.toBeNull());
        const popover = document.querySelector<HTMLElement>(`.${prefixCls}-ellipsis-popover`);
        expect(popover).toHaveClass('user-pop');
        expect(popover).toHaveTextContent('popover text');
        expect(popover.style.color).toBe('red');
        expect(document.querySelector('.semi-popover-icon-arrow')).not.toBeNull();
    });

    it('文本未溢出时不显示 Tooltip，悬停时重新检查 CSS 溢出', async () => {
        const width = mockSingleRowOverflow(10);
        const renderTooltip = (children, node) => (
            <b data-children={children} data-testid="tip">
                {node}
            </b>
        );
        render(
            <Text style={{ width: 100 }} ellipsis={{ showTooltip: { renderTooltip } }}>
                fits
            </Text>
        );
        await sleep(50);
        expect(screen.queryByTestId('tip')).toBeNull();
        width.textWidth = 200;
        fireEvent.mouseEnter(screen.getByText('fits'));
        expect(screen.getByTestId('tip')).toHaveAttribute('data-children', 'fits');
        expect(screen.getByTestId('tip').querySelector(`.${prefixCls}`)).toHaveTextContent(/^fits$/);
    });

    it('首帧渲染完整文本和展开按钮，之后再进行截断', async () => {
        mockTextHeight(2);
        const { container } = render(
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={{ expandable: true, expandText: 'EX' }}>
                {LETTERS}
            </Paragraph>
        );
        expect(root(container)).toHaveTextContent(new RegExp(`^${LETTERS}EX$`));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));

        const { container: fits } = render(
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={{ expandable: true, expandText: 'EX' }}>
                short
            </Paragraph>
        );
        expect(screen.getAllByRole('button', { name: 'EX' })).toHaveLength(2);
        await waitFor(() => expect(root(fits)).toHaveTextContent(/^short$/));
        expect(fits.querySelector(`.${prefixCls}-ellipsis-expand`)).toBeNull();
    });

    it('JS 省略只在 children 含 React 元素时警告，字符串数组与数字不警告', async () => {
        mockTextHeight(2);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            const { container } = render(
                <Paragraph style={{ lineHeight: '20px' }} ellipsis={{ expandable: true }}>
                    {LETTERS.slice(0, 10)}
                    {LETTERS.slice(10)}
                </Paragraph>
            );
            await waitFor(() => expect(root(container)).toHaveTextContent(/\.\.\./));
            expect(warn).not.toHaveBeenCalled();
            render(
                <Paragraph ellipsis={{ expandable: true }}>
                    <b>element</b>
                </Paragraph>
            );
            await waitFor(() => expect(warn).toHaveBeenCalledWith(expect.stringContaining('pure text')));
        } finally {
            warn.mockRestore();
        }
    });

    it('expandable 未设置 collapsible 时：onExpand 参数正确，展开后的文本不含收起文案', async () => {
        mockTextHeight(2);
        const onExpand = vi.fn<NonNullable<Ellipsis['onExpand']>>();
        const { container } = render(
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={{ expandable: true, expandText: 'EX', onExpand }}>
                {LETTERS}
            </Paragraph>
        );
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        const button = screen.getByRole('button', { name: 'EX' });
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
        act(() => {
            button.focus();
        });
        await userEvent.keyboard('{Enter}');
        expect(onExpand).toHaveBeenCalledTimes(1);
        expect(onExpand.mock.calls[0][0]).toBe(true);
        expect(onExpand.mock.calls[0][1]).toBeTruthy();
        expect(root(container)).toHaveTextContent(new RegExp(`^${LETTERS}$`));
        expect(container.querySelector(`.${prefixCls}-ellipsis-expand`)).toBeNull();
    });

    it('展开按钮与原生按钮一样响应 Space', async () => {
        mockTextHeight(2);
        const { container } = render(
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={{ expandable: true, collapsible: true }}>
                {LETTERS}
            </Paragraph>
        );
        await waitFor(() => expect(root(container)).toHaveTextContent(/\.\.\.展开$/));
        act(() => {
            screen.getByRole('button', { name: '展开' }).focus();
        });
        await userEvent.keyboard(' ');
        expect(root(container)).toHaveTextContent(new RegExp(`^${LETTERS}收起$`));
    });

    it('语言包中的展开与收起文案为默认值', async () => {
        mockTextHeight(2);
        const { container } = render(
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={{ expandable: true, collapsible: true }}>
                {LETTERS}
            </Paragraph>
        );
        await waitFor(() => expect(root(container)).toHaveTextContent(/\.\.\.展开$/));
        await userEvent.click(screen.getByRole('button', { name: '展开' }));
        expect(root(container)).toHaveTextContent(new RegExp(`^${LETTERS}收起$`));
    });

    it('新 children 会重置展开状态并重新截断', async () => {
        mockTextHeight(2);
        const ellipsis = { expandable: true, expandText: 'EX', collapsible: true, collapseText: 'CO' };
        const { container, rerender } = render(
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={ellipsis}>
                {LETTERS}
            </Paragraph>
        );
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        await userEvent.click(screen.getByRole('button', { name: 'EX' }));
        expect(root(container)).toHaveTextContent(/CO$/);

        rerender(
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={ellipsis}>
                {LETTERS.toUpperCase()}
            </Paragraph>
        );
        await waitFor(() => expect(root(container)).toHaveTextContent(/^ABCDEFGHIJKLMN\.\.\.EX$/));
    });

    it('父组件重渲染且数组 children 相等时保持展开状态', async () => {
        mockTextHeight(2);
        const ellipsis = { expandable: true, expandText: 'EX', collapsible: true, collapseText: 'CO' };
        const renderParagraph = (tail) => (
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={ellipsis}>
                {LETTERS}
                {tail}
            </Paragraph>
        );
        const { container, rerender } = render(renderParagraph('xyz'));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        await userEvent.click(screen.getByRole('button', { name: 'EX' }));
        expect(root(container)).toHaveTextContent(/CO$/);

        rerender(renderParagraph('xyz'));
        await sleep(50);
        expect(root(container)).toHaveTextContent(new RegExp(`^${LETTERS}xyzCO$`));

        rerender(renderParagraph('XYZ'));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
    });

    it('挂载后容器尺寸变化会重新测量 JS 截断', async () => {
        const height = mockTextHeight(2);
        const report = captureResizeObserver();
        const { container } = render(
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={{ expandable: true, expandText: 'EX' }}>
                {LETTERS}
            </Paragraph>
        );
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        await sleep(20);
        height.factor = 4;
        act(() => report([{ target: root(container), contentRect: { width: 50, height: 20 } }]));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcd\.\.\.EX$/));
    });

    it('监听根元素及其父元素，Tooltip 开始包裹后同样生效', async () => {
        mockSingleRowOverflow(200);
        const observers = [];
        vi.stubGlobal(
            'ResizeObserver',
            class {
                callback: ResizeObserverCallback;
                targets: Element[];
                constructor(callback: ResizeObserverCallback) {
                    this.callback = callback;
                    this.targets = [];
                    observers.push(this);
                }
                observe(target) {
                    this.targets.push(target);
                }
                unobserve(target) {
                    this.targets = this.targets.filter((item) => item !== target);
                }
                disconnect() {
                    this.targets = [];
                }
            }
        );
        const { container } = render(
            <section data-testid="parent">
                <Text style={{ width: 100 }} ellipsis={{ showTooltip: true }}>
                    overflowing text
                </Text>
            </section>
        );
        const before = root(container);
        await waitFor(() => expect(root(container)).toHaveAttribute('tabindex', '0'));
        expect(root(container)).toBe(before);

        expect(observers.map((observer) => observer.targets)).toContainEqual([root(container), screen.getByTestId('parent')]);
    });

    it('showTooltip 的提示随溢出状态开关，根元素与 ref 保持同一个节点', async () => {
        const width = mockSingleRowOverflow(10);
        const ref = createRef<HTMLElement>();
        render(
            <Text ref={ref} style={{ width: 100 }} ellipsis={{ showTooltip: true }}>
                overflowing text
            </Text>
        );
        const before = ref.current;
        await sleep(50);
        expect(before).not.toHaveAttribute('tabindex');
        width.textWidth = 200;
        fireEvent.mouseEnter(screen.getByText('overflowing text'));
        await waitFor(() => expect(before).toHaveAttribute('tabindex', '0'));
        expect(ref.current).toBe(before);
        await userEvent.hover(before);
        await waitFor(() => expect(document.querySelector('.semi-tooltip-content')).toHaveTextContent('overflowing text'));
    });

    it('省略且 showTooltip 的文字位于 activedescendant 条目内时不注入 tabIndex，提示仍可悬停显示', async () => {
        mockSingleRowOverflow(200);
        // the option of a listbox that keeps DOM focus and points at its options with aria-activedescendant
        const option = document.createElement('div');
        option.setAttribute('role', 'option');
        document.body.append(option);
        const { container } = render(
            <Text style={{ width: 100 }} ellipsis={{ showTooltip: true }}>
                option text
            </Text>,
            { container: option }
        );
        await sleep(50);
        await userEvent.hover(root(container));
        await waitFor(() => expect(document.querySelector('.semi-tooltip-content')).toHaveTextContent('option text'));
        expect(root(container)).not.toHaveAttribute('tabindex');
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
        const { container } = render(
            <Text style={{ width: 100 }} ellipsis={{ showTooltip: true }}>
                host text
            </Text>,
            { container: host }
        );
        await sleep(50);
        await userEvent.hover(root(container));
        await waitFor(() => expect(document.querySelector('.semi-tooltip-content')).toHaveTextContent('host text'));
        expect(root(container)).not.toHaveAttribute('tabindex');
    });

    it('省略且 showTooltip 的文字不在组合控件条目内时注入 tabIndex', async () => {
        mockSingleRowOverflow(200);
        const { container } = render(
            <Text style={{ width: 100 }} ellipsis={{ showTooltip: true }}>
                plain text
            </Text>
        );
        await waitFor(() => expect(root(container)).toHaveAttribute('tabindex', '0'));
    });

    it('省略且 showTooltip 的文字位于带对勾的 Dropdown.Item 内时不成为独立的 Tab 停靠点', async () => {
        mockSingleRowOverflow(200);
        render(
            <Dropdown.Item active showTick>
                <Text style={{ width: 100 }} ellipsis={{ showTooltip: true }}>
                    checked text
                </Text>
            </Dropdown.Item>
        );
        const item = screen.getByRole('menuitemcheckbox');
        await sleep(50);
        await userEvent.hover(root(item));
        await waitFor(() => expect(document.querySelector('.semi-tooltip-content')).toHaveTextContent('checked text'));
        expect(root(item)).not.toHaveAttribute('tabindex');
    });

    it('JS 省略号配合 showTooltip 时，仅在截断时显示提示', async () => {
        mockTextHeight(2);
        const renderTooltip = (_children, node) => <b data-testid="tip">{node}</b>;
        const { unmount } = render(
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={{ suffix: '!', showTooltip: { renderTooltip } }}>
                {LETTERS}
            </Paragraph>
        );
        await waitFor(() => expect(screen.getByTestId('tip')).toHaveTextContent(/^abcdefghijklmno\.\.\.!$/));
        unmount();

        render(
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={{ suffix: '!', showTooltip: { renderTooltip } }}>
                short
            </Paragraph>
        );
        expect(screen.getByTestId('tip')).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByTestId('tip')).toBeNull());
        expect(screen.getByText('short!').closest(`.${prefixCls}`)).toHaveTextContent(/^short!$/);
    });

    it('省略号在无 children 时不渲染也不测量', async () => {
        const { container } = render(
            <>
                <Text ellipsis={{ rows: 3, pos: 'middle', expandable: true }} />
                <Text ellipsis />
            </>
        );
        await sleep(50);
        expect(container.querySelectorAll(`.${prefixCls}-ellipsis`)).toHaveLength(2);
        expect(container.querySelector(`.${prefixCls}-ellipsis-expand`)).toBeNull();
    });

    it('copyable 复制配置的内容，并显示自定义成功提示与复制提示', async () => {
        const { container } = render(<Text copyable={{ content: 'configured', successTip: 'done', copyTip: 'press' }}>children</Text>);
        expect(container.querySelector<HTMLElement>(`.${prefixCls}-action-copy`).style.marginLeft).toBe('');
        await userEvent.hover(container.querySelector('.semi-icon-copy'));
        await waitFor(() => expect(document.querySelector('.semi-tooltip-content')).toHaveTextContent('press'));
        await userEvent.click(container.querySelector('.semi-icon-copy'));
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('configured');
        await waitFor(() => expect(container.querySelector(`.${prefixCls}-action-copied`)).toHaveTextContent(/^done$/));
    });

    it('copyable 自定义图标位于复制按钮内', async () => {
        const { container } = render(<Text copyable={{ icon: <IconSetting /> }}>gear</Text>);
        const button = screen.getByRole('button', { name: zh_CN.Typography.copy });
        expect(button).toContainElement(container.querySelector('.semi-icon-setting'));
        await userEvent.click(button);
        await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith('gear'));
        await waitFor(() => expect(container.querySelector(`.${prefixCls}-action-copied`)).toHaveTextContent('复制成功'));
    });

    it('copyable 的非元素图标原样显示，按钮以语言包文案命名', () => {
        render(<Text copyable={{ icon: '复制' }}>text</Text>);
        const button = screen.getByRole('button', { name: zh_CN.Typography.copy });
        expect(button).toHaveAttribute('aria-label', zh_CN.Typography.copy);
        expect(button).toHaveTextContent(/^复制$/);
        expect(button.querySelector('.semi-icon-copy')).toBeNull();
    });

    it('copyable 卸载时清除已复制计时器', async () => {
        vi.useFakeTimers();
        const renderCopy = (copied, doCopy) => <button onClick={doCopy}>{copied ? 'copied' : 'copy'}</button>;
        const { unmount } = render(<Paragraph copyable={{ render: renderCopy }}>Semi</Paragraph>);
        await act(async () => fireEvent.click(screen.getByRole('button')));
        expect(screen.getByRole('button')).toHaveTextContent('copied');
        expect(vi.getTimerCount()).toBe(1);
        unmount();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('StrictMode 下正常工作', async () => {
        mockTextHeight(2);
        const onCopy = vi.fn<CopyHandler>();
        const { container } = render(
            <StrictMode>
                <Paragraph
                    style={{ lineHeight: '20px' }}
                    copyable={{
                        onCopy,
                        render: (copied, doCopy) => (
                            <button className="copy" onClick={doCopy}>
                                {String(copied)}
                            </button>
                        ),
                    }}
                    ellipsis={{ expandable: true, expandText: 'EX', collapsible: true, collapseText: 'CO' }}
                >
                    {LETTERS}
                </Paragraph>
            </StrictMode>
        );
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghi\.\.\.EXfalse$/));
        await userEvent.click(screen.getByRole('button', { name: 'EX' }));
        expect(root(container)).toHaveTextContent(new RegExp(`^${LETTERS}COfalse$`));
        await userEvent.click(container.querySelector('.copy'));
        await waitFor(() => expect(container.querySelector('.copy')).toHaveTextContent('true'));
        expect(onCopy).toHaveBeenCalledTimes(1);
    });

    it('Numeral 截断不受二进制浮点误差影响', () => {
        // 0.58 * 100 is 57.99999999999999, 0.07 * 100 is 7.000000000000001 and 1.005 * 100 is 100.49999999999999
        const cases: [NumeralProps, string, string][] = [
            [{ rule: 'text', precision: 2, truncate: 'floor' }, '0.58', '0.58'],
            [{ rule: 'text', precision: 2, truncate: 'ceil' }, '0.07', '0.07'],
            [{ rule: 'text', precision: 2, truncate: 'round' }, '1.005', '1.01'],
            [{ rule: 'percentages', truncate: 'floor' }, '0.58', '58%'],
            [{ rule: 'percentages', truncate: 'ceil' }, '0.07', '7%'],
            [{ rule: 'text', precision: 2 }, '1e-7', '0.00'],
            [{ rule: 'text', precision: 1, truncate: 'ceil' }, '1.1e3', '1100.0'],
        ];
        cases.forEach(([props, input, output]) => {
            const { container, unmount } = render(<Numeral {...props}>{input}</Numeral>);
            expect(root(container)).toHaveTextContent(new RegExp(`^${RegExp.escape(output)}$`));
            unmount();
        });
    });

    it('Numeral 规则', () => {
        const cases: [NumeralProps, string, string][] = [
            [{ rule: 'text', precision: 2 }, 'a 1.234 b -2', 'a 1.23 b -2.00'],
            [{ rule: 'numbers', precision: 1, truncate: 'floor' }, 'x 1.99 y 2', '1.9,2.0'],
            [{ rule: 'bytes-decimal', precision: 1 }, '1500', '1.5 KB'],
            [{ rule: 'bytes-binary' }, '2048 and 1048576', '2 KiB and 1 MiB'],
            [{ rule: 'percentages', precision: 1 }, '0.256', '25.6%'],
            [{ rule: 'exponential', precision: 1, truncate: 'ceil' }, '12345', '1.3e+4'],
            [{ parser: (value) => `<${value}>` }, 'raw 1.5', '<raw 1.5>'],
        ];
        cases.forEach(([props, input, output]) => {
            const { container, unmount } = render(<Numeral {...props}>{input}</Numeral>);
            expect(root(container).tagName).toBe('SPAN');
            expect(root(container)).toHaveTextContent(new RegExp(`^${RegExp.escape(output)}$`));
            unmount();
        });
    });

    it('Numeral exponential 只舍入一次，进位后尾数规范化', () => {
        const cases: [NumeralProps, string, string][] = [
            [{ rule: 'exponential', precision: 1, truncate: 'floor' }, '1.99999', '1.9e+0'],
            [{ rule: 'exponential', precision: 0, truncate: 'floor' }, '19999', '1e+4'],
            [{ rule: 'exponential', precision: 1, truncate: 'ceil' }, '9.99', '1.0e+1'],
            [{ rule: 'exponential', precision: 0, truncate: 'round' }, '1.4996', '1e+0'],
            [{ rule: 'exponential', precision: 1, truncate: 'floor' }, '-9.99', '-1.0e+1'],
            [{ rule: 'exponential', precision: 1, truncate: 'round' }, '0.00123', '1.2e-3'],
        ];
        cases.forEach(([props, input, output]) => {
            const { container, unmount } = render(<Numeral {...props}>{input}</Numeral>);
            expect(root(container)).toHaveTextContent(new RegExp(`^${RegExp.escape(output)}$`));
            unmount();
        });
    });

    it('Numeral 保留不贴着数字的 - 和 . 字符', () => {
        const cases: [NumeralProps, string, string][] = [
            [{ rule: 'text', precision: 0 }, 'Total: 3 items.', 'Total: 3 items.'],
            [{ rule: 'text', precision: 0 }, 'a - b', 'a - b'],
            [{ rule: 'percentages' }, '0.5.', '50%.'],
            [{ rule: 'numbers', precision: 0 }, '1. 2 - 3', '1,2,3'],
        ];
        cases.forEach(([props, input, output]) => {
            const { container, unmount } = render(<Numeral {...props}>{input}</Numeral>);
            expect(root(container)).toHaveTextContent(new RegExp(`^${RegExp.escape(output)}$`));
            unmount();
        });
    });

    it('disabled 的 link 不触发 onClick，也不把 href 写到 span', async () => {
        const onClick = vi.fn<() => void>();
        const { container } = render(
            <Text disabled link={{ href: '#target', target: '_blank', onClick, className: 'extra' }}>
                L
            </Text>
        );
        const span = root(container).querySelector(':scope > span.extra');
        expect(span).toBeInTheDocument();
        expect(span).not.toHaveAttribute('href');
        expect(span).not.toHaveAttribute('target');
        await userEvent.click(screen.getByText('L'));
        expect(onClick).not.toHaveBeenCalled();
    });

    it('条件渲染的 false、null 不会被复制成字面文本', async () => {
        const done: boolean = false;
        const { container, rerender } = render(
            <Text copyable>
                Bob
                {done && '!'}
                {null}
            </Text>
        );
        await userEvent.click(container.querySelector('.semi-icon-copy'));
        expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith('Bob');

        rerender(<Text copyable />);
        await userEvent.click(container.querySelector('.semi-icon-copy'));
        expect(navigator.clipboard.writeText).not.toHaveBeenCalledWith('null');
    });

    it('JS 截断的文本不含条件渲染的 false', async () => {
        mockTextHeight(2);
        const done: boolean = false;
        const { container } = render(
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={{ expandable: true, expandText: 'EX' }}>
                ab
                {done && '!'}
                {LETTERS.slice(2)}
            </Paragraph>
        );
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        expect(root(container)).not.toHaveTextContent('false');
    });

    it('先能放下的文本在容器变窄后截断时，按展开按钮的宽度预留', async () => {
        const height = mockTextHeight(1);
        const report = captureResizeObserver();
        const { container } = render(
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={{ expandable: true, expandText: 'EX' }}>
                {LETTERS}
            </Paragraph>
        );
        await waitFor(() => expect(root(container)).toHaveTextContent(new RegExp(`^${LETTERS}$`)));
        expect(container.querySelector(`.${prefixCls}-ellipsis-expand`)).toBeNull();
        await sleep(20);
        height.factor = 2;
        act(() => report([{ target: root(container), contentRect: { width: 50, height: 20 } }]));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
    });
});

describe('Typography 类型', () => {
    it('CopyableConfig 含可选的 duration、className 与 style', () => {
        expectTypeOf<CopyableConfig['duration']>().toEqualTypeOf<number | undefined>();
        expectTypeOf<CopyableConfig['className']>().toEqualTypeOf<string | undefined>();
        expectTypeOf<CopyableConfig['style']>().toEqualTypeOf<CSSProperties | undefined>();
        expectTypeOf<{ duration: number }>().toExtend<CopyableConfig>();
    });
});

describe('Typography 函数组件', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    const root = (container) => container.querySelector(`.${prefixCls}`);

    it('ref 指向根元素', () => {
        const textRef = createRef<HTMLSpanElement>();
        const titleRef = createRef<HTMLHeadingElement>();
        const paragraphRef = createRef<HTMLParagraphElement>();
        const numeralRef = createRef<HTMLSpanElement>();
        const typographyRef = createRef<HTMLElement>();
        const refs = [textRef, titleRef, paragraphRef, numeralRef, typographyRef];
        const { container } = render(
            <div>
                <Text ref={textRef}>a</Text>
                <Title ref={titleRef}>b</Title>
                <Paragraph ref={paragraphRef}>c</Paragraph>
                <Numeral ref={numeralRef}>1</Numeral>
                <Typography ref={typographyRef}>d</Typography>
            </div>
        );
        expect(refs.map((ref) => ref.current)).toEqual([...container.querySelectorAll(`.${prefixCls}`)]);
    });

    it('Numeral 保留精度，且 truncate 不写入 DOM', () => {
        const { container } = render(
            <Numeral precision={2} truncate="ceil">
                1.111
            </Numeral>
        );
        expect(root(container)).toHaveTextContent(/^1\.12$/);
        expect(root(container)).not.toHaveAttribute('precision');
        expect(root(container)).not.toHaveAttribute('truncate');
    });

    it('Numeral 格式化嵌套数组并跳过 null children', () => {
        const { container } = render(<Numeral precision={1}>{[1, null, [2, ['x', 3]]]}</Numeral>);
        expect(root(container)).toHaveTextContent(/^1\.02\.0x3\.0$/);
    });

    it('Numeral 的 children 混有文字和元素时，格式化后不产生缺少 key 的警告', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { container } = render(
            <Numeral precision={1}>
                Stars <b>1</b>
                <p>
                    Fork <b>2</b>
                </p>
            </Numeral>
        );
        expect(root(container)).toHaveTextContent(/^Stars 1\.0Fork 2\.0$/);
        expect(error).not.toHaveBeenCalled();
    });

    it('省略号配置变化后重新测量截断', async () => {
        mockTextHeight(2);
        const { container, rerender } = render(
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={{ expandable: true, expandText: 'EX' }}>
                {LETTERS}
            </Paragraph>
        );
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        rerender(
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={{ expandable: true, expandText: 'EX', suffix: 'SUFFIX' }}>
                {LETTERS}
            </Paragraph>
        );
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefgh\.\.\.SUFFIXEX$/));
    });
});

describe('Typography Tab 焦点停靠', () => {
    it('copyable 复制按钮是唯一的 Tab 停靠点，其 Tooltip 描述了该按钮', async () => {
        render(<Text copyable={{ copyTip: 'Copy the text' }}>Semi Design</Text>);
        await userEvent.tab();
        const button = document.activeElement;
        expect(button.tagName).toBe('BUTTON');
        await waitFor(() => expect(button).toHaveAccessibleDescription('Copy the text'));
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });
});

describe('Typography 批 3 修复', () => {
    beforeEach(() => {
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: vi.fn<(data: string) => Promise<void>>().mockResolvedValue(undefined) },
            configurable: true,
        });
    });

    it('copyable.content 显式为 undefined 时回落到文本', async () => {
        render(<Text copyable={{ content: undefined }}>abc</Text>);
        await userEvent.click(screen.getByRole('button', { name: '复制' }));
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('abc');
    });

    it('link 无 href 且有点击监听时可聚焦、有 link 角色，Enter 触发点击', async () => {
        const onClick = vi.fn<() => void>();
        render(
            <Text link onClick={onClick}>
                x
            </Text>
        );
        await userEvent.tab();
        expect(screen.getByRole('link', { name: 'x' })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('link 无 href 且无点击监听时不是 link', () => {
        render(<Text link>x</Text>);
        expect(screen.queryByRole('link')).toBeNull();
    });

    it('不可收起的展开按钮激活后焦点移到文字根元素', async () => {
        mockTextHeight(2);
        const { container } = render(
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={{ expandable: true, expandText: 'EX' }}>
                {LETTERS}
            </Paragraph>
        );
        await waitFor(() => expect(screen.getByRole('button', { name: 'EX' })).toBeTruthy());
        act(() => {
            screen.getByRole('button', { name: 'EX' }).focus();
        });
        await userEvent.keyboard('{Enter}');
        expect(document.activeElement).toBe(container.querySelector(`.${prefixCls}`));
    });

    it('展开、收起按钮带 aria-expanded', async () => {
        mockTextHeight(2);
        render(
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={{ expandable: true, collapsible: true }}>
                {LETTERS}
            </Paragraph>
        );
        const expand = await screen.findByRole('button', { name: '展开' });
        expect(expand).toHaveAttribute('aria-expanded', 'false');
        await userEvent.click(expand);
        expect(screen.getByRole('button', { name: '收起' })).toHaveAttribute('aria-expanded', 'true');
    });

    it('popover 分支在组合控件条目内不注入 tabIndex', async () => {
        mockSingleRowOverflow(200);
        const option = document.createElement('div');
        option.setAttribute('role', 'option');
        document.body.append(option);
        const { container } = render(
            <Text style={{ width: 100 }} ellipsis={{ showTooltip: { type: 'popover' } }}>
                option text
            </Text>,
            { container: option }
        );
        await sleep(50);
        expect(container.querySelector(`.${prefixCls}`)).not.toHaveAttribute('tabindex');
    });

    it('condition 为 false 时不可聚焦', async () => {
        mockSingleRowOverflow(200);
        const { container } = render(
            <Text style={{ width: 100 }} ellipsis={{ showTooltip: { opts: { condition: false } } }}>
                plain text
            </Text>
        );
        await sleep(50);
        expect(container.querySelector(`.${prefixCls}`)).not.toHaveAttribute('tabindex');
    });
});

describe('Typography 省略与装饰的边界', () => {
    beforeEach(() => {
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: vi.fn<(data: string) => Promise<void>>().mockResolvedValue(undefined) },
            configurable: true,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        semiGlobal.config.overrideDefaultProps = {};
    });

    const root = (container: HTMLElement) => container.querySelector<HTMLElement>(`.${prefixCls}`);

    it('展开期间容器变窄，收起后按新宽度重新截断', async () => {
        const height = mockTextHeight(2);
        const report = captureResizeObserver();
        const { container } = render(
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={{ expandable: true, collapsible: true, expandText: 'EX', collapseText: 'CO' }}>
                {LETTERS}
            </Paragraph>
        );
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        await sleep(20);
        await userEvent.click(screen.getByRole('button', { name: 'EX' }));
        expect(root(container)).toHaveTextContent(new RegExp(`^${LETTERS}CO$`));
        height.factor = 4;
        act(() => report([{ target: root(container), contentRect: { width: 50, height: 20 } }]));
        // the measurement frame of this report runs while the text is expanded
        await sleep(50);
        await userEvent.click(screen.getByRole('button', { name: 'CO' }));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcd\.\.\.EX$/));
    });

    it('展开后改为可用 CSS 省略的配置，回到收起状态并用 CSS 省略', async () => {
        mockTextHeight(2);
        const { container, rerender } = render(
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={{ expandable: true, collapsible: true }}>
                {LETTERS}
            </Paragraph>
        );
        await userEvent.click(await screen.findByRole('button', { name: '展开' }));
        rerender(
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={{ rows: 1 }}>
                {LETTERS}
            </Paragraph>
        );
        await waitFor(() => expect(root(container)).toHaveClass(`${prefixCls}-ellipsis-overflow-ellipsis`));
    });

    it('显式 expandText、collapseText 为 undefined 时回落到语言包文案', async () => {
        mockTextHeight(2);
        render(
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={{ expandable: true, collapsible: true, expandText: undefined, collapseText: undefined }}>
                {LETTERS}
            </Paragraph>
        );
        await userEvent.click(await screen.findByRole('button', { name: zh_CN.Typography.expand }));
        expect(screen.getByRole('button', { name: zh_CN.Typography.collapse })).toBeInTheDocument();
    });

    it('显式 suffix、rows 为 undefined 时取默认值，走 CSS 单行截断', async () => {
        const { container } = render(<Paragraph ellipsis={{ suffix: undefined, rows: undefined }}>{LETTERS}</Paragraph>);
        await waitFor(() => expect(root(container)).toHaveClass(`${prefixCls}-ellipsis-overflow-ellipsis`));
    });

    it('只设 expandText 不可展开时，按钮不带 aria-expanded', async () => {
        mockTextHeight(2);
        render(
            <Paragraph style={{ lineHeight: '20px' }} ellipsis={{ expandText: 'EX' }}>
                {LETTERS}
            </Paragraph>
        );
        const button = await screen.findByRole('button', { name: 'EX' });
        expect(button).not.toHaveAttribute('aria-expanded');
    });

    it('link 对象的 onKeyDown 与内置的 Enter 激活同时生效', async () => {
        const onKeyDown = vi.fn<(e: unknown) => void>();
        const onClick = vi.fn<() => void>();
        render(<Text link={{ onKeyDown, onClick }}>x</Text>);
        await userEvent.tab();
        await userEvent.keyboard('{Enter}');
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('link 对象的 onKeyDown 调用 preventDefault 后不再触发内置的 Enter 激活', async () => {
        const onClick = vi.fn<() => void>();
        render(<Text link={{ onKeyDown: (e) => e.preventDefault(), onClick }}>x</Text>);
        await userEvent.tab();
        await userEvent.keyboard('{Enter}');
        expect(onClick).not.toHaveBeenCalled();
    });

    it('显式 component 为 undefined 时仍渲染各自的内置标签', () => {
        const { container } = render(
            <>
                <Text component={undefined}>t</Text>
                <Title component={undefined}>h</Title>
                <Paragraph component={undefined}>p</Paragraph>
                <Numeral component={undefined}>1</Numeral>
            </>
        );
        expect([...container.querySelectorAll(`.${prefixCls}`)].map((el) => el.tagName)).toEqual(['SPAN', 'H1', 'P', 'SPAN']);
    });

    it('Text、Title、Paragraph、Numeral 不读取全局 Typography 默认值，裸 Typography 读取', () => {
        semiGlobal.config.overrideDefaultProps = { Typography: { tabIndex: 0 } };
        const { container } = render(
            <>
                <Typography>bare</Typography>
                <Text>t</Text>
                <Title>h</Title>
                <Paragraph>p</Paragraph>
                <Numeral>1</Numeral>
            </>
        );
        expect([...container.querySelectorAll(`.${prefixCls}`)].map((el) => el.hasAttribute('tabindex'))).toEqual([true, false, false, false, false]);
    });

    it('copyable.render 的自定义节点同样为 JS 省略预留宽度', async () => {
        mockTextHeight(2);
        const { container } = render(
            <Paragraph style={{ lineHeight: '20px' }} copyable={{ render: () => <button type="button">CCCC</button> }} ellipsis={{ rows: 1 }}>
                {LETTERS}
            </Paragraph>
        );
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijkl\.\.\.CCCC$/));
    });

    it('复制成功后按已复制提示的宽度重新截断，恢复后回到原截断', async () => {
        mockTextHeight(2);
        const { container } = render(
            <Paragraph style={{ lineHeight: '20px' }} copyable={{ duration: 0.3 }} ellipsis={{ rows: 1 }}>
                {LETTERS}
            </Paragraph>
        );
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmnop\.\.\.$/));
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Typography.copy }));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijkl\.\.\.复制成功$/));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmnop\.\.\.$/));
    });

    it('已复制期间，只有图标的 successTip 以语言包文案或其 aria-label 命名按钮', async () => {
        const { unmount } = render(<Text copyable={{ successTip: <IconSetting /> }}>Semi</Text>);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Typography.copy }));
        expect(await screen.findByRole('button', { name: zh_CN.Typography.copied })).toBeInTheDocument();
        unmount();

        render(<Text copyable={{ successTip: <IconSetting aria-label="Done" /> }}>Semi</Text>);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Typography.copy }));
        expect(await screen.findByRole('button', { name: 'Done' })).toBeInTheDocument();
    });

    it('省略加 showTooltip 的文字含 href 链接时，根元素不再成为第二个 Tab 停靠点', async () => {
        mockSingleRowOverflow(200);
        const { container } = render(
            <Text style={{ width: 100 }} ellipsis={{ showTooltip: true }} link={{ href: '#' }}>
                link text
            </Text>
        );
        await sleep(50);
        expect(root(container)).not.toHaveAttribute('tabindex');
        expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('省略加 showTooltip 的文字含可点击的 link 时，根元素不再成为第二个 Tab 停靠点', async () => {
        mockSingleRowOverflow(200);
        const { container } = render(
            <Text style={{ width: 100 }} ellipsis={{ showTooltip: true }} link onClick={() => undefined}>
                link text
            </Text>
        );
        await sleep(50);
        expect(root(container)).not.toHaveAttribute('tabindex');
    });

    it('省略加 showTooltip 的文字含 href 链接时，提示的 aria-describedby 落在链接上而不是根元素', async () => {
        mockSingleRowOverflow(200);
        const { container } = render(
            <Text style={{ width: 100 }} ellipsis={{ showTooltip: true }} link={{ href: '#' }}>
                link text
            </Text>
        );
        await sleep(50);
        await userEvent.hover(screen.getByRole('link'));
        const tip = await screen.findByRole('tooltip');
        await waitFor(() => expect(screen.getByRole('link')).toHaveAttribute('aria-describedby', tip.id));
        expect(root(container)).not.toHaveAttribute('aria-describedby');
    });

    it('省略加 showTooltip 的文字没有可聚焦的链接时，aria-describedby 仍在根元素上', async () => {
        mockSingleRowOverflow(200);
        const { container } = render(
            <Text style={{ width: 100 }} ellipsis={{ showTooltip: true }}>
                plain text
            </Text>
        );
        await sleep(50);
        await userEvent.hover(root(container));
        const tip = await screen.findByRole('tooltip');
        await waitFor(() => expect(root(container)).toHaveAttribute('aria-describedby', tip.id));
    });

    it('省略加 showTooltip 的文字含按钮但没有 link 装饰时，aria-describedby 仍在根元素上', async () => {
        mockSingleRowOverflow(200);
        const { container } = render(
            <Text style={{ width: 100 }} ellipsis={{ showTooltip: true }}>
                text <button type="button">action</button>
            </Text>
        );
        await sleep(50);
        await userEvent.hover(root(container));
        const tip = await screen.findByRole('tooltip');
        await waitFor(() => expect(root(container)).toHaveAttribute('aria-describedby', tip.id));
    });
});
