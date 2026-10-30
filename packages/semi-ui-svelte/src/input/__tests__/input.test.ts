import { flushSync, tick } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import type { InputChangeEvent } from '../interface';
import InputCase from './input-case.svelte';
import InputModes from './input-modes.svelte';
import ThrowingChange from './throwing-change.svelte';

type Case = NonNullable<Parameters<typeof InputCase>[1]>['store'];
type Change = (value: string, event: InputChangeEvent) => void;
type Modes = Parameters<typeof InputModes>[1]['mode'];

const prefixCls = `${BASE_CLASS_PREFIX}-input`;
const getValueLength = (str: string) => [...new Intl.Segmenter().segment(str)].length;

const getInput = () => document.querySelector('input') as HTMLInputElement;
const getWrapper = () => document.querySelector<HTMLElement>(`.${prefixCls}-wrapper`) as HTMLElement;
const query = (cls: string) => document.querySelector<HTMLElement>(`.${cls}`) as HTMLElement;
const getClearBtn = () => document.querySelector<HTMLElement>(`.${prefixCls}-clearbtn`);
const getModeBtn = () => document.querySelector<HTMLElement>(`.${prefixCls}-modebtn`);
async function settle() {
    await tick();
    await tick();
    flushSync();
}
async function typeText(el: Element, value: string) {
    await fireEvent.input(el, { target: { value } });
    await settle();
}
function expectMouseDownPrevented(el: Element) {
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
}

function setup(initial: Case = {}) {
    const store = createStore<Case>({ props: {}, slots: {}, handle: {}, ...initial });
    const view = render(InputCase, { props: { store } });
    const update = async (props: NonNullable<Case['props']>) => {
        Object.assign(store.props as object, props);
        await settle();
    };
    return { store, view, update };
}

function setupModes(mode: Modes, value?: string, accept = true) {
    const store = createStore<{ value: string | undefined; accept: boolean; log: string[] }>({ value, accept, log: [] });
    render(InputModes, { props: { mode, store } });
    return { store, input: screen.getByRole('textbox', { name: 'field' }) as HTMLInputElement };
}

