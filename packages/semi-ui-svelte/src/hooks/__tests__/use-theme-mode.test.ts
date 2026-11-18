import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import ThemeModeFixture from './theme-mode-fixture.svelte';

describe('useThemeMode', () => {
    afterEach(() => {
        document.documentElement.removeAttribute('theme-mode');
    });

    it('读写 html 的 theme-mode，并反映页面直接写入的属性', async () => {
        render(ThemeModeFixture);
        flushSync();
        const button = screen.getByRole('button');
        expect(button.textContent?.trim()).toBe('light/light');
        await fireEvent.click(button);
        flushSync();
        expect(button.textContent?.trim()).toBe('dark/dark');
        expect(document.documentElement.getAttribute('theme-mode')).toBe('dark');
        document.documentElement.removeAttribute('theme-mode');
        await new Promise((resolve) => setTimeout(resolve));
        flushSync();
        expect(button.textContent?.trim()).toBe('light/light');
    });
});
