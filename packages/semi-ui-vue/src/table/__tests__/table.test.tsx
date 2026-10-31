/** @jsxImportSource vue */
import { defineComponent, nextTick, reactive, shallowReactive, shallowRef, type VNode } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor, within } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { numbers } from '@fibrae/semi-foundation/table/constants';
import { getData, getNestData, getRandomNumber, render } from '@test/utils/vue';
import Table, { TableColumn, type ColumnProps, type TableCellSlotProps, type TableHandle, type TableHeaderCellSlotProps, type TableRowAttrs, type TableTitleSlotProps } from '..';
import type { VirtualListScrollArgs } from '../../_base/virtual-list.vue';
import semiGlobal from '../../_utils/semi-global';
import { Col } from '../../grid';
import AsyncData from './fixtures/async-data.vue';
import KeyedColumns from './fixtures/keyed-columns.vue';
import ShorthandColumns from './fixtures/shorthand-columns.vue';
import SlotPrecedence from './fixtures/slot-precedence.vue';
import ToggleColumns from './fixtures/toggle-columns.vue';

const P = `${BASE_CLASS_PREFIX}-table`;

type Row = Record<string, any>;
type Slots = Record<string, (...args: any[]) => unknown>;

const data = getData(46);

const queryAll = (selector: string) => Array.from(document.querySelectorAll<HTMLElement>(selector));
const getBodyRows = () => queryAll(`.${P}-tbody .${P}-row`);
const getHeads = () => queryAll(`.${P}-thead .${P}-row-head`);
const rowKeys = () => getBodyRows().map((row) => row.getAttribute('data-row-key'));
const cellTexts = (row: Element) => Array.from(row.children, (cell) => cell.textContent);
const headTexts = () => getHeads().map((head) => head.textContent);

const getColumns = (): ColumnProps[] => [
    { title: 'Name', dataIndex: 'name', width: 150, fixed: 'left' },
    { title: 'Age', dataIndex: 'age', width: 150 },
    { title: 'Description', dataIndex: 'description' },
    { title: 'Address', dataIndex: 'address' },
    { key: 'operate', width: 150, fixed: 'right' },
];

const columnNodes = () => (
    <>
        <TableColumn title="Name" dataIndex="name" width={150} />
        <TableColumn title="Age" dataIndex="age" width={150} />
        <TableColumn title="Address" dataIndex="address" />
        <TableColumn width={150}>{{ cell: ({ record }: TableCellSlotProps) => [<span>{record.description}</span>] }}</TableColumn>
    </>
);

const getNestColumns = (): ColumnProps[] => [
    {
        title: 'Base Information',
        fixed: 'left',
        children: [
            { title: 'Name', dataIndex: 'name', fixed: 'left', width: 200 },
            { title: 'Age', dataIndex: 'age', fixed: 'left', width: 100 },
        ],
    },
    {
        title: 'Company Information',
        children: [
            { title: 'Company Name', dataIndex: 'company.name' },
            { title: 'Company Address', dataIndex: 'company.address' },
        ],
    },
    { title: 'Address', width: 250, dataIndex: 'address', fixed: 'right' },
];

const smallData = () => [
    { key: '1', name: 'b', age: 2 },
    { key: '2', name: 'a', age: 1 },
    { key: '3', name: 'c', age: 3 },
];

