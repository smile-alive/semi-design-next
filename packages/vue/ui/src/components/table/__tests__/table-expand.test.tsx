/** @jsxImportSource vue */
import { defineComponent, nextTick, ref, type VNode } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { getData, getRandomNumber, getTreeData, render } from '@test/utils/vue';
import Table, { type ColumnProps, type TableEmits, type TableExpandIconSlotProps, type TableExpandedRowSlotProps } from '..';
import ExpandedRow from './fixtures/expanded-row.vue';
import { P, getBodyRows, getExpandButtons, mountTable, query, queryAll, rowKeys, type Row } from './table-helpers';

type Emit<K extends keyof TableEmits> = (...args: TableEmits[K]) => void;

const data = getData(46);
const getColumns = (): ColumnProps[] => [
    { title: 'Name', dataIndex: 'name', width: 150, fixed: 'left' },
    { title: 'Age', dataIndex: 'age', width: 150 },
    { title: 'Description', dataIndex: 'description' },
    { title: 'Address', dataIndex: 'address' },
    { key: 'operate', width: 150, fixed: 'right' },
];
const getExpandedRowKeys = () => queryAll(`.${P}-tbody .${P}-row-expanded`).map((row) => row.getAttribute('data-row-key'));
const detail = (text: (record: Row) => string) => ({
    expandedRow: ({ record }: TableExpandedRowSlotProps) => [<p>{text(record)}</p>],
});
const getIndentClass = (rowKey: string | number) => query(`.${P}-tbody tr[data-row-key="${rowKey}"]`).querySelector(`.${P}-row-indent`)?.className;

