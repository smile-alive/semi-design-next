import { createSignal, type JSX, onMount } from 'solid-js';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { countLiveListeners } from '@test/utils/solid';
import AutoComplete, { type AutoCompleteProps, type AutoCompleteTriggerRenderProps, type BaseDataItem } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import { type FormApi, Form, FormAutoComplete } from '../../form';
import Popover from '../../popover';
import Tag from '../../tag';
import Tooltip from '../../tooltip';

type Props = Record<string, unknown>;

const optionCls = `${BASE_CLASS_PREFIX}-autocomplete-option`;

function renderAc(initial: Props = {}) {
    const [props, setProps] = createSignal(initial);
    // a spread call is a function source, so keys added by a later rerender stay reactive
    const result = render(() => <AutoComplete {...(props() as AutoCompleteProps)} />);
    return { ...result, rerender: (next: Props) => setProps(next) };
}

const getInput = () => screen.getByRole('combobox') as HTMLInputElement;
const getRoot = () => document.querySelector(`.${BASE_CLASS_PREFIX}-autocomplete`) as HTMLElement;
const getList = () => document.querySelector<HTMLElement>(`.${optionCls}-list`);
const getOptions = () => Array.from(document.querySelectorAll<HTMLElement>(`.${optionCls}`));
const getOptionTexts = () => getOptions().map((option) => option.textContent);
const getFocusedOption = () => document.querySelector(`.${optionCls}-focused`);
const getPopupWrapper = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-popover-wrapper`) as HTMLElement;
const getClearBtn = () => document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement;
const focusInput = () => getInput().focus();
const keyNames = { UP: 'ArrowUp', DOWN: 'ArrowDown', ENTER: 'Enter', ESC: 'Escape', TAB: 'Tab' };
const pressKey = (name: keyof typeof keyNames) => fireEvent.keyDown(getInput(), { key: keyNames[name] });
const typeText = (value: string) => fireEvent.input(getInput(), { target: { value } });
// the clear button reacts to mousedown
const clickClear = () => fireEvent.mouseDown(getClearBtn());
const expectClosed = () => waitFor(() => expect(getList()).toBeNull());

// option offsetTop is read from inline marginTop by vitest/setup.ts, which lets updateScrollTop compute a real value
const layoutData = (values: string[]) => values.map((value, i) => ({ value, label: value, style: { 'margin-top': `${i * 40}px` } }));

const stringData = ['semi', 'ies', 'design', 'platform'];
const objectData = [
    { email: 'semi@abc.com', value: 'abc' },
    { email: 'semi@bytedance.com', value: 'bytedance' },
    { email: 'semi@vigo.com', value: 'vigo' },
];

const commonProps = { motion: false };

afterEach(() => {
    vi.restoreAllMocks();
    semiGlobal.config.overrideDefaultProps = {};
});

describe('AutoComplete', () => {
    it('自定义 class 与 style', () => {
        const { container } = renderAc({ class: 'test', style: { color: 'red' } });
        const trigger = container.querySelector('div.test');
        expect(trigger).toHaveClass(`${BASE_CLASS_PREFIX}-autocomplete`);
        expect(trigger).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('设置 placeholder', () => {
        renderAc({ placeholder: 'semi' });
        expect(getInput()).toHaveAttribute('placeholder', 'semi');
    });

    it('不同尺寸', () => {
        const { container, rerender } = renderAc({ size: 'small' });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-small`)).not.toBeNull();
        rerender({ size: 'large' });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-large`)).not.toBeNull();
    });

    it('disabled 为 true 时组件禁用', () => {
        const { container } = renderAc({ disabled: true });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-autocomplete-disabled`)).not.toBeNull();
        expect(getInput()).toBeDisabled();
    });

    it('自定义 prefix 与 suffix', () => {
        renderAc({ prefix: <div class="prefix">prefix content</div>, suffix: <div class="suffix">suffix content</div> });
        expect(screen.getByText('prefix content')).toHaveClass('prefix');
        expect(screen.getByText('suffix content')).toHaveClass('suffix');
    });

    it('自定义 dropdownClassName 与 dropdownStyle', () => {
        renderAc({ dropdownClassName: 'ddc', dropdownStyle: { color: 'red' }, defaultOpen: true, ...commonProps });
        const list = document.querySelector(`.${optionCls}-list.ddc`);
        expect(list).not.toBeNull();
        expect(list).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('字符串 dropdownStyle 与 maxHeight 合并', () => {
        renderAc({ dropdownStyle: 'color: red', maxHeight: 120, defaultOpen: true, ...commonProps });
        expect(getList()).toHaveStyle({ color: 'rgb(255, 0, 0)', maxHeight: '120px' });
    });

    it('不同位置', () => {
        renderAc({ position: 'top', data: stringData, defaultOpen: true, ...commonProps });
        expect(getPopupWrapper()).toHaveAttribute('x-placement', 'top');
    });

    it('defaultValue 不在 data 候选中', () => {
        renderAc({ defaultValue: 'semi', data: [], ...commonProps });
        expect(getInput()).toHaveValue('semi');
    });

    it('defaultValue 可匹配 data', () => {
        renderAc({ defaultValue: 'semi', data: stringData, ...commonProps });
        expect(getInput()).toHaveValue('semi');
    });

    it('输入变化时触发 onSearch', () => {
        const onSearch = vi.fn<NonNullable<AutoCompleteProps<string>['onSearch']>>();
        renderAc({ onSearch });
        typeText('semi');
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('semi');
    });

    it('defaultOpen 为 true 且 data 非空时显示 optionList', () => {
        renderAc({ defaultOpen: true, data: stringData, ...commonProps });
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        const candidate = (getList() as HTMLElement).children;
        expect(candidate).toHaveLength(4);
        expect(candidate[0]).toHaveTextContent(/^semi$/);
        expect(candidate[1]).toHaveTextContent(/^ies$/);
    });

    it('data 变化时更新候选项', () => {
        const props = { defaultOpen: true, data: ['semi'], ...commonProps };
        const { rerender } = renderAc(props);
        expect(getOptionTexts()).toEqual(['semi']);
        rerender({ ...props, data: ['ies', 'design'] });
        expect(getOptionTexts()).toEqual(['ies', 'design']);
        rerender({ ...props, data: [{ label: 'new', value: 'new' }] });
        expect(getOptionTexts()).toEqual(['new']);
    });

    it('父组件挂载时就改了 data，显示新候选项', () => {
        function Demo() {
            const [data, setData] = createSignal(['semi']);
            onMount(() => setData(['ies', 'design']));
            return <AutoComplete defaultOpen data={data()} {...commonProps} />;
        }
        render(() => <Demo />);
        expect(getOptionTexts()).toEqual(['ies', 'design']);
    });

    it('loading 为 true 时隐藏 optionList 并显示加载中', () => {
        renderAc({ loading: true, defaultOpen: true, data: stringData, ...commonProps });
        const loading = document.querySelector(`.${BASE_CLASS_PREFIX}-autocomplete-loading-wrapper`) as HTMLElement;
        expect(loading.querySelector(`.${BASE_CLASS_PREFIX}-spin`)).not.toBeNull();
        expect(getOptions()).toHaveLength(0);
    });

    it('点击候选项时触发 onSelect', async () => {
        const onSelect = vi.fn<(value: unknown) => void>();
        renderAc({ defaultOpen: true, data: stringData, onSelect, ...commonProps });
        await userEvent.click(getOptions()[0]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('semi');
    });

    it('onSelectWithObject 为 true 时以对象回调', async () => {
        const onSelect = vi.fn<(value: unknown) => void>();
        renderAc({ defaultOpen: true, data: objectData, onSelect, onSelectWithObject: true, ...commonProps });
        await userEvent.click(getOptions()[0]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining(objectData[0]));
    });

    it('点击 AutoComplete 后显示候选列表', async () => {
        renderAc({ data: stringData, ...commonProps });
        expect(getList()).toBeNull();
        await userEvent.click(getInput());
        expect(getList()).not.toBeNull();
        expect(getOptionTexts()).toEqual(stringData);
    });

    it('renderSelectedItem 决定选中后输入框的文本', async () => {
        renderAc({ data: objectData, defaultOpen: true, renderSelectedItem: (option: { email: string }) => option.email, ...commonProps });
        await userEvent.click(getOptions()[0]);
        expect(getInput()).toHaveValue(objectData[0].email);
    });

    it('受控模式下选中时上报 renderSelectedItem 的文本，输入框仍显示 value', async () => {
        const onChange = vi.fn<NonNullable<AutoCompleteProps<string>['onChange']>>();
        renderAc({
            data: [
                { name: '夏可漫', label: '夏可漫', value: 'xiakeman@example.com', abbr: 'XK' },
                { name: '申悦', label: '申悦', value: 'shenyue@example.com', abbr: 'SY' },
            ],
            motion: false,
            defaultOpen: true,
            renderSelectedItem: (option: { abbr: string }) => option.abbr,
            onChange,
            value: '',
        });
        await userEvent.click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledWith('XK');
        expect(getInput()).toHaveValue('');
    });

    it('受控 value 变化时更新输入框', () => {
        const props = { data: [], ...commonProps, value: 'semi' };
        const { rerender } = renderAc(props);
        expect(getInput()).toHaveValue('semi');
        rerender({ ...props, value: 'ies' });
        expect(getInput()).toHaveValue('ies');
    });

    it('父组件挂载时就改了 value，高亮新值对应的候选项', () => {
        function Demo() {
            const [value, setValue] = createSignal('semi');
            onMount(() => setValue('design'));
            return <AutoComplete defaultOpen data={stringData} {...commonProps} value={value()} />;
        }
        render(() => <Demo />);
        expect(getFocusedOption()).toHaveTextContent(/^design$/);
    });

    it('autofocus 聚焦输入框并触发 onFocus', () => {
        const onFocus = vi.fn<NonNullable<AutoCompleteProps<string>['onFocus']>>();
        const { container } = renderAc({ autofocus: true, onFocus });
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveFocus();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-focus`)).not.toBeNull();
    });

    it('emptyContent 在 data 为空时显示', () => {
        renderAc({ defaultOpen: true, data: [], emptyContent: <div class="custom-empty-content">emptycontent</div>, ...commonProps });
        expect(screen.getByText('emptycontent')).toHaveClass('custom-empty-content');
    });

    it('emptyContent 在 data 非空时不显示', () => {
        renderAc({ defaultOpen: true, data: [1, 2, 3], emptyContent: <div class="custom-empty-content">emptycontent</div>, ...commonProps });
        expect(screen.queryByText('emptycontent')).toBeNull();
        expect(getOptionTexts()).toEqual(['1', '2', '3']);
    });

    it('emptyContent 默认为空，列表不渲染内容', () => {
        renderAc({ data: [], defaultOpen: true, ...commonProps });
        expect(document.querySelector(`.${optionCls}-empty`)).toBeNull();
        expect(getList()).toBeEmptyDOMElement();
    });

    it('onChange 在输入与选中时各触发一次', async () => {
        const onChange = vi.fn<NonNullable<AutoCompleteProps<string>['onChange']>>();
        renderAc({ defaultOpen: true, onChange, data: ['hello', 'bytedance', 'semi'], showClear: true, motion: false });
        typeText('abc');
        expect(onChange).toHaveBeenLastCalledWith('abc');
        await userEvent.click(getOptions()[0]);
        expect(onChange).toHaveBeenLastCalledWith('hello');
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('maxHeight', () => {
        renderAc({ maxHeight: 400, data: ['a', 'b', 'c'], defaultOpen: true, ...commonProps });
        expect(getList()).toHaveStyle({ maxHeight: '400px' });
    });

    // `--semi-tooltip-trigger-width` holds the trigger's width in the browser; jsdom has no layout, so only the CSS
    // wiring is checked here and the browser project covers the resulting width
    it('下拉最小宽度跟随触发器宽度，dropdownMatchSelectWidth 为 false 时不设', () => {
        const { rerender } = renderAc({ defaultOpen: true, style: { width: '50%' }, ...commonProps });
        expect(getPopupWrapper().style.minWidth).toBe('var(--semi-tooltip-trigger-width)');
        rerender({ defaultOpen: true, dropdownMatchSelectWidth: false, ...commonProps });
        expect(getPopupWrapper().style.minWidth).toBe('');
    });

    it('焦点离开输入框时触发 onBlur，收到原生 focusout', () => {
        const onBlur = vi.fn<NonNullable<AutoCompleteProps<string>['onBlur']>>();
        renderAc({ onBlur, ...commonProps });
        focusInput();
        expect(onBlur).not.toHaveBeenCalled();
        getInput().blur();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onBlur.mock.calls[0][0].type).toBe('focusout');
    });

    it('输入框获得焦点时触发 onFocus，收到原生 focusin', () => {
        const onFocus = vi.fn<NonNullable<AutoCompleteProps<string>['onFocus']>>();
        renderAc({ onFocus, ...commonProps });
        focusInput();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][0].type).toBe('focusin');
    });

    it('ArrowDown 高亮下一个选项', () => {
        renderAc({ defaultOpen: true, data: stringData, defaultActiveFirstOption: true, ...commonProps });
        expect(getFocusedOption()).toHaveTextContent('semi');
        focusInput();
        pressKey('DOWN');
        expect(getList()).not.toBeNull();
        expect(getFocusedOption()).toHaveTextContent('ies');
    });

    it('ArrowUp 高亮上一个选项', () => {
        renderAc({ defaultOpen: true, data: stringData, defaultActiveFirstOption: true, ...commonProps });
        focusInput();
        pressKey('UP');
        expect(getList()).not.toBeNull();
        expect(getFocusedOption()).toHaveTextContent('platform');
    });

    it('Esc 关闭下拉', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<AutoCompleteProps<string>['onDropdownVisibleChange']>>();
        renderAc({ defaultOpen: true, data: stringData, onDropdownVisibleChange, ...commonProps });
        expect(getList()).not.toBeNull();
        focusInput();
        pressKey('ESC');
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        await expectClosed();
    });

    it('Esc 在下拉打开时被认领（preventDefault），关闭时不认领', () => {
        renderAc({ defaultOpen: true, data: stringData, ...commonProps });
        expect(pressKey('ESC')).toBe(false);
        expect(pressKey('ESC')).toBe(true);
    });

    it('Enter 选中高亮项并关闭', async () => {
        const onSelect = vi.fn<(value: unknown) => void>();
        renderAc({ defaultOpen: true, data: stringData, defaultActiveFirstOption: true, onSelect, ...commonProps });
        focusInput();
        pressKey('ENTER');
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('semi');
        expect(getInput()).toHaveValue('semi');
        await expectClosed();
    });

    it('showClear 为 true 且有值时显示清除按钮，可自定义 clearIcon', () => {
        renderAc({ showClear: true, defaultValue: 'semi', clearIcon: <span class="custom-clear-icon">X</span>, ...commonProps });
        expect(getClearBtn().querySelector('.custom-clear-icon')).not.toBeNull();
    });

    it('点击清除按钮时触发 onClear', () => {
        const onClear = vi.fn<() => void>();
        renderAc({ onClear, showClear: true, defaultValue: 'test', ...commonProps });
        clickClear();
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it.each(['{Enter}', ' '])('Tab 可到达有名称的清除按钮，%s 可回到输入框', async (key) => {
        const onClear = vi.fn<() => void>();
        const onChange = vi.fn<NonNullable<AutoCompleteProps<string>['onChange']>>();
        renderAc({ data: ['semi', 'design'], showClear: true, defaultValue: 'semi', onClear, onChange });
        await userEvent.click(getInput());
        await userEvent.tab();
        const clear = screen.getByRole('button', { name: zh_CN.Input.clear });
        expect(clear).toHaveFocus();
        await userEvent.keyboard(key);
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenLastCalledWith('');
        expect(getInput()).toHaveValue('');
        expect(getInput()).toHaveFocus();
    });

    it('validateStatus 显示错误与警告状态', () => {
        const { container, rerender } = renderAc({ validateStatus: 'error', ...commonProps });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-error`)).not.toBeNull();
        rerender({ validateStatus: 'warning', ...commonProps });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-warning`)).not.toBeNull();
    });

    it('defaultActiveFirstOption 默认激活第一个选项', () => {
        renderAc({ defaultOpen: true, data: stringData, defaultActiveFirstOption: true, ...commonProps });
        expect(getOptions()[0]).toHaveClass(`${optionCls}-focused`);
        expect(document.querySelectorAll(`.${optionCls}-focused`)).toHaveLength(1);
    });

    it('motion 为 false 时禁用动画', () => {
        renderAc({ motion: false, defaultOpen: true, data: stringData });
        expect(getOptionTexts()).toEqual(stringData);
        expect(getPopupWrapper().className).not.toMatch(/animation/);
    });

    it('渲染 insetLabel', () => {
        const { container } = renderAc({ insetLabel: <span class="inset-label">Label</span>, insetLabelId: 'inset-label-id', ...commonProps });
        expect(screen.getByText('Label')).toHaveClass('inset-label');
        expect(container.querySelector('#inset-label-id')).toContainElement(screen.getByText('Label'));
    });

    it('prefix 为 0 时渲染 0 而不是 insetLabel', () => {
        const { container } = renderAc({ prefix: 0, insetLabel: 'Label', ...commonProps });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-prefix`)).toHaveTextContent(/^0$/);
    });

    it('renderItem 自定义渲染选项', () => {
        renderAc({ renderItem: (option: string) => <div class="custom-option-item">{option}</div>, data: stringData, defaultOpen: true, ...commonProps });
        const items = document.querySelectorAll('.custom-option-item');
        expect(Array.from(items).map((item) => item.textContent)).toEqual(stringData);
    });

    it.each([
        [false, true],
        [true, false],
    ])('stopPropagation 为 %s 时，点击候选项是否到达外层 onClick：%s', async (stopPropagation, reached) => {
        const onParentClick = vi.fn<() => void>();
        render(() => (
            <div role="presentation" onClick={onParentClick}>
                <AutoComplete stopPropagation={stopPropagation} defaultOpen data={stringData} {...commonProps} />
            </div>
        ));
        await userEvent.click(getOptions()[0]);
        expect(onParentClick).toHaveBeenCalledTimes(reached ? 1 : 0);
    });

    it('stopPropagation 时选项上的 mousedown 不到达外层', () => {
        const onParentMouseDown = vi.fn<() => void>();
        render(() => (
            <div role="presentation" onMouseDown={onParentMouseDown}>
                <AutoComplete stopPropagation defaultOpen data={stringData} {...commonProps} />
            </div>
        ));
        fireEvent.mouseDown(getOptions()[0]);
        expect(onParentMouseDown).not.toHaveBeenCalled();
    });

    it('把 aria 属性传给 input', () => {
        renderAc({
            'aria-label': 'autocomplete input',
            'aria-labelledby': 'label-id',
            'aria-describedby': 'desc-id',
            'aria-invalid': true,
            'aria-errormessage': 'error-msg',
            'aria-required': true,
            ...commonProps,
        });
        const input = getInput();
        expect(input).toHaveAttribute('aria-label', 'autocomplete input');
        expect(input).toHaveAttribute('aria-labelledby', 'label-id');
        expect(input).toHaveAttribute('aria-describedby', 'desc-id');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-errormessage', 'error-msg');
        expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('按键时 onKeyDown 在 AutoComplete 处理之后触发', () => {
        const onKeyDown = vi.fn<(e: KeyboardEvent) => void>();
        renderAc({ data: stringData, defaultOpen: true, onKeyDown, ...commonProps });
        focusInput();
        pressKey('DOWN');
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(onKeyDown.mock.calls[0][0].key).toBe('ArrowDown');
        expect(getList()).not.toBeNull();
        expect(getFocusedOption()).toHaveTextContent('semi');
    });

    it('id 落在 combobox input 上，label 的 for 可以指向它', () => {
        render(() => (
            <>
                <label for="my-autocomplete">City</label>
                <AutoComplete id="my-autocomplete" data={stringData} {...commonProps} />
            </>
        ));
        expect(getInput()).toHaveAttribute('id', 'my-autocomplete');
        expect(getRoot()).not.toHaveAttribute('id');
        expect(screen.getByRole('combobox', { name: 'City' })).toBe(getInput());
    });

    it('FormAutoComplete 的 Form label 可聚焦并命名 input', () => {
        render(() => (
            <Form>
                <FormAutoComplete data={stringData} field="city" label="City" {...commonProps} />
            </Form>
        ));
        expect(screen.getByRole('combobox', { name: 'City' })).toBe(getInput());
        expect(document.querySelector('label')?.control).toBe(getInput());
    });

    it('formApi.reset 后 FormAutoComplete 再次为空', () => {
        let formApi: FormApi | undefined;
        render(() => (
            <Form getFormApi={(api) => (formApi = api)}>
                <FormAutoComplete data={stringData} field="name" {...commonProps} />
            </Form>
        ));
        fireEvent.input(getInput(), { target: { value: 'semi' } });
        expect(formApi?.getValue('name')).toBe('semi');
        formApi?.reset();
        expect(formApi?.getValue('name')).toBeUndefined();
        expect(getInput()).toHaveValue('');
    });

    it('label 只接受文本，标记经 renderItem 渲染', () => {
        // @ts-expect-error markup goes through renderItem
        const item: BaseDataItem = { label: <span>Custom Label</span>, value: 'custom' };
        expect(item.value).toBe('custom');
        renderAc({ data: [{ label: 'Custom Label', value: 'custom' }], renderItem: (option: BaseDataItem) => <span class="custom-label">{option.label}</span>, defaultOpen: true, ...commonProps });
        expect(screen.getByText('Custom Label')).toHaveClass('custom-label');
    });

    it('Tab 关闭下拉', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<AutoCompleteProps<string>['onDropdownVisibleChange']>>();
        renderAc({ defaultOpen: true, data: stringData, onDropdownVisibleChange, ...commonProps });
        focusInput();
        pressKey('TAB');
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        await expectClosed();
    });

    it('禁用的选项不触发 onSelect，下拉保持打开', async () => {
        const onSelect = vi.fn<(value: unknown) => void>();
        renderAc({
            data: [
                { value: 'disabled', label: 'Disabled', disabled: true },
                { value: 'enabled', label: 'Enabled' },
            ],
            defaultOpen: true,
            onSelect,
            ...commonProps,
        });
        const [disabledOption] = getOptions();
        expect(disabledOption).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(disabledOption);
        expect(onSelect).not.toHaveBeenCalled();
        expect(getList()).not.toBeNull();
    });

    it('候选项不渲染勾选图标，数据项的 showTick 也不生效', () => {
        renderAc({ data: [...stringData, { label: 'Option 1', value: 'opt1', showTick: true }], defaultOpen: true, defaultValue: 'semi', ...commonProps });
        expect(getFocusedOption()).toHaveTextContent('semi');
        expect(document.querySelector(`.${optionCls}-icon`)).toBeNull();
    });

    it('输入值匹配的选项被高亮', () => {
        renderAc({ data: stringData, defaultOpen: true, ...commonProps });
        typeText('semi');
        expect(getInput()).toHaveValue('semi');
        expect(getFocusedOption()).toHaveTextContent('semi');
    });

    it('在候选项上按下不关闭，在外部按下才关闭', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<AutoCompleteProps<string>['onDropdownVisibleChange']>>();
        renderAc({ defaultOpen: true, data: stringData, onDropdownVisibleChange, ...commonProps });
        fireEvent.mouseDown(getOptions()[0]);
        fireEvent.mouseDown(getInput());
        expect(onDropdownVisibleChange).not.toHaveBeenCalledWith(false);
        expect(getList()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        await expectClosed();
    });

    it('在列表内已打开的嵌套 Popover 里按下鼠标不关闭下拉，在外部按下才关闭', async () => {
        renderAc({
            ...commonProps,
            defaultOpen: true,
            data: ['semi'],
            stopPropagation: false,
            renderItem: () => (
                <Popover aria-label="Nested" content={<button type="button">inside nested</button>} motion={false} trigger="custom" visible>
                    {(getTriggerProps) => <span {...getTriggerProps()}>nested trigger</span>}
                </Popover>
            ),
        });
        fireEvent.mouseDown(await screen.findByRole('button', { name: 'inside nested' }));
        expect(getList()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        await expectClosed();
    });

    it('在 suffix 内已打开的嵌套 Popover 里按下鼠标不关闭下拉，在外部按下才关闭', async () => {
        // created inside the render root, so the nested popup is disposed with the test
        render(() => (
            <AutoComplete
                {...commonProps}
                defaultOpen
                data={['semi']}
                stopPropagation={false}
                suffix={
                    <Popover aria-label="Nested" content={<button type="button">inside nested</button>} motion={false} trigger="custom" visible>
                        {(getTriggerProps) => <span {...getTriggerProps()}>nested trigger</span>}
                    </Popover>
                }
            />
        ));
        fireEvent.mouseDown(await screen.findByRole('button', { name: 'inside nested' }));
        expect(getList()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        await expectClosed();
    });

    it('方向键移动高亮时滚动列表，把高亮项放到中间', () => {
        renderAc({ data: layoutData(stringData), defaultOpen: true, defaultActiveFirstOption: true, ...commonProps });
        focusInput();
        pressKey('DOWN');
        expect(getFocusedOption()).toHaveTextContent('ies');
        expect((getList() as HTMLElement).scrollTop).toBe(40);
        pressKey('DOWN');
        expect(getFocusedOption()).toHaveTextContent('design');
        expect((getList() as HTMLElement).scrollTop).toBe(80);
        pressKey('UP');
        expect(getFocusedOption()).toHaveTextContent('ies');
        pressKey('UP');
        pressKey('UP');
        expect(getFocusedOption()).toHaveTextContent('platform');
        expect((getList() as HTMLElement).scrollTop).toBe(120);
    });

    it('defaultValue 打开时不滚动，方向键到末项时滚动', () => {
        renderAc({ data: layoutData(stringData), defaultOpen: true, defaultValue: 'semi', ...commonProps });
        expect((getList() as HTMLElement).scrollTop).toBe(0);
        focusInput();
        pressKey('DOWN');
        pressKey('DOWN');
        pressKey('DOWN');
        expect(getFocusedOption()).toHaveTextContent('platform');
        expect((getList() as HTMLElement).scrollTop).toBe(120);
    });

    it('triggerRender 替换输入框，点击后打开列表', async () => {
        const triggerRender = (props: AutoCompleteTriggerRenderProps) => <div class="custom-trigger">{props.value.length ? 'picked' : 'Select'}</div>;
        const { container } = renderAc({ data: stringData, triggerRender, ...commonProps });
        const trigger = container.querySelector('.custom-trigger') as HTMLElement;
        expect(trigger).not.toBeNull();
        expect(container.querySelector('input')).toBeNull();
        await userEvent.click(trigger);
        expect(getOptionTexts()).toEqual(stringData);
    });

    it.each(['{Enter}', ' ', '{ArrowDown}'])('triggerRender 内按钮聚焦时 %j 只交给按钮，不打开面板', async (key) => {
        const onPress = vi.fn<(e: MouseEvent) => void>((e) => e.stopPropagation());
        renderAc({
            data: stringData,
            triggerRender: () => (
                <div class="custom-trigger">
                    <button type="button" aria-label="清除" onClick={onPress} />
                </div>
            ),
            ...commonProps,
        });
        screen.getByRole('button', { name: '清除' }).focus();
        await userEvent.keyboard(key);
        expect(onPress).toHaveBeenCalledTimes(key === '{ArrowDown}' ? 0 : 1);
        expect(getList()).toBeNull();
    });

    it('triggerRender 内 role="button" 的元素上按 Enter 只交给它，不打开面板；指针点击仍打开', async () => {
        const onPress = vi.fn<() => void>();
        renderAc({
            data: stringData,
            triggerRender: () => (
                <div class="custom-trigger">
                    <Tag aria-label="清除" onClick={onPress}>
                        semi
                    </Tag>
                </div>
            ),
            ...commonProps,
        });
        screen.getByRole('button', { name: '清除' }).focus();
        await userEvent.keyboard('{Enter}');
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(getList()).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: '清除' }));
        expect(getList()).not.toBeNull();
    });

    it('triggerRender 收到选中项、输入文本，onChange 驱动搜索', async () => {
        const onSearch = vi.fn<(value: string) => void>();
        renderAc({
            data: stringData,
            onSearch,
            triggerRender: (props: AutoCompleteTriggerRenderProps) => (
                <div class="custom-trigger">
                    <span class="picked">{props.value.length ? props.value.map((item) => item.label as string).join(',') : 'empty'}</span>
                    <span class="typed">{props.inputValue}</span>
                    <input aria-label="custom" onInput={(e) => props.onChange(e.currentTarget.value)} />
                </div>
            ),
            ...commonProps,
        });
        expect(screen.getByText('empty')).toBeInTheDocument();
        await userEvent.click(screen.getByText('empty'));
        await userEvent.click(getOptions()[1]);
        expect(document.querySelector('.picked')).toHaveTextContent(/^ies$/);
        expect(document.querySelector('.typed')).toHaveTextContent(/^ies$/);
        fireEvent.input(screen.getByRole('textbox', { name: 'custom' }), { target: { value: 'de' } });
        expect(onSearch).toHaveBeenLastCalledWith('de');
        expect(document.querySelector('.typed')).toHaveTextContent(/^de$/);
    });

    it('triggerRender 收到禁用、尺寸、校验状态与 aria 等属性，并能触发清除、聚焦和失焦', () => {
        const onClear = vi.fn<() => void>();
        const onFocus = vi.fn<NonNullable<AutoCompleteProps<string>['onFocus']>>();
        const onBlur = vi.fn<NonNullable<AutoCompleteProps<string>['onBlur']>>();
        renderAc({
            data: stringData,
            defaultValue: 'semi',
            disabled: true,
            placeholder: 'pick one',
            autofocus: true,
            size: 'large',
            validateStatus: 'warning',
            showClear: true,
            prefix: 'pre',
            suffix: 'suf',
            clearIcon: 'x-icon',
            'aria-label': 'city',
            'aria-labelledby': 'label-id',
            'aria-describedby': 'desc-id',
            'aria-errormessage': 'err-id',
            'aria-invalid': true,
            'aria-required': true,
            onClear,
            onFocus,
            onBlur,
            triggerRender: (props: AutoCompleteTriggerRenderProps) => (
                <div
                    class="custom-trigger"
                    data-disabled={String(props.disabled)}
                    data-placeholder={props.placeholder}
                    data-autofocus={String(props.autofocus)}
                    data-size={props.size}
                    data-status={props.validateStatus}
                    data-show-clear={String(props.showClear)}
                    data-label={props['aria-label']}
                    data-labelledby={props['aria-labelledby']}
                    data-describedby={props['aria-describedby']}
                    data-errormessage={props['aria-errormessage']}
                    data-invalid={String(props['aria-invalid'])}
                    data-required={String(props['aria-required'])}
                >
                    <span class="affix">{props.prefix}</span>
                    <span class="affix">{props.suffix}</span>
                    <span class="icon">{props.clearIcon}</span>
                    <button onClick={() => props.onClear()}>clear</button>
                    <input aria-label="inner" onFocus={(e) => props.onFocus(e)} onBlur={(e) => props.onBlur(e)} />
                </div>
            ),
            ...commonProps,
        });
        const trigger = document.querySelector<HTMLElement>('.custom-trigger') as HTMLElement;
        expect(trigger.dataset).toMatchObject({
            disabled: 'true',
            placeholder: 'pick one',
            autofocus: 'true',
            size: 'large',
            status: 'warning',
            showClear: 'true',
            label: 'city',
            labelledby: 'label-id',
            describedby: 'desc-id',
            errormessage: 'err-id',
            invalid: 'true',
            required: 'true',
        });
        expect(Array.from(trigger.querySelectorAll('.affix, .icon'), (node) => node.textContent)).toEqual(['pre', 'suf', 'x-icon']);
        fireEvent.click(screen.getByRole('button', { name: 'clear' }));
        expect(onClear).toHaveBeenCalledTimes(1);
        const inner = screen.getByRole('textbox', { name: 'inner' });
        fireEvent.focus(inner);
        expect(onFocus).toHaveBeenCalledTimes(1);
        fireEvent.blur(inner);
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('renderSelectedItem 渲染已选项', async () => {
        renderAc({ data: stringData, renderSelectedItem: (option: BaseDataItem) => `Selected: ${option.value}`, defaultValue: 'semi', defaultOpen: true, ...commonProps });
        expect(getInput()).toHaveValue('Selected: semi');
        await userEvent.click(getOptions()[2]);
        expect(getInput()).toHaveValue('Selected: design');
    });

    it('鼠标移入选项时高亮', () => {
        renderAc({ data: stringData, defaultOpen: true, ...commonProps });
        expect(getFocusedOption()).toBeNull();
        fireEvent.mouseEnter(getOptions()[0]);
        expect(getFocusedOption()).toBe(getOptions()[0]);
    });

    it('onSelectWithObject 时回调保留数据项的其他字段', async () => {
        const onSelect = vi.fn<(value: unknown) => void>();
        renderAc({ data: [{ label: 'Option 1', value: 'opt1', customProp: 'custom' }], defaultOpen: true, onSelect, onSelectWithObject: true, ...commonProps });
        await userEvent.click(getOptions()[0]);
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: 'opt1', label: 'Option 1', customProp: 'custom' }));
    });

    it('点击输入框切换下拉，并上报 onDropdownVisibleChange', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<AutoCompleteProps<string>['onDropdownVisibleChange']>>();
        renderAc({ data: stringData, onDropdownVisibleChange, ...commonProps });
        await userEvent.click(getInput());
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(true);
        expect(getList()).not.toBeNull();
        await userEvent.click(getInput());
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        expect(onDropdownVisibleChange).toHaveBeenCalledTimes(2);
        await expectClosed();
    });

    it('点击根元素打开下拉', async () => {
        renderAc({ data: stringData, ...commonProps });
        await userEvent.click(getRoot());
        expect(getList()).not.toBeNull();
    });

    it('数据项的 class 与 style 落在选项上', () => {
        renderAc({ data: [{ label: 'Styled Option', value: 'styled', class: 'custom-class', style: { color: 'red' } }], defaultOpen: true, ...commonProps });
        const option = getOptions()[0];
        expect(option).toHaveClass('custom-class');
        expect(option).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('卸载后不再响应外部按下', () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<AutoCompleteProps<string>['onDropdownVisibleChange']>>();
        const { unmount } = renderAc({ data: stringData, onDropdownVisibleChange, ...commonProps });
        fireEvent.click(getInput());
        expect(onDropdownVisibleChange).toHaveBeenCalledWith(true);
        unmount();
        fireEvent.mouseDown(document.body);
        expect(onDropdownVisibleChange).toHaveBeenCalledTimes(1);
    });

    it('input 暴露 expanded、controls、autocomplete 与 activedescendant', () => {
        renderAc({ data: stringData, ...commonProps });
        const input = getInput();
        expect(input).toHaveAttribute('aria-autocomplete', 'list');
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(input).not.toHaveAttribute('aria-activedescendant');
        const root = input.closest(`.${BASE_CLASS_PREFIX}-autocomplete`);
        expect(root).not.toHaveAttribute('aria-expanded');
        expect(root).not.toHaveAttribute('aria-controls');

        focusInput();
        fireEvent.click(input);
        expect(input).toHaveAttribute('aria-expanded', 'true');
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(root).not.toHaveAttribute('aria-describedby');
        expect(getList()).toHaveAttribute('id', input.getAttribute('aria-controls'));
        expect(getList()).toHaveAttribute('role', 'listbox');
        expect(input).not.toHaveAttribute('aria-activedescendant');

        pressKey('DOWN');
        const focused = getFocusedOption() as HTMLElement;
        expect(focused).toHaveAttribute('role', 'option');
        expect(focused.id).not.toBe('');
        expect(input).toHaveAttribute('aria-activedescendant', focused.id);
        expect(new Set(getOptions().map((o) => o.id)).size).toBe(getOptions().length);
    });

    it('renderItem 与选项交互：移入高亮，点击选中', async () => {
        const onSelect = vi.fn<(value: unknown) => void>();
        renderAc({
            data: [
                { label: 'Custom 1', value: 'c1' },
                { label: 'Custom 2', value: 'c2' },
            ],
            defaultOpen: true,
            onSelect,
            renderItem: (item: BaseDataItem) => <div class="custom-option-item">{item.label}</div>,
            ...commonProps,
        });
        const items = document.querySelectorAll<HTMLElement>('.custom-option-item');
        expect(items).toHaveLength(2);
        fireEvent.mouseEnter(getOptions()[1]);
        expect(getFocusedOption()).toContainElement(items[1]);
        await userEvent.click(items[1]);
        expect(onSelect).toHaveBeenCalledWith('c2');
    });

    // the focus index from the old results must be recomputed when new ones arrive, else Enter picks a missing option
    it('defaultActiveFirstOption 高亮输入后加载的数据的第一个选项（#2952）', () => {
        const onSelect = vi.fn<(value: unknown) => void>();
        const props = { defaultActiveFirstOption: true, onSelect, ...commonProps };
        const { rerender } = renderAc({ ...props, data: [] });
        const search = (value: string, results: string[]) => {
            typeText(value);
            rerender({ ...props, data: [], loading: true });
            rerender({ ...props, data: results, loading: false });
        };
        focusInput();

        search('1.6', ['1.60', '1.62', '1.63', '1.64']);
        expect(getOptionTexts()).toEqual(['1.60', '1.62', '1.63', '1.64']);
        expect(getFocusedOption()).toBe(getOptions()[0]);

        search('1.62', ['1.62']);
        expect(getOptionTexts()).toEqual(['1.62']);
        expect(getFocusedOption()).toBe(getOptions()[0]);

        pressKey('ENTER');
        expect(onSelect).toHaveBeenCalledWith('1.62');
    });
});

