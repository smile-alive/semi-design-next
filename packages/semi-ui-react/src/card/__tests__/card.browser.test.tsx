import { render } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { Card } from '@fibrae/semi-ui-react';

const properties = ['display', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'color', 'margin-top', 'margin-bottom', 'margin-inline-start', 'margin-inline-end', 'padding-top', 'padding-bottom', 'text-overflow', 'overflow', 'white-space'];

describe('Card 标题（浏览器）', () => {
    it('外观与被替换的 h6 一致', () => {
        const { container } = render(<Card title="title" />);
        const title = container.querySelector('.semi-typography-h6');
        expect(title.tagName).toBe('DIV');
        const heading = document.createElement('h6');
        heading.className = title.className;
        heading.textContent = 'title';
        title.after(heading);
        const actual = getComputedStyle(title);
        const expected = getComputedStyle(heading);
        for (const property of properties) {
            expect([property, actual.getPropertyValue(property)]).toEqual([property, expected.getPropertyValue(property)]);
        }
    });
});

describe('Card 头部（浏览器）', () => {
    it.each(['ltr', 'rtl'] as const)('%s 下 title 在行内起始侧，extra 在行内结束侧', (dir) => {
        const { container } = render(
            <div style={{ width: 400 }} dir={dir}>
                <Card title="title" headerExtraContent="more" />
            </div>
        );
        const title = container.querySelector('.semi-card-header-wrapper-title').getBoundingClientRect();
        const extra = container.querySelector('.semi-card-header-wrapper-extra').getBoundingClientRect();
        expect(title.left < extra.left).toBe(dir === 'ltr');
    });

    it.each(['ltr', 'rtl'] as const)('%s 下只有 headerExtraContent 时靠行内结束侧', (dir) => {
        const { container } = render(
            <div style={{ width: 400 }} dir={dir}>
                <Card headerExtraContent="more" />
            </div>
        );
        const extra = container.querySelector(`.semi-card-header-wrapper-extra`).getBoundingClientRect();
        const header = container.querySelector(`.semi-card-header`).getBoundingClientRect();
        const leftGap = extra.left - header.left;
        const rightGap = header.right - extra.right;
        expect(leftGap > rightGap).toBe(dir === 'ltr');
    });
});

describe('Card 阴影（浏览器）', () => {
    const shadowOf = (el: Element) => () => getComputedStyle(el).boxShadow;

    it('shadows="always" 时始终显示阴影', () => {
        const { container } = render(<Card shadows="always" />);
        expect(shadowOf(container.firstElementChild)()).not.toBe('none');
    });

    it('shadows="hover" 时仅悬停时显示阴影', async () => {
        const { container } = render(<Card shadows="hover" />);
        const card = container.firstElementChild;
        expect(shadowOf(card)()).toBe('none');
        await userEvent.hover(card);
        // box-shadow transitions in, so poll until it has started
        await expect.poll(shadowOf(card)).not.toBe('none');
    });
});
