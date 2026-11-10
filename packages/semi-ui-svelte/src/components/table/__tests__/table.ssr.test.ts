import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { Table } from '..';
import type { ColumnProps } from '../interface';

const columns: ColumnProps[] = [
    { title: 'Name', dataIndex: 'name', sorter: true },
    { title: 'Age', dataIndex: 'age' },
];
const dataSource = [
    { key: '1', name: 'John', age: 32 },
    { key: '2', name: 'Jim', age: 42 },
];

describe('Svelte Table 服务端首帧', () => {
    it('首帧输出表头、数据行与排序按钮，名称落在 table 上', () => {
        const { body } = render(Table, { props: { columns, dataSource, 'aria-label': '用户' } });
        expect(body).toMatch(/<table[^>]*aria-label="用户"/);
        expect(body).toContain('role="columnheader"');
        expect(body).toMatch(/data-row-key="1"/);
        expect(body).toMatch(/data-row-key="2"/);
        expect(body).toContain('semi-table-column-sorter-wrapper');
        expect(body).toContain('semi-page');
    });

    it('传 groupBy 时首帧已有分组行', () => {
        const grouped = [...dataSource, { key: '3', name: 'Jake', age: 32 }];
        const { body } = render(Table, { props: { columns, dataSource: grouped, groupBy: 'age', pagination: false } });
        expect(body.match(/semi-table-row-section/g)).toHaveLength(2);
    });

    it('首帧带选择列与树形数据的展开按钮', () => {
        const tree = [{ ...dataSource[0], children: [dataSource[1]] }];
        const { body } = render(Table, { props: { columns, dataSource: tree, rowSelection: {}, pagination: false } });
        expect(body).toContain('aria-label="全选所有行"');
        expect(body).toContain('aria-label="选择此行"');
        expect(body).toMatch(/<button[^>]*aria-expanded="false"[^>]*class="semi-table-expand-icon"/);
    });

    it('首帧已应用默认展开与默认选中键', () => {
        const tree = [
            {
                key: 'parent',
                name: 'parent',
                children: [
                    { key: 'child-1', name: 'child-1' },
                    { key: 'child-2', name: 'child-2' },
                ],
            },
        ];
        const expanded = render(Table, { props: { columns, dataSource: tree, childrenRecordName: 'children', pagination: false, defaultExpandAllRows: true } });
        expect(expanded.body).toContain('data-row-key="child-2"');

        const selected = render(Table, { props: { columns, dataSource: tree[0].children, pagination: false, rowSelection: { defaultSelectedRowKeys: ['child-1'] } } });
        expect(selected.body.match(/semi-checkbox-inner-checked/g)).toHaveLength(1);

        const related = render(Table, {
            props: { columns, dataSource: tree, childrenRecordName: 'children', pagination: false, defaultExpandAllRows: true, rowSelection: { checkRelation: 'related', defaultSelectedRowKeys: ['parent'] } },
        });
        expect(related.body.match(/semi-checkbox-inner-checked/g)).toHaveLength(4);
    });

    it('空数据首帧显示空状态，固定表头首帧输出拆分的表', () => {
        const { body } = render(Table, { props: { columns, dataSource: [], scroll: { y: 200 } } });
        expect(body).toContain('semi-table-empty');
        expect(body).toMatch(/class="[^"]*semi-table-container[^"]*"[^>]*role="table"|role="table"[^>]*class="[^"]*semi-table-container/);
    });
});
