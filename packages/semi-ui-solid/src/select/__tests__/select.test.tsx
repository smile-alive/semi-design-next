import { createSignal, For, type JSX, onMount, untrack } from 'solid-js';
import { fireEvent, render, screen, waitFor, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { mockResizeObserver } from '@test/utils/solid';
import Select, { type OptionRenderProps, type RenderMultipleSelectedItemFn, type RenderSingleSelectedItemFn, type SelectElement, type SelectProps, type TriggerRenderProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import { InputGroup } from '../../input';
import Popover from '../../popover';

const Option = Select.Option;
const prefixCls = `${BASE_CLASS_PREFIX}-select`;

type Props = Record<string, unknown>;

const defaultList = [
    { value: 'abc', label: 'Abc' },
    { value: 'hotsoon', label: 'Hotsoon' },
    { value: 'pipixia', label: 'Pipixia' },
    { value: 'toutiao', label: 'TopBuzz' },
];

function getOption(list: Props[] = defaultList) {
    return list.map((optionOpts) => <Option {...optionOpts} />);
}

// the popup layer (a Tooltip) animates; turned off so tests need not wait
function renderSelect(initial: Props = {}) {
    const [props, setProps] = createSignal(initial as SelectProps<unknown>);
    const options = () => (props().optionList || 'children' in props() ? (props().children as JSX.Element) : getOption());
    const result = render(() => (
        // a spread call is a function source, so keys added by a later rerender stay reactive
        <Select motion={false} {...props()}>
            {options()}
        </Select>
    ));
    return { ...result, rerender: (next: Props) => setProps(next as SelectProps<unknown>) };
}

const getTrigger = () => screen.getByRole('combobox');
const getOptionList = () => screen.queryByRole('listbox');
const getOptions = () => screen.queryAllByRole('option');
const getOptionTexts = () => getOptions().map((option) => option.textContent);
// the tick icon contributes to the accessible name of an option, so options are matched by their text
const getOptionByText = (text: string) => getOptions().find((option) => option.textContent === text) as HTMLElement;
const getFocusedOption = () => document.querySelector(`.${prefixCls}-option-focused`);
const getSelectionText = () => document.querySelector(`.${prefixCls}-selection-text`);
const getTagTexts = () => Array.from(document.querySelectorAll(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag-content`)).map((tag) => tag.textContent);
const getTriggerInput = () => document.querySelector<HTMLInputElement>(`.${prefixCls} input`) as HTMLInputElement;
const getRoot = () => document.querySelector(`.${prefixCls}`) as HTMLElement;
const getClearIcon = () => document.querySelector(`.${BASE_CLASS_PREFIX}-icon-clear`) as HTMLElement;
const getWrapper = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-popover-wrapper`) as HTMLElement;
const search = (value: string, input: HTMLElement = getTriggerInput()) => fireEvent.input(input, { target: { value } });
const keyDown = (key: string, init: KeyboardEventInit = {}, target: HTMLElement = getTrigger()) => fireEvent.keyDown(target, { key, ...init });
const expectClosed = () => waitFor(() => expect(getOptionList()).toBeNull());
const range = (length: number) => Array.from({ length }, (_, i) => ({ label: `option-${i}`, value: i }));

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Select', () => {
    it('自定义 class 与 style', () => {
        renderSelect({ class: 'test', style: { color: 'red' } });
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
        expect(getWrapper()).toHaveAttribute('x-placement', 'top');
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
        const { unmount } = renderSelect({ defaultValue: 'semi', showClear: true });
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
            prefix: <div class="prefix">prefix content</div>,
            suffix: <div class="suffix">suffix content</div>,
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
        renderSelect({ defaultOpen: true, style: { width: '90px' }, defaultValue: 'abc' });
        expect(getWrapper().style.minWidth).toBe('var(--semi-tooltip-trigger-width)');
    });

    it('dropdownMatchSelectWidth = false', () => {
        renderSelect({ defaultOpen: true, style: { width: '90px' }, defaultValue: 'abc', dropdownMatchSelectWidth: false });
        expect(getWrapper().style.minWidth).toBe('');
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
        const tagGroup = document.querySelector(`.${BASE_CLASS_PREFIX}-tag-group`) as HTMLElement;
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
        renderSelect({ innerTopSlot: <div class="inner-slot">inner</div>, defaultOpen: true });
        const slot = screen.getByText('inner');
        expect(slot).toHaveClass('inner-slot');
        expect(slot.parentElement).toHaveClass(`${prefixCls}-option-list-inner-top-slot`);
        expect(getOptionList()?.firstChild).toBe(slot.parentElement);
    });

    it('outerTopSlot', () => {
        renderSelect({ outerTopSlot: <div class="outer-slot">outer</div>, defaultOpen: true });
        const slot = screen.getByText('outer');
        expect(slot).toHaveClass('outer-slot');
        expect(slot.parentElement).toHaveClass(`${prefixCls}-option-list-outer-top-slot`);
        expect(getOptionList()).not.toContainElement(slot);
    });

    it('innerBottomSlot', () => {
        renderSelect({ innerBottomSlot: <div class="inner-slot">inner</div>, defaultOpen: true });
        const slot = screen.getByText('inner');
        expect(slot).toHaveClass('inner-slot');
        expect(slot.parentElement).toHaveClass(`${prefixCls}-option-list-inner-bottom-slot`);
        expect(getOptionList()?.lastChild).toBe(slot.parentElement);
    });

    it('outerBottomSlot', () => {
        renderSelect({ outerBottomSlot: <div class="outer-slot">outer</div>, defaultOpen: true });
        const slot = screen.getByText('outer');
        expect(slot).toHaveClass('outer-slot');
        expect(slot.parentElement).toHaveClass(`${prefixCls}-option-list-outer-bottom-slot`);
        expect(getOptionList()).not.toContainElement(slot);
    });

    it('option 的 class、style、disabled 与 showTick', () => {
        const options = [
            { class: 'optCls', style: { color: 'red' }, label: 'Abc', value: 'abc' },
            { label: 'Vigo', value: 'vigo', disabled: true, class: 'disabled-opt' },
            { label: 'NoTick', value: 'noTick', showTick: false },
        ].map((item) => <Option {...item}>{item.label}</Option>);
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
        expect(getOptionList()?.querySelector(`.${prefixCls}-loading-wrapper`)).not.toBeNull();
        expect(getOptions()).toHaveLength(0);
    });

    it('spacing', () => {
        // jsdom puts the trigger's box at 0, so a bottomLeft popup's top is the spacing
        renderSelect({ spacing: 20, defaultOpen: true });
        expect(getWrapper().style.top).toBe('20px');
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

    it('搜索后 aria-activedescendant 指向已渲染的选项', async () => {
        renderSelect({ filter: true });
        await userEvent.click(getTrigger());
        search('abc');
        expect(getOptionTexts()).toEqual(['Abc']);
        const activeId = getTrigger().getAttribute('aria-activedescendant') as string;
        expect(activeId).toBeTruthy();
        expect(document.getElementById(activeId)).toBe(getOptionByText('Abc'));
        search('zzz');
        expect(getOptions()).toHaveLength(0);
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
        const customFilter = (_input: string, option: { label?: unknown }) => option.label === 'Hotsoon';
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
        renderSelect({ filter: true, emptyContent: 'no data' });
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
        await userEvent.click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledWith(0);
    });

    it('renderSelectedItem，single', () => {
        const renderSelectedItem = vi.fn<RenderSingleSelectedItemFn>((option) => `${option.value}-${String(option.label)}`);
        renderSelect({ renderSelectedItem, defaultValue: 'abc' });
        expect(getSelectionText()).toHaveTextContent(/^abc-Abc$/);
        expect(renderSelectedItem).toHaveBeenCalledWith(expect.objectContaining({ value: 'abc', label: 'Abc' }));
    });

    it('renderSelectedItem，single 且 value 为 0，不在 optionList 中', () => {
        const renderSelectedItem = vi.fn<RenderSingleSelectedItemFn>((option) => Number(option.label) + 1);
        renderSelect({ renderSelectedItem, value: 0 });
        expect(getSelectionText()).toHaveTextContent(/^1$/);
        expect(renderSelectedItem).toHaveBeenCalledWith(expect.objectContaining({ value: 0, label: 0 }));
    });

    const extraList = [
        { value: 'abc', label: 'Abc', extra: 'a1' },
        { value: 'hotsoon', label: 'Hotsoon', extra: 'b2' },
        { value: 'pipixia', label: 'Pipixia', extra: 'c3' },
        { value: 'toutiao', label: 'TopBuzz', extra: 'd4' },
    ];

    it('renderSelectedItem - multiple', () => {
        const renderSelectedItem = vi.fn<RenderMultipleSelectedItemFn>((option) => ({ isRenderInTag: true, content: `${option.value}-${String(option.extra)}` }));
        renderSelect({ optionList: extraList, renderSelectedItem, defaultValue: ['abc', 'hotsoon'], multiple: true });
        expect(getTagTexts()).toEqual(['abc-a1', 'hotsoon-b2']);
    });

    it('renderSelectedItem - multiple - isRenderInTag: false', () => {
        const renderSelectedItem: RenderMultipleSelectedItemFn = (option, opts) => ({
            isRenderInTag: false,
            content: <div class={`item-${opts.index}`}>{`${option.value}-${String(option.extra)}`}</div>,
        });
        renderSelect({ optionList: extraList, renderSelectedItem, defaultValue: ['abc', 'hotsoon'], multiple: true });
        const items = (document.querySelector(`.${prefixCls}-content-wrapper`) as HTMLElement).children;
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
        const { unmount: unmountSingle } = renderSelect({ value: 'abc', optionList: defaultList, defaultOpen: true, onChange });
        await userEvent.click(getOptions()[1]);
        expect(onChange).toHaveBeenCalledWith('hotsoon');
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
        unmountSingle();

        const onMultipleChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ value: '', optionList: defaultList, defaultOpen: true, multiple: true, filter: true, onChange: onMultipleChange, showClear: true, onClear: vi.fn<() => void>() });
        await userEvent.click(getOptions()[1]);
        expect(onMultipleChange).toHaveBeenCalledWith(['hotsoon']);
    });

    it('父组件挂载时就改了 value，显示新选项', () => {
        function Demo() {
            const [value, setValue] = createSignal('abc');
            onMount(() => setValue('hotsoon'));
            return (
                <Select motion={false} value={value()}>
                    {getOption()}
                </Select>
            );
        }
        render(() => <Demo />);
        expect(getSelectionText()).toHaveTextContent(/^Hotsoon$/);
    });

    it('【onBlur/onFocus】Esc 关闭面板不调用 onBlur，焦点留在触发器', async () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        const onFocus = vi.fn<NonNullable<SelectProps['onFocus']>>();
        renderSelect({ onBlur, onFocus });
        await userEvent.click(getTrigger());
        expect(onFocus).toHaveBeenCalledTimes(1);
        keyDown('Escape');
        await expectClosed();
        expect(onBlur).not.toHaveBeenCalled();
        expect(getTrigger()).toHaveFocus();
    });

    it('【autofocus】- filter = false', () => {
        const onFocus = vi.fn<NonNullable<SelectProps['onFocus']>>();
        renderSelect({ onFocus, autofocus: true });
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(getTrigger()).toHaveClass(`${prefixCls}-focus`);
        expect(getTrigger()).toHaveFocus();
    });

    it('【autofocus】- filter = true', () => {
        renderSelect({ autofocus: true, filter: true });
        expect(getRoot()).toHaveClass(`${prefixCls}-focus`);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-focus`)).not.toBeNull();
        expect(getTriggerInput()).toHaveFocus();
    });

    it('【autofocus】时点击外部调用一次 onBlur', async () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ autofocus: true, onBlur });
        expect(getTrigger()).toHaveFocus();
        await userEvent.click(document.body);
        expect(getTrigger()).not.toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-focus`);
    });

    it('virtualize 只渲染可见的行', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const optionList = range(100);
        renderSelect({ virtualize: { itemSize: 36 }, defaultOpen: true, optionList, onChange });
        expect(getOptions().length).toBeGreaterThan(0);
        expect(getOptions().length).toBeLessThan(optionList.length);
        await userEvent.click(screen.getByText('option-0'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(0);
    });

    it('OptGroup', () => {
        const optionList = [
            <Select.OptGroup label="Group1">
                <Select.Option value="a-1">a-1</Select.Option>
                <Select.Option value="a-2">a-2</Select.Option>
            </Select.OptGroup>,
            <Select.OptGroup label="Group2">
                <Select.Option value="b-1">b-1</Select.Option>
                <Select.Option value="b-2">b-2</Select.Option>
            </Select.OptGroup>,
            <Select.OptGroup>
                <Select.Option value="c-1">c-1</Select.Option>
            </Select.OptGroup>,
        ];
        renderSelect({ defaultOpen: true, children: optionList });
        const groups = document.querySelectorAll(`.${prefixCls}-group`);
        expect(Array.from(groups).map((group) => group.textContent)).toEqual(['Group1', 'Group2']);
        expect(getOptionTexts()).toEqual(['a-1', 'a-2', 'b-1', 'b-2', 'c-1']);
        expect(screen.getByRole('group', { name: 'Group1' })).toContainElement(getOptionByText('a-2'));
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
        const renderOptionItem = (props: OptionRenderProps) => (
            <div class="custom-option" style={props.style} onClick={onClick} onMouseEnter={onMouseEnter}>
                <div class="option-right">{props.label}</div>
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

    it('renderOptionItem 每行只调用一次，聚焦状态经响应式 props 更新', () => {
        const renders: Record<string, number> = {};
        const renderOptionItem = (props: OptionRenderProps) => {
            const value = untrack(() => props.value as string);
            renders[value] = (renders[value] ?? 0) + 1;
            return (
                <div class="custom-option" style={props.style} data-focused={String(props.focused)} onMouseEnter={(e) => props.onMouseEnter(e)}>
                    {props.label}
                </div>
            );
        };
        renderSelect({ defaultOpen: true, optionList: defaultList, renderOptionItem });
        fireEvent.mouseEnter(document.querySelectorAll('.custom-option')[1]);
        expect(document.querySelectorAll('.custom-option')[1]).toHaveAttribute('data-focused', 'true');
        expect(document.querySelectorAll('.custom-option')[0]).toHaveAttribute('data-focused', 'false');
        expect(renders).toEqual({ abc: 1, hotsoon: 1, pipixia: 1, toutiao: 1 });
    });

    it('customTrigger', async () => {
        const triggerRender = () => <div class="custom-trigger">trigger</div>;
        renderSelect({ triggerRender });
        const trigger = screen.getByText('trigger');
        expect(trigger).toHaveClass('custom-trigger');
        await userEvent.click(trigger);
        expect(getOptions()).toHaveLength(defaultList.length);
    });

    it('键盘按键', async () => {
        const { unmount } = renderSelect({ defaultOpen: true, optionList: defaultList });
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
        const onMouseEnter = vi.fn<(e: MouseEvent) => void>();
        const onMouseLeave = vi.fn<(e: MouseEvent) => void>();
        renderSelect({ onMouseEnter, onMouseLeave });
        await userEvent.hover(getTrigger());
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
        await userEvent.unhover(getTrigger());
        expect(onMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('ref 是根元素，focus() 聚焦 combobox 而不打开下拉', () => {
        let root: HTMLDivElement | undefined;
        const { unmount } = renderSelect({ ref: (node: HTMLDivElement) => (root = node), filter: true, multiple: true, optionList: defaultList });
        expect(root).toBe(getRoot());
        root?.focus();
        expect(getTriggerInput()).toHaveFocus();
        expect(getOptionList()).toBeNull();
        root?.blur();
        expect(getTriggerInput()).not.toHaveFocus();
        unmount();

        renderSelect({ ref: (node: HTMLDivElement) => (root = node), optionList: defaultList });
        root?.focus();
        expect(getRoot()).toHaveFocus();
        root?.blur();
        expect(getRoot()).not.toHaveFocus();
    });

    it('整体替换 props 时保留触发器且不重复调用 ref', () => {
        const ref = vi.fn<(node: SelectElement) => void>();
        const [props, setProps] = createSignal<SelectProps<unknown>>({ optionList: defaultList, placeholder: 'a', ref });
        render(() => <Select {...props()} />);
        const trigger = getTrigger();
        trigger.focus();
        setProps({ optionList: defaultList, placeholder: 'b', ref });
        expect(getTrigger()).toBe(trigger);
        expect(trigger).toHaveFocus();
        expect(ref).toHaveBeenCalledTimes(1);
    });

    it('非受控模式下选择选项后 props.optionList 更新', async () => {
        const newList = [
            { value: 'pipixia', label: 'Pipixia' },
            { value: 'toutiao', label: 'TopBuzz' },
        ];
        const twoOptions = [
            { value: 'abc', label: 'Abc' },
            { value: 'hotsoon', label: 'Hotsoon' },
        ];
        const props = { defaultActiveFirstOption: true, optionList: twoOptions, defaultOpen: true, multiple: true, filter: true };
        const { rerender, unmount } = renderSelect(props);
        await userEvent.click(getOptions()[0]);
        await userEvent.click(getOptions()[1]);
        rerender({ ...props, optionList: newList });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
        unmount();

        const singleProps = { defaultActiveFirstOption: true, optionList: twoOptions, defaultOpen: true };
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
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`) as HTMLElement);
        expect(onDeselect).toHaveBeenCalledWith('abc', expect.objectContaining({ value: 'abc', label: 'Abc' }));
        expect(onChange).toHaveBeenCalledWith(['hotsoon']);
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
    });

    it('autoClearSearchValue', async () => {
        renderSelect({ multiple: true, optionList: range(100), defaultOpen: true, filter: true });
        await userEvent.click(getTrigger());
        search('option');
        await userEvent.click(getOptions()[0]);
        expect(getTriggerInput()).toHaveValue('');
    });

    it('autoClearSearchValue = false', async () => {
        renderSelect({ multiple: true, optionList: range(100), defaultOpen: true, autoClearSearchValue: false, filter: true });
        await userEvent.click(getTrigger());
        search('option');
        await userEvent.click(getOptions()[0]);
        expect(getTagTexts()).toEqual(['option-0']);
        expect(getTriggerInput()).toHaveValue('option');
    });

    it('searchPosition 为 dropdown', () => {
        renderSelect({ filter: true, searchPosition: 'dropdown', defaultOpen: true });
        const input = document.querySelector<HTMLInputElement>(`.${prefixCls}-dropdown-search-wrapper input`) as HTMLInputElement;
        expect(input).not.toBeNull();
        expect(getTrigger()).not.toContainElement(input);
        expect(getRoot().querySelector('input')).toBeNull();
        search('abc', input);
        expect(getOptionTexts()).toEqual(['Abc']);
    });

    it('searchPosition 为 dropdown 时 inputProps 的 onKeyDown 与 Select 的方向键导航都生效', async () => {
        const onKeyDown = vi.fn<(e: KeyboardEvent) => void>();
        renderSelect({ filter: true, searchPosition: 'dropdown', defaultOpen: true, inputProps: { onKeyDown } });
        const input = document.querySelector<HTMLInputElement>(`.${prefixCls}-dropdown-search-wrapper input`) as HTMLInputElement;
        expect(getFocusedOption()).toHaveTextContent(/^Abc$/);
        input.focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(onKeyDown.mock.calls[0][0].key).toBe('ArrowDown');
        // one step: the keydown reaches the foundation once, not again through the trigger
        expect(getFocusedOption()).toHaveTextContent(/^Hotsoon$/);
    });

    it('onCreate 回调', async () => {
        const onCreate = vi.fn<NonNullable<SelectProps['onCreate']>>();
        renderSelect({ allowCreate: true, filter: true, onCreate, defaultOpen: true });
        await userEvent.click(getTrigger());
        search('newOption');
        const [createOption] = getOptions();
        expect(createOption).toHaveTextContent('newOption');
        expect(createOption.querySelector(`.${prefixCls}-create-tips`)).toHaveTextContent(zh_CN.Select.createText);
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
        expect(getTagTexts()).toEqual(expect.arrayContaining(['Abc', 'Hotsoon']));
    });

    it('ARIA 属性 - aria-labelledby、aria-describedby、aria-required、aria-invalid', () => {
        renderSelect({ 'aria-labelledby': 'label-id', 'aria-describedby': 'description-id', 'aria-required': true, 'aria-invalid': true });
        expect(getTrigger()).toHaveAttribute('aria-labelledby', 'label-id');
        expect(getTrigger()).toHaveAttribute('aria-describedby', 'description-id');
        expect(getTrigger()).toHaveAttribute('aria-required', 'true');
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

    it('onListScroll 回调', () => {
        const onListScroll = vi.fn<NonNullable<SelectProps['onListScroll']>>();
        renderSelect({ defaultOpen: true, onListScroll });
        fireEvent.scroll(getOptionList() as HTMLElement);
        expect(onListScroll).toHaveBeenCalledTimes(1);
    });

    it('未声明的 open 属性不打开下拉', () => {
        renderSelect({ open: true });
        expect(getOptionList()).toBeNull();
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('自定义 renderCreateItem', () => {
        const renderCreateItem = (inputValue: unknown) => <div class="custom-create">Create: {String(inputValue)}</div>;
        renderSelect({ allowCreate: true, filter: true, renderCreateItem, defaultOpen: true, multiple: true });
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
        render(() => (
            <>
                <Select defaultOpen motion={false} optionList={defaultList} onBlur={onBlur} onFocus={onFocus} />
                <button type="button">outside</button>
            </>
        ));
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

    it('multiple 配合 onChangeWithObject 并更新 value', () => {
        const props = {
            multiple: true,
            onChangeWithObject: true,
            optionList: extraList.slice(0, 2),
            value: [extraList[0]],
        };
        const { rerender } = renderSelect(props);
        expect(getTagTexts()).toEqual(['Abc']);
        rerender({ ...props, value: extraList.slice(0, 2) });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
    });

    it('没有聚焦选项时按 Enter', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ defaultOpen: true, defaultActiveFirstOption: false, onChange });
        keyDown('Enter');
        await expectClosed();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('filter 单选时按 Esc', async () => {
        renderSelect({ filter: true, defaultOpen: true });
        expect(getOptionList()).not.toBeNull();
        keyDown('Escape');
        await expectClosed();
        expect(getTrigger()).toHaveFocus();
    });

    it('multiple 全部为禁用项时按 Backspace', () => {
        renderSelect({ multiple: true, defaultValue: ['abc'], optionList: [{ value: 'abc', label: 'Abc', disabled: true }], defaultOpen: true });
        keyDown('Backspace');
        expect(getTagTexts()).toEqual(['Abc']);
    });

    it('virtualize 下有选中项时打开', async () => {
        const optionList = range(100);
        renderSelect({ virtualize: { itemSize: 36 }, defaultValue: 50, optionList });
        await userEvent.click(getTrigger());
        expect(getOptions().length).toBeGreaterThan(0);
        expect(getOptions().length).toBeLessThan(optionList.length);
        expect(getSelectionText()).toHaveTextContent(/^option-50$/);
    });

    it('filter 时匹配分组名', () => {
        renderSelect({
            filter: true,
            defaultOpen: true,
            children: [
                <Select.OptGroup label="Group1">
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
                <Select.OptGroup label={2024}>
                    <Select.Option value="x">Xray</Select.Option>
                </Select.OptGroup>,
                <Select.OptGroup label="2025">
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
            render(() => (
                <ConfigProvider locale={en_US}>
                    <Select defaultOpen motion={false} optionList={optionList} />
                </ConfigProvider>
            ));
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
            render(() => (
                <ConfigProvider locale={en_US}>
                    <Select defaultOpen motion={false} optionList={optionList} prefix="Pre" insetLabel="Fruit" />
                </ConfigProvider>
            ));
            expect(getTrigger()).toHaveAccessibleName(en_US.Select.label);
            expect(getOptionList()).toHaveAccessibleName(en_US.Select.label);
        });

        it('下拉搜索框与 combobox 同名', () => {
            renderSelect({ defaultOpen: true, optionList, filter: true, searchPosition: 'dropdown', insetLabel: 'Fruit' });
            expect(screen.getByRole('textbox')).toHaveAccessibleName('Fruit');
        });

        it('使用方 aria-labelledby 优先于 insetLabel，两者指向同一个标签', () => {
            render(() => (
                <>
                    <span id="external-label">External</span>
                    <Select defaultOpen motion={false} optionList={optionList} insetLabel="Fruit" aria-labelledby="external-label" />
                </>
            ));
            expect(getTrigger()).toHaveAccessibleName('External');
            expect(getOptionList()).toHaveAccessibleName('External');
        });

        it('搜索框是 combobox 时也不指向输入框（accname 会取输入内容）', () => {
            renderSelect({ defaultOpen: true, multiple: true, filter: true, optionList, 'aria-label': 'Fruit' });
            expect(getTrigger().tagName).toBe('INPUT');
            expect(getOptionList()).toHaveAttribute('aria-label', 'Fruit');
            expect(getOptionList()).not.toHaveAttribute('aria-labelledby');
        });
    });

    it('allowCreate 时匹配已有选项', () => {
        renderSelect({ allowCreate: true, filter: true, defaultOpen: true, optionList: [{ value: 'abc', label: 'abc' }] });
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

    it('自定义 arrowIcon 与 clearIcon', () => {
        renderSelect({
            arrowIcon: <span class="custom-arrow">v</span>,
            clearIcon: <span class="custom-clear">x</span>,
            showClear: true,
            defaultValue: 'abc',
        });
        expect(document.querySelector('.custom-arrow')).not.toBeNull();
        expect(screen.getByRole('button', { name: zh_CN.Select.clear })).toContainElement(document.querySelector('.custom-clear') as HTMLElement);
    });

    it('arrowIcon 为 null 时不显示箭头图标', () => {
        renderSelect({ arrowIcon: null });
        expect(document.querySelector(`.${prefixCls}-arrow`)).toBeEmptyDOMElement();
    });

    it('autoClearSearchValue 为 false 时 multiple 受控', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ multiple: true, filter: true, autoClearSearchValue: false, value: [], onChange, defaultOpen: true });
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
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`) as HTMLElement);
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
        renderSelect({ defaultOpen: true, innerBottomSlot: <button class="slot-button">Click me</button> });
        keyDown('Tab');
        expect(screen.getByRole('button', { name: 'Click me' })).toHaveFocus();
        expect(getOptionList()).not.toBeNull();
    });

    it('option 带额外属性', () => {
        renderSelect({ defaultOpen: true, optionList: [{ value: 'abc', label: 'Abc', extra: 'extra1', customProp: 'custom' }] });
        expect(getOptionTexts()).toEqual(['Abc']);
    });

    it('optionList 更新时 defaultActiveFirstOption 重新聚焦首项', () => {
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
});

describe('Select 交互', () => {
    it('filter 时清空', async () => {
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

    it('allowCreate 时选择新建项', async () => {
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

    it('在禁用选项上按 Enter', () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ defaultOpen: true, defaultActiveFirstOption: true, optionList: [{ value: 'abc', label: 'Abc', disabled: true }], onChange });
        // the default highlight skips a disabled option; hovering still lands on it
        fireEvent.mouseEnter(getOptionByText('Abc'));
        keyDown('Enter');
        expect(onChange).not.toHaveBeenCalled();
        expect(getOptionList()).not.toBeNull();
    });

    it('多个分组各自包住标题与选项', () => {
        renderSelect({
            defaultOpen: true,
            children: [
                <Select.OptGroup label="Group1">
                    <Select.Option value="a-1">a-1</Select.Option>
                </Select.OptGroup>,
                <Select.OptGroup label="Group2">
                    <Select.Option value="b-1">b-1</Select.Option>
                </Select.OptGroup>,
            ],
        });
        const groupNodes = Array.from((getOptionList() as HTMLElement).children);
        expect(groupNodes.map((group) => Array.from(group.children).map((node) => node.textContent))).toEqual([
            ['Group1', 'a-1'],
            ['Group2', 'b-1'],
        ]);
    });

    it('suffix 为元素', () => {
        renderSelect({ suffix: <span class="custom-suffix">suffix</span> });
        expect(screen.getByText('suffix')).toHaveClass('custom-suffix');
        expect(getTrigger()).toHaveClass(`${prefixCls}-with-suffix`);
    });

    it('prefix 为文本', () => {
        renderSelect({ prefix: 'Prefix:' });
        expect(document.querySelector(`.${prefixCls}-prefix-text`)).toHaveTextContent(/^Prefix:$/);
    });

    it('既不在 optionList 也不在已选中的 value 以 value 作标签', () => {
        renderSelect({ multiple: true, value: ['notExist1', 'notExist2'], optionList: defaultList });
        expect(getTagTexts()).toEqual(['notExist1', 'notExist2']);
    });

    it('renderOptionItem 收到 label、value 与内置类名，点击选中', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const renderOptionItem = (props: OptionRenderProps) => (
            <div class={`custom-option ${props.class}`} style={props.style} onClick={(e) => props.onClick(e)} onMouseEnter={(e) => props.onMouseEnter(e)}>
                {props.label} - {props.value}
            </div>
        );
        renderSelect({ defaultOpen: true, optionList: defaultList, renderOptionItem, onChange });
        const options = Array.from(document.querySelectorAll('.custom-option'));
        expect(options.map((option) => option.textContent)).toEqual(['Abc - abc', 'Hotsoon - hotsoon', 'Pipixia - pipixia', 'TopBuzz - toutiao']);
        expect(options[0]).toHaveClass(`${prefixCls}-option-custom`);
        await userEvent.click(options[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('abc');
    });

    it('悬停选项时高亮跟随指针', async () => {
        renderSelect({ defaultOpen: true, optionList: defaultList });
        expect(getFocusedOption()).toHaveTextContent(/^Abc$/);
        await userEvent.hover(getOptions()[2]);
        expect(getFocusedOption()).toHaveTextContent(/^Pipixia$/);
        expect(getTrigger().getAttribute('aria-activedescendant')).toBe(getOptions()[2].id);
    });

    it('showRestTagsPopover：悬停 +N 时显示其余标签', async () => {
        renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'], maxTagCount: 2, showRestTagsPopover: true });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+2']);
        expect(screen.queryByText('Pipixia')).toBeNull();
        await userEvent.hover(screen.getByText('+2'));
        await waitFor(() => expect(screen.getByText('Pipixia')).toBeInTheDocument());
        expect(screen.getByText('TopBuzz')).toBeInTheDocument();
    });

    it('悬停插槽时取消选项高亮', async () => {
        renderSelect({ defaultOpen: true, innerBottomSlot: <div class="custom-slot">Slot Content</div> });
        expect(getFocusedOption()).not.toBeNull();
        await userEvent.hover(screen.getByText('Slot Content'));
        expect(getFocusedOption()).toBeNull();
    });

    it('Esc 关闭时 onDropdownVisibleChange(false)', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        renderSelect({ defaultOpen: true, onDropdownVisibleChange });
        keyDown('Escape');
        await expectClosed();
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('远程 filter 且结果为空', () => {
        renderSelect({ filter: true, remote: true, optionList: [], defaultOpen: true });
        search('test');
        expect(getOptionList()).not.toBeNull();
        expect(document.querySelector(`.${prefixCls}-option-empty`)).not.toBeNull();
    });

    it('multiple 时清空并调用 onClear', async () => {
        const onClear = vi.fn<NonNullable<SelectProps['onClear']>>();
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon'], showClear: true, onClear, onChange });
        await userEvent.hover(getTrigger());
        await userEvent.click(getClearIcon());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith([]);
        expect(getTagTexts()).toEqual([]);
    });

    it('OptGroup 的其他属性落在分组标题上', () => {
        renderSelect({
            defaultOpen: true,
            children: [
                <Select.OptGroup data-testid="group-title" label="DisabledGroup">
                    <Select.Option value="a-1">a-1</Select.Option>
                </Select.OptGroup>,
            ],
        });
        expect(screen.getByTestId('group-title')).toHaveClass(`${prefixCls}-group`);
        expect(getOptionTexts()).toEqual(['a-1']);
    });

    it('label 为空的 option', () => {
        renderSelect({ defaultOpen: true, optionList: [{ value: 'abc', label: '' }] });
        expect(getOptions()).toHaveLength(1);
    });

    it('PageDown 与 PageUp', () => {
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
        expect(getTrigger()).toHaveAttribute('aria-activedescendant', getFocusedOption()?.id);
    });

    it('不可搜索时按字符移到以它开头的可用选项，关闭时先打开', () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        renderSelect({ optionList: [...defaultList, { value: 'tiktok', label: 'TikTok', disabled: true }, { value: 'tt', label: 'Tt' }], onDropdownVisibleChange });
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
        renderSelect({ multiple: true, optionList: [...defaultList, { value: 'top', label: 'Top Hits' }], onChange });
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
        const getTag = () => document.querySelector<HTMLElement>(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag`) as HTMLElement;
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
        // jsdom has no layout and no Element.scrollTo, which the virtualizer needs
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
        renderSelect({ virtualize: { itemSize: 36 }, defaultValue: 0, optionList: range(100) });
        keyDown('End');
        await waitFor(() => expect(getFocusedOption()).toHaveTextContent(/^option-99$/));
        expect(getTrigger()).toHaveAttribute('aria-activedescendant', getFocusedOption()?.id);
    });

    it('maxHeight 为字符串时原样作为列表的 max-height', () => {
        renderSelect({ defaultOpen: true, maxHeight: '50%' });
        expect((getOptionList() as HTMLElement).style.maxHeight).toBe('50%');
    });

    it('inputProps.class 与搜索框的内置类名合并', () => {
        const { unmount } = renderSelect({ filter: true, multiple: true, inputProps: { class: 'mine' } });
        expect(document.querySelector('.mine')).toHaveClass(`${prefixCls}-input`, `${prefixCls}-input-multiple`);
        unmount();
        renderSelect({ filter: true, searchPosition: 'dropdown', defaultOpen: true, inputProps: { class: 'mine' } });
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
        const triggerRender = (props: TriggerRenderProps) => <div class="custom-trigger">Custom: {props.value.map((v) => String(v.label)).join(',')}</div>;
        renderSelect({ triggerRender, defaultValue: 'abc' });
        expect(document.querySelector('.custom-trigger')).toHaveTextContent(/^Custom: Abc$/);
    });

    it.each(['{Enter}', ' ', '{ArrowDown}'])('triggerRender 内按钮聚焦时 %j 只交给按钮，不打开面板', async (key) => {
        const onPress = vi.fn<(e: MouseEvent) => void>((e) => e.stopPropagation());
        renderSelect({
            triggerRender: () => (
                <div class="custom-trigger">
                    <button type="button" aria-label="清除" onClick={onPress} />
                </div>
            ),
        });
        screen.getByRole('button', { name: '清除' }).focus();
        await userEvent.keyboard(key);
        expect(onPress).toHaveBeenCalledTimes(key === '{ArrowDown}' ? 0 : 1);
        expect(getOptionList()).toBeNull();
    });

    it('triggerRender 配合 onRemove 与 onClear', async () => {
        const triggerRender = (props: TriggerRenderProps) => (
            <div class="custom-trigger">
                <For each={props.value}>
                    {(v) => (
                        <span class="custom-tag" onClick={() => props.onRemove(v)}>
                            {v.label}
                        </span>
                    )}
                </For>
                <button type="button" class="clear-btn" onClick={(e) => props.onClear(e)}>
                    Clear
                </button>
            </div>
        );
        renderSelect({ multiple: true, triggerRender, defaultValue: ['abc', 'hotsoon'] });
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

    it('triggerRender 收到 inputValue、disabled、placeholder，随搜索与 props 更新', () => {
        const triggerRender = (props: TriggerRenderProps) => (
            <div class="custom-trigger">
                <span data-testid="state">{`${props.inputValue}|${props.disabled}|${props.placeholder as string}`}</span>
                <button type="button" onClick={() => props.onSearch('ab')}>
                    Search
                </button>
            </div>
        );
        const { rerender } = renderSelect({ filter: true, placeholder: 'pick', triggerRender });
        expect(screen.getByTestId('state')).toHaveTextContent('|false|pick');
        fireEvent.click(screen.getByRole('button', { name: 'Search' }));
        expect(screen.getByTestId('state')).toHaveTextContent('ab|false|pick');
        rerender({ filter: true, placeholder: 'pick', disabled: true, triggerRender });
        expect(screen.getByTestId('state')).toHaveTextContent('ab|true|pick');
    });

    it('triggerRender 无参调用 onClear 与 onSearch', async () => {
        const onChange = vi.fn<NonNullable<SelectProps<string, true>['onChange']>>();
        const onSearch = vi.fn<NonNullable<SelectProps['onSearch']>>();
        const triggerRender = (props: TriggerRenderProps) => (
            <div class="custom-trigger">
                <span class="custom-value">{props.value.map((v) => String(v.label)).join(',')}</span>
                <button type="button" onClick={() => props.onClear()}>
                    Clear
                </button>
                <button type="button" onClick={() => props.onSearch('ab')}>
                    Search
                </button>
            </div>
        );
        renderSelect({ multiple: true, filter: true, triggerRender, defaultValue: ['abc'], onChange, onSearch });
        await userEvent.click(screen.getByRole('button', { name: 'Search' }));
        expect(onSearch).toHaveBeenCalledWith('ab', undefined);
        await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
        expect(onChange).toHaveBeenLastCalledWith([]);
        expect(document.querySelector('.custom-value')).toHaveTextContent(/^$/);
    });

    it('受控 value 为 undefined 时显示 placeholder', () => {
        renderSelect({ value: undefined, optionList: defaultList, placeholder: 'please select' });
        expect(getSelectionText()).toHaveClass(`${prefixCls}-selection-placeholder`);
        expect(getSelectionText()).toHaveTextContent(/^please select$/);
    });

    it('value={undefined} 按非受控处理：取 defaultValue，选择即更新', async () => {
        renderSelect({ value: undefined, defaultValue: 'abc', optionList: defaultList });
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
        await userEvent.click(getSelectionText() as HTMLElement);
        await userEvent.click(getOptionByText('Hotsoon'));
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

    it('自定义 filter 函数忽略大小写', () => {
        const customFilter = (inputValue: string, option: { label?: unknown }) => String(option.label).toLowerCase().includes(inputValue.toLowerCase());
        renderSelect({ filter: customFilter, defaultOpen: true });
        search('ABC');
        expect(getOptionTexts()).toEqual(['Abc']);
    });

    it('失焦时调用 onBlur 并去掉聚焦样式', () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ onBlur, autofocus: true });
        expect(getTrigger()).toHaveClass(`${prefixCls}-focus`);
        getTrigger().blur();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-focus`);
    });

    it('自定义 emptyContent 元素', () => {
        renderSelect({ defaultOpen: true, optionList: [], emptyContent: <div class="custom-empty">No Data</div> });
        expect(document.querySelector('.custom-empty')).toHaveTextContent(/^No Data$/);
    });

    it('数字 value', () => {
        const numbers = [
            { value: 1, label: 'One' },
            { value: 2, label: 'Two' },
        ];
        const { unmount } = renderSelect({ defaultValue: 1, optionList: numbers });
        expect(getSelectionText()).toHaveTextContent(/^One$/);
        unmount();
        renderSelect({ multiple: true, defaultValue: [1, 2], optionList: numbers });
        expect(getTagTexts()).toEqual(['One', 'Two']);
    });

    it('inputValue 含正则特殊字符时 filter', () => {
        renderSelect({ filter: true, defaultOpen: true });
        search('(test)');
        expect(getOptions()).toHaveLength(0);
        expect(document.querySelector(`.${prefixCls}-option-empty`)).not.toBeNull();
    });

    it('stopPropagation 属性', async () => {
        const onParentClick = vi.fn<() => void>();
        const renderInParent = (stopPropagation: boolean) =>
            render(() => (
                <div onClick={onParentClick}>
                    <Select motion={false} defaultOpen stopPropagation={stopPropagation}>
                        {getOption()}
                    </Select>
                </div>
            ));
        const { unmount } = renderInParent(true);
        await userEvent.click(getOptions()[0]);
        expect(onParentClick).not.toHaveBeenCalled();
        unmount();
        renderInParent(false);
        await userEvent.click(getOptions()[0]);
        expect(onParentClick).toHaveBeenCalledTimes(1);
    });

    it('preventScroll 时 autofocus 照常聚焦', () => {
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        renderSelect({ preventScroll: true, autofocus: true });
        expect(getTrigger()).toHaveFocus();
        expect(focus).toHaveBeenCalledWith(expect.objectContaining({ preventScroll: true }));
    });

    it('renderSelectedItem 配合 isRenderInTag 为 false', () => {
        const renderSelectedItem: RenderMultipleSelectedItemFn = (optionNode) => ({ isRenderInTag: false, content: <span class="custom-selected">{optionNode.label}</span> });
        renderSelect({ multiple: true, defaultValue: ['abc'], renderSelectedItem });
        expect(document.querySelector('.custom-selected')).toHaveTextContent(/^Abc$/);
        expect(document.querySelector('.custom-selected')?.closest(`.${BASE_CLASS_PREFIX}-tag`)).toBeNull();
    });
});

describe('Select 状态同步与键盘', () => {
    it('option 带额外 data 属性', () => {
        renderSelect({ defaultOpen: true, optionList: [{ value: 'abc', label: 'Abc', 'data-testid': 'option-abc' }] });
        expect(screen.getByTestId('option-abc')).toBe(getOptions()[0]);
    });

    it('position 为 bottom', () => {
        renderSelect({ position: 'bottom', defaultOpen: true });
        expect(getWrapper()).toHaveAttribute('x-placement', 'bottom');
    });

    it('label 相同、value 不同的选项替换时显示新标签且不调用 onChange', () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const props = { optionList: [{ value: 'abc1', label: 'Same' }], defaultValue: 'abc1', onChange };
        const { rerender } = renderSelect(props);
        rerender({ ...props, optionList: [{ value: 'abc2', label: 'Same' }], value: 'abc2' });
        expect(getSelectionText()).toHaveTextContent(/^Same$/);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('allowCreate 新建并选中后，新建项标为已选', async () => {
        renderSelect({ allowCreate: true, filter: true, multiple: true, defaultOpen: true });
        search('created');
        await userEvent.click(getOptions()[0]);
        expect(getTagTexts()).toEqual(['created']);
        expect(getOptionByText('created')).toHaveClass(`${prefixCls}-option-selected`);
    });

    it('方向键首尾循环', () => {
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

    it('下拉中最后一个可聚焦元素上按 Tab 关闭并回到触发器', async () => {
        renderSelect({ defaultOpen: true, innerBottomSlot: <button class="slot-btn">Button</button> });
        keyDown('Tab');
        const button = screen.getByRole('button', { name: 'Button' });
        expect(button).toHaveFocus();
        keyDown('Tab', {}, button);
        await expectClosed();
        expect(getTrigger()).toHaveFocus();
    });

    it('optionList 带 key 时 onChange 与 onSelect 收到原 key', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const onSelect = vi.fn<NonNullable<SelectProps['onSelect']>>();
        renderSelect({ defaultOpen: true, onChangeWithObject: true, onChange, onSelect, optionList: [{ value: 'abc', label: 'Abc', key: 'custom-key' }] });
        await userEvent.click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledWith({ value: 'abc', label: 'Abc', key: 'custom-key' });
        expect(onSelect).toHaveBeenCalledWith('abc', { value: 'abc', label: 'Abc', key: 'custom-key' });
    });

    it('multiple 时搜索框宽度随输入变化', () => {
        renderSelect({ multiple: true, filter: true, defaultOpen: true });
        search('test');
        expect(getTriggerInput()).toHaveValue('test');
        expect(getTriggerInput().parentElement).toHaveStyle({ width: '64px' });
    });

    it('聚焦时按 Esc 关闭，焦点与聚焦样式保留', async () => {
        renderSelect({ defaultOpen: true, autofocus: true });
        expect(getTrigger()).toHaveFocus();
        keyDown('Escape');
        await expectClosed();
        expect(getTrigger()).toHaveFocus();
        expect(getTrigger()).toHaveClass(`${prefixCls}-focus`);
    });

    it('maxTagCount 超出时显示 +N', () => {
        renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'], maxTagCount: 2 });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+2']);
    });

    it('不带 showRestTagsPopover 时悬停 +N 不显示其余标签', async () => {
        renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon', 'pipixia'], maxTagCount: 2, showRestTagsPopover: false });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+1']);
        await userEvent.hover(screen.getByText('+1'));
        expect(screen.queryByText('Pipixia')).toBeNull();
    });

    it('ellipsisTrigger 不带 maxTagCount 时显示全部标签', () => {
        renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'], ellipsisTrigger: true });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz']);
    });

    it('ellipsisTrigger 时按宽度折叠标签', () => {
        // jsdom has no layout; a 100px tag area makes the 120px tags overflow
        mockResizeObserver({
            onObserve(element) {
                const width = element.classList.contains(`${BASE_CLASS_PREFIX}-overflow-list`) ? 100 : 120;
                return [{ target: { clientWidth: width }, contentRect: { width } }];
            },
        });
        renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'], ellipsisTrigger: true, maxTagCount: 2 });
        expect(getTagTexts()).toEqual(['Abc', '+3']);
    });

    it('ellipsisTrigger 的 +N 标签带折叠类名', () => {
        renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'], ellipsisTrigger: true, maxTagCount: 1 });
        expect(getTagTexts()).toEqual(['Abc', '+3']);
        expect(screen.getByText('+3').closest(`.${BASE_CLASS_PREFIX}-tag`)).toHaveClass(`${prefixCls}-content-wrapper-collapse-tag`);
    });

    it('点击打开后点击外部调用 onBlur，点击时调用 onFocus', async () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        const onFocus = vi.fn<NonNullable<SelectProps['onFocus']>>();
        renderSelect({ onBlur, onFocus });
        await userEvent.click(getTrigger());
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(getTrigger()).toHaveClass(`${prefixCls}-focus`);
        await userEvent.click(document.body);
        await expectClosed();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('清空搜索词后显示全部选项', () => {
        renderSelect({ filter: true, defaultOpen: true });
        search('a');
        search('');
        expect(getOptions()).toHaveLength(defaultList.length);
    });

    it('multiple 配合 onChangeWithObject 取消选中', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ multiple: true, onChangeWithObject: true, defaultValue: [{ value: 'abc', label: 'Abc' }], onChange, defaultOpen: true });
        await userEvent.click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith([]);
    });

    it('受控 multiple 为空数组时显示 placeholder', () => {
        renderSelect({ multiple: true, value: [], optionList: defaultList, placeholder: 'please select' });
        expect(getTagTexts()).toEqual([]);
        expect(document.querySelector(`.${prefixCls}-selection-placeholder`)).toHaveTextContent(/^please select$/);
    });

    it('defaultValue 配合 onChangeWithObject', () => {
        const { unmount } = renderSelect({ onChangeWithObject: true, defaultValue: { value: 'abc', label: 'Abc' }, optionList: defaultList });
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
        unmount();
        renderSelect({ multiple: true, onChangeWithObject: true, defaultValue: [{ value: 'abc', label: 'Abc' }], optionList: defaultList });
        expect(getTagTexts()).toEqual(['Abc']);
    });

    it('innerBottomSlot 自己的 onMouseEnter 照常触发', async () => {
        const onSlotMouseEnter = vi.fn<() => void>();
        renderSelect({
            defaultOpen: true,
            innerBottomSlot: (
                <div class="inner-slot" onMouseEnter={onSlotMouseEnter}>
                    Slot
                </div>
            ),
        });
        await userEvent.hover(screen.getByText('Slot'));
        expect(onSlotMouseEnter).toHaveBeenCalledTimes(1);
        expect(getFocusedOption()).toBeNull();
    });

    it('关闭后清空搜索词', async () => {
        const onSearch = vi.fn<NonNullable<SelectProps['onSearch']>>();
        renderSelect({ defaultOpen: true, filter: true, onSearch });
        search('abc');
        keyDown('Escape');
        await expectClosed();
        expect(onSearch).toHaveBeenLastCalledWith('', expect.anything());
    });

    it('Shift + Tab 离开时关闭并调用 onBlur', async () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ defaultOpen: true, innerBottomSlot: <button class="slot-btn">Button</button>, onBlur });
        getTrigger().focus();
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

    it('有搜索词时 Backspace 不删除标签', () => {
        renderSelect({ multiple: true, filter: true, defaultValue: ['abc', 'hotsoon'], defaultOpen: true });
        search('test');
        keyDown('Backspace');
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
    });

    it('optionList 含正则特殊字符时 filter', () => {
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
        expect(onChange).toHaveBeenCalledWith('newValue');
    });

    it('autoClearSearchValue 为 false 时受控 value 变化保留搜索词', () => {
        const props = { filter: true, autoClearSearchValue: false, value: 'abc', defaultOpen: true };
        const { rerender } = renderSelect(props);
        search('test');
        rerender({ ...props, value: 'hotsoon' });
        expect(getTriggerInput()).toHaveValue('test');
    });

    it('onChangeWithObject 时不在 optionList 中的值显示其 label', () => {
        const { unmount } = renderSelect({ onChangeWithObject: true, value: { value: 'notExist', label: 'Not Exist' }, optionList: defaultList });
        expect(getSelectionText()).toHaveTextContent(/^Not Exist$/);
        unmount();
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

    it('optionList 变化后保留已选的旧标签', () => {
        const props = { multiple: true, defaultValue: ['abc', 'notExist'], optionList: defaultList };
        const { rerender } = renderSelect(props);
        expect(getTagTexts()).toEqual(['Abc', 'notExist']);
        rerender({ ...props, optionList: [{ value: 'new1', label: 'New1' }] });
        expect(getTagTexts()).toEqual(['Abc', 'notExist']);
    });

    it('renderSelectedItem 的 onClose 移除选中项', async () => {
        const renderSelectedItem: RenderMultipleSelectedItemFn = (optionNode, { onClose }) => ({
            isRenderInTag: false,
            content: (
                <span class="custom-tag-content" onClick={(e) => onClose(optionNode.label, e)}>
                    {optionNode.label}
                </span>
            ),
        });
        renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon'], maxTagCount: 3, showRestTagsPopover: true, renderSelectedItem });
        const getItems = () => Array.from(document.querySelectorAll('.custom-tag-content')).map((n) => n.textContent);
        expect(getItems()).toEqual(['Abc', 'Hotsoon']);
        await userEvent.click(screen.getByText('Abc'));
        expect(getItems()).toEqual(['Hotsoon']);
    });

    it('禁用时点击不打开也不调用 onFocus', async () => {
        const onFocus = vi.fn<NonNullable<SelectProps['onFocus']>>();
        renderSelect({ disabled: true, onFocus });
        await userEvent.click(getTrigger());
        expect(getOptionList()).toBeNull();
        expect(onFocus).not.toHaveBeenCalled();
    });

    it('filter 与 clickToHide 时再次点击关闭', async () => {
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

    it('搜索框聚焦时根元素与输入框都带聚焦样式', async () => {
        renderSelect({ filter: true });
        await userEvent.click(getTrigger());
        expect(getTriggerInput()).toHaveFocus();
        expect(getRoot()).toHaveClass(`${prefixCls}-focus`);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-focus`)).not.toBeNull();
    });

    it('max 为 1 时选第二项调用 onExceed', async () => {
        const onExceed = vi.fn<NonNullable<SelectProps['onExceed']>>();
        renderSelect({ multiple: true, max: 1, defaultValue: ['abc'], onExceed, defaultOpen: true });
        await userEvent.click(getOptions()[1]);
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(getTagTexts()).toEqual(['Abc']);
    });

    it('受控且 filter 时单选后关闭', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ filter: true, value: 'abc', onChange });
        await userEvent.click(getTrigger());
        await userEvent.click(getOptions()[1]);
        await expectClosed();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('hotsoon');
    });

    describe('combobox 语义', () => {
        it('combobox 由 aria-label 或 aria-labelledby 命名，否则回退到语言包', () => {
            const [props, setProps] = createSignal<SelectProps<unknown>>({ defaultValue: 'a' });
            const [label, setLabel] = createSignal(false);
            render(() => (
                <>
                    {label() && <span id="city-label">Home city</span>}
                    <Select optionList={[{ value: 'a', label: 'A' }]} {...props()} />
                </>
            ));
            expect(screen.getByRole('combobox', { name: zh_CN.Select.label })).toHaveTextContent('A');
            setProps({ 'aria-label': 'City' });
            expect(screen.getByRole('combobox', { name: 'City' })).toBeInTheDocument();
            setLabel(true);
            setProps({ 'aria-labelledby': 'city-label' });
            expect(screen.getByRole('combobox', { name: 'Home city' })).not.toHaveAttribute('aria-label');
        });

        it('关闭状态的 combobox 按 ArrowDown 与 ArrowUp 打开', async () => {
            render(() => <Select optionList={defaultList} />);
            const combobox = screen.getByRole('combobox');
            combobox.focus();
            await userEvent.keyboard('{ArrowDown}');
            expect(combobox).toHaveAttribute('aria-expanded', 'true');
            await userEvent.keyboard('{Escape}');
            expect(combobox).toHaveAttribute('aria-expanded', 'false');
            await userEvent.keyboard('{ArrowUp}');
            expect(combobox).toHaveAttribute('aria-expanded', 'true');
        });

        it('仅在打开时 aria-activedescendant 指向已渲染的选项', async () => {
            render(() => <Select defaultActiveFirstOption optionList={defaultList} />);
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
            const renderOptionItem = (props: OptionRenderProps) => (
                <div id={props.id} style={props.style} aria-selected={props.selected} role="option" onClick={(e) => props.onClick(e)} onMouseEnter={(e) => props.onMouseEnter(e)}>
                    {props.label}
                </div>
            );
            const { unmount } = render(() => <Select allowCreate defaultOpen filter optionList={[{ value: 'a', label: 'A' }]} />);
            const input = screen.getByRole('combobox');
            await userEvent.type(input, 'new{ArrowDown}');
            const created = screen.getByRole('option', { name: /new/ });
            expect(created.id).not.toBe('');
            expect(input).toHaveAttribute('aria-activedescendant', created.id);
            unmount();

            render(() => <Select defaultOpen optionList={[{ value: 'a', label: 'A' }]} renderOptionItem={renderOptionItem} />);
            screen.getByRole('combobox').focus();
            await userEvent.keyboard('{ArrowDown}');
            const custom = screen.getByRole('option', { name: 'A' });
            expect(custom.id).not.toBe('');
            expect(screen.getByRole('combobox')).toHaveAttribute('aria-activedescendant', custom.id);
        });

        it('触发器中的搜索输入框作为 combobox（ARIA 1.2）', async () => {
            const { unmount } = render(() => <Select defaultValue="a" filter optionList={[{ value: 'a', label: 'A' }]} />);
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

            render(() => <Select multiple filter optionList={[{ value: 'a', label: 'A' }]} />);
            expect(screen.getByRole('combobox').tagName).toBe('INPUT');
            expect(getRoot()).toHaveAttribute('tabindex', '-1');
        });

        it('搜索输入框位于下拉中时，触发器仍是可访问的 combobox', async () => {
            render(() => <Select multiple filter optionList={[{ value: 'a', label: 'A' }]} searchPosition="dropdown" />);
            const combobox = screen.getByRole('combobox');
            expect(combobox).toBe(getRoot());
            expect(combobox).toHaveAttribute('tabindex', '0');
            await userEvent.click(combobox);
            const searchBox = await screen.findByRole('textbox', { name: zh_CN.Select.label });
            expect(searchBox).toHaveAttribute('aria-autocomplete', 'list');
            expect(searchBox).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
        });
    });

    it('filter 时匹配分组内选项的 label', () => {
        renderSelect({
            filter: true,
            defaultOpen: true,
            children: [
                <Select.OptGroup label="Fruits">
                    <Select.Option value="apple">Apple</Select.Option>
                    <Select.Option value="banana">Banana</Select.Option>
                </Select.OptGroup>,
            ],
        });
        search('Apple');
        expect(getOptionTexts()).toEqual(['Apple']);
    });

    it('restTagsPopoverProps 传给 +N 的弹层', async () => {
        renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'], maxTagCount: 2, showRestTagsPopover: true, restTagsPopoverProps: { position: 'top' } });
        await userEvent.hover(screen.getByText('+2'));
        await waitFor(() => expect(screen.getByText('Pipixia')).toBeInTheDocument());
        expect(screen.getByText('Pipixia').closest(`.${BASE_CLASS_PREFIX}-popover-wrapper`)).toHaveAttribute('x-placement', 'top');
    });

    it('maxTagCount 为 0 时显示全部标签', () => {
        renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon'], maxTagCount: 0 });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
    });

    it('renderOptionItem 的 focused 随悬停与方向键更新', async () => {
        let mouseEnterCalled = false;
        const renderOptionItem = (props: OptionRenderProps) => (
            <div
                class={`custom-option ${props.class} ${props.focused ? 'focused' : ''}`}
                style={props.style}
                onClick={(e) => props.onClick(e)}
                onMouseEnter={(e) => {
                    mouseEnterCalled = true;
                    props.onMouseEnter(e);
                }}
            >
                {props.label}
            </div>
        );
        renderSelect({ defaultOpen: true, optionList: defaultList, renderOptionItem });
        await userEvent.hover(screen.getByText('Pipixia'));
        expect(mouseEnterCalled).toBe(true);
        expect(screen.getByText('Pipixia')).toHaveClass('focused');
        expect(screen.getByText('Abc')).not.toHaveClass('focused');
        keyDown('ArrowDown');
        expect(screen.getByText('TopBuzz')).toHaveClass('focused');
    });

    it('已选项带选中类名与 aria-selected', () => {
        renderSelect({ defaultOpen: true, defaultValue: 'hotsoon', optionList: defaultList });
        expect(document.querySelector(`.${prefixCls}-option-selected`)).toHaveTextContent(/^Hotsoon$/);
        expect(document.querySelector(`.${prefixCls}-option-selected`)).toHaveAttribute('aria-selected', 'true');
    });

    it('defaultOpen 时 Esc 关闭后焦点在触发器', async () => {
        renderSelect({ defaultOpen: true });
        keyDown('Escape');
        await expectClosed();
        expect(getTrigger()).toHaveFocus();
    });

    it('面板打开时搜索框失焦不关闭', () => {
        renderSelect({ filter: true, defaultOpen: true });
        fireEvent.focusOut(getTriggerInput());
        expect(getTriggerInput()).not.toBeNull();
        expect(getOptionList()).not.toBeNull();
    });

    it('焦点在下拉中时触发器失焦不调用 onBlur', () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ defaultOpen: true, innerBottomSlot: <button class="slot-btn">Button</button>, onBlur });
        keyDown('Tab');
        expect(screen.getByRole('button', { name: 'Button' })).toHaveFocus();
        fireEvent.focusOut(getTrigger());
        expect(onBlur).not.toHaveBeenCalled();
        expect(getOptionList()).not.toBeNull();
    });

    it('下拉中第一个可聚焦元素上按 Shift + Tab 回到触发器', () => {
        renderSelect({ defaultOpen: true, innerBottomSlot: <button class="slot-btn">Button</button> });
        keyDown('Tab');
        const button = screen.getByRole('button', { name: 'Button' });
        expect(button).toHaveFocus();
        keyDown('Tab', { shiftKey: true }, button);
        expect(getTrigger()).toHaveFocus();
        expect(getOptionList()).not.toBeNull();
    });

    it('清空输入后去掉新建项', () => {
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
});

describe('Select 子节点与边界', () => {
    it('children 含 null 与 undefined', () => {
        renderSelect({ defaultOpen: true, children: [null, <Select.Option value="a">A</Select.Option>, undefined, <Select.Option value="b">B</Select.Option>] });
        expect(getOptionTexts()).toEqual(['A', 'B']);
    });

    it('多选模式下 value 不是数组时给出开发期警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        renderSelect({ multiple: true, value: 'abc' });
        expect(warn).toHaveBeenCalledWith('Warning: [Semi Select] defaultValue/value should be array type in multiple mode');
    });

    it('children 含无效元素时忽略它并给出公开的组件名', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        renderSelect({ defaultOpen: true, children: [<Select.Option value="a">A</Select.Option>, <div>Invalid</div>] });
        expect(getOptionTexts()).toEqual(['A']);
        expect(screen.queryByText('Invalid')).toBeNull();
        const messages = warn.mock.calls.map(([message]) => String(message));
        expect(messages.some((message) => message.includes('`Select.Option` or `Select.OptGroup`'))).toBe(true);
    });

    it('OptGroup 里不是 Option 的子节点被忽略并警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        render(() => (
            <Select defaultOpen motion={false}>
                <Select.OptGroup label="G">
                    text
                    <span>node</span>
                    <Select.Option value="a">A</Select.Option>
                </Select.OptGroup>
            </Select>
        ));
        expect(getOptionTexts()).toEqual(['A']);
        expect(warn).toHaveBeenCalledWith('Warning: [Semi Select] The children of `Select.OptGroup` should be `Select.Option`');
    });

    it('OptGroup 内含 null、false、嵌套数组时正常解析', () => {
        const cond = false;
        renderSelect({
            defaultOpen: true,
            children: [
                <Select.OptGroup label="G1">
                    {cond && <Select.Option value="x">X</Select.Option>}
                    {null}
                    <Select.Option value="a">A</Select.Option>
                    {[<Select.Option value="n">N</Select.Option>]}
                </Select.OptGroup>,
                <Select.OptGroup label="G2">
                    {false}
                    <Select.Option value="b">B</Select.Option>
                </Select.OptGroup>,
                <Select.OptGroup label="G3">{null}</Select.OptGroup>,
                <Select.OptGroup label="G4">
                    <Select.Option value="c">C</Select.Option>
                    {undefined}
                </Select.OptGroup>,
            ],
        });
        expect(getOptionTexts()).toEqual(['A', 'N', 'B', 'C']);
    });

    it('卸载后不残留外部点击监听', () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        const { unmount } = renderSelect({ defaultOpen: true, onBlur });
        expect(getOptionList()).not.toBeNull();
        unmount();
        expect(getOptionList()).toBeNull();
        fireEvent.mouseDown(document.body);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('showRestTagsPopover 时 style 变化不影响 +N', () => {
        const props = { multiple: true, maxTagCount: 2, showRestTagsPopover: true, defaultValue: ['abc', 'hotsoon', 'pipixia'], optionList: defaultList, style: { width: '200px' } };
        const { rerender } = renderSelect(props);
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+1']);
        rerender({ ...props, style: { width: '100px' } });
        expect(getTrigger()).toHaveStyle({ width: '100px' });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+1']);
    });

    it.each(['inner-top', 'outer-top', 'outer-bottom'])('悬停 %s 插槽时取消选项高亮', async (slot) => {
        const key = { 'inner-top': 'innerTopSlot', 'outer-top': 'outerTopSlot', 'outer-bottom': 'outerBottomSlot' }[slot] as string;
        renderSelect({ defaultOpen: true, [key]: <div>Slot</div> });
        expect(getFocusedOption()).not.toBeNull();
        await userEvent.hover(document.querySelector(`.${prefixCls}-option-list-${slot}-slot`) as HTMLElement);
        expect(getFocusedOption()).toBeNull();
    });

    it('showRestTagsPopover 配合 maxTagCount 1', () => {
        renderSelect({ multiple: true, maxTagCount: 1, showRestTagsPopover: true, defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'], optionList: defaultList });
        expect(getTagTexts()).toEqual(['Abc', '+3']);
    });

    it('ellipsisTrigger 渲染折叠容器', () => {
        renderSelect({ multiple: true, ellipsisTrigger: true, maxTagCount: 2, defaultValue: ['abc', 'hotsoon', 'pipixia'], optionList: defaultList });
        expect(document.querySelector(`.${prefixCls}-content-wrapper-collapse`)).not.toBeNull();
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+1']);
    });

    it('选中项变化时 ellipsisTrigger 保持 OverflowList 挂载', async () => {
        renderSelect({ multiple: true, ellipsisTrigger: true, maxTagCount: 2, defaultValue: ['abc', 'hotsoon', 'pipixia'], optionList: defaultList });
        const overflowList = (document.querySelector(`.${prefixCls}-content-wrapper-collapse`) as HTMLElement).firstElementChild;
        expect(overflowList).not.toBeNull();
        await userEvent.click(getTrigger());
        await userEvent.click(getOptionByText('TopBuzz'));
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+2']);
        expect((document.querySelector(`.${prefixCls}-content-wrapper-collapse`) as HTMLElement).firstElementChild).toBe(overflowList);
    });

    it('ellipsisTrigger 时 defaultValue 变化不改变显示', () => {
        const props = { multiple: true, ellipsisTrigger: true, maxTagCount: 2, defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'], optionList: defaultList };
        const { rerender } = renderSelect(props);
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+2']);
        rerender({ ...props, defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao', 'xigua'] });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+2']);
    });

    it('ellipsisTrigger 时选中项超过 maxTagCount 后出现 +N', async () => {
        renderSelect({ multiple: true, ellipsisTrigger: true, maxTagCount: 2, defaultValue: ['abc', 'hotsoon'], optionList: defaultList });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
        await userEvent.click(getTrigger());
        await userEvent.click(getOptionByText('Pipixia'));
        expect(document.querySelector(`.${prefixCls}-content-wrapper-collapse-tag`)).toHaveTextContent(/^\+1$/);
        await userEvent.click(getOptionByText('TopBuzz'));
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+2']);
    });

    it('ellipsisTrigger 时选中项不超过 maxTagCount 不显示 +N', () => {
        renderSelect({ multiple: true, ellipsisTrigger: true, maxTagCount: 3, defaultValue: ['abc', 'hotsoon'], optionList: defaultList });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
        expect(document.querySelector(`.${prefixCls}-content-wrapper-collapse-tag`)).toBeNull();
    });

    it('Backspace 跳过禁用的已选项', async () => {
        const optionList = [
            { value: 'disabled1', label: 'Disabled 1', disabled: true },
            { value: 'disabled2', label: 'Disabled 2', disabled: true },
            { value: 'normal', label: 'Normal' },
        ];
        const { unmount } = renderSelect({ multiple: true, filter: true, defaultValue: ['disabled1', 'disabled2'], optionList });
        await userEvent.click(getTrigger());
        keyDown('Backspace', {}, getTriggerInput());
        expect(getTagTexts()).toEqual(['Disabled 1', 'Disabled 2']);
        unmount();
        renderSelect({ multiple: true, filter: true, defaultValue: ['disabled1', 'normal'], optionList });
        await userEvent.click(getTrigger());
        keyDown('Backspace', {}, getTriggerInput());
        expect(getTagTexts()).toEqual(['Disabled 1']);
    });

    it('打开后 Esc 关闭不调用 onChange', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ multiple: true, defaultValue: ['abc'], optionList: defaultList, onChange });
        await userEvent.click(getTrigger());
        keyDown('Escape');
        await expectClosed();
        expect(onChange).not.toHaveBeenCalled();
        expect(getTagTexts()).toEqual(['Abc']);
    });

    it('Tab 聚焦后按 Enter 打开', async () => {
        renderSelect({ optionList: defaultList });
        await userEvent.tab();
        expect(getTrigger()).toHaveFocus();
        keyDown('Enter');
        expect(getOptionList()).not.toBeNull();
    });

    it('高亮项被移除后 Enter 不选择', async () => {
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
        renderSelect({ defaultOpen: true, filter: true, defaultActiveFirstOption: false, optionList: defaultList, onChange });
        await userEvent.hover(getOptions()[0]);
        search('p');
        expect(getFocusedOption()).toBeNull();
        keyDown('Enter', {}, getTriggerInput());
        expect(onChange).not.toHaveBeenCalled();
    });

    it('再次选择已选项不调用 onChange', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ defaultValue: 'abc', optionList: defaultList, onChange });
        await userEvent.click(getTrigger());
        await userEvent.click(getOptionByText('Abc'));
        await expectClosed();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('面板关闭时 Tab 离开调用 onBlur', async () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        const { unmount } = renderSelect({ optionList: defaultList, onBlur });
        await userEvent.tab();
        expect(getTrigger()).toHaveFocus();
        await userEvent.tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getOptionList()).toBeNull();
        unmount();

        const onClickToHideBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ optionList: defaultList, onBlur: onClickToHideBlur, clickToHide: true });
        await userEvent.click(getTrigger());
        await userEvent.click(getTrigger());
        await expectClosed();
        expect(onClickToHideBlur).not.toHaveBeenCalled();
        await userEvent.tab();
        expect(onClickToHideBlur).toHaveBeenCalledTimes(1);
    });

    it('搜索框上 Shift + Tab 离开时关闭并调用 onBlur', async () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ defaultOpen: true, filter: true, optionList: defaultList, innerBottomSlot: <button type="button">Button</button>, onBlur });
        getTriggerInput().focus();
        await userEvent.tab({ shift: true });
        await expectClosed();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('悬停插槽后 Enter 只关闭', async () => {
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
        keyDown('Tab', {}, document.querySelector(`.${prefixCls}-option-list-wrapper`) as HTMLElement);
        await expectClosed();
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('面板容器上其他键不关闭', () => {
        renderSelect({ defaultOpen: true, filter: true, optionList: defaultList });
        keyDown(' ', {}, document.querySelector(`.${prefixCls}-option-list-wrapper`) as HTMLElement);
        expect(getOptionList()).not.toBeNull();
    });

    it('fix #1584: defaultValue 为 null 时，单选配合 renderSelectedItem 显示 placeholder', () => {
        const renderSelectedItem = vi.fn<RenderSingleSelectedItemFn>((item) => <div class="custom-selected">{item.label}</div>);
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
        const renderCreateItem = vi.fn<NonNullable<SelectProps['renderCreateItem']>>((inputValue, _focused, style) => (
            <div class="custom-create" style={{ padding: '6px 12px', ...style }}>
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
        expect(renderCreateItem.mock.lastCall?.[2]).toEqual(expect.objectContaining({ position: 'absolute', top: '36px' }));
        expect(document.querySelector('.custom-create')).toHaveTextContent(/^输入 500$/);
        expect(document.querySelector('.custom-create')).toHaveStyle({ position: 'absolute', top: '36px', height: '36px' });
        expect(getOptionByText('500333 抖音直播间-哈哈哈')).toHaveStyle({ top: '0px' });
    });

    it('fix #2853: 过滤时只显示匹配的分组', async () => {
        renderSelect({
            filter: true,
            children: [
                <Select.OptGroup label="a">
                    <Select.Option value="a-1">a-1</Select.Option>
                    <Select.Option value="a-2">a-2</Select.Option>
                </Select.OptGroup>,
                <Select.OptGroup label="b">
                    <Select.Option value="b-1">b-1</Select.Option>
                    <Select.Option value="b-2">b-2</Select.Option>
                </Select.OptGroup>,
                <Select.OptGroup label="c">
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
    });

    it('生成的 id 是合法的 CSS id 选择器', async () => {
        renderSelect();
        await userEvent.click(getTrigger());
        const trigger = getTrigger();
        expect(document.querySelector(`#${trigger.id}`)).toBe(trigger);
        expect(document.querySelector(`#${trigger.getAttribute('aria-controls')}`)).toBe(getOptionList());
    });
});

describe('Select 行为基线', () => {
    it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Select: { size: 'small', placeholder: 'global' } };
        renderSelect();
        expect(getTrigger()).toHaveClass(`${prefixCls}-small`);
        expect(getSelectionText()).toHaveTextContent(/^global$/);
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
        expect(document.getElementById(trigger.getAttribute('aria-controls') as string)).toBe(getOptionList());
        expect(trigger.getAttribute('aria-activedescendant')).toBe(getOptions()[0].id);
    });

    it('清空非受控单选时，先上报 onChange(undefined)，再调用 onClear', async () => {
        const calls: unknown[][] = [];
        renderSelect({ defaultValue: 'abc', showClear: true, onChange: (v: unknown) => calls.push(['change', v]), onClear: () => calls.push(['clear']) });
        await userEvent.hover(getTrigger());
        await userEvent.click(getClearIcon());
        expect(calls).toEqual([['change', undefined], ['clear']]);
        expect(getSelectionText()).toHaveClass(`${prefixCls}-selection-placeholder`);
    });

    it('通过 triggerRender 删除非受控单选的值时上报变化', async () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const onDeselect = vi.fn<NonNullable<SelectProps['onDeselect']>>();
        const triggerRender = (props: TriggerRenderProps) => (
            <div class="custom-trigger">
                <For each={props.value}>
                    {(v) => (
                        <button type="button" onClick={() => props.onRemove(v)}>
                            {v.label}
                        </button>
                    )}
                </For>
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
        const calls: unknown[][] = [];
        renderSelect({ onSelect: (v: unknown) => calls.push(['select', v]), onChange: (v: unknown) => calls.push(['change', v]) });
        await userEvent.click(getTrigger());
        await userEvent.click(getOptionByText('Hotsoon'));
        expect(calls).toEqual([
            ['select', 'hotsoon'],
            ['change', 'hotsoon'],
        ]);
        await expectClosed();
        expect(getSelectionText()).toHaveTextContent(/^Hotsoon$/);
    });

    it('打开、选择与 blur 各上报一次', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ onDropdownVisibleChange, onChange, onBlur });
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

    it('defaultOpen 只上报一次打开，点击外部关闭一次', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        renderSelect({ defaultOpen: true, onDropdownVisibleChange });
        expect(getOptionList()).not.toBeNull();
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
        fireEvent.mouseDown(document.body);
        await expectClosed();
        expect(onDropdownVisibleChange.mock.calls.filter(([v]) => v === false)).toHaveLength(1);
    });

    it('defaultOpen 配合 autofocus 与 filter 时只打开一次', () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        renderSelect({ defaultOpen: true, autofocus: true, filter: true, onDropdownVisibleChange });
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
        const seen: object[] = [];
        const filter = (input: string, option: { label?: unknown }) => {
            seen.push(option);
            return String(option.label).toLowerCase().includes(input);
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
        const internal = ['_show', '_selected', '_scrollIndex', '_parentGroup', '_keyInJsx', '_inputCreateOnly', '_notExist'];
        const internalKeys = (option: object) => Object.keys(option).filter((key) => internal.includes(key));
        const seen: object[] = [];
        const onChange = vi.fn<(value: unknown) => void>();
        renderSelect({
            multiple: true,
            onChangeWithObject: true,
            onChange,
            defaultOpen: true,
            filter: (_: string, option: object) => {
                seen.push(option);
                return true;
            },
            children: (
                <Select.OptGroup label="Group">
                    <Option value="a" label="A" />
                    <Option value="b" label="B" />
                </Select.OptGroup>
            ),
            renderOptionItem: (props: OptionRenderProps) => {
                seen.push({ ...props });
                return (
                    <div id={props.id} aria-selected={props.selected} role="option" onClick={(e) => props.onClick(e)}>
                        {String(props.label)}
                    </div>
                );
            },
            renderSelectedItem: (option: object) => {
                seen.push(option);
                return { isRenderInTag: true, content: 'tag' };
            },
        });
        search('A');
        fireEvent.click(screen.getByRole('option', { name: 'A' }));
        await waitFor(() => expect(onChange).toHaveBeenCalled());
        seen.push(...(onChange.mock.calls[0][0] as object[]));
        expect(seen.length).toBeGreaterThan(2);
        expect(seen.flatMap(internalKeys)).toEqual([]);
    });
});

