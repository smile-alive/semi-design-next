import { render, waitFor } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import Breadcrumb from '..';

const prefix = `${BASE_CLASS_PREFIX}-breadcrumb`;

describe('Breadcrumb（浏览器）', () => {
    it('moreType + maxItemCount', async () => {
        const { container } = render(() => (
            <Breadcrumb maxItemCount={2} moreType="popover">
                <Breadcrumb.Item>第一层</Breadcrumb.Item>
                <Breadcrumb.Item>第二层</Breadcrumb.Item>
                <Breadcrumb.Item>第三层</Breadcrumb.Item>
                <Breadcrumb.Item>第四层</Breadcrumb.Item>
            </Breadcrumb>
        ));

        await userEvent.hover(container.querySelector(`.${prefix}-item-more`) as Element);
        const hidden = await waitFor(() => {
            const items = document.querySelectorAll(`.${BASE_CLASS_PREFIX}-popover-content > .${prefix}-item-wrap`);
            expect(items).toHaveLength(2);
            return items;
        });
        expect([...hidden].map((item) => item.textContent)).toEqual(['第二层', '第三层']);
    });

    it.each([
        ['the link', {}, `.${prefix}-item-link`],
        ['the more button', { maxItemCount: 2 }, `.${prefix}-item-more`],
    ])('%s 显示主题焦点环', async (_, props, selector) => {
        const { container } = render(() => (
            <Breadcrumb {...props}>
                <Breadcrumb.Item href="https://semi.design/">第一层</Breadcrumb.Item>
                <Breadcrumb.Item href="https://semi.design/">第二层</Breadcrumb.Item>
                <Breadcrumb.Item href="https://semi.design/">第三层</Breadcrumb.Item>
            </Breadcrumb>
        ));
        const el = container.querySelector(selector) as HTMLElement;
        await tabTo(el);
        expectThemeFocusRing(el);
    });

    it('popover moreType：更多按钮是唯一的停靠点，其弹层图标不是另一个停靠点', async () => {
        const { container } = render(() => (
            <Breadcrumb maxItemCount={2} moreType="popover">
                <Breadcrumb.Item href="https://semi.design/">第一层</Breadcrumb.Item>
                <Breadcrumb.Item href="https://semi.design/">第二层</Breadcrumb.Item>
                <Breadcrumb.Item href="https://semi.design/">第三层</Breadcrumb.Item>
                <Breadcrumb.Item href="https://semi.design/">第四层</Breadcrumb.Item>
            </Breadcrumb>
        ));
        const more = container.querySelector(`.${prefix}-item-more`) as HTMLElement;
        await tabTo(more);
        await userEvent.keyboard('{Tab}');
        expect(more.contains(document.activeElement)).toBe(false);
    });
});
