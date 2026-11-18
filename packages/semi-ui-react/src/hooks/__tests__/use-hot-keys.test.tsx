import { StrictMode } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import useHotKeys from '../use-hot-keys';

function Probe({ onHotKey, preventDefault }: { onHotKey: (e: KeyboardEvent) => void; preventDefault?: boolean }) {
    useHotKeys(['Control', 'k'], onHotKey, { preventDefault });
    return null;
}

describe('useHotKeys', () => {
    it('按下组合键时调用最新的回调，可阻止默认行为；卸载后不再响应', () => {
        const first = vi.fn<(e: KeyboardEvent) => void>();
        const second = vi.fn<(e: KeyboardEvent) => void>();
        const { rerender, unmount } = render(
            <StrictMode>
                <Probe onHotKey={first} />
            </StrictMode>
        );
        rerender(
            <StrictMode>
                <Probe preventDefault onHotKey={second} />
            </StrictMode>
        );
        fireEvent.keyDown(document.body, { code: 'KeyJ', ctrlKey: true });
        const pressed = fireEvent.keyDown(document.body, { code: 'KeyK', ctrlKey: true });
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
        expect(pressed).toBe(false);
        unmount();
        fireEvent.keyDown(document.body, { code: 'KeyK', ctrlKey: true });
        expect(second).toHaveBeenCalledTimes(1);
    });

    it('组合不合法时在渲染中抛错', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        function Invalid() {
            useHotKeys(['Control', 'Shift'], () => {});
            return null;
        }
        expect(() => render(<Invalid />)).toThrow('one common key');
    });
});
