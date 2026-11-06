import { flushSync, tick } from 'svelte';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { mockResizeObserverCore as mockResizeObserver } from '@test/utils/dom/resize-observer-core';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import type { TextAreaChangeEvent } from '../interface';
import TextAreaCase from './textarea-case.svelte';
import TextAreaModes from './textarea-modes.svelte';

type Case = NonNullable<Parameters<typeof TextAreaCase>[1]>['store'];
type Change = (value: string, event: TextAreaChangeEvent) => void;
type Modes = Parameters<typeof TextAreaModes>[1]['mode'];

const prefixCls = `${BASE_CLASS_PREFIX}-input`;
const getValueLength = (str: string) => [...new Intl.Segmenter().segment(str)].length;

const getTextArea = () => screen.getByRole<HTMLTextAreaElement>('textbox');
const getWrapper = () => document.querySelector<HTMLElement>(`.${prefixCls}-textarea-wrapper`) as HTMLElement;
const getCounter = () => document.querySelector<HTMLElement>(`.${prefixCls}-textarea-counter`) as HTMLElement;
const getClearBtn = () => document.querySelector<HTMLElement>(`.${prefixCls}-clearbtn`);
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
async function settle() {
    await tick();
    await tick();
    flushSync();
}
async function typeText(el: Element, value: string) {
    await fireEvent.input(el, { target: { value } });
    await settle();
}
function keyDownPrevented(el: Element, init: KeyboardEventInit) {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    el.dispatchEvent(event);
    return event.defaultPrevented;
}

function setup(initial: Case = {}) {
    const store = createStore<Case>({ props: {}, handle: {}, ...initial });
    const view = render(TextAreaCase, { props: { store } });
    const update = async (props: NonNullable<Case['props']>) => {
        Object.assign(store.props as object, props);
        await settle();
    };
    return { store, view, update };
}

function setupModes(mode: Modes, value?: string, accept = true) {
    const store = createStore<{ value: string | undefined; accept: boolean; log: string[] }>({ value, accept, log: [] });
    render(TextAreaModes, { props: { mode, store } });
    return { store, textarea: screen.getByRole('textbox', { name: 'field' }) as HTMLTextAreaElement };
}

