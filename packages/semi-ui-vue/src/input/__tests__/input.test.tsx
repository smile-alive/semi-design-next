/** @jsxImportSource vue */
import { nextTick } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconSearch } from '@fibrae/semi-icons-vue';
import { render } from '@test/utils/vue';
import Input, { InputGroup, TextArea, type InputChangeEvent, type InputHandle, type InputProps } from '..';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import InTooltip from './fixtures/in-tooltip.vue';
import Model from './fixtures/model.vue';
import Upper from './fixtures/upper.vue';

type Change = (value: string, event: InputChangeEvent) => void;
const prefixCls = `${BASE_CLASS_PREFIX}-input`;
const getValueLength = (str: string) => [...new Intl.Segmenter().segment(str)].length;

const getInput = () => document.querySelector('input') as HTMLInputElement;
const getWrapper = () => document.querySelector<HTMLElement>(`.${prefixCls}-wrapper`) as HTMLElement;
const query = (cls: string) => document.querySelector<HTMLElement>(`.${cls}`) as HTMLElement;
const getClearBtn = () => document.querySelector<HTMLElement>(`.${prefixCls}-clearbtn`);
const getModeBtn = () => document.querySelector<HTMLElement>(`.${prefixCls}-modebtn`);
// Testing Library's Vue fireEvent resolves to nothing, so read defaultPrevented from a dispatched event
const expectMouseDownPrevented = (el: Element) => {
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
};
// A function ref receives the handle that defineExpose builds
const renderWithHandle = (props: InputProps & Record<string, unknown> = {}) => {
    const refFn = vi.fn<(handle: InputHandle | null) => void>();
    const Host = (hostProps: Record<string, unknown>) => <Input {...hostProps} ref={(value) => refFn(value as InputHandle | null)} />;
    const view = render(Host, { props });
    const handle = () => refFn.mock.calls[0]?.[0] as InputHandle;
    return { ...view, refFn, handle };
};

