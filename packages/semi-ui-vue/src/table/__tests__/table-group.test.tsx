/** @jsxImportSource vue */
import { nextTick } from 'vue';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { getGroupData } from '@test/utils/vue';
import type { ColumnProps, TableEmits, TableExpandedRowSlotProps, TableProps } from '..';
import { P, mountTable, query, queryAll, type Row } from './table-helpers';

type ExpandedRowsChange = (...args: TableEmits['expandedRowsChange']) => void;

const groupColumns = (): ColumnProps[] => [
    { dataIndex: 'city', title: 'City', width: 400, sorter: (a, b) => (a.city > b.city ? 1 : -1) },
    {
        dataIndex: 'job',
        title: 'Job',
        width: 200,
        filters: [
            { text: 'IOS', value: 'IOS' },
            { text: 'Android', value: 'Android' },
        ],
        onFilter: (value, record) => record.job && record.job.indexOf(value) === 0,
    },
    { dataIndex: 'department', title: 'Department' },
];
const rowKey = (record: Row) => `${record.city && record.city.toLowerCase()}-${record.job && record.job.toLowerCase()}`;
const jobsIn = { groupSection: ({ groupKey }: { groupKey: string }) => [<strong>{`Jobs in ${groupKey}:`}</strong>] };
const groupOf = { groupSection: ({ groupKey }: { groupKey: string }) => [<strong>{`group ${groupKey}`}</strong>] };
const getSections = () => queryAll(`.${P}-row-section`);
const getFileData = (total: number) =>
    Array.from({ length: total }, (_, i) => ({
        key: `${i}`,
        name: i % 2 === 0 ? `Semi Design 设计稿${i}.fig` : `Semi Pro 设计稿${i}.fig`,
        owner: i % 2 === 0 ? '姜鹏志' : '郝宣',
    }));
const firstRecordExpandIcon = () => query(`.${P}-tbody .${P}-row:not(.${P}-row-section) .${P}-expand-icon`);

