import type { JSX } from 'solid-js';
import { expect, expectTypeOf, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import Table from '..';
import type { ColumnProps, ColumnTitleProps, RenderOptions, RowSelectionRenderCell } from '../interface';

interface Row {
    key: string;
    name: string;
}

const rows: Row[] = [
    { key: '1', name: 'Alpha' },
    { key: '2', name: 'Beta' },
];

const filters = [{ text: 'A', value: 'A' }];

it('类型：表头与单元格的默认节点是渲染函数', () => {
    expectTypeOf<NonNullable<ColumnTitleProps['sorter']>>().toEqualTypeOf<() => JSX.Element>();
    expectTypeOf<NonNullable<ColumnTitleProps['filter']>>().toEqualTypeOf<() => JSX.Element>();
    expectTypeOf<NonNullable<ColumnTitleProps['selection']>>().toEqualTypeOf<() => JSX.Element>();
    expectTypeOf<NonNullable<RenderOptions['expandIcon']>>().toEqualTypeOf<() => JSX.Element>();
    expectTypeOf<NonNullable<RenderOptions['selection']>>().toEqualTypeOf<() => JSX.Element>();
    expectTypeOf<NonNullable<RenderOptions['indentText']>>().toEqualTypeOf<() => JSX.Element>();
    expectTypeOf<Parameters<RowSelectionRenderCell<Row>>[0]['originNode']>().toEqualTypeOf<() => JSX.Element>();
});

it('useFullRender 的 title 在插入处调用 sorter、selection', async () => {
    const columns: ColumnProps<Row>[] = [
        {
            dataIndex: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
            useFullRender: true,
            title: (parts) => (
                <span class="custom-title">
                    {parts.selection?.()}
                    Name
                    {parts.sorter?.()}
                </span>
            ),
        },
    ];
    const { html, errors } = await renderServer({ render: () => <Table columns={columns} dataSource={rows} rowSelection={{}} pagination={false} /> });
    expect(errors).toEqual([]);
    expect(html).toContain('custom-title');
    expect(html).toContain('semi-table-column-sorter');
});

it('useFullRender 的 title 取出 filter 但不调用时，不创建筛选按钮', async () => {
    const created: boolean[] = [];
    const columns: ColumnProps<Row>[] = [
        {
            dataIndex: 'name',
            filters,
            onFilter: () => true,
            filterIcon: (filtered) => {
                created.push(filtered);
                return <i />;
            },
            useFullRender: true,
            // reading the field only to test it must not create the button
            title: (parts) => <span data-has-filter={parts.filter ? '' : undefined}>Name</span>,
        },
    ];
    const { html, errors } = await renderServer({ render: () => <Table columns={columns} dataSource={rows} pagination={false} /> });
    expect(errors).toEqual([]);
    expect(html).toContain('data-has-filter');
    expect(created).toEqual([]);
});

it('useFullRender 的 render 在插入处调用 selection', async () => {
    const columns: ColumnProps<Row>[] = [
        {
            dataIndex: 'name',
            useFullRender: true,
            render: (text, _record, _index, options) => (
                <span class="custom-cell">
                    {options.selection?.()}
                    {text}
                </span>
            ),
        },
    ];
    const { html, errors } = await renderServer({ render: () => <Table columns={columns} dataSource={rows} rowSelection={{ hidden: true }} pagination={false} /> });
    expect(errors).toEqual([]);
    expect(html.match(/class="custom-cell"/g)).toHaveLength(2);
    expect(html.match(/semi-checkbox-inner/g)).toBeTruthy();
});

it('rowSelection.renderCell 在插入处调用 originNode', async () => {
    const columns: ColumnProps<Row>[] = [{ title: 'Name', dataIndex: 'name' }];
    const { html, errors } = await renderServer({
        render: () => <Table columns={columns} dataSource={rows} rowSelection={{ renderCell: (cell) => <div class="custom-selection">{cell.originNode()}</div> }} pagination={false} />,
    });
    expect(errors).toEqual([]);
    // the header cell and the two rows
    expect(html.match(/class="custom-selection"/g)).toHaveLength(3);
    expect(html.match(/semi-checkbox-inner/g)).toBeTruthy();
});
