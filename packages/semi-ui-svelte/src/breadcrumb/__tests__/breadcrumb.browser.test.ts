import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { BreadcrumbProps } from '../interface';
import BreadcrumbFixture from './breadcrumb-fixture.svelte';

const prefix = 'semi-breadcrumb';
const levels = ['第一层', '第二层', '第三层', '第四层'];

function renderLevels(props: BreadcrumbProps, count: number, href?: string) {
    const store = createStore<{ props: BreadcrumbProps }>({ props: { ...props, routes: levels.slice(0, count).map((name) => ({ name, href })) } });
    return render(BreadcrumbFixture, { props: { store } });
}

describe('Svelte Breadcrumb 浏览器', () => {
    it('moreType 为 popover 时气泡显示被折叠的项', async () => {
        const view = renderLevels({ maxItemCount: 2, moreType: 'popover' }, 4);
        await userEvent.hover(view.container.querySelector(`.${prefix}-item-more`) as HTMLElement);
        const content = await view.findByText('第二层', { selector: '.semi-popover-content *' }).then(() => document.querySelector('.semi-popover-content') as HTMLElement);
        const hidden = content.querySelectorAll(`:scope > .${prefix}-item-wrap`);
        expect([...hidden].map((item) => item.textContent)).toEqual(['第二层', '第三层']);
    });

    it.each([
        ['链接', {}, `.${prefix}-item-link`],
        ['more 按钮', { maxItemCount: 2 }, `.${prefix}-item-more`],
    ])('%s 显示主题焦点环', async (_, props, selector) => {
        const view = renderLevels(props, 3, 'https://semi.design/');
        const el = view.container.querySelector(selector) as HTMLElement;
        await tabTo(el);
        expectThemeFocusRing(el);
    });

    it('popover moreType：more 按钮是唯一的停靠点，其弹层图标不是另一个停靠点', async () => {
        const view = renderLevels({ maxItemCount: 2, moreType: 'popover' }, 4, 'https://semi.design/');
        const more = view.container.querySelector(`.${prefix}-item-more`) as HTMLElement;
        await tabTo(more);
        await userEvent.keyboard('{Tab}');
        expect(more.contains(document.activeElement)).toBe(false);
    });

    it('链接内的截断文字不是额外的停靠点', async () => {
        const view = renderLevels({}, 2, 'https://semi.design/');
        const link = view.container.querySelector(`.${prefix}-item-link`) as HTMLElement;
        await tabTo(link);
        await userEvent.keyboard('{Tab}');
        expect(link.contains(document.activeElement)).toBe(false);
    });
});
