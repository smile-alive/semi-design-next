import { createRef, StrictMode, useState } from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconSearch } from '@fibrae/semi-icons-react';
import { Form, InputGroup, InputNumber, Tooltip } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import Input, { type InputChangeEvent, type InputGroupProps, type InputHandle, type InputProps } from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-input`;

function getValueLength(str) {
    if (typeof str === 'string') {
        return [...new Intl.Segmenter().segment(str)].length;
    } else {
        return -1;
    }
}

const getInput = () => document.querySelector('input');
const getWrapper = () => document.querySelector<HTMLElement>(`.${prefixCls}-wrapper`);
const query = (cls: string) => document.querySelector<HTMLElement>(`.${cls}`);
const getClearBtn = () => query(`${prefixCls}-clearbtn`);
const getModeBtn = () => query(`${prefixCls}-modebtn`);

describe('Input', () => {
    it('值变化时调用 onChange', () => {
        const inputValue = 'semi';
        const onChange = vi.fn<NonNullable<InputProps['onChange']>>();
        render(<Input onChange={onChange} />);
        fireEvent.change(getInput(), { target: { value: inputValue } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe(inputValue);
        expect(getInput()).toHaveValue(inputValue);
    });

    it('自定义 className 与 style', () => {
        render(<Input className="test" style={{ color: 'red' }} />);
        expect(getWrapper()).toHaveClass('test');
        expect(getWrapper()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('不同尺寸', () => {
        render(
            <>
                <Input size="large" />
                <Input />
                <Input size="small" />
            </>
        );
        const [large, def, small] = document.querySelectorAll('input');
        expect(large).toHaveClass(`${prefixCls}-large`);
        expect(def).toHaveClass(`${prefixCls}-default`);
        expect(small).toHaveClass(`${prefixCls}-small`);
    });

    it('带 placeholder', () => {
        const placeholderText = `semi placeholder`;
        render(<Input placeholder={placeholderText} />);
        expect(screen.getByPlaceholderText(placeholderText)).toBe(getInput());
    });

    it('带 defaultValue', () => {
        render(<Input defaultValue="semi" />);
        expect(getInput()).toHaveValue('semi');
    });

    it('props.disabled 时禁用', () => {
        render(<Input disabled />);
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-disabled`);
        expect(getInput()).toHaveClass(`${prefixCls}-disabled`);
        expect(getInput()).toBeDisabled();
    });

    it('不同的 validateStatus', () => {
        render(
            <>
                <Input validateStatus="warning" />
                <Input validateStatus="error" />
                <Input />
            </>
        );
        const [warning, error, normal] = document.querySelectorAll(`.${prefixCls}-wrapper`);
        expect(warning).toHaveClass(`${prefixCls}-wrapper-warning`);
        expect(error).toHaveClass(`${prefixCls}-wrapper-error`);
        expect(error.querySelector('input')).toHaveAttribute('aria-invalid', 'true');

        expect(normal).not.toHaveClass(`${prefixCls}-wrapper-error`);
        expect(normal).not.toHaveClass(`${prefixCls}-wrapper-warning`);
    });

    it('带 prefix / suffix', () => {
        render(
            <>
                <Input suffix={<div className="suffix">suffix</div>} />
                <Input prefix={<div className="prefix">prefix</div>} />
            </>
        );
        expect(query(`${prefixCls}-suffix`)).toContainElement(query('suffix'));
        expect(query(`${prefixCls}-prefix`)).toContainElement(query('prefix'));
    });

    it('插槽传入 Fragment 时照常渲染', () => {
        render(
            <Input
                addonBefore={<>a</>}
                suffix={
                    <>
                        <IconSearch />
                        <span>b</span>
                    </>
                }
            />
        );
        expect(query(`${prefixCls}-suffix`)).toHaveTextContent('b');
        expect(query(`${prefixCls}-prepend`)).toHaveTextContent(/^a$/);
    });

    it('插槽值为 0 时照常渲染，数字按文字处理', () => {
        render(<Input addonAfter={0} addonBefore={0} prefix={0} suffix={0} />);
        for (const slot of ['prefix', 'suffix', 'prepend', 'append']) {
            expect(query(`${prefixCls}-${slot}`)).toHaveTextContent(/^0$/);
            expect(query(`${prefixCls}-${slot}`)).toHaveClass(`${prefixCls}-${slot}-text`);
        }
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper__with-prefix`, `${prefixCls}-wrapper__with-suffix`, `${prefixCls}-wrapper__with-append`, `${prefixCls}-wrapper__with-prepend`);
    });

    it('insetLabel 为 0 时照常渲染', () => {
        render(<Input insetLabel={0} />);
        expect(query(`${prefixCls}-inset-label`)).toHaveTextContent(/^0$/);
    });

    it('addonBefore / addonAfter', () => {
        render(<Input addonAfter=".com" addonBefore="https://" />);
        expect(query(`${prefixCls}-prepend`)).toHaveTextContent(/^https:\/\/$/);
        expect(query(`${prefixCls}-append`)).toHaveTextContent(/^\.com$/);
    });

    it('password', () => {
        render(<Input type="password" />);
        expect(getInput()).toHaveAttribute('type', 'password');
    });

    it('password 模式', () => {
        const { rerender } = render(<Input />);
        expect(getInput()).toHaveAttribute('type', 'text');
        rerender(<Input mode="password" />);
        expect(getInput()).toHaveAttribute('type', 'password');
        rerender(<Input mode={'' as unknown as InputProps['mode']} />);
        expect(getInput()).toHaveAttribute('type', 'text');
    });

    it('password 点击眼睛图标', async () => {
        // autofocus is not a declared prop; it is only forwarded to the DOM
        render(<Input defaultValue="123456" {...{ autofocus: true }} mode="password" />);
        expect(getInput()).toHaveAttribute('type', 'password');
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Input.showPassword }));
        expect(getInput()).toHaveAttribute('type', 'text');
        expect(screen.getByRole('button', { name: zh_CN.Input.hidePassword })).toBe(getModeBtn());
        expect(getInput()).toHaveFocus();
    });

    it('受控模式', () => {
        const initValue = 'semi';
        const onChange = vi.fn<NonNullable<InputProps['onChange']>>();
        const { rerender } = render(<Input value={initValue} onChange={onChange} />);
        expect(getInput()).toHaveValue(initValue);

        const newInputValue = 'vita lemon';
        fireEvent.change(getInput(), { target: { value: newInputValue } });

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe(newInputValue);
        expect(getInput()).toHaveValue(initValue);

        rerender(<Input value={newInputValue} onChange={onChange} />);
        expect(getInput()).toHaveValue(newInputValue);
    });

    it('点击 prefix/suffix 聚焦', async () => {
        const onFocus = vi.fn<NonNullable<InputProps['onFocus']>>();
        const { unmount } = render(<Input style={{ width: 200 }} defaultValue="Semi Design" prefix="search" onFocus={onFocus} />);
        await userEvent.click(query(`${prefixCls}-prefix`));
        expect(getInput()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-focus`);
        expect(onFocus).toHaveBeenCalledTimes(1);
        unmount();

        render(<Input style={{ width: 200 }} defaultValue="Semi Design" suffix="search" onFocus={onFocus} />);
        await userEvent.click(query(`${prefixCls}-suffix`));
        expect(getInput()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-focus`);
        expect(onFocus).toHaveBeenCalledTimes(2);
    });

    it('GraphemeSplitter 函数', () => {
        const testCases = [
            ['💖', 1],
            ['字节跳动', 4],
            ['Semi 💖', 6],
            ['💖💖💖💖💖', 5],
            ['🤣', 1],
            ['1️⃣', 1],
            ['👨‍👨‍👦', 1],
        ];
        for (let item of testCases) {
            const [value, result] = item;
            expect(getValueLength(value)).toEqual(result);
        }
    });

    it('getValueLength 与 onChange', () => {
        const inputValue = '0123456789semi design';
        const onChange = vi.fn<NonNullable<InputProps['onChange']>>();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            render(<Input maxLength={10} getValueLength={getValueLength} onChange={onChange} />);
            fireEvent.change(getInput(), { target: { value: inputValue } });
            expect(warn).toHaveBeenCalledTimes(1);
        } finally {
            warn.mockRestore();
        }
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('0123456789');
        expect(getInput()).toHaveValue('0123456789');
    });

    it('visibleLength 受控模式', () => {
        const value = '0123456789semi design';
        render(<Input maxLength={10} value={value} getValueLength={getValueLength} />);
        expect(getInput()).toHaveValue(value);
        // the native maxLength would count UTF-16 units, so it is not set when getValueLength is given
        expect(getInput()).not.toHaveAttribute('maxlength');
    });

    it('minLength + getValueLength', () => {
        const inputValue = '💖💖💖';
        const minLength = 4;
        const onChange = vi.fn<NonNullable<InputProps['onChange']>>();
        render(<Input minLength={minLength} getValueLength={getValueLength} onChange={onChange} />);
        fireEvent.change(getInput(), { target: { value: inputValue } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe(inputValue);
        expect(getInput()).toHaveAttribute('minlength', String(inputValue.length + (minLength - getValueLength(inputValue))));
    });

    it('同时设置 maxLength 与 minLength 时，输入后仍调整原生 minlength', () => {
        const inputValue = '💖💖💖';
        const minLength = 4;
        render(<Input maxLength={10} minLength={minLength} getValueLength={getValueLength} />);
        fireEvent.change(getInput(), { target: { value: inputValue } });
        expect(getInput()).toHaveAttribute('minlength', String(inputValue.length + (minLength - getValueLength(inputValue))));
    });

    it('minLength 属性变化后，原生 minlength 随之变化', () => {
        const { rerender } = render(<Input minLength={5} />);
        expect(getInput()).toHaveAttribute('minlength', '5');
        rerender(<Input minLength={2} />);
        expect(getInput()).toHaveAttribute('minlength', '2');
    });

    it('传 getValueLength 时，原生 minlength 按当前值换算，不等下一次输入', () => {
        const value = '💖💖';
        const { rerender } = render(<Input minLength={4} value={value} getValueLength={getValueLength} />);
        expect(getInput()).toHaveAttribute('minlength', String(value.length + 2));
        rerender(<Input minLength={3} value={value} getValueLength={getValueLength} />);
        expect(getInput()).toHaveAttribute('minlength', String(value.length + 1));
        rerender(<Input minLength={1} value={value} getValueLength={getValueLength} />);
        expect(getInput()).toHaveAttribute('minlength', '1');
    });

    it('值为数字 0 时也显示清除按钮', () => {
        render(<Input value={0} showClear />);
        expect(getClearBtn()).not.toBeNull();
    });

    it('带 label 的 InputGroup 各自有唯一 id，并以 aria-labelledby 指向 label', () => {
        render(
            <>
                <InputGroup label={{ text: 'A' }}>
                    <Input />
                </InputGroup>
                <InputGroup label={{ text: 'B' }}>
                    <Input />
                </InputGroup>
            </>
        );
        const ids = [...document.querySelectorAll('[id]')].map((node) => node.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(screen.getByRole('group', { name: 'A' })).toBeInTheDocument();
        expect(screen.getByRole('group', { name: 'B' })).toBeInTheDocument();
    });

    it('InputGroup 不输出 aria-disabled，子控件各自 disabled', () => {
        render(
            <InputGroup disabled>
                <Input />
            </InputGroup>
        );
        expect(screen.getByRole('group')).not.toHaveAttribute('aria-disabled');
        expect(getInput()).toBeDisabled();
    });

    it('InputGroup 的 label.text 为 0 时照常渲染', () => {
        render(
            <InputGroup label={{ text: 0 }}>
                <Input />
            </InputGroup>
        );
        expect(document.querySelector(`.${prefixCls}-group-wrapper`)).not.toBeNull();
        expect(screen.getByRole('group', { name: '0' })).toBeInTheDocument();
    });

    it('input group 分组', async () => {
        const groupFocus = vi.fn<NonNullable<InputGroupProps['onFocus']>>();
        const groupBlur = vi.fn<NonNullable<InputGroupProps['onBlur']>>();
        const inputFocus = vi.fn<NonNullable<InputProps['onFocus']>>();
        const inputBlur = vi.fn<NonNullable<InputProps['onBlur']>>();
        render(
            <InputGroup disabled onBlur={groupBlur} onFocus={groupFocus}>
                <Input style={{ width: 100 }} disabled={false} placeholder="Name" onBlur={inputBlur} onFocus={inputFocus} />
                <InputNumber style={{ width: 140 }} placeholder="Score" />
            </InputGroup>
        );
        const [nameInput, scoreInput] = document.querySelectorAll('input');

        await userEvent.click(nameInput);
        expect(inputFocus).toHaveBeenCalledTimes(1);
        expect(groupFocus).toHaveBeenCalledTimes(1);
        await userEvent.click(document.body);
        expect(inputBlur).toHaveBeenCalledTimes(1);
        expect(groupBlur).toHaveBeenCalledTimes(1);
        expect(nameInput).toBeEnabled();
        expect(scoreInput).toBeDisabled();
    });

    it('InputGroup 原样渲染文本与数字子节点', () => {
        const { container } = render(
            <InputGroup>
                <Input aria-label="first" />-{2}
                <Input aria-label="second" />
            </InputGroup>
        );
        expect(screen.getAllByRole('textbox')).toHaveLength(2);
        expect(container).toHaveTextContent('-2');
    });

    it('InputGroup 在前面插入带 key 的子项后，已有输入框保持同一实例', async () => {
        const group = (keys: string[]) => (
            <InputGroup>
                {keys.map((key) => (
                    <Input key={key} aria-label={key} />
                ))}
            </InputGroup>
        );
        const { rerender } = render(group(['name']));
        const name = screen.getByRole('textbox', { name: 'name' });
        await userEvent.type(name, 'abc');
        rerender(group(['prefix', 'name']));
        expect(screen.getByRole('textbox', { name: 'name' })).toBe(name);
        expect(name).toHaveValue('abc');
    });

    it('InputGroup 的 onFocus、onBlur 对未自带处理器的子元素各触发一次', async () => {
        const groupFocus = vi.fn<NonNullable<InputGroupProps['onFocus']>>();
        const groupBlur = vi.fn<NonNullable<InputGroupProps['onBlur']>>();
        render(
            <InputGroup onBlur={groupBlur} onFocus={groupFocus}>
                <Input placeholder="Name" />
            </InputGroup>
        );
        await userEvent.click(getInput());
        expect(groupFocus).toHaveBeenCalledTimes(1);
        await userEvent.click(document.body);
        expect(groupBlur).toHaveBeenCalledTimes(1);
    });

    it('onCompositionStart 回调', () => {
        const onCompositionStart = vi.fn<NonNullable<InputProps['onCompositionStart']>>();
        render(<Input onCompositionStart={onCompositionStart} />);
        fireEvent.compositionStart(getInput(), { data: 'test' });
        expect(onCompositionStart).toHaveBeenCalledTimes(1);
    });

    it('onCompositionEnd 回调', () => {
        const onCompositionEnd = vi.fn<NonNullable<InputProps['onCompositionEnd']>>();
        render(<Input onCompositionEnd={onCompositionEnd} />);
        fireEvent.compositionEnd(getInput(), { data: 'test' });
        expect(onCompositionEnd).toHaveBeenCalledTimes(1);
    });

    it('onCompositionUpdate 回调', () => {
        const onCompositionUpdate = vi.fn<NonNullable<InputProps['onCompositionUpdate']>>();
        render(<Input onCompositionUpdate={onCompositionUpdate} />);
        fireEvent.compositionUpdate(getInput(), { data: 'test' });
        expect(onCompositionUpdate).toHaveBeenCalledTimes(1);
    });

    it('只有主键按下清除按钮才清空，其他鼠标键只阻止抢走焦点', () => {
        const onClear = vi.fn<NonNullable<InputProps['onClear']>>();
        render(<Input defaultValue="semi" showClear onClear={onClear} />);
        expect(fireEvent.mouseDown(getClearBtn(), { button: 2 })).toBe(false);
        expect(fireEvent.mouseDown(getClearBtn(), { button: 1 })).toBe(false);
        expect(onClear).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue('semi');
        fireEvent.mouseDown(getClearBtn());
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('清除按钮的 mousedown 照常冒泡，页面上其他弹层的点击外部能收到', () => {
        const onMouseDown = vi.fn<(event: MouseEvent) => void>();
        document.addEventListener('mousedown', onMouseDown);
        onTestFinished(() => document.removeEventListener('mousedown', onMouseDown));
        render(<Input defaultValue="semi" showClear />);
        fireEvent.mouseDown(getClearBtn());
        expect(onMouseDown).toHaveBeenCalledTimes(1);
    });

    it('位于点击触发的 Tooltip 内时，按下清除按钮不关闭自己的弹层', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        render(
            <Tooltip content="tip" motion={false} trigger="click" onVisibleChange={onVisibleChange}>
                <span>
                    <Input defaultValue="semi" showClear />
                </span>
            </Tooltip>
        );
        await userEvent.click(getInput());
        expect(await screen.findByText('tip')).toBeInTheDocument();
        onVisibleChange.mockClear();
        fireEvent.mouseDown(getClearBtn());
        expect(getClearBtn()).toBeNull();
        expect(onVisibleChange).not.toHaveBeenCalled();
    });

    it('showClear 与 onClear 回调', () => {
        const onClear = vi.fn<NonNullable<InputProps['onClear']>>();
        const onChange = vi.fn<NonNullable<InputProps['onChange']>>();
        render(<Input defaultValue="test" showClear onChange={onChange} onClear={onClear} />);
        fireEvent.mouseDown(getClearBtn());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('');
        expect(getInput()).toHaveValue('');
        expect(getClearBtn()).toBeNull();
    });

    it('readonly 属性', () => {
        render(<Input defaultValue="readonly text" readonly />);
        expect(getInput()).toHaveAttribute('readonly');
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-readonly`);
    });

    it('onFocus 回调', async () => {
        const onFocus = vi.fn<NonNullable<InputProps['onFocus']>>();
        render(<Input onFocus={onFocus} />);
        await userEvent.click(getInput());
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('onBlur 回调', async () => {
        const onBlur = vi.fn<NonNullable<InputProps['onBlur']>>();
        render(<Input onBlur={onBlur} />);
        await userEvent.click(getInput());
        expect(onBlur).not.toHaveBeenCalled();
        await userEvent.tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-wrapper-focus`);
    });

    it('onEnterPress 回调', async () => {
        const onEnterPress = vi.fn<NonNullable<InputProps['onEnterPress']>>();
        render(<Input onEnterPress={onEnterPress} />);
        await userEvent.type(getInput(), 'a');
        expect(onEnterPress).not.toHaveBeenCalled();
        await userEvent.keyboard('{Enter}');
        expect(onEnterPress).toHaveBeenCalledTimes(1);
    });

    it('onEnterPress 跳过确认输入法组合的 Enter', () => {
        const onEnterPress = vi.fn<NonNullable<InputProps['onEnterPress']>>();
        render(<Input onEnterPress={onEnterPress} />);
        fireEvent.keyDown(getInput(), { key: 'Enter', isComposing: true });
        expect(onEnterPress).not.toHaveBeenCalled();
        fireEvent.keyDown(getInput(), { key: 'Enter' });
        expect(onEnterPress).toHaveBeenCalledTimes(1);
    });

    it('borderless 属性', () => {
        render(<Input borderless />);
        expect(getWrapper()).toHaveClass(`${prefixCls}-borderless`);
    });

    it('onKeyDown 回调', () => {
        const onKeyDown = vi.fn<NonNullable<InputProps['onKeyDown']>>();
        render(<Input onKeyDown={onKeyDown} />);
        fireEvent.keyDown(getInput(), { key: 'a' });
        expect(onKeyDown).toHaveBeenCalledTimes(1);
    });

    it('onKeyUp 回调', () => {
        const onKeyUp = vi.fn<NonNullable<InputProps['onKeyUp']>>();
        render(<Input onKeyUp={onKeyUp} />);
        fireEvent.keyUp(getInput(), { key: 'a' });
        expect(onKeyUp).toHaveBeenCalledTimes(1);
    });

    it('insetLabel 属性', () => {
        render(<Input insetLabel="Label" />);
        expect(query(`${prefixCls}-inset-label`)).toHaveTextContent(/^Label$/);
    });

    it('自定义 clearIcon 图标', () => {
        render(<Input defaultValue="test" clearIcon={<span className="custom-clear-icon">X</span>} showClear />);
        expect(getClearBtn()).toContainElement(query('custom-clear-icon'));
    });

    it('hideSuffix 时后缀在清除按钮渲染期间带 suffix-hidden 类，由样式在悬停与焦点在内部时隐藏', () => {
        const { rerender } = render(<Input value="" hideSuffix showClear suffix="suffix" />);
        expect(query(`${prefixCls}-suffix`)).not.toHaveClass(`${prefixCls}-suffix-hidden`);
        rerender(<Input value="test" hideSuffix showClear suffix="suffix" />);
        expect(query(`${prefixCls}-suffix`)).toHaveClass(`${prefixCls}-suffix-hidden`);
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper__with-suffix-hidden`);
    });

    it('onInput 回调', () => {
        const onInput = vi.fn<NonNullable<InputProps['onInput']>>();
        render(<Input onInput={onInput} />);
        fireEvent.input(getInput(), { target: { value: 'test' } });
        expect(onInput).toHaveBeenCalledTimes(1);
    });

    it('onKeyPress 透传到原生 input', () => {
        const onKeyPress = vi.fn<NonNullable<InputProps['onKeyPress']>>();
        render(<Input onKeyPress={onKeyPress} />);
        fireEvent.keyPress(getInput(), { key: 'a', code: 'KeyA', charCode: 97 });
        expect(onKeyPress).toHaveBeenCalledTimes(1);
    });

    it('onlyBorder 属性', () => {
        render(<Input style={{ color: 'red' }} onlyBorder={1} />);
        expect(getWrapper()).toHaveClass(`${prefixCls}-only_border`);
        // jsdom's computed style does not resolve the border-width shorthand, so read the inline style
        expect(getWrapper().style.borderWidth).toBe('1px');
        expect(getWrapper()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('清除按钮随值渲染，输入框随之带 sibling-clearbtn 类', () => {
        const { rerender } = render(<Input value="test" showClear />);
        expect(getClearBtn()).not.toBeNull();
        expect(getInput()).toHaveClass(`${prefixCls}-sibling-clearbtn`);
        rerender(<Input value="" showClear />);
        expect(getClearBtn()).toBeNull();
        expect(getInput()).not.toHaveClass(`${prefixCls}-sibling-clearbtn`);
    });

    it('通过 componentDidUpdate 切换 mode', () => {
        const { rerender } = render(<Input defaultValue="test" mode="password" />);
        expect(getInput()).toHaveAttribute('type', 'password');
        rerender(<Input defaultValue="test" mode={'text' as unknown as InputProps['mode']} />);
        expect(getInput()).toHaveAttribute('type', 'text');
        expect(getModeBtn()).toBeNull();
    });

    it('带 label 的 InputGroup', () => {
        render(
            <InputGroup label={{ text: 'Group Label' }} labelPosition="top">
                <Input placeholder="Name" />
                <InputNumber placeholder="Score" />
            </InputGroup>
        );
        const wrapper = query(`${prefixCls}-group-wrapper`);
        expect(wrapper).toHaveClass(`${prefixCls}-group-wrapper-with-top-label`);
        expect(wrapper).toHaveTextContent('Group Label');
    });

    it('label 位于左侧的 InputGroup', () => {
        render(
            <InputGroup label={{ text: 'Label', name: 'custom-label' }} labelPosition="left">
                <Input placeholder="Name" />
            </InputGroup>
        );
        expect(query(`${prefixCls}-group-wrapper`)).toHaveClass(`${prefixCls}-group-wrapper-with-left-label`);
    });

    it('带 size 属性的 InputGroup', () => {
        render(
            <InputGroup size="large">
                <Input placeholder="Name" />
            </InputGroup>
        );
        expect(screen.getByRole('group')).toHaveClass(`${prefixCls}-large`);
        expect(getInput()).toHaveClass(`${prefixCls}-large`);
    });

    it('子节点为 null 的 InputGroup', () => {
        render(
            <InputGroup>
                <Input placeholder="Name" />
                {null}
                <Input placeholder="Score" />
            </InputGroup>
        );
        expect(document.querySelectorAll('input')).toHaveLength(2);
    });

    it('单个子节点的 InputGroup', () => {
        render(
            <InputGroup>
                <Input placeholder="Name" />
            </InputGroup>
        );
        expect(document.querySelectorAll('input')).toHaveLength(1);
    });

    it('密码按钮是原生 button，Space 切换显隐并把焦点交给输入框', async () => {
        render(<Input defaultValue="test" mode="password" />);
        expect(getModeBtn().tagName).toBe('BUTTON');
        expect(getModeBtn()).toHaveAttribute('type', 'button');
        expect(getModeBtn()).not.toHaveAttribute('role');
        expect(getModeBtn()).not.toHaveAttribute('tabindex');
        getModeBtn().focus();
        await userEvent.keyboard(' ');
        expect(getInput()).toHaveAttribute('type', 'text');
        // toggling moves focus into the input, so focus the button again
        expect(getInput()).toHaveFocus();
        getModeBtn().focus();
        await userEvent.keyboard(' ');
        expect(getInput()).toHaveAttribute('type', 'password');
    });

    it('密码按钮的 mousedown 阻止默认行为', () => {
        render(<Input defaultValue="test" mode="password" />);
        expect(fireEvent.mouseDown(getModeBtn())).toBe(false);
    });

    it('ref 为函数时接收句柄', () => {
        let handle = null;
        const refFn = (value) => {
            handle = value;
        };
        render(<Input ref={refFn} />);
        expect(handle.input).toBe(getInput());
        expect(handle.nativeElement).toBe(getWrapper());
    });

    it('ref 为对象时接收句柄', () => {
        const refObj = createRef<InputHandle>();
        render(<Input ref={refObj} />);
        expect(refObj.current.input).toBe(getInput());
        expect(refObj.current.nativeElement).toBe(getWrapper());
    });

    it('密码按钮按下与松开鼠标不切换模式，点击才切换', () => {
        render(<Input defaultValue="test" mode="password" />);
        fireEvent.mouseDown(getModeBtn());
        fireEvent.mouseUp(getModeBtn());
        expect(getInput()).toHaveAttribute('type', 'password');
        fireEvent.click(getModeBtn());
        expect(getInput()).toHaveAttribute('type', 'text');
    });

    it('adapter getIfFocusing', async () => {
        render(<Input defaultValue="test" />);
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-wrapper-focus`);
        await userEvent.click(getWrapper());
        expect(getInput()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-focus`);
    });

    it('未开启 showClear 时有值也不渲染清除按钮', () => {
        render(<Input defaultValue="test" />);
        expect(getClearBtn()).toBeNull();
        expect(getInput()).not.toHaveClass(`${prefixCls}-sibling-clearbtn`);
    });

    it('密码按钮按 Enter 切换显隐，Enter 与 Space 不冒泡到宿主的 keydown 处理器', async () => {
        const onHostKeyDown = vi.fn<() => void>();
        document.addEventListener('keydown', onHostKeyDown);
        onTestFinished(() => document.removeEventListener('keydown', onHostKeyDown));
        render(<Input defaultValue="test" mode="password" />);
        getModeBtn().focus();
        await userEvent.keyboard('{Enter}');
        expect(getInput()).toHaveAttribute('type', 'text');
        expect(getInput()).toHaveFocus();
        getModeBtn().focus();
        await userEvent.keyboard(' ');
        expect(getInput()).toHaveAttribute('type', 'password');
        expect(onHostKeyDown).not.toHaveBeenCalled();
    });

    it('prefix 的 mousedown 阻止默认行为', () => {
        render(<Input defaultValue="test" prefix="prefix" />);
        expect(fireEvent.mouseDown(query(`${prefixCls}-prefix`))).toBe(false);
    });

    it('suffix 的 mousedown 阻止默认行为', () => {
        render(<Input defaultValue="test" suffix="suffix" />);
        expect(fireEvent.mouseDown(query(`${prefixCls}-suffix`))).toBe(false);
    });
});

describe('Input 行为基线', () => {
    it('非受控输入框保留用户输入，并上报 change 事件', async () => {
        const onChange = vi.fn<NonNullable<InputProps['onChange']>>();
        render(<Input defaultValue="a" onChange={onChange} />);
        await userEvent.type(getInput(), 'bc');
        expect(getInput()).toHaveValue('abc');
        expect(onChange.mock.calls.map(([value]) => value)).toEqual(['ab', 'abc']);
        expect(onChange.mock.calls[1][1].target).toBe(getInput());
    });

    it('受控输入框跟随父组件回写的值', async () => {
        function Controlled() {
            const [value, setValue] = useState('');
            return <Input value={value} onChange={(v) => setValue(v.toUpperCase())} />;
        }
        render(<Controlled />);
        await userEvent.type(getInput(), 'ab');
        expect(getInput()).toHaveValue('AB');
    });

    it('受控值回到 undefined（表单重置）时清空输入框', () => {
        const { rerender } = render(<Input value="semi" />);
        expect(getInput()).toHaveValue('semi');
        rerender(<Input value={undefined} />);
        expect(getInput()).toHaveValue('');
    });

    it('value={undefined} 按非受控处理：取 defaultValue，输入即更新', async () => {
        render(<Input defaultValue="semi" value={undefined} />);
        expect(getInput()).toHaveValue('semi');
        await userEvent.type(getInput(), '!');
        expect(getInput()).toHaveValue('semi!');
    });

    it('formApi.reset 后 Form.Input 重新变为空', async () => {
        let formApi;
        render(
            <Form getFormApi={(api) => (formApi = api)}>
                <Form.Input field="name" />
            </Form>
        );
        await userEvent.type(getInput(), 'semi');
        expect(formApi.getValue('name')).toBe('semi');
        await act(() => formApi.reset());
        expect(getInput()).toHaveValue('');
    });

    it('Form.Input 把字段属性放到原生 input 上，而非包裹层', () => {
        render(
            <Form>
                <Form.Input id="name" field="name" label="Name" />
            </Form>
        );
        expect(getInput()).toHaveAttribute('id', 'name');
        expect(getInput()).toHaveAttribute('aria-labelledby');
        expect(getWrapper()).not.toHaveAttribute('id');
        expect(getWrapper()).not.toHaveAttribute('validatestatus');
        expect(getInput()).not.toHaveAttribute('validatestatus');
        expect(getInput()).not.toHaveAttribute('insetlabel');
    });

    it('清空受控输入框时上报空值，但在属性变化前仍显示该属性值', () => {
        const onChange = vi.fn<NonNullable<InputProps['onChange']>>();
        const onClear = vi.fn<NonNullable<InputProps['onClear']>>();
        render(<Input value="semi" showClear onChange={onChange} onClear={onClear} />);
        fireEvent.mouseDown(getClearBtn());
        expect(onChange).toHaveBeenCalledWith('', expect.anything());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('semi');
    });

    it('清除按钮触发 onChange 时第二个参数是鼠标事件，类型包含它', () => {
        const onChange = vi.fn<NonNullable<InputProps['onChange']>>();
        render(<Input defaultValue="semi" showClear onChange={onChange} />);
        fireEvent.mouseDown(getClearBtn());
        expect(onChange).toHaveBeenCalledWith('', expect.objectContaining({ type: 'mousedown' }));
        expectTypeOf<React.MouseEvent<HTMLButtonElement>>().toExtend<InputChangeEvent>();
        expectTypeOf<React.CompositionEvent<HTMLInputElement>>().toExtend<InputChangeEvent>();
        expectTypeOf<React.ChangeEvent<HTMLInputElement>>().toExtend<InputChangeEvent>();
    });

    it('清除按钮有值才渲染，禁用时不渲染，showClearIgnoreDisabled 时仍渲染', () => {
        const { rerender } = render(<Input value="" showClear />);
        expect(getClearBtn()).toBeNull();
        rerender(<Input disabled value="semi" showClear />);
        expect(getClearBtn()).toBeNull();
        rerender(<Input disabled value="semi" showClear showClearIgnoreDisabled />);
        expect(getClearBtn()).not.toBeNull();
        rerender(<Input value="semi" showClear />);
        expect(getClearBtn()).not.toBeNull();
    });

    it('只读时不渲染清除按钮，showClearIgnoreDisabled 也不例外', () => {
        const { rerender } = render(<Input defaultValue="semi" readonly showClear />);
        expect(getClearBtn()).toBeNull();
        rerender(<Input defaultValue="semi" disabled readonly showClear showClearIgnoreDisabled />);
        expect(getClearBtn()).toBeNull();
    });

    it('原生 readOnly 只锁定输入，仍可清除', async () => {
        const onClear = vi.fn<NonNullable<InputProps['onClear']>>();
        render(<Input defaultValue="semi" readOnly showClear onClear={onClear} />);
        expect(getInput()).toHaveAttribute('readonly');
        await userEvent.click(getClearBtn() as HTMLElement);
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('');
    });

    it.each(['{Enter}', ' '])('Tab 可以到达有名称的清除按钮，%s 清除后焦点回到输入框', async (key) => {
        const onClear = vi.fn<NonNullable<InputProps['onClear']>>();
        render(<Input defaultValue="semi" showClear onClear={onClear} />);
        await userEvent.click(getInput());
        await userEvent.tab();
        const clear = screen.getByRole('button', { name: zh_CN.Input.clear });
        expect(clear).toHaveFocus();
        expect(clear).toHaveAttribute('type', 'button');
        await userEvent.keyboard(key);
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('');
        expect(getInput()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-focus`);
    });

    it('用鼠标清除时焦点保留在输入框内', async () => {
        const onBlur = vi.fn<NonNullable<InputProps['onBlur']>>();
        render(<Input defaultValue="semi" showClear onBlur={onBlur} />);
        await userEvent.click(getInput());
        await userEvent.click(getClearBtn());
        expect(getInput()).toHaveValue('');
        expect(getInput()).toHaveFocus();
        expect(onBlur).not.toHaveBeenCalled();
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-focus`);
    });

    it('清除按钮为 DateInput 标记 change 事件，mousedown 照常冒泡以便外部点击检测关闭浮层', () => {
        const onChange = vi.fn<NonNullable<InputProps['onChange']>>();
        const onOuterMouseDown = vi.fn<() => void>();
        document.body.addEventListener('mousedown', onOuterMouseDown);
        try {
            render(<Input defaultValue="semi" showClear onChange={onChange} />);
            fireEvent.mouseDown(getClearBtn());
            // The marker is an internal flag for DateInput and is absent from the public event type
            const event = onChange.mock.calls[0][1] as unknown as { __fromClearBtn?: boolean };
            expect(event.__fromClearBtn).toBe(true);
            expect(onOuterMouseDown).toHaveBeenCalledTimes(1);
        } finally {
            document.body.removeEventListener('mousedown', onOuterMouseDown);
        }
    });

    it('password 模式禁用时隐藏眼睛按钮，并为辅助技术提供标签', () => {
        const { rerender } = render(<Input defaultValue="1" disabled mode="password" />);
        expect(getModeBtn()).toBeNull();
        expect(getInput()).toHaveAttribute('type', 'password');
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-modebtn`);
        rerender(<Input defaultValue="1" mode="password" />);
        expect(screen.getByRole('button', { name: zh_CN.Input.showPassword })).toBe(getModeBtn());
        expect(getInput()).toHaveClass(`${prefixCls}-sibling-modebtn`);
    });

    it('挂载后切换到 password 模式时关闭眼睛', () => {
        const { rerender } = render(<Input defaultValue="1" />);
        rerender(<Input defaultValue="1" mode="password" />);
        expect(getInput()).toHaveAttribute('type', 'password');
        expect(getModeBtn()).toHaveAttribute('aria-label', zh_CN.Input.showPassword);
    });

    it('未设置 getValueLength 时 maxLength 为原生属性，onChange 不截断', () => {
        const onChange = vi.fn<NonNullable<InputProps['onChange']>>();
        render(<Input maxLength={3} onChange={onChange} />);
        expect(getInput()).toHaveAttribute('maxlength', '3');
        fireEvent.change(getInput(), { target: { value: 'abcd' } });
        expect(onChange.mock.calls[0][0]).toBe('abcd');
    });

    it('getValueLength 截断等待输入法组合结束', () => {
        const onChange = vi.fn<NonNullable<InputProps['onChange']>>();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            render(<Input maxLength={2} getValueLength={getValueLength} onChange={onChange} />);
            fireEvent.compositionStart(getInput());
            fireEvent.change(getInput(), { target: { value: 'abc' } });
            expect(onChange.mock.calls.at(-1)[0]).toBe('abc');
            fireEvent.compositionEnd(getInput(), { target: { value: 'abc' } });
            expect(onChange.mock.calls.at(-1)[0]).toBe('ab');
            expect(getInput()).toHaveValue('ab');
        } finally {
            warn.mockRestore();
        }
    });

    it('composition 受控且父组件拒绝组合结果时，组合结束后恢复为属性值', () => {
        const onChange = () => {};
        const { rerender } = render(<Input value="" composition onChange={onChange} />);
        fireEvent.compositionStart(getInput());
        fireEvent.change(getInput(), { target: { value: 'ni' } });
        fireEvent.compositionEnd(getInput(), { target: { value: '你' } });
        rerender(<Input placeholder="later" value="" composition onChange={onChange} />);
        expect(getInput()).toHaveValue('');
    });

    it('composition 模式在输入法组合结束后上报一次，并显示组合中的文本', () => {
        const onChange = vi.fn<NonNullable<InputProps['onChange']>>();
        render(<Input value="" composition onChange={onChange} />);
        fireEvent.compositionStart(getInput());
        fireEvent.change(getInput(), { target: { value: 'ni' } });
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue('ni');
        fireEvent.compositionEnd(getInput(), { target: { value: '你' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('你');
    });

    it('prefix、suffix 与 addons 获得文本与图标类名以及 x-semi-prop 插槽', () => {
        render(<Input defaultValue="1" addonAfter="after" addonBefore={<IconSearch />} prefix={<IconSearch />} suffix="kg" />);
        expect(query(`${prefixCls}-prefix`)).toHaveClass(`${prefixCls}-prefix-icon`);
        expect(query(`${prefixCls}-prefix`)).toHaveAttribute('x-semi-prop', 'prefix,insetLabel');
        expect(query(`${prefixCls}-suffix`)).toHaveClass(`${prefixCls}-suffix-text`);
        expect(query(`${prefixCls}-suffix`)).toHaveAttribute('x-semi-prop', 'suffix');
        expect(query(`${prefixCls}-prepend`)).toHaveClass(`${prefixCls}-prepend-icon`);
        expect(query(`${prefixCls}-prepend`)).toHaveAttribute('x-semi-prop', 'addonBefore');
        expect(query(`${prefixCls}-append`)).toHaveClass(`${prefixCls}-append-text`);
        expect(query(`${prefixCls}-append`)).toHaveAttribute('x-semi-prop', 'addonAfter');
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper__with-prefix`, `${prefixCls}-wrapper__with-suffix`, `${prefixCls}-wrapper__with-append`, `${prefixCls}-wrapper__with-prepend`);
    });

    it('insetLabel 带 id 渲染，并标记包裹层', () => {
        render(<Input insetLabel="Name" insetLabelId="label-id" />);
        expect(query(`${prefixCls}-inset-label`)).toHaveAttribute('id', 'label-id');
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper__with-prefix`);
    });

    it('只传 insetLabel 时以它命名输入框，显式名称优先，有 prefix 时不命名', () => {
        const { rerender } = render(<Input insetLabel="Name" />);
        const labelId = query(`${prefixCls}-inset-label`).id;
        expect(labelId).not.toBe('');
        expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute('aria-labelledby', labelId);
        rerender(<Input insetLabel="Name" insetLabelId="label-id" />);
        expect(getInput()).toHaveAttribute('aria-labelledby', 'label-id');
        rerender(<Input aria-label="Own" insetLabel="Name" />);
        expect(getInput()).not.toHaveAttribute('aria-labelledby');
        rerender(<Input aria-labelledby="other" insetLabel="Name" />);
        expect(getInput()).toHaveAttribute('aria-labelledby', 'other');
        rerender(<Input insetLabel="Name" prefix="P" />);
        expect(getInput()).not.toHaveAttribute('aria-labelledby');
    });

    it('type 为 hidden 时隐藏包裹层', () => {
        render(<Input type="hidden" />);
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-hidden`);
    });

    it('autoFocus 挂载时以 preventScroll 聚焦输入框，禁用时不聚焦', () => {
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        try {
            const { unmount } = render(<Input autoFocus preventScroll />);
            expect(getInput()).toHaveFocus();
            expect(focus).toHaveBeenCalledWith({ preventScroll: true });
            // autoFocus is applied by hand, not as the native attribute
            expect(getInput()).not.toHaveAttribute('autofocus');
            unmount();
            render(<Input autoFocus disabled />);
            expect(getInput()).not.toHaveFocus();
        } finally {
            focus.mockRestore();
        }
    });

    it('点击包裹层以 preventScroll 聚焦输入框；禁用的输入框保持未聚焦', async () => {
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        try {
            const { unmount } = render(<Input preventScroll />);
            fireEvent.click(getWrapper());
            expect(focus).toHaveBeenCalledWith({ preventScroll: true });
            expect(getInput()).toHaveFocus();
            unmount();
            render(<Input disabled />);
            fireEvent.click(getWrapper());
            expect(getInput()).not.toHaveFocus();
        } finally {
            focus.mockRestore();
        }
    });

    it('未知属性、aria 属性与焦点属性透传到原生 input，className 与 style 保留在包裹层', () => {
        const onPaste = vi.fn<NonNullable<InputProps['onPaste']>>();
        render(<Input id="name-id" name="name" className="custom" inputStyle={{ color: 'blue' }} style={{ color: 'red' }} data-testid="name" aria-describedby="help" aria-label="Name" tabIndex={-1} title="tip" inputMode="numeric" onPaste={onPaste} />);
        const input = getInput();
        expect(screen.getByTestId('name')).toBe(input);
        expect(input).toHaveAttribute('aria-label', 'Name');
        expect(input).toHaveAttribute('aria-describedby', 'help');
        expect(input).toHaveAttribute('name', 'name');
        expect(input).toHaveAttribute('tabindex', '-1');
        expect(input).toHaveAttribute('id', 'name-id');
        expect(input).toHaveAttribute('title', 'tip');
        expect(input).toHaveAttribute('inputmode', 'numeric');
        expect(input).toHaveStyle({ color: 'rgb(0, 0, 255)' });
        fireEvent.paste(input);
        expect(onPaste).toHaveBeenCalledTimes(1);
        for (const attr of ['data-testid', 'aria-label', 'name', 'tabindex', 'id', 'title']) {
            expect(getWrapper()).not.toHaveAttribute(attr);
        }
        expect(getWrapper()).toHaveClass('custom');
        expect(input).not.toHaveClass('custom');
    });

    it('Tooltip 内的 input 是一个 Tab 停靠点，并由 Tooltip 描述', async () => {
        render(
            <Tooltip content="tip">
                <Input />
            </Tooltip>
        );
        expect(getWrapper()).not.toHaveAttribute('tabindex');
        await userEvent.tab();
        expect(getInput()).toHaveFocus();
        await waitFor(() => expect(getInput()).toHaveAccessibleDescription('tip'));
        expect(getWrapper()).not.toHaveAttribute('aria-describedby');
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('ref 句柄的 focus、blur 与 select 驱动焦点样式', () => {
        const ref = createRef<InputHandle>();
        render(<Input ref={ref} defaultValue="semi" />);
        act(() => ref.current.focus());
        expect(getInput()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-focus`);
        ref.current.select();
        expect([getInput().selectionStart, getInput().selectionEnd]).toEqual([0, 4]);
        act(() => ref.current.blur());
        expect(getInput()).not.toHaveFocus();
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-wrapper-focus`);
    });

    it('ref 句柄恰好包含文档中的方法与节点', () => {
        const ref = createRef<InputHandle>();
        render(<Input ref={ref} />);
        expect(Object.keys(ref.current).toSorted()).toEqual(['blur', 'focus', 'input', 'nativeElement', 'select', 'setSelectionRange'].toSorted());
        for (const method of ['blur', 'focus', 'select', 'setSelectionRange']) {
            expect(typeof ref.current[method]).toBe('function');
        }
    });

    it('handle 的 setSelectionRange 移动原生 input 的选区', () => {
        const ref = createRef<InputHandle>();
        render(<Input ref={ref} defaultValue="semi design" />);
        ref.current.setSelectionRange(2, 6, 'backward');
        expect([getInput().selectionStart, getInput().selectionEnd, getInput().selectionDirection]).toEqual([2, 6, 'backward']);
    });

    it('handle 的 focus 默认使用 preventScroll 属性，并允许 options 覆盖', () => {
        const ref = createRef<InputHandle>();
        const focus = vi.spyOn(HTMLInputElement.prototype, 'focus');
        const { rerender } = render(<Input ref={ref} preventScroll />);
        ref.current.focus();
        expect(focus).toHaveBeenLastCalledWith({ preventScroll: true });
        ref.current.focus({ preventScroll: false });
        expect(focus).toHaveBeenLastCalledWith({ preventScroll: false });
        rerender(<Input ref={ref} />);
        ref.current.focus();
        expect(focus).toHaveBeenLastCalledWith({ preventScroll: undefined });
        focus.mockRestore();
    });

    it('句柄只创建一次，并在重新渲染后持续上报已挂载节点', () => {
        const refFn = vi.fn<(handle: InputHandle | null) => void>();
        const { rerender } = render(<Input ref={refFn} />);
        rerender(<Input ref={refFn} defaultValue="x" addonBefore="https://" showClear prefix="semi" />);
        expect(refFn).toHaveBeenCalledTimes(1);
        const handle = refFn.mock.calls[0][0];
        expect(handle.input).toBe(getInput());
        expect(handle.nativeElement).toBe(getWrapper());
    });

    it('卸载后句柄上报 null 节点', () => {
        const refFn = vi.fn<(handle: InputHandle | null) => void>();
        const { unmount } = render(<Input ref={refFn} />);
        const handle = refFn.mock.calls[0][0];
        unmount();
        expect(refFn).toHaveBeenLastCalledWith(null);
        expect(handle.input).toBeNull();
        expect(handle.nativeElement).toBeNull();
    });

    it('Form.Input 通过 withField 透传 ref，因此也是句柄', () => {
        const ref = createRef<InputHandle>();
        render(
            <Form>
                <Form.Input ref={ref} field="name" />
            </Form>
        );
        expect(ref.current.input).toBe(getInput());
        expect(ref.current.nativeElement).toBe(getWrapper());
        act(() => ref.current.focus());
        expect(getInput()).toHaveFocus();
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Input: { size: 'large', placeholder: 'global' } };
        try {
            const { unmount } = render(<Input />);
            expect(getInput()).toHaveClass(`${prefixCls}-large`);
            expect(getInput()).toHaveAttribute('placeholder', 'global');
            unmount();
            render(<Input size="small" />);
            expect(getInput()).toHaveClass(`${prefixCls}-small`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('StrictMode 下每次按键只上报一次，autoFocus 仍然生效', async () => {
        const onChange = vi.fn<NonNullable<InputProps['onChange']>>();
        const onFocus = vi.fn<NonNullable<InputProps['onFocus']>>();
        render(
            <StrictMode>
                <Input autoFocus onChange={onChange} onFocus={onFocus} />
            </StrictMode>
        );
        expect(getInput()).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        await userEvent.type(getInput(), 'ab');
        expect(onChange.mock.calls.map(([value]) => value)).toEqual(['a', 'ab']);
        expect(getInput()).toHaveValue('ab');
    });

    it('InputGroup 向子元素下发 size、disabled，其他属性只落在分组上', () => {
        render(
            <InputGroup data-group="1" disabled size="small">
                <Input placeholder="a" />
                <Input placeholder="b" size="large" />
            </InputGroup>
        );
        const group = screen.getByRole('group');
        expect(group).toHaveAttribute('aria-label', zh_CN.Input.group);
        expect(group).toHaveClass(`${prefixCls}-group`, `${prefixCls}-small`);
        expect(group).toHaveAttribute('data-group', '1');
        const [first, second] = document.querySelectorAll('input');
        expect(first).toHaveClass(`${prefixCls}-small`);
        expect(second).toHaveClass(`${prefixCls}-large`);
        for (const input of [first, second]) {
            expect(input).toBeDisabled();
            expect(input).not.toHaveAttribute('data-group');
        }
    });

    it('InputGroup 从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { InputGroup: { size: 'large' } };
        try {
            render(
                <InputGroup>
                    <Input />
                </InputGroup>
            );
            expect(screen.getByRole('group')).toHaveClass(`${prefixCls}-large`);
            expect(getInput()).toHaveClass(`${prefixCls}-large`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('InputGroup 的 ref 指向分组元素，无论是否带 label', () => {
        const ref = createRef<HTMLSpanElement>();
        const { rerender } = render(
            <InputGroup ref={ref}>
                <Input />
            </InputGroup>
        );
        expect(ref.current).toBe(screen.getByRole('group'));
        rerender(
            <InputGroup ref={ref} label={{ text: 'Score' }}>
                <Input />
            </InputGroup>
        );
        expect(ref.current).toBe(screen.getByRole('group'));
        expect(getInput()).not.toHaveAttribute('ref');
    });

    it('带 label 的 InputGroup 渲染 label，并为分组设置 id', () => {
        render(
            <InputGroup className="g" style={{ color: 'red' }} label={{ text: 'Score', name: 'score' }}>
                <Input />
            </InputGroup>
        );
        const group = screen.getByRole('group');
        expect(group).toHaveAttribute('id', 'score');
        expect(group).toHaveClass('g');
        expect(group).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(query(`${BASE_CLASS_PREFIX}-form-field-label`)).toHaveTextContent('Score');
    });
});
