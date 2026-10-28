/** @jsxImportSource vue */
import { KeepAlive, defineComponent, h, nextTick, shallowRef, type VNode } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor, within } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi, type Mock } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconHandle } from '@fibrae/semi-icons-vue';
import { render } from '@test/utils/vue';
import Transfer, {
    type TransferDataItem,
    type TransferEmits,
    type TransferHandle,
    type TransferLabelSlotProps,
    type TransferPagination,
    type TransferSelectedItemSlotProps,
    type TransferSelectedPanelSlotProps,
    type TransferSlots,
    type TransferSourceHeaderSlotProps,
    type TransferSourceItemSlotProps,
    type TransferSourcePanelSlotProps,
    type TransferTreeProps,
} from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import Model from './fixtures/model.vue';
import TemplateSlots from './fixtures/template-slots.vue';

type Handler<K extends keyof TransferEmits> = (...args: TransferEmits[K]) => void;
type Slots = { [K in keyof TransferSlots]?: (props: never) => VNode | VNode[] | string };

const prefixCls = `${BASE_CLASS_PREFIX}-transfer`;

const defaultItems = [
    { label: 'item1', value: '1', key: 'a' },
    { label: 'item2', value: '2', key: 'b' },
];

const dataWithGroup = [
    {
        title: '类别A',
        children: [
            { label: 'A-1', value: 1, disabled: false, key: 1 },
            { label: 'A-2', value: 2, disabled: false, key: 2 },
            { label: 'A-3', value: 3, disabled: false, key: 3 },
        ],
    },
    {
        title: '类别B',
        children: [
            { label: 'B-1', value: 4, disabled: false, key: 4 },
            { label: 'B-2', value: 5, disabled: false, key: 5 },
            { label: 'B-3（disabled）', value: 6, disabled: true, key: 6 },
        ],
    },
    {
        title: '类别C',
        children: [
            { label: 'C-1', value: 7, disabled: false, key: 7 },
            { label: 'C-2', value: 8, disabled: false, key: 8 },
            { label: 'C-3', value: 9, disabled: false, key: 9 },
        ],
    },
];

const renderTransfer = (props: Record<string, unknown> = {}, slots: Slots = {}) => render(Transfer, { props, slots });

const getRoot = () => document.querySelector(`.${prefixCls}`) as HTMLElement;
const getSearchInput = () => document.querySelector(`.${prefixCls}-filter input`) as HTMLInputElement;
const getLeftList = () => screen.getByRole('list', { name: zh_CN.Transfer.optionList });
const getSelectedList = () => screen.getByRole('list', { name: zh_CN.Transfer.selectedList });
const getLeftItem = (label: string) => within(getLeftList()).getByText(label);
const getLeftCheckedTexts = () => [...document.querySelectorAll(`.${prefixCls}-left .${BASE_CLASS_PREFIX}-checkbox-checked`)].map((item) => item.textContent);
const getLeftItemTexts = () => [...document.querySelectorAll(`.${prefixCls}-left .${prefixCls}-item`)].map((item) => item.textContent);
const getRightItemTexts = () => [...document.querySelectorAll(`.${prefixCls}-right-item-text`)].map((item) => item.textContent);
const getHeaderButtons = () => document.querySelectorAll<HTMLButtonElement>(`button.${prefixCls}-header-all`);
const getCloseIcons = () => document.querySelectorAll<HTMLButtonElement>(`.${prefixCls}-item-close-icon`);
const getGroupTitles = () => [...document.querySelectorAll(`.${prefixCls}-group-title`)].map((t) => t.textContent);

