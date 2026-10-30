import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { numbers } from '@fibrae/semi-foundation/input-number/constants';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import InputNumber from '../input-number.svelte';
import type { InputNumberChangeEvent, InputNumberProps } from '../interface';
import InputNumberFixture from './input-number-fixture.svelte';
import InGroup from './input-number-in-group.svelte';
import InputNumberModes from './input-number-modes.svelte';

type Change = (value: number | string, event: InputNumberChangeEvent) => void;
type NumberChange = (value: number, event: InputNumberChangeEvent) => void;
type Click = (value: string, event: PointerEvent) => void;
type FocusHandler = (event: FocusEvent) => void;
type KeyHandler = (event: KeyboardEvent) => void;

const prefixCls = `${BASE_CLASS_PREFIX}-input`;

const getInput = () => screen.getByRole<HTMLInputElement>('spinbutton');
const getButtons = () => document.querySelector(`.${prefixCls}-number-suffix-btns`);
const getUpButton = () => document.querySelector(`.${prefixCls}-number-suffix-btns .${prefixCls}-number-button-up`) as HTMLElement;
const getDownButton = () => document.querySelector(`.${prefixCls}-number-suffix-btns .${prefixCls}-number-button-down`) as HTMLElement;
const getWrapper = () => document.querySelector(`.${prefixCls}-number`) as HTMLElement;

function mount(props: InputNumberProps = {}, slots = false) {
    const store = createStore<{ props: InputNumberProps; slots: boolean }>({ props, slots });
    const handle: { current?: unknown } = {};
    const view = render(InputNumberFixture, { props: { store, onHandle: (value: unknown) => (handle.current = value) } });
    flushSync();
    return { ...view, store, handle };
}

async function hold(button: Element, init: PointerEventInit = { button: numbers.MOUSE_BUTTON_LEFT }) {
    await fireEvent.pointerDown(button, init);
    flushSync();
}
// the button captures the pointer, so the browser fires lostpointercapture on it after pointerup wherever that lands
async function release(button: Element) {
    await fireEvent.pointerUp(button);
    await fireEvent.lostPointerCapture(button);
    flushSync();
}
async function press(button: Element, init?: PointerEventInit) {
    await hold(button, init);
    await release(button);
}
async function pressTimes(getButton: () => Element, count: number) {
    for (let i = 0; i < count; i++) {
        await press(getButton());
    }
}
async function typeText(value: string) {
    await fireEvent.input(getInput(), { target: { value } });
    flushSync();
}
async function keyDown(key: string, init: KeyboardEventInit = {}) {
    await fireEvent.keyDown(getInput(), { key, ...init });
    flushSync();
}
// fireEvent resolves to whether the default action runs, the thing a caret-moving key must keep
async function dispatchKey(key: string, input: HTMLElement = getInput()) {
    const notPrevented = input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    flushSync();
    return notPrevented;
}
function focusInput() {
    getInput().focus();
    flushSync();
}
function blurInput() {
    getInput().blur();
    flushSync();
}
function advance(ms: number) {
    vi.advanceTimersByTime(ms);
    flushSync();
}
const lastArg = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls[spy.mock.calls.length - 1][0];

function setupModes(mode: 'bind' | 'function' | 'one-way' | 'uncontrolled', value?: number | string, accept = true, props: InputNumberProps = {}) {
    const store = createStore<{ value: number | string | undefined; accept: boolean; log: string[] }>({ value, accept, log: [] });
    render(InputNumberModes, { props: { mode, store, props } });
    return { store, input: getInput() };
}