function mountTable(props: Record<string, unknown>, slots: Slots = {}) {
    const state = shallowReactive({ props, slots });
    const handle = shallowRef<TableHandle | null>(null);
    const result = render(
        defineComponent(() => () => (
            <Table {...state.props} ref={handle}>
                {state.slots}
            </Table>
        ))
    );
    return {
        container: result.container,
        unmount: () => result.unmount(),
        handle: () => handle.value as TableHandle,
        update: async (next: { props?: Record<string, unknown>; slots?: Slots }) => {
            state.props = { ...state.props, ...next.props };
            state.slots = { ...(next.slots ?? state.slots) };
            await nextTick();
        },
    };
}

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('Table', () => {
    const myCls = 'my-tr-class';
    const myClsIndex = 2;
    const rowClass = () =>
        vi.fn<(record: Row, index: number) => TableRowAttrs>((_record, index) => ({
            class: index === myClsIndex ? myCls : '',
        }));
    const expectAppearance = (onRow: ReturnType<typeof rowClass>) => {
        expect(queryAll(`.${P}-wrapper`)).toHaveLength(1);
        expect(queryAll(`.${P}-title`)).toHaveLength(1);
        expect(queryAll(`.${P}-footer`)).toHaveLength(1);
        expect(onRow).toHaveBeenCalled();
        const rows = getBodyRows();
        expect(rows).toHaveLength(10);
        expect(rows[0]).not.toHaveClass(myCls);
        expect(rows.findLastIndex((row) => row.classList.contains(myCls))).toBe(myClsIndex);
    };

    it('JSX 列的外观', async () => {
        const onRow = rowClass();
        const { update } = mountTable({ title: 'Table Title', footer: 'Table Footer', dataSource: data, onRow }, { default: columnNodes });
        expectAppearance(onRow);
        await update({ slots: { default: columnNodes } });
        expectAppearance(onRow);
    });

    it('对象列的外观', async () => {
        const onRow = rowClass();
        const { update } = mountTable({
            title: 'Table Title',
            footer: 'Table Footer',
            columns: getColumns(),
            dataSource: data,
            onRow,
        });
        expectAppearance(onRow);
        await update({ props: { columns: getColumns() } });
        expectAppearance(onRow);
    });

    it('dataSource 变化后的外观', async () => {
        const onRow = rowClass();
        const { update } = mountTable({
            title: 'Table Title',
            footer: 'Table Footer',
            columns: getColumns(),
            dataSource: getData(25),
            onRow,
        });
        expectAppearance(onRow);
        await update({ props: { dataSource: getData(getRandomNumber(100, 40)) } });
        expectAppearance(onRow);
    });

    it('受控的 dataSource 和 columns', async () => {
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                width: 150,
                filters: [
                    { text: '名字包含"1"', value: '1' },
                    { text: '名字包含"2"', value: '2' },
                ],
                onFilter: (value, record) => record.name.includes(value),
            },
            { title: 'Age', dataIndex: 'age', width: 150, sorter: true },
            { title: 'Address', dataIndex: 'address' },
        ];
        const pagination = { currentPage: 1, total: data.length, pageSize: 10 };
        const { update, handle } = mountTable({ columns, dataSource: data.slice(0, 10), pagination });
        expect(rowKeys()).toEqual(data.slice(0, 10).map((record) => record.key));
        await update({
            props: {
                columns: [...columns],
                dataSource: data.slice(10, 20),
                pagination: { ...pagination, currentPage: 2 },
            },
        });
        expect(rowKeys()).toEqual(data.slice(10, 20).map((record) => record.key));
        expect(handle().getCurrentPageData().dataSource).toHaveLength(10);
    });

    it('JSX 异步数据', async () => {
        const asyncData = [
            { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park' },
            { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
            { key: '3', name: 'Joe Black', age: 32, address: 'Sidney No. 1 Lake Park' },
            { key: '4', name: 'Michael James', age: 99, address: 'Sidney No. 1 Lake Park' },
        ];
        const view = render(AsyncData, { props: { dataSource: [] } });
        await view.rerender({ dataSource: asyncData });
        expect(getHeads()).toHaveLength(3);
        expect(rowKeys()).toEqual(['1', '2', '3', '4']);
        expect(screen.getByRole('link', { name: 'John Brown' })).toHaveAttribute('href', 'https://semi.design');
    });

    it('单元格对齐', () => {
        mountTable({ columns: getColumns().map((column) => ({ ...column, align: 'right' })), dataSource: data });
        expect(queryAll(`.${P}-align-right`).length).toBeGreaterThan(0);
        const cells = queryAll(`.${P}-row-cell`);
        expect(cells.length).toBeGreaterThan(0);
        for (const cell of cells) {
            expect(cell).toHaveStyle({ textAlign: 'right' });
        }
    });

    it('列 class', () => {
        mountTable({ columns: getColumns().map((column) => ({ ...column, class: 'test' })), dataSource: data });
        const heads = queryAll(`.${P}-row-head`);
        const cells = queryAll(`.${P}-row-cell`);
        expect(heads.length).toBeGreaterThan(0);
        expect(cells.length).toBeGreaterThan(0);
        for (const cell of [...heads, ...cells]) {
            expect(cell).toHaveClass('test');
        }
    });

    it('表头外观', async () => {
        const { unmount } = mountTable({ columns: getColumns(), dataSource: data, scroll: { y: 500 } });
        expect(queryAll(`.${P}-thead`)).toHaveLength(1);
        unmount();

        const { update } = mountTable({ dataSource: data }, { default: columnNodes });
        expect(queryAll(`.${P}-thead`)).toHaveLength(1);
        await update({ props: { showHeader: false } });
        expect(queryAll(`.${P}-thead`)).toHaveLength(0);
    });

    it('ref 的 getCurrentPageData', () => {
        const pageSize = 10;
        const objectTable = mountTable({ columns: getColumns(), dataSource: data, pagination: { pageSize } });
        const { dataSource } = objectTable.handle().getCurrentPageData();
        expect(dataSource).toEqual(data.slice(0, pageSize));
        expect(dataSource?.[0]).not.toBe(data[0]);
        expect(objectTable.handle()).toMatchObject({
            getCurrentPageData: expect.any(Function),
            scrollTo: expect.any(Function),
            scrollToItem: expect.any(Function),
        });

        const slotTable = mountTable({ dataSource: data, pagination: { pageSize } }, { default: columnNodes });
        expect(slotTable.handle().getCurrentPageData().dataSource).toHaveLength(pageSize);
    });

    it('render expandIcon', () => {
        const cell = vi.fn<(props: TableCellSlotProps) => VNode[]>(({ expandIcon, text }) => [
            <span class="with-icon">
                {expandIcon}
                {text}
            </span>,
        ]);
        mountTable({ columns: [{ title: 'Name', dataIndex: 'name' }], dataSource: getData(3), pagination: false }, { cell, expandedRow: ({ record }: { record: Row }) => [<div>{record.description}</div>] });
        expect(queryAll('.with-icon')).toHaveLength(3);
        expect(cell.mock.calls.every(([props]) => 'expandIcon' in props)).toBe(true);
    });

    it('onRow / onCell', async () => {
        const onCellClick = vi.fn<(event: MouseEvent) => void>();
        const onHeaderCellClick = vi.fn<(event: MouseEvent) => void>();
        const onHeaderRowClick = vi.fn<(event: MouseEvent) => void>();
        const columns = getColumns().map((column, index) => {
            const style = index === 0 ? { width: '200px', height: '60px' } : {};
            return {
                ...column,
                onCell: () => ({ onClick: onCellClick, style }),
                onHeaderCell: () => ({ onClick: onHeaderCellClick, style }),
            };
        });
        mountTable({
            columns,
            dataSource: data,
            onHeaderRow: () => ({ class: 'test-row', onClick: onHeaderRowClick }),
        });
        const cells = queryAll(`.${P}-body .${P}-row-cell`);
        const heads = getHeads();
        expect(cells[0]).toHaveStyle({ width: '200px', height: '60px' });
        expect(heads[0]).toHaveStyle({ width: '200px', height: '60px' });
        await fireEvent.click(cells[0]);
        expect(onCellClick).toHaveBeenCalledTimes(1);
        await fireEvent.click(heads[0]);
        expect(onHeaderCellClick).toHaveBeenCalledTimes(1);
        const headerRow = document.querySelector(`.${P}-thead .${P}-row`);
        expect(headerRow).toHaveClass('test-row');
        expect(onHeaderRowClick).toHaveBeenCalledTimes(1);
    });

    it('表头合并', () => {
        const expectMerged = (container: Element) => {
            const [firstRow, secondRow] = Array.from(container.querySelectorAll(`.${P}-thead .${P}-row`));
            expect(container.querySelectorAll(`.${P}-thead .${P}-row`)).toHaveLength(2);
            const spans = (row: Element) => Array.from(row.children as HTMLCollectionOf<HTMLTableCellElement>, (cell) => [cell.colSpan, cell.rowSpan]);
            expect(spans(firstRow)).toEqual([
                [2, 1],
                [2, 1],
                [1, 2],
            ]);
            expect(spans(secondRow).map(([colSpan]) => colSpan)).toEqual([1, 1, 1, 1]);
        };
        const nestData = getNestData();
        const { container: slotContainer } = mountTable(
            { dataSource: nestData },
            {
                default: () => (
                    <>
                        <TableColumn title="Base Information" fixed="left">
                            {{
                                default: () => (
                                    <>
                                        <TableColumn title="Name" dataIndex="name" fixed="left" width={200} />
                                        <TableColumn title="Age" dataIndex="age" fixed="left" width={100} />
                                    </>
                                ),
                            }}
                        </TableColumn>
                        <TableColumn title="Company Information">
                            {{
                                default: () => (
                                    <>
                                        <TableColumn title="Company Name" dataIndex="company.name" />
                                        <TableColumn title="Company Address" dataIndex="company.address" />
                                    </>
                                ),
                            }}
                        </TableColumn>
                        <TableColumn title="Address" dataIndex="address" fixed="right" width={250} />
                    </>
                ),
            }
        );
        const { container } = mountTable({ columns: getNestColumns(), dataSource: nestData });
        expectMerged(slotContainer);
        expectMerged(container);
    });

    it('没有 columns', () => {
        const { container: slotContainer } = mountTable({ dataSource: data });
        const { container } = mountTable({ columns: [], dataSource: data });
        for (const root of [slotContainer, container]) {
            expect(root.querySelectorAll(`.${P}-row-head`)).toHaveLength(0);
            expect(root.querySelectorAll(`.${P}-row-cell`)).toHaveLength(0);
        }
    });

    it('useFullRender', () => {
        const cell = vi.fn<(props: TableCellSlotProps) => VNode[]>(({ column, text, expandIcon, selection, indentText }) =>
            column.useFullRender
                ? [
                      <span class="custom-render">
                          {indentText}
                          {expandIcon}
                          {selection}
                          <span>{text}</span>
                      </span>,
                  ]
                : []
        );
        mountTable(
            {
                columns: [
                    { title: 'Name', dataIndex: 'name', width: 250, useFullRender: true },
                    { title: 'Age', dataIndex: 'age' },
                ],
                dataSource: getData(2),
                pagination: false,
                rowSelection: { hidden: true, fixed: 'left' },
            },
            { cell, expandedRow: ({ record }: { record: Row }) => [<article>{record.description}</article>] }
        );
        const [first] = getBodyRows();
        expect(first.children[0].children).toHaveLength(1);
        expect(first.children[0].firstElementChild).toHaveClass('custom-render');
        expect(cellTexts(first)).toEqual(['Edward King 0', '0']);
        expect(cell.mock.calls[0][0]).toEqual(expect.objectContaining({ text: 'Edward King 0', index: 0, indentText: null }));
        expect(first.querySelector(`.custom-render .${P}-selection-wrap`)).not.toBeNull();
        expect(first.querySelector(`.custom-render .${P}-expand-icon`)).not.toBeNull();
        expect(cell.mock.calls.every(([props]) => 'expandIcon' in props)).toBe(true);
    });

    it('对象 columns 与 children', () => {
        const columns = getColumns();
        mountTable({ columns, dataSource: data }, { default: () => [<TableColumn key="age" title="Age" dataIndex="age" />] });
        expect(headTexts()).toEqual(columns.map((column) => column.title ?? ''));
    });

    it('columns 为空数组时忽略 children，并给出开发警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const { container } = mountTable({ columns: [], dataSource: data }, { default: () => [<TableColumn title="Age" dataIndex="age" />] });
        expect(container.querySelectorAll(`.${P}-row-head`)).toHaveLength(0);
        expect(container.querySelectorAll(`.${P}-row-cell`)).toHaveLength(0);
        expect(warn.mock.calls.flat().join('\n')).toContain('columns should not given by object and children');
    });

    it('表头 colSpan', () => {
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name' },
            { title: 'Age', dataIndex: 'age' },
            { title: 'Home phone', colSpan: 2, dataIndex: 'tel' },
            { title: 'Phone', colSpan: 0, dataIndex: 'phone' },
            { title: 'Address', dataIndex: 'address' },
        ];
        const phoneData = [
            { key: '1', name: 'ZhangSan', age: 50, tel: '010-20000000', phone: 10010, address: 'BeiJing' },
            { key: '2', name: 'LiSi', age: 40, tel: '010-30000000', phone: 10086, address: 'ShangHai' },
        ];
        mountTable({ columns, dataSource: phoneData });
        expect(queryAll(`.${P}-row .${P}-row-head`)).toHaveLength(columns.length - 1);
    });
});