const renderWithHandle = (props: Record<string, unknown> = {}) => {
    const refFn = vi.fn<(handle: TransferHandle | null) => void>();
    const Host = (hostProps: Record<string, unknown>) => <Transfer {...hostProps} ref={(value) => refFn(value as TransferHandle | null)} />;
    const view = render(Host, { props });
    const handle = () => refFn.mock.calls[0]?.[0] as TransferHandle;
    return { ...view, handle };
};

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Transfer', () => {
    it('自定义 class 和 style', () => {
        render(Transfer, { attrs: { class: 'test', style: { color: 'red' } } });
        expect(getRoot()).toHaveClass(prefixCls, 'test');
        expect(getRoot()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('defaultValue 生效', () => {
        renderTransfer({ defaultValue: ['1'], dataSource: defaultItems });
        expect(getLeftCheckedTexts()).toEqual(['item1']);
        expect(getRightItemTexts()).toEqual(['item1']);
    });

    it('数据变化时搜索生效', async () => {
        const view = renderTransfer({ dataSource: [] });
        await userEvent.type(getSearchInput(), '2');
        await view.rerender({
            dataSource: [
                { label: '1', value: 1, key: 1 },
                { label: '2', value: 2, key: 2 },
            ],
        });
        expect(getSearchInput()).toHaveValue('2');
        expect(getLeftItemTexts()).toEqual(['2']);
        expect(screen.getByText('总个数：1')).toBeInTheDocument();
    });

    it('搜索', async () => {
        const onSearch = vi.fn<Handler<'search'>>();
        renderTransfer({ dataSource: defaultItems, onSearch });
        await userEvent.type(getSearchInput(), '1');
        expect(onSearch).toHaveBeenCalledExactlyOnceWith('1');
        expect(getLeftItemTexts()).toEqual(['item1']);
    });

    it('选择并变更', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        const onSelect = vi.fn<Handler<'select'>>();
        const onDeselect = vi.fn<Handler<'deselect'>>();
        renderTransfer({ dataSource: defaultItems, onChange, onDeselect, onSelect });

        await userEvent.click(getLeftItem('item1'));
        expect(getRightItemTexts()).toEqual(['item1']);
        await userEvent.click(getLeftItem('item1'));
        expect(getRightItemTexts()).toEqual([]);

        expect(onSelect).toHaveBeenCalledExactlyOnceWith(expect.objectContaining(defaultItems[0]));
        expect(onDeselect).toHaveBeenCalledExactlyOnceWith(expect.objectContaining(defaultItems[0]));
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[0][0]).toEqual([defaultItems[0].value]);
        expect(onChange.mock.calls[0][1]).toHaveLength(1);
        expect(onChange.mock.calls[0][1][0]).toMatchObject(defaultItems[0]);
        expect(onChange.mock.calls[1]).toEqual([[], []]);
    });

    it('全选与取消全选', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        renderTransfer({ dataSource: defaultItems, onChange });

        const selectAllButton = getHeaderButtons()[0];
        expect(selectAllButton).toHaveTextContent('全选');
        await userEvent.click(selectAllButton);
        expect(getRightItemTexts()).toEqual(['item1', 'item2']);
        expect(selectAllButton).toHaveTextContent('取消全选');
        await userEvent.click(selectAllButton);
        expect(getRightItemTexts()).toEqual([]);

        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[0][0]).toEqual(['1', '2']);
        expect(onChange.mock.calls[0][1]).toHaveLength(defaultItems.length);
        expect(onChange.mock.calls[1]).toEqual([[], []]);
    });

    it('清空全部', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        renderTransfer({ defaultValue: defaultItems.map((i) => i.value), dataSource: defaultItems, onChange });
        const clearAllButton = getHeaderButtons()[1];
        expect(clearAllButton).toHaveTextContent('清空');
        await userEvent.click(clearAllButton);

        expect(onChange).toHaveBeenCalledExactlyOnceWith([], []);
        expect(getRightItemTexts()).toEqual([]);
        expect(getLeftCheckedTexts()).toEqual([]);
    });

    it('分组 Transfer 渲染', () => {
        renderTransfer({ type: 'groupList', defaultValue: [6], dataSource: dataWithGroup });
        expect(getGroupTitles()).toEqual(['类别A', '类别B', '类别C']);
        expect(getRightItemTexts()).toEqual(['B-3（disabled）']);
    });

    it('同名或无 title 的分组各自渲染一行分组标题', () => {
        renderTransfer({
            type: 'groupList',
            dataSource: [{ title: 'G', children: [{ label: 'a', value: 'a', key: 'a' }] }, { title: 'G', children: [{ label: 'b', value: 'b', key: 'b' }] }, { children: [{ label: 'c', value: 'c', key: 'c' }] }, { children: [{ label: 'd', value: 'd', key: 'd' }] }],
        });
        expect(getGroupTitles().map((title) => title?.trim())).toEqual(['G', 'G', '', '']);
    });

    it('groupList 每组是外层列表的一项，组标题命名其中条目的嵌套列表', () => {
        renderTransfer({ type: 'groupList', dataSource: dataWithGroup });
        const groups = within(getLeftList())
            .getAllByRole('listitem')
            .filter((item) => item.parentElement === getLeftList());
        expect(groups).toHaveLength(3);
        const nested = within(groups[1]).getByRole('list', { name: '类别B' });
        expect(
            within(nested)
                .getAllByRole('listitem')
                .map((item) => item.textContent)
        ).toEqual(['B-1', 'B-2', 'B-3（disabled）']);
    });

    it('groupList 分页先按条目切片，再按组聚合', async () => {
        renderTransfer({ type: 'groupList', dataSource: dataWithGroup, pagination: { pageSize: 4 } });
        expect(getGroupTitles()).toEqual(['类别A', '类别B']);
        expect(getLeftItemTexts()).toEqual(['A-1', 'A-2', 'A-3', 'B-1']);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
        expect(getGroupTitles()).toEqual(['类别B', '类别C']);
        expect(getLeftItemTexts()).toEqual(['B-2', 'B-3（disabled）', 'C-1', 'C-2']);
    });

    it('disabled 属性', () => {
        renderTransfer({ disabled: true, dataSource: defaultItems });
        expect(getRoot()).toHaveClass(`${prefixCls}-disabled`);
    });

    it('受控 modelValue', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        const onUpdate = vi.fn<Handler<'update:modelValue'>>();
        renderTransfer({ modelValue: ['1'], dataSource: defaultItems, onChange, 'onUpdate:modelValue': onUpdate });

        expect(getLeftCheckedTexts()).toEqual(['item1']);
        expect(getRightItemTexts()).toEqual(['item1']);

        await userEvent.click(getLeftItem('item2'));

        expect(onChange).toHaveBeenCalledOnce();
        expect(onChange.mock.calls[0][0]).toEqual(['1', '2']);
        expect(onUpdate).toHaveBeenCalledExactlyOnceWith(['1', '2']);
        expect(getLeftCheckedTexts()).toEqual(['item1']);
        expect(getRightItemTexts()).toEqual(['item1']);
    });

    it('draggable 属性：加载前的替身句柄有名称但标为不可用', () => {
        renderTransfer({ defaultValue: ['1'], dataSource: defaultItems, draggable: true });
        expect(document.querySelector(`.${prefixCls}-right-item`)).toHaveClass(`${prefixCls}-right-item-draggable`);
        const handle = screen.getByRole('button', { name: zh_CN.Transfer.dragSort });
        expect(handle).toHaveAttribute('aria-disabled', 'true');
        expect(handle).not.toHaveAttribute('tabindex');
    });

    it('可排序的已选列表仍是其项目的列表，加载后句柄是真正的按钮', async () => {
        renderTransfer({ defaultValue: ['1'], dataSource: defaultItems, draggable: true });
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-right-item-sortable-item`)).not.toBeNull());
        expect(within(getSelectedList()).getByRole('listitem')).toHaveTextContent('item1');
        const handle = screen.getByRole('button', { name: zh_CN.Transfer.dragSort });
        expect(handle.tagName).toBe('BUTTON');
        expect(handle).not.toHaveAttribute('aria-disabled');
        expect(handle).toHaveClass(`${prefixCls}-right-item-sortable-handle`);
    });

    it('禁用的 Transfer 中，列表是可滚动的 Tab 停靠点', async () => {
        renderTransfer({ defaultValue: ['1'], disabled: true, dataSource: defaultItems });
        await userEvent.tab();
        expect(getLeftList()).toHaveFocus();
        await userEvent.tab();
        expect(getSelectedList()).toHaveFocus();
    });

    it('启用的 Transfer 中，列表本身不是 Tab 停靠点', () => {
        renderTransfer({ defaultValue: ['1'], dataSource: defaultItems });
        expect(getLeftList()).not.toHaveAttribute('tabindex');
        expect(getSelectedList()).not.toHaveAttribute('tabindex');
    });

    it('#emptyLeft 与 #emptyRight 插槽', () => {
        renderTransfer(
            { dataSource: [] },
            {
                emptyLeft: () => <span class="custom-empty-left">No data</span>,
                emptyRight: () => <span class="custom-empty-right">No selection</span>,
            }
        );
        expect(document.querySelector(`.${prefixCls}-left-empty .custom-empty-left`)).toHaveTextContent('No data');
        expect(document.querySelector(`.${prefixCls}-right-empty .custom-empty-right`)).toHaveTextContent('No selection');
    });

    it('filter 属性', async () => {
        renderTransfer({ dataSource: defaultItems, filter: () => true });
        await userEvent.type(getSearchInput(), 'no-such-label');
        expect(getLeftItemTexts()).toEqual(['item1', 'item2']);
    });

    it('默认过滤不区分大小写', async () => {
        renderTransfer({ dataSource: defaultItems });
        await userEvent.type(getSearchInput(), 'ITEM2');
        expect(getLeftItemTexts()).toEqual(['item2']);
    });

    it('#sourceItem 插槽', () => {
        renderTransfer(
            { dataSource: defaultItems },
            {
                sourceItem: ({ item }: TransferSourceItemSlotProps) => <div class="custom-source-item">{item.label}</div>,
            }
        );
        expect([...document.querySelectorAll('.custom-source-item')].map((item) => item.textContent)).toEqual(['item1', 'item2']);
    });

    it('#selectedItem 插槽', () => {
        renderTransfer(
            { defaultValue: ['1'], dataSource: defaultItems },
            {
                selectedItem: ({ item }: TransferSelectedItemSlotProps) => <div class="custom-selected-item">{item.label}</div>,
            }
        );
        expect(document.querySelector(`.${prefixCls}-right .custom-selected-item`)).toHaveTextContent('item1');
    });

    it('自定义渲染的项目是其列表的列表项', () => {
        const renderItem = ({ item }: { item: TransferDataItem }) => <div>{item.label}</div>;
        renderTransfer({ defaultValue: ['1'], dataSource: defaultItems }, { selectedItem: renderItem, sourceItem: renderItem });
        const [source, selected] = screen.getAllByRole('list');
        expect(
            within(source)
                .getAllByRole('listitem')
                .map((item) => item.textContent)
        ).toEqual(['item1', 'item2']);
        expect(within(selected).getByRole('listitem')).toHaveTextContent('item1');
    });

    it('inputProps 属性覆盖内置的 placeholder', () => {
        renderTransfer({ dataSource: defaultItems, inputProps: { placeholder: 'Custom placeholder' } });
        expect(getSearchInput()).toHaveAttribute('placeholder', 'Custom placeholder');
    });

    it('#selectedPanel 插槽', async () => {
        renderTransfer(
            { defaultValue: ['1', '2'], dataSource: defaultItems },
            {
                selectedPanel: ({ selectedData, onClear, onRemove }: TransferSelectedPanelSlotProps) => (
                    <div class="custom-selected-panel">
                        <button type="button" onClick={onClear}>
                            Clear
                        </button>
                        {selectedData.map((item) => (
                            <div key={item.key} class="custom-item">
                                {item.label}
                                <button type="button" onClick={() => onRemove(item)}>
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                ),
            }
        );
        const getCustomItems = () => document.querySelectorAll('.custom-item');
        expect(document.querySelector('.custom-selected-panel')).not.toBeNull();
        expect(getCustomItems()).toHaveLength(2);

        await userEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
        expect(getCustomItems()).toHaveLength(1);
        expect(getLeftCheckedTexts()).toEqual(['item2']);

        await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
        expect(getCustomItems()).toHaveLength(0);
        expect(getLeftCheckedTexts()).toEqual([]);
    });

    it('#sourcePanel 插槽', async () => {
        renderTransfer(
            { dataSource: defaultItems },
            {
                sourcePanel: ({ filterData, onSelectOrRemove, onAllClick }: TransferSourcePanelSlotProps) => (
                    <div class="custom-source-panel">
                        <button type="button" onClick={onAllClick}>
                            Select All
                        </button>
                        {filterData.map((item) => (
                            <button key={item.key} type="button" class="custom-source-item" onClick={() => onSelectOrRemove(item)}>
                                {item.label}
                            </button>
                        ))}
                    </div>
                ),
            }
        );
        expect(document.querySelector('.custom-source-panel')).not.toBeNull();
        expect([...document.querySelectorAll('.custom-source-item')].map((item) => item.textContent)).toEqual(['item1', 'item2']);
        await userEvent.click(screen.getByRole('button', { name: 'Select All' }));
        expect(getRightItemTexts()).toEqual(['item1', 'item2']);
    });

    it('#sourceHeader 插槽', async () => {
        renderTransfer(
            { dataSource: defaultItems },
            {
                sourceHeader: ({ num, showButton, allChecked, onAllClick }: TransferSourceHeaderSlotProps) => (
                    <div class="custom-source-header">
                        <span>{`Total: ${num}`}</span>
                        {showButton ? (
                            <button type="button" onClick={onAllClick}>
                                {allChecked ? 'Deselect' : 'Select All'}
                            </button>
                        ) : null}
                    </div>
                ),
            }
        );
        expect(document.querySelector('.custom-source-header')).not.toBeNull();
        expect(screen.getByText('Total: 2')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Select All' }));
        expect(screen.getByRole('button', { name: 'Deselect' })).toBeInTheDocument();
    });

    it('#selectedHeader 插槽', async () => {
        renderTransfer(
            { defaultValue: ['1'], dataSource: defaultItems },
            {
                selectedHeader: ({ num, showButton, onClear }: { num: number; showButton: boolean; onClear: () => void }) => (
                    <div class="custom-selected-header">
                        <span>{`Selected: ${num}`}</span>
                        {showButton ? (
                            <button type="button" onClick={onClear}>
                                Clear
                            </button>
                        ) : null}
                    </div>
                ),
            }
        );
        expect(screen.getByText('Selected: 1')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
        expect(screen.getByText('Selected: 0')).toBeInTheDocument();
    });

    it('loading 属性', () => {
        renderTransfer({ dataSource: defaultItems, loading: true });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-spin`)).not.toBeNull();
    });

    it('filter 为 false 时隐藏搜索框', () => {
        renderTransfer({ dataSource: defaultItems, filter: false });
        expect(document.querySelector(`.${prefixCls}-filter`)).toBeNull();
    });

    it('已选项目的 draggable', () => {
        renderTransfer({ defaultValue: ['1', '2'], dataSource: defaultItems, draggable: true });
        expect(screen.getAllByRole('button', { name: zh_CN.Transfer.dragSort })).toHaveLength(2);
        expect(getRightItemTexts()).toEqual(['item1', 'item2']);
    });

    it('从右侧面板移除项目', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        renderTransfer({ defaultValue: ['1'], dataSource: defaultItems, onChange });
        await userEvent.click(getCloseIcons()[0]);
        expect(onChange).toHaveBeenCalledOnce();
        expect(onChange.mock.calls[0][0]).toHaveLength(0);
        expect(getRightItemTexts()).toEqual([]);
    });

    it('所有项目禁用时不显示全选按钮', () => {
        renderTransfer({
            dataSource: [
                { label: 'item1', value: '1', key: 'a', disabled: true },
                { label: 'item2', value: '2', key: 'b', disabled: true },
            ],
        });
        expect(getHeaderButtons()).toHaveLength(0);
    });

    it('search 方法', async () => {
        const onSearch = vi.fn<Handler<'search'>>();
        const { handle } = renderWithHandle({ dataSource: defaultItems, onSearch });
        handle().search('item1');
        await nextTick();
        expect(getSearchInput()).toHaveValue('item1');
        expect(getLeftItemTexts()).toEqual(['item1']);
        expect(onSearch).not.toHaveBeenCalled();
    });

    it('#selectedPanel 配合 onSortEnd', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        renderTransfer(
            { defaultValue: ['1', '2'], dataSource: defaultItems, onChange },
            {
                selectedPanel: ({ selectedData, onSortEnd }: TransferSelectedPanelSlotProps) => (
                    <div>
                        <button type="button" onClick={() => onSortEnd({ oldIndex: 0, newIndex: 1 })}>
                            Sort
                        </button>
                        {selectedData.map((item) => (
                            <div key={item.key} class="custom-item">
                                {item.label}
                            </div>
                        ))}
                    </div>
                ),
            }
        );
        await userEvent.click(screen.getByRole('button', { name: 'Sort' }));
        expect([...document.querySelectorAll('.custom-item')].map((item) => item.textContent)).toEqual(['item2', 'item1']);
        expect(onChange).toHaveBeenCalledOnce();
        expect(onChange.mock.calls[0][0]).toEqual(['2', '1']);
    });

    it('同时自定义 #sourcePanel 和 #selectedPanel', () => {
        renderTransfer(
            { dataSource: defaultItems },
            {
                sourcePanel: () => <div>Source</div>,
                selectedPanel: () => <div>Selected</div>,
            }
        );
        expect(getRoot()).toHaveClass(`${prefixCls}-custom-panel`);
        expect(getRoot()).toHaveTextContent('SourceSelected');
    });

    it('#sourcePanel 配合 onSelect', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        renderTransfer(
            { dataSource: defaultItems, onChange },
            {
                sourcePanel: ({ onSelect, onAllClick }: TransferSourcePanelSlotProps) => (
                    <div>
                        <button type="button" onClick={() => onSelect(['1', '2'])}>
                            Select Multiple
                        </button>
                        <button type="button" onClick={onAllClick}>
                            Select All
                        </button>
                    </div>
                ),
            }
        );
        await userEvent.click(screen.getByRole('button', { name: 'Select Multiple' }));
        expect(onChange).toHaveBeenCalledOnce();
        expect(onChange.mock.calls[0][0]).toEqual(['1', '2']);
        expect(getRightItemTexts()).toEqual(['item1', 'item2']);

        await userEvent.click(screen.getByRole('button', { name: 'Select All' }));
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[1]).toEqual([[], []]);
        expect(getRightItemTexts()).toEqual([]);
    });

    it('select 与 deselect 事件', async () => {
        const onSelect = vi.fn<Handler<'select'>>();
        const onDeselect = vi.fn<Handler<'deselect'>>();
        renderTransfer({ dataSource: defaultItems, onDeselect, onSelect });

        await userEvent.click(getLeftItem('item1'));
        expect(onSelect).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ value: '1' }));
        await userEvent.click(getLeftItem('item1'));
        expect(onDeselect).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ value: '1' }));
    });

    it('无已选项时右侧显示空状态', () => {
        renderTransfer({ defaultValue: [], dataSource: [] });
        expect(document.querySelector(`.${prefixCls}-right-empty`)).toHaveTextContent('暂无内容，可从左侧勾选');
    });

    it('非受控时点击更新两侧', async () => {
        renderTransfer({ dataSource: defaultItems });
        await userEvent.click(getLeftItem('item1'));
        expect(getLeftCheckedTexts()).toEqual(['item1']);
        expect(getRightItemTexts()).toEqual(['item1']);
    });

    it('#sourcePanel 配合 onSelectOrRemove', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        renderTransfer(
            { dataSource: defaultItems, onChange },
            {
                sourcePanel: ({ filterData, onSelectOrRemove }: TransferSourcePanelSlotProps) => (
                    <div>
                        {filterData.map((item) => (
                            <button key={item.key} type="button" onClick={() => onSelectOrRemove(item)}>
                                {item.label}
                            </button>
                        ))}
                    </div>
                ),
            }
        );
        await userEvent.click(screen.getByText('item1'));
        expect(onChange).toHaveBeenCalledOnce();
        expect(onChange.mock.calls[0][0]).toEqual(['1']);
        expect(getRightItemTexts()).toEqual(['item1']);
    });
});

