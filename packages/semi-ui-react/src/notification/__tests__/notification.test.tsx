import { StrictMode, useEffect } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import type { NoticeInstance } from '@fibrae/semi-foundation/notification/notification-foundation';
import NotificationListStore, { type ConfigProps } from '@fibrae/semi-foundation/notification/notification-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { IconToutiaoLogo } from '@fibrae/semi-icons-react';
import { ConfigProvider, Notification } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { NoticeReactProps, NoticeState, NotificationHookOptions } from '../index';
import NotificationItem from '../notice';
import type { NotificationHookApi } from '../use-notification';

const prefixCls = `${BASE_CLASS_PREFIX}-notification`;
const noticeCls = `${prefixCls}-notice`;

// the static API renders into its own root under document.body, outside Testing Library's container
const show = (method, opts) =>
    act(() => {
        Notification[method](opts);
    });
const getTitle = (selector) => document.querySelector(`${selector} .${noticeCls}-title`);
const endAnimation = (element) =>
    act(() => {
        element.dispatchEvent(new Event('webkitAnimationEnd', { bubbles: true }));
    });

function HookCaller(options: NoticeReactProps) {
    const [notification, contextHolder] = Notification.useNotification();
    return (
        <>
            {contextHolder}
            <button onClick={() => notification.info({ title: 'from hook', duration: 0, ...options })}>hook add</button>
        </>
    );
}