describe('Svelte Input', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('值变化时调用 onChange 并显示新值', async () => {
        const onChange = vi.fn<Change>();
        setup({ props: { onChange } });
        await typeText(getInput(), 'semi');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('semi');
        expect(onChange.mock.calls[0][1]).toBeInstanceOf(Event);
        expect(getInput()).toHaveValue('semi');
    });

    it('class 与 style 落在根元素', () => {
        setup({ props: { class: 'test', style: 'color: red' } });
        expect(getWrapper()).toHaveClass('test');
        expect(getWrapper()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getInput()).not.toHaveClass('test');
    });

    it.each(['large', 'default', 'small'] as const)('size=%s', (size) => {
        setup({ props: { size } });
        expect(getInput()).toHaveClass(`${prefixCls}-${size}`);
    });

    it('带 placeholder，数字输出为字符串', async () => {
        const { update } = setup({ props: { placeholder: 'semi placeholder' } });
        expect(screen.getByPlaceholderText('semi placeholder')).toBe(getInput());
        await update({ placeholder: 3 });
        expect(getInput()).toHaveAttribute('placeholder', '3');
    });

    it('值为 undefined 时显示空，value 作初值', () => {
        setup({ props: { value: 'semi' } });
        expect(getInput()).toHaveValue('semi');
    });

    it('disabled 时禁用', () => {
        setup({ props: { disabled: true } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-disabled`);
        expect(getInput()).toHaveClass(`${prefixCls}-disabled`);
        expect(getInput()).toBeDisabled();
    });

    it('不同的 validateStatus', async () => {
        const { update } = setup({ props: { validateStatus: 'warning' } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-warning`);
        expect(getInput()).not.toHaveAttribute('aria-invalid');
        await update({ validateStatus: 'error' });
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-error`);
        expect(getInput()).toHaveAttribute('aria-invalid', 'true');
        await update({ validateStatus: undefined, 'aria-invalid': 'true' });
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-wrapper-error`);
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-wrapper-warning`);
        expect(getInput()).toHaveAttribute('aria-invalid', 'true');
    });

    it('带 prefix 与 suffix', () => {
        setup({ slots: { prefix: 'node', suffix: 'node' } });
        expect(query(`${prefixCls}-prefix`)).toContainHTML('<b>x</b>');
        expect(query(`${prefixCls}-suffix`)).toContainHTML('<b>x</b>');
    });

    it('addonBefore 与 addonAfter', () => {
        setup({ slots: { addonBefore: 'https://', addonAfter: '.com' } });
        expect(query(`${prefixCls}-prepend`)).toHaveTextContent(/^https:\/\/$/);
        expect(query(`${prefixCls}-append`)).toHaveTextContent(/^\.com$/);
    });

    it('type=password 与 password 模式', async () => {
        const { update } = setup({ props: { type: 'password' } });
        expect(getInput()).toHaveAttribute('type', 'password');
        await update({ type: 'text', mode: 'password' });
        expect(getInput()).toHaveAttribute('type', 'password');
        await update({ mode: '' as never });
        expect(getInput()).toHaveAttribute('type', 'text');
    });

    it('password 点击眼睛图标', async () => {
        setup({ props: { value: '123456', mode: 'password' } });
        expect(getInput()).toHaveAttribute('type', 'password');
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Input.showPassword }));
        expect(getInput()).toHaveAttribute('type', 'text');
        expect(screen.getByRole('button', { name: zh_CN.Input.hidePassword })).toBe(getModeBtn());
        expect(getInput()).toHaveFocus();
    });

    it.each(['prefix', 'suffix'] as const)('点击 %s 聚焦', async (slot) => {
        const onFocus = vi.fn<(event: FocusEvent) => void>();
        setup({ props: { value: 'Semi Design', onFocus }, slots: { [slot]: 'search' } });
        await userEvent.click(query(`${prefixCls}-${slot}`));
        expect(getInput()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-focus`);
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('maxlength 与 getValueLength 一起截断 onChange', async () => {
        const onChange = vi.fn<Change>();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        setup({ props: { maxlength: 10, getValueLength, onChange } });
        await typeText(getInput(), '0123456789semi design');
        expect(warn).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('0123456789');
        expect(getInput()).toHaveValue('0123456789');
    });

    it('传 getValueLength 时不设原生 maxlength，未传时为原生属性且不截断', async () => {
        const value = '0123456789semi design';
        const { update } = setup({ props: { maxlength: 10, value, getValueLength } });
        expect(getInput()).toHaveValue(value);
        expect(getInput()).not.toHaveAttribute('maxlength');
        await update({ getValueLength: undefined });
        expect(getInput()).toHaveAttribute('maxlength', '10');
    });

    it('minlength 按 getValueLength 换算原生属性，随属性变化', async () => {
        const value = '💖💖💖';
        const { update } = setup({ props: { minlength: 4, getValueLength } });
        await typeText(getInput(), value);
        expect(getInput()).toHaveAttribute('minlength', String(value.length + (4 - getValueLength(value))));
        await update({ minlength: 2, getValueLength: undefined });
        expect(getInput()).toHaveAttribute('minlength', '2');
    });

    it.each([
        ['onCompositionStart', fireEvent.compositionStart],
        ['onCompositionEnd', fireEvent.compositionEnd],
        ['onCompositionUpdate', fireEvent.compositionUpdate],
    ] as const)('%s 回调', async (name, fire) => {
        const listener = vi.fn<(event: CompositionEvent) => void>();
        setup({ props: { [name]: listener } });
        await fire(getInput(), { data: 'test' });
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('值为数字 0 时也显示清除按钮', () => {
        setup({ props: { value: 0, showClear: true } });
        expect(getClearBtn()).not.toBeNull();
    });

    it('只有主键按下清除按钮才清空，其他鼠标键只阻止抢走焦点', () => {
        const onClear = vi.fn<(event: MouseEvent) => void>();
        setup({ props: { value: 'semi', showClear: true, onClear } });
        for (const button of [1, 2]) {
            const event = new MouseEvent('mousedown', { button, bubbles: true, cancelable: true });
            getClearBtn()?.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(true);
        }
        expect(onClear).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue('semi');
    });

    it('showClear 与 onClear：清除后按钮消失，onChange 第二个参数是 mousedown 事件', async () => {
        const onClear = vi.fn<(event: MouseEvent) => void>();
        const onChange = vi.fn<Change>();
        const outer = vi.fn<() => void>();
        document.addEventListener('mousedown', outer);
        onTestFinished(() => document.removeEventListener('mousedown', outer));
        setup({ props: { value: 'test', showClear: true, onChange, onClear } });
        await fireEvent.mouseDown(getClearBtn() as HTMLElement);
        await settle();
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onClear.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('');
        expect(onChange.mock.calls[0][1].type).toBe('mousedown');
        // read by DateInput
        expect((onChange.mock.calls[0][1] as unknown as { __fromClearBtn?: boolean }).__fromClearBtn).toBe(true);
        expect(outer).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('');
        expect(getClearBtn()).toBeNull();
    });

    it('清除按钮随值渲染，输入框带 sibling-clearbtn 类；未开启 showClear 不渲染', async () => {
        const { update } = setup({ props: { value: 'test', showClear: true } });
        expect(getClearBtn()).not.toBeNull();
        expect(getInput()).toHaveClass(`${prefixCls}-sibling-clearbtn`);
        await update({ value: '' });
        expect(getClearBtn()).toBeNull();
        expect(getInput()).not.toHaveClass(`${prefixCls}-sibling-clearbtn`);
        await update({ value: 'x', showClear: false });
        expect(getClearBtn()).toBeNull();
    });

    it('清除按钮有值才渲染，禁用时不渲染，showClearIgnoreDisabled 时仍渲染，只读时都不渲染', async () => {
        const { update } = setup({ props: { value: '', showClear: true } });
        expect(getClearBtn()).toBeNull();
        await update({ disabled: true, value: 'semi' });
        expect(getClearBtn()).toBeNull();
        await update({ showClearIgnoreDisabled: true });
        expect(getClearBtn()).not.toBeNull();
        await update({ disabled: false, showClearIgnoreDisabled: false });
        expect(getClearBtn()).not.toBeNull();
        await update({ readonly: true, disabled: true, showClearIgnoreDisabled: true });
        expect(getClearBtn()).toBeNull();
    });

    it('readonly 属性', () => {
        setup({ props: { value: 'readonly text', readonly: true } });
        expect(getInput()).toHaveAttribute('readonly');
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-readonly`);
    });

    it('原生 readOnly 只锁定打字，清除按钮保留', () => {
        setup({ props: { value: 'text', showClear: true, readOnly: true } });
        expect(getInput()).toHaveAttribute('readonly');
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-wrapper-readonly`);
        expect(getClearBtn()).not.toBeNull();
    });

    it('onFocus 收到外层的 focusin，onBlur 在离开组件时触发', async () => {
        const onFocus = vi.fn<(event: FocusEvent) => void>();
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        setup({ props: { onFocus, onBlur } });
        await userEvent.click(getInput());
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][0].type).toBe('focusin');
        expect(onBlur).not.toHaveBeenCalled();
        await userEvent.tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-wrapper-focus`);
    });

    it('onEnterPress 在 Enter 时触发，跳过输入法组合的 Enter', async () => {
        const onEnterPress = vi.fn<(event: KeyboardEvent) => void>();
        setup({ props: { onEnterPress } });
        await userEvent.type(getInput(), 'a');
        expect(onEnterPress).not.toHaveBeenCalled();
        await userEvent.keyboard('{Enter}');
        expect(onEnterPress).toHaveBeenCalledTimes(1);
        await fireEvent.keyDown(getInput(), { key: 'Enter', isComposing: true });
        expect(onEnterPress).toHaveBeenCalledTimes(1);
    });

    it('borderless 与 type=hidden', () => {
        setup({ props: { borderless: true, type: 'hidden' } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-borderless`, `${prefixCls}-wrapper-hidden`);
    });

    it.each([
        ['onKeyDown', fireEvent.keyDown],
        ['onKeyUp', fireEvent.keyUp],
    ] as const)('%s 回调', async (name, fire) => {
        const listener = vi.fn<(event: KeyboardEvent) => void>();
        setup({ props: { [name]: listener } });
        await fire(getInput(), { key: 'a' });
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
    });

    it('onInput 回调', async () => {
        const onInput = vi.fn<(event: Event) => void>();
        setup({ props: { onInput } });
        await typeText(getInput(), 'test');
        expect(onInput).toHaveBeenCalledTimes(1);
    });

    it('insetLabel 与 clearIcon', () => {
        setup({ props: { value: 'test', showClear: true }, slots: { insetLabel: 'Label', clearIcon: 'x' } });
        expect(query(`${prefixCls}-inset-label`)).toHaveTextContent(/^Label$/);
        expect(getClearBtn()).toContainElement(query('custom-clear-icon'));
    });

    it('同时传 prefix 与 insetLabel 时前缀仍带 inset-label 类', () => {
        setup({ slots: { prefix: 'P', insetLabel: 'Label' } });
        expect(query(`${prefixCls}-prefix`)).toHaveClass(`${prefixCls}-inset-label`);
        expect(query(`${prefixCls}-prefix`)).toHaveTextContent(/^P$/);
    });

    it('hideSuffix 时后缀在清除按钮渲染期间带 suffix-hidden 类', async () => {
        const { update } = setup({ props: { value: '', hideSuffix: true, showClear: true }, slots: { suffix: 'suffix' } });
        expect(query(`${prefixCls}-suffix`)).not.toHaveClass(`${prefixCls}-suffix-hidden`);
        await update({ value: 'test' });
        expect(query(`${prefixCls}-suffix`)).toHaveClass(`${prefixCls}-suffix-hidden`);
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper__with-suffix-hidden`);
    });

    it('挂载后切换 mode', async () => {
        const { update } = setup({ props: { value: 'test', mode: 'password' } });
        expect(getInput()).toHaveAttribute('type', 'password');
        await update({ mode: 'text' as never });
        expect(getInput()).toHaveAttribute('type', 'text');
        expect(getModeBtn()).toBeNull();
        await update({ mode: 'password' });
        expect(getInput()).toHaveAttribute('type', 'password');
        expect(getModeBtn()).toHaveAttribute('aria-label', zh_CN.Input.showPassword);
    });

    it('密码按钮是原生 button，Enter 与 Space 切换显隐、不冒泡，按下与松开鼠标不切换', async () => {
        const hostKeyDown = vi.fn<() => void>();
        document.addEventListener('keydown', hostKeyDown);
        onTestFinished(() => document.removeEventListener('keydown', hostKeyDown));
        setup({ props: { value: 'test', mode: 'password' } });
        const button = getModeBtn() as HTMLElement;
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
        expectMouseDownPrevented(button);
        await fireEvent.mouseUp(button);
        expect(getInput()).toHaveAttribute('type', 'password');
        button.focus();
        await userEvent.keyboard('{Enter}');
        expect(getInput()).toHaveAttribute('type', 'text');
        expect(getInput()).toHaveFocus();
        (getModeBtn() as HTMLElement).focus();
        await userEvent.keyboard(' ');
        expect(getInput()).toHaveAttribute('type', 'password');
        expect(hostKeyDown).not.toHaveBeenCalled();
    });

    it('点击外层后 input 聚焦并带焦点类', async () => {
        setup({ props: { value: 'test' } });
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-wrapper-focus`);
        await userEvent.click(getWrapper());
        expect(getInput()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-focus`);
    });

    it.each(['prefix', 'suffix'] as const)('%s 的 mousedown 阻止默认行为', (slot) => {
        setup({ props: { value: 'test' }, slots: { [slot]: slot } });
        expectMouseDownPrevented(query(`${prefixCls}-${slot}`));
    });

    it.each(['{Enter}', ' '])('Tab 可以到达有名称的清除按钮，%s 清除后焦点回到输入框', async (key) => {
        const onClear = vi.fn<(event: MouseEvent) => void>();
        setup({ props: { value: 'semi', showClear: true, onClear } });
        await userEvent.click(getInput());
        await userEvent.tab();
        const button = screen.getByRole('button', { name: zh_CN.Input.clear });
        expect(button).toHaveFocus();
        expect(button).toHaveAttribute('type', 'button');
        await userEvent.keyboard(key);
        await settle();
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('');
        expect(getInput()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-focus`);
    });

    it('用鼠标清除时焦点保留在输入框内', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        setup({ props: { value: 'semi', showClear: true, onBlur } });
        await userEvent.click(getInput());
        await userEvent.click(getClearBtn() as HTMLElement);
        await settle();
        expect(getInput()).toHaveValue('');
        expect(getInput()).toHaveFocus();
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('清除按钮有焦点时值在别处被清空，焦点交给输入框', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        const { update } = setup({ props: { value: 'semi', showClear: true, onBlur } });
        await userEvent.click(getInput());
        await userEvent.tab();
        expect(getClearBtn()).toHaveFocus();
        await update({ value: '' });
        expect(getClearBtn()).toBeNull();
        expect(getInput()).toHaveFocus();
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('password 模式禁用时隐藏眼睛按钮', async () => {
        const { update } = setup({ props: { value: '1', disabled: true, mode: 'password' } });
        expect(getModeBtn()).toBeNull();
        expect(getInput()).toHaveAttribute('type', 'password');
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-modebtn`);
        await update({ disabled: false });
        expect(getInput()).toHaveClass(`${prefixCls}-sibling-modebtn`);
        expect(screen.getByRole('button', { name: zh_CN.Input.showPassword })).toBe(getModeBtn());
    });

    it('getValueLength 截断等待输入法组合结束', async () => {
        const onChange = vi.fn<Change>();
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        setup({ props: { maxlength: 2, getValueLength, onChange } });
        await fireEvent.compositionStart(getInput());
        await typeText(getInput(), 'abc');
        expect(onChange.mock.calls.at(-1)?.[0]).toBe('abc');
        await fireEvent.compositionEnd(getInput(), { target: { value: 'abc' } });
        await settle();
        expect(onChange.mock.calls.at(-1)?.[0]).toBe('ab');
        expect(getInput()).toHaveValue('ab');
    });

    it('composition 模式在输入法组合结束后上报一次，并显示组合中的文本', async () => {
        const onChange = vi.fn<Change>();
        setup({ props: { value: '', composition: true, onChange } });
        await fireEvent.compositionStart(getInput());
        await typeText(getInput(), 'ni');
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue('ni');
        await fireEvent.compositionEnd(getInput(), { target: { value: '你' } });
        await settle();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('你');
        expect(onChange.mock.calls[0][1]).toBeInstanceOf(CompositionEvent);
    });

    it('prefix、suffix 与 addons 挂载后获得文本与图标类名，并带 x-semi-prop', async () => {
        setup({ props: { value: '1' }, slots: { addonAfter: 'after', addonBefore: 'icon', prefix: 'icon', suffix: 'kg' } });
        await settle();
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

    it('自定义元素插槽既无文本类也无图标类', async () => {
        setup({ slots: { prefix: 'node' } });
        await settle();
        expect(query(`${prefixCls}-prefix`)).not.toHaveClass(`${prefixCls}-prefix-text`);
        expect(query(`${prefixCls}-prefix`)).not.toHaveClass(`${prefixCls}-prefix-icon`);
    });

    it('insetLabel 带 id 渲染，只传 insetLabel 时以它命名输入框，显式名称优先，有 prefix 时不命名', async () => {
        const first = setup({ props: { insetLabelId: 'label-id' }, slots: { insetLabel: 'Name' } });
        expect(query(`${prefixCls}-inset-label`)).toHaveAttribute('id', 'label-id');
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper__with-prefix`);
        expect(getInput()).toHaveAttribute('aria-labelledby', 'label-id');
        await first.update({ insetLabelId: undefined });
        const labelId = query(`${prefixCls}-inset-label`).id;
        expect(labelId).not.toBe('');
        expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute('aria-labelledby', labelId);
        await first.update({ 'aria-label': 'Own' });
        expect(getInput()).not.toHaveAttribute('aria-labelledby');
        await first.update({ 'aria-label': undefined, 'aria-labelledby': 'other' });
        expect(getInput()).toHaveAttribute('aria-labelledby', 'other');
        first.view.unmount();
        setup({ slots: { insetLabel: 'Name', prefix: 'P' } });
        expect(getInput()).not.toHaveAttribute('aria-labelledby');
    });

    it('全局默认值里的 insetLabelId 不影响 Input', () => {
        // the global type leaves out per-instance ids; the cast stands for an untyped app that sets one anyway
        semiGlobal.config.overrideDefaultProps = { Input: { insetLabelId: 'label-global' } } as object;
        setup({ slots: { insetLabel: 'Name' } });
        expect(document.getElementById('label-global')).toBeNull();
    });

    it('autofocus 挂载时以 preventScroll 聚焦输入框，禁用时不聚焦，不输出原生属性', () => {
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        const view = setup({ props: { autofocus: true, preventScroll: true } });
        expect(focus.mock.contexts).toEqual([getInput()]);
        expect(focus).toHaveBeenCalledWith({ preventScroll: true });
        expect(getInput()).not.toHaveAttribute('autofocus');
        view.view.unmount();
        focus.mockClear();
        setup({ props: { autofocus: true, disabled: true } });
        expect(focus).not.toHaveBeenCalled();
    });

    it('点击外层以 preventScroll 聚焦；禁用的输入框保持未聚焦', async () => {
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        const view = setup({ props: { preventScroll: true } });
        await fireEvent.click(getWrapper());
        expect(focus).toHaveBeenCalledWith({ preventScroll: true });
        expect(getInput()).toHaveFocus();
        view.view.unmount();
        setup({ props: { disabled: true } });
        await fireEvent.click(getWrapper());
        expect(getInput()).not.toHaveFocus();
    });

    it('未声明属性与监听器落到原生 input，class 与 style 保留在包裹层', async () => {
        const onpaste = vi.fn<(event: ClipboardEvent) => void>();
        const onclick = vi.fn<(event: MouseEvent) => void>();
        setup({
            props: {
                id: 'name-id',
                name: 'name',
                class: 'custom',
                style: 'color: red',
                inputStyle: 'color: blue',
                'data-testid': 'name',
                'aria-describedby': 'help',
                'aria-label': 'Name',
                tabindex: -1,
                title: 'tip',
                inputmode: 'numeric',
                onpaste,
                onclick,
            },
        });
        const input = getInput();
        expect(screen.getByTestId('name')).toBe(input);
        for (const [attr, value] of [
            ['aria-label', 'Name'],
            ['aria-describedby', 'help'],
            ['name', 'name'],
            ['tabindex', '-1'],
            ['id', 'name-id'],
            ['title', 'tip'],
            ['inputmode', 'numeric'],
        ]) {
            expect(input).toHaveAttribute(attr, value);
        }
        expect(input).toHaveStyle({ color: 'rgb(0, 0, 255)' });
        await fireEvent.paste(input);
        expect(onpaste).toHaveBeenCalledTimes(1);
        await fireEvent.click(input);
        expect(onclick).toHaveBeenCalledTimes(1);
        for (const attr of ['data-testid', 'aria-label', 'name', 'tabindex', 'id', 'title']) {
            expect(getWrapper()).not.toHaveAttribute(attr);
        }
        expect(getWrapper()).toHaveClass('custom');
        expect(getWrapper()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(input).not.toHaveClass('custom');
    });

    it('声明的 onFocus 不落到原生 input：焦点在 input 与清除按钮之间移动不触发', async () => {
        const onFocus = vi.fn<(event: FocusEvent) => void>();
        setup({ props: { value: 'semi', showClear: true, onFocus } });
        await userEvent.click(getInput());
        await userEvent.tab();
        await userEvent.tab({ shift: true });
        expect(getInput()).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('句柄的 focus、blur 与 select 驱动焦点样式', async () => {
        const { store } = setup({ props: { value: 'semi' } });
        const handle = () => store.handle?.current as NonNullable<NonNullable<Case['handle']>['current']>;
        handle().focus();
        await settle();
        expect(getInput()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-focus`);
        handle().select();
        expect([getInput().selectionStart, getInput().selectionEnd]).toEqual([0, 4]);
        handle().blur();
        await settle();
        expect(getInput()).not.toHaveFocus();
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-wrapper-focus`);
        expect(handle().getInput()).toBe(getInput());
        expect(handle().getNativeElement()).toBe(getWrapper());
    });

    it('句柄的 setSelectionRange 移动选区，focus 默认用 preventScroll 属性并允许覆盖', () => {
        const focus = vi.spyOn(HTMLInputElement.prototype, 'focus');
        const { store } = setup({ props: { value: 'semi design', preventScroll: true } });
        const handle = store.handle?.current as NonNullable<NonNullable<Case['handle']>['current']>;
        handle.setSelectionRange(2, 6, 'backward');
        expect([getInput().selectionStart, getInput().selectionEnd, getInput().selectionDirection]).toEqual([2, 6, 'backward']);
        handle.focus();
        expect(focus).toHaveBeenLastCalledWith({ preventScroll: true });
        handle.focus({ preventScroll: false });
        expect(focus).toHaveBeenLastCalledWith({ preventScroll: false });
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值，自己的属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { Input: { size: 'large', placeholder: 'global', showClear: true } };
        const view = setup({ props: { value: 'semi' } });
        expect(getInput()).toHaveClass(`${prefixCls}-large`);
        expect(getInput()).toHaveAttribute('placeholder', 'global');
        expect(getClearBtn()).not.toBeNull();
        view.view.unmount();
        setup({ props: { size: 'small' } });
        expect(getInput()).toHaveClass(`${prefixCls}-small`);
    });

    it('应用注入的 semiGlobal 默认值', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Input: { size: 'large', disabled: true } };
        render(InputCase, { props: { store: createStore<Case>({}) }, context: new Map([[semiGlobalKey, semi]]) });
        expect(getInput()).toHaveClass(`${prefixCls}-large`);
        expect(getInput()).toBeDisabled();
    });

    it('全局 getValueLength 参与截断', async () => {
        const onChange = vi.fn<Change>();
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        semiGlobal.config.overrideDefaultProps = { Input: { getValueLength } };
        setup({ props: { maxlength: 2, onChange } });
        expect(getInput()).not.toHaveAttribute('maxlength');
        await typeText(getInput(), '💖💖💖');
        expect(onChange.mock.calls[0][0]).toBe('💖💖');
    });
});

