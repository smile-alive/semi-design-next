import { createSignal, Show, type JSX } from 'solid-js';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import type { NoticeInstance } from '@fibrae/semi-foundation/notification/notification-foundation';
import NotificationListStore, { type ConfigProps } from '@fibrae/semi-foundation/notification/notification-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { IconToutiaoLogo } from '@fibrae/semi-icons-solid';
import Notification, { type NoticeProps, type NoticeState, type NotificationHookApi, type NotificationHookOptions } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import { LocaleProvider } from '../../locale';
import NotificationItem from '../notice';

const prefixCls = `${BASE_CLASS_PREFIX}-notification`;
const noticeCls = `${prefixCls}-notice`;
const hideTopRight = `${noticeCls}-animation-hide_topRight`;

type Method = 'open' | 'info' | 'success' | 'warning' | 'error';
const show = (method: Method, opts: NoticeProps) => Notification[method](opts);
const getTitle = (selector: string) => document.querySelector(`${selector} .${noticeCls}-title`);
const getList = () => document.querySelector<HTMLElement>(`.${prefixCls}-list`) as HTMLElement;
const endAnimation = (element: Element) => element.dispatchEvent(new Event('animationend', { bubbles: true }));

let api: NotificationHookApi;
function HookHost() {
    const [notification, contextHolder] = Notification.useNotification();
    api = notification;
    return <div data-testid="holder">{contextHolder}</div>;
}

