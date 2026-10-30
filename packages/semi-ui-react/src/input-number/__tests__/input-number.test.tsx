import { createRef, Profiler, StrictMode, useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { numbers } from '@fibrae/semi-foundation/input-number/constants';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import de from '@fibrae/semi-foundation/locale/source/de';
import { Form, withField } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import LocaleProvider from '@fibrae/semi-ui-react/locale/locale-provider';
import { default as InputNumber, type InputNumberHandle, type InputNumberProps } from '../index';

type InputNumberCallback<K extends keyof InputNumberProps> = NonNullable<InputNumberProps[K]>;

const prefixCls = `${BASE_CLASS_PREFIX}-input`;

const getInput = () => screen.getByRole<HTMLInputElement>('spinbutton');
const getButtons = () => document.querySelector(`.${prefixCls}-number-suffix-btns`);
const getUpButton = () => document.querySelector<HTMLElement>(`.${prefixCls}-number-suffix-btns .${prefixCls}-number-button-up`);
const getDownButton = () => document.querySelector<HTMLElement>(`.${prefixCls}-number-suffix-btns .${prefixCls}-number-button-down`);
const getWrapper = () => document.querySelector(`.${prefixCls}-number`);

const hold = (button: Element, init: PointerEventInit = { button: numbers.MOUSE_BUTTON_LEFT }) => fireEvent.pointerDown(button, init);
// the button captures the pointer, so the browser fires lostpointercapture on it after pointerup wherever that lands
function release(button: Element) {
    fireEvent.pointerUp(button);
    fireEvent.lostPointerCapture(button);
}
// a full press: releasing ends the press-and-hold auto repeat that pointerdown arms
function press(button: Element, init?: PointerEventInit) {
    hold(button, init);
    release(button);
}
function pressTimes(button: Element, count: number, init?: PointerEventInit) {
    for (let i = 0; i < count; i++) {
        press(button, init);
    }
}
const change = (value: string) => fireEvent.change(getInput(), { target: { value } });
const keyDown = (key: string, init: KeyboardEventInit = {}) => fireEvent.keyDown(getInput(), { key, ...init });
const focusInput = () => act(() => getInput().focus());
const blurInput = () => act(() => getInput().blur());
const lastArg = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls[spy.mock.calls.length - 1][0];

const thousands = (value: number | string) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const removeThousands = (value: string) => value.replace(/,/g, '');

// owns `value` the way a parent would, feeding every onChange back in
function ControlledInputNumber({ initValue, onChange, ...props }: Omit<InputNumberProps, 'value' | 'defaultValue'> & { initValue: number | string }) {
    const [value, setValue] = useState<number | string>(initValue);
    return (
        <InputNumber
            {...props}
            value={value}
            onChange={(v, e) => {
                onChange?.(v, e);
                setValue(v);
            }}
        />
    );
}

describe(`InputNumber`, () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it(`使用 'defaultValue'、'showClear'、'size'、'suffix'、'ref'`, () => {
        const defaultValue = 1020;
        const sizeEntries: Array<[NonNullable<InputNumberProps['size']>, string]> = [
            ['default', `${prefixCls}-default`],
            ['large', `${prefixCls}-large`],
            ['small', `${prefixCls}-small`],
        ];
        const showClear = true;

        sizeEntries.forEach(([size, className]) => {
            const { unmount } = render(<InputNumber defaultValue={defaultValue} showClear={showClear} size={size} />);
            expect(getInput()).toHaveClass(className);
            expect(getInput()).toHaveValue('1020');
            expect(getButtons()).not.toBeNull();
            unmount();
        });

        const withoutButtons = render(<InputNumber defaultValue={defaultValue} hideButtons />);
        expect(getButtons()).toBeNull();
        withoutButtons.unmount();

        const refObject = createRef<InputNumberHandle>();
        const withRefObject = render(<InputNumber ref={refObject} defaultValue={defaultValue} />);
        expect(refObject.current?.input).toBe(getInput());
        withRefObject.unmount();

        const refFn = vi.fn<(handle: InputNumberHandle | null) => void>();
        render(<InputNumber ref={refFn} defaultValue={defaultValue} />);
        expect(refFn.mock.calls[0][0]?.input).toBe(getInput());
    });

    it(`使用 'value'、'onBlur'、'onChange'、'onInput'、'onFocus'、'onKeyDown'`, () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const oldValue = 1020;
        const newValue = 1301;
        const newValidStr = '1309';
        const newInvalidValue = `1301fd`;
        const emptyValue = '';

        const onBlur = vi.fn<InputNumberCallback<'onBlur'>>();
        const onFocus = vi.fn<InputNumberCallback<'onFocus'>>();
        const onKeyDown = vi.fn<InputNumberCallback<'onKeyDown'>>();
        const props = { onChange, onBlur, onFocus, onKeyDown };

        const { rerender } = render(<InputNumber {...props} value={oldValue} />);
        expect(onChange).not.toHaveBeenCalled();

        change(newInvalidValue);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(newInvalidValue, expect.anything());

        focusInput();
        expect(onFocus).toHaveBeenCalledTimes(1);
        rerender(<InputNumber {...props} value={newInvalidValue} />);
        blurInput();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue(oldValue.toString());

        rerender(<InputNumber {...props} value={emptyValue} />);
        expect(getInput()).toHaveValue('');

        focusInput();
        rerender(<InputNumber {...props} value={newValue} />);
        blurInput();
        expect(getInput()).toHaveValue(newValue.toString());

        focusInput();
        rerender(<InputNumber {...props} value={newInvalidValue} />);
        blurInput();
        expect(getInput()).toHaveValue(newValue.toString());

        focusInput();
        rerender(<InputNumber {...props} value={newValidStr} />);
        blurInput();
        expect(getInput()).toHaveValue(newValidStr);

        onChange.mockClear();
        keyDown('ArrowUp');
        keyDown('ArrowUp');
        keyDown('ArrowUp');
        expect(lastArg(onChange)).toBe(Number(newValidStr) + 1);
        keyDown('ArrowDown');
        expect(lastArg(onChange)).toBe(Number(newValidStr) - 1);
        expect(onKeyDown).toHaveBeenCalledTimes(4);
        expect(getInput()).toHaveValue(newValidStr);
    });

    it(`使用 'max'、'min'、'value'、'onChange'、'precision'、'parser'、'formatter'`, () => {
        const oldValue = 1020.245;
        const newValue = 1302.921;
        const min = 1000;
        const max = 1300;
        const precision = 2;
        const formatter = (value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        const parser = (value) => value.replace(/\$\s?|(,*)/g, '');

        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const onBlur = vi.fn<InputNumberCallback<'onBlur'>>();
        const props = { onChange, min, max, onBlur, precision, formatter, parser };

        const { rerender } = render(<InputNumber {...props} value={oldValue} />);
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue(formatter(oldValue.toFixed(precision)));

        change(String(newValue));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toEqual(Number(newValue.toFixed(precision)));
        expect(getInput()).toHaveValue(formatter(newValue));

        // the parent keeps the old value, so the blur reports the number the input falls back to
        fireEvent.blur(getInput());
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(2);

        rerender(<InputNumber {...props} value={newValue} />);
        expect(getInput()).toHaveValue(formatter(newValue.toFixed(precision)));

        rerender(<InputNumber {...props} value={min - 100} />);
        expect(getInput()).toHaveValue(formatter((min - 100).toFixed(precision)));
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it(`点击加减按钮，触发 'onUpClick'、'onDownClick'`, () => {
        const defaultValue = 1000;
        const onUpClick = vi.fn<InputNumberCallback<'onUpClick'>>();
        const onDownClick = vi.fn<InputNumberCallback<'onDownClick'>>();

        render(<InputNumber defaultValue={defaultValue} onDownClick={onDownClick} onUpClick={onUpClick} />);

        const addCount = 3;
        const minusCount = 1;

        pressTimes(getUpButton(), addCount);
        pressTimes(getDownButton(), minusCount);

        expect(getInput()).toHaveValue(String(defaultValue + addCount - minusCount));
        expect(onUpClick).toHaveBeenCalledTimes(addCount);
        expect(onUpClick).toHaveBeenLastCalledWith('1003', expect.anything());
        expect(onDownClick).toHaveBeenCalledTimes(minusCount);
        expect(onDownClick).toHaveBeenLastCalledWith('1002', expect.anything());
    });

    it(`点击内置加减按钮，触发 'onUpClick'、'onDownClick'`, () => {
        const defaultValue = 1000;
        const onUpClick = vi.fn<InputNumberCallback<'onUpClick'>>();
        const onDownClick = vi.fn<InputNumberCallback<'onDownClick'>>();

        render(<InputNumber defaultValue={defaultValue} innerButtons onDownClick={onDownClick} onUpClick={onUpClick} />);
        expect(getButtons()).toBeNull();
        fireEvent.mouseEnter(getWrapper());
        expect(getButtons()).toHaveClass(`${prefixCls}-number-suffix-btns-inner`);

        const addCount = 3;
        const minusCount = 1;

        pressTimes(getUpButton(), addCount);
        pressTimes(getDownButton(), minusCount);

        expect(getInput()).toHaveValue(String(defaultValue + addCount - minusCount));
        expect(onUpClick).toHaveBeenCalledTimes(addCount);
        expect(onDownClick).toHaveBeenCalledTimes(minusCount);
    });

    it('shiftStep 属性', () => {
        const { rerender } = render(<InputNumber defaultValue={0} shiftStep={100} />);
        keyDown('ArrowUp', { shiftKey: true });
        expect(getInput()).toHaveValue('100');
        keyDown('ArrowUp');
        expect(getInput()).toHaveValue('101');

        rerender(<InputNumber defaultValue={0} shiftStep={5} />);
        keyDown('ArrowDown', { shiftKey: true });
        expect(getInput()).toHaveValue('96');
    });

    it('keepFocus 属性', () => {
        const defaultValue = 1;
        const onBlur = vi.fn<InputNumberCallback<'onBlur'>>();
        const onFocus = vi.fn<InputNumberCallback<'onFocus'>>();

        const { rerender } = render(<InputNumber defaultValue={defaultValue} keepFocus onBlur={onBlur} onFocus={onFocus} />);

        expect(document.querySelector(`.${prefixCls}-wrapper-focus`)).toBeNull();
        expect(getInput()).not.toHaveFocus();

        const addCount = 3;
        const minusCount = 1;
        pressTimes(getUpButton(), addCount);
        pressTimes(getDownButton(), minusCount);
        expect(getInput()).toHaveValue(String(defaultValue + addCount - minusCount));
        expect(getInput()).toHaveFocus();
        expect(document.querySelector(`.${prefixCls}-wrapper-focus`)).not.toBeNull();
        expect(onFocus).toHaveBeenCalled();

        blurInput();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getInput()).not.toHaveFocus();

        rerender(<InputNumber defaultValue={defaultValue} keepFocus={false} onBlur={onBlur} onFocus={onFocus} />);
        press(getUpButton());
        expect(getInput()).toHaveValue('4');
        expect(getInput()).not.toHaveFocus();
    });

    it('受控值超出范围', () => {
        const max = 100;
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const onNumberChange = vi.fn<InputNumberCallback<'onNumberChange'>>();
        render(<InputNumber max={max} value={max} onChange={onChange} onNumberChange={onNumberChange} />);
        change(String(max + 1));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(max + 1, expect.anything());
        expect(onNumberChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveAttribute('aria-valuenow', String(max));
    });

    it('受控值为 NaN', () => {
        const initValue = 1;
        const newValue = NaN;
        const voidString = '';
        const { rerender } = render(<InputNumber value={initValue} />);
        expect(getInput()).toHaveValue(String(initValue));
        expect(getInput()).toHaveAttribute('aria-valuenow', String(initValue));

        rerender(<InputNumber value={newValue} />);
        expect(getInput()).toHaveValue(voidString);
        expect(getInput()).not.toHaveAttribute('aria-valuenow');
    });

    it('aria-valuenow 为普通十进制数，包括 0', () => {
        const { rerender } = render(<InputNumber value={0} />);
        expect(getInput()).toHaveAttribute('aria-valuenow', '0');
        rerender(<InputNumber value={1.235e-7} />);
        expect(getInput()).toHaveAttribute('aria-valuenow', '0.0000001235');
    });

    it('挂载时受控值为 NaN', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const plain = render(<InputNumber value={NaN} onChange={onChange} />);
        expect(getInput()).toHaveValue('');
        expect(getInput()).not.toHaveAttribute('aria-valuenow');
        plain.unmount();

        render(<InputNumber value={NaN} currency="CNY" onChange={onChange} />);
        expect(getInput()).toHaveValue('');
        expect(getInput()).not.toHaveAttribute('aria-valuenow');
    });

    it('修复数字减法的 bug', () => {
        const initValue = 0.9;
        render(<InputNumber defaultValue={initValue} max={1} step={0.1} />);
        press(getUpButton());
        expect(getInput()).toHaveValue('1');
        expect(getUpButton()).toHaveClass(`${prefixCls}-number-button-up-not-allowed`);
    });

    it('修复受控模式下的 setValue', () => {
        const onNumberChange = vi.fn<InputNumberCallback<'onNumberChange'>>();
        const CustomInput = withField(InputNumber, { onKeyChangeFnName: 'onNumberChange' });
        render(
            <Form>
                <CustomInput field="custom" formatter={(value) => `${value}`.replace(/\D/g, '')} onNumberChange={onNumberChange} />
            </Form>
        );

        change('abc');
        expect(onNumberChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue('');

        change('123');
        expect(onNumberChange).toHaveBeenCalledTimes(1);
        expect(onNumberChange.mock.calls[0][0]).toBe(123);
        expect(getInput()).toHaveValue('123');
    });

    it(`右键点击加减按钮`, () => {
        const defaultValue = 1000;
        const onUpClick = vi.fn<InputNumberCallback<'onUpClick'>>();
        const onDownClick = vi.fn<InputNumberCallback<'onDownClick'>>();
        const MOUSE_BUTTON_RIGHT = 2;

        render(<InputNumber defaultValue={defaultValue} onDownClick={onDownClick} onUpClick={onUpClick} />);

        pressTimes(getUpButton(), 1, { button: MOUSE_BUTTON_RIGHT });
        pressTimes(getDownButton(), 3, { button: MOUSE_BUTTON_RIGHT });

        expect(getInput()).toHaveValue(String(defaultValue));
        expect(onUpClick).not.toHaveBeenCalled();
        expect(onDownClick).not.toHaveBeenCalled();
    });

    it('Form 字段的初始值低于 min：挂载不通知也不改表单值，失焦后校正到 min', () => {
        const spyChange = vi.fn<InputNumberCallback<'onChange'>>();
        let formApi = null;
        const getFormApi = (api) => {
            formApi = api;
        };
        render(
            <Form getFormApi={getFormApi} initValues={{ minControlled: 0 }}>
                <Form.InputNumber min={1} field="minControlled" onChange={spyChange} />
            </Form>
        );
        expect(spyChange).not.toHaveBeenCalled();
        expect(formApi.getValue('minControlled')).toBe(0);
        expect(getInput()).toHaveValue('0');
        expect(formApi.getFormState().touched).toEqual({});

        focusInput();
        blurInput();
        expect(spyChange).toHaveBeenCalledTimes(1);
        expect(spyChange.mock.calls[0][0]).toEqual(1);
        expect(formApi.getValue('minControlled')).toBe(1);
        expect(getInput()).toHaveValue('1');
    });

    it('常见货币显示', () => {
        const defaultValue = 123456.78;
        const cases: Array<[InputNumberProps, string]> = [
            [{ currency: 'CNY' }, '¥123,456.78'],
            [{ localeCode: 'en-US', currency: 'USD' }, '$123,456.78'],
            [{ localeCode: 'de-DE', currency: 'EUR' }, '123.456,78 €'],
            [{ localeCode: 'ja-JP', currency: 'JPY' }, '￥123,457'],
            [{ localeCode: 'vi-VN', currency: 'VND' }, '123.457 ₫'],
            [{ localeCode: 'th-TH', currency: 'THB' }, '฿123,456.78'],
            [{ localeCode: 'id-ID', currency: 'IDR' }, new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(defaultValue)],
        ];
        cases.forEach(([props, expected]) => {
            const { unmount } = render(<InputNumber {...props} defaultValue={defaultValue} />);
            expect(getInput()).toHaveValue(expected);
            unmount();
        });
    });

    it('currency 为 true 时使用语言包的货币码，所有语言包都能渲染', () => {
        const packs = import.meta.glob<Locale>('@fibrae/semi-foundation/locale/source/*.ts', {
            eager: true,
            import: 'default',
        });
        expect(Object.keys(packs)).toHaveLength(57);
        for (const [file, pack] of Object.entries(packs)) {
            const { unmount } = render(
                <LocaleProvider locale={pack}>
                    <InputNumber defaultValue={1.5} currency />
                </LocaleProvider>
            );
            expect([file, getInput().value]).not.toEqual([file, '']);
            unmount();
        }
    });

    it('显式 localeCode={undefined} 使用语言包的 localeCode', () => {
        render(
            <LocaleProvider locale={de}>
                <InputNumber defaultValue={123456.78} currency localeCode={undefined} />
            </LocaleProvider>
        );
        expect(getInput()).toHaveValue(new Intl.NumberFormat('de', { style: 'currency', currency: 'EUR' }).format(123456.78));
    });

    it('全局 overrideDefaultProps 的 localeCode、defaultCurrency 优先于语言包', () => {
        semiGlobal.config.overrideDefaultProps = { InputNumber: { localeCode: 'de-DE', defaultCurrency: 'USD' } };
        try {
            render(<InputNumber defaultValue={123456.78} currency />);
            expect(getInput()).toHaveValue(new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(123456.78));
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('全局 Input 默认值不作用于 InputNumber，InputNumber 自身的全局值照常生效', () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true, prefix: 'x', suffix: 'y', insetLabel: 'l', addonBefore: 'b', addonAfter: 'a' } };
        try {
            const { container, unmount } = render(<InputNumber defaultValue={1} />);
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-prefix, .${BASE_CLASS_PREFIX}-input-suffix, .${BASE_CLASS_PREFIX}-input-prepend, .${BASE_CLASS_PREFIX}-input-append`)).toBeNull();
            expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-number-suffix-btns`)).not.toBeNull();
            unmount();
            semiGlobal.config.overrideDefaultProps = { InputNumber: { showClear: true, prefix: 'x' } };
            const host = render(<InputNumber defaultValue={1} />).container;
            expect(host.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).not.toBeNull();
            expect(host.querySelector(`.${BASE_CLASS_PREFIX}-input-prefix`)).toHaveTextContent('x');
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('常见货币显示，defaultValue 为字符串', () => {
        const defaultValue = '123456.78';
        const cases: Array<[InputNumberProps, string]> = [
            [{ currency: 'CNY' }, '¥123,456.78'],
            [{ localeCode: 'en-US', currency: 'USD' }, '$123,456.78'],
            [{ localeCode: 'th-TH', currency: 'THB' }, '฿123,456.78'],
        ];
        cases.forEach(([props, expected]) => {
            const { unmount } = render(<InputNumber {...props} defaultValue={defaultValue} />);
            expect(getInput()).toHaveValue(expected);
            unmount();
        });

        // a string value is read in the locale's own notation, where ',' is the decimal separator
        render(<InputNumber defaultValue="123456,78" currency="EUR" localeCode="de-DE" />);
        expect(getInput()).toHaveValue('123.456,78 €');
    });

    // currencies without minor units (JPY, VND, IDR) still read the locale's decimal separator in a string value
    it('常见货币显示，defaultValue 为字符串，货币无小数位', () => {
        const cases: Array<[InputNumberProps, string, string]> = [
            [{ localeCode: 'ja-JP', currency: 'JPY' }, '123456.78', '￥123,457'],
            [{ localeCode: 'vi-VN', currency: 'VND' }, '123456,78', '123.457 ₫'],
            [{ localeCode: 'id-ID', currency: 'IDR' }, '123456,78', new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(123456.78)],
        ];
        cases.forEach(([props, defaultValue, expected]) => {
            const { unmount } = render(<InputNumber {...props} defaultValue={defaultValue} />);
            expect(getInput()).toHaveValue(expected);
            unmount();
        });
    });

    it('非受控 + 加减按钮', () => {
        const defaultValue = 123459.78;
        render(<InputNumber defaultValue={defaultValue} currency="USD" localeCode="en-US" />);

        pressTimes(getUpButton(), 1);
        expect(getInput()).toHaveValue('$123,460.78');
        pressTimes(getDownButton(), 3);
        expect(getInput()).toHaveValue('$123,457.78');
    });

    it('受控 + 加减按钮', () => {
        const defaultValue = 123459.78;
        const spyChange = vi.fn<InputNumberCallback<'onChange'>>();
        render(<ControlledInputNumber currency="USD" initValue={defaultValue} localeCode="en-US" onChange={spyChange} />);

        pressTimes(getUpButton(), 1);
        expect(spyChange).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('$123,460.78');

        pressTimes(getDownButton(), 3);
        expect(spyChange).toHaveBeenCalledTimes(4);
        expect(getInput()).toHaveValue('$123,457.78');
    });

    it('常见货币显示，showCurrencySymbol=false', () => {
        const defaultValue = 123456.78;
        const idrFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' });
        const idrCurrencySymbol = idrFormatter.formatToParts(0).find((p) => p.type === 'currency')?.value ?? '';
        const cases: Array<[InputNumberProps, string]> = [
            [{ currency: 'CNY' }, '123,456.78'],
            [{ localeCode: 'en-US', currency: 'USD' }, '123,456.78'],
            [{ localeCode: 'de-DE', currency: 'EUR' }, '123.456,78'],
            [{ localeCode: 'ja-JP', currency: 'JPY' }, '123,457'],
            [{ localeCode: 'vi-VN', currency: 'VND' }, '123.457'],
            [{ localeCode: 'th-TH', currency: 'THB' }, '123,456.78'],
            [{ localeCode: 'id-ID', currency: 'IDR' }, idrFormatter.format(defaultValue).replace(idrCurrencySymbol, '').trim()],
        ];
        cases.forEach(([props, expected]) => {
            const { unmount } = render(<InputNumber {...props} defaultValue={defaultValue} showCurrencySymbol={false} />);
            expect(getInput()).toHaveValue(expected);
            unmount();
        });
    });

    it('CNY 货币在不同 currencyDisplay 选项下的显示', () => {
        const defaultValue = 123456.78;
        const cases: Array<[InputNumberProps, string]> = [
            [{}, '¥123,456.78'],
            [{ currencyDisplay: 'code' }, 'CNY 123,456.78'],
            [{ currencyDisplay: 'name' }, '123,456.78人民币'],
        ];
        cases.forEach(([props, expected]) => {
            const { unmount } = render(<InputNumber defaultValue={defaultValue} currency="CNY" {...props} />);
            expect(getInput()).toHaveValue(expected);
            unmount();
        });
    });

    it('修复 2936，测试 JS 精度相关计算', () => {
        render(<InputNumber defaultValue={0.07} max={0.08} min={0.01} step={0.01} />);
        press(getUpButton());
        expect(getInput()).toHaveValue('0.08');
    });

    it('disabled 属性', () => {
        render(<InputNumber defaultValue={100} disabled />);
        expect(getInput()).toBeDisabled();
        expect(document.querySelector(`.${prefixCls}-wrapper-disabled`)).not.toBeNull();
        expect(getUpButton()).toHaveClass(`${prefixCls}-number-button-up-disabled`);
        expect(getDownButton()).toHaveClass(`${prefixCls}-number-button-down-disabled`);
    });

    it('禁用时按钮不响应点击', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const onUpClick = vi.fn<InputNumberCallback<'onUpClick'>>();
        render(<InputNumber defaultValue={100} disabled onChange={onChange} onUpClick={onUpClick} />);
        press(getUpButton());
        press(getDownButton());
        expect(getInput()).toHaveValue('100');
        expect(onChange).not.toHaveBeenCalled();
        expect(onUpClick).not.toHaveBeenCalled();
    });

    it('readonly 属性', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        render(<InputNumber defaultValue={100} readonly onChange={onChange} />);
        expect(getInput()).toHaveAttribute('readonly');
        press(getUpButton());
        expect(getInput()).toHaveValue('100');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('readonly 时方向键与 Home、End 不改值，Home、End 仍移动光标', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        render(<InputNumber defaultValue={10} max={50} min={2} readonly onChange={onChange} />);
        for (const key of ['ArrowUp', 'ArrowDown', 'Home', 'End']) {
            fireEvent.keyDown(getInput(), { key });
        }
        expect(getInput()).toHaveValue('10');
        expect(onChange).not.toHaveBeenCalled();
        expect(fireEvent.keyDown(getInput(), { key: 'Home' })).toBe(true);
    });

    it('readonly 且受控时，onKeyDown 仍被调用', () => {
        const onKeyDown = vi.fn<InputNumberCallback<'onKeyDown'>>();
        render(<InputNumber value={10} readonly onKeyDown={onKeyDown} />);
        keyDown('ArrowUp');
        expect(onKeyDown).toHaveBeenCalledTimes(1);
    });

    it('距边界不足一个 step 时，上键与按钮夹到边界', () => {
        const upper = render(<InputNumber defaultValue={9.5} max={10} min={0.5} step={1} />);
        press(getUpButton());
        expect(getInput()).toHaveValue('10');
        expect(getUpButton()).toHaveClass(`${prefixCls}-number-button-up-not-allowed`);
        upper.unmount();

        render(<InputNumber defaultValue={0.8} max={10} min={0.5} step={1} />);
        keyDown('ArrowDown');
        expect(getInput()).toHaveValue('0.5');
        expect(getDownButton()).toHaveClass(`${prefixCls}-number-button-down-not-allowed`);
    });

    it('currency 与 showCurrencySymbol 在挂载后变化时，符号随之更新', () => {
        const { rerender } = render(<InputNumber defaultValue={100} currency="CNY" showCurrencySymbol={false} />);
        expect(getInput()).toHaveValue('100.00');
        rerender(<InputNumber defaultValue={100} currency="USD" showCurrencySymbol={false} />);
        focusInput();
        blurInput();
        expect(getInput()).toHaveValue('100.00');
    });

    it('localeCode 在挂载后变化时，按新语言的小数点解析输入', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const { rerender } = render(<InputNumber currency="EUR" localeCode="en-US" onChange={onChange} />);
        rerender(<InputNumber currency="EUR" localeCode="de-DE" onChange={onChange} />);
        focusInput();
        change('1.234,56');
        expect(lastArg(onChange)).toBe(1234.56);
    });

    it('挂载后才开启 currency 时，按小数点解析输入', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const { rerender } = render(<InputNumber localeCode="en-US" onChange={onChange} />);
        rerender(<InputNumber currency="USD" localeCode="en-US" onChange={onChange} />);
        focusInput();
        change('12.5');
        expect(lastArg(onChange)).toBe(12.5);
    });

    it('货币模式下 precision 为 0 时不显示小数', () => {
        render(<InputNumber defaultValue={100.4} currency="CNY" precision={0} />);
        expect(getInput()).toHaveValue('¥100');
    });

    it('货币模式下 minimumFractionDigits 与 maximumFractionDigits 为 0 时生效', () => {
        render(<InputNumber defaultValue={100.4} currency="CNY" maximumFractionDigits={0} minimumFractionDigits={0} />);
        expect(getInput()).toHaveValue('¥100');
    });

    it('ArrowUp 键增加数值', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        render(<InputNumber defaultValue={10} onChange={onChange} />);
        keyDown('ArrowUp');
        expect(getInput()).toHaveValue('11');
        expect(onChange).toHaveBeenCalledWith(11, expect.anything());
    });

    it('Home 与 End 跳到 min 与 max，未设置边界时光标仍可移动', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        render(<InputNumber defaultValue={10} min={2} onChange={onChange} />);
        expect(fireEvent.keyDown(getInput(), { key: 'Home' })).toBe(false);
        expect(getInput()).toHaveValue('2');
        expect(onChange).toHaveBeenCalledWith(2, expect.anything());
        expect(fireEvent.keyDown(getInput(), { key: 'End' })).toBe(true);
        expect(getInput()).toHaveValue('2');

        const { unmount } = render(<InputNumber defaultValue={10} max={50} precision={1} />);
        const input = screen.getAllByRole('spinbutton')[1];
        fireEvent.keyDown(input, { key: 'End' });
        expect(input).toHaveValue('50.0');
        unmount();
    });

    it('ArrowDown 键减少数值', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        render(<InputNumber defaultValue={10} onChange={onChange} />);
        keyDown('ArrowDown');
        expect(getInput()).toHaveValue('9');
        expect(onChange).toHaveBeenCalledWith(9, expect.anything());
    });

    it('step 属性影响加减步长', () => {
        render(<InputNumber defaultValue={10} step={5} />);
        press(getUpButton());
        expect(getInput()).toHaveValue('15');
        press(getDownButton());
        press(getDownButton());
        expect(getInput()).toHaveValue('5');
        expect(getInput()).toHaveAttribute('step', '5');
    });

    // a step with abs value < 1e-6 is stringified in scientific notation ((1e-8).toString() === "1e-8"), which must not
    // break precision detection and freeze the +/- buttons
    it('小于 1e-6（科学计数法）的 step 能正确加减', () => {
        render(<InputNumber defaultValue={0} step={1e-8} precision={8} />);
        press(getUpButton());
        expect(getInput()).toHaveValue('0.00000001');
        press(getDownButton());
        expect(getInput()).toHaveValue('0.00000000');
    });

    it('validateStatus 为 warning', () => {
        render(<InputNumber validateStatus="warning" />);
        expect(document.querySelector(`.${prefixCls}-wrapper-warning`)).not.toBeNull();
    });

    it('validateStatus 为 error', () => {
        render(<InputNumber validateStatus="error" />);
        expect(document.querySelector(`.${prefixCls}-wrapper-error`)).not.toBeNull();
    });

    it('prefix 与 suffix 属性', () => {
        render(<InputNumber defaultValue={100} prefix="$" suffix="USD" />);
        expect(document.querySelector(`.${prefixCls}-prefix`)).toHaveTextContent(/^\$$/);
        expect(document.querySelector(`.${prefixCls}-suffix`)).toHaveTextContent(/^USD$/);
    });

    it('innerButtons 属性在悬停时显示按钮', () => {
        render(<InputNumber defaultValue={100} innerButtons />);
        expect(getButtons()).toBeNull();
        fireEvent.mouseEnter(getWrapper());
        expect(getButtons()).toHaveClass(`${prefixCls}-number-suffix-btns-inner-hover`);
        expect(getButtons().querySelectorAll(`.${prefixCls}-number-button`)).toHaveLength(2);
    });

    it('onNumberChange 回调', () => {
        const onNumberChange = vi.fn<InputNumberCallback<'onNumberChange'>>();
        render(<InputNumber defaultValue={10} onNumberChange={onNumberChange} />);
        press(getUpButton());
        expect(onNumberChange).toHaveBeenCalledTimes(1);
        expect(onNumberChange).toHaveBeenCalledWith(11, expect.anything());
    });

    it('handleInputMouseMove 事件', () => {
        render(<InputNumber defaultValue={100} innerButtons />);
        expect(getButtons()).toBeNull();
        fireEvent.mouseMove(getWrapper(), { clientX: 100, clientY: 100 });
        expect(getButtons()).toHaveClass(`${prefixCls}-number-suffix-btns-inner-hover`);
    });

    it('fixCaret adapter 方法', async () => {
        render(<InputNumber defaultValue={100} formatter={thousands} parser={removeThousands} />);
        await userEvent.type(getInput(), '5', { initialSelectionStart: 1, initialSelectionEnd: 1 });
        expect(getInput()).toHaveValue('1,500');
        // the caret stays in front of the digits that followed it, after the inserted separator
        expect(getInput().selectionStart).toBe(3);
        expect(getInput().selectionEnd).toBe(3);
    });

    it('货币模式下的字符串值', () => {
        render(<InputNumber value="100.50" currency="CNY" />);
        expect(getInput()).toHaveValue('¥100.50');
    });

    it('键盘步进后光标回到原先其后的文本之前', () => {
        render(<InputNumber defaultValue={1000} step={1000} formatter={thousands} parser={removeThousands} />);
        expect(getInput()).toHaveValue('1,000');
        focusInput();
        getInput().setSelectionRange(1, 1);
        keyDown('ArrowUp');
        expect(getInput()).toHaveValue('2,000');
        expect(getInput().selectionStart).toBe(1);
    });

    it('光标后的文本变化时，光标留在末尾', () => {
        render(<InputNumber defaultValue={1000} formatter={thousands} parser={removeThousands} />);
        focusInput();
        getInput().setSelectionRange(2, 2);
        keyDown('ArrowUp');
        // "000" after the caret is gone from "1,001", so there is no place to put the caret back
        expect(getInput()).toHaveValue('1,001');
        expect(getInput().selectionStart).toBe(5);
    });

    it('setClickUpOrDown adapter 方法', () => {
        render(<ControlledInputNumber initValue={1} precision={2} />);
        expect(getInput()).toHaveValue('1.00');
        focusInput();
        keyDown('ArrowUp');
        expect(getInput()).toHaveValue('2.00');
        expect(getInput()).toHaveAttribute('aria-valuenow', '2');
    });

    it('minimumFractionDigits 与 maximumFractionDigits 属性', () => {
        const props = { currency: 'CNY', minimumFractionDigits: 2, maximumFractionDigits: 4 };
        const short = render(<InputNumber {...props} defaultValue={100.5} />);
        expect(getInput()).toHaveValue('¥100.50');
        short.unmount();

        render(<InputNumber {...props} defaultValue={3.14159} />);
        expect(getInput()).toHaveValue('¥3.1416');
    });

    it('insetLabel 属性', () => {
        render(<InputNumber defaultValue={100} insetLabel="Amount" />);
        expect(document.querySelector(`.${prefixCls}-inset-label`)).toHaveTextContent(/^Amount$/);
    });

    it('handleInputMouseLeave 事件', () => {
        render(<InputNumber defaultValue={100} innerButtons />);

        fireEvent.mouseEnter(getWrapper());
        expect(getButtons()).not.toBeNull();
        fireEvent.mouseLeave(getWrapper());
        expect(getButtons()).toBeNull();
    });

    it('受控值在聚焦状态下配合步进', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const { rerender } = render(<InputNumber value={100} onChange={onChange} />);

        focusInput();
        // stepping with the keyboard marks the next controlled update as a step, which is formatted
        keyDown('ArrowUp');
        expect(onChange).toHaveBeenLastCalledWith(101, expect.anything());
        rerender(<InputNumber value={200} onChange={onChange} />);

        expect(getInput()).toHaveValue('200');
        expect(getInput()).toHaveAttribute('aria-valuenow', '200');
    });

    it('货币模式下解析值相同', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const { rerender } = render(<InputNumber value={100} currency="CNY" onChange={onChange} />);
        onChange.mockClear();

        rerender(<InputNumber value="100" currency="CNY" onChange={onChange} />);

        expect(getInput()).toHaveValue('¥100.00');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('受控值为解析后数值相同的字符串', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const { rerender } = render(<InputNumber value="100.00" currency="CNY" onChange={onChange} />);
        onChange.mockClear();

        rerender(<InputNumber value={100} currency="CNY" onChange={onChange} />);

        expect(getInput()).toHaveValue('¥100.00');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('带回调的 updateStates adapter 方法', () => {
        const { rerender } = render(<InputNumber value={100} />);
        expect(getInput()).toHaveAttribute('aria-valuenow', '100');

        rerender(<InputNumber value="" />);
        expect(getInput()).toHaveValue('');
        expect(getInput()).not.toHaveAttribute('aria-valuenow');
    });

    it('setClickUpOrDown adapter 方法', () => {
        // typing is not a step: focusing resets the step mark, so the typed text is not reformatted
        render(<ControlledInputNumber initValue={1} precision={2} />);
        focusInput();
        change('5');
        expect(getInput()).toHaveValue('5');
        expect(getInput()).toHaveAttribute('aria-valuenow', '5');

        blurInput();
        expect(getInput()).toHaveValue('5.00');
    });

    it('有效输入下的 fixCaret adapter 方法', async () => {
        render(<InputNumber defaultValue={100} formatter={thousands} parser={removeThousands} />);
        await userEvent.type(getInput(), '9', { initialSelectionStart: 0, initialSelectionEnd: 0 });
        expect(getInput()).toHaveValue('9,100');
        expect(getInput().selectionStart).toBe(2);
    });

    it('受控输入格式化后光标回到原先其后的文本之前', async () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        render(<ControlledInputNumber formatter={thousands} initValue={100} parser={removeThousands} onChange={onChange} />);
        await userEvent.type(getInput(), '5', { initialSelectionStart: 1, initialSelectionEnd: 1 });
        expect(onChange).toHaveBeenLastCalledWith(1500, expect.anything());
        expect(getInput()).toHaveValue('1,500');
        expect(getInput().selectionStart).toBe(3);
    });

    it('聚焦且刚步进过时，componentDidUpdate 触发格式化', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const props = { onChange, keepFocus: true, precision: 1 };
        const { rerender } = render(<InputNumber {...props} value={100} />);

        press(getUpButton());
        expect(getInput()).toHaveFocus();

        rerender(<InputNumber {...props} value={150} />);
        expect(getInput()).toHaveValue('150.0');
        expect(getInput()).toHaveFocus();
    });

    it('聚焦状态下值为 NaN 时的 componentDidUpdate', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const { rerender } = render(<InputNumber value={100} onChange={onChange} />);

        focusInput();
        rerender(<InputNumber value={NaN} onChange={onChange} />);
        expect(onChange).not.toHaveBeenCalled();

        blurInput();
        expect(getInput()).toHaveValue('100');
        expect(onChange).toHaveBeenCalledWith(100, expect.anything());
    });

    it('聚焦状态下值为非法字符串时的 componentDidUpdate', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const { rerender } = render(<InputNumber value={100} onChange={onChange} />);

        focusInput();
        rerender(<InputNumber value="abc123" onChange={onChange} />);
        expect(getInput()).toHaveValue('abc123');
        expect(onChange).not.toHaveBeenCalled();

        blurInput();
        expect(getInput()).toHaveValue('100');
        expect(onChange).toHaveBeenCalledWith(100, expect.anything());
    });

    it('非货币模式下 precision 只改变文本、不改变数值时，挂载与更新都不触发 onChange', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const { rerender } = render(<InputNumber value={100} precision={2} onChange={onChange} />);
        expect(getInput()).toHaveValue('100.00');
        expect(onChange).not.toHaveBeenCalled();

        rerender(<InputNumber value={200} precision={2} onChange={onChange} />);
        expect(getInput()).toHaveValue('200.00');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('formatter 只改变文本时，挂载与更新都不触发 onChange', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const props = { formatter: (v: string | number) => `$ ${v}`, parser: (v: string) => v.replace(/^\$ /, '') };
        const { rerender } = render(<InputNumber {...props} value={100} onChange={onChange} />);
        expect(getInput()).toHaveValue('$ 100');
        rerender(<InputNumber {...props} value={200} onChange={onChange} />);
        expect(getInput()).toHaveValue('$ 200');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('precision 取整后数值改变时，挂载与更新只改显示，不触发 onChange', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const { rerender } = render(<InputNumber value={1.234} precision={1} onChange={onChange} />);
        expect(getInput()).toHaveValue('1.2');
        rerender(<InputNumber value={2.345} precision={1} onChange={onChange} />);
        expect(getInput()).toHaveValue('2.3');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('Form.InputNumber 带 precision 与 initValue 挂载后，不被标记为 touched，也不运行校验', async () => {
        const validate = vi.fn<(value: unknown) => string | undefined>();
        let formApi;
        render(
            <Form getFormApi={(api) => (formApi = api)}>
                <Form.InputNumber field="n" initValue={100} precision={2} validator={validate} />
            </Form>
        );
        expect(getInput()).toHaveValue('100.00');
        expect(formApi.getFormState().touched).toEqual({});
        expect(validate).not.toHaveBeenCalled();
    });

    it('非聚焦状态下值为非法数字时的 componentDidUpdate', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const { rerender } = render(<InputNumber value={100} onChange={onChange} />);

        rerender(<InputNumber value="invalid" onChange={onChange} />);

        expect(getInput()).toHaveValue('');
        expect(getInput()).not.toHaveAttribute('aria-valuenow');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('非聚焦状态下值为合法数字时的 componentDidUpdate', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const { rerender } = render(<InputNumber value={100} onChange={onChange} />);

        rerender(<InputNumber value={200} onChange={onChange} />);

        expect(getInput()).toHaveValue('200');
        expect(getInput()).toHaveAttribute('aria-valuenow', '200');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('货币模式下 componentDidUpdate 收到字符串 prop 值', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const { rerender } = render(<InputNumber value="100" currency="CNY" onChange={onChange} />);
        expect(getInput()).toHaveValue('¥100.00');

        rerender(<InputNumber value="200" currency="CNY" onChange={onChange} />);
        expect(getInput()).toHaveValue('¥200.00');
    });

    it('聚焦状态下值非法但不是 NaN 时的 componentDidUpdate', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const { rerender } = render(<InputNumber value={100} onChange={onChange} />);

        focusInput();
        rerender(<InputNumber value="100abc" onChange={onChange} />);
        expect(getInput()).toHaveValue('100abc');

        blurInput();
        expect(getInput()).toHaveValue('100');
    });

    it('货币模式下新值超过 max 时 componentDidUpdate 显示原值，失焦后才截断并通知', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const props = { currency: 'CNY', max: 120, onChange };
        const { rerender } = render(<InputNumber {...props} value={100} />);

        rerender(<InputNumber {...props} value={150} />);
        expect(getInput()).toHaveValue('¥150.00');
        expect(onChange).not.toHaveBeenCalled();

        focusInput();
        blurInput();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(120, expect.anything());
    });

    it('keepFocus 配合聚焦与步进时重新聚焦输入框', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const { rerender } = render(<InputNumber value={100} keepFocus onChange={onChange} />);

        focusInput();
        press(getUpButton());
        expect(onChange).toHaveBeenLastCalledWith(101, expect.anything());

        rerender(<InputNumber value={101} keepFocus onChange={onChange} />);
        expect(getInput()).toHaveValue('101');
        expect(getInput()).toHaveFocus();
    });

    it('handleInputMouseMove 事件', () => {
        render(<InputNumber defaultValue={100} innerButtons />);
        focusInput();
        expect(getButtons()).not.toHaveClass(`${prefixCls}-number-suffix-btns-inner-hover`);

        fireEvent.mouseMove(getWrapper());
        expect(getButtons()).not.toBeNull();
        expect(getButtons()).not.toHaveClass(`${prefixCls}-number-suffix-btns-inner-hover`);
    });

    it.each([
        ['普通数值', { defaultValue: 1234.5 }],
        ['受控值', { value: 1234.5 }],
        ['货币', { defaultValue: 1234.5, currency: 'USD', localeCode: 'en-US' }],
        [
            '格式化与精度',
            {
                defaultValue: 12,
                precision: 2,
                formatter: (v: number | string) => `${v}%`,
                parser: (v: string) => v.replace('%', ''),
            },
        ],
    ])('挂载只提交一次渲染：%s', (_, props: InputNumberProps) => {
        const onRender = vi.fn<() => void>();
        render(
            <Profiler id="inputNumber" onRender={onRender}>
                <InputNumber {...props} />
            </Profiler>
        );
        expect(onRender).toHaveBeenCalledTimes(1);
    });

    it('已悬停时继续移动鼠标不再重新渲染', () => {
        const onRender = vi.fn<() => void>();
        render(
            <Profiler id="inputNumber" onRender={onRender}>
                <InputNumber defaultValue={100} innerButtons />
            </Profiler>
        );
        fireEvent.mouseEnter(getWrapper());
        expect(getButtons()).toHaveClass(`${prefixCls}-number-suffix-btns-inner-hover`);
        onRender.mockClear();

        fireEvent.mouseMove(getWrapper());
        fireEvent.mouseMove(getWrapper());
        expect(onRender).not.toHaveBeenCalled();
    });

    it('聚焦且刚步进过、值为合法数字时的 componentDidUpdate', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const props = { onChange, keepFocus: true, precision: 2 };
        const { rerender } = render(<InputNumber {...props} value={100} />);
        expect(getInput()).toHaveValue('100.00');

        focusInput();
        keyDown('ArrowUp');

        rerender(<InputNumber {...props} value={150} />);

        expect(getInput()).toHaveValue('150.00');
    });

    it('聚焦状态下值超出范围（非 NaN）时的 componentDidUpdate', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const props = { min: 0, max: 100, onChange };
        const { rerender } = render(<InputNumber {...props} value={50} />);

        focusInput();
        rerender(<InputNumber {...props} value={150} />);
        expect(getInput()).toHaveValue('50');
        expect(getInput()).toHaveAttribute('aria-valuenow', '100');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('货币模式下新值低于 min 时 componentDidUpdate 显示原值且不通知', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const props = { currency: 'CNY', min: 50, onChange };
        const { rerender } = render(<InputNumber {...props} value={100} />);

        rerender(<InputNumber {...props} value={20} />);
        expect(getInput()).toHaveValue('¥20.00');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('聚焦状态下合法数字变化配合步进时的 componentDidUpdate', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        render(<ControlledInputNumber initValue={100} keepFocus onChange={onChange} />);
        expect(getInput()).not.toHaveFocus();

        press(getUpButton());

        expect(onChange).toHaveBeenLastCalledWith(101, expect.anything());
        expect(getInput()).toHaveValue('101');
        expect(getInput()).toHaveAttribute('aria-valuenow', '101');
        expect(getInput()).toHaveFocus();
    });

    it('聚焦状态下值超过 max（非法但非 NaN）时的 componentDidUpdate', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const props = { max: 100, onChange };
        const { rerender } = render(<InputNumber {...props} value={50} />);

        focusInput();
        rerender(<InputNumber {...props} value={200} />);

        blurInput();
        expect(getInput()).toHaveValue('100');
        expect(onChange).toHaveBeenCalledWith(100, expect.anything());
    });

    it('聚焦状态下值低于 min（非法但非 NaN）时的 componentDidUpdate', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const props = { min: 10, onChange };
        const { rerender } = render(<InputNumber {...props} value={50} />);

        focusInput();
        rerender(<InputNumber {...props} value={5} />);
        expect(getInput()).toHaveAttribute('aria-valuenow', '10');

        blurInput();
        expect(getInput()).toHaveValue('10');
        expect(onChange).toHaveBeenCalledWith(10, expect.anything());
    });

    it('聚焦状态下合法数字与 state.number 不同时的 componentDidUpdate', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const { rerender } = render(<InputNumber value={100} onChange={onChange} />);

        focusInput();
        change('150');
        expect(onChange).toHaveBeenCalledWith(150, expect.anything());

        rerender(<InputNumber value={200} onChange={onChange} />);
        expect(getInput()).toHaveValue('150');
        expect(getInput()).toHaveAttribute('aria-valuenow', '200');
    });

    it('聚焦状态下值超出范围时 componentDidUpdate 触发格式化', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const props = { min: 0, max: 100, onChange };
        const { rerender } = render(<InputNumber {...props} value={50} />);

        focusInput();
        rerender(<InputNumber {...props} value={150} />);
        blurInput();

        expect(getInput()).toHaveValue('100');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(100, expect.anything());
    });

    it('聚焦状态下字符串值超出精度时的 componentDidUpdate', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const props = { precision: 2, onChange };
        const { rerender } = render(<InputNumber {...props} value={50} />);
        expect(getInput()).toHaveValue('50.00');

        focusInput();
        rerender(<InputNumber {...props} value="50.12345" />);
        expect(getInput()).toHaveAttribute('aria-valuenow', '50.12');

        blurInput();
        expect(getInput()).toHaveValue('50.12');
    });

    it('聚焦状态下解析数字相同但格式不同时的 componentDidUpdate', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const { rerender } = render(<InputNumber value={100} onChange={onChange} />);

        focusInput();
        rerender(<InputNumber value="100.00" onChange={onChange} />);

        expect(getInput()).toHaveValue('100');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('聚焦状态下值调整为与 state.number 相同时的 componentDidUpdate', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const props = { max: 100, onChange };
        const { rerender } = render(<InputNumber {...props} value={100} />);

        focusInput();
        rerender(<InputNumber {...props} value={150} />);

        expect(getInput()).toHaveValue('150');
        expect(getInput()).toHaveAttribute('aria-valuenow', '100');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('货币模式下新值按 precision 舍入时 componentDidUpdate 只改显示，不通知', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const props = { currency: 'CNY', precision: 1, onChange };
        const { rerender } = render(<InputNumber {...props} value={100} />);

        rerender(<InputNumber {...props} value={200.44} />);

        expect(getInput()).toHaveValue('¥200.4');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('handleClear 清空值', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        render(<InputNumber defaultValue={100} showClear onChange={onChange} />);
        const clearBtn = document.querySelector(`.${prefixCls}-clearbtn`);
        expect(clearBtn).not.toBeNull();
        fireEvent.mouseDown(clearBtn);

        expect(getInput()).toHaveValue('');
        expect(onChange).toHaveBeenLastCalledWith('', expect.anything());
        expect(getInput()).not.toHaveAttribute('aria-valuenow');
    });

    it('onInput 事件处理', async () => {
        const onInput = vi.fn<InputNumberCallback<'onInput'>>();
        render(<InputNumber defaultValue={100} onInput={onInput} />);

        await userEvent.type(getInput(), '5');

        expect(onInput).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('1005');
    });

    it('货币模式下解析值不同时的 componentDidUpdate', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const { rerender } = render(<InputNumber value={100} currency="CNY" onChange={onChange} />);
        expect(getInput()).toHaveValue('¥100.00');
        expect(onChange).not.toHaveBeenCalled();

        rerender(<InputNumber value={200} currency="CNY" onChange={onChange} />);
        expect(getInput()).toHaveValue('¥200.00');
        expect(getInput()).toHaveAttribute('aria-valuenow', '200');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('registerGlobalEvent 与 unregisterGlobalEvent', () => {
        vi.useFakeTimers();
        render(<InputNumber defaultValue={0} />);
        const advance = (ms) =>
            act(() => {
                vi.advanceTimersByTime(ms);
            });

        hold(getUpButton());
        expect(getInput()).toHaveValue('1');
        advance(numbers.DEFAULT_PRESS_TIMEOUT * 2);
        expect(getInput()).toHaveValue('2');

        fireEvent.pointerMove(getUpButton());
        advance(numbers.DEFAULT_PRESS_TIMEOUT);
        expect(getInput()).toHaveValue('3');

        release(getUpButton());
        advance(numbers.DEFAULT_PRESS_TIMEOUT * 4);
        expect(getInput()).toHaveValue('3');
    });

    it('货币模式下字符串值按 precision 舍入时 componentDidUpdate 只改显示，不通知', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const props = { currency: 'CNY', precision: 2, onChange };
        const { rerender } = render(<InputNumber {...props} value="100" />);

        fireEvent.blur(getInput());
        rerender(<InputNumber {...props} value="200.456" />);

        expect(getInput()).toHaveValue('¥200.46');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('货币模式下 keepFocus 与按钮点击时的 componentDidUpdate', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        render(<ControlledInputNumber currency="CNY" initValue={100} keepFocus onChange={onChange} />);

        press(getUpButton());
        expect(onChange).toHaveBeenLastCalledWith(101, expect.anything());
        expect(getInput()).toHaveFocus();
        expect(getInput()).toHaveValue('101');

        blurInput();
        expect(getInput()).toHaveValue('¥101.00');
    });

    it('货币模式下键盘上下键时的 componentDidUpdate', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        render(<ControlledInputNumber currency="CNY" initValue={100} onChange={onChange} />);

        focusInput();
        keyDown('ArrowUp');
        expect(onChange).toHaveBeenLastCalledWith(101, expect.anything());
        expect(getInput()).toHaveValue('101');

        keyDown('ArrowDown');
        keyDown('ArrowDown');
        expect(onChange).toHaveBeenLastCalledWith(99, expect.anything());
        expect(getInput()).toHaveValue('99');
    });

    it('货币模式下格式化字符串值时的 componentDidUpdate', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const { rerender } = render(<InputNumber value="¥100.00" currency="CNY" onChange={onChange} />);
        expect(getInput()).toHaveValue('¥100.00');
        onChange.mockClear();

        rerender(<InputNumber value="¥200.00" currency="CNY" onChange={onChange} />);

        expect(getInput()).toHaveValue('¥200.00');
        expect(getInput()).toHaveAttribute('aria-valuenow', '200');
        expect(onChange).not.toHaveBeenCalled();
    });

    // a disabled <button> would swallow the mouseup that stops the press-and-hold repeat once onChange disabled the
    // component, so onChange would keep firing forever
    it('OnChangeLimit：长按过程中 onChange 禁用组件时停止重复', () => {
        vi.useFakeTimers();
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        function DisableOnChange() {
            const [disabled, setDisabled] = useState(false);
            return (
                <InputNumber
                    defaultValue={12}
                    disabled={disabled}
                    innerButtons
                    onChange={(v, e) => {
                        onChange(v, e);
                        setDisabled(true);
                    }}
                />
            );
        }
        render(<DisableOnChange />);
        fireEvent.mouseEnter(getWrapper());
        const up = getUpButton();
        hold(up);
        expect(getInput()).toBeDisabled();
        release(up);
        act(() => {
            vi.advanceTimersByTime(numbers.DEFAULT_PRESS_TIMEOUT * 4);
        });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(13, expect.objectContaining({ type: 'pointerdown' }));
        expect(getInput()).toHaveValue('13');
    });

    it('FixPrecision（#431）：点击步进按钮后删除内容，不按精度重新格式化', () => {
        render(<ControlledInputNumber initValue={5.12} precision={2} />);
        press(getUpButton());
        expect(getInput()).toHaveValue('6.12');

        focusInput();
        change('6.1');
        expect(getInput()).toHaveValue('6.1');
        change('6.');
        expect(getInput()).toHaveValue('6.');
    });

    it('FixPrecision786（#786）：删除精度值后输入非法字符，输入框保持为空', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        render(<InputNumber defaultValue={10.0} precision={2} onChange={onChange} />);
        expect(getInput()).toHaveValue('10.00');

        focusInput();
        change('');
        change('aaa');
        blurInput();
        expect(getInput()).toHaveValue('');
        expect(onChange).not.toHaveBeenCalledWith(0, expect.anything());
    });

    it('FixFormValidate（#873）：表单挂载时未校验必填的 Form.InputNumber', async () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        const { container } = render(
            <Form>
                <Form.InputNumber field="inputnumber" label="inputnumber" rules={[{ required: true }]} onChange={onChange} />
            </Form>
        );
        // validation is asynchronous, give a mount-time validation the chance to land
        await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
        expect(onChange).not.toHaveBeenCalled();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-error-message`)).toBeNull();
        expect(getInput()).toHaveValue('');
    });

    describe('Fix1772（#1672）：受控模式下的 formatter 与 parser', () => {
        const minute = 60000;
        const props = {
            formatter: (value) => String(Number(`${value}`.replace(/\D/g, '')) / minute),
            parser: (value) => String(Number(`${value}`.replace(/\D/g, '')) * minute),
            initValue: minute,
            min: minute,
            step: minute,
        };
        const expectStepThrough = () => {
            expect(getInput()).toHaveValue('1');
            press(getUpButton());
            expect(getInput()).toHaveValue('2');
            press(getUpButton());
            expect(getInput()).toHaveValue('3');
            press(getDownButton());
            expect(getInput()).toHaveValue('2');
            press(getDownButton());
            expect(getInput()).toHaveValue('1');
        };

        it('Fix1772（#1672）：步进按钮显示格式化后的值', () => {
            const onChange = vi.fn<InputNumberCallback<'onChange'>>();
            render(<ControlledInputNumber {...props} onChange={onChange} />);
            expectStepThrough();
            expect(lastArg(onChange)).toBe(minute);
        });

        it('Fix1772（#1672）：输入框聚焦时步进按钮显示格式化后的值', () => {
            render(<ControlledInputNumber {...props} />);
            focusInput();
            expectStepThrough();
        });
    });

    it('Fix3025（#3026）：小数步长按 step 精度取整', () => {
        const { unmount } = render(<InputNumber defaultValue={0.14} step={0.01} />);
        press(getUpButton());
        expect(getInput()).toHaveValue('0.15');
        unmount();

        render(<InputNumber defaultValue={0.01} step={0.02} />);
        press(getUpButton());
        expect(getInput()).toHaveValue('0.03');
        press(getDownButton());
        expect(getInput()).toHaveValue('0.01');
    });

    describe('行为基线', () => {
        const advance = (ms) =>
            act(() => {
                vi.advanceTimersByTime(ms);
            });

        it('非受控忽略之后的 defaultValue 变化；受控只显示父组件写回的值', () => {
            const { rerender, unmount } = render(<InputNumber defaultValue={1} />);
            rerender(<InputNumber defaultValue={2} />);
            expect(getInput()).toHaveValue('1');
            unmount();

            const onChange = vi.fn<InputNumberCallback<'onChange'>>();
            render(<InputNumber value={5} onChange={onChange} />);
            press(getUpButton());
            expect(onChange).toHaveBeenLastCalledWith(6, expect.anything());
            expect(getInput()).toHaveValue('5');
            expect(getInput()).toHaveAttribute('aria-valuenow', '5');
        });

        it('输入的值在失焦时夹紧到 min 与 max，按钮在边界处停止', () => {
            const onChange = vi.fn<InputNumberCallback<'onChange'>>();
            render(<InputNumber defaultValue={5} max={10} min={0} onChange={onChange} />);
            focusInput();
            change('20');
            blurInput();
            expect(getInput()).toHaveValue('10');
            expect(lastArg(onChange)).toBe(10);
            expect(getUpButton()).toHaveClass(`${prefixCls}-number-button-up-not-allowed`);
            press(getUpButton());
            expect(getInput()).toHaveValue('10');

            focusInput();
            change('-3');
            blurInput();
            expect(getInput()).toHaveValue('0');
            expect(lastArg(onChange)).toBe(0);
            expect(getDownButton()).toHaveClass(`${prefixCls}-number-button-down-not-allowed`);
            expect(getInput()).toHaveAttribute('aria-valuemin', '0');
            expect(getInput()).toHaveAttribute('aria-valuemax', '10');
        });

        it('Shift 点击按钮按 shiftStep 步进', () => {
            render(<InputNumber defaultValue={0} step={2} shiftStep={50} />);
            press(getUpButton(), { button: numbers.MOUSE_BUTTON_LEFT, shiftKey: true });
            expect(getInput()).toHaveValue('50');
            press(getDownButton());
            expect(getInput()).toHaveValue('48');
        });

        it('输入的值在失焦时按 precision 取整', () => {
            const onChange = vi.fn<InputNumberCallback<'onChange'>>();
            render(<InputNumber precision={2} onChange={onChange} />);
            focusInput();
            change('1.236');
            blurInput();
            expect(getInput()).toHaveValue('1.24');
            expect(lastArg(onChange)).toBe(1.24);
        });

        it('输入时以解析后的数字报告 onChange 与 onNumberChange', () => {
            const onChange = vi.fn<InputNumberCallback<'onChange'>>();
            const onNumberChange = vi.fn<InputNumberCallback<'onNumberChange'>>();
            render(<InputNumber onChange={onChange} onNumberChange={onNumberChange} />);
            change('12');
            expect(getInput()).toHaveValue('12');
            expect(onChange).toHaveBeenLastCalledWith(12, expect.anything());
            expect(onNumberChange).toHaveBeenCalledTimes(1);
            expect(onNumberChange).toHaveBeenLastCalledWith(12, expect.anything());
            change('12.');
            expect(onNumberChange).toHaveBeenCalledTimes(1);
            keyDown('ArrowUp');
            expect(onNumberChange).toHaveBeenCalledTimes(2);
            expect(onNumberChange).toHaveBeenLastCalledWith(13, expect.anything());
        });

        it('失焦时重新格式化输入值，并报告数值变化', () => {
            const onNumberChange = vi.fn<InputNumberCallback<'onNumberChange'>>();
            render(<InputNumber max={10} onNumberChange={onNumberChange} />);
            focusInput();
            change('20');
            expect(onNumberChange).not.toHaveBeenCalled();
            blurInput();
            expect(onNumberChange).toHaveBeenCalledTimes(1);
            expect(onNumberChange).toHaveBeenLastCalledWith(10, expect.anything());
        });

        it('受控更新越界时先不报告数值变化，失焦校正后报告', () => {
            const onNumberChange = vi.fn<InputNumberCallback<'onNumberChange'>>();
            const { rerender } = render(<InputNumber max={100} value={50} onNumberChange={onNumberChange} />);
            rerender(<InputNumber max={100} value={150} onNumberChange={onNumberChange} />);
            expect(getInput()).toHaveValue('150');
            expect(onNumberChange).not.toHaveBeenCalled();

            focusInput();
            blurInput();
            expect(onNumberChange).toHaveBeenCalledTimes(1);
            expect(onNumberChange).toHaveBeenCalledWith(100, expect.anything());
        });

        it('scientificNotation 以指数形式显示长数字，而不是作为 DOM 属性', () => {
            render(<InputNumber defaultValue={120000000} scientificNotation={{ threshold: 5 }} />);
            expect(getInput()).toHaveValue('1.2e+8');
            expect(getInput()).not.toHaveAttribute('scientificnotation');
            focusInput();
            expect(getInput()).toHaveValue('120000000');
        });

        it('聚焦以指数形式显示的越界数字时，同样显示全部位数', () => {
            render(<InputNumber defaultValue={123456789} max={1000} scientificNotation={{ threshold: 5 }} />);
            expect(getInput()).toHaveValue('1.2346e+8');
            focusInput();
            expect(getInput()).toHaveValue('123456789');
        });

        it('聚焦以指数形式显示的数字时，显示全部位数', () => {
            render(<InputNumber defaultValue={123456789} scientificNotation={{ threshold: 5 }} />);
            expect(getInput()).toHaveValue('1.2346e+8');
            focusInput();
            expect(getInput()).toHaveValue('123456789');
            blurInput();
            expect(getInput()).toHaveValue('1.2346e+8');
        });

        // the exponent form keeps only `threshold` digits, so reporting the shown text would hand a controlled parent
        // 123460000 to write back
        it('以指数形式显示的数字报告时不丢失位数', () => {
            const onChange = vi.fn<InputNumberCallback<'onChange'>>();
            render(<InputNumber defaultValue={123456789} scientificNotation={{ threshold: 5 }} onChange={onChange} />);
            focusInput();
            blurInput();
            for (const [value] of onChange.mock.calls) {
                expect(value).toBe(123456789);
            }
        });

        it('受控父组件在挂载与失焦时保留全部位数', () => {
            const onChange = vi.fn<InputNumberCallback<'onChange'>>();
            render(<ControlledInputNumber initValue={123456789} scientificNotation={{ threshold: 5 }} onChange={onChange} />);
            focusInput();
            blurInput();
            expect(getInput()).toHaveValue('1.2346e+8');
            focusInput();
            expect(getInput()).toHaveValue('123456789');
            for (const [value] of onChange.mock.calls) {
                expect(value).toBe(123456789);
            }
        });

        it('受控值更新以指数形式显示，且不会被报告为缩减后的值', () => {
            const onChange = vi.fn<InputNumberCallback<'onChange'>>();
            const props = { scientificNotation: { threshold: 5 }, onChange };
            const { rerender } = render(<InputNumber value={1} {...props} />);
            rerender(<InputNumber value={987654321} {...props} />);
            expect(getInput()).toHaveValue('9.8765e+8');
            for (const [value] of onChange.mock.calls) {
                expect(value).toBe(987654321);
            }
        });

        it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
            semiGlobal.config.overrideDefaultProps = { InputNumber: { step: 5, hideButtons: true } };
            try {
                const { unmount } = render(<InputNumber defaultValue={1} />);
                expect(getButtons()).toBeNull();
                keyDown('ArrowUp');
                expect(getInput()).toHaveValue('6');
                unmount();
                render(<InputNumber defaultValue={1} step={2} hideButtons={false} />);
                expect(getButtons()).not.toBeNull();
                keyDown('ArrowUp');
                expect(getInput()).toHaveValue('3');
            } finally {
                semiGlobal.config.overrideDefaultProps = {};
            }
        });

        it('长按遵循 pressTimeout 与 pressInterval', () => {
            vi.useFakeTimers();
            const onChange = vi.fn<InputNumberCallback<'onChange'>>();
            render(<InputNumber defaultValue={0} pressInterval={100} pressTimeout={500} onChange={onChange} />);
            hold(getUpButton());
            expect(getInput()).toHaveValue('1');
            advance(499);
            expect(getInput()).toHaveValue('1');
            advance(1);
            expect(getInput()).toHaveValue('1');
            // one tick per act, as each browser task renders before the next tick
            advance(100);
            expect(getInput()).toHaveValue('2');
            advance(99);
            expect(getInput()).toHaveValue('2');
            advance(1);
            advance(100);
            expect(getInput()).toHaveValue('4');
            release(getUpButton());
            advance(1000);
            expect(getInput()).toHaveValue('4');
            expect(onChange).toHaveBeenCalledTimes(4);
        });

        it('长按向最新的回调报告', () => {
            vi.useFakeTimers();
            const first = vi.fn<InputNumberCallback<'onChange'>>();
            const second = vi.fn<InputNumberCallback<'onChange'>>();
            const { rerender } = render(<InputNumber defaultValue={0} onChange={first} />);
            hold(getUpButton());
            expect(first).toHaveBeenCalledTimes(1);
            rerender(<InputNumber defaultValue={0} onChange={second} />);
            advance(numbers.DEFAULT_PRESS_TIMEOUT * 2);
            expect(first).toHaveBeenCalledTimes(1);
            expect(second).toHaveBeenCalledTimes(1);
            expect(second).toHaveBeenLastCalledWith(2, expect.anything());
            release(getUpButton());
        });

        it('长按过程中卸载会停止重复', () => {
            vi.useFakeTimers();
            const onChange = vi.fn<InputNumberCallback<'onChange'>>();
            const { unmount } = render(<InputNumber defaultValue={0} onChange={onChange} />);
            hold(getUpButton());
            unmount();
            advance(numbers.DEFAULT_PRESS_TIMEOUT * 5);
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(vi.getTimerCount()).toBe(0);
        });

        it('按下时指针被捕获到按下的那个按钮上', () => {
            render(<InputNumber defaultValue={0} />);
            const up = getUpButton();
            const capture = vi.spyOn(up, 'setPointerCapture');
            hold(up, { button: numbers.MOUSE_BUTTON_LEFT, pointerId: 7 });
            expect(capture).toHaveBeenCalledWith(7);
            release(up);
        });

        it('方向键步进，阻止默认的光标移动，且仍触发 onKeyDown；其他按键正常传递', () => {
            const onKeyDown = vi.fn<InputNumberCallback<'onKeyDown'>>();
            render(<InputNumber defaultValue={1} onKeyDown={onKeyDown} />);
            const notPrevented = fireEvent.keyDown(getInput(), { key: 'ArrowUp' });
            expect(notPrevented).toBe(false);
            expect(getInput()).toHaveValue('2');
            const enter = fireEvent.keyDown(getInput(), { key: 'Enter' });
            expect(enter).toBe(true);
            expect(getInput()).toHaveValue('2');
            expect(onKeyDown).toHaveBeenCalledTimes(2);
        });

        it('输入法组合结束后，组合模式只报告一次', () => {
            const onChange = vi.fn<InputNumberCallback<'onChange'>>();
            const onCompositionStart = vi.fn<InputNumberCallback<'onCompositionStart'>>();
            const onCompositionEnd = vi.fn<InputNumberCallback<'onCompositionEnd'>>();
            render(<InputNumber composition onChange={onChange} onCompositionEnd={onCompositionEnd} onCompositionStart={onCompositionStart} />);
            fireEvent.compositionStart(getInput());
            change('12');
            expect(onChange).not.toHaveBeenCalled();
            fireEvent.compositionEnd(getInput(), { target: { value: '12' } });
            expect(onCompositionStart).toHaveBeenCalledTimes(1);
            expect(onCompositionEnd).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenLastCalledWith(12, expect.anything());
            expect(getInput()).toHaveValue('12');
        });

        it('Form 重置后恢复初始值', () => {
            let formApi;
            render(
                <Form getFormApi={(api) => (formApi = api)} initValues={{ amount: 5 }}>
                    <Form.InputNumber field="amount" />
                </Form>
            );
            expect(getInput()).toHaveValue('5');
            change('8');
            expect(formApi.getValue('amount')).toBe(8);
            void act(() => formApi.reset());
            expect(getInput()).toHaveValue('5');
            expect(formApi.getValue('amount')).toBe(5);
            void act(() => formApi.setValue('amount', 12));
            expect(getInput()).toHaveValue('12');
        });

        it('ref 是句柄，其 focus 与 blur 驱动焦点样式', () => {
            const ref = createRef<InputNumberHandle>();
            render(<InputNumber ref={ref} defaultValue={3} />);
            expect(ref.current).not.toBe(getInput());
            act(() => ref.current?.focus());
            expect(getInput()).toHaveFocus();
            expect(document.querySelector(`.${prefixCls}-wrapper-focus`)).not.toBeNull();
            act(() => ref.current?.blur());
            expect(document.querySelector(`.${prefixCls}-wrapper-focus`)).toBeNull();
        });

        it('句柄暴露原生 input 与根节点，卸载后置为 null', () => {
            const ref = createRef<InputNumberHandle>();
            const { unmount } = render(<InputNumber ref={ref} defaultValue={3} />);
            const handle = ref.current;
            expect(handle?.input).toBe(getInput());
            expect(handle?.nativeElement).toBe(getWrapper());
            unmount();
            expect(handle?.input).toBeNull();
            expect(handle?.nativeElement).toBeNull();
        });

        it('句柄的 select、设置选区与 focus 选项透传', () => {
            const ref = createRef<InputNumberHandle>();
            render(<InputNumber ref={ref} defaultValue={12345} />);
            act(() => ref.current?.select());
            expect([getInput().selectionStart, getInput().selectionEnd]).toEqual([0, 5]);
            act(() => ref.current?.setSelectionRange(1, 3));
            expect([getInput().selectionStart, getInput().selectionEnd]).toEqual([1, 3]);
            const focus = vi.spyOn(getInput(), 'focus');
            ref.current?.focus({ preventScroll: true });
            expect(focus).toHaveBeenLastCalledWith({ preventScroll: true });
        });

        it('句柄的 focus 使用 preventScroll 属性，除非选项另有指定', () => {
            const ref = createRef<InputNumberHandle>();
            render(<InputNumber ref={ref} defaultValue={3} preventScroll />);
            const focus = vi.spyOn(getInput(), 'focus');
            ref.current?.focus();
            expect(focus).toHaveBeenLastCalledWith({ preventScroll: true });
            ref.current?.focus({ preventScroll: false });
            expect(focus).toHaveBeenLastCalledWith({ preventScroll: false });
        });

        it('表单字段转发句柄 ref', () => {
            const ref = createRef<InputNumberHandle>();
            render(
                <Form>
                    <Form.InputNumber ref={ref} field="amount" label="Amount" />
                </Form>
            );
            expect(ref.current?.input).toBe(getInput());
        });

        it('未知属性、aria 与 focus 属性透传到原生 input，className 与 style 作用于数字外层容器', () => {
            render(<InputNumber id="amount-id" name="amount" className="custom" style={{ color: 'red' }} data-testid="amount" aria-label="Amount" tabIndex={-1} defaultValue={1} />);
            const input = getInput();
            expect(screen.getByTestId('amount')).toBe(input);
            expect(input).toHaveAttribute('aria-label', 'Amount');
            expect(input).toHaveAttribute('name', 'amount');
            expect(input).toHaveAttribute('tabindex', '-1');
            expect(input).toHaveAttribute('id', 'amount-id');
            expect(getWrapper()).toHaveClass('custom');
            expect(getWrapper()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
            for (const attr of ['data-testid', 'aria-label', 'name', 'tabindex', 'id']) {
                expect(getWrapper()).not.toHaveAttribute(attr);
            }
            expect(input).not.toHaveClass('custom');
        });

        it('StrictMode 下每次按下与每次重复各步进一次', () => {
            vi.useFakeTimers();
            const onChange = vi.fn<InputNumberCallback<'onChange'>>();
            render(
                <StrictMode>
                    <InputNumber defaultValue={0} onChange={onChange} />
                </StrictMode>
            );
            press(getUpButton());
            expect(getInput()).toHaveValue('1');
            expect(onChange).toHaveBeenCalledTimes(1);

            hold(getUpButton());
            advance(numbers.DEFAULT_PRESS_TIMEOUT * 2);
            release(getUpButton());
            advance(numbers.DEFAULT_PRESS_TIMEOUT * 4);
            expect(getInput()).toHaveValue('3');
            expect(onChange).toHaveBeenCalledTimes(3);

            keyDown('ArrowUp');
            expect(getInput()).toHaveValue('4');
            expect(onChange).toHaveBeenCalledTimes(4);
        });

        it('StrictMode 下受控值在挂载与更新时都会格式化，且格式化本身不触发 onChange', () => {
            const onChange = vi.fn<InputNumberCallback<'onChange'>>();
            const { rerender } = render(
                <StrictMode>
                    <InputNumber value={1} precision={2} onChange={onChange} />
                </StrictMode>
            );
            expect(getInput()).toHaveValue('1.00');
            rerender(
                <StrictMode>
                    <InputNumber value={2} precision={2} onChange={onChange} />
                </StrictMode>
            );
            expect(getInput()).toHaveValue('2.00');
            expect(onChange).not.toHaveBeenCalled();
        });

        it('StrictMode 下受控越界值挂载时不回报，显示原值', () => {
            const onChange = vi.fn<InputNumberCallback<'onChange'>>();
            const onNumberChange = vi.fn<InputNumberCallback<'onNumberChange'>>();
            render(
                <StrictMode>
                    <InputNumber max={10} value={50} onChange={onChange} onNumberChange={onNumberChange} />
                </StrictMode>
            );
            expect(getInput()).toHaveValue('50');
            expect(getInput()).toHaveAttribute('aria-valuenow', '50');
            expect(onChange).not.toHaveBeenCalled();
            expect(onNumberChange).not.toHaveBeenCalled();
        });
    });

    describe('越界值只在用户操作后校正', () => {
        it.each([
            // a controlled value keeps showing what the parent holds until the parent accepts the reported number
            ['受控 max', { max: 10, value: 50 }, '50', 10, '50'],
            ['受控 min', { min: 10, value: 5 }, '5', 10, '5'],
            ['非受控 defaultValue', { max: 10, defaultValue: 50 }, '50', 10, '10'],
        ])('%s：挂载显示原值且不回报，失焦校正并只回报一次', (_, props: InputNumberProps, shown, clamped, shownAfterBlur) => {
            const onChange = vi.fn<InputNumberCallback<'onChange'>>();
            const onNumberChange = vi.fn<InputNumberCallback<'onNumberChange'>>();
            render(<InputNumber {...props} onChange={onChange} onNumberChange={onNumberChange} />);
            expect(getInput()).toHaveValue(shown);
            expect(getInput()).toHaveAttribute('aria-valuenow', shown);
            expect(onChange).not.toHaveBeenCalled();
            expect(onNumberChange).not.toHaveBeenCalled();

            focusInput();
            blurInput();
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith(clamped, expect.anything());
            expect(onNumberChange).toHaveBeenCalledTimes(1);
            expect(getInput()).toHaveValue(shownAfterBlur);
            expect(getInput()).toHaveAttribute('aria-valuenow', shownAfterBlur);
        });

        it('受控值变为越界值时显示原值且不回报', () => {
            const onChange = vi.fn<InputNumberCallback<'onChange'>>();
            const { rerender } = render(<InputNumber max={10} value={5} onChange={onChange} />);
            rerender(<InputNumber max={10} value={50} onChange={onChange} />);
            expect(getInput()).toHaveValue('50');
            expect(getInput()).toHaveAttribute('aria-valuenow', '50');
            expect(onChange).not.toHaveBeenCalled();
        });

        it('越界的受控值经步进按钮落回边界并回报一次', () => {
            const onChange = vi.fn<InputNumberCallback<'onChange'>>();
            render(<ControlledInputNumber max={10} initValue={50} onChange={onChange} />);
            press(getDownButton());
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith(10, expect.anything());
            expect(getInput()).toHaveValue('10');
        });

        it.each([
            ['超过 max 时向上', { max: 10, defaultValue: 50 }, 'ArrowUp', getUpButton, 'up', '50'],
            ['低于 min 时向下', { min: 10, defaultValue: 5 }, 'ArrowDown', getDownButton, 'down', '5'],
        ])('%s的按钮不可用，按钮与方向键都不改值', (_, props: InputNumberProps, key, getButton, direction, shown) => {
            const onChange = vi.fn<InputNumberCallback<'onChange'>>();
            render(<InputNumber {...props} onChange={onChange} />);
            expect(getButton()).toHaveClass(`${prefixCls}-number-button-${direction}-not-allowed`);
            press(getButton() as HTMLElement);
            focusInput();
            keyDown(key);
            expect(getInput()).toHaveValue(shown);
            expect(onChange).not.toHaveBeenCalled();
        });

        it('空值时边界不挡步进', () => {
            render(<InputNumber max={-5} min={-10} />);
            expect(getUpButton()).not.toHaveClass(`${prefixCls}-number-button-up-not-allowed`);
            expect(getDownButton()).not.toHaveClass(`${prefixCls}-number-button-down-not-allowed`);
        });
    });

    it('货币模式聚焦步进后，受控与非受控的输入框文本一致', () => {
        const props = { currency: 'USD', localeCode: 'en-US' };
        const { unmount } = render(<InputNumber {...props} defaultValue={100} />);
        focusInput();
        keyDown('ArrowUp');
        const uncontrolled = getInput().value;
        unmount();

        render(<ControlledInputNumber {...props} initValue={100} />);
        focusInput();
        keyDown('ArrowUp');
        expect(getInput()).toHaveValue(uncontrolled);
    });

    it('hideButtons 与 innerButtons 同时为 true 时悬停和聚焦都不显示按钮', () => {
        render(<InputNumber defaultValue={1} hideButtons innerButtons />);
        fireEvent.mouseEnter(getWrapper());
        expect(getButtons()).toBeNull();
        focusInput();
        expect(getButtons()).toBeNull();
    });

    it('键盘在边界处值未变时不触发 onChange', () => {
        const onChange = vi.fn<InputNumberCallback<'onChange'>>();
        render(<InputNumber defaultValue={5} max={5} min={5} onChange={onChange} />);
        keyDown('ArrowUp');
        keyDown('ArrowDown');
        keyDown('Home');
        keyDown('End');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('两个指针先后按下同一按钮后松开，不留下继续步进的孤儿定时器', () => {
        vi.useFakeTimers();
        try {
            render(<InputNumber defaultValue={0} pressInterval={100} />);
            const advance = (ms: number) =>
                act(() => {
                    vi.advanceTimersByTime(ms);
                });
            hold(getUpButton());
            hold(getUpButton());
            release(getUpButton());
            expect(getInput()).toHaveValue('2');
            // a later press re-arms the shared flag, which would revive an orphaned interval
            hold(getUpButton());
            expect(getInput()).toHaveValue('3');
            advance(numbers.DEFAULT_PRESS_TIMEOUT);
            advance(500);
            expect(getInput()).toHaveValue('8');
        } finally {
            vi.useRealTimers();
        }
    });

    describe('修饰键、长按边界与键盘步进后的受控输入', () => {
        const advance = (ms: number) =>
            act(() => {
                vi.advanceTimersByTime(ms);
            });

        it.each([
            ['Home', { shiftKey: true }],
            ['Home', { ctrlKey: true }],
            ['End', { altKey: true }],
            ['ArrowUp', { metaKey: true }],
            ['ArrowDown', { altKey: true }],
        ])('带修饰键的 %s 不步进、不跳边界，也不阻止浏览器的默认行为 %o', (key, modifier) => {
            const onChange = vi.fn<InputNumberCallback<'onChange'>>();
            const onKeyDown = vi.fn<InputNumberCallback<'onKeyDown'>>();
            render(<InputNumber defaultValue={5} max={10} min={0} onChange={onChange} onKeyDown={onKeyDown} />);
            expect(keyDown(key, modifier)).toBe(true);
            expect(getInput()).toHaveValue('5');
            expect(onChange).not.toHaveBeenCalled();
            expect(onKeyDown).toHaveBeenCalledTimes(1);
        });

        it('onUpClick 与 onDownClick 的事件类型是按钮 span 上的 PointerEvent', () => {
            expectTypeOf<Parameters<InputNumberCallback<'onUpClick'>>[1]>().toEqualTypeOf<React.PointerEvent<HTMLSpanElement>>();
            expectTypeOf<Parameters<InputNumberCallback<'onDownClick'>>[1]>().toEqualTypeOf<React.PointerEvent<HTMLSpanElement>>();
        });

        it('Shift 加 ArrowUp 仍按 shiftStep 步进', () => {
            render(<InputNumber defaultValue={5} shiftStep={3} />);
            keyDown('ArrowUp', { shiftKey: true });
            expect(getInput()).toHaveValue('8');
        });

        it('键盘步进后继续打字，受控的 precision 不把输入中的文本按步进重新格式化', () => {
            render(<ControlledInputNumber initValue={5.12} precision={2} />);
            focusInput();
            keyDown('ArrowUp');
            expect(getInput()).toHaveValue('6.12');
            change('6.1');
            expect(getInput()).toHaveValue('6.1');
        });

        it('pressTimeout 为 0 时长按立即进入连发', () => {
            vi.useFakeTimers();
            render(<InputNumber defaultValue={0} pressInterval={100} pressTimeout={0} />);
            hold(getUpButton());
            expect(getInput()).toHaveValue('1');
            advance(100);
            expect(getInput()).toHaveValue('2');
            release(getUpButton());
        });

        it('长按到 max 后停止连发，不再重复触发 onUpClick', () => {
            vi.useFakeTimers();
            const onUpClick = vi.fn<InputNumberCallback<'onUpClick'>>();
            render(<InputNumber defaultValue={9} max={10} pressInterval={100} onUpClick={onUpClick} />);
            hold(getUpButton());
            expect(getInput()).toHaveValue('10');
            advance(numbers.DEFAULT_PRESS_TIMEOUT + 500);
            expect(onUpClick).toHaveBeenCalledTimes(1);
            expect(vi.getTimerCount()).toBe(0);
            release(getUpButton());
        });

        it('长按过程中被禁用，连发立即停止', () => {
            vi.useFakeTimers();
            const onChange = vi.fn<InputNumberCallback<'onChange'>>();
            const { rerender } = render(<InputNumber defaultValue={0} pressInterval={100} onChange={onChange} />);
            hold(getUpButton());
            advance(numbers.DEFAULT_PRESS_TIMEOUT + 100);
            const reported = onChange.mock.calls.length;
            rerender(<InputNumber defaultValue={0} disabled pressInterval={100} onChange={onChange} />);
            advance(500);
            expect(onChange).toHaveBeenCalledTimes(reported);
            release(getUpButton());
        });
    });
});
