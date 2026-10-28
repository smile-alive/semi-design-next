/** @jsxImportSource vue */
import { nextTick, type VNode } from 'vue';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { getData, render } from '@test/utils/vue';
import { TableColumn, type ColumnProps, type TableChangeInfo, type TableHeaderCellSlotProps, type TableSortIconSlotProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import ColumnSlots from './fixtures/column-slots.vue';
import { P, firstCellTexts, getBodyRows, getFirstCellText, getPageItems, getSorters, mountTable, query, queryAll, type Row } from './table-helpers';

type Change = (info: TableChangeInfo) => void;

const data = getData(46);

const nameLengthData = () => [
    { key: '1', name: 'long name', age: 32, address: 'New York No. 1 Lake Park' },
    { key: '2', name: 'longest name', age: 42, address: 'London No. 1 Lake Park' },
    { key: '3', name: 'longer name', age: 32, address: 'Sidney No. 1 Lake Park' },
    { key: '4', name: 'short', age: 32, address: 'London No. 2 Lake Park' },
];
const nameLengthColumns = (order: Partial<ColumnProps>): ColumnProps[] => [
    { title: 'Name', dataIndex: 'name', sorter: (a, b) => a.name.length - b.name.length, ...order },
    { title: 'Age', dataIndex: 'age' },
    { title: 'Address', dataIndex: 'address' },
];
const longest = (rows: Row[]) => rows.reduce((a, b) => (a.name.length > b.name.length ? a : b)).name;
const shortest = (rows: Row[]) => rows.reduce((a, b) => (a.name.length < b.name.length ? a : b)).name;

const fileColumns = (): ColumnProps[] => [
    {
        title: '标题',
        dataIndex: 'name',
        width: 400,
        filters: [
            { text: 'Semi Design 设计稿', value: 'Semi Design 设计稿' },
            { text: 'Semi Pro 设计稿', value: 'Semi Pro 设计稿' },
        ],
        onFilter: (value, record) => record.name.includes(value),
        defaultFilteredValue: ['Semi Pro 设计稿'],
    },
    {
        title: '大小',
        dataIndex: 'size',
        sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
        defaultSortOrder: 'ascend',
    },
    { title: '所有者', dataIndex: 'owner' },
];
const fileData = (total: number) =>
    Array.from({ length: total }, (_, i) => ({
        key: String(i),
        name: i % 2 === 0 ? `Semi Design 设计稿${i}.fig` : `Semi Pro 设计稿${i}.fig`,
        owner: i % 2 === 0 ? '姜鹏志' : '郝宣',
        size: (i * 1000) % 199,
    }));

const smallData = () => [
    { key: '1', name: 'b', age: 2 },
    { key: '2', name: 'a', age: 1 },
    { key: '3', name: 'c', age: 3 },
];
const getSortStates = () => screen.getAllByRole('columnheader').map((th) => th.getAttribute('aria-sort'));

describe('Table 排序', () => {
    it('事件：分页、筛选、排序', async () => {
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
            { title: 'Age', dataIndex: 'age', width: 150, sorter: (a, b) => (a.age - b.age > 0 ? 1 : -1) },
            { title: 'Address', dataIndex: 'address' },
        ];
        const onChange = vi.fn<Change>();
        mountTable({ columns, dataSource: data, onChange });
        let calls = 0;
        await userEvent.click(query(`.${P}-thead .${P}-column-filter`));
        expect(onChange).toHaveBeenCalledTimes(calls);
        const firstFilterCheckbox = () => query(`.semi-dropdown-item .semi-checkbox`);
        await userEvent.click(firstFilterCheckbox());
        expect(onChange).toHaveBeenCalledTimes(++calls);
        await userEvent.click(firstFilterCheckbox());
        expect(onChange).toHaveBeenCalledTimes(++calls);
        await userEvent.click(getPageItems()[2]);
        expect(onChange).toHaveBeenCalledTimes(++calls);
        await userEvent.click(getPageItems()[1]);
        expect(onChange).toHaveBeenCalledTimes(++calls);
        await userEvent.click(query(`.${P}-thead .${P}-column-sorter`));
        expect(onChange).toHaveBeenCalledTimes(++calls);
    });

    it('排序不改变 dataSource 属性的顺序', async () => {
        const dataSource = [
            { key: '3', name: 'row-3', age: 30 },
            { key: '1', name: 'row-1', age: 10 },
            { key: '2', name: 'row-2', age: 20 },
        ];
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name' },
            { title: 'Age', dataIndex: 'age', sorter: (a, b) => a.age - b.age, defaultSortOrder: 'ascend' },
        ];
        const table = mountTable({ columns, dataSource, pagination: false });
        expect(firstCellTexts()).toEqual(['row-1', 'row-2', 'row-3']);
        expect(dataSource.map((record) => record.key)).toEqual(['3', '1', '2']);
        const nextDataSource = [{ key: '5', name: 'row-5', age: 50 }, ...dataSource];
        await table.update({ props: { dataSource: nextDataSource } });
        expect(firstCellTexts()).toEqual(['row-1', 'row-2', 'row-3', 'row-5']);
        expect(nextDataSource.map((record) => record.key)).toEqual(['5', '3', '1', '2']);
    });

    it('sortOrder 为 descend', () => {
        const dataSource = nameLengthData();
        mountTable({ columns: nameLengthColumns({ sortOrder: 'descend' }), dataSource });
        expect(getFirstCellText()).toBe(longest(dataSource));
    });

    it('sortOrder 为 ascend', () => {
        const dataSource = nameLengthData();
        mountTable({ columns: nameLengthColumns({ sortOrder: 'ascend' }), dataSource });
        expect(getFirstCellText()).toBe(shortest(dataSource));
    });

    it('受控的 sortOrder', async () => {
        const dataSource = nameLengthData();
        const table = mountTable({ columns: nameLengthColumns({ sortOrder: 'descend' }), dataSource });
        expect(getFirstCellText()).toBe(longest(dataSource));
        await table.update({ props: { columns: nameLengthColumns({ sortOrder: 'ascend' }) } });
        expect(getFirstCellText()).toBe(shortest(dataSource));
        await table.update({ props: { columns: nameLengthColumns({ sortOrder: false }) } });
        expect(getFirstCellText()).toBe(dataSource[0].name);
    });

    it('点击排序列标题时触发 onHeaderCell.onClick', async () => {
        const onHeaderCellClick = vi.fn<(event: MouseEvent) => void>();
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name', width: 150 },
            {
                title: 'Age',
                dataIndex: 'age',
                width: 150,
                sorter: (a, b) => a.age - b.age,
                onHeaderCell: () => ({ onClick: onHeaderCellClick }),
            },
        ];
        mountTable({ columns, dataSource: data, pagination: false });
        await userEvent.click(queryAll(`.${P}-thead .${P}-row-head`)[1]);
        expect(onHeaderCellClick).toHaveBeenCalled();
    });

    it('defaultSortOrder 为 descend', () => {
        const dataSource = nameLengthData();
        mountTable({ columns: nameLengthColumns({ defaultSortOrder: 'descend' }), dataSource });
        expect(getFirstCellText()).toBe(longest(dataSource));
    });

    it('defaultSortOrder 为 ascend', () => {
        const dataSource = nameLengthData();
        mountTable({ columns: nameLengthColumns({ defaultSortOrder: 'ascend' }), dataSource });
        expect(getFirstCellText()).toBe(shortest(dataSource));
    });

    it('defaultSortOrder 为 false', async () => {
        const dataSource = nameLengthData();
        const onChange = vi.fn<Change>();
        const columns = nameLengthColumns({ defaultSortOrder: false });
        const table = mountTable({ columns, dataSource, onChange });
        expect(getFirstCellText()).toBe(dataSource[0].name);
        await userEvent.click(query(`.${P}-thead .${P}-column-sorter`));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].sorter?.sortOrder).toBe('ascend');
        await userEvent.click(query(`.${P}-thead .${P}-column-sorter`));
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[1][0].sorter?.sortOrder).toBe('descend');
        const newData = [
            { key: '1', name: 'longest name', age: 18 },
            { key: '2', name: 'long name', age: 20 },
            { key: '3', name: 'longer name', age: 16 },
            { key: '4', name: 'short', age: 33 },
        ];
        await table.update({ props: { dataSource: newData } });
        expect(getFirstCellText()).toBe(longest(newData));
    });

    it('点击排序器时 defaultFilteredValue 出现在 onChange 中', async () => {
        const onChange = vi.fn<Change>();
        mountTable({ columns: fileColumns(), dataSource: fileData(25), onChange });
        await userEvent.click(query(`.${P}-column-sorter`));
        expect(onChange).toHaveBeenCalledTimes(1);
        const [arg] = onChange.mock.calls[0];
        expect(arg.filters).toHaveLength(1);
        expect(arg.filters?.[0].defaultFilteredValue).toEqual(['Semi Pro 设计稿']);
        expect(arg.filters?.[0].filteredValue).toEqual(['Semi Pro 设计稿']);
    });

    it('点击筛选时 defaultSortOrder 出现在 onChange 中', async () => {
        const onChange = vi.fn<Change>();
        mountTable({ columns: fileColumns(), dataSource: fileData(25), onChange });
        await userEvent.click(query(`.${P}-column-filter`));
        const option = queryAll('.semi-checkbox-addon').find((node) => node.textContent === 'Semi Design 设计稿');
        await userEvent.click(option as HTMLElement);
        expect(onChange).toHaveBeenCalledTimes(1);
        const [arg] = onChange.mock.calls[0];
        expect(arg.sorter).toHaveProperty('defaultSortOrder', 'ascend');
        expect(arg.sorter?.sortOrder).toBe('ascend');
    });

    it('useFullRender 的排序按钮以列标题命名', () => {
        mountTable({
            columns: [{ title: 'Name', dataIndex: 'name', sorter: true, useFullRender: true }],
            dataSource: getData(2),
            pagination: false,
        });
        expect(screen.getByRole('button', { name: 'Name' })).toBeInTheDocument();
    });

    it('useFullRender 的 #title 收到排序器、筛选器与全选框节点', () => {
        const title = vi.fn<(props: TableHeaderCellSlotProps) => VNode[]>(({ sorter, filter, selection }) => [
            <span class="custom-title">
                {selection}
                <span>Name</span>
                {sorter}
                {filter}
            </span>,
        ]);
        const columns: ColumnProps[] = [
            {
                dataIndex: 'name',
                filters: [
                    { text: '名字包含"1"', value: '1' },
                    { text: '名字包含"2"', value: '2' },
                ],
                onFilter: (value, record) => record.name.indexOf(value) > -1,
                sorter: (a, b) => a.name.length - b.name.length,
                useFullRender: true,
            },
            { title: 'Age', dataIndex: 'age' },
        ];
        mountTable({ columns, dataSource: getData(3), rowSelection: { hidden: true, fixed: 'left' } }, { headerCell: title });
        const node = query('.custom-title');
        expect(node.children).toHaveLength(4);
        expect(node.children[0]).toHaveClass(`${P}-selection-wrap`);
        expect(node.children[1]).toHaveTextContent(/^Name$/);
        expect(node.children[2].querySelector(`.${P}-column-sorter`)).not.toBeNull();
        expect(node.children[3]).toHaveClass(`${P}-column-filter`);
    });
});

