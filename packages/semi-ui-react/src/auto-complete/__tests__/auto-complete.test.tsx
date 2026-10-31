import { createRef, StrictMode, type FocusEvent, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { AutoComplete, ConfigProvider, Form, Popover, Select, Tag } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import { countLiveListeners } from '@test/utils/react';
import type { AutoCompleteProps, BaseDataItem } from '../index';

type OptionSelectHandler = (option: { value?: string; label?: string }) => void;

const optionCls = `${BASE_CLASS_PREFIX}-autocomplete-option`;

const renderAc = (props) => render(<AutoComplete {...props} />);
const getInput = () => screen.getByRole('combobox');
const getList = () => document.querySelector<HTMLElement>(`.${optionCls}-list`);
const getOptions = () => Array.from(document.querySelectorAll(`.${optionCls}`));
const getOptionTexts = () => getOptions().map((option) => option.textContent);
const getFocusedOption = () => document.querySelector(`.${optionCls}-focused`);
const getPopupWrapper = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
const getClearBtn = () => document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`);
const focusInput = () => fireEvent.focus(getInput());
const keyNames = { UP: 'ArrowUp', DOWN: 'ArrowDown', ENTER: 'Enter', ESC: 'Escape', TAB: 'Tab' };
const pressKey = (name) => fireEvent.keyDown(getInput(), { key: keyNames[name] });
// the clear button only shows while the input wrapper is hovered or focused, and it reacts to mousedown
const hoverInput = () => fireEvent.mouseOver(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper`));
const clickClear = () => fireEvent.mouseDown(getClearBtn());
const expectClosed = () => waitFor(() => expect(getList()).toBeNull());

// option offsetTop is read from inline marginTop by vitest/setup.ts, which lets updateScrollTop compute a real value
const layoutData = (values) => values.map((value, i) => ({ value, label: value, style: { marginTop: `${i * 40}px` } }));

let stringData = ['semi', 'ies', 'design', 'platform'];
let objectData = [
    { email: 'semi@abc.com', value: 'abc' },
    { email: 'semi@bytedance.com', value: 'bytedance' },
    { email: 'semi@vigo.com', value: 'vigo' },
];

let commonProps = {
    motion: false,
};

