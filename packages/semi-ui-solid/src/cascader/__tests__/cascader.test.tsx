import { type JSX, For, createSignal, onMount } from 'solid-js';
import { fireEvent, render, screen, waitFor, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import type { Virtualize } from '@fibrae/semi-foundation/cascader/foundation';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import Cascader, { type CascaderData, type CascaderElement, type CascaderProps, type Entity, type FilterRenderProps, type SimpleValueType, type TriggerRenderProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import { type FormApi, Form, FormCascader } from '../../form';
import { InputGroup } from '../../input';
import Popover from '../../popover';
import Tag from '../../tag';

const prefixCls = `${BASE_CLASS_PREFIX}-cascader`;

type Props = Record<string, unknown>;

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
                    {
                        label: '北京',
                        value: 'Beijing',
                        key: 'beijing',
                    },
                    {
                        label: '上海',
                        value: 'Shanghai',
                        key: 'shanghai',
                    },
                ],
            },
        ],
    },
    {
        label: '北美洲',
        value: 'North America',
        key: 'North America',
        children: [
            {
                label: '美国',
                value: 'United States',
                key: 'United States',
            },
            {
                label: '加拿大',
                value: 'Canada',
                key: 'Canada',
            },
        ],
    },
];

const [asia, northAmerica] = treeData;
const china = asia.children?.[0] as CascaderData;
const beijing = china.children?.[0] as CascaderData;
const unitedStates = northAmerica.children?.[0] as CascaderData;

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
                    {
                        label: '北京',
                        value: 'Beijing',
                        key: 'beijing',
                    },
                    {
                        label: '上海',
                        value: 'Shanghai',
                        key: 'shanghai',
                    },
                ],
            },
            {
                label: '韩国',
                value: 'Hanguo',
                key: 'hanguo',
            },
        ],
    },
];

const renderStrong = (item: CascaderData) => <strong>{item.label}</strong>;

const asyncTreeData: CascaderData[] = [
    { label: 'Node1', value: '0-0' },
    { label: 'Node2', value: '0-1' },
    { label: 'Node3', value: '0-2', isLeaf: true },
];

const addChildren = (list: CascaderData[], value: SimpleValueType, children: CascaderData[]): CascaderData[] =>
    list.map((node) => {
        if (node.value === value) {
            return { ...node, children };
        }
        return node.children ? { ...node, children: addChildren(node.children, value, children) } : node;
    });

function createAsyncTreeData() {
    const [data, setData] = createSignal(asyncTreeData);
    const loadData = (selectedOpt: CascaderData[]) => {
        const { label, value, children } = selectedOpt[selectedOpt.length - 1];
        if (!children) {
            setData((origin) =>
                addChildren(origin, value, [
                    { label: `${label as string} - 1`, value: `${label as string}-1`, isLeaf: true },
                    { label: `${label as string} - 2`, value: `${label as string}-2`, isLeaf: true },
                ])
            );
        }
        return Promise.resolve();
    };
    return [data, loadData] as const;
}

// a later rerender replaces every prop but treeData and motion, as React's rerender does
function renderCascader(initial: Props = {}) {
    const [props, setProps] = createSignal(initial);
    const result = render(() => <Cascader treeData={treeData} motion={false} {...(props() as CascaderProps<boolean>)} />);
    return { ...result, rerender: (next: Props) => setProps(next) };
}

