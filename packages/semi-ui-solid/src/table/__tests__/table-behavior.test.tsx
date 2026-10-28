import { Show, createSignal, onMount } from 'solid-js';
import { fireEvent, render, screen, waitFor, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { getData } from '@test/utils/solid';
import Table from '..';
import semiGlobal from '../../_utils/semi-global';
import type { ColumnProps, ColumnTitleProps, TableElement, TableProps } from '../interface';
import { P, getActivePage, getBodyRows, getColumns, getFirstCellText, getHeaderSelectionCheckbox, getPageItems, query, queryAll } from './table-helpers';

type TableChange = NonNullable<TableProps['onChange']>;
type RowSelectionConfig = Extract<TableProps['rowSelection'], object>;
type SelectionChange = NonNullable<RowSelectionConfig['onChange']>;
type SelectChange = NonNullable<RowSelectionConfig['onSelect']>;
type SelectAllChange = NonNullable<RowSelectionConfig['onSelectAll']>;
type Row = Record<string, any>;

const B = BASE_CLASS_PREFIX;
const menuShown = () => document.querySelector(`.${B}-dropdown-wrapper-show`);
const clickPage = (page: number) => userEvent.click(getPageItems().find((item) => item.textContent === `${page}`) as HTMLElement);

describe('Table 回归用例（续）', () => {
    it('fix #2128：dataSource 为空时，表头复选框不选中', () => {
        render(() => <Table columns={[{ title: '标题', dataIndex: 'name' }]} dataSource={[]} pagination={{ pageSize: 3 }} rowSelection />);
        const headerCheckbox = query(`.${P}-thead .${B}-checkbox`);
        expect(headerCheckbox).toHaveClass(`${B}-checkbox-unChecked`);
        expect(headerCheckbox).not.toHaveClass(`${B}-checkbox-checked`);
    });

    it('fix #2425：expandIcon 为 false 时，children 为空的行不缩进', () => {
        const columns = [
            { title: 'Key', dataIndex: 'dataKey', key: 'dataKey' },
            { title: '名称', dataIndex: 'name', key: 'name', width: 200 },
        ];
        const data = [
            { key: 99, dataKey: 99, name: 'row 99', children: [] },
            { key: 2, dataKey: 'text_info', name: '文本信息', children: [{ key: 21, dataKey: 'title', name: '视频标题' }] },
        ];
        const getIndentClass = (rowKey: number) => query(`.${P}-tbody tr[data-row-key="${rowKey}"]`).querySelector(`.${P}-row-indent`)?.className;
        const [expandIcon, setExpandIcon] = createSignal<TableProps['expandIcon']>(false);
        render(() => <Table columns={columns} dataSource={data} defaultExpandAllRows expandIcon={expandIcon()} />);
        expect(getIndentClass(99)).toBeUndefined();
        expect(getIndentClass(21)).toContain('indent-level-1');
        setExpandIcon(undefined);
        expect(getIndentClass(99)).toContain('indent-level-1');
        expect(getIndentClass(21)).toContain('indent-level-2');
    });
});

describe('Table 行为基线', () => {
    const smallData = () => [
        { key: '1', name: 'b', age: 2 },
        { key: '2', name: 'a', age: 1 },
        { key: '3', name: 'c', age: 3 },
    ];
    const getNames = () => getBodyRows().map((row) => row.querySelector(`.${P}-row-cell`)?.textContent);
    const getSortStates = () => screen.getAllByRole('columnheader').map((th) => th.getAttribute('aria-sort'));
    const ageHeader = () => screen.getByText('Age').closest('th') as HTMLElement;
    const openFilter = async () => {
        await userEvent.click(query(`.${P}-thead .${P}-column-filter`));
        await waitFor(() => expect(menuShown()).toBeInTheDocument());
    };

    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('非受控时点击表头依次排序：ascend、descend，然后取消', async () => {
        const onChange = vi.fn<TableChange>();
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name' },
            { title: 'Age', dataIndex: 'age', sorter: (a, b) => a.age - b.age },
        ];
        render(() => <Table columns={columns} dataSource={smallData()} pagination={false} onChange={onChange} />);
        await userEvent.click(ageHeader());
        expect(getNames()).toEqual(['a', 'b', 'c']);
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ sorter: expect.objectContaining({ dataIndex: 'age', sortOrder: 'ascend' }), extra: { changeType: 'sorter' } }));
        await userEvent.click(ageHeader());
        expect(getNames()).toEqual(['c', 'b', 'a']);
        await userEvent.click(ageHeader());
        expect(getNames()).toEqual(['b', 'a', 'c']);
        expect(onChange).toHaveBeenCalledTimes(3);
    });

    it('受控的 sortOrder 只通过属性变化', async () => {
        const onChange = vi.fn<TableChange>();
        const [sortOrder, setSortOrder] = createSignal<ColumnProps['sortOrder']>(false);
        render(() => (
            <Table
                columns={[
                    { title: 'Name', dataIndex: 'name' },
                    { title: 'Age', dataIndex: 'age', sorter: (a, b) => a.age - b.age, sortOrder: sortOrder() },
                ]}
                dataSource={smallData()}
                pagination={false}
                onChange={onChange}
            />
        ));
        await userEvent.click(ageHeader());
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ sorter: expect.objectContaining({ sortOrder: 'ascend' }) }));
        expect(getNames()).toEqual(['b', 'a', 'c']);
        setSortOrder('descend');
        expect(getNames()).toEqual(['c', 'b', 'a']);
        expect(getSortStates()).toEqual([null, 'descending']);
    });

    it('只应用第一个激活的排序器，点击另一列会重置其他列', async () => {
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name', sorter: (a, b) => (a.name > b.name ? 1 : -1), defaultSortOrder: 'descend' },
            { title: 'Age', dataIndex: 'age', sorter: (a, b) => a.age - b.age, defaultSortOrder: 'ascend' },
        ];
        render(() => <Table columns={columns} dataSource={smallData()} pagination={false} />);
        expect(getNames()).toEqual(['c', 'b', 'a']);
        await userEvent.click(ageHeader());
        expect(getSortStates()).toEqual([null, 'descending']);
        expect(getNames()).toEqual(['c', 'b', 'a']);
    });

    it('受控的 filteredValue 报告筛选选择，并通过属性进行筛选', async () => {
        const onChange = vi.fn<TableChange>();
        const [filteredValue, setFilteredValue] = createSignal<string[]>([]);
        render(() => (
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
                        filteredValue: filteredValue(),
                    },
                    { title: 'Age', dataIndex: 'age' },
                ]}
                dataSource={smallData()}
                pagination={false}
                onChange={onChange}
            />
        ));
        await openFilter();
        await userEvent.click(screen.getByText('Starts with a'));
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ filters: [expect.objectContaining({ dataIndex: 'name', filteredValue: ['a'] })], extra: { changeType: 'filter' } }));
        expect(getNames()).toEqual(['b', 'a', 'c']);
        setFilteredValue(['a']);
        expect(getNames()).toEqual(['a']);
    });

    it('renderFilterDropdown 确认选值，filterDropdown 替换筛选图标', async () => {
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: (value, record) => record.name === value,
                renderFilterDropdown: (props) => (
                    <button type="button" onClick={() => props?.confirm({ filteredValue: ['a'], closeDropdown: true })}>
                        only a
                    </button>
                ),
            },
            { title: 'Age', dataIndex: 'age', onFilter: () => true, filterDropdown: () => <span data-testid="custom-filter">f</span> },
        ];
        render(() => <Table columns={columns} dataSource={smallData()} pagination={false} />);
        expect(screen.getByTestId('custom-filter').closest('th')).toBeInTheDocument();
        await openFilter();
        await userEvent.click(screen.getByText('only a'));
        expect(getNames()).toEqual(['a']);
    });

    it('受控 filterDropdownVisible 时，确定和关闭请求使用方关闭面板', async () => {
        const onVisibleChange = vi.fn<(visible?: boolean) => void>();
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: (value, record) => record.name === value,
                filterDropdownVisible: true,
                onFilterDropdownVisibleChange: onVisibleChange,
                renderFilterDropdown: (props) => (
                    <>
                        <button type="button" onClick={() => props?.confirm({ filteredValue: ['a'], closeDropdown: true })}>
                            only a
                        </button>
                        <button type="button" onClick={() => props?.close()}>
                            close it
                        </button>
                    </>
                ),
            },
        ];
        render(() => <Table columns={columns} dataSource={smallData()} pagination={false} />);
        await userEvent.click(await screen.findByText('only a'));
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
        onVisibleChange.mockClear();
        await userEvent.click(screen.getByText('close it'));
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('自定义筛选面板打开时，onFilterDropdownVisibleChange(true) 里已能拿到并聚焦面板内的元素，close() 后收到 false', async () => {
        const seen: (HTMLInputElement | undefined)[] = [];
        let input: HTMLInputElement | undefined;
        const onVisibleChange = vi.fn<(visible?: boolean) => void>((visible) => {
            if (visible) {
                seen.push(input);
                input?.focus();
            }
        });
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: (value, record) => record.name === value,
                onFilterDropdownVisibleChange: onVisibleChange,
                renderFilterDropdown: (props) => (
                    <>
                        <input ref={(el) => (input = el)} aria-label="keyword" />
                        <button type="button" onClick={() => props?.close()}>
                            close it
                        </button>
                    </>
                ),
            },
        ];
        render(() => <Table columns={columns} dataSource={smallData()} pagination={false} />);
        await userEvent.click(query(`.${P}-thead .${P}-column-filter`));
        await waitFor(() => expect(seen).toHaveLength(1));
        const keyword = screen.getByRole('textbox', { name: 'keyword' });
        expect(seen[0]).toBe(keyword);
        expect(keyword).toHaveFocus();
        await userEvent.click(screen.getByText('close it'));
        await waitFor(() => expect(onVisibleChange).toHaveBeenLastCalledWith(false));
        expect(onVisibleChange).toHaveBeenCalledTimes(2);
    });

    it('自定义筛选面板打开后，filterDropdownProps.afterOpen 与 onFilterDropdownVisibleChange(true) 各调用一次', async () => {
        const afterOpen = vi.fn<() => void>();
        const onVisibleChange = vi.fn<(visible?: boolean) => void>();
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: (value, record) => record.name === value,
                onFilterDropdownVisibleChange: onVisibleChange,
                filterDropdownProps: { afterOpen },
                renderFilterDropdown: () => <input aria-label="keyword" />,
            },
        ];
        render(() => <Table columns={columns} dataSource={smallData()} pagination={false} />);
        await userEvent.click(query(`.${P}-thead .${P}-column-filter`));
        await waitFor(() => expect(onVisibleChange.mock.calls).toEqual([[true]]));
        expect(afterOpen).toHaveBeenCalledTimes(1);
    });

    const filterOption = (text: string) => screen.getByText(text, { selector: `.${B}-dropdown-item *, .${B}-dropdown-item` });

    async function clickFilterOptionA(filterConfirmMode: 'immediate' | 'confirm') {
        const columns: ColumnProps[] = [
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
        render(() => <Table columns={columns} dataSource={smallData()} pagination={false} />);
        await openFilter();
        await userEvent.click(await screen.findByText('a', { selector: `.${B}-dropdown-item *, .${B}-dropdown-item` }));
    }

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
        const onFilterDropdownVisibleChange = vi.fn<(visible?: boolean) => void>();
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: (value, record) => record.name === value,
                onFilterDropdownVisibleChange,
                filterConfirmMode: 'confirm',
                filters: [
                    { text: 'a', value: 'a' },
                    { text: 'b', value: 'b' },
                ],
            },
        ];
        render(() => <Table columns={columns} dataSource={smallData()} pagination={false} />);
        fireEvent.click(query(`.${P}-thead .${P}-column-filter`));
        fireEvent.click(await waitFor(() => filterOption('a')));
        await waitFor(() => expect(onFilterDropdownVisibleChange).toHaveBeenCalledWith(true));
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Table.confirmFilter }));
        expect(getNames()).toEqual(['a']);
    });

    it('filterConfirmMode=confirm：未确定就关闭时丢弃暂存值，受控 filteredValue 在关闭期间变化后打开显示新值', async () => {
        const [filteredValue, setFilteredValue] = createSignal<string[]>([]);
        render(() => (
            <Table
                columns={[
                    {
                        title: 'Name',
                        dataIndex: 'name',
                        onFilter: (value, record) => record.name === value,
                        filterConfirmMode: 'confirm',
                        filteredValue: filteredValue(),
                        filters: [
                            { text: 'a', value: 'a' },
                            { text: 'b', value: 'b' },
                        ],
                    },
                ]}
                dataSource={smallData()}
                pagination={false}
            />
        ));
        const isChecked = (text: string) =>
            screen
                .getByText(text, { selector: `.${B}-dropdown-item *` })
                .closest('li')
                ?.querySelector('input')?.checked;
        await openFilter();
        await userEvent.click(screen.getByText('a', { selector: `.${B}-dropdown-item *` }));
        expect(isChecked('a')).toBe(true);
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(menuShown()).not.toBeInTheDocument());
        await openFilter();
        expect(isChecked('a')).toBe(false);
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(menuShown()).not.toBeInTheDocument());
        setFilteredValue(['b']);
        await openFilter();
        expect(isChecked('a')).toBe(false);
        expect(isChecked('b')).toBe(true);
    });

    it('嵌套筛选项的子菜单开合不当作根菜单的开合', async () => {
        const onVisibleChange = vi.fn<(visible?: boolean) => void>();
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: () => true,
                filterConfirmMode: 'confirm',
                onFilterDropdownVisibleChange: onVisibleChange,
                filters: [
                    { text: 'G1', value: 'g1', children: [{ text: 'a', value: 'a' }] },
                    { text: 'G2', value: 'g2', children: [{ text: 'b', value: 'b' }] },
                    { text: 'top', value: 'top' },
                ],
            },
        ];
        render(() => <Table columns={columns} dataSource={smallData()} pagination={false} />);
        await openFilter();
        await userEvent.click(await screen.findByText('top'));
        onVisibleChange.mockClear();
        await userEvent.hover(screen.getByText('G1'));
        await screen.findByText('a');
        await userEvent.hover(screen.getByText('G2'));
        await screen.findByText('b');
        await userEvent.hover(screen.getByText('top'));
        expect(onVisibleChange).not.toHaveBeenCalled();
        expect(screen.getByText('top').closest('li')?.querySelector('input')).toBeChecked();
    });

    it('非受控分页在 onChange 中报告页码', async () => {
        const onChange = vi.fn<TableChange>();
        render(() => <Table columns={getColumns()} dataSource={getData(46)} onChange={onChange} />);
        await userEvent.click(getPageItems()[2]);
        expect(onChange).toHaveBeenLastCalledWith({ pagination: expect.objectContaining({ currentPage: 2, pageSize: 10, total: 46 }), filters: [], sorter: undefined, extra: { changeType: 'pagination' } });
        expect(getFirstCellText()).toBe('Edward King 10');
    });

    it('受控的 currentPage 渲染给定的行，且以分页的 onChange 为准', async () => {
        const onChange = vi.fn<TableChange>();
        const onPageChange = vi.fn<(currentPage: number, pageSize: number) => void>();
        render(() => <Table columns={getColumns()} dataSource={getData(15)} pagination={{ currentPage: 1, pageSize: 10, total: 30, onChange: onPageChange }} onChange={onChange} />);
        expect(getBodyRows()).toHaveLength(15);
        await userEvent.click(getPageItems()[2]);
        expect(onPageChange).toHaveBeenCalledWith(2, 10);
        expect(onChange).not.toHaveBeenCalled();
        expect(getActivePage()).toHaveTextContent(/^1$/);
    });

    it('pagination 为 false 时显示所有行，formatPageText 格式化信息', () => {
        const [pagination, setPagination] = createSignal<TableProps['pagination']>(false);
        render(() => <Table columns={getColumns()} dataSource={getData(46)} pagination={pagination()} />);
        expect(getBodyRows()).toHaveLength(46);
        expect(document.querySelector(`.${P}-pagination-outer`)).not.toBeInTheDocument();
        setPagination({ formatPageText: (pageInfo) => `${pageInfo?.currentStart}-${pageInfo?.currentEnd}/${pageInfo?.total}` });
        expect(document.querySelector(`.${P}-pagination-info`)).toHaveTextContent('1-10/46');
    });

    it('受控选择报告行，全选时跳过禁用行，并固定选择列', async () => {
        const onChange = vi.fn<SelectionChange>();
        const onSelect = vi.fn<SelectChange>();
        const onSelectAll = vi.fn<SelectAllChange>();
        const data = getData(3);
        const [selectedRowKeys, setSelectedRowKeys] = createSignal<string[]>([]);
        render(() => <Table columns={getColumns()} dataSource={data} pagination={false} rowSelection={{ selectedRowKeys: selectedRowKeys(), onChange, onSelect, onSelectAll, fixed: true, getCheckboxProps: (record) => ({ disabled: record.key === '2' }) }} />);
        const rowCheckboxes = () => queryAll(`.${P}-tbody .${B}-checkbox`);
        await userEvent.click(rowCheckboxes()[0]);
        expect(onChange).toHaveBeenLastCalledWith(['0'], [data[0]]);
        expect(onSelect).toHaveBeenLastCalledWith(data[0], true, [data[0]], expect.anything());
        expect(getBodyRows()[0]).not.toHaveClass(`${P}-row-selected`);
        setSelectedRowKeys(['0']);
        expect(getBodyRows()[0]).toHaveClass(`${P}-row-selected`);
        await userEvent.click(getHeaderSelectionCheckbox());
        expect(onSelectAll).toHaveBeenLastCalledWith(true, [data[0], data[1]], [data[1]], expect.anything());
        expect(onChange).toHaveBeenLastCalledWith(['0', '1'], [data[0], data[1]]);
        expect(document.querySelector(`.${P}-thead .${P}-column-selection`)).toHaveClass(`${P}-cell-fixed-left`);
    });

    it('受控的 expandedRowKeys 报告展开状态，并通过属性渲染', async () => {
        const onExpand = vi.fn<NonNullable<TableProps['onExpand']>>();
        const onExpandedRowsChange = vi.fn<NonNullable<TableProps['onExpandedRowsChange']>>();
        const data = getData(3);
        const [expandedRowKeys, setExpandedRowKeys] = createSignal<string[]>([]);
        render(() => <Table columns={getColumns()} dataSource={data} expandedRowKeys={expandedRowKeys()} pagination={false} expandedRowRender={(record) => <p>detail {record?.name}</p>} onExpand={onExpand} onExpandedRowsChange={onExpandedRowsChange} />);
        await userEvent.click(query(`.${P}-tbody .${P}-expand-icon`));
        expect(onExpand).toHaveBeenLastCalledWith(true, data[0], expect.anything());
        expect(onExpandedRowsChange).toHaveBeenLastCalledWith([data[0]]);
        expect(screen.queryByText('detail Edward King 0')).not.toBeInTheDocument();
        setExpandedRowKeys(['0']);
        expect(screen.getByText('detail Edward King 0')).toBeInTheDocument();
    });

    it('按 childrenRecordName 展开树形数据，并使用 indentSize', async () => {
        const data = [{ key: '1', name: 'parent', kids: [{ key: '1-1', name: 'child' }] }];
        render(() => <Table childrenRecordName="kids" columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={data} indentSize={30} pagination={false} />);
        expect(screen.queryByText('child')).not.toBeInTheDocument();
        await userEvent.click(query(`.${P}-tbody .${P}-expand-icon`));
        const childCell = screen.getByText('child').closest('td') as HTMLElement;
        expect(childCell.querySelector(`.${P}-row-indent`)).toHaveStyle({ paddingInlineStart: '60px' });
    });

    it('固定列和固定表头获得 sticky 偏移，表体滚动同步到表头', () => {
        const { container } = render(() => <Table columns={getColumns()} dataSource={getData(3)} pagination={false} scroll={{ x: 1200, y: 300 }} />);
        expect(container.querySelector(`.${P}-wrapper`)).toHaveAttribute('data-column-fixed', 'true');
        expect(container.querySelector(`.${P}-header`)).toBeInTheDocument();
        const body = container.querySelector(`.${P}-body`) as HTMLElement;
        expect(body).toHaveStyle({ maxHeight: '300px' });
        const heads = queryAll(`.${P}-thead .${P}-row-head`);
        expect(heads[0]).toHaveStyle({ position: 'sticky', left: '0px' });
        expect(heads[heads.length - 1]).toHaveStyle({ position: 'sticky', right: '0px' });
        Object.defineProperty(body, 'scrollLeft', { value: 1200, configurable: true });
        fireEvent.scroll(body);
        expect((container.querySelector(`.${P}-header`) as HTMLElement).scrollLeft).toBe(1200);
    });

    it('sticky 表头使用顶部偏移', () => {
        render(() => <Table columns={getColumns()} dataSource={getData(3)} pagination={false} sticky={{ top: 20 }} />);
        const header = query(`.${P}-header`);
        expect(header).toHaveClass(`${P}-header-sticky`);
        expect(header).toHaveStyle({ top: '20px' });
    });

    it('渲染空状态插槽和加载 spin', () => {
        render(() => <Table columns={getColumns()} dataSource={[]} empty={<span>nothing here</span>} loading />);
        expect(screen.getByText('nothing here')).toBeInTheDocument();
        expect(query(`.${B}-spin`)).not.toHaveClass(`${B}-spin-hidden`);
        expect(query(`.${B}-spin-wrapper`)).toBeInTheDocument();
    });

    it('id、class、style 和 data-* 落在根元素上', () => {
        render(() => <Table id="t1" class="mine" style={{ color: 'red' }} data-testid="table-root" columns={getColumns()} dataSource={getData(3)} />);
        const root = screen.getByTestId('table-root');
        expect(root).toHaveClass(`${P}-wrapper`, 'mine');
        expect(root).toHaveAttribute('id', 't1');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('从 semiGlobal.config.overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Table: { size: 'small', bordered: true } } as typeof semiGlobal.config.overrideDefaultProps;
        render(() => <Table columns={getColumns()} dataSource={getData(3)} />);
        expect(query(`.${P}-small`)).toHaveClass(`${P}-bordered`);
    });

    it('替换 onChange 后调用新的 onChange', async () => {
        const first = vi.fn<TableChange>();
        const second = vi.fn<TableChange>();
        const [onChange, setOnChange] = createSignal<TableChange>(first);
        const columns: ColumnProps[] = [{ title: 'Age', dataIndex: 'age', sorter: (a, b) => a.age - b.age }];
        render(() => <Table columns={columns} dataSource={smallData()} pagination={false} onChange={onChange()} />);
        setOnChange(() => second);
        await userEvent.click(ageHeader());
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });

    it('通过 components 渲染自定义 body 行', () => {
        const CustomRow = (props: Record<string, unknown>) => <tr data-custom-row="" {...props} />;
        render(() => <Table columns={getColumns()} components={{ body: { row: CustomRow } }} dataSource={getData(3)} pagination={false} />);
        expect(getBodyRows()).toHaveLength(3);
        getBodyRows().forEach((row) => expect(row).toHaveAttribute('data-custom-row'));
    });

    it('rtl 下交换固定列的侧边类名', () => {
        render(() => <Table columns={getColumns()} dataSource={getData(3)} direction="rtl" pagination={false} />);
        expect(query(`.${P}-wrapper`)).toHaveAttribute('dir', 'rtl');
        expect(queryAll(`.${P}-thead .${P}-row-head`)[0]).toHaveClass(`${P}-cell-fixed-right`);
    });

    it('把当前页数据传给 title 和 footer，showHeader 为 false 时隐藏表头', () => {
        const title = vi.fn<(pageData?: unknown[]) => string>(() => 'T');
        const footer = vi.fn<(pageData?: unknown[]) => string>(() => 'F');
        render(() => <Table title={title} columns={getColumns()} dataSource={getData(46)} footer={footer} showHeader={false} />);
        expect(title.mock.lastCall?.[0]).toHaveLength(10);
        expect(footer.mock.lastCall?.[0]).toHaveLength(10);
        // a fixed column keeps an inert header for its widths; Solid writes inert as a property, which jsdom does not reflect
        expect(queryAll(`.${P}-thead`).every((thead) => thead.inert)).toBe(true);
    });

    it('rowSpanHover 高亮悬停的 rowSpan 单元格覆盖的所有行', () => {
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name', onCell: (_record, index) => ({ rowSpan: index === 0 ? 2 : index === 1 ? 0 : 1 }) },
            { title: 'Age', dataIndex: 'age' },
        ];
        render(() => <Table columns={columns} dataSource={smallData()} pagination={false} rowSpanHover />);
        const rows = getBodyRows();
        fireEvent.mouseEnter(rows[1]);
        expect(rows[0]).toHaveClass(`${P}-row-hovered`);
        expect(rows[1]).toHaveClass(`${P}-row-hovered`);
        expect(rows[2]).not.toHaveClass(`${P}-row-hovered`);
    });

    it('headerStyle 应用于表头单元格，列的 onHeaderCell style 优先级更高', () => {
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name', onHeaderCell: () => ({ style: { color: 'blue' } }) },
            { title: 'Age', dataIndex: 'age' },
        ];
        render(() => <Table headerStyle={{ color: 'red', 'font-weight': 700 }} columns={columns} dataSource={smallData()} pagination={false} />);
        const heads = queryAll(`.${P}-thead .${P}-row-head`);
        expect(heads[0]).toHaveStyle({ color: 'rgb(0, 0, 255)', fontWeight: '700' });
        expect(heads[1]).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });
});

