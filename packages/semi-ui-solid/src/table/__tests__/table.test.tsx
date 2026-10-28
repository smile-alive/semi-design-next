import { For, type JSX, createSignal } from 'solid-js';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconStar } from '@fibrae/semi-icons-solid';
import { endLeaveAnimations, getData, getNestData, getRandomNumber, getTreeData } from '@test/utils/solid';
import Table from '..';
import Tag from '../../tag';
import Tooltip from '../../tooltip';
import type { ColumnProps, TableHandle, TableProps } from '../interface';
import { P, containsSelector, getActivePage, getBodyRows, getColumns, getExpandedRowKeys, getFirstCellText, getHeaderSelectionCheckbox, getJSXColumns, getNestColumns, getPageItems, query, queryAll } from './table-helpers';

type TableChange = NonNullable<TableProps['onChange']>;
type RowSelectionConfig = Extract<TableProps['rowSelection'], object>;
type SelectionChange = NonNullable<RowSelectionConfig['onChange']>;
type SelectChange = NonNullable<RowSelectionConfig['onSelect']>;
type SelectAllChange = NonNullable<RowSelectionConfig['onSelectAll']>;

const data = getData(46);
const columns = getColumns();

async function expectAppearance({ onRow, myCls, myClsIndex }: { onRow: ReturnType<typeof vi.fn>; myCls: string; myClsIndex: number }) {
    expect(queryAll(`.${P}-wrapper`)).toHaveLength(1);
    expect(queryAll(`.${P}-title`)).toHaveLength(1);
    expect(queryAll(`.${P}-footer`)).toHaveLength(1);
    expect(onRow).toHaveBeenCalled();
    const rows = getBodyRows();
    expect(rows[0]).not.toHaveClass(myCls);
    expect(rows.findLastIndex((row) => row.classList.contains(myCls))).toBe(myClsIndex);
    expect(queryAll(`.${P}-pagination-outer`)).toHaveLength(1);
    const curPage = 2;
    await userEvent.click(queryAll(`.${BASE_CLASS_PREFIX}-page-item`)[curPage]);
    expect(getActivePage()).toHaveTextContent(new RegExp(`^${curPage}$`));
}

