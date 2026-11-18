import { createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import useSpinDelay from '../use-spin-delay';

function setup() {
    const [loading, setLoading] = createSignal(false);
    render(() => {
        const visible = useSpinDelay(loading);
        return <p>{visible() ? 'spinner' : 'idle'}</p>;
    });
    return setLoading;
}

describe('useSpinDelay', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('loading 超过 delay 才显示，显示后至少保持 minDuration', () => {
        const setLoading = setup();
        setLoading(true);
        vi.advanceTimersByTime(499);
        expect(screen.getByText('idle')).toBeTruthy();
        vi.advanceTimersByTime(1);
        expect(screen.getByText('spinner')).toBeTruthy();
        setLoading(false);
        vi.advanceTimersByTime(199);
        expect(screen.getByText('spinner')).toBeTruthy();
        vi.advanceTimersByTime(1);
        expect(screen.getByText('idle')).toBeTruthy();
    });

    it('短于 delay 的加载不显示', () => {
        const setLoading = setup();
        setLoading(true);
        vi.advanceTimersByTime(300);
        setLoading(false);
        vi.advanceTimersByTime(1000);
        expect(screen.getByText('idle')).toBeTruthy();
    });
});
