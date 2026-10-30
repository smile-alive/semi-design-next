import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { CardProps } from '../interface';
import CardFixture from './card-fixture.svelte';
import type { Parts } from './fixture-parts';

const properties = ['display', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'color', 'margin-top', 'margin-bottom', 'margin-inline-start', 'margin-inline-end', 'padding-top', 'padding-bottom', 'text-overflow', 'overflow', 'white-space'];

function setup(props: CardProps, parts: Parts, dir: 'ltr' | 'rtl' = 'ltr') {
    const store = createStore({ props, parts });
    // the fixture has one root; the direction and width come from the container
    const container = document.createElement('div');
    container.dir = dir;
    container.style.width = '400px';
    document.body.append(container);
    const view = render(CardFixture, { props: { store }, target: container });
    return { container, view };
}

describe('Svelte Card 标题（浏览器）', () => {
    it('外观与被替换的 h6 一致', () => {
        const { container } = setup({ title: 'title' }, { body: true });
        const title = container.querySelector('.semi-typography-h6') as HTMLElement;
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

describe('Svelte Card 头部（浏览器）', () => {
    it.each(['ltr', 'rtl'] as const)('%s 下 title 在行内起始侧，extra 在行内结束侧', (dir) => {
        const { container } = setup({ title: 'title' }, { body: true, extra: true }, dir);
        const title = container.querySelector('.semi-card-header-wrapper-title')?.getBoundingClientRect();
        const extra = container.querySelector('.semi-card-header-wrapper-extra')?.getBoundingClientRect();
        expect((title?.left ?? 0) < (extra?.left ?? 0)).toBe(dir === 'ltr');
    });

    it.each(['ltr', 'rtl'] as const)('%s 下只有 headerExtraContent 时靠行内结束侧', (dir) => {
        const { container } = setup({}, { body: true, extra: true }, dir);
        const extra = container.querySelector('.semi-card-header-wrapper-extra')?.getBoundingClientRect();
        const header = container.querySelector('.semi-card-header')?.getBoundingClientRect();
        const leftGap = (extra?.left ?? 0) - (header?.left ?? 0);
        const rightGap = (header?.right ?? 0) - (extra?.right ?? 0);
        expect(leftGap > rightGap).toBe(dir === 'ltr');
    });
});

describe('Svelte Card 阴影（浏览器）', () => {
    const shadowOf = (el: Element) => () => getComputedStyle(el).boxShadow;

    it('shadows="always" 时始终显示阴影', () => {
        const { container } = setup({ shadows: 'always' }, { body: true });
        expect(shadowOf(container.querySelector('.semi-card') as Element)()).not.toBe('none');
    });

    it('shadows="hover" 时仅悬停时显示阴影', async () => {
        const { container } = setup({ shadows: 'hover' }, { body: true });
        const card = container.querySelector('.semi-card') as Element;
        expect(shadowOf(card)()).toBe('none');
        await userEvent.hover(card);
        // box-shadow transitions in, so poll until it has started
        await expect.poll(shadowOf(card)).not.toBe('none');
    });
});
