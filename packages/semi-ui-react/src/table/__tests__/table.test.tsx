import { StrictMode, createRef, memo, useEffect, useState, type ReactNode } from 'react';
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { numbers } from '@fibrae/semi-foundation/table/constants';
import { IconStar } from '@fibrae/semi-icons-react';
import { Tag, Tooltip } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import { endLeaveAnimations, getColumns, getData, getGroupColumns, getGroupData, getJSXColumns, getNestColumns, getNestData, getRandomNumber, getTreeData } from '@test/utils/react';
import { baseRowPropKeys } from '../body/base-row';
import { sectionRowPropKeys } from '../body/section-row';
import Column from '../column';
import Table from '../index';
import type { ColumnProps, ColumnTitleProps, GetVirtualizedListRef, ResizeFn, TableHandle, TableProps } from '../interface';
type TableChange = NonNullable<TableProps['onChange']>;
type RowSelectionConfig = Extract<TableProps['rowSelection'], object>;
type SelectionChange = NonNullable<RowSelectionConfig['onChange']>;
type SelectChange = NonNullable<RowSelectionConfig['onSelect']>;
type SelectAllChange = NonNullable<RowSelectionConfig['onSelectAll']>;

const dataTotalSize = 46;
const data = getData(dataTotalSize);
const columns = getColumns();

