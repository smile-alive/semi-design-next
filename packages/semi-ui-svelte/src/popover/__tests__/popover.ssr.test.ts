import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import PopoverFixture from './popover-fixture.svelte';

const store = { accept: true, log: [], shown: true, child: true, focus: false, actions: false, rtl: false, props: { trigger: 'click' as const } };

describe('Svelte Popover 服务端渲染', () => {
    it('首帧输出带 data-popupid 的触发按钮，不输出弹层', () => {
        const { body } = render(PopoverFixture, { props: { store } });
        expect(body).toMatch(/<button[^>]*data-popupid="semi-tooltip-[^"]+"/);
        expect(body).not.toContain('semi-popover-wrapper');
    });

    it('不传 child 时触发器包进 Tooltip 的 span', () => {
        const { body } = render(PopoverFixture, { props: { store: { ...store, child: false } } });
        expect(body).toContain('semi-tooltip-trigger-wrapper');
    });
});
