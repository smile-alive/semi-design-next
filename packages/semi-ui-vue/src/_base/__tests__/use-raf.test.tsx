/** @jsxImportSource vue */
import { defineComponent } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import useRaf from '../use-raf';
import useTimeout from '../use-timeout';

function host(use: () => (callback: () => void) => void) {
    let schedule!: (callback: () => void) => void;
    const view = render(
        defineComponent({
            setup() {
                schedule = use();
                return () => <div />;
            },
        })
    );
    return { view, schedule: (callback: () => void) => schedule(callback) };
}

describe('useRaf 与 useTimeout', () => {
    afterEach(() => vi.useRealTimers());

    it.each([
        ['useRaf', useRaf, () => vi.advanceTimersToNextFrame()],
        ['useTimeout', useTimeout, () => vi.runAllTimers()],
    ])('%s：新的调用替换待执行的回调，卸载后不再执行', (_name, use, flush) => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
        const { view, schedule } = host(use);
        const first = vi.fn<() => void>();
        const second = vi.fn<() => void>();
        schedule(first);
        schedule(second);
        flush();
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledOnce();

        const late = vi.fn<() => void>();
        schedule(late);
        view.unmount();
        flush();
        expect(late).not.toHaveBeenCalled();
    });
});