describe('Table 展开', () => {
    it('#expandedRow 与 fixed', async () => {
        const table = mountTable(
            {
                columns: getColumns(),
                dataSource: data,
                defaultExpandAllRows: true,
                expandCellFixed: true,
                hideExpandedColumn: false,
                rowExpandable: (record: Row) => record.key !== '2',
                rowKey: 'key',
                scroll: { x: '160%', y: 320 },
            },
            {
                expandedRow: ({ record }: TableExpandedRowSlotProps) => [
                    <article>
                        <p>{record.description}</p>
                    </article>,
                ],
            }
        );
        expect(queryAll(`.${P}-cell-fixed-left`).length).toBeGreaterThan(0);
        expect(queryAll(`.${P}-cell-fixed-right`).length).toBeGreaterThan(0);
        expect(queryAll(`.${P}-cell-fixed-left.${P}-column-expand`).length).toBeGreaterThan(0);
        await table.update({ props: { dataSource: getData(50) } });
        expect(queryAll(`.${P}-cell-fixed-left.${P}-column-expand`).length).toBeGreaterThan(0);
    });

    it('树形数据', async () => {
        const childrenData = getTreeData();
        let expandedRowKeys: (string | number)[] = [1];
        const onExpand = vi.fn<(expanded: boolean, record: Row) => void>((expanded, record) => {
            const keySet = new Set(expandedRowKeys);
            if (expanded) {
                keySet.add(record.key);
            } else {
                keySet.delete(record.key);
            }
            expandedRowKeys = Array.from(keySet);
        });
        const Demo = defineComponent(() => {
            const keys = ref(expandedRowKeys);
            return () => (
                <Table
                    childrenRecordName="children"
                    columns={getColumns()}
                    dataSource={childrenData}
                    expandedRowKeys={keys.value}
                    rowKey="key"
                    onExpand={(expanded: boolean, record: Row) => {
                        onExpand(expanded, record);
                        keys.value = expandedRowKeys;
                    }}
                />
            );
        });
        render(Demo);
        const getExpandIcons = () => queryAll(`.${P}-body .${P}-row .${P}-expand-icon`);
        expect(getBodyRows()).toHaveLength((childrenData[0].children ?? []).length + childrenData.length);
        await userEvent.click(getExpandIcons()[1]);
        expect(onExpand).toHaveBeenCalledTimes(1);
        expect(expandedRowKeys).toEqual([1, 12]);
        expect(getExpandedRowKeys()).toEqual(['1', '12']);
        await userEvent.click(getExpandIcons()[0]);
        expect(onExpand).toHaveBeenCalledTimes(2);
        expect(expandedRowKeys).toEqual([12]);
        expect(getExpandedRowKeys()).toEqual([]);
        expect(rowKeys()).toEqual(['1', '2']);
    });

    it('defaultExpandedRowKeys 变化', async () => {
        const pageSize = 20;
        const keysOf = (length: number) => Array.from({ length }, (_, i) => String(i));
        const defaultExpandedRowKeys = keysOf(getRandomNumber(pageSize));
        const table = mountTable({ columns: getColumns(), dataSource: data, defaultExpandedRowKeys, pagination: { pageSize } }, { expandedRow: ({ index }: TableExpandedRowSlotProps) => [<div>{`Semi Design ${index}`}</div>] });
        await nextTick();
        expect(getExpandedRowKeys()).toEqual(defaultExpandedRowKeys);
        await table.update({ props: { defaultExpandedRowKeys: keysOf(getRandomNumber(pageSize)) } });
        expect(getExpandedRowKeys()).toEqual(defaultExpandedRowKeys);
    });

    it('expandAllRows', async () => {
        const table = mountTable({ columns: getColumns(), pagination: false, dataSource: [], expandAllRows: true }, { expandedRow: () => [<div>Semi Design</div>] });
        const newData = getData(20);
        await table.update({ props: { dataSource: newData } });
        expect(getExpandedRowKeys()).toHaveLength(newData.length);
        await table.update({ props: { expandAllRows: false } });
        expect(getExpandedRowKeys()).toHaveLength(0);
    });

    it('expandRowByClick', async () => {
        const expandEventTypes: string[] = [];
        const onExpand = vi.fn<Emit<'expand'>>((_expanded, _record, event) => {
            expandEventTypes.push(event.type);
        });
        const onExpandedRowsChange = vi.fn<Emit<'expandedRowsChange'>>();
        mountTable({ columns: getColumns(), dataSource: data, expandRowByClick: true, onExpand, onExpandedRowsChange }, { expandedRow: () => [<div>Semi Design</div>] });
        const rows = getBodyRows();
        await userEvent.click(rows[0]);
        await userEvent.click(rows[1]);
        expect(onExpand).toHaveBeenCalledTimes(2);
        expect(onExpandedRowsChange).toHaveBeenCalledTimes(2);
        expect(onExpand.mock.calls[1][0]).toBe(true);
        expect(onExpand.mock.calls[1][1]).toEqual(data[1]);
        expect(expandEventTypes[1]).toBe('click');
        expect(onExpandedRowsChange.mock.calls[1][0]).toHaveLength(2);
        expect(getExpandedRowKeys()).toEqual(['0', '1']);
        await userEvent.click(query(`.${P}-tbody .${P}-row-expanded`));
        expect(getExpandedRowKeys()).toEqual(['1']);
    });

    it('展开行重新渲染', async () => {
        const expandedRow = vi.fn<(props: TableExpandedRowSlotProps) => VNode[]>(() => [<div>Semi Design</div>]);
        mountTable({ columns: getColumns(), dataSource: data }, { expandedRow });
        const expandIcons = getExpandButtons();
        await userEvent.click(expandIcons[0]);
        await userEvent.click(expandIcons[1]);
        expect(queryAll(`.${P}-row-expand`)).toHaveLength(2);
        expect(expandedRow.mock.calls.map(([props]) => (props as unknown as TableExpandedRowSlotProps).index)).toEqual(expect.arrayContaining([0, 1]));
    });
});

