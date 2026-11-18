import { StrictMode } from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import useSpinDelay from '../use-spin-delay';

function Probe({ loading }: { loading: boolean }) {
    return <p>{useSpinDelay(loading) ? 'spinner' : 'idle'}</p>;
}

const view = (loading: boolean) => (
    <StrictMode>
        <Probe loading={loading} />
    </StrictMode>
);

const advance = (ms: number) =>
    act(() => {
        vi.advanceTimersByTime(ms);
    });

describe('useSpinDelay', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('loading 超过 delay 才显示，显示后至少保持 minDuration', () => {
        const { rerender } = render(view(false));
        rerender(view(true));
        advance(499);
        expect(screen.getByText('idle')).toBeTruthy();
        advance(1);
        expect(screen.getByText('spinner')).toBeTruthy();
        rerender(view(false));
        advance(199);
        expect(screen.getByText('spinner')).toBeTruthy();
        advance(1);
        expect(screen.getByText('idle')).toBeTruthy();
    });

    it('短于 delay 的加载不显示', () => {
        const { rerender } = render(view(false));
        rerender(view(true));
        advance(300);
        rerender(view(false));
        advance(1000);
        expect(screen.getByText('idle')).toBeTruthy();
    });
});
