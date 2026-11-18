import { render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import useThemeMode from '../use-theme-mode';

function Probe() {
    const { mode, preference, setMode } = useThemeMode();
    return (
        <button type="button" onClick={() => setMode(mode() === 'dark' ? 'light' : 'dark')}>
            {mode()}/{preference()}
        </button>
    );
}

describe('useThemeMode', () => {
    afterEach(() => {
        document.documentElement.removeAttribute('theme-mode');
    });

    it('读写 html 的 theme-mode，并反映页面直接写入的属性', async () => {
        render(() => <Probe />);
        const button = screen.getByRole('button');
        expect(button).toHaveTextContent('light/light');
        button.click();
        expect(button).toHaveTextContent('dark/dark');
        expect(document.documentElement).toHaveAttribute('theme-mode', 'dark');
        document.documentElement.removeAttribute('theme-mode');
        await Promise.resolve();
        expect(button).toHaveTextContent('light/light');
    });
});