describe('Table 展开回归用例', () => {
    it('fix #1556：显示展开列时，叶子行不额外缩进', async () => {
        const treeData = [
            {
                key: 1,
                name: 'John Brown sr.',
                age: 60,
                children: [
                    { key: 11, name: 'John Brown', age: 42 },
                    { key: 12, name: 'John Brown jr.', age: 30, children: [{ key: 121, name: 'Jimmy', age: 16 }] },
                ],
            },
        ];
        const table = mountTable({
            columns: [
                { title: 'Name', dataIndex: 'name', key: 'name' },
                { title: 'Age', dataIndex: 'age', key: 'age', width: 150 },
            ],
            dataSource: treeData,
            defaultExpandAllRows: true,
            hideExpandedColumn: false,
        });
        await nextTick();
        expect(getIndentClass(11)).toContain('indent-level-1');
        expect(getIndentClass(12)).toContain('indent-level-1');
        await table.update({ props: { hideExpandedColumn: true } });
        expect(getIndentClass(11)).toContain('indent-level-2');
        expect(getIndentClass(12)).toContain('indent-level-1');
    });

    it('fix #2425：expandIcon 为 false 时，children 为空的行不缩进', async () => {
        const treeData = [
            { key: 99, dataKey: 99, name: 'row 99', children: [] },
            {
                key: 2,
                dataKey: 'text_info',
                name: '文本信息',
                children: [{ key: 21, dataKey: 'title', name: '视频标题' }],
            },
        ];
        const table = mountTable({
            columns: [
                { title: 'Key', dataIndex: 'dataKey', key: 'dataKey' },
                { title: '名称', dataIndex: 'name', key: 'name', width: 200 },
            ],
            dataSource: treeData,
            defaultExpandAllRows: true,
            expandIcon: false,
        });
        await nextTick();
        expect(getIndentClass(99)).toBeUndefined();
        expect(getIndentClass(21)).toContain('indent-level-1');
        await table.update({ props: { expandIcon: undefined } });
        expect(getIndentClass(99)).toContain('indent-level-1');
        expect(getIndentClass(21)).toContain('indent-level-2');
    });

    it.each([
        ['FixedExpandGroupRow', false],
        ['FixedDefaultExpandedGroupedRows (fix #2085)', true],
    ])('%s：受控的 expandedRowKeys 展开分组行', async (_, defaultExpandAllGroupRows) => {
        const files = [
            { key: '1', name: 'Semi Design 设计稿.fig', size: '2M' },
            { key: '2', name: 'Semi Design 分享演示文稿', size: '2M' },
            { key: '3', name: '设计文档', size: '34KB' },
        ];
        const table = mountTable(
            {
                columns: [
                    { title: '标题', dataIndex: 'name' },
                    { title: '大小', dataIndex: 'size' },
                ],
                dataSource: [],
                defaultExpandAllGroupRows,
                expandedRowKeys: ['Semi Design 设计稿.fig'],
                groupBy: 'size',
                pagination: false,
                rowKey: 'name',
            },
            {
                ...detail((record) => `detail of ${record.name}`),
                groupSection: ({ groupKey }: { groupKey: string }) => [<strong>{`group ${groupKey}`}</strong>],
            }
        );
        await table.update({ props: { dataSource: files, expandedRowKeys: ['2M', '34KB', 'Semi Design 设计稿.fig'] } });
        expect(queryAll(`.${P}-row-section.on`)).toHaveLength(2);
        expect(getExpandedRowKeys()).toEqual(['Semi Design 设计稿.fig']);
        expect(screen.getByText('detail of Semi Design 设计稿.fig')).toBeInTheDocument();
        expect(screen.queryByText('detail of 设计文档')).not.toBeInTheDocument();
    });
});