const queryAll = (selector) => Array.from(document.querySelectorAll(selector));
const getBodyRows = () => queryAll(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row`);
const getExpandedRowKeys = () => queryAll(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row-expanded`).map((row) => row.getAttribute('data-row-key'));
const getFirstCellText = () => document.querySelector(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row .${BASE_CLASS_PREFIX}-table-row-cell`).textContent;
const getPageItems = () => queryAll(`.${BASE_CLASS_PREFIX}-page .${BASE_CLASS_PREFIX}-page-item`);
const getActivePage = () => document.querySelector(`.${BASE_CLASS_PREFIX}-page .${BASE_CLASS_PREFIX}-page-item-active`);
const getHeaderSelectionCheckbox = () => document.querySelector(`.${BASE_CLASS_PREFIX}-table-thead .${BASE_CLASS_PREFIX}-table-column-selection .${BASE_CLASS_PREFIX}-checkbox`);
const containsSelector = (el, selector) => el.matches(selector) || el.querySelector(selector) !== null;

async function expectAppearance({ onRow, myCls, myClsIndex }) {
    expect(queryAll(`.${BASE_CLASS_PREFIX}-table-wrapper`)).toHaveLength(1);
    expect(queryAll(`.${BASE_CLASS_PREFIX}-table-title`)).toHaveLength(1);
    expect(queryAll(`.${BASE_CLASS_PREFIX}-table-footer`)).toHaveLength(1);
    expect(onRow).toHaveBeenCalled();
    const rows = getBodyRows();
    expect(rows[0]).not.toHaveClass(myCls);
    expect(rows.findLastIndex((row) => row.classList.contains(myCls))).toBe(myClsIndex);
    expect(queryAll(`.${BASE_CLASS_PREFIX}-table-pagination-outer`)).toHaveLength(1);
    const curPage = 2;
    await userEvent.click(queryAll(`.${BASE_CLASS_PREFIX}-page-item`)[curPage]);
    expect(getActivePage()).toHaveTextContent(new RegExp(`^${curPage}$`));
}

describe(`Table`, () => {
    it(`JSX 列的外观`, async () => {
        const myCls = `my-tr-class`;
        const myClsIndex = 2;
        const onRow = vi.fn<NonNullable<TableProps['onRow']>>((_record, index) => ({
            className: index === myClsIndex ? myCls : '',
        }));
        const renderTable = (children) => (
            <Table title={() => 'Table Title'} dataSource={data} footer={() => 'Table Footer'} onRow={onRow}>
                {children}
            </Table>
        );
        const { rerender, unmount } = render(renderTable(getJSXColumns()));
        await expectAppearance({
            onRow,
            myCls,
            myClsIndex,
        });
        rerender(renderTable(getJSXColumns()));
        await expectAppearance({
            onRow,
            myCls,
            myClsIndex,
        });
        unmount();
    });
    it(`对象列的外观`, async () => {
        const myCls = `my-tr-class`;
        const myClsIndex = 2;
        const onRow = vi.fn<NonNullable<TableProps['onRow']>>((_record, index) => ({
            className: index === myClsIndex ? myCls : '',
        }));
        const renderTable = (columns) => <Table title={() => 'Table Title'} columns={columns} dataSource={data} footer={() => 'Table Footer'} onRow={onRow} />;
        const { rerender } = render(renderTable(getColumns()));
        await expectAppearance({
            onRow,
            myCls,
            myClsIndex,
        });
        rerender(renderTable(getColumns()));
        await expectAppearance({
            onRow,
            myCls,
            myClsIndex,
        });
    });
    it(`dataSource 变化后的外观`, async () => {
        const myCls = `my-tr-class`;
        const myClsIndex = 2;
        const onRow = vi.fn<NonNullable<TableProps['onRow']>>((_record, index) => ({
            className: index === myClsIndex ? myCls : '',
        }));
        const columns = getColumns();
        const renderTable = (dataSource) => <Table title={() => 'Table Title'} columns={columns} dataSource={dataSource} footer={() => 'Table Footer'} onRow={onRow} />;
        const { rerender } = render(renderTable(getData(25)));
        await expectAppearance({
            onRow,
            myCls,
            myClsIndex,
        });
        const dataNum = getRandomNumber(100, 40);
        rerender(renderTable(getData(dataNum)));
        await expectAppearance({
            onRow,
            myCls,
            myClsIndex,
        });
    });
    it(`选择功能`, async () => {
        const columns = getColumns();
        const selectedRowKeys = ['0'];
        const rowKey = 'key';
        const disabledKeys = ['4'];
        const onChange = vi.fn<SelectionChange>();
        const onSelectAll = vi.fn<SelectAllChange>();
        const getCheckboxProps = vi.fn<NonNullable<RowSelectionConfig['getCheckboxProps']>>((record) => ({
            disabled: disabledKeys.includes(record[rowKey]),
            name: record.name,
        }));
        const onSelect = vi.fn<SelectChange>();

        function Demo() {
            const [keys, setKeys] = useState(['3']);
            const rowSelection = {
                onChange: (selectedRowKeys, selectedRows) => {
                    onChange(selectedRowKeys, selectedRows);
                    setKeys([...selectedRowKeys]);
                },
                onSelectAll: (selected, selectedRows, changedRows, e) => {
                    onSelectAll(selected, selectedRows, changedRows, e);
                    setKeys(selected ? [...selectedRowKeys] : []);
                },
                getCheckboxProps,
                onSelect,
                selectedRowKeys: keys,
                defaultSelectedRowKeys: ['0', '1'],
            };
            return <Table columns={columns} dataSource={data} rowKey={rowKey} rowSelection={rowSelection} />;
        }

        render(<Demo />);
        const expectRowsCheckedBy = (keys) =>
            getBodyRows().forEach((row) => {
                const checked = row.querySelector(`.${BASE_CLASS_PREFIX}-checkbox-inner-checked`) !== null;
                expect(checked).toBe(keys.includes(row.getAttribute('data-row-key')));
            });
        expect(queryAll(`.${BASE_CLASS_PREFIX}-checkbox`).length).toBeGreaterThan(0);
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-row .${BASE_CLASS_PREFIX}-checkbox-inner-checked`)).toHaveLength(1);
        expectRowsCheckedBy(['3']);
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-thead .${BASE_CLASS_PREFIX}-checkbox-indeterminate`)).toHaveLength(1);
        queryAll(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-checkbox`)
            .filter((_el, index) => disabledKeys.includes(index.toString()))
            .forEach((el) => {
                expect(el).toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-disabled`);
            });
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-table-row .${BASE_CLASS_PREFIX}-checkbox-disabled`));
        expect(onSelect).not.toHaveBeenCalled();
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row .${BASE_CLASS_PREFIX}-checkbox`));
        expect(onSelect).toHaveBeenCalledTimes(1);
        await userEvent.click(getHeaderSelectionCheckbox());
        expect(onSelectAll).toHaveBeenCalledTimes(1);
        expectRowsCheckedBy(onChange.mock.lastCall[0]);
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-thead .${BASE_CLASS_PREFIX}-checkbox-inner-checked`)).toHaveLength(1);
        await userEvent.click(getHeaderSelectionCheckbox());
        expect(onSelectAll).toHaveBeenCalledTimes(2);
        expectRowsCheckedBy([]);
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-thead .${BASE_CLASS_PREFIX}-checkbox-inner-checked`)).toHaveLength(0);
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-thead .${BASE_CLASS_PREFIX}-checkbox-indeterminate`)).toHaveLength(0);
    });
    it(`数据变化后的选择功能`, async () => {
        const columns = getColumns();
        const selectedRowKeys = ['0'];
        const rowKey = 'key';
        const disabledKeys = ['4'];
        const onSelectAll = vi.fn<SelectAllChange>();
        const getCheckboxProps = vi.fn<NonNullable<RowSelectionConfig['getCheckboxProps']>>((record) => ({
            disabled: disabledKeys.includes(record[rowKey]),
            name: record.name,
        }));
        const onSelect = vi.fn<SelectChange>();

        function Demo({ dataSource }) {
            const [keys, setKeys] = useState<string[]>();
            const rowSelection = {
                onSelectAll: (selected, selectedRows, changedRows, e) => {
                    onSelectAll(selected, selectedRows, changedRows, e);
                    setKeys(selected ? [...selectedRowKeys] : []);
                },
                getCheckboxProps,
                onSelect,
                ...(keys && { selectedRowKeys: keys }),
            };
            return <Table columns={columns} dataSource={dataSource} rowKey={rowKey} rowSelection={rowSelection} />;
        }

        const { rerender } = render(<Demo dataSource={data} />);
        rerender(<Demo dataSource={getData(50)} />);
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-table-row .${BASE_CLASS_PREFIX}-checkbox-disabled`));
        expect(onSelect).not.toHaveBeenCalled();
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row .${BASE_CLASS_PREFIX}-checkbox`));
        expect(onSelect).toHaveBeenCalledTimes(1);
        await userEvent.click(getHeaderSelectionCheckbox());
        expect(onSelectAll).toHaveBeenCalledTimes(1);
        await userEvent.click(getHeaderSelectionCheckbox());
        expect(onSelectAll).toHaveBeenCalledTimes(2);
    });
    it(`expandedRowRender 与 fixed`, async () => {
        const columns = getColumns();
        const rowKey = 'key';

        const expandedRowRender = (record) => (
            <article
                style={{
                    margin: 0,
                }}
            >
                <p>{record.description}</p>
            </article>
        );

        const unexpandableKey = '2';
        const renderTable = (dataSource) => (
            <Table
                columns={columns}
                dataSource={dataSource}
                defaultExpandAllRows
                expandCellFixed
                hideExpandedColumn={false}
                rowExpandable={(record) => record[rowKey] !== unexpandableKey}
                rowKey={rowKey}
                scroll={{
                    x: '160%',
                    y: 320,
                }}
                expandedRowRender={expandedRowRender}
            />
        );
        const { rerender } = render(renderTable(data));
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-cell-fixed-left`).length).toBeGreaterThan(0);
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-cell-fixed-right`).length).toBeGreaterThan(0);
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-cell-fixed-left.${BASE_CLASS_PREFIX}-table-column-expand`).length).toBeGreaterThan(0);
        rerender(renderTable(getData(50)));
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-cell-fixed-left.${BASE_CLASS_PREFIX}-table-column-expand`).length).toBeGreaterThan(0);
    });
    it(`树形数据`, async () => {
        const rowKey = 'key';
        const childrenRecordName = 'children';
        const childrenData = getTreeData();
        let expandedRowKeys = [1];
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
            const [keys, setKeys] = useState(expandedRowKeys);
            return (
                <Table
                    childrenRecordName={childrenRecordName}
                    columns={columns}
                    dataSource={childrenData}
                    expandedRowKeys={keys}
                    rowKey={rowKey}
                    onExpand={(...args) => {
                        onExpand(...args);
                        setKeys(expandedRowKeys);
                    }}
                />
            );
        }

        render(<Demo />);
        const getExpandIcons = () => queryAll(`.${BASE_CLASS_PREFIX}-table-body .${BASE_CLASS_PREFIX}-table-row .${BASE_CLASS_PREFIX}-table-expand-icon`);
        expect(getBodyRows()).toHaveLength(childrenData[0].children.length + childrenData.length);
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
    it(`分组数据`, async () => {
        const rowKey = (record) => `${record.city && record.city.toLowerCase()}-${record.job && record.job.toLowerCase()}`;

        const data = [
            {
                city: 'Beijing',
                job: 'FE',
                department: 'IES',
            },
            {
                city: 'Beijing',
                job: 'BE',
                department: 'IES',
            },
            {
                city: 'Shanghai',
                job: 'Android',
                department: 'IES',
            },
            {
                city: 'Tokyo',
                job: 'Android',
                department: 'IES',
            },
            {
                city: 'Shanghai',
                job: 'IOS',
                department: 'EE',
            },
            {
                city: 'LA',
                job: 'SE',
                department: 'EE',
            },
            {
                city: 'Beijing',
                job: 'Android',
                department: 'EE',
            },
            {
                city: 'Tokyo',
                job: 'IOS',
                department: 'EE',
            },
            {
                city: 'Tokyo',
                job: 'SE',
                department: 'DATA',
            },
            {
                city: 'Shanghai',
                job: 'BE',
                department: 'DATA',
            },
            {
                city: 'LA',
                job: 'Android',
                department: 'DATA',
            },
            {
                city: 'LA',
                job: 'IOS',
                department: 'DATA',
            },
        ];
        const columns = [
            {
                dataIndex: 'city',
                title: 'City',
                width: 400,
                sorter: (a, b) => (a.city > b.city ? 1 : -1),
            },
            {
                dataIndex: 'job',
                title: 'Job',
                width: 200,
                filters: [
                    {
                        text: 'IOS',
                        value: 'IOS',
                    },
                    {
                        text: 'Android',
                        value: 'Android',
                    },
                ],
                onFilter: (value, record) => record.job && record.job.indexOf(value) === 0,
            },
            {
                dataIndex: 'department',
                title: 'Department',
            },
        ];
        const groupedRowClick = vi.fn<(event: unknown) => void>();
        render(
            <Table
                clickGroupedRowToExpand
                columns={columns}
                dataSource={data}
                groupBy="city"
                rowKey={rowKey}
                scroll={{
                    y: 480,
                }}
                renderGroupSection={(groupKey) => <strong>Jobs in {groupKey}:</strong>}
                onGroupedRow={() => ({
                    onClick: groupedRowClick,
                })}
            />
        );
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-row-section`)).toHaveLength(4);
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-body .${BASE_CLASS_PREFIX}-table-row`)).toHaveLength(0);
        await userEvent.click(queryAll(`.${BASE_CLASS_PREFIX}-table-row-section`)[0]);
        expect(groupedRowClick).toHaveBeenCalledTimes(1);
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-row`).length).toBeGreaterThan(0);
    });
    it(`事件：分页、筛选、排序`, async () => {
        const columns = [
            {
                title: 'Name',
                dataIndex: 'name',
                width: 150,
                filters: [
                    {
                        text: '名字包含"1"',
                        value: '1',
                    },
                    {
                        text: '名字包含"2"',
                        value: '2',
                    },
                ],
                onFilter: (value, record) => record.name.indexOf(value) > -1,
            },
            {
                title: 'Age',
                dataIndex: 'age',
                width: 150,
                sorter: (a, b) => (a.age - b.age > 0 ? 1 : -1),
            },
            {
                title: 'Address',
                dataIndex: 'address',
            },
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
        render(<Table columns={columns} dataSource={data} onChange={onChange} />);
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-table-thead .${BASE_CLASS_PREFIX}-table-column-filter`));
        await waitFor(() => expect(queryAll(`.${BASE_CLASS_PREFIX}-dropdown`)).toHaveLength(1));
        expect(onChange).toHaveBeenCalledTimes(onChangeCalledCount);
        const getFirstFilterCheckbox = () => document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown .${BASE_CLASS_PREFIX}-dropdown-item .${BASE_CLASS_PREFIX}-checkbox`);
        await userEvent.click(getFirstFilterCheckbox());
        expect(onChange).toHaveBeenCalledTimes(++onChangeCalledCount);
        await userEvent.click(getFirstFilterCheckbox());
        expect(onChange).toHaveBeenCalledTimes(++onChangeCalledCount);
        await userEvent.click(getPageItems()[2]);
        expect(onChange).toHaveBeenCalledTimes(++onChangeCalledCount);
        await userEvent.click(getPageItems()[1]);
        expect(onChange).toHaveBeenCalledTimes(++onChangeCalledCount);

        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-table-thead .${BASE_CLASS_PREFIX}-table-column-sorter`));
        expect(onChange).toHaveBeenCalledTimes(++onChangeCalledCount);
    });
    it(`排序不改变 dataSource 属性的顺序`, () => {
        const dataSource = [
            { key: '3', name: 'row-3', age: 30 },
            { key: '1', name: 'row-1', age: 10 },
            { key: '2', name: 'row-2', age: 20 },
        ];
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name' },
            { title: 'Age', dataIndex: 'age', sorter: (a, b) => a.age - b.age, defaultSortOrder: 'ascend' },
        ];
        const { rerender } = render(<Table columns={columns} dataSource={dataSource} pagination={false} />);

        const getRenderedNames = () => [...document.querySelectorAll(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row`)].map((row) => row.querySelector(`.${BASE_CLASS_PREFIX}-table-row-cell`).textContent);
        expect(getRenderedNames()).toEqual(['row-1', 'row-2', 'row-3']);
        expect(dataSource.map((record) => record.key)).toEqual(['3', '1', '2']);

        const nextDataSource = [{ key: '5', name: 'row-5', age: 50 }, ...dataSource];
        rerender(<Table columns={columns} dataSource={nextDataSource} pagination={false} />);
        expect(getRenderedNames()).toEqual(['row-1', 'row-2', 'row-3', 'row-5']);
        expect(nextDataSource.map((record) => record.key)).toEqual(['5', '3', '1', '2']);
    });
    it(`筛选，并在已有筛选下更新 dataSource`, async () => {
        const columns = [
            {
                className: 'name-col',
                title: 'Name',
                dataIndex: 'name',
                width: 150,
                filters: [
                    {
                        text: '名字包含"1"',
                        value: '1',
                    },
                    {
                        text: '名字包含"2"',
                        value: '2',
                    },
                ],
                onFilter: (value, record) => record.name.indexOf(value) > -1,
            },
            {
                title: 'Age',
                dataIndex: 'age',
                width: 150,
                sorter: (a, b) => (a.age - b.age > 0 ? 1 : -1),
            },
            {
                title: 'Address',
                dataIndex: 'address',
            },
        ];
        const { rerender } = render(<Table columns={columns} dataSource={data} pagination={false} />);
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-table-thead .${BASE_CLASS_PREFIX}-table-column-filter`));
        await userEvent.click(
            await waitFor(() => {
                const checkbox = document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown .${BASE_CLASS_PREFIX}-dropdown-item .${BASE_CLASS_PREFIX}-checkbox`);
                expect(checkbox).not.toBeNull();
                return checkbox;
            })
        );
        const filteredData = data.filter((item) => item.name.indexOf('1') > -1);
        expect(queryAll('.semi-table-tbody .name-col')).toHaveLength(filteredData.length);
        const newData = getData(10);
        const newFilteredData = newData.filter((item) => item.name.indexOf('1') > -1);
        rerender(<Table columns={columns} dataSource={newData} pagination={false} />);
        expect(queryAll('.semi-table-tbody .name-col')).toHaveLength(newFilteredData.length);
    });
    it(`自定义筛选面板的 reset 把临时筛选值还原为已生效的值`, async () => {
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: (value, record) => record.name.includes(value),
                renderFilterDropdown: ({ tempFilteredValue, setTempFilteredValue, reset }) => (
                    <div>
                        <span data-testid="temp-value">{(tempFilteredValue ?? []).join(',')}</span>
                        <button type="button" onClick={() => setTempFilteredValue(['1'])}>
                            选择 1
                        </button>
                        <button type="button" onClick={() => reset()}>
                            还原
                        </button>
                    </div>
                ),
            },
        ];
        render(<Table columns={columns} dataSource={data} pagination={false} />);
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-table-column-filter`));
        await userEvent.click(await screen.findByRole('button', { name: '选择 1' }));
        expect(screen.getByTestId('temp-value')).toHaveTextContent('1');
        await userEvent.click(screen.getByRole('button', { name: '还原' }));
        expect(screen.getByTestId('temp-value')).toBeEmptyDOMElement();
    });
    it(`受控的 dataSource 和 columns`, async () => {
        const initialColumns = [
            {
                title: 'Name',
                dataIndex: 'name',
                width: 150,
                filters: [
                    {
                        text: '名字包含"1"',
                        value: '1',
                    },
                    {
                        text: '名字包含"2"',
                        value: '2',
                    },
                ],
                onFilter: (value, record) => record.name.indexOf(value) > -1,
            },
            {
                title: 'Age',
                dataIndex: 'age',
                width: 150,
                sorter: true,
            },
            {
                title: 'Address',
                dataIndex: 'address',
            },
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
            const [pagination, setPagination] = useState({
                currentPage: 1,
                total: data.length,
                pageSize: 10,
            });
            const [columns, setColumns] = useState(initialColumns);
            const currentData = data.slice((pagination.currentPage - 1) * pagination.pageSize, pagination.currentPage * pagination.pageSize);
            const handleChange = (changeInfo) => {
                onChange(changeInfo);
                const { pagination: tablePagination } = changeInfo;
                if (tablePagination && tablePagination.currentPage !== pagination.currentPage) {
                    setPagination({ ...pagination, currentPage: tablePagination.currentPage });
                    setColumns([...columns]);
                }
            };
            return <Table columns={columns} dataSource={currentData} pagination={pagination} onChange={handleChange} />;
        }

        render(<Demo />);
        await userEvent.click(getPageItems()[2]);
        expect(onChange).toHaveBeenCalled();
        expect(getPageItems()[2]).toHaveClass(`${BASE_CLASS_PREFIX}-page-item-active`);
    });
    it(`可调整列宽的表格`, async () => {
        let columns = [
            {
                title: 'Name',
                dataIndex: 'name',
                width: 150,
                filters: [
                    {
                        text: '名字包含"1"',
                        value: '1',
                    },
                    {
                        text: '名字包含"2"',
                        value: '2',
                    },
                ],
                onFilter: (value, record) => record.name.indexOf(value) > -1,
            },
            {
                title: 'Age',
                dataIndex: 'age',
                width: 150,
                sorter: true,
            },
            {
                title: 'Address',
                dataIndex: 'address',
                width: 300,
            },
            {
                render: (_text, record) => (
                    <Tooltip content={record.description}>
                        <Tag color="green">Show Info</Tag>
                    </Tooltip>
                ),
            },
        ];

        const expandedRowRender = (record) => (
            <article
                style={{
                    margin: 0,
                }}
            >
                <p>{record.description}</p>
            </article>
        );

        render(<Table columns={columns} dataSource={data} resizable expandedRowRender={expandedRowRender} />);
        await waitFor(() => expect(queryAll(`.${BASE_CLASS_PREFIX}-table-thead .${BASE_CLASS_PREFIX}-table-resize-handle`)).toHaveLength(columns.reduce((count, col) => (typeof col.width === 'number' ? count + 1 : count), 0)));
    });
    it('sortOrder 为 descend', async () => {
        const sortColumns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                sorter: (a, b) => a.name.length - b.name.length,
                sortOrder: 'descend',
            },
            {
                title: 'Age',
                dataIndex: 'age',
            },
            {
                title: 'Address',
                dataIndex: 'address',
            },
        ];
        const sortData = [
            {
                key: '1',
                name: 'John Brown',
                age: 32,
                address: 'New York No. 1 Lake Park',
            },
            {
                key: '2',
                name: 'Jim Green',
                age: 42,
                address: 'London No. 1 Lake Park',
            },
            {
                key: '3',
                name: 'Joe Black',
                age: 32,
                address: 'Sidney No. 1 Lake Park',
            },
            {
                key: '4',
                name: 'Jim Red',
                age: 32,
                address: 'London No. 2 Lake Park',
            },
        ];
        const targetData = sortData.reduce((a, b) => (a.name.length > b.name.length ? a : b));
        const { name } = targetData;
        render(<Table columns={sortColumns} dataSource={sortData} />);
        expect(getFirstCellText()).toBe(name);
    });
    it('sortOrder 为 ascend', async () => {
        const sortColumns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                sorter: (a, b) => a.name.length - b.name.length,
                sortOrder: 'ascend',
            },
            {
                title: 'Age',
                dataIndex: 'age',
            },
            {
                title: 'Address',
                dataIndex: 'address',
            },
        ];
        const sortData = [
            {
                key: '1',
                name: 'John Brown',
                age: 32,
                address: 'New York No. 1 Lake Park',
            },
            {
                key: '2',
                name: 'Jim Green',
                age: 42,
                address: 'London No. 1 Lake Park',
            },
            {
                key: '3',
                name: 'Joe Black',
                age: 32,
                address: 'Sidney No. 1 Lake Park',
            },
            {
                key: '4',
                name: 'Jim Red',
                age: 32,
                address: 'London No. 2 Lake Park',
            },
        ];
        const targetData = sortData.reduce((a, b) => (a.name.length < b.name.length ? a : b));
        const { name } = targetData;
        render(<Table columns={sortColumns} dataSource={sortData} />);
        expect(getFirstCellText()).toBe(name);
    });
    it('受控的 sortOrder', async () => {
        const sortColumns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                sorter: (a, b) => a.name.length - b.name.length,
                sortOrder: 'descend',
            },
            {
                title: 'Age',
                dataIndex: 'age',
            },
            {
                title: 'Address',
                dataIndex: 'address',
            },
        ];
        const sortData = [
            {
                key: '1',
                name: 'long name',
                age: 32,
                address: 'New York No. 1 Lake Park',
            },
            {
                key: '2',
                name: 'longest name',
                age: 42,
                address: 'London No. 1 Lake Park',
            },
            {
                key: '3',
                name: 'longer name',
                age: 32,
                address: 'Sidney No. 1 Lake Park',
            },
            {
                key: '4',
                name: 'short',
                age: 32,
                address: 'London No. 2 Lake Park',
            },
        ];
        const targetData = sortData.reduce((a, b) => (a.name.length > b.name.length ? a : b));
        const { name } = targetData;
        const { rerender } = render(<Table columns={sortColumns} dataSource={sortData} />);
        expect(getFirstCellText()).toBe(name);
        const ascendOrderColumns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                sorter: (a, b) => a.name.length - b.name.length,
                sortOrder: 'ascend',
            },
            {
                title: 'Age',
                dataIndex: 'age',
            },
            {
                title: 'Address',
                dataIndex: 'address',
            },
        ];
        rerender(<Table columns={ascendOrderColumns} dataSource={sortData} />);
        const ascendTargetData = sortData.reduce((a, b) => (a.name.length < b.name.length ? a : b));
        const { name: ascendTargetName } = ascendTargetData;
        expect(getFirstCellText()).toBe(ascendTargetName);
        const defaultOrderColumns = [
            {
                title: 'Name',
                dataIndex: 'name',
                sorter: (a, b) => a.name.length - b.name.length,
                sortOrder: false,
            },
            {
                title: 'Age',
                dataIndex: 'age',
            },
            {
                title: 'Address',
                dataIndex: 'address',
            },
        ];
        rerender(<Table columns={defaultOrderColumns} dataSource={sortData} />);
        const defaultTargetData = sortData[0];
        const { name: defaultTargetName } = defaultTargetData;
        expect(getFirstCellText()).toBe(defaultTargetName);
    });
    it('所有行都禁用时的全选', async () => {
        const columns = [
            {
                title: 'Name',
                dataIndex: 'name',
                width: 150,
            },
            {
                title: 'Age',
                dataIndex: 'age',
                width: 150,
            },
            {
                title: 'Address',
                dataIndex: 'address',
            },
        ];
        const rowSelection = {
            onSelectAll: vi.fn<SelectAllChange>(),
            getCheckboxProps: vi.fn<NonNullable<RowSelectionConfig['getCheckboxProps']>>((record) => ({
                disabled: true,
                name: record.name,
            })),
        };
        render(<Table columns={columns} dataSource={data} rowSelection={rowSelection} />);
        await userEvent.click(getHeaderSelectionCheckbox());
        expect(rowSelection.onSelectAll.mock.calls[0][1]).toHaveLength(0);
    });
    it('JSX 异步数据', async () => {
        const asyncData = [
            {
                key: '1',
                name: 'John Brown',
                age: 32,
                address: 'New York No. 1 Lake Park, New York No. 1 Lake Park',
            },
            {
                key: '2',
                name: 'Jim Green',
                age: 42,
                address: 'London No. 1 Lake Park',
            },
            {
                key: '3',
                name: 'Joe Black',
                age: 32,
                address: 'Sidney No. 1 Lake Park',
            },
            {
                key: '4',
                name: 'Michael James',
                age: 99,
                address: 'Sidney No. 1 Lake Park',
            },
        ];
        const renderTable = (dataSource) => (
            <Table dataSource={dataSource}>
                <Column key="name" title="Name" dataIndex="name" render={(text) => <a href="https://semi.design">{text}</a>} />
                <Column key="age" title="Age" dataIndex="age" />
                <Column key="address" title="Address" dataIndex="address" />
            </Table>
        );
        const { rerender } = render(renderTable([]));
        rerender(renderTable(asyncData));
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-thead .${BASE_CLASS_PREFIX}-table-row-head`)).toHaveLength(3);
        expect(getBodyRows()).toHaveLength(4);
        expect(getBodyRows().map((row) => row.getAttribute('data-row-key'))).toEqual(['1', '2', '3', '4']);
    });
    it('Fragment 里的 Table.Column 与直接写出的列同样成为列', () => {
        const rows = [{ key: '1', name: 'Ann', age: 20 }];
        render(
            <Table dataSource={rows} pagination={false}>
                <Column title="Name" dataIndex="name" />
                <>
                    <Column title="Age" dataIndex="age" />
                    {false}
                </>
            </Table>
        );
        expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Name', 'Age']);
        expect(getBodyRows()[0].textContent).toBe('Ann20');
    });
    it('Table.Column 的 elementType 为 Table.Column，声明同名 elementType 的包装组件被识别为列', () => {
        expect(Column.elementType).toBe('Table.Column');
        const WrappedColumn = Object.assign((_props: ColumnProps) => null, { elementType: 'Table.Column' });
        const rows = [{ key: '1', name: 'Ann' }];
        render(
            <Table dataSource={rows} pagination={false}>
                <WrappedColumn title="Name" dataIndex="name" />
            </Table>
        );
        expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Name']);
        expect(getBodyRows()[0].textContent).toBe('Ann');
    });
    it('JSX 列的 key 保持原样，无 key 的列使用默认 key', () => {
        const keys: unknown[] = [];
        const onHeaderCell = (column: { key?: unknown }) => {
            keys.push(column.key);
            return {};
        };
        render(
            <Table dataSource={[{ key: '1', name: 'Ann', age: 20, city: 'X' }]} pagination={false}>
                <Column key="name" title="Name" dataIndex="name" onHeaderCell={onHeaderCell} />
                <>
                    <Column key="age" title="Age" dataIndex="age" onHeaderCell={onHeaderCell} />
                    <Column title="City" dataIndex="city" onHeaderCell={onHeaderCell} />
                </>
            </Table>
        );
        expect(keys).toContain('name');
        expect(keys).toContain('age');
        expect(keys).toContain('0-city');
        expect(keys.some((key) => String(key).startsWith('.'))).toBe(false);
    });
    it('单元格对齐', async () => {
        const columns = getColumns();
        const alignRightColumns = columns.map((column) => {
            column.align = 'right';
            return column;
        });
        render(<Table columns={alignRightColumns} dataSource={data} />);
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-align-right`).length).toBeGreaterThan(0);
        const bodyAlignCells = queryAll(`.${BASE_CLASS_PREFIX}-table-row-cell`);
        expect(bodyAlignCells.length).toBeGreaterThan(0);
        bodyAlignCells.forEach((cell) => {
            expect(cell).toHaveStyle({ textAlign: 'right' });
        });
    });
    it('列 className', async () => {
        const columns = getColumns();
        const alignRightColumns = columns.map((column) => {
            column.className = 'test';
            return column;
        });
        render(<Table columns={alignRightColumns} dataSource={data} />);
        const titleAlignCells = queryAll(`.${BASE_CLASS_PREFIX}-table-row-head`);
        const bodyAlignCells = queryAll(`.${BASE_CLASS_PREFIX}-table-row-cell`);
        expect(titleAlignCells.length).toBeGreaterThan(0);
        expect(bodyAlignCells.length).toBeGreaterThan(0);
        titleAlignCells.forEach((cell) => {
            expect(cell).toHaveClass('test');
        });
        bodyAlignCells.forEach((cell) => {
            expect(cell).toHaveClass('test');
        });
    });
    it('表头外观', async () => {
        const columns = getColumns();
        const { unmount } = render(
            <Table
                columns={columns}
                dataSource={data}
                scroll={{
                    y: 500,
                }}
            />
        );
        expect(queryAll('.semi-table-thead')).toHaveLength(1);
        unmount();

        const jsxColumns = getJSXColumns();
        const { rerender } = render(<Table dataSource={data}>{jsxColumns}</Table>);
        expect(queryAll('.semi-table-thead')).toHaveLength(1);
        rerender(
            <Table dataSource={data} showHeader={false}>
                {jsxColumns}
            </Table>
        );
        expect(queryAll('.semi-table-thead')).toHaveLength(0);
    });
    it('ref 的 getCurrentPageData', async () => {
        const pageSize = 10;
        const refObj = createRef<TableHandle>();
        const columns = getColumns();
        render(
            <Table
                ref={refObj}
                columns={columns}
                dataSource={data}
                pagination={{
                    pageSize,
                }}
            />
        );
        const { dataSource } = refObj.current.getCurrentPageData();
        expect(dataSource).toHaveLength(pageSize);
        const jsxColumns = getJSXColumns();
        const jsxRefObj = createRef<TableHandle>();
        render(
            <Table
                ref={jsxRefObj}
                dataSource={data}
                pagination={{
                    pageSize,
                }}
            >
                {jsxColumns}
            </Table>
        );
        const { dataSource: jsxData } = jsxRefObj.current.getCurrentPageData();
        expect(jsxData).toHaveLength(pageSize);
    });
    it('render expandIcon', async () => {
        const expandedRowRender = () => <div>Semi Design</div>;

        const columns = getColumns();
        const { unmount } = render(<Table columns={columns} dataSource={data} expandIcon={<IconStar size="small" />} expandedRowRender={expandedRowRender} />);
        expect(queryAll('.semi-icon-star').length).toBeGreaterThan(0);
        unmount();
        render(<Table columns={columns} dataSource={data} defaultExpandAllRows expandIcon={(expanded) => <div>{expanded && <IconStar size="small" />}</div>} expandedRowRender={expandedRowRender} />);
        expect(queryAll('.semi-icon-star').length).toBeGreaterThan(0);
    });
    it(`onRow / onCell`, async () => {
        const onRowClick = vi.fn<(event: unknown) => void>();
        const onHeaderRowClick = vi.fn<(event: unknown) => void>();
        const onCellClick = vi.fn<(event: unknown) => void>();
        const onHeaderCellClick = vi.fn<(event: unknown) => void>();
        const onRow = vi.fn<NonNullable<TableProps['onRow']>>(() => ({
            className: 'test-row',
            onClick: onRowClick,
        }));
        const onHeaderRow = vi.fn<NonNullable<TableProps['onHeaderRow']>>(() => ({
            className: 'test-row',
            onClick: onHeaderRowClick,
        }));
        const columns = getColumns();
        const onCellColumns = columns.map((column, index) => {
            const style =
                index === 0
                    ? {
                          width: 200,
                          height: 60,
                      }
                    : {};

            column.onCell = () => ({
                onClick: onCellClick,
                onCellClick,
                style,
            });

            column.onHeaderCell = () => ({
                onClick: onHeaderCellClick,
                style,
            });

            return column;
        });
        render(<Table columns={onCellColumns} dataSource={data} onHeaderRow={onHeaderRow} onRow={onRow} />);
        const tableCells = queryAll('.semi-table-body .semi-table-row-cell');
        const tableHeaderCells = queryAll('.semi-table-thead .semi-table-row-head');
        expect(tableCells[0]).toHaveStyle({ width: '200px', height: '60px' });
        expect(tableHeaderCells[0]).toHaveStyle({ width: '200px', height: '60px' });
        fireEvent.click(tableCells[0]);
        expect(onCellClick).toHaveBeenCalled();
        const tableRows = queryAll('.semi-table-body .semi-table-row');
        expect(tableRows[0]).toHaveClass('test-row');
        fireEvent.click(tableRows[0]);
        expect(onRowClick).toHaveBeenCalled();
        fireEvent.click(tableHeaderCells[0]);
        expect(onHeaderCellClick).toHaveBeenCalled();
        const tableHeaderRows = queryAll('.semi-table-thead .semi-table-row');
        expect(tableHeaderRows[0]).toHaveClass('test-row');
        fireEvent.click(tableHeaderRows[0]);
        expect(onHeaderRowClick).toHaveBeenCalled();
    });
    it(`点击排序列标题时触发 onHeaderCell.onClick`, async () => {
        const onHeaderCellClick = vi.fn<(event: unknown) => void>();
        const sortColumns = [
            {
                title: 'Name',
                dataIndex: 'name',
                width: 150,
            },
            {
                title: 'Age',
                dataIndex: 'age',
                width: 150,
                sorter: (a, b) => a.age - b.age,
                onHeaderCell: () => ({
                    onClick: onHeaderCellClick,
                }),
            },
        ];
        render(<Table columns={sortColumns} dataSource={data} pagination={false} />);
        const headerCells = queryAll('.semi-table-thead .semi-table-row-head');
        await userEvent.click(headerCells[1]);
        expect(onHeaderCellClick).toHaveBeenCalled();
    });
    it('表头合并', async () => {
        const testHeaderMerge = (container) => {
            const rows = container.querySelectorAll('.semi-table-thead .semi-table-row');
            expect(rows).toHaveLength(2);
            const [firstRow, secondRow] = rows;
            expect(firstRow.children[0].colSpan).toEqual(2);
            expect(firstRow.children[1].colSpan).toEqual(2);
            expect(firstRow.children[2].colSpan).toEqual(1);
            expect(firstRow.children[2].rowSpan).toEqual(2);
            expect(secondRow.children[0].colSpan).toEqual(1);
            expect(secondRow.children[1].colSpan).toEqual(1);
            expect(secondRow.children[2].colSpan).toEqual(1);
            expect(secondRow.children[3].colSpan).toEqual(1);
        };

        const nestData = getNestData();
        const filters = [
            {
                text: 'Code 45',
                value: '45',
            },
            {
                text: 'King 4',
                value: 'King 4',
            },
        ];
        const { container: jsxContainer } = render(
            <Table dataSource={nestData}>
                <Column title="Base Information" dataIndex="base" fixed="left">
                    <Column title="Name" dataIndex="name" filters={filters} fixed="left" width={200} onFilter={(value, record: { name: string }) => record.name.includes(value)} />
                    <Column title="Age" dataIndex="age" fixed="left" sorter={(a: { age: number }, b: { age: number }) => (a.age - b.age > 0 ? 1 : -1)} width={100} />
                </Column>
                <Column title="Company Information" dataIndex="company">
                    <Column title="Company Name" dataIndex="company.name" />
                    <Column title="Company Address" dataIndex="company.address" />
                </Column>
                <Column title="Address" dataIndex="address" fixed="right" width={250} />
            </Table>
        );
        const columns = getNestColumns();
        const { container } = render(<Table columns={columns} dataSource={nestData} />);
        testHeaderMerge(jsxContainer);
        testHeaderMerge(container);
    });
    it('没有 columns', async () => {
        const { container: jsxContainer } = render(<Table dataSource={data} />);
        const { container } = render(<Table columns={[]} dataSource={data} />);
        expect(jsxContainer.querySelectorAll('.semi-table-row-head')).toHaveLength(0);
        expect(jsxContainer.querySelectorAll('.semi-table-row-cell')).toHaveLength(0);
        expect(container.querySelectorAll('.semi-table-row-head')).toHaveLength(0);
        expect(container.querySelectorAll('.semi-table-row-cell')).toHaveLength(0);
    });
    it('useFullRender', async () => {
        const columns: ColumnProps[] = [
            {
                dataIndex: 'name',
                width: 250,
                filters: [
                    {
                        text: '名字包含"1"',
                        value: '1',
                    },
                    {
                        text: '名字包含"2"',
                        value: '2',
                    },
                ],
                onFilter: (value, record) => record.name.indexOf(value) > -1,
                sorter: (a, b) => a.name.length - b.name.length,
                useFullRender: true,
                render: (text, _record, _index, { expandIcon, selection, indentText }) => {
                    return (
                        <span
                            className="custom-render"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {indentText}
                            {expandIcon}
                            {selection}
                            <span
                                style={{
                                    marginLeft: 8,
                                }}
                            >
                                {text}
                            </span>
                        </span>
                    );
                },
                title: ({ sorter, filter, selection }) => (
                    <span
                        className="custom-title"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            paddingLeft: 20,
                        }}
                    >
                        {selection}
                        <span
                            style={{
                                marginLeft: 8,
                            }}
                        >
                            Name
                        </span>
                        {sorter}
                        {filter}
                    </span>
                ),
            },
            {
                title: 'Age',
                dataIndex: 'age',
            },
            {
                title: 'Address',
                dataIndex: 'address',
            },
        ];
        const rowSelection: TableProps['rowSelection'] = {
            hidden: true,
            fixed: 'left',
        };
        render(<Table columns={columns} dataSource={data} rowSelection={rowSelection} expandedRowRender={(record) => <article>{record.description}</article>} />);
        const node = document.querySelector('.custom-render');
        expect(node.children).toHaveLength(3);
        expect(containsSelector(node.children[0], '.semi-table-expand-icon')).toBeTruthy();
        expect(containsSelector(node.children[1], '.semi-table-selection-wrap')).toBeTruthy();
        const title = document.querySelector('.custom-title');
        expect(title.children).toHaveLength(4);
        expect(containsSelector(title.children[0], '.semi-table-selection-wrap')).toBeTruthy();
        expect(title.children[1]).toHaveTextContent(/^Name$/);
        expect(containsSelector(title.children[2], '.semi-table-column-sorter')).toBeTruthy();
        expect(containsSelector(title.children[3], '.semi-table-column-filter')).toBeTruthy();
    });
    it('defaultExpandedRowKeys 变化', async () => {
        const expandedRowRender = (_record, index) => <div>{`Semi Design ${index}`}</div>;

        const pageSize = 20;
        const defaultExpandedRowKeys = Array.from({
            length: getRandomNumber(pageSize),
        }).map((_, i) => String(i));
        const newDefaultExpandedRowKeys = Array.from({
            length: getRandomNumber(pageSize),
        }).map((_, i) => String(i));
        const columns = getColumns();
        const renderTable = (defaultExpandedRowKeys) => (
            <Table
                columns={columns}
                dataSource={data}
                defaultExpandedRowKeys={defaultExpandedRowKeys}
                pagination={{
                    pageSize,
                }}
                expandedRowRender={expandedRowRender}
            />
        );
        const { rerender } = render(renderTable(defaultExpandedRowKeys));
        expect(getExpandedRowKeys()).toEqual(defaultExpandedRowKeys);
        rerender(renderTable(newDefaultExpandedRowKeys));
        expect(getExpandedRowKeys()).toEqual(defaultExpandedRowKeys);
    });
    it('getCheckboxProps 变化', async () => {
        const defaultGetCheckboxProps = (record) => ({
            disabled: record.key === '1',
        });

        const newGetCheckboxProps = (record) => ({
            disabled: ['0', '1'].includes(record.key),
        });

        const columns = getColumns();
        const renderTable = (getCheckboxProps) => (
            <Table
                columns={columns}
                dataSource={getData(20)}
                pagination={false}
                rowSelection={{
                    getCheckboxProps,
                }}
            />
        );
        const getDisabledCheckboxes = () => queryAll(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-checkbox-disabled`);
        const { rerender } = render(renderTable(defaultGetCheckboxProps));
        expect(getDisabledCheckboxes()).toHaveLength(1);
        rerender(renderTable(newGetCheckboxProps));
        expect(getDisabledCheckboxes()).toHaveLength(2);
    });
    it('受控分页在 dataSource 变化时重置', async () => {
        const total = 100;
        const pagination = {
            pageSize: 10,
            currentPage: 2,
        };
        const columns = getColumns();
        const { rerender } = render(<Table columns={columns} dataSource={getData(total)} pagination={pagination} />);

        const dataNum = getRandomNumber(100, 40);
        const newData = getData(dataNum);
        rerender(<Table columns={columns} dataSource={newData} pagination={pagination} />);
        expect(getActivePage().innerHTML).toBe('2');
    });

    it('非受控分页在 dataSource 变化时重置', async () => {
        const total = 100;
        const columns = getColumns();
        const { rerender } = render(<Table columns={columns} dataSource={getData(total)} />);
        await userEvent.click(getPageItems()[2]);
        expect(getActivePage().innerHTML).toBe('2');
        const dataNum = getRandomNumber(100, 40);
        const newData = getData(dataNum);
        rerender(<Table columns={columns} dataSource={newData} />);
        expect(getActivePage().innerHTML).toBe('1');
        expect(getFirstCellText()).toBe(newData[0].name);
    });

    it('Table 专用的分页属性不传到 Pagination 根元素', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
            const pagination = { pageSize: 10, formatPageText: () => 'text', 'data-testid': 'pager' };
            render(<Table columns={getColumns()} dataSource={getData(30)} pagination={pagination} />);
            const pager = screen.getByTestId('pager');
            expect(pager).not.toHaveAttribute('position');
            expect(pager).not.toHaveAttribute('formatpagetext');
            expect(error).not.toHaveBeenCalled();
        } finally {
            error.mockRestore();
        }
    });

    it('分页变化', async () => {
        const total = 100;
        const pagination = {
            pageSize: 10,
            currentPage: 2,
        };
        const newPagination = {
            pageSize: 5,
            currentPage: 1,
        };
        const columns = getColumns();
        const tableData = getData(total);
        const { rerender } = render(<Table columns={columns} dataSource={tableData} pagination={pagination} />);
        const getPageNumbers = () =>
            getPageItems()
                .map((item) => Number(item.textContent))
                .filter((page) => !Number.isNaN(page));
        expect(Math.max(...getPageNumbers())).toEqual(total / pagination.pageSize);
        expect(getActivePage()).toHaveTextContent(/^2$/);
        rerender(<Table columns={columns} dataSource={tableData} pagination={newPagination} />);
        expect(Math.max(...getPageNumbers())).toEqual(total / newPagination.pageSize);
        expect(getActivePage()).toHaveTextContent(/^1$/);
    });
    it(`分组数据变化 dataSource`, async () => {
        const data = getGroupData();
        const columns = getGroupColumns();
        const groupedRowClick = vi.fn<(event: unknown) => void>();

        const rowKey = (record) => `${record.city && record.city.toLowerCase()}-${record.job && record.job.toLowerCase()}`;

        const renderTable = (dataSource) => (
            <Table
                clickGroupedRowToExpand
                columns={columns}
                dataSource={dataSource}
                groupBy="city"
                rowKey={rowKey}
                scroll={{
                    y: 480,
                }}
                renderGroupSection={(groupKey) => <strong>Jobs in {groupKey}:</strong>}
                onGroupedRow={() => ({
                    onClick: groupedRowClick,
                })}
            />
        );
        const { rerender } = render(renderTable(data));
        const newData = [
            {
                city: 'Tianjin',
                job: 'FE',
                department: 'IES',
            },
            {
                city: 'Tianjin',
                job: 'Android',
                department: 'IES',
            },
            {
                city: 'Wuhan',
                job: 'Android',
                department: 'IES',
            },
            {
                city: 'Wuhan',
                job: 'SE',
                department: 'EE',
            },
            {
                city: 'Chengdu',
                job: 'Android',
                department: 'EE',
            },
            {
                city: 'Chengdu',
                job: 'IOS',
                department: 'EE',
            },
            {
                city: 'Xiamen',
                job: 'SE',
                department: 'DATA',
            },
            {
                city: 'Xiamen',
                job: 'IOS',
                department: 'DATA',
            },
        ];
        rerender(renderTable(newData));
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-row-section`)).toHaveLength(4);
        expect(screen.getByText('Jobs in Tianjin:')).toBeInTheDocument();
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-body .${BASE_CLASS_PREFIX}-table-row`)).toHaveLength(0);
        await userEvent.click(queryAll(`.${BASE_CLASS_PREFIX}-table-row-section`)[0]);
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-row`).length).toBeGreaterThan(0);
    });
    it(`对象 columns 与 children`, async () => {
        render(
            <Table columns={columns} dataSource={data}>
                <Table.Column key="age" title="Age" dataIndex="age" />
            </Table>
        );
        const headerCells = queryAll(`.${BASE_CLASS_PREFIX}-table-thead .${BASE_CLASS_PREFIX}-table-row-head`);
        expect(headerCells.map((cell) => cell.textContent)).toEqual(columns.map((column) => column.title ?? ''));
    });
    it('表头 colSpan', async () => {
        const columns = [
            {
                title: 'Name',
                dataIndex: 'name',
            },
            {
                title: 'Age',
                dataIndex: 'age',
            },
            {
                title: 'Home phone',
                colSpan: 2,
                dataIndex: 'tel',
            },
            {
                title: 'Phone',
                colSpan: 0,
                dataIndex: 'phone',
            },
            {
                title: 'Address',
                dataIndex: 'address',
            },
        ];
        const data = [
            {
                key: '1',
                name: 'ZhangSan',
                age: 50,
                tel: '010-20000000',
                phone: 10010,
                address: 'BeiJing No.1 High School',
            },
            {
                key: '2',
                name: 'LiSi',
                tel: '010-30000000',
                phone: 10086,
                age: 40,
                address: 'ShangHai No. 1 High School',
            },
            {
                key: '3',
                name: 'WangWu',
                age: 60,
                tel: '010-40000000',
                phone: 10011,
                address: 'NaiJing No.1 High School',
            },
            {
                key: '4',
                name: 'XiaoMing',
                age: 20,
                tel: '010-50000000',
                phone: 12580,
                address: 'ShiJiaZhuang No.1 High School',
            },
            {
                key: '5',
                name: 'XiaoHong',
                age: 40,
                tel: '010-60000000',
                phone: 12530,
                address: 'TaiBei No.2 High School',
            },
        ];
        render(<Table columns={columns} dataSource={data} />);
        expect(queryAll('.semi-table-row .semi-table-row-head')).toHaveLength(columns.length - 1);
    });

    it('expandAllRows', async () => {
        const expandedRowRender = () => <div>Semi Design</div>;
        const initData = [];

        const columns = getColumns();
        const renderTable = (props) => <Table columns={columns} pagination={false} expandedRowRender={expandedRowRender} {...props} />;
        const { rerender } = render(renderTable({ dataSource: initData, expandAllRows: true }));

        const newData = getData(20);
        rerender(renderTable({ dataSource: newData, expandAllRows: true }));
        expect(getExpandedRowKeys()).toHaveLength(newData.length);
        rerender(renderTable({ dataSource: newData, expandAllRows: false }));
        expect(getExpandedRowKeys()).toHaveLength(0);
    });

    it(`defaultExpandAllGroupRows`, async () => {
        const data = getGroupData();
        const columns = getGroupColumns();
        const rowKey = (record) => `${record.city && record.city.toLowerCase()}-${record.job && record.job.toLowerCase()}`;
        const groupSize = new Set(data.map((item) => item.city)).size;

        render(<Table columns={columns} dataSource={data} defaultExpandAllGroupRows groupBy="city" rowKey={rowKey} scroll={{ y: 480 }} renderGroupSection={(groupKey) => <strong>Jobs in {groupKey}:</strong>} />);

        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row-section.on`)).toHaveLength(groupSize);
    });

    it(`expandAllGroupRows`, async () => {
        const data = getGroupData();
        const groupSize = new Set(data.map((item) => item.city)).size;
        const columns = getGroupColumns();
        const rowKey = (record) => `${record.city && record.city.toLowerCase()}-${record.job && record.job.toLowerCase()}`;

        const renderTable = (props) => <Table columns={columns} groupBy="city" rowKey={rowKey} scroll={{ y: 480 }} renderGroupSection={(groupKey) => <strong>Jobs in {groupKey}:</strong>} {...props} />;
        const { rerender } = render(renderTable({ dataSource: [], expandAllGroupRows: true }));

        rerender(renderTable({ dataSource: data, expandAllGroupRows: true }));
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row-section.on`)).toHaveLength(groupSize);
        rerender(renderTable({ dataSource: data, expandAllGroupRows: false }));
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row-section.on`)).toHaveLength(0);
    });

    it('defaultSortOrder 为 descend', async () => {
        const sortColumns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                sorter: (a, b) => a.name.length - b.name.length,
                defaultSortOrder: 'descend',
            },
            {
                title: 'Age',
                dataIndex: 'age',
            },
            {
                title: 'Address',
                dataIndex: 'address',
            },
        ];
        const sortData = [
            {
                key: '1',
                name: 'long name',
                age: 32,
                address: 'New York No. 1 Lake Park',
            },
            {
                key: '2',
                name: 'longest name',
                age: 42,
                address: 'London No. 1 Lake Park',
            },
            {
                key: '3',
                name: 'longer name',
                age: 32,
                address: 'Sidney No. 1 Lake Park',
            },
            {
                key: '4',
                name: 'short',
                age: 32,
                address: 'London No. 2 Lake Park',
            },
        ];
        const onChange = vi.fn<TableChange>();

        const targetData = sortData.reduce((a, b) => (a.name.length > b.name.length ? a : b));
        const { name } = targetData;
        const { unmount } = render(<Table columns={sortColumns} dataSource={sortData} onChange={onChange} />);
        expect(getFirstCellText()).toBe(name);

        unmount();
    });

    it('defaultSortOrder 为 ascend', async () => {
        const ascendOrderColumns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                sorter: (a, b) => a.name.length - b.name.length,
                defaultSortOrder: 'ascend',
            },
            {
                title: 'Age',
                dataIndex: 'age',
            },
            {
                title: 'Address',
                dataIndex: 'address',
            },
        ];
        const sortData = [
            {
                key: '1',
                name: 'long name',
                age: 32,
                address: 'New York No. 1 Lake Park',
            },
            {
                key: '2',
                name: 'longest name',
                age: 42,
                address: 'London No. 1 Lake Park',
            },
            {
                key: '3',
                name: 'longer name',
                age: 32,
                address: 'Sidney No. 1 Lake Park',
            },
            {
                key: '4',
                name: 'short',
                age: 32,
                address: 'London No. 2 Lake Park',
            },
        ];
        const onChange = vi.fn<TableChange>();

        const { unmount } = render(<Table columns={ascendOrderColumns} dataSource={sortData} onChange={onChange} />);

        const ascendTargetData = sortData.reduce((a, b) => (a.name.length < b.name.length ? a : b));
        const { name: ascendTargetName } = ascendTargetData;
        expect(getFirstCellText()).toBe(ascendTargetName);
        unmount();
    });

    it('defaultSortOrder 为 false', async () => {
        const sortColumns = [
            {
                title: 'Name',
                dataIndex: 'name',
                sorter: (a, b) => a.name.length - b.name.length,
                defaultSortOrder: false,
            },
            {
                title: 'Age',
                dataIndex: 'age',
            },
            {
                title: 'Address',
                dataIndex: 'address',
            },
        ];
        const sortData = [
            {
                key: '1',
                name: 'long name',
                age: 32,
                address: 'New York No. 1 Lake Park',
            },
            {
                key: '2',
                name: 'longest name',
                age: 42,
                address: 'London No. 1 Lake Park',
            },
            {
                key: '3',
                name: 'longer name',
                age: 32,
                address: 'Sidney No. 1 Lake Park',
            },
            {
                key: '4',
                name: 'short',
                age: 32,
                address: 'London No. 2 Lake Park',
            },
        ];
        const onChange = vi.fn<TableChange>();

        const { rerender, unmount } = render(<Table columns={sortColumns} dataSource={sortData} onChange={onChange} />);

        const defaultTargetData = sortData[0];
        const { name: defaultTargetName } = defaultTargetData;
        expect(getFirstCellText()).toBe(defaultTargetName);

        const getSorter = () => document.querySelector(`.${BASE_CLASS_PREFIX}-table-thead .${BASE_CLASS_PREFIX}-table-column-sorter`);
        await userEvent.click(getSorter());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].sorter.sortOrder).toBe('ascend');
        await userEvent.click(getSorter());
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[1][0].sorter.sortOrder).toBe('descend');

        const newData = [
            {
                key: '1',
                name: 'longest name',
                age: 18,
                address: 'New York No. 1 Lake Park',
            },
            {
                key: '2',
                name: 'long name',
                age: 20,
                address: 'London No. 1 Lake Park',
            },
            {
                key: '3',
                name: 'longer name',
                age: 16,
                address: 'Sidney No. 1 Lake Park',
            },
            {
                key: '4',
                name: 'short',
                age: 33,
                address: 'London No. 2 Lake Park',
            },
        ];
        rerender(<Table columns={sortColumns} dataSource={newData} onChange={onChange} />);
        const newDescendTargetData = newData.reduce((a, b) => (a.name.length > b.name.length ? a : b));
        const { name: newDescendTargetName } = newDescendTargetData;
        expect(getFirstCellText()).toBe(newDescendTargetName);
        unmount();
    });

    it(`expandRowByClick`, async () => {
        const expandEventTypes = [];
        const onExpand = vi.fn<NonNullable<TableProps['onExpand']>>((_expanded, _record, e) => expandEventTypes.push(e.type));
        const onExpandedRowsChange = vi.fn<NonNullable<TableProps['onExpandedRowsChange']>>();

        render(<Table columns={columns} dataSource={data} expandRowByClick expandedRowRender={() => <div>Semi Design</div>} onExpand={onExpand} onExpandedRowsChange={onExpandedRowsChange} />);

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
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row-expanded`));
        expect(getExpandedRowKeys()).toEqual(['1']);
    });

    it(`展开行重新渲染`, async () => {
        const expandedRowRender = vi.fn<NonNullable<TableProps['expandedRowRender']>>(() => <div>Semi Design</div>);
        render(<Table columns={columns} dataSource={data} expandedRowRender={expandedRowRender} />);

        const expandIcons = queryAll(`.semi-table-tbody .semi-table-row .semi-table-expand-icon`);
        await userEvent.click(expandIcons[0]);
        await userEvent.click(expandIcons[1]);
        expect(expandedRowRender).toHaveBeenCalledTimes(2);
    });

    it('点击排序器时 defaultFilteredValue 出现在 onChange 中', async () => {
        const columns: ColumnProps[] = [
            {
                title: '标题',
                dataIndex: 'name',
                width: 400,
                render: (text) => {
                    return <div>{text}</div>;
                },
                filters: [
                    {
                        text: 'Semi Design 设计稿',
                        value: 'Semi Design 设计稿',
                    },
                    {
                        text: 'Semi Pro 设计稿',
                        value: 'Semi Pro 设计稿',
                    },
                ],
                onFilter: (value, record) => record.name.includes(value),
                defaultFilteredValue: ['Semi Pro 设计稿'],
            },
            {
                title: '大小',
                dataIndex: 'size',
                sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
                defaultSortOrder: 'ascend',
                render: (text) => `${text} KB`,
            },
            {
                title: '所有者',
                dataIndex: 'owner',
                render: (text) => {
                    return <div>{text}</div>;
                },
            },
        ];

        const getData = (total) => {
            const data = [];
            for (let i = 0; i < total; i++) {
                const isSemiDesign = i % 2 === 0;
                const randomNumber = (i * 1000) % 199;
                data.push({
                    key: '' + i,
                    name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi Pro 设计稿${i}.fig`,
                    owner: isSemiDesign ? '姜鹏志' : '郝宣',
                    size: randomNumber,
                    avatarBg: isSemiDesign ? 'grey' : 'red',
                });
            }
            return data;
        };

        const data = getData(25);

        const onChange = vi.fn<TableChange>();

        const { unmount } = render(<Table columns={columns} dataSource={data} onChange={onChange} />);
        await userEvent.click(document.querySelector('.semi-table-column-sorter'));
        expect(onChange).toHaveBeenCalledTimes(1);
        const arg = onChange.mock.calls[0][0];
        expect(arg.filters).toHaveLength(1);
        expect(arg.filters[0].defaultFilteredValue).toEqual(['Semi Pro 设计稿']);
        expect(arg.filters[0].filteredValue).toEqual(['Semi Pro 设计稿']);
        unmount();
    });

    it('点击筛选时 defaultSortOrder 出现在 onChange 中', async () => {
        const defaultSortOrder = 'ascend';
        const columns: ColumnProps[] = [
            {
                title: '标题',
                dataIndex: 'name',
                width: 400,
                render: (text) => {
                    return <div>{text}</div>;
                },
                filters: [
                    {
                        text: 'Semi Design 设计稿',
                        value: 'Semi Design 设计稿',
                    },
                    {
                        text: 'Semi Pro 设计稿',
                        value: 'Semi Pro 设计稿',
                    },
                ],
                onFilter: (value, record) => record.name.includes(value),
                defaultFilteredValue: ['Semi Pro 设计稿'],
            },
            {
                title: '大小',
                dataIndex: 'size',
                sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
                defaultSortOrder: 'ascend',
                render: (text) => `${text} KB`,
            },
            {
                title: '所有者',
                dataIndex: 'owner',
                render: (text) => {
                    return <div>{text}</div>;
                },
            },
        ];

        const getData = (total) => {
            const data = [];
            for (let i = 0; i < total; i++) {
                const isSemiDesign = i % 2 === 0;
                const randomNumber = (i * 1000) % 199;
                data.push({
                    key: '' + i,
                    name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi Pro 设计稿${i}.fig`,
                    owner: isSemiDesign ? '姜鹏志' : '郝宣',
                    size: randomNumber,
                    avatarBg: isSemiDesign ? 'grey' : 'red',
                });
            }
            return data;
        };

        const data = getData(25);

        const onChange = vi.fn<TableChange>();

        const { unmount } = render(<Table columns={columns} dataSource={data} onChange={onChange} />);
        await userEvent.click(document.querySelector('.semi-table-column-filter'));
        const filterNode = await waitFor(() => {
            const node = queryAll('.semi-checkbox-addon').find((node) => node.textContent === 'Semi Design 设计稿');
            expect(node).toBeDefined();
            return node;
        });
        await userEvent.click(filterNode);
        expect(onChange).toHaveBeenCalledTimes(1);
        const arg = onChange.mock.calls[0][0];
        // ChangeInfoSorter declares only dataIndex, sortOrder and sorter; the runtime passes the whole column
        expect(arg.sorter).toHaveProperty('defaultSortOrder', defaultSortOrder);
        expect(arg.sorter.sortOrder).toBe(defaultSortOrder);
        unmount();
    });
});

