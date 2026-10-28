/** @jsxImportSource vue */
import { defineComponent, nextTick, ref, type VNode } from 'vue';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { getData, render } from '@test/utils/vue';
import Table, { type ColumnProps, type RowSelectionProps, type TableChangeInfo, type TableSelectionCellSlotProps } from '..';
import LocaleProvider from '../../locale/locale-provider.vue';
import { P, getActivePage, getBodyRows, getFirstCellText, getHeaderCheckbox, getPageItems, mountTable, query, queryAll, type Row } from './table-helpers';

type Selection = Required<RowSelectionProps<Row>>;
const data = getData(46);
const getColumns = (): ColumnProps[] => [
    { title: 'Name', dataIndex: 'name', width: 150, fixed: 'left' },
    { title: 'Age', dataIndex: 'age', width: 150 },
    { title: 'Address', dataIndex: 'address' },
];
const getFileData = (total: number) =>
    Array.from({ length: total }, (_, i) => ({
        key: `${i}`,
        name: i % 2 === 0 ? `Semi Design 设计稿${i}.fig` : `Semi Pro 设计稿${i}.fig`,
        size: (i * 1000) % 199,
    }));
const nameFilters = [
    { text: 'Semi Design 设计稿', value: 'Semi Design 设计稿' },
    { text: 'Semi Pro 设计稿', value: 'Semi Pro 设计稿' },
];
const getBodyCheckboxes = () => queryAll(`.${P}-tbody .semi-checkbox`);
const getCheckedBodyCount = () => getBodyCheckboxes().filter((el) => el.classList.contains('semi-checkbox-checked')).length;
const clickPage = (page: number) => userEvent.click(getPageItems().find((item) => item.textContent === `${page}`) as HTMLElement);
const expectRowsCheckedBy = (keys: string[]) =>
    getBodyRows().forEach((row) => {
        const checked = row.querySelector('.semi-checkbox-inner-checked') !== null;
        expect(checked).toBe(keys.includes(row.getAttribute('data-row-key') as string));
    });

