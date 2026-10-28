/** @jsxImportSource vue */
import { KeepAlive, defineComponent, nextTick, onUpdated, ref, shallowRef } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { numbers } from '@fibrae/semi-foundation/input-number/constants';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import de from '@fibrae/semi-foundation/locale/source/de';
import { IconSearch } from '@fibrae/semi-icons-vue';
import { render } from '@test/utils/vue';
import InputNumber, { type InputNumberChangeEvent, type InputNumberHandle, type InputNumberProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import { LocaleProvider } from '../../locale';
import Controlled from './fixtures/controlled.vue';
import InGroup from './fixtures/in-group.vue';
import OneWay from './fixtures/one-way.vue';

type Change = (value: number | string, event: InputNumberChangeEvent) => void;
type NumberChange = (value: number, event: InputNumberChangeEvent) => void;
type Click = (value: string, event: PointerEvent) => void;
type FocusHandler = (event: FocusEvent) => void;
type KeyHandler = (event: KeyboardEvent) => void;
type Props = InputNumberProps & Record<string, unknown>;

const prefixCls = `${BASE_CLASS_PREFIX}-input`;

const getInput = () => screen.getByRole<HTMLInputElement>('spinbutton');
const getButtons = () => document.querySelector(`.${prefixCls}-number-suffix-btns`);
const getUpButton = () => document.querySelector(`.${prefixCls}-number-suffix-btns .${prefixCls}-number-button-up`) as HTMLElement;
const getDownButton = () => document.querySelector(`.${prefixCls}-number-suffix-btns .${prefixCls}-number-button-down`) as HTMLElement;
const getWrapper = () => document.querySelector(`.${prefixCls}-number`) as HTMLElement;

const mount = async (props: Props = {}, attrs: Record<string, unknown> = {}) => {
    const view = render(InputNumber, { props, attrs });
    await nextTick();
    return view;
};
const mountControlled = async (initValue: number | string, attrs: Record<string, unknown> = {}, onChange?: Change) => {
    const view = render(Controlled, { props: { initValue, onChange }, attrs });
    await nextTick();
    return view;
};

const hold = (button: Element, init: PointerEventInit = { button: numbers.MOUSE_BUTTON_LEFT }) => fireEvent.pointerDown(button, init);
// the button captures the pointer, so the browser fires lostpointercapture on it after pointerup wherever that lands
const release = async (button: Element) => {
    await fireEvent.pointerUp(button);
    await fireEvent.lostPointerCapture(button);
};
const press = async (button: Element, init?: PointerEventInit) => {
    await hold(button, init);
    await release(button);
};
const pressTimes = async (getButton: () => Element, count: number, init?: PointerEventInit) => {
    for (let i = 0; i < count; i++) {
        await press(getButton(), init);
    }
};
const change = (value: string) => fireEvent.update(getInput(), value);
const keyDown = (key: string, init: KeyboardEventInit = {}) => fireEvent.keyDown(getInput(), { key, ...init });
// Testing Library's Vue fireEvent resolves to nothing, so the default action is read from a dispatched event
const dispatchKey = async (key: string, input: HTMLElement = getInput()) => {
    const notPrevented = input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    await nextTick();
    return notPrevented;
};
const focusInput = async () => {
    getInput().focus();
    await nextTick();
};
const blurInput = async () => {
    getInput().blur();
    await nextTick();
};
const advance = async (ms: number) => {
    vi.advanceTimersByTime(ms);
    await nextTick();
};
const lastArg = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls[spy.mock.calls.length - 1][0];

const thousands = (value: number | string) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const removeThousands = (value: string) => value.replace(/,/g, '');

// A function ref receives the handle that defineExpose builds
const renderWithHandle = async (props: Props = {}) => {
    let handle: InputNumberHandle | null = null;
    const view = render({
        render: () => (
            <InputNumber
                {...props}
                ref={(value) => {
                    handle = value as InputNumberHandle | null;
                }}
            />
        ),
    });
    await nextTick();
    return { ...view, handle: () => handle as unknown as InputNumberHandle };
};
const renderCountingUpdates = async (props: Props) => {
    const updated = vi.fn<() => void>();
    render({ render: () => <InputNumber {...props} onVnodeUpdated={updated} /> });
    await nextTick();
    return updated;
};

describe('InputNumber', () => {
    afterEach(() => {
        vi.useRealTimers();
        semiGlobal.config.overrideDefaultProps = {};
    });

    it(`使用 'defaultValue'、'showClear'、'size'、'suffix'、ref`, async () => {
        const defaultValue = 1020;
        const sizes = ['default', 'large', 'small'] as const;
        for (const size of sizes) {
            const view = await mount({ defaultValue, showClear: true, size });
            expect(getInput()).toHaveClass(`${prefixCls}-${size}`);
            expect(getInput()).toHaveValue('1020');
            expect(getButtons()).not.toBeNull();
            view.unmount();
        }

        const withoutButtons = await mount({ defaultValue, hideButtons: true });
        expect(getButtons()).toBeNull();
        withoutButtons.unmount();

        const { handle } = await renderWithHandle({ defaultValue });
        expect(handle().input).toBe(getInput());
    });

    it('使用 modelValue 与 blur、change、focus、keydown 事件', async () => {
        const onChange = vi.fn<Change>();
        const onBlur = vi.fn<FocusHandler>();
        const onFocus = vi.fn<FocusHandler>();
        const onKeydown = vi.fn<KeyHandler>();
        const oldValue = 1020;
        const newValue = 1301;
        const newValidStr = '1309';
        const newInvalidValue = '1301fd';

        const view = await mount({ modelValue: oldValue, onChange, onBlur, onFocus, onKeydown });
        expect(onChange).not.toHaveBeenCalled();

        await change(newInvalidValue);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(newInvalidValue, expect.anything());

        await focusInput();
        expect(onFocus).toHaveBeenCalledTimes(1);
        await view.rerender({ modelValue: newInvalidValue });
        await blurInput();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue(oldValue.toString());

        await view.rerender({ modelValue: '' });
        expect(getInput()).toHaveValue('');

        await focusInput();
        await view.rerender({ modelValue: newValue });
        await blurInput();
        expect(getInput()).toHaveValue(newValue.toString());

        await focusInput();
        await view.rerender({ modelValue: newInvalidValue });
        await blurInput();
        expect(getInput()).toHaveValue(newValue.toString());

        await focusInput();
        await view.rerender({ modelValue: newValidStr });
        await blurInput();
        expect(getInput()).toHaveValue(newValidStr);

        onChange.mockClear();
        await keyDown('ArrowUp');
        await keyDown('ArrowUp');
        await keyDown('ArrowUp');
        expect(lastArg(onChange)).toBe(Number(newValidStr) + 1);
        await keyDown('ArrowDown');
        expect(lastArg(onChange)).toBe(Number(newValidStr) - 1);
        expect(onKeydown).toHaveBeenCalledTimes(4);
        expect(getInput()).toHaveValue(newValidStr);
    });

    it(`使用 'max'、'min'、modelValue、change、'precision'、'parser'、'formatter'`, async () => {
        const oldValue = 1020.245;
        const newValue = 1302.921;
        const min = 1000;
        const max = 1300;
        const precision = 2;
        const formatter = (value: number | string) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        const parser = (value: string) => value.replace(/\$\s?|(,*)/g, '');
        const onChange = vi.fn<Change>();
        const onBlur = vi.fn<FocusHandler>();

        const view = await mount({ modelValue: oldValue, onChange, onBlur, min, max, precision, formatter, parser });
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue(formatter(oldValue.toFixed(precision)));

        await change(String(newValue));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toEqual(Number(newValue.toFixed(precision)));
        expect(getInput()).toHaveValue(formatter(newValue));

        await focusInput();
        await blurInput();
        expect(onBlur).toHaveBeenCalledTimes(1);
        const changes = onChange.mock.calls.length;

        await view.rerender({ modelValue: newValue });
        expect(getInput()).toHaveValue(formatter(newValue.toFixed(precision)));

        await view.rerender({ modelValue: min - 100 });
        expect(getInput()).toHaveValue(formatter((min - 100).toFixed(precision)));
        expect(onChange).toHaveBeenCalledTimes(changes);
    });

    it('父组件改受控值后，父组件的 onUpdated 读到新的输入框文本', async () => {
        const seen: (string | undefined)[] = [];
        const Parent = defineComponent({
            props: { value: { type: Number, required: true } },
            setup(props) {
                const host = shallowRef<HTMLElement>();
                onUpdated(() => seen.push(host.value?.querySelector('input')?.value));
                return () => (
                    <div ref={host}>
                        <InputNumber modelValue={props.value} />
                    </div>
                );
            },
        });
        const view = render(Parent, { props: { value: 1 } });
        await view.rerender({ value: 2 });
        expect(seen).toEqual(['2']);
    });

    it('受控值被精度改写时只改显示，不发出 numberChange', async () => {
        const onNumberChange = vi.fn<NumberChange>();
        const view = await mount({ modelValue: 1, precision: 1, onNumberChange });
        await view.rerender({ modelValue: 2.26 });
        expect(getInput()).toHaveValue('2.3');
        expect(onNumberChange).not.toHaveBeenCalled();
    });

    it('点击加减按钮，发出 upClick、downClick', async () => {
        const onUpClick = vi.fn<Click>();
        const onDownClick = vi.fn<Click>();
        await mount({ defaultValue: 1000, onUpClick, onDownClick });

        await pressTimes(getUpButton, 3);
        await pressTimes(getDownButton, 1);

        expect(getInput()).toHaveValue('1002');
        expect(onUpClick).toHaveBeenCalledTimes(3);
        expect(onUpClick).toHaveBeenLastCalledWith('1003', expect.any(PointerEvent));
        expect(onDownClick).toHaveBeenCalledTimes(1);
        expect(onDownClick).toHaveBeenLastCalledWith('1002', expect.any(PointerEvent));
    });

    it('点击内置加减按钮，发出 upClick、downClick', async () => {
        const onUpClick = vi.fn<Click>();
        const onDownClick = vi.fn<Click>();
        await mount({ defaultValue: 1000, innerButtons: true, onUpClick, onDownClick });
        expect(getButtons()).toBeNull();
        await fireEvent.mouseEnter(getWrapper());
        expect(getButtons()).toHaveClass(`${prefixCls}-number-suffix-btns-inner`);
        expect(getButtons()).toHaveClass(`${prefixCls}-number-suffix-btns-inner-hover`);

        await pressTimes(getUpButton, 3);
        await pressTimes(getDownButton, 1);

        expect(getInput()).toHaveValue('1002');
        expect(onUpClick).toHaveBeenCalledTimes(3);
        expect(onDownClick).toHaveBeenCalledTimes(1);
    });

    it('shiftStep 属性', async () => {
        const view = await mount({ defaultValue: 0, shiftStep: 100 });
        await keyDown('ArrowUp', { shiftKey: true });
        expect(getInput()).toHaveValue('100');
        await keyDown('ArrowUp');
        expect(getInput()).toHaveValue('101');

        await view.rerender({ shiftStep: 5 });
        await keyDown('ArrowDown', { shiftKey: true });
        expect(getInput()).toHaveValue('96');
    });

    it('焦点在输入框与步进按钮之间移动时 focus 与 blur 不重复触发', async () => {
        const onBlur = vi.fn<FocusHandler>();
        const onFocus = vi.fn<FocusHandler>();
        await mount({ defaultValue: 1, onBlur, onFocus });

        await focusInput();
        expect(onFocus).toHaveBeenCalledTimes(1);
        await pressTimes(getUpButton, 2);
        await pressTimes(getDownButton, 1);
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();

        await blurInput();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('keepFocus 属性', async () => {
        const onBlur = vi.fn<FocusHandler>();
        const onFocus = vi.fn<FocusHandler>();
        const view = await mount({ defaultValue: 1, keepFocus: true, onBlur, onFocus });

        expect(document.querySelector(`.${prefixCls}-wrapper-focus`)).toBeNull();
        expect(getInput()).not.toHaveFocus();

        await pressTimes(getUpButton, 3);
        await pressTimes(getDownButton, 1);
        expect(getInput()).toHaveValue('3');
        expect(getInput()).toHaveFocus();
        expect(document.querySelector(`.${prefixCls}-wrapper-focus`)).not.toBeNull();
        expect(onFocus).toHaveBeenCalled();

        await blurInput();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getInput()).not.toHaveFocus();

        await view.rerender({ keepFocus: false });
        await press(getUpButton());
        expect(getInput()).toHaveValue('4');
        expect(getInput()).not.toHaveFocus();
    });

    it('受控值超出范围', async () => {
        const onChange = vi.fn<Change>();
        const onNumberChange = vi.fn<NumberChange>();
        await mount({ max: 100, modelValue: 100, onChange, onNumberChange });
        await change('101');

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(101, expect.anything());
        expect(onNumberChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveAttribute('aria-valuenow', '100');
    });

    it('受控值为 NaN', async () => {
        const view = await mount({ modelValue: 1 });
        expect(getInput()).toHaveValue('1');
        expect(getInput()).toHaveAttribute('aria-valuenow', '1');

        await view.rerender({ modelValue: NaN });
        expect(getInput()).toHaveValue('');
        expect(getInput()).not.toHaveAttribute('aria-valuenow');
    });

    it('aria-valuenow 为普通十进制数，包括 0', async () => {
        const view = await mount({ modelValue: 0 });
        expect(getInput()).toHaveAttribute('aria-valuenow', '0');
        await view.rerender({ modelValue: 1.235e-7 });
        expect(getInput()).toHaveAttribute('aria-valuenow', '0.0000001235');
    });

    it('挂载时受控值为 NaN', async () => {
        const onChange = vi.fn<Change>();
        const plain = await mount({ modelValue: NaN, onChange });
        expect(getInput()).toHaveValue('');
        expect(getInput()).not.toHaveAttribute('aria-valuenow');
        plain.unmount();

        await mount({ modelValue: NaN, currency: 'CNY', onChange });
        expect(getInput()).toHaveValue('');
        expect(getInput()).not.toHaveAttribute('aria-valuenow');
    });

    it('修复数字减法的 bug', async () => {
        await mount({ defaultValue: 0.9, max: 1, step: 0.1 });
        await press(getUpButton());
        expect(getInput()).toHaveValue('1');
        expect(getUpButton()).toHaveClass(`${prefixCls}-number-button-up-not-allowed`);
    });

    it('受控模式下 formatter 滤掉非数字后，numberChange 只报告数字', async () => {
        const onNumberChange = vi.fn<NumberChange>();
        await mountControlled('', {
            formatter: (value: number | string) => `${value}`.replace(/\D/g, ''),
            onNumberChange,
        });

        await change('abc');
        expect(onNumberChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue('');

        await change('123');
        expect(onNumberChange).toHaveBeenCalledTimes(1);
        expect(onNumberChange.mock.calls[0][0]).toBe(123);
        expect(getInput()).toHaveValue('123');
    });

    it('右键点击加减按钮', async () => {
        const onUpClick = vi.fn<Click>();
        const onDownClick = vi.fn<Click>();
        const MOUSE_BUTTON_RIGHT = 2;
        await mount({ defaultValue: 1000, onUpClick, onDownClick });

        await pressTimes(getUpButton, 1, { button: MOUSE_BUTTON_RIGHT });
        await pressTimes(getDownButton, 3, { button: MOUSE_BUTTON_RIGHT });

        expect(getInput()).toHaveValue('1000');
        expect(onUpClick).not.toHaveBeenCalled();
        expect(onDownClick).not.toHaveBeenCalled();
    });

    it.each([
        ['受控 min', { min: 1, modelValue: 0 }, '0', 1],
        ['受控 max', { max: 10, modelValue: 50 }, '50', 10],
        ['非受控 defaultValue', { max: 10, defaultValue: 50 }, '50', 10],
    ] as Array<[string, Props, string, number]>)('%s 越界：挂载显示原值且不发出事件，失焦校正并只发出一次', async (_, props, shown, clamped) => {
        const onChange = vi.fn<Change>();
        const onUpdate = vi.fn<(value: number | string) => void>();
        const onNumberChange = vi.fn<NumberChange>();
        await mount({ ...props, onChange, 'onUpdate:modelValue': onUpdate, onNumberChange });
        expect(getInput()).toHaveValue(shown);
        expect(getInput()).toHaveAttribute('aria-valuenow', shown);
        expect(onChange).not.toHaveBeenCalled();
        expect(onUpdate).not.toHaveBeenCalled();
        expect(onNumberChange).not.toHaveBeenCalled();

        await focusInput();
        await blurInput();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe(clamped);
        expect(onUpdate).toHaveBeenCalledTimes(1);
        expect(onNumberChange).toHaveBeenCalledTimes(1);
    });

    it('受控值变为越界值时显示原值，不发出事件', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ min: 1, modelValue: 5, onChange });
        await view.rerender({ modelValue: 0 });
        expect(getInput()).toHaveValue('0');
        expect(getInput()).toHaveAttribute('aria-valuenow', '0');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('KeepAlive 失活再激活时，越界的受控值显示原值且不发出事件', async () => {
        const onChange = vi.fn<Change>();
        const active = ref(true);
        const Host = defineComponent(() => () => <KeepAlive>{active.value ? <InputNumber max={10} modelValue={50} onChange={onChange} /> : null}</KeepAlive>);
        render(Host);
        await nextTick();
        active.value = false;
        await nextTick();
        active.value = true;
        await nextTick();
        expect(getInput()).toHaveValue('50');
        expect(onChange).not.toHaveBeenCalled();
    });

    it.each([
        ['超过 max 时向上', { max: 10, defaultValue: 50 }, 'ArrowUp', getUpButton, 'up', '50'],
        ['低于 min 时向下', { min: 10, defaultValue: 5 }, 'ArrowDown', getDownButton, 'down', '5'],
    ] as Array<[string, Props, string, () => HTMLElement, string, string]>)('%s的按钮不可用，按钮与方向键都不改值', async (_, props, key, getButton, direction, shown) => {
        const onChange = vi.fn<Change>();
        await mount({ ...props, onChange });
        expect(getButton()).toHaveClass(`${prefixCls}-number-button-${direction}-not-allowed`);
        await press(getButton());
        await focusInput();
        await dispatchKey(key);
        expect(getInput()).toHaveValue(shown);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('常见货币显示', async () => {
        const defaultValue = 123456.78;
        const cases: Array<[Props, string]> = [
            [{ currency: 'CNY' }, '¥123,456.78'],
            [{ localeCode: 'en-US', currency: 'USD' }, '$123,456.78'],
            [{ localeCode: 'de-DE', currency: 'EUR' }, '123.456,78 €'],
            [{ localeCode: 'ja-JP', currency: 'JPY' }, '￥123,457'],
            [{ localeCode: 'vi-VN', currency: 'VND' }, '123.457 ₫'],
            [{ localeCode: 'th-TH', currency: 'THB' }, '฿123,456.78'],
            [{ localeCode: 'id-ID', currency: 'IDR' }, new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(defaultValue)],
        ];
        for (const [props, expected] of cases) {
            const view = await mount({ ...props, defaultValue });
            expect(getInput()).toHaveValue(expected);
            view.unmount();
        }
    });

    it('currency 为 true 时使用语言包的货币码，所有语言包都能渲染', async () => {
        const packs = import.meta.glob<Locale>('@fibrae/semi-foundation/locale/source/*.ts', {
            eager: true,
            import: 'default',
        });
        expect(Object.keys(packs)).toHaveLength(57);
        for (const [file, pack] of Object.entries(packs)) {
            const view = render({
                render: () => <LocaleProvider locale={pack}>{() => <InputNumber defaultValue={1.5} currency />}</LocaleProvider>,
            });
            await nextTick();
            expect([file, getInput().value]).not.toEqual([file, '']);
            view.unmount();
        }
    });

    it('显式 localeCode 为 undefined 时使用语言包的 localeCode', async () => {
        render({
            render: () => <LocaleProvider locale={de}>{() => <InputNumber defaultValue={123456.78} currency localeCode={undefined} />}</LocaleProvider>,
        });
        await nextTick();
        expect(getInput()).toHaveValue(new Intl.NumberFormat('de', { style: 'currency', currency: 'EUR' }).format(123456.78));
    });

    it('全局 overrideDefaultProps 的 localeCode、defaultCurrency 优先于语言包', async () => {
        semiGlobal.config.overrideDefaultProps = { InputNumber: { localeCode: 'de-DE', defaultCurrency: 'USD' } };
        await mount({ defaultValue: 123456.78, currency: true });
        expect(getInput()).toHaveValue(new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(123456.78));
    });

    it('全局 Input 默认值不作用于 InputNumber，InputNumber 自身的全局值照常生效', () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true } };
        const view = render(InputNumber, { props: { defaultValue: 1 } });
        expect(view.container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
        view.unmount();
        semiGlobal.config.overrideDefaultProps = { InputNumber: { showClear: true } };
        const host = render(InputNumber, { props: { defaultValue: 1 } }).container;
        expect(host.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).not.toBeNull();
    });

    it('常见货币显示，defaultValue 为字符串', async () => {
        const cases: Array<[Props, string]> = [
            [{ currency: 'CNY' }, '¥123,456.78'],
            [{ localeCode: 'en-US', currency: 'USD' }, '$123,456.78'],
            [{ localeCode: 'th-TH', currency: 'THB' }, '฿123,456.78'],
        ];
        for (const [props, expected] of cases) {
            const view = await mount({ ...props, defaultValue: '123456.78' });
            expect(getInput()).toHaveValue(expected);
            view.unmount();
        }

        await mount({ defaultValue: '123456,78', currency: 'EUR', localeCode: 'de-DE' });
        expect(getInput()).toHaveValue('123.456,78 €');
    });

    it('常见货币显示，defaultValue 为字符串，货币无小数位', async () => {
        const cases: Array<[Props, string, string]> = [
            [{ localeCode: 'ja-JP', currency: 'JPY' }, '123456.78', '￥123,457'],
            [{ localeCode: 'vi-VN', currency: 'VND' }, '123456,78', '123.457 ₫'],
            [{ localeCode: 'id-ID', currency: 'IDR' }, '123456,78', new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(123456.78)],
        ];
        for (const [props, defaultValue, expected] of cases) {
            const view = await mount({ ...props, defaultValue });
            expect(getInput()).toHaveValue(expected);
            view.unmount();
        }
    });

    it('非受控 + 加减按钮', async () => {
        await mount({ defaultValue: 123459.78, currency: 'USD', localeCode: 'en-US' });
        await pressTimes(getUpButton, 1);
        expect(getInput()).toHaveValue('$123,460.78');
        await pressTimes(getDownButton, 3);
        expect(getInput()).toHaveValue('$123,457.78');
    });

    it('受控 + 加减按钮', async () => {
        const onChange = vi.fn<Change>();
        await mountControlled(123459.78, { currency: 'USD', localeCode: 'en-US' }, onChange);

        await pressTimes(getUpButton, 1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('$123,460.78');

        await pressTimes(getDownButton, 3);
        expect(onChange).toHaveBeenCalledTimes(4);
        expect(getInput()).toHaveValue('$123,457.78');
    });

    it('常见货币显示，showCurrencySymbol 为 false', async () => {
        const defaultValue = 123456.78;
        const idrFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' });
        const idrCurrencySymbol = idrFormatter.formatToParts(0).find((p) => p.type === 'currency')?.value ?? '';
        const cases: Array<[Props, string]> = [
            [{ currency: 'CNY' }, '123,456.78'],
            [{ localeCode: 'en-US', currency: 'USD' }, '123,456.78'],
            [{ localeCode: 'de-DE', currency: 'EUR' }, '123.456,78'],
            [{ localeCode: 'ja-JP', currency: 'JPY' }, '123,457'],
            [{ localeCode: 'vi-VN', currency: 'VND' }, '123.457'],
            [{ localeCode: 'th-TH', currency: 'THB' }, '123,456.78'],
            [{ localeCode: 'id-ID', currency: 'IDR' }, idrFormatter.format(defaultValue).replace(idrCurrencySymbol, '').trim()],
        ];
        for (const [props, expected] of cases) {
            const view = await mount({ ...props, defaultValue, showCurrencySymbol: false });
            expect(getInput()).toHaveValue(expected);
            view.unmount();
        }
    });

    it('CNY 货币在不同 currencyDisplay 选项下的显示', async () => {
        const cases: Array<[Props, string]> = [
            [{}, '¥123,456.78'],
            [{ currencyDisplay: 'code' }, 'CNY 123,456.78'],
            [{ currencyDisplay: 'name' }, '123,456.78人民币'],
        ];
        for (const [props, expected] of cases) {
            const view = await mount({ defaultValue: 123456.78, currency: 'CNY', ...props });
            expect(getInput()).toHaveValue(expected);
            view.unmount();
        }
    });

    it('修复 2936，测试 JS 精度相关计算', async () => {
        await mount({ defaultValue: 0.07, max: 0.08, min: 0.01, step: 0.01 });
        await press(getUpButton());
        expect(getInput()).toHaveValue('0.08');
    });

    it('disabled 属性', async () => {
        await mount({ defaultValue: 100, disabled: true });
        expect(getInput()).toBeDisabled();
        expect(document.querySelector(`.${prefixCls}-wrapper-disabled`)).not.toBeNull();
        expect(getUpButton()).toHaveClass(`${prefixCls}-number-button-up-disabled`);
        expect(getDownButton()).toHaveClass(`${prefixCls}-number-button-down-disabled`);
    });

    it('禁用时按钮不响应点击', async () => {
        const onChange = vi.fn<Change>();
        const onUpClick = vi.fn<Click>();
        await mount({ defaultValue: 100, disabled: true, onChange, onUpClick });
        await press(getUpButton());
        await press(getDownButton());
        expect(getInput()).toHaveValue('100');
        expect(onChange).not.toHaveBeenCalled();
        expect(onUpClick).not.toHaveBeenCalled();
    });

    it('readonly 属性', async () => {
        const onChange = vi.fn<Change>();
        await mount({ defaultValue: 100, readonly: true, onChange });
        expect(getInput()).toHaveAttribute('readonly');
        await press(getUpButton());
        expect(getInput()).toHaveValue('100');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('readonly 时方向键与 Home、End 不改值，Home、End 仍移动光标', async () => {
        const onChange = vi.fn<Change>();
        await mount({ defaultValue: 10, max: 50, min: 2, readonly: true, onChange });
        for (const key of ['ArrowUp', 'ArrowDown', 'Home', 'End']) {
            await keyDown(key);
        }
        expect(getInput()).toHaveValue('10');
        expect(onChange).not.toHaveBeenCalled();
        expect(await dispatchKey('Home')).toBe(true);
    });

    it('readonly 且受控时，keydown 仍然发出', async () => {
        const onKeydown = vi.fn<KeyHandler>();
        await mount({ modelValue: 10, readonly: true, onKeydown });
        await keyDown('ArrowUp');
        expect(onKeydown).toHaveBeenCalledTimes(1);
    });

    it('距边界不足一个 step 时，上键与按钮夹到边界', async () => {
        const upper = await mount({ defaultValue: 9.5, max: 10, min: 0.5, step: 1 });
        await press(getUpButton());
        expect(getInput()).toHaveValue('10');
        expect(getUpButton()).toHaveClass(`${prefixCls}-number-button-up-not-allowed`);
        upper.unmount();

        await mount({ defaultValue: 0.8, max: 10, min: 0.5, step: 1 });
        await keyDown('ArrowDown');
        expect(getInput()).toHaveValue('0.5');
        expect(getDownButton()).toHaveClass(`${prefixCls}-number-button-down-not-allowed`);
    });

    it('currency 与 showCurrencySymbol 在挂载后变化时，符号随之更新', async () => {
        const view = await mount({ defaultValue: 100, currency: 'CNY', showCurrencySymbol: false });
        expect(getInput()).toHaveValue('100.00');
        await view.rerender({ currency: 'USD' });
        await focusInput();
        await blurInput();
        expect(getInput()).toHaveValue('100.00');
    });

    it('localeCode 在挂载后变化时，按新语言的小数点解析输入', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ currency: 'EUR', localeCode: 'en-US', onChange });
        await view.rerender({ localeCode: 'de-DE' });
        await focusInput();
        await change('1.234,56');
        expect(lastArg(onChange)).toBe(1234.56);
    });

    it('挂载后才开启 currency 时，按小数点解析输入', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ localeCode: 'en-US', onChange });
        await view.rerender({ currency: 'USD' });
        await focusInput();
        await change('12.5');
        expect(lastArg(onChange)).toBe(12.5);
    });

    it('货币模式下 precision 为 0 时不显示小数', async () => {
        await mount({ defaultValue: 100.4, currency: 'CNY', precision: 0 });
        expect(getInput()).toHaveValue('¥100');
    });

    it('货币模式下 minimumFractionDigits 与 maximumFractionDigits 为 0 时生效', async () => {
        await mount({ defaultValue: 100.4, currency: 'CNY', maximumFractionDigits: 0, minimumFractionDigits: 0 });
        expect(getInput()).toHaveValue('¥100');
    });

    it('ArrowUp 键增加数值', async () => {
        const onChange = vi.fn<Change>();
        await mount({ defaultValue: 10, onChange });
        await keyDown('ArrowUp');
        expect(getInput()).toHaveValue('11');
        expect(onChange).toHaveBeenCalledWith(11, expect.any(KeyboardEvent));
    });

    it('Home 与 End 跳到 min 与 max，未设置边界时光标仍可移动', async () => {
        const onChange = vi.fn<Change>();
        await mount({ defaultValue: 10, min: 2, onChange });
        expect(await dispatchKey('Home')).toBe(false);
        expect(getInput()).toHaveValue('2');
        expect(onChange).toHaveBeenCalledWith(2, expect.anything());
        expect(await dispatchKey('End')).toBe(true);
        expect(getInput()).toHaveValue('2');

        const view = await mount({ defaultValue: 10, max: 50, precision: 1 });
        const input = screen.getAllByRole<HTMLInputElement>('spinbutton')[1];
        await dispatchKey('End', input);
        expect(input).toHaveValue('50.0');
        view.unmount();
    });

    it('ArrowDown 键减少数值', async () => {
        const onChange = vi.fn<Change>();
        await mount({ defaultValue: 10, onChange });
        await keyDown('ArrowDown');
        expect(getInput()).toHaveValue('9');
        expect(onChange).toHaveBeenCalledWith(9, expect.anything());
    });

    it('step 属性影响加减步长', async () => {
        await mount({ defaultValue: 10, step: 5 });
        await press(getUpButton());
        expect(getInput()).toHaveValue('15');
        await press(getDownButton());
        await press(getDownButton());
        expect(getInput()).toHaveValue('5');
        expect(getInput()).toHaveAttribute('step', '5');
    });

    // a step with abs value < 1e-6 is stringified in scientific notation ((1e-8).toString() === "1e-8"), which must not
    // break precision detection and freeze the +/- buttons
    it('小于 1e-6（科学计数法）的 step 能正确加减', async () => {
        await mount({ defaultValue: 0, step: 1e-8, precision: 8 });
        await press(getUpButton());
        expect(getInput()).toHaveValue('0.00000001');
        await press(getDownButton());
        expect(getInput()).toHaveValue('0.00000000');
    });

    it('validateStatus 为 warning', async () => {
        await mount({ validateStatus: 'warning' });
        expect(document.querySelector(`.${prefixCls}-wrapper-warning`)).not.toBeNull();
    });

    it('validateStatus 为 error', async () => {
        await mount({ validateStatus: 'error' });
        expect(document.querySelector(`.${prefixCls}-wrapper-error`)).not.toBeNull();
    });

    it('#prefix 与 #suffix 插槽', async () => {
        render(InputNumber, { props: { defaultValue: 100 }, slots: { prefix: () => '$', suffix: () => 'USD' } });
        await nextTick();
        expect(document.querySelector(`.${prefixCls}-prefix`)).toHaveTextContent(/^\$$/);
        expect(document.querySelector(`.${prefixCls}-suffix`)).toHaveTextContent(/^USD$/);
    });

    it('innerButtons 属性在悬停时显示按钮', async () => {
        await mount({ defaultValue: 100, innerButtons: true });
        expect(getButtons()).toBeNull();
        await fireEvent.mouseEnter(getWrapper());
        expect(getButtons()).toHaveClass(`${prefixCls}-number-suffix-btns-inner-hover`);
        expect(getButtons()?.querySelectorAll(`.${prefixCls}-number-button`)).toHaveLength(2);
    });

    it('numberChange 事件', async () => {
        const onNumberChange = vi.fn<NumberChange>();
        await mount({ defaultValue: 10, onNumberChange });
        await press(getUpButton());
        expect(onNumberChange).toHaveBeenCalledTimes(1);
        expect(onNumberChange).toHaveBeenCalledWith(11, expect.any(PointerEvent));
    });

    it('mousemove 进入悬停', async () => {
        await mount({ defaultValue: 100, innerButtons: true });
        expect(getButtons()).toBeNull();
        await fireEvent.mouseMove(getWrapper(), { clientX: 100, clientY: 100 });
        expect(getButtons()).toHaveClass(`${prefixCls}-number-suffix-btns-inner-hover`);
    });

    it('格式化后光标留在后续数字之前', async () => {
        await mount({ defaultValue: 100, formatter: thousands, parser: removeThousands });
        await userEvent.type(getInput(), '5', { initialSelectionStart: 1, initialSelectionEnd: 1 });
        await nextTick();
        expect(getInput()).toHaveValue('1,500');
        expect(getInput().selectionStart).toBe(3);
        expect(getInput().selectionEnd).toBe(3);
    });

    it('货币模式下的字符串值', async () => {
        await mount({ modelValue: '100.50', currency: 'CNY' });
        expect(getInput()).toHaveValue('¥100.50');
    });

    it('步进后光标相对不变的尾部保持位置', async () => {
        await mount({ defaultValue: 1000, step: 1000, formatter: thousands, parser: removeThousands });
        expect(getInput()).toHaveValue('1,000');
        await focusInput();
        getInput().setSelectionRange(1, 1);
        await keyDown('ArrowUp');
        expect(getInput()).toHaveValue('2,000');
        expect(getInput().selectionStart).toBe(1);
    });

    it('光标后的文本变化时，光标留在末尾', async () => {
        await mount({ defaultValue: 1000, formatter: thousands, parser: removeThousands });
        await focusInput();
        getInput().setSelectionRange(2, 2);
        await keyDown('ArrowUp');
        expect(getInput()).toHaveValue('1,001');
        expect(getInput().selectionStart).toBe(5);
    });

    it('聚焦时步进，精度保持', async () => {
        await mountControlled(1, { precision: 2 });
        expect(getInput()).toHaveValue('1.00');
        await focusInput();
        await keyDown('ArrowUp');
        expect(getInput()).toHaveValue('2.00');
        expect(getInput()).toHaveAttribute('aria-valuenow', '2');
    });

    it('minimumFractionDigits 与 maximumFractionDigits 属性', async () => {
        const props = { currency: 'CNY', minimumFractionDigits: 2, maximumFractionDigits: 4 };
        const short = await mount({ ...props, defaultValue: 100.5 });
        expect(getInput()).toHaveValue('¥100.50');
        short.unmount();

        await mount({ ...props, defaultValue: 3.14159 });
        expect(getInput()).toHaveValue('¥3.1416');
    });

    it('#insetLabel 插槽', async () => {
        render(InputNumber, { props: { defaultValue: 100 }, slots: { insetLabel: () => 'Amount' } });
        await nextTick();
        expect(document.querySelector(`.${prefixCls}-inset-label`)).toHaveTextContent(/^Amount$/);
    });

    it('mouseleave 后内置按钮消失', async () => {
        await mount({ defaultValue: 100, innerButtons: true });
        await fireEvent.mouseEnter(getWrapper());
        expect(getButtons()).not.toBeNull();
        await fireEvent.mouseLeave(getWrapper());
        expect(getButtons()).toBeNull();
    });

    it('受控值在聚焦状态下配合步进', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ modelValue: 100, onChange });

        await focusInput();
        await keyDown('ArrowUp');
        expect(onChange).toHaveBeenLastCalledWith(101, expect.anything());
        await view.rerender({ modelValue: 200 });

        expect(getInput()).toHaveValue('200');
        expect(getInput()).toHaveAttribute('aria-valuenow', '200');
    });

    it('货币模式下解析值相同', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ modelValue: 100, currency: 'CNY', onChange });
        onChange.mockClear();
        await view.rerender({ modelValue: '100' });
        expect(getInput()).toHaveValue('¥100.00');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('受控值为解析后数值相同的字符串', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ modelValue: '100.00', currency: 'CNY', onChange });
        onChange.mockClear();
        await view.rerender({ modelValue: 100 });
        expect(getInput()).toHaveValue('¥100.00');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('受控值改为空串后清空并去掉 aria-valuenow', async () => {
        const view = await mount({ modelValue: 100 });
        expect(getInput()).toHaveAttribute('aria-valuenow', '100');
        await view.rerender({ modelValue: '' });
        expect(getInput()).toHaveValue('');
        expect(getInput()).not.toHaveAttribute('aria-valuenow');
    });

    it('输入不是步进，聚焦后不重新格式化', async () => {
        await mountControlled(1, { precision: 2 });
        await focusInput();
        await change('5');
        expect(getInput()).toHaveValue('5');
        expect(getInput()).toHaveAttribute('aria-valuenow', '5');

        await blurInput();
        expect(getInput()).toHaveValue('5.00');
    });

    it('在开头输入时光标位置', async () => {
        await mount({ defaultValue: 100, formatter: thousands, parser: removeThousands });
        await userEvent.type(getInput(), '9', { initialSelectionStart: 0, initialSelectionEnd: 0 });
        await nextTick();
        expect(getInput()).toHaveValue('9,100');
        expect(getInput().selectionStart).toBe(2);
    });

    it('受控格式化后光标位置', async () => {
        const onChange = vi.fn<Change>();
        await mountControlled(100, { formatter: thousands, parser: removeThousands }, onChange);
        await userEvent.type(getInput(), '5', { initialSelectionStart: 1, initialSelectionEnd: 1 });
        await nextTick();
        expect(onChange).toHaveBeenLastCalledWith(1500, expect.anything());
        expect(getInput()).toHaveValue('1,500');
        expect(getInput().selectionStart).toBe(3);
    });

    it('keepFocus 步进后受控更新仍格式化且保持聚焦', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ modelValue: 100, onChange, keepFocus: true, precision: 1 });

        await press(getUpButton());
        expect(getInput()).toHaveFocus();

        await view.rerender({ modelValue: 150 });
        expect(getInput()).toHaveValue('150.0');
        expect(getInput()).toHaveFocus();
    });

    it('聚焦状态下受控值为 NaN', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ modelValue: 100, onChange });

        await focusInput();
        await view.rerender({ modelValue: NaN });
        expect(onChange).not.toHaveBeenCalled();

        await blurInput();
        expect(getInput()).toHaveValue('100');
        expect(onChange).toHaveBeenCalledWith(100, expect.any(FocusEvent));
    });

    it('聚焦状态下受控值为非法字符串', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ modelValue: 100, onChange });

        await focusInput();
        await view.rerender({ modelValue: 'abc123' });
        expect(getInput()).toHaveValue('abc123');
        expect(onChange).not.toHaveBeenCalled();

        await blurInput();
        expect(getInput()).toHaveValue('100');
        expect(onChange).toHaveBeenCalledWith(100, expect.anything());
    });

    it('非货币模式下 precision 只改变文本、不改变数值时，挂载与更新都不发出 change', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ modelValue: 100, precision: 2, onChange });
        expect(getInput()).toHaveValue('100.00');
        expect(onChange).not.toHaveBeenCalled();

        await view.rerender({ modelValue: 200 });
        expect(getInput()).toHaveValue('200.00');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('formatter 只改变文本时，挂载与更新都不发出 change', async () => {
        const onChange = vi.fn<Change>();
        const formatter = (v: string | number) => `$ ${v}`;
        const parser = (v: string) => v.replace(/^\$ /, '');
        const view = await mount({ modelValue: 100, formatter, parser, onChange });
        expect(getInput()).toHaveValue('$ 100');
        await view.rerender({ modelValue: 200 });
        expect(getInput()).toHaveValue('$ 200');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('precision 取整后数值改变时，挂载与更新只改显示，不发出 change', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ modelValue: 1.234, precision: 1, onChange });
        expect(getInput()).toHaveValue('1.2');
        await view.rerender({ modelValue: 2.345 });
        expect(getInput()).toHaveValue('2.3');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('非聚焦状态下受控值为非法数字', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ modelValue: 100, onChange });
        await view.rerender({ modelValue: 'invalid' });
        expect(getInput()).toHaveValue('');
        expect(getInput()).not.toHaveAttribute('aria-valuenow');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('非聚焦状态下受控值为合法数字', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ modelValue: 100, onChange });
        await view.rerender({ modelValue: 200 });
        expect(getInput()).toHaveValue('200');
        expect(getInput()).toHaveAttribute('aria-valuenow', '200');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('货币模式下受控值更新收到字符串值', async () => {
        const view = await mount({ modelValue: '100', currency: 'CNY' });
        expect(getInput()).toHaveValue('¥100.00');
        await view.rerender({ modelValue: '200' });
        expect(getInput()).toHaveValue('¥200.00');
    });

    it('聚焦状态下受控值非法但不是 NaN', async () => {
        const view = await mount({ modelValue: 100 });
        await focusInput();
        await view.rerender({ modelValue: '100abc' });
        expect(getInput()).toHaveValue('100abc');
        await blurInput();
        expect(getInput()).toHaveValue('100');
    });

    it('货币模式下新值超过 max 时，受控值更新显示原值，失焦后才截断并发出 change', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ currency: 'CNY', max: 120, onChange, modelValue: 100 });
        await view.rerender({ modelValue: 150 });
        expect(getInput()).toHaveValue('¥150.00');
        expect(onChange).not.toHaveBeenCalled();

        await focusInput();
        await blurInput();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe(120);
    });

    it('keepFocus 配合聚焦与步进时重新聚焦输入框', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ modelValue: 100, keepFocus: true, onChange });
        await focusInput();
        await press(getUpButton());
        expect(onChange).toHaveBeenLastCalledWith(101, expect.anything());
        await view.rerender({ modelValue: 101 });
        expect(getInput()).toHaveValue('101');
        expect(getInput()).toHaveFocus();
    });

    it('已聚焦时 mousemove 不显示悬停样式', async () => {
        await mount({ defaultValue: 100, innerButtons: true });
        await focusInput();
        expect(getButtons()).not.toHaveClass(`${prefixCls}-number-suffix-btns-inner-hover`);
        await fireEvent.mouseMove(getWrapper());
        expect(getButtons()).not.toBeNull();
        expect(getButtons()).not.toHaveClass(`${prefixCls}-number-suffix-btns-inner-hover`);
    });

    it.each([
        ['普通数值', { defaultValue: 1234.5 }],
        ['受控值', { modelValue: 1234.5 }],
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
    ] as Array<[string, Props]>)('挂载后不再重新渲染：%s', async (_, props) => {
        const updated = await renderCountingUpdates(props);
        expect(updated).not.toHaveBeenCalled();
    });

    it('已悬停时继续移动鼠标不再重新渲染', async () => {
        const updated = await renderCountingUpdates({ defaultValue: 100, innerButtons: true });
        await fireEvent.mouseEnter(getWrapper());
        expect(getButtons()).toHaveClass(`${prefixCls}-number-suffix-btns-inner-hover`);
        updated.mockClear();
        await fireEvent.mouseMove(getWrapper());
        await fireEvent.mouseMove(getWrapper());
        expect(updated).not.toHaveBeenCalled();
    });

    it('聚焦且刚步进过、受控值为合法数字时格式化', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ onChange, keepFocus: true, precision: 2, modelValue: 100 });
        expect(getInput()).toHaveValue('100.00');
        await focusInput();
        await keyDown('ArrowUp');
        await view.rerender({ modelValue: 150 });
        expect(getInput()).toHaveValue('150.00');
    });

    it('聚焦状态下受控值超出范围（非 NaN）', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ min: 0, max: 100, onChange, modelValue: 50 });
        await focusInput();
        await view.rerender({ modelValue: 150 });
        expect(getInput()).toHaveValue('50');
        expect(getInput()).toHaveAttribute('aria-valuenow', '100');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('货币模式下新值低于 min 时，受控值更新显示原值且不发出 change', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ currency: 'CNY', min: 50, onChange, modelValue: 100 });
        await view.rerender({ modelValue: 20 });
        expect(getInput()).toHaveValue('¥20.00');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('聚焦状态下合法数字变化配合步进', async () => {
        const onChange = vi.fn<Change>();
        await mountControlled(100, { keepFocus: true }, onChange);
        expect(getInput()).not.toHaveFocus();
        await press(getUpButton());
        expect(onChange).toHaveBeenLastCalledWith(101, expect.anything());
        expect(getInput()).toHaveValue('101');
        expect(getInput()).toHaveAttribute('aria-valuenow', '101');
        expect(getInput()).toHaveFocus();
    });

    it('聚焦状态下受控值超过 max（非法但非 NaN）', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ max: 100, onChange, modelValue: 50 });
        await focusInput();
        await view.rerender({ modelValue: 200 });
        await blurInput();
        expect(getInput()).toHaveValue('100');
        expect(onChange).toHaveBeenCalledWith(100, expect.anything());
    });

    it('聚焦状态下受控值低于 min（非法但非 NaN）', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ min: 10, onChange, modelValue: 50 });
        await focusInput();
        await view.rerender({ modelValue: 5 });
        expect(getInput()).toHaveAttribute('aria-valuenow', '10');
        await blurInput();
        expect(getInput()).toHaveValue('10');
        expect(onChange).toHaveBeenCalledWith(10, expect.anything());
    });

    it('聚焦状态下合法数字与当前数值不同', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ modelValue: 100, onChange });
        await focusInput();
        await change('150');
        expect(onChange).toHaveBeenCalledWith(150, expect.anything());
        await view.rerender({ modelValue: 200 });
        expect(getInput()).toHaveValue('150');
        expect(getInput()).toHaveAttribute('aria-valuenow', '200');
    });

    it('聚焦状态下受控值超出范围时，失焦格式化', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ min: 0, max: 100, onChange, modelValue: 50 });
        await focusInput();
        await view.rerender({ modelValue: 150 });
        await blurInput();
        expect(getInput()).toHaveValue('100');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(100, expect.anything());
    });

    it('聚焦状态下字符串受控值超出精度', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ precision: 2, onChange, modelValue: 50 });
        expect(getInput()).toHaveValue('50.00');
        await focusInput();
        await view.rerender({ modelValue: '50.12345' });
        expect(getInput()).toHaveAttribute('aria-valuenow', '50.12');
        await blurInput();
        expect(getInput()).toHaveValue('50.12');
    });

    it('聚焦状态下解析数字相同但格式不同', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ modelValue: 100, onChange });
        await focusInput();
        await view.rerender({ modelValue: '100.00' });
        expect(getInput()).toHaveValue('100');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('聚焦状态下受控值调整后与当前数值相同', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ max: 100, onChange, modelValue: 100 });
        await focusInput();
        await view.rerender({ modelValue: 150 });
        expect(getInput()).toHaveValue('150');
        expect(getInput()).toHaveAttribute('aria-valuenow', '100');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('货币模式下新值按 precision 舍入时，受控值更新只改显示，不发出 change', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ currency: 'CNY', precision: 1, onChange, modelValue: 100 });
        await view.rerender({ modelValue: 200.44 });
        expect(getInput()).toHaveValue('¥200.4');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('清除按钮清空值', async () => {
        const onChange = vi.fn<Change>();
        await mount({ defaultValue: 100, showClear: true, onChange });
        const clearBtn = document.querySelector(`.${prefixCls}-clearbtn`) as HTMLElement;
        expect(clearBtn).not.toBeNull();
        await fireEvent.mouseDown(clearBtn);
        expect(getInput()).toHaveValue('');
        expect(onChange).toHaveBeenLastCalledWith('', expect.any(MouseEvent));
        expect(getInput()).not.toHaveAttribute('aria-valuenow');
    });

    it('input 事件经 attrs 交给 Input', async () => {
        const onInput = vi.fn<(event: Event) => void>();
        await mount({ defaultValue: 100 }, { onInput });
        await userEvent.type(getInput(), '5');
        expect(onInput).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('1005');
    });

    it('货币模式下解析值不同时的受控值更新', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ modelValue: 100, currency: 'CNY', onChange });
        expect(getInput()).toHaveValue('¥100.00');
        expect(onChange).not.toHaveBeenCalled();
        await view.rerender({ modelValue: 200 });
        expect(getInput()).toHaveValue('¥200.00');
        expect(getInput()).toHaveAttribute('aria-valuenow', '200');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('长按：先步进一次，超时后按间隔连发，松开停止', async () => {
        vi.useFakeTimers();
        await mount({ defaultValue: 0 });

        await hold(getUpButton());
        expect(getInput()).toHaveValue('1');
        await advance(numbers.DEFAULT_PRESS_TIMEOUT * 2);
        expect(getInput()).toHaveValue('2');

        await fireEvent.pointerMove(getUpButton());
        await advance(numbers.DEFAULT_PRESS_TIMEOUT);
        expect(getInput()).toHaveValue('3');

        await release(getUpButton());
        await advance(numbers.DEFAULT_PRESS_TIMEOUT * 4);
        expect(getInput()).toHaveValue('3');
    });

    it('货币模式下字符串值按 precision 舍入时，受控值更新只改显示，不发出 change', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ currency: 'CNY', precision: 2, onChange, modelValue: '100' });
        await focusInput();
        await blurInput();
        await view.rerender({ modelValue: '200.456' });
        expect(getInput()).toHaveValue('¥200.46');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('货币模式下 keepFocus 与按钮点击时的受控值更新', async () => {
        const onChange = vi.fn<Change>();
        await mountControlled(100, { currency: 'CNY', keepFocus: true }, onChange);
        await press(getUpButton());
        expect(onChange).toHaveBeenLastCalledWith(101, expect.anything());
        expect(getInput()).toHaveFocus();
        expect(getInput()).toHaveValue('101');
        await blurInput();
        expect(getInput()).toHaveValue('¥101.00');
    });

    it('货币模式下键盘上下键时的受控值更新', async () => {
        const onChange = vi.fn<Change>();
        await mountControlled(100, { currency: 'CNY' }, onChange);
        await focusInput();
        await keyDown('ArrowUp');
        expect(onChange).toHaveBeenLastCalledWith(101, expect.anything());
        expect(getInput()).toHaveValue('101');
        await keyDown('ArrowDown');
        await keyDown('ArrowDown');
        expect(onChange).toHaveBeenLastCalledWith(99, expect.anything());
        expect(getInput()).toHaveValue('99');
    });

    it('货币模式下格式化字符串值时的受控值更新', async () => {
        const onChange = vi.fn<Change>();
        const view = await mount({ modelValue: '¥100.00', currency: 'CNY', onChange });
        expect(getInput()).toHaveValue('¥100.00');
        onChange.mockClear();
        await view.rerender({ modelValue: '¥200.00' });
        expect(getInput()).toHaveValue('¥200.00');
        expect(getInput()).toHaveAttribute('aria-valuenow', '200');
        expect(onChange).not.toHaveBeenCalled();
    });

    // a disabled <button> would swallow the mouseup that stops the press-and-hold repeat once change disabled the
    // component, so change would keep firing forever
    it('OnChangeLimit：长按过程中 change 禁用组件时停止重复', async () => {
        vi.useFakeTimers();
        const onChange = vi.fn<Change>();
        const view = await mount({
            defaultValue: 12,
            disabled: false,
            innerButtons: true,
            onChange: (value: number | string, event: InputNumberChangeEvent) => {
                onChange(value, event);
                void view.rerender({ disabled: true });
            },
        });
        await fireEvent.mouseEnter(getWrapper());
        const up = getUpButton();
        await hold(up);
        await nextTick();
        expect(getInput()).toBeDisabled();
        await release(up);
        await advance(numbers.DEFAULT_PRESS_TIMEOUT * 4);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(13, expect.objectContaining({ type: 'pointerdown' }));
        expect(getInput()).toHaveValue('13');
    });

    it('FixPrecision（#431）：点击步进按钮后删除内容，不按精度重新格式化', async () => {
        await mountControlled(5.12, { precision: 2 });
        await press(getUpButton());
        expect(getInput()).toHaveValue('6.12');
        await focusInput();
        await change('6.1');
        expect(getInput()).toHaveValue('6.1');
        await change('6.');
        expect(getInput()).toHaveValue('6.');
    });

    it('FixPrecision786（#786）：删除精度值后输入非法字符，输入框保持为空', async () => {
        const onChange = vi.fn<Change>();
        await mount({ defaultValue: 10.0, precision: 2, onChange });
        expect(getInput()).toHaveValue('10.00');
        await focusInput();
        await change('');
        await change('aaa');
        await blurInput();
        expect(getInput()).toHaveValue('');
        expect(onChange).not.toHaveBeenCalledWith(0, expect.anything());
    });

    describe('Fix1772（#1672）：受控模式下的 formatter 与 parser', () => {
        const minute = 60000;
        const attrs = {
            formatter: (value: number | string) => String(Number(`${value}`.replace(/\D/g, '')) / minute),
            parser: (value: string) => String(Number(`${value}`.replace(/\D/g, '')) * minute),
            min: minute,
            step: minute,
        };
        const expectStepThrough = async () => {
            expect(getInput()).toHaveValue('1');
            await press(getUpButton());
            expect(getInput()).toHaveValue('2');
            await press(getUpButton());
            expect(getInput()).toHaveValue('3');
            await press(getDownButton());
            expect(getInput()).toHaveValue('2');
            await press(getDownButton());
            expect(getInput()).toHaveValue('1');
        };

        it('Fix1772（#1672）：步进按钮显示格式化后的值', async () => {
            const onChange = vi.fn<Change>();
            await mountControlled(minute, attrs, onChange);
            await expectStepThrough();
            expect(lastArg(onChange)).toBe(minute);
        });

        it('Fix1772（#1672）：输入框聚焦时步进按钮显示格式化后的值', async () => {
            await mountControlled(minute, attrs);
            await focusInput();
            await expectStepThrough();
        });
    });

    it('Fix3025（#3026）：小数步长按 step 精度取整', async () => {
        const view = await mount({ defaultValue: 0.14, step: 0.01 });
        await press(getUpButton());
        expect(getInput()).toHaveValue('0.15');
        view.unmount();

        await mount({ defaultValue: 0.01, step: 0.02 });
        await press(getUpButton());
        expect(getInput()).toHaveValue('0.03');
        await press(getDownButton());
        expect(getInput()).toHaveValue('0.01');
    });

    describe('行为基线', () => {
        it('非受控忽略之后的 defaultValue 变化；受控只显示父组件写回的值', async () => {
            const first = await mount({ defaultValue: 1 });
            await first.rerender({ defaultValue: 2 });
            expect(getInput()).toHaveValue('1');
            first.unmount();

            const onChange = vi.fn<Change>();
            await mount({ modelValue: 5, onChange });
            await press(getUpButton());
            expect(onChange).toHaveBeenLastCalledWith(6, expect.anything());
            expect(getInput()).toHaveValue('5');
            expect(getInput()).toHaveAttribute('aria-valuenow', '5');
        });

        it('输入的值在失焦时夹紧到 min 与 max，按钮在边界处停止', async () => {
            const onChange = vi.fn<Change>();
            await mount({ defaultValue: 5, max: 10, min: 0, onChange });
            await focusInput();
            await change('20');
            await blurInput();
            expect(getInput()).toHaveValue('10');
            expect(lastArg(onChange)).toBe(10);
            expect(getUpButton()).toHaveClass(`${prefixCls}-number-button-up-not-allowed`);
            await press(getUpButton());
            expect(getInput()).toHaveValue('10');

            await focusInput();
            await change('-3');
            await blurInput();
            expect(getInput()).toHaveValue('0');
            expect(lastArg(onChange)).toBe(0);
            expect(getDownButton()).toHaveClass(`${prefixCls}-number-button-down-not-allowed`);
            expect(getInput()).toHaveAttribute('aria-valuemin', '0');
            expect(getInput()).toHaveAttribute('aria-valuemax', '10');
        });

        it('Shift 点击按钮按 shiftStep 步进', async () => {
            await mount({ defaultValue: 0, step: 2, shiftStep: 50 });
            await press(getUpButton(), { button: numbers.MOUSE_BUTTON_LEFT, shiftKey: true });
            expect(getInput()).toHaveValue('50');
            await press(getDownButton());
            expect(getInput()).toHaveValue('48');
        });

        it('输入的值在失焦时按 precision 取整', async () => {
            const onChange = vi.fn<Change>();
            await mount({ precision: 2, onChange });
            await focusInput();
            await change('1.236');
            await blurInput();
            expect(getInput()).toHaveValue('1.24');
            expect(lastArg(onChange)).toBe(1.24);
        });

        it('输入时以解析后的数字报告 change 与 numberChange', async () => {
            const onChange = vi.fn<Change>();
            const onNumberChange = vi.fn<NumberChange>();
            await mount({ onChange, onNumberChange });
            await change('12');
            expect(getInput()).toHaveValue('12');
            expect(onChange).toHaveBeenLastCalledWith(12, expect.anything());
            expect(onNumberChange).toHaveBeenCalledTimes(1);
            expect(onNumberChange).toHaveBeenLastCalledWith(12, expect.anything());
            await change('12.');
            expect(onNumberChange).toHaveBeenCalledTimes(1);
            await keyDown('ArrowUp');
            expect(onNumberChange).toHaveBeenCalledTimes(2);
            expect(onNumberChange).toHaveBeenLastCalledWith(13, expect.anything());
        });

        it('失焦时重新格式化输入值，并报告数值变化', async () => {
            const onNumberChange = vi.fn<NumberChange>();
            await mount({ max: 10, onNumberChange });
            await focusInput();
            await change('20');
            expect(onNumberChange).not.toHaveBeenCalled();
            await blurInput();
            expect(onNumberChange).toHaveBeenCalledTimes(1);
            expect(onNumberChange).toHaveBeenLastCalledWith(10, expect.anything());
        });

        it('受控更新越界时先不发出 numberChange，失焦校正后发出', async () => {
            const onNumberChange = vi.fn<NumberChange>();
            const view = await mount({ max: 100, modelValue: 50, onNumberChange });
            await view.rerender({ modelValue: 150 });
            expect(getInput()).toHaveValue('150');
            expect(onNumberChange).not.toHaveBeenCalled();

            await focusInput();
            await blurInput();
            expect(onNumberChange).toHaveBeenCalledTimes(1);
            expect(onNumberChange).toHaveBeenCalledWith(100, expect.anything());
        });

        it('scientificNotation 以指数形式显示长数字，而不是作为 DOM 属性', async () => {
            await mount({ defaultValue: 120000000, scientificNotation: { threshold: 5 } });
            expect(getInput()).toHaveValue('1.2e+8');
            expect(getInput()).not.toHaveAttribute('scientificnotation');
            await focusInput();
            expect(getInput()).toHaveValue('120000000');
        });

        it('聚焦以指数形式显示的数字时，显示全部位数', async () => {
            await mount({ defaultValue: 123456789, scientificNotation: { threshold: 5 } });
            expect(getInput()).toHaveValue('1.2346e+8');
            await focusInput();
            expect(getInput()).toHaveValue('123456789');
            await blurInput();
            expect(getInput()).toHaveValue('1.2346e+8');
        });

        // the exponent form keeps only `threshold` digits, so reporting the shown text would hand a controlled parent
        // 123460000 to write back
        it('以指数形式显示的数字报告时不丢失位数', async () => {
            const onChange = vi.fn<Change>();
            await mount({ defaultValue: 123456789, scientificNotation: { threshold: 5 }, onChange });
            await focusInput();
            await blurInput();
            for (const [value] of onChange.mock.calls) {
                expect(value).toBe(123456789);
            }
        });

        it('受控父组件在挂载与失焦时保留全部位数', async () => {
            const onChange = vi.fn<Change>();
            await mountControlled(123456789, { scientificNotation: { threshold: 5 } }, onChange);
            await focusInput();
            await blurInput();
            expect(getInput()).toHaveValue('1.2346e+8');
            await focusInput();
            expect(getInput()).toHaveValue('123456789');
            for (const [value] of onChange.mock.calls) {
                expect(value).toBe(123456789);
            }
        });

        it('受控值更新以指数形式显示，且不会被报告为缩减后的值', async () => {
            const onChange = vi.fn<Change>();
            const view = await mount({ modelValue: 1, scientificNotation: { threshold: 5 }, onChange });
            await view.rerender({ modelValue: 987654321 });
            expect(getInput()).toHaveValue('9.8765e+8');
            for (const [value] of onChange.mock.calls) {
                expect(value).toBe(987654321);
            }
        });

        it('从 semiGlobal overrideDefaultProps 读取默认值', async () => {
            semiGlobal.config.overrideDefaultProps = { InputNumber: { step: 5, hideButtons: true } };
            const view = await mount({ defaultValue: 1 });
            expect(getButtons()).toBeNull();
            await keyDown('ArrowUp');
            expect(getInput()).toHaveValue('6');
            view.unmount();
            await mount({ defaultValue: 1, step: 2, hideButtons: false });
            expect(getButtons()).not.toBeNull();
            await keyDown('ArrowUp');
            expect(getInput()).toHaveValue('3');
        });

        it('全局默认值里的 insetLabelId 不影响 InputNumber', async () => {
            // the global type leaves out per-instance ids; the cast stands for an untyped app that sets one anyway
            semiGlobal.config.overrideDefaultProps = { InputNumber: { insetLabelId: 'label-global' } } as object;
            render(InputNumber, { slots: { insetLabel: () => 'Amount' } });
            await nextTick();
            expect(document.getElementById('label-global')).toBeNull();
        });

        it('长按遵循 pressTimeout 与 pressInterval', async () => {
            vi.useFakeTimers();
            const onChange = vi.fn<Change>();
            await mount({ defaultValue: 0, pressInterval: 100, pressTimeout: 500, onChange });
            await hold(getUpButton());
            expect(getInput()).toHaveValue('1');
            await advance(499);
            expect(getInput()).toHaveValue('1');
            await advance(1);
            expect(getInput()).toHaveValue('1');
            await advance(100);
            expect(getInput()).toHaveValue('2');
            await advance(99);
            expect(getInput()).toHaveValue('2');
            await advance(1);
            await advance(100);
            expect(getInput()).toHaveValue('4');
            await release(getUpButton());
            await advance(1000);
            expect(getInput()).toHaveValue('4');
            expect(onChange).toHaveBeenCalledTimes(4);
        });

        it('长按向最新的监听器报告', async () => {
            vi.useFakeTimers();
            const first = vi.fn<Change>();
            const second = vi.fn<Change>();
            const view = await mount({ defaultValue: 0, onChange: first });
            await hold(getUpButton());
            expect(first).toHaveBeenCalledTimes(1);
            await view.rerender({ onChange: second });
            await advance(numbers.DEFAULT_PRESS_TIMEOUT * 2);
            expect(first).toHaveBeenCalledTimes(1);
            expect(second).toHaveBeenCalledTimes(1);
            expect(second).toHaveBeenLastCalledWith(2, expect.anything());
            await release(getUpButton());
        });

        it('长按过程中卸载会停止重复', async () => {
            vi.useFakeTimers();
            const onChange = vi.fn<Change>();
            const view = await mount({ defaultValue: 0, onChange });
            await hold(getUpButton());
            view.unmount();
            vi.advanceTimersByTime(numbers.DEFAULT_PRESS_TIMEOUT * 5);
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(vi.getTimerCount()).toBe(0);
        });

        it('按下时指针被捕获到按下的那个按钮上', async () => {
            await mount({ defaultValue: 0 });
            const up = getUpButton();
            const capture = vi.spyOn(up, 'setPointerCapture');
            await hold(up, { button: numbers.MOUSE_BUTTON_LEFT, pointerId: 7 });
            expect(capture).toHaveBeenCalledWith(7);
            await release(up);
        });

        it('方向键步进，阻止默认的光标移动，且仍发出 keydown；其他按键正常传递', async () => {
            const onKeydown = vi.fn<KeyHandler>();
            await mount({ defaultValue: 1, onKeydown });
            expect(await dispatchKey('ArrowUp')).toBe(false);
            expect(getInput()).toHaveValue('2');
            expect(await dispatchKey('Enter')).toBe(true);
            expect(getInput()).toHaveValue('2');
            expect(onKeydown).toHaveBeenCalledTimes(2);
        });

        it('输入法组合结束后，组合模式只报告一次', async () => {
            const onChange = vi.fn<Change>();
            const onCompositionstart = vi.fn<(event: CompositionEvent) => void>();
            const onCompositionend = vi.fn<(event: CompositionEvent) => void>();
            await mount({ composition: true, onChange }, { onCompositionstart, onCompositionend });
            await fireEvent.compositionStart(getInput());
            await change('12');
            expect(onChange).not.toHaveBeenCalled();
            await fireEvent.compositionEnd(getInput(), { target: { value: '12' } });
            expect(onCompositionstart).toHaveBeenCalledTimes(1);
            expect(onCompositionend).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenLastCalledWith(12, expect.any(CompositionEvent));
            expect(getInput()).toHaveValue('12');
        });

        it('ref 是句柄，其 focus 与 blur 驱动焦点样式', async () => {
            const { handle } = await renderWithHandle({ defaultValue: 3 });
            expect(handle()).not.toBe(getInput());
            handle().focus();
            await nextTick();
            expect(getInput()).toHaveFocus();
            expect(document.querySelector(`.${prefixCls}-wrapper-focus`)).not.toBeNull();
            handle().blur();
            await nextTick();
            expect(document.querySelector(`.${prefixCls}-wrapper-focus`)).toBeNull();
        });

        it('句柄暴露原生 input 与根节点，卸载后置为 null', async () => {
            const view = await renderWithHandle({ defaultValue: 3 });
            const handle = view.handle();
            expect(handle.input).toBe(getInput());
            expect(handle.nativeElement).toBe(getWrapper());
            view.unmount();
            expect(handle.input).toBeNull();
            expect(handle.nativeElement).toBeNull();
        });

        it('句柄的 select、设置选区与 focus 选项透传', async () => {
            const { handle } = await renderWithHandle({ defaultValue: 12345 });
            handle().select();
            expect([getInput().selectionStart, getInput().selectionEnd]).toEqual([0, 5]);
            handle().setSelectionRange(1, 3);
            expect([getInput().selectionStart, getInput().selectionEnd]).toEqual([1, 3]);
            const focus = vi.spyOn(getInput(), 'focus');
            handle().focus({ preventScroll: true });
            expect(focus).toHaveBeenLastCalledWith({ preventScroll: true });
        });

        it('句柄的 focus 使用 preventScroll 属性，除非选项另有指定', async () => {
            const { handle } = await renderWithHandle({ defaultValue: 3, preventScroll: true });
            const focus = vi.spyOn(getInput(), 'focus');
            handle().focus();
            expect(focus).toHaveBeenLastCalledWith({ preventScroll: true });
            handle().focus({ preventScroll: false });
            expect(focus).toHaveBeenLastCalledWith({ preventScroll: false });
        });

        it('未声明的属性落到原生 input，class 与 style 作用于数字外层容器', async () => {
            await mount(
                { defaultValue: 1 },
                {
                    id: 'amount-id',
                    name: 'amount',
                    class: 'custom',
                    style: { color: 'red' },
                    title: 'tip',
                    'data-testid': 'amount',
                    'aria-label': 'Amount',
                    placeholder: 'Enter',
                    tabindex: -1,
                }
            );
            const input = getInput();
            expect(input).toHaveAttribute('placeholder', 'Enter');
            expect(getWrapper()).not.toHaveAttribute('placeholder');
            expect(screen.getByTestId('amount')).toBe(input);
            expect(input).toHaveAttribute('aria-label', 'Amount');
            expect(input).toHaveAttribute('name', 'amount');
            expect(input).toHaveAttribute('tabindex', '-1');
            expect(input).toHaveAttribute('id', 'amount-id');
            expect(input).toHaveAttribute('title', 'tip');
            expect(getWrapper()).toHaveClass('custom');
            expect(getWrapper()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
            for (const attr of ['data-testid', 'aria-label', 'name', 'tabindex', 'id', 'title']) {
                expect(getWrapper()).not.toHaveAttribute(attr);
            }
            expect(input).not.toHaveClass('custom');
        });
    });

    it('货币模式聚焦步进后，受控与非受控的输入框文本一致', async () => {
        const attrs = { currency: 'USD', localeCode: 'en-US' };
        const view = await mount({ ...attrs, defaultValue: 100 });
        await focusInput();
        await keyDown('ArrowUp');
        const uncontrolled = getInput().value;
        view.unmount();

        await mountControlled(100, attrs);
        await focusInput();
        await keyDown('ArrowUp');
        expect(getInput()).toHaveValue(uncontrolled);
    });

    describe('Vue 绑定、插槽与属性', () => {
        it('v-model 写回：有效输入为 number，中间态为字符串，清空为空串', async () => {
            const onChange = vi.fn<Change>();
            await mountControlled(1, {}, onChange);
            await change('12');
            expect(lastArg(onChange)).toBe(12);
            await change('12a');
            expect(lastArg(onChange)).toBe('12a');
            await change('');
            expect(lastArg(onChange)).toBe('');
            expect(getInput()).toHaveValue('');
        });

        it('单向绑定且父组件不写回：输入只通知，失焦后显示恢复为 modelValue', async () => {
            const onChange = vi.fn<Change>();
            render(OneWay, { props: { onChange } });
            await nextTick();
            await focusInput();
            await change('8');
            expect(onChange).toHaveBeenLastCalledWith(8, expect.any(Event));
            await blurInput();
            expect(getInput()).toHaveValue('5');
            expect(getInput()).toHaveAttribute('aria-valuenow', '5');
            await press(getUpButton());
            expect(onChange).toHaveBeenLastCalledWith(6, expect.any(PointerEvent));
            expect(getInput()).toHaveValue('5');
        });

        it('change 与 update:modelValue 载荷一致，第二参数随触发方式而不同', async () => {
            const onChange = vi.fn<Change>();
            const onUpdate = vi.fn<(value: number | string) => void>();
            const view = await mount({ defaultValue: 1, onChange, 'onUpdate:modelValue': onUpdate });
            await change('3');
            await press(getUpButton());
            await keyDown('ArrowUp');
            await focusInput();
            await change('7.');
            await blurInput();
            expect(onChange.mock.calls.map(([value]) => value)).toEqual(onUpdate.mock.calls.map(([value]) => value));
            const events = onChange.mock.calls.map(([, event]) => event?.constructor.name);
            expect(events).toEqual(['InputEvent', 'PointerEvent', 'KeyboardEvent', 'InputEvent', 'FocusEvent']);

            onChange.mockClear();
            await view.rerender({ modelValue: 50, max: 10 });
            expect(onChange).not.toHaveBeenCalled();
        });

        it('modelValue 显式为 undefined 视为非受控，可以步进', async () => {
            await mount({ modelValue: undefined, defaultValue: 1 });
            await press(getUpButton());
            expect(getInput()).toHaveValue('2');
        });

        it('全局默认值：step、hideButtons、showClear、formatter、parser，自身值优先', async () => {
            semiGlobal.config.overrideDefaultProps = {
                InputNumber: {
                    step: 5,
                    hideButtons: true,
                    showClear: true,
                    formatter: (value: number | string) => `${value}%`,
                    parser: (value: string) => value.replace('%', ''),
                },
            };
            const view = await mount({ defaultValue: 1 });
            expect(getInput()).toHaveValue('1%');
            expect(getButtons()).toBeNull();
            expect(document.querySelector(`.${prefixCls}-clearbtn`)).not.toBeNull();
            await keyDown('ArrowUp');
            expect(getInput()).toHaveValue('6%');
            view.unmount();

            await mount({
                defaultValue: 1,
                step: 2,
                formatter: (value: number | string) => `#${value}`,
                parser: (value: string) => value.replace('#', ''),
            });
            await keyDown('ArrowUp');
            expect(getInput()).toHaveValue('#3');
        });

        it('localeCode、defaultCurrency：自身值优先于全局默认值，全局默认值优先于语言包', async () => {
            semiGlobal.config.overrideDefaultProps = { InputNumber: { localeCode: 'de-DE', defaultCurrency: 'USD' } };
            render({
                render: () => (
                    <LocaleProvider locale={de}>
                        {() => (
                            <>
                                <InputNumber defaultValue={1.5} currency aria-label="global" />
                                <InputNumber defaultValue={1.5} currency localeCode="en-US" defaultCurrency="JPY" aria-label="own" />
                            </>
                        )}
                    </LocaleProvider>
                ),
            });
            await nextTick();
            expect(screen.getByRole('spinbutton', { name: 'global' })).toHaveValue(new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(1.5));
            expect(screen.getByRole('spinbutton', { name: 'own' })).toHaveValue(new Intl.NumberFormat('en-US', { style: 'currency', currency: 'JPY' }).format(1.5));
        });

        it('裸写 currency 等同 true，字符串 currency 仍是货币码', async () => {
            const bare = await mount({ defaultValue: 1.5, currency: '' });
            expect(getInput()).toHaveValue('¥1.50');
            bare.unmount();
            await mount({ defaultValue: 1.5, currency: 'USD', localeCode: 'en-US' });
            expect(getInput()).toHaveValue('$1.50');
        });

        it('role 可被使用方覆盖', async () => {
            await mount({ defaultValue: 1 }, { role: 'textbox' });
            expect(screen.getByRole('textbox')).toHaveAttribute('aria-valuenow', '1');
        });

        it('Input 的其余事件经 attrs 透传，keydown、focus、blur 各只发出一次', async () => {
            const onEnterPress = vi.fn<KeyHandler>();
            const onKeyup = vi.fn<KeyHandler>();
            const onClear = vi.fn<(event: MouseEvent) => void>();
            const onKeydown = vi.fn<KeyHandler>();
            const onFocus = vi.fn<FocusHandler>();
            const onBlur = vi.fn<FocusHandler>();
            await mount({ defaultValue: 1, showClear: true, onKeydown, onFocus, onBlur }, { onEnterPress, onKeyup, onClear });
            await focusInput();
            await keyDown('Enter');
            await fireEvent.keyUp(getInput(), { key: 'Enter' });
            expect(onEnterPress).toHaveBeenCalledTimes(1);
            expect(onKeyup).toHaveBeenCalledTimes(1);
            expect(onKeydown).toHaveBeenCalledTimes(1);
            await fireEvent.mouseDown(document.querySelector(`.${prefixCls}-clearbtn`) as HTMLElement);
            expect(onClear).toHaveBeenCalledTimes(1);
            await blurInput();
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect(onBlur).toHaveBeenCalledTimes(1);
        });

        it('六个插槽都转发给 Input，图标插槽仍按图标识别', async () => {
            render(InputNumber, {
                props: { defaultValue: 1, showClear: true },
                slots: {
                    prefix: () => <IconSearch />,
                    suffix: () => 'kg',
                    clearIcon: () => <span data-testid="clear-icon" />,
                    addonBefore: () => 'before',
                    addonAfter: () => 'after',
                },
            });
            await nextTick();
            expect(document.querySelector(`.${prefixCls}-prefix`)).toHaveClass(`${prefixCls}-prefix-icon`);
            expect(document.querySelector(`.${prefixCls}-suffix`)).toHaveClass(`${prefixCls}-suffix-text`);
            expect(document.querySelector(`.${prefixCls}-prepend`)).toHaveTextContent('before');
            expect(document.querySelector(`.${prefixCls}-append`)).toHaveTextContent('after');
            expect(screen.getByTestId('clear-icon')).toBeInTheDocument();
        });

        it('innerButtons 悬停时按钮替换 #suffix，移出后恢复', async () => {
            render(InputNumber, { props: { defaultValue: 1, innerButtons: true }, slots: { suffix: () => 'kg' } });
            await nextTick();
            expect(document.querySelector(`.${prefixCls}-suffix`)).toHaveTextContent('kg');
            await fireEvent.mouseEnter(getWrapper());
            expect(document.querySelector(`.${prefixCls}-suffix`)).not.toHaveTextContent('kg');
            expect(getButtons()).not.toBeNull();
            await fireEvent.mouseLeave(getWrapper());
            expect(document.querySelector(`.${prefixCls}-suffix`)).toHaveTextContent('kg');
        });

        it('hideButtons 与 innerButtons 同时设置时没有按钮', async () => {
            await mount({ defaultValue: 1, hideButtons: true, innerButtons: true });
            await fireEvent.mouseEnter(getWrapper());
            await focusInput();
            expect(getButtons()).toBeNull();
        });

        it('InputGroup 下发 size 与 disabled，自身 disabled 优先', async () => {
            render(InGroup);
            await nextTick();
            const inherit = screen.getByRole('spinbutton', { name: 'inherit' });
            const own = screen.getByRole('spinbutton', { name: 'own' });
            expect(inherit).toBeDisabled();
            expect(own).toBeEnabled();
            expect(inherit).toHaveClass(`${prefixCls}-large`);
            expect(own.closest(`.${prefixCls}-number`)).toHaveClass(`${prefixCls}-number-size-large`);
        });

        it('卸载时清除长按的计时器，之后不再发出 change', async () => {
            vi.useFakeTimers();
            const onChange = vi.fn<Change>();
            const view = await mount({ defaultValue: 0, onChange });
            await hold(getUpButton());
            await advance(numbers.DEFAULT_PRESS_TIMEOUT * 2);
            const calls = onChange.mock.calls.length;
            view.unmount();
            vi.advanceTimersByTime(numbers.DEFAULT_PRESS_TIMEOUT * 4);
            expect(onChange).toHaveBeenCalledTimes(calls);
        });
    });

    it('键盘在边界处值未变时不触发 onChange', async () => {
        const onChange = vi.fn<Change>();
        await mount({ defaultValue: 5, max: 5, min: 5, onChange });
        for (const key of ['ArrowUp', 'ArrowDown', 'Home', 'End']) {
            await keyDown(key);
        }
        expect(onChange).not.toHaveBeenCalled();
    });

    describe('两个指针先后按下同一按钮', () => {
        afterEach(() => {
            vi.useRealTimers();
        });

        it('松开后不留下继续步进的孤儿定时器', async () => {
            vi.useFakeTimers();
            await mount({ defaultValue: 0, pressInterval: 100 });
            await hold(getUpButton());
            await hold(getUpButton());
            await release(getUpButton());
            expect(getInput()).toHaveValue('2');
            // a later press re-arms the shared flag, which would revive an orphaned interval
            await hold(getUpButton());
            expect(getInput()).toHaveValue('3');
            await advance(numbers.DEFAULT_PRESS_TIMEOUT);
            await advance(500);
            expect(getInput()).toHaveValue('8');
        });
    });

    describe('修饰键、长按边界与键盘步进后的受控输入', () => {
        afterEach(() => {
            vi.useRealTimers();
        });

        it.each([
            ['Home', { shiftKey: true }],
            ['Home', { ctrlKey: true }],
            ['End', { altKey: true }],
            ['ArrowUp', { metaKey: true }],
            ['ArrowDown', { altKey: true }],
        ])('带修饰键的 %s 不步进、不跳边界，也不阻止浏览器的默认行为 %o', async (key, modifier) => {
            const onChange = vi.fn<Change>();
            const onKeydown = vi.fn<KeyHandler>();
            await mount({ defaultValue: 5, min: 0, max: 10, onChange, onKeydown });
            const notPrevented = getInput().dispatchEvent(new KeyboardEvent('keydown', { key, ...modifier, bubbles: true, cancelable: true }));
            await nextTick();
            expect(notPrevented).toBe(true);
            expect(getInput()).toHaveValue('5');
            expect(onChange).not.toHaveBeenCalled();
            expect(onKeydown).toHaveBeenCalledTimes(1);
        });

        it('Shift 加 ArrowUp 仍按 shiftStep 步进', async () => {
            await mount({ defaultValue: 5, shiftStep: 3 });
            await keyDown('ArrowUp', { shiftKey: true });
            expect(getInput()).toHaveValue('8');
        });

        it('键盘步进后继续打字，受控的 precision 不把输入中的文本按步进重新格式化', async () => {
            await mountControlled(5.12, { precision: 2 });
            await focusInput();
            await keyDown('ArrowUp');
            expect(getInput()).toHaveValue('6.12');
            await change('6.1');
            expect(getInput()).toHaveValue('6.1');
        });

        it('pressTimeout 为 0 时长按立即进入连发', async () => {
            vi.useFakeTimers();
            await mount({ defaultValue: 0, pressInterval: 100, pressTimeout: 0 });
            await hold(getUpButton());
            expect(getInput()).toHaveValue('1');
            await advance(100);
            expect(getInput()).toHaveValue('2');
            await release(getUpButton());
        });

        it('长按到 max 后停止连发，不再重复触发 upClick', async () => {
            vi.useFakeTimers();
            const onUpClick = vi.fn<Click>();
            await mount({ defaultValue: 9, max: 10, pressInterval: 100, onUpClick });
            await hold(getUpButton());
            expect(getInput()).toHaveValue('10');
            await advance(numbers.DEFAULT_PRESS_TIMEOUT + 500);
            expect(onUpClick).toHaveBeenCalledTimes(1);
            expect(vi.getTimerCount()).toBe(0);
            await release(getUpButton());
        });

        it('长按过程中被禁用，连发立即停止', async () => {
            vi.useFakeTimers();
            const onChange = vi.fn<Change>();
            const disabled = shallowRef(false);
            render({ render: () => <InputNumber defaultValue={0} pressInterval={100} disabled={disabled.value} onChange={onChange} /> });
            await nextTick();
            await hold(getUpButton());
            await advance(numbers.DEFAULT_PRESS_TIMEOUT + 100);
            const reported = onChange.mock.calls.length;
            disabled.value = true;
            await nextTick();
            await advance(500);
            expect(onChange).toHaveBeenCalledTimes(reported);
            await release(getUpButton());
        });
    });
});
