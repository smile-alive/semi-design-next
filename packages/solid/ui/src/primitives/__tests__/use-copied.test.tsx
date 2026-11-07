import { render } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import useCopied from '../use-copied';

const { copyText } = vi.hoisted(() => ({ copyText: vi.fn<(text: string) => Promise<boolean>>() }));
vi.mock('@fibrae/semi-foundation/utils/clipboard', () => ({ copyText }));

describe('useCopied', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        copyText.mockResolvedValue(true);
    });
    afterEach(() => {
        vi.useRealTimers();
        copyText.mockReset();
    });

    const setup = (duration = 1000) => {
        let handle!: ReturnType<typeof useCopied>;
        const view = render(() => {
            handle = useCopied(() => duration);
            return null;
        });
        return { view, handle: () => handle };
    };

    it('复制成功后 copied 保持 duration 毫秒，重复复制重新计时', async () => {
        const { handle } = setup();
        await expect(handle()[1]('a')).resolves.toBe(true);
        expect(handle()[0]()).toBe(true);

        vi.advanceTimersByTime(800);
        await handle()[1]('a');
        vi.advanceTimersByTime(800);
        expect(handle()[0]()).toBe(true);

        vi.advanceTimersByTime(200);
        expect(handle()[0]()).toBe(false);
    });

    it('复制失败时不置为 copied', async () => {
        copyText.mockResolvedValue(false);
        const { handle } = setup();
        await expect(handle()[1]('a')).resolves.toBe(false);
        expect(handle()[0]()).toBe(false);
    });

    it('卸载后忽略仍在进行的复制', async () => {
        const { view, handle } = setup();
        const pending = handle()[1]('a');
        view.unmount();
        await pending;
        expect(handle()[0]()).toBe(false);
        expect(vi.getTimerCount()).toBe(0);
    });
});
