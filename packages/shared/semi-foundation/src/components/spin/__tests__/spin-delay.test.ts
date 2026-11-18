import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { SpinDelay } from '../spin-delay';

function setup(loading: boolean, ssr?: boolean) {
    let visible = SpinDelay.initialVisible(loading, ssr);
    const spin = new SpinDelay(visible, (value) => (visible = value));
    spin.mount();
    return { spin, visible: () => visible };
}

describe('SpinDelay', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('短于 delay 的加载不显示', () => {
        const { spin, visible } = setup(false);
        spin.update(true);
        vi.advanceTimersByTime(499);
        spin.update(false);
        vi.advanceTimersByTime(1000);
        expect(visible()).toBe(false);
    });

    it('显示后至少保持 minDuration', () => {
        const { spin, visible } = setup(false);
        spin.update(true);
        vi.advanceTimersByTime(500);
        expect(visible()).toBe(true);
        spin.update(false);
        vi.advanceTimersByTime(199);
        expect(visible()).toBe(true);
        vi.advanceTimersByTime(1);
        expect(visible()).toBe(false);
    });

    it('加载超过 minDuration 时随 loading 结束立即隐藏', () => {
        const { spin, visible } = setup(false);
        spin.update(true, { delay: 100, minDuration: 100 });
        vi.advanceTimersByTime(300);
        expect(visible()).toBe(true);
        spin.update(false, { delay: 100, minDuration: 100 });
        expect(visible()).toBe(false);
    });

    it('初始即加载时按 ssr 立即显示，ssr 为 false 时仍等待 delay', () => {
        const shown = setup(true);
        expect(shown.visible()).toBe(true);
        shown.spin.update(false);
        vi.advanceTimersByTime(199);
        expect(shown.visible()).toBe(true);
        vi.advanceTimersByTime(1);
        expect(shown.visible()).toBe(false);

        const delayed = setup(true, false);
        delayed.spin.update(true);
        expect(delayed.visible()).toBe(false);
        vi.advanceTimersByTime(500);
        expect(delayed.visible()).toBe(true);
    });

    it('卸载后重新挂载（如 StrictMode）继续生效', () => {
        const { spin, visible } = setup(false);
        spin.update(true);
        spin.unmount();
        spin.mount();
        spin.update(true);
        vi.advanceTimersByTime(500);
        expect(visible()).toBe(true);
        spin.unmount();
        spin.mount();
        spin.update(false);
        vi.advanceTimersByTime(200);
        expect(visible()).toBe(false);
    });
});