const getTrigger = () => document.querySelector(`.${prefixCls}`) as HTMLElement;
const getSelection = () => document.querySelector(`.${prefixCls}-selection`) as HTMLElement;
const getSelectionText = () => getSelection().textContent;
const getSelectionInput = () => getSelection().querySelector('input') as HTMLInputElement;
const getLists = () => document.querySelectorAll(`.${prefixCls}-option-list`);
const getListOptions = (listIndex: number) => getLists()[listIndex].querySelectorAll<HTMLElement>(`li.${prefixCls}-option`);
const getOption = (label: string) => screen.getByText(label, { selector: `.${prefixCls}-option-label > span` }).closest('li') as HTMLElement;
const getCheckbox = (label: string) => getOption(label).querySelector(`.${BASE_CLASS_PREFIX}-checkbox`) as HTMLElement;
const getHighlights = () => document.querySelectorAll(`.${prefixCls}-option-label-highlight`);
const getTagTexts = () => Array.from(document.querySelectorAll(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag-content`)).map((node) => node.textContent);
const isDropdownOpen = () => document.querySelector(`.${prefixCls}-option-lists`) !== null;
const activeLabel = (host: HTMLElement) => document.getElementById(host.getAttribute('aria-activedescendant') as string)?.querySelector(`.${prefixCls}-option-label`)?.textContent;
// the popup unmounts once its layer has closed, a task after the state change
const expectClosed = () => waitFor(() => expect(isDropdownOpen()).toBe(false));

describe('Cascader', () => {
    it('class / style', () => {
        renderCascader({ class: 'test', style: { height: '420px' } });
        expect(getTrigger()).toHaveClass('test');
        expect(getTrigger()).toHaveStyle({ height: '420px' });
    });

    it('带 placeholder', () => {
        renderCascader({ placeholder: 'semi' });
        expect(document.querySelector(`.${prefixCls}-selection-placeholder`)).toHaveTextContent(/^semi$/);
    });

    it('带 validateStatus', () => {
        const { rerender } = renderCascader({});
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-error`);
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-warning`);
        rerender({ validateStatus: 'error' });
        expect(getTrigger()).toHaveClass(`${prefixCls}-error`);
        rerender({ validateStatus: 'warning' });
        expect(getTrigger()).toHaveClass(`${prefixCls}-warning`);
    });

    it('不同 size', () => {
        const { rerender } = renderCascader({});
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-large`);
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-small`);
        rerender({ size: 'large' });
        expect(getTrigger()).toHaveClass(`${prefixCls}-large`);
        rerender({ size: 'small' });
        expect(getTrigger()).toHaveClass(`${prefixCls}-small`);
    });

    it('自定义 prefix / suffix / insetLabel', () => {
        const { unmount } = renderCascader({
            prefix: <div class="prefix">prefix content</div>,
            suffix: <div class="suffix">suffix content</div>,
        });
        expect(document.querySelector(`.${prefixCls}-prefix .prefix`)).toHaveTextContent('prefix content');
        expect(document.querySelector(`.${prefixCls}-suffix .suffix`)).toHaveTextContent('suffix content');
        unmount();
        renderCascader({ insetLabel: 'semi' });
        expect(document.querySelector(`.${prefixCls}-inset-label`)).toHaveTextContent(/^semi$/);
    });

    it('prefix、suffix、insetLabel 为 0 时照常渲染', () => {
        const { unmount } = renderCascader({ prefix: 0, suffix: 0 });
        expect(document.querySelector(`.${prefixCls}-prefix`)).toHaveTextContent(/^0$/);
        expect(document.querySelector(`.${prefixCls}-suffix`)).toHaveClass(`${prefixCls}-suffix-text`);
        expect(document.querySelector(`.${prefixCls}`)).toHaveClass(`${prefixCls}-with-prefix`, `${prefixCls}-with-suffix`);
        unmount();
        renderCascader({ insetLabel: 0 });
        expect(screen.getByRole('combobox')).toHaveAccessibleName('0');
    });

    it('空 data / 空 content', () => {
        const { rerender } = renderCascader({ treeData: [], defaultOpen: true });
        const opt = document.querySelectorAll(`.${prefixCls}-option`);
        expect(opt.length).toEqual(1);
        expect(opt[0]).toHaveClass(`${prefixCls}-option-empty`);
        rerender({ defaultOpen: true, emptyContent: 'test', treeData: [] });
        expect(document.querySelectorAll(`.${prefixCls}-option`)[0].textContent).toEqual('test');
    });

    it('多选且非受控模式下动态变化的 treeData', () => {
        const { rerender } = renderCascader({ defaultValue: 'Asia', multiple: true });
        expect(getTagTexts()).toEqual(['亚洲']);
        rerender({ defaultValue: 'Asia', multiple: true, treeData: treeDataWithDisabled });
        expect(getTagTexts()).toEqual(['亚洲']);
    });

    it('多选受控 value 变回 undefined 时清空，有 defaultValue 也一样', () => {
        const { rerender } = renderCascader({ defaultValue: 'Europe', value: 'Asia', multiple: true });
        expect(getTagTexts()).toEqual(['亚洲']);
        rerender({ defaultValue: 'Europe', multiple: true, value: undefined });
        expect(getTagTexts()).toEqual([]);
    });

    it('多选且受控模式下动态变化的 treeData', () => {
        const { rerender } = renderCascader({ value: 'Asia', multiple: true });
        expect(getTagTexts()).toEqual(['亚洲']);
        rerender({ multiple: true, value: 'Asia', treeData: treeDataWithDisabled });
        expect(getTagTexts()).toEqual(['亚洲']);
    });

    it('defaultOpen', () => {
        renderCascader({ defaultOpen: true });
        expect(document.querySelectorAll(`.${prefixCls}-option-lists`).length).toEqual(1);
        expect(getLists()).toHaveLength(1);
    });

    // jsdom has no layout: only the CSS wiring is checked, the browser resolves `--semi-tooltip-trigger-width` to the trigger width
    it('空数据时下拉最小宽度跟随触发器', () => {
        const wrapper = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-popover-wrapper`) as HTMLElement;
        const { rerender } = renderCascader({ defaultOpen: true, treeData: [] });
        expect(wrapper().style.minWidth).toBe('var(--semi-tooltip-trigger-width)');
        rerender({ defaultOpen: true });
        expect(wrapper().style.minWidth).toBe('');
    });

    it('自定义 dropdownClassName/dropdownStyle', () => {
        renderCascader({
            dropdownClassName: 'test',
            dropdownStyle: { color: 'red' },
            defaultOpen: true,
        });
        const dropdown = document.querySelector(`.${prefixCls}-popover`);
        expect(dropdown).toHaveClass('test');
        expect(dropdown).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('defaultValue', () => {
        renderCascader({ defaultValue: ['Asia', 'China', 'Beijing'], defaultOpen: true });
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 北京');
        expect(getLists()).toHaveLength(3);
        const activeItems = document.querySelectorAll(`.${prefixCls}-option-active`);
        expect(Array.from(activeItems).map((item) => item.textContent)).toEqual(['亚洲', '中国']);
        const selectItem = document.querySelectorAll(`.${prefixCls}-option-select`);
        expect(selectItem).toHaveLength(1);
        expect(selectItem[0].textContent).toEqual('北京');
        expect(selectItem[0].querySelectorAll(`.${BASE_CLASS_PREFIX}-icon`)).toHaveLength(1);
    });

    it('displayProp', () => {
        renderCascader({ defaultValue: ['Asia', 'China', 'Beijing'], displayProp: 'value' });
        expect(getSelectionText()).toEqual('Asia / China / Beijing');
    });

    it('displayRender', () => {
        const spyOnRender = vi.fn<NonNullable<CascaderProps['displayRender']>>(() => undefined);
        const { unmount } = renderCascader({ defaultValue: ['Asia', 'China', 'Beijing'], displayRender: spyOnRender });
        expect(spyOnRender).toHaveBeenCalledWith(['亚洲', '中国', '北京']);
        unmount();

        renderCascader({
            defaultValue: ['Asia', 'China', 'Beijing'],
            displayRender: (list: string[]) => '已选择：' + list.join(' -> '),
        });
        expect(getSelectionText()).toEqual('已选择：亚洲 -> 中国 -> 北京');
    });

    it('不可搜索的单选模式下触发器按 separator 连接 label 文本', () => {
        renderCascader({ defaultValue: ['Asia', 'China', 'Shanghai'], separator: ' - ', renderLabel: renderStrong });
        expect(getSelection().querySelector('strong')).toBeNull();
        expect(getSelection().querySelector('span')?.textContent).toEqual('亚洲 - 中国 - 上海');
    });

    it('renderLabel 渲染打开的列中的选项，触发器显示 label 文本', () => {
        renderCascader({ defaultValue: ['Asia', 'China', 'Shanghai'], defaultOpen: true, renderLabel: renderStrong });
        expect(getListOptions(0)[0].querySelector('strong')).toHaveTextContent('亚洲');
        expect(getListOptions(2)[1].querySelector('strong')).toHaveTextContent('上海');
        expect(getSelection().querySelector('strong')).toBeNull();
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 上海');
    });

    it('treeData 的 label 只接受文本', () => {
        // @ts-expect-error markup for a label goes through renderLabel
        const data: CascaderData = { label: <b>亚洲</b>, value: 'Asia' };
        expect(data.value).toBe('Asia');
        expectTypeOf<Parameters<NonNullable<CascaderProps['renderLabel']>>>().toEqualTypeOf<[item: CascaderData]>();
    });

    it('disabled', async () => {
        renderCascader({ disabled: true });
        expect(getTrigger()).toHaveClass(`${prefixCls}-disabled`);
        await userEvent.click(getSelection());
        expect(isDropdownOpen()).toBe(false);
    });

    it('disabled + defaultValue', () => {
        const { unmount } = renderCascader({
            treeData: treeDataWithDisabled,
            changeOnSelect: true,
            defaultValue: ['Asia', 'China'],
        });
        expect(getSelection().querySelector('span')?.textContent).toEqual('亚洲 / 中国');
        unmount();

        const { unmount: unmount2 } = renderCascader({
            treeData: treeDataWithDisabled,
            changeOnSelect: true,
            filterTreeNode: true,
            defaultValue: ['Asia', 'China'],
        });
        expect(document.querySelector(`.${prefixCls}-search-wrapper span`)?.textContent).toEqual('亚洲 / 中国');
        unmount2();

        const { unmount: unmount3 } = renderCascader({
            treeData: treeDataWithDisabled,
            changeOnSelect: true,
            value: ['Asia', 'China'],
        });
        expect(getSelection().querySelector('span')?.textContent).toEqual('亚洲 / 中国');
        unmount3();

        const { unmount: unmount4 } = renderCascader({
            treeData: treeDataWithDisabled,
            multiple: true,
            defaultValue: ['Asia', 'China'],
        });
        expect(getTagTexts()[0]).toEqual('中国');
        unmount4();

        const { unmount: unmount5 } = renderCascader({
            treeData: treeDataWithDisabled,
            multiple: true,
            filterTreeNode: true,
            defaultValue: ['Asia', 'China'],
        });
        expect(getTagTexts()[0]).toEqual('中国');
        unmount5();

        renderCascader({
            treeData: treeDataWithDisabled,
            multiple: true,
            value: ['Asia', 'China'],
        });
        expect(getTagTexts()[0]).toEqual('中国');
    });

    it('选中选项 / onSelect / onChange', async () => {
        const spyOnSelect = vi.fn<NonNullable<CascaderProps['onSelect']>>();
        const spyOnChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        renderCascader({ defaultOpen: true, onSelect: spyOnSelect, onChange: spyOnChange });
        expect(getLists()).toHaveLength(1);
        await userEvent.click(getListOptions(0)[0]);

        expect(getLists()).toHaveLength(2);
        expect(spyOnSelect).not.toHaveBeenCalled();
        expect(spyOnChange).not.toHaveBeenCalled();
        expect(getListOptions(0)[0]).toHaveClass(`${prefixCls}-option-active`);

        await userEvent.click(getListOptions(1)[0]);
        expect(getLists()).toHaveLength(3);
        expect(spyOnSelect).not.toHaveBeenCalled();
        expect(spyOnChange).not.toHaveBeenCalled();
        expect(getListOptions(1)[0]).toHaveClass(`${prefixCls}-option-active`);

        await userEvent.click(getListOptions(2)[0]);
        expect(spyOnSelect).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnSelect).toHaveBeenCalledWith('Beijing');
        expect(spyOnChange).toHaveBeenCalledWith(['Asia', 'China', 'Beijing']);
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 北京');

        expect(isDropdownOpen()).toBe(false);
        await userEvent.click(getSelection());
        expect(getListOptions(2)[0].querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-tick`)).toHaveLength(1);
    });

    it('filterTreeNode = true 时显示输入框', () => {
        renderCascader({ filterTreeNode: true, searchPlaceholder: 'placeholder' });
        const searchWrapper = document.querySelector(`.${prefixCls}-search-wrapper`);
        expect(searchWrapper).not.toBeNull();
        expect(searchWrapper?.querySelector('span')?.textContent).toEqual('placeholder');
    });

    it('onSearch', async () => {
        const spyOnSearch = vi.fn<NonNullable<CascaderProps['onSearch']>>();
        renderCascader({ filterTreeNode: true, onSearch: spyOnSearch });
        await userEvent.click(getTrigger());
        expect(getSelectionInput()).toHaveFocus();
        await userEvent.paste('semi');
        expect(spyOnSearch).toHaveBeenCalledTimes(1);
        expect(spyOnSearch).toHaveBeenCalledWith('semi');
    });

    it('onSelect + changeOnSelect', async () => {
        const spyOnSelect = vi.fn<NonNullable<CascaderProps['onSelect']>>();
        const spyOnChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        renderCascader({ defaultOpen: true, onSelect: spyOnSelect, onChange: spyOnChange, changeOnSelect: true });
        await userEvent.click(getListOptions(0)[0]);
        expect(spyOnSelect).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnSelect).toHaveBeenCalledWith('Asia');
        expect(spyOnChange).toHaveBeenCalledWith(['Asia']);
        expect(getListOptions(0)[0]).toHaveClass(`${prefixCls}-option-select`);
        expect(getSelectionText()).toEqual('亚洲');

        await userEvent.click(getListOptions(1)[0]);
        expect(spyOnSelect).toHaveBeenLastCalledWith('China');
        expect(spyOnChange).toHaveBeenLastCalledWith(['Asia', 'China']);
        expect(getListOptions(0)[0]).toHaveClass(`${prefixCls}-option-active`);
        expect(getListOptions(1)[0]).toHaveClass(`${prefixCls}-option-select`);
        expect(getSelectionText()).toEqual('亚洲 / 中国');
    });

    it('filterTreeNode 显示正确的结果', async () => {
        renderCascader({ filterTreeNode: true, defaultOpen: true });
        await userEvent.type(getSelectionInput(), '北');
        expect(getHighlights()).toHaveLength(3);
    });

    it('搜索结果与关键字同步渲染，aria-activedescendant 指向已渲染的选项', async () => {
        renderCascader({ filterTreeNode: true, defaultOpen: true });
        const input = getSelectionInput();
        input.focus();
        fireEvent.input(input, { target: { value: '北' } });
        expect(input).toHaveValue('北');
        expect(getHighlights()).toHaveLength(3);
        await userEvent.keyboard('{ArrowDown}');
        const active = document.getElementById(input.getAttribute('aria-activedescendant') as string);
        expect(active).not.toBeNull();
        expect(document.querySelector(`.${prefixCls}-option-lists`)).toContainElement(active);
    });

    it('filterTreeNode + treeNodeFilterProp', async () => {
        renderCascader({ filterTreeNode: true, treeNodeFilterProp: 'value', defaultOpen: true });
        await userEvent.type(getSelectionInput(), 'Bei');
        expect(getHighlights()).toHaveLength(1);
        expect(getHighlights()[0].textContent).toEqual('Bei');
    });

    it('filterTreeNode 无结果', async () => {
        renderCascader({ filterTreeNode: true, defaultOpen: true, emptyContent: 'test' });
        await userEvent.type(getSelectionInput(), 'Bei');
        const opt = document.querySelectorAll(`.${prefixCls}-option`);
        expect(opt).toHaveLength(1);
        expect(opt[0]).toHaveClass(`${prefixCls}-option-empty`);
        expect(opt[0].textContent).toEqual('test');
    });

    it('filterTreeNode 为函数', async () => {
        const filterTreeNode = vi.fn<(inputValue: string, cascaderNode: string) => boolean>((inputValue, cascaderNode) => cascaderNode === inputValue);
        renderCascader({ filterTreeNode, defaultOpen: true });
        await userEvent.type(getSelectionInput(), '北');
        expect(filterTreeNode).toHaveBeenCalled();
        expect(getHighlights()).toHaveLength(0);
        expect(document.querySelector(`.${prefixCls}-option-empty`)).not.toBeNull();
    });

    it('受控：value 显示正确', () => {
        renderCascader({ value: ['Asia', 'China', 'Beijing'] });
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 北京');
    });

    it('父组件挂载时就改了受控 value，显示新路径', () => {
        function Demo() {
            const [value, setValue] = createSignal<SimpleValueType[]>(['Asia', 'China', 'Beijing']);
            onMount(() => setValue(['North America', 'United States']));
            return <Cascader motion={false} treeData={treeData} value={value()} />;
        }
        render(() => <Demo />);
        expect(getSelectionText()).toEqual('北美洲 / 美国');
    });

    it('整体替换 props 时保留触发器且不重复调用 ref', () => {
        const ref = vi.fn<(node: CascaderElement) => void>();
        const [props, setProps] = createSignal<CascaderProps>({ treeData, placeholder: 'a', ref });
        render(() => <Cascader {...props()} />);
        const trigger = getTrigger();
        trigger.focus();
        setProps({ treeData, placeholder: 'b', ref });
        expect(getTrigger()).toBe(trigger);
        expect(trigger).toHaveFocus();
        expect(ref).toHaveBeenCalledTimes(1);
    });

    it('受控：触发 onChange 且界面不更新', async () => {
        const spyOnChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        renderCascader({
            value: ['Asia', 'China', 'Beijing'],
            defaultOpen: true,
            onChange: spyOnChange,
            changeOnSelect: true,
        });
        await userEvent.click(getListOptions(0)[0]);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledWith(['Asia']);
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 北京');
    });

    it('异步加载数据', async () => {
        const then = vi.fn<() => Promise<void>>(() => Promise.resolve());
        // a thenable on purpose: loadData's return value must be handled by the Promise protocol
        const loadData = vi.fn<() => { then: typeof then }>(() => ({ then }));
        const data = { label: '亚洲', value: 'Asia' };
        renderCascader({ loadData, defaultOpen: true, treeData: [data] });
        await userEvent.click(getOption('亚洲'));
        expect(loadData).toHaveBeenCalledWith([data]);
        expect(then).toHaveBeenCalled();
        expect(getOption('亚洲').querySelector(`.${prefixCls}-option-spin-icon`)).not.toBeNull();
    });

    it('选中选项 + onChange + onChangeWithObject', async () => {
        const spyOnChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        renderCascader({ defaultOpen: true, onChange: spyOnChange, onChangeWithObject: true });
        await userEvent.click(getListOptions(0)[0]);
        await userEvent.click(getListOptions(1)[0]);
        await userEvent.click(getListOptions(2)[0]);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledWith([asia, china, beijing]);
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 北京');
        await userEvent.click(getSelection());
        expect(getListOptions(2)[0].querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-tick`)).toHaveLength(1);
    });

    it('选中选项 + onChange + onChangeWithObject + changeOnSelect', async () => {
        const spyOnChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        renderCascader({ defaultOpen: true, onChange: spyOnChange, onChangeWithObject: true, changeOnSelect: true });
        await userEvent.click(getListOptions(0)[0]);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledWith([treeData[0]]);
        expect(getListOptions(0)[0]).toHaveClass(`${prefixCls}-option-select`);
        expect(getSelectionText()).toEqual('亚洲');
    });

    it('受控：对象 value 显示正确', () => {
        renderCascader({ value: [asia, china, beijing], onChangeWithObject: true });
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 北京');
    });

    it('onClear 与 showClear', async () => {
        const spyOnClear = vi.fn<NonNullable<CascaderProps['onClear']>>();
        renderCascader({
            defaultValue: ['Asia', 'China', 'Beijing'],
            showClear: true,
            onClear: spyOnClear,
            placeholder: '请选择所在地区',
        });
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 北京');
        await userEvent.click(document.querySelector(`.${prefixCls}-clearbtn`) as HTMLElement);
        expect(spyOnClear).toHaveBeenCalledTimes(1);
        expect(getSelectionText()).toEqual('请选择所在地区');
    });

    it('清除按钮是具名的原生 button，按 Enter 或 Space 清除且不打开树', async () => {
        for (const key of ['{Enter}', ' ']) {
            const onClear = vi.fn<NonNullable<CascaderProps['onClear']>>();
            const { unmount } = renderCascader({
                defaultValue: ['Asia', 'China', 'Beijing'],
                showClear: true,
                placeholder: 'pick',
                onClear,
            });
            await userEvent.tab();
            expect(getTrigger()).toHaveFocus();
            await userEvent.tab();
            const clear = screen.getByRole('button', { name: zh_CN.Cascader.clear });
            expect(clear).toHaveFocus();
            expect(clear).toHaveAttribute('type', 'button');
            await userEvent.keyboard(key);
            expect(onClear).toHaveBeenCalledTimes(1);
            expect(getSelectionText()).toEqual('pick');
            expect(screen.queryByRole('button', { name: zh_CN.Cascader.clear })).toBeNull();
            expect(getTrigger()).toHaveFocus();
            expect(isDropdownOpen()).toBe(false);
            unmount();
        }
    });

    it('树展开时在清除按钮上按 Enter 仍会清除', async () => {
        renderCascader({ defaultValue: ['Asia', 'China', 'Beijing'], showClear: true, placeholder: 'pick' });
        await userEvent.tab();
        await userEvent.keyboard('{Enter}');
        expect(isDropdownOpen()).toBe(true);
        await userEvent.tab();
        expect(screen.getByRole('button', { name: zh_CN.Cascader.clear })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(getSelectionText()).toEqual('pick');
        expect(getTrigger()).toHaveFocus();
    });

    it('搜索输入框作为 combobox 时，清除后焦点回到输入框', async () => {
        render(() => <Cascader defaultValue={[['Asia', 'China', 'Beijing']]} multiple filterTreeNode showClear treeData={treeData} />);
        const input = screen.getByRole('combobox');
        expect(input.tagName).toBe('INPUT');
        input.focus();
        await userEvent.tab();
        expect(screen.getByRole('button', { name: zh_CN.Cascader.clear })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(getTagTexts()).toEqual([]);
        expect(input).toHaveFocus();
    });

    it('filterLeafOnly = false', async () => {
        renderCascader({ filterTreeNode: true, defaultOpen: true, filterLeafOnly: false });
        await userEvent.type(getSelectionInput(), '亚');
        expect(getHighlights()).toHaveLength(4);
    });

    it('showNext', async () => {
        const { unmount } = renderCascader({ showNext: 'hover' });
        await userEvent.click(getSelection());
        expect(getLists()).toHaveLength(1);
        fireEvent.mouseEnter(getListOptions(0)[0]);
        expect(getLists()).toHaveLength(2);
        unmount();

        renderCascader({ showNext: 'click' });
        await userEvent.click(getSelection());
        expect(getLists()).toHaveLength(1);
        fireEvent.mouseEnter(getListOptions(0)[0]);
        expect(getLists()).toHaveLength(1);
        await userEvent.click(getListOptions(0)[0]);
        expect(getLists()).toHaveLength(2);
    });

    it('disableStrictly', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        const { unmount } = renderCascader({
            showNext: 'hover',
            treeData: treeDataWithDisabled,
            disableStrictly: true,
            multiple: true,
            onChange,
        });
        expect(getTagTexts()).toEqual([]);
        await userEvent.click(getSelection());
        fireEvent.mouseEnter(getOption('亚洲'));
        expect(getCheckbox('中国')).toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-disabled`);
        await userEvent.click(getCheckbox('亚洲'));
        expect(onChange).toHaveBeenLastCalledWith([['Asia', 'Hanguo']]);
        expect(getTagTexts()).toEqual(['韩国']);
        expect(getCheckbox('亚洲')).toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-indeterminate`);
        unmount();

        const onChange2 = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        renderCascader({ showNext: 'hover', treeData: treeDataWithDisabled, multiple: true, onChange: onChange2 });
        expect(getTagTexts()).toEqual([]);
        await userEvent.click(getSelection());
        await userEvent.click(getCheckbox('亚洲'));
        expect(onChange2).toHaveBeenLastCalledWith([['Asia']]);
        expect(getTagTexts()).toEqual(['亚洲']);
        expect(getCheckbox('亚洲')).toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-checked`);
    });

    it('多选 + onChangeWithObject', () => {
        const northAmerica = treeData[1];
        renderCascader({
            multiple: true,
            onChangeWithObject: true,
            defaultValue: [northAmerica, unitedStates],
        });
        expect(getTagTexts()).toEqual(['美国']);
    });

    it('多选 enableLeafClick', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        renderCascader({
            multiple: true,
            enableLeafClick: true,
            onChange,
            treeData: [
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
            ],
        });
        await userEvent.click(getSelection());
        await userEvent.click(getCheckbox('南美洲'));
        expect(getTagTexts()).toEqual(['南美洲']);
        await userEvent.click(getOption('南美洲'));
        expect(getTagTexts()).toEqual([]);
        expect(onChange).toHaveBeenLastCalledWith([]);
        await userEvent.click(getOption('北美洲'));
        await userEvent.click(getOption('美国'));
        expect(getTagTexts()).toEqual(['美国']);
        expect(onChange).toHaveBeenLastCalledWith([['North America', 'United States']]);
    });

    it('多选禁用 enableLeafClick', async () => {
        renderCascader({
            multiple: true,
            treeData: [
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
            ],
        });
        await userEvent.click(getSelection());
        await userEvent.click(getCheckbox('南美洲'));
        expect(getTagTexts()).toEqual(['南美洲']);
        await userEvent.click(getOption('南美洲'));
        expect(getTagTexts()).toEqual(['南美洲']);
    });

    it('separator', async () => {
        renderCascader({
            filterTreeNode: true,
            defaultValue: ['Asia', 'China', 'Beijing'],
            separator: ' > ',
            defaultOpen: true,
        });
        expect(getSelection().querySelector('span')?.textContent).toEqual('亚洲 > 中国 > 北京');
        await userEvent.type(getSelectionInput(), '中国');
        expect(document.querySelectorAll(`.${prefixCls}-option-list li`)[0].textContent).toEqual('亚洲 > 中国 > 北京');
    });

    it('search ref 方法', () => {
        let ref: CascaderElement | undefined;
        renderCascader({ ref: (el: CascaderElement) => (ref = el), filterTreeNode: true, searchPosition: 'custom', defaultOpen: true });
        ref?.search('北京');
        expect(getHighlights()[0].textContent).toEqual('北京');
        expect(document.querySelectorAll(`.${prefixCls}-option-list li`)[0].textContent).toEqual('亚洲 / 中国 / 北京');
    });

    it('triggerRender', async () => {
        const spyTriggerRender = vi.fn<NonNullable<CascaderProps<true>['triggerRender']>>(() => <span>123</span>);
        const { unmount } = renderCascader({ multiple: true, triggerRender: spyTriggerRender, defaultValue: 'Asia' });
        await userEvent.click(screen.getByText('123'));
        expect(isDropdownOpen()).toBe(true);
        const args = spyTriggerRender.mock.calls[0][0];
        expect(args.value.size).toEqual(1);
        expect(args.value).toEqual(new Set(['0']));
        unmount();

        const spyTriggerRender2 = vi.fn<NonNullable<CascaderProps<true>['triggerRender']>>(() => <span>123</span>);
        renderCascader({
            multiple: true,
            triggerRender: spyTriggerRender2,
            defaultValue: 'Asia',
            autoMergeValue: false,
        });
        await userEvent.click(screen.getByText('123'));
        const args2 = spyTriggerRender2.mock.calls[0][0];
        expect(args2.value.size).toEqual(4);
        expect(args2.value).toEqual(new Set(['0', '0-0', '0-0-1', '0-0-0']));
    });

    it('triggerRender 只调用一次，参数随状态更新', async () => {
        const spyTriggerRender = vi.fn<NonNullable<CascaderProps['triggerRender']>>((props) => <span class="custom-trigger">{props.value ?? 'none'}</span>);
        renderCascader({ triggerRender: spyTriggerRender, defaultOpen: true });
        await userEvent.click(getOption('北美洲'));
        await userEvent.click(getOption('美国'));
        expect(document.querySelector('.custom-trigger')).toHaveTextContent('1-0');
        expect(spyTriggerRender).toHaveBeenCalledTimes(1);
    });

    it('triggerRender 收到 disabled、placeholder，onSearch 驱动 inputValue，onClear 清空值', () => {
        const onSearch = vi.fn<NonNullable<CascaderProps['onSearch']>>();
        const onClear = vi.fn<NonNullable<CascaderProps['onClear']>>();
        const triggerRender = (props: TriggerRenderProps<false>) => (
            <div class="custom-trigger">
                <span data-testid="state">{`${props.disabled}|${props.placeholder as string}|${props.inputValue}`}</span>
                <button type="button" onClick={() => props.onSearch('as')}>
                    Search
                </button>
                <button type="button" onClick={(e) => props.onClear(e)}>
                    Clear
                </button>
            </div>
        );
        renderCascader({ filterTreeNode: true, disabled: true, placeholder: 'pick', defaultValue: 'Asia', onSearch, onClear, triggerRender });
        expect(screen.getByTestId('state')).toHaveTextContent(/^true\|pick\|$/);
        fireEvent.click(screen.getByRole('button', { name: 'Search' }));
        expect(onSearch).toHaveBeenLastCalledWith('as');
        expect(screen.getByTestId('state')).toHaveTextContent('true|pick|as');
        fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('autoMergeValue', () => {
        const { unmount } = renderCascader({ multiple: true, autoMergeValue: false, defaultValue: 'Asia' });
        expect(getTagTexts()).toEqual(['亚洲', '中国', '北京', '上海']);
        unmount();

        renderCascader({ multiple: true, autoMergeValue: true, defaultValue: 'Asia' });
        expect(getTagTexts()).toEqual(['亚洲']);
    });

    it('leafOnly', () => {
        const { unmount } = renderCascader({
            multiple: true,
            autoMergeValue: false,
            leafOnly: false,
            defaultValue: 'Asia',
        });
        expect(getTagTexts()).toHaveLength(4);
        unmount();

        const { unmount: unmount2 } = renderCascader({
            multiple: true,
            autoMergeValue: true,
            leafOnly: true,
            defaultValue: 'Asia',
        });
        expect(getTagTexts()).toEqual(['北京', '上海']);
        unmount2();

        const { unmount: unmount3 } = renderCascader({
            multiple: true,
            autoMergeValue: false,
            leafOnly: true,
            defaultValue: 'Asia',
        });
        expect(getTagTexts()).toEqual(['北京', '上海']);
        unmount3();

        renderCascader({ multiple: true, autoMergeValue: true, leafOnly: false, defaultValue: 'Asia' });
        expect(getTagTexts()).toEqual(['亚洲']);
    });

    it('ref 方法', async () => {
        let ref: CascaderElement | undefined;
        renderCascader({ ref: (el: CascaderElement) => (ref = el), multiple: true });
        ref?.open();
        expect(isDropdownOpen()).toBe(true);

        ref?.close();
        await expectClosed();
    });

    it('ref 是触发器元素', () => {
        let ref: CascaderElement | undefined;
        renderCascader({ ref: (el: CascaderElement) => (ref = el) });
        expect(ref).toBe(getTrigger());
    });

    it('autoMerge 为 false 且 value 为 []', () => {
        renderCascader({ multiple: true, autoMergeValue: false, value: [], placeholder: 'autoMergeValue 为 false' });
        expect(document.querySelector(`.${prefixCls}-selection-placeholder`)?.textContent).toEqual('autoMergeValue 为 false');
    });

    it('value 不在 TreeData 中', () => {
        renderCascader({
            multiple: true,
            value: ['value', 'notIn', 'treeData'],
            placeholder: 'value not in treeData, show placeholder',
            autoMergeValue: false,
            filterTreeNode: true,
        });
        expect(getSelectionInput()).toHaveAttribute('placeholder', 'value not in treeData, show placeholder');
        expect(getTagTexts()).toEqual([]);
    });

    it('onFocus 回调', async () => {
        const spyOnFocus = vi.fn<NonNullable<CascaderProps['onFocus']>>();
        renderCascader({ onFocus: spyOnFocus });
        await userEvent.click(getSelection());
        expect(spyOnFocus).toHaveBeenCalledTimes(1);
    });

    it('onBlur 回调', async () => {
        const spyOnBlur = vi.fn<NonNullable<CascaderProps['onBlur']>>();
        renderCascader({ onBlur: spyOnBlur });
        await userEvent.click(getSelection());
        expect(spyOnBlur).not.toHaveBeenCalled();
        await userEvent.click(document.body);
        expect(spyOnBlur).toHaveBeenCalledTimes(1);
        expect(isDropdownOpen()).toBe(false);
    });

    it('max 属性', async () => {
        renderCascader({ multiple: true, max: 1 });
        await userEvent.click(getSelection());
        await userEvent.click(getOption('亚洲'));
        await userEvent.click(getOption('中国'));
        await userEvent.click(getCheckbox('北京'));
        expect(getTagTexts()).toEqual(['北京']);
        await userEvent.click(getOption('北美洲'));
        await userEvent.click(getCheckbox('美国'));
        expect(getTagTexts()).toEqual(['北京']);
        expect(getCheckbox('美国')).not.toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-checked`);
    });

    it('onExceed 回调', async () => {
        const spyOnExceed = vi.fn<NonNullable<CascaderProps['onExceed']>>();
        renderCascader({ multiple: true, max: 1, onExceed: spyOnExceed });
        await userEvent.click(getSelection());
        await userEvent.click(getOption('北美洲'));
        await userEvent.click(getCheckbox('美国'));
        expect(spyOnExceed).not.toHaveBeenCalled();
        await userEvent.click(getCheckbox('加拿大'));
        expect(spyOnExceed).not.toHaveBeenCalled();
        expect(getTagTexts()).toEqual(['北美洲']);
        await userEvent.click(getCheckbox('亚洲'));
        expect(spyOnExceed).toHaveBeenCalledTimes(1);
        const exceeded = spyOnExceed.mock.calls[0][0].map((entity) => entity.data.value);
        expect(exceeded).toHaveLength(2);
        expect(exceeded).toEqual(expect.arrayContaining(['North America', 'Asia']));
        expect(getTagTexts()).toEqual(['北美洲']);
    });

    it('maxTagCount', () => {
        renderCascader({
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

    it('borderless 属性', () => {
        renderCascader({ borderless: true });
        expect(getTrigger()).toHaveClass(`${prefixCls}-borderless`);
    });

    it('arrowIcon 属性', () => {
        renderCascader({ arrowIcon: <span class="custom-arrow">arrow</span> });
        expect(document.querySelector(`.${prefixCls}-arrow .custom-arrow`)).toHaveTextContent('arrow');
    });

    it('清除按钮渲染在箭头之前，悬停与聚焦时由样式切换', () => {
        renderCascader({
            showClear: true,
            defaultValue: ['Asia', 'China', 'Beijing'],
            arrowIcon: <span class="custom-arrow">arrow</span>,
        });
        const clear = screen.getByRole('button', { name: zh_CN.Cascader.clear });
        expect(clear.compareDocumentPosition(document.querySelector('.custom-arrow') as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('选择区域的 Enter keydown', () => {
        renderCascader({ defaultValue: ['Asia', 'China', 'Beijing'] });

        fireEvent.keyDown(getTrigger(), { key: 'Enter', code: 'Enter' });
        expect(isDropdownOpen()).toBe(true);
        expect(getLists()).toHaveLength(3);
    });

    it('选择区域的 handleClick', async () => {
        renderCascader({ defaultValue: ['Asia', 'China', 'Beijing'] });

        await userEvent.click(getTrigger());
        expect(isDropdownOpen()).toBe(true);
        expect(getTrigger()).toHaveClass(`${prefixCls}-focus`);

        await userEvent.click(getTrigger());
        expect(isDropdownOpen()).toBe(false);
    });

    it('focus 与 blur 方法', () => {
        let ref: CascaderElement | undefined;
        renderCascader({ ref: (el: CascaderElement) => (ref = el) });

        ref?.focus();
        // the focus ring comes from :focus; the class marks only the open state
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-focus`);
        expect(getTrigger()).toHaveFocus();

        ref?.blur();
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-focus`);
        expect(getTrigger()).not.toHaveFocus();
    });

    it('open 与 close 方法', async () => {
        let ref: CascaderElement | undefined;
        const onDropdownVisibleChange = vi.fn<NonNullable<CascaderProps['onDropdownVisibleChange']>>();
        renderCascader({ ref: (el: CascaderElement) => (ref = el), onDropdownVisibleChange });

        ref?.open();
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(true);
        expect(getLists()).toHaveLength(1);

        ref?.close();
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        await expectClosed();
    });

    it('多选模式下使用 selectedKeys', () => {
        renderCascader({ multiple: true, defaultValue: [['Asia', 'China', 'Beijing']], autoMergeValue: false });

        expect(getSelection()).toHaveClass(`${prefixCls}-selection-multiple`);
        expect(getTagTexts()).toEqual(['北京']);
    });

    it('自定义 triggerRender 触发器', () => {
        renderCascader({
            triggerRender: (props: { value: string }) => <div class="custom-trigger">Custom: {props.value}</div>,
            defaultValue: ['Asia', 'China', 'Beijing'],
        });

        expect(document.querySelector('.custom-trigger')).toHaveTextContent('Custom: 0-0-0');
        expect(getSelection()).toBeNull();
    });
    it('handleListScroll', () => {
        const onListScroll = vi.fn<NonNullable<CascaderProps['onListScroll']>>();
        renderCascader({ defaultOpen: true, defaultValue: ['Asia', 'China', 'Beijing'], onListScroll });

        fireEvent.scroll(getLists()[1]);
        expect(onListScroll).toHaveBeenCalledTimes(1);
        expect(onListScroll.mock.calls[0][0]).toBeInstanceOf(Event);
        expect(onListScroll.mock.calls[0][1]).toEqual({
            panelIndex: 1,
            activeNode: beijing,
        });
    });

    it('多选模式下的 displayRender', () => {
        const displayRender = vi.fn<NonNullable<CascaderProps<true>['displayRender']>>((entity) => <span class="custom-display">{entity.data.label as JSX.Element}</span>);
        renderCascader({
            multiple: true,
            displayRender,
            defaultValue: [['Asia', 'China', 'Beijing']],
            autoMergeValue: false,
        });

        expect(displayRender).toHaveBeenCalledWith(expect.objectContaining({ data: beijing }), 0);
        expect(Array.from(document.querySelectorAll('.custom-display')).map((node) => node.textContent)).toEqual(['北京']);
        expect(document.querySelector(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag`)).toBeNull();
    });

    it('多选模式下的 handleTagClose', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        renderCascader({
            multiple: true,
            onChange,
            defaultValue: [['Asia', 'China', 'Beijing']],
            autoMergeValue: false,
        });

        await userEvent.click(document.querySelector(`.${prefixCls}-selection-tag .${BASE_CLASS_PREFIX}-tag-close`) as HTMLElement);
        expect(onChange).toHaveBeenCalledWith([]);
        expect(getTagTexts()).toEqual([]);
    });

    it('禁用的多选 Cascader 的标签没有关闭按钮', () => {
        renderCascader({
            multiple: true,
            disabled: true,
            defaultValue: [['Asia', 'China', 'Beijing']],
            autoMergeValue: false,
        });

        expect(getTagTexts()).toEqual(['北京']);
        expect(screen.queryAllByRole('button')).toEqual([]);
    });

    it('disabled 的 combobox 带 aria-disabled', () => {
        renderCascader({ disabled: true });
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-disabled', 'true');
    });

    it('onRemoveInTagInput', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        renderCascader({
            multiple: true,
            filterTreeNode: true,
            onChange,
            defaultValue: [['Asia', 'China', 'Beijing']],
            autoMergeValue: false,
        });

        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-tagInput .${BASE_CLASS_PREFIX}-tag .${BASE_CLASS_PREFIX}-tag-close`) as HTMLElement);
        expect(onChange).toHaveBeenCalledWith([]);
        expect(getTagTexts()).toEqual([]);
    });

    it('keyEntities 中没有该 key 时不渲染标签', () => {
        renderCascader({
            multiple: true,
            defaultValue: [['NonExistent', 'Path']],
            autoMergeValue: false,
            placeholder: 'empty',
        });

        expect(document.querySelector(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag`)).toBeNull();
        expect(document.querySelector(`.${prefixCls}-selection-placeholder`)).toHaveTextContent('empty');
    });

    it('disableStrictly 与禁用项', () => {
        const data = [
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
        ];
        renderCascader({
            treeData: data,
            multiple: true,
            disableStrictly: true,
            defaultValue: [['Asia', 'China', 'Beijing']],
            autoMergeValue: false,
        });

        const tags = document.querySelectorAll(`.${prefixCls}-selection-tag`);
        expect(Array.from(tags).map((tag) => tag.textContent)).toEqual(['北京', '中国', '亚洲']);
        tags.forEach((tag) => expect(tag).toHaveClass(`${prefixCls}-selection-tag-disabled`));
    });

    it('prefix 与 suffix 属性', () => {
        renderCascader({
            prefix: <span class="custom-prefix">Prefix</span>,
            suffix: <span class="custom-suffix">Suffix</span>,
        });

        expect(document.querySelector(`.${prefixCls}-prefix .custom-prefix`)).toHaveTextContent('Prefix');
        expect(document.querySelector(`.${prefixCls}-suffix .custom-suffix`)).toHaveTextContent('Suffix');
        expect(getTrigger()).toHaveClass(`${prefixCls}-with-prefix`);
        expect(getTrigger()).toHaveClass(`${prefixCls}-with-suffix`);
    });

    it('insetLabel 属性', () => {
        renderCascader({ insetLabel: <span class="custom-inset-label">Label</span>, insetLabelId: 'label-id' });

        const label = document.querySelector(`.${prefixCls}-inset-label`) as HTMLElement;
        expect(label.querySelector('.custom-inset-label')).toHaveTextContent('Label');
        expect(label).toHaveAttribute('id', 'label-id');
    });

    it('virtualize 属性', async () => {
        renderCascader({
            filterTreeNode: true,
            virtualizeInSearch: { height: 300, itemSize: 36 },
            defaultOpen: true,
        });
        await userEvent.type(getSelectionInput(), '北');

        const rows = document.querySelectorAll(`.${prefixCls}-option-list li`);
        expect(rows).toHaveLength(3);
        rows.forEach((row) => expect(row).toHaveStyle({ position: 'absolute', height: '36px' }));
        expect(rows[0].parentElement?.parentElement).toHaveStyle({ height: '300px' });
    });

    it('virtualizeInSearch 不传 height 时使用 180 的缺省高度', async () => {
        renderCascader({
            filterTreeNode: true,
            virtualizeInSearch: { itemSize: 36 },
            defaultOpen: true,
        });
        await userEvent.type(getSelectionInput(), '北');

        const rows = document.querySelectorAll(`.${prefixCls}-option-list li`);
        expect(rows).toHaveLength(3);
        expect(rows[0].parentElement?.parentElement).toHaveStyle({ height: '180px' });
    });

    it('virtualizeInSearch 的搜索结果 li 直接位于 role="none" 的 ul 中', async () => {
        renderCascader({
            filterTreeNode: true,
            virtualizeInSearch: { height: 300, itemSize: 36 },
            defaultOpen: true,
        });
        await userEvent.type(getSelectionInput(), '北');

        const rows = document.querySelectorAll(`.${prefixCls}-option-list li`);
        expect(rows).toHaveLength(3);
        rows.forEach((row) => {
            expect(row.parentElement?.tagName).toBe('UL');
            expect(row.parentElement).toHaveAttribute('role', 'none');
        });
        expect(document.querySelectorAll(`.${prefixCls}-option-lists ul`)).toHaveLength(1);
    });

    it('virtualizeInSearch.height 的类型只接受 number', () => {
        expectTypeOf<Virtualize['height']>().toEqualTypeOf<number | undefined>();
        expectTypeOf<NonNullable<CascaderProps['virtualizeInSearch']>>().toExtend<Virtualize>();
        expectTypeOf<{ itemSize: number; height: string }>().not.toExtend<Virtualize>();
    });

    it('不接受 children：Cascader 不渲染它，内容放在 prefix、suffix 或 bottomSlot', () => {
        expectTypeOf<CascaderProps>().not.toHaveProperty('children');
    });

    it('onBlur、onFocus 的参数类型包含键盘与焦点事件，onBlur 还可能是 undefined', () => {
        expectTypeOf<Parameters<NonNullable<CascaderProps['onBlur']>>[0]>().toEqualTypeOf<MouseEvent | KeyboardEvent | FocusEvent | undefined>();
        expectTypeOf<Parameters<NonNullable<CascaderProps['onFocus']>>[0]>().toEqualTypeOf<MouseEvent | KeyboardEvent | FocusEvent>();
    });

    it('filterSorter 的前两个参数是两条结果路径', () => {
        type Sorter = NonNullable<CascaderProps['filterSorter']>;
        expectTypeOf<Parameters<Sorter>[0]>().toEqualTypeOf<CascaderData[]>();
        expectTypeOf<Parameters<Sorter>[1]>().toEqualTypeOf<CascaderData[]>();
        expectTypeOf<Parameters<Sorter>[2]>().toEqualTypeOf<string>();
    });

    it('filterSorter 收到两条从根到结果节点的路径与输入内容', () => {
        let ref: CascaderElement | undefined;
        const filterSorter = vi.fn<NonNullable<CascaderProps['filterSorter']>>((first, second) => (String(first.at(-1)?.value) < String(second.at(-1)?.value) ? -1 : 1));
        renderCascader({ ref: (el: CascaderElement) => (ref = el), filterTreeNode: true, defaultOpen: true, filterSorter });

        ref?.search('洲');
        expect(filterSorter).toHaveBeenCalled();
        for (const [first, second, inputValue] of filterSorter.mock.calls) {
            expect(['Asia', 'North America']).toContain(first[0].value);
            expect(['Asia', 'North America']).toContain(second[0].value);
            expect(inputValue).toBe('洲');
        }
        expect(document.querySelectorAll(`li.${prefixCls}-option`)[0]).toHaveTextContent('北京');
    });

    it('checkRelation、searchPosition 只接受文档列出的字面量', () => {
        expectTypeOf<CascaderProps['checkRelation']>().toEqualTypeOf<'related' | 'unRelated' | undefined>();
        expectTypeOf<CascaderProps['searchPosition']>().toEqualTypeOf<'trigger' | 'custom' | undefined>();
        expectTypeOf<'unrelated'>().not.toExtend<NonNullable<CascaderProps['checkRelation']>>();
        expectTypeOf<'top'>().not.toExtend<NonNullable<CascaderProps['searchPosition']>>();
    });

    it('没有 mouseEnterDelay、mouseLeaveDelay；triggerRender 参数没有 onChange，只有 onSearch', () => {
        expectTypeOf<CascaderProps>().not.toHaveProperty('mouseEnterDelay');
        expectTypeOf<CascaderProps>().not.toHaveProperty('mouseLeaveDelay');
        type TriggerArgs = Parameters<NonNullable<CascaderProps['triggerRender']>>[0];
        expectTypeOf<TriggerArgs>().not.toHaveProperty('onChange');
        expectTypeOf<TriggerArgs['onSearch']>().toEqualTypeOf<(inputValue: string) => void>();
    });

    it('triggerRender 收到的参数不含 onChange', () => {
        const triggerRender = vi.fn<NonNullable<CascaderProps['triggerRender']>>(() => <span>trigger</span>);
        renderCascader({ triggerRender });
        expect(triggerRender.mock.calls[0][0]).not.toHaveProperty('onChange');
        expect(triggerRender.mock.calls[0][0]).toHaveProperty('onSearch');
    });

    it('value、onChange、onSelect、displayRender、triggerRender 的类型随 multiple 区分', () => {
        type Single = CascaderProps;
        type Multiple = CascaderProps<true>;
        expectTypeOf<Single['value']>().toEqualTypeOf<SimpleValueType | SimpleValueType[] | undefined>();
        expectTypeOf<Parameters<NonNullable<Single['onChange']>>>().toEqualTypeOf<[value: SimpleValueType[]]>();
        expectTypeOf<Parameters<NonNullable<Multiple['onChange']>>>().toEqualTypeOf<[value: SimpleValueType[][]]>();
        expectTypeOf<Parameters<NonNullable<Single['onSelect']>>[0]>().toEqualTypeOf<string | number>();
        expectTypeOf<Parameters<NonNullable<Single['displayRender']>>>().toEqualTypeOf<[selected: Array<string | number>]>();
        expectTypeOf<Parameters<NonNullable<Multiple['displayRender']>>>().toEqualTypeOf<[selected: Entity, idx: number]>();
        expectTypeOf<Parameters<NonNullable<Single['triggerRender']>>[0]['value']>().toEqualTypeOf<string | undefined>();
        expectTypeOf<Parameters<NonNullable<Multiple['triggerRender']>>[0]['value']>().toEqualTypeOf<Set<string>>();

        void (
            <>
                <Cascader onChange={(value) => expectTypeOf(value).toEqualTypeOf<SimpleValueType[]>()} />
                <Cascader multiple onChange={(value) => expectTypeOf(value).toEqualTypeOf<SimpleValueType[][]>()} />
                <Cascader multiple displayRender={(entity, idx) => `${entity.key}-${idx}`} />
            </>
        );
    });

    it('handleTagRemoveInTrigger', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        renderCascader({
            multiple: true,
            onChange,
            triggerRender: (props: TriggerRenderProps<true>) => (
                <div class="custom-trigger">
                    <For each={[...props.value]}>
                        {(v) => (
                            <button type="button" onClick={() => props.onRemove(v)}>
                                {v}
                            </button>
                        )}
                    </For>
                </div>
            ),
            defaultValue: [['Asia', 'China', 'Beijing']],
            autoMergeValue: false,
        });

        expect(document.querySelector('.custom-trigger')).toHaveTextContent('0-0-0');
        await userEvent.click(screen.getByText('0-0-0'));
        expect(onChange).toHaveBeenCalledWith([]);
        expect(document.querySelector('.custom-trigger')).toBeEmptyDOMElement();
    });

    it.each(['{Enter}', ' '])('triggerRender 内按钮聚焦时 %j 只触发按钮，不打开面板', async (key) => {
        const onClear = vi.fn<(e: { stopPropagation: () => void }) => void>((e) => e.stopPropagation());
        renderCascader({
            triggerRender: () => (
                <div class="custom-trigger">
                    <button type="button" aria-label="清除" onClick={onClear} />
                </div>
            ),
        });

        screen.getByRole('button', { name: '清除' }).focus();
        await userEvent.keyboard(key);
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('tree')).not.toBeInTheDocument();
    });

    it('triggerRender 内 role="button" 的元素上按 Enter 只交给它，不打开面板；指针点击仍打开', async () => {
        const onPress = vi.fn<() => void>();
        renderCascader({
            triggerRender: () => (
                <div class="custom-trigger">
                    <Tag aria-label="清除" onClick={onPress}>
                        北京
                    </Tag>
                </div>
            ),
        });

        screen.getByRole('button', { name: '清除' }).focus();
        await userEvent.keyboard('{Enter}');
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('tree')).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: '清除' }));
        expect(screen.getByRole('tree')).toBeInTheDocument();
    });

    it.each([false, true])('多选时已选标签上按 Enter 不改变面板开合（defaultOpen=%s）', async (defaultOpen) => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        renderCascader({
            multiple: true,
            defaultOpen,
            defaultValue: [['Asia', 'China', 'Beijing']],
            onDropdownVisibleChange,
        });

        onDropdownVisibleChange.mockClear();

        screen.getByRole('button', { name: /北京/ }).focus();
        await userEvent.keyboard('{Enter}');
        expect(onDropdownVisibleChange).not.toHaveBeenCalled();
        expect(screen.queryAllByRole('tree')).toHaveLength(defaultOpen ? 1 : 0);
    });

    it('多选、面板打开且有激活项时，已选标签上按 Enter 不选中激活项，onKeyDown 只收到一次', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        const onKeyDown = vi.fn<(e: KeyboardEvent) => void>();
        renderCascader({
            multiple: true,
            defaultOpen: true,
            defaultValue: [['Asia', 'China', 'Beijing']],
            onChange,
            onKeyDown,
        });
        getTrigger().focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(activeLabel(getTrigger())).toBeTruthy();

        onKeyDown.mockClear();
        screen.getByRole('button', { name: /北京/ }).focus();
        await userEvent.keyboard('{Enter}');
        expect(onChange).not.toHaveBeenCalled();
        expect(getTagTexts()).toEqual(['北京']);
        expect(onKeyDown).toHaveBeenCalledTimes(1);
    });

    it('search 方法', () => {
        let ref: CascaderElement | undefined;
        const onSearch = vi.fn<NonNullable<CascaderProps['onSearch']>>();
        renderCascader({ ref: (el: CascaderElement) => (ref = el), filterTreeNode: true, defaultOpen: true, onSearch });

        ref?.search('北京');
        expect(onSearch).toHaveBeenCalledWith('北京');
        expect(getSelectionInput()).toHaveValue('北京');
        expect(getHighlights()).toHaveLength(1);
    });

    it('emptyContent 为 null', () => {
        renderCascader({ treeData: [], emptyContent: null, defaultOpen: true });

        expect(document.querySelector(`.${prefixCls}-option-lists`)).toHaveClass(`${prefixCls}-option-lists-empty`);
        expect(document.querySelector(`.${prefixCls}-option-lists`)).toBeEmptyDOMElement();
    });

    it('在当前选项上按 Enter 等同于点击', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        renderCascader({ defaultOpen: true, onChange });
        getTrigger().focus();

        await userEvent.keyboard('{ArrowDown}{Enter}');
        expect(getLists()).toHaveLength(2);
        await userEvent.keyboard('{ArrowRight}{Enter}{ArrowRight}{Enter}');
        expect(onChange).toHaveBeenCalledWith(['Asia', 'China', 'Beijing']);
    });

    it('loadData 属性', async () => {
        let finishLoad: (() => void) | undefined;
        const loadData = vi.fn<NonNullable<CascaderProps['loadData']>>(() => new Promise<void>((resolve) => (finishLoad = resolve)));
        const onLoad = vi.fn<NonNullable<CascaderProps['onLoad']>>();
        const data = { label: '亚洲', value: 'Asia', isLeaf: false };
        renderCascader({ treeData: [data], loadData, onLoad, defaultOpen: true });

        await userEvent.click(getOption('亚洲'));
        expect(loadData).toHaveBeenCalledWith([data]);
        expect(getOption('亚洲').querySelector(`.${prefixCls}-option-spin-icon`)).not.toBeNull();

        finishLoad?.();
        await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1));
        expect(onLoad.mock.calls[0][1]).toEqual(data);
        await waitFor(() => expect(getOption('亚洲').querySelector(`.${prefixCls}-option-spin-icon`)).toBeNull());
    });

    it('loadData reject 时停止显示加载状态，并允许重试', async () => {
        const loadData = vi.fn<NonNullable<CascaderProps['loadData']>>(() => Promise.reject(new Error('load failed')));
        const rejections: unknown[] = [];
        const onRejection = (reason: unknown) => rejections.push(reason);
        // loadData rejections are rethrown to the caller by design; catch it here so it is not reported as a test failure
        process.on('unhandledRejection', onRejection);
        try {
            const data = { label: '亚洲', value: 'Asia', isLeaf: false };
            renderCascader({ treeData: [data], loadData, defaultOpen: true });
            await userEvent.click(getOption('亚洲'));
            await waitFor(() => expect(loadData).toHaveBeenCalledTimes(1));
            await waitFor(() => expect(getOption('亚洲').querySelector(`.${prefixCls}-option-spin-icon`)).toBeNull());
            await userEvent.click(getOption('亚洲'));
            await waitFor(() => expect(loadData).toHaveBeenCalledTimes(2));
        } finally {
            await new Promise((resolve) => setTimeout(resolve, 0));
            process.off('unhandledRejection', onRejection);
        }
    });

    it('value 属性变化时的 handleValueChange', () => {
        const { rerender } = renderCascader({ value: ['Asia', 'China', 'Beijing'] });
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 北京');

        rerender({ value: ['North America', 'United States'] });
        expect(getSelectionText()).toEqual('北美洲 / 美国');
    });

    it('filterTreeNode 与搜索', async () => {
        renderCascader({ filterTreeNode: true, defaultOpen: true });

        await userEvent.type(getSelectionInput(), '北京');
        const options = document.querySelectorAll(`.${prefixCls}-option-flatten`);
        expect(Array.from(options).map((option) => option.textContent)).toEqual(['亚洲 / 中国 / 北京']);
    });

    it('onFocus 与 onBlur 事件', async () => {
        const onFocus = vi.fn<NonNullable<CascaderProps['onFocus']>>();
        const onBlur = vi.fn<NonNullable<CascaderProps['onBlur']>>();
        renderCascader({ onFocus, onBlur });

        await userEvent.click(getSelection());
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();

        fireEvent.keyDown(getTrigger(), { key: 'Escape' });
        await expectClosed();
        expect(onBlur).not.toHaveBeenCalled();

        await userEvent.click(document.body);
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('onSelect 事件', async () => {
        const onSelect = vi.fn<NonNullable<CascaderProps['onSelect']>>();
        renderCascader({ onSelect, defaultOpen: true });

        await userEvent.click(getOption('北美洲'));
        expect(onSelect).not.toHaveBeenCalled();
        expect(getLists()).toHaveLength(2);

        await userEvent.click(getOption('加拿大'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('Canada');
    });

    it('onSearch 事件', async () => {
        const onSearch = vi.fn<NonNullable<CascaderProps['onSearch']>>();
        renderCascader({ filterTreeNode: true, onSearch, defaultOpen: true });

        await userEvent.type(getSelectionInput(), '北京');
        expect(onSearch).toHaveBeenCalledTimes(2);
        expect(onSearch).toHaveBeenLastCalledWith('北京');
    });

    it('onDropdownVisibleChange 事件', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<CascaderProps['onDropdownVisibleChange']>>();
        renderCascader({ onDropdownVisibleChange });

        await userEvent.click(getTrigger());
        expect(onDropdownVisibleChange).toHaveBeenCalledTimes(1);
        expect(onDropdownVisibleChange).toHaveBeenCalledWith(true);
    });

    it('无效 key 不渲染标签', () => {
        renderCascader({
            multiple: true,
            autoMergeValue: false,
            value: [['Asia', 'China', 'Beijing'], ['Mars']],
        });

        expect(getTagTexts()).toEqual(['北京']);
    });

    it('配合 TagInput 使用 onRemoveInTagInput', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        renderCascader({
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

        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-tagInput .${BASE_CLASS_PREFIX}-tag-close`) as HTMLElement);
        expect(onChange).toHaveBeenCalledWith([['Asia', 'China', 'Shanghai']]);
        expect(getTagTexts()).toEqual(['上海']);
    });

    it('自定义 filterRender 渲染', async () => {
        const filterRender = vi.fn<NonNullable<CascaderProps['filterRender']>>((props) => <div class="custom-filter-item">{props.data.map((item) => item.label).join('-')}</div>);
        renderCascader({ filterTreeNode: true, filterRender, defaultOpen: true });

        await userEvent.type(getSelectionInput(), '北京');
        expect(filterRender).toHaveBeenLastCalledWith(expect.objectContaining({ inputValue: '北京', selected: false }));
        const items = document.querySelectorAll('.custom-filter-item');
        expect(Array.from(items).map((item) => item.textContent)).toEqual(['亚洲-中国-北京']);
    });

    it('单选模式下 treeData 变化时更新选项', () => {
        const initialTreeData = [{ label: '选项1', value: 'opt1' }];
        const { rerender } = renderCascader({ treeData: initialTreeData, defaultOpen: true });
        expect(Array.from(getListOptions(0)).map((option) => option.textContent)).toEqual(['选项1']);

        const newTreeData = [
            { label: '选项1', value: 'opt1' },
            { label: '选项2', value: 'opt2' },
        ];
        rerender({ defaultOpen: true, treeData: newTreeData });
        expect(Array.from(getListOptions(0)).map((option) => option.textContent)).toEqual(['选项1', '选项2']);
    });

    it('handleTagRemoveInTrigger 移除标签', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        renderCascader({
            multiple: true,
            onChange,
            triggerRender: (props: TriggerRenderProps<true>) => (
                <div class="custom-trigger">
                    <For each={[...props.value]}>
                        {(pos) => (
                            <button type="button" onClick={() => props.onRemove(pos)}>
                                {pos}
                            </button>
                        )}
                    </For>
                </div>
            ),
            defaultValue: [
                ['Asia', 'China', 'Beijing'],
                ['North America', 'United States'],
            ],
        });

        await userEvent.click(screen.getByRole('button', { name: '0-0-0' }));
        expect(onChange).toHaveBeenCalledWith([['North America', 'United States']]);
        expect(screen.queryByRole('button', { name: '0-0-0' })).toBeNull();
        expect(screen.getByRole('button', { name: '1-0' })).toBeInTheDocument();
    });
    it('onRemoveInTagInput 按 key 移除标签', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        renderCascader({
            multiple: true,
            filterTreeNode: true,
            onChange,
            defaultValue: [
                ['Asia', 'China', 'Beijing'],
                ['North America', 'United States'],
            ],
        });
        expect(getTagTexts()).toEqual(['北京', '美国']);

        const closeBtns = document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-tagInput .${BASE_CLASS_PREFIX}-tag-close`);
        await userEvent.click(closeBtns[1]);
        expect(onChange).toHaveBeenCalledWith([['Asia', 'China', 'Beijing']]);
        expect(getTagTexts()).toEqual(['北京']);
    });

    it('treeData 不再包含已选 key 时不渲染标签', () => {
        const value = [['Asia', 'China', 'Beijing']];
        const { rerender, unmount } = renderCascader({ multiple: true, value, autoMergeValue: false });
        expect(getTagTexts()).toEqual(['北京']);

        rerender({ multiple: true, value, autoMergeValue: false, treeData: [treeData[1]] });
        expect(getTagTexts()).toEqual([]);
        unmount();

        const { rerender: rerender2 } = renderCascader({ multiple: true, defaultValue: value, autoMergeValue: false });
        rerender2({ defaultValue: value, multiple: true, autoMergeValue: false, treeData: [treeData[1]] });
        expect(getTagTexts()).toEqual([]);
    });

    it('flatten 搜索模式下的 virtualize', async () => {
        renderCascader({
            filterTreeNode: true,
            defaultOpen: true,
            virtualizeInSearch: { height: 300, width: '100%', itemSize: 36 },
        });

        await userEvent.type(getSelectionInput(), '北京');
        const rows = document.querySelectorAll(`.${prefixCls}-option-flatten`);
        expect(Array.from(rows).map((row) => row.textContent)).toEqual(['亚洲 / 中国 / 北京']);
        expect(rows[0]).toHaveStyle({ position: 'absolute', top: '0px', height: '36px' });
    });

    it('级联列表中的禁用项', async () => {
        const data = [
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
        ];
        renderCascader({ treeData: data, defaultOpen: true });

        await userEvent.click(getOption('亚洲'));

        expect(getOption('中国')).toHaveClass(`${prefixCls}-option-disabled`);
        expect(getOption('中国')).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(getOption('中国'));
        expect(getLists()).toHaveLength(2);
    });

    it('TagInput 的 onRemove 回调', () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        renderCascader({
            multiple: true,
            filterTreeNode: true,
            onChange,
            defaultValue: [
                ['Asia', 'China', 'Beijing'],
                ['North America', 'United States'],
            ],
        });

        fireEvent.keyDown(getSelectionInput(), { key: 'Backspace', keyCode: 8 });
        expect(onChange).toHaveBeenCalledWith([['Asia', 'China', 'Beijing']]);
        expect(getTagTexts()).toEqual(['北京']);
    });

    it('treeData 变化但 value 不变', async () => {
        const value = ['Asia', 'China', 'Beijing'];
        const { rerender } = renderCascader({ value });

        const newTreeData = [
            ...treeData,
            {
                label: '欧洲',
                value: 'Europe',
                children: [{ label: '英国', value: 'UK' }],
            },
        ];
        rerender({ value, treeData: newTreeData });
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 北京');

        await userEvent.click(getSelection());
        expect(Array.from(getListOptions(0)).map((option) => option.textContent)).toEqual(['亚洲', '北美洲', '欧洲']);
    });

    it('value 变化但 treeData 不变', () => {
        const { rerender } = renderCascader({ value: ['Asia', 'China', 'Beijing'] });

        rerender({ value: ['Asia', 'China', 'Shanghai'] });
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 上海');
    });

    it('点击外部关闭下拉框', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<CascaderProps['onDropdownVisibleChange']>>();
        renderCascader({ defaultOpen: true, onDropdownVisibleChange });
        expect(isDropdownOpen()).toBe(true);
        expect(onDropdownVisibleChange).toHaveBeenCalledWith(true);

        await userEvent.click(document.body);
        await expectClosed();
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('点击分支选项只展开不选中', async () => {
        renderCascader({ defaultOpen: true });

        await userEvent.click(getOption('亚洲'));
        expect(getOption('亚洲')).toHaveClass(`${prefixCls}-option-active`);
        expect(getOption('亚洲')).not.toHaveClass(`${prefixCls}-option-select`);
        expect(document.querySelector(`.${prefixCls}-selection-placeholder`)).not.toBeNull();
    });

    it('达到 max 时调用 onExceed 回调', async () => {
        const onExceed = vi.fn<NonNullable<CascaderProps['onExceed']>>();
        renderCascader({ multiple: true, max: 1, onExceed, defaultOpen: true });

        await userEvent.click(getCheckbox('亚洲'));
        expect(getTagTexts()).toEqual(['亚洲']);
        expect(onExceed).not.toHaveBeenCalled();

        await userEvent.click(getCheckbox('北美洲'));
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(getTagTexts()).toEqual(['亚洲']);
    });

    it('多选模式下 checkedKeys 为空', () => {
        renderCascader({ multiple: true, defaultValue: [], placeholder: 'empty' });

        expect(getSelection()).not.toHaveClass(`${prefixCls}-selection-multiple`);
        expect(document.querySelector(`.${prefixCls}-selection-placeholder`)).toHaveTextContent('empty');
    });

    it('virtualize 搜索模式按行定位', async () => {
        renderCascader({
            filterTreeNode: true,
            treeNodeFilterProp: 'value',
            defaultOpen: true,
            virtualizeInSearch: { height: 300, width: '100%', itemSize: 36 },
        });

        await userEvent.type(getSelectionInput(), 'China');
        const rows = document.querySelectorAll(`.${prefixCls}-option-flatten`);
        expect(Array.from(rows).map((row) => row.textContent)).toEqual(['Asia / China / Beijing', 'Asia / China / Shanghai']);
        expect(rows[0]).toHaveStyle({ position: 'absolute', top: '0px', height: '36px' });
        expect(rows[1]).toHaveStyle({ position: 'absolute', top: '36px', height: '36px' });
    });

    it('emptyContent 为 null 时不渲染空态', () => {
        renderCascader({ treeData: [], emptyContent: null, defaultOpen: true });

        expect(document.querySelector(`.${prefixCls}-option-empty`)).toBeNull();
        expect(document.querySelector(`.${prefixCls}-option-lists`)).not.toBeNull();
    });

    it('禁用项具有正确的类名', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        const data = [
            {
                label: '亚洲',
                value: 'Asia',
                children: [
                    { label: '中国', value: 'China', disabled: true },
                    { label: '日本', value: 'Japan' },
                ],
            },
        ];
        renderCascader({ treeData: data, defaultOpen: true, onChange });

        await userEvent.click(getOption('亚洲'));

        expect(getOption('中国')).toHaveClass(`${prefixCls}-option-disabled`);
        expect(getOption('日本')).not.toHaveClass(`${prefixCls}-option-disabled`);
        await userEvent.click(getOption('中国'));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('搜索结果的虚拟列表尺寸', async () => {
        renderCascader({
            filterTreeNode: true,
            treeNodeFilterProp: 'value',
            defaultOpen: true,
            virtualizeInSearch: { height: 200, width: 300, itemSize: 32 },
        });

        await userEvent.type(getSelectionInput(), 'Bei');
        const rows = document.querySelectorAll(`.${prefixCls}-option-flatten`);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toHaveStyle({ height: '32px' });
        const list = rows[0].parentElement?.parentElement;
        expect(list).toHaveStyle({ height: '200px', width: '300px' });
    });

    it('notifyListScroll 回调', () => {
        const onListScroll = vi.fn<NonNullable<CascaderProps['onListScroll']>>();
        renderCascader({ defaultOpen: true, onListScroll });

        fireEvent.scroll(getLists()[0]);
        expect(onListScroll).toHaveBeenCalledTimes(1);
        expect(onListScroll.mock.calls[0][1]).toEqual({ panelIndex: 0, activeNode: null });
    });

    it('checkRelation 为 unRelated 时直接设置 checkedKeys', async () => {
        renderCascader({ multiple: true, checkRelation: 'unRelated', defaultValue: [['Asia', 'China', 'Beijing']] });

        expect(getTagTexts()).toEqual(['北京']);
        await userEvent.click(getSelection());
        expect(getCheckbox('亚洲')).not.toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-indeterminate`);
        expect(getCheckbox('亚洲')).not.toHaveClass(`${BASE_CLASS_PREFIX}-checkbox-checked`);
    });

    it('超过 max 时调用 notifyOnExceed', async () => {
        const onExceed = vi.fn<NonNullable<CascaderProps['onExceed']>>();
        renderCascader({
            multiple: true,
            max: 1,
            onExceed,
            defaultValue: [['Asia', 'China', 'Beijing']],
            defaultOpen: true,
        });

        await userEvent.click(getCheckbox('北美洲'));
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(getTagTexts()).toEqual(['北京']);
    });

    it('flatten 模式下带搜索的 virtualize 渲染正确', async () => {
        const largeTreeData = Array.from({ length: 50 }, (_, i) => ({
            label: `选项${i}`,
            value: `opt${i}`,
            children: [
                { label: `子选项${i}-1`, value: `child${i}-1` },
                { label: `子选项${i}-2`, value: `child${i}-2` },
            ],
        }));
        renderCascader({
            treeData: largeTreeData,
            filterTreeNode: true,
            defaultOpen: true,
            virtualizeInSearch: { height: 200, width: 300, itemSize: 36 },
        });

        await userEvent.paste('选项');
        const rows = document.querySelectorAll(`.${prefixCls}-option-flatten`);
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.length).toBeLessThan(100);
        expect(rows[0].parentElement).toHaveStyle({ height: '3600px' });
    });

    it('点击外部时关闭下拉框，点击菜单内部不关闭', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<CascaderProps['onDropdownVisibleChange']>>();

        render(() => (
            <>
                <Cascader motion={false} defaultOpen treeData={treeData} onDropdownVisibleChange={onDropdownVisibleChange} />
                <button type="button">outside</button>
            </>
        ));
        expect(isDropdownOpen()).toBe(true);

        await userEvent.click(getOption('亚洲'));
        expect(isDropdownOpen()).toBe(true);

        await userEvent.click(screen.getByRole('button', { name: 'outside' }));
        await expectClosed();
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('禁用选项渲染禁用类名', () => {
        const data = [
            { label: '选项1', value: 'opt1', disabled: true },
            { label: '选项2', value: 'opt2' },
        ];
        renderCascader({ treeData: data, defaultOpen: true });

        expect(getOption('选项1')).toHaveClass(`${prefixCls}-option-disabled`);
        expect(getOption('选项2')).not.toHaveClass(`${prefixCls}-option-disabled`);
    });

    it('virtualize 模式下只渲染可见行', async () => {
        const largeTreeData = Array.from({ length: 50 }, (_, i) => ({ label: `TestItem${i}`, value: `testitem${i}` }));
        renderCascader({
            treeData: largeTreeData,
            filterTreeNode: true,
            defaultOpen: true,
            virtualizeInSearch: { height: 150, width: 250, itemSize: 30 },
        });

        await userEvent.paste('Test');
        const rows = document.querySelectorAll(`.${prefixCls}-option-flatten`);
        expect(rows.length).toBeLessThan(50);
        rows.forEach((row, index) => {
            expect(row).toHaveTextContent(`TestItem${index}`);
            expect(row).toHaveStyle({ position: 'absolute', top: `${index * 30}px`, height: '30px' });
        });
    });

    it('超过 max 时 onExceed 收到将被选中的全部节点', async () => {
        const onExceed = vi.fn<NonNullable<CascaderProps['onExceed']>>();
        renderCascader({ multiple: true, max: 1, onExceed, defaultOpen: true, autoMergeValue: false });

        await userEvent.click(getOption('亚洲'));
        await userEvent.click(getOption('中国'));
        await userEvent.click(getCheckbox('北京'));
        expect(getTagTexts()).toEqual(['北京']);
        expect(onExceed).not.toHaveBeenCalled();

        await userEvent.click(getCheckbox('上海'));
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(onExceed.mock.calls[0][0]).toHaveLength(4);
        expect(getTagTexts()).toEqual(['北京']);
    });

    it('悬停禁用项不展开', () => {
        const data = [
            { label: '选项1', value: 'opt1', disabled: true, children: [{ label: '子选项1', value: 'child1' }] },
            { label: '选项2', value: 'opt2', children: [{ label: '子选项2', value: 'child2' }] },
        ];
        renderCascader({ treeData: data, defaultOpen: true, showNext: 'hover' });

        fireEvent.mouseEnter(getOption('选项1'));
        expect(getLists()).toHaveLength(1);
        expect(getOption('选项1')).not.toHaveClass(`${prefixCls}-option-active`);

        fireEvent.mouseEnter(getOption('选项2'));
        expect(getLists()).toHaveLength(2);
    });

    it('自定义 expandIcon 渲染在每个分支选项中', () => {
        renderCascader({
            defaultOpen: true,
            // inline JSX in a Solid prop is a getter, so each branch option gets its own node
            get expandIcon() {
                return <span class="custom-expand-icon">{'>'}</span>;
            },
        });

        expect(getOption('亚洲').querySelector('.custom-expand-icon')).not.toBeNull();
        expect(getOption('北美洲').querySelector('.custom-expand-icon')).not.toBeNull();
        expect(document.querySelector(`.${prefixCls}-option-icon-expand`)).toBeNull();
    });

    it('默认图标：分支显示展开图标，叶子留空位', () => {
        renderCascader({ defaultOpen: true });

        expect(document.querySelectorAll(`.${prefixCls}-option-icon-expand`)).toHaveLength(2);
        expect(document.querySelectorAll(`.${prefixCls}-option-icon-empty`)).toHaveLength(2);
        expect(document.querySelector(`.${prefixCls}-option-icon-active`)).toBeNull();
    });

    it('点击 flatten 搜索结果', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        renderCascader({ filterTreeNode: true, defaultOpen: true, onChange });

        await userEvent.type(getSelectionInput(), '北京');

        await userEvent.click(document.querySelector(`.${prefixCls}-option-flatten`) as HTMLElement);
        expect(onChange).toHaveBeenCalledWith(['Asia', 'China', 'Beijing']);
        await expectClosed();
        expect(document.querySelector(`.${prefixCls}-search-wrapper span`)).toHaveTextContent('亚洲 / 中国 / 北京');
    });

    it('showNext 为 hover 模式时悬停展开', () => {
        renderCascader({ defaultOpen: true, showNext: 'hover' });

        fireEvent.mouseEnter(getOption('亚洲'));

        expect(getLists()).toHaveLength(2);
        expect(getOption('亚洲')).toHaveClass(`${prefixCls}-option-active`);
        expect(getOption('中国')).toBeInTheDocument();
    });

    it('点击禁用项无效', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        const data = [
            { label: '选项1', value: 'opt1', disabled: true },
            { label: '选项2', value: 'opt2' },
        ];
        renderCascader({ treeData: data, defaultOpen: true, onChange });

        await userEvent.click(getOption('选项1'));

        expect(onChange).not.toHaveBeenCalled();
        expect(isDropdownOpen()).toBe(true);

        await userEvent.click(getOption('选项2'));
        expect(onChange).toHaveBeenCalledWith(['opt2']);
    });

    it('点击禁用的 flatten 项无效', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        const data = [
            {
                label: '选项1',
                value: 'opt1',
                children: [
                    { label: '子选项1', value: 'child1', disabled: true },
                    { label: '子选项2', value: 'child2' },
                ],
            },
        ];
        renderCascader({ treeData: data, filterTreeNode: true, defaultOpen: true, onChange });

        await userEvent.type(getSelectionInput(), '子选项1');

        const disabledItem = document.querySelector(`.${prefixCls}-option-flatten`) as HTMLElement;
        expect(disabledItem).toHaveClass(`${prefixCls}-option-disabled`);
        await userEvent.click(disabledItem);

        expect(onChange).not.toHaveBeenCalled();
        expect(isDropdownOpen()).toBe(true);
    });

    it('changeOnSelect 时点击分支选项即选中并展开', async () => {
        const onSelect = vi.fn<NonNullable<CascaderProps['onSelect']>>();
        renderCascader({ defaultOpen: true, onSelect, changeOnSelect: true });

        await userEvent.click(getOption('北美洲'));
        expect(onSelect).toHaveBeenCalledWith('North America');
        expect(getOption('北美洲')).toHaveClass(`${prefixCls}-option-select`);
        const selectedItems = document.querySelectorAll(`.${prefixCls}-option-select`);
        expect(Array.from(selectedItems).map((item) => item.textContent)).toEqual(['北美洲']);
        expect(getSelectionText()).toEqual('北美洲');
        expect(getLists()).toHaveLength(2);
    });

    it('配合 filterTreeNode 调用 blur 方法时搜索框失焦', () => {
        let ref: CascaderElement | undefined;
        renderCascader({ ref: (el: CascaderElement) => (ref = el), filterTreeNode: true, defaultOpen: true });
        expect(getSelectionInput()).toHaveFocus();

        ref?.blur();
        expect(getSelectionInput()).not.toHaveFocus();
    });

    it('unRelated 模式下超过 max 时触发 onExceed', async () => {
        const onExceed = vi.fn<NonNullable<CascaderProps['onExceed']>>();
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        const simpleTreeData = [
            { label: '选项1', value: 'opt1' },
            { label: '选项2', value: 'opt2' },
            { label: '选项3', value: 'opt3' },
        ];
        renderCascader({
            treeData: simpleTreeData,
            multiple: true,
            checkRelation: 'unRelated',
            max: 1,
            onExceed,
            onChange,
        });

        await userEvent.click(getSelection());

        await userEvent.click(getCheckbox('选项1'));

        expect(onChange).toHaveBeenCalledWith([['opt1']]);
        expect(getTagTexts()).toEqual(['选项1']);

        await userEvent.click(getCheckbox('选项2'));
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(onExceed.mock.calls[0][0].map((entity) => entity.data.value)).toEqual(['opt1']);
        expect(getTagTexts()).toEqual(['选项1']);
    });

    it('fix #703：受控多选的 value 在 treeData 扩展到包含它后显示完整路径', () => {
        const value = [['0-0'], ['0-1', 'Node2-2']];
        const { rerender } = renderCascader({ multiple: true, value, treeData: asyncTreeData });
        expect(getTagTexts()).toEqual(['Node1']);
        const loadedData = addChildren(asyncTreeData, '0-1', [
            { label: 'Node2-1', value: 'Node2-1', isLeaf: true },
            { label: 'Node2-2', value: 'Node2-2', isLeaf: true },
        ]);
        rerender({ multiple: true, value, treeData: loadedData });
        expect(getTagTexts()).toEqual(['Node1', 'Node2-2']);
    });

    it('搜索结果显示 label 文本，不经 renderLabel', async () => {
        renderCascader({ filterTreeNode: true, defaultOpen: true, renderLabel: renderStrong });
        await userEvent.type(getSelectionInput(), '北京');
        const [result] = getListOptions(0);
        expect(getListOptions(0)).toHaveLength(1);
        expect(result).toHaveTextContent(/^亚洲 \/ 中国 \/ 北京$/);
        expect(result.querySelector('strong')).toBeNull();
    });

    it('fix #1448：loadData 后将受控 value 重置为 [] 会清空选择', async () => {
        function Demo() {
            const [data, loadData] = createAsyncTreeData();
            const [value, setValue] = createSignal<SimpleValueType[]>([]);
            return (
                <>
                    <Cascader motion={false} placeholder="Please select" value={value()} changeOnSelect loadData={loadData} treeData={data()} onChange={setValue} onChangeWithObject />
                    <button type="button" onClick={() => setValue([])}>
                        重置
                    </button>
                </>
            );
        }
        render(() => <Demo />);
        await userEvent.click(getSelection());
        await userEvent.click(getOption('Node1'));
        await waitFor(() => expect(getLists()).toHaveLength(2));
        await userEvent.click(getOption('Node1 - 1'));
        expect(getSelectionText()).toEqual('Node1 / Node1 - 1');
        await userEvent.click(screen.getByRole('button', { name: '重置' }));
        expect(getSelectionText()).toEqual('Please select');
        expect(getSelection().querySelector(`.${prefixCls}-selection-placeholder`)).toHaveTextContent(/^Please select$/);
    });

    it('fix #1429：loadData 更新 treeData 时，treeData 中缺失的 value 保持显示', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        function Demo(props: Props) {
            const [data, loadData] = createAsyncTreeData();
            return <Cascader motion={false} loadData={loadData} treeData={data()} onChange={onChange} {...props} />;
        }
        for (const props of [{ value: '受控 Value' }, { defaultValue: 'defaultValue', showClear: true }] as Props[]) {
            const text = props.value ?? props.defaultValue;
            const { unmount } = render(() => <Demo {...props} />);
            expect(getSelectionText()).toEqual(text);
            await userEvent.click(getSelection());
            await userEvent.click(getOption('Node1'));
            await waitFor(() => expect(getLists()).toHaveLength(2));
            expect(getSelectionText()).toEqual(text);
            expect(onChange).not.toHaveBeenCalled();
            unmount();
        }
    });

    it('fix #1472：搜索时修改受控 value 不影响搜索输入框', async () => {
        const { rerender } = renderCascader({ filterTreeNode: true, value: ['Asia', 'China', 'Beijing'] });
        await userEvent.click(getSelection());
        expect(getSelectionInput()).toHaveValue('');
        rerender({ filterTreeNode: true, value: ['Asia', 'China', 'Shanghai'] });
        expect(getSelectionInput()).toHaveValue('');
        expect(document.querySelector(`.${prefixCls}-search-wrapper > span`)).toHaveTextContent(/^亚洲 \/ 中国 \/ 上海$/);
    });

    it('fix #2831：悬停路径已移动时，loadData 完成不会收起菜单', async () => {
        const pending: Record<string, () => void> = {};
        const managers = ['TCS Manager', 'AAA Manager'].map((label, i) => ({
            label,
            value: label,
            children: [0, 1, 2, 3].map((n) => ({ label: `${i * 4 + n}`, value: `${i * 4 + n}` })),
        }));
        function Demo() {
            const [value, setValue] = createSignal<SimpleValueType[]>();
            const [data, setData] = createSignal<CascaderData[]>(managers);
            const loadData = (selectedOpt: CascaderData[]) => {
                const target = selectedOpt[selectedOpt.length - 1];
                return new Promise<void>((resolve) => {
                    pending[target.value] = () => {
                        const children = [0, 1].map((n) => ({
                            label: `${target.value}${n}`,
                            value: `${target.value}${n}`,
                            isLeaf: true,
                        }));
                        setData((origin) => addChildren(origin, target.value, children));
                        resolve();
                    };
                });
            };
            return <Cascader motion={false} value={value()} changeOnSelect loadData={loadData} showClear showNext="hover" treeData={data()} onChange={setValue} />;
        }
        render(() => <Demo />);
        await userEvent.click(getSelection());
        fireEvent.mouseEnter(getOption('TCS Manager'));
        fireEvent.mouseEnter(getOption('0'));
        expect(Object.keys(pending)).toEqual(['0']);
        fireEvent.mouseEnter(getOption('AAA Manager'));
        expect(Array.from(getListOptions(1)).map((option) => option.textContent)).toEqual(['4', '5', '6', '7']);
        pending['0']();
        await Promise.resolve();
        expect(getLists()).toHaveLength(2);
        expect(Array.from(getListOptions(1)).map((option) => option.textContent)).toEqual(['4', '5', '6', '7']);
        expect(getOption('AAA Manager')).toHaveClass(`${prefixCls}-option-active`);
    });
});