describe('Table 展开行为基线', () => {
    it('受控的 expandedRowKeys 报告展开状态，并通过属性渲染', async () => {
        const onExpand = vi.fn<Emit<'expand'>>();
        const onExpandedRowsChange = vi.fn<Emit<'expandedRowsChange'>>();
        const rows = getData(3);
        const table = mountTable(
            {
                columns: getColumns(),
                dataSource: rows,
                expandedRowKeys: [],
                pagination: false,
                onExpand,
                onExpandedRowsChange,
            },
            detail((record) => `detail ${record.name}`)
        );
        await userEvent.click(query(`.${P}-tbody .${P}-expand-icon`));
        expect(onExpand).toHaveBeenLastCalledWith(true, rows[0], expect.anything());
        expect(onExpandedRowsChange).toHaveBeenLastCalledWith([rows[0]]);
        expect(screen.queryByText('detail Edward King 0')).not.toBeInTheDocument();
        await table.update({ props: { expandedRowKeys: ['0'] } });
        expect(screen.getByText('detail Edward King 0')).toBeInTheDocument();
    });

    it('按 childrenRecordName 展开树形数据，并使用 indentSize', async () => {
        mountTable({
            childrenRecordName: 'kids',
            columns: [{ title: 'Name', dataIndex: 'name' }],
            dataSource: [{ key: '1', name: 'parent', kids: [{ key: '1-1', name: 'child' }] }],
            indentSize: 30,
            pagination: false,
        });
        expect(screen.queryByText('child')).not.toBeInTheDocument();
        await userEvent.click(query(`.${P}-tbody .${P}-expand-icon`));
        const childCell = screen.getByText('child').closest('td') as HTMLElement;
        expect(childCell.querySelector(`.${P}-row-indent`)).toHaveStyle({ paddingInlineStart: '60px' });
    });

    it('选择列固定在右侧时，树形缩进与展开按钮只落在第一个数据列', async () => {
        mountTable({
            columns: [{ title: 'Name', dataIndex: 'name' }],
            dataSource: [{ key: '1', name: 'parent', children: [{ key: '1-1', name: 'child' }] }],
            defaultExpandAllRows: true,
            pagination: false,
            rowSelection: { fixed: 'right' },
        });
        await nextTick();
        const selectionCells = queryAll(`.${P}-tbody td.${P}-column-selection`);
        expect(selectionCells).toHaveLength(2);
        for (const cell of selectionCells) {
            expect(cell.querySelector(`.${P}-expand-icon, .${P}-row-indent`)).toBeNull();
        }
        expect((screen.getByText('parent').closest('td') as HTMLElement).querySelector(`.${P}-expand-icon`)).not.toBeNull();
    });

    it('展开行时仅重新渲染显示展开状态的展开按钮', async () => {
        const expandIcon = vi.fn<(props: TableExpandIconSlotProps) => string[]>(({ expanded }) => [expanded ? '-' : '+']);
        mountTable({ columns: [{ title: 'Name', dataIndex: 'name' }], dataSource: getData(5), pagination: false }, { ...detail((record) => `detail ${record.name}`), expandIcon });
        expect(expandIcon).toHaveBeenCalledTimes(5);
        expandIcon.mockClear();
        // fireEvent: a userEvent click also hovers the row
        await fireEvent.click(query(`.${P}-tbody .${P}-expand-icon`));
        expect(screen.getByText('detail Edward King 0')).toBeInTheDocument();
        expect(expandIcon).toHaveBeenCalledTimes(1);
        expect(expandIcon).toHaveBeenCalledWith({ expanded: true });
    });

    it('自定义 rowKey 时展开行的 data-row-key 来自该行的真实 key', async () => {
        const { container } = mountTable(
            {
                columns: [{ title: 'Name', dataIndex: 'name' }],
                dataSource: [{ id: 'a1', name: 'Alpha' }],
                defaultExpandAllRows: true,
                rowKey: 'id',
            },
            { expandedRow: ({ record }: TableExpandedRowSlotProps) => [<span>{`detail-${record.name}`}</span>] }
        );
        await nextTick();
        expect(container.querySelector(`.${P}-row-expand`)).toHaveAttribute('data-row-key', 'a1-expanded-row');
    });

    it('展开按钮是 Tab 停靠点，并报告所在行是否展开', async () => {
        mountTable({
            columns: [{ title: 'Name', dataIndex: 'name' }],
            dataSource: [
                { key: '1', name: 'parent', children: [{ key: '1-1', name: 'child' }] },
                { key: '2', name: 'single' },
            ],
            pagination: false,
        });
        await userEvent.tab();
        const expand = screen.getByRole('button', { name: zh_CN.Table.expandRow });
        expect(expand).toHaveFocus();
        expect(expand).toHaveAttribute('aria-expanded', 'false');
        await userEvent.keyboard('{Enter}');
        expect(expand).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('cell', { name: 'child' })).toBeInTheDocument();
    });

    it('#expandIcon 渲染文本时显示该文本，为空时回落默认图标', async () => {
        const rows = [{ key: '1', name: 'Ann' }];
        const custom = ref(true);
        mountTable(
            { columns: [{ title: 'Name', dataIndex: 'name' }], dataSource: rows, pagination: false },
            {
                expandedRow: () => ['detail'],
                expandIcon: ({ expanded }: { expanded: boolean }) => (custom.value ? [expanded ? '-' : '+'] : []),
            }
        );
        const button = screen.getByRole('button', { name: zh_CN.Table.expandRow });
        expect(button).toHaveTextContent('+');
        await userEvent.click(button);
        expect(button).toHaveTextContent('-');
        custom.value = false;
        await nextTick();
        const fallback = screen.getByRole('button', { name: zh_CN.Table.expandRow });
        expect(fallback.textContent).toBe('');
        expect(fallback.querySelector('svg')).not.toBeNull();
    });
});

