/** @jsxImportSource vue */
import { nextTick } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import { render } from '@test/utils/vue';
import PinCode, { type PinCodeHandle, type PinCodeProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import { LocaleProvider } from '../../locale';
import Controlled from './fixtures/controlled.vue';
import InTooltip from './fixtures/in-tooltip.vue';
import ModelTrim from './fixtures/model-trim.vue';
import OneWay from './fixtures/one-way.vue';

type Notify = (value: string) => void;
const wrapperSelector = `.${BASE_CLASS_PREFIX}-pincode-wrapper`;
const inputFocusCls = `${BASE_CLASS_PREFIX}-input-wrapper-focus`;

const textFormat = 'text' as unknown as PinCodeProps['format'];

const getWrapper = () => document.querySelector(wrapperSelector) as HTMLElement;
const getInputs = () => screen.getAllByRole<HTMLInputElement>('textbox');
const getValues = () => getInputs().map((input) => input.value);
// Vue ignores an ancestor listener attached at or after the timestamp of an event coming up from a child, and the
// suite freezes the system clock, so time has to be moved on by hand.
const settle = () => {
    vi.setSystemTime(Date.now() + 10);
};
// Testing Library re-inserts the mounted nodes, which drops the focus autofocus gave, so the first cell is focused
// by hand; the autofocus cases spy on focus instead
const renderFocused = (props: PinCodeProps & Record<string, unknown>) => {
    const view = render(PinCode, { props });
    getInputs()[0].focus();
    return view;
};
const renderWithHandle = (props: PinCodeProps = {}) => {
    let handle: PinCodeHandle | null = null;
    const view = render({
        render: () => (
            <PinCode
                {...props}
                ref={(value) => {
                    handle = value as PinCodeHandle | null;
                }}
            />
        ),
    });
    return { ...view, handle: () => handle as unknown as PinCodeHandle };
};

describe('PinCode', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('正常渲染不崩溃', () => {
        render(PinCode);
        expect(getWrapper()).not.toBeNull();
    });

    it('使用自定义 class 渲染', () => {
        render(PinCode, { attrs: { class: 'custom-class' } });
        expect(getWrapper()).toHaveClass('custom-class');
    });

    it('使用自定义 style 渲染', () => {
        render(PinCode, { attrs: { style: { border: '1px solid red' } } });
        expect(getWrapper()).toHaveStyle({ borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgb(255, 0, 0)' });
    });

    it('使用方传入的 role 覆盖默认的 group', () => {
        render(PinCode, { attrs: { role: 'presentation' } });
        expect(getWrapper()).toHaveAttribute('role', 'presentation');
    });

    it('根据 count 渲染对应数量的输入框', () => {
        render(PinCode, { props: { count: 4 } });
        expect(getInputs()).toHaveLength(4);
    });

    it('默认渲染 6 个输入框', () => {
        render(PinCode);
        expect(getInputs()).toHaveLength(6);
    });

    it('使用 defaultValue 渲染', () => {
        render(PinCode, { props: { defaultValue: '123456' } });
        expect(getValues()).toEqual(['1', '2', '3', '4', '5', '6']);
    });

    it('受控模式下使用 modelValue', () => {
        render(PinCode, { props: { modelValue: '654321' } });
        expect(getValues()).toEqual(['6', '5', '4', '3', '2', '1']);
    });

    it('change 事件', async () => {
        const onChange = vi.fn<Notify>();
        renderFocused({ onChange });
        await userEvent.keyboard('1');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('1');
    });

    it('complete 事件', async () => {
        const onComplete = vi.fn<Notify>();
        renderFocused({ onComplete });
        await userEvent.keyboard('123456');
        await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
        expect(onComplete).toHaveBeenCalledWith('123456');
        expect(getValues()).toEqual(['1', '2', '3', '4', '5', '6']);
    });

    it('禁用状态下渲染', () => {
        render(PinCode, { props: { disabled: true } });
        getInputs().forEach((input) => expect(input).toBeDisabled());
    });

    it.each(['small', 'large'] as const)('%s 尺寸渲染', (size) => {
        render(PinCode, { props: { size } });
        getInputs().forEach((input) => expect(input).toHaveClass(`${BASE_CLASS_PREFIX}-input-${size}`));
    });

    // focus moving on its own at load skips content before the code and, with several PinCodes, lands on the last one
    it('默认不获取焦点', () => {
        render(PinCode);
        expect(document.body).toHaveFocus();
    });

    it('autofocus 让第一个输入框获得焦点', () => {
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        render(PinCode, { props: { autofocus: true } });
        expect(focus.mock.contexts).toEqual([getInputs()[0]]);
    });

    it('format 属性可设为 text', async () => {
        const onChange = vi.fn<Notify>();
        renderFocused({ format: textFormat, onChange });
        await userEvent.keyboard('a');
        expect(onChange).toHaveBeenCalledWith('a');
        expect(getInputs()[0]).toHaveValue('a');
    });

    it('format 为 number 时输入框的 inputmode 为 numeric', () => {
        render(PinCode, { props: { format: 'number' } });
        getInputs().forEach((input) => expect(input).toHaveAttribute('inputmode', 'numeric'));
    });

    it('format 为 text 时输入框的 inputmode 为 text', () => {
        render(PinCode, { props: { format: textFormat } });
        getInputs().forEach((input) => expect(input).toHaveAttribute('inputmode', 'text'));
    });

    it('处理输入变化', async () => {
        const onChange = vi.fn<Notify>();
        render(PinCode, { props: { onChange } });
        await userEvent.type(getInputs()[0], '5');
        expect(onChange).toHaveBeenCalledWith('5');
        expect(getInputs()[0]).toHaveValue('5');
        await waitFor(() => expect(getInputs()[1]).toHaveFocus());
    });

    it('处理 focus 事件', async () => {
        render(PinCode);
        const input = getInputs()[0];
        await userEvent.click(input);
        expect(input).toHaveFocus();
        expect(input.parentElement).toHaveClass(inputFocusCls);
    });

    it('处理 blur 事件', async () => {
        render(PinCode);
        const input = getInputs()[0];
        await userEvent.click(input);
        input.blur();
        await nextTick();
        expect(input).not.toHaveFocus();
        expect(input.parentElement).not.toHaveClass(inputFocusCls);
    });

    it('处理 keydown 事件', async () => {
        const onChange = vi.fn<Notify>();
        renderFocused({ onChange });
        await userEvent.keyboard('{Backspace}');
        expect(onChange).toHaveBeenCalledWith('');
        expect(getInputs()[0]).toHaveFocus();
        expect(getValues()).toEqual(['', '', '', '', '', '']);
    });

    it('处理 Delete 按键', async () => {
        const onChange = vi.fn<Notify>();
        render(PinCode, { props: { defaultValue: '123456', onChange } });
        await userEvent.click(getInputs()[2]);
        await userEvent.keyboard('{Delete}');
        expect(getValues()).toEqual(['1', '2', '4', '5', '6', '']);
        expect(onChange).toHaveBeenCalledWith('12456');
        expect(getInputs()[2]).toHaveFocus();
    });

    it('处理 ArrowLeft 按键', async () => {
        render(PinCode, { props: { defaultValue: '123456' } });
        await userEvent.click(getInputs()[2]);
        await userEvent.keyboard('{ArrowLeft}');
        expect(getInputs()[1]).toHaveFocus();
    });

    it('处理 ArrowRight 按键', async () => {
        render(PinCode, { props: { defaultValue: '123456' } });
        await userEvent.click(getInputs()[2]);
        await userEvent.keyboard('{ArrowRight}');
        expect(getInputs()[3]).toHaveFocus();
    });

    it('format 为混合类型', async () => {
        const onChange = vi.fn<Notify>();
        renderFocused({ format: 'mixed', onChange });
        await userEvent.keyboard('-');
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.keyboard('a');
        expect(onChange).toHaveBeenLastCalledWith('a');
        await userEvent.keyboard('1');
        expect(onChange).toHaveBeenLastCalledWith('a1');
    });

    it('format 为 RegExp', async () => {
        const onChange = vi.fn<Notify>();
        renderFocused({ format: /^[a-z]$/, onChange });
        await userEvent.keyboard('1');
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.keyboard('a');
        expect(onChange).toHaveBeenCalledWith('a');
    });

    it('format 为函数', async () => {
        const format = vi.fn<(value: string) => boolean>((value) => /^[0-9]$/.test(value));
        const onChange = vi.fn<Notify>();
        renderFocused({ format, onChange });
        await userEvent.keyboard('a');
        expect(format).toHaveBeenCalledWith('a');
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.keyboard('7');
        expect(onChange).toHaveBeenCalledWith('7');
    });

    it('modelValue 变化时受控模式更新', async () => {
        const view = render(PinCode, { props: { modelValue: '111111' } });
        expect(getValues()).toEqual(['1', '1', '1', '1', '1', '1']);
        await view.rerender({ modelValue: '222222' });
        await waitFor(() => expect(getValues()).toEqual(['2', '2', '2', '2', '2', '2']));
    });

    it('PinCode 实例的 focus 方法', () => {
        const { handle } = renderWithHandle();
        handle().focus(0);
        expect(getInputs()[0]).toHaveFocus();
    });

    it('PinCode 实例的 blur 方法', () => {
        const { handle } = renderWithHandle();
        handle().focus(0);
        expect(getInputs()[0]).toHaveFocus();
        handle().blur(0);
        expect(getInputs()[0]).not.toHaveFocus();
    });

    it('输入合法数字时的处理', async () => {
        const onChange = vi.fn<Notify>();
        render(PinCode, { props: { format: 'number', onChange } });
        await fireEvent.update(getInputs()[0], '5');
        await waitFor(() => expect(onChange).toHaveBeenCalledWith('5'));
        expect(getInputs()[0]).toHaveValue('5');
    });

    it('输入框被清空时（剪切、虚拟键盘删除）移除该字符，焦点留在原格', async () => {
        const onChange = vi.fn<Notify>();
        render(PinCode, { props: { defaultValue: '12', count: 4, onChange } });
        const [first] = getInputs();
        await userEvent.click(first);
        await fireEvent.update(first, '');
        await waitFor(() => expect(getValues()).toEqual(['2', '', '', '']));
        expect(onChange).toHaveBeenLastCalledWith('2');
        expect(first).toHaveFocus();
    });

    it('number 格式下输入非法字符时的处理', async () => {
        const onChange = vi.fn<Notify>();
        renderFocused({ format: 'number', onChange });
        await userEvent.keyboard('a');
        expect(onChange).not.toHaveBeenCalled();
        await waitFor(() => expect(getInputs()[0]).toHaveValue(''));
        expect(getInputs()[0]).toHaveFocus();
    });

    it('输入合法混合字符时的处理', async () => {
        const onChange = vi.fn<Notify>();
        renderFocused({ format: 'mixed', onChange });
        await userEvent.keyboard('a');
        expect(onChange).toHaveBeenCalledWith('a');
        expect(getInputs()[0]).toHaveValue('a');
    });

    it('绑定粘贴事件处理函数', async () => {
        const onChange = vi.fn<Notify>();
        renderFocused({ count: 4, onChange });
        await userEvent.paste('1234');
        await waitFor(() => expect(getValues()).toEqual(['1', '2', '3', '4']));
        expect(onChange).toHaveBeenLastCalledWith('1234');
    });

    it('所有输入框填满时发出 complete', async () => {
        const onComplete = vi.fn<Notify>();
        renderFocused({ count: 3, onComplete });
        await userEvent.keyboard('12');
        expect(onComplete).not.toHaveBeenCalled();
        await userEvent.keyboard('3');
        await waitFor(() => expect(onComplete).toHaveBeenCalledWith('123'));
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('处理不同位置输入框的 focus', async () => {
        render(PinCode, { props: { defaultValue: '123' } });
        await userEvent.click(getInputs()[1]);
        expect(getInputs()[1]).toHaveFocus();
        await userEvent.click(getInputs()[2]);
        expect(getInputs()[2]).toHaveFocus();
        await userEvent.keyboard('9');
        expect(getValues()).toEqual(['1', '2', '9', '', '', '']);
        await waitFor(() => expect(getInputs()[3]).toHaveFocus());
    });

    it('处理不同位置输入框的 blur', async () => {
        render(PinCode, { props: { defaultValue: '123' } });
        const input = getInputs()[1];
        await userEvent.click(input);
        expect(input.parentElement).toHaveClass(inputFocusCls);
        input.blur();
        await nextTick();
        expect(input.parentElement).not.toHaveClass(inputFocusCls);
        expect(getValues()).toEqual(['1', '2', '3', '', '', '']);
    });

    it('第一个输入框中处理 Backspace', async () => {
        const onChange = vi.fn<Notify>();
        render(PinCode, { props: { defaultValue: '123456', onChange } });
        await userEvent.click(getInputs()[0]);
        await userEvent.keyboard('{Backspace}');
        expect(getValues()).toEqual(['2', '3', '4', '5', '6', '']);
        expect(onChange).toHaveBeenCalledWith('23456');
        expect(getInputs()[0]).toHaveFocus();
    });

    it('第一个输入框中处理 ArrowLeft', async () => {
        render(PinCode, { props: { defaultValue: '123456' } });
        await userEvent.click(getInputs()[0]);
        await userEvent.keyboard('{ArrowLeft}');
        expect(getInputs()[0]).toHaveFocus();
    });

    it('最后一个输入框中处理 ArrowRight', async () => {
        render(PinCode, { props: { defaultValue: '123456' } });
        await userEvent.click(getInputs()[5]);
        await userEvent.keyboard('{ArrowRight}');
        expect(getInputs()[5]).toHaveFocus();
    });

    it('最后一个输入框中处理 Delete', async () => {
        const onChange = vi.fn<Notify>();
        render(PinCode, { props: { defaultValue: '123456', onChange } });
        await userEvent.click(getInputs()[5]);
        await userEvent.keyboard('{Delete}');
        expect(getValues()).toEqual(['1', '2', '3', '4', '5', '']);
        expect(onChange).toHaveBeenCalledWith('12345');
        expect(getInputs()[5]).toHaveFocus();
    });

    it('defaultValue 为空时渲染', () => {
        render(PinCode, { props: { defaultValue: '' } });
        expect(getValues()).toEqual(['', '', '', '', '', '']);
    });

    it('defaultValue 不完整时渲染', () => {
        render(PinCode, { props: { defaultValue: '12', count: 6 } });
        expect(getValues()).toEqual(['1', '2', '', '', '', '']);
    });

    it('受控且 modelValue 为空串时，不回落到 defaultValue', () => {
        render(PinCode, { props: { defaultValue: '12', modelValue: '' } });
        expect(getValues()).toEqual(['', '', '', '', '', '']);
    });

    describe('已填内容始终是无空位的前缀', () => {
        it('受控时在空的第 3 格输入，字符落在第一个空格，change 与显示一致', async () => {
            render(Controlled, { props: { count: 4 } });
            await userEvent.click(getInputs()[2]);
            await userEvent.keyboard('5');
            await waitFor(() => expect(getValues()).toEqual(['5', '', '', '']));
            await waitFor(() => expect(getInputs()[1]).toHaveFocus());
        });

        it('非受控时在空的第 3 格输入，change 值与显示一致', async () => {
            const onChange = vi.fn<Notify>();
            render(PinCode, { props: { count: 4, onChange } });
            await userEvent.click(getInputs()[2]);
            await userEvent.keyboard('5');
            expect(onChange).toHaveBeenLastCalledWith('5');
            await waitFor(() => expect(getValues()).toEqual(['5', '', '', '']));
        });

        it('先填最后一格不发出 complete', async () => {
            const onComplete = vi.fn<Notify>();
            render(PinCode, { props: { count: 4, onComplete } });
            await userEvent.click(getInputs()[3]);
            await userEvent.keyboard('8');
            await waitFor(() => expect(getValues()).toEqual(['8', '', '', '']));
            expect(onComplete).not.toHaveBeenCalled();
        });

        it('Backspace 清除中间的字符，后面的字符前移', async () => {
            const onChange = vi.fn<Notify>();
            render(PinCode, { props: { defaultValue: '123', onChange } });
            await userEvent.click(getInputs()[1]);
            await userEvent.keyboard('{Backspace}');
            expect(onChange).toHaveBeenLastCalledWith('13');
            expect(getValues()).toEqual(['1', '3', '', '', '', '']);
        });
    });

    it('count 取不同值', () => {
        const view = render(PinCode, { props: { count: 3 } });
        expect(getInputs()).toHaveLength(3);
        view.unmount();
        render(PinCode, { props: { count: 8 } });
        expect(getInputs()).toHaveLength(8);
    });

    it('处理已有值的输入框', async () => {
        const onChange = vi.fn<Notify>();
        render(PinCode, { props: { defaultValue: '123456', onChange } });
        await userEvent.type(getInputs()[0], '9');
        expect(onChange).toHaveBeenCalledWith('923456');
        expect(getInputs()[0]).toHaveValue('9');
    });

    it('处理其他按键事件', async () => {
        const onChange = vi.fn<Notify>();
        renderFocused({ onChange });
        const input = getInputs()[0];
        await fireEvent.keyDown(input, { key: 'Enter' });
        await fireEvent.keyDown(input, { key: 'Tab' });
        await fireEvent.keyDown(input, { key: 'Escape' });
        expect(input).toHaveFocus();
        expect(onChange).not.toHaveBeenCalled();
        expect(getValues()).toEqual(['', '', '', '', '', '']);
    });

    it('valueList 状态正确初始化', () => {
        render(PinCode);
        expect(getValues()).toEqual(['', '', '', '', '', '']);
    });

    it('currentActiveIndex 状态正确初始化', async () => {
        renderFocused({});
        await userEvent.keyboard('4');
        expect(getValues()).toEqual(['4', '', '', '', '', '']);
    });

    it('处理合法数据的粘贴事件', async () => {
        const onChange = vi.fn<Notify>();
        const onComplete = vi.fn<Notify>();
        renderFocused({ format: 'number', onChange, onComplete });
        await userEvent.paste('123456');
        await waitFor(() => expect(onComplete).toHaveBeenCalledWith('123456'));
        expect(getValues()).toEqual(['1', '2', '3', '4', '5', '6']);
        expect(onChange).toHaveBeenLastCalledWith('123456');
    });

    it('处理不完整数据的粘贴事件', async () => {
        const onChange = vi.fn<Notify>();
        render(PinCode, { props: { count: 6, format: 'number', onChange } });
        await userEvent.click(getInputs()[2]);
        await userEvent.paste('12');
        await waitFor(() => expect(getValues()).toEqual(['1', '2', '', '', '', '']));
        await waitFor(() => expect(getInputs()[2]).toHaveFocus());
    });

    it('changeSpecificInputFocusState 设置 blur 状态', async () => {
        const onComplete = vi.fn<Notify>();
        render(PinCode, { props: { defaultValue: '12345', onComplete } });
        await userEvent.click(getInputs()[5]);
        await userEvent.keyboard('6');
        await waitFor(() => expect(onComplete).toHaveBeenCalledWith('123456'));
        expect(getInputs()[5]).not.toHaveFocus();
    });

    it('changeSpecificInputFocusState 设置 focus 状态', async () => {
        renderFocused({});
        await userEvent.keyboard('1');
        await waitFor(() => expect(getInputs()[1]).toHaveFocus());
    });

    it('处理空的粘贴数据', async () => {
        const onChange = vi.fn<Notify>();
        renderFocused({ format: 'number', onChange });
        await userEvent.paste('');
        expect(onChange).not.toHaveBeenCalled();
        expect(getValues()).toEqual(['', '', '', '', '', '']);
        expect(getInputs()[0]).toHaveFocus();
    });

    it('处理混合格式的粘贴', async () => {
        renderFocused({ format: 'mixed' });
        await userEvent.paste('abc123');
        await waitFor(() => expect(getValues()).toEqual(['a', 'b', 'c', '1', '2', '3']));
    });

    it('处理 text 格式的粘贴', async () => {
        renderFocused({ format: textFormat });
        await userEvent.paste('abcdef');
        await waitFor(() => expect(getValues()).toEqual(['a', 'b', 'c', 'd', 'e', 'f']));
    });

    it('focus 之后对输入框执行 blur', async () => {
        render(PinCode);
        const input = getInputs()[2];
        await userEvent.click(input);
        expect(input).toHaveFocus();
        input.blur();
        expect(input).not.toHaveFocus();
        expect(document.body).toHaveFocus();
    });

    it('不同位置的 focus 方法', () => {
        const { handle } = renderWithHandle({ count: 4 });
        [0, 1, 2, 3].forEach((index) => {
            handle().focus(index);
            expect(getInputs()[index]).toHaveFocus();
        });
    });

    it('不同位置的 blur 方法', () => {
        const { handle } = renderWithHandle({ count: 4 });
        [0, 2].forEach((index) => {
            handle().focus(index);
            expect(getInputs()[index]).toHaveFocus();
            handle().blur(index);
            expect(getInputs()[index]).not.toHaveFocus();
        });
    });

    it('处理触发填满的输入变化', async () => {
        const onComplete = vi.fn<Notify>();
        render(PinCode, { props: { defaultValue: '12', count: 3, onComplete } });
        await userEvent.type(getInputs()[2], '3');
        await waitFor(() => expect(onComplete).toHaveBeenCalledWith('123'));
        expect(getValues()).toEqual(['1', '2', '3']);
    });

    it('处理空输入框的 keydown', async () => {
        render(PinCode, { props: { count: 4 } });
        await userEvent.click(getInputs()[1]);
        await userEvent.keyboard('{Backspace}');
        expect(getInputs()[0]).toHaveFocus();
        expect(getValues()).toEqual(['', '', '', '']);
    });

    it('处理快速切换 focus', async () => {
        render(PinCode, { props: { count: 4 } });
        const inputs = getInputs();
        for (const input of inputs) {
            await userEvent.click(input);
        }
        expect(inputs[3]).toHaveFocus();
        await userEvent.keyboard('8');
        expect(getValues()).toEqual(['8', '', '', '']);
    });

    it('v-model.trim 的修饰符不落到 DOM', () => {
        render(ModelTrim);
        expect(document.querySelector('[modelmodifiers]')).toBeNull();
    });

    // A controlled paste reads each previous character from the parent's new value, so the parent must have
    // written it back before the next character: v-model and a one-way binding that writes back in change.
    describe.each([
        ['v-model', Controlled],
        ['单向绑定同步写回', OneWay],
    ] as const)('受控时序（%s）', (_, Host) => {
        it('受控输入经过父组件的 modelValue', async () => {
            render(Host, { props: { count: 4 } });
            await userEvent.click(getInputs()[0]);
            await userEvent.keyboard('123');
            await waitFor(() => expect(getValues()).toEqual(['1', '2', '3', '']));
            expect(screen.getByTestId('value')).toHaveTextContent('123');
            await waitFor(() => expect(getInputs()[3]).toHaveFocus());
        });

        it('受控粘贴填满每个输入框', async () => {
            render(Host, { props: { count: 4 } });
            await userEvent.click(getInputs()[0]);
            await userEvent.paste('1234');
            await waitFor(() => expect(getValues()).toEqual(['1', '2', '3', '4']));
            expect(screen.getByTestId('value')).toHaveTextContent('1234');
        });
    });

    it('受控粘贴填满时发出 complete', async () => {
        const onComplete = vi.fn<Notify>();
        render(Controlled, { props: { count: 4, onComplete } });
        await userEvent.click(getInputs()[0]);
        await userEvent.paste('1234');
        await waitFor(() => expect(onComplete).toHaveBeenCalledWith('1234'));
        expect(getValues()).toEqual(['1', '2', '3', '4']);
        expect(screen.getByTestId('value')).toHaveTextContent('1234');
    });

    it('粘贴遇到第一个非法字符时停止', async () => {
        const onChange = vi.fn<Notify>();
        renderFocused({ count: 4, onChange });
        await userEvent.paste('12a4');
        await waitFor(() => expect(getValues()).toEqual(['1', '2', '', '']));
        expect(onChange).toHaveBeenLastCalledWith('12');
        await waitFor(() => expect(getInputs()[2]).toHaveFocus());
    });

    it('部分粘贴不发出 complete', async () => {
        const onComplete = vi.fn<Notify>();
        renderFocused({ count: 4, onComplete });
        await userEvent.paste('12');
        await waitFor(() => expect(getValues()).toEqual(['1', '2', '', '']));
        expect(onComplete).not.toHaveBeenCalled();
    });

    it('Backspace 清空已填的输入框并向前移动', async () => {
        const onChange = vi.fn<Notify>();
        render(PinCode, { props: { defaultValue: '123', onChange } });
        await userEvent.click(getInputs()[2]);
        await userEvent.keyboard('{Backspace}');
        expect(getValues()).toEqual(['1', '2', '', '', '', '']);
        expect(onChange).toHaveBeenLastCalledWith('12');
        expect(getInputs()[1]).toHaveFocus();
    });

    it('禁用的输入框不接受键盘输入', async () => {
        const onChange = vi.fn<Notify>();
        render(PinCode, { props: { disabled: true, onChange } });
        expect(getInputs()[0]).not.toHaveFocus();
        await userEvent.type(getInputs()[0], '1');
        expect(onChange).not.toHaveBeenCalled();
        expect(getValues()).toEqual(['', '', '', '', '', '']);
    });

    it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { PinCode: { count: 4, autofocus: true } };
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        const view = render(PinCode);
        expect(getInputs()).toHaveLength(4);
        expect(focus.mock.contexts).toEqual([getInputs()[0]]);
        view.unmount();
        render(PinCode, { props: { count: 2 } });
        expect(getInputs()).toHaveLength(2);
    });

    it('全局 Input 默认值不给格子加清除按钮', () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true } };
        const view = render(PinCode, { props: { count: 2, defaultValue: '12' } });
        expect(getInputs()).toHaveLength(2);
        expect(view.container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
    });

    it('全局默认值：format、disabled、size，自身值优先', async () => {
        semiGlobal.config.overrideDefaultProps = {
            PinCode: { format: 'mixed', disabled: true, size: 'small' },
        };
        const view = render(PinCode, { props: { count: 2 } });
        getInputs().forEach((input) => {
            expect(input).toBeDisabled();
            expect(input).toHaveClass(`${BASE_CLASS_PREFIX}-input-small`);
            expect(input).toHaveAttribute('inputmode', 'text');
        });
        await view.rerender({ count: 2, disabled: false, format: 'number' });
        getInputs().forEach((input) => {
            expect(input).not.toBeDisabled();
            expect(input).toHaveAttribute('inputmode', 'numeric');
        });
    });

    it('count 变小时渲染更少的输入框，焦点在被移除的格子上时不抛错', async () => {
        const view = render(PinCode, { props: { count: 6 } });
        await userEvent.click(getInputs()[5]);
        await view.rerender({ count: 3 });
        expect(getInputs()).toHaveLength(3);
        await userEvent.click(getInputs()[2]);
        await userEvent.keyboard('{ArrowRight}');
        expect(getInputs()[2]).toHaveFocus();
    });

    describe('可访问名称', () => {
        it('是由调用方命名的 group，每个输入框按位置命名', () => {
            render(PinCode, { props: { count: 3 }, attrs: { 'aria-label': 'Verification code' } });
            expect(screen.getByRole('group', { name: 'Verification code' })).toBe(getWrapper());
            expect(getInputs().map((input) => input.getAttribute('aria-label'))).toEqual(['第 1 位，共 3 位', '第 2 位，共 3 位', '第 3 位，共 3 位']);
            getInputs().forEach((input) => expect(input).not.toHaveAttribute('aria-labelledby'));
        });

        it('group 可由 aria-labelledby 命名', () => {
            render({
                render: () => (
                    <div>
                        <span id="pin-label">PIN</span>
                        <PinCode count={2} aria-labelledby="pin-label" />
                    </div>
                ),
            });
            expect(screen.getByRole('group', { name: 'PIN' })).toBe(getWrapper());
            expect(screen.getByRole('textbox', { name: '第 2 位，共 2 位' })).toBeInTheDocument();
        });

        it('每个输入框保留描述性状态', () => {
            render(PinCode, { props: { count: 2 }, attrs: { 'aria-describedby': 'hint', 'aria-invalid': 'true' } });
            getInputs().forEach((input) => {
                expect(input).toHaveAttribute('aria-describedby', 'hint');
                expect(input).toHaveAttribute('aria-invalid', 'true');
            });
        });

        it('位置名称读取所选语言（ConfigProvider）', () => {
            render({ render: () => <ConfigProvider locale={en_US}>{() => <PinCode count={2} />}</ConfigProvider> });
            expect(screen.getByRole('textbox', { name: 'Digit 1 of 2' })).toBeInTheDocument();
        });

        it('位置名称跟随 LocaleProvider 的语言，group 的名称不被覆盖', () => {
            render({
                render: () => <LocaleProvider locale={ja_JP}>{() => <PinCode count={2} aria-label="Verification code" />}</LocaleProvider>,
            });
            const expected = ja_JP.PinCode.digit.replace('${index}', '1').replace('${count}', '2');
            expect(screen.getByRole('textbox', { name: expected })).toBeInTheDocument();
            expect(screen.getByRole('group', { name: 'Verification code' })).toBe(getWrapper());
        });
    });

    describe('属性落点', () => {
        it('未声明的属性落在 group，描述与状态给每个输入框，Form 注入的属性不进 DOM', () => {
            render(PinCode, {
                props: { count: 2 },
                attrs: {
                    'data-x': '1',
                    title: 'tip',
                    id: 'code',
                    name: 'code',
                    insetLabel: 'Code',
                    insetLabelId: 'code-label',
                    tabindex: 0,
                    'aria-describedby': 'code-helpText',
                    'aria-errormessage': 'code-error',
                    'aria-required': 'true',
                },
            });
            const wrapper = getWrapper();
            expect(wrapper).toHaveAttribute('data-x', '1');
            expect(wrapper).toHaveAttribute('title', 'tip');
            expect(wrapper).not.toHaveAttribute('id');
            expect(wrapper).not.toHaveAttribute('tabindex');
            for (const name of ['name', 'insetlabel', 'insetLabel', 'insetlabelid', 'insetLabelId']) {
                expect(wrapper).not.toHaveAttribute(name);
            }
            const inputs = getInputs();
            expect(inputs[0]).toHaveAttribute('id', 'code');
            expect(inputs[1]).not.toHaveAttribute('id');
            inputs.forEach((input) => {
                expect(input).not.toHaveAttribute('name');
                expect(input).toHaveAttribute('tabindex', '0');
                expect(input).toHaveAttribute('aria-describedby', 'code-helpText');
                expect(input).toHaveAttribute('aria-errormessage', 'code-error');
                expect(input).toHaveAttribute('aria-required', 'true');
                expect(input.closest(`.${BASE_CLASS_PREFIX}-input-wrapper`)).not.toHaveAttribute('data-x');
            });
        });

        it('id 放在第一个输入框上，点击 label 时使其获得焦点', async () => {
            render({
                render: () => (
                    <>
                        <label for="code">Code</label>
                        <PinCode id="code" count={3} />
                    </>
                ),
            });
            const inputs = getInputs();
            expect(inputs[0]).toHaveAttribute('id', 'code');
            expect(inputs[1]).not.toHaveAttribute('id');
            await userEvent.click(screen.getByText('Code'));
            expect(inputs[0]).toHaveFocus();
        });

        it('validateStatus 传给每个输入框', async () => {
            const view = render(PinCode, { props: { count: 3, validateStatus: 'error' } });
            getInputs().forEach((input) => {
                expect(input).toHaveAttribute('aria-invalid', 'true');
                expect(input.closest(`.${BASE_CLASS_PREFIX}-input-wrapper`)).toHaveClass(`${BASE_CLASS_PREFIX}-input-wrapper-error`);
            });
            await view.rerender({ count: 3, validateStatus: undefined });
            getInputs().forEach((input) => {
                expect(input).not.toHaveAttribute('aria-invalid', 'true');
                expect(input.closest(`.${BASE_CLASS_PREFIX}-input-wrapper`)).not.toHaveClass(`${BASE_CLASS_PREFIX}-input-wrapper-error`);
            });
        });

        it('PinCode 位于 Tooltip 内时不增加额外的 Tab 停靠点', async () => {
            render(InTooltip);
            expect(getWrapper()).not.toHaveAttribute('tabindex');
            await userEvent.tab();
            expect(getInputs()[0]).toHaveFocus();
            await waitFor(() => getInputs().forEach((input) => expect(input).toHaveAccessibleDescription()));
            await userEvent.tab();
            expect(getInputs()[1]).toHaveFocus();
            await userEvent.tab();
            expect(document.body).toHaveFocus();
        });

        it('即使值较短，ArrowRight 也能移动到最后一个输入框，Delete 后光标留在原格', async () => {
            render(PinCode, { props: { defaultValue: '12', count: 4 } });
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

    describe('Vue 绑定与事件', () => {
        it('v-model 在输入、粘贴与 Backspace 后得到整串', async () => {
            render(Controlled, { props: { count: 4 } });
            await userEvent.click(getInputs()[0]);
            await userEvent.keyboard('12');
            await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('12'));
            await userEvent.paste('34');
            await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('1234'));
            await userEvent.click(getInputs()[3]);
            await userEvent.keyboard('{Backspace}');
            await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent(/^123$/));
            expect(getValues()).toEqual(['1', '2', '3', '']);
        });

        it('单向绑定且父组件不写回时，格子保持 modelValue', async () => {
            render(OneWay, { props: { count: 4, initial: '1', writeBack: false } });
            await userEvent.click(getInputs()[1]);
            await userEvent.keyboard('5');
            await waitFor(() => expect(getValues()).toEqual(['1', '', '', '']));
            expect(screen.getByTestId('value')).toHaveTextContent(/^1$/);
        });

        it('change 与 update:modelValue 载荷相同，complete 只在填满时发出整串', async () => {
            const onChange = vi.fn<Notify>();
            const onUpdate = vi.fn<Notify>();
            const onComplete = vi.fn<Notify>();
            renderFocused({ count: 3, onChange, onComplete, 'onUpdate:modelValue': onUpdate });
            await userEvent.keyboard('12');
            expect(onComplete).not.toHaveBeenCalled();
            await userEvent.keyboard('3');
            await waitFor(() => expect(onComplete).toHaveBeenCalledWith('123'));
            expect(onChange.mock.calls).toEqual(onUpdate.mock.calls);
            expect(onChange.mock.calls.map(([value]) => value)).toEqual(['1', '12', '123']);
        });

        it('focus 在进入整个验证码时发出一次，blur 在离开时发出一次', async () => {
            const onFocus = vi.fn<(event: FocusEvent) => void>();
            const onBlur = vi.fn<(event: FocusEvent) => void>();
            render({
                render: () => (
                    <>
                        <PinCode count={3} onFocus={onFocus} onBlur={onBlur} />
                        <button type="button">outside</button>
                    </>
                ),
            });
            settle();
            await userEvent.tab();
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect(onFocus.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
            await userEvent.tab();
            await userEvent.tab();
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect(onBlur).not.toHaveBeenCalled();
            await userEvent.tab();
            expect(screen.getByText('outside')).toHaveFocus();
            expect(onBlur).toHaveBeenCalledTimes(1);
        });

        it('focus(i) 把光标放在字符之后，越界时无操作', () => {
            const { handle } = renderWithHandle({ defaultValue: '12', count: 3 });
            handle().focus(1);
            expect(getInputs()[1]).toHaveFocus();
            expect(getInputs()[1].selectionStart).toBe(1);
            expect(() => handle().focus(5)).not.toThrow();
            expect(() => handle().blur(5)).not.toThrow();
            expect(getInputs()[1]).toHaveFocus();
        });

        it('输入法组合结束时按提交的字符处理一次', async () => {
            const onChange = vi.fn<Notify>();
            render(PinCode, { props: { count: 3, format: 'mixed', onChange } });
            const [first] = getInputs();
            first.focus();
            await fireEvent.compositionStart(first);
            await fireEvent.update(first, 'a');
            expect(onChange).not.toHaveBeenCalled();
            first.value = 'a';
            await fireEvent(first, new CompositionEvent('compositionend', { bubbles: true, data: 'a' }));
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith('a');
            await waitFor(() => expect(getValues()).toEqual(['a', '', '']));
        });
    });

    it('带 g 标志的正则逐字符校验结果不随调用次数变化', async () => {
        renderFocused({ count: 4, format: /\d/g });
        await userEvent.keyboard('1234');
        await waitFor(() => expect(getValues()).toEqual(['1', '2', '3', '4']));
    });

    it('粘贴非 BMP 字符按完整字符填入', async () => {
        const format = (value: string) => value.length > 0 && Array.from(value).length === 1;
        renderFocused({ count: 3, format });
        await userEvent.paste('😀😁');
        await waitFor(() => expect(getValues()).toEqual(['😀', '😁', '']));
    });

    it('键入非 BMP 字符按完整字符填入', async () => {
        const format = (value: string) => value.length > 0 && Array.from(value).length === 1;
        renderFocused({ count: 3, format });
        await fireEvent.update(getInputs()[0], '😀');
        await waitFor(() => expect(getValues()).toEqual(['😀', '', '']));
    });

    it('defaultValue 与 modelValue 含非 BMP 字符时按完整字符拆分', async () => {
        render(PinCode, { props: { defaultValue: '😀a', count: 3 } });
        expect(getValues()).toEqual(['😀', 'a', '']);
        document.body.innerHTML = '';
        const view = render(PinCode, { props: { modelValue: 'a', count: 3 } });
        await view.rerender({ modelValue: 'b😁' });
        expect(getValues()).toEqual(['b', '😁', '']);
    });

    it.each(['altKey', 'ctrlKey', 'metaKey'])('带 %s 的方向键是浏览器快捷键，不移动焦点也不阻止默认行为', async (modifier) => {
        render(PinCode, { props: { count: 3, defaultValue: '12' } });
        const cell = getInputs()[1];
        cell.focus();
        for (const key of ['ArrowLeft', 'ArrowRight']) {
            const event = new KeyboardEvent('keydown', { key, [modifier]: true, bubbles: true, cancelable: true });
            cell.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(false);
        }
        await nextTick();
        expect(cell).toHaveFocus();
    });
});
