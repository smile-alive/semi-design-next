import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import RatingFixture from './rating-fixture.svelte';

describe('Svelte Rating 服务端首帧', () => {
    it('首帧带已选星级、radio 名称与 Tab 停靠点', () => {
        const store = createStore({ props: { value: 3, 'aria-label': 'score', id: 'x' } });
        const { body } = render(RatingFixture, { props: { store } });
        expect(body).toContain('role="radiogroup"');
        expect(body).toMatch(/<ul[^>]*aria-label="score"/);
        expect(body).toContain('semi-rating-star-full');
        expect(body).toMatch(/aria-checked="true"[^>]*aria-label="3 stars"|aria-label="3 stars"[^>]*aria-checked="true"/);
        expect(body.match(/role="radio"/g)).toHaveLength(6);
    });

    it('带 tooltips 的首帧不输出气泡', () => {
        const store = createStore({ props: { value: 1, tooltips: ['a', 'b', 'c', 'd', 'e'] } });
        const { body } = render(RatingFixture, { props: { store } });
        expect(body).toContain('role="radiogroup"');
        expect(body).not.toContain('semi-tooltip-wrapper');
    });
});