describe('Transfer 行为', () => {
    const items = [
        { label: 'apple', value: 'a', key: 'a' },
        { label: 'banana', value: 'b', key: 'b' },
        { label: 'cherry', value: 'c', key: 'c', disabled: true },
    ];
    const many = Array.from({ length: 5 }, (_, i) => ({ label: `item${i}`, value: i, key: i }));

    it('受控 modelValue 跟随重新渲染，点击只负责通知', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        const view = renderTransfer({ modelValue: ['a'], dataSource: items, onChange });
        await view.rerender({ modelValue: ['b', 'a'] });
        expect(getRightItemTexts()).toEqual(['banana', 'apple']);
        expect(getLeftCheckedTexts()).toEqual(['apple', 'banana']);

        await userEvent.click(getCloseIcons()[0]);
        expect(onChange).toHaveBeenCalledWith(['a'], [items[0]]);
        expect(getRightItemTexts()).toEqual(['banana', 'apple']);
    });

    it('父级以同一值重新渲染时仍以受控值为准', async () => {
        const view = renderTransfer({ modelValue: ['a'], dataSource: items });
        await userEvent.click(getLeftItem('banana'));
        await view.rerender({ modelValue: ['a'] });
        expect(getRightItemTexts()).toEqual(['apple']);
        expect(getLeftCheckedTexts()).toEqual(['apple']);
    });

    it('显式 undefined 的 modelValue 是非受控', async () => {
        renderTransfer({ modelValue: undefined, defaultValue: ['b'], dataSource: items });
        await userEvent.click(getLeftItem('apple'));
        expect(getRightItemTexts()).toEqual(['banana', 'apple']);
    });

    it('defaultValue 只在挂载时读取', async () => {
        const view = renderTransfer({ defaultValue: ['a'], dataSource: items });
        await view.rerender({ defaultValue: ['b'] });
        expect(getRightItemTexts()).toEqual(['apple']);
    });

    it('受控 modelValue 变为 undefined 后回到非受控的已选项，右侧不残留受控值', async () => {
        const view = renderTransfer({ defaultValue: ['b'], modelValue: ['a'], dataSource: items });
        expect(getRightItemTexts()).toEqual(['apple']);
        await view.rerender({ modelValue: undefined });
        expect(getRightItemTexts()).toEqual(['banana']);
        await userEvent.click(getLeftItem('apple'));
        expect(getRightItemTexts()).toEqual(['banana', 'apple']);
    });

    it('v-model 往返：点击写回父级，父级改值与置空都生效', async () => {
        render(Model);
        await userEvent.click(getLeftItem('banana'));
        expect(screen.getByTestId('value')).toHaveTextContent('["a","b"]');
        expect(screen.getByTestId('changes')).toHaveTextContent('[["a","b"],["a","b"]]');
        expect(getRightItemTexts()).toEqual(['apple', 'banana']);

        await userEvent.click(screen.getByRole('button', { name: 'set' }));
        expect(getRightItemTexts()).toEqual(['banana']);

        await userEvent.click(screen.getByRole('button', { name: 'reset' }));
        expect(getRightItemTexts()).toEqual([]);
        await userEvent.click(getLeftItem('apple'));
        expect(getRightItemTexts()).toEqual(['apple']);
    });

    it('dataSource 在挂载后到达时 defaultValue 仍生效', async () => {
        const view = renderTransfer({ defaultValue: ['a'], dataSource: [], loading: true });
        await view.rerender({ dataSource: items, loading: false });
        expect(getRightItemTexts()).toEqual(['apple']);
        expect(getLeftCheckedTexts()).toEqual(['apple']);
    });

    it('非受控的已选项跟随 dataSource 的修改与删除', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        const view = renderTransfer({ dataSource: items, onChange });
        await userEvent.click(getLeftItem('apple'));
        await userEvent.click(getLeftItem('banana'));
        expect(getRightItemTexts()).toEqual(['apple', 'banana']);

        const renamed = { ...items[0], label: 'APPLE' };
        const date = { label: 'date', value: 'd', key: 'd' };
        await view.rerender({ dataSource: [renamed, items[2], date] });
        expect(getRightItemTexts()).toEqual(['APPLE']);

        await userEvent.click(getLeftItem('date'));
        expect(onChange).toHaveBeenLastCalledWith(['a', 'd'], [renamed, date]);

        await userEvent.click(getHeaderButtons()[1]);
        expect(onChange).toHaveBeenLastCalledWith([], []);
        expect(getRightItemTexts()).toEqual([]);
    });

    it('非受控时 dataSource 把已选项改为禁用后，其移除按钮随之禁用', async () => {
        const view = renderTransfer({ dataSource: items });
        await userEvent.click(getLeftItem('apple'));
        await view.rerender({ dataSource: [{ ...items[0], disabled: true }, items[1]] });
        expect(getCloseIcons()[0]).toBeDisabled();
    });

    it('无数据时显示空状态', () => {
        renderTransfer({ dataSource: [] });
        expect(document.querySelector(`.${prefixCls}-left-empty`)).toHaveTextContent('暂无数据');
        expect(document.querySelector(`.${prefixCls}-right-empty`)).toHaveTextContent('暂无内容，可从左侧勾选');
    });

    it('禁用项目不能切换，全选和清空时保持其状态', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        const onSelect = vi.fn<Handler<'select'>>();
        renderTransfer({ defaultValue: ['c'], dataSource: items, onChange, onSelect });
        await userEvent.click(getLeftItem('cherry'));
        expect(getCloseIcons()[0]).toHaveClass(`${prefixCls}-item-close-icon-disabled`);
        await userEvent.click(getCloseIcons()[0]);
        expect(onChange).not.toHaveBeenCalled();
        expect(onSelect).not.toHaveBeenCalled();
        expect(getHeaderButtons()).toHaveLength(1);

        await userEvent.click(getHeaderButtons()[0]);
        expect(onChange).toHaveBeenLastCalledWith(['c', 'a', 'b'], [items[2], items[0], items[1]]);
        expect(getRightItemTexts()).toEqual(['cherry', 'apple', 'banana']);

        await userEvent.click(getHeaderButtons()[1]);
        expect(onChange).toHaveBeenLastCalledWith(['c'], [items[2]]);
        expect(getRightItemTexts()).toEqual(['cherry']);
    });

    it('禁用的 Transfer 禁用其控件并忽略点击', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        renderTransfer({ defaultValue: ['a'], disabled: true, dataSource: items, onChange });
        expect(getSearchInput()).toBeDisabled();
        expect(getHeaderButtons()).toHaveLength(2);
        getHeaderButtons().forEach((button) => expect(button).toBeDisabled());
        await userEvent.click(getCloseIcons()[0]);
        expect(onChange).not.toHaveBeenCalled();
        expect(getRightItemTexts()).toEqual(['apple']);
    });

    it('搜索模式下全选只影响匹配项，无匹配时显示 #emptySearch', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        renderTransfer({ dataSource: items, onChange }, { emptySearch: () => 'nothing' });
        await userEvent.type(getSearchInput(), 'an');
        expect(getLeftItemTexts()).toEqual(['banana']);
        expect(screen.getByText('总个数：1')).toBeInTheDocument();

        await userEvent.click(getHeaderButtons()[0]);
        expect(onChange).toHaveBeenLastCalledWith(['b'], [items[1]]);

        await userEvent.clear(getSearchInput());
        await userEvent.type(getSearchInput(), 'zzz');
        expect(document.querySelector(`.${prefixCls}-left-empty`)).toHaveTextContent('nothing');
    });

    it('搜索过滤掉前面的条目后，剩下的条目仍是同一个 DOM 节点', async () => {
        renderTransfer({ dataSource: items });
        const getBanana = () =>
            within(getLeftList())
                .getAllByRole('listitem')
                .find((item) => item.textContent === 'banana');
        const banana = getBanana();
        await userEvent.type(getSearchInput(), 'an');
        expect(getLeftItemTexts()).toEqual(['banana']);
        expect(getBanana()).toBe(banana);
    });

    it('groupList 搜索过滤掉前一组后，剩下组的条目仍是同一个 DOM 节点', async () => {
        renderTransfer({ type: 'groupList', dataSource: dataWithGroup });
        const getB1 = () =>
            within(getLeftList())
                .getAllByRole('listitem')
                .find((item) => item.textContent === 'B-1');
        const b1 = getB1();
        await userEvent.type(getSearchInput(), 'B-1');
        expect(within(getLeftList()).getByRole('list', { name: '类别B' })).toContainElement(getB1() ?? null);
        expect(getB1()).toBe(b1);
    });

    it('groupList 传给 change 的项目中不含 _parent', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        renderTransfer({ type: 'groupList', dataSource: dataWithGroup, onChange });
        await userEvent.click(getLeftItem('B-1'));
        expect(onChange).toHaveBeenCalledWith([4], [{ label: 'B-1', value: 4, disabled: false, key: 4 }]);
        expect(getRightItemTexts()).toEqual(['B-1']);
    });

    it('groupList 传给 select 和 deselect 的项目中不含 _parent', async () => {
        const onSelect = vi.fn<Handler<'select'>>();
        const onDeselect = vi.fn<Handler<'deselect'>>();
        renderTransfer({ type: 'groupList', dataSource: dataWithGroup, onSelect, onDeselect });
        await userEvent.click(getLeftItem('B-1'));
        await userEvent.click(getLeftItem('B-1'));
        const expected = { label: 'B-1', value: 4, disabled: false, key: 4 };
        expect(onSelect).toHaveBeenCalledWith(expected);
        expect(onDeselect).toHaveBeenCalledWith(expected);
    });

    it('#sourcePanel 接收面板状态', async () => {
        const sourcePanel = vi.fn<(props: TransferSourcePanelSlotProps) => VNode[]>(() => []);
        renderTransfer({ defaultValue: ['a'], dataSource: items }, { sourcePanel });
        const panelProps = sourcePanel.mock.lastCall?.[0] as TransferSourcePanelSlotProps;
        expect(panelProps).toEqual({
            value: ['a'],
            loading: undefined,
            noMatch: false,
            filterData: items,
            sourceData: items,
            propsDataSource: items,
            allChecked: false,
            showNumber: 3,
            inputValue: '',
            selectedItems: new Map([['a', items[0]]]),
            onSearch: expect.any(Function),
            onAllClick: expect.any(Function),
            onSelectOrRemove: expect.any(Function),
            onSelect: expect.any(Function),
        });
        panelProps.onSearch('ch');
        await nextTick();
        expect(sourcePanel.mock.lastCall?.[0]).toMatchObject({
            inputValue: 'ch',
            showNumber: 1,
            filterData: [items[2]],
            noMatch: false,
        });
        sourcePanel.mock.lastCall?.[0].onSearch('zzz');
        await nextTick();
        expect(sourcePanel.mock.lastCall?.[0]).toMatchObject({ noMatch: true, showNumber: 0, filterData: [] });
    });

    it('#selectedPanel 按顺序接收已选项目', () => {
        const selectedPanel = vi.fn<(props: TransferSelectedPanelSlotProps) => VNode[]>(() => []);
        renderTransfer({ defaultValue: ['b', 'a'], dataSource: items }, { selectedPanel });
        expect(selectedPanel.mock.lastCall?.[0]).toEqual({
            length: 2,
            selectedData: [
                { ...items[1], fullPath: undefined },
                { ...items[0], fullPath: undefined },
            ],
            onClear: expect.any(Function),
            onRemove: expect.any(Function),
            onSortEnd: expect.any(Function),
        });
    });

    it('#sourceItem 接收项目、选中状态和切换函数，参数不展平到项目上', async () => {
        const sourceItem = vi.fn<(props: TransferSourceItemSlotProps) => VNode>(({ item, onChange }) => (
            <button type="button" onClick={onChange}>
                {item.label}
            </button>
        ));
        const withOwnFields = [...items, { label: 'date', value: 'd', key: 'd', checked: 'own' }];
        renderTransfer({ defaultValue: ['b'], dataSource: withOwnFields }, { sourceItem });
        expect(sourceItem).toHaveBeenCalledWith(expect.objectContaining({ item: items[1], index: 1, checked: true, onChange: expect.any(Function) }));
        expect(sourceItem).toHaveBeenCalledWith(expect.objectContaining({ item: withOwnFields[3], index: 3, checked: false }));
        await userEvent.click(screen.getByRole('button', { name: 'apple' }));
        expect(getRightItemTexts()).toEqual(['banana', 'apple']);
    });

    it('draggable 向 #selectedItem 提供 handle，并包裹项目以便排序', async () => {
        renderTransfer(
            { defaultValue: ['a', 'b'], dataSource: items, draggable: true },
            {
                selectedItem: ({ item, handle }: TransferSelectedItemSlotProps) => (
                    <div class="custom-selected">
                        {h(handle ?? 'span', null, () => (
                            <span class="custom-handle" />
                        ))}
                        {item.label}
                    </div>
                ),
            }
        );
        expect(document.querySelectorAll('.custom-handle')).toHaveLength(2);
        await waitFor(() => expect(document.querySelectorAll(`.${prefixCls}-right-item-sortable-item`)).toHaveLength(2));
        expect([...document.querySelectorAll('.custom-selected')].map((node) => node.textContent)).toEqual(['apple', 'banana']);
        const handles = screen.getAllByRole('button', { name: zh_CN.Transfer.dragSort });
        expect(handles).toHaveLength(2);
        expect(handles[0].querySelector('.custom-handle')).not.toBeNull();
    });

    it('没有 draggable 时 #selectedItem 的 handle 为 undefined', () => {
        const selectedItem = vi.fn<(props: TransferSelectedItemSlotProps) => VNode>(({ item }) => <div>{item.label}</div>);
        renderTransfer({ defaultValue: ['a'], dataSource: items }, { selectedItem });
        expect(selectedItem).toHaveBeenCalledWith(expect.objectContaining({ item: { ...items[0], fullPath: undefined }, index: 0, handle: undefined }));
    });

    it('左侧列表分页，上报页码变化，搜索时回到第 1 页', async () => {
        const onPageChange = vi.fn<NonNullable<TransferPagination['onPageChange']>>();
        renderTransfer({ dataSource: many, pagination: { pageSize: 2, onPageChange } });
        expect(getLeftItemTexts()).toEqual(['item0', 'item1']);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
        expect(onPageChange).toHaveBeenCalledWith(2);
        expect(getLeftItemTexts()).toEqual(['item2', 'item3']);
        await userEvent.type(getSearchInput(), 'item');
        expect(getLeftItemTexts()).toEqual(['item0', 'item1']);
    });

    it('跟随受控的分页 currentPage', async () => {
        const onPageChange = vi.fn<NonNullable<TransferPagination['onPageChange']>>();
        const view = renderTransfer({
            dataSource: many,
            pagination: { pageSize: 2, currentPage: 3, onPageChange },
        });
        expect(getLeftItemTexts()).toEqual(['item4']);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.prev }));
        expect(onPageChange).toHaveBeenCalledWith(2);
        expect(getLeftItemTexts()).toEqual(['item4']);
        await view.rerender({ pagination: { pageSize: 2, currentPage: 2, onPageChange } });
        expect(getLeftItemTexts()).toEqual(['item2', 'item3']);
    });

    it('pagination.defaultCurrentPage 设置非受控的初始页', () => {
        renderTransfer({ dataSource: many, pagination: { pageSize: 2, defaultCurrentPage: 2 } });
        expect(getLeftItemTexts()).toEqual(['item2', 'item3']);
    });

    it('dataSource 缩短使页码越界时显示最后一页', async () => {
        const view = renderTransfer({ dataSource: many, pagination: { pageSize: 2 } });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
        expect(getLeftItemTexts()).toEqual(['item4']);
        await view.rerender({ dataSource: many.slice(0, 3) });
        expect(getLeftItemTexts()).toEqual(['item2']);
        await view.rerender({ dataSource: many.slice(0, 2) });
        expect(getLeftItemTexts()).toEqual(['item0', 'item1']);
    });

    it('受控页码越界时搜索回到第 1 页并上报 onPageChange(1)', async () => {
        const onPageChange = vi.fn<NonNullable<TransferPagination['onPageChange']>>();
        renderTransfer({ dataSource: many, pagination: { pageSize: 2, currentPage: 3, onPageChange } });
        await userEvent.type(getSearchInput(), 'item4');
        expect(getLeftItemTexts()).toEqual(['item4']);
        expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('非受控搜索重置页码时上报一次 onPageChange(1)', async () => {
        const onPageChange = vi.fn<NonNullable<TransferPagination['onPageChange']>>();
        renderTransfer({ dataSource: many, pagination: { pageSize: 2, onPageChange } });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
        onPageChange.mockClear();
        await userEvent.type(getSearchInput(), 'item');
        expect(onPageChange).toHaveBeenCalledExactlyOnceWith(1);
    });

    it('virtualize 时已选列表使用虚拟列表渲染', () => {
        renderTransfer({ defaultValue: ['a', 'b'], dataSource: items, virtualize: { height: 100, itemSize: 30 } });
        expect(getSelectedList()).toHaveClass(`${prefixCls}-right-virtual-list`);
        expect(getRightItemTexts()).toEqual(['apple', 'banana']);
    });

    it('draggable 时忽略 virtualize', () => {
        renderTransfer({
            defaultValue: ['a', 'b'],
            dataSource: items,
            draggable: true,
            virtualize: { height: 100, itemSize: 30 },
        });
        expect(getSelectedList()).not.toHaveClass(`${prefixCls}-right-virtual-list`);
        expect(getRightItemTexts()).toEqual(['apple', 'banana']);
    });

    it('data-* 属性透传到根元素', () => {
        render(Transfer, { attrs: { 'data-foo': 'bar' } });
        expect(getRoot()).toHaveAttribute('data-foo', 'bar');
    });

    it('重新渲染后调用最新的监听', async () => {
        const first = vi.fn<(...args: unknown[]) => void>();
        const second = vi.fn<(...args: unknown[]) => void>();
        const view = renderTransfer({ dataSource: items, onChange: first, onSelect: first });
        await view.rerender({ onChange: second, onSelect: second });
        await userEvent.click(getLeftItem('apple'));
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(2);
    });

    it('每次操作只发一次事件，change 不会收到原生 change 冒泡', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        const onSelect = vi.fn<Handler<'select'>>();
        const onSearch = vi.fn<Handler<'search'>>();
        const onUpdate = vi.fn<Handler<'update:modelValue'>>();
        renderTransfer({ dataSource: items, onChange, onSearch, onSelect, 'onUpdate:modelValue': onUpdate });
        await userEvent.click(getLeftItem('apple'));
        await userEvent.type(getSearchInput(), 'b');
        await fireEvent.change(getSearchInput());
        expect(onChange).toHaveBeenCalledExactlyOnceWith(['a'], [items[0]]);
        expect(onUpdate).toHaveBeenCalledExactlyOnceWith(['a']);
        expect(onSelect).toHaveBeenCalledOnce();
        expect(onSearch).toHaveBeenCalledExactlyOnceWith('b');
        expect(getRightItemTexts()).toEqual(['apple']);
        expect(getLeftItemTexts()).toEqual(['banana']);
    });

    it('不修改传入的 dataSource', async () => {
        const data = structuredClone(dataWithGroup);
        renderTransfer({ type: 'groupList', defaultValue: [1], dataSource: data });
        await userEvent.click(getLeftItem('A-2'));
        expect(data).toEqual(dataWithGroup);
    });

    it('多次渲染间保持虚拟列表的滚动容器', async () => {
        renderTransfer({ defaultValue: ['a'], dataSource: items, virtualize: { height: 100, itemSize: 30 } });
        const list = getSelectedList();
        await userEvent.click(getLeftItem('banana'));
        expect(getRightItemTexts()).toEqual(['apple', 'banana']);
        expect(getSelectedList()).toBe(list);
    });

    it('其他属性透传到根元素，带名称时根元素是 group', () => {
        render(Transfer, { attrs: { id: 'transfer', 'aria-label': 'Pick fruits' } });
        expect(getRoot()).toHaveAttribute('id', 'transfer');
        expect(screen.getByRole('group', { name: 'Pick fruits' })).toBe(getRoot());
    });

    it('使用方显式给出的 role 优先，未命名时根元素没有 role', () => {
        const view = render(Transfer, { attrs: { role: 'region', 'aria-labelledby': 'x' } });
        expect(getRoot()).toHaveAttribute('role', 'region');
        view.unmount();
        render(Transfer);
        expect(getRoot()).not.toHaveAttribute('role');
    });

    it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Transfer: { filter: false, defaultValue: ['b'] } };
        renderTransfer({ dataSource: items });
        expect(document.querySelector(`.${prefixCls}-filter`)).toBeNull();
        expect(getRightItemTexts()).toEqual(['banana']);
    });

    it('全局默认的 filter 函数参与搜索，传入的 filter 优先', async () => {
        semiGlobal.config.overrideDefaultProps = { Transfer: { filter: () => true } };
        const view = renderTransfer({ dataSource: items });
        await userEvent.type(getSearchInput(), 'zzz');
        expect(getLeftItemTexts()).toEqual(['apple', 'banana', 'cherry']);
        view.unmount();
        renderTransfer({ dataSource: items, filter: true });
        await userEvent.type(getSearchInput(), 'zzz');
        expect(getLeftItemTexts()).toEqual([]);
    });
});

