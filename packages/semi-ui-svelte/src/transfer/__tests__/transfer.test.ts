import { flushSync, tick } from 'svelte';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { TransferDataItem, TransferHandle, TransferPagination, TransferProps, TransferSelectedPanelSnippetProps, TransferSourceHeaderSnippetProps, TransferSourcePanelSnippetProps, TransferValue } from '../interface';
import Transfer from '../transfer.svelte';
import TransferCase from './transfer-case.svelte';
import TransferModes from './transfer-modes.svelte';

type Case = NonNullable<Parameters<typeof TransferCase>[1]>['store'];
type Modes = Parameters<typeof TransferModes>[1]['store'];
type Change = (values: TransferValue, items: TransferDataItem[]) => void;

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

const items = [
    { label: 'apple', value: 'a', key: 'a' },
    { label: 'banana', value: 'b', key: 'b' },
    { label: 'cherry', value: 'c', key: 'c', disabled: true },
];
const many = Array.from({ length: 5 }, (_, i) => ({ label: `item${i}`, value: i, key: i }));

async function settle() {
    await tick();
    await tick();
    flushSync();
}

const renderTransfer = (props: TransferProps = {}) => render(Transfer, { props });

// the case fixture hosts the props in a store, so a test can change them after the mount
function mount(props: TransferProps = {}, extra: Partial<Case> = {}) {
    const store = createStore<Case>({ props, handle: {}, ...extra });
    render(TransferCase, { props: { store } });
    return store;
}

function getHandle(store: Case): TransferHandle {
    const handle = store.handle?.current;
    if (!handle) {
        throw new Error('The Transfer instance is not bound');
    }
    return handle;
}

