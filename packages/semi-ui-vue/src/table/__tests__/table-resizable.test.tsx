/** @jsxImportSource vue */
import { defineComponent, nextTick, ref } from 'vue';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { getData, render } from '@test/utils/vue';
import Table, { TableColumn, type ColumnProps, type TableExpandedRowSlotProps, type TableResizeFn } from '..';
import semiGlobal from '../../_utils/semi-global';
import { P, getBodyRows, mountTable, query, queryAll } from './table-helpers';

const data = getData(46);
const getFileData = (total: number) =>
    Array.from({ length: total }, (_, i) => ({
        key: `${i}`,
        name: `file ${i}`,
        size: (i * 1000) % 199,
        owner: i % 2 === 0 ? '姜鹏志' : '郝宣',
    }));
const getHandles = () => queryAll(`.${P}-thead .${P}-resize-handle`);
const getColWidths = () => queryAll<HTMLElement>(`.${P}-col`).map((col) => col.style.width);
const waitForHandles = (count: number) => waitFor(() => expect(getHandles()).toHaveLength(count));
async function drag(handle: Element, moves: number[]) {
    await fireEvent.pointerDown(handle, { button: 0, clientX: 0, pointerId: 1 });
    for (const clientX of moves) {
        await fireEvent.pointerMove(handle, { clientX, pointerId: 1 });
    }
    await fireEvent.lostPointerCapture(handle, { clientX: moves.at(-1), pointerId: 1 });
}

