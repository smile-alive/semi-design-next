import { type JSX, createSignal, onMount } from 'solid-js';
import { fireEvent, render, screen, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { getData } from '@test/utils/solid';
import Table from '..';
import Column from '../column';
import type { ColumnProps, ResizeFn, TableComponents } from '../interface';
import { P, getBodyRows, getColumns, query, queryAll } from './table-helpers';

type Row = Record<string, any>;

const getColWidths = () => queryAll(`.${P}-col`).map((col) => col.style.width);
const getHandles = () => queryAll(`.${P}-thead .${P}-resize-handle`);

const getFileData = (total: number) =>
    Array.from({ length: total }, (_, i) => ({
        key: `${i}`,
        name: i % 2 === 0 ? `Semi Design 设计稿${i}.fig` : `Semi Pro 设计稿${i}.fig`,
        owner: i % 2 === 0 ? '姜鹏志' : '郝宣',
        size: (i * 1000) % 199,
    }));

const drag = (handle: HTMLElement, from: number, ...moves: number[]) => {
    fireEvent.pointerDown(handle, { button: 0, clientX: from, pointerId: 1 });
    moves.forEach((clientX) => fireEvent.pointerMove(handle, { clientX, pointerId: 1 }));
    fireEvent.lostPointerCapture(handle, { pointerId: 1 });
};

describe('Table 可调整列宽', () => {
    it('有数字 width 的列都有拖动手柄', () => {
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name', width: 150, filters: [{ text: '名字包含"1"', value: '1' }], onFilter: (value, record) => record.name.indexOf(value) > -1 },
            { title: 'Age', dataIndex: 'age', width: 150, sorter: true },
            { title: 'Address', dataIndex: 'address', width: 300 },
            { render: () => 'more' },
        ];
        render(() => <Table columns={columns} dataSource={getData(46)} resizable expandedRowRender={(record) => <p>{record?.description}</p>} />);
        expect(getHandles()).toHaveLength(3);
    });

    it('fix #650：删除一列后保留各列宽度', () => {
        const columns: ColumnProps[] = [
            { title: '标题', dataIndex: 'name', width: 300 },
            { title: '大小', dataIndex: 'size', width: 100 },
            { title: '所有者', dataIndex: 'owner', width: 200 },
            { title: '', dataIndex: 'operate', render: () => 'more' },
        ];
        const [shown, setShown] = createSignal(columns);
        render(() => <Table columns={shown()} dataSource={getFileData(3)} pagination={false} resizable />);
        expect(getColWidths()).toEqual(['300px', '100px', '200px', '']);
        setShown(columns.filter((_, index) => index !== 1));
        expect(getColWidths()).toEqual(['300px', '200px', '']);
    });

    it('fix #1506：带元素标题的表格与表单并列渲染', () => {
        const [title, setTitle] = createSignal<JSX.Element>(<div>ccc</div>);
        render(() => (
            <div>
                <form aria-label="filters" />
                <Table columns={[{ dataIndex: 'dau', title: () => title(), width: 300 }]} dataSource={[]} resizable />
            </div>
        ));
        expect(getHandles()).toHaveLength(1);
        setTitle(<div>ddd</div>);
        expect(screen.getByRole('form', { name: 'filters' })).toBeInTheDocument();
        expect(screen.getByText('ddd').closest('th')).toHaveClass(`${P}-row-head`);
        expect(getHandles()).toHaveLength(1);
        expect(screen.getByText('暂无数据')).toBeInTheDocument();
    });

    it('resize 为 false 的列没有拖动手柄，th 上不留 resize 属性', () => {
        render(() => (
            <Table
                columns={[
                    { dataIndex: 'a', title: 'A', width: 100, resize: false },
                    { dataIndex: 'b', title: 'B', width: 100 },
                ]}
                dataSource={[]}
                resizable
            />
        ));
        expect(getHandles()).toHaveLength(1);
        expect(screen.getByRole('columnheader', { name: 'A' }).querySelector(`.${P}-resize-handle`)).toBeNull();
        queryAll(`.${P}-thead th`).forEach((th) => expect(th).not.toHaveAttribute('resize'));
    });

    it('fix #2036：rowSelection.hidden 隐藏选择列', () => {
        const columns: ColumnProps[] = [
            { title: '标题', dataIndex: 'name', width: 300 },
            { title: '大小', dataIndex: 'size', width: 200 },
        ];
        const getSelectionCells = () => queryAll(`.${P}-column-selection`);
        const [hidden, setHidden] = createSignal(false);
        render(() => <Table bordered columns={columns} dataSource={getFileData(5)} resizable rowSelection={{ hidden: hidden() }} />);
        expect(getSelectionCells().length).toBeGreaterThan(0);
        setHidden(true);
        expect(getSelectionCells()).toHaveLength(0);
        expect(queryAll(`.${P}-thead .${P}-row-head`)).toHaveLength(2);
        setHidden(false);
        expect(getSelectionCells().length).toBeGreaterThan(0);
    });

    it('rowSelection.onHeaderCell 仍作用于选择列表头，且保留拖动手柄', () => {
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name', width: 200 }]} dataSource={[{ key: '1', name: 'Ann' }]} pagination={false} resizable rowSelection={{ onHeaderCell: () => ({ class: 'selection-head' }) }} />);
        const th = query(`th.${P}-column-selection`);
        expect(th).toHaveClass('selection-head');
        expect(th.querySelector(`.${P}-resize-handle`)).not.toBeNull();
    });

    it('选择列与展开列 fixed 为 right 时排在最后', () => {
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name', width: 200 }]} dataSource={[{ key: '1', name: 'Ann' }]} expandCellFixed="right" hideExpandedColumn={false} pagination={false} resizable rowSelection={{ fixed: 'right' }} expandedRowRender={() => 'detail'} />);
        expect(getHandles().length).toBeGreaterThan(0);
        const headers = screen.getAllByRole('columnheader');
        expect(headers[0]).toHaveTextContent('Name');
        expect(within(headers.at(-1) as HTMLElement).getByRole('checkbox')).toBeInTheDocument();
    });

    it('JSX 写法的列照常渲染，并警告一次不支持调整列宽', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const [dataSource, setDataSource] = createSignal(getData(1));
        render(() => (
            <Table dataSource={dataSource()} pagination={false} resizable>
                <Column title="Name" dataIndex="name" width={200} />
            </Table>
        ));
        setDataSource(getData(2));
        expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
        expect(getBodyRows()).toHaveLength(2);
        expect(query(`.${P}-resize-handle`)).toBeNull();
        expect(warn.mock.calls.filter((args) => args.join(' ').includes('resizable'))).toHaveLength(1);
        warn.mockRestore();
    });

    it('resizable 属性不设置在根元素上', () => {
        render(() => (
            <>
                <Table data-testid="plain" columns={getColumns()} dataSource={getData(2)} resizable={false} />
                <Table data-testid="resizable" columns={getColumns()} dataSource={getData(2)} resizable />
            </>
        ));
        expect(screen.getByTestId('plain')).not.toHaveAttribute('resizable');
        expect(screen.getByTestId('resizable')).not.toHaveAttribute('resizable');
    });

    it('换成新的 components 对象而 body.row 不变时，行不重新挂载', () => {
        const mounts = vi.fn<() => void>();
        function BodyRow(props: JSX.HTMLAttributes<HTMLTableRowElement>) {
            onMount(() => mounts());
            return <tr {...props} />;
        }
        const [components, setComponents] = createSignal<TableComponents>({ body: { row: BodyRow } });
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name', width: 200 }]} components={components()} dataSource={[{ key: '1', name: 'Ann' }]} pagination={false} resizable />);
        expect(screen.getByText('Ann')).toBeInTheDocument();
        mounts.mockClear();
        setComponents({ body: { row: BodyRow } });
        expect(mounts).not.toHaveBeenCalled();
    });
});