describe('Table 函数组件', () => {
    it('使用新的 rowSelection 对象重新渲染后，全选跳过禁用的树形子节点', async () => {
        const onChange = vi.fn<SelectionChange>();
        const data = [
            { key: '1', name: 'parent', children: [{ key: '1-1', name: 'child' }] },
            { key: '2', name: 'other' },
        ];
        const getCheckboxProps = (record: Row) => ({ disabled: record.key === '1-1' });
        const [version, setVersion] = createSignal(0);
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={data} defaultExpandAllRows pagination={false} rowSelection={(version(), { onChange, getCheckboxProps })} />);
        setVersion(1);
        await userEvent.click(getHeaderSelectionCheckbox());
        expect(onChange).toHaveBeenLastCalledWith(['1', '2'], [data[0], data[1]]);
    });

    it('ref 拿到根元素，getCurrentPageData 挂在它上面', () => {
        let handle: TableElement | undefined;
        const { container } = render(() => <Table ref={(value) => (handle = value)} columns={getColumns()} dataSource={getData(15)} />);
        expect(handle).toBe(container.firstElementChild);
        const pageData = handle?.getCurrentPageData();
        expect(pageData?.dataSource).toHaveLength(10);
        expect(pageData?.dataSource?.[0].key).toBe('0');
    });

    it('展开行时不重新调用其他单元格的 render', async () => {
        const renderAge = vi.fn<(text: unknown) => string>((text) => String(text));
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name' },
            { title: 'Age', dataIndex: 'age', render: renderAge },
        ];
        render(() => <Table columns={columns} dataSource={getData(5)} pagination={false} expandedRowRender={(record) => <p>detail {record?.name}</p>} />);
        renderAge.mockClear();
        await userEvent.click(query(`.${P}-tbody .${P}-expand-icon`));
        expect(screen.getByText('detail Edward King 0')).toBeInTheDocument();
        expect(renderAge).not.toHaveBeenCalled();
    });
});