describe('Table 排序行为基线', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('非受控时点击表头依次排序：ascend、descend，然后取消', async () => {
        const onChange = vi.fn<Change>();
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name' },
            { title: 'Age', dataIndex: 'age', sorter: (a, b) => a.age - b.age },
        ];
        mountTable({ columns, dataSource: smallData(), pagination: false, onChange });
        const ageHeader = screen.getByText('Age').closest('th') as HTMLElement;
        await userEvent.click(ageHeader);
        expect(firstCellTexts()).toEqual(['a', 'b', 'c']);
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                sorter: expect.objectContaining({ dataIndex: 'age', sortOrder: 'ascend' }),
                extra: { changeType: 'sorter' },
            })
        );
        await userEvent.click(ageHeader);
        expect(firstCellTexts()).toEqual(['c', 'b', 'a']);
        await userEvent.click(ageHeader);
        expect(firstCellTexts()).toEqual(['b', 'a', 'c']);
        expect(onChange).toHaveBeenCalledTimes(3);
    });

    it('受控的 sortOrder 只通过属性变化', async () => {
        const onChange = vi.fn<Change>();
        const columns = (sortOrder: ColumnProps['sortOrder']): ColumnProps[] => [
            { title: 'Name', dataIndex: 'name' },
            { title: 'Age', dataIndex: 'age', sorter: (a, b) => a.age - b.age, sortOrder },
        ];
        const table = mountTable({ columns: columns(false), dataSource: smallData(), pagination: false, onChange });
        await userEvent.click(screen.getByText('Age').closest('th') as HTMLElement);
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ sorter: expect.objectContaining({ sortOrder: 'ascend' }) }));
        expect(firstCellTexts()).toEqual(['b', 'a', 'c']);
        await table.update({ props: { columns: columns('descend') } });
        expect(firstCellTexts()).toEqual(['c', 'b', 'a']);
        expect(getSortStates()).toEqual([null, 'descending']);
    });

    it('只应用第一个激活的排序器，点击另一列会重置其他列', async () => {
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                sorter: (a, b) => (a.name > b.name ? 1 : -1),
                defaultSortOrder: 'descend',
            },
            { title: 'Age', dataIndex: 'age', sorter: (a, b) => a.age - b.age, defaultSortOrder: 'ascend' },
        ];
        mountTable({ columns, dataSource: smallData(), pagination: false });
        expect(firstCellTexts()).toEqual(['c', 'b', 'a']);
        await userEvent.click(screen.getByText('Age').closest('th') as HTMLElement);
        expect(getSortStates()).toEqual([null, 'descending']);
        expect(firstCellTexts()).toEqual(['c', 'b', 'a']);
    });

    it('重新渲染后调用最新的 onChange', async () => {
        const first = vi.fn<Change>();
        const second = vi.fn<Change>();
        const columns: ColumnProps[] = [{ title: 'Age', dataIndex: 'age', sorter: (a, b) => a.age - b.age }];
        const table = mountTable({ columns, dataSource: smallData(), pagination: false, onChange: first });
        await table.update({ props: { onChange: second } });
        await userEvent.click(screen.getByText('Age').closest('th') as HTMLElement);
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });
});