describe('AutoComplete 行为基线', () => {
    it('非受控：输入会更新 input，选择会写入选项值', async () => {
        const onSearch = vi.fn<NonNullable<AutoCompleteProps<string>['onSearch']>>();
        const onChange = vi.fn<NonNullable<AutoCompleteProps<string>['onChange']>>();
        renderAc({ data: stringData, onSearch, onChange, ...commonProps });
        typeText('de');
        expect(getInput()).toHaveValue('de');
        expect(onSearch).toHaveBeenLastCalledWith('de');
        expect(getOptionTexts()).toEqual(stringData);
        await userEvent.click(getOptions()[2]);
        expect(getInput()).toHaveValue('design');
        expect(onChange.mock.calls.map(([v]) => v)).toEqual(['de', 'design']);
        await expectClosed();
    });

    it('受控：在父组件更新前，input 显示 props.value', async () => {
        const onChange = vi.fn<NonNullable<AutoCompleteProps<string>['onChange']>>();
        const onSelect = vi.fn<(value: unknown) => void>();
        const { rerender } = renderAc({ data: stringData, value: 'semi', onChange, onSelect, ...commonProps });
        typeText('semiX');
        expect(getInput()).toHaveValue('semi');
        expect(onChange).toHaveBeenLastCalledWith('semiX');
        await userEvent.click(getOptions()[1]);
        expect(onSelect).toHaveBeenLastCalledWith('ies');
        expect(onChange).toHaveBeenLastCalledWith('ies');
        expect(getInput()).toHaveValue('semi');
        await expectClosed();
        rerender({ value: 'ies', data: stringData, ...commonProps });
        expect(getInput()).toHaveValue('ies');
    });

    it('受控转非受控：value 变回 undefined 时清空，之后输入照常显示', () => {
        const props = { data: stringData, ...commonProps };
        const { rerender } = renderAc({ ...props, value: 'semi' });
        rerender({ ...props, value: undefined });
        expect(getInput()).toHaveValue('');
        typeText('de');
        expect(getInput()).toHaveValue('de');
    });

    it('onSelectWithObject 传入整个 data 项；renderSelectedItem 填充 input', async () => {
        const onSelect = vi.fn<(value: unknown) => void>();
        renderAc({
            data: objectData,
            onSelect,
            onSelectWithObject: true,
            renderItem: (item: { email: string }) => item.email,
            renderSelectedItem: (item: { email: string }) => item.email,
            defaultOpen: true,
            ...commonProps,
        });
        expect(getOptionTexts()).toEqual(objectData.map((item) => item.email));
        await userEvent.click(getOptions()[1]);
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: 'bytedance', email: 'semi@bytedance.com' }));
        expect(getInput()).toHaveValue('semi@bytedance.com');
    });

    it('方向键循环并跳过禁用项，Enter 选中高亮项', () => {
        const onSelect = vi.fn<(value: unknown) => void>();
        renderAc({ data: [{ value: 'a' }, { value: 'b', disabled: true }, { value: 'c' }], onSelect, ...commonProps });
        focusInput();
        pressKey('DOWN');
        expect(getList()).not.toBeNull();
        expect(getFocusedOption()).toBeNull();
        pressKey('DOWN');
        expect(getFocusedOption()).toBe(getOptions()[0]);
        pressKey('DOWN');
        expect(getFocusedOption()).toBe(getOptions()[2]);
        pressKey('DOWN');
        expect(getFocusedOption()).toBe(getOptions()[0]);
        pressKey('UP');
        expect(getFocusedOption()).toBe(getOptions()[2]);
        pressKey('ENTER');
        expect(onSelect).toHaveBeenCalledWith('c');
        expect(getInput()).toHaveValue('c');
    });

    it('AutoComplete 之外的按键不打开列表', () => {
        renderAc({ data: stringData, ...commonProps });
        fireEvent.keyDown(document.body, { key: 'ArrowDown' });
        expect(getList()).toBeNull();
    });

    it('Esc 关闭已打开的列表，并上报 onDropdownVisibleChange(false)', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<AutoCompleteProps<string>['onDropdownVisibleChange']>>();
        renderAc({ data: stringData, onDropdownVisibleChange, ...commonProps });
        focusInput();
        pressKey('DOWN');
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(true);
        pressKey('ESC');
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        await expectClosed();
    });

    it('clear 清空 input，并上报空搜索', () => {
        const onSearch = vi.fn<NonNullable<AutoCompleteProps<string>['onSearch']>>();
        const onChange = vi.fn<NonNullable<AutoCompleteProps<string>['onChange']>>();
        renderAc({ data: stringData, defaultValue: 'semi', showClear: true, onSearch, onChange, ...commonProps });
        clickClear();
        expect(getInput()).toHaveValue('');
        expect(onSearch).toHaveBeenLastCalledWith('');
        expect(onChange).toHaveBeenLastCalledWith('');
    });

    it('loading 用加载指示器替换选项；data 为空时显示 emptyContent', () => {
        const { rerender } = renderAc({ data: stringData, defaultOpen: true, loading: true, ...commonProps });
        expect(getOptions()).toHaveLength(0);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-autocomplete-loading-wrapper .${BASE_CLASS_PREFIX}-spin`)).not.toBeNull();
        rerender({ data: [], defaultOpen: true, emptyContent: 'nothing', ...commonProps });
        expect(getList()).toHaveTextContent('nothing');
    });

    it('把 data-* 放在根 div 上，把 aria 属性放在 input 上', () => {
        renderAc({ 'data-testid': 'ac', 'aria-label': 'search', ...commonProps });
        expect(getRoot()).toHaveAttribute('data-testid', 'ac');
        expect(getInput()).toHaveAttribute('aria-label', 'search');
        expect(getRoot()).not.toHaveAttribute('aria-label');
        expect(getRoot()).toHaveAttribute('tabindex', '-1');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { AutoComplete: { size: 'small', placeholder: 'global' } };
        renderAc({ ...commonProps });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-small`)).not.toBeNull();
        expect(getInput()).toHaveAttribute('placeholder', 'global');
    });

    it('每次按键只上报一次，点击外部时关闭，之后按键再打开', async () => {
        const onChange = vi.fn<NonNullable<AutoCompleteProps<string>['onChange']>>();
        const onDropdownVisibleChange = vi.fn<NonNullable<AutoCompleteProps<string>['onDropdownVisibleChange']>>();
        renderAc({ data: stringData, onChange, onDropdownVisibleChange, ...commonProps });
        await userEvent.type(getInput(), 'ab');
        expect(onChange.mock.calls.map(([v]) => v)).toEqual(['a', 'ab']);
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
        fireEvent.mouseDown(document.body);
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false]]);
        await expectClosed();
        fireEvent.mouseDown(document.body);
        expect(onDropdownVisibleChange).toHaveBeenCalledTimes(2);
        pressKey('DOWN');
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(true);
        expect(getList()).not.toBeNull();
    });

    it('defaultOpen 只打开并通知一次', () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        renderAc({ data: ['x', 'y'], defaultOpen: true, onDropdownVisibleChange, ...commonProps });
        expect(getInput()).toHaveAttribute('aria-expanded', 'true');
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
    });
});

