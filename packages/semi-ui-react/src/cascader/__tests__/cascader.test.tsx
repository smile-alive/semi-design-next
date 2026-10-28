import { createRef, StrictMode, useState } from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import type { Virtualize } from '@fibrae/semi-foundation/cascader/foundation';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { Cascader, ConfigProvider, Form, Popover, Tag } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { CascaderData, CascaderHandle, CascaderProps, Entity, SimpleValueType } from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-cascader`;

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

const treeDataWithDisabled = [
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

const treeDataWithReactNode = [
    {
        label: <strong>亚洲</strong>,
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
                        label: <div>上海</div>,
                        value: 'Shanghai',
                        key: 'shanghai',
                    },
                ],
            },
        ],
    },
    {
        label: <p>北美洲</p>,
        value: 'North America',
        key: 'North America',
    },
];

let commonProps = {
    motion: false,
};

function renderCascader(props = {}) {
    return render(<Cascader treeData={treeData} {...commonProps} {...props} />);
}

const getTrigger = () => document.querySelector(`.${prefixCls}`);
const getSelection = () => document.querySelector(`.${prefixCls}-selection`);
const getSelectionText = () => getSelection().textContent;
const getSelectionInput = () => getSelection().querySelector('input');
const getLists = () => document.querySelectorAll(`.${prefixCls}-option-list`);
const getListOptions = (listIndex) => getLists()[listIndex].querySelectorAll(`li.${prefixCls}-option`);
const getOption = (label) => screen.getByText(label, { selector: `.${prefixCls}-option-label > span` }).closest('li');
const getCheckbox = (label) => getOption(label).querySelector(`.${BASE_CLASS_PREFIX}-checkbox`);
const getHighlights = () => document.querySelectorAll(`.${prefixCls}-option-label-highlight`);
const getTagTexts = () => Array.from(document.querySelectorAll(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag-content`)).map((node) => node.textContent);
const focus = (el) => act(() => el.focus());
const activeLabel = (host) => document.getElementById(host.getAttribute('aria-activedescendant'))?.querySelector(`.${prefixCls}-option-label`)?.textContent;
const isDropdownOpen = () => document.querySelector(`.${prefixCls}-option-lists`) !== null;

const asyncTreeData = [
    { label: 'Node1', value: '0-0' },
    { label: 'Node2', value: '0-1' },
    { label: 'Node3', value: '0-2', isLeaf: true },
];

const addChildren = (list, value, children) =>
    list.map((node) => {
        if (node.value === value) {
            return { ...node, children };
        }
        return node.children ? { ...node, children: addChildren(node.children, value, children) } : node;
    });

function useAsyncTreeData() {
    const [data, setData] = useState(asyncTreeData);
    const loadData: NonNullable<CascaderProps['loadData']> = (selectedOpt) => {
        const { label, value, children } = selectedOpt[selectedOpt.length - 1];
        if (!children) {
            setData((origin) =>
                addChildren(origin, value, [
                    { label: `${label} - 1`, value: `${label}-1`, isLeaf: true },
                    { label: `${label} - 2`, value: `${label}-2`, isLeaf: true },
                ])
            );
        }
        return Promise.resolve();
    };
    return [data, loadData] as const;
}