describe('Table 排序器 Tab 停靠点', () => {
    const dataSource = [
        { key: '1', name: 'b' },
        { key: '2', name: 'a' },
        { key: '3', name: 'c' },
    ];
    const names = () => getBodyRows().map((row) => row.querySelector('td')?.textContent);
    const sorterColumn = (): ColumnProps => ({
        title: 'Name',
        dataIndex: 'name',
        sorter: (a, b) => a.name.localeCompare(b.name),
    });

    it('showSortTip：排序器是表头单元格唯一的停靠点，Enter 和 Space 排序，焦点时显示提示', async () => {
        const { container } = mountTable({
            columns: [{ ...sorterColumn(), showSortTip: true }],
            dataSource,
            pagination: false,
        });
        await userEvent.tab();
        const sorter = screen.getByRole('button', { name: 'Name' });
        const header = screen.getByRole('columnheader', { name: 'Name' });
        expect(sorter).toHaveFocus();
        expect(container.querySelector('th')).toHaveAttribute('tabindex', '-1');
        expect(header).not.toHaveAttribute('aria-sort');
        expect(await screen.findByRole('tooltip')).toHaveTextContent(zh_CN.Table.ascend);
        await userEvent.keyboard('{Enter}');
        expect(names()).toEqual(['a', 'b', 'c']);
        expect(header).toHaveAttribute('aria-sort', 'ascending');
        await userEvent.keyboard(' ');
        expect(names()).toEqual(['c', 'b', 'a']);
        expect(header).toHaveAttribute('aria-sort', 'descending');
        await userEvent.keyboard('{Enter}');
        expect(header).not.toHaveAttribute('aria-sort');
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('没有 showSortTip 的排序器可以到达，并可用键盘排序', async () => {
        mountTable({ columns: [sorterColumn()], dataSource, pagination: false });
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'Name' })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(names()).toEqual(['a', 'b', 'c']);
        expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort', 'ascending');
    });

    it('带筛选时，排序提示属于排序器，图标不是额外的停靠点', async () => {
        const columns: ColumnProps[] = [{ ...sorterColumn(), showSortTip: true, filters: [{ text: 'A', value: 'a' }], onFilter: () => true }];
        mountTable({ columns, dataSource, pagination: false });
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'Name' })).toHaveFocus();
        expect(await screen.findByRole('tooltip')).toHaveTextContent(zh_CN.Table.ascend);
        await userEvent.keyboard('{Enter}');
        expect(names()).toEqual(['a', 'b', 'c']);
        await userEvent.tab();
        expect(screen.getByRole('button', { name: zh_CN.Table.filterColumn })).toHaveFocus();
    });
});

