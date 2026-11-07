/** @jsxImportSource vue */
import { KeepAlive, defineComponent, nextTick } from 'vue';
import { fireEvent } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import BackTop from '../backtop.vue';

const Host = defineComponent({
    props: { active: { type: Boolean, required: true } },
    setup: (props) => () => <KeepAlive>{props.active ? <BackTop /> : <p>other</p>}</KeepAlive>,
});

describe('BackTop KeepAlive', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    });

    afterEach(() => {
        vi.useRealTimers();
        delete (window as unknown as Record<string, unknown>).scrollY;
    });

    it('失活后释放窗口上的 scroll 监听，激活后恢复', async () => {
        const add = vi.spyOn(window, 'addEventListener');
        const remove = vi.spyOn(window, 'removeEventListener');
        // the same handler is added again on activation, so listeners are counted by add minus remove calls
        const live = () => add.mock.calls.filter(([type]) => type === 'scroll').length - remove.mock.calls.filter(([type]) => type === 'scroll').length;
        const view = render(Host, { props: { active: true } });
        expect(live()).toBe(1);

        await view.rerender({ active: false });
        expect(live()).toBe(0);

        await view.rerender({ active: true });
        expect(live()).toBe(1);
        // jsdom does not lay out, so the scroll position is stubbed on the window
        Object.defineProperty(window, 'scrollY', { value: 1000, writable: true, configurable: true });
        await fireEvent.scroll(window);
        vi.advanceTimersByTime(16);
        await nextTick();
        expect(view.container.querySelector('.semi-backtop')).not.toBeNull();
    });
});