describe('Svelte TextArea', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('观察 textarea 本身，用于 autosize 与原生拖拽缩放手柄', async () => {
        const { observed } = mockResizeObserver();
        const { update } = setup({ props: { autosize: true } });
        expect(observed()).toEqual([getTextArea()]);
        await update({ autosize: false, resize: 'vertical' });
        expect(observed()).toEqual([getTextArea()]);
    });

    it('class 与 style 落在外层容器', () => {
        setup({ props: { class: 'test', style: 'color: red' } });
        expect(getWrapper()).toHaveClass('test');
        expect(getWrapper()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getTextArea()).not.toHaveClass('test');
    });

    it('value 作初值，值变化时调用 onChange', async () => {
        const onChange = vi.fn<Change>();
        setup({ props: { value: 'semi', onChange } });
        expect(getTextArea()).toHaveValue('semi');
        await typeText(getTextArea(), 'semi!');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('semi!');
        expect(getTextArea()).toHaveValue('semi!');
    });

    it('显示 maxCount 与 showCounter', async () => {
        const { update } = setup({ props: { maxCount: 10 } });
        expect(getCounter()).toHaveTextContent(/^0\/10$/);
        await update({ value: 'semi' });
        expect(getCounter()).toHaveTextContent(/^4\/10$/);
        await update({ maxCount: undefined, showCounter: true });
        expect(getCounter()).toHaveTextContent(/^4$/);
        expect(getCounter()).not.toHaveClass(`${prefixCls}-textarea-counter-exceed`);
    });

    it('带 placeholder、rows，禁用状态', () => {
        setup({ props: { placeholder: 'semi placeholder', rows: 5, disabled: true } });
        expect(screen.getByPlaceholderText('semi placeholder')).toBe(getTextArea());
        expect(getTextArea()).toHaveAttribute('rows', '5');
        expect(getTextArea()).toHaveClass(`${prefixCls}-textarea-disabled`);
        expect(getTextArea()).toBeDisabled();
    });

    it('showClear 与 onClear：清除后按钮消失，onChange 第二个参数是鼠标事件，点击留在组件内', async () => {
        const onClear = vi.fn<(event: MouseEvent) => void>();
        const onChange = vi.fn<Change>();
        const outer = vi.fn<() => void>();
        setup({ props: { value: '123', showClear: true, onClear, onChange } });
        document.body.addEventListener('click', outer);
        onTestFinished(() => document.body.removeEventListener('click', outer));
        await userEvent.click(getClearBtn() as HTMLElement);
        await settle();
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onClear.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
        expect(onChange).toHaveBeenLastCalledWith('', expect.any(MouseEvent));
        expect(outer).not.toHaveBeenCalled();
        expect(getTextArea()).toHaveValue('');
        expect(document.body).toHaveFocus();
        expect(getClearBtn()).toBeNull();
    });

    it('焦点原在页面别处时，指针清除后焦点留在原处', async () => {
        const outside = document.createElement('button');
        document.body.append(outside);
        onTestFinished(() => outside.remove());
        setup({ props: { value: 'semi', showClear: true } });
        outside.focus();
        await userEvent.click(getClearBtn() as HTMLElement);
        await settle();
        expect(getTextArea()).toHaveValue('');
        expect(outside).toHaveFocus();
    });

    it.each(['{Enter}', ' '])('Tab 可以到达具名的清空按钮，%s 清空后焦点回到 textarea', async (key) => {
        const onClear = vi.fn<(event: MouseEvent) => void>();
        setup({ props: { value: 'semi', showClear: true, onClear } });
        await userEvent.click(getTextArea());
        await userEvent.tab();
        const button = screen.getByRole('button', { name: zh_CN.Input.clear });
        expect(button).toHaveFocus();
        expect(button).toHaveAttribute('type', 'button');
        await userEvent.keyboard(key);
        await settle();
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getTextArea()).toHaveValue('');
        expect(getTextArea()).toHaveFocus();
    });

    it('disabled 或 readonly 时不显示清空按钮', async () => {
        const { update } = setup({ props: { value: 'semi', disabled: true, showClear: true } });
        expect(getClearBtn()).toBeNull();
        await update({ disabled: false, readonly: true });
        expect(getClearBtn()).toBeNull();
        expect(getTextArea()).toHaveClass(`${prefixCls}-textarea-showClear`);
    });

    it('onEnterPress 在 Enter 时触发', async () => {
        const onEnterPress = vi.fn<(event: KeyboardEvent) => void>();
        setup({ props: { onEnterPress } });
        await fireEvent.keyDown(getTextArea(), { key: 'a' });
        expect(onEnterPress).not.toHaveBeenCalled();
        await fireEvent.keyDown(getTextArea(), { key: 'Enter' });
        expect(onEnterPress).toHaveBeenCalledTimes(1);
        expect(onEnterPress.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
    });

    it('超出 maxCount，getValueLength 按字素计数；aria-invalid 随之变化', async () => {
        const value = '💖💖💖💖💖💖💖💖💖💖';
        const { update } = setup({ props: { value, maxCount: 10 } });
        expect(getCounter()).toHaveClass(`${prefixCls}-textarea-counter-exceed`);
        expect(getCounter()).toHaveTextContent(/^20\/10$/);
        expect(getTextArea()).toHaveAttribute('aria-invalid', 'true');
        await update({ getValueLength });
        expect(getCounter()).not.toHaveClass(`${prefixCls}-textarea-counter-exceed`);
        expect(getCounter()).toHaveTextContent(/^10\/10$/);
        expect(getTextArea()).not.toHaveAttribute('aria-invalid');
    });

    it('minlength 按 getValueLength 换算原生属性，随属性变化', async () => {
        const first = '💖💖💖';
        const { update } = setup({ props: { minlength: 4, getValueLength } });
        await typeText(getTextArea(), first);
        expect(getTextArea()).toHaveAttribute('minlength', String(first.length + (4 - getValueLength(first))));
        await typeText(getTextArea(), '💖💖💖💖');
        expect(getTextArea()).toHaveAttribute('minlength', '4');
        await update({ minlength: 2, getValueLength: undefined });
        expect(getTextArea()).toHaveAttribute('minlength', '2');
    });

    it('受控值超过 maxlength 时只聚焦再失焦，不调用 onChange', () => {
        const onChange = vi.fn<Change>();
        setup({ props: { maxlength: 3, value: 'abcdef', onChange } });
        getTextArea().focus();
        getTextArea().blur();
        expect(onChange).not.toHaveBeenCalled();
        expect(getTextArea()).toHaveValue('abcdef');
    });

    it('maxlength 与 getValueLength 配合截断', async () => {
        const cases: [string, number, string][] = [
            ['Semi', 5, 'Semi'],
            ['Semi Design', 4, 'Semi'],
            ['💖💖💖💖💖💖💖💖💖💖👨👩👧👦', 10, '💖💖💖💖💖💖💖💖💖💖'],
            ['💖', -1, '💖'],
        ];
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        for (const [value, maxlength, expected] of cases) {
            const onChange = vi.fn<Change>();
            const view = setup({ props: { maxlength, getValueLength, onChange } });
            await typeText(getTextArea(), value);
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(getTextArea()).toHaveValue(expected);
            view.view.unmount();
        }
    });

    it.each([
        ['onCompositionStart', fireEvent.compositionStart],
        ['onCompositionEnd', fireEvent.compositionEnd],
        ['onCompositionUpdate', fireEvent.compositionUpdate],
    ] as const)('%s 回调', async (name, fire) => {
        const handler = vi.fn<(event: CompositionEvent) => void>();
        setup({ props: { [name]: handler } });
        await fire(getTextArea(), { data: 'test' });
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('onFocus 收到 focusin 并加焦点样式，onBlur 收到 focusout 并去掉焦点样式', async () => {
        const onFocus = vi.fn<(event: FocusEvent) => void>();
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        setup({ props: { onFocus, onBlur } });
        await userEvent.click(getTextArea());
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][0].type).toBe('focusin');
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-focus`);
        expect(onBlur).not.toHaveBeenCalled();
        await userEvent.tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onBlur.mock.calls[0][0].type).toBe('focusout');
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-textarea-wrapper-focus`);
    });

    it('readonly、borderless 与 validateStatus 类名', () => {
        setup({ props: { value: 'readonly text', readonly: true, borderless: true, validateStatus: 'warning' } });
        expect(getTextArea()).toHaveAttribute('readonly');
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-readonly`, `${prefixCls}-textarea-borderless`, `${prefixCls}-textarea-wrapper-warning`);
    });

    it('报错时对辅助技术标记为无效，显式 aria-invalid 保留', async () => {
        const { update, view } = setup({ props: { validateStatus: 'error' } });
        expect(getTextArea()).toHaveAttribute('aria-invalid', 'true');
        await update({ validateStatus: 'warning' });
        expect(getTextArea()).not.toHaveAttribute('aria-invalid');
        view.unmount();
        setup({ props: { 'aria-invalid': 'true' } });
        expect(getTextArea()).toHaveAttribute('aria-invalid', 'true');
    });

    it('onKeyDown 与 onKeyUp 回调', async () => {
        const onKeyDown = vi.fn<(event: KeyboardEvent) => void>();
        const onKeyUp = vi.fn<(event: KeyboardEvent) => void>();
        setup({ props: { onKeyDown, onKeyUp } });
        await fireEvent.keyDown(getTextArea(), { key: 'a' });
        await fireEvent.keyUp(getTextArea(), { key: 'a' });
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(onKeyUp).toHaveBeenCalledTimes(1);
    });

    it('计数器有 id，textarea 以 aria-describedby 引用它并保留调用方的值', async () => {
        const { update } = setup({ props: { maxCount: 10, 'aria-describedby': 'help' } });
        const counterId = getCounter().id;
        expect(counterId).not.toBe('');
        expect(getTextArea()).toHaveAttribute('aria-describedby', `help ${counterId}`);
        await update({ maxCount: undefined });
        expect(getTextArea()).toHaveAttribute('aria-describedby', 'help');
    });

    it('autosize 的行数写入自定义属性：minRows 缺省取 rows，maxRows 缺省不设', async () => {
        const minVar = `--${prefixCls}-textarea-min-rows`;
        const maxVar = `--${prefixCls}-textarea-max-rows`;
        const { update } = setup({ props: { autosize: { minRows: 2, maxRows: 6 } } });
        expect(getTextArea()).toHaveClass(`${prefixCls}-textarea-autosize`);
        expect(getTextArea()).toHaveStyle({ resize: 'none' });
        expect(getTextArea().style.getPropertyValue(minVar)).toBe('2');
        expect(getTextArea().style.getPropertyValue(maxVar)).toBe('6');
        await update({ autosize: true, rows: 3 });
        expect(getTextArea().style.getPropertyValue(minVar)).toBe('3');
        expect(getTextArea().style.getPropertyValue(maxVar)).toBe('');
        await update({ autosize: false });
        expect(getTextArea()).not.toHaveClass(`${prefixCls}-textarea-autosize`);
        expect(getTextArea().style.getPropertyValue(minVar)).toBe('');
    });

    it('onResize 发出 { height, width }，首次观察不发出', async () => {
        const observer = mockResizeObserver();
        const onResize = vi.fn<(size: { height: number; width?: number }) => void>();
        setup({ props: { resize: 'vertical', onResize } });
        const textarea = getTextArea();
        const entry = (width: number, height: number) => [{ contentRect: { width, height }, target: textarea }];
        observer.fire(textarea, entry(100, 50));
        await wait(30);
        expect(onResize).not.toHaveBeenCalled();
        observer.fire(textarea, entry(100, 80));
        await waitFor(() => expect(onResize).toHaveBeenCalledWith({ height: 80, width: 100 }));
    });

    it('卸载时取消节流中的 onResize', async () => {
        const observer = mockResizeObserver();
        const onResize = vi.fn<(size: { height: number; width?: number }) => void>();
        const { view } = setup({ props: { resize: 'vertical', onResize } });
        const textarea = getTextArea();
        const entry = (width: number, height: number) => [{ contentRect: { width, height }, target: textarea }];
        // the second report lands inside the throttle window, so it is still pending when the component unmounts
        observer.fire(textarea, entry(100, 50));
        observer.fire(textarea, entry(100, 80));
        view.unmount();
        await wait(30);
        expect(onResize).not.toHaveBeenCalled();
    });

    it('disabledEnterStartNewLine 阻止 Enter 但不阻止 Shift+Enter，不落到原生属性', () => {
        const onEnterPress = vi.fn<(event: KeyboardEvent) => void>();
        setup({ props: { disabledEnterStartNewLine: true, onEnterPress } });
        expect(keyDownPrevented(getTextArea(), { key: 'Enter' })).toBe(true);
        expect(keyDownPrevented(getTextArea(), { key: 'Enter', shiftKey: true })).toBe(false);
        expect(onEnterPress).toHaveBeenCalledTimes(2);
        expect(getTextArea()).not.toHaveAttribute('disabledenterstartnewline');
    });

    it('点击计数器或外层容器时聚焦 TextArea，禁用时除外', async () => {
        const { view } = setup({ props: { value: 'semi', showCounter: true } });
        await fireEvent.click(getCounter());
        expect(getTextArea()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-focus`);
        view.unmount();
        setup({ props: { value: 'semi', disabled: true, showCounter: true } });
        await fireEvent.click(getWrapper());
        await fireEvent.click(getCounter());
        expect(getTextArea()).not.toHaveFocus();
    });

    it('未设置 getValueLength 时，输入法残留多余文本则在失焦时按 maxlength 截断', async () => {
        const onChange = vi.fn<Change>();
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        setup({ props: { maxlength: 2, onChange } });
        expect(getTextArea()).toHaveAttribute('maxlength', '2');
        await fireEvent.compositionStart(getTextArea());
        await typeText(getTextArea(), 'abc');
        await fireEvent.focusOut(getTextArea());
        await settle();
        expect(onChange.mock.calls.at(-1)?.[0]).toBe('ab');
        expect(onChange.mock.calls.at(-1)?.[1]).toBeInstanceOf(FocusEvent);
        expect(getTextArea()).toHaveValue('ab');
    });

    it('composition 模式下，组合结束后只上报一次，并显示组合中的文本', async () => {
        const onChange = vi.fn<Change>();
        setup({ props: { value: '', composition: true, onChange } });
        await fireEvent.compositionStart(getTextArea());
        await typeText(getTextArea(), 'ni');
        expect(onChange).not.toHaveBeenCalled();
        expect(getTextArea()).toHaveValue('ni');
        await fireEvent.compositionEnd(getTextArea(), { target: { value: '你' } });
        await settle();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('你');
        expect(onChange.mock.calls[0][1]).toBeInstanceOf(CompositionEvent);
    });

    it('未声明属性与监听器落到原生 textarea，class 与 style 作用于外层容器', async () => {
        const onpaste = vi.fn<(event: ClipboardEvent) => void>();
        setup({
            props: {
                name: 'desc',
                class: 'custom',
                style: 'color: red',
                textareaStyle: 'color: blue',
                'data-testid': 'desc',
                'aria-label': 'Description',
                tabindex: -1,
                onpaste,
            },
        });
        const textarea = getTextArea();
        expect(screen.getByTestId('desc')).toBe(textarea);
        expect(textarea).toHaveAttribute('aria-label', 'Description');
        expect(textarea).toHaveAttribute('name', 'desc');
        expect(textarea).toHaveAttribute('tabindex', '-1');
        expect(textarea).toHaveStyle({ color: 'rgb(0, 0, 255)' });
        await fireEvent.paste(textarea);
        expect(onpaste).toHaveBeenCalledTimes(1);
        expect(getWrapper()).toHaveClass('custom');
        for (const attr of ['data-testid', 'aria-label', 'name', 'tabindex']) {
            expect(getWrapper()).not.toHaveAttribute(attr);
        }
    });

    it('原生 onscroll 与行号同步并存', async () => {
        const onscroll = vi.fn<(event: Event) => void>();
        setup({ props: { value: 'a\nb', showLineNumber: true, onscroll } });
        await fireEvent.scroll(getTextArea());
        expect(onscroll).toHaveBeenCalledTimes(1);
    });

    it('autofocus 挂载时聚焦 textarea，不输出原生属性', () => {
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        setup({ props: { autofocus: true } });
        expect(focus.mock.contexts).toEqual([getTextArea()]);
        expect(getTextArea()).not.toHaveAttribute('autofocus');
    });

    it('句柄的 focus、blur 驱动焦点样式，select 选中文本，setSelectionRange 移动选区', async () => {
        const { store } = setup({ props: { value: 'semi design' } });
        const handle = () => store.handle?.current as NonNullable<NonNullable<Case['handle']>['current']>;
        handle().focus();
        await settle();
        expect(getTextArea()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-focus`);
        handle().select();
        expect([getTextArea().selectionStart, getTextArea().selectionEnd]).toEqual([0, 11]);
        handle().setSelectionRange(2, 6, 'backward');
        expect([getTextArea().selectionStart, getTextArea().selectionEnd, getTextArea().selectionDirection]).toEqual([2, 6, 'backward']);
        handle().blur();
        await settle();
        expect(getTextArea()).not.toHaveFocus();
        expect(handle().getTextarea()).toBe(getTextArea());
        expect(handle().getNativeElement()).toBe(getWrapper());
    });

    it('showLineNumber 重新挂载 textarea 后，句柄指向当前挂载的 textarea', async () => {
        const { store, update } = setup({ props: { value: 'a' } });
        const before = getTextArea();
        await update({ showLineNumber: true });
        expect(getTextArea()).not.toBe(before);
        expect(store.handle?.current?.getTextarea()).toBe(getTextArea());
        store.handle?.current?.focus();
        expect(getTextArea()).toHaveFocus();
    });

    it('resize 属性设置 textarea 样式与外层容器类名', async () => {
        const { update } = setup({ props: { resize: 'horizontal' } });
        expect(getTextArea()).toHaveStyle({ resize: 'horizontal' });
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-resizeX`);
        await update({ resize: 'vertical' });
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-resizeY`);
        await update({ autosize: true, resize: 'both' });
        expect(getTextArea()).toHaveStyle({ resize: 'none' });
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-textarea-wrapper-resizeX`);
    });

    it('showLineNumber 从 lineNumberStart 开始，每行一个行号，面板对辅助技术隐藏', () => {
        setup({ props: { lineNumberClassName: 'nums', value: 'a\nb\nc', lineNumberStart: 3, showLineNumber: true } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-withLineNumber`);
        const items = document.querySelectorAll(`.${prefixCls}-textarea-lineNumber-item`);
        expect([...items].map((item) => item.textContent?.trim())).toEqual(['3', '4', '5']);
        const panel = document.querySelector('.nums');
        expect(panel).toHaveClass(`${prefixCls}-textarea-lineNumber`);
        expect(panel).toHaveAttribute('aria-hidden', 'true');
    });

    it('负数 maxlength 不限制值', async () => {
        const onChange = vi.fn<Change>();
        setup({ props: { value: 'semi', maxlength: -1, onChange } });
        await typeText(getTextArea(), 'semi design');
        await fireEvent.focusOut(getTextArea());
        expect(onChange.mock.calls.map(([value]) => value)).toEqual(['semi design']);
        expect(getTextArea()).toHaveValue('semi design');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值，自己的属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { TextArea: { rows: 2, showCounter: true } };
        const view = setup({ props: { value: 'semi' } });
        expect(getTextArea()).toHaveAttribute('rows', '2');
        expect(getCounter()).toHaveTextContent(/^4$/);
        view.view.unmount();
        setup({ props: { rows: 6 } });
        expect(getTextArea()).toHaveAttribute('rows', '6');
    });

    it('应用注入的 semiGlobal 默认值', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { TextArea: { rows: 3, showClear: true } };
        render(TextAreaCase, { props: { store: createStore<Case>({ props: { value: 'semi' } }) }, context: new Map([[semiGlobalKey, semi]]) });
        expect(getTextArea()).toHaveAttribute('rows', '3');
        expect(getClearBtn()).not.toBeNull();
    });
});

describe('Svelte TextArea 受控值（$bindable）', () => {
    it('非受控：输入后保留文本，onChange 收到新值', async () => {
        const { store, textarea } = setupModes('uncontrolled');
        await userEvent.type(textarea, 'bc');
        expect(textarea).toHaveValue('bc');
        expect(store.log).toEqual(['change b', 'change bc']);
    });

    it('bind:value：输入写回父级，父级改值同步到 textarea，改回 undefined 后清空', async () => {
        const { store, textarea } = setupModes('bind', 'a');
        await userEvent.type(textarea, 'b');
        expect(store.value).toBe('ab');
        store.value = 'parent';
        await settle();
        expect(textarea).toHaveValue('parent');
        store.value = undefined;
        await settle();
        expect(textarea).toHaveValue('');
        await userEvent.type(textarea, 'c');
        expect(textarea).toHaveValue('c');
    });

    it('函数绑定：setter 拒绝时 textarea 退回原值，接受时跟随', async () => {
        const rejected = setupModes('function', 'a', false);
        await userEvent.type(rejected.textarea, 'b');
        await settle();
        expect(rejected.store.value).toBe('a');
        expect(rejected.textarea).toHaveValue('a');
    });

    it('函数绑定：setter 接受时跟随', async () => {
        const { store, textarea } = setupModes('function', 'a', true);
        await userEvent.type(textarea, 'b');
        expect(store.value).toBe('ab');
        expect(textarea).toHaveValue('ab');
    });

    it('单向传值：输入在本地覆盖，父级值不变；父级再推值时覆盖本地', async () => {
        const { store, textarea } = setupModes('one-way', 'a');
        await userEvent.type(textarea, 'b');
        expect(store.value).toBe('a');
        expect(textarea).toHaveValue('ab');
        store.value = undefined;
        await settle();
        expect(textarea).toHaveValue('');
    });
});
