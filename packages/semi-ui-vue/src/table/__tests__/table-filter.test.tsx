/** @jsxImportSource vue */
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { getData, render } from '@test/utils/vue';
import Table, { type ColumnProps, type TableChangeInfo, type TableFilterDropdownSlotProps } from '..';
import LocaleProvider from '../../locale/locale-provider.vue';
import FilterDropdownItem from './fixtures/filter-dropdown-item.vue';
import { P, firstCellTexts, getBodyRows, getFilterButtons, mountTable, query, queryAll } from './table-helpers';

type Change = (info: TableChangeInfo) => void;

const data = getData(46);
const smallData = () => [
    { key: '1', name: 'b', age: 2 },
    { key: '2', name: 'a', age: 1 },
    { key: '3', name: 'c', age: 3 },
];
const getFileData = (total: number) =>
    Array.from({ length: total }, (_, i) => ({
        key: `${i}`,
        name: i % 2 === 0 ? `Semi Design 设计稿${i}.fig` : `Semi Pro 设计稿${i}.fig`,
        owner: i % 2 === 0 ? '姜鹏志' : '郝宣',
        size: (i * 1000) % 199,
    }));
const nameFilters = [
    { text: 'Semi Design 设计稿', value: 'Semi Design 设计稿' },
    { text: 'Semi Pro 设计稿', value: 'Semi Pro 设计稿' },
];
const menuOpen = () => document.querySelector('.semi-dropdown-wrapper-show') !== null;
async function openFilter(index = 0) {
    await userEvent.click(getFilterButtons()[index]);
    await waitFor(() => expect(menuOpen()).toBe(true));
}
const clickFilterItem = (text: string) => userEvent.click(queryAll('.semi-dropdown-item').find((item) => item.textContent === text) as HTMLElement);
const itemSelector = '.semi-dropdown-item *, .semi-dropdown-item';

describe('Table 筛选', () => {
    it('筛选，并在已有筛选下更新 dataSource', async () => {
        const columns: ColumnProps[] = [
            {
                class: 'name-col',
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
        const table = mountTable({ columns, dataSource: data, pagination: false });
        await userEvent.click(query(`.${P}-thead .${P}-column-filter`));
        await userEvent.click(query('.semi-dropdown-item .semi-checkbox'));
        expect(queryAll(`.${P}-tbody .name-col`)).toHaveLength(data.filter((item) => item.name.includes('1')).length);
        const newData = getData(10);
        await table.update({ props: { dataSource: newData } });
        expect(queryAll(`.${P}-tbody .name-col`)).toHaveLength(newData.filter((item) => item.name.includes('1')).length);
    });

    it('自定义筛选面板的 onReset 把临时筛选值还原为已生效的值', async () => {
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                filterDropdown: true,
                onFilter: (value, record) => record.name.includes(value),
            },
        ];
        mountTable(
            { columns, dataSource: data, pagination: false },
            {
                filterDropdown: ({ tempFilteredValue, onTempFilteredValueChange, onReset }: TableFilterDropdownSlotProps) => (
                    <>
                        <span data-testid="temp-value">{(tempFilteredValue ?? []).join(',')}</span>
                        <button type="button" onClick={() => onTempFilteredValueChange(['1'])}>
                            选择 1
                        </button>
                        <button type="button" onClick={() => onReset()}>
                            还原
                        </button>
                    </>
                ),
            }
        );
        await userEvent.click(query(`.${P}-column-filter`));
        await userEvent.click(await screen.findByRole('button', { name: '选择 1' }));
        expect(screen.getByTestId('temp-value')).toHaveTextContent('1');
        await userEvent.click(screen.getByRole('button', { name: '还原' }));
        expect(screen.getByTestId('temp-value')).toBeEmptyDOMElement();
    });
});