describe('Table 排序后的重算', () => {
    const files = [
        { key: '1', name: 'b.fig', size: '2M' },
        { key: '2', name: 'a.fig', size: '2M' },
        { key: '3', name: 'c.doc', size: '34KB' },
    ];
    const columns = (): ColumnProps[] => [
        { title: '标题', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: '大小', dataIndex: 'size' },
    ];

    it('点击排序不会让已收起的分组重新展开', async () => {
        mountTable(
            {
                clickGroupedRowToExpand: true,
                columns: columns(),
                dataSource: files,
                defaultExpandAllRows: true,
                groupBy: 'size',
                pagination: false,
            },
            { groupSection: ({ groupKey }: { groupKey: string }) => [<strong>{`group ${groupKey}`}</strong>] }
        );
        await nextTick();
        expect(screen.getByText('a.fig')).toBeInTheDocument();
        await userEvent.click(screen.getByText('group 2M'));
        expect(screen.queryByText('a.fig')).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: '标题' }));
        expect(screen.queryByText('a.fig')).not.toBeInTheDocument();
        expect(screen.getByText('c.doc')).toBeInTheDocument();
    });
});

describe('Table 排序开发提示', () => {
    it('排序列缺少 dataIndex 只警告一次', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const columns: ColumnProps[] = [{ title: 'Name', sorter: (a, b) => a.name.localeCompare(b.name) }];
        const table = mountTable({ columns, dataSource: getData(1), pagination: false });
        await table.update({ props: { dataSource: getData(2) } });
        const dataIndexWarnings = warn.mock.calls.filter((args) => args.join(' ').includes('dataIndex'));
        expect(dataIndexWarnings).toHaveLength(1);
        warn.mockRestore();
    });
});

