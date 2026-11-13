import { fireEvent, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { defineSpec, type SpecHandle, type SpecMount, type SpecOptions } from './shared/define-spec';

// React hands over a synthetic event, so only `type` and `target` are common to every framework
interface SpecEvent {
    type: string;
    target: EventTarget | null;
}

/** Framework-free Input props; each fixture maps names (`value` is Vue's `modelValue`) and turns content props into its own slots or snippets */
export interface InputSpecProps {
    /** `undefined` is uncontrolled */
    value?: string | number;
    defaultValue?: string | number;
    placeholder?: string;
    disabled?: boolean;
    /** Locks typing and hides the clear button */
    readonly?: boolean;
    /** Native attribute: locks typing only, the clear button stays */
    readOnly?: boolean;
    size?: 'large' | 'default' | 'small';
    validateStatus?: 'default' | 'warning' | 'error';
    mode?: 'password';
    showClear?: boolean;
    composition?: boolean;
    prefix?: string | number;
    suffix?: string | number;
    addonBefore?: string | number;
    addonAfter?: string | number;
    insetLabel?: string | number;
    maxLength?: number;
    minLength?: number;
    getValueLength?: (value: string) => number;
    className?: string;
    id?: string;
    name?: string;
    title?: string;
    'aria-label'?: string;
    'data-testid'?: string;
    onChange?: (value: string, event: SpecEvent) => void;
    onClear?: (event: SpecEvent) => void;
    onFocus?: (event: SpecEvent) => void;
    onBlur?: (event: SpecEvent) => void;
    onEnterPress?: (event: SpecEvent) => void;
}

const prefix = `${BASE_CLASS_PREFIX}-input`;
const activationKeys = [
    ['Enter', '{Enter}'],
    ['Space', ' '],
];
const countGraphemes = (text: string) => [...new Intl.Segmenter().segment(text)].length;

export function inputSpec(mount: SpecMount<InputSpecProps>, options: SpecOptions = {}) {
    defineSpec('Input（共享 spec）', options, (test) => {
        let handle: SpecHandle<InputSpecProps>;

        async function render(props: InputSpecProps = {}) {
            handle = await mount(props);
            return handle;
        }

        const nativeInput = () => handle.container.querySelector<HTMLInputElement>('input')!;
        const wrapper = () => handle.container.querySelector(`.${prefix}-wrapper`);
        const part = (name: string) => handle.container.querySelector(`.${prefix}-${name}`);
        const clearButton = () => part('clearbtn') as HTMLElement;
        const modeButton = () => part('modebtn') as HTMLElement;
        const typeText = (text: string) => userEvent.type(nativeInput(), text);
        // Vue and Svelte re-render asynchronously after a raw DOM event
        const settle = () => handle.update({});
        const setText = async (text: string) => {
            fireEvent.input(nativeInput(), { target: { value: text } });
            await settle();
        };
        const changes = (onChange: ReturnType<typeof vi.fn>) => onChange.mock.calls.map(([value]) => value);

        test('非受控：defaultValue 是初值，输入后保留文本，onChange 收到新值与指向输入框的事件', async () => {
            const onChange = vi.fn<NonNullable<InputSpecProps['onChange']>>();
            await render({ defaultValue: 'a', onChange });
            expect(nativeInput()).toHaveValue('a');
            await typeText('bc');
            expect(nativeInput()).toHaveValue('abc');
            expect(changes(onChange)).toEqual(['ab', 'abc']);
            expect(onChange.mock.calls[1][1].target).toBe(nativeInput());
        });

        test('受控：输入只触发 onChange，输入框保持属性值，属性更新后才跟随', async () => {
            const onChange = vi.fn<NonNullable<InputSpecProps['onChange']>>();
            await render({ value: 'semi', onChange });
            expect(nativeInput()).toHaveValue('semi');
            await typeText('!');
            expect(changes(onChange)).toEqual(['semi!']);
            expect(nativeInput()).toHaveValue('semi');
            await handle.update({ value: 'vita lemon' });
            expect(nativeInput()).toHaveValue('vita lemon');
        });

        test('受控值回到 undefined（表单重置）时清空输入框，之后按非受控输入', async () => {
            await render({ value: 'semi' });
            expect(nativeInput()).toHaveValue('semi');
            await handle.update({ value: undefined });
            expect(nativeInput()).toHaveValue('');
            await typeText('a');
            expect(nativeInput()).toHaveValue('a');
        });

        test('value 为 undefined 时按非受控处理：取 defaultValue，输入即更新', async () => {
            await render({ defaultValue: 'semi', value: undefined });
            expect(nativeInput()).toHaveValue('semi');
            await typeText('!');
            expect(nativeInput()).toHaveValue('semi!');
        });

        test('placeholder、disabled、readonly 体现在原生 input 和包裹层类名上', async () => {
            await render({ placeholder: 'semi placeholder', defaultValue: 'text' });
            expect(within(handle.container).getByPlaceholderText('semi placeholder')).toBe(nativeInput());
            await handle.update({ disabled: true });
            expect(nativeInput()).toBeDisabled();
            expect(nativeInput()).toHaveClass(`${prefix}-disabled`);
            expect(wrapper()).toHaveClass(`${prefix}-wrapper-disabled`);
            await handle.update({ disabled: false, readonly: true });
            expect(nativeInput()).toHaveAttribute('readonly');
            expect(wrapper()).toHaveClass(`${prefix}-wrapper-readonly`);
        });

        test('size 与 validateStatus 设置类名，error 时 aria-invalid 为 true', async () => {
            await render({ size: 'large' });
            expect(nativeInput()).toHaveClass(`${prefix}-large`);
            await handle.update({ size: 'small', validateStatus: 'warning' });
            expect(nativeInput()).toHaveClass(`${prefix}-small`);
            expect(wrapper()).toHaveClass(`${prefix}-wrapper-warning`);
            await handle.update({ validateStatus: 'error' });
            expect(wrapper()).toHaveClass(`${prefix}-wrapper-error`);
            expect(wrapper()).not.toHaveClass(`${prefix}-wrapper-warning`);
            expect(nativeInput()).toHaveAttribute('aria-invalid', 'true');
            await handle.update({ validateStatus: 'default' });
            expect(wrapper()).not.toHaveClass(`${prefix}-wrapper-error`);
        });

        test('prefix、suffix、addon 渲染为文字槽位，值为 0 时照常渲染', async () => {
            await render({ prefix: 'pre', suffix: 'suf', addonBefore: 'https://', addonAfter: '.com' });
            expect(part('prefix')).toHaveTextContent(/^pre$/);
            expect(part('suffix')).toHaveTextContent(/^suf$/);
            expect(part('prepend')).toHaveTextContent(/^https:\/\/$/);
            expect(part('append')).toHaveTextContent(/^\.com$/);
            await handle.update({ prefix: 0, suffix: 0, addonBefore: 0, addonAfter: 0, insetLabel: 0 });
            for (const slot of ['prefix', 'suffix', 'prepend', 'append']) {
                expect(part(slot)).toHaveTextContent(/^0$/);
                expect(part(slot)).toHaveClass(`${prefix}-${slot}-text`);
            }
            expect(part('inset-label')).toHaveTextContent(/^0$/);
            expect(wrapper()).toHaveClass(`${prefix}-wrapper__with-prefix`, `${prefix}-wrapper__with-suffix`, `${prefix}-wrapper__with-append`, `${prefix}-wrapper__with-prepend`);
        });

        test('没有 prefix、suffix、addon 时不渲染对应槽位', async () => {
            await render();
            for (const slot of ['prefix', 'suffix', 'prepend', 'append', 'inset-label']) {
                expect(part(slot)).toBeNull();
            }
        });

        test('点击 prefix 与 suffix 聚焦输入框，onFocus 触发一次', async () => {
            const onFocus = vi.fn<NonNullable<InputSpecProps['onFocus']>>();
            await render({ defaultValue: 'Semi Design', prefix: 'search', suffix: 'kg', onFocus });
            await userEvent.click(part('prefix')!);
            expect(nativeInput()).toHaveFocus();
            expect(wrapper()).toHaveClass(`${prefix}-wrapper-focus`);
            expect(onFocus).toHaveBeenCalledTimes(1);
            nativeInput().blur();
            await userEvent.click(part('suffix')!);
            expect(nativeInput()).toHaveFocus();
            expect(onFocus).toHaveBeenCalledTimes(2);
        });

        test('prefix 与 suffix 上的 mousedown 阻止默认行为，输入框不会失焦', async () => {
            await render({ prefix: 'pre', suffix: 'suf' });
            for (const slot of ['prefix', 'suffix']) {
                const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
                part(slot)!.dispatchEvent(event);
                expect(event.defaultPrevented).toBe(true);
            }
        });

        test('onFocus 与 onBlur：聚焦触发一次，离开组件时 onBlur 触发并去掉焦点类', async () => {
            const onFocus = vi.fn<NonNullable<InputSpecProps['onFocus']>>();
            const onBlur = vi.fn<NonNullable<InputSpecProps['onBlur']>>();
            await render({ onFocus, onBlur });
            await userEvent.click(nativeInput());
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect(wrapper()).toHaveClass(`${prefix}-wrapper-focus`);
            expect(onBlur).not.toHaveBeenCalled();
            await userEvent.tab();
            expect(onBlur).toHaveBeenCalledTimes(1);
            expect(wrapper()).not.toHaveClass(`${prefix}-wrapper-focus`);
        });

        test('onEnterPress 在 Enter 时触发，跳过确认输入法组合的 Enter', async () => {
            const onEnterPress = vi.fn<NonNullable<InputSpecProps['onEnterPress']>>();
            await render({ onEnterPress });
            await typeText('a');
            expect(onEnterPress).not.toHaveBeenCalled();
            fireEvent.keyDown(nativeInput(), { key: 'Enter', isComposing: true });
            expect(onEnterPress).not.toHaveBeenCalled();
            await userEvent.keyboard('{Enter}');
            expect(onEnterPress).toHaveBeenCalledTimes(1);
        });

        test('showClear：有值才渲染清除按钮，禁用与 readonly 时不渲染，值为 0 时也渲染', async () => {
            await render({ value: '', showClear: true });
            expect(clearButton()).toBeNull();
            await handle.update({ value: 'semi' });
            expect(clearButton()).not.toBeNull();
            await handle.update({ value: 0 });
            expect(clearButton()).not.toBeNull();
            await handle.update({ value: 'semi', disabled: true });
            expect(clearButton()).toBeNull();
            await handle.update({ disabled: false, readonly: true });
            expect(clearButton()).toBeNull();
            await handle.update({ readonly: false, showClear: false });
            expect(clearButton()).toBeNull();
        });

        test('原生 readOnly 只锁定输入，仍可清除', async () => {
            const onClear = vi.fn<NonNullable<InputSpecProps['onClear']>>();
            await render({ defaultValue: 'semi', readOnly: true, showClear: true, onClear });
            expect(nativeInput()).toHaveAttribute('readonly');
            await userEvent.click(clearButton());
            expect(onClear).toHaveBeenCalledTimes(1);
            expect(nativeInput()).toHaveValue('');
        });

        test('点击清除按钮：onClear 触发一次，onChange 收到空串与 mousedown 事件，输入框清空且按钮消失', async () => {
            const onClear = vi.fn<NonNullable<InputSpecProps['onClear']>>();
            const onChange = vi.fn<NonNullable<InputSpecProps['onChange']>>();
            await render({ defaultValue: 'test', showClear: true, onChange, onClear });
            fireEvent.mouseDown(clearButton());
            await settle();
            expect(onClear).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith('', expect.objectContaining({ type: 'mousedown' }));
            expect(nativeInput()).toHaveValue('');
            expect(clearButton()).toBeNull();
        });

        test('受控时清除只上报空串，输入框保持属性值', async () => {
            const onChange = vi.fn<NonNullable<InputSpecProps['onChange']>>();
            const onClear = vi.fn<NonNullable<InputSpecProps['onClear']>>();
            await render({ value: 'semi', showClear: true, onChange, onClear });
            fireEvent.mouseDown(clearButton());
            await settle();
            expect(onChange).toHaveBeenCalledWith('', expect.anything());
            expect(onClear).toHaveBeenCalledTimes(1);
            expect(nativeInput()).toHaveValue('semi');
        });

        test('只有主键按下清除按钮才清空，其他鼠标键只阻止抢走焦点；mousedown 照常冒泡', async () => {
            const onClear = vi.fn<NonNullable<InputSpecProps['onClear']>>();
            const onOuterMouseDown = vi.fn<() => void>();
            document.addEventListener('mousedown', onOuterMouseDown);
            try {
                await render({ defaultValue: 'semi', showClear: true, onClear });
                expect(fireEvent.mouseDown(clearButton(), { button: 2 })).toBe(false);
                expect(fireEvent.mouseDown(clearButton(), { button: 1 })).toBe(false);
                expect(onClear).not.toHaveBeenCalled();
                expect(nativeInput()).toHaveValue('semi');
                fireEvent.mouseDown(clearButton());
                await settle();
                expect(onClear).toHaveBeenCalledTimes(1);
                expect(onOuterMouseDown).toHaveBeenCalledTimes(3);
            } finally {
                document.removeEventListener('mousedown', onOuterMouseDown);
            }
        });

        for (const [name, key] of activationKeys) {
            test(`Tab 到达清除按钮，按 ${name} 清除后焦点回到输入框`, async () => {
                const onClear = vi.fn<NonNullable<InputSpecProps['onClear']>>();
                await render({ defaultValue: 'semi', showClear: true, onClear });
                await userEvent.click(nativeInput());
                await userEvent.tab();
                expect(clearButton()).toHaveFocus();
                expect(clearButton()).toHaveAttribute('type', 'button');
                expect(within(handle.container).getByRole('button')).toBe(clearButton());
                await userEvent.keyboard(key);
                expect(onClear).toHaveBeenCalledTimes(1);
                expect(nativeInput()).toHaveValue('');
                expect(nativeInput()).toHaveFocus();
                expect(wrapper()).toHaveClass(`${prefix}-wrapper-focus`);
            });
        }

        test('清除按钮是输入框之后唯一的 Tab 停靠点', async () => {
            await render({ defaultValue: 'semi', showClear: true });
            await userEvent.click(nativeInput());
            await userEvent.tab();
            expect(clearButton()).toHaveFocus();
            await userEvent.tab();
            expect(handle.container.contains(document.activeElement)).toBe(false);
        });

        test('焦点在输入框与清除按钮之间移动不触发 onFocus 与 onBlur', async () => {
            const onFocus = vi.fn<NonNullable<InputSpecProps['onFocus']>>();
            const onBlur = vi.fn<NonNullable<InputSpecProps['onBlur']>>();
            await render({ defaultValue: 'semi', showClear: true, onFocus, onBlur });
            await userEvent.click(nativeInput());
            await userEvent.tab();
            expect(clearButton()).toHaveFocus();
            await userEvent.tab({ shift: true });
            expect(nativeInput()).toHaveFocus();
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect(onBlur).not.toHaveBeenCalled();
        });

        test('用鼠标清除时焦点保留在输入框内，不触发 onBlur', async () => {
            const onBlur = vi.fn<NonNullable<InputSpecProps['onBlur']>>();
            await render({ defaultValue: 'semi', showClear: true, onBlur });
            await userEvent.click(nativeInput());
            await userEvent.click(clearButton());
            expect(nativeInput()).toHaveValue('');
            expect(nativeInput()).toHaveFocus();
            expect(onBlur).not.toHaveBeenCalled();
            expect(wrapper()).toHaveClass(`${prefix}-wrapper-focus`);
        });

        test('mode 为 password 时输入框是 password 类型，眼睛按钮切换显隐并把焦点留在输入框', async () => {
            await render({ defaultValue: '123456' });
            expect(nativeInput()).toHaveAttribute('type', 'text');
            expect(modeButton()).toBeNull();
            await handle.update({ mode: 'password' });
            expect(nativeInput()).toHaveAttribute('type', 'password');
            expect(modeButton()).not.toBeNull();
            await userEvent.click(modeButton());
            expect(nativeInput()).toHaveAttribute('type', 'text');
            expect(nativeInput()).toHaveFocus();
            await userEvent.click(modeButton());
            expect(nativeInput()).toHaveAttribute('type', 'password');
            await handle.update({ mode: undefined });
            expect(nativeInput()).toHaveAttribute('type', 'text');
        });

        for (const [name, key] of activationKeys) {
            test(`眼睛按钮是原生 button，按 ${name} 切换显隐并把焦点交给输入框`, async () => {
                await render({ defaultValue: '123456', mode: 'password' });
                expect(modeButton().tagName).toBe('BUTTON');
                modeButton().focus();
                await userEvent.keyboard(key);
                expect(nativeInput()).toHaveAttribute('type', 'text');
                expect(nativeInput()).toHaveFocus();
            });
        }

        test('眼睛按钮按下与松开鼠标不切换显隐，点击才切换；禁用时不渲染', async () => {
            await render({ defaultValue: '1', mode: 'password' });
            fireEvent.mouseDown(modeButton());
            fireEvent.mouseUp(modeButton());
            await settle();
            expect(nativeInput()).toHaveAttribute('type', 'password');
            fireEvent.click(modeButton());
            await settle();
            expect(nativeInput()).toHaveAttribute('type', 'text');
            await handle.update({ disabled: true });
            expect(modeButton()).toBeNull();
        });

        test('传 getValueLength 与 maxLength 时按它截断 onChange，且不设原生 maxlength', async () => {
            vi.spyOn(console, 'warn').mockImplementation(() => {});
            const onChange = vi.fn<NonNullable<InputSpecProps['onChange']>>();
            await render({ maxLength: 10, getValueLength: countGraphemes, onChange });
            expect(nativeInput()).not.toHaveAttribute('maxlength');
            await setText('0123456789semi design');
            expect(changes(onChange)).toEqual(['0123456789']);
            expect(nativeInput()).toHaveValue('0123456789');
        });

        test('受控值超出 maxLength 时原样显示', async () => {
            await render({ maxLength: 10, value: '0123456789semi design', getValueLength: countGraphemes });
            expect(nativeInput()).toHaveValue('0123456789semi design');
        });

        test('未传 getValueLength 时 maxLength 是原生属性，onChange 不截断', async () => {
            const onChange = vi.fn<NonNullable<InputSpecProps['onChange']>>();
            await render({ maxLength: 3, onChange });
            expect(nativeInput()).toHaveAttribute('maxlength', '3');
            await setText('abcdef');
            expect(changes(onChange)).toEqual(['abcdef']);
        });

        test('minLength 是原生属性，更新后随之变化', async () => {
            await render({ minLength: 5 });
            expect(nativeInput()).toHaveAttribute('minlength', '5');
            await handle.update({ minLength: 2 });
            expect(nativeInput()).toHaveAttribute('minlength', '2');
        });

        test('传 getValueLength 时原生 minlength 按当前值换算，不等下一次输入', async () => {
            const value = '💖💖';
            await render({ minLength: 4, value, getValueLength: countGraphemes });
            expect(nativeInput()).toHaveAttribute('minlength', String(value.length + 2));
            await handle.update({ minLength: 3 });
            expect(nativeInput()).toHaveAttribute('minlength', String(value.length + 1));
            await handle.update({ minLength: 1 });
            expect(nativeInput()).toHaveAttribute('minlength', '1');
        });

        test('getValueLength 的截断等待输入法组合结束', async () => {
            vi.spyOn(console, 'warn').mockImplementation(() => {});
            const onChange = vi.fn<NonNullable<InputSpecProps['onChange']>>();
            await render({ maxLength: 2, getValueLength: countGraphemes, onChange });
            fireEvent.compositionStart(nativeInput());
            await setText('abc');
            expect(onChange.mock.calls.at(-1)![0]).toBe('abc');
            fireEvent.compositionEnd(nativeInput(), { target: { value: 'abc' } });
            await settle();
            expect(onChange.mock.calls.at(-1)![0]).toBe('ab');
            expect(nativeInput()).toHaveValue('ab');
        });

        test('composition 模式在输入法组合结束后才上报一次，组合中显示组合文本', async () => {
            const onChange = vi.fn<NonNullable<InputSpecProps['onChange']>>();
            await render({ composition: true, onChange });
            fireEvent.compositionStart(nativeInput());
            await setText('ni');
            expect(onChange).not.toHaveBeenCalled();
            expect(nativeInput()).toHaveValue('ni');
            fireEvent.compositionEnd(nativeInput(), { target: { value: '你' } });
            await settle();
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange.mock.calls[0][0]).toBe('你');
        });

        test('未声明属性与 aria 属性落在原生 input 上，className 留在包裹层', async () => {
            await render({ id: 'name-id', name: 'name', className: 'custom', title: 'tip', 'aria-label': 'Name', 'data-testid': 'name' });
            expect(within(handle.container).getByTestId('name')).toBe(nativeInput());
            expect(nativeInput()).toHaveAttribute('id', 'name-id');
            expect(nativeInput()).toHaveAttribute('name', 'name');
            expect(nativeInput()).toHaveAttribute('title', 'tip');
            expect(nativeInput()).toHaveAttribute('aria-label', 'Name');
            for (const attr of ['id', 'name', 'title', 'aria-label', 'data-testid']) {
                expect(wrapper()).not.toHaveAttribute(attr);
            }
            expect(wrapper()).toHaveClass('custom');
            expect(nativeInput()).not.toHaveClass('custom');
        });
    });
}