describe('Table 分组', () => {
    it('分组数据', async () => {
        const groupedRowClick = vi.fn<(event: MouseEvent) => void>();
        mountTable(
            {
                clickGroupedRowToExpand: true,
                columns: groupColumns(),
                dataSource: getGroupData(),
                groupBy: 'city',
                rowKey,
                scroll: { y: 480 },
                onGroupedRow: () => ({ onClick: groupedRowClick }),
            },
            jobsIn
        );
        await nextTick();
        expect(getSections()).toHaveLength(4);
        expect(queryAll(`.${P}-body .${P}-row`)).toHaveLength(0);
        await userEvent.click(getSections()[0]);
        expect(groupedRowClick).toHaveBeenCalledTimes(1);
        expect(queryAll(`.${P}-row`).length).toBeGreaterThan(0);
    });

    it('分组数据变化 dataSource', async () => {
        const table = mountTable(
            {
                clickGroupedRowToExpand: true,
                columns: groupColumns(),
                dataSource: getGroupData(),
                groupBy: 'city',
                rowKey,
                scroll: { y: 480 },
                onGroupedRow: () => ({ onClick: vi.fn<(event: MouseEvent) => void>() }),
            },
            jobsIn
        );
        const newData = [
            { city: 'Tianjin', job: 'FE', department: 'IES' },
            { city: 'Tianjin', job: 'Android', department: 'IES' },
            { city: 'Wuhan', job: 'Android', department: 'IES' },
            { city: 'Wuhan', job: 'SE', department: 'EE' },
            { city: 'Chengdu', job: 'Android', department: 'EE' },
            { city: 'Chengdu', job: 'IOS', department: 'EE' },
            { city: 'Xiamen', job: 'SE', department: 'DATA' },
            { city: 'Xiamen', job: 'IOS', department: 'DATA' },
        ];
        await table.update({ props: { dataSource: newData } });
        expect(getSections()).toHaveLength(4);
        expect(screen.getByText('Jobs in Tianjin:')).toBeInTheDocument();
        expect(queryAll(`.${P}-body .${P}-row`)).toHaveLength(0);
        await userEvent.click(getSections()[0]);
        expect(queryAll(`.${P}-row`).length).toBeGreaterThan(0);
    });

    it('defaultExpandAllGroupRows', async () => {
        const data = getGroupData();
        mountTable(
            {
                columns: groupColumns(),
                dataSource: data,
                defaultExpandAllGroupRows: true,
                groupBy: 'city',
                rowKey,
                scroll: { y: 480 },
            },
            jobsIn
        );
        await nextTick();
        expect(queryAll(`.${P}-tbody .${P}-row-section.on`)).toHaveLength(new Set(data.map((item) => item.city)).size);
    });

    it('expandAllGroupRows', async () => {
        const data = getGroupData();
        const table = mountTable(
            {
                columns: groupColumns(),
                groupBy: 'city',
                rowKey,
                scroll: { y: 480 },
                dataSource: [],
                expandAllGroupRows: true,
            },
            jobsIn
        );
        await table.update({ props: { dataSource: data } });
        expect(queryAll(`.${P}-tbody .${P}-row-section.on`)).toHaveLength(new Set(data.map((item) => item.city)).size);
        await table.update({ props: { expandAllGroupRows: false } });
        expect(queryAll(`.${P}-tbody .${P}-row-section.on`)).toHaveLength(0);
    });

    it('fix #2185：onGroupedRow 的 class 应用到分组区块行', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        mountTable(
            {
                clickGroupedRowToExpand: true,
                columns: [
                    { title: '标题', dataIndex: 'name' },
                    { title: '所有者', dataIndex: 'owner' },
                ],
                dataSource: getFileData(10),
                groupBy: 'owner',
                scroll: { y: 480 },
                onGroupedRow: () => ({ class: 'test-group', onClick }),
            },
            groupOf
        );
        await nextTick();
        const sections = queryAll(`.${P}-tbody .${P}-row-section`);
        expect(sections).toHaveLength(2);
        sections.forEach((section) => expect(section).toHaveClass('test-group'));
        await userEvent.click(screen.getByText('group 姜鹏志'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Semi Design 设计稿0.fig')).toBeInTheDocument();
    });
});

describe('Table 分组的树形数据', () => {
    it('sortChildrenRecord 排序分组内记录的子行', async () => {
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
        mountTable({ columns: [{ title: 'Name', dataIndex: 'name', sorter: (x: Row, y: Row) => x.name.localeCompare(y.name), sortChildrenRecord: true, defaultSortOrder: 'ascend' }], dataSource, defaultExpandAllRows: true, groupBy: 'size', pagination: false }, groupOf);
        await nextTick();
        expect(queryAll(`.${P}-tbody .${P}-row:not(.${P}-row-section)`).map((row) => row.textContent)).toEqual(['parent', 'child a', 'child b']);
    });
});

describe('Table defaultExpandAllRows 与分组', () => {
    const files = () => [
        { key: '1', name: 'a.fig', size: '2M' },
        { key: '2', name: 'b.doc', size: '34KB' },
    ];
    const props = (extra: Partial<TableProps> = {}) => ({ clickGroupedRowToExpand: true, columns: [{ title: '标题', dataIndex: 'name' }], dataSource: files(), defaultExpandAllRows: true, groupBy: 'size', pagination: false, ...extra });

    it('收起分组后传入同内容的新 columns，分组保持收起', async () => {
        const table = mountTable(props(), groupOf);
        await nextTick();
        await userEvent.click(screen.getByText('group 2M'));
        expect(screen.queryByText('a.fig')).not.toBeInTheDocument();

        await table.update({ props: { columns: [{ title: '标题', dataIndex: 'name' }] } });
        expect(screen.queryByText('a.fig')).not.toBeInTheDocument();
        expect(screen.getByText('b.doc')).toBeInTheDocument();
    });

    it('受控的 expandedRowKeys 不被 defaultExpandAllRows 改写', async () => {
        const table = mountTable(props({ expandedRowKeys: ['34KB'] }), groupOf);
        await nextTick();
        await table.update({ props: { columns: [{ title: '标题', dataIndex: 'name' }] } });
        expect(screen.queryByText('a.fig')).not.toBeInTheDocument();
        expect(screen.getByText('b.doc')).toBeInTheDocument();
    });
});

describe('Table 分组时的 onExpandedRowsChange', () => {
    const detail = {
        expandedRow: ({ record }: TableExpandedRowSlotProps) => [<div>{`detail of ${record.name}`}</div>],
    };

    it('展开记录行时，保留所有已展开分组在 rows 中', async () => {
        const groupData = [
            { key: '1', name: 'a.fig', size: '2M' },
            { key: '2', name: 'b.fig', size: '2M' },
            { key: '3', name: 'c.fig', size: '34KB' },
        ];
        const onExpandedRowsChange = vi.fn<ExpandedRowsChange>();
        mountTable(
            {
                columns: [
                    { title: '标题', dataIndex: 'name' },
                    { title: '大小', dataIndex: 'size' },
                ],
                dataSource: groupData,
                defaultExpandAllGroupRows: true,
                groupBy: 'size',
                pagination: false,
                onExpandedRowsChange,
            },
            { ...detail, ...groupOf }
        );
        await nextTick();
        await userEvent.click(firstRecordExpandIcon());
        expect(onExpandedRowsChange).toHaveBeenCalledTimes(1);
        expect(onExpandedRowsChange.mock.calls[0][0]).toEqual([groupData[0], { groupKey: '2M' }, { groupKey: '34KB' }]);
    });

    it('不把已展开的记录 key 报告为分组', async () => {
        const groupData = [
            { key: '1', name: 'a.fig', size: '2M' },
            { key: '2', name: 'b.fig', size: '34KB' },
        ];
        const onExpandedRowsChange = vi.fn<ExpandedRowsChange>();
        mountTable(
            {
                clickGroupedRowToExpand: true,
                columns: [{ title: '标题', dataIndex: 'name' }],
                dataSource: groupData,
                defaultExpandAllGroupRows: true,
                groupBy: 'size',
                pagination: false,
                onExpandedRowsChange,
            },
            { ...detail, ...groupOf }
        );
        await nextTick();
        await userEvent.click(firstRecordExpandIcon());
        await userEvent.click(screen.getByText('group 34KB'));
        expect(onExpandedRowsChange).toHaveBeenCalledTimes(2);
        expect(onExpandedRowsChange.mock.calls[1][0]).toEqual([groupData[0], { groupKey: '2M' }]);
    });
});

describe('Table 分组顺序与插槽', () => {
    it('分组按数据中首次出现的顺序渲染，分组行的 records 为该组的原始记录', async () => {
        const onGroupedRow = vi.fn<NonNullable<TableProps<Row>['onGroupedRow']>>(() => ({}));
        const dataSource = [
            { key: '1', city: 'B', name: 'b1' },
            { key: '2', city: 'A', name: 'a1' },
            { key: '3', city: 'B', name: 'b2' },
        ];
        mountTable(
            {
                columns: [{ title: 'Name', dataIndex: 'name' }],
                dataSource,
                defaultExpandAllGroupRows: true,
                groupBy: 'city',
                pagination: false,
                onGroupedRow,
            },
            groupOf
        );
        await nextTick();
        expect(queryAll(`.${P}-tbody tr`).map((row) => row.textContent)).toEqual(['group B', 'b1', 'b2', 'group A', 'a1']);
        const sectionOf = (groupKey: string) => onGroupedRow.mock.calls.map(([record]) => record).findLast((record) => record.groupKey === groupKey);
        expect(sectionOf('B')).toEqual({ groupKey: 'B', records: [dataSource[0], dataSource[2]] });
        expect(sectionOf('A')).toEqual({ groupKey: 'A', records: [dataSource[1]] });
        expect(sectionOf('B')?.records[0]).toBe(dataSource[0]);
    });

    it('#groupSection 渲染纯文本时显示该文本，groupSectionColumn 的 class 与 align 应用到分组单元格', async () => {
        mountTable(
            {
                columns: [{ title: 'Name', dataIndex: 'name' }],
                dataSource: [
                    { key: '1', city: 'B', name: 'b1' },
                    { key: '2', city: 'A', name: 'a1' },
                ],
                groupBy: 'city',
                groupSectionColumn: (groupKey: string) => ({ class: `group-${groupKey}`, align: 'center' }),
                pagination: false,
            },
            {
                groupSection: ({ groupKey, group }: { groupKey: string; group: string[] }) => [`${groupKey}: ${group.length}`],
            }
        );
        await nextTick();
        const [first] = getSections();
        expect(first).toHaveTextContent('B: 1');
        const cell = first.querySelector('td') as HTMLElement;
        expect(cell).toHaveClass('group-B');
        expect(cell).toHaveStyle({ textAlign: 'center' });
    });
});
