/** @jsxImportSource vue */
import { defineComponent, h, KeepAlive, ref, type Component, type VNodeChild } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor, within } from '@testing-library/vue';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { render } from '@test/utils/vue';
import Cascader, { type CascaderData, type CascaderDisplaySlotProps, type CascaderEmits, type CascaderFilterItemSlotProps, type CascaderHandle, type CascaderLabelSlotProps, type CascaderSimpleValue, type CascaderTagSlotProps, type CascaderTriggerSlotProps, type CascaderValue } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import Popover from '../../popover';
import Tag from '../../tag';
import Kebab from './fixtures/kebab.vue';
import Stateful from './fixtures/stateful.vue';

const prefixCls = `${BASE_CLASS_PREFIX}-cascader`;
const clearName = en_US.Cascader.clear;

const treeData: CascaderData[] = [
    {
        label: '亚洲',
        value: 'Asia',
        key: 'Asia',
        children: [
            {
                label: '中国',
                value: 'China',
                key: 'China',
                children: [
                    { label: '北京', value: 'Beijing', key: 'beijing' },
                    { label: '上海', value: 'Shanghai', key: 'shanghai' },
                ],
            },
        ],
    },
    {
        label: '北美洲',
        value: 'North America',
        key: 'North America',
        children: [
            { label: '美国', value: 'United States', key: 'United States' },
            { label: '加拿大', value: 'Canada', key: 'Canada' },
        ],
    },
];

const treeDataWithDisabled: CascaderData[] = [
    {
        label: '亚洲',
        value: 'Asia',
        key: 'Asia',
        children: [
            {
                label: '中国',
                value: 'China',
                key: 'China',
                disabled: true,
                children: [
                    { label: '北京', value: 'Beijing', key: 'beijing' },
                    { label: '上海', value: 'Shanghai', key: 'shanghai' },
                ],
            },
            { label: '韩国', value: 'Hanguo', key: 'hanguo' },
        ],
    },
];

// the popup animates; turn it off so tests need no waiting
const commonProps = { motion: false };

type Emits = CascaderEmits<boolean>;
const spy = <K extends keyof Emits>() => vi.fn<(...args: Emits[K]) => void>();
type Slots = Record<string, (scope: never) => VNodeChild>;
// The popup content mounts after the popover opens, a few ticks after the Cascader
const settle = () => new Promise((resolve) => setTimeout(resolve));
// Every render uses a non-Chinese locale; `handle` is the component's exposed handle
async function renderWith<Handle>(component: Component, props: Record<string, unknown> = {}, slots: Slots = {}, provider: Record<string, unknown> = {}) {
    let handle: Handle | undefined;
    const capture = (value: unknown) => {
        if (value) handle = value as Handle;
    };
    // JSX needs a callable or constructible element type, which a plain Component is not
    const Host = (attrs: Record<string, unknown>) => (
        <ConfigProvider locale={en_US} {...provider}>
            {() => h(component, { ...attrs, ref: capture }, slots)}
        </ConfigProvider>
    );
    const view = render(Host, { props });
    await settle();
    return {
        ...view,
        unmount: () => view.unmount(),
        handle: () => handle as Handle,
        rerender: async (next: Record<string, unknown>) => {
            await view.rerender(next);
            await settle();
        },
    };
}
const renderCascader = (props: Record<string, unknown> = {}, slots: Slots = {}) => renderWith<CascaderHandle>(Cascader as Component, { treeData, ...commonProps, ...props }, slots);
const renderStateful = (props: Record<string, unknown> = {}, slots: Slots = {}) => renderWith<{ value: CascaderValue | undefined; data: CascaderData[] }>(Stateful, { initialData: treeData, ...props }, slots);
const act = async (run: () => unknown) => {
    run();
    await settle();
};

