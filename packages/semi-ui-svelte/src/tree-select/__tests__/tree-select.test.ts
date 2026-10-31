import { createRawSnippet, flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import type { TreeSelectHandle, TreeSelectProps, TreeSelectSearchSnippetProps, TreeSelectSelectedItemSnippetProps, TreeSelectTriggerSnippetProps, TreeSelectValue } from '..';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { TreeNodeData } from '../../tree';
import { click, getClearButton, getPopover, getRoot, getRow, getRowLabels, getRows, getSearchInput, getSelectionText, getTagTexts, getTags, getTriggerInput, keyDown, optionCls, prefixCls, search, settle, treeData, treeDataWithDisabledLeaf, treeDataWithLoad, treePrefixCls } from './data';
import TreeSelectCase from './tree-select-case.svelte';

type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';
type Setup = { mode?: Mode; value?: TreeSelectValue; expandedKeys?: string[]; accept?: boolean };

function setup(props: Omit<TreeSelectProps, 'value' | 'expandedKeys'> = {}, { value, expandedKeys, mode = value === undefined && expandedKeys === undefined ? 'uncontrolled' : 'one-way', accept = true }: Setup = {}) {
    const store = createStore<{ value?: TreeSelectValue; expandedKeys?: string[]; accept: boolean; log: string[]; props?: TreeSelectProps }>({ value, expandedKeys, accept, log: [] });
    const result = render(TreeSelectCase, { props: { mode, store, props: { treeData, defaultOpen: true, ...props } } });
    flushSync();
    const api = () => {
        const handle = result.component.api() as TreeSelectHandle | undefined;
        if (!handle) throw new Error('TreeSelect is not mounted');
        return handle;
    };
    return { store, api, ...result };
}

const snippet = (html: string) => createRawSnippet(() => ({ render: () => html }));

const getCombobox = () => screen.getByRole('combobox');
const getTree = () => screen.getByRole('tree');
const isChecked = (label: string) => getRow(label).getAttribute('aria-checked') === 'true';
const activeLabel = (host: Element) => document.getElementById(host.getAttribute('aria-activedescendant') ?? '')?.textContent?.trim();
async function focus(element: HTMLElement) {
    element.focus();
    await settle();
}
const expand = (label: string) => click(getRow(label).querySelector(`.${optionCls}-expand-icon`));
const emptyText = en_US.Tree.emptyText;
const locale = en_US.TreeSelect;

afterEach(() => {
    semiGlobal.config = {};
});

describe('Svelte TreeSelect 渲染', () => {
    it('class、style 与 data-* 落在根元素，aria-label 落在 combobox', async () => {
        setup({ class: 'custom', style: 'height: 40px', 'data-x': '1' } as TreeSelectProps);
        await settle();
        const root = getRoot();
        expect(root).toHaveClass(prefixCls, 'custom', `${prefixCls}-single`);
        expect(root).toHaveStyle({ height: '40px' });
        expect(root).toHaveAttribute('data-x', '1');
        expect(getCombobox()).toBe(root);
        expect(root).toHaveAttribute('aria-label', 'Region');
        expect(root).toHaveAttribute('aria-haspopup', 'tree');
    });

    it('默认展开的下拉里渲染树，combobox 指向它', async () => {
        setup();
        await settle();
        expect(getRowLabels()).toEqual(['亚洲', '北美洲']);
        expect(getTree()).toHaveAttribute('aria-label', 'Region');
        expect(getCombobox()).toHaveAttribute('aria-expanded', 'true');
        expect(getCombobox()).toHaveAttribute('aria-controls', getTree().id);
    });

    it('不设 defaultOpen 时点击触发器才打开', async () => {
        setup({ defaultOpen: false });
        await settle();
        expect(getPopover()).toBeNull();
        expect(getCombobox()).toHaveAttribute('aria-expanded', 'false');
        await click(getRoot());
        expect(getPopover()).not.toBeNull();
        await click(getRoot());
        expect(getCombobox()).toHaveAttribute('aria-expanded', 'false');
    });

    it('placeholder、size、validateStatus、borderless 与 disabled 反映在类名上', async () => {
        const { unmount } = setup({ placeholder: '请选择', size: 'large', validateStatus: 'error', borderless: true, defaultOpen: false });
        await settle();
        expect(getRoot()).toHaveClass(`${prefixCls}-large`, `${prefixCls}-error`, `${prefixCls}-borderless`);
        expect(getSelectionText()).toBe('请选择');
        expect(document.querySelector(`.${prefixCls}-selection-placeholder`)).not.toBeNull();
        unmount();
        setup({ disabled: true, size: 'small', validateStatus: 'warning', defaultOpen: false });
        await settle();
        expect(getRoot()).toHaveClass(`${prefixCls}-disabled`, `${prefixCls}-small`, `${prefixCls}-warning`);
        expect(getRoot()).toHaveAttribute('tabindex', '-1');
        expect(getRoot()).toHaveAttribute('aria-disabled', 'true');
    });

    it('dropdownClassName、dropdownStyle 与 optionListStyle', async () => {
        setup({ dropdownClassName: 'my-drop', dropdownStyle: 'color: red', optionListStyle: 'max-height: 100px' });
        await settle();
        expect(getPopover()).toHaveClass('my-drop');
        expect(getPopover()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getTree()).toHaveStyle({ maxHeight: '100px' });
    });

    it('dropdownMatchSelectWidth 控制下拉的最小宽度', async () => {
        const minWidth = () => getPopover()?.closest<HTMLElement>('[popover]')?.style.minWidth;
        const { unmount } = setup();
        await settle();
        expect(minWidth()).toBe('var(--semi-tooltip-trigger-width)');
        unmount();
        setup({ dropdownMatchSelectWidth: false });
        await settle();
        expect(minWidth()).toBe('');
    });

    it('prefix、suffix 与 insetLabel snippet', async () => {
        const { unmount } = setup({ prefix: snippet('<span>前</span>'), suffix: snippet('<span>后</span>'), defaultOpen: false });
        await settle();
        expect(getRoot()).toHaveClass(`${prefixCls}-with-prefix`, `${prefixCls}-with-suffix`);
        expect(getRoot().querySelector(`.${prefixCls}-prefix`)).toHaveTextContent('前');
        expect(getRoot().querySelector(`.${prefixCls}-suffix`)).toHaveTextContent('后');
        unmount();
        setup({ insetLabel: snippet('<span>地区</span>'), insetLabelId: 'inset', 'aria-label': undefined, defaultOpen: false } as TreeSelectProps);
        await settle();
        expect(getRoot().querySelector(`.${prefixCls}-inset-label`)).toHaveAttribute('id', 'inset');
        expect(getCombobox()).toHaveAttribute('aria-labelledby', 'inset');
    });

    it('arrowIcon 与 clearIcon snippet，arrowIcon 为 null 时不渲染箭头', async () => {
        const { unmount } = setup({ arrowIcon: snippet('<i class="my-arrow"></i>'), defaultOpen: false });
        await settle();
        expect(document.querySelector(`.${prefixCls}-arrow .my-arrow`)).not.toBeNull();
        unmount();
        setup({ arrowIcon: null, defaultOpen: false });
        await settle();
        expect(document.querySelector(`.${prefixCls}-arrow`)).toBeNull();
    });

    it('空数据显示语言包的空状态，emptyContent 替换它，null 隐藏它', async () => {
        const { unmount } = setup({ treeData: [] });
        await settle();
        expect(getRowLabels()).toEqual([emptyText]);
        expect(getCombobox()).toHaveAttribute('aria-controls', document.querySelector(`.${treePrefixCls}-option-list`)?.id);
        unmount();
        const second = setup({ treeData: [], emptyContent: snippet('<b>没有数据</b>') });
        await settle();
        expect(getRowLabels()).toEqual(['没有数据']);
        second.unmount();
        setup({ treeData: [], emptyContent: null });
        await settle();
        expect(getRows()).toHaveLength(0);
        expect(document.querySelector(`.${treePrefixCls}-option-list-hidden`)).not.toBeNull();
    });

    it('outerTopSlot 取代下拉搜索框，outerBottomSlot 在树下', async () => {
        setup({ filterTreeNode: true, outerTopSlot: snippet('<p class="top">顶</p>'), outerBottomSlot: snippet('<p class="bottom">底</p>') });
        await settle();
        expect(document.querySelector('.top')).not.toBeNull();
        expect(document.querySelector('.bottom')).not.toBeNull();
        expect(getTree().contains(document.querySelector('.bottom'))).toBe(false);
        expect(document.querySelector(`.${treePrefixCls}-search-wrapper`)).toBeNull();
    });

    it('读取全局默认值', async () => {
        semiGlobal.config.overrideDefaultProps = { TreeSelect: { placeholder: '全局占位', size: 'large' } };
        setup({ defaultOpen: false });
        await settle();
        expect(getSelectionText()).toBe('全局占位');
        expect(getRoot()).toHaveClass(`${prefixCls}-large`);
    });
});

describe('Svelte TreeSelect 单选', () => {
    it('点击节点选中、关闭下拉，并按 onSelect、onChange 通知', async () => {
        const onSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        const onChange = vi.fn<NonNullable<TreeSelectProps['onChange']>>();
        setup({ onSelect, onChange });
        await expand('亚洲');
        await expand('中国');
        await click(getRow('北京'));
        expect(onSelect).toHaveBeenCalledWith('beijing', true, expect.objectContaining({ key: 'beijing' }));
        expect(onChange).toHaveBeenCalledWith('Beijing', expect.objectContaining({ key: 'beijing' }), expect.anything());
        expect(getSelectionText()).toBe('北京');
        expect(getCombobox()).toHaveAttribute('aria-expanded', 'false');
    });

    it('选中已选节点不再发 onChange', async () => {
        const onChange = vi.fn<NonNullable<TreeSelectProps['onChange']>>();
        setup({ onChange, defaultOpen: true }, { value: 'Yazhou' });
        await click(getRow('亚洲'));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('单向 value 作初值，选中项祖先已展开', async () => {
        setup({}, { value: 'Beijing' });
        await settle();
        expect(getSelectionText()).toBe('北京');
        expect(getRowLabels()).toEqual(['亚洲', '中国', '北京', '上海', '日本', '北美洲']);
        expect(getRow('北京')).toHaveClass(`${optionCls}-selected`);
    });

    it('treeNodeLabelProp 与 keyMaps 决定显示的文本', async () => {
        setup({ treeData: [{ name: '甲', value: 'a', key: 'a' }] as TreeNodeData[], treeNodeLabelProp: 'name', defaultOpen: false }, { value: 'a' });
        await settle();
        expect(getSelectionText()).toBe('甲');
    });

    it('value 不在 treeData 中时原样显示', async () => {
        setup({ defaultOpen: false }, { value: 'unknown' });
        await settle();
        expect(getSelectionText()).toBe('unknown');
    });

    it('onChangeWithObject 下 value 与节点都是节点', async () => {
        const onChange = vi.fn<NonNullable<TreeSelectProps['onChange']>>();
        setup({ onChange, onChangeWithObject: true });
        await click(getRow('北美洲'));
        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ key: 'beimeizhou' }), expect.objectContaining({ key: 'beimeizhou' }), expect.anything());
        expect(getSelectionText()).toBe('北美洲');
    });

    it('selectedItem snippet 渲染已选内容', async () => {
        setup({ defaultOpen: false, selectedItem: createRawSnippet((scope: () => TreeSelectSelectedItemSnippetProps) => ({ render: () => `<b>${scope().item.label}!</b>` })) }, { value: 'Beijing' });
        await settle();
        expect(getSelectionText()).toBe('北京!');
    });

    it('showClear：清除时 onChange 的值与节点为 undefined，并发 onClear', async () => {
        const onChange = vi.fn<NonNullable<TreeSelectProps['onChange']>>();
        const onClear = vi.fn<NonNullable<TreeSelectProps['onClear']>>();
        setup({ onChange, onClear, showClear: true, defaultOpen: false }, { value: 'Beijing' });
        await settle();
        await click(getClearButton());
        expect(onChange).toHaveBeenCalledWith(undefined, undefined, expect.anything());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getPopover()).toBeNull();
    });

    it('非受控清除后隐藏清除按钮并显示占位', async () => {
        setup({ showClear: true, placeholder: '请选择', defaultOpen: false });
        await settle();
        expect(getClearButton()).toBeNull();
        await click(getRoot());
        await click(getRow('北美洲'));
        expect(getClearButton()).not.toBeNull();
        await click(getClearButton());
        expect(getClearButton()).toBeNull();
        expect(getSelectionText()).toBe('请选择');
    });

    it('disabled 时点击不打开', async () => {
        setup({ disabled: true, defaultOpen: false });
        await click(getRoot());
        expect(getPopover()).toBeNull();
    });

    it('clickToHide 为 false 时选中后保持打开', async () => {
        setup({ clickToHide: false });
        await click(getRow('北美洲'));
        expect(getCombobox()).toHaveAttribute('aria-expanded', 'true');
        expect(getSelectionText()).toBe('北美洲');
    });

    it('clickTriggerToHide 为 false 时点击触发器不关闭', async () => {
        setup({ clickTriggerToHide: false });
        await click(getRoot());
        expect(getCombobox()).toHaveAttribute('aria-expanded', 'true');
    });

    it('onVisibleChange 随下拉开合通知', async () => {
        const onVisibleChange = vi.fn<NonNullable<TreeSelectProps['onVisibleChange']>>();
        setup({ onVisibleChange, defaultOpen: false });
        await click(getRoot());
        await click(getRoot());
        expect(onVisibleChange.mock.calls.map(([visible]) => visible)).toEqual([true, false]);
    });

    it('onFocus 与 onBlur 各发一次', async () => {
        const onFocus = vi.fn<NonNullable<TreeSelectProps['onFocus']>>();
        const onBlur = vi.fn<NonNullable<TreeSelectProps['onBlur']>>();
        setup({ onFocus, onBlur, defaultOpen: false });
        await click(getRoot());
        expect(onFocus).toHaveBeenCalledTimes(1);
        await click(getRoot());
        expect(onFocus).toHaveBeenCalledTimes(1);
        await fireEvent.mouseDown(document.body);
        await settle();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });
});

