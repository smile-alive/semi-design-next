import { createRef, StrictMode, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { render, screen, fireEvent, waitFor, act, within, createEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { ConfigProvider, Form, Popover, Select, Tag } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { InputChangeEvent, InputHandle } from '@fibrae/semi-ui-react/input';
import { mockResizeObserver } from '@test/utils/react';
import type { optionRenderProps, RenderMultipleSelectedItemFn, RenderSingleSelectedItemFn, SelectHandle, SelectProps, TriggerRenderProps } from '../index';

const Option = Select.Option;
const prefixCls = `${BASE_CLASS_PREFIX}-select`;

const defaultList = [
    { value: 'abc', label: 'Abc' },
    { value: 'hotsoon', label: 'Hotsoon' },
    { value: 'pipixia', label: 'Pipixia' },
    { value: 'toutiao', label: 'TopBuzz' },
];

function getOption(list = defaultList) {
    return list.map((optionOpts) => <Option key={optionOpts.value} {...optionOpts} />);
}

const commonProps = {
    // The popup layer (a Tooltip) animates; turn it off so tests need not wait
    motion: false,
};

function selectElement(props) {
    const children = props.optionList || props.children ? props.children : getOption();
    return (
        <Select {...commonProps} {...props}>
            {children}
        </Select>
    );
}

function renderSelect(props = {}) {
    const result = render(selectElement(props));
    return { ...result, rerender: (nextProps) => result.rerender(selectElement(nextProps)) };
}

const getTrigger = () => screen.getByRole('combobox');
const getOptionList = () => screen.queryByRole('listbox');
const getOptions = () => screen.queryAllByRole('option');
const getOptionTexts = () => getOptions().map((option) => option.textContent);
// the tick icon contributes to the accessible name of an option, so match options by their text instead
const getOptionByText = (text) => getOptions().find((option) => option.textContent === text);
const getFocusedOption = () => document.querySelector(`.${prefixCls}-option-focused`);
const getSelectionText = () => document.querySelector(`.${prefixCls}-selection-text`);
const getTagTexts = () => Array.from(document.querySelectorAll(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag-content`)).map((tag) => tag.textContent);
const getTriggerInput = () => document.querySelector<HTMLInputElement>(`.${prefixCls} input`);
const getRoot = () => document.querySelector(`.${prefixCls}`);
const getClearIcon = () => document.querySelector(`.${BASE_CLASS_PREFIX}-icon-clear`);
const search = (value, input = getTriggerInput()) => fireEvent.change(input, { target: { value } });
const keyDown = (key, init = {}, target = getTrigger()) => fireEvent.keyDown(target, { key, ...init });
const expectClosed = () => waitFor(() => expect(getOptionList()).toBeNull());

describe('Select', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('自定义 className 与 style', () => {
        renderSelect({ className: 'test', style: { color: 'red' } });
        expect(getTrigger()).toHaveClass('test');
        expect(getTrigger()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('带 placeholder', () => {
        renderSelect({ placeholder: 'semi' });
        expect(document.querySelector(`.${prefixCls}-selection-placeholder`)).toHaveTextContent(/^semi$/);
    });

    it('带 validateStatus', () => {
        const { rerender } = renderSelect({});
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-error`);
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-warning`);
        rerender({ validateStatus: 'error' });
        expect(getTrigger()).toHaveClass(`${prefixCls}-error`);
        rerender({ validateStatus: 'warning' });
        expect(getTrigger()).toHaveClass(`${prefixCls}-warning`);
    });

    it('不同尺寸', () => {
        const { rerender } = renderSelect({});
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-large`);
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-small`);
        rerender({ size: 'large' });
        expect(getTrigger()).toHaveClass(`${prefixCls}-large`);
        rerender({ size: 'small' });
        expect(getTrigger()).toHaveClass(`${prefixCls}-small`);
    });

    it('自定义 dropdownClassName 与 dropdownStyle', () => {
        renderSelect({ dropdownClassName: 'ddc', dropdownStyle: { color: 'red' }, defaultOpen: true });
        const dropdown = document.querySelector('.ddc');
        expect(dropdown).not.toBeNull();
        expect(dropdown).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(dropdown).toContainElement(getOptionList());
    });

    it('不同位置', () => {
        renderSelect({ position: 'top', defaultOpen: true });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-popover-wrapper`)).toHaveAttribute('x-placement', 'top');
    });

    it('defaultValue（不在 optionList 中）', () => {
        const { unmount } = renderSelect({ defaultValue: 'semi' });
        expect(getSelectionText()).toHaveTextContent(/^semi$/);
        unmount();
        renderSelect({ multiple: true, defaultValue: ['semi', 'ies'] });
        expect(getTagTexts()).toEqual(['semi', 'ies']);
    });

    it('defaultValue（可在 optionList 中匹配）', () => {
        const { unmount } = renderSelect({ defaultValue: 'abc' });
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
        unmount();
        renderSelect({ defaultValue: ['abc', 'hotsoon'], multiple: true });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
    });

    it('showClear', async () => {
        const { unmount } = renderSelect({ defaultValue: '${BASE_CLASS_PREFIX}', showClear: true });
        expect(getClearIcon()).not.toBeNull();
        unmount();

        const { unmount: unmountEmpty } = renderSelect({ showClear: true });
        await userEvent.hover(getTrigger());
        expect(getClearIcon()).toBeNull();
        unmountEmpty();

        renderSelect({ showClear: false, defaultValue: 'semi' });
        await userEvent.hover(getTrigger());
        expect(getClearIcon()).toBeNull();
    });

    it('showArrow = false', () => {
        renderSelect({ defaultValue: 'semi', showArrow: false });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-icon-chevron_down`)).toBeNull();
        expect(getTrigger()).toHaveClass(`${prefixCls}-no-arrow`);
    });

    it('自定义 prefix / suffix / insetLabel', () => {
        const { unmount } = renderSelect({
            prefix: <div className="prefix">prefix content</div>,
            suffix: <div className="suffix">suffix content</div>,
        });
        expect(screen.getByText('prefix content')).toHaveClass('prefix');
        expect(screen.getByText('prefix content').parentElement).toHaveClass(`${prefixCls}-prefix`);
        expect(screen.getByText('suffix content')).toHaveClass('suffix');
        expect(screen.getByText('suffix content').parentElement).toHaveClass(`${prefixCls}-suffix`);
        unmount();

        renderSelect({ insetLabel: 'semi' });
        expect(screen.getByText('semi')).toHaveClass(`${prefixCls}-inset-label`);
    });

    it('prefix、suffix、insetLabel 为 0 时照常渲染，数字按文字处理', () => {
        const { container, unmount } = renderSelect({ prefix: 0, suffix: 0 });
        expect(container.querySelector(`.${prefixCls}-prefix`)).toHaveTextContent(/^0$/);
        expect(container.querySelector(`.${prefixCls}-prefix`)).toHaveClass(`${prefixCls}-prefix-text`);
        expect(container.querySelector(`.${prefixCls}-suffix`)).toHaveClass(`${prefixCls}-suffix-text`);
        expect(container.querySelector(`.${prefixCls}`)).toHaveClass(`${prefixCls}-with-prefix`, `${prefixCls}-with-suffix`);
        unmount();
        renderSelect({ insetLabel: 0 });
        expect(screen.getByRole('combobox')).toHaveAccessibleName('0');
    });

    it('defaultOpen', () => {
        renderSelect({ defaultOpen: true });
        expect(getOptionList()).not.toBeNull();
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
        expect(getOptionTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz']);
    });

    // jsdom has no layout; the browser project covers the resulting width, here only the CSS wiring is checked
    it('dropdownMatchSelectWidth = true', () => {
        renderSelect({ defaultOpen: true, style: { width: 90 }, defaultValue: 'abc' });
        const wrapper = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
        expect(wrapper.style.minWidth).toBe('var(--semi-tooltip-trigger-width)');
    });

    it('dropdownMatchSelectWidth，width 为字符串', () => {
        renderSelect({ defaultOpen: true, style: { width: '90px' }, defaultValue: 'abc' });
        const wrapper = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
        expect(wrapper.style.minWidth).toBe('var(--semi-tooltip-trigger-width)');
    });

    it('dropdownMatchSelectWidth = false', () => {
        renderSelect({ defaultOpen: true, style: { width: 90 }, defaultValue: 'abc', dropdownMatchSelectWidth: false });
        const wrapper = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
        expect(wrapper.style.minWidth).toBe('');
    });

    it('通过 props.optionList 传入选项', () => {
        renderSelect({ defaultOpen: true, optionList: defaultList });
        expect(getOptionTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz']);
    });

    it('通过 props.children 传入选项', () => {
        const list = [...defaultList, { value: 'semi', label: 'SemiDesign' }];
        renderSelect({ defaultOpen: true, children: getOption(list) });
        expect(getOptionTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz', 'SemiDesign']);
    });

    it('multiple 为 true 时可以选择多个选项', async () => {
        renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon'], defaultOpen: true });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
        await userEvent.click(getOptions()[3]);
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', 'TopBuzz']);
        expect(getOptionList()).not.toBeNull();
    });

    it('multiple 配合 maxTagCount', async () => {
        renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon'], maxTagCount: 2, defaultOpen: true });
        await userEvent.click(getOptions()[3]);
        const tagGroup = document.querySelector(`.${BASE_CLASS_PREFIX}-tag-group`);
        expect(tagGroup.children).toHaveLength(3);
        expect(tagGroup.children[2]).toHaveTextContent(/^\+1$/);
    });

    it('multiple 配合 max，超过上限时调用 onExceed', async () => {
        const onExceed = vi.fn<NonNullable<SelectProps['onExceed']>>();
        renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon'], max: 2, onExceed, defaultOpen: true });
        await userEvent.click(getOptions()[3]);
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(onExceed).toHaveBeenCalledWith(expect.objectContaining({ value: 'toutiao', label: 'TopBuzz' }));
    });

    it('innerTopSlot', () => {
        renderSelect({ innerTopSlot: <div className="inner-slot">inner</div>, defaultOpen: true });
        const slot = screen.getByText('inner');
        expect(slot).toHaveClass('inner-slot');
        expect(slot.parentElement).toHaveClass(`${prefixCls}-option-list-inner-top-slot`);
        expect(getOptionList().firstChild).toBe(slot.parentElement);
    });

    it('outerTopSlot', () => {
        renderSelect({ outerTopSlot: <div className="outer-slot">outer</div>, defaultOpen: true });
        const slot = screen.getByText('outer');
        expect(slot).toHaveClass('outer-slot');
        expect(slot.parentElement).toHaveClass(`${prefixCls}-option-list-outer-top-slot`);
        expect(getOptionList()).not.toContainElement(slot);
    });

    it('innerBottomSlot', () => {
        renderSelect({ innerBottomSlot: <div className="inner-slot">inner</div>, defaultOpen: true });
        const slot = screen.getByText('inner');
        expect(slot).toHaveClass('inner-slot');
        expect(slot.parentElement).toHaveClass(`${prefixCls}-option-list-inner-bottom-slot`);
        expect(getOptionList().lastChild).toBe(slot.parentElement);
    });

    it('outerBottomSlot', () => {
        renderSelect({ outerBottomSlot: <div className="outer-slot">outer</div>, defaultOpen: true });
        const slot = screen.getByText('outer');
        expect(slot).toHaveClass('outer-slot');
        expect(slot.parentElement).toHaveClass(`${prefixCls}-option-list-outer-bottom-slot`);
        expect(getOptionList()).not.toContainElement(slot);
    });

    it('option 的 className、style、disabled 与 showTick', () => {
        const options = [
            { className: 'optCls', style: { color: 'red' }, label: 'Abc', value: 'abc' },
            { label: 'Vigo', value: 'vigo', disabled: true, className: 'disabled-opt' },
            { label: 'NoTick', value: 'noTick', showTick: false },
        ].map((item) => (
            <Option key={item.value} {...item}>
                {item.label}
            </Option>
        ));
        renderSelect({ children: options, defaultOpen: true });
        const [first, disabled, noTick] = getOptions();
        expect(first).toHaveClass('optCls');
        expect(first).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(first.querySelector(`.${prefixCls}-option-icon`)).not.toBeNull();
        expect(disabled).toHaveClass('disabled-opt', `${prefixCls}-option-disabled`);
        expect(disabled).toHaveAttribute('aria-disabled', 'true');
        expect(noTick).toHaveTextContent(/^NoTick$/);
        expect(noTick.querySelector(`.${prefixCls}-option-icon`)).toBeNull();
    });

    it('loading', () => {
        renderSelect({ defaultOpen: true, loading: true });
        expect(getOptionList().querySelector(`.${prefixCls}-loading-wrapper`)).not.toBeNull();
        expect(getOptions()).toHaveLength(0);
    });

    it('spacing', () => {
        // jsdom puts the trigger's box at 0, so a bottomLeft popup's top is the spacing
        renderSelect({ spacing: 20, defaultOpen: true });
        const wrapper = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
        expect(wrapper.style.top).toBe('20px');
    });

    it('点击选择器时打开选项列表', async () => {
        renderSelect({});
        expect(getOptionList()).toBeNull();
        await userEvent.click(getTrigger());
        expect(getOptionList()).not.toBeNull();
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
    });

    it('disabled 为 true 时禁用组件', async () => {
        renderSelect({ disabled: true });
        expect(getTrigger()).toHaveClass(`${prefixCls}-disabled`);
        await userEvent.click(getTrigger());
        expect(getOptionList()).toBeNull();
    });

    it('onDropdownVisibleChange 与 clickToHide', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        renderSelect({ onDropdownVisibleChange, clickToHide: true });
        await userEvent.click(getTrigger());
        expect(getOptionList()).not.toBeNull();
        expect(onDropdownVisibleChange).toHaveBeenCalledTimes(1);
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(true);
        await userEvent.click(getTrigger());
        await expectClosed();
        expect(onDropdownVisibleChange).toHaveBeenCalledTimes(2);
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('filter = true', async () => {
        renderSelect({ filter: true });
        await userEvent.click(getTrigger());
        search('abc');
        expect(getOptionTexts()).toEqual(['Abc']);
    });

    it('搜索结果延后渲染，aria-activedescendant 指向已渲染的选项', async () => {
        renderSelect({ filter: true });
        await userEvent.click(getTrigger());
        search('abc');
        await waitFor(() => expect(getOptionTexts()).toEqual(['Abc']));
        const activeId = getTrigger().getAttribute('aria-activedescendant');
        expect(activeId).toBeTruthy();
        expect(document.getElementById(activeId)).toBe(getOptionByText('Abc'));
        search('zzz');
        await waitFor(() => expect(getOptions()).toHaveLength(0));
        expect(screen.getByText(zh_CN.Select.emptyText)).toBeInTheDocument();
        expect(getTrigger()).not.toHaveAttribute('aria-activedescendant');
    });

    it('filter = true，label 包含正则特殊字符时首次按 key 定位', async () => {
        renderSelect({ filter: true, optionList: [{ label: 'label++', value: '' }] });
        await userEvent.click(getTrigger());
        search('+');
        expect(getOptionTexts()).toEqual(['label++']);
    });

    it('filter = 自定义函数', async () => {
        const customFilter = (_sugInput, option) => option.label == 'Hotsoon';
        renderSelect({ filter: customFilter });
        await userEvent.click(getTrigger());
        search('tik');
        expect(getOptionTexts()).toEqual(['Hotsoon']);
    });

    it('onSearch', async () => {
        const onSearch = vi.fn<NonNullable<SelectProps['onSearch']>>();
        renderSelect({ onSearch, filter: true });
        await userEvent.click(getTrigger());
        search('semi');
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('semi', expect.anything());
    });

    it('emptyContent', async () => {
        const emptyContent = 'no data';
        renderSelect({ filter: true, emptyContent });
        await userEvent.click(getTrigger());
        search('semi');
        expect(document.querySelector(`.${prefixCls}-option-empty`)).toHaveTextContent(/^no data$/);
        expect(getOptions()).toHaveLength(0);
    });

    it('option 的 value 与 label', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ optionList: [{ label: 'semi', value: 'bytedance' }], defaultOpen: true, onChange });
        expect(getOptionTexts()).toEqual(['semi']);
        await userEvent.click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledWith('bytedance');
        expect(getSelectionText()).toHaveTextContent(/^semi$/);
    });

    it('option.value 为数字', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ optionList: [{ label: 'semi', value: 0 }], defaultOpen: true, onChange });
        expect(getOptionTexts()).toEqual(['semi']);
        await userEvent.click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledWith(0);
    });

    it('renderSelectedItem，single', () => {
        const renderSelectedItem = vi.fn<RenderSingleSelectedItemFn>((option) => option.value + '-' + option.label);
        renderSelect({ renderSelectedItem, defaultValue: 'abc' });
        expect(getSelectionText()).toHaveTextContent(/^abc-Abc$/);
        expect(renderSelectedItem).toHaveBeenCalledWith(expect.objectContaining({ value: 'abc', label: 'Abc' }));
    });

    it('renderSelectedItem，single 且 value 为 0，不在 optionList 中', () => {
        const renderSelectedItem = vi.fn<RenderSingleSelectedItemFn>((option) => option.label + 1);
        renderSelect({ renderSelectedItem, value: 0 });
        expect(getSelectionText()).toHaveTextContent(/^1$/);
        expect(renderSelectedItem).toHaveBeenCalledWith(expect.objectContaining({ value: 0, label: 0 }));
    });

    it('renderSelectedItem - multiple', () => {
        const renderSelectedItem = vi.fn<RenderMultipleSelectedItemFn>((option) => ({
            isRenderInTag: true,
            content: option.value + '-' + option.extra,
        }));
        renderSelect({
            optionList: [
                { value: 'abc', label: 'Abc', extra: 'a1' },
                { value: 'hotsoon', label: 'Hotsoon', extra: 'b2' },
                { value: 'pipixia', label: 'Pipixia', extra: 'c3' },
                { value: 'toutiao', label: 'TopBuzz', extra: 'd4' },
            ],
            renderSelectedItem,
            defaultValue: ['abc', 'hotsoon'],
            multiple: true,
        });
        expect(getTagTexts()).toEqual(['abc-a1', 'hotsoon-b2']);
    });

    it('renderSelectedItem - multiple - isRenderInTag: false', () => {
        const renderSelectedItem = (option, opts) => ({
            isRenderInTag: false,
            content: <div className={`item-${opts.index}`}>{option.value + '-' + option.extra}</div>,
        });
        renderSelect({
            optionList: [
                { value: 'abc', label: 'Abc', extra: 'a1' },
                { value: 'hotsoon', label: 'Hotsoon', extra: 'b2' },
                { value: 'pipixia', label: 'Pipixia', extra: 'c3' },
                { value: 'toutiao', label: 'TopBuzz', extra: 'd4' },
            ],
            renderSelectedItem,
            defaultValue: ['abc', 'hotsoon'],
            multiple: true,
        });
        const items = document.querySelector(`.${prefixCls}-content-wrapper`).children;
        expect(items[0]).toHaveClass('item-0');
        expect(items[0]).toHaveTextContent(/^abc-a1$/);
        expect(items[1]).toHaveClass('item-1');
        expect(items[1]).toHaveTextContent(/^hotsoon-b2$/);
        expect(document.querySelector(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag`)).toBeNull();
    });

    it('defaultActiveFirstOption', () => {
        renderSelect({ defaultActiveFirstOption: true, defaultOpen: true });
        expect(getFocusedOption()).toHaveTextContent(/^Abc$/);
    });

    it('onSelect', async () => {
        const onSelect = vi.fn<NonNullable<SelectProps['onSelect']>>();
        renderSelect({ defaultOpen: true, onSelect });
        await userEvent.click(getOptions()[0]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('abc', { value: 'abc', label: 'Abc' });
    });

    it('onDeselect', async () => {
        const onDeselect = vi.fn<NonNullable<SelectProps['onDeselect']>>();
        renderSelect({ multiple: true, defaultOpen: true, defaultValue: ['abc', 'hotsoon'], onDeselect });
        await userEvent.click(getOptions()[1]);
        expect(onDeselect).toHaveBeenCalledTimes(1);
        expect(onDeselect).toHaveBeenCalledWith('hotsoon', { value: 'hotsoon', label: 'Hotsoon' });
        expect(getTagTexts()).toEqual(['Abc']);
    });

    it('onChange（single）', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ defaultOpen: true, onChange });
        await userEvent.click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('abc');
    });

    it('onChange（multiple）', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ defaultOpen: true, multiple: true, onChange });
        await userEvent.click(getOptions()[0]);
        await userEvent.click(getOptions()[1]);
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenNthCalledWith(1, ['abc']);
        expect(onChange).toHaveBeenNthCalledWith(2, ['abc', 'hotsoon']);
    });

    it('onChange + onChangeWithObject（single）', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ defaultOpen: true, onChangeWithObject: true, onChange });
        await userEvent.click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({ value: 'abc', label: 'Abc' });
    });

    it('onChange + onChangeWithObject（multiple）', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ defaultOpen: true, onChangeWithObject: true, multiple: true, onChange });
        await userEvent.click(getOptions()[0]);
        await userEvent.click(getOptions()[1]);
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenNthCalledWith(1, [{ value: 'abc', label: 'Abc' }]);
        expect(onChange).toHaveBeenNthCalledWith(2, [
            { value: 'abc', label: 'Abc' },
            { value: 'hotsoon', label: 'Hotsoon' },
        ]);
    });

    it('【value】受控模式', async () => {
        const { rerender, unmount } = renderSelect({ value: 'abc' });
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
        rerender({ value: 'hotsoon' });
        expect(getSelectionText()).toHaveTextContent(/^Hotsoon$/);
        rerender({ value: undefined });
        expect(getSelectionText()).toHaveTextContent(/^$/);
        unmount();

        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const { unmount: unmountSingle } = renderSelect({
            value: 'abc',
            optionList: defaultList,
            defaultOpen: true,
            onChange,
        });
        await userEvent.click(getOptions()[1]);
        await waitFor(() => expect(onChange).toHaveBeenCalledWith('hotsoon'));
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
        unmountSingle();

        const onMultipleChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({
            value: '',
            optionList: defaultList,
            defaultOpen: true,
            multiple: true,
            filter: true,
            onChange: onMultipleChange,
            showClear: true,
            onClear: vi.fn<() => void>(),
        });
        await userEvent.click(getOptions()[1]);
        expect(onMultipleChange).toHaveBeenCalledWith(['hotsoon']);
    });

    it('【onBlur/onFocus】', async () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        const onFocus = vi.fn<NonNullable<SelectProps['onFocus']>>();
        const ref = createRef<SelectHandle>();
        renderSelect({ onBlur, onFocus, ref });
        await userEvent.click(getTrigger());
        expect(onFocus).toHaveBeenCalledTimes(1);

        // Adapt to A11y requirements, close the panel will not call the onBlur func
        act(() => ref.current.close());
        await expectClosed();
        expect(onBlur).not.toHaveBeenCalled();
        expect(getTrigger()).toHaveFocus();
    });

    it('【autoFocus】- filter = false', () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        const onFocus = vi.fn<NonNullable<SelectProps['onFocus']>>();
        renderSelect({ onBlur, onFocus, autoFocus: true });
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(getTrigger()).toHaveClass(`${prefixCls}-focus`);
        expect(getTrigger()).toHaveFocus();
    });

    it('【autoFocus】- filter = true', () => {
        renderSelect({ autoFocus: true, filter: true });
        expect(getRoot()).toHaveClass(`${prefixCls}-focus`);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-focus`)).not.toBeNull();
        expect(getTriggerInput()).toHaveFocus();
    });

    it('【autoFocus】 与 autoFocus = true 时的 onBlur', async () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ autoFocus: true, onBlur });
        expect(getTrigger()).toHaveFocus();
        await userEvent.click(document.body);
        expect(getTrigger()).not.toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-focus`);
    });

    it('virtual', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const optionList = Array.from({ length: 100 }, (_v, i) => ({ label: `option-${i}`, value: i }));
        renderSelect({
            virtualize: {
                itemSize: 36,
            },
            defaultOpen: true,
            optionList,
            onChange,
        });
        expect(getOptions().length).toBeLessThan(optionList.length);
        await userEvent.click(screen.getByText('option-0'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(0);
    });

    it('OptionGroup', () => {
        const optionList = [
            <Select.OptGroup key={1} label="Group1">
                <Select.Option value="a-1">a-1</Select.Option>
                <Select.Option value="a-2">a-2</Select.Option>
            </Select.OptGroup>,
            <Select.OptGroup key={2} label="Group2">
                <Select.Option value="b-1">b-1</Select.Option>
                <Select.Option value="b-2">b-2</Select.Option>
            </Select.OptGroup>,
            <Select.OptGroup key={3}>
                <Select.Option value="c-1">c-1</Select.Option>
            </Select.OptGroup>,
        ];
        renderSelect({ defaultOpen: true, children: optionList });
        const groups = document.querySelectorAll(`.${prefixCls}-group`);
        expect(Array.from(groups).map((group) => group.textContent)).toEqual(['Group1', 'Group2']);
        expect(getOptionTexts()).toEqual(['a-1', 'a-2', 'b-1', 'b-2', 'c-1']);
    });

    it('Fragment 包裹的 Option 与 OptGroup 都会收集', () => {
        const children = (
            <>
                <>
                    <Select.Option value="a">a</Select.Option>
                    <Select.Option value="b">b</Select.Option>
                </>
                <>
                    <Select.OptGroup label="Group1">
                        <>
                            <Select.Option value="c">c</Select.Option>
                        </>
                    </Select.OptGroup>
                </>
            </>
        );
        renderSelect({ defaultOpen: true, children });
        expect(Array.from(document.querySelectorAll(`.${prefixCls}-group`), (group) => group.textContent)).toEqual(['Group1']);
        expect(getOptionTexts()).toEqual(['a', 'b', 'c']);
        fireEvent.click(getOptionByText('c'));
        expect(getSelectionText()).toHaveTextContent(/^c$/);
    });

    it('空选项', () => {
        const props = { defaultOpen: true, optionList: [], emptyContent: 'empty' };
        const { rerender } = renderSelect(props);
        const empty = document.querySelectorAll(`.${prefixCls}-option.${prefixCls}-option-empty`);
        expect(empty).toHaveLength(1);
        expect(empty[0]).toHaveTextContent(/^empty$/);
        rerender({ ...props, emptyContent: null });
        expect(document.querySelector(`.${prefixCls}-option`)).toBeNull();
    });

    it('renderOptionItem 的 onClick 与 onMouseEnter', () => {
        const onMouseEnter = vi.fn<() => void>();
        const onClick = vi.fn<() => void>();
        const renderOptionItem = ({ label, style }) => (
            <div className="custom-option" style={style} onClick={onClick} onMouseEnter={onMouseEnter}>
                <div className="option-right">{label}</div>
            </div>
        );
        renderSelect({
            defaultOpen: true,
            optionList: [
                { value: 'abc', label: '抖音' },
                { value: 'jianying', label: '剪映' },
            ],
            renderOptionItem,
        });
        const options = document.querySelectorAll('.custom-option');
        expect(options).toHaveLength(2);
        fireEvent.click(options[0]);
        expect(onClick).toHaveBeenCalledTimes(1);
        fireEvent.mouseEnter(options[1]);
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('悬停只重渲染聚焦状态变化的选项，其余选项跳过渲染', () => {
        const renders: Record<string, number> = {};
        const renderOptionItem = ({ value, label, style, focused, onMouseEnter }) => {
            renders[value] = (renders[value] ?? 0) + 1;
            return (
                <div className="custom-option" style={style} data-focused={focused} onMouseEnter={onMouseEnter}>
                    {label}
                </div>
            );
        };
        renderSelect({ defaultOpen: true, optionList: defaultList, renderOptionItem });
        const before = { ...renders };
        fireEvent.mouseEnter(document.querySelectorAll('.custom-option')[1]);
        expect(document.querySelectorAll('.custom-option')[1]).toHaveAttribute('data-focused', 'true');
        expect(renders.hotsoon).toBeGreaterThan(before.hotsoon);
        expect(renders.pipixia).toBe(before.pipixia);
        expect(renders.toutiao).toBe(before.toutiao);
    });

    it('customTrigger', async () => {
        const triggerRender = () => <div className="custom-trigger">trigger</div>;
        renderSelect({ triggerRender });
        const trigger = screen.getByText('trigger');
        expect(trigger).toHaveClass('custom-trigger');
        await userEvent.click(trigger);
        expect(getOptions()).toHaveLength(defaultList.length);
    });

    it('键盘按键', async () => {
        const { unmount } = renderSelect({
            defaultOpen: true,
            optionList: [
                { value: 'abc', label: 'Abc' },
                { value: 'hotsoon', label: 'Hotsoon' },
                { value: 'pipixia', label: 'Pipixia' },
                { value: 'toutiao', label: 'TopBuzz' },
            ],
        });
        keyDown('ArrowDown');
        expect(getOptions()[1]).toHaveClass(`${prefixCls}-option-focused`);
        keyDown('ArrowUp');
        keyDown('ArrowUp');
        expect(getOptions()[defaultList.length - 1]).toHaveClass(`${prefixCls}-option-focused`);
        keyDown('Escape');
        await expectClosed();
        await userEvent.click(getTrigger());
        keyDown('ArrowDown');
        keyDown('Enter');
        expect(getSelectionText()).toHaveTextContent(defaultList[0].label);
        unmount();

        renderSelect({
            defaultOpen: true,
            optionList: [
                { value: 'abc', label: 'Abc' },
                { value: 'hotsoon', label: 'Hotsoon', disabled: true },
                { value: 'pipixia', label: 'Pipixia' },
            ],
            defaultValue: ['hotsoon', 'abc'],
            multiple: true,
        });
        keyDown('Backspace');
        expect(getTagTexts()).toEqual(['Hotsoon']);
    });

    it('allowCreate', async () => {
        renderSelect({ multiple: true, allowCreate: true, filter: true, optionList: [] });
        await userEvent.click(getTrigger());
        search('1');
        await userEvent.click(getOptions()[0]);
        expect(getTagTexts()).toEqual(['1']);
        keyDown('Backspace', {}, getTriggerInput());
        expect(getTagTexts()).toEqual([]);
    });

    it('【onMouseEnter/onMouseLeave】', async () => {
        const onMouseEnter = vi.fn<NonNullable<SelectProps['onMouseEnter']>>();
        const onMouseLeave = vi.fn<NonNullable<SelectProps['onMouseLeave']>>();
        renderSelect({ onMouseEnter, onMouseLeave });
        await userEvent.hover(getTrigger());
        expect(onMouseEnter).toHaveBeenCalledTimes(1);

        await userEvent.unhover(getTrigger());
        expect(onMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('ref 方法', async () => {
        const ref = createRef<SelectHandle>();
        const { unmount } = renderSelect({ ref, filter: true, multiple: true, optionList: defaultList });
        act(() => ref.current.open());
        expect(getOptionList()).not.toBeNull();

        act(() => ref.current.close());
        await expectClosed();

        act(() => ref.current.selectAll());
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz']);

        act(() => ref.current.deselectAll());
        expect(getTagTexts()).toEqual([]);

        act(() => ref.current.focus());
        expect(document.activeElement.tagName).toEqual('INPUT');
        unmount();

        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const singleRef = createRef<SelectHandle>();
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ ref: singleRef, filter: true, optionList: defaultList, onChange });
        act(() => singleRef.current.selectAll());
        expect(warn).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
        expect(getSelectionText()).toHaveTextContent(/^$/);
        warn.mockRestore();
    });

    it('非受控模式下选择选项后 props.optionList 更新', async () => {
        const newList = [
            { value: 'pipixia', label: 'Pipixia' },
            { value: 'toutiao', label: 'TopBuzz' },
        ];
        const props = {
            defaultActiveFirstOption: true,
            optionList: [
                { value: 'abc', label: 'Abc' },
                { value: 'hotsoon', label: 'Hotsoon' },
            ],
            defaultOpen: true,
            multiple: true,
            filter: true,
        };
        const { rerender, unmount } = renderSelect(props);
        await userEvent.click(getOptions()[0]);
        await userEvent.click(getOptions()[1]);
        rerender({ ...props, optionList: newList });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
        unmount();

        const singleProps = {
            defaultActiveFirstOption: true,
            optionList: [
                { value: 'abc', label: 'Abc' },
                { value: 'hotsoon', label: 'Hotsoon' },
            ],
            defaultOpen: true,
        };
        const { rerender: rerenderSingle } = renderSelect(singleProps);
        await userEvent.click(getOptions()[0]);
        rerenderSingle({ ...singleProps, optionList: newList });
        expect(getSelectionText()).toHaveTextContent(/^abc$/);
    });

    it('受控模式下 multiple 时点击 tag 关闭', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const onDeselect = vi.fn<NonNullable<SelectProps['onDeselect']>>();
        renderSelect({
            optionList: [
                { value: 'abc', label: 'Abc' },
                { value: 'hotsoon', label: 'Hotsoon' },
            ],
            multiple: true,
            value: ['abc', 'hotsoon'],
            onChange,
            onDeselect,
        });
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
        expect(onDeselect).toHaveBeenCalledWith('abc', expect.objectContaining({ value: 'abc', label: 'Abc' }));
        expect(onChange).toHaveBeenCalledWith(['hotsoon']);
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
    });

    it('autoClearSearchValue', async () => {
        const optionList = Array.from({ length: 100 }, (_v, i) => ({ label: `option-${i}`, value: i }));
        renderSelect({ multiple: true, optionList, defaultOpen: true, filter: true });
        await userEvent.click(getTrigger());
        search('option');
        await userEvent.click(getOptions()[0]);
        expect(getTriggerInput()).toHaveValue('');
    });

    it('autoClearSearchValue = false', async () => {
        const optionList = Array.from({ length: 100 }, (_v, i) => ({ label: `option-${i}`, value: i }));
        renderSelect({ multiple: true, optionList, defaultOpen: true, autoClearSearchValue: false, filter: true });
        await userEvent.click(getTrigger());
        search('option');
        await userEvent.click(getOptions()[0]);
        expect(getTagTexts()).toEqual(['option-0']);
        expect(getTriggerInput()).toHaveValue('option');
    });

    it('searchPosition 为 dropdown', () => {
        renderSelect({ filter: true, searchPosition: 'dropdown', defaultOpen: true });
        const input = document.querySelector<HTMLInputElement>(`.${prefixCls}-dropdown-search-wrapper input`);
        expect(input).not.toBeNull();
        expect(getTrigger()).not.toContainElement(input);
        expect(getTriggerInput()).toBeNull();
        search('abc', input);
        expect(getOptionTexts()).toEqual(['Abc']);
    });

    it('searchPosition 为 dropdown 时 inputProps 的 onKeyDown 与 Select 的方向键导航都生效', async () => {
        const onKeyDown = vi.fn<(e: React.KeyboardEvent) => void>();
        renderSelect({ filter: true, searchPosition: 'dropdown', defaultOpen: true, inputProps: { onKeyDown } });
        const input = document.querySelector<HTMLInputElement>(`.${prefixCls}-dropdown-search-wrapper input`);
        const before = getFocusedOption()?.textContent;
        act(() => input.focus());
        await userEvent.keyboard('{ArrowDown}');
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(onKeyDown.mock.calls[0][0].key).toBe('ArrowDown');
        expect(getFocusedOption()?.textContent).not.toBe(before);
    });

    it('onCreate 回调', async () => {
        const onCreate = vi.fn<NonNullable<SelectProps['onCreate']>>();
        renderSelect({ allowCreate: true, filter: true, onCreate, defaultOpen: true });
        search('newOption');
        const [createOption] = getOptions();
        expect(createOption).toHaveTextContent('newOption');
        expect(createOption.querySelector(`.${prefixCls}-create-tips`)).not.toBeNull();
        await userEvent.click(createOption);
        expect(onCreate).toHaveBeenCalledTimes(1);
        expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ value: 'newOption', label: 'newOption' }));
    });

    it('value 为 null/undefined 的边界情况', () => {
        const { rerender } = renderSelect({ value: null });
        expect(getSelectionText()).toHaveTextContent(/^$/);

        rerender({ value: undefined });
        expect(getSelectionText()).toHaveTextContent(/^$/);
    });

    it('multiple 的 value 包含 null/undefined 项', () => {
        renderSelect({ multiple: true, value: ['abc', null, undefined, 'hotsoon'] });
        const tags = getTagTexts();
        expect(tags.length).toBeGreaterThanOrEqual(2);
        expect(tags).toEqual(expect.arrayContaining(['Abc', 'Hotsoon']));
    });

    it('ARIA 属性 - aria-labelledby', () => {
        renderSelect({ 'aria-labelledby': 'label-id' });
        expect(getTrigger()).toHaveAttribute('aria-labelledby', 'label-id');
    });

    it('ARIA 属性 - aria-describedby', () => {
        renderSelect({ 'aria-describedby': 'description-id' });
        expect(getTrigger()).toHaveAttribute('aria-describedby', 'description-id');
    });

    it('ARIA 属性 - aria-required', () => {
        renderSelect({ 'aria-required': true });
        expect(getTrigger()).toHaveAttribute('aria-required', 'true');
    });

    it('ARIA 属性 - aria-invalid', () => {
        renderSelect({ 'aria-invalid': true });
        expect(getTrigger()).toHaveAttribute('aria-invalid', 'true');
    });

    it('borderless 属性', () => {
        renderSelect({ borderless: true });
        expect(getTrigger()).toHaveClass(`${prefixCls}-borderless`);
    });

    it('onClear 回调', async () => {
        const onClear = vi.fn<NonNullable<SelectProps['onClear']>>();
        renderSelect({ defaultValue: 'abc', showClear: true, onClear });
        await userEvent.hover(getTrigger());
        await userEvent.click(getClearIcon());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getSelectionText()).toHaveTextContent(/^$/);
        expect(getOptionList()).toBeNull();
    });

    it('远程模式', async () => {
        const onSearch = vi.fn<NonNullable<SelectProps['onSearch']>>();
        renderSelect({ filter: true, remote: true, onSearch });
        await userEvent.click(getTrigger());
        search('test');
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('test', expect.anything());
        expect(getOptions()).toHaveLength(defaultList.length);
    });

    it('handleListScroll 回调', () => {
        const onListScroll = vi.fn<NonNullable<SelectProps['onListScroll']>>();
        renderSelect({ defaultOpen: true, onListScroll });
        fireEvent.scroll(getOptionList());
        expect(onListScroll).toHaveBeenCalledTimes(1);
    });

    it('未声明的 open 属性不打开下拉', () => {
        renderSelect({ open: true });
        expect(getOptionList()).toBeNull();
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('自定义 renderCreateItem', () => {
        const renderCreateItem = (inputValue) => <div className="custom-create">Create: {inputValue}</div>;
        renderSelect({ allowCreate: true, filter: true, renderCreateItem, defaultOpen: true });
        search('newItem');
        expect(document.querySelector('.custom-create')).toHaveTextContent(/^Create: newItem$/);
    });

    it('filter 时的 onFocus 与 onBlur', async () => {
        const onFocus = vi.fn<NonNullable<SelectProps['onFocus']>>();
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ filter: true, onFocus, onBlur });
        await userEvent.click(getTrigger());
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(getTriggerInput()).toHaveFocus();
        await userEvent.click(document.body);
        await expectClosed();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('外部点击关闭 defaultOpen 的面板时不把焦点移到触发器', async () => {
        const onFocus = vi.fn<NonNullable<SelectProps['onFocus']>>();
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        render(
            <>
                <Select defaultOpen optionList={defaultList} onBlur={onBlur} onFocus={onFocus} />
                <button type="button">outside</button>
            </>
        );
        await userEvent.click(screen.getByRole('button', { name: 'outside' }));
        await expectClosed();
        expect(onFocus).not.toHaveBeenCalled();
        expect(onBlur).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'outside' })).toHaveFocus();
    });

    it('禁用的选项不能被选中', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({
            defaultOpen: true,
            optionList: [
                { value: 'abc', label: 'Abc', disabled: true },
                { value: 'hotsoon', label: 'Hotsoon' },
            ],
            onChange,
        });
        await userEvent.click(getOptions()[0]);
        expect(onChange).not.toHaveBeenCalled();
        expect(getOptionList()).not.toBeNull();
    });

    it('含禁用选项时的键盘导航', () => {
        renderSelect({
            defaultOpen: true,
            defaultActiveFirstOption: false,
            optionList: [
                { value: 'abc', label: 'Abc' },
                { value: 'disabled1', label: 'Disabled1', disabled: true },
                { value: 'hotsoon', label: 'Hotsoon' },
            ],
        });
        expect(getFocusedOption()).toBeNull();
        keyDown('ArrowDown');
        expect(getOptions()[0]).toHaveClass(`${prefixCls}-option-focused`);
        keyDown('ArrowDown');
        expect(getOptions()[2]).toHaveClass(`${prefixCls}-option-focused`);
    });

    it('通过 ref 调用 clearInput', () => {
        const ref = createRef<SelectHandle>();
        renderSelect({ ref, filter: true, defaultOpen: true });
        search('test');
        expect(getTriggerInput()).toHaveValue('test');
        act(() => ref.current.clearInput());
        expect(getTriggerInput()).toHaveValue('');
        expect(getOptions()).toHaveLength(defaultList.length);
    });

    it('multiple 配合 onChangeWithObject 并更新 value', () => {
        const props = {
            multiple: true,
            onChangeWithObject: true,
            optionList: [
                { value: 'abc', label: 'Abc', extra: 'a1' },
                { value: 'hotsoon', label: 'Hotsoon', extra: 'b2' },
            ],
            value: [{ value: 'abc', label: 'Abc', extra: 'a1' }],
        };
        const { rerender } = renderSelect(props);
        expect(getTagTexts()).toEqual(['Abc']);
        rerender({
            ...props,
            value: [
                { value: 'abc', label: 'Abc', extra: 'a1' },
                { value: 'hotsoon', label: 'Hotsoon', extra: 'b2' },
            ],
        });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
    });

    it('没有聚焦选项时按 ENTER', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ defaultOpen: true, defaultActiveFirstOption: false, onChange });
        keyDown('Enter');
        await expectClosed();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('filter 单选时按 ESC', async () => {
        renderSelect({ filter: true, defaultOpen: true });
        expect(getOptionList()).not.toBeNull();
        keyDown('Escape');
        await expectClosed();
        expect(getTrigger()).toHaveFocus();
    });

    it('multiple 全部为禁用项时按 Backspace', () => {
        renderSelect({
            multiple: true,
            defaultValue: ['abc'],
            optionList: [{ value: 'abc', label: 'Abc', disabled: true }],
            defaultOpen: true,
        });
        keyDown('Backspace');
        expect(getTagTexts()).toEqual(['Abc']);
    });

    it('virtualize 下选中项滚动', async () => {
        const optionList = Array.from({ length: 100 }, (_v, i) => ({ label: `option-${i}`, value: i }));
        renderSelect({ virtualize: { itemSize: 36 }, defaultValue: 50, optionList });
        await userEvent.click(getTrigger());
        // scrolling to the selected row needs layout, which jsdom lacks
        expect(getOptionList()).not.toBeNull();
        expect(getOptions().length).toBeGreaterThan(0);
        expect(getOptions().length).toBeLessThan(optionList.length);
        expect(getSelectionText()).toHaveTextContent(/^option-50$/);
    });

    it('dropdownMatchSelectWidth 配合百分比宽度', () => {
        renderSelect({ defaultOpen: true, style: { width: '50%' }, dropdownMatchSelectWidth: true });
        expect(getOptionList()).not.toBeNull();
        const wrapper = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
        expect(wrapper.style.minWidth).toBe('var(--semi-tooltip-trigger-width)');
    });

    it('filter 时分组名参与匹配', () => {
        renderSelect({
            filter: true,
            defaultOpen: true,
            children: [
                <Select.OptGroup key={1} label="Group1">
                    <Select.Option value="a-1">a-1</Select.Option>
                    <Select.Option value="a-2">a-2</Select.Option>
                </Select.OptGroup>,
            ],
        });
        search('Group1');
        expect(getOptionTexts()).toEqual(['a-1', 'a-2']);
    });

    it('filter 时数字分组名参与匹配', () => {
        renderSelect({
            filter: true,
            defaultOpen: true,
            children: [
                <Select.OptGroup key={1} label={2024}>
                    <Select.Option value="x">Xray</Select.Option>
                </Select.OptGroup>,
                <Select.OptGroup key={2} label="2025">
                    <Select.Option value="y">Yankee</Select.Option>
                </Select.OptGroup>,
            ],
        });
        search('202');
        expect(getOptionTexts()).toEqual(['Xray', 'Yankee']);
    });

    describe('combobox 与 listbox 用同一个名称来源', () => {
        const optionList = [{ value: 'a', label: 'A' }];

        it('使用方 aria-label 时两者都用该值', () => {
            renderSelect({ defaultOpen: true, optionList, 'aria-label': 'Fruit', insetLabel: 'Inset' });
            expect(getTrigger()).toHaveAccessibleName('Fruit');
            expect(getOptionList()).toHaveAttribute('aria-label', 'Fruit');
            expect(getOptionList()).not.toHaveAttribute('aria-labelledby');
        });

        it('没有任何名称来源时 listbox 名称等于 combobox 的语言包回落名', () => {
            render(<ConfigProvider locale={en_US}>{selectElement({ defaultOpen: true, optionList })}</ConfigProvider>);
            expect(getTrigger()).toHaveAccessibleName(en_US.Select.label);
            expect(getOptionList()).toHaveAccessibleName(en_US.Select.label);
        });

        it('只有 insetLabel 时 combobox 与 listbox 都以 insetLabel 命名，没有 insetLabelId 时也能引用', () => {
            const { unmount } = renderSelect({ defaultOpen: true, optionList, insetLabel: 'Fruit' });
            expect(getTrigger()).toHaveAccessibleName('Fruit');
            expect(getOptionList()).toHaveAccessibleName('Fruit');
            unmount();
            renderSelect({ defaultOpen: true, optionList, insetLabel: 'Fruit', insetLabelId: 'fruit-label' });
            expect(getTrigger()).toHaveAttribute('aria-labelledby', 'fruit-label');
            expect(getOptionList()).toHaveAttribute('aria-labelledby', 'fruit-label');
            expect(document.getElementById('fruit-label')).toHaveTextContent('Fruit');
        });

        it('有 prefix 时 insetLabel 不渲染，也不作名称来源', () => {
            render(<ConfigProvider locale={en_US}>{selectElement({ defaultOpen: true, optionList, prefix: 'Pre', insetLabel: 'Fruit' })}</ConfigProvider>);
            expect(getTrigger()).toHaveAccessibleName(en_US.Select.label);
            expect(getOptionList()).toHaveAccessibleName(en_US.Select.label);
        });

        it('下拉搜索框与 combobox 同名', () => {
            renderSelect({
                defaultOpen: true,
                optionList,
                filter: true,
                searchPosition: 'dropdown',
                insetLabel: 'Fruit',
            });
            expect(screen.getByRole('textbox')).toHaveAccessibleName('Fruit');
        });

        it('使用方 aria-labelledby 优先于 insetLabel，两者指向同一个标签', () => {
            render(
                <>
                    <span id="external-label">External</span>
                    {selectElement({
                        defaultOpen: true,
                        optionList,
                        insetLabel: 'Fruit',
                        'aria-labelledby': 'external-label',
                    })}
                </>
            );
            expect(getTrigger()).toHaveAccessibleName('External');
            expect(getOptionList()).toHaveAccessibleName('External');
        });

        it('搜索框是 combobox 时也不指向输入框（accname 会取输入内容）', () => {
            renderSelect({ defaultOpen: true, multiple: true, filter: true, optionList, 'aria-label': 'Fruit' });
            const input = getTrigger();
            expect(input.tagName).toBe('INPUT');
            expect(getOptionList()).toHaveAttribute('aria-label', 'Fruit');
            expect(getOptionList()).not.toHaveAttribute('aria-labelledby');
        });
    });

    it('allowCreate 时匹配已有选项', () => {
        renderSelect({
            allowCreate: true,
            filter: true,
            defaultOpen: true,
            optionList: [{ value: 'abc', label: 'abc' }],
        });
        search('abc');
        expect(getOptionTexts()).toEqual(['abc']);
        expect(document.querySelector(`.${prefixCls}-create-tips`)).toBeNull();
    });

    it('loading 状态阻止键盘事件', () => {
        const { rerender } = renderSelect({ loading: true, defaultOpen: true });
        keyDown('ArrowDown');
        expect(document.querySelector(`.${prefixCls}-loading-wrapper`)).not.toBeNull();
        keyDown('Escape');
        expect(getOptionList()).not.toBeNull();
        rerender({ loading: false, defaultOpen: true });
        expect(getTrigger()).toHaveAttribute('aria-activedescendant', getOptions()[0].id);
    });

    it('面板关闭时 handleTriggerBlur', async () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ onBlur });
        await userEvent.click(getTrigger());
        keyDown('Escape');
        await expectClosed();
        expect(onBlur).not.toHaveBeenCalled();
        await userEvent.click(document.body);
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('selectAll 配合 onChangeWithObject', () => {
        const ref = createRef<SelectHandle>();
        const onChange = vi.fn<NonNullable<SelectProps<{ value: string }, true>['onChange']>>();
        renderSelect({ ref, multiple: true, onChangeWithObject: true, optionList: defaultList, onChange });
        act(() => ref.current.selectAll());
        expect(onChange).toHaveBeenCalledTimes(1);
        const [value] = onChange.mock.calls[0];
        expect(value).toHaveLength(4);
        expect(value.map((item) => item.value)).toEqual(['abc', 'hotsoon', 'pipixia', 'toutiao']);
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz']);
    });

    it('自定义 arrowIcon 与 clearIcon', async () => {
        renderSelect({
            arrowIcon: <span className="custom-arrow">▼</span>,
            clearIcon: <span className="custom-clear">×</span>,
            showClear: true,
            defaultValue: 'abc',
        });
        expect(document.querySelector('.custom-arrow')).not.toBeNull();
        expect(screen.getByRole('button', { name: zh_CN.Select.clear })).toContainElement(document.querySelector('.custom-clear'));
    });

    it('insetLabel 配合 insetLabelId', () => {
        renderSelect({ insetLabel: 'Label', insetLabelId: 'test-label-id' });
        const label = document.getElementById('test-label-id');
        expect(label).not.toBeNull();
        expect(label).toHaveTextContent('Label');
    });

    it('autoClearSearchValue 为 false 时 multiple 受控', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({
            multiple: true,
            filter: true,
            autoClearSearchValue: false,
            value: [],
            onChange,
            defaultOpen: true,
        });
        search('abc');
        await userEvent.click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledWith(['abc']);
        expect(getTriggerInput()).toHaveValue('abc');
    });

    it('filter 时 optionList 更新', () => {
        const props = { filter: true, defaultOpen: true, optionList: defaultList };
        const { rerender } = renderSelect(props);
        search('abc');
        rerender({
            ...props,
            optionList: [
                { value: 'new1', label: 'New1' },
                { value: 'new2', label: 'New2' },
            ],
        });
        expect(getOptionList()).not.toBeNull();
        expect(getOptionTexts()).not.toContain('Abc');
    });

    it('非受控模式下 removeTag', async () => {
        const onDeselect = vi.fn<NonNullable<SelectProps['onDeselect']>>();
        renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon'], onDeselect });
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
        expect(onDeselect).toHaveBeenCalledTimes(1);
        expect(getTagTexts()).toEqual(['Hotsoon']);
    });

    it('clickToHide 下在聚焦的触发器上按 Enter，只打开一次下拉', async () => {
        renderSelect({ clickToHide: true });
        getTrigger().focus();
        // the keypress that follows the keydown must not toggle the dropdown shut again
        await userEvent.keyboard('{Enter}');
        expect(getOptionList()).not.toBeNull();
    });

    it('clickToHide 为 false 时的行为', async () => {
        renderSelect({ clickToHide: false, filter: true });
        await userEvent.click(getTrigger());
        expect(getOptionList()).not.toBeNull();
        await userEvent.click(getTrigger());
        expect(getOptionList()).not.toBeNull();
        expect(getTriggerInput()).toHaveFocus();
    });

    it('下拉中的 Tab 键导航', () => {
        renderSelect({ defaultOpen: true, innerBottomSlot: <button className="slot-button">Click me</button> });
        keyDown('Tab');
        expect(screen.getByRole('button', { name: 'Click me' })).toHaveFocus();
        expect(getOptionList()).not.toBeNull();
    });

    it('通过 ref 调用 deselectAll', () => {
        const ref = createRef<SelectHandle>();
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ ref, multiple: true, defaultValue: ['abc', 'hotsoon'], optionList: defaultList, onChange });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
        act(() => ref.current.deselectAll());
        expect(getTagTexts()).toEqual([]);
        expect(onChange).toHaveBeenCalledWith([]);
    });

    it('option 带额外属性', () => {
        renderSelect({
            defaultOpen: true,
            optionList: [{ value: 'abc', label: 'Abc', extra: 'extra1', customProp: 'custom' }],
        });
        expect(getOptionTexts()).toEqual(['Abc']);
    });

    it('handleOptionListChange 配合 defaultActiveFirstOption', () => {
        const props = { defaultOpen: true, defaultActiveFirstOption: true, optionList: defaultList };
        const { rerender } = renderSelect(props);
        keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent(/^Hotsoon$/);
        rerender({
            ...props,
            optionList: [
                { value: 'new1', label: 'New1' },
                { value: 'new2', label: 'New2' },
            ],
        });
        expect(getOptionTexts()).toEqual(['New1', 'New2']);
        expect(getFocusedOption()).toHaveTextContent(/^New1$/);
    });

    it('通过 ref 调用 clearSelected', () => {
        const ref = createRef<SelectHandle>();
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ ref, defaultValue: 'abc', optionList: defaultList, onChange });
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
        act(() => ref.current.deselectAll());
        expect(getSelectionText()).toHaveTextContent(/^$/);
        expect(onChange).toHaveBeenCalledWith(undefined);
    });

    it('filter 时 handleClearClick', async () => {
        const onClear = vi.fn<NonNullable<SelectProps['onClear']>>();
        renderSelect({ filter: true, showClear: true, defaultValue: 'abc', onClear });
        await userEvent.click(getTrigger());
        search('test');
        await userEvent.hover(getTrigger());
        await userEvent.click(getClearIcon());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getTriggerInput()).toHaveValue('');
        expect(getSelectionText()).toHaveTextContent(/^$/);
    });

    it('allowCreate 时 updateOptionsActiveStatus', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ allowCreate: true, filter: true, defaultOpen: true, onChange });
        search('newItem');
        await userEvent.click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledWith('newItem');
        expect(getSelectionText()).toHaveTextContent(/^newItem$/);
    });

    it('multiple 含多个禁用项时按 Backspace', () => {
        renderSelect({
            multiple: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia'],
            optionList: [
                { value: 'abc', label: 'Abc', disabled: true },
                { value: 'hotsoon', label: 'Hotsoon', disabled: true },
                { value: 'pipixia', label: 'Pipixia' },
            ],
            defaultOpen: true,
        });
        keyDown('Backspace');
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
    });

    it('在禁用选项上按 ENTER', () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({
            defaultOpen: true,
            defaultActiveFirstOption: true,
            optionList: [{ value: 'abc', label: 'Abc', disabled: true }],
            onChange,
        });
        // the default highlight skips a disabled option; hovering still lands on it
        fireEvent.mouseEnter(getOptionByText('Abc'));
        keyDown('Enter');
        expect(onChange).not.toHaveBeenCalled();
        expect(getOptionList()).not.toBeNull();
    });

    it('多个 group 时 renderWithGroup', () => {
        renderSelect({
            defaultOpen: true,
            children: [
                <Select.OptGroup key={1} label="Group1">
                    <Select.Option value="a-1">a-1</Select.Option>
                </Select.OptGroup>,
                <Select.OptGroup key={2} label="Group2">
                    <Select.Option value="b-1">b-1</Select.Option>
                </Select.OptGroup>,
            ],
        });
        const groups = Array.from(document.querySelectorAll(`.${prefixCls}-group`));
        expect(groups.map((group) => group.textContent)).toEqual(['Group1', 'Group2']);
        const groupNodes = Array.from(getOptionList().children);
        expect(groupNodes.map((group) => Array.from(group.children).map((node) => node.textContent))).toEqual([
            ['Group1', 'a-1'],
            ['Group2', 'b-1'],
        ]);
    });

    it('_diffSelections 处理 value 相同、label 不同的情况', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ optionList: [{ value: 'abc', label: 'Label1' }], onChange, defaultOpen: true });
        await userEvent.click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('abc');
    });

    it('suffix 为元素', () => {
        renderSelect({ suffix: <span className="custom-suffix">suffix</span> });
        expect(document.querySelector(`.${prefixCls}-suffix`)).not.toBeNull();
        expect(screen.getByText('suffix')).toHaveClass('custom-suffix');
        expect(getTrigger()).toHaveClass(`${prefixCls}-with-suffix`);
    });

    it('prefix 为文本', () => {
        renderSelect({ prefix: 'Prefix:' });
        expect(document.querySelector(`.${prefixCls}-prefix-text`)).toHaveTextContent(/^Prefix:$/);
    });

    it('_updateMultiple 处理既不在 optionList 也不在 selections 中的 value', () => {
        renderSelect({ multiple: true, value: ['notExist1', 'notExist2'], optionList: defaultList });
        expect(getTagTexts()).toEqual(['notExist1', 'notExist2']);
    });

    it('option 配合 renderOptionItem', () => {
        const renderOptionItem = ({ label, value, className, style, onMouseEnter, onClick }) => (
            <div className={`custom-option ${className}`} style={style} onClick={onClick} onMouseEnter={onMouseEnter}>
                {label} - {value}
            </div>
        );
        renderSelect({ defaultOpen: true, optionList: defaultList, renderOptionItem });
        const options = Array.from(document.querySelectorAll('.custom-option'));
        expect(options.map((option) => option.textContent)).toEqual(['Abc - abc', 'Hotsoon - hotsoon', 'Pipixia - pipixia', 'TopBuzz - toutiao']);
        expect(options[0]).toHaveClass(`${prefixCls}-option-custom`);
    });

    it('option 配合 renderOptionItem 时点击', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const renderOptionItem = ({ label, onClick, onMouseEnter, style, className }) => (
            <div className={`custom-option ${className}`} style={style} onClick={onClick} onMouseEnter={onMouseEnter}>
                {label}
            </div>
        );
        renderSelect({ defaultOpen: true, optionList: defaultList, renderOptionItem, onChange });
        await userEvent.click(document.querySelector('.custom-option'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('abc');
    });

    it('option 的 onMouseEnter 回调', async () => {
        renderSelect({ defaultOpen: true, optionList: defaultList });
        expect(getFocusedOption()).toHaveTextContent(/^Abc$/);
        await userEvent.hover(getOptions()[2]);
        expect(getFocusedOption()).toHaveTextContent(/^Pipixia$/);
        expect(getTrigger().getAttribute('aria-activedescendant')).toBe(getOptions()[2].id);
    });

    it('showRestTagsPopover 配合 onPlusNMouseEnter', async () => {
        renderSelect({
            multiple: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'],
            maxTagCount: 2,
            showRestTagsPopover: true,
        });
        expect(screen.queryByText('Pipixia')).toBeNull();
        await userEvent.hover(screen.getByText('+2'));
        await waitFor(() => expect(screen.getByText('Pipixia')).toBeInTheDocument());
        expect(screen.getByText('TopBuzz')).toBeInTheDocument();
    });

    it('handleSlotMouseEnter', async () => {
        renderSelect({ defaultOpen: true, innerBottomSlot: <div className="custom-slot">Slot Content</div> });
        expect(getFocusedOption()).not.toBeNull();
        await userEvent.hover(screen.getByText('Slot Content'));
        expect(getFocusedOption()).toBeNull();
    });

    it('handlePopoverClose 回调', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        renderSelect({ defaultOpen: true, onDropdownVisibleChange });
        keyDown('Escape');
        await expectClosed();
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('isFullTags 为 false 时 updateIsFullTags', () => {
        renderSelect({
            multiple: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'],
            maxTagCount: 2,
            showRestTagsPopover: true,
        });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+2']);
        expect(screen.queryByText('Pipixia')).toBeNull();
    });

    it('远程 filter 且结果为空', () => {
        renderSelect({ filter: true, remote: true, optionList: [], defaultOpen: true });
        search('test');
        expect(getOptionList()).not.toBeNull();
        expect(document.querySelector(`.${prefixCls}-option-empty`)).not.toBeNull();
    });

    it('multiple 时 handleClear 与 onClear 回调', async () => {
        const onClear = vi.fn<NonNullable<SelectProps['onClear']>>();
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon'], showClear: true, onClear, onChange });
        await userEvent.hover(getTrigger());
        await userEvent.click(getClearIcon());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith([]);
        expect(getTagTexts()).toEqual([]);
    });

    it('禁用 group 的 optionList', () => {
        renderSelect({
            defaultOpen: true,
            children: [
                // OptGroup declares no disabled prop; the attribute is only forwarded to the DOM
                <Select.OptGroup key={1} {...{ disabled: true }} label="DisabledGroup">
                    <Select.Option value="a-1">a-1</Select.Option>
                </Select.OptGroup>,
            ],
        });
        expect(document.querySelectorAll(`.${prefixCls}-group`)).toHaveLength(1);
        expect(getOptionTexts()).toEqual(['a-1']);
    });

    it('label 为空的 option', () => {
        renderSelect({ defaultOpen: true, optionList: [{ value: 'abc', label: '' }] });
        expect(getOptions()).toHaveLength(1);
    });

    it('按 UP 键导航', () => {
        renderSelect({ defaultOpen: true, optionList: defaultList });
        keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent(/^Hotsoon$/);
        keyDown('ArrowUp');
        expect(getFocusedOption()).toHaveTextContent(/^Abc$/);
    });

    it('handleKeyDown 处理 PAGE_DOWN 与 PAGE_UP', () => {
        renderSelect({ defaultOpen: true, optionList: defaultList });
        keyDown('PageDown');
        keyDown('PageUp');
        expect(getFocusedOption()).toHaveTextContent(/^Abc$/);
        expect(getOptionList()).not.toBeNull();
    });

    it.each([
        [' ', {}],
        ['ArrowDown', { altKey: true }],
        ['Enter', {}],
        ['ArrowDown', {}],
        ['ArrowUp', {}],
    ])('不可搜索时 %j（%o）打开面板', (key, init) => {
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        renderSelect({ optionList: defaultList, onDropdownVisibleChange });
        // claimed: Space must not scroll the page, Enter must not submit a form
        expect(keyDown(key, init)).toBe(false);
        expect(onDropdownVisibleChange).toHaveBeenCalledWith(true);
        expect(getOptionList()).not.toBeNull();
    });

    it('不可搜索时 Home 与 End 打开面板并移到首尾可用项', () => {
        const optionList = [{ value: 'x', label: 'X', disabled: true }, ...defaultList, { value: 'y', label: 'Y', disabled: true }];
        const { unmount } = renderSelect({ optionList });
        keyDown('End');
        expect(getOptionList()).not.toBeNull();
        expect(getFocusedOption()).toHaveTextContent(/^TopBuzz$/);
        keyDown('Home');
        expect(getFocusedOption()).toHaveTextContent(/^Abc$/);
        unmount();

        renderSelect({ optionList });
        keyDown('Home');
        expect(getFocusedOption()).toHaveTextContent(/^Abc$/);
        expect(getTrigger()).toHaveAttribute('aria-activedescendant', getFocusedOption().id);
    });

    it('不可搜索时按字符移到以它开头的可用选项，关闭时先打开', () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        renderSelect({
            optionList: [...defaultList, { value: 'tiktok', label: 'TikTok', disabled: true }, { value: 'tt', label: 'Tt' }],
            onDropdownVisibleChange,
        });
        expect(keyDown('p')).toBe(false);
        expect(onDropdownVisibleChange).toHaveBeenCalledWith(true);
        expect(getFocusedOption()).toHaveTextContent(/^Pipixia$/);
        vi.setSystemTime(Date.now() + 1000);
        keyDown('t');
        expect(getFocusedOption()).toHaveTextContent(/^TopBuzz$/);
        keyDown('t');
        expect(getFocusedOption()).toHaveTextContent(/^Tt$/);
    });

    it('可搜索时字符与空格留给输入框', () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        renderSelect({ optionList: defaultList, filter: true, multiple: true, onDropdownVisibleChange });
        expect(keyDown(' ', {}, getTriggerInput())).toBe(true);
        expect(keyDown('p', {}, getTriggerInput())).toBe(true);
        expect(keyDown('Home', {}, getTriggerInput())).toBe(true);
        expect(onDropdownVisibleChange).not.toHaveBeenCalled();
    });

    it('有已选值时打开，高亮第一个已选的可见项，直接 Enter 不改值', () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const { unmount } = renderSelect({ optionList: defaultList, defaultValue: 'pipixia', onChange });
        keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent(/^Pipixia$/);
        keyDown('Enter');
        expect(onChange).not.toHaveBeenCalled();
        expect(getSelectionText()).toHaveTextContent(/^Pipixia$/);
        unmount();
        renderSelect({ optionList: defaultList, multiple: true, defaultValue: ['toutiao', 'hotsoon'] });
        keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent(/^Hotsoon$/);
    });

    it('打开时 Space 与 Enter 一样作用于高亮项：多选切换并保持打开，typeahead 中计入匹配字符串', () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({
            multiple: true,
            optionList: [...defaultList, { value: 'top', label: 'Top Hits' }],
            onChange,
        });
        keyDown(' ');
        expect(getFocusedOption()).toHaveTextContent(/^Abc$/);
        expect(keyDown(' ')).toBe(false);
        expect(onChange).toHaveBeenLastCalledWith(['abc']);
        expect(getOptionList()).not.toBeNull();
        // the clock is frozen, so the search string never times out: Space joins it
        keyDown('t');
        keyDown('o');
        keyDown('p');
        keyDown(' ');
        keyDown('h');
        expect(getFocusedOption()).toHaveTextContent(/^Top Hits$/);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('多选不可搜索时，已选 Tag 上的 Enter 与 Space 不打开下拉、不改值', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ multiple: true, optionList: defaultList, defaultValue: ['hotsoon', 'abc'], onChange });
        const getTag = () => document.querySelector<HTMLElement>(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag`);
        getTag().focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
        expect(getOptionList()).toBeNull();
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.keyboard('{Backspace}');
        expect(onChange).toHaveBeenCalledWith(['abc']);
        expect(getTagTexts()).toEqual(['Abc']);
        await userEvent.click(getTag());
        expect(getOptionList()).not.toBeNull();
    });

    it('virtualize 时用 End 打开，滚到高亮项', async () => {
        // jsdom has no layout (scrollHeight 0) and no Element.scrollTo, which the virtualizer needs
        Object.defineProperties(HTMLElement.prototype, {
            scrollHeight: { configurable: true, get: () => 36 * 100 },
            scrollTo: {
                configurable: true,
                value(this: HTMLElement, { top = 0 }: ScrollToOptions) {
                    this.scrollTop = top;
                    this.dispatchEvent(new Event('scroll'));
                },
            },
        });
        onTestFinished(() => {
            Reflect.deleteProperty(HTMLElement.prototype, 'scrollHeight');
            Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
        });
        const optionList = Array.from({ length: 100 }, (_, i) => ({ label: `option-${i}`, value: i }));
        renderSelect({ virtualize: { itemSize: 36 }, defaultValue: 0, optionList });
        keyDown('End');
        await waitFor(() => expect(getFocusedOption()).toHaveTextContent(/^option-99$/));
        expect(getTrigger()).toHaveAttribute('aria-activedescendant', getFocusedOption().id);
    });

    it('maxHeight 为字符串时原样作为列表的 max-height', () => {
        renderSelect({ defaultOpen: true, maxHeight: '50%' });
        expect(getOptionList().style.maxHeight).toBe('50%');
    });

    it('inputProps.className 与搜索框的内置类名合并', () => {
        const { unmount } = renderSelect({ filter: true, multiple: true, inputProps: { className: 'mine' } });
        expect(document.querySelector('.mine')).toHaveClass(`${prefixCls}-input`, `${prefixCls}-input-multiple`);
        unmount();
        renderSelect({
            filter: true,
            searchPosition: 'dropdown',
            defaultOpen: true,
            inputProps: { className: 'mine' },
        });
        expect(document.querySelector('.mine')).toHaveClass(`${prefixCls}-dropdown-input`, `${prefixCls}-dropdown-input-single`);
    });

    it('选项列表变化后高亮第一个已选的可见项，没有时才按 defaultActiveFirstOption', () => {
        const props = { defaultOpen: true, optionList: defaultList, value: 'toutiao' };
        const { rerender } = renderSelect(props);
        expect(getFocusedOption()).toHaveTextContent(/^TopBuzz$/);
        rerender({ ...props, optionList: [{ value: 'new', label: 'New' }, ...defaultList] });
        expect(getFocusedOption()).toHaveTextContent(/^TopBuzz$/);
        rerender({ ...props, optionList: [{ value: 'new', label: 'New' }] });
        expect(getFocusedOption()).toHaveTextContent(/^New$/);
    });

    it('自定义 triggerRender', () => {
        const triggerRender = ({ value }) => <div className="custom-trigger">Custom: {value ? (Array.isArray(value) ? value.map((v) => v.label).join(',') : value.label) : ''}</div>;
        renderSelect({ triggerRender, defaultValue: 'abc' });
        expect(document.querySelector('.custom-trigger')).toHaveTextContent(/^Custom: Abc$/);
    });

    it.each(['{Enter}', ' ', '{ArrowDown}'])('triggerRender 内按钮聚焦时 %j 只交给按钮，不打开面板', async (key) => {
        const onPress = vi.fn<(e: { stopPropagation: () => void }) => void>((e) => e.stopPropagation());
        renderSelect({
            triggerRender: () => (
                <div className="custom-trigger">
                    <button type="button" aria-label="清除" onClick={onPress} />
                </div>
            ),
        });

        screen.getByRole('button', { name: '清除' }).focus();
        await userEvent.keyboard(key);
        expect(onPress).toHaveBeenCalledTimes(key === '{ArrowDown}' ? 0 : 1);
        expect(getOptionList()).toBeNull();
    });

    it('triggerRender 内 role="button" 的元素上按 Enter 只交给它，不打开面板；指针点击仍打开', async () => {
        const onPress = vi.fn<() => void>();
        renderSelect({
            triggerRender: () => (
                <div className="custom-trigger">
                    <Tag aria-label="清除" onClick={onPress}>
                        Abc
                    </Tag>
                </div>
            ),
        });

        screen.getByRole('button', { name: '清除' }).focus();
        await userEvent.keyboard('{Enter}');
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(getOptionList()).toBeNull();

        await userEvent.click(screen.getByRole('button', { name: '清除' }));
        expect(getOptionList()).not.toBeNull();
    });

    it('triggerRender 配合 onRemove', async () => {
        const triggerRender = ({ value, onRemove, onClear }) => (
            <div className="custom-trigger">
                {value &&
                    value.map((v, i) => (
                        <span key={i} className="custom-tag" onClick={() => onRemove(v)}>
                            {v.label}
                        </span>
                    ))}
                <button className="clear-btn" onClick={onClear}>
                    Clear
                </button>
            </div>
        );
        renderSelect({ multiple: true, triggerRender, defaultValue: ['abc', 'hotsoon'] });
        expect(document.querySelector('.custom-trigger')).not.toBeNull();
        expect(document.querySelectorAll('.custom-tag')).toHaveLength(2);
        await userEvent.click(screen.getByText('Abc'));
        expect(Array.from(document.querySelectorAll('.custom-tag')).map((tag) => tag.textContent)).toEqual(['Hotsoon']);
        // closes the list the tag click opened, then clears: the clear click must not reopen it
        await userEvent.keyboard('{Escape}');
        expect(screen.queryByRole('listbox')).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
        expect(document.querySelectorAll('.custom-tag')).toHaveLength(0);
        expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('triggerRender 按文档无参调用 onClear 与 onSearch', async () => {
        const onChange = vi.fn<NonNullable<SelectProps<string, true>['onChange']>>();
        const onSearch = vi.fn<NonNullable<SelectProps['onSearch']>>();
        const triggerRender = ({ value, onClear, onSearch: search }) => (
            <div className="custom-trigger">
                <span className="custom-value">{value.map((v) => v.label).join(',')}</span>
                <button onClick={() => onClear()}>Clear</button>
                <button onClick={() => search('ab')}>Search</button>
            </div>
        );
        renderSelect({ multiple: true, filter: true, triggerRender, defaultValue: ['abc'], onChange, onSearch });
        await userEvent.click(screen.getByRole('button', { name: 'Search' }));
        expect(onSearch).toHaveBeenCalledWith('ab', undefined);
        await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
        expect(onChange).toHaveBeenLastCalledWith([]);
        expect(document.querySelector('.custom-value')).toHaveTextContent(/^$/);
    });

    it('受控 value 为 undefined', () => {
        renderSelect({ value: undefined, optionList: defaultList, placeholder: 'please select' });
        expect(getSelectionText()).toHaveClass(`${prefixCls}-selection-placeholder`);
        expect(getSelectionText()).toHaveTextContent(/^please select$/);
    });

    it('value={undefined} 按非受控处理：取 defaultValue，选择即更新', async () => {
        renderSelect({ value: undefined, defaultValue: 'abc', optionList: defaultList });
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
        await userEvent.click(getSelectionText());
        await userEvent.click(screen.getByRole('option', { name: 'Hotsoon' }));
        expect(getSelectionText()).toHaveTextContent(/^Hotsoon$/);
    });

    it('受控 value 从有值变为 undefined', () => {
        const props = { value: 'abc', optionList: defaultList };
        const { rerender } = renderSelect(props);
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
        rerender({ ...props, value: undefined });
        expect(getSelectionText()).toHaveTextContent(/^$/);
        expect(getSelectionText()).toHaveClass(`${prefixCls}-selection-placeholder`);
    });

    it('label 相同、value 不同的选项按 value 各自选中', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const optionList = [
            { value: 'a', label: 'Same' },
            { value: 'b', label: 'Same' },
        ];
        renderSelect({ multiple: true, optionList, onChange, defaultOpen: true });
        const [first, second] = getOptions();
        await userEvent.click(first);
        expect(first).toHaveAttribute('aria-selected', 'true');
        expect(second).toHaveAttribute('aria-selected', 'false');
        await userEvent.click(second);
        expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
        expect(getTagTexts()).toEqual(['Same', 'Same']);
    });

    it('filter 为自定义函数', () => {
        const customFilter = (inputValue, option) => option.label.toLowerCase().includes(inputValue.toLowerCase());
        renderSelect({ filter: customFilter, defaultOpen: true });
        search('ABC');
        expect(getOptionTexts()).toEqual(['Abc']);
    });

    it('onBlur 回调', async () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ onBlur, autoFocus: true });
        act(() => getTrigger().blur());
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('自定义 emptyContent', () => {
        renderSelect({ defaultOpen: true, optionList: [], emptyContent: <div className="custom-empty">No Data</div> });
        expect(document.querySelector('.custom-empty')).toHaveTextContent(/^No Data$/);
    });

    it('defaultValue 为数字', () => {
        renderSelect({
            defaultValue: 1,
            optionList: [
                { value: 1, label: 'One' },
                { value: 2, label: 'Two' },
            ],
        });
        expect(getSelectionText()).toHaveTextContent(/^One$/);
    });

    it('multiple 配合数字 value', () => {
        renderSelect({
            multiple: true,
            defaultValue: [1, 2],
            optionList: [
                { value: 1, label: 'One' },
                { value: 2, label: 'Two' },
            ],
        });
        expect(getTagTexts()).toEqual(['One', 'Two']);
    });

    it('通过 ref 关闭', async () => {
        const ref = createRef<SelectHandle>();
        renderSelect({ ref, defaultOpen: true });
        expect(getOptionList()).not.toBeNull();
        act(() => ref.current.close());
        await expectClosed();
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('通过 ref 打开', () => {
        const ref = createRef<SelectHandle>();
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        renderSelect({ ref, onDropdownVisibleChange });
        expect(getOptionList()).toBeNull();
        act(() => ref.current.open());
        expect(getOptionList()).not.toBeNull();
        expect(onDropdownVisibleChange).toHaveBeenCalledWith(true);
    });

    it('通过 ref 聚焦', () => {
        const ref = createRef<SelectHandle>();
        renderSelect({ ref });
        act(() => ref.current.focus());
        expect(getTrigger()).toHaveFocus();
        expect(getTrigger()).toHaveClass(`${prefixCls}-focus`);
        expect(getOptionList()).toBeNull();
    });

    it('handleTriggerBlur 事件', () => {
        renderSelect({ autoFocus: true });
        expect(getTrigger()).toHaveClass(`${prefixCls}-focus`);
        act(() => getTrigger().blur());
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-focus`);
    });

    it('通过 ref 调用 selectAll', () => {
        const ref = createRef<SelectHandle>();
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ ref, multiple: true, optionList: defaultList, onChange });
        expect(getTagTexts()).toEqual([]);
        act(() => ref.current.selectAll());
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz']);
        expect(onChange).toHaveBeenCalledWith(['abc', 'hotsoon', 'pipixia', 'toutiao']);
    });

    it('通过 ref 调用 search', () => {
        const ref = createRef<SelectHandle>();
        const onSearch = vi.fn<NonNullable<SelectProps['onSearch']>>();
        renderSelect({ ref, filter: true, defaultOpen: true, onSearch });
        act(() => ref.current.search('abc'));
        expect(getTriggerInput()).toHaveValue('abc');
        expect(getOptionTexts()).toEqual(['Abc']);
        expect(onSearch).toHaveBeenCalledWith('abc', undefined);
    });

    it('inputValue 含特殊字符时 filter', () => {
        renderSelect({ filter: true, defaultOpen: true });
        search('(test)');
        expect(getOptions()).toHaveLength(0);
        expect(document.querySelector(`.${prefixCls}-option-empty`)).not.toBeNull();
    });

    it('stopPropagation 属性', async () => {
        const onParentClick = vi.fn<() => void>();
        const renderInParent = (stopPropagation) =>
            render(
                <div onClick={onParentClick}>
                    <Select {...commonProps} defaultOpen stopPropagation={stopPropagation}>
                        {getOption()}
                    </Select>
                </div>
            );
        const { unmount } = renderInParent(true);
        await userEvent.click(getOptions()[0]);
        expect(onParentClick).not.toHaveBeenCalled();
        unmount();
        renderInParent(false);
        await userEvent.click(getOptions()[0]);
        expect(onParentClick).toHaveBeenCalledTimes(1);
    });

    it('preventScroll 属性', () => {
        renderSelect({ preventScroll: true, autoFocus: true });
        // scrolling cannot be observed in jsdom; the trigger still receives focus
        expect(getTrigger()).toHaveFocus();
    });

    it('renderSelectedItem 配合 isRenderInTag 为 false', () => {
        const renderSelectedItem = (optionNode) => ({
            isRenderInTag: false,
            content: <span className="custom-selected">{optionNode.label}</span>,
        });
        renderSelect({ multiple: true, defaultValue: ['abc'], renderSelectedItem });
        expect(document.querySelector('.custom-selected')).toHaveTextContent(/^Abc$/);
        expect(document.querySelector('.custom-selected').closest(`.${BASE_CLASS_PREFIX}-tag`)).toBeNull();
    });

    it('option 带额外 data 属性', () => {
        renderSelect({ defaultOpen: true, optionList: [{ value: 'abc', label: 'Abc', 'data-testid': 'option-abc' }] });
        expect(getOptions()).toHaveLength(1);
        expect(screen.getByTestId('option-abc')).toBe(getOptions()[0]);
    });

    it('position 为 bottom', () => {
        renderSelect({ position: 'bottom', defaultOpen: true });
        expect(getOptionList()).not.toBeNull();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-popover-wrapper`)).toHaveAttribute('x-placement', 'bottom');
    });

    it('_diffSelections 处理 label 相同、value 不同的情况', () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const props = { optionList: [{ value: 'abc1', label: 'Same' }], defaultValue: 'abc1', onChange };
        const { rerender } = renderSelect(props);
        rerender({ ...props, optionList: [{ value: 'abc2', label: 'Same' }], value: 'abc2' });
        expect(getSelectionText()).toHaveTextContent(/^Same$/);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('allowCreate 且已选中时 updateOptionsActiveStatus', async () => {
        renderSelect({ allowCreate: true, filter: true, multiple: true, defaultOpen: true });
        search('created');
        await userEvent.click(getOptions()[0]);
        expect(getTagTexts()).toEqual(['created']);
        const created = getOptions().find((option) => option.textContent === 'created');
        expect(created).toHaveClass(`${prefixCls}-option-selected`);
    });

    it('handleArrowKeyDown 首尾循环', () => {
        renderSelect({
            defaultOpen: true,
            optionList: [
                { value: 'a', label: 'A' },
                { value: 'b', label: 'B' },
            ],
        });
        keyDown('ArrowUp');
        expect(getFocusedOption()).toHaveTextContent(/^B$/);
        keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent(/^A$/);
        keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent(/^B$/);
        keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent(/^A$/);
    });

    it('handleContainerKeyDown 处理 TAB', async () => {
        renderSelect({ defaultOpen: true, innerBottomSlot: <button className="slot-btn">Button</button> });
        keyDown('Tab');
        const button = screen.getByRole('button', { name: 'Button' });
        expect(button).toHaveFocus();
        keyDown('Tab', {}, button);
        await expectClosed();
        expect(getTrigger()).toHaveFocus();
    });

    it('optionList 带 key 时 onChange 收到原 key', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({
            defaultOpen: true,
            onChangeWithObject: true,
            onChange,
            optionList: [{ value: 'abc', label: 'Abc', key: 'custom-key' }],
        });
        expect(getOptionTexts()).toEqual(['Abc']);
        await userEvent.click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledWith({ value: 'abc', label: 'Abc', key: 'custom-key' });
    });

    it('inputValue 为空时通过 ref 调用 clearInput', () => {
        const ref = createRef<SelectHandle>();
        const onSearch = vi.fn<NonNullable<SelectProps['onSearch']>>();
        renderSelect({ ref, filter: true, onSearch });
        act(() => ref.current.clearInput());
        expect(onSearch).not.toHaveBeenCalled();
    });

    it('inputValue 不为空时通过 ref 调用 clearInput', () => {
        const ref = createRef<SelectHandle>();
        const onSearch = vi.fn<NonNullable<SelectProps['onSearch']>>();
        renderSelect({ ref, filter: true, defaultOpen: true, onSearch });
        search('test');
        expect(getTriggerInput()).toHaveValue('test');
        act(() => ref.current.clearInput());
        expect(getTriggerInput()).toHaveValue('');
        expect(onSearch).toHaveBeenLastCalledWith('', undefined);
    });

    it('multiple 时 handleInputChange 重新定位', () => {
        renderSelect({ multiple: true, filter: true, defaultOpen: true });
        search('test');
        expect(getTriggerInput()).toHaveValue('test');
        expect(getTriggerInput().parentElement).toHaveStyle({ width: '64px' });
    });

    it('isFocus 为 true 时关闭', async () => {
        renderSelect({ defaultOpen: true, autoFocus: true });
        expect(getTrigger()).toHaveFocus();
        keyDown('Escape');
        await expectClosed();
        expect(getTrigger()).toHaveFocus();
        expect(getTrigger()).toHaveClass(`${prefixCls}-focus`);
    });

    it('配合 overFlowCount 时 updateOverflowItemCount', () => {
        renderSelect({
            multiple: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'],
            maxTagCount: 2,
            style: { width: 200 },
        });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+2']);
    });

    it('不带 showRestTagsPopover 时 renderOneLineTags', async () => {
        renderSelect({
            multiple: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia'],
            maxTagCount: 2,
            showRestTagsPopover: false,
        });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+1']);
        await userEvent.hover(screen.getByText('+1'));
        expect(screen.queryByText('Pipixia')).toBeNull();
    });

    it('ellipsisTrigger 悬停时的溢出处理', () => {
        renderSelect({
            multiple: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'],
            ellipsisTrigger: 'hover',
            style: { width: 150 },
        });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz']);
    });

    it('handleOverflow 回调', () => {
        // jsdom has no layout and ResizeObserver is a no-op stub; a 100px tag area makes the 120px tags overflow
        mockResizeObserver({
            onObserve(element) {
                const width = element.classList.contains(`${BASE_CLASS_PREFIX}-overflow-list`) ? 100 : 120;
                return [{ target: { clientWidth: width }, contentRect: { width } }];
            },
        });
        renderSelect({
            multiple: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'],
            ellipsisTrigger: 'hover',
            maxTagCount: 2,
            style: { width: 100 },
        });
        expect(getTagTexts()).toEqual(['Abc', '+3']);
    });

    it('renderCollapsedTags 配合 overflowItemCount', () => {
        renderSelect({
            multiple: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'],
            ellipsisTrigger: 'hover',
            maxTagCount: 1,
            style: { width: 80 },
        });
        expect(getTagTexts()).toEqual(['Abc', '+3']);
        expect(screen.getByText('+3').closest(`.${BASE_CLASS_PREFIX}-tag`)).toHaveClass(`${prefixCls}-content-wrapper-collapse-tag`);
    });

    it('_notifyBlur 回调', async () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ onBlur });
        await userEvent.click(getTrigger());
        await userEvent.click(document.body);
        await expectClosed();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('_notifyFocus 回调', async () => {
        const onFocus = vi.fn<NonNullable<SelectProps['onFocus']>>();
        renderSelect({ onFocus });
        await userEvent.click(getTrigger());
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(getTrigger()).toHaveClass(`${prefixCls}-focus`);
    });

    it('filter 为空字符串', () => {
        renderSelect({ filter: true, defaultOpen: true });
        search('a');
        search('');
        expect(getOptions()).toHaveLength(defaultList.length);
    });

    it('multiple 配合 onChangeWithObject 取消选中', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({
            multiple: true,
            onChangeWithObject: true,
            defaultValue: [{ value: 'abc', label: 'Abc' }],
            onChange,
            defaultOpen: true,
        });
        await userEvent.click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith([]);
    });

    it('受控 multiple 为空数组', () => {
        renderSelect({ multiple: true, value: [], optionList: defaultList, placeholder: 'please select' });
        expect(getTagTexts()).toEqual([]);
        expect(document.querySelector(`.${prefixCls}-selection-placeholder`)).toHaveTextContent(/^please select$/);
    });

    it('defaultValue 配合 onChangeWithObject', () => {
        renderSelect({
            onChangeWithObject: true,
            defaultValue: { value: 'abc', label: 'Abc' },
            optionList: defaultList,
        });
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
    });

    it('multiple 的 defaultValue 配合 onChangeWithObject', () => {
        renderSelect({
            multiple: true,
            onChangeWithObject: true,
            defaultValue: [{ value: 'abc', label: 'Abc' }],
            optionList: defaultList,
        });
        expect(getTagTexts()).toEqual(['Abc']);
    });

    it('innerBottomSlot 配合 mouseEnter', async () => {
        const onSlotMouseEnter = vi.fn<() => void>();
        renderSelect({
            defaultOpen: true,
            innerBottomSlot: (
                <div className="inner-slot" onMouseEnter={onSlotMouseEnter}>
                    Slot
                </div>
            ),
        });
        await userEvent.hover(screen.getByText('Slot'));
        expect(onSlotMouseEnter).toHaveBeenCalledTimes(1);
        expect(getFocusedOption()).toBeNull();
    });

    it('handlePopoverClose 事件', async () => {
        const onSearch = vi.fn<NonNullable<SelectProps['onSearch']>>();
        renderSelect({ defaultOpen: true, filter: true, onSearch });
        search('abc');
        keyDown('Escape');
        await expectClosed();
        expect(onSearch).toHaveBeenLastCalledWith('', expect.anything());
    });

    it('下拉中的 Shift + Tab 键', async () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ defaultOpen: true, innerBottomSlot: <button className="slot-btn">Button</button>, onBlur });
        act(() => getTrigger().focus());
        await userEvent.tab({ shift: true });
        await expectClosed();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('全部为禁用选项时方向键不聚焦任何选项', () => {
        renderSelect({
            defaultOpen: true,
            optionList: [
                { value: 'a', label: 'A', disabled: true },
                { value: 'b', label: 'B', disabled: true },
            ],
        });
        keyDown('ArrowDown');
        expect(getFocusedOption()).toBeNull();
    });

    it('filter 且有 inputValue 时 handleBackspaceKeyDown', () => {
        renderSelect({ multiple: true, filter: true, defaultValue: ['abc', 'hotsoon'], defaultOpen: true });
        search('test');
        keyDown('Backspace');
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
    });

    it('optionList 含特殊字符时 filter', () => {
        renderSelect({
            filter: true,
            defaultOpen: true,
            optionList: [
                { value: 'test(1)', label: 'Test (1)' },
                { value: 'test[2]', label: 'Test [2]' },
            ],
        });
        search('(1)');
        expect(getOptionTexts()).toEqual(['Test (1)']);
    });

    it('受控模式下 allowCreate', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ allowCreate: true, filter: true, value: 'abc', onChange, defaultOpen: true });
        search('newValue');
        await userEvent.click(getOptions()[0]);
        await waitFor(() => expect(onChange).toHaveBeenCalledWith('newValue'));
    });

    it('autoClearSearchValue 为 false 时受控 value 变化', () => {
        const props = { filter: true, autoClearSearchValue: false, value: 'abc', defaultOpen: true };
        const { rerender } = renderSelect(props);
        search('test');
        rerender({ ...props, value: 'hotsoon' });
        expect(getTriggerInput()).toHaveValue('test');
    });

    it('_updateSingle 配合 onChangeWithObject 且无匹配项', () => {
        renderSelect({
            onChangeWithObject: true,
            value: { value: 'notExist', label: 'Not Exist' },
            optionList: defaultList,
        });
        expect(getSelectionText()).toHaveTextContent(/^Not Exist$/);
    });

    it('_updateMultiple 处理不在 optionList 但在 selections 中的 value', () => {
        const props = { multiple: true, defaultValue: ['abc', 'notExist'], optionList: defaultList };
        const { rerender } = renderSelect(props);
        expect(getTagTexts()).toEqual(['Abc', 'notExist']);
        rerender({ ...props, optionList: [{ value: 'new1', label: 'New1' }] });
        expect(getTagTexts()).toEqual(['Abc', 'notExist']);
    });

    it('_updateMultiple 配合 onChangeWithObject', () => {
        renderSelect({
            multiple: true,
            onChangeWithObject: true,
            value: [
                { value: 'abc', label: 'Abc' },
                { value: 'notExist', label: 'Not Exist' },
            ],
            optionList: defaultList,
        });
        expect(getTagTexts()).toEqual(['Abc', 'Not Exist']);
    });

    it('getTagItem 配合 renderSelectedItem 且 isRenderInTag 为 false', async () => {
        const renderSelectedItem = (optionNode, { onClose }) => ({
            isRenderInTag: false,
            content: (
                <span className="custom-tag-content" onClick={onClose}>
                    {optionNode.label}
                </span>
            ),
        });
        renderSelect({
            multiple: true,
            defaultValue: ['abc', 'hotsoon'],
            maxTagCount: 3,
            showRestTagsPopover: true,
            renderSelectedItem,
        });
        const getItems = () => Array.from(document.querySelectorAll('.custom-tag-content')).map((n) => n.textContent);
        expect(getItems()).toEqual(['Abc', 'Hotsoon']);
        await userEvent.click(screen.getByText('Abc'));
        expect(getItems()).toEqual(['Hotsoon']);
    });

    it('禁用时 handleTriggerClick', async () => {
        const onFocus = vi.fn<NonNullable<SelectProps['onFocus']>>();
        renderSelect({ disabled: true, onFocus });
        await userEvent.click(getTrigger());
        expect(getOptionList()).toBeNull();
        expect(onFocus).not.toHaveBeenCalled();
    });

    it('filter 与 clickToHide 时 handleTriggerClick', async () => {
        renderSelect({ filter: true, clickToHide: true });
        await userEvent.click(getTrigger());
        expect(getOptionList()).not.toBeNull();
        await userEvent.click(getTrigger());
        await expectClosed();
    });

    it('清除按钮是有名称的原生按钮，按 Enter 与 Space 不会打开下拉', async () => {
        for (const key of ['{Enter}', ' ']) {
            const onClear = vi.fn<NonNullable<SelectProps['onClear']>>();
            const { unmount } = renderSelect({ showClear: true, defaultValue: 'abc', onClear });
            await userEvent.tab();
            expect(getTrigger()).toHaveFocus();
            await userEvent.tab();
            const clear = screen.getByRole('button', { name: zh_CN.Select.clear });
            expect(clear).toHaveFocus();
            expect(clear).toHaveAttribute('type', 'button');
            await userEvent.keyboard(key);
            expect(onClear).toHaveBeenCalledTimes(1);
            expect(getSelectionText()).toHaveTextContent(/^$/);
            expect(screen.queryByRole('button', { name: zh_CN.Select.clear })).toBeNull();
            expect(getTrigger()).toHaveFocus();
            expect(getOptionList()).toBeNull();
            unmount();
        }
    });

    it('焦点在清除按钮上时 ArrowDown 不打开下拉', async () => {
        renderSelect({ showClear: true, defaultValue: 'abc' });
        await userEvent.tab();
        await userEvent.tab();
        expect(screen.getByRole('button', { name: zh_CN.Select.clear })).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(getOptionList()).toBeNull();
    });

    it('没有 value、禁用或未设置 showClear 时不渲染清除按钮', () => {
        const { unmount } = renderSelect({ showClear: true });
        expect(screen.queryByRole('button', { name: zh_CN.Select.clear })).toBeNull();
        unmount();
        const disabled = renderSelect({ showClear: true, defaultValue: 'abc', disabled: true });
        expect(screen.queryByRole('button', { name: zh_CN.Select.clear })).toBeNull();
        disabled.unmount();
        renderSelect({ defaultValue: 'abc' });
        expect(screen.queryByRole('button', { name: zh_CN.Select.clear })).toBeNull();
    });

    it('handleInputFocus', async () => {
        renderSelect({ filter: true });
        await userEvent.click(getTrigger());
        const input = getTriggerInput();
        expect(input).toHaveFocus();
        expect(getRoot()).toHaveClass(`${prefixCls}-focus`);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-focus`)).not.toBeNull();
    });

    it('multiple 配合 max 与 onExceed', async () => {
        const onExceed = vi.fn<NonNullable<SelectProps['onExceed']>>();
        renderSelect({ multiple: true, max: 1, defaultValue: ['abc'], onExceed, defaultOpen: true });
        await userEvent.click(getOptions()[1]);
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(getTagTexts()).toEqual(['Abc']);
    });

    it('受控且 filter 时 _handleSingleSelect', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ filter: true, value: 'abc', onChange });
        await userEvent.click(getTrigger());
        await userEvent.click(getOptions()[1]);
        await expectClosed();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('hotsoon');
    });

    it('optionList 带 key 时 onSelect 收到原 key', async () => {
        const onSelect = vi.fn<NonNullable<SelectProps['onSelect']>>();
        renderSelect({ onSelect, defaultOpen: true, optionList: [{ value: 'abc', label: 'Abc', key: 'custom-key' }] });
        await userEvent.click(getOptions()[0]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('abc', { value: 'abc', label: 'Abc', key: 'custom-key' });
    });

    it('_diffSelections 处理 undefined 值', () => {
        renderSelect({ optionList: defaultList });
        expect(getSelectionText()).toHaveTextContent(/^$/);
    });

    describe('combobox 语义', () => {
        it('combobox 由 aria-label 或 aria-labelledby 命名，否则回退到语言包', () => {
            const { rerender } = render(<Select defaultValue="a" optionList={[{ value: 'a', label: 'A' }]} />);
            expect(screen.getByRole('combobox', { name: zh_CN.Select.label })).toHaveTextContent('A');
            rerender(<Select aria-label="City" optionList={[{ value: 'a', label: 'A' }]} />);
            expect(screen.getByRole('combobox', { name: 'City' })).toBeInTheDocument();
            rerender(
                <>
                    <span id="city-label">Home city</span>
                    <Select aria-labelledby="city-label" optionList={[{ value: 'a', label: 'A' }]} />
                </>
            );
            expect(screen.getByRole('combobox', { name: 'Home city' })).not.toHaveAttribute('aria-label');
        });

        it('关闭状态的 combobox 按 ArrowDown 与 ArrowUp 打开', async () => {
            render(<Select optionList={defaultList} />);
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

        it('仅在打开时 aria-controls 指向已渲染的 listbox', async () => {
            render(<Select optionList={defaultList} />);
            const combobox = screen.getByRole('combobox');
            expect(combobox).not.toHaveAttribute('aria-controls');
            await userEvent.click(combobox);
            expect(combobox).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
            await userEvent.keyboard('{Escape}');
            expect(combobox).not.toHaveAttribute('aria-controls');
        });

        it('仅在打开时 aria-activedescendant 指向已渲染的选项', async () => {
            render(<Select defaultActiveFirstOption optionList={defaultList} />);
            const combobox = screen.getByRole('combobox');
            expect(combobox).not.toHaveAttribute('aria-activedescendant');
            await userEvent.click(combobox);
            const options = await screen.findAllByRole('option');
            expect(combobox).toHaveAttribute('aria-activedescendant', options[0].id);
            await userEvent.keyboard('{ArrowDown}');
            expect(combobox).toHaveAttribute('aria-activedescendant', options[1].id);
            await userEvent.keyboard('{Escape}');
            expect(combobox).not.toHaveAttribute('aria-activedescendant');
        });

        it('创建选项与自定义选项都有 id，触发器可以指向它们', async () => {
            const renderOptionItem = ({ id, label, onClick, onMouseEnter, selected, style }: optionRenderProps) => (
                <div id={id} style={style} aria-selected={selected} role="option" onClick={onClick} onMouseEnter={onMouseEnter}>
                    {label}
                </div>
            );
            const { unmount } = render(<Select allowCreate defaultOpen filter optionList={[{ value: 'a', label: 'A' }]} />);
            const input = screen.getByRole('combobox');
            await userEvent.type(input, 'new{ArrowDown}');
            const created = screen.getByRole('option', { name: /new/ });
            expect(created.id).not.toBe('');
            expect(input).toHaveAttribute('aria-activedescendant', created.id);

            unmount();
            render(<Select defaultOpen optionList={[{ value: 'a', label: 'A' }]} renderOptionItem={renderOptionItem} />);
            act(() => {
                screen.getByRole('combobox').focus();
            });
            await userEvent.keyboard('{ArrowDown}');
            const custom = screen.getByRole('option', { name: 'A' });
            expect(custom.id).not.toBe('');
            expect(screen.getByRole('combobox')).toHaveAttribute('aria-activedescendant', custom.id);
        });

        it('触发器中的搜索输入框作为 combobox（ARIA 1.2）', async () => {
            const { unmount } = render(<Select defaultValue="a" filter optionList={[{ value: 'a', label: 'A' }]} />);
            expect(screen.getByRole('combobox', { name: zh_CN.Select.label })).toHaveTextContent('A');
            await userEvent.click(screen.getByRole('combobox'));
            const input = screen.getByRole('combobox', { name: zh_CN.Select.label });
            expect(input.tagName).toBe('INPUT');
            expect(input).toHaveFocus();
            expect(input).toHaveAttribute('aria-autocomplete', 'list');
            expect(input).toHaveAttribute('aria-expanded', 'true');
            expect(input).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
            // the empty input has no value of its own, so the selected text is its description until the user types
            expect(input).toHaveAccessibleDescription('A');
            await userEvent.type(input, 'x');
            expect(input).not.toHaveAccessibleDescription();
            expect(getRoot()).toHaveAttribute('tabindex', '-1');
            expect(getRoot()).not.toHaveAttribute('role');
            expect(getRoot()).not.toHaveAttribute('aria-expanded');
            expect(getRoot()).not.toHaveAttribute('aria-describedby');
            expect(screen.queryByRole('dialog')).toBeNull();
            unmount();

            render(<Select multiple filter optionList={[{ value: 'a', label: 'A' }]} />);
            expect(screen.getByRole('combobox').tagName).toBe('INPUT');
            expect(getRoot()).toHaveAttribute('tabindex', '-1');
        });

        it('搜索输入框位于下拉中时，触发器仍是可访问的 combobox', async () => {
            render(<Select multiple filter optionList={[{ value: 'a', label: 'A' }]} searchPosition="dropdown" />);
            const combobox = screen.getByRole('combobox');
            expect(combobox).toBe(getRoot());
            expect(combobox).toHaveAttribute('tabindex', '0');
            await userEvent.click(combobox);
            const search = await screen.findByRole('textbox', { name: zh_CN.Select.label });
            expect(search).toHaveAttribute('aria-autocomplete', 'list');
            expect(search).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
        });
    });

    it('filter 时 group 与 option 的 label 匹配', () => {
        renderSelect({
            filter: true,
            defaultOpen: true,
            children: [
                <Select.OptGroup key={1} label="Fruits">
                    <Select.Option value="apple">Apple</Select.Option>
                    <Select.Option value="banana">Banana</Select.Option>
                </Select.OptGroup>,
            ],
        });
        search('Apple');
        expect(getOptionTexts()).toEqual(['Apple']);
    });

    it('renderNTag 配合 popover', async () => {
        renderSelect({
            multiple: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'],
            maxTagCount: 2,
            showRestTagsPopover: true,
            restTagsPopoverProps: { position: 'top' },
        });
        await userEvent.hover(screen.getByText('+2'));
        await waitFor(() => expect(screen.getByText('Pipixia')).toBeInTheDocument());
        expect(screen.getByText('Pipixia').closest(`.${BASE_CLASS_PREFIX}-popover-wrapper`)).toHaveAttribute('x-placement', 'top');
    });

    it('maxTagCount 为 0 时 updateOverflowItemCount', () => {
        renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon'], maxTagCount: 0 });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
    });

    it('renderOptionItem 的 onMouseEnter 回调', async () => {
        let mouseEnterCalled = false;
        const renderOptionItem = ({ label, onClick, onMouseEnter, style, className, focused }) => (
            <div
                className={`custom-option ${className} ${focused ? 'focused' : ''}`}
                style={style}
                onClick={onClick}
                onMouseEnter={(e) => {
                    mouseEnterCalled = true;
                    onMouseEnter(e);
                }}
            >
                {label}
            </div>
        );
        renderSelect({ defaultOpen: true, optionList: defaultList, renderOptionItem });
        await userEvent.hover(screen.getByText('Pipixia'));
        expect(mouseEnterCalled).toBe(true);
        expect(screen.getByText('Pipixia')).toHaveClass('focused');
        expect(screen.getByText('Abc')).not.toHaveClass('focused');
    });

    it('renderOptionItem 时 updateScrollTop', () => {
        const renderOptionItem = ({ label, onClick, onMouseEnter, style, className, focused }) => (
            <div className={`custom-option ${className} ${focused ? 'focused' : ''}`} style={style} onClick={onClick} onMouseEnter={onMouseEnter}>
                {label}
            </div>
        );
        renderSelect({ defaultOpen: true, optionList: defaultList, renderOptionItem });
        keyDown('ArrowDown');
        expect(screen.getByText('Hotsoon')).toHaveClass('focused');
    });

    it('不传 index 时 updateScrollTop', () => {
        renderSelect({ defaultOpen: true, defaultValue: 'hotsoon', optionList: defaultList });
        expect(document.querySelector(`.${prefixCls}-option-selected`)).toHaveTextContent(/^Hotsoon$/);
        expect(document.querySelector(`.${prefixCls}-option-selected`)).toHaveAttribute('aria-selected', 'true');
    });

    it('focusTrigger 的错误处理', async () => {
        renderSelect({ defaultOpen: true });
        keyDown('Escape');
        await expectClosed();
        expect(getTrigger()).toHaveFocus();
    });

    it('面板打开时 handleInputBlur', () => {
        renderSelect({ filter: true, defaultOpen: true });
        fireEvent.blur(getTriggerInput());
        expect(getTriggerInput()).not.toBeNull();
        expect(getOptionList()).not.toBeNull();
    });

    it('isFocusInContainer 为 true 时 handleTriggerBlur', () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ defaultOpen: true, innerBottomSlot: <button className="slot-btn">Button</button>, onBlur });
        keyDown('Tab');
        expect(screen.getByRole('button', { name: 'Button' })).toHaveFocus();
        fireEvent.blur(getTrigger());
        expect(onBlur).not.toHaveBeenCalled();
        expect(getOptionList()).not.toBeNull();
    });

    it('第一个元素上的 _handlePanelOpenShiftTabKeyDown', () => {
        renderSelect({ defaultOpen: true, innerBottomSlot: <button className="slot-btn">Button</button> });
        keyDown('Tab');
        const button = screen.getByRole('button', { name: 'Button' });
        expect(button).toHaveFocus();
        keyDown('Tab', { shiftKey: true }, button);
        expect(getTrigger()).toHaveFocus();
        expect(getOptionList()).not.toBeNull();
    });

    it('输入为空时 _createOptionByInput', () => {
        renderSelect({ allowCreate: true, filter: true, defaultOpen: true });
        search('new');
        expect(getOptions()).toHaveLength(1);
        search('');
        expect(getOptionTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz']);
    });

    it('下拉中按 Space 与 Enter 一样选中高亮项并关闭', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ defaultOpen: true, onChange });
        expect(getFocusedOption()).toHaveTextContent(/^Abc$/);
        keyDown(' ');
        expect(onChange).toHaveBeenCalledWith('abc');
        await expectClosed();
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
    });

    it('children 含 null 选项', () => {
        renderSelect({
            defaultOpen: true,
            children: [
                null,
                <Select.Option key="a" value="a">
                    A
                </Select.Option>,
                undefined,
                <Select.Option key="b" value="b">
                    B
                </Select.Option>,
            ],
        });
        expect(getOptionTexts()).toEqual(['A', 'B']);
    });

    it('多选模式下 value 不是数组时给出开发期警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        renderSelect({ multiple: true, value: 'abc' });
        expect(warn).toHaveBeenCalledWith('Warning: [Semi Select] defaultValue/value should be array type in multiple mode');
        warn.mockRestore();
    });

    it('children 含无效元素', () => {
        renderSelect({
            defaultOpen: true,
            children: [
                <Select.Option key="a" value="a">
                    A
                </Select.Option>,
                <div key="invalid">Invalid</div>,
            ],
        });
        expect(getOptionList()).not.toBeNull();
        expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('option group 含多个 children 与 key', () => {
        renderSelect({
            defaultOpen: true,
            children: [
                <Select.OptGroup key={1} label="Group1">
                    <Select.Option key="opt-a" value="a-1">
                        a-1
                    </Select.Option>
                    <Select.Option key="opt-b" value="a-2">
                        a-2
                    </Select.Option>
                </Select.OptGroup>,
            ],
        });
        expect(getOptionTexts()).toEqual(['a-1', 'a-2']);
    });

    it('销毁时清理', () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        const { unmount } = renderSelect({ defaultOpen: true, onBlur });
        expect(getOptionList()).not.toBeNull();
        unmount();
        expect(getOptionList()).toBeNull();
        fireEvent.mouseDown(document.body);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('maxTagCount 配合 OverflowList 的 onOverflow 回调', () => {
        const props = {
            multiple: true,
            maxTagCount: 2,
            showRestTagsPopover: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia'],
            optionList: defaultList,
            style: { width: 200 },
        };
        const { rerender } = renderSelect(props);
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+1']);
        rerender({ ...props, style: { width: 100 } });
        expect(getTrigger()).toHaveStyle({ width: '100px' });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+1']);
    });

    it('通过 innerTopSlot 调用 handleSlotMouseEnter', async () => {
        renderSelect({ defaultOpen: true, innerTopSlot: <div className="test-inner-top-slot">Top Slot</div> });
        expect(document.querySelector('.test-inner-top-slot')).not.toBeNull();
        expect(getFocusedOption()).not.toBeNull();
        await userEvent.hover(document.querySelector(`.${prefixCls}-option-list-inner-top-slot`));
        expect(getFocusedOption()).toBeNull();
    });

    it('通过 outerTopSlot 调用 handleSlotMouseEnter', async () => {
        renderSelect({ defaultOpen: true, outerTopSlot: <div className="test-outer-top-slot">Outer Top Slot</div> });
        expect(document.querySelector('.test-outer-top-slot')).not.toBeNull();
        expect(getFocusedOption()).not.toBeNull();
        await userEvent.hover(document.querySelector(`.${prefixCls}-option-list-outer-top-slot`));
        expect(getFocusedOption()).toBeNull();
    });

    it('通过 outerBottomSlot 调用 handleSlotMouseEnter', async () => {
        renderSelect({
            defaultOpen: true,
            outerBottomSlot: <div className="test-outer-bottom-slot">Outer Bottom Slot</div>,
        });
        expect(document.querySelector('.test-outer-bottom-slot')).not.toBeNull();
        expect(getFocusedOption()).not.toBeNull();
        await userEvent.hover(document.querySelector(`.${prefixCls}-option-list-outer-bottom-slot`));
        expect(getFocusedOption()).toBeNull();
    });

    it('renderCollapsedTags 配合 overflowRenderer', () => {
        renderSelect({
            multiple: true,
            maxTagCount: 1,
            showRestTagsPopover: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'],
            optionList: defaultList,
            style: { width: 150 },
        });
        expect(getTagTexts()).toEqual(['Abc', '+3']);
    });

    it('ellipsisTrigger 配合 renderCollapsedTags', () => {
        renderSelect({
            multiple: true,
            ellipsisTrigger: true,
            maxTagCount: 2,
            defaultValue: ['abc', 'hotsoon', 'pipixia'],
            optionList: defaultList,
            style: { width: 200 },
        });
        expect(document.querySelector(`.${prefixCls}-content-wrapper-collapse`)).not.toBeNull();
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+1']);
    });

    it('selections 更新时 ellipsisTrigger 保持 OverflowList 挂载', async () => {
        renderSelect({
            multiple: true,
            ellipsisTrigger: true,
            maxTagCount: 2,
            defaultValue: ['abc', 'hotsoon', 'pipixia'],
            optionList: defaultList,
            style: { width: 200 },
        });
        const overflowList = document.querySelector(`.${prefixCls}-content-wrapper-collapse`).firstElementChild;
        expect(overflowList).not.toBeNull();
        await userEvent.click(getTrigger());
        await userEvent.click(getOptionByText('TopBuzz'));
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+2']);
        expect(document.querySelector(`.${prefixCls}-content-wrapper-collapse`).firstElementChild).toBe(overflowList);
    });

    it('ellipsisTrigger 配合 handleOverflow 回调', () => {
        const props = {
            multiple: true,
            ellipsisTrigger: true,
            maxTagCount: 2,
            defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'],
            optionList: defaultList,
            style: { width: 100 },
        };
        const { rerender } = renderSelect(props);
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+2']);
        rerender({ ...props, defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao', 'xigua'] });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+2']);
    });

    it('配合 overFlowCount 时 updateOverflowItemCount', async () => {
        renderSelect({
            multiple: true,
            ellipsisTrigger: true,
            maxTagCount: 2,
            defaultValue: ['abc', 'hotsoon'],
            optionList: defaultList,
        });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
        await userEvent.click(getTrigger());
        await userEvent.click(getOptionByText('Pipixia'));
        expect(document.querySelector(`.${prefixCls}-content-wrapper-collapse-tag`)).toHaveTextContent(/^\+1$/);
    });

    it('selectionLength 不超过 maxTagCount 且无 overFlowCount 时 updateOverflowItemCount', () => {
        renderSelect({
            multiple: true,
            ellipsisTrigger: true,
            maxTagCount: 3,
            defaultValue: ['abc', 'hotsoon'],
            optionList: defaultList,
        });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
        expect(document.querySelector(`.${prefixCls}-content-wrapper-collapse-tag`)).toBeNull();
    });

    it('所有 selections 都禁用时 handleBackspaceKeyDown', async () => {
        renderSelect({
            multiple: true,
            filter: true,
            defaultValue: ['disabled1', 'disabled2'],
            optionList: [
                { value: 'disabled1', label: 'Disabled 1', disabled: true },
                { value: 'disabled2', label: 'Disabled 2', disabled: true },
                { value: 'normal', label: 'Normal' },
            ],
        });
        await userEvent.click(getTrigger());
        keyDown('Backspace', {}, getTriggerInput());
        expect(getTagTexts()).toEqual(['Disabled 1', 'Disabled 2']);
    });

    it('禁用与未禁用 selections 混合时 handleBackspaceKeyDown', async () => {
        renderSelect({
            multiple: true,
            filter: true,
            defaultValue: ['disabled1', 'normal'],
            optionList: [
                { value: 'disabled1', label: 'Disabled 1', disabled: true },
                { value: 'normal', label: 'Normal' },
            ],
        });
        await userEvent.click(getTrigger());
        keyDown('Backspace', {}, getTriggerInput());
        expect(getTagTexts()).toEqual(['Disabled 1']);
    });

    it('无变化时 _notifyChange', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ multiple: true, defaultValue: ['abc'], optionList: defaultList, onChange });
        await userEvent.click(getTrigger());
        keyDown('Escape');
        await expectClosed();
        expect(onChange).not.toHaveBeenCalled();
        expect(getTagTexts()).toEqual(['Abc']);
    });

    it('未打开时 _handleEnterKeyDown', async () => {
        renderSelect({ optionList: defaultList });
        await userEvent.tab();
        expect(getTrigger()).toHaveFocus();
        keyDown('Enter');
        expect(getOptionList()).not.toBeNull();
    });

    it('focusIndex 超出范围时 _handleEnterKeyDown', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const props = { defaultOpen: true, defaultActiveFirstOption: false, optionList: defaultList, onChange };
        const { rerender } = renderSelect(props);
        await userEvent.hover(getOptions()[3]);
        rerender({ ...props, optionList: defaultList.slice(0, 1) });
        expect(getOptionTexts()).toEqual(['Abc']);
        keyDown('Enter');
        expect(onChange).not.toHaveBeenCalled();
        expect(getOptionList()).not.toBeNull();
    });

    it('输入关键字后焦点回到第一个匹配项，Enter 选中它', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ defaultOpen: true, filter: true, optionList: defaultList, onChange });
        await userEvent.hover(getOptions()[3]);
        search('p');
        expect(getOptionTexts()).toEqual(['Pipixia', 'TopBuzz']);
        expect(getFocusedOption()).toHaveTextContent('Pipixia');
        keyDown('Enter', {}, getTriggerInput());
        expect(onChange).toHaveBeenCalledWith('pipixia');
    });

    it('defaultActiveFirstOption 为 false 时，输入关键字后不保留旧的焦点项', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({
            defaultOpen: true,
            filter: true,
            defaultActiveFirstOption: false,
            optionList: defaultList,
            onChange,
        });
        await userEvent.hover(getOptions()[0]);
        search('p');
        expect(getFocusedOption()).toBeNull();
        keyDown('Enter', {}, getTriggerInput());
        expect(onChange).not.toHaveBeenCalled();
    });

    it('selections 相同时 _notifyChange', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ defaultValue: 'abc', optionList: defaultList, onChange });
        await userEvent.click(getTrigger());
        await userEvent.click(getOptionByText('Abc'));
        await expectClosed();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('面板关闭时按 Tab 键', async () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ optionList: defaultList, onBlur });
        await userEvent.tab();
        expect(getTrigger()).toHaveFocus();
        await userEvent.tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getOptionList()).toBeNull();
    });

    it('面板关闭时按 Tab 键触发 blur', async () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ optionList: defaultList, onBlur, clickToHide: true });
        await userEvent.click(getTrigger());
        await userEvent.click(getTrigger());
        await expectClosed();
        expect(onBlur).not.toHaveBeenCalled();
        await userEvent.tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('不在容器内时 _handlePanelOpenShiftTabKeyDown', async () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({
            defaultOpen: true,
            filter: true,
            optionList: defaultList,
            innerBottomSlot: <button>Button</button>,
            onBlur,
        });
        act(() => {
            getTriggerInput().focus();
        });
        await userEvent.tab({ shift: true });
        await expectClosed();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('打开且 focusIndex 为 -1 时 _handleEnterKeyDown', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ defaultOpen: true, optionList: defaultList, innerTopSlot: <div>Slot</div>, onChange });
        await userEvent.hover(screen.getByText('Slot'));
        expect(getFocusedOption()).toBeNull();
        keyDown('Enter');
        await expectClosed();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('打开的列表中按 Tab 关闭列表，焦点仍在组件内时不触发 onBlur', async () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ defaultOpen: true, filter: true, optionList: defaultList, onBlur });
        keyDown('Tab', {}, document.querySelector(`.${prefixCls}-option-list-wrapper`));
        await expectClosed();
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('handleContainerKeyDown 处理其他键', () => {
        renderSelect({ defaultOpen: true, filter: true, optionList: defaultList });
        keyDown(' ', {}, document.querySelector(`.${prefixCls}-option-list-wrapper`));
        expect(getOptionList()).not.toBeNull();
    });

    it('renderNTag 配合 showRestTagsPopover 与 restTags', () => {
        renderSelect({
            multiple: true,
            maxTagCount: 1,
            showRestTagsPopover: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia'],
            optionList: defaultList,
        });
        expect(getTagTexts()).toEqual(['Abc', '+2']);
    });

    it('不同 overflowItemCount 时 handleOverflow', async () => {
        renderSelect({
            multiple: true,
            ellipsisTrigger: true,
            maxTagCount: 2,
            defaultValue: ['abc', 'hotsoon'],
            optionList: defaultList,
        });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
        await userEvent.click(getTrigger());
        await userEvent.click(getOptionByText('Pipixia'));
        await userEvent.click(getOptionByText('TopBuzz'));
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+2']);
    });

    it('fix #1584: defaultValue 为 null 时，单选配合 renderSelectedItem 显示 placeholder', () => {
        const renderSelectedItem = vi.fn<RenderSingleSelectedItemFn>((item) => <div className="custom-selected">{item.label}</div>);
        const { unmount } = renderSelect({ defaultValue: null, placeholder: '请选择', renderSelectedItem });
        expect(getSelectionText()).toHaveTextContent(/^请选择$/);
        expect(getSelectionText()).toHaveClass(`${prefixCls}-selection-placeholder`);
        expect(document.querySelector('.custom-selected')).toBeNull();
        unmount();

        renderSelect({ defaultValue: undefined, placeholder: '请选择', renderSelectedItem });
        expect(getSelectionText()).toHaveTextContent(/^请选择$/);
        expect(document.querySelector('.custom-selected')).toBeNull();
    });

    it('fix #1856: virtualize 配合 allowCreate 时，行样式传给 renderCreateItem', () => {
        const renderCreateItem = vi.fn<NonNullable<SelectProps['renderCreateItem']>>((inputValue, _isFocused, style) => (
            <div className="custom-create" style={{ padding: '6px 12px', ...style }}>
                输入 {inputValue}
            </div>
        ));
        renderSelect({
            allowCreate: true,
            filter: true,
            defaultOpen: true,
            virtualize: { height: 270, width: '100%', itemSize: 36 },
            optionList: [{ value: 500333, label: '500333 抖音直播间-哈哈哈' }],
            renderCreateItem,
        });
        search('500');
        // without the row style the create item would overlap the matching option in the first virtual row
        expect(renderCreateItem.mock.lastCall[2]).toEqual(expect.objectContaining({ position: 'absolute', top: 36 }));
        expect(document.querySelector('.custom-create')).toHaveTextContent(/^输入 500$/);
        expect(document.querySelector('.custom-create')).toHaveStyle({
            position: 'absolute',
            top: '36px',
            height: '36px',
        });
        expect(getOptionByText('500333 抖音直播间-哈哈哈')).toHaveStyle({ top: '0px' });
    });

    it('fix #2465: 从插槽通过 ref 关闭后再点击外部，移除焦点样式', async () => {
        for (const multiple of [false, true]) {
            const ref = createRef<SelectHandle>();
            const { unmount } = renderSelect({
                ref,
                multiple,
                outerBottomSlot: <button onClick={() => ref.current.close()}>close</button>,
            });
            await userEvent.click(getTrigger());
            await userEvent.click(screen.getByRole('button', { name: 'close' }));
            await expectClosed();
            expect(getTrigger()).toHaveClass(`${prefixCls}-focus`);
            await userEvent.click(document.body);
            expect(getTrigger()).not.toHaveClass(`${prefixCls}-focus`);
            expect(getTrigger()).not.toHaveFocus();
            unmount();
        }
    });

    it('fix #2853: label 为 ReactNode 的 OptGroup 在过滤时保持 key 唯一', async () => {
        const consoleError = vi.spyOn(console, 'error');
        renderSelect({
            filter: true,
            children: [
                <Select.OptGroup key="a" label={<div>a</div>}>
                    <Select.Option key="a-1" value="a-1">
                        a-1
                    </Select.Option>
                    <Select.Option key="a-2" value="a-2">
                        a-2
                    </Select.Option>
                </Select.OptGroup>,
                <Select.OptGroup key="b" label={<div>b</div>}>
                    <Select.Option value="b-1">b-1</Select.Option>
                    <Select.Option value="b-2">b-2</Select.Option>
                </Select.OptGroup>,
                <Select.OptGroup key="c" label={<div>c</div>}>
                    <Select.Option value="c-1">c-1</Select.Option>
                </Select.OptGroup>,
            ],
        });
        await userEvent.click(getTrigger());
        const groupTexts = () => Array.from(document.querySelectorAll(`.${prefixCls}-group`)).map((g) => g.textContent);
        expect(groupTexts()).toEqual(['a', 'b', 'c']);
        await userEvent.type(getTriggerInput(), 'b');
        expect(groupTexts()).toEqual(['b']);
        expect(getOptionTexts()).toEqual(['b-1', 'b-2']);
        await userEvent.clear(getTriggerInput());
        expect(groupTexts()).toEqual(['a', 'b', 'c']);
        expect(getOptionTexts()).toEqual(['a-1', 'a-2', 'b-1', 'b-2', 'c-1']);
        const duplicateKeyWarnings = consoleError.mock.calls.filter(([message]) => String(message).includes('same key'));
        consoleError.mockRestore();
        expect(duplicateKeyWarnings).toEqual([]);
    });

    it('生成的 id 即使随机部分以数字开头，也是合法的 CSS id 选择器', async () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
        try {
            renderSelect();
            await userEvent.click(getTrigger());
            const trigger = getTrigger();
            expect(document.querySelector(`#${trigger.id}`)).toBe(trigger);
            expect(document.querySelector(`#${trigger.getAttribute('aria-controls')}`)).toBe(getOptionList());
        } finally {
            vi.restoreAllMocks();
        }
    });
});

