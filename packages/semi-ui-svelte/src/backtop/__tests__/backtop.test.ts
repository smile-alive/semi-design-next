import { flushSync, tick } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { countLiveListeners } from '@test/utils/dom/common';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { BackTopProps } from '../interface';
import BackTopFixture from './backtop-fixture.svelte';
import ScrollTarget from './scroll-target.svelte';
import WarnChildren from './warn-children.svelte';

type Click = (event: MouseEvent) => void;

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
    await tick();
}
const getRoot = (container: Element) => container.querySelector<HTMLElement>('.semi-backtop');

type Flags = { icon?: boolean; badgeCount?: boolean; children?: string };

function setup(props: BackTopProps = {}, flags: Flags = {}) {
    const store = createStore<{ props: BackTopProps } & Flags>({ props, ...flags });
    const view = render(BackTopFixture, { props: { store } });
    return { store, container: view.container, unmount: view.unmount };
}

describe('Svelte BackTop', () => {
    beforeEach(() => {
        vi.useFakeTimers({
            toFake: ['setTimeout', 'clearTimeout', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        semiGlobal.config = {};
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
        const { container } = setup({ class: 'test', style: 'color: red', visibilityHeight: -1 });
        await frame();
        expect(getRoot(container)).toHaveClass('test');
        expect(getRoot(container)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('点击调用 onclick', async () => {
        const onclick = vi.fn<Click>();
        const { container } = setup({ class: 'test', visibilityHeight: -1, onclick });
        await frame();
        await fireEvent.click(container.querySelector('.semi-backtop.test') as Element);
        expect(onclick).toHaveBeenCalledTimes(1);
        expect(onclick.mock.calls[0][0].type).toBe('click');
    });

    it('窗口滚动超过 visibilityHeight 后显示，低于该值后隐藏', async () => {
        const { container } = setup();
        await frame();
        expect(getRoot(container)).toBeNull();

        await scroll(window, 401);
        await frame();
        expect(getRoot(container)).not.toBeNull();

        await scroll(window, 400);
        await frame();
        expect(getRoot(container)).toBeNull();
    });

    it('visibilityHeight 变化后等下次滚动才判断', async () => {
        const { store, container } = setup({ visibilityHeight: 500 });
        await scroll(window, 450);
        await frame();
        expect(getRoot(container)).toBeNull();

        store.props.visibilityHeight = 100;
        flushSync();
        expect(getRoot(container)).toBeNull();
        await scroll(window, 451);
        await frame();
        expect(getRoot(container)).not.toBeNull();
    });

    it('挂载时检查滚动位置', async () => {
        stub(window, 'scrollY', 1000);
        const { container } = setup({ visibilityHeight: 500 });
        await frame();
        expect(getRoot(container)).not.toBeNull();
    });

    it('滚动时可见状态不变就不更新 DOM', async () => {
        const { container } = setup();
        let mutations = 0;
        const observer = new MutationObserver((records) => {
            mutations += records.length;
        });
        observer.observe(container, { childList: true, subtree: true, attributes: true, characterData: true });
        const settle = async () => {
            await frame();
            await tick();
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
        const { container } = setup({ visibilityHeight: -1 });
        await frame();
        const root = getRoot(container) as HTMLElement;
        expect(root.tagName).toBe('BUTTON');
        expect(root).toHaveAttribute('type', 'button');
        expect(root).not.toHaveAttribute('role');
        expect(root).not.toHaveAttribute('tabindex');
        expect(root).toHaveClass('semi-floatButton', 'semi-floatButton-round', 'semi-floatButton-default');
        expect(root).toHaveAttribute('x-semi-prop', 'children');
        expect(container.querySelectorAll('button, [role="button"]')).toHaveLength(1);
        expect(root.querySelector('.semi-floatButton-body .semi-icon-back_top')).not.toBeNull();
    });

    it('把 icon、shape、size、colorful 与 badge 交给 FloatButton', async () => {
        const { container } = setup({ badge: { dot: true }, colorful: true, shape: 'square', size: 'large', visibilityHeight: -1 }, { icon: true });
        await frame();
        const root = getRoot(container) as HTMLElement;
        expect(root).toHaveClass('semi-floatButton-square', 'semi-floatButton-large');
        const body = root.querySelector('.semi-floatButton-body');
        expect(body).toHaveClass('semi-floatButton-colorful');
        expect(body?.querySelector('[data-testid="icon"]')).not.toBeNull();
        expect(root.querySelector('.semi-icon-back_top')).toBeNull();
        expect(root.querySelector('.semi-badge-dot')).not.toBeNull();
    });

    it('badgeCount snippet 渲染到 Badge 的计数位置', async () => {
        const { container } = setup({ badge: {}, visibilityHeight: -1 }, { badgeCount: true });
        await frame();
        expect(container.querySelector('.semi-badge-custom')).toContainElement(screen.getByTestId('count'));
    });

    it('children 作为静态内容渲染在按钮内，替代图标', async () => {
        const { container } = setup({ visibilityHeight: -1 }, { children: 'UP', icon: true });
        await frame();
        const root = getRoot(container) as HTMLElement;
        expect(root.tagName).toBe('BUTTON');
        expect(root.querySelector('.semi-floatButton-body .custom')).toHaveTextContent('UP');
        expect(root.querySelector('[data-testid="icon"]')).toBeNull();
        expect(container.querySelectorAll('button, [role="button"]')).toHaveLength(1);
    });

    it('children 含交互元素时在开发环境给出警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            const plain = render(WarnChildren, { props: { store: createStore({ kind: 'plain' as const }) } });
            await frame();
            expect(plain.container.querySelector('.semi-backtop')).not.toBeNull();
            expect(warn).not.toHaveBeenCalled();
            plain.unmount();

            const link = render(WarnChildren, { props: { store: createStore({ kind: 'link' as const }) } });
            await frame();
            expect(warn).toHaveBeenCalledTimes(1);
            expect(warn.mock.calls[0][0]).toContain('[Semi BackTop]');
            link.unmount();

            render(WarnChildren, { props: { store: createStore({ kind: 'switch' as const }) } });
            await frame();
            expect(warn).toHaveBeenCalledTimes(2);
        } finally {
            warn.mockRestore();
        }
    });

    it('data-* 与 aria-label 落在按钮上', async () => {
        const { container } = setup({ 'data-testid': 'backtop', 'aria-label': 'Back to top', visibilityHeight: -1 });
        await frame();
        expect(getRoot(container)).toHaveAttribute('data-testid', 'backtop');
        expect(screen.getByRole('button', { name: 'Back to top' })).toBe(getRoot(container));
    });

    it('默认名称来自语言包，aria-label 优先，有 children 时不加默认名称', async () => {
        const plain = setup({ visibilityHeight: -1 });
        await frame();
        expect(screen.getByRole('button', { name: zh_CN.BackTop.backToTop })).toBe(getRoot(plain.container));
        plain.unmount();

        const named = setup({ 'aria-label': 'Top', visibilityHeight: -1 });
        await frame();
        expect(screen.getByRole('button', { name: 'Top' })).toBe(getRoot(named.container));
        named.unmount();

        const withContent = setup({ visibilityHeight: -1 }, { children: 'UP' });
        await frame();
        expect(getRoot(withContent.container)).not.toHaveAttribute('aria-label');
        withContent.unmount();

        const store = createStore({ props: { visibilityHeight: -1 }, locale: en_US });
        render(BackTopFixture, { props: { store } });
        await frame();
        expect(screen.getByRole('button', { name: en_US.BackTop.backToTop })).toBeInTheDocument();
    });

    it('监听 target 返回的元素而非 window', async () => {
        const node = createTarget();
        const { container } = setup({ target: () => node });
        await frame();

        await scroll(window, 1000);
        await frame();
        expect(getRoot(container)).toBeNull();

        await scroll(node, 1000);
        await frame();
        expect(getRoot(container)).not.toBeNull();
    });

    it('target 读取 bind:this 的元素时，挂载时已绑定监听', async () => {
        const view = render(ScrollTarget);
        await frame();
        expect(screen.queryByRole('button', { name: 'Back to top' })).toBeNull();
        await scroll(view.getByTestId('scroller'), 1000);
        await frame();
        expect(screen.getByRole('button', { name: 'Back to top' })).toBeInTheDocument();
    });

    it('target 返回 null 时不渲染且不抛错', async () => {
        const { container } = setup({ target: () => null, visibilityHeight: -1 });
        await frame();
        expect(getRoot(container)).toBeNull();
    });

    it('在 duration 内将 target 滚动到顶部，并调用 onclick', async () => {
        const node = createTarget();
        const onclick = vi.fn<Click>();
        const { container } = setup({ duration: 300, target: () => node, onclick });
        await scroll(node, 1000);
        await frame();

        await fireEvent.click(getRoot(container) as Element);
        expect(onclick).toHaveBeenCalledTimes(1);
        expect(onclick.mock.calls[0][0].type).toBe('click');

        vi.advanceTimersByTime(150);
        expect(node.scrollTop).toBeGreaterThan(0);
        expect(node.scrollTop).toBeLessThan(1000);

        vi.advanceTimersByTime(200);
        expect(node.scrollTop).toBe(0);
    });

    it('target 为 window 时将文档滚动到顶部', async () => {
        stub(document.body, 'scrollTop', 1000);
        stub(document.documentElement, 'scrollTop', 1000);
        const { container } = setup();
        await scroll(window, 1000);
        await frame();

        await fireEvent.click(getRoot(container) as Element);
        vi.advanceTimersByTime(500);
        expect(document.documentElement.scrollTop).toBe(0);
        // the body does not scroll the page in standards mode
        expect(document.body.scrollTop).toBe(1000);
    });

    it('点击按 duration 节流，窗口结束时补触发一次点击', async () => {
        const onclick = vi.fn<Click>();
        const { container } = setup({ duration: 300, visibilityHeight: -1, onclick });
        await frame();
        const root = getRoot(container) as Element;

        await fireEvent.click(root);
        vi.advanceTimersByTime(500);
        expect(onclick).toHaveBeenCalledTimes(1);

        await fireEvent.click(root);
        await fireEvent.click(root);
        await fireEvent.click(root);
        expect(onclick).toHaveBeenCalledTimes(2);
        vi.advanceTimersByTime(300);
        expect(onclick).toHaveBeenCalledTimes(3);
    });

    it('duration 变化后取消旧节流中待执行的点击', async () => {
        const onclick = vi.fn<Click>();
        const { store, container } = setup({ duration: 300, visibilityHeight: -1, onclick });
        await frame();
        const root = getRoot(container) as Element;
        await fireEvent.click(root);
        await fireEvent.click(root);
        expect(onclick).toHaveBeenCalledTimes(1);

        store.props.duration = 100;
        flushSync();
        vi.advanceTimersByTime(1000);
        expect(onclick).toHaveBeenCalledTimes(1);
    });

    it('卸载时移除滚动监听并停止动画', async () => {
        const node = createTarget();
        const add = vi.spyOn(node, 'addEventListener');
        const remove = vi.spyOn(node, 'removeEventListener');
        const { container, unmount } = setup({ target: () => node });
        await scroll(node, 1000);
        await frame();

        await fireEvent.click(getRoot(container) as Element);
        vi.advanceTimersByTime(100);
        const position = node.scrollTop;
        unmount();
        expect(countLiveListeners(add, remove, 'scroll')).toBe(0);

        vi.advanceTimersByTime(500);
        expect(node.scrollTop).toBe(position);
    });

    it('挂载与卸载时滚动监听成对', async () => {
        const node = createTarget();
        const add = vi.spyOn(node, 'addEventListener');
        const remove = vi.spyOn(node, 'removeEventListener');
        const { unmount } = setup({ target: () => node });
        await frame();
        expect(countLiveListeners(add, remove, 'scroll')).toBe(1);

        unmount();
        expect(countLiveListeners(add, remove, 'scroll')).toBe(0);
    });

    it('读取全局默认值，显式属性优先', async () => {
        semiGlobal.config.overrideDefaultProps = { BackTop: { visibilityHeight: 100 } };
        const { container } = setup();
        await scroll(window, 101);
        await frame();
        expect(getRoot(container)).not.toBeNull();

        const explicit = setup({ visibilityHeight: 500 });
        await frame();
        expect(getRoot(explicit.container)).toBeNull();
    });

    it('全局默认的 target 在未传 target 时生效', async () => {
        const node = createTarget();
        semiGlobal.config.overrideDefaultProps = { BackTop: { target: () => node } };
        const { container } = setup();
        await scroll(node, 1000);
        await frame();
        expect(getRoot(container)).not.toBeNull();
    });

    it('BackTop 的全局 shape 优先，未设置的 size 回落到 FloatButton 的全局值', async () => {
        semiGlobal.config.overrideDefaultProps = { BackTop: { shape: 'square' }, FloatButton: { shape: 'round', size: 'small' } };
        const { container } = setup({ visibilityHeight: -1 });
        await frame();
        expect(getRoot(container)).toHaveClass('semi-floatButton-square', 'semi-floatButton-small');
        expect(getRoot(container)).not.toHaveClass('semi-floatButton-round');
    });

    it('target 变为其他元素时迁移滚动监听', async () => {
        const first = createTarget();
        const second = createTarget();
        const remove = vi.spyOn(first, 'removeEventListener');
        const { store, container } = setup({ target: () => first });
        await frame();

        store.props.target = () => second;
        flushSync();
        expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
        await scroll(second, 1000);
        await frame();
        expect(getRoot(container)).not.toBeNull();
    });

    it('卸载时丢弃待执行的节流点击', async () => {
        const node = createTarget();
        const onclick = vi.fn<Click>();
        const { container, unmount } = setup({ duration: 300, target: () => node, onclick });
        await scroll(node, 1000);
        await frame();
        const root = getRoot(container) as Element;

        await fireEvent.click(root);
        await fireEvent.click(root);
        vi.advanceTimersByTime(100);
        const position = node.scrollTop;
        unmount();

        vi.advanceTimersByTime(1000);
        expect(onclick).toHaveBeenCalledTimes(1);
        expect(node.scrollTop).toBe(position);
    });

    it('duration 不出现在 DOM 上', async () => {
        const { container } = setup({ duration: 300, visibilityHeight: -1 });
        await frame();
        expect(getRoot(container)).not.toHaveAttribute('duration');
    });
});
