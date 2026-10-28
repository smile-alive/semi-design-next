import { type JSX, createSignal, onMount } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { getGroupData } from '@test/utils/solid';
import Table from '..';
import type { ColumnProps, TableProps } from '../interface';
import { P, getBodyRows, getExpandedRowKeys, getGroupColumns, query, queryAll } from './table-helpers';

type Row = Record<string, any>;

const rowKey = (record: Row) => `${record.city && record.city.toLowerCase()}-${record.job && record.job.toLowerCase()}`;
const getSections = () => queryAll(`.${P}-tbody .${P}-row-section`);
const getOpenSections = () => queryAll(`.${P}-tbody .${P}-row-section.on`);

const getFileData = (total: number) =>
    Array.from({ length: total }, (_, i) => ({
        key: `${i}`,
        name: i % 2 === 0 ? `Semi Design 设计稿${i}.fig` : `Semi Pro 设计稿${i}.fig`,
        owner: i % 2 === 0 ? '姜鹏志' : '郝宣',
        size: (i * 1000) % 199,
    }));

describe('Table 分组', () => {
    it('分组数据', async () => {
        const groupedRowClick = vi.fn<(event: MouseEvent) => void>();
        render(() => <Table clickGroupedRowToExpand columns={getGroupColumns()} dataSource={getGroupData()} groupBy="city" rowKey={rowKey} scroll={{ y: 480 }} renderGroupSection={(groupKey) => <strong>Jobs in {groupKey}:</strong>} onGroupedRow={() => ({ onClick: groupedRowClick })} />);
        expect(getSections()).toHaveLength(4);
        expect(getBodyRows()).toHaveLength(0);
        await userEvent.click(getSections()[0]);
        expect(groupedRowClick).toHaveBeenCalledTimes(1);
        expect(getBodyRows().length).toBeGreaterThan(0);
    });

    it('分组数据变化 dataSource', async () => {
        const [dataSource, setDataSource] = createSignal<Row[]>(getGroupData());
        render(() => <Table clickGroupedRowToExpand columns={getGroupColumns()} dataSource={dataSource()} groupBy="city" rowKey={rowKey} scroll={{ y: 480 }} renderGroupSection={(groupKey) => <strong>Jobs in {groupKey}:</strong>} />);
        setDataSource([
            { city: 'Tianjin', job: 'FE', department: 'IES' },
            { city: 'Tianjin', job: 'Android', department: 'IES' },
            { city: 'Wuhan', job: 'Android', department: 'IES' },
            { city: 'Wuhan', job: 'SE', department: 'EE' },
            { city: 'Chengdu', job: 'Android', department: 'EE' },
            { city: 'Chengdu', job: 'IOS', department: 'EE' },
            { city: 'Xiamen', job: 'SE', department: 'DATA' },
            { city: 'Xiamen', job: 'IOS', department: 'DATA' },
        ]);
        expect(getSections()).toHaveLength(4);
        expect(screen.getByText('Jobs in Tianjin:')).toBeInTheDocument();
        expect(getBodyRows()).toHaveLength(0);
        await userEvent.click(getSections()[0]);
        expect(getBodyRows()).toHaveLength(2);
    });

    it('defaultExpandAllGroupRows', () => {
        const data = getGroupData();
        render(() => <Table columns={getGroupColumns()} dataSource={data} defaultExpandAllGroupRows groupBy="city" rowKey={rowKey} scroll={{ y: 480 }} renderGroupSection={(groupKey) => <strong>Jobs in {groupKey}:</strong>} />);
        expect(getOpenSections()).toHaveLength(new Set(data.map((item) => item.city)).size);
    });

    it('expandAllGroupRows', () => {
        const data = getGroupData();
        const [dataSource, setDataSource] = createSignal<Row[]>([]);
        const [expandAll, setExpandAll] = createSignal(true);
        render(() => <Table columns={getGroupColumns()} dataSource={dataSource()} expandAllGroupRows={expandAll()} groupBy="city" rowKey={rowKey} scroll={{ y: 480 }} renderGroupSection={(groupKey) => <strong>Jobs in {groupKey}:</strong>} />);
        setDataSource(data);
        expect(getOpenSections()).toHaveLength(new Set(data.map((item) => item.city)).size);
        setExpandAll(false);
        expect(getOpenSections()).toHaveLength(0);
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
        const [state, setState] = createSignal<{ dataSource: Row[]; expandedRowKeys: string[] }>({ dataSource: [], expandedRowKeys: ['Semi Design 设计稿.fig'] });
        render(() => (
            <Table
                columns={[
                    { title: '标题', dataIndex: 'name' },
                    { title: '大小', dataIndex: 'size' },
                ]}
                dataSource={state().dataSource}
                defaultExpandAllGroupRows={defaultExpandAllGroupRows}
                expandedRowKeys={state().expandedRowKeys}
                groupBy="size"
                pagination={false}
                rowKey="name"
                expandedRowRender={(record) => <div>detail of {record?.name}</div>}
                renderGroupSection={(groupKey) => <strong>group {groupKey}</strong>}
            />
        ));
        setState({ dataSource: data, expandedRowKeys: ['2M', '34KB', 'Semi Design 设计稿.fig'] });
        expect(queryAll(`.${P}-row-section.on`)).toHaveLength(2);
        expect(getExpandedRowKeys()).toEqual(['Semi Design 设计稿.fig']);
        expect(screen.getByText('detail of Semi Design 设计稿.fig')).toBeInTheDocument();
        expect(screen.queryByText('detail of 设计文档')).not.toBeInTheDocument();
    });

    it('fix #2185：onGroupedRow 的 class 应用到分组区块行', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        render(() => (
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
                onGroupedRow={() => ({ class: 'test-group', onClick })}
            />
        ));
        const sections = getSections();
        expect(sections).toHaveLength(2);
        sections.forEach((section) => expect(section).toHaveClass('test-group'));
        await userEvent.click(screen.getByText('group 姜鹏志'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Semi Design 设计稿0.fig')).toBeInTheDocument();
    });

    it('分组按数据中首次出现的顺序渲染，分组行的 records 为该组的原始记录', () => {
        const onGroupedRow = vi.fn<(record: { groupKey: string | number; records: Row[] }, index: number) => object>(() => ({}));
        const dataSource = [
            { key: '1', city: 'B', name: 'b1' },
            { key: '2', city: 'A', name: 'a1' },
            { key: '3', city: 'B', name: 'b2' },
        ];
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={dataSource} defaultExpandAllGroupRows groupBy="city" pagination={false} renderGroupSection={(groupKey) => <strong>group {groupKey}</strong>} onGroupedRow={onGroupedRow} />);
        expect(queryAll(`.${P}-tbody tr`).map((row) => row.textContent)).toEqual(['group B', 'b1', 'b2', 'group A', 'a1']);
        const sections = onGroupedRow.mock.calls.map(([record]) => record);
        expect(sections.at(-2)).toEqual({ groupKey: 'B', records: [dataSource[0], dataSource[2]] });
        expect(sections.at(-1)).toEqual({ groupKey: 'A', records: [dataSource[1]] });
        expect(sections.at(-2)?.records[0]).toBe(dataSource[0]);
        expect(onGroupedRow.mock.calls.at(-2)?.[1]).toBe(0);
        expect(onGroupedRow.mock.calls.at(-1)?.[1]).toBe(1);
    });

    it('renderGroupSection 返回字符串时作为分组行内容显示', () => {
        render(() => (
            <Table
                columns={[{ title: 'Name', dataIndex: 'name' }]}
                dataSource={[
                    { key: '1', name: 'a', size: 1 },
                    { key: '2', name: 'b', size: 1 },
                ]}
                defaultExpandAllGroupRows
                groupBy="size"
                pagination={false}
                renderGroupSection={(groupKey) => `group ${groupKey}`}
            />
        ));
        expect(screen.getByText('group 1')).toBeInTheDocument();
    });

    // RenderGroupSection's `{ children: JSX.Element } & ColumnProps` cannot be satisfied (ColumnProps.children is the sub-column list), so the object form is cast
    it('renderGroupSection 返回 { children, onCell } 对象时，children 作为分组行内容，其余字段作用于该单元格', () => {
        render(() => (
            <Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={[{ key: '1', name: 'a', size: 1 }]} defaultExpandAllGroupRows groupBy="size" pagination={false} renderGroupSection={(groupKey) => ({ children: `group ${groupKey}`, onCell: () => ({ title: 'section-tip' }) }) as unknown as JSX.Element} />
        ));
        expect(screen.getByText('group 1').closest('td')).toHaveAttribute('title', 'section-tip');
    });

    it('expandedRowRender 返回 { children, onCell } 对象时，children 作为展开行内容，其余字段作用于该单元格', () => {
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={[{ key: '1', name: 'a' }]} defaultExpandAllRows pagination={false} expandedRowRender={() => ({ children: 'detail', onCell: () => ({ title: 'expanded-tip' }) })} />);
        expect(screen.getByText('detail').closest('td')).toHaveAttribute('title', 'expanded-tip');
    });

    it('分组 key 为 0 时分组行与其他分组并存', () => {
        render(() => (
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
        ));
        expect(screen.getByText('group 0')).toBeInTheDocument();
        expect(screen.getByText('group 1')).toBeInTheDocument();
        expect(getSections()).toHaveLength(2);
    });

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
        render(() => <Table columns={[{ title: 'Name', dataIndex: 'name', sorter: (x, y) => x.name.localeCompare(y.name), sortChildrenRecord: true, defaultSortOrder: 'ascend' }]} dataSource={dataSource} defaultExpandAllRows groupBy="size" pagination={false} renderGroupSection={(groupKey) => `group ${groupKey}`} />);
        expect(getBodyRows().map((row) => row.textContent)).toEqual(['parent', 'child a', 'child b']);
    });

    it('rowSelection.clickRow 点击分组行与展开行不选中它们', async () => {
        const onChange = vi.fn<NonNullable<Extract<TableProps['rowSelection'], object>['onChange']>>();
        render(() => (
            <Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={[{ key: '1', name: 'Ann', size: '2M' }]} defaultExpandAllRows groupBy="size" pagination={false} rowSelection={{ clickRow: true, onChange }} expandedRowRender={() => 'detail'} renderGroupSection={(groupKey) => `group ${groupKey}`} />
        ));
        await userEvent.click(screen.getByText('group 2M'));
        await userEvent.click(screen.getByText('detail'));
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(screen.getByText('Ann'));
        expect(onChange).toHaveBeenLastCalledWith(['1'], [expect.objectContaining({ key: '1' })]);
    });
});