describe('Input', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('值变化时发出 change 与 update:modelValue', async () => {
        const change = vi.fn<Change>();
        const update = vi.fn<(value: string) => void>();
        render(Input, { props: { onChange: change, 'onUpdate:modelValue': update } });
        await fireEvent.update(getInput(), 'semi');
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0][0]).toBe('semi');
        expect(change.mock.calls[0][1]).toBeInstanceOf(Event);
        expect(update).toHaveBeenCalledWith('semi');
        expect(getInput()).toHaveValue('semi');
    });

    it('class 与 style 落在根元素', () => {
        render(Input, { attrs: { class: 'test', style: { color: 'red' } } });
        expect(getWrapper()).toHaveClass('test');
        expect(getWrapper()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it.each(['large', 'default', 'small'] as const)('size=%s', (size) => {
        render(Input, { props: { size } });
        expect(getInput()).toHaveClass(`${prefixCls}-${size}`);
    });

    it('带 placeholder，数字输出为字符串', async () => {
        const view = render(Input, { props: { placeholder: 'semi placeholder' } });
        expect(screen.getByPlaceholderText('semi placeholder')).toBe(getInput());
        await view.rerender({ placeholder: 3 });
        expect(getInput()).toHaveAttribute('placeholder', '3');
    });

    it('带 defaultValue', () => {
        render(Input, { props: { defaultValue: 'semi' } });
        expect(getInput()).toHaveValue('semi');
    });

    it('disabled 时禁用', () => {
        render(Input, { props: { disabled: true } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-disabled`);
        expect(getInput()).toHaveClass(`${prefixCls}-disabled`);
        expect(getInput()).toBeDisabled();
    });

    it('不同的 validateStatus', async () => {
        const view = render(Input, { props: { validateStatus: 'warning' } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-warning`);
        expect(getInput()).not.toHaveAttribute('aria-invalid');
        await view.rerender({ validateStatus: 'error' });
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-error`);
        expect(getInput()).toHaveAttribute('aria-invalid', 'true');
        await view.rerender({ validateStatus: undefined, 'aria-invalid': 'true' });
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-wrapper-error`);
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-wrapper-warning`);
        expect(getInput()).toHaveAttribute('aria-invalid', 'true');
    });

    it('带 prefix / suffix 插槽', () => {
        render(Input, {
            slots: {
                prefix: () => <div class="prefix">prefix</div>,
                suffix: () => <div class="suffix">suffix</div>,
            },
        });
        expect(query(`${prefixCls}-suffix`)).toContainElement(query('suffix'));
        expect(query(`${prefixCls}-prefix`)).toContainElement(query('prefix'));
    });

    it('addonBefore / addonAfter 插槽', () => {
        render(Input, { slots: { addonBefore: () => 'https://', addonAfter: () => '.com' } });
        expect(query(`${prefixCls}-prepend`)).toHaveTextContent(/^https:\/\/$/);
        expect(query(`${prefixCls}-append`)).toHaveTextContent(/^\.com$/);
    });

    it('type=password', () => {
        render(Input, { props: { type: 'password' } });
        expect(getInput()).toHaveAttribute('type', 'password');
    });

    it('password 模式', async () => {
        const view = render(Input);
        expect(getInput()).toHaveAttribute('type', 'text');
        await view.rerender({ mode: 'password' });
        expect(getInput()).toHaveAttribute('type', 'password');
        await view.rerender({ mode: '' as unknown as InputProps['mode'] });
        expect(getInput()).toHaveAttribute('type', 'text');
    });

    it('password 点击眼睛图标', async () => {
        render(Input, { props: { defaultValue: '123456', autofocus: true, mode: 'password' } });
        expect(getInput()).toHaveAttribute('type', 'password');
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Input.showPassword }));
        expect(getInput()).toHaveAttribute('type', 'text');
        expect(screen.getByRole('button', { name: zh_CN.Input.hidePassword })).toBe(getModeBtn());
        expect(getInput()).toHaveFocus();
    });

    it('受控模式', async () => {
        const change = vi.fn<Change>();
        const view = render(Input, { props: { modelValue: 'semi', onChange: change } });
        expect(getInput()).toHaveValue('semi');
        await fireEvent.update(getInput(), 'vita lemon');
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0][0]).toBe('vita lemon');
        expect(getInput()).toHaveValue('semi');
        await view.rerender({ modelValue: 'vita lemon' });
        expect(getInput()).toHaveValue('vita lemon');
    });

    it.each(['prefix', 'suffix'] as const)('点击 %s 聚焦', async (slot) => {
        const focus = vi.fn<(event: FocusEvent) => void>();
        render(Input, { props: { defaultValue: 'Semi Design', onFocus: focus }, slots: { [slot]: () => 'search' } });
        await userEvent.click(query(`${prefixCls}-${slot}`));
        expect(getInput()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-focus`);
        expect(focus).toHaveBeenCalledTimes(1);
    });

    it('maxlength 与 getValueLength 一起截断 change', async () => {
        const change = vi.fn<Change>();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(Input, { props: { maxlength: 10, getValueLength, onChange: change } });
        await fireEvent.update(getInput(), '0123456789semi design');
        expect(warn).toHaveBeenCalledTimes(1);
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0][0]).toBe('0123456789');
        expect(getInput()).toHaveValue('0123456789');
    });

    it('受控时 getValueLength 不设原生 maxlength', () => {
        const value = '0123456789semi design';
        render(Input, { props: { maxlength: 10, modelValue: value, getValueLength } });
        expect(getInput()).toHaveValue(value);
        expect(getInput()).not.toHaveAttribute('maxlength');
    });

    it('minlength 与 getValueLength', async () => {
        const change = vi.fn<Change>();
        const value = '💖💖💖';
        render(Input, { props: { minlength: 4, getValueLength, onChange: change } });
        await fireEvent.update(getInput(), value);
        expect(change.mock.calls[0][0]).toBe(value);
        expect(getInput()).toHaveAttribute('minlength', String(value.length + (4 - getValueLength(value))));
    });

    it('同时设置 maxlength 与 minlength 时，输入后仍调整原生 minlength', async () => {
        const value = '💖💖💖';
        render(Input, { props: { maxlength: 10, minlength: 4, getValueLength } });
        await fireEvent.update(getInput(), value);
        expect(getInput()).toHaveAttribute('minlength', String(value.length + (4 - getValueLength(value))));
    });

    it('minlength 属性变化后，原生 minlength 随之变化', async () => {
        const view = render(Input, { props: { minlength: 5 } });
        expect(getInput()).toHaveAttribute('minlength', '5');
        await view.rerender({ minlength: 2 });
        expect(getInput()).toHaveAttribute('minlength', '2');
    });

    it('传 getValueLength 时，原生 minlength 按当前值换算，不等下一次输入', async () => {
        const value = '💖💖';
        const view = render(Input, { props: { minlength: 4, modelValue: value, getValueLength } });
        expect(getInput()).toHaveAttribute('minlength', String(value.length + 2));
        await view.rerender({ minlength: 3 });
        expect(getInput()).toHaveAttribute('minlength', String(value.length + 1));
        await view.rerender({ minlength: 1 });
        expect(getInput()).toHaveAttribute('minlength', '1');
    });

    it.each([
        ['compositionstart', fireEvent.compositionStart],
        ['compositionend', fireEvent.compositionEnd],
        ['compositionupdate', fireEvent.compositionUpdate],
    ] as const)('%s 事件', async (name, fire) => {
        const listener = vi.fn<(event: CompositionEvent) => void>();
        const view = render(Input, { props: { [`on${name[0].toUpperCase()}${name.slice(1)}`]: listener } });
        await fire(getInput(), { data: 'test' });
        expect(listener).toHaveBeenCalledTimes(1);
        expect(view.emitted(name)).toHaveLength(1);
    });

    it('值为数字 0 时也显示清除按钮', () => {
        render(Input, { props: { modelValue: 0, showClear: true } });
        expect(getClearBtn()).not.toBeNull();
    });

    it('只有主键按下清除按钮才清空，其他鼠标键只阻止抢走焦点', () => {
        const clear = vi.fn<(event: MouseEvent) => void>();
        render(Input, { props: { defaultValue: 'semi', showClear: true, onClear: clear } });
        for (const button of [1, 2]) {
            const event = new MouseEvent('mousedown', { button, bubbles: true, cancelable: true });
            getClearBtn()?.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(true);
        }
        expect(clear).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue('semi');
    });

    it('清除按钮的 mousedown 照常冒泡，页面上其他弹层的点击外部能收到', async () => {
        const onMouseDown = vi.fn<(event: MouseEvent) => void>();
        document.addEventListener('mousedown', onMouseDown);
        onTestFinished(() => document.removeEventListener('mousedown', onMouseDown));
        render(Input, { props: { defaultValue: 'semi', showClear: true } });
        await fireEvent.mouseDown(getClearBtn() as HTMLElement);
        expect(onMouseDown).toHaveBeenCalledTimes(1);
    });

    it('showClear 与 clear 事件', async () => {
        const clear = vi.fn<(event: MouseEvent) => void>();
        const change = vi.fn<Change>();
        render(Input, { props: { defaultValue: 'test', showClear: true, onChange: change, onClear: clear } });
        await fireEvent.mouseDown(getClearBtn() as HTMLElement);
        expect(clear).toHaveBeenCalledTimes(1);
        expect(clear.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0][0]).toBe('');
        expect(getInput()).toHaveValue('');
        expect(getClearBtn()).toBeNull();
    });

    it('readonly 属性', () => {
        render(Input, { props: { defaultValue: 'readonly text', readonly: true } });
        expect(getInput()).toHaveAttribute('readonly');
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-readonly`);
    });

    it('原生 readOnly 只锁定输入，仍可清除', () => {
        render(Input, { props: { defaultValue: 'semi', showClear: true }, attrs: { readOnly: true } });
        expect(getInput()).toHaveAttribute('readonly');
        expect(getClearBtn()).not.toBeNull();
    });

    it('focus 事件收到外层的 focusin', async () => {
        const focus = vi.fn<(event: FocusEvent) => void>();
        render(Input, { props: { onFocus: focus } });
        await userEvent.click(getInput());
        expect(focus).toHaveBeenCalledTimes(1);
        expect(focus.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
        expect(focus.mock.calls[0][0].type).toBe('focusin');
    });

    it('blur 事件', async () => {
        const blur = vi.fn<(event: FocusEvent) => void>();
        render(Input, { props: { onBlur: blur } });
        await userEvent.click(getInput());
        expect(blur).not.toHaveBeenCalled();
        await userEvent.tab();
        expect(blur).toHaveBeenCalledTimes(1);
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-wrapper-focus`);
    });

    it('enterPress 事件', async () => {
        const enterPress = vi.fn<(event: KeyboardEvent) => void>();
        render(Input, { props: { onEnterPress: enterPress } });
        await userEvent.type(getInput(), 'a');
        expect(enterPress).not.toHaveBeenCalled();
        await userEvent.keyboard('{Enter}');
        expect(enterPress).toHaveBeenCalledTimes(1);
        expect(enterPress.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
    });

    it('enterPress 跳过确认输入法组合的 Enter', async () => {
        const enterPress = vi.fn<(event: KeyboardEvent) => void>();
        render(Input, { props: { onEnterPress: enterPress } });
        await fireEvent.keyDown(getInput(), { key: 'Enter', isComposing: true });
        expect(enterPress).not.toHaveBeenCalled();
        await fireEvent.keyDown(getInput(), { key: 'Enter' });
        expect(enterPress).toHaveBeenCalledTimes(1);
    });

    it('borderless 属性', () => {
        render(Input, { props: { borderless: true } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-borderless`);
    });

    it.each([
        ['keydown', fireEvent.keyDown],
        ['keyup', fireEvent.keyUp],
    ] as const)('%s 事件', async (name, fire) => {
        const view = render(Input);
        await fire(getInput(), { key: 'a' });
        expect(view.emitted(name)).toHaveLength(1);
        expect((view.emitted<[KeyboardEvent]>(name)[0] as [KeyboardEvent])[0]).toBeInstanceOf(KeyboardEvent);
    });

    it('insetLabel 插槽', () => {
        render(Input, { slots: { insetLabel: () => 'Label' } });
        expect(query(`${prefixCls}-inset-label`)).toHaveTextContent(/^Label$/);
    });

    it('clearIcon 插槽', () => {
        render(Input, {
            props: { defaultValue: 'test', showClear: true },
            slots: { clearIcon: () => <span class="custom-clear-icon">X</span> },
        });
        expect(getClearBtn()).toContainElement(query('custom-clear-icon'));
    });

    it('hideSuffix 时后缀在清除按钮渲染期间带 suffix-hidden 类', async () => {
        const view = render(Input, {
            props: { modelValue: '', hideSuffix: true, showClear: true },
            slots: { suffix: () => 'suffix' },
        });
        expect(query(`${prefixCls}-suffix`)).not.toHaveClass(`${prefixCls}-suffix-hidden`);
        await view.rerender({ modelValue: 'test' });
        expect(query(`${prefixCls}-suffix`)).toHaveClass(`${prefixCls}-suffix-hidden`);
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper__with-suffix-hidden`);
    });

    it('input 事件', async () => {
        const view = render(Input);
        await fireEvent.input(getInput(), { target: { value: 'test' } });
        expect(view.emitted('input')).toHaveLength(1);
    });

    it('@keypress 经 attrs 落到原生 input', async () => {
        const keypress = vi.fn<(event: KeyboardEvent) => void>();
        render(Input, { attrs: { onKeypress: keypress } });
        await fireEvent.keyPress(getInput(), { key: 'a', code: 'KeyA', charCode: 97 });
        expect(keypress).toHaveBeenCalledTimes(1);
    });

    it('清除按钮随值渲染，输入框随之带 sibling-clearbtn 类', async () => {
        const view = render(Input, { props: { modelValue: 'test', showClear: true } });
        expect(getClearBtn()).not.toBeNull();
        expect(getInput()).toHaveClass(`${prefixCls}-sibling-clearbtn`);
        await view.rerender({ modelValue: '' });
        expect(getClearBtn()).toBeNull();
        expect(getInput()).not.toHaveClass(`${prefixCls}-sibling-clearbtn`);
    });

    it('挂载后切换 mode', async () => {
        const view = render(Input, { props: { defaultValue: 'test', mode: 'password' } });
        expect(getInput()).toHaveAttribute('type', 'password');
        await view.rerender({ mode: 'text' as unknown as InputProps['mode'] });
        expect(getInput()).toHaveAttribute('type', 'text');
        expect(getModeBtn()).toBeNull();
    });

    it('密码按钮是原生 button，Space 切换显隐并把焦点交给输入框', async () => {
        render(Input, { props: { defaultValue: 'test', mode: 'password' } });
        const button = getModeBtn() as HTMLElement;
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
        expect(button).not.toHaveAttribute('role');
        expect(button).not.toHaveAttribute('tabindex');
        button.focus();
        await userEvent.keyboard(' ');
        expect(getInput()).toHaveAttribute('type', 'text');
        expect(getInput()).toHaveFocus();
        (getModeBtn() as HTMLElement).focus();
        await userEvent.keyboard(' ');
        expect(getInput()).toHaveAttribute('type', 'password');
    });

    it('密码按钮的 mousedown 阻止默认行为', () => {
        render(Input, { props: { defaultValue: 'test', mode: 'password' } });
        expectMouseDownPrevented(getModeBtn() as HTMLElement);
    });

    it('模板 ref 拿到 expose 的句柄', () => {
        const { handle } = renderWithHandle();
        expect(handle().input).toBe(getInput());
        expect(handle().nativeElement).toBe(getWrapper());
    });

    it('密码按钮按下与松开鼠标不切换模式，点击才切换', async () => {
        render(Input, { props: { defaultValue: 'test', mode: 'password' } });
        await fireEvent.mouseDown(getModeBtn() as HTMLElement);
        await fireEvent.mouseUp(getModeBtn() as HTMLElement);
        expect(getInput()).toHaveAttribute('type', 'password');
        await fireEvent.click(getModeBtn() as HTMLElement);
        expect(getInput()).toHaveAttribute('type', 'text');
    });

    it('点击外层后 input 聚焦并带焦点类', async () => {
        render(Input, { props: { defaultValue: 'test' } });
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-wrapper-focus`);
        await userEvent.click(getWrapper());
        expect(getInput()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-focus`);
    });

    it('未开启 showClear 时有值也不渲染清除按钮', () => {
        render(Input, { props: { defaultValue: 'test' } });
        expect(getClearBtn()).toBeNull();
        expect(getInput()).not.toHaveClass(`${prefixCls}-sibling-clearbtn`);
    });

    it('密码按钮按 Enter 切换显隐，Enter 与 Space 不冒泡到宿主的 keydown 处理器', async () => {
        const hostKeyDown = vi.fn<() => void>();
        document.addEventListener('keydown', hostKeyDown);
        onTestFinished(() => document.removeEventListener('keydown', hostKeyDown));
        render(Input, { props: { defaultValue: 'test', mode: 'password' } });
        (getModeBtn() as HTMLElement).focus();
        await userEvent.keyboard('{Enter}');
        expect(getInput()).toHaveAttribute('type', 'text');
        expect(getInput()).toHaveFocus();
        (getModeBtn() as HTMLElement).focus();
        await userEvent.keyboard(' ');
        expect(getInput()).toHaveAttribute('type', 'password');
        expect(hostKeyDown).not.toHaveBeenCalled();
    });

    it.each(['prefix', 'suffix'] as const)('%s 的 mousedown 阻止默认行为', (slot) => {
        render(Input, { props: { defaultValue: 'test' }, slots: { [slot]: () => slot } });
        expectMouseDownPrevented(query(`${prefixCls}-${slot}`));
    });
});

