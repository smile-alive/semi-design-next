import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { defaultResponsiveMap } from '@fibrae/semi-foundation/components/grid/constants';
import { mockMatchMediaCore } from '@test/utils/dom/match-media-core';
import BreakpointFixture from './breakpoint-fixture.svelte';

describe('useBreakpoint', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('挂载后读取命中的断点，并跟随媒体查询变化；卸载后移除监听', () => {
        const matching = [defaultResponsiveMap.sm, defaultResponsiveMap.md];
        const media = mockMatchMediaCore(matching);
        const { unmount } = render(BreakpointFixture);
        flushSync();
        expect(screen.getByText('sm,md')).toBeTruthy();
        matching.push(defaultResponsiveMap.lg);
        media.fire(defaultResponsiveMap.lg, true);
        flushSync();
        expect(screen.getByText('sm,md,lg')).toBeTruthy();
        unmount();
        expect(media.totalHandlers()).toBe(0);
    });
});