describe('Table 分组时的 onExpandedRowsChange', () => {
    const recordExpandIcon = () => query(`.${P}-tbody .${P}-row:not(.${P}-row-section) .${P}-expand-icon`);

    it('展开记录行时，保留所有已展开分组在 rows 中', async () => {
        const groupData = [
            { key: '1', name: 'a.fig', size: '2M' },
            { key: '2', name: 'b.fig', size: '2M' },
            { key: '3', name: 'c.fig', size: '34KB' },
        ];
        const onExpandedRowsChange = vi.fn<NonNullable<TableProps['onExpandedRowsChange']>>();
        render(() => (
            <Table
                columns={[
                    { title: '标题', dataIndex: 'name' },
                    { title: '大小', dataIndex: 'size' },
                ]}
                dataSource={groupData}
                defaultExpandAllGroupRows
                groupBy="size"
                pagination={false}
                expandedRowRender={(record) => <div>detail of {record?.name}</div>}
                renderGroupSection={(groupKey) => <strong>group {groupKey}</strong>}
                onExpandedRowsChange={onExpandedRowsChange}
            />
        ));
        await userEvent.click(recordExpandIcon());
        expect(onExpandedRowsChange).toHaveBeenCalledTimes(1);
        expect(onExpandedRowsChange.mock.calls[0][0]).toEqual([groupData[0], { groupKey: '2M' }, { groupKey: '34KB' }]);
    });

    it('不把已展开的记录 key 报告为分组', async () => {
        const groupData = [
            { key: '1', name: 'a.fig', size: '2M' },
            { key: '2', name: 'b.fig', size: '34KB' },
        ];
        const onExpandedRowsChange = vi.fn<NonNullable<TableProps['onExpandedRowsChange']>>();
        render(() => (
            <Table
                clickGroupedRowToExpand
                columns={[{ title: '标题', dataIndex: 'name' }]}
                dataSource={groupData}
                defaultExpandAllGroupRows
                groupBy="size"
                pagination={false}
                expandedRowRender={(record) => <div>detail of {record?.name}</div>}
                renderGroupSection={(groupKey) => <strong>group {groupKey}</strong>}
                onExpandedRowsChange={onExpandedRowsChange}
            />
        ));
        await userEvent.click(recordExpandIcon());
        await userEvent.click(screen.getByText('group 34KB'));
        expect(onExpandedRowsChange).toHaveBeenCalledTimes(2);
        expect(onExpandedRowsChange.mock.calls[1][0]).toEqual([groupData[0], { groupKey: '2M' }]);
    });
});

