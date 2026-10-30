/** @jsxImportSource vue */
import { inject } from 'vue';
import { waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, it, onTestFinished } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { openLayer } from '@fibrae/semi-foundation/utils/layer';
import { tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Notification from '../index';
import type { NotificationHookApi, NotificationHookOptions } from '../interface';
import HookHost from './fixtures/hook-host.vue';
import { reachableKey } from './fixtures/reachable';

const prefix = 'semi-notification';
const noticeCls = `${prefix}-notice`;
const closeButton = (notice: Element) => notice.querySelector(`.${noticeCls}-icon-close`) as HTMLButtonElement;
const top = (el: HTMLElement) => el.getBoundingClientRect().top;
// The list animates each notice's root wrapper, which is also its stack item.
const wrapperOf = (notice: HTMLElement) => notice.parentElement as HTMLElement;
// Vue drops the enter and leave classes on animationend, or on a timeout when the animations finished before it started
// listening; until then a finished slide still holds the wrapper's height
async function finishAnimations(notices: HTMLElement[]) {
    notices.forEach((notice) =>
        wrapperOf(notice)
            .getAnimations({ subtree: true })
            .forEach((a) => a.finish())
    );
    await waitFor(() => expect(notices.filter((notice) => /-animation-(show|hide)_/.test(wrapperOf(notice).className))).toEqual([]));
}

function renderHook(reachable?: string) {
    let api!: NotificationHookApi;
    const view = render(HookHost, {
        props: { reachable, onApi: (notification: NotificationHookApi) => (api = notification) },
    });
    const holder = view.container.querySelector('[data-testid="holder"]') as HTMLElement;
    const notices = () => [...holder.querySelectorAll<HTMLElement>(`.${noticeCls}`)];
    const add = (title: string, duration = 0, options: NotificationHookOptions = {}) => api.info({ title, content: title, duration, ...options });
    return { api, add, notices };
}

describe('Notification 浏览器', () => {
    afterEach(() => Notification.destroyAll());

    it('useNotification 的通知读到 Holder 所在位置的 provide，按 id 与关闭按钮关闭', async () => {
        const { api, notices } = renderHook('Light');
        const config = {
            content: 'Hello World',
            position: 'top' as const,
            title: () => <strong>{String(inject(reachableKey))}</strong>,
            duration: 0,
        };
        api.info(config);
        api.success(config);
        api.warning(config);
        api.error(config);
        const id = api.open(config);
        await waitFor(() => expect(notices()).toHaveLength(5));
        notices().forEach((notice) => expect(notice.querySelector('strong')).toHaveTextContent('Light'));
        api.close(id);
        await waitFor(() => expect(notices()).toHaveLength(4));
        await userEvent.click(closeButton(notices()[0]));
        await waitFor(() => expect(notices()).toHaveLength(3));
    });

    describe('列表中的其他通知随进场、离场动画移动，不跳位', () => {
        const pausedAnimations = (el: HTMLElement, name: string) =>
            waitFor(() => {
                const animations = el.getAnimations();
                expect(animations.some((a) => (a as CSSAnimation).animationName.includes(name))).toBe(true);
                animations.forEach((a) => a.pause());
                return (time: number) => animations.forEach((a) => (a.currentTime = time));
            });
        const open = async (host: ReturnType<typeof renderHook>, ...titles: string[]) => {
            for (const title of titles) host.add(title);
            await waitFor(() => expect(host.notices().length).toBeGreaterThanOrEqual(titles.length));
            await finishAnimations(host.notices());
        };

        it('插入时，原有的通知随新通知展开下移', async () => {
            const host = renderHook();
            await open(host, 'a', 'b');
            const before = host.notices().map(top);
            host.add('c');
            await waitFor(() => expect(host.notices()).toHaveLength(3));
            const [added, ...rest] = host.notices();
            const seek = await pausedAnimations(wrapperOf(added), 'slideShow');
            seek(0);
            rest.forEach((n, i) => expect(top(n)).toBeCloseTo(before[i], 0));
            seek(60);
            expect(top(rest[0])).toBeGreaterThan(before[0] + 10);
            seek(300);
            const settled = rest.map(top);
            wrapperOf(added)
                .getAnimations()
                .forEach((a) => a.finish());
            await waitFor(() => expect(wrapperOf(added).getAnimations()).toHaveLength(0));
            rest.forEach((n, i) => expect(top(n)).toBeCloseTo(settled[i], 0));
        });

        it.each([
            ['中间', 1],
            ['第一条', 0],
        ])('关闭%s时，下方的通知随离场收起上移', async (_, index) => {
            const host = renderHook();
            await open(host, 'a', 'b', 'c');
            const list = host.notices();
            const leaving = list[index];
            const next = list[index + 1];
            const leavingTop = top(leaving);
            const nextTop = top(next);
            await userEvent.click(closeButton(leaving));
            const seek = await pausedAnimations(wrapperOf(leaving), 'slideHide');
            seek(60);
            expect(top(next)).toBeLessThan(nextTop - 10);
            seek(299);
            expect(top(next)).toBeCloseTo(leavingTop, 0);
            wrapperOf(leaving)
                .getAnimations()
                .forEach((a) => a.play());
            await waitFor(() => expect(leaving.isConnected).toBe(false));
            expect(top(next)).toBeCloseTo(leavingTop, 0);
        });

        it('首条通知与视口顶部、通知之间都保持一份间距', async () => {
            const host = renderHook();
            await open(host, 'a', 'b');
            const [first, second] = host.notices();
            const margin = parseFloat(getComputedStyle(first).marginBlockEnd);
            expect(margin).toBeGreaterThan(0);
            expect(top(first)).toBeCloseTo(margin, 0);
            expect(top(second)).toBeCloseTo(first.getBoundingClientRect().bottom + margin, 0);
        });

        it('指针在列表上时暂停其中所有通知的计时，期间新来的通知同样暂停', async () => {
            const host = renderHook();
            // 1s leaves room for the Playwright hover round trip before the first timers would fire
            host.add('a', 1);
            host.add('b', 1);
            await waitFor(() => expect(host.notices()).toHaveLength(2));
            await finishAnimations(host.notices());
            await userEvent.hover(host.notices()[0]);
            host.add('c', 1);
            // asserting that nothing closes needs a fixed wait longer than the duration
            await new Promise((resolve) => setTimeout(resolve, 1500));
            expect(host.notices()).toHaveLength(3);
            await userEvent.unhover(host.notices()[0]);
            await waitFor(() => expect(host.notices()).toHaveLength(0), { timeout: 3000 });
        });

        it('stack: true 时三条平铺，第四条起堆叠，三层之后的隐藏，悬停展开', async () => {
            const host = renderHook();
            for (const title of ['a', 'b', 'c']) host.add(title, 0, { stack: true });
            await waitFor(() => expect(host.notices()).toHaveLength(3));
            await finishAnimations(host.notices());
            const items = () => host.notices().map(wrapperOf);
            await waitFor(() => expect(items().every((item) => item.offsetHeight > 0)).toBe(true));

            host.add('d', 0, { stack: true });
            await waitFor(() => expect(host.notices()).toHaveLength(4));
            // the entering notice's zero-height item must not clip it
            expect(items()[0]).toHaveClass(`${noticeCls}-animation-show_topRight`);
            expect(getComputedStyle(items()[0]).overflow).toBe('visible');
            await waitFor(() => expect(items().map((item) => item.offsetHeight)).toEqual([0, 0, 0, 0]));
            const [front, ...behind] = host.notices();
            wrapperOf(front)
                .getAnimations()
                .forEach((a) => a.finish());
            behind.slice(0, 2).forEach((n, i) => expect(top(n)).toBeCloseTo(top(front) + (i + 1) * 8, 0));
            await waitFor(() => expect(getComputedStyle(behind[2]).visibility).toBe('hidden'));

            await userEvent.hover(front);
            await waitFor(() => expect(items().every((item) => item.offsetHeight > 0)).toBe(true));
            expect(getComputedStyle(behind[2]).visibility).toBe('visible');
            await userEvent.unhover(front);
            await waitFor(() => expect(items().map((item) => item.offsetHeight)).toEqual([0, 0, 0, 0]));
        });

        it('展开的堆叠中，指针停在两条通知之间的间距上时保持展开', async () => {
            const host = renderHook();
            for (const title of ['a', 'b', 'c']) host.add(title, 0, { stack: 1 });
            await waitFor(() => expect(host.notices()).toHaveLength(3));
            await finishAnimations(host.notices());
            const items = () => host.notices().map(wrapperOf);
            const [front] = host.notices();
            await userEvent.hover(front);
            await waitFor(() => expect(items().every((item) => item.offsetHeight > 0)).toBe(true));
            await finishAnimations(host.notices());
            const gap = front.getBoundingClientRect().bottom + 5;
            const [frontItem] = items();
            let toggles = 0;
            const observer = new MutationObserver(() => toggles++);
            observer.observe(frontItem, { attributeFilter: ['class'] });
            await userEvent.hover(frontItem, {
                position: { x: frontItem.offsetWidth / 2, y: gap - frontItem.getBoundingClientRect().top },
                force: true,
            });
            await new Promise((resolve) => setTimeout(resolve, 1000));
            observer.disconnect();
            expect(toggles).toBe(0);
            expect(items().every((item) => item.offsetHeight > 0)).toBe(true);
        });

        it('底部堆叠时，通知从列表底边向上叠放，不超出视口', async () => {
            const host = renderHook();
            for (const title of ['a', 'b']) host.add(title, 0, { stack: 1, position: 'bottomRight' });
            await waitFor(() => expect(host.notices()).toHaveLength(2));
            await finishAnimations(host.notices());
            const [front, behind] = host.notices();
            await waitFor(() => expect(wrapperOf(behind).offsetHeight).toBe(0));
            await waitFor(() => expect(behind.getBoundingClientRect().bottom).toBeCloseTo(front.getBoundingClientRect().bottom - 8, 0));
            expect(front.getBoundingClientRect().bottom).toBeLessThan(window.innerHeight);
        });
    });

    it('键盘焦点在关闭按钮上时不到点关闭，Enter 关闭后通知正常移除', async () => {
        const { add, notices } = renderHook();
        // long enough for the first Tab to land before the countdown would end under load
        add('keyboard', 0.5);
        await waitFor(() => expect(notices()).toHaveLength(1));
        await tabTo(closeButton(notices()[0]));
        // asserting that nothing closes needs a fixed wait: 1200ms is more than twice the 500ms duration
        await new Promise((resolve) => setTimeout(resolve, 1200));
        expect(notices()).toHaveLength(1);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(notices()).toHaveLength(0));
    });

    it('Tab 到折叠堆叠后层的关闭按钮时堆叠已展开，按钮未被前层遮住', async () => {
        const { add, notices } = renderHook();
        for (const title of ['1', '2', '3', '4']) add(title, 0, { stack: true });
        await waitFor(() => expect(notices()).toHaveLength(4));
        const behind = closeButton(notices()[1]);
        await tabTo(behind);
        const items = () => notices().map(wrapperOf);
        await waitFor(() => expect(items().every((item) => item.classList.contains(`${noticeCls}-stack-item-expanded`))).toBe(true));
        await finishAnimations(notices());
        const rect = behind.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        expect(behind.contains(hit)).toBe(true);
    });

    it('模态层打开时，静态通知与 hook 通知仍可点击关闭按钮，不 inert', async () => {
        const { add, notices } = renderHook();
        add('hook', 0);
        Notification.info({ title: 'static', duration: 0, position: 'bottomLeft' });
        await waitFor(() => expect(notices()).toHaveLength(1));
        await waitFor(() => expect(document.querySelectorAll(`.${noticeCls}`)).toHaveLength(2));
        // The layer opens after both hosts are mounted: inert is only recomputed on stack changes.
        const modal = document.createElement('div');
        const bystander = document.createElement('div');
        document.body.append(modal, bystander);
        const closeLayer = openLayer({ element: modal, modal: true });
        onTestFinished(() => {
            closeLayer();
            modal.remove();
            bystander.remove();
        });
        expect(bystander.inert).toBe(true);
        for (const notice of document.querySelectorAll<HTMLElement>(`.${noticeCls}`)) {
            expect(notice.closest('[inert]')).toBeNull();
        }
        await userEvent.click(closeButton(notices()[0]));
        await waitFor(() => expect(notices()).toHaveLength(0));
        await userEvent.click(closeButton(document.querySelector(`.${noticeCls}`) as HTMLElement));
        await waitFor(() => expect(document.querySelectorAll(`.${noticeCls}`)).toHaveLength(0));
    });

    it('hook 的通知层叠高于 z-index 小于 1010 的兄弟', async () => {
        const sibling = document.createElement('div');
        sibling.style.cssText = 'position:fixed;inset:0;z-index:1000;background:white';
        document.body.appendChild(sibling);
        onTestFinished(() => sibling.remove());
        const { add, notices } = renderHook();
        add('above', 0);
        await waitFor(() => expect(notices()).toHaveLength(1));
        await finishAnimations(notices());
        const rect = notices()[0].getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        expect(notices()[0].contains(hit)).toBe(true);
    });

    it('离场途中以同一 id 再次打开，通知保持显示', async () => {
        const id = Notification.info({ id: 'again', title: 'v1', duration: 0 });
        await waitFor(() => expect(document.querySelectorAll(`.${noticeCls}`)).toHaveLength(1));
        Notification.close(id);
        Notification.info({ id, title: 'v2', duration: 0 });
        await waitFor(() => expect(document.querySelector(`.${noticeCls}`)).toHaveTextContent('v2'));
        await finishAnimations([...document.querySelectorAll<HTMLElement>(`.${noticeCls}`)]);
        expect(document.querySelectorAll(`.${noticeCls}`)).toHaveLength(1);
    });

    it('ShadowRoot 内焦点停在列表里时，其他通知离场后仍暂停计时', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        let api!: NotificationHookApi;
        const view = render(HookHost, { container: mount, props: { onApi: (notification: NotificationHookApi) => (api = notification) } });
        try {
            const notices = () => [...shadow.querySelectorAll<HTMLElement>(`.${noticeCls}`)];
            const leaving = api.open({ title: 'leaving', content: 'leaving', duration: 0 });
            api.open({ title: 'first', content: 'first', duration: 1 });
            await waitFor(() => expect(notices()).toHaveLength(2));
            await finishAnimations(notices());
            closeButton(notices().find((notice) => notice.textContent?.includes('first')) as HTMLElement).focus();
            api.close(leaving);
            await waitFor(() => expect(notices()).toHaveLength(1));
            // asserting that nothing closes needs a fixed wait longer than the duration
            await new Promise((resolve) => setTimeout(resolve, 1500));
            expect(notices()).toHaveLength(1);
        } finally {
            view.unmount();
            host.remove();
        }
    });
});
