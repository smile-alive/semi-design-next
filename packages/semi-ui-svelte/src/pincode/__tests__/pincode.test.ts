import { flushSync } from 'svelte';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { PinCodeProps } from '../interface';
import PinCodeFixture from './pincode-fixture.svelte';
import InTooltip from './pincode-in-tooltip.svelte';
import LocaleHost from './pincode-locale-host.svelte';
import PinCodeModes from './pincode-modes.svelte';

type Notify = (value: string) => void;

const wrapperSelector = `.${BASE_CLASS_PREFIX}-pincode-wrapper`;
const inputFocusCls = `${BASE_CLASS_PREFIX}-input-wrapper-focus`;

const getWrapper = () => document.querySelector(wrapperSelector) as HTMLElement;
const getInputs = () => screen.getAllByRole<HTMLInputElement>('textbox');
const getValues = () => getInputs().map((input) => input.value);

function mount(props: PinCodeProps = {}) {
    const store = createStore<{ props: PinCodeProps }>({ props });
    const handle: { current?: unknown } = {};
    const view = render(PinCodeFixture, { props: { store, onHandle: (value: unknown) => (handle.current = value) } });
    flushSync();
    return { ...view, store, handle };
}

// Testing Library re-inserts the mounted nodes, which drops the focus autofocus gave, so the first cell is focused by hand
function mountFocused(props: PinCodeProps = {}) {
    const view = mount(props);
    getInputs()[0].focus();
    flushSync();
    return view;
}

function setupModes(mode: 'bind' | 'function' | 'one-way' | 'uncontrolled', value?: string, accept = true, props: PinCodeProps = {}) {
    const store = createStore<{ value: string | undefined; accept: boolean; log: string[] }>({ value, accept, log: [] });
    render(PinCodeModes, { props: { mode, store, props } });
    return store;
}

describe('Svelte PinCode 受控值（$bindable）', () => {
    it('非受控：输入、退格后 onChange 收到整串', async () => {
        const store = setupModes('uncontrolled', undefined, true, { count: 4 });
        await userEvent.click(getInputs()[0]);
        await userEvent.keyboard('12');
        await waitFor(() => expect(getValues()).toEqual(['1', '2', '', '']));
        // the first Backspace leaves the empty cell for the previous one, the second clears it
        await userEvent.keyboard('{Backspace}{Backspace}');
        await waitFor(() => expect(getValues()).toEqual(['1', '', '', '']));
        expect(store.log.at(-1)).toBe('change 1');
        expect(store.log.slice(0, 2)).toEqual(['change 1', 'change 12']);
    });

    it('bind:value：输入与粘贴写回父级整串，父级改值同步到格子，重置为 undefined 清空', async () => {
        const store = setupModes('bind', '', true, { count: 4 });
        await userEvent.click(getInputs()[0]);
        await userEvent.keyboard('12');
        await waitFor(() => expect(store.value).toBe('12'));
        await userEvent.paste('34');
        await waitFor(() => expect(store.value).toBe('1234'));
        expect(getValues()).toEqual(['1', '2', '3', '4']);
        await userEvent.click(getInputs()[3]);
        await userEvent.keyboard('{Backspace}');
        await waitFor(() => expect(store.value).toBe('123'));
        expect(getValues()).toEqual(['1', '2', '3', '']);
        store.value = '9876';
        flushSync();
        await waitFor(() => expect(getValues()).toEqual(['9', '8', '7', '6']));
        store.value = undefined;
        flushSync();
        await waitFor(() => expect(getValues()).toEqual(['', '', '', '']));
    });

    it('bind:value 起始为 undefined 也能输入并写回', async () => {
        const store = setupModes('bind', undefined, true, { count: 3 });
        await userEvent.click(getInputs()[0]);
        await userEvent.keyboard('123');
        await waitFor(() => expect(store.value).toBe('123'));
        expect(getValues()).toEqual(['1', '2', '3']);
    });

    it('受控粘贴填满每个输入框并发出整串', async () => {
        const store = setupModes('bind', '', true, { count: 4 });
        await userEvent.click(getInputs()[0]);
        await userEvent.paste('1234');
        await waitFor(() => expect(getValues()).toEqual(['1', '2', '3', '4']));
        expect(store.value).toBe('1234');
        expect(screen.getByTestId('value')).toHaveTextContent('1234');
    });

    it('函数绑定：setter 拒绝时格子保持原值', async () => {
        const store = setupModes('function', '1', false, { count: 4 });
        await userEvent.click(getInputs()[1]);
        await userEvent.keyboard('5');
        await waitFor(() => expect(store.log).toEqual(['set 15', 'change 15']));
        expect(getValues()).toEqual(['1', '', '', '']);
        expect(store.value).toBe('1');
    });

    it('函数绑定：setter 接受时跟随', async () => {
        const store = setupModes('function', '', true, { count: 4 });
        await userEvent.click(getInputs()[0]);
        await userEvent.keyboard('12');
        await waitFor(() => expect(getValues()).toEqual(['1', '2', '', '']));
        expect(store.value).toBe('12');
    });

    it('单向传值：输入在本地覆盖，父级值不变；父级再推值时以父级为准', async () => {
        const store = setupModes('one-way', '1', true, { count: 4 });
        expect(getValues()).toEqual(['1', '', '', '']);
        await userEvent.click(getInputs()[1]);
        await userEvent.keyboard('5');
        await waitFor(() => expect(getValues()).toEqual(['1', '5', '', '']));
        expect(store.value).toBe('1');
        store.value = '9';
        flushSync();
        await waitFor(() => expect(getValues()).toEqual(['9', '', '', '']));
    });
});

