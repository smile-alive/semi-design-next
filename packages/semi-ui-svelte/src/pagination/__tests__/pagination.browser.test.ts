import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { Pagination } from '..';
import type { PaginationProps } from '../interface';

const prefix = 'semi-page';

describe('Svelte Pagination 浏览器', () => {
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
        ['省略号', { total: 200, currentPage: 10 }, `.${prefix}-item[aria-label="更多"]`],
        ['small 的页码选择', { total: 200, size: 'small', hoverShowPageSelect: true }, `.${prefix}-item-small`],
    ])('%s 显示主题焦点环', async (_, props, selector) => {
        // the theme is not loaded here: give the focus token a value so the ring color is not invalid at computed time
        const { container } = render(Pagination, { props: { ...props, style: '--semi-color-primary-light-active: rgb(1, 2, 3)' } });
        const el = container.querySelector(selector) as HTMLElement;
        await tabTo(el);
        expectThemeFocusRing(el);
    });

    it.each<[string, PaginationProps, (c: Element) => Element, number]>([
        ['隐藏页码', { currentPage: 10 }, (c) => c.querySelectorAll('[aria-label="更多"]')[1], 12],
        ['small 的页码选择', { currentPage: 5, size: 'small', hoverShowPageSelect: true }, (c) => c.querySelector(`.${prefix}-item-small`) as Element, 1],
    ])('通过键盘打开%s并跳转到其中一页', async (_, props, getTrigger, firstPage) => {
        const onChange = vi.fn<(page: number, size: number) => void>();
        const view = render(Pagination, { props: { total: 200, onChange, ...props } });
        await tabTo(getTrigger(view.container) as HTMLElement);
        const first = await screen.findByRole('button', { name: `第 ${firstPage} 页` });
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(first).toHaveFocus());
        await userEvent.keyboard('{Enter}');
        expect(onChange.mock.calls).toEqual([[firstPage, 10]]);
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
        const mountIn = (width: string) => {
            const target = document.body.appendChild(document.createElement('div'));
            target.style.width = width;
            render(Pagination, { props, target });
            const { width: measured, height } = (target.querySelector(`.${prefix}-total`) as Element).getBoundingClientRect();
            return { width: measured, height };
        };
        const roomy = mountIn('900px');
        expect(mountIn('300px')).toEqual(roomy);
    });
});
