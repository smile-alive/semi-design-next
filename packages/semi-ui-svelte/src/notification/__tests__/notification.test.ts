import { createRawSnippet, flushSync, type Snippet, tick } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import NotificationListStore, { type ConfigProps } from '@fibrae/semi-foundation/notification/notification-list-foundation';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import { Notification } from '../index';
import type { NoticeHandle, NoticeProps, NotificationHookApi, NotificationHookOptions } from '../interface';
import NoticeItem from '../notice.svelte';
import HookHost from './hook-host.svelte';
import ItemRef from './item-ref.svelte';
import ProviderHost from './provider-host.svelte';
import Snippets from './snippets.svelte';

const prefix = 'semi-notification';
const noticeCls = `${prefix}-notice`;
const hideCls = (placement = 'topRight') => `${noticeCls}-animation-hide_${placement}`;
const showCls = (placement = 'topRight') => `${noticeCls}-animation-show_${placement}`;
// The list animates each notice's root wrapper, not the notice element
const wrapperOf = (notice?: Element | null) => notice?.parentElement;
const getList = () => document.querySelector<HTMLElement>(`.${prefix}-list`);
const getTitle = (selector: string) => document.querySelector(`${selector} .${noticeCls}-title`);
const notices = (root: ParentNode = document) => [...root.querySelectorAll<HTMLElement>(`.${noticeCls}`)];
const titles = (root: ParentNode = document) => [...root.querySelectorAll(`.${noticeCls}-title`)].map((title) => title.textContent?.trim());
const text = (html: string) => createRawSnippet(() => ({ render: () => html }));

async function show(method: 'open' | 'info' | 'success' | 'warning' | 'error', opts: NoticeProps) {
    const id = Notification[method](opts);
    await tick();
    return id;
}
async function advance(ms: number) {
    vi.advanceTimersByTime(ms);
    await tick();
}
async function dispatch(el: Element, type: string) {
    el.dispatchEvent(new Event(type));
    await tick();
}
// jsdom runs no CSS animations, and a notice ends a run without one at once. Reports a running animation so the
// notices stay in their enter and leave phases until the test ends them.
const holdAnimations = () => vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([{ animationName: 'running' } as unknown as Animation]);
async function endAnimations(phase: 'show' | 'hide') {
    for (const el of document.querySelectorAll(`[class*="-animation-${phase}_"]`)) {
        el.dispatchEvent(Object.assign(new Event('animationend'), { animationName: `semi-notification-slide${phase === 'show' ? 'Show' : 'Hide'}_topRight` }));
    }
    await tick();
}
function renderHook(props: { reachable?: string } = {}) {
    const result = {} as { api: NotificationHookApi; reach: NotificationHookOptions['content'] };
    render(HookHost, {
        props: {
            ...props,
            onApi: (api, reach) => {
                result.api = api;
                result.reach = reach;
            },
        },
    });
    // hook notifications are mounted into the body
    return { ...result, holder: document.body };
}
const renderNotice = (props: Record<string, unknown> = {}) => render(NoticeItem, { props: { placement: 'topRight', ...props } });

