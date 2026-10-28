import { createSignal } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import useEventListener from '../use-event-listener';

describe('useEventListener', () => {
    it('enabled 为 false 时移除监听，恢复后再添加，卸载后移除', () => {
        const [enabled, setEnabled] = createSignal(true);
        const listener = vi.fn<(event: Event) => void>();
        const view = render(() => {
            useEventListener(() => window, 'resize', listener, { enabled });
            return null;
        });
        window.dispatchEvent(new Event('resize'));
        expect(listener).toHaveBeenCalledOnce();

        setEnabled(false);
        window.dispatchEvent(new Event('resize'));
        expect(listener).toHaveBeenCalledOnce();

        setEnabled(true);
        window.dispatchEvent(new Event('resize'));
        expect(listener).toHaveBeenCalledTimes(2);

        view.unmount();
        window.dispatchEvent(new Event('resize'));
        expect(listener).toHaveBeenCalledTimes(2);
    });

    it('capture 为 true 时，子元素停止冒泡后仍能收到事件', () => {
        const parent = document.createElement('div');
        const child = document.createElement('div');
        parent.append(child);
        child.addEventListener('click', (event) => event.stopPropagation());
        const listener = vi.fn<(event: Event) => void>();
        render(() => {
            useEventListener(() => parent, 'click', listener, { capture: true });
            return null;
        });
        child.dispatchEvent(new Event('click', { bubbles: true }));
        expect(listener).toHaveBeenCalledOnce();
    });
});
