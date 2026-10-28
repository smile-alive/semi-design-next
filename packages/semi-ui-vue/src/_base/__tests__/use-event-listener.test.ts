import { defineComponent, nextTick } from 'vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import useEventListener, { getWindow } from '../use-event-listener';

describe('useEventListener', () => {
    it('getWindow 目标接受 window 专有事件，监听函数收到对应事件类型', async () => {
        const listener = vi.fn<(event: PopStateEvent) => void>();
        const History = defineComponent({
            setup() {
                useEventListener(getWindow, 'popstate', listener);
                return () => null;
            },
        });
        render(History);
        await nextTick();
        window.dispatchEvent(new PopStateEvent('popstate', { state: 1 }));
        expect(listener.mock.calls[0][0].state).toBe(1);
    });
});