describe('AutoComplete 属性落点与 ref', () => {
    it('ref 指向根 div，focus() 与 blur() 作用于输入框', () => {
        let ref: HTMLDivElement | undefined;
        renderAc({ ref: (node: HTMLDivElement) => (ref = node), ...commonProps });
        expect(ref).toBe(getRoot());
        ref?.focus();
        expect(getInput()).toHaveFocus();
        ref?.blur();
        expect(getInput()).not.toHaveFocus();
    });

    it('整体替换 props 时保留根节点与焦点，不重复调用 ref', () => {
        const ref = vi.fn<(node: HTMLDivElement) => void>();
        const { rerender } = renderAc({ data: stringData, placeholder: 'a', ref, ...commonProps });
        const root = getRoot();
        focusInput();
        rerender({ data: stringData, placeholder: 'b', ref, ...commonProps });
        expect(getRoot()).toBe(root);
        expect(getInput()).toHaveFocus();
        expect(ref).toHaveBeenCalledTimes(1);
    });

    it('triggerRender 收到不含 ref 的 componentProps', () => {
        let ref: HTMLDivElement | undefined;
        const triggerRender = vi.fn<NonNullable<AutoCompleteProps<string>['triggerRender']>>(() => <span>trigger</span>);
        render(() => <AutoComplete ref={(node) => (ref = node)} triggerRender={triggerRender} id="custom" {...commonProps} />);
        // splitProps' proxy answers getOwnPropertyDescriptor for any key, so toHaveProperty cannot be used
        const componentProps = triggerRender.mock.lastCall?.[0].componentProps as object;
        expect('ref' in componentProps).toBe(false);
        expect(Object.keys(componentProps)).not.toContain('ref');
        expect(ref).toBe(document.querySelector('[tabindex="-1"]'));
        expect(ref).toHaveAttribute('id', 'custom');
    });

    it('未声明的属性落到根 div 上；Form 属性不进入 DOM，name 传给 input', () => {
        render(() => (
            <Form labelPosition="inset">
                <FormAutoComplete name="city-name" title="tip" data={stringData} field="city" {...commonProps} />
            </Form>
        ));
        expect(getRoot()).toHaveAttribute('title', 'tip');
        expect(getInput()).toHaveAttribute('name', 'city-name');
        for (const attr of ['name', 'insetlabel', 'insetlabelid', 'validatestatus']) {
            expect(getRoot()).not.toHaveAttribute(attr);
        }
    });

    it('打开时监听 window mousedown，卸载后不保留', () => {
        const add = vi.spyOn(window, 'addEventListener');
        const remove = vi.spyOn(window, 'removeEventListener');
        const live = () => countLiveListeners(add, remove, 'mousedown');
        const before = live();
        const { unmount } = renderAc({ data: stringData, defaultOpen: true, ...commonProps });
        expect(live() - before).toBeGreaterThan(0);
        unmount();
        expect(live() - before).toBe(0);
    });

    it('禁用时被 Tooltip 识别为特殊触发器，根元素不接收指针', () => {
        render(() => (
            <Tooltip content="tip" motion={false} trigger="click">
                {(t) => <AutoComplete {...t()} disabled data={stringData} />}
            </Tooltip>
        ));
        const span = getRoot().parentElement as HTMLElement;
        expect(span).toHaveClass(`${BASE_CLASS_PREFIX}-tooltip-trigger-wrapper`);
        expect(getRoot().style.pointerEvents).toBe('none');
    });

    it('Tooltip 函数 children 展开到 AutoComplete 上：描述与 Tab 停靠点在输入框上', async () => {
        render(() => <Tooltip content="tip">{(t) => <AutoComplete {...t()} data={stringData} />}</Tooltip>);
        await userEvent.tab();
        expect(getInput()).toHaveFocus();
        await waitFor(() => expect(getInput()).toHaveAccessibleDescription('tip'));
        expect(getRoot()).not.toHaveAttribute('aria-describedby');
        expect(getRoot()).toHaveAttribute('tabindex', '-1');
    });
});