describe('Svelte InputNumber 受控值（$bindable）', () => {
    it('非受控：输入与步进后文本跟随，onChange 收到数字', async () => {
        const { store, input } = setupModes('uncontrolled');
        expect(input).toHaveValue('');
        await typeText('12');
        expect(input).toHaveValue('12');
        await press(getUpButton());
        expect(input).toHaveValue('13');
        expect(store.log).toEqual(['change 12', 'change 13']);
    });

    it('非受控：父级无值时不进入受控，输入中间态原样保留', async () => {
        const { input } = setupModes('uncontrolled');
        await typeText('1.');
        expect(input).toHaveValue('1.');
        await typeText('1.5');
        expect(input).toHaveValue('1.5');
        await keyDown('ArrowUp');
        expect(input).toHaveValue('2.5');
    });

    it('bind:value：输入写回父级，父级改值同步到文本，重置为 undefined 清空', async () => {
        const { store, input } = setupModes('bind', 5);
        expect(input).toHaveValue('5');
        await typeText('7');
        expect(store.value).toBe(7);
        await press(getUpButton());
        expect(store.value).toBe(8);
        expect(input).toHaveValue('8');
        store.value = 20;
        flushSync();
        expect(input).toHaveValue('20');
        store.value = undefined;
        flushSync();
        expect(input).toHaveValue('');
        expect(input).not.toHaveAttribute('aria-valuenow');
    });

    it('bind:value 起始为 undefined：写回后父级再改值仍同步，重置后可再设同一个值', async () => {
        const { store, input } = setupModes('bind');
        await typeText('9');
        expect(store.value).toBe(9);
        store.value = 4;
        flushSync();
        expect(input).toHaveValue('4');
        store.value = undefined;
        flushSync();
        expect(input).toHaveValue('');
        store.value = 4;
        flushSync();
        expect(input).toHaveValue('4');
        await press(getUpButton());
        expect(store.value).toBe(5);
        expect(input).toHaveValue('5');
    });

    it('函数绑定：setter 拒绝时输入只通知，失焦后文本恢复，步进不改值', async () => {
        const { store, input } = setupModes('function', 5, false);
        focusInput();
        await typeText('7');
        expect(store.log).toEqual(['set 7', 'change 7']);
        expect(store.value).toBe(5);
        blurInput();
        expect(input).toHaveValue('5');
        await press(getUpButton());
        expect(store.value).toBe(5);
        expect(input).toHaveValue('5');
        expect(input).toHaveAttribute('aria-valuenow', '5');
    });

    it('函数绑定：setter 接受时组件跟随', async () => {
        const { store, input } = setupModes('function', 5, true);
        await press(getUpButton());
        expect(store.value).toBe(6);
        expect(input).toHaveValue('6');
    });

    it('单向传值：交互在本地覆盖，父级值不变；父级再推值时以父级为准', async () => {
        const { store, input } = setupModes('one-way', 5);
        await press(getUpButton());
        expect(store.value).toBe(5);
        expect(input).toHaveValue('6');
        store.value = 30;
        flushSync();
        expect(input).toHaveValue('30');
    });

    it('单向传值：父级不写回时，输入保留，失焦后按输入值格式化', async () => {
        const { input } = setupModes('one-way', 1020);
        focusInput();
        await typeText('1301');
        blurInput();
        expect(input).toHaveValue('1301');
    });
});

