import { createSignal, onMount } from 'solid-js';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import PinCode, { type PinCodeProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import { LocaleProvider } from '../../locale';
import Tooltip from '../../tooltip';

type Change = NonNullable<PinCodeProps['onChange']>;
type Complete = NonNullable<PinCodeProps['onComplete']>;

const wrapperSelector = `.${BASE_CLASS_PREFIX}-pincode-wrapper`;
const inputFocusCls = `${BASE_CLASS_PREFIX}-input-wrapper-focus`;

// An unknown format string is accepted at runtime and leaves the characters unrestricted
const textFormat = 'text' as unknown as PinCodeProps['format'];

const getInputs = () => screen.getAllByRole<HTMLInputElement>('textbox');
const getValues = () => getInputs().map((input) => input.value);
const getWrapper = () => document.querySelector(wrapperSelector) as HTMLElement;

describe('PinCode', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('正常渲染不崩溃', () => {
        render(() => <PinCode />);
        expect(getWrapper()).not.toBeNull();
    });

    it('非受控时无关属性变化不清空已输入的字符', async () => {
        const [props, setProps] = createSignal<PinCodeProps>({ count: 4 });
        render(() => <PinCode {...props()} />);
        await userEvent.type(getInputs()[0], '1');
        expect(getValues()).toEqual(['1', '', '', '']);
        setProps({ count: 4, size: 'large' });
        expect(getValues()).toEqual(['1', '', '', '']);
    });

    it('class 与 style 落在外层容器', () => {
        render(() => <PinCode class="custom-class" style={{ border: '1px solid red' }} />);
        expect(getWrapper()).toHaveClass('custom-class');
        expect(getWrapper()).toHaveStyle({ 'border-color': 'rgb(255, 0, 0)' });
    });

    it('根据 count 渲染对应数量的输入框，默认 6 个', () => {
        const { unmount } = render(() => <PinCode count={4} />);
        expect(getInputs()).toHaveLength(4);
        unmount();
        render(() => <PinCode />);
        expect(getInputs()).toHaveLength(6);
    });

    it('使用 defaultValue 渲染', () => {
        render(() => <PinCode defaultValue="123456" />);
        expect(getValues()).toEqual(['1', '2', '3', '4', '5', '6']);
    });

    it('受控模式下使用 value 属性', () => {
        render(() => <PinCode value="654321" />);
        expect(getValues()).toEqual(['6', '5', '4', '3', '2', '1']);
    });

    it('onChange 回调', async () => {
        const onChange = vi.fn<Change>();
        render(() => <PinCode autofocus onChange={onChange} />);
        await userEvent.keyboard('1');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('1');
    });

    it('onComplete 回调', async () => {
        const onComplete = vi.fn<Complete>();
        render(() => <PinCode autofocus onComplete={onComplete} />);
        await userEvent.keyboard('123456');
        await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
        expect(onComplete).toHaveBeenCalledWith('123456');
        expect(getValues()).toEqual(['1', '2', '3', '4', '5', '6']);
    });

    it('禁用状态下渲染', () => {
        render(() => <PinCode disabled />);
        getInputs().forEach((input) => expect(input).toBeDisabled());
    });

    it('small 与 large 尺寸', () => {
        render(() => (
            <>
                <PinCode count={1} size="small" />
                <PinCode count={1} size="large" />
            </>
        ));
        const [small, large] = getInputs();
        expect(small).toHaveClass(`${BASE_CLASS_PREFIX}-input-small`);
        expect(large).toHaveClass(`${BASE_CLASS_PREFIX}-input-large`);
    });

    // focus moving on its own at load skips content before the code and, with several PinCodes, lands on the last one
    it('默认不获取焦点', () => {
        render(() => <PinCode />);
        expect(document.body).toHaveFocus();
    });

    it('autofocus 让第一个输入框获得焦点', () => {
        render(() => <PinCode autofocus />);
        expect(getInputs()[0]).toHaveFocus();
    });

    it('format 属性可设为 text', async () => {
        const onChange = vi.fn<Change>();
        render(() => <PinCode autofocus format={textFormat} onChange={onChange} />);
        await userEvent.keyboard('a');
        expect(onChange).toHaveBeenCalledWith('a');
        expect(getInputs()[0]).toHaveValue('a');
    });

    it('format 为 number 时 inputMode 为 numeric，否则为 text', () => {
        render(() => (
            <>
                <PinCode count={1} format="number" />
                <PinCode count={1} format={textFormat} />
            </>
        ));
        const [number, text] = getInputs();
        expect(number).toHaveAttribute('inputmode', 'numeric');
        expect(text).toHaveAttribute('inputmode', 'text');
    });

    it('处理输入变化', async () => {
        const onChange = vi.fn<Change>();
        render(() => <PinCode onChange={onChange} />);
        await userEvent.type(getInputs()[0], '5');
        expect(onChange).toHaveBeenCalledWith('5');
        expect(getInputs()[0]).toHaveValue('5');
        await waitFor(() => expect(getInputs()[1]).toHaveFocus());
    });

    it('处理 focus 与 blur 事件', async () => {
        render(() => <PinCode />);
        const input = getInputs()[0];
        await userEvent.click(input);
        expect(input).toHaveFocus();
        expect(input.parentElement).toHaveClass(inputFocusCls);
        input.blur();
        expect(input).not.toHaveFocus();
        expect(input.parentElement).not.toHaveClass(inputFocusCls);
    });

    it('空的第一格按 Backspace 报告空值，焦点不动', async () => {
        const onChange = vi.fn<Change>();
        render(() => <PinCode autofocus onChange={onChange} />);
        await userEvent.keyboard('{Backspace}');
        expect(onChange).toHaveBeenCalledWith('');
        expect(getInputs()[0]).toHaveFocus();
        expect(getValues()).toEqual(['', '', '', '', '', '']);
    });

    it('处理 Delete 按键', async () => {
        const onChange = vi.fn<Change>();
        render(() => <PinCode defaultValue="123456" onChange={onChange} />);
        await userEvent.click(getInputs()[2]);
        await userEvent.keyboard('{Delete}');
        // Delete removes the current character, the following ones move forward and the caret stays
        expect(getValues()).toEqual(['1', '2', '4', '5', '6', '']);
        expect(onChange).toHaveBeenCalledWith('12456');
        expect(getInputs()[2]).toHaveFocus();
    });

    it('ArrowLeft、ArrowRight 移动焦点，到两端时停住', async () => {
        render(() => <PinCode defaultValue="123456" />);
        await userEvent.click(getInputs()[2]);
        await userEvent.keyboard('{ArrowLeft}');
        expect(getInputs()[1]).toHaveFocus();
        await userEvent.keyboard('{ArrowRight}{ArrowRight}');
        expect(getInputs()[3]).toHaveFocus();
        await userEvent.click(getInputs()[0]);
        await userEvent.keyboard('{ArrowLeft}');
        expect(getInputs()[0]).toHaveFocus();
        await userEvent.click(getInputs()[5]);
        await userEvent.keyboard('{ArrowRight}');
        expect(getInputs()[5]).toHaveFocus();
    });

    it('format 为混合类型', async () => {
        const onChange = vi.fn<Change>();
        render(() => <PinCode autofocus format="mixed" onChange={onChange} />);
        await userEvent.keyboard('-');
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.keyboard('a');
        expect(onChange).toHaveBeenLastCalledWith('a');
        await userEvent.keyboard('1');
        expect(onChange).toHaveBeenLastCalledWith('a1');
    });

    it('format 为 RegExp', async () => {
        const onChange = vi.fn<Change>();
        render(() => <PinCode autofocus format={/^[a-z]$/} onChange={onChange} />);
        await userEvent.keyboard('1');
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.keyboard('a');
        expect(onChange).toHaveBeenCalledWith('a');
    });

    it('format 为函数', async () => {
        const format = vi.fn<(value: string) => boolean>((value) => /^[0-9]$/.test(value));
        const onChange = vi.fn<Change>();
        render(() => <PinCode autofocus format={format} onChange={onChange} />);
        await userEvent.keyboard('a');
        expect(format).toHaveBeenCalledWith('a');
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.keyboard('7');
        expect(onChange).toHaveBeenCalledWith('7');
    });

    it('value 变化时受控模式更新', async () => {
        const [value, setValue] = createSignal('111111');
        render(() => <PinCode value={value()} />);
        expect(getValues()).toEqual(['1', '1', '1', '1', '1', '1']);
        setValue('222222');
        await waitFor(() => expect(getValues()).toEqual(['2', '2', '2', '2', '2', '2']));
    });

    it('父组件挂载时就改了受控 value，各输入框显示新值', async () => {
        function Demo() {
            const [value, setValue] = createSignal('12');
            onMount(() => setValue('34'));
            return <PinCode count={2} value={value()} />;
        }
        render(() => <Demo />);
        await waitFor(() => expect(getValues()).toEqual(['3', '4']));
    });

    it('ref 指向分组元素，可从中取到各输入框', () => {
        let root: HTMLDivElement | undefined;
        render(() => <PinCode ref={(node) => (root = node)} count={2} />);
        expect(root).toBe(getWrapper());
        expect([...(root as HTMLDivElement).querySelectorAll('input')]).toEqual(getInputs());
    });

    it('ref 的 focus 聚焦第一个空输入框，全部填满时聚焦最后一个，blur 释放焦点', () => {
        let ref!: HTMLDivElement;
        const [value, setValue] = createSignal('1');
        render(() => <PinCode ref={(node) => (ref = node)} count={3} value={value()} />);
        ref.focus();
        expect(getInputs()[1]).toHaveFocus();
        ref.blur();
        expect(document.body).toHaveFocus();
        setValue('123');
        ref.focus();
        expect(getInputs()[2]).toHaveFocus();
    });

    it('count 变小后 ref 的 focus 只在剩下的输入框中选择', () => {
        let ref!: HTMLDivElement;
        const [count, setCount] = createSignal(4);
        render(() => <PinCode ref={(node) => (ref = node)} count={count()} value="12" />);
        setCount(2);
        ref.focus();
        expect(getInputs()).toHaveLength(2);
        expect(getInputs()[1]).toHaveFocus();
    });

    it('输入合法数字时的处理', async () => {
        const onChange = vi.fn<Change>();
        render(() => <PinCode format="number" onChange={onChange} />);
        fireEvent.input(getInputs()[0], { target: { value: '5' } });
        await waitFor(() => expect(onChange).toHaveBeenCalledWith('5'));
        expect(getInputs()[0]).toHaveValue('5');
    });

    it('输入框被清空时（剪切、虚拟键盘删除）移除该字符，焦点留在原格', async () => {
        const onChange = vi.fn<Change>();
        render(() => <PinCode defaultValue="12" count={4} onChange={onChange} />);
        const [first] = getInputs();
        await userEvent.click(first);
        fireEvent.input(first, { target: { value: '' } });
        await waitFor(() => expect(getValues()).toEqual(['2', '', '', '']));
        expect(onChange).toHaveBeenLastCalledWith('2');
        expect(first).toHaveFocus();
    });

    it('number 格式下输入非法字符时不显示也不报告', async () => {
        const onChange = vi.fn<Change>();
        render(() => <PinCode autofocus format="number" onChange={onChange} />);
        await userEvent.keyboard('a');
        expect(onChange).not.toHaveBeenCalled();
        expect(getInputs()[0]).toHaveValue('');
        expect(getInputs()[0]).toHaveFocus();
    });

    it('粘贴填入各输入框', async () => {
        const onChange = vi.fn<Change>();
        const onComplete = vi.fn<Complete>();
        render(() => <PinCode autofocus format="number" onChange={onChange} onComplete={onComplete} />);
        await userEvent.paste('123456');
        await waitFor(() => expect(onComplete).toHaveBeenCalledWith('123456'));
        expect(getValues()).toEqual(['1', '2', '3', '4', '5', '6']);
        expect(onChange).toHaveBeenLastCalledWith('123456');
    });

    it('所有输入框填满时调用 onComplete', async () => {
        const onComplete = vi.fn<Complete>();
        render(() => <PinCode autofocus count={3} onComplete={onComplete} />);
        await userEvent.keyboard('12');
        expect(onComplete).not.toHaveBeenCalled();
        await userEvent.keyboard('3');
        await waitFor(() => expect(onComplete).toHaveBeenCalledWith('123'));
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('处理不同位置输入框的 focus', async () => {
        render(() => <PinCode defaultValue="123" />);
        await userEvent.click(getInputs()[1]);
        expect(getInputs()[1]).toHaveFocus();
        await userEvent.click(getInputs()[2]);
        expect(getInputs()[2]).toHaveFocus();
        await userEvent.keyboard('9');
        expect(getValues()).toEqual(['1', '2', '9', '', '', '']);
        await waitFor(() => expect(getInputs()[3]).toHaveFocus());
    });

    it('第一个输入框中处理 Backspace', async () => {
        const onChange = vi.fn<Change>();
        render(() => <PinCode defaultValue="123456" onChange={onChange} />);
        await userEvent.click(getInputs()[0]);
        await userEvent.keyboard('{Backspace}');
        // removes the current character and keeps focus instead of moving to a negative index
        expect(getValues()).toEqual(['2', '3', '4', '5', '6', '']);
        expect(onChange).toHaveBeenCalledWith('23456');
        expect(getInputs()[0]).toHaveFocus();
    });

    it('最后一个输入框中处理 Delete', async () => {
        const onChange = vi.fn<Change>();
        render(() => <PinCode defaultValue="123456" onChange={onChange} />);
        await userEvent.click(getInputs()[5]);
        await userEvent.keyboard('{Delete}');
        expect(getValues()).toEqual(['1', '2', '3', '4', '5', '']);
        expect(onChange).toHaveBeenCalledWith('12345');
        expect(getInputs()[5]).toHaveFocus();
    });

    it('defaultValue 为空或不完整时渲染', () => {
        render(() => (
            <>
                <PinCode defaultValue="" count={2} />
                <PinCode defaultValue="12" count={4} />
            </>
        ));
        expect(getValues()).toEqual(['', '', '1', '2', '', '']);
    });

    it('受控且 value 为空串时，不回落到 defaultValue', () => {
        render(() => <PinCode defaultValue="12" value="" />);
        expect(getValues()).toEqual(['', '', '', '', '', '']);
    });

    describe('已填内容始终是无空位的前缀', () => {
        const Controlled = (props: PinCodeProps) => {
            const [value, setValue] = createSignal('');
            return <PinCode {...props} value={value()} onChange={setValue} />;
        };

        it('受控时在空的第 3 格输入，字符落在第一个空格，onChange 与显示一致', async () => {
            render(() => <Controlled count={4} />);
            await userEvent.click(getInputs()[2]);
            await userEvent.keyboard('5');
            await waitFor(() => expect(getValues()).toEqual(['5', '', '', '']));
            await waitFor(() => expect(getInputs()[1]).toHaveFocus());
        });

        it('非受控时在空的第 3 格输入，onChange 值与显示一致', async () => {
            const onChange = vi.fn<Change>();
            render(() => <PinCode count={4} onChange={onChange} />);
            await userEvent.click(getInputs()[2]);
            await userEvent.keyboard('5');
            expect(onChange).toHaveBeenLastCalledWith('5');
            await waitFor(() => expect(getValues()).toEqual(['5', '', '', '']));
        });

        it('先填最后一格不触发 onComplete', async () => {
            const onComplete = vi.fn<Complete>();
            render(() => <PinCode count={4} onComplete={onComplete} />);
            await userEvent.click(getInputs()[3]);
            await userEvent.keyboard('8');
            await waitFor(() => expect(getValues()).toEqual(['8', '', '', '']));
            expect(onComplete).not.toHaveBeenCalled();
        });

        it('Backspace 清除中间的字符，后面的字符前移，焦点前移', async () => {
            const onChange = vi.fn<Change>();
            render(() => <PinCode defaultValue="123" onChange={onChange} />);
            await userEvent.click(getInputs()[1]);
            await userEvent.keyboard('{Backspace}');
            expect(onChange).toHaveBeenLastCalledWith('13');
            expect(getValues()).toEqual(['1', '3', '', '', '', '']);
            expect(getInputs()[0]).toHaveFocus();
        });
    });

    it('count 变化时渲染对应数量的输入框', () => {
        const [count, setCount] = createSignal(6);
        render(() => <PinCode count={count()} />);
        setCount(3);
        expect(getInputs()).toHaveLength(3);
        setCount(8);
        expect(getInputs()).toHaveLength(8);
    });

    it('在已有值的输入框中输入时替换该字符', async () => {
        const onChange = vi.fn<Change>();
        render(() => <PinCode defaultValue="123456" onChange={onChange} />);
        await userEvent.type(getInputs()[0], '9');
        expect(onChange).toHaveBeenCalledWith('923456');
        expect(getInputs()[0]).toHaveValue('9');
    });

    it('输入与已有字符相同的字符时只显示一个', async () => {
        render(() => <PinCode defaultValue="1" count={3} />);
        await userEvent.type(getInputs()[0], '1');
        await waitFor(() => expect(getInputs()[1]).toHaveFocus());
        expect(getValues()).toEqual(['1', '', '']);
    });

    it('其他按键不改变值与焦点', () => {
        const onChange = vi.fn<Change>();
        render(() => <PinCode autofocus onChange={onChange} />);
        const input = getInputs()[0];
        fireEvent.keyDown(input, { key: 'Enter' });
        fireEvent.keyDown(input, { key: 'Tab' });
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(input).toHaveFocus();
        expect(onChange).not.toHaveBeenCalled();
        expect(getValues()).toEqual(['', '', '', '', '', '']);
    });

    it('从中间格粘贴不完整数据时落在第一个空格', async () => {
        render(() => <PinCode count={6} format="number" />);
        await userEvent.click(getInputs()[2]);
        await userEvent.paste('12');
        await waitFor(() => expect(getValues()).toEqual(['1', '2', '', '', '', '']));
        await waitFor(() => expect(getInputs()[2]).toHaveFocus());
    });

    it('填满最后一格后失焦', async () => {
        const onComplete = vi.fn<Complete>();
        render(() => <PinCode defaultValue="12345" onComplete={onComplete} />);
        await userEvent.click(getInputs()[5]);
        await userEvent.keyboard('6');
        await waitFor(() => expect(onComplete).toHaveBeenCalledWith('123456'));
        expect(getInputs()[5]).not.toHaveFocus();
    });

    it('处理空的粘贴数据', async () => {
        const onChange = vi.fn<Change>();
        render(() => <PinCode autofocus format="number" onChange={onChange} />);
        await userEvent.paste('');
        expect(onChange).not.toHaveBeenCalled();
        expect(getValues()).toEqual(['', '', '', '', '', '']);
        expect(getInputs()[0]).toHaveFocus();
    });

    it('混合与 text 格式的粘贴', async () => {
        const { unmount } = render(() => <PinCode autofocus format="mixed" />);
        await userEvent.paste('abc123');
        await waitFor(() => expect(getValues()).toEqual(['a', 'b', 'c', '1', '2', '3']));
        unmount();
        render(() => <PinCode autofocus format={textFormat} />);
        await userEvent.paste('abcdef');
        await waitFor(() => expect(getValues()).toEqual(['a', 'b', 'c', 'd', 'e', 'f']));
    });

    it('处理空输入框的 Backspace', async () => {
        render(() => <PinCode count={4} />);
        await userEvent.click(getInputs()[1]);
        await userEvent.keyboard('{Backspace}');
        expect(getInputs()[0]).toHaveFocus();
        expect(getValues()).toEqual(['', '', '', '']);
    });

    it('处理快速切换 focus', async () => {
        render(() => <PinCode count={4} />);
        const inputs = getInputs();
        for (const input of inputs) {
            await userEvent.click(input);
        }
        expect(inputs[3]).toHaveFocus();
        await userEvent.keyboard('8');
        expect(getValues()).toEqual(['8', '', '', '']);
    });

    describe('基线行为', () => {
        const Controlled = (props: PinCodeProps) => {
            const [value, setValue] = createSignal('');
            return (
                <>
                    <PinCode {...props} value={value()} onChange={setValue} />
                    <output>{value()}</output>
                </>
            );
        };

        it('受控输入经过父组件的 value', async () => {
            render(() => <Controlled autofocus count={4} />);
            await userEvent.keyboard('123');
            await waitFor(() => expect(getValues()).toEqual(['1', '2', '3', '']));
            expect(screen.getByRole('status')).toHaveTextContent('123');
            await waitFor(() => expect(getInputs()[3]).toHaveFocus());
        });

        it('受控粘贴填满每个输入框', async () => {
            const onComplete = vi.fn<Complete>();
            render(() => <Controlled autofocus count={4} onComplete={onComplete} />);
            await userEvent.paste('1234');
            await waitFor(() => expect(onComplete).toHaveBeenCalledWith('1234'));
            expect(getValues()).toEqual(['1', '2', '3', '4']);
            expect(screen.getByRole('status')).toHaveTextContent('1234');
        });

        it('粘贴遇到第一个非法字符时停止', async () => {
            const onChange = vi.fn<Change>();
            render(() => <PinCode autofocus count={4} onChange={onChange} />);
            await userEvent.paste('12a4');
            await waitFor(() => expect(getValues()).toEqual(['1', '2', '', '']));
            expect(onChange).toHaveBeenLastCalledWith('12');
            await waitFor(() => expect(getInputs()[2]).toHaveFocus());
        });

        it('部分粘贴不调用 onComplete', async () => {
            const onComplete = vi.fn<Complete>();
            render(() => <PinCode autofocus count={4} onComplete={onComplete} />);
            await userEvent.paste('12');
            await waitFor(() => expect(getValues()).toEqual(['1', '2', '', '']));
            expect(onComplete).not.toHaveBeenCalled();
        });

        it('Backspace 清空已填的输入框并向前移动', async () => {
            const onChange = vi.fn<Change>();
            render(() => <PinCode defaultValue="123" onChange={onChange} />);
            await userEvent.click(getInputs()[2]);
            await userEvent.keyboard('{Backspace}');
            expect(getValues()).toEqual(['1', '2', '', '', '', '']);
            expect(onChange).toHaveBeenLastCalledWith('12');
            expect(getInputs()[1]).toHaveFocus();
        });

        it('禁用的输入框不接受键盘输入', async () => {
            const onChange = vi.fn<Change>();
            render(() => <PinCode disabled onChange={onChange} />);
            expect(getInputs()[0]).not.toHaveFocus();
            await userEvent.type(getInputs()[0], '1');
            expect(onChange).not.toHaveBeenCalled();
            expect(getValues()).toEqual(['', '', '', '', '', '']);
        });

        it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
            semiGlobal.config.overrideDefaultProps = { PinCode: { count: 4, autofocus: true } };
            const { unmount } = render(() => <PinCode />);
            expect(getInputs()).toHaveLength(4);
            expect(getInputs()[0]).toHaveFocus();
            unmount();
            // an explicit prop wins over the global default
            render(() => <PinCode count={2} />);
            expect(getInputs()).toHaveLength(2);
        });

        it('全局 Input 默认值不给格子加清除按钮与前后缀', () => {
            semiGlobal.config.overrideDefaultProps = { Input: { showClear: true, prefix: 'x', suffix: 'y', insetLabel: 'l', addonBefore: 'b', addonAfter: 'a' } };
            const { container } = render(() => <PinCode defaultValue="12" count={2} />);
            expect(getInputs()).toHaveLength(2);
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-prefix, .${BASE_CLASS_PREFIX}-input-suffix, .${BASE_CLASS_PREFIX}-input-prepend, .${BASE_CLASS_PREFIX}-input-append`)).toBeNull();
        });

        it('每个字符只调用一次 onChange', async () => {
            const onChange = vi.fn<Change>();
            render(() => <PinCode autofocus onChange={onChange} />);
            await userEvent.keyboard('123');
            expect(onChange.mock.calls.map(([value]) => value)).toEqual(['1', '12', '123']);
            await waitFor(() => expect(getInputs()[3]).toHaveFocus());
        });
    });

    describe('可访问名称', () => {
        it('是由调用方命名的 group，每个输入框按位置命名', () => {
            render(() => <PinCode aria-label="Verification code" count={3} />);
            expect(screen.getByRole('group', { name: 'Verification code' })).toBe(getWrapper());
            expect(getInputs().map((input) => input.getAttribute('aria-label'))).toEqual(['第 1 位，共 3 位', '第 2 位，共 3 位', '第 3 位，共 3 位']);
            getInputs().forEach((input) => expect(input).not.toHaveAttribute('aria-labelledby'));
        });

        it('group 可由 aria-labelledby 命名', () => {
            render(() => (
                <div>
                    <span id="pin-label">PIN</span>
                    <PinCode aria-labelledby="pin-label" count={2} />
                </div>
            ));
            expect(screen.getByRole('group', { name: 'PIN' })).toBe(getWrapper());
            expect(screen.getByRole('textbox', { name: '第 2 位，共 2 位' })).toBeInTheDocument();
        });

        it('每个输入框保留描述性状态', () => {
            render(() => <PinCode aria-describedby="hint" aria-errormessage="err" aria-invalid="true" aria-required="true" count={2} />);
            getInputs().forEach((input) => {
                expect(input).toHaveAttribute('aria-describedby', 'hint');
                expect(input).toHaveAttribute('aria-errormessage', 'err');
                expect(input).toHaveAttribute('aria-invalid', 'true');
                expect(input).toHaveAttribute('aria-required', 'true');
            });
            expect(getWrapper()).not.toHaveAttribute('aria-describedby');
            expect(getWrapper()).not.toHaveAttribute('aria-invalid');
        });

        it('位置名称读取所选语言', () => {
            render(() => (
                <LocaleProvider locale={en_US}>
                    <PinCode count={2} />
                </LocaleProvider>
            ));
            expect(screen.getByRole('textbox', { name: 'Digit 1 of 2' })).toBeInTheDocument();
        });
    });

    describe('属性落点', () => {
        it('未声明的属性落在外层容器，id 落在第一个输入框，Form 注入的属性不落到 DOM', () => {
            const injected = { insetLabel: 'Code', insetLabelId: 'code-label', name: 'code' } as PinCodeProps;
            render(() => <PinCode data-x="1" title="tip" id="code" count={2} {...injected} />);
            const wrapper = getWrapper();
            expect(wrapper).toHaveAttribute('data-x', '1');
            expect(wrapper).toHaveAttribute('title', 'tip');
            expect(wrapper).not.toHaveAttribute('id');
            expect(wrapper).not.toHaveAttribute('insetlabel');
            // no single input can carry the whole code's name
            expect(document.querySelector('[name]')).toBeNull();
            const [first, second] = getInputs();
            expect(first).toHaveAttribute('id', 'code');
            expect(second).not.toHaveAttribute('id');
        });

        it('validateStatus 传给每个输入框', () => {
            const [status, setStatus] = createSignal<PinCodeProps['validateStatus']>('error');
            render(() => <PinCode count={3} validateStatus={status()} />);
            getInputs().forEach((input) => {
                expect(input).toHaveAttribute('aria-invalid', 'true');
                expect(input.closest(`.${BASE_CLASS_PREFIX}-input-wrapper`)).toHaveClass(`${BASE_CLASS_PREFIX}-input-wrapper-error`);
            });
            setStatus(undefined);
            getInputs().forEach((input) => expect(input).not.toHaveAttribute('aria-invalid'));
        });

        it('Tooltip 函数 children 展开到 PinCode 上时不增加额外的 Tab 停靠点，每个输入框由 Tooltip 描述', async () => {
            render(() => <Tooltip content="tip">{(t) => <PinCode count={2} {...t()} />}</Tooltip>);
            expect(getWrapper()).not.toHaveAttribute('tabindex');
            await userEvent.tab();
            expect(getInputs()[0]).toHaveFocus();
            await waitFor(() => getInputs().forEach((input) => expect(input).toHaveAccessibleDescription('tip')));
            await userEvent.tab();
            expect(getInputs()[1]).toHaveFocus();
            await userEvent.tab();
            expect(document.body).toHaveFocus();
        });

        it('禁用的 PinCode 在点击触发的 Tooltip 中由包裹 span 接收点击', async () => {
            render(() => (
                <Tooltip content="tip" motion={false} trigger="click">
                    {(t) => <PinCode count={2} disabled {...t()} />}
                </Tooltip>
            ));
            const span = getWrapper().parentElement as HTMLElement;
            expect(span).toHaveClass(`${BASE_CLASS_PREFIX}-tooltip-trigger-wrapper`);
            await userEvent.click(span);
            expect(await screen.findByText('tip')).toBeInTheDocument();
        });

        it('onFocus、onBlur 只在焦点进出整个验证码时触发', async () => {
            const onFocus = vi.fn<NonNullable<PinCodeProps['onFocus']>>();
            const onBlur = vi.fn<NonNullable<PinCodeProps['onBlur']>>();
            render(() => (
                <>
                    <PinCode count={3} onBlur={onBlur} onFocus={onFocus} />
                    <button type="button">outside</button>
                </>
            ));
            await userEvent.click(getInputs()[0]);
            await userEvent.click(getInputs()[1]);
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect(onBlur).not.toHaveBeenCalled();
            await userEvent.click(screen.getByText('outside'));
            expect(onBlur).toHaveBeenCalledTimes(1);
        });

        it('即使值较短，ArrowRight 也能移动到最后一个输入框，Delete 后光标留在原格', async () => {
            render(() => <PinCode defaultValue="12" count={4} />);
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

    it('带 g 标志的正则逐字符校验结果不随调用次数变化', async () => {
        render(() => <PinCode autofocus count={4} format={/\d/g} />);
        await userEvent.keyboard('1234');
        expect(getValues()).toEqual(['1', '2', '3', '4']);
    });

    it('粘贴非 BMP 字符按完整字符填入', async () => {
        const format = (value: string) => value.length > 0 && Array.from(value).length === 1;
        render(() => <PinCode autofocus count={3} format={format} />);
        await userEvent.paste('😀😁');
        await waitFor(() => expect(getValues()).toEqual(['😀', '😁', '']));
    });

    it('键入非 BMP 字符按完整字符填入', async () => {
        const format = (value: string) => value.length > 0 && Array.from(value).length === 1;
        render(() => <PinCode autofocus count={3} format={format} />);
        // a change without InputEvent data (autofill, some IMEs) falls back to the last character of the value
        fireEvent.input(getInputs()[0], { target: { value: '😀' } });
        await waitFor(() => expect(getValues()).toEqual(['😀', '', '']));
    });

    it('defaultValue 含非 BMP 字符时按完整字符拆分', () => {
        render(() => <PinCode defaultValue="😀a" count={3} />);
        expect(getValues()).toEqual(['😀', 'a', '']);
    });

    it.each(['altKey', 'ctrlKey', 'metaKey'])('带 %s 的方向键是浏览器快捷键，不移动焦点也不阻止默认行为', (modifier) => {
        render(() => <PinCode defaultValue="12" count={3} />);
        getInputs()[1].focus();
        expect(fireEvent.keyDown(getInputs()[1], { key: 'ArrowLeft', [modifier]: true })).toBe(true);
        expect(fireEvent.keyDown(getInputs()[1], { key: 'ArrowRight', [modifier]: true })).toBe(true);
        expect(getInputs()[1]).toHaveFocus();
    });
});