describe('Table 筛选触发器', () => {
    const filterColumns: ColumnProps[] = [{ title: 'Name', dataIndex: 'name', filters: [{ text: 'Alpha', value: 'a' }], onFilter: () => true }];

    it('是原生 button，键盘可以聚焦并打开', async () => {
        render(() => <Table columns={filterColumns} dataSource={[{ key: '1', name: 'a' }]} pagination={false} />);
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
        render(() => <Table columns={filterColumns} dataSource={[{ key: '1', name: 'a' }]} pagination={false} />);
        const trigger = screen.getByRole('button', { name: zh_CN.Table.filterColumn });
        expect(trigger).toHaveAttribute('aria-label', zh_CN.Table.filterColumn);
        await userEvent.click(trigger);
        await userEvent.click(await screen.findByText('Alpha'));
        await waitFor(() => expect(trigger).toHaveAttribute('aria-label', zh_CN.Table.filterColumnActive));
        await userEvent.click(screen.getByText('Alpha'));
        await waitFor(() => expect(trigger).toHaveAttribute('aria-label', zh_CN.Table.filterColumn));
    });

    it('自定义 rowKey 时展开行的 data-row-key 来自该行的真实 key', () => {
        const { container } = render(() => <Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={[{ id: 'a1', name: 'Alpha' }]} defaultExpandAllRows rowKey="id" expandedRowRender={(record) => <span>detail-{record?.name}</span>} />);
        expect(container.querySelector(`.${P}-row-expand`)).toHaveAttribute('data-row-key', 'a1-expanded-row');
    });
});