describe('Table 筛选回归用例', () => {
    it('fix #1036：按多个值筛选时保留原始行顺序', async () => {
        const columns: ColumnProps[] = [
            {
                title: '标题',
                dataIndex: 'name',
                filters: nameFilters,
                onFilter: (value, record) => record.name.includes(value),
                sorter: (a, b) => (a.name.length - b.name.length > 0 ? 1 : -1),
            },
            { title: '大小', dataIndex: 'size' },
        ];
        mountTable({ columns, dataSource: getFileData(46), rowSelection: {}, scroll: { y: 300 } });
        await userEvent.click(query(`.${P}-column-filter`));
        await screen.findAllByText(nameFilters[0].text);
        await clickFilterItem('Semi Design 设计稿');
        await clickFilterItem('Semi Pro 设计稿');
        expect(getBodyRows()[0]).toHaveTextContent('Semi Design 设计稿0.fig');
        expect(getBodyRows()[1]).toHaveTextContent('Semi Pro 设计稿1.fig');
    });

    it('fix #1572：没有 onFilter 的列，onChange 仍报告其筛选值', async () => {
        const onChange = vi.fn<Change>();
        const columns: ColumnProps[] = [
            {
                title: '标题',
                dataIndex: 'name',
                filters: nameFilters,
                sorter: (a, b) => (a.name.length - b.name.length > 0 ? 1 : -1),
                defaultFilteredValue: ['Semi Pro 设计稿'],
            },
            { title: '大小', dataIndex: 'size', sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1) },
        ];
        mountTable({ columns, dataSource: getFileData(46), scroll: { y: 300 }, onChange });
        await userEvent.click(queryAll(`.${P}-column-sorter`)[1]);
        expect(onChange).toHaveBeenCalledTimes(1);
        const { filters } = onChange.mock.calls[0][0];
        expect(filters).toHaveLength(1);
        expect(filters?.[0].filteredValue).toEqual(['Semi Pro 设计稿']);
    });
});