describe('Notification', () => {
    beforeEach(() => {
        // undo vitest/setup.ts freezing Date so Notification timers follow the real clock
        vi.useRealTimers();
    });
    afterEach(() => {
        Notification.destroyAll();
        Notification.resetConfig();
        semiGlobal.config.overrideDefaultProps = {};
        vi.useRealTimers();
    });

    it('同一同步块内的多次调用共用一个容器', async () => {
        Notification.info({ title: 'first', duration: 0 });
        Notification.info({ title: 'second', duration: 0 });
        await tick();
        expect(document.querySelectorAll(`.${prefix}-wrapper`)).toHaveLength(1);
        expect(document.querySelector(`.${prefix}-wrapper`)).toHaveAttribute('data-semi-keep-interactive');
        expect(document.querySelectorAll(`.${noticeCls}-title`)).toHaveLength(2);
        Notification.destroyAll();
        expect(document.querySelector(`.${prefix}-wrapper`)).toBeNull();
    });

    it('同一同步块内的打开、关闭与同 id 更新落在同一个容器中', async () => {
        const dropped = Notification.info({ title: 'dropped', duration: 0 });
        Notification.info({ id: 'kept', title: 'kept', content: 'before', duration: 0 });
        Notification.close(dropped);
        Notification.info({ id: 'kept', title: 'kept', content: 'after', duration: 0 });
        await tick();
        expect(document.querySelectorAll(`.${prefix}-wrapper`)).toHaveLength(1);
        expect(titles()).toEqual(['kept']);
        expect(notices()[0]).toHaveTextContent('after');
    });

    it('同 id 连续更新后到点只触发一次 onClose', async () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        Notification.info({ id: 'early', title: 'a', duration: 1, onClose });
        Notification.info({ id: 'early', title: 'b', duration: 1, onClose });
        await tick();
        await advance(1000);
        expect(onClose).toHaveBeenCalledTimes(1);
        await advance(5000);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('同一批次中打开并关闭的通知不渲染，也不留下空列表', async () => {
        await show('info', { title: 'mounted', duration: 0 });
        Notification.close(Notification.info({ title: 'brief', duration: 0 }));
        Notification.close(Notification.info({ title: 'alone', duration: 0, position: 'bottom' }));
        await tick();
        expect(titles()).toEqual(['mounted']);
        expect(document.querySelectorAll(`.${prefix}-list`)).toHaveLength(1);
    });

    it('destroyAll 后立即打开的通知在新的容器中单独显示', async () => {
        await show('info', { title: 'old', duration: 0 });
        const oldWrapper = document.querySelector(`.${prefix}-wrapper`);
        Notification.destroyAll();
        expect(oldWrapper?.isConnected).toBe(false);
        await show('info', { title: 'new', duration: 0 });
        const wrappers = document.querySelectorAll(`.${prefix}-wrapper`);
        expect(wrappers).toHaveLength(1);
        expect(wrappers[0]).not.toBe(oldWrapper);
        expect(titles()).toEqual(['new']);
        expect(wrapperOf(notices()[0])).not.toHaveClass(hideCls());
    });

    it('打开、更新、关闭与使用 hook 不产生 Svelte 警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            await show('info', { id: 'warn', title: 'a', duration: 0 });
            await show('info', { id: 'warn', title: 'b', duration: 0 });
            Notification.close('warn');
            await tick();
            const { api } = renderHook();
            api.info({ title: 'from hook', duration: 0 });
            await tick();
            expect(warn).not.toHaveBeenCalled();
        } finally {
            warn.mockRestore();
        }
    });

    it('title、content 与 zIndex', async () => {
        await show('open', { title: 'Hi, Bytedance', content: 'ies dance dance dance', duration: 1, zIndex: 2333 });
        expect(document.querySelector(`.${prefix}-wrapper`)).toHaveStyle({ zIndex: '2333' });
        const inner = document.querySelector(`.${noticeCls}-content-wrapper`) as HTMLElement;
        expect(inner.childElementCount).toEqual(2);
        expect(inner.querySelector(`.${noticeCls}-title`)).toHaveTextContent(/^Hi, Bytedance$/);
        expect(inner.querySelector(`.${noticeCls}-content`)).toHaveTextContent(/^ies dance dance dance$/);
    });

    it('每次调用都应用 zIndex', async () => {
        await show('info', { title: 'a', duration: 0 });
        await show('info', { title: 'b', duration: 0, zIndex: 2000 });
        expect(document.querySelector<HTMLElement>(`.${prefix}-wrapper`)?.style.zIndex).toBe('2000');
    });

    it('duration 到点后播放离场动画，动画结束后移除并卸载空列表', async () => {
        vi.useFakeTimers();
        holdAnimations();
        await show('open', { title: 'Hi, Bytedance', content: 'ies dance dance dance', duration: 1 });
        expect(getList()?.childElementCount).toEqual(1);
        await advance(999);
        expect(wrapperOf(screen.getByRole('status'))).not.toHaveClass(hideCls());
        await advance(1);
        expect(wrapperOf(screen.getByRole('status'))).toHaveClass(hideCls());
        await endAnimations('hide');
        expect(getList()).toBeNull();
    });

    it('没有动画的环境里，离场的通知立即移除', async () => {
        await show('info', { id: 'a', title: 'a', duration: 0 });
        Notification.close('a');
        await tick();
        expect(notices()).toHaveLength(0);
    });

    it.each(['top', 'topLeft', 'bottomLeft', 'bottomRight'] as const)('position-%s', async (position) => {
        await show('open', { title: `${position} demo`, content: 'ies dance dance dance', duration: 1, position });
        expect(getTitle(`.${prefix}-list[x-placement=${position}] .${noticeCls}-content-wrapper`)).toHaveTextContent(new RegExp(`^${position} demo$`));
        expect(document.querySelectorAll(`.${prefix}-list`)).toHaveLength(1);
    });

    it.each(['success', 'info', 'warning', 'error'] as const)('%s', async (type) => {
        await show(type, { title: `${type} demo`, duration: 1 });
        expect(getTitle(`.${noticeCls}-${type}`)).toHaveTextContent(new RegExp(`^${type} demo$`));
    });

    it.each(['error', 'info', 'warning', 'success'] as const)('主题 %s-light', async (type) => {
        await show(type, { title: `light ${type} demo`, duration: 1, theme: 'light' });
        expect(getTitle(`.${noticeCls}-light.${noticeCls}-${type}`)).toHaveTextContent(new RegExp(`^light ${type} demo$`));
    });

    it('onClick 落在通知元素上', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const view = renderNotice({ title: 'title', content: 'content', onClick });
        await fireEvent.click(view.getByRole('status'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    });

    it('点击关闭按钮触发 onClose，不触发通知的 onClick', async () => {
        const onClose = vi.fn<() => void>();
        const onClick = vi.fn<() => void>();
        const view = renderNotice({ title: 'title', content: 'content', onClose, onClick });
        await fireEvent.click(view.getByRole('button'));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('onCloseClick 的载荷是 id，先于 onClose，并以 id 通知列表移除', async () => {
        const order: string[] = [];
        const close = vi.fn<(id: string) => void>();
        const onCloseClick = vi.fn<(id: string) => void>(() => order.push('closeClick'));
        const view = renderNotice({ id: 'notice-id', title: 'title', content: 'content', close, onCloseClick, onClose: () => order.push('close') });
        await fireEvent.click(view.getByRole('button'));
        expect(onCloseClick).toHaveBeenCalledExactlyOnceWith('notice-id');
        expect(order).toEqual(['closeClick', 'close']);
        expect(close).toHaveBeenCalledExactlyOnceWith('notice-id');
    });

    it('showClose = false', () => {
        const view = renderNotice({ title: 'title', content: 'content', showClose: false });
        expect(view.getByRole('status')).toBeInTheDocument();
        expect(view.queryByRole('button')).toBeNull();
    });

    it('关闭按钮有语言包名称，图标带 x-semi-prop', () => {
        const view = renderNotice({ title: 'title' });
        expect(view.getByRole('button')).toHaveAccessibleName('关闭');
        expect(view.container.querySelector(`.${noticeCls}-title`)).toHaveAttribute('x-semi-prop', 'title');
    });

    it('icon 接受字符串与 snippet，替换类型图标', () => {
        const iconOf = (icon: NoticeProps['icon']) => renderNotice({ title: 't', type: 'warning', icon }).container.querySelector(`.${noticeCls}-icon`);
        expect(iconOf('!')).toHaveTextContent(/^!$/);
        expect(iconOf(text('<i class="snippet-icon"></i>'))?.querySelector('.snippet-icon')).not.toBeNull();
        expect(iconOf('')?.querySelector('svg')).not.toBeNull();
    });

    it('aria-labelledby 绑定到标题，没有标题时不输出', () => {
        const view = renderNotice({ title: 'title', content: 'content' });
        const labelledBy = view.getByRole('status').getAttribute('aria-labelledby') as string;
        expect(document.getElementById(labelledBy)).toHaveTextContent('title');
        const untitled = renderNotice({ content: 'no title' });
        expect(untitled.getAllByRole('status').at(-1)).not.toHaveAttribute('aria-labelledby');
    });

    it('config', async () => {
        Notification.config({ left: '300px', top: '400px' });
        await show('info', { content: 'content', title: 'title', position: 'top' });
        expect(getList()).toHaveStyle({ left: '300px', top: '400px' });
    });

    it('偏移的数字补 px', async () => {
        await show('info', { title: 'offset', duration: 0, top: 12, left: 8 });
        expect(getList()?.style.top).toBe('12px');
        expect(getList()?.style.left).toBe('8px');
    });

    it('resetConfig 恢复内置默认值', async () => {
        vi.useFakeTimers();
        holdAnimations();
        Notification.config({ top: '400px', duration: 0, position: 'bottomLeft', zIndex: 2333 });
        Notification.resetConfig();
        await show('info', { content: 'content', title: 'title' });
        expect(document.querySelector(`.${prefix}-wrapper`)).toHaveStyle({ zIndex: '1010' });
        expect(getList()).toHaveAttribute('x-placement', 'topRight');
        expect(getList()?.style.top).toBe('');
        await advance(3000);
        expect(wrapperOf(screen.getByRole('status'))).toHaveClass(hideCls());
    });

    it('同一批次中关闭的每条通知都会播放离场动画', async () => {
        holdAnimations();
        await show('info', { id: 'a', title: 'a', duration: 0 });
        await show('info', { id: 'b', title: 'b', duration: 0 });
        Notification.close('a');
        Notification.close('b');
        await tick();
        expect(notices()).toHaveLength(2);
        for (const notice of notices()) expect(wrapperOf(notice)).toHaveClass(hideCls());
        await show('info', { id: 'c', title: 'c', duration: 0 });
        expect(notices()).toHaveLength(3);
        await endAnimations('hide');
        expect(titles()).toEqual(['c']);
    });

    it.each([
        ['success', 'tick_circle', 'status'],
        ['info', 'info_circle', 'status'],
        ['warning', 'alert_triangle', 'alert'],
        ['error', 'alert_circle', 'alert'],
    ] as const)('%s 显示其类型图标', async (type, icon, role) => {
        await show(type, { title: type, duration: 0 });
        const notice = screen.getByRole(role);
        expect(notice).toHaveClass(noticeCls, `${noticeCls}-${type}`);
        expect(notice.querySelector(`.${noticeCls}-icon.${noticeCls}-${type} .semi-icon-${icon}`)).not.toBeNull();
    });

    it('open 没有类型图标', async () => {
        await show('open', { title: 'plain', duration: 0 });
        const notice = screen.getByRole('status');
        expect(notice).toHaveClass(`${noticeCls}-default`);
        expect(notice.querySelector(`.${noticeCls}-icon`)).toBeNull();
    });

    it('没有 type 的通知不带 undefined 类名', () => {
        const view = renderNotice({ title: 'plain', icon: '!' });
        expect(view.getByRole('status')).not.toHaveClass(`${noticeCls}-undefined`);
        expect(view.container.querySelector(`.${noticeCls}-icon`)).not.toHaveClass(`${noticeCls}-undefined`);
    });

    it('role 随类型：warning、error 为 alert，其余为 status 且不自行播报', async () => {
        for (const method of ['warning', 'error', 'info', 'success', 'open'] as const) {
            Notification[method]({ title: method, duration: 0 });
        }
        await tick();
        const roleOf = (title: string) => notices().find((notice) => notice.querySelector(`.${noticeCls}-title`)?.textContent?.trim() === title);
        for (const title of ['warning', 'error']) {
            expect(roleOf(title)).toHaveAttribute('role', 'alert');
            expect(roleOf(title)).not.toHaveAttribute('aria-live');
        }
        for (const title of ['info', 'success', 'open']) {
            expect(roleOf(title)).toHaveAttribute('role', 'status');
            expect(roleOf(title)).toHaveAttribute('aria-live', 'off');
        }
    });

    it('悬停时暂停关闭计时器，移出后重新开始计时', async () => {
        vi.useFakeTimers();
        holdAnimations();
        await show('info', { title: 'hover', duration: 1 });
        await advance(500);
        await dispatch(getList() as HTMLElement, 'mouseenter');
        await advance(5000);
        expect(wrapperOf(screen.getByRole('status'))).not.toHaveClass(hideCls());
        await dispatch(getList() as HTMLElement, 'mouseleave');
        await advance(999);
        expect(wrapperOf(screen.getByRole('status'))).not.toHaveClass(hideCls());
        await advance(1);
        expect(wrapperOf(screen.getByRole('status'))).toHaveClass(hideCls());
    });

    it('悬停期间按同 id 更新不会重启计时，移出后满 duration 才关闭且 onClose 只触发一次', async () => {
        vi.useFakeTimers();
        holdAnimations();
        const onClose = vi.fn<() => void>();
        await show('info', { id: 'progress', title: 'upload', content: '10%', duration: 1, onClose });
        await dispatch(getList() as HTMLElement, 'mouseenter');
        await show('info', { id: 'progress', title: 'upload', content: '50%', duration: 1, onClose });
        await advance(5000);
        expect(screen.getByRole('status')).toHaveTextContent('50%');
        expect(wrapperOf(screen.getByRole('status'))).not.toHaveClass(hideCls());
        await dispatch(getList() as HTMLElement, 'mouseleave');
        await advance(999);
        expect(wrapperOf(screen.getByRole('status'))).not.toHaveClass(hideCls());
        await advance(1);
        expect(wrapperOf(screen.getByRole('status'))).toHaveClass(hideCls());
        await advance(5000);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('悬停一个位置不暂停其他位置的通知', async () => {
        vi.useFakeTimers();
        holdAnimations();
        await show('info', { title: 'right', duration: 1, position: 'topRight' });
        await show('info', { title: 'left', duration: 1, position: 'topLeft' });
        await dispatch(document.querySelector(`.${prefix}-list[x-placement=topRight]`) as HTMLElement, 'mouseenter');
        await advance(1000);
        const byTitle = (title: string) => notices().find((notice) => notice.querySelector(`.${noticeCls}-title`)?.textContent?.trim() === title);
        expect(wrapperOf(byTitle('left'))).toHaveClass(hideCls('topLeft'));
        expect(wrapperOf(byTitle('right'))).not.toHaveClass(hideCls('topRight'));
    });

    it('焦点在列表内时暂停计时，离开后满 duration 关闭', async () => {
        vi.useFakeTimers();
        holdAnimations();
        await show('info', { title: 'focus', duration: 1 });
        const button = document.querySelector(`.${noticeCls} button`) as HTMLButtonElement;
        button.focus();
        await tick();
        await advance(2000);
        expect(wrapperOf(screen.getByRole('status'))).not.toHaveClass(hideCls());
        button.blur();
        await tick();
        await advance(999);
        expect(wrapperOf(screen.getByRole('status'))).not.toHaveClass(hideCls());
        await advance(1);
        expect(wrapperOf(screen.getByRole('status'))).toHaveClass(hideCls());
    });

    it('聚焦的通知被移除后，其余通知不再永久暂停', async () => {
        vi.useFakeTimers();
        holdAnimations();
        await show('info', { id: 'a', title: 'a', duration: 0 });
        await show('info', { id: 'b', title: 'b', duration: 1 });
        const a = notices().find((notice) => notice.querySelector(`.${noticeCls}-title`)?.textContent?.trim() === 'a') as HTMLElement;
        (a.querySelector('button') as HTMLButtonElement).focus();
        await tick();
        await advance(2000);
        expect(titles()).toEqual(['b', 'a']);
        Notification.close('a');
        await tick();
        await endAnimations('hide');
        expect(titles()).toEqual(['b']);
        await advance(1000);
        expect(wrapperOf(notices()[0])).toHaveClass(hideCls());
    });

    it('焦点进入收起的堆叠时展开', async () => {
        for (const title of ['1', '2', '3', '4']) Notification.info({ title, duration: 0, stack: true });
        await tick();
        const expandedCls = `${noticeCls}-stack-item-expanded`;
        const items = () => [...document.querySelectorAll(`.${noticeCls}-stack-item`)];
        expect(items()).toHaveLength(4);
        expect(items().some((item) => item.classList.contains(expandedCls))).toBe(false);
        (document.querySelector(`.${noticeCls} button`) as HTMLButtonElement).focus();
        await tick();
        expect(items().every((item) => item.classList.contains(expandedCls))).toBe(true);
    });

    it('stack: true 时三条平铺，第四条起堆叠，三层之后的隐藏', async () => {
        const items = () => [...document.querySelectorAll<HTMLElement>(`.${noticeCls}-stack-item`)];
        for (const title of ['1', '2', '3']) Notification.info({ title, duration: 0, stack: true });
        await tick();
        expect(items().every((item) => item.classList.contains(`${noticeCls}-stack-item-expanded`))).toBe(true);
        Notification.info({ title: '4', duration: 0, stack: true });
        Notification.info({ title: '5', duration: 0, stack: true });
        await tick();
        expect(items().map((item) => item.style.transform)).toEqual(['', 'translateY(8px) scaleX(0.95)', 'translateY(16px) scaleX(0.9)', 'translateY(24px) scaleX(0.85)', 'translateY(32px) scaleX(0.8)']);
        expect(items().map((item) => item.classList.contains(`${noticeCls}-stack-item-hidden`))).toEqual([false, false, false, true, true]);
        expect(items().map((item) => item.style.zIndex)).toEqual(['5', '4', '3', '2', '1']);
    });

    it('收起的堆叠中离场的通知保留层级，后层不因它离场而下沉', async () => {
        holdAnimations();
        const items = () => [...document.querySelectorAll<HTMLElement>(`.${noticeCls}-stack-item`)];
        for (const title of ['1', '2', '3', '4', '5']) Notification.info({ id: title, title, duration: 0, stack: true });
        await tick();
        Notification.close('5');
        await tick();
        // the leaving newest notice keeps its layer; the shown ones sit at depths 0 to 3
        expect(items().map((item) => item.style.zIndex)).toEqual(['5', '4', '3', '2', '1']);
        expect(items().map((item) => item.style.transform)).toEqual(['', '', 'translateY(8px) scaleX(0.95)', 'translateY(16px) scaleX(0.9)', 'translateY(24px) scaleX(0.85)']);
        await endAnimations('hide');
        expect(items()).toHaveLength(4);
    });

    it('底部堆叠向上叠放', async () => {
        for (const title of ['1', '2']) Notification.info({ title, duration: 0, stack: 1, position: 'bottomRight' });
        await tick();
        const behind = document.querySelectorAll<HTMLElement>(`.${noticeCls}-stack-item`)[1];
        expect(behind.style.transform).toBe('translateY(-8px) scaleX(0.95)');
    });

    it('两次调用间切换 stack 不重启已显示通知的计时', async () => {
        vi.useFakeTimers();
        holdAnimations();
        await show('info', { id: 'a', title: 'a', duration: 1 });
        await advance(500);
        await show('info', { id: 'b', title: 'b', duration: 0, stack: true });
        const a = () => notices().find((notice) => notice.querySelector(`.${noticeCls}-title`)?.textContent?.trim() === 'a') as HTMLElement;
        expect(a().parentElement).toHaveClass(`${noticeCls}-stack-item`);
        await advance(499);
        expect(wrapperOf(a())).not.toHaveClass(hideCls());
        await advance(1);
        expect(wrapperOf(a())).toHaveClass(hideCls());
    });

    it('duration 为 0 时不会自动关闭', async () => {
        vi.useFakeTimers();
        holdAnimations();
        const onClose = vi.fn<() => void>();
        await show('info', { title: 'sticky', duration: 0, onClose });
        await advance(60_000);
        expect(wrapperOf(screen.getByRole('status'))).not.toHaveClass(hideCls());
        expect(onClose).not.toHaveBeenCalled();
    });

    it('duration 结束时 onClose 只触发一次，每次点击 onClick 触发一次', async () => {
        vi.useFakeTimers();
        holdAnimations();
        const onClose = vi.fn<() => void>();
        const onClick = vi.fn<() => void>();
        await show('info', { title: 'callbacks', duration: 1, onClose, onClick });
        screen.getByRole('status').click();
        expect(onClick).toHaveBeenCalledTimes(1);
        await advance(1000);
        expect(onClose).toHaveBeenCalledTimes(1);
        await advance(5000);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('关闭按钮只触发一次 onClose，Notification.close 不触发', async () => {
        vi.useFakeTimers();
        holdAnimations();
        const onClose = vi.fn<() => void>();
        await show('info', { id: 'btn', title: 'btn', duration: 1, onClose });
        await advance(1);
        (document.querySelector(`.${noticeCls} button`) as HTMLButtonElement).click();
        await tick();
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(wrapperOf(notices()[0])).toHaveClass(hideCls());
        await endAnimations('hide');
        await advance(2000);
        expect(onClose).toHaveBeenCalledTimes(1);

        const onManualClose = vi.fn<() => void>();
        await show('info', { id: 'manual', title: 'manual', duration: 1, onClose: onManualClose });
        Notification.close('manual');
        await tick();
        await endAnimations('hide');
        await advance(2000);
        expect(onManualClose).not.toHaveBeenCalled();
    });

    it('离场动画期间再次点击关闭按钮，onClose 与 onCloseClick 各只触发一次', async () => {
        vi.useFakeTimers();
        holdAnimations();
        const onClose = vi.fn<() => void>();
        const onCloseClick = vi.fn<(id: string) => void>();
        await show('info', { id: 'twice', title: 'twice', duration: 0, onClose, onCloseClick });
        await advance(1);
        const button = document.querySelector<HTMLButtonElement>(`.${noticeCls} button`);
        button?.click();
        await tick();
        expect(wrapperOf(notices()[0])).toHaveClass(hideCls());
        await advance(1);
        button?.click();
        await tick();
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onCloseClick).toHaveBeenCalledTimes(1);
    });

    it('Notification.close 进入离场后，剩余计时到期不触发 onClose', async () => {
        vi.useFakeTimers();
        holdAnimations();
        const onClose = vi.fn<() => void>();
        await show('info', { id: 'leaving', title: 'leaving', duration: 1, onClose });
        await advance(900);
        Notification.close('leaving');
        await tick();
        expect(wrapperOf(notices()[0])).toHaveClass(hideCls());
        await advance(200);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('打开已存在的 id 时原地更新，并重新开始计时', async () => {
        vi.useFakeTimers();
        holdAnimations();
        await show('open', { id: 'same', title: 'title', content: 'before', duration: 3 });
        await advance(2000);
        await show('open', { id: 'same', title: 'title', content: 'updated', duration: 10 });
        expect(screen.getAllByRole('status')).toHaveLength(1);
        expect(screen.getByRole('status')).toHaveTextContent('updated');
        await advance(9999);
        expect(wrapperOf(screen.getByRole('status'))).not.toHaveClass(hideCls());
        await advance(1);
        expect(wrapperOf(screen.getByRole('status'))).toHaveClass(hideCls());
    });

    it('close 移除一条通知，destroyAll 移除容器', async () => {
        holdAnimations();
        await show('info', { id: 'one', title: 'one', duration: 0 });
        await show('info', { id: 'two', title: 'two', duration: 0 });
        Notification.close('one');
        await tick();
        expect(document.querySelector('[class*="animation-hide"]')).toHaveTextContent('one');
        await endAnimations('hide');
        expect(titles()).toEqual(['two']);
        Notification.destroyAll();
        expect(document.querySelector(`.${prefix}-wrapper`)).toBeNull();
    });

    it('离场中的通知保留其在列表中的位置', async () => {
        holdAnimations();
        await show('info', { id: 'a', title: 'a', duration: 0 });
        await show('info', { id: 'b', title: 'b', duration: 0 });
        await show('info', { id: 'c', title: 'c', duration: 0 });
        Notification.close('b');
        await tick();
        expect(titles()).toEqual(['c', 'b', 'a']);
    });

    it('通知按位置分组，每个位置一个列表，新的在前', async () => {
        await show('info', { title: 'a', duration: 0, position: 'bottom' });
        await show('info', { title: 'b', duration: 0, position: 'bottom' });
        await show('info', { title: 'c', duration: 0, position: 'topLeft' });
        expect(document.querySelectorAll(`.${prefix}-list`)).toHaveLength(2);
        const bottom = document.querySelector(`.${prefix}-list[x-placement=bottom]`) as HTMLElement;
        expect(titles(bottom)).toEqual(['b', 'a']);
    });

    it('显式传入 undefined 的 position 等同未传，沿用 Notification.config 的值', async () => {
        Notification.config({ position: 'bottomLeft' });
        await show('info', { title: 'title', position: undefined, duration: 0 });
        expect(getList()).toHaveAttribute('x-placement', 'bottomLeft');
    });

    it('config 修改默认的 duration 与 position', async () => {
        vi.useFakeTimers();
        holdAnimations();
        Notification.config({ duration: 0, position: 'bottomLeft' });
        await show('info', { title: 'configured' });
        expect(getList()).toHaveAttribute('x-placement', 'bottomLeft');
        await advance(60_000);
        expect(wrapperOf(screen.getByRole('status'))).not.toHaveClass(hideCls('bottomLeft'));
    });

    it('未指定 position 时，通知传 direction="rtl" 显示在左上角', async () => {
        await show('info', { title: 'rtl', duration: 0, direction: 'rtl' });
        expect(getList()).toHaveAttribute('x-placement', 'topLeft');
        expect(notices()[0]).toHaveAttribute('dir', 'rtl');
    });

    it('没有方向时不输出 dir，保留使用方传入的 dir', () => {
        const view = renderNotice({ title: 'item' });
        expect(view.getByRole('status')).not.toHaveAttribute('dir');
        const own = renderNotice({ title: 'own', dir: 'rtl' });
        expect(own.getAllByRole('status').at(-1)).toHaveAttribute('dir', 'rtl');
    });

    it('getPopupContainer 承载容器', async () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        try {
            await show('info', { title: 'inside', duration: 0, getPopupContainer: () => container });
            expect(container.querySelector(`.${prefix}-wrapper`)).toHaveTextContent('inside');
        } finally {
            Notification.destroyAll();
            container.remove();
        }
    });

    it('读取 semiGlobal overrideDefaultProps.Notification 中的默认值', async () => {
        semiGlobal.config.overrideDefaultProps = { Notification: { showClose: false, theme: 'light' } };
        await show('info', { title: 'static', duration: 0 });
        const notice = screen.getByRole('status');
        expect(notice).toHaveClass(`${noticeCls}-light`);
        expect(notice.querySelector('button')).toBeNull();
        const direct = renderNotice({ title: 'direct' }).container.querySelector(`.${noticeCls}`) as HTMLElement;
        expect(direct).toHaveClass(`${noticeCls}-light`);
        expect(direct.querySelector('button')).toBeNull();
        await show('success', { title: 'explicit', duration: 0, showClose: true, theme: 'normal' });
        const explicit = notices().find((item) => item.querySelector(`.${noticeCls}-title`)?.textContent?.trim() === 'explicit') as HTMLElement;
        expect(explicit.querySelector('button')).not.toBeNull();
        expect(explicit).not.toHaveClass(`${noticeCls}-light`);
    });

    it('全局默认值里的 id 不生效，静态 API 的每条通知 id 各不相同', async () => {
        semiGlobal.config.overrideDefaultProps = { Notification: { id: 'shared', duration: 0 } as object };
        const first = await show('info', { title: 'a' });
        const second = await show('info', { title: 'b' });
        expect(first).not.toBe('shared');
        expect(first).not.toBe(second);
        expect(notices()).toHaveLength(2);
    });

    it('静态与 hook 都应用 overrideDefaultProps 的 position、stack 与偏移', async () => {
        semiGlobal.config.overrideDefaultProps = { Notification: { position: 'bottomLeft', stack: 1, top: 20, duration: 0 } };
        await show('info', { title: 'static' });
        await show('info', { title: 'static2', position: 'top' });
        expect(document.querySelector(`.${prefix}-list[x-placement=bottomLeft]`)).not.toBeNull();
        expect(document.querySelector(`.${prefix}-list[x-placement=top]`)).not.toBeNull();
        expect(document.querySelectorAll(`.${noticeCls}-stack-item`)).toHaveLength(2);
        for (const placement of ['bottomLeft', 'top']) {
            expect(document.querySelector<HTMLElement>(`.${prefix}-list[x-placement=${placement}]`)?.style.top).toBe('20px');
        }
        Notification.destroyAll();

        const { api, holder } = renderHook();
        api.info({ title: 'a' });
        api.info({ title: 'b' });
        await tick();
        const list = holder.querySelector(`.${prefix}-list`) as HTMLElement;
        expect(list).toHaveAttribute('x-placement', 'bottomLeft');
        expect(list.style.top).toBe('20px');
        expect(list.querySelectorAll(`.${noticeCls}-stack-item`)).toHaveLength(2);
        api.info({ title: 'c', position: 'top' });
        await tick();
        expect(holder.querySelector(`.${prefix}-list[x-placement=top]`)).not.toBeNull();
    });

    it('title、content 接受字符串与 snippet，snippet 随响应式数据更新', async () => {
        const store = createStore({ count: 1 });
        let snippets!: { bold: Snippet; counter: Snippet };
        render(Snippets, { props: { store, onSnippets: (given: typeof snippets) => (snippets = given) } });
        const content = () => document.querySelector(`.${noticeCls}-content`);
        await show('info', { content: 'div', duration: 0 });
        expect(content()?.children).toHaveLength(0);
        expect(content()).toHaveTextContent(/^div$/);
        Notification.destroyAll();

        await show('info', { content: snippets.bold, duration: 0 });
        expect(content()?.querySelector('b')).toHaveTextContent('bold');
        Notification.destroyAll();

        await show('info', { title: snippets.counter, content: snippets.counter, duration: 0 });
        const notice = notices()[0];
        expect(content()).toHaveTextContent(/^count 1$/);
        store.count = 2;
        flushSync();
        expect(content()).toHaveTextContent(/^count 2$/);
        expect(getTitle(`.${noticeCls}`)).toHaveTextContent(/^count 2$/);
        expect(notices()[0]).toBe(notice);
    });

    it('data-*、class、style 等未知选项落在通知元素上，选项自身与列表级选项不上 DOM', async () => {
        const opts = { id: 'own-id', title: 'attrs', duration: 0, position: 'top', zIndex: 1500, top: 10, class: 'mine', style: 'color: red', 'data-testid': 'notice-attrs' } as const;
        await show('info', opts);
        const notice = screen.getByTestId('notice-attrs');
        expect(notice).toBe(notices()[0]);
        expect(notice).toHaveClass('mine', noticeCls);
        expect(notice.style.color).toBe('red');
        for (const name of ['id', 'position', 'zindex', 'top', 'stack', 'getpopupcontainer']) {
            expect(notice).not.toHaveAttribute(name);
        }
        await show('info', { ...opts, id: 'stacked', 'data-testid': 'stacked', stack: true });
        const stacked = screen.getByTestId('stacked');
        expect(stacked).toHaveClass(noticeCls);
        expect(stacked.parentElement).toHaveClass(`${noticeCls}-stack-item`);
        expect(stacked.parentElement).not.toHaveAttribute('data-testid');
        expect(stacked.parentElement).not.toHaveClass('mine');

        const view = renderNotice({ title: 'item', 'data-foo': 'bar' });
        const item = view.container.querySelector(`.${noticeCls}`) as HTMLElement;
        expect(item).toHaveAttribute('data-foo', 'bar');
        expect(item.parentElement).not.toHaveAttribute('data-foo');
    });

    it('单个通知的实例暴露 restartCloseTimer', async () => {
        vi.useFakeTimers();
        let handle!: NoticeHandle;
        const onRemove = vi.fn<(id: string) => void>();
        render(ItemRef, { props: { onHandle: (h: NoticeHandle) => (handle = h), onRemove } });
        await advance(800);
        handle.restartCloseTimer();
        await advance(999);
        expect(onRemove).not.toHaveBeenCalled();
        await advance(1);
        expect(onRemove).toHaveBeenCalledExactlyOnceWith('r');
    });

    it('单项到点只通知一次 close 与 onClose', async () => {
        vi.useFakeTimers();
        const close = vi.fn<(id: string) => void>();
        const onClose = vi.fn<() => void>();
        renderNotice({ id: 'once', title: 'once', duration: 1, close, onClose });
        await advance(5000);
        expect(close).toHaveBeenCalledExactlyOnceWith('once');
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('手动点击关闭后，计时到期不再通知第二次 onClose', async () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        const view = renderNotice({ id: 'manual', title: 'manual', duration: 1, onClose });
        await advance(500);
        view.container.querySelector('button')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await tick();
        expect(onClose).toHaveBeenCalledTimes(1);
        await advance(5000);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('离场中的通知被同 id 重新打开后，取消离场、重新进场，并从重新打开起计时', async () => {
        vi.useFakeTimers();
        holdAnimations();
        await show('info', { id: 'again', title: 'again', duration: 2 });
        await advance(1000);
        Notification.close('again');
        await tick();
        expect(wrapperOf(notices()[0])).toHaveClass(hideCls());
        await show('info', { id: 'again', title: 'again', duration: 2 });
        expect(notices()).toHaveLength(1);
        expect(wrapperOf(notices()[0])).toHaveClass(showCls());
        expect(wrapperOf(notices()[0])).not.toHaveClass(hideCls());
        await endAnimations('show');
        await advance(1500);
        expect(wrapperOf(notices()[0])).not.toHaveClass(hideCls());
        await advance(500);
        expect(wrapperOf(notices()[0])).toHaveClass(hideCls());
    });

    describe('useNotification', () => {
        it('把通知挂到 body，无需放置 Holder', async () => {
            const { api, holder } = renderHook();
            api.info({ title: 'hooked', duration: 0, position: 'bottom' });
            api.info({ title: 'hooked', duration: 0, position: 'bottom' });
            await tick();
            const list = holder.querySelector(`.${prefix}-list[x-placement=bottom]`) as HTMLElement;
            expect(list.querySelectorAll(`[role=status].${noticeCls}-info`)).toHaveLength(2);
            expect(holder.querySelector(`.${prefix}-wrapper`)).toHaveAttribute('data-semi-keep-interactive');
            expect(holder.querySelector<HTMLElement>(`.${prefix}-wrapper`)?.style.display).toBe('contents');
            expect(document.querySelectorAll(`.${prefix}-wrapper`)).toHaveLength(1);
            expect(document.body.querySelector(`:scope > .${prefix}-wrapper`)).not.toBeNull();
        });

        it('调用组件卸载时移除 hook 挂载的通知', async () => {
            let api!: NotificationHookApi;
            const view = render(HookHost, { props: { onApi: (notification: NotificationHookApi) => (api = notification) } });
            api.info({ title: 'hooked', duration: 0 });
            await tick();
            expect(document.querySelectorAll(`.${prefix}-wrapper`)).toHaveLength(1);
            view.unmount();
            expect(document.querySelectorAll(`.${prefix}-wrapper`)).toHaveLength(0);
        });

        it('到达 duration 后关闭并只调用一次 onClose', async () => {
            vi.useFakeTimers();
            holdAnimations();
            const onClose = vi.fn<() => void>();
            const { api, holder } = renderHook();
            api.info({ title: 'hooked', duration: 1, onClose });
            await tick();
            expect(wrapperOf(screen.getByRole('status'))).toHaveClass(showCls());
            await advance(1000);
            expect(onClose).toHaveBeenCalledTimes(1);
            expect(wrapperOf(screen.getByRole('status'))).toHaveClass(hideCls());
            await endAnimations('hide');
            expect(holder.querySelector(`.${noticeCls}`)).toBeNull();
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('通知以位置动画进入', async () => {
            holdAnimations();
            const { api } = renderHook();
            api.info({ title: 'hooked', duration: 0, position: 'bottom' });
            await tick();
            expect(wrapperOf(screen.getByRole('status'))).toHaveClass(showCls('bottom'));
        });

        it('多个 hook 的通知各自留在自己的容器中', async () => {
            const first = renderHook();
            const second = renderHook();
            first.api.info({ title: 'first', duration: 0 });
            second.api.info({ title: 'second', duration: 0 });
            await tick();
            const wrappers = document.querySelectorAll(`.${prefix}-wrapper`);
            expect(wrappers).toHaveLength(2);
            expect(wrappers[0]).toHaveTextContent('first');
            expect(wrappers[0]).not.toHaveTextContent('second');
            expect(wrappers[1]).toHaveTextContent('second');
            expect(screen.getAllByRole('status')).toHaveLength(2);
        });

        it('close(id) 让 hook 通知播放离场动画，结束后从列表移除', async () => {
            holdAnimations();
            const { api, holder } = renderHook();
            const id = api.info({ title: 'hooked', duration: 0 });
            await tick();
            api.close(id);
            await tick();
            expect(wrapperOf(screen.getByRole('status'))).toHaveClass(hideCls());
            await endAnimations('hide');
            expect(holder).not.toHaveTextContent('hooked');
        });

        it('选项类型：只返回 api，hook 选项不含 type、id、zIndex、getPopupContainer', () => {
            expectTypeOf<ReturnType<typeof Notification.useNotification>>().toEqualTypeOf<NotificationHookApi>();
            for (const method of ['success', 'info', 'error', 'warning', 'open'] as const) {
                expectTypeOf<Parameters<NotificationHookApi[typeof method]>>().toEqualTypeOf<[NotificationHookOptions]>();
            }
            expectTypeOf<NotificationHookOptions>().not.toHaveProperty('zIndex');
            expectTypeOf<NotificationHookOptions>().not.toHaveProperty('getPopupContainer');
            expectTypeOf<NotificationHookOptions>().toHaveProperty('position');
            expectTypeOf<NotificationHookOptions>().toHaveProperty('stack');
        });

        it('选项类型接受 data-* 与 aria-* 属性', () => {
            expectTypeOf({ title: 'a', 'data-testid': 'x', 'aria-describedby': 'y' }).toExtend<NoticeProps>();
            expectTypeOf({ title: 'a', 'data-testid': 'x' }).toExtend<NotificationHookOptions>();
            // @ts-expect-error only data-* and aria-* are open
            const unknownKey: NoticeProps = { title: 'a', extra: 1 };
            expect(unknownKey).toBeDefined();
        });

        it('overrideDefaultProps.Notification 的 duration、position 优先于内置默认值', async () => {
            vi.useFakeTimers();
            holdAnimations();
            semiGlobal.config.overrideDefaultProps = { Notification: { duration: 10, position: 'bottomLeft' } };
            const { api, holder } = renderHook();
            api.info({ title: 'hooked' });
            await tick();
            expect(holder.querySelector(`.${prefix}-list[x-placement=bottomLeft]`)).not.toBeNull();
            await advance(9000);
            expect(holder).toHaveTextContent('hooked');
            await advance(1000);
            expect(wrapperOf(holder.querySelector('[role=status]'))).toHaveClass(hideCls('bottomLeft'));
        });

        it('读取 overrideDefaultProps.Notification 的 showClose、theme，且只渲染一份', async () => {
            semiGlobal.config.overrideDefaultProps = { Notification: { showClose: false, theme: 'light' } };
            const { api } = renderHook();
            api.info({ title: 'hooked', duration: 0 });
            await tick();
            const notice = screen.getByRole('status');
            expect(notice).toHaveClass(`${noticeCls}-light`);
            expect(notice.querySelector('button')).toBeNull();
        });

        it('useNotification 继承调用组件所在 ConfigProvider 的语言与方向，静态通知仍为默认语言', async () => {
            let api!: NotificationHookApi;
            render(ProviderHost, { props: { onApi: (notification: NotificationHookApi) => (api = notification) } });
            api.info({ title: 'hook', duration: 0 });
            await show('info', { title: 'static', duration: 0 });
            const hookedWrapper = [...document.querySelectorAll(`.${prefix}-wrapper`)].find((el) => el.textContent?.includes('hook')) as HTMLElement;
            const hooked = hookedWrapper.querySelector(`.${noticeCls}`) as HTMLElement;
            expect(hooked).toHaveAttribute('dir', 'rtl');
            expect(hooked.querySelector('button')).toHaveAccessibleName(ja_JP.Notification.close);
            expect(hookedWrapper.querySelector(`.${prefix}-list`)).toHaveAttribute('x-placement', 'topLeft');
            // the hook's wrapper is the one with display: contents
            const staticNotice = document.body.querySelector(`:scope > .${prefix}-wrapper:not([style*="contents"]) .${noticeCls}`) as HTMLElement;
            expect(staticNotice).toHaveTextContent('static');
            expect(staticNotice).not.toHaveAttribute('dir');
            expect(staticNotice.querySelector('button')).not.toHaveAccessibleName(ja_JP.Notification.close);
        });

        it('snippet 内容可读到调用组件的 context，静态通知读不到', async () => {
            const { api, reach, holder } = renderHook({ reachable: 'Light' });
            api.info({ title: reach, content: reach, duration: 0 });
            await show('info', { content: reach, duration: 0 });
            await tick();
            expect(holder.querySelector(`.${noticeCls}-title`)).toHaveTextContent('ReachableContext: Light');
            expect(holder.querySelector(`.${noticeCls}-content`)).toHaveTextContent('ReachableContext: Light');
            const staticNotice = document.body.querySelector(`:scope > .${prefix}-wrapper:not([style*="contents"]) .${noticeCls}`);
            expect(staticNotice).toHaveTextContent('ReachableContext: none');
        });
    });

    it('内置默认值没有 motion，config 不接受 direction', () => {
        expect(new NotificationListStore().defaults).not.toHaveProperty('motion');
        expectTypeOf<ConfigProps>().not.toHaveProperty('direction');
    });

    describe('读屏播报', () => {
        const getAnnouncer = () => document.querySelector(`.${noticeCls}-announcer`);

        it('常驻播报区先于通知存在，标题与内容在之后的任务中写入，随后清空', async () => {
            vi.useFakeTimers();
            await show('info', { title: 'Saved', content: 'All changes stored', duration: 0 });
            expect(getAnnouncer()).toHaveAttribute('aria-live', 'polite');
            expect(getAnnouncer()?.textContent).toBe('');
            await advance(100);
            expect(getAnnouncer()).toHaveTextContent(/^Saved All changes stored$/);
            await advance(1000);
            expect(getAnnouncer()?.textContent).toBe('');
        });

        it('通知项自身不再播报，warning 和 error 保持 alert 且不写入播报区', async () => {
            vi.useFakeTimers();
            await show('info', { title: 'info', duration: 0 });
            await show('error', { title: 'failed', duration: 0 });
            expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'off');
            expect(screen.getByRole('alert')).not.toHaveAttribute('aria-live');
            await advance(100);
            expect(getAnnouncer()).toHaveTextContent(/^info$/);
        });
    });
});