describe('Table', () => {
    it('JSX 列的外观', async () => {
        const myCls = 'my-tr-class';
        const myClsIndex = 2;
        const onRow = vi.fn<NonNullable<TableProps['onRow']>>((_record, index) => ({ class: index === myClsIndex ? myCls : '' }));
        const [version, setVersion] = createSignal(0);
        render(() => (
            <Table title={() => 'Table Title'} dataSource={data} footer={() => 'Table Footer'} onRow={onRow}>
                {(version(), getJSXColumns())}
            </Table>
        ));
        await expectAppearance({ onRow, myCls, myClsIndex });
        setVersion(1);
        await expectAppearance({ onRow, myCls, myClsIndex });
    });

    it('对象列的外观', async () => {
        const myCls = 'my-tr-class';
        const myClsIndex = 2;
        const onRow = vi.fn<NonNullable<TableProps['onRow']>>((_record, index) => ({ class: index === myClsIndex ? myCls : '' }));
        const [cols, setCols] = createSignal(getColumns());
        render(() => <Table title={() => 'Table Title'} columns={cols()} dataSource={data} footer={() => 'Table Footer'} onRow={onRow} />);
        await expectAppearance({ onRow, myCls, myClsIndex });
        setCols(getColumns());
        await expectAppearance({ onRow, myCls, myClsIndex });
    });

    it('dataSource 变化后的外观', async () => {
        const myCls = 'my-tr-class';
        const myClsIndex = 2;
        const onRow = vi.fn<NonNullable<TableProps['onRow']>>((_record, index) => ({ class: index === myClsIndex ? myCls : '' }));
        const [dataSource, setDataSource] = createSignal(getData(25));
        render(() => <Table title={() => 'Table Title'} columns={columns} dataSource={dataSource()} footer={() => 'Table Footer'} onRow={onRow} />);
        await expectAppearance({ onRow, myCls, myClsIndex });
        setDataSource(getData(getRandomNumber(100, 40)));
        await expectAppearance({ onRow, myCls, myClsIndex });
    });

    it('选择功能', async () => {
        const selectedRowKeys = ['0'];
        const rowKey = 'key';
        const disabledKeys = ['4'];
        const onChange = vi.fn<SelectionChange>();
        const onSelectAll = vi.fn<SelectAllChange>();
        const getCheckboxProps = vi.fn<NonNullable<RowSelectionConfig['getCheckboxProps']>>((record) => ({ disabled: disabledKeys.includes(record[rowKey]), name: record.name }));
        const onSelect = vi.fn<SelectChange>();

        function Demo() {
            const [keys, setKeys] = createSignal<(string | number)[]>(['3']);
            return (
                <Table
                    columns={getColumns()}
                    dataSource={data}
                    rowKey={rowKey}
                    rowSelection={{
                        onChange: (keys, rows) => {
                            onChange(keys, rows);
                            setKeys([...(keys ?? [])]);
                        },
                        onSelectAll: (selected, selectedRows, changedRows, e) => {
                            onSelectAll(selected, selectedRows, changedRows, e);
                            setKeys(selected ? [...selectedRowKeys] : []);
                        },
                        getCheckboxProps,
                        onSelect,
                        selectedRowKeys: keys(),
                        defaultSelectedRowKeys: ['0', '1'],
                    }}
                />
            );
        }

        render(() => <Demo />);
        const expectRowsCheckedBy = (keys: unknown[]) =>
            getBodyRows().forEach((row) => {
                const checked = row.querySelector(`.${BASE_CLASS_PREFIX}-checkbox-inner-checked`) !== null;
                expect(checked).toBe(keys.includes(row.getAttribute('data-row-key')));
            });
        expect(queryAll(`.${BASE_CLASS_PREFIX}-checkbox`).length).toBeGreaterThan(0);
        expect(queryAll(`.${P}-row .${BASE_CLASS_PREFIX}-checkbox-inner-checked`)).toHaveLength(1);
        expectRowsCheckedBy(['3']);
        expect(queryAll(`.${P}-thead .${BASE_CLASS_PREFIX}-checkbox-indeterminate`)).toHaveLength(1);
        queryAll(`.${P}-tbody .${BASE_CLASS_PREFIX}-checkbox`)
            .filter((_el, index) => disabledKeys.includes(index.toString()))
            .forEach((el) => expect(el).toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-disabled`));
        await userEvent.click(query(`.${P}-row .${BASE_CLASS_PREFIX}-checkbox-disabled`));
        expect(onSelect).not.toHaveBeenCalled();
        await userEvent.click(query(`.${P}-tbody .${P}-row .${BASE_CLASS_PREFIX}-checkbox`));
        expect(onSelect).toHaveBeenCalledTimes(1);
        await userEvent.click(getHeaderSelectionCheckbox());
        expect(onSelectAll).toHaveBeenCalledTimes(1);
        expectRowsCheckedBy(onChange.mock.lastCall?.[0] ?? []);
        expect(queryAll(`.${P}-thead .${BASE_CLASS_PREFIX}-checkbox-inner-checked`)).toHaveLength(1);
        await userEvent.click(getHeaderSelectionCheckbox());
        expect(onSelectAll).toHaveBeenCalledTimes(2);
        expectRowsCheckedBy([]);
        expect(queryAll(`.${P}-thead .${BASE_CLASS_PREFIX}-checkbox-inner-checked`)).toHaveLength(0);
        expect(queryAll(`.${P}-thead .${BASE_CLASS_PREFIX}-checkbox-indeterminate`)).toHaveLength(0);
    });

    it('数据变化后的选择功能', async () => {
        const selectedRowKeys = ['0'];
        const rowKey = 'key';
        const disabledKeys = ['4'];
        const onSelectAll = vi.fn<SelectAllChange>();
        const getCheckboxProps = vi.fn<NonNullable<RowSelectionConfig['getCheckboxProps']>>((record) => ({ disabled: disabledKeys.includes(record[rowKey]), name: record.name }));
        const onSelect = vi.fn<SelectChange>();
        const [dataSource, setDataSource] = createSignal(data);

        function Demo() {
            const [keys, setKeys] = createSignal<string[]>();
            return (
                <Table
                    columns={getColumns()}
                    dataSource={dataSource()}
                    rowKey={rowKey}
                    rowSelection={{
                        onSelectAll: (selected, selectedRows, changedRows, e) => {
                            onSelectAll(selected, selectedRows, changedRows, e);
                            setKeys(selected ? [...selectedRowKeys] : []);
                        },
                        getCheckboxProps,
                        onSelect,
                        ...(keys() && { selectedRowKeys: keys() }),
                    }}
                />
            );
        }

        render(() => <Demo />);
        setDataSource(getData(50));
        await userEvent.click(query(`.${P}-row .${BASE_CLASS_PREFIX}-checkbox-disabled`));
        expect(onSelect).not.toHaveBeenCalled();
        await userEvent.click(query(`.${P}-tbody .${P}-row .${BASE_CLASS_PREFIX}-checkbox`));
        expect(onSelect).toHaveBeenCalledTimes(1);
        await userEvent.click(getHeaderSelectionCheckbox());
        expect(onSelectAll).toHaveBeenCalledTimes(1);
        await userEvent.click(getHeaderSelectionCheckbox());
        expect(onSelectAll).toHaveBeenCalledTimes(2);
    });

    it('expandedRowRender 与 fixed', () => {
        const rowKey = 'key';
        const unexpandableKey = '2';
        const [dataSource, setDataSource] = createSignal(data);
        render(() => (
            <Table
                columns={columns}
                dataSource={dataSource()}
                defaultExpandAllRows
                expandCellFixed
                hideExpandedColumn={false}
                rowExpandable={(record) => record[rowKey] !== unexpandableKey}
                rowKey={rowKey}
                scroll={{ x: '160%', y: 320 }}
                expandedRowRender={(record) => (
                    <article style={{ margin: 0 }}>
                        <p>{record.description}</p>
                    </article>
                )}
            />
        ));
        expect(queryAll(`.${P}-cell-fixed-left`).length).toBeGreaterThan(0);
        expect(queryAll(`.${P}-cell-fixed-right`).length).toBeGreaterThan(0);
        expect(queryAll(`.${P}-cell-fixed-left.${P}-column-expand`).length).toBeGreaterThan(0);
        setDataSource(getData(50));
        expect(queryAll(`.${P}-cell-fixed-left.${P}-column-expand`).length).toBeGreaterThan(0);
    });

    it('树形数据', async () => {
        const rowKey = 'key';
        const childrenData = getTreeData();
        let expandedRowKeys: (string | number)[] = [1];
        const onExpand = vi.fn<NonNullable<TableProps['onExpand']>>((expanded, record) => {
            const keySet = new Set(expandedRowKeys);
            if (expanded) {
                keySet.add(record[rowKey]);
            } else {
                keySet.delete(record[rowKey]);
            }
            expandedRowKeys = Array.from(keySet);
        });

        function Demo() {
            const [keys, setKeys] = createSignal(expandedRowKeys);
            return (
                <Table
                    childrenRecordName="children"
                    columns={columns}
                    dataSource={childrenData}
                    expandedRowKeys={keys()}
                    rowKey={rowKey}
                    onExpand={(...args) => {
                        onExpand(...args);
                        setKeys(expandedRowKeys);
                    }}
                />
            );
        }

        render(() => <Demo />);
        const getExpandIcons = () => queryAll(`.${P}-body .${P}-row .${P}-expand-icon`);
        expect(getBodyRows()).toHaveLength((childrenData[0].children?.length ?? 0) + childrenData.length);
        await userEvent.click(getExpandIcons()[1]);
        expect(onExpand).toHaveBeenCalledTimes(1);
        expect(expandedRowKeys).toEqual([1, 12]);
        expect(getExpandedRowKeys()).toEqual(['1', '12']);
        await userEvent.click(getExpandIcons()[0]);
        expect(onExpand).toHaveBeenCalledTimes(2);
        expect(expandedRowKeys).toEqual([12]);
        expect(getExpandedRowKeys()).toEqual([]);
        expect(getBodyRows().map((row) => row.getAttribute('data-row-key'))).toEqual(['1', '2']);
    });

    it('事件：分页、筛选、排序', async () => {
        const eventColumns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                width: 150,
                filters: [
                    { text: '名字包含"1"', value: '1' },
                    { text: '名字包含"2"', value: '2' },
                ],
                onFilter: (value, record) => record.name.indexOf(value) > -1,
            },
            { title: 'Age', dataIndex: 'age', width: 150, sorter: (a, b) => (a.age - b.age > 0 ? 1 : -1) },
            { title: 'Address', dataIndex: 'address' },
            {
                render: (_text, record) => (
                    <Tooltip content={record.description}>
                        <Tag color="green">Show Info</Tag>
                    </Tooltip>
                ),
                width: 150,
            },
        ];
        let onChangeCalledCount = 0;
        const onChange = vi.fn<TableChange>();
        render(() => <Table columns={eventColumns} dataSource={data} onChange={onChange} />);
        await userEvent.click(query(`.${P}-thead .${P}-column-filter`));
        await waitFor(() => expect(queryAll(`.${BASE_CLASS_PREFIX}-dropdown`)).toHaveLength(1));
        expect(onChange).toHaveBeenCalledTimes(onChangeCalledCount);
        const getFirstFilterCheckbox = () => query(`.${BASE_CLASS_PREFIX}-dropdown .${BASE_CLASS_PREFIX}-dropdown-item .${BASE_CLASS_PREFIX}-checkbox`);
        await userEvent.click(getFirstFilterCheckbox());
        expect(onChange).toHaveBeenCalledTimes(++onChangeCalledCount);
        await userEvent.click(getFirstFilterCheckbox());
        expect(onChange).toHaveBeenCalledTimes(++onChangeCalledCount);
        await userEvent.click(getPageItems()[2]);
        expect(onChange).toHaveBeenCalledTimes(++onChangeCalledCount);
        await userEvent.click(getPageItems()[1]);
        expect(onChange).toHaveBeenCalledTimes(++onChangeCalledCount);
        await userEvent.click(query(`.${P}-thead .${P}-column-sorter`));
        expect(onChange).toHaveBeenCalledTimes(++onChangeCalledCount);
    });

    it('排序不改变 dataSource 属性的顺序', () => {
        const dataSource = [
            { key: '3', name: 'row-3', age: 30 },
            { key: '1', name: 'row-1', age: 10 },
            { key: '2', name: 'row-2', age: 20 },
        ];
        const sortColumns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name' },
            { title: 'Age', dataIndex: 'age', sorter: (a, b) => a.age - b.age, defaultSortOrder: 'ascend' },
        ];
        const [rows, setRows] = createSignal(dataSource);
        render(() => <Table columns={sortColumns} dataSource={rows()} pagination={false} />);
        const getRenderedNames = () => getBodyRows().map((row) => row.querySelector(`.${P}-row-cell`)?.textContent);
        expect(getRenderedNames()).toEqual(['row-1', 'row-2', 'row-3']);
        expect(dataSource.map((record) => record.key)).toEqual(['3', '1', '2']);
        const nextDataSource = [{ key: '5', name: 'row-5', age: 50 }, ...dataSource];
        setRows(nextDataSource);
        expect(getRenderedNames()).toEqual(['row-1', 'row-2', 'row-3', 'row-5']);
        expect(nextDataSource.map((record) => record.key)).toEqual(['5', '3', '1', '2']);
    });

    it('筛选，并在已有筛选下更新 dataSource', async () => {
        const filterColumns: ColumnProps[] = [
            {
                class: 'name-col',
                title: 'Name',
                dataIndex: 'name',
                width: 150,
                filters: [
                    { text: '名字包含"1"', value: '1' },
                    { text: '名字包含"2"', value: '2' },
                ],
                onFilter: (value, record) => record.name.indexOf(value) > -1,
            },
            { title: 'Age', dataIndex: 'age', width: 150, sorter: (a, b) => (a.age - b.age > 0 ? 1 : -1) },
            { title: 'Address', dataIndex: 'address' },
        ];
        const [dataSource, setDataSource] = createSignal(data);
        render(() => <Table columns={filterColumns} dataSource={dataSource()} pagination={false} />);
        await userEvent.click(query(`.${P}-thead .${P}-column-filter`));
        await userEvent.click(
            await waitFor(() => {
                const checkbox = query(`.${BASE_CLASS_PREFIX}-dropdown .${BASE_CLASS_PREFIX}-dropdown-item .${BASE_CLASS_PREFIX}-checkbox`);
                expect(checkbox).not.toBeNull();
                return checkbox;
            })
        );
        expect(queryAll(`.${P}-tbody .name-col`)).toHaveLength(data.filter((item) => item.name.indexOf('1') > -1).length);
        const newData = getData(10);
        setDataSource(newData);
        expect(queryAll(`.${P}-tbody .name-col`)).toHaveLength(newData.filter((item) => item.name.indexOf('1') > -1).length);
    });

    it('自定义筛选面板的 reset 把临时筛选值还原为已生效的值', async () => {
        const filterColumns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: (value, record) => record.name.includes(value),
                renderFilterDropdown: (props) => (
                    <div>
                        <span data-testid="temp-value">{(props.tempFilteredValue ?? []).join(',')}</span>
                        <button type="button" onClick={() => props.setTempFilteredValue(['1'])}>
                            选择 1
                        </button>
                        <button type="button" onClick={() => props.reset()}>
                            还原
                        </button>
                    </div>
                ),
            },
        ];
        render(() => <Table columns={filterColumns} dataSource={data} pagination={false} />);
        await userEvent.click(query(`.${P}-column-filter`));
        await userEvent.click(await screen.findByRole('button', { name: '选择 1' }));
        expect(screen.getByTestId('temp-value')).toHaveTextContent('1');
        await userEvent.click(screen.getByRole('button', { name: '还原' }));
        expect(screen.getByTestId('temp-value').textContent).toBe('');
    });

    it('受控的 dataSource 和 columns', async () => {
        const initialColumns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                width: 150,
                filters: [
                    { text: '名字包含"1"', value: '1' },
                    { text: '名字包含"2"', value: '2' },
                ],
                onFilter: (value, record) => record.name.indexOf(value) > -1,
            },
            { title: 'Age', dataIndex: 'age', width: 150, sorter: true },
            { title: 'Address', dataIndex: 'address' },
            {
                render: (_text, record) => (
                    <Tooltip content={record.description}>
                        <Tag color="green">Show Info</Tag>
                    </Tooltip>
                ),
                width: 150,
            },
        ];
        const onChange = vi.fn<TableChange>();

        function Demo() {
            const [pagination, setPagination] = createSignal({ currentPage: 1, total: data.length, pageSize: 10 });
            const [cols, setCols] = createSignal(initialColumns);
            const currentData = () => data.slice((pagination().currentPage - 1) * pagination().pageSize, pagination().currentPage * pagination().pageSize);
            const handleChange: TableChange = (changeInfo) => {
                onChange(changeInfo);
                const tablePagination = changeInfo.pagination;
                if (tablePagination && tablePagination.currentPage !== pagination().currentPage) {
                    setPagination({ ...pagination(), currentPage: tablePagination.currentPage as number });
                    setCols([...cols()]);
                }
            };
            return <Table columns={cols()} dataSource={currentData()} pagination={pagination()} onChange={handleChange} />;
        }

        render(() => <Demo />);
        await userEvent.click(getPageItems()[2]);
        expect(onChange).toHaveBeenCalled();
        expect(getPageItems()[2]).toHaveClass(`${BASE_CLASS_PREFIX}-page-item-active`);
    });

    const sortTestColumns = (sortOrder: ColumnProps['sortOrder']): ColumnProps[] => [
        { title: 'Name', dataIndex: 'name', sorter: (a, b) => a.name.length - b.name.length, sortOrder },
        { title: 'Age', dataIndex: 'age' },
        { title: 'Address', dataIndex: 'address' },
    ];
    const sortData = [
        { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park' },
        { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
        { key: '3', name: 'Joe Black', age: 32, address: 'Sidney No. 1 Lake Park' },
        { key: '4', name: 'Jim Red', age: 32, address: 'London No. 2 Lake Park' },
    ];

    it('sortOrder 为 descend', () => {
        render(() => <Table columns={sortTestColumns('descend')} dataSource={sortData} />);
        expect(getFirstCellText()).toBe(sortData.reduce((a, b) => (a.name.length > b.name.length ? a : b)).name);
    });

    it('sortOrder 为 ascend', () => {
        render(() => <Table columns={sortTestColumns('ascend')} dataSource={sortData} />);
        expect(getFirstCellText()).toBe(sortData.reduce((a, b) => (a.name.length < b.name.length ? a : b)).name);
    });

    it('受控的 sortOrder', () => {
        const controlledData = [
            { key: '1', name: 'long name', age: 32, address: 'New York No. 1 Lake Park' },
            { key: '2', name: 'longest name', age: 42, address: 'London No. 1 Lake Park' },
            { key: '3', name: 'longer name', age: 32, address: 'Sidney No. 1 Lake Park' },
            { key: '4', name: 'short', age: 32, address: 'London No. 2 Lake Park' },
        ];
        const [cols, setCols] = createSignal(sortTestColumns('descend'));
        render(() => <Table columns={cols()} dataSource={controlledData} />);
        expect(getFirstCellText()).toBe('longest name');
        setCols(sortTestColumns('ascend'));
        expect(getFirstCellText()).toBe('short');
        setCols(sortTestColumns(false));
        expect(getFirstCellText()).toBe(controlledData[0].name);
    });

    it('所有行都禁用时的全选', async () => {
        const rowSelection = {
            onSelectAll: vi.fn<SelectAllChange>(),
            getCheckboxProps: vi.fn<NonNullable<RowSelectionConfig['getCheckboxProps']>>((record) => ({ disabled: true, name: record.name })),
        };
        render(() => (
            <Table
                columns={[
                    { title: 'Name', dataIndex: 'name', width: 150 },
                    { title: 'Age', dataIndex: 'age', width: 150 },
                    { title: 'Address', dataIndex: 'address' },
                ]}
                dataSource={data}
                rowSelection={rowSelection}
            />
        ));
        await userEvent.click(getHeaderSelectionCheckbox());
        expect(rowSelection.onSelectAll.mock.calls[0][1]).toHaveLength(0);
    });

    it('JSX 异步数据', () => {
        const asyncData = [
            { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park, New York No. 1 Lake Park' },
            { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
            { key: '3', name: 'Joe Black', age: 32, address: 'Sidney No. 1 Lake Park' },
            { key: '4', name: 'Michael James', age: 99, address: 'Sidney No. 1 Lake Park' },
        ];
        const [dataSource, setDataSource] = createSignal<typeof asyncData>([]);
        render(() => (
            <Table dataSource={dataSource()}>
                <Table.Column key="name" title="Name" dataIndex="name" render={(text) => <a href="https://semi.design">{text}</a>} />
                <Table.Column key="age" title="Age" dataIndex="age" />
                <Table.Column key="address" title="Address" dataIndex="address" />
            </Table>
        ));
        setDataSource(asyncData);
        expect(queryAll(`.${P}-thead .${P}-row-head`)).toHaveLength(3);
        expect(getBodyRows()).toHaveLength(4);
        expect(getBodyRows().map((row) => row.getAttribute('data-row-key'))).toEqual(['1', '2', '3', '4']);
    });

    it('Fragment 里的 Table.Column 与直接写出的列同样成为列', () => {
        const rows = [{ key: '1', name: 'Ann', age: 20 }];
        render(() => (
            <Table dataSource={rows} pagination={false}>
                <Table.Column title="Name" dataIndex="name" />
                <>
                    <Table.Column title="Age" dataIndex="age" />
                    {false}
                </>
            </Table>
        ));
        expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Name', 'Age']);
        expect(getBodyRows()[0].textContent).toBe('Ann20');
    });

    it('返回 Table.Column 的包装组件被识别为列', () => {
        const WrappedColumn = (props: { title: string; dataIndex: string }) => <Table.Column title={props.title} dataIndex={props.dataIndex} />;
        const rows = [{ key: '1', name: 'Ann' }];
        render(() => (
            <Table dataSource={rows} pagination={false}>
                <WrappedColumn title="Name" dataIndex="name" />
            </Table>
        ));
        expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Name']);
        expect(getBodyRows()[0].textContent).toBe('Ann');
    });

    it('JSX 列的 key 保持原样，无 key 的列使用默认 key', () => {
        const keys: unknown[] = [];
        const onHeaderCell = (column?: ColumnProps) => {
            keys.push(column?.key);
            return {};
        };
        render(() => (
            <Table dataSource={[{ key: '1', name: 'Ann', age: 20, city: 'X' }]} pagination={false}>
                <Table.Column key="name" title="Name" dataIndex="name" onHeaderCell={onHeaderCell} />
                <>
                    <Table.Column key="age" title="Age" dataIndex="age" onHeaderCell={onHeaderCell} />
                    <Table.Column title="City" dataIndex="city" onHeaderCell={onHeaderCell} />
                </>
            </Table>
        ));
        expect(keys).toContain('name');
        expect(keys).toContain('age');
        expect(keys).toContain('0-city');
    });

    it('单元格对齐', () => {
        render(() => <Table columns={getColumns().map((column) => ({ ...column, align: 'right' as const }))} dataSource={data} />);
        expect(queryAll(`.${P}-align-right`).length).toBeGreaterThan(0);
        const bodyAlignCells = queryAll(`.${P}-row-cell`);
        expect(bodyAlignCells.length).toBeGreaterThan(0);
        bodyAlignCells.forEach((cell) => expect(cell).toHaveStyle({ 'text-align': 'right' }));
    });

    it('列 class', () => {
        render(() => <Table columns={getColumns().map((column) => ({ ...column, class: 'test' }))} dataSource={data} />);
        const titleCells = queryAll(`.${P}-row-head`);
        const bodyCells = queryAll(`.${P}-row-cell`);
        expect(titleCells.length).toBeGreaterThan(0);
        expect(bodyCells.length).toBeGreaterThan(0);
        titleCells.forEach((cell) => expect(cell).toHaveClass('test'));
        bodyCells.forEach((cell) => expect(cell).toHaveClass('test'));
    });

    it('表头外观', () => {
        const { unmount } = render(() => <Table columns={getColumns()} dataSource={data} scroll={{ y: 500 }} />);
        expect(queryAll(`.${P}-thead`)).toHaveLength(1);
        unmount();
        const [showHeader, setShowHeader] = createSignal(true);
        render(() => (
            <Table dataSource={data} showHeader={showHeader()}>
                {getJSXColumns()}
            </Table>
        ));
        expect(queryAll(`.${P}-thead`)).toHaveLength(1);
        setShowHeader(false);
        expect(queryAll(`.${P}-thead`)).toHaveLength(0);
    });

    it('ref 的 getCurrentPageData', () => {
        const pageSize = 10;
        let handle: TableHandle | undefined;
        render(() => <Table ref={(h: TableHandle) => (handle = h)} columns={getColumns()} dataSource={data} pagination={{ pageSize }} />);
        expect(handle?.getCurrentPageData().dataSource).toHaveLength(pageSize);
        let jsxHandle: TableHandle | undefined;
        render(() => (
            <Table ref={(h: TableHandle) => (jsxHandle = h)} dataSource={data} pagination={{ pageSize }}>
                {getJSXColumns()}
            </Table>
        ));
        expect(jsxHandle?.getCurrentPageData().dataSource).toHaveLength(pageSize);
    });

    it('render expandIcon', () => {
        const expandedRowRender = () => <div>Semi Design</div>;
        const { unmount } = render(() => <Table columns={getColumns()} dataSource={data} expandIcon={<IconStar size="small" />} expandedRowRender={expandedRowRender} />);
        expect(queryAll('.semi-icon-star').length).toBeGreaterThan(0);
        unmount();
        render(() => <Table columns={getColumns()} dataSource={data} defaultExpandAllRows expandIcon={(expanded) => <div>{expanded && <IconStar size="small" />}</div>} expandedRowRender={expandedRowRender} />);
        expect(queryAll('.semi-icon-star').length).toBeGreaterThan(0);
    });

    it('onRow / onCell', () => {
        const onRowClick = vi.fn<(e: MouseEvent) => void>();
        const onHeaderRowClick = vi.fn<(e: MouseEvent) => void>();
        const onCellClick = vi.fn<(e: MouseEvent) => void>();
        const onHeaderCellClick = vi.fn<(e: MouseEvent) => void>();
        const onRow = vi.fn<NonNullable<TableProps['onRow']>>(() => ({ class: 'test-row', onClick: onRowClick }));
        const onHeaderRow = vi.fn<NonNullable<TableProps['onHeaderRow']>>(() => ({ class: 'test-row', onClick: onHeaderRowClick }));
        const onCellColumns = getColumns().map((column, index): ColumnProps => {
            const style = index === 0 ? { width: '200px', height: '60px' } : {};
            return { ...column, onCell: () => ({ onClick: onCellClick, style }), onHeaderCell: () => ({ onClick: onHeaderCellClick, style }) };
        });
        render(() => <Table columns={onCellColumns} dataSource={data} onHeaderRow={onHeaderRow} onRow={onRow} />);
        const tableCells = queryAll(`.${P}-body .${P}-row-cell`);
        const tableHeaderCells = queryAll(`.${P}-thead .${P}-row-head`);
        expect(tableCells[0]).toHaveStyle({ width: '200px', height: '60px' });
        expect(tableHeaderCells[0]).toHaveStyle({ width: '200px', height: '60px' });
        fireEvent.click(tableCells[0]);
        expect(onCellClick).toHaveBeenCalled();
        const tableRows = queryAll(`.${P}-body .${P}-row`);
        expect(tableRows[0]).toHaveClass('test-row');
        fireEvent.click(tableRows[0]);
        expect(onRowClick).toHaveBeenCalled();
        fireEvent.click(tableHeaderCells[0]);
        expect(onHeaderCellClick).toHaveBeenCalled();
        const tableHeaderRows = queryAll(`.${P}-thead .${P}-row`);
        expect(tableHeaderRows[0]).toHaveClass('test-row');
        fireEvent.click(tableHeaderRows[0]);
        expect(onHeaderRowClick).toHaveBeenCalled();
    });

    it('点击排序列标题时触发 onHeaderCell.onClick', async () => {
        const onHeaderCellClick = vi.fn<(e: MouseEvent) => void>();
        const sortColumns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name', width: 150 },
            { title: 'Age', dataIndex: 'age', width: 150, sorter: (a, b) => a.age - b.age, onHeaderCell: () => ({ onClick: onHeaderCellClick }) },
        ];
        render(() => <Table columns={sortColumns} dataSource={data} pagination={false} />);
        await userEvent.click(queryAll(`.${P}-thead .${P}-row-head`)[1]);
        expect(onHeaderCellClick).toHaveBeenCalled();
    });

    it('表头合并', () => {
        const testHeaderMerge = (container: HTMLElement) => {
            const rows = container.querySelectorAll(`.${P}-thead .${P}-row`);
            expect(rows).toHaveLength(2);
            const [firstRow, secondRow] = Array.from(rows, (row) => Array.from(row.children) as HTMLTableCellElement[]);
            expect(firstRow[0].colSpan).toEqual(2);
            expect(firstRow[1].colSpan).toEqual(2);
            expect(firstRow[2].colSpan).toEqual(1);
            expect(firstRow[2].rowSpan).toEqual(2);
            expect(secondRow.map((cell) => cell.colSpan)).toEqual([1, 1, 1, 1]);
        };
        const nestData = getNestData();
        const filters = [
            { text: 'Code 45', value: '45' },
            { text: 'King 4', value: 'King 4' },
        ];
        const { container: jsxContainer } = render(() => (
            <Table dataSource={nestData}>
                <Table.Column title="Base Information" dataIndex="base" fixed="left">
                    <Table.Column title="Name" dataIndex="name" filters={filters} fixed="left" width={200} onFilter={(value, record: { name: string }) => record.name.includes(value)} />
                    <Table.Column title="Age" dataIndex="age" fixed="left" sorter={(a: { age: number }, b: { age: number }) => (a.age - b.age > 0 ? 1 : -1)} width={100} />
                </Table.Column>
                <Table.Column title="Company Information" dataIndex="company">
                    <Table.Column title="Company Name" dataIndex="company.name" />
                    <Table.Column title="Company Address" dataIndex="company.address" />
                </Table.Column>
                <Table.Column title="Address" dataIndex="address" fixed="right" width={250} />
            </Table>
        ));
        const { container } = render(() => <Table columns={getNestColumns()} dataSource={nestData} />);
        testHeaderMerge(jsxContainer as HTMLElement);
        testHeaderMerge(container as HTMLElement);
    });

    it('没有 columns', () => {
        const { container: jsxContainer } = render(() => <Table dataSource={data} />);
        const { container } = render(() => <Table columns={[]} dataSource={data} />);
        expect(jsxContainer.querySelectorAll(`.${P}-row-head`)).toHaveLength(0);
        expect(jsxContainer.querySelectorAll(`.${P}-row-cell`)).toHaveLength(0);
        expect(container.querySelectorAll(`.${P}-row-head`)).toHaveLength(0);
        expect(container.querySelectorAll(`.${P}-row-cell`)).toHaveLength(0);
    });

    it('useFullRender', () => {
        const fullColumns: ColumnProps[] = [
            {
                dataIndex: 'name',
                width: 250,
                filters: [
                    { text: '名字包含"1"', value: '1' },
                    { text: '名字包含"2"', value: '2' },
                ],
                onFilter: (value, record) => record.name.indexOf(value) > -1,
                sorter: (a, b) => a.name.length - b.name.length,
                useFullRender: true,
                render: (text, _record, _index, options) => (
                    <span class="custom-render" style={{ display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center' }}>
                        {options.indentText?.()}
                        {options.expandIcon?.()}
                        {options.selection?.()}
                        <span style={{ 'margin-left': '8px' }}>{text}</span>
                    </span>
                ),
                title: (parts) => (
                    <span class="custom-title" style={{ display: 'inline-flex', 'align-items': 'center', 'padding-left': '20px' }}>
                        {parts.selection?.()}
                        <span style={{ 'margin-left': '8px' }}>Name</span>
                        {parts.sorter?.()}
                        {parts.filter?.()}
                    </span>
                ),
            },
            { title: 'Age', dataIndex: 'age' },
            { title: 'Address', dataIndex: 'address' },
        ];
        render(() => <Table columns={fullColumns} dataSource={data} rowSelection={{ hidden: true, fixed: 'left' }} expandedRowRender={(record) => <article>{record.description}</article>} />);
        const node = query('.custom-render');
        expect(node.children).toHaveLength(3);
        expect(containsSelector(node.children[0], `.${P}-expand-icon`)).toBeTruthy();
        expect(containsSelector(node.children[1], `.${P}-selection-wrap`)).toBeTruthy();
        const title = query('.custom-title');
        expect(title.children).toHaveLength(4);
        expect(containsSelector(title.children[0], `.${P}-selection-wrap`)).toBeTruthy();
        expect(title.children[1]).toHaveTextContent(/^Name$/);
        expect(containsSelector(title.children[2], `.${P}-column-sorter`)).toBeTruthy();
        expect(containsSelector(title.children[3], `.${P}-column-filter`)).toBeTruthy();
    });

    it('defaultExpandedRowKeys 变化', () => {
        const pageSize = 20;
        const defaultExpandedRowKeys = Array.from({ length: getRandomNumber(pageSize) }).map((_, i) => String(i));
        const newDefaultExpandedRowKeys = Array.from({ length: getRandomNumber(pageSize) }).map((_, i) => String(i));
        const [keys, setKeys] = createSignal(defaultExpandedRowKeys);
        render(() => <Table columns={getColumns()} dataSource={data} defaultExpandedRowKeys={keys()} pagination={{ pageSize }} expandedRowRender={(_record, index) => <div>{`Semi Design ${index}`}</div>} />);
        expect(getExpandedRowKeys()).toEqual(defaultExpandedRowKeys);
        setKeys(newDefaultExpandedRowKeys);
        expect(getExpandedRowKeys()).toEqual(defaultExpandedRowKeys);
    });

    it('getCheckboxProps 变化', () => {
        const [getCheckboxProps, setGetCheckboxProps] = createSignal((record: { key: string }) => ({ disabled: record.key === '1' }));
        render(() => <Table columns={getColumns()} dataSource={getData(20)} pagination={false} rowSelection={{ getCheckboxProps: getCheckboxProps() }} />);
        const getDisabledCheckboxes = () => queryAll(`.${P}-tbody .${BASE_CLASS_PREFIX}-checkbox-disabled`);
        expect(getDisabledCheckboxes()).toHaveLength(1);
        setGetCheckboxProps(() => (record: { key: string }) => ({ disabled: ['0', '1'].includes(record.key) }));
        expect(getDisabledCheckboxes()).toHaveLength(2);
    });

    it('受控分页在 dataSource 变化时重置', () => {
        const pagination = { pageSize: 10, currentPage: 2 };
        const [dataSource, setDataSource] = createSignal(getData(100));
        render(() => <Table columns={getColumns()} dataSource={dataSource()} pagination={pagination} />);
        setDataSource(getData(getRandomNumber(100, 40)));
        expect(getActivePage()?.innerHTML).toBe('2');
    });

    it('非受控分页在 dataSource 变化时重置', async () => {
        const [dataSource, setDataSource] = createSignal(getData(100));
        render(() => <Table columns={getColumns()} dataSource={dataSource()} />);
        await userEvent.click(getPageItems()[2]);
        expect(getActivePage()?.innerHTML).toBe('2');
        const newData = getData(getRandomNumber(100, 40));
        setDataSource(newData);
        expect(getActivePage()?.innerHTML).toBe('1');
        expect(getFirstCellText()).toBe(newData[0].name);
    });

    it('Table 专用的分页属性不传到 Pagination 根元素', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
            const pagination = { pageSize: 10, formatPageText: () => 'text', 'data-testid': 'pager' };
            render(() => <Table columns={getColumns()} dataSource={getData(30)} pagination={pagination} />);
            const pager = screen.getByTestId('pager');
            expect(pager).not.toHaveAttribute('position');
            expect(pager).not.toHaveAttribute('formatpagetext');
            expect(error).not.toHaveBeenCalled();
        } finally {
            error.mockRestore();
        }
    });

    it('分页变化', () => {
        const total = 100;
        const tableData = getData(total);
        const [pagination, setPagination] = createSignal({ pageSize: 10, currentPage: 2 });
        render(() => <Table columns={getColumns()} dataSource={tableData} pagination={pagination()} />);
        const getPageNumbers = () =>
            getPageItems()
                .map((item) => Number(item.textContent))
                .filter((page) => !Number.isNaN(page));
        expect(Math.max(...getPageNumbers())).toEqual(total / 10);
        expect(getActivePage()).toHaveTextContent(/^2$/);
        setPagination({ pageSize: 5, currentPage: 1 });
        expect(Math.max(...getPageNumbers())).toEqual(total / 5);
        expect(getActivePage()).toHaveTextContent(/^1$/);
    });

    it('对象 columns 与 children', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(() => (
            <Table columns={columns} dataSource={data}>
                <Table.Column key="age" title="Age" dataIndex="age" />
            </Table>
        ));
        const headerCells = queryAll(`.${P}-thead .${P}-row-head`);
        expect(headerCells.map((cell) => cell.textContent)).toEqual(columns.map((column) => column.title ?? ''));
        warn.mockRestore();
    });

    it('表头 colSpan', () => {
        const colSpanColumns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name' },
            { title: 'Age', dataIndex: 'age' },
            { title: 'Home phone', colSpan: 2, dataIndex: 'tel' },
            { title: 'Phone', colSpan: 0, dataIndex: 'phone' },
            { title: 'Address', dataIndex: 'address' },
        ];
        const phoneData = [
            { key: '1', name: 'ZhangSan', age: 50, tel: '010-20000000', phone: 10010, address: 'BeiJing No.1 High School' },
            { key: '2', name: 'LiSi', tel: '010-30000000', phone: 10086, age: 40, address: 'ShangHai No. 1 High School' },
        ];
        render(() => <Table columns={colSpanColumns} dataSource={phoneData} />);
        expect(queryAll(`.${P}-row .${P}-row-head`)).toHaveLength(colSpanColumns.length - 1);
    });

    it('expandAllRows', () => {
        const [state, setState] = createSignal<{ dataSource: ReturnType<typeof getData>; expandAllRows: boolean }>({ dataSource: [], expandAllRows: true });
        render(() => <Table columns={getColumns()} pagination={false} expandedRowRender={() => <div>Semi Design</div>} dataSource={state().dataSource} expandAllRows={state().expandAllRows} />);
        const newData = getData(20);
        setState({ dataSource: newData, expandAllRows: true });
        expect(getExpandedRowKeys()).toHaveLength(newData.length);
        setState({ dataSource: newData, expandAllRows: false });
        expect(getExpandedRowKeys()).toHaveLength(0);
    });

    const lengthSortData = [
        { key: '1', name: 'long name', age: 32, address: 'New York No. 1 Lake Park' },
        { key: '2', name: 'longest name', age: 42, address: 'London No. 1 Lake Park' },
        { key: '3', name: 'longer name', age: 32, address: 'Sidney No. 1 Lake Park' },
        { key: '4', name: 'short', age: 32, address: 'London No. 2 Lake Park' },
    ];
    const defaultSortColumns = (defaultSortOrder: ColumnProps['defaultSortOrder']): ColumnProps[] => [
        { title: 'Name', dataIndex: 'name', sorter: (a, b) => a.name.length - b.name.length, defaultSortOrder },
        { title: 'Age', dataIndex: 'age' },
        { title: 'Address', dataIndex: 'address' },
    ];

    it('defaultSortOrder 为 descend', () => {
        render(() => <Table columns={defaultSortColumns('descend')} dataSource={lengthSortData} onChange={vi.fn<TableChange>()} />);
        expect(getFirstCellText()).toBe('longest name');
    });

    it('defaultSortOrder 为 ascend', () => {
        render(() => <Table columns={defaultSortColumns('ascend')} dataSource={lengthSortData} onChange={vi.fn<TableChange>()} />);
        expect(getFirstCellText()).toBe('short');
    });

    it('defaultSortOrder 为 false', async () => {
        const onChange = vi.fn<TableChange>();
        const [dataSource, setDataSource] = createSignal(lengthSortData);
        render(() => <Table columns={defaultSortColumns(false)} dataSource={dataSource()} onChange={onChange} />);
        expect(getFirstCellText()).toBe(lengthSortData[0].name);
        const getSorter = () => query(`.${P}-thead .${P}-column-sorter`);
        await userEvent.click(getSorter());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].sorter?.sortOrder).toBe('ascend');
        await userEvent.click(getSorter());
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[1][0].sorter?.sortOrder).toBe('descend');
        const newData = [
            { key: '1', name: 'longest name', age: 18, address: 'New York No. 1 Lake Park' },
            { key: '2', name: 'long name', age: 20, address: 'London No. 1 Lake Park' },
            { key: '3', name: 'longer name', age: 16, address: 'Sidney No. 1 Lake Park' },
            { key: '4', name: 'short', age: 33, address: 'London No. 2 Lake Park' },
        ];
        setDataSource(newData);
        expect(getFirstCellText()).toBe('longest name');
    });

    it('expandRowByClick', async () => {
        const expandEventTypes: string[] = [];
        const onExpand = vi.fn<NonNullable<TableProps['onExpand']>>((_expanded, _record, e) => expandEventTypes.push((e as Event).type));
        const onExpandedRowsChange = vi.fn<NonNullable<TableProps['onExpandedRowsChange']>>();
        render(() => <Table columns={columns} dataSource={data} expandRowByClick expandedRowRender={() => <div>Semi Design</div>} onExpand={onExpand} onExpandedRowsChange={onExpandedRowsChange} />);
        const rows = getBodyRows();
        await userEvent.click(rows[0]);
        await userEvent.click(rows[1]);
        expect(onExpand).toHaveBeenCalledTimes(2);
        expect(onExpandedRowsChange).toHaveBeenCalledTimes(2);
        expect(onExpand.mock.calls[1][0]).toEqual(true);
        expect(onExpand.mock.calls[1][1]).toEqual(data[1]);
        expect(expandEventTypes[1]).toBe('click');
        expect(onExpandedRowsChange.mock.calls[1][0]).toHaveLength(2);
        expect(getExpandedRowKeys()).toEqual(['0', '1']);
        await userEvent.click(query(`.${P}-tbody .${P}-row-expanded`));
        expect(getExpandedRowKeys()).toEqual(['1']);
    });

    it('展开行重新渲染', async () => {
        const expandedRowRender = vi.fn<NonNullable<TableProps['expandedRowRender']>>(() => <div>Semi Design</div>);
        render(() => <Table columns={columns} dataSource={data} expandedRowRender={expandedRowRender} />);
        const expandIcons = queryAll(`.${P}-tbody .${P}-row .${P}-expand-icon`);
        await userEvent.click(expandIcons[0]);
        // expanding a row keeps the other rows' DOM
        expect(expandIcons[1].isConnected).toBe(true);
        await userEvent.click(expandIcons[1]);
        expect(expandedRowRender).toHaveBeenCalledTimes(2);
    });

    const getDesignData = (total: number) =>
        Array.from({ length: total }, (_, i) => {
            const isSemiDesign = i % 2 === 0;
            return { key: `${i}`, name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi Pro 设计稿${i}.fig`, owner: isSemiDesign ? '姜鹏志' : '郝宣', size: (i * 1000) % 199, avatarBg: isSemiDesign ? 'grey' : 'red' };
        });
    const designColumns = (): ColumnProps[] => [
        {
            title: '标题',
            dataIndex: 'name',
            width: 400,
            render: (text) => <div>{text}</div>,
            filters: [
                { text: 'Semi Design 设计稿', value: 'Semi Design 设计稿' },
                { text: 'Semi Pro 设计稿', value: 'Semi Pro 设计稿' },
            ],
            onFilter: (value, record) => record.name.includes(value),
            defaultFilteredValue: ['Semi Pro 设计稿'],
        },
        { title: '大小', dataIndex: 'size', sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1), defaultSortOrder: 'ascend', render: (text) => `${text} KB` },
        { title: '所有者', dataIndex: 'owner', render: (text) => <div>{text}</div> },
    ];

    it('点击排序器时 defaultFilteredValue 出现在 onChange 中', async () => {
        const onChange = vi.fn<TableChange>();
        render(() => <Table columns={designColumns()} dataSource={getDesignData(25)} onChange={onChange} />);
        await userEvent.click(query(`.${P}-column-sorter`));
        expect(onChange).toHaveBeenCalledTimes(1);
        const arg = onChange.mock.calls[0][0];
        expect(arg.filters).toHaveLength(1);
        expect(arg.filters?.[0].defaultFilteredValue).toEqual(['Semi Pro 设计稿']);
        expect(arg.filters?.[0].filteredValue).toEqual(['Semi Pro 设计稿']);
    });

    it('点击筛选时 defaultSortOrder 出现在 onChange 中', async () => {
        const onChange = vi.fn<TableChange>();
        render(() => <Table columns={designColumns()} dataSource={getDesignData(25)} onChange={onChange} />);
        await userEvent.click(query(`.${P}-column-filter`));
        const filterNode = await waitFor(() => {
            const node = queryAll(`.${BASE_CLASS_PREFIX}-checkbox-addon`).find((item) => item.textContent === 'Semi Design 设计稿');
            expect(node).toBeDefined();
            return node as HTMLElement;
        });
        await userEvent.click(filterNode);
        expect(onChange).toHaveBeenCalledTimes(1);
        const arg = onChange.mock.calls[0][0];
        // ChangeInfoSorter declares only dataIndex, sortOrder and sorter; the runtime passes the whole column
        expect(arg.sorter).toHaveProperty('defaultSortOrder', 'ascend');
        expect(arg.sorter?.sortOrder).toBe('ascend');
    });
});