describe('Table 筛选行为基线', () => {
    it('受控的 filteredValue 报告筛选选择，并通过属性进行筛选', async () => {
        const onChange = vi.fn<Change>();
        const columns = (filteredValue: string[]): ColumnProps[] => [
            {
                title: 'Name',
                dataIndex: 'name',
                filters: [
                    { text: 'Starts with a', value: 'a' },
                    { text: 'Starts with b', value: 'b' },
                ],
                onFilter: (value, record) => record.name.startsWith(value),
                filteredValue,
            },
            { title: 'Age', dataIndex: 'age' },
        ];
        const table = mountTable({ columns: columns([]), dataSource: smallData(), pagination: false, onChange });
        await openFilter();
        await userEvent.click(screen.getByText('Starts with a'));
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                filters: [expect.objectContaining({ dataIndex: 'name', filteredValue: ['a'] })],
                extra: { changeType: 'filter' },
            })
        );
        expect(firstCellTexts()).toEqual(['b', 'a', 'c']);
        await table.update({ props: { columns: columns(['a']) } });
        expect(firstCellTexts()).toEqual(['a']);
    });

    it('#filterDropdown 确认选值，#filterIcon 替换筛选图标', async () => {
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                filterDropdown: true,
                onFilter: (value, record) => record.name === value,
            },
            { title: 'Age', dataIndex: 'age', filterDropdown: true, onFilter: () => true },
        ];
        mountTable(
            { columns, dataSource: smallData(), pagination: false },
            {
                filterDropdown: ({ column, onConfirm }: TableFilterDropdownSlotProps) =>
                    column.dataIndex === 'name'
                        ? [
                              <button type="button" onClick={() => onConfirm({ filteredValue: ['a'], closeDropdown: true })}>
                                  only a
                              </button>,
                          ]
                        : [],
                filterIcon: ({ column }: { column: ColumnProps }) => (column.dataIndex === 'age' ? [<span data-testid="custom-filter">f</span>] : []),
            }
        );
        expect(screen.getByTestId('custom-filter').closest('th')).toBeInTheDocument();
        await openFilter();
        await userEvent.click(screen.getByText('only a'));
        expect(firstCellTexts()).toEqual(['a']);
    });

    it('受控 filterDropdownVisible 时，确定和关闭请求使用方关闭面板', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                filterDropdown: true,
                onFilter: (value, record) => record.name === value,
                filterDropdownVisible: true,
                onFilterDropdownVisibleChange: onVisibleChange,
            },
        ];
        mountTable(
            { columns, dataSource: smallData(), pagination: false },
            {
                filterDropdown: ({ onConfirm, onClose }: TableFilterDropdownSlotProps) => (
                    <>
                        <button type="button" onClick={() => onConfirm({ filteredValue: ['a'], closeDropdown: true })}>
                            only a
                        </button>
                        <button type="button" onClick={() => onClose()}>
                            close it
                        </button>
                    </>
                ),
            }
        );
        await userEvent.click(await screen.findByText('only a'));
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
        onVisibleChange.mockClear();
        await userEvent.click(screen.getByText('close it'));
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('自定义筛选面板打开时，onFilterDropdownVisibleChange(true) 里已能聚焦面板内的元素，onClose() 后收到 false', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>((visible) => {
            if (visible) {
                screen.getByRole('textbox', { name: 'keyword' }).focus();
            }
        });
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                filterDropdown: true,
                onFilter: (value, record) => record.name === value,
                onFilterDropdownVisibleChange: onVisibleChange,
            },
        ];
        mountTable(
            { columns, dataSource: smallData(), pagination: false },
            {
                filterDropdown: ({ onClose }: TableFilterDropdownSlotProps) => (
                    <>
                        <input aria-label="keyword" />
                        <button type="button" onClick={() => onClose()}>
                            close it
                        </button>
                    </>
                ),
            }
        );
        await openFilter();
        await waitFor(() => expect(onVisibleChange.mock.calls).toEqual([[true]]));
        expect(screen.getByRole('textbox', { name: 'keyword' })).toHaveFocus();
        await userEvent.click(screen.getByText('close it'));
        await waitFor(() => expect(onVisibleChange.mock.calls).toEqual([[true], [false]]));
    });

    const clickFilterOptionA = async (filterConfirmMode: 'immediate' | 'confirm') => {
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: (value, record) => record.name === value,
                filterConfirmMode,
                filters: [
                    { text: 'a', value: 'a' },
                    { text: 'b', value: 'b' },
                ],
            },
        ];
        mountTable({ columns, dataSource: smallData(), pagination: false });
        await openFilter();
        await userEvent.click(await screen.findByText('a', { selector: itemSelector }));
    };

    it('filterConfirmMode=immediate：点击筛选项立即筛选', async () => {
        await clickFilterOptionA('immediate');
        expect(firstCellTexts()).toEqual(['a']);
    });

    it('filterConfirmMode=confirm：点击筛选项只暂存，点确定后才筛选', async () => {
        await clickFilterOptionA('confirm');
        expect(firstCellTexts()).toEqual(['b', 'a', 'c']);
        expect(screen.getByRole('button', { name: zh_CN.Table.resetFilter })).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Table.confirmFilter }));
        expect(firstCellTexts()).toEqual(['a']);
    });

    it('filterConfirmMode=confirm：菜单打开完成前勾选的项不被重置', async () => {
        const onFilterDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: (value, record) => record.name === value,
                onFilterDropdownVisibleChange,
                filterConfirmMode: 'confirm',
                filters: [
                    { text: 'a', value: 'a' },
                    { text: 'b', value: 'b' },
                ],
            },
        ];
        mountTable({ columns, dataSource: smallData(), pagination: false });
        await fireEvent.click(query(`.${P}-thead .${P}-column-filter`));
        await fireEvent.click(screen.getByText('a', { selector: itemSelector }));
        await waitFor(() => expect(onFilterDropdownVisibleChange).toHaveBeenCalledWith(true));
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Table.confirmFilter }));
        expect(firstCellTexts()).toEqual(['a']);
    });

    it('filterConfirmMode=confirm：未确定就关闭时丢弃暂存值，受控 filteredValue 在关闭期间变化后打开显示新值', async () => {
        const columns = (filteredValue: string[]): ColumnProps[] => [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: (value, record) => record.name === value,
                filterConfirmMode: 'confirm',
                filteredValue,
                filters: [
                    { text: 'a', value: 'a' },
                    { text: 'b', value: 'b' },
                ],
            },
        ];
        const table = mountTable({ columns: columns([]), dataSource: smallData(), pagination: false });
        const isChecked = (text: string) => (screen.getByText(text, { selector: '.semi-dropdown-item *' }).closest('li')?.querySelector('input') as HTMLInputElement | undefined)?.checked;
        const closeMenu = async () => {
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(menuOpen()).toBe(false));
        };
        await openFilter();
        await userEvent.click(screen.getByText('a', { selector: '.semi-dropdown-item *' }));
        expect(isChecked('a')).toBe(true);
        await closeMenu();
        await openFilter();
        expect(isChecked('a')).toBe(false);
        await closeMenu();
        await table.update({ props: { columns: columns(['b']) } });
        await openFilter();
        expect(isChecked('a')).toBe(false);
        expect(isChecked('b')).toBe(true);
    });

    it('嵌套筛选项的子菜单 key 不重复，且开合不当作根菜单的开合', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const warn = vi.spyOn(console, 'warn');
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: () => true,
                filterConfirmMode: 'confirm',
                onFilterDropdownVisibleChange: onVisibleChange,
                filters: [
                    { text: 'G1', value: 'g1', children: [{ text: 'a', value: 'a' }] },
                    { text: 'G2', value: 'g2', children: [{ text: 'b', value: 'b' }] },
                    { text: 'top', value: 'top' },
                ],
            },
        ];
        mountTable({ columns, dataSource: smallData(), pagination: false });
        await openFilter();
        await userEvent.click(await screen.findByText('top'));
        onVisibleChange.mockClear();
        await userEvent.hover(screen.getByText('G1'));
        await screen.findByText('a');
        await userEvent.hover(screen.getByText('G2'));
        await screen.findByText('b');
        await userEvent.hover(screen.getByText('top'));
        expect(onVisibleChange).not.toHaveBeenCalled();
        expect(screen.getByText('top').closest('li')?.querySelector('input')).toBeChecked();
        expect(warn.mock.calls.flat().join('\n')).not.toContain('Duplicate keys');
        warn.mockRestore();
    });

    it('filterDropdownProps 中的 onVisibleChange 不被调用，根菜单开合只报告给 onFilterDropdownVisibleChange', async () => {
        const onFilterDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const onUpdateVisible = vi.fn<(visible: boolean) => void>();
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                onFilter: () => true,
                onFilterDropdownVisibleChange,
                filterDropdownProps: { onVisibleChange, 'onUpdate:visible': onUpdateVisible },
                filters: [
                    { text: 'G1', value: 'g1', children: [{ text: 'a', value: 'a' }] },
                    { text: 'top', value: 'top' },
                ],
            },
        ];
        mountTable({ columns, dataSource: smallData(), pagination: false });
        await openFilter();
        await waitFor(() => expect(onFilterDropdownVisibleChange).toHaveBeenCalledWith(true));
        expect(onVisibleChange).not.toHaveBeenCalled();
        expect(onUpdateVisible).not.toHaveBeenCalled();
        expect(onFilterDropdownVisibleChange.mock.calls).toEqual([[true]]);

        onFilterDropdownVisibleChange.mockClear();
        const subItem = () => screen.queryByText('a', { selector: '.semi-dropdown-item *' });
        await userEvent.hover(screen.getByText('G1'));
        await waitFor(() => expect(subItem()).toBeVisible());
        await userEvent.unhover(screen.getByText('G1'));
        await userEvent.hover(screen.getByText('top'));
        await waitFor(() => expect(subItem()).toBeNull());
        expect(onVisibleChange).not.toHaveBeenCalled();
        expect(onUpdateVisible).not.toHaveBeenCalled();
        expect(onFilterDropdownVisibleChange).not.toHaveBeenCalled();

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(onFilterDropdownVisibleChange.mock.calls).toEqual([[false]]));
    });
});