describe('Table 回归用例', () => {
    const getFileData = (total, otherName = 'Semi Pro 设计稿') =>
        Array.from({ length: total }, (_, i) => ({
            key: `${i}`,
            name: i % 2 === 0 ? `Semi Design 设计稿${i}.fig` : `${otherName}${i}.fig`,
            owner: i % 2 === 0 ? '姜鹏志' : '郝宣',
            size: (i * 1000) % 199,
        }));
    const nameFilters = [
        { text: 'Semi Design 设计稿', value: 'Semi Design 设计稿' },
        { text: 'Semi Pro 设计稿', value: 'Semi Pro 设计稿' },
    ];
    const getRowCellTexts = (index) => [...getBodyRows()[index].children].map((cell) => cell.textContent);
    const getHeaderCheckbox = () => document.querySelector(`.${BASE_CLASS_PREFIX}-table-thead .${BASE_CLASS_PREFIX}-checkbox`);
    const getBodyCheckboxes = () => queryAll(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-checkbox`);
    const getCheckedBodyCount = () => getBodyCheckboxes().filter((el) => el.classList.contains(`${BASE_CLASS_PREFIX}-checkbox-checked`)).length;
    const clickPage = (page) => userEvent.click(getPageItems().find((item) => item.textContent === `${page}`));
    const getPaginationInfo = () => document.querySelector(`.${BASE_CLASS_PREFIX}-table-pagination-info`).textContent;
    const openFilter = async () => {
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-table-column-filter`));
        await screen.findAllByText(nameFilters[0].text);
    };
    const clickFilterItem = (text) => userEvent.click(queryAll(`.${BASE_CLASS_PREFIX}-dropdown-item`).find((item) => item.textContent === text));

    it('FixRenderReturnProps：固定列上应用 render 返回的 rowSpan', () => {
        const columns = [
            {
                title: 'Name',
                dataIndex: 'name',
                width: 200,
                fixed: true,
                render: (text, _row, index) => ({
                    children: <a href="https://semi.design">{text}</a>,
                    props: index === 0 ? { rowSpan: 2 } : index === 1 ? { rowSpan: 0 } : {},
                }),
            },
            { title: 'Age', width: 200, dataIndex: 'age' },
            { title: 'Home phone', colSpan: 2, width: 200, dataIndex: 'tel' },
            { title: 'Phone', colSpan: 0, width: 200, dataIndex: 'phone' },
        ];
        const data = [
            { key: '1', name: 'John Brown', age: 32, tel: '0571-22098909', phone: 18889898989 },
            { key: '2', name: 'Jim Green', age: 42, tel: '0571-22098333', phone: 18889898888 },
            { key: '3', name: 'Joe Black', age: 32, tel: '0575-22098909', phone: 18900010002 },
        ];
        render(<Table columns={columns} dataSource={data} />);
        const rows = getBodyRows();
        expect(rows[0].children[0]).toHaveAttribute('rowspan', '2');
        expect(rows[0].children[0]).toHaveClass(`${BASE_CLASS_PREFIX}-table-cell-fixed-left`);
        expect(rows[0].children[0].querySelector('a')).toHaveTextContent('John Brown');
        expect(getRowCellTexts(1)).toEqual(['42', '0571-22098333', '18889898888']);
        expect(getRowCellTexts(2)).toEqual(['Joe Black', '32', '0575-22098909', '18900010002']);
        expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
    });

    it('fix #325：表头选择反映所有页，跳过禁用行', async () => {
        const data = getFileData(6);
        render(<Table columns={[{ title: '标题', dataIndex: 'name' }]} dataSource={data} pagination={{ pageSize: 3 }} rowSelection={{ getCheckboxProps: (record) => ({ disabled: record.key === '2' }) }} />);
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
        const props = { columns: [{ title: '标题', dataIndex: 'name' }], dataSource: getFileData(3) };
        const { rerender } = render(<Table {...props} rowSelection={false} />);
        rerender(<Table {...props} rowSelection={{ selectedRowKeys: null, onChange }} />);
        await userEvent.click(getBodyCheckboxes()[1]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toEqual(['1']);
        expect(getCheckedBodyCount()).toBe(1);
    });

    it('fix #381：选择变化导致 columns 重建时保留当前页', async () => {
        const data = getFileData(46);
        function Demo() {
            const [rowKeys, setRowKeys] = useState([]);
            const columns = [
                { title: '标题', dataIndex: 'name', filters: nameFilters, onFilter: (v, r) => r.name.includes(v) },
                { title: '大小', dataIndex: 'size', sorter: (a, b) => a.size - b.size },
            ];
            return <Table columns={columns} dataSource={data} pagination={{ pageSize: 5 }} rowSelection={{ onChange: setRowKeys, selectedRowKeys: rowKeys }} scroll={{ y: 300 }} />;
        }
        render(<Demo />);
        await clickPage(2);
        expect(getActivePage()).toHaveTextContent('2');
        await userEvent.click(getBodyCheckboxes()[1]);
        expect(getCheckedBodyCount()).toBe(1);
        expect(getActivePage()).toHaveTextContent('2');
        expect(getFirstCellText()).not.toBe(data[0].name);
    });

    it('fix #619：重新渲染后保留嵌套 JSX 列的分组表头', () => {
        const groups = [
            { title: 'Base Information', children: ['name', 'age'] },
            { title: 'Company Information', children: ['company.name', 'company.address'] },
        ];
        const data = [{ key: '0', name: 'Edward', age: 1, company: { name: 'ByteDance', address: 'Zhichun Road' } }];
        const renderChildren = () => [
            ...groups.map((group, groupIndex) => (
                <Table.Column key={groupIndex} title={group.title}>
                    {group.children.map((dataIndex) => (
                        <Table.Column key={dataIndex} title={dataIndex} dataIndex={dataIndex} />
                    ))}
                </Table.Column>
            )),
            <Table.Column key="lastColumn" title="" render={() => 123} />,
        ];
        const getHeaderRows = () => queryAll(`.${BASE_CLASS_PREFIX}-table-thead .${BASE_CLASS_PREFIX}-table-row`);
        const { rerender } = render(<Table dataSource={data}>{renderChildren()}</Table>);
        rerender(<Table dataSource={data}>{renderChildren()}</Table>);
        expect(getHeaderRows()).toHaveLength(2);
        expect(screen.getByText('Base Information').closest('th')).toHaveAttribute('colspan', '2');
        expect(screen.getByText('Company Information').closest('th')).toHaveAttribute('colspan', '2');
        expect(getRowCellTexts(0)).toEqual(['Edward', '1', 'ByteDance', 'Zhichun Road', '123']);
    });

    it('fix #650：可调整列宽的表格删除一列后保留各列宽度', () => {
        const columns = [
            { title: '标题', dataIndex: 'name', width: 300 },
            { title: '大小', dataIndex: 'size', width: 100 },
            { title: '所有者', dataIndex: 'owner', width: 200 },
            { title: '', dataIndex: 'operate', render: () => 'more' },
        ];
        const getColWidths = () => queryAll(`.${BASE_CLASS_PREFIX}-table-col`).map((col) => col.style.width);
        const { rerender } = render(<Table columns={columns} dataSource={getFileData(3)} pagination={false} resizable />);
        expect(getColWidths()).toEqual(['300px', '100px', '200px', '']);
        rerender(<Table columns={columns.filter((_, index) => index !== 1)} dataSource={getFileData(3)} pagination={false} resizable />);
        expect(getColWidths()).toEqual(['300px', '200px', '']);
    });

    it('fix #849：表头由 scroll.y 固定时 onHeaderRow 正常工作', async () => {
        const onHeaderRowClick = vi.fn<(event: unknown) => void>();
        const columns: ColumnProps[] = [
            { title: '标题', dataIndex: 'name', fixed: true, width: 250 },
            { title: '大小', dataIndex: 'size', width: 200 },
            { title: '', dataIndex: 'operate', fixed: 'right', width: 100 },
        ];
        render(<Table columns={columns} dataSource={getFileData(46)} rowSelection={{ fixed: true }} scroll={{ y: 300, x: 1200 }} onHeaderRow={() => ({ onClick: onHeaderRowClick, className: 'test-header-row' })} />);
        const headerRow = screen.getByText('标题').closest('tr');
        expect(headerRow.closest(`.${BASE_CLASS_PREFIX}-table-header`)).not.toBeNull();
        expect(headerRow).toHaveClass('test-header-row');
        await userEvent.click(screen.getByText('标题'));
        expect(onHeaderRowClick).toHaveBeenCalledTimes(1);
    });

    it('fix #1036：按多个值筛选时保留原始行顺序', async () => {
        const columns = [
            {
                title: '标题',
                dataIndex: 'name',
                filters: nameFilters,
                onFilter: (value, record) => record.name.includes(value),
                sorter: (a, b) => (a.name.length - b.name.length > 0 ? 1 : -1),
            },
            { title: '大小', dataIndex: 'size' },
        ];
        render(<Table columns={columns} dataSource={getFileData(46)} rowSelection={{}} scroll={{ y: 300 }} />);
        await openFilter();
        await clickFilterItem('Semi Design 设计稿');
        await clickFilterItem('Semi Pro 设计稿');
        expect(getBodyRows()[0]).toHaveTextContent('Semi Design 设计稿0.fig');
        expect(getBodyRows()[1]).toHaveTextContent('Semi Pro 设计稿1.fig');
    });

    // dev-mode crash: resizable columns were deep cloned together with the React element title
    it('fix #1506：带元素标题的可调整列宽表格与表单并列渲染', async () => {
        function App({ title }) {
            return (
                <div>
                    <form aria-label="filters" />
                    <Table columns={[{ dataIndex: 'dau', title, width: 300 }]} dataSource={[]} resizable />
                </div>
            );
        }
        const { rerender } = render(<App title={<div>ccc</div>} />);
        await waitFor(() => expect(queryAll(`.${BASE_CLASS_PREFIX}-table-thead .${BASE_CLASS_PREFIX}-table-resize-handle`)).toHaveLength(1));
        rerender(<App title={<div>ddd</div>} />);
        expect(screen.getByRole('form', { name: 'filters' })).toBeInTheDocument();
        expect(screen.getByText('ddd').closest('th')).toHaveClass(`${BASE_CLASS_PREFIX}-table-row-head`);
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-thead .${BASE_CLASS_PREFIX}-table-resize-handle`)).toHaveLength(1);
        expect(screen.getByText('暂无数据')).toBeInTheDocument();
    });

    it('可调整列宽表格加载时，普通 th 上不保留列宽调整标记', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
            render(
                <Table
                    columns={[
                        { dataIndex: 'a', title: 'A', width: 100, resize: false },
                        { dataIndex: 'b', title: 'B', width: 100 },
                    ]}
                    dataSource={[]}
                    resizable
                />
            );
            await waitFor(() => expect(queryAll(`.${BASE_CLASS_PREFIX}-table-thead .${BASE_CLASS_PREFIX}-table-resize-handle`)).toHaveLength(1));
            expect(spy.mock.calls.flat().join(' ')).not.toMatch(/non-boolean attribute/);
        } finally {
            spy.mockRestore();
        }
    });

    it('fix #1556：显示展开列时，叶子行不额外缩进', () => {
        const columns = [
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Age', dataIndex: 'age', key: 'age', width: 150 },
        ];
        const data = [
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
        const getIndentClass = (rowKey) => document.querySelector(`.${BASE_CLASS_PREFIX}-table-tbody tr[data-row-key="${rowKey}"]`).querySelector(`.${BASE_CLASS_PREFIX}-table-row-indent`)?.className;
        const { rerender } = render(<Table columns={columns} dataSource={data} defaultExpandAllRows hideExpandedColumn={false} />);
        expect(getIndentClass(11)).toContain('indent-level-1');
        expect(getIndentClass(12)).toContain('indent-level-1');
        rerender(<Table columns={columns} dataSource={data} defaultExpandAllRows hideExpandedColumn />);
        expect(getIndentClass(11)).toContain('indent-level-2');
        expect(getIndentClass(12)).toContain('indent-level-1');
    });

    it('fix #1572：没有 onFilter 的列，onChange 仍报告其筛选值', async () => {
        const onChange = vi.fn<TableChange>();
        const columns = [
            {
                title: '标题',
                dataIndex: 'name',
                filters: nameFilters,
                sorter: (a, b) => (a.name.length - b.name.length > 0 ? 1 : -1),
                defaultFilteredValue: ['Semi Pro 设计稿'],
            },
            { title: '大小', dataIndex: 'size', sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1) },
        ];
        render(<Table columns={columns} dataSource={getFileData(46)} scroll={{ y: 300 }} onChange={onChange} />);
        await userEvent.click(queryAll(`.${BASE_CLASS_PREFIX}-table-column-sorter`)[1]);
        expect(onChange).toHaveBeenCalledTimes(1);
        const { filters } = onChange.mock.calls[0][0];
        expect(filters).toHaveLength(1);
        expect(filters[0].filteredValue).toEqual(['Semi Pro 设计稿']);
    });

    it('fix #1885：分页跟随 size changer 选择的每页条数，而非给定的 pageSize', async () => {
        const pagination: TableProps['pagination'] = { pageSize: 20, showSizeChanger: true, position: 'top' };
        render(<Table columns={[{ title: '标题', dataIndex: 'name' }]} dataSource={getFileData(46)} pagination={pagination} />);
        expect(getPaginationInfo()).toBe('显示第 1 条-第 20 条，共 46 条');
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-page-switch .${BASE_CLASS_PREFIX}-select`));
        await userEvent.click((await screen.findAllByRole('option'))[0]);
        // a controlled Select reports the change after the leave animation, which jsdom never ends
        act(() => endLeaveAnimations());
        expect(getPaginationInfo()).toBe('显示第 1 条-第 10 条，共 46 条');
        await clickPage(4);
        expect(getPaginationInfo()).toBe('显示第 31 条-第 40 条，共 46 条');
        expect(getActivePage()).toHaveTextContent('4');
        await clickPage(5);
        expect(getPaginationInfo()).toBe('显示第 41 条-第 46 条，共 46 条');
        expect(getBodyRows()).toHaveLength(6);
    });

    it('fix #2001：所有行既禁用又选中时，表头复选框为选中状态', async () => {
        const data = Array.from({ length: 20 }, (_, index) => ({ key: index, name: `name ${index}` }));
        function App() {
            const [selectAll, setSelectAll] = useState(false);
            const [keys, setKeys] = useState([]);
            return (
                <div>
                    <button
                        onClick={() => {
                            setSelectAll(true);
                            setKeys(data.map((row) => row.key));
                        }}
                    >
                        点击全选
                    </button>
                    <Table
                        columns={[{ title: 'name', dataIndex: 'name' }]}
                        dataSource={data}
                        rowSelection={{
                            disabled: selectAll,
                            getCheckboxProps: () => (selectAll ? { disabled: true } : {}),
                            onChange: setKeys,
                            selectedRowKeys: keys,
                        }}
                    />
                </div>
            );
        }
        render(<App />);
        expect(getHeaderCheckbox()).not.toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-checked`);
        await userEvent.click(screen.getByRole('button', { name: '点击全选' }));
        expect(getHeaderCheckbox()).toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-checked`);
        expect(getHeaderCheckbox()).not.toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-indeterminate`);
    });

    it('fix #2036：rowSelection.hidden 隐藏可调整列宽表格的选择列', () => {
        const columns = [
            { title: '标题', dataIndex: 'name', width: 300 },
            { title: '大小', dataIndex: 'size', width: 200 },
        ];
        const getSelectionCells = () => queryAll(`.${BASE_CLASS_PREFIX}-table-column-selection`);
        const renderTable = (hidden) => <Table bordered columns={columns} dataSource={getFileData(5)} resizable rowSelection={{ hidden }} />;
        const { rerender } = render(renderTable(false));
        expect(getSelectionCells().length).toBeGreaterThan(0);
        rerender(renderTable(true));
        expect(getSelectionCells()).toHaveLength(0);
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-thead .${BASE_CLASS_PREFIX}-table-row-head`)).toHaveLength(2);
        rerender(renderTable(false));
        expect(getSelectionCells().length).toBeGreaterThan(0);
    });

    it.each([
        ['FixedExpandGroupRow', false],
        ['FixedDefaultExpandedGroupedRows (fix #2085)', true],
    ])('%s：受控的 expandedRowKeys 展开分组行', (_, defaultExpandAllGroupRows) => {
        const data = [
            { key: '1', name: 'Semi Design 设计稿.fig', size: '2M' },
            { key: '2', name: 'Semi Design 分享演示文稿', size: '2M' },
            { key: '3', name: '设计文档', size: '34KB' },
        ];
        const renderTable = (dataSource: typeof data, expandedRowKeys) => (
            <Table
                columns={[
                    { title: '标题', dataIndex: 'name' },
                    { title: '大小', dataIndex: 'size' },
                ]}
                dataSource={dataSource}
                defaultExpandAllGroupRows={defaultExpandAllGroupRows}
                expandedRowKeys={expandedRowKeys}
                groupBy="size"
                pagination={false}
                rowKey="name"
                expandedRowRender={(record) => <div>detail of {record.name}</div>}
                renderGroupSection={(groupKey) => <strong>group {groupKey}</strong>}
            />
        );
        const { rerender } = render(renderTable([], ['Semi Design 设计稿.fig']));
        rerender(renderTable(data, ['2M', '34KB', 'Semi Design 设计稿.fig']));
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-row-section.on`)).toHaveLength(2);
        expect(getExpandedRowKeys()).toEqual(['Semi Design 设计稿.fig']);
        expect(screen.getByText('detail of Semi Design 设计稿.fig')).toBeInTheDocument();
        expect(screen.queryByText('detail of 设计文档')).not.toBeInTheDocument();
    });

    it('fix #2128：dataSource 为空时，表头复选框不选中', () => {
        render(<Table columns={[{ title: '标题', dataIndex: 'name' }]} dataSource={[]} pagination={{ pageSize: 3 }} rowSelection />);
        expect(getHeaderCheckbox()).toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-unChecked`);
        expect(getHeaderCheckbox()).not.toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-checked`);
    });

    it('fix #2185：onGroupedRow 的 className 应用到分组区块行', async () => {
        const onClick = vi.fn<(event: unknown) => void>();
        render(
            <Table
                clickGroupedRowToExpand
                columns={[
                    { title: '标题', dataIndex: 'name' },
                    { title: '所有者', dataIndex: 'owner' },
                ]}
                dataSource={getFileData(10)}
                groupBy="owner"
                scroll={{ y: 480 }}
                renderGroupSection={(groupKey) => <strong>group {groupKey}</strong>}
                onGroupedRow={() => ({ className: 'test-group', onClick })}
            />
        );
        const sections = queryAll(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row-section`);
        expect(sections).toHaveLength(2);
        sections.forEach((section) => expect(section).toHaveClass('test-group'));
        await userEvent.click(screen.getByText('group 姜鹏志'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Semi Design 设计稿0.fig')).toBeInTheDocument();
    });

    it('fix #2425：expandIcon 为 false 时，children 为空的行不缩进', () => {
        const columns = [
            { title: 'Key', dataIndex: 'dataKey', key: 'dataKey' },
            { title: '名称', dataIndex: 'name', key: 'name', width: 200 },
        ];
        const data = [
            { key: 99, dataKey: 99, name: 'row 99', children: [] },
            {
                key: 2,
                dataKey: 'text_info',
                name: '文本信息',
                children: [{ key: 21, dataKey: 'title', name: '视频标题' }],
            },
        ];
        const getIndentClass = (rowKey) => document.querySelector(`.${BASE_CLASS_PREFIX}-table-tbody tr[data-row-key="${rowKey}"]`).querySelector(`.${BASE_CLASS_PREFIX}-table-row-indent`)?.className;
        const { rerender } = render(<Table columns={columns} dataSource={data} defaultExpandAllRows expandIcon={false} />);
        expect(getIndentClass(99)).toBeUndefined();
        expect(getIndentClass(21)).toContain('indent-level-1');
        rerender(<Table columns={columns} dataSource={data} defaultExpandAllRows />);
        expect(getIndentClass(99)).toContain('indent-level-1');
        expect(getIndentClass(21)).toContain('indent-level-2');
    });
});