describe('Table 回归用例', () => {
    const getFileData = (total: number) =>
        Array.from({ length: total }, (_, i) => ({
            key: `${i}`,
            name: i % 2 === 0 ? `Semi Design 设计稿${i}.fig` : `Semi Pro 设计稿${i}.fig`,
            size: (i * 1000) % 199,
        }));

    it('FixRenderReturnProps：固定列上应用 onCell 返回的 rowSpan', () => {
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                width: 200,
                fixed: true,
                onCell: (_record, index) => (index === 0 ? { rowSpan: 2 } : index === 1 ? { rowSpan: 0 } : {}),
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
        mountTable(
            { columns, dataSource: phoneData },
            {
                cell: ({ column, text }: TableCellSlotProps) => (column.dataIndex === 'name' ? [<a href="https://semi.design">{text}</a>] : []),
            }
        );
        const rows = getBodyRows();
        expect(rows[0].children[0]).toHaveAttribute('rowspan', '2');
        expect(rows[0].children[0]).toHaveClass(`${P}-cell-fixed-left`);
        expect(rows[0].children[0].querySelector('a')).toHaveTextContent('John Brown');
        expect(cellTexts(rows[1])).toEqual(['42', '0571-22098333', '18889898888']);
        expect(cellTexts(rows[2])).toEqual(['Joe Black', '32', '0575-22098909', '18900010002']);
        expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
    });

    it('fix #619：重新渲染后保留嵌套列的分组表头', async () => {
        const groups = [
            { title: 'Base Information', children: ['name', 'age'] },
            { title: 'Company Information', children: ['company.name', 'company.address'] },
        ];
        const record = { key: '0', name: 'Edward', age: 1, company: { name: 'ByteDance', address: 'Zhichun Road' } };
        const renderChildren = () => [
            ...groups.map((group, groupIndex) => (
                <TableColumn key={groupIndex} title={group.title}>
                    {{
                        default: () => group.children.map((dataIndex) => <TableColumn key={dataIndex} title={dataIndex} dataIndex={dataIndex} />),
                    }}
                </TableColumn>
            )),
            <TableColumn key="lastColumn" title="">
                {{
                    cell: () => [<span>123</span>],
                }}
            </TableColumn>,
        ];
        const { update } = mountTable({ dataSource: [record] }, { default: renderChildren });
        await update({ slots: { default: renderChildren } });
        expect(queryAll(`.${P}-thead .${P}-row`)).toHaveLength(2);
        expect(screen.getByText('Base Information').closest('th')).toHaveAttribute('colspan', '2');
        expect(screen.getByText('Company Information').closest('th')).toHaveAttribute('colspan', '2');
        expect(cellTexts(getBodyRows()[0])).toEqual(['Edward', '1', 'ByteDance', 'Zhichun Road', '123']);
    });

    it('fix #849：表头由 scroll.y 固定时 onHeaderRow 正常工作', async () => {
        const onHeaderRowClick = vi.fn<(event: MouseEvent) => void>();
        mountTable({
            columns: [
                { title: '标题', dataIndex: 'name', fixed: true, width: 250 },
                { title: '大小', dataIndex: 'size', width: 200 },
                { title: '', dataIndex: 'operate', fixed: 'right', width: 100 },
            ],
            dataSource: getFileData(46),
            rowSelection: { fixed: true },
            scroll: { y: 300, x: 1200 },
            onHeaderRow: () => ({ onClick: onHeaderRowClick, class: 'test-header-row' }),
        });
        const headerRow = screen.getByText('标题').closest('tr');
        expect(headerRow?.closest(`.${P}-header`)).not.toBeNull();
        expect(headerRow).toHaveClass('test-header-row');
        await userEvent.click(screen.getByText('标题'));
        expect(onHeaderRowClick).toHaveBeenCalledTimes(1);
    });

    it('全局注册 Table 时内部的 table 元素不解析为 Table 组件', () => {
        const columns = [{ title: 'Name', dataIndex: 'name' }];
        render(Table, { props: { columns, dataSource: smallData() }, global: { components: { Table } } });
        render(Table, { props: { columns, dataSource: smallData(), scroll: { y: 300 } }, global: { components: { Table } } });
        expect(queryAll(`table.${P}`)).toHaveLength(3);
    });

    it('全局注册 Col 时 colgroup 里渲染原生 col', () => {
        const columns = [{ title: 'Name', dataIndex: 'name', width: 100 }];
        render(Table, { props: { columns, dataSource: smallData() }, global: { components: { Col } } });
        render(Table, { props: { columns, dataSource: smallData(), scroll: { y: 300 } }, global: { components: { Col } } });
        expect(queryAll(`colgroup > col.${P}-col`)).toHaveLength(3);
        expect(queryAll(`.${P}-colgroup div`)).toHaveLength(0);
    });

    it('dataSource 变化后 Table 只更新一轮', async () => {
        const title = vi.fn<(props: TableTitleSlotProps) => string[]>(() => ['Files']);
        const table = mountTable({ columns: [{ title: 'Name', dataIndex: 'name' }], dataSource: smallData() }, { title });
        title.mockClear();
        await table.update({ props: { dataSource: smallData().slice(0, 2) } });
        expect(getBodyRows()).toHaveLength(2);
        expect(title).toHaveBeenCalledTimes(1);
    });
});

