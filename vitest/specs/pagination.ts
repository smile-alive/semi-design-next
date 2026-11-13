import { waitFor, within, type BoundFunctions, type queries } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vite-plus/test';
import { endLeaveAnimations } from '../utils/dom/common';
import { defineSpec, type SpecHandle, type SpecMount, type SpecOptions } from './shared/define-spec';

/** Framework-free Pagination props; each fixture maps the names its framework spells differently */
export interface PaginationSpecProps {
    total?: number;
    pageSize?: number;
    pageSizeOpts?: number[];
    size?: 'small' | 'default';
    /** `undefined` is uncontrolled */
    currentPage?: number;
    defaultCurrentPage?: number;
    showTotal?: boolean;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    hideOnSinglePage?: boolean;
    hoverShowPageSelect?: boolean;
    disabled?: boolean;
    preventPageChangeOnPageSizeChange?: boolean;
    /** Undeclared attributes, spread onto the component */
    attrs?: Record<string, string>;
    onPageChange?: (currentPage: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    onChange?: (currentPage: number, pageSize: number) => void;
}

export function paginationSpec(mount: SpecMount<PaginationSpecProps>, options: SpecOptions = {}) {
    defineSpec('Pagination（共享 spec）', options, (test) => {
        let view: BoundFunctions<typeof queries>;
        let handle: SpecHandle<PaginationSpecProps>;

        async function render(props: PaginationSpecProps = {}) {
            handle = await mount({ total: 200, ...props });
            view = within(handle.container);
            return handle;
        }

        // Button names come from the locale, so buttons are told apart by position and visible text:
        // prev and next hold an icon, so they are the first and last button and the only ones without text
        const buttons = () => view.getAllByRole<HTMLButtonElement>('button');
        const prev = () => buttons()[0];
        const next = () => buttons().at(-1)!;
        const pageButtons = () => buttons().filter((button) => button.textContent!.trim() !== '');
        const pageTexts = () => pageButtons().map((button) => button.textContent!.trim());
        const pageButton = (page: number | string) => pageButtons().find((button) => button.textContent!.trim() === String(page))!;
        const activePage = () =>
            pageButtons()
                .find((button) => button.getAttribute('aria-current') === 'page')
                ?.textContent!.trim() ?? null;
        const ellipses = () => pageButtons().filter((button) => button.textContent!.trim() === '...');
        const jumper = () => view.getByRole<HTMLInputElement>('spinbutton');
        const sizeChanger = () => view.queryByRole('combobox');
        const popoverButton = (page: number) => within(document.body).findByText(String(page), { selector: 'button' });

        // The listbox is portalled; a controlled Select reports its change after a leave animation jsdom never ends
        async function chooseSize(size: number) {
            await userEvent.click(view.getByRole('combobox'));
            const option = await within(document.body).findByRole('option', { name: new RegExp(`\\b${size}\\b`) });
            await userEvent.click(option);
            await waitFor(() => {
                endLeaveAnimations();
                expect(document.body.querySelector('[role="listbox"]')).toBeNull();
            });
        }

        async function optionSizes() {
            await userEvent.click(view.getByRole('combobox'));
            const options = await within(document.body).findAllByRole('option');
            return options.map((option) => Number(option.textContent!.match(/\d+/)![0]));
        }

        test('是由原生按钮组成的列表，当前页带 aria-current="page"，其余页码没有', async () => {
            await render({ defaultCurrentPage: 10, showQuickJumper: true, showSizeChanger: true, showTotal: true });
            expect(view.getByRole('list')).toBeInTheDocument();
            expect(view.getAllByRole('listitem').every((item) => item.parentElement === view.getByRole('list'))).toBe(true);
            expect(activePage()).toBe('10');
            expect(pageButtons().filter((button) => button.hasAttribute('aria-current'))).toHaveLength(1);
            expect(pageButton(9)).not.toHaveAttribute('aria-current');
            expect(ellipses()).toHaveLength(2);
            expect(jumper()).toBeInTheDocument();
            expect(sizeChanger()).toBeInTheDocument();
        });

        test('total 与 pageSize 决定页码数量和末页', async () => {
            await render({ total: 30 });
            expect(pageTexts()).toEqual(['1', '2', '3']);
            await handle.update({ total: 70 });
            expect(pageTexts()).toEqual(['1', '2', '3', '4', '5', '6', '7']);
            await handle.update({ total: 200, pageSize: 50 });
            expect(pageTexts()).toEqual(['1', '2', '3', '4']);
            await handle.update({ pageSize: 20 });
            expect(pageTexts()).toEqual(['1', '2', '3', '4', '...', '9', '10']);
        });

        test('页数超过 7 时以当前页为中心截断', async () => {
            await render({ currentPage: 1 });
            expect(pageTexts()).toEqual(['1', '2', '3', '4', '...', '19', '20']);
            await handle.update({ currentPage: 4 });
            expect(pageTexts()).toEqual(['1', '2', '3', '4', '5', '...', '20']);
            await handle.update({ currentPage: 10 });
            expect(pageTexts()).toEqual(['1', '...', '9', '10', '11', '...', '20']);
            await handle.update({ currentPage: 17 });
            expect(pageTexts()).toEqual(['1', '...', '16', '17', '18', '19', '20']);
            await handle.update({ currentPage: 7, total: 70 });
            expect(pageTexts()).toEqual(['1', '2', '3', '4', '5', '6', '7']);
        });

        test('showTotal 显示总页数', async () => {
            await render({ showTotal: true, total: 200 });
            expect(view.getByText(/20/, { selector: 'li' })).toBeInTheDocument();
            await handle.update({ showTotal: false });
            expect(view.queryByText(/20/, { selector: 'li' })).toBeNull();
        });

        test('defaultCurrentPage 指定初始页，非受控时点击页码切换', async () => {
            await render({ defaultCurrentPage: 3 });
            expect(activePage()).toBe('3');
            await userEvent.click(pageButton(4));
            expect(activePage()).toBe('4');
        });

        test('首页禁用上一页，末页禁用下一页，只有一页时两端都禁用', async () => {
            await render({ total: 30 });
            expect([prev(), next()].map((button) => button.disabled)).toEqual([true, false]);
            await handle.update({ currentPage: 3 });
            expect([prev(), next()].map((button) => button.disabled)).toEqual([false, true]);
            await handle.update({ total: 9, currentPage: 1 });
            expect([prev(), next()].map((button) => button.disabled)).toEqual([true, true]);
        });

        test('点击页码时 onPageChange 与 onChange 各调用一次，参数是新页码与当前 pageSize；点击当前页不调用', async () => {
            const onPageChange = vi.fn<NonNullable<PaginationSpecProps['onPageChange']>>();
            const onChange = vi.fn<NonNullable<PaginationSpecProps['onChange']>>();
            await render({ total: 70, onPageChange, onChange });
            await userEvent.click(pageButton(7));
            expect(onPageChange).toHaveBeenCalledExactlyOnceWith(7);
            expect(onChange).toHaveBeenCalledExactlyOnceWith(7, 10);
            expect(activePage()).toBe('7');
            await userEvent.click(pageButton(7));
            expect(onPageChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledTimes(1);
        });

        test('每次点击上一页或下一页时各通知一次，禁用的一端不通知', async () => {
            const onPageChange = vi.fn<NonNullable<PaginationSpecProps['onPageChange']>>();
            const onChange = vi.fn<NonNullable<PaginationSpecProps['onChange']>>();
            await render({ total: 30, onPageChange, onChange });
            await userEvent.click(prev());
            expect(onChange).not.toHaveBeenCalled();
            await userEvent.click(next());
            await userEvent.click(next());
            await userEvent.click(next());
            expect(onPageChange.mock.calls).toEqual([[2], [3]]);
            expect(onChange.mock.calls).toEqual([
                [2, 10],
                [3, 10],
            ]);
            expect(next()).toBeDisabled();
            await userEvent.click(prev());
            expect(onChange).toHaveBeenLastCalledWith(2, 10);
            expect(activePage()).toBe('2');
        });

        test('受控：点击只通知，当前页由 currentPage 决定，更新后跟随', async () => {
            const onChange = vi.fn<NonNullable<PaginationSpecProps['onChange']>>();
            await render({ currentPage: 3, onChange });
            await userEvent.click(pageButton(20));
            expect(onChange).toHaveBeenCalledExactlyOnceWith(20, 10);
            expect(activePage()).toBe('3');
            await userEvent.click(next());
            expect(onChange).toHaveBeenLastCalledWith(4, 10);
            expect(activePage()).toBe('3');
            await handle.update({ currentPage: 4 });
            expect(activePage()).toBe('4');
        });

        test('受控的 currentPage 超出末页时保持不变，没有页码高亮', async () => {
            await render({ currentPage: 10 });
            await handle.update({ total: 50 });
            expect(activePage()).toBeNull();
            expect(pageTexts()).toEqual(['1', '2', '3', '4', '5']);
            expect(prev()).toBeEnabled();
            expect(next()).toBeEnabled();
            await handle.update({ total: 300 });
            expect(activePage()).toBe('10');
        });

        test('悬停省略号时列出隐藏页码，点击后跳转到对应页', async () => {
            const onChange = vi.fn<NonNullable<PaginationSpecProps['onChange']>>();
            await render({ defaultCurrentPage: 10, onChange });
            const [left, right] = ellipses();
            await userEvent.hover(left);
            await popoverButton(2);
            expect(within(document.body).getByText('8', { selector: 'button' })).toBeInTheDocument();
            await userEvent.unhover(left);
            await userEvent.hover(right);
            await userEvent.click(await popoverButton(12));
            expect(onChange).toHaveBeenCalledExactlyOnceWith(12, 10);
            expect(activePage()).toBe('12');
        });

        test('键盘用 Enter 翻页后，页码按钮保持原节点与焦点', async () => {
            await render({ defaultCurrentPage: 10 });
            const target = pageButton(11);
            target.focus();
            await userEvent.keyboard('{Enter}');
            expect(activePage()).toBe('11');
            expect(pageButton(11)).toBe(target);
            expect(target).toHaveFocus();
        });

        test('showSizeChanger 显示每页条数选择器，pageSizeOpts 决定选项，缺少的 pageSize 按顺序插入', async () => {
            await render({ pageSizeOpts: [10, 20, 30], showSizeChanger: true });
            expect(await optionSizes()).toEqual([10, 20, 30]);
        });

        test('pageSize 不在 pageSizeOpts 中时按顺序插入选项，比所有选项都大时排在最后', async () => {
            await render({ pageSize: 30, pageSizeOpts: [10, 20, 40], showSizeChanger: true });
            expect(await optionSizes()).toEqual([10, 20, 30, 40]);
            handle.unmount();
            await render({ pageSize: 200, showSizeChanger: true, total: 2000 });
            expect(await optionSizes()).toEqual([10, 20, 40, 100, 200]);
        });

        test('切换 pageSize 时保持第一条记录所在的页：先通知 pageSize，再通知页码', async () => {
            const onPageChange = vi.fn<NonNullable<PaginationSpecProps['onPageChange']>>();
            const onPageSizeChange = vi.fn<NonNullable<PaginationSpecProps['onPageSizeChange']>>();
            const onChange = vi.fn<NonNullable<PaginationSpecProps['onChange']>>();
            const order: string[] = [];
            onPageSizeChange.mockImplementation(() => order.push('pageSize'));
            onPageChange.mockImplementation(() => order.push('page'));
            await render({ defaultCurrentPage: 5, showSizeChanger: true, onPageChange, onPageSizeChange, onChange });
            await chooseSize(20);
            expect(onPageSizeChange.mock.calls).toEqual([[20]]);
            expect(onPageChange.mock.calls).toEqual([[3]]);
            expect(onChange.mock.calls).toEqual([[3, 20]]);
            expect(order).toEqual(['pageSize', 'page']);
            expect(activePage()).toBe('3');
            expect(pageTexts()).toEqual(['1', '2', '3', '4', '...', '9', '10']);
        });

        test('切换 pageSize 时，受控的 currentPage 不变，只发出通知', async () => {
            const onPageChange = vi.fn<NonNullable<PaginationSpecProps['onPageChange']>>();
            const onChange = vi.fn<NonNullable<PaginationSpecProps['onChange']>>();
            await render({ currentPage: 5, showSizeChanger: true, onPageChange, onChange });
            await chooseSize(20);
            expect(onChange.mock.calls).toEqual([[3, 20]]);
            expect(onPageChange.mock.calls).toEqual([[3]]);
            expect(activePage()).toBe('5');
        });

        test('设置 preventPageChangeOnPageSizeChange 后，切换 pageSize 不改变当前页也不通知页码', async () => {
            const onPageChange = vi.fn<NonNullable<PaginationSpecProps['onPageChange']>>();
            const onChange = vi.fn<NonNullable<PaginationSpecProps['onChange']>>();
            await render({ defaultCurrentPage: 5, preventPageChangeOnPageSizeChange: true, showSizeChanger: true, onPageChange, onChange });
            await chooseSize(20);
            expect(onPageChange).not.toHaveBeenCalled();
            expect(onChange.mock.calls).toEqual([[5, 20]]);
            expect(activePage()).toBe('5');
        });

        test('total 变化时保留用户在切换器里选的 pageSize，pageSize 属性变化时以属性为准', async () => {
            await render({ pageSize: 10, showSizeChanger: true });
            await chooseSize(20);
            expect(pageTexts().at(-1)).toBe('10');
            await handle.update({ total: 300 });
            expect(pageTexts().at(-1)).toBe('15');
            await handle.update({ pageSize: 50 });
            expect(pageTexts().at(-1)).toBe('6');
        });

        test('showQuickJumper：输入页码后按 Enter 跳转并清空输入框，输入当前页不通知', async () => {
            const onChange = vi.fn<NonNullable<PaginationSpecProps['onChange']>>();
            await render({ showQuickJumper: true, onChange });
            await userEvent.type(jumper(), '7{Enter}');
            expect(onChange.mock.calls).toEqual([[7, 10]]);
            expect(activePage()).toBe('7');
            expect(jumper()).toHaveValue('');
            await userEvent.type(jumper(), '7{Enter}');
            expect(onChange).toHaveBeenCalledTimes(1);
        });

        test('showQuickJumper：输入页码后失焦跳转，超出范围时取边界', async () => {
            const onChange = vi.fn<NonNullable<PaginationSpecProps['onChange']>>();
            await render({ showQuickJumper: true, onChange });
            await userEvent.type(jumper(), '5{Tab}');
            expect(onChange).toHaveBeenLastCalledWith(5, 10);
            expect(activePage()).toBe('5');
            await userEvent.type(jumper(), '21{Tab}');
            expect(activePage()).toBe('20');
            await userEvent.type(jumper(), '-1{Enter}');
            expect(activePage()).toBe('1');
            expect(jumper()).toHaveValue('');
        });

        test('showQuickJumper：小数页码向下取整', async () => {
            const onChange = vi.fn<NonNullable<PaginationSpecProps['onChange']>>();
            await render({ showQuickJumper: true, onChange });
            await userEvent.type(jumper(), '2.5{Enter}');
            expect(onChange.mock.calls).toEqual([[2, 10]]);
            await userEvent.type(jumper(), '3.9{Tab}');
            expect(onChange).toHaveBeenLastCalledWith(3, 10);
        });

        test('showQuickJumper：输入框里没有有效数字时忽略 Enter', async () => {
            const onChange = vi.fn<NonNullable<PaginationSpecProps['onChange']>>();
            await render({ defaultCurrentPage: 20, showQuickJumper: true, onChange });
            await userEvent.type(jumper(), '{Enter}');
            expect(activePage()).toBe('20');
            expect(onChange).not.toHaveBeenCalled();
        });

        test('showQuickJumper：只有一页、没有页或 disabled 时输入框不可用', async () => {
            await render({ showQuickJumper: true, total: 10 });
            expect(jumper()).toBeDisabled();
            await handle.update({ total: 0 });
            expect(jumper()).toBeDisabled();
            await handle.update({ total: 200, disabled: true });
            expect(jumper()).toBeDisabled();
            await handle.update({ disabled: false });
            expect(jumper()).toBeEnabled();
        });

        test('hideOnSinglePage 在只有一页时隐藏整个分页，多于一页时显示', async () => {
            await render({ hideOnSinglePage: true, total: 10 });
            expect(view.queryByRole('list')).toBeNull();
            await handle.update({ total: 11 });
            expect(view.getByRole('list')).toBeInTheDocument();
        });

        test('showSizeChanger 与 hideOnSinglePage 同用时，只有一页也保持显示', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            try {
                await render({ hideOnSinglePage: true, showSizeChanger: true, total: 10 });
                expect(view.getByRole('list')).toBeInTheDocument();
                expect(sizeChanger()).toBeInTheDocument();
            } finally {
                warn.mockRestore();
            }
        });

        test('disabled 时所有页码与翻页按钮、每页条数选择器都不可用，不通知，省略号不弹出隐藏页码', async () => {
            const onChange = vi.fn<NonNullable<PaginationSpecProps['onChange']>>();
            await render({ defaultCurrentPage: 5, disabled: true, showSizeChanger: true, onChange });
            expect(buttons().every((button) => button.disabled)).toBe(true);
            expect(activePage()).toBe('5');
            await userEvent.click(pageButton(6));
            await userEvent.click(next());
            expect(onChange).not.toHaveBeenCalled();
            expect(sizeChanger()).toHaveAttribute('aria-disabled', 'true');
            await userEvent.hover(ellipses()[0]);
            expect(within(document.body).queryByText('2', { selector: 'button' })).toBeNull();
        });

        test('size="small" 显示当前页/总页数，用上一页与下一页翻页，不显示每页条数选择器', async () => {
            const onChange = vi.fn<NonNullable<PaginationSpecProps['onChange']>>();
            await render({ showQuickJumper: true, showSizeChanger: true, size: 'small', total: 90, onChange });
            expect(view.getByText(/^1\/9\s*$/)).toBeInTheDocument();
            expect(pageButtons()).toHaveLength(0);
            expect(sizeChanger()).toBeNull();
            expect(jumper()).toBeInTheDocument();
            await userEvent.click(next());
            expect(onChange).toHaveBeenCalledExactlyOnceWith(2, 10);
            expect(view.getByText(/^2\/9\s*$/)).toBeInTheDocument();
        });

        test('size="small" 设置 hoverShowPageSelect 后悬停计数时列出所有页码，点击后跳转', async () => {
            const onChange = vi.fn<NonNullable<PaginationSpecProps['onChange']>>();
            await render({ hoverShowPageSelect: true, size: 'small', total: 90, onChange });
            await userEvent.hover(view.getByText(/^1\/9\s*$/));
            await userEvent.click(await popoverButton(3));
            expect(onChange).toHaveBeenCalledExactlyOnceWith(3, 10);
            expect(view.getByText(/^3\/9\s*$/)).toBeInTheDocument();
        });

        test('size="small" 只有一页时隐藏，showSizeChanger 在 small 下不生效也不警告', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            try {
                await render({ hideOnSinglePage: true, showSizeChanger: true, size: 'small', total: 5 });
                expect(view.queryByRole('list')).toBeNull();
                expect(warn).not.toHaveBeenCalled();
            } finally {
                warn.mockRestore();
            }
        });

        test('根是带名称的 nav，未声明的属性落在它上面，两种尺寸一致', async () => {
            await render({ attrs: { 'aria-label': 'Pages', 'data-testid': 'pager' } });
            expect(view.getByRole('navigation')).toHaveAttribute('data-testid', 'pager');
            expect(view.getByRole('navigation')).toHaveAccessibleName('Pages');
            expect(view.getByRole('navigation')).toContainElement(view.getByRole('list'));
            await handle.update({ size: 'small' });
            expect(view.getByRole('navigation')).toHaveAttribute('data-testid', 'pager');
            expect(view.getByRole('navigation')).toHaveAccessibleName('Pages');
        });

        test('nav 的默认名称来自语言包', async () => {
            await render();
            expect(view.getByRole('navigation', { name: '分页' })).toBeTruthy();
        });
    });
}
