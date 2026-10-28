import { createContext, createRef, useEffect, useImperativeHandle } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Button, Notification } from '@fibrae/semi-ui-react';

const prefix = `${BASE_CLASS_PREFIX}-notification`;
const TitleContext = createContext<{ title?: string }>({});

describe('Notification', () => {
    it('useNotification', async () => {
        function Demo() {
            const [notice, elements] = Notification.useNotification();
            const config = {
                content: 'Hello World',
                position: 'top' as const,
                title: <TitleContext.Consumer>{({ title }) => <strong>{title}</strong>}</TitleContext.Consumer>,
                duration: 0,
            };
            const addNotice = () => {
                notice.info(config);
                notice.success(config);
                notice.warning(config);
                notice.error(config);
                notice.open(config);
            };
            return (
                <div>
                    <div data-testid="notice-container">
                        <TitleContext.Provider value={{ title: '2222' }}>{elements}</TitleContext.Provider>
                    </div>
                    <Button onClick={addNotice}>Add Notice</Button>
                </div>
            );
        }
        render(<Demo />);

        await userEvent.click(screen.getByRole('button', { name: 'Add Notice' }));
        const notices = screen.getByTestId('notice-container').querySelectorAll(`.${BASE_CLASS_PREFIX}-notification-notice`);
        expect(notices).toHaveLength(5);
        // The hook renders notices where its elements are placed, so they read that context
        notices.forEach((item) => expect(item).toMatchTextContent('2222'));
    });

    describe('列表中的其他通知随进场、离场动画移动，不跳位', () => {
        type Api = ReturnType<typeof Notification.useNotification>[0];
        const api = createRef<Api>();
        function Demo() {
            const [notice, elements] = Notification.useNotification();
            useImperativeHandle(api, () => notice, [notice]);
            return <div data-testid="notice-container">{elements}</div>;
        }
        const add = (title: string, duration = 0, options: Parameters<Api['info']>[0] = {}) =>
            act(async () => {
                api.current.info({ title, content: title, duration, ...options });
            });
        const notices = () => [...screen.getByTestId('notice-container').querySelectorAll<HTMLElement>(`.${prefix}-notice`)];
        const top = (el: HTMLElement) => el.getBoundingClientRect().top;
        const open = async (...titles: string[]) => {
            for (const title of titles) {
                await add(title);
            }
            await waitFor(() => expect(notices().length).toBeGreaterThanOrEqual(titles.length));
            notices().forEach((n) => n.getAnimations().forEach((a) => a.finish()));
        };
        // seek the paused animations instead of sleeping, so frame timing cannot skew the samples
        const pausedAnimations = (el: HTMLElement, name: string) =>
            waitFor(() => {
                const animations = el.getAnimations();
                expect(animations.some((a) => (a as CSSAnimation).animationName.includes(name))).toBe(true);
                animations.forEach((a) => a.pause());
                return (time: number) => animations.forEach((a) => (a.currentTime = time));
            });

        it('插入时，原有的通知随新通知展开下移', async () => {
            render(<Demo />);
            await open('a', 'b');
            const before = notices().map(top);
            await add('c');
            await waitFor(() => expect(notices()).toHaveLength(3));
            const [added, ...rest] = notices();
            const seek = await pausedAnimations(added, 'slideShow');
            seek(0);
            rest.forEach((n, i) => expect(top(n)).toBeCloseTo(before[i], 0));
            seek(60);
            expect(top(rest[0])).toBeGreaterThan(before[0] + 10);
            seek(300);
            const settled = rest.map(top);
            added.getAnimations().forEach((a) => a.finish());
            await waitFor(() => expect(added.getAnimations()).toHaveLength(0));
            rest.forEach((n, i) => expect(top(n)).toBeCloseTo(settled[i], 0));
        });

        it.each([
            ['中间', 1],
            ['第一条', 0],
        ])('关闭%s时，下方的通知随离场收起上移', async (_, index) => {
            render(<Demo />);
            await open('a', 'b', 'c');
            const list = notices();
            const leaving = list[index];
            const next = list[index + 1];
            const leavingTop = top(leaving);
            const nextTop = top(next);
            await userEvent.click(leaving.querySelector(`.${prefix}-notice-icon-close`));
            const seek = await pausedAnimations(leaving, 'slideHide');
            seek(60);
            expect(top(next)).toBeLessThan(nextTop - 10);
            seek(299);
            expect(top(next)).toBeCloseTo(leavingTop, 0);
            leaving.getAnimations().forEach((a) => a.play());
            await waitFor(() => expect(leaving.isConnected).toBe(false));
            expect(top(next)).toBeCloseTo(leavingTop, 0);
        });

        it('不支持 interpolate-size 时，进出场期间把自然高度写成内联长度，进场结束后移除', async () => {
            vi.spyOn(CSS, 'supports').mockReturnValue(false);
            render(<Demo />);
            await add('a');
            const [notice] = await waitFor(() => {
                const list = notices();
                expect(list).toHaveLength(1);
                expect(list[0].style.height).toMatch(/^[1-9]\d*(\.\d+)?px$/);
                return list;
            });
            const natural = notice.style.height;
            notice.getAnimations().forEach((a) => a.finish());
            await waitFor(() => expect(notice.style.height).toBe(''));
            await userEvent.click(notice.querySelector(`.${prefix}-notice-icon-close`));
            await pausedAnimations(notice, 'slideHide');
            expect(notice.style.height).toBe(natural);
        });

        it('首条通知与视口顶部、通知之间都保持一份间距', async () => {
            render(<Demo />);
            await open('a', 'b');
            const [first, second] = notices();
            const margin = parseFloat(getComputedStyle(first).marginBlockEnd);
            expect(margin).toBeGreaterThan(0);
            expect(top(first)).toBeCloseTo(margin, 0);
            expect(top(second)).toBeCloseTo(first.getBoundingClientRect().bottom + margin, 0);
        });

        it('指针在列表上时暂停其中所有通知的计时，期间新来的通知同样暂停', async () => {
            render(<Demo />);
            // 1s leaves room for the Playwright hover round trip before the first timers would fire
            await add('a', 1);
            await add('b', 1);
            await waitFor(() => expect(notices()).toHaveLength(2));
            notices().forEach((n) => n.getAnimations().forEach((a) => a.finish()));
            await userEvent.hover(notices()[0]);
            await add('c', 1);
            // asserting that nothing closes needs a fixed wait longer than the duration
            await new Promise((resolve) => setTimeout(resolve, 1500));
            expect(notices()).toHaveLength(3);
            await userEvent.unhover(notices()[0]);
            await waitFor(() => expect(notices()).toHaveLength(0), { timeout: 3000 });
        });

        it('stack: true 时三条平铺，第四条起堆叠，三层之后的隐藏，悬停展开', async () => {
            render(<Demo />);
            for (const title of ['a', 'b', 'c']) {
                await add(title, 0, { stack: true });
            }
            await waitFor(() => expect(notices()).toHaveLength(3));
            notices().forEach((n) => n.getAnimations().forEach((a) => a.finish()));
            const items = () => notices().map((n) => n.parentElement);
            await waitFor(() => expect(items().every((item) => item.offsetHeight > 0)).toBe(true));

            await add('d', 0, { stack: true });
            await waitFor(() => expect(items().map((item) => item.offsetHeight)).toEqual([0, 0, 0, 0]));
            const [front, ...behind] = notices();
            front.getAnimations().forEach((a) => a.finish());
            behind.slice(0, 2).forEach((n, i) => expect(top(n)).toBeCloseTo(top(front) + (i + 1) * 8, 0));
            await waitFor(() => expect(getComputedStyle(behind[2]).visibility).toBe('hidden'));

            await userEvent.hover(front);
            await waitFor(() => expect(items().every((item) => item.offsetHeight > 0)).toBe(true));
            expect(getComputedStyle(behind[2]).visibility).toBe('visible');
            await userEvent.unhover(front);
            await waitFor(() => expect(items().map((item) => item.offsetHeight)).toEqual([0, 0, 0, 0]));
        });

        it('展开的堆叠中，指针停在两条通知之间的间距上时保持展开', async () => {
            render(<Demo />);
            for (const title of ['a', 'b', 'c']) {
                await add(title, 0, { stack: 1 });
            }
            await waitFor(() => expect(notices()).toHaveLength(3));
            notices().forEach((n) => n.getAnimations().forEach((a) => a.finish()));
            const items = () => notices().map((n) => n.parentElement);
            const [front] = notices();
            await userEvent.hover(front);
            await waitFor(() => expect(items().every((item) => item.offsetHeight > 0)).toBe(true));
            items().forEach((item) => item.getAnimations().forEach((a) => a.finish()));
            // the end margin below the front notice; collapsing would put a peeking layer under the pointer again
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
            render(<Demo />);
            for (const title of ['a', 'b']) {
                await add(title, 0, { stack: 1, position: 'bottomRight' });
            }
            await waitFor(() => expect(notices()).toHaveLength(2));
            notices().forEach((n) => n.getAnimations().forEach((a) => a.finish()));
            const [front, behind] = notices();
            await waitFor(() => expect(behind.parentElement.offsetHeight).toBe(0));
            await waitFor(() => expect(behind.getBoundingClientRect().bottom).toBeCloseTo(front.getBoundingClientRect().bottom - 8, 0));
            expect(front.getBoundingClientRect().bottom).toBeLessThan(window.innerHeight);
        });
    });

    it('ShadowRoot 内焦点停在列表里时，列表更新后仍暂停计时', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const captured: { api?: ReturnType<typeof Notification.useNotification>[0] } = {};
        function Demo() {
            const [api, contextHolder] = Notification.useNotification();
            useEffect(() => {
                captured.api = api;
            }, [api]);
            return contextHolder;
        }
        const view = render(<Demo />, { container: mount });
        try {
            const notification = captured.api;
            notification.info({ title: 'first', duration: 1 });
            const notices = () => shadow.querySelectorAll<HTMLElement>(`.${prefix}-notice`);
            await waitFor(() => expect(notices()).toHaveLength(1));
            notices()[0]
                .getAnimations({ subtree: true })
                .forEach((a) => a.finish());
            notices()[0].querySelector<HTMLElement>('button').focus();
            notification.info({ title: 'second', duration: 0 });
            await waitFor(() => expect(notices()).toHaveLength(2));
            // asserting that nothing closes needs a fixed wait longer than the duration
            await new Promise((resolve) => setTimeout(resolve, 1500));
            expect(notices()).toHaveLength(2);
        } finally {
            view.unmount();
            host.remove();
        }
    });
});