const getTrigger = () => document.querySelector(`.${prefixCls}`) as HTMLElement;
const getSelection = () => document.querySelector(`.${prefixCls}-selection`) as HTMLElement;
const getSelectionText = () => getSelection().textContent;
const getSelectionInput = () => getSelection().querySelector('input') as HTMLInputElement;
const getLists = () => document.querySelectorAll<HTMLElement>(`.${prefixCls}-option-list`);
const getListOptions = (listIndex: number) => getLists()[listIndex].querySelectorAll<HTMLElement>(`li.${prefixCls}-option`);
const getOption = (label: string) => screen.getByText(label, { selector: `.${prefixCls}-option-label > span` }).closest('li') as HTMLElement;
const getCheckbox = (label: string) => getOption(label).querySelector(`.${BASE_CLASS_PREFIX}-checkbox`) as HTMLElement;
const getHighlights = () => document.querySelectorAll(`.${prefixCls}-option-label-highlight`);
const getTagTexts = () => Array.from(document.querySelectorAll(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag-content`)).map((node) => node.textContent);
const focus = (element: HTMLElement) => act(() => element.focus());
const click = async (element: Element | null) => {
    await userEvent.click(element as Element);
    await settle();
};
const type = async (text: string, input: HTMLElement = getSelectionInput()) => {
    await userEvent.type(input, text);
    await settle();
};
const keyboard = async (keys: string) => {
    await userEvent.keyboard(keys);
    await settle();
};
const mouseEnter = async (element: Element) => {
    await fireEvent.mouseEnter(element);
    await settle();
};
const activeLabel = (host: Element) => document.getElementById(host.getAttribute('aria-activedescendant') ?? '')?.querySelector(`.${prefixCls}-option-label`)?.textContent;
const isDropdownOpen = () => document.querySelector(`.${prefixCls}-option-lists`) !== null;

const asyncTreeData: CascaderData[] = [
    { label: 'Node1', value: '0-0' },
    { label: 'Node2', value: '0-1' },
    { label: 'Node3', value: '0-2', isLeaf: true },
];

const addChildren = (list: CascaderData[], value: unknown, children: CascaderData[]): CascaderData[] =>
    list.map((node) => {
        if (node.value === value) {
            return { ...node, children };
        }
        return node.children ? { ...node, children: addChildren(node.children, value, children) } : node;
    });

// Like the docs' loadData demo, the loaded children are put into treeData before the promise resolves
const loadTwo = (target: CascaderData, append: (children: CascaderData[]) => void) => {
    if (!target.children) {
        append([
            { label: `${target.label} - 1`, value: `${target.label}-1`, isLeaf: true },
            { label: `${target.label} - 2`, value: `${target.label}-2`, isLeaf: true },
        ]);
    }
    return Promise.resolve();
};

describe('Cascader', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('class 与 style', async () => {
        await renderCascader({ class: 'test', style: { height: '420px' } });
        expect(getTrigger()).toHaveClass('test');
        expect(getTrigger()).toHaveStyle({ height: '420px' });
    });

    it('带 placeholder', async () => {
        await renderCascader({ placeholder: 'semi' });
        expect(document.querySelector(`.${prefixCls}-selection-placeholder`)).toHaveTextContent(/^semi$/);
    });

    it('带 validateStatus', async () => {
        const { rerender } = await renderCascader({});
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-error`);
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-warning`);
        await rerender({ validateStatus: 'error' });
        expect(getTrigger()).toHaveClass(`${prefixCls}-error`);
        await rerender({ validateStatus: 'warning' });
        expect(getTrigger()).toHaveClass(`${prefixCls}-warning`);
    });

    it('不同 size', async () => {
        const { rerender } = await renderCascader({});
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-large`);
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-small`);
        await rerender({ size: 'large' });
        expect(getTrigger()).toHaveClass(`${prefixCls}-large`);
        await rerender({ size: 'small' });
        expect(getTrigger()).toHaveClass(`${prefixCls}-small`);
    });

    it('#prefix、#suffix 与 #insetLabel 插槽', async () => {
        const { unmount } = await renderCascader(
            {},
            {
                prefix: () => <div class="prefix">prefix content</div>,
                suffix: () => <div class="suffix">suffix content</div>,
            }
        );
        expect(document.querySelector(`.${prefixCls}-prefix .prefix`)).toHaveTextContent('prefix content');
        expect(document.querySelector(`.${prefixCls}-suffix .suffix`)).toHaveTextContent('suffix content');
        unmount();
        await renderCascader({}, { insetLabel: () => 'semi' });
        expect(document.querySelector(`.${prefixCls}-inset-label`)).toHaveTextContent(/^semi$/);
        expect(document.querySelector(`.${prefixCls}-inset-label`)).toHaveClass(`${prefixCls}-prefix-text`);
    });

    it('空 data 与 #emptyContent', async () => {
        const { unmount } = await renderCascader({ treeData: [], defaultOpen: true });
        const options = document.querySelectorAll(`.${prefixCls}-option`);
        expect(options).toHaveLength(1);
        expect(options[0]).toHaveClass(`${prefixCls}-option-empty`);
        expect(options[0]).toHaveTextContent(en_US.Cascader.emptyText);
        unmount();
        await renderCascader({ treeData: [], defaultOpen: true }, { emptyContent: () => 'test' });
        expect(document.querySelectorAll(`.${prefixCls}-option`)[0].textContent).toEqual('test');
    });

    it('多选且非受控模式下动态变化的 treeData', async () => {
        const { rerender } = await renderCascader({ defaultValue: 'Asia', multiple: true });
        expect(getTagTexts()).toEqual(['亚洲']);
        await rerender({ treeData: treeDataWithDisabled });
        expect(getTagTexts()).toEqual(['亚洲']);
    });

    it('多选受控 modelValue 变回 undefined 时清空，有 defaultValue 也一样', async () => {
        const { rerender } = await renderCascader({ defaultValue: 'Europe', modelValue: 'Asia', multiple: true });
        expect(getTagTexts()).toEqual(['亚洲']);
        await rerender({ modelValue: undefined });
        expect(getTagTexts()).toEqual([]);
    });

    it('多选且受控模式下动态变化的 treeData', async () => {
        const { rerender } = await renderCascader({ modelValue: 'Asia', multiple: true });
        expect(getTagTexts()).toEqual(['亚洲']);
        await rerender({ treeData: treeDataWithDisabled });
        expect(getTagTexts()).toEqual(['亚洲']);
    });

    it('defaultOpen', async () => {
        await renderCascader({ defaultOpen: true });
        expect(document.querySelectorAll(`.${prefixCls}-option-lists`)).toHaveLength(1);
        expect(getLists()).toHaveLength(1);
    });

    // jsdom has no layout: only the CSS wiring is checked, the browser resolves `--semi-tooltip-trigger-width` to the trigger
    it('空数据时下拉最小宽度跟随触发器', async () => {
        const wrapper = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-popover-wrapper`) as HTMLElement;
        const { rerender } = await renderCascader({ defaultOpen: true, treeData: [] });
        expect(wrapper().style.minWidth).toBe('var(--semi-tooltip-trigger-width)');
        await rerender({ treeData });
        expect(wrapper().style.minWidth).toBe('');
    });

    it('自定义 dropdownClassName 与 dropdownStyle', async () => {
        await renderCascader({ dropdownClassName: 'test', dropdownStyle: { color: 'red' }, defaultOpen: true });
        const dropdown = document.querySelector(`.${prefixCls}-popover`);
        expect(dropdown).toHaveClass('test');
        expect(dropdown).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('defaultValue', async () => {
        await renderCascader({ defaultValue: ['Asia', 'China', 'Beijing'], defaultOpen: true });
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 北京');
        expect(getLists()).toHaveLength(3);
        const activeItems = document.querySelectorAll(`.${prefixCls}-option-active`);
        expect(Array.from(activeItems).map((item) => item.textContent)).toEqual(['亚洲', '中国']);
        const selectItem = document.querySelectorAll(`.${prefixCls}-option-select`);
        expect(selectItem).toHaveLength(1);
        expect(selectItem[0].textContent).toEqual('北京');
        expect(selectItem[0].querySelectorAll(`.${BASE_CLASS_PREFIX}-icon`)).toHaveLength(1);
    });

    it('displayProp', async () => {
        await renderCascader({ defaultValue: ['Asia', 'China', 'Beijing'], displayProp: 'value' });
        expect(getSelectionText()).toEqual('Asia / China / Beijing');
    });

    it('#display 插槽', async () => {
        const display = vi.fn<(scope: CascaderDisplaySlotProps) => VNodeChild>(() => undefined);
        const { unmount } = await renderCascader({ defaultValue: ['Asia', 'China', 'Beijing'] }, { display });
        expect(display).toHaveBeenCalledWith({
            labels: ['亚洲', '中国', '北京'],
            path: [treeData[0], treeData[0].children?.[0], treeData[0].children?.[0].children?.[0]],
        });
        unmount();

        await renderCascader({ defaultValue: ['Asia', 'China', 'Beijing'] }, { display: ({ labels }: CascaderDisplaySlotProps) => `已选择：${labels.join(' -> ')}` });
        expect(getSelectionText()).toEqual('已选择：亚洲 -> 中国 -> 北京');
    });

    it('不可搜索的单选模式下 #display 用 path 渲染带标记的路径', async () => {
        const markup = (node: CascaderSimpleValue) => {
            if (typeof node !== 'object') return String(node);
            if (node.value === 'Asia') return <strong>{node.label}</strong>;
            if (node.value === 'Shanghai') return <div>{node.label}</div>;
            if (node.value === 'North America') return <p>{node.label}</p>;
            return String(node.label);
        };
        const displayWith =
            (separator: string) =>
            ({ path }: CascaderDisplaySlotProps) =>
                path.flatMap((node, index) => (index ? [separator, markup(node)] : [markup(node)]));
        const span = () => getSelection().querySelector('span') as HTMLElement;
        const { unmount } = await renderCascader({ defaultValue: ['Asia', 'China', 'Shanghai'] }, { display: displayWith(' / ') });
        expect(span().querySelector('strong')?.textContent).toEqual('亚洲');
        expect(span().querySelector('div')?.textContent).toEqual('上海');
        expect(span().textContent).toEqual('亚洲 / 中国 / 上海');
        unmount();

        const { unmount: unmount2 } = await renderCascader({ defaultValue: ['North America'], changeOnSelect: true }, { display: displayWith(' / ') });
        expect(span().querySelector('p')?.textContent).toEqual('北美洲');
        expect(span().textContent).toEqual('北美洲');
        unmount2();

        await renderCascader({ defaultValue: ['Asia', 'China', 'Shanghai'], separator: ' - ' }, { display: displayWith(' - ') });
        expect(span().querySelector('strong')?.textContent).toEqual('亚洲');
        expect(span().textContent).toEqual('亚洲 - 中国 - 上海');
    });

    it('disabled', async () => {
        await renderCascader({ disabled: true });
        expect(getTrigger()).toHaveClass(`${prefixCls}-disabled`);
        await click(getSelection());
        expect(isDropdownOpen()).toBe(false);
    });

    it('disabled + defaultValue', async () => {
        const { unmount } = await renderCascader({
            treeData: treeDataWithDisabled,
            changeOnSelect: true,
            defaultValue: ['Asia', 'China'],
        });
        expect(getSelection().querySelector('span')?.textContent).toEqual('亚洲 / 中国');
        unmount();

        const { unmount: unmount2 } = await renderCascader({
            treeData: treeDataWithDisabled,
            changeOnSelect: true,
            filterTreeNode: true,
            defaultValue: ['Asia', 'China'],
        });
        expect(document.querySelector(`.${prefixCls}-search-wrapper span`)?.textContent).toEqual('亚洲 / 中国');
        unmount2();

        const { unmount: unmount3 } = await renderCascader({
            treeData: treeDataWithDisabled,
            changeOnSelect: true,
            modelValue: ['Asia', 'China'],
        });
        expect(getSelection().querySelector('span')?.textContent).toEqual('亚洲 / 中国');
        unmount3();

        const { unmount: unmount4 } = await renderCascader({
            treeData: treeDataWithDisabled,
            multiple: true,
            defaultValue: ['Asia', 'China'],
        });
        expect(getTagTexts()[0]).toEqual('中国');
        unmount4();

        const { unmount: unmount5 } = await renderCascader({
            treeData: treeDataWithDisabled,
            multiple: true,
            filterTreeNode: true,
            defaultValue: ['Asia', 'China'],
        });
        expect(getTagTexts()[0]).toEqual('中国');
        unmount5();

        await renderCascader({ treeData: treeDataWithDisabled, multiple: true, modelValue: ['Asia', 'China'] });
        expect(getTagTexts()[0]).toEqual('中国');
    });

    it('选中选项、select 与 change 事件', async () => {
        const onSelect = spy<'select'>();
        const onChange = spy<'change'>();
        await renderCascader({ defaultOpen: true, onSelect, onChange });
        expect(getLists()).toHaveLength(1);
        await click(getListOptions(0)[0]);

        expect(getLists()).toHaveLength(2);
        expect(onSelect).not.toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
        expect(getListOptions(0)[0]).toHaveClass(`${prefixCls}-option-active`);

        await click(getListOptions(1)[0]);
        expect(getLists()).toHaveLength(3);
        expect(onSelect).not.toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
        expect(getListOptions(1)[0]).toHaveClass(`${prefixCls}-option-active`);

        await click(getListOptions(2)[0]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('Beijing');
        expect(onChange).toHaveBeenCalledWith(['Asia', 'China', 'Beijing']);
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 北京');

        expect(isDropdownOpen()).toBe(false);
        await click(getSelection());
        expect(getListOptions(2)[0].querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-tick`)).toHaveLength(1);
    });

    it('filterTreeNode 为 true 时显示输入框', async () => {
        await renderCascader({ filterTreeNode: true, searchPlaceholder: 'placeholder' });
        const searchWrapper = document.querySelector(`.${prefixCls}-search-wrapper`);
        expect(searchWrapper).not.toBeNull();
        expect(searchWrapper?.querySelector('span')?.textContent).toEqual('placeholder');
    });

    it('search 事件', async () => {
        const onSearch = spy<'search'>();
        await renderCascader({ filterTreeNode: true, onSearch });
        await click(getTrigger());
        expect(getSelectionInput()).toHaveFocus();
        await userEvent.paste('semi');
        await settle();
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('semi');
    });

    it('select 事件与 changeOnSelect', async () => {
        const onSelect = spy<'select'>();
        const onChange = spy<'change'>();
        await renderCascader({ defaultOpen: true, onSelect, onChange, changeOnSelect: true });
        await click(getListOptions(0)[0]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('Asia');
        expect(onChange).toHaveBeenCalledWith(['Asia']);
        expect(getListOptions(0)[0]).toHaveClass(`${prefixCls}-option-select`);
        expect(getSelectionText()).toEqual('亚洲');

        await click(getListOptions(1)[0]);
        expect(onSelect).toHaveBeenLastCalledWith('China');
        expect(onChange).toHaveBeenLastCalledWith(['Asia', 'China']);
        expect(getListOptions(0)[0]).toHaveClass(`${prefixCls}-option-active`);
        expect(getListOptions(1)[0]).toHaveClass(`${prefixCls}-option-select`);
        expect(getSelectionText()).toEqual('亚洲 / 中国');
    });

    it('filterTreeNode 显示正确的结果', async () => {
        await renderCascader({ filterTreeNode: true, defaultOpen: true });
        await type('北');
        expect(getHighlights()).toHaveLength(3);
    });

    it('搜索结果即时渲染，aria-activedescendant 指向已渲染的选项', async () => {
        await renderCascader({ filterTreeNode: true, defaultOpen: true });
        const input = getSelectionInput();
        await focus(input);
        await fireEvent.update(input, '北');
        await settle();
        expect(input).toHaveValue('北');
        expect(getHighlights()).toHaveLength(3);
        await keyboard('{ArrowDown}');
        const active = document.getElementById(input.getAttribute('aria-activedescendant') ?? '');
        expect(active).not.toBeNull();
        expect(document.querySelector(`.${prefixCls}-option-lists`)).toContainElement(active);
    });

    it('filterTreeNode 与 treeNodeFilterProp', async () => {
        await renderCascader({ filterTreeNode: true, treeNodeFilterProp: 'value', defaultOpen: true });
        await type('Bei');
        expect(getHighlights()).toHaveLength(1);
        expect(getHighlights()[0].textContent).toEqual('Bei');
    });

    it('filterTreeNode 无结果', async () => {
        await renderCascader({ filterTreeNode: true, defaultOpen: true }, { emptyContent: () => 'test' });
        await type('Bei');
        const options = document.querySelectorAll(`.${prefixCls}-option`);
        expect(options).toHaveLength(1);
        expect(options[0]).toHaveClass(`${prefixCls}-option-empty`);
        expect(options[0].textContent).toEqual('test');
    });

    it('filterTreeNode 为函数', async () => {
        const filterTreeNode = vi.fn<(inputValue: string, cascaderNode: string) => boolean>((inputValue, cascaderNode) => cascaderNode === inputValue);
        await renderCascader({ filterTreeNode, defaultOpen: true });
        await type('北');
        expect(filterTreeNode).toHaveBeenCalled();
        expect(getHighlights()).toHaveLength(0);
        expect(document.querySelector(`.${prefixCls}-option-empty`)).not.toBeNull();
    });

    it('受控：modelValue 显示正确', async () => {
        await renderCascader({ modelValue: ['Asia', 'China', 'Beijing'] });
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 北京');
    });

    it('单向绑定：发出 change 且显示不变', async () => {
        const onChange = spy<'change'>();
        await renderCascader({
            modelValue: ['Asia', 'China', 'Beijing'],
            defaultOpen: true,
            onChange,
            changeOnSelect: true,
        });
        await click(getListOptions(0)[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['Asia']);
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 北京');
    });

    it('异步加载数据', async () => {
        const then = vi.fn<() => Promise<void>>(() => Promise.resolve());
        // a thenable on purpose: loadData's return value must be handled by the Promise protocol
        const loadData = vi.fn<() => { then: typeof then }>(() => ({ then }));
        const data = { label: '亚洲', value: 'Asia' };
        await renderCascader({ loadData, defaultOpen: true, treeData: [data] });
        await click(getOption('亚洲'));
        expect(loadData).toHaveBeenCalledWith([data]);
        expect(then).toHaveBeenCalled();
        expect(getOption('亚洲').querySelector(`.${prefixCls}-option-spin-icon`)).not.toBeNull();
    });

    it.each([
        ['单选', { modelValue: ['Asia', 'China', 'Beijing'] }, { modelValue: [] }],
        ['可搜索多选', { multiple: true, filterTreeNode: true, modelValue: [['Asia', 'China', 'Beijing']] }, { multiple: true, filterTreeNode: true, modelValue: [] }],
    ])('%s：清除按钮持焦时值被外部清空，焦点回到 combobox', async (_, before, after) => {
        const { rerender } = await renderCascader({ showClear: true, ...before });
        await focus(screen.getByRole('button', { name: clearName }));
        await rerender({ treeData, ...commonProps, showClear: true, ...after });
        expect(screen.getByRole('combobox')).toHaveFocus();
    });

    it('加载中的选项名称不含加载图标的文字，并带 aria-busy', async () => {
        const loadData = vi.fn<() => Promise<void>>(() => new Promise<void>(() => {}));
        await renderCascader({ treeData: asyncTreeData, loadData, defaultOpen: true });
        await click(getOption('Node1'));
        expect(screen.getByRole('treeitem', { name: 'Node1' })).toHaveAttribute('aria-busy', 'true');
        expect(screen.getByRole('treeitem', { name: 'Node2' })).not.toHaveAttribute('aria-busy');
    });

    it('选中选项与 changeWithObject', async () => {
        const onChange = spy<'change'>();
        await renderCascader({ defaultOpen: true, onChange, changeWithObject: true });
        await click(getListOptions(0)[0]);
        await click(getListOptions(1)[0]);
        await click(getListOptions(2)[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        const asia = treeData[0];
        const china = asia.children?.[0];
        const beijing = china?.children?.[0];
        expect(onChange).toHaveBeenCalledWith([asia, china, beijing]);
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 北京');
        await click(getSelection());
        expect(getListOptions(2)[0].querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-tick`)).toHaveLength(1);
    });

    it('选中选项、changeWithObject 与 changeOnSelect', async () => {
        const onChange = spy<'change'>();
        await renderCascader({ defaultOpen: true, onChange, changeWithObject: true, changeOnSelect: true });
        await click(getListOptions(0)[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith([treeData[0]]);
        expect(getListOptions(0)[0]).toHaveClass(`${prefixCls}-option-select`);
        expect(getSelectionText()).toEqual('亚洲');
    });

    it('受控：changeWithObject 的节点路径显示正确', async () => {
        const asia = treeData[0];
        const china = asia.children?.[0];
        const beijing = china?.children?.[0];
        await renderCascader({ modelValue: [asia, china, beijing], changeWithObject: true });
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 北京');
    });

    it('clear 事件与 showClear', async () => {
        const onClear = spy<'clear'>();
        await renderCascader({
            defaultValue: ['Asia', 'China', 'Beijing'],
            showClear: true,
            onClear,
            placeholder: '请选择所在地区',
        });
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 北京');
        await click(document.querySelector(`.${prefixCls}-clearbtn`));
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getSelectionText()).toEqual('请选择所在地区');
    });

    it.each(['{Enter}', ' '])('清除按钮是具名的原生 button，按 %j 清除且不打开树', async (key) => {
        const onClear = spy<'clear'>();
        await renderCascader({
            defaultValue: ['Asia', 'China', 'Beijing'],
            showClear: true,
            placeholder: 'pick',
            onClear,
        });
        await userEvent.tab();
        expect(getTrigger()).toHaveFocus();
        await userEvent.tab();
        const clear = screen.getByRole('button', { name: clearName });
        expect(clear).toHaveFocus();
        expect(clear).toHaveAttribute('type', 'button');
        await keyboard(key);
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getSelectionText()).toEqual('pick');
        expect(screen.queryByRole('button', { name: clearName })).toBeNull();
        expect(getTrigger()).toHaveFocus();
        expect(isDropdownOpen()).toBe(false);
    });

    it('树展开时在清除按钮上按 Enter 仍会清除', async () => {
        await renderCascader({ defaultValue: ['Asia', 'China', 'Beijing'], showClear: true, placeholder: 'pick' });
        await userEvent.tab();
        await keyboard('{Enter}');
        expect(isDropdownOpen()).toBe(true);
        await userEvent.tab();
        expect(screen.getByRole('button', { name: clearName })).toHaveFocus();
        await keyboard('{Enter}');
        expect(getSelectionText()).toEqual('pick');
        expect(getTrigger()).toHaveFocus();
    });

    it('搜索输入框作为 combobox 时，清除后焦点回到输入框', async () => {
        await renderCascader({
            defaultValue: [['Asia', 'China', 'Beijing']],
            multiple: true,
            filterTreeNode: true,
            showClear: true,
        });
        const input = screen.getByRole('combobox');
        expect(input.tagName).toBe('INPUT');
        await focus(input);
        await userEvent.tab();
        expect(screen.getByRole('button', { name: clearName })).toHaveFocus();
        await keyboard('{Enter}');
        expect(getTagTexts()).toEqual([]);
        expect(input).toHaveFocus();
    });

    it('filterLeafOnly 为 false', async () => {
        await renderCascader({ filterTreeNode: true, defaultOpen: true, filterLeafOnly: false });
        await type('亚');
        expect(getHighlights()).toHaveLength(4);
    });

    it('showNext', async () => {
        const { unmount } = await renderCascader({ showNext: 'hover' });
        await click(getSelection());
        expect(getLists()).toHaveLength(1);
        await mouseEnter(getListOptions(0)[0]);
        expect(getLists()).toHaveLength(2);
        unmount();

        await renderCascader({ showNext: 'click' });
        await click(getSelection());
        expect(getLists()).toHaveLength(1);
        await mouseEnter(getListOptions(0)[0]);
        expect(getLists()).toHaveLength(1);
        await click(getListOptions(0)[0]);
        expect(getLists()).toHaveLength(2);
    });

    it('disableStrictly', async () => {
        const onChange = spy<'change'>();
        const { unmount } = await renderCascader({
            showNext: 'hover',
            treeData: treeDataWithDisabled,
            disableStrictly: true,
            multiple: true,
            onChange,
        });
        expect(getTagTexts()).toEqual([]);
        await click(getSelection());
        await mouseEnter(getOption('亚洲'));
        expect(getCheckbox('中国')).toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-disabled`);
        await click(getCheckbox('亚洲'));
        expect(onChange).toHaveBeenLastCalledWith([['Asia', 'Hanguo']]);
        expect(getTagTexts()).toEqual(['韩国']);
        expect(getCheckbox('亚洲')).toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-indeterminate`);
        unmount();

        const onChange2 = spy<'change'>();
        await renderCascader({
            showNext: 'hover',
            treeData: treeDataWithDisabled,
            multiple: true,
            onChange: onChange2,
        });
        expect(getTagTexts()).toEqual([]);
        await click(getSelection());
        await click(getCheckbox('亚洲'));
        expect(onChange2).toHaveBeenLastCalledWith([['Asia']]);
        expect(getTagTexts()).toEqual(['亚洲']);
        expect(getCheckbox('亚洲')).toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-checked`);
    });

    it('多选与 changeWithObject', async () => {
        const northAmerica = treeData[1];
        await renderCascader({
            multiple: true,
            changeWithObject: true,
            defaultValue: [northAmerica, northAmerica.children?.[0]],
        });
        expect(getTagTexts()).toEqual(['美国']);
    });

    const leafClickTree: CascaderData[] = [
        {
            label: '北美洲',
            value: 'North America',
            key: 'North America',
            children: [
                { label: '美国', value: 'United States', key: 'United States' },
                { label: '加拿大', value: 'Canada', key: 'Canada' },
            ],
        },
        { label: '南美洲', value: 'Nanmeiguo', key: 'Nanmeiguo' },
    ];

    it('多选 enableLeafClick', async () => {
        const onChange = spy<'change'>();
        await renderCascader({ multiple: true, enableLeafClick: true, onChange, treeData: leafClickTree });
        await click(getSelection());
        await click(getCheckbox('南美洲'));
        expect(getTagTexts()).toEqual(['南美洲']);
        await click(getOption('南美洲'));
        expect(getTagTexts()).toEqual([]);
        expect(onChange).toHaveBeenLastCalledWith([]);
        await click(getOption('北美洲'));
        await click(getOption('美国'));
        expect(getTagTexts()).toEqual(['美国']);
        expect(onChange).toHaveBeenLastCalledWith([['North America', 'United States']]);
    });

    it('多选不开 enableLeafClick', async () => {
        await renderCascader({ multiple: true, treeData: leafClickTree });
        await click(getSelection());
        await click(getCheckbox('南美洲'));
        expect(getTagTexts()).toEqual(['南美洲']);
        await click(getOption('南美洲'));
        expect(getTagTexts()).toEqual(['南美洲']);
    });

    it('separator', async () => {
        await renderCascader({
            filterTreeNode: true,
            defaultValue: ['Asia', 'China', 'Beijing'],
            separator: ' > ',
            defaultOpen: true,
        });
        expect(getSelection().querySelector('span')?.textContent).toEqual('亚洲 > 中国 > 北京');
        await type('中国');
        expect(document.querySelectorAll(`.${prefixCls}-option-list li`)[0].textContent).toEqual('亚洲 > 中国 > 北京');
    });

    it('handle 的 search 方法在 searchPosition 为 custom 时', async () => {
        const { handle } = await renderCascader({ filterTreeNode: true, searchPosition: 'custom', defaultOpen: true });
        await act(() => handle().search('北京'));
        expect(getHighlights()[0].textContent).toEqual('北京');
        expect(document.querySelectorAll(`.${prefixCls}-option-list li`)[0].textContent).toEqual('亚洲 / 中国 / 北京');
    });

    it('#trigger 插槽的 value 是位置集合', async () => {
        const trigger = vi.fn<(scope: CascaderTriggerSlotProps<true>) => VNodeChild>(() => <span>123</span>);
        const { unmount } = await renderCascader({ multiple: true, defaultValue: 'Asia' }, { trigger });
        await click(screen.getByText('123'));
        expect(isDropdownOpen()).toBe(true);
        expect(trigger.mock.lastCall?.[0].value).toEqual(new Set(['0']));
        unmount();

        const trigger2 = vi.fn<(scope: CascaderTriggerSlotProps<true>) => VNodeChild>(() => <span>123</span>);
        await renderCascader({ multiple: true, defaultValue: 'Asia', autoMergeValue: false }, { trigger: trigger2 });
        await click(screen.getByText('123'));
        expect(trigger2.mock.lastCall?.[0].value).toEqual(new Set(['0', '0-0', '0-0-1', '0-0-0']));
    });

    it('autoMergeValue', async () => {
        const { unmount } = await renderCascader({ multiple: true, autoMergeValue: false, defaultValue: 'Asia' });
        expect(getTagTexts()).toEqual(['亚洲', '中国', '北京', '上海']);
        unmount();

        await renderCascader({ multiple: true, autoMergeValue: true, defaultValue: 'Asia' });
        expect(getTagTexts()).toEqual(['亚洲']);
    });

    it.each([
        [false, false, ['亚洲', '中国', '北京', '上海']],
        [true, true, ['北京', '上海']],
        [false, true, ['北京', '上海']],
        [true, false, ['亚洲']],
    ])('autoMergeValue 为 %s、leafOnly 为 %s', async (autoMergeValue, leafOnly, tags) => {
        await renderCascader({ multiple: true, autoMergeValue, leafOnly, defaultValue: 'Asia' });
        expect(getTagTexts()).toEqual(tags);
    });

    it('handle 的 open 与 close', async () => {
        const { handle } = await renderCascader({ multiple: true });
        await act(() => handle().open());
        expect(isDropdownOpen()).toBe(true);
        await act(() => handle().close());
        expect(isDropdownOpen()).toBe(false);
    });

    it('autoMergeValue 为 false 且 modelValue 为 []', async () => {
        await renderCascader({
            multiple: true,
            autoMergeValue: false,
            modelValue: [],
            placeholder: 'autoMergeValue 为 false',
        });
        expect(document.querySelector(`.${prefixCls}-selection-placeholder`)?.textContent).toEqual('autoMergeValue 为 false');
    });

    it('modelValue 不在 treeData 中', async () => {
        await renderCascader({
            multiple: true,
            modelValue: ['value', 'notIn', 'treeData'],
            placeholder: 'value not in treeData, show placeholder',
            autoMergeValue: false,
            filterTreeNode: true,
        });
        expect(getSelectionInput()).toHaveAttribute('placeholder', 'value not in treeData, show placeholder');
        expect(getTagTexts()).toEqual([]);
    });

    it('单选值不在 treeData 中时 #display 的 path 是原始值路径', async () => {
        const display = vi.fn<(scope: CascaderDisplaySlotProps) => VNodeChild>(({ path }) => path.map((item) => (typeof item === 'object' ? item.label : item)).join('/'));
        await renderCascader({ modelValue: ['Asia', 'Atlantis'] }, { display });
        expect(display).toHaveBeenCalledWith({ labels: ['Asia', 'Atlantis'], path: ['Asia', 'Atlantis'] });
        expect(getSelectionText()).toEqual('Asia/Atlantis');
    });

    it('focus 事件', async () => {
        const onFocus = spy<'focus'>();
        await renderCascader({ onFocus });
        await click(getSelection());
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('blur 事件', async () => {
        const onBlur = spy<'blur'>();
        await renderCascader({ onBlur });
        await click(getSelection());
        expect(onBlur).not.toHaveBeenCalled();
        await click(document.body);
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(isDropdownOpen()).toBe(false);
    });

    it('max', async () => {
        await renderCascader({ multiple: true, max: 1 });
        await click(getSelection());
        await click(getOption('亚洲'));
        await click(getOption('中国'));
        await click(getCheckbox('北京'));
        expect(getTagTexts()).toEqual(['北京']);
        await click(getOption('北美洲'));
        await click(getCheckbox('美国'));
        expect(getTagTexts()).toEqual(['北京']);
        expect(getCheckbox('美国')).not.toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-checked`);
    });

    it('exceed 事件', async () => {
        const onExceed = spy<'exceed'>();
        await renderCascader({ multiple: true, max: 1, onExceed });
        await click(getSelection());
        await click(getOption('北美洲'));
        await click(getCheckbox('美国'));
        expect(onExceed).not.toHaveBeenCalled();
        await click(getCheckbox('加拿大'));
        expect(onExceed).not.toHaveBeenCalled();
        expect(getTagTexts()).toEqual(['北美洲']);
        await click(getCheckbox('亚洲'));
        expect(onExceed).toHaveBeenCalledTimes(1);
        const exceeded = onExceed.mock.calls[0][0].map((entity) => entity.data.value);
        expect(exceeded).toHaveLength(2);
        expect(exceeded).toEqual(expect.arrayContaining(['North America', 'Asia']));
        expect(getTagTexts()).toEqual(['北美洲']);
    });

    it('maxTagCount', async () => {
        await renderCascader({
            multiple: true,
            maxTagCount: 1,
            defaultValue: [
                ['Asia', 'China', 'Beijing'],
                ['Asia', 'China', 'Shanghai'],
            ],
            autoMergeValue: false,
        });
        expect(getTagTexts()).toEqual(['北京']);
        expect(document.querySelector(`.${prefixCls}-selection-n`)).toHaveTextContent('+3');
    });

    it('borderless', async () => {
        await renderCascader({ borderless: true });
        expect(getTrigger()).toHaveClass(`${prefixCls}-borderless`);
    });

    it('#arrowIcon 插槽，空插槽隐藏箭头', async () => {
        const { unmount } = await renderCascader({}, { arrowIcon: () => <span class="custom-arrow">arrow</span> });
        expect(document.querySelector(`.${prefixCls}-arrow .custom-arrow`)).toHaveTextContent('arrow');
        unmount();
        await renderCascader({}, { arrowIcon: () => [] });
        expect(document.querySelector(`.${prefixCls}-arrow`)).toBeNull();
    });

    it('清除按钮渲染在箭头之前，悬停与聚焦时由样式切换', async () => {
        await renderCascader({ showClear: true, defaultValue: ['Asia', 'China', 'Beijing'] }, { arrowIcon: () => <span class="custom-arrow">arrow</span> });
        const clear = screen.getByRole('button', { name: clearName });
        expect(clear.compareDocumentPosition(document.querySelector('.custom-arrow') as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('选择区域的 Enter keydown', async () => {
        await renderCascader({ defaultValue: ['Asia', 'China', 'Beijing'] });
        await fireEvent.keyDown(getTrigger(), { key: 'Enter', code: 'Enter' });
        await settle();
        expect(isDropdownOpen()).toBe(true);
        expect(getLists()).toHaveLength(3);
    });

    it('点击选择区域开关下拉', async () => {
        await renderCascader({ defaultValue: ['Asia', 'China', 'Beijing'] });
        await click(getTrigger());
        expect(isDropdownOpen()).toBe(true);
        expect(getTrigger()).toHaveClass(`${prefixCls}-focus`);
        await click(getTrigger());
        expect(isDropdownOpen()).toBe(false);
    });

    it('handle 的 focus 与 blur', async () => {
        const { handle } = await renderCascader();
        await act(() => handle().focus());
        // the focus ring comes from :focus; the class marks only the open state
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-focus`);
        expect(getTrigger()).toHaveFocus();
        await act(() => handle().blur());
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-focus`);
        expect(getTrigger()).not.toHaveFocus();
    });

    it('handle 的 open 与 close 发出 dropdownVisibleChange', async () => {
        const onDropdownVisibleChange = spy<'dropdownVisibleChange'>();
        const { handle } = await renderCascader({ onDropdownVisibleChange });
        await act(() => handle().open());
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(true);
        expect(getLists()).toHaveLength(1);
        await act(() => handle().close());
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        expect(isDropdownOpen()).toBe(false);
    });

    it('多选有选中项时选择区加 -selection-multiple', async () => {
        await renderCascader({ multiple: true, defaultValue: [['Asia', 'China', 'Beijing']], autoMergeValue: false });
        expect(getSelection()).toHaveClass(`${prefixCls}-selection-multiple`);
        expect(getTagTexts()).toEqual(['北京']);
    });

    it('#trigger 插槽替换触发器内容', async () => {
        await renderCascader(
            { defaultValue: ['Asia', 'China', 'Beijing'] },
            {
                trigger: ({ value }: CascaderTriggerSlotProps) => <div class="custom-trigger">{`Custom: ${value}`}</div>,
            }
        );
        expect(document.querySelector('.custom-trigger')).toHaveTextContent('Custom: 0-0-0');
        expect(getSelection()).toBeNull();
    });

    it('listScroll 事件', async () => {
        const onListScroll = spy<'listScroll'>();
        await renderCascader({ defaultOpen: true, defaultValue: ['Asia', 'China', 'Beijing'], onListScroll });
        await fireEvent.scroll(getLists()[1]);
        expect(onListScroll).toHaveBeenCalledTimes(1);
        expect(onListScroll.mock.calls[0][1]).toEqual({
            panelIndex: 1,
            activeNode: treeData[0].children?.[0].children?.[0],
        });
    });

    it('多选的 #tag 插槽整体替换标签', async () => {
        const tag = vi.fn<(scope: CascaderTagSlotProps) => VNodeChild>(({ entity }) => <span class="custom-display">{entity.data.label}</span>);
        await renderCascader({ multiple: true, defaultValue: [['Asia', 'China', 'Beijing']], autoMergeValue: false }, { tag });
        expect(tag).toHaveBeenCalledWith(
            expect.objectContaining({
                entity: expect.objectContaining({ data: treeData[0].children?.[0].children?.[0] }),
                index: 0,
                disabled: false,
            })
        );
        expect(Array.from(document.querySelectorAll('.custom-display')).map((node) => node.textContent)).toEqual(['北京']);
        expect(document.querySelector(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag`)).toBeNull();
    });

    it('多选点击标签关闭按钮移除该项', async () => {
        const onChange = spy<'change'>();
        await renderCascader({
            multiple: true,
            onChange,
            defaultValue: [['Asia', 'China', 'Beijing']],
            autoMergeValue: false,
        });
        await click(document.querySelector(`.${prefixCls}-selection-tag .${BASE_CLASS_PREFIX}-tag-close`));
        expect(onChange).toHaveBeenCalledWith([]);
        expect(getTagTexts()).toEqual([]);
    });

    it('禁用的多选 Cascader 的标签没有关闭按钮', async () => {
        await renderCascader({
            multiple: true,
            disabled: true,
            defaultValue: [['Asia', 'China', 'Beijing']],
            autoMergeValue: false,
        });
        expect(getTagTexts()).toEqual(['北京']);
        expect(screen.queryAllByRole('button')).toEqual([]);
    });

    it('disabled 的 combobox 带 aria-disabled', async () => {
        await renderCascader({ disabled: true });
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-disabled', 'true');
    });

    it('受控单选的 modelValue 内容不变时，搜索输入不被清空', async () => {
        const Parent = defineComponent(() => {
            const keyword = ref('');
            return () => (
                <>
                    <Cascader
                        {...commonProps}
                        treeData={treeData}
                        modelValue={[]}
                        filterTreeNode
                        onSearch={(value: string) => {
                            keyword.value = value;
                        }}
                    />
                    <output>{keyword.value}</output>
                </>
            );
        });
        await renderWith(Parent);
        await click(getTrigger());
        await type('北');
        expect(getSelectionInput()).toHaveValue('北');
        expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('不可搜索、打开且没有当前选项时，Space 与 Enter 一样关闭并阻止滚动', async () => {
        await renderCascader();
        const combobox = getTrigger();
        await focus(combobox);
        await keyboard(' ');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
        await act(() => combobox.dispatchEvent(space));
        expect(space.defaultPrevented).toBe(true);
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    it('多选可搜索时在 TagInput 中关闭标签', async () => {
        const onChange = spy<'change'>();
        await renderCascader({
            multiple: true,
            filterTreeNode: true,
            onChange,
            defaultValue: [['Asia', 'China', 'Beijing']],
            autoMergeValue: false,
        });
        await click(document.querySelector(`.${BASE_CLASS_PREFIX}-tagInput .${BASE_CLASS_PREFIX}-tag .${BASE_CLASS_PREFIX}-tag-close`));
        expect(onChange).toHaveBeenCalledWith([]);
        expect(getTagTexts()).toEqual([]);
    });

    it('keyEntities 中没有该 key 时不渲染标签', async () => {
        await renderCascader({
            multiple: true,
            defaultValue: [['NonExistent', 'Path']],
            autoMergeValue: false,
            placeholder: 'empty',
        });
        expect(document.querySelector(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag`)).toBeNull();
        expect(document.querySelector(`.${prefixCls}-selection-placeholder`)).toHaveTextContent('empty');
    });

    it('disableStrictly 与禁用项', async () => {
        await renderCascader({
            treeData: [
                {
                    label: '亚洲',
                    value: 'Asia',
                    children: [
                        {
                            label: '中国',
                            value: 'China',
                            disabled: true,
                            children: [{ label: '北京', value: 'Beijing' }],
                        },
                    ],
                },
            ],
            multiple: true,
            disableStrictly: true,
            defaultValue: [['Asia', 'China', 'Beijing']],
            autoMergeValue: false,
        });
        const tags = document.querySelectorAll(`.${prefixCls}-selection-tag`);
        expect(Array.from(tags).map((tag) => tag.textContent)).toEqual(['北京', '中国', '亚洲']);
        tags.forEach((tag) => expect(tag).toHaveClass(`${prefixCls}-selection-tag-disabled`));
    });

    it('#prefix 与 #suffix 插槽加 with-prefix、with-suffix', async () => {
        await renderCascader(
            {},
            {
                prefix: () => <span class="custom-prefix">Prefix</span>,
                suffix: () => <span class="custom-suffix">Suffix</span>,
            }
        );
        expect(document.querySelector(`.${prefixCls}-prefix .custom-prefix`)).toHaveTextContent('Prefix');
        expect(document.querySelector(`.${prefixCls}-suffix .custom-suffix`)).toHaveTextContent('Suffix');
        expect(getTrigger()).toHaveClass(`${prefixCls}-with-prefix`);
        expect(getTrigger()).toHaveClass(`${prefixCls}-with-suffix`);
    });

    it('#insetLabel 插槽与 insetLabelId', async () => {
        await renderCascader({ insetLabelId: 'label-id' }, { insetLabel: () => <span class="custom-inset-label">Label</span> });
        const label = document.querySelector(`.${prefixCls}-inset-label`) as HTMLElement;
        expect(label.querySelector('.custom-inset-label')).toHaveTextContent('Label');
        expect(label).toHaveAttribute('id', 'label-id');
    });

    it('virtualizeInSearch', async () => {
        await renderCascader({
            filterTreeNode: true,
            virtualizeInSearch: { height: 300, itemSize: 36 },
            defaultOpen: true,
        });
        await type('北');
        const rows = document.querySelectorAll(`.${prefixCls}-option-list li`);
        expect(rows).toHaveLength(3);
        rows.forEach((row) => expect(row).toHaveStyle({ position: 'absolute', height: '36px' }));
        // the rows sit in a ul, the scroll container's only child; the listbox holds the scroll container
        const list = rows[0].parentElement as HTMLElement;
        expect(list.tagName).toBe('UL');
        expect(list).toHaveAttribute('role', 'none');
        expect(list.parentElement).toHaveStyle({ height: '300px' });
        expect(list.parentElement?.parentElement).toHaveAttribute('role', 'listbox');
    });

    it('virtualizeInSearch 不传 height 时使用 180 的缺省高度', async () => {
        await renderCascader({ filterTreeNode: true, virtualizeInSearch: { itemSize: 36 }, defaultOpen: true });
        await type('北');
        const rows = document.querySelectorAll(`.${prefixCls}-option-list li`);
        expect(rows).toHaveLength(3);
        expect(rows[0].parentElement?.parentElement).toHaveStyle({ height: '180px' });
    });

    it('#trigger 插槽的 onRemove 按位置移除', async () => {
        const onChange = spy<'change'>();
        await renderCascader(
            { multiple: true, onChange, defaultValue: [['Asia', 'China', 'Beijing']], autoMergeValue: false },
            {
                trigger: ({ value, onRemove }: CascaderTriggerSlotProps<true>) => (
                    <div class="custom-trigger">
                        {[...value].map((pos) => (
                            <button key={pos} type="button" onClick={() => onRemove(pos)}>
                                {pos}
                            </button>
                        ))}
                    </div>
                ),
            }
        );
        expect(document.querySelector('.custom-trigger')).toHaveTextContent('0-0-0');
        await click(screen.getByText('0-0-0'));
        expect(onChange).toHaveBeenCalledWith([]);
        expect(document.querySelector('.custom-trigger')).toBeEmptyDOMElement();
    });

    it.each(['{Enter}', ' '])('#trigger 内按钮聚焦时 %j 只触发按钮，不打开面板', async (key) => {
        const onClear = vi.fn<(event: MouseEvent) => void>((event) => event.stopPropagation());
        await renderCascader(
            {},
            {
                trigger: () => (
                    <div class="custom-trigger">
                        <button type="button" aria-label="清除" onClick={onClear} />
                    </div>
                ),
            }
        );
        screen.getByRole('button', { name: '清除' }).focus();
        await keyboard(key);
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('tree')).not.toBeInTheDocument();
    });

    it('#trigger 内 role="button" 的元素上按 Enter 只交给它，不打开面板；指针点击仍打开', async () => {
        const onPress = vi.fn<() => void>();
        await renderCascader(
            {},
            {
                trigger: () => (
                    <div class="custom-trigger">
                        <Tag aria-label="清除" onClick={onPress}>
                            {() => '北京'}
                        </Tag>
                    </div>
                ),
            }
        );
        screen.getByRole('button', { name: '清除' }).focus();
        await keyboard('{Enter}');
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('tree')).not.toBeInTheDocument();

        await click(screen.getByRole('button', { name: '清除' }));
        expect(screen.getByRole('tree')).toBeInTheDocument();
    });

    it.each([false, true])('多选时已选标签上按 Enter 不改变面板开合（defaultOpen=%s）', async (defaultOpen) => {
        const onDropdownVisibleChange = spy<'dropdownVisibleChange'>();
        await renderCascader({
            multiple: true,
            defaultOpen,
            defaultValue: [['Asia', 'China', 'Beijing']],
            onDropdownVisibleChange,
        });
        onDropdownVisibleChange.mockClear();
        screen.getByRole('button', { name: /北京/ }).focus();
        await keyboard('{Enter}');
        expect(onDropdownVisibleChange).not.toHaveBeenCalled();
        expect(screen.queryAllByRole('tree')).toHaveLength(defaultOpen ? 1 : 0);
    });

    it('多选、面板打开且有激活项时，已选标签上按 Enter 不选中激活项，keydown 只发一次', async () => {
        const onChange = spy<'change'>();
        const onKeydown = spy<'keydown'>();
        await renderCascader({
            multiple: true,
            defaultOpen: true,
            defaultValue: [['Asia', 'China', 'Beijing']],
            onChange,
            onKeydown,
        });
        await focus(getTrigger());
        await keyboard('{ArrowDown}');
        expect(activeLabel(getTrigger())).toBeTruthy();

        onKeydown.mockClear();
        await focus(screen.getByRole('button', { name: /北京/ }));
        await keyboard('{Enter}');
        expect(onChange).not.toHaveBeenCalled();
        expect(getTagTexts()).toEqual(['北京']);
        expect(onKeydown).toHaveBeenCalledTimes(1);
    });

    it('filterSorter 收到两条从根到结果节点的路径与输入内容', async () => {
        const filterSorter = vi.fn<(first: CascaderData[], second: CascaderData[], inputValue: string) => number>((first, second) => (String(first.at(-1)?.value) < String(second.at(-1)?.value) ? -1 : 1));
        const { handle } = await renderCascader({ filterTreeNode: true, defaultOpen: true, filterSorter });
        await act(() => handle().search('洲'));
        expect(filterSorter).toHaveBeenCalled();
        for (const [first, second, inputValue] of filterSorter.mock.calls) {
            expect(['Asia', 'North America']).toContain(first[0].value);
            expect(['Asia', 'North America']).toContain(second[0].value);
            expect(inputValue).toBe('洲');
        }
        expect(document.querySelectorAll(`li.${prefixCls}-option`)[0]).toHaveTextContent('北京');
    });

    it('handle 的 search 方法', async () => {
        const onSearch = spy<'search'>();
        const { handle } = await renderCascader({ filterTreeNode: true, defaultOpen: true, onSearch });
        await act(() => handle().search('北京'));
        expect(onSearch).toHaveBeenCalledWith('北京');
        expect(getSelectionInput()).toHaveValue('北京');
        expect(getHighlights()).toHaveLength(1);
    });

    it('空的 #emptyContent 插槽隐藏空状态', async () => {
        await renderCascader({ treeData: [], defaultOpen: true }, { emptyContent: () => [] });
        const lists = document.querySelector(`.${prefixCls}-option-lists`);
        expect(lists).toHaveClass(`${prefixCls}-option-lists-empty`);
        expect(lists).toBeEmptyDOMElement();
    });

    it('在当前选项上按 Enter 等同于点击', async () => {
        const onChange = spy<'change'>();
        await renderCascader({ defaultOpen: true, onChange });
        await focus(getTrigger());
        await keyboard('{ArrowDown}{Enter}');
        expect(getLists()).toHaveLength(2);
        await keyboard('{ArrowRight}{Enter}{ArrowRight}{Enter}');
        expect(onChange).toHaveBeenCalledWith(['Asia', 'China', 'Beijing']);
    });

    it('loadData 属性', async () => {
        let finishLoad = () => undefined as void;
        const loadData = vi.fn<(selected: CascaderData[]) => Promise<void>>(
            () =>
                new Promise<void>((resolve) => {
                    finishLoad = resolve;
                })
        );
        const onLoad = spy<'load'>();
        const data = { label: '亚洲', value: 'Asia', isLeaf: false };
        await renderCascader({ treeData: [data], loadData, onLoad, defaultOpen: true });

        await click(getOption('亚洲'));
        expect(loadData).toHaveBeenCalledWith([data]);
        expect(getOption('亚洲').querySelector(`.${prefixCls}-option-spin-icon`)).not.toBeNull();

        finishLoad();
        await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1));
        expect(onLoad.mock.calls[0][1]).toEqual(data);
        await waitFor(() => expect(getOption('亚洲').querySelector(`.${prefixCls}-option-spin-icon`)).toBeNull());
    });

    it('loadData reject 时停止显示加载状态，并允许重试', async () => {
        const loadData = vi.fn<() => Promise<void>>(() => Promise.reject(new Error('load failed')));
        const rejections: unknown[] = [];
        const onRejection = (reason: unknown) => rejections.push(reason);
        // loadData rejections are rethrown to the caller by design; catch it here so it is not reported as a test failure
        process.on('unhandledRejection', onRejection);
        try {
            const data = { label: '亚洲', value: 'Asia', isLeaf: false };
            await renderCascader({ treeData: [data], loadData, defaultOpen: true });
            await click(getOption('亚洲'));
            await waitFor(() => expect(loadData).toHaveBeenCalledTimes(1));
            await waitFor(() => expect(getOption('亚洲').querySelector(`.${prefixCls}-option-spin-icon`)).toBeNull());
            await click(getOption('亚洲'));
            await waitFor(() => expect(loadData).toHaveBeenCalledTimes(2));
        } finally {
            await settle();
            process.off('unhandledRejection', onRejection);
        }
    });

    it('modelValue 变化时更新显示', async () => {
        const { rerender } = await renderCascader({ modelValue: ['Asia', 'China', 'Beijing'] });
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 北京');
        await rerender({ modelValue: ['North America', 'United States'] });
        expect(getSelectionText()).toEqual('北美洲 / 美国');
    });

    it('filterTreeNode 与搜索', async () => {
        await renderCascader({ filterTreeNode: true, defaultOpen: true });
        await type('北京');
        const options = document.querySelectorAll(`.${prefixCls}-option-flatten`);
        expect(Array.from(options).map((option) => option.textContent)).toEqual(['亚洲 / 中国 / 北京']);
    });

    it('focus 与 blur 事件', async () => {
        const onFocus = spy<'focus'>();
        const onBlur = spy<'blur'>();
        await renderCascader({ onFocus, onBlur });

        await click(getSelection());
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();

        await fireEvent.keyDown(getTrigger(), { key: 'Escape' });
        await settle();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(isDropdownOpen()).toBe(false);
    });

    it('select 事件', async () => {
        const onSelect = spy<'select'>();
        await renderCascader({ onSelect, defaultOpen: true });
        await click(getOption('北美洲'));
        expect(onSelect).not.toHaveBeenCalled();
        expect(getLists()).toHaveLength(2);
        await click(getOption('加拿大'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('Canada');
    });

    it('逐字输入时每次发出 search', async () => {
        const onSearch = spy<'search'>();
        await renderCascader({ filterTreeNode: true, onSearch, defaultOpen: true });
        await type('北京');
        expect(onSearch).toHaveBeenCalledTimes(2);
        expect(onSearch).toHaveBeenLastCalledWith('北京');
    });

    it('dropdownVisibleChange 事件', async () => {
        const onDropdownVisibleChange = spy<'dropdownVisibleChange'>();
        await renderCascader({ onDropdownVisibleChange });
        await click(getTrigger());
        expect(onDropdownVisibleChange).toHaveBeenCalledTimes(1);
        expect(onDropdownVisibleChange).toHaveBeenCalledWith(true);
    });

    it('值里不存在的路径不渲染标签', async () => {
        await renderCascader({
            multiple: true,
            autoMergeValue: false,
            modelValue: [['Asia', 'China', 'Beijing'], ['Mars']],
        });
        expect(getTagTexts()).toEqual(['北京']);
    });

    it('在 TagInput 中关闭标签只移除该项', async () => {
        const onChange = spy<'change'>();
        await renderCascader({
            multiple: true,
            filterTreeNode: true,
            onChange,
            defaultValue: [
                ['Asia', 'China', 'Beijing'],
                ['Asia', 'China', 'Shanghai'],
            ],
            autoMergeValue: false,
        });
        expect(getTagTexts()).toEqual(['北京', '上海', '中国', '亚洲']);
        await click(document.querySelector(`.${BASE_CLASS_PREFIX}-tagInput .${BASE_CLASS_PREFIX}-tag-close`));
        expect(onChange).toHaveBeenCalledWith([['Asia', 'China', 'Shanghai']]);
        expect(getTagTexts()).toEqual(['上海']);
    });

    it('#filterItem 插槽替换搜索结果行', async () => {
        const filterItem = vi.fn<(scope: CascaderFilterItemSlotProps) => VNodeChild>(({ data }) => <div class="custom-filter-item">{data.map((item) => item.label).join('-')}</div>);
        await renderCascader({ filterTreeNode: true, defaultOpen: true }, { filterItem });
        await type('北京');
        expect(filterItem).toHaveBeenLastCalledWith(expect.objectContaining({ inputValue: '北京', selected: false }));
        const items = document.querySelectorAll('.custom-filter-item');
        expect(Array.from(items).map((item) => item.textContent)).toEqual(['亚洲-中国-北京']);
    });

    it('单选模式下 treeData 变化后重新收集选项', async () => {
        const { rerender } = await renderCascader({ treeData: [{ label: '选项1', value: 'opt1' }], defaultOpen: true });
        expect(Array.from(getListOptions(0)).map((option) => option.textContent)).toEqual(['选项1']);
        await rerender({
            treeData: [
                { label: '选项1', value: 'opt1' },
                { label: '选项2', value: 'opt2' },
            ],
        });
        expect(Array.from(getListOptions(0)).map((option) => option.textContent)).toEqual(['选项1', '选项2']);
    });

    it('#trigger 插槽的 onRemove 移除指定位置的标签', async () => {
        const onChange = spy<'change'>();
        await renderCascader(
            {
                multiple: true,
                onChange,
                defaultValue: [
                    ['Asia', 'China', 'Beijing'],
                    ['North America', 'United States'],
                ],
            },
            {
                trigger: ({ value, onRemove }: CascaderTriggerSlotProps<true>) => (
                    <div class="custom-trigger">
                        {[...value].map((pos) => (
                            <button key={pos} type="button" onClick={() => onRemove(pos)}>
                                {pos}
                            </button>
                        ))}
                    </div>
                ),
            }
        );
        await click(screen.getByRole('button', { name: '0-0-0' }));
        expect(onChange).toHaveBeenCalledWith([['North America', 'United States']]);
        expect(screen.queryByRole('button', { name: '0-0-0' })).toBeNull();
        expect(screen.getByRole('button', { name: '1-0' })).toBeInTheDocument();
    });

    it('在 TagInput 中按 key 移除标签', async () => {
        const onChange = spy<'change'>();
        await renderCascader({
            multiple: true,
            filterTreeNode: true,
            onChange,
            defaultValue: [
                ['Asia', 'China', 'Beijing'],
                ['North America', 'United States'],
            ],
        });
        expect(getTagTexts()).toEqual(['北京', '美国']);
        const closeButtons = document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tagInput .${BASE_CLASS_PREFIX}-tag-close`);
        await click(closeButtons[1]);
        expect(onChange).toHaveBeenCalledWith([['Asia', 'China', 'Beijing']]);
        expect(getTagTexts()).toEqual(['北京']);
    });

    it('treeData 不再包含已选路径时不渲染标签', async () => {
        const value = [['Asia', 'China', 'Beijing']];
        const { rerender, unmount } = await renderCascader({
            multiple: true,
            modelValue: value,
            autoMergeValue: false,
        });
        expect(getTagTexts()).toEqual(['北京']);
        await rerender({ treeData: [treeData[1]] });
        expect(getTagTexts()).toEqual([]);
        unmount();

        const view = await renderCascader({ multiple: true, defaultValue: value, autoMergeValue: false });
        await view.rerender({ treeData: [treeData[1]] });
        expect(getTagTexts()).toEqual([]);
    });

    it('搜索结果的虚拟列表', async () => {
        await renderCascader({
            filterTreeNode: true,
            defaultOpen: true,
            virtualizeInSearch: { height: 300, width: '100%', itemSize: 36 },
        });
        await type('北京');
        const rows = document.querySelectorAll(`.${prefixCls}-option-flatten`);
        expect(Array.from(rows).map((row) => row.textContent)).toEqual(['亚洲 / 中国 / 北京']);
        expect(rows[0]).toHaveStyle({ position: 'absolute', top: '0px', height: '36px' });
    });

    it('级联列表中的禁用项', async () => {
        const data: CascaderData[] = [
            {
                label: '亚洲',
                value: 'Asia',
                children: [{ label: '中国', value: 'China', disabled: true, children: [{ label: '北京', value: 'Beijing' }] }],
            },
        ];
        await renderCascader({ treeData: data, defaultOpen: true });
        await click(getOption('亚洲'));
        expect(getOption('中国')).toHaveClass(`${prefixCls}-option-disabled`);
        expect(getOption('中国')).toHaveAttribute('aria-disabled', 'true');
        await click(getOption('中国'));
        expect(getLists()).toHaveLength(2);
    });

    it('TagInput 中按 Backspace 移除最后一个标签', async () => {
        const onChange = spy<'change'>();
        await renderCascader({
            multiple: true,
            filterTreeNode: true,
            onChange,
            defaultValue: [
                ['Asia', 'China', 'Beijing'],
                ['North America', 'United States'],
            ],
        });
        await fireEvent.keyDown(getSelectionInput(), { key: 'Backspace', keyCode: 8 });
        await settle();
        expect(onChange).toHaveBeenCalledWith([['Asia', 'China', 'Beijing']]);
        expect(getTagTexts()).toEqual(['北京']);
    });

    it('treeData 变化但 modelValue 不变', async () => {
        const value = ['Asia', 'China', 'Beijing'];
        const { rerender } = await renderCascader({ modelValue: value });
        await rerender({
            treeData: [...treeData, { label: '欧洲', value: 'Europe', children: [{ label: '英国', value: 'UK' }] }],
        });
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 北京');
        await click(getSelection());
        expect(Array.from(getListOptions(0)).map((option) => option.textContent)).toEqual(['亚洲', '北美洲', '欧洲']);
    });

    it('modelValue 变化但 treeData 不变', async () => {
        const { rerender } = await renderCascader({ modelValue: ['Asia', 'China', 'Beijing'] });
        await rerender({ modelValue: ['Asia', 'China', 'Shanghai'] });
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 上海');
    });

    it('点击外部关闭下拉框', async () => {
        const onDropdownVisibleChange = spy<'dropdownVisibleChange'>();
        await renderCascader({ defaultOpen: true, onDropdownVisibleChange });
        expect(isDropdownOpen()).toBe(true);
        expect(onDropdownVisibleChange).toHaveBeenCalledWith(true);
        await click(document.body);
        expect(isDropdownOpen()).toBe(false);
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('点击分支选项只展开不选中', async () => {
        await renderCascader({ defaultOpen: true });
        await click(getOption('亚洲'));
        expect(getOption('亚洲')).toHaveClass(`${prefixCls}-option-active`);
        expect(getOption('亚洲')).not.toHaveClass(`${prefixCls}-option-select`);
        expect(document.querySelector(`.${prefixCls}-selection-placeholder`)).not.toBeNull();
    });

    it('达到 max 时发出 exceed', async () => {
        const onExceed = spy<'exceed'>();
        await renderCascader({ multiple: true, max: 1, onExceed, defaultOpen: true });
        await click(getCheckbox('亚洲'));
        expect(getTagTexts()).toEqual(['亚洲']);
        expect(onExceed).not.toHaveBeenCalled();
        await click(getCheckbox('北美洲'));
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(getTagTexts()).toEqual(['亚洲']);
    });

    it('多选没有选中项时显示 placeholder', async () => {
        await renderCascader({ multiple: true, defaultValue: [], placeholder: 'empty' });
        expect(getSelection()).not.toHaveClass(`${prefixCls}-selection-multiple`);
        expect(document.querySelector(`.${prefixCls}-selection-placeholder`)).toHaveTextContent('empty');
    });

    it('虚拟列表的行按序号定位', async () => {
        await renderCascader({
            filterTreeNode: true,
            treeNodeFilterProp: 'value',
            defaultOpen: true,
            virtualizeInSearch: { height: 300, width: '100%', itemSize: 36 },
        });
        await type('China');
        const rows = document.querySelectorAll(`.${prefixCls}-option-flatten`);
        expect(Array.from(rows).map((row) => row.textContent)).toEqual(['Asia / China / Beijing', 'Asia / China / Shanghai']);
        expect(rows[0]).toHaveStyle({ position: 'absolute', top: '0px', height: '36px' });
        expect(rows[1]).toHaveStyle({ position: 'absolute', top: '36px', height: '36px' });
    });

    it('空的 #emptyContent 插槽不渲染空状态，下拉仍打开', async () => {
        await renderCascader({ treeData: [], defaultOpen: true }, { emptyContent: () => [] });
        expect(document.querySelector(`.${prefixCls}-option-empty`)).toBeNull();
        expect(document.querySelector(`.${prefixCls}-option-lists`)).not.toBeNull();
    });

    it('禁用项带禁用类名，点击不选中', async () => {
        const onChange = spy<'change'>();
        const data: CascaderData[] = [
            {
                label: '亚洲',
                value: 'Asia',
                children: [
                    { label: '中国', value: 'China', disabled: true },
                    { label: '日本', value: 'Japan' },
                ],
            },
        ];
        await renderCascader({ treeData: data, defaultOpen: true, onChange });
        await click(getOption('亚洲'));
        expect(getOption('中国')).toHaveClass(`${prefixCls}-option-disabled`);
        expect(getOption('日本')).not.toHaveClass(`${prefixCls}-option-disabled`);
        await click(getOption('中国'));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('虚拟列表的视口尺寸', async () => {
        await renderCascader({
            filterTreeNode: true,
            treeNodeFilterProp: 'value',
            defaultOpen: true,
            virtualizeInSearch: { height: 200, width: 300, itemSize: 32 },
        });
        await type('Bei');
        const rows = document.querySelectorAll(`.${prefixCls}-option-flatten`);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toHaveStyle({ height: '32px' });
        const list = rows[0].parentElement?.parentElement;
        expect(list).toHaveStyle({ height: '200px', width: '300px' });
    });

    it('第一列滚动时 activeNode 为 null', async () => {
        const onListScroll = spy<'listScroll'>();
        await renderCascader({ defaultOpen: true, onListScroll });
        await fireEvent.scroll(getLists()[0]);
        expect(onListScroll).toHaveBeenCalledTimes(1);
        expect(onListScroll.mock.calls[0][1]).toEqual({ panelIndex: 0, activeNode: null });
    });

    it('checkRelation 为 unRelated 时子节点不影响父节点', async () => {
        await renderCascader({
            multiple: true,
            checkRelation: 'unRelated',
            defaultValue: [['Asia', 'China', 'Beijing']],
        });
        expect(getTagTexts()).toEqual(['北京']);
        await click(getSelection());
        expect(getCheckbox('亚洲')).not.toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-indeterminate`);
        expect(getCheckbox('亚洲')).not.toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-checked`);
    });

    it('已有选中项时再勾选超过 max', async () => {
        const onExceed = spy<'exceed'>();
        await renderCascader({
            multiple: true,
            max: 1,
            onExceed,
            defaultValue: [['Asia', 'China', 'Beijing']],
            defaultOpen: true,
        });
        await click(getCheckbox('北美洲'));
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(getTagTexts()).toEqual(['北京']);
    });

    it('大量搜索结果时虚拟列表只渲染可见行', async () => {
        const largeTreeData: CascaderData[] = Array.from({ length: 50 }, (_, i) => ({
            label: `选项${i}`,
            value: `opt${i}`,
            children: [
                { label: `子选项${i}-1`, value: `child${i}-1` },
                { label: `子选项${i}-2`, value: `child${i}-2` },
            ],
        }));
        await renderCascader({
            treeData: largeTreeData,
            filterTreeNode: true,
            defaultOpen: true,
            virtualizeInSearch: { height: 200, width: 300, itemSize: 36 },
        });
        await userEvent.paste('选项');
        await settle();
        const rows = document.querySelectorAll(`.${prefixCls}-option-flatten`);
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.length).toBeLessThan(100);
        expect(rows[0].parentElement).toHaveStyle({ height: '3600px' });
    });

    it('点击选项不关闭，点击外部按钮关闭', async () => {
        const onDropdownVisibleChange = spy<'dropdownVisibleChange'>();
        await renderCascader({ defaultOpen: true, onDropdownVisibleChange });
        const outside = document.createElement('button');
        outside.textContent = 'outside';
        document.body.append(outside);
        try {
            await click(getOption('亚洲'));
            expect(isDropdownOpen()).toBe(true);
            await click(screen.getByRole('button', { name: 'outside' }));
            expect(isDropdownOpen()).toBe(false);
            expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        } finally {
            outside.remove();
        }
    });

    it('禁用选项渲染禁用类名', async () => {
        await renderCascader({
            treeData: [
                { label: '选项1', value: 'opt1', disabled: true },
                { label: '选项2', value: 'opt2' },
            ],
            defaultOpen: true,
        });
        expect(getOption('选项1')).toHaveClass(`${prefixCls}-option-disabled`);
        expect(getOption('选项2')).not.toHaveClass(`${prefixCls}-option-disabled`);
    });

    it('虚拟列表的每一行按 itemSize 定位', async () => {
        const largeTreeData: CascaderData[] = Array.from({ length: 50 }, (_, i) => ({
            label: `TestItem${i}`,
            value: `testitem${i}`,
        }));
        await renderCascader({
            treeData: largeTreeData,
            filterTreeNode: true,
            defaultOpen: true,
            virtualizeInSearch: { height: 150, width: 250, itemSize: 30 },
        });
        await userEvent.paste('Test');
        await settle();
        const rows = document.querySelectorAll(`.${prefixCls}-option-flatten`);
        expect(rows.length).toBeLessThan(50);
        rows.forEach((row, index) => {
            expect(row).toHaveTextContent(`TestItem${index}`);
            expect(row).toHaveStyle({ position: 'absolute', top: `${index * 30}px`, height: '30px' });
        });
    });

    it('勾选第二个子节点连带父节点，超过 max', async () => {
        const onExceed = spy<'exceed'>();
        await renderCascader({ multiple: true, max: 1, onExceed, defaultOpen: true, autoMergeValue: false });
        await click(getOption('亚洲'));
        await click(getOption('中国'));
        await click(getCheckbox('北京'));
        expect(getTagTexts()).toEqual(['北京']);
        expect(onExceed).not.toHaveBeenCalled();
        await click(getCheckbox('上海'));
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(onExceed.mock.calls[0][0]).toHaveLength(4);
        expect(getTagTexts()).toEqual(['北京']);
    });

    it('悬停禁用项不展开', async () => {
        await renderCascader({
            treeData: [
                { label: '选项1', value: 'opt1', disabled: true, children: [{ label: '子选项1', value: 'child1' }] },
                { label: '选项2', value: 'opt2', children: [{ label: '子选项2', value: 'child2' }] },
            ],
            defaultOpen: true,
            showNext: 'hover',
        });
        await mouseEnter(getOption('选项1'));
        expect(getLists()).toHaveLength(1);
        expect(getOption('选项1')).not.toHaveClass(`${prefixCls}-option-active`);
        await mouseEnter(getOption('选项2'));
        expect(getLists()).toHaveLength(2);
    });

    it('#expandIcon 插槽替换展开图标', async () => {
        await renderCascader({ defaultOpen: true }, { expandIcon: () => <span class="custom-expand-icon">{'>'}</span> });
        expect(getOption('亚洲').querySelector('.custom-expand-icon')).not.toBeNull();
        expect(getOption('北美洲').querySelector('.custom-expand-icon')).not.toBeNull();
        expect(document.querySelector(`.${prefixCls}-option-icon-expand`)).toBeNull();
    });

    it('未选中时分支显示展开图标，选项显示占位图标', async () => {
        await renderCascader({ defaultOpen: true });
        expect(document.querySelectorAll(`.${prefixCls}-option-icon-expand`)).toHaveLength(2);
        expect(document.querySelectorAll(`.${prefixCls}-option-icon-empty`)).toHaveLength(2);
        expect(document.querySelector(`.${prefixCls}-option-icon-active`)).toBeNull();
    });

    it('点击搜索结果选中并关闭', async () => {
        const onChange = spy<'change'>();
        await renderCascader({ filterTreeNode: true, defaultOpen: true, onChange });
        await type('北京');
        await click(document.querySelector(`.${prefixCls}-option-flatten`));
        expect(onChange).toHaveBeenCalledWith(['Asia', 'China', 'Beijing']);
        expect(isDropdownOpen()).toBe(false);
        expect(document.querySelector(`.${prefixCls}-search-wrapper span`)).toHaveTextContent('亚洲 / 中国 / 北京');
    });

    it('showNext 为 hover 时悬停展开', async () => {
        await renderCascader({ defaultOpen: true, showNext: 'hover' });
        await mouseEnter(getOption('亚洲'));
        expect(getLists()).toHaveLength(2);
        expect(getOption('亚洲')).toHaveClass(`${prefixCls}-option-active`);
        expect(getOption('中国')).toBeInTheDocument();
    });

    it('点击禁用项不选中', async () => {
        const onChange = spy<'change'>();
        await renderCascader({
            treeData: [
                { label: '选项1', value: 'opt1', disabled: true },
                { label: '选项2', value: 'opt2' },
            ],
            defaultOpen: true,
            onChange,
        });
        await click(getOption('选项1'));
        expect(onChange).not.toHaveBeenCalled();
        expect(isDropdownOpen()).toBe(true);
        await click(getOption('选项2'));
        expect(onChange).toHaveBeenCalledWith(['opt2']);
    });

    it('点击禁用的搜索结果不选中', async () => {
        const onChange = spy<'change'>();
        await renderCascader({
            treeData: [
                {
                    label: '选项1',
                    value: 'opt1',
                    children: [
                        { label: '子选项1', value: 'child1', disabled: true },
                        { label: '子选项2', value: 'child2' },
                    ],
                },
            ],
            filterTreeNode: true,
            defaultOpen: true,
            onChange,
        });
        await type('子选项1');
        const disabledItem = document.querySelector(`.${prefixCls}-option-flatten`);
        expect(disabledItem).toHaveClass(`${prefixCls}-option-disabled`);
        await click(disabledItem);
        expect(onChange).not.toHaveBeenCalled();
        expect(isDropdownOpen()).toBe(true);
    });

    it('changeOnSelect 时点击分支选项即选中并展开', async () => {
        const onSelect = spy<'select'>();
        await renderCascader({ defaultOpen: true, onSelect, changeOnSelect: true });
        await click(getOption('北美洲'));
        expect(onSelect).toHaveBeenCalledWith('North America');
        expect(getOption('北美洲')).toHaveClass(`${prefixCls}-option-select`);
        const selectedItems = document.querySelectorAll(`.${prefixCls}-option-select`);
        expect(Array.from(selectedItems).map((item) => item.textContent)).toEqual(['北美洲']);
        expect(getSelectionText()).toEqual('北美洲');
        expect(getLists()).toHaveLength(2);
    });

    it('可搜索时 handle 的 blur 让输入框失焦', async () => {
        const { handle } = await renderCascader({ filterTreeNode: true, defaultOpen: true });
        expect(getSelectionInput()).toHaveFocus();
        await act(() => handle().blur());
        expect(getSelectionInput()).not.toHaveFocus();
    });

    it('unRelated 模式下超过 max 时发出 exceed', async () => {
        const onExceed = spy<'exceed'>();
        const onChange = spy<'change'>();
        await renderCascader({
            treeData: [
                { label: '选项1', value: 'opt1' },
                { label: '选项2', value: 'opt2' },
                { label: '选项3', value: 'opt3' },
            ],
            multiple: true,
            checkRelation: 'unRelated',
            max: 1,
            onExceed,
            onChange,
        });
        await click(getSelection());
        await click(getCheckbox('选项1'));
        expect(onChange).toHaveBeenCalledWith([['opt1']]);
        expect(getTagTexts()).toEqual(['选项1']);
        await click(getCheckbox('选项2'));
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(onExceed.mock.calls[0][0].map((entity) => entity.data.value)).toEqual(['opt1']);
        expect(getTagTexts()).toEqual(['选项1']);
    });

    it('fix #703：受控多选的值在 treeData 扩展到包含它后显示完整路径', async () => {
        const value = [['0-0'], ['0-1', 'Node2-2']];
        const { rerender } = await renderCascader({ multiple: true, modelValue: value, treeData: asyncTreeData });
        expect(getTagTexts()).toEqual(['Node1']);
        await rerender({
            treeData: addChildren(asyncTreeData, '0-1', [
                { label: 'Node2-1', value: 'Node2-1', isLeaf: true },
                { label: 'Node2-2', value: 'Node2-2', isLeaf: true },
            ]),
        });
        expect(getTagTexts()).toEqual(['Node1', 'Node2-2']);
    });

    it('fix #1449：搜索结果是带高亮的路径文本', async () => {
        await renderCascader({ filterTreeNode: true, defaultOpen: true });
        await type('北京');
        const [result] = getListOptions(0);
        expect(getListOptions(0)).toHaveLength(1);
        expect(result).toHaveTextContent(/^亚洲 \/ 中国 \/ 北京$/);
        expect(Array.from(getHighlights()).map((node) => node.textContent)).toEqual(['北京']);
    });

    it('fix #1448：loadData 后将受控值重置为 [] 会清空选择', async () => {
        await renderStateful({
            initialData: asyncTreeData,
            initialValue: [],
            load: loadTwo,
            placeholder: 'Please select',
            changeOnSelect: true,
            changeWithObject: true,
        });
        await click(getSelection());
        await click(getOption('Node1'));
        await waitFor(() => expect(getLists()).toHaveLength(2));
        await click(getOption('Node1 - 1'));
        expect(getSelectionText()).toEqual('Node1 / Node1 - 1');
        await click(screen.getByRole('button', { name: 'reset' }));
        expect(getSelectionText()).toEqual('Please select');
        expect(getSelection().querySelector(`.${prefixCls}-selection-placeholder`)).toHaveTextContent(/^Please select$/);
    });

    it('fix #1429：loadData 更新 treeData 时，treeData 中缺失的值保持显示', async () => {
        const onChange = spy<'change'>();
        for (const props of [{ initialValue: '受控 Value' }, { defaultValue: 'defaultValue', showClear: true }]) {
            const text = 'initialValue' in props ? props.initialValue : props.defaultValue;
            const { unmount } = await renderStateful({ initialData: asyncTreeData, load: loadTwo, onChange, ...props });
            expect(getSelectionText()).toEqual(text);
            await click(getSelection());
            await click(getOption('Node1'));
            await waitFor(() => expect(getLists()).toHaveLength(2));
            expect(getSelectionText()).toEqual(text);
            expect(onChange).not.toHaveBeenCalled();
            unmount();
        }
    });

    it('fix #1472：搜索时修改受控值不影响搜索输入框', async () => {
        const { rerender } = await renderCascader({ filterTreeNode: true, modelValue: ['Asia', 'China', 'Beijing'] });
        await click(getSelection());
        expect(getSelectionInput()).toHaveValue('');
        await rerender({ modelValue: ['Asia', 'China', 'Shanghai'] });
        expect(getSelectionInput()).toHaveValue('');
        expect(document.querySelector(`.${prefixCls}-search-wrapper > span`)).toHaveTextContent(/^亚洲 \/ 中国 \/ 上海$/);
    });

    it('fix #2831：悬停路径已移动时，loadData 完成不会收起菜单', async () => {
        const pending: Record<string, () => void> = {};
        const managers: CascaderData[] = ['TCS Manager', 'AAA Manager'].map((label, i) => ({
            label,
            value: label,
            children: [0, 1, 2, 3].map((n) => ({ label: `${i * 4 + n}`, value: `${i * 4 + n}` })),
        }));
        const load = (target: CascaderData, append: (children: CascaderData[]) => void) =>
            new Promise<void>((resolve) => {
                pending[String(target.value)] = () => {
                    append(
                        [0, 1].map((n) => ({
                            label: `${target.value}${n}`,
                            value: `${target.value}${n}`,
                            isLeaf: true,
                        }))
                    );
                    resolve();
                };
            });
        await renderStateful({ initialData: managers, load, changeOnSelect: true, showClear: true, showNext: 'hover' });
        await click(getSelection());
        await mouseEnter(getOption('TCS Manager'));
        await mouseEnter(getOption('0'));
        expect(Object.keys(pending)).toEqual(['0']);
        await mouseEnter(getOption('AAA Manager'));
        expect(Array.from(getListOptions(1)).map((option) => option.textContent)).toEqual(['4', '5', '6', '7']);
        await act(() => pending['0']());
        expect(getLists()).toHaveLength(2);
        expect(Array.from(getListOptions(1)).map((option) => option.textContent)).toEqual(['4', '5', '6', '7']);
        expect(getOption('AAA Manager')).toHaveClass(`${prefixCls}-option-active`);
    });
});

describe('Cascader 行为', () => {
    const isChecked = (label: string) => getCheckbox(label).classList.contains(`${BASE_CLASS_PREFIX}-checkbox-checked`);
    const isIndeterminate = (label: string) => getCheckbox(label).classList.contains(`${BASE_CLASS_PREFIX}-checkbox-indeterminate`);

    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('全局默认值：semiDefault 的 separator、placeholder，组件传值优先', async () => {
        semiGlobal.config.overrideDefaultProps = { Cascader: { separator: ' > ', placeholder: 'global placeholder' } };
        const { unmount } = await renderCascader();
        expect(getSelectionText()).toBe('global placeholder');
        unmount();
        await renderCascader({ defaultValue: ['Asia', 'China', 'Beijing'], placeholder: 'own' });
        expect(getSelectionText()).toBe('亚洲 > 中国 > 北京');
    });

    it('全局默认值：函数型的 filterTreeNode 与 loadData 生效，组件传值优先', async () => {
        const loadData = vi.fn<() => Promise<void>>(() => Promise.resolve());
        const filterTreeNode = vi.fn<(inputValue: string, text: string) => boolean>((inputValue, text) => text.endsWith(inputValue));
        semiGlobal.config.overrideDefaultProps = { Cascader: { filterTreeNode, loadData } };
        const { unmount } = await renderCascader({ defaultOpen: true, treeData: asyncTreeData });
        await click(getOption('Node1'));
        expect(loadData).toHaveBeenCalledTimes(1);
        await type('3');
        expect(filterTreeNode).toHaveBeenCalled();
        expect(Array.from(document.querySelectorAll(`.${prefixCls}-option-flatten`)).map((row) => row.textContent)).toEqual(['Node3']);
        unmount();

        await renderCascader({ filterTreeNode: false });
        expect(document.querySelector(`.${prefixCls}-search-wrapper`)).toBeNull();
    });

    it('data-* 与 aria 属性落在 combobox 根元素上', async () => {
        await renderCascader({
            'data-testid': 'cascader',
            'aria-label': 'Region',
            'aria-required': true,
            'aria-describedby': 'help',
            id: 'region',
        });
        const root = screen.getByRole('combobox');
        expect(screen.getByTestId('cascader')).toBe(root);
        expect(root).toBe(getTrigger());
        expect(root).toHaveAttribute('aria-label', 'Region');
        expect(root).toHaveAttribute('aria-required', 'true');
        expect(root).toHaveAttribute('aria-describedby', 'help');
        expect(root).toHaveAttribute('id', 'region');
        expect(root).toHaveAttribute('tabindex', '0');
    });

    it('combobox 暴露展开状态，并让 aria-controls 指向树', async () => {
        await renderCascader();
        const root = screen.getByRole('combobox');
        expect(root).toHaveAttribute('aria-expanded', 'false');
        expect(root).toHaveAttribute('aria-haspopup', 'tree');
        await click(root);
        expect(root).toHaveAttribute('aria-expanded', 'true');
        const target = document.getElementById(root.getAttribute('aria-controls') ?? '');
        expect(target).toHaveAttribute('role', 'tree');
        expect(target).toHaveAccessibleName(en_US.Cascader.label);
    });

    describe('combobox 与 tree 用同一个名称来源', () => {
        const getTree = () => screen.getByRole('tree');

        it('使用方 aria-label 时两者都用该值', async () => {
            await renderCascader({ defaultOpen: true, 'aria-label': 'Region' }, { insetLabel: () => 'Inset' });
            expect(screen.getByRole('combobox')).toHaveAccessibleName('Region');
            expect(getTree()).toHaveAttribute('aria-label', 'Region');
            expect(getTree()).not.toHaveAttribute('aria-labelledby');
        });

        it('使用方 aria-labelledby 优先于 #insetLabel，两者指向同一个标签', async () => {
            const label = document.body.appendChild(document.createElement('span'));
            label.id = 'external-label';
            label.textContent = 'External';
            onTestFinished(() => label.remove());
            await renderCascader({ defaultOpen: true, 'aria-labelledby': 'external-label' }, { insetLabel: () => 'Inset' });
            expect(screen.getByRole('combobox')).toHaveAccessibleName('External');
            expect(getTree()).toHaveAccessibleName('External');
        });

        it('只有 #insetLabel 时 combobox 与 tree 都以 insetLabel 命名，没有 insetLabelId 时也能引用', async () => {
            const { unmount } = await renderCascader({ defaultOpen: true }, { insetLabel: () => 'Region' });
            expect(screen.getByRole('combobox')).toHaveAccessibleName('Region');
            expect(getTree()).toHaveAccessibleName('Region');
            unmount();
            await renderCascader({ defaultOpen: true, insetLabelId: 'region-label' }, { insetLabel: () => 'Region' });
            expect(screen.getByRole('combobox')).toHaveAttribute('aria-labelledby', 'region-label');
            expect(getTree()).toHaveAttribute('aria-labelledby', 'region-label');
        });

        it('有 #prefix 时 insetLabel 不渲染，也不作名称来源', async () => {
            await renderCascader({ defaultOpen: true }, { prefix: () => 'Pre', insetLabel: () => 'Region' });
            expect(screen.getByRole('combobox')).toHaveAccessibleName(en_US.Cascader.label);
            expect(getTree()).toHaveAccessibleName(en_US.Cascader.label);
        });

        it('没有任何名称来源时 tree 名称等于 combobox 的语言包回落名', async () => {
            await renderCascader({ defaultOpen: true });
            expect(screen.getByRole('combobox')).toHaveAccessibleName(en_US.Cascader.label);
            expect(getTree()).toHaveAccessibleName(en_US.Cascader.label);
        });

        it('触发器上的搜索框是 combobox 时同样以 insetLabel 命名', async () => {
            await renderCascader({ defaultOpen: true, multiple: true, filterTreeNode: true }, { insetLabel: () => 'Region' });
            expect(screen.getByRole('combobox')).toHaveAccessibleName('Region');
            expect(getTree()).toHaveAccessibleName('Region');
        });
    });

    it('showRestTagsPopover 开启时悬停 +N 显示隐藏的标签', async () => {
        await renderCascader({
            multiple: true,
            leafOnly: true,
            maxTagCount: 1,
            showRestTagsPopover: true,
            restTagsPopoverProps: { mouseEnterDelay: 0, mouseLeaveDelay: 0, motion: false },
            defaultValue: [
                ['Asia', 'China', 'Beijing'],
                ['Asia', 'China', 'Shanghai'],
                ['North America', 'Canada'],
            ],
        });
        expect(getTagTexts()).toEqual(['北京']);
        const plusN = document.querySelector(`.${prefixCls}-selection-n`) as HTMLElement;
        expect(plusN).toHaveTextContent('+2');
        await userEvent.hover(plusN);
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-popover`)).not.toBeNull());
        const popoverTags = Array.from(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-popover .${BASE_CLASS_PREFIX}-tag-content`)).map((node) => node.textContent);
        expect(popoverTags).toEqual(['上海', '加拿大']);
    });

    it('在触发器上按 Escape 关闭已打开的菜单', async () => {
        const onDropdownVisibleChange = spy<'dropdownVisibleChange'>();
        await renderCascader({ onDropdownVisibleChange });
        await click(getSelection());
        expect(isDropdownOpen()).toBe(true);
        await fireEvent.keyDown(getTrigger(), { key: 'Escape' });
        await settle();
        expect(isDropdownOpen()).toBe(false);
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('handle 上暴露 open、close、focus、blur 与 search', async () => {
        const { handle } = await renderCascader({ filterTreeNode: true, searchPosition: 'custom' });
        for (const method of ['open', 'close', 'focus', 'blur', 'search'] as const) {
            expect(typeof handle()[method]).toBe('function');
        }
        await act(() => handle().open());
        await act(() => handle().search('美国'));
        expect(getHighlights()).toHaveLength(1);
        await act(() => handle().close());
        expect(isDropdownOpen()).toBe(false);
    });

    it('多选 v-model 跟随父组件回写的值', async () => {
        const onChange = spy<'change'>();
        await renderStateful({ multiple: true, initialValue: [], onChange });
        await click(getSelection());
        await click(getOption('北美洲'));
        await click(getCheckbox('美国'));
        expect(getTagTexts()).toEqual(['美国']);
        expect(isIndeterminate('北美洲')).toBe(true);
        await click(getCheckbox('加拿大'));
        expect(getTagTexts()).toEqual(['北美洲']);
        expect(isChecked('北美洲')).toBe(true);
        await click(getCheckbox('美国'));
        expect(getTagTexts()).toEqual(['加拿大']);
        expect(onChange.mock.calls.map(([value]) => value)).toEqual([[['North America', 'United States']], [['North America']], [['North America', 'Canada']]]);
    });

    it('单向绑定的多选保持传入的值', async () => {
        const onChange = spy<'change'>();
        await renderCascader({ multiple: true, modelValue: [['North America', 'Canada']], onChange });
        await click(getSelection());
        await click(getOption('北美洲'));
        await click(getCheckbox('美国'));
        expect(onChange).toHaveBeenLastCalledWith([['North America']]);
        expect(getTagTexts()).toEqual(['加拿大']);
        expect(isChecked('美国')).toBe(false);
    });

    it('非受控多选在 treeData 变化时重新计算选中节点', async () => {
        const { rerender } = await renderCascader({ multiple: true });
        await click(getSelection());
        await click(getOption('亚洲'));
        await click(getOption('中国'));
        await click(getCheckbox('北京'));
        await click(getCheckbox('上海'));
        expect(getTagTexts()).toEqual(['亚洲']);
        expect(isChecked('中国')).toBe(true);
        await rerender({
            treeData: addChildren(treeData, 'China', [
                { label: '北京', value: 'Beijing' },
                { label: '上海', value: 'Shanghai' },
                { label: '广州', value: 'Guangzhou' },
            ]),
        });
        expect(getTagTexts()).toEqual(['亚洲']);
        expect(isChecked('广州')).toBe(true);
    });

    it('非受控多选中，子节点全部选中后父节点显示为选中', async () => {
        await renderCascader({ multiple: true, autoMergeValue: false });
        await click(getSelection());
        await click(getOption('亚洲'));
        await click(getOption('中国'));
        await click(getCheckbox('北京'));
        expect(isIndeterminate('中国')).toBe(true);
        await click(getCheckbox('上海'));
        expect(isChecked('中国')).toBe(true);
        expect(getTagTexts()).toEqual(['北京', '上海', '中国', '亚洲']);
    });

    it('禁用节点的标签没有关闭按钮，其余标签照常关闭', async () => {
        const onChange = spy<'change'>();
        await renderCascader({
            treeData: [
                {
                    label: '亚洲',
                    value: 'Asia',
                    children: [
                        { label: '北京', value: 'Beijing', disabled: true },
                        { label: '上海', value: 'Shanghai' },
                    ],
                },
            ],
            multiple: true,
            leafOnly: true,
            onChange,
            defaultValue: [
                ['Asia', 'Beijing'],
                ['Asia', 'Shanghai'],
            ],
        });
        expect(getTagTexts()).toEqual(['北京', '上海']);
        const closeOf = (text: string) =>
            Array.from(document.querySelectorAll(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag`))
                .find((tag) => tag.textContent === text)
                ?.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`) ?? null;
        expect(closeOf('北京')).toBeNull();
        await click(closeOf('上海'));
        expect(getTagTexts()).toEqual(['北京']);
    });

    it('打开两次后仍只保留一个外部点击监听', async () => {
        const onBlur = spy<'blur'>();
        const { handle } = await renderCascader({ onBlur });
        await act(() => handle().open());
        await act(() => handle().open());
        await fireEvent.mouseDown(document.body);
        await settle();
        expect(isDropdownOpen()).toBe(false);
        expect(onBlur).toHaveBeenCalledTimes(1);
        await fireEvent.mouseDown(document.body);
        await settle();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('父组件忽略清空时，单向绑定的多选仍显示传入的值', async () => {
        const onChange = spy<'change'>();
        await renderCascader({ multiple: true, showClear: true, modelValue: [['North America', 'Canada']], onChange });
        await click(document.querySelector(`.${prefixCls}-clearbtn`));
        expect(onChange).toHaveBeenLastCalledWith([]);
        expect(getTagTexts()).toEqual(['加拿大']);
    });

    it('打开状态下卸载后停止监听外部点击', async () => {
        const onBlur = spy<'blur'>();
        const { unmount } = await renderCascader({ onBlur, defaultOpen: true });
        expect(isDropdownOpen()).toBe(true);
        unmount();
        await fireEvent.mouseDown(document.body);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('disabled 时 combobox 不是 Tab 停靠点', async () => {
        await renderCascader({ disabled: true });
        expect(screen.getByRole('combobox')).toHaveAttribute('tabindex', '-1');
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });
});

describe('Cascader 树语义（APG combobox 搭配 tree 弹出层）', () => {
    it('各列组成一棵扁平的树，层级与位置由 aria 属性提供', async () => {
        await renderCascader({ defaultOpen: true });
        await click(getOption('亚洲'));
        const tree = screen.getByRole('tree');
        const asia = within(tree).getByRole('treeitem', { name: '亚洲' });
        expect(asia).toHaveAttribute('aria-expanded', 'true');
        expect(asia).toHaveAttribute('aria-level', '1');
        expect(asia).toHaveAttribute('aria-posinset', '1');
        expect(asia).toHaveAttribute('aria-setsize', '2');
        expect(within(tree).getByRole('treeitem', { name: '北美洲' })).toHaveAttribute('aria-expanded', 'false');
        const china = within(tree).getByRole('treeitem', { name: '中国' });
        expect(china).toHaveAttribute('aria-level', '2');
        expect(china).toHaveAttribute('aria-setsize', '1');
    });

    it('叶子节点没有 aria-expanded；单选时用 aria-selected 标记选中项', async () => {
        await renderCascader({ defaultOpen: true, defaultValue: ['North America', 'Canada'] });
        const canada = await screen.findByRole('treeitem', { name: '加拿大' });
        expect(canada).not.toHaveAttribute('aria-expanded');
        expect(canada).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('treeitem', { name: '美国' })).toHaveAttribute('aria-selected', 'false');
    });

    it('多选时使用 aria-checked，半选为 mixed，复选框的控件对辅助技术隐藏', async () => {
        await renderCascader({ defaultOpen: true, multiple: true, defaultValue: [['Asia', 'China', 'Beijing']] });
        await click(getOption('亚洲'));
        await click(getOption('中国'));
        expect(screen.getByRole('tree')).toHaveAttribute('aria-multiselectable', 'true');
        expect(screen.getByRole('treeitem', { name: '中国' })).toHaveAttribute('aria-checked', 'mixed');
        expect(screen.getByRole('treeitem', { name: '北京' })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('treeitem', { name: '北京' })).not.toHaveAttribute('aria-selected');
        // Vue Checkbox puts aria-hidden and tabindex on its input, the control
        const input = getCheckbox('北京').querySelector('input');
        expect(input).toHaveAttribute('aria-hidden', 'true');
        expect(input).toHaveAttribute('tabindex', '-1');
        expect(within(screen.getByRole('tree')).queryAllByRole('checkbox')).toHaveLength(0);
    });

    it('搜索结果是 option 组成的 listbox', async () => {
        await renderCascader({ defaultOpen: true, filterTreeNode: true });
        await type('美');
        const root = screen.getByRole('combobox');
        expect(root).toHaveAttribute('aria-haspopup', 'listbox');
        expect(document.getElementById(root.getAttribute('aria-controls') ?? '')).toHaveAttribute('role', 'listbox');
        expect(screen.getAllByRole('option')).toHaveLength(2);
    });

    it('#filterItem 的单元素根获得 option 角色、id 与状态，class 参数可与自有 class 合并', async () => {
        await renderCascader(
            { defaultOpen: true, filterTreeNode: true },
            {
                filterItem: ({ class: rowClass, data }: CascaderFilterItemSlotProps) => <div class={[rowClass, 'mine']}>{data.map((item) => item.label).join('-')}</div>,
            }
        );
        await type('北京');
        const option = screen.getByRole('option', { name: '亚洲-中国-北京' });
        expect(option.tagName).toBe('DIV');
        expect(option).toHaveAttribute('aria-selected', 'false');
        expect(option.id).not.toBe('');
        expect(option).toHaveClass('mine', `${prefixCls}-option`);
    });

    it('#filterItem 只给文本或多个根节点时包成 li 渲染', async () => {
        const { unmount } = await renderCascader({ defaultOpen: true, filterTreeNode: true }, { filterItem: ({ data }: CascaderFilterItemSlotProps) => data.map((item) => item.label).join('-') });
        await type('北京');
        const option = screen.getByRole('option', { name: '亚洲-中国-北京' });
        expect(option.tagName).toBe('LI');
        expect(option).toHaveAttribute('aria-selected', 'false');
        expect(option.id).not.toBe('');
        unmount();

        await renderCascader(
            { defaultOpen: true, filterTreeNode: true },
            {
                filterItem: () => (
                    <>
                        <span>a</span>
                        <span>b</span>
                    </>
                ),
            }
        );
        await type('北京');
        const wrapped = screen.getByRole('option', { name: 'ab' });
        expect(wrapped.tagName).toBe('LI');
        expect(wrapped.querySelectorAll('span')).toHaveLength(2);
    });

    it('虚拟列表中 #filterItem 单元素根合并行定位样式', async () => {
        await renderCascader(
            { defaultOpen: true, filterTreeNode: true, virtualizeInSearch: { height: 300, itemSize: 36 } },
            {
                filterItem: ({ data }: CascaderFilterItemSlotProps) => <div style={{ color: 'red' }}>{data.map((item) => item.label).join('-')}</div>,
            }
        );
        await type('北京');
        expect(screen.getByRole('option', { name: '亚洲-中国-北京' })).toHaveStyle({
            position: 'absolute',
            height: '36px',
            color: 'rgb(255, 0, 0)',
        });
    });
});

describe('Cascader 键盘操作', () => {
    it('打开时没有当前选项；Up 与 Down 在列内移动，Home 与 End 移到列的两端', async () => {
        await renderCascader({ defaultOpen: true });
        const root = getTrigger();
        await focus(root);
        expect(root).not.toHaveAttribute('aria-activedescendant');
        await keyboard('{ArrowDown}');
        expect(activeLabel(root)).toBe('亚洲');
        expect(getOption('亚洲')).toHaveClass(`${prefixCls}-option-focused`);
        await keyboard('{End}');
        expect(activeLabel(root)).toBe('北美洲');
        await keyboard('{ArrowDown}');
        expect(activeLabel(root)).toBe('北美洲');
        await keyboard('{Home}');
        expect(activeLabel(root)).toBe('亚洲');
    });

    it('Right 展开分支并移入，Left 返回并收起', async () => {
        await renderCascader({ defaultOpen: true });
        const root = getTrigger();
        await focus(root);
        await keyboard('{ArrowDown}{ArrowDown}{ArrowRight}');
        expect(getOption('北美洲')).toHaveAttribute('aria-expanded', 'true');
        expect(activeLabel(root)).toBe('北美洲');
        await keyboard('{ArrowRight}');
        expect(activeLabel(root)).toBe('美国');
        await keyboard('{ArrowDown}{ArrowLeft}');
        expect(activeLabel(root)).toBe('北美洲');
        expect(getLists()).toHaveLength(2);
        await keyboard('{ArrowLeft}');
        expect(getOption('北美洲')).toHaveAttribute('aria-expanded', 'false');
        expect(getLists()).toHaveLength(1);
    });

    it('在叶子节点上按 Enter 选中，关闭弹出层，焦点保留在 combobox', async () => {
        const onChange = spy<'change'>();
        await renderCascader({ defaultOpen: true, onChange });
        const root = getTrigger();
        await focus(root);
        await keyboard('{End}{ArrowRight}{ArrowRight}{ArrowDown}{Enter}');
        expect(onChange).toHaveBeenCalledWith(['North America', 'Canada']);
        await waitFor(() => expect(isDropdownOpen()).toBe(false));
        expect(root).toHaveFocus();
        expect(root).not.toHaveAttribute('aria-activedescendant');
    });

    it('禁用分支仍可到达，但不会展开', async () => {
        await renderCascader({ defaultOpen: true, treeData: treeDataWithDisabled });
        const root = getTrigger();
        await focus(root);
        await keyboard('{ArrowDown}{ArrowRight}{ArrowRight}');
        expect(activeLabel(root)).toBe('中国');
        await keyboard('{ArrowRight}{Enter}');
        expect(getOption('中国')).toHaveAttribute('aria-expanded', 'false');
        expect(getLists()).toHaveLength(2);
    });

    it('多选：Enter 与 Space 勾选当前选项', async () => {
        const onChange = spy<'change'>();
        await renderCascader({ defaultOpen: true, multiple: true, onChange });
        await focus(getTrigger());
        await keyboard('{End}{Enter}');
        expect(getOption('北美洲')).toHaveAttribute('aria-checked', 'true');
        await keyboard(' ');
        expect(getOption('北美洲')).toHaveAttribute('aria-checked', 'false');
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('RTL 下 Left 展开，Right 返回', async () => {
        await renderWith(Cascader as Component, { treeData, ...commonProps, defaultOpen: true }, {}, { direction: 'rtl' });
        const root = getTrigger();
        await focus(root);
        await keyboard('{ArrowDown}{ArrowLeft}{ArrowLeft}');
        expect(activeLabel(root)).toBe('中国');
        await keyboard('{ArrowRight}');
        expect(activeLabel(root)).toBe('亚洲');
    });

    it('悬停显示另一列后，当前选项被清除', async () => {
        await renderCascader({ defaultOpen: true, showNext: 'hover' });
        const root = getTrigger();
        await focus(root);
        await keyboard('{ArrowDown}{ArrowRight}{ArrowRight}');
        expect(activeLabel(root)).toBe('中国');
        await userEvent.hover(getOption('北美洲'));
        await settle();
        expect(root).not.toHaveAttribute('aria-activedescendant');
    });

    it('搜索输入框文本为空时所有按键都可导航；输入文本后只有 Up、Down 与 Enter 生效', async () => {
        const onChange = spy<'change'>();
        await renderCascader({ defaultOpen: true, filterTreeNode: true, onChange });
        const input = getSelectionInput();
        await focus(input);
        await keyboard('{ArrowDown}{ArrowRight}');
        expect(getOption('亚洲')).toHaveAttribute('aria-expanded', 'true');
        await type('美', input);
        expect(input).not.toHaveAttribute('aria-activedescendant');
        await keyboard('{ArrowDown}{ArrowDown}');
        expect(document.getElementById(input.getAttribute('aria-activedescendant') ?? '')).toHaveTextContent('加拿大');
        await keyboard('{ArrowLeft}{Home}');
        expect(document.getElementById(input.getAttribute('aria-activedescendant') ?? '')).toHaveTextContent('加拿大');
        await keyboard('{Enter}');
        expect(onChange).toHaveBeenCalledWith(['North America', 'Canada']);
    });

    it('搜索无结果时，方向键找不到选项', async () => {
        await renderCascader({ defaultOpen: true, filterTreeNode: true });
        const input = getSelectionInput();
        await type('none', input);
        await keyboard('{ArrowDown}{End}');
        expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    it('多选在触发器上搜索时，TagInput 指向选项，Enter 勾选该选项', async () => {
        const onChange = spy<'change'>();
        await renderCascader({ defaultOpen: true, multiple: true, filterTreeNode: true, onChange });
        const input = getSelectionInput();
        await type('美', input);
        await keyboard('{ArrowDown}');
        expect(document.getElementById(input.getAttribute('aria-activedescendant') ?? '')).toHaveTextContent('美国');
        await keyboard('{Enter}');
        expect(onChange).toHaveBeenCalledWith([['North America', 'United States']]);
    });

    it('输入字符时移动到第一个以这些字符开头的可见选项', async () => {
        await renderCascader({ defaultOpen: true });
        const root = getTrigger();
        await focus(root);
        await keyboard('北');
        expect(activeLabel(root)).toBe('北美洲');
    });

    it('输入字符时在所有可见列中搜索，从当前选项继续', async () => {
        await renderCascader({ defaultOpen: true });
        const root = getTrigger();
        await focus(root);
        await keyboard('{ArrowDown}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}');
        expect(activeLabel(root)).toBe('北京');
        await keyboard('北');
        expect(activeLabel(root)).toBe('北美洲');
        expect(getLists()).toHaveLength(3);
    });

    it('关闭状态的 combobox 输入字符无效，与 Select 一致', async () => {
        await renderWith(Cascader as Component, { treeData });
        const combobox = screen.getByRole('combobox');
        await focus(combobox);
        await keyboard('北');
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    it('在搜索输入框中输入的字符保留在文本中', async () => {
        await renderCascader({ defaultOpen: true, filterTreeNode: true });
        const input = getSelectionInput();
        await focus(input);
        await keyboard('北');
        expect(input).toHaveValue('北');
    });

    it('选项导航用掉的按键也发出 keydown，且只发一次', async () => {
        const onKeydown = spy<'keydown'>();
        await renderCascader({ defaultOpen: true, onKeydown });
        const root = getTrigger();
        await focus(root);
        await keyboard('{ArrowDown}');
        expect(activeLabel(root)).toBe('亚洲');
        expect(onKeydown).toHaveBeenCalledTimes(1);
        expect(onKeydown.mock.calls[0][0].key).toBe('ArrowDown');
    });

    it('关闭的 combobox 上按 ArrowDown 或 ArrowUp 打开', async () => {
        await renderWith(Cascader as Component, { treeData });
        const combobox = screen.getByRole('combobox');
        await focus(combobox);
        await keyboard('{ArrowDown}');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        await keyboard('{Escape}');
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
        await keyboard('{ArrowUp}');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });

    it('不可搜索时关闭的 combobox 上按 Space 打开，Home 与 End 打开并移到首列的两端', async () => {
        await renderWith(Cascader as Component, { treeData });
        const combobox = screen.getByRole('combobox');
        await focus(combobox);
        await keyboard(' ');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        expect(combobox).not.toHaveAttribute('aria-activedescendant');
        await keyboard('{Escape}{End}');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        expect(activeLabel(combobox)).toBe('北美洲');
        await keyboard('{Escape}{Home}');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        expect(activeLabel(combobox)).toBe('亚洲');
    });

    it('可搜索时关闭状态的 Space 留给搜索输入框', async () => {
        await renderWith(Cascader as Component, { multiple: true, filterTreeNode: true, treeData });
        const input = screen.getByRole('combobox');
        await focus(input);
        await keyboard(' ');
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(input).toHaveValue(' ');
    });

    it('触发器中的搜索输入框作为 combobox（ARIA 1.2）', async () => {
        const { unmount } = await renderWith(Cascader as Component, {
            defaultValue: ['Asia', 'China', 'Beijing'],
            filterTreeNode: true,
            treeData,
        });
        expect(screen.getByRole('combobox', { name: en_US.Cascader.label })).toHaveTextContent('亚洲 / 中国 / 北京');
        await click(screen.getByRole('combobox'));
        const input = screen.getByRole('combobox', { name: en_US.Cascader.label });
        expect(input).toBe(getSelectionInput());
        expect(input).toHaveAttribute('aria-autocomplete', 'list');
        expect(input).toHaveAttribute('aria-expanded', 'true');
        expect(getTrigger()).not.toHaveAttribute('aria-expanded');
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(getTrigger()).not.toHaveAttribute('aria-describedby');
        expect(input).toHaveAccessibleDescription('亚洲 / 中国 / 北京');

        await type('美国{ArrowDown}', input);
        await keyboard('{Enter}');
        expect(getSelectionText()).toBe('北美洲 / 美国');
        expect(screen.getByRole('combobox')).toBe(getTrigger());
        expect(getTrigger()).toHaveFocus();
        unmount();

        await renderWith(Cascader as Component, { multiple: true, filterTreeNode: true, treeData });
        expect(screen.getByRole('combobox')).toBe(getSelectionInput());
        expect(getTrigger()).toHaveAttribute('tabindex', '-1');
        expect(getTrigger()).not.toHaveAttribute('role');
    });
});

describe('Cascader 审计修复', () => {
    const otherTreeData: CascaderData[] = [{ label: '南极洲', value: 'Antarctica', children: [] }];

    it('受控单选可搜索时选中叶子，父组件回写值后 #trigger 收到新文本', async () => {
        const trigger = vi.fn<(scope: CascaderTriggerSlotProps) => VNodeChild>(() => <span>trigger</span>);
        await renderStateful({ initialValue: ['Asia', 'China', 'Shanghai'], defaultOpen: true, filterTreeNode: true }, { trigger });
        await click(screen.getByText('北京'));
        expect(trigger.mock.lastCall?.[0].inputValue).toBe('亚洲 / 中国 / 北京');
    });

    it('非受控单选的已选路径被 treeData 移除后，不显示内部分隔键', async () => {
        const { rerender } = await renderCascader({ defaultValue: ['Asia', 'China', 'Beijing'] });
        expect(getSelectionText()).toBe('亚洲 / 中国 / 北京');
        await rerender({ treeData: otherTreeData });
        expect(getSelectionText()).not.toContain('SEMI_CASCADER_SPLIT');
        expect(getSelectionText()).toContain('Beijing');
    });

    it('未加载的多级 defaultValue 在 treeData 更新后仍显示完整路径，子节点加载后恢复标签', async () => {
        const loadData = vi.fn<() => Promise<void>>();
        const { rerender } = await renderCascader({
            defaultValue: ['a', 'x'],
            loadData,
            treeData: [{ label: 'A', value: 'a', isLeaf: false }],
        });
        const before = getSelectionText();
        await rerender({ treeData: [{ label: 'A', value: 'a', isLeaf: false, extra: 1 }] });
        expect(getSelectionText()).toBe(before);
        await rerender({
            treeData: [{ label: 'A', value: 'a', children: [{ label: 'X', value: 'x', isLeaf: true }] }],
        });
        expect(getSelectionText()).toBe('A / X');
    });

    it('值含空格的缺失路径在 treeData 变化后不被截断', async () => {
        const { rerender } = await renderCascader({ defaultValue: ['a b'], treeData: [{ label: 'A', value: 'a' }] });
        const before = getSelectionText();
        expect(before).toContain('a b');
        await rerender({
            treeData: [
                { label: 'A', value: 'a' },
                { label: 'C', value: 'c' },
            ],
        });
        expect(getSelectionText()).toBe(before);
    });

    it.each([
        ['不可搜索时在触发器上', {}, getTrigger],
        ['单选可搜索且关闭时在触发器上', { filterTreeNode: true }, getTrigger],
        ['多选可搜索时在输入框上', { multiple: true, filterTreeNode: true }, getSelectionInput],
    ])('handle 的 focus 与 blur 移动 DOM 焦点：%s', async (_, props, target) => {
        const { handle } = await renderCascader(props);
        await act(() => handle().focus());
        expect(target()).toHaveFocus();
        await act(() => handle().blur());
        expect(target()).not.toHaveFocus();
    });

    it('多选关闭全部标签后，清除按钮随之消失', async () => {
        await renderCascader({ multiple: true, showClear: true, defaultValue: [['North America', 'Canada']] });
        expect(getTagTexts()).toEqual(['加拿大']);
        await click(document.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
        expect(getTagTexts()).toEqual([]);
        expect(document.querySelector(`.${prefixCls}-clearbtn`)).toBeNull();
    });

    it('多选受控值改为空数组后，清除按钮随之消失', async () => {
        const { rerender } = await renderCascader({
            multiple: true,
            modelValue: [['North America', 'Canada']],
            showClear: true,
        });
        expect(document.querySelector(`.${prefixCls}-clearbtn`)).not.toBeNull();
        await rerender({ modelValue: [] });
        expect(document.querySelector(`.${prefixCls}-clearbtn`)).toBeNull();
    });

    it('多选受控值只有不在当前 treeData 的路径时显示清除按钮，点击后 change 为 []', async () => {
        const onChange = spy<'change'>();
        await renderCascader({ multiple: true, modelValue: [['a']], showClear: true, treeData: otherTreeData, onChange });
        await click(screen.getByRole('button', { name: clearName }));
        expect(onChange).toHaveBeenCalledWith([]);
    });

    it('多选 defaultValue 为 0 时选中 value 为 0 的节点', async () => {
        await renderCascader({
            multiple: true,
            defaultValue: 0,
            treeData: [
                { label: 'Zero', value: 0 },
                { label: 'One', value: 1 },
            ],
        });
        expect(getTagTexts()).toEqual(['Zero']);
    });

    it('非受控多选（unRelated）：勾选的节点被 treeData 移除后再勾选，change 不含空路径', async () => {
        const onChange = spy<'change'>();
        const props = { multiple: true, checkRelation: 'unRelated', defaultOpen: true, onChange };
        const { rerender } = await renderCascader({
            ...props,
            treeData: [
                { label: 'A', value: 'a' },
                { label: 'B', value: 'b' },
            ],
        });
        await click(getCheckbox('A'));
        await rerender({
            ...props,
            treeData: [
                { label: 'B', value: 'b' },
                { label: 'C', value: 'c' },
            ],
        });
        await click(getCheckbox('C'));
        expect(onChange).toHaveBeenLastCalledWith([['c']]);
    });

    it('非受控多选：defaultValue 中 treeData 晚到的路径在到达前不显示，到达后勾选', async () => {
        const onChange = spy<'change'>();
        const props = { multiple: true, showClear: true, placeholder: '请选择', defaultValue: [['a']], onChange };
        const { rerender } = await renderCascader({
            ...props,
            treeData: [
                { label: 'B', value: 'b' },
                { label: 'C', value: 'c' },
            ],
        });
        expect(getSelectionText()).toBe('请选择');
        expect(screen.queryByRole('button', { name: clearName })).toBeNull();
        await rerender({
            ...props,
            treeData: [
                { label: 'A', value: 'a' },
                { label: 'B', value: 'b' },
            ],
        });
        expect(getTagTexts()).toEqual(['A']);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('多选没有选中值时，清除按钮只清空搜索文字，不发出 change', async () => {
        const onChange = spy<'change'>();
        const onSearch = spy<'search'>();
        await renderCascader({ defaultOpen: true, multiple: true, filterTreeNode: true, showClear: true, onChange, onSearch });
        await type('北');
        await click(screen.getByRole('button', { name: clearName }));
        expect(getSelectionInput()).toHaveValue('');
        expect(onChange).not.toHaveBeenCalled();
        expect(onSearch).toHaveBeenLastCalledWith('');
    });

    it('受控单选 modelValue 改为分支路径（未开 changeOnSelect）时显示 placeholder', async () => {
        const { rerender } = await renderCascader({ placeholder: '请选择', modelValue: ['Asia', 'China', 'Beijing'] });
        expect(getSelectionText()).toBe('亚洲 / 中国 / 北京');
        await rerender({ placeholder: '请选择', modelValue: ['Asia', 'China'] });
        expect(getSelectionText()).toBe('请选择');
    });
});

describe('Cascader Vue', () => {
    it('V1 单选 v-model：选中叶子后父组件值为路径，父组件改值后文本更新', async () => {
        const { handle } = await renderStateful({ defaultOpen: true });
        await click(getOption('北美洲'));
        await click(getOption('美国'));
        expect(handle().value).toEqual(['North America', 'United States']);
        await act(() => {
            handle().value = ['Asia', 'China', 'Beijing'];
        });
        expect(getSelectionText()).toBe('亚洲 / 中国 / 北京');
    });

    it('V2 多选 v-model：勾选、删标签、清除后父组件值同步', async () => {
        const { handle } = await renderStateful({ multiple: true, showClear: true });
        await click(getSelection());
        await click(getOption('北美洲'));
        await click(getCheckbox('美国'));
        expect(handle().value).toEqual([['North America', 'United States']]);
        await click(document.querySelector(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag-close`));
        expect(handle().value).toEqual([]);
        expect(isDropdownOpen()).toBe(true);
        await click(getCheckbox('加拿大'));
        expect(handle().value).toEqual([['North America', 'Canada']]);
        await click(screen.getByRole('button', { name: clearName }));
        expect(handle().value).toEqual([]);
        expect(getTagTexts()).toEqual([]);
    });

    it('V4 modelValue 改回 undefined 后可非受控选择', async () => {
        const { rerender } = await renderCascader({ modelValue: ['Asia', 'China', 'Beijing'], placeholder: 'pick' });
        await rerender({ modelValue: undefined });
        expect(getSelectionText()).toBe('pick');
        await click(getSelection());
        await click(getOption('北美洲'));
        await click(getOption('美国'));
        expect(getSelectionText()).toBe('北美洲 / 美国');
    });

    it('V6 attrs 落点：单选搜索中 aria 移到输入框，id、data-*、class、style 留在根', async () => {
        await renderCascader({
            filterTreeNode: true,
            'aria-label': 'Region',
            'aria-describedby': 'help',
            id: 'region',
            'data-testid': 'cascader',
            class: 'mine',
            style: { color: 'red' },
            mouseEnterDelay: 5,
            dropdownClassName: 'drop',
        });
        const root = getTrigger();
        expect(root).toHaveAttribute('id', 'region');
        expect(root).toHaveAttribute('data-testid', 'cascader');
        expect(root).toHaveClass('mine');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(root).toHaveAttribute('mouseenterdelay', '5');
        await click(root);
        const input = getSelectionInput();
        expect(screen.getByRole('combobox')).toBe(input);
        expect(input).toHaveAttribute('aria-label', 'Region');
        expect(input.getAttribute('aria-describedby')?.split(' ')).toHaveLength(2);
        expect(input.getAttribute('aria-describedby')?.split(' ')[0]).toBe('help');
        expect(root).not.toHaveAttribute('aria-label');
        expect(root).toHaveAttribute('id', 'region');
        const popup = document.querySelector(`.${prefixCls}-popover`);
        expect(popup).toHaveClass('drop');
        expect(popup).not.toHaveClass('mine');
        expect(screen.getByRole('tree')).toHaveAccessibleName('Region');
    });

    it('V6 attrs 落点：多选可搜索时 aria 在 TagInput 的输入框上', async () => {
        await renderCascader({
            multiple: true,
            filterTreeNode: true,
            'aria-label': 'Region',
            'aria-required': true,
            id: 'region',
        });
        const input = getSelectionInput();
        expect(screen.getByRole('combobox')).toBe(input);
        expect(input).toHaveAttribute('aria-label', 'Region');
        expect(input).toHaveAttribute('aria-required', 'true');
        expect(getTrigger()).toHaveAttribute('id', 'region');
        expect(getTrigger()).not.toHaveAttribute('aria-label');
    });

    it('V7 声明的 change 不收到搜索框的原生 change', async () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        await renderCascader({ filterTreeNode: true, defaultOpen: true, onChange });
        const input = getSelectionInput();
        await type('北', input);
        await fireEvent.change(input);
        await settle();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('V7 focus 与 blur 只在打开、关闭时各发一次，Tab 进出不发', async () => {
        const onFocus = spy<'focus'>();
        const onBlur = spy<'blur'>();
        await renderCascader({ onFocus, onBlur });
        await userEvent.tab();
        expect(getTrigger()).toHaveFocus();
        expect(onFocus).not.toHaveBeenCalled();
        await keyboard('{Enter}');
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
        await keyboard('{ArrowDown}{End}{ArrowRight}{ArrowRight}{Enter}');
        expect(isDropdownOpen()).toBe(false);
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);
        await userEvent.tab();
        await settle();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('V8 #label 只在列视图选项行调用，回显、标签与搜索结果仍是文本', async () => {
        const label = vi.fn<(scope: CascaderLabelSlotProps) => VNodeChild>(({ item }) => <em class="custom-label">{item.label}</em>);
        const { unmount } = await renderCascader({ defaultOpen: true }, { label });
        expect(label).toHaveBeenCalledWith({ item: treeData[0] });
        expect(screen.getByRole('treeitem', { name: '亚洲' }).querySelector('em.custom-label')).toHaveTextContent('亚洲');
        await click(screen.getByRole('treeitem', { name: '北美洲' }));
        await click(screen.getByRole('treeitem', { name: '美国' }));
        expect(getSelection().querySelector('em')).toBeNull();
        expect(getSelectionText()).toBe('北美洲 / 美国');
        unmount();

        const { unmount: unmount2 } = await renderCascader({ multiple: true, defaultValue: [['North America', 'Canada']] }, { label });
        expect(getTagTexts()).toEqual(['加拿大']);
        expect(getSelection().querySelector('em')).toBeNull();
        unmount2();

        await renderCascader({ filterTreeNode: true, defaultOpen: true }, { label });
        await type('美');
        expect(document.querySelector(`.${prefixCls}-option-lists em`)).toBeNull();
        expect(getHighlights()).toHaveLength(3);
    });

    it('V10 #display 渲染为空时显示 placeholder', async () => {
        await renderCascader({ defaultValue: ['Asia', 'China', 'Beijing'], placeholder: 'pick' }, { display: () => [] });
        expect(getSelectionText()).toBe('pick');
        expect(getSelection().querySelector(`.${prefixCls}-selection-placeholder`)).not.toBeNull();
    });

    it.each([
        ['不可搜索', {}],
        ['可搜索（TagInput）', { filterTreeNode: true }],
    ])('V10 %s时 #tag 的 onClose 删除该项并发出 change', async (_, props) => {
        const onChange = spy<'change'>();
        await renderCascader(
            { multiple: true, defaultValue: [['North America', 'Canada']], onChange, ...props },
            {
                tag: ({ entity, onClose }: CascaderTagSlotProps) => (
                    <button type="button" class="my-tag" onClick={() => onClose()}>
                        {entity.data.label}
                    </button>
                ),
            }
        );
        await click(screen.getByRole('button', { name: '加拿大' }));
        expect(onChange).toHaveBeenCalledWith([]);
        expect(document.querySelector('.my-tag')).toBeNull();
    });

    it('V11 #trigger 参数：单选 value 为位置，收起时 inputValue 为已选文本，onSearch 与 onClear 生效，没有 onChange', async () => {
        const onSearch = spy<'search'>();
        const onChange = spy<'change'>();
        const trigger = vi.fn<(scope: CascaderTriggerSlotProps) => VNodeChild>(() => <span>trigger</span>);
        const { handle } = await renderCascader({ defaultValue: ['Asia', 'China', 'Beijing'], filterTreeNode: true, onSearch, onChange }, { trigger });
        const scope = () => trigger.mock.lastCall?.[0] as CascaderTriggerSlotProps;
        expect(scope().value).toBe('0-0-0');
        await act(() => handle().open());
        await act(() => handle().close());
        expect(scope().inputValue).toBe('亚洲 / 中国 / 北京');
        expect(scope().disabled).toBe(false);
        expect(scope()).not.toHaveProperty('onChange');
        await act(() => scope().onClear());
        expect(onChange).toHaveBeenLastCalledWith([]);
        expect(scope().value).toBeUndefined();
        await act(() => scope().onSearch('北'));
        expect(onSearch).toHaveBeenLastCalledWith('北');
        expect(scope().inputValue).toBe('北');
    });

    it('V12 就地修改响应式 treeData：新增子节点后出现新列', async () => {
        const data = ref<CascaderData[]>(structuredClone(asyncTreeData));
        await renderWith(defineComponent(() => () => <Cascader treeData={data.value} defaultOpen motion={false} />));
        await act(() => {
            data.value[1].children = [{ label: 'Node2 - 1', value: 'Node2-1' }];
        });
        await click(getOption('Node2'));
        expect(getLists()).toHaveLength(2);
        expect(getOption('Node2 - 1')).toBeInTheDocument();
    });

    it('V12 loadData 里就地修改再 resolve，展开的路径不收起', async () => {
        await renderStateful({ initialData: structuredClone(asyncTreeData), load: loadTwo, inPlace: true });
        await click(getSelection());
        await click(getOption('Node1'));
        await waitFor(() => expect(getLists()).toHaveLength(2));
        expect(getOption('Node1')).toHaveClass(`${prefixCls}-option-active`);
        expect(getOption('Node1 - 1')).toBeInTheDocument();
    });

    it('V12 多选下就地追加子节点后勾选状态正确', async () => {
        const { handle } = await renderStateful({
            multiple: true,
            initialData: structuredClone(treeData),
            initialValue: [['Asia']],
        });
        await act(() => {
            handle().data[0].children?.[0].children?.push({ label: '广州', value: 'Guangzhou' });
        });
        await click(getSelection());
        await click(getOption('亚洲'));
        await click(getOption('中国'));
        expect(getCheckbox('广州')).toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-checked`);
    });

    it('V13 父组件每次渲染传入等值的新 treeData，已展开的列与已选值不被重置', async () => {
        const { rerender } = await renderCascader({ defaultOpen: true, defaultValue: ['North America', 'Canada'] });
        await click(getOption('亚洲'));
        await click(getOption('中国'));
        expect(getLists()).toHaveLength(3);
        await rerender({ treeData: structuredClone(treeData) });
        expect(getLists()).toHaveLength(3);
        expect(getOption('亚洲')).toHaveClass(`${prefixCls}-option-active`);
        expect(getSelectionText()).toBe('北美洲 / 加拿大');
    });

    it('V14 KeepAlive 切走再切回后弹层关闭，发 dropdownVisibleChange(false)，不发 blur', async () => {
        const shown = ref(true);
        const onBlur = spy<'blur'>();
        const onDropdownVisibleChange = spy<'dropdownVisibleChange'>();
        const Other = defineComponent({ render: () => <div>other</div> });
        render(() => (
            <ConfigProvider locale={en_US}>
                {() => (
                    <KeepAlive>
                        {{
                            default: () => (shown.value ? <Cascader treeData={treeData} motion={false} defaultOpen onBlur={onBlur} onDropdownVisibleChange={onDropdownVisibleChange} /> : <Other />),
                        }}
                    </KeepAlive>
                )}
            </ConfigProvider>
        ));
        await settle();
        expect(isDropdownOpen()).toBe(true);
        shown.value = false;
        await settle();
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        shown.value = true;
        await settle();
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
        expect(isDropdownOpen()).toBe(false);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('V15 模板的 kebab-case 与布尔简写生效', async () => {
        const { handle } = await renderWith<{ value: CascaderValue | undefined }>(Kebab, { data: treeData });
        expect(screen.getByRole('combobox')).toBe(getSelectionInput());
        await click(getSelection());
        await click(getOption('亚洲'));
        await click(getOption('中国'));
        await click(getCheckbox('北京'));
        expect(getTagTexts()).toEqual(['北京']);
        const china = treeData[0].children?.[0];
        expect(handle().value).toEqual([[treeData[0], china, china?.children?.[0]]]);
        expect(screen.getByRole('button', { name: clearName })).toBeInTheDocument();
    });

    it('V16 #emptyContent 插槽替换空状态；空的 #expandIcon、#clearIcon 回落默认图标', async () => {
        const { unmount } = await renderCascader({ treeData: [], defaultOpen: true }, { emptyContent: () => <b>nothing</b> });
        expect(document.querySelector(`.${prefixCls}-option-empty b`)).toHaveTextContent('nothing');
        unmount();

        await renderCascader({ defaultOpen: true, showClear: true, defaultValue: ['Asia', 'China', 'Beijing'] }, { expandIcon: () => [], clearIcon: () => [] });
        expect(document.querySelectorAll(`.${prefixCls}-option-icon-expand`)).toHaveLength(3);
        expect(screen.getByRole('button', { name: clearName }).querySelector(`.${BASE_CLASS_PREFIX}-icon-clear`)).not.toBeNull();
    });

    it('keydown 先发出再处理：Escape 的 keydown 在 dropdownVisibleChange 之前', async () => {
        const order: string[] = [];
        await renderCascader({
            defaultOpen: true,
            onKeydown: (event: KeyboardEvent) => order.push(`keydown:${event.key}`),
            onDropdownVisibleChange: (visible: boolean) => order.push(`visible:${visible}`),
        });
        order.length = 0;
        await focus(getTrigger());
        await keyboard('{Escape}');
        expect(order).toEqual(['keydown:Escape', 'visible:false']);
    });

    it('keydown 里 preventDefault 不阻止 Cascader 处理，但阻止输入框写入字符', async () => {
        const prevent = (event: KeyboardEvent) => event.preventDefault();
        const { unmount } = await renderCascader({ defaultOpen: true, onKeydown: prevent });
        const root = getTrigger();
        await focus(root);
        await keyboard('{ArrowDown}');
        expect(activeLabel(root)).toBe('亚洲');
        unmount();

        await renderCascader({ defaultOpen: true, filterTreeNode: true, onKeydown: prevent });
        const input = getSelectionInput();
        await focus(input);
        await keyboard('北');
        expect(input).toHaveValue('');
    });

    it('keydown 里 stopPropagation 时搜索框内的 Escape 不再关闭下拉，方向键仍移动选项', async () => {
        const stop = (event: KeyboardEvent) => event.stopPropagation();
        await renderCascader({ defaultOpen: true, filterTreeNode: true, onKeydown: stop });
        await focus(getSelectionInput());
        await keyboard('{ArrowDown}');
        expect(activeLabel(getSelectionInput())).toBe('亚洲');
        await keyboard('{Escape}');
        expect(isDropdownOpen()).toBe(true);
    });

    it('面板内嵌套 Popover 里按下鼠标不关闭面板，在 body 上按下才关闭', async () => {
        const nested = () => (
            <Popover trigger="custom" visible motion={false}>
                {{
                    default: () => <span>nested anchor</span>,
                    content: () => <button type="button">inside nested</button>,
                }}
            </Popover>
        );
        await renderCascader({ defaultOpen: true }, { topSlot: nested });
        await fireEvent.mouseDown(screen.getByRole('button', { name: 'inside nested' }));
        expect(isDropdownOpen()).toBe(true);
        await fireEvent.mouseDown(document.body);
        await waitFor(() => expect(isDropdownOpen()).toBe(false));
    });

    it('不可搜索时 keydown 里 stopPropagation 后，trigger 上的 ArrowDown 不打开下拉', async () => {
        const stop = (event: KeyboardEvent) => event.stopPropagation();
        await renderCascader({ onKeydown: stop });
        await focus(getTrigger());
        await keyboard('{ArrowDown}');
        expect(isDropdownOpen()).toBe(false);
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
    });
});
