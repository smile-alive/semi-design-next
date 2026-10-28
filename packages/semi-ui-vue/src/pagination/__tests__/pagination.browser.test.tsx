/** @jsxImportSource vue */
import { screen, waitFor } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Pagination from '../index';
import type { PaginationProps } from '../interface';

const prefix = 'semi-page';

describe('Pagination（浏览器）', () => {
    it('页大小下拉面板禁止选中文字', async () => {
        render(Pagination, { props: { showSizeChanger: true, total: 200 } });
        await userEvent.click(screen.getByRole('combobox'));
        const dropdown = await waitFor(() => {
            const el = document.querySelector(`.${prefix}-select-dropdown`);
            expect(el).not.toBeNull();
            return el as Element;
        });
        expect(getComputedStyle(dropdown).userSelect).toBe('none');
    });

    it.each<[string, PaginationProps, string]>([
        ['the more trigger', { total: 200, currentPage: 10 }, `.${prefix}-item[aria-label="更多"]`],
        ['the hover page select', { total: 200, size: 'small', hoverShowPageSelect: true }, `.${prefix}-item-small`],
    ])('%s 显示主题焦点环', async (_, props, selector) => {
        // the theme is not loaded here: give the focus token a value so the ring color is not invalid at computed time
        const { container } = render({
            render: () => (
                <div style={{ '--semi-color-primary-light-active': 'rgb(1, 2, 3)' }}>
                    <Pagination {...props} />
                </div>
            ),
        });
        const el = container.querySelector(selector) as HTMLElement;
        await tabTo(el);
        expectThemeFocusRing(el);
    });

    it.each<[string, PaginationProps, (c: Element) => Element, number]>([
        ['the omitted pages', { currentPage: 10 }, (c) => c.querySelectorAll('[aria-label="更多"]')[1], 12],
        ['the small page select', { currentPage: 5, size: 'small', hoverShowPageSelect: true }, (c) => c.querySelector(`.${prefix}-item-small`) as Element, 1],
    ])('通过键盘打开 %s 并跳转到其中一页', async (_, props, getTrigger, firstPage) => {
        const view = render(Pagination, { props: { total: 200, ...props } });
        await tabTo(getTrigger(view.container) as HTMLElement);
        const first = await screen.findByRole('button', { name: `第 ${firstPage} 页` });
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(first).toHaveFocus());
        await userEvent.keyboard('{Enter}');
        expect(view.emitted('change')).toEqual([[firstPage, 10]]);
    });

    // the list is virtualized: focusing a page near the bottom scrolls it, and the scroll event, handled in a later
    // frame, renders the pages after it
    it('用 Tab 可以到达虚拟列表可见部分之下的页码', async () => {
        render(Pagination, { props: { currentPage: 10, total: 200 } });
        await tabTo(screen.getAllByRole('button', { name: '更多' })[1]);
        await screen.findByRole('button', { name: '第 12 页' });
        await userEvent.keyboard('{ArrowDown}');
        for (let page = 13; page <= 19; page++) {
            await screen.findByRole('button', { name: `第 ${page} 页` });
            await userEvent.keyboard('{Tab}');
            await waitFor(() => expect(screen.getByRole('button', { name: `第 ${page} 页` })).toHaveFocus());
        }
    });

    it('滚动虚拟列表后渲染靠后的页码并移除靠前的页码', async () => {
        render(Pagination, { props: { currentPage: 10, total: 2000 } });
        await tabTo(screen.getAllByRole('button', { name: '更多' })[1]);
        const first = await screen.findByRole('button', { name: '第 12 页' });
        const outer = first.parentElement?.parentElement as HTMLElement;

        outer.scrollTop = 32 * 100;

        await screen.findByRole('button', { name: '第 112 页' });
        await waitFor(() => expect(screen.queryByRole('button', { name: '第 12 页' })).toBeNull());
    });

    it('容器窄于整行时总页数文字保持单行原宽，不按字换行', () => {
        const props = { total: 100, showTotal: true, showSizeChanger: true, showQuickJumper: true };
        const { container } = render({
            render: () => (
                <>
                    <div style={{ width: '900px' }}>
                        <Pagination {...props} />
                    </div>
                    <div style={{ width: '300px' }}>
                        <Pagination {...props} />
                    </div>
                </>
            ),
        });
        const [roomy, narrow] = [...container.querySelectorAll(`.${prefix}-total`)].map((el) => {
            const { width, height } = el.getBoundingClientRect();
            return { width, height };
        });
        expect(narrow).toEqual(roomy);
    });

    it('容器窄于整行时上一页、下一页文字按钮保持单行原宽，不按字换行', () => {
        const slots = { prevText: () => '上一页', nextText: () => '下一页' };
        const { container } = render({
            render: () => (
                <>
                    <div style={{ width: '900px' }}>
                        <Pagination total={100}>{slots}</Pagination>
                    </div>
                    <div style={{ width: '200px' }}>
                        <Pagination total={100}>{slots}</Pagination>
                    </div>
                </>
            ),
        });
        const measure = (el: Element) => {
            const { width, height } = el.getBoundingClientRect();
            return { width, height };
        };
        const [roomy, narrow] = [...container.querySelectorAll(`.${prefix}-prev`)].map(measure);
        const [roomyNext, narrowNext] = [...container.querySelectorAll(`.${prefix}-next`)].map(measure);
        expect([narrow, narrowNext]).toEqual([roomy, roomyNext]);
    });
});