describe('Svelte TreeSelect 受控写法', () => {
    it.each(['bind', 'function', 'one-way', 'uncontrolled'] as const)('%s：选中后显示新值，onChange 发一次', async (mode) => {
        const { store } = setup({ defaultExpandAll: true }, { mode, value: mode === 'uncontrolled' ? undefined : 'Meiguo' });
        await settle();
        await click(getRow('加拿大'));
        expect(store.log.filter((entry) => entry.startsWith('change'))).toEqual(['change "Jianada"']);
        expect(getSelectionText()).toBe('加拿大');
        // only a two-way binding hears the write
        expect(store.value).toBe({ bind: 'Jianada', function: 'Jianada', 'one-way': 'Meiguo', uncontrolled: undefined }[mode]);
    });

    it('函数绑定的 setter 拒绝时界面保持原值，onChange 仍通知', async () => {
        const { store } = setup({ defaultExpandAll: true }, { mode: 'function', value: 'Meiguo', accept: false });
        await settle();
        await click(getRow('加拿大'));
        expect(store.log).toContain('set "Jianada"');
        expect(store.value).toBe('Meiguo');
        expect(getSelectionText()).toBe('美国');
    });

    it('bind 的 value 被父级改回 undefined 时清空选择', async () => {
        const { store } = setup({ defaultOpen: false }, { mode: 'bind', value: 'Beijing' });
        await settle();
        expect(getSelectionText()).toBe('北京');
        store.value = undefined;
        await settle();
        expect(getSelectionText()).toBe('');
    });

    it('单向 value 随父级更新', async () => {
        const { store } = setup({ defaultOpen: false }, { mode: 'one-way', value: 'Beijing' });
        await settle();
        store.value = 'Meiguo';
        await settle();
        expect(getSelectionText()).toBe('美国');
    });

    it.each(['bind', 'function', 'one-way', 'uncontrolled'] as const)('%s：展开节点发 onExpand，expandedKeys 写回', async (mode) => {
        const { store } = setup({}, { mode, expandedKeys: mode === 'uncontrolled' ? undefined : [] });
        await settle();
        await expand('亚洲');
        expect(store.log.filter((entry) => entry.startsWith('expand'))).toEqual(['expand yazhou']);
        // a one-way prop is overridden locally; the owner's value stays
        expect(getRowLabels()).toEqual(['亚洲', '中国', '日本', '北美洲']);
        expect(store.expandedKeys).toEqual({ bind: ['yazhou'], function: ['yazhou'], 'one-way': [], uncontrolled: undefined }[mode]);
    });

    it('函数绑定拒绝 expandedKeys 时不展开', async () => {
        const { store } = setup({}, { mode: 'function', expandedKeys: [], accept: false });
        await settle();
        await expand('亚洲');
        expect(store.log).toContain('set keys yazhou');
        expect(getRowLabels()).toEqual(['亚洲', '北美洲']);
    });

    it('非受控的展开状态：连续展开、搜索再清空后，已展开的节点与选中项的祖先仍展开', async () => {
        setup({ filterTreeNode: true }, { value: 'Beijing' });
        await settle();
        await expand('日本');
        await search('美国');
        expect(getRowLabels()).toEqual(['亚洲', '北美洲', '美国', '加拿大']);
        await search('');
        expect(getRowLabels()).toEqual(['亚洲', '中国', '北京', '上海', '日本', '东京', '大阪', '北美洲']);
    });

    describe.each([
        ['单选', { multiple: false }, 'Meiguo', '美国'],
        ['多选', { multiple: true, checkRelation: 'unRelated' as const }, ['Meiguo'], '美国'],
    ])('父级把绑定值改成 undefined：%s', (_name, props, initial, shown) => {
        it('初值由父级给出，改成 undefined 后触发框显示空', async () => {
            const { store } = setup({ ...props, defaultOpen: false, placeholder: '请选择' }, { mode: 'bind', value: initial });
            await settle();
            expect(getSelectionText()).toBe(shown);
            store.value = undefined;
            await settle();
            expect(getSelectionText()).toBe('请选择');
        });

        it('值由组件自己选出后，父级改成 undefined，触发框显示空', async () => {
            const { store } = setup({ ...props, defaultOpen: true, defaultExpandAll: true, placeholder: '请选择' }, { mode: 'bind' });
            await settle();
            await click(getRow('美国'));
            expect(getSelectionText()).toBe(shown);
            expect(store.value).toEqual(initial);
            store.value = undefined;
            await settle();
            expect(getSelectionText()).toBe('请选择');
            // a later pick still works; a single pick closed the dropdown
            if (!getPopover()) await click(getRoot());
            await click(getRow('加拿大'));
            expect(getSelectionText()).toBe('加拿大');
        });
    });
});

