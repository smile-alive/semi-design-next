/** @jsxImportSource vue */
import { expect, it } from 'vite-plus/test';
import { renderOnServer } from '@test/utils/vue.ssr';
import Table from '..';

const dataSource = [{ key: '1', name: 'Alice' }];

it('传 groupBy 时服务端首帧已有分组行', async () => {
    const grouped = [
        { key: '1', name: 'Alice', city: 'A' },
        { key: '2', name: 'Bob', city: 'B' },
        { key: '3', name: 'Carol', city: 'A' },
    ];
    const { html } = await renderOnServer(() => <Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={grouped} groupBy="city" pagination={false} />);
    expect(html.match(/semi-table-row-section/g)).toHaveLength(2);
});

it('用 Table.Column 子列写法时服务端首帧的表头与数据行列数一致', async () => {
    const { html } = await renderOnServer(() => (
        <Table dataSource={[{ key: '1', name: 'Alice', age: 18 }]} pagination={false}>
            <Table.Column title="Name" dataIndex="name" />
            <Table.Column title="Age" dataIndex="age" />
        </Table>
    ));
    expect(html.match(/<th\b/g)).toHaveLength(2);
    expect(html.match(/<td\b/g)).toHaveLength(2);
    expect(html).toContain('Alice');
    expect(html).toContain('18');
});

it('用 Table.Column 子列写法时服务端首帧已应用 defaultSortOrder 与 defaultFilteredValue', async () => {
    const rows = [
        { key: '1', name: 'b' },
        { key: '2', name: 'c' },
        { key: '3', name: 'a' },
    ];
    const sorted = await renderOnServer(() => (
        <Table dataSource={rows} pagination={false}>
            <Table.Column title="Name" dataIndex="name" sorter={(x: any, y: any) => x.name.localeCompare(y.name)} defaultSortOrder="ascend" />
        </Table>
    ));
    expect(sorted.html.match(/<td\b[^>]*title="(\w)"/g)?.map((cell) => cell.at(-2))).toEqual(['a', 'b', 'c']);

    const filtered = await renderOnServer(() => (
        <Table dataSource={rows} pagination={false}>
            <Table.Column title="Name" dataIndex="name" filters={[{ text: 'a', value: 'a' }]} onFilter={(value: any, record: any) => record.name === value} defaultFilteredValue={['a']} />
        </Table>
    ));
    expect(filtered.html.match(/<td\b/g)).toHaveLength(1);
});

it('虚拟化表体在列声明了数值 width 时服务端已渲染行', async () => {
    const { html, warnings } = await renderOnServer(() => <Table columns={[{ title: 'Name', dataIndex: 'name', width: 120 }]} dataSource={dataSource} pagination={false} scroll={{ y: 200 }} virtualized />);
    expect(warnings).toEqual([]);
    expect(html).toContain('Alice');
});

it('虚拟化表体带 rowSelection 或展开列时，内部列取默认宽度，服务端已渲染行', async () => {
    const columns = [{ title: 'Name', dataIndex: 'name', width: 120 }];
    const selection = await renderOnServer(() => <Table columns={columns} dataSource={dataSource} pagination={false} rowSelection scroll={{ y: 200 }} virtualized />);
    expect(selection.warnings).toEqual([]);
    expect(selection.html).toContain('Alice');

    const expandable = await renderOnServer(() => <Table columns={columns} dataSource={dataSource} expandedRowRender={() => 'detail'} pagination={false} scroll={{ y: 200 }} virtualized />);
    expect(expandable.warnings).toEqual([]);
    expect(expandable.html).toContain('Alice');
});

it('虚拟化表体首帧的行宽取选择列自身声明的 width，未声明时取默认宽度', async () => {
    const declared = await renderOnServer(() => (
        <Table
            columns={[
                { key: 'column-selection', width: 100 },
                { title: 'Name', dataIndex: 'name', width: 120 },
            ]}
            dataSource={dataSource}
            pagination={false}
            rowSelection
            scroll={{ y: 200 }}
            virtualized
        />
    ));
    expect(declared.html).toContain('width:220px');

    const fallback = await renderOnServer(() => <Table columns={[{ title: 'Name', dataIndex: 'name', width: 120 }]} dataSource={dataSource} pagination={false} rowSelection scroll={{ y: 200 }} virtualized />);
    expect(fallback.html).toContain('width:180px');
});

it('虚拟化表体有列未声明数值 width 时，服务端不渲染行，挂载后测量再渲染', async () => {
    const { html } = await renderOnServer(() => <Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={dataSource} pagination={false} scroll={{ y: 200 }} virtualized />);
    expect(html).not.toContain('Alice');
});
