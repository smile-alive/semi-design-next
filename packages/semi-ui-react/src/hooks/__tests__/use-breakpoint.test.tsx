import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { defaultResponsiveMap } from '@fibrae/semi-foundation/components/grid/constants';
import { hydrateFromServer, mockMatchMedia } from '@test/utils/react';
import useBreakpoint from '../use-breakpoint';

function Probe() {
    const screens = useBreakpoint();
    return (
        <p>
            {Object.keys(screens)
                .filter((key) => screens[key as keyof typeof screens])
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
        const { unmount } = render(<Probe />);
        expect(screen.getByText('sm,md')).toBeTruthy();
        matching.push(defaultResponsiveMap.lg);
        media.fire(defaultResponsiveMap.lg, true);
        expect(screen.getByText('sm,md,lg')).toBeTruthy();
        unmount();
        expect(media.totalHandlers()).toBe(0);
    });

    it('hydration 先渲染全部为 false，再换成实际断点', async () => {
        mockMatchMedia([defaultResponsiveMap.sm]);
        const { container, errors } = await hydrateFromServer(<Probe />);
        expect(errors).toEqual([]);
        expect(container).toHaveTextContent('sm');
    });
});
