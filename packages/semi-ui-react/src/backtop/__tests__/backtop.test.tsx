import { Profiler, StrictMode, createRef, useRef } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BackTop } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { BackTopProps } from '../index';

const renderBackTop = (props: BackTopProps = {}) =>
    render(
        <div>
            <div style={{ height: 1600, width: 300, background: 'grey' }} />
            <BackTop {...props} />
        </div>
    );

describe('BackTop', () => {
    beforeEach(() => {
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
            (cb as () => void)();
            return 0;
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('className 与 style', () => {
        const { container } = renderBackTop({ className: 'test', style: { color: 'red' }, visibilityHeight: -1 });
        const backtop = container.querySelector('.semi-backtop');
        expect(backtop).toHaveClass('test');
        expect(backtop).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('onClick', async () => {
        const onClick = vi.fn<NonNullable<BackTopProps['onClick']>>();
        const { container } = renderBackTop({ onClick, className: 'test', visibilityHeight: -1 });
        await userEvent.click(container.querySelector('.semi-backtop.test'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});

// jsdom does not lay out, so scroll positions are stubbed as own properties and restored afterwards
const stubbed = [];
const stub = (node, key, value) => {
    stubbed.push([node, key, Object.getOwnPropertyDescriptor(node, key)]);
    Object.defineProperty(node, key, { value, writable: true, configurable: true });
};
const scroll = (node, top) => {
    stub(node, node === window ? 'scrollY' : 'scrollTop', top);
    fireEvent.scroll(node);
};
const createTarget = () => {
    const node = document.createElement('div');
    document.body.append(node);
    return node;
};

describe('BackTop 行为', () => {
    beforeEach(() => {
        vi.useFakeTimers({
            toFake: ['setTimeout', 'clearTimeout', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        for (const [node, key, descriptor] of stubbed.splice(0).toReversed()) {
            if (descriptor) {
                Object.defineProperty(node, key, descriptor);
            } else {
                delete node[key];
            }
        }
        document.body.replaceChildren();
    });

    const frame = () => {
        act(() => {
            vi.advanceTimersByTime(16);
        });
    };

    it('窗口滚动超过 visibilityHeight 后显示，低于该值后隐藏', () => {
        const { container } = render(<BackTop />);
        frame();
        expect(container.querySelector('.semi-backtop')).toBeNull();

        scroll(window, 401);
        frame();
        expect(container.querySelector('.semi-backtop')).not.toBeNull();

        scroll(window, 400);
        frame();
        expect(container.querySelector('.semi-backtop')).toBeNull();
    });

    it('挂载时检查滚动位置', () => {
        stub(window, 'scrollY', 1000);
        const { container } = render(<BackTop visibilityHeight={500} />);
        frame();
        expect(container.querySelector('.semi-backtop')).not.toBeNull();
    });

    it('滚动时可见状态不变就不重新渲染', () => {
        const onRender = vi.fn<() => void>();
        render(
            <Profiler id="backtop" onRender={onRender}>
                <BackTop />
            </Profiler>
        );
        scroll(window, 500);
        frame();
        const commits = onRender.mock.calls.length;

        for (const top of [600, 700, 800]) {
            scroll(window, top);
            frame();
        }
        expect(onRender).toHaveBeenCalledTimes(commits);

        scroll(window, 100);
        frame();
        expect(onRender).toHaveBeenCalledTimes(commits + 1);
    });

    it('默认渲染一个圆形原生 FloatButton，图标为回到顶部', () => {
        const { container } = render(<BackTop visibilityHeight={-1} />);
        frame();
        const root = container.querySelector('.semi-backtop');
        expect(root.tagName).toBe('BUTTON');
        expect(root).toHaveAttribute('type', 'button');
        expect(root).not.toHaveAttribute('role');
        expect(root).not.toHaveAttribute('tabindex');
        expect(root).toHaveClass('semi-floatButton', 'semi-floatButton-round', 'semi-floatButton-default');
        expect(root).toHaveAttribute('x-semi-prop', 'children');
        expect(container.querySelectorAll('button, [role="button"]')).toHaveLength(1);
        expect(root.querySelector('.semi-floatButton-body .semi-icon-back_top')).not.toBeNull();
    });

    it('将 icon、shape、size、colorful 与 badge 传给 FloatButton', () => {
        const { container } = render(<BackTop badge={{ dot: true }} colorful shape="square" size="large" visibilityHeight={-1} icon={<i data-testid="icon" />} />);
        frame();
        const root = container.querySelector('.semi-backtop');
        expect(root).toHaveClass('semi-floatButton-square', 'semi-floatButton-large');
        const body = root.querySelector('.semi-floatButton-body');
        expect(body).toHaveClass('semi-floatButton-colorful');
        expect(body.querySelector('[data-testid="icon"]')).not.toBeNull();
        expect(root.querySelector('.semi-icon-back_top')).toBeNull();
        expect(root.querySelector('.semi-badge-dot')).not.toBeNull();
    });

    it('children 作为静态内容渲染在按钮内，替代图标', () => {
        const { container } = render(
            <BackTop visibilityHeight={-1} icon={<i data-testid="icon" />}>
                <span className="custom">UP</span>
            </BackTop>
        );
        frame();
        const root = container.querySelector('.semi-backtop');
        expect(root.tagName).toBe('BUTTON');
        expect(root.querySelector('.semi-floatButton-body .custom')).toHaveTextContent('UP');
        expect(root.querySelector('[data-testid="icon"]')).toBeNull();
        expect(container.querySelectorAll('button, [role="button"]')).toHaveLength(1);
    });

    it.each([false, '', null])('children 为 %j 时视为未传：显示 icon 与默认名称', (children) => {
        const { container } = render(
            <BackTop visibilityHeight={-1} icon={<i data-testid="icon" />}>
                {children}
            </BackTop>
        );
        frame();
        const root = container.querySelector('.semi-backtop');
        expect(root.querySelector('[data-testid="icon"]')).not.toBeNull();
        expect(root).toHaveAttribute('aria-label');
    });

    it('类型：不接受按钮的 type 与 form 系列属性', () => {
        expectTypeOf<BackTopProps>().not.toHaveProperty('type');
        expectTypeOf<BackTopProps>().not.toHaveProperty('form');
        expectTypeOf<BackTopProps>().not.toHaveProperty('formAction');
    });

    it('作为原生 button 时，Enter 与 Space 可触发', async () => {
        // Testing Library waits on a real setTimeout(0) after each user-event call, so setTimeout stays real here
        vi.useFakeTimers({ toFake: ['Date', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
        const user = userEvent.setup();
        const onClick = vi.fn<NonNullable<BackTopProps['onClick']>>();
        const { getByRole } = render(
            <BackTop duration={0} visibilityHeight={-1} onClick={onClick}>
                <span>UP</span>
            </BackTop>
        );
        frame();
        const root = getByRole('button', { name: 'UP' });
        expect(root.tagName).toBe('BUTTON');
        root.focus();
        await user.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].type).toBe('click');
        void act(() => vi.advanceTimersByTime(10));
        await user.keyboard(' ');
        expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('children 含交互元素时在开发环境给出警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { rerender } = render(
            <BackTop visibilityHeight={-1}>
                <span>UP</span>
            </BackTop>
        );
        frame();
        expect(warn).not.toHaveBeenCalled();

        rerender(
            <BackTop visibilityHeight={-1}>
                <a href="#top">UP</a>
            </BackTop>
        );
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toContain('[Semi BackTop]');

        rerender(
            <BackTop visibilityHeight={-1}>
                <span aria-checked="false" role="switch">
                    UP
                </span>
            </BackTop>
        );
        expect(warn).toHaveBeenCalledTimes(2);
    });

    it('将 data-* 与 aria-label 传给按钮', () => {
        const { container, getByRole } = render(<BackTop data-testid="backtop" aria-label="Back to top" visibilityHeight={-1} />);
        frame();
        expect(container.querySelector('.semi-backtop')).toHaveAttribute('data-testid', 'backtop');
        expect(getByRole('button', { name: 'Back to top' })).toBe(container.querySelector('.semi-backtop'));
    });

    it('监听 target 返回的元素而非 window', () => {
        const node = createTarget();
        const { container } = render(<BackTop target={() => node} />);
        frame();

        scroll(window, 1000);
        frame();
        expect(container.querySelector('.semi-backtop')).toBeNull();

        scroll(node, 1000);
        frame();
        expect(container.querySelector('.semi-backtop')).not.toBeNull();
    });

    it('target 的类型是 window、元素或 null，而非 any', () => {
        type TargetReturn = ReturnType<NonNullable<BackTopProps['target']>>;
        expectTypeOf<TargetReturn>().not.toBeAny();
        expectTypeOf<null>().toExtend<TargetReturn>();
        expectTypeOf<Window>().toExtend<TargetReturn>();
        expectTypeOf<HTMLElement>().toExtend<TargetReturn>();
    });

    it('target 返回 null 时不渲染且不抛错', () => {
        const { container } = render(<BackTop target={() => null} visibilityHeight={-1} />);
        frame();
        expect(container.querySelector('.semi-backtop')).toBeNull();
    });

    it('在 duration 内将 target 滚动到顶部，并以事件调用 onClick', () => {
        const node = createTarget();
        const onClick = vi.fn<NonNullable<BackTopProps['onClick']>>();
        const { container } = render(<BackTop duration={300} target={() => node} onClick={onClick} />);
        scroll(node, 1000);
        frame();

        fireEvent.click(container.querySelector('.semi-backtop'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].type).toBe('click');

        void act(() => vi.advanceTimersByTime(150));
        expect(node.scrollTop).toBeGreaterThan(0);
        expect(node.scrollTop).toBeLessThan(1000);

        void act(() => vi.advanceTimersByTime(200));
        expect(node.scrollTop).toBe(0);
    });

    it('target 为 window 时将文档滚动到顶部', () => {
        stub(document.body, 'scrollTop', 1000);
        stub(document.documentElement, 'scrollTop', 1000);
        const { container } = render(<BackTop />);
        scroll(window, 1000);
        frame();

        fireEvent.click(container.querySelector('.semi-backtop'));
        void act(() => vi.advanceTimersByTime(500));
        expect(document.documentElement.scrollTop).toBe(0);
        // the body does not scroll the page in standards mode
        expect(document.body.scrollTop).toBe(1000);
    });

    it('点击按 duration 节流，窗口结束时补触发一次点击', () => {
        const onClick = vi.fn<NonNullable<BackTopProps['onClick']>>();
        const { container } = render(<BackTop duration={300} visibilityHeight={-1} onClick={onClick} />);
        frame();
        const root = container.querySelector('.semi-backtop');

        fireEvent.click(root);
        void act(() => vi.advanceTimersByTime(500));
        expect(onClick).toHaveBeenCalledTimes(1);

        fireEvent.click(root);
        fireEvent.click(root);
        fireEvent.click(root);
        expect(onClick).toHaveBeenCalledTimes(2);
        void act(() => vi.advanceTimersByTime(300));
        expect(onClick).toHaveBeenCalledTimes(3);
    });

    it('卸载时移除滚动监听并停止动画', () => {
        const node = createTarget();
        const remove = vi.spyOn(node, 'removeEventListener');
        const { container, unmount } = render(<BackTop target={() => node} />);
        scroll(node, 1000);
        frame();

        fireEvent.click(container.querySelector('.semi-backtop'));
        void act(() => vi.advanceTimersByTime(100));
        const position = node.scrollTop;
        unmount();
        expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));

        void act(() => vi.advanceTimersByTime(500));
        expect(node.scrollTop).toBe(position);
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { BackTop: { visibilityHeight: 100 } };
        try {
            const { container } = render(<BackTop />);
            scroll(window, 101);
            frame();
            expect(container.querySelector('.semi-backtop')).not.toBeNull();
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('StrictMode 下正常工作', () => {
        const node = createTarget();
        const add = vi.spyOn(node, 'addEventListener');
        const remove = vi.spyOn(node, 'removeEventListener');
        const onClick = vi.fn<NonNullable<BackTopProps['onClick']>>();
        const { container } = render(
            <StrictMode>
                <BackTop target={() => node} onClick={onClick} />
            </StrictMode>
        );
        frame();
        expect(add.mock.calls.length - remove.mock.calls.length).toBe(1);

        scroll(node, 1000);
        frame();
        fireEvent.click(container.querySelector('.semi-backtop'));
        void act(() => vi.advanceTimersByTime(500));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(node.scrollTop).toBe(0);
    });

    it('target 变为其他元素时迁移滚动监听', () => {
        const first = createTarget();
        const second = createTarget();
        const remove = vi.spyOn(first, 'removeEventListener');
        const { container, rerender } = render(<BackTop target={() => first} />);
        frame();

        rerender(<BackTop target={() => second} />);
        expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
        scroll(second, 1000);
        frame();
        expect(container.querySelector('.semi-backtop')).not.toBeNull();
    });

    it('target 读取父容器的 ref 时，监听该容器的滚动', () => {
        function Panel() {
            const container = useRef<HTMLDivElement>(null);
            return (
                <div ref={container} data-testid="panel">
                    <BackTop target={() => container.current} visibilityHeight={500} />
                </div>
            );
        }
        const { container, getByTestId } = render(<Panel />);
        scroll(window, 1000);
        frame();
        expect(container.querySelector('.semi-backtop')).toBeNull();

        scroll(getByTestId('panel'), 1000);
        frame();
        expect(container.querySelector('.semi-backtop')).not.toBeNull();
    });

    it('卸载时丢弃待执行的节流点击', () => {
        const node = createTarget();
        const onClick = vi.fn<NonNullable<BackTopProps['onClick']>>();
        const { container, unmount } = render(<BackTop duration={300} target={() => node} onClick={onClick} />);
        scroll(node, 1000);
        frame();
        const root = container.querySelector('.semi-backtop');

        fireEvent.click(root);
        fireEvent.click(root);
        void act(() => vi.advanceTimersByTime(100));
        const position = node.scrollTop;
        unmount();

        void act(() => vi.advanceTimersByTime(1000));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(node.scrollTop).toBe(position);
    });

    it('duration 不出现在 DOM 上，ref 挂载到根元素', () => {
        const ref = createRef<HTMLButtonElement>();
        const { container } = render(<BackTop ref={ref} duration={300} visibilityHeight={-1} />);
        frame();
        const root = container.querySelector('.semi-backtop');
        expect(root).not.toHaveAttribute('duration');
        expect(ref.current).toBe(root);
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
});
