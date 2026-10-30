import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import CardFixture from './card-fixture.svelte';

describe('Svelte Card 服务端首帧', () => {
    it('首帧带头部、封面、正文、操作与页脚', () => {
        const store = createStore({ props: { title: 'Card title', loading: false }, parts: { body: true, extra: true, cover: true, footer: true, actions: 2 } });
        const { body } = render(CardFixture, { props: { store } });
        expect(body).toContain('semi-card-header-wrapper-extra');
        expect(body).toContain('Card title');
        expect(body).toContain('semi-card-cover');
        expect(body).toContain('<p>body</p>');
        expect(body).toContain('action 1');
        expect(body).toContain('semi-card-footer');
        expect(body).toContain('aria-busy="false"');
    });

    it('loading 时首帧输出骨架屏而不是正文', () => {
        const store = createStore({ props: { loading: true }, parts: { body: true } });
        const { body } = render(CardFixture, { props: { store } });
        expect(body).toContain('semi-skeleton');
        expect(body).not.toContain('<p>body</p>');
    });
});