describe('Table 拖动列宽', () => {
    const rows = [
        { key: '1', name: 'a' },
        { key: '2', name: 'b' },
    ];

    it('连续拖动列宽，onResize 收到每次的宽度，onResizeStop 收到最终宽度且不带拖动类名', () => {
        const onResize = vi.fn<ResizeFn<Row>>();
        const onResizeStop = vi.fn<ResizeFn<Row>>();
        render(() => (
            <Table
                columns={[
                    { title: 'Date', dataIndex: 'date', width: 200 },
                    { title: 'Note', dataIndex: 'note' },
                ]}
                dataSource={[{ key: 0, date: '2018-02-11' }]}
                resizable={{ onResize, onResizeStop }}
            />
        ));
        drag(getHandles()[0], 0, 30, 60);
        expect(onResize.mock.calls.map(([column]) => column.width)).toEqual([230, 260]);
        expect(onResizeStop).toHaveBeenCalledTimes(1);
        expect(onResizeStop.mock.calls[0][0]).toMatchObject({ width: 260 });
        expect(onResizeStop.mock.calls[0][0].class ?? '').not.toContain('resizing');
        expect(getColWidths()[0]).toBe('260px');
    });

    it('宽度不小于 20，RTL 下向左拖动变宽', () => {
        render(() => (
            <Table
                columns={[
                    { title: 'Date', dataIndex: 'date', width: 200 },
                    { title: 'Note', dataIndex: 'note', width: 100 },
                ]}
                dataSource={[{ key: 0, date: '2018-02-11' }]}
                resizable
            />
        ));
        drag(getHandles()[0], 300, 0);
        expect(getColWidths()[0]).toBe('20px');
        query(`.${P}-thead`).style.direction = 'rtl';
        drag(getHandles()[1], 300, 250);
        expect(getColWidths()[1]).toBe('150px');
    });

    it('点击拖动手柄不触发排序', async () => {
        const sorter = vi.fn<(a: Row, b: Row) => number>((a, b) => a.name.localeCompare(b.name));
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name', width: 200, sorter }]} dataSource={rows} pagination={false} resizable />);
        await userEvent.click(getHandles()[0]);
        expect(sorter).not.toHaveBeenCalled();
        expect(screen.getByRole('columnheader', { name: /Name/ })).not.toHaveAttribute('aria-sort');
    });

    it('未拖动的列跟随 columns 的 width，拖动过的列保留拖动宽度', () => {
        const getColumnsWith = (noteWidth: number): ColumnProps[] => [
            { title: 'Date', dataIndex: 'date', width: 200 },
            { title: 'Note', dataIndex: 'note', width: noteWidth },
        ];
        const [columns, setColumns] = createSignal(getColumnsWith(100));
        render(() => <Table columns={columns()} dataSource={[{ key: 0, date: '2018-02-11', note: 'n' }]} resizable />);
        drag(getHandles()[0], 0, 60);
        expect(getColWidths()).toEqual(['260px', '100px']);
        setColumns(getColumnsWith(300));
        expect(getColWidths()).toEqual(['260px', '300px']);
    });

    it('onResizeStart 返回的 class 保留，拖动类名在拖动结束后移除', () => {
        render(() => <Table columns={[{ title: 'Date', dataIndex: 'date', width: 200 }]} dataSource={[{ key: 0, date: '2018-02-11' }]} resizable={{ onResizeStart: (column) => ({ class: `${column.class ?? ''} mine` }) }} />);
        const handle = getHandles()[0];
        const header = () => screen.getByRole('columnheader', { name: 'Date' });
        fireEvent.pointerDown(handle, { button: 0, clientX: 0, pointerId: 1 });
        expect(header()).toHaveClass('resizing', 'mine');
        fireEvent.lostPointerCapture(handle, { pointerId: 1 });
        expect(header()).toHaveClass('mine');
        expect(header()).not.toHaveClass('resizing');
    });

    it('handlerClassName 替换拖动中的类名', () => {
        render(() => <Table columns={[{ title: 'Date', dataIndex: 'date', width: 200 }]} dataSource={[{ key: 0, date: '2018-02-11' }]} resizable={{ handlerClassName: 'dragging' }} />);
        const handle = getHandles()[0];
        fireEvent.pointerDown(handle, { button: 0, clientX: 0, pointerId: 1 });
        expect(screen.getByRole('columnheader', { name: 'Date' })).toHaveClass('dragging');
        fireEvent.lostPointerCapture(handle, { pointerId: 1 });
        expect(screen.getByRole('columnheader', { name: 'Date' })).not.toHaveClass('dragging');
    });

    it('拖动列宽与受控选中行时，表体单元格保留 DOM', async () => {
        const [selectedRowKeys, setSelectedRowKeys] = createSignal<(string | number)[]>([]);
        render(() => (
            <Table
                columns={[
                    { title: 'Name', dataIndex: 'name', width: 200 },
                    { title: 'Key', dataIndex: 'key', width: 100 },
                ]}
                dataSource={rows}
                pagination={false}
                resizable
                rowSelection={{ selectedRowKeys: selectedRowKeys(), onChange: (keys) => setSelectedRowKeys(keys ?? []) }}
            />
        ));
        const cell = screen.getByText('a').closest('td');
        drag(getHandles()[1], 0, 40);
        expect(getColWidths()[1]).toBe('240px');
        expect(screen.getByText('a').closest('td')).toBe(cell);
        await userEvent.click(within(getBodyRows()[0]).getByRole('checkbox'));
        expect(within(getBodyRows()[0]).getByRole('checkbox')).toBeChecked();
        expect(screen.getByText('a').closest('td')).toBe(cell);
    });

    it('列的 onHeaderCell 在拖动后重新调用，收到拖动后的列', () => {
        const onHeaderCell = vi.fn<NonNullable<ColumnProps['onHeaderCell']>>((column) => ({ class: `w-${column?.width}` }));
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name', width: 200, onHeaderCell }]} dataSource={rows} pagination={false} resizable />);
        expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveClass('w-200');
        drag(getHandles()[0], 0, 50);
        expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveClass('w-250');
    });
});