describe('全局 Input 默认值不给 AutoComplete 输入框加清除按钮与前后缀', () => {
    const GLOBAL_INPUT = { showClear: true, prefix: 'mark-prefix', suffix: 'mark-suffix', insetLabel: 'mark-label', addonBefore: 'mark-before', addonAfter: 'mark-after' };

    it('不读取全局 Input 默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Input: GLOBAL_INPUT };
        const { container } = render(() => <AutoComplete defaultValue="a" data={['a']} />);
        expect(container.textContent).not.toMatch(/mark-/);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
    });

    it('前后缀仍读取 AutoComplete 自己的全局默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Input: GLOBAL_INPUT, AutoComplete: { prefix: 'mark-prefix-host', suffix: 'mark-suffix-host' } };
        const { container } = render(() => <AutoComplete defaultValue="a" data={['a']} />);
        expect(container.textContent).toContain('mark-prefix-host');
        expect(container.textContent).toContain('mark-suffix-host');
        expect(container.textContent).not.toMatch(/mark-(label|before|after)/);
    });
});

describe('AutoComplete 审计修复', () => {
    it('data 不变时换 renderItem，候选项内容随之更新', () => {
        const data = ['semi', 'design'];
        const [prefix, setPrefix] = createSignal('A');
        render(() => <AutoComplete {...commonProps} data={data} defaultOpen renderItem={(item: string) => <i>{`${prefix()}-${item}`}</i>} />);
        expect(getOptionTexts()).toEqual(['A-semi', 'A-design']);
        setPrefix('B');
        expect(getOptionTexts()).toEqual(['B-semi', 'B-design']);
    });

    it('键入时 renderItem 只对可见项各调用一次', () => {
        const renderItem = vi.fn<(item: string) => JSX.Element>((item) => item);
        renderAc({ ...commonProps, data: ['semi', 'design', 'ies'], defaultOpen: true, renderItem });
        const callsBefore = renderItem.mock.calls.length;
        typeText('s');
        expect(renderItem.mock.calls.length - callsBefore).toBeLessThanOrEqual(3);
    });

    it('鼠标悬停禁用项后按 Enter 不选中', () => {
        const onSelect = vi.fn<(value: unknown) => void>();
        const onChange = vi.fn<(value: unknown) => void>();
        renderAc({
            ...commonProps,
            data: [
                { value: 'a', label: 'A', disabled: true },
                { value: 'b', label: 'B' },
            ],
            defaultOpen: true,
            onSelect,
            onChange,
        });
        focusInput();
        fireEvent.mouseEnter(getOptions()[0]);
        pressKey('ENTER');
        expect(onSelect).not.toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue('');
    });

    it('首项禁用且 defaultActiveFirstOption 时按 Enter 不选中', () => {
        const onSelect = vi.fn<(value: unknown) => void>();
        renderAc({
            ...commonProps,
            data: [
                { value: 'a', label: 'A', disabled: true },
                { value: 'b', label: 'B' },
            ],
            defaultOpen: true,
            defaultActiveFirstOption: true,
            onSelect,
        });
        focusInput();
        pressKey('ENTER');
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('onSelectWithObject 下点击与 Enter 选中得到相同且不含内部字段的对象', async () => {
        const data = [{ value: 'a', label: 'A', class: 'x', extra: 1 }, 'plain'];
        const clickSelect = vi.fn<(value: unknown) => void>();
        const { unmount } = renderAc({ ...commonProps, data, defaultOpen: true, onSelectWithObject: true, onSelect: clickSelect });
        await userEvent.click(getOptions()[0]);
        unmount();

        const enterSelect = vi.fn<(value: unknown) => void>();
        renderAc({ ...commonProps, data, defaultOpen: true, defaultActiveFirstOption: true, onSelectWithObject: true, onSelect: enterSelect });
        focusInput();
        pressKey('ENTER');
        expect(clickSelect.mock.calls[0][0]).toEqual({ value: 'a', label: 'A', class: 'x', extra: 1 });
        expect(enterSelect.mock.calls[0][0]).toEqual(clickSelect.mock.calls[0][0]);
    });

    it('onSelectWithObject 下字符串项回调 { value, label }', async () => {
        const onSelect = vi.fn<(value: unknown) => void>();
        renderAc({ ...commonProps, data: ['plain'], defaultOpen: true, onSelectWithObject: true, onSelect });
        await userEvent.click(getOptions()[0]);
        expect(onSelect.mock.calls[0][0]).toEqual({ value: 'plain', label: 'plain' });
    });

    it('面板关闭时按 Tab 与 Esc 不触发 onDropdownVisibleChange', () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        renderAc({ ...commonProps, data: stringData, onDropdownVisibleChange });
        focusInput();
        pressKey('TAB');
        pressKey('ESC');
        expect(onDropdownVisibleChange).not.toHaveBeenCalled();
    });

    it('方向键在首尾禁用项时仍循环，全部禁用时不越界', () => {
        const { unmount } = renderAc({
            ...commonProps,
            data: [
                { value: 'a', label: 'A', disabled: true },
                { value: 'b', label: 'B' },
                { value: 'c', label: 'C' },
                { value: 'd', label: 'D', disabled: true },
            ],
            defaultOpen: true,
        });
        focusInput();
        pressKey('DOWN');
        expect(getFocusedOption()).toHaveTextContent(/^B$/);
        pressKey('DOWN');
        expect(getFocusedOption()).toHaveTextContent(/^C$/);
        pressKey('DOWN');
        expect(getFocusedOption()).toHaveTextContent(/^B$/);
        pressKey('UP');
        expect(getFocusedOption()).toHaveTextContent(/^C$/);
        unmount();

        renderAc({ ...commonProps, data: [{ value: 'a', label: 'A', disabled: true }], defaultOpen: true });
        focusInput();
        pressKey('UP');
        pressKey('DOWN');
        expect(getFocusedOption()).toBeNull();
    });

    it('onSelectWithObject 下不在 data 中的 defaultValue 照常显示，renderSelectedItem 收到 { label, value }', () => {
        const renderSelectedItem = vi.fn<(option: BaseDataItem) => string>((option) => String(option.value));
        renderAc({ ...commonProps, data: ['semi'], defaultValue: 'other', onSelectWithObject: true, renderSelectedItem });
        expect(getInput()).toHaveValue('other');
        expect(renderSelectedItem).toHaveBeenLastCalledWith({ label: 'other', value: 'other' });
    });

    it('类型：renderSelectedItem 收到选项对象，onSelect 收到值或对象，defaultValue 只收字符串或数字', () => {
        type Item = { value: string; email: string };
        expectTypeOf<Parameters<NonNullable<AutoCompleteProps<string>['renderSelectedItem']>>[0]>().toEqualTypeOf<BaseDataItem>();
        expectTypeOf<Parameters<NonNullable<AutoCompleteProps<Item>['renderSelectedItem']>>[0]>().toEqualTypeOf<Item>();
        expectTypeOf<Parameters<NonNullable<AutoCompleteProps<string>['onSelect']>>[0]>().toEqualTypeOf<string | number | BaseDataItem>();
        expectTypeOf<AutoCompleteProps<Item>['defaultValue']>().toEqualTypeOf<string | number | undefined>();
    });

    it('数据项里的同名字段不覆盖候选项的内部属性', () => {
        renderAc({ ...commonProps, data: [{ value: 'a', label: 'A', focused: true, selected: true, empty: true, 'data-id': 'a' }, { value: 'b' }], defaultOpen: true });
        expect(getOptions()).toHaveLength(2);
        expect(getFocusedOption()).toBeNull();
        const option = screen.getByRole('option', { name: 'A' });
        expect(option).toHaveAttribute('aria-selected', 'false');
        expect(option).not.toHaveClass(`${optionCls}-selected`);
        expect(option).toHaveAttribute('data-id', 'a');
    });

    it('使用 triggerRender 不打印警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(() => <AutoComplete {...commonProps} triggerRender={() => <span>trigger</span>} />);
        expect(warn).not.toHaveBeenCalled();
    });

    it('无效数据项不占位：高亮项与 Enter 选中项一致', () => {
        const onSelect = vi.fn<NonNullable<AutoCompleteProps<string>['onSelect']>>();
        renderAc({ ...commonProps, data: [{ label: 'x' }, 'a', 'b', 'c'], defaultValue: 'b', defaultOpen: true, onSelect });
        expect(getOptionTexts()).toEqual(['a', 'b', 'c']);
        expect(getFocusedOption()).toHaveTextContent('b');
        pressKey('ENTER');
        expect(onSelect).toHaveBeenCalledWith('b');
    });

    it('data 全是无效项时显示 emptyContent', () => {
        renderAc({ ...commonProps, data: [{ label: 'x' }], defaultOpen: true, emptyContent: <i>none</i> });
        expect(getList()).toHaveTextContent('none');
    });

    it('listbox 与选项的 mousedown 被阻止默认行为，焦点留在输入框', () => {
        renderAc({ ...commonProps, data: stringData, defaultOpen: true });
        expect(fireEvent.mouseDown(getOptions()[0])).toBe(false);
        expect(fireEvent.mouseDown(screen.getByRole('listbox'))).toBe(false);
    });

    describe('combobox 与 listbox 用同一个名称来源', () => {
        it('使用方 aria-label 时两者都用该值', () => {
            renderAc({ ...commonProps, 'aria-label': 'city', insetLabel: 'Inset', data: stringData, defaultOpen: true });
            expect(getInput()).toHaveAccessibleName('city');
            expect(screen.getByRole('listbox')).toHaveAttribute('aria-label', 'city');
            expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-labelledby');
        });

        it('使用方 aria-labelledby 优先于 insetLabel，两者指向同一个标签', () => {
            render(() => (
                <>
                    <span id="lbl">cities</span>
                    <AutoComplete {...commonProps} aria-labelledby="lbl" data={stringData} defaultOpen insetLabel="City" />
                </>
            ));
            expect(getInput()).toHaveAccessibleName('cities');
            expect(screen.getByRole('listbox')).toHaveAccessibleName('cities');
        });

        it('只有 insetLabel 时 combobox 与 listbox 都以 insetLabel 命名，没有 insetLabelId 时也能引用', () => {
            const { unmount } = renderAc({ ...commonProps, insetLabel: 'City', data: stringData, defaultOpen: true });
            expect(getInput()).toHaveAccessibleName('City');
            expect(screen.getByRole('listbox')).toHaveAccessibleName('City');
            unmount();
            renderAc({ ...commonProps, insetLabel: 'City', insetLabelId: 'city-label', data: stringData, defaultOpen: true });
            expect(getInput()).toHaveAttribute('aria-labelledby', 'city-label');
            expect(screen.getByRole('listbox')).toHaveAttribute('aria-labelledby', 'city-label');
        });

        it('有 prefix 时 insetLabel 不渲染，也不作名称来源', () => {
            renderAc({ ...commonProps, prefix: 'Pre', insetLabel: 'City', data: stringData, defaultOpen: true });
            expect(getInput()).not.toHaveAttribute('aria-labelledby');
            expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-labelledby');
        });

        it('没有名称来源时两者都不加名称，listbox 不指向输入框（accname 会取输入内容）', () => {
            renderAc({ ...commonProps, data: stringData, defaultOpen: true });
            expect(getInput()).not.toHaveAttribute('aria-label');
            expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-label');
            expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-labelledby');
        });
    });

    it('使用方的 onClick、onMouseDown 与内部处理一起生效', () => {
        const onClick = vi.fn<(e: MouseEvent) => void>();
        const onMouseDown = vi.fn<(e: MouseEvent) => void>();
        renderAc({ ...commonProps, data: stringData, onClick, onMouseDown });
        fireEvent.mouseDown(getRoot());
        fireEvent.click(getRoot());
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onMouseDown).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveAttribute('aria-expanded', 'true');
    });

    it('键盘聚焦项 aria-selected 为 true，其余为 false；聚焦项不带 -selected 类', () => {
        renderAc({ ...commonProps, data: stringData, defaultOpen: true, defaultActiveFirstOption: true });
        const input = getInput();
        const active = () => document.getElementById(input.getAttribute('aria-activedescendant') as string);
        expect(active()).toHaveAttribute('aria-selected', 'true');
        pressKey('DOWN');
        expect(active()).toHaveTextContent('ies');
        expect(active()).toHaveAttribute('aria-selected', 'true');
        expect(active()).toHaveClass(`${optionCls}-focused`);
        expect(active()).not.toHaveClass(`${optionCls}-selected`);
        expect(getOptions()[0]).toHaveAttribute('aria-selected', 'false');
    });

    it('类型：不声明 mouseEnterDelay、mouseLeaveDelay、children、tabIndex，也没有 Option 静态成员', () => {
        expectTypeOf<AutoCompleteProps<string>>().not.toHaveProperty('mouseEnterDelay');
        expectTypeOf<AutoCompleteProps<string>>().not.toHaveProperty('mouseLeaveDelay');
        expectTypeOf<AutoCompleteProps<string>>().not.toHaveProperty('children');
        expectTypeOf<AutoCompleteProps<string>>().not.toHaveProperty('tabIndex');
        expect('Option' in AutoComplete).toBe(false);
    });
});