describe('Svelte Input 受控值（$bindable）', () => {
    it('非受控：输入后保留文本，onChange 收到新值', async () => {
        const { store, input } = setupModes('uncontrolled');
        await userEvent.type(input, 'bc');
        expect(input).toHaveValue('bc');
        expect(store.log).toEqual(['change b', 'change bc']);
    });

    it('bind:value：输入写回父级，父级改值同步到输入框', async () => {
        const { store, input } = setupModes('bind', 'a');
        await userEvent.type(input, 'b');
        expect(store.value).toBe('ab');
        expect(input).toHaveValue('ab');
        store.value = 'parent';
        await settle();
        expect(input).toHaveValue('parent');
    });

    it('bind:value 改回 undefined 后清空，之后输入可以更新', async () => {
        const { store, input } = setupModes('bind', 'ab');
        store.value = undefined;
        await settle();
        expect(input).toHaveValue('');
        await userEvent.type(input, 'c');
        expect(input).toHaveValue('c');
        expect(store.value).toBe('c');
    });

    it('函数绑定：setter 拒绝时输入框退回原值', async () => {
        const { store, input } = setupModes('function', 'a', false);
        await userEvent.type(input, 'b');
        await settle();
        expect(store.log).toEqual(['set ab', 'change ab']);
        expect(store.value).toBe('a');
        expect(input).toHaveValue('a');
    });

    it('函数绑定：setter 接受时输入框跟随', async () => {
        const { store, input } = setupModes('function', 'a', true);
        await userEvent.type(input, 'b');
        expect(store.value).toBe('ab');
        expect(input).toHaveValue('ab');
    });

    // the error still reaches the window, which a production page may swallow the same way
    it('onChange 抛错时 Input 与 TextArea 仍退回父级保留的值', async () => {
        const swallow = (event: ErrorEvent) => event.preventDefault();
        window.addEventListener('error', swallow);
        render(ThrowingChange);
        const input = screen.getByRole('textbox', { name: '输入框' });
        const textarea = screen.getByRole('textbox', { name: '文本域' });
        await userEvent.type(input, 'b');
        await userEvent.type(textarea, 'b');
        await settle();
        window.removeEventListener('error', swallow);
        expect(input).toHaveValue('a');
        expect(textarea).toHaveValue('a');
    });

    it('单向传值：输入在本地覆盖，父级值不变；父级再推值时覆盖本地', async () => {
        const { store, input } = setupModes('one-way', 'a');
        await userEvent.type(input, 'b');
        expect(store.value).toBe('a');
        expect(input).toHaveValue('ab');
        store.value = 'x';
        await settle();
        expect(input).toHaveValue('x');
    });

    it('父级把值改回 undefined 时清空输入框', async () => {
        const { store, input } = setupModes('one-way', 'semi');
        expect(input).toHaveValue('semi');
        store.value = undefined;
        await settle();
        expect(input).toHaveValue('');
    });

    it('清空受控输入框时上报空值，函数绑定拒绝时仍显示原值', async () => {
        const { store, input } = setupModes('function', 'semi', false);
        expect(store.log).toEqual([]);
        await userEvent.clear(input);
        await settle();
        expect(store.log).toEqual(['set ', 'change ']);
        expect(input).toHaveValue('semi');
    });
});
