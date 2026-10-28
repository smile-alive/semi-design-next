import { afterEach, describe, expect, it } from 'vite-plus/test';
import { lockBodyScroll } from '@fibrae/semi-foundation/utils/scroll-lock';

describe('lockBodyScroll 布局', () => {
    afterEach(() => {
        document.body.removeAttribute('style');
        document.getElementById('scroll-lock-content')?.remove();
    });

    it('body 有外边距且页面有纵向滚动条时，锁定前后内容宽度不变', () => {
        document.body.style.margin = '8px';
        const content = document.createElement('div');
        content.id = 'scroll-lock-content';
        content.style.height = '3000px';
        document.body.append(content);
        const before = content.getBoundingClientRect().width;

        const release = lockBodyScroll();
        expect(content.getBoundingClientRect().width).toBe(before);

        release();
        expect(content.getBoundingClientRect().width).toBe(before);
        expect(document.body.style.overflow).toBe('');
    });
});
