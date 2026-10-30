import { createContext, createSignal, useContext } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { escapeRegExp } from 'es-toolkit';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconSetting } from '@fibrae/semi-icons-solid';
import { mockResizeObserver, sleep } from '@test/utils/solid';
import Typography, { type Ellipsis, type NumeralProps, type TextProps, type TitleProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import Dropdown from '../../dropdown';
import type { CopyableConfig } from '../interface';

const prefixCls = 'semi-typography';
const { Text, Title, Paragraph, Numeral } = Typography;
type CopyHandler = NonNullable<CopyableConfig['onCopy']>;
type RenderTooltip = NonNullable<NonNullable<Exclude<Ellipsis['showTooltip'], boolean | undefined>>['renderTooltip']>;
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

// jsdom has no layout: the measuring container's height grows `factor` px per character; with line-height 20px a
// single row fits while scrollHeight < 40, i.e. fewer than 40 / factor characters in the container
function mockTextHeight(factor = 2) {
    const state = { factor };
    vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(function (this: Element) {
        return (this.textContent?.length ?? 0) * state.factor;
    });
    return state;
}

// a single-line text node wider than its container: CSS ellipsis reports an overflow
function mockSingleRowOverflow(textWidth = 200) {
    const state = { textWidth };
    vi.spyOn(Range.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width: state.textWidth }) as DOMRect);
    return state;
}

function must<T>(value?: T | null): T {
    if (value == null) {
        throw new Error('expected a value');
    }
    return value;
}

// spyOn returns the mock the test setup already installed; it avoids reading the method off the object unbound
const clipboardWrite = () => vi.spyOn(navigator.clipboard, 'writeText');

const root = (container: HTMLElement) => must(container.querySelector<HTMLElement>(`.${prefixCls}`));

// reports a width change of `target`, as the browser does after the container was resized
function reportWidth(observer: ReturnType<typeof mockResizeObserver>, target: Element, width: number) {
    observer.fire(target, [{ target, contentRect: { width, height: 20 } }]);
}