describe('Table 分组的展开状态', () => {
    const files = [
        { key: '1', name: 'b.fig', size: '2M' },
        { key: '2', name: 'a.fig', size: '2M' },
        { key: '3', name: 'c.doc', size: '34KB' },
    ];

    it('点击排序不会让已收起的分组重新展开', async () => {
        const columns: ColumnProps[] = [
            { title: '标题', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
            { title: '大小', dataIndex: 'size' },
        ];
        render(() => <Table clickGroupedRowToExpand columns={columns} dataSource={files} defaultExpandAllRows groupBy="size" pagination={false} renderGroupSection={(groupKey) => <strong>group {groupKey}</strong>} />);
        expect(screen.getByText('a.fig')).toBeInTheDocument();
        await userEvent.click(screen.getByText('group 2M'));
        expect(screen.queryByText('a.fig')).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: '标题' }));
        expect(screen.queryByText('a.fig')).not.toBeInTheDocument();
        expect(screen.getByText('c.doc')).toBeInTheDocument();
    });
});

describe('Table defaultExpandAllRows 与分组', () => {
    const files = [
        { key: '1', name: 'a.fig', size: '2M' },
        { key: '2', name: 'b.doc', size: '34KB' },
    ];
    const nameColumns = (): ColumnProps[] => [{ title: '标题', dataIndex: 'name' }];
    // a getter in props keeps that prop reactive
    const renderTable = (props: Partial<TableProps> = {}) => render(() => <Table clickGroupedRowToExpand columns={nameColumns()} dataSource={files} defaultExpandAllRows groupBy="size" pagination={false} renderGroupSection={(groupKey) => <strong>group {groupKey}</strong>} {...props} />);

    it('收起分组后换成同内容的新 columns，分组保持收起', async () => {
        const [columns, setColumns] = createSignal(nameColumns());
        renderTable({
            get columns() {
                return columns();
            },
        });
        await userEvent.click(screen.getByText('group 2M'));
        expect(screen.queryByText('a.fig')).not.toBeInTheDocument();

        setColumns(nameColumns());
        expect(screen.queryByText('a.fig')).not.toBeInTheDocument();
        expect(screen.getByText('b.doc')).toBeInTheDocument();
    });

    it('收起前面的分组时，后面分组的行不重新挂载', async () => {
        const mounts = vi.fn<(name: string) => void>();
        function Name(props: { name: string }) {
            onMount(() => mounts(props.name));
            return <span>{props.name}</span>;
        }
        renderTable({ columns: [{ title: '标题', dataIndex: 'name', render: (text) => <Name name={text} /> }] });
        mounts.mockClear();
        await userEvent.click(screen.getByText('group 2M'));
        expect(screen.getByText('b.doc')).toBeInTheDocument();
        expect(mounts).not.toHaveBeenCalled();
    });

    it('受控的 expandedRowKeys 不被 defaultExpandAllRows 改写', () => {
        const [dataSource, setDataSource] = createSignal(files);
        renderTable({
            get dataSource() {
                return dataSource();
            },
            expandedRowKeys: ['34KB'],
        });
        setDataSource([...files]);
        expect(screen.queryByText('a.fig')).not.toBeInTheDocument();
        expect(screen.getByText('b.doc')).toBeInTheDocument();
    });

    it('受控的 expandedRowKeys 配 expandAllGroupRows 时，挂载即展开全部分组', () => {
        renderTable({ defaultExpandAllRows: false, expandAllGroupRows: true, expandedRowKeys: [] });
        expect(screen.getByText('a.fig')).toBeInTheDocument();
        expect(screen.getByText('b.doc')).toBeInTheDocument();
    });
});

describe('Table 分组的滚动条宽度测量', () => {
    it('有固定列的分组行与展开行，重新渲染不再测量滚动条', () => {
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
                groupBy="size"
                pagination={false}
                scroll={{ x: 1000 }}
                expandedRowRender={() => 'detail'}
            />
        ));
        const afterMount = measures();
        setDataSource(files.map((file) => ({ ...file })));
        setDataSource(files.map((file) => ({ ...file })));
        expect(document.querySelectorAll(`.${P}-section-inner, .${P}-expand-inner`)).not.toHaveLength(0);
        expect(measures()).toBe(afterMount);
        append.mockRestore();
    });
});