describe('Table 选择', () => {
    it('选择功能', async () => {
        const disabledKeys = ['4'];
        const onChange = vi.fn<Selection['onChange']>();
        const onSelectAll = vi.fn<Selection['onSelectAll']>();
        const onSelect = vi.fn<Selection['onSelect']>();
        const getCheckboxProps = (record: Row) => ({ disabled: disabledKeys.includes(record.key), name: record.name });
        const Demo = defineComponent(() => {
            const keys = ref<(string | number)[]>(['3']);
            return () => (
                <Table
                    columns={getColumns()}
                    dataSource={data}
                    rowKey="key"
                    rowSelection={{
                        onChange: (selectedRowKeys: (string | number)[], selectedRows: Row[]) => {
                            onChange(selectedRowKeys, selectedRows);
                            keys.value = [...selectedRowKeys];
                        },
                        onSelectAll: (selected: boolean, selectedRows: Row[], changedRows: Row[], event: Event) => {
                            onSelectAll(selected, selectedRows, changedRows, event);
                            keys.value = selected ? ['0'] : [];
                        },
                        getCheckboxProps,
                        onSelect,
                        selectedRowKeys: keys.value,
                        defaultSelectedRowKeys: ['0', '1'],
                    }}
                />
            );
        });
        render(Demo);
        await nextTick();
        expect(queryAll('.semi-checkbox').length).toBeGreaterThan(0);
        expect(queryAll(`.${P}-row .semi-checkbox-inner-checked`)).toHaveLength(1);
        expectRowsCheckedBy(['3']);
        expect(queryAll(`.${P}-thead .semi-checkbox-indeterminate`)).toHaveLength(1);
        getBodyCheckboxes()
            .filter((_, index) => disabledKeys.includes(String(index)))
            .forEach((el) => expect(el).toHaveClass('semi-checkbox-disabled'));
        await userEvent.click(query(`.${P}-row .semi-checkbox-disabled`));
        expect(onSelect).not.toHaveBeenCalled();
        await userEvent.click(query(`.${P}-tbody .${P}-row .semi-checkbox`));
        expect(onSelect).toHaveBeenCalledTimes(1);
        await userEvent.click(getHeaderCheckbox());
        expect(onSelectAll).toHaveBeenCalledTimes(1);
        expectRowsCheckedBy(onChange.mock.lastCall?.[0] as string[]);
        expect(queryAll(`.${P}-thead .semi-checkbox-inner-checked`)).toHaveLength(1);
        await userEvent.click(getHeaderCheckbox());
        expect(onSelectAll).toHaveBeenCalledTimes(2);
        expectRowsCheckedBy([]);
        expect(queryAll(`.${P}-thead .semi-checkbox-inner-checked`)).toHaveLength(0);
        expect(queryAll(`.${P}-thead .semi-checkbox-indeterminate`)).toHaveLength(0);
    });

    it('数据变化后的选择功能', async () => {
        const onSelectAll = vi.fn<Selection['onSelectAll']>();
        const onSelect = vi.fn<Selection['onSelect']>();
        const dataSource = ref<Row[]>(data);
        const Demo = defineComponent(() => {
            const keys = ref<string[]>();
            return () => (
                <Table
                    columns={getColumns()}
                    dataSource={dataSource.value}
                    rowKey="key"
                    rowSelection={{
                        onSelectAll: (...args: Parameters<Selection['onSelectAll']>) => {
                            onSelectAll(...args);
                            keys.value = args[0] ? ['0'] : [];
                        },
                        getCheckboxProps: (record: Row) => ({ disabled: record.key === '4', name: record.name }),
                        onSelect,
                        ...(keys.value && { selectedRowKeys: keys.value }),
                    }}
                />
            );
        });
        render(Demo);
        dataSource.value = getData(50);
        await nextTick();
        await userEvent.click(query(`.${P}-row .semi-checkbox-disabled`));
        expect(onSelect).not.toHaveBeenCalled();
        await userEvent.click(query(`.${P}-tbody .${P}-row .semi-checkbox`));
        expect(onSelect).toHaveBeenCalledTimes(1);
        await userEvent.click(getHeaderCheckbox());
        expect(onSelectAll).toHaveBeenCalledTimes(1);
        await userEvent.click(getHeaderCheckbox());
        expect(onSelectAll).toHaveBeenCalledTimes(2);
    });

    it('所有行都禁用时的全选', async () => {
        const onSelectAll = vi.fn<Selection['onSelectAll']>();
        mountTable({
            columns: getColumns(),
            dataSource: data,
            rowSelection: { onSelectAll, getCheckboxProps: (record: Row) => ({ disabled: true, name: record.name }) },
        });
        await userEvent.click(getHeaderCheckbox());
        expect(onSelectAll.mock.calls[0][1]).toHaveLength(0);
    });

    it('getCheckboxProps 变化', async () => {
        const getDisabledCheckboxes = () => queryAll(`.${P}-tbody .semi-checkbox-disabled`);
        const table = mountTable({
            columns: getColumns(),
            dataSource: getData(20),
            pagination: false,
            rowSelection: { getCheckboxProps: (record: Row) => ({ disabled: record.key === '1' }) },
        });
        expect(getDisabledCheckboxes()).toHaveLength(1);
        await table.update({
            props: {
                rowSelection: { getCheckboxProps: (record: Row) => ({ disabled: ['0', '1'].includes(record.key) }) },
            },
        });
        expect(getDisabledCheckboxes()).toHaveLength(2);
    });
});