describe('Table 列宽调整', () => {
    it('可调整列宽的表格', async () => {
        const columns: ColumnProps[] = [
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
            { title: 'Address', dataIndex: 'address', width: 300 },
            { key: 'operate' },
        ];
        mountTable(
            { columns, dataSource: data, resizable: true },
            {
                expandedRow: ({ record }: TableExpandedRowSlotProps) => [
                    <article>
                        <p>{record.description}</p>
                    </article>,
                ],
            }
        );
        await waitForHandles(3);
        expect(getColWidths()).toEqual(['150px', '150px', '300px', '']);
    });

    it('fix #650：可调整列宽的表格删除一列后保留各列宽度', async () => {
        const columns: ColumnProps[] = [
            { title: '标题', dataIndex: 'name', width: 300 },
            { title: '大小', dataIndex: 'size', width: 100 },
            { title: '所有者', dataIndex: 'owner', width: 200 },
            { title: '', dataIndex: 'operate' },
        ];
        const table = mountTable({ columns, dataSource: getFileData(3), pagination: false, resizable: true });
        await waitForHandles(3);
        expect(getColWidths()).toEqual(['300px', '100px', '200px', '']);
        await table.update({ props: { columns: columns.filter((_, index) => index !== 1) } });
        expect(getColWidths()).toEqual(['300px', '200px', '']);
    });

    it('fix #1506：带节点标题的可调整列宽表格与表单并列渲染', async () => {
        const title = ref('ccc');
        const App = defineComponent(() => () => (
            <div>
                <form aria-label="filters" />
                <Table columns={[{ dataIndex: 'dau', width: 300 }]} dataSource={[]} resizable>
                    {{ headerCell: () => [<div>{title.value}</div>] }}
                </Table>
            </div>
        ));
        render(App);
        await waitForHandles(1);
        title.value = 'ddd';
        await nextTick();
        expect(screen.getByRole('form', { name: 'filters' })).toBeInTheDocument();
        expect(screen.getByText('ddd').closest('th')).toHaveClass(`${P}-row-head`);
        expect(getHandles()).toHaveLength(1);
        expect(screen.getByText('暂无数据')).toBeInTheDocument();
    });

    it('可调整列宽表格加载时，普通 th 上不保留列宽调整标记', async () => {
        const warn = vi.spyOn(console, 'warn');
        mountTable({
            columns: [
                { dataIndex: 'a', title: 'A', width: 100, resize: false },
                { dataIndex: 'b', title: 'B', width: 100 },
            ],
            dataSource: [],
            resizable: true,
        });
        expect(queryAll('th[resize], th[resizable]')).toHaveLength(0);
        await waitForHandles(1);
        expect(queryAll('th[resize], th[resizable]')).toHaveLength(0);
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it('fix #2036：rowSelection.hidden 隐藏可调整列宽表格的选择列', async () => {
        const getSelectionCells = () => queryAll(`.${P}-column-selection`);
        const columns: ColumnProps[] = [
            { title: '标题', dataIndex: 'name', width: 300 },
            { title: '大小', dataIndex: 'size', width: 200 },
        ];
        const table = mountTable({
            bordered: true,
            columns,
            dataSource: getFileData(5),
            resizable: true,
            rowSelection: { hidden: false },
        });
        await waitForHandles(3);
        expect(getSelectionCells().length).toBeGreaterThan(0);
        await table.update({ props: { rowSelection: { hidden: true } } });
        expect(getSelectionCells()).toHaveLength(0);
        expect(queryAll(`.${P}-thead .${P}-row-head`)).toHaveLength(2);
        await table.update({ props: { rowSelection: { hidden: false } } });
        expect(getSelectionCells().length).toBeGreaterThan(0);
    });

    it('可调整列宽的表格在其加载完成前渲染普通表格', async () => {
        mountTable({
            columns: [{ title: 'Name', dataIndex: 'name', width: 200 }],
            dataSource: getData(2),
            resizable: true,
        });
        expect(screen.getByText('Name').closest('th')).toBeInTheDocument();
        expect(getBodyRows()).toHaveLength(2);
        await waitForHandles(1);
        expect(getBodyRows()).toHaveLength(2);
    });

    it('resizable 属性不设置在根元素上', async () => {
        mountTable({
            'data-testid': 'root',
            columns: [{ title: 'Name', dataIndex: 'name', width: 200 }],
            dataSource: getData(2),
            resizable: false,
        });
        expect(screen.getByTestId('root')).not.toHaveAttribute('resizable');
        const resizable = mountTable({
            'data-testid': 'resizable-root',
            columns: [{ title: 'Name', dataIndex: 'name', width: 200 }],
            dataSource: getData(2),
            resizable: true,
        });
        await waitFor(() => expect(resizable.container.querySelector(`.${P}-resize-handle`)).not.toBeNull());
        expect(screen.getByTestId('resizable-root')).not.toHaveAttribute('resizable');
        expect(screen.getByTestId('resizable-root')).toHaveClass(`${P}-wrapper`);
    });

    it('resizable 时 rowSelection.onHeaderCell 仍作用于选择列表头，且保留拖动手柄', async () => {
        mountTable({
            columns: [{ title: 'Name', dataIndex: 'name', width: 200 }],
            dataSource: [{ key: '1', name: 'Ann' }],
            pagination: false,
            resizable: true,
            rowSelection: { onHeaderCell: () => ({ class: 'selection-head' }) },
        });
        await waitFor(() => expect(query(`.${P}-resize-handle`)).not.toBeNull());
        const th = query(`th.${P}-column-selection`);
        expect(th).toHaveClass('selection-head');
        expect(th.querySelector(`.${P}-resize-handle`)).not.toBeNull();
    });

    it('resizable 时 Table.Column 写法的列照常渲染，并警告一次不支持调整列宽', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const table = mountTable({ dataSource: getData(1), pagination: false, resizable: true }, { default: () => [<TableColumn title="Name" dataIndex="name" width={200} />] });
        await waitFor(() => expect(warn.mock.calls.flat().join('\n')).toContain('resizable only works with the columns prop'));
        await table.update({ props: { dataSource: getData(2) } });
        expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
        expect(query(`.${P}-resize-handle`)).toBeNull();
        expect(warn.mock.calls.filter((args) => args.join(' ').includes('resizable'))).toHaveLength(1);
        warn.mockRestore();
    });

    it('resizable 时 columns 为空数组加 Table.Column 子项，子项列照常渲染', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        mountTable({ columns: [], dataSource: getData(1), pagination: false, resizable: true }, { default: () => [<TableColumn title="Name" dataIndex="name" width={200} />] });
        await waitFor(() => expect(warn.mock.calls.flat().join('\n')).toContain('resizable only works with the columns prop'));
        expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
        expect(getBodyRows()[0]).toHaveTextContent('Edward King 0');
        expect(query(`.${P}-resize-handle`)).toBeNull();
    });

    it('一次批处理内连续拖动列宽，onResizeStop 收到最终宽度', async () => {
        const onResizeStop = vi.fn<TableResizeFn>();
        mountTable({
            columns: [
                { title: 'Date', dataIndex: 'date', width: 200 },
                { title: 'Note', dataIndex: 'note' },
            ],
            dataSource: [{ key: 0, date: '2018-02-11' }],
            resizable: { onResizeStop },
        });
        await waitForHandles(1);
        const [handle] = getHandles();
        // synchronous events: the moves of a fast drag can arrive before Vue renders the previous one
        void fireEvent.pointerDown(handle, { button: 0, clientX: 0, pointerId: 1 });
        void fireEvent.pointerMove(handle, { clientX: 30, pointerId: 1 });
        void fireEvent.pointerMove(handle, { clientX: 60, pointerId: 1 });
        void fireEvent.lostPointerCapture(handle, { clientX: 60, pointerId: 1 });
        expect(onResizeStop).toHaveBeenCalledTimes(1);
        expect(onResizeStop.mock.calls[0][0]).toMatchObject({ width: 260 });
        expect(onResizeStop.mock.calls[0][0].class ?? '').not.toContain('resizing');
    });
});

