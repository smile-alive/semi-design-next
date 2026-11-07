/** @jsxImportSource vue */
import type { VNode } from 'vue';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { endLeaveAnimations, getData, getRandomNumber } from '@test/utils/vue';
import type { ColumnProps, TableChangeInfo, TablePaginationProps, TablePaginationSlotProps } from '..';
import Pagination from '../../pagination';
import { P, getActivePage, getBodyRows, getFirstCellText, getPageItems, mountTable, query } from './table-helpers';

const getColumns = (): ColumnProps[] => [
    { title: 'Name', dataIndex: 'name', width: 150 },
    { title: 'Age', dataIndex: 'age', width: 150 },
    { title: 'Address', dataIndex: 'address' },
];
const getPaginationInfo = () => query(`.${P}-pagination-info`).textContent;
const clickPage = (page: number) => userEvent.click(getPageItems().find((item) => item.textContent === `${page}`) as HTMLElement);
const getPageNumbers = () =>
    getPageItems()
        .map((item) => Number(item.textContent))
        .filter((page) => !Number.isNaN(page));

describe('Table 分页', () => {
    it('受控分页在 dataSource 变化时重置', async () => {
        const pagination = { pageSize: 10, currentPage: 2 };
        const table = mountTable({ columns: getColumns(), dataSource: getData(100), pagination });
        await table.update({ props: { dataSource: getData(getRandomNumber(100, 40)) } });
        expect(getActivePage().innerHTML).toBe('2');
    });

    it('非受控分页在 dataSource 变化时重置', async () => {
        const table = mountTable({ columns: getColumns(), dataSource: getData(100) });
        await userEvent.click(getPageItems()[2]);
        expect(getActivePage().innerHTML).toBe('2');
        const newData = getData(getRandomNumber(100, 40));
        await table.update({ props: { dataSource: newData } });
        expect(getActivePage().innerHTML).toBe('1');
        expect(getFirstCellText()).toBe(newData[0].name);
    });

    it('Table 专用的分页属性不传到 Pagination 根元素', () => {
        const warn = vi.spyOn(console, 'warn');
        mountTable({
            columns: getColumns(),
            dataSource: getData(30),
            pagination: { pageSize: 10, formatPageText: () => 'text', position: 'bottom', 'data-testid': 'pager' },
        });
        const pager = screen.getByTestId('pager');
        expect(pager).not.toHaveAttribute('position');
        expect(pager).not.toHaveAttribute('formatpagetext');
        expect(pager).not.toHaveAttribute('format-page-text');
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it('分页变化', async () => {
        const tableData = getData(100);
        const table = mountTable({
            columns: getColumns(),
            dataSource: tableData,
            pagination: { pageSize: 10, currentPage: 2 },
        });
        expect(Math.max(...getPageNumbers())).toBe(10);
        expect(getActivePage()).toHaveTextContent(/^2$/);
        await table.update({ props: { pagination: { pageSize: 5, currentPage: 1 } } });
        expect(Math.max(...getPageNumbers())).toBe(20);
        expect(getActivePage()).toHaveTextContent(/^1$/);
    });

    it('fix #1885：分页跟随 size changer 选择的每页条数，而非给定的 pageSize', async () => {
        mountTable({
            columns: [{ title: '标题', dataIndex: 'name' }],
            dataSource: getData(46),
            pagination: { pageSize: 20, showSizeChanger: true, position: 'top' },
        });
        expect(getPaginationInfo()).toBe('显示第 1 条-第 20 条，共 46 条');
        await userEvent.click(query('.semi-page-switch .semi-select'));
        await userEvent.click((await screen.findAllByRole('option'))[0]);
        endLeaveAnimations();
        await screen.findByText('显示第 1 条-第 10 条，共 46 条');
        await clickPage(4);
        expect(getPaginationInfo()).toBe('显示第 31 条-第 40 条，共 46 条');
        expect(getActivePage()).toHaveTextContent('4');
        await clickPage(5);
        expect(getPaginationInfo()).toBe('显示第 41 条-第 46 条，共 46 条');
        expect(getBodyRows()).toHaveLength(6);
    });

    it('非受控分页在 onChange 中报告页码', async () => {
        const onChange = vi.fn<(info: TableChangeInfo) => void>();
        mountTable({ columns: getColumns(), dataSource: getData(46), onChange });
        await userEvent.click(getPageItems()[2]);
        expect(onChange).toHaveBeenLastCalledWith({
            pagination: expect.objectContaining({ currentPage: 2, pageSize: 10, total: 46 }),
            filters: [],
            sorter: undefined,
            extra: { changeType: 'pagination' },
        });
        expect(getFirstCellText()).toBe('Edward King 10');
    });

    it('受控的 currentPage 渲染给定的行，且以分页的 onChange 为准', async () => {
        const onChange = vi.fn<(info: TableChangeInfo) => void>();
        const onPageChange = vi.fn<NonNullable<TablePaginationProps['onChange']>>();
        mountTable({
            columns: getColumns(),
            dataSource: getData(15),
            pagination: { currentPage: 1, pageSize: 10, total: 30, onChange: onPageChange },
            onChange,
        });
        expect(getBodyRows()).toHaveLength(15);
        await userEvent.click(getPageItems()[2]);
        expect(onPageChange).toHaveBeenCalledWith(2, 10);
        expect(onChange).not.toHaveBeenCalled();
        expect(getActivePage()).toHaveTextContent(/^1$/);
    });

    it('pagination 为 false 时显示所有行，formatPageText 格式化信息', async () => {
        const table = mountTable({ columns: getColumns(), dataSource: getData(46), pagination: false });
        expect(getBodyRows()).toHaveLength(46);
        expect(query(`.${P}-pagination-outer`)).toBeNull();
        await table.update({
            props: {
                pagination: {
                    formatPageText: ({ currentStart, currentEnd, total }: Record<string, number>) => `${currentStart}-${currentEnd}/${total}`,
                },
            },
        });
        expect(query(`.${P}-pagination-info`)).toHaveTextContent('1-10/46');
    });
});

describe('Table 分页 Vue 写法', () => {
    it('#pagination 的参数 v-bind 给 Pagination 后翻页生效，参数中没有 position 与 formatPageText', async () => {
        const slot = vi.fn<(props: TablePaginationSlotProps) => VNode[]>(({ pagination }) => [
            <nav class="custom-pager">
                <Pagination {...pagination} />
            </nav>,
        ]);
        mountTable(
            {
                columns: getColumns(),
                dataSource: getData(46),
                pagination: { pageSize: 10, position: 'bottom', formatPageText: () => 'text' },
            },
            { pagination: slot }
        );
        expect(query('.custom-pager')).not.toBeNull();
        expect(query(`.${P}-pagination-info`)).toBeNull();
        const [{ pagination }] = slot.mock.calls[0];
        expect(pagination).not.toHaveProperty('position');
        expect(pagination).not.toHaveProperty('formatPageText');
        expect(pagination).toEqual(expect.objectContaining({ pageSize: 10, total: 46, currentPage: 1 }));
        await clickPage(3);
        expect(getFirstCellText()).toBe('Edward King 20');
        expect(getActivePage()).toHaveTextContent('3');
    });

    it('#pagination 返回纯文本时只显示该文本', () => {
        mountTable({ columns: getColumns(), dataSource: getData(46) }, { pagination: () => 'custom pager' });
        const outer = query(`.${P}-pagination-outer`);
        expect(outer).toHaveTextContent(/^custom pager$/);
        expect(outer.querySelector(`.${BASE_CLASS_PREFIX}-page`)).toBeNull();
    });

    it('#pagination 输出为空时显示默认的分页信息与分页器', () => {
        mountTable({ columns: getColumns(), dataSource: getData(46) }, { pagination: () => [] });
        expect(getPaginationInfo()).toBe('显示第 1 条-第 10 条，共 46 条');
        expect(getPageItems().length).toBeGreaterThan(0);
    });
});

describe('Table pagination 更新', () => {
    it('pagination 去掉 onChange 后，翻页由表格自己处理', async () => {
        const onChange = vi.fn<(currentPage: number, pageSize: number) => void>();
        const table = mountTable({ columns: getColumns(), dataSource: getData(25), pagination: { pageSize: 10, onChange } });
        await table.update({ props: { pagination: { pageSize: 10 } } });
        await clickPage(2);
        expect(onChange).not.toHaveBeenCalled();
        expect(getFirstCellText()).toBe('Edward King 10');
    });

    it('scrollToFirstRowOnChange 时传了 pagination.onChange，只复位滚动，翻页交给使用方，不发出 change', async () => {
        const onPageChange = vi.fn<(currentPage: number, pageSize: number) => void>();
        const onChange = vi.fn<(info: TableChangeInfo) => void>();
        const table = mountTable({ columns: getColumns(), dataSource: getData(25), onChange, pagination: { pageSize: 10, onChange: onPageChange }, scroll: { y: 200, scrollToFirstRowOnChange: true } });
        const body = query(`.${P}-body`, table.container);
        body.scrollTop = 50;
        await clickPage(2);
        expect(onPageChange).toHaveBeenCalledWith(2, 10);
        expect(onChange).not.toHaveBeenCalled();
        expect(getFirstCellText()).toBe('Edward King 0');
        expect(body.scrollTop).toBe(0);
    });
});
