import { For, createSignal, onMount } from 'solid-js';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconSearch } from '@fibrae/semi-icons-solid';
import Input, { type InputChangeEvent, type InputGroupProps, type InputMode, type InputProps, InputGroup } from '..';
import semiGlobal from '../../_utils/semi-global';
import Tooltip from '../../tooltip';

type Change = NonNullable<InputProps['onChange']>;
type FocusHandler = NonNullable<InputProps['onFocus']>;

const prefixCls = `${BASE_CLASS_PREFIX}-input`;

const getValueLength = (str: string) => [...new Intl.Segmenter().segment(str)].length;

const getInput = () => document.querySelector('input') as HTMLInputElement;
const getWrapper = () => document.querySelector(`.${prefixCls}-wrapper`) as HTMLElement;
const query = (cls: string) => document.querySelector<HTMLElement>(`.${cls}`);
const getClearBtn = () => query(`${prefixCls}-clearbtn`);
const getModeBtn = () => query(`${prefixCls}-modebtn`) as HTMLElement;
const type = (value: string, init: InputEventInit = {}) => fireEvent.input(getInput(), { target: { value }, ...init });

function spyWarn() {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    onTestFinished(() => warn.mockRestore());
    return warn;
}

describe('Input', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('值变化时调用 onChange', () => {
        const onChange = vi.fn<Change>();
        render(() => <Input onChange={onChange} />);
        type('semi');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('semi');
        expect(getInput()).toHaveValue('semi');
    });

    it('class 与 style 落在包裹层', () => {
        render(() => <Input class="test" style={{ color: 'red' }} />);
        expect(getWrapper()).toHaveClass('test');
        expect(getWrapper()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('不同尺寸', () => {
        render(() => (
            <>
                <Input size="large" />
                <Input />
                <Input size="small" />
            </>
        ));
        const [large, def, small] = document.querySelectorAll('input');
        expect(large).toHaveClass(`${prefixCls}-large`);
        expect(def).toHaveClass(`${prefixCls}-default`);
        expect(small).toHaveClass(`${prefixCls}-small`);
    });

    it('带 placeholder，数字按文字输出', () => {
        render(() => (
            <>
                <Input placeholder="semi placeholder" />
                <Input placeholder={1} />
            </>
        ));
        expect(screen.getByPlaceholderText('semi placeholder')).toBe(getInput());
        expect(screen.getByPlaceholderText('1')).toBeInTheDocument();
    });

    it('带 defaultValue', () => {
        render(() => <Input defaultValue="semi" />);
        expect(getInput()).toHaveValue('semi');
    });

    it('disabled 时禁用', () => {
        render(() => <Input disabled />);
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-disabled`);
        expect(getInput()).toHaveClass(`${prefixCls}-disabled`);
        expect(getInput()).toBeDisabled();
    });

    it('不同的 validateStatus', () => {
        render(() => (
            <>
                <Input validateStatus="warning" />
                <Input validateStatus="error" />
                <Input />
            </>
        ));
        const [warning, error, normal] = document.querySelectorAll(`.${prefixCls}-wrapper`);
        expect(warning).toHaveClass(`${prefixCls}-wrapper-warning`);
        expect(error).toHaveClass(`${prefixCls}-wrapper-error`);
        expect(error.querySelector('input')).toHaveAttribute('aria-invalid', 'true');
        expect(normal).not.toHaveClass(`${prefixCls}-wrapper-error`);
        expect(normal).not.toHaveClass(`${prefixCls}-wrapper-warning`);
    });

    it('带 prefix / suffix', () => {
        render(() => (
            <>
                <Input suffix={<div class="suffix">suffix</div>} />
                <Input prefix={<div class="prefix">prefix</div>} />
            </>
        ));
        expect(query(`${prefixCls}-suffix`)).toContainElement(query('suffix'));
        expect(query(`${prefixCls}-prefix`)).toContainElement(query('prefix'));
    });

    it('插槽传入多个节点时照常渲染', () => {
        render(() => (
            <Input
                addonBefore={<>a</>}
                suffix={
                    <>
                        <IconSearch />
                        <span>b</span>
                    </>
                }
            />
        ));
        expect(query(`${prefixCls}-suffix`)).toHaveTextContent('b');
        expect(query(`${prefixCls}-suffix`)).not.toHaveClass(`${prefixCls}-suffix-icon`);
        expect(query(`${prefixCls}-prepend`)).toHaveTextContent(/^a$/);
    });

    it('插槽值为 0 时照常渲染，数字按文字处理', () => {
        render(() => <Input addonAfter={0} addonBefore={0} prefix={0} suffix={0} />);
        for (const slot of ['prefix', 'suffix', 'prepend', 'append']) {
            expect(query(`${prefixCls}-${slot}`)).toHaveTextContent(/^0$/);
            expect(query(`${prefixCls}-${slot}`)).toHaveClass(`${prefixCls}-${slot}-text`);
        }
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper__with-prefix`, `${prefixCls}-wrapper__with-suffix`, `${prefixCls}-wrapper__with-append`, `${prefixCls}-wrapper__with-prepend`);
    });

    it('insetLabel 为 0 时照常渲染', () => {
        render(() => <Input insetLabel={0} />);
        expect(query(`${prefixCls}-inset-label`)).toHaveTextContent(/^0$/);
    });

    it('addonBefore / addonAfter', () => {
        render(() => <Input addonAfter=".com" addonBefore="https://" />);
        expect(query(`${prefixCls}-prepend`)).toHaveTextContent(/^https:\/\/$/);
        expect(query(`${prefixCls}-append`)).toHaveTextContent(/^\.com$/);
    });

    it('type 为 password', () => {
        render(() => <Input type="password" />);
        expect(getInput()).toHaveAttribute('type', 'password');
    });

    it('mode 随 signal 切换 password', () => {
        const [mode, setMode] = createSignal<InputMode | undefined>();
        render(() => <Input defaultValue="test" mode={mode()} />);
        expect(getInput()).toHaveAttribute('type', 'text');
        setMode('password');
        expect(getInput()).toHaveAttribute('type', 'password');
        expect(getModeBtn()).toHaveAttribute('aria-label', zh_CN.Input.showPassword);
        setMode(undefined);
        expect(getInput()).toHaveAttribute('type', 'text');
        expect(query(`${prefixCls}-modebtn`)).toBeNull();
    });

    it('父组件挂载时就把 mode 改为 password，输入框隐藏明文', () => {
        function Demo() {
            const [mode, setMode] = createSignal<InputMode>();
            onMount(() => setMode('password'));
            return <Input defaultValue="test" mode={mode()} />;
        }
        render(() => <Demo />);
        expect(getInput()).toHaveAttribute('type', 'password');
    });

    it('password 点击眼睛图标', async () => {
        render(() => <Input defaultValue="123456" autofocus mode="password" />);
        expect(getInput()).toHaveAttribute('type', 'password');
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Input.showPassword }));
        expect(getInput()).toHaveAttribute('type', 'text');
        expect(screen.getByRole('button', { name: zh_CN.Input.hidePassword })).toBe(getModeBtn());
        expect(getInput()).toHaveFocus();
    });

    it('受控模式：父组件不更新时仍显示属性值', () => {
        const onChange = vi.fn<Change>();
        const [value, setValue] = createSignal('semi');
        render(() => <Input value={value()} onChange={onChange} />);
        expect(getInput()).toHaveValue('semi');
        type('vita lemon');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('vita lemon');
        expect(getInput()).toHaveValue('semi');
        setValue('vita lemon');
        expect(getInput()).toHaveValue('vita lemon');
    });

    it('点击 prefix/suffix 聚焦', async () => {
        const onFocus = vi.fn<FocusHandler>();
        const { unmount } = render(() => <Input defaultValue="Semi Design" prefix="search" onFocus={onFocus} />);
        await userEvent.click(query(`${prefixCls}-prefix`) as HTMLElement);
        expect(getInput()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-focus`);
        expect(onFocus).toHaveBeenCalledTimes(1);
        unmount();

        render(() => <Input defaultValue="Semi Design" suffix="search" onFocus={onFocus} />);
        await userEvent.click(query(`${prefixCls}-suffix`) as HTMLElement);
        expect(getInput()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-focus`);
        expect(onFocus).toHaveBeenCalledTimes(2);
    });

    it('getValueLength 按字素计数', () => {
        const cases: [string, number][] = [
            ['💖', 1],
            ['字节跳动', 4],
            ['Semi 💖', 6],
            ['💖💖💖💖💖', 5],
            ['🤣', 1],
            ['1️⃣', 1],
            ['👨‍👨‍👦', 1],
        ];
        for (const [value, result] of cases) {
            expect(getValueLength(value)).toBe(result);
        }
    });

    it('getValueLength 与 onChange', () => {
        const onChange = vi.fn<Change>();
        const warn = spyWarn();
        render(() => <Input maxLength={10} getValueLength={getValueLength} onChange={onChange} />);
        type('0123456789semi design');
        expect(warn).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('0123456789');
        expect(getInput()).toHaveValue('0123456789');
    });

    it('受控值超长时原样显示，传 getValueLength 时不设原生 maxlength', () => {
        const value = '0123456789semi design';
        render(() => <Input maxLength={10} value={value} getValueLength={getValueLength} />);
        expect(getInput()).toHaveValue(value);
        expect(getInput()).not.toHaveAttribute('maxlength');
    });

    it('minLength + getValueLength', () => {
        const inputValue = '💖💖💖';
        const onChange = vi.fn<Change>();
        render(() => <Input minLength={4} getValueLength={getValueLength} onChange={onChange} />);
        type(inputValue);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe(inputValue);
        expect(getInput()).toHaveAttribute('minlength', String(inputValue.length + (4 - getValueLength(inputValue))));
    });

    it('同时设置 maxLength 与 minLength 时，输入后仍调整原生 minlength', () => {
        const inputValue = '💖💖💖';
        render(() => <Input maxLength={10} minLength={4} getValueLength={getValueLength} />);
        type(inputValue);
        expect(getInput()).toHaveAttribute('minlength', String(inputValue.length + (4 - getValueLength(inputValue))));
    });

    it('minLength 属性变化后，原生 minlength 随之变化', () => {
        const [minLength, setMinLength] = createSignal(5);
        render(() => <Input minLength={minLength()} />);
        expect(getInput()).toHaveAttribute('minlength', '5');
        setMinLength(2);
        expect(getInput()).toHaveAttribute('minlength', '2');
    });

    it('传 getValueLength 时，原生 minlength 按当前值换算，不等下一次输入', () => {
        const value = '💖💖';
        const [minLength, setMinLength] = createSignal(4);
        render(() => <Input minLength={minLength()} value={value} getValueLength={getValueLength} />);
        expect(getInput()).toHaveAttribute('minlength', String(value.length + 2));
        setMinLength(3);
        expect(getInput()).toHaveAttribute('minlength', String(value.length + 1));
        setMinLength(1);
        expect(getInput()).toHaveAttribute('minlength', '1');
    });

    it('值为数字 0 时也显示清除按钮', () => {
        render(() => <Input value={0} showClear />);
        expect(getClearBtn()).not.toBeNull();
    });

    it('onCompositionStart、onCompositionEnd、onCompositionUpdate 回调', () => {
        const onCompositionStart = vi.fn<(e: CompositionEvent) => void>();
        const onCompositionEnd = vi.fn<(e: CompositionEvent) => void>();
        const onCompositionUpdate = vi.fn<(e: CompositionEvent) => void>();
        render(() => <Input onCompositionEnd={onCompositionEnd} onCompositionStart={onCompositionStart} onCompositionUpdate={onCompositionUpdate} />);
        fireEvent.compositionStart(getInput(), { data: 'test' });
        fireEvent.compositionUpdate(getInput(), { data: 'test' });
        fireEvent.compositionEnd(getInput(), { data: 'test' });
        expect(onCompositionStart).toHaveBeenCalledTimes(1);
        expect(onCompositionUpdate).toHaveBeenCalledTimes(1);
        expect(onCompositionEnd).toHaveBeenCalledTimes(1);
    });

    it('只有主键按下清除按钮才清空，其他鼠标键只阻止抢走焦点', () => {
        const onClear = vi.fn<NonNullable<InputProps['onClear']>>();
        render(() => <Input defaultValue="semi" showClear onClear={onClear} />);
        expect(fireEvent.mouseDown(getClearBtn() as HTMLElement, { button: 2 })).toBe(false);
        expect(fireEvent.mouseDown(getClearBtn() as HTMLElement, { button: 1 })).toBe(false);
        expect(onClear).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue('semi');
        fireEvent.mouseDown(getClearBtn() as HTMLElement);
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('清除按钮的 mousedown 照常冒泡，页面上其他弹层的点击外部能收到', () => {
        const onMouseDown = vi.fn<(event: MouseEvent) => void>();
        document.addEventListener('mousedown', onMouseDown);
        onTestFinished(() => document.removeEventListener('mousedown', onMouseDown));
        render(() => <Input defaultValue="semi" showClear />);
        fireEvent.mouseDown(getClearBtn() as HTMLElement);
        expect(onMouseDown).toHaveBeenCalledTimes(1);
    });

    it('位于点击触发的 Tooltip 内时，按下清除按钮不关闭自己的弹层', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        render(() => (
            <Tooltip content="tip" motion={false} trigger="click" onVisibleChange={onVisibleChange}>
                <span>
                    <Input defaultValue="semi" showClear />
                </span>
            </Tooltip>
        ));
        await userEvent.click(getInput());
        expect(await screen.findByText('tip')).toBeInTheDocument();
        onVisibleChange.mockClear();
        fireEvent.mouseDown(getClearBtn() as HTMLElement);
        expect(getClearBtn()).toBeNull();
        expect(onVisibleChange).not.toHaveBeenCalled();
    });

    it('showClear 与 onClear 回调', () => {
        const onClear = vi.fn<NonNullable<InputProps['onClear']>>();
        const onChange = vi.fn<Change>();
        render(() => <Input defaultValue="test" showClear onChange={onChange} onClear={onClear} />);
        fireEvent.mouseDown(getClearBtn() as HTMLElement);
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('');
        expect(getInput()).toHaveValue('');
        expect(getClearBtn()).toBeNull();
    });

    it('readonly 属性', () => {
        render(() => <Input defaultValue="readonly text" readonly />);
        expect(getInput()).toHaveAttribute('readonly');
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-readonly`);
    });

    it('onFocus 回调', async () => {
        const onFocus = vi.fn<FocusHandler>();
        render(() => <Input onFocus={onFocus} />);
        await userEvent.click(getInput());
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('onBlur 回调', async () => {
        const onBlur = vi.fn<NonNullable<InputProps['onBlur']>>();
        render(() => <Input onBlur={onBlur} />);
        await userEvent.click(getInput());
        expect(onBlur).not.toHaveBeenCalled();
        await userEvent.tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-wrapper-focus`);
    });

    it('onEnterPress 回调', async () => {
        const onEnterPress = vi.fn<NonNullable<InputProps['onEnterPress']>>();
        render(() => <Input onEnterPress={onEnterPress} />);
        await userEvent.type(getInput(), 'a');
        expect(onEnterPress).not.toHaveBeenCalled();
        await userEvent.keyboard('{Enter}');
        expect(onEnterPress).toHaveBeenCalledTimes(1);
    });

    it('onEnterPress 跳过确认输入法组合的 Enter', () => {
        const onEnterPress = vi.fn<NonNullable<InputProps['onEnterPress']>>();
        render(() => <Input onEnterPress={onEnterPress} />);
        fireEvent.keyDown(getInput(), { key: 'Enter', isComposing: true });
        expect(onEnterPress).not.toHaveBeenCalled();
        fireEvent.keyDown(getInput(), { key: 'Enter' });
        expect(onEnterPress).toHaveBeenCalledTimes(1);
    });

    it('borderless 属性', () => {
        render(() => <Input borderless />);
        expect(getWrapper()).toHaveClass(`${prefixCls}-borderless`);
    });

    it('onKeyDown、onKeyUp、onInput 回调，onInput 收到原生 input 事件', () => {
        const onKeyDown = vi.fn<(e: KeyboardEvent) => void>();
        const onKeyUp = vi.fn<(e: KeyboardEvent) => void>();
        const onInput = vi.fn<(e: InputEvent) => void>();
        render(() => <Input onInput={onInput} onKeyDown={onKeyDown} onKeyUp={onKeyUp} />);
        fireEvent.keyDown(getInput(), { key: 'a' });
        fireEvent.keyUp(getInput(), { key: 'a' });
        type('test');
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(onKeyUp).toHaveBeenCalledTimes(1);
        expect(onInput).toHaveBeenCalledTimes(1);
        expect(onInput.mock.calls[0][0].target).toBe(getInput());
    });

    it('[handler, data] 形式的事件处理函数照常调用', () => {
        const onKeyDown = vi.fn<(data: string, e: KeyboardEvent) => void>();
        render(() => <Input onKeyDown={[onKeyDown, 'data']} />);
        fireEvent.keyDown(getInput(), { key: 'a' });
        expect(onKeyDown).toHaveBeenCalledWith('data', expect.objectContaining({ key: 'a' }));
    });

    it('insetLabel 属性', () => {
        render(() => <Input insetLabel="Label" />);
        expect(query(`${prefixCls}-inset-label`)).toHaveTextContent(/^Label$/);
    });

    it('自定义 clearIcon 图标', () => {
        render(() => <Input defaultValue="test" clearIcon={<span class="custom-clear-icon">X</span>} showClear />);
        expect(getClearBtn()).toContainElement(query('custom-clear-icon'));
    });

    it('hideSuffix 时后缀在清除按钮渲染期间带 suffix-hidden 类，由样式在悬停与焦点在内部时隐藏', () => {
        const [value, setValue] = createSignal('');
        render(() => <Input value={value()} hideSuffix showClear suffix="suffix" />);
        expect(query(`${prefixCls}-suffix`)).not.toHaveClass(`${prefixCls}-suffix-hidden`);
        setValue('test');
        expect(query(`${prefixCls}-suffix`)).toHaveClass(`${prefixCls}-suffix-hidden`);
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper__with-suffix-hidden`);
    });

    it('未声明的事件处理函数落到原生 input', () => {
        const onKeyPress = vi.fn<(e: KeyboardEvent) => void>();
        render(() => <Input onKeyPress={onKeyPress} />);
        fireEvent.keyPress(getInput(), { key: 'a', code: 'KeyA', charCode: 97 });
        expect(onKeyPress).toHaveBeenCalledTimes(1);
    });

    it('onlyBorder 属性，对象与字符串 style 都保留', () => {
        const stringStyled: InputProps = { style: 'color: blue', onlyBorder: 2 };
        render(() => (
            <>
                <Input style={{ color: 'red' }} onlyBorder={1} />
                <Input {...stringStyled} />
            </>
        ));
        const [objectStyle, stringStyle] = document.querySelectorAll<HTMLElement>(`.${prefixCls}-wrapper`);
        expect(objectStyle).toHaveClass(`${prefixCls}-only_border`);
        // jsdom's computed style does not resolve the border-width shorthand, so read the inline style
        expect(objectStyle.style.borderWidth).toBe('1px');
        expect(objectStyle).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(stringStyle.style.borderWidth).toBe('2px');
        expect(stringStyle).toHaveStyle({ color: 'rgb(0, 0, 255)' });
    });

    it('清除按钮随值渲染，输入框随之带 sibling-clearbtn 类', () => {
        const [value, setValue] = createSignal('test');
        render(() => <Input value={value()} showClear />);
        expect(getClearBtn()).not.toBeNull();
        expect(getInput()).toHaveClass(`${prefixCls}-sibling-clearbtn`);
        setValue('');
        expect(getClearBtn()).toBeNull();
        expect(getInput()).not.toHaveClass(`${prefixCls}-sibling-clearbtn`);
    });

    it('密码按钮是原生 button，Space 切换显隐并把焦点交给输入框', async () => {
        render(() => <Input defaultValue="test" mode="password" />);
        expect(getModeBtn().tagName).toBe('BUTTON');
        expect(getModeBtn()).toHaveAttribute('type', 'button');
        expect(getModeBtn()).not.toHaveAttribute('role');
        expect(getModeBtn()).not.toHaveAttribute('tabindex');
        getModeBtn().focus();
        await userEvent.keyboard(' ');
        expect(getInput()).toHaveAttribute('type', 'text');
        expect(getInput()).toHaveFocus();
        getModeBtn().focus();
        await userEvent.keyboard(' ');
        expect(getInput()).toHaveAttribute('type', 'password');
    });

    it('密码按钮的 mousedown 阻止默认行为，按下与松开不切换，点击才切换', () => {
        render(() => <Input defaultValue="test" mode="password" />);
        expect(fireEvent.mouseDown(getModeBtn())).toBe(false);
        fireEvent.mouseUp(getModeBtn());
        expect(getInput()).toHaveAttribute('type', 'password');
        fireEvent.click(getModeBtn());
        expect(getInput()).toHaveAttribute('type', 'text');
    });

    it('点击包裹层聚焦输入框并加焦点类', async () => {
        render(() => <Input defaultValue="test" />);
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-wrapper-focus`);
        await userEvent.click(getWrapper());
        expect(getInput()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-focus`);
    });

    it('未开启 showClear 时有值也不渲染清除按钮', () => {
        render(() => <Input defaultValue="test" />);
        expect(getClearBtn()).toBeNull();
        expect(getInput()).not.toHaveClass(`${prefixCls}-sibling-clearbtn`);
    });

    it('密码按钮按 Enter 切换显隐，Enter 与 Space 不冒泡到宿主的 keydown 处理器', async () => {
        const onHostKeyDown = vi.fn<() => void>();
        render(() => (
            <div role="presentation" onKeyDown={onHostKeyDown}>
                <Input defaultValue="test" mode="password" />
            </div>
        ));
        getModeBtn().focus();
        await userEvent.keyboard('{Enter}');
        expect(getInput()).toHaveAttribute('type', 'text');
        expect(getInput()).toHaveFocus();
        getModeBtn().focus();
        await userEvent.keyboard(' ');
        expect(getInput()).toHaveAttribute('type', 'password');
        expect(onHostKeyDown).not.toHaveBeenCalled();
    });

    it('prefix、suffix 的 mousedown 阻止默认行为', () => {
        render(() => <Input defaultValue="test" prefix="prefix" suffix="suffix" />);
        expect(fireEvent.mouseDown(query(`${prefixCls}-prefix`) as HTMLElement)).toBe(false);
        expect(fireEvent.mouseDown(query(`${prefixCls}-suffix`) as HTMLElement)).toBe(false);
    });
});

describe('Input 行为基线', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('非受控输入框保留用户输入，并上报 input 事件', async () => {
        const onChange = vi.fn<Change>();
        render(() => <Input defaultValue="a" onChange={onChange} />);
        await userEvent.type(getInput(), 'bc');
        expect(getInput()).toHaveValue('abc');
        expect(onChange.mock.calls.map(([value]) => value)).toEqual(['ab', 'abc']);
        expect((onChange.mock.calls[1][1] as InputEvent).target).toBe(getInput());
    });

    it('受控输入框跟随父组件回写的值', async () => {
        const [value, setValue] = createSignal('');
        render(() => <Input value={value()} onChange={(v) => setValue(v.toUpperCase())} />);
        await userEvent.type(getInput(), 'ab');
        expect(getInput()).toHaveValue('AB');
    });

    it('受控值回到 undefined（表单重置）时清空输入框', () => {
        const [value, setValue] = createSignal<string | undefined>('semi');
        render(() => <Input value={value()} />);
        expect(getInput()).toHaveValue('semi');
        setValue(undefined);
        expect(getInput()).toHaveValue('');
    });

    it('value={undefined} 按非受控处理：取 defaultValue，输入即更新', async () => {
        render(() => <Input defaultValue="semi" value={undefined} />);
        expect(getInput()).toHaveValue('semi');
        await userEvent.type(getInput(), '!');
        expect(getInput()).toHaveValue('semi!');
    });

    it('Form 注入的 validateStatus、insetLabel 不落到 DOM', () => {
        render(() => <Input id="name" insetLabel="Name" insetLabelId="label" validateStatus="error" />);
        expect(getInput()).toHaveAttribute('id', 'name');
        expect(getInput()).toHaveAttribute('aria-labelledby', 'label');
        for (const element of [getWrapper(), getInput()]) {
            expect(element).not.toHaveAttribute('validatestatus');
            expect(element).not.toHaveAttribute('insetlabel');
            expect(element).not.toHaveAttribute('insetlabelid');
        }
        expect(getWrapper()).not.toHaveAttribute('id');
    });

    it('清空受控输入框时上报空值，但在属性变化前仍显示该属性值', () => {
        const onChange = vi.fn<Change>();
        const onClear = vi.fn<NonNullable<InputProps['onClear']>>();
        render(() => <Input value="semi" showClear onChange={onChange} onClear={onClear} />);
        fireEvent.mouseDown(getClearBtn() as HTMLElement);
        expect(onChange).toHaveBeenCalledWith('', expect.anything());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('semi');
    });

    it('清除按钮触发 onChange 时第二个参数是鼠标事件，类型包含它', () => {
        const onChange = vi.fn<Change>();
        render(() => <Input defaultValue="semi" showClear onChange={onChange} />);
        fireEvent.mouseDown(getClearBtn() as HTMLElement);
        expect(onChange).toHaveBeenCalledWith('', expect.objectContaining({ type: 'mousedown' }));
        expectTypeOf<MouseEvent>().toExtend<InputChangeEvent>();
        expectTypeOf<CompositionEvent & { currentTarget: HTMLInputElement; target: Element }>().toExtend<InputChangeEvent>();
        expectTypeOf<InputEvent & { currentTarget: HTMLInputElement; target: Element }>().toExtend<InputChangeEvent>();
    });

    it('清除按钮有值才渲染，禁用时不渲染，showClearIgnoreDisabled 时仍渲染', () => {
        const [props, setProps] = createSignal<InputProps>({ value: '' });
        render(() => <Input showClear {...props()} />);
        expect(getClearBtn()).toBeNull();
        setProps({ disabled: true, value: 'semi' });
        expect(getClearBtn()).toBeNull();
        setProps({ disabled: true, value: 'semi', showClearIgnoreDisabled: true });
        expect(getClearBtn()).not.toBeNull();
        setProps({ value: 'semi' });
        expect(getClearBtn()).not.toBeNull();
    });

    it('只读时不渲染清除按钮，showClearIgnoreDisabled 也不例外', () => {
        render(() => (
            <>
                <Input defaultValue="semi" readonly showClear />
                <Input defaultValue="semi" disabled readonly showClear showClearIgnoreDisabled />
            </>
        ));
        expect(getClearBtn()).toBeNull();
    });

    it('原生 readOnly 只锁定输入，仍可清除', async () => {
        const onClear = vi.fn<NonNullable<InputProps['onClear']>>();
        render(() => <Input defaultValue="semi" readOnly showClear onClear={onClear} />);
        expect(getInput()).toHaveAttribute('readonly');
        await userEvent.click(getClearBtn() as HTMLElement);
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('');
    });

    it.each(['{Enter}', ' '])('Tab 可以到达有名称的清除按钮，%s 清除后焦点回到输入框', async (key) => {
        const onClear = vi.fn<NonNullable<InputProps['onClear']>>();
        render(() => <Input defaultValue="semi" showClear onClear={onClear} />);
        await userEvent.click(getInput());
        await userEvent.tab();
        const clear = screen.getByRole('button', { name: zh_CN.Input.clear });
        expect(clear).toHaveFocus();
        expect(clear).toHaveAttribute('type', 'button');
        await userEvent.keyboard(key);
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('');
        expect(getInput()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-focus`);
    });

    it('用鼠标清除时焦点保留在输入框内', async () => {
        const onBlur = vi.fn<NonNullable<InputProps['onBlur']>>();
        render(() => <Input defaultValue="semi" showClear onBlur={onBlur} />);
        await userEvent.click(getInput());
        await userEvent.click(getClearBtn() as HTMLElement);
        expect(getInput()).toHaveValue('');
        expect(getInput()).toHaveFocus();
        expect(onBlur).not.toHaveBeenCalled();
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-focus`);
    });

    it('清除按钮有焦点时，受控值在别处被清空，焦点交给输入框', async () => {
        const [value, setValue] = createSignal('semi');
        render(() => <Input value={value()} showClear />);
        (getClearBtn() as HTMLElement).focus();
        setValue('');
        await waitFor(() => expect(getInput()).toHaveFocus());
    });

    it('清除按钮为 DateInput 标记 change 事件，mousedown 照常冒泡以便外部点击检测关闭浮层', () => {
        const onChange = vi.fn<Change>();
        const onOuterMouseDown = vi.fn<() => void>();
        document.body.addEventListener('mousedown', onOuterMouseDown);
        onTestFinished(() => document.body.removeEventListener('mousedown', onOuterMouseDown));
        render(() => <Input defaultValue="semi" showClear onChange={onChange} />);
        fireEvent.mouseDown(getClearBtn() as HTMLElement);
        // The marker is an internal flag for DateInput and is absent from the public event type
        const event = onChange.mock.calls[0][1] as unknown as { __fromClearBtn?: boolean };
        expect(event.__fromClearBtn).toBe(true);
        expect(onOuterMouseDown).toHaveBeenCalledTimes(1);
    });

    it('password 模式禁用时隐藏眼睛按钮，并为辅助技术提供标签', () => {
        const [disabled, setDisabled] = createSignal(true);
        render(() => <Input defaultValue="1" disabled={disabled()} mode="password" />);
        expect(query(`${prefixCls}-modebtn`)).toBeNull();
        expect(getInput()).toHaveAttribute('type', 'password');
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-modebtn`);
        setDisabled(false);
        expect(screen.getByRole('button', { name: zh_CN.Input.showPassword })).toBe(getModeBtn());
        expect(getInput()).toHaveClass(`${prefixCls}-sibling-modebtn`);
    });

    it('未设置 getValueLength 时 maxLength 为原生属性，onChange 不截断', () => {
        const onChange = vi.fn<Change>();
        render(() => <Input maxLength={3} onChange={onChange} />);
        expect(getInput()).toHaveAttribute('maxlength', '3');
        type('abcd');
        expect(onChange.mock.calls[0][0]).toBe('abcd');
    });

    it('getValueLength 截断等待输入法组合结束', () => {
        const onChange = vi.fn<Change>();
        spyWarn();
        render(() => <Input maxLength={2} getValueLength={getValueLength} onChange={onChange} />);
        fireEvent.compositionStart(getInput());
        type('abc', { isComposing: true });
        expect(onChange.mock.calls.at(-1)?.[0]).toBe('abc');
        fireEvent.compositionEnd(getInput(), { target: { value: 'abc' } });
        expect(onChange.mock.calls.at(-1)?.[0]).toBe('ab');
        expect(getInput()).toHaveValue('ab');
    });

    it('composition 受控且父组件拒绝组合结果时，组合结束后恢复为属性值', () => {
        render(() => <Input value="" composition onChange={() => {}} />);
        fireEvent.compositionStart(getInput());
        type('ni', { isComposing: true });
        fireEvent.compositionEnd(getInput(), { target: { value: '你' } });
        expect(getInput()).toHaveValue('');
    });

    it('受控 Input 在输入法组合结束后才收到输入事件时（Firefox 的顺序），保留组合结果', () => {
        const [value, setValue] = createSignal('');
        const onChange = vi.fn<Change>((next) => setValue(next));
        render(() => <Input value={value()} onChange={onChange} />);
        fireEvent.compositionStart(getInput());
        type('hao', { isComposing: true });
        fireEvent.compositionEnd(getInput(), { target: { value: '好' } });
        fireEvent.input(getInput());
        expect(getInput()).toHaveValue('好');
        expect(onChange.mock.calls.at(-1)?.[0]).toBe('好');
    });

    it('composition 模式在输入法组合结束后上报一次，并显示组合中的文本', () => {
        const onChange = vi.fn<Change>();
        render(() => <Input value="" composition onChange={onChange} />);
        fireEvent.compositionStart(getInput());
        type('ni', { isComposing: true });
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue('ni');
        fireEvent.compositionEnd(getInput(), { target: { value: '你' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('你');
    });

    it('包在其他元素里的图标不算图标槽位', () => {
        function Wrapped() {
            return (
                <b>
                    <IconSearch />
                </b>
            );
        }
        render(() => <Input prefix={<Wrapped />} />);
        expect(query(`${prefixCls}-prefix`)).not.toHaveClass(`${prefixCls}-prefix-icon`);
    });

    it('prefix、suffix 与 addons 获得文本与图标类名以及 x-semi-prop 插槽', () => {
        render(() => <Input defaultValue="1" addonAfter="after" addonBefore={<IconSearch />} prefix={<IconSearch />} suffix="kg" />);
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

    it('insetLabel 带 id 渲染，并标记包裹层', () => {
        render(() => <Input insetLabel="Name" insetLabelId="label-id" />);
        expect(query(`${prefixCls}-inset-label`)).toHaveAttribute('id', 'label-id');
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper__with-prefix`);
    });

    it('只传 insetLabel 时以它命名输入框，显式名称优先，有 prefix 时不命名', () => {
        const [props, setProps] = createSignal<InputProps>({});
        render(() => <Input insetLabel="Name" {...props()} />);
        const labelId = (query(`${prefixCls}-inset-label`) as HTMLElement).id;
        expect(labelId).not.toBe('');
        expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute('aria-labelledby', labelId);
        setProps({ insetLabelId: 'label-id' });
        expect(getInput()).toHaveAttribute('aria-labelledby', 'label-id');
        setProps({ 'aria-label': 'Own' });
        expect(getInput()).not.toHaveAttribute('aria-labelledby');
        setProps({ 'aria-labelledby': 'other' });
        expect(getInput()).toHaveAttribute('aria-labelledby', 'other');
        setProps({ prefix: 'P' });
        expect(getInput()).not.toHaveAttribute('aria-labelledby');
    });

    it('非受控时无关属性变化不清空输入的文本', () => {
        const [props, setProps] = createSignal<InputProps>({});
        render(() => <Input {...props()} />);
        type('semi');
        setProps({ placeholder: 'name' });
        expect(getInput()).toHaveValue('semi');
    });

    it('密码模式点开明文后，无关属性变化不重新隐藏', () => {
        const [props, setProps] = createSignal<InputProps>({ mode: 'password', defaultValue: 'x' });
        render(() => <Input {...props()} />);
        fireEvent.click(getModeBtn());
        expect(getInput()).toHaveAttribute('type', 'text');
        setProps({ mode: 'password', defaultValue: 'x', placeholder: 'p' });
        expect(getInput()).toHaveAttribute('type', 'text');
    });

    it('type 为 hidden 时隐藏包裹层', () => {
        render(() => <Input type="hidden" />);
        expect(getWrapper()).toHaveClass(`${prefixCls}-wrapper-hidden`);
    });

    it('autofocus 挂载时以 preventScroll 聚焦输入框，禁用时不聚焦', () => {
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        const { unmount } = render(() => <Input autofocus preventScroll />);
        expect(getInput()).toHaveFocus();
        expect(focus).toHaveBeenCalledWith({ preventScroll: true });
        // focused by hand, not by the native attribute
        expect(getInput()).not.toHaveAttribute('autofocus');
        unmount();
        render(() => <Input autofocus disabled />);
        expect(getInput()).not.toHaveFocus();
    });

    it('点击包裹层以 preventScroll 聚焦输入框；禁用的输入框保持未聚焦', () => {
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        const { unmount } = render(() => <Input preventScroll />);
        fireEvent.click(getWrapper());
        expect(focus).toHaveBeenCalledWith({ preventScroll: true });
        expect(getInput()).toHaveFocus();
        unmount();
        render(() => <Input disabled />);
        fireEvent.click(getWrapper());
        expect(getInput()).not.toHaveFocus();
    });

    it('未知属性、aria 属性与焦点属性透传到原生 input，class 与 style 保留在包裹层', () => {
        const onPaste = vi.fn<(e: ClipboardEvent) => void>();
        render(() => <Input id="name-id" name="name" class="custom" inputStyle={{ color: 'blue' }} style={{ color: 'red' }} data-testid="name" aria-describedby="help" aria-label="Name" tabIndex={-1} title="tip" inputMode="numeric" onPaste={onPaste} />);
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
        fireEvent.paste(input);
        expect(onPaste).toHaveBeenCalledTimes(1);
        for (const attr of ['data-testid', 'aria-label', 'name', 'tabindex', 'id', 'title']) {
            expect(getWrapper()).not.toHaveAttribute(attr);
        }
        expect(getWrapper()).toHaveClass('custom');
        expect(input).not.toHaveClass('custom');
    });

    it('Tooltip 函数 children 展开到 Input 上：input 是一个 Tab 停靠点并由 Tooltip 描述，弹层锚定包裹层', async () => {
        render(() => <Tooltip content="tip">{(t) => <Input {...t()} />}</Tooltip>);
        expect(getWrapper()).not.toHaveAttribute('tabindex');
        await userEvent.tab();
        expect(getInput()).toHaveFocus();
        await waitFor(() => expect(getInput()).toHaveAccessibleDescription('tip'));
        expect(getWrapper()).not.toHaveAttribute('aria-describedby');
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it('禁用的 Input 在点击触发的 Tooltip 中由包裹 span 接收点击', async () => {
        render(() => (
            <Tooltip content="tip" motion={false} trigger="click">
                {(t) => <Input {...t()} disabled />}
            </Tooltip>
        ));
        const span = getWrapper().parentElement as HTMLElement;
        expect(span).toHaveClass(`${BASE_CLASS_PREFIX}-tooltip-trigger-wrapper`);
        expect(span).toHaveStyle({ cursor: 'not-allowed' });
        expect(getWrapper().style.pointerEvents).toBe('none');
        await userEvent.click(span);
        expect(await screen.findByText('tip')).toBeInTheDocument();
    });

    it('ref 收到包裹层，inputRef 收到原生 input', () => {
        let root: HTMLDivElement | undefined;
        let input: HTMLInputElement | undefined;
        render(() => <Input ref={(node) => (root = node)} inputRef={(node) => (input = node)} />);
        expect(root).toBe(getWrapper());
        expect(input).toBe(getInput());
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Input: { size: 'large', placeholder: 'global' } };
        const { unmount } = render(() => <Input />);
        expect(getInput()).toHaveClass(`${prefixCls}-large`);
        expect(getInput()).toHaveAttribute('placeholder', 'global');
        unmount();
        render(() => <Input size="small" />);
        expect(getInput()).toHaveClass(`${prefixCls}-small`);
    });
});

describe('InputGroup', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('带 label 的 InputGroup 各自有唯一 id，并以 aria-labelledby 指向 label', () => {
        render(() => (
            <>
                <InputGroup label={{ text: 'A' }}>
                    <Input />
                </InputGroup>
                <InputGroup label={{ text: 'B' }}>
                    <Input />
                </InputGroup>
            </>
        ));
        const ids = [...document.querySelectorAll('[id]')].map((node) => node.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(screen.getByRole('group', { name: 'A' })).toBeInTheDocument();
        expect(screen.getByRole('group', { name: 'B' })).toBeInTheDocument();
    });

    it('不输出 aria-disabled，子控件各自 disabled，自带 disabled 的子控件优先', () => {
        render(() => (
            <InputGroup disabled>
                <Input aria-label="a" />
                <Input aria-label="b" disabled={false} />
            </InputGroup>
        ));
        expect(screen.getByRole('group')).not.toHaveAttribute('aria-disabled');
        expect(screen.getByRole('textbox', { name: 'a' })).toBeDisabled();
        expect(screen.getByRole('textbox', { name: 'b' })).toBeEnabled();
    });

    it('整体替换 props 时保留子控件节点与焦点', () => {
        const [props, setProps] = createSignal<InputGroupProps>({ class: 'a' });
        render(() => (
            <InputGroup {...props()}>
                <Input />
            </InputGroup>
        ));
        const input = getInput();
        input.focus();
        setProps({ class: 'b' });
        expect(getInput()).toBe(input);
        expect(input).toHaveFocus();
    });

    it('label.text 为 0 时照常渲染', () => {
        render(() => (
            <InputGroup label={{ text: 0 }}>
                <Input />
            </InputGroup>
        ));
        expect(query(`${prefixCls}-group-wrapper`)).not.toBeNull();
        expect(screen.getByRole('group', { name: '0' })).toBeInTheDocument();
    });

    it('onFocus、onBlur 随子控件的焦点进出触发，子控件自己的回调照常', async () => {
        const groupFocus = vi.fn<NonNullable<InputGroupProps['onFocus']>>();
        const groupBlur = vi.fn<NonNullable<InputGroupProps['onBlur']>>();
        const inputFocus = vi.fn<FocusHandler>();
        const inputBlur = vi.fn<NonNullable<InputProps['onBlur']>>();
        render(() => (
            <InputGroup onBlur={groupBlur} onFocus={groupFocus}>
                <Input placeholder="Name" onBlur={inputBlur} onFocus={inputFocus} />
            </InputGroup>
        ));
        await userEvent.click(getInput());
        expect(inputFocus).toHaveBeenCalledTimes(1);
        expect(groupFocus).toHaveBeenCalledTimes(1);
        await userEvent.click(document.body);
        expect(inputBlur).toHaveBeenCalledTimes(1);
        expect(groupBlur).toHaveBeenCalledTimes(1);
    });

    it('原样渲染文本与数字子节点', () => {
        const { container } = render(() => (
            <InputGroup>
                <Input aria-label="first" />-{2}
                <Input aria-label="second" />
            </InputGroup>
        ));
        expect(screen.getAllByRole('textbox')).toHaveLength(2);
        expect(container).toHaveTextContent('-2');
    });

    it('在前面插入子项后，已有输入框保持同一实例', async () => {
        const [keys, setKeys] = createSignal(['name']);
        render(() => (
            <InputGroup>
                <For each={keys()}>{(key) => <Input aria-label={key} />}</For>
            </InputGroup>
        ));
        const name = screen.getByRole('textbox', { name: 'name' });
        await userEvent.type(name, 'abc');
        setKeys(['prefix', 'name']);
        expect(screen.getByRole('textbox', { name: 'name' })).toBe(name);
        expect(name).toHaveValue('abc');
    });

    it('带 label 的 InputGroup，label 在上方或左侧', () => {
        render(() => (
            <>
                <InputGroup label={{ text: 'Group Label' }} labelPosition="top">
                    <Input placeholder="Name" />
                </InputGroup>
                <InputGroup label={{ text: 'Label', name: 'custom-label' }} labelPosition="left">
                    <Input placeholder="Name" />
                </InputGroup>
            </>
        ));
        const [top, left] = document.querySelectorAll(`.${prefixCls}-group-wrapper`);
        expect(top).toHaveClass(`${prefixCls}-group-wrapper-with-top-label`);
        expect(top).toHaveTextContent('Group Label');
        expect(left).toHaveClass(`${prefixCls}-group-wrapper-with-left-label`);
    });

    it('size 替换子控件自己的 size', () => {
        render(() => (
            <InputGroup size="large">
                <Input placeholder="Name" size="small" />
            </InputGroup>
        ));
        expect(screen.getByRole('group')).toHaveClass(`${prefixCls}-large`);
        expect(getInput()).toHaveClass(`${prefixCls}-large`);
    });

    it('子节点为 null 时照常渲染其他子节点', () => {
        render(() => (
            <InputGroup>
                <Input placeholder="Name" />
                {null}
                <Input placeholder="Score" />
            </InputGroup>
        ));
        expect(document.querySelectorAll('input')).toHaveLength(2);
    });

    it('把 size、disabled 及其他属性传给每个子控件，分组元素不带其他属性', () => {
        render(() => (
            <InputGroup data-group="1" disabled size="small">
                <Input placeholder="a" />
                <Input placeholder="b" size="large" />
            </InputGroup>
        ));
        const group = screen.getByRole('group');
        expect(group).toHaveAttribute('aria-label', zh_CN.Input.group);
        expect(group).toHaveClass(`${prefixCls}-group`, `${prefixCls}-small`);
        expect(group).not.toHaveAttribute('data-group');
        for (const input of document.querySelectorAll('input')) {
            expect(input).toHaveClass(`${prefixCls}-small`);
            expect(input).toBeDisabled();
            expect(input).toHaveAttribute('data-group', '1');
        }
    });

    it('弹层内的输入框不继承打开它的分组', async () => {
        render(() => (
            <InputGroup disabled size="small">
                <Tooltip content={<Input aria-label="inner" />} motion={false} trigger="click">
                    <span>open</span>
                </Tooltip>
            </InputGroup>
        ));
        await userEvent.click(screen.getByText('open'));
        const inner = await screen.findByRole('textbox', { name: 'inner' });
        expect(inner).toBeEnabled();
        expect(inner).toHaveClass(`${prefixCls}-default`);
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { InputGroup: { size: 'large' } };
        render(() => (
            <InputGroup>
                <Input />
            </InputGroup>
        ));
        expect(screen.getByRole('group')).toHaveClass(`${prefixCls}-large`);
        expect(getInput()).toHaveClass(`${prefixCls}-large`);
    });

    it('ref 指向分组元素，无论是否带 label', () => {
        const [label, setLabel] = createSignal<InputGroupProps['label']>();
        const ref = vi.fn<(node: HTMLSpanElement) => void>();
        render(() => (
            <InputGroup ref={ref} label={label()}>
                <Input />
            </InputGroup>
        ));
        expect(ref).toHaveBeenLastCalledWith(screen.getByRole('group'));
        setLabel({ text: 'Score' });
        expect(ref).toHaveBeenLastCalledWith(screen.getByRole('group'));
        expect(getInput()).not.toHaveAttribute('ref');
    });

    it('带 label 时渲染 label，并为分组设置 id', () => {
        render(() => (
            <InputGroup class="g" style={{ color: 'red' }} label={{ text: 'Score', name: 'score' }}>
                <Input />
            </InputGroup>
        ));
        const group = screen.getByRole('group', { name: 'Score' });
        expect(group).toHaveAttribute('id', 'score');
        expect(group).toHaveClass('g');
        expect(group).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        const label = query(`${BASE_CLASS_PREFIX}-form-field-label`) as HTMLElement;
        expect(label).toHaveTextContent('Score');
    });

    it('ref 的 focus 聚焦原生输入框，blur 释放焦点', () => {
        let ref!: HTMLDivElement;
        let native!: HTMLInputElement;
        render(() => <Input ref={(node) => (ref = node)} inputRef={(node) => (native = node)} preventScroll />);
        expect(ref).toBe(getWrapper());
        const focus = vi.spyOn(native, 'focus');
        ref.focus();
        expect(native).toHaveFocus();
        expect(focus).toHaveBeenCalledWith({ preventScroll: true });
        ref.blur();
        expect(document.body).toHaveFocus();
    });
});