describe('Table 行为基线', () => {
    const P = BASE_CLASS_PREFIX;
    const smallData = () => [
        { key: '1', name: 'b', age: 2 },
        { key: '2', name: 'a', age: 1 },
        { key: '3', name: 'c', age: 3 },
    ];
    const getNames = () => getBodyRows().map((row) => row.querySelector(`.${P}-table-row-cell`).textContent);
    const getSortStates = () => screen.getAllByRole('columnheader').map((th) => th.getAttribute('aria-sort'));
    const openFilter = async () => {
        await userEvent.click(document.querySelector(`.${P}-table-thead .${P}-table-column-filter`));
        // the menu is in the DOM (being measured) before it opens; onVisibleChange(true) lands later on a timer
        await waitFor(() => expect(document.querySelector(`.${P}-dropdown-wrapper-show`)).toBeInTheDocument());
    };

    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('非受控时点击表头依次排序：ascend、descend，然后取消', async () => {
        const onChange = vi.fn<TableChange>();
        const columns = [
            { title: 'Name', dataIndex: 'name' },
            { title: 'Age', dataIndex: 'age', sorter: (a, b) => a.age - b.age },
        ];
        render(<Table columns={columns} dataSource={smallData()} pagination={false} onChange={onChange} />);
        const ageHeader = screen.getByText('Age').closest('th');
        await userEvent.click(ageHeader);
        expect(getNames()).toEqual(['a', 'b', 'c']);
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                sorter: expect.objectContaining({ dataIndex: 'age', sortOrder: 'ascend' }),
                extra: { changeType: 'sorter' },
            })
        );
        await userEvent.click(ageHeader);
        expect(getNames()).toEqual(['c', 'b', 'a']);
        await userEvent.click(ageHeader);
        expect(getNames()).toEqual(['b', 'a', 'c']);
        expect(onChange).toHaveBeenCalledTimes(3);
    });

    it('受控的 sortOrder 只通过属性变化', async () => {
        const onChange = vi.fn<TableChange>();
        const renderTable = (sortOrder) => (
            <Table
                columns={[
                    { title: 'Name', dataIndex: 'name' },
                    { title: 'Age', dataIndex: 'age', sorter: (a, b) => a.age - b.age, sortOrder },
                ]}
                dataSource={smallData()}
                pagination={false}
                onChange={onChange}
            />
        );
        const { rerender } = render(renderTable(false));
        await userEvent.click(screen.getByText('Age').closest('th'));
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ sorter: expect.objectContaining({ sortOrder: 'ascend' }) }));
        expect(getNames()).toEqual(['b', 'a', 'c']);
        rerender(renderTable('descend'));
        expect(getNames()).toEqual(['c', 'b', 'a']);
        expect(getSortStates()).toEqual([null, 'descending']);
    });

    it('只应用第一个激活的排序器，点击另一列会重置其他列', async () => {
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                sorter: (a, b) => (a.name > b.name ? 1 : -1),
                defaultSortOrder: 'descend',
            },
            { title: 'Age', dataIndex: 'age', sorter: (a, b) => a.age - b.age, defaultSortOrder: 'ascend' },
        ];
        render(<Table columns={columns} dataSource={smallData()} pagination={false} />);
        expect(getNames()).toEqual(['c', 'b', 'a']);
        await userEvent.click(screen.getByText('Age').closest('th'));
        expect(getSortStates()).toEqual([null, 'descending']);
        expect(getNames()).toEqual(['c', 'b', 'a']);
    });

    it('受控的 filteredValue 报告筛选选择，并通过属性进行筛选', async () => {
        const onChange = vi.fn<TableChange>();
        const renderTable = (filteredValue) => (
            <Table
                columns={[
                    {
                        title: 'Name',
                        dataIndex: 'name',
                        filters: [
                            { text: 'Starts with a', value: 'a' },
                            { text: 'Starts with b', value: 'b' },
                        ],
                        onFilter: (value, record) => record.name.startsWith(value),
                        filteredValue,
                    },
                    { title: 'Age', dataIndex: 'age' },
                ]}
                dataSource={smallData()}
                pagination={false}
                onChange={onChange}
            />
        );
        const { rerender } = render(renderTable([]));
        await openFilter();
        await userEvent.click(screen.getByText('Starts with a'));
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                filters: [expect.objectContaining({ dataIndex: 'name', filteredValue: ['a'] })],
                extra: { changeType: 'filter' },
            })
        );
        expect(getNames()).toEqual(['b', 'a', 'c']);
        rerender(renderTable(['a']));
        expect(getNames()).toEqual(['a']);
    });

    it('renderFilterDropdown 确认选值，filterDropdown 替换筛选图标', async () => {
        const columns = [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: (value, record) => record.name === value,
                renderFilterDropdown: ({ confirm }) => (
                    <button type="button" onClick={() => confirm({ filteredValue: ['a'], closeDropdown: true })}>
                        only a
                    </button>
                ),
            },
            {
                title: 'Age',
                dataIndex: 'age',
                onFilter: () => true,
                filterDropdown: <span data-testid="custom-filter">f</span>,
            },
        ];
        render(<Table columns={columns} dataSource={smallData()} pagination={false} />);
        expect(screen.getByTestId('custom-filter').closest('th')).toBeInTheDocument();
        await openFilter();
        await userEvent.click(screen.getByText('only a'));
        expect(getNames()).toEqual(['a']);
    });

    it('受控 filterDropdownVisible 时，确定和关闭请求使用方关闭面板', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const columns = [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: (value, record) => record.name === value,
                filterDropdownVisible: true,
                onFilterDropdownVisibleChange: onVisibleChange,
                renderFilterDropdown: ({ confirm, close }) => (
                    <>
                        <button type="button" onClick={() => confirm({ filteredValue: ['a'], closeDropdown: true })}>
                            only a
                        </button>
                        <button type="button" onClick={() => close()}>
                            close it
                        </button>
                    </>
                ),
            },
        ];
        render(<Table columns={columns} dataSource={smallData()} pagination={false} />);
        await userEvent.click(await screen.findByText('only a'));
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
        onVisibleChange.mockClear();
        await userEvent.click(screen.getByText('close it'));
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('自定义筛选面板打开时，onFilterDropdownVisibleChange(true) 里已能拿到并聚焦面板内的元素，close() 后收到 false', async () => {
        const seen: (HTMLInputElement | null)[] = [];
        const inputRef = createRef<HTMLInputElement>();
        const onVisibleChange = vi.fn<(visible: boolean) => void>((visible) => {
            if (visible) {
                seen.push(inputRef.current);
                inputRef.current?.focus();
            }
        });
        const columns = [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: (value, record) => record.name === value,
                onFilterDropdownVisibleChange: onVisibleChange,
                renderFilterDropdown: ({ close }) => (
                    <>
                        <input ref={inputRef} aria-label="keyword" />
                        <button type="button" onClick={() => close()}>
                            close it
                        </button>
                    </>
                ),
            },
        ];
        render(<Table columns={columns} dataSource={smallData()} pagination={false} />);
        await userEvent.click(document.querySelector(`.${P}-table-thead .${P}-table-column-filter`));
        await waitFor(() => expect(seen).toHaveLength(1));
        const input = screen.getByRole('textbox', { name: 'keyword' });
        expect(seen[0]).toBe(input);
        expect(input).toHaveFocus();
        await userEvent.click(screen.getByText('close it'));
        await waitFor(() => expect(onVisibleChange).toHaveBeenLastCalledWith(false));
        expect(onVisibleChange).toHaveBeenCalledTimes(2);
    });

    it('自定义筛选面板打开后，filterDropdownProps.afterOpen 与 onFilterDropdownVisibleChange(true) 各调用一次', async () => {
        const afterOpen = vi.fn<() => void>();
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const columns = [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: (value, record) => record.name === value,
                onFilterDropdownVisibleChange: onVisibleChange,
                filterDropdownProps: { afterOpen },
                renderFilterDropdown: () => <input aria-label="keyword" />,
            },
        ];
        render(<Table columns={columns} dataSource={smallData()} pagination={false} />);
        await userEvent.click(document.querySelector(`.${P}-table-thead .${P}-table-column-filter`));
        await waitFor(() => expect(onVisibleChange.mock.calls).toEqual([[true]]));
        expect(afterOpen).toHaveBeenCalledTimes(1);
    });

    const clickFilterOptionA = async (filterConfirmMode: 'immediate' | 'confirm') => {
        const columns = [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: (value, record) => record.name === value,
                filterConfirmMode,
                filters: [
                    { text: 'a', value: 'a' },
                    { text: 'b', value: 'b' },
                ],
            },
        ];
        render(<Table columns={columns} dataSource={smallData()} pagination={false} />);
        await openFilter();
        await userEvent.click(await screen.findByText('a', { selector: `.${P}-dropdown-item *, .${P}-dropdown-item` }));
    };

    it('filterConfirmMode=immediate：点击筛选项立即筛选', async () => {
        await clickFilterOptionA('immediate');
        expect(getNames()).toEqual(['a']);
    });

    it('filterConfirmMode=confirm：点击筛选项只暂存，点确定后才筛选', async () => {
        await clickFilterOptionA('confirm');
        expect(getNames()).toEqual(['b', 'a', 'c']);
        expect(screen.getByRole('button', { name: zh_CN.Table.resetFilter })).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Table.confirmFilter }));
        expect(getNames()).toEqual(['a']);
    });

    it('filterConfirmMode=confirm：菜单打开完成前勾选的项不被重置', async () => {
        const onFilterDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        const columns = [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: (value, record) => record.name === value,
                onFilterDropdownVisibleChange,
                filterConfirmMode: 'confirm' as const,
                filters: [
                    { text: 'a', value: 'a' },
                    { text: 'b', value: 'b' },
                ],
            },
        ];
        render(<Table columns={columns} dataSource={smallData()} pagination={false} />);
        fireEvent.click(document.querySelector(`.${P}-table-thead .${P}-table-column-filter`));
        fireEvent.click(screen.getByText('a', { selector: `.${P}-dropdown-item *, .${P}-dropdown-item` }));
        await waitFor(() => expect(onFilterDropdownVisibleChange).toHaveBeenCalledWith(true));
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        expect(getNames()).toEqual(['a']);
    });

    it('filterConfirmMode=confirm：未确定就关闭时丢弃暂存值，受控 filteredValue 在关闭期间变化后打开显示新值', async () => {
        const renderTable = (filteredValue: string[]) => (
            <Table
                columns={[
                    {
                        title: 'Name',
                        dataIndex: 'name',
                        onFilter: (value, record) => record.name === value,
                        filterConfirmMode: 'confirm' as const,
                        filteredValue,
                        filters: [
                            { text: 'a', value: 'a' },
                            { text: 'b', value: 'b' },
                        ],
                    },
                ]}
                dataSource={smallData()}
                pagination={false}
            />
        );
        const { rerender } = render(renderTable([]));
        const isChecked = (text: string) =>
            screen
                .getByText(text, { selector: `.${P}-dropdown-item *` })
                .closest('li')
                .querySelector('input').checked;
        await openFilter();
        await userEvent.click(screen.getByText('a', { selector: `.${P}-dropdown-item *` }));
        expect(isChecked('a')).toBe(true);
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(document.querySelector(`.${P}-dropdown-wrapper-show`)).not.toBeInTheDocument());
        await openFilter();
        expect(isChecked('a')).toBe(false);
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(document.querySelector(`.${P}-dropdown-wrapper-show`)).not.toBeInTheDocument());
        rerender(renderTable(['b']));
        await openFilter();
        expect(isChecked('a')).toBe(false);
        expect(isChecked('b')).toBe(true);
    });

    it('嵌套筛选项的子菜单 key 不重复，且开合不当作根菜单的开合', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const columns = [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: () => true,
                filterConfirmMode: 'confirm' as const,
                onFilterDropdownVisibleChange: onVisibleChange,
                filters: [
                    { text: 'G1', value: 'g1', children: [{ text: 'a', value: 'a' }] },
                    { text: 'G2', value: 'g2', children: [{ text: 'b', value: 'b' }] },
                    { text: 'top', value: 'top' },
                ],
            },
        ];
        render(<Table columns={columns} dataSource={smallData()} pagination={false} />);
        await openFilter();
        await userEvent.click(await screen.findByText('top'));
        onVisibleChange.mockClear();
        await userEvent.hover(screen.getByText('G1'));
        await screen.findByText('a');
        await userEvent.hover(screen.getByText('G2'));
        await screen.findByText('b');
        await userEvent.hover(screen.getByText('top'));

        expect(onVisibleChange).not.toHaveBeenCalled();
        expect(screen.getByText('top').closest('li').querySelector('input')).toBeChecked();
        expect(error.mock.calls.flat().join('\n')).not.toContain('same key');
        error.mockRestore();
    });

    it('非受控分页在 onChange 中报告页码', async () => {
        const onChange = vi.fn<TableChange>();
        render(<Table columns={getColumns()} dataSource={getData(46)} onChange={onChange} />);
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
        const onChange = vi.fn<TableChange>();
        const onPageChange = vi.fn<(currentPage: number) => void>();
        render(<Table columns={getColumns()} dataSource={getData(15)} pagination={{ currentPage: 1, pageSize: 10, total: 30, onChange: onPageChange }} onChange={onChange} />);
        expect(getBodyRows()).toHaveLength(15);
        await userEvent.click(getPageItems()[2]);
        expect(onPageChange).toHaveBeenCalledWith(2, 10);
        expect(onChange).not.toHaveBeenCalled();
        expect(getActivePage()).toHaveTextContent(/^1$/);
    });

    it('pagination 为 false 时显示所有行，formatPageText 格式化信息', () => {
        const { rerender } = render(<Table columns={getColumns()} dataSource={getData(46)} pagination={false} />);
        expect(getBodyRows()).toHaveLength(46);
        expect(document.querySelector(`.${P}-table-pagination-outer`)).not.toBeInTheDocument();
        rerender(
            <Table
                columns={getColumns()}
                dataSource={getData(46)}
                pagination={{
                    formatPageText: ({ currentStart, currentEnd, total }) => `${currentStart}-${currentEnd}/${total}`,
                }}
            />
        );
        expect(document.querySelector(`.${P}-table-pagination-info`)).toHaveTextContent('1-10/46');
    });

    it('受控选择报告行，全选时跳过禁用行，并固定选择列', async () => {
        const onChange = vi.fn<SelectionChange>();
        const onSelect = vi.fn<SelectChange>();
        const onSelectAll = vi.fn<SelectAllChange>();
        const data = getData(3);
        const renderTable = (selectedRowKeys) => (
            <Table
                columns={getColumns()}
                dataSource={data}
                pagination={false}
                rowSelection={{
                    selectedRowKeys,
                    onChange,
                    onSelect,
                    onSelectAll,
                    fixed: true,
                    getCheckboxProps: (record) => ({ disabled: record.key === '2' }),
                }}
            />
        );
        const { rerender } = render(renderTable([]));
        const rowCheckboxes = () => queryAll(`.${P}-table-tbody .${P}-checkbox`);
        await userEvent.click(rowCheckboxes()[0]);
        expect(onChange).toHaveBeenLastCalledWith(['0'], [data[0]]);
        expect(onSelect).toHaveBeenLastCalledWith(data[0], true, [data[0]], expect.anything());
        expect(getBodyRows()[0]).not.toHaveClass(`${P}-table-row-selected`);
        rerender(renderTable(['0']));
        expect(getBodyRows()[0]).toHaveClass(`${P}-table-row-selected`);
        await userEvent.click(getHeaderSelectionCheckbox());
        expect(onSelectAll).toHaveBeenLastCalledWith(true, [data[0], data[1]], [data[1]], expect.anything());
        expect(onChange).toHaveBeenLastCalledWith(['0', '1'], [data[0], data[1]]);
        expect(document.querySelector(`.${P}-table-thead .${P}-table-column-selection`)).toHaveClass(`${P}-table-cell-fixed-left`);
    });

    it('受控的 expandedRowKeys 报告展开状态，并通过属性渲染', async () => {
        const onExpand = vi.fn<NonNullable<TableProps['onExpand']>>();
        const onExpandedRowsChange = vi.fn<NonNullable<TableProps['onExpandedRowsChange']>>();
        const data = getData(3);
        const renderTable = (expandedRowKeys) => <Table columns={getColumns()} dataSource={data} expandedRowKeys={expandedRowKeys} pagination={false} expandedRowRender={(record) => <p>detail {record.name}</p>} onExpand={onExpand} onExpandedRowsChange={onExpandedRowsChange} />;
        const { rerender } = render(renderTable([]));
        await userEvent.click(document.querySelector(`.${P}-table-tbody .${P}-table-expand-icon`));
        expect(onExpand).toHaveBeenLastCalledWith(true, data[0], expect.anything());
        expect(onExpandedRowsChange).toHaveBeenLastCalledWith([data[0]]);
        expect(screen.queryByText('detail Edward King 0')).not.toBeInTheDocument();
        rerender(renderTable(['0']));
        expect(screen.getByText('detail Edward King 0')).toBeInTheDocument();
    });

    it('按 childrenRecordName 展开树形数据，并使用 indentSize', async () => {
        const data = [{ key: '1', name: 'parent', kids: [{ key: '1-1', name: 'child' }] }];
        render(<Table childrenRecordName="kids" columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={data} indentSize={30} pagination={false} />);
        expect(screen.queryByText('child')).not.toBeInTheDocument();
        await userEvent.click(document.querySelector(`.${P}-table-tbody .${P}-table-expand-icon`));
        const childCell = screen.getByText('child').closest('td');
        expect(childCell.querySelector(`.${P}-table-row-indent`)).toHaveStyle({ paddingInlineStart: '60px' });
    });

    it('固定列和固定表头获得 sticky 偏移，表体滚动同步到表头', () => {
        const { container } = render(<Table columns={getColumns()} dataSource={getData(3)} pagination={false} scroll={{ x: 1200, y: 300 }} />);
        const root = container.querySelector(`.${P}-table-wrapper`);
        expect(root).toHaveAttribute('data-column-fixed', 'true');
        expect(container.querySelector(`.${P}-table-header`)).toBeInTheDocument();
        expect(container.querySelector(`.${P}-table-body`)).toHaveStyle({ maxHeight: '300px' });
        const heads = queryAll(`.${P}-table-thead .${P}-table-row-head`);
        expect(heads[0]).toHaveStyle({ position: 'sticky', left: '0px' });
        expect(heads[heads.length - 1]).toHaveStyle({ position: 'sticky', right: '0px' });
        const body = container.querySelector(`.${P}-table-body`);
        Object.defineProperty(body, 'scrollLeft', { value: 1200, configurable: true });
        fireEvent.scroll(body);
        expect(container.querySelector(`.${P}-table-header`).scrollLeft).toBe(1200);
    });

    it('virtualized 只渲染一段行窗口，并暴露 list ref', async () => {
        const getVirtualizedListRef = vi.fn<GetVirtualizedListRef>();
        render(<Table columns={[{ title: 'Name', dataIndex: 'name', width: 200 }]} dataSource={getData(1000)} getVirtualizedListRef={getVirtualizedListRef} pagination={false} scroll={{ y: 300 }} virtualized />);
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        expect(getBodyRows().length).toBeLessThan(1000);
        expect(typeof getVirtualizedListRef.mock.lastCall[0].current.scrollToItem).toBe('function');
    });

    it('sticky 表头使用顶部偏移', () => {
        render(<Table columns={getColumns()} dataSource={getData(3)} pagination={false} sticky={{ top: 20 }} />);
        const header = document.querySelector(`.${P}-table-header`);
        expect(header).toHaveClass(`${P}-table-header-sticky`);
        expect(header).toHaveStyle({ top: '20px' });
    });

    it('渲染空状态插槽和加载 spin', () => {
        render(<Table columns={getColumns()} dataSource={[]} empty={<span>nothing here</span>} loading />);
        expect(screen.getByText('nothing here')).toBeInTheDocument();
        expect(document.querySelector(`.${P}-spin`)).not.toHaveClass(`${P}-spin-hidden`);
        expect(document.querySelector(`.${P}-spin-wrapper`)).toBeInTheDocument();
    });

    it('id、className、style 和 data-* 落在根元素上', () => {
        render(<Table id="t1" className="mine" style={{ color: 'red' }} data-testid="table-root" columns={getColumns()} dataSource={getData(3)} />);
        const root = screen.getByTestId('table-root');
        expect(root).toHaveClass(`${P}-table-wrapper`, 'mine');
        expect(root).toHaveAttribute('id', 't1');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('从 semiGlobal.config.overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Table: { size: 'small', bordered: true } };
        render(<Table columns={getColumns()} dataSource={getData(3)} />);
        expect(document.querySelector(`.${P}-table-small`)).toHaveClass(`${P}-table-bordered`);
    });

    it('StrictMode 下每次点击只排序和选择一次', async () => {
        const onChange = vi.fn<TableChange>();
        const onSelectionChange = vi.fn<SelectionChange>();
        render(
            <StrictMode>
                <Table
                    columns={[
                        { title: 'Name', dataIndex: 'name' },
                        { title: 'Age', dataIndex: 'age', sorter: (a, b) => a.age - b.age },
                    ]}
                    dataSource={smallData()}
                    pagination={false}
                    rowSelection={{ onChange: onSelectionChange }}
                    onChange={onChange}
                />
            </StrictMode>
        );
        await userEvent.click(screen.getByText('Age').closest('th'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getBodyRows().map((row) => row.querySelectorAll(`.${P}-table-row-cell`)[1].textContent)).toEqual(['a', 'b', 'c']);
        await userEvent.click(queryAll(`.${P}-table-tbody .${P}-checkbox`)[0]);
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        expect(getBodyRows()[0]).toHaveClass(`${P}-table-row-selected`);
    });

    it('重新渲染后调用最新的 onChange', async () => {
        const first = vi.fn<TableChange>();
        const second = vi.fn<TableChange>();
        const columns = [{ title: 'Age', dataIndex: 'age', sorter: (a, b) => a.age - b.age }];
        const { rerender } = render(<Table columns={columns} dataSource={smallData()} pagination={false} onChange={first} />);
        rerender(<Table columns={columns} dataSource={smallData()} pagination={false} onChange={second} />);
        await userEvent.click(screen.getByText('Age').closest('th'));
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });

    it('通过 components 渲染自定义 body 行', () => {
        const Row = (props) => <tr data-custom-row="" {...props} />;
        render(<Table columns={getColumns()} components={{ body: { row: Row } }} dataSource={getData(3)} pagination={false} />);
        expect(getBodyRows()).toHaveLength(3);
        getBodyRows().forEach((row) => expect(row).toHaveAttribute('data-custom-row'));
    });

    it('rtl 下交换固定列的侧边类名', () => {
        render(<Table columns={getColumns()} dataSource={getData(3)} direction="rtl" pagination={false} />);
        expect(document.querySelector(`.${P}-table-wrapper`)).toHaveAttribute('dir', 'rtl');
        expect(queryAll(`.${P}-table-thead .${P}-table-row-head`)[0]).toHaveClass(`${P}-table-cell-fixed-right`);
    });

    it('把当前页数据传给 title 和 footer，showHeader 为 false 时隐藏表头', () => {
        const title = vi.fn<(pageData: unknown[]) => string>(() => 'T');
        const footer = vi.fn<(pageData: unknown[]) => string>(() => 'F');
        render(<Table title={title} columns={getColumns()} dataSource={getData(46)} footer={footer} showHeader={false} />);
        expect(title.mock.lastCall[0]).toHaveLength(10);
        expect(footer.mock.lastCall[0]).toHaveLength(10);
        // a fixed column keeps an inert header for its widths
        expect(document.querySelector(`.${P}-table-thead:not([inert])`)).not.toBeInTheDocument();
    });

    it('rowSpanHover 高亮悬停的 rowSpan 单元格覆盖的所有行', () => {
        const columns = [
            {
                title: 'Name',
                dataIndex: 'name',
                render: (text, _record, index) => ({
                    children: text,
                    props: { rowSpan: index === 0 ? 2 : index === 1 ? 0 : 1 },
                }),
            },
            { title: 'Age', dataIndex: 'age' },
        ];
        render(<Table columns={columns} dataSource={smallData()} pagination={false} rowSpanHover />);
        const rows = getBodyRows();
        fireEvent.mouseEnter(rows[1]);
        expect(rows[0]).toHaveClass(`${P}-table-row-hovered`);
        expect(rows[1]).toHaveClass(`${P}-table-row-hovered`);
        expect(rows[2]).not.toHaveClass(`${P}-table-row-hovered`);
    });

    it('headerStyle 应用于表头单元格，列的 onHeaderCell style 优先级更高', () => {
        const columns = [
            { title: 'Name', dataIndex: 'name', onHeaderCell: () => ({ style: { color: 'blue' } }) },
            { title: 'Age', dataIndex: 'age' },
        ];
        render(<Table headerStyle={{ color: 'red', fontWeight: 700 }} columns={columns} dataSource={smallData()} pagination={false} />);
        const heads = queryAll(`.${P}-table-thead .${P}-table-row-head`);
        expect(heads[0]).toHaveStyle({ color: 'rgb(0, 0, 255)', fontWeight: '700' });
        expect(heads[1]).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });
});