describe('Table 排序插槽', () => {
    it('Table.Column 的列级 #sortIcon、#filterIcon、#filterDropdown 优先于表级插槽（模板写法）', async () => {
        const warn = vi.spyOn(console, 'warn');
        render(ColumnSlots);
        const [nameSorter, ageSorter] = getSorters();
        expect(nameSorter.querySelector('.column-sort-icon')).not.toBeNull();
        expect(nameSorter.querySelector('.table-sort-icon')).toBeNull();
        expect(ageSorter.querySelector('.table-sort-icon')).not.toBeNull();
        const [nameFilter, ageFilter] = queryAll(`.${P}-column-filter`);
        expect(nameFilter.querySelector('.column-filter-icon')).not.toBeNull();
        expect(ageFilter.querySelector('.table-filter-icon')).not.toBeNull();
        await userEvent.click(nameFilter);
        expect(await screen.findByText('column panel')).toBeInTheDocument();
        expect(screen.queryByText('table panel')).not.toBeInTheDocument();
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it('Table.Column 的列级 #sortIcon、#filterIcon 优先于表级插槽（h() 写法）', () => {
        const columnSlots = {
            sortIcon: () => [<i class="column-sort-icon" />],
            filterIcon: () => [<i class="column-filter-icon" />],
        };
        mountTable(
            { dataSource: smallData(), pagination: false },
            {
                default: () => (
                    <>
                        <TableColumn title="Name" dataIndex="name" sorter={() => 0} filters={[{ text: 'a', value: 'a' }]}>
                            {columnSlots}
                        </TableColumn>
                        <TableColumn title="Age" dataIndex="age" sorter={() => 0} filters={[{ text: '1', value: 1 }]} />
                    </>
                ),
                sortIcon: () => [<i class="table-sort-icon" />],
                filterIcon: () => [<i class="table-filter-icon" />],
            }
        );
        const [nameSorter, ageSorter] = getSorters();
        expect(nameSorter.querySelector('.column-sort-icon')).not.toBeNull();
        expect(ageSorter.querySelector('.table-sort-icon')).not.toBeNull();
        const [nameFilter, ageFilter] = queryAll(`.${P}-column-filter`);
        expect(nameFilter.querySelector('.column-filter-icon')).not.toBeNull();
        expect(ageFilter.querySelector('.table-filter-icon')).not.toBeNull();
    });

    it('表级 #sortIcon 对某列渲染为空时，该列回落默认箭头，模板写法无告警', () => {
        const warn = vi.spyOn(console, 'warn');
        render(ColumnSlots, { props: { sortIconFor: 'age', columnSlots: false } });
        const [nameSorter, ageSorter] = getSorters();
        expect(nameSorter.querySelector('.table-sort-icon')).toBeNull();
        expect(nameSorter.querySelector(`.${P}-column-sorter-up`)).not.toBeNull();
        expect(ageSorter.querySelector('.table-sort-icon')).not.toBeNull();
        expect(ageSorter.querySelector(`.${P}-column-sorter-up`)).toBeNull();
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it('#sortIcon 收到 sortOrder 与 column', async () => {
        const sortIcon = vi.fn<(props: TableSortIconSlotProps) => VNode[]>(({ sortOrder }) => [<i>{String(sortOrder)}</i>]);
        mountTable(
            {
                columns: [{ title: 'Age', dataIndex: 'age', sorter: (a: Row, b: Row) => a.age - b.age }],
                dataSource: smallData(),
                pagination: false,
            },
            { sortIcon }
        );
        expect(getSorters()[0]).toHaveTextContent('false');
        await userEvent.click(getSorters()[0]);
        expect(getSorters()[0]).toHaveTextContent('ascend');
        expect(sortIcon).toHaveBeenLastCalledWith(expect.objectContaining({ sortOrder: 'ascend', column: expect.objectContaining({ dataIndex: 'age' }) }));
    });
});

describe('Table 列配置删掉的键随即失效', () => {
    const files = () => [
        { key: '1', name: 'b' },
        { key: '2', name: 'a' },
        { key: '3', name: 'c' },
    ];

    it('排序后 columns 去掉 sorter，行序回到 dataSource 的顺序，表头没有 aria-sort', async () => {
        const table = mountTable({ columns: [{ title: 'Name', dataIndex: 'name', sorter: (a: Row, b: Row) => a.name.localeCompare(b.name) }], dataSource: files(), pagination: false });
        await userEvent.click(screen.getByRole('button', { name: 'Name' }));
        expect(firstCellTexts()).toEqual(['a', 'b', 'c']);

        await table.update({ props: { columns: [{ title: 'Name', dataIndex: 'name' }] } });
        expect(firstCellTexts()).toEqual(['b', 'a', 'c']);
        expect(screen.getByRole('columnheader', { name: 'Name' })).not.toHaveAttribute('aria-sort');
    });

    it('columns 去掉筛选配置后，不再按旧的筛选值过滤', async () => {
        const table = mountTable({
            columns: [{ title: 'Name', dataIndex: 'name', filters: [{ text: 'a', value: 'a' }], onFilter: (value: string, record: Row) => record.name === value, defaultFilteredValue: ['a'] }],
            dataSource: files(),
            pagination: false,
        });
        expect(firstCellTexts()).toEqual(['a']);

        await table.update({ props: { columns: [{ title: 'Name', dataIndex: 'name' }] } });
        expect(firstCellTexts()).toEqual(['b', 'a', 'c']);
    });
});
