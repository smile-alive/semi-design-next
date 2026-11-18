import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { hydrateFromServer } from '@test/utils/react';
import useThemeMode from '../use-theme-mode';

function Probe() {
    const { mode, preference, setMode } = useThemeMode();
    return (
        <button type="button" onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
            {mode}/{preference}
        </button>
    );
}

describe('useThemeMode', () => {
    afterEach(() => {
        document.documentElement.removeAttribute('theme-mode');
    });

    it('读写 html 的 theme-mode，并反映页面直接写入的属性', async () => {
        render(<Probe />);
        const button = screen.getByRole('button');
        expect(button).toHaveTextContent('light/light');
        act(() => button.click());
        expect(button).toHaveTextContent('dark/dark');
        expect(document.documentElement).toHaveAttribute('theme-mode', 'dark');
        await act(async () => document.documentElement.removeAttribute('theme-mode'));
        expect(button).toHaveTextContent('light/light');
    });

    it('hydration 先渲染服务端的 light，再换成页面的实际模式', async () => {
        document.documentElement.setAttribute('theme-mode', 'dark');
        const { container, errors } = await hydrateFromServer(<Probe />);
        expect(errors).toEqual([]);
        expect(container).toHaveTextContent('dark/dark');
    });
});
