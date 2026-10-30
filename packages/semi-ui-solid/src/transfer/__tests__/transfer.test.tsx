import { For, Show, createSignal } from 'solid-js';
import { fireEvent, render, screen, waitFor, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi, type Mock } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import Transfer, { type DataItem, type PaginationProps, type SelectedPanelProps, type SourcePanelProps, type TransferElement, type TransferProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import Tooltip from '../../tooltip';

// mock.lastCall is undefined until the first call; fail loudly instead of asserting on nothing
function lastArg<F extends (...args: never[]) => unknown>(spy: Mock<F>): Parameters<F>[0] {
    const call = spy.mock.lastCall;
    if (!call) {
        throw new Error('the spy was never called');
    }
    return call[0];
}

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
            { label: 'C-4', value: 10, disabled: false, key: 10 },
            { label: 'C-5', value: 11, disabled: false, key: 11 },
            { label: 'C-6', value: 12, disabled: false, key: 12 },
            { label: 'C-7', value: 13, disabled: false, key: 13 },
        ],
    },
];

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

const getSearchInput = () => document.querySelector(`.${prefixCls}-filter input`) as HTMLInputElement;
const getLeftList = () => screen.getByRole('list', { name: zh_CN.Transfer.optionList });
const getLeftItem = (label: string) => within(getLeftList()).getByText(label);
const getLeftCheckedTexts = () => Array.from(document.querySelectorAll(`.${prefixCls}-left .${BASE_CLASS_PREFIX}-checkbox-checked`)).map((item) => item.textContent);
const getLeftItemTexts = () => Array.from(document.querySelectorAll(`.${prefixCls}-left .${prefixCls}-item`)).map((item) => item.textContent);
const getRightItemTexts = () => Array.from(document.querySelectorAll(`.${prefixCls}-right-item-text`)).map((item) => item.textContent);
const getHeaderButtons = () => document.querySelectorAll<HTMLButtonElement>(`button.${prefixCls}-header-all`);

