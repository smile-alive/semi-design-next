import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import TooltipFixture from './tooltip-fixture.svelte';

const store = { accept: true, log: [], shown: true, child: false, focus: false, arrow: false };

describe('Svelte Tooltip 服务端渲染', () => {
    it('首帧输出带 data-popupid 的触发器，不输出弹层', () => {
        const { body } = render(TooltipFixture, { props: { store } });
        expect(body).toContain('semi-tooltip-trigger-wrapper');
        expect(body).toMatch(/data-popupid="semi-tooltip-[^"]+"/);
        expect(body).not.toContain('semi-tooltip-wrapper');
    });

    it('child snippet 首帧把触发属性展开到使用方元素', () => {
        const { body } = render(TooltipFixture, { props: { store: { ...store, child: true } } });
        expect(body).toMatch(/<button[^>]*data-popupid="semi-tooltip-[^"]+"/);
        expect(body).not.toContain('semi-tooltip-trigger-wrapper');
    });
});