describe('Table 筛选触发器', () => {
    const filterColumns = (): ColumnProps[] => [{ title: 'Name', dataIndex: 'name', filters: [{ text: 'Alpha', value: 'a' }], onFilter: () => true }];

    it('是原生 button，键盘可以聚焦并打开', async () => {
        mountTable({ columns: filterColumns(), dataSource: [{ key: '1', name: 'a' }], pagination: false });
        const trigger = screen.getByRole('button', { name: zh_CN.Table.filterColumn });
        expect(trigger.tagName).toBe('BUTTON');
        expect(trigger).toHaveAttribute('type', 'button');
        expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await userEvent.tab();
        expect(trigger).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
        expect(screen.getByText('Alpha')).toBeInTheDocument();
    });

    it('筛选生效时可访问名称表达生效状态，清空后恢复', async () => {
        mountTable({ columns: filterColumns(), dataSource: [{ key: '1', name: 'a' }], pagination: false });
        const trigger = screen.getByRole('button', { name: zh_CN.Table.filterColumn });
        expect(trigger).toHaveAttribute('aria-label', zh_CN.Table.filterColumn);
        await userEvent.click(trigger);
        await userEvent.click(await screen.findByText('Alpha'));
        await waitFor(() => expect(trigger).toHaveAttribute('aria-label', zh_CN.Table.filterColumnActive));
        await userEvent.click(screen.getByText('Alpha'));
        await waitFor(() => expect(trigger).toHaveAttribute('aria-label', zh_CN.Table.filterColumn));
    });

    it('筛选按钮的名称从语言包读取', () => {
        render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: {
                default: () => <Table columns={filterColumns()} dataSource={[{ key: '1', name: 'a' }]} pagination={false} />,
            },
        });
        expect(screen.getByRole('button', { name: ja_JP.Table.filterColumn })).toBeInTheDocument();
    });
});