/** Renders with props a test can replace, as React's rerender */
function renderWith(initial: TransferProps) {
    const [props, setProps] = createSignal(initial);
    const result = render(() => <Transfer {...props()} />);
    return { ...result, setProps };
}

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Transfer', () => {
    it('自定义 class 和 style', () => {
        const { container } = render(() => <Transfer class="test" style={{ color: 'red' }} />);
        const transfer = container.firstElementChild;
        expect(transfer).toHaveClass(prefixCls, 'test');
        expect(transfer).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('defaultValue 生效', () => {
        render(() => <Transfer defaultValue={['1']} dataSource={defaultItems} />);
        expect(getLeftCheckedTexts()).toEqual(['item1']);
        expect(getRightItemTexts()).toEqual(['item1']);
    });

    it('数据变化时搜索生效', () => {
        const { setProps } = renderWith({ dataSource: [] });
        fireEvent.input(getSearchInput(), { target: { value: '2' } });
        setProps({
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
        const onSearch = vi.fn<NonNullable<TransferProps['onSearch']>>();
        render(() => <Transfer dataSource={defaultItems} onSearch={onSearch} />);

        await userEvent.type(getSearchInput(), '1');

        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('1');
        expect(getLeftItemTexts()).toEqual(['item1']);
    });

    it('选择并变更', async () => {
        const onChange = vi.fn<NonNullable<TransferProps['onChange']>>();
        const onSelect = vi.fn<NonNullable<TransferProps['onSelect']>>();
        const onDeselect = vi.fn<NonNullable<TransferProps['onDeselect']>>();
        render(() => <Transfer dataSource={defaultItems} onChange={onChange} onDeselect={onDeselect} onSelect={onSelect} />);

        await userEvent.click(getLeftItem('item1'));
        expect(getLeftCheckedTexts()).toEqual(['item1']);
        expect(getRightItemTexts()).toEqual(['item1']);
        await userEvent.click(getLeftItem('item1'));
        expect(getLeftCheckedTexts()).toEqual([]);
        expect(getRightItemTexts()).toEqual([]);

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining(defaultItems[0]));
        expect(onDeselect).toHaveBeenCalledTimes(1);
        expect(onDeselect).toHaveBeenCalledWith(expect.objectContaining(defaultItems[0]));
        expect(onChange).toHaveBeenCalledTimes(2);

        expect(onChange.mock.calls[0]).toHaveLength(2);
        expect(onChange.mock.calls[0][0]).toEqual([defaultItems[0].value]);
        expect(onChange.mock.calls[0][1]).toHaveLength(1);
        expect(onChange.mock.calls[0][1][0]).toMatchObject(defaultItems[0]);

        expect(onChange.mock.calls[1]).toEqual([[], []]);
    });

    it('全选与取消全选', async () => {
        const onChange = vi.fn<NonNullable<TransferProps['onChange']>>();
        render(() => <Transfer dataSource={defaultItems} onChange={onChange} />);

        const selectAllButton = getHeaderButtons()[0];
        expect(selectAllButton).toHaveTextContent('全选');
        await userEvent.click(selectAllButton);
        expect(getRightItemTexts()).toEqual(['item1', 'item2']);
        expect(selectAllButton).toHaveTextContent('取消全选');
        await userEvent.click(selectAllButton);
        expect(getRightItemTexts()).toEqual([]);

        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[0]).toHaveLength(2);
        expect(onChange.mock.calls[0][0]).toEqual(['1', '2']);
        expect(onChange.mock.calls[0][1]).toHaveLength(defaultItems.length);

        expect(onChange.mock.calls[1]).toEqual([[], []]);
    });

    it('清空全部', async () => {
        const onChange = vi.fn<NonNullable<TransferProps['onChange']>>();
        render(() => <Transfer defaultValue={defaultItems.map((i) => i.value)} dataSource={defaultItems} onChange={onChange} />);
        const clearAllButton = getHeaderButtons()[1];
        expect(clearAllButton).toHaveTextContent('清空');
        await userEvent.click(clearAllButton);

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith([], []);
        expect(getRightItemTexts()).toEqual([]);
        expect(getLeftCheckedTexts()).toEqual([]);
    });

    it('分组 Transfer 渲染', () => {
        const { container } = render(() => <Transfer type="groupList" defaultValue={[6]} dataSource={dataWithGroup} />);
        expect(container.querySelector(`.${prefixCls}`)).not.toBeNull();
        expect(Array.from(container.querySelectorAll(`.${prefixCls}-group-title`)).map((title) => title.textContent)).toEqual(['类别A', '类别B', '类别C']);
        expect(getRightItemTexts()).toEqual(['B-3（disabled）']);
    });

    it('同名或无 title 的分组各自渲染一行分组标题', () => {
        const { container } = render(() => (
            <Transfer type="groupList" dataSource={[{ title: 'G', children: [{ label: 'a', value: 'a', key: 'a' }] }, { title: 'G', children: [{ label: 'b', value: 'b', key: 'b' }] }, { children: [{ label: 'c', value: 'c', key: 'c' }] }, { children: [{ label: 'd', value: 'd', key: 'd' }] }]} />
        ));
        expect(Array.from(container.querySelectorAll(`.${prefixCls}-group-title`)).map((title) => title.textContent)).toEqual(['G', 'G', '', '']);
    });

    it('树形 Transfer 渲染', async () => {
        const onChange = vi.fn<NonNullable<TransferProps['onChange']>>();
        const onSearch = vi.fn<NonNullable<TransferProps['onSearch']>>();
        const { container } = render(() => <Transfer type="treeList" value={['Shanghai']} dataSource={getTreeData()} draggable showPath onChange={onChange} onSearch={onSearch} />);

        await userEvent.click(container.querySelector(`li.${BASE_CLASS_PREFIX}-tree-option`) as HTMLElement);

        fireEvent.input(getSearchInput(), { target: { value: '1' } });

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0]).toHaveLength(2);
        expect(onChange.mock.calls[0][0]).toHaveLength(4);
        expect(onChange.mock.calls[0][0]).toEqual(expect.arrayContaining(['Shanghai', 'Chengdu', 'Chongqing', 'Osaka']));
        expect(onChange.mock.calls[0][1]).toHaveLength(4);

        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('1');
    });

    it('treeList 左侧的树以选项列表命名', () => {
        render(() => <Transfer type="treeList" dataSource={getTreeData()} />);
        expect(screen.getByRole('tree', { name: zh_CN.Transfer.optionList })).toBeInTheDocument();
    });

    it('disabled 属性', () => {
        const { container } = render(() => <Transfer disabled dataSource={defaultItems} />);
        expect(container.querySelector(`.${prefixCls}-disabled`)).not.toBeNull();
    });

    it('受控 value', async () => {
        const onChange = vi.fn<NonNullable<TransferProps['onChange']>>();
        render(() => <Transfer value={['1']} dataSource={defaultItems} onChange={onChange} />);

        expect(getLeftCheckedTexts()).toEqual(['item1']);
        expect(getRightItemTexts()).toEqual(['item1']);

        await userEvent.click(getLeftItem('item2'));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toEqual(['1', '2']);
        expect(getLeftCheckedTexts()).toEqual(['item1']);
        expect(getRightItemTexts()).toEqual(['item1']);
    });

    it('draggable 属性', () => {
        render(() => <Transfer defaultValue={['1']} dataSource={defaultItems} draggable />);
        const rightItem = document.querySelector(`.${prefixCls}-right-item`);
        expect(rightItem).toHaveClass(`${prefixCls}-right-item-draggable`);
        expect(screen.getByRole('button', { name: zh_CN.Transfer.dragSort })).toBeInTheDocument();
    });

    it('可排序的已选列表仍是其项目的列表', async () => {
        render(() => <Transfer defaultValue={['1']} dataSource={defaultItems} draggable />);
        // dnd-kit loads lazily; until then a plain list stands in
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-right-item-sortable-item`)).not.toBeNull());
        const selected = screen.getByRole('list', { name: zh_CN.Transfer.selectedList });
        expect(within(selected).getByRole('listitem')).toHaveTextContent('item1');
    });

    it('禁用的 Transfer 中，列表是可滚动的 Tab 停靠点', async () => {
        render(() => <Transfer defaultValue={['1']} disabled dataSource={defaultItems} />);
        await userEvent.tab();
        expect(screen.getByRole('list', { name: zh_CN.Transfer.optionList })).toHaveFocus();
        await userEvent.tab();
        expect(screen.getByRole('list', { name: zh_CN.Transfer.selectedList })).toHaveFocus();
    });

    it('启用的 Transfer 中，列表本身不是 Tab 停靠点', () => {
        render(() => <Transfer defaultValue={['1']} dataSource={defaultItems} />);
        expect(screen.getByRole('list', { name: zh_CN.Transfer.optionList })).not.toHaveAttribute('tabindex');
        expect(screen.getByRole('list', { name: zh_CN.Transfer.selectedList })).not.toHaveAttribute('tabindex');
    });

    it('emptyContent 属性', () => {
        const { container } = render(() => (
            <Transfer
                dataSource={[]}
                emptyContent={{
                    left: <span class="custom-empty-left">No data</span>,
                    right: <span class="custom-empty-right">No selection</span>,
                }}
            />
        ));
        expect(container.querySelector(`.${prefixCls}-left-empty .custom-empty-left`)).toHaveTextContent('No data');
        expect(container.querySelector(`.${prefixCls}-right-empty .custom-empty-right`)).toHaveTextContent('No selection');
    });

    it('showPath 属性', () => {
        render(() => <Transfer type="treeList" defaultValue={['Shanghai']} dataSource={getTreeData()} showPath />);
        expect(getRightItemTexts()).toEqual(['Asia > China > Shanghai']);
    });

    it('filter 属性', async () => {
        render(() => <Transfer dataSource={defaultItems} filter={() => true} />);
        // the default filter matches no label for this input, so every item shown proves the custom one is used
        await userEvent.type(getSearchInput(), 'no-such-label');
        expect(getLeftItemTexts()).toEqual(['item1', 'item2']);
    });

    it('默认过滤不区分大小写', async () => {
        render(() => <Transfer dataSource={defaultItems} />);
        await userEvent.type(getSearchInput(), 'ITEM2');
        expect(getLeftItemTexts()).toEqual(['item2']);
    });

    it('renderSourceItem 属性', () => {
        const { container } = render(() => <Transfer dataSource={defaultItems} renderSourceItem={(item) => <div class="custom-source-item">{item.label}</div>} />);
        expect(Array.from(container.querySelectorAll('.custom-source-item')).map((item) => item.textContent)).toEqual(['item1', 'item2']);
    });

    it('renderSelectedItem 属性', () => {
        const { container } = render(() => <Transfer defaultValue={['1']} dataSource={defaultItems} renderSelectedItem={(item) => <div class="custom-selected-item">{item.label}</div>} />);
        expect(container.querySelector(`.${prefixCls}-right .custom-selected-item`)).toHaveTextContent('item1');
    });

    it('自定义渲染的项目是其列表的列表项', () => {
        render(() => <Transfer defaultValue={['1']} dataSource={defaultItems} renderSelectedItem={(item) => <div>{item.label}</div>} renderSourceItem={(item) => <div>{item.label}</div>} />);
        const [source, selected] = screen.getAllByRole('list');
        expect(
            within(source)
                .getAllByRole('listitem')
                .map((item) => item.textContent)
        ).toEqual(['item1', 'item2']);
        expect(within(selected).getByRole('listitem')).toHaveTextContent('item1');
    });

    it('inputProps 属性', () => {
        render(() => <Transfer dataSource={defaultItems} inputProps={{ placeholder: 'Custom placeholder' }} />);
        expect(getSearchInput()).toHaveAttribute('placeholder', 'Custom placeholder');
    });

    it('renderSelectedPanel 属性', async () => {
        const renderSelectedPanel = (panel: SelectedPanelProps) => (
            <div class="custom-selected-panel">
                <button type="button" onClick={() => panel.onClear()}>
                    Clear
                </button>
                <For each={panel.selectedData}>
                    {(item) => (
                        <div class="custom-item">
                            {item.label}
                            <button type="button" onClick={() => panel.onRemove(item)}>
                                Remove
                            </button>
                        </div>
                    )}
                </For>
            </div>
        );
        const { container } = render(() => <Transfer defaultValue={['1', '2']} dataSource={defaultItems} renderSelectedPanel={renderSelectedPanel} />);
        const getCustomItems = () => container.querySelectorAll('.custom-item');
        expect(container.querySelector('.custom-selected-panel')).not.toBeNull();
        expect(getCustomItems()).toHaveLength(2);

        await userEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
        expect(getCustomItems()).toHaveLength(1);
        expect(getLeftCheckedTexts()).toEqual(['item2']);

        await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
        expect(getCustomItems()).toHaveLength(0);
        expect(getLeftCheckedTexts()).toEqual([]);
    });

    it('renderSourcePanel 属性', async () => {
        const renderSourcePanel = (panel: SourcePanelProps) => (
            <div class="custom-source-panel">
                <input class="custom-search" onInput={(e) => panel.onSearch(e.currentTarget.value)} />
                <button type="button" onClick={() => panel.onAllClick()}>
                    Select All
                </button>
                <For each={panel.filterData}>
                    {(item) => (
                        <button type="button" class="custom-source-item" onClick={() => panel.onSelectOrRemove(item)}>
                            {item.label}
                        </button>
                    )}
                </For>
            </div>
        );
        const { container } = render(() => <Transfer dataSource={defaultItems} renderSourcePanel={renderSourcePanel} />);
        expect(container.querySelector('.custom-source-panel')).not.toBeNull();
        expect(Array.from(container.querySelectorAll('.custom-source-item')).map((item) => item.textContent)).toEqual(['item1', 'item2']);

        await userEvent.click(screen.getByRole('button', { name: 'Select All' }));
        expect(getRightItemTexts()).toEqual(['item1', 'item2']);
    });

    it('renderSourceHeader 属性', async () => {
        const { container } = render(() => (
            <Transfer
                dataSource={defaultItems}
                renderSourceHeader={(header) => (
                    <div class="custom-source-header">
                        <span>Total: {header.num}</span>
                        <Show when={header.showButton}>
                            <button type="button" onClick={() => header.onAllClick()}>
                                {header.allChecked ? 'Deselect' : 'Select All'}
                            </button>
                        </Show>
                    </div>
                )}
            />
        ));
        expect(container.querySelector('.custom-source-header')).not.toBeNull();
        expect(screen.getByText('Total: 2')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Select All' }));
        expect(screen.getByRole('button', { name: 'Deselect' })).toBeInTheDocument();
    });

    it('renderSelectedHeader 属性', () => {
        const { container } = render(() => (
            <Transfer
                defaultValue={['1']}
                dataSource={defaultItems}
                renderSelectedHeader={(header) => (
                    <div class="custom-selected-header">
                        <span>Selected: {header.num}</span>
                        <Show when={header.showButton}>
                            <button type="button" onClick={() => header.onClear()}>
                                Clear
                            </button>
                        </Show>
                    </div>
                )}
            />
        ));
        expect(container.querySelector('.custom-selected-header')).not.toBeNull();
        expect(screen.getByText('Selected: 1')).toBeInTheDocument();
    });

    it('loading 属性', () => {
        const { container } = render(() => <Transfer dataSource={defaultItems} loading />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-spin`)).not.toBeNull();
    });

    it('筛选框容器是带名称的原生 search 元素', () => {
        render(() => <Transfer dataSource={defaultItems} />);
        // dom-testing-library has no implicit role for the native <search> element
        const search = document.querySelector('search');
        expect(search).toHaveAttribute('aria-label', zh_CN.Transfer.filter);
        expect(search).not.toHaveAttribute('role');
    });

    it('filter 为 false 时隐藏搜索框', () => {
        const { container } = render(() => <Transfer dataSource={defaultItems} filter={false} />);
        expect(container.querySelector(`.${prefixCls}-filter`)).toBeNull();
    });

    it('已选项目的 draggable', () => {
        render(() => <Transfer defaultValue={['1', '2']} dataSource={defaultItems} draggable />);
        expect(screen.getAllByRole('button', { name: zh_CN.Transfer.dragSort })).toHaveLength(2);
        expect(getRightItemTexts()).toEqual(['item1', 'item2']);
    });

    it('从右侧面板移除项目', async () => {
        const onChange = vi.fn<NonNullable<TransferProps['onChange']>>();
        render(() => <Transfer defaultValue={['1']} dataSource={defaultItems} onChange={onChange} />);

        await userEvent.click(document.querySelector(`.${prefixCls}-item-close-icon`) as HTMLElement);

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toHaveLength(0);
        expect(getRightItemTexts()).toEqual([]);
    });

    it('所有项目禁用时不显示全选按钮', () => {
        const disabledItems = [
            { label: 'item1', value: '1', key: 'a', disabled: true },
            { label: 'item2', value: '2', key: 'b', disabled: true },
        ];
        render(() => <Transfer dataSource={disabledItems} />);
        expect(getHeaderButtons()).toHaveLength(0);
    });

    it('根元素带 search 方法', () => {
        const onSearch = vi.fn<NonNullable<TransferProps['onSearch']>>();
        let ref: TransferElement | undefined;
        const { container } = render(() => <Transfer ref={(node) => (ref = node)} dataSource={defaultItems} onSearch={onSearch} />);
        expect(ref).toBe(container.firstElementChild);

        ref?.search('item1');

        expect(getSearchInput()).toHaveValue('item1');
        expect(getLeftItemTexts()).toEqual(['item1']);
        expect(onSearch).not.toHaveBeenCalled();
    });

    it('renderSelectedPanel 配合 onSortEnd', async () => {
        const onChange = vi.fn<NonNullable<TransferProps['onChange']>>();
        const renderSelectedPanel = (panel: SelectedPanelProps) => (
            <div class="custom-selected-panel">
                <button type="button" onClick={() => panel.onSortEnd({ oldIndex: 0, newIndex: 1 })}>
                    Sort
                </button>
                <For each={panel.selectedData}>{(item) => <div class="custom-item">{item.label}</div>}</For>
            </div>
        );
        const { container } = render(() => <Transfer defaultValue={['1', '2']} dataSource={defaultItems} renderSelectedPanel={renderSelectedPanel} onChange={onChange} />);

        await userEvent.click(screen.getByRole('button', { name: 'Sort' }));
        expect(Array.from(container.querySelectorAll('.custom-item')).map((item) => item.textContent)).toEqual(['item2', 'item1']);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toEqual(['2', '1']);
    });

    it('同时自定义 renderSourcePanel 和 renderSelectedPanel 的面板', () => {
        const { container } = render(() => <Transfer dataSource={defaultItems} renderSelectedPanel={() => <div class="custom-selected">Selected</div>} renderSourcePanel={() => <div class="custom-source">Source</div>} />);
        const transfer = container.querySelector(`.${prefixCls}-custom-panel`);
        expect(transfer).not.toBeNull();
        expect(transfer).toHaveTextContent('SourceSelected');
    });

    it('renderSourcePanel 配合 onSelect 回调', async () => {
        const onChange = vi.fn<NonNullable<TransferProps['onChange']>>();
        const renderSourcePanel = (panel: SourcePanelProps) => (
            <div class="custom-source-panel">
                <button type="button" onClick={() => panel.onSelect(['1', '2'])}>
                    Select Multiple
                </button>
                <button type="button" onClick={() => panel.onAllClick()}>
                    Select All
                </button>
            </div>
        );
        render(() => <Transfer dataSource={defaultItems} renderSourcePanel={renderSourcePanel} onChange={onChange} />);

        await userEvent.click(screen.getByRole('button', { name: 'Select Multiple' }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toEqual(['1', '2']);
        expect(getRightItemTexts()).toEqual(['item1', 'item2']);

        await userEvent.click(screen.getByRole('button', { name: 'Select All' }));
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[1]).toEqual([[], []]);
        expect(getRightItemTexts()).toEqual([]);
    });

    it('renderRight 的默认空状态', () => {
        const { container } = render(() => <Transfer defaultValue={[]} dataSource={[]} />);
        expect(container.querySelector(`.${prefixCls}-right-empty`)).toHaveTextContent('暂无内容，可从左侧勾选');
    });

    it('树形 Transfer 配合 treeProps', () => {
        const { container } = render(() => <Transfer type="treeList" dataSource={getTreeData()} treeProps={{ class: 'custom-tree' }} />);
        const tree = container.querySelector(`.${BASE_CLASS_PREFIX}-tree-wrapper`);
        expect(tree).not.toBeNull();
        expect(tree).toHaveClass('custom-tree');
    });

    it('renderSourcePanel 配合 onSelectOrRemove', async () => {
        const onChange = vi.fn<NonNullable<TransferProps['onChange']>>();
        const renderSourcePanel = (panel: SourcePanelProps) => (
            <div class="custom-source-panel">
                <For each={panel.filterData}>
                    {(item) => (
                        <button type="button" class="custom-item" onClick={() => panel.onSelectOrRemove(item)}>
                            {item.label}
                        </button>
                    )}
                </For>
            </div>
        );
        render(() => <Transfer dataSource={defaultItems} renderSourcePanel={renderSourcePanel} onChange={onChange} />);

        await userEvent.click(screen.getByText('item1'));
        expect(onChange).toHaveBeenCalledTimes(1);
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
    const getCloseIcons = () => document.querySelectorAll<HTMLButtonElement>(`.${prefixCls}-item-close-icon`);

    it('受控 value 跟随 prop 变化，点击只负责通知', async () => {
        const onChange = vi.fn<NonNullable<TransferProps['onChange']>>();
        const { setProps } = renderWith({ value: ['a'], dataSource: items, onChange });
        setProps({ value: ['b', 'a'], dataSource: items, onChange });
        expect(getRightItemTexts()).toEqual(['banana', 'apple']);
        expect(getLeftCheckedTexts()).toEqual(['apple', 'banana']);

        await userEvent.click(getCloseIcons()[0]);
        expect(onChange).toHaveBeenCalledWith(['a'], [items[0]]);
        expect(getRightItemTexts()).toEqual(['banana', 'apple']);
    });

    it('defaultValue 只在创建时读取', () => {
        const { setProps } = renderWith({ defaultValue: ['a'], dataSource: items });
        setProps({ defaultValue: ['b'], dataSource: items });
        expect(getRightItemTexts()).toEqual(['apple']);
    });

    it('受控 value 变为 undefined 后回到非受控的已选项，右侧不残留受控值', async () => {
        const { setProps } = renderWith({ defaultValue: ['b'], value: ['a'], dataSource: items });
        expect(getRightItemTexts()).toEqual(['apple']);
        setProps({ defaultValue: ['b'], value: undefined, dataSource: items });
        expect(getRightItemTexts()).toEqual(['banana']);
        await userEvent.click(getLeftItem('apple'));
        expect(getRightItemTexts()).toEqual(['banana', 'apple']);
    });

    it('非受控选过后转为受控，value 变回 undefined 时已选清空', async () => {
        const { setProps } = renderWith({ dataSource: items });
        await userEvent.click(getLeftItem('apple'));
        setProps({ value: ['a', 'b'], dataSource: items });
        expect(getRightItemTexts()).toEqual(['apple', 'banana']);
        setProps({ value: undefined, dataSource: items });
        expect(getRightItemTexts()).toEqual([]);
        expect(getLeftCheckedTexts()).toEqual([]);
    });

    it('受控 value 变为 null 后同样回到非受控的已选项，点击能更新右侧', async () => {
        const { setProps } = renderWith({ defaultValue: ['b'], value: ['a'], dataSource: items });
        setProps({ defaultValue: ['b'], value: null as never, dataSource: items });
        expect(getRightItemTexts()).toEqual(['banana']);
        await userEvent.click(getLeftItem('apple'));
        expect(getRightItemTexts()).toEqual(['banana', 'apple']);
    });

    it('dataSource 在创建后到达时 defaultValue 仍生效', () => {
        const { setProps } = renderWith({ defaultValue: ['a'], dataSource: [], loading: true });
        setProps({ defaultValue: ['a'], dataSource: items });
        expect(getRightItemTexts()).toEqual(['apple']);
        expect(getLeftCheckedTexts()).toEqual(['apple']);
    });

    it('非受控的已选项跟随 dataSource 的修改与删除', async () => {
        const onChange = vi.fn<NonNullable<TransferProps['onChange']>>();
        const { setProps } = renderWith({ dataSource: items, onChange });
        await userEvent.click(getLeftItem('apple'));
        await userEvent.click(getLeftItem('banana'));
        expect(getRightItemTexts()).toEqual(['apple', 'banana']);

        const renamed = { ...items[0], label: 'APPLE' };
        const date = { label: 'date', value: 'd', key: 'd' };
        setProps({ dataSource: [renamed, items[2], date], onChange });
        expect(getRightItemTexts()).toEqual(['APPLE']);

        await userEvent.click(getLeftItem('date'));
        expect(onChange).toHaveBeenLastCalledWith(['a', 'd'], [renamed, date]);

        await userEvent.click(getHeaderButtons()[1]);
        expect(onChange).toHaveBeenLastCalledWith([], []);
        expect(getRightItemTexts()).toEqual([]);
    });

    it('非受控时 dataSource 把已选项改为禁用后，其移除按钮随之禁用', async () => {
        const { setProps } = renderWith({ dataSource: items });
        await userEvent.click(getLeftItem('apple'));
        setProps({ dataSource: [{ ...items[0], disabled: true }, items[1]] });
        expect(getCloseIcons()[0]).toBeDisabled();
    });

    it('无数据时显示空状态', () => {
        const { container } = render(() => <Transfer dataSource={[]} />);
        expect(container.querySelector(`.${prefixCls}-left-empty`)).toHaveTextContent('暂无数据');
        expect(container.querySelector(`.${prefixCls}-right-empty`)).toHaveTextContent('暂无内容，可从左侧勾选');
    });

    it('禁用项目不能切换，全选和清空时保持其状态', async () => {
        const onChange = vi.fn<NonNullable<TransferProps['onChange']>>();
        const onSelect = vi.fn<NonNullable<TransferProps['onSelect']>>();
        render(() => <Transfer defaultValue={['c']} dataSource={items} onChange={onChange} onSelect={onSelect} />);
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
        const onChange = vi.fn<NonNullable<TransferProps['onChange']>>();
        render(() => <Transfer defaultValue={['a']} disabled dataSource={items} onChange={onChange} />);
        expect(getSearchInput()).toBeDisabled();
        expect(getHeaderButtons()).toHaveLength(2);
        getHeaderButtons().forEach((button) => expect(button).toBeDisabled());
        await userEvent.click(getCloseIcons()[0]);
        expect(onChange).not.toHaveBeenCalled();
        expect(getRightItemTexts()).toEqual(['apple']);
    });

    it('搜索模式下全选只影响匹配项，无匹配时显示搜索空状态', async () => {
        const onChange = vi.fn<NonNullable<TransferProps['onChange']>>();
        render(() => <Transfer dataSource={items} emptyContent={{ search: 'nothing' }} onChange={onChange} />);
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
        render(() => <Transfer dataSource={items} />);
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
        render(() => <Transfer type="groupList" dataSource={dataWithGroup} />);
        const getB1 = () =>
            within(getLeftList())
                .getAllByRole('listitem')
                .find((item) => item.textContent === 'B-1');
        const b1 = getB1();
        await userEvent.type(getSearchInput(), 'B-1');
        expect(within(getLeftList()).getByRole('list', { name: '类别B' })).toContainElement(getB1() ?? null);
        expect(getB1()).toBe(b1);
    });

    it('groupList 传给 onChange 的项目中不含 _parent', async () => {
        const onChange = vi.fn<NonNullable<TransferProps['onChange']>>();
        render(() => <Transfer type="groupList" dataSource={dataWithGroup} onChange={onChange} />);
        await userEvent.click(getLeftItem('B-1'));
        expect(onChange).toHaveBeenCalledWith([4], [{ label: 'B-1', value: 4, disabled: false, key: 4 }]);
        expect(getRightItemTexts()).toEqual(['B-1']);
    });

    it('groupList 传给 onSelect 和 onDeselect 的项目中不含 _parent', async () => {
        const onSelect = vi.fn<NonNullable<TransferProps['onSelect']>>();
        const onDeselect = vi.fn<NonNullable<TransferProps['onDeselect']>>();
        render(() => <Transfer type="groupList" dataSource={dataWithGroup} onDeselect={onDeselect} onSelect={onSelect} />);
        await userEvent.click(getLeftItem('B-1'));
        await userEvent.click(getLeftItem('B-1'));
        const expected = { label: 'B-1', value: 4, disabled: false, key: 4 };
        expect(onSelect).toHaveBeenCalledWith(expected);
        expect(onDeselect).toHaveBeenCalledWith(expected);
    });

    it('groupList 的每个分组是外层列表的一项，标题命名其中的嵌套列表', () => {
        render(() => <Transfer type="groupList" dataSource={dataWithGroup} />);
        const outer = screen.getByRole('list', { name: zh_CN.Transfer.optionList });
        const groups = within(outer)
            .getAllByRole('listitem')
            .filter((el) => el.parentElement === outer);
        expect(groups).toHaveLength(3);
        const nested = within(outer).getByRole('list', { name: '类别B' });
        expect(groups[1]).toContainElement(nested);
        expect(
            within(nested)
                .getAllByRole('listitem')
                .map((el) => el.textContent)
        ).toEqual(['B-1', 'B-2', 'B-3（disabled）']);
    });

    it('treeList 配合 showPath 时，向 renderSelectedItem 和 onChange 的项目传递 fullPath', async () => {
        const onChange = vi.fn<NonNullable<TransferProps['onChange']>>();
        render(() => <Transfer type="treeList" defaultValue={['Osaka']} dataSource={getTreeData()} showPath renderSelectedItem={(item) => <div class="custom-selected">{item.fullPath?.map((node) => node.label).join('/')}</div>} onChange={onChange} />);
        expect(document.querySelector('.custom-selected')).toHaveTextContent('Asia/Japan/Osaka');

        await userEvent.click(screen.getByText('Canada').closest('li') as HTMLElement);
        expect(onChange).toHaveBeenCalledTimes(1);
        const [values, changedItems] = onChange.mock.calls[0];
        expect(values).toEqual(expect.arrayContaining(['Osaka', 'Canada']));
        expect(values).toHaveLength(2);
        expect(changedItems.find((item) => item.value === 'Canada')?.fullPath?.map((node) => node.label)).toEqual(['North America', 'Canada']);
    });

    it('treeList 向 renderSourceHeader 传递节点数和叶子数', () => {
        const renderSourceHeader = vi.fn<NonNullable<TransferProps['renderSourceHeader']>>(() => null);
        render(() => <Transfer type="treeList" dataSource={getTreeData()} renderSourceHeader={renderSourceHeader} />);
        expect(renderSourceHeader).toHaveBeenLastCalledWith({
            num: 11,
            showButton: false,
            allChecked: false,
            onAllClick: expect.any(Function),
            leafOnlyNum: 7,
        });
    });

    it('treeList 的全部可选叶子都选中后 allChecked 为 true，onAllClick 只选叶子', () => {
        const renderSourceHeader = vi.fn<NonNullable<TransferProps['renderSourceHeader']>>(() => null);
        const onChange = vi.fn<NonNullable<TransferProps['onChange']>>();
        const { setProps } = renderWith({ type: 'treeList', dataSource: getTreeData(), renderSourceHeader, onChange });
        expect(lastArg(renderSourceHeader).allChecked).toBe(false);
        lastArg(renderSourceHeader).onAllClick();
        const leaves = ['Shanghai', 'Chengdu', 'Chongqing', 'Osaka', 'United States', 'Canada'];
        expect(lastArg(onChange)).toEqual(leaves);

        setProps({ type: 'treeList', value: leaves, dataSource: getTreeData(), renderSourceHeader, onChange });
        expect(lastArg(renderSourceHeader).allChecked).toBe(true);
    });

    it('treeList 搜索交给 Tree 处理，并通知 onSearch', async () => {
        const onSearch = vi.fn<NonNullable<TransferProps['onSearch']>>();
        render(() => <Transfer type="treeList" dataSource={getTreeData()} onSearch={onSearch} />);
        await userEvent.type(getSearchInput(), 'Osaka');
        expect(onSearch).toHaveBeenLastCalledWith('Osaka');
        expect(screen.queryByText('Canada')).toBeNull();
        expect(screen.getByText('Osaka')).toBeInTheDocument();
    });

    it('renderSourcePanel 接收随状态更新的面板参数', () => {
        const renderSourcePanel = vi.fn<(props: SourcePanelProps) => null>(() => null);
        render(() => <Transfer defaultValue={['a']} dataSource={items} renderSourcePanel={renderSourcePanel} />);
        const panelProps = lastArg(renderSourcePanel);
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
        expect(panelProps).toMatchObject({ inputValue: 'ch', showNumber: 1, filterData: [items[2]], noMatch: false });
        panelProps.onSearch('zzz');
        expect(panelProps).toMatchObject({ noMatch: true, showNumber: 0, filterData: [] });
        expect(renderSourcePanel).toHaveBeenCalledTimes(1);
    });

    it('renderSelectedPanel 按顺序接收已选项目', () => {
        const renderSelectedPanel = vi.fn<(props: SelectedPanelProps) => null>(() => null);
        render(() => <Transfer defaultValue={['b', 'a']} dataSource={items} renderSelectedPanel={renderSelectedPanel} />);
        expect(lastArg(renderSelectedPanel)).toEqual({
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

    it('renderSourceItem 接收项目、选中状态和切换函数', () => {
        const renderSourceItem = vi.fn<NonNullable<TransferProps['renderSourceItem']>>((item) => (
            <button type="button" onClick={() => item.onChange?.()}>
                {item.label}
            </button>
        ));
        render(() => <Transfer defaultValue={['b']} dataSource={items} renderSourceItem={renderSourceItem} />);
        expect(renderSourceItem).toHaveBeenCalledWith({ ...items[1], checked: true, onChange: expect.any(Function) });
        screen.getByRole('button', { name: 'apple' }).click();
        expect(getRightItemTexts()).toEqual(['banana', 'apple']);
    });

    it('renderSourceItem 的 checked 随选择更新', async () => {
        render(() => <Transfer dataSource={items} renderSourceItem={(item) => <input type="checkbox" aria-label={String(item.label)} checked={item.checked} onClick={() => item.onChange?.()} />} />);
        await userEvent.click(screen.getByRole('checkbox', { name: 'apple' }));
        expect(screen.getByRole('checkbox', { name: 'apple' })).toBeChecked();
    });

    it('draggable 向 renderSelectedItem 提供 sortableHandle，并包裹项目以便排序', async () => {
        const renderSelectedItem = vi.fn<NonNullable<TransferProps['renderSelectedItem']>>((item) => {
            const Handle = item.sortableHandle?.(() => <span class="custom-handle" />);
            return (
                <div class="custom-selected">
                    {Handle && <Handle />}
                    {item.label}
                </div>
            );
        });
        render(() => <Transfer defaultValue={['a', 'b']} dataSource={items} draggable renderSelectedItem={renderSelectedItem} />);
        expect(document.querySelectorAll('.custom-handle')).toHaveLength(2);
        await waitFor(() => expect(document.querySelectorAll(`.${prefixCls}-right-item-sortable-item`)).toHaveLength(2));
        expect(Array.from(document.querySelectorAll('.custom-selected')).map((node) => node.textContent)).toEqual(['apple', 'banana']);
    });

    it('左侧列表分页，上报页码变化，搜索时回到第 1 页', async () => {
        const onPageChange = vi.fn<NonNullable<PaginationProps['onPageChange']>>();
        render(() => <Transfer dataSource={many} pagination={{ pageSize: 2, onPageChange }} />);
        expect(getLeftItemTexts()).toEqual(['item0', 'item1']);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
        expect(onPageChange).toHaveBeenCalledWith(2);
        expect(getLeftItemTexts()).toEqual(['item2', 'item3']);
        await userEvent.type(getSearchInput(), 'item');
        expect(getLeftItemTexts()).toEqual(['item0', 'item1']);
    });

    it('跟随受控的分页 currentPage', async () => {
        const onPageChange = vi.fn<NonNullable<PaginationProps['onPageChange']>>();
        const { setProps } = renderWith({ dataSource: many, pagination: { pageSize: 2, currentPage: 3, onPageChange } });
        expect(getLeftItemTexts()).toEqual(['item4']);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.prev }));
        expect(onPageChange).toHaveBeenCalledWith(2);
        expect(getLeftItemTexts()).toEqual(['item4']);
        setProps({ dataSource: many, pagination: { pageSize: 2, currentPage: 2, onPageChange } });
        expect(getLeftItemTexts()).toEqual(['item2', 'item3']);
    });

    it('dataSource 缩短使页码越界时显示最后一页', async () => {
        const { setProps } = renderWith({ dataSource: many, pagination: { pageSize: 2 } });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
        expect(getLeftItemTexts()).toEqual(['item4']);
        setProps({ dataSource: many.slice(0, 3), pagination: { pageSize: 2 } });
        expect(getLeftItemTexts()).toEqual(['item2']);
        setProps({ dataSource: many.slice(0, 2), pagination: { pageSize: 2 } });
        expect(getLeftItemTexts()).toEqual(['item0', 'item1']);
    });

    it('受控页码越界时搜索回到第 1 页并上报 onPageChange(1)', async () => {
        const onPageChange = vi.fn<NonNullable<PaginationProps['onPageChange']>>();
        render(() => <Transfer dataSource={many} pagination={{ pageSize: 2, currentPage: 3, onPageChange }} />);
        await userEvent.type(getSearchInput(), 'item4');
        expect(getLeftItemTexts()).toEqual(['item4']);
        expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('非受控搜索重置页码时上报一次 onPageChange(1)', async () => {
        const onPageChange = vi.fn<NonNullable<PaginationProps['onPageChange']>>();
        render(() => <Transfer dataSource={many} pagination={{ pageSize: 2, onPageChange }} />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
        onPageChange.mockClear();
        await userEvent.type(getSearchInput(), 'item');
        expect(onPageChange).toHaveBeenCalledExactlyOnceWith(1);
    });

    it('virtualize 时已选列表使用虚拟列表渲染', () => {
        render(() => <Transfer defaultValue={['a', 'b']} dataSource={items} virtualize={{ height: 100, itemSize: 30 }} />);
        expect(screen.getByRole('list', { name: zh_CN.Transfer.selectedList })).toHaveClass(`${prefixCls}-right-virtual-list`);
        expect(getRightItemTexts()).toEqual(['apple', 'banana']);
    });

    it('data-* 属性透传到根元素', () => {
        const { container } = render(() => <Transfer data-foo="bar" />);
        expect(container.firstElementChild).toHaveAttribute('data-foo', 'bar');
    });

    it('换成新的回调后调用新的回调', async () => {
        const first = vi.fn<(...args: unknown[]) => void>();
        const second = vi.fn<(...args: unknown[]) => void>();
        const { setProps } = renderWith({ dataSource: items, onChange: first, onSelect: first });
        setProps({ dataSource: items, onChange: second, onSelect: second });
        await userEvent.click(getLeftItem('apple'));
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(2);
    });

    it('每次操作只通知一次', async () => {
        const onChange = vi.fn<NonNullable<TransferProps['onChange']>>();
        const onSelect = vi.fn<NonNullable<TransferProps['onSelect']>>();
        const onSearch = vi.fn<NonNullable<TransferProps['onSearch']>>();
        render(() => <Transfer dataSource={items} onChange={onChange} onSearch={onSearch} onSelect={onSelect} />);
        await userEvent.click(getLeftItem('apple'));
        await userEvent.type(getSearchInput(), 'b');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(getRightItemTexts()).toEqual(['apple']);
        expect(getLeftItemTexts()).toEqual(['banana']);
    });

    it('不修改传入的 dataSource', () => {
        const treeData = getTreeData();
        const snapshot = structuredClone(treeData);
        render(() => <Transfer type="treeList" defaultValue={['Osaka']} dataSource={treeData} showPath />);
        expect(treeData).toEqual(snapshot);
    });

    it('多次更新间保持虚拟列表的滚动容器', async () => {
        render(() => <Transfer defaultValue={['a']} dataSource={items} virtualize={{ height: 100, itemSize: 30 }} />);
        const list = screen.getByRole('list', { name: zh_CN.Transfer.selectedList });
        await userEvent.click(getLeftItem('banana'));
        expect(getRightItemTexts()).toEqual(['apple', 'banana']);
        expect(screen.getByRole('list', { name: zh_CN.Transfer.selectedList })).toBe(list);
    });

    it('其他属性透传到根元素', () => {
        const { container } = render(() => <Transfer id="transfer" aria-label="Pick fruits" />);
        expect(container.firstElementChild).toHaveAttribute('id', 'transfer');
        expect(container.firstElementChild).toHaveAttribute('aria-label', 'Pick fruits');
    });

    it('根元素被使用方命名时是 group，未命名时没有角色，使用方的 role 优先', () => {
        const { container, setProps } = renderWith({ 'aria-label': 'Pick fruits' });
        expect(screen.getByRole('group', { name: 'Pick fruits' })).toBe(container.firstElementChild);
        setProps({ 'aria-labelledby': 'title' });
        expect(container.firstElementChild).toHaveAttribute('role', 'group');
        setProps({});
        expect(container.firstElementChild).not.toHaveAttribute('role');
        setProps({ 'aria-label': 'Pick fruits', role: 'toolbar' });
        expect(container.firstElementChild).toHaveAttribute('role', 'toolbar');
    });

    it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Transfer: { filter: false, emptyContent: { left: 'none' } } };
        const { container } = render(() => <Transfer />);
        expect(container.querySelector(`.${prefixCls}-filter`)).toBeNull();
        expect(container.querySelector(`.${prefixCls}-left-empty`)).toHaveTextContent('none');
    });
});

describe('Transfer 排序与禁用', () => {
    it('禁用时已选项不能拖拽排序，手柄保持不可用', async () => {
        render(() => (
            <>
                <Transfer defaultValue={['1', '2']} disabled dataSource={defaultItems} draggable />
                <Transfer defaultValue={['1']} dataSource={defaultItems} draggable />
            </>
        ));
        // once the enabled one shows sortable items, dnd-kit has loaded for both
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-right-item-sortable-item`)).not.toBeNull());
        const [disabledTransfer] = document.querySelectorAll<HTMLElement>(`.${prefixCls}`);
        const handles = within(disabledTransfer).getAllByRole('button', { name: zh_CN.Transfer.dragSort });
        expect(handles).toHaveLength(2);
        handles.forEach((handle) => expect(handle).toHaveAttribute('aria-disabled', 'true'));
        expect(disabledTransfer.querySelector(`.${prefixCls}-right-item-sortable-item`)).toBeNull();
    });

    const renderSortPanel = (panel: SelectedPanelProps) => (
        <div>
            <button type="button" onClick={() => panel.onSortEnd({ oldIndex: 0, newIndex: 1 })}>
                Sort
            </button>
            <For each={panel.selectedData}>{(item) => <span class="custom-item">{item.label}</span>}</For>
        </div>
    );

    it('禁用时 renderSelectedPanel 收到的 onSortEnd 不改变顺序、不触发 onChange', async () => {
        const onChange = vi.fn<NonNullable<TransferProps['onChange']>>();
        const { container } = render(() => <Transfer defaultValue={['1', '2']} disabled dataSource={defaultItems} renderSelectedPanel={renderSortPanel} onChange={onChange} />);
        await userEvent.click(screen.getByRole('button', { name: 'Sort' }));
        expect(onChange).not.toHaveBeenCalled();
        expect(Array.from(container.querySelectorAll('.custom-item')).map((item) => item.textContent)).toEqual(['item1', 'item2']);
    });

    it('受控时排序不写入内部状态，释放受控后右侧不残留排序前的受控值', async () => {
        const { container, setProps } = renderWith({ value: ['1', '2'], dataSource: defaultItems, renderSelectedPanel: renderSortPanel });
        await userEvent.click(screen.getByRole('button', { name: 'Sort' }));
        setProps({ value: undefined, dataSource: defaultItems, renderSelectedPanel: renderSortPanel });
        expect(container.querySelectorAll('.custom-item')).toHaveLength(0);
    });
});

describe('Transfer 树形与搜索', () => {
    it('treeList 中 children 为空数组的节点按叶子计数与全选', () => {
        const renderSourceHeader = vi.fn<NonNullable<TransferProps['renderSourceHeader']>>(() => null);
        const onChange = vi.fn<NonNullable<TransferProps['onChange']>>();
        const data = [{ label: 'Root', value: 'root', key: 'r', children: [{ label: 'Leaf', value: 'leaf', key: 'l', children: [] }] }];
        render(() => <Transfer type="treeList" dataSource={data} renderSourceHeader={renderSourceHeader} onChange={onChange} />);
        expect(lastArg(renderSourceHeader).leafOnlyNum).toBe(1);
        lastArg(renderSourceHeader).onAllClick();
        expect(lastArg(onChange)).toEqual(['leaf']);
    });

    it('treeList 的 showPath 用 label 文本拼接路径，renderLabel 只渲染树的节点', () => {
        const data = [{ label: 'Asia', value: 'Asia', key: '0', children: [{ label: 'Shanghai', value: 'Shanghai', key: '0-0' }] }];
        render(() => <Transfer type="treeList" defaultValue={['Shanghai']} dataSource={data} showPath renderLabel={(item) => <b>{item.label}</b>} />);
        expect(getRightItemTexts()).toEqual(['Asia > Shanghai']);
        expect(document.querySelector(`.${prefixCls}-right-item-text b`)).toBeNull();
        expect(within(screen.getByRole('tree', { name: zh_CN.Transfer.optionList })).getByText('Asia').tagName).toBe('B');
    });

    it('renderLabel 渲染左右两侧的项', async () => {
        render(() => <Transfer dataSource={[{ label: 'apple', value: 'a', key: 'a' }]} renderLabel={(item) => <b>{item.label}</b>} />);
        await userEvent.click(getLeftItem('apple'));
        expect(getLeftItemTexts()).toEqual(['apple']);
        expect(getRightItemTexts()).toEqual(['apple']);
        expect(document.querySelectorAll(`.${prefixCls} b`)).toHaveLength(2);
    });

    it('dataSource 的 label 只接受文本', () => {
        // @ts-expect-error markup for a label goes through renderLabel
        const item: DataItem = { label: <b>apple</b>, value: 'a', key: 'a' };
        expect(item.key).toBe('a');
    });

    it('loading 期间输入的关键字在树重新挂载后仍生效', async () => {
        const { setProps } = renderWith({ type: 'treeList', dataSource: [], loading: true });
        await userEvent.type(getSearchInput(), 'Osaka');
        setProps({ type: 'treeList', dataSource: getTreeData() });
        expect(screen.getByText('Osaka')).toBeInTheDocument();
        expect(screen.queryByText('Canada')).toBeNull();
    });

    it('数字 label 参与默认搜索', async () => {
        const data = [
            { label: 1001, value: 1001, key: 1001 },
            { label: 2002, value: 2002, key: 2002 },
        ];
        render(() => <Transfer dataSource={data} />);
        await userEvent.type(getSearchInput(), '10');
        expect(getLeftItemTexts()).toEqual(['1001']);
    });

    it('treeProps.style 与内置的 flex、overflow 合并', () => {
        const { unmount } = render(() => <Transfer type="treeList" dataSource={getTreeData()} treeProps={{ style: { height: '100px' } }} />);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-wrapper`)).toHaveStyle({ height: '100px', overflow: 'auto' });
        unmount();
        render(() => <Transfer type="treeList" dataSource={getTreeData()} treeProps={{ style: 'height: 80px' }} />);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-wrapper`)).toHaveStyle({ height: '80px', overflow: 'auto' });
    });

    it('treeProps 的 keyMaps 与 treeData 被忽略，勾选仍按 dataSource 选中', async () => {
        const onChange = vi.fn<NonNullable<TransferProps['onChange']>>();
        render(() => (
            <Transfer
                type="treeList"
                dataSource={getTreeData()}
                treeProps={{
                    // @ts-expect-error Transfer owns the field names of its data
                    keyMaps: { value: 'key' },
                    treeData: [],
                }}
                onChange={onChange}
            />
        ));
        await userEvent.click(screen.getByText('Osaka').closest('li') as HTMLElement);
        expect(lastArg(onChange)).toEqual(['Osaka']);
        expect(getRightItemTexts()).toEqual(['Osaka']);
    });

    it('emptyContent 的项为 null 时不渲染对应空状态', async () => {
        const { container } = render(() => <Transfer dataSource={[]} emptyContent={{ left: null, right: null }} />);
        expect(container.querySelector(`.${prefixCls}-empty`)).toBeNull();
        const { container: searching } = render(() => <Transfer dataSource={defaultItems} emptyContent={{ search: null }} />);
        await userEvent.type(searching.querySelector(`.${prefixCls}-filter input`) as HTMLInputElement, 'none');
        expect(searching.querySelector(`.${prefixCls}-left-empty`)).toBeNull();
    });

    it('tabIndex 落在搜索框上，Tooltip 包裹时根元素不多出 Tab 停留点', () => {
        const { container, unmount } = render(() => <Transfer tabIndex={-1} dataSource={defaultItems} />);
        expect(container.firstElementChild).not.toHaveAttribute('tabindex');
        expect(getSearchInput()).toHaveAttribute('tabindex', '-1');
        unmount();
        const wrapped = render(() => <Tooltip content="tip">{(getTriggerProps) => <Transfer {...getTriggerProps()} dataSource={defaultItems} />}</Tooltip>);
        expect(wrapped.container.querySelector(`.${prefixCls}`)).not.toHaveAttribute('tabindex');
        expect(getSearchInput()).toHaveAttribute('tabindex', '0');
    });
});
