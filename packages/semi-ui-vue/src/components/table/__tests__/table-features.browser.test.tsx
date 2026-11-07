/** @jsxImportSource vue */
import { defineComponent, nextTick, onMounted, ref, shallowReactive } from 'vue';
import { screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { getData, render } from '@test/utils/vue';
import Table, { type ColumnProps, type TableCellSlotProps, type TableChangeInfo, type TableFilterDropdownSlotProps, type TableResizeFn } from '..';
import Button from '../../button';
import Input, { type InputHandle } from '../../input';
import Space from '../../space';
import Switch from '../../switch';

const prefix = `${BASE_CLASS_PREFIX}-table`;

type Row = Record<string, any>;
type Slots = Record<string, (...args: any[]) => unknown>;

const getFileData = (total: number) =>
    Array.from({ length: total }, (_, i) => ({
        key: `${i}`,
        name: i % 2 === 0 ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
        owner: i % 2 === 0 ? '姜鹏志' : '郝宣',
        size: (i * 1000) % 199,
    }));
const designFilters = ['Semi Design 设计稿', 'Semi D2C 设计稿'].map((value) => ({ text: value, value }));

const getHeaderCell = (container: Element, title: string) => Array.from(container.querySelectorAll<HTMLElement>(`.${prefix}-thead .${prefix}-row-head`)).find((th) => th.textContent === title) as HTMLElement;
const getBody = () => document.querySelector(`.${prefix}-body`) as HTMLElement;
const getBodyRows = () => document.querySelectorAll(`.${prefix}-tbody .${prefix}-row`);
const getDropdown = () => document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown`);
const getFilterTriggers = () => document.querySelectorAll<HTMLElement>(`.${prefix}-column-filter`);
const findElement = <E extends Element>(find: () => E | null | undefined) =>
    waitFor(() => {
        const found = find();
        expect(found).toBeTruthy();
        return found as E;
    });

function mountTable(props: Record<string, unknown>, slots: Slots = {}) {
    const state = shallowReactive({ props });
    const result = render(defineComponent(() => () => <Table {...state.props}>{slots}</Table>));
    return {
        container: result.container,
        update: async (next: Record<string, unknown>) => {
            state.props = { ...state.props, ...next };
            await nextTick();
        },
    };
}

// Real mouse input from Playwright in every browser: setPointerCapture rejects a synthetic pointerId. The drop target is
// the root, so the drag may end anywhere in the viewport; a point left of the viewport is clamped to its edge
async function drag(handle: Element, dx: number) {
    const root = document.documentElement.getBoundingClientRect();
    const box = handle.getBoundingClientRect();
    const x = Math.max(0, box.left + box.width / 2 + dx);
    await userEvent.dragAndDrop(handle, document.documentElement, { targetPosition: { x: x - root.left, y: box.top + box.height / 2 - root.top } });
}

describe('Table 列功能（浏览器）', () => {
    it('修复 #1599：排序列标题与列对齐方式一致', () => {
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name', align: 'center' },
            { title: 'Size', dataIndex: 'size', align: 'center', sorter: (a, b) => a.size - b.size, ellipsis: true },
            { title: 'Owner', dataIndex: 'owner', align: 'right', sorter: (a, b) => a.size - b.size },
        ];
        const { container } = mountTable({
            style: { width: '800px' },
            columns,
            dataSource: getFileData(3),
            pagination: false,
        });
        const sizeOperate = getHeaderCell(container, 'Size').querySelector(`.${prefix}-operate-wrapper`);
        const ownerCell = getHeaderCell(container, 'Owner');
        const ownerOperate = ownerCell.querySelector(`.${prefix}-operate-wrapper`) as HTMLElement;
        expect(sizeOperate).toHaveStyle({ justifyContent: 'center' });
        expect(ownerOperate).toHaveStyle({ justifyContent: 'flex-end' });
        const ownerCellRect = ownerCell.getBoundingClientRect();
        const ownerTitleRect = (ownerOperate.firstElementChild as HTMLElement).getBoundingClientRect();
        expect(ownerTitleRect.left).toBeGreaterThan(ownerCellRect.left + ownerCellRect.width / 2);
    });

    it('修复 #1869：选中行后保留已调整的列宽', async () => {
        const columns: ColumnProps[] = [
            { title: 'Key', dataIndex: 'key', key: 'key' },
            { title: '名称', dataIndex: 'name', key: 'name', width: 200 },
            { title: '大小', dataIndex: 'size', key: 'size', width: 400 },
            { title: '所有者', dataIndex: 'owner', key: 'owner' },
        ];
        const Demo = defineComponent(() => {
            const selectedRowKeys = ref<(string | number)[]>([]);
            return () => (
                <div style={{ width: '1200px' }}>
                    <Table
                        columns={columns}
                        dataSource={getFileData(3)}
                        pagination={false}
                        resizable
                        rowSelection={{
                            selectedRowKeys: selectedRowKeys.value,
                            onChange: (keys: (string | number)[]) => {
                                selectedRowKeys.value = keys;
                            },
                        }}
                    />
                </div>
            );
        });
        const { container } = render(Demo);
        const handle = await findElement(() => getHeaderCell(container, '名称')?.querySelector(`.${prefix}-resize-handle`));
        await drag(handle, 100);
        await waitFor(() => expect(getHeaderCell(container, '名称').getBoundingClientRect().width).toBeCloseTo(300, 0));
        await userEvent.click(container.querySelector(`.${prefix}-tbody .${BASE_CLASS_PREFIX}-checkbox`) as HTMLElement);
        await waitFor(() => expect(container.querySelectorAll(`.${prefix}-tbody .${BASE_CLASS_PREFIX}-checkbox-checked`)).toHaveLength(1));
        expect(getHeaderCell(container, '名称').getBoundingClientRect().width).toBeCloseTo(300, 0);
    });

    it('行选择', async () => {
        const columns: ColumnProps[] = [
            { title: 'Name', dataIndex: 'name', width: '30%' },
            {
                title: 'combine',
                width: '20%',
                dataIndex: 'test',
                children: [
                    {
                        title: 'Age',
                        width: '20%',
                        children: [
                            { title: 'Age1', width: '20%', dataIndex: 'age1' },
                            { title: 'Age2', width: '20%', dataIndex: 'age2' },
                        ],
                    },
                    { title: 'Key', width: '20%', dataIndex: 'key' },
                ],
            },
            { title: 'Address', width: '50%', dataIndex: 'address' },
        ];
        const data = ['John Brown', 'Jim Green', 'Joe Black', 'Disabled User'].map((name, i) => ({
            key: `${i + 1}`,
            name,
            age1: 23,
            age2: 11,
            address: 'London No. 1 Lake Park',
        }));
        mountTable({
            columns,
            dataSource: data,
            rowSelection: { getCheckboxProps: (record: Row) => ({ disabled: record.name === 'Disabled User' }) },
        });
        await userEvent.click(document.querySelector(`.${prefix}-row-head .${BASE_CLASS_PREFIX}-checkbox-inner-display`) as HTMLElement);
        await waitFor(() => expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-checkbox-checked`)).toHaveLength(4));
    });

    it('defaultFilteredValue', async () => {
        const Demo = defineComponent(() => {
            const dataSource = ref<Row[]>([]);
            const filteredValue = ref<any[]>(['Semi D2C 设计稿']);
            onMounted(() => {
                dataSource.value = getFileData(46);
            });
            const toggle = () => {
                dataSource.value = getFileData(dataSource.value.length === 46 ? 25 : 46);
            };
            return () => (
                <div>
                    <Button onClick={toggle}>{() => 'toggle change dataSource (46/25)'}</Button>
                    <Table
                        columns={[
                            {
                                title: '标题',
                                dataIndex: 'name',
                                width: 400,
                                filters: designFilters,
                                onFilter: (value: string, record: Row) => record.name.includes(value),
                                sorter: (a: Row, b: Row) => (a.name.length - b.name.length > 0 ? 1 : -1),
                                defaultFilteredValue: filteredValue.value,
                            },
                            { title: '大小', dataIndex: 'size' },
                        ]}
                        dataSource={dataSource.value}
                        scroll={{ y: 300 }}
                        onChange={({ filters }: { filters?: { dataIndex?: string; filteredValue?: any[] }[] }) => {
                            if (filters?.length) {
                                filteredValue.value = filters.find((filter) => filter.dataIndex === 'name')?.filteredValue as any[];
                            }
                        }}
                    />
                </div>
            );
        });
        render(Demo);
        const toggle = screen.getByRole('button', { name: 'toggle change dataSource (46/25)' });
        expect(await screen.findByText('显示第 1 条-第 10 条，共 23 条')).toBeInTheDocument();
        await userEvent.click(toggle);
        expect(await screen.findByText('显示第 1 条-第 10 条，共 12 条')).toBeInTheDocument();
        await userEvent.click(getFilterTriggers()[0]);
        await userEvent.click(await findElement(() => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-dropdown-menu .${BASE_CLASS_PREFIX}-dropdown-item:nth-child(2)`)));
        await userEvent.click(toggle);
        expect(await screen.findByText('显示第 1 条-第 10 条，共 46 条')).toBeInTheDocument();
    });

    it('可调整大小的表头', async () => {
        const columns: ColumnProps[] = [
            { title: 'Date', dataIndex: 'date', width: 200 },
            { title: 'Amount', dataIndex: 'amount', width: 100 },
            { title: 'Type', dataIndex: 'type', width: 100 },
            { title: 'Note', dataIndex: 'note', width: 100 },
            { title: 'Action', key: 'action' },
        ];
        const data = ['2018-02-11', '2018-03-11', '2018-04-11'].map((date, key) => ({
            key,
            date,
            amount: 120,
            type: 'income',
            note: 'transfer',
        }));
        // Room for the dragged widths: WebKit shrinks fixed columns that overflow an auto-layout table instead of widening it
        const { container } = mountTable({ columns, dataSource: data, resizable: true, style: { width: '1200px' } });
        const getCellWidth = (index: number) => getComputedStyle(document.querySelectorAll(`.${prefix}-row-cell`)[index]).width;
        const handles = () => container.querySelectorAll(`.${prefix}-resize-handle`);
        await drag(await findElement(() => handles()[0]), 164);
        await waitFor(() => expect(getCellWidth(0)).toBe('364px'));
        await drag(handles()[1], 300);
        await waitFor(() => expect(getCellWidth(1)).toBe('400px'));
    });

    it('拖动列宽手柄时回调收到新宽度，点击手柄不触发排序', async () => {
        const onResize = vi.fn<TableResizeFn>();
        const onResizeStart = vi.fn<TableResizeFn>();
        const onResizeStop = vi.fn<TableResizeFn>();
        const onChange = vi.fn<(info: TableChangeInfo) => void>();
        const { container } = mountTable({
            columns: [
                {
                    title: 'Date',
                    dataIndex: 'date',
                    width: 200,
                    sorter: (a: Row, b: Row) => a.date.localeCompare(b.date),
                },
                { title: 'Note', dataIndex: 'note' },
            ],
            dataSource: [{ key: 0, date: '2018-02-11' }],
            resizable: { onResize, onResizeStart, onResizeStop },
            onChange,
        });
        const handle = await findElement(() => container.querySelector(`.${prefix}-resize-handle`));
        await drag(handle, 80);
        expect(onResizeStart).toHaveBeenCalledTimes(1);
        expect(onResizeStop).toHaveBeenCalledTimes(1);
        expect(onResize).toHaveBeenLastCalledWith(expect.objectContaining({ width: 280 }));
        await waitFor(() => expect(getHeaderCell(container, 'Date').getBoundingClientRect().width).toBeCloseTo(280, 0));
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(handle);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('拖动列宽手柄越过起始侧时，宽度不小于 20', async () => {
        const onResize = vi.fn<TableResizeFn>();
        const { container } = mountTable({
            columns: [
                { title: 'Date', dataIndex: 'date', width: 200 },
                { title: 'Note', dataIndex: 'note' },
            ],
            dataSource: [{ key: 0, date: '2018-02-11' }],
            resizable: { onResize },
        });
        const getHandle = () => findElement(() => container.querySelector(`.${prefix}-resize-handle`));
        await drag(await getHandle(), -300);
        expect(onResize).toHaveBeenLastCalledWith(expect.objectContaining({ width: 20 }));
        await drag(await getHandle(), 50);
        expect(onResize).toHaveBeenLastCalledWith(expect.objectContaining({ width: 70 }));
    });

    it('调整大小', async () => {
        const Demo = defineComponent(() => {
            const scroll = ref<{ y?: number }>({});
            return () => (
                <div>
                    <Switch
                        onChange={(checked: boolean) => {
                            scroll.value = checked ? { y: 300 } : {};
                        }}
                    />
                    <Table
                        columns={[
                            { title: 'Name', dataIndex: 'name', width: 150 },
                            { title: 'Address', dataIndex: 'address' },
                        ]}
                        dataSource={getData(8)}
                        scroll={scroll.value}
                    />
                </div>
            );
        });
        render(Demo);
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-switch`) as HTMLElement);
        await expect.poll(getBody).toHaveStyle({ maxHeight: '300px' });
    });

    it('空筛选项', async () => {
        const Demo = defineComponent(() => {
            const filteredValue = ref<string[]>([]);
            return () => (
                <div>
                    <Input
                        style={{ width: '200px' }}
                        placeholder="筛选标题"
                        modelValue={filteredValue.value[0]}
                        onUpdate:modelValue={(value: string) => {
                            filteredValue.value = [value];
                        }}
                    />
                    <Table
                        columns={[
                            {
                                title: '标题',
                                dataIndex: 'name',
                                width: 400,
                                onFilter: (value: string, record: Row) => record.name.includes(value),
                                filteredValue: filteredValue.value,
                            },
                            { title: '大小', dataIndex: 'size' },
                        ]}
                        dataSource={getFileData(46)}
                        scroll={{ y: 300 }}
                    />
                </div>
            );
        });
        render(Demo);
        await userEvent.type(screen.getByPlaceholderText('筛选标题'), 'Semi D2C');
        await waitFor(() => expect(getBodyRows()[0].textContent).toContain('Semi D2C'));
        expect(getBodyRows()[1].textContent).toContain('Semi D2C');
    });

    it('可调整大小的 onHeaderCell', async () => {
        const onHeaderCell = (_column: ColumnProps, columnIndex: number) => ({ class: `test-${columnIndex}` });
        const Demo = defineComponent(() => {
            const selectedRowKeys = ref<(string | number)[]>([]);
            return () => (
                <Table
                    bordered
                    columns={[
                        { title: 'Name', dataIndex: 'name', width: 150, onHeaderCell },
                        {
                            title: 'Age',
                            dataIndex: 'age',
                            width: 150,
                            sorter: (a: Row, b: Row) => a.age - b.age,
                            onHeaderCell,
                        },
                        { title: 'Address', width: 200, dataIndex: 'address' },
                    ]}
                    dataSource={getData(46)}
                    resizable
                    rowSelection={{
                        selectedRowKeys: selectedRowKeys.value,
                        onChange: (keys: (string | number)[]) => {
                            selectedRowKeys.value = keys;
                        },
                    }}
                />
            );
        });
        render(Demo);
        await findElement(() => document.querySelector(`.${prefix}-resize-handle`));
        expect(document.querySelectorAll('.test-1')).toHaveLength(1);
        expect(document.querySelectorAll('.test-2')).toHaveLength(1);
    });

    it('sorter 的 sortOrder 参数', async () => {
        const columns: ColumnProps[] = [
            { title: '标题', dataIndex: 'name' },
            {
                title: '大小',
                dataIndex: 'size',
                sorter: (r1, r2, order) => {
                    const a = r1?.size;
                    const b = r2?.size;
                    if (typeof a === 'number' && typeof b === 'number') {
                        return a - b;
                    } else if (typeof a === 'undefined') {
                        return order === 'ascend' ? 1 : -1;
                    } else if (typeof b === 'undefined') {
                        return order === 'ascend' ? -1 : 1;
                    }
                    return 0;
                },
            },
        ];
        const data = [3, undefined, 1, 5, undefined, 2].map((size, i) => ({
            key: `${i + 1}`,
            name: `文档${i + 1}`,
            size,
        }));
        mountTable(
            { columns, dataSource: data },
            {
                cell: ({ column, text }: TableCellSlotProps) => (column.dataIndex === 'size' ? [text ? `${text} KB` : '未知'] : []),
            }
        );
        const sorter = document.querySelector(`.${prefix}-column-sorter`) as HTMLElement;
        for (const first of ['1 KB', '5 KB']) {
            await userEvent.click(sorter);
            await waitFor(() => expect(getBodyRows()[0].textContent).toContain(first));
            expect(getBodyRows()[4].textContent).toContain('未知');
            expect(getBodyRows()[5].textContent).toContain('未知');
        }
    });

    it('keepDOM', async () => {
        const expandData = [
            { key: 1, name: 'John Brown', description: 'My name is John Brown' },
            { key: 2, name: 'Jim Green' },
            { key: 3, name: 'Joe Black', description: 'My name is Joe Black' },
        ];
        const treeData = [
            {
                key: 1,
                name: '视频信息',
                children: [
                    { key: 11, name: '视频状态' },
                    { key: 12, name: '视频 ID', children: [{ name: '视频地址' }] },
                ],
            },
            {
                key: 2,
                name: '文本信息',
                children: [
                    { key: 21, name: '视频标题' },
                    { key: 22, name: '视频描述' },
                ],
            },
        ];
        const sectionData = Array.from({ length: 46 }, (_, i) => ({
            name: i % 2 === 0 ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
            owner: i % 2 === 0 ? '姜鹏志' : '郝宣',
            size: ((i * 1000) % 19) + 100,
        }));
        const nameColumns = [{ title: 'Name', dataIndex: 'name', key: 'name' }];
        render(
            defineComponent(() => () => (
                <div>
                    <Table data-cy="expand" columns={nameColumns} dataSource={expandData} expandCellFixed hideExpandedColumn={false} keepDOM scroll={{ x: '160%' }}>
                        {{ expandedRow: ({ record }: { record: Row }) => [<p>{record.description}</p>] }}
                    </Table>
                    <Table data-cy="tree" columns={nameColumns} dataSource={treeData} keepDOM />
                    <Table data-cy="section" clickGroupedRowToExpand columns={[...nameColumns, { title: '大小', dataIndex: 'size' }]} dataSource={sectionData} groupBy="size" keepDOM rowKey={(record: Row) => `${record.owner}-${record.name}`} scroll={{ y: 480 }}>
                        {{
                            groupSection: ({ groupKey }: { groupKey: string }) => [<strong>{`根据文件大小分组 ${groupKey} KB`}</strong>],
                        }}
                    </Table>
                </div>
            ))
        );
        const hiddenRows = (name: string) => document.querySelectorAll(`[data-cy=${name}] .${prefix}-row-hidden`);
        const expandIcon = (name: string) => document.querySelector(`[data-cy=${name}] .${prefix}-expand-icon`) as HTMLElement;
        await waitFor(() => expect(hiddenRows('expand')).toHaveLength(3));
        expect(hiddenRows('tree')).toHaveLength(5);
        await userEvent.click(expandIcon('tree'));
        await waitFor(() => expect(hiddenRows('tree')).toHaveLength(3));
        expect(hiddenRows('section')).toHaveLength(10);
        await userEvent.click(expandIcon('section'));
        await waitFor(() => expect(hiddenRows('section')).toHaveLength(7));
    });

    it('#filterDropdown', async () => {
        const inputRef = ref<InputHandle | null>(null);
        const panel = ({ tempFilteredValue, onTempFilteredValueChange, onConfirm, onClear, onClose }: TableFilterDropdownSlotProps, labels: [string, string, string], close: boolean, withRef: boolean) => [
            <Space style={{ padding: '8px' }} align="start" vertical>
                {() => (
                    <>
                        <Input ref={withRef ? inputRef : undefined} modelValue={tempFilteredValue?.[0]} onUpdate:modelValue={(value: string) => onTempFilteredValueChange(value ? [value] : [])} />
                        <Space>
                            {() => (
                                <>
                                    <Button onClick={() => onConfirm({ closeDropdown: close })}>{() => labels[0]}</Button>
                                    <Button onClick={() => onClear({ closeDropdown: close })}>{() => labels[1]}</Button>
                                    <Button onClick={() => onClose()}>{() => labels[2]}</Button>
                                </>
                            )}
                        </Space>
                    </>
                )}
            </Space>,
        ];
        mountTable(
            {
                columns: [
                    {
                        title: '标题',
                        dataIndex: 'name',
                        filterDropdown: true,
                        onFilter: (value: string, record: Row) => record.name.includes(value),
                        onFilterDropdownVisibleChange: () => inputRef.value?.focus(),
                    },
                    {
                        title: '所有者',
                        dataIndex: 'owner',
                        filterDropdown: true,
                        onFilter: (value: string, record: Row) => record.owner.includes(value),
                        defaultFilteredValue: ['姜鹏志'],
                    },
                ],
                dataSource: getFileData(46),
            },
            {
                filterDropdown: (props: TableFilterDropdownSlotProps) => (props.column.dataIndex === 'name' ? panel(props, ['筛选+关闭', '清除+关闭', '直接关闭'], true, true) : panel(props, ['筛选后不关闭', '清除后不关闭', '直接关闭'], false, false)),
            }
        );
        const getInput = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-dropdown .${BASE_CLASS_PREFIX}-input`);
        const clickButton = (name: string) => userEvent.click(screen.getByRole('button', { name }));
        const waitForClosed = () => waitFor(() => expect(getDropdown()).toBeNull());
        const openFilter = async (index: number) => {
            await userEvent.click(getFilterTriggers()[index]);
            await waitFor(() => expect(getInput()).not.toBeNull());
        };
        const paginationInfo = () => document.querySelector(`.${prefix}-pagination-info`);

        await openFilter(0);
        await waitFor(() => expect(getInput()).toHaveFocus());
        await userEvent.keyboard('12');
        await clickButton('筛选+关闭');
        await waitFor(() => expect(getBodyRows()).toHaveLength(1));
        await waitForClosed();

        await openFilter(0);
        await waitFor(() => expect(getInput()).toHaveFocus());
        await clickButton('清除+关闭');
        await waitFor(() => expect(getBodyRows()).toHaveLength(10));
        await waitForClosed();

        await openFilter(0);
        await waitFor(() => expect(getInput()).toHaveFocus());
        await clickButton('直接关闭');
        await waitForClosed();

        await openFilter(1);
        expect(getInput()).toHaveValue('姜鹏志');
        await clickButton('清除后不关闭');
        await waitFor(() => expect(paginationInfo()).toHaveTextContent('显示第 1 条-第 10 条，共 46 条'));
        expect(getDropdown()).not.toBeNull();
        await userEvent.click(getInput() as HTMLElement);
        await userEvent.keyboard('郝宣');
        await clickButton('筛选后不关闭');
        await waitFor(() => expect(paginationInfo()).toHaveTextContent('显示第 1 条-第 10 条，共 23 条'));
        expect(getDropdown()).not.toBeNull();
        await clickButton('直接关闭');
        await waitForClosed();
    });

    it('rowSelection 的 onCell 与 onHeaderCell', () => {
        mountTable({
            columns: [{ title: '标题', dataIndex: 'name' }],
            dataSource: getFileData(6),
            rowSelection: {
                onCell: () => ({ style: { background: 'red' }, class: 'test-td' }),
                onHeaderCell: () => ({ style: { background: 'blue' }, class: 'test-th' }),
            },
        });
        expect(document.querySelector('.test-th')?.getAttribute('style')).toContain('background: blue');
        expect(document.querySelector('.test-td')?.getAttribute('style')).toContain('background: red');
    });

    it('确认模式的筛选页脚按钮靠末端排列，与选项之间有分隔线', async () => {
        mountTable({
            columns: [
                {
                    title: 'name',
                    dataIndex: 'name',
                    filterConfirmMode: 'confirm',
                    filters: [{ text: 'a', value: 'a' }],
                    onFilter: (value: string, record: Row) => record.name === value,
                },
            ],
            dataSource: getFileData(3),
            pagination: false,
        });
        await userEvent.click(document.querySelector(`.${prefix}-column-filter`) as HTMLElement);
        const footer = await findElement(() => document.querySelector<HTMLElement>(`.${prefix}-column-filter-footer`));
        const style = getComputedStyle(footer);
        expect(style.display).toBe('flex');
        expect(style.justifyContent).toBe('flex-end');
        expect(style.padding).toBe('8px 12px');
        expect(style.borderTopWidth).toBe('1px');
        expect(style.borderTopStyle).toBe('solid');
    });

    it('用键盘改每页条数后，焦点留在每页条数选择器上', async () => {
        mountTable({
            columns: [{ title: 'name', dataIndex: 'name' }],
            dataSource: getFileData(46),
            pagination: { showSizeChanger: true },
        });
        const selector = screen.getByRole('combobox', { name: '每页条数' });
        await tabTo(selector);
        await userEvent.keyboard('{ArrowDown}');
        await screen.findByRole('listbox');
        await userEvent.keyboard('{ArrowDown}');
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(document.querySelectorAll(`.${prefix}-tbody .${prefix}-row`)).toHaveLength(20));
        expect(screen.getByRole('combobox', { name: '每页条数' })).toHaveFocus();
    });

    // dnd-kit turns each sortable row into role=button tabindex=0
    it('为拖拽排序设置为可聚焦的行显示主题焦点环', async () => {
        const { container } = mountTable({
            columns: [{ title: 'name', dataIndex: 'name' }],
            dataSource: getFileData(3),
            pagination: false,
            onRow: () => ({ role: 'button', tabindex: 0 }),
        });
        const row = container.querySelector(`.${prefix}-tbody .${prefix}-row`) as HTMLElement;
        await tabTo(row);
        expectThemeFocusRing(row);
    });

    it('列排序器显示主题焦点环', async () => {
        const { container } = mountTable({
            columns: [{ title: 'size', dataIndex: 'size', sorter: (a: Row, b: Row) => a.size - b.size }],
            dataSource: getFileData(3),
            pagination: false,
        });
        const sorter = container.querySelector(`.${prefix}-column-sorter-wrapper`) as HTMLElement;
        await tabTo(sorter);
        expectThemeFocusRing(sorter);
    });

    it('排序按钮的外观与周围的表头文字一致', () => {
        const { container } = mountTable({
            columns: [{ title: 'size', dataIndex: 'size', sorter: (a: Row, b: Row) => a.size - b.size }],
            dataSource: getFileData(3),
            pagination: false,
        });
        const th = container.querySelector('th') as HTMLElement;
        const button = getComputedStyle(container.querySelector(`.${prefix}-column-sorter-wrapper`) as HTMLElement);
        const cell = getComputedStyle(th);
        for (const prop of ['color', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight'] as const) {
            expect(button[prop]).toBe(cell[prop]);
        }
        expect(button.backgroundColor).toBe('rgba(0, 0, 0, 0)');
        expect(button.borderTopWidth).toBe('0px');
        expect(button.paddingLeft).toBe('0px');
    });

    it('展开按钮显示主题焦点环', async () => {
        const { container } = mountTable({ columns: [{ title: 'size', dataIndex: 'size' }], dataSource: getFileData(3), pagination: false }, { expandedRow: () => ['more'] });
        const expand = container.querySelector(`.${prefix}-expand-icon`) as HTMLElement;
        await tabTo(expand);
        expectThemeFocusRing(expand);
    });

    it('容器窄于整行时分页信息文字保持单行原宽，不按字换行', () => {
        const props = { columns: [{ title: '标题', dataIndex: 'name' }], dataSource: getFileData(46), pagination: { pageSize: 10, showSizeChanger: true } };
        const { container } = render(
            defineComponent(() => () => (
                <>
                    <div style={{ width: '900px' }}>
                        <Table {...props} />
                    </div>
                    <div style={{ width: '300px' }}>
                        <Table {...props} />
                    </div>
                </>
            ))
        );
        const [roomy, narrow] = Array.from(container.querySelectorAll(`.${prefix}-pagination-info`)).map((el) => {
            const { width, height } = el.getBoundingClientRect();
            return { width, height };
        });
        expect(narrow).toEqual(roomy);
    });
});