describe('Select 行为基线', () => {
    it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Select: { size: 'small', placeholder: 'global' } };
        try {
            renderSelect();
            expect(getTrigger()).toHaveClass(`${prefixCls}-small`);
            expect(getSelectionText()).toHaveTextContent(/^global$/);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('data-* 落在根元素，id 为触发器及其选项命名', async () => {
        const { unmount } = renderSelect({ 'data-testid': 'sel', id: 'my-select' });
        const trigger = getTrigger();
        expect(screen.getByTestId('sel')).toBe(trigger);
        expect(trigger.id).toBe('my-select');
        await userEvent.click(trigger);
        expect(getOptions()[0].id).toBe('my-select-option-0');
        unmount();
        renderSelect({ 'data-testid': 'sel', multiple: true, filter: true });
        expect(getTrigger().tagName).toBe('INPUT');
        expect(screen.getByTestId('sel')).toBe(getRoot());
    });

    it('combobox 控制 listbox，并指向聚焦的选项', async () => {
        renderSelect();
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
        expect(getTrigger()).toHaveAttribute('aria-haspopup', 'listbox');
        await userEvent.click(getTrigger());
        const trigger = getTrigger();
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(document.getElementById(trigger.getAttribute('aria-controls'))).toBe(getOptionList());
        expect(trigger.getAttribute('aria-activedescendant')).toBe(getOptions()[0].id);
        expect(getOptionList()).toHaveAttribute('role', 'listbox');
    });

    it('ref.rePosition 让下拉层跟随移动后的触发器', () => {
        const ref = createRef<SelectHandle>();
        renderSelect({ ref });
        act(() => ref.current.open());
        const popup = screen.getByRole('listbox').closest<HTMLElement>('[popover]');
        expect(popup?.style.left).toBe('0px');
        // the trigger moved without scrolling or resizing
        const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 50, 80, 20));
        onTestFinished(() => rect.mockRestore());
        act(() => ref.current.rePosition());
        expect(popup?.style.left).toBe('100px');
    });

    it('每个已文档化的 ref 方法都可调用', async () => {
        const ref = createRef<SelectHandle>();
        const onSearch = vi.fn<NonNullable<SelectProps['onSearch']>>();
        renderSelect({ ref, filter: true, multiple: true, onSearch });
        act(() => ref.current.open());
        expect(getOptionList()).not.toBeNull();
        act(() => ref.current.search('hot', {}));
        expect(getTriggerInput()).toHaveValue('hot');
        expect(onSearch).toHaveBeenLastCalledWith('hot', {});
        expect(getOptionTexts()).toEqual(['Hotsoon']);
        act(() => ref.current.clearInput());
        expect(getTriggerInput()).toHaveValue('');
        act(() => ref.current.rePosition());
        act(() => ref.current.selectAll());
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz']);
        act(() => ref.current.deselectAll());
        expect(getTagTexts()).toEqual([]);
        act(() => ref.current.close());
        await expectClosed();
        act(() => ref.current.focus());
        expect(getTriggerInput()).toHaveFocus();
    });

    it('清空非受控单选时，先上报 onChange(undefined)，再调用 onClear', async () => {
        const calls = [];
        renderSelect({
            defaultValue: 'abc',
            showClear: true,
            onChange: (v) => calls.push(['change', v]),
            onClear: () => calls.push(['clear']),
        });
        await userEvent.hover(getTrigger());
        await userEvent.click(getClearIcon());
        expect(calls).toEqual([['change', undefined], ['clear']]);
        expect(getSelectionText()).toHaveClass(`${prefixCls}-selection-placeholder`);
    });

    it('通过 triggerRender 删除非受控单选的值时上报变化', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const onDeselect = vi.fn<NonNullable<SelectProps['onDeselect']>>();
        const triggerRender = ({ value, onRemove }) => (
            <div className="custom-trigger">
                {value.map((v) => (
                    <button key={v.value} onClick={() => onRemove(v)}>
                        {v.label}
                    </button>
                ))}
            </div>
        );
        renderSelect({ defaultValue: 'abc', triggerRender, onChange, onDeselect });
        await userEvent.click(screen.getByRole('button', { name: 'Abc' }));
        expect(onDeselect).toHaveBeenCalledWith('abc', expect.objectContaining({ value: 'abc', label: 'Abc' }));
        expect(onChange).toHaveBeenCalledWith(undefined);
        expect(screen.queryByRole('button', { name: 'Abc' })).toBeNull();
    });

    it('打开的可过滤单选上按 Esc，焦点回到触发器且不上报 blur', async () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ filter: true, onBlur });
        await userEvent.click(getTrigger());
        expect(getTriggerInput()).toHaveFocus();
        keyDown('Escape', {}, getTriggerInput());
        await expectClosed();
        expect(getTrigger()).toHaveFocus();
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('从打开的 select 按 Tab 离开时，只上报一次 blur 并关闭', async () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ onBlur });
        await userEvent.click(getTrigger());
        await userEvent.tab();
        await expectClosed();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-focus`);
    });

    it('选择非受控单选的选项时，先上报 onSelect 再上报 onChange', async () => {
        const calls = [];
        renderSelect({
            onSelect: (v) => calls.push(['select', v]),
            onChange: (v) => calls.push(['change', v]),
        });
        await userEvent.click(getTrigger());
        await userEvent.click(getOptionByText('Hotsoon'));
        expect(calls).toEqual([
            ['select', 'hotsoon'],
            ['change', 'hotsoon'],
        ]);
        await expectClosed();
        expect(getSelectionText()).toHaveTextContent(/^Hotsoon$/);
    });

    it('Form.Select 在 blur 时校验，formApi.reset 后恢复为空', async () => {
        let formApi;
        render(
            <Form getFormApi={(api) => (formApi = api)}>
                <Form.Select field="biz" optionList={defaultList} rules={[{ required: true, message: 'biz is required' }]} trigger="blur" {...commonProps} />
            </Form>
        );
        await userEvent.click(getTrigger());
        await userEvent.click(document.body);
        await expectClosed();
        expect(await screen.findByText('biz is required')).not.toBeNull();
        expect(getTrigger()).toHaveAttribute('aria-invalid', 'true');

        await userEvent.click(getTrigger());
        await userEvent.click(getOptionByText('Pipixia'));
        expect(formApi.getValue('biz')).toBe('pipixia');
        await act(() => formApi.reset());
        expect(formApi.getValue('biz')).toBeUndefined();
        expect(getSelectionText()).toHaveClass(`${prefixCls}-selection-placeholder`);
    });

    it('StrictMode 下打开、选择与 blur 各上报一次', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        render(<StrictMode>{selectElement({ onDropdownVisibleChange, onChange, onBlur })}</StrictMode>);
        await userEvent.click(getTrigger());
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
        await userEvent.click(getOptionByText('Hotsoon'));
        expect(onChange.mock.calls).toEqual([['hotsoon']]);
        await expectClosed();
        await userEvent.click(getTrigger());
        await userEvent.click(document.body);
        await expectClosed();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false], [true], [false]]);
    });

    it('StrictMode 下 defaultOpen 的 select 点击外部时关闭', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        render(<StrictMode>{selectElement({ defaultOpen: true, onDropdownVisibleChange })}</StrictMode>);
        expect(getOptionList()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        await expectClosed();
        expect(onDropdownVisibleChange.mock.calls.filter(([v]) => v === false)).toHaveLength(1);
    });

    it('通过 ref 连续打开两次，关闭后不残留外部点击监听', async () => {
        const ref = createRef<SelectHandle>();
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        renderSelect({ ref, onDropdownVisibleChange });
        act(() => ref.current.open());
        act(() => ref.current.open());
        fireEvent.mouseDown(document.body);
        await expectClosed();
        fireEvent.mouseDown(document.body);
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        expect(onDropdownVisibleChange.mock.calls.filter(([v]) => v === false)).toHaveLength(1);
    });

    it('defaultOpen 配合 autoFocus 与 filter 时只打开一次', () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        renderSelect({ defaultOpen: true, autoFocus: true, filter: true, onDropdownVisibleChange });
        expect(getOptionList()).not.toBeNull();
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
    });

    it('过滤不改动 optionList 中的条目', () => {
        const optionList = defaultList.map((option) => ({ ...option }));
        renderSelect({ optionList, filter: true, defaultOpen: true });
        search('abc');
        expect(getOptionTexts()).toEqual(['Abc']);
        expect(optionList).toEqual(defaultList);
    });

    it('传给 filter 的 option 就是 optionList 中的条目，不会被后续搜索改写', () => {
        const seen = [];
        const filter = (input, option) => {
            seen.push(option);
            return option.label.toLowerCase().includes(input);
        };
        const optionList = defaultList.map((option) => ({ ...option }));
        renderSelect({ optionList, filter, defaultOpen: true });
        search('abc');
        search('zzz');
        expect(getOptions()).toHaveLength(0);
        expect(seen.length).toBeGreaterThan(0);
        seen.forEach((option) => expect(optionList).toContain(option));
        expect(optionList).toEqual(defaultList);
    });

    it('用户回调收到的选项不带 Select 的内部键', async () => {
        const internalKeys = (option: object) => Object.keys(option).filter((key) => key.startsWith('_'));
        const seen: object[] = [];
        const record = (option: object) => {
            seen.push(option);
            return true;
        };
        const onChange = vi.fn<(value: object[]) => void>();
        renderSelect({
            multiple: true,
            filter: (_: string, option: object) => record(option),
            onChangeWithObject: true,
            onChange,
            defaultOpen: true,
            children: [
                <Select.OptGroup key="g" label="Group">
                    <Option value="a">A</Option>
                    <Option value="b">B</Option>
                </Select.OptGroup>,
            ],
            renderOptionItem: (props: optionRenderProps) => {
                record(props);
                return (
                    <div id={props.id} aria-selected={props.selected} role="option" onClick={props.onClick}>
                        {props.label}
                    </div>
                );
            },
            renderSelectedItem: (option: object) => {
                record(option);
                return { isRenderInTag: true, content: 'tag' };
            },
        });
        search('A');
        fireEvent.click(screen.getByRole('option', { name: 'A' }));
        await waitFor(() => expect(onChange).toHaveBeenCalled());
        seen.push(...onChange.mock.calls[0][0]);
        expect(seen.length).toBeGreaterThan(2);
        expect(seen.flatMap(internalKeys)).toEqual([]);
    });
});

describe('Select 审计修复', () => {
    it('Tab 进入多选可搜索 Select 的搜索框后，方向键与 Enter 可用', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        render(
            <>
                <button>before</button>
                {selectElement({ multiple: true, filter: true, optionList: defaultList, onChange })}
            </>
        );
        await userEvent.tab();
        await userEvent.tab();
        expect(getTriggerInput()).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(getOptionList()).not.toBeNull();
        await userEvent.keyboard('{ArrowDown}');
        const focusedText = getFocusedOption().textContent;
        await userEvent.keyboard('{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getTagTexts()).toEqual([focusedText]);
    });

    it('onChangeWithObject 单选 value 为 null 时显示占位而不抛错', () => {
        renderSelect({ onChangeWithObject: true, value: null, placeholder: 'pick', optionList: defaultList });
        expect(getSelectionText()).toHaveTextContent('pick');
    });

    it('onChangeWithObject 多选 value 含 null 项时只渲染有效项', () => {
        renderSelect({
            multiple: true,
            onChangeWithObject: true,
            value: [null, { value: 'hotsoon', label: 'Hotsoon' }],
            optionList: defaultList,
        });
        expect(getTagTexts()).toEqual(['Hotsoon']);
    });

    it('onChangeWithObject 多选 value 含 null 项且选项不在列表中时用对象标签', () => {
        renderSelect({
            multiple: true,
            onChangeWithObject: true,
            value: [null, { value: 'ghost', label: 'Ghost' }],
            optionList: defaultList,
        });
        expect(getTagTexts()).toEqual(['Ghost']);
    });

    it('Tab 进入触发器触发一次 onFocus，之后点击打开不再重复触发，Tab 离开触发 onBlur', async () => {
        const onFocus = vi.fn<NonNullable<SelectProps['onFocus']>>();
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ onFocus, onBlur, optionList: defaultList });
        await userEvent.tab();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][0].type).toBe('focus');
        await userEvent.click(getTrigger());
        expect(getOptionList()).not.toBeNull();
        expect(onFocus).toHaveBeenCalledTimes(1);
        await userEvent.keyboard('{Escape}');
        await userEvent.click(getTrigger());
        expect(onFocus).toHaveBeenCalledTimes(1);
        await userEvent.keyboard('{Escape}');
        await expectClosed();
        await userEvent.tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('Tab 进入多选可搜索的搜索框触发一次 onFocus', async () => {
        const onFocus = vi.fn<NonNullable<SelectProps['onFocus']>>();
        renderSelect({ multiple: true, filter: true, onFocus, optionList: defaultList });
        await userEvent.tab();
        expect(getTriggerInput()).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('受控模式下 selectAll 在父组件拒绝变更时不改变标签', () => {
        const ref = createRef<SelectHandle>();
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ ref, multiple: true, value: [], optionList: defaultList, onChange });
        act(() => ref.current.selectAll());
        expect(onChange).toHaveBeenCalledWith(['abc', 'hotsoon', 'pipixia', 'toutiao']);
        expect(getTagTexts()).toEqual([]);
    });

    it('selectAll 配合 onChangeWithObject 时回传的对象不含内部字段', () => {
        const ref = createRef<SelectHandle>();
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ ref, multiple: true, onChangeWithObject: true, optionList: defaultList, onChange });
        act(() => ref.current.selectAll());
        const [value] = onChange.mock.calls[0] as unknown as [Record<string, unknown>[]];
        expect(value.map((item) => Object.keys(item).filter((key) => key.startsWith('_')))).toEqual([[], [], [], []]);
    });

    it('selectAll 跳过禁用项与被搜索隐藏的项，保留范围外已选项', () => {
        const ref = createRef<SelectHandle>();
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const optionList = [...defaultList, { value: 'hot2', label: 'Hot2', disabled: true }];
        renderSelect({ ref, multiple: true, filter: true, defaultValue: ['abc'], optionList, onChange });
        act(() => ref.current.open());
        act(() => ref.current.search('hot'));
        act(() => ref.current.selectAll());
        expect(onChange).toHaveBeenLastCalledWith(['abc', 'hotsoon']);
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
    });

    it('selectAll 超过 max 时触发 onExceed 且不超选', () => {
        const ref = createRef<SelectHandle>();
        const onExceed = vi.fn<NonNullable<SelectProps['onExceed']>>();
        renderSelect({ ref, multiple: true, max: 2, optionList: defaultList, onExceed });
        act(() => ref.current.selectAll());
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(onExceed).toHaveBeenCalledWith(expect.objectContaining({ value: 'pipixia' }));
    });

    it('OptGroup 内含 null、false、嵌套数组时正常解析且 key 不重复', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const cond = false;
        renderSelect({
            defaultOpen: true,
            children: [
                <Select.OptGroup key="g1" label="G1">
                    {cond && <Select.Option value="x">X</Select.Option>}
                    {null}
                    <Select.Option value="a">A</Select.Option>
                    {[
                        <Select.Option key="n1" value="n">
                            N
                        </Select.Option>,
                    ]}
                </Select.OptGroup>,
                <Select.OptGroup key="g2" label="G2">
                    {false}
                    <Select.Option value="b">B</Select.Option>
                </Select.OptGroup>,
                <Select.OptGroup key="g3" label="G3">
                    {null}
                </Select.OptGroup>,
                <Select.OptGroup key="g4" label="G4">
                    <Select.Option value="c">C</Select.Option>
                    {undefined}
                </Select.OptGroup>,
            ],
        });
        expect(getOptionTexts()).toEqual(['A', 'N', 'B', 'C']);
        expect(error.mock.calls.filter(([message]) => String(message).includes('same key'))).toEqual([]);
        error.mockRestore();
    });

    it('点击标签关闭时 onDeselect 收到选项的完整字段', async () => {
        const onDeselect = vi.fn<NonNullable<SelectProps['onDeselect']>>();
        renderSelect({
            multiple: true,
            defaultValue: ['abc'],
            optionList: [{ value: 'abc', label: 'Abc', extra: 'x' }],
            onDeselect,
        });
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
        expect(onDeselect).toHaveBeenCalledWith('abc', expect.objectContaining({ extra: 'x' }));
    });

    it('filter 时 optionList 条目缺 label 不抛错，ReactNode label 不参与匹配', () => {
        renderSelect({
            defaultOpen: true,
            filter: true,
            optionList: [{ value: 'only-value' }, { value: 'node', label: <b>Node</b> }, { value: 'b', label: 'Bee' }],
        });
        search('only');
        expect(getOptions()).toHaveLength(1);
        search('bee');
        expect(getOptionTexts()).toEqual(['Bee']);
    });

    it('首尾选项禁用时方向键仍然循环', async () => {
        renderSelect({
            defaultOpen: true,
            optionList: [
                { value: 'a', label: 'A', disabled: true },
                { value: 'b', label: 'B' },
                { value: 'c', label: 'C' },
                { value: 'd', label: 'D', disabled: true },
            ],
        });
        expect(getFocusedOption()).toHaveTextContent(/^B$/);
        keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent(/^C$/);
        keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent(/^B$/);
        keyDown('ArrowUp');
        expect(getFocusedOption()).toHaveTextContent(/^C$/);
    });
});

describe('Select 审计余量', () => {
    it('选项 children 变化而 value 与 key 不变时，已选文案随之更新', () => {
        const options = (word: string) =>
            [1, 2].map((n) => (
                <Select.Option key={n} value={n}>
                    <span>{`${n} ${word}`}</span>
                </Select.Option>
            ));
        const { rerender } = render(<Select value={1}>{options('条/页')}</Select>);
        expect(getSelectionText()).toHaveTextContent('1 条/页');
        rerender(<Select value={1}>{options('per page')}</Select>);
        expect(getSelectionText()).toHaveTextContent('1 per page');

        const uncontrolled = render(<Select defaultValue={2}>{options('条/页')}</Select>);
        uncontrolled.rerender(<Select defaultValue={2}>{options('per page')}</Select>);
        expect(uncontrolled.container.querySelector(`.${prefixCls}-selection-text`)).toHaveTextContent('2 per page');
    });

    it('多选只有搜索词时点击清除不触发 onChange', () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ multiple: true, filter: true, showClear: true, optionList: defaultList, onChange });
        fireEvent.click(getTrigger());
        search('ab');
        fireEvent.click(document.querySelector(`.${prefixCls}-clear`));
        expect(getTriggerInput()).toHaveValue('');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('多选无选中项时 deselectAll 不触发 onChange，有选中项时触发', () => {
        const ref = createRef<SelectHandle>();
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ ref, multiple: true, optionList: defaultList, onChange });
        act(() => ref.current.deselectAll());
        expect(onChange).not.toHaveBeenCalled();
        act(() => ref.current.selectAll());
        act(() => ref.current.deselectAll());
        expect(onChange).toHaveBeenLastCalledWith([]);
    });

    it('StrictMode 下 defaultOpen 只上报一次打开', () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        render(<StrictMode>{selectElement({ defaultOpen: true, onDropdownVisibleChange })}</StrictMode>);
        expect(getOptionList()).not.toBeNull();
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
    });

    it('搜索中 optionList 变化后仍按关键字过滤', () => {
        const { rerender } = renderSelect({ filter: true, defaultOpen: true, optionList: defaultList });
        search('new1');
        expect(getOptions()).toHaveLength(0);
        const optionList = [
            { value: 'new1', label: 'New1' },
            { value: 'new2', label: 'New2' },
        ];
        rerender({ filter: true, defaultOpen: true, optionList });
        expect(getOptionTexts()).toEqual(['New1']);
    });

    it('受控值在搜索中变化时列表仍按关键字过滤', () => {
        const { rerender } = renderSelect({ filter: true, defaultOpen: true, optionList: defaultList, value: 'abc' });
        search('hot');
        rerender({ filter: true, defaultOpen: true, optionList: defaultList, value: 'pipixia' });
        expect(getOptionTexts()).toEqual(['Hotsoon']);
    });

    it('已关闭时调用 ref.close 不上报可见性变化，也不留下旧的关闭回调', async () => {
        const ref = createRef<SelectHandle>();
        const onSearch = vi.fn<NonNullable<SelectProps['onSearch']>>();
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        renderSelect({ ref, filter: true, optionList: defaultList, onSearch, onDropdownVisibleChange });
        act(() => ref.current.close());
        act(() => ref.current.close());
        act(() => ref.current.close());
        expect(onDropdownVisibleChange).not.toHaveBeenCalled();
        fireEvent.click(getTrigger());
        search('ab');
        keyDown('Escape');
        await expectClosed();
        await waitFor(() => expect(onSearch).toHaveBeenLastCalledWith('', expect.objectContaining({ key: 'Escape' })));
        expect(onSearch.mock.calls.filter(([value]) => value === '')).toHaveLength(1);
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false]]);
    });

    it('size 为 small 时 +N 标签与其余标签同尺寸', () => {
        renderSelect({
            multiple: true,
            size: 'small',
            maxTagCount: 1,
            defaultValue: ['abc', 'hotsoon', 'pipixia'],
            optionList: defaultList,
        });
        const restTag = screen.getByText('+2').closest(`.${BASE_CLASS_PREFIX}-tag`);
        expect(restTag).toHaveClass(`${BASE_CLASS_PREFIX}-tag-small`);
        expect(restTag).not.toHaveClass(`${BASE_CLASS_PREFIX}-tag-large`);
    });

    it('OptGroup 以 group 角色暴露，名称为分组标题', () => {
        renderSelect({
            defaultOpen: true,
            children: [
                <Select.OptGroup key="g1" label="G1">
                    <Select.Option value="a">A</Select.Option>
                    <Select.Option value="b">B</Select.Option>
                </Select.OptGroup>,
                <Select.OptGroup key="g2" label="G2">
                    <Select.Option value="c">C</Select.Option>
                </Select.OptGroup>,
            ],
        });
        expect(screen.getAllByRole('group')).toHaveLength(2);
        const g1 = screen.getByRole('group', { name: 'G1' });
        const g2 = screen.getByRole('group', { name: 'G2' });
        expect(
            within(g1)
                .getAllByRole('option')
                .map((option) => option.textContent)
        ).toEqual(['A', 'B']);
        expect(
            within(g2)
                .getAllByRole('option')
                .map((option) => option.textContent)
        ).toEqual(['C']);
        expect(getOptionList()).toContainElement(g1);
    });
});

describe('Select 回调参数与禁用、键盘细节', () => {
    it('onCreate 与 onSelect 收到的创建项不带内部字段', () => {
        const onCreate = vi.fn<NonNullable<SelectProps['onCreate']>>();
        const onSelect = vi.fn<NonNullable<SelectProps['onSelect']>>();
        renderSelect({ allowCreate: true, filter: true, defaultOpen: true, optionList: defaultList, onCreate, onSelect });
        search('new');
        fireEvent.click(getOptions()[0]);
        expect(onCreate.mock.calls[0][0]).toEqual({ value: 'new', label: 'new' });
        expect(onSelect.mock.calls[0][1]).toEqual({ value: 'new', label: 'new' });
    });

    it('onDeselect 与 onExceed 收到的选项不带内部字段', () => {
        const onDeselect = vi.fn<NonNullable<SelectProps['onDeselect']>>();
        const onExceed = vi.fn<NonNullable<SelectProps['onExceed']>>();
        renderSelect({ multiple: true, max: 1, defaultValue: ['ghost'], defaultOpen: true, optionList: defaultList, onDeselect, onExceed });
        fireEvent.click(getOptionByText('Abc'));
        expect(onExceed.mock.calls[0][0]).toEqual({ value: 'abc', label: 'Abc' });
        fireEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
        expect(onDeselect.mock.calls[0][1]).toEqual({ value: 'ghost', label: 'ghost' });
    });

    it('鼠标点选与 Enter 交给 onSelect 的选项对象相同', () => {
        const onSelect = vi.fn<NonNullable<SelectProps['onSelect']>>();
        const optionList = [
            { value: 'a', label: 'A', className: 'extra' },
            { value: 'b', label: 'B', className: 'extra' },
        ];
        renderSelect({ multiple: true, defaultOpen: true, optionList, onSelect });
        fireEvent.click(getOptionByText('A'));
        keyDown('ArrowDown');
        keyDown('Enter');
        expect(onSelect.mock.calls.map(([, option]) => option)).toEqual([
            { value: 'a', label: 'A', className: 'extra' },
            { value: 'b', label: 'B', className: 'extra' },
        ]);
    });

    it('没有选中值时默认高亮第一个可用选项，跳过禁用项', () => {
        const optionList = [
            { value: 'a', label: 'A', disabled: true },
            { value: 'b', label: 'B' },
        ];
        const { rerender } = renderSelect({ optionList });
        fireEvent.click(getTrigger());
        expect(getFocusedOption()).toHaveTextContent('B');
        rerender({ optionList: [{ value: 'c', label: 'C', disabled: true }, ...optionList] });
        expect(getFocusedOption()).toHaveTextContent('B');
    });

    it('禁用时 defaultOpen 与 autoFocus 不打开下拉，也不通知 onDropdownVisibleChange', () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        renderSelect({ disabled: true, defaultOpen: true, onDropdownVisibleChange });
        renderSelect({ disabled: true, autoFocus: true, filter: true, onDropdownVisibleChange });
        expect(getOptionList()).toBeNull();
        expect(onDropdownVisibleChange).not.toHaveBeenCalled();
    });

    it('焦点在面板插槽内的可聚焦元素上时，Esc 关闭下拉并把焦点交回触发器', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        renderSelect({ optionList: defaultList, innerBottomSlot: <button type="button">slot</button>, onDropdownVisibleChange });
        fireEvent.click(getTrigger());
        const slotButton = screen.getByRole('button', { name: 'slot' });
        slotButton.focus();
        const escape = createEvent.keyDown(slotButton, { key: 'Escape' });
        fireEvent(slotButton, escape);
        expect(escape.defaultPrevented).toBe(true);
        await waitFor(() => expect(getOptionList()).toBeNull());
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        expect(getTrigger()).toHaveFocus();
    });

    it('根元素上使用方的 onClick 照常调用，下拉仍能打开', () => {
        const onClick = vi.fn<NonNullable<SelectProps['onClick']>>();
        renderSelect({ onClick });
        fireEvent.click(getTrigger());
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(getOptionList()).not.toBeNull();
    });

    it('加载中 combobox 不输出 aria-activedescendant', () => {
        renderSelect({ filter: true, multiple: true, defaultOpen: true, loading: true, optionList: defaultList });
        expect(getTrigger()).not.toHaveAttribute('aria-activedescendant');
    });

    it('virtualize 时滚动虚拟列表触发 onListScroll', () => {
        const onListScroll = vi.fn<NonNullable<SelectProps['onListScroll']>>();
        const optionList = Array.from({ length: 300 }, (_, i) => ({ value: i, label: `option-${i}` }));
        renderSelect({ defaultOpen: true, optionList, virtualize: { itemSize: 36, height: 270 }, onListScroll });
        const scroller = getOptionList().firstElementChild as HTMLElement;
        scroller.scrollTop = 360;
        fireEvent.scroll(scroller);
        expect(onListScroll).toHaveBeenCalledTimes(1);
        expect(onListScroll.mock.calls[0][0].target).toBe(scroller);
    });

    it('inputProps 的 onBlur 与 ref 不替换 Select 自己的搜索框处理', () => {
        const onBlur = vi.fn<NonNullable<NonNullable<SelectProps['inputProps']>['onBlur']>>();
        const inputHandle = createRef<InputHandle>();
        renderSelect({ filter: true, showClear: true, defaultValue: 'abc', optionList: defaultList, inputProps: { onBlur, ref: inputHandle } });
        fireEvent.click(screen.getByRole('button', { name: zh_CN.Select.clear }));
        expect(getTriggerInput()).toHaveFocus();
        expect(inputHandle.current?.input).toBe(getTriggerInput());
        act(() => getTriggerInput().blur());
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getTriggerInput()).toBeNull();
    });

    it('size 为 default 时多选标签与其他组件一样为 large', () => {
        renderSelect({ multiple: true, size: 'default', defaultValue: ['abc'], optionList: defaultList });
        expect(document.querySelector(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag`)).toHaveClass(`${BASE_CLASS_PREFIX}-tag-large`);
    });

    it('optionList 过滤时留下的选项保持同一个节点', () => {
        renderSelect({
            filter: true,
            defaultOpen: true,
            optionList: [
                { value: 'a', label: 'a1' },
                { value: 'b', label: 'b1' },
            ],
        });
        const before = getOptionByText('b1');
        search('b');
        expect(getOptionTexts()).toEqual(['b1']);
        expect(getOptionByText('b1')).toBe(before);
    });

    it('OptGroup 里不是 Option 的子节点被忽略，不抛错', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        render(
            <Select defaultOpen motion={false}>
                <Select.OptGroup label="G">
                    text
                    <span>node</span>
                    <Select.Option value="a">A</Select.Option>
                </Select.OptGroup>
            </Select>
        );
        expect(getOptionTexts()).toEqual(['A']);
        expect(console.warn).toHaveBeenCalled();
    });

    it('下拉打开时在触发器内的 +N 浮层里按下鼠标，不关闭下拉也不触发 onBlur', async () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ multiple: true, maxTagCount: 1, showRestTagsPopover: true, defaultValue: ['abc', 'hotsoon'], optionList: defaultList, onBlur });
        fireEvent.click(getTrigger());
        fireEvent.mouseEnter(screen.getByText('+1'));
        const restTag = await waitFor(() => {
            const tag = Array.from(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag`)).find((node) => node.textContent === 'Hotsoon' && !getRoot().contains(node));
            expect(tag).toBeDefined();
            return tag;
        });
        fireEvent.mouseDown(restTag);
        expect(getOptionList()).not.toBeNull();
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('在面板内已打开的嵌套 Popover 里按下鼠标不关闭下拉，在外部按下才关闭', async () => {
        // with its default stopPropagation the Select stops the native mousedown before the document sees it
        renderSelect({
            defaultOpen: true,
            optionList: defaultList,
            stopPropagation: false,
            innerBottomSlot: (
                <Popover aria-label="Nested" content={<button type="button">inside nested</button>} motion={false} trigger="custom" visible>
                    <button type="button">nested trigger</button>
                </Popover>
            ),
        });
        fireEvent.mouseDown(await screen.findByRole('button', { name: 'inside nested' }));
        expect(getOptionList()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        await waitFor(() => expect(getOptionList()).toBeNull());
    });
});

describe('Select 类型', () => {
    type Item = { value: string; label: string };
    type OnChangeArg<P extends SelectProps<any, any>> = Parameters<NonNullable<P['onChange']>>[0];

    it('onChange 的参数随 multiple 收窄', () => {
        expectTypeOf<OnChangeArg<SelectProps<string>>>().toEqualTypeOf<string | undefined>();
        expectTypeOf<OnChangeArg<SelectProps<string, true>>>().toEqualTypeOf<string[]>();
        expectTypeOf<OnChangeArg<SelectProps<string, boolean>>>().toEqualTypeOf<string | string[] | undefined>();
        expectTypeOf<OnChangeArg<SelectProps<Item>>>().toEqualTypeOf<Item | undefined>();
        expectTypeOf<OnChangeArg<SelectProps<Item, true>>>().toEqualTypeOf<Item[]>();
    });

    it('onSelect 与 onDeselect 的 value 是选项的原始 value，onChangeWithObject 时也不是对象', () => {
        type RawValue = string | number | undefined;
        expectTypeOf<Parameters<NonNullable<SelectProps<string, true>['onSelect']>>[0]>().toEqualTypeOf<RawValue>();
        expectTypeOf<Parameters<NonNullable<SelectProps<string, true>['onDeselect']>>[0]>().toEqualTypeOf<RawValue>();
        expectTypeOf<Parameters<NonNullable<SelectProps<Item, true>['onSelect']>>[0]>().toEqualTypeOf<RawValue>();
        expectTypeOf<Parameters<NonNullable<SelectProps<Item, true>['onDeselect']>>[0]>().toEqualTypeOf<RawValue>();
        expectTypeOf<Parameters<NonNullable<SelectProps<Item>['onSelect']>>[0]>().not.toExtend<Item>();
    });

    it('onSearch 的 event 可选，覆盖输入、按键、点击与点击外部', () => {
        expectTypeOf<Parameters<NonNullable<SelectProps['onSearch']>>>().toEqualTypeOf<[value: string, event?: InputChangeEvent | ReactKeyboardEvent | ReactMouseEvent | MouseEvent]>();
    });

    it('onBlur 在点击外部时收到的是原生 MouseEvent，不是 React 合成事件', () => {
        type BlurEvent = Parameters<NonNullable<SelectProps['onBlur']>>[0];
        expectTypeOf<MouseEvent>().toExtend<BlurEvent>();
        expectTypeOf<ReactMouseEvent>().not.toExtend<BlurEvent>();
    });

    it('virtualize 必须带 itemSize', () => {
        expectTypeOf<{ height: number }>().not.toExtend<NonNullable<SelectProps['virtualize']>>();
        expectTypeOf<{ itemSize: number }>().toExtend<NonNullable<SelectProps['virtualize']>>();
    });

    it('triggerRender 的 placeholder 与 Select 的 placeholder 同为 ReactNode，没有 onChange 别名', () => {
        expectTypeOf<TriggerRenderProps['placeholder']>().toEqualTypeOf<ReactNode>();
        expectTypeOf<TriggerRenderProps>().not.toHaveProperty('onChange');
    });

    it('没有 mouseEnterDelay、mouseLeaveDelay；searchPosition 只接受 trigger 与 dropdown', () => {
        expectTypeOf<SelectProps>().not.toHaveProperty('mouseEnterDelay');
        expectTypeOf<SelectProps>().not.toHaveProperty('mouseLeaveDelay');
        expectTypeOf<SelectProps['searchPosition']>().toEqualTypeOf<'trigger' | 'dropdown' | undefined>();
    });

    it('onChangeWithObject 时 onSelect 运行时收到原始 value', () => {
        const onSelect = vi.fn<NonNullable<SelectProps['onSelect']>>();
        render(<Select defaultOpen optionList={[{ value: 'a', label: 'A' }]} onChangeWithObject onSelect={onSelect} />);
        fireEvent.click(screen.getByRole('option', { name: 'A' }));
        expect(onSelect).toHaveBeenCalledWith('a', expect.objectContaining({ value: 'a', label: 'A' }));
    });

    it('renderSelectedItem 的签名随 multiple 收窄', () => {
        type Render<P extends SelectProps<any, any>> = NonNullable<P['renderSelectedItem']>;
        expectTypeOf<Render<SelectProps<string>>>().toEqualTypeOf<RenderSingleSelectedItemFn>();
        expectTypeOf<Render<SelectProps<string, true>>>().toEqualTypeOf<RenderMultipleSelectedItemFn>();
        expectTypeOf<Render<SelectProps<string, boolean>>>().toEqualTypeOf<RenderSingleSelectedItemFn | RenderMultipleSelectedItemFn>();
        expectTypeOf<RenderMultipleSelectedItemFn>().not.toExtend<Render<SelectProps<string>>>();
        expectTypeOf<RenderSingleSelectedItemFn>().not.toExtend<Render<SelectProps<string, true>>>();
    });

    it('Option 与 OptGroup 由静态 elementType 识别，没有 isSelectOption、isSelectOptionGroup', () => {
        expect(Select.Option.elementType).toBe('Select.Option');
        expect(Select.OptGroup.elementType).toBe('Select.OptGroup');
        // @ts-expect-error elementType is the only marker
        expect(Select.Option.isSelectOption).toBeUndefined();
        // @ts-expect-error elementType is the only marker
        expect(Select.OptGroup.isSelectOptionGroup).toBeUndefined();
    });

    it('子节点不是 Option 或 OptGroup 时，警告给出公开的组件名 Select.OptGroup', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        onTestFinished(() => warn.mockRestore());
        render(
            <Select>
                <span>x</span>
            </Select>
        );
        const messages = warn.mock.calls.map(([message]) => String(message));
        expect(messages.some((message) => message.includes('`Select.Option` or `Select.OptGroup`'))).toBe(true);
        expect(messages.some((message) => message.includes('OptionGroup'))).toBe(false);
    });

    it('JSX 中由 multiple 与 value 推断 onChange 的参数', () => {
        const flag = Math.random() > 0.5;
        // the elements are only created, never rendered, so the callbacks never run
        const single = <Select value="a" onChange={(v) => expectTypeOf(v).toEqualTypeOf<string | undefined>()} />;
        const multiple = <Select multiple value={['a']} onChange={(v) => expectTypeOf(v).toEqualTypeOf<string[]>()} />;
        const singleObject = <Select value={{ value: 'a', label: 'A' }} onChange={(v) => expectTypeOf(v).toEqualTypeOf<Item | undefined>()} onChangeWithObject />;
        const multipleObject = <Select multiple value={[{ value: 'a', label: 'A' }]} onChange={(v) => expectTypeOf(v).toEqualTypeOf<Item[]>()} onChangeWithObject />;
        const dynamic = <Select multiple={flag} value={['a']} onChange={(v) => expectTypeOf(v).toEqualTypeOf<string | string[] | undefined>()} />;
        expect([single, multiple, singleObject, multipleObject, dynamic]).toHaveLength(5);
    });
});
