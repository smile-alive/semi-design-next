import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import BreadcrumbFixture from './breadcrumb-fixture.svelte';

describe('Svelte Breadcrumb 服务端首帧', () => {
    it('首帧带导航标签、全部路由与当前项', () => {
        const { body } = render(BreadcrumbFixture, { props: { store: { props: { routes: ['semi', { name: 'design', href: '/design' }, 'byde'] } } } });
        expect(body).toContain('<nav');
        expect(body).toContain('aria-label="面包屑"');
        for (const name of ['semi', 'design', 'byde']) {
            expect(body).toContain(name);
        }
        expect(body).toContain('href="/design"');
        expect(body).toContain('aria-current="page"');
    });

    it('首帧折叠超出 maxItemCount 的项并输出 more 按钮', () => {
        const { body } = render(BreadcrumbFixture, { props: { store: { props: { routes: ['a', 'b', 'c', 'd', 'e', 'f'] } } } });
        expect(body).toContain('semi-breadcrumb-item-more');
        expect(body).toContain('role="button"');
        expect(body).not.toContain('>b<');
        expect(body).not.toContain('>c<');
    });
});
