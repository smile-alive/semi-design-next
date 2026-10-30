import { createRawSnippet, flushSync, type Snippet, tick } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import { Toast, ToastFactory } from '../index';
import type { ToastHookApi, ToastHookOptions, ToastProps } from '../interface';
import ToastItem from '../toast.svelte';
import HookHost from './hook-host.svelte';
import ItemRef from './item-ref.svelte';
import ProviderHost from './provider-host.svelte';
import Snippets from './snippets.svelte';

const prefix = 'semi-toast';
const getInfoToast = () => document.querySelector<HTMLElement>(`.${prefix}-info`);
const texts = (selector = `.${prefix}-info`) => [...document.querySelectorAll(selector)].map((toast) => toast.textContent?.trim());
const innerWrapper = (root: ParentNode = document) => root.querySelector(`.${prefix}-innerWrapper`) as HTMLElement;
// The animation classes sit on the element around the toast
const wrapperOf = (toast: Element | null) => toast?.parentElement;
const text = (html: string) => createRawSnippet(() => ({ render: () => html }));

async function show(opts: Omit<ToastProps, 'type'> | string) {
    Toast.info(opts);
    await tick();
}
async function advance(ms: number) {
    vi.advanceTimersByTime(ms);
    await tick();
}
async function dispatch(el: Element, type: string) {
    el.dispatchEvent(new Event(type));
    await tick();
}
// jsdom runs no CSS animations, and the toast ends a run without one at once. Reports a running animation so the toasts
// stay in their enter and leave phases until the test ends them.
const holdAnimations = () => vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([{ animationName: 'running' } as unknown as Animation]);
async function endAnimations(phase: 'show' | 'hide') {
    for (const el of document.querySelectorAll(`[class*="-animation-${phase}"]`)) {
        el.dispatchEvent(Object.assign(new Event('animationend'), { animationName: `semi-toast-keyframe-toast-${phase}` }));
    }
    await tick();
}
function renderHook(props: { reachable?: string } = {}) {
    const result = {} as { api: ToastHookApi; reach: ToastHookOptions['content'] };
    render(HookHost, {
        props: {
            ...props,
            onApi: (api, reach) => {
                result.api = api;
                result.reach = reach;
            },
        },
    });
    // hook toasts are mounted into the body
    return { ...result, holder: document.body };
}