describe('Table checkRelation 与数字 rowKey 的关联', () => {
    it('所有子节点选中后选中父节点，并报告数字 key', async () => {
        const onChange = vi.fn<SelectionChange>();
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
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={treeData} defaultExpandAllRows pagination={false} rowKey="id" rowSelection={{ checkRelation: 'related', onChange }} />);
        const checkboxes = screen.getAllByRole('checkbox');
        await userEvent.click(checkboxes[2]);
        await userEvent.click(checkboxes[3]);
        const keys = onChange.mock.lastCall?.[0] ?? [];
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
    const columns: ColumnProps[] = [{ title: 'Name', dataIndex: 'name' }];
    const RelatedTable = (props: { rowSelection: RowSelectionConfig }) => <Table columns={columns} dataSource={treeData} defaultExpandAllRows pagination={false} rowKey="id" rowSelection={{ checkRelation: 'related', ...props.rowSelection }} />;
    const checkboxes = () => screen.getAllByRole('checkbox');

    it('受控 selectedRowKeys 含子行时父行半选，清空后父行不再半选', () => {
        const [keys, setKeys] = createSignal<number[]>([2]);
        render(() => <RelatedTable rowSelection={{ selectedRowKeys: keys() }} />);
        expect(checkboxes()[1]).toBePartiallyChecked();
        setKeys([]);
        expect(checkboxes()[1]).not.toBePartiallyChecked();
    });

    it('defaultSelectedRowKeys 含子行时父行半选', () => {
        render(() => <RelatedTable rowSelection={{ defaultSelectedRowKeys: [2] }} />);
        expect(checkboxes()[1]).toBePartiallyChecked();
    });

    it('defaultSelectedRowKeys 含父行时子行一并选中', () => {
        render(() => <RelatedTable rowSelection={{ defaultSelectedRowKeys: [1] }} />);
        expect(checkboxes()[2]).toBeChecked();
        expect(checkboxes()[3]).toBeChecked();
    });

    const rows = [
        { key: 1, name: 'Ann' },
        { key: 2, name: 'Bob' },
        { key: 3, name: 'Cid' },
    ];

    it('受控 selectedRowKeys 里被禁用的行挂载后保持选中，勾选其他行时 onChange 保留它', async () => {
        const onChange = vi.fn<SelectionChange>();
        render(() => <Table columns={columns} dataSource={rows} pagination={false} rowSelection={{ selectedRowKeys: [1, 2], getCheckboxProps: (record) => ({ disabled: record.key === 1 }), onChange }} />);
        expect(checkboxes()[1]).toBeChecked();
        await userEvent.click(checkboxes()[3]);
        expect(onChange.mock.lastCall?.[0]).toEqual([1, 2, 3]);
    });

    it('非受控 defaultSelectedRowKeys 里被禁用的行挂载后保持选中，勾选其他行时 onChange 保留它', async () => {
        const onChange = vi.fn<SelectionChange>();
        render(() => <Table columns={columns} dataSource={rows} pagination={false} rowSelection={{ defaultSelectedRowKeys: [1, 2], getCheckboxProps: (record) => ({ disabled: record.key === 1 }), onChange }} />);
        expect(checkboxes()[1]).toBeChecked();
        await userEvent.click(checkboxes()[3]);
        expect(onChange.mock.lastCall?.[0]).toEqual([1, 2, 3]);
    });

    it('checkRelation 由 unRelated 改为 related 后，选中子行使父行半选', async () => {
        const [relation, setRelation] = createSignal<RowSelectionConfig>({ checkRelation: 'unRelated' });
        render(() => <RelatedTable rowSelection={relation()} />);
        setRelation({});
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
    const names = () => getBodyRows().map((row) => row.querySelector('td')?.textContent);
    const sorterColumn: ColumnProps = { title: 'Name', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) };

    it('showSortTip：排序器是表头单元格唯一的停靠点，Enter 和 Space 排序，焦点时显示提示', async () => {
        const { container } = render(() => <Table columns={[{ ...sorterColumn, showSortTip: true }]} dataSource={dataSource} pagination={false} />);
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
        render(() => <Table columns={[sorterColumn]} dataSource={dataSource} pagination={false} />);
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'Name' })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(names()).toEqual(['a', 'b', 'c']);
        expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort', 'ascending');
    });

    it('未开 useFullRender 的函数 title 带 sorter 时，排序按钮以它命名并可用键盘排序', async () => {
        render(() => <Table columns={[{ ...sorterColumn, title: () => <span>Name</span> }]} dataSource={dataSource} pagination={false} />);
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'Name' })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(names()).toEqual(['a', 'b', 'c']);
        expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort', 'ascending');
    });

    it('未开 useFullRender 的函数 title 带 sorter 与 filters 时，排序按钮和筛选入口都出现', async () => {
        render(() => <Table columns={[{ ...sorterColumn, title: () => <span>Name</span>, filters: [{ text: 'A', value: 'a' }], onFilter: () => true }]} dataSource={dataSource} pagination={false} />);
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'Name' })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(names()).toEqual(['a', 'b', 'c']);
        await userEvent.tab();
        expect(screen.getByRole('button', { name: zh_CN.Table.filterColumn })).toHaveFocus();
    });

    it('带筛选时，排序提示属于排序器，图标不是额外的停靠点', async () => {
        render(() => <Table columns={[{ ...sorterColumn, showSortTip: true, filters: [{ text: 'A', value: 'a' }], onFilter: () => true }]} dataSource={dataSource} pagination={false} />);
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
    const treeColumns: ColumnProps[] = [{ title: 'Name', dataIndex: 'name' }];

    it('是行和单元格组成的 table，从不是 grid', () => {
        render(() => <Table columns={treeColumns} dataSource={treeData} pagination={false} />);
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
        render(() => <Table columns={treeColumns} dataSource={treeData} pagination={false} />);
        await userEvent.tab();
        const expand = screen.getByRole('button', { name: zh_CN.Table.expandRow });
        expect(expand).toHaveFocus();
        expect(expand).toHaveAttribute('aria-expanded', 'false');
        await userEvent.keyboard('{Enter}');
        expect(expand).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('cell', { name: 'child' })).toBeInTheDocument();
    });

    it('渲染为单个 table 元素时，保留 table role', () => {
        const { container } = render(() => <Table columns={treeColumns} dataSource={getData(3)} pagination={false} />);
        expect(screen.getByRole('table').tagName).toBe('TABLE');
        expect(container.querySelector('[role="none"]')).toBeNull();
        expect(container.querySelector('[aria-colspan], [aria-rowspan]')).toBeNull();
    });

    it.each([
        ['scroll.y', { scroll: { y: 200 } }],
        ['sticky', { sticky: true }],
    ] as const)('%s 时，分开的表头和 body 表格构成一个 ARIA table', (_name, extra) => {
        const { container } = render(() => (
            <Table
                columns={[
                    { title: 'Name', dataIndex: 'name', width: 200 },
                    { title: 'Age', dataIndex: 'age', width: 100 },
                ]}
                dataSource={getData(20)}
                pagination={false}
                {...extra}
            />
        ));
        const table = screen.getByRole('table');
        expect(table).toHaveClass(`${P}-container`);
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
        render(() => (
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
        ));
        const name = screen.getByRole('columnheader', { name: 'Name' });
        const detail = screen.getByRole('columnheader', { name: 'Detail' });
        expect(name).toHaveAttribute('aria-rowspan', '2');
        expect(name).not.toHaveAttribute('aria-colspan');
        expect(detail).toHaveAttribute('aria-colspan', '2');
        expect(detail).not.toHaveAttribute('aria-rowspan');
        expect(screen.getByRole('columnheader', { name: 'Age' })).not.toHaveAttribute('aria-rowspan');
    });

    it('展开列表头有名称', () => {
        render(() => <Table columns={treeColumns} dataSource={getData(2)} hideExpandedColumn={false} pagination={false} expandedRowRender={(record) => record?.name} />);
        expect(screen.getByRole('columnheader', { name: zh_CN.Table.expandColumn })).toBeInTheDocument();
    });

    it('使用 scroll.y 滚动的 body 是一个 Tab 停靠点', async () => {
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name', width: 200 }]} dataSource={getData(100)} pagination={false} scroll={{ y: 200 }} />);
        await userEvent.tab();
        expect(document.activeElement).toHaveClass(`${P}-body`);
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('不滚动的 body 不是 Tab 停靠点', async () => {
        render(() => <Table columns={treeColumns} dataSource={getData(3)} pagination={false} />);
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });
});

describe('Table 记录 key', () => {
    it('本地筛选的记录没有 key 时报错', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const [dataSource, setDataSource] = createSignal([{ name: 'a' }]);
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name', onFilter: () => true }]} dataSource={dataSource()} pagination={false} />);
        setDataSource([{ name: 'a' }, { name: 'b' }]);
        expect(error.mock.calls.flat().join('\n')).toContain('You must specify a key');
        error.mockRestore();
    });
});