const getRoot = () => document.querySelector(`.${prefixCls}`) as HTMLElement;
const getSearchInput = () => document.querySelector(`.${prefixCls}-filter input`) as HTMLInputElement;
const getLeftList = () => screen.getByRole('list', { name: zh_CN.Transfer.optionList });
const getSelectedList = () => screen.getByRole('list', { name: zh_CN.Transfer.selectedList });
const getLeftItem = (label: string) => within(getLeftList()).getByText(label);
// the Checkbox template leaves whitespace around its content
const getLeftCheckedTexts = () => [...document.querySelectorAll(`.${prefixCls}-left .${BASE_CLASS_PREFIX}-checkbox-checked`)].map((item) => item.textContent?.trim());
const getLeftItemTexts = () => [...document.querySelectorAll(`.${prefixCls}-left .${prefixCls}-item`)].map((item) => item.textContent?.trim());
const getRightItemTexts = () => [...document.querySelectorAll(`.${prefixCls}-right-item-text`)].map((item) => item.textContent);
const getHeaderButtons = () => document.querySelectorAll<HTMLButtonElement>(`button.${prefixCls}-header-all`);
const getCloseIcons = () => document.querySelectorAll<HTMLButtonElement>(`.${prefixCls}-item-close-icon`);
const getGroupTitles = () => [...document.querySelectorAll(`.${prefixCls}-group-title`)].map((t) => t.textContent);
const getCustomItems = () => [...document.querySelectorAll('.custom-item')].map((item) => item.textContent?.replace('Remove', '').trim());
async function click(element: Element) {
    await userEvent.click(element);
    await settle();
}
async function type(text: string) {
    await userEvent.type(getSearchInput(), text);
    await settle();
}

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Svelte Transfer', () => {
    it('自定义 class 和 style，data-* 透传到根元素', () => {
        renderTransfer({ class: 'test', style: 'color: red', 'data-foo': 'bar' });
        expect(getRoot()).toHaveClass(prefixCls, 'test');
        expect(getRoot()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getRoot()).toHaveAttribute('data-foo', 'bar');
    });

    it('初始 value 生效', () => {
        renderTransfer({ value: ['1'], dataSource: defaultItems });
        expect(getLeftCheckedTexts()).toEqual(['item1']);
        expect(getRightItemTexts()).toEqual(['item1']);
    });

    it('数据变化时搜索生效', async () => {
        const store = mount({ dataSource: [] });
        await type('2');
        store.props = {
            dataSource: [
                { label: '1', value: 1, key: 1 },
                { label: '2', value: 2, key: 2 },
            ],
        };
        await settle();
        expect(getSearchInput()).toHaveValue('2');
        expect(getLeftItemTexts()).toEqual(['2']);
        expect(screen.getByText('总个数：1')).toBeInTheDocument();
    });

    it('搜索', async () => {
        const onSearch = vi.fn<(searchValue: string) => void>();
        renderTransfer({ dataSource: defaultItems, onSearch });
        await type('1');
        expect(onSearch).toHaveBeenCalledExactlyOnceWith('1');
        expect(getLeftItemTexts()).toEqual(['item1']);
    });

    it('选择并变更', async () => {
        const onChange = vi.fn<Change>();
        const onSelect = vi.fn<(item: TransferDataItem) => void>();
        const onDeselect = vi.fn<(item: TransferDataItem) => void>();
        renderTransfer({ dataSource: defaultItems, onChange, onDeselect, onSelect });

        await click(getLeftItem('item1'));
        expect(getRightItemTexts()).toEqual(['item1']);
        await click(getLeftItem('item1'));
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
        const onChange = vi.fn<Change>();
        renderTransfer({ dataSource: defaultItems, onChange });

        const selectAllButton = getHeaderButtons()[0];
        expect(selectAllButton).toHaveTextContent('全选');
        await click(selectAllButton);
        expect(getRightItemTexts()).toEqual(['item1', 'item2']);
        expect(selectAllButton).toHaveTextContent('取消全选');
        await click(selectAllButton);
        expect(getRightItemTexts()).toEqual([]);

        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[0][0]).toEqual(['1', '2']);
        expect(onChange.mock.calls[0][1]).toHaveLength(defaultItems.length);
        expect(onChange.mock.calls[1]).toEqual([[], []]);
    });

    it('清空全部', async () => {
        const onChange = vi.fn<Change>();
        renderTransfer({ value: defaultItems.map((i) => i.value), dataSource: defaultItems, onChange });
        const clearAllButton = getHeaderButtons()[1];
        expect(clearAllButton).toHaveTextContent('清空');
        await click(clearAllButton);

        expect(onChange).toHaveBeenCalledExactlyOnceWith([], []);
        expect(getRightItemTexts()).toEqual([]);
        expect(getLeftCheckedTexts()).toEqual([]);
    });

    it('分组 Transfer 渲染', () => {
        renderTransfer({ type: 'groupList', value: [6], dataSource: dataWithGroup });
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
                .map((item) => item.textContent?.trim())
        ).toEqual(['B-1', 'B-2', 'B-3（disabled）']);
    });

    it('groupList 分页先按条目切片，再按组聚合', async () => {
        renderTransfer({ type: 'groupList', dataSource: dataWithGroup, pagination: { pageSize: 4 } });
        expect(getGroupTitles()).toEqual(['类别A', '类别B']);
        expect(getLeftItemTexts()).toEqual(['A-1', 'A-2', 'A-3', 'B-1']);
        await click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
        expect(getGroupTitles()).toEqual(['类别B', '类别C']);
        expect(getLeftItemTexts()).toEqual(['B-2', 'B-3（disabled）', 'C-1', 'C-2']);
    });

    it('disabled 属性', () => {
        renderTransfer({ disabled: true, dataSource: defaultItems });
        expect(getRoot()).toHaveClass(`${prefixCls}-disabled`);
    });

    it('draggable 属性：加载前的替身句柄有名称但标为不可用', () => {
        renderTransfer({ value: ['1'], dataSource: defaultItems, draggable: true });
        expect(document.querySelector(`.${prefixCls}-right-item`)).toHaveClass(`${prefixCls}-right-item-draggable`);
        const handle = screen.getByRole('button', { name: zh_CN.Transfer.dragSort });
        expect(handle).toHaveAttribute('aria-disabled', 'true');
        expect(handle).not.toHaveAttribute('tabindex');
    });

    it('可排序的已选列表仍是其项目的列表，加载后句柄是真正的按钮', async () => {
        renderTransfer({ value: ['1'], dataSource: defaultItems, draggable: true });
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-right-item-sortable-item`)).not.toBeNull());
        expect(within(getSelectedList()).getByRole('listitem')).toHaveTextContent('item1');
        const handle = screen.getByRole('button', { name: zh_CN.Transfer.dragSort });
        expect(handle.tagName).toBe('BUTTON');
        expect(handle).not.toHaveAttribute('aria-disabled');
        expect(handle).toHaveClass(`${prefixCls}-right-item-sortable-handle`);
    });

    it('已选项目的 draggable', () => {
        renderTransfer({ value: ['1', '2'], dataSource: defaultItems, draggable: true });
        expect(screen.getAllByRole('button', { name: zh_CN.Transfer.dragSort })).toHaveLength(2);
        expect(getRightItemTexts()).toEqual(['item1', 'item2']);
    });

    it('禁用的 Transfer 中，列表是可滚动的 Tab 停靠点', async () => {
        renderTransfer({ value: ['1'], disabled: true, dataSource: defaultItems });
        await userEvent.tab();
        expect(getLeftList()).toHaveFocus();
        await userEvent.tab();
        expect(getSelectedList()).toHaveFocus();
    });

    it('启用的 Transfer 中，列表本身不是 Tab 停靠点', () => {
        renderTransfer({ value: ['1'], dataSource: defaultItems });
        expect(getLeftList()).not.toHaveAttribute('tabindex');
        expect(getSelectedList()).not.toHaveAttribute('tabindex');
    });

    it('filter 属性', async () => {
        renderTransfer({ dataSource: defaultItems, filter: () => true });
        await type('no-such-label');
        expect(getLeftItemTexts()).toEqual(['item1', 'item2']);
    });

    it('默认过滤不区分大小写', async () => {
        renderTransfer({ dataSource: defaultItems });
        await type('ITEM2');
        expect(getLeftItemTexts()).toEqual(['item2']);
    });

    it('filter 为 false 时隐藏搜索框', () => {
        renderTransfer({ dataSource: defaultItems, filter: false });
        expect(document.querySelector(`.${prefixCls}-filter`)).toBeNull();
    });

    it('inputProps 属性覆盖内置的 placeholder', () => {
        renderTransfer({ dataSource: defaultItems, inputProps: { placeholder: 'Custom placeholder' } });
        expect(getSearchInput()).toHaveAttribute('placeholder', 'Custom placeholder');
    });

    it('loading 属性', () => {
        renderTransfer({ dataSource: defaultItems, loading: true });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-spin`)).not.toBeNull();
    });

    it('从右侧面板移除项目', async () => {
        const onChange = vi.fn<Change>();
        renderTransfer({ value: ['1'], dataSource: defaultItems, onChange });
        await click(getCloseIcons()[0]);
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

    it('search 方法过滤列表并同步搜索框，不触发 onSearch', async () => {
        const onSearch = vi.fn<(searchValue: string) => void>();
        const store = mount({ dataSource: defaultItems, onSearch });
        getHandle(store).search('item1');
        await settle();
        expect(getSearchInput()).toHaveValue('item1');
        expect(getLeftItemTexts()).toEqual(['item1']);
        expect(onSearch).not.toHaveBeenCalled();
    });

    it('select 与 deselect 回调', async () => {
        const onSelect = vi.fn<(item: TransferDataItem) => void>();
        const onDeselect = vi.fn<(item: TransferDataItem) => void>();
        renderTransfer({ dataSource: defaultItems, onDeselect, onSelect });

        await click(getLeftItem('item1'));
        expect(onSelect).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ value: '1' }));
        await click(getLeftItem('item1'));
        expect(onDeselect).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ value: '1' }));
    });

    it('无已选项时右侧显示空状态', () => {
        renderTransfer({ value: [], dataSource: [] });
        expect(document.querySelector(`.${prefixCls}-right-empty`)).toHaveTextContent('暂无内容，可从左侧勾选');
    });

    it('非受控时点击更新两侧', async () => {
        renderTransfer({ dataSource: defaultItems });
        await click(getLeftItem('item1'));
        expect(getLeftCheckedTexts()).toEqual(['item1']);
        expect(getRightItemTexts()).toEqual(['item1']);
    });
});

