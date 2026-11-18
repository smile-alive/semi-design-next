import { flushSync } from 'svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '../../__tests__/store.svelte';
import HotKeysFixture from './hot-keys-fixture.svelte';

describe('useHotKeys', () => {
    it('按下组合键时调用最新的回调，可阻止默认行为；卸载后不再响应', async () => {
        const first = vi.fn<(e: KeyboardEvent) => void>();
        const second = vi.fn<(e: KeyboardEvent) => void>();
        const store = createStore({ hotKeys: ['Control', 'k'], preventDefault: false, onHotKey: first });
        const { unmount } = render(HotKeysFixture, { props: { store } });
        flushSync();
        store.preventDefault = true;
        store.onHotKey = second;
        flushSync();
        await fireEvent.keyDown(document.body, { code: 'KeyJ', ctrlKey: true });
        const pressed = await fireEvent.keyDown(document.body, { code: 'KeyK', ctrlKey: true });
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
        expect(pressed).toBe(false);
        unmount();
        await fireEvent.keyDown(document.body, { code: 'KeyK', ctrlKey: true });
        expect(second).toHaveBeenCalledTimes(1);
    });

    it('组合不合法时抛错', () => {
        const store = createStore({ hotKeys: ['Control', 'Shift'], preventDefault: false, onHotKey: () => {} });
        expect(() => render(HotKeysFixture, { props: { store } })).toThrow('one common key');
    });
});
