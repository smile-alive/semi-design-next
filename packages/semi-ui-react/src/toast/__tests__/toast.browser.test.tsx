import { createContext, useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Button, Toast, ToastFactory } from '@fibrae/semi-ui-react';

const prefix = `${BASE_CLASS_PREFIX}-toast`;
const ReachableContext = createContext<string>(undefined);

describe('Toast', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('useToast', async () => {
        function Demo() {
            const [toast, contextHolder] = Toast.useToast();
            const config = {
                duration: 0,
                content: <ReachableContext.Consumer>{(name) => `ReachableContext: ${name}`}</ReachableContext.Consumer>,
            };
            return (
                <ReachableContext.Provider value="Light">
                    <Button
                        onClick={() => {
                            toast.success(config);
                            toast.info(config);
                            toast.error(config);
                            toast.warning(config);
                            const id = toast.open(config);
                            setTimeout(() => toast.close(id), 100);
                        }}
                    >
                        Hook Toast
                    </Button>
                    <div data-testid="context-holder">{contextHolder}</div>
                </ReachableContext.Provider>
            );
        }
        render(<Demo />);
        const toasts = () => screen.getByTestId('context-holder').querySelectorAll(`.${prefix}`);

        // The demo closes the fifth toast 100ms after opening it; fake timers keep the click from racing that close
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        await userEvent.click(screen.getByRole('button', { name: 'Hook Toast' }));
        // The hook renders toasts inside the caller's tree, so they read the caller's context
        expect(toasts()[0]).toHaveTextContent('ReachableContext: Light');
        expect(toasts()).toHaveLength(5);
        vi.advanceTimersByTime(99);
        expect(toasts()).toHaveLength(5);
        vi.advanceTimersByTime(1);
        vi.useRealTimers();
        await waitFor(() => expect(toasts()).toHaveLength(4));

        await userEvent.click(toasts()[0].querySelector(`.${prefix}-close-button .${BASE_CLASS_PREFIX}-button`));
        await waitFor(() => expect(toasts()).toHaveLength(3));
    });

    it('moves the toasts below a leaving toast up while it leaves', async () => {
        function Demo() {
            const [toast, contextHolder] = Toast.useToast();
            return (
                <>
                    <Button
                        onClick={() => {
                            toast.info({ content: 'first', duration: 0 });
                            toast.info({ content: 'second', duration: 0 });
                        }}
                    >
                        Open
                    </Button>
                    <div data-testid="context-holder">{contextHolder}</div>
                </>
            );
        }
        render(<Demo />);
        await userEvent.click(screen.getByRole('button', { name: 'Open' }));
        const toasts = () => [...screen.getByTestId('context-holder').querySelectorAll<HTMLElement>(`.${prefix}`)];
        await waitFor(() => expect(toasts()).toHaveLength(2));
        await new Promise((resolve) => setTimeout(resolve, 400));
        const [first, second] = toasts();
        const firstTop = first.getBoundingClientRect().top;
        const secondTop = second.getBoundingClientRect().top;

        const content = first.querySelector(`.${prefix}-content`);
        const contentTop = content.getBoundingClientRect().top;

        await userEvent.click(first.querySelector(`.${prefix}-close-button .${BASE_CLASS_PREFIX}-button`));
        // seek the paused leave animation instead of sleeping, so frame timing cannot skew the samples
        const leave = await waitFor(() => {
            const animations = first.getAnimations({ subtree: true });
            expect(animations.some((a) => (a as CSSAnimation).animationName.includes('hide'))).toBe(true);
            return animations;
        });
        const seek = (time: number) => leave.forEach((a) => (a.currentTime = time));
        leave.forEach((a) => a.pause());
        seek(60);
        expect(second.getBoundingClientRect().top).toBeLessThan(secondTop - 10);
        expect(content.getBoundingClientRect().top).toBeLessThan(contentTop - 10);
        seek(299);
        expect(second.getBoundingClientRect().top).toBeCloseTo(firstTop, 0);
        leave.forEach((a) => a.play());
        await waitFor(() => expect(first.isConnected).toBe(false));
        expect(second.getBoundingClientRect().top).toBeCloseTo(firstTop, 0);
    });

    it('不支持 interpolate-size 时，离场期间把自然高度写成内联长度', async () => {
        vi.spyOn(CSS, 'supports').mockReturnValue(false);
        const toast = ToastFactory.create();
        onTestFinished(() => toast.destroyAll());
        toast.info({ content: 'first', duration: 0 });
        const item = await waitFor(() => {
            const el = document.querySelector<HTMLElement>(`.${prefix}-animation-show`);
            expect(el).not.toBeNull();
            return el;
        });
        const natural = `${item.offsetHeight}px`;
        // the enter keyframes leave the height alone, so nothing is pinned
        expect(item.style.height).toBe('');
        item.getAnimations({ subtree: true }).forEach((a) => a.finish());

        await userEvent.click(item.querySelector(`.${prefix}-close-button .${BASE_CLASS_PREFIX}-button`));
        await waitFor(() => expect(item.classList).toContain(`${prefix}-animation-hide`));
        await waitFor(() => expect(item.style.height).toBe(natural));
    });

    it('moves the toasts below a leaving toast up in an expanded stack', async () => {
        const toast = ToastFactory.create();
        onTestFinished(() => toast.destroyAll());
        toast.info({ content: 'first', duration: 0, stack: 1 });
        toast.info({ content: 'second', duration: 0, stack: 1 });
        const toasts = () => [...document.querySelectorAll<HTMLElement>(`.${prefix}-zero-height-wrapper > .${prefix}`)];
        await waitFor(() => expect(toasts()).toHaveLength(2));
        const [first, second] = toasts();
        // hovering the stack expands it, as it is when the pointer reaches a close button; collapsed, the toasts
        // overlap and the newest one is in front
        await userEvent.hover(second.querySelector(`.${prefix}-content`));
        const wrappers = toasts().map((t) => t.parentElement);
        await waitFor(() => expect(wrappers[0].getBoundingClientRect().height).toBeGreaterThan(0));
        for (const el of [...toasts(), ...wrappers]) el.getAnimations({ subtree: true }).forEach((a) => a.finish());
        const firstTop = first.getBoundingClientRect().top;

        await userEvent.click(first.querySelector(`.${prefix}-close-button .${BASE_CLASS_PREFIX}-button`));
        // the wrapper's height transition is what moves the stack; seek it paused at the end of the leave
        const transition = await waitFor(() => {
            const animation = wrappers[0].getAnimations()[0];
            expect(animation).toBeDefined();
            return animation;
        });
        transition.pause();
        transition.currentTime = 299;
        expect(second.getBoundingClientRect().top).toBeCloseTo(firstTop, 0);
        transition.play();
        await waitFor(() => expect(first.isConnected).toBe(false));
        expect(second.getBoundingClientRect().top).toBeCloseTo(firstTop, 0);
    });

    it('lays out up to three toasts flat with stack: true, stacks from the fourth and hides the layers behind three', async () => {
        const toast = ToastFactory.create();
        onTestFinished(() => toast.destroyAll());
        const toasts = () => [...document.querySelectorAll<HTMLElement>(`.${prefix}-zero-height-wrapper > .${prefix}`)];
        // the wrapper's height comes from a CSS class, not a measured inline style, so expanded state is checked
        // through the class instead of a pixel value
        const expandedCls = `${prefix}-zero-height-wrapper-expanded`;
        const expandedStates = () => toasts().map((t) => t.parentElement.classList.contains(expandedCls));
        const ids = ['1', '2', '3'].map((content) => toast.info({ content, duration: 0, stack: true }));
        await waitFor(() => expect(toasts()).toHaveLength(3));
        await waitFor(() => expect(expandedStates().every(Boolean)).toBe(true));

        toast.info({ content: '4', duration: 0, stack: true });
        await waitFor(() => expect(expandedStates()).toEqual([false, false, false, false]));
        const [oldest, ...front] = toasts();
        expect(oldest).toHaveClass(`${prefix}-stack-hidden`);
        await waitFor(() => expect(getComputedStyle(oldest).visibility).toBe('hidden'));
        front.forEach((t) => expect(t).not.toHaveClass(`${prefix}-stack-hidden`));

        toasts().forEach((t) => t.getAnimations({ subtree: true }).forEach((a) => a.finish()));
        await userEvent.hover(front[2].querySelector(`.${prefix}-content`));
        await waitFor(() => expect(expandedStates().every(Boolean)).toBe(true));
        expect(oldest).not.toHaveClass(`${prefix}-stack-hidden`);
        await userEvent.unhover(front[2].querySelector(`.${prefix}-content`));
        await waitFor(() => expect(oldest).toHaveClass(`${prefix}-stack-hidden`));

        toast.close(ids[0]);
        await waitFor(() => expect(toasts()).toHaveLength(3));
        await waitFor(() => expect(expandedStates().every(Boolean)).toBe(true));
    });

    it('drives the expanded stack wrapper height from a CSS class instead of a measured inline style', async () => {
        const toast = ToastFactory.create();
        onTestFinished(() => toast.destroyAll());
        toast.info({ content: 'only', duration: 0, stack: true });
        const wrapper = () => document.querySelector<HTMLElement>(`.${prefix}-zero-height-wrapper`);
        await waitFor(() => expect(wrapper()).not.toBeNull());
        await waitFor(() => expect(wrapper()).toHaveClass(`${prefix}-zero-height-wrapper-expanded`));
        // the old implementation wrote the measured pixel height into this attribute on every commit
        expect(wrapper().style.height).toBe('');
    });

    it('sizes an expanded stack wrapper to the toast including its own margin', async () => {
        const toast = ToastFactory.create();
        onTestFinished(() => toast.destroyAll());
        toast.info({ content: 'only', duration: 0, stack: true });
        const toastEl = () => document.querySelector<HTMLElement>(`.${prefix}-zero-height-wrapper > .${prefix}`);
        await waitFor(() => expect(toastEl()).not.toBeNull());
        const wrapper = toastEl().parentElement;
        wrapper.getAnimations().forEach((a) => a.finish());
        const content = toastEl().querySelector<HTMLElement>(`.${prefix}-content`);
        const contentStyle = getComputedStyle(content);
        // the content carries the toast's visual margin; the wrapper must open wide enough to include it, or stacked
        // toasts would sit flush against each other with no gap
        const marginBoxHeight = content.getBoundingClientRect().height + parseFloat(contentStyle.marginTop) + parseFloat(contentStyle.marginBottom);
        await waitFor(() => expect(wrapper.getBoundingClientRect().height).toBeCloseTo(marginBoxHeight, 0));
    });

    it('does not push the toasts behind a leaving toast further back in a collapsed stack', async () => {
        const toast = ToastFactory.create();
        onTestFinished(() => toast.destroyAll());
        toast.info({ content: 'first', duration: 0, stack: 1 });
        const id = toast.info({ content: 'second', duration: 0, stack: 1 });
        const toasts = () => [...document.querySelectorAll<HTMLElement>(`.${prefix}-zero-height-wrapper > .${prefix}`)];
        await waitFor(() => expect(toasts()).toHaveLength(2));
        const [first, second] = toasts();
        toasts().forEach((t) => t.getAnimations().forEach((a) => a.finish()));
        await waitFor(() => expect(second).not.toHaveClass(`${prefix}-animation-show`));
        toast.close(id);
        await waitFor(() => expect(second).toHaveClass(`${prefix}-animation-hide`));
        expect(first.style.transform).toBe('translate3d(0px, 0px, 0px)');
    });

    it('stacks the next batch again after the list was emptied while the pointer was on it', async () => {
        const toast = ToastFactory.create();
        onTestFinished(() => toast.destroyAll());
        render(<button style={{ position: 'fixed', insetBlockEnd: 0, insetInlineStart: 0 }}>away</button>);
        const first = toast.info({ content: 'first', duration: 0, stack: 1 });
        const second = toast.info({ content: 'second', duration: 0, stack: 1 });
        const toasts = () => [...document.querySelectorAll<HTMLElement>(`.${prefix}-zero-height-wrapper > .${prefix}`)];
        const list = () => document.querySelector<HTMLElement>(`.${prefix}-innerWrapper`);
        await waitFor(() => expect(toasts()).toHaveLength(2));
        toasts().forEach((t) => t.getAnimations({ subtree: true }).forEach((a) => a.finish()));
        await userEvent.hover(toasts()[1].querySelector(`.${prefix}-content`));
        await waitFor(() => expect(list()).toHaveClass(`${prefix}-innerWrapper-hover`));

        toast.close(first);
        toast.close(second);
        await waitFor(() => expect(toasts()).toHaveLength(0));
        await userEvent.hover(screen.getByRole('button', { name: 'away' }));

        toast.info({ content: 'third', duration: 1, stack: 1 });
        toast.info({ content: 'fourth', duration: 1, stack: 1 });
        await waitFor(() => expect(toasts()).toHaveLength(2));
        expect(list()).not.toHaveClass(`${prefix}-innerWrapper-hover`);
        // timers run too: the pointer left, so nothing may keep them paused
        await waitFor(() => expect(toasts()).toHaveLength(0), { timeout: 3000 });
    });

    it('does not keep the next batch paused when the hovered toast unmounted under a stationary pointer', async () => {
        const toast = ToastFactory.create();
        onTestFinished(() => toast.destroyAll());
        const first = toast.info({ content: 'first', duration: 0 });
        const toasts = () => [...document.querySelectorAll<HTMLElement>(`.${prefix}`)];
        await waitFor(() => expect(toasts()).toHaveLength(1));
        toasts().forEach((t) => t.getAnimations({ subtree: true }).forEach((a) => a.finish()));
        await userEvent.hover(toasts()[0].querySelector(`.${prefix}-content`));
        toast.close(first);
        await waitFor(() => expect(toasts()).toHaveLength(0));

        // the next toast is placed away from the pointer, so only a stale hovered flag could keep it open
        toast.info({ content: 'next', duration: 1, style: { position: 'fixed', insetBlockStart: 600 } });
        await waitFor(() => expect(toasts()).toHaveLength(1));
        await waitFor(() => expect(toasts()).toHaveLength(0), { timeout: 3000 });
    });

    it('pauses every toast while the pointer is on the list, including one that arrives meanwhile', async () => {
        const toast = ToastFactory.create();
        onTestFinished(() => toast.destroyAll());
        // 1s leaves room for the Playwright hover round trip before the first timers would fire
        toast.info({ content: 'first', duration: 1 });
        toast.info({ content: 'second', duration: 1 });
        const toasts = () => document.querySelectorAll<HTMLElement>(`.${prefix}`);
        await waitFor(() => expect(toasts()).toHaveLength(2));
        toasts().forEach((t) => t.getAnimations({ subtree: true }).forEach((a) => a.finish()));
        await userEvent.hover(toasts()[0].querySelector(`.${prefix}-content`));
        toast.info({ content: 'third', duration: 1 });
        // asserting that nothing closes needs a fixed wait longer than the duration
        await new Promise((resolve) => setTimeout(resolve, 1500));
        expect(toasts()).toHaveLength(3);
        await userEvent.unhover(toasts()[0].querySelector(`.${prefix}-content`));
        await waitFor(() => expect(toasts()).toHaveLength(0), { timeout: 3000 });
    });

    it('ShadowRoot 内焦点停在列表里时，列表更新后仍暂停计时', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const captured: { api?: ReturnType<typeof Toast.useToast>[0] } = {};
        function Demo() {
            const [api, contextHolder] = Toast.useToast();
            useEffect(() => {
                captured.api = api;
            }, [api]);
            return contextHolder;
        }
        const view = render(<Demo />, { container: mount });
        try {
            const toast = captured.api;
            toast.info({ content: 'first', duration: 1 });
            const toasts = () => shadow.querySelectorAll<HTMLElement>(`.${prefix}`);
            await waitFor(() => expect(toasts()).toHaveLength(1));
            toasts()[0]
                .getAnimations({ subtree: true })
                .forEach((a) => a.finish());
            shadow.querySelector<HTMLElement>(`.${prefix}-close-button .${BASE_CLASS_PREFIX}-button`).focus();
            toast.info({ content: 'second', duration: 0 });
            await waitFor(() => expect(toasts()).toHaveLength(2));
            // asserting that nothing closes needs a fixed wait longer than the duration
            await new Promise((resolve) => setTimeout(resolve, 1500));
            expect(toasts()).toHaveLength(2);
        } finally {
            view.unmount();
            host.remove();
        }
    });
});