describe('Table 选择回归用例', () => {
    it('fix #325：表头选择反映所有页，跳过禁用行', async () => {
        mountTable({
            columns: [{ title: '标题', dataIndex: 'name' }],
            dataSource: getFileData(6),
            pagination: { pageSize: 3 },
            rowSelection: { getCheckboxProps: (record: Row) => ({ disabled: record.key === '2' }) },
        });
        await userEvent.click(getHeaderCheckbox());
        expect(getCheckedBodyCount()).toBe(2);
        expect(getHeaderCheckbox()).toHaveClass('semi-checkbox-checked');
        await clickPage(2);
        expect(getCheckedBodyCount()).toBe(3);
        expect(getHeaderCheckbox()).toHaveClass('semi-checkbox-checked');
        expect(getHeaderCheckbox()).not.toHaveClass('semi-checkbox-indeterminate');
        await userEvent.click(getBodyCheckboxes()[0]);
        expect(getHeaderCheckbox()).toHaveClass('semi-checkbox-indeterminate');
        await userEvent.click(getHeaderCheckbox());
        expect(getHeaderCheckbox()).toHaveClass('semi-checkbox-checked');
        expect(getCheckedBodyCount()).toBe(3);
    });

    it('rowSelection 从 false 改为 selectedRowKeys 为 null 的对象后，勾选一行按未选处理', async () => {
        const onChange = vi.fn<Selection['onChange']>();
        const table = mountTable({
            columns: [{ title: '标题', dataIndex: 'name' }],
            dataSource: getFileData(3),
            rowSelection: false,
        });
        await table.update({ props: { rowSelection: { selectedRowKeys: null, onChange } } });
        await userEvent.click(getBodyCheckboxes()[1]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toEqual(['1']);
        expect(getCheckedBodyCount()).toBe(1);
    });

    it('fix #381：选择变化导致 columns 重建时保留当前页', async () => {
        const fileData = getFileData(46);
        const Demo = defineComponent(() => {
            const rowKeys = ref<(string | number)[]>([]);
            return () => (
                <Table
                    columns={[
                        {
                            title: '标题',
                            dataIndex: 'name',
                            filters: nameFilters,
                            onFilter: (v: string, r: Row) => r.name.includes(v),
                        },
                        { title: '大小', dataIndex: 'size', sorter: (a: Row, b: Row) => a.size - b.size },
                    ]}
                    dataSource={fileData}
                    pagination={{ pageSize: 5 }}
                    rowSelection={{
                        onChange: (keys: (string | number)[]) => {
                            rowKeys.value = keys;
                        },
                        selectedRowKeys: rowKeys.value,
                    }}
                    scroll={{ y: 300 }}
                />
            );
        });
        render(Demo);
        await clickPage(2);
        expect(getActivePage()).toHaveTextContent('2');
        await userEvent.click(getBodyCheckboxes()[1]);
        expect(getCheckedBodyCount()).toBe(1);
        expect(getActivePage()).toHaveTextContent('2');
        expect(getFirstCellText()).not.toBe(fileData[0].name);
    });

    it('fix #2001：所有行既禁用又选中时，表头复选框为选中状态', async () => {
        const rows = Array.from({ length: 20 }, (_, index) => ({ key: index, name: `name ${index}` }));
        const Demo = defineComponent(() => {
            const selectAll = ref(false);
            const keys = ref<(string | number)[]>([]);
            return () => (
                <div>
                    <button
                        onClick={() => {
                            selectAll.value = true;
                            keys.value = rows.map((row) => row.key);
                        }}
                    >
                        点击全选
                    </button>
                    <Table
                        columns={[{ title: 'name', dataIndex: 'name' }]}
                        dataSource={rows}
                        rowSelection={{
                            disabled: selectAll.value,
                            getCheckboxProps: () => (selectAll.value ? { disabled: true } : {}),
                            onChange: (next: (string | number)[]) => {
                                keys.value = next;
                            },
                            selectedRowKeys: keys.value,
                        }}
                    />
                </div>
            );
        });
        render(Demo);
        expect(getHeaderCheckbox()).not.toHaveClass('semi-checkbox-checked');
        await userEvent.click(screen.getByRole('button', { name: '点击全选' }));
        expect(getHeaderCheckbox()).toHaveClass('semi-checkbox-checked');
        expect(getHeaderCheckbox()).not.toHaveClass('semi-checkbox-indeterminate');
    });

    it('fix #2128：dataSource 为空时，表头复选框不选中', () => {
        mountTable({
            columns: [{ title: '标题', dataIndex: 'name' }],
            dataSource: [],
            pagination: { pageSize: 3 },
            rowSelection: true,
        });
        expect(getHeaderCheckbox()).toHaveClass('semi-checkbox-unChecked');
        expect(getHeaderCheckbox()).not.toHaveClass('semi-checkbox-checked');
    });
});

describe('Table 选择行为基线', () => {
    it('受控选择报告行，全选时跳过禁用行，并固定选择列', async () => {
        const onChange = vi.fn<Selection['onChange']>();
        const onSelect = vi.fn<Selection['onSelect']>();
        const onSelectAll = vi.fn<Selection['onSelectAll']>();
        const rows = getData(3);
        const rowSelection = (selectedRowKeys: string[]): RowSelectionProps => ({
            selectedRowKeys,
            onChange,
            onSelect,
            onSelectAll,
            fixed: true,
            getCheckboxProps: (record) => ({ disabled: record.key === '2' }),
        });
        const table = mountTable({
            columns: getColumns(),
            dataSource: rows,
            pagination: false,
            rowSelection: rowSelection([]),
        });
        await userEvent.click(getBodyCheckboxes()[0]);
        expect(onChange).toHaveBeenLastCalledWith(['0'], [rows[0]]);
        expect(onSelect).toHaveBeenLastCalledWith(rows[0], true, [rows[0]], expect.anything());
        expect(getBodyRows()[0]).not.toHaveClass(`${P}-row-selected`);
        await table.update({ props: { rowSelection: rowSelection(['0']) } });
        expect(getBodyRows()[0]).toHaveClass(`${P}-row-selected`);
        await userEvent.click(getHeaderCheckbox());
        expect(onSelectAll).toHaveBeenLastCalledWith(true, [rows[0], rows[1]], [rows[1]], expect.anything());
        expect(onChange).toHaveBeenLastCalledWith(['0', '1'], [rows[0], rows[1]]);
        expect(query(`.${P}-thead .${P}-column-selection`)).toHaveClass(`${P}-cell-fixed-left`);
    });

    it('使用新的 rowSelection 对象重新渲染后，全选跳过禁用的树形子节点', async () => {
        const onChange = vi.fn<Selection['onChange']>();
        const rows = [
            { key: '1', name: 'parent', children: [{ key: '1-1', name: 'child' }] },
            { key: '2', name: 'other' },
        ];
        const rowSelection = () => ({
            onChange,
            getCheckboxProps: (record: Row) => ({ disabled: record.key === '1-1' }),
        });
        const table = mountTable({
            columns: [{ title: 'Name', dataIndex: 'name' }],
            dataSource: rows,
            defaultExpandAllRows: true,
            pagination: false,
            rowSelection: rowSelection(),
        });
        await table.update({ props: { rowSelection: rowSelection() } });
        await userEvent.click(getHeaderCheckbox());
        expect(onChange).toHaveBeenLastCalledWith(['1', '2'], [rows[0], rows[1]]);
    });

    it('所有子节点选中后选中父节点，并报告数字 key', async () => {
        const onChange = vi.fn<Selection['onChange']>();
        mountTable({
            columns: [{ title: 'Name', dataIndex: 'name' }],
            dataSource: [
                {
                    id: 1,
                    name: 'parent',
                    children: [
                        { id: 2, name: 'child a' },
                        { id: 3, name: 'child b' },
                    ],
                },
            ],
            defaultExpandAllRows: true,
            pagination: false,
            rowKey: 'id',
            rowSelection: { checkRelation: 'related', onChange },
        });
        await nextTick();
        await userEvent.click(screen.getAllByRole('checkbox')[2]);
        await userEvent.click(screen.getAllByRole('checkbox')[3]);
        const keys = onChange.mock.lastCall?.[0] ?? [];
        expect(keys.toSorted((a, b) => Number(a) - Number(b))).toEqual([1, 2, 3]);
        expect(keys.every((key) => typeof key === 'number')).toBe(true);
        expect(screen.getAllByRole('checkbox')[1]).toBeChecked();
    });

    it('内联 getCheckboxProps 的父组件重新渲染不触发重新排序', async () => {
        const sorter = vi.fn<(a: Row, b: Row) => number>((a, b) => a.name.localeCompare(b.name));
        const props = () => ({
            columns: [
                { title: '标题', dataIndex: 'name', sorter },
                { title: '大小', dataIndex: 'size' },
            ],
            dataSource: [
                { key: '1', name: 'b.fig', size: '2M' },
                { key: '2', name: 'a.fig', size: '2M' },
            ],
            pagination: false,
            rowSelection: { getCheckboxProps: () => ({}) },
        });
        const table = mountTable(props());
        await userEvent.click(screen.getByRole('button', { name: '标题' }));
        sorter.mockClear();
        await table.update({ props: { rowSelection: { getCheckboxProps: () => ({}) } } });
        expect(sorter).not.toHaveBeenCalled();
    });
});

describe('Table rowSelection 更新', () => {
    const rows = [
        { key: '1', name: 'Ann' },
        { key: '2', name: 'Bob' },
    ];
    const mountRows = (rowSelection: RowSelectionProps | undefined) =>
        mountTable({
            columns: [{ title: 'Name', dataIndex: 'name' }],
            dataSource: rows,
            pagination: false,
            rowSelection,
        });

    it('rowSelection 去掉 clickRow 后，点击行不再选中', async () => {
        const onChange = vi.fn<Selection['onChange']>();
        const table = mountRows({ clickRow: true, onChange });
        await userEvent.click(screen.getByText('Ann'));
        expect(onChange).toHaveBeenCalledTimes(1);
        await table.update({ props: { rowSelection: { onChange } } });
        await userEvent.click(screen.getByText('Bob'));
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('rowSelection 变为 undefined 后，点击行不再触发旧回调', async () => {
        const onChange = vi.fn<Selection['onChange']>();
        const table = mountRows({ clickRow: true, onChange });
        await table.update({ props: { rowSelection: undefined } });
        await userEvent.click(screen.getByText('Ann'));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('rowSelection 去掉 disabled 后，表头全选框恢复可用，非受控的已选行保留', async () => {
        const table = mountRows({ disabled: true });
        expect(screen.getAllByRole('checkbox')[0]).toBeDisabled();
        await table.update({ props: { rowSelection: {} } });
        expect(screen.getAllByRole('checkbox')[0]).toBeEnabled();
        await userEvent.click(screen.getAllByRole('checkbox')[1]);
        await table.update({ props: { rowSelection: { checkRelation: 'unRelated' } } });
        expect(screen.getAllByRole('checkbox')[1]).toBeChecked();
    });

    it('父组件更新 rowSelection 对象后，onChange 调用新函数', async () => {
        const first = vi.fn<Selection['onChange']>();
        const second = vi.fn<Selection['onChange']>();
        const table = mountRows({ onChange: first });
        await table.update({ props: { rowSelection: { onChange: second } } });
        await userEvent.click(screen.getAllByRole('checkbox')[1]);
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledWith(['1'], [rows[0]]);
    });
});

describe('Table 全选范围与 changedRows', () => {
    const rows = [
        { key: '1', name: 'a' },
        { key: '2', name: 'a' },
        { key: '3', name: 'b' },
    ];
    const keysOf = (list: Row[]) => list.map((row) => row.key);

    const selectAll = async (checkRelation: 'related' | 'unRelated', selectedRowKeys: string[]) => {
        const onSelectAll = vi.fn<Selection['onSelectAll']>();
        mountTable({
            columns: [
                {
                    title: 'Name',
                    dataIndex: 'name',
                    filteredValue: ['a'],
                    onFilter: (value: string, record: Row) => record.name === value,
                },
            ],
            dataSource: rows,
            pagination: false,
            rowSelection: { checkRelation, selectedRowKeys, onSelectAll },
        });
        await userEvent.click(getHeaderCheckbox());
        const [selected, selectedRows, changedRows] = onSelectAll.mock.lastCall as Parameters<Selection['onSelectAll']>;
        const sorted = (keys: string[]) => keys.toSorted((a, b) => a.localeCompare(b));
        return { selected, selectedKeys: sorted(keysOf(selectedRows)), changedKeys: sorted(keysOf(changedRows)) };
    };

    it.each(['related', 'unRelated'] as const)('%s：全选只报告状态真正变化的行', async (checkRelation) => {
        expect(await selectAll(checkRelation, ['1', '3'])).toEqual({
            selected: true,
            selectedKeys: ['1', '2', '3'],
            changedKeys: ['2'],
        });
    });

    it.each(['related', 'unRelated'] as const)('%s：取消全选保留被筛选隐藏的已选行', async (checkRelation) => {
        expect(await selectAll(checkRelation, ['1', '2', '3'])).toEqual({
            selected: false,
            selectedKeys: ['3'],
            changedKeys: ['1', '2'],
        });
    });
});

describe('Table 选择 Vue 写法', () => {
    const rows = [
        { key: '1', name: 'Ann' },
        { key: '2', name: 'Bob' },
    ];

    it('选择框的可访问名称在勾选前后不变', async () => {
        mountTable({
            columns: [{ title: 'Name', dataIndex: 'name' }],
            dataSource: rows,
            pagination: false,
            rowSelection: {},
        });
        await nextTick();
        const header = screen.getByRole('checkbox', { name: zh_CN.Table.selectAllRows });
        expect(screen.getAllByRole('checkbox', { name: zh_CN.Table.selectRow })).toHaveLength(2);
        await userEvent.click(screen.getAllByRole('checkbox', { name: zh_CN.Table.selectRow })[0]);
        expect(screen.getAllByRole('checkbox', { name: zh_CN.Table.selectRow })[0]).toBeChecked();
        expect(header).toBePartiallyChecked();
        await userEvent.click(header);
        expect(screen.getByRole('checkbox', { name: zh_CN.Table.selectAllRows })).toBeChecked();
        expect(screen.getAllByRole('checkbox', { name: zh_CN.Table.selectRow })).toHaveLength(2);
    });

    it('选择框的名称从语言包读取，getCheckboxProps 的 aria-label 优先', () => {
        render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: {
                default: () => (
                    <Table
                        columns={[{ title: 'Name', dataIndex: 'name' }]}
                        dataSource={rows}
                        pagination={false}
                        rowSelection={{
                            getCheckboxProps: (record: Row) => (record.key === '2' ? { 'aria-label': 'Bob を選択' } : {}),
                        }}
                    />
                ),
            },
        });
        expect(screen.getByRole('checkbox', { name: ja_JP.Table.selectAllRows })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: ja_JP.Table.selectRow })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: 'Bob を選択' })).toBeInTheDocument();
    });

    it('Table 上的 @change 不被选择框 input 冒泡的原生 change 事件触发', async () => {
        const onChange = vi.fn<(info: TableChangeInfo) => void>();
        const onSelectionChange = vi.fn<Selection['onChange']>();
        mountTable({
            columns: [{ title: 'Name', dataIndex: 'name' }],
            dataSource: rows,
            pagination: false,
            rowSelection: { onChange: onSelectionChange },
            onChange,
        });
        await userEvent.click(screen.getAllByRole('checkbox')[1]);
        await userEvent.click(screen.getAllByRole('checkbox')[0]);
        expect(onSelectionChange).toHaveBeenCalledTimes(2);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('#selectionCell 收到选择状态与 originNode，空输出回落默认选择框', async () => {
        const selectionCell = vi.fn<(cell: TableSelectionCellSlotProps) => VNode[]>((cell) =>
            cell.inHeader
                ? []
                : [
                      <label class="custom-select">
                          {cell.originNode}
                          {cell.selected ? 'on' : 'off'}
                      </label>,
                  ]
        );
        mountTable({ columns: [{ title: 'Name', dataIndex: 'name' }], dataSource: rows, pagination: false, rowSelection: {} }, { selectionCell });
        expect(queryAll('.custom-select')).toHaveLength(2);
        expect(query(`.${P}-thead .${P}-selection-wrap`)).not.toBeNull();
        await userEvent.click(screen.getAllByRole('checkbox', { name: zh_CN.Table.selectRow })[0]);
        expect(queryAll('.custom-select').map((node) => node.textContent)).toEqual(['on', 'off']);
        expect(selectionCell).toHaveBeenCalledWith(
            expect.objectContaining({
                inHeader: false,
                record: rows[0],
                index: 0,
                selected: true,
                indeterminate: false,
            })
        );
        expect(selectionCell).toHaveBeenCalledWith(expect.objectContaining({ inHeader: true }));
    });
});

describe('Table checkRelation related 的半选随选中的 key 推导', () => {
    const treeData = () => [
        {
            id: 1,
            name: 'parent',
            children: [
                { id: 2, name: 'child a' },
                { id: 3, name: 'child b' },
            ],
        },
    ];
    const props = (rowSelection: RowSelectionProps<Row>) => ({ columns: [{ title: 'Name', dataIndex: 'name' }], dataSource: treeData(), defaultExpandAllRows: true, pagination: false, rowKey: 'id', rowSelection: { checkRelation: 'related', ...rowSelection } });
    const checkboxes = () => screen.getAllByRole('checkbox');

    it('受控 selectedRowKeys 含子行时父行半选，清空后父行不再半选', async () => {
        const table = mountTable(props({ selectedRowKeys: [2] }));
        await nextTick();
        expect(checkboxes()[1]).toBePartiallyChecked();
        await table.update({ props: props({ selectedRowKeys: [] }) });
        expect(checkboxes()[1]).not.toBePartiallyChecked();
    });

    it('defaultSelectedRowKeys 含子行时父行半选，含父行时子行一并选中', async () => {
        const table = mountTable(props({ defaultSelectedRowKeys: [2] }));
        await nextTick();
        expect(checkboxes()[1]).toBePartiallyChecked();
        table.unmount();

        mountTable(props({ defaultSelectedRowKeys: [1] }));
        await nextTick();
        expect(checkboxes()[2]).toBeChecked();
        expect(checkboxes()[3]).toBeChecked();
    });

    it('checkRelation 由 unRelated 改为 related 后，选中子行使父行半选', async () => {
        const table = mountTable(props({ checkRelation: 'unRelated' }));
        await table.update({ props: props({}) });
        await userEvent.click(checkboxes()[2]);
        expect(checkboxes()[1]).toBePartiallyChecked();
    });

    it('受控 selectedRowKeys 里被禁用的行挂载后保持选中，勾选其他行时 onChange 保留它', async () => {
        const onChange = vi.fn<Selection['onChange']>();
        mountTable({
            columns: [{ title: 'Name', dataIndex: 'name' }],
            dataSource: [
                { key: 1, name: 'Ann' },
                { key: 2, name: 'Bob' },
                { key: 3, name: 'Cid' },
            ],
            pagination: false,
            rowSelection: { selectedRowKeys: [1, 2], getCheckboxProps: (record: Row) => ({ disabled: record.key === 1 }), onChange },
        });
        await nextTick();
        expect(checkboxes()[1]).toBeChecked();
        await userEvent.click(checkboxes()[3]);
        expect(onChange.mock.lastCall?.[0]).toEqual([1, 2, 3]);
    });

    it('非受控 defaultSelectedRowKeys 里被禁用的行挂载后保持选中，勾选其他行时 onChange 保留它', async () => {
        const onChange = vi.fn<Selection['onChange']>();
        mountTable({
            columns: [{ title: 'Name', dataIndex: 'name' }],
            dataSource: [
                { key: 1, name: 'Ann' },
                { key: 2, name: 'Bob' },
                { key: 3, name: 'Cid' },
            ],
            pagination: false,
            rowSelection: { defaultSelectedRowKeys: [1, 2], getCheckboxProps: (record: Row) => ({ disabled: record.key === 1 }), onChange },
        });
        await nextTick();
        expect(checkboxes()[1]).toBeChecked();
        await userEvent.click(checkboxes()[3]);
        expect(onChange.mock.lastCall?.[0]).toEqual([1, 2, 3]);
    });
});
