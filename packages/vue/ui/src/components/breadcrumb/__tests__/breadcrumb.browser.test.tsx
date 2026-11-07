/** @jsxImportSource vue */
import { waitFor } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Breadcrumb, { BreadcrumbItem } from '../index';
import type { BreadcrumbProps } from '../interface';

const prefix = 'semi-breadcrumb';
const levels = ['第一层', '第二层', '第三层', '第四层'];

function renderLevels(props: BreadcrumbProps, count: number, href?: string) {
    return render(Breadcrumb, {
        props,
        slots: {
            default: () =>
                levels.slice(0, count).map((text) => (
                    <BreadcrumbItem key={text} href={href}>
                        {{ default: () => text }}
                    </BreadcrumbItem>
                )),
        },
    });
}

describe('Breadcrumb', () => {
    it('moreType + maxItemCount', async () => {
        const view = renderLevels({ maxItemCount: 2, moreType: 'popover' }, 4);
        await userEvent.hover(view.container.querySelector(`.${prefix}-item-more`) as HTMLElement);
        const hidden = await waitFor(() => {
            const items = document.querySelectorAll(`.semi-popover-content > .${prefix}-item-wrap`);
            expect(items).toHaveLength(2);
            return items;
        });
        expect([...hidden].map((item) => item.textContent)).toEqual(['第二层', '第三层']);
    });

    it.each([
        ['the link', {}, `.${prefix}-item-link`],
        ['the more button', { maxItemCount: 2 }, `.${prefix}-item-more`],
    ])('%s 显示主题焦点环', async (_, props, selector) => {
        const view = renderLevels(props, 3, 'https://semi.design/');
        const el = view.container.querySelector(selector) as HTMLElement;
        await tabTo(el);
        expectThemeFocusRing(el);
    });

    it('popover moreType：更多按钮是唯一的停靠点，其弹层图标不是另一个停靠点', async () => {
        const view = renderLevels({ maxItemCount: 2, moreType: 'popover' }, 4, 'https://semi.design/');
        const more = view.container.querySelector(`.${prefix}-item-more`) as HTMLElement;
        await tabTo(more);
        await userEvent.keyboard('{Tab}');
        expect(more.contains(document.activeElement)).toBe(false);
    });
});
