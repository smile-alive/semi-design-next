import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import EmptyFixture from './empty-fixture.svelte';

describe('Svelte Empty 服务端首帧', () => {
    it('首帧带布局、标题、图片与各区域标记', () => {
        const store = createStore({ props: { layout: 'horizontal' as const, title: 'Nothing', image: 'a.png', 'data-x': '1' }, description: true, footer: true });
        const { body } = render(EmptyFixture, { props: { store } });
        expect(body).toContain('semi-empty-horizontal');
        expect(body).toContain('semi-empty-title');
        expect(body).toContain('semi-typography-h4');
        expect(body).toContain('Nothing');
        expect(body).toMatch(/<img[^>]*src="a.png"/);
        expect(body).toContain('x-semi-prop="description"');
        expect(body).toContain('x-semi-prop="children"');
        expect(body).toMatch(/<div[^>]*data-x="1"/);
    });

    it('首帧输出亮色图，深色图在挂载后才切换', () => {
        const store = createStore({ props: {}, image: true, darkImage: true });
        const { body } = render(EmptyFixture, { props: { store } });
        expect(body).toContain('data-testid="light"');
        expect(body).not.toContain('data-testid="dark"');
    });
});