describe('Cascader 行为', () => {
    const isChecked = (label: string) => getCheckbox(label).classList.contains(`${BASE_CLASS_PREFIX}-checkbox-checked`);
    const isIndeterminate = (label: string) => getCheckbox(label).classList.contains(`${BASE_CLASS_PREFIX}-checkbox-indeterminate`);

    it('选择只上报一次，点击外部仍会关闭', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        const onDropdownVisibleChange = vi.fn<NonNullable<CascaderProps['onDropdownVisibleChange']>>();
        const onBlur = vi.fn<NonNullable<CascaderProps['onBlur']>>();
        renderCascader({ onBlur, onChange, onDropdownVisibleChange });
        await userEvent.click(getSelection());
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
        await userEvent.click(getOption('亚洲'));
        await userEvent.click(getOption('中国'));
        await userEvent.click(getOption('北京'));
        expect(onChange.mock.calls).toEqual([[['Asia', 'China', 'Beijing']]]);
        await expectClosed();
        expect(getSelectionText()).toBe('亚洲 / 中国 / 北京');
        await userEvent.click(getSelection());
        await userEvent.click(document.body);
        await expectClosed();
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false], [true], [false]]);
        expect(onBlur).toHaveBeenCalledTimes(2);
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Cascader: { separator: ' > ', placeholder: 'global placeholder' } };
        try {
            const { unmount } = renderCascader();
            expect(getSelectionText()).toBe('global placeholder');
            unmount();
            renderCascader({ defaultValue: ['Asia', 'China', 'Beijing'], placeholder: 'own' });
            expect(getSelectionText()).toBe('亚洲 > 中国 > 北京');
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('data-* 与 aria 属性落在 combobox 根元素上', () => {
        renderCascader({
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
        renderCascader();
        const root = screen.getByRole('combobox');
        expect(root).toHaveAttribute('aria-expanded', 'false');
        expect(root).toHaveAttribute('aria-haspopup', 'tree');
        await userEvent.click(root);
        await waitFor(() => expect(root).toHaveAttribute('aria-expanded', 'true'));
        const target = document.getElementById(root.getAttribute('aria-controls') as string);
        expect(target).toHaveAttribute('role', 'tree');
        expect(target).toHaveAccessibleName(root.getAttribute('aria-label') as string);
    });

    describe('combobox 与 tree 用同一个名称来源', () => {
        const getTree = () => screen.getByRole('tree');

        it('使用方 aria-label 时两者都用该值', () => {
            renderCascader({ defaultOpen: true, 'aria-label': 'Region', insetLabel: 'Inset' });
            expect(screen.getByRole('combobox')).toHaveAccessibleName('Region');
            expect(getTree()).toHaveAttribute('aria-label', 'Region');
            expect(getTree()).not.toHaveAttribute('aria-labelledby');
        });

        it('使用方 aria-labelledby 优先于 insetLabel，两者指向同一个标签', () => {
            render(() => (
                <>
                    <span id="external-label">External</span>
                    <Cascader motion={false} aria-labelledby="external-label" defaultOpen insetLabel="Inset" treeData={treeData} />
                </>
            ));
            expect(screen.getByRole('combobox')).toHaveAccessibleName('External');
            expect(getTree()).toHaveAccessibleName('External');
        });

        it('只有 insetLabel 时 combobox 与 tree 都以 insetLabel 命名，没有 insetLabelId 时也能引用', () => {
            const { unmount } = renderCascader({ defaultOpen: true, insetLabel: 'Region' });
            expect(screen.getByRole('combobox')).toHaveAccessibleName('Region');
            expect(getTree()).toHaveAccessibleName('Region');
            unmount();
            renderCascader({ defaultOpen: true, insetLabel: 'Region', insetLabelId: 'region-label' });
            expect(screen.getByRole('combobox')).toHaveAttribute('aria-labelledby', 'region-label');
            expect(getTree()).toHaveAttribute('aria-labelledby', 'region-label');
        });

        it('有 prefix 时 insetLabel 不渲染，也不作名称来源', () => {
            render(() => (
                <ConfigProvider locale={en_US}>
                    <Cascader motion={false} defaultOpen insetLabel="Region" treeData={treeData} prefix="Pre" />
                </ConfigProvider>
            ));
            expect(screen.getByRole('combobox')).toHaveAccessibleName(en_US.Cascader.label);
            expect(getTree()).toHaveAccessibleName(en_US.Cascader.label);
        });

        it('没有任何名称来源时 tree 名称等于 combobox 的语言包回落名', () => {
            render(() => (
                <ConfigProvider locale={en_US}>
                    <Cascader motion={false} defaultOpen treeData={treeData} />
                </ConfigProvider>
            ));
            expect(screen.getByRole('combobox')).toHaveAccessibleName(en_US.Cascader.label);
            expect(getTree()).toHaveAccessibleName(en_US.Cascader.label);
        });

        it('触发器上的搜索框是 combobox 时同样以 insetLabel 命名', () => {
            renderCascader({ defaultOpen: true, multiple: true, filterTreeNode: true, insetLabel: 'Region' });
            expect(screen.getByRole('combobox')).toHaveAccessibleName('Region');
            expect(getTree()).toHaveAccessibleName('Region');
        });
    });

    it('formApi.reset 后 FormCascader 为空，失焦时校验一次', async () => {
        let formApi: FormApi | undefined;
        const validate = vi.fn<() => string>(() => '');
        render(() => (
            <Form getFormApi={(api) => (formApi = api)}>
                <FormCascader placeholder="pick" field="region" label="Region" treeData={treeData} trigger="blur" validator={validate} motion={false} />
            </Form>
        ));
        await userEvent.click(getSelection());
        await userEvent.click(getOption('北美洲'));
        await userEvent.click(getOption('美国'));
        expect(formApi?.getValue('region')).toEqual(['North America', 'United States']);
        expect(validate).toHaveBeenCalledTimes(1);
        await userEvent.click(getSelection());
        await userEvent.click(document.body);
        expect(validate).toHaveBeenCalledTimes(2);
        formApi?.reset();
        expect(formApi?.getValue('region')).toBeUndefined();
        expect(getSelectionText()).toBe('pick');
        for (const attr of ['insetlabel', 'insetlabelid', 'validatestatus']) {
            expect(getTrigger()).not.toHaveAttribute(attr);
        }
    });

    it('未声明的属性落在根元素上，Form 属性不出现在 DOM 中', () => {
        render(() => (
            <Form labelPosition="inset">
                <FormCascader id="region" title="tip" field="region" treeData={treeData} motion={false} />
            </Form>
        ));
        expect(getTrigger()).toHaveAttribute('title', 'tip');
        expect(getTrigger()).toHaveAttribute('id', 'region');
        for (const attr of ['insetlabel', 'insetlabelid', 'validatestatus', 'treedata']) {
            expect(getTrigger()).not.toHaveAttribute(attr);
        }
    });

    it('showRestTagsPopover 开启时悬停 +N 显示隐藏的标签', async () => {
        renderCascader({
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
        fireEvent.mouseEnter(plusN);
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-popover`)).not.toBeNull());
        const popoverTags = Array.from(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-popover .${BASE_CLASS_PREFIX}-tag-content`)).map((node) => node.textContent);
        expect(popoverTags).toEqual(['上海', '加拿大']);
    });

    it('在触发器上按 Escape 关闭已打开的菜单', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<CascaderProps['onDropdownVisibleChange']>>();
        renderCascader({ onDropdownVisibleChange });
        await userEvent.click(getSelection());
        expect(isDropdownOpen()).toBe(true);
        fireEvent.keyDown(getTrigger(), { key: 'Escape' });
        await expectClosed();
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('ref 上暴露 open、close、focus、blur 与 search', async () => {
        let ref: CascaderElement | undefined;
        renderCascader({ ref: (el: CascaderElement) => (ref = el), filterTreeNode: true, searchPosition: 'custom' });
        for (const method of ['open', 'close', 'focus', 'blur', 'search'] as const) {
            expect(typeof ref?.[method]).toBe('function');
        }
        ref?.open();
        ref?.search('美国');
        expect(getHighlights()).toHaveLength(1);
        ref?.close();
        await expectClosed();
    });

    it('受控多选跟随父组件回传的 value', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        function Demo() {
            const [value, setValue] = createSignal<SimpleValueType[][]>([]);
            return (
                <Cascader
                    motion={false}
                    multiple
                    value={value()}
                    treeData={treeData}
                    onChange={(v) => {
                        onChange(v);
                        setValue(v);
                    }}
                />
            );
        }
        render(() => <Demo />);
        await userEvent.click(getSelection());
        await userEvent.click(getOption('北美洲'));
        await userEvent.click(getCheckbox('美国'));
        expect(getTagTexts()).toEqual(['美国']);
        expect(isIndeterminate('北美洲')).toBe(true);
        await userEvent.click(getCheckbox('加拿大'));
        expect(getTagTexts()).toEqual(['北美洲']);
        expect(isChecked('北美洲')).toBe(true);
        await userEvent.click(getCheckbox('美国'));
        expect(getTagTexts()).toEqual(['加拿大']);
        expect(onChange.mock.calls.map(([v]) => v)).toEqual([[['North America', 'United States']], [['North America']], [['North America', 'Canada']]]);
    });

    it('父组件忽略 onChange 时，受控多选保持传入的 value', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        renderCascader({ multiple: true, value: [['North America', 'Canada']], onChange });
        await userEvent.click(getSelection());
        await userEvent.click(getOption('北美洲'));
        await userEvent.click(getCheckbox('美国'));
        expect(onChange).toHaveBeenLastCalledWith([['North America']]);
        expect(getTagTexts()).toEqual(['加拿大']);
        expect(isChecked('美国')).toBe(false);
    });

    it('非受控多选在 treeData 变化时重新计算选中节点', async () => {
        const { rerender } = renderCascader({ multiple: true });
        await userEvent.click(getSelection());
        await userEvent.click(getOption('亚洲'));
        await userEvent.click(getOption('中国'));
        await userEvent.click(getCheckbox('北京'));
        await userEvent.click(getCheckbox('上海'));
        expect(getTagTexts()).toEqual(['亚洲']);
        expect(isChecked('中国')).toBe(true);
        const grown = addChildren(treeData, 'China', [
            { label: '北京', value: 'Beijing' },
            { label: '上海', value: 'Shanghai' },
            { label: '广州', value: 'Guangzhou' },
        ]);
        rerender({ multiple: true, treeData: grown });
        expect(getTagTexts()).toEqual(['亚洲']);
        expect(isChecked('广州')).toBe(true);
    });

    it('多选的 treeData 整体替换后，标签沿用原节点：焦点保留，文字更新', () => {
        const value = [['North America', 'Canada']];
        const { rerender } = renderCascader({ multiple: true, defaultValue: value });
        const tag = screen.getByRole('button', { name: /加拿大/ });
        tag.focus();
        const relabelled = addChildren(treeData, 'North America', [unitedStates, { label: 'Canada', value: 'Canada', key: 'Canada' }]);
        rerender({ multiple: true, defaultValue: value, treeData: relabelled });
        expect(document.activeElement).toBe(tag);
        expect(getTagTexts()).toEqual(['Canada']);
    });

    it('非受控多选中，子节点全部选中后父节点显示为选中', async () => {
        renderCascader({ multiple: true, autoMergeValue: false });
        await userEvent.click(getSelection());
        await userEvent.click(getOption('亚洲'));
        await userEvent.click(getOption('中国'));
        await userEvent.click(getCheckbox('北京'));
        expect(isIndeterminate('中国')).toBe(true);
        await userEvent.click(getCheckbox('上海'));
        expect(isChecked('中国')).toBe(true);
        expect(getTagTexts()).toEqual(['北京', '上海', '中国', '亚洲']);
    });

    it('禁用节点的标签没有关闭按钮，其余标签照常关闭', async () => {
        const data = [
            {
                label: '亚洲',
                value: 'Asia',
                children: [
                    { label: '北京', value: 'Beijing', disabled: true },
                    { label: '上海', value: 'Shanghai' },
                ],
            },
        ];
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        renderCascader({
            treeData: data,
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
                ?.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tag-close`);
        expect(closeOf('北京')).toBeNull();
        await userEvent.click(closeOf('上海') as HTMLElement);
        expect(getTagTexts()).toEqual(['北京']);
    });

    it('打开两次后仍只保留一个外部点击监听', async () => {
        let ref: CascaderElement | undefined;
        const onBlur = vi.fn<NonNullable<CascaderProps['onBlur']>>();
        renderCascader({ ref: (el: CascaderElement) => (ref = el), onBlur });
        await userEvent.click(getSelection());
        ref?.open();
        ref?.open();
        fireEvent.mouseDown(document.body);
        await expectClosed();
        expect(onBlur).toHaveBeenCalledTimes(1);
        fireEvent.mouseDown(document.body);
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('父组件忽略清空时，受控多选仍显示传入的 value', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        renderCascader({ multiple: true, showClear: true, value: [['North America', 'Canada']], onChange });
        await userEvent.click(document.querySelector(`.${prefixCls}-clearbtn`) as HTMLElement);
        expect(onChange).toHaveBeenLastCalledWith([]);
        expect(getTagTexts()).toEqual(['加拿大']);
    });

    it('未声明的属性落在根元素上，组件属性不出现在 DOM 中', () => {
        renderCascader({ id: 'region', title: 'tip' });
        expect(getTrigger()).toHaveAttribute('title', 'tip');
        expect(getTrigger()).toHaveAttribute('id', 'region');
        for (const attr of ['treedata', 'motion', 'separator']) {
            expect(getTrigger()).not.toHaveAttribute(attr);
        }
    });

    it('打开状态下卸载后停止监听外部点击', () => {
        const onBlur = vi.fn<NonNullable<CascaderProps['onBlur']>>();
        const { unmount } = renderCascader({ onBlur, defaultOpen: true });
        expect(isDropdownOpen()).toBe(true);
        unmount();
        fireEvent.mouseDown(document.body);
        expect(onBlur).not.toHaveBeenCalled();
    });
});

describe('Cascader Tab 停靠点', () => {
    it('disabled 时 combobox 不是 Tab 停靠点', async () => {
        renderCascader({ disabled: true });
        expect(screen.getByRole('combobox')).toHaveAttribute('tabindex', '-1');
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });
});

describe('Cascader 树语义（APG combobox 搭配 tree 弹出层）', () => {
    it('各列组成一棵扁平的树，层级与位置由 aria 属性提供', async () => {
        renderCascader({ defaultOpen: true });
        await userEvent.click(getOption('亚洲'));
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
        renderCascader({ defaultOpen: true, defaultValue: ['North America', 'Canada'] });
        const canada = await screen.findByRole('treeitem', { name: '加拿大' });
        expect(canada).not.toHaveAttribute('aria-expanded');
        expect(canada).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('treeitem', { name: '美国' })).toHaveAttribute('aria-selected', 'false');
    });

    it('多选时使用 aria-checked，半选为 mixed，复选框仅作为图示', async () => {
        renderCascader({ defaultOpen: true, multiple: true, defaultValue: [['Asia', 'China', 'Beijing']] });
        await userEvent.click(getOption('亚洲'));
        await userEvent.click(getOption('中国'));
        expect(screen.getByRole('tree')).toHaveAttribute('aria-multiselectable', 'true');
        expect(screen.getByRole('treeitem', { name: '中国' })).toHaveAttribute('aria-checked', 'mixed');
        expect(screen.getByRole('treeitem', { name: '北京' })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('treeitem', { name: '北京' })).not.toHaveAttribute('aria-selected');
        // Solid's Checkbox puts aria-* on its native input, the only part with semantics
        const input = getCheckbox('北京').querySelector('input');
        expect(input).toHaveAttribute('aria-hidden', 'true');
        expect(input).toHaveAttribute('tabindex', '-1');
    });

    it('搜索结果是 option 组成的 listbox', async () => {
        renderCascader({ defaultOpen: true, filterTreeNode: true });
        await userEvent.type(getSelectionInput(), '美');
        const root = screen.getByRole('combobox');
        expect(root).toHaveAttribute('aria-haspopup', 'listbox');
        expect(document.getElementById(root.getAttribute('aria-controls') as string)).toHaveAttribute('role', 'listbox');
        expect(screen.getAllByRole('option')).toHaveLength(2);
    });

    it('filterRender 的选项获得 option 角色、id 与状态', async () => {
        const filterRender = (props: FilterRenderProps) => <div class={props.class}>{props.data.map((item) => item.label).join('-')}</div>;
        renderCascader({ defaultOpen: true, filterTreeNode: true, filterRender });
        await userEvent.type(getSelectionInput(), '北京');
        const option = screen.getByRole('option', { name: '亚洲-中国-北京' });
        expect(option).toHaveAttribute('aria-selected', 'false');
        expect(option.id).not.toBe('');
    });

    it('filterRender 返回字符串时包成 option 渲染', async () => {
        const filterRender = (props: FilterRenderProps) => <>{props.data.map((item) => item.label).join('-')}</>;
        renderCascader({ defaultOpen: true, filterTreeNode: true, filterRender });
        await userEvent.type(getSelectionInput(), '北京');
        const option = screen.getByRole('option', { name: '亚洲-中国-北京' });
        expect(option).toHaveAttribute('aria-selected', 'false');
        expect(option.id).not.toBe('');
    });
});

describe('Cascader 键盘操作', () => {
    it('打开时没有当前选项；Up 与 Down 在列内移动，Home 与 End 移到列的两端', async () => {
        renderCascader({ defaultOpen: true });
        const root = getTrigger();
        root.focus();
        expect(root).not.toHaveAttribute('aria-activedescendant');
        await userEvent.keyboard('{ArrowDown}');
        expect(activeLabel(root)).toBe('亚洲');
        expect(getOption('亚洲')).toHaveClass(`${prefixCls}-option-focused`);
        await userEvent.keyboard('{End}');
        expect(activeLabel(root)).toBe('北美洲');
        await userEvent.keyboard('{ArrowDown}');
        expect(activeLabel(root)).toBe('北美洲');
        await userEvent.keyboard('{Home}');
        expect(activeLabel(root)).toBe('亚洲');
    });

    it('Right 展开分支并移入，Left 返回并收起', async () => {
        renderCascader({ defaultOpen: true });
        const root = getTrigger();
        root.focus();
        await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}');
        expect(getOption('北美洲')).toHaveAttribute('aria-expanded', 'true');
        expect(activeLabel(root)).toBe('北美洲');
        await userEvent.keyboard('{ArrowRight}');
        expect(activeLabel(root)).toBe('美国');
        await userEvent.keyboard('{ArrowDown}{ArrowLeft}');
        expect(activeLabel(root)).toBe('北美洲');
        expect(getLists()).toHaveLength(2);
        await userEvent.keyboard('{ArrowLeft}');
        expect(getOption('北美洲')).toHaveAttribute('aria-expanded', 'false');
        expect(getLists()).toHaveLength(1);
    });

    it('在叶子节点上按 Enter 选中，关闭弹出层，焦点保留在 combobox', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        renderCascader({ defaultOpen: true, onChange });
        const root = getTrigger();
        root.focus();
        await userEvent.keyboard('{End}{ArrowRight}{ArrowRight}{ArrowDown}{Enter}');
        expect(onChange).toHaveBeenCalledWith(['North America', 'Canada']);
        await expectClosed();
        expect(root).toHaveFocus();
        expect(root).not.toHaveAttribute('aria-activedescendant');
    });

    it('禁用分支仍可到达，但不会展开', async () => {
        renderCascader({ defaultOpen: true, treeData: treeDataWithDisabled });
        const root = getTrigger();
        root.focus();
        await userEvent.keyboard('{ArrowDown}{ArrowRight}{ArrowRight}');
        expect(activeLabel(root)).toBe('中国');
        await userEvent.keyboard('{ArrowRight}{Enter}');
        expect(getOption('中国')).toHaveAttribute('aria-expanded', 'false');
        expect(getLists()).toHaveLength(2);
    });

    it('多选：Enter 与 Space 勾选当前选项', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        renderCascader({ defaultOpen: true, multiple: true, onChange });
        const root = getTrigger();
        root.focus();
        await userEvent.keyboard('{End}{Enter}');
        expect(getOption('北美洲')).toHaveAttribute('aria-checked', 'true');
        await userEvent.keyboard(' ');
        expect(getOption('北美洲')).toHaveAttribute('aria-checked', 'false');
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('RTL 下 Left 展开，Right 返回', async () => {
        render(() => (
            <ConfigProvider direction="rtl">
                <Cascader treeData={treeData} motion={false} defaultOpen />
            </ConfigProvider>
        ));
        const root = getTrigger();
        root.focus();
        await userEvent.keyboard('{ArrowDown}{ArrowLeft}{ArrowLeft}');
        expect(activeLabel(root)).toBe('中国');
        await userEvent.keyboard('{ArrowRight}');
        expect(activeLabel(root)).toBe('亚洲');
    });

    it('悬停显示另一列后，当前选项被清除', async () => {
        renderCascader({ defaultOpen: true, showNext: 'hover' });
        const root = getTrigger();
        root.focus();
        await userEvent.keyboard('{ArrowDown}{ArrowRight}{ArrowRight}');
        expect(activeLabel(root)).toBe('中国');
        await userEvent.hover(getOption('北美洲'));
        expect(root).not.toHaveAttribute('aria-activedescendant');
    });

    it('搜索输入框文本为空时所有按键都可导航；输入文本后只有 Up、Down 与 Enter 生效', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        renderCascader({ defaultOpen: true, filterTreeNode: true, onChange });
        const input = getSelectionInput();
        input.focus();
        await userEvent.keyboard('{ArrowDown}{ArrowRight}');
        expect(getOption('亚洲')).toHaveAttribute('aria-expanded', 'true');
        await userEvent.type(input, '美');
        expect(input).not.toHaveAttribute('aria-activedescendant');
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        expect(document.getElementById(input.getAttribute('aria-activedescendant') as string)).toHaveTextContent('加拿大');
        await userEvent.keyboard('{ArrowLeft}{Home}');
        expect(document.getElementById(input.getAttribute('aria-activedescendant') as string)).toHaveTextContent('加拿大');
        await userEvent.keyboard('{Enter}');
        expect(onChange).toHaveBeenCalledWith(['North America', 'Canada']);
    });

    it('搜索无结果时，方向键找不到选项', async () => {
        renderCascader({ defaultOpen: true, filterTreeNode: true });
        const input = getSelectionInput();
        await userEvent.type(input, 'none');
        await userEvent.keyboard('{ArrowDown}{End}');
        expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    it('多选在触发器上搜索时，TagInput 指向选项，Enter 勾选该选项', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        renderCascader({ defaultOpen: true, multiple: true, filterTreeNode: true, onChange });
        const input = getSelectionInput();
        await userEvent.type(input, '美');
        await userEvent.keyboard('{ArrowDown}');
        expect(document.getElementById(input.getAttribute('aria-activedescendant') as string)).toHaveTextContent('美国');
        await userEvent.keyboard('{Enter}');
        expect(onChange).toHaveBeenCalledWith([['North America', 'United States']]);
    });

    it('输入字符时移动到第一个以这些字符开头的可见选项', async () => {
        renderCascader({ defaultOpen: true });
        const root = getTrigger();
        root.focus();
        await userEvent.keyboard('北');
        expect(activeLabel(root)).toBe('北美洲');
    });

    it('输入字符时在所有可见列中搜索，从当前选项继续', async () => {
        renderCascader({ defaultOpen: true });
        const root = getTrigger();
        root.focus();
        await userEvent.keyboard('{ArrowDown}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}');
        expect(activeLabel(root)).toBe('北京');
        await userEvent.keyboard('北');
        expect(activeLabel(root)).toBe('北美洲');
        expect(getLists()).toHaveLength(3);
    });

    it('关闭状态的 combobox 输入字符无效，与 Select 一致', async () => {
        render(() => <Cascader treeData={treeData} />);
        const combobox = screen.getByRole('combobox');
        combobox.focus();
        await userEvent.keyboard('北');
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    it('在搜索输入框中输入的字符保留在文本中', async () => {
        renderCascader({ defaultOpen: true, filterTreeNode: true });
        const input = getSelectionInput();
        input.focus();
        await userEvent.keyboard('北');
        expect(input).toHaveValue('北');
    });

    it('选项导航用掉的按键也传给触发器的 onKeyDown，且只调用一次', async () => {
        const onKeyDown = vi.fn<(e: KeyboardEvent) => void>();
        renderCascader({ defaultOpen: true, onKeyDown });
        const root = getTrigger();
        root.focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(activeLabel(root)).toBe('亚洲');
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(onKeyDown.mock.calls[0][0].key).toBe('ArrowDown');
    });

    it('关闭的 combobox 上按 ArrowDown 或 ArrowUp 打开', async () => {
        render(() => <Cascader treeData={treeData} />);
        const combobox = screen.getByRole('combobox');
        combobox.focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        await userEvent.keyboard('{Escape}');
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
        await userEvent.keyboard('{ArrowUp}');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });

    it('不可搜索时关闭的 combobox 上按 Space 打开，Home 与 End 打开并移到首列的两端', async () => {
        render(() => <Cascader treeData={treeData} />);
        const combobox = screen.getByRole('combobox');
        combobox.focus();
        await userEvent.keyboard(' ');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        expect(combobox).not.toHaveAttribute('aria-activedescendant');
        await userEvent.keyboard('{Escape}{End}');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        expect(activeLabel(combobox)).toBe('北美洲');
        await userEvent.keyboard('{Escape}{Home}');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        expect(activeLabel(combobox)).toBe('亚洲');
    });

    it('可搜索时关闭状态的 Space 留给搜索输入框', async () => {
        render(() => <Cascader multiple filterTreeNode treeData={treeData} />);
        const input = screen.getByRole('combobox');
        input.focus();
        await userEvent.keyboard(' ');
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(input).toHaveValue(' ');
    });

    it('触发器中的搜索输入框作为 combobox（ARIA 1.2）', async () => {
        const { unmount } = render(() => <Cascader defaultValue={['Asia', 'China', 'Beijing']} filterTreeNode treeData={treeData} />);
        expect(screen.getByRole('combobox', { name: zh_CN.Cascader.label })).toHaveTextContent('亚洲 / 中国 / 北京');
        await userEvent.click(screen.getByRole('combobox'));
        const input = screen.getByRole('combobox', { name: zh_CN.Cascader.label });
        expect(input).toBe(getSelectionInput());
        expect(input).toHaveAttribute('aria-autocomplete', 'list');
        expect(input).toHaveAttribute('aria-expanded', 'true');
        expect(getTrigger()).not.toHaveAttribute('aria-expanded');
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(getTrigger()).not.toHaveAttribute('aria-describedby');
        expect(input).toHaveAccessibleDescription('亚洲 / 中国 / 北京');

        await userEvent.type(input, '美国{ArrowDown}');
        await userEvent.keyboard('{Enter}');
        expect(getSelectionText()).toBe('北美洲 / 美国');
        expect(screen.getByRole('combobox')).toBe(getTrigger());
        expect(getTrigger()).toHaveFocus();
        unmount();

        render(() => <Cascader multiple filterTreeNode treeData={treeData} />);
        expect(screen.getByRole('combobox')).toBe(getSelectionInput());
        expect(getTrigger()).toHaveAttribute('tabindex', '-1');
        expect(getTrigger()).not.toHaveAttribute('role');
    });
});

describe('Cascader 审计修复', () => {
    const otherTreeData: CascaderData[] = [{ label: '南极洲', value: 'Antarctica', children: [] }];

    it('受控单选可搜索时选中叶子，父组件回写 value 后 triggerRender 收到新标签', () => {
        const triggerRender = vi.fn<NonNullable<CascaderProps['triggerRender']>>(() => <span>trigger</span>);
        function Demo() {
            const [value, setValue] = createSignal<SimpleValueType[]>(['Asia', 'China', 'Shanghai']);
            return <Cascader motion={false} value={value()} defaultOpen filterTreeNode treeData={treeData} triggerRender={triggerRender} onChange={setValue} />;
        }
        render(() => <Demo />);
        fireEvent.click(screen.getByText('北京'));
        expect(triggerRender.mock.lastCall?.[0].inputValue).toBe('亚洲 / 中国 / 北京');
    });

    it('triggerRender 的 inputValue 类型可以是 displayRender 返回的节点', () => {
        expectTypeOf<Parameters<NonNullable<CascaderProps['triggerRender']>>[0]['inputValue']>().toEqualTypeOf<JSX.Element>();
    });

    it('非受控单选的已选路径被 treeData 移除后，不显示内部分隔键', () => {
        const { rerender } = renderCascader({ defaultValue: ['Asia', 'China', 'Beijing'] });
        expect(getSelectionText()).toBe('亚洲 / 中国 / 北京');
        rerender({ defaultValue: ['Asia', 'China', 'Beijing'], treeData: otherTreeData });
        expect(getSelectionText()).not.toContain('SEMI_CASCADER_SPLIT');
        expect(getSelectionText()).toContain('Beijing');
    });

    it('未加载的多级 defaultValue 在 treeData 更新后仍显示完整路径，子节点加载后恢复标签', () => {
        const base: CascaderData[] = [{ label: 'A', value: 'a', isLeaf: false }];
        const loadData = vi.fn<NonNullable<CascaderProps['loadData']>>();
        const { rerender } = renderCascader({ defaultValue: ['a', 'x'], loadData, treeData: base });
        const before = getSelectionText();
        rerender({ defaultValue: ['a', 'x'], loadData, treeData: [{ label: 'A', value: 'a', isLeaf: false, extra: 1 }] });
        expect(getSelectionText()).toBe(before);
        rerender({ defaultValue: ['a', 'x'], loadData, treeData: [{ label: 'A', value: 'a', children: [{ label: 'X', value: 'x', isLeaf: true }] }] });
        expect(getSelectionText()).toBe('A / X');
    });

    it('值含空格的缺失路径在 treeData 变化后不被截断', () => {
        const base: CascaderData[] = [{ label: 'A', value: 'a' }];
        const { rerender } = renderCascader({ defaultValue: ['a b'], treeData: base });
        const before = getSelectionText();
        expect(before).toContain('a b');
        rerender({
            defaultValue: ['a b'],
            treeData: [
                { label: 'A', value: 'a' },
                { label: 'C', value: 'c' },
            ],
        });
        expect(getSelectionText()).toBe(before);
    });

    it('ref.focus 与 ref.blur 移动 DOM 焦点：不可搜索时在触发器上', () => {
        let ref: CascaderElement | undefined;
        renderCascader({ ref: (el: CascaderElement) => (ref = el) });
        ref?.focus();
        expect(getTrigger()).toHaveFocus();
        ref?.blur();
        expect(getTrigger()).not.toHaveFocus();
    });

    it('ref.focus 与 ref.blur 移动 DOM 焦点：单选可搜索且关闭时在触发器上', () => {
        let ref: CascaderElement | undefined;
        renderCascader({ ref: (el: CascaderElement) => (ref = el), filterTreeNode: true });
        ref?.focus();
        expect(getTrigger()).toHaveFocus();
        ref?.blur();
        expect(getTrigger()).not.toHaveFocus();
    });

    it('ref.focus 与 ref.blur 移动 DOM 焦点：多选可搜索时在输入框上', () => {
        let ref: CascaderElement | undefined;
        renderCascader({ ref: (el: CascaderElement) => (ref = el), multiple: true, filterTreeNode: true });
        ref?.focus();
        expect(getSelectionInput()).toHaveFocus();
        ref?.blur();
        expect(getSelectionInput()).not.toHaveFocus();
    });

    it('多选关闭全部标签后，清除按钮随之消失', async () => {
        renderCascader({
            multiple: true,
            showClear: true,
            defaultValue: [['North America', 'Canada']],
        });
        expect(getTagTexts()).toEqual(['加拿大']);
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`) as HTMLElement);
        expect(getTagTexts()).toEqual([]);
        expect(document.querySelector(`.${prefixCls}-clearbtn`)).toBeNull();
    });

    it('多选受控 value 改为空数组后，清除按钮随之消失', () => {
        const { rerender } = renderCascader({ multiple: true, value: [['North America', 'Canada']], showClear: true });
        expect(document.querySelector(`.${prefixCls}-clearbtn`)).not.toBeNull();
        rerender({ multiple: true, value: [], showClear: true });
        expect(document.querySelector(`.${prefixCls}-clearbtn`)).toBeNull();
    });

    it('触发器上传入的 onClick 与捕获阶段的 keydown 监听会被调用，下拉照常开合', () => {
        const onClick = vi.fn<() => void>();
        const onKeyDownCapture = vi.fn<() => void>();
        renderCascader({ onClick, 'oncapture:keydown': onKeyDownCapture });
        const combobox = screen.getByRole('combobox');
        fireEvent.click(combobox);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        fireEvent.keyDown(combobox, { key: 'Escape' });
        expect(onKeyDownCapture).toHaveBeenCalledTimes(1);
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });
});

