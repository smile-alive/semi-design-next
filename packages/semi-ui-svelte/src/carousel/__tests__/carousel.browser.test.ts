import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import Fixture, { type FixtureStore } from './carousel-fixture.svelte';

const prefix = `${BASE_CLASS_PREFIX}-carousel`;
const style = 'width: 600px; height: 240px';
const activeTitle = () => document.querySelector(`.${prefix}-content-item-active h3`)?.textContent;
async function expectActive(title: string) {
    await expect.poll(activeTitle).toBe(title);
}
async function tick(ms: number) {
    await vi.advanceTimersByTimeAsync(ms);
    flushSync();
}

function setup(props: FixtureStore['props']) {
    const store = createStore<FixtureStore>({ count: 3, activeIndex: undefined, accept: true, log: [], props: { style, ...props } });
    return { store, ...render(Fixture, { props: { mode: 'uncontrolled', store, ref: {} as never } }) };
}

describe('Svelte Carousel（浏览器）', () => {
    describe('使用假定时器', () => {
        beforeEach(async () => {
            // A carousel rendered under the pointer left by an earlier test gets a mouseenter, which pauses autoplay
            render(Fixture, { props: { mode: 'uncontrolled', store: createStore<FixtureStore>({ count: 0, activeIndex: undefined, accept: true, log: [], props: {} }), ref: {} as never } });
            await userEvent.hover(document.body, { position: { x: 1, y: 1 } });
            vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] });
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('键盘焦点在离开前暂停轮播', async () => {
            setup({ autoPlay: { interval: 1000, hoverToPause: false } });
            await userEvent.keyboard('{Tab}');
            expect(screen.getByRole('tab', { selected: true })).toHaveFocus();
            await tick(5000);
            await expectActive('index0');
            (document.activeElement as HTMLElement).blur();
            await tick(1300);
            await expectActive('index1');
        });

        it('鼠标点击箭头会使其获得焦点，但不暂停轮播', async () => {
            const { container } = setup({ autoPlay: { interval: 1000, hoverToPause: false } });
            const next = container.querySelector(`.${prefix}-arrow-next`) as HTMLElement;
            await userEvent.click(next);
            await expectActive('index1');
            expect(next).toHaveFocus();
            await tick(1300);
            await expectActive('index2');
        });
    });

    it('仅悬停显示的箭头在键盘聚焦进入轮播时变为可见', async () => {
        const { container } = setup({ arrowType: 'hover', autoPlay: false });
        const next = container.querySelector(`.${prefix}-arrow-next`) as HTMLElement;
        expect(getComputedStyle(next).opacity).toBe('0');
        await userEvent.keyboard('{Tab}{Tab}{Tab}');
        expect(next).toHaveFocus();
        expect(getComputedStyle(next).opacity).toBe('1');
        await userEvent.keyboard('{Enter}');
        await expectActive('index1');
    });

    it('箭头和指示点显示主题焦点环，而非浏览器默认焦点环', async () => {
        setup({ autoPlay: false });
        const focused: string[] = [];
        for (let i = 0; i < 3; i++) {
            await userEvent.keyboard('{Tab}');
            const el = document.activeElement as HTMLElement;
            focused.push(el.getAttribute('role') ?? el.className);
            expectThemeFocusRing(el);
        }
        expect(focused).toEqual(['tab', expect.stringContaining('arrow-prev'), expect.stringContaining('arrow-next')]);
        const arrow = document.activeElement as HTMLElement;
        expect(getComputedStyle(arrow).borderRadius).toBe('50%');
        expect(arrow.offsetWidth).toBe(arrow.offsetHeight);
    });

    it('非当前幻灯片带 inert，Tab 不会进入', async () => {
        setup({ autoPlay: false, animation: 'fade' });
        const slides = [...document.querySelectorAll<HTMLElement>(`.${prefix}-content-item`)];
        expect(slides.map((item) => item.inert)).toEqual([false, true, true]);
        expect(slides.map((item) => item.hasAttribute('inert'))).toEqual([false, true, true]);
    });
});