describe('Svelte TreeSelect 多选', () => {
    it('related：勾选父节点并以标签显示合并后的值', async () => {
        const onChange = vi.fn<NonNullable<TreeSelectProps['onChange']>>();
        setup({ multiple: true, onChange });
        await click(getRow('北美洲'));
        expect(onChange).toHaveBeenCalledWith(['Beimeizhou'], [expect.objectContaining({ key: 'beimeizhou' })], expect.anything());
        expect(getTagTexts()).toEqual(['北美洲']);
        expect(getCombobox()).toHaveAttribute('aria-expanded', 'true');
        expect(isChecked('北美洲')).toBe(true);
    });

    it('autoMergeValue 为 false 时每个勾选的节点都显示标签', async () => {
        setup({ multiple: true, autoMergeValue: false });
        await click(getRow('北美洲'));
        expect(getTagTexts()).toEqual(['北美洲', '美国', '加拿大']);
    });

    it('leafOnly 只回传叶子', async () => {
        const onChange = vi.fn<NonNullable<TreeSelectProps['onChange']>>();
        setup({ multiple: true, leafOnly: true, onChange });
        await click(getRow('北美洲'));
        expect(onChange.mock.calls[0][0]).toEqual(['Meiguo', 'Jianada']);
        expect(getTagTexts()).toEqual(['美国', '加拿大']);
    });

    it('unRelated：勾选与取消互不影响子节点', async () => {
        setup({ multiple: true, checkRelation: 'unRelated' });
        await click(getRow('北美洲'));
        expect(getTagTexts()).toEqual(['北美洲']);
        await expand('北美洲');
        expect(isChecked('美国')).toBe(false);
        await click(getRow('美国'));
        expect(getTagTexts()).toEqual(['北美洲', '美国']);
        await click(getRow('北美洲'));
        expect(getTagTexts()).toEqual(['美国']);
    });

    it('点击标签的关闭图标：related 下取消该节点及其后代', async () => {
        const onChange = vi.fn<NonNullable<TreeSelectProps['onChange']>>();
        setup({ multiple: true, onChange, defaultOpen: false }, { value: ['Meiguo', 'Jianada'] });
        await settle();
        expect(getTagTexts()).toEqual(['北美洲']);
        await click(getTags()[0].querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
        expect(onChange).toHaveBeenCalledWith([], [], null);
    });

    it('点击标签的关闭图标：unRelated 且 value 与父级双向绑定时，标签随绑定值更新', async () => {
        const { store } = setup({ multiple: true, checkRelation: 'unRelated', defaultOpen: false }, { value: ['Meiguo', 'Jianada'], mode: 'bind' });
        await settle();
        await click(getTags()[0].querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
        expect(store.value).toEqual(['Jianada']);
        expect(getTagTexts()).toEqual(['加拿大']);
    });

    it('禁用节点的标签没有关闭按钮', async () => {
        setup({ multiple: true, treeData: treeDataWithDisabledLeaf, checkRelation: 'unRelated', defaultOpen: false }, { value: ['Beijing', 'Shanghai'] });
        await settle();
        const tags = getTags();
        expect(tags.map((tag) => tag.textContent?.trim())).toEqual(['Beijing', 'Shanghai']);
        expect(tags[0].querySelector(`.${BASE_CLASS_PREFIX}-tag-close`)).toBeNull();
        expect(tags[1].querySelector(`.${BASE_CLASS_PREFIX}-tag-close`)).not.toBeNull();
    });

    it('maxTagCount 超出的标签折叠为 +N', async () => {
        setup({ multiple: true, checkRelation: 'unRelated', maxTagCount: 1, defaultOpen: false }, { value: ['Meiguo', 'Jianada', 'Beijing'] });
        await settle();
        expect(getTagTexts()).toEqual(['美国', '+2']);
    });

    it('无值时显示占位，不显示清除按钮', async () => {
        setup({ multiple: true, placeholder: '请选择', showClear: true, defaultOpen: false });
        await settle();
        expect(getSelectionText()).toBe('请选择');
        expect(getClearButton()).toBeNull();
    });

    it('清除多选：onChange 收到空数组，下拉保持打开', async () => {
        const onChange = vi.fn<NonNullable<TreeSelectProps['onChange']>>();
        setup({ multiple: true, showClear: true, onChange }, { value: ['Meiguo'] });
        await settle();
        await click(getClearButton());
        expect(onChange).toHaveBeenCalledWith([], [], expect.anything());
        expect(getTags()).toHaveLength(0);
        expect(getCombobox()).toHaveAttribute('aria-expanded', 'true');
    });

    it('disableStrictly 时勾选父节点只勾选非禁用后代', async () => {
        const onChange = vi.fn<NonNullable<TreeSelectProps['onChange']>>();
        setup({ multiple: true, treeData: treeDataWithDisabledLeaf, disableStrictly: true, onChange, defaultExpandAll: true });
        await click(getRow('Asia'));
        expect(onChange.mock.calls[0][0]).toEqual(['Shanghai']);
    });

    it('onChangeWithObject 多选：value 与节点都是节点数组', async () => {
        const onChange = vi.fn<NonNullable<TreeSelectProps['onChange']>>();
        setup({ multiple: true, onChangeWithObject: true, onChange });
        await click(getRow('北美洲'));
        const [value, nodes] = onChange.mock.calls[0];
        expect(value).toEqual([expect.objectContaining({ key: 'beimeizhou' })]);
        expect(nodes).toEqual(value);
    });

    it('tag snippet 替换每个标签，selectedItem 渲染标签内容', async () => {
        const { unmount } = setup({ multiple: true, defaultOpen: false, tag: createRawSnippet((scope: () => TreeSelectSelectedItemSnippetProps) => ({ render: () => `<i class="my-tag">${scope().item.label}</i>` })) }, { value: ['Meiguo'] });
        await settle();
        expect(document.querySelectorAll('.my-tag')).toHaveLength(1);
        unmount();
        setup({ multiple: true, defaultOpen: false, selectedItem: createRawSnippet((scope: () => TreeSelectSelectedItemSnippetProps) => ({ render: () => `<b>${scope().item.label}!</b>` })) }, { value: ['Meiguo', 'Jianada'], mode: 'one-way' });
        await settle();
        expect(getTagTexts()).toEqual(['北美洲!']);
    });
});

describe('Svelte TreeSelect 搜索', () => {
    it('filterTreeNode 为 true 时下拉里有搜索框，输入后过滤并高亮', async () => {
        const onSearch = vi.fn<NonNullable<TreeSelectProps['onSearch']>>();
        setup({ filterTreeNode: true, onSearch });
        const input = getSearchInput();
        expect(input).toHaveAccessibleName(locale.filter);
        expect(input).toHaveAttribute('placeholder', locale.searchPlaceholder);
        await search('美国');
        expect(getRowLabels()).toEqual(['亚洲', '北美洲', '美国', '加拿大']);
        expect(onSearch).toHaveBeenCalledWith('美国', ['beimeizhou'], [expect.objectContaining({ key: 'meiguo' })]);
        expect(document.querySelector(`.${optionCls}-highlight`)).not.toBeNull();
    });

    it('showFilteredOnly 只显示匹配项，无结果显示空状态', async () => {
        setup({ filterTreeNode: true, showFilteredOnly: true });
        await search('美国');
        expect(getRowLabels()).toEqual(['北美洲', '美国']);
        await search('不存在');
        expect(getRowLabels()).toEqual([emptyText]);
    });

    it('filterTreeNode 为函数、treeNodeFilterProp 指定字段', async () => {
        const { unmount } = setup({ filterTreeNode: (input: string, text: string) => text.startsWith(input), showFilteredOnly: true });
        await search('Beimeizhou');
        expect(getRowLabels()).toEqual([emptyText]);
        unmount();
        setup({ filterTreeNode: true, treeNodeFilterProp: 'value', showFilteredOnly: true });
        await search('Meiguo');
        expect(getRowLabels()).toEqual(['北美洲', '美国']);
    });

    it('搜索词在关闭后清空', async () => {
        setup({ filterTreeNode: true });
        await search('美国');
        await click(getRoot());
        await click(getRoot());
        expect(getSearchInput()).toHaveValue('');
    });

    it('searchPlaceholder 与 showSearchClear', async () => {
        setup({ filterTreeNode: true, searchPlaceholder: '搜地区', showSearchClear: false });
        expect(getSearchInput()).toHaveAttribute('placeholder', '搜地区');
        await search('x');
        expect(document.querySelector(`.${treePrefixCls}-search-wrapper .${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
    });

    it('remote：只通知 onSearch，不在本地过滤', async () => {
        const onSearch = vi.fn<NonNullable<TreeSelectProps['onSearch']>>();
        setup({ filterTreeNode: true, remote: true, onSearch });
        await search('美国');
        expect(onSearch).toHaveBeenCalledWith('美国', [], []);
        expect(getRowLabels()).toEqual(['亚洲', '北美洲']);
    });

    it('search snippet 为 false 时隐藏搜索框，自定义 snippet 替换搜索框', async () => {
        const { unmount } = setup({ filterTreeNode: true, search: false });
        await settle();
        expect(document.querySelector(`.${treePrefixCls}-search-wrapper`)).toBeNull();
        unmount();
        const search_ = createRawSnippet((scope: () => TreeSelectSearchSnippetProps) => ({
            render: () => '<textarea class="my-search" aria-label="search"></textarea>',
            setup: (node) => {
                node.addEventListener('input', () => scope().onChange((node as HTMLTextAreaElement).value));
            },
        }));
        setup({ filterTreeNode: true, search: search_, showFilteredOnly: true });
        await settle();
        const textarea = document.querySelector<HTMLTextAreaElement>('.my-search') as HTMLTextAreaElement;
        textarea.value = '美国';
        await fireEvent.input(textarea);
        await settle();
        expect(getRowLabels()).toEqual(['北美洲', '美国']);
    });

    it('handle.search 打开下拉并过滤，handle.close 关闭', async () => {
        const { api } = setup({ filterTreeNode: true, showFilteredOnly: true, defaultOpen: false });
        await settle();
        api().search('美国');
        await settle();
        expect(getRowLabels()).toEqual(['北美洲', '美国']);
        api().close();
        await settle();
        expect(getCombobox()).toHaveAttribute('aria-expanded', 'false');
    });

    it('searchPosition 为 trigger：单选时输入框在触发器上，是唯一的 combobox 与 Tab 停靠点', async () => {
        setup({ filterTreeNode: true, searchPosition: 'trigger', defaultOpen: false }, { value: 'Beijing' });
        await settle();
        const input = screen.getByRole('combobox', { name: 'Region' });
        expect(input).toBe(getTriggerInput());
        expect(input).toHaveAttribute('aria-autocomplete', 'list');
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(input).toHaveAccessibleDescription('北京');
        expect(getRoot()).toHaveAttribute('tabindex', '-1');
        expect(getRoot()).not.toHaveAttribute('role');
        await search('京', getTriggerInput());
        expect(input).not.toHaveAttribute('aria-describedby');
        expect(getCombobox()).toHaveAttribute('aria-expanded', 'true');
    });

    it('searchPosition 为 trigger：多选时输入框在标签后，勾选后清空输入并通知', async () => {
        const onSearch = vi.fn<NonNullable<TreeSelectProps['onSearch']>>();
        setup({ multiple: true, filterTreeNode: true, searchPosition: 'trigger', onSearch, showFilteredOnly: true });
        await settle();
        expect(getCombobox()).toBe(getTriggerInput());
        await search('美国', getTriggerInput());
        expect(getRowLabels()).toEqual(['北美洲', '美国']);
        await click(getRow('美国'));
        expect(getRowLabels()).toEqual(['亚洲', '北美洲']);
        expect(onSearch).toHaveBeenLastCalledWith('', [], []);
        expect(getTagTexts()).toEqual(['美国']);
    });

    it('searchPosition 为 trigger：清除同时清空输入与值', async () => {
        const onChange = vi.fn<NonNullable<TreeSelectProps['onChange']>>();
        setup({ filterTreeNode: true, searchPosition: 'trigger', showClear: true, onChange, defaultOpen: false }, { value: 'Beijing' });
        await settle();
        await search('京', getTriggerInput());
        await click(getClearButton());
        expect(onChange).toHaveBeenCalledWith(undefined, undefined, expect.anything());
        expect(getTriggerInput()).toHaveValue('');
    });

    it('trigger snippet 下 class、style 与 data-* 仍落在触发器根元素', async () => {
        setup({ trigger: snippet('<span class="my-trigger"></span>'), class: 'custom', style: 'height: 40px', 'data-x': '1', defaultOpen: false } as TreeSelectProps);
        await settle();
        const root = document.querySelector('.my-trigger')?.parentElement;
        expect(root).toHaveClass('custom');
        expect(root).toHaveStyle({ height: '40px' });
        expect(root).toHaveAttribute('data-x', '1');
    });

    it('trigger snippet 拿到选中的节点，并可清空、搜索与删除', async () => {
        // a raw snippet renders once; the getter it receives stays live
        let scope!: () => TreeSelectTriggerSnippetProps;
        const trigger = createRawSnippet((props: () => TreeSelectTriggerSnippetProps) => {
            scope = props;
            return { render: () => '<span class="my-trigger"></span>' };
        });
        const labels = () => scope().value.map((node) => node.label);
        const { store } = setup({ trigger, multiple: true, filterTreeNode: true, defaultOpen: false, checkRelation: 'unRelated' }, { value: ['Meiguo', 'Jianada'], mode: 'bind' });
        await settle();
        expect(document.querySelector('.my-trigger')).not.toBeNull();
        expect(document.querySelector(`.${prefixCls}-selection`)).toBeNull();
        expect(labels()).toEqual(['美国', '加拿大']);
        scope().onRemove('meiguo');
        await settle();
        expect(store.value).toEqual(['Jianada']);
        expect(labels()).toEqual(['加拿大']);
        scope().onSearch('美');
        await settle();
        expect(scope().inputValue).toBe('美');
        scope().onClear();
        await settle();
        expect(store.value).toEqual([]);
        expect(labels()).toEqual([]);
    });
});

describe('Svelte TreeSelect 展开与加载', () => {
    it('defaultExpandAll 与 expandAll 展开全部', async () => {
        const { unmount } = setup({ defaultExpandAll: true });
        await settle();
        expect(getRows()).toHaveLength(10);
        unmount();
        setup({ expandAll: true });
        await settle();
        expect(getRows()).toHaveLength(10);
    });

    it('点击展开图标发 onExpand，叶子没有展开图标', async () => {
        const onExpand = vi.fn<NonNullable<TreeSelectProps['onExpand']>>();
        setup({ onExpand });
        await expand('亚洲');
        expect(onExpand).toHaveBeenCalledWith(['yazhou'], { expanded: true, node: expect.objectContaining({ key: 'yazhou' }) });
        expect(getRow('中国')).toBeTruthy();
        expect(getRow('中国').querySelector(`.${optionCls}-expand-icon`)).not.toBeNull();
        await expand('中国');
        expect(getRow('北京').querySelector(`.${optionCls}-expand-icon`)).toBeNull();
        expect(getRow('北京').querySelector(`.${optionCls}-empty-icon`)).not.toBeNull();
        await expand('亚洲');
        expect(onExpand).toHaveBeenLastCalledWith(['zhongguo'], { expanded: false, node: expect.objectContaining({ key: 'yazhou' }) });
    });

    it('expandAction 为 click 时点击行即展开', async () => {
        setup({ expandAction: 'click', clickToHide: false });
        await click(getRow('亚洲'));
        expect(getRowLabels()).toContain('中国');
    });

    it('loadData：展开节点时加载，完成后发 onLoad，已加载的不再加载', async () => {
        const loadData = vi.fn<NonNullable<TreeSelectProps['loadData']>>(() => Promise.resolve());
        const onLoad = vi.fn<NonNullable<TreeSelectProps['onLoad']>>();
        setup({ treeData: treeDataWithLoad, loadData, onLoad });
        await expand('Node 1');
        expect(loadData).toHaveBeenCalledTimes(1);
        expect(onLoad).toHaveBeenCalledWith(new Set(['node1']), expect.objectContaining({ key: 'node1' }));
        await expand('Node 1');
        await expand('Node 1');
        expect(loadData).toHaveBeenCalledTimes(1);
    });

    it('loadData 失败后停止加载状态并允许重试', async () => {
        const loadData = vi.fn<NonNullable<TreeSelectProps['loadData']>>().mockRejectedValueOnce(new Error('x')).mockResolvedValue();
        const onRejection = () => {};
        process.on('unhandledRejection', onRejection);
        try {
            setup({ treeData: treeDataWithLoad, loadData });
            await expand('Node 1');
            await settle();
            expect(getRow('Node 1')).not.toHaveAttribute('aria-busy');
            await expand('Node 1');
            await expand('Node 1');
            expect(loadData).toHaveBeenCalledTimes(2);
        } finally {
            await settle();
            process.off('unhandledRejection', onRejection);
        }
    });

    // the fixture spreads its props, so a changed spread also resets an unbound `value` to the parent's undefined
    it('treeData 换成新数组时，选中项保留仍存在的、丢掉已不存在的', async () => {
        const { store } = setup({ defaultOpen: false, defaultExpandAll: true }, { mode: 'bind' });
        await click(getRoot());
        await click(getRow('北京'));
        expect(getSelectionText()).toBe('北京');
        store.props = { treeData: treeData.map((node) => ({ ...node })) };
        await settle();
        expect(getSelectionText()).toBe('北京');
        store.props = { treeData: treeData.slice(1) };
        await settle();
        expect(getSelectionText()).toBe('');
    });

    it('treeData 里没有的受控值在 treeData 晚到时被选中', async () => {
        const { store } = setup({ treeData: [], defaultOpen: false }, { mode: 'one-way', value: 'Beijing' });
        await settle();
        expect(getSelectionText()).toBe('Beijing');
        store.props = { treeData };
        await settle();
        expect(getSelectionText()).toBe('北京');
    });
});

describe('Svelte TreeSelect 键盘与 ARIA', () => {
    it('打开时没有激活行；ArrowDown 激活第一行，End 到末行，Enter 选中并关闭', async () => {
        const onChange = vi.fn<NonNullable<TreeSelectProps['onChange']>>();
        setup({ onChange });
        const combobox = getCombobox();
        await focus(combobox);
        expect(combobox).not.toHaveAttribute('aria-activedescendant');
        await keyDown(combobox, 'ArrowDown');
        expect(activeLabel(combobox)).toBe('亚洲');
        expect(getRow('亚洲')).toHaveClass(`${optionCls}-focused`);
        await keyDown(combobox, 'End');
        await keyDown(combobox, 'Enter');
        expect(onChange).toHaveBeenCalledWith('Beimeizhou', expect.anything(), expect.anything());
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
        expect(combobox).not.toHaveAttribute('aria-activedescendant');
    });

    it('重新打开后不残留上次的激活行', async () => {
        setup();
        const combobox = getCombobox();
        await focus(combobox);
        await keyDown(combobox, 'ArrowDown');
        await keyDown(combobox, 'Escape');
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
        await keyDown(combobox, 'Enter');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        expect(combobox).not.toHaveAttribute('aria-activedescendant');
    });

    it('Right 展开激活行并进入其中，Left 返回并收起', async () => {
        setup();
        const combobox = getCombobox();
        await focus(combobox);
        await keyDown(combobox, 'ArrowDown');
        await keyDown(combobox, 'ArrowRight');
        expect(getRow('亚洲')).toHaveAttribute('aria-expanded', 'true');
        await keyDown(combobox, 'ArrowRight');
        expect(activeLabel(combobox)).toBe('中国');
        await keyDown(combobox, 'ArrowLeft');
        await keyDown(combobox, 'ArrowLeft');
        expect(activeLabel(combobox)).toBe('亚洲');
        expect(getRow('亚洲')).toHaveAttribute('aria-expanded', 'false');
    });

    it('从关闭的 combobox 按 ArrowDown、ArrowUp 打开，Escape 关闭', async () => {
        setup({ defaultOpen: false });
        const combobox = getCombobox();
        await focus(combobox);
        await keyDown(combobox, 'ArrowDown');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        await keyDown(combobox, 'Escape');
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
        await keyDown(combobox, 'ArrowUp');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });

    it('在触发器上输入字符移动到以它开头的下一行', async () => {
        setup({
            treeData: [
                { label: 'alpha', value: 'a', key: 'a' },
                { label: 'north', value: 'n', key: 'n' },
            ],
        });
        const combobox = getCombobox();
        await focus(combobox);
        await keyDown(combobox, 'n');
        expect(activeLabel(combobox)).toBe('north');
    });

    it('下拉搜索框中 Up、Down 移动，Left 留在文本内', async () => {
        setup({ filterTreeNode: true });
        const input = getSearchInput();
        await focus(input);
        await keyDown(input, 'ArrowDown');
        await keyDown(input, 'ArrowDown');
        expect(activeLabel(input)).toBe('北美洲');
        await keyDown(input, 'ArrowLeft');
        expect(activeLabel(input)).toBe('北美洲');
        expect(getRow('亚洲')).toHaveAttribute('aria-expanded', 'false');
    });

    it('多选触发器搜索时，输入框指向激活行，Enter 勾选它', async () => {
        setup({ multiple: true, filterTreeNode: true, searchPosition: 'trigger' });
        const input = getTriggerInput();
        await focus(input);
        await keyDown(input, 'ArrowDown');
        await keyDown(input, 'ArrowDown');
        await keyDown(input, 'Enter');
        expect(activeLabel(input)).toBe('北美洲');
        expect(isChecked('北美洲')).toBe(true);
    });

    it('行的 aria 状态', async () => {
        setup({ multiple: true, defaultExpandAll: true });
        await settle();
        expect(getTree()).toHaveAttribute('aria-multiselectable', 'true');
        const asia = getRow('亚洲');
        expect(asia).toHaveAttribute('role', 'treeitem');
        expect(asia).toHaveAttribute('aria-level', '1');
        expect(asia).toHaveAttribute('aria-setsize', '2');
        expect(asia).toHaveAttribute('aria-posinset', '1');
        expect(asia).toHaveAttribute('aria-expanded', 'true');
        await click(getRow('北京'));
        expect(getRow('北京')).toHaveAttribute('aria-checked', 'true');
        expect(getRow('中国')).toHaveAttribute('aria-checked', 'mixed');
    });

    it('清除按钮是具名原生按钮，Enter 与 Space 按下它而不打开树', async () => {
        const onChange = vi.fn<NonNullable<TreeSelectProps['onChange']>>();
        setup({ showClear: true, defaultOpen: false, onChange }, { value: 'Beijing' });
        await settle();
        const button = screen.getByRole('button', { name: locale.clear });
        expect(button.tagName).toBe('BUTTON');
        button.focus();
        await keyDown(button, 'Enter');
        expect(getPopover()).toBeNull();
    });

    it('aria-labelledby、aria-describedby 等落在 combobox，树沿用名称', async () => {
        setup({ 'aria-labelledby': 'lab', 'aria-label': undefined, 'aria-describedby': 'desc', 'aria-required': true } as TreeSelectProps);
        await settle();
        expect(getCombobox()).toHaveAttribute('aria-labelledby', 'lab');
        expect(getCombobox()).toHaveAttribute('aria-describedby', 'desc');
        expect(getCombobox()).toHaveAttribute('aria-required', 'true');
        expect(getTree()).toHaveAttribute('aria-labelledby', 'lab');
    });

    it('没有名称来源时回落到语言包的 label', async () => {
        setup({ 'aria-label': undefined } as TreeSelectProps);
        await settle();
        expect(getCombobox()).toHaveAttribute('aria-label', locale.label);
    });
});

describe('Svelte TreeSelect 虚拟化', () => {
    it('virtualize 只渲染可视的行', async () => {
        const many = Array.from({ length: 100 }, (_, i) => ({ label: `Node ${i}`, value: `${i}`, key: `${i}` }));
        setup({ treeData: many, virtualize: { height: 120, width: 200, itemSize: 30 } });
        await settle();
        expect(getRows().length).toBeGreaterThan(0);
        expect(getRows().length).toBeLessThan(100);
    });
});