describe('Table 函数组件', () => {
    const P = BASE_CLASS_PREFIX;

    it('使用新的 rowSelection 对象重新渲染后，全选跳过禁用的树形子节点', async () => {
        const onChange = vi.fn<SelectionChange>();
        const data = [
            { key: '1', name: 'parent', children: [{ key: '1-1', name: 'child' }] },
            { key: '2', name: 'other' },
        ];
        const columns = [{ title: 'Name', dataIndex: 'name' }];
        const getCheckboxProps = (record) => ({ disabled: record.key === '1-1' });
        const renderTable = () => <Table columns={columns} dataSource={data} defaultExpandAllRows pagination={false} rowSelection={{ onChange, getCheckboxProps }} />;
        const { rerender } = render(renderTable());
        rerender(renderTable());
        await userEvent.click(getHeaderSelectionCheckbox());
        expect(onChange).toHaveBeenLastCalledWith(['1', '2'], [data[0], data[1]]);
    });

    it('通过 ref 以 TableHandle 形式暴露 getCurrentPageData', () => {
        const ref = createRef<TableHandle>();
        render(<Table ref={ref} columns={getColumns()} dataSource={getData(15)} />);
        const pageData = ref.current.getCurrentPageData();
        expect(Object.keys(ref.current)).toEqual(['getCurrentPageData']);
        expect(pageData.dataSource).toHaveLength(10);
        expect(pageData.dataSource[0].key).toBe('0');
    });

    it('可调整列宽的表格在其加载完成前渲染普通表格', async () => {
        render(<Table columns={[{ title: 'Name', dataIndex: 'name', width: 200 }]} dataSource={getData(2)} resizable />);
        expect(screen.getByText('Name').closest('th')).toBeInTheDocument();
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-table-resize-handle`)).toBeInTheDocument());
        expect(getBodyRows()).toHaveLength(2);
    });

    it('列表挂载后才设置 scroll.y 时，观察虚拟化 body', async () => {
        const disconnect = vi.fn<() => void>();
        vi.stubGlobal(
            'ResizeObserver',
            class {
                callback: (entries: unknown[]) => void;
                constructor(callback) {
                    this.callback = callback;
                }
                observe() {
                    this.callback([]);
                }
                unobserve() {}
                disconnect() {
                    disconnect();
                }
            }
        );
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            const columns = [{ title: 'Name', dataIndex: 'name', width: 200 }];
            const data = getData(100);
            const renderTable = (scroll) => <Table columns={columns} dataSource={data} pagination={false} scroll={scroll} sticky virtualized />;
            const { rerender, unmount } = render(renderTable(undefined));
            await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
            rerender(renderTable({ y: 300 }));
            // the test setup gives the list offsetWidth 100 and clientWidth 0, i.e. a scrollbar
            await waitFor(() => expect(document.querySelector(`.${P}-table-header`)).toHaveStyle({ overflowY: 'scroll' }));
            unmount();
            expect(disconnect).toHaveBeenCalled();
        } finally {
            warn.mockRestore();
            vi.unstubAllGlobals();
        }
    });

    it('resizable 属性不设置在根元素上', () => {
        render(<Table data-testid="root" columns={getColumns()} dataSource={getData(2)} resizable={false} />);
        expect(screen.getByTestId('root')).not.toHaveAttribute('resizable');
    });

    it('展开行时仅重新渲染显示展开状态的单元格', async () => {
        const render0 = vi.fn<(text: ReactNode) => ReactNode>((text) => text);
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name' },
            { title: 'Age', dataIndex: 'age', render: render0 },
        ];
        render(<Table columns={columns} dataSource={getData(5)} pagination={false} expandedRowRender={(record) => <p>detail {record.name}</p>} />);
        render0.mockClear();
        // fireEvent: a userEvent click also hovers the row, and the hovered state reaches every cell of it
        fireEvent.click(document.querySelector(`.${P}-table-tbody .${P}-table-expand-icon`));
        expect(screen.getByText('detail Edward King 0')).toBeInTheDocument();
        expect(render0).not.toHaveBeenCalled();
    });
});

// Body picks row props by these whitelists; a missing key silently drops a prop, so lock the exact lists.
describe('Table Body 行属性白名单', () => {
    it('BaseRow 仅转发这些属性', () => {
        expect(baseRowPropKeys).toEqual([
            'cellWidths',
            'className',
            'columns',
            'components',
            'disabled',
            'expandIcon',
            'expandableRow',
            'expanded',
            'displayNone',
            'expandedRow',
            'hideExpandedColumn',
            'hovered',
            'indentSize',
            'index',
            'isSection',
            'level',
            'onHover',
            'onRow',
            'onRowClick',
            'onRowContextMenu',
            'onRowDoubleClick',
            'onRowMouseEnter',
            'onRowMouseLeave',
            'prefixCls',
            'record',
            'renderExpandIcon',
            'replaceClassName',
            'rowExpandable',
            'rowKey',
            'selected',
            'style',
            'virtualized',
        ]);
    });

    it('SectionRow 仅转发这些属性', () => {
        expect(sectionRowPropKeys).toEqual(['record', 'index', 'columns', 'group', 'groupKey', 'data', 'renderGroupSection', 'onGroupedRow', 'clickGroupedRowToExpand', 'components', 'expanded', 'prefixCls', 'onExpand', 'virtualized', 'style', 'renderExpandIcon', 'className', 'rowKey']);
    });
});

describe('Table 分组时的 onExpandedRowsChange', () => {
    it('展开记录行时，保留所有已展开分组在 rows 中', async () => {
        const groupData = [
            { key: '1', name: 'a.fig', size: '2M' },
            { key: '2', name: 'b.fig', size: '2M' },
            { key: '3', name: 'c.fig', size: '34KB' },
        ];
        const onExpandedRowsChange = vi.fn<NonNullable<TableProps['onExpandedRowsChange']>>();
        render(
            <Table
                columns={[
                    { title: '标题', dataIndex: 'name' },
                    { title: '大小', dataIndex: 'size' },
                ]}
                dataSource={groupData}
                defaultExpandAllGroupRows
                groupBy="size"
                pagination={false}
                expandedRowRender={(record) => <div>detail of {record.name}</div>}
                renderGroupSection={(groupKey) => <strong>group {groupKey}</strong>}
                onExpandedRowsChange={onExpandedRowsChange}
            />
        );
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row:not(.${BASE_CLASS_PREFIX}-table-row-section) .${BASE_CLASS_PREFIX}-table-expand-icon`));
        expect(onExpandedRowsChange).toHaveBeenCalledTimes(1);
        expect(onExpandedRowsChange.mock.calls[0][0]).toEqual([groupData[0], { groupKey: '2M' }, { groupKey: '34KB' }]);
    });

    it('不把已展开的记录 key 报告为分组', async () => {
        const groupData = [
            { key: '1', name: 'a.fig', size: '2M' },
            { key: '2', name: 'b.fig', size: '34KB' },
        ];
        const onExpandedRowsChange = vi.fn<NonNullable<TableProps['onExpandedRowsChange']>>();
        render(
            <Table
                clickGroupedRowToExpand
                columns={[{ title: '标题', dataIndex: 'name' }]}
                dataSource={groupData}
                defaultExpandAllGroupRows
                groupBy="size"
                pagination={false}
                expandedRowRender={(record) => <div>detail of {record.name}</div>}
                renderGroupSection={(groupKey) => <strong>group {groupKey}</strong>}
                onExpandedRowsChange={onExpandedRowsChange}
            />
        );
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-table-tbody .${BASE_CLASS_PREFIX}-table-row:not(.${BASE_CLASS_PREFIX}-table-row-section) .${BASE_CLASS_PREFIX}-table-expand-icon`));
        await userEvent.click(screen.getByText('group 34KB'));
        expect(onExpandedRowsChange).toHaveBeenCalledTimes(2);
        expect(onExpandedRowsChange.mock.calls[1][0]).toEqual([groupData[0], { groupKey: '2M' }]);
    });
});

describe('Table 筛选触发器', () => {
    const filterColumns = [
        {
            title: 'Name',
            dataIndex: 'name',
            filters: [{ text: 'Alpha', value: 'a' }],
            onFilter: () => true,
        },
    ];

    it('是原生 button，键盘可以聚焦并打开', async () => {
        render(<Table columns={filterColumns} dataSource={[{ key: '1', name: 'a' }]} pagination={false} />);
        const trigger = screen.getByRole('button', { name: zh_CN.Table.filterColumn });
        expect(trigger.tagName).toBe('BUTTON');
        expect(trigger).toHaveAttribute('type', 'button');
        expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await userEvent.tab();
        expect(trigger).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
        expect(screen.getByText('Alpha')).toBeInTheDocument();
    });
    it('筛选生效时可访问名称表达生效状态，清空后恢复', async () => {
        render(<Table columns={filterColumns} dataSource={[{ key: '1', name: 'a' }]} pagination={false} />);
        const trigger = screen.getByRole('button', { name: zh_CN.Table.filterColumn });
        expect(trigger).toHaveAttribute('aria-label', zh_CN.Table.filterColumn);
        await userEvent.click(trigger);
        await userEvent.click(await screen.findByText('Alpha'));
        await waitFor(() => expect(trigger).toHaveAttribute('aria-label', zh_CN.Table.filterColumnActive));
        await userEvent.click(screen.getByText('Alpha'));
        await waitFor(() => expect(trigger).toHaveAttribute('aria-label', zh_CN.Table.filterColumn));
    });
    it('自定义 rowKey 时展开行的 data-row-key 来自该行的真实 key', () => {
        const dataSource = [{ id: 'a1', name: 'Alpha' }];
        const columns = [{ title: 'Name', dataIndex: 'name' }];
        const { container } = render(<Table columns={columns} dataSource={dataSource} defaultExpandAllRows rowKey="id" expandedRowRender={(record) => <span>detail-{record.name}</span>} />);
        const expandedRow = container.querySelector('.semi-table-row-expand');
        expect(expandedRow).toHaveAttribute('data-row-key', 'a1-expanded-row');
    });
});

describe('Table checkRelation 与数字 rowKey 的关联', () => {
    const treeData = [
        {
            id: 1,
            name: 'parent',
            children: [
                { id: 2, name: 'child a' },
                { id: 3, name: 'child b' },
            ],
        },
    ];
    const columns = [{ title: 'Name', dataIndex: 'name' }];

    it('所有子节点选中后选中父节点，并报告数字 key', async () => {
        const onChange = vi.fn<SelectionChange>();
        render(<Table columns={columns} dataSource={treeData} defaultExpandAllRows pagination={false} rowKey="id" rowSelection={{ checkRelation: 'related', onChange }} />);
        const checkboxes = screen.getAllByRole('checkbox');
        await userEvent.click(checkboxes[2]);
        await userEvent.click(checkboxes[3]);

        const [keys] = onChange.mock.calls.at(-1);
        expect(keys.toSorted((a, b) => Number(a) - Number(b))).toEqual([1, 2, 3]);
        expect(keys.every((key) => typeof key === 'number')).toBe(true);
        expect(screen.getAllByRole('checkbox')[1]).toBeChecked();
    });
});

describe('Table checkRelation related 的半选随选中的 key 推导', () => {
    const treeData = [
        {
            id: 1,
            name: 'parent',
            children: [
                { id: 2, name: 'child a' },
                { id: 3, name: 'child b' },
            ],
        },
    ];
    const columns = [{ title: 'Name', dataIndex: 'name' }];
    const renderTable = (rowSelection: RowSelectionConfig) => <Table columns={columns} dataSource={treeData} defaultExpandAllRows pagination={false} rowKey="id" rowSelection={{ checkRelation: 'related', ...rowSelection }} />;
    const checkboxes = () => screen.getAllByRole('checkbox');

    it('受控 selectedRowKeys 含子行时父行半选，清空后父行不再半选', () => {
        const { rerender } = render(renderTable({ selectedRowKeys: [2] }));
        expect(checkboxes()[1]).toBePartiallyChecked();
        rerender(renderTable({ selectedRowKeys: [] }));
        expect(checkboxes()[1]).not.toBePartiallyChecked();
    });

    it('defaultSelectedRowKeys 含子行时父行半选', () => {
        render(renderTable({ defaultSelectedRowKeys: [2] }));
        expect(checkboxes()[1]).toBePartiallyChecked();
    });

    it('defaultSelectedRowKeys 含父行时子行一并选中', () => {
        render(renderTable({ defaultSelectedRowKeys: [1] }));
        expect(checkboxes()[2]).toBeChecked();
        expect(checkboxes()[3]).toBeChecked();
    });

    it('受控 selectedRowKeys 里被禁用的行挂载后保持选中，勾选其他行时 onChange 保留它', async () => {
        const onChange = vi.fn<SelectionChange>();
        const rows = [
            { key: 1, name: 'Ann' },
            { key: 2, name: 'Bob' },
            { key: 3, name: 'Cid' },
        ];
        render(<Table columns={columns} dataSource={rows} pagination={false} rowSelection={{ selectedRowKeys: [1, 2], getCheckboxProps: (record) => ({ disabled: record.key === 1 }), onChange }} />);
        expect(checkboxes()[1]).toBeChecked();
        await userEvent.click(checkboxes()[3]);
        expect(onChange.mock.calls.at(-1)[0]).toEqual([1, 2, 3]);
    });

    it('非受控 defaultSelectedRowKeys 里被禁用的行挂载后保持选中，勾选其他行时 onChange 保留它', async () => {
        const onChange = vi.fn<SelectionChange>();
        const rows = [
            { key: 1, name: 'Ann' },
            { key: 2, name: 'Bob' },
            { key: 3, name: 'Cid' },
        ];
        render(<Table columns={columns} dataSource={rows} pagination={false} rowSelection={{ defaultSelectedRowKeys: [1, 2], getCheckboxProps: (record) => ({ disabled: record.key === 1 }), onChange }} />);
        expect(checkboxes()[1]).toBeChecked();
        await userEvent.click(checkboxes()[3]);
        expect(onChange.mock.calls.at(-1)[0]).toEqual([1, 2, 3]);
    });

    it('checkRelation 由 unRelated 改为 related 后，选中子行使父行半选', async () => {
        const { rerender } = render(renderTable({ checkRelation: 'unRelated' }));
        rerender(renderTable({}));
        await userEvent.click(checkboxes()[2]);
        expect(checkboxes()[1]).toBePartiallyChecked();
    });
});

describe('Table 排序器 Tab 停靠点', () => {
    const dataSource = [
        { key: '1', name: 'b' },
        { key: '2', name: 'a' },
        { key: '3', name: 'c' },
    ];
    const names = () => getBodyRows().map((row) => row.querySelector('td').textContent);
    const sorterColumn = { title: 'Name', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) };

    it('showSortTip：排序器是表头单元格唯一的停靠点，Enter 和 Space 排序，焦点时显示提示', async () => {
        const { container } = render(<Table columns={[{ ...sorterColumn, showSortTip: true }]} dataSource={dataSource} pagination={false} />);
        await userEvent.tab();
        const sorter = screen.getByRole('button', { name: 'Name' });
        const header = screen.getByRole('columnheader', { name: 'Name' });
        expect(sorter).toHaveFocus();
        expect(container.querySelector('th')).toHaveAttribute('tabindex', '-1');
        expect(header).not.toHaveAttribute('aria-sort');
        expect(await screen.findByRole('tooltip')).toHaveTextContent(zh_CN.Table.ascend);
        await userEvent.keyboard('{Enter}');
        expect(names()).toEqual(['a', 'b', 'c']);
        expect(header).toHaveAttribute('aria-sort', 'ascending');
        await userEvent.keyboard(' ');
        expect(names()).toEqual(['c', 'b', 'a']);
        expect(header).toHaveAttribute('aria-sort', 'descending');
        await userEvent.keyboard('{Enter}');
        expect(header).not.toHaveAttribute('aria-sort');
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('没有 showSortTip 的排序器可以到达，并可用键盘排序', async () => {
        render(<Table columns={[sorterColumn]} dataSource={dataSource} pagination={false} />);
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'Name' })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(names()).toEqual(['a', 'b', 'c']);
        expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort', 'ascending');
    });

    it('未开 useFullRender 的函数 title 带 sorter 时，排序按钮以它命名并可用键盘排序', async () => {
        render(<Table columns={[{ ...sorterColumn, title: () => <span>Name</span> }]} dataSource={dataSource} pagination={false} />);
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'Name' })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(names()).toEqual(['a', 'b', 'c']);
        expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort', 'ascending');
    });

    it('未开 useFullRender 的函数 title 带 sorter 与 filters 时，排序按钮和筛选入口都出现', async () => {
        const columns = [{ ...sorterColumn, title: () => <span>Name</span>, filters: [{ text: 'A', value: 'a' }], onFilter: () => true }];
        render(<Table columns={columns} dataSource={dataSource} pagination={false} />);
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'Name' })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(names()).toEqual(['a', 'b', 'c']);
        await userEvent.tab();
        expect(screen.getByRole('button', { name: zh_CN.Table.filterColumn })).toHaveFocus();
    });

    it('带筛选时，排序提示属于排序器，图标不是额外的停靠点', async () => {
        const columns = [{ ...sorterColumn, showSortTip: true, filters: [{ text: 'A', value: 'a' }], onFilter: () => true }];
        render(<Table columns={columns} dataSource={dataSource} pagination={false} />);
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'Name' })).toHaveFocus();
        expect(await screen.findByRole('tooltip')).toHaveTextContent(zh_CN.Table.ascend);
        await userEvent.keyboard('{Enter}');
        expect(names()).toEqual(['a', 'b', 'c']);
        await userEvent.tab();
        expect(screen.getByRole('button', { name: zh_CN.Table.filterColumn })).toHaveFocus();
    });
});

describe('Table 语义', () => {
    const treeData = [
        { key: '1', name: 'parent', children: [{ key: '1-1', name: 'child' }] },
        { key: '2', name: 'single' },
    ];
    const treeColumns = [{ title: 'Name', dataIndex: 'name' }];

    it('是行和单元格组成的 table，从不是 grid', () => {
        render(<Table columns={treeColumns} dataSource={treeData} pagination={false} />);
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
        expect(screen.getAllByRole('cell').length).toBeGreaterThan(0);
        for (const role of ['grid', 'treegrid', 'gridcell']) {
            expect(screen.queryAllByRole(role)).toHaveLength(0);
        }
        expect(document.querySelector('[aria-level]')).toBeNull();
        expect(document.querySelector('[aria-rowindex]')).toBeNull();
    });

    it('展开按钮是 Tab 停靠点，并报告所在行是否展开', async () => {
        render(<Table columns={treeColumns} dataSource={treeData} pagination={false} />);
        await userEvent.tab();
        const expand = screen.getByRole('button', { name: zh_CN.Table.expandRow });
        expect(expand).toHaveFocus();
        expect(expand).toHaveAttribute('aria-expanded', 'false');
        await userEvent.keyboard('{Enter}');
        expect(expand).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('cell', { name: 'child' })).toBeInTheDocument();
    });

    it('虚拟化表格计入表头行和所有 body 行', async () => {
        render(<Table columns={[{ title: 'Name', dataIndex: 'name', width: 200 }]} dataSource={getData(1000)} pagination={false} scroll={{ y: 300 }} virtualized />);
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        const table = screen.getByRole('table');
        expect(table).toHaveAttribute('aria-rowcount', '1001');
        expect(within(table).getAllByRole('rowgroup')).toHaveLength(2);
        expect(getBodyRows()[0]).toHaveAttribute('aria-rowindex', '2');
        expect(document.querySelectorAll('[aria-rowcount]')).toHaveLength(1);
    });

    it('渲染为单个 table 元素时，保留 table role', () => {
        const { container } = render(<Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={getData(3)} pagination={false} />);
        expect(screen.getByRole('table').tagName).toBe('TABLE');
        expect(container.querySelector('[role="none"]')).toBeNull();
        expect(container.querySelector('[aria-colspan], [aria-rowspan]')).toBeNull();
    });

    it.each([
        ['scroll.y', { scroll: { y: 200 } }],
        ['sticky', { sticky: true }],
        ['virtualized', { scroll: { y: 200 }, virtualized: true }],
    ])('%s 时，分开的表头和 body 表格构成一个 ARIA table', async (_name, extra) => {
        const { container } = render(
            <Table
                columns={[
                    { title: 'Name', dataIndex: 'name', width: 200 },
                    { title: 'Age', dataIndex: 'age', width: 100 },
                ]}
                dataSource={getData(20)}
                pagination={false}
                {...extra}
            />
        );
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        const table = screen.getByRole('table');
        expect(table).toHaveClass(`${BASE_CLASS_PREFIX}-table-container`);
        for (const element of container.querySelectorAll('table')) {
            expect(element).toHaveAttribute('role', 'none');
        }
        const [head, body] = within(table).getAllByRole('rowgroup');
        expect(
            within(head)
                .getAllByRole('columnheader')
                .map((th) => th.textContent)
        ).toEqual(['Name', 'Age']);
        expect(within(body).getAllByRole('row').length).toBeGreaterThan(0);
        expect(within(body).getAllByRole('cell').length).toBeGreaterThan(0);
    });

    it('固定表头的合并单元格带有 aria-colspan 和 aria-rowspan', () => {
        render(
            <Table
                columns={[
                    { title: 'Name', dataIndex: 'name', width: 200 },
                    {
                        title: 'Detail',
                        children: [
                            { title: 'Age', dataIndex: 'age', width: 100 },
                            { title: 'Address', dataIndex: 'address', width: 200 },
                        ],
                    },
                ]}
                dataSource={getData(3)}
                pagination={false}
                scroll={{ y: 200 }}
            />
        );
        const name = screen.getByRole('columnheader', { name: 'Name' });
        const detail = screen.getByRole('columnheader', { name: 'Detail' });
        expect(name).toHaveAttribute('aria-rowspan', '2');
        expect(name).not.toHaveAttribute('aria-colspan');
        expect(detail).toHaveAttribute('aria-colspan', '2');
        expect(detail).not.toHaveAttribute('aria-rowspan');
        expect(screen.getByRole('columnheader', { name: 'Age' })).not.toHaveAttribute('aria-rowspan');
    });

    it('展开列表头有名称', () => {
        render(<Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={getData(2)} hideExpandedColumn={false} pagination={false} expandedRowRender={(record) => record.name} />);
        expect(screen.getByRole('columnheader', { name: zh_CN.Table.expandColumn })).toBeInTheDocument();
    });

    it.each([
        ['scroll.y', { scroll: { y: 200 } }],
        ['virtualized', { scroll: { y: 200 }, virtualized: true }],
    ])('使用 %s 滚动的 body 是一个 Tab 停靠点', async (_name, extra) => {
        render(<Table columns={[{ title: 'Name', dataIndex: 'name', width: 200 }]} dataSource={getData(100)} pagination={false} {...extra} />);
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        await userEvent.tab();
        expect(document.activeElement).toHaveClass(`${BASE_CLASS_PREFIX}-table-body`);
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('不滚动的 body 不是 Tab 停靠点', async () => {
        render(<Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={getData(3)} pagination={false} />);
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });
});

describe('Table 记录 key 与虚拟化宽度', () => {
    it('本地筛选的记录没有 key 时报错', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const renderTable = (dataSource: { name: string }[]) => <Table columns={[{ title: 'Name', dataIndex: 'name', onFilter: () => true }]} dataSource={dataSource} pagination={false} />;
        const { rerender } = render(renderTable([{ name: 'a' }]));
        rerender(renderTable([{ name: 'a' }, { name: 'b' }]));
        expect(error.mock.calls.flat().join('\n')).toContain('You must specify a key');
        error.mockRestore();
    });

    it('虚拟化时字符串 style.width 不被 scroll.x 覆盖', () => {
        const { container } = render(<Table style={{ width: '100%' }} columns={[{ title: 'Name', dataIndex: 'name', width: 100 }]} dataSource={getData(3)} pagination={false} scroll={{ y: 200 }} virtualized />);
        expect(container.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-table-wrapper`).style.width).toBe('100%');
    });
});