describe('Transfer 插槽', () => {
    const items = [
        { label: 'apple', value: 'a', key: 'a' },
        { label: 'banana', value: 'b', key: 'b' },
    ];

    it('未提供空状态插槽时显示语言包文案，各插槽独立回落', () => {
        renderTransfer({ dataSource: [] }, { emptyLeft: () => 'none' });
        expect(document.querySelector(`.${prefixCls}-left-empty`)).toHaveTextContent('none');
        expect(document.querySelector(`.${prefixCls}-right-empty`)).toHaveTextContent(zh_CN.Transfer.emptyRight);
    });

    it('空的 #emptyLeft、#emptyRight 隐藏空状态', () => {
        renderTransfer({ dataSource: [] }, { emptyLeft: () => [], emptyRight: () => [] });
        expect(document.querySelector(`.${prefixCls}-left-empty`)).toBeNull();
        expect(document.querySelector(`.${prefixCls}-right-empty`)).toBeNull();
    });

    it('模板写法的空插槽隐藏空状态，#label 替换两侧的条目内容', async () => {
        const view = render(TemplateSlots);
        expect(document.querySelector(`.${prefixCls}-left-empty`)).toBeNull();
        expect(document.querySelector(`.${prefixCls}-right-empty`)).toHaveTextContent(zh_CN.Transfer.emptyRight);

        await view.rerender({ dataSource: items });
        expect(getLeftItemTexts()).toEqual(['apple!', 'banana!']);
        expect(getRightItemTexts()).toEqual(['apple!']);
        expect(within(getSelectedList()).getByText('apple!')).toHaveClass('custom-label');

        await userEvent.type(getSearchInput(), 'ban');
        expect(getLeftItemTexts()).toEqual(['banana!']);
        await userEvent.type(getSearchInput(), 'zzz');
        expect(document.querySelector(`.${prefixCls}-left-empty`)).toBeNull();
    });

    it('#label 也用于可排序列表的条目', async () => {
        renderTransfer({ defaultValue: ['a'], dataSource: items, draggable: true }, { label: ({ item }: { item: TransferDataItem }) => <i>{`<${item.label}>`}</i> });
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-right-item-sortable-item`)).not.toBeNull());
        expect(getRightItemTexts()).toEqual(['<apple>']);
    });

    it('左侧条目是 Checkbox 根元素上的 listitem', () => {
        renderTransfer({ dataSource: items });
        const listItems = within(getLeftList()).getAllByRole('listitem');
        expect(listItems.map((item) => item.className)).toEqual([expect.stringContaining(`${BASE_CLASS_PREFIX}-checkbox`), expect.stringContaining(`${BASE_CLASS_PREFIX}-checkbox`)]);
        expect(within(listItems[0]).getByRole('checkbox')).not.toBeChecked();
    });

    it('默认的已选条目可用 IconHandle 之外的内容，handle 在替身列表中直接渲染内容', () => {
        renderTransfer(
            { defaultValue: ['a'], dataSource: items, draggable: true },
            {
                selectedItem: ({ item, handle }: TransferSelectedItemSlotProps) => (
                    <div>
                        {h(handle ?? 'span', null, () => (
                            <IconHandle class="my-handle" />
                        ))}
                        {item.label}
                    </div>
                ),
            }
        );
        expect(screen.queryByRole('button', { name: zh_CN.Transfer.dragSort })).toBeNull();
        expect(document.querySelector('.my-handle')).not.toBeNull();
    });
});

describe('Transfer 语言与 KeepAlive', () => {
    const items = [{ label: 'apple', value: 'a', key: 'a' }];

    it('列表、筛选框、删除按钮与排序手柄的名称跟随语言包', async () => {
        render(() => <ConfigProvider locale={ja_JP}>{() => <Transfer defaultValue={['a']} dataSource={items} draggable />}</ConfigProvider>);
        expect(screen.getByRole('list', { name: ja_JP.Transfer.optionList })).toBeInTheDocument();
        expect(screen.getByRole('list', { name: ja_JP.Transfer.selectedList })).toBeInTheDocument();
        // dom-testing-library has no implicit role for the native <search> element
        expect(document.querySelector('search')).toHaveAttribute('aria-label', ja_JP.Transfer.filter);
        expect(screen.getByRole('button', { name: ja_JP.Transfer.remove })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: ja_JP.Transfer.dragSort })).toBeInTheDocument();
        await waitFor(() => expect(screen.getByRole('button', { name: ja_JP.Transfer.dragSort })).toHaveAttribute('aria-roledescription', ja_JP.Sortable.roleDescription));
    });

    it('筛选框容器是带名称的原生 search 元素', () => {
        render(() => <Transfer dataSource={items} />);
        // dom-testing-library has no implicit role for the native <search> element
        const search = document.querySelector('search');
        expect(search).toHaveAttribute('aria-label', zh_CN.Transfer.filter);
        expect(search).not.toHaveAttribute('role');
    });

    it('KeepAlive 切走再切回后保留已选项与搜索词', async () => {
        const shown = shallowRef(true);
        const Other = defineComponent(() => () => <p>other</p>);
        render(() => (
            <KeepAlive>
                {{
                    default: () => [shown.value ? <Transfer dataSource={[...items, { label: 'pear', value: 'p', key: 'p' }]} /> : <Other />],
                }}
            </KeepAlive>
        ));
        await userEvent.click(getLeftItem('apple'));
        await userEvent.type(getSearchInput(), 'pe');
        shown.value = false;
        await nextTick();
        expect(screen.getByText('other')).toBeInTheDocument();
        shown.value = true;
        await nextTick();
        expect(getRightItemTexts()).toEqual(['apple']);
        expect(getSearchInput()).toHaveValue('pe');
        expect(getLeftItemTexts()).toEqual(['pear']);
    });
});

describe('Transfer treeList', () => {
    const getTreeData = () => [
        {
            label: 'Asia',
            value: 'Asia',
            key: '0',
            children: [
                {
                    label: 'China',
                    value: 'China',
                    key: '0-0',
                    children: [
                        { label: 'Beijing', value: 'Beijing', key: '0-0-0', disabled: true },
                        { label: 'Shanghai', value: 'Shanghai', key: '0-0-1' },
                        { label: 'Chengdu', value: 'Chengdu', key: '0-0-2' },
                        { label: 'Chongqing', value: 'Chongqing', key: '0-0-3' },
                    ],
                },
                {
                    label: 'Japan',
                    value: 'Japan',
                    key: '0-1',
                    children: [{ label: 'Osaka', value: 'Osaka', key: '0-1-0' }],
                },
            ],
        },
        {
            label: 'North America',
            value: 'North America',
            key: '1',
            children: [
                { label: 'United States', value: 'United States', key: '1-0' },
                { label: 'Canada', value: 'Canada', key: '1-1' },
            ],
        },
    ];
    const leaves = ['Shanghai', 'Chengdu', 'Chongqing', 'Osaka', 'United States', 'Canada'];
    const getTreeRow = (label: string) => screen.getByText(label).closest('li') as HTMLElement;
    type HeaderSlot = (props: TransferSourceHeaderSlotProps) => VNode[];
    const lastHeader = (spy: Mock<HeaderSlot>) => spy.mock.lastCall?.[0] as TransferSourceHeaderSlotProps;

    it('树形 Transfer 渲染', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        const onSearch = vi.fn<Handler<'search'>>();
        renderTransfer({
            type: 'treeList',
            modelValue: ['Shanghai'],
            dataSource: getTreeData(),
            draggable: true,
            showPath: true,
            onChange,
            onSearch,
        });

        await userEvent.click(document.querySelector(`li.${BASE_CLASS_PREFIX}-tree-option`) as HTMLElement);
        await userEvent.type(getSearchInput(), '1');

        expect(onChange).toHaveBeenCalledOnce();
        const [values, changedItems] = onChange.mock.calls[0];
        expect(values).toHaveLength(4);
        expect(values).toEqual(expect.arrayContaining(['Shanghai', 'Chengdu', 'Chongqing', 'Osaka']));
        expect(changedItems).toHaveLength(4);
        expect(onSearch).toHaveBeenCalledExactlyOnceWith('1');
    });

    it('showPath 属性', () => {
        renderTransfer({ type: 'treeList', defaultValue: ['Shanghai'], dataSource: getTreeData(), showPath: true });
        expect(getRightItemTexts()).toEqual(['Asia > China > Shanghai']);
    });

    it('树形 Transfer 配合 treeProps', () => {
        renderTransfer({ type: 'treeList', dataSource: getTreeData(), treeProps: { class: 'custom-tree' } });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-wrapper`)).toHaveClass('custom-tree');
    });

    it('treeList 左侧的 tree 以 optionList 命名', () => {
        renderTransfer({ type: 'treeList', dataSource: getTreeData() });
        expect(screen.getByRole('tree', { name: zh_CN.Transfer.optionList })).toBeInTheDocument();
    });

    it('treeProps 的 aria-label 优先于默认名称', () => {
        renderTransfer({ type: 'treeList', dataSource: getTreeData(), treeProps: { 'aria-label': 'Cities' } });
        expect(screen.getByRole('tree', { name: 'Cities' })).toBeInTheDocument();
        expect(screen.queryByRole('tree', { name: zh_CN.Transfer.optionList })).toBeNull();
    });

    it('treeProps 中的值与 change 监听不覆盖 Transfer 的选择', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        const onTreeChange = vi.fn<(value: unknown) => void>();
        renderTransfer({
            type: 'treeList',
            dataSource: getTreeData(),
            treeProps: { modelValue: ['Canada'], onChange: onTreeChange },
            onChange,
        });
        expect(getRightItemTexts()).toEqual([]);
        await userEvent.click(getTreeRow('Osaka'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith(['Osaka'], expect.any(Array));
        expect(onTreeChange).not.toHaveBeenCalled();
        expect(getRightItemTexts()).toEqual(['Osaka']);
    });

    it('treeProps 的 changeWithObject 被忽略，change 载荷不变', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        const treeProps: TransferTreeProps = {
            // @ts-expect-error Transfer owns the change payload of its tree
            changeWithObject: true,
        };
        renderTransfer({ type: 'treeList', dataSource: getTreeData(), treeProps, onChange });
        await userEvent.click(getTreeRow('Osaka'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith(['Osaka'], expect.any(Array));
    });

    it('treeProps 的 keyMaps 与 treeData 被忽略，勾选仍按 dataSource 选中', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        const treeProps: TransferTreeProps = {
            // @ts-expect-error Transfer owns the field names of its data
            keyMaps: { value: 'key' },
            treeData: [],
        };
        renderTransfer({ type: 'treeList', dataSource: getTreeData(), treeProps, onChange });
        await userEvent.click(getTreeRow('Osaka'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith(['Osaka'], expect.any(Array));
        expect(getRightItemTexts()).toEqual(['Osaka']);
    });

    it('treeList 配合 showPath 时，向 #selectedItem 和 change 的项目传递 fullPath', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        renderTransfer(
            { type: 'treeList', defaultValue: ['Osaka'], dataSource: getTreeData(), showPath: true, onChange },
            {
                selectedItem: ({ fullPath }: TransferSelectedItemSlotProps) => <div class="custom-selected">{fullPath?.map((node) => node.label).join('/')}</div>,
            }
        );
        expect(document.querySelector('.custom-selected')).toHaveTextContent('Asia/Japan/Osaka');

        await userEvent.click(getTreeRow('Canada'));
        expect(onChange).toHaveBeenCalledOnce();
        const [values, changedItems] = onChange.mock.calls[0];
        expect(values).toHaveLength(2);
        expect(values).toEqual(expect.arrayContaining(['Osaka', 'Canada']));
        expect(changedItems.find((item) => item.value === 'Canada')?.fullPath?.map((node) => node.label)).toEqual(['North America', 'Canada']);
    });

    it('treeList 向 #sourceHeader 传递节点数和叶子数', () => {
        const sourceHeader = vi.fn<HeaderSlot>(() => []);
        renderTransfer({ type: 'treeList', dataSource: getTreeData() }, { sourceHeader });
        expect(sourceHeader).toHaveBeenLastCalledWith({
            num: 11,
            showButton: false,
            allChecked: false,
            onAllClick: expect.any(Function),
            leafOnlyNum: 7,
        });
    });

    it('treeList 的全部可选叶子都选中后 allChecked 为 true，onAllClick 只选叶子', async () => {
        const sourceHeader = vi.fn<HeaderSlot>(() => []);
        const onChange = vi.fn<Handler<'change'>>();
        const view = renderTransfer({ type: 'treeList', dataSource: getTreeData(), onChange }, { sourceHeader });
        expect(lastHeader(sourceHeader).allChecked).toBe(false);
        lastHeader(sourceHeader).onAllClick();
        expect(onChange.mock.lastCall?.[0]).toEqual(leaves);

        await view.rerender({ modelValue: leaves });
        expect(lastHeader(sourceHeader).allChecked).toBe(true);
    });

    it('treeList 的默认头部不显示全选按钮', () => {
        renderTransfer({ type: 'treeList', dataSource: getTreeData() });
        expect(document.querySelector(`.${prefixCls}-left .${prefixCls}-header-all`)).toBeNull();
        expect(screen.getByText('总个数：11')).toBeInTheDocument();
    });

    it('treeList 搜索交给 Tree 处理，并通知 search', async () => {
        const onSearch = vi.fn<Handler<'search'>>();
        renderTransfer({ type: 'treeList', dataSource: getTreeData(), onSearch });
        await userEvent.type(getSearchInput(), 'Osaka');
        expect(onSearch).toHaveBeenLastCalledWith('Osaka');
        expect(screen.queryByText('Canada')).toBeNull();
        expect(screen.getByText('Osaka')).toBeInTheDocument();
    });

    it('treeProps 带 ref 时不顶掉 Transfer 自己的 Tree 引用，搜索仍过滤 Tree', async () => {
        const callerRef = shallowRef<unknown>(null);
        renderTransfer({ type: 'treeList', dataSource: getTreeData(), treeProps: { ref: callerRef } });
        await userEvent.type(getSearchInput(), 'Osaka');
        expect(screen.queryByText('Canada')).toBeNull();
        expect(screen.getByText('Osaka')).toBeInTheDocument();
    });

    it('Tree 自带的搜索框隐藏，只有 Transfer 的搜索框', () => {
        renderTransfer({ type: 'treeList', dataSource: getTreeData() });
        expect(screen.getAllByRole('textbox')).toEqual([getSearchInput()]);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-search-wrapper`)).toBeNull();
    });

    it('search 方法过滤 Tree，不发 search', async () => {
        const onSearch = vi.fn<Handler<'search'>>();
        const { handle } = renderWithHandle({ type: 'treeList', dataSource: getTreeData(), onSearch });
        handle().search('Osaka');
        await nextTick();
        expect(screen.queryByText('Canada')).toBeNull();
        expect(screen.getByText('Osaka')).toBeInTheDocument();
        expect(getSearchInput()).toHaveValue('Osaka');
        expect(onSearch).not.toHaveBeenCalled();
    });

    it('#label 转发到 Tree 的行与已选项，参数为数据项', () => {
        renderTransfer(
            { type: 'treeList', defaultValue: ['Osaka'], dataSource: getTreeData() },
            {
                label: ({ item }: TransferLabelSlotProps) => <b class="custom-label">{`${item.label}:${String(item.value)}`}</b>,
            }
        );
        const tree = screen.getByRole('tree');
        expect(within(tree).getByText('Osaka:Osaka')).toHaveClass('custom-label');
        expect(within(tree).getByText('Asia:Asia')).toBeInTheDocument();
        expect(within(getSelectedList()).getByText('Osaka:Osaka')).toBeInTheDocument();
    });

    it('没有 #label 时 Tree 行显示数据中的 label', () => {
        renderTransfer({ type: 'treeList', dataSource: getTreeData() });
        expect(within(screen.getByRole('tree')).getAllByRole('treeitem')[0].querySelector(`.${BASE_CLASS_PREFIX}-tree-option-label-text`)).toHaveTextContent('Asia');
        expect(document.querySelector('.custom-label')).toBeNull();
    });

    it('整体替换 dataSource 后 Tree 与已选项随之更新', async () => {
        const view = renderTransfer({ type: 'treeList', defaultValue: ['Canada'], dataSource: getTreeData() });
        expect(getRightItemTexts()).toEqual(['Canada']);
        const next = getTreeData();
        next[1].children[1].label = 'Mexico';
        await view.rerender({ dataSource: next });
        expect(within(screen.getByRole('tree')).getByText('Mexico')).toBeInTheDocument();
        expect(screen.queryByText('Canada')).toBeNull();
        expect(getRightItemTexts()).toEqual(['Mexico']);
    });

    it('不修改传入的 dataSource', () => {
        const treeData = getTreeData();
        const snapshot = structuredClone(treeData);
        renderTransfer({ type: 'treeList', defaultValue: ['Osaka'], dataSource: treeData, showPath: true });
        expect(treeData).toEqual(snapshot);
    });

    it('loading 期间输入的关键字在树重新挂载后仍生效', async () => {
        const view = renderTransfer({ type: 'treeList', loading: true, dataSource: [] });
        await userEvent.type(getSearchInput(), 'Osaka');
        await view.rerender({ type: 'treeList', loading: false, dataSource: getTreeData() });
        await waitFor(() => expect(screen.queryByText('Canada')).toBeNull());
        expect(screen.getByText('Osaka')).toBeInTheDocument();
    });
});

describe('Transfer 排序、禁用与 tabindex', () => {
    const sortPanel = ({ selectedData, onSortEnd }: TransferSelectedPanelSlotProps) => (
        <div>
            <button type="button" onClick={() => onSortEnd({ oldIndex: 0, newIndex: 1 })}>
                Sort
            </button>
            {selectedData.map((item) => (
                <span key={item.key} class="custom-item">
                    {item.label}
                </span>
            ))}
        </div>
    );
    const getCustomItems = () => [...document.querySelectorAll('.custom-item')].map((item) => item.textContent);

    it('禁用时已选项不能拖拽排序，句柄保持不可用', async () => {
        render(() => (
            <>
                <Transfer disabled draggable defaultValue={['1', '2']} dataSource={defaultItems} />
                <Transfer draggable defaultValue={['1']} dataSource={defaultItems} />
            </>
        ));
        // once the enabled one shows sortable items, the sortable chunk has loaded for both
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-right-item-sortable-item`)).not.toBeNull());
        const disabledTransfer = document.querySelector(`.${prefixCls}`) as HTMLElement;
        const handles = within(disabledTransfer).getAllByRole('button', { name: zh_CN.Transfer.dragSort });
        expect(handles).toHaveLength(2);
        handles.forEach((handle) => expect(handle).toHaveAttribute('aria-disabled', 'true'));
        expect(disabledTransfer.querySelector(`.${prefixCls}-right-item-sortable-item`)).toBeNull();
    });

    it('禁用时 #selectedPanel 收到的 onSortEnd 不改变顺序、不发 change', async () => {
        const onChange = vi.fn<Handler<'change'>>();
        renderTransfer({ disabled: true, defaultValue: ['1', '2'], dataSource: defaultItems, onChange }, { selectedPanel: sortPanel });
        await userEvent.click(screen.getByRole('button', { name: 'Sort' }));
        expect(onChange).not.toHaveBeenCalled();
        expect(getCustomItems()).toEqual(['item1', 'item2']);
    });

    it('受控时排序不写入内部状态，释放受控后右侧不残留排序前的受控值', async () => {
        const view = renderTransfer({ modelValue: ['1', '2'], dataSource: defaultItems }, { selectedPanel: sortPanel });
        await userEvent.click(screen.getByRole('button', { name: 'Sort' }));
        await view.rerender({ modelValue: undefined, dataSource: defaultItems });
        expect(getCustomItems()).toEqual([]);
    });

    it('tabindex 落在搜索框上，根元素不是 Tab 停留点', () => {
        renderTransfer({ tabindex: -1, dataSource: defaultItems });
        expect(getRoot()).not.toHaveAttribute('tabindex');
        expect(getSearchInput()).toHaveAttribute('tabindex', '-1');
    });

    it('驼峰写法的 tabIndex 同样落在搜索框上', () => {
        renderTransfer({ tabIndex: -1, dataSource: defaultItems });
        expect(getRoot()).not.toHaveAttribute('tabindex');
        expect(getSearchInput()).toHaveAttribute('tabindex', '-1');
    });
});