describe('Cascader 选中状态、搜索与回调', () => {
    const lettersA: CascaderData[] = [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
    ];
    const lettersB: CascaderData[] = [
        { label: 'B', value: 'b' },
        { label: 'C', value: 'c' },
    ];

    it('多选 defaultValue 为 0 时选中 value 为 0 的节点', () => {
        renderCascader({
            defaultValue: 0,
            multiple: true,
            treeData: [
                { label: 'Zero', value: 0 },
                { label: 'One', value: 1 },
            ],
        });
        expect(getTagTexts()).toEqual(['Zero']);
    });

    it('defaultOpen 只通知一次 onDropdownVisibleChange', () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<CascaderProps['onDropdownVisibleChange']>>();
        renderCascader({ defaultOpen: true, onDropdownVisibleChange });
        expect(isDropdownOpen()).toBe(true);
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
    });

    it('受控单选的 value 内容不变时，搜索输入不被清空', async () => {
        function Demo() {
            const [keyword, setKeyword] = createSignal('');
            return (
                <>
                    <Cascader motion={false} value={[]} filterTreeNode treeData={treeData} onSearch={setKeyword} />
                    <output>{keyword()}</output>
                </>
            );
        }
        render(() => <Demo />);
        await userEvent.click(getTrigger());
        await userEvent.type(getSelectionInput(), '北');
        expect(getSelectionInput()).toHaveValue('北');
        expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('受控单选在搜索中选中分支结果（filterLeafOnly=false）后关闭下拉', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        renderCascader({ value: [], filterLeafOnly: false, filterTreeNode: true, onChange });
        await userEvent.click(getTrigger());
        await userEvent.type(getSelectionInput(), '中国');
        await userEvent.click(screen.getByRole('option', { name: '亚洲 / 中国' }));
        expect(onChange).toHaveBeenCalledWith(['Asia', 'China']);
        await expectClosed();
    });

    it('受控单选 value 改为分支路径（未开 changeOnSelect）时显示 placeholder', () => {
        const { rerender } = renderCascader({ placeholder: '请选择', value: ['Asia', 'China', 'Beijing'] });
        expect(getSelectionText()).toBe('亚洲 / 中国 / 北京');
        rerender({ placeholder: '请选择', value: ['Asia', 'China'] });
        expect(getSelectionText()).toBe('请选择');
    });

    it('多选搜索中勾选结果后回到列视图，onSearch 收到空字符串', async () => {
        const onSearch = vi.fn<NonNullable<CascaderProps['onSearch']>>();
        renderCascader({ defaultOpen: true, multiple: true, filterTreeNode: true, onSearch });
        await userEvent.type(getSelectionInput(), '美');
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        await userEvent.keyboard('{ArrowDown}{Enter}');
        expect(getTagTexts()).toEqual(['美国']);
        expect(getSelectionInput()).toHaveValue('');
        expect(screen.queryByRole('listbox')).toBeNull();
        expect(screen.getByRole('tree')).toBeInTheDocument();
        expect(onSearch).toHaveBeenLastCalledWith('');
    });

    it('关闭时在多选搜索框输入后再打开，回到列视图并通知 onSearch 清空', async () => {
        const onSearch = vi.fn<NonNullable<CascaderProps['onSearch']>>();
        renderCascader({ multiple: true, filterTreeNode: true, onSearch });
        const input = screen.getByRole('combobox');
        input.focus();
        await userEvent.keyboard('北');
        expect(input).toHaveAttribute('aria-expanded', 'false');
        await userEvent.keyboard('{ArrowDown}');
        expect(input).toHaveAttribute('aria-expanded', 'true');
        expect(input).toHaveValue('');
        expect(screen.queryByRole('listbox')).toBeNull();
        expect(screen.getByRole('tree')).toBeInTheDocument();
        expect(onSearch).toHaveBeenLastCalledWith('');
    });

    it('不可搜索、打开且没有当前选项时，Space 与 Enter 一样关闭并阻止滚动', async () => {
        renderCascader();
        const combobox = getTrigger();
        combobox.focus();
        await userEvent.keyboard(' ');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        const notPrevented = fireEvent.keyDown(combobox, { key: ' ' });
        expect(notPrevented).toBe(false);
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    it('多选没有选中值时，清除按钮只清空搜索文字，不触发 onChange', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        const onSearch = vi.fn<NonNullable<CascaderProps['onSearch']>>();
        renderCascader({ defaultOpen: true, multiple: true, filterTreeNode: true, showClear: true, onChange, onSearch });
        await userEvent.type(getSelectionInput(), '北');
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Cascader.clear }));
        expect(getSelectionInput()).toHaveValue('');
        expect(onChange).not.toHaveBeenCalled();
        expect(onSearch).toHaveBeenLastCalledWith('');
    });

    it('多选没有搜索文字时清除已选值，不触发 onSearch', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        const onSearch = vi.fn<NonNullable<CascaderProps['onSearch']>>();
        renderCascader({ multiple: true, filterTreeNode: true, showClear: true, defaultValue: [['North America', 'Canada']], onChange, onSearch });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Cascader.clear }));
        expect(onChange).toHaveBeenCalledWith([]);
        expect(onSearch).not.toHaveBeenCalled();
    });

    it('非受控多选（unRelated）：勾选的节点被 treeData 移除后再勾选，onChange 不含空路径', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        const { rerender } = renderCascader({ multiple: true, checkRelation: 'unRelated', defaultOpen: true, treeData: lettersA, onChange });
        await userEvent.click(getCheckbox('A'));
        rerender({ multiple: true, checkRelation: 'unRelated', defaultOpen: true, treeData: lettersB, onChange });
        await userEvent.click(getCheckbox('C'));
        expect(onChange).toHaveBeenLastCalledWith([['c']]);
    });

    it('非受控多选：已选节点被 treeData 移除后显示占位符、不显示清除按钮，treeData 恢复前未交互则重新勾选', () => {
        const props = { multiple: true, showClear: true, placeholder: '请选择', defaultValue: [['a']] };
        const { rerender } = renderCascader({ ...props, treeData: lettersA });
        expect(getTagTexts()).toEqual(['A']);
        rerender({ ...props, treeData: lettersB });
        expect(getTagTexts()).toEqual([]);
        expect(getSelectionText()).toBe('请选择');
        expect(screen.queryByRole('button', { name: zh_CN.Cascader.clear })).toBeNull();
        rerender({ ...props, treeData: lettersA });
        expect(getTagTexts()).toEqual(['A']);
    });

    it('非受控多选：defaultValue 中 treeData 晚到的路径在到达前不显示，到达后勾选', () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        const props = { multiple: true, showClear: true, placeholder: '请选择', defaultValue: [['a']], onChange };
        const { rerender } = renderCascader({ ...props, treeData: lettersB });
        expect(getSelectionText()).toBe('请选择');
        expect(screen.queryByRole('button', { name: zh_CN.Cascader.clear })).toBeNull();
        rerender({ ...props, treeData: lettersA });
        expect(getTagTexts()).toEqual(['A']);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('受控多选：value 中不在当前 treeData 的路径在勾选其他节点时仍保留在 onChange 中', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        const { rerender } = renderCascader({ multiple: true, value: [['a']], defaultOpen: true, treeData: [{ label: 'A', value: 'a' }], onChange });
        rerender({ multiple: true, value: [['a']], defaultOpen: true, treeData: [{ label: 'B', value: 'b' }], onChange });
        await userEvent.click(getCheckbox('B'));
        expect(onChange).toHaveBeenLastCalledWith([['a'], ['b']]);
    });

    it.each([
        ['单选', { value: ['Asia', 'China', 'Beijing'] }, { value: [] }],
        ['可搜索多选', { multiple: true, filterTreeNode: true, value: [['Asia', 'China', 'Beijing']] }, { multiple: true, filterTreeNode: true, value: [] }],
    ])('%s：清除按钮持焦时值被外部清空，焦点回到 combobox', async (_, before, after) => {
        const { rerender } = renderCascader({ showClear: true, ...before });
        const clear = screen.getByRole('button', { name: zh_CN.Cascader.clear });
        clear.focus();
        rerender({ showClear: true, ...after });
        // the handover runs in a microtask after the update that removes the button
        await Promise.resolve();
        expect(screen.getByRole('combobox')).toHaveFocus();
    });

    it('加载中的选项名称不含加载图标的文字，并带 aria-busy', async () => {
        const loadData = vi.fn<NonNullable<CascaderProps['loadData']>>(() => new Promise<void>(() => {}));
        renderCascader({ treeData: asyncTreeData, loadData, defaultOpen: true });
        await userEvent.click(getOption('Node1'));
        const option = screen.getByRole('treeitem', { name: 'Node1' });
        expect(option).toHaveAttribute('aria-busy', 'true');
        expect(screen.getByRole('treeitem', { name: 'Node2' })).not.toHaveAttribute('aria-busy');
    });

    it('受控多选：不在当前 treeData 的路径计入 max', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        const onExceed = vi.fn<NonNullable<CascaderProps<true>['onExceed']>>();
        renderCascader({ max: 1, multiple: true, value: [['a']], defaultOpen: true, treeData: lettersB, onChange, onExceed });
        await userEvent.click(getCheckbox('B'));
        expect(onChange).not.toHaveBeenCalled();
        expect(onExceed).toHaveBeenCalledTimes(1);
    });

    it('stopPropagation 为 false 时，面板内嵌套 Popover 里按下鼠标不关闭面板，在 body 上按下才关闭', async () => {
        const topSlot = (
            <Popover content={<button type="button">inside nested</button>} motion={false} trigger="custom" visible>
                <span>nested anchor</span>
            </Popover>
        );
        renderCascader({ defaultOpen: true, stopPropagation: false, topSlot });
        fireEvent.mouseDown(screen.getByRole('button', { name: 'inside nested' }));
        expect(getLists()).toHaveLength(1);
        fireEvent.mouseDown(document.body);
        await expectClosed();
    });

    it('触发器内 +N 弹层里按下鼠标不关闭面板，在 body 上按下才关闭', async () => {
        renderCascader({
            multiple: true,
            leafOnly: true,
            maxTagCount: 1,
            defaultOpen: true,
            showRestTagsPopover: true,
            restTagsPopoverProps: { trigger: 'custom', visible: true, motion: false },
            defaultValue: [
                ['Asia', 'China', 'Beijing'],
                ['Asia', 'China', 'Shanghai'],
            ],
        });
        const restTag = screen.getAllByText('上海').find((node) => node.closest(`.${BASE_CLASS_PREFIX}-popover`));
        fireEvent.mouseDown(restTag as HTMLElement);
        expect(document.querySelector(`.${prefixCls}-option-lists`)).not.toBeNull();
        fireEvent.mouseDown(document.body);
        await expectClosed();
    });

    it('+N 弹层打开时，受控 value 变化后弹层里的标签随之更新', () => {
        const base = { multiple: true, leafOnly: true, maxTagCount: 1, showRestTagsPopover: true, restTagsPopoverProps: { trigger: 'custom', visible: true, motion: false } };
        const { rerender } = renderCascader({
            ...base,
            value: [
                ['Asia', 'China', 'Beijing'],
                ['Asia', 'China', 'Shanghai'],
            ],
        });
        // an earlier test creates its topSlot Popover outside the render root, so it stays in the document; find this one by its tag
        const popoverSelector = `.${BASE_CLASS_PREFIX}-popover`;
        const popover = () =>
            screen
                .getAllByText('上海')
                .find((node) => node.closest(popoverSelector))
                ?.closest(popoverSelector);
        expect(popover()).toHaveTextContent('上海');
        rerender({
            ...base,
            value: [
                ['Asia', 'China', 'Beijing'],
                ['Asia', 'China', 'Shanghai'],
                ['North America', 'Canada'],
            ],
        });
        expect(popover()).toHaveTextContent('上海加拿大');
    });

    it('受控多选：只有不在当前 treeData 的路径时显示清除按钮，点击后 onChange([])', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        renderCascader({ multiple: true, value: [['a']], showClear: true, treeData: lettersB, onChange });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Cascader.clear }));
        expect(onChange).toHaveBeenCalledWith([]);
    });
});

