import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import BreakpointFixture from './breakpoint-fixture.svelte';
import ThemeModeFixture from './theme-mode-fixture.svelte';

describe('Svelte hooks 服务端首帧', () => {
    it('useThemeMode 渲染初值 light', () => {
        expect(render(ThemeModeFixture).body).toContain('light/light');
    });

    it('useBreakpoint 渲染全部断点为 false', () => {
        expect(render(BreakpointFixture).body).toContain('none');
    });
});