describe('AutoComplete 加载、禁用与键盘细节', () => {
    it('defaultActiveFirstOption 且没有选项时，combobox 不指向不存在的选项', () => {
        renderAc({ ...commonProps, data: [], defaultActiveFirstOption: true, defaultOpen: true });
        expect(getInput()).not.toHaveAttribute('aria-activedescendant');
    });

    it('加载中方向键与 Enter 不作用于隐藏的旧列表', () => {
        const onSelect = vi.fn<NonNullable<AutoCompleteProps<string>['onSelect']>>();
        const onChange = vi.fn<(value: string | number) => void>();
        renderAc({ ...commonProps, data: stringData, loading: true, defaultOpen: true, onSelect, onChange });
        pressKey('DOWN');
        pressKey('ENTER');
        expect(onSelect).not.toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue('');
    });

    it('禁用时 defaultOpen 不打开面板，也不通知 onDropdownVisibleChange', () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        renderAc({ ...commonProps, data: stringData, disabled: true, defaultOpen: true, onDropdownVisibleChange });
        expect(getList()).toBeNull();
        expect(onDropdownVisibleChange).not.toHaveBeenCalled();
    });

    it('受控 value 变回 undefined 时清空输入框，不用空对象调用 renderSelectedItem', () => {
        const renderSelectedItem = vi.fn<(option: { value?: string }) => string>((option) => `${option.value}`);
        const props = { ...commonProps, data: objectData, renderSelectedItem };
        const { rerender } = renderAc({ ...props, value: 'abc' });
        expect(getInput()).toHaveValue('abc');
        renderSelectedItem.mockClear();
        rerender({ ...props, value: undefined });
        expect(getInput()).toHaveValue('');
        expect(renderSelectedItem).not.toHaveBeenCalled();
    });

    it.each([true, false])('面板打开时受控 value 变回 undefined，高亮按 defaultActiveFirstOption=%s 重设', (defaultActiveFirstOption) => {
        const props = { ...commonProps, data: objectData, defaultOpen: true, defaultActiveFirstOption };
        const { rerender } = renderAc({ ...props, value: 'vigo' });
        expect(getInput()).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[2].id);
        rerender({ ...props, value: undefined });
        expect(getInput().getAttribute('aria-activedescendant')).toBe(defaultActiveFirstOption ? screen.getAllByRole('option')[0].id : null);
    });

    it('面板里有可聚焦元素时，方向键仍只移动高亮，焦点留在输入框', async () => {
        renderAc({ ...commonProps, data: stringData, defaultOpen: true, renderItem: (item: string) => <button type="button">{item}</button> });
        focusInput();
        await userEvent.keyboard('{ArrowDown}');
        expect(getInput()).toHaveFocus();
        expect(getFocusedOption()).toHaveTextContent('semi');
        await userEvent.keyboard('{ArrowUp}');
        expect(getInput()).toHaveFocus();
    });

    it('焦点在默认触发器的清除按钮上时，ArrowDown 不打开面板', async () => {
        const onKeyDown = vi.fn<(e: KeyboardEvent) => void>();
        renderAc({ ...commonProps, data: stringData, defaultValue: 'semi', showClear: true, onKeyDown });
        await userEvent.click(getInput());
        await userEvent.keyboard('{Escape}');
        await userEvent.tab();
        expect(getClearBtn()).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(getList()).toBeNull();
        expect(onKeyDown).toHaveBeenCalled();
    });

    it('自定义触发器内控件上的按键仍调用 onKeyDown，但不打开面板', () => {
        const onKeyDown = vi.fn<(e: KeyboardEvent) => void>();
        renderAc({
            ...commonProps,
            data: stringData,
            onKeyDown,
            triggerRender: () => (
                <div>
                    <button type="button" aria-label="reset" />
                </div>
            ),
        });
        fireEvent.keyDown(screen.getByRole('button', { name: 'reset' }), { key: 'Enter' });
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(getList()).toBeNull();
    });

    it('RTL 下默认弹出位置翻转为 bottomRight', () => {
        render(() => (
            <ConfigProvider direction="rtl">
                <AutoComplete {...commonProps} data={stringData} defaultOpen />
            </ConfigProvider>
        ));
        expect(getPopupWrapper()).toHaveAttribute('x-placement', 'bottomRight');
    });

    it('对象 data 每次读取都重建时，内容不变不重置高亮', () => {
        const [tick, setTick] = createSignal(0);
        // a spread call re-reads every key when any of them changes, which rebuilds data
        const view = () => ({ 'data-tick': tick(), data: stringData.map((value) => ({ value, label: value })) });
        render(() => <AutoComplete {...commonProps} defaultOpen {...view()} />);
        fireEvent.mouseEnter(getOptions()[2]);
        expect(getFocusedOption()).toHaveTextContent('design');
        setTick(1);
        expect(getRoot()).toHaveAttribute('data-tick', '1');
        expect(getFocusedOption()).toHaveTextContent('design');
    });
});
