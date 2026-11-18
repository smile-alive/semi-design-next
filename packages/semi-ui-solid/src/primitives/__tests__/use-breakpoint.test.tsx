import { render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { defaultResponsiveMap } from '@fibrae/semi-foundation/components/grid/constants';
import { mockMatchMedia } from '@test/utils/solid';
import useBreakpoint from '../use-breakpoint';

function Probe() {
    const screens = useBreakpoint();
    return (
        <p>
            {Object.keys(screens())
                .filter((key) => screens()[key as keyof ReturnType<typeof screens>])
                .join(',') || 'none'}
        </p>
    );
}

describe('useBreakpoint', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('挂载后读取命中的断点，并跟随媒体查询变化；卸载后移除监听', () => {
        const matching = [defaultResponsiveMap.sm, defaultResponsiveMap.md];
        const media = mockMatchMedia(matching);
        const { unmount } = render(() => <Probe />);
        expect(screen.getByText('sm,md')).toBeTruthy();
        matching.push(defaultResponsiveMap.lg);
        media.fire(defaultResponsiveMap.lg, true);
        expect(screen.getByText('sm,md,lg')).toBeTruthy();
        unmount();
        expect(media.totalHandlers()).toBe(0);
    });
});
