/** @jsxImportSource vue */
import { nextTick, type ComponentPublicInstance } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import type { BackTopBaseProps } from '@fibrae/semi-foundation/backtop/foundation';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { render } from '@test/utils/vue';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import LocaleProvider from '../../locale/locale-provider.vue';
import BackTop from '../backtop.vue';
import type { BackTopEmits } from '../interface';
import ScrollTarget from './fixtures/scroll-target.vue';
import WarnChildren from './fixtures/warn-children.vue';

// jsdom does not lay out, so scroll positions are stubbed as own properties and restored afterwards
const stubbed: [object, string, PropertyDescriptor | undefined][] = [];
function stub(node: object, key: string, value: unknown) {
    stubbed.push([node, key, Object.getOwnPropertyDescriptor(node, key)]);
    Object.defineProperty(node, key, { value, writable: true, configurable: true });
}
async function scroll(node: Window | HTMLElement, top: number) {
    stub(node, node === window ? 'scrollY' : 'scrollTop', top);
    await fireEvent.scroll(node);
}
const targets: HTMLElement[] = [];
function createTarget() {
    const node = document.createElement('div');
    document.body.append(node);
    targets.push(node);
    return node;
}
async function frame() {
    vi.advanceTimersByTime(16);
    await nextTick();
}
const getRoot = (container: Element) => container.querySelector<HTMLElement>('.semi-backtop');
function globalWith(overrideDefaultProps: SemiGlobal['config']['overrideDefaultProps']) {
    const semi = new SemiGlobal();
    semi.config.overrideDefaultProps = overrideDefaultProps;
    return { provide: { [semiGlobalKey]: semi } };
}