describe('Table 行为基线', () => {
    const getNames = () => getBodyRows().map((row) => row.querySelector(`.${P}-row-cell`)?.textContent);

    it('固定列和固定表头获得 sticky 偏移，表体滚动同步到表头', async () => {
        const { container } = mountTable({
            columns: getColumns(),
            dataSource: getData(3),
            pagination: false,
            scroll: { x: 1200, y: 300 },
        });
        expect(container.querySelector(`.${P}-wrapper`)).toHaveAttribute('data-column-fixed', 'true');
        expect(container.querySelector(`.${P}-header`)).toBeInTheDocument();
        const body = container.querySelector(`.${P}-body`) as HTMLElement;
        expect(body).toHaveStyle({ maxHeight: '300px' });
        await nextTick();
        const heads = getHeads();
        expect(heads[0]).toHaveStyle({ position: 'sticky', left: '0px' });
        expect(heads[heads.length - 1]).toHaveStyle({ position: 'sticky', right: '0px' });
        Object.defineProperty(body, 'scrollLeft', { value: 1200, configurable: true });
        await fireEvent.scroll(body);
        expect(container.querySelector(`.${P}-header`)?.scrollLeft).toBe(1200);
    });

    it('virtualized 只渲染一段行窗口，并通过 expose 滚动', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { handle } = mountTable({
            columns: [{ title: 'Name', dataIndex: 'name', width: 200 }],
            dataSource: getData(1000),
            pagination: false,
            scroll: { y: 300 },
            virtualized: true,
        });
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        expect(getBodyRows().length).toBeLessThan(1000);
        handle().scrollTo(0);
        handle().scrollToItem(0);
        expect(warn).not.toHaveBeenCalled();
    });

    it('virtualized.itemSize 变化后按新行高重新排布', async () => {
        const { container, update } = mountTable({
            columns: [{ title: 'Name', dataIndex: 'name', width: 200 }],
            dataSource: getData(100),
            pagination: false,
            scroll: { y: 300 },
            virtualized: { itemSize: 50 },
        });
        const rowGroup = () => container.querySelector(`.${P}-body .${P}-tbody`) as HTMLElement;
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        expect(rowGroup()).toHaveStyle({ height: '5000px' });
        await update({ props: { virtualized: { itemSize: 80 } } });
        await waitFor(() => expect(rowGroup()).toHaveStyle({ height: '8000px' }));
        expect(getBodyRows()[1]).toHaveStyle({ top: '80px', height: '80px' });
    });

    it('virtualized 关闭再打开后，虚拟表体横向滚动仍同步到表头', async () => {
        const { container, update } = mountTable({
            columns: getColumns(),
            dataSource: getData(50),
            pagination: false,
            scroll: { x: 1200, y: 300 },
            virtualized: true,
        });
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        await update({ props: { virtualized: false } });
        await update({ props: { virtualized: true } });
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        const body = container.querySelector(`.${P}-body`) as HTMLElement;
        Object.defineProperty(body, 'scrollLeft', { value: 600, configurable: true });
        await fireEvent.scroll(body);
        expect(container.querySelector(`.${P}-header`)?.scrollLeft).toBe(600);
    });

    it('sticky 表头使用顶部偏移', () => {
        mountTable({ columns: getColumns(), dataSource: getData(3), pagination: false, sticky: { top: 20 } });
        const header = document.querySelector(`.${P}-header`);
        expect(header).toHaveClass(`${P}-header-sticky`);
        expect(header).toHaveStyle({ top: '20px' });
    });

    it('渲染 #empty 插槽和加载 spin', () => {
        mountTable({ columns: getColumns(), dataSource: [], loading: true }, { empty: () => [<span>nothing here</span>] });
        expect(screen.getByText('nothing here')).toBeInTheDocument();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-spin`)).not.toHaveClass(`${BASE_CLASS_PREFIX}-spin-hidden`);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-spin-wrapper`)).toBeInTheDocument();
    });

    it('id、class、style 和 data-* 落在根元素上', () => {
        mountTable({
            id: 't1',
            class: 'mine',
            style: { color: 'red' },
            'data-testid': 'table-root',
            columns: getColumns(),
            dataSource: getData(3),
        });
        const root = screen.getByTestId('table-root');
        expect(root).toHaveClass(`${P}-wrapper`, 'mine');
        expect(root).toHaveAttribute('id', 't1');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('从 semiGlobal.config.overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Table: { size: 'small', bordered: true } };
        mountTable({ columns: getColumns(), dataSource: getData(3) });
        expect(document.querySelector(`.${P}-small`)).toHaveClass(`${P}-bordered`);
    });

    it('props 的默认值声明在对外的 Table 上，文档生成从这里读取', () => {
        const declared = (Table as unknown as { props: Record<string, { default?: unknown }> }).props;
        const withDefault = Object.keys(declared).filter((name) => 'default' in declared[name]);
        expect(withDefault).toEqual(expect.arrayContaining(['bordered', 'childrenRecordName', 'dataSource', 'indentSize', 'pagination', 'prefixCls', 'showHeader', 'size']));
    });

    it('通过 components 渲染自定义 body 行', () => {
        const Row = defineComponent((_props, { slots }) => () => <tr data-custom-row="">{slots.default?.()}</tr>);
        mountTable({
            columns: getColumns(),
            components: { body: { row: Row } },
            dataSource: getData(3),
            pagination: false,
        });
        expect(getBodyRows()).toHaveLength(3);
        for (const row of getBodyRows()) {
            expect(row).toHaveAttribute('data-custom-row');
        }
    });

    it('rtl 下交换固定列的侧边类名', () => {
        mountTable({ columns: getColumns(), dataSource: getData(3), direction: 'rtl', pagination: false });
        expect(document.querySelector(`.${P}-wrapper`)).toHaveAttribute('dir', 'rtl');
        expect(getHeads()[0]).toHaveClass(`${P}-cell-fixed-right`);
    });

    it('把当前页数据传给 #title 和 #footer，showHeader 为 false 时隐藏表头', () => {
        const title = vi.fn<(props: TableTitleSlotProps) => VNode[]>(() => [<span>T</span>]);
        const footer = vi.fn<(props: TableTitleSlotProps) => VNode[]>(() => [<span>F</span>]);
        mountTable({ columns: getColumns(), dataSource: getData(46), showHeader: false }, { title, footer });
        expect(title.mock.lastCall?.[0].pageData).toHaveLength(10);
        expect(footer.mock.lastCall?.[0].pageData).toHaveLength(10);
        expect(document.querySelector(`.${P}-title`)).toHaveTextContent('T');
        expect(document.querySelector(`.${P}-footer`)).toHaveTextContent('F');
        // a fixed column keeps an inert header for its widths
        expect(document.querySelector(`.${P}-thead:not([inert])`)).not.toBeInTheDocument();
    });

    it('rowSpanHover 高亮悬停的 rowSpan 单元格覆盖的所有行', async () => {
        mountTable({
            columns: [
                {
                    title: 'Name',
                    dataIndex: 'name',
                    onCell: (_record: Row, index: number) => ({ rowSpan: index === 0 ? 2 : index === 1 ? 0 : 1 }),
                },
                { title: 'Age', dataIndex: 'age' },
            ],
            dataSource: smallData(),
            pagination: false,
            rowSpanHover: true,
        });
        const rows = getBodyRows();
        await fireEvent.mouseEnter(rows[1]);
        expect(rows[0]).toHaveClass(`${P}-row-hovered`);
        expect(rows[1]).toHaveClass(`${P}-row-hovered`);
        expect(rows[2]).not.toHaveClass(`${P}-row-hovered`);
        expect(getNames()).toEqual(['b', '1', 'c']);
    });

    it('headerStyle 应用于表头单元格，列的 onHeaderCell style 优先级更高', () => {
        mountTable({
            headerStyle: { color: 'red', fontWeight: 700 },
            columns: [
                { title: 'Name', dataIndex: 'name', onHeaderCell: () => ({ style: { color: 'blue' } }) },
                { title: 'Age', dataIndex: 'age' },
            ],
            dataSource: smallData(),
            pagination: false,
        });
        const heads = getHeads();
        expect(heads[0]).toHaveStyle({ color: 'rgb(0, 0, 255)', fontWeight: '700' });
        expect(heads[1]).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });
});