describe('Table 展开 Vue 写法', () => {
    it('v-model:expandedRowKeys 双向绑定', async () => {
        render(ExpandedRow);
        expect(screen.getByText('detail Ann')).toBeInTheDocument();
        await userEvent.click(getExpandButtons()[1]);
        expect(screen.getByTestId('keys')).toHaveTextContent('1,2');
        expect(screen.getByText('detail Bob')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'expand Bob' }));
        expect(screen.queryByText('detail Ann')).not.toBeInTheDocument();
        expect(screen.getByText('detail Bob')).toBeInTheDocument();
    });

    it('update:expandedRowKeys 的载荷包含已展开的分组 key', async () => {
        const onUpdate = vi.fn<Emit<'update:expandedRowKeys'>>();
        mountTable(
            {
                columns: [{ title: '标题', dataIndex: 'name' }],
                dataSource: [
                    { key: '1', name: 'a.fig', size: '2M' },
                    { key: '2', name: 'b.fig', size: '34KB' },
                ],
                defaultExpandAllGroupRows: true,
                groupBy: 'size',
                pagination: false,
                'onUpdate:expandedRowKeys': onUpdate,
            },
            {
                ...detail((record) => `detail of ${record.name}`),
                groupSection: ({ groupKey }: { groupKey: string }) => [<strong>{`group ${groupKey}`}</strong>],
            }
        );
        await nextTick();
        await userEvent.click(query(`.${P}-tbody .${P}-row:not(.${P}-row-section) .${P}-expand-icon`));
        expect(onUpdate).toHaveBeenLastCalledWith(expect.arrayContaining(['1', '2M', '34KB']));
        expect(onUpdate.mock.lastCall?.[0]).toHaveLength(3);
    });

    it('#expandedRow 插槽的增删切换展开列中的展开按钮与展开行，模板写法无告警', async () => {
        const warn = vi.spyOn(console, 'warn');
        const view = render(ExpandedRow, { props: { withExpandedRow: false } });
        expect(queryAll(`.${P}-thead .${P}-column-expand`)).toHaveLength(1);
        expect(getExpandButtons()).toHaveLength(0);
        await view.rerender({ withExpandedRow: true });
        expect(getExpandButtons()).toHaveLength(2);
        expect(screen.getByText('detail Ann')).toBeInTheDocument();
        await view.rerender({ withExpandedRow: false });
        expect(queryAll(`.${P}-thead .${P}-column-expand`)).toHaveLength(1);
        expect(getExpandButtons()).toHaveLength(0);
        expect(screen.queryByText('detail Ann')).not.toBeInTheDocument();
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it.each([false, true])('resizable 为 %s 时 v-if 切换 #expandedRow，展开按钮与展开行随之出现和消失', async (resizable) => {
        const view = render(ExpandedRow, { props: { withExpandedRow: false, resizable } });
        // a resizable table renders as NormalTable until its chunk loads
        await waitFor(() => expect(queryAll(`.${P}-thead .${P}-resize-handle`).length > 0).toBe(resizable));
        expect(getExpandButtons()).toHaveLength(0);
        await view.rerender({ withExpandedRow: true, resizable });
        expect(getExpandButtons()).toHaveLength(2);
        expect(screen.getByText('detail Ann')).toBeInTheDocument();
        await view.rerender({ withExpandedRow: false, resizable });
        expect(getExpandButtons()).toHaveLength(0);
        expect(screen.queryByText('detail Ann')).not.toBeInTheDocument();
    });

    it('@expandedRowsChange 回调里读 v-model:expandedRowKeys 绑定的值是新值', async () => {
        render(ExpandedRow);
        await userEvent.click(getExpandButtons()[1]);
        expect(screen.getByTestId('keys-in-change')).toHaveTextContent('1,2');
    });

    it('#expandedRow 渲染纯文本时显示该文本，渲染为空时该行不输出', async () => {
        mountTable(
            {
                columns: [{ title: 'Name', dataIndex: 'name' }],
                dataSource: getData(2),
                defaultExpandAllRows: true,
                pagination: false,
            },
            { expandedRow: ({ record }: TableExpandedRowSlotProps) => (record.key === '0' ? ['plain text'] : []) }
        );
        await nextTick();
        expect(queryAll(`.${P}-row-expand`)).toHaveLength(1);
        expect(query(`.${P}-row-expand`)).toHaveTextContent('plain text');
        expect(query(`.${P}-row-expand`)).toHaveAttribute('data-row-key', '0-expanded-row');
    });
});