describe('Svelte Transfer 受控值（$bindable）', () => {
    const setup = (mode: 'bind' | 'function' | 'one-way' | 'uncontrolled', value?: TransferValue, accept = true) => {
        const store = createStore<Modes>({ value, accept, log: [], dataSource: items });
        render(TransferModes, { props: { mode, store } });
        return store;
    };

    it('非受控：点击更新两侧，onChange 收到新值', async () => {
        const store = setup('uncontrolled');
        await click(getLeftItem('apple'));
        await click(getLeftItem('banana'));
        expect(getRightItemTexts()).toEqual(['apple', 'banana']);
        expect(store.log).toEqual(['change ["a"]', 'change ["a","b"]']);
    });

    it('bind:value：点击写回父级，父级改值与置空都生效', async () => {
        const store = setup('bind', ['a']);
        await click(getLeftItem('banana'));
        expect(store.value).toEqual(['a', 'b']);
        expect(getRightItemTexts()).toEqual(['apple', 'banana']);

        store.value = ['b'];
        await settle();
        expect(getRightItemTexts()).toEqual(['banana']);

        store.value = undefined;
        await settle();
        expect(getRightItemTexts()).toEqual([]);
        await click(getLeftItem('apple'));
        expect(getRightItemTexts()).toEqual(['apple']);
        expect(store.value).toEqual(['a']);
    });

    it('函数绑定：setter 拒绝时两侧保持原值', async () => {
        const store = setup('function', ['a'], false);
        await click(getLeftItem('banana'));
        expect(store.log).toEqual(['set ["a","b"]', 'change ["a","b"]']);
        expect(store.value).toEqual(['a']);
        expect(getLeftCheckedTexts()).toEqual(['apple']);
        expect(getRightItemTexts()).toEqual(['apple']);
    });

    it('函数绑定：setter 接受时两侧跟随', async () => {
        const store = setup('function', ['a'], true);
        await click(getLeftItem('banana'));
        expect(store.value).toEqual(['a', 'b']);
        expect(getRightItemTexts()).toEqual(['apple', 'banana']);
    });

    it('单向传值：组件在本地覆盖，父级值不变；父级再推值时以父级为准', async () => {
        const store = setup('one-way', ['a']);
        await click(getLeftItem('banana'));
        expect(store.value).toEqual(['a']);
        expect(getRightItemTexts()).toEqual(['apple', 'banana']);

        store.value = ['b', 'a'];
        await settle();
        expect(getRightItemTexts()).toEqual(['banana', 'apple']);
        expect(getLeftCheckedTexts()).toEqual(['apple', 'banana']);
    });

    it('受控时点击只负责通知，父级改值后列表跟随', async () => {
        const store = setup('function', ['a'], false);
        store.value = ['b', 'a'];
        await settle();
        expect(getRightItemTexts()).toEqual(['banana', 'apple']);
        expect(getLeftCheckedTexts()).toEqual(['apple', 'banana']);

        await click(getCloseIcons()[0]);
        expect(store.log).toEqual(['set ["a"]', 'change ["a"]']);
        expect(getRightItemTexts()).toEqual(['banana', 'apple']);
    });

    it('父级以同一值重新渲染时仍以受控值为准', async () => {
        const store = setup('function', ['a'], false);
        await click(getLeftItem('banana'));
        store.value = ['a'];
        await settle();
        expect(getRightItemTexts()).toEqual(['apple']);
        expect(getLeftCheckedTexts()).toEqual(['apple']);
    });
});

