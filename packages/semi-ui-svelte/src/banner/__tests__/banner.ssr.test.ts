import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import BannerFixture from './banner-fixture.svelte';

describe('Svelte Banner 服务端首帧', () => {
    it('首帧带 alert、type 类名、图标名称、标题与关闭按钮', () => {
        const store = createStore({ props: { type: 'danger' as const, title: 'Oops', 'data-x': '1' }, description: true, extra: true });
        const { body } = render(BannerFixture, { props: { store } });
        expect(body).toContain('role="alert"');
        expect(body).toContain('semi-banner-danger');
        expect(body).toContain('semi-banner-full');
        expect(body).toContain(`aria-label="${zh_CN.Banner.danger}"`);
        expect(body).toContain(`aria-label="${zh_CN.Banner.close}"`);
        expect(body).toContain('Oops');
        expect(body).toContain('x-semi-prop="description"');
        expect(body).toContain('x-semi-prop="children"');
        expect(body).toMatch(/<div[^>]*data-x="1"/);
    });
});