describe('BackTop', () => {
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
                delete (node as Record<string, unknown>)[key];
            }
        }
        for (const node of targets.splice(0)) node.remove();
    });

    it('class 与 style 落在按钮上', async () => {
        const view = render(BackTop, {
            attrs: { class: 'test', style: { color: 'red' } },
            props: { visibilityHeight: -1 },
        });
        await frame();
        expect(getRoot(view.container)).toHaveClass('test');
        expect(getRoot(view.container)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('点击发出 click 事件', async () => {
        const view = render(BackTop, { attrs: { class: 'test' }, props: { visibilityHeight: -1 } });
        await frame();
        await fireEvent.click(view.container.querySelector('.semi-backtop.test') as Element);
        expect(view.emitted().click).toHaveLength(1);
    });

    it('窗口滚动超过 visibilityHeight 后显示，低于该值后隐藏', async () => {
        const view = render(BackTop);
        await frame();
        expect(getRoot(view.container)).toBeNull();

        await scroll(window, 401);
        await frame();
        expect(getRoot(view.container)).not.toBeNull();

        await scroll(window, 400);
        await frame();
        expect(getRoot(view.container)).toBeNull();
    });

    it('挂载时检查滚动位置', async () => {
        stub(window, 'scrollY', 1000);
        const view = render(BackTop, { props: { visibilityHeight: 500 } });
        await frame();
        expect(getRoot(view.container)).not.toBeNull();
    });

    it('滚动时可见状态不变就不更新 DOM', async () => {
        const view = render(BackTop);
        let mutations = 0;
        const observer = new MutationObserver((records) => {
            mutations += records.length;
        });
        observer.observe(view.container, { childList: true, subtree: true, attributes: true, characterData: true });
        const settle = async () => {
            await frame();
            await nextTick();
        };
        try {
            await scroll(window, 500);
            await settle();
            expect(mutations).toBeGreaterThan(0);
            mutations = 0;

            for (const top of [600, 700, 800]) {
                await scroll(window, top);
                await settle();
            }
            expect(mutations).toBe(0);

            await scroll(window, 100);
            await settle();
            expect(mutations).toBeGreaterThan(0);
        } finally {
            observer.disconnect();
        }
    });

    it('默认渲染一个圆形原生 FloatButton，图标为回到顶部', async () => {
        const view = render(BackTop, { props: { visibilityHeight: -1 } });
        await frame();
        const root = getRoot(view.container) as HTMLElement;
        expect(root.tagName).toBe('BUTTON');
        expect(root).toHaveAttribute('type', 'button');
        expect(root).not.toHaveAttribute('role');
        expect(root).not.toHaveAttribute('tabindex');
        expect(root).toHaveClass('semi-floatButton', 'semi-floatButton-round', 'semi-floatButton-default');
        expect(root).toHaveAttribute('x-semi-prop', 'children');
        expect(view.container.querySelectorAll('button, [role="button"]')).toHaveLength(1);
        expect(root.querySelector('.semi-floatButton-body .semi-icon-back_top')).not.toBeNull();
    });

    it('把 #icon、shape、size、colorful 与 badge 交给 FloatButton', async () => {
        const view = render(BackTop, {
            props: { badge: { dot: true }, colorful: true, shape: 'square', size: 'large', visibilityHeight: -1 },
            slots: { icon: () => <i data-testid="icon" /> },
        });
        await frame();
        const root = getRoot(view.container) as HTMLElement;
        expect(root).toHaveClass('semi-floatButton-square', 'semi-floatButton-large');
        const body = root.querySelector('.semi-floatButton-body');
        expect(body).toHaveClass('semi-floatButton-colorful');
        expect(body?.querySelector('[data-testid="icon"]')).not.toBeNull();
        expect(root.querySelector('.semi-icon-back_top')).toBeNull();
        expect(root.querySelector('.semi-badge-dot')).not.toBeNull();
    });

    it('#badgeCount 渲染到 Badge 的计数位置', async () => {
        const view = render(BackTop, {
            props: { badge: {}, visibilityHeight: -1 },
            slots: { badgeCount: () => <b data-testid="count">new</b> },
        });
        await frame();
        expect(view.container.querySelector('.semi-badge-custom')).toContainElement(screen.getByTestId('count'));
    });

    it('默认插槽作为静态内容渲染在按钮内，替代图标', async () => {
        const view = render(BackTop, {
            props: { visibilityHeight: -1 },
            slots: {
                default: () => <span class="custom">UP</span>,
                icon: () => <i data-testid="icon" />,
            },
        });
        await frame();
        const root = getRoot(view.container) as HTMLElement;
        expect(root.tagName).toBe('BUTTON');
        expect(root.querySelector('.semi-floatButton-body .custom')).toHaveTextContent('UP');
        expect(root.querySelector('[data-testid="icon"]')).toBeNull();
        expect(view.container.querySelectorAll('button, [role="button"]')).toHaveLength(1);
    });

    it('挂载与更新时不在 render 外调用默认插槽', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const view = render(BackTop, { props: { visibilityHeight: -1 }, slots: { default: () => <span>UP</span> } });
        await frame();
        await view.rerender({ duration: 100 });
        expect(warn.mock.calls.filter(([message]) => String(message).includes('invoked outside of the render function'))).toEqual([]);
    });

    it('默认插槽只有空文本时仍显示图标', async () => {
        const view = render(BackTop, { props: { visibilityHeight: -1 }, slots: { default: () => '' } });
        await frame();
        expect(view.container.querySelector('.semi-icon-back_top')).not.toBeNull();
    });

    it('作为原生 button 时，Enter 与 Space 可触发', async () => {
        // Testing Library waits on a real setTimeout(0) after each user-event call, so setTimeout stays real here
        vi.useFakeTimers({ toFake: ['Date', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
        const user = userEvent.setup();
        const view = render(BackTop, {
            props: { duration: 0, visibilityHeight: -1 },
            slots: { default: () => <span>UP</span> },
        });
        await frame();
        const root = screen.getByRole('button', { name: 'UP' });
        expect(root.tagName).toBe('BUTTON');
        root.focus();
        await user.keyboard('{Enter}');
        expect(view.emitted().click).toHaveLength(1);
        expect((view.emitted().click[0] as [MouseEvent])[0].type).toBe('click');
        vi.advanceTimersByTime(10);
        await user.keyboard(' ');
        expect(view.emitted().click).toHaveLength(2);
    });

    it('默认插槽含交互元素时在开发环境给出警告，换内容后重新检查', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            const view = render(WarnChildren, { props: { kind: 'plain' } });
            await frame();
            expect(getRoot(view.container)).not.toBeNull();
            expect(warn).not.toHaveBeenCalled();

            await view.rerender({ kind: 'link' });
            expect(warn).toHaveBeenCalledTimes(1);
            expect(warn.mock.calls[0][0]).toContain('[Semi BackTop]');

            await view.rerender({ kind: 'switch' });
            expect(warn).toHaveBeenCalledTimes(2);
        } finally {
            warn.mockRestore();
        }
    });

    it('data-* 与 aria-label 落在按钮上', async () => {
        const view = render(BackTop, {
            attrs: { 'data-testid': 'backtop', 'aria-label': 'Back to top' },
            props: { visibilityHeight: -1 },
        });
        await frame();
        expect(getRoot(view.container)).toHaveAttribute('data-testid', 'backtop');
        expect(screen.getByRole('button', { name: 'Back to top' })).toBe(getRoot(view.container));
    });

    it('默认名称来自语言包，aria-label 优先，有默认插槽时不加默认名称', async () => {
        const plain = render(BackTop, { props: { visibilityHeight: -1 } });
        await frame();
        expect(screen.getByRole('button', { name: zh_CN.BackTop.backToTop })).toBe(getRoot(plain.container));
        plain.unmount();

        const named = render(BackTop, { attrs: { 'aria-label': 'Top' }, props: { visibilityHeight: -1 } });
        await frame();
        expect(screen.getByRole('button', { name: 'Top' })).toBe(getRoot(named.container));
        named.unmount();

        const withContent = render(BackTop, {
            props: { visibilityHeight: -1 },
            slots: { default: () => <span>UP</span> },
        });
        await frame();
        expect(getRoot(withContent.container)).not.toHaveAttribute('aria-label');
        withContent.unmount();

        render(LocaleProvider, {
            props: { locale: en_US },
            slots: { default: () => <BackTop visibilityHeight={-1} /> },
        });
        await frame();
        expect(screen.getByRole('button', { name: en_US.BackTop.backToTop })).toBeInTheDocument();
    });

    it('监听 target 返回的元素而非 window', async () => {
        const node = createTarget();
        const view = render(BackTop, { props: { target: () => node } });
        await frame();

        await scroll(window, 1000);
        await frame();
        expect(getRoot(view.container)).toBeNull();

        await scroll(node, 1000);
        await frame();
        expect(getRoot(view.container)).not.toBeNull();
    });

    it('target 读取模板 ref 时，挂载时已绑定监听', async () => {
        const view = render(ScrollTarget);
        await frame();
        expect(screen.queryByRole('button', { name: 'Back to top' })).toBeNull();
        await scroll(view.getByTestId('scroller'), 1000);
        await frame();
        expect(screen.getByRole('button', { name: 'Back to top' })).toBeInTheDocument();
    });

    it('foundation 的 target 类型允许返回 null', () => {
        type FoundationTarget = NonNullable<BackTopBaseProps['target']>;
        expectTypeOf<null>().toExtend<ReturnType<FoundationTarget>>();
        expectTypeOf<Window>().toExtend<ReturnType<FoundationTarget>>();
    });

    it('target 返回 null 时不渲染且不抛错', async () => {
        const view = render(BackTop, { props: { target: () => null, visibilityHeight: -1 } });
        await frame();
        expect(getRoot(view.container)).toBeNull();
    });

    it('在 duration 内将 target 滚动到顶部，并以事件发出 click', async () => {
        const node = createTarget();
        const view = render(BackTop, { props: { duration: 300, target: () => node } });
        await scroll(node, 1000);
        await frame();

        await fireEvent.click(getRoot(view.container) as Element);
        expect(view.emitted().click).toHaveLength(1);
        expect((view.emitted().click[0] as [MouseEvent])[0].type).toBe('click');

        vi.advanceTimersByTime(150);
        expect(node.scrollTop).toBeGreaterThan(0);
        expect(node.scrollTop).toBeLessThan(1000);

        vi.advanceTimersByTime(200);
        expect(node.scrollTop).toBe(0);
    });

    it('target 为 window 时将文档滚动到顶部', async () => {
        stub(document.body, 'scrollTop', 1000);
        stub(document.documentElement, 'scrollTop', 1000);
        const view = render(BackTop);
        await scroll(window, 1000);
        await frame();

        await fireEvent.click(getRoot(view.container) as Element);
        vi.advanceTimersByTime(500);
        expect(document.documentElement.scrollTop).toBe(0);
        // the body does not scroll the page in standards mode
        expect(document.body.scrollTop).toBe(1000);
    });

    it('点击按 duration 节流，窗口结束时补触发一次点击', async () => {
        const view = render(BackTop, { props: { duration: 300, visibilityHeight: -1 } });
        await frame();
        const root = getRoot(view.container) as Element;

        await fireEvent.click(root);
        vi.advanceTimersByTime(500);
        expect(view.emitted().click).toHaveLength(1);

        await fireEvent.click(root);
        await fireEvent.click(root);
        await fireEvent.click(root);
        expect(view.emitted().click).toHaveLength(2);
        vi.advanceTimersByTime(300);
        expect(view.emitted().click).toHaveLength(3);
    });

    it('click 不落在 FloatButton 的根上，使用方的监听只经过节流', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const view = render(BackTop, { props: { duration: 300, visibilityHeight: -1, onClick } });
        await frame();
        const root = getRoot(view.container) as Element;
        await fireEvent.click(root);
        await fireEvent.click(root);
        await fireEvent.click(root);
        expect(onClick).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(300);
        expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('duration 变化后取消旧节流中待执行的点击', async () => {
        const view = render(BackTop, { props: { duration: 300, visibilityHeight: -1 } });
        await frame();
        const root = getRoot(view.container) as Element;
        await fireEvent.click(root);
        await fireEvent.click(root);
        expect(view.emitted().click).toHaveLength(1);

        await view.rerender({ duration: 100 });
        vi.advanceTimersByTime(1000);
        expect(view.emitted().click).toHaveLength(1);
    });

    it('卸载时移除滚动监听并停止动画', async () => {
        const node = createTarget();
        const remove = vi.spyOn(node, 'removeEventListener');
        const view = render(BackTop, { props: { target: () => node } });
        await scroll(node, 1000);
        await frame();

        await fireEvent.click(getRoot(view.container) as Element);
        vi.advanceTimersByTime(100);
        const position = node.scrollTop;
        view.unmount();
        expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));

        vi.advanceTimersByTime(500);
        expect(node.scrollTop).toBe(position);
    });

    it('挂载与卸载时滚动监听成对', async () => {
        const node = createTarget();
        const add = vi.spyOn(node, 'addEventListener');
        const remove = vi.spyOn(node, 'removeEventListener');
        const view = render(BackTop, { props: { target: () => node } });
        await frame();
        expect(add.mock.calls.length - remove.mock.calls.length).toBe(1);

        view.unmount();
        expect(add.mock.calls.length - remove.mock.calls.length).toBe(0);
    });

    it('读取 app 的全局默认值，显式属性优先', async () => {
        const global = globalWith({ BackTop: { visibilityHeight: 100 } });
        const view = render(BackTop, { global });
        await scroll(window, 101);
        await frame();
        expect(getRoot(view.container)).not.toBeNull();

        const explicit = render(BackTop, { global, props: { visibilityHeight: 500 } });
        await frame();
        expect(getRoot(explicit.container)).toBeNull();
    });

    it('全局默认的 target 在未传 target 时生效', async () => {
        const node = createTarget();
        const view = render(BackTop, { global: globalWith({ BackTop: { target: () => node } }) });
        await scroll(node, 1000);
        await frame();
        expect(getRoot(view.container)).not.toBeNull();
    });

    it('BackTop 的全局 shape 优先，未设置的 size 回落到 FloatButton 的全局值', async () => {
        const view = render(BackTop, {
            global: globalWith({ BackTop: { shape: 'square' }, FloatButton: { shape: 'round', size: 'small' } }),
            props: { visibilityHeight: -1 },
        });
        await frame();
        expect(getRoot(view.container)).toHaveClass('semi-floatButton-square', 'semi-floatButton-small');
        expect(getRoot(view.container)).not.toHaveClass('semi-floatButton-round');
    });

    it('target 变为其他元素时迁移滚动监听', async () => {
        const first = createTarget();
        const second = createTarget();
        const remove = vi.spyOn(first, 'removeEventListener');
        const view = render(BackTop, { props: { target: () => first } });
        await frame();

        await view.rerender({ target: () => second });
        expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
        await scroll(second, 1000);
        await frame();
        expect(getRoot(view.container)).not.toBeNull();
    });

    it('卸载时丢弃待执行的节流点击', async () => {
        const node = createTarget();
        const view = render(BackTop, { props: { duration: 300, target: () => node } });
        await scroll(node, 1000);
        await frame();
        const root = getRoot(view.container) as Element;

        await fireEvent.click(root);
        await fireEvent.click(root);
        vi.advanceTimersByTime(100);
        const position = node.scrollTop;
        const emitted = view.emitted().click;
        view.unmount();

        vi.advanceTimersByTime(1000);
        expect(emitted).toHaveLength(1);
        expect(node.scrollTop).toBe(position);
    });

    it('duration 不出现在 DOM 上，组件 ref 的 $el 在隐藏时是占位注释，显示时是按钮', async () => {
        const holder: { instance?: ComponentPublicInstance | null } = {};
        const view = render(() => (
            <BackTop
                duration={300}
                visibilityHeight={-1}
                ref={(value) => {
                    holder.instance = value as ComponentPublicInstance | null;
                }}
            />
        ));
        expect(holder.instance?.$el.nodeType).toBe(Node.COMMENT_NODE);
        await frame();
        const root = getRoot(view.container) as HTMLElement;
        expect(root).not.toHaveAttribute('duration');
        expect(holder.instance?.$el).toBe(root);
        expect(holder.instance?.$el).toBeInstanceOf(HTMLButtonElement);
    });

    it('click 载荷类型是原生 MouseEvent', () => {
        expectTypeOf<BackTopEmits['click']>().toEqualTypeOf<[event: MouseEvent]>();
    });
});