describe('Select 审计修复', () => {
    it('Tab 进入多选可搜索 Select 的搜索框后，方向键与 Enter 可用', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        render(() => (
            <>
                <button type="button">before</button>
                <Select motion={false} multiple filter optionList={defaultList} onChange={onChange} />
            </>
        ));
        await userEvent.tab();
        await userEvent.tab();
        expect(getTriggerInput()).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(getOptionList()).not.toBeNull();
        await userEvent.keyboard('{ArrowDown}');
        const focusedText = getFocusedOption()?.textContent;
        await userEvent.keyboard('{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getTagTexts()).toEqual([focusedText]);
    });

    it('onChangeWithObject 时 value 含 null 不抛错', () => {
        const { unmount } = renderSelect({ onChangeWithObject: true, value: null, placeholder: 'pick', optionList: defaultList });
        expect(getSelectionText()).toHaveTextContent('pick');
        unmount();
        const { unmount: unmountMultiple } = renderSelect({ multiple: true, onChangeWithObject: true, value: [null, { value: 'hotsoon', label: 'Hotsoon' }], optionList: defaultList });
        expect(getTagTexts()).toEqual(['Hotsoon']);
        unmountMultiple();
        renderSelect({ multiple: true, onChangeWithObject: true, value: [null, { value: 'ghost', label: 'Ghost' }], optionList: defaultList });
        expect(getTagTexts()).toEqual(['Ghost']);
    });

    it('Tab 进入触发器触发一次 onFocus，之后点击打开不再重复触发，Tab 离开触发 onBlur', async () => {
        const onFocus = vi.fn<NonNullable<SelectProps['onFocus']>>();
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ onFocus, onBlur, optionList: defaultList });
        await userEvent.tab();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][0].type).toBe('focusin');
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

    it('点击标签关闭时 onDeselect 收到选项的完整字段', async () => {
        const onDeselect = vi.fn<NonNullable<SelectProps['onDeselect']>>();
        renderSelect({ multiple: true, defaultValue: ['abc'], optionList: [{ value: 'abc', label: 'Abc', extra: 'x' }], onDeselect });
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`) as HTMLElement);
        expect(onDeselect).toHaveBeenCalledWith('abc', expect.objectContaining({ extra: 'x' }));
    });

    it('filter 时 optionList 条目缺 label 不抛错', () => {
        renderSelect({ defaultOpen: true, filter: true, optionList: [{ value: 'only-value' }, { value: 'b', label: 'Bee' }] });
        search('only');
        expect(getOptions()).toHaveLength(1);
        search('bee');
        expect(getOptionTexts()).toEqual(['Bee']);
    });

    it('首尾选项禁用时方向键仍然循环', () => {
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

    it('选项 children 变化而 value 不变时，已选文案随之更新', () => {
        const options = (word: string) =>
            [1, 2].map((n) => (
                <Select.Option value={n}>
                    <span>{`${n} ${word}`}</span>
                </Select.Option>
            ));
        const { rerender, unmount } = renderSelect({ value: 1, children: options('条/页') });
        expect(getSelectionText()).toHaveTextContent('1 条/页');
        rerender({ value: 1, children: options('per page') });
        expect(getSelectionText()).toHaveTextContent('1 per page');
        unmount();

        const uncontrolled = renderSelect({ defaultValue: 2, children: options('条/页') });
        uncontrolled.rerender({ defaultValue: 2, children: options('per page') });
        expect(getSelectionText()).toHaveTextContent('2 per page');
    });

    it('选项 label 读取 signal 时，已选文案与选项随之更新', () => {
        const [word, setWord] = createSignal('条/页');
        renderSelect({
            value: 1,
            defaultOpen: true,
            children: [1, 2].map((n) => (
                <Select.Option value={n}>
                    <span>{`${n} ${word()}`}</span>
                </Select.Option>
            )),
        });
        expect(getSelectionText()).toHaveTextContent('1 条/页');
        setWord('per page');
        expect(getSelectionText()).toHaveTextContent('1 per page');
        expect(getOptionTexts()).toEqual(['1 per page', '2 per page']);
    });

    it('多选只有搜索词时点击清除不触发 onChange', () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        renderSelect({ multiple: true, filter: true, showClear: true, optionList: defaultList, onChange });
        fireEvent.click(getTrigger());
        search('ab');
        fireEvent.click(document.querySelector(`.${prefixCls}-clear`) as HTMLElement);
        expect(getTriggerInput()).toHaveValue('');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('搜索中 optionList 变化后仍按关键字过滤', () => {
        const { rerender } = renderSelect({ filter: true, defaultOpen: true, optionList: defaultList });
        search('new1');
        expect(getOptions()).toHaveLength(0);
        rerender({
            filter: true,
            defaultOpen: true,
            optionList: [
                { value: 'new1', label: 'New1' },
                { value: 'new2', label: 'New2' },
            ],
        });
        expect(getOptionTexts()).toEqual(['New1']);
    });

    it('受控值在搜索中变化时列表仍按关键字过滤', () => {
        const { rerender } = renderSelect({ filter: true, defaultOpen: true, optionList: defaultList, value: 'abc' });
        search('hot');
        rerender({ filter: true, defaultOpen: true, optionList: defaultList, value: 'pipixia' });
        expect(getOptionTexts()).toEqual(['Hotsoon']);
    });

    it('Esc 关闭时只清空一次搜索词', async () => {
        const onSearch = vi.fn<NonNullable<SelectProps['onSearch']>>();
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        renderSelect({ filter: true, optionList: defaultList, onSearch, onDropdownVisibleChange });
        fireEvent.click(getTrigger());
        search('ab');
        keyDown('Escape', {}, getTriggerInput());
        await expectClosed();
        expect(onSearch).toHaveBeenLastCalledWith('', expect.objectContaining({ key: 'Escape' }));
        expect(onSearch.mock.calls.filter(([value]) => value === '')).toHaveLength(1);
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false]]);
    });

    it('size 为 small 时 +N 标签与其余标签同尺寸，default 时为 large', () => {
        const { unmount } = renderSelect({ multiple: true, size: 'small', maxTagCount: 1, defaultValue: ['abc', 'hotsoon', 'pipixia'], optionList: defaultList });
        const restTag = screen.getByText('+2').closest(`.${BASE_CLASS_PREFIX}-tag`);
        expect(restTag).toHaveClass(`${BASE_CLASS_PREFIX}-tag-small`);
        expect(restTag).not.toHaveClass(`${BASE_CLASS_PREFIX}-tag-large`);
        unmount();
        renderSelect({ multiple: true, size: 'default', defaultValue: ['abc'], optionList: defaultList });
        expect(document.querySelector(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag`)).toHaveClass(`${BASE_CLASS_PREFIX}-tag-large`);
    });

    it('OptGroup 以 group 角色暴露，名称为分组标题', () => {
        renderSelect({
            defaultOpen: true,
            children: [
                <Select.OptGroup label="G1">
                    <Select.Option value="a">A</Select.Option>
                    <Select.Option value="b">B</Select.Option>
                </Select.OptGroup>,
                <Select.OptGroup label="G2">
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
        fireEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`) as HTMLElement);
        expect(onDeselect.mock.calls[0][1]).toEqual({ value: 'ghost', label: 'ghost' });
    });

    it('元素 label 的选项交给回调的对象不带内部字段，label 为 value', () => {
        const onSelect = vi.fn<NonNullable<SelectProps['onSelect']>>();
        renderSelect({ defaultOpen: true, children: [<Select.Option value="a">{<b>A</b>}</Select.Option>], onSelect });
        fireEvent.click(getOptions()[0]);
        expect(onSelect).toHaveBeenCalledWith('a', { value: 'a', label: 'a' });
    });

    it('鼠标点选与 Enter 交给 onSelect 的选项对象相同', () => {
        const onSelect = vi.fn<NonNullable<SelectProps['onSelect']>>();
        const optionList = [
            { value: 'a', label: 'A', class: 'extra' },
            { value: 'b', label: 'B', class: 'extra' },
        ];
        renderSelect({ multiple: true, defaultOpen: true, optionList, onSelect });
        fireEvent.click(getOptionByText('A'));
        keyDown('ArrowDown');
        keyDown('Enter');
        expect(onSelect.mock.calls.map(([, option]) => option)).toEqual(optionList);
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

    it('禁用时 defaultOpen 与 autofocus 不打开下拉，也不通知 onDropdownVisibleChange', () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        renderSelect({ disabled: true, defaultOpen: true, onDropdownVisibleChange });
        renderSelect({ disabled: true, autofocus: true, filter: true, onDropdownVisibleChange });
        expect(getOptionList()).toBeNull();
        expect(onDropdownVisibleChange).not.toHaveBeenCalled();
    });

    it('焦点在面板插槽内的可聚焦元素上时，Esc 关闭下拉并把焦点交回触发器', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        renderSelect({ optionList: defaultList, innerBottomSlot: <button type="button">slot</button>, onDropdownVisibleChange });
        fireEvent.click(getTrigger());
        const slotButton = screen.getByRole('button', { name: 'slot' });
        slotButton.focus();
        expect(fireEvent.keyDown(slotButton, { key: 'Escape' })).toBe(false);
        await expectClosed();
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        expect(getTrigger()).toHaveFocus();
    });

    it('根元素上使用方的 onClick、onKeyDown、onMouseDown 照常调用，下拉仍能打开', () => {
        const onClick = vi.fn<(e: MouseEvent) => void>();
        const onKeyDown = vi.fn<(e: KeyboardEvent) => void>();
        const onMouseDown = vi.fn<(e: MouseEvent) => void>();
        renderSelect({ onClick, onKeyDown, onMouseDown });
        fireEvent.mouseDown(getTrigger());
        fireEvent.click(getTrigger());
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onMouseDown).toHaveBeenCalledTimes(1);
        expect(getOptionList()).not.toBeNull();
        keyDown('ArrowDown');
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(getFocusedOption()).toHaveTextContent(/^Hotsoon$/);
    });

    it('加载中 combobox 不输出 aria-activedescendant', () => {
        renderSelect({ filter: true, multiple: true, defaultOpen: true, loading: true, optionList: defaultList });
        expect(getTrigger()).not.toHaveAttribute('aria-activedescendant');
    });

    it('virtualize 时滚动虚拟列表触发 onListScroll', () => {
        const onListScroll = vi.fn<NonNullable<SelectProps['onListScroll']>>();
        renderSelect({ defaultOpen: true, optionList: range(300), virtualize: { itemSize: 36, height: 270 }, onListScroll });
        const scroller = (getOptionList() as HTMLElement).firstElementChild as HTMLElement;
        scroller.scrollTop = 360;
        fireEvent.scroll(scroller);
        expect(onListScroll).toHaveBeenCalledTimes(1);
        expect(onListScroll.mock.calls[0][0].target).toBe(scroller);
    });

    it('inputProps 的 onBlur 与 inputRef 不替换 Select 自己的搜索框处理', () => {
        const onBlur = vi.fn<(e: FocusEvent) => void>();
        let input: HTMLInputElement | undefined;
        renderSelect({ filter: true, showClear: true, defaultValue: 'abc', optionList: defaultList, inputProps: { onBlur, inputRef: (node: HTMLInputElement) => (input = node) } });
        fireEvent.click(screen.getByRole('button', { name: zh_CN.Select.clear }));
        expect(getTriggerInput()).toHaveFocus();
        expect(input).toBe(getTriggerInput());
        getTriggerInput().blur();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getRoot().querySelector('input')).toBeNull();
    });

    it('过滤时留下的选项保持同一个节点', () => {
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

    it('下拉打开时在触发器内的 +N 浮层里按下鼠标，不关闭下拉也不触发 onBlur', async () => {
        const onBlur = vi.fn<NonNullable<SelectProps['onBlur']>>();
        renderSelect({ multiple: true, maxTagCount: 1, showRestTagsPopover: true, defaultValue: ['abc', 'hotsoon'], optionList: defaultList, onBlur });
        fireEvent.click(getTrigger());
        await userEvent.hover(screen.getByText('+1'));
        const restTag = await waitFor(() => {
            const tag = Array.from(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag`)).find((node) => node.textContent === 'Hotsoon' && !getRoot().contains(node));
            expect(tag).toBeDefined();
            return tag as HTMLElement;
        });
        fireEvent.mouseDown(restTag);
        expect(getOptionList()).not.toBeNull();
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('在面板内已打开的嵌套 Popover 里按下鼠标不关闭下拉，在外部按下才关闭', async () => {
        renderSelect({
            defaultOpen: true,
            optionList: defaultList,
            innerBottomSlot: (
                <Popover aria-label="Nested" content={<button type="button">inside nested</button>} motion={false} trigger="custom" visible>
                    {(getTriggerProps) => (
                        <button type="button" {...getTriggerProps()}>
                            nested trigger
                        </button>
                    )}
                </Popover>
            ),
        });
        fireEvent.mouseDown(await screen.findByRole('button', { name: 'inside nested' }));
        expect(getOptionList()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        await expectClosed();
    });

    it('InputGroup 下发的 size 与 disabled 作用于 Select，自身 disabled 优先', () => {
        const { unmount } = render(() => (
            <InputGroup size="small" disabled>
                <Select motion={false} optionList={defaultList} />
            </InputGroup>
        ));
        expect(getTrigger()).toHaveClass(`${prefixCls}-small`, `${prefixCls}-disabled`);
        unmount();
        render(() => (
            <InputGroup disabled>
                <Select motion={false} disabled={false} optionList={defaultList} />
            </InputGroup>
        ));
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-disabled`);
    });

    it('Select 自带的 size 优先于 InputGroup 的 size，没传时取组的，包装元素内也一样', () => {
        render(() => (
            <InputGroup size="large">
                <div>
                    <Select motion={false} size="small" optionList={defaultList} />
                    <Select motion={false} optionList={defaultList} />
                </div>
            </InputGroup>
        ));
        const [own, inherit] = document.querySelectorAll(`.${prefixCls}`);
        expect(own).toHaveClass(`${prefixCls}-small`);
        expect(own).not.toHaveClass(`${prefixCls}-large`);
        expect(inherit).toHaveClass(`${prefixCls}-large`);
    });

    it('InputGroup 内可搜索 Select 的搜索框不受分组影响', async () => {
        render(() => (
            <InputGroup size="large">
                <Select motion={false} filter optionList={defaultList} />
            </InputGroup>
        ));
        await userEvent.click(getTrigger());
        expect(getTriggerInput()).not.toBeDisabled();
        search('abc');
        expect(getOptionTexts()).toEqual(['Abc']);
    });
});

describe('Select 的 optionList 与 value 变化', () => {
    it('受控值不变、optionList 改了该项的 label 时，触发器显示新 label', () => {
        const { rerender } = renderSelect({ value: 'abc', optionList: [{ value: 'abc', label: 'Abc' }] });
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
        rerender({ value: 'abc', optionList: [{ value: 'abc', label: 'Abc 2' }] });
        expect(getSelectionText()).toHaveTextContent(/^Abc 2$/);
    });

    it('非受控 defaultValue 的选项晚到时，触发器从值换成 label', () => {
        const { rerender } = renderSelect({ defaultValue: 'abc', optionList: [] });
        expect(getSelectionText()).toHaveTextContent(/^abc$/);
        rerender({ defaultValue: 'abc', optionList: [{ value: 'abc', label: 'Abc' }] });
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
    });

    it('受控值与 optionList 同时变化时，触发器显示新值在新列表中的 label', () => {
        const { rerender } = renderSelect({ value: 'abc', optionList: [{ value: 'abc', label: 'Abc' }] });
        rerender({ value: 'new', optionList: [{ value: 'new', label: 'New' }] });
        expect(getSelectionText()).toHaveTextContent(/^New$/);
    });
});

describe('全局 Input 默认值不给 Select 内部输入框加清除按钮与前后缀', () => {
    const marker = /mark-(prefix|suffix|label|before|after)/;

    it('触发器搜索框', async () => {
        semiGlobal.config.overrideDefaultProps = {
            Input: { showClear: true, prefix: 'mark-prefix', suffix: 'mark-suffix', insetLabel: 'mark-label', addonBefore: 'mark-before', addonAfter: 'mark-after' },
        };
        const { container } = render(() => <Select defaultValue={['a']} multiple filter optionList={[{ value: 'a', label: 'A' }]} />);
        await userEvent.type(container.querySelector('input') as HTMLInputElement, 'a');
        expect(container.querySelector('input')).toHaveValue('a');
        expect(document.body.textContent).not.toMatch(marker);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
    });

    it('下拉搜索框', async () => {
        semiGlobal.config.overrideDefaultProps = {
            Input: { suffix: 'mark-suffix', insetLabel: 'mark-label', addonBefore: 'mark-before', addonAfter: 'mark-after' },
        };
        render(() => <Select defaultOpen filter optionList={[{ value: 'a', label: 'A' }]} searchPosition="dropdown" />);
        await userEvent.type(screen.getByRole('textbox'), 'a');
        expect(document.body.textContent).not.toMatch(marker);
    });
});

describe('ref 上的 SelectHandle 方法', () => {
    const renderWithRef = (props: Props = {}) => {
        let element: SelectElement | undefined;
        const result = renderSelect({ ...props, ref: (node: SelectElement) => (element = node) });
        return { ...result, ref: () => element as SelectElement };
    };

    it('ref.rePosition 让下拉层跟随移动后的触发器', () => {
        const { ref } = renderWithRef({ optionList: defaultList });
        ref().open();
        const popup = screen.getByRole('listbox').closest<HTMLElement>('[popover]');
        expect(popup?.style.left).toBe('0px');
        // the trigger moved without scrolling or resizing
        const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 50, 80, 20));
        onTestFinished(() => rect.mockRestore());
        ref().rePosition();
        expect(popup?.style.left).toBe('100px');
    });

    it('open、close、selectAll、deselectAll', async () => {
        const { ref, unmount } = renderWithRef({ filter: true, multiple: true, optionList: defaultList });
        ref().open();
        expect(getOptionList()).not.toBeNull();
        ref().close();
        await expectClosed();
        ref().selectAll();
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz']);
        ref().deselectAll();
        expect(getTagTexts()).toEqual([]);
        unmount();

        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const single = renderWithRef({ filter: true, optionList: defaultList, onChange });
        single.ref().selectAll();
        expect(warn).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
        expect(getSelectionText()).toHaveTextContent(/^$/);
    });

    it('open 通知 onDropdownVisibleChange，已关闭时 close 不上报', () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        const { ref } = renderWithRef({ onDropdownVisibleChange });
        ref().close();
        expect(onDropdownVisibleChange).not.toHaveBeenCalled();
        ref().open();
        expect(getOptionList()).not.toBeNull();
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
    });

    it('连续 open 两次，关闭后不残留外部点击监听', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<SelectProps['onDropdownVisibleChange']>>();
        const { ref } = renderWithRef({ onDropdownVisibleChange });
        ref().open();
        ref().open();
        fireEvent.mouseDown(document.body);
        await expectClosed();
        fireEvent.mouseDown(document.body);
        expect(onDropdownVisibleChange.mock.calls.filter(([visible]) => visible === false)).toHaveLength(1);
    });

    it('search 与 clearInput', () => {
        const onSearch = vi.fn<NonNullable<SelectProps['onSearch']>>();
        const { ref } = renderWithRef({ filter: true, defaultOpen: true, onSearch });
        ref().search('abc');
        expect(getTriggerInput()).toHaveValue('abc');
        expect(getOptionTexts()).toEqual(['Abc']);
        expect(onSearch).toHaveBeenLastCalledWith('abc', undefined);
        ref().clearInput();
        expect(getTriggerInput()).toHaveValue('');
        expect(getOptions()).toHaveLength(defaultList.length);
        expect(onSearch).toHaveBeenLastCalledWith('', undefined);
    });

    it('搜索框为空时 clearInput 不调用 onSearch', () => {
        const onSearch = vi.fn<NonNullable<SelectProps['onSearch']>>();
        const { ref } = renderWithRef({ filter: true, onSearch });
        ref().clearInput();
        expect(onSearch).not.toHaveBeenCalled();
    });

    it('selectAll 跳过禁用项与被搜索隐藏的项，保留范围外已选项', () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const optionList = [...defaultList, { value: 'hot2', label: 'Hot2', disabled: true }];
        const { ref } = renderWithRef({ multiple: true, filter: true, defaultValue: ['abc'], optionList, onChange });
        ref().open();
        ref().search('hot');
        ref().selectAll();
        expect(onChange).toHaveBeenLastCalledWith(['abc', 'hotsoon']);
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
    });

    it('selectAll 超过 max 时调用 onExceed 且不超选', () => {
        const onExceed = vi.fn<NonNullable<SelectProps['onExceed']>>();
        const { ref } = renderWithRef({ multiple: true, max: 2, optionList: defaultList, onExceed });
        ref().selectAll();
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(onExceed).toHaveBeenCalledWith(expect.objectContaining({ value: 'pipixia' }));
    });

    it('受控时父组件不接受变更，selectAll 不改变标签', () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const { ref } = renderWithRef({ multiple: true, value: [], optionList: defaultList, onChange });
        ref().selectAll();
        expect(onChange).toHaveBeenCalledWith(['abc', 'hotsoon', 'pipixia', 'toutiao']);
        expect(getTagTexts()).toEqual([]);
    });

    it('selectAll 配合 onChangeWithObject 时回传的对象不含内部字段', () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const { ref } = renderWithRef({ multiple: true, onChangeWithObject: true, optionList: defaultList, onChange });
        ref().selectAll();
        const [value] = onChange.mock.calls[0] as unknown as [Record<string, unknown>[]];
        expect(value.map((item) => Object.keys(item).filter((key) => key.startsWith('_')))).toEqual([[], [], [], []]);
    });

    it('没有已选项时 deselectAll 不调用 onChange，有已选项时调用', () => {
        const onChange = vi.fn<NonNullable<SelectProps['onChange']>>();
        const { ref } = renderWithRef({ multiple: true, optionList: defaultList, onChange });
        ref().deselectAll();
        expect(onChange).not.toHaveBeenCalled();
        ref().selectAll();
        ref().deselectAll();
        expect(onChange).toHaveBeenLastCalledWith([]);
    });

    it('fix #2465: 从插槽经 ref 关闭后再点击外部，去掉聚焦样式', async () => {
        for (const multiple of [false, true]) {
            let element: SelectElement | undefined;
            const { unmount } = renderSelect({
                ref: (node: SelectElement) => (element = node),
                multiple,
                outerBottomSlot: (
                    <button type="button" onClick={() => element?.close()}>
                        close
                    </button>
                ),
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
});

describe('Select 类型', () => {
    type Item = { value: string; label: string };
    type OnChangeArg<P extends { onChange?: (value: never) => void }> = Parameters<NonNullable<P['onChange']>>[0];

    it('onChange 的参数随 multiple 收窄', () => {
        expectTypeOf<OnChangeArg<SelectProps<string>>>().toEqualTypeOf<string | undefined>();
        expectTypeOf<OnChangeArg<SelectProps<string, true>>>().toEqualTypeOf<string[]>();
        expectTypeOf<OnChangeArg<SelectProps<string, boolean>>>().toEqualTypeOf<string | string[] | undefined>();
        expectTypeOf<OnChangeArg<SelectProps<Item>>>().toEqualTypeOf<Item | undefined>();
        expectTypeOf<OnChangeArg<SelectProps<Item, true>>>().toEqualTypeOf<Item[]>();
    });

    it('optionList 接受 interface 声明的选项', () => {
        interface OptionItem {
            value: string;
            label: string;
            extra: number;
        }
        expectTypeOf<OptionItem[]>().toExtend<NonNullable<SelectProps['optionList']>>();
    });

    it('onSelect 与 onDeselect 的 value 是选项的原始 value', () => {
        type RawValue = string | number | undefined;
        expectTypeOf<Parameters<NonNullable<SelectProps<string, true>['onSelect']>>[0]>().toEqualTypeOf<RawValue>();
        expectTypeOf<Parameters<NonNullable<SelectProps<Item, true>['onDeselect']>>[0]>().toEqualTypeOf<RawValue>();
    });

    it('onBlur 在点击外部时收到原生 MouseEvent', () => {
        type BlurEvent = Parameters<NonNullable<SelectProps['onBlur']>>[0];
        expectTypeOf<MouseEvent>().toExtend<BlurEvent>();
        expectTypeOf<FocusEvent>().toExtend<BlurEvent>();
    });

    it('virtualize 必须带 itemSize', () => {
        expectTypeOf<{ height: number }>().not.toExtend<NonNullable<SelectProps['virtualize']>>();
        expectTypeOf<{ itemSize: number }>().toExtend<NonNullable<SelectProps['virtualize']>>();
    });

    it('triggerRender 的 placeholder 为 JSX.Element，没有 onChange 别名', () => {
        expectTypeOf<TriggerRenderProps['placeholder']>().toEqualTypeOf<JSX.Element>();
        expectTypeOf<TriggerRenderProps>().not.toHaveProperty('onChange');
    });

    it('searchPosition 只接受 trigger 与 dropdown', () => {
        expectTypeOf<SelectProps['searchPosition']>().toEqualTypeOf<'trigger' | 'dropdown' | undefined>();
    });

    it('renderSelectedItem 的签名随 multiple 收窄', () => {
        expectTypeOf<NonNullable<SelectProps<string>['renderSelectedItem']>>().toEqualTypeOf<RenderSingleSelectedItemFn>();
        expectTypeOf<NonNullable<SelectProps<string, true>['renderSelectedItem']>>().toEqualTypeOf<RenderMultipleSelectedItemFn>();
    });
});
