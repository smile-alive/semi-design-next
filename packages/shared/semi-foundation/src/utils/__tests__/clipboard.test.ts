import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { CopiedTimer } from '../clipboard';

describe('CopiedTimer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn<(text: string) => Promise<void>>(() => Promise.resolve()) } });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('复制成功置 true，duration 后复原', async () => {
        const onChange = vi.fn<(copied: boolean) => void>();
        const timer = new CopiedTimer(onChange);
        timer.mount();

        expect(await timer.copy('a', 1000)).toBe(true);
        expect(onChange).toHaveBeenLastCalledWith(true);

        vi.advanceTimersByTime(1000);
        expect(onChange).toHaveBeenLastCalledWith(false);
    });

    it('复制失败不置 true', async () => {
        vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn<(text: string) => Promise<void>>(() => Promise.reject(new Error('denied'))) } });
        const onChange = vi.fn<(copied: boolean) => void>();
        const timer = new CopiedTimer(onChange);
        timer.mount();

        expect(await timer.copy('a', 1000)).toBe(false);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('卸载后完成的复制不置 true', async () => {
        const onChange = vi.fn<(copied: boolean) => void>();
        const timer = new CopiedTimer(onChange);
        timer.mount();

        const pending = timer.copy('a', 1000);
        timer.unmount();
        await pending;
        expect(onChange).not.toHaveBeenCalled();
    });
});