describe('Table 滚动条宽度测量', () => {
    it('有固定列的分组行与展开行，重新渲染不再测量滚动条', () => {
        const append = vi.spyOn(document.body, 'appendChild');
        const measures = () => append.mock.calls.filter(([node]) => (node as HTMLElement).className?.includes?.('scrollbar-measure')).length;
        const files = [
            { key: '1', name: 'a', size: '2M' },
            { key: '2', name: 'b', size: '34KB' },
        ];
        const renderTable = () => (
            <Table
                columns={[
                    { title: 'Name', dataIndex: 'name', fixed: 'left', width: 100 },
                    { title: 'Size', dataIndex: 'size', width: 100 },
                ]}
                dataSource={files.map((file) => ({ ...file }))}
                defaultExpandAllRows
                groupBy="size"
                pagination={false}
                scroll={{ x: 1000 }}
                expandedRowRender={() => 'detail'}
            />
        );
        const { rerender } = render(renderTable());
        const afterMount = measures();
        rerender(renderTable());
        rerender(renderTable());
        expect(document.querySelectorAll('.semi-table-section-inner, .semi-table-expand-inner')).not.toHaveLength(0);
        expect(measures()).toBe(afterMount);
        append.mockRestore();
    });

    it('滚动条宽度为 0（overlay 滚动条）时只测量一次', async () => {
        // the measured size is cached per module
        vi.resetModules();
        const { measureScrollbar } = await import('@fibrae/semi-foundation/table/utils');
        vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(0);
        vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(0);
        const append = vi.spyOn(document.body, 'appendChild');
        expect([measureScrollbar(), measureScrollbar(), measureScrollbar('horizontal')]).toEqual([0, 0, 0]);
        measureScrollbar('horizontal');
        expect(append).toHaveBeenCalledTimes(2);
        vi.restoreAllMocks();
    });
});