describe('Table 滚动条宽度测量', () => {
    it('有固定列的展开行，重新渲染不再测量滚动条', () => {
        const append = vi.spyOn(document.body, 'appendChild');
        const measures = () => append.mock.calls.filter(([node]) => (node as HTMLElement).className?.includes?.('scrollbar-measure')).length;
        const files = [
            { key: '1', name: 'a', size: '2M' },
            { key: '2', name: 'b', size: '34KB' },
        ];
        const [dataSource, setDataSource] = createSignal(files.map((file) => ({ ...file })));
        render(() => (
            <Table
                columns={[
                    { title: 'Name', dataIndex: 'name', fixed: 'left', width: 100 },
                    { title: 'Size', dataIndex: 'size', width: 100 },
                ]}
                dataSource={dataSource()}
                defaultExpandAllRows
                pagination={false}
                scroll={{ x: 1000 }}
                expandedRowRender={() => 'detail'}
            />
        ));
        const afterMount = measures();
        setDataSource(files.map((file) => ({ ...file })));
        setDataSource(files.map((file) => ({ ...file })));
        expect(document.querySelectorAll(`.${P}-expand-inner`)).not.toHaveLength(0);
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
    it('rowSelection 换成同内容的新对象不触发重新排序', async () => {
        const files = [
            { key: '1', name: 'b.fig', size: '2M' },
            { key: '2', name: 'a.fig', size: '2M' },
            { key: '3', name: 'c.doc', size: '34KB' },
        ];
        const sorter = vi.fn<(a: Row, b: Row) => number>((a, b) => a.name.localeCompare(b.name));
        const columns: ColumnProps[] = [
            { title: '标题', dataIndex: 'name', sorter },
            { title: '大小', dataIndex: 'size' },
        ];
        const [version, setVersion] = createSignal(0);
        render(() => <Table columns={columns} dataSource={files} pagination={false} rowSelection={(version(), { getCheckboxProps: () => ({}) })} />);
        await userEvent.click(screen.getByRole('button', { name: '标题' }));
        sorter.mockClear();
        setVersion(1);
        expect(sorter).not.toHaveBeenCalled();
    });
});

describe('Table 无 dataIndex 的筛选列', () => {
    it('带 filters 但没有 dataIndex 的列照常渲染，并给出警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        render(() => <Table columns={[{ title: 'Name', filters: [{ text: 'A', value: 'a' }], onFilter: () => true }]} dataSource={[{ key: '1' }]} pagination={false} />);
        expect(screen.getByRole('columnheader', { name: /Name/ })).toBeInTheDocument();
        await userEvent.click(query(`.${P}-column-filter`));
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
    const SelectionTable = (props: { rowSelection: TableProps['rowSelection'] }) => <Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={rows} pagination={false} rowSelection={props.rowSelection} />;

    it('rowSelection 去掉 clickRow 后，点击行不再选中', async () => {
        const onChange = vi.fn<SelectionChange>();
        const [rowSelection, setRowSelection] = createSignal<TableProps['rowSelection']>({ clickRow: true, onChange });
        render(() => <SelectionTable rowSelection={rowSelection()} />);
        await userEvent.click(screen.getByText('Ann'));
        expect(onChange).toHaveBeenCalledTimes(1);
        setRowSelection({ onChange });
        await userEvent.click(screen.getByText('Bob'));
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('rowSelection 变为 undefined 后，点击行不再触发旧回调', async () => {
        const onChange = vi.fn<SelectionChange>();
        const [rowSelection, setRowSelection] = createSignal<TableProps['rowSelection']>({ clickRow: true, onChange });
        render(() => <SelectionTable rowSelection={rowSelection()} />);
        setRowSelection(undefined);
        await userEvent.click(screen.getByText('Ann'));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('rowSelection 去掉 disabled 后，表头全选框恢复可用，非受控的已选行保留', async () => {
        const [rowSelection, setRowSelection] = createSignal<TableProps['rowSelection']>({ disabled: true });
        render(() => <SelectionTable rowSelection={rowSelection()} />);
        expect(screen.getAllByRole('checkbox')[0]).toBeDisabled();
        setRowSelection({});
        expect(screen.getAllByRole('checkbox')[0]).toBeEnabled();
        await userEvent.click(screen.getAllByRole('checkbox')[1]);
        setRowSelection({ checkRelation: 'unRelated' });
        expect(screen.getAllByRole('checkbox')[1]).toBeChecked();
    });
});

describe('Table 列与展开图标', () => {
    it('JSX 分组列只有一个子 Column 时，子列照常渲染', () => {
        render(() => (
            <Table dataSource={[{ key: '1', name: 'Ann' }]} pagination={false}>
                <Table.Column title="Group">
                    <Table.Column title="Name" dataIndex="name" />
                </Table.Column>
            </Table>
        ));
        expect(document.querySelectorAll('thead tr')).toHaveLength(2);
        expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
        expect(screen.getByRole('cell', { name: 'Ann' })).toBeInTheDocument();
    });

    it('expandIcon 返回文本或 null 时不抛错，并显示该内容', async () => {
        const [expandIcon, setExpandIcon] = createSignal<TableProps['expandIcon']>((expanded?: boolean) => (expanded ? '-' : '+'));
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={[{ key: '1', name: 'Ann' }]} expandIcon={expandIcon()} pagination={false} expandedRowRender={() => 'detail'} />);
        const button = screen.getByRole('button', { name: zh_CN.Table.expandRow });
        expect(button).toHaveTextContent('+');
        await userEvent.click(button);
        expect(button).toHaveTextContent('-');
        setExpandIcon(() => () => null);
        expect(screen.getByRole('button', { name: zh_CN.Table.expandRow }).textContent).toBe('');
        setExpandIcon('>');
        expect(screen.getByRole('button', { name: zh_CN.Table.expandRow })).toHaveTextContent('>');
    });
});

describe('Table 全选范围与 changedRows', () => {
    const rows = [
        { key: '1', name: 'a' },
        { key: '2', name: 'a' },
        { key: '3', name: 'b' },
    ];
    const columns: ColumnProps[] = [{ title: 'Name', dataIndex: 'name', filteredValue: ['a'], onFilter: (value, record) => record.name === value }];
    const keysOf = (list: Row[]) => list.map((row) => row.key);

    async function selectAll(checkRelation: 'related' | 'unRelated', selectedRowKeys: string[]) {
        const onSelectAll = vi.fn<SelectAllChange>();
        render(() => <Table columns={columns} dataSource={rows} pagination={false} rowSelection={{ checkRelation, selectedRowKeys, onSelectAll }} />);
        await userEvent.click(getHeaderSelectionCheckbox());
        const [selected, selectedRows, changedRows] = onSelectAll.mock.lastCall ?? [];
        const sorted = (list: Row[]) => keysOf(list).toSorted((a, b) => String(a).localeCompare(String(b)));
        return { selected, selectedKeys: sorted(selectedRows ?? []), changedKeys: sorted(changedRows ?? []) };
    }

    it.each(['related', 'unRelated'] as const)('%s：全选只报告状态真正变化的行', async (checkRelation) => {
        expect(await selectAll(checkRelation, ['1', '3'])).toEqual({ selected: true, selectedKeys: ['1', '2', '3'], changedKeys: ['2'] });
    });

    it.each(['related', 'unRelated'] as const)('%s：取消全选保留被筛选隐藏的已选行', async (checkRelation) => {
        expect(await selectAll(checkRelation, ['1', '2', '3'])).toEqual({ selected: false, selectedKeys: ['3'], changedKeys: ['1', '2'] });
    });
});

describe('Table 表头', () => {
    it('普通列的函数 title 收到参数对象，解构参数不抛错', () => {
        const title = ({ sorter }: ColumnTitleProps) => `Name${sorter ? ' sortable' : ''}`;
        render(() => <Table columns={[{ title, dataIndex: 'name' }]} dataSource={getData(1)} pagination={false} />);
        expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    });

    it('函数 title 返回的 Show、返回 Show 的组件随数据更新', () => {
        const [on, setOn] = createSignal(false);
        const Toggle = (props: { name: string }) => (
            <Show when={on()} fallback={<span>{props.name} off</span>}>
                <span>{props.name} on</span>
            </Show>
        );
        const Demo = () => {
            const columns: ColumnProps[] = [
                {
                    title: () => (
                        <Show when={on()} fallback={<span>plain off</span>}>
                            <span>plain on</span>
                        </Show>
                    ),
                    dataIndex: 'name',
                },
                { title: () => <Toggle name="sorter" />, dataIndex: 'age', sorter: true },
                { title: () => <Toggle name="full" />, dataIndex: 'address', useFullRender: true },
            ];
            return <Table columns={columns} dataSource={getData(1)} pagination={false} />;
        };
        render(() => <Demo />);
        for (const name of ['plain', 'sorter', 'full']) {
            expect(screen.getByText(`${name} off`)).toBeInTheDocument();
        }
        setOn(true);
        for (const name of ['plain', 'sorter', 'full']) {
            expect(screen.getByText(`${name} on`)).toBeInTheDocument();
        }
    });

    it('onHeaderRow 与 onHeaderCell 返回的对象不被改写，重渲染后类名不增长', () => {
        const rowProps = { class: 'my-row' };
        const cellProps = { class: 'my-cell' };
        const [dataSource, setDataSource] = createSignal(getData(1));
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name', align: 'center', class: 'col', onHeaderCell: () => cellProps }]} dataSource={dataSource()} pagination={false} onHeaderRow={() => rowProps} />);
        setDataSource(getData(2));
        setDataSource(getData(3));
        expect(rowProps).toEqual({ class: 'my-row' });
        expect(cellProps).toEqual({ class: 'my-cell' });
        expect([...query(`.${P}-thead tr`).classList]).toEqual(['my-row', `${P}-row`]);
        const th = screen.getByRole('columnheader', { name: 'Name' });
        expect([...th.classList].filter((name) => name === 'col')).toHaveLength(1);
    });
});

describe('Table 开发提示', () => {
    it('排序列缺少 dataIndex 只警告一次', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const [dataSource, setDataSource] = createSignal(getData(1));
        render(() => <Table columns={[{ title: 'Name', sorter: (a, b) => a.name.localeCompare(b.name) }]} dataSource={dataSource()} pagination={false} />);
        setDataSource(getData(2));
        expect(warn.mock.calls.filter((args) => args.join(' ').includes('dataIndex'))).toHaveLength(1);
        warn.mockRestore();
    });
});

describe('Table 筛选', () => {
    it('没有 dataIndex 的列筛选后，onChange 的 filters 不混入其他列', async () => {
        const onChange = vi.fn<TableChange>();
        render(() => (
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
        ));
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        await userEvent.click(query(`.${P}-column-filter`));
        await userEvent.click(await screen.findByText('A'));
        await userEvent.click(screen.getByRole('button', { name: 'Name' }));
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ filters: [], extra: { changeType: 'sorter' } }));
        warn.mockRestore();
    });
});

describe('Table 非元素内容与可访问名称', () => {
    const nameColumns: ColumnProps[] = [{ title: 'Name', dataIndex: 'name' }];
    const rows = [
        { key: '1', name: 'a', size: 1 },
        { key: '2', name: 'b', size: 1 },
    ];

    it('expandedRowRender 返回字符串或数字时作为展开内容显示', () => {
        render(() => <Table columns={nameColumns} dataSource={rows} defaultExpandAllRows pagination={false} expandedRowRender={(record) => (record?.key === '1' ? 'detail text' : 42)} />);
        expect(screen.getByText('detail text')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('aria-label、aria-labelledby、aria-describedby 落在 role=table 的元素上', () => {
        const first = render(() => (
            <>
                <span id="desc">about</span>
                <Table aria-describedby="desc" aria-label="files" columns={nameColumns} dataSource={rows} />
            </>
        ));
        expect(screen.getByRole('table', { name: 'files' })).toHaveAccessibleDescription('about');
        expect(query(`.${P}-wrapper`)).not.toHaveAttribute('aria-label');
        first.unmount();

        const second = render(() => <Table aria-label="split" columns={nameColumns} dataSource={rows} scroll={{ y: 200 }} />);
        expect(screen.getByRole('table', { name: 'split' })).toHaveClass(`${P}-container`);
        second.unmount();

        render(() => (
            <>
                <h2 id="heading">Uploads</h2>
                <Table aria-labelledby="heading" columns={nameColumns} dataSource={rows} />
            </>
        ));
        expect(screen.getByRole('table', { name: 'Uploads' })).toHaveAttribute('aria-labelledby', 'heading');
    });

    it('有 title 且未给名称时，表格以 title 为名称', () => {
        const [label, setLabel] = createSignal<string>();
        render(() => <Table aria-label={label()} title="Report" columns={nameColumns} dataSource={rows} />);
        expect(screen.getByRole('table', { name: 'Report' })).toBeInTheDocument();
        setLabel('own');
        expect(screen.getByRole('table', { name: 'own' })).toBeInTheDocument();
    });

    it('title 与 footer 为数字时也显示', () => {
        render(() => <Table title={0} columns={nameColumns} dataSource={rows} footer={() => 42} />);
        expect(query(`.${P}-title`)).toHaveTextContent('0');
        expect(query(`.${P}-footer`)).toHaveTextContent('42');
    });
});

describe('Table 列功能', () => {
    const rows = [
        { key: '1', name: 'a' },
        { key: '2', name: 'b' },
    ];
    const columns: ColumnProps[] = [{ title: 'Name', dataIndex: 'name' }];

    it('选择框的可访问名称不随勾选状态变化', () => {
        const [keys, setKeys] = createSignal(['1']);
        render(() => <Table columns={columns} dataSource={rows} pagination={false} rowSelection={{ selectedRowKeys: keys() }} />);
        const rowBoxes = screen.getAllByRole('checkbox', { name: zh_CN.Table.selectRow });
        expect(rowBoxes).toHaveLength(2);
        expect(rowBoxes[0]).toBeChecked();
        setKeys(['1', '2']);
        expect(screen.getByRole('checkbox', { name: zh_CN.Table.selectAllRows })).toBeChecked();
        expect(screen.getAllByRole('checkbox', { name: zh_CN.Table.selectRow })).toHaveLength(2);
    });

    it('renderPagination 返回字符串时显示该内容，返回 null 时回落默认分页器', () => {
        const [renderPagination, setRenderPagination] = createSignal<TableProps['renderPagination']>(() => 'custom pager');
        render(() => <Table columns={columns} dataSource={rows} renderPagination={renderPagination()} />);
        const outer = query(`.${P}-pagination-outer`);
        expect(outer).toHaveTextContent(/^custom pager$/);
        expect(outer.querySelector(`.${B}-page`)).toBeNull();
        setRenderPagination(() => () => null);
        expect(document.querySelector(`.${P}-pagination-outer .${B}-page`)).not.toBeNull();
    });

    it('只有 renderFilterDropdown 或 filterDropdown 的列也渲染筛选器', () => {
        render(() => (
            <Table
                columns={[
                    { title: 'Name', dataIndex: 'name', renderFilterDropdown: () => <div>panel</div> },
                    { title: 'Size', dataIndex: 'size', filterDropdown: () => <span data-testid="own-filter">f</span> },
                ]}
                dataSource={rows}
                pagination={false}
            />
        ));
        expect(screen.getByRole('button', { name: zh_CN.Table.filterColumn }).closest('th')).toHaveTextContent('Name');
        expect(screen.getByTestId('own-filter').closest('th')).toHaveTextContent('Size');
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
        const [columns, setColumns] = createSignal<ColumnProps[]>([{ title: 'Name', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) }]);
        render(() => <Table columns={columns()} dataSource={files} pagination={false} />);
        await userEvent.click(screen.getByRole('button', { name: 'Name' }));
        expect(names()).toEqual(['a', 'b', 'c']);
        setColumns([{ title: 'Name', dataIndex: 'name' }]);
        expect(names()).toEqual(['b', 'a', 'c']);
        expect(screen.getByRole('columnheader', { name: 'Name' })).not.toHaveAttribute('aria-sort');
    });

    it('columns 去掉筛选配置后，不再按旧的筛选值过滤', () => {
        const [columns, setColumns] = createSignal<ColumnProps[]>([{ title: 'Name', dataIndex: 'name', filters: [{ text: 'a', value: 'a' }], onFilter: (value, record) => record.name === value, defaultFilteredValue: ['a'] }]);
        render(() => <Table columns={columns()} dataSource={files} pagination={false} />);
        expect(names()).toEqual(['a']);
        setColumns([{ title: 'Name', dataIndex: 'name' }]);
        expect(names()).toEqual(['b', 'a', 'c']);
    });

    it('pagination 去掉 onChange 后，翻页由表格自己处理', async () => {
        const onChange = vi.fn<(currentPage: number, pageSize: number) => void>();
        const [pagination, setPagination] = createSignal<TableProps['pagination']>({ pageSize: 10, onChange });
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={getData(25)} pagination={pagination()} />);
        setPagination({ pageSize: 10 });
        await clickPage(2);
        expect(onChange).not.toHaveBeenCalled();
        expect(getFirstCellText()).toBe('Edward King 10');
    });
});

describe('Table 受控值撤销后回到非受控', () => {
    const rows = [
        { key: '1', name: 'Ann' },
        { key: '2', name: 'Bob' },
    ];
    const columns: ColumnProps[] = [{ title: 'Name', dataIndex: 'name' }];

    it('expandedRowKeys 撤销后不再展开', () => {
        const [keys, setKeys] = createSignal<string[] | undefined>(['1']);
        render(() => <Table columns={columns} dataSource={rows} expandedRowKeys={keys()} pagination={false} expandedRowRender={(record) => `detail ${record?.name}`} />);
        expect(screen.getByText('detail Ann')).toBeInTheDocument();
        setKeys(undefined);
        expect(screen.queryByText('detail Ann')).not.toBeInTheDocument();
    });

    it('rowSelection.selectedRowKeys 撤销后不再选中', () => {
        const [keys, setKeys] = createSignal<string[] | undefined>(['1']);
        render(() => <Table columns={columns} dataSource={rows} pagination={false} rowSelection={{ selectedRowKeys: keys() }} />);
        expect(screen.getAllByRole('checkbox')[1]).toBeChecked();
        setKeys(undefined);
        expect(screen.getAllByRole('checkbox')[1]).not.toBeChecked();
    });

    it('列的 filterDropdownVisible 撤销后，筛选按钮照常开关菜单', async () => {
        const column = (extra: Partial<ColumnProps> = {}): ColumnProps => ({ title: 'Name', dataIndex: 'name', filters: [{ text: 'only Ann', value: 'Ann' }], onFilter: (value, record) => record.name === value, ...extra });
        const [columnsSignal, setColumns] = createSignal([column({ filterDropdownVisible: true })]);
        render(() => <Table columns={columnsSignal()} dataSource={rows} pagination={false} />);
        expect(await screen.findByText('only Ann')).toBeInTheDocument();
        setColumns([column()]);
        await waitFor(() => expect(menuShown()).not.toBeInTheDocument());
        await userEvent.click(query(`.${P}-column-filter`));
        await waitFor(() => expect(menuShown()).toBeInTheDocument());
        await userEvent.click(document.body);
        await waitFor(() => expect(menuShown()).not.toBeInTheDocument());
    });
});

describe('Table expandRowByClick 只作用于可展开的行', () => {
    const columns: ColumnProps[] = [{ title: 'Name', dataIndex: 'name' }];

    it('rowExpandable 为假的行点击不展开，不触发 onExpand', async () => {
        const onExpand = vi.fn<NonNullable<TableProps['onExpand']>>();
        const rows = [
            { key: '1', name: 'Ann' },
            { key: '2', name: 'Bob' },
        ];
        render(() => <Table columns={columns} dataSource={rows} expandRowByClick pagination={false} rowExpandable={(record) => record?.key !== '2'} expandedRowRender={(record) => `detail ${record?.name}`} onExpand={onExpand} />);
        await userEvent.click(screen.getByText('Bob'));
        expect(onExpand).not.toHaveBeenCalled();
        expect(screen.queryByText('detail Bob')).not.toBeInTheDocument();
        await userEvent.click(screen.getByText('Ann'));
        expect(onExpand).toHaveBeenCalledTimes(1);
    });

    it('树形数据的叶子行点击不触发 onExpand', async () => {
        const onExpand = vi.fn<NonNullable<TableProps['onExpand']>>();
        render(() => <Table columns={columns} dataSource={[{ key: 'p', name: 'parent', children: [{ key: 'c', name: 'child' }] }]} defaultExpandAllRows expandRowByClick pagination={false} onExpand={onExpand} />);
        await userEvent.click(screen.getByText('child'));
        expect(onExpand).not.toHaveBeenCalled();
    });
});

describe('Table scrollToFirstRowOnChange 与 pagination.onChange', () => {
    it('传了 pagination.onChange 时只复位滚动，翻页交给使用方，不调用 Table 的 onChange', async () => {
        const onPageChange = vi.fn<(currentPage: number, pageSize: number) => void>();
        const onChange = vi.fn<TableChange>();
        const { container } = render(() => <Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={getData(25)} pagination={{ pageSize: 10, onChange: onPageChange }} scroll={{ y: 200, scrollToFirstRowOnChange: true }} onChange={onChange} />);
        const body = container.querySelector(`.${P}-body`) as HTMLElement;
        body.scrollTop = 50;
        await clickPage(2);
        expect(onPageChange).toHaveBeenCalledWith(2, 10);
        expect(onChange).not.toHaveBeenCalled();
        expect(getFirstCellText()).toBe('Edward King 0');
        expect(body.scrollTop).toBe(0);
    });
});

describe('Table showHeader 为 false 且表头拆分', () => {
    it('隐藏的表头 inert，排序按钮不可聚焦，也不暴露给辅助技术', () => {
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name', width: 200, sorter: (a, b) => a.name.localeCompare(b.name) }]} dataSource={getData(3)} pagination={false} rowSelection={{}} scroll={{ y: 300 }} showHeader={false} />);
        // Solid writes inert as a property, which jsdom neither reflects nor applies; the browser test checks the Tab order
        const header = query(`.${P}-header`);
        expect(header.inert).toBe(true);
        expect(header.contains(screen.getByRole('button', { name: 'Name' }))).toBe(true);
    });
});

describe('Table 为 0 的 key', () => {
    it('列 key 为 0 时表头单元格与其他列并存', () => {
        render(() => (
            <Table
                columns={[
                    { key: 1, title: 'A', render: () => 'a' },
                    { key: 0, title: 'B', render: () => 'b' },
                ]}
                dataSource={[{ key: '1' }]}
                pagination={false}
            />
        ));
        expect(screen.getAllByRole('columnheader')).toHaveLength(2);
        expect(queryAll(`.${P}-col`)).toHaveLength(2);
    });
});

describe('Table 使用方的 class 与内部类名合并', () => {
    it('列 onCell 返回的 class 与单元格的内部类名并存', () => {
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name', onCell: () => ({ class: 'mine' }) }]} dataSource={[{ key: '1', name: 'Ann' }]} pagination={false} />);
        expect(screen.getByRole('cell', { name: 'Ann' })).toHaveClass('mine', `${P}-row-cell`);
    });

    it('filterDropdownProps.class 与筛选菜单的内部类名并存', async () => {
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name', filters: [{ text: 'only Ann', value: 'Ann' }], onFilter: () => true, filterDropdownProps: { class: 'mine' } }]} dataSource={[{ key: '1', name: 'Ann' }]} pagination={false} />);
        await userEvent.click(query(`.${P}-column-filter`));
        await screen.findByText('only Ann');
        expect(query(`.${P}-column-filter-dropdown`)).toHaveClass('mine');
    });
});

describe('Table 只有选择列固定', () => {
    it('写入表格可视宽度，表格按固定布局', () => {
        const { container } = render(() => <Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={[{ key: '1', name: 'Ann' }]} pagination={false} rowSelection={{ fixed: true }} />);
        expect((container.querySelector(`.${P}-wrapper`) as HTMLElement).style.getPropertyValue('--semi-table-section-width')).not.toBe('');
        expect(container.querySelector('table')).toHaveClass(`${P}-fixed`);
    });
});

describe('Table 行不随无关更新重新挂载', () => {
    it('筛选不改变选项时，表头单元格与打开的筛选菜单保留', async () => {
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: (value, record) => record.name === value,
                renderFilterDropdown: (props) => (
                    <button type="button" onClick={() => props?.confirm({ filteredValue: ['Ann'], closeDropdown: false })}>
                        keep open
                    </button>
                ),
            },
        ];
        render(() => (
            <Table
                columns={columns}
                dataSource={[
                    { key: '1', name: 'Ann' },
                    { key: '2', name: 'Bob' },
                ]}
                pagination={false}
            />
        ));
        const th = screen.getByRole('columnheader', { name: /Name/ });
        await userEvent.click(query(`.${P}-column-filter`));
        await userEvent.click(await screen.findByText('keep open'));
        expect(getBodyRows()).toHaveLength(1);
        expect(th.isConnected).toBe(true);
        expect(screen.getByText('keep open')).toBeInTheDocument();
        expect(query(`.${P}-column-filter`)).toHaveAttribute('aria-expanded', 'true');
    });

    it('收起前面的行时，后面行的单元格不重新挂载', async () => {
        const mounts = vi.fn<(name: string) => void>();
        function Name(props: { name: string }) {
            onMount(() => mounts(props.name));
            return <span>{props.name}</span>;
        }
        const data = [
            { key: '1', name: 'parent', children: [{ key: '1-1', name: 'child' }] },
            { key: '2', name: 'other' },
        ];
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name', render: (text) => <Name name={text} /> }]} dataSource={data} defaultExpandAllRows pagination={false} />);
        mounts.mockClear();
        await userEvent.click(query(`.${P}-tbody .${P}-expand-icon`));
        expect(screen.queryByText('child')).not.toBeInTheDocument();
        expect(screen.getByText('other')).toBeInTheDocument();
        expect(mounts).not.toHaveBeenCalled();
    });

    it('翻页时 title 与 footer 的节点保留', async () => {
        render(() => <Table title={<input aria-label="title input" />} columns={getColumns()} dataSource={getData(46)} footer={<input aria-label="footer input" />} />);
        const titleInput = screen.getByLabelText('title input');
        const footerInput = screen.getByLabelText('footer input');
        await clickPage(2);
        expect(getFirstCellText()).toBe('Edward King 10');
        expect(screen.getByLabelText('title input')).toBe(titleInput);
        expect(screen.getByLabelText('footer input')).toBe(footerInput);
    });
});

describe('Table 列位置与展开行', () => {
    it('选择列与展开列 fixed 为 right 时排在最后', () => {
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name', width: 200 }]} dataSource={[{ key: '1', name: 'Ann' }]} expandCellFixed="right" hideExpandedColumn={false} pagination={false} rowSelection={{ fixed: 'right' }} expandedRowRender={() => 'detail'} />);
        const headers = screen.getAllByRole('columnheader');
        expect(headers[0]).toHaveTextContent('Name');
        expect(within(headers.at(-1) as HTMLElement).getByRole('checkbox')).toBeInTheDocument();
    });

    it('rowExpandable 为假的行没有展开行，展开行以 expanded 为 true 渲染', () => {
        const expandedRowRender = vi.fn<NonNullable<TableProps['expandedRowRender']>>(() => 'detail');
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name', width: 200 }]} dataSource={getData(3)} defaultExpandAllRows pagination={false} rowExpandable={(record) => record.key !== '1'} expandedRowRender={expandedRowRender} />);
        expect(query('[data-row-key="0-expanded-row"]')).toBeInTheDocument();
        expect(query('[data-row-key="1-expanded-row"]')).toBeNull();
        expect(expandedRowRender).toHaveBeenCalled();
        expect(expandedRowRender.mock.calls.every(([record, , expanded]) => record.key !== '1' && expanded === true)).toBe(true);
    });

    it('onCell 返回 rowSpan 为 0 时跳过该单元格', () => {
        const columns: ColumnProps[] = [{ title: 'Name', dataIndex: 'name', onCell: (_record, index) => (index === 0 ? { rowSpan: 2 } : { rowSpan: 0 }) }];
        render(() => (
            <Table
                columns={columns}
                dataSource={[
                    { key: '1', name: 'Ann' },
                    { key: '2', name: 'Bob' },
                ]}
                pagination={false}
            />
        ));
        expect(screen.getByText('Ann').closest('td')).toHaveAttribute('rowspan', '2');
        expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });

    it('自定义筛选项带子项时，悬停打开子菜单', async () => {
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: () => true,
                filters: [{ text: 'G1', value: 'g1', children: [{ text: 'a', value: 'a' }] }],
                renderFilterDropdownItem: (item) => <li>{item.text}</li>,
            },
        ];
        render(() => <Table columns={columns} dataSource={[{ key: '1', name: 'Ann' }]} pagination={false} />);
        await userEvent.click(query(`.${P}-thead .${P}-column-filter`));
        await userEvent.hover(await screen.findByText('G1'));
        expect(await screen.findByText('a')).toBeInTheDocument();
    });
});

