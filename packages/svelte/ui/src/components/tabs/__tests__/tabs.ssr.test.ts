import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import TabsFixture, { type FixtureStore } from './tabs-fixture.svelte';

const panes = [
    { itemKey: 'a', tab: 'A', content: 'content a' },
    { itemKey: 'b', tab: 'B', content: 'content b' },
    { itemKey: 'c', tab: 'C', content: 'content c', disabled: true },
];

function html(store: Partial<FixtureStore> = {}) {
    return render(TabsFixture, { props: { store: { props: {}, panes, ...store } } }).body;
}

const selectedLabel = (body: string) =>
    /<div[^>]*aria-selected="true"[^>]*role="tab"[^>]*>(.*?)<\/div>/
        .exec(body)?.[1]
        .replace(/<!--.*?-->/g, '')
        .trim();

describe('Svelte Tabs 服务端首帧', () => {
    it('首帧带标签、选中状态和全部面板', () => {
        const body = html();
        expect(body).toContain('semi-tabs-bar-line');
        expect(body.match(/role="tab"/g)).toHaveLength(3);
        expect(selectedLabel(body)).toBe('A');
        expect(body.match(/role="tabpanel"/g)).toHaveLength(3);
        for (const { content } of panes) {
            expect(body).toContain(content);
        }
        expect(body).toContain('aria-disabled="true"');
    });

    it('选中标签与面板互相引用，id 在首帧即稳定，不含 undefined', () => {
        const body = html();
        const ids = [...body.matchAll(/<div[^>]*role="tab"[^>]*>/g)].map((match) => match[0]);
        expect(ids).toHaveLength(3);
        const controls = /aria-controls="([^"]+)"/.exec(ids[0])?.[1];
        expect(controls).toBeTruthy();
        expect(body).toContain(`id="${controls}"`);
        expect(body).not.toContain('undefined');
        expect(ids[0]).toContain('tabindex="0"');
        expect(ids[1]).toContain('tabindex="-1"');
    });

    it('activeKey 与 tabPosition 决定首帧的类名与 tabindex', () => {
        const body = html({ props: { activeKey: 'b', tabPosition: 'left', type: 'card' } });
        expect(body).toContain('semi-tabs-left');
        expect(body).toContain('semi-tabs-bar-card');
        expect(body).toContain('aria-orientation="vertical"');
        expect(selectedLabel(body)).toBe('B');
    });

    it('keepDOM=false 只渲染所选面板，lazyRender 不渲染未激活的面板内容', () => {
        const kept = html({ props: { keepDOM: false } });
        expect(kept.match(/role="tabpanel"/g)).toHaveLength(1);
        expect(kept).toContain('content a');
        expect(kept).not.toContain('content b');

        const lazy = html({ props: { lazyRender: true } });
        expect(lazy.match(/role="tabpanel"/g)).toHaveLength(3);
        expect(lazy).toContain('content a');
        expect(lazy).not.toContain('content b');
    });

    it('more 把末尾的标签放进「更多」菜单，首帧保留它们的标签 id', () => {
        const body = html({ props: { more: 1 } });
        expect(body.match(/role="tab"/g)).toHaveLength(2);
        expect(body).toContain('semi-tabs-bar-more-trigger');
        expect(body).toMatch(/<span (?=[^>]*\bhidden="")[^>]*id="semi-tabs-[^"]+-tab-c"[^>]*>(?:<!--.*?-->)*C/);
    });

    it('collapsible 首帧渲染 scroll 模式的 tablist 与两个箭头', () => {
        const body = html({ props: { collapsible: true } });
        expect(body).toContain('semi-tabs-bar-collapse');
        expect(body).toContain('semi-overflow-list-scroll-wrapper');
        expect(body).toContain('role="tablist"');
        expect(body.match(/role="tab"/g)).toHaveLength(3);
        expect(body).toContain('semi-tabs-bar-arrow-start');
        expect(body).toContain('semi-tabs-bar-arrow-end');
    });

    it('tabList 为空时首帧不输出 tab，也不引用不存在的标签', () => {
        const body = html({ panes: [] });
        expect(body).not.toContain('role="tab"');
        expect(body).not.toContain('aria-labelledby');
    });
});