beforeEach(() => {
    // jsdom has no Clipboard API
    Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn<(data: string) => Promise<void>>().mockResolvedValue(undefined) },
        configurable: true,
    });
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Typography', () => {
    it('自定义组件', () => {
        const { container: titleContainer } = render(() => (
            <Typography.Title component="div" heading={1}>
                Semi Design
            </Typography.Title>
        ));
        expect(titleContainer.querySelectorAll(`div.${prefixCls}-h1`)).toHaveLength(1);

        const { container: textContainer } = render(() => (
            <Typography.Text component="div" id="text">
                Semi Design
            </Typography.Text>
        ));
        const text = textContainer.querySelectorAll(`div.${prefixCls}`);
        expect(text).toHaveLength(1);
        expect(text[0]).toHaveAttribute('id', 'text');

        const { container: paragraphContainer } = render(() => <Typography.Paragraph component="div">Semi Design</Typography.Paragraph>);
        expect(paragraphContainer.querySelectorAll(`div.${prefixCls}-paragraph`)).toHaveLength(1);
    });

    it('typography 可复制', async () => {
        const onCopy = vi.fn<CopyHandler>();
        const [copyable, setCopyable] = createSignal<CopyableConfig | boolean>({ onCopy });
        const { container } = render(() => <Typography.Paragraph copyable={copyable()}>Semi Design</Typography.Paragraph>);
        const icons = container.querySelectorAll('.semi-icon-copy');
        expect(icons).toHaveLength(1);
        await userEvent.click(icons[0]);
        await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
        expect(clipboardWrite()).toHaveBeenCalledWith('Semi Design');
        expect(onCopy.mock.calls[0].slice(1)).toEqual(['Semi Design', true]);
        expect(container.querySelectorAll(`.${prefixCls}-action-copied`)).toHaveLength(1);
        setCopyable(false);
        expect(container.querySelector('.semi-icon-copy')).toBeNull();
    });

    it('复制按钮有可访问名称，按 Enter 和 Space 可复制', async () => {
        const onCopy = vi.fn<CopyHandler>();
        const [copyable, setCopyable] = createSignal<CopyableConfig>({ duration: 0.01, onCopy });
        render(() => <Paragraph copyable={copyable()}>Semi Design</Paragraph>);
        screen.getByRole('button', { name: zh_CN.Typography.copy }).focus();
        await userEvent.keyboard(' ');
        await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(screen.getByRole('button', { name: zh_CN.Typography.copy })).toBeInTheDocument());
        screen.getByRole('button', { name: zh_CN.Typography.copy }).focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(2));

        setCopyable({ copyTip: 'Copy code' });
        expect(await screen.findByRole('button', { name: 'Copy code' })).toBeInTheDocument();
        setCopyable({ icon: () => <IconSetting aria-label="Gear" /> });
        expect(screen.getByRole('button', { name: zh_CN.Typography.copy })).toBeInTheDocument();
        setCopyable({ copyTip: () => <span>Copy code</span> });
        expect(screen.getByRole('button', { name: zh_CN.Typography.copy })).toBeInTheDocument();
    });

    it.each([
        ['default icon', undefined],
        ['custom icon', () => <IconSetting />],
    ])('%s 按钮在已复制状态下保持焦点，且仅在未复制时才复制', async (_, icon) => {
        const onCopy = vi.fn<CopyHandler>();
        render(() => <Paragraph copyable={{ duration: 0.2, icon, onCopy }}>Semi Design</Paragraph>);
        const button = screen.getByRole('button', { name: zh_CN.Typography.copy });
        button.focus();
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
        render(() => (
            <>
                <button>other</button>
                <Paragraph copyable={{ duration: 0.05 }}>Semi Design</Paragraph>
            </>
        ));
        screen.getByRole('button', { name: 'other' }).focus();
        fireEvent.click(screen.getByRole('button', { name: zh_CN.Typography.copy }));
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-action-copied`)).toBeInTheDocument());
        expect(screen.getByRole('button', { name: 'other' })).toHaveFocus();
    });

    it('typography 可复制时，剪贴板写入被拒绝会报错且保持未复制状态', async () => {
        clipboardWrite().mockRejectedValue(new Error('NotAllowedError'));
        const onCopy = vi.fn<CopyHandler>();
        const { container } = render(() => <Typography.Paragraph copyable={{ onCopy }}>Semi Design</Typography.Paragraph>);
        await userEvent.click(must(container.querySelector('.semi-icon-copy')));
        await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
        expect(onCopy.mock.calls[0].slice(1)).toEqual(['Semi Design', false]);
        expect(container.querySelector(`.${prefixCls}-action-copied`)).toBeNull();
    });

    it('typography 可复制时，重复复制会重新计时已复制状态', async () => {
        vi.useFakeTimers();
        render(() => <Typography.Paragraph copyable={{ duration: 3, render: (copied, doCopy) => <button onClick={doCopy}>{copied ? 'copied' : 'copy'}</button> }}>Semi Design</Typography.Paragraph>);
        // render runs again when copied changes, so the button is looked up each time
        fireEvent.click(screen.getByRole('button'));
        await vi.advanceTimersByTimeAsync(2000);
        fireEvent.click(screen.getByRole('button'));
        await vi.advanceTimersByTimeAsync(2000);
        expect(screen.getByRole('button')).toHaveTextContent('copied');
        await vi.advanceTimersByTimeAsync(1000);
        expect(screen.getByRole('button')).toHaveTextContent('copy');
    });

    it('typography link 用法', () => {
        const [props, setProps] = createSignal<{ disabled?: boolean; link: boolean | { href: string }; underline?: boolean }>({ link: { href: 'https://semi.design/' } });
        const { container } = render(() => <Typography.Text {...props()}>链接文本</Typography.Text>);
        expect(container.querySelectorAll(`.${prefixCls}.${prefixCls}-link`)).toHaveLength(1);
        expect(screen.getByRole('link', { name: '链接文本' })).toHaveAttribute('href', 'https://semi.design/');
        setProps({ disabled: true, link: { href: 'https://semi.design/' } });
        expect(container.querySelectorAll(`.${prefixCls}.${prefixCls}-disabled`)).toHaveLength(1);
        setProps({ disabled: true, link: false, underline: true });
        expect(container.querySelectorAll(`.${prefixCls} u`)).toHaveLength(1);
    });

    it('typography 省略号用法', () => {
        const [text, setText] = createSignal('是一个很长很长很长很长5号标题');
        const [ellipsis, setEllipsis] = createSignal<Ellipsis>({ showTooltip: true });
        const { container } = render(() => (
            <Typography.Paragraph style={{ width: '250px' }} ellipsis={ellipsis()}>
                {text()}
            </Typography.Paragraph>
        ));
        const getParagraph = () => container.querySelector(`.${prefixCls}-paragraph`);
        // jsdom has no layout, so only the ellipsis strategy (css single line by default) is observable
        expect(getParagraph()).toHaveClass(`${prefixCls}-ellipsis`, `${prefixCls}-ellipsis-single-line`);
        expect(getParagraph()).toHaveClass(`${prefixCls}-ellipsis-overflow-ellipsis`);
        expect(getParagraph()).toHaveTextContent(/^是一个很长很长很长很长5号标题$/);

        setText('的撒的撒打算的撒的撒的撒打算打的撒的撒打算的撒的撒的撒打算打');
        expect(getParagraph()).toHaveClass(`${prefixCls}-ellipsis-overflow-ellipsis`);
        expect(getParagraph()).toHaveTextContent(/^的撒的撒打算的撒的撒的撒打算打的撒的撒打算的撒的撒的撒打算打$/);

        setEllipsis({ expandText: 'expandText', collapseText: 'collapseText', rows: 1, showTooltip: { type: 'popover' }, suffix: 'suffix' });
        expect(getParagraph()).toHaveClass(`${prefixCls}-ellipsis`, `${prefixCls}-ellipsis-single-line`);
        expect(getParagraph()).not.toHaveClass(`${prefixCls}-ellipsis-overflow-ellipsis`);
    });

    it('typography JS 省略号截断', async () => {
        // jsdom has no layout: the measuring container height is 2px per character with line-height 20px,
        // so a single row (limit round(20 * 2) = 40px) holds at most 19 characters
        mockTextHeight(2);
        const text = 'abcdefghijklmnopqrstuvwxyz';
        const style = { 'line-height': '20px' };

        const { container, unmount } = render(() => (
            <Typography.Paragraph style={style} ellipsis={{ suffix: 'SF', expandable: true, expandText: 'EX', collapsible: true, collapseText: 'CO' }}>
                {text}
            </Typography.Paragraph>
        ));
        const paragraph = container.querySelector(`.${prefixCls}-paragraph`);
        await waitFor(() => expect(paragraph).toHaveTextContent(/^abcdefghijkl\.\.\.SFEX$/));
        await userEvent.click(screen.getByRole('button', { name: 'EX' }));
        expect(paragraph).toHaveTextContent(new RegExp(`^${text}SFCO$`));
        await userEvent.click(screen.getByRole('button', { name: 'CO' }));
        expect(paragraph).toHaveTextContent(/^abcdefghijkl\.\.\.SFEX$/);
        unmount();

        const { container: middleContainer, unmount: unmountMiddle } = render(() => (
            <Typography.Paragraph style={style} ellipsis={{ pos: 'middle' }}>
                {text}
            </Typography.Paragraph>
        ));
        const middle = middleContainer.querySelector(`.${prefixCls}-paragraph`);
        await waitFor(() => expect(middle).toHaveTextContent(/^abcdefgh\.\.\.stuvwxyz$/));
        unmountMiddle();

        const { container: rowsContainer } = render(() => (
            <Typography.Text style={style} ellipsis={{ rows: 2, suffix: 'SF' }} strong>
                {text + text}
            </Typography.Text>
        ));
        const rowsText = rowsContainer.querySelector(`.${prefixCls}`);
        expect(rowsText).toHaveClass(`${prefixCls}-ellipsis-multiple-line`);
        await waitFor(() => expect(rowsText).toHaveTextContent(/^abcdefghijklmnopqrstuvwx\.\.\.SF$/));
    });

    it('isSingleRowOverflowing 亚像素与 border 语义（回归 #2350/#3340）', async () => {
        // jsdom has no layout: the container rect, the text Range rect and the container padding/border are mocked,
        // and the single-row overflow verdict is observed through showTooltip.renderTooltip (rendered only on overflow)
        const originalGetComputedStyle = window.getComputedStyle;

        const setup = ({ containerWidth, textWidth, padding, border }: { containerWidth: number; textWidth: number; padding: string; border: string }) => {
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

        const getRowOverflow = async (containerRect: ReturnType<typeof setup>) => {
            const { unmount } = render(() => <Typography.Text ellipsis={{ showTooltip: { renderTooltip: (_children, node) => <b data-testid="tip">{node}</b> } }}>test</Typography.Text>);
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
        const { container, unmount } = render(() => (
            <Typography.Numeral precision={2} rule="numbers" truncate="ceil">
                预期价格:1.555; 成本: -1; 盈利: 0.555
            </Typography.Numeral>
        ));
        expect(root(container)).toHaveTextContent(/^1\.56,-1\.00,0\.56$/);
        unmount();

        const [parser, setParser] = createSignal<((value: string) => string) | undefined>();
        const { container: container2 } = render(() => (
            <Typography.Numeral parser={parser()} precision={2} rule="exponential" truncate="floor">
                Total revenue: $ 1992.15
            </Typography.Numeral>
        ));
        expect(root(container2)).toHaveTextContent(/^Total revenue: \$ 1\.99e\+3$/);
        setParser(() => (oldVal: string) => oldVal.replace(/[^\d.]/g, ''));
        expect(root(container2)).toHaveTextContent(/^1992\.15$/);
    });

    it('Numeral 把插值产生的每个 children 分别格式化，与 React 的每个字符串 children 一致', () => {
        const price = () => 1.555;
        const { container } = render(() => (
            <Typography.Numeral precision={2} rule="numbers" truncate="ceil">
                预期价格:{price()}; 成本: -1; 盈利: 0.555
            </Typography.Numeral>
        ));
        expect(root(container)).toHaveTextContent(/^1\.56-1\.00,0\.56$/);
    });

    it('Numeral 原样输出子组件渲染出的元素', () => {
        const Ctx = createContext('ctx 1.234');
        function Consumer() {
            return <i>{useContext(Ctx)}</i>;
        }
        const { container } = render(() => (
            <Numeral precision={1}>
                <Consumer />
                2.345
            </Numeral>
        ));
        expect(container.querySelector(`.${prefixCls} > i`)).toHaveTextContent(/^ctx 1\.234$/);
        expect(container.querySelector(`.${prefixCls}`)).toHaveTextContent(/^ctx 1\.2342\.3$/);
    });

    it('children 为模板字符串', () => {
        const code = 'code';

        const { container } = render(() => (
            <Text style={{ 'margin-top': '6px', color: 'var(--semi-color-text-2)' }} copyable={{ content: code }} ellipsis={{ showTooltip: { opts: { style: { 'word-break': 'break-word' } } } }}>
                Key: {code}
            </Text>
        ));
        expect(must(must(container.querySelector(`.${prefixCls}`)).firstChild).textContent).toEqual('Key: code');
    });

    it('自定义复制渲染', async () => {
        const code = 'code';

        const { container } = render(() => (
            <Text
                style={{ 'margin-top': '6px', color: 'var(--semi-color-text-2)' }}
                copyable={{
                    content: code,
                    render: (copied, doCopy, config) => (
                        <button class="test-copy-button" onClick={doCopy}>
                            <span class="test-copied">{String(copied)}</span>
                            <span class="test-copy-content">{config.content}</span>
                        </button>
                    ),
                }}
                ellipsis={{ showTooltip: { opts: { style: { 'word-break': 'break-word' } } } }}
            >
                Key: {code}
            </Text>
        ));

        expect(container.querySelector('.test-copied')).toHaveTextContent(/^false$/);
        expect(container.querySelector('.test-copy-content')).toHaveTextContent(new RegExp(`^${code}$`));

        const triggers = container.querySelectorAll('.test-copy-button');
        expect(triggers).toHaveLength(1);
        await userEvent.click(triggers[0]);
        await waitFor(() => expect(container.querySelector('.test-copied')).toHaveTextContent(/^true$/));
    });
});

describe('Typography 行为基线', () => {
    it('非 link 时的 type、size、spacing 与装饰标签', () => {
        const { container } = render(() => (
            <Text type="danger" code delete mark size="small" strong underline>
                T
            </Text>
        ));
        expect(root(container).tagName).toBe('SPAN');
        expect(root(container)).toHaveClass(`${prefixCls}-danger`, `${prefixCls}-small`, `${prefixCls}-normal`);
        expect(root(container).querySelector(':scope > del > strong > u > code > mark')).toHaveTextContent(/^T$/);

        const { container: paragraph } = render(() => <Paragraph spacing="extended">P</Paragraph>);
        expect(root(paragraph).tagName).toBe('P');
        expect(root(paragraph)).toHaveClass(`${prefixCls}-paragraph`, `${prefixCls}-primary`, `${prefixCls}-normal`, `${prefixCls}-extended`);
        expect(root(paragraph).children).toHaveLength(0);
    });

    it('装饰随属性增减', () => {
        const [strong, setStrong] = createSignal(false);
        const { container } = render(() => (
            <Text strong={strong()} mark>
                T
            </Text>
        ));
        expect(root(container).querySelector(':scope > mark')).toHaveTextContent(/^T$/);
        setStrong(true);
        expect(root(container).querySelector(':scope > strong > mark')).toHaveTextContent(/^T$/);
        setStrong(false);
        expect(root(container).querySelector(':scope > mark')).toHaveTextContent(/^T$/);
        expect(root(container).querySelector('strong')).toBeNull();
    });

    it('元素 children 在装饰、link、省略与提示切换后仍显示', () => {
        const [props, setProps] = createSignal<{ strong?: boolean; link?: boolean; ellipsis?: Ellipsis | boolean }>({});
        const { container } = render(() => (
            <Text {...props()}>
                <b>B</b> tail
            </Text>
        ));
        const steps = [{ strong: true }, {}, { link: true }, {}, { ellipsis: true }, { ellipsis: { showTooltip: true } }, { ellipsis: true }, {}];
        for (const step of steps) {
            setProps(step);
            expect(root(container).querySelector('b')).toHaveTextContent(/^B$/);
            expect(root(container)).toHaveTextContent(/^B tail$/);
        }
    });

    it('省略的首帧保留元素 children', () => {
        const { container } = render(() => (
            <Text ellipsis={{ expandable: true }}>
                <b>B</b>
            </Text>
        ));
        expect(root(container).querySelector('b')).toHaveTextContent(/^B$/);
    });

    it('link 包裹所有装饰，下划线改为类名，并去掉 type 类名', () => {
        const [disabled, setDisabled] = createSignal(false);
        const { container } = render(() => (
            <Text type="danger" code delete disabled={disabled()} link={{ href: '#target', target: '_blank' }} mark strong underline>
                L
            </Text>
        ));
        expect(root(container)).toHaveClass(`${prefixCls}-link`);
        expect(root(container)).not.toHaveClass(`${prefixCls}-danger`);
        const anchor = must(root(container).querySelector(':scope > a'));
        expect(anchor).toHaveAttribute('href', '#target');
        expect(anchor).toHaveAttribute('target', '_blank');
        const inner = anchor.querySelector(`:scope > del > strong > code > mark > span.${prefixCls}-link-text.${prefixCls}-link-underline`);
        expect(inner).toHaveTextContent(/^L$/);
        expect(root(container).querySelector('u')).toBeNull();

        setDisabled(true);
        expect(root(container).querySelector('a')).toBeNull();
        expect(root(container).querySelector(`:scope > span > del > strong > code > mark > span.${prefixCls}-link-text`)).toHaveTextContent(/^L$/);
    });

    it('Title 映射 heading 与 weight', () => {
        const [props, setProps] = createSignal<TitleProps>({ heading: 3 });
        const { container } = render(() => <Title {...props()}>H</Title>);
        expect(root(container).tagName).toBe('H3');
        expect(root(container)).toHaveClass(`${prefixCls}-h3`, `${prefixCls}-primary`);

        setProps({ heading: 7 as unknown as TitleProps['heading'] });
        expect(root(container).tagName).toBe('H1');
        expect(root(container)).toHaveClass(`${prefixCls}-h1`);

        setProps({ heading: 2, weight: 'semibold' });
        expect(root(container)).toHaveClass(`${prefixCls}-h2-weight-semibold`);
        expect(root(container).style.fontWeight).toBe('');

        setProps({ style: { color: 'red' }, heading: 2, weight: 600 });
        expect(root(container).className).not.toMatch(/weight/);
        expect(root(container).style.fontWeight).toBe('600');
        expect(root(container).style.color).toBe('red');

        setProps({ style: { 'font-weight': 300 }, heading: 2, weight: 600 });
        expect(root(container).style.fontWeight).toBe('300');

        setProps({ style: 'color: blue', heading: 2, weight: 600 });
        expect(root(container).style.fontWeight).toBe('600');
        expect(root(container).style.color).toBe('blue');
    });

    it('icon 属性，size inherit 读取外层 size', () => {
        const { container } = render(() => (
            <Paragraph size="small">
                <Text size="inherit" icon={<IconSetting />}>
                    inherit
                </Text>
                <Text icon="*">plain</Text>
                <Text icon={(props) => <IconSetting size={props.size} />}>component</Text>
                <Text size="inherit" icon={(props) => <IconSetting size={props.size} />}>
                    inherited component
                </Text>
            </Paragraph>
        ));
        const [inherit, plain, component, inheritedComponent] = container.querySelectorAll(`.${prefixCls}-paragraph > .${prefixCls}`);
        expect(inherit).toHaveClass(`${prefixCls}-small`);
        expect(inherit).not.toHaveClass(`${prefixCls}-inherit`);
        const icon = must(inherit.querySelector(`:scope > span.${prefixCls}-icon[x-semi-prop="icon"]`));
        expect(icon.querySelector('.semi-icon')).toBeInTheDocument();
        expect(plain).toHaveClass(`${prefixCls}-normal`);
        expect(plain.querySelector(`.${prefixCls}-icon`)).toHaveTextContent(/^\*$/);
        expect(component.querySelector('.semi-icon')).toHaveClass('semi-icon-default');
        expect(inheritedComponent.querySelector('.semi-icon')).toHaveClass('semi-icon-small');
    });

    it('size inherit 读取外层 size，随外层变化', () => {
        const [size, setSize] = createSignal<'small' | 'normal'>('small');
        const { container } = render(() => (
            <Paragraph size={size()}>
                <Text size="inherit">inherit</Text>
            </Paragraph>
        ));
        const inherit = () => container.querySelector(`.${prefixCls}-paragraph > .${prefixCls}`);
        expect(inherit()).toHaveClass(`${prefixCls}-small`);
        setSize('normal');
        expect(inherit()).toHaveClass(`${prefixCls}-normal`);
    });

    it('将 data-* 及其他 DOM 属性透传到根元素', () => {
        const { container } = render(() => (
            <div>
                <Text id="t" data-x="text" onClick={() => {}}>
                    a
                </Text>
                <Title data-x="title">b</Title>
                <Paragraph data-x="paragraph">c</Paragraph>
                <Numeral data-x="numeral">1</Numeral>
                <Typography data-x="typography">d</Typography>
            </div>
        ));
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
        const { container: other } = render(() => (
            <Text code copyable={false} delete ellipsis={false} mark strong underline>
                x
            </Text>
        ));
        expect(root(other).getAttributeNames()).toEqual(['class']);
        const { container: passthrough } = render(() => <Text {...{ editable: 'yes' }}>x</Text>);
        expect(root(passthrough)).toHaveAttribute('editable', 'yes');
    });

    it('裸 Typography 读取 semiGlobal overrideDefaultProps，Text 保留自己的标签', () => {
        semiGlobal.config.overrideDefaultProps = { Typography: { component: 'section' } };
        const { container } = render(() => (
            <div>
                <Typography>bare</Typography>
                <Text>text</Text>
            </div>
        ));
        const [bare, text] = container.querySelectorAll(`.${prefixCls}`);
        expect(bare.tagName).toBe('SECTION');
        expect(text.tagName).toBe('SPAN');
        semiGlobal.config.overrideDefaultProps = {};
        const { container: plain } = render(() => <Typography class="x">bare</Typography>);
        expect(root(plain).tagName).toBe('ARTICLE');
        expect(root(plain)).toHaveClass(prefixCls, 'x');
    });

    it('CSS 省略号类名与 line clamp', () => {
        const [ellipsis, setEllipsis] = createSignal<Ellipsis | boolean>(true);
        const [tag, setTag] = createSignal<'text' | 'paragraph'>('text');
        const { container } = render(() => (
            <Dynamic component={tag() === 'text' ? Text : Paragraph} ellipsis={ellipsis()}>
                t
            </Dynamic>
        ));
        expect(root(container)).toHaveClass(`${prefixCls}-ellipsis`, `${prefixCls}-ellipsis-single-line`, `${prefixCls}-ellipsis-overflow-ellipsis`, `${prefixCls}-ellipsis-overflow-ellipsis-text`);

        setEllipsis({ rows: 2 });
        expect(root(container)).toHaveClass(`${prefixCls}-ellipsis-multiple-line`, `${prefixCls}-ellipsis-multiple-line-text`);
        expect(root(container)).not.toHaveClass(`${prefixCls}-ellipsis-overflow-ellipsis`);
        expect(root(container).style.webkitLineClamp).toBe('2');

        setTag('paragraph');
        setEllipsis({ rows: 3 });
        expect(root(container)).toHaveClass(`${prefixCls}-ellipsis-multiple-line`);
        expect(root(container)).not.toHaveClass(`${prefixCls}-ellipsis-multiple-line-text`);
        expect(root(container).style.webkitLineClamp).toBe('3');

        setEllipsis({ rows: 3, pos: 'middle' });
        expect(root(container)).toHaveClass(`${prefixCls}-ellipsis-multiple-line`);
        expect(root(container).style.webkitLineClamp).toBe('');

        setEllipsis(false);
        expect(root(container).className).not.toMatch(/ellipsis/);
    });

    it('文本未溢出时不显示 Tooltip，悬停时重新检查 CSS 溢出', async () => {
        const width = mockSingleRowOverflow(10);
        const renderTooltip: RenderTooltip = (children, node) => (
            <b data-children={children as string} data-testid="tip">
                {node}
            </b>
        );
        render(() => (
            <Text style={{ width: '100px' }} ellipsis={{ showTooltip: { renderTooltip } }}>
                fits
            </Text>
        ));
        await sleep(50);
        expect(screen.queryByTestId('tip')).toBeNull();
        width.textWidth = 200;
        fireEvent.mouseEnter(screen.getByText('fits'));
        expect(screen.getByTestId('tip')).toHaveAttribute('data-children', 'fits');
        expect(screen.getByTestId('tip').querySelector(`.${prefixCls}`)).toHaveTextContent(/^fits$/);
    });

    it('首帧渲染完整文本和展开按钮，之后再进行截断', async () => {
        mockTextHeight(2);
        const { container } = render(() => (
            <Paragraph style={{ 'line-height': '20px' }} ellipsis={{ expandable: true, expandText: 'EX' }}>
                {LETTERS}
            </Paragraph>
        ));
        expect(root(container)).toHaveTextContent(new RegExp(`^${LETTERS}EX$`));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));

        const { container: fits } = render(() => (
            <Paragraph style={{ 'line-height': '20px' }} ellipsis={{ expandable: true, expandText: 'EX' }}>
                short
            </Paragraph>
        ));
        expect(screen.getAllByRole('button', { name: 'EX' })).toHaveLength(2);
        await waitFor(() => expect(root(fits)).toHaveTextContent(/^short$/));
        expect(fits.querySelector(`.${prefixCls}-ellipsis-expand`)).toBeNull();
    });

    it('JS 省略只在 children 含元素时警告，字符串数组与数字不警告', async () => {
        mockTextHeight(2);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { container } = render(() => (
            <Paragraph style={{ 'line-height': '20px' }} ellipsis={{ expandable: true }}>
                {LETTERS.slice(0, 10)}
                {LETTERS.slice(10)}
            </Paragraph>
        ));
        await waitFor(() => expect(root(container)).toHaveTextContent(/\.\.\./));
        expect(warn).not.toHaveBeenCalled();
        render(() => (
            <Paragraph ellipsis={{ expandable: true }}>
                <b>element</b>
            </Paragraph>
        ));
        await waitFor(() => expect(warn).toHaveBeenCalledWith(expect.stringContaining('pure text')));
    });

    it('expandable 未设置 collapsible 时：onExpand 参数正确，展开后的文本不含收起文案', async () => {
        mockTextHeight(2);
        const onExpand = vi.fn<NonNullable<Ellipsis['onExpand']>>();
        const { container } = render(() => (
            <Paragraph style={{ 'line-height': '20px' }} ellipsis={{ expandable: true, expandText: 'EX', onExpand }}>
                {LETTERS}
            </Paragraph>
        ));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        const button = screen.getByRole('button', { name: 'EX' });
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
        button.focus();
        await userEvent.keyboard('{Enter}');
        expect(onExpand).toHaveBeenCalledTimes(1);
        expect(onExpand.mock.calls[0][0]).toBe(true);
        expect(onExpand.mock.calls[0][1]).toBeTruthy();
        expect(root(container)).toHaveTextContent(new RegExp(`^${LETTERS}$`));
        expect(container.querySelector(`.${prefixCls}-ellipsis-expand`)).toBeNull();
    });

    it('展开按钮与原生按钮一样响应 Space', async () => {
        mockTextHeight(2);
        const { container } = render(() => (
            <Paragraph style={{ 'line-height': '20px' }} ellipsis={{ expandable: true, collapsible: true }}>
                {LETTERS}
            </Paragraph>
        ));
        await waitFor(() => expect(root(container)).toHaveTextContent(/\.\.\.展开$/));
        screen.getByRole('button', { name: '展开' }).focus();
        await userEvent.keyboard(' ');
        expect(root(container)).toHaveTextContent(new RegExp(`^${LETTERS}收起$`));
    });

    it('新 children 会重置展开状态并重新截断', async () => {
        mockTextHeight(2);
        const [text, setText] = createSignal(LETTERS);
        const ellipsis = { expandable: true, expandText: 'EX', collapsible: true, collapseText: 'CO' };
        const { container } = render(() => (
            <Paragraph style={{ 'line-height': '20px' }} ellipsis={ellipsis}>
                {text()}
            </Paragraph>
        ));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        await userEvent.click(screen.getByRole('button', { name: 'EX' }));
        expect(root(container)).toHaveTextContent(/CO$/);

        setText(LETTERS.toUpperCase());
        await waitFor(() => expect(root(container)).toHaveTextContent(/^ABCDEFGHIJKLMN\.\.\.EX$/));
    });

    it('文本内容不变时保持展开状态', async () => {
        mockTextHeight(2);
        const [tail, setTail] = createSignal('xyz');
        const ellipsis = { expandable: true, expandText: 'EX', collapsible: true, collapseText: 'CO' };
        const { container } = render(() => (
            <Paragraph style={{ 'line-height': '20px' }} ellipsis={ellipsis}>
                {LETTERS}
                {tail()}
            </Paragraph>
        ));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        await userEvent.click(screen.getByRole('button', { name: 'EX' }));
        expect(root(container)).toHaveTextContent(/CO$/);

        setTail('xyz');
        await sleep(50);
        expect(root(container)).toHaveTextContent(new RegExp(`^${LETTERS}xyzCO$`));

        setTail('XYZ');
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
    });

    it('截断、展开与收起不重新创建元素 children', async () => {
        mockTextHeight(2);
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { container } = render(() => (
            <Paragraph style={{ 'line-height': '20px' }} ellipsis={{ expandable: true, expandText: 'EX', collapsible: true, collapseText: 'CO' }}>
                <b>{LETTERS}</b>
            </Paragraph>
        ));
        const bold = must(root(container).querySelector('b'));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        await userEvent.click(screen.getByRole('button', { name: 'EX' }));
        expect(root(container).querySelector('b')).toBe(bold);
        await userEvent.click(screen.getByRole('button', { name: 'CO' }));
        expect(root(container).querySelector('b')).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'EX' }));
        expect(root(container).querySelector('b')).toBe(bold);
    });

    it('挂载后容器尺寸变化会重新测量 JS 截断', async () => {
        const height = mockTextHeight(2);
        const observer = mockResizeObserver();
        const { container } = render(() => (
            <Paragraph style={{ 'line-height': '20px' }} ellipsis={{ expandable: true, expandText: 'EX' }}>
                {LETTERS}
            </Paragraph>
        ));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        await sleep(20);
        height.factor = 4;
        reportWidth(observer, root(container), 50);
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcd\.\.\.EX$/));
    });

    it('宽度没有变化的报告不重新测量', async () => {
        const height = mockTextHeight(2);
        const observer = mockResizeObserver();
        const { container } = render(() => (
            <Paragraph style={{ 'line-height': '20px' }} ellipsis={{ expandable: true, expandText: 'EX' }}>
                {LETTERS}
            </Paragraph>
        ));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        await sleep(20);
        reportWidth(observer, root(container), 50);
        await sleep(50);
        height.factor = 4;
        reportWidth(observer, root(container), 50);
        await sleep(50);
        expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/);
    });

    it('监听根元素及其父元素', async () => {
        mockSingleRowOverflow(200);
        const { observed } = mockResizeObserver();
        const { container } = render(() => (
            <section data-testid="parent">
                <Text style={{ width: '100px' }} ellipsis={{ showTooltip: true }}>
                    overflowing text
                </Text>
            </section>
        ));
        const before = root(container);
        await waitFor(() => expect(root(container)).toHaveAttribute('tabindex', '0'));
        expect(root(container)).toBe(before);

        expect(observed()).toContain(root(container));
        expect(observed()).toContain(screen.getByTestId('parent'));
    });

    it('showTooltip 的提示随溢出状态开关，根元素与 ref 保持同一个节点', async () => {
        const width = mockSingleRowOverflow(10);
        let element: HTMLElement | undefined;
        render(() => (
            <Text ref={(node) => (element = node)} style={{ width: '100px' }} ellipsis={{ showTooltip: true }}>
                overflowing text
            </Text>
        ));
        const before = must(element);
        await sleep(50);
        expect(before).not.toHaveAttribute('tabindex');
        width.textWidth = 200;
        fireEvent.mouseEnter(screen.getByText('overflowing text'));
        await waitFor(() => expect(before).toHaveAttribute('tabindex', '0'));
        expect(element).toBe(before);
        expect(screen.getByText('overflowing text').closest(`.${prefixCls}`)).toBe(before);
    });

    it('省略且 showTooltip 的文字位于 activedescendant 条目内时不注入 tabIndex', async () => {
        mockSingleRowOverflow(200);
        // the option of a listbox that keeps DOM focus and points at its options with aria-activedescendant
        const option = document.createElement('div');
        option.setAttribute('role', 'option');
        document.body.append(option);
        const { container } = render(
            () => (
                <Text style={{ width: '100px' }} ellipsis={{ showTooltip: true }}>
                    option text
                </Text>
            ),
            { container: option }
        );
        await sleep(50);
        expect(root(container)).not.toHaveAttribute('tabindex');
        option.remove();
    });

    it.each([
        ['button', {}],
        ['div', { role: 'button' }],
        ['a', { href: '#' }],
        ['div', { role: 'menuitemradio' }],
    ] as const)('省略且 showTooltip 的文字位于 %s 内时不成为独立的 Tab 停靠点', async (tag, attrs) => {
        mockSingleRowOverflow(200);
        const host = document.createElement(tag);
        Object.entries(attrs).forEach(([name, value]) => host.setAttribute(name, value));
        document.body.append(host);
        const { container } = render(
            () => (
                <Text style={{ width: '100px' }} ellipsis={{ showTooltip: true }}>
                    host text
                </Text>
            ),
            { container: host }
        );
        await sleep(50);
        expect(root(container)).not.toHaveAttribute('tabindex');
        host.remove();
    });

    it('省略且 showTooltip 的文字不在组合控件条目内时注入 tabIndex', async () => {
        mockSingleRowOverflow(200);
        const { container } = render(() => (
            <Text style={{ width: '100px' }} ellipsis={{ showTooltip: true }}>
                plain text
            </Text>
        ));
        await waitFor(() => expect(root(container)).toHaveAttribute('tabindex', '0'));
    });

    it('省略且 showTooltip 的文字位于带对勾的 Dropdown.Item 内时不成为独立的 Tab 停靠点', async () => {
        mockSingleRowOverflow(200);
        render(() => (
            <Dropdown.Item active showTick>
                <Text style={{ width: '100px' }} ellipsis={{ showTooltip: true }}>
                    checked text
                </Text>
            </Dropdown.Item>
        ));
        const item = screen.getByRole('menuitemcheckbox');
        await sleep(50);
        expect(root(item)).not.toHaveAttribute('tabindex');
    });

    it('JS 省略号配合 showTooltip 时，仅在截断时显示提示', async () => {
        mockTextHeight(2);
        const renderTooltip: RenderTooltip = (_children, node) => <b data-testid="tip">{node}</b>;
        const { unmount } = render(() => (
            <Paragraph style={{ 'line-height': '20px' }} ellipsis={{ suffix: '!', showTooltip: { renderTooltip } }}>
                {LETTERS}
            </Paragraph>
        ));
        await waitFor(() => expect(screen.getByTestId('tip')).toHaveTextContent(/^abcdefghijklmno\.\.\.!$/));
        unmount();

        render(() => (
            <Paragraph style={{ 'line-height': '20px' }} ellipsis={{ suffix: '!', showTooltip: { renderTooltip } }}>
                short
            </Paragraph>
        ));
        expect(screen.getByTestId('tip')).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByTestId('tip')).toBeNull());
        expect(screen.getByText('short!').closest(`.${prefixCls}`)).toHaveTextContent(/^short!$/);
    });

    it('省略号在无 children 时不渲染也不测量', async () => {
        const { container } = render(() => (
            <>
                <Text ellipsis={{ rows: 3, pos: 'middle', expandable: true }} />
                <Text ellipsis />
            </>
        ));
        await sleep(50);
        expect(container.querySelectorAll(`.${prefixCls}-ellipsis`)).toHaveLength(2);
        expect(container.querySelector(`.${prefixCls}-ellipsis-expand`)).toBeNull();
    });

    it('copyable 复制配置的内容，并显示自定义成功提示', async () => {
        const { container } = render(() => <Text copyable={{ content: 'configured', successTip: 'done', copyTip: 'press' }}>children</Text>);
        expect(must(container.querySelector<HTMLElement>(`.${prefixCls}-action-copy`)).style.marginLeft).toBe('');
        await userEvent.click(must(container.querySelector('.semi-icon-copy')));
        expect(clipboardWrite()).toHaveBeenCalledWith('configured');
        await waitFor(() => expect(container.querySelector(`.${prefixCls}-action-copied`)).toHaveTextContent(/^done$/));
    });

    it('copyable 自定义图标位于复制按钮内', async () => {
        const { container } = render(() => <Text copyable={{ icon: () => <IconSetting /> }}>gear</Text>);
        const button = screen.getByRole('button', { name: zh_CN.Typography.copy });
        expect(button).toContainElement(container.querySelector('.semi-icon-setting'));
        await userEvent.click(button);
        await waitFor(() => expect(clipboardWrite()).toHaveBeenCalledWith('gear'));
        await waitFor(() => expect(container.querySelector(`.${prefixCls}-action-copied`)).toHaveTextContent('复制成功'));
    });

    it('copyable 的非元素图标原样显示，按钮以语言包文案命名', () => {
        render(() => <Text copyable={{ icon: () => '复制' }}>text</Text>);
        const button = screen.getByRole('button', { name: zh_CN.Typography.copy });
        expect(button).toHaveAttribute('aria-label', zh_CN.Typography.copy);
        expect(button).toHaveTextContent(/^复制$/);
        expect(button.querySelector('.semi-icon-copy')).toBeNull();
    });

    it('copyable 卸载时清除已复制计时器', async () => {
        vi.useFakeTimers();
        const { unmount } = render(() => <Paragraph copyable={{ render: (copied, doCopy) => <button onClick={doCopy}>{copied ? 'copied' : 'copy'}</button> }}>Semi</Paragraph>);
        fireEvent.click(screen.getByRole('button'));
        await vi.advanceTimersByTimeAsync(0);
        expect(screen.getByRole('button')).toHaveTextContent('copied');
        expect(vi.getTimerCount()).toBe(1);
        unmount();
        expect(vi.getTimerCount()).toBe(0);
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
            const { container, unmount } = render(() => <Numeral {...props}>{input}</Numeral>);
            expect(root(container)).toHaveTextContent(new RegExp(`^${escapeRegExp(output)}$`));
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
            const { container, unmount } = render(() => <Numeral {...props}>{input}</Numeral>);
            expect(root(container).tagName).toBe('SPAN');
            expect(root(container)).toHaveTextContent(new RegExp(`^${escapeRegExp(output)}$`));
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
            const { container, unmount } = render(() => <Numeral {...props}>{input}</Numeral>);
            expect(root(container)).toHaveTextContent(new RegExp(`^${escapeRegExp(output)}$`));
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
            const { container, unmount } = render(() => <Numeral {...props}>{input}</Numeral>);
            expect(root(container)).toHaveTextContent(new RegExp(`^${escapeRegExp(output)}$`));
            unmount();
        });
    });

    it('disabled 的 link 不触发 onClick，也不把 href 写到 span', async () => {
        const onClick = vi.fn<() => void>();
        const { container } = render(() => (
            <Text disabled link={{ href: '#target', target: '_blank', onClick, class: 'extra' }}>
                L
            </Text>
        ));
        const span = root(container).querySelector(':scope > span.extra');
        expect(span).toBeInTheDocument();
        expect(span).not.toHaveAttribute('href');
        expect(span).not.toHaveAttribute('target');
        await userEvent.click(screen.getByText('L'));
        expect(onClick).not.toHaveBeenCalled();
    });

    it('条件渲染的 false、null 不会被复制成字面文本', async () => {
        const done: boolean = false;
        const [copyable, setCopyable] = createSignal(true);
        const [content, setContent] = createSignal(true);
        const { container } = render(() => (
            <Text copyable={copyable()}>
                {content() && (
                    <>
                        Bob
                        {done && '!'}
                        {null}
                    </>
                )}
            </Text>
        ));
        await userEvent.click(must(container.querySelector('.semi-icon-copy')));
        expect(clipboardWrite()).toHaveBeenLastCalledWith('Bob');

        setContent(false);
        const icon = container.querySelector('.semi-icon-copy');
        if (icon) {
            await userEvent.click(icon);
        }
        expect(clipboardWrite()).not.toHaveBeenCalledWith('null');
        expect(clipboardWrite()).not.toHaveBeenCalledWith('false');
        setCopyable(false);
    });

    it('JS 截断的文本不含条件渲染的 false', async () => {
        mockTextHeight(2);
        const done: boolean = false;
        const { container } = render(() => (
            <Paragraph style={{ 'line-height': '20px' }} ellipsis={{ expandable: true, expandText: 'EX' }}>
                ab
                {done && '!'}
                {LETTERS.slice(2)}
            </Paragraph>
        ));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        expect(root(container)).not.toHaveTextContent('false');
    });

    it('先能放下的文本在容器变窄后截断时，按展开按钮的宽度预留', async () => {
        const height = mockTextHeight(1);
        const observer = mockResizeObserver();
        const { container } = render(() => (
            <Paragraph style={{ 'line-height': '20px' }} ellipsis={{ expandable: true, expandText: 'EX' }}>
                {LETTERS}
            </Paragraph>
        ));
        await waitFor(() => expect(root(container)).toHaveTextContent(new RegExp(`^${LETTERS}$`)));
        expect(container.querySelector(`.${prefixCls}-ellipsis-expand`)).toBeNull();
        await sleep(20);
        height.factor = 2;
        reportWidth(observer, root(container), 50);
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
    });
});

describe('Typography 类型', () => {
    it('CopyableConfig 含可选的 duration、class 与 style', () => {
        expectTypeOf<CopyableConfig['duration']>().toEqualTypeOf<number | undefined>();
        expectTypeOf<CopyableConfig['class']>().toEqualTypeOf<string | undefined>();
        expectTypeOf<{ duration: number }>().toExtend<CopyableConfig>();
    });
});

describe('Typography 函数组件', () => {
    it('ref 指向根元素', () => {
        const refs: Record<string, HTMLElement | undefined> = {};
        const { container } = render(() => (
            <div>
                <Text ref={(node) => (refs.text = node)}>a</Text>
                <Title ref={(node) => (refs.title = node)}>b</Title>
                <Paragraph ref={(node) => (refs.paragraph = node)}>c</Paragraph>
                <Numeral ref={(node) => (refs.numeral = node)}>1</Numeral>
                <Typography ref={(node) => (refs.typography = node)}>d</Typography>
            </div>
        ));
        expect(Object.values(refs)).toEqual([...container.querySelectorAll(`.${prefixCls}`)]);
    });

    it('Numeral 保留精度，且 truncate 不写入 DOM', () => {
        const { container } = render(() => (
            <Numeral precision={2} truncate="ceil">
                1.111
            </Numeral>
        ));
        expect(root(container)).toHaveTextContent(/^1\.12$/);
        expect(root(container)).not.toHaveAttribute('precision');
        expect(root(container)).not.toHaveAttribute('truncate');
    });

    it('Numeral 格式化嵌套数组并跳过 null children', () => {
        const { container } = render(() => <Numeral precision={1}>{[1, null, [2, ['x', 3]]]}</Numeral>);
        expect(root(container)).toHaveTextContent(/^1\.02\.0x3\.0$/);
    });

    it('Numeral 的 children 混有文字和元素时只格式化文字', () => {
        const { container } = render(() => (
            <Numeral precision={1}>
                Stars 1 <b>2</b>
                <p>
                    Fork <b>3</b>
                </p>
            </Numeral>
        ));
        expect(root(container)).toHaveTextContent(/^Stars 1\.0 2Fork 3$/);
    });

    it('Numeral 精度变化后重新格式化文字，元素保持原样', () => {
        const [precision, setPrecision] = createSignal(1);
        const { container } = render(() => (
            <Numeral precision={precision()}>
                <b>1.2345</b> 2.3456
            </Numeral>
        ));
        expect(root(container)).toHaveTextContent(/^1\.2345 2\.3$/);
        setPrecision(3);
        expect(root(container)).toHaveTextContent(/^1\.2345 2\.346$/);
    });

    it('省略号配置变化后重新测量截断', async () => {
        mockTextHeight(2);
        const [ellipsis, setEllipsis] = createSignal<Ellipsis>({ expandable: true, expandText: 'EX' });
        const { container } = render(() => (
            <Paragraph style={{ 'line-height': '20px' }} ellipsis={ellipsis()}>
                {LETTERS}
            </Paragraph>
        ));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        setEllipsis({ expandable: true, expandText: 'EX', suffix: 'SUFFIX' });
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefgh\.\.\.SUFFIXEX$/));
    });
});

describe('Typography Tab 焦点停靠', () => {
    it('copyable 复制按钮是唯一的 Tab 停靠点，其 Tooltip 描述了该按钮', async () => {
        render(() => <Text copyable={{ copyTip: 'Copy the text' }}>Semi Design</Text>);
        await userEvent.tab();
        const button = must(document.activeElement);
        expect(button.tagName).toBe('BUTTON');
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });
});

describe('Typography 修复', () => {
    it('copyable.content 显式为 undefined 时回落到文本', async () => {
        render(() => <Text copyable={{ content: undefined }}>abc</Text>);
        await userEvent.click(screen.getByRole('button', { name: '复制' }));
        expect(clipboardWrite()).toHaveBeenCalledWith('abc');
    });

    it('link 无 href 且有点击监听时可聚焦、有 link 角色，Enter 触发点击', async () => {
        const onClick = vi.fn<() => void>();
        render(() => (
            <Text link onClick={onClick}>
                x
            </Text>
        ));
        await userEvent.tab();
        expect(screen.getByRole('link', { name: 'x' })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('link 无 href 且无点击监听时不是 link', () => {
        render(() => <Text link>x</Text>);
        expect(screen.queryByRole('link')).toBeNull();
    });

    it('整体替换 props 时保留根节点与焦点', () => {
        const [props, setProps] = createSignal<TextProps>({ tabIndex: 0, children: 'text', title: 'a' });
        const { container } = render(() => <Text {...props()} />);
        const root = container.querySelector<HTMLElement>(`.${prefixCls}`);
        root?.focus();
        setProps({ tabIndex: 0, children: 'text', title: 'b' });
        expect(container.querySelector(`.${prefixCls}`)).toBe(root);
        expect(root).toHaveFocus();
    });

    it('不可收起的展开按钮激活后焦点移到文字根元素', async () => {
        mockTextHeight(2);
        const { container } = render(() => (
            <Paragraph style={{ 'line-height': '20px' }} ellipsis={{ expandable: true, expandText: 'EX' }}>
                {LETTERS}
            </Paragraph>
        ));
        await waitFor(() => expect(screen.getByRole('button', { name: 'EX' })).toBeTruthy());
        screen.getByRole('button', { name: 'EX' }).focus();
        await userEvent.keyboard('{Enter}');
        expect(document.activeElement).toBe(container.querySelector(`.${prefixCls}`));
    });

    it('展开、收起按钮带 aria-expanded', async () => {
        mockTextHeight(2);
        render(() => (
            <Paragraph style={{ 'line-height': '20px' }} ellipsis={{ expandable: true, collapsible: true }}>
                {LETTERS}
            </Paragraph>
        ));
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
            () => (
                <Text style={{ width: '100px' }} ellipsis={{ showTooltip: { type: 'popover' } }}>
                    option text
                </Text>
            ),
            { container: option }
        );
        await sleep(50);
        expect(container.querySelector(`.${prefixCls}`)).not.toHaveAttribute('tabindex');
        option.remove();
    });

    it('condition 为 false 时不可聚焦', async () => {
        mockSingleRowOverflow(200);
        const { container } = render(() => (
            <Text style={{ width: '100px' }} ellipsis={{ showTooltip: { opts: { condition: false } } }}>
                plain text
            </Text>
        ));
        await sleep(50);
        expect(container.querySelector(`.${prefixCls}`)).not.toHaveAttribute('tabindex');
    });

    it('showTooltip 的 popover 在溢出时可聚焦，根元素与 ref 保持同一个节点', async () => {
        const width = mockSingleRowOverflow(10);
        let element: HTMLElement | undefined;
        render(() => (
            <Text ref={(node) => (element = node)} style={{ width: '100px' }} ellipsis={{ showTooltip: { type: 'popover' } }}>
                popover text
            </Text>
        ));
        const before = must(element);
        await sleep(50);
        expect(before).not.toHaveAttribute('tabindex');
        width.textWidth = 200;
        fireEvent.mouseEnter(screen.getByText('popover text'));
        await waitFor(() => expect(before).toHaveAttribute('tabindex', '0'));
        expect(element).toBe(before);
    });

    it('showTooltip.opts 的 tabIndex 之外，调用方的 tabIndex 始终保留', async () => {
        mockSingleRowOverflow(10);
        const { container } = render(() => (
            <Text tabIndex={-1} style={{ width: '100px' }} ellipsis={{ showTooltip: true }}>
                fits
            </Text>
        ));
        await sleep(50);
        expect(root(container)).toHaveAttribute('tabindex', '-1');
    });
});

describe('Typography 省略与装饰的边界', () => {
    it('展开期间容器变窄，收起后按新宽度重新截断', async () => {
        const height = mockTextHeight(2);
        const observer = mockResizeObserver();
        const { container } = render(() => (
            <Paragraph style={{ 'line-height': '20px' }} ellipsis={{ expandable: true, collapsible: true, expandText: 'EX', collapseText: 'CO' }}>
                {LETTERS}
            </Paragraph>
        ));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmn\.\.\.EX$/));
        await sleep(20);
        await userEvent.click(screen.getByRole('button', { name: 'EX' }));
        expect(root(container)).toHaveTextContent(new RegExp(`^${LETTERS}CO$`));
        height.factor = 4;
        reportWidth(observer, root(container), 50);
        // the measurement frame of this report runs while the text is expanded
        await sleep(50);
        await userEvent.click(screen.getByRole('button', { name: 'CO' }));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcd\.\.\.EX$/));
    });

    it('展开后改为可用 CSS 省略的配置，回到收起状态并用 CSS 省略', async () => {
        mockTextHeight(2);
        const [ellipsis, setEllipsis] = createSignal<Ellipsis>({ expandable: true, collapsible: true });
        const { container } = render(() => (
            <Paragraph style={{ 'line-height': '20px' }} ellipsis={ellipsis()}>
                {LETTERS}
            </Paragraph>
        ));
        await userEvent.click(await screen.findByRole('button', { name: '展开' }));
        setEllipsis({ rows: 1 });
        await waitFor(() => expect(root(container)).toHaveClass(`${prefixCls}-ellipsis-overflow-ellipsis`));
    });

    it('显式 expandText、collapseText 为 undefined 时回落到语言包文案', async () => {
        mockTextHeight(2);
        render(() => (
            <Paragraph style={{ 'line-height': '20px' }} ellipsis={{ expandable: true, collapsible: true, expandText: undefined, collapseText: undefined }}>
                {LETTERS}
            </Paragraph>
        ));
        await userEvent.click(await screen.findByRole('button', { name: zh_CN.Typography.expand }));
        expect(screen.getByRole('button', { name: zh_CN.Typography.collapse })).toBeInTheDocument();
    });

    it('只设 expandText 不可展开时，按钮不带 aria-expanded', async () => {
        mockTextHeight(2);
        render(() => (
            <Paragraph style={{ 'line-height': '20px' }} ellipsis={{ expandText: 'EX' }}>
                {LETTERS}
            </Paragraph>
        ));
        const button = await screen.findByRole('button', { name: 'EX' });
        expect(button).not.toHaveAttribute('aria-expanded');
    });

    it('link 对象的 onKeyDown 与内置的 Enter 激活同时生效', async () => {
        const onKeyDown = vi.fn<(e: unknown) => void>();
        const onClick = vi.fn<() => void>();
        render(() => <Text link={{ onKeyDown, onClick }}>x</Text>);
        await userEvent.tab();
        await userEvent.keyboard('{Enter}');
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('link 对象的 onKeyDown 调用 preventDefault 后不再触发内置的 Enter 激活', async () => {
        const onClick = vi.fn<() => void>();
        render(() => <Text link={{ onKeyDown: (e) => e.preventDefault(), onClick }}>x</Text>);
        await userEvent.tab();
        await userEvent.keyboard('{Enter}');
        expect(onClick).not.toHaveBeenCalled();
    });

    it('显式 component 为 undefined 时仍渲染各自的内置标签', () => {
        const { container } = render(() => (
            <>
                <Text component={undefined}>t</Text>
                <Title component={undefined}>h</Title>
                <Paragraph component={undefined}>p</Paragraph>
                <Numeral component={undefined}>1</Numeral>
            </>
        ));
        expect([...container.querySelectorAll(`.${prefixCls}`)].map((el) => el.tagName)).toEqual(['SPAN', 'H1', 'P', 'SPAN']);
    });

    it('Text、Title、Paragraph、Numeral 不读取全局 Typography 默认值，裸 Typography 读取', () => {
        semiGlobal.config.overrideDefaultProps = { Typography: { tabIndex: 0 } };
        const { container } = render(() => (
            <>
                <Typography>bare</Typography>
                <Text>t</Text>
                <Title>h</Title>
                <Paragraph>p</Paragraph>
                <Numeral>1</Numeral>
            </>
        ));
        expect([...container.querySelectorAll(`.${prefixCls}`)].map((el) => el.hasAttribute('tabindex'))).toEqual([true, false, false, false, false]);
    });

    it('copyable.render 的自定义节点同样为 JS 省略预留宽度', async () => {
        mockTextHeight(2);
        const { container } = render(() => (
            <Paragraph style={{ 'line-height': '20px' }} copyable={{ render: () => <button type="button">CCCC</button> }} ellipsis={{ rows: 1 }}>
                {LETTERS}
            </Paragraph>
        ));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijkl\.\.\.CCCC$/));
    });

    it('复制成功后按已复制提示的宽度重新截断，恢复后回到原截断', async () => {
        mockTextHeight(2);
        const { container } = render(() => (
            <Paragraph style={{ 'line-height': '20px' }} copyable={{ duration: 0.3 }} ellipsis={{ rows: 1 }}>
                {LETTERS}
            </Paragraph>
        ));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmnop\.\.\.$/));
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Typography.copy }));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijkl\.\.\.复制成功$/));
        await waitFor(() => expect(root(container)).toHaveTextContent(/^abcdefghijklmnop\.\.\.$/));
    });

    it('已复制期间，字符串 successTip 命名按钮，渲染函数的 successTip 以语言包文案命名', async () => {
        const { unmount } = render(() => <Text copyable={{ successTip: () => <IconSetting aria-label="Done" /> }}>Semi</Text>);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Typography.copy }));
        expect(await screen.findByRole('button', { name: zh_CN.Typography.copied })).toBeInTheDocument();
        unmount();

        render(() => <Text copyable={{ successTip: 'Done' }}>Semi</Text>);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Typography.copy }));
        expect(await screen.findByRole('button', { name: 'Done' })).toHaveAttribute('aria-label', 'Done');
    });

    it('省略加 showTooltip 的文字含 href 链接时，根元素不再成为第二个 Tab 停靠点', async () => {
        mockSingleRowOverflow(200);
        const { container } = render(() => (
            <Text style={{ width: '100px' }} ellipsis={{ showTooltip: true }} link={{ href: '#' }}>
                link text
            </Text>
        ));
        await sleep(50);
        expect(root(container)).not.toHaveAttribute('tabindex');
        expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('省略加 showTooltip 的文字含可点击的 link 时，根元素不再成为第二个 Tab 停靠点', async () => {
        mockSingleRowOverflow(200);
        const { container } = render(() => (
            <Text style={{ width: '100px' }} ellipsis={{ showTooltip: true }} link onClick={() => undefined}>
                link text
            </Text>
        ));
        await sleep(50);
        expect(root(container)).not.toHaveAttribute('tabindex');
    });
});