describe('Input 行为基线', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('非受控输入框保留用户输入，并上报 change 事件', async () => {
        const change = vi.fn<Change>();
        render(Input, { props: { defaultValue: 'a', onChange: change } });
        await userEvent.type(getInput(), 'bc');
        expect(getInput()).toHaveValue('abc');
        expect(change.mock.calls.map(([value]) => value)).toEqual(['ab', 'abc']);
        expect(change.mock.calls[1][1].target).toBe(getInput());
    });

    it('单向绑定时父组件改写的值显示在输入框', async () => {
        render(Upper);
        await userEvent.type(getInput(), 'ab');
        expect(getInput()).toHaveValue('AB');
    });

    it('单向绑定且父组件不接受新值时，输入框回到 modelValue', async () => {
        const change = vi.fn<Change>();
        render(Input, { props: { modelValue: 'a', onChange: change } });
        await userEvent.type(getInput(), 'b');
        expect(change.mock.calls[0][0]).toBe('ab');
        expect(getInput()).toHaveValue('a');
    });

    it('v-model 双向绑定，父组件改值后输入框跟随', async () => {
        render(Model);
        const input = screen.getByRole('textbox', { name: 'model' });
        await userEvent.type(input, 'ab');
        expect(screen.getByTestId('model-value')).toHaveTextContent('ab');
        await userEvent.click(screen.getByRole('button', { name: 'set' }));
        expect(input).toHaveValue('parent');
    });

    it('v-model 改回 undefined 后转为非受控，之后输入可以更新', async () => {
        render(Model);
        const input = screen.getByRole('textbox', { name: 'model' });
        await userEvent.type(input, 'ab');
        await userEvent.click(screen.getByRole('button', { name: 'reset' }));
        expect(input).toHaveValue('');
        await userEvent.type(input, 'c');
        expect(input).toHaveValue('c');
    });

    it('v-model.trim 收到去除空白的值', async () => {
        render(Model);
        await userEvent.type(screen.getByRole('textbox', { name: 'trim' }), ' a ');
        expect(screen.getByTestId('trim-value')).toHaveTextContent('"a"');
    });

    it('v-model.trim 能输入词间空格，且修饰符不落到原生元素', async () => {
        render(Model);
        const input = screen.getByRole('textbox', { name: 'trim' });
        await userEvent.type(input, 'a b');
        expect(input).toHaveValue('a b');
        expect(screen.getByTestId('trim-value')).toHaveTextContent('"a b"');
        expect(input).not.toHaveAttribute('modelmodifiers');
    });

    it('v-model.number 能输入小数', async () => {
        render(Model);
        const input = screen.getByRole('textbox', { name: 'number' });
        await userEvent.type(input, '1.5');
        expect(input).toHaveValue('1.5');
        expect(screen.getByTestId('number-value')).toHaveTextContent('1.5');
    });

    it('受控值回到 undefined（表单重置）时清空输入框', async () => {
        const view = render(Input, { props: { modelValue: 'semi' } });
        expect(getInput()).toHaveValue('semi');
        await view.rerender({ modelValue: undefined });
        expect(getInput()).toHaveValue('');
    });

    it('显式 undefined 且有 update 监听时按非受控处理：取 defaultValue，输入即更新', async () => {
        const update = vi.fn<(value: string) => void>();
        render(Input, { props: { defaultValue: 'semi', modelValue: undefined, 'onUpdate:modelValue': update } });
        expect(getInput()).toHaveValue('semi');
        await userEvent.type(getInput(), '!');
        expect(getInput()).toHaveValue('semi!');
        expect(update).toHaveBeenCalledWith('semi!');
    });

    it('父组件以同一个值重渲染时仍显示 modelValue', async () => {
        const view = render(Input, { props: { modelValue: 'a', onChange: vi.fn<Change>() } });
        await fireEvent.update(getInput(), 'ab');
        await view.rerender({ modelValue: 'a', size: 'large' });
        expect(getInput()).toHaveValue('a');
    });

    it('清空受控输入框时上报空值，但在属性变化前仍显示该属性值', async () => {
        const change = vi.fn<Change>();
        const clear = vi.fn<(event: MouseEvent) => void>();
        render(Input, { props: { modelValue: 'semi', showClear: true, onChange: change, onClear: clear } });
        await fireEvent.mouseDown(getClearBtn() as HTMLElement);
        expect(change).toHaveBeenCalledWith('', expect.anything());
        expect(clear).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('semi');
    });

    it('清除按钮触发 change 时第二个参数是鼠标事件', async () => {
        const change = vi.fn<Change>();
        render(Input, { props: { defaultValue: 'semi', showClear: true, onChange: change } });
        await fireEvent.mouseDown(getClearBtn() as HTMLElement);
        expect(change.mock.calls[0][1]).toBeInstanceOf(MouseEvent);
        expect(change.mock.calls[0][1].type).toBe('mousedown');
    });

    it('清除按钮有值才渲染，禁用时不渲染，showClearIgnoreDisabled 时仍渲染', async () => {
        const view = render(Input, { props: { modelValue: '', showClear: true } });
        expect(getClearBtn()).toBeNull();
        await view.rerender({ disabled: true, modelValue: 'semi' });
        expect(getClearBtn()).toBeNull();
        await view.rerender({ showClearIgnoreDisabled: true });
        expect(getClearBtn()).not.toBeNull();
        await view.rerender({ disabled: false, showClearIgnoreDisabled: false });
        expect(getClearBtn()).not.toBeNull();
    });

    it('只读时不渲染清除按钮，showClearIgnoreDisabled 也不例外', async () => {
        const view = render(Input, { props: { readonly: true, defaultValue: 'semi', showClear: true } });
        expect(getClearBtn()).toBeNull();
        await view.rerender({ disabled: true, showClearIgnoreDisabled: true });
        expect(getClearBtn()).toBeNull();
    });

    it.each(['{Enter}', ' '])('Tab 可以到达有名称的清除按钮，%s 清除后焦点回到输入框', async (key) => {
        const clear = vi.fn<(event: MouseEvent) => void>();
        render(Input, { props: { defaultValue: 'semi', showClear: true, onClear: clear } });
        await userEvent.click(getInput());
        await userEvent.tab();
        const button = screen.getByRole('button', { name: zh_CN.Input.clear });
        expect(button).toHaveFocus();
        expect(button).toHaveAttribute('type', 'button');
        await userEvent.keyboard(key);
        expect(clear).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('');
        expect(getInput()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-focus`);
    });

    it('用鼠标清除时焦点保留在输入框内', async () => {
        const blur = vi.fn<(event: FocusEvent) => void>();
        render(Input, { props: { defaultValue: 'semi', showClear: true, onBlur: blur } });
        await userEvent.click(getInput());
        await userEvent.click(getClearBtn() as HTMLElement);
        expect(getInput()).toHaveValue('');
        expect(getInput()).toHaveFocus();
        expect(blur).not.toHaveBeenCalled();
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-focus`);
    });

    it('清除按钮为 DateInput 标记 change 事件，mousedown 照常冒泡以便外部点击检测关闭浮层', async () => {
        const change = vi.fn<Change>();
        const outer = vi.fn<() => void>();
        document.body.addEventListener('mousedown', outer);
        onTestFinished(() => document.body.removeEventListener('mousedown', outer));
        render(Input, { props: { defaultValue: 'semi', showClear: true, onChange: change } });
        await fireEvent.mouseDown(getClearBtn() as HTMLElement);
        // The marker is an internal flag for DateInput and is absent from the public event type
        const event = change.mock.calls[0][1] as unknown as { __fromClearBtn?: boolean };
        expect(event.__fromClearBtn).toBe(true);
        expect(outer).toHaveBeenCalledTimes(1);
    });

    it('password 模式禁用时隐藏眼睛按钮，并为辅助技术提供标签', async () => {
        const view = render(Input, { props: { defaultValue: '1', disabled: true, mode: 'password' } });
        expect(getModeBtn()).toBeNull();
        expect(getInput()).toHaveAttribute('type', 'password');
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-modebtn`);
        await view.rerender({ disabled: false });
        expect(screen.getByRole('button', { name: zh_CN.Input.showPassword })).toBe(getModeBtn());
        expect(getInput()).toHaveClass(`${prefixCls}-sibling-modebtn`);
    });

    it('挂载后切换到 password 模式时关闭眼睛', async () => {
        const view = render(Input, { props: { defaultValue: '1' } });
        await view.rerender({ mode: 'password' });
        expect(getInput()).toHaveAttribute('type', 'password');
        expect(getModeBtn()).toHaveAttribute('aria-label', zh_CN.Input.showPassword);
    });

    it('未设置 getValueLength 时 maxlength 为原生属性，change 不截断', async () => {
        const change = vi.fn<Change>();
        render(Input, { props: { maxlength: 3, onChange: change } });
        expect(getInput()).toHaveAttribute('maxlength', '3');
        await fireEvent.update(getInput(), 'abcd');
        expect(change.mock.calls[0][0]).toBe('abcd');
    });

    it('getValueLength 截断等待输入法组合结束', async () => {
        const change = vi.fn<Change>();
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(Input, { props: { maxlength: 2, getValueLength, onChange: change } });
        await fireEvent.compositionStart(getInput());
        await fireEvent.update(getInput(), 'abc');
        expect(change.mock.calls.at(-1)?.[0]).toBe('abc');
        await fireEvent.compositionEnd(getInput(), { target: { value: 'abc' } });
        expect(change.mock.calls.at(-1)?.[0]).toBe('ab');
        expect(getInput()).toHaveValue('ab');
    });

    it('composition 受控且父组件拒绝组合结果时，组合结束后恢复为属性值', async () => {
        const view = render(Input, { props: { modelValue: '', composition: true, onChange: vi.fn<Change>() } });
        await fireEvent.compositionStart(getInput());
        await fireEvent.update(getInput(), 'ni');
        await fireEvent.compositionEnd(getInput(), { target: { value: '你' } });
        await view.rerender({ placeholder: 'later' });
        expect(getInput()).toHaveValue('');
    });

    it('composition 模式在输入法组合结束后上报一次，并显示组合中的文本', async () => {
        const change = vi.fn<Change>();
        render(Input, { props: { modelValue: '', composition: true, onChange: change } });
        await fireEvent.compositionStart(getInput());
        await fireEvent.update(getInput(), 'ni');
        expect(change).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue('ni');
        await fireEvent.compositionEnd(getInput(), { target: { value: '你' } });
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0][0]).toBe('你');
        expect(change.mock.calls[0][1]).toBeInstanceOf(CompositionEvent);
    });

    it('prefix、suffix 与 addons 获得文本与图标类名以及 x-semi-prop 插槽', () => {
        render(Input, {
            props: { defaultValue: '1' },
            slots: {
                addonAfter: () => 'after',
                addonBefore: () => <IconSearch />,
                prefix: () => <IconSearch />,
                suffix: () => 'kg',
            },
        });
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

    it('自定义元素插槽既无文本类也无图标类，空插槽不渲染容器', () => {
        render(Input, { slots: { prefix: () => <b>x</b>, suffix: () => [] } });
        expect(query(`${prefixCls}-prefix`)).not.toHaveClass(`${prefixCls}-prefix-text`);
        expect(query(`${prefixCls}-prefix`)).not.toHaveClass(`${prefixCls}-prefix-icon`);
        expect(query(`${prefixCls}-suffix`)).toBeNull();
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-wrapper__with-suffix`);
    });

    it('insetLabel 带 id 渲染，并标记包裹层', () => {
        render(Input, { props: { insetLabelId: 'label-id' }, slots: { insetLabel: () => 'Name' } });
        expect(query(`${prefixCls}-inset-label`)).toHaveAttribute('id', 'label-id');
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper__with-prefix`);
    });

    it('全局默认值里的 insetLabelId 不影响 Input', () => {
        // the global type leaves out per-instance ids; the cast stands for an untyped app that sets one anyway
        semiGlobal.config.overrideDefaultProps = { Input: { insetLabelId: 'label-global' } } as object;
        render(Input, { slots: { insetLabel: () => 'Name' } });
        expect(document.getElementById('label-global')).toBeNull();
    });

    it('只传 insetLabel 时以它命名输入框，显式名称优先，有 prefix 时不命名', async () => {
        const view = render(Input, { slots: { insetLabel: () => 'Name' } });
        const labelId = query(`${prefixCls}-inset-label`).id;
        expect(labelId).not.toBe('');
        expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute('aria-labelledby', labelId);
        await view.rerender({ insetLabelId: 'label-id' });
        expect(getInput()).toHaveAttribute('aria-labelledby', 'label-id');
        await view.rerender({ 'aria-label': 'Own' });
        expect(getInput()).not.toHaveAttribute('aria-labelledby');
        await view.rerender({ 'aria-label': undefined, 'aria-labelledby': 'other' });
        expect(getInput()).toHaveAttribute('aria-labelledby', 'other');
        view.unmount();
        render(Input, { slots: { insetLabel: () => 'Name', prefix: () => 'P' } });
        expect(getInput()).not.toHaveAttribute('aria-labelledby');
    });

    it('type 为 hidden 时隐藏包裹层', () => {
        render(Input, { props: { type: 'hidden' } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-hidden`);
    });

    it('autofocus 挂载时以 preventScroll 聚焦输入框，禁用时不聚焦', () => {
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        const view = render(Input, { props: { autofocus: true, preventScroll: true } });
        // Testing Library re-inserts the mounted nodes, which drops jsdom focus; the browser test checks real focus
        expect(focus.mock.contexts).toEqual([getInput()]);
        expect(focus).toHaveBeenCalledWith({ preventScroll: true });
        expect(getInput()).not.toHaveAttribute('autofocus');
        view.unmount();
        focus.mockClear();
        render(Input, { props: { autofocus: true, disabled: true } });
        expect(focus).not.toHaveBeenCalled();
    });

    it('点击包裹层以 preventScroll 聚焦输入框；禁用的输入框保持未聚焦', async () => {
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        const view = render(Input, { props: { preventScroll: true } });
        await fireEvent.click(getWrapper());
        expect(focus).toHaveBeenCalledWith({ preventScroll: true });
        expect(getInput()).toHaveFocus();
        view.unmount();
        render(Input, { props: { disabled: true } });
        await fireEvent.click(getWrapper());
        expect(getInput()).not.toHaveFocus();
    });

    it('未声明属性与监听器落到原生 input，class 与 style 保留在包裹层', async () => {
        const paste = vi.fn<(event: ClipboardEvent) => void>();
        const click = vi.fn<(event: MouseEvent) => void>();
        render(Input, {
            props: { inputStyle: { color: 'blue' } },
            attrs: {
                id: 'name-id',
                name: 'name',
                class: 'custom',
                style: { color: 'red' },
                'data-testid': 'name',
                'aria-describedby': 'help',
                'aria-label': 'Name',
                tabindex: -1,
                title: 'tip',
                inputmode: 'numeric',
                onPaste: paste,
                onClick: click,
            },
        });
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
        await fireEvent.paste(input);
        expect(paste).toHaveBeenCalledTimes(1);
        await fireEvent.click(input);
        expect(click).toHaveBeenCalledTimes(1);
        for (const attr of ['data-testid', 'aria-label', 'name', 'tabindex', 'id', 'title']) {
            expect(getWrapper()).not.toHaveAttribute(attr);
        }
        expect(getWrapper()).toHaveClass('custom');
        expect(input).not.toHaveClass('custom');
    });

    it('声明的 focus 不落到原生 input：焦点在 input 与清除按钮之间移动不触发', async () => {
        const focus = vi.fn<(event: FocusEvent) => void>();
        render(Input, { props: { defaultValue: 'semi', showClear: true, onFocus: focus } });
        await userEvent.click(getInput());
        await userEvent.tab();
        await userEvent.tab({ shift: true });
        expect(getInput()).toHaveFocus();
        expect(focus).toHaveBeenCalledTimes(1);
    });

    it('Tooltip 内的 input 是一个 Tab 停靠点，并由 Tooltip 描述', async () => {
        render(InTooltip);
        expect(getWrapper()).not.toHaveAttribute('tabindex');
        await userEvent.tab();
        expect(getInput()).toHaveFocus();
        await waitFor(() => expect(getInput()).toHaveAccessibleDescription());
        expect(getWrapper()).not.toHaveAttribute('aria-describedby');
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('句柄的 focus、blur 与 select 驱动焦点样式', async () => {
        const { handle } = renderWithHandle({ defaultValue: 'semi' });
        handle().focus();
        await nextTick();
        expect(getInput()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-focus`);
        handle().select();
        expect([getInput().selectionStart, getInput().selectionEnd]).toEqual([0, 4]);
        handle().blur();
        await nextTick();
        expect(getInput()).not.toHaveFocus();
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-wrapper-focus`);
    });

    it('句柄恰好包含文档中的方法与节点', () => {
        const { handle } = renderWithHandle();
        expect(Object.keys(handle()).sort()).toEqual(['blur', 'focus', 'input', 'nativeElement', 'select', 'setSelectionRange'].sort());
        for (const method of ['blur', 'focus', 'select', 'setSelectionRange'] as const) {
            expect(typeof handle()[method]).toBe('function');
        }
    });

    it('句柄的 setSelectionRange 移动原生 input 的选区', () => {
        const { handle } = renderWithHandle({ defaultValue: 'semi design' });
        handle().setSelectionRange(2, 6, 'backward');
        expect([getInput().selectionStart, getInput().selectionEnd, getInput().selectionDirection]).toEqual([2, 6, 'backward']);
    });

    it('句柄的 focus 默认使用 preventScroll 属性，并允许 options 覆盖', async () => {
        const focus = vi.spyOn(HTMLInputElement.prototype, 'focus');
        const view = renderWithHandle({ preventScroll: true });
        const { handle } = view;
        handle().focus();
        expect(focus).toHaveBeenLastCalledWith({ preventScroll: true });
        handle().focus({ preventScroll: false });
        expect(focus).toHaveBeenLastCalledWith({ preventScroll: false });
        await view.rerender({ preventScroll: undefined });
        handle().focus();
        expect(focus).toHaveBeenLastCalledWith({ preventScroll: undefined });
    });

    it('句柄保持同一个对象，并在重新渲染后上报已挂载节点', async () => {
        const view = renderWithHandle();
        const { handle, refFn } = view;
        await view.rerender({ defaultValue: 'x', showClear: true, insetLabelId: 'semi' });
        const handles = new Set(refFn.mock.calls.map(([value]) => value));
        expect(handles.size).toBe(1);
        expect(handle().input).toBe(getInput());
        expect(handle().nativeElement).toBe(getWrapper());
    });

    it('卸载后句柄上报 null 节点', () => {
        const view = renderWithHandle();
        const mounted = view.handle();
        view.unmount();
        const { refFn } = view;
        expect(refFn).toHaveBeenLastCalledWith(null);
        expect(mounted.input).toBeNull();
        expect(mounted.nativeElement).toBeNull();
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Input: { size: 'large', placeholder: 'global', showClear: true } };
        const view = render(Input, { props: { defaultValue: 'semi' } });
        expect(getInput()).toHaveClass(`${prefixCls}-large`);
        expect(getInput()).toHaveAttribute('placeholder', 'global');
        expect(getClearBtn()).not.toBeNull();
        view.unmount();
        render(Input, { props: { size: 'small' } });
        expect(getInput()).toHaveClass(`${prefixCls}-small`);
    });

    it('应用注入的 semiGlobal 默认值', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Input: { size: 'large', disabled: true } };
        render(Input, { global: { provide: { [semiGlobalKey as symbol]: semi } } });
        expect(getInput()).toHaveClass(`${prefixCls}-large`);
        expect(getInput()).toBeDisabled();
    });

    it('全局 getValueLength 参与截断', async () => {
        const change = vi.fn<Change>();
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        semiGlobal.config.overrideDefaultProps = { Input: { getValueLength } };
        render(Input, { props: { maxlength: 2, onChange: change } });
        expect(getInput()).not.toHaveAttribute('maxlength');
        await fireEvent.update(getInput(), '💖💖💖');
        expect(change.mock.calls[0][0]).toBe('💖💖');
    });

    it('Boolean prop 都有 default 键，Function prop 的 default 为 undefined', () => {
        const offenders = [Input, TextArea, InputGroup].flatMap((component) =>
            Object.entries((component as unknown as { props: Record<string, { type?: unknown; default?: unknown }> }).props)
                .filter(([, option]) => {
                    const types = [option.type].flat();
                    return (types.includes(Boolean) && !Object.hasOwn(option, 'default')) || (types.includes(Function) && option.default !== undefined);
                })
                .map(([name]) => name)
        );
        expect(offenders).toEqual([]);
    });
});