describe('Table 回归用例', () => {
    const getFileData = (total: number, otherName = 'Semi Pro 设计稿') => Array.from({ length: total }, (_, i) => ({ key: `${i}`, name: i % 2 === 0 ? `Semi Design 设计稿${i}.fig` : `${otherName}${i}.fig`, owner: i % 2 === 0 ? '姜鹏志' : '郝宣', size: (i * 1000) % 199 }));
    const nameFilters = [
        { text: 'Semi Design 设计稿', value: 'Semi Design 设计稿' },
        { text: 'Semi Pro 设计稿', value: 'Semi Pro 设计稿' },
    ];
    const getRowCellTexts = (index: number) => Array.from(getBodyRows()[index].children, (cell) => cell.textContent);
    const getHeaderCheckbox = () => query(`.${P}-thead .${BASE_CLASS_PREFIX}-checkbox`);
    const getBodyCheckboxes = () => queryAll(`.${P}-tbody .${BASE_CLASS_PREFIX}-checkbox`);
    const getCheckedBodyCount = () => getBodyCheckboxes().filter((el) => el.classList.contains(`${BASE_CLASS_PREFIX}-checkbox-checked`)).length;
    const clickPage = (page: number) => userEvent.click(getPageItems().find((item) => item.textContent === `${page}`) as HTMLElement);
    const getPaginationInfo = () => query(`.${P}-pagination-info`).textContent;
    const openFilter = async () => {
        await userEvent.click(query(`.${P}-column-filter`));
        await screen.findAllByText(nameFilters[0].text);
    };
    const clickFilterItem = (text: string) => userEvent.click(queryAll(`.${BASE_CLASS_PREFIX}-dropdown-item`).find((item) => item.textContent === text) as HTMLElement);

    it('FixRenderReturnProps：固定列上应用 onCell 返回的 rowSpan', () => {
        const spanColumns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                width: 200,
                fixed: true,
                onCell: (_row, index) => (index === 0 ? { rowSpan: 2 } : index === 1 ? { rowSpan: 0 } : {}),
                render: (text) => <a href="https://semi.design">{text}</a>,
            },
            { title: 'Age', width: 200, dataIndex: 'age' },
            { title: 'Home phone', colSpan: 2, width: 200, dataIndex: 'tel' },
            { title: 'Phone', colSpan: 0, width: 200, dataIndex: 'phone' },
        ];
        const phoneData = [
            { key: '1', name: 'John Brown', age: 32, tel: '0571-22098909', phone: 18889898989 },
            { key: '2', name: 'Jim Green', age: 42, tel: '0571-22098333', phone: 18889898888 },
            { key: '3', name: 'Joe Black', age: 32, tel: '0575-22098909', phone: 18900010002 },
        ];
        render(() => <Table columns={spanColumns} dataSource={phoneData} />);
        const rows = getBodyRows();
        expect(rows[0].children[0]).toHaveAttribute('rowspan', '2');
        expect(rows[0].children[0]).toHaveClass(`${P}-cell-fixed-left`);
        expect(rows[0].children[0].querySelector('a')).toHaveTextContent('John Brown');
        expect(getRowCellTexts(1)).toEqual(['42', '0571-22098333', '18889898888']);
        expect(getRowCellTexts(2)).toEqual(['Joe Black', '32', '0575-22098909', '18900010002']);
        expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
    });

    it('onCell 合并掉的单元格不调用 render', () => {
        const read = vi.fn<(text: string) => JSX.Element>((text) => <b>{text}</b>);
        const spanColumns: ColumnProps[] = [{ dataIndex: 'name', onCell: (_row, index) => (index === 0 ? { colSpan: 0 } : {}), render: read }];
        render(() => <Table columns={spanColumns} dataSource={getFileData(2)} pagination={false} />);
        expect(read).toHaveBeenCalledTimes(1);
        expect(getBodyRows()[1].querySelector('b')).toBeInTheDocument();
    });

    it('fix #325：表头选择反映所有页，跳过禁用行', async () => {
        render(() => <Table columns={[{ title: '标题', dataIndex: 'name' }]} dataSource={getFileData(6)} pagination={{ pageSize: 3 }} rowSelection={{ getCheckboxProps: (record) => ({ disabled: record.key === '2' }) }} />);
        await userEvent.click(getHeaderCheckbox());
        expect(getCheckedBodyCount()).toBe(2);
        expect(getHeaderCheckbox()).toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-checked`);
        await clickPage(2);
        expect(getCheckedBodyCount()).toBe(3);
        expect(getHeaderCheckbox()).toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-checked`);
        expect(getHeaderCheckbox()).not.toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-indeterminate`);
        await userEvent.click(getBodyCheckboxes()[0]);
        expect(getHeaderCheckbox()).toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-indeterminate`);
        await userEvent.click(getHeaderCheckbox());
        expect(getHeaderCheckbox()).toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-checked`);
        expect(getCheckedBodyCount()).toBe(3);
    });

    it('rowSelection 从 false 改为 selectedRowKeys 为 null 的对象后，勾选一行按未选处理', async () => {
        const onChange = vi.fn<SelectionChange>();
        const [rowSelection, setRowSelection] = createSignal<TableProps['rowSelection']>(false);
        render(() => <Table columns={[{ title: '标题', dataIndex: 'name' }]} dataSource={getFileData(3)} rowSelection={rowSelection()} />);
        setRowSelection({ selectedRowKeys: null as unknown as undefined, onChange });
        await userEvent.click(getBodyCheckboxes()[1]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toEqual(['1']);
        expect(getCheckedBodyCount()).toBe(1);
    });

    it('fix #381：选择变化导致 columns 重建时保留当前页', async () => {
        const fileData = getFileData(46);
        function Demo() {
            const [rowKeys, setRowKeys] = createSignal<(string | number)[]>([]);
            return (
                <Table
                    columns={[
                        { title: '标题', dataIndex: 'name', filters: nameFilters, onFilter: (v, r) => r.name.includes(v) },
                        { title: '大小', dataIndex: 'size', sorter: (a, b) => a.size - b.size },
                    ]}
                    dataSource={fileData}
                    pagination={{ pageSize: 5 }}
                    rowSelection={{ onChange: (keys) => setRowKeys(keys ?? []), selectedRowKeys: rowKeys() }}
                    scroll={{ y: 300 }}
                />
            );
        }
        render(() => <Demo />);
        await clickPage(2);
        expect(getActivePage()).toHaveTextContent('2');
        await userEvent.click(getBodyCheckboxes()[1]);
        expect(getCheckedBodyCount()).toBe(1);
        expect(getActivePage()).toHaveTextContent('2');
        expect(getFirstCellText()).not.toBe(fileData[0].name);
    });

    it('fix #619：重新渲染后保留嵌套 JSX 列的分组表头', () => {
        const groups = [
            { title: 'Base Information', children: ['name', 'age'] },
            { title: 'Company Information', children: ['company.name', 'company.address'] },
        ];
        const companyData = [{ key: '0', name: 'Edward', age: 1, company: { name: 'ByteDance', address: 'Zhichun Road' } }];
        const [version, setVersion] = createSignal(0);
        const renderChildren = () => [
            ...groups.map((group, groupIndex) => (
                <Table.Column key={groupIndex} title={group.title}>
                    <For each={group.children}>{(dataIndex) => <Table.Column key={dataIndex} title={dataIndex} dataIndex={dataIndex} />}</For>
                </Table.Column>
            )),
            <Table.Column key="lastColumn" title="" render={() => 123} />,
        ];
        const getHeaderRows = () => queryAll(`.${P}-thead .${P}-row`);
        render(() => <Table dataSource={companyData}>{(version(), renderChildren())}</Table>);
        setVersion(1);
        expect(getHeaderRows()).toHaveLength(2);
        expect(screen.getByText('Base Information').closest('th')).toHaveAttribute('colspan', '2');
        expect(screen.getByText('Company Information').closest('th')).toHaveAttribute('colspan', '2');
        expect(getRowCellTexts(0)).toEqual(['Edward', '1', 'ByteDance', 'Zhichun Road', '123']);
    });

    it('fix #849：表头由 scroll.y 固定时 onHeaderRow 正常工作', async () => {
        const onHeaderRowClick = vi.fn<(e: MouseEvent) => void>();
        const fixedColumns: ColumnProps[] = [
            { title: '标题', dataIndex: 'name', fixed: true, width: 250 },
            { title: '大小', dataIndex: 'size', width: 200 },
            { title: '', dataIndex: 'operate', fixed: 'right', width: 100 },
        ];
        render(() => <Table columns={fixedColumns} dataSource={getFileData(46)} rowSelection={{ fixed: true }} scroll={{ y: 300, x: 1200 }} onHeaderRow={() => ({ onClick: onHeaderRowClick, class: 'test-header-row' })} />);
        const headerRow = screen.getByText('标题').closest('tr') as HTMLElement;
        expect(headerRow.closest(`.${P}-header`)).not.toBeNull();
        expect(headerRow).toHaveClass('test-header-row');
        await userEvent.click(screen.getByText('标题'));
        expect(onHeaderRowClick).toHaveBeenCalledTimes(1);
    });

    it('fix #1036：按多个值筛选时保留原始行顺序', async () => {
        const filterColumns: ColumnProps[] = [
            { title: '标题', dataIndex: 'name', filters: nameFilters, onFilter: (value, record) => record.name.includes(value), sorter: (a, b) => (a.name.length - b.name.length > 0 ? 1 : -1) },
            { title: '大小', dataIndex: 'size' },
        ];
        render(() => <Table columns={filterColumns} dataSource={getFileData(46)} rowSelection={{}} scroll={{ y: 300 }} />);
        await openFilter();
        await clickFilterItem('Semi Design 设计稿');
        await clickFilterItem('Semi Pro 设计稿');
        expect(getBodyRows()[0]).toHaveTextContent('Semi Design 设计稿0.fig');
        expect(getBodyRows()[1]).toHaveTextContent('Semi Pro 设计稿1.fig');
    });

    it('fix #1556：显示展开列时，叶子行不额外缩进', () => {
        const treeColumns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Age', dataIndex: 'age', key: 'age', width: 150 },
        ];
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
        const getIndentClass = (rowKey: number) => query(`.${P}-tbody tr[data-row-key="${rowKey}"]`).querySelector(`.${P}-row-indent`)?.className;
        const [hideExpandedColumn, setHideExpandedColumn] = createSignal(false);
        render(() => <Table columns={treeColumns} dataSource={treeData} defaultExpandAllRows hideExpandedColumn={hideExpandedColumn()} />);
        expect(getIndentClass(11)).toContain('indent-level-1');
        expect(getIndentClass(12)).toContain('indent-level-1');
        setHideExpandedColumn(true);
        expect(getIndentClass(11)).toContain('indent-level-2');
        expect(getIndentClass(12)).toContain('indent-level-1');
    });

    it('fix #1572：没有 onFilter 的列，onChange 仍报告其筛选值', async () => {
        const onChange = vi.fn<TableChange>();
        const filterColumns: ColumnProps[] = [
            { title: '标题', dataIndex: 'name', filters: nameFilters, sorter: (a, b) => (a.name.length - b.name.length > 0 ? 1 : -1), defaultFilteredValue: ['Semi Pro 设计稿'] },
            { title: '大小', dataIndex: 'size', sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1) },
        ];
        render(() => <Table columns={filterColumns} dataSource={getFileData(46)} scroll={{ y: 300 }} onChange={onChange} />);
        await userEvent.click(queryAll(`.${P}-column-sorter`)[1]);
        expect(onChange).toHaveBeenCalledTimes(1);
        const { filters } = onChange.mock.calls[0][0];
        expect(filters).toHaveLength(1);
        expect(filters?.[0].filteredValue).toEqual(['Semi Pro 设计稿']);
    });

    it('fix #1885：分页跟随 size changer 选择的每页条数，而非给定的 pageSize', async () => {
        render(() => <Table columns={[{ title: '标题', dataIndex: 'name' }]} dataSource={getFileData(46)} pagination={{ pageSize: 20, showSizeChanger: true, position: 'top' }} />);
        expect(getPaginationInfo()).toBe('显示第 1 条-第 20 条，共 46 条');
        await userEvent.click(query(`.${BASE_CLASS_PREFIX}-page-switch .${BASE_CLASS_PREFIX}-select`));
        await userEvent.click((await screen.findAllByRole('option'))[0]);
        // a controlled Select reports the change after the leave animation, which jsdom never ends
        endLeaveAnimations();
        expect(getPaginationInfo()).toBe('显示第 1 条-第 10 条，共 46 条');
        await clickPage(4);
        expect(getPaginationInfo()).toBe('显示第 31 条-第 40 条，共 46 条');
        expect(getActivePage()).toHaveTextContent('4');
        await clickPage(5);
        expect(getPaginationInfo()).toBe('显示第 41 条-第 46 条，共 46 条');
        expect(getBodyRows()).toHaveLength(6);
    });

    it('fix #2001：所有行既禁用又选中时，表头复选框为选中状态', async () => {
        const rows = Array.from({ length: 20 }, (_, index) => ({ key: index, name: `name ${index}` }));
        function App() {
            const [selectAll, setSelectAll] = createSignal(false);
            const [keys, setKeys] = createSignal<(string | number)[]>([]);
            return (
                <div>
                    <button
                        type="button"
                        onClick={() => {
                            setSelectAll(true);
                            setKeys(rows.map((row) => row.key));
                        }}
                    >
                        点击全选
                    </button>
                    <Table columns={[{ title: 'name', dataIndex: 'name' }]} dataSource={rows} rowSelection={{ disabled: selectAll(), getCheckboxProps: () => (selectAll() ? { disabled: true } : {}), onChange: (next) => setKeys(next ?? []), selectedRowKeys: keys() }} />
                </div>
            );
        }
        render(() => <App />);
        expect(getHeaderCheckbox()).not.toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-checked`);
        await userEvent.click(screen.getByRole('button', { name: '点击全选' }));
        expect(getHeaderCheckbox()).toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-checked`);
        expect(getHeaderCheckbox()).not.toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-indeterminate`);
    });
});

describe('Table 最后一列', () => {
    it('延伸到末端的单元格带 cell-last，colSpan 盖住末列时落在合并后的单元格上', () => {
        const spanFirstRow = (span: number) => (_record: unknown, index?: number) => (index === 0 ? { colSpan: span } : {});
        const columns: ColumnProps[] = [
            { title: 'A', dataIndex: 'a' },
            { title: 'B', dataIndex: 'b', onCell: spanFirstRow(2) },
            { title: 'C', dataIndex: 'c', onCell: spanFirstRow(0) },
        ];
        const dataSource = [
            { key: '1', a: 'a1', b: 'b1', c: 'c1' },
            { key: '2', a: 'a2', b: 'b2', c: 'c2' },
        ];
        render(() => <Table columns={columns} dataSource={dataSource} pagination={false} />);
        expect(queryAll(`.${P}-cell-last`).map((cell) => cell.textContent)).toEqual(['C', 'b1', 'c2']);
    });
});