describe('Notification', () => {
    beforeEach(() => {
        // jsdom runs no animation; report one so the list waits for the animationend the tests dispatch
        vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([{ animationName: 'show' } as CSSAnimation]);
    });
    // destroyAll unmounts the list's root in a microtask, so it goes through an async act
    afterEach(async () => {
        await act(async () => Notification.destroyAll());
        Notification.resetConfig();
        vi.useRealTimers();
    });

    describe('读屏播报', () => {
        const getAnnouncer = () => document.querySelector(`.${noticeCls}-announcer`);
        it('常驻播报区先于通知存在，标题与内容在之后的任务中写入，随后清空', () => {
            vi.useFakeTimers();
            show('info', { title: 'Saved', content: 'All changes stored', duration: 0, motion: false });
            expect(getAnnouncer()).toHaveAttribute('aria-live', 'polite');
            expect(getAnnouncer()).toBeEmptyDOMElement();
            act(() => {
                vi.advanceTimersByTime(100);
            });
            expect(getAnnouncer()).toHaveTextContent(/^Saved All changes stored$/);
            act(() => {
                vi.advanceTimersByTime(1000);
            });
            expect(getAnnouncer()).toBeEmptyDOMElement();
        });
        it('通知项自身不再播报，warning 和 error 保持 alert 且不写入播报区', () => {
            vi.useFakeTimers();
            show('info', { title: 'info', duration: 0 });
            show('error', { title: 'failed', duration: 0 });
            expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'off');
            expect(screen.getByRole('alert')).not.toHaveAttribute('aria-live');
            act(() => {
                vi.advanceTimersByTime(100);
            });
            expect(getAnnouncer()).toHaveTextContent(/^info$/);
        });
    });

    it('列表挂载前添加的通知共用同一个 wrapper', async () => {
        act(() => {
            Notification.info({ title: 'first', duration: 0 });
            Notification.info({ title: 'second', duration: 0 });
        });
        expect(document.querySelectorAll(`.${prefixCls}-wrapper`)).toHaveLength(1);
        expect(document.querySelectorAll(`.${noticeCls}-title`)).toHaveLength(2);
        await act(async () => Notification.destroyAll());
        expect(document.querySelector(`.${prefixCls}-wrapper`)).toBeNull();
    });

    it('列表挂载前的更新与关闭落在同一个 wrapper 中，且没有离开动画', async () => {
        act(() => {
            const dropped = Notification.info({ title: 'dropped', duration: 0 });
            Notification.info({ id: 'kept', title: 'kept', content: 'before', duration: 0 });
            Notification.close(dropped);
            Notification.info({ id: 'kept', title: 'kept', content: 'after', duration: 0 });
        });
        expect(document.querySelectorAll(`.${prefixCls}-wrapper`)).toHaveLength(1);
        const notices = screen.getAllByRole('status');
        expect(notices).toHaveLength(1);
        expect(notices[0]).toHaveTextContent('after');
        expect(notices[0]).not.toHaveClass(`${noticeCls}-animation-hide_topRight`);
    });

    it('列表挂载前更新过的通知只关闭一次', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        act(() => {
            Notification.info({ id: 'early', title: 'a', duration: 1, onClose });
            Notification.info({ id: 'early', title: 'b', duration: 1, onClose });
        });
        void act(() => vi.advanceTimersByTime(1000));
        expect(onClose).toHaveBeenCalledTimes(1);
        void act(() => vi.advanceTimersByTime(5000));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('同一批次中打开并关闭的通知会播放离开动画', () => {
        show('info', { title: 'mounted', duration: 0 });
        act(() => {
            const id = Notification.info({ title: 'brief', duration: 0 });
            Notification.close(id);
        });
        const brief = screen.getAllByRole('status').find((notice) => notice.textContent === 'brief');
        expect(brief).toHaveClass(`${noticeCls}-animation-hide_topRight`);
        act(() => {
            brief.dispatchEvent(new Event('webkitAnimationEnd', { bubbles: true }));
        });
        expect(screen.getAllByRole('status').map((notice) => notice.textContent)).toEqual(['mounted']);
    });

    it('destroyAll 后立即打开的通知在新的 wrapper 中单独显示', async () => {
        show('info', { title: 'old', duration: 0 });
        const oldWrapper = document.querySelector(`.${prefixCls}-wrapper`);
        await act(async () => {
            Notification.destroyAll();
            Notification.info({ title: 'new', duration: 0 });
        });
        const wrappers = document.querySelectorAll(`.${prefixCls}-wrapper`);
        expect(wrappers).toHaveLength(1);
        expect(wrappers[0]).not.toBe(oldWrapper);
        const notices = screen.getAllByRole('status');
        expect(notices.map((notice) => notice.textContent)).toEqual(['new']);
        expect(notices[0]).not.toHaveClass(`${noticeCls}-animation-hide_topRight`);
    });

    it('打开、更新与关闭不产生 React 警告', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
            show('info', { id: 'warn', title: 'a', duration: 0 });
            show('info', { id: 'warn', title: 'b', duration: 0 });
            act(() => {
                Notification.close('warn');
            });
            render(
                <StrictMode>
                    <HookCaller />
                </StrictMode>
            );
            fireEvent.click(screen.getByRole('button', { name: 'hook add' }));
            expect(error).not.toHaveBeenCalled();
        } finally {
            error.mockRestore();
        }
    });

    it('title&content、zIndex', () => {
        show('open', {
            title: 'Hi, Bytedance',
            content: 'ies dance dance dance',
            duration: 1,
            zIndex: 2333,
        });
        expect(document.querySelector(`.${prefixCls}-wrapper`)).toHaveStyle({ zIndex: '2333' });
        const notificationInner = document.querySelector(`.${noticeCls}-content-wrapper`);
        expect(notificationInner.childElementCount).toEqual(2);
        expect(notificationInner.querySelector(`.${noticeCls}-title`)).toHaveTextContent(/^Hi, Bytedance$/);
        expect(notificationInner.querySelector(`.${noticeCls}-content`)).toHaveTextContent(/^ies dance dance dance$/);
    });

    it('duration', () => {
        vi.useFakeTimers();
        show('open', {
            title: 'Hi, Bytedance',
            content: 'ies dance dance dance',
            duration: 1,
        });
        const getList = () => document.querySelector(`.${prefixCls}-list`);
        expect(getList().childElementCount).toEqual(1);

        act(() => {
            vi.advanceTimersByTime(999);
        });
        expect(screen.getByRole('status')).not.toHaveClass(`${noticeCls}-animation-hide_topRight`);

        act(() => {
            vi.advanceTimersByTime(1);
        });
        const notice = screen.getByRole('status');
        expect(notice).toHaveClass(`${noticeCls}-animation-hide_topRight`);
        // jsdom runs no CSS animations, so end the leave animation by hand. jsdom has no AnimationEvent, which makes
        // React listen for the webkit-prefixed event name instead of animationend
        fireEvent(notice, new Event('webkitAnimationEnd', { bubbles: true }));
        expect(getList()).toBeNull();
    });

    it('手动关闭后计时器不再触发第二次 onClose', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        show('open', { title: 'manual', duration: 1, onClose });
        act(() => {
            vi.advanceTimersByTime(500);
        });
        fireEvent.click(screen.getByRole('button', { name: zh_CN.Notification.close }));
        expect(onClose).toHaveBeenCalledTimes(1);
        act(() => {
            vi.advanceTimersByTime(5000);
        });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('Notification.close 进入离场后，剩余计时到期不触发 onClose', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        show('info', { id: 'leaving', title: 'leaving', duration: 1, onClose });
        act(() => {
            vi.advanceTimersByTime(900);
        });
        act(() => {
            Notification.close('leaving');
        });
        expect(screen.getByRole('status')).toHaveClass(`${noticeCls}-animation-hide_topRight`);
        act(() => {
            vi.advanceTimersByTime(200);
        });
        expect(onClose).not.toHaveBeenCalled();
    });

    it('contextHolder 重新挂载时，残留的离场通知不计时，到期不触发 onClose', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        let api;
        function Host({ shown }: { shown: boolean }) {
            const [notification, contextHolder] = Notification.useNotification();
            useEffect(() => {
                api = notification;
            });
            return <>{shown && contextHolder}</>;
        }
        const view = render(<Host shown />);
        act(() => {
            api.close(api.info({ title: 'leftover', duration: 1, onClose }));
        });
        view.rerender(<Host shown={false} />);
        view.rerender(<Host shown />);
        expect(screen.getByRole('status')).toHaveClass(`${noticeCls}-animation-hide_topRight`);
        act(() => {
            vi.advanceTimersByTime(2000);
        });
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
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        act(() => {
            Notification.close('again');
        });
        expect(screen.getByRole('status')).toHaveClass(`${noticeCls}-animation-hide_topRight`);
        show('info', { id: 'again', title: 'again', duration: 2 });
        act(() => {
            vi.advanceTimersByTime(1500);
        });
        expect(screen.getByRole('status')).not.toHaveClass(`${noticeCls}-animation-hide_topRight`);
        act(() => {
            vi.advanceTimersByTime(500);
        });
        expect(screen.getByRole('status')).toHaveClass(`${noticeCls}-animation-hide_topRight`);
    });

    it('position-top', () => {
        show('open', {
            title: 'top demo',
            content: 'ies dance dance dance',
            duration: 1,
            position: 'top',
        });
        expect(getTitle(`.${prefixCls}-list[x-placement=top] .${noticeCls}-content-wrapper`)).toHaveTextContent(/^top demo$/);
        expect(getTitle(`.${prefixCls}-list[x-placement=bottom] .${noticeCls}-content-wrapper`)).toBeNull();
    });

    it('position-topLeft', () => {
        show('open', {
            title: 'topLeft demo',
            content: 'ies dance dance dance',
            duration: 1,
            position: 'topLeft',
        });
        expect(getTitle(`.${prefixCls}-list[x-placement=topLeft] .${noticeCls}-content-wrapper`)).toHaveTextContent(/^topLeft demo$/);
    });

    it('position-bottomLeft', () => {
        show('open', {
            title: 'bottomLeft demo',
            content: 'ies dance dance dance',
            duration: 1,
            position: 'bottomLeft',
        });
        expect(getTitle(`.${prefixCls}-list[x-placement=bottomLeft] .${noticeCls}-content-wrapper`)).toHaveTextContent(/^bottomLeft demo$/);
    });

    it('position-bottomRight', () => {
        show('open', {
            title: 'bottomRight demo',
            content: 'ies dance dance dance',
            duration: 1,
            position: 'bottomRight',
        });
        expect(getTitle(`.${prefixCls}-list[x-placement=bottomRight] .${noticeCls}-content-wrapper`)).toHaveTextContent(/^bottomRight demo$/);
    });

    it('success', () => {
        show('success', { title: 'success demo', duration: 1 });
        expect(getTitle(`.${noticeCls}-success`)).toHaveTextContent(/^success demo$/);
    });

    it('info', () => {
        show('info', { title: 'info demo', duration: 1 });
        expect(getTitle(`.${noticeCls}-info`)).toHaveTextContent(/^info demo$/);
    });

    it('warning', () => {
        show('warning', { title: 'warning demo', duration: 1 });
        expect(getTitle(`.${noticeCls}-warning`)).toHaveTextContent(/^warning demo$/);
    });

    it('error', () => {
        show('error', { title: 'error demo', duration: 1 });
        expect(getTitle(`.${noticeCls}-error`)).toHaveTextContent(/^error demo$/);
    });

    it('主题 error-light', () => {
        show('error', { title: 'light error demo', duration: 1, theme: 'light' });
        expect(getTitle(`.${noticeCls}-light.${noticeCls}-error`)).toHaveTextContent(/^light error demo$/);
    });

    it('主题 info-light', () => {
        show('info', { title: 'light info demo', duration: 1, theme: 'light' });
        expect(getTitle(`.${noticeCls}-light.${noticeCls}-info`)).toHaveTextContent(/^light info demo$/);
    });

    it('主题 warning-light', () => {
        show('warning', { title: 'light warning demo', duration: 1, theme: 'light' });
        expect(getTitle(`.${noticeCls}-light.${noticeCls}-warning`)).toHaveTextContent(/^light warning demo$/);
    });

    it('主题 success-light', () => {
        show('success', { title: 'light success demo', duration: 1, theme: 'light' });
        expect(getTitle(`.${noticeCls}-light.${noticeCls}-success`)).toHaveTextContent(/^light success demo$/);
    });

    it('onClick', async () => {
        const spyOnClick = vi.fn<() => void>();
        render(<NotificationItem title="title" content="content" onClick={spyOnClick} />);
        await userEvent.click(screen.getByRole('status'));
        expect(spyOnClick).toHaveBeenCalledTimes(1);
    });

    it('onClose', async () => {
        const spyOnClose = vi.fn<() => void>();
        const spyOnClick = vi.fn<() => void>();
        render(<NotificationItem title="title" content="content" onClick={spyOnClick} onClose={spyOnClose} />);
        await userEvent.click(screen.getByRole('button'));
        expect(spyOnClose).toHaveBeenCalledTimes(1);
        // the close button stops propagation, so the notice itself is not clicked
        expect(spyOnClick).not.toHaveBeenCalled();
    });

    it('onCloseClick', async () => {
        const spyOnCloseClick = vi.fn<() => void>();
        render(<NotificationItem id="notice-id" title="title" content="content" onCloseClick={spyOnCloseClick} />);
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
        // jsdom fires no animationend, so the notice stays mounted while leaving
        expect(screen.getByRole('status')).toHaveClass(`${noticeCls}-animation-hide_topRight`);
        fireEvent.click(button);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onCloseClick).toHaveBeenCalledTimes(1);
    });

    it('回调显式为 null 时点击与关闭不抛错', async () => {
        render(<NotificationItem title="title" content="content" onClick={null} onClose={null} onCloseClick={null} />);
        await userEvent.click(screen.getByRole('status'));
        await userEvent.click(screen.getByRole('button'));
        expect(screen.getByRole('status')).toHaveTextContent('content');
    });

    it('showClose', () => {
        render(<NotificationItem title="title" content="content" showClose={false} onCloseClick={vi.fn<() => void>()} />);
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('icon', () => {
        const { container } = render(<NotificationItem title="title" content="content" icon={<IconToutiaoLogo style={{ color: 'red' }} size="large" />} />);
        expect(container.querySelector(`.${noticeCls} .${noticeCls}-icon .${BASE_CLASS_PREFIX}-icon-toutiao_logo`)).not.toBeNull();
    });

    it('重新渲染后 aria-labelledby 仍绑定到标题', () => {
        const { rerender } = render(<NotificationItem title="title" content="content" />);
        const labelledBy = screen.getByRole('status').getAttribute('aria-labelledby');
        rerender(<NotificationItem title="title" content="changed" />);
        expect(screen.getByRole('status')).toHaveAttribute('aria-labelledby', labelledBy);
        expect(document.getElementById(labelledBy)).toHaveTextContent('title');
        rerender(<NotificationItem content="no title" />);
        expect(screen.getByRole('status')).not.toHaveAttribute('aria-labelledby');
    });

    it('config', () => {
        Notification.config({
            left: '300px',
            top: '400px',
        });
        show('info', { content: 'content', title: 'title', position: 'top' });
        expect(document.querySelector(`.${prefixCls}-list`)).toHaveStyle({ left: '300px', top: '400px' });
    });

    it('显式传入 undefined 的 position 等同未传，沿用 Notification.config 的值', () => {
        Notification.config({ position: 'bottomLeft' });
        show('info', { content: 'content', title: 'title', position: undefined, duration: 0 });
        expect(document.querySelector(`.${prefixCls}-list`)).toHaveAttribute('x-placement', 'bottomLeft');
    });

    it('useNotification 中显式传入 undefined 的 position 等同未传，沿用全局默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Notification: { position: 'bottomLeft' } };
        try {
            render(<HookCaller position={undefined} />);
            fireEvent.click(screen.getByText('hook add'));
            expect(document.querySelector(`.${prefixCls}-list`)).toHaveAttribute('x-placement', 'bottomLeft');
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('resetConfig 恢复内置默认值', () => {
        vi.useFakeTimers();
        Notification.config({ top: '400px', duration: 0, position: 'bottomLeft', zIndex: 2333 });
        Notification.resetConfig();
        show('info', { content: 'content', title: 'title' });
        expect(document.querySelector(`.${prefixCls}-wrapper`)).toHaveStyle({ zIndex: '1010' });
        const list = document.querySelector<HTMLElement>(`.${prefixCls}-list`);
        expect(list).toHaveAttribute('x-placement', 'topRight');
        expect(list.style.top).toBe('');
        act(() => {
            vi.advanceTimersByTime(3000);
        });
        expect(screen.getByRole('status')).toHaveClass(`${noticeCls}-animation-hide_topRight`);
    });

    it('同一批次中关闭的每条通知都会播放离开动画', () => {
        const getNotices = () => screen.queryAllByRole('status');
        const hideCls = `${noticeCls}-animation-hide_topRight`;
        act(() => {
            Notification.info({ id: 'a', title: 'a', duration: 0 });
        });
        act(() => {
            Notification.info({ id: 'b', title: 'b', duration: 0 });
        });
        act(() => {
            Notification.close('a');
            Notification.close('b');
        });
        expect(getNotices()).toHaveLength(2);
        getNotices().forEach((notice) => expect(notice).toHaveClass(hideCls));

        act(() => {
            Notification.info({ id: 'c', title: 'c', duration: 0 });
        });
        expect(getNotices()).toHaveLength(3);

        act(() => {
            document.querySelectorAll(`.${hideCls}`).forEach((notice) => notice.dispatchEvent(new Event('webkitAnimationEnd', { bubbles: true })));
        });
        expect(getNotices().map((notice) => notice.querySelector(`.${noticeCls}-title`).textContent)).toEqual(['c']);
    });

    it.each([
        ['success', 'tick_circle'],
        ['info', 'info_circle'],
        ['warning', 'alert_triangle'],
        ['error', 'alert_circle'],
    ])('%s 显示其类型图标', (type, icon) => {
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
        const hideCls = `${noticeCls}-animation-hide_topRight`;
        void act(() => vi.advanceTimersByTime(500));
        fireEvent.mouseEnter(screen.getByRole('status'));
        void act(() => vi.advanceTimersByTime(5000));
        expect(screen.getByRole('status')).not.toHaveClass(hideCls);
        fireEvent.mouseLeave(screen.getByRole('status'));
        void act(() => vi.advanceTimersByTime(999));
        expect(screen.getByRole('status')).not.toHaveClass(hideCls);
        void act(() => vi.advanceTimersByTime(1));
        expect(screen.getByRole('status')).toHaveClass(hideCls);
    });

    it('悬停期间按同 id 更新不会重启计时，移出后满 duration 才关闭且 onClose 只触发一次', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        const hideCls = `${noticeCls}-animation-hide_topRight`;
        show('info', { id: 'progress', title: 'upload', content: '10%', duration: 1, onClose });
        fireEvent.mouseEnter(screen.getByRole('status'));
        show('info', { id: 'progress', title: 'upload', content: '50%', duration: 1, onClose });
        void act(() => vi.advanceTimersByTime(5000));
        expect(screen.getByRole('status')).toHaveTextContent('50%');
        expect(screen.getByRole('status')).not.toHaveClass(hideCls);

        fireEvent.mouseLeave(screen.getByRole('status'));
        void act(() => vi.advanceTimersByTime(999));
        expect(screen.getByRole('status')).not.toHaveClass(hideCls);
        void act(() => vi.advanceTimersByTime(1));
        expect(screen.getByRole('status')).toHaveClass(hideCls);
        void act(() => vi.advanceTimersByTime(5000));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('duration 为 0 时不会自动关闭', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        show('info', { title: 'sticky', duration: 0, onClose });
        void act(() => vi.advanceTimersByTime(60000));
        expect(screen.getByRole('status')).not.toHaveClass(`${noticeCls}-animation-hide_topRight`);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('duration 结束时 onClose 只触发一次，每次点击 onClick 触发一次', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        const onClick = vi.fn<() => void>();
        show('info', { title: 'callbacks', duration: 1, onClose, onClick });
        fireEvent.click(screen.getByRole('status'));
        expect(onClick).toHaveBeenCalledTimes(1);
        void act(() => vi.advanceTimersByTime(1000));
        expect(onClose).toHaveBeenCalledTimes(1);
        void act(() => vi.advanceTimersByTime(5000));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('打开已存在的 id 时原地更新，并重新开始计时', () => {
        vi.useFakeTimers();
        const hideCls = `${noticeCls}-animation-hide_topRight`;
        show('open', { id: 'same', title: 'title', content: 'before', duration: 3 });
        void act(() => vi.advanceTimersByTime(2000));
        show('open', { id: 'same', title: 'title', content: 'updated', duration: 10 });
        expect(screen.getAllByRole('status')).toHaveLength(1);
        expect(screen.getByRole('status')).toHaveTextContent('updated');
        void act(() => vi.advanceTimersByTime(9999));
        expect(screen.getByRole('status')).not.toHaveClass(hideCls);
        void act(() => vi.advanceTimersByTime(1));
        expect(screen.getByRole('status')).toHaveClass(hideCls);
    });

    it('close 移除一条通知，destroyAll 移除 wrapper', async () => {
        show('info', { id: 'one', title: 'one', duration: 0 });
        show('info', { id: 'two', title: 'two', duration: 0 });
        act(() => {
            Notification.close('one');
        });
        const leaving = document.querySelector(`.${noticeCls}-animation-hide_topRight`);
        expect(leaving).toHaveTextContent('one');
        act(() => {
            leaving.dispatchEvent(new Event('webkitAnimationEnd', { bubbles: true }));
        });
        expect(screen.getAllByRole('status').map((notice) => notice.textContent)).toEqual(['two']);
        await act(async () => Notification.destroyAll());
        expect(document.querySelector(`.${prefixCls}-wrapper`)).toBeNull();
    });

    it('通知按位置分组，每个位置一个列表', () => {
        show('info', { title: 'a', duration: 0, position: 'bottom' });
        show('info', { title: 'b', duration: 0, position: 'bottom' });
        show('info', { title: 'c', duration: 0, position: 'topLeft' });
        expect(document.querySelectorAll(`.${prefixCls}-list`)).toHaveLength(2);
        const bottom = document.querySelector(`.${prefixCls}-list[x-placement=bottom]`);
        expect([...bottom.querySelectorAll(`.${noticeCls}-title`)].map((title) => title.textContent)).toEqual(['b', 'a']);
    });

    it('config 修改默认的 duration 与 position', () => {
        vi.useFakeTimers();
        Notification.config({ duration: 0, position: 'bottomLeft' });
        show('info', { title: 'configured' });
        expect(document.querySelector(`.${prefixCls}-list`)).toHaveAttribute('x-placement', 'bottomLeft');
        void act(() => vi.advanceTimersByTime(60000));
        expect(screen.getByRole('status')).not.toHaveClass(`${noticeCls}-animation-hide_bottomLeft`);
    });

    it('未指定 position 时，通知传 direction="rtl" 显示在左上角', () => {
        show('info', { title: 'rtl', duration: 0, direction: 'rtl' });
        expect(document.querySelector(`.${prefixCls}-list`)).toHaveAttribute('x-placement', 'topLeft');
        expect(document.querySelector(`.${noticeCls}`)).toHaveAttribute('dir', 'rtl');
    });

    it('未指定 position 时，ConfigProvider direction="rtl" 下 useNotification 的通知显示在左上角', () => {
        render(
            <ConfigProvider direction="rtl">
                <HookCaller />
            </ConfigProvider>
        );
        fireEvent.click(screen.getByRole('button', { name: 'hook add' }));
        expect(document.querySelector(`.${prefixCls}-list`)).toHaveAttribute('x-placement', 'topLeft');
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
        try {
            show('info', { title: 'static', duration: 0 });
            const notice = screen.getByRole('status');
            expect(notice).toHaveClass(`${noticeCls}-light`);
            expect(notice.querySelector('button')).toBeNull();
            render(<NotificationItem title="direct" />);
            const direct = screen.getAllByRole('status').find((item) => item.textContent === 'direct');
            expect(direct).toHaveClass(`${noticeCls}-light`);
            expect(direct.querySelector('button')).toBeNull();
            show('info', { title: 'explicit', duration: 0, showClose: true });
            const explicit = screen.getAllByRole('status').find((item) => item.textContent === 'explicit');
            expect(explicit.querySelector('button')).not.toBeNull();
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('overrideDefaultProps.Notification 的 top、left 作用于通知列表', () => {
        semiGlobal.config.overrideDefaultProps = { Notification: { top: '120px', left: '80px', position: 'topLeft' } };
        try {
            show('info', { title: 'offset', duration: 0 });
            expect(document.querySelector(`.${prefixCls}-list`)).toHaveStyle({ top: '120px', left: '80px' });
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('全局默认值里的 id 不生效，静态 API 的每条通知 id 各不相同', () => {
        // a caller without type checking can still put an instance id into the global config
        semiGlobal.config.overrideDefaultProps = { Notification: { id: 'shared', duration: 0 } as object };
        try {
            let first = '';
            let second = '';
            act(() => {
                first = Notification.info({ title: 'a' });
                second = Notification.info({ title: 'b' });
            });
            expect(first).not.toBe('shared');
            expect(first).not.toBe(second);
            expect(document.getElementById('shared')).toBeNull();
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('StrictMode 下 Notice 只关闭一次', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        render(
            <StrictMode>
                <NotificationItem title="strict" duration={1} onClose={onClose} />
            </StrictMode>
        );
        void act(() => vi.advanceTimersByTime(5000));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    describe('useNotification', () => {
        function HookDemo({ config }) {
            const [notification, contextHolder] = Notification.useNotification();
            return (
                <>
                    <div data-testid="holder">{contextHolder}</div>
                    <button onClick={() => notification.info(config)}>add</button>
                </>
            );
        }

        it('在放置 contextHolder 的位置渲染通知', () => {
            render(<HookDemo config={{ title: 'hooked', duration: 0, position: 'bottom' }} />);
            fireEvent.click(screen.getByRole('button', { name: 'add' }));
            fireEvent.click(screen.getByRole('button', { name: 'add' }));
            const list = screen.getByTestId('holder').querySelector(`.${prefixCls}-list[x-placement=bottom]`);
            expect(list.querySelectorAll(`[role=status].${noticeCls}-info`)).toHaveLength(2);
            expect(document.querySelector(`.${prefixCls}-wrapper`)).toBeNull();
        });

        it('到达 duration 后关闭并只调用一次 onClose，StrictMode 下同样如此', () => {
            vi.useFakeTimers();
            const onClose = vi.fn<() => void>();
            render(
                <StrictMode>
                    <HookDemo config={{ title: 'hooked', duration: 1, onClose }} />
                </StrictMode>
            );
            fireEvent.click(screen.getByRole('button', { name: 'add' }));
            expect(screen.getByRole('status')).toHaveClass(`${noticeCls}-animation-show_topRight`);
            void act(() => vi.advanceTimersByTime(1000));
            expect(onClose).toHaveBeenCalledTimes(1);
            const leaving = screen.getByRole('status');
            expect(leaving).toHaveClass(`${noticeCls}-animation-hide_topRight`);
            endAnimation(leaving);
            // the live region may still hold the announcement
            expect(screen.queryByRole('status')).toBeNull();
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('通知以位置动画进入', () => {
            render(<HookDemo config={{ title: 'hooked', duration: 0, position: 'bottom' }} />);
            fireEvent.click(screen.getByRole('button', { name: 'add' }));
            expect(screen.getByRole('status')).toHaveClass(`${noticeCls}-animation-show_bottom`);
        });

        it('多个 hook 的通知各自留在自己的 holder 中', () => {
            render(
                <>
                    <HookDemo config={{ title: 'first', duration: 0 }} />
                    <HookCaller />
                </>
            );
            fireEvent.click(screen.getByRole('button', { name: 'add' }));
            fireEvent.click(screen.getByRole('button', { name: 'hook add' }));
            expect(screen.getByTestId('holder')).toHaveTextContent('first');
            expect(screen.getByTestId('holder')).not.toHaveTextContent('from hook');
            expect(screen.getAllByRole('status')).toHaveLength(2);
        });

        it('之后渲染中调用 close(id) 仍能关闭通知', () => {
            let noticeId: string;
            function CloseDemo() {
                const [notification, contextHolder] = Notification.useNotification();
                return (
                    <>
                        <div data-testid="holder">{contextHolder}</div>
                        <button
                            onClick={() => {
                                noticeId = notification.info({ title: 'hooked', duration: 0 });
                            }}
                        >
                            add
                        </button>
                        <button onClick={() => notification.close(noticeId)}>dismiss</button>
                    </>
                );
            }
            render(
                <StrictMode>
                    <CloseDemo />
                </StrictMode>
            );
            fireEvent.click(screen.getByRole('button', { name: 'add' }));
            expect(screen.getByTestId('holder')).toHaveTextContent('hooked');
            // adding re-rendered the component, so this is a newer api object than the one that added
            fireEvent.click(screen.getByRole('button', { name: 'dismiss' }));
            const leaving = screen.getByRole('status');
            expect(leaving).toHaveClass(`${noticeCls}-animation-hide_topRight`);
            endAnimation(leaving);
            expect(screen.getByTestId('holder')).not.toHaveTextContent('hooked');
        });

        it('overrideDefaultProps.Notification 的 duration、position 优先于内置默认值', () => {
            vi.useFakeTimers();
            semiGlobal.config.overrideDefaultProps = { Notification: { duration: 10, position: 'bottomLeft' } };
            try {
                render(<HookDemo config={{ title: 'hooked' }} />);
                fireEvent.click(screen.getByRole('button', { name: 'add' }));
                const holder = screen.getByTestId('holder');
                expect(holder.querySelector(`.${prefixCls}-list[x-placement=bottomLeft]`)).not.toBeNull();
                void act(() => vi.advanceTimersByTime(9000));
                expect(holder).toHaveTextContent('hooked');
                void act(() => vi.advanceTimersByTime(1000));
                expect(holder.querySelector('[role=status]')).toHaveClass(`${noticeCls}-animation-hide_bottomLeft`);
            } finally {
                semiGlobal.config.overrideDefaultProps = {};
            }
        });

        it('读取 semiGlobal overrideDefaultProps.Notification 中的默认值，且只渲染一份', () => {
            semiGlobal.config.overrideDefaultProps = { Notification: { showClose: false, theme: 'light' } };
            try {
                render(<HookDemo config={{ title: 'hooked', duration: 0 }} />);
                fireEvent.click(screen.getByRole('button', { name: 'add' }));
                const notice = screen.getByRole('status');
                expect(notice).toHaveClass(`${noticeCls}-light`);
                expect(notice.querySelector('button')).toBeNull();
            } finally {
                semiGlobal.config.overrideDefaultProps = {};
            }
        });
    });

    it('data-* 属性落在通知根节点上', () => {
        show('info', { title: 'static', duration: 0, 'data-testid': 'static-notice' });
        expect(screen.getByTestId('static-notice')).toHaveAttribute('role', 'status');
        render(<NotificationItem data-testid="direct-notice" title="direct" />);
        expect(screen.getByTestId('direct-notice')).toHaveAttribute('role', 'status');
        expect(screen.getByTestId('static-notice')).not.toHaveAttribute('id');
        expect(screen.getByTestId('static-notice')).not.toHaveAttribute('position');
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
        const hideCls = `${noticeCls}-animation-hide_topRight`;
        const close = screen.getByRole('button', { name: zh_CN.Notification.close });
        act(() => {
            close.focus();
            vi.advanceTimersByTime(2000);
        });
        expect(screen.getByRole('status')).not.toHaveClass(hideCls);
        act(() => close.blur());
        void act(() => vi.advanceTimersByTime(999));
        expect(screen.getByRole('status')).not.toHaveClass(hideCls);
        void act(() => vi.advanceTimersByTime(1));
        expect(screen.getByRole('status')).toHaveClass(hideCls);
    });

    it('焦点进入收起的堆叠时展开', () => {
        show('info', { title: 'first', duration: 0, stack: 1 });
        show('info', { title: 'second', duration: 0, stack: 1 });
        const items = () => [...document.querySelectorAll(`.${noticeCls}-stack-item`)];
        expect(items().some((item) => item.classList.contains(`${noticeCls}-stack-item-expanded`))).toBe(false);
        const [newest, behind] = screen.getAllByRole('button', { name: zh_CN.Notification.close });
        expect(behind).toBeDefined();
        act(() => behind.focus());
        expect(items().every((item) => item.classList.contains(`${noticeCls}-stack-item-expanded`))).toBe(true);
        act(() => newest.focus());
        act(() => newest.blur());
        expect(items().some((item) => item.classList.contains(`${noticeCls}-stack-item-expanded`))).toBe(false);
    });

    it('后一条通知切换 stack 时，已显示的通知不重新计时', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        show('info', { id: 'a', title: 'A', duration: 3, onClose });
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        show('info', { id: 'b', title: 'B', duration: 0, stack: true });
        act(() => {
            vi.advanceTimersByTime(1100);
        });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('后一条通知切换 stack 时，已显示通知的节点与焦点保持不变', () => {
        show('info', { id: 'a', title: 'A', duration: 0 });
        const first = screen.getByRole('status');
        const closeButton = screen.getByRole('button', { name: zh_CN.Notification.close });
        act(() => closeButton.focus());
        show('info', { id: 'b', title: 'B', duration: 0, stack: true });
        expect(first.isConnected).toBe(true);
        expect(document.activeElement).toBe(closeButton);
    });

    it('聚焦的通知被移除后，其余通知不再永久暂停', () => {
        vi.useFakeTimers();
        show('info', { id: 'gone', title: 'gone', duration: 0 });
        show('info', { id: 'stays', title: 'stays', duration: 1 });
        const hideCls = `${noticeCls}-animation-hide_topRight`;
        const [, goneClose] = screen.getAllByRole('button', { name: zh_CN.Notification.close });
        act(() => goneClose.focus());
        act(() => {
            Notification.close('gone');
        });
        const gone = screen.getAllByRole('status').find((notice) => notice.textContent === 'gone');
        endAnimation(gone);
        void act(() => vi.advanceTimersByTime(1000));
        expect(screen.getByRole('status')).toHaveClass(hideCls);
    });

    it('useNotification 在重渲染之间返回同一个 api 与 contextHolder，memo 子组件可据此跳过渲染', () => {
        const results: ReturnType<typeof Notification.useNotification>[] = [];
        function Host({ tick }: { tick: number }) {
            const result = Notification.useNotification();
            results.push(result);
            return <div data-tick={tick}>{result[1]}</div>;
        }
        const { rerender } = render(<Host tick={0} />);
        rerender(<Host tick={1} />);
        expect(results.length).toBeGreaterThanOrEqual(2);
        expect(results.at(-1)[0]).toBe(results[0][0]);
        expect(results.at(-1)[1]).toBe(results[0][1]);
    });
    it('useNotification 的 contextHolder 位于 keep-interactive 容器内', () => {
        render(<HookCaller />);
        fireEvent.click(screen.getByRole('button', { name: 'hook add' }));
        expect(document.querySelector(`.${prefixCls}-list`).closest(`[${KEEP_INTERACTIVE_ATTRIBUTE}]`)).not.toBeNull();
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

    it('静态方法与 hook 的选项类型不含由列表提供的键，接受 data-* 与 aria-* 属性', () => {
        type StaticOptions = Parameters<typeof Notification.info>[0];
        for (const key of ['close', 'ref', 'onAnimationEnd', 'onAnimationStart'] as const) {
            expectTypeOf<StaticOptions>().not.toHaveProperty(key);
            expectTypeOf<NotificationHookOptions>().not.toHaveProperty(key);
        }
        for (const key of ['id', 'type', 'zIndex', 'getPopupContainer'] as const) {
            expectTypeOf<NotificationHookOptions>().not.toHaveProperty(key);
        }
        expectTypeOf<NotificationHookOptions>().toHaveProperty('position');
        expectTypeOf<Parameters<NotificationHookApi['info']>>().toEqualTypeOf<[NotificationHookOptions]>();
        expectTypeOf({ title: 'a', 'data-testid': 'x', 'aria-describedby': 'y' }).toExtend<StaticOptions>();
        expectTypeOf({ title: 'a', 'data-testid': 'x' }).toExtend<NotificationHookOptions>();
        // @ts-expect-error close is supplied by the list
        const withClose: StaticOptions = { title: 'a', close: () => {} };
        expect(withClose).toBeDefined();
    });

    it('NoticeState 是空接口，没有字段', () => {
        expectTypeOf<keyof NoticeState>().toBeNever();
    });
});
