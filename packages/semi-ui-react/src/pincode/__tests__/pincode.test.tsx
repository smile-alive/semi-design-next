import { createRef, StrictMode, useState } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { PinCode, Form, Tooltip } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import ConfigProvider from '@fibrae/semi-ui-react/config-provider';
import type { PinCodeHandle, PinCodeProps } from '../index';

const wrapperSelector = `.${BASE_CLASS_PREFIX}-pincode-wrapper`;
const inputFocusCls = `${BASE_CLASS_PREFIX}-input-wrapper-focus`;

// An unknown format string is accepted at runtime and leaves the characters unrestricted
const textFormat = 'text' as unknown as PinCodeProps['format'];

const getInputs = () => screen.getAllByRole<HTMLInputElement>('textbox');
const getValues = () => getInputs().map((input) => input.value);

describe('PinCode', () => {
    it('正常渲染不崩溃', () => {
        render(<PinCode />);
        expect(document.querySelector(wrapperSelector)).not.toBeNull();
    });

    it('使用自定义 className 渲染', () => {
        render(<PinCode className="custom-class" />);
        expect(document.querySelector(wrapperSelector)).toHaveClass('custom-class');
    });

    it('使用自定义 style 渲染', () => {
        render(<PinCode style={{ border: '1px solid red' }} />);
        expect(document.querySelector(wrapperSelector)).toHaveStyle({
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'rgb(255, 0, 0)',
        });
    });

    it('根据 count 渲染对应数量的输入框', () => {
        render(<PinCode count={4} />);
        expect(getInputs()).toHaveLength(4);
    });

    it('默认渲染 6 个输入框', () => {
        render(<PinCode />);
        expect(getInputs()).toHaveLength(6);
    });

    it('使用 defaultValue 渲染', () => {
        render(<PinCode defaultValue="123456" />);
        expect(getValues()).toEqual(['1', '2', '3', '4', '5', '6']);
    });

    it('受控模式下使用 value 属性', () => {
        render(<PinCode value="654321" />);
        expect(getValues()).toEqual(['6', '5', '4', '3', '2', '1']);
    });

    it('onChange 回调', async () => {
        const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
        render(<PinCode autoFocus onChange={onChange} />);
        await userEvent.keyboard('1');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('1');
    });

    it('onComplete 回调', async () => {
        const onComplete = vi.fn<NonNullable<PinCodeProps['onComplete']>>();
        render(<PinCode autoFocus onComplete={onComplete} />);
        await userEvent.keyboard('123456');
        await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
        expect(onComplete).toHaveBeenCalledWith('123456');
        expect(getValues()).toEqual(['1', '2', '3', '4', '5', '6']);
    });

    it('禁用状态下渲染', () => {
        render(<PinCode disabled />);
        getInputs().forEach((input) => expect(input).toBeDisabled());
    });

    it('small 尺寸渲染', () => {
        render(<PinCode size="small" />);
        getInputs().forEach((input) => expect(input).toHaveClass(`${BASE_CLASS_PREFIX}-input-small`));
    });

    it('large 尺寸渲染', () => {
        render(<PinCode size="large" />);
        getInputs().forEach((input) => expect(input).toHaveClass(`${BASE_CLASS_PREFIX}-input-large`));
    });

    // focus moving on its own at load skips content before the code and, with several PinCodes, lands on the last one
    it('默认不获取焦点', () => {
        render(<PinCode />);
        expect(document.body).toHaveFocus();
    });

    it('autoFocus 让第一个输入框获得焦点', () => {
        render(<PinCode autoFocus />);
        expect(getInputs()[0]).toHaveFocus();
    });

    it('format 属性可设为 text', async () => {
        const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
        render(<PinCode autoFocus format={textFormat} onChange={onChange} />);
        await userEvent.keyboard('a');
        expect(onChange).toHaveBeenCalledWith('a');
        expect(getInputs()[0]).toHaveValue('a');
    });

    it('format 为 number 时输入框的 inputMode 为 numeric', () => {
        render(<PinCode format="number" />);
        getInputs().forEach((input) => expect(input).toHaveAttribute('inputmode', 'numeric'));
    });

    it('format 为 text 时输入框的 inputMode 为 text', () => {
        render(<PinCode format={textFormat} />);
        getInputs().forEach((input) => expect(input).toHaveAttribute('inputmode', 'text'));
    });

    it('处理输入变化', async () => {
        const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
        render(<PinCode onChange={onChange} />);
        await userEvent.type(getInputs()[0], '5');
        expect(onChange).toHaveBeenCalledWith('5');
        expect(getInputs()[0]).toHaveValue('5');
        await waitFor(() => expect(getInputs()[1]).toHaveFocus());
    });

    it('处理 focus 事件', async () => {
        render(<PinCode />);
        const input = getInputs()[0];
        await userEvent.click(input);
        expect(input).toHaveFocus();
        expect(input.parentElement).toHaveClass(inputFocusCls);
    });

    it('处理 blur 事件', async () => {
        render(<PinCode />);
        const input = getInputs()[0];
        await userEvent.click(input);
        act(() => input.blur());
        expect(input).not.toHaveFocus();
        expect(input.parentElement).not.toHaveClass(inputFocusCls);
    });

    it('处理 keydown 事件', async () => {
        const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
        render(<PinCode autoFocus onChange={onChange} />);
        await userEvent.keyboard('{Backspace}');
        expect(onChange).toHaveBeenCalledWith('');
        expect(getInputs()[0]).toHaveFocus();
        expect(getValues()).toEqual(['', '', '', '', '', '']);
    });

    it('处理 Delete 按键', async () => {
        const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
        render(<PinCode defaultValue="123456" onChange={onChange} />);
        await userEvent.click(getInputs()[2]);
        await userEvent.keyboard('{Delete}');
        // Delete removes the current character, the following ones move forward and the caret stays
        expect(getValues()).toEqual(['1', '2', '4', '5', '6', '']);
        expect(onChange).toHaveBeenCalledWith('12456');
        expect(getInputs()[2]).toHaveFocus();
    });

    it('处理 ArrowLeft 按键', async () => {
        render(<PinCode defaultValue="123456" />);
        await userEvent.click(getInputs()[2]);
        await userEvent.keyboard('{ArrowLeft}');
        expect(getInputs()[1]).toHaveFocus();
    });

    it('处理 ArrowRight 按键', async () => {
        render(<PinCode defaultValue="123456" />);
        await userEvent.click(getInputs()[2]);
        await userEvent.keyboard('{ArrowRight}');
        expect(getInputs()[3]).toHaveFocus();
    });

    it('format 为混合类型', async () => {
        const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
        render(<PinCode autoFocus format="mixed" onChange={onChange} />);
        await userEvent.keyboard('-');
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.keyboard('a');
        expect(onChange).toHaveBeenLastCalledWith('a');
        await userEvent.keyboard('1');
        expect(onChange).toHaveBeenLastCalledWith('a1');
    });

    it('format 为 RegExp', async () => {
        const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
        render(<PinCode autoFocus format={/^[a-z]$/} onChange={onChange} />);
        await userEvent.keyboard('1');
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.keyboard('a');
        expect(onChange).toHaveBeenCalledWith('a');
    });

    it('format 为函数', async () => {
        const format = vi.fn<(value: string) => boolean>((value) => /^[0-9]$/.test(value));
        const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
        render(<PinCode autoFocus format={format} onChange={onChange} />);
        await userEvent.keyboard('a');
        expect(format).toHaveBeenCalledWith('a');
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.keyboard('7');
        expect(onChange).toHaveBeenCalledWith('7');
    });

    it('value 变化时受控模式更新', async () => {
        const { rerender } = render(<PinCode value="111111" />);
        expect(getValues()).toEqual(['1', '1', '1', '1', '1', '1']);

        rerender(<PinCode value="222222" />);
        await waitFor(() => expect(getValues()).toEqual(['2', '2', '2', '2', '2', '2']));
    });

    it('PinCode 实例的 focus 方法', () => {
        const ref = createRef<PinCodeHandle>();
        render(<PinCode ref={ref} />);
        act(() => ref.current.focus(0));
        expect(getInputs()[0]).toHaveFocus();
    });

    it('PinCode 实例的 blur 方法', () => {
        const ref = createRef<PinCodeHandle>();
        render(<PinCode ref={ref} autoFocus />);
        expect(getInputs()[0]).toHaveFocus();
        act(() => ref.current.blur(0));
        expect(getInputs()[0]).not.toHaveFocus();
    });

    it('输入合法数字时的处理', async () => {
        const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
        render(<PinCode format="number" onChange={onChange} />);
        fireEvent.change(getInputs()[0], { target: { value: '5' } });
        await waitFor(() => expect(onChange).toHaveBeenCalledWith('5'));
        expect(getInputs()[0]).toHaveValue('5');
    });

    it('输入框被清空时（剪切、虚拟键盘删除）移除该字符，焦点留在原格', async () => {
        const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
        render(<PinCode defaultValue="12" count={4} onChange={onChange} />);
        const [first] = getInputs();
        await userEvent.click(first);
        fireEvent.change(first, { target: { value: '' } });
        await waitFor(() => expect(getValues()).toEqual(['2', '', '', '']));
        expect(onChange).toHaveBeenLastCalledWith('2');
        expect(first).toHaveFocus();
    });

    it('number 格式下输入非法字符时的处理', async () => {
        const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
        render(<PinCode autoFocus format="number" onChange={onChange} />);
        await userEvent.keyboard('a');
        expect(onChange).not.toHaveBeenCalled();
        expect(getInputs()[0]).toHaveValue('');
        expect(getInputs()[0]).toHaveFocus();
    });

    it('输入合法混合字符时的处理', async () => {
        const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
        render(<PinCode autoFocus format="mixed" onChange={onChange} />);
        await userEvent.keyboard('a');
        expect(onChange).toHaveBeenCalledWith('a');
        expect(getInputs()[0]).toHaveValue('a');
    });

    it('绑定粘贴事件处理函数', async () => {
        const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
        render(<PinCode autoFocus count={4} onChange={onChange} />);
        await userEvent.paste('1234');
        await waitFor(() => expect(getValues()).toEqual(['1', '2', '3', '4']));
        expect(onChange).toHaveBeenLastCalledWith('1234');
    });

    it('所有输入框填满时调用 onComplete', async () => {
        const onComplete = vi.fn<NonNullable<PinCodeProps['onComplete']>>();
        render(<PinCode autoFocus count={3} onComplete={onComplete} />);
        await userEvent.keyboard('12');
        expect(onComplete).not.toHaveBeenCalled();
        await userEvent.keyboard('3');
        await waitFor(() => expect(onComplete).toHaveBeenCalledWith('123'));
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('处理不同位置输入框的 focus', async () => {
        render(<PinCode defaultValue="123" />);

        await userEvent.click(getInputs()[1]);
        expect(getInputs()[1]).toHaveFocus();

        await userEvent.click(getInputs()[2]);
        expect(getInputs()[2]).toHaveFocus();
        await userEvent.keyboard('9');
        expect(getValues()).toEqual(['1', '2', '9', '', '', '']);
        await waitFor(() => expect(getInputs()[3]).toHaveFocus());
    });

    it('处理不同位置输入框的 blur', async () => {
        render(<PinCode defaultValue="123" />);
        const input = getInputs()[1];
        await userEvent.click(input);
        expect(input.parentElement).toHaveClass(inputFocusCls);
        act(() => input.blur());
        expect(input.parentElement).not.toHaveClass(inputFocusCls);
        expect(getValues()).toEqual(['1', '2', '3', '', '', '']);
    });

    it('第一个输入框中处理 Backspace', async () => {
        const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
        render(<PinCode defaultValue="123456" onChange={onChange} />);
        await userEvent.click(getInputs()[0]);
        await userEvent.keyboard('{Backspace}');
        // removes the current character and keeps focus instead of moving to a negative index
        expect(getValues()).toEqual(['2', '3', '4', '5', '6', '']);
        expect(onChange).toHaveBeenCalledWith('23456');
        expect(getInputs()[0]).toHaveFocus();
    });

    it('第一个输入框中处理 ArrowLeft', async () => {
        render(<PinCode defaultValue="123456" />);
        await userEvent.click(getInputs()[0]);
        await userEvent.keyboard('{ArrowLeft}');
        expect(getInputs()[0]).toHaveFocus();
    });

    it('最后一个输入框中处理 ArrowRight', async () => {
        render(<PinCode defaultValue="123456" />);
        await userEvent.click(getInputs()[5]);
        await userEvent.keyboard('{ArrowRight}');
        expect(getInputs()[5]).toHaveFocus();
    });

    it('最后一个输入框中处理 Delete', async () => {
        const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
        render(<PinCode defaultValue="123456" onChange={onChange} />);
        await userEvent.click(getInputs()[5]);
        await userEvent.keyboard('{Delete}');
        expect(getValues()).toEqual(['1', '2', '3', '4', '5', '']);
        expect(onChange).toHaveBeenCalledWith('12345');
        expect(getInputs()[5]).toHaveFocus();
    });

    it('defaultValue 为空时渲染', () => {
        render(<PinCode defaultValue="" />);
        expect(getValues()).toEqual(['', '', '', '', '', '']);
    });

    it('defaultValue 不完整时渲染', () => {
        render(<PinCode defaultValue="12" count={6} />);
        expect(getValues()).toEqual(['1', '2', '', '', '', '']);
    });

    it('受控且 value 为空串时，不回落到 defaultValue', () => {
        render(<PinCode defaultValue="12" value="" />);
        expect(getValues()).toEqual(['', '', '', '', '', '']);
    });

    describe('已填内容始终是无空位的前缀', () => {
        const Controlled = (props: PinCodeProps) => {
            const [value, setValue] = useState('');
            return <PinCode {...props} value={value} onChange={setValue} />;
        };

        it('受控时在空的第 3 格输入，字符落在第一个空格，onChange 与显示一致', async () => {
            render(<Controlled count={4} />);
            await userEvent.click(getInputs()[2]);
            await userEvent.keyboard('5');
            await waitFor(() => expect(getValues()).toEqual(['5', '', '', '']));
            await waitFor(() => expect(getInputs()[1]).toHaveFocus());
        });

        it('非受控时在空的第 3 格输入，onChange 值与显示一致', async () => {
            const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
            render(<PinCode count={4} onChange={onChange} />);
            await userEvent.click(getInputs()[2]);
            await userEvent.keyboard('5');
            expect(onChange).toHaveBeenLastCalledWith('5');
            await waitFor(() => expect(getValues()).toEqual(['5', '', '', '']));
        });

        it('先填最后一格不触发 onComplete', async () => {
            const onComplete = vi.fn<NonNullable<PinCodeProps['onComplete']>>();
            render(<PinCode count={4} onComplete={onComplete} />);
            await userEvent.click(getInputs()[3]);
            await userEvent.keyboard('8');
            await waitFor(() => expect(getValues()).toEqual(['8', '', '', '']));
            expect(onComplete).not.toHaveBeenCalled();
        });

        it('Backspace 清除中间的字符，后面的字符前移', async () => {
            const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
            render(<PinCode defaultValue="123" onChange={onChange} />);
            await userEvent.click(getInputs()[1]);
            await userEvent.keyboard('{Backspace}');
            expect(onChange).toHaveBeenLastCalledWith('13');
            expect(getValues()).toEqual(['1', '3', '', '', '', '']);
        });
    });

    it('count 取不同值', () => {
        const { unmount } = render(<PinCode count={3} />);
        expect(getInputs()).toHaveLength(3);
        unmount();

        render(<PinCode count={8} />);
        expect(getInputs()).toHaveLength(8);
    });

    it('处理已有值的输入框', async () => {
        const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
        render(<PinCode defaultValue="123456" onChange={onChange} />);
        await userEvent.type(getInputs()[0], '9');
        expect(onChange).toHaveBeenCalledWith('923456');
        expect(getInputs()[0]).toHaveValue('9');
    });

    it('处理其他按键事件', () => {
        const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
        render(<PinCode autoFocus onChange={onChange} />);
        const input = getInputs()[0];
        fireEvent.keyDown(input, { key: 'Enter' });
        fireEvent.keyDown(input, { key: 'Tab' });
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(input).toHaveFocus();
        expect(onChange).not.toHaveBeenCalled();
        expect(getValues()).toEqual(['', '', '', '', '', '']);
    });

    it('valueList 状态正确初始化', () => {
        render(<PinCode />);
        expect(getValues()).toEqual(['', '', '', '', '', '']);
    });

    it('currentActiveIndex 状态正确初始化', async () => {
        render(<PinCode autoFocus />);
        await userEvent.keyboard('4');
        expect(getValues()).toEqual(['4', '', '', '', '', '']);
    });

    it('处理合法数据的粘贴事件', async () => {
        const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
        const onComplete = vi.fn<NonNullable<PinCodeProps['onComplete']>>();
        render(<PinCode autoFocus format="number" onChange={onChange} onComplete={onComplete} />);
        await userEvent.paste('123456');
        await waitFor(() => expect(onComplete).toHaveBeenCalledWith('123456'));
        expect(getValues()).toEqual(['1', '2', '3', '4', '5', '6']);
        expect(onChange).toHaveBeenLastCalledWith('123456');
    });

    it('处理不完整数据的粘贴事件', async () => {
        const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
        render(<PinCode count={6} format="number" onChange={onChange} />);
        await userEvent.click(getInputs()[2]);
        await userEvent.paste('12');
        await waitFor(() => expect(getValues()).toEqual(['1', '2', '', '', '', '']));
        await waitFor(() => expect(getInputs()[2]).toHaveFocus());
    });

    it('changeSpecificInputFocusState 设置 blur 状态', async () => {
        const onComplete = vi.fn<NonNullable<PinCodeProps['onComplete']>>();
        render(<PinCode defaultValue="12345" onComplete={onComplete} />);
        await userEvent.click(getInputs()[5]);
        await userEvent.keyboard('6');
        await waitFor(() => expect(onComplete).toHaveBeenCalledWith('123456'));
        expect(getInputs()[5]).not.toHaveFocus();
    });

    it('changeSpecificInputFocusState 设置 focus 状态', async () => {
        render(<PinCode autoFocus />);
        await userEvent.keyboard('1');
        await waitFor(() => expect(getInputs()[1]).toHaveFocus());
    });

    it('处理空的粘贴数据', async () => {
        const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
        render(<PinCode autoFocus format="number" onChange={onChange} />);
        await userEvent.paste('');
        expect(onChange).not.toHaveBeenCalled();
        expect(getValues()).toEqual(['', '', '', '', '', '']);
        expect(getInputs()[0]).toHaveFocus();
    });

    it('处理混合格式的粘贴', async () => {
        render(<PinCode autoFocus format="mixed" />);
        await userEvent.paste('abc123');
        await waitFor(() => expect(getValues()).toEqual(['a', 'b', 'c', '1', '2', '3']));
    });

    it('处理 text 格式的粘贴', async () => {
        render(<PinCode autoFocus format={textFormat} />);
        await userEvent.paste('abcdef');
        await waitFor(() => expect(getValues()).toEqual(['a', 'b', 'c', 'd', 'e', 'f']));
    });

    it('focus 之后对输入框执行 blur', async () => {
        render(<PinCode />);
        const input = getInputs()[2];
        await userEvent.click(input);
        expect(input).toHaveFocus();
        act(() => input.blur());
        expect(input).not.toHaveFocus();
        expect(document.body).toHaveFocus();
    });

    it('不同位置的 focus 方法', () => {
        const ref = createRef<PinCodeHandle>();
        render(<PinCode ref={ref} count={4} />);
        [0, 1, 2, 3].forEach((index) => {
            act(() => ref.current.focus(index));
            expect(getInputs()[index]).toHaveFocus();
        });
    });

    it('不同位置的 blur 方法', () => {
        const ref = createRef<PinCodeHandle>();
        render(<PinCode ref={ref} count={4} />);
        [0, 2].forEach((index) => {
            act(() => ref.current.focus(index));
            expect(getInputs()[index]).toHaveFocus();
            act(() => ref.current.blur(index));
            expect(getInputs()[index]).not.toHaveFocus();
        });
    });

    it('处理触发填满的输入变化', async () => {
        const onComplete = vi.fn<NonNullable<PinCodeProps['onComplete']>>();
        render(<PinCode defaultValue="12" count={3} onComplete={onComplete} />);
        await userEvent.type(getInputs()[2], '3');
        await waitFor(() => expect(onComplete).toHaveBeenCalledWith('123'));
        expect(getValues()).toEqual(['1', '2', '3']);
    });

    it('处理空输入框的 keydown', async () => {
        render(<PinCode count={4} />);
        await userEvent.click(getInputs()[1]);
        await userEvent.keyboard('{Backspace}');
        expect(getInputs()[0]).toHaveFocus();
        expect(getValues()).toEqual(['', '', '', '']);
    });

    it('处理快速切换 focus', async () => {
        render(<PinCode count={4} />);
        const inputs = getInputs();
        for (const input of inputs) {
            await userEvent.click(input);
        }
        expect(inputs[3]).toHaveFocus();
        await userEvent.keyboard('8');
        expect(getValues()).toEqual(['8', '', '', '']);
    });

    describe('基线行为', () => {
        const Controlled = (props) => {
            const [value, setValue] = useState('');
            return (
                <>
                    <PinCode {...props} value={value} onChange={setValue} />
                    <output>{value}</output>
                </>
            );
        };

        it('受控输入经过父组件的 value', async () => {
            render(<Controlled autoFocus count={4} />);
            await userEvent.keyboard('123');
            await waitFor(() => expect(getValues()).toEqual(['1', '2', '3', '']));
            expect(screen.getByRole('status')).toHaveTextContent('123');
            await waitFor(() => expect(getInputs()[3]).toHaveFocus());
        });

        it('受控粘贴填满每个输入框', async () => {
            const onComplete = vi.fn<NonNullable<PinCodeProps['onComplete']>>();
            render(<Controlled autoFocus count={4} onComplete={onComplete} />);
            await userEvent.paste('1234');
            await waitFor(() => expect(onComplete).toHaveBeenCalledWith('1234'));
            expect(getValues()).toEqual(['1', '2', '3', '4']);
            expect(screen.getByRole('status')).toHaveTextContent('1234');
        });

        it('粘贴遇到第一个非法字符时停止', async () => {
            const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
            render(<PinCode autoFocus count={4} onChange={onChange} />);
            await userEvent.paste('12a4');
            await waitFor(() => expect(getValues()).toEqual(['1', '2', '', '']));
            expect(onChange).toHaveBeenLastCalledWith('12');
            await waitFor(() => expect(getInputs()[2]).toHaveFocus());
        });

        it('部分粘贴不调用 onComplete', async () => {
            const onComplete = vi.fn<NonNullable<PinCodeProps['onComplete']>>();
            render(<PinCode autoFocus count={4} onComplete={onComplete} />);
            await userEvent.paste('12');
            await waitFor(() => expect(getValues()).toEqual(['1', '2', '', '']));
            expect(onComplete).not.toHaveBeenCalled();
        });

        it('Backspace 清空已填的输入框并向前移动', async () => {
            const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
            render(<PinCode defaultValue="123" onChange={onChange} />);
            await userEvent.click(getInputs()[2]);
            await userEvent.keyboard('{Backspace}');
            expect(getValues()).toEqual(['1', '2', '', '', '', '']);
            expect(onChange).toHaveBeenLastCalledWith('12');
            expect(getInputs()[1]).toHaveFocus();
        });

        it('禁用的输入框不接受键盘输入', async () => {
            const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
            render(<PinCode disabled onChange={onChange} />);
            expect(getInputs()[0]).not.toHaveFocus();
            await userEvent.type(getInputs()[0], '1');
            expect(onChange).not.toHaveBeenCalled();
            expect(getValues()).toEqual(['', '', '', '', '', '']);
        });

        it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
            semiGlobal.config.overrideDefaultProps = { PinCode: { count: 4, autoFocus: true } };
            try {
                const { unmount } = render(<PinCode />);
                expect(getInputs()).toHaveLength(4);
                expect(getInputs()[0]).toHaveFocus();
                unmount();
                // an explicit prop wins over the global default
                render(<PinCode count={2} />);
                expect(getInputs()).toHaveLength(2);
            } finally {
                semiGlobal.config.overrideDefaultProps = {};
            }
        });

        it('全局 Input 默认值不给格子加清除按钮与前后缀', () => {
            semiGlobal.config.overrideDefaultProps = { Input: { showClear: true, prefix: 'x', suffix: 'y', insetLabel: 'l', addonBefore: 'b', addonAfter: 'a' } };
            try {
                const { container } = render(<PinCode defaultValue="12" count={2} />);
                expect(getInputs()).toHaveLength(2);
                expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
                expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-prefix, .${BASE_CLASS_PREFIX}-input-suffix, .${BASE_CLASS_PREFIX}-input-prepend, .${BASE_CLASS_PREFIX}-input-append`)).toBeNull();
            } finally {
                semiGlobal.config.overrideDefaultProps = {};
            }
        });

        it('count 变小时渲染更少的输入框', () => {
            const { rerender } = render(<PinCode count={6} />);
            rerender(<PinCode count={3} />);
            expect(getInputs()).toHaveLength(3);
        });

        it('StrictMode 下每个字符只调用一次 onChange', async () => {
            const onChange = vi.fn<NonNullable<PinCodeProps['onChange']>>();
            render(
                <StrictMode>
                    <PinCode autoFocus onChange={onChange} />
                </StrictMode>
            );
            await userEvent.keyboard('123');
            expect(onChange.mock.calls.map(([value]) => value)).toEqual(['1', '12', '123']);
            await waitFor(() => expect(getInputs()[3]).toHaveFocus());
        });

        it('Form.PinCode 与表单值同步，且不把 Form 属性泄漏到 DOM', async () => {
            let formApi;
            render(
                <Form getFormApi={(api) => (formApi = api)} labelPosition="inset">
                    <Form.PinCode autoFocus count={4} field="code" label="Code" />
                </Form>
            );
            await userEvent.keyboard('12');
            expect(formApi.getValue('code')).toBe('12');
            const wrapper = document.querySelector(wrapperSelector);
            expect(wrapper).not.toHaveAttribute('validatestatus');
            expect(wrapper).not.toHaveAttribute('validateStatus');
            expect(wrapper).not.toHaveAttribute('insetlabel');
            expect(wrapper).not.toHaveAttribute('insetLabel');
            void act(() => formApi.setValue('code', '34'));
            await waitFor(() => expect(getValues()).toEqual(['3', '4', '', '']));
        });
    });

    describe('可访问名称', () => {
        it('是由调用方命名的 group，每个输入框按位置命名', () => {
            render(<PinCode aria-label="Verification code" count={3} />);
            expect(screen.getByRole('group', { name: 'Verification code' })).toBe(document.querySelector(wrapperSelector));
            expect(getInputs().map((input) => input.getAttribute('aria-label'))).toEqual(['第 1 位，共 3 位', '第 2 位，共 3 位', '第 3 位，共 3 位']);
            getInputs().forEach((input) => expect(input).not.toHaveAttribute('aria-labelledby'));
        });

        it('group 可由 aria-labelledby 命名', () => {
            render(
                <div>
                    <span id="pin-label">PIN</span>
                    <PinCode aria-labelledby="pin-label" count={2} />
                </div>
            );
            expect(screen.getByRole('group', { name: 'PIN' })).toBe(document.querySelector(wrapperSelector));
            expect(screen.getByRole('textbox', { name: '第 2 位，共 2 位' })).toBeInTheDocument();
        });

        it('每个输入框保留描述性状态', () => {
            render(<PinCode aria-describedby="hint" aria-invalid="true" count={2} />);
            getInputs().forEach((input) => {
                expect(input).toHaveAttribute('aria-describedby', 'hint');
                expect(input).toHaveAttribute('aria-invalid', 'true');
            });
        });

        it('位置名称读取所选语言', () => {
            render(
                <ConfigProvider locale={en_US}>
                    <PinCode count={2} />
                </ConfigProvider>
            );
            expect(screen.getByRole('textbox', { name: 'Digit 1 of 2' })).toBeInTheDocument();
        });
    });

    describe('函数组件', () => {
        it('把未声明的属性透传到外层容器，Form 的 aria 属性传给每个输入框', async () => {
            render(
                <Form>
                    {/* title is not a declared prop; it is only forwarded to the wrapper */}
                    <Form.PinCode data-x="1" {...{ title: 'tip' }} id="code" count={2} field="code" helpText="help" />
                </Form>
            );
            const wrapper = document.querySelector(wrapperSelector);
            expect(wrapper).toHaveAttribute('data-x', '1');
            expect(wrapper).toHaveAttribute('title', 'tip');
            expect(wrapper).not.toHaveAttribute('id');
            // the group carries the Form label; each input is named by its position
            expect(wrapper).toHaveAttribute('aria-labelledby', 'code-label');
            expect(wrapper).not.toHaveAttribute('name');
            getInputs().forEach((input) => {
                expect(input).not.toHaveAttribute('aria-labelledby');
                expect(input).toHaveAttribute('aria-describedby', 'code-helpText');
                expect(input).not.toHaveAttribute('name');
            });
        });

        it('id 放在第一个输入框上，点击 Form label 时使其获得焦点', async () => {
            render(
                <Form>
                    <Form.PinCode id="code" count={3} field="code" label="Code" />
                </Form>
            );
            const inputs = getInputs();
            expect(inputs[0]).toHaveAttribute('id', 'code');
            expect(inputs[1]).not.toHaveAttribute('id');
            await userEvent.click(screen.getByText('Code'));
            expect(inputs[0]).toHaveFocus();
        });

        it('validateStatus 传给每个输入框', () => {
            // validateStatus is injected by Form and is not a public prop
            const { rerender } = render(<PinCode count={3} {...{ validateStatus: 'error' }} />);
            getInputs().forEach((input) => {
                expect(input).toHaveAttribute('aria-invalid', 'true');
                expect(input.closest(`.${BASE_CLASS_PREFIX}-input-wrapper`)).toHaveClass(`${BASE_CLASS_PREFIX}-input-wrapper-error`);
            });
            rerender(<PinCode count={3} />);
            getInputs().forEach((input) => expect(input).not.toHaveAttribute('aria-invalid', 'true'));
        });

        it('PinCode 位于 Tooltip 内时不增加额外的 Tab 停靠点', async () => {
            render(
                <Tooltip content="tip">
                    <PinCode count={2} />
                </Tooltip>
            );
            expect(document.querySelector(wrapperSelector)).not.toHaveAttribute('tabindex');
            await userEvent.tab();
            expect(getInputs()[0]).toHaveFocus();
            await waitFor(() => getInputs().forEach((input) => expect(input).toHaveAccessibleDescription('tip')));
            await userEvent.tab();
            expect(getInputs()[1]).toHaveFocus();
            await userEvent.tab();
            expect(document.body).toHaveFocus();
        });

        it('Form.PinCode 设置 trigger blur 时，焦点离开整个验证码后才校验一次', async () => {
            const validate = vi.fn<() => string>(() => '');
            render(
                <Form>
                    <Form.PinCode field="code" trigger="blur" validator={validate} />
                    <button type="button">outside</button>
                </Form>
            );
            await userEvent.click(getInputs()[0]);
            await userEvent.click(getInputs()[1]);
            expect(validate).not.toHaveBeenCalled();
            await userEvent.click(screen.getByText('outside'));
            expect(validate).toHaveBeenCalledTimes(1);
        });

        it('即使值较短，ArrowRight 也能移动到最后一个输入框，Delete 后光标留在原格', async () => {
            render(<PinCode defaultValue="12" count={4} />);
            await userEvent.click(getInputs()[1]);
            await userEvent.keyboard('{ArrowRight}');
            expect(getInputs()[2]).toHaveFocus();
            await userEvent.keyboard('{ArrowRight}');
            expect(getInputs()[3]).toHaveFocus();
            await userEvent.click(getInputs()[1]);
            await userEvent.keyboard('{Delete}');
            expect(getValues()).toEqual(['1', '', '', '']);
            expect(getInputs()[1]).toHaveFocus();
        });
    });

    it('PinCodeProps 声明 validateStatus', () => {
        // type-level: fails to compile (excess property) when validateStatus is not declared
        const props: PinCodeProps = { validateStatus: 'error' };
        render(<PinCode count={2} {...props} />);
        getInputs().forEach((input) => expect(input).toHaveAttribute('aria-invalid', 'true'));
    });

    it('带 g 标志的正则逐字符校验结果不随调用次数变化', async () => {
        render(<PinCode autoFocus count={4} format={/\d/g} />);
        await userEvent.keyboard('1234');
        expect(getValues()).toEqual(['1', '2', '3', '4']);
    });

    it('粘贴非 BMP 字符按完整字符填入', async () => {
        const format = (value: string) => value.length > 0 && Array.from(value).length === 1;
        render(<PinCode autoFocus count={3} format={format} />);
        await userEvent.paste('😀😁');
        await waitFor(() => expect(getValues()).toEqual(['😀', '😁', '']));
    });

    it('键入非 BMP 字符按完整字符填入', async () => {
        const format = (value: string) => value.length > 0 && Array.from(value).length === 1;
        render(<PinCode autoFocus count={3} format={format} />);
        // a change without InputEvent data (autofill, some IMEs) falls back to the last character of the value
        fireEvent.change(getInputs()[0], { target: { value: '😀' } });
        await waitFor(() => expect(getValues()).toEqual(['😀', '', '']));
    });

    it('defaultValue 含非 BMP 字符时按完整字符拆分', () => {
        render(<PinCode defaultValue="😀a" count={3} />);
        expect(getValues()).toEqual(['😀', 'a', '']);
    });

    it.each(['altKey', 'ctrlKey', 'metaKey'])('带 %s 的方向键是浏览器快捷键，不移动焦点也不阻止默认行为', (modifier) => {
        render(<PinCode defaultValue="12" count={3} />);
        act(() => getInputs()[1].focus());
        expect(fireEvent.keyDown(getInputs()[1], { key: 'ArrowLeft', [modifier]: true })).toBe(true);
        expect(fireEvent.keyDown(getInputs()[1], { key: 'ArrowRight', [modifier]: true })).toBe(true);
        expect(getInputs()[1]).toHaveFocus();
    });
});