describe('Table 排序后的重算', () => {
    const files = [
        { key: '1', name: 'b.fig', size: '2M' },
        { key: '2', name: 'a.fig', size: '2M' },
        { key: '3', name: 'c.doc', size: '34KB' },
    ];
    const sorter = vi.fn<(a: (typeof files)[number], b: (typeof files)[number]) => number>((a, b) => a.name.localeCompare(b.name));
    const columns = [
        { title: '标题', dataIndex: 'name', sorter },
        { title: '大小', dataIndex: 'size' },
    ];

    it('点击排序不会让已收起的分组重新展开', async () => {
        render(<Table clickGroupedRowToExpand columns={columns} dataSource={files} defaultExpandAllRows groupBy="size" pagination={false} renderGroupSection={(groupKey) => <strong>group {groupKey}</strong>} />);
        expect(screen.getByText('a.fig')).toBeInTheDocument();
        await userEvent.click(screen.getByText('group 2M'));
        expect(screen.queryByText('a.fig')).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: '标题' }));
        expect(screen.queryByText('a.fig')).not.toBeInTheDocument();
        expect(screen.getByText('c.doc')).toBeInTheDocument();
    });

    it('内联 getCheckboxProps 的父组件重新渲染不触发重新排序', async () => {
        const { rerender } = render(<Table columns={columns} dataSource={files} pagination={false} rowSelection={{ getCheckboxProps: () => ({}) }} />);
        await userEvent.click(screen.getByRole('button', { name: '标题' }));
        sorter.mockClear();
        rerender(<Table columns={columns} dataSource={files} pagination={false} rowSelection={{ getCheckboxProps: () => ({}) }} />);
        expect(sorter).not.toHaveBeenCalled();
    });
});

describe('Table 无 dataIndex 的筛选列', () => {
    it('带 filters 但没有 dataIndex 的列照常渲染，并给出警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        render(<Table columns={[{ title: 'Name', filters: [{ text: 'A', value: 'a' }], onFilter: () => true }]} dataSource={[{ key: '1' }]} pagination={false} />);
        expect(screen.getByRole('columnheader', { name: /Name/ })).toBeInTheDocument();
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-table-column-filter`));
        expect(await screen.findByText('A')).toBeInTheDocument();
        expect(warn.mock.calls.flat().join('\n')).toContain('dataIndex');
        warn.mockRestore();
    });
});

describe('Table rowSelection 更新', () => {
    const rows = [
        { key: '1', name: 'Ann' },
        { key: '2', name: 'Bob' },
    ];
    const columns = [{ title: 'Name', dataIndex: 'name' }];
    const renderTable = (rowSelection: TableProps['rowSelection']) => <Table columns={columns} dataSource={rows} pagination={false} rowSelection={rowSelection} />;

    it('rowSelection 去掉 clickRow 后，点击行不再选中', async () => {
        const onChange = vi.fn<SelectionChange>();
        const { rerender } = render(renderTable({ clickRow: true, onChange }));
        await userEvent.click(screen.getByText('Ann'));
        expect(onChange).toHaveBeenCalledTimes(1);

        rerender(renderTable({ onChange }));
        await userEvent.click(screen.getByText('Bob'));
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('rowSelection 变为 undefined 后，点击行不再触发旧回调', async () => {
        const onChange = vi.fn<SelectionChange>();
        const { rerender } = render(renderTable({ clickRow: true, onChange }));
        rerender(renderTable(undefined));
        await userEvent.click(screen.getByText('Ann'));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('rowSelection 去掉 disabled 后，表头全选框恢复可用，非受控的已选行保留', async () => {
        const { rerender } = render(renderTable({ disabled: true }));
        expect(screen.getAllByRole('checkbox')[0]).toBeDisabled();
        rerender(renderTable({}));
        expect(screen.getAllByRole('checkbox')[0]).toBeEnabled();
        await userEvent.click(screen.getAllByRole('checkbox')[1]);
        rerender(renderTable({ checkRelation: 'unRelated' }));
        expect(screen.getAllByRole('checkbox')[1]).toBeChecked();
    });
});

describe('Table 列与展开图标', () => {
    it('resizable 时 rowSelection.onHeaderCell 仍作用于选择列表头，且保留拖动手柄', async () => {
        render(<Table columns={[{ title: 'Name', dataIndex: 'name', width: 200 }]} dataSource={[{ key: '1', name: 'Ann' }]} pagination={false} resizable rowSelection={{ onHeaderCell: () => ({ className: 'selection-head' }) }} />);
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-table-resize-handle`)).not.toBeNull());
        const th = document.querySelector(`th.${BASE_CLASS_PREFIX}-table-column-selection`);
        expect(th).toHaveClass('selection-head');
        expect(th.querySelector(`.${BASE_CLASS_PREFIX}-table-resize-handle`)).not.toBeNull();
    });

    it('JSX 分组列只有一个子 Column 时，子列照常渲染', () => {
        render(
            <Table dataSource={[{ key: '1', name: 'Ann' }]} pagination={false}>
                <Column title="Group">
                    <Column title="Name" dataIndex="name" />
                </Column>
            </Table>
        );
        expect(document.querySelectorAll('thead tr')).toHaveLength(2);
        expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
        expect(screen.getByRole('cell', { name: 'Ann' })).toBeInTheDocument();
    });

    it('expandIcon 返回文本或 null 时不抛错，并显示该内容', async () => {
        const rows = [{ key: '1', name: 'Ann' }];
        const renderTable = (expandIcon: TableProps['expandIcon']) => <Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={rows} expandIcon={expandIcon} pagination={false} expandedRowRender={() => 'detail'} />;
        const { rerender } = render(renderTable((expanded) => (expanded ? '-' : '+')));
        const button = screen.getByRole('button', { name: zh_CN.Table.expandRow });
        expect(button).toHaveTextContent('+');
        await userEvent.click(button);
        expect(button).toHaveTextContent('-');

        rerender(renderTable(() => null));
        expect(screen.getByRole('button', { name: zh_CN.Table.expandRow })).toBeEmptyDOMElement();

        rerender(renderTable('>'));
        expect(screen.getByRole('button', { name: zh_CN.Table.expandRow })).toHaveTextContent('>');
    });

    it('选择列固定在右侧时，树形缩进与展开按钮只落在第一个数据列', () => {
        const dataSource = [{ key: '1', name: 'parent', children: [{ key: '1-1', name: 'child' }] }];
        render(<Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={dataSource} defaultExpandAllRows pagination={false} rowSelection={{ fixed: 'right' }} />);
        const selectionCells = queryAll(`.${BASE_CLASS_PREFIX}-table-tbody td.${BASE_CLASS_PREFIX}-table-column-selection`);
        expect(selectionCells).toHaveLength(2);
        for (const cell of selectionCells) {
            expect(cell.querySelector(`.${BASE_CLASS_PREFIX}-table-expand-icon, .${BASE_CLASS_PREFIX}-table-row-indent`)).toBeNull();
        }
        expect(screen.getByRole('cell', { name: /parent/ }).querySelector(`.${BASE_CLASS_PREFIX}-table-expand-icon`)).not.toBeNull();
    });
});

describe('Table 虚拟化行高', () => {
    it('展开行后重新计算各行的偏移', async () => {
        const rows = getData(10);
        render(<Table columns={[{ title: 'Name', dataIndex: 'name', width: 200 }]} dataSource={rows} pagination={false} scroll={{ y: 400 }} virtualized={{ itemSize: (_index, { expandedRow }) => (expandedRow ? 100 : 40) }} expandedRowRender={() => 'detail'} />);
        const topOf = (key: string) => document.querySelector<HTMLElement>(`[data-row-key="${key}"]`)?.style.top;
        await waitFor(() => expect(topOf('2')).toBe('80px'));
        await userEvent.click(screen.getAllByRole('button', { name: zh_CN.Table.expandRow })[1]);
        await waitFor(() => expect(topOf('1-expanded-row')).toBe('80px'));
        expect(topOf('2')).toBe('180px');
    });

    it('行数不变而各下标的行类型变化时重新计算各行的偏移', () => {
        const renderTable = (dataSource: { key: string; name: string }[]) => (
            <Table columns={[{ title: 'Name', dataIndex: 'name', width: 200 }]} dataSource={dataSource} expandedRowKeys={['a']} pagination={false} scroll={{ y: 400 }} virtualized={{ itemSize: (_index, { expandedRow }) => (expandedRow ? 100 : 40) }} expandedRowRender={() => 'detail'} />
        );
        const a = { key: 'a', name: 'a' };
        const b = { key: 'b', name: 'b' };
        const c = { key: 'c', name: 'c' };
        const topOf = (key: string) => document.querySelector<HTMLElement>(`[data-row-key="${key}"]`)?.style.top;
        const { rerender } = render(renderTable([a, b, c]));
        expect(topOf('c')).toBe('180px');

        rerender(renderTable([b, c, a]));
        expect(topOf('c')).toBe('40px');
        expect(topOf('a-expanded-row')).toBe('120px');
    });

    it('itemSize 函数返回 null 时按默认行高排布，且不告警', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        // null breaks the declared number return type: it stands for a user function that returns nothing
        const itemSize = (() => null) as unknown as () => number;
        render(<Table columns={[{ title: 'Name', dataIndex: 'name', width: 200 }]} dataSource={getData(10)} pagination={false} scroll={{ y: 400 }} virtualized={{ itemSize }} />);
        const topOf = (key: string) => document.querySelector<HTMLElement>(`[data-row-key="${key}"]`)?.style.top;
        await waitFor(() => expect(topOf('2')).toBe(`${numbers.DEFAULT_VIRTUALIZED_ROW_HEIGHT * 2}px`));
        expect(warn.mock.calls.filter((call) => String(call[0]).includes('itemSize'))).toHaveLength(0);
    });

    it('rowExpandable 为假的行没有展开行，展开行以 expanded 为 true 渲染', async () => {
        const expandedRowRender = vi.fn<NonNullable<TableProps['expandedRowRender']>>(() => 'detail');
        render(<Table columns={[{ title: 'Name', dataIndex: 'name', width: 200 }]} dataSource={getData(3)} defaultExpandAllRows pagination={false} rowExpandable={(record) => record.key !== '1'} scroll={{ y: 300 }} virtualized expandedRowRender={expandedRowRender} />);
        await waitFor(() => expect(document.querySelector('[data-row-key="0-expanded-row"]')).toBeInTheDocument());
        expect(document.querySelector('[data-row-key="1-expanded-row"]')).toBeNull();
        expect(expandedRowRender.mock.calls.every(([record, , expanded]) => record.key !== '1' && expanded === true)).toBe(true);
    });
});

describe('Table 全选范围与 changedRows', () => {
    const rows = [
        { key: '1', name: 'a' },
        { key: '2', name: 'a' },
        { key: '3', name: 'b' },
    ];
    const columns = [{ title: 'Name', dataIndex: 'name', filteredValue: ['a'], onFilter: (value, record) => record.name === value }];
    const keysOf = (list: { key: string }[]) => list.map((row) => row.key);

    const selectAll = async (checkRelation: 'related' | 'unRelated', selectedRowKeys: string[]) => {
        const onSelectAll = vi.fn<SelectAllChange>();
        render(<Table columns={columns} dataSource={rows} pagination={false} rowSelection={{ checkRelation, selectedRowKeys, onSelectAll }} />);
        await userEvent.click(getHeaderSelectionCheckbox());
        const [selected, selectedRows, changedRows] = onSelectAll.mock.calls.at(-1);
        return {
            selected,
            selectedKeys: keysOf(selectedRows as { key: string }[]).sort(),
            changedKeys: keysOf(changedRows as { key: string }[]).sort(),
        };
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

describe('Table 表头', () => {
    it('普通列的函数 title 收到参数对象，解构参数不抛错', () => {
        const title = (({ sorter }: ColumnTitleProps) => `Name${sorter ? ' sortable' : ''}`) as ColumnProps['title'];
        render(<Table columns={[{ title, dataIndex: 'name' }]} dataSource={getData(1)} pagination={false} />);
        expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    });

    it('onHeaderRow 与 onHeaderCell 返回的对象不被改写，重渲染后类名不增长', () => {
        const rowProps = { className: 'my-row' };
        const cellProps = { className: 'my-cell' };
        const renderTable = (dataSource: Record<string, any>[]) => (
            <Table
                columns={[
                    {
                        title: 'Name',
                        dataIndex: 'name',
                        align: 'center',
                        className: 'col',
                        onHeaderCell: () => cellProps,
                    },
                ]}
                dataSource={dataSource}
                pagination={false}
                onHeaderRow={() => rowProps}
            />
        );
        const { rerender } = render(renderTable(getData(1)));
        rerender(renderTable(getData(2)));
        rerender(renderTable(getData(3)));
        expect(rowProps).toEqual({ className: 'my-row' });
        expect(cellProps).toEqual({ className: 'my-cell' });
        const headerRow = document.querySelector(`.${BASE_CLASS_PREFIX}-table-thead tr`);
        expect([...headerRow.classList]).toEqual(['my-row', `${BASE_CLASS_PREFIX}-table-row`]);
        const th = screen.getByRole('columnheader', { name: 'Name' });
        expect([...th.classList].filter((name) => name === 'col')).toHaveLength(1);
    });
});

describe('Table 开发提示', () => {
    it('排序列缺少 dataIndex 只警告一次', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const renderTable = (dataSource: Record<string, any>[]) => <Table columns={[{ title: 'Name', sorter: (a, b) => a.name.localeCompare(b.name) }]} dataSource={dataSource} pagination={false} />;
        const { rerender } = render(renderTable(getData(1)));
        rerender(renderTable(getData(2)));
        const dataIndexWarnings = warn.mock.calls.filter((args) => args.join(' ').includes('dataIndex'));
        expect(dataIndexWarnings).toHaveLength(1);
        warn.mockRestore();
    });

    it('resizable 时 JSX 写法的列照常渲染，并警告一次不支持调整列宽', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const renderTable = (dataSource: Record<string, any>[]) => (
            <Table dataSource={dataSource} pagination={false} resizable>
                <Column title="Name" dataIndex="name" width={200} />
            </Table>
        );
        const { rerender } = render(renderTable(getData(1)));
        await waitFor(() => expect(warn.mock.calls.flat().join('\n')).toContain('resizable only works with the columns prop'));
        rerender(renderTable(getData(2)));
        expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-table-resize-handle`)).toBeNull();
        const resizableWarnings = warn.mock.calls.filter((args) => args.join(' ').includes('resizable'));
        expect(resizableWarnings).toHaveLength(1);
        warn.mockRestore();
    });
});

describe('Table 筛选与列宽', () => {
    it('没有 dataIndex 的列筛选后，onChange 的 filters 不混入其他列', async () => {
        const onChange = vi.fn<TableChange>();
        render(
            <Table
                columns={[
                    { title: 'Action', key: 'action', render: () => 'more' },
                    { title: 'Name', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
                    { title: 'Tag', key: 'tag', filters: [{ text: 'A', value: 'a' }] },
                ]}
                dataSource={getData(3)}
                pagination={false}
                onChange={onChange}
            />
        );
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-table-column-filter`));
        await userEvent.click(await screen.findByText('A'));
        await userEvent.click(screen.getByRole('button', { name: 'Name' }));
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ filters: [], extra: { changeType: 'sorter' } }));
        warn.mockRestore();
    });

    it('一次批处理内连续拖动列宽，onResizeStop 收到最终宽度', async () => {
        const onResizeStop = vi.fn<ResizeFn<{ key: number; date: string }>>();
        const { container } = render(
            <Table
                columns={[
                    { title: 'Date', dataIndex: 'date', width: 200 },
                    { title: 'Note', dataIndex: 'note' },
                ]}
                dataSource={[{ key: 0, date: '2018-02-11' }]}
                resizable={{ onResizeStop }}
            />
        );
        const handle = await waitFor(() => {
            const found = container.querySelector(`.${BASE_CLASS_PREFIX}-table-resize-handle`);
            expect(found).not.toBeNull();
            return found;
        });
        // moves of a fast drag can arrive before React renders the previous one
        act(() => {
            fireEvent.pointerDown(handle, { button: 0, clientX: 0, pointerId: 1 });
            fireEvent.pointerMove(handle, { clientX: 30, pointerId: 1 });
            fireEvent.pointerMove(handle, { clientX: 60, pointerId: 1 });
            fireEvent.lostPointerCapture(handle, { clientX: 60, pointerId: 1 });
        });
        expect(onResizeStop).toHaveBeenCalledTimes(1);
        expect(onResizeStop.mock.calls[0][0]).toMatchObject({ width: 260 });
        expect(onResizeStop.mock.calls[0][0].className ?? '').not.toContain('resizing');
    });
});

describe('Table 分组', () => {
    it('分组按数据中首次出现的顺序渲染，分组行的 records 为该组的原始记录', () => {
        const onGroupedRow = vi.fn<(record: Record<string, any>, index: number) => object>(() => ({}));
        const dataSource = [
            { key: '1', city: 'B', name: 'b1' },
            { key: '2', city: 'A', name: 'a1' },
            { key: '3', city: 'B', name: 'b2' },
        ];
        render(<Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={dataSource} defaultExpandAllGroupRows groupBy="city" pagination={false} renderGroupSection={(groupKey) => <strong>group {groupKey}</strong>} onGroupedRow={onGroupedRow} />);
        const rowTexts = queryAll(`.${BASE_CLASS_PREFIX}-table-tbody tr`).map((row) => row.textContent);
        expect(rowTexts).toEqual(['group B', 'b1', 'b2', 'group A', 'a1']);
        const sections = onGroupedRow.mock.calls.map(([record]) => record);
        expect(sections.at(-2)).toEqual({ groupKey: 'B', records: [dataSource[0], dataSource[2]] });
        expect(sections.at(-1)).toEqual({ groupKey: 'A', records: [dataSource[1]] });
        expect(sections.at(-2).records[0]).toBe(dataSource[0]);
        expect(onGroupedRow.mock.calls.at(-2)).toHaveLength(2);
        expect(onGroupedRow.mock.calls.at(-2)[1]).toBe(0);
        expect(onGroupedRow.mock.calls.at(-1)[1]).toBe(1);
    });

    it('rowSelection.clickRow 点击分组行与展开行不选中它们', async () => {
        const onChange = vi.fn<SelectionChange>();
        render(<Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={[{ key: '1', name: 'Ann', size: '2M' }]} defaultExpandAllRows groupBy="size" pagination={false} rowSelection={{ clickRow: true, onChange }} expandedRowRender={() => 'detail'} renderGroupSection={(groupKey) => `group ${groupKey}`} />);
        await userEvent.click(screen.getByText('group 2M'));
        await userEvent.click(screen.getByText('detail'));
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(screen.getByText('Ann'));
        expect(onChange).toHaveBeenLastCalledWith(['1'], [expect.objectContaining({ key: '1' })]);
    });
});

describe('Table 非元素内容与可访问名称', () => {
    const nameColumns = [{ title: 'Name', dataIndex: 'name' }];
    const rows = [
        { key: '1', name: 'a', size: 1 },
        { key: '2', name: 'b', size: 1 },
    ];

    it('expandedRowRender 返回字符串或数字时作为展开内容显示', () => {
        render(<Table columns={nameColumns} dataSource={rows} defaultExpandAllRows pagination={false} expandedRowRender={(record) => (record.key === '1' ? 'detail text' : 42)} />);
        expect(screen.getByText('detail text')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renderGroupSection 返回字符串时作为分组行内容显示', () => {
        render(<Table columns={nameColumns} dataSource={rows} defaultExpandAllGroupRows groupBy="size" pagination={false} renderGroupSection={(groupKey) => `group ${groupKey}`} />);
        expect(screen.getByText('group 1')).toBeInTheDocument();
    });

    it('虚拟化时展开行带 aria-rowindex，等于前一数据行加 1', async () => {
        render(<Table columns={[{ title: 'Name', dataIndex: 'name', width: 200 }]} dataSource={getData(3)} defaultExpandAllRows pagination={false} scroll={{ y: 300 }} virtualized expandedRowRender={() => 'detail'} />);
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(1));
        const expanded = document.querySelector('[data-row-key$="-expanded-row"]');
        expect(expanded).toHaveAttribute('aria-rowindex', '3');
        expect(expanded.previousElementSibling).toHaveAttribute('aria-rowindex', '2');
    });

    it('虚拟化表体横向滚动不触发 virtualized.onScroll', async () => {
        const onScroll = vi.fn<(args: object) => void>();
        render(<Table columns={[{ title: 'Name', dataIndex: 'name', width: 200 }]} dataSource={getData(100)} pagination={false} scroll={{ x: 800, y: 300 }} virtualized={{ onScroll }} />);
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        const body = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-table-body`);
        body.scrollTop = 50;
        fireEvent.scroll(body);
        expect(onScroll).toHaveBeenLastCalledWith(expect.objectContaining({ scrollOffset: 50 }));
        const calls = onScroll.mock.calls.length;
        body.scrollLeft = 30;
        fireEvent.scroll(body);
        expect(onScroll).toHaveBeenCalledTimes(calls);
    });

    it('aria-label、aria-labelledby、aria-describedby 落在 role=table 的元素上', () => {
        const { rerender } = render(
            <>
                <span id="desc">about</span>
                <Table aria-describedby="desc" aria-label="files" columns={nameColumns} dataSource={rows} />
            </>
        );
        const table = screen.getByRole('table', { name: 'files' });
        expect(table).toHaveAccessibleDescription('about');
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-table-wrapper`)).not.toHaveAttribute('aria-label');

        rerender(<Table aria-label="split" columns={nameColumns} dataSource={rows} scroll={{ y: 200 }} />);
        expect(screen.getByRole('table', { name: 'split' })).toHaveClass(`${BASE_CLASS_PREFIX}-table-container`);

        rerender(
            <>
                <h2 id="heading">Uploads</h2>
                <Table aria-labelledby="heading" columns={nameColumns} dataSource={rows} />
            </>
        );
        expect(screen.getByRole('table', { name: 'Uploads' })).toHaveAttribute('aria-labelledby', 'heading');
    });

    it('有 title 且未给名称时，表格以 title 为名称', () => {
        const { rerender } = render(<Table title="Report" columns={nameColumns} dataSource={rows} />);
        expect(screen.getByRole('table', { name: 'Report' })).toBeInTheDocument();

        rerender(<Table aria-label="own" title="Report" columns={nameColumns} dataSource={rows} />);
        expect(screen.getByRole('table', { name: 'own' })).toBeInTheDocument();
    });

    it('title 与 footer 为数字时也显示', () => {
        render(<Table title={0} columns={nameColumns} dataSource={rows} footer={() => 42} />);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-table-title`)).toHaveTextContent('0');
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-table-footer`)).toHaveTextContent('42');
    });
});