describe('Toast', () => {
    beforeEach(() => {
        vi.useRealTimers();
    });
    afterEach(() => {
        Toast.destroyAll();
        Toast.resetConfig();
        semiGlobal.config.overrideDefaultProps = {};
        vi.useRealTimers();
    });

    it('基础展示 Toast 及其内容', async () => {
        await show('semi');
        expect(getInfoToast()).toHaveTextContent(/^semi$/);
    });

    it('theme: light 主题', async () => {
        await show({ content: 'semi', theme: 'light' });
        expect(getInfoToast()).toHaveClass(`${prefix}-light`);
    });

    it('duration 大于 0 时到点关闭，motion 为 false 时无动画', async () => {
        vi.useFakeTimers();
        await show({ duration: 1, content: 'dur1', motion: false });
        expect(getInfoToast()).toHaveTextContent(/^dur1$/);
        expect(wrapperOf(getInfoToast())).toHaveClass(`${prefix}-no-motion`);
        await advance(999);
        expect(getInfoToast()).not.toBeNull();
        await advance(1);
        expect(getInfoToast()).toBeNull();
    });

    it('显式传入 undefined 的 duration 等同未传，沿用 Toast.config 的值', async () => {
        vi.useFakeTimers();
        Toast.config({ duration: 10 });
        await show({ content: 'configured', duration: undefined, motion: false });
        await advance(3500);
        expect(getInfoToast()).toHaveTextContent(/^configured$/);
        await advance(7000);
        expect(getInfoToast()).toBeNull();
    });

    it('按 id 更新内容，保留同一个元素', async () => {
        vi.useFakeTimers();
        const id = 'toastid';
        await show({ content: 'bytedance', id, motion: false });
        const toast = getInfoToast();
        expect(toast).toHaveTextContent(/^bytedance$/);
        await advance(1000);
        await show({ content: 'dancebyte', id, motion: false });
        expect(toast).toHaveTextContent(/^dancebyte$/);
        await advance(1000);
        Toast.error({ content: 'error', id, motion: false });
        await tick();
        expect(toast).toHaveTextContent(/^error$/);
        expect(toast?.className).toBe(`${prefix} ${prefix}-error`);
    });

    it('duration 后触发 onClose', async () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        await show({ onClose, content: 'bytedance', duration: 0.8 });
        await advance(799);
        expect(onClose).not.toHaveBeenCalled();
        await advance(1);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledWith();
    });

    it('点击关闭按钮时触发 onClose，并以 id 通知列表移除', async () => {
        const onClose = vi.fn<() => void>();
        const close = vi.fn<(id: string) => void>();
        const view = render(ToastItem, { props: { id: 'x', content: 'bytedance', onClose, close } });
        await fireEvent.click(view.getByRole('button'));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledWith();
        expect(close).toHaveBeenCalledExactlyOnceWith('x');
    });

    it('showClose = false', () => {
        const view = render(ToastItem, { props: { content: 'showCloseToast', duration: 1, showClose: false } });
        expect(view.container.querySelector(`.${prefix}-close-button`)).toBeNull();
        expect(view.queryByRole('button')).toBeNull();
    });

    it('关闭按钮有语言包名称，图标带 x-semi-prop', () => {
        const view = render(ToastItem, { props: { content: 'semi' } });
        expect(view.getByRole('button')).toHaveAccessibleName(zh_CN.Toast.close);
        expect(view.container.querySelector(`.${prefix}-close-button [x-semi-prop="icon"]`)).not.toBeNull();
    });

    it('icon 接受字符串与 snippet，替换 type 的默认图标', () => {
        const content = (icon: ToastProps['icon']) => render(ToastItem, { props: { content: 'semi', type: 'info', icon } }).container.querySelector(`.${prefix}-content`);
        expect(content('!')).toHaveTextContent(/^! semi$/);
        expect(content('!')?.querySelector(`.${prefix}-icon`)).toBeNull();
        const custom = content(text('<i class="fn-icon"></i>'));
        expect(custom?.querySelector('.fn-icon')).not.toBeNull();
        expect(custom?.querySelector(`.${prefix}-icon`)).toBeNull();
    });

    it('指定 getPopupContainer', async () => {
        const container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
        const ContainerToast = ToastFactory.create({ getPopupContainer: () => container });
        ContainerToast.info('specific getPopupContainer');
        await tick();
        expect(document.getElementById(ContainerToast.getWrapperId() ?? '')?.parentNode).toBe(container);
        expect(container).toHaveTextContent('specific getPopupContainer');
        ContainerToast.destroyAll();
        container.remove();
    });

    it('resetConfig 恢复内置默认值', async () => {
        Toast.config({ top: '400px', theme: 'light', zIndex: 2333, duration: 0 });
        Toast.resetConfig();
        await show('semi');
        const wrapper = document.getElementById(Toast.getWrapperId() ?? '') as HTMLElement;
        expect(wrapper.style.zIndex).toBe('1010');
        expect(wrapper.style.top).toBe('');
        expect(getInfoToast()).not.toHaveClass(`${prefix}-light`);
        expect(Toast.defaultOpts.duration).toBeUndefined();
    });

    it('ToastFactory 实例上的 resetConfig 恢复其创建时的配置', async () => {
        const Other = ToastFactory.create({ top: 77, zIndex: 3000, duration: 5 });
        Other.config({ top: 10, zIndex: 4000, duration: 9 });
        Other.resetConfig();
        expect(Other.defaultOpts).toMatchObject({ top: 77, zIndex: 3000, duration: 5 });
        Other.info('other');
        await tick();
        const wrapper = document.getElementById(Other.getWrapperId() ?? '') as HTMLElement;
        expect(wrapper.style.top).toBe('77px');
        expect(wrapper.style.zIndex).toBe('3000');
        Other.destroyAll();
    });

    it('每次调用都应用 zIndex', async () => {
        await show('a');
        Toast.info({ content: 'b', zIndex: 2000 });
        await tick();
        expect(document.getElementById(Toast.getWrapperId() ?? '')?.style.zIndex).toBe('2000');
        Toast.config({ zIndex: 2100 });
        await show('c');
        expect(document.getElementById(Toast.getWrapperId() ?? '')?.style.zIndex).toBe('2100');
    });

    it('同一批次中的所有 Toast 都保持显示', async () => {
        await show('first');
        Toast.info('second');
        Toast.info({ id: 'same', content: 'v1' });
        Toast.info({ id: 'same', content: 'v2' });
        await tick();
        expect(texts()).toEqual(['first', 'second', 'v2']);
    });

    it('同一批次关闭的 Toast 都播放离场动画', async () => {
        holdAnimations();
        const hideCls = `${prefix}-animation-hide`;
        await show({ id: 'a', content: 'a', duration: 0 });
        await show({ id: 'b', content: 'b', duration: 0 });
        Toast.close('a');
        Toast.close('b');
        await tick();
        expect([...document.querySelectorAll(`.${prefix}-info`)].map((toast) => [toast.textContent?.trim(), wrapperOf(toast)?.classList.contains(hideCls)])).toEqual([
            ['a', true],
            ['b', true],
        ]);
        await show({ id: 'c', content: 'c', duration: 0 });
        expect(texts()).toEqual(expect.arrayContaining(['a', 'b', 'c']));
        await endAnimations('hide');
        expect(texts()).toEqual(['c']);
    });

    it('没有动画的环境里，离场的 Toast 立即移除', async () => {
        await show({ id: 'a', content: 'a', duration: 0 });
        Toast.close('a');
        await tick();
        expect(getInfoToast()).toBeNull();
    });

    it('渲染各类型的类名、图标与角色，没有 type 的 Toast 不显示图标', async () => {
        const types = ['info', 'success', 'warning', 'error'] as const;
        types.forEach((type) => Toast[type]({ content: type, duration: 0 }));
        Toast.create({ content: 'plain', duration: 0 });
        await tick();
        for (const type of types) {
            const role = type === 'warning' || type === 'error' ? 'alert' : 'status';
            const toast = screen.getByRole(role, { name: zh_CN.Toast[type] });
            expect(toast).toHaveClass(prefix, `${prefix}-${type}`);
            expect(toast.querySelector(`.${prefix}-icon-${type}`)).not.toBeNull();
        }
        const plain = screen.getByRole('status', { name: zh_CN.Toast.default });
        expect(plain).toHaveTextContent(/^plain$/);
        expect(plain.querySelector(`.${prefix}-icon`)).toBeNull();
        expect(plain).not.toHaveClass(`${prefix}-undefined`);
    });

    it('悬停时暂停关闭计时器', async () => {
        vi.useFakeTimers();
        await show({ content: 'hover', duration: 1, motion: false });
        await advance(500);
        await dispatch(innerWrapper(), 'mouseenter');
        await advance(2000);
        expect(getInfoToast()).not.toBeNull();
        await dispatch(innerWrapper(), 'mouseleave');
        await advance(999);
        expect(getInfoToast()).not.toBeNull();
        await advance(1);
        expect(getInfoToast()).toBeNull();
    });

    it('duration 为 0 时不会自动关闭', async () => {
        vi.useFakeTimers();
        await show({ content: 'stay', duration: 0, motion: false });
        await advance(60_000);
        expect(getInfoToast()).toHaveTextContent(/^stay$/);
    });

    it('关闭按钮只触发一次 onClose，Toast.close 不触发', async () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        await show({ id: 'btn', content: 'btn', duration: 1, motion: false, onClose });
        await advance(1);
        getInfoToast()?.querySelector('button')?.click();
        await tick();
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(getInfoToast()).toBeNull();
        await advance(2000);
        expect(onClose).toHaveBeenCalledTimes(1);

        const onManualClose = vi.fn<() => void>();
        await show({ id: 'manual', content: 'manual', duration: 1, motion: false, onClose: onManualClose });
        Toast.close('manual');
        await tick();
        expect(getInfoToast()).toBeNull();
        await advance(2000);
        expect(onManualClose).not.toHaveBeenCalled();
    });

    it('离场动画期间再次点击关闭按钮，onClose 只触发一次', async () => {
        vi.useFakeTimers();
        holdAnimations();
        const onClose = vi.fn<() => void>();
        await show({ content: 'twice', duration: 0, onClose });
        await advance(1);
        const button = getInfoToast()?.querySelector('button');
        button?.click();
        await tick();
        expect(wrapperOf(getInfoToast())).toHaveClass(`${prefix}-animation-hide`);
        await advance(1);
        button?.click();
        await tick();
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('Toast.close 进入离场后，剩余计时到期不触发 onClose', async () => {
        vi.useFakeTimers();
        holdAnimations();
        const onClose = vi.fn<() => void>();
        await show({ id: 'leaving', content: 'leaving', duration: 1, onClose });
        await advance(900);
        Toast.close('leaving');
        await tick();
        expect(wrapperOf(getInfoToast())).toHaveClass(`${prefix}-animation-hide`);
        await advance(200);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('ToastFactory 实例各自保留容器和配置', async () => {
        const Other = ToastFactory.create({ top: 77, zIndex: 3000 });
        Toast.info({ content: 'main', duration: 0 });
        Other.info({ content: 'other', duration: 0 });
        await tick();
        const main = document.getElementById(Toast.getWrapperId() ?? '') as HTMLElement;
        const other = document.getElementById(Other.getWrapperId() ?? '') as HTMLElement;
        expect(main).not.toBe(other);
        expect(main.style.zIndex).toBe('1010');
        expect(main.style.top).toBe('');
        expect(other.style.top).toBe('77px');
        expect(other.style.zIndex).toBe('3000');
        expect(main).toHaveTextContent(/^main$/);
        expect(other).toHaveTextContent(/^other$/);
        Other.destroyAll();
        expect(other.isConnected).toBe(false);
        expect(Other.getWrapperId()).toBeNull();
        expect(main).toHaveTextContent(/^main$/);
    });

    it('destroyAll 返回时容器已移除，再次调用可重新展示', async () => {
        await show('semi');
        Toast.destroyAll();
        expect(document.querySelector(`.${prefix}-wrapper`)).toBeNull();
        expect(Toast.getWrapperId()).toBeNull();
        await show('again');
        expect(getInfoToast()).toHaveTextContent(/^again$/);
    });

    it('destroyAll 清除未到点的计时器', async () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        await show({ content: 'x', duration: 1, onClose });
        Toast.destroyAll();
        await advance(2000);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('useToast 把 Toast 挂到 body，并按 id 关闭', async () => {
        const { api, holder } = renderHook();
        const id = api.success({ content: 'hook', duration: 0 });
        api.info({ content: 'hook2', duration: 0 });
        await tick();
        expect(holder.querySelectorAll(`.${prefix}`)).toHaveLength(2);
        expect(holder.querySelector(`.${prefix}-success`)).toHaveTextContent(/^hook$/);
        api.close(id);
        await tick();
        expect(holder.querySelector(`.${prefix}-success`)).toBeNull();
        expect(holder.querySelectorAll(`.${prefix}`)).toHaveLength(1);
    });

    it('useToast 关闭 Toast 时先播放离场动画，动画结束后才移除', async () => {
        holdAnimations();
        const { api, holder } = renderHook();
        const id = api.info({ content: 'hook', duration: 0 });
        await tick();
        api.close(id);
        await tick();
        expect(wrapperOf(holder.querySelector(`.${prefix}-info`))).toHaveClass(`${prefix}-animation-hide`);
        await endAnimations('hide');
        expect(holder.querySelector(`.${prefix}`)).toBeNull();
        api.info({ content: 'again', duration: 0 });
        await tick();
        await fireEvent.click(holder.querySelector('button') as HTMLButtonElement);
        expect(wrapperOf(holder.querySelector(`.${prefix}-info`))).toHaveClass(`${prefix}-animation-hide`);
        await endAnimations('hide');
        expect(holder.querySelector(`.${prefix}`)).toBeNull();
    });

    it('useToast 的 Toast 读到调用组件的 context，静态 Toast 读不到', async () => {
        const { api, reach, holder } = renderHook({ reachable: 'Light' });
        api.success({ content: reach, duration: 0 });
        await show({ content: reach, duration: 0 });
        await tick();
        expect(holder.querySelector(`.${prefix}-success`)).toHaveTextContent('ReachableContext: Light');
        expect(getInfoToast()).toHaveTextContent('ReachableContext: none');
    });

    it('调用组件卸载时移除 hook 挂载的 Toast', async () => {
        let api!: ToastHookApi;
        const view = render(HookHost, { props: { onApi: (toast: ToastHookApi) => (api = toast) } });
        api.info({ content: 'hook', duration: 0 });
        await tick();
        expect(document.querySelectorAll(`.${prefix}-wrapper`)).toHaveLength(1);
        view.unmount();
        expect(document.querySelectorAll(`.${prefix}-wrapper`)).toHaveLength(0);
    });

    it('useToast 的类型：只返回 api，hook 选项不含定位项', () => {
        expectTypeOf<ReturnType<typeof Toast.useToast>>().toEqualTypeOf<ToastHookApi>();
        for (const method of ['success', 'info', 'error', 'warning', 'open'] as const) {
            expectTypeOf<Parameters<ToastHookApi[typeof method]>>().toEqualTypeOf<[ToastHookOptions]>();
        }
        expectTypeOf<ToastHookApi['close']>().toEqualTypeOf<(id: string) => void>();
        expectTypeOf<ToastHookOptions>().not.toHaveProperty('top');
        expectTypeOf<ToastHookOptions>().not.toHaveProperty('zIndex');
    });

    it('选项类型接受 data-* 与 aria-* 属性', () => {
        expectTypeOf({ content: 'a', 'data-testid': 'x', 'aria-describedby': 'y' }).toExtend<ToastProps>();
        expectTypeOf({ content: 'a', 'data-testid': 'x' }).toExtend<ToastHookOptions>();
        // @ts-expect-error only data-* and aria-* are open
        const unknownKey: ToastProps = { content: 'a', extra: 1 };
        expect(unknownKey).toBeDefined();
    });

    it('useToast 读取 overrideDefaultProps.Toast，不写死 duration', async () => {
        vi.useFakeTimers();
        semiGlobal.config.overrideDefaultProps = { Toast: { duration: 0 } };
        const { api, holder } = renderHook();
        api.info({ content: 'hook' });
        await tick();
        await advance(10_000);
        expect(holder.querySelector(`.${prefix}-info`)).toHaveTextContent(/^hook$/);
    });

    it('useToast 继承调用组件所在 ConfigProvider 的语言与方向，静态 Toast 仍为默认语言', async () => {
        let api!: ToastHookApi;
        render(ProviderHost, { props: { onApi: (toast: ToastHookApi) => (api = toast) } });
        api.info({ content: 'hook', duration: 0 });
        await show({ content: 'static', duration: 0 });
        const hooked = [...document.querySelectorAll<HTMLElement>(`.${prefix}-info`)].find((el) => el.textContent?.trim() === 'hook') as HTMLElement;
        expect(hooked).toHaveAttribute('aria-label', ja_JP.Toast.info);
        expect(hooked).toHaveAttribute('dir', 'rtl');
        expect(hooked.querySelector('button')).toHaveAccessibleName(ja_JP.Toast.close);
        const staticToast = document.getElementById(Toast.getWrapperId() ?? '')?.querySelector(`.${prefix}-info`);
        expect(staticToast).toHaveTextContent(/^static$/);
        expect(staticToast).toHaveAttribute('aria-label', zh_CN.Toast.info);
        expect(staticToast).not.toHaveAttribute('dir');
    });

    it('读取 semiGlobal overrideDefaultProps.Toast 中的默认值', async () => {
        semiGlobal.config.overrideDefaultProps = { Toast: { theme: 'light', showClose: false, top: 12 } };
        await show({ content: 'global', duration: 0 });
        expect(getInfoToast()).toHaveClass(`${prefix}-light`);
        expect(getInfoToast()?.querySelector('button')).toBeNull();
        expect(document.getElementById(Toast.getWrapperId() ?? '')?.style.top).toBe('12px');
        Toast.success({ content: 'own', duration: 0, theme: 'normal', showClose: true });
        await tick();
        const own = document.querySelector(`.${prefix}-success`);
        expect(own).not.toHaveClass(`${prefix}-light`);
        expect(own?.querySelector('button')).not.toBeNull();
        const view = render(ToastItem, { props: { content: 'item' } });
        expect(view.container.querySelector('button')).toBeNull();
    });

    it('全局默认值里的 id 不生效，每条 toast 的 id 各不相同', async () => {
        semiGlobal.config.overrideDefaultProps = { Toast: { id: 'shared', duration: 0 } as object };
        const first = Toast.info({ content: 'a' });
        const second = Toast.info({ content: 'b' });
        await tick();
        expect(first).not.toBe('shared');
        expect(first).not.toBe(second);
    });

    it('单项到点只通知一次 close 与 onClose', async () => {
        vi.useFakeTimers();
        const close = vi.fn<(id: string) => void>();
        const onClose = vi.fn<() => void>();
        render(ToastItem, { props: { id: 'strict', content: 'strict', duration: 1, close, onClose } });
        await advance(1000);
        expect(close).toHaveBeenCalledExactlyOnceWith('strict');
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('手动点击关闭后，计时到期不再通知第二次 onClose', async () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        const view = render(ToastItem, { props: { id: 'manual', content: 'manual', duration: 1, onClose } });
        await advance(500);
        view.container.querySelector('button')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await tick();
        expect(onClose).toHaveBeenCalledTimes(1);
        await advance(5000);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('离场中的 Toast 保留其在列表中的位置', async () => {
        holdAnimations();
        await show({ id: 'a', content: 'a', duration: 0 });
        Toast.info({ id: 'b', content: 'b', duration: 0 });
        Toast.info({ id: 'c', content: 'c', duration: 0 });
        await tick();
        Toast.close('b');
        await tick();
        expect(texts()).toEqual(['a', 'b', 'c']);
        await show({ id: 'b', content: 'b2', duration: 0 });
        expect(texts()).toEqual(['a', 'c', 'b2']);
    });

    it('按 id 更新 Toast 会重新开始计时 duration', async () => {
        vi.useFakeTimers();
        await show({ id: 'u', content: 'v1', duration: 1, motion: false });
        await advance(800);
        await show({ id: 'u', content: 'v2', duration: 1, motion: false });
        await advance(999);
        expect(getInfoToast()).toHaveTextContent(/^v2$/);
        await advance(1);
        expect(getInfoToast()).toBeNull();
    });

    it('离场途中以同一 id 再次显示时取消离场并重新计时 duration', async () => {
        vi.useFakeTimers();
        holdAnimations();
        const hideCls = `${prefix}-animation-hide`;
        await show({ id: 'r', content: 'v1', duration: 1 });
        await advance(800);
        Toast.close('r');
        await tick();
        expect(wrapperOf(getInfoToast())).toHaveClass(hideCls);
        await show({ id: 'r', content: 'v2', duration: 1 });
        expect(texts()).toEqual(['v2']);
        expect(wrapperOf(getInfoToast())).toHaveClass(`${prefix}-animation-show`);
        expect(wrapperOf(getInfoToast())).not.toHaveClass(hideCls);
        await advance(999);
        expect(getInfoToast()).toHaveTextContent(/^v2$/);
        expect(wrapperOf(getInfoToast())).not.toHaveClass(hideCls);
        await advance(1);
        expect(wrapperOf(getInfoToast())).toHaveClass(hideCls);
    });

    it('data-* 等未知选项透传到 Toast 元素，id 与列表级选项除外', async () => {
        const opts = { id: 'own-id', content: 'attrs', duration: 0, 'data-testid': 'toast-attrs' };
        await show(opts);
        expect(screen.getByTestId('toast-attrs')).toBe(getInfoToast());
        expect(document.getElementById('own-id')).toBeNull();
        expect(getInfoToast()).not.toHaveAttribute('zindex');
        expect(getInfoToast()).not.toHaveAttribute('getpopupcontainer');
        const stackedOpts = { ...opts, id: 'stacked', 'data-testid': 'stacked', stack: true };
        await show(stackedOpts);
        const stacked = screen.getByTestId('stacked');
        expect(stacked).toHaveClass(prefix);
        expect(stacked.parentElement).toHaveClass(`${prefix}-zero-height-wrapper`);
        expect(stacked.parentElement).not.toHaveAttribute('data-testid');
        expect(stacked).not.toHaveAttribute('stack');

        const view = render(ToastItem, { props: { content: 'item', 'data-foo': 'bar' } });
        const item = view.container.querySelector(`.${prefix}`);
        expect(item).toHaveAttribute('data-foo', 'bar');
        expect(item).toHaveAttribute('role', 'status');
        expect(item?.parentElement).not.toHaveAttribute('data-foo');
    });

    it('没有方向时不输出 dir，保留使用方传入的 dir', () => {
        const view = render(ToastItem, { props: { content: 'item' } });
        expect(view.container.querySelector(`.${prefix}`)).not.toHaveAttribute('dir');
        const own = render(ToastItem, { props: { content: 'own', dir: 'rtl' } });
        expect(own.container.querySelector(`.${prefix}`)).toHaveAttribute('dir', 'rtl');
    });

    it('单个 Toast 的实例暴露 restartCloseTimer', async () => {
        vi.useFakeTimers();
        let handle!: { restartCloseTimer: () => void };
        const onRemove = vi.fn<(id: string) => void>();
        render(ItemRef, { props: { onHandle: (h: typeof handle) => (handle = h), onRemove } });
        await advance(800);
        handle.restartCloseTimer();
        await advance(999);
        expect(onRemove).not.toHaveBeenCalled();
        await advance(1);
        expect(onRemove).toHaveBeenCalledExactlyOnceWith('r');
    });

    it('悬停期间按同 id 更新不会重启计时，移出后满 duration 才关闭且 onClose 只触发一次', async () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        await show({ id: 'progress', content: '10%', duration: 1, motion: false, onClose });
        await dispatch(innerWrapper(), 'mouseenter');
        await show({ id: 'progress', content: '50%', duration: 1, motion: false, onClose });
        await advance(5000);
        expect(getInfoToast()).toHaveTextContent(/^50%$/);

        await dispatch(innerWrapper(), 'mouseleave');
        await advance(999);
        expect(getInfoToast()).not.toBeNull();
        await advance(1);
        expect(getInfoToast()).toBeNull();
        await advance(5000);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('stack 模式下悬停已更新的 Toast 会保持打开', async () => {
        vi.useFakeTimers();
        await show({ id: 'x', content: 'v1', duration: 1, motion: false, stack: true });
        await show({ id: 'x', content: 'v2', duration: 1, motion: false, stack: true });
        await dispatch(innerWrapper(), 'mouseenter');
        await advance(2000);
        expect(getInfoToast()).toHaveTextContent(/^v2$/);
    });

    it('两次调用间切换 stack 不重启已显示 Toast 的计时', async () => {
        vi.useFakeTimers();
        await show({ id: 'a', content: 'a', duration: 1, motion: false });
        const flat = getInfoToast();
        await advance(500);
        await show({ id: 'b', content: 'b', duration: 0, motion: false, stack: true });
        expect(getInfoToast()?.parentElement).toHaveClass(`${prefix}-zero-height-wrapper`);
        expect(getInfoToast()).toBe(flat);
        await advance(500);
        expect(texts()).toEqual(['b']);
    });

    it('content 接受字符串与 snippet，snippet 随响应式数据更新', async () => {
        const store = createStore({ count: 1 });
        let snippets!: { bold: Snippet; counter: Snippet };
        render(Snippets, { props: { store, onSnippets: (given: typeof snippets) => (snippets = given) } });
        await show({ content: 'div', duration: 0 });
        const content = () => getInfoToast()?.querySelector(`.${prefix}-content-text`);
        expect(content()?.children).toHaveLength(0);
        expect(content()).toHaveTextContent(/^div$/);
        Toast.destroyAll();

        await show({ content: snippets.bold, duration: 0 });
        expect(content()?.querySelector('b')).toHaveTextContent('bold');
        Toast.destroyAll();

        await show({ content: snippets.counter, duration: 0 });
        const toast = getInfoToast();
        expect(content()).toHaveTextContent(/^count 1$/);
        store.count = 2;
        flushSync();
        expect(content()).toHaveTextContent(/^count 2$/);
        expect(getInfoToast()).toBe(toast);
    });

    it('textMaxWidth 数字补 px，字符串原样', () => {
        const width = (textMaxWidth: number | string) => render(ToastItem, { props: { content: 'semi', textMaxWidth } }).container.querySelector<HTMLElement>(`.${prefix}-content-text`)?.style.maxWidth;
        expect(width(450)).toBe('450px');
        expect(width('50%')).toBe('50%');
    });

    it('选项 class、style 落在 Toast 元素上，与堆叠隐藏类、动画类合并', async () => {
        holdAnimations();
        Toast.info({ content: '1', duration: 0, stack: true, class: 'mine', style: 'color: red' });
        ['2', '3', '4'].forEach((content) => Toast.info({ content, duration: 0, stack: true }));
        await tick();
        const oldest = screen.getByText('1').closest(`.${prefix}`) as HTMLElement;
        expect(oldest).toHaveClass('mine', `${prefix}-stack-hidden`);
        expect(wrapperOf(oldest)).toHaveClass(`${prefix}-zero-height-wrapper`, `${prefix}-animation-show`);
        expect(oldest.style.color).toBe('red');
        expect(oldest.style.transform).toContain('-30px');
    });

    it('焦点在列表内时暂停计时，离开后满 duration 关闭', async () => {
        vi.useFakeTimers();
        await show({ content: 'focus', duration: 1, motion: false });
        const button = getInfoToast()?.querySelector('button') as HTMLButtonElement;
        button.focus();
        await tick();
        await advance(2000);
        expect(getInfoToast()).not.toBeNull();
        button.blur();
        await tick();
        await advance(999);
        expect(getInfoToast()).not.toBeNull();
        await advance(1);
        expect(getInfoToast()).toBeNull();
    });

    it('聚焦的 Toast 被移除后，其余 Toast 不再永久暂停', async () => {
        vi.useFakeTimers();
        await show({ id: 'a', content: 'a', duration: 0, motion: false });
        await show({ id: 'b', content: 'b', duration: 1, motion: false });
        (document.querySelector(`.${prefix}-info button`) as HTMLButtonElement).focus();
        await tick();
        await advance(2000);
        expect(texts()).toEqual(['a', 'b']);
        Toast.close('a');
        await tick();
        expect(texts()).toEqual(['b']);
        await advance(1000);
        expect(texts()).toEqual([]);
    });

    it('焦点进入收起的堆叠时展开', async () => {
        ['1', '2', '3', '4'].forEach((content) => Toast.info({ content, duration: 0, stack: true }));
        await tick();
        const expandedCls = `${prefix}-zero-height-wrapper-expanded`;
        const wrappers = () => [...document.querySelectorAll(`.${prefix}-zero-height-wrapper`)];
        expect(wrappers().some((wrapper) => wrapper.classList.contains(expandedCls))).toBe(false);
        (document.querySelector(`.${prefix}-info button`) as HTMLButtonElement).focus();
        await tick();
        expect(wrappers().every((wrapper) => wrapper.classList.contains(expandedCls))).toBe(true);
    });

    it('悬停期间 stack 列表被清空后，新的一批 Toast 重新收起堆叠', async () => {
        await show({ id: 'a', content: 'a', duration: 0, motion: false, stack: 1 });
        const list = innerWrapper();
        await dispatch(list, 'mouseenter');
        expect(list).toHaveClass(`${prefix}-innerWrapper-hover`);
        Toast.close('a');
        await tick();
        expect(getInfoToast()).toBeNull();
        Toast.info({ content: 'b', duration: 0, motion: false, stack: 1 });
        Toast.info({ content: 'c', duration: 0, motion: false, stack: 1 });
        await tick();
        expect(document.querySelectorAll(`.${prefix}-info`)).toHaveLength(2);
        expect(list).not.toHaveClass(`${prefix}-innerWrapper-hover`);
    });

    describe('读屏播报', () => {
        const getAnnouncer = () => document.querySelector(`.${prefix}-announcer`);

        it('常驻播报区先于消息存在，消息文本在之后的任务中写入，随后清空', async () => {
            vi.useFakeTimers();
            await show({ content: 'saved', duration: 0, motion: false });
            expect(getAnnouncer()).toHaveAttribute('aria-live', 'polite');
            expect(getAnnouncer()?.textContent).toBe('');
            await advance(100);
            expect(getAnnouncer()).toHaveTextContent(/^saved$/);
            await advance(1000);
            expect(getAnnouncer()?.textContent).toBe('');
        });

        it('同一 id 在播报前连续更新，只播报一次最新文本', async () => {
            vi.useFakeTimers();
            await show({ id: 'up', content: '10%', duration: 0, motion: false });
            await show({ id: 'up', content: '20%', duration: 0, motion: false });
            await advance(100);
            expect(getAnnouncer()).toHaveTextContent(/^20%$/);
        });

        it('消息项自身不再播报，warning 和 error 保持 alert 且不写入播报区', async () => {
            vi.useFakeTimers();
            await show({ content: 'saved', duration: 0 });
            Toast.error({ content: 'failed', duration: 0 });
            await tick();
            expect(getInfoToast()).toHaveAttribute('aria-live', 'off');
            expect(screen.getByRole('alert')).not.toHaveAttribute('aria-live');
            await advance(100);
            expect(getAnnouncer()).toHaveTextContent(/^saved$/);
        });
    });
});
