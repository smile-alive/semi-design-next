import { flushSync, tick } from 'svelte';
import { render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { ColumnProps, RowSelectionOnChange, TableChangeInfo } from '../interface';
import { P, click, firstCellTexts, getBodyRows, getColumns, getData, getDropdownItems, getExpandButtons, getFilterButtons, getHeaderCheckboxInput, getHeads, getPageItem, getRowCheckboxInputs, getSorters, mountTable, query, queryAll, rowKeys } from './helpers';
import TableModes from './table-modes.svelte';

const sortColumns = (extra: Partial<ColumnProps> = {}): ColumnProps[] => [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Age', dataIndex: 'age', sorter: (a, b) => (a?.age ?? 0) - (b?.age ?? 0), ...extra },
];

const filterColumns = (extra: Partial<ColumnProps> = {}): ColumnProps[] => [
    {
        title: 'Name',
        dataIndex: 'name',
        filters: [
            { text: 'Lisa', value: 'Lisa' },
            { text: 'Jim', value: 'Jim' },
        ],
        onFilter: (value, record) => String(record?.name).includes(String(value)),
        ...extra,
    },
    { title: 'Age', dataIndex: 'age' },
];

describe('Svelte Table 排序', () => {
    it('点击排序按钮依次升序、降序、取消，aria-sort 跟随，onChange 收到 sorter', async () => {
        const onChange = vi.fn<(info: TableChangeInfo) => void>();
        mountTable({ columns: sortColumns(), dataSource: getData(), pagination: false, onChange });
        expect(getHeads()[1].getAttribute('aria-sort')).toBeNull();
        await click(getSorters()[0]);
        expect(firstCellTexts()).toEqual(['Joe Black', 'John Brown', 'Lisa', 'Jim Green']);
        expect(getHeads()[1].getAttribute('aria-sort')).toBe('ascending');
        expect(onChange.mock.lastCall?.[0].sorter?.sortOrder).toBe('ascend');
        await click(getSorters()[0]);
        expect(firstCellTexts()).toEqual(['Jim Green', 'Lisa', 'John Brown', 'Joe Black']);
        expect(getHeads()[1].getAttribute('aria-sort')).toBe('descending');
        await click(getSorters()[0]);
        expect(rowKeys()).toEqual(['1', '2', '3', '4']);
        expect(getHeads()[1].getAttribute('aria-sort')).toBeNull();
    });

    it('点击表头单元格也会排序', async () => {
        mountTable({ columns: sortColumns(), dataSource: getData(), pagination: false });
        await click(getHeads()[1]);
        expect(firstCellTexts()[0]).toBe('Joe Black');
    });

    it('defaultSortOrder 设置初始排序', () => {
        mountTable({ columns: sortColumns({ defaultSortOrder: 'descend' }), dataSource: getData(), pagination: false });
        expect(firstCellTexts()[0]).toBe('Jim Green');
    });

    it('受控 sortOrder：点击只触发 onChange，父级改值后才排序', async () => {
        const onChange = vi.fn<(info: TableChangeInfo) => void>();
        const { store } = mountTable({ columns: sortColumns({ sortOrder: false }), dataSource: getData(), pagination: false, onChange });
        await click(getSorters()[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(rowKeys()).toEqual(['1', '2', '3', '4']);
        store.props.columns = sortColumns({ sortOrder: 'ascend' });
        flushSync();
        await tick();
        expect(firstCellTexts()[0]).toBe('Joe Black');
    });

    it('sortIcon snippet 收到当前排序', async () => {
        mountTable({ columns: sortColumns(), dataSource: getData(), pagination: false }, ['sortIcon']);
        expect(query('.custom-sort-icon').textContent).toBe('false');
        await click(getSorters()[0]);
        expect(query('.custom-sort-icon').textContent).toBe('ascend');
    });
});

describe('Svelte Table 筛选', () => {
    it('打开菜单选择一项后筛选，按钮名称变为已筛选', async () => {
        const onChange = vi.fn<(info: TableChangeInfo) => void>();
        mountTable({ columns: filterColumns(), dataSource: getData(), pagination: false, onChange });
        const button = getFilterButtons()[0];
        expect(button.getAttribute('aria-label')).toBe('筛选此列数据');
        await click(button);
        await tick();
        const items = getDropdownItems();
        expect(items.map((item) => item.textContent?.trim())).toEqual(['Lisa', 'Jim']);
        await click(items[0]);
        await tick();
        expect(firstCellTexts()).toEqual(['Lisa']);
        expect(getFilterButtons()[0].classList.contains('on')).toBe(true);
        expect(getFilterButtons()[0].getAttribute('aria-label')).not.toBe('筛选此列数据');
        expect(onChange.mock.lastCall?.[0].filters?.[0].filteredValue).toEqual(['Lisa']);
    });

    it('defaultFilteredValue 设置初始筛选', () => {
        mountTable({ columns: filterColumns({ defaultFilteredValue: ['Jim'] }), dataSource: getData(), pagination: false });
        expect(firstCellTexts()).toEqual(['Jim Green']);
    });

    it('受控 filteredValue：父级改值后筛选', () => {
        const { store } = mountTable({ columns: filterColumns({ filteredValue: [] }), dataSource: getData(), pagination: false });
        expect(getBodyRows()).toHaveLength(4);
        store.props.columns = filterColumns({ filteredValue: ['Lisa'] });
        flushSync();
        expect(firstCellTexts()).toEqual(['Lisa']);
    });

    it('filterDropdown snippet 通过 onConfirm 与 onClear 筛选', async () => {
        mountTable({ columns: filterColumns({ filters: undefined, filterDropdown: true }), dataSource: getData(), pagination: false }, ['filterDropdown', 'filterIcon']);
        expect(query('.custom-filter-icon').textContent).toBe('off');
        await click(getFilterButtons()[0]);
        await tick();
        await click(query('.custom-filter-apply'));
        await tick();
        expect(firstCellTexts()).toEqual(['Lisa']);
        expect(query('.custom-filter-icon').textContent).toBe('on');
        await click(getFilterButtons()[0]);
        await tick();
        await click(query('.custom-filter-clear'));
        await tick();
        expect(getBodyRows()).toHaveLength(4);
    });
});

describe('Svelte Table 行选择', () => {
    it('勾选单行与全选，onChange 收到选中键', async () => {
        const onChange = vi.fn<RowSelectionOnChange>();
        mountTable({ columns: getColumns(), dataSource: getData(), pagination: false, rowSelection: { onChange } });
        expect(getRowCheckboxInputs()).toHaveLength(4);
        expect(getRowCheckboxInputs()[0].getAttribute('aria-label')).toBe('选择此行');
        await click(getRowCheckboxInputs()[0]);
        expect(onChange.mock.lastCall?.[0]).toEqual(['1']);
        expect(getRowCheckboxInputs()[0].checked).toBe(true);
        expect(getHeaderCheckboxInput().indeterminate).toBe(true);
        await click(getHeaderCheckboxInput());
        expect(onChange.mock.lastCall?.[0]).toEqual(['1', '2', '3', '4']);
        expect(getRowCheckboxInputs().every((input) => input.checked)).toBe(true);
        await click(getHeaderCheckboxInput());
        expect(onChange.mock.lastCall?.[0]).toEqual([]);
    });

    it('受控 selectedRowKeys：点击不改选中，父级改值后跟随', async () => {
        const onChange = vi.fn<RowSelectionOnChange>();
        const { store } = mountTable({ columns: getColumns(), dataSource: getData(), pagination: false, rowSelection: { selectedRowKeys: ['2'], onChange } });
        expect(getRowCheckboxInputs().map((input) => input.checked)).toEqual([false, true, false, false]);
        await click(getRowCheckboxInputs()[0]);
        expect(onChange.mock.lastCall?.[0]).toEqual(['2', '1']);
        expect(getRowCheckboxInputs()[0].checked).toBe(false);
        store.props.rowSelection = { selectedRowKeys: ['1', '2'], onChange };
        flushSync();
        expect(getRowCheckboxInputs().map((input) => input.checked)).toEqual([true, true, false, false]);
    });

    it('defaultSelectedRowKeys 设置初始选中', () => {
        mountTable({ columns: getColumns(), dataSource: getData(), pagination: false, rowSelection: { defaultSelectedRowKeys: ['3'] } });
        expect(getRowCheckboxInputs().map((input) => input.checked)).toEqual([false, false, true, false]);
    });

    it('getCheckboxProps 禁用的行不参与全选', async () => {
        const onChange = vi.fn<RowSelectionOnChange>();
        mountTable({ columns: getColumns(), dataSource: getData(), pagination: false, rowSelection: { onChange, getCheckboxProps: (record) => ({ disabled: record?.key === '1' }) } });
        expect(getRowCheckboxInputs()[0].disabled).toBe(true);
        await click(getHeaderCheckboxInput());
        expect(onChange.mock.lastCall?.[0]).toEqual(['2', '3', '4']);
    });

    it('selectionCell snippet 包住原复选框', async () => {
        mountTable({ columns: getColumns(), dataSource: getData(), pagination: false, rowSelection: {} }, ['selectionCell']);
        const cells = queryAll('.custom-selection');
        expect(cells).toHaveLength(5);
        expect(cells[0].dataset.header).toBe('true');
        await click(getRowCheckboxInputs()[0]);
        expect(queryAll('.custom-selection')[1].dataset.selected).toBe('true');
    });
});

describe('Svelte Table 展开', () => {
    type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';
    const setup = (mode: Mode, keys?: string[], accept = true) => {
        const store = createStore<{ keys: (string | number)[] | undefined; accept: boolean; log: string[] }>({ keys, accept, log: [] });
        render(TableModes, { props: { mode, store } });
        return store;
    };
    const details = () => queryAll('.detail').map((node) => node.textContent);

    it('非受控：点击展开按钮显示展开行，aria-expanded 跟随', async () => {
        const store = setup('uncontrolled');
        expect(getExpandButtons()).toHaveLength(4);
        expect(getExpandButtons()[0].getAttribute('aria-expanded')).toBe('false');
        await click(getExpandButtons()[0]);
        expect(details()).toEqual(['John Brown']);
        expect(getExpandButtons()[0].getAttribute('aria-expanded')).toBe('true');
        expect(store.log).toEqual(['change 1']);
    });

    it('bind:expandedRowKeys：点击写回父级，父级改值同步到组件', async () => {
        const store = setup('bind', ['2']);
        expect(details()).toEqual(['Jim Green']);
        await click(getExpandButtons()[0]);
        expect(store.keys).toEqual(['2', '1']);
        expect(details()).toEqual(['John Brown', 'Jim Green']);
        store.keys = [];
        flushSync();
        expect(details()).toEqual([]);
    });

    it('函数绑定：setter 拒绝时保持原展开', async () => {
        const store = setup('function', ['2'], false);
        await click(getExpandButtons()[0]);
        expect(store.log).toEqual(['set 2,1', 'change 1,2']);
        expect(details()).toEqual(['Jim Green']);
    });

    it('函数绑定：setter 接受时组件跟随', async () => {
        const store = setup('function', ['2']);
        await click(getExpandButtons()[0]);
        expect(store.keys).toEqual(['2', '1']);
        expect(details()).toEqual(['John Brown', 'Jim Green']);
    });

    it('单向传值：组件在本地展开，父级值不变；父级再推值时覆盖本地', async () => {
        const store = setup('one-way', ['2']);
        await click(getExpandButtons()[0]);
        expect(store.keys).toEqual(['2']);
        expect(details()).toEqual(['John Brown', 'Jim Green']);
        store.keys = ['3'];
        flushSync();
        expect(details()).toEqual(['Joe Black']);
    });

    it('树形数据：children 按缩进渲染，展开后显示子行', async () => {
        mountTable({
            columns: getColumns(),
            dataSource: [{ key: 'p', name: 'Parent', age: 1, address: '', children: [{ key: 'c', name: 'Child', age: 2, address: '' }] }],
            pagination: false,
        });
        expect(rowKeys()).toEqual(['p']);
        await click(getExpandButtons()[0]);
        expect(rowKeys()).toEqual(['p', 'c']);
        // a leaf row indents one more level to line up with the expand button of its parent
        expect(query(`.${P}-row[data-row-key="c"] .${P}-row-indent.indent-level-2`)).not.toBeNull();
    });

    it('defaultExpandAllRows 初始展开全部，expandRowByClick 点行展开', async () => {
        mountTable({ columns: getColumns(), dataSource: getData(), pagination: false, defaultExpandAllRows: true }, ['expandedRow']);
        expect(queryAll('.custom-expanded')).toHaveLength(4);
        const { container } = mountTable({ columns: getColumns(), dataSource: getData().slice(0, 1), pagination: false, expandRowByClick: true }, ['expandedRow', 'expandIcon']);
        await click(query(`.${P}-row[data-row-key="1"]`, container));
        expect(queryAll('.custom-expanded', container)).toHaveLength(1);
        expect(query('.custom-expand-icon', container).textContent).toBe('-');
    });
});

describe('Svelte Table 分组', () => {
    it('groupBy 渲染分组行，点击分组行收起与展开', async () => {
        mountTable(
            {
                columns: getColumns(),
                dataSource: getData(),
                pagination: false,
                groupBy: (record) => (record?.age > 30 ? 'old' : 'young'),
                defaultExpandAllGroupRows: true,
                clickGroupedRowToExpand: true,
            },
            ['groupSection']
        );
        expect(queryAll('.custom-group').map((node) => node.textContent)).toEqual(['old: 3', 'young: 1']);
        expect(getBodyRows().filter((row) => row.dataset.rowKey && !row.classList.contains(`${P}-row-section`))).toHaveLength(4);
        await click(queryAll(`.${P}-row-section`)[0]);
        expect(queryAll(`.${P}-tbody .${P}-row:not(.${P}-row-section)`)).toHaveLength(1);
    });
});

describe('Svelte Table 分页', () => {
    it('按 pageSize 分页，点击页码切换并触发 onChange', async () => {
        const onChange = vi.fn<(info: TableChangeInfo) => void>();
        mountTable({ columns: getColumns(), dataSource: getData(), pagination: { pageSize: 2 }, onChange });
        expect(rowKeys()).toEqual(['1', '2']);
        expect(query(`.${P}-pagination-info`).textContent).toContain('1');
        await click(getPageItem('2'));
        expect(rowKeys()).toEqual(['3', '4']);
        expect(onChange.mock.lastCall?.[0].pagination?.currentPage).toBe(2);
    });

    it('受控 currentPage 按远程分页渲染给定的行，翻页只触发分页的 onChange，父级改值后切换当前页', async () => {
        const onChange = vi.fn<(info: TableChangeInfo) => void>();
        const onPageChange = vi.fn<(currentPage: number, pageSize: number) => void>();
        const activePage = () => query(`.semi-page-item-active`).textContent?.trim();
        const { store } = mountTable({ columns: getColumns(), dataSource: getData(), pagination: { pageSize: 2, currentPage: 1, total: 8, onChange: onPageChange }, onChange });
        expect(rowKeys()).toEqual(['1', '2', '3', '4']);
        await click(getPageItem('2'));
        expect(onPageChange).toHaveBeenCalledWith(2, 2);
        expect(onChange).not.toHaveBeenCalled();
        expect(activePage()).toBe('1');
        store.props.pagination = { pageSize: 2, currentPage: 2, total: 8, onChange: onPageChange };
        flushSync();
        expect(activePage()).toBe('2');
    });

    it('pagination 为 false 时不分页，paginationContent snippet 替换分页', () => {
        mountTable({ columns: getColumns(), dataSource: getData(), pagination: { pageSize: 3 } }, ['paginationContent']);
        expect(query('.custom-pagination').textContent).toBe('page 1 of 4');
        expect(rowKeys()).toEqual(['1', '2', '3']);
    });
});

describe('Svelte Table 虚拟化', () => {
    it('virtualized 时容器带 aria-rowcount，行带 aria-rowindex', () => {
        mountTable({ columns: getColumns(), dataSource: getData(), pagination: false, virtualized: true, scroll: { y: 300 } });
        expect(query(`.${P}-container`).getAttribute('aria-rowcount')).toBe('5');
        const rows = queryAll(`.${P}-row[data-row-key]`);
        expect(rows.length).toBeGreaterThan(0);
        expect(rows[0].getAttribute('aria-rowindex')).toBe('2');
    });
});
