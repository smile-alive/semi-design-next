import { render } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { Tag } from '@fibrae/semi-ui-react';

describe('基础样式', () => {
    it('无论宿主使用何种 box-sizing，Semi 元素都是 border-box，宿主元素保持不变', () => {
        const { container } = render(
            <div className="host">
                <Tag>tag</Tag>
            </div>
        );
        const tag = container.querySelector('.semi-tag');
        expect(getComputedStyle(tag).boxSizing).toBe('border-box');
        expect(getComputedStyle(tag, '::before').boxSizing).toBe('border-box');
        expect(getComputedStyle(container.querySelector('.host')).boxSizing).toBe('content-box');
    });

    it('无论是否悬停，Semi 元素都使用主题滑块的细滚动条，宿主元素保留浏览器滚动条', async () => {
        const { container } = render(
            <div className="host">
                <div className="semi-scroll" style={{ height: 40, overflow: 'auto' }}>
                    <div style={{ height: 200 }} />
                </div>
            </div>
        );
        const scroller = container.querySelector('.semi-scroll');
        const host = container.querySelector('.host');
        const color = () => getComputedStyle(scroller).scrollbarColor;
        expect(getComputedStyle(scroller).scrollbarWidth).toBe('thin');
        expect(color()).toMatch(/ rgba\(0, 0, 0, 0\)$/);
        expect(color()).not.toMatch(/^rgba\(0, 0, 0, 0\)/);
        const resting = color();
        await userEvent.hover(scroller);
        expect(color()).toBe(resting);
        expect(getComputedStyle(host).scrollbarWidth).toBe('auto');
        expect(getComputedStyle(host).scrollbarColor).toBe('auto');
    });
});