describe('Table expandRowByClick 只作用于可展开的行', () => {
    const columns = () => [{ title: 'Name', dataIndex: 'name' }];

    it('rowExpandable 为假的行点击不展开，不触发 expand', async () => {
        const onExpand = vi.fn<Emit<'expand'>>();
        const dataSource = [
            { key: '1', name: 'Ann' },
            { key: '2', name: 'Bob' },
        ];
        mountTable({ columns: columns(), dataSource, expandRowByClick: true, onExpand, pagination: false, rowExpandable: (record: Row) => record.key !== '2' }, { expandedRow: ({ record }: TableExpandedRowSlotProps) => [<p>{`detail ${record.name}`}</p>] });
        await userEvent.click(screen.getByText('Bob'));
        expect(onExpand).not.toHaveBeenCalled();
        expect(screen.queryByText('detail Bob')).not.toBeInTheDocument();
        await userEvent.click(screen.getByText('Ann'));
        expect(onExpand).toHaveBeenCalledTimes(1);
    });

    it('树形数据的叶子行点击不触发 expand', async () => {
        const onExpand = vi.fn<Emit<'expand'>>();
        mountTable({ columns: columns(), dataSource: [{ key: 'p', name: 'parent', children: [{ key: 'c', name: 'child' }] }], defaultExpandAllRows: true, expandRowByClick: true, onExpand, pagination: false });
        await userEvent.click(await screen.findByText('child'));
        expect(onExpand).not.toHaveBeenCalled();
    });
});

describe('Table 虚拟化展开行', () => {
    it('rowExpandable 为假的行没有展开行', async () => {
        const expandedRow = vi.fn<(props: TableExpandedRowSlotProps) => VNode[]>(({ record }) => [<p>{`detail ${record.name}`}</p>]);
        mountTable({ columns: [{ title: 'Name', dataIndex: 'name', width: 200 }], dataSource: getData(3), defaultExpandAllRows: true, pagination: false, rowExpandable: (record: Row) => record.key !== '1', scroll: { y: 300 }, virtualized: true }, { expandedRow });
        await waitFor(() => expect(query('[data-row-key="0-expanded-row"]')).toBeInTheDocument());
        expect(query('[data-row-key="1-expanded-row"]')).toBeNull();
        expect(expandedRow.mock.calls.every(([props]) => props.record.key !== '1')).toBe(true);
    });
});

describe('Table 受控值撤销后回到非受控', () => {
    const rows = () => [
        { key: '1', name: 'Ann' },
        { key: '2', name: 'Bob' },
    ];
    const columns = () => [{ title: 'Name', dataIndex: 'name' }];

    it('expandedRowKeys 撤销后不再展开', async () => {
        const table = mountTable({ columns: columns(), dataSource: rows(), expandedRowKeys: ['1'], pagination: false }, { expandedRow: ({ record }: TableExpandedRowSlotProps) => [<p>{`detail ${record.name}`}</p>] });
        expect(screen.getByText('detail Ann')).toBeInTheDocument();
        await table.update({ props: { expandedRowKeys: undefined } });
        expect(screen.queryByText('detail Ann')).not.toBeInTheDocument();
    });

    it('rowSelection.selectedRowKeys 撤销后不再选中', async () => {
        const table = mountTable({ columns: columns(), dataSource: rows(), pagination: false, rowSelection: { selectedRowKeys: ['1'] } });
        expect(screen.getAllByRole('checkbox')[1]).toBeChecked();
        await table.update({ props: { rowSelection: {} } });
        expect(screen.getAllByRole('checkbox')[1]).not.toBeChecked();
    });
});