describe('Notification', () => {
    beforeEach(() => {
        // undo vitest/setup.ts freezing Date so the timers follow the real clock
        vi.useRealTimers();
        // jsdom runs no animation; report one so the list waits for the animationend the tests dispatch
        vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([{ animationName: 'show' } as unknown as Animation]);
    });
    afterEach(async () => {
        Notification.destroyAll();
        Notification.resetConfig();
        semiGlobal.config.overrideDefaultProps = {};
        vi.useRealTimers();
        // the detached tree is released in a microtask
        await Promise.resolve();
    });

    describe('读屏播报', () => {
        const getAnnouncer = () => document.querySelector(`.${noticeCls}-announcer`);
        it('常驻播报区先于通知存在，标题与内容在之后的任务中写入，随后清空', () => {
            vi.useFakeTimers();
            show('info', { title: 'Saved', content: 'All changes stored', duration: 0 });
            expect(getAnnouncer()).toHaveAttribute('aria-live', 'polite');
            expect(getAnnouncer()).toBeEmptyDOMElement();
            vi.advanceTimersByTime(100);
            expect(getAnnouncer()).toHaveTextContent(/^Saved All changes stored$/);
            vi.advanceTimersByTime(1000);
            expect(getAnnouncer()?.textContent).toBe('');
        });
        it('通知项自身不再播报，warning 和 error 保持 alert 且不写入播报区', () => {
            vi.useFakeTimers();
            show('info', { title: 'info', duration: 0 });
            show('error', { title: 'failed', duration: 0 });
            expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'off');
            expect(screen.getByRole('alert')).not.toHaveAttribute('aria-live');
            vi.advanceTimersByTime(100);
            expect(getAnnouncer()).toHaveTextContent(/^info$/);
        });
    });

    it('多条通知共用同一个 wrapper，destroyAll 移除它', () => {
        Notification.info({ title: 'first', duration: 0 });
        Notification.info({ title: 'second', duration: 0 });
        expect(document.querySelectorAll(`.${prefixCls}-wrapper`)).toHaveLength(1);
        expect(document.querySelectorAll(`.${noticeCls}-title`)).toHaveLength(2);
        Notification.destroyAll();
        expect(document.querySelector(`.${prefixCls}-wrapper`)).toBeNull();
    });

    it('连续按同一 id 更新的通知只关闭一次', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        Notification.info({ id: 'early', title: 'a', duration: 1, onClose });
        Notification.info({ id: 'early', title: 'b', duration: 1, onClose });
        vi.advanceTimersByTime(1000);
        expect(onClose).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(5000);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('打开后立即关闭的通知会播放离开动画', () => {
        show('info', { title: 'mounted', duration: 0 });
        Notification.close(Notification.info({ title: 'brief', duration: 0 }));
        const brief = screen.getAllByRole('status').find((notice) => notice.textContent === 'brief') as HTMLElement;
        expect(brief).toHaveClass(hideTopRight);
        endAnimation(brief);
        expect(screen.getAllByRole('status').map((notice) => notice.textContent)).toEqual(['mounted']);
    });

    it('destroyAll 后立即打开的通知在新的 wrapper 中单独显示', () => {
        show('info', { title: 'old', duration: 0 });
        const oldWrapper = document.querySelector(`.${prefixCls}-wrapper`);
        Notification.destroyAll();
        Notification.info({ title: 'new', duration: 0 });
        const wrappers = document.querySelectorAll(`.${prefixCls}-wrapper`);
        expect(wrappers).toHaveLength(1);
        expect(wrappers[0]).not.toBe(oldWrapper);
        const notices = screen.getAllByRole('status');
        expect(notices.map((notice) => notice.textContent)).toEqual(['new']);
        expect(notices[0]).not.toHaveClass(hideTopRight);
    });

    it('title&content、zIndex', () => {
        show('open', { title: 'Hi, Bytedance', content: 'ies dance dance dance', duration: 1, zIndex: 2333 });
        expect(document.querySelector(`.${prefixCls}-wrapper`)).toHaveStyle({ zIndex: '2333' });
        const notificationInner = document.querySelector(`.${noticeCls}-content-wrapper`) as HTMLElement;
        expect(notificationInner.childElementCount).toEqual(2);
        expect(notificationInner.querySelector(`.${noticeCls}-title`)).toHaveTextContent(/^Hi, Bytedance$/);
        expect(notificationInner.querySelector(`.${noticeCls}-content`)).toHaveTextContent(/^ies dance dance dance$/);
    });

    it('duration', () => {
        vi.useFakeTimers();
        show('open', { title: 'Hi, Bytedance', content: 'ies dance dance dance', duration: 1 });
        expect(getList().childElementCount).toEqual(1);
        vi.advanceTimersByTime(999);
        expect(screen.getByRole('status')).not.toHaveClass(hideTopRight);
        vi.advanceTimersByTime(1);
        const notice = screen.getByRole('status');
        expect(notice).toHaveClass(hideTopRight);
        endAnimation(notice);
        expect(getList()).toBeNull();
    });

    it('页面取消了动画时，离场立即结束', () => {
        vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([]);
        show('info', { id: 'cancelled', title: 'cancelled', duration: 0 });
        Notification.close('cancelled');
        expect(screen.queryByRole('status')).toBeNull();
    });

    it('手动关闭后计时器不再触发第二次 onClose', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        show('open', { title: 'manual', duration: 1, onClose });
        vi.advanceTimersByTime(500);
        fireEvent.click(screen.getByRole('button', { name: zh_CN.Notification.close }));
        expect(onClose).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(5000);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('Notification.close 进入离场后，剩余计时到期不触发 onClose', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        show('info', { id: 'leaving', title: 'leaving', duration: 1, onClose });
        vi.advanceTimersByTime(900);
        Notification.close('leaving');
        expect(screen.getByRole('status')).toHaveClass(hideTopRight);
        vi.advanceTimersByTime(200);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('contextHolder 移出再放回时，残留的离场通知不计时，到期不触发 onClose', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        const [shown, setShown] = createSignal(true);
        function Host() {
            const [notification, contextHolder] = Notification.useNotification();
            api = notification;
            return <Show when={shown()}>{contextHolder}</Show>;
        }
        render(() => <Host />);
        api.close(api.info({ title: 'leftover', duration: 1, onClose }));
        setShown(false);
        setShown(true);
        expect(screen.getByRole('status')).toHaveClass(hideTopRight);
        vi.advanceTimersByTime(2000);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('每次调用都应用 zIndex', () => {
        show('info', { title: 'a', duration: 0 });
        show('info', { title: 'b', duration: 0, zIndex: 2000 });
        expect(document.querySelector(`.${prefixCls}-wrapper`)).toHaveStyle({ zIndex: '2000' });
    });

    it('离场中的通知被同 id 重新打开后，从重新打开起计时', () => {
        vi.useFakeTimers();
        show('info', { id: 'again', title: 'again', duration: 2 });
        vi.advanceTimersByTime(1000);
        Notification.close('again');
        expect(screen.getByRole('status')).toHaveClass(hideTopRight);
        show('info', { id: 'again', title: 'again', duration: 2 });
        vi.advanceTimersByTime(1500);
        expect(screen.getByRole('status')).not.toHaveClass(hideTopRight);
        vi.advanceTimersByTime(500);
        expect(screen.getByRole('status')).toHaveClass(hideTopRight);
    });

    it.each(['top', 'topLeft', 'bottomLeft', 'bottomRight'] as const)('position-%s', (position) => {
        show('open', { title: `${position} demo`, content: 'ies dance dance dance', duration: 1, position });
        expect(getTitle(`.${prefixCls}-list[x-placement=${position}] .${noticeCls}-content-wrapper`)).toHaveTextContent(new RegExp(`^${position} demo$`));
        expect(document.querySelectorAll(`.${prefixCls}-list`)).toHaveLength(1);
    });

    it.each(['success', 'info', 'warning', 'error'] as const)('%s', (type) => {
        show(type, { title: `${type} demo`, duration: 1 });
        expect(getTitle(`.${noticeCls}-${type}`)).toHaveTextContent(new RegExp(`^${type} demo$`));
    });

    it.each(['error', 'info', 'warning', 'success'] as const)('主题 %s-light', (type) => {
        show(type, { title: `light ${type} demo`, duration: 1, theme: 'light' });
        expect(getTitle(`.${noticeCls}-light.${noticeCls}-${type}`)).toHaveTextContent(new RegExp(`^light ${type} demo$`));
    });

    it('onClick', async () => {
        const spyOnClick = vi.fn<() => void>();
        render(() => <NotificationItem title="title" content="content" onClick={spyOnClick} />);
        await userEvent.click(screen.getByRole('status'));
        expect(spyOnClick).toHaveBeenCalledTimes(1);
    });

    it('onClose', async () => {
        const spyOnClose = vi.fn<() => void>();
        const spyOnClick = vi.fn<() => void>();
        render(() => <NotificationItem title="title" content="content" onClick={spyOnClick} onClose={spyOnClose} />);
        await userEvent.click(screen.getByRole('button'));
        expect(spyOnClose).toHaveBeenCalledTimes(1);
        // the close button stops propagation, so the notice itself is not clicked
        expect(spyOnClick).not.toHaveBeenCalled();
    });

    it('onCloseClick', async () => {
        const spyOnCloseClick = vi.fn<(id: string) => void>();
        render(() => <NotificationItem id="notice-id" title="title" content="content" onCloseClick={spyOnCloseClick} />);
        await userEvent.click(screen.getByRole('button'));
        expect(spyOnCloseClick).toHaveBeenCalledTimes(1);
        expect(spyOnCloseClick).toHaveBeenCalledWith('notice-id');
    });

    it('离场动画期间再次点击关闭按钮，onClose 与 onCloseClick 各只触发一次', () => {
        const onClose = vi.fn<() => void>();
        const onCloseClick = vi.fn<(id: string) => void>();
        show('info', { id: 'twice', title: 'twice', duration: 0, onClose, onCloseClick });
        const button = screen.getByRole('button');
        fireEvent.click(button);
        expect(screen.getByRole('status')).toHaveClass(hideTopRight);
        fireEvent.click(button);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onCloseClick).toHaveBeenCalledTimes(1);
    });

    it('回调显式为 null 时点击与关闭不抛错', async () => {
        // an untyped caller may pass null
        const none = null as unknown as () => void;
        render(() => <NotificationItem title="title" content="content" onClick={none} onClose={none} onCloseClick={none} />);
        await userEvent.click(screen.getByRole('status'));
        await userEvent.click(screen.getByRole('button'));
        expect(screen.getByRole('status')).toHaveTextContent('content');
    });

    it('showClose', () => {
        render(() => <NotificationItem title="title" content="content" showClose={false} onCloseClick={vi.fn<() => void>()} />);
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('icon 渲染在图标位置', () => {
        const { container } = render(() => <NotificationItem title="title" content="content" icon={<IconToutiaoLogo style={{ color: 'red' }} size="large" />} />);
        expect(container.querySelector(`.${noticeCls} .${noticeCls}-icon .${BASE_CLASS_PREFIX}-icon-toutiao_logo`)).not.toBeNull();
    });

    it('未指定尺寸的 Semi 图标按 large 渲染', () => {
        const { container } = render(() => <NotificationItem title="title" content="content" icon={<IconToutiaoLogo />} />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-icon-toutiao_logo`)).toHaveClass(`${BASE_CLASS_PREFIX}-icon-large`);
    });

    it('标题变化后 aria-labelledby 仍绑定到标题，没有标题时移除', () => {
        const [title, setTitle] = createSignal<string | undefined>('title');
        const [content, setContent] = createSignal('content');
        render(() => <NotificationItem title={title()} content={content()} />);
        const labelledBy = screen.getByRole('status').getAttribute('aria-labelledby') as string;
        setContent('changed');
        expect(screen.getByRole('status')).toHaveAttribute('aria-labelledby', labelledBy);
        expect(document.getElementById(labelledBy)).toHaveTextContent('title');
        setTitle(undefined);
        expect(screen.getByRole('status')).not.toHaveAttribute('aria-labelledby');
    });

    it('config', () => {
        Notification.config({ left: '300px', top: '400px' });
        show('info', { content: 'content', title: 'title', position: 'top' });
        expect(getList()).toHaveStyle({ left: '300px', top: '400px' });
    });

    it('数字偏移按 px 输出', () => {
        Notification.config({ top: 24 });
        show('info', { content: 'content', title: 'title', duration: 0 });
        expect(getList().style.top).toBe('24px');
    });

    it('显式传入 undefined 的 position 等同未传，沿用 Notification.config 的值', () => {
        Notification.config({ position: 'bottomLeft' });
        show('info', { content: 'content', title: 'title', position: undefined, duration: 0 });
        expect(getList()).toHaveAttribute('x-placement', 'bottomLeft');
    });

    it('useNotification 中显式传入 undefined 的 position 等同未传，沿用全局默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Notification: { position: 'bottomLeft' } };
        render(() => <HookHost />);
        api.info({ title: 'from hook', duration: 0, position: undefined });
        expect(getList()).toHaveAttribute('x-placement', 'bottomLeft');
    });

    it('resetConfig 恢复内置默认值', () => {
        vi.useFakeTimers();
        Notification.config({ top: '400px', duration: 0, position: 'bottomLeft', zIndex: 2333 });
        Notification.resetConfig();
        show('info', { content: 'content', title: 'title' });
        expect(document.querySelector(`.${prefixCls}-wrapper`)).toHaveStyle({ zIndex: '1010' });
        expect(getList()).toHaveAttribute('x-placement', 'topRight');
        expect(getList().style.top).toBe('');
        vi.advanceTimersByTime(3000);
        expect(screen.getByRole('status')).toHaveClass(hideTopRight);
    });

    it('同一批次中关闭的每条通知都会播放离开动画', () => {
        const getNotices = () => screen.queryAllByRole('status');
        Notification.info({ id: 'a', title: 'a', duration: 0 });
        Notification.info({ id: 'b', title: 'b', duration: 0 });
        Notification.close('a');
        Notification.close('b');
        expect(getNotices()).toHaveLength(2);
        getNotices().forEach((notice) => expect(notice).toHaveClass(hideTopRight));

        Notification.info({ id: 'c', title: 'c', duration: 0 });
        expect(getNotices()).toHaveLength(3);

        document.querySelectorAll(`.${hideTopRight}`).forEach(endAnimation);
        expect(getNotices().map((notice) => notice.querySelector(`.${noticeCls}-title`)?.textContent)).toEqual(['c']);
    });

    it.each([
        ['success', 'tick_circle'],
        ['info', 'info_circle'],
        ['warning', 'alert_triangle'],
        ['error', 'alert_circle'],
    ] as const)('%s 显示其类型图标', (type, icon) => {
        show(type, { title: type, duration: 0 });
        const notice = screen.getByRole(type === 'warning' || type === 'error' ? 'alert' : 'status');
        expect(notice).toHaveClass(noticeCls, `${noticeCls}-${type}`);
        expect(notice.querySelector(`.${noticeCls}-icon.${noticeCls}-${type} .${BASE_CLASS_PREFIX}-icon-${icon}`)).not.toBeNull();
    });

    it('open 没有类型图标', () => {
        show('open', { title: 'plain', duration: 0 });
        const notice = screen.getByRole('status');
        expect(notice).toHaveClass(`${noticeCls}-default`);
        expect(notice.querySelector(`.${noticeCls}-icon`)).toBeNull();
    });

    it('悬停时暂停关闭计时器，移出后重新开始计时', () => {
        vi.useFakeTimers();
        show('info', { title: 'hover', duration: 1 });
        vi.advanceTimersByTime(500);
        fireEvent.mouseEnter(getList());
        vi.advanceTimersByTime(5000);
        expect(screen.getByRole('status')).not.toHaveClass(hideTopRight);
        fireEvent.mouseLeave(getList());
        vi.advanceTimersByTime(999);
        expect(screen.getByRole('status')).not.toHaveClass(hideTopRight);
        vi.advanceTimersByTime(1);
        expect(screen.getByRole('status')).toHaveClass(hideTopRight);
    });

    it('悬停期间新来的通知同样暂停', () => {
        vi.useFakeTimers();
        show('info', { title: 'first', duration: 1 });
        fireEvent.mouseEnter(getList());
        show('info', { title: 'second', duration: 1 });
        vi.advanceTimersByTime(5000);
        expect(document.querySelectorAll(`.${hideTopRight}`)).toHaveLength(0);
        fireEvent.mouseLeave(getList());
        vi.advanceTimersByTime(1000);
        expect(document.querySelectorAll(`.${hideTopRight}`)).toHaveLength(2);
    });

    it('悬停只暂停所在位置的通知', () => {
        vi.useFakeTimers();
        show('info', { title: 'hovered', duration: 1, position: 'top' });
        show('info', { title: 'other', duration: 1, position: 'bottom' });
        fireEvent.mouseEnter(document.querySelector(`.${prefixCls}-list[x-placement=top]`) as HTMLElement);
        vi.advanceTimersByTime(1000);
        expect(document.querySelector(`.${noticeCls}-animation-hide_top`)).toBeNull();
        expect(document.querySelector(`.${noticeCls}-animation-hide_bottom`)).toHaveTextContent('other');
    });

    it('悬停期间按同 id 更新不会重启计时，移出后满 duration 才关闭且 onClose 只触发一次', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        show('info', { id: 'progress', title: 'upload', content: '10%', duration: 1, onClose });
        fireEvent.mouseEnter(getList());
        show('info', { id: 'progress', title: 'upload', content: '50%', duration: 1, onClose });
        vi.advanceTimersByTime(5000);
        expect(screen.getByRole('status')).toHaveTextContent('50%');
        expect(screen.getByRole('status')).not.toHaveClass(hideTopRight);

        fireEvent.mouseLeave(getList());
        vi.advanceTimersByTime(999);
        expect(screen.getByRole('status')).not.toHaveClass(hideTopRight);
        vi.advanceTimersByTime(1);
        expect(screen.getByRole('status')).toHaveClass(hideTopRight);
        vi.advanceTimersByTime(5000);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('duration 为 0 时不会自动关闭', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        show('info', { title: 'sticky', duration: 0, onClose });
        vi.advanceTimersByTime(60000);
        expect(screen.getByRole('status')).not.toHaveClass(hideTopRight);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('duration 结束时 onClose 只触发一次，每次点击 onClick 触发一次', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        const onClick = vi.fn<() => void>();
        show('info', { title: 'callbacks', duration: 1, onClose, onClick });
        fireEvent.click(screen.getByRole('status'));
        expect(onClick).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(1000);
        expect(onClose).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(5000);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('打开已存在的 id 时原地更新，并重新开始计时', () => {
        vi.useFakeTimers();
        show('open', { id: 'same', title: 'title', content: 'before', duration: 3 });
        const notice = screen.getByRole('status');
        vi.advanceTimersByTime(2000);
        show('open', { id: 'same', title: 'title', content: 'updated', duration: 10 });
        expect(screen.getAllByRole('status')).toHaveLength(1);
        expect(screen.getByRole('status')).toBe(notice);
        expect(notice).toHaveTextContent('updated');
        vi.advanceTimersByTime(9999);
        expect(notice).not.toHaveClass(hideTopRight);
        vi.advanceTimersByTime(1);
        expect(notice).toHaveClass(hideTopRight);
    });

    it('close 移除一条通知，destroyAll 移除 wrapper', () => {
        show('info', { id: 'one', title: 'one', duration: 0 });
        show('info', { id: 'two', title: 'two', duration: 0 });
        Notification.close('one');
        const leaving = document.querySelector(`.${hideTopRight}`) as HTMLElement;
        expect(leaving).toHaveTextContent('one');
        endAnimation(leaving);
        expect(screen.getAllByRole('status').map((notice) => notice.textContent)).toEqual(['two']);
        Notification.destroyAll();
        expect(document.querySelector(`.${prefixCls}-wrapper`)).toBeNull();
    });

    it('通知按位置分组，每个位置一个列表', () => {
        show('info', { title: 'a', duration: 0, position: 'bottom' });
        show('info', { title: 'b', duration: 0, position: 'bottom' });
        show('info', { title: 'c', duration: 0, position: 'topLeft' });
        expect(document.querySelectorAll(`.${prefixCls}-list`)).toHaveLength(2);
        const bottom = document.querySelector(`.${prefixCls}-list[x-placement=bottom]`) as HTMLElement;
        expect([...bottom.querySelectorAll(`.${noticeCls}-title`)].map((title) => title.textContent)).toEqual(['b', 'a']);
    });

    it('config 修改默认的 duration 与 position', () => {
        vi.useFakeTimers();
        Notification.config({ duration: 0, position: 'bottomLeft' });
        show('info', { title: 'configured' });
        expect(getList()).toHaveAttribute('x-placement', 'bottomLeft');
        vi.advanceTimersByTime(60000);
        expect(screen.getByRole('status')).not.toHaveClass(`${noticeCls}-animation-hide_bottomLeft`);
    });

    it('未指定 position 时，通知传 direction="rtl" 显示在左上角', () => {
        show('info', { title: 'rtl', duration: 0, direction: 'rtl' });
        expect(getList()).toHaveAttribute('x-placement', 'topLeft');
        expect(document.querySelector(`.${noticeCls}`)).toHaveAttribute('dir', 'rtl');
    });

    it('useNotification 的通知读取调用处的 ConfigProvider 与 LocaleProvider，静态方法读取默认值', () => {
        render(() => (
            <ConfigProvider direction="rtl">
                <LocaleProvider locale={en_US}>
                    <HookHost />
                </LocaleProvider>
            </ConfigProvider>
        ));
        api.info({ title: 'hooked', duration: 0 });
        Notification.success({ title: 'static', duration: 0 });
        const holderList = screen.getByTestId('holder').querySelector(`.${prefixCls}-list`) as HTMLElement;
        // no position: rtl falls back to the top left corner
        expect(holderList).toHaveAttribute('x-placement', 'topLeft');
        const hooked = screen.getByRole('status', { name: 'hooked' });
        expect(hooked).toHaveAttribute('dir', 'rtl');
        expect(hooked.querySelector('button')).toHaveAccessibleName(en_US.Notification.close);
        const staticNotice = screen.getByRole('status', { name: 'static' });
        expect(staticNotice).not.toHaveAttribute('dir');
        expect(staticNotice.closest(`.${prefixCls}-list`)).toHaveAttribute('x-placement', 'topRight');
        expect(staticNotice.querySelector('button')).toHaveAccessibleName(zh_CN.Notification.close);
    });

    it('卸载 useNotification 的调用方时清除通知的计时器', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        const { unmount } = render(() => <HookHost />);
        api.info({ title: 'gone', duration: 1, onClose });
        unmount();
        vi.advanceTimersByTime(2000);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('getPopupContainer 承载 wrapper', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        try {
            show('info', { title: 'inside', duration: 0, getPopupContainer: () => container });
            expect(container.querySelector(`.${prefixCls}-wrapper`)).toHaveTextContent('inside');
        } finally {
            container.remove();
        }
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Notification: { showClose: false, theme: 'light' } };
        show('info', { title: 'static', duration: 0 });
        const notice = screen.getByRole('status');
        expect(notice).toHaveClass(`${noticeCls}-light`);
        expect(notice.querySelector('button')).toBeNull();
        render(() => <NotificationItem title="direct" />);
        const direct = screen.getAllByRole('status').find((item) => item.textContent === 'direct') as HTMLElement;
        expect(direct).toHaveClass(`${noticeCls}-light`);
        expect(direct.querySelector('button')).toBeNull();
        show('info', { title: 'explicit', duration: 0, showClose: true });
        const explicit = screen.getAllByRole('status').find((item) => item.textContent === 'explicit') as HTMLElement;
        expect(explicit.querySelector('button')).not.toBeNull();
    });

    it('overrideDefaultProps.Notification 的 top、left 作用于通知列表', () => {
        semiGlobal.config.overrideDefaultProps = { Notification: { top: '120px', left: '80px', position: 'topLeft' } };
        show('info', { title: 'offset', duration: 0 });
        expect(getList()).toHaveStyle({ top: '120px', left: '80px' });
    });

    it('全局默认值里的 id 不生效，静态 API 的每条通知 id 各不相同', () => {
        // a caller without type checking can still put an instance id into the global config
        semiGlobal.config.overrideDefaultProps = { Notification: { id: 'shared', duration: 0 } as object };
        const first = Notification.info({ title: 'a' });
        const second = Notification.info({ title: 'b' });
        expect(first).not.toBe('shared');
        expect(first).not.toBe(second);
        expect(document.getElementById('shared')).toBeNull();
    });

    describe('useNotification', () => {
        it('在放置 contextHolder 的位置渲染通知', () => {
            render(() => <HookHost />);
            api.info({ title: 'hooked', duration: 0, position: 'bottom' });
            api.info({ title: 'hooked', duration: 0, position: 'bottom' });
            const list = screen.getByTestId('holder').querySelector(`.${prefixCls}-list[x-placement=bottom]`) as HTMLElement;
            expect(list.querySelectorAll(`[role=status].${noticeCls}-info`)).toHaveLength(2);
            expect(document.querySelector(`.${prefixCls}-wrapper`)).toBeNull();
        });

        it('到达 duration 后关闭并只调用一次 onClose', () => {
            vi.useFakeTimers();
            const onClose = vi.fn<() => void>();
            render(() => <HookHost />);
            api.info({ title: 'hooked', duration: 1, onClose });
            expect(screen.getByRole('status')).toHaveClass(`${noticeCls}-animation-show_topRight`);
            vi.advanceTimersByTime(1000);
            expect(onClose).toHaveBeenCalledTimes(1);
            const leaving = screen.getByRole('status');
            expect(leaving).toHaveClass(hideTopRight);
            endAnimation(leaving);
            expect(screen.queryByRole('status')).toBeNull();
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('通知以位置动画进入', () => {
            render(() => <HookHost />);
            api.info({ title: 'hooked', duration: 0, position: 'bottom' });
            expect(screen.getByRole('status')).toHaveClass(`${noticeCls}-animation-show_bottom`);
        });

        it('多个 hook 的通知各自留在自己的 holder 中', () => {
            let other: NotificationHookApi | undefined;
            function OtherHost() {
                const [notification, contextHolder] = Notification.useNotification();
                other = notification;
                return contextHolder;
            }
            render(() => (
                <>
                    <HookHost />
                    <OtherHost />
                </>
            ));
            api.info({ title: 'first', duration: 0 });
            other?.info({ title: 'from hook', duration: 0 });
            expect(screen.getByTestId('holder')).toHaveTextContent('first');
            expect(screen.getByTestId('holder')).not.toHaveTextContent('from hook');
            expect(screen.getAllByRole('status')).toHaveLength(2);
        });

        it('close(id) 关闭 hook 的通知', () => {
            render(() => <HookHost />);
            api.close(api.info({ title: 'hooked', duration: 0 }));
            const leaving = screen.getByRole('status');
            expect(leaving).toHaveClass(hideTopRight);
            endAnimation(leaving);
            expect(screen.getByTestId('holder')).not.toHaveTextContent('hooked');
        });

        it('overrideDefaultProps.Notification 的 duration、position 优先于内置默认值', () => {
            vi.useFakeTimers();
            semiGlobal.config.overrideDefaultProps = { Notification: { duration: 10, position: 'bottomLeft' } };
            render(() => <HookHost />);
            api.info({ title: 'hooked' });
            const holder = screen.getByTestId('holder');
            expect(holder.querySelector(`.${prefixCls}-list[x-placement=bottomLeft]`)).not.toBeNull();
            vi.advanceTimersByTime(9000);
            expect(holder).toHaveTextContent('hooked');
            vi.advanceTimersByTime(1000);
            expect(holder.querySelector('[role=status]')).toHaveClass(`${noticeCls}-animation-hide_bottomLeft`);
        });

        it('读取 semiGlobal overrideDefaultProps.Notification 中的默认值，且只渲染一份', () => {
            semiGlobal.config.overrideDefaultProps = { Notification: { showClose: false, theme: 'light' } };
            render(() => <HookHost />);
            api.info({ title: 'hooked', duration: 0 });
            const notice = screen.getByRole('status');
            expect(notice).toHaveClass(`${noticeCls}-light`);
            expect(notice.querySelector('button')).toBeNull();
        });

        it('contextHolder 位于 keep-interactive 容器内', () => {
            render(() => <HookHost />);
            api.info({ title: 'hooked', duration: 0 });
            expect(getList().closest(`[${KEEP_INTERACTIVE_ATTRIBUTE}]`)).not.toBeNull();
        });
    });

    it('data-* 等未知选项落在通知根节点上，列表的选项不落在 DOM 上', () => {
        show('info', { title: 'static', duration: 0, 'data-testid': 'static-notice' });
        expect(screen.getByTestId('static-notice')).toHaveAttribute('role', 'status');
        render(() => <NotificationItem data-testid="direct-notice" title="direct" />);
        expect(screen.getByTestId('direct-notice')).toHaveAttribute('role', 'status');
        expect(screen.getByTestId('static-notice')).not.toHaveAttribute('id');
        expect(screen.getByTestId('static-notice')).not.toHaveAttribute('position');
        expect(screen.getByTestId('static-notice')).not.toHaveAttribute('zindex');
    });

    it('单个通知的 ref 拿到通知元素', () => {
        let element: HTMLDivElement | undefined;
        render(() => <NotificationItem title="ref" ref={(el) => (element = el)} />);
        expect(element).toBe(screen.getByRole('status'));
    });

    it('info、success 与 open 的通知为 status，warning、error 为 alert', () => {
        show('info', { title: 'info', duration: 0 });
        show('success', { title: 'success', duration: 0 });
        show('open', { title: 'plain', duration: 0 });
        show('warning', { title: 'warning', duration: 0 });
        show('error', { title: 'error', duration: 0 });
        expect(screen.getAllByRole('status').map((notice) => notice.textContent)).toEqual(expect.arrayContaining(['info', 'success', 'plain']));
        expect(screen.getAllByRole('status')).toHaveLength(3);
        expect(screen.getAllByRole('alert').map((notice) => notice.textContent)).toEqual(expect.arrayContaining(['warning', 'error']));
        expect(screen.getAllByRole('alert')).toHaveLength(2);
    });

    it('焦点在列表内时暂停关闭计时器，焦点离开后重新计时', () => {
        vi.useFakeTimers();
        show('info', { title: 'focus', duration: 1 });
        const close = screen.getByRole('button', { name: zh_CN.Notification.close });
        close.focus();
        vi.advanceTimersByTime(2000);
        expect(screen.getByRole('status')).not.toHaveClass(hideTopRight);
        close.blur();
        vi.advanceTimersByTime(999);
        expect(screen.getByRole('status')).not.toHaveClass(hideTopRight);
        vi.advanceTimersByTime(1);
        expect(screen.getByRole('status')).toHaveClass(hideTopRight);
    });

    it('焦点进入收起的堆叠时展开', () => {
        show('info', { title: 'first', duration: 0, stack: 1 });
        show('info', { title: 'second', duration: 0, stack: 1 });
        const items = () => [...document.querySelectorAll(`.${noticeCls}-stack-item`)];
        expect(items()).toHaveLength(2);
        expect(items().some((item) => item.classList.contains(`${noticeCls}-stack-item-expanded`))).toBe(false);
        const [newest, behind] = screen.getAllByRole('button', { name: zh_CN.Notification.close });
        expect(behind).toBeDefined();
        behind.focus();
        expect(items().every((item) => item.classList.contains(`${noticeCls}-stack-item-expanded`))).toBe(true);
        newest.focus();
        newest.blur();
        expect(items().some((item) => item.classList.contains(`${noticeCls}-stack-item-expanded`))).toBe(false);
    });

    it('收起的堆叠按深度错开，三层之后隐藏，底部位置向上错开', () => {
        for (const title of ['a', 'b', 'c', 'd', 'e']) {
            show('info', { title, duration: 0, stack: 1, position: 'bottom' });
        }
        const items = [...document.querySelectorAll<HTMLElement>(`.${noticeCls}-stack-item`)];
        expect(items.map((item) => item.style.zIndex)).toEqual(['5', '4', '3', '2', '1']);
        expect(items[0].style.transform).toBe('');
        expect(items[1].style.transform).toBe('translateY(-8px) scaleX(0.95)');
        expect(items.map((item) => item.classList.contains(`${noticeCls}-stack-item-hidden`))).toEqual([false, false, false, true, true]);
    });

    it('后一条通知切换 stack 时，已显示的通知不重新计时', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        show('info', { id: 'a', title: 'A', duration: 3, onClose });
        vi.advanceTimersByTime(2000);
        show('info', { id: 'b', title: 'B', duration: 0, stack: true });
        vi.advanceTimersByTime(1100);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('后一条通知切换 stack 时，已显示通知的节点与焦点保持不变', () => {
        show('info', { id: 'a', title: 'A', duration: 0 });
        const first = screen.getByRole('status');
        const closeButton = screen.getByRole('button', { name: zh_CN.Notification.close });
        closeButton.focus();
        show('info', { id: 'b', title: 'B', duration: 0, stack: true });
        expect(first.isConnected).toBe(true);
        expect(document.activeElement).toBe(closeButton);
    });

    it('聚焦的通知被移除后，其余通知不再永久暂停', () => {
        vi.useFakeTimers();
        show('info', { id: 'gone', title: 'gone', duration: 0 });
        show('info', { id: 'stays', title: 'stays', duration: 1 });
        const [, goneClose] = screen.getAllByRole('button', { name: zh_CN.Notification.close });
        goneClose.focus();
        Notification.close('gone');
        const gone = screen.getAllByRole('status').find((notice) => notice.textContent === 'gone') as HTMLElement;
        endAnimation(gone);
        vi.advanceTimersByTime(1000);
        expect(screen.getByRole('status')).toHaveClass(hideTopRight);
    });

    it('列表在指针下卸载后，同一位置的新通知不再暂停', () => {
        vi.useFakeTimers();
        show('info', { id: 'only', title: 'only', duration: 0 });
        fireEvent.mouseEnter(getList());
        Notification.close('only');
        endAnimation(screen.getByRole('status'));
        expect(getList()).toBeNull();
        show('info', { title: 'next', duration: 1 });
        vi.advanceTimersByTime(1000);
        expect(screen.getByRole('status')).toHaveClass(hideTopRight);
    });

    it('title、content 为数字 0 时照常渲染并绑定 aria-labelledby', () => {
        show('info', { title: 0, content: 0, duration: 0 });
        const notice = screen.getByRole('status');
        expect(notice.querySelector(`.${noticeCls}-title`)).toHaveTextContent('0');
        expect(notice.querySelector(`.${noticeCls}-content`)).toHaveTextContent('0');
        expect(notice).toHaveAttribute('aria-labelledby');
    });

    it('通知不带无样式的 icon-show 类', () => {
        show('info', { title: 'info', duration: 0 });
        show('open', { title: 'plain', duration: 0 });
        expect(document.querySelectorAll(`.${noticeCls}-icon-show`)).toHaveLength(0);
    });

    it('内置默认值与选项类型都没有 motion，config 不接受 direction', () => {
        expect(new NotificationListStore().defaults).not.toHaveProperty('motion');
        expectTypeOf<NoticeInstance>().not.toHaveProperty('motion');
        expectTypeOf<ConfigProps>().not.toHaveProperty('direction');
    });

    it('静态方法与 hook 的选项类型不含由列表提供的键，接受 data-*、aria-* 与 dir', () => {
        type StaticOptions = Parameters<typeof Notification.info>[0];
        for (const key of ['close', 'ref'] as const) {
            expectTypeOf<StaticOptions>().not.toHaveProperty(key);
            expectTypeOf<NotificationHookOptions>().not.toHaveProperty(key);
        }
        for (const key of ['id', 'type', 'zIndex', 'getPopupContainer'] as const) {
            expectTypeOf<NotificationHookOptions>().not.toHaveProperty(key);
        }
        expectTypeOf<NotificationHookOptions>().toHaveProperty('position');
        expectTypeOf<Parameters<NotificationHookApi['info']>>().toEqualTypeOf<[NotificationHookOptions]>();
        expectTypeOf<ReturnType<typeof Notification.useNotification>>().toEqualTypeOf<[NotificationHookApi, JSX.Element]>();
        expectTypeOf({ title: 'a', 'data-testid': 'x', 'aria-describedby': 'y', dir: 'rtl' as const }).toExtend<StaticOptions>();
        expectTypeOf({ title: 'a', 'data-testid': 'x' }).toExtend<NotificationHookOptions>();
        // @ts-expect-error close is supplied by the list
        const withClose: StaticOptions = { title: 'a', close: () => {} };
        expect(withClose).toBeDefined();
    });

    it('NoticeState 是空接口，没有字段', () => {
        expectTypeOf<keyof NoticeState>().toBeNever();
    });
});
