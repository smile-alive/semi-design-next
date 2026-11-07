/** @jsxImportSource vue */
import { nextTick } from 'vue';
import { describe, expect, it } from 'vite-plus/test';
import { TableColumn } from '../index';
import { firstCellTexts, mountTable } from './table-helpers';

const dataSource = [
    { key: '1', name: 'b' },
    { key: '2', name: 'c' },
    { key: '3', name: 'a' },
];

// nextTick covers the second init in onMounted, which must not rewrite the default expanded and selected keys
describe('Table 子列挂载后的默认值', () => {
    it('子列的 defaultSortOrder 生效', async () => {
        mountTable({ dataSource, pagination: false }, { default: () => [<TableColumn title="Name" dataIndex="name" sorter={(x: any, y: any) => x.name.localeCompare(y.name)} defaultSortOrder="ascend" />] });
        await nextTick();
        expect(firstCellTexts()).toEqual(['a', 'b', 'c']);
    });

    it('子列的 defaultFilteredValue 生效', async () => {
        mountTable({ dataSource, pagination: false }, { default: () => [<TableColumn title="Name" dataIndex="name" filters={[{ text: 'a', value: 'a' }]} onFilter={(v: any, r: any) => r.name === v} defaultFilteredValue={['a']} />] });
        await nextTick();
        expect(firstCellTexts()).toEqual(['a']);
    });

    it('使用子列时 defaultExpandedRowKeys 生效', async () => {
        mountTable({ dataSource, pagination: false, defaultExpandedRowKeys: ['1'] }, { default: () => [<TableColumn title="Name" dataIndex="name" />], expandedRow: ({ record }: any) => [<p>{`detail ${record.name}`}</p>] });
        await nextTick();
        expect(document.body.textContent).toContain('detail b');
    });

    it('使用 columns 属性时 defaultExpandedRowKeys 生效', async () => {
        mountTable({ columns: [{ title: 'Name', dataIndex: 'name' }], dataSource, pagination: false, defaultExpandedRowKeys: ['1'] }, { expandedRow: ({ record }: any) => [<p>{`detail ${record.name}`}</p>] });
        await nextTick();
        expect(document.body.textContent).toContain('detail b');
    });
});