describe('Svelte Transfer 行为', () => {
    it('dataSource 在挂载后到达时初始 value 仍生效', async () => {
        const store = mount({ value: ['a'], dataSource: [], loading: true });
        store.props = { value: ['a'], dataSource: items, loading: false };
        await settle();
        expect(getRightItemTexts()).toEqual(['apple']);
        expect(getLeftCheckedTexts()).toEqual(['apple']);
    });

    it('非受控的已选项跟随 dataSource 的修改与删除', async () => {
        const onChange = vi.fn<Change>();
        const store = mount({ dataSource: items, onChange });
        await click(getLeftItem('apple'));
        await click(getLeftItem('banana'));
        expect(getRightItemTexts()).toEqual(['apple', 'banana']);

        const renamed = { ...items[0], label: 'APPLE' };
        const date = { label: 'date', value: 'd', key: 'd' };
        store.dataSource = [renamed, items[2], date];
        await settle();
        expect(getRightItemTexts()).toEqual(['APPLE']);

        await click(getLeftItem('date'));
        expect(onChange).toHaveBeenLastCalledWith(['a', 'd'], [renamed, date]);

        await click(getHeaderButtons()[1]);
        expect(onChange).toHaveBeenLastCalledWith([], []);
        expect(getRightItemTexts()).toEqual([]);
    });

    it('非受控时 dataSource 把已选项改为禁用后，其移除按钮随之禁用', async () => {
        const store = mount({ dataSource: items });
        await click(getLeftItem('apple'));
        store.dataSource = [{ ...items[0], disabled: true }, items[1]];
        await settle();
        expect(getCloseIcons()[0]).toBeDisabled();
    });

    it('无数据时显示空状态', () => {
        renderTransfer({ dataSource: [] });
        expect(document.querySelector(`.${prefixCls}-left-empty`)).toHaveTextContent('暂无数据');
        expect(document.querySelector(`.${prefixCls}-right-empty`)).toHaveTextContent('暂无内容，可从左侧勾选');
    });

    it('禁用项目不能切换，全选和清空时保持其状态', async () => {
        const onChange = vi.fn<Change>();
        const onSelect = vi.fn<(item: TransferDataItem) => void>();
        renderTransfer({ value: ['c'], dataSource: items, onChange, onSelect });
        await click(getLeftItem('cherry'));
        expect(getCloseIcons()[0]).toHaveClass(`${prefixCls}-item-close-icon-disabled`);
        await click(getCloseIcons()[0]);
        expect(onChange).not.toHaveBeenCalled();
        expect(onSelect).not.toHaveBeenCalled();
        expect(getHeaderButtons()).toHaveLength(1);

        await click(getHeaderButtons()[0]);
        expect(onChange).toHaveBeenLastCalledWith(['c', 'a', 'b'], [items[2], items[0], items[1]]);
        expect(getRightItemTexts()).toEqual(['cherry', 'apple', 'banana']);

        await click(getHeaderButtons()[1]);
        expect(onChange).toHaveBeenLastCalledWith(['c'], [items[2]]);
        expect(getRightItemTexts()).toEqual(['cherry']);
    });

    it('禁用的 Transfer 禁用其控件并忽略点击', async () => {
        const onChange = vi.fn<Change>();
        renderTransfer({ value: ['a'], disabled: true, dataSource: items, onChange });
        expect(getSearchInput()).toBeDisabled();
        expect(getHeaderButtons()).toHaveLength(2);
        getHeaderButtons().forEach((button) => expect(button).toBeDisabled());
        await click(getCloseIcons()[0]);
        expect(onChange).not.toHaveBeenCalled();
        expect(getRightItemTexts()).toEqual(['apple']);
    });

    it('搜索模式下全选只影响匹配项，无匹配时显示 emptySearch', async () => {
        const onChange = vi.fn<Change>();
        mount({ dataSource: items, onChange }, { emptySearch: 'text' });
        await type('an');
        expect(getLeftItemTexts()).toEqual(['banana']);
        expect(screen.getByText('总个数：1')).toBeInTheDocument();

        await click(getHeaderButtons()[0]);
        expect(onChange).toHaveBeenLastCalledWith(['b'], [items[1]]);

        await userEvent.clear(getSearchInput());
        await type('zzz');
        expect(document.querySelector(`.${prefixCls}-left-empty`)).toHaveTextContent('nothing');
    });

    it('搜索过滤掉前面的条目后，剩下的条目仍是同一个 DOM 节点', async () => {
        renderTransfer({ dataSource: items });
        const getBanana = () =>
            within(getLeftList())
                .getAllByRole('listitem')
                .find((item) => item.textContent?.trim() === 'banana');
        const banana = getBanana();
        await type('an');
        expect(getLeftItemTexts()).toEqual(['banana']);
        expect(getBanana()).toBe(banana);
    });

    it('groupList 搜索过滤掉前一组后，剩下组的条目仍是同一个 DOM 节点', async () => {
        renderTransfer({ type: 'groupList', dataSource: dataWithGroup });
        const getB1 = () =>
            within(getLeftList())
                .getAllByRole('listitem')
                .find((item) => item.textContent?.trim() === 'B-1');
        const b1 = getB1();
        await type('B-1');
        expect(within(getLeftList()).getByRole('list', { name: '类别B' })).toContainElement(getB1() ?? null);
        expect(getB1()).toBe(b1);
    });

    it('groupList 传给 change、select 和 deselect 的项目中不含 _parent', async () => {
        const onChange = vi.fn<Change>();
        const onSelect = vi.fn<(item: TransferDataItem) => void>();
        const onDeselect = vi.fn<(item: TransferDataItem) => void>();
        renderTransfer({ type: 'groupList', dataSource: dataWithGroup, onChange, onSelect, onDeselect });
        const expected = { label: 'B-1', value: 4, disabled: false, key: 4 };
        await click(getLeftItem('B-1'));
        expect(onChange).toHaveBeenCalledWith([4], [expected]);
        expect(onSelect).toHaveBeenCalledWith(expected);
        expect(getRightItemTexts()).toEqual(['B-1']);
        await click(getLeftItem('B-1'));
        expect(onDeselect).toHaveBeenCalledWith(expected);
    });

    it('每次操作只发一次回调，onChange 不会收到原生 change 冒泡', async () => {
        const onChange = vi.fn<Change>();
        const onSelect = vi.fn<(item: TransferDataItem) => void>();
        const onSearch = vi.fn<(searchValue: string) => void>();
        renderTransfer({ dataSource: items, onChange, onSearch, onSelect });
        await click(getLeftItem('apple'));
        await type('b');
        await fireEvent.change(getSearchInput());
        await settle();
        expect(onChange).toHaveBeenCalledExactlyOnceWith(['a'], [items[0]]);
        expect(onSelect).toHaveBeenCalledOnce();
        expect(onSearch).toHaveBeenCalledExactlyOnceWith('b');
        expect(getRightItemTexts()).toEqual(['apple']);
        expect(getLeftItemTexts()).toEqual(['banana']);
    });

    it('回调随 props 更新：用最新的监听', async () => {
        const first = vi.fn<Change>();
        const second = vi.fn<Change>();
        const store = mount({ dataSource: items, onChange: first });
        store.props = { dataSource: items, onChange: second };
        await settle();
        await click(getLeftItem('apple'));
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledOnce();
    });

    it('不修改传入的 dataSource', async () => {
        const data = structuredClone(dataWithGroup);
        // a frozen source throws on any write the component makes to it
        for (const group of data) {
            group.children.forEach(Object.freeze);
            Object.freeze(group.children);
            Object.freeze(group);
        }
        Object.freeze(data);
        renderTransfer({ type: 'groupList', value: [1], dataSource: data });
        await click(getLeftItem('A-2'));
        expect(data).toEqual(dataWithGroup);
        expect(getRightItemTexts()).toEqual(['A-1', 'A-2']);
    });

    it('其他属性透传到根元素，带名称时根元素是 group', () => {
        renderTransfer({ id: 'transfer', 'aria-label': 'Pick fruits' });
        expect(getRoot()).toHaveAttribute('id', 'transfer');
        expect(screen.getByRole('group', { name: 'Pick fruits' })).toBe(getRoot());
    });

    it('使用方显式给出的 role 优先，未命名时根元素没有 role', () => {
        const { unmount } = renderTransfer({ role: 'region', 'aria-labelledby': 'x' });
        expect(getRoot()).toHaveAttribute('role', 'region');
        unmount();
        renderTransfer();
        expect(getRoot()).not.toHaveAttribute('role');
    });

    it('tabindex 落在搜索框上，根元素不是 Tab 停留点', () => {
        renderTransfer({ tabindex: -1, dataSource: defaultItems });
        expect(getRoot()).not.toHaveAttribute('tabindex');
        expect(getSearchInput()).toHaveAttribute('tabindex', '-1');
    });

    it('筛选框容器是带名称的原生 search 元素', () => {
        renderTransfer({ dataSource: defaultItems });
        // dom-testing-library has no implicit role for the native <search> element
        const search = document.querySelector('search');
        expect(search).toHaveAttribute('aria-label', zh_CN.Transfer.filter);
        expect(search).not.toHaveAttribute('role');
    });

    it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Transfer: { filter: false, showPath: true } };
        renderTransfer({ dataSource: items });
        expect(document.querySelector(`.${prefixCls}-filter`)).toBeNull();
    });

    it('全局默认的 filter 函数参与搜索，传入的 filter 优先', async () => {
        semiGlobal.config.overrideDefaultProps = { Transfer: { filter: () => true } };
        const { unmount } = renderTransfer({ dataSource: items });
        await type('zzz');
        expect(getLeftItemTexts()).toEqual(['apple', 'banana', 'cherry']);
        unmount();
        renderTransfer({ dataSource: items, filter: true });
        await type('zzz');
        expect(getLeftItemTexts()).toEqual([]);
    });

    it('列表、筛选框、删除按钮与排序手柄的名称跟随语言包', async () => {
        mount({ value: ['a'], dataSource: [items[0]], draggable: true }, { locale: ja_JP });
        expect(screen.getByRole('list', { name: ja_JP.Transfer.optionList })).toBeInTheDocument();
        expect(screen.getByRole('list', { name: ja_JP.Transfer.selectedList })).toBeInTheDocument();
        expect(document.querySelector('search')).toHaveAttribute('aria-label', ja_JP.Transfer.filter);
        expect(screen.getByRole('button', { name: ja_JP.Transfer.remove })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: ja_JP.Transfer.dragSort })).toBeInTheDocument();
        await waitFor(() => expect(screen.getByRole('button', { name: ja_JP.Transfer.dragSort })).toHaveAttribute('aria-roledescription', ja_JP.Sortable.roleDescription));
    });
});