describe('Table 列 sortIcon', () => {
    it('sortIcon 函数收到实时的 sortOrder，随点击表头更新', async () => {
        const columns: ColumnProps[] = [{ title: 'Name', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name), sortIcon: (icon) => <i data-testid="sort-icon">{String(icon.sortOrder)}</i> }];
        render(() => <Table columns={columns} dataSource={[{ key: '1', name: 'b' }]} pagination={false} />);
        expect(screen.getByTestId('sort-icon')).toHaveTextContent('false');
        await userEvent.click(screen.getByTestId('sort-icon'));
        await waitFor(() => expect(screen.getByTestId('sort-icon')).toHaveTextContent('ascend'));
        expect(document.querySelector(`.${P}-column-sorter`)).toBeNull();
    });
});

describe('Table rowSelection.renderCell', () => {
    const rows = [
        { key: 1, name: 'Ann' },
        { key: 2, name: 'Bob' },
    ];

    it('行单元格与表头单元格收到实时的选中、禁用、半选状态，并能通过 selectRow、selectAll 修改选择', async () => {
        const onChange = vi.fn<SelectionChange>();
        const renderCell: NonNullable<RowSelectionConfig['renderCell']> = (cell) => (
            <button
                aria-label="select"
                data-testid={cell.inHeader ? 'cell-header' : `cell-${cell.index}`}
                data-selected={String(cell.selected)}
                data-indeterminate={String(cell.indeterminate)}
                data-disabled={String(cell.disabled)}
                data-record={cell.record?.name}
                onClick={(e) => (cell.inHeader ? cell.selectAll?.(!cell.selected, e) : cell.selectRow?.(!cell.selected, e))}
            />
        );
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={rows} pagination={false} rowSelection={{ renderCell, disabled: true, onChange }} />);
        const header = screen.getByTestId('cell-header');
        expect(header.dataset).toMatchObject({ selected: 'false', indeterminate: 'false', disabled: 'true' });
        expect(header).not.toHaveAttribute('data-record');
        expect(screen.getByTestId('cell-0').dataset).toMatchObject({ selected: 'false', record: 'Ann' });
        expect(screen.getByTestId('cell-1').dataset).toMatchObject({ record: 'Bob' });

        await userEvent.click(screen.getByTestId('cell-0'));
        expect(onChange.mock.lastCall?.[0]).toEqual([1]);
        expect(screen.getByTestId('cell-0')).toHaveAttribute('data-selected', 'true');
        expect(screen.getByTestId('cell-header')).toHaveAttribute('data-indeterminate', 'true');

        await userEvent.click(screen.getByTestId('cell-header'));
        expect(onChange.mock.lastCall?.[0]).toEqual([1, 2]);
        expect(screen.getByTestId('cell-header')).toHaveAttribute('data-selected', 'true');
    });
});