describe('Table 函数组件', () => {
    it('列表挂载后才设置 scroll.y 时，观察虚拟化 body', async () => {
        const disconnect = vi.fn<() => void>();
        vi.stubGlobal(
            'ResizeObserver',
            class {
                callback: (entries: unknown[]) => void;
                constructor(callback: (entries: unknown[]) => void) {
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
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { update, unmount } = mountTable({
            columns: [{ title: 'Name', dataIndex: 'name', width: 200 }],
            dataSource: getData(100),
            pagination: false,
            sticky: true,
            virtualized: true,
        });
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        await update({ props: { scroll: { y: 300 } } });
        // the test setup gives the list 100px offsetWidth (style width 100%) and 0 clientWidth: a scrollbar
        await waitFor(() => expect(document.querySelector(`.${P}-header`)).toHaveStyle({ overflowY: 'scroll' }));
        unmount();
        expect(disconnect).toHaveBeenCalled();
    });
});

describe('Table 语义', () => {
    const treeData = [
        { key: '1', name: 'parent', children: [{ key: '1-1', name: 'child' }] },
        { key: '2', name: 'single' },
    ];
    const treeColumns: ColumnProps[] = [{ title: 'Name', dataIndex: 'name' }];

    it('是行和单元格组成的 table，从不是 grid', () => {
        mountTable({ columns: treeColumns, dataSource: treeData, pagination: false });
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
        expect(screen.getAllByRole('cell').length).toBeGreaterThan(0);
        for (const role of ['grid', 'treegrid', 'gridcell']) {
            expect(screen.queryAllByRole(role)).toHaveLength(0);
        }
        expect(document.querySelector('[aria-level]')).toBeNull();
        expect(document.querySelector('[aria-rowindex]')).toBeNull();
    });

    it('虚拟化表格计入表头行和所有 body 行', async () => {
        mountTable({
            columns: [{ title: 'Name', dataIndex: 'name', width: 200 }],
            dataSource: getData(1000),
            pagination: false,
            scroll: { y: 300 },
            virtualized: true,
        });
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        const table = screen.getByRole('table');
        expect(table).toHaveAttribute('aria-rowcount', '1001');
        expect(within(table).getAllByRole('rowgroup')).toHaveLength(2);
        expect(getBodyRows()[0]).toHaveAttribute('aria-rowindex', '2');
        expect(document.querySelectorAll('[aria-rowcount]')).toHaveLength(1);
    });

    it('渲染为单个 table 元素时，保留 table role', () => {
        const { container } = mountTable({
            columns: [{ title: 'Name', dataIndex: 'name' }],
            dataSource: getData(3),
            pagination: false,
        });
        expect(screen.getByRole('table').tagName).toBe('TABLE');
        expect(container.querySelector('[role="none"]')).toBeNull();
        expect(container.querySelector('[aria-colspan], [aria-rowspan]')).toBeNull();
    });

    it.each([
        ['scroll.y', { scroll: { y: 200 } }],
        ['sticky', { sticky: true }],
        ['virtualized', { scroll: { y: 200 }, virtualized: true }],
    ])('%s 时，分开的表头和 body 表格构成一个 ARIA table', async (_name, extra) => {
        const { container } = mountTable({
            columns: [
                { title: 'Name', dataIndex: 'name', width: 200 },
                { title: 'Age', dataIndex: 'age', width: 100 },
            ],
            dataSource: getData(20),
            pagination: false,
            ...extra,
        });
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
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
        mountTable({
            columns: [
                { title: 'Name', dataIndex: 'name', width: 200 },
                {
                    title: 'Detail',
                    children: [
                        { title: 'Age', dataIndex: 'age', width: 100 },
                        { title: 'Address', dataIndex: 'address', width: 200 },
                    ],
                },
            ],
            dataSource: getData(3),
            pagination: false,
            scroll: { y: 200 },
        });
        const name = screen.getByRole('columnheader', { name: 'Name' });
        const detail = screen.getByRole('columnheader', { name: 'Detail' });
        expect(name).toHaveAttribute('aria-rowspan', '2');
        expect(name).not.toHaveAttribute('aria-colspan');
        expect(detail).toHaveAttribute('aria-colspan', '2');
        expect(detail).not.toHaveAttribute('aria-rowspan');
        expect(screen.getByRole('columnheader', { name: 'Age' })).not.toHaveAttribute('aria-rowspan');
    });

    it('展开列表头有名称', () => {
        mountTable(
            {
                columns: [{ title: 'Name', dataIndex: 'name' }],
                dataSource: getData(2),
                hideExpandedColumn: false,
                pagination: false,
            },
            { expandedRow: ({ record }: { record: Row }) => [<span>{record.name}</span>] }
        );
        expect(screen.getByRole('columnheader', { name: zh_CN.Table.expandColumn })).toBeInTheDocument();
    });

    it.each([
        ['scroll.y', { scroll: { y: 200 } }],
        ['virtualized', { scroll: { y: 200 }, virtualized: true }],
    ])('使用 %s 滚动的 body 是一个 Tab 停靠点', async (_name, extra) => {
        mountTable({
            columns: [{ title: 'Name', dataIndex: 'name', width: 200 }],
            dataSource: getData(100),
            pagination: false,
            ...extra,
        });
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        await userEvent.tab();
        expect(document.activeElement).toHaveClass(`${P}-body`);
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('不滚动的 body 不是 Tab 停靠点', async () => {
        mountTable({ columns: [{ title: 'Name', dataIndex: 'name' }], dataSource: getData(3), pagination: false });
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });
});

describe('Table 虚拟化宽度', () => {
    it('虚拟化时字符串 style.width 不被 scroll.x 覆盖', () => {
        const { container } = mountTable({
            style: { width: '100%' },
            columns: [{ title: 'Name', dataIndex: 'name', width: 100 }],
            dataSource: getData(3),
            pagination: false,
            scroll: { y: 200 },
            virtualized: true,
        });
        expect(container.querySelector<HTMLElement>(`.${P}-wrapper`)?.style.width).toBe('100%');
    });
});

describe('Table 滚动条宽度测量', () => {
    it('有固定列的分组行与展开行，重新渲染不再测量滚动条', async () => {
        const append = vi.spyOn(document.body, 'appendChild');
        const measures = () => append.mock.calls.filter(([node]) => (node as HTMLElement).className?.includes?.('scrollbar-measure')).length;
        const files = [
            { key: '1', name: 'a', size: '2M' },
            { key: '2', name: 'b', size: '34KB' },
        ];
        const props = () => ({
            columns: [
                { title: 'Name', dataIndex: 'name', fixed: 'left', width: 100 },
                { title: 'Size', dataIndex: 'size', width: 100 },
            ],
            dataSource: files.map((file) => ({ ...file })),
            defaultExpandAllRows: true,
            groupBy: 'size',
            pagination: false,
            scroll: { x: 1000 },
        });
        const { update } = mountTable(props(), { expandedRow: () => [<span>detail</span>] });
        const afterMount = measures();
        await update({ props: props() });
        await update({ props: props() });
        expect(document.querySelectorAll(`.${P}-section-inner, .${P}-expand-inner`)).not.toHaveLength(0);
        expect(measures()).toBe(afterMount);
    });

    it('滚动条宽度为 0（overlay 滚动条）时只测量一次', async () => {
        // the measured size is cached per module, so a fresh module starts without it
        vi.resetModules();
        const { measureScrollbar } = await import('@fibrae/semi-foundation/table/utils');
        vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(0);
        vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(0);
        const append = vi.spyOn(document.body, 'appendChild');
        expect([measureScrollbar(), measureScrollbar(), measureScrollbar('horizontal')]).toEqual([0, 0, 0]);
        measureScrollbar('horizontal');
        expect(append).toHaveBeenCalledTimes(2);
    });
});

describe('Table 列', () => {
    it('分组列只有一个子 Column 时，子列照常渲染', () => {
        mountTable(
            { dataSource: [{ key: '1', name: 'Ann' }], pagination: false },
            {
                default: () => [
                    <TableColumn title="Group">
                        {{
                            default: () => [<TableColumn title="Name" dataIndex="name" />],
                        }}
                    </TableColumn>,
                ],
            }
        );
        expect(document.querySelectorAll('thead tr')).toHaveLength(2);
        expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
        expect(screen.getByRole('cell', { name: 'Ann' })).toBeInTheDocument();
    });
});

describe('Table 虚拟化行高', () => {
    const virtualProps = (extra: Record<string, unknown>) => ({
        columns: [{ title: 'Name', dataIndex: 'name', width: 200 }],
        pagination: false,
        scroll: { y: 400 },
        virtualized: {
            itemSize: (_index: number, { expandedRow }: { expandedRow?: boolean }) => (expandedRow ? 100 : 40),
        },
        ...extra,
    });
    const expandedRow = () => [<span>detail</span>];
    const topOf = (key: string) => document.querySelector<HTMLElement>(`[data-row-key="${key}"]`)?.style.top;

    it('展开行后重新计算各行的偏移', async () => {
        const { update } = mountTable(virtualProps({ dataSource: getData(10), expandedRowKeys: [] }), { expandedRow });
        await waitFor(() => expect(topOf('2')).toBe('80px'));
        await update({ props: { expandedRowKeys: ['1'] } });
        await waitFor(() => expect(topOf('1-expanded-row')).toBe('80px'));
        expect(topOf('2')).toBe('180px');
    });

    it('行数不变而各下标的行类型变化时重新计算各行的偏移', async () => {
        const a = { key: 'a', name: 'a' };
        const b = { key: 'b', name: 'b' };
        const c = { key: 'c', name: 'c' };
        const { update } = mountTable(virtualProps({ dataSource: [a, b, c], expandedRowKeys: ['a'] }), { expandedRow });
        await waitFor(() => expect(topOf('c')).toBe('180px'));
        await update({ props: { dataSource: [b, c, a] } });
        await waitFor(() => expect(topOf('c')).toBe('40px'));
        expect(topOf('a-expanded-row')).toBe('120px');
    });

    it('itemSize 函数返回 null 时按默认行高排布，且不告警', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        // null breaks the declared number return type: it stands for a user function that returns nothing
        const itemSize = (() => null) as unknown as () => number;
        mountTable(virtualProps({ dataSource: getData(10), virtualized: { itemSize } }));
        await waitFor(() => expect(topOf('2')).toBe(`${numbers.DEFAULT_VIRTUALIZED_ROW_HEIGHT * 2}px`));
        expect(warn.mock.calls.flat().filter((msg) => String(msg).includes('`itemSize`'))).toHaveLength(0);
    });
});

describe('Table 表头', () => {
    it('#headerCell 收到 column、title、sorter、filter 与 selection', () => {
        const headerCell = vi.fn<(props: TableHeaderCellSlotProps) => VNode[]>((props) => [<span>{`${props.title} cell`}</span>]);
        mountTable({ columns: [{ title: 'Name', dataIndex: 'name' }], dataSource: getData(1), pagination: false }, { headerCell });
        expect(headerCell).toHaveBeenLastCalledWith({
            column: expect.objectContaining({ title: 'Name', dataIndex: 'name' }),
            title: 'Name',
            sorter: null,
            filter: null,
            selection: null,
        });
        expect(screen.getByRole('columnheader', { name: 'Name cell' })).toBeInTheDocument();
    });

    it('onHeaderRow 与 onHeaderCell 返回的对象不被改写，重渲染后类名不增长', async () => {
        const rowProps = { class: 'my-row' };
        const cellProps = { class: 'my-cell' };
        const { update } = mountTable({
            columns: [{ title: 'Name', dataIndex: 'name', align: 'center', class: 'col', onHeaderCell: () => cellProps }],
            dataSource: getData(1),
            pagination: false,
            onHeaderRow: () => rowProps,
        });
        await update({ props: { dataSource: getData(2) } });
        await update({ props: { dataSource: getData(3) } });
        expect(rowProps).toEqual({ class: 'my-row' });
        expect(cellProps).toEqual({ class: 'my-cell' });
        const headerRow = document.querySelector(`.${P}-thead tr`) as HTMLElement;
        expect([...headerRow.classList]).toEqual(['my-row', `${P}-row`]);
        const th = screen.getByRole('columnheader', { name: 'Name' });
        expect([...th.classList].filter((name) => name === 'col')).toHaveLength(1);
    });
});

describe('Table Vue 写法', () => {
    const records = getData(2);

    it('模板中用 v-if 和 v-for 增删 Table.Column，表头和单元格随之更新', async () => {
        const warn = vi.spyOn(console, 'warn');
        const extra = reactive<string[]>([]);
        const view = render(ToggleColumns, { props: { dataSource: records, showAge: false, extra } });
        expect(headTexts()).toEqual(['Name']);
        extra.push('address');
        await nextTick();
        expect(headTexts()).toEqual(['Name', 'address']);
        await view.rerender({ showAge: true, extra: ['address'] });
        expect(headTexts()).toEqual(['Name', 'Age', 'address']);
        expect(cellTexts(getBodyRows()[0])).toEqual(['Edward King 0', '0', 'London, Park Lane no. 0 Lake Park']);
        await view.rerender({ showAge: false, extra: [] });
        expect(headTexts()).toEqual(['Name']);
        expect(cellTexts(getBodyRows()[0])).toEqual(['Edward King 0']);
        expect(warn.mock.calls.flat().join('\n')).not.toContain('[Vue warn]');
    });

    it('h() 写法增删 Column，表头和单元格随之更新', async () => {
        const warn = vi.spyOn(console, 'warn');
        const nodes = (fields: string[]) => () => fields.map((field) => <TableColumn key={field} title={field} dataIndex={field} />);
        const { update } = mountTable({ dataSource: records, pagination: false }, { default: nodes(['name']) });
        expect(headTexts()).toEqual(['name']);
        await update({ slots: { default: nodes(['name', 'age']) } });
        expect(headTexts()).toEqual(['name', 'age']);
        expect(cellTexts(getBodyRows()[1])).toEqual(['Edward King 1', '106']);
        await update({ slots: { default: nodes(['age']) } });
        expect(headTexts()).toEqual(['age']);
        expect(warn.mock.calls.flat().join('\n')).not.toContain('[Vue warn]');
    });

    it('排序只改内部状态，不重读 h() 写的默认插槽', async () => {
        let slotCalls = 0;
        const slots = {
            default: () => {
                slotCalls += 1;
                return [<TableColumn title="Name" dataIndex="name" sorter={(a: Row, b: Row) => b.name.localeCompare(a.name)} />];
            },
        };
        render(
            defineComponent(() => () => (
                <Table dataSource={records} pagination={false}>
                    {slots}
                </Table>
            ))
        );
        expect(cellTexts(getBodyRows()[0])).toEqual(['Edward King 0']);
        slotCalls = 0;
        await userEvent.click(getHeads()[0].querySelector(`.${P}-column-sorter-wrapper`) as HTMLElement);
        expect(cellTexts(getBodyRows()[0])).toEqual(['Edward King 1']);
        expect(slotCalls).toBe(0);
    });

    it('TableColumn 的 elementType 为 Table.Column，声明同名 elementType 的包装组件被识别为列', () => {
        expect((TableColumn as { elementType?: string }).elementType).toBe('Table.Column');
        const WrappedColumn = Object.assign(defineComponent({ props: ['title', 'dataIndex'], setup: () => () => null }), { elementType: 'Table.Column' });
        render(
            defineComponent(() => () => (
                <Table dataSource={records} pagination={false}>
                    {{
                        default: () => [<WrappedColumn title="Name" dataIndex="name" />],
                    }}
                </Table>
            ))
        );
        expect(headTexts()).toEqual(['Name']);
    });

    it('kebab-case 的 data-index 与布尔简写 fixed、ellipsis 生效', () => {
        render(ShorthandColumns, { props: { dataSource: records } });
        expect(getHeads()[0]).toHaveClass(`${P}-cell-fixed-left`);
        const [firstCell] = getBodyRows()[0].children;
        expect(firstCell).toHaveTextContent('Edward King 0');
        expect(firstCell).toHaveClass(`${P}-cell-fixed-left`, `${P}-row-cell-ellipsis`);
    });

    it('Table.Column 在运行时声明列字段为 props，key 除外', () => {
        const declared = (TableColumn as { props?: string[] }).props;
        expect(declared).toEqual(expect.arrayContaining(['dataIndex', 'title', 'sorter', 'fixed', 'onCell']));
        expect(declared).not.toContain('key');
    });

    it('两个 v-if 列加 v-for 下标 key 列时列 key 不重复，字符串 key 成为 column.key', () => {
        const warn = vi.spyOn(console, 'warn');
        render(KeyedColumns, { props: { dataSource: records, fields: ['address', 'description'] } });
        const keys = headTexts();
        expect(keys).toHaveLength(5);
        expect(new Set(keys).size).toBe(5);
        expect(keys[4]).toBe('op');
        expect(warn.mock.calls.flat().join('\n')).not.toContain('Duplicate keys');
    });

    it('表级 #cell 只渲染指定列，空输出回退到原始值；Column 的 #cell 优先', () => {
        render(SlotPrecedence, { props: { dataSource: records } });
        const [name, age, address] = getBodyRows()[0].children;
        expect(name.querySelector('i')).toHaveTextContent('table Edward King 0');
        expect(age.querySelector('b')).toHaveTextContent('own 0');
        expect(address).toHaveTextContent('London, Park Lane no. 0 Lake Park');
        expect(address.children).toHaveLength(0);
    });

    it('#headerCell 只覆盖指定列，其他列显示 title；Column 的 #title 优先', () => {
        render(SlotPrecedence, { props: { dataSource: records } });
        expect(headTexts()).toEqual(['H Name', 'Own Age', 'Address']);
    });

    it('onCell 返回 colSpan 0 或 rowSpan 0 时跳过单元格；虚拟化的展开行有 aria-rowindex', async () => {
        const { unmount } = mountTable({
            columns: [
                {
                    title: 'Name',
                    dataIndex: 'name',
                    onCell: (_record: Row, index: number) => (index === 0 ? { colSpan: 2 } : {}),
                },
                {
                    title: 'Age',
                    dataIndex: 'age',
                    onCell: (_record: Row, index: number) => (index === 0 ? { colSpan: 0 } : index === 1 ? { rowSpan: 0 } : {}),
                },
            ],
            dataSource: getData(3),
            pagination: false,
        });
        const rows = getBodyRows();
        expect(rows[0].children).toHaveLength(1);
        expect(rows[0].children[0]).toHaveAttribute('colspan', '2');
        expect(rows[1].children).toHaveLength(1);
        expect(rows[2].children).toHaveLength(2);
        unmount();

        mountTable(
            {
                columns: [{ title: 'Name', dataIndex: 'name', width: 200 }],
                dataSource: getData(3),
                expandedRowKeys: ['0'],
                pagination: false,
                scroll: { y: 300 },
                virtualized: true,
            },
            { expandedRow: () => [<span>detail</span>] }
        );
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        const indexOf = (key: string) => document.querySelector(`[data-row-key="${key}"]`)?.getAttribute('aria-rowindex');
        expect([indexOf('0'), indexOf('0-expanded-row'), indexOf('1')]).toEqual(['2', '3', '4']);
    });

    it('虚拟化的分组行有 aria-rowindex，容器的 aria-rowcount 计入分组行', async () => {
        const sized = [
            { key: '0', name: 'a', size: 'A' },
            { key: '1', name: 'b', size: 'A' },
            { key: '2', name: 'c', size: 'B' },
        ];
        const { container } = mountTable({
            columns: [{ title: 'Name', dataIndex: 'name', width: 200 }],
            dataSource: sized,
            defaultExpandAllGroupRows: true,
            groupBy: 'size',
            pagination: false,
            scroll: { y: 300 },
            virtualized: true,
        });
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        const indexOf = (key: string) => document.querySelector(`[data-row-key="${key}"]`)?.getAttribute('aria-rowindex');
        expect(['A', '0', '1', 'B', '2'].map(indexOf)).toEqual(['2', '3', '4', '5', '6']);
        expect(container.querySelector('[aria-rowcount]')).toHaveAttribute('aria-rowcount', '6');
    });

    it('onRow 返回的监听在内部逻辑和 rowXxx 事件之后调用，class 与 style 落在 tr 上', async () => {
        const calls: string[] = [];
        mountTable(
            {
                columns: [{ title: 'Name', dataIndex: 'name' }],
                dataSource: getData(2),
                pagination: false,
                expandRowByClick: true,
                onRow: (): TableRowAttrs => ({
                    class: 'mine',
                    style: { color: 'red' },
                    onClick: () => calls.push('onRow click'),
                    onMouseenter: () => calls.push('onRow mouseenter'),
                }),
                onExpand: () => calls.push('expand'),
                onRowMouseEnter: () => calls.push('rowMouseEnter'),
            },
            { expandedRow: () => [<span>detail</span>] }
        );
        const [row] = getBodyRows();
        expect(row).toHaveClass('mine', `${P}-row`);
        expect(row).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        await fireEvent.mouseEnter(row);
        await fireEvent.click(row);
        expect(calls).toEqual(['rowMouseEnter', 'onRow mouseenter', 'expand', 'onRow click']);
    });

    it('行不把 onRow 未返回的属性写到 tr 上', async () => {
        const { update } = mountTable({
            columns: [{ title: 'Name', dataIndex: 'name' }],
            dataSource: getData(1),
            pagination: false,
        });
        expect(getBodyRows()[0].getAttributeNames().sort()).toEqual(['class', 'data-row-key', 'role']);
        await update({ props: { onRow: () => ({ 'data-x': '1', title: 'row title' }) } });
        expect(getBodyRows()[0].getAttributeNames().sort()).toEqual(['class', 'data-row-key', 'data-x', 'role', 'title']);
    });

    it('aria-label 落在 table 上而非根 div；有 #title 时 aria-labelledby 指向标题', () => {
        const columns = [{ title: 'Name', dataIndex: 'name', width: 100 }];
        const plain = mountTable({ 'aria-label': 'People', columns, dataSource: getData(1), pagination: false });
        expect(screen.getByRole('table', { name: 'People' }).tagName).toBe('TABLE');
        expect(plain.container.querySelector(`.${P}-wrapper`)).not.toHaveAttribute('aria-label');
        plain.unmount();

        const split = mountTable({
            'aria-label': 'People',
            columns,
            dataSource: getData(1),
            pagination: false,
            scroll: { y: 200 },
        });
        expect(screen.getByRole('table', { name: 'People' })).toHaveClass(`${P}-container`);
        expect(split.container.querySelector(`.${P}-wrapper`)).not.toHaveAttribute('aria-label');
        split.unmount();

        mountTable({ columns, dataSource: getData(1), pagination: false }, { title: () => [<span>Staff</span>] });
        const table = screen.getByRole('table', { name: 'Staff' });
        expect(table).toHaveAttribute('aria-labelledby', (document.querySelector(`.${P}-title`) as HTMLElement).id);
    });

    it('非虚拟化时调用 scrollTo 给出开发警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { handle } = mountTable({ columns: [{ title: 'Name', dataIndex: 'name' }], dataSource: getData(3) });
        handle().scrollTo(10);
        handle().scrollToItem(1);
        expect(warn.mock.calls.flat().join('\n')).toContain('scrollTo only works with a mounted virtualized table');
        expect(warn.mock.calls.flat().join('\n')).toContain('scrollToItem only works with a mounted virtualized table');
    });

    it('虚拟化缺少数字 scroll.y 时只警告一次', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { update } = mountTable({ columns: [{ title: 'Name', dataIndex: 'name' }], dataSource: getData(3), pagination: false, virtualized: true });
        await update({ props: { bordered: true } });
        expect(warn.mock.calls.flat().filter((msg) => String(msg).includes('"scroll.y"'))).toHaveLength(1);
    });

    it('itemSize 小于最小行高的警告只出现一次', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { update } = mountTable({
            columns: [{ title: 'Name', dataIndex: 'name', width: 200 }],
            dataSource: getData(20),
            pagination: false,
            scroll: { y: 300 },
            virtualized: { itemSize: 20 },
        });
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        await update({ props: { bordered: true } });
        expect(warn.mock.calls.flat().filter((msg) => String(msg).includes('`itemSize`'))).toHaveLength(1);
    });

    it('@scroll 在纵向滚动时触发，横向滚动时不触发', async () => {
        const onScroll = vi.fn<(args: VirtualListScrollArgs) => void>();
        mountTable({
            columns: [{ title: 'Name', dataIndex: 'name', width: 200 }],
            dataSource: getData(100),
            pagination: false,
            scroll: { y: 300 },
            virtualized: true,
            onScroll,
        });
        await waitFor(() => expect(getBodyRows().length).toBeGreaterThan(0));
        await nextTick();
        const body = document.querySelector(`.${P}-body`) as HTMLElement;
        body.scrollLeft = 50;
        await fireEvent.scroll(body);
        expect(onScroll).not.toHaveBeenCalled();
        body.scrollTop = 200;
        await fireEvent.scroll(body);
        expect(onScroll).toHaveBeenLastCalledWith(expect.objectContaining({ scrollDirection: 'forward', scrollOffset: 200, scrollUpdateWasRequested: false }));
    });

    it('原地 push dataSource 后显示新行，本地排序包含新行', async () => {
        const list = reactive(smallData());
        mountTable({
            columns: [
                { title: 'Name', dataIndex: 'name' },
                { title: 'Age', dataIndex: 'age', sorter: (a: Row, b: Row) => a.age - b.age, sortOrder: 'ascend' },
            ],
            dataSource: list,
            pagination: false,
        });
        const names = () => getBodyRows().map((row) => row.children[0].textContent);
        expect(names()).toEqual(['a', 'b', 'c']);
        list.push({ key: '4', name: 'd', age: 0 });
        await nextTick();
        expect(names()).toEqual(['d', 'a', 'b', 'c']);
    });

    it('没有 #empty 时显示语言包空文案，空的 #empty 不显示文案', () => {
        const { unmount } = mountTable({ columns: getColumns(), dataSource: [] });
        expect(document.querySelector(`.${P}-empty`)).toHaveTextContent(zh_CN.Table.emptyText);
        unmount();
        mountTable({ columns: getColumns(), dataSource: [] }, { empty: () => [] });
        expect(document.querySelector(`.${P}-empty`)?.textContent).toBe('');
    });

    it.each([
        ['', {}],
        ['虚拟化时', { scroll: { y: 300 }, virtualized: true }],
    ])('%s悬停一行只重渲染该行，其他行不重新调用 onRow', async (_name, extra) => {
        const onRow = vi.fn<(record?: Row) => TableRowAttrs>(() => ({}));
        mountTable({
            columns: [{ title: 'Name', dataIndex: 'name', width: 200 }],
            dataSource: getData(5),
            pagination: false,
            onRow,
            ...extra,
        });
        await waitFor(() => expect(getBodyRows()).toHaveLength(5));
        await nextTick();
        onRow.mockClear();
        await fireEvent.mouseEnter(getBodyRows()[0]);
        expect(onRow.mock.calls.map(([record]) => record?.key)).toEqual(['0']);
    });

    it.each([
        ['', {}],
        ['虚拟化时', { scroll: { y: 300 }, virtualized: true }],
    ])('%s分组键与记录键同值时，切换数据后行内容与 data-row-key 正确', async (_name, extra) => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const a = { id: 1, group: 1, name: 'a' };
        const b = { id: 2, group: 2, name: 'b' };
        const { update } = mountTable(
            {
                columns: [{ title: 'Name', dataIndex: 'name', width: 200 }],
                dataSource: [a, b],
                defaultExpandAllGroupRows: true,
                groupBy: 'group',
                pagination: false,
                rowKey: 'id',
                ...extra,
            },
            { groupSection: ({ groupKey }: { groupKey: number }) => [<b>{`group ${groupKey}`}</b>] }
        );
        const rowView = () => Array.from(document.querySelectorAll(`.${P}-tbody [role="row"]`), (row) => [row.getAttribute('data-row-key'), row.textContent]);
        await nextTick();
        expect(rowView()).toEqual([
            ['1', 'group 1'],
            ['1', 'a'],
            ['2', 'group 2'],
            ['2', 'b'],
        ]);
        await update({ props: { dataSource: [b, a] } });
        expect(rowView()).toEqual([
            ['2', 'group 2'],
            ['2', 'b'],
            ['1', 'group 1'],
            ['1', 'a'],
        ]);
        expect(warn.mock.calls.flat().join('\n')).not.toContain('Duplicate keys');
    });
});