describe('Svelte Transfer 分页', () => {
    it('左侧列表分页，上报页码变化，搜索时回到第 1 页', async () => {
        const onPageChange = vi.fn<NonNullable<TransferPagination['onPageChange']>>();
        renderTransfer({ dataSource: many, pagination: { pageSize: 2, onPageChange } });
        expect(getLeftItemTexts()).toEqual(['item0', 'item1']);
        await click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
        expect(onPageChange).toHaveBeenCalledWith(2);
        expect(getLeftItemTexts()).toEqual(['item2', 'item3']);
        await type('item');
        expect(getLeftItemTexts()).toEqual(['item0', 'item1']);
    });

    it('跟随受控的分页 currentPage', async () => {
        const onPageChange = vi.fn<NonNullable<TransferPagination['onPageChange']>>();
        const store = mount({ dataSource: many, pagination: { pageSize: 2, currentPage: 3, onPageChange } });
        expect(getLeftItemTexts()).toEqual(['item4']);
        await click(screen.getByRole('button', { name: zh_CN.Pagination.prev }));
        expect(onPageChange).toHaveBeenCalledWith(2);
        expect(getLeftItemTexts()).toEqual(['item4']);
        store.props = { dataSource: many, pagination: { pageSize: 2, currentPage: 2, onPageChange } };
        await settle();
        expect(getLeftItemTexts()).toEqual(['item2', 'item3']);
    });

    it('pagination.defaultCurrentPage 设置非受控的初始页', () => {
        renderTransfer({ dataSource: many, pagination: { pageSize: 2, defaultCurrentPage: 2 } });
        expect(getLeftItemTexts()).toEqual(['item2', 'item3']);
    });

    it('dataSource 缩短使页码越界时显示最后一页', async () => {
        const store = mount({ dataSource: many, pagination: { pageSize: 2 } });
        await click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
        await click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
        expect(getLeftItemTexts()).toEqual(['item4']);
        store.dataSource = many.slice(0, 3);
        await settle();
        expect(getLeftItemTexts()).toEqual(['item2']);
        store.dataSource = many.slice(0, 2);
        await settle();
        expect(getLeftItemTexts()).toEqual(['item0', 'item1']);
    });

    it('受控页码越界时搜索回到第 1 页并上报 onPageChange(1)', async () => {
        const onPageChange = vi.fn<NonNullable<TransferPagination['onPageChange']>>();
        renderTransfer({ dataSource: many, pagination: { pageSize: 2, currentPage: 3, onPageChange } });
        await type('item4');
        expect(getLeftItemTexts()).toEqual(['item4']);
        expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('非受控搜索重置页码时上报一次 onPageChange(1)', async () => {
        const onPageChange = vi.fn<NonNullable<TransferPagination['onPageChange']>>();
        renderTransfer({ dataSource: many, pagination: { pageSize: 2, onPageChange } });
        await click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
        onPageChange.mockClear();
        await type('item');
        expect(onPageChange).toHaveBeenCalledExactlyOnceWith(1);
    });
});

describe('Svelte Transfer 虚拟列表', () => {
    it('virtualize 时已选列表使用虚拟列表渲染', () => {
        renderTransfer({ value: ['a', 'b'], dataSource: items, virtualize: { height: 100, itemSize: 30 } });
        expect(getSelectedList()).toHaveClass(`${prefixCls}-right-virtual-list`);
        expect(getRightItemTexts()).toEqual(['apple', 'banana']);
    });

    it('draggable 时忽略 virtualize', () => {
        renderTransfer({ value: ['a', 'b'], dataSource: items, draggable: true, virtualize: { height: 100, itemSize: 30 } });
        expect(getSelectedList()).not.toHaveClass(`${prefixCls}-right-virtual-list`);
        expect(getRightItemTexts()).toEqual(['apple', 'banana']);
    });

    it('多次渲染间保持虚拟列表的滚动容器', async () => {
        renderTransfer({ value: ['a'], dataSource: items, virtualize: { height: 100, itemSize: 30 } });
        const list = getSelectedList();
        await click(getLeftItem('banana'));
        expect(getRightItemTexts()).toEqual(['apple', 'banana']);
        expect(getSelectedList()).toBe(list);
    });
});

describe('Svelte Transfer snippet', () => {
    it('emptyLeft 与 emptyRight', () => {
        mount({ dataSource: [] }, { emptyLeft: 'text', emptyRight: 'text' });
        expect(document.querySelector(`.${prefixCls}-left-empty .custom-empty-left`)).toHaveTextContent('No data');
        expect(document.querySelector(`.${prefixCls}-right-empty .custom-empty-right`)).toHaveTextContent('No selection');
    });

    it('未提供空状态 snippet 时显示语言包文案，各 snippet 独立回落', () => {
        mount({ dataSource: [] }, { emptyLeft: 'text' });
        expect(document.querySelector(`.${prefixCls}-left-empty`)).toHaveTextContent('No data');
        expect(document.querySelector(`.${prefixCls}-right-empty`)).toHaveTextContent(zh_CN.Transfer.emptyRight);
    });

    it('空状态传 false 时隐藏，空 snippet 只留空容器', () => {
        mount({ dataSource: [] }, { emptyLeft: 'hidden', emptyRight: 'blank' });
        expect(document.querySelector(`.${prefixCls}-left-empty`)).toBeNull();
        expect(document.querySelector(`.${prefixCls}-right-empty`)?.textContent).toBe('');
    });

    it('emptySearch 为 false 时无搜索结果不显示空状态，label 替换两侧的条目内容', async () => {
        const store = mount({ value: ['a'], dataSource: [] }, { emptyLeft: 'hidden', emptySearch: 'hidden', label: 'bold' });
        expect(document.querySelector(`.${prefixCls}-left-empty`)).toBeNull();
        expect(document.querySelector(`.${prefixCls}-right-empty`)).toHaveTextContent(zh_CN.Transfer.emptyRight);

        store.props = { value: ['a'], dataSource: items };
        await settle();
        expect(getLeftItemTexts()).toEqual(['apple!', 'banana!', 'cherry!']);
        expect(getRightItemTexts()).toEqual(['apple!']);
        expect(within(getSelectedList()).getByText('apple!')).toHaveClass('custom-label');

        await type('ban');
        expect(getLeftItemTexts()).toEqual(['banana!']);
        await type('zzz');
        expect(document.querySelector(`.${prefixCls}-left-empty`)).toBeNull();
    });

    it('label 也用于可排序列表的条目', async () => {
        mount({ value: ['a'], dataSource: items, draggable: true }, { label: 'italic' });
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-right-item-sortable-item`)).not.toBeNull());
        expect(getRightItemTexts()).toEqual(['<apple>']);
    });

    it('左侧条目是 Checkbox 根元素上的 listitem', () => {
        renderTransfer({ dataSource: defaultItems });
        const listItems = within(getLeftList()).getAllByRole('listitem');
        expect(listItems.map((item) => item.className)).toEqual([expect.stringContaining(`${BASE_CLASS_PREFIX}-checkbox`), expect.stringContaining(`${BASE_CLASS_PREFIX}-checkbox`)]);
        expect(within(listItems[0]).getByRole('checkbox')).not.toBeChecked();
    });

    it('sourceItem', () => {
        mount({ dataSource: defaultItems }, { sourceItem: 'text' });
        expect([...document.querySelectorAll('.custom-source-item')].map((item) => item.textContent)).toEqual(['item1', 'item2']);
    });

    it('selectedItem', () => {
        mount({ value: ['1'], dataSource: defaultItems }, { selectedItem: 'text' });
        expect(document.querySelector(`.${prefixCls}-right .custom-selected`)).toHaveTextContent('item1');
    });

    it('自定义渲染的项目是其列表的列表项', () => {
        mount({ value: ['1'], dataSource: defaultItems }, { sourceItem: 'text', selectedItem: 'text' });
        const [source, selected] = screen.getAllByRole('list');
        expect(
            within(source)
                .getAllByRole('listitem')
                .map((item) => item.textContent?.trim())
        ).toEqual(['item1', 'item2']);
        expect(within(selected).getByRole('listitem')).toHaveTextContent('item1');
    });

    it('sourceItem 接收项目、选中状态和切换函数，参数不展平到项目上', async () => {
        const spy = vi.fn<(props: { item: TransferDataItem; index: number; checked: boolean; onChange: () => void }) => void>();
        const withOwnFields = [...items, { label: 'date', value: 'd', key: 'd', checked: 'own' }];
        mount({ value: ['b'], dataSource: withOwnFields }, { sourceItem: 'button', spy: { sourceItem: spy } });
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ item: items[1], index: 1, checked: true, onChange: expect.any(Function) }));
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ item: withOwnFields[3], index: 3, checked: false }));
        await click(screen.getByRole('button', { name: 'apple' }));
        expect(getRightItemTexts()).toEqual(['banana', 'apple']);
    });

    it('sourceHeader 接收个数、按钮状态与全选函数', async () => {
        mount({ dataSource: defaultItems }, { sourceHeader: true });
        expect(document.querySelector('.custom-source-header')).not.toBeNull();
        expect(screen.getByText('Total: 2')).toBeInTheDocument();
        await click(screen.getByRole('button', { name: 'Select All' }));
        expect(screen.getByRole('button', { name: 'Deselect' })).toBeInTheDocument();
    });

    it('selectedHeader 接收个数与清空函数', async () => {
        mount({ value: ['1'], dataSource: defaultItems }, { selectedHeader: true });
        expect(screen.getByText('Selected: 1')).toBeInTheDocument();
        await click(screen.getByRole('button', { name: 'Clear' }));
        expect(screen.getByText('Selected: 0')).toBeInTheDocument();
    });

    it('selectedPanel 列出已选项目，移除与清空更新两侧', async () => {
        mount({ value: ['1', '2'], dataSource: defaultItems }, { selectedPanel: 'list' });
        expect(document.querySelector('.custom-selected-panel')).not.toBeNull();
        expect(getCustomItems()).toEqual(['item1', 'item2']);

        await click(screen.getAllByRole('button', { name: 'Remove' })[0]);
        expect(getCustomItems()).toEqual(['item2']);
        expect(getLeftCheckedTexts()).toEqual(['item2']);

        await click(screen.getByRole('button', { name: 'Clear' }));
        expect(getCustomItems()).toEqual([]);
        expect(getLeftCheckedTexts()).toEqual([]);
    });

    it('sourcePanel 列出匹配项目，全选与逐项切换更新右侧', async () => {
        mount({ dataSource: defaultItems }, { sourcePanel: 'list' });
        expect(document.querySelector('.custom-source-panel')).not.toBeNull();
        expect([...document.querySelectorAll('.custom-source-item')].map((item) => item.textContent)).toEqual(['item1', 'item2']);
        await click(screen.getByRole('button', { name: 'Select All' }));
        expect(getRightItemTexts()).toEqual(['item1', 'item2']);
        await click(screen.getAllByRole('button', { name: 'item1' })[0]);
        expect(getRightItemTexts()).toEqual(['item2']);
    });

    it('sourcePanel 配合 onSelect 与 onAllClick', async () => {
        const onChange = vi.fn<Change>();
        mount({ dataSource: defaultItems, onChange }, { sourcePanel: 'select' });
        await click(screen.getByRole('button', { name: 'Select Multiple' }));
        expect(onChange).toHaveBeenCalledOnce();
        expect(onChange.mock.calls[0][0]).toEqual(['1', '2']);
        expect(getRightItemTexts()).toEqual(['item1', 'item2']);

        await click(screen.getByRole('button', { name: 'Select All' }));
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[1]).toEqual([[], []]);
        expect(getRightItemTexts()).toEqual([]);
    });

    it('selectedPanel 配合 onSortEnd', async () => {
        const onChange = vi.fn<Change>();
        mount({ value: ['1', '2'], dataSource: defaultItems, onChange }, { selectedPanel: 'sort' });
        await click(screen.getByRole('button', { name: 'Sort' }));
        expect([...document.querySelectorAll('.custom-item')].map((item) => item.textContent)).toEqual(['item2', 'item1']);
        expect(onChange).toHaveBeenCalledOnce();
        expect(onChange.mock.calls[0][0]).toEqual(['2', '1']);
    });

    it('同时自定义 sourcePanel 和 selectedPanel', () => {
        mount({ dataSource: defaultItems }, { sourcePanel: 'plain', selectedPanel: 'plain' });
        expect(getRoot()).toHaveClass(`${prefixCls}-custom-panel`);
        expect(getRoot()).toHaveTextContent(/Source\s*Selected/);
    });

    it('sourcePanel 接收面板状态', async () => {
        const spy = vi.fn<(props: TransferSourcePanelSnippetProps) => void>();
        mount({ value: ['a'], dataSource: items }, { sourcePanel: 'plain', spy: { sourcePanel: spy } });
        const panelProps = spy.mock.lastCall?.[0] as TransferSourcePanelSnippetProps;
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
        await settle();
        expect(spy.mock.lastCall?.[0]).toMatchObject({ inputValue: 'ch', showNumber: 1, filterData: [items[2]], noMatch: false });
        spy.mock.lastCall?.[0].onSearch('zzz');
        await settle();
        expect(spy.mock.lastCall?.[0]).toMatchObject({ noMatch: true, showNumber: 0, filterData: [] });
    });

    it('selectedPanel 按顺序接收已选项目', () => {
        const spy = vi.fn<(props: TransferSelectedPanelSnippetProps) => void>();
        mount({ value: ['b', 'a'], dataSource: items }, { selectedPanel: 'plain', spy: { selectedPanel: spy } });
        expect(spy.mock.lastCall?.[0]).toEqual({
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

    it('draggable 向 selectedItem 提供 handle，并包裹项目以便排序', async () => {
        mount({ value: ['a', 'b'], dataSource: items, draggable: true }, { selectedItem: 'handle' });
        expect(document.querySelectorAll('.custom-handle')).toHaveLength(2);
        await waitFor(() => expect(document.querySelectorAll(`.${prefixCls}-right-item-sortable-item`)).toHaveLength(2));
        expect([...document.querySelectorAll('.custom-selected')].map((node) => node.textContent?.trim())).toEqual(['apple', 'banana']);
        const handles = screen.getAllByRole('button', { name: zh_CN.Transfer.dragSort });
        expect(handles).toHaveLength(2);
        expect(handles[0].querySelector('.custom-handle')).not.toBeNull();
    });

    it('没有 draggable 时 selectedItem 的 handle 为 undefined', () => {
        const spy = vi.fn<(props: { handle?: unknown }) => void>();
        mount({ value: ['a'], dataSource: items }, { selectedItem: 'text', spy: { selectedItem: spy } });
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ item: { ...items[0], fullPath: undefined }, index: 0, handle: undefined }));
    });

    it('替身列表中 handle 直接渲染内容，没有拖拽按钮', () => {
        mount({ value: ['a'], dataSource: items, draggable: true }, { selectedItem: 'handle' });
        expect(screen.queryByRole('button', { name: zh_CN.Transfer.dragSort })).toBeNull();
        expect(document.querySelector('.custom-handle')).not.toBeNull();
    });
});

describe('Svelte Transfer treeList', () => {
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

    it('树形 Transfer 渲染：点击节点选中其全部子叶，搜索通知 onSearch', async () => {
        const onChange = vi.fn<Change>();
        const onSearch = vi.fn<(searchValue: string) => void>();
        renderTransfer({ type: 'treeList', value: ['Shanghai'], dataSource: getTreeData(), draggable: true, showPath: true, onChange, onSearch });

        await click(document.querySelector(`li.${BASE_CLASS_PREFIX}-tree-option`) as HTMLElement);
        await type('1');

        expect(onChange).toHaveBeenCalledOnce();
        const [values, changedItems] = onChange.mock.calls[0];
        expect(values).toHaveLength(4);
        expect(values).toEqual(expect.arrayContaining(['Shanghai', 'Chengdu', 'Chongqing', 'Osaka']));
        expect(changedItems).toHaveLength(4);
        expect(onSearch).toHaveBeenCalledExactlyOnceWith('1');
    });

    it('showPath 属性', () => {
        renderTransfer({ type: 'treeList', value: ['Shanghai'], dataSource: getTreeData(), showPath: true });
        expect(getRightItemTexts()).toEqual(['Asia > China > Shanghai']);
    });

    it('树形 Transfer 配合 treeProps 的 class', () => {
        renderTransfer({ type: 'treeList', dataSource: getTreeData(), treeProps: { class: 'custom-tree' } });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-wrapper`)).toHaveClass('custom-tree');
    });

    it('treeList 左侧的 tree 以 optionList 命名，treeProps 的 aria-label 优先', () => {
        const { unmount } = renderTransfer({ type: 'treeList', dataSource: getTreeData() });
        expect(screen.getByRole('tree', { name: zh_CN.Transfer.optionList })).toBeInTheDocument();
        unmount();
        renderTransfer({ type: 'treeList', dataSource: getTreeData(), treeProps: { 'aria-label': 'Cities' } });
        expect(screen.getByRole('tree', { name: 'Cities' })).toBeInTheDocument();
        expect(screen.queryByRole('tree', { name: zh_CN.Transfer.optionList })).toBeNull();
    });

    it('treeProps 的 onChange 不覆盖 Transfer 的选择', async () => {
        const onChange = vi.fn<Change>();
        const onTreeChange = vi.fn<(value: unknown) => void>();
        // the type drops `value` and `onChange`; a plain JS caller can still pass them
        const treeProps = { value: ['Canada'], onChange: onTreeChange } as unknown as TransferProps['treeProps'];
        renderTransfer({ type: 'treeList', dataSource: getTreeData(), treeProps, onChange });
        expect(getRightItemTexts()).toEqual([]);
        await click(getTreeRow('Osaka'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith(['Osaka'], expect.any(Array));
        expect(onTreeChange).not.toHaveBeenCalled();
        expect(getRightItemTexts()).toEqual(['Osaka']);
    });

    it('treeProps 的 keyMaps、treeData 与 onChangeWithObject 被忽略，勾选仍按 dataSource 选中', async () => {
        const onChange = vi.fn<Change>();
        const treeProps = { keyMaps: { value: 'key' }, treeData: [], onChangeWithObject: true } as unknown as TransferProps['treeProps'];
        renderTransfer({ type: 'treeList', dataSource: getTreeData(), treeProps, onChange });
        await click(getTreeRow('Osaka'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith(['Osaka'], expect.any(Array));
        expect(getRightItemTexts()).toEqual(['Osaka']);
    });

    it('treeList 配合 showPath 时，向 selectedItem 和 onChange 的项目传递 fullPath', async () => {
        const onChange = vi.fn<Change>();
        mount({ type: 'treeList', value: ['Osaka'], dataSource: getTreeData(), showPath: true, onChange }, { selectedItem: 'fullPath' });
        expect(document.querySelector('.custom-selected')).toHaveTextContent('Asia/Japan/Osaka');

        await click(getTreeRow('Canada'));
        expect(onChange).toHaveBeenCalledOnce();
        const [values, changedItems] = onChange.mock.calls[0];
        expect(values).toHaveLength(2);
        expect(values).toEqual(expect.arrayContaining(['Osaka', 'Canada']));
        expect(changedItems.find((item) => item.value === 'Canada')?.fullPath?.map((node) => node.label)).toEqual(['North America', 'Canada']);
    });

    it('treeList 向 sourceHeader 传递节点数和叶子数', () => {
        const spy = vi.fn<(props: TransferSourceHeaderSnippetProps) => void>();
        mount({ type: 'treeList', dataSource: getTreeData() }, { sourceHeader: true, spy: { sourceHeader: spy } });
        expect(spy).toHaveBeenLastCalledWith({ num: 11, showButton: false, allChecked: false, onAllClick: expect.any(Function), leafOnlyNum: 7 });
    });

    it('treeList 的全部可选叶子都选中后 allChecked 为 true，onAllClick 只选叶子', async () => {
        const spy = vi.fn<(props: TransferSourceHeaderSnippetProps) => void>();
        const onChange = vi.fn<Change>();
        const store = mount({ type: 'treeList', dataSource: getTreeData(), onChange }, { sourceHeader: true, spy: { sourceHeader: spy } });
        expect(spy.mock.lastCall?.[0].allChecked).toBe(false);
        spy.mock.lastCall?.[0].onAllClick();
        expect(onChange.mock.lastCall?.[0]).toEqual(leaves);

        store.props = { type: 'treeList', dataSource: getTreeData(), onChange, value: leaves };
        await settle();
        expect(spy.mock.lastCall?.[0].allChecked).toBe(true);
    });

    it('treeList 的默认头部不显示全选按钮', () => {
        renderTransfer({ type: 'treeList', dataSource: getTreeData() });
        expect(document.querySelector(`.${prefixCls}-left .${prefixCls}-header-all`)).toBeNull();
        expect(screen.getByText('总个数：11')).toBeInTheDocument();
    });

    it('treeList 搜索交给 Tree 处理，并通知 onSearch', async () => {
        const onSearch = vi.fn<(searchValue: string) => void>();
        renderTransfer({ type: 'treeList', dataSource: getTreeData(), onSearch });
        await type('Osaka');
        expect(onSearch).toHaveBeenLastCalledWith('Osaka');
        expect(screen.queryByText('Canada')).toBeNull();
        expect(screen.getByText('Osaka')).toBeInTheDocument();
    });

    it('Tree 自带的搜索框隐藏，只有 Transfer 的搜索框', () => {
        renderTransfer({ type: 'treeList', dataSource: getTreeData() });
        expect(screen.getAllByRole('textbox')).toEqual([getSearchInput()]);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-search-wrapper`)).toBeNull();
    });

    it('search 方法过滤 Tree，不触发 onSearch', async () => {
        const onSearch = vi.fn<(searchValue: string) => void>();
        const store = mount({ type: 'treeList', dataSource: getTreeData(), onSearch });
        getHandle(store).search('Osaka');
        await settle();
        expect(screen.queryByText('Canada')).toBeNull();
        expect(screen.getByText('Osaka')).toBeInTheDocument();
        expect(getSearchInput()).toHaveValue('Osaka');
        expect(onSearch).not.toHaveBeenCalled();
    });

    it('label 转发到 Tree 的行与已选项，参数为数据项', () => {
        mount({ type: 'treeList', value: ['Osaka'], dataSource: getTreeData() }, { label: 'bold' });
        const tree = screen.getByRole('tree');
        expect(within(tree).getByText('Osaka!')).toHaveClass('custom-label');
        expect(within(tree).getByText('Asia!')).toBeInTheDocument();
        expect(within(getSelectedList()).getByText('Osaka!')).toBeInTheDocument();
    });

    it('没有 label 时 Tree 行显示数据中的 label', () => {
        renderTransfer({ type: 'treeList', dataSource: getTreeData() });
        expect(within(screen.getByRole('tree')).getAllByRole('treeitem')[0].querySelector(`.${BASE_CLASS_PREFIX}-tree-option-label-text`)).toHaveTextContent('Asia');
        expect(document.querySelector('.custom-label')).toBeNull();
    });

    it('整体替换 dataSource 后 Tree 与已选项随之更新', async () => {
        const store = mount({ type: 'treeList', value: ['Canada'], dataSource: getTreeData() });
        expect(getRightItemTexts()).toEqual(['Canada']);
        const next = getTreeData();
        next[1].children[1].label = 'Mexico';
        store.props = { type: 'treeList', value: ['Canada'], dataSource: next };
        await settle();
        expect(within(screen.getByRole('tree')).getByText('Mexico')).toBeInTheDocument();
        expect(screen.queryByText('Canada')).toBeNull();
        expect(getRightItemTexts()).toEqual(['Mexico']);
    });

    it('不修改传入的 dataSource', () => {
        const treeData = getTreeData();
        const snapshot = structuredClone(treeData);
        renderTransfer({ type: 'treeList', value: ['Osaka'], dataSource: treeData, showPath: true });
        expect(treeData).toEqual(snapshot);
    });

    it('loading 期间输入的关键字在树重新挂载后仍生效', async () => {
        const store = mount({ type: 'treeList', loading: true, dataSource: [] });
        await type('Osaka');
        store.props = { type: 'treeList', loading: false, dataSource: getTreeData() };
        await settle();
        await waitFor(() => expect(screen.queryByText('Canada')).toBeNull());
        expect(screen.getByText('Osaka')).toBeInTheDocument();
    });
});

describe('Svelte Transfer 排序与禁用', () => {
    it('禁用时已选项不能拖拽排序，句柄保持不可用', async () => {
        render(Transfer, { props: { disabled: true, draggable: true, value: ['1', '2'], dataSource: defaultItems } });
        render(Transfer, { props: { draggable: true, value: ['1'], dataSource: defaultItems } });
        // once the enabled one shows sortable items, the sortable chunk has loaded for both
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-right-item-sortable-item`)).not.toBeNull());
        const disabledTransfer = document.querySelector(`.${prefixCls}`) as HTMLElement;
        const handles = within(disabledTransfer).getAllByRole('button', { name: zh_CN.Transfer.dragSort });
        expect(handles).toHaveLength(2);
        handles.forEach((handle) => expect(handle).toHaveAttribute('aria-disabled', 'true'));
        expect(disabledTransfer.querySelector(`.${prefixCls}-right-item-sortable-item`)).toBeNull();
    });

    it('禁用时 selectedPanel 收到的 onSortEnd 不改变顺序、不发 onChange', async () => {
        const onChange = vi.fn<Change>();
        mount({ disabled: true, value: ['1', '2'], dataSource: defaultItems, onChange }, { selectedPanel: 'sort' });
        await click(screen.getByRole('button', { name: 'Sort' }));
        expect(onChange).not.toHaveBeenCalled();
        expect([...document.querySelectorAll('.custom-item')].map((item) => item.textContent)).toEqual(['item1', 'item2']);
    });

    it('有值时排序不写入内部状态，释放 value 后右侧不残留排序前的值', async () => {
        const store = mount({ value: ['1', '2'], dataSource: defaultItems }, { selectedPanel: 'sort' });
        await click(screen.getByRole('button', { name: 'Sort' }));
        expect([...document.querySelectorAll('.custom-item')].map((item) => item.textContent)).toEqual(['item2', 'item1']);
        store.props = { dataSource: defaultItems };
        await settle();
        expect(document.querySelectorAll('.custom-item')).toHaveLength(0);
    });
});