describe('Cascader 的 treeData 变化', () => {
    const smallTreeData: CascaderData[] = [
        {
            label: '亚洲',
            value: 'Asia',
            children: [
                { label: '北京', value: 'Beijing' },
                { label: '上海', value: 'Shanghai' },
            ],
        },
    ];
    const grownTreeData: CascaderData[] = [
        {
            label: '亚洲',
            value: 'Asia',
            children: [
                { label: '北京', value: 'Beijing' },
                { label: '上海', value: 'Shanghai' },
                { label: '北海', value: 'Beihai' },
            ],
        },
    ];
    const getResults = () => Array.from(document.querySelectorAll(`.${prefixCls}-option-flatten`)).map((row) => row.textContent);

    it.each([false, true])('搜索中 treeData 更新时按当前关键字重算结果（multiple 为 %s）', async (multiple) => {
        const props = { filterTreeNode: true, defaultOpen: true, multiple };
        const { rerender } = renderCascader({ ...props, treeData: smallTreeData });
        await userEvent.type(getSelectionInput(), '北');
        expect(getResults()).toEqual(['亚洲 / 北京']);
        rerender({ ...props, treeData: grownTreeData });
        expect(getResults()).toEqual(['亚洲 / 北京', '亚洲 / 北海']);
    });
});