describe('Table showHeader 为 false 且表头拆分', () => {
    const columns = (): ColumnProps[] => [{ title: 'Name', dataIndex: 'name', width: 200, sorter: (a, b) => a.name.localeCompare(b.name) }];

    it('隐藏的表头 inert，排序按钮在 inert 子树内', async () => {
        mountTable({ columns: columns(), dataSource: getData(3), pagination: false, rowSelection: {}, scroll: { y: 300 }, showHeader: false });
        await nextTick();
        expect(document.querySelector(`.${P}-header`)).toHaveAttribute('inert');
        // jsdom ignores inert; the browser test checks the Tab order
        expect(screen.getByRole('button', { name: 'Name' }).closest('[inert]')).not.toBeNull();
    });

    it('虚拟化时行数不计表头行', async () => {
        mountTable({ columns: columns(), dataSource: getData(3), pagination: false, scroll: { y: 300 }, showHeader: false, virtualized: true });
        await waitFor(() => expect(getBodyRows().length).toBe(3));
        expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '3');
        expect(getBodyRows()[0]).toHaveAttribute('aria-rowindex', '1');
    });
});

describe('Table 只有选择列固定', () => {
    it('写入表格可视宽度，表格按固定布局', async () => {
        const { container } = mountTable({ columns: [{ title: 'Name', dataIndex: 'name' }], dataSource: [{ key: '1', name: 'Ann' }], pagination: false, rowSelection: { fixed: true } });
        await nextTick();
        expect(container.querySelector<HTMLElement>(`.${P}-wrapper`)?.style.getPropertyValue('--semi-table-section-width')).not.toBe('');
        expect(container.querySelector('table')).toHaveClass(`${P}-fixed`);
    });
});

describe('Table 为 0 的列 key', () => {
    it('key 为 0 的列不与 key 等于其 dataIndex 的列重复', async () => {
        const warn = vi.spyOn(console, 'warn');
        const zero: ColumnProps = { title: 'Zero', key: 0, dataIndex: 'name' };
        const named: ColumnProps = { title: 'Named', key: 'name', dataIndex: 'age' };
        const other: ColumnProps = { title: 'Other', key: 'other', dataIndex: 'address' };
        const table = mountTable({ columns: [other, zero, named], dataSource: getData(1), pagination: false });
        // Vue checks keys only when it diffs the middle of a reordered list
        await table.update({ props: { columns: [named, zero, other] } });
        expect(headTexts()).toEqual(['Named', 'Zero', 'Other']);
        expect(warn.mock.calls.flat().join('\n')).not.toContain('Duplicate keys');
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
        mountTable({ columns, dataSource, pagination: false });
        expect(queryAll(`.${P}-cell-last`).map((cell) => cell.textContent)).toEqual(['C', 'b1', 'c2']);
    });
});
