import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import FloatButtonFixture from './float-button-fixture.svelte';
import GroupFixture from './float-button-group-fixture.svelte';

describe('Svelte FloatButton 服务端首帧', () => {
    it('首帧带类名、图标与 badge 计数', () => {
        const store = createStore({ props: { 'aria-label': 'Edit', badge: { count: 3 }, disabled: true }, icon: true });
        const { body } = render(FloatButtonFixture, { props: { store } });
        expect(body).toContain('<button');
        expect(body).toContain('semi-floatButton-round');
        expect(body).toContain('semi-floatButton-disabled');
        expect(body).toContain('data-testid="icon"');
        expect(body).toContain('semi-badge-count');
        expect(body).toContain('aria-disabled="true"');
    });

    it('带 href 的首帧渲染链接', () => {
        const store = createStore({ props: { 'aria-label': 'Semi', href: 'https://semi.design' } });
        const { body } = render(FloatButtonFixture, { props: { store } });
        expect(body).toMatch(/<a[^>]*href="https:\/\/semi\.design"/);
    });

    it('分组首帧带每一项', () => {
        const store = createStore({ props: { items: [{ content: 'Editor', value: 'editor' }] }, icon: true });
        const { body } = render(GroupFixture, { props: { store } });
        expect(body).toContain('semi-floatButtonGroup');
        expect(body).toContain('role="group"');
        expect(body).toContain('data-value="editor"');
        expect(body).toContain('Editor');
    });
});
