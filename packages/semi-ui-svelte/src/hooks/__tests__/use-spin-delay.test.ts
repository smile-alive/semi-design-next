import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '../../__tests__/store.svelte';
import SpinDelayFixture from './spin-delay-fixture.svelte';

function setup() {
    const store = createStore({ loading: false });
    render(SpinDelayFixture, { props: { store } });
    flushSync();
    return (loading: boolean) => {
        store.loading = loading;
        flushSync();
    };
}

function advance(ms: number) {
    vi.advanceTimersByTime(ms);
    flushSync();
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
        advance(499);
        expect(screen.getByText('idle')).toBeTruthy();
        advance(1);
        expect(screen.getByText('spinner')).toBeTruthy();
        setLoading(false);
        advance(199);
        expect(screen.getByText('spinner')).toBeTruthy();
        advance(1);
        expect(screen.getByText('idle')).toBeTruthy();
    });

    it('短于 delay 的加载不显示', () => {
        const setLoading = setup();
        setLoading(true);
        advance(300);
        setLoading(false);
        advance(1000);
        expect(screen.getByText('idle')).toBeTruthy();
    });
});
