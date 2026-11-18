import { createSignal } from 'solid-js';
import { fireEvent, render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import useHotKeys from '../use-hot-keys';

describe('useHotKeys', () => {
    it('按下组合键时调用回调，可阻止默认行为；卸载后不再响应', () => {
        const onHotKey = vi.fn<(e: KeyboardEvent) => void>();
        const [prevent, setPrevent] = createSignal(false);
        const { unmount } = render(() => {
            useHotKeys(
                () => ['Control', 'k'],
                onHotKey,
                () => ({ preventDefault: prevent() })
            );
            return null;
        });
        expect(fireEvent.keyDown(document.body, { code: 'KeyK', ctrlKey: true })).toBe(true);
        setPrevent(true);
        fireEvent.keyDown(document.body, { code: 'KeyJ', ctrlKey: true });
        const pressed = fireEvent.keyDown(document.body, { code: 'KeyK', ctrlKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(2);
        expect(pressed).toBe(false);
        unmount();
        fireEvent.keyDown(document.body, { code: 'KeyK', ctrlKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(2);
    });

    it('getListenerTarget 变化时换到新的目标', () => {
        const onHotKey = vi.fn<(e: KeyboardEvent) => void>();
        const first = document.createElement('div');
        const second = document.createElement('div');
        const [target, setTarget] = createSignal(first);
        render(() => {
            useHotKeys(
                () => ['Control', 'k'],
                onHotKey,
                () => ({ getListenerTarget: () => target() })
            );
            return null;
        });
        setTarget(second);
        fireEvent.keyDown(first, { code: 'KeyK', ctrlKey: true });
        expect(onHotKey).not.toHaveBeenCalled();
        fireEvent.keyDown(second, { code: 'KeyK', ctrlKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('组合不合法时抛错', () => {
        expect(() =>
            render(() => {
                useHotKeys(
                    () => ['Control', 'Shift'],
                    () => {}
                );
                return null;
            })
        ).toThrow('one common key');
    });
});
