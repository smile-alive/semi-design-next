import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import ScrollItemModes from './scroll-item-modes.svelte';
import ScrollListFixture from './scroll-list-fixture.svelte';

describe('Svelte ScrollList 服务端首帧', () => {
    it('首帧带 header、footer、body 高度与内容', () => {
        const { body } = render(ScrollListFixture, { props: { variant: 'snippets' } });
        expect(body).toContain('semi-scrolllist-header-title');
        expect(body).toContain('x-semi-prop="header"');
        expect(body).toContain('title');
        expect(body).toContain('semi-scrolllist-footer');
        expect(body).toContain('height: 200px');
        expect(body).toContain('child');
    });

    it('ScrollItem 首帧渲染 listbox、选项与选中项', () => {
        const store = { index: 1, accept: true, log: [] };
        const { body } = render(ScrollItemModes, { props: { mode: 'one-way', store } });
        expect(body).toContain('role="listbox"');
        expect(body).toContain('aria-label="letters"');
        expect(body.match(/role="option"/g)).toHaveLength(3);
        expect(body).toMatch(/aria-selected="true"[^>]*>\s*b\s*</);
        expect(body).toMatch(/aria-activedescendant="[^"]+-option-1"/);
    });
});