describe('Cascader', () => {
    it('className / style', () => {
        renderCascader({ className: 'test', style: { height: 420 } });
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
        rerender(<Cascader treeData={treeData} {...commonProps} validateStatus="error" />);
        expect(getTrigger()).toHaveClass(`${prefixCls}-error`);
        rerender(<Cascader treeData={treeData} {...commonProps} validateStatus="warning" />);
        expect(getTrigger()).toHaveClass(`${prefixCls}-warning`);
    });

    it('不同 size', () => {
        const { rerender } = renderCascader({});
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-large`);
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-small`);
        rerender(<Cascader treeData={treeData} {...commonProps} size="large" />);
        expect(getTrigger()).toHaveClass(`${prefixCls}-large`);
        rerender(<Cascader treeData={treeData} {...commonProps} size="small" />);
        expect(getTrigger()).toHaveClass(`${prefixCls}-small`);
    });

    it('自定义 prefix / suffix / insetLabel', () => {
        const { unmount } = renderCascader({
            prefix: <div className="prefix">prefix content</div>,
            suffix: <div className="suffix">suffix content</div>,
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
        let opt = document.querySelectorAll(`.${prefixCls}-option`);
        expect(opt.length).toEqual(1);
        expect(opt[0]).toHaveClass(`${prefixCls}-option-empty`);
        rerender(<Cascader {...commonProps} defaultOpen emptyContent="test" treeData={[]} />);
        expect(document.querySelectorAll(`.${prefixCls}-option`)[0].textContent).toEqual('test');
    });

    it('多选且非受控模式下动态变化的 treeData', () => {
        const { rerender } = renderCascader({ defaultValue: 'Asia', multiple: true });
        expect(getTagTexts()).toEqual(['亚洲']);
        rerender(<Cascader {...commonProps} defaultValue="Asia" multiple treeData={treeDataWithDisabled} />);
        expect(getTagTexts()).toEqual(['亚洲']);
    });

    it('多选受控 value 变回 undefined 时清空，有 defaultValue 也一样', () => {
        const { rerender } = renderCascader({ defaultValue: 'Europe', value: 'Asia', multiple: true });
        expect(getTagTexts()).toEqual(['亚洲']);
        rerender(<Cascader {...commonProps} defaultValue="Europe" multiple value={undefined} treeData={treeData} />);
        expect(getTagTexts()).toEqual([]);
    });

    it('多选且受控模式下动态变化的 treeData', () => {
        const { rerender } = renderCascader({ value: 'Asia', multiple: true });
        expect(getTagTexts()).toEqual(['亚洲']);
        rerender(<Cascader {...commonProps} multiple value="Asia" treeData={treeDataWithDisabled} />);
        expect(getTagTexts()).toEqual(['亚洲']);
    });

    it('defaultOpen', () => {
        renderCascader({ defaultOpen: true });
        expect(document.querySelectorAll(`.${prefixCls}-option-lists`).length).toEqual(1);
        expect(getLists()).toHaveLength(1);
    });

    // jsdom has no layout: only the trigger-width variable wiring is checked
    it('空数据时下拉最小宽度跟随触发器', () => {
        const wrapper = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
        const { rerender } = renderCascader({ defaultOpen: true, treeData: [] });
        expect(wrapper().style.minWidth).toBe('var(--semi-tooltip-trigger-width)');
        rerender(<Cascader {...commonProps} defaultOpen treeData={treeData} />);
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
            displayRender: (list) => '已选择：' + list.join(' -> '),
        });
        expect(getSelectionText()).toEqual('已选择：亚洲 -> 中国 -> 北京');
    });

    it('不可搜索的单选模式下 label 为 ReactNode', () => {
        const { unmount } = renderCascader({
            defaultValue: ['Asia', 'China', 'Shanghai'],
            treeData: treeDataWithReactNode,
        });
        const span = () => getSelection().querySelector('span');
        expect(span().querySelector('strong').textContent).toEqual('亚洲');
        expect(span().querySelector('div').textContent).toEqual('上海');
        expect(span().textContent).toEqual('亚洲 / 中国 / 上海');
        unmount();

        const { unmount: unmount2 } = renderCascader({
            defaultValue: ['North America'],
            treeData: treeDataWithReactNode,
        });
        expect(span().querySelector('p').textContent).toEqual('北美洲');
        expect(span().textContent).toEqual('北美洲');
        unmount2();

        renderCascader({
            defaultValue: ['Asia', 'China', 'Shanghai'],
            treeData: treeDataWithReactNode,
            separator: ' - ',
        });
        expect(span().querySelector('strong').textContent).toEqual('亚洲');
        expect(span().querySelector('div').textContent).toEqual('上海');
        expect(span().textContent).toEqual('亚洲 - 中国 - 上海');
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
        expect(getSelection().querySelector('span').textContent).toEqual('亚洲 / 中国');
        unmount();

        const { unmount: unmount2 } = renderCascader({
            treeData: treeDataWithDisabled,
            changeOnSelect: true,
            filterTreeNode: true,
            defaultValue: ['Asia', 'China'],
        });
        expect(document.querySelector(`.${prefixCls}-search-wrapper span`).textContent).toEqual('亚洲 / 中国');
        unmount2();

        const { unmount: unmount3 } = renderCascader({
            treeData: treeDataWithDisabled,
            changeOnSelect: true,
            value: ['Asia', 'China'],
        });
        expect(getSelection().querySelector('span').textContent).toEqual('亚洲 / 中国');
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
        expect(searchWrapper.querySelector('span').textContent).toEqual('placeholder');
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

    it('搜索结果延后渲染，aria-activedescendant 指向已渲染的选项', async () => {
        renderCascader({ filterTreeNode: true, defaultOpen: true });
        const input = getSelectionInput();
        await focus(input);
        fireEvent.change(input, { target: { value: '北' } });
        expect(input).toHaveValue('北');
        await waitFor(() => expect(getHighlights()).toHaveLength(3));
        await userEvent.keyboard('{ArrowDown}');
        const active = document.getElementById(input.getAttribute('aria-activedescendant'));
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
        const asia = treeData[0];
        const china = asia.children[0];
        const beijing = china.children[0];
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

    it('受控：value 显示正确', () => {
        const asia = treeData[0];
        const china = asia.children[0];
        const beijing = china.children[0];
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
        await userEvent.click(document.querySelector(`.${prefixCls}-clearbtn`));
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
        render(<Cascader defaultValue={[['Asia', 'China', 'Beijing']]} multiple filterTreeNode showClear treeData={treeData} />);
        const input = screen.getByRole('combobox');
        expect(input.tagName).toBe('INPUT');
        act(() => input.focus());
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
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
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

        const onChange2 = vi.fn<NonNullable<CascaderProps['onChange']>>();
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
            defaultValue: [northAmerica, northAmerica.children[0]],
        });
        expect(getTagTexts()).toEqual(['美国']);
    });

    it('多选 enableLeafClick', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
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
        expect(getSelection().querySelector('span').textContent).toEqual('亚洲 > 中国 > 北京');
        await userEvent.type(getSelectionInput(), '中国');
        expect(document.querySelectorAll(`.${prefixCls}-option-list li`)[0].textContent).toEqual('亚洲 > 中国 > 北京');
    });

    it('search ref 方法', () => {
        const ref = createRef<CascaderHandle>();
        renderCascader({ ref, filterTreeNode: true, searchPosition: 'custom', defaultOpen: true });
        act(() => ref.current.search('北京'));
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

    it('ref 方法', () => {
        const ref = createRef<CascaderHandle>();
        renderCascader({ ref, multiple: true });
        act(() => ref.current.open());
        expect(isDropdownOpen()).toBe(true);

        act(() => ref.current.close());
        expect(isDropdownOpen()).toBe(false);
    });

    it('autoMerge 为 false 且 value 为 []', () => {
        renderCascader({ multiple: true, autoMergeValue: false, value: [], placeholder: 'autoMergeValue 为 false' });
        expect(document.querySelector(`.${prefixCls}-selection-placeholder`).textContent).toEqual('autoMergeValue 为 false');
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
        renderCascader({ arrowIcon: <span className="custom-arrow">arrow</span> });
        expect(document.querySelector(`.${prefixCls}-arrow .custom-arrow`)).toHaveTextContent('arrow');
    });

    it('清除按钮渲染在箭头之前，悬停与聚焦时由样式切换', () => {
        renderCascader({
            showClear: true,
            defaultValue: ['Asia', 'China', 'Beijing'],
            arrowIcon: <span className="custom-arrow">arrow</span>,
        });
        const clear = screen.getByRole('button', { name: zh_CN.Cascader.clear });
        expect(clear.compareDocumentPosition(document.querySelector('.custom-arrow'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
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
        const ref = createRef<CascaderHandle>();
        renderCascader({ ref });

        act(() => ref.current.focus());
        // the focus ring comes from :focus; the class marks only the open state
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-focus`);
        expect(getTrigger()).toHaveFocus();

        act(() => ref.current.blur());
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-focus`);
        expect(getTrigger()).not.toHaveFocus();
    });

    it('open 与 close 方法', () => {
        const ref = createRef<CascaderHandle>();
        const onDropdownVisibleChange = vi.fn<NonNullable<CascaderProps['onDropdownVisibleChange']>>();
        renderCascader({ ref, onDropdownVisibleChange });

        act(() => ref.current.open());
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(true);
        expect(getLists()).toHaveLength(1);

        act(() => ref.current.close());
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        expect(isDropdownOpen()).toBe(false);
    });

    it('多选模式下使用 selectedKeys', () => {
        renderCascader({ multiple: true, defaultValue: [['Asia', 'China', 'Beijing']], autoMergeValue: false });

        expect(getSelection()).toHaveClass(`${prefixCls}-selection-multiple`);
        expect(getTagTexts()).toEqual(['北京']);
    });

    it('自定义 triggerRender 触发器', () => {
        renderCascader({
            triggerRender: ({ value }) => <div className="custom-trigger">Custom: {value}</div>,
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
        expect(onListScroll.mock.calls[0][1]).toEqual({
            panelIndex: 1,
            activeNode: treeData[0].children[0].children[0],
        });
    });

    it('多选模式下的 displayRender', () => {
        const displayRender = vi.fn<NonNullable<CascaderProps<true>['displayRender']>>((entity, idx) => (
            <span key={idx} className="custom-display">
                {entity.data.label}
            </span>
        ));
        renderCascader({
            multiple: true,
            displayRender,
            defaultValue: [['Asia', 'China', 'Beijing']],
            autoMergeValue: false,
        });

        expect(displayRender).toHaveBeenCalledWith(expect.objectContaining({ data: treeData[0].children[0].children[0] }), 0);
        expect(Array.from(document.querySelectorAll('.custom-display')).map((node) => node.textContent)).toEqual(['北京']);
        expect(document.querySelector(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag`)).toBeNull();
    });

    it('多选模式下的 handleTagClose', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        renderCascader({
            multiple: true,
            onChange,
            defaultValue: [['Asia', 'China', 'Beijing']],
            autoMergeValue: false,
        });

        await userEvent.click(document.querySelector(`.${prefixCls}-selection-tag .${BASE_CLASS_PREFIX}-tag-close`));
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
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        renderCascader({
            multiple: true,
            filterTreeNode: true,
            onChange,
            defaultValue: [['Asia', 'China', 'Beijing']],
            autoMergeValue: false,
        });

        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-tagInput .${BASE_CLASS_PREFIX}-tag .${BASE_CLASS_PREFIX}-tag-close`));
        expect(onChange).toHaveBeenCalledWith([]);
        expect(getTagTexts()).toEqual([]);
    });

    it('keyEntities 中没有该 key 时 renderTagItem 返回 null', () => {
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
        const treeDataWithDisabled = [
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
            treeData: treeDataWithDisabled,
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
            prefix: <span className="custom-prefix">Prefix</span>,
            suffix: <span className="custom-suffix">Suffix</span>,
        });

        expect(document.querySelector(`.${prefixCls}-prefix .custom-prefix`)).toHaveTextContent('Prefix');
        expect(document.querySelector(`.${prefixCls}-suffix .custom-suffix`)).toHaveTextContent('Suffix');
        expect(getTrigger()).toHaveClass(`${prefixCls}-with-prefix`);
        expect(getTrigger()).toHaveClass(`${prefixCls}-with-suffix`);
    });

    it('insetLabel 属性', () => {
        renderCascader({ insetLabel: <span className="custom-inset-label">Label</span>, insetLabelId: 'label-id' });

        const label = document.querySelector(`.${prefixCls}-inset-label`);
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
        expect(rows[0].parentElement.parentElement).toHaveStyle({ height: '300px' });
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
        expect(rows[0].parentElement.parentElement).toHaveStyle({ height: '180px' });
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
            expect(row.parentElement.tagName).toBe('UL');
            expect(row.parentElement).toHaveAttribute('role', 'none');
        });
        expect(document.querySelectorAll(`.${prefixCls}-option-lists ul`)).toHaveLength(1);
    });

    it('virtualizeInSearch.height 的类型只接受 number', () => {
        expectTypeOf<Virtualize['height']>().toEqualTypeOf<number | undefined>();
        expectTypeOf<NonNullable<CascaderProps['virtualizeInSearch']>>().toExtend<Virtualize>();
        expectTypeOf<{ itemSize: number; height: string }>().not.toExtend<Virtualize>();
    });

    it('onBlur、onFocus 的参数类型包含键盘事件，onBlur 还包含原生事件与 undefined', () => {
        expectTypeOf<Parameters<NonNullable<CascaderProps['onBlur']>>[0]>().toEqualTypeOf<React.MouseEvent | React.KeyboardEvent | globalThis.MouseEvent | undefined>();
        expectTypeOf<Parameters<NonNullable<CascaderProps['onFocus']>>[0]>().toEqualTypeOf<React.MouseEvent | React.KeyboardEvent>();
    });

    it('filterSorter 的前两个参数是两条结果路径', () => {
        type Sorter = NonNullable<CascaderProps['filterSorter']>;
        expectTypeOf<Parameters<Sorter>[0]>().toEqualTypeOf<CascaderData[]>();
        expectTypeOf<Parameters<Sorter>[1]>().toEqualTypeOf<CascaderData[]>();
        expectTypeOf<Parameters<Sorter>[2]>().toEqualTypeOf<string>();
    });

    it('filterSorter 收到两条从根到结果节点的路径与输入内容', () => {
        const ref = createRef<CascaderHandle>();
        const filterSorter = vi.fn<NonNullable<CascaderProps['filterSorter']>>((first, second) => (first.at(-1).value < second.at(-1).value ? -1 : 1));
        renderCascader({ ref, filterTreeNode: true, defaultOpen: true, filterSorter });

        act(() => ref.current.search('洲'));
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
        expectTypeOf<Parameters<NonNullable<Single['displayRender']>>>().toEqualTypeOf<[selected: React.ReactNode[]]>();
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
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        renderCascader({
            multiple: true,
            onChange,
            triggerRender: ({ value, onRemove }) => (
                <div className="custom-trigger">
                    {[...value].map((v) => (
                        <button key={v} type="button" onClick={() => onRemove(v)}>
                            {String(v)}
                        </button>
                    ))}
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
                <div className="custom-trigger">
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
                <div className="custom-trigger">
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
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        const onKeyDown = vi.fn<(e: React.KeyboardEvent) => void>();
        renderCascader({
            multiple: true,
            defaultOpen: true,
            defaultValue: [['Asia', 'China', 'Beijing']],
            onChange,
            onKeyDown,
        });
        await focus(getTrigger());
        await userEvent.keyboard('{ArrowDown}');
        expect(activeLabel(getTrigger())).toBeTruthy();

        onKeyDown.mockClear();
        await focus(screen.getByRole('button', { name: /北京/ }));
        await userEvent.keyboard('{Enter}');
        expect(onChange).not.toHaveBeenCalled();
        expect(getTagTexts()).toEqual(['北京']);
        expect(onKeyDown).toHaveBeenCalledTimes(1);
    });

    it('search 方法', () => {
        const ref = createRef<CascaderHandle>();
        const onSearch = vi.fn<NonNullable<CascaderProps['onSearch']>>();
        renderCascader({ ref, filterTreeNode: true, defaultOpen: true, onSearch });

        act(() => ref.current.search('北京'));
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
        await focus(getTrigger());

        await userEvent.keyboard('{ArrowDown}{Enter}');
        expect(getLists()).toHaveLength(2);
        await userEvent.keyboard('{ArrowRight}{Enter}{ArrowRight}{Enter}');
        expect(onChange).toHaveBeenCalledWith(['Asia', 'China', 'Beijing']);
    });

    it('loadData 属性', async () => {
        let finishLoad: () => void;
        const loadData = vi.fn<NonNullable<CascaderProps['loadData']>>(() => new Promise<void>((resolve) => (finishLoad = resolve)));
        const onLoad = vi.fn<NonNullable<CascaderProps['onLoad']>>();
        const data = { label: '亚洲', value: 'Asia', isLeaf: false };
        renderCascader({ treeData: [data], loadData, onLoad, defaultOpen: true });

        await userEvent.click(getOption('亚洲'));
        expect(loadData).toHaveBeenCalledWith([data]);
        expect(getOption('亚洲').querySelector(`.${prefixCls}-option-spin-icon`)).not.toBeNull();

        finishLoad();
        await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1));
        expect(onLoad.mock.calls[0][1]).toEqual(data);
        await waitFor(() => expect(getOption('亚洲').querySelector(`.${prefixCls}-option-spin-icon`)).toBeNull());
    });

    it('loadData reject 时停止显示加载状态，并允许重试', async () => {
        const loadData = vi.fn<NonNullable<CascaderProps['loadData']>>(() => Promise.reject(new Error('load failed')));
        const rejections = [];
        const onRejection = (reason) => rejections.push(reason);
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

        rerender(<Cascader {...commonProps} value={['North America', 'United States']} treeData={treeData} />);
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
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(isDropdownOpen()).toBe(false);
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

    it('无效 key 时 renderTagItem 返回 null', () => {
        renderCascader({
            multiple: true,
            autoMergeValue: false,
            value: [['Asia', 'China', 'Beijing'], ['Mars']],
        });

        expect(getTagTexts()).toEqual(['北京']);
    });

    it('配合 TagInput 使用 onRemoveInTagInput', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
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

        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-tagInput .${BASE_CLASS_PREFIX}-tag-close`));
        expect(onChange).toHaveBeenCalledWith([['Asia', 'China', 'Shanghai']]);
        expect(getTagTexts()).toEqual(['上海']);
    });

    it('自定义 filterRender 渲染', async () => {
        const filterRender = vi.fn<NonNullable<CascaderProps['filterRender']>>((props) => <div className="custom-filter-item">{props.data.map((item) => item.label).join('-')}</div>);
        renderCascader({ filterTreeNode: true, filterRender, defaultOpen: true });

        await userEvent.type(getSelectionInput(), '北京');
        expect(filterRender).toHaveBeenLastCalledWith(expect.objectContaining({ inputValue: '北京', selected: false }));
        const items = document.querySelectorAll('.custom-filter-item');
        expect(Array.from(items).map((item) => item.textContent)).toEqual(['亚洲-中国-北京']);
    });

    it('单选模式下 treeData 变化时 componentDidUpdate 调用 collectOptions', () => {
        const initialTreeData = [{ label: '选项1', value: 'opt1' }];
        const { rerender } = renderCascader({ treeData: initialTreeData, defaultOpen: true });
        expect(Array.from(getListOptions(0)).map((option) => option.textContent)).toEqual(['选项1']);

        const newTreeData = [
            { label: '选项1', value: 'opt1' },
            { label: '选项2', value: 'opt2' },
        ];
        rerender(<Cascader {...commonProps} defaultOpen treeData={newTreeData} />);
        expect(Array.from(getListOptions(0)).map((option) => option.textContent)).toEqual(['选项1', '选项2']);
    });

    it('handleTagRemoveInTrigger 移除标签', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        renderCascader({
            multiple: true,
            onChange,
            triggerRender: ({ value, onRemove }) => (
                <div className="custom-trigger">
                    {[...value].map((pos) => (
                        <button key={pos} onClick={() => onRemove(pos)}>
                            {pos}
                        </button>
                    ))}
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
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
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

        const closeBtns = document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tagInput .${BASE_CLASS_PREFIX}-tag-close`);
        await userEvent.click(closeBtns[1]);
        expect(onChange).toHaveBeenCalledWith([['Asia', 'China', 'Beijing']]);
        expect(getTagTexts()).toEqual(['北京']);
    });

    it('不存在的 key 时 renderTagItem 返回 null', () => {
        const value = [['Asia', 'China', 'Beijing']];
        const { rerender } = renderCascader({ multiple: true, value, autoMergeValue: false });
        expect(getTagTexts()).toEqual(['北京']);

        rerender(<Cascader {...commonProps} multiple value={value} autoMergeValue={false} treeData={[treeData[1]]} />);
        expect(getTagTexts()).toEqual([]);

        const { rerender: rerender2 } = renderCascader({ multiple: true, defaultValue: value, autoMergeValue: false });
        rerender2(<Cascader {...commonProps} defaultValue={value} multiple autoMergeValue={false} treeData={[treeData[1]]} />);
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
        const treeDataWithDisabled = [
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
        renderCascader({ treeData: treeDataWithDisabled, defaultOpen: true });

        await userEvent.click(getOption('亚洲'));

        expect(getOption('中国')).toHaveClass(`${prefixCls}-option-disabled`);
        expect(getOption('中国')).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(getOption('中国'));
        expect(getLists()).toHaveLength(2);
    });

    it('TagInput 的 onRemove 回调', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
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
        rerender(<Cascader {...commonProps} value={value} treeData={newTreeData} />);
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 北京');

        await userEvent.click(getSelection());
        expect(Array.from(getListOptions(0)).map((option) => option.textContent)).toEqual(['亚洲', '北美洲', '欧洲']);
    });

    it('value 变化但 treeData 不变', () => {
        const { rerender } = renderCascader({ value: ['Asia', 'China', 'Beijing'] });

        rerender(<Cascader {...commonProps} value={['Asia', 'China', 'Shanghai']} treeData={treeData} />);
        expect(getSelectionText()).toEqual('亚洲 / 中国 / 上海');
    });

    it('点击外部关闭下拉框', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<CascaderProps['onDropdownVisibleChange']>>();
        renderCascader({ defaultOpen: true, onDropdownVisibleChange });
        expect(isDropdownOpen()).toBe(true);
        expect(onDropdownVisibleChange).toHaveBeenCalledWith(true);

        await userEvent.click(document.body);
        expect(isDropdownOpen()).toBe(false);
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

    it('virtualize 搜索模式渲染 VirtualRow', async () => {
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

    it('emptyContent 为 null 时 renderEmpty 返回 null', () => {
        renderCascader({ treeData: [], emptyContent: null, defaultOpen: true });

        expect(document.querySelector(`.${prefixCls}-option-empty`)).toBeNull();
        expect(document.querySelector(`.${prefixCls}-option-lists`)).not.toBeNull();
    });

    it('禁用项具有正确的类名', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        const treeDataWithDisabled = [
            {
                label: '亚洲',
                value: 'Asia',
                children: [
                    { label: '中国', value: 'China', disabled: true },
                    { label: '日本', value: 'Japan' },
                ],
            },
        ];
        renderCascader({ treeData: treeDataWithDisabled, defaultOpen: true, onChange });

        await userEvent.click(getOption('亚洲'));

        expect(getOption('中国')).toHaveClass(`${prefixCls}-option-disabled`);
        expect(getOption('日本')).not.toHaveClass(`${prefixCls}-option-disabled`);
        await userEvent.click(getOption('中国'));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('item 中的 renderVirtualizeList', async () => {
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
        const list = rows[0].parentElement.parentElement;
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
        const largeTreeData = [];
        for (let i = 0; i < 50; i++) {
            largeTreeData.push({
                label: `选项${i}`,
                value: `opt${i}`,
                children: [
                    { label: `子选项${i}-1`, value: `child${i}-1` },
                    { label: `子选项${i}-2`, value: `child${i}-2` },
                ],
            });
        }
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

    it('点击外部时 clickOutsideHandler 关闭下拉框', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<CascaderProps['onDropdownVisibleChange']>>();

        render(
            <>
                <Cascader {...commonProps} defaultOpen treeData={treeData} onDropdownVisibleChange={onDropdownVisibleChange} />
                <button>outside</button>
            </>
        );
        expect(isDropdownOpen()).toBe(true);

        await userEvent.click(getOption('亚洲'));
        expect(isDropdownOpen()).toBe(true);

        await userEvent.click(screen.getByRole('button', { name: 'outside' }));
        expect(isDropdownOpen()).toBe(false);
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('禁用选项渲染禁用类名', () => {
        const treeDataWithDisabled = [
            { label: '选项1', value: 'opt1', disabled: true },
            { label: '选项2', value: 'opt2' },
        ];
        renderCascader({ treeData: treeDataWithDisabled, defaultOpen: true });

        expect(getOption('选项1')).toHaveClass(`${prefixCls}-option-disabled`);
        expect(getOption('选项2')).not.toHaveClass(`${prefixCls}-option-disabled`);
    });

    it('virtualize 模式下 VirtualRow 渲染正确', async () => {
        const largeTreeData = [];
        for (let i = 0; i < 50; i++) {
            largeTreeData.push({ label: `TestItem${i}`, value: `testitem${i}` });
        }
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

    it('超过 max 时触发 adapter 的 notifyOnExceed', async () => {
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

    it('禁用项的 onHover 提前返回', () => {
        const treeDataWithDisabled = [
            { label: '选项1', value: 'opt1', disabled: true, children: [{ label: '子选项1', value: 'child1' }] },
            { label: '选项2', value: 'opt2', children: [{ label: '子选项2', value: 'child2' }] },
        ];
        renderCascader({ treeData: treeDataWithDisabled, defaultOpen: true, showNext: 'hover' });

        fireEvent.mouseEnter(getOption('选项1'));
        expect(getLists()).toHaveLength(1);
        expect(getOption('选项1')).not.toHaveClass(`${prefixCls}-option-active`);

        fireEvent.mouseEnter(getOption('选项2'));
        expect(getLists()).toHaveLength(2);
    });

    it('renderIcon 返回自定义 expandIcon', () => {
        renderCascader({ defaultOpen: true, expandIcon: <span className="custom-expand-icon">{'>'}</span> });

        expect(getOption('亚洲').querySelector('.custom-expand-icon')).not.toBeNull();
        expect(getOption('北美洲').querySelector('.custom-expand-icon')).not.toBeNull();
        expect(document.querySelector(`.${prefixCls}-option-icon-expand`)).toBeNull();
    });

    it('未知类型时 renderIcon 返回 null', () => {
        renderCascader({ defaultOpen: true });

        expect(document.querySelectorAll(`.${prefixCls}-option-icon-expand`)).toHaveLength(2);
        expect(document.querySelectorAll(`.${prefixCls}-option-icon-empty`)).toHaveLength(2);
        expect(document.querySelector(`.${prefixCls}-option-icon-active`)).toBeNull();
    });

    it('flatten 搜索结果中的 onClick', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        renderCascader({ filterTreeNode: true, defaultOpen: true, onChange });

        await userEvent.type(getSelectionInput(), '北京');

        await userEvent.click(document.querySelector(`.${prefixCls}-option-flatten`));
        expect(onChange).toHaveBeenCalledWith(['Asia', 'China', 'Beijing']);
        expect(isDropdownOpen()).toBe(false);
        expect(document.querySelector(`.${prefixCls}-search-wrapper span`)).toHaveTextContent('亚洲 / 中国 / 北京');
    });

    it('showNext 为 hover 模式时悬停展开', () => {
        renderCascader({ defaultOpen: true, showNext: 'hover' });

        fireEvent.mouseEnter(getOption('亚洲'));

        expect(getLists()).toHaveLength(2);
        expect(getOption('亚洲')).toHaveClass(`${prefixCls}-option-active`);
        expect(getOption('中国')).toBeInTheDocument();
    });

    it('禁用项的 onClick 提前返回', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        const treeDataWithDisabled = [
            { label: '选项1', value: 'opt1', disabled: true },
            { label: '选项2', value: 'opt2' },
        ];
        renderCascader({ treeData: treeDataWithDisabled, defaultOpen: true, onChange });

        await userEvent.click(getOption('选项1'));

        expect(onChange).not.toHaveBeenCalled();
        expect(isDropdownOpen()).toBe(true);

        await userEvent.click(getOption('选项2'));
        expect(onChange).toHaveBeenCalledWith(['opt2']);
    });

    it('禁用的 flatten 项的 onClick 提前返回', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        const treeDataWithDisabled = [
            {
                label: '选项1',
                value: 'opt1',
                children: [
                    { label: '子选项1', value: 'child1', disabled: true },
                    { label: '子选项2', value: 'child2' },
                ],
            },
        ];
        renderCascader({ treeData: treeDataWithDisabled, filterTreeNode: true, defaultOpen: true, onChange });

        await userEvent.type(getSelectionInput(), '子选项1');

        const disabledItem = document.querySelector(`.${prefixCls}-option-flatten`);
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

    it('配合 filterTreeNode 调用 blur 方法时执行 blurInput', () => {
        const ref = createRef<CascaderHandle>();
        renderCascader({ ref, filterTreeNode: true, defaultOpen: true });
        expect(getSelectionInput()).toHaveFocus();

        act(() => ref.current.blur());
        expect(getSelectionInput()).not.toHaveFocus();
    });

    it('unRelated 模式下超过 max 时触发 notifyOnExceed', async () => {
        const onExceed = vi.fn<NonNullable<CascaderProps['onExceed']>>();
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
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
        const { rerender } = render(<Cascader {...commonProps} multiple value={value} treeData={asyncTreeData} />);
        expect(getTagTexts()).toEqual(['Node1']);
        const loadedData = addChildren(asyncTreeData, '0-1', [
            { label: 'Node2-1', value: 'Node2-1', isLeaf: true },
            { label: 'Node2-2', value: 'Node2-2', isLeaf: true },
        ]);
        rerender(<Cascader {...commonProps} multiple value={value} treeData={loadedData} />);
        expect(getTagTexts()).toEqual(['Node1', 'Node2-2']);
    });

    it('fix #1449：搜索结果渲染 ReactNode 标签，而不是 [object Object]', async () => {
        renderCascader({ treeData: treeDataWithReactNode, filterTreeNode: true, defaultOpen: true });
        await userEvent.type(getSelectionInput(), '北京');
        const [result] = getListOptions(0);
        expect(getListOptions(0)).toHaveLength(1);
        expect(result).toHaveTextContent(/^亚洲 \/ 中国 \/ 北京$/);
        expect(result.querySelector('strong')).toHaveTextContent(/^亚洲$/);
    });

    it('fix #1448：loadData 后将受控 value 重置为 [] 会清空选择', async () => {
        function Demo() {
            const [data, loadData] = useAsyncTreeData();
            const [value, setValue] = useState<SimpleValueType[]>([]);
            return (
                <>
                    <Cascader {...commonProps} placeholder="Please select" value={value} changeOnSelect loadData={loadData} treeData={data} onChange={setValue} onChangeWithObject />
                    <button onClick={() => setValue([])}>重置</button>
                </>
            );
        }
        render(<Demo />);
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
        function Demo(props) {
            const [data, loadData] = useAsyncTreeData();
            return <Cascader {...commonProps} loadData={loadData} treeData={data} onChange={onChange} {...props} />;
        }
        for (const props of [{ value: '受控 Value' }, { defaultValue: 'defaultValue', showClear: true }]) {
            const text = props.value ?? props.defaultValue;
            const { unmount } = render(<Demo {...props} />);
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
        const props = { ...commonProps, treeData, filterTreeNode: true };
        const { rerender } = render(<Cascader {...props} value={['Asia', 'China', 'Beijing']} />);
        await userEvent.click(getSelection());
        expect(getSelectionInput()).toHaveValue('');
        rerender(<Cascader {...props} value={['Asia', 'China', 'Shanghai']} />);
        expect(getSelectionInput()).toHaveValue('');
        expect(document.querySelector(`.${prefixCls}-search-wrapper > span`)).toHaveTextContent(/^亚洲 \/ 中国 \/ 上海$/);
    });

    it('fix #2831：悬停路径已移动时，loadData 完成不会收起菜单', async () => {
        const pending = {};
        const managers = ['TCS Manager', 'AAA Manager'].map((label, i) => ({
            label,
            value: label,
            children: [0, 1, 2, 3].map((n) => ({ label: `${i * 4 + n}`, value: `${i * 4 + n}` })),
        }));
        function Demo() {
            const [value, setValue] = useState(undefined);
            const [data, setData] = useState(managers);
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
            return <Cascader {...commonProps} value={value} changeOnSelect loadData={loadData} showClear showNext="hover" treeData={data} onChange={setValue} />;
        }
        render(<Demo />);
        await userEvent.click(getSelection());
        fireEvent.mouseEnter(getOption('TCS Manager'));
        fireEvent.mouseEnter(getOption('0'));
        expect(Object.keys(pending)).toEqual(['0']);
        fireEvent.mouseEnter(getOption('AAA Manager'));
        expect(Array.from(getListOptions(1)).map((option) => option.textContent)).toEqual(['4', '5', '6', '7']);
        await act(async () => pending['0']());
        expect(getLists()).toHaveLength(2);
        expect(Array.from(getListOptions(1)).map((option) => option.textContent)).toEqual(['4', '5', '6', '7']);
        expect(getOption('AAA Manager')).toHaveClass(`${prefixCls}-option-active`);
    });
});

describe('Cascader 行为', () => {
    const isChecked = (label) => getCheckbox(label).classList.contains(`${BASE_CLASS_PREFIX}-checkbox-checked`);
    const isIndeterminate = (label) => getCheckbox(label).classList.contains(`${BASE_CLASS_PREFIX}-checkbox-indeterminate`);

    it('StrictMode 下选择只上报一次，点击外部仍会关闭', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        const onDropdownVisibleChange = vi.fn<NonNullable<CascaderProps['onDropdownVisibleChange']>>();
        const onBlur = vi.fn<NonNullable<CascaderProps['onBlur']>>();
        render(
            <StrictMode>
                <Cascader {...commonProps} treeData={treeData} onBlur={onBlur} onChange={onChange} onDropdownVisibleChange={onDropdownVisibleChange} />
            </StrictMode>
        );
        await userEvent.click(getSelection());
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
        await userEvent.click(getOption('亚洲'));
        await userEvent.click(getOption('中国'));
        await userEvent.click(getOption('北京'));
        expect(onChange.mock.calls).toEqual([[['Asia', 'China', 'Beijing']]]);
        expect(isDropdownOpen()).toBe(false);
        expect(getSelectionText()).toBe('亚洲 / 中国 / 北京');
        await userEvent.click(getSelection());
        await userEvent.click(document.body);
        expect(isDropdownOpen()).toBe(false);
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false], [true], [false]]);
        expect(onBlur).toHaveBeenCalledTimes(2);
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Cascader: { separator: ' > ', placeholder: 'global placeholder' } };
        try {
            const { unmount } = render(<Cascader {...commonProps} treeData={treeData} />);
            expect(getSelectionText()).toBe('global placeholder');
            unmount();
            render(<Cascader {...commonProps} defaultValue={['Asia', 'China', 'Beijing']} placeholder="own" treeData={treeData} />);
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
        const target = document.getElementById(root.getAttribute('aria-controls'));
        expect(target).toHaveAttribute('role', 'tree');
        expect(target).toHaveAccessibleName(root.getAttribute('aria-label'));
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
            render(
                <>
                    <span id="external-label">External</span>
                    <Cascader {...commonProps} aria-labelledby="external-label" defaultOpen insetLabel="Inset" treeData={treeData} />
                </>
            );
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
            render(
                <ConfigProvider locale={en_US}>
                    <Cascader {...commonProps} defaultOpen insetLabel="Region" treeData={treeData} prefix="Pre" />
                </ConfigProvider>
            );
            expect(screen.getByRole('combobox')).toHaveAccessibleName(en_US.Cascader.label);
            expect(getTree()).toHaveAccessibleName(en_US.Cascader.label);
        });

        it('没有任何名称来源时 tree 名称等于 combobox 的语言包回落名', () => {
            render(
                <ConfigProvider locale={en_US}>
                    <Cascader {...commonProps} defaultOpen treeData={treeData} />
                </ConfigProvider>
            );
            expect(screen.getByRole('combobox')).toHaveAccessibleName(en_US.Cascader.label);
            expect(getTree()).toHaveAccessibleName(en_US.Cascader.label);
        });

        it('触发器上的搜索框是 combobox 时同样以 insetLabel 命名', () => {
            renderCascader({ defaultOpen: true, multiple: true, filterTreeNode: true, insetLabel: 'Region' });
            expect(screen.getByRole('combobox')).toHaveAccessibleName('Region');
            expect(getTree()).toHaveAccessibleName('Region');
        });
    });

    it('formApi.reset 后 Form.Cascader 为空，失焦时校验一次', async () => {
        let formApi;
        const validate = vi.fn<() => string>(() => '');
        render(
            <Form getFormApi={(api) => (formApi = api)}>
                <Form.Cascader placeholder="pick" field="region" label="Region" treeData={treeData} trigger="blur" validator={validate} {...commonProps} />
            </Form>
        );
        await userEvent.click(getSelection());
        await userEvent.click(getOption('北美洲'));
        await userEvent.click(getOption('美国'));
        expect(formApi.getValue('region')).toEqual(['North America', 'United States']);
        expect(validate).toHaveBeenCalledTimes(1);
        await userEvent.click(getSelection());
        await userEvent.click(document.body);
        expect(validate).toHaveBeenCalledTimes(2);
        await act(() => formApi.reset());
        expect(formApi.getValue('region')).toBeUndefined();
        expect(getSelectionText()).toBe('pick');
        for (const attr of ['insetlabel', 'insetlabelid', 'validatestatus']) {
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
        const plusN = document.querySelector(`.${prefixCls}-selection-n`);
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
        expect(isDropdownOpen()).toBe(false);
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('ref 上暴露 open、close、focus、blur 与 search', () => {
        const ref = createRef<CascaderHandle>();
        renderCascader({ ref, filterTreeNode: true, searchPosition: 'custom' });
        for (const method of ['open', 'close', 'focus', 'blur', 'search']) {
            expect(typeof ref.current[method]).toBe('function');
        }
        act(() => ref.current.open());
        act(() => ref.current.search('美国'));
        expect(getHighlights()).toHaveLength(1);
        act(() => ref.current.close());
        expect(isDropdownOpen()).toBe(false);
    });

    it('受控多选跟随父组件回传的 value', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        function Demo() {
            const [value, setValue] = useState<SimpleValueType[][]>([]);
            return (
                <Cascader
                    {...commonProps}
                    multiple
                    value={value}
                    treeData={treeData}
                    onChange={(v) => {
                        onChange(v);
                        setValue(v);
                    }}
                />
            );
        }
        render(<Demo />);
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
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
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
        rerender(<Cascader {...commonProps} multiple treeData={grown} />);
        expect(getTagTexts()).toEqual(['亚洲']);
        expect(isChecked('广州')).toBe(true);
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
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
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
        const closeOf = (text) =>
            Array.from(document.querySelectorAll(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag`))
                .find((tag) => tag.textContent === text)
                .querySelector(`.${BASE_CLASS_PREFIX}-tag-close`);
        expect(closeOf('北京')).toBeNull();
        await userEvent.click(closeOf('上海'));
        expect(getTagTexts()).toEqual(['北京']);
    });

    it('打开两次后仍只保留一个外部点击监听', async () => {
        const ref = createRef<CascaderHandle>();
        const onBlur = vi.fn<NonNullable<CascaderProps['onBlur']>>();
        renderCascader({ ref, onBlur });
        act(() => ref.current.open());
        act(() => ref.current.open());
        fireEvent.mouseDown(document.body);
        expect(isDropdownOpen()).toBe(false);
        expect(onBlur).toHaveBeenCalledTimes(1);
        fireEvent.mouseDown(document.body);
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('父组件忽略清空时，受控多选仍显示传入的 value', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        renderCascader({ multiple: true, showClear: true, value: [['North America', 'Canada']], onChange });
        await userEvent.click(document.querySelector(`.${prefixCls}-clearbtn`));
        expect(onChange).toHaveBeenLastCalledWith([]);
        expect(getTagTexts()).toEqual(['加拿大']);
    });

    it('未声明的属性落在根元素上，Form 属性不出现在 DOM 中', () => {
        render(
            <Form labelPosition="inset">
                <Form.Cascader id="region" title="tip" field="region" treeData={treeData} {...commonProps} />
            </Form>
        );
        expect(getTrigger()).toHaveAttribute('title', 'tip');
        expect(getTrigger()).toHaveAttribute('id', 'region');
        for (const attr of ['insetlabel', 'insetlabelid', 'validatestatus', 'treedata']) {
            expect(getTrigger()).not.toHaveAttribute(attr);
        }
    });

    it('打开状态下卸载后停止监听外部点击', async () => {
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
        const checkbox = getCheckbox('北京');
        expect(checkbox).toHaveAttribute('aria-hidden', 'true');
        expect(checkbox.querySelector('input')).toHaveAttribute('tabindex', '-1');
    });

    it('搜索结果是 option 组成的 listbox', async () => {
        renderCascader({ defaultOpen: true, filterTreeNode: true });
        await userEvent.type(getSelectionInput(), '美');
        const root = screen.getByRole('combobox');
        expect(root).toHaveAttribute('aria-haspopup', 'listbox');
        expect(document.getElementById(root.getAttribute('aria-controls'))).toHaveAttribute('role', 'listbox');
        expect(screen.getAllByRole('option')).toHaveLength(2);
    });

    it('filterRender 的选项获得 option 角色、id 与状态', async () => {
        const filterRender = ({ className, data }) => <div className={className}>{data.map((item) => item.label).join('-')}</div>;
        renderCascader({ defaultOpen: true, filterTreeNode: true, filterRender });
        await userEvent.type(getSelectionInput(), '北京');
        const option = screen.getByRole('option', { name: '亚洲-中国-北京' });
        expect(option).toHaveAttribute('aria-selected', 'false');
        expect(option.id).not.toBe('');
    });

    it('filterRender 返回字符串时包成 option 渲染', async () => {
        const filterRender = ({ data }) => data.map((item) => item.label).join('-');
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
        await focus(root);
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
        await focus(root);
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
        await focus(root);
        await userEvent.keyboard('{End}{ArrowRight}{ArrowRight}{ArrowDown}{Enter}');
        expect(onChange).toHaveBeenCalledWith(['North America', 'Canada']);
        await waitFor(() => expect(isDropdownOpen()).toBe(false));
        expect(root).toHaveFocus();
        expect(root).not.toHaveAttribute('aria-activedescendant');
    });

    it('禁用分支仍可到达，但不会展开', async () => {
        renderCascader({ defaultOpen: true, treeData: treeDataWithDisabled });
        const root = getTrigger();
        await focus(root);
        await userEvent.keyboard('{ArrowDown}{ArrowRight}{ArrowRight}');
        expect(activeLabel(root)).toBe('中国');
        await userEvent.keyboard('{ArrowRight}{Enter}');
        expect(getOption('中国')).toHaveAttribute('aria-expanded', 'false');
        expect(getLists()).toHaveLength(2);
    });

    it('多选：Enter 与 Space 勾选当前选项', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        renderCascader({ defaultOpen: true, multiple: true, onChange });
        const root = getTrigger();
        await focus(root);
        await userEvent.keyboard('{End}{Enter}');
        expect(getOption('北美洲')).toHaveAttribute('aria-checked', 'true');
        await userEvent.keyboard(' ');
        expect(getOption('北美洲')).toHaveAttribute('aria-checked', 'false');
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('RTL 下 Left 展开，Right 返回', async () => {
        render(
            <ConfigProvider direction="rtl">
                <Cascader treeData={treeData} {...commonProps} defaultOpen />
            </ConfigProvider>
        );
        const root = getTrigger();
        await focus(root);
        await userEvent.keyboard('{ArrowDown}{ArrowLeft}{ArrowLeft}');
        expect(activeLabel(root)).toBe('中国');
        await userEvent.keyboard('{ArrowRight}');
        expect(activeLabel(root)).toBe('亚洲');
    });

    it('悬停显示另一列后，当前选项被清除', async () => {
        renderCascader({ defaultOpen: true, showNext: 'hover' });
        const root = getTrigger();
        await focus(root);
        await userEvent.keyboard('{ArrowDown}{ArrowRight}{ArrowRight}');
        expect(activeLabel(root)).toBe('中国');
        await userEvent.hover(getOption('北美洲'));
        expect(root).not.toHaveAttribute('aria-activedescendant');
    });

    it('搜索输入框文本为空时所有按键都可导航；输入文本后只有 Up、Down 与 Enter 生效', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        renderCascader({ defaultOpen: true, filterTreeNode: true, onChange });
        const input = getSelectionInput();
        await focus(input);
        await userEvent.keyboard('{ArrowDown}{ArrowRight}');
        expect(getOption('亚洲')).toHaveAttribute('aria-expanded', 'true');
        await userEvent.type(input, '美');
        expect(input).not.toHaveAttribute('aria-activedescendant');
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        expect(document.getElementById(input.getAttribute('aria-activedescendant'))).toHaveTextContent('加拿大');
        await userEvent.keyboard('{ArrowLeft}{Home}');
        expect(document.getElementById(input.getAttribute('aria-activedescendant'))).toHaveTextContent('加拿大');
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
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        renderCascader({ defaultOpen: true, multiple: true, filterTreeNode: true, onChange });
        const input = getSelectionInput();
        await userEvent.type(input, '美');
        await userEvent.keyboard('{ArrowDown}');
        expect(document.getElementById(input.getAttribute('aria-activedescendant'))).toHaveTextContent('美国');
        await userEvent.keyboard('{Enter}');
        expect(onChange).toHaveBeenCalledWith([['North America', 'United States']]);
    });

    it('输入字符时移动到第一个以这些字符开头的可见选项', async () => {
        renderCascader({ defaultOpen: true });
        const root = getTrigger();
        await focus(root);
        await userEvent.keyboard('北');
        expect(activeLabel(root)).toBe('北美洲');
    });

    it('输入字符时在所有可见列中搜索，从当前选项继续', async () => {
        renderCascader({ defaultOpen: true });
        const root = getTrigger();
        await focus(root);
        await userEvent.keyboard('{ArrowDown}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}');
        expect(activeLabel(root)).toBe('北京');
        await userEvent.keyboard('北');
        expect(activeLabel(root)).toBe('北美洲');
        expect(getLists()).toHaveLength(3);
    });

    it('关闭状态的 combobox 输入字符无效，与 Select 一致', async () => {
        render(<Cascader treeData={treeData} />);
        const combobox = screen.getByRole('combobox');
        await focus(combobox);
        await userEvent.keyboard('北');
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    it('在搜索输入框中输入的字符保留在文本中', async () => {
        renderCascader({ defaultOpen: true, filterTreeNode: true });
        const input = getSelectionInput();
        await focus(input);
        await userEvent.keyboard('北');
        expect(input).toHaveValue('北');
    });

    it('选项导航用掉的按键也传给触发器的 onKeyDown，且只调用一次', async () => {
        const onKeyDown = vi.fn<NonNullable<CascaderProps['onKeyDown']>>();
        renderCascader({ defaultOpen: true, onKeyDown });
        const root = getTrigger();
        await focus(root);
        await userEvent.keyboard('{ArrowDown}');
        expect(activeLabel(root)).toBe('亚洲');
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(onKeyDown.mock.calls[0][0].key).toBe('ArrowDown');
    });

    it('关闭的 combobox 上按 ArrowDown 或 ArrowUp 打开', async () => {
        render(<Cascader treeData={treeData} />);
        const combobox = screen.getByRole('combobox');
        act(() => {
            combobox.focus();
        });
        await userEvent.keyboard('{ArrowDown}');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        await userEvent.keyboard('{Escape}');
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
        await userEvent.keyboard('{ArrowUp}');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });

    it('不可搜索时关闭的 combobox 上按 Space 打开，Home 与 End 打开并移到首列的两端', async () => {
        render(<Cascader treeData={treeData} />);
        const combobox = screen.getByRole('combobox');
        await focus(combobox);
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
        render(<Cascader multiple filterTreeNode treeData={treeData} />);
        const input = screen.getByRole('combobox');
        await focus(input);
        await userEvent.keyboard(' ');
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(input).toHaveValue(' ');
    });

    it('触发器中的搜索输入框作为 combobox（ARIA 1.2）', async () => {
        const { unmount } = render(<Cascader defaultValue={['Asia', 'China', 'Beijing']} filterTreeNode treeData={treeData} />);
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

        render(<Cascader multiple filterTreeNode treeData={treeData} />);
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
            const [value, setValue] = useState<SimpleValueType[]>(['Asia', 'China', 'Shanghai']);
            return <Cascader {...commonProps} value={value} defaultOpen filterTreeNode treeData={treeData} triggerRender={triggerRender} onChange={setValue} />;
        }
        render(<Demo />);
        fireEvent.click(screen.getByText('北京'));
        expect(triggerRender.mock.lastCall[0].inputValue).toBe('亚洲 / 中国 / 北京');
    });

    it('triggerRender 的 inputValue 类型可以是 displayRender 返回的 ReactNode', () => {
        expectTypeOf<Parameters<NonNullable<CascaderProps['triggerRender']>>[0]['inputValue']>().toEqualTypeOf<React.ReactNode>();
    });

    it('非受控单选的已选路径被 treeData 移除后，不显示内部分隔键', () => {
        const { rerender } = render(<Cascader {...commonProps} defaultValue={['Asia', 'China', 'Beijing']} treeData={treeData} />);
        expect(getSelectionText()).toBe('亚洲 / 中国 / 北京');
        rerender(<Cascader {...commonProps} defaultValue={['Asia', 'China', 'Beijing']} treeData={otherTreeData} />);
        expect(getSelectionText()).not.toContain('SEMI_CASCADER_SPLIT');
        expect(getSelectionText()).toContain('Beijing');
    });

    it('未加载的多级 defaultValue 在 treeData 更新后仍显示完整路径，子节点加载后恢复标签', () => {
        const base: CascaderData[] = [{ label: 'A', value: 'a', isLeaf: false }];
        const loadData = vi.fn<NonNullable<CascaderProps['loadData']>>();
        const { rerender } = render(<Cascader {...commonProps} defaultValue={['a', 'x']} loadData={loadData} treeData={base} />);
        const before = getSelectionText();
        rerender(<Cascader {...commonProps} defaultValue={['a', 'x']} loadData={loadData} treeData={[{ label: 'A', value: 'a', isLeaf: false, extra: 1 }]} />);
        expect(getSelectionText()).toBe(before);
        rerender(<Cascader {...commonProps} defaultValue={['a', 'x']} loadData={loadData} treeData={[{ label: 'A', value: 'a', children: [{ label: 'X', value: 'x', isLeaf: true }] }]} />);
        expect(getSelectionText()).toBe('A / X');
    });

    it('值含空格的缺失路径在 treeData 变化后不被截断', () => {
        const base: CascaderData[] = [{ label: 'A', value: 'a' }];
        const { rerender } = render(<Cascader {...commonProps} defaultValue={['a b']} treeData={base} />);
        const before = getSelectionText();
        expect(before).toContain('a b');
        rerender(
            <Cascader
                {...commonProps}
                defaultValue={['a b']}
                treeData={[
                    { label: 'A', value: 'a' },
                    { label: 'C', value: 'c' },
                ]}
            />
        );
        expect(getSelectionText()).toBe(before);
    });

    it('ref.focus 与 ref.blur 移动 DOM 焦点：不可搜索时在触发器上', () => {
        const ref = createRef<CascaderHandle>();
        renderCascader({ ref });
        act(() => ref.current.focus());
        expect(getTrigger()).toHaveFocus();
        act(() => ref.current.blur());
        expect(getTrigger()).not.toHaveFocus();
    });

    it('ref.focus 与 ref.blur 移动 DOM 焦点：单选可搜索且关闭时在触发器上', () => {
        const ref = createRef<CascaderHandle>();
        renderCascader({ ref, filterTreeNode: true });
        act(() => ref.current.focus());
        expect(getTrigger()).toHaveFocus();
        act(() => ref.current.blur());
        expect(getTrigger()).not.toHaveFocus();
    });

    it('ref.focus 与 ref.blur 移动 DOM 焦点：多选可搜索时在输入框上', () => {
        const ref = createRef<CascaderHandle>();
        renderCascader({ ref, multiple: true, filterTreeNode: true });
        act(() => ref.current.focus());
        expect(getSelectionInput()).toHaveFocus();
        act(() => ref.current.blur());
        expect(getSelectionInput()).not.toHaveFocus();
    });

    it('多选关闭全部标签后，清除按钮随之消失', async () => {
        renderCascader({
            multiple: true,
            showClear: true,
            defaultValue: [['North America', 'Canada']],
        });
        expect(getTagTexts()).toEqual(['加拿大']);
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
        expect(getTagTexts()).toEqual([]);
        expect(document.querySelector(`.${prefixCls}-clearbtn`)).toBeNull();
    });

    it('多选受控 value 改为空数组后，清除按钮随之消失', () => {
        const { rerender } = render(<Cascader {...commonProps} multiple value={[['North America', 'Canada']]} showClear treeData={treeData} />);
        expect(document.querySelector(`.${prefixCls}-clearbtn`)).not.toBeNull();
        rerender(<Cascader {...commonProps} multiple value={[]} showClear treeData={treeData} />);
        expect(document.querySelector(`.${prefixCls}-clearbtn`)).toBeNull();
    });

    it('触发器上传入的 onClick、onKeyDownCapture 会被调用，下拉照常开合', () => {
        const onClick = vi.fn<() => void>();
        const onKeyDownCapture = vi.fn<() => void>();
        renderCascader({ onClick, onKeyDownCapture });
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
        render(
            <Cascader
                {...commonProps}
                defaultValue={0}
                multiple
                treeData={[
                    { label: 'Zero', value: 0 },
                    { label: 'One', value: 1 },
                ]}
            />
        );
        expect(getTagTexts()).toEqual(['Zero']);
    });

    it('StrictMode 下 defaultOpen 只通知一次 onDropdownVisibleChange', () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<CascaderProps['onDropdownVisibleChange']>>();
        render(
            <StrictMode>
                <Cascader {...commonProps} defaultOpen treeData={treeData} onDropdownVisibleChange={onDropdownVisibleChange} />
            </StrictMode>
        );
        expect(isDropdownOpen()).toBe(true);
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
    });

    it('受控单选的 value 内容不变时，搜索输入不被清空', async () => {
        function Demo() {
            const [keyword, setKeyword] = useState('');
            return (
                <>
                    <Cascader {...commonProps} value={[]} filterTreeNode treeData={treeData} onSearch={setKeyword} />
                    <output>{keyword}</output>
                </>
            );
        }
        render(<Demo />);
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
        expect(isDropdownOpen()).toBe(false);
    });

    it('受控单选 value 改为分支路径（未开 changeOnSelect）时显示 placeholder', () => {
        const { rerender } = render(<Cascader {...commonProps} placeholder="请选择" value={['Asia', 'China', 'Beijing']} treeData={treeData} />);
        expect(getSelectionText()).toBe('亚洲 / 中国 / 北京');
        rerender(<Cascader {...commonProps} placeholder="请选择" value={['Asia', 'China']} treeData={treeData} />);
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
        render(<Cascader {...commonProps} multiple filterTreeNode treeData={treeData} onSearch={onSearch} />);
        const input = screen.getByRole('combobox');
        await focus(input);
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
        const combobox = getTrigger() as HTMLElement;
        await focus(combobox);
        await userEvent.keyboard(' ');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        let notPrevented: boolean;
        act(() => {
            notPrevented = fireEvent.keyDown(combobox, { key: ' ' });
        });
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
        const onChange = vi.fn<NonNullable<CascaderProps['onChange']>>();
        const onSearch = vi.fn<NonNullable<CascaderProps['onSearch']>>();
        renderCascader({ multiple: true, filterTreeNode: true, showClear: true, defaultValue: [['North America', 'Canada']], onChange, onSearch });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Cascader.clear }));
        expect(onChange).toHaveBeenCalledWith([]);
        expect(onSearch).not.toHaveBeenCalled();
    });

    it('非受控多选（unRelated）：勾选的节点被 treeData 移除后再勾选，onChange 不含空路径', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        const { rerender } = render(<Cascader {...commonProps} multiple checkRelation="unRelated" defaultOpen treeData={lettersA} onChange={onChange} />);
        await userEvent.click(getCheckbox('A'));
        rerender(<Cascader {...commonProps} multiple checkRelation="unRelated" defaultOpen treeData={lettersB} onChange={onChange} />);
        await userEvent.click(getCheckbox('C'));
        expect(onChange).toHaveBeenLastCalledWith([['c']]);
    });

    it('非受控多选：已选节点被 treeData 移除后显示占位符、不显示清除按钮，treeData 恢复前未交互则重新勾选', async () => {
        const props = { ...commonProps, multiple: true as const, showClear: true, placeholder: '请选择', defaultValue: [['a']] };
        const { rerender } = render(<Cascader {...props} treeData={lettersA} />);
        expect(getTagTexts()).toEqual(['A']);
        rerender(<Cascader {...props} treeData={lettersB} />);
        expect(getTagTexts()).toEqual([]);
        expect(getSelectionText()).toBe('请选择');
        expect(screen.queryByRole('button', { name: zh_CN.Cascader.clear })).toBeNull();
        rerender(<Cascader {...props} treeData={lettersA} />);
        expect(getTagTexts()).toEqual(['A']);
    });

    it('非受控多选：defaultValue 中 treeData 晚到的路径在到达前不显示，到达后勾选', () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        const props = { ...commonProps, multiple: true as const, showClear: true, placeholder: '请选择', defaultValue: [['a']], onChange };
        const { rerender } = render(<Cascader {...props} treeData={lettersB} />);
        expect(getSelectionText()).toBe('请选择');
        expect(screen.queryByRole('button', { name: zh_CN.Cascader.clear })).toBeNull();
        rerender(<Cascader {...props} treeData={lettersA} />);
        expect(getTagTexts()).toEqual(['A']);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('受控多选：value 中不在当前 treeData 的路径在勾选其他节点时仍保留在 onChange 中', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        const { rerender } = render(<Cascader {...commonProps} multiple value={[['a']]} defaultOpen treeData={[{ label: 'A', value: 'a' }]} onChange={onChange} />);
        rerender(<Cascader {...commonProps} multiple value={[['a']]} defaultOpen treeData={[{ label: 'B', value: 'b' }]} onChange={onChange} />);
        await userEvent.click(getCheckbox('B'));
        expect(onChange).toHaveBeenLastCalledWith([['a'], ['b']]);
    });

    it.each([
        ['单选', { value: ['Asia', 'China', 'Beijing'] }, { value: [] }],
        ['可搜索多选', { multiple: true, filterTreeNode: true, value: [['Asia', 'China', 'Beijing']] }, { multiple: true, filterTreeNode: true, value: [] }],
    ])('%s：清除按钮持焦时值被外部清空，焦点回到 combobox', (_, before, after) => {
        const { rerender } = render(<Cascader {...commonProps} showClear treeData={treeData} {...(before as CascaderProps)} />);
        const clear = screen.getByRole('button', { name: zh_CN.Cascader.clear });
        act(() => clear.focus());
        rerender(<Cascader {...commonProps} showClear treeData={treeData} {...(after as CascaderProps)} />);
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

    it('可搜索单选的 label 为 ReactNode 时，选中后触发器与 triggerRender 的 inputValue 不出现 [object Object]', async () => {
        const triggerRender = vi.fn<NonNullable<CascaderProps['triggerRender']>>(({ inputValue }) => <span>{inputValue}</span>);
        renderCascader({ treeData: treeDataWithReactNode, filterTreeNode: true, defaultOpen: true, triggerRender });
        await userEvent.click(screen.getByText('北美洲').closest('li'));
        expect(isDropdownOpen()).toBe(false);
        expect(triggerRender.mock.calls.map(([props]) => String(props.inputValue)).filter((text) => text.includes('[object Object]'))).toEqual([]);
    });

    it('受控多选：不在当前 treeData 的路径计入 max', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        const onExceed = vi.fn<NonNullable<CascaderProps<true>['onExceed']>>();
        render(<Cascader {...commonProps} max={1} multiple value={[['a']]} defaultOpen treeData={lettersB} onChange={onChange} onExceed={onExceed} />);
        await userEvent.click(getCheckbox('B'));
        expect(onChange).not.toHaveBeenCalled();
        expect(onExceed).toHaveBeenCalledTimes(1);
    });

    it('stopPropagation 为 false 时，面板内嵌套 Popover 里按下鼠标不关闭面板，在 body 上按下才关闭', () => {
        const topSlot = (
            <Popover content={<button type="button">inside nested</button>} motion={false} trigger="custom" visible>
                <span>nested anchor</span>
            </Popover>
        );
        renderCascader({ defaultOpen: true, stopPropagation: false, topSlot });
        fireEvent.mouseDown(screen.getByRole('button', { name: 'inside nested' }));
        expect(getLists()).toHaveLength(1);
        fireEvent.mouseDown(document.body);
        expect(document.querySelector(`.${prefixCls}-option-lists`)).toBeNull();
    });

    it('触发器内 +N 弹层里按下鼠标不关闭面板，在 body 上按下才关闭', () => {
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
        expect(document.querySelector(`.${prefixCls}-option-lists`)).toBeNull();
    });

    it('受控多选：只有不在当前 treeData 的路径时显示清除按钮，点击后 onChange([])', async () => {
        const onChange = vi.fn<NonNullable<CascaderProps<true>['onChange']>>();
        render(<Cascader {...commonProps} multiple value={[['a']]} showClear treeData={lettersB} onChange={onChange} />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Cascader.clear }));
        expect(onChange).toHaveBeenCalledWith([]);
    });
});