describe('Table 筛选开发提示', () => {
    it('本地筛选的记录没有 key 时报错', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const columns: ColumnProps[] = [{ title: 'Name', dataIndex: 'name', onFilter: () => true }];
        const table = mountTable({ columns, dataSource: [{ name: 'a' }], pagination: false });
        await table.update({ props: { dataSource: [{ name: 'a' }, { name: 'b' }] } });
        expect(error.mock.calls.flat().join('\n')).toContain('You must specify a key');
        error.mockRestore();
    });

    it('带 filters 但没有 dataIndex 的列照常渲染，并给出警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        mountTable({
            columns: [{ title: 'Name', filters: [{ text: 'A', value: 'a' }], onFilter: () => true }],
            dataSource: [{ key: '1' }],
            pagination: false,
        });
        expect(screen.getByRole('columnheader', { name: /Name/ })).toBeInTheDocument();
        await userEvent.click(query(`.${P}-column-filter`));
        expect(await screen.findByText('A')).toBeInTheDocument();
        expect(warn.mock.calls.flat().join('\n')).toContain('dataIndex');
        warn.mockRestore();
    });

    it('没有 dataIndex 的列筛选后，onChange 的 filters 不混入其他列', async () => {
        const onChange = vi.fn<Change>();
        mountTable({
            columns: [
                { title: 'Action', key: 'action' },
                { title: 'Name', dataIndex: 'name', sorter: (a: any, b: any) => a.name.localeCompare(b.name) },
                { title: 'Tag', key: 'tag', filters: [{ text: 'A', value: 'a' }] },
            ],
            dataSource: getData(3),
            pagination: false,
            onChange,
        });
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        await userEvent.click(query(`.${P}-column-filter`));
        await userEvent.click(await screen.findByText('A'));
        await userEvent.click(screen.getByRole('button', { name: 'Name' }));
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ filters: [], extra: { changeType: 'sorter' } }));
        warn.mockRestore();
    });
});

