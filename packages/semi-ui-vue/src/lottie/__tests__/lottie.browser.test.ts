import { screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { cdp } from 'vite-plus/test/browser';
import { render } from '@test/utils/vue';
import Lottie, { type LottieParams } from '..';

// the project aliases lottie-web to a stub; this keeps the calls so the autoplay decision can be read. Hoisted so the
// tests read the mock directly: lottie-web types loadAnimation as a method, which lint forbids passing around
const loadAnimation = vi.hoisted(() => {
    const animation = (_params: { autoplay?: boolean }) => ({
        destroy: vi.fn<() => void>(),
        play: vi.fn<() => void>(),
        pause: vi.fn<() => void>(),
    });
    return vi.fn<typeof animation>(animation);
});
vi.mock('lottie-web', () => ({ default: { loadAnimation } }));

async function emulateReducedMotion(value: string) {
    await cdp().send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value }] });
}

// lottie-web is imported on demand, so the animation is created a few microtasks after mounting
async function autoplayOf(params: LottieParams) {
    render(Lottie, { attrs: { 'aria-label': 'spinner' }, props: { params } });
    await waitFor(() => expect(loadAnimation).toHaveBeenCalledTimes(1));
    return loadAnimation.mock.calls[0][0].autoplay;
}

describe('Lottie（浏览器）', () => {
    afterEach(async () => {
        await emulateReducedMotion('no-preference');
    });

    it('除非系统要求减少动态效果，否则自动播放', async () => {
        await emulateReducedMotion('no-preference');
        expect(await autoplayOf({ path: 'a.json' })).toBe(true);
    });

    it('系统要求减少动态效果时不自动播放', async () => {
        await emulateReducedMotion('reduce');
        expect(await autoplayOf({ path: 'a.json' })).toBe(false);
    });

    it('显式设置的 params.autoplay 优先于系统设置', async () => {
        await emulateReducedMotion('reduce');
        expect(await autoplayOf({ path: 'a.json', autoplay: true })).toBe(true);
    });

    it('有名称的动画是图片，无名称的动画对辅助技术隐藏', async () => {
        const view = render(Lottie, { attrs: { 'aria-label': 'spinner' }, props: { params: { path: 'a.json' } } });
        expect(screen.getByRole('img', { name: 'spinner' })).toBeInTheDocument();
        view.unmount();
        render(Lottie, { props: { params: { path: 'a.json' } } });
        expect(screen.queryByRole('img')).toBeNull();
        expect(document.querySelector('.semi-lottie')).toHaveAttribute('aria-hidden', 'true');
    });
});
