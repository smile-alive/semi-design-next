import { describe, expect, it, vi } from 'vite-plus/test';
import ImageFoundation from '../image-foundation';
import { loadLazyImages } from '../preview-foundation';

describe('ImageFoundation.canOpen', () => {
    it('单张图加载成功后才能打开', () => {
        expect(ImageFoundation.canOpen(true, 'loading', false)).toBe(false);
        expect(ImageFoundation.canOpen(true, 'error', false)).toBe(false);
        expect(ImageFoundation.canOpen(true, 'success', false)).toBe(true);
    });

    it('分组内的图不等缩略图加载', () => {
        expect(ImageFoundation.canOpen(true, 'loading', true)).toBe(true);
    });

    it('preview 为假值或对象', () => {
        expect(ImageFoundation.canOpen(false, 'success', true)).toBe(false);
        expect(ImageFoundation.canOpen(undefined, 'success', false)).toBe(false);
        expect(ImageFoundation.canOpen({ visible: false }, 'success', false)).toBe(true);
    });
});

describe('ImageFoundation.canPreview', () => {
    it('只有不在分组内且开启 preview 的图自带预览', () => {
        expect(ImageFoundation.canPreview(true, false)).toBe(true);
        expect(ImageFoundation.canPreview({ visible: true }, false)).toBe(true);
        expect(ImageFoundation.canPreview(true, true)).toBe(false);
        expect(ImageFoundation.canPreview(false, false)).toBe(false);
    });
});

describe('loadLazyImages', () => {
    function entry(img: Element, isIntersecting: boolean) {
        return { target: img, isIntersecting } as IntersectionObserverEntry;
    }

    it('进入视口的 img 取得 src 并停止观察', () => {
        const img = document.createElement('img');
        img.dataset.src = 'a.png';
        const unobserve = vi.fn<(target: Element) => void>();
        loadLazyImages([entry(img, true)], { unobserve } as unknown as IntersectionObserver);
        expect(img.getAttribute('src')).toBe('a.png');
        expect(img).not.toHaveAttribute('data-src');
        expect(unobserve).toHaveBeenCalledWith(img);
    });

    it('未进入视口或已加载的 img 不处理', () => {
        const waiting = document.createElement('img');
        waiting.dataset.src = 'b.png';
        const loaded = document.createElement('img');
        loaded.src = 'c.png';
        const unobserve = vi.fn<(target: Element) => void>();
        loadLazyImages([entry(waiting, false), entry(loaded, true)], { unobserve } as unknown as IntersectionObserver);
        expect(waiting).not.toHaveAttribute('src');
        expect(waiting.dataset.src).toBe('b.png');
        expect(unobserve).not.toHaveBeenCalled();
    });
});