describe('Table 筛选插槽', () => {
    it('filterDropdown 为 true 时 #filterDropdown 的暂存、确认、清除、关闭与还原', async () => {
        const onChange = vi.fn<Change>();
        const columns: ColumnProps[] = [
            {
                title: 'Name',
                dataIndex: 'name',
                filterDropdown: true,
                onFilter: (value, record) => record.name === value,
            },
        ];
        mountTable(
            { columns, dataSource: smallData(), pagination: false, onChange },
            {
                filterDropdown: (slot: TableFilterDropdownSlotProps) => (
                    <>
                        <span data-testid="temp">{(slot.tempFilteredValue ?? []).join(',')}</span>
                        <button type="button" onClick={() => slot.onTempFilteredValueChange(['a'])}>
                            pick a
                        </button>
                        <button type="button" onClick={() => slot.onConfirm()}>
                            apply
                        </button>
                        <button type="button" onClick={() => slot.onConfirm({ closeDropdown: true })}>
                            apply close
                        </button>
                        <button type="button" onClick={() => slot.onClear()}>
                            clear
                        </button>
                        <button type="button" onClick={() => slot.onClose()}>
                            close
                        </button>
                        <button type="button" onClick={() => slot.onReset()}>
                            reset
                        </button>
                    </>
                ),
            }
        );
        const [trigger] = getFilterButtons();
        await openFilter();
        await userEvent.click(screen.getByText('pick a'));
        expect(screen.getByTestId('temp')).toHaveTextContent('a');
        expect(firstCellTexts()).toEqual(['b', 'a', 'c']);
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(screen.getByText('reset'));
        expect(screen.getByTestId('temp')).toBeEmptyDOMElement();
        await userEvent.click(screen.getByText('pick a'));
        await userEvent.click(screen.getByText('apply'));
        expect(firstCellTexts()).toEqual(['a']);
        expect(trigger).toHaveAttribute('aria-label', zh_CN.Table.filterColumnActive);
        expect(menuOpen()).toBe(true);
        await userEvent.click(screen.getByText('apply'));
        expect(onChange).toHaveBeenCalledTimes(1);
        await userEvent.click(screen.getByText('clear'));
        expect(firstCellTexts()).toEqual(['b', 'a', 'c']);
        expect(screen.getByTestId('temp')).toBeEmptyDOMElement();
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ filters: [], extra: { changeType: 'filter' } }));
        await userEvent.click(screen.getByText('close'));
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
        await openFilter();
        await userEvent.click(screen.getByText('pick a'));
        await userEvent.click(screen.getByText('apply close'));
        expect(firstCellTexts()).toEqual(['a']);
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    });

    it('只设 filterDropdown: true 的列渲染筛选按钮', () => {
        mountTable({
            columns: [
                { title: 'Name', dataIndex: 'name', filterDropdown: true },
                { title: 'Age', dataIndex: 'age' },
            ],
            dataSource: smallData(),
            pagination: false,
        });
        expect(getFilterButtons()).toHaveLength(1);
        expect(getFilterButtons()[0].closest('th')).toHaveTextContent('Name');
    });

    it('#filterDropdownItem 中的 DropdownItem 点击 onChange 切换选中，参数正确', async () => {
        const onChange = vi.fn<Change>();
        render(FilterDropdownItem, { props: { onChange } });
        await openFilter();
        expect(screen.getByText('a: off, level 0, multiple')).toBeInTheDocument();
        await userEvent.click(screen.getByText('a: off, level 0, multiple'));
        expect(firstCellTexts()).toEqual(['a']);
        expect(screen.getByText('a: on, level 0, multiple')).toBeInTheDocument();
        expect(screen.getByTestId('filtered')).toHaveTextContent('a');
        await userEvent.click(screen.getByText('b: off, level 0, multiple'));
        expect(firstCellTexts()).toEqual(['b', 'a']);
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ filters: [expect.objectContaining({ filteredValue: ['a', 'b'] })] }));
        await userEvent.click(screen.getByText('a: on, level 0, multiple'));
        expect(firstCellTexts()).toEqual(['b']);
    });
});

describe('Table 筛选受控值撤销', () => {
    it('列的 filterDropdownVisible 撤销后，筛选按钮照常开关菜单', async () => {
        const column = (extra: Partial<ColumnProps> = {}): ColumnProps => ({ title: 'Name', dataIndex: 'name', filters: [{ text: 'only Ann', value: 'Ann' }], onFilter: (value, record) => record.name === value, ...extra });
        const menuShown = () => query(`.${P.replace('-table', '')}-dropdown-wrapper-show`);
        const dataSource = [
            { key: '1', name: 'Ann' },
            { key: '2', name: 'Bob' },
        ];
        const table = mountTable({ columns: [column({ filterDropdownVisible: true })], dataSource, pagination: false });
        expect(await screen.findByText('only Ann')).toBeInTheDocument();
        await table.update({ props: { columns: [column()] } });
        await waitFor(() => expect(menuShown()).toBeNull());
        await userEvent.click(getFilterButtons()[0]);
        await waitFor(() => expect(menuShown()).not.toBeNull());
        await userEvent.click(document.body);
        await waitFor(() => expect(menuShown()).toBeNull());
    });
});