describe('触发器搜索框', () => {
    it('全局 Input 默认值不给触发器搜索框加清除按钮与前后缀', async () => {
        semiGlobal.config.overrideDefaultProps = {
            Input: { showClear: true, prefix: 'mark-prefix', suffix: 'mark-suffix', insetLabel: 'mark-label', addonBefore: 'mark-before', addonAfter: 'mark-after' },
        };
        try {
            render(() => <Cascader filterTreeNode treeData={[{ label: 'Asia', value: 'asia', children: [{ label: 'China', value: 'china' }] }]} />);
            await userEvent.click(getTrigger());
            await userEvent.paste('a');
            expect(document.body.textContent).not.toMatch(/mark-/);
            expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('displayRender 返回节点时搜索框的值仍是字符串', async () => {
        renderCascader({ filterTreeNode: true, defaultValue: ['Asia', 'China', 'Beijing'], displayRender: (labels: Array<string | number>) => <b>{labels.length}</b> });
        expect(getSelection().querySelector('b')).toHaveTextContent('3');
        await userEvent.click(getTrigger());
        expect(getSelectionInput()).toHaveValue('');
        await userEvent.keyboard('北');
        expect(getSelectionInput()).toHaveValue('北');
    });
});

describe('Cascader 在 InputGroup 内', () => {
    it('自带的 size 优先于组的 size，没传时取组的，包装元素内也一样', () => {
        render(() => (
            <InputGroup size="large">
                <div>
                    <Cascader motion={false} size="small" treeData={treeData} />
                    <Cascader motion={false} treeData={treeData} />
                </div>
            </InputGroup>
        ));
        const [own, inherit] = document.querySelectorAll(`.${prefixCls}`);
        expect(own).toHaveClass(`${prefixCls}-small`);
        expect(own).not.toHaveClass(`${prefixCls}-large`);
        expect(inherit).toHaveClass(`${prefixCls}-large`);
    });

    it('组的 disabled 作用于未设置的控件，自身 disabled={false} 优先', () => {
        const { unmount } = render(() => (
            <InputGroup disabled>
                <Cascader motion={false} treeData={treeData} />
            </InputGroup>
        ));
        expect(getTrigger()).toHaveClass(`${prefixCls}-disabled`);
        unmount();
        render(() => (
            <InputGroup disabled>
                <Cascader motion={false} disabled={false} treeData={treeData} />
            </InputGroup>
        ));
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-disabled`);
    });
});