describe('AutoComplete', () => {
    it('【style & className】自定义 className 与 style', () => {
        let props = {
            className: 'test',
            style: {
                color: 'red',
            },
        };
        const { container } = renderAc(props);
        const trigger = container.querySelector('div.test');
        expect(trigger).toHaveClass(`${BASE_CLASS_PREFIX}-autocomplete`);
        expect(trigger).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('【placeholder】设置 placeholder', () => {
        const props = { placeholder: 'semi' };
        renderAc(props);
        expect(getInput()).toHaveAttribute('placeholder', 'semi');
    });

    it('【size】不同尺寸', () => {
        const props = { size: 'small' };
        const { container, rerender } = renderAc(props);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-small`)).not.toBeNull();
        rerender(<AutoComplete {...props} size="large" />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-large`)).not.toBeNull();
    });

    it('【disabled】disabled 为 true 时组件禁用', () => {
        const props = { disabled: true };
        const { container } = renderAc(props);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-autocomplete-disabled`)).not.toBeNull();
        expect(getInput()).toBeDisabled();
    });

    it('【prefix & suffix】自定义 prefix 与 suffix', () => {
        let prefix = <div className="prefix">prefix content</div>;
        let suffix = <div className="suffix">suffix content</div>;
        const props = {
            prefix,
            suffix,
        };
        renderAc(props);
        expect(screen.getByText('prefix content')).toHaveClass('prefix');
        expect(screen.getByText('suffix content')).toHaveClass('suffix');
    });

    it('【dropdownClassName & dropdownStyle】自定义 dropdownClassName 与 dropdownStyle', () => {
        let props = {
            dropdownClassName: 'ddc',
            dropdownStyle: {
                color: 'red',
            },
            defaultOpen: true,
            ...commonProps,
        };
        renderAc(props);
        const list = document.querySelector(`.${optionCls}-list.ddc`);
        expect(list).not.toBeNull();
        expect(list).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('【position】不同位置', () => {
        let props = {
            position: 'top',
            data: stringData,
            defaultOpen: true,
            ...commonProps,
        };
        renderAc(props);
        expect(getPopupWrapper()).toHaveAttribute('x-placement', 'top');
    });

    it('【defaultValue】defaultValue 不在 data 候选中', () => {
        let props = {
            defaultValue: 'semi',
            data: [],
            ...commonProps,
        };
        renderAc(props);
        expect(getInput()).toHaveValue('semi');
    });

    it('【defaultValue】defaultValue 可匹配 data', () => {
        let props = {
            defaultValue: 'semi',
            data: stringData,
            ...commonProps,
        };
        renderAc(props);
        expect(getInput()).toHaveValue('semi');
    });

    it('【onSearch】输入变化时触发 onSearch', () => {
        let spyOnSearch = vi.fn<NonNullable<AutoCompleteProps<string>['onSearch']>>();
        let props = {
            onSearch: spyOnSearch,
        };
        renderAc(props);
        let inputValue = 'semi';
        fireEvent.change(getInput(), { target: { value: inputValue } });
        expect(spyOnSearch).toHaveBeenCalledTimes(1);
        expect(spyOnSearch).toHaveBeenCalledWith(inputValue);
    });

    it('defaultOpen 为 true 且 data 非空时显示 optionList', () => {
        let props = {
            defaultOpen: true,
            data: stringData,
            ...commonProps,
        };
        renderAc(props);
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        const candidate = getList().children;
        expect(candidate).toHaveLength(4);
        expect(candidate[0]).toHaveTextContent(/^semi$/);
        expect(candidate[1]).toHaveTextContent(/^ies$/);
    });

    it('【data】data 变化时 updateOptionList', () => {
        let props = {
            defaultOpen: true,
            data: ['semi'],
            ...commonProps,
        };
        const { rerender } = renderAc(props);
        expect(getOptionTexts()).toEqual(['semi']);
        rerender(<AutoComplete {...props} data={['ies', 'design']} />);
        expect(getOptionTexts()).toEqual(['ies', 'design']);
    });

    it('【loading】loading 为 true 时隐藏 optionList 并显示加载中', () => {
        let props = {
            loading: true,
            defaultOpen: true,
            data: stringData,
            ...commonProps,
        };
        renderAc(props);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-autocomplete-loading-wrapper`)).not.toBeNull();
        expect(getOptions()).toHaveLength(0);
    });

    it('【onSelect】点击候选项时触发 onSelect', async () => {
        let spyOnSelect = vi.fn<(value: unknown) => void>();
        let props = {
            defaultOpen: true,
            data: stringData,
            onSelect: spyOnSelect,
            ...commonProps,
        };
        renderAc(props);
        await userEvent.click(getOptions()[0]);
        expect(spyOnSelect).toHaveBeenCalledTimes(1);
        expect(spyOnSelect).toHaveBeenCalledWith(BASE_CLASS_PREFIX);
    });

    it('【onSelect】onSelectWithObject 为 true 时以对象回调', async () => {
        let spyOnSelect = vi.fn<(value: unknown) => void>();
        let props = {
            defaultOpen: true,
            data: objectData,
            onSelect: spyOnSelect,
            onSelectWithObject: true,
            ...commonProps,
        };
        renderAc(props);
        await userEvent.click(getOptions()[0]);
        expect(spyOnSelect).toHaveBeenCalledTimes(1);
        expect(spyOnSelect).toHaveBeenCalledWith(expect.objectContaining(objectData[0]));
    });

    it('点击 AutoComplete 后显示候选列表（data 非空时）', async () => {
        let props = {
            data: stringData,
            ...commonProps,
        };
        renderAc(props);
        expect(getList()).toBeNull();
        await userEvent.click(getInput());
        expect(getList()).not.toBeNull();
        expect(getOptionTexts()).toEqual(stringData);
    });

    it('renderSelectedItem', async () => {
        let props = {
            data: objectData,
            defaultOpen: true,
            ...commonProps,
            renderSelectedItem: (option) => option.email,
        };
        renderAc(props);
        await userEvent.click(getOptions()[0]);
        expect(getInput()).toHaveValue(objectData[0].email);
    });

    it('受控模式下的 renderItem', async () => {
        const fakeOnChange = vi.fn<NonNullable<AutoCompleteProps<string>['onChange']>>();
        let props = {
            data: [
                {
                    name: '夏可漫',
                    label: '夏可漫',
                    value: 'xiakeman@example.com',
                    email: 'xiakeman@example.com',
                    abbr: 'XK',
                    color: 'amber',
                },
                {
                    name: '申悦',
                    label: '申悦',
                    value: 'shenyue@example.com',
                    email: 'shenyue@example.com',
                    abbr: 'SY',
                    color: 'indigo',
                },
            ],
            motion: false,
            defaultOpen: true,
            renderSelectedItem: (option) => option.abbr,
            onChange: fakeOnChange,
            value: '',
        };
        renderAc(props);
        await userEvent.click(getOptions()[0]);
        expect(fakeOnChange).toHaveBeenCalledWith('XK');
        expect(getInput()).toHaveValue('');
    });

    it('【value】受控模式', () => {
        let props = {
            data: [],
            ...commonProps,
            value: 'semi',
        };
        const { rerender } = renderAc(props);
        expect(getInput()).toHaveValue('semi');
        rerender(<AutoComplete {...props} value="ies" />);
        expect(getInput()).toHaveValue('ies');
    });

    it('【autoFocus】正常工作', () => {
        let spyOnFocus = vi.fn<NonNullable<AutoCompleteProps<string>['onFocus']>>();
        const props = {
            autoFocus: true,
            onFocus: spyOnFocus,
        };
        const { container } = renderAc(props);
        expect(spyOnFocus).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveFocus();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-focus`)).not.toBeNull();
    });

    it('【emptyContent】data 为空时显示', () => {
        const props = {
            defaultOpen: true,
            data: [],
            emptyContent: <div className="custom-empty-content">emptycontent</div>,
            ...commonProps,
        };
        renderAc(props);
        expect(screen.getByText('emptycontent')).toHaveClass('custom-empty-content');
    });

    it('【emptyContent】data 非空时不显示', () => {
        const props = {
            defaultOpen: true,
            data: [1, 2, 3],
            emptyContent: <div className="custom-empty-content">emptycontent</div>,
            ...commonProps,
        };
        renderAc(props);
        expect(screen.queryByText('emptycontent')).toBeNull();
        expect(getOptionTexts()).toEqual(['1', '2', '3']);
    });

    it('【onChange】在正确的时机触发', async () => {
        const spyOnChange = vi.fn<NonNullable<AutoCompleteProps<string>['onChange']>>();
        const props = {
            defaultOpen: true,
            onChange: spyOnChange,
            data: ['hello', 'bytedance', 'semi'],
            showClear: true,
            motion: false,
        };
        renderAc(props);
        fireEvent.change(getInput(), { target: { value: 'abc' } });
        expect(spyOnChange).toHaveBeenLastCalledWith('abc');
        await userEvent.click(getOptions()[0]);
        expect(spyOnChange).toHaveBeenLastCalledWith('hello');
        expect(spyOnChange).toHaveBeenCalledTimes(2);
    });

    it('maxHeight', () => {
        let props = {
            maxHeight: 400,
            data: ['a', 'b', 'c'],
            defaultOpen: true,
            ...commonProps,
        };
        renderAc(props);
        expect(getList()).toHaveStyle({ maxHeight: '400px' });
    });

    // jsdom has no layout, so only the trigger-width variable wiring is checked here
    it('下拉最小宽度跟随触发器宽度', () => {
        renderAc({ defaultOpen: true, style: { width: '50%' }, ...commonProps });
        expect(getPopupWrapper().style.minWidth).toBe('var(--semi-tooltip-trigger-width)');
    });

    it('【onBlur】输入框失去焦点时触发 onBlur', () => {
        let spyOnBlur = vi.fn<NonNullable<AutoCompleteProps<string>['onBlur']>>();
        const props = {
            onBlur: spyOnBlur,
            ...commonProps,
        };
        renderAc(props);
        focusInput();
        expect(spyOnBlur).not.toHaveBeenCalled();
        fireEvent.blur(getInput());
        expect(spyOnBlur).toHaveBeenCalledTimes(1);
        expect(spyOnBlur.mock.calls[0][0].type).toEqual('blur');
    });

    it('【onFocus】输入框获得焦点时触发 onFocus', () => {
        let spyOnFocus = vi.fn<(e: FocusEvent) => void>((e) => e.persist());
        const props = {
            onFocus: spyOnFocus,
            ...commonProps,
        };
        renderAc(props);
        focusInput();
        expect(spyOnFocus).toHaveBeenCalledTimes(1);
        expect(spyOnFocus.mock.calls[0][0].type).toEqual('focus');
    });

    it('【键盘导航】ArrowDown 选中下一个选项', () => {
        let props = {
            defaultOpen: true,
            data: stringData,
            defaultActiveFirstOption: true,
            ...commonProps,
        };
        renderAc(props);
        expect(getFocusedOption()).toHaveTextContent('semi');
        focusInput();
        pressKey('DOWN');
        expect(getList()).not.toBeNull();
        expect(getFocusedOption()).toHaveTextContent('ies');
    });

    it('【键盘导航】ArrowUp 选中上一个选项', () => {
        let props = {
            defaultOpen: true,
            data: stringData,
            defaultActiveFirstOption: true,
            ...commonProps,
        };
        renderAc(props);
        focusInput();
        pressKey('UP');
        expect(getList()).not.toBeNull();
        expect(getFocusedOption()).toHaveTextContent('platform');
    });

    it('【键盘导航】Esc 键事件', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<AutoCompleteProps<string>['onDropdownVisibleChange']>>();
        let props = {
            defaultOpen: true,
            data: stringData,
            onDropdownVisibleChange,
            ...commonProps,
        };
        renderAc(props);
        expect(getList()).not.toBeNull();
        focusInput();
        pressKey('ESC');
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        await expectClosed();
    });

    it('【键盘导航】Enter 键事件', async () => {
        let spyOnSelect = vi.fn<(value: unknown) => void>();
        let props = {
            defaultOpen: true,
            data: stringData,
            defaultActiveFirstOption: true,
            onSelect: spyOnSelect,
            ...commonProps,
        };
        renderAc(props);
        focusInput();
        pressKey('ENTER');
        expect(spyOnSelect).toHaveBeenCalledTimes(1);
        expect(spyOnSelect).toHaveBeenCalledWith('semi');
        await expectClosed();
    });

    it('【showClear】showClear 为 true 且有值时显示清除按钮', () => {
        let props = {
            showClear: true,
            defaultValue: 'semi',
            ...commonProps,
        };
        renderAc(props);
        expect(getClearBtn()).not.toBeNull();
    });

    it('【triggerRender】自定义触发器渲染', () => {
        const triggerRender = ({ value }) => <div className="custom-trigger">{value || 'Click to select'}</div>;
        let props = {
            triggerRender,
            data: stringData,
            ...commonProps,
        };
        const { container } = renderAc(props);
        expect(container.querySelector('.custom-trigger')).not.toBeNull();
        expect(container.querySelector('input')).toBeNull();
    });

    it('【validateStatus】显示错误状态', () => {
        const props = {
            validateStatus: 'error',
            ...commonProps,
        };
        const { container } = renderAc(props);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-error`)).not.toBeNull();
    });

    it('【validateStatus】显示警告状态', () => {
        const props = {
            validateStatus: 'warning',
            ...commonProps,
        };
        const { container } = renderAc(props);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-warning`)).not.toBeNull();
    });

    it('【defaultActiveFirstOption】默认激活第一个选项', () => {
        let props = {
            defaultOpen: true,
            data: stringData,
            defaultActiveFirstOption: true,
            ...commonProps,
        };
        renderAc(props);
        expect(getOptions()[0]).toHaveClass(`${optionCls}-focused`);
        expect(document.querySelectorAll(`.${optionCls}-focused`)).toHaveLength(1);
    });

    it('【motion】motion 为 false 时禁用动画', () => {
        const props = {
            motion: false,
            defaultOpen: true,
            data: stringData,
            ...commonProps,
        };
        renderAc(props);
        expect(getOptionTexts()).toEqual(stringData);
        expect(getPopupWrapper().className).not.toMatch(/animation/);
    });

    it('【insetLabel】渲染 insetLabel', () => {
        const props = {
            insetLabel: <span className="inset-label">Label</span>,
            insetLabelId: 'inset-label-id',
            ...commonProps,
        };
        const { container } = renderAc(props);
        expect(screen.getByText('Label')).toHaveClass('inset-label');
        expect(container.querySelector('#inset-label-id')).toContainElement(screen.getByText('Label'));
    });

    it('prefix 为 0 时渲染 0 而不是 insetLabel', () => {
        const { container } = renderAc({ prefix: 0, insetLabel: 'Label', ...commonProps });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-prefix`)).toHaveTextContent(/^0$/);
    });

    it('【clearIcon】渲染自定义 clearIcon', () => {
        const props = {
            clearIcon: <span className="custom-clear-icon">X</span>,
            showClear: true,
            defaultValue: 'test',
            ...commonProps,
        };
        renderAc(props);
        hoverInput();
        expect(getClearBtn().querySelector('.custom-clear-icon')).not.toBeNull();
    });

    it('【onClear】点击清除按钮时触发 onClear', () => {
        let spyOnClear = vi.fn<() => void>();
        const props = {
            onClear: spyOnClear,
            showClear: true,
            defaultValue: 'test',
            ...commonProps,
        };
        renderAc(props);
        hoverInput();
        clickClear();
        expect(spyOnClear).toHaveBeenCalledTimes(1);
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

    it('【renderItem】自定义渲染选项', () => {
        const renderItem = (option) => <div className="custom-option-item">{option}</div>;
        const props = {
            renderItem,
            data: stringData,
            defaultOpen: true,
            ...commonProps,
        };
        renderAc(props);
        const items = document.querySelectorAll('.custom-option-item');
        expect(Array.from(items).map((item) => item.textContent)).toEqual(stringData);
    });

    it('【stopPropagation】正常工作', async () => {
        const onParentClick = vi.fn<(e: ReactMouseEvent) => void>();
        const props = {
            stopPropagation: false,
            defaultOpen: true,
            data: stringData,
            ...commonProps,
        };
        render(
            <div role="presentation" onClick={onParentClick}>
                <AutoComplete {...props} />
            </div>
        );
        await userEvent.click(getOptions()[0]);
        expect(onParentClick).toHaveBeenCalled();
    });

    it('【dropdownMatchSelectWidth】正常工作', () => {
        const props = {
            dropdownMatchSelectWidth: false,
            defaultOpen: true,
            data: stringData,
            style: { width: 200 },
            ...commonProps,
        };
        renderAc(props);
        expect(getPopupWrapper().style.minWidth).toEqual('');
    });

    it('【aria attributes】把 aria 属性传给 input', () => {
        const props = {
            'aria-label': 'autocomplete input',
            'aria-labelledby': 'label-id',
            'aria-describedby': 'desc-id',
            'aria-invalid': true,
            'aria-errormessage': 'error-msg',
            'aria-required': true,
            ...commonProps,
        };
        renderAc(props);
        const input = getInput();
        expect(input).toHaveAttribute('aria-label', 'autocomplete input');
        expect(input).toHaveAttribute('aria-labelledby', 'label-id');
        expect(input).toHaveAttribute('aria-describedby', 'desc-id');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-errormessage', 'error-msg');
        expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('【onKeyDown】按键时触发 onKeyDown', () => {
        const onKeyDown = vi.fn<(e: KeyboardEvent<HTMLInputElement>) => void>((e) => e.persist());
        const props = {
            data: stringData,
            defaultOpen: true,
            onKeyDown,
            ...commonProps,
        };
        renderAc(props);
        focusInput();
        pressKey('DOWN');
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(onKeyDown.mock.calls[0][0].key).toEqual('ArrowDown');
        expect(getList()).not.toBeNull();
        expect(getFocusedOption()).toHaveTextContent('semi');
    });

    it('【id】把 id 传给 combobox input，使 label 可以指向它', () => {
        const props = {
            id: 'my-autocomplete',
            ...commonProps,
        };
        const { container } = renderAc(props);
        expect(getInput()).toHaveAttribute('id', 'my-autocomplete');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-autocomplete`)).not.toHaveAttribute('id');
    });

    it('【id】Form label 可聚焦并命名 input', async () => {
        render(
            <Form>
                <Form.AutoComplete data={stringData} field="city" label="City" />
            </Form>
        );
        expect(screen.getByRole('combobox', { name: 'City' })).toBeInTheDocument();
        expect(document.querySelector('label').control).toBe(getInput());
    });

    it('【Option】用对象 data 与自定义 label 渲染', () => {
        const customData = [{ label: <span className="custom-label">Custom Label</span>, value: 'custom' }];
        const props = {
            data: customData,
            defaultOpen: true,
            ...commonProps,
        };
        renderAc(props);
        expect(screen.getByText('Custom Label')).toHaveClass('custom-label');
    });

    it('【Enter 键】触发 keydown 事件', async () => {
        const props = {
            defaultOpen: true,
            data: stringData,
            defaultActiveFirstOption: true,
            ...commonProps,
        };
        renderAc(props);
        focusInput();
        pressKey('ENTER');
        expect(getInput()).toHaveValue('semi');
        await expectClosed();
    });

    it('【Tab 键】处理 Tab 键', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<AutoCompleteProps<string>['onDropdownVisibleChange']>>();
        const props = {
            defaultOpen: true,
            data: stringData,
            onDropdownVisibleChange,
            ...commonProps,
        };
        renderAc(props);
        focusInput();
        pressKey('TAB');
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        await expectClosed();
    });

    it('【Option 禁用】禁用时不触发 onSelect', async () => {
        const onSelect = vi.fn<(value: unknown) => void>();
        const props = {
            data: [
                { value: 'disabled', label: 'Disabled', disabled: true },
                { value: 'enabled', label: 'Enabled' },
            ],
            defaultOpen: true,
            onSelect,
            ...commonProps,
        };
        renderAc(props);
        const [disabledOption] = getOptions();
        expect(disabledOption).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(disabledOption);
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('【emptyContent null】emptyContent 为 null 时返回 null', () => {
        const props = {
            data: [],
            defaultOpen: true,
            emptyContent: null,
            ...commonProps,
        };
        renderAc(props);
        expect(document.querySelector(`.${optionCls}-empty`)).toBeNull();
        expect(getList()).toBeEmptyDOMElement();
    });

    it('【Option showTick】showTick 为 true 时渲染勾选图标', () => {
        const props = {
            data: stringData,
            defaultOpen: true,
            defaultValue: 'semi',
            ...commonProps,
        };
        renderAc(props);
        expect(getFocusedOption()).toHaveTextContent('semi');
        expect(document.querySelector(`.${optionCls}-icon`)).toBeNull();
    });

    it('【输入值匹配】输入值匹配的选项被聚焦', () => {
        const props = {
            data: stringData,
            defaultOpen: true,
            ...commonProps,
        };
        renderAc(props);
        fireEvent.change(getInput(), { target: { value: 'semi' } });
        expect(getInput()).toHaveValue('semi');
        expect(getFocusedOption()).toHaveTextContent('semi');
    });

    it('【点击外部处理】点击外部时关闭下拉', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<AutoCompleteProps<string>['onDropdownVisibleChange']>>();
        const props = {
            defaultOpen: true,
            data: stringData,
            onDropdownVisibleChange,
            ...commonProps,
        };
        renderAc(props);
        fireEvent.mouseDown(getOptions()[0]);
        expect(onDropdownVisibleChange).not.toHaveBeenCalledWith(false);
        expect(getList()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        await expectClosed();
    });

    it('【点击外部处理】在列表内已打开的嵌套 Popover 里按下鼠标不关闭下拉，在外部按下才关闭', async () => {
        // with its default stopPropagation the AutoComplete stops the native mousedown before the document sees it
        renderAc({
            ...commonProps,
            defaultOpen: true,
            data: ['semi'],
            stopPropagation: false,
            renderItem: () => (
                <Popover aria-label="Nested" content={<button type="button">inside nested</button>} motion={false} trigger="custom" visible>
                    <span>nested trigger</span>
                </Popover>
            ),
        });
        fireEvent.mouseDown(await screen.findByRole('button', { name: 'inside nested' }));
        expect(getList()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        await expectClosed();
    });

    it('【点击外部处理】在 suffix 内已打开的嵌套 Popover 里按下鼠标不关闭下拉，在外部按下才关闭', async () => {
        // with its default stopPropagation the AutoComplete stops the native mousedown before the document sees it
        renderAc({
            ...commonProps,
            defaultOpen: true,
            data: ['semi'],
            stopPropagation: false,
            suffix: (
                <Popover aria-label="Nested" content={<button type="button">inside nested</button>} motion={false} trigger="custom" visible>
                    <span>nested trigger</span>
                </Popover>
            ),
        });
        fireEvent.mouseDown(await screen.findByRole('button', { name: 'inside nested' }));
        expect(getList()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        await expectClosed();
    });

    it('【updateScrollTop】滚动到选中项', () => {
        const props = {
            data: layoutData(stringData),
            defaultOpen: true,
            defaultActiveFirstOption: true,
            ...commonProps,
        };
        renderAc(props);
        focusInput();
        pressKey('DOWN');
        expect(getFocusedOption()).toHaveTextContent('ies');
        expect(getList().scrollTop).toEqual(40);
    });

    it('【Up 键】焦点上移', () => {
        const props = {
            defaultOpen: true,
            data: stringData,
            defaultActiveFirstOption: true,
            ...commonProps,
        };
        renderAc(props);
        focusInput();
        pressKey('DOWN');
        pressKey('DOWN');
        expect(getFocusedOption()).toHaveTextContent('design');
        pressKey('UP');
        expect(getFocusedOption()).toHaveTextContent('ies');
    });

    it('【triggerRender】渲染自定义触发器', async () => {
        const triggerRender = ({ value }) => <div className="custom-trigger">{value || 'Select'}</div>;
        const props = {
            data: stringData,
            triggerRender,
            ...commonProps,
        };
        const { container } = renderAc(props);
        const trigger = container.querySelector('.custom-trigger');
        expect(trigger).not.toBeNull();
        await userEvent.click(trigger);
        expect(getOptionTexts()).toEqual(stringData);
    });

    it.each(['{Enter}', ' ', '{ArrowDown}'])('triggerRender 内按钮聚焦时 %j 只交给按钮，不打开面板', async (key) => {
        const onPress = vi.fn<(e: { stopPropagation: () => void }) => void>((e) => e.stopPropagation());
        renderAc({
            data: stringData,
            triggerRender: () => (
                <div className="custom-trigger">
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
                <div className="custom-trigger">
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

    it('【stopPropagation】阻止事件冒泡', async () => {
        const onParentClick = vi.fn<(e: ReactMouseEvent) => void>();
        const props = {
            data: stringData,
            stopPropagation: true,
            defaultOpen: true,
            ...commonProps,
        };
        render(
            <div role="presentation" onClick={onParentClick}>
                <AutoComplete {...props} />
            </div>
        );
        await userEvent.click(getOptions()[0]);
        expect(onParentClick).not.toHaveBeenCalled();
    });

    it('【renderSelectedItem】渲染已选项', () => {
        const renderSelectedItem = (option) => `Selected: ${option.value}`;
        const props = {
            data: stringData,
            renderSelectedItem,
            defaultValue: 'semi',
            ...commonProps,
        };
        renderAc(props);
        expect(getInput()).toHaveValue('Selected: semi');
    });

    it('【Option onMouseEnter】触发 onMouseEnter', () => {
        const props = {
            data: stringData,
            defaultOpen: true,
            ...commonProps,
        };
        renderAc(props);
        expect(getFocusedOption()).toBeNull();
        fireEvent.mouseEnter(getOptions()[0]);
        expect(getFocusedOption()).toBe(getOptions()[0]);
    });

    it('【loading】显示加载指示器', () => {
        const props = {
            data: stringData,
            defaultOpen: true,
            loading: true,
            ...commonProps,
        };
        renderAc(props);
        const loading = document.querySelector(`.${BASE_CLASS_PREFIX}-autocomplete-loading-wrapper`);
        expect(loading.querySelector(`.${BASE_CLASS_PREFIX}-spin`)).not.toBeNull();
    });

    it('【updateScrollTop 带 index】滚动到指定索引', () => {
        const props = {
            data: layoutData(stringData),
            defaultOpen: true,
            defaultActiveFirstOption: true,
            ...commonProps,
        };
        renderAc(props);
        focusInput();
        pressKey('DOWN');
        pressKey('DOWN');
        expect(getFocusedOption()).toHaveTextContent('design');
        expect(getList().scrollTop).toEqual(80);
    });

    it('【Option 点击带 rest props】透传 rest props', async () => {
        const customData = [{ label: 'Option 1', value: 'opt1', customProp: 'custom' }];
        const onSelect = vi.fn<(value: unknown) => void>();
        const props = {
            data: customData,
            defaultOpen: true,
            onSelect,
            onSelectWithObject: true,
            ...commonProps,
        };
        renderAc(props);
        await userEvent.click(getOptions()[0]);
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: 'opt1', label: 'Option 1', customProp: 'custom' }));
    });

    it('【Option 禁用状态】不触发 onSelect', async () => {
        const onSelect = vi.fn<(value: unknown) => void>();
        const customData = [{ label: 'Disabled Option', value: 'disabled', disabled: true }];
        const props = {
            data: customData,
            defaultOpen: true,
            onSelect,
            ...commonProps,
        };
        renderAc(props);
        await userEvent.click(getOptions()[0]);
        expect(onSelect).not.toHaveBeenCalled();
        expect(getList()).not.toBeNull();
    });

    it('【notifyDropdownVisibleChange】触发 onDropdownVisibleChange 回调', async () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<AutoCompleteProps<string>['onDropdownVisibleChange']>>();
        const props = {
            data: stringData,
            onDropdownVisibleChange,
            ...commonProps,
        };
        renderAc(props);
        await userEvent.click(getInput());
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(true);
        await userEvent.click(getInput());
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        expect(onDropdownVisibleChange).toHaveBeenCalledTimes(2);
    });

    it('【toggleListVisible】切换可见状态', async () => {
        const props = {
            data: stringData,
            ...commonProps,
        };
        renderAc(props);
        await userEvent.click(getInput());
        expect(getList()).not.toBeNull();
        await userEvent.click(getInput());
        await expectClosed();
    });

    it('【updateOptionList】更新选项 state', () => {
        const props = {
            data: stringData,
            defaultOpen: true,
            ...commonProps,
        };
        const { rerender } = renderAc(props);
        rerender(<AutoComplete {...props} data={[{ label: 'new', value: 'new' }]} />);
        expect(getOptionTexts()).toEqual(['new']);
    });

    it('【updateSelection】更新选中 state', async () => {
        const triggerRender = ({ value }) => <div className="custom-trigger">{value.length ? value.map((item) => item.label).join(',') : 'empty'}</div>;
        const props = {
            data: stringData,
            triggerRender,
            ...commonProps,
        };
        renderAc(props);
        expect(screen.getByText('empty')).toBeInTheDocument();
        await userEvent.click(screen.getByText('empty'));
        await userEvent.click(getOptions()[1]);
        expect(document.querySelector('.custom-trigger')).toHaveTextContent(/^ies$/);
    });

    it('【Option showTick】数据项的 showTick 不渲染勾选图标', () => {
        const customData = [{ label: 'Option 1', value: 'opt1', showTick: true }];
        const props = {
            data: customData,
            defaultOpen: true,
            defaultValue: 'opt1',
            ...commonProps,
        };
        renderAc(props);
        expect(getOptions()[0].querySelector(`.${optionCls}-icon`)).toBeNull();
    });

    it('【handleInputClick】触发 foundation handleInputClick', async () => {
        const props = {
            data: stringData,
            ...commonProps,
        };
        const { container } = renderAc(props);
        await userEvent.click(container.querySelector(`.${BASE_CLASS_PREFIX}-autocomplete`));
        expect(getList()).not.toBeNull();
    });

    it('【data 项 className 与 style】经 data 传入的选项应用自定义类名与样式', () => {
        const customData = [{ label: 'Styled Option', value: 'styled', className: 'custom-class', style: { color: 'red' } }];
        const props = {
            data: customData,
            defaultOpen: true,
            ...commonProps,
        };
        renderAc(props);
        const option = getOptions()[0];
        expect(option).toHaveClass('custom-class');
        expect(option).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('【componentWillUnmount】调用 foundation destroy', () => {
        const onDropdownVisibleChange = vi.fn<NonNullable<AutoCompleteProps<string>['onDropdownVisibleChange']>>();
        const props = {
            data: stringData,
            onDropdownVisibleChange,
            ...commonProps,
        };
        const { unmount } = renderAc(props);
        fireEvent.click(getInput());
        expect(onDropdownVisibleChange).toHaveBeenCalledWith(true);
        unmount();
        fireEvent.mouseDown(document.body);
        expect(onDropdownVisibleChange).toHaveBeenCalledTimes(1);
    });

    it('【stopPropagation】阻止事件冒泡', async () => {
        const onParentMouseDown = vi.fn<(e: ReactMouseEvent) => void>();
        const props = {
            data: stringData,
            stopPropagation: true,
            defaultOpen: true,
            ...commonProps,
        };
        render(
            <div role="presentation" onMouseDown={onParentMouseDown}>
                <AutoComplete {...props} />
            </div>
        );
        fireEvent.mouseDown(getOptions()[0]);
        expect(onParentMouseDown).not.toHaveBeenCalled();
    });

    it('【aria combobox】input 暴露 expanded、controls、autocomplete 与 activedescendant', () => {
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
        const focused = getFocusedOption();
        expect(focused).toHaveAttribute('role', 'option');
        expect(focused.id).not.toBe('');
        expect(input).toHaveAttribute('aria-activedescendant', focused.id);
        expect(new Set(getOptions().map((o) => o.id)).size).toBe(getOptions().length);
    });

    it('【renderSelectedItem】渲染已选项', async () => {
        const renderSelectedItem = (item) => `Selected: ${item.value}`;
        const props = {
            data: stringData,
            renderSelectedItem,
            defaultValue: 'semi',
            defaultOpen: true,
            ...commonProps,
        };
        renderAc(props);
        await userEvent.click(getOptions()[2]);
        expect(getInput()).toHaveValue('Selected: design');
    });

    it('【updateScrollTop adapter】更新滚动位置', () => {
        const props = {
            data: layoutData(stringData),
            defaultOpen: true,
            defaultActiveFirstOption: true,
            ...commonProps,
        };
        renderAc(props);
        focusInput();
        pressKey('UP');
        expect(getFocusedOption()).toHaveTextContent('platform');
        expect(getList().scrollTop).toEqual(120);
    });

    it('【updateScrollTop adapter 无 index】更新滚动位置', () => {
        const props = {
            data: layoutData(stringData),
            defaultOpen: true,
            defaultValue: 'semi',
            ...commonProps,
        };
        renderAc(props);
        expect(getList().scrollTop).toEqual(0);
        focusInput();
        pressKey('DOWN');
        pressKey('DOWN');
        pressKey('DOWN');
        expect(getFocusedOption()).toHaveTextContent('platform');
        expect(getList().scrollTop).toEqual(120);
    });

    it('【clickOutsideHandler】处理外部点击', async () => {
        const props = {
            data: stringData,
            defaultOpen: true,
            ...commonProps,
        };
        renderAc(props);
        fireEvent.mouseDown(getInput());
        expect(getList()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        await expectClosed();
    });

    it('【Option renderOptionItem 与交互】处理 onMouseEnter 与 onClick', async () => {
        const onSelect = vi.fn<(value: unknown) => void>();
        const renderItem = (item) => <div className="custom-option-item">{item.label}</div>;
        const customData = [
            { label: 'Custom 1', value: 'c1' },
            { label: 'Custom 2', value: 'c2' },
        ];
        const props = {
            data: customData,
            defaultOpen: true,
            onSelect,
            renderItem,
            ...commonProps,
        };
        renderAc(props);
        const items = document.querySelectorAll<HTMLElement>('.custom-option-item');
        expect(items).toHaveLength(2);
        fireEvent.mouseEnter(getOptions()[1]);
        expect(getFocusedOption()).toContainElement(items[1]);
        await userEvent.click(items[1]);
        expect(onSelect).toHaveBeenCalledWith('c2');
    });

    it('【Option empty 为 true 且使用默认 emptyContent】渲染语言包文案', () => {
        const props = {
            data: [],
            defaultOpen: true,
            ...commonProps,
        };
        renderAc(props);
        expect(getList()).toBeEmptyDOMElement();
    });

    it('【registerClickOutsideHandler】打开时注册处理函数', async () => {
        const props = {
            data: stringData,
            ...commonProps,
        };
        renderAc(props);
        await userEvent.click(getInput());
        expect(getList()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        await expectClosed();
    });

    // the focus index from the old results must be recomputed when new ones arrive, else Enter picks a missing option
    it('Fix2951 (#2952)：defaultActiveFirstOption 高亮输入后加载的数据的第一个选项', () => {
        const onSelect = vi.fn<(value: unknown) => void>();
        const props = { defaultActiveFirstOption: true, onSelect, ...commonProps };
        const { rerender } = render(<AutoComplete {...props} data={[]} />);
        const search = (value, results) => {
            fireEvent.change(getInput(), { target: { value } });
            rerender(<AutoComplete {...props} data={[]} loading />);
            rerender(<AutoComplete {...props} data={results} loading={false} />);
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
    const getRoot = () => document.querySelector(`.${BASE_CLASS_PREFIX}-autocomplete`);

    it('非受控：输入会更新 input，选择会写入选项值', async () => {
        const onSearch = vi.fn<NonNullable<AutoCompleteProps<string>['onSearch']>>();
        const onChange = vi.fn<NonNullable<AutoCompleteProps<string>['onChange']>>();
        renderAc({ data: stringData, onSearch, onChange, ...commonProps });
        fireEvent.change(getInput(), { target: { value: 'de' } });
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
        fireEvent.change(getInput(), { target: { value: 'semiX' } });
        expect(getInput()).toHaveValue('semi');
        expect(onChange).toHaveBeenLastCalledWith('semiX');
        await userEvent.click(getOptions()[1]);
        expect(onSelect).toHaveBeenLastCalledWith('ies');
        expect(onChange).toHaveBeenLastCalledWith('ies');
        expect(getInput()).toHaveValue('semi');
        await expectClosed();
        rerender(<AutoComplete value="ies" data={stringData} {...commonProps} />);
        expect(getInput()).toHaveValue('ies');
    });

    it('onSelectWithObject 传入整个 data 项；renderSelectedItem 填充 input', async () => {
        const onSelect = vi.fn<(value: unknown) => void>();
        renderAc({
            data: objectData,
            onSelect,
            onSelectWithObject: true,
            renderItem: (item) => item.email,
            renderSelectedItem: (item) => item.email,
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
        const data = [{ value: 'a' }, { value: 'b', disabled: true }, { value: 'c' }];
        renderAc({ data, onSelect, ...commonProps });
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
        hoverInput();
        clickClear();
        expect(getInput()).toHaveValue('');
        expect(onSearch).toHaveBeenLastCalledWith('');
        expect(onChange).toHaveBeenLastCalledWith('');
    });

    it('loading 用加载指示器替换选项；data 为空时显示 emptyContent', () => {
        const { rerender } = renderAc({ data: stringData, defaultOpen: true, loading: true, ...commonProps });
        expect(getOptions()).toHaveLength(0);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-autocomplete-loading-wrapper .${BASE_CLASS_PREFIX}-spin`)).not.toBeNull();
        rerender(<AutoComplete data={[]} defaultOpen emptyContent="nothing" {...commonProps} />);
        expect(getList()).toHaveTextContent('nothing');
    });

    it('把 data-* 放在根 div 上，把 aria 属性放在 input 上', () => {
        renderAc({ 'data-testid': 'ac', 'aria-label': 'search', ...commonProps });
        expect(getRoot()).toHaveAttribute('data-testid', 'ac');
        expect(getInput()).toHaveAttribute('aria-label', 'search');
        expect(getRoot()).toHaveAttribute('tabindex', '-1');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { AutoComplete: { size: 'small' } };
        try {
            renderAc({ ...commonProps });
            expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-small`)).not.toBeNull();
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('formApi.reset 后 Form.AutoComplete 再次为空', async () => {
        let formApi;
        render(
            <Form getFormApi={(api) => (formApi = api)}>
                <Form.AutoComplete data={stringData} field="name" {...commonProps} />
            </Form>
        );
        fireEvent.change(getInput(), { target: { value: 'semi' } });
        expect(formApi.getValue('name')).toBe('semi');
        await act(() => formApi.reset());
        expect(formApi.getValue('name')).toBeUndefined();
        expect(getInput()).toHaveValue('');
    });

    it('StrictMode 下每次按键只上报一次，点击外部时关闭', async () => {
        const onChange = vi.fn<NonNullable<AutoCompleteProps<string>['onChange']>>();
        const onDropdownVisibleChange = vi.fn<NonNullable<AutoCompleteProps<string>['onDropdownVisibleChange']>>();
        render(
            <StrictMode>
                <AutoComplete data={stringData} onChange={onChange} onDropdownVisibleChange={onDropdownVisibleChange} {...commonProps} />
            </StrictMode>
        );
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
});

describe('AutoComplete 函数组件', () => {
    const getRoot = () => document.querySelector(`.${BASE_CLASS_PREFIX}-autocomplete`);

    it('ref 指向根 div', () => {
        const ref = createRef<HTMLDivElement>();
        renderAc({ ref, ...commonProps });
        expect(ref.current).toBe(getRoot());
    });

    it('triggerRender 收到不含 ref 的 componentProps', () => {
        const ref = createRef<HTMLDivElement>();
        const triggerRender = vi.fn<NonNullable<AutoCompleteProps<string>['triggerRender']>>(() => <span>trigger</span>);
        render(<AutoComplete ref={ref} triggerRender={triggerRender} {...commonProps} />);
        expect(triggerRender.mock.lastCall[0].componentProps).not.toHaveProperty('ref');
        expect(ref.current).toBe(document.querySelector('[tabindex="-1"]'));
    });

    it('未声明的属性落到根 div 上；Form 属性不进入 DOM，name 传给 input', () => {
        render(
            <Form labelPosition="inset">
                <Form.AutoComplete name="city-name" title="tip" data={stringData} field="city" {...commonProps} />
            </Form>
        );
        expect(getRoot()).toHaveAttribute('title', 'tip');
        expect(getInput()).toHaveAttribute('name', 'city-name');
        for (const attr of ['name', 'insetlabel', 'insetlabelid', 'validatestatus']) {
            expect(getRoot()).not.toHaveAttribute(attr);
        }
    });

    it('全局默认值填充组件没有默认值的键', () => {
        semiGlobal.config.overrideDefaultProps = { AutoComplete: { placeholder: 'global' } };
        try {
            renderAc({ ...commonProps });
            expect(getInput()).toHaveAttribute('placeholder', 'global');
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('StrictMode 下打开时只保留一个 document mousedown 监听，卸载后不保留', () => {
        const add = vi.spyOn(document, 'addEventListener');
        const remove = vi.spyOn(document, 'removeEventListener');
        const live = () => countLiveListeners(add, remove, 'mousedown');
        try {
            const { unmount } = render(
                <StrictMode>
                    <AutoComplete data={stringData} defaultOpen {...commonProps} />
                </StrictMode>
            );
            expect(live()).toBe(1);
            unmount();
            expect(live()).toBe(0);
        } finally {
            add.mockRestore();
            remove.mockRestore();
        }
    });
});

describe('AutoComplete 审计修复', () => {
    it('data 不变时换 renderItem，候选项内容随之更新', async () => {
        const data = ['semi', 'design'];
        const { rerender } = render(<AutoComplete {...commonProps} data={data} defaultOpen renderItem={(item: string) => <i>A-{item}</i>} />);
        expect(getOptionTexts()).toEqual(['A-semi', 'A-design']);
        rerender(<AutoComplete {...commonProps} data={data} defaultOpen renderItem={(item: string) => <i>B-{item}</i>} />);
        expect(getOptionTexts()).toEqual(['B-semi', 'B-design']);
    });

    it('键入时 renderItem 只对可见项各调用一次', async () => {
        const renderItem = vi.fn<(item: string) => string>((item) => item);
        renderAc({ ...commonProps, data: ['semi', 'design', 'ies'], defaultOpen: true, renderItem });
        const callsBefore = renderItem.mock.calls.length;
        fireEvent.change(getInput(), { target: { value: 's' } });
        expect(renderItem.mock.calls.length - callsBefore).toBeLessThanOrEqual(3 * 2);
    });

    it('鼠标悬停禁用项后按 Enter 不选中', async () => {
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
        const data = [{ value: 'a', label: 'A', className: 'x', extra: 1 }, 'plain'];
        const clickSelect = vi.fn<(value: unknown) => void>();
        const { unmount } = renderAc({
            ...commonProps,
            data,
            defaultOpen: true,
            onSelectWithObject: true,
            onSelect: clickSelect,
        });
        await userEvent.click(getOptions()[0]);
        unmount();

        const enterSelect = vi.fn<(value: unknown) => void>();
        renderAc({
            ...commonProps,
            data,
            defaultOpen: true,
            defaultActiveFirstOption: true,
            onSelectWithObject: true,
            onSelect: enterSelect,
        });
        focusInput();
        pressKey('ENTER');
        expect(clickSelect.mock.calls[0][0]).toEqual({ value: 'a', label: 'A', className: 'x', extra: 1 });
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

        renderAc({
            ...commonProps,
            data: [{ value: 'a', label: 'A', disabled: true }],
            defaultOpen: true,
        });
        focusInput();
        pressKey('UP');
        pressKey('DOWN');
        expect(getFocusedOption()).toBeNull();
    });

    it('onSelectWithObject 下不在 data 中的 defaultValue 照常显示，renderSelectedItem 收到 { label, value }', () => {
        const renderSelectedItem = vi.fn<(option: BaseDataItem) => string>((option) => String(option.value));
        renderAc({
            ...commonProps,
            data: ['semi'],
            defaultValue: 'other',
            onSelectWithObject: true,
            renderSelectedItem,
        });
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
        renderAc({ ...commonProps, data: [{ value: 'a', focused: true }, { value: 'b' }], defaultOpen: true });
        expect(getOptions()).toHaveLength(2);
        expect(getFocusedOption()).toBeNull();
    });
});

describe('AutoComplete 审计余量', () => {
    it('使用 triggerRender 不打印警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(<AutoComplete {...commonProps} triggerRender={() => <span>trigger</span>} />);
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });
});

describe('AutoComplete 批 6 修复', () => {
    it('无效数据项不占位：高亮项与 Enter 选中项一致', () => {
        const onSelect = vi.fn<NonNullable<AutoCompleteProps<string>['onSelect']>>();
        renderAc({
            ...commonProps,
            data: [{ label: 'x' }, 'a', 'b', 'c'],
            defaultValue: 'b',
            defaultOpen: true,
            onSelect,
        });
        expect(getOptionTexts()).toEqual(['a', 'b', 'c']);
        expect(getFocusedOption()).toHaveTextContent('b');
        pressKey('ENTER');
        expect(onSelect).toHaveBeenCalledWith('b');
    });

    it('data 全是无效项时显示 emptyContent', () => {
        renderAc({ ...commonProps, data: [{ label: 'x' }], defaultOpen: true, emptyContent: <i>none</i> });
        expect(getList()).toHaveTextContent('none');
    });

    it('listbox 的 mousedown 被阻止默认行为，焦点留在输入框', () => {
        renderAc({ ...commonProps, data: stringData, defaultOpen: true });
        expect(fireEvent.mouseDown(getOptions()[0])).toBe(false);
    });

    it('listbox 自身（内边距与滚动条）上的 mousedown 同样阻止默认行为', () => {
        renderAc({ ...commonProps, data: stringData, defaultOpen: true });
        expect(fireEvent.mouseDown(screen.getByRole('listbox'))).toBe(false);
    });

    describe('combobox 与 listbox 用同一个名称来源', () => {
        it('使用方 aria-label 时两者都用该值', () => {
            renderAc({
                ...commonProps,
                'aria-label': 'city',
                insetLabel: 'Inset',
                data: stringData,
                defaultOpen: true,
            });
            expect(getInput()).toHaveAccessibleName('city');
            expect(screen.getByRole('listbox')).toHaveAttribute('aria-label', 'city');
            expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-labelledby');
        });

        it('使用方 aria-labelledby 优先于 insetLabel，两者指向同一个标签', () => {
            render(
                <>
                    <span id="lbl">cities</span>
                    <AutoComplete {...commonProps} aria-labelledby="lbl" data={stringData} defaultOpen insetLabel="City" />
                </>
            );
            expect(getInput()).toHaveAccessibleName('cities');
            expect(screen.getByRole('listbox')).toHaveAccessibleName('cities');
        });

        it('只有 insetLabel 时 combobox 与 listbox 都以 insetLabel 命名，没有 insetLabelId 时也能引用', () => {
            const { unmount } = renderAc({ ...commonProps, insetLabel: 'City', data: stringData, defaultOpen: true });
            expect(getInput()).toHaveAccessibleName('City');
            expect(screen.getByRole('listbox')).toHaveAccessibleName('City');
            unmount();
            renderAc({
                ...commonProps,
                insetLabel: 'City',
                insetLabelId: 'city-label',
                data: stringData,
                defaultOpen: true,
            });
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

    it('使用方的 onClick 与内部点击处理一起生效', () => {
        const onClick = vi.fn<(e: ReactMouseEvent) => void>();
        const { container } = render(<AutoComplete {...commonProps} data={stringData} onClick={onClick} />);
        fireEvent.click(container.querySelector(`.${BASE_CLASS_PREFIX}-autocomplete`) as HTMLElement);
        expect(onClick).toHaveBeenCalledTimes(1);
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

    it('类型：不再声明 mouseEnterDelay、mouseLeaveDelay、children、tabIndex，也没有 Option 静态成员', () => {
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
        const { rerender } = render(<AutoComplete {...props} value="abc" />);
        expect(getInput()).toHaveValue('abc');
        renderSelectedItem.mockClear();
        rerender(<AutoComplete {...props} value={undefined} />);
        expect(getInput()).toHaveValue('');
        expect(renderSelectedItem).not.toHaveBeenCalled();
    });

    it.each([true, false])('面板打开时受控 value 变回 undefined，高亮按 defaultActiveFirstOption=%s 重设', (defaultActiveFirstOption) => {
        const props = { ...commonProps, data: objectData, defaultOpen: true, defaultActiveFirstOption };
        const { rerender } = render(<AutoComplete {...props} value="vigo" />);
        expect(getInput()).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[2].id);
        rerender(<AutoComplete {...props} value={undefined} />);
        expect(getInput().getAttribute('aria-activedescendant')).toBe(defaultActiveFirstOption ? screen.getAllByRole('option')[0].id : null);
    });

    it('数据项的 selected、empty 等字段不覆盖选项的内部属性', () => {
        renderAc({ ...commonProps, data: [{ value: 'a', label: 'A', selected: true, empty: true, 'data-id': 'a' }], defaultOpen: true });
        const option = screen.getByRole('option', { name: 'A' });
        expect(option).toHaveAttribute('aria-selected', 'false');
        expect(option).not.toHaveClass(`${optionCls}-selected`);
        expect(option).toHaveAttribute('data-id', 'a');
    });

    it('面板里有可聚焦元素时，方向键仍只移动高亮，焦点留在输入框', async () => {
        renderAc({ ...commonProps, data: stringData, defaultOpen: true, renderItem: (item: string) => <button type="button">{item}</button> });
        getInput().focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(getInput()).toHaveFocus();
        expect(getFocusedOption()).toHaveTextContent('semi');
        await userEvent.keyboard('{ArrowUp}');
        expect(getInput()).toHaveFocus();
    });

    it('焦点在默认触发器的清除按钮上时，ArrowDown 不打开面板', async () => {
        const onKeyDown = vi.fn<(e: KeyboardEvent<HTMLDivElement>) => void>();
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
        const onKeyDown = vi.fn<(e: KeyboardEvent<HTMLDivElement>) => void>();
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
        render(
            <ConfigProvider direction="rtl">
                <AutoComplete {...commonProps} data={stringData} defaultOpen />
            </ConfigProvider>
        );
        expect(getPopupWrapper()).toHaveAttribute('x-placement', 'bottomRight');
    });

    it('label 为 JSX 的 data 每次渲染重建时，内容不变不重置高亮', () => {
        function Host({ tick }: { tick: number }) {
            const data = stringData.map((value) => ({ value, label: <b>{value}</b> }));
            return <AutoComplete {...commonProps} data-tick={tick} data={data} defaultOpen />;
        }
        const { rerender } = render(<Host tick={0} />);
        fireEvent.mouseEnter(getOptions()[2]);
        expect(getFocusedOption()).toHaveTextContent('design');
        rerender(<Host tick={1} />);
        expect(getFocusedOption()).toHaveTextContent('design');
    });
});

describe('Option', () => {
    const Option = Select.Option;
    const optionCls = `${BASE_CLASS_PREFIX}-select-option`;

    it('【Option empty 与 emptyContent null】返回 null', () => {
        const { container } = render(<Option empty emptyContent={null} onSelect={() => {}} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('【Option empty 与默认 emptyContent】渲染语言包文案', () => {
        const { container } = render(<Option empty onSelect={() => {}} />);
        expect(container.querySelector(`.${optionCls}-empty`)).toHaveTextContent('暂无数据');
    });

    it('【Option empty 与自定义 emptyContent】渲染自定义内容', () => {
        const { container } = render(<Option empty emptyContent={<span className="custom-empty">No data</span>} onSelect={() => {}} />);
        expect(container.querySelectorAll('.custom-empty')).toHaveLength(1);
    });

    it('【Option renderOptionItem】渲染自定义选项项', () => {
        const onSelect = vi.fn<OptionSelectHandler>();
        const onMouseEnter = vi.fn<(e: ReactMouseEvent) => void>();
        const renderOptionItem = (props) => (
            <div key={props.value} className="custom-rendered-item" role="presentation" onClick={props.onClick} onMouseEnter={props.onMouseEnter}>
                {props.label}
            </div>
        );
        const { container } = render(<Option value="test" label="Test" renderOptionItem={renderOptionItem} onMouseEnter={onMouseEnter} onSelect={onSelect} />);
        const item = container.querySelector('.custom-rendered-item');
        expect(item).toHaveTextContent('Test');
        fireEvent.click(item);
        expect(onSelect).toHaveBeenCalledTimes(1);
        fireEvent.mouseEnter(item);
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('【Option 禁用】不调用 onSelect', () => {
        const onSelect = vi.fn<OptionSelectHandler>();
        render(<Option disabled value="test" label="Test" onSelect={onSelect} />);
        fireEvent.click(screen.getByRole('option'));
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('【Option onClick】只通知一次选中，带上选项对象与点击事件', () => {
        const onSelect = vi.fn<(option: { value?: string; label?: string }, event: ReactMouseEvent) => void>();
        render(<Option value="test" label="Test Label" onSelect={onSelect} />);
        fireEvent.click(screen.getByRole('option'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect.mock.calls[0][0]).toEqual({ value: 'test', label: 'Test Label' });
        expect(onSelect.mock.calls[0][1].type).toBe('click');
    });

    it('【Option showTick】渲染勾选图标', () => {
        const { container } = render(<Option value="test" label="Test" selected showTick onSelect={() => {}} />);
        expect(container.querySelectorAll(`.${optionCls}-icon`)).toHaveLength(1);
    });

    it('【Option focused】应用 focused 类名', () => {
        render(<Option value="test" focused label="Test" onSelect={() => {}} />);
        expect(screen.getByRole('option')).toHaveClass(`${optionCls}-focused`);
    });

    it('【Option selected】应用 selected 类名', () => {
        render(<Option value="test" label="Test" selected onSelect={() => {}} />);
        const option = screen.getByRole('option');
        expect(option).toHaveClass(`${optionCls}-selected`);
        expect(option).toHaveAttribute('aria-selected', 'true');
    });

    it('【Option className 与 style】应用自定义类名与样式', () => {
        render(<Option className="custom-class" style={{ color: 'red' }} value="test" label="Test" onSelect={() => {}} />);
        const option = screen.getByRole('option');
        expect(option).toHaveClass('custom-class');
        expect(option).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('【Option renderOptionContent】高亮匹配文本', () => {
        const { container } = render(
            <Option value="test" inputValue="te" onSelect={() => {}}>
                test content
            </Option>
        );
        const text = container.querySelector(`.${optionCls}-text`);
        expect(text).toHaveTextContent('test content');
        const keywords = Array.from(container.querySelectorAll(`.${optionCls}-keyword`));
        expect(keywords.map((keyword) => keyword.textContent)).toEqual(['te', 'te']);
    });

    it('【Option onMouseEnter】调用 onMouseEnter', () => {
        const onMouseEnter = vi.fn<(e: ReactMouseEvent) => void>();
        render(<Option value="test" label="Test" onMouseEnter={onMouseEnter} onSelect={() => {}} />);
        fireEvent.mouseEnter(screen.getByRole('option'));
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
    });
});
