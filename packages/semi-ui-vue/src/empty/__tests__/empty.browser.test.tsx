/** @jsxImportSource vue */
import { describe, expect, it } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import Empty from '../index';

const properties = ['display', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'color', 'margin-top', 'margin-bottom', 'margin-inline-start', 'margin-inline-end', 'padding-top', 'padding-bottom', 'text-align'];

describe('Empty 标题（浏览器）', () => {
    it.each([
        ['with an image', 'H4', { image: () => <i /> }],
        ['without an image', 'H6', {}],
    ])('外观与被替换的标题一致（%s）', (_, tag, slots) => {
        const view = render(Empty, { slots: { title: () => 'title', ...slots } });
        const title = view.container.querySelector<HTMLElement>('.semi-empty-title');
        expect(title?.tagName).toBe('DIV');
        const heading = document.createElement(tag);
        heading.className = title?.className ?? '';
        heading.style.cssText = title?.style.cssText ?? '';
        heading.textContent = 'title';
        title?.after(heading);
        const actual = getComputedStyle(title as HTMLElement);
        const expected = getComputedStyle(heading);
        for (const property of properties) {
            expect([property, actual.getPropertyValue(property)]).toEqual([property, expected.getPropertyValue(property)]);
        }
    });
});
