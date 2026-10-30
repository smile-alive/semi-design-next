import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import Carousel from '../carousel.svelte';
import type { CarouselSlideContext } from '../interface';

const slide = createRawSnippet<[CarouselSlideContext<unknown>]>((context) => ({ render: () => `<h3>index${context().item}</h3>` }));

// the server build has no DOM, so the slide wrappers are read from the markup
const slideTags = (body: string) => body.match(/<div [^>]*id="[^"]*-slide-\d"[^>]*>/g) ?? [];

describe('Svelte Carousel 服务端渲染', () => {
    it('首帧带幻灯片、当前项、指示点与箭头', () => {
        const { body } = render(Carousel, { props: { items: [0, 1, 2], slide, autoPlay: false } });
        const tags = slideTags(body);
        expect(tags).toHaveLength(3);
        expect(tags.map((tag) => tag.includes('semi-carousel-content-item-active'))).toEqual([true, false, false]);
        expect(tags.map((tag) => tag.includes(' inert=""'))).toEqual([false, true, true]);
        expect(body.match(/role="tab"/g)).toHaveLength(3);
        expect(body).toContain('id="s1-tab-0"');
        expect(body).toContain('aria-controls="s1-slide-0"');
        expect(body).toContain(`aria-label="${zh_CN.Carousel.next}"`);
        expect(body).toContain('<h3>index2</h3>');
    });

    it('activeIndex 决定首帧的当前项', () => {
        const { body } = render(Carousel, { props: { items: [0, 1, 2], slide, autoPlay: false, activeIndex: 2 } });
        expect(slideTags(body).map((tag) => tag.includes('semi-carousel-content-item-active'))).toEqual([false, false, true]);
    });
});
