import { flushSync, tick } from 'svelte';
import { render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { RowSelectionOnChange, TableProps } from '../interface';
import { click, getColumns, getData, getPageItem, getRowCheckboxInputs, query, rowKeys } from './helpers';
import TableBind from './table-bind.svelte';

function mount(props: TableProps, bound: { selectedRowKeys?: (string | number)[]; currentPage?: number } = {}) {
    const store = createStore<{ props: TableProps; selectedRowKeys?: (string | number)[]; currentPage?: number }>({ props, ...bound });
    render(TableBind, { props: { store } });
    return store;
}

const checked = () => getRowCheckboxInputs().map((input) => input.checked);

describe('Svelte Table 顶层可绑定 prop', () => {
    it('bind:selectedRowKeys：勾选写回父级，父级改值驱动勾选，回调照常触发', async () => {
        const onChange = vi.fn<RowSelectionOnChange>();
        const store = mount({ columns: getColumns(), dataSource: getData(), pagination: false, rowSelection: { onChange } }, { selectedRowKeys: ['2'] });
        expect(checked()).toEqual([false, true, false, false]);
        await click(getRowCheckboxInputs()[0]);
        expect(store.selectedRowKeys).toEqual(['2', '1']);
        expect(onChange.mock.lastCall?.[0]).toEqual(['2', '1']);
        expect(checked()).toEqual([true, true, false, false]);
        store.selectedRowKeys = ['3'];
        flushSync();
        expect(checked()).toEqual([false, false, true, false]);
    });

    it('selectedRowKeys 与 rowSelection.selectedRowKeys 同时给时以顶层为准', () => {
        mount({ columns: getColumns(), dataSource: getData(), pagination: false, rowSelection: { selectedRowKeys: ['1'] } }, { selectedRowKeys: ['4'] });
        expect(checked()).toEqual([false, false, false, true]);
    });

    it('bind:currentPage：翻页写回父级，父级改值驱动翻页', async () => {
        const store = mount({ columns: getColumns(), dataSource: getData(), pagination: { pageSize: 2 } }, { currentPage: 1 });
        expect(rowKeys()).toEqual(['1', '2']);
        await click(getPageItem('2'));
        expect(store.currentPage).toBe(2);
        expect(rowKeys()).toEqual(['3', '4']);
        store.currentPage = 1;
        flushSync();
        expect(rowKeys()).toEqual(['1', '2']);
    });

    it('currentPage 未初始化时翻页也写回；pagination.onChange 照常触发', async () => {
        const onPageChange = vi.fn<(currentPage: number, pageSize: number) => void>();
        const store = mount({ columns: getColumns(), dataSource: getData(), pagination: { pageSize: 2, onChange: onPageChange } });
        await click(getPageItem('2'));
        expect(store.currentPage).toBe(2);
        expect(onPageChange).toHaveBeenCalledWith(2, 2);
    });

    it('父级改 bind:currentPage 翻页时不触发 onChange', async () => {
        const onChange = vi.fn<NonNullable<TableProps['onChange']>>();
        const store = mount({ columns: getColumns(), dataSource: getData(), pagination: { pageSize: 2 }, onChange }, { currentPage: 1 });
        store.currentPage = 2;
        flushSync();
        expect(rowKeys()).toEqual(['3', '4']);
        expect(onChange).not.toHaveBeenCalled();
        await click(getPageItem('1'));
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('同时给 pagination.onChange 时点一次页码，每个回调各触发一次', async () => {
        const onChange = vi.fn<NonNullable<TableProps['onChange']>>();
        const onPageChange = vi.fn<(currentPage: number, pageSize: number) => void>();
        const store = mount({ columns: getColumns(), dataSource: getData(), pagination: { pageSize: 2, onChange: onPageChange }, onChange }, { currentPage: 1 });
        await click(getPageItem('2'));
        await tick();
        expect(store.currentPage).toBe(2);
        expect(rowKeys()).toEqual(['3', '4']);
        expect(onPageChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('currentPage 与 pagination.currentPage 同时给时以顶层为准', () => {
        mount({ columns: getColumns(), dataSource: getData().slice(2), pagination: { pageSize: 2, currentPage: 1, total: 4 } }, { currentPage: 2 });
        expect(query('.semi-page-item-active').textContent?.trim()).toBe('2');
    });
});
