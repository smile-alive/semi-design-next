import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { NavProps } from '../interface';
import NavChildren from './nav-children.svelte';
import NavFixture from './nav-fixture.svelte';

const items = [
    { itemKey: 'home', text: '首页' },
    { itemKey: 'user', text: '用户', items: [{ itemKey: 'list', text: '用户列表' }] },
    { itemKey: 'job', text: '任务', items: [{ itemKey: 'query', text: '任务查询' }] },
];

function renderItems(props: NavProps) {
    const store = createStore({ props: { items, ...props }, snippets: false, wrap: false });
    return render(NavFixture, { props: { store } }).body;
}

describe('Svelte Navigation 服务端首帧', () => {
    it('首帧带 landmark、项文本、header 与折叠按钮', () => {
        const body = renderItems({ header: { text: 'Semi 运营后台' }, footer: { collapseButton: true } });
        expect(body).toContain('<nav');
        expect(body).toContain('semi-navigation-vertical');
        expect(body).toContain('Semi 运营后台');
        expect(body).toContain('首页');
        expect(body).toContain('semi-navigation-collapse-btn');
    });

    it('默认选中项的祖先在首帧展开，顶层父级标记为选中', () => {
        const body = renderItems({ selectedKeys: ['list'] });
        expect(body).toContain('用户列表');
        expect(body).not.toContain('任务查询');
        expect(body).toMatch(/aria-expanded="true"/);
        expect(body).toContain('semi-navigation-sub-title-selected');
        expect(body).toContain('aria-current="page"');
    });

    it('openKeys 指定的子菜单在首帧展开，其余收起', () => {
        const body = renderItems({ openKeys: ['job'] });
        expect(body).toContain('任务查询');
        expect(body).not.toContain('用户列表');
    });

    it('折叠态首帧不输出内联子列表', () => {
        const body = renderItems({ isCollapsed: true, openKeys: ['user'] });
        expect(body).toContain('semi-navigation-collapsed');
        expect(body).not.toContain('semi-navigation-sub-open');
    });

    it('子项写法首帧输出 header 链接与各项', () => {
        const { body } = render(NavChildren, { props: { props: { openKeys: ['user'] } } });
        expect(body).toContain('semi-navigation-header-link');
        expect(body).toContain('用户列表');
        expect(body).toContain('href="#docs"');
    });
});