describe('Svelte InputNumber', () => {
    afterEach(() => {
        vi.useRealTimers();
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('size、showClear、hideButtons 与句柄', () => {
        for (const size of ['default', 'large', 'small'] as const) {
            const { unmount } = mount({ value: 1020, showClear: true, size });
            expect(getInput()).toHaveClass(`${prefixCls}-${size}`);
            expect(getInput()).toHaveValue('1020');
            expect(getButtons()).not.toBeNull();
            expect(getWrapper()).toHaveClass(`${prefixCls}-number-size-${size}`);
            unmount();
        }
        const withoutButtons = mount({ value: 1, hideButtons: true });
        expect(getButtons()).toBeNull();
        withoutButtons.unmount();

        const { handle } = mount({ value: 1 });
        const exposed = handle.current as { getInput: () => HTMLInputElement | undefined; getNativeElement: () => HTMLElement | undefined };
        expect(exposed.getInput()).toBe(getInput());
        expect(exposed.getNativeElement()).toBe(getWrapper());
    });

    it('句柄的 focus、blur、select、setSelectionRange 作用于原生 input', () => {
        const { handle } = mount({ value: 12345 });
        const exposed = handle.current as { focus: (options?: FocusOptions) => void; blur: () => void; select: () => void; setSelectionRange: (start: number, end: number) => void };
        exposed.focus();
        flushSync();
        expect(getInput()).toHaveFocus();
        expect(document.querySelector(`.${prefixCls}-wrapper-focus`)).not.toBeNull();
        exposed.select();
        expect([getInput().selectionStart, getInput().selectionEnd]).toEqual([0, 5]);
        exposed.setSelectionRange(1, 2);
        expect([getInput().selectionStart, getInput().selectionEnd]).toEqual([1, 2]);
        exposed.blur();
        expect(getInput()).not.toHaveFocus();
    });

    it('value 与 blur、change、focus、keydown 回调', async () => {
        const onChange = vi.fn<Change>();
        const onBlur = vi.fn<FocusHandler>();
        const onFocus = vi.fn<FocusHandler>();
        const onKeyDown = vi.fn<KeyHandler>();
        const { store } = mount({ value: 1020, onChange, onBlur, onFocus, onKeyDown });
        expect(onChange).not.toHaveBeenCalled();

        await typeText('1301fd');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('1301fd', expect.anything());

        focusInput();
        expect(onFocus).toHaveBeenCalledTimes(1);
        store.props.value = '';
        flushSync();
        expect(getInput()).toHaveValue('');

        store.props.value = 1301;
        flushSync();
        blurInput();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('1301');

        onChange.mockClear();
        await keyDown('ArrowUp');
        await keyDown('ArrowUp');
        await keyDown('ArrowUp');
        expect(lastArg(onChange)).toBe(1304);
        await keyDown('ArrowDown');
        expect(lastArg(onChange)).toBe(1303);
        expect(onKeyDown).toHaveBeenCalledTimes(4);
        expect(getInput()).toHaveValue('1303');
    });

    it('max、min、precision、parser、formatter', async () => {
        const min = 1000;
        const max = 1300;
        const precision = 2;
        const formatter = (value: number | string) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        const parser = (value: string) => value.replace(/\$\s?|(,*)/g, '');
        const onChange = vi.fn<Change>();
        const { store } = mount({ value: 1020.245, onChange, min, max, precision, formatter, parser });
        expect(getInput()).toHaveValue(formatter((1020.245).toFixed(precision)));

        await typeText('1302.921');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toEqual(1302.92);

        store.props.value = 1302.921;
        flushSync();
        const changes = onChange.mock.calls.length;
        store.props.value = min - 100;
        flushSync();
        expect(getInput()).toHaveValue(formatter((min - 100).toFixed(precision)));
        expect(onChange).toHaveBeenCalledTimes(changes);
    });

    it('值被精度改写时只改显示，不发出 onNumberChange', () => {
        const onNumberChange = vi.fn<NumberChange>();
        const { store } = mount({ value: 1, precision: 1, onNumberChange });
        store.props.value = 2.26;
        flushSync();
        expect(getInput()).toHaveValue('2.3');
        expect(onNumberChange).not.toHaveBeenCalled();
    });

    it('点击加减按钮，发出 onUpClick、onDownClick', async () => {
        const onUpClick = vi.fn<Click>();
        const onDownClick = vi.fn<Click>();
        mount({ value: 1000, onUpClick, onDownClick });
        await pressTimes(getUpButton, 3);
        await pressTimes(getDownButton, 1);
        expect(getInput()).toHaveValue('1002');
        expect(onUpClick).toHaveBeenCalledTimes(3);
        expect(onUpClick).toHaveBeenLastCalledWith('1003', expect.any(PointerEvent));
        expect(onDownClick).toHaveBeenCalledTimes(1);
        expect(onDownClick).toHaveBeenLastCalledWith('1002', expect.any(PointerEvent));
    });

    it('点击内置加减按钮，悬停后出现并步进', async () => {
        const onUpClick = vi.fn<Click>();
        mount({ value: 1, innerButtons: true, onUpClick });
        expect(getButtons()).toBeNull();
        await fireEvent.mouseEnter(getWrapper());
        flushSync();
        expect(getButtons()).toHaveClass(`${prefixCls}-number-suffix-btns-inner-hover`);
        expect(getButtons()?.querySelectorAll(`.${prefixCls}-number-button`)).toHaveLength(2);
        await press(getUpButton());
        expect(getInput()).toHaveValue('2');
        expect(onUpClick).toHaveBeenCalledTimes(1);
        await fireEvent.mouseLeave(getWrapper());
        flushSync();
        expect(getButtons()).toBeNull();
    });

    it('mousemove 进入悬停，聚焦后不再显示悬停样式', async () => {
        mount({ value: 1, innerButtons: true });
        await fireEvent.mouseMove(getWrapper());
        flushSync();
        expect(getButtons()).toHaveClass(`${prefixCls}-number-suffix-btns-inner-hover`);
        focusInput();
        expect(getButtons()).not.toHaveClass(`${prefixCls}-number-suffix-btns-inner-hover`);
    });

    it('hideButtons 与 innerButtons 同时设置时没有按钮', async () => {
        mount({ value: 1, hideButtons: true, innerButtons: true });
        await fireEvent.mouseEnter(getWrapper());
        focusInput();
        expect(getButtons()).toBeNull();
    });

    it('innerButtons 悬停时按钮替换 suffix，移出后恢复', async () => {
        mount({ value: 1, innerButtons: true }, true);
        expect(document.querySelector(`.${prefixCls}-suffix`)).toHaveTextContent('USD');
        await fireEvent.mouseEnter(getWrapper());
        flushSync();
        expect(document.querySelector(`.${prefixCls}-suffix`)).not.toHaveTextContent('USD');
        expect(getButtons()).not.toBeNull();
        await fireEvent.mouseLeave(getWrapper());
        flushSync();
        expect(document.querySelector(`.${prefixCls}-suffix`)).toHaveTextContent('USD');
    });

    it('shiftStep：Shift 加方向键与 Shift 点击按钮按 shiftStep 步进', async () => {
        const { store } = mount({ value: 0, shiftStep: 100 });
        await keyDown('ArrowUp', { shiftKey: true });
        expect(getInput()).toHaveValue('100');
        await keyDown('ArrowUp');
        expect(getInput()).toHaveValue('101');
        store.props.shiftStep = 5;
        flushSync();
        await keyDown('ArrowDown', { shiftKey: true });
        expect(getInput()).toHaveValue('96');
        await press(getUpButton(), { button: numbers.MOUSE_BUTTON_LEFT, shiftKey: true });
        expect(getInput()).toHaveValue('101');
    });

    it('焦点在输入框与步进按钮之间移动时 onFocus 与 onBlur 不重复触发', async () => {
        const onBlur = vi.fn<FocusHandler>();
        const onFocus = vi.fn<FocusHandler>();
        mount({ value: 1, onBlur, onFocus });
        focusInput();
        expect(onFocus).toHaveBeenCalledTimes(1);
        await pressTimes(getUpButton, 2);
        await pressTimes(getDownButton, 1);
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
        blurInput();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('输入越界值：onChange 报告原值，onNumberChange 不发出', async () => {
        const onChange = vi.fn<Change>();
        const onNumberChange = vi.fn<NumberChange>();
        mount({ max: 100, value: 100, onChange, onNumberChange });
        await typeText('101');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(101, expect.anything());
        expect(onNumberChange).not.toHaveBeenCalled();
    });

    it('值为 NaN 时显示为空且没有 aria-valuenow', () => {
        const { store } = mount({ value: 1 });
        expect(getInput()).toHaveValue('1');
        expect(getInput()).toHaveAttribute('aria-valuenow', '1');
        store.props.value = Number.NaN;
        flushSync();
        expect(getInput()).toHaveValue('');
        expect(getInput()).not.toHaveAttribute('aria-valuenow');
    });

    it('挂载时值为 NaN，货币模式同样显示为空', () => {
        const plain = mount({ value: Number.NaN });
        expect(getInput()).toHaveValue('');
        expect(getInput()).not.toHaveAttribute('aria-valuenow');
        plain.unmount();
        mount({ value: Number.NaN, currency: 'CNY' });
        expect(getInput()).toHaveValue('');
    });

    it('aria-valuenow 为普通十进制数，包括 0', () => {
        const { store } = mount({ value: 0 });
        expect(getInput()).toHaveAttribute('aria-valuenow', '0');
        store.props.value = 1.235e-7;
        flushSync();
        expect(getInput()).toHaveAttribute('aria-valuenow', '0.0000001235');
    });

    it('没有边界时不输出 aria-valuemin 与 aria-valuemax，设置后输出', () => {
        const none = mount({ value: 1 });
        expect(getInput()).not.toHaveAttribute('aria-valuemin');
        expect(getInput()).not.toHaveAttribute('aria-valuemax');
        none.unmount();
        mount({ value: 1, min: 0, max: 10 });
        expect(getInput()).toHaveAttribute('aria-valuemin', '0');
        expect(getInput()).toHaveAttribute('aria-valuemax', '10');
    });

    it.each([
        ['min', { min: 1, value: 0 }, '0', 1],
        ['max', { max: 10, value: 50 }, '50', 10],
    ] as Array<[string, InputNumberProps, string, number]>)('%s 越界：挂载显示原值且不发出事件，失焦校正并只发出一次', (_, props, shown, clamped) => {
        const onChange = vi.fn<Change>();
        const onNumberChange = vi.fn<NumberChange>();
        mount({ ...props, onChange, onNumberChange });
        expect(getInput()).toHaveValue(shown);
        expect(getInput()).toHaveAttribute('aria-valuenow', shown);
        expect(onChange).not.toHaveBeenCalled();
        expect(onNumberChange).not.toHaveBeenCalled();
        focusInput();
        blurInput();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe(clamped);
        expect(onNumberChange).toHaveBeenCalledTimes(1);
    });

    it('值变为越界值时显示原值，不发出事件', () => {
        const onChange = vi.fn<Change>();
        const { store } = mount({ min: 1, value: 5, onChange });
        store.props.value = 0;
        flushSync();
        expect(getInput()).toHaveValue('0');
        expect(getInput()).toHaveAttribute('aria-valuenow', '0');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('输入的值在失焦时夹紧到 min 与 max，按钮在边界处停止', async () => {
        mount({ value: 5, min: 0, max: 10 });
        focusInput();
        await typeText('99');
        blurInput();
        expect(getInput()).toHaveValue('10');
        expect(getUpButton()).toHaveClass(`${prefixCls}-number-button-up-not-allowed`);
        await press(getUpButton());
        expect(getInput()).toHaveValue('10');
    });

    it('输入的值在失焦时按 precision 取整，并按解析后的数字报告', async () => {
        const onChange = vi.fn<Change>();
        const onNumberChange = vi.fn<NumberChange>();
        mount({ value: 1, precision: 1, onChange, onNumberChange });
        focusInput();
        await typeText('2.26');
        expect(lastArg(onChange)).toBe(2.3);
        blurInput();
        expect(getInput()).toHaveValue('2.3');
        expect(onNumberChange).toHaveBeenLastCalledWith(2.3, expect.anything());
    });

    it('常见货币显示', () => {
        const value = 123456.78;
        const cases: Array<[InputNumberProps, string]> = [
            [{ currency: 'CNY' }, '¥123,456.78'],
            [{ localeCode: 'en-US', currency: 'USD' }, '$123,456.78'],
            [{ localeCode: 'de-DE', currency: 'EUR' }, '123.456,78 €'],
            [{ localeCode: 'ja-JP', currency: 'JPY' }, '￥123,457'],
            [{ localeCode: 'vi-VN', currency: 'VND' }, '123.457 ₫'],
        ];
        for (const [props, expected] of cases) {
            const view = mount({ ...props, value });
            expect(getInput()).toHaveValue(expected);
            view.unmount();
        }
    });

    it('currency 为 true 时使用语言包的货币码；showCurrencySymbol 为 false 时不显示符号', () => {
        const withSymbol = mount({ value: 100, currency: true });
        expect(getInput()).toHaveValue('¥100.00');
        withSymbol.unmount();
        mount({ value: 100, currency: 'CNY', showCurrencySymbol: false });
        expect(getInput()).toHaveValue('100.00');
    });

    it('货币模式下步进，文本带货币格式', async () => {
        mount({ value: 123459.78, currency: 'USD', localeCode: 'en-US' });
        await pressTimes(getUpButton, 1);
        expect(getInput()).toHaveValue('$123,460.78');
        await pressTimes(getDownButton, 3);
        expect(getInput()).toHaveValue('$123,457.78');
    });

    it('disabled：输入框与按钮禁用，点击无效', async () => {
        const onChange = vi.fn<Change>();
        const onUpClick = vi.fn<Click>();
        mount({ value: 100, disabled: true, onChange, onUpClick });
        expect(getInput()).toBeDisabled();
        expect(document.querySelector(`.${prefixCls}-wrapper-disabled`)).not.toBeNull();
        expect(getUpButton()).toHaveClass(`${prefixCls}-number-button-up-disabled`);
        expect(getDownButton()).toHaveClass(`${prefixCls}-number-button-down-disabled`);
        await press(getUpButton());
        await press(getDownButton());
        expect(getInput()).toHaveValue('100');
        expect(onChange).not.toHaveBeenCalled();
        expect(onUpClick).not.toHaveBeenCalled();
    });

    it('readonly：按钮与方向键不改值，Home、End 仍移动光标，keydown 仍发出', async () => {
        const onChange = vi.fn<Change>();
        const onKeyDown = vi.fn<KeyHandler>();
        mount({ value: 10, max: 50, min: 2, readonly: true, onChange, onKeyDown });
        expect(getInput()).toHaveAttribute('readonly');
        await press(getUpButton());
        for (const key of ['ArrowUp', 'ArrowDown', 'Home', 'End']) {
            await keyDown(key);
        }
        expect(getInput()).toHaveValue('10');
        expect(onChange).not.toHaveBeenCalled();
        expect(onKeyDown).toHaveBeenCalledTimes(4);
        expect(await dispatchKey('Home')).toBe(true);
    });

    it('距边界不足一个 step 时，上键与按钮夹到边界', async () => {
        const upper = mount({ value: 9.5, max: 10, min: 0.5, step: 1 });
        await press(getUpButton());
        expect(getInput()).toHaveValue('10');
        expect(getUpButton()).toHaveClass(`${prefixCls}-number-button-up-not-allowed`);
        upper.unmount();
        mount({ value: 0.8, max: 10, min: 0.5, step: 1 });
        await keyDown('ArrowDown');
        expect(getInput()).toHaveValue('0.5');
        expect(getDownButton()).toHaveClass(`${prefixCls}-number-button-down-not-allowed`);
    });

    it('方向键步进，阻止默认的光标移动；其他按键正常传递', async () => {
        const onChange = vi.fn<Change>();
        mount({ value: 10, onChange });
        expect(await dispatchKey('ArrowUp')).toBe(false);
        expect(getInput()).toHaveValue('11');
        expect(onChange).toHaveBeenCalledWith(11, expect.any(KeyboardEvent));
        expect(await dispatchKey('ArrowDown')).toBe(false);
        expect(getInput()).toHaveValue('10');
        expect(await dispatchKey('a')).toBe(true);
    });

    it('Home 与 End 跳到 min 与 max，未设置边界时光标仍可移动', async () => {
        const onChange = vi.fn<Change>();
        mount({ value: 10, min: 2, onChange });
        expect(await dispatchKey('Home')).toBe(false);
        expect(getInput()).toHaveValue('2');
        expect(onChange).toHaveBeenCalledWith(2, expect.anything());
        expect(await dispatchKey('End')).toBe(true);
        expect(getInput()).toHaveValue('2');
    });

    it('step 影响加减步长并写到原生 input；小于 1e-6 的 step 能正确加减', async () => {
        const view = mount({ value: 10, step: 5 });
        await press(getUpButton());
        expect(getInput()).toHaveValue('15');
        await press(getDownButton());
        await press(getDownButton());
        expect(getInput()).toHaveValue('5');
        expect(getInput()).toHaveAttribute('step', '5');
        view.unmount();

        mount({ value: 0, step: 1e-8, precision: 8 });
        await press(getUpButton());
        expect(getInput()).toHaveValue('0.00000001');
        await press(getDownButton());
        expect(getInput()).toHaveValue('0.00000000');
    });

    it('validateStatus 的 warning 与 error 样式', () => {
        const warning = mount({ validateStatus: 'warning' });
        expect(document.querySelector(`.${prefixCls}-wrapper-warning`)).not.toBeNull();
        warning.unmount();
        mount({ validateStatus: 'error' });
        expect(document.querySelector(`.${prefixCls}-wrapper-error`)).not.toBeNull();
    });

    it('六个 snippet 都转发给 Input', () => {
        mount({ value: 100 }, true);
        expect(document.querySelector(`.${prefixCls}-prefix`)).toHaveTextContent('$');
        expect(document.querySelector(`.${prefixCls}-suffix`)).toHaveTextContent('USD');
        expect(document.querySelector(`.${prefixCls}-prepend`)).toHaveTextContent('before');
        expect(document.querySelector(`.${prefixCls}-append`)).toHaveTextContent('after');
    });

    it('键盘与按钮步进后 onNumberChange 收到数字', async () => {
        const onNumberChange = vi.fn<NumberChange>();
        mount({ value: 10, onNumberChange });
        await press(getUpButton());
        expect(onNumberChange).toHaveBeenCalledTimes(1);
        expect(onNumberChange).toHaveBeenCalledWith(11, expect.any(PointerEvent));
    });

    it('键盘在边界处值未变时不触发 onChange', async () => {
        const onChange = vi.fn<Change>();
        mount({ value: 10, max: 10, onChange });
        await keyDown('ArrowUp');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('清除按钮清空值', async () => {
        const onChange = vi.fn<Change>();
        mount({ value: 100, showClear: true, onChange });
        const clearBtn = document.querySelector(`.${prefixCls}-clearbtn`) as HTMLElement;
        expect(clearBtn).not.toBeNull();
        await fireEvent.mouseDown(clearBtn);
        flushSync();
        expect(getInput()).toHaveValue('');
        expect(onChange).toHaveBeenLastCalledWith('', expect.any(MouseEvent));
        expect(getInput()).not.toHaveAttribute('aria-valuenow');
    });

    it('删除精度值后输入非法字符，输入框保持为空', async () => {
        const onChange = vi.fn<Change>();
        mount({ value: 10, precision: 2, onChange });
        expect(getInput()).toHaveValue('10.00');
        focusInput();
        await typeText('');
        await typeText('aaa');
        blurInput();
        expect(getInput()).toHaveValue('');
        expect(onChange).not.toHaveBeenCalledWith(0, expect.anything());
    });

    it('步进后删除内容，不按精度重新格式化', async () => {
        mount({ value: 5.12, precision: 2 });
        await press(getUpButton());
        expect(getInput()).toHaveValue('6.12');
        focusInput();
        await typeText('6.1');
        expect(getInput()).toHaveValue('6.1');
        await typeText('6.');
        expect(getInput()).toHaveValue('6.');
    });

    it('formatter 与 parser：输入、失焦与步进都按它们换算', async () => {
        const minute = 60000;
        mount({
            value: minute,
            min: minute,
            step: minute,
            formatter: (value: number | string) => String(Number(`${value}`.replace(/\D/g, '')) / minute),
            parser: (value: string) => String(Number(`${value}`.replace(/\D/g, '')) * minute),
        });
        expect(getInput()).toHaveValue('1');
        for (const [button, text] of [
            [getUpButton, '2'],
            [getUpButton, '3'],
            [getDownButton, '2'],
            [getDownButton, '1'],
        ] as const) {
            await press(button());
            expect(getInput()).toHaveValue(text);
        }
    });

    it('长按：先步进一次，超时后按间隔连发，松开停止', async () => {
        vi.useFakeTimers();
        mount({ value: 0 });
        await hold(getUpButton());
        expect(getInput()).toHaveValue('1');
        advance(numbers.DEFAULT_PRESS_TIMEOUT * 2);
        expect(getInput()).toHaveValue('2');
        advance(numbers.DEFAULT_PRESS_TIMEOUT);
        expect(getInput()).toHaveValue('3');
        await release(getUpButton());
        advance(numbers.DEFAULT_PRESS_TIMEOUT * 4);
        expect(getInput()).toHaveValue('3');
    });

    it('长按遵循 pressTimeout 与 pressInterval', async () => {
        vi.useFakeTimers();
        const onChange = vi.fn<Change>();
        mount({ value: 0, pressInterval: 100, pressTimeout: 500, onChange });
        await hold(getUpButton());
        expect(getInput()).toHaveValue('1');
        advance(499);
        expect(getInput()).toHaveValue('1');
        advance(1);
        expect(getInput()).toHaveValue('1');
        advance(100);
        expect(getInput()).toHaveValue('2');
        advance(99);
        expect(getInput()).toHaveValue('2');
        advance(1);
        advance(100);
        expect(getInput()).toHaveValue('4');
        await release(getUpButton());
        advance(1000);
        expect(getInput()).toHaveValue('4');
        expect(onChange).toHaveBeenCalledTimes(4);
    });

    it('pressTimeout 为 0 时长按立即进入连发', async () => {
        vi.useFakeTimers();
        mount({ value: 0, pressTimeout: 0, pressInterval: 50 });
        await hold(getUpButton());
        expect(getInput()).toHaveValue('1');
        advance(50);
        expect(getInput()).toHaveValue('2');
        advance(50);
        expect(getInput()).toHaveValue('3');
        await release(getUpButton());
    });

    it('长按到 max 后停止连发，不再重复触发 onUpClick', async () => {
        vi.useFakeTimers();
        const onUpClick = vi.fn<Click>();
        mount({ value: 8, max: 10, pressInterval: 100, pressTimeout: 100, onUpClick });
        await hold(getUpButton());
        // a controlled value reaches the foundation after a flush, so each interval tick gets its own
        for (let tick = 0; tick < 10; tick++) {
            advance(100);
        }
        expect(getInput()).toHaveValue('10');
        expect(onUpClick).toHaveBeenCalledTimes(2);
        expect(vi.getTimerCount()).toBe(0);
        await release(getUpButton());
    });

    it('长按向最新的监听器报告', async () => {
        vi.useFakeTimers();
        const first = vi.fn<Change>();
        const second = vi.fn<Change>();
        const { store } = mount({ value: 0, onChange: first });
        await hold(getUpButton());
        expect(first).toHaveBeenCalledTimes(1);
        store.props.onChange = second;
        flushSync();
        advance(numbers.DEFAULT_PRESS_TIMEOUT * 2);
        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenLastCalledWith(2, expect.anything());
        await release(getUpButton());
    });

    it('长按过程中卸载会停止重复', async () => {
        vi.useFakeTimers();
        const onChange = vi.fn<Change>();
        const view = mount({ value: 0, onChange });
        await hold(getUpButton());
        view.unmount();
        vi.advanceTimersByTime(numbers.DEFAULT_PRESS_TIMEOUT * 5);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('长按过程中被禁用，连发立即停止', async () => {
        vi.useFakeTimers();
        const onChange = vi.fn<Change>();
        const { store } = mount({ value: 12, onChange });
        await hold(getUpButton());
        store.props.disabled = true;
        flushSync();
        advance(numbers.DEFAULT_PRESS_TIMEOUT * 4);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('13');
        await release(getUpButton());
    });

    it('长按过程中 change 禁用组件时停止重复', async () => {
        vi.useFakeTimers();
        const onChange = vi.fn<Change>();
        const store = createStore<{ props: InputNumberProps; slots: boolean }>({ props: { value: 12, innerButtons: true }, slots: false });
        store.props.onChange = (value, event) => {
            onChange(value, event);
            store.props.disabled = true;
        };
        render(InputNumberFixture, { props: { store } });
        await fireEvent.mouseEnter(getWrapper());
        flushSync();
        await hold(getUpButton());
        expect(getInput()).toBeDisabled();
        await release(getUpButton());
        advance(numbers.DEFAULT_PRESS_TIMEOUT * 4);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(13, expect.objectContaining({ type: 'pointerdown' }));
    });

    it('按下时指针被捕获到按下的那个按钮上；右键不步进', async () => {
        mount({ value: 0 });
        const up = getUpButton();
        const capture = vi.spyOn(up, 'setPointerCapture');
        await hold(up, { button: numbers.MOUSE_BUTTON_LEFT, pointerId: 7 });
        expect(capture).toHaveBeenCalledWith(7);
        await release(up);
        await press(up, { button: 2 });
        expect(getInput()).toHaveValue('1');
    });

    it('步进按钮的 mousedown 在 keepFocus 与 innerButtons 下被取消默认，普通按钮不取消', async () => {
        const plain = mount({ value: 0 });
        expect(await fireEvent.mouseDown(getUpButton())).toBe(true);
        plain.unmount();
        const kept = mount({ value: 0, keepFocus: true });
        expect(await fireEvent.mouseDown(getUpButton())).toBe(false);
        kept.unmount();
    });

    it('全局 overrideDefaultProps：step、hideButtons、showClear、formatter、parser，自身值优先', async () => {
        semiGlobal.config.overrideDefaultProps = { InputNumber: { step: 5, hideButtons: true } };
        const first = mount({ value: 1 });
        expect(getButtons()).toBeNull();
        await keyDown('ArrowUp');
        expect(getInput()).toHaveValue('6');
        first.unmount();
        mount({ value: 1, step: 2, hideButtons: false });
        expect(getButtons()).not.toBeNull();
        await keyDown('ArrowUp');
        expect(getInput()).toHaveValue('3');
    });

    it('全局 Input 默认值不作用于 InputNumber，InputNumber 自身的全局值照常生效', () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true } };
        const view = mount({ value: 1 });
        expect(view.container.querySelector(`.${prefixCls}-clearbtn`)).toBeNull();
        view.unmount();
        semiGlobal.config.overrideDefaultProps = { InputNumber: { showClear: true } };
        const host = mount({ value: 1 }).container;
        expect(host.querySelector(`.${prefixCls}-clearbtn`)).not.toBeNull();
    });

    it('全局默认值里的 insetLabelId 不影响 InputNumber', () => {
        // the global type leaves out per-instance ids; the cast stands for an untyped app that sets one anyway
        semiGlobal.config.overrideDefaultProps = { InputNumber: { insetLabelId: 'label-global' } } as object;
        mount({}, true);
        expect(document.getElementById('label-global')).toBeNull();
    });

    it('class 与 style 作用于数字外层容器，其余属性落到原生 input，role 可被覆盖', () => {
        mount({ value: 1, class: 'custom', style: 'width: 120px', 'aria-label': 'amount', id: 'amount', 'data-x': '1' } as InputNumberProps);
        const input = getInput();
        expect(input).toHaveAttribute('aria-label', 'amount');
        expect(input).toHaveAttribute('id', 'amount');
        expect(input).toHaveAttribute('data-x', '1');
        expect(getWrapper()).toHaveClass('custom');
        expect(getWrapper()).toHaveStyle({ width: '120px' });
        expect(input.closest(`.${prefixCls}-wrapper`)).not.toHaveClass('custom');
        const view = mount({ role: 'textbox' } as InputNumberProps);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        view.unmount();
    });

    it('InputGroup 下发 size 与 disabled，自身显式传的值优先', () => {
        render(InGroup);
        const inherit = screen.getByRole('spinbutton', { name: 'inherit' });
        const own = screen.getByRole('spinbutton', { name: 'own' });
        expect(inherit).toBeDisabled();
        expect(own).toBeEnabled();
        expect(inherit).toHaveClass(`${prefixCls}-large`);
        expect(own.closest(`.${prefixCls}-number`)).toHaveClass(`${prefixCls}-number-size-small`);
        expect(own.closest(`.${prefixCls}-number`)).not.toHaveClass(`${prefixCls}-number-size-large`);
    });

    it('自身子树内的控件不读 InputGroup', () => {
        render(InGroup);
        const probe = screen.getByText('probe').closest('button');
        expect(probe).toBeEnabled();
        expect(probe).not.toHaveClass(`${BASE_CLASS_PREFIX}-button-size-large`);
    });

    it('组件可直接渲染，不经夹具', () => {
        render(InputNumber, { props: { value: 3 } });
        expect(getInput()).toHaveValue('3');
    });
});
