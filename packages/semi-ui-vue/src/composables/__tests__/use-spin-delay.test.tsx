/** @jsxImportSource vue */
import { defineComponent, nextTick, ref } from 'vue';
import { screen } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import useSpinDelay from '../use-spin-delay';

function setup() {
    const loading = ref(false);
    render(
        defineComponent({
            setup() {
                const visible = useSpinDelay(() => loading.value);
                return () => <p>{visible.value ? 'spinner' : 'idle'}</p>;
            },
        })
    );
    return loading;
}

describe('useSpinDelay', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('loading 超过 delay 才显示，显示后至少保持 minDuration', async () => {
        const loading = setup();
        loading.value = true;
        await nextTick();
        vi.advanceTimersByTime(499);
        await nextTick();
        expect(screen.getByText('idle')).toBeTruthy();
        vi.advanceTimersByTime(1);
        await nextTick();
        expect(screen.getByText('spinner')).toBeTruthy();
        loading.value = false;
        await nextTick();
        vi.advanceTimersByTime(199);
        await nextTick();
        expect(screen.getByText('spinner')).toBeTruthy();
        vi.advanceTimersByTime(1);
        await nextTick();
        expect(screen.getByText('idle')).toBeTruthy();
    });

    it('短于 delay 的加载不显示', async () => {
        const loading = setup();
        loading.value = true;
        await nextTick();
        vi.advanceTimersByTime(300);
        loading.value = false;
        await nextTick();
        vi.advanceTimersByTime(1000);
        await nextTick();
        expect(screen.getByText('idle')).toBeTruthy();
    });
});
