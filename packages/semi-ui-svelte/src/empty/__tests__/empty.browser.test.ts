import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import EmptyFixture from './empty-fixture.svelte';

const properties = ['display', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'color', 'margin-top', 'margin-bottom', 'margin-inline-start', 'margin-inline-end', 'padding-top', 'padding-bottom', 'text-align'];

describe('Svelte Empty 标题（浏览器）', () => {
    it.each([
        ['with an image', 'H4', true],
        ['without an image', 'H6', false],
    ])('外观与被替换的标题一致（%s）', (_, tag, image) => {
        const store = createStore({ props: { title: 'title' }, image });
        const view = render(EmptyFixture, { props: { store } });
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