describe('Svelte PinCode', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('渲染 group、默认 6 个输入框，count 决定数量', () => {
        const view = mount();
        expect(getWrapper()).toHaveAttribute('role', 'group');
        expect(getInputs()).toHaveLength(6);
        view.unmount();
        const four = mount({ count: 4 });
        expect(getInputs()).toHaveLength(4);
        four.unmount();
        mount({ count: 8 });
        expect(getInputs()).toHaveLength(8);
    });

    it('class、style 与 role 落在 group', () => {
        mount({ class: 'custom-class', style: 'border: 1px solid red', role: 'presentation' });
        expect(getWrapper()).toHaveClass('custom-class');
        expect(getWrapper()).toHaveStyle({ borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgb(255, 0, 0)' });
        expect(getWrapper()).toHaveAttribute('role', 'presentation');
    });

    it('value 渲染到格子，父级改值后更新', async () => {
        const { store } = mount({ value: '654321' });
        expect(getValues()).toEqual(['6', '5', '4', '3', '2', '1']);
        store.props.value = '222222';
        flushSync();
        await waitFor(() => expect(getValues()).toEqual(['2', '2', '2', '2', '2', '2']));
    });

    it('value 为空串时格子为空，value 不完整时只填前几格', () => {
        mount({ value: '' });
        expect(getValues()).toEqual(['', '', '', '', '', '']);
        const partial = mount({ value: '12', count: 6 });
        expect(partial.container.querySelectorAll('input')).toHaveLength(6);
    });

    it('onChange：输入第一位', async () => {
        const onChange = vi.fn<Notify>();
        mountFocused({ onChange });
        await userEvent.keyboard('1');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('1');
    });

    it('onComplete：填满时发出整串，未填满不发出', async () => {
        const onComplete = vi.fn<Notify>();
        mountFocused({ count: 3, onComplete });
        await userEvent.keyboard('12');
        expect(onComplete).not.toHaveBeenCalled();
        await userEvent.keyboard('3');
        await waitFor(() => expect(onComplete).toHaveBeenCalledWith('123'));
        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(getValues()).toEqual(['1', '2', '3']);
    });

    it('disabled 与 size', () => {
        const disabled = mount({ disabled: true });
        getInputs().forEach((input) => expect(input).toBeDisabled());
        disabled.unmount();
        for (const size of ['small', 'large'] as const) {
            const view = mount({ size });
            getInputs().forEach((input) => expect(input).toHaveClass(`${BASE_CLASS_PREFIX}-input-${size}`));
            view.unmount();
        }
    });

    it('默认不获取焦点，autofocus 让第一个输入框获得焦点', () => {
        const plain = mount();
        expect(document.body).toHaveFocus();
        plain.unmount();
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        mount({ autofocus: true });
        expect(focus.mock.contexts).toContain(getInputs()[0]);
    });

    it('format 为 text 时任意字符都收，inputmode 为 text；number 时为 numeric', async () => {
        const onChange = vi.fn<Notify>();
        const text = mountFocused({ format: (() => true) as PinCodeProps['format'], onChange });
        await userEvent.keyboard('a');
        expect(onChange).toHaveBeenCalledWith('a');
        expect(getInputs()[0]).toHaveValue('a');
        getInputs().forEach((input) => expect(input).toHaveAttribute('inputmode', 'text'));
        text.unmount();
        mount({ format: 'number' });
        getInputs().forEach((input) => expect(input).toHaveAttribute('inputmode', 'numeric'));
    });

    it('format 为 mixed、RegExp、函数时校验每个字符', async () => {
        const mixed = vi.fn<Notify>();
        const first = mountFocused({ format: 'mixed', onChange: mixed });
        await userEvent.keyboard('-');
        expect(mixed).not.toHaveBeenCalled();
        await userEvent.keyboard('a1');
        expect(mixed).toHaveBeenLastCalledWith('a1');
        first.unmount();

        const regexp = vi.fn<Notify>();
        const second = mountFocused({ format: /^[a-z]$/, onChange: regexp });
        await userEvent.keyboard('1');
        expect(regexp).not.toHaveBeenCalled();
        await userEvent.keyboard('a');
        expect(regexp).toHaveBeenCalledWith('a');
        second.unmount();

        const format = vi.fn<(value: string) => boolean>((value) => /^[0-9]$/.test(value));
        const onChange = vi.fn<Notify>();
        mountFocused({ format, onChange });
        await userEvent.keyboard('a');
        expect(format).toHaveBeenCalledWith('a');
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.keyboard('7');
        expect(onChange).toHaveBeenCalledWith('7');
    });

    it('带 g 标志的正则逐字符校验结果不随调用次数变化', async () => {
        mountFocused({ count: 4, format: /\d/g });
        await userEvent.keyboard('1234');
        await waitFor(() => expect(getValues()).toEqual(['1', '2', '3', '4']));
    });

    it('输入后自动跳到下一格；number 格式下的非法字符被忽略，焦点不动', async () => {
        const onChange = vi.fn<Notify>();
        mount({ onChange });
        await userEvent.type(getInputs()[0], '5');
        expect(onChange).toHaveBeenCalledWith('5');
        expect(getInputs()[0]).toHaveValue('5');
        await waitFor(() => expect(getInputs()[1]).toHaveFocus());
        onChange.mockClear();
        await userEvent.keyboard('a');
        expect(onChange).not.toHaveBeenCalled();
        await waitFor(() => expect(getInputs()[1]).toHaveValue(''));
        expect(getInputs()[1]).toHaveFocus();
    });

    it('在空的第 3 格输入，字符落在第一个空格', async () => {
        const store = setupModes('bind', '', true, { count: 4 });
        await userEvent.click(getInputs()[2]);
        await userEvent.keyboard('5');
        await waitFor(() => expect(getValues()).toEqual(['5', '', '', '']));
        await waitFor(() => expect(getInputs()[1]).toHaveFocus());
        expect(store.value).toBe('5');
    });

    it('先填最后一格不发出 onComplete', async () => {
        const onComplete = vi.fn<Notify>();
        mount({ count: 4, onComplete });
        await userEvent.click(getInputs()[3]);
        await userEvent.keyboard('8');
        await waitFor(() => expect(getValues()).toEqual(['8', '', '', '']));
        expect(onComplete).not.toHaveBeenCalled();
    });

    it('聚焦与失焦切换格子的焦点样式', async () => {
        mount({ value: '123' });
        const input = getInputs()[1];
        await userEvent.click(input);
        expect(input).toHaveFocus();
        expect(input.parentElement).toHaveClass(inputFocusCls);
        input.blur();
        flushSync();
        expect(input.parentElement).not.toHaveClass(inputFocusCls);
        expect(getValues()).toEqual(['1', '2', '3', '', '', '']);
    });

    it('Backspace 清除当前字符、后面的字符前移，焦点向前移动', async () => {
        const onChange = vi.fn<Notify>();
        mount({ value: '123', onChange });
        await userEvent.click(getInputs()[1]);
        await userEvent.keyboard('{Backspace}');
        expect(onChange).toHaveBeenLastCalledWith('13');
        await waitFor(() => expect(getValues()).toEqual(['1', '3', '', '', '', '']));
        expect(getInputs()[0]).toHaveFocus();
    });

    it('Backspace 在空格子上回到上一格；在第一格上留在原处', async () => {
        mount({ count: 4 });
        await userEvent.click(getInputs()[1]);
        await userEvent.keyboard('{Backspace}');
        expect(getInputs()[0]).toHaveFocus();
        expect(getValues()).toEqual(['', '', '', '']);
        await userEvent.keyboard('{Backspace}');
        expect(getInputs()[0]).toHaveFocus();
    });

    it('Backspace 清空最后已填的格子并向前移动', async () => {
        const onChange = vi.fn<Notify>();
        mount({ value: '123', onChange });
        await userEvent.click(getInputs()[2]);
        await userEvent.keyboard('{Backspace}');
        await waitFor(() => expect(getValues()).toEqual(['1', '2', '', '', '', '']));
        expect(onChange).toHaveBeenLastCalledWith('12');
        expect(getInputs()[1]).toHaveFocus();
    });

    it('Delete 删除当前字符、焦点留在原格', async () => {
        const onChange = vi.fn<Notify>();
        mount({ value: '123456', onChange });
        await userEvent.click(getInputs()[2]);
        await userEvent.keyboard('{Delete}');
        await waitFor(() => expect(getValues()).toEqual(['1', '2', '4', '5', '6', '']));
        expect(onChange).toHaveBeenCalledWith('12456');
        expect(getInputs()[2]).toHaveFocus();
    });

    it('输入框被清空时（剪切、虚拟键盘删除）移除该字符，焦点留在原格', async () => {
        const onChange = vi.fn<Notify>();
        mount({ value: '12', count: 4, onChange });
        const [first] = getInputs();
        await userEvent.click(first);
        await fireEvent.input(first, { target: { value: '' } });
        await waitFor(() => expect(getValues()).toEqual(['2', '', '', '']));
        expect(onChange).toHaveBeenLastCalledWith('2');
        expect(first).toHaveFocus();
    });

    it('ArrowLeft、ArrowRight 在格子间移动，两端不越界', async () => {
        mount({ value: '123456' });
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

    it('值较短时 ArrowRight 也能移动到最后一个输入框', async () => {
        mount({ value: '12', count: 4 });
        await userEvent.click(getInputs()[1]);
        await userEvent.keyboard('{ArrowRight}');
        expect(getInputs()[2]).toHaveFocus();
        await userEvent.keyboard('{ArrowRight}');
        expect(getInputs()[3]).toHaveFocus();
    });

    it.each(['altKey', 'ctrlKey', 'metaKey'])('带 %s 的方向键是浏览器快捷键，不移动焦点也不阻止默认行为', (modifier) => {
        mount({ count: 3, value: '12' });
        const cell = getInputs()[1];
        cell.focus();
        for (const key of ['ArrowLeft', 'ArrowRight']) {
            const event = new KeyboardEvent('keydown', { key, [modifier]: true, bubbles: true, cancelable: true });
            cell.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(false);
        }
        flushSync();
        expect(cell).toHaveFocus();
    });

    it('粘贴：按格填入，从当前格开始，遇到非法字符停止', async () => {
        const onChange = vi.fn<Notify>();
        const onComplete = vi.fn<Notify>();
        mountFocused({ count: 4, onChange, onComplete });
        await userEvent.paste('12a4');
        await waitFor(() => expect(getValues()).toEqual(['1', '2', '', '']));
        expect(onChange).toHaveBeenLastCalledWith('12');
        expect(onComplete).not.toHaveBeenCalled();
        await waitFor(() => expect(getInputs()[2]).toHaveFocus());
    });

    it('粘贴填满时发出 onComplete；混合与 text 格式按字符填入', async () => {
        const onComplete = vi.fn<Notify>();
        const full = mountFocused({ count: 4, onComplete });
        await userEvent.paste('1234');
        await waitFor(() => expect(onComplete).toHaveBeenCalledWith('1234'));
        expect(getValues()).toEqual(['1', '2', '3', '4']);
        full.unmount();

        const mixed = mountFocused({ format: 'mixed' });
        await userEvent.paste('abc123');
        await waitFor(() => expect(getValues()).toEqual(['a', 'b', 'c', '1', '2', '3']));
        mixed.unmount();

        mountFocused({ format: (() => true) as PinCodeProps['format'] });
        await userEvent.paste('abcdef');
        await waitFor(() => expect(getValues()).toEqual(['a', 'b', 'c', 'd', 'e', 'f']));
    });

    it('空的粘贴数据不改值', async () => {
        const onChange = vi.fn<Notify>();
        mountFocused({ onChange });
        await userEvent.paste('');
        expect(onChange).not.toHaveBeenCalled();
        expect(getValues()).toEqual(['', '', '', '', '', '']);
        expect(getInputs()[0]).toHaveFocus();
    });

    it('从中间格开始粘贴不完整数据，焦点停在下一个空格', async () => {
        mount({ count: 6 });
        await userEvent.click(getInputs()[2]);
        await userEvent.paste('12');
        await waitFor(() => expect(getValues()).toEqual(['1', '2', '', '', '', '']));
        await waitFor(() => expect(getInputs()[2]).toHaveFocus());
    });

    it('粘贴与键入非 BMP 字符按完整字符填入', async () => {
        const format = (value: string) => value.length > 0 && Array.from(value).length === 1;
        const paste = mountFocused({ count: 3, format });
        await userEvent.paste('😀😁');
        await waitFor(() => expect(getValues()).toEqual(['😀', '😁', '']));
        paste.unmount();

        mountFocused({ count: 3, format });
        await fireEvent.input(getInputs()[0], { target: { value: '😀' } });
        await waitFor(() => expect(getValues()).toEqual(['😀', '', '']));
    });

    it('value 含非 BMP 字符时按完整字符拆分', async () => {
        const { store } = mount({ value: '😀a', count: 3 });
        expect(getValues()).toEqual(['😀', 'a', '']);
        store.props.value = 'b😁';
        flushSync();
        await waitFor(() => expect(getValues()).toEqual(['b', '😁', '']));
    });

    it('输入法组合结束时按提交的字符处理一次', async () => {
        const onChange = vi.fn<Notify>();
        mount({ count: 3, format: 'mixed', onChange });
        const [first] = getInputs();
        first.focus();
        await fireEvent.compositionStart(first);
        await fireEvent.input(first, { target: { value: 'a' } });
        expect(onChange).not.toHaveBeenCalled();
        await fireEvent(first, new CompositionEvent('compositionend', { bubbles: true, data: 'a' }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('a');
        await waitFor(() => expect(getValues()).toEqual(['a', '', '']));
    });

    it('句柄：focus(index) 把光标放在字符之后，blur(index) 释放焦点，越界时无操作', () => {
        const { handle } = mount({ value: '12', count: 3 });
        const exposed = handle.current as { focus: (index: number) => void; blur: (index: number) => void };
        exposed.focus(1);
        expect(getInputs()[1]).toHaveFocus();
        expect(getInputs()[1].selectionStart).toBe(1);
        expect(() => exposed.focus(5)).not.toThrow();
        expect(() => exposed.blur(5)).not.toThrow();
        expect(getInputs()[1]).toHaveFocus();
        exposed.blur(1);
        expect(getInputs()[1]).not.toHaveFocus();
    });

    it('onFocus 在进入整个验证码时发出一次，onBlur 在离开时发出一次', async () => {
        const onFocus = vi.fn<(event: FocusEvent) => void>();
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        mount({ count: 3, onFocus, onBlur });
        const outside = document.createElement('button');
        document.body.append(outside);
        await userEvent.tab();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
        await userEvent.tab();
        await userEvent.tab();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
        await userEvent.tab();
        expect(outside).toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
        outside.remove();
    });

    it('禁用的输入框不接受键盘输入', async () => {
        const onChange = vi.fn<Notify>();
        mount({ disabled: true, onChange });
        await userEvent.type(getInputs()[0], '1');
        expect(onChange).not.toHaveBeenCalled();
        expect(getValues()).toEqual(['', '', '', '', '', '']);
    });

    it('count 变小时渲染更少的输入框，焦点在被移除的格子上时不抛错', async () => {
        const { store } = mount({ count: 6 });
        await userEvent.click(getInputs()[5]);
        store.props.count = 3;
        flushSync();
        expect(getInputs()).toHaveLength(3);
        await userEvent.click(getInputs()[2]);
        await userEvent.keyboard('{ArrowRight}');
        expect(getInputs()[2]).toHaveFocus();
    });

    it('全局默认值：count、autofocus、format、disabled、size，自身值优先', () => {
        semiGlobal.config.overrideDefaultProps = { PinCode: { count: 4, format: 'mixed', disabled: true, size: 'small' } };
        const first = mount();
        expect(getInputs()).toHaveLength(4);
        getInputs().forEach((input) => {
            expect(input).toBeDisabled();
            expect(input).toHaveClass(`${BASE_CLASS_PREFIX}-input-small`);
            expect(input).toHaveAttribute('inputmode', 'text');
        });
        first.unmount();
        mount({ count: 2, disabled: false, format: 'number' });
        expect(getInputs()).toHaveLength(2);
        getInputs().forEach((input) => {
            expect(input).not.toBeDisabled();
            expect(input).toHaveAttribute('inputmode', 'numeric');
        });
    });

    it('全局 Input 默认值不给格子加清除按钮', () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true } };
        const view = mount({ count: 2, value: '12' });
        expect(view.container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
    });

    describe('可访问名称与属性落点', () => {
        it('group 由调用方命名，每个输入框按位置命名', () => {
            mount({ count: 3, 'aria-label': 'Verification code' } as PinCodeProps);
            expect(screen.getByRole('group', { name: 'Verification code' })).toBe(getWrapper());
            expect(getInputs().map((input) => input.getAttribute('aria-label'))).toEqual(['第 1 位，共 3 位', '第 2 位，共 3 位', '第 3 位，共 3 位']);
            getInputs().forEach((input) => expect(input).not.toHaveAttribute('aria-labelledby'));
        });

        it('位置名称跟随 LocaleProvider 的语言，group 的名称不被覆盖', () => {
            const store = createStore({ props: { count: 2, 'aria-label': 'Verification code' } as PinCodeProps });
            render(LocaleHost, { props: { locale: ja_JP, store } });
            const expected = ja_JP.PinCode.digit.replace('${index}', '1').replace('${count}', '2');
            expect(screen.getByRole('textbox', { name: expected })).toBeInTheDocument();
            expect(screen.getByRole('group', { name: 'Verification code' })).toBe(getWrapper());
        });

        it('位置名称读取所选语言', () => {
            const store = createStore({ props: { count: 2 } as PinCodeProps });
            render(LocaleHost, { props: { locale: en_US, store } });
            expect(screen.getByRole('textbox', { name: 'Digit 1 of 2' })).toBeInTheDocument();
        });

        it('每个输入框保留描述性状态', () => {
            mount({ count: 2, 'aria-describedby': 'hint', 'aria-invalid': 'true' } as PinCodeProps);
            getInputs().forEach((input) => {
                expect(input).toHaveAttribute('aria-describedby', 'hint');
                expect(input).toHaveAttribute('aria-invalid', 'true');
            });
        });

        it('未声明的属性落在 group，描述与状态给每个输入框，Form 注入的属性不进 DOM', () => {
            mount({
                count: 2,
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
            } as PinCodeProps);
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

        it('validateStatus 传给每个输入框', () => {
            const { store } = mount({ count: 3, validateStatus: 'error' });
            getInputs().forEach((input) => {
                expect(input).toHaveAttribute('aria-invalid', 'true');
                expect(input.closest(`.${BASE_CLASS_PREFIX}-input-wrapper`)).toHaveClass(`${BASE_CLASS_PREFIX}-input-wrapper-error`);
            });
            store.props.validateStatus = undefined;
            flushSync();
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
            await userEvent.tab();
            expect(getInputs()[1]).toHaveFocus();
            await userEvent.tab();
            expect(document.body).toHaveFocus();
        });
    });
});
