import { afterEach, describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { lockBodyScroll } from '../scroll-lock';

describe('lockBodyScroll', () => {
    afterEach(() => {
        document.body.removeAttribute('style');
    });

    it('只有最后一个锁释放时才恢复页面滚动', () => {
        // a 15px scrollbar
        const clientWidth = vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(window.innerWidth - 15);
        onTestFinished(() => clientWidth.mockRestore());
        document.body.style.paddingInlineEnd = '4px';
        const releaseFirst = lockBodyScroll();
        const releaseSecond = lockBodyScroll();
        expect(document.body.style.overflow).toBe('hidden');
        // jsdom folds the calc and has no layout, so only check that the padding grew
        expect(document.body.style.paddingInlineEnd).toMatch(/^calc\(\d+px\)$/);
        expect(document.body.style.paddingInlineEnd).not.toBe('calc(4px)');

        releaseFirst();
        releaseFirst();
        expect(document.body.style.overflow).toBe('hidden');

        releaseSecond();
        expect(document.body.style.overflow).toBe('');
        expect(document.body.style.paddingInlineEnd).toBe('4px');
    });

    it('不改动其他人已隐藏的 overflow', () => {
        document.body.style.overflow = 'hidden';
        document.body.style.paddingInlineEnd = '6px';
        const release = lockBodyScroll();
        expect(document.body.style.paddingInlineEnd).toBe('6px');
        release();
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.body.style.paddingInlineEnd).toBe('6px');
    });
});