describe('Table 列功能', () => {
    const rows = [
        { key: '1', name: 'a' },
        { key: '2', name: 'b' },
    ];
    const getColWidths = () => queryAll(`.${BASE_CLASS_PREFIX}-table-col`).map((col) => col.style.width);
    const findResizeHandles = () =>
        waitFor(() => {
            const handles = queryAll(`.${BASE_CLASS_PREFIX}-table-resize-handle`);
            expect(handles.length).toBeGreaterThan(0);
            return handles;
        });

    it('选择框的可访问名称不随勾选状态变化', () => {
        const columns = [{ title: 'Name', dataIndex: 'name' }];
        const { rerender } = render(<Table columns={columns} dataSource={rows} pagination={false} rowSelection={{ selectedRowKeys: ['1'] }} />);
        const rowBoxes = screen.getAllByRole('checkbox', { name: zh_CN.Table.selectRow });
        expect(rowBoxes).toHaveLength(2);
        expect(rowBoxes[0]).toBeChecked();

        rerender(<Table columns={columns} dataSource={rows} pagination={false} rowSelection={{ selectedRowKeys: ['1', '2'] }} />);
        expect(screen.getByRole('checkbox', { name: zh_CN.Table.selectAllRows })).toBeChecked();
        expect(screen.getAllByRole('checkbox', { name: zh_CN.Table.selectRow })).toHaveLength(2);
    });

    it('renderPagination 返回字符串时显示该内容，返回 null 时回落默认分页器', () => {
        const columns = [{ title: 'Name', dataIndex: 'name' }];
        const { rerender } = render(<Table columns={columns} dataSource={rows} renderPagination={() => 'custom pager'} />);
        const outer = document.querySelector(`.${BASE_CLASS_PREFIX}-table-pagination-outer`);
        expect(outer).toHaveTextContent(/^custom pager$/);
        expect(outer.querySelector(`.${BASE_CLASS_PREFIX}-page`)).toBeNull();

        rerender(<Table columns={columns} dataSource={rows} renderPagination={() => null} />);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-table-pagination-outer .${BASE_CLASS_PREFIX}-page`)).not.toBeNull();
    });

    it('只有 renderFilterDropdown 或 filterDropdown 的列也渲染筛选器', () => {
        render(
            <Table
                columns={[
                    { title: 'Name', dataIndex: 'name', renderFilterDropdown: () => <div>panel</div> },
                    { title: 'Size', dataIndex: 'size', filterDropdown: <span data-testid="own-filter">f</span> },
                ]}
                dataSource={rows}
                pagination={false}
            />
        );
        expect(screen.getByRole('button', { name: zh_CN.Table.filterColumn }).closest('th')).toHaveTextContent('Name');
        expect(screen.getByTestId('own-filter').closest('th')).toHaveTextContent('Size');
    });

    it('resizable 时未拖动的列跟随 columns 的 width，拖动过的列保留拖动宽度', async () => {
        const getColumnsWith = (noteWidth: number) => [
            { title: 'Date', dataIndex: 'date', width: 200 },
            { title: 'Note', dataIndex: 'note', width: noteWidth },
        ];
        const dataSource = [{ key: 0, date: '2018-02-11', note: 'n' }];
        const { rerender } = render(<Table columns={getColumnsWith(100)} dataSource={dataSource} resizable />);
        const [handle] = await findResizeHandles();
        fireEvent.pointerDown(handle, { button: 0, clientX: 0, pointerId: 1 });
        fireEvent.pointerMove(handle, { clientX: 60, pointerId: 1 });
        fireEvent.lostPointerCapture(handle, { clientX: 60, pointerId: 1 });
        expect(getColWidths()).toEqual(['260px', '100px']);

        rerender(<Table columns={getColumnsWith(300)} dataSource={dataSource} resizable />);
        expect(getColWidths()).toEqual(['260px', '300px']);
    });

    it('resizable 时 onResizeStart 返回的 className 保留，拖动类名在拖动结束后移除', async () => {
        render(<Table columns={[{ title: 'Date', dataIndex: 'date', width: 200 }]} dataSource={[{ key: 0, date: '2018-02-11' }]} resizable={{ onResizeStart: (column) => ({ className: `${column.className} mine` }) }} />);
        const [handle] = await findResizeHandles();
        const header = () => screen.getByRole('columnheader', { name: 'Date' });
        fireEvent.pointerDown(handle, { button: 0, clientX: 0, pointerId: 1 });
        expect(header()).toHaveClass('resizing', 'mine');
        fireEvent.lostPointerCapture(handle, { clientX: 0, pointerId: 1 });
        expect(header()).toHaveClass('mine');
        expect(header()).not.toHaveClass('resizing');
    });

    it('resizable 时列的 onHeaderCell 在表头渲染时调用，返回值不过期', async () => {
        let mark = 'first';
        const columns = [{ title: 'Name', dataIndex: 'name', width: 200, onHeaderCell: () => ({ className: mark }) }];
        const { rerender } = render(<Table columns={columns} dataSource={rows} pagination={false} resizable />);
        await findResizeHandles();
        expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveClass('first');

        mark = 'second';
        rerender(<Table columns={columns} dataSource={[...rows]} pagination={false} resizable />);
        expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveClass('second');
    });
});

describe('Table 配置删掉的键随即失效', () => {
    const files = [
        { key: '1', name: 'b' },
        { key: '2', name: 'a' },
        { key: '3', name: 'c' },
    ];
    const names = () => getBodyRows().map((row) => row.textContent);

    it('排序后 columns 去掉 sorter，行序回到 dataSource 的顺序，表头没有 aria-sort', async () => {
        const { rerender } = render(<Table columns={[{ title: 'Name', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) }]} dataSource={files} pagination={false} />);
        await userEvent.click(screen.getByRole('button', { name: 'Name' }));
        expect(names()).toEqual(['a', 'b', 'c']);

        rerender(<Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={files} pagination={false} />);
        expect(names()).toEqual(['b', 'a', 'c']);
        expect(screen.getByRole('columnheader', { name: 'Name' })).not.toHaveAttribute('aria-sort');
    });

    it('columns 去掉筛选配置后，不再按旧的筛选值过滤', () => {
        const { rerender } = render(<Table columns={[{ title: 'Name', dataIndex: 'name', filters: [{ text: 'a', value: 'a' }], onFilter: (value, record) => record.name === value, defaultFilteredValue: ['a'] }]} dataSource={files} pagination={false} />);
        expect(names()).toEqual(['a']);

        rerender(<Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={files} pagination={false} />);
        expect(names()).toEqual(['b', 'a', 'c']);
    });

    it('pagination 去掉 onChange 后，翻页由表格自己处理', async () => {
        const onChange = vi.fn<(currentPage: number, pageSize: number) => void>();
        const rows = getData(25);
        const { rerender } = render(<Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={rows} pagination={{ pageSize: 10, onChange }} />);
        rerender(<Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={rows} pagination={{ pageSize: 10 }} />);
        await userEvent.click(getPageItems().find((item) => item.textContent === '2'));
        expect(onChange).not.toHaveBeenCalled();
        expect(getFirstCellText()).toBe('Edward King 10');
    });
});

describe('Table 受控值撤销后回到非受控', () => {
    const rows = [
        { key: '1', name: 'Ann' },
        { key: '2', name: 'Bob' },
    ];
    const columns = [{ title: 'Name', dataIndex: 'name' }];

    it('expandedRowKeys 撤销后不再展开', () => {
        const renderTable = (expandedRowKeys?: string[]) => <Table columns={columns} dataSource={rows} expandedRowKeys={expandedRowKeys} pagination={false} expandedRowRender={(record) => `detail ${record.name}`} />;
        const { rerender } = render(renderTable(['1']));
        expect(screen.getByText('detail Ann')).toBeInTheDocument();
        rerender(renderTable());
        expect(screen.queryByText('detail Ann')).not.toBeInTheDocument();
    });

    it('rowSelection.selectedRowKeys 撤销后不再选中', () => {
        const renderTable = (selectedRowKeys?: string[]) => <Table columns={columns} dataSource={rows} pagination={false} rowSelection={{ selectedRowKeys }} />;
        const { rerender } = render(renderTable(['1']));
        expect(screen.getAllByRole('checkbox')[1]).toBeChecked();
        rerender(renderTable());
        expect(screen.getAllByRole('checkbox')[1]).not.toBeChecked();
    });

    it('列的 filterDropdownVisible 撤销后，筛选按钮照常开关菜单', async () => {
        const column = (extra = {}) => ({ title: 'Name', dataIndex: 'name', filters: [{ text: 'only Ann', value: 'Ann' }], onFilter: (value, record) => record.name === value, ...extra });
        const menuShown = () => document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown-wrapper-show`);
        const { rerender } = render(<Table columns={[column({ filterDropdownVisible: true })]} dataSource={rows} pagination={false} />);
        expect(await screen.findByText('only Ann')).toBeInTheDocument();
        rerender(<Table columns={[column()]} dataSource={rows} pagination={false} />);
        await waitFor(() => expect(menuShown()).not.toBeInTheDocument());
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-table-column-filter`));
        await waitFor(() => expect(menuShown()).toBeInTheDocument());
        await userEvent.click(document.body);
        await waitFor(() => expect(menuShown()).not.toBeInTheDocument());
    });
});

describe('Table expandRowByClick 只作用于可展开的行', () => {
    const columns = [{ title: 'Name', dataIndex: 'name' }];

    it('rowExpandable 为假的行点击不展开，不触发 onExpand', async () => {
        const onExpand = vi.fn<NonNullable<TableProps['onExpand']>>();
        const rows = [
            { key: '1', name: 'Ann' },
            { key: '2', name: 'Bob' },
        ];
        render(<Table columns={columns} dataSource={rows} expandRowByClick pagination={false} rowExpandable={(record) => record.key !== '2'} expandedRowRender={(record) => `detail ${record.name}`} onExpand={onExpand} />);
        await userEvent.click(screen.getByText('Bob'));
        expect(onExpand).not.toHaveBeenCalled();
        expect(screen.queryByText('detail Bob')).not.toBeInTheDocument();
        await userEvent.click(screen.getByText('Ann'));
        expect(onExpand).toHaveBeenCalledTimes(1);
    });

    it('树形数据的叶子行点击不触发 onExpand', async () => {
        const onExpand = vi.fn<NonNullable<TableProps['onExpand']>>();
        render(<Table columns={columns} dataSource={[{ key: 'p', name: 'parent', children: [{ key: 'c', name: 'child' }] }]} defaultExpandAllRows expandRowByClick pagination={false} onExpand={onExpand} />);
        await userEvent.click(screen.getByText('child'));
        expect(onExpand).not.toHaveBeenCalled();
    });
});

describe('Table scrollToFirstRowOnChange 与 pagination.onChange', () => {
    it('传了 pagination.onChange 时只复位滚动，翻页交给使用方，不调用 Table 的 onChange', async () => {
        const onPageChange = vi.fn<(currentPage: number, pageSize: number) => void>();
        const onChange = vi.fn<TableChange>();
        const { container } = render(<Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={getData(25)} pagination={{ pageSize: 10, onChange: onPageChange }} scroll={{ y: 200, scrollToFirstRowOnChange: true }} onChange={onChange} />);
        const body = container.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-table-body`);
        body.scrollTop = 50;
        await userEvent.click(getPageItems().find((item) => item.textContent === '2'));
        expect(onPageChange).toHaveBeenCalledWith(2, 10);
        expect(onChange).not.toHaveBeenCalled();
        expect(getFirstCellText()).toBe('Edward King 0');
        expect(body.scrollTop).toBe(0);
    });
});

describe('Table 虚拟化的开发期告警', () => {
    const columns = [{ title: 'Name', dataIndex: 'name', width: 200 }];
    const warnings = (warn: ReturnType<typeof vi.spyOn>, text: string) => warn.mock.calls.filter((call) => String(call[0]).includes(text));

    it('itemSize 过小时只警告一次', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const { rerender } = render(<Table columns={columns} dataSource={getData(50)} pagination={false} scroll={{ y: 300 }} virtualized={{ itemSize: 20 }} />);
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        rerender(<Table columns={columns} dataSource={getData(40)} pagination={false} scroll={{ y: 300 }} virtualized={{ itemSize: 20 }} />);
        expect(warnings(warn, 'itemSize')).toHaveLength(1);
        warn.mockRestore();
    });

    it('没有 scroll.y 时警告一次，没开 sticky 也警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const { rerender } = render(<Table columns={columns} dataSource={getData(5)} pagination={false} virtualized />);
        rerender(<Table columns={columns} dataSource={getData(5)} pagination={false} virtualized />);
        expect(warnings(warn, 'scroll.y')).toHaveLength(1);
        warn.mockRestore();
    });
});

describe('Table showHeader 为 false 且表头拆分', () => {
    const columns = [{ title: 'Name', dataIndex: 'name', width: 200, sorter: (a, b) => a.name.localeCompare(b.name) }];

    it('隐藏的表头 inert，排序按钮不可聚焦，也不暴露给辅助技术', () => {
        render(<Table columns={columns} dataSource={getData(3)} pagination={false} rowSelection={{}} scroll={{ y: 300 }} showHeader={false} />);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-table-header`)).toHaveAttribute('inert');
        // jsdom ignores inert; the browser test checks the Tab order
        expect(screen.getByRole('button', { name: 'Name' }).closest('[inert]')).not.toBeNull();
    });

    it('虚拟化时行数不计表头行', async () => {
        render(<Table columns={columns} dataSource={getData(3)} pagination={false} scroll={{ y: 300 }} showHeader={false} virtualized />);
        await waitFor(() => expect(getBodyRows().length).toBe(3));
        expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '3');
        expect(getBodyRows()[0]).toHaveAttribute('aria-rowindex', '1');
    });
});

describe('Table resizable 时固定在右侧的内置列', () => {
    it('选择列与展开列 fixed 为 right 时排在最后', async () => {
        render(<Table columns={[{ title: 'Name', dataIndex: 'name', width: 200 }]} dataSource={[{ key: '1', name: 'Ann' }]} expandCellFixed="right" hideExpandedColumn={false} pagination={false} resizable rowSelection={{ fixed: 'right' }} expandedRowRender={() => 'detail'} />);
        await waitFor(() => expect(queryAll(`.${BASE_CLASS_PREFIX}-table-resize-handle`).length).toBeGreaterThan(0));
        const headers = screen.getAllByRole('columnheader');
        expect(headers[0]).toHaveTextContent('Name');
        expect(within(headers.at(-1)).getByRole('checkbox')).toBeInTheDocument();
    });
});

describe('Table resizable 与自定义 components', () => {
    it('每次渲染新建的 components 里传 memo 的 body.row，重新渲染时行不重新挂载', async () => {
        const mounts = vi.fn<() => void>();
        const Row = memo((props: React.ComponentProps<'tr'>) => {
            useEffect(() => mounts(), []);
            return <tr {...props} />;
        });
        const renderTable = () => <Table columns={[{ title: 'Name', dataIndex: 'name', width: 200 }]} components={{ body: { row: Row } }} dataSource={[{ key: '1', name: 'Ann' }]} pagination={false} resizable />;
        const { rerender } = render(renderTable());
        // ResizableTable is lazy: until it loads, the rows belong to the plain fallback table
        await waitFor(() => expect(queryAll(`.${BASE_CLASS_PREFIX}-table-resize-handle`).length).toBeGreaterThan(0));
        expect(screen.getByText('Ann')).toBeInTheDocument();
        mounts.mockClear();
        rerender(renderTable());
        expect(mounts).not.toHaveBeenCalled();
    });
});

describe('Table 为 0 的 key', () => {
    const duplicateKeyErrors = (error: ReturnType<typeof vi.spyOn>) => error.mock.calls.flat().filter((message) => String(message).includes('same key'));

    it('分组 key 为 0 时分组行不与其他分组重复 key', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        render(
            <Table
                columns={[{ title: 'Name', dataIndex: 'name' }]}
                dataSource={[
                    { key: 'a', name: 'Ann', n: 1 },
                    { key: 'b', name: 'Bob', n: 0 },
                ]}
                groupBy="n"
                pagination={false}
                renderGroupSection={(groupKey) => `group ${groupKey}`}
            />
        );
        expect(screen.getByText('group 0')).toBeInTheDocument();
        expect(duplicateKeyErrors(error)).toEqual([]);
        error.mockRestore();
    });

    it('列 key 为 0 时表头单元格与 col 不与其他列重复 key', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        render(
            <Table
                columns={[
                    { key: 1, title: 'A', render: () => 'a' },
                    { key: 0, title: 'B', render: () => 'b' },
                ]}
                dataSource={[{ key: '1' }]}
                pagination={false}
            />
        );
        expect(screen.getAllByRole('columnheader')).toHaveLength(2);
        expect(duplicateKeyErrors(error)).toEqual([]);
        error.mockRestore();
    });
});

describe('Table 使用方的 className 与内部类名合并', () => {
    it('列 render 返回的 props.className 与单元格的内部类名并存', () => {
        render(<Table columns={[{ title: 'Name', dataIndex: 'name', render: (text) => ({ children: text, props: { className: 'mine' } }) }]} dataSource={[{ key: '1', name: 'Ann' }]} pagination={false} />);
        expect(screen.getByRole('cell', { name: 'Ann' })).toHaveClass('mine', `${BASE_CLASS_PREFIX}-table-row-cell`);
    });

    it('filterDropdownProps.className 与筛选菜单的内部类名并存', async () => {
        render(<Table columns={[{ title: 'Name', dataIndex: 'name', filters: [{ text: 'only Ann', value: 'Ann' }], onFilter: () => true, filterDropdownProps: { className: 'mine' } }]} dataSource={[{ key: '1', name: 'Ann' }]} pagination={false} />);
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-table-column-filter`));
        await screen.findByText('only Ann');
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-table-column-filter-dropdown`)).toHaveClass('mine');
    });
});

describe('Table 只有选择列固定', () => {
    it('写入表格可视宽度，表格按固定布局', () => {
        const { container } = render(<Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={[{ key: '1', name: 'Ann' }]} pagination={false} rowSelection={{ fixed: true }} />);
        expect(container.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-table-wrapper`).style.getPropertyValue('--semi-table-section-width')).not.toBe('');
        expect(container.querySelector('table')).toHaveClass(`${BASE_CLASS_PREFIX}-table-fixed`);
    });
});

describe('Table 分组的树形数据', () => {
    it('sortChildrenRecord 排序分组内记录的子行', () => {
        const dataSource = [
            {
                key: 'p',
                name: 'parent',
                size: '2M',
                children: [
                    { key: 'b', name: 'child b' },
                    { key: 'a', name: 'child a' },
                ],
            },
        ];
        render(<Table columns={[{ title: 'Name', dataIndex: 'name', sorter: (x, y) => x.name.localeCompare(y.name), sortChildrenRecord: true, defaultSortOrder: 'ascend' }]} dataSource={dataSource} defaultExpandAllRows groupBy="size" pagination={false} renderGroupSection={(groupKey) => `group ${groupKey}`} />);
        expect(getBodyRows().map((row) => row.textContent)).toEqual(['parent', 'child a', 'child b']);
    });
});

describe('Table defaultExpandAllRows 与分组', () => {
    const files = [
        { key: '1', name: 'a.fig', size: '2M' },
        { key: '2', name: 'b.doc', size: '34KB' },
    ];
    const renderTable = (props: Partial<TableProps> = {}) => <Table clickGroupedRowToExpand columns={[{ title: '标题', dataIndex: 'name' }]} dataSource={files} defaultExpandAllRows groupBy="size" pagination={false} renderGroupSection={(groupKey) => <strong>group {groupKey}</strong>} {...props} />;

    it('收起分组后父组件重新渲染出同内容的新 columns，分组保持收起', async () => {
        const { rerender } = render(renderTable());
        await userEvent.click(screen.getByText('group 2M'));
        expect(screen.queryByText('a.fig')).not.toBeInTheDocument();

        rerender(renderTable());
        expect(screen.queryByText('a.fig')).not.toBeInTheDocument();
        expect(screen.getByText('b.doc')).toBeInTheDocument();
    });

    it('收起前面的分组时，后面分组的行不重新挂载', async () => {
        const mounts = vi.fn<(name: string) => void>();
        function Name({ name }: { name: string }) {
            useEffect(() => mounts(name), [name]);
            return <span>{name}</span>;
        }
        render(renderTable({ columns: [{ title: '标题', dataIndex: 'name', render: (text) => <Name name={text} /> }] }));
        mounts.mockClear();
        await userEvent.click(screen.getByText('group 2M'));
        expect(screen.getByText('b.doc')).toBeInTheDocument();
        expect(mounts).not.toHaveBeenCalled();
    });

    it('受控的 expandedRowKeys 不被 defaultExpandAllRows 改写', () => {
        const { rerender } = render(renderTable({ expandedRowKeys: ['34KB'] }));
        rerender(renderTable({ expandedRowKeys: ['34KB'] }));
        expect(screen.queryByText('a.fig')).not.toBeInTheDocument();
        expect(screen.getByText('b.doc')).toBeInTheDocument();
    });

    it('受控的 expandedRowKeys 配 expandAllGroupRows 时，挂载即展开全部分组', () => {
        render(renderTable({ defaultExpandAllRows: false, expandAllGroupRows: true, expandedRowKeys: [] }));
        expect(screen.getByText('a.fig')).toBeInTheDocument();
        expect(screen.getByText('b.doc')).toBeInTheDocument();
    });
});

describe('Table 最后一列', () => {
    it('延伸到末端的单元格带 cell-last，colSpan 盖住末列时落在合并后的单元格上', () => {
        const spanFirstRow = (span: number) => (_record: unknown, index?: number) => (index === 0 ? { colSpan: span } : {});
        const lastColumns: ColumnProps[] = [
            { title: 'A', dataIndex: 'a' },
            { title: 'B', dataIndex: 'b', onCell: spanFirstRow(2) },
            { title: 'C', dataIndex: 'c', onCell: spanFirstRow(0) },
        ];
        const dataSource = [
            { key: '1', a: 'a1', b: 'b1', c: 'c1' },
            { key: '2', a: 'a2', b: 'b2', c: 'c2' },
        ];
        render(<Table columns={lastColumns} dataSource={dataSource} pagination={false} />);
        expect(queryAll(`.${BASE_CLASS_PREFIX}-table-cell-last`).map((cell) => cell.textContent)).toEqual(['C', 'b1', 'c2']);
    });
});
