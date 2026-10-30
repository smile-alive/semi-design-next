import { createSignal, type JSX } from 'solid-js';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import Badge, { type BadgeProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';

function renderBadge(props: BadgeProps = {}) {
    const attached = () => (props.children === undefined ? <span>Semi</span> : props.children);
    return render(() => <Badge {...props}>{attached()}</Badge>);
}

const getRoot = (container: HTMLElement) => container.querySelector('.semi-badge') as HTMLElement;
const getCount = (container: HTMLElement) => container.querySelector('[x-semi-prop="count"]') as HTMLElement;

describe('Badge', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('自定义 class 与 countStyle', () => {
        const { container } = renderBadge({ class: 'test', countStyle: { color: 'red' }, count: 5 });
        expect(getRoot(container)).toHaveClass('test');
        expect(container.querySelector('.test .semi-badge-count')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('children 渲染在根元素内', () => {
        const { container } = renderBadge({ children: <div>semi design</div> });
        expect(getRoot(container)).toContainElement(screen.getByText('semi design'));
    });

    it('count 为数字或字符串', () => {
        const [count, setCount] = createSignal<number | string>(5);
        const { container } = render(() => (
            <Badge count={count()}>
                <span>Semi</span>
            </Badge>
        ));
        expect(container.querySelector('.semi-badge-count')).toHaveTextContent(/^5$/);
        expect(container.querySelector('.semi-badge-dot')).toBeNull();

        setCount('semi');
        expect(container.querySelector('.semi-badge-count')).toHaveTextContent(/^semi$/);
        expect(container.querySelector('.semi-badge-dot')).toBeNull();
    });

    it('dot', () => {
        const { container } = renderBadge({ dot: true });
        expect(container.querySelector('.semi-badge-dot')).not.toBeNull();
        expect(container.querySelector('.semi-badge-count')).toBeNull();
    });

    it('overflowCount', () => {
        const { container } = renderBadge({ count: 99, overflowCount: 5 });
        expect(container.querySelector('.semi-badge-count')).toHaveTextContent(/^5\+$/);
    });

    it('type 与 theme', () => {
        const [type, setType] = createSignal<NonNullable<BadgeProps['type']>>('primary');
        const [theme, setTheme] = createSignal<NonNullable<BadgeProps['theme']>>('solid');
        const { container } = render(() => (
            <Badge type={type()} theme={theme()} count={1}>
                <span>Semi</span>
            </Badge>
        ));
        for (const value of ['primary', 'secondary', 'tertiary', 'warning', 'danger', 'success'] as const) {
            setType(value);
            expect(container.querySelector(`.semi-badge-${value}`)).not.toBeNull();
        }
        for (const value of ['solid', 'light', 'inverted'] as const) {
            setTheme(value);
            expect(container.querySelector(`.semi-badge-${value}`)).not.toBeNull();
        }
    });

    it('position', () => {
        const cases: [BadgeProps, string][] = [
            [{ position: 'leftTop' }, '.semi-badge-leftTop'],
            [{ position: 'leftBottom' }, '.semi-badge-leftBottom'],
            [{}, '.semi-badge-rightTop'],
            [{ position: 'rightBottom' }, '.semi-badge-rightBottom'],
        ];
        for (const [props, selector] of cases) {
            const { container, unmount } = renderBadge(props);
            expect(container.querySelector(selector)).not.toBeNull();
            unmount();
        }
    });

    it('RTL 下默认位置为 leftTop', () => {
        const { container } = render(() => (
            <ConfigProvider direction="rtl">
                <Badge count={5}>Semi</Badge>
            </ConfigProvider>
        ));
        expect(container.querySelector('.semi-badge-leftTop')).not.toBeNull();
    });

    it('count 节点：class、位置及默认 type 与 theme', () => {
        const { container } = renderBadge({ count: 5, countClassName: 'cc' });
        const count = getCount(container);
        expect(count).toHaveClass('cc', 'semi-badge-primary', 'semi-badge-solid', 'semi-badge-count');
        expect(count).not.toHaveClass('semi-badge-block');
        expect(getRoot(container).firstChild).toHaveTextContent('Semi');
        expect(getRoot(container).lastChild).toBe(count);
    });

    it('style 落在根元素，countStyle 落在计数节点', () => {
        const { container } = renderBadge({ count: 5, style: { color: 'red' }, countStyle: { color: 'blue' } });
        expect(getRoot(container)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getCount(container)).toHaveStyle({ color: 'rgb(0, 0, 255)' });
    });

    it('无 children 的 badge 为块级元素，不带位置类名', () => {
        const { container } = render(() => <Badge count={5} position="leftTop" />);
        const count = getCount(container);
        expect(count).toHaveClass('semi-badge-block');
        expect(count).not.toHaveClass('semi-badge-leftTop');
    });

    it('自定义节点 count 时去掉 type、theme 与 count 类名', () => {
        const { container } = renderBadge({ count: <i data-testid="icon" />, type: 'danger', theme: 'light' });
        const count = getCount(container);
        expect(count).toHaveClass('semi-badge-custom');
        expect(count).not.toHaveClass('semi-badge-danger');
        expect(count).not.toHaveClass('semi-badge-light');
        expect(count).not.toHaveClass('semi-badge-count');
        expect(count).toContainElement(screen.getByTestId('icon'));
    });

    it('count 为 0 时显示，null 与 undefined 不显示', () => {
        const [count, setCount] = createSignal<JSX.Element>(0);
        const { container } = render(() => (
            <Badge count={count()}>
                <span>Semi</span>
            </Badge>
        ));
        expect(getCount(container)).toHaveClass('semi-badge-count');
        expect(getCount(container)).toHaveTextContent(/^0$/);

        setCount(null);
        expect(getCount(container)).not.toHaveClass('semi-badge-count');
        expect(getCount(container)).toBeEmptyDOMElement();

        setCount(undefined);
        expect(getCount(container)).not.toHaveClass('semi-badge-count');
        expect(getCount(container)).toBeEmptyDOMElement();
    });

    it('overflowCount 仅在数字超过时生效，0 视为未设置', () => {
        const [props, setProps] = createSignal<BadgeProps>({ count: 5, overflowCount: 5 });
        const { container } = render(() => <Badge {...props()} />);
        expect(container.querySelector('.semi-badge-count')).toHaveTextContent(/^5$/);

        setProps({ count: 6, overflowCount: 0 });
        expect(container.querySelector('.semi-badge-count')).toHaveTextContent(/^6$/);
    });

    it('字符串 count 不受 overflowCount 截断', () => {
        const { container } = renderBadge({ count: '99', overflowCount: 5 });
        expect(container.querySelector('.semi-badge-count')).toHaveTextContent(/^99$/);
    });

    it('dot 模式隐藏计数文字', () => {
        const { container } = renderBadge({ dot: true, count: 5 });
        const dot = container.querySelector('.semi-badge-dot');
        expect(dot).toBeEmptyDOMElement();
        expect(dot).not.toHaveClass('semi-badge-count');
    });

    it('将其他属性与事件传给根元素', () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const onMouseEnter = vi.fn<(event: MouseEvent) => void>();
        const onMouseLeave = vi.fn<(event: MouseEvent) => void>();
        const { container } = renderBadge({ count: 5, 'data-testid': 'badge', id: 'b', onClick, onMouseEnter, onMouseLeave } as BadgeProps);
        const root = getRoot(container);
        expect(root).toBe(screen.getByTestId('badge'));
        expect(root).toHaveAttribute('id', 'b');
        fireEvent.click(root);
        fireEvent.mouseEnter(root);
        fireEvent.mouseLeave(root);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].type).toBe('click');
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
        expect(onMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('ref 指向根元素', () => {
        let ref: HTMLSpanElement | undefined;
        const { container } = render(() => <Badge ref={(node) => (ref = node)} count={5} />);
        expect(ref).toBe(getRoot(container));
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Badge: { type: 'danger', dot: true } };
        const [props, setProps] = createSignal<BadgeProps>({ count: 5 });
        const { container } = render(() => <Badge {...props()} />);
        expect(getCount(container)).toHaveClass('semi-badge-danger', 'semi-badge-dot');
        expect(getCount(container)).toBeEmptyDOMElement();
        setProps({ count: 5, type: 'primary', dot: false });
        expect(getCount(container)).toHaveClass('semi-badge-primary', 'semi-badge-count');
        expect(getCount(container)).toHaveTextContent(/^5$/);
    });
});
