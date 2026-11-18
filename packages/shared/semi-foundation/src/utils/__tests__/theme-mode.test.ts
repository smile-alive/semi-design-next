import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { mockMatchMediaCore } from '@test/utils/dom/match-media-core';
import { getThemeMode, getThemePreference, setThemeMode, subscribeThemeMode } from '../theme-mode';

const SYSTEM_DARK = '(prefers-color-scheme: dark)';

describe('theme-mode', () => {
    afterEach(() => {
        setThemeMode('light');
        vi.unstubAllGlobals();
    });

    it('dark 写入 html 的 theme-mode，light 移除属性', () => {
        setThemeMode('dark');
        expect(document.documentElement.getAttribute('theme-mode')).toBe('dark');
        expect(getThemeMode()).toBe('dark');
        setThemeMode('light');
        expect(document.documentElement.hasAttribute('theme-mode')).toBe(false);
        expect(getThemeMode()).toBe('light');
    });

    it('system 跟随 prefers-color-scheme，切到其它模式后停止跟随', () => {
        const media = mockMatchMediaCore([SYSTEM_DARK]);
        setThemeMode('system');
        expect(getThemeMode()).toBe('dark');
        expect(getThemePreference()).toBe('system');
        media.fire(SYSTEM_DARK, false);
        expect(getThemeMode()).toBe('light');
        setThemeMode('dark');
        expect(media.handlerCount(SYSTEM_DARK)).toBe(0);
        expect(getThemePreference()).toBe('dark');
    });

    it('页面直接改属性时 preference 跟着变', () => {
        document.documentElement.setAttribute('theme-mode', 'dark');
        expect(getThemePreference()).toBe('dark');
    });

    it('订阅者收到属性变化和 system 偏好变化', async () => {
        mockMatchMediaCore([]);
        const onChange = vi.fn<() => void>();
        const unsubscribe = subscribeThemeMode(onChange);
        setThemeMode('system');
        expect(onChange).toHaveBeenCalledTimes(1);
        document.documentElement.setAttribute('theme-mode', 'dark');
        await Promise.resolve();
        expect(onChange).toHaveBeenCalledTimes(2);
        unsubscribe();
        setThemeMode('light');
        await Promise.resolve();
        expect(onChange).toHaveBeenCalledTimes(2);
    });
});