describe('Table 列宽调整 Vue 写法', () => {
    it('改变未拖动过的列的 width 后宽度跟随，拖动过的列保留拖动宽度', async () => {
        const columns = (width: number): ColumnProps[] => [
            { title: 'Name', dataIndex: 'name', width },
            { title: 'Age', dataIndex: 'age', width },
            { title: 'Address', dataIndex: 'address' },
        ];
        const table = mountTable({ columns: columns(100), dataSource: getData(2), pagination: false, resizable: true });
        await waitForHandles(2);
        await drag(getHandles()[0], [50]);
        expect(getColWidths()).toEqual(['150px', '100px', '']);
        await table.update({ props: { columns: columns(120) } });
        expect(getColWidths()).toEqual(['150px', '120px', '']);
    });

    it('拖动后改变列的 class，新的 columns 优先且拖动宽度保留', async () => {
        const columns = (cls: string): ColumnProps[] => [
            { title: 'Name', dataIndex: 'name', width: 100, class: cls },
            { title: 'Age', dataIndex: 'age' },
        ];
        const table = mountTable({
            columns: columns('foo'),
            dataSource: getData(2),
            pagination: false,
            resizable: true,
        });
        await waitForHandles(1);
        await drag(getHandles()[0], [50]);
        expect(query(`.${P}-thead th`)).toHaveClass('foo');
        expect(query(`.${P}-thead th`)).not.toHaveClass('resizing');
        await table.update({ props: { columns: columns('bar') } });
        expect(query(`.${P}-thead th`)).toHaveClass('bar');
        expect(query(`.${P}-thead th`)).not.toHaveClass('foo');
        expect(getColWidths()).toEqual(['150px', '']);
    });

    it('resizable 读取全局默认值', async () => {
        semiGlobal.config.overrideDefaultProps = { Table: { resizable: true } };
        try {
            mountTable({
                columns: [
                    { title: 'Name', dataIndex: 'name', width: 100 },
                    { title: 'Age', dataIndex: 'age' },
                ],
                dataSource: getData(2),
                pagination: false,
            });
            await waitForHandles(1);
            expect(getHandles()).toHaveLength(1);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('onHeaderCell 在表头渲染时调用，resize 回调的首参是列配置', async () => {
        const onResize = vi.fn<TableResizeFn>((column) => ({ class: `w-${column.width}` }));
        const onHeaderCell = vi.fn<NonNullable<ColumnProps['onHeaderCell']>>(() => ({ class: 'own-head' }));
        mountTable({
            columns: [{ title: 'Name', dataIndex: 'name', width: 100, onHeaderCell }],
            dataSource: getData(1),
            pagination: false,
            resizable: { onResize },
        });
        await waitForHandles(1);
        const th = query(`.${P}-thead th`);
        expect(th).toHaveClass('own-head');
        await drag(getHandles()[0], [10]);
        expect(onResize).toHaveBeenLastCalledWith(expect.objectContaining({ dataIndex: 'name', width: 110 }));
        expect(query(`.${P}-thead th`)).toHaveClass('w-110');
        expect(query(`.${P}-thead th`)).toHaveClass('own-head');
        expect(onHeaderCell).toHaveBeenCalled();
    });

    it('拖动越过起始侧时宽度不小于最小宽度', async () => {
        mountTable({
            columns: [
                { title: 'Name', dataIndex: 'name', width: 100 },
                { title: 'Age', dataIndex: 'age' },
            ],
            dataSource: getData(1),
            pagination: false,
            resizable: true,
        });
        await waitForHandles(1);
        await drag(getHandles()[0], [-500]);
        expect(getColWidths()[0]).toBe('20px');
    });
});

describe('Table resizable 时固定在右侧的内置列', () => {
    it('选择列与展开列 fixed 为 right 时排在最后', async () => {
        mountTable({ columns: [{ title: 'Name', dataIndex: 'name', width: 200 }], dataSource: getData(1), expandCellFixed: 'right', hideExpandedColumn: false, pagination: false, resizable: true, rowSelection: { fixed: 'right' } }, { expandedRow: ({ record }: TableExpandedRowSlotProps) => [<p>{record.name}</p>] });
        await waitFor(() => expect(getHandles().length).toBeGreaterThan(0));
        const headers = screen.getAllByRole('columnheader');
        expect(headers[0]).toHaveTextContent('Name');
        expect(headers.at(-1)?.querySelector('input[type="checkbox"]')).not.toBeNull();
    });
});
