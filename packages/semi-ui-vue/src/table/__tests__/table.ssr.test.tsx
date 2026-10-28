/** @jsxImportSource vue */
import { expect, it } from 'vite-plus/test';
import { renderOnServer } from '@test/utils/vue.ssr';
import Table from '..';

const dataSource = [{ key: '1', name: 'Alice' }];

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
