import { render, waitFor } from '@testing-library/svelte';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { tabTo } from '@test/utils/browser';
import { ToastFactory } from '../index';
import type { ToastHookApi } from '../interface';
import HookHost from './hook-host.svelte';

const prefix = 'semi-toast';
const closeButton = (toast: Element) => toast.querySelector(`.${prefix}-close-button .semi-button`) as HTMLButtonElement;
const finishAnimations = (elements: Element[]) => elements.forEach((el) => el.getAnimations({ subtree: true }).forEach((a) => a.finish()));
// The enter and leave classes, and so their animations, sit on the element around the toast
const wrapperOf = (toast: Element) => toast.parentElement as HTMLElement;

function renderHook(reachable?: string) {
    const result = {} as { api: ToastHookApi };
    const view = render(HookHost, {
        props: {
            reachable,
            onApi: (api) => {
                result.api = api;
            },
        },
    });
    // hook toasts are mounted into the body
    const toasts = () => [...document.body.querySelectorAll<HTMLElement>(`.${prefix}`)];
    return { api: result.api, toasts, view };
}

function createStatic() {
    const toast = ToastFactory.create();
    onTestFinished(() => toast.destroyAll());
    return toast;
}

describe('Toast 浏览器', () => {
    it('useToast 的 Toast 按 id 与关闭按钮关闭', async () => {
        const { api, toasts } = renderHook();
        const config = { duration: 0, content: 'hook' };
        api.success(config);
        api.info(config);
        api.error(config);
        api.warning(config);
        const id = api.open(config);
        await waitFor(() => expect(toasts()).toHaveLength(5));
        api.close(id);
        await waitFor(() => expect(toasts()).toHaveLength(4));
        await userEvent.click(closeButton(toasts()[0]));
        await waitFor(() => expect(toasts()).toHaveLength(3));
    });

    it('离场中的 Toast 下方的 Toast 随离场上移', async () => {
        const { api, toasts } = renderHook();
        api.info({ content: 'first', duration: 0 });
        api.info({ content: 'second', duration: 0 });
        await waitFor(() => expect(toasts()).toHaveLength(2));
        finishAnimations(toasts().map(wrapperOf));
        const [first, second] = toasts();
        const firstTop = first.getBoundingClientRect().top;
        const secondTop = second.getBoundingClientRect().top;
        const content = first.querySelector(`.${prefix}-content`) as HTMLElement;
        const contentTop = content.getBoundingClientRect().top;

        await userEvent.click(closeButton(first));
        // seek the paused leave animation instead of sleeping, so frame timing cannot skew samples
        const leave = await waitFor(() => {
            const animations = wrapperOf(first).getAnimations({ subtree: true });
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

    it('展开的堆叠中离场时下方的 Toast 上移', async () => {
        const toast = createStatic();
        toast.info({ content: 'first', duration: 0, stack: 1 });
        toast.info({ content: 'second', duration: 0, stack: 1 });
        const toasts = () => [...document.querySelectorAll<HTMLElement>(`.${prefix}-zero-height-wrapper > .${prefix}`)];
        await waitFor(() => expect(toasts()).toHaveLength(2));
        const [first, second] = toasts();
        await userEvent.hover(second.querySelector(`.${prefix}-content`) as HTMLElement);
        const wrappers = toasts().map(wrapperOf);
        await waitFor(() => expect(wrappers[0].getBoundingClientRect().height).toBeGreaterThan(0));
        finishAnimations(wrappers);
        const firstTop = first.getBoundingClientRect().top;

        await userEvent.click(closeButton(first));
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

    it('stack: true 时最多平铺三条，第四条起堆叠并隐藏三层之后的 Toast', async () => {
        const toast = createStatic();
        const toasts = () => [...document.querySelectorAll<HTMLElement>(`.${prefix}-zero-height-wrapper > .${prefix}`)];
        const expandedCls = `${prefix}-zero-height-wrapper-expanded`;
        const expandedStates = () => toasts().map((t) => t.parentElement?.classList.contains(expandedCls));
        const ids = ['1', '2', '3'].map((content) => toast.info({ content, duration: 0, stack: true }));
        await waitFor(() => expect(toasts()).toHaveLength(3));
        await waitFor(() => expect(expandedStates().every(Boolean)).toBe(true));

        toast.info({ content: '4', duration: 0, stack: true });
        await waitFor(() => expect(expandedStates()).toEqual([false, false, false, false]));
        const [oldest, ...front] = toasts();
        expect(oldest).toHaveClass(`${prefix}-stack-hidden`);
        await waitFor(() => expect(getComputedStyle(oldest).visibility).toBe('hidden'));
        front.forEach((t) => expect(t).not.toHaveClass(`${prefix}-stack-hidden`));

        finishAnimations(toasts().map(wrapperOf));
        await userEvent.hover(front[2].querySelector(`.${prefix}-content`) as HTMLElement);
        await waitFor(() => expect(expandedStates().every(Boolean)).toBe(true));
        expect(oldest).not.toHaveClass(`${prefix}-stack-hidden`);
        await userEvent.unhover(front[2].querySelector(`.${prefix}-content`) as HTMLElement);
        await waitFor(() => expect(oldest).toHaveClass(`${prefix}-stack-hidden`));

        toast.close(ids[0]);
        await waitFor(() => expect(toasts()).toHaveLength(3));
        await waitFor(() => expect(expandedStates().every(Boolean)).toBe(true));
    });

    it('展开堆叠的高度由 class 驱动，不写内联高度', async () => {
        const toast = createStatic();
        toast.info({ content: 'only', duration: 0, stack: true });
        const wrapper = () => document.querySelector<HTMLElement>(`.${prefix}-zero-height-wrapper`);
        await waitFor(() => expect(wrapper()).toHaveClass(`${prefix}-zero-height-wrapper-expanded`));
        expect(wrapper()?.style.height).toBe('');
    });

    it('展开的堆叠 wrapper 高度包含 Toast 自身的外边距', async () => {
        const toast = createStatic();
        toast.info({ content: 'only', duration: 0, stack: true });
        const toastEl = () => document.querySelector<HTMLElement>(`.${prefix}-zero-height-wrapper > .${prefix}`);
        await waitFor(() => expect(toastEl()).not.toBeNull());
        const wrapper = toastEl()?.parentElement as HTMLElement;
        wrapper.getAnimations().forEach((a) => a.finish());
        const content = toastEl()?.querySelector<HTMLElement>(`.${prefix}-content`) as HTMLElement;
        const contentStyle = getComputedStyle(content);
        const marginBoxHeight = content.getBoundingClientRect().height + parseFloat(contentStyle.marginTop) + parseFloat(contentStyle.marginBottom);
        await waitFor(() => expect(wrapper.getBoundingClientRect().height).toBeCloseTo(marginBoxHeight, 0));
    });

    it('收起的堆叠中离场时不把后层推得更远', async () => {
        const toast = createStatic();
        toast.info({ content: 'first', duration: 0, stack: 1 });
        const id = toast.info({ content: 'second', duration: 0, stack: 1 });
        const toasts = () => [...document.querySelectorAll<HTMLElement>(`.${prefix}-zero-height-wrapper > .${prefix}`)];
        await waitFor(() => expect(toasts()).toHaveLength(2));
        const [first, second] = toasts();
        finishAnimations(toasts().map(wrapperOf));
        await waitFor(() => expect(wrapperOf(second)).not.toHaveClass(`${prefix}-animation-show`));
        toast.close(id);
        await waitFor(() => expect(wrapperOf(second)).toHaveClass(`${prefix}-animation-hide`));
        expect(first.style.transform).toBe('translate3d(0px, 0px, 0px)');
    });

    it('指针在列表上时全部暂停，包括期间新到的 Toast', async () => {
        const toast = createStatic();
        toast.info({ content: 'first', duration: 1 });
        toast.info({ content: 'second', duration: 1 });
        const toasts = () => document.querySelectorAll<HTMLElement>(`.${prefix}`);
        await waitFor(() => expect(toasts()).toHaveLength(2));
        finishAnimations([...toasts()].map(wrapperOf));
        await userEvent.hover(toasts()[0].querySelector(`.${prefix}-content`) as HTMLElement);
        toast.info({ content: 'third', duration: 1 });
        // asserting that nothing closes needs a fixed wait longer than the duration
        await new Promise((resolve) => setTimeout(resolve, 1500));
        expect(toasts()).toHaveLength(3);
        await userEvent.unhover(toasts()[0].querySelector(`.${prefix}-content`) as HTMLElement);
        await waitFor(() => expect(toasts()).toHaveLength(0), { timeout: 3000 });
    });

    it('键盘焦点在关闭按钮上时不到点关闭，Enter 关闭后 Toast 正常移除', async () => {
        const toast = createStatic();
        toast.info({ content: 'keyboard', duration: 0.5 });
        const toastEl = () => document.querySelector<HTMLElement>(`.${prefix}`);
        await waitFor(() => expect(toastEl()).not.toBeNull());
        await tabTo(closeButton(toastEl() as HTMLElement));
        // asserting that nothing closes needs a fixed wait longer than the duration
        await new Promise((resolve) => setTimeout(resolve, 1200));
        expect(toastEl()).not.toBeNull();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(toastEl()).toBeNull());
    });

    it('Tab 到收起堆叠后层的关闭按钮时堆叠已展开，按钮未被前层遮住', async () => {
        const toast = createStatic();
        ['1', '2', '3', '4'].forEach((content) => toast.info({ content, duration: 0, stack: true }));
        const toasts = () => [...document.querySelectorAll<HTMLElement>(`.${prefix}-zero-height-wrapper > .${prefix}`)];
        await waitFor(() => expect(toasts()).toHaveLength(4));
        const behind = closeButton(toasts()[1]);
        await tabTo(behind);
        const wrappers = toasts().map(wrapperOf);
        await waitFor(() => expect(wrappers.every((w) => w.classList.contains(`${prefix}-zero-height-wrapper-expanded`))).toBe(true));
        finishAnimations(wrappers);
        const rect = behind.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        expect(behind.contains(hit)).toBe(true);
    });

    it('焦点停在列表里时，其他 Toast 离场后仍暂停计时', async () => {
        const { api, toasts } = renderHook();
        const leaving = api.open({ content: 'leaving', duration: 0 });
        api.open({ content: 'first', duration: 1 });
        await waitFor(() => expect(toasts()).toHaveLength(2));
        finishAnimations(toasts().map(wrapperOf));
        closeButton(toasts().find((toast) => toast.textContent?.includes('first')) as HTMLElement).focus();
        api.close(leaving);
        await waitFor(() => expect(toasts()).toHaveLength(1));
        // asserting that nothing closes needs a fixed wait longer than the duration
        await new Promise((resolve) => setTimeout(resolve, 1500));
        expect(toasts()).toHaveLength(1);
    });
});
