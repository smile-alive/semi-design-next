import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import AnchorFixture from './anchor-fixture.svelte';
import { collapsible, nested, type Fixture } from './fixture-data';

describe('Svelte Anchor 服务端首帧', () => {
    it('首帧带导航标签与全部嵌套链接，无激活链接', () => {
        const store = createStore<Fixture>({ props: { links: nested }, sections: [] });
        const { body } = render(AnchorFixture, { props: { store } });
        expect(body).toContain('role="navigation"');
        expect(body).toContain('aria-label=');
        for (const title of ['welcome', 'docs', 'doc1', 'doc2', 'contact']) {
            expect(body).toContain(`title="${title}"`);
        }
        expect(body).not.toContain('semi-anchor-link-title-active');
    });

    it('autoCollapse 的折叠分支首帧不输出', () => {
        const store = createStore<Fixture>({ props: { links: collapsible, autoCollapse: true }, sections: [] });
        const { body } = render(AnchorFixture, { props: { store } });
        expect(body).toContain('1. Semi Design');
        expect(body).not.toContain('1.1 组件');
    });
});
