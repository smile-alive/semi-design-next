import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import LayoutFixture from './layout-fixture.svelte';

describe('Svelte Layout 服务端首帧', () => {
    it('首帧带各部分的标签与类名', () => {
        const { body } = render(LayoutFixture, { props: { store: createStore({ props: {}, parts: true }) } });
        expect(body).toContain('<section class="semi-layout">');
        expect(body).toMatch(/<header [^>]*class="semi-layout-header"/);
        expect(body).toMatch(/<main [^>]*class="semi-layout-content"/);
        expect(body).toMatch(/<footer [^>]*class="semi-layout-footer"/);
        expect(body).not.toContain('has-sider');
    });

    it('传 hasSider 的首帧带 has-sider；Sider 在服务端不登记（已知限制）', () => {
        const forced = render(LayoutFixture, { props: { store: createStore({ props: { hasSider: true }, sider: 'direct' as const }) } });
        expect(forced.body).toContain('semi-layout-has-sider');
        expect(forced.body).toContain('semi-layout-sider');
        const unforced = render(LayoutFixture, { props: { store: createStore({ props: {}, sider: 'direct' as const }) } });
        expect(unforced.body).not.toContain('semi-layout-has-sider');
    });
});
