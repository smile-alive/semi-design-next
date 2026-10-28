/** @jsxImportSource vue */
import { nextTick } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen } from '@testing-library/vue';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { mockResizeObserver, render } from '@test/utils/vue';
import { TextArea, type TextAreaChangeEvent, type TextAreaHandle, type TextAreaProps } from '..';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import TextAreaModel from './fixtures/textarea-model.vue';

type Change = (value: string, event: TextAreaChangeEvent) => void;
const prefixCls = `${BASE_CLASS_PREFIX}-input`;
const getValueLength = (str: string) => [...new Intl.Segmenter().segment(str)].length;

const getTextArea = () => screen.getByRole<HTMLTextAreaElement>('textbox');
const getWrapper = () => document.querySelector<HTMLElement>(`.${prefixCls}-textarea-wrapper`) as HTMLElement;
const getCounter = () => document.querySelector<HTMLElement>(`.${prefixCls}-textarea-counter`) as HTMLElement;
const getClearBtn = () => document.querySelector<HTMLElement>(`.${prefixCls}-clearbtn`);
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// Testing Library's Vue fireEvent resolves to nothing, so read defaultPrevented from a dispatched event
const keyDownPrevented = (el: Element, init: KeyboardEventInit) => {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    el.dispatchEvent(event);
    return event.defaultPrevented;
};
// A function ref receives the handle that defineExpose builds
const renderWithHandle = (props: TextAreaProps & Record<string, unknown> = {}) => {
    const refFn = vi.fn<(handle: TextAreaHandle | null) => void>();
    const Host = (hostProps: Record<string, unknown>) => <TextArea {...hostProps} ref={(value) => refFn(value as TextAreaHandle | null)} />;
    const view = render(Host, { props });
    const handle = () => refFn.mock.calls[0]?.[0] as TextAreaHandle;
    return { ...view, refFn, handle };
};
const resizeEntry = (target: Element, width: number, height: number) => ({ contentRect: { width, height }, target });

describe('TextArea', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('观察 textarea 本身，用于 autosize 与原生拖拽缩放手柄', async () => {
        const { observed } = mockResizeObserver();
        const view = render(TextArea, { props: { autosize: true } });
        expect(observed()).toEqual([getTextArea()]);
        await view.rerender({ autosize: false, resize: 'vertical' });
        expect(observed()).toEqual([getTextArea()]);
    });

    it('class 与 style 落在外层容器', () => {
        render(TextArea, { attrs: { class: 'test', style: { color: 'red' } } });
        expect(getWrapper()).toHaveClass('test');
        expect(getWrapper()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getTextArea()).not.toHaveClass('test');
    });

    it('defaultValue', () => {
        render(TextArea, { props: { defaultValue: 'semi' } });
        expect(getTextArea()).toHaveValue('semi');
    });

    it('值变化时发出 change 与 update:modelValue', async () => {
        const change = vi.fn<Change>();
        const update = vi.fn<(value: string) => void>();
        render(TextArea, { props: { onChange: change, 'onUpdate:modelValue': update } });
        await fireEvent.update(getTextArea(), 'semi');
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0][0]).toBe('semi');
        expect(update).toHaveBeenCalledWith('semi');
        expect(getTextArea()).toHaveValue('semi');
    });

    it('显示 maxCount', async () => {
        const view = render(TextArea, { props: { maxCount: 10 } });
        expect(getCounter()).toHaveTextContent(/^0\/10$/);
        await view.rerender({ modelValue: 'semi' });
        expect(getCounter()).toHaveTextContent(/^4\/10$/);
    });

    it('带 placeholder', () => {
        render(TextArea, { props: { placeholder: 'semi placeholder' } });
        expect(screen.getByPlaceholderText('semi placeholder')).toBe(getTextArea());
    });

    it('禁用状态', () => {
        render(TextArea, { props: { disabled: true } });
        expect(getTextArea()).toHaveClass(`${prefixCls}-textarea-disabled`);
        expect(getTextArea()).toBeDisabled();
    });

    it('showClear 与 clear：指针清除不移动焦点，清空后按钮消失', async () => {
        const clear = vi.fn<(event: MouseEvent) => void>();
        render(TextArea, { props: { defaultValue: '123', showClear: true, onClear: clear } });
        await userEvent.click(getClearBtn() as HTMLElement);
        expect(clear).toHaveBeenCalledTimes(1);
        expect(clear.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
        expect(getTextArea()).toHaveValue('');
        expect(document.body).toHaveFocus();
        expect(getClearBtn()).toBeNull();
    });

    it('焦点原在页面别处时，指针清除后焦点留在原处', async () => {
        const outside = document.createElement('button');
        document.body.append(outside);
        onTestFinished(() => outside.remove());
        render(TextArea, { props: { defaultValue: 'semi', showClear: true } });
        outside.focus();
        await userEvent.click(getClearBtn() as HTMLElement);
        expect(getTextArea()).toHaveValue('');
        expect(outside).toHaveFocus();
    });

    it('enterPress', async () => {
        const enterPress = vi.fn<(event: KeyboardEvent) => void>();
        render(TextArea, { props: { onEnterPress: enterPress } });
        await fireEvent.keyDown(getTextArea(), { key: 'a' });
        expect(enterPress).not.toHaveBeenCalled();
        await fireEvent.keyDown(getTextArea(), { key: 'Enter' });
        expect(enterPress).toHaveBeenCalledTimes(1);
        expect(enterPress.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
    });

    it('受控模式', async () => {
        const change = vi.fn<Change>();
        const view = render(TextArea, { props: { modelValue: 'semi', onChange: change } });
        expect(getTextArea()).toHaveValue('semi');
        await fireEvent.update(getTextArea(), 'vita lemon');
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0][0]).toBe('vita lemon');
        expect(getTextArea()).toHaveValue('semi');
        await view.rerender({ modelValue: 'vita lemon' });
        expect(getTextArea()).toHaveValue('vita lemon');
    });

    it('v-model 双向绑定，父组件改值后 textarea 跟随', async () => {
        render(TextAreaModel);
        const textarea = screen.getByRole('textbox', { name: 'model' });
        await userEvent.type(textarea, 'ab');
        expect(screen.getByTestId('model-value')).toHaveTextContent('ab');
        await userEvent.click(screen.getByRole('button', { name: 'set' }));
        expect(textarea).toHaveValue('parent');
    });

    it('v-model.trim 能输入词间空格，且修饰符不落到原生元素', async () => {
        render(TextAreaModel);
        const textarea = screen.getByRole('textbox', { name: 'trim' });
        await userEvent.type(textarea, 'a b');
        expect(textarea).toHaveValue('a b');
        expect(screen.getByTestId('trim-value')).toHaveTextContent('"a b"');
        expect(textarea).not.toHaveAttribute('modelmodifiers');
    });

    it('单向绑定且父组件不接受新值时，textarea 回到 modelValue', async () => {
        const change = vi.fn<Change>();
        render(TextArea, { props: { modelValue: 'a', onChange: change } });
        await userEvent.type(getTextArea(), 'b');
        expect(change.mock.calls[0][0]).toBe('ab');
        expect(getTextArea()).toHaveValue('a');
    });

    it('超出 maxCount', async () => {
        const defaultValue = '💖💖💖💖💖💖💖💖💖💖';
        const view = render(TextArea, { props: { defaultValue, maxCount: 10 } });
        expect(getCounter()).toHaveClass(`${prefixCls}-textarea-counter-exceed`);
        expect(getCounter()).toHaveTextContent(/^20\/10$/);
        await view.rerender({ getValueLength });
        expect(getCounter()).not.toHaveClass(`${prefixCls}-textarea-counter-exceed`);
        expect(getCounter()).toHaveTextContent(/^10\/10$/);
    });

    it('minlength 按 getValueLength 换算原生属性', async () => {
        const first = '💖💖💖';
        const second = '💖💖💖💖';
        const minlength = 4;
        const change = vi.fn<Change>();
        render(TextArea, { props: { minlength, getValueLength, onChange: change } });
        await fireEvent.update(getTextArea(), first);
        expect(change.mock.calls[0][0]).toBe(first);
        expect(getTextArea()).toHaveAttribute('minlength', String(first.length + (minlength - getValueLength(first))));
        await fireEvent.update(getTextArea(), second);
        expect(change.mock.calls[1][0]).toBe(second);
        expect(getTextArea()).toHaveAttribute('minlength', String(minlength));
    });

    it('同时设置 maxlength 与 minlength 时，输入后仍调整原生 minlength', async () => {
        const value = '💖💖💖';
        render(TextArea, { props: { maxlength: 10, minlength: 4, getValueLength } });
        await fireEvent.update(getTextArea(), value);
        expect(getTextArea()).toHaveAttribute('minlength', String(value.length + (4 - getValueLength(value))));
    });

    it('minlength 属性变化后，原生 minlength 随之变化', async () => {
        const view = render(TextArea, { props: { minlength: 5 } });
        expect(getTextArea()).toHaveAttribute('minlength', '5');
        await view.rerender({ minlength: 2 });
        expect(getTextArea()).toHaveAttribute('minlength', '2');
    });

    it('传 getValueLength 时，原生 minlength 按当前值换算，不等下一次输入', async () => {
        const value = '💖💖';
        const view = render(TextArea, { props: { minlength: 4, modelValue: value, getValueLength } });
        expect(getTextArea()).toHaveAttribute('minlength', String(value.length + 2));
        await view.rerender({ minlength: 3 });
        expect(getTextArea()).toHaveAttribute('minlength', String(value.length + 1));
    });

    it('受控值超过 maxlength 时只聚焦再失焦，不发出 change', () => {
        const change = vi.fn<Change>();
        render(TextArea, { props: { maxlength: 3, modelValue: 'abcdef', onChange: change } });
        getTextArea().focus();
        getTextArea().blur();
        expect(change).not.toHaveBeenCalled();
        expect(getTextArea()).toHaveValue('abcdef');
    });

    it('maxlength 与 getValueLength 配合截断', async () => {
        const cases: [string, number, string][] = [
            ['Semi', 5, 'Semi'],
            ['Semi Design', 4, 'Semi'],
            ['💖💖💖💖💖💖💖💖💖💖👨👩👧👦', 10, '💖💖💖💖💖💖💖💖💖💖'],
            ['💖', -1, '💖'],
            ['🆗', 1, '🆗'],
        ];
        for (const [value, maxlength, expected] of cases) {
            const change = vi.fn<Change>();
            const view = render(TextArea, { props: { maxlength, getValueLength, onChange: change } });
            await fireEvent.update(getTextArea(), value);
            expect(change).toHaveBeenCalledTimes(1);
            expect(getTextArea()).toHaveValue(expected);
            view.unmount();
        }
    });

    it('截断时 getValueLength 的调用次数为对数级', async () => {
        const cases: [string, number][] = [
            ['Semi Design', 4],
            [Array.from({ length: 1000 }).fill('👨‍👩‍👧‍👦').join(''), 500],
        ];
        for (const [value, maxlength] of cases) {
            const spy = vi.fn<(str: string) => number>(getValueLength);
            const view = render(TextArea, { props: { maxlength, getValueLength: spy } });
            await fireEvent.update(getTextArea(), value);
            expect(spy.mock.calls.length).toBeLessThanOrEqual(1 + Math.ceil(Math.log2(value.length)));
            expect(getValueLength(getTextArea().value)).toBe(maxlength);
            view.unmount();
        }
    });

    it.each([
        ['compositionstart', fireEvent.compositionStart],
        ['compositionend', fireEvent.compositionEnd],
        ['compositionupdate', fireEvent.compositionUpdate],
    ] as const)('发出 %s', async (name, fire) => {
        const handler = vi.fn<(event: CompositionEvent) => void>();
        const key = `on${name[0].toUpperCase()}${name.slice(1)}`;
        render(TextArea, { props: { [key]: handler } });
        await fire(getTextArea(), { data: 'test' });
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('focus 收到 focusin 事件并加焦点样式', async () => {
        const focus = vi.fn<(event: FocusEvent) => void>();
        render(TextArea, { props: { onFocus: focus } });
        await userEvent.click(getTextArea());
        expect(focus).toHaveBeenCalledTimes(1);
        expect(focus.mock.calls[0][0].type).toBe('focusin');
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-focus`);
    });

    it('blur 收到 focusout 事件并去掉焦点样式', async () => {
        const blur = vi.fn<(event: FocusEvent) => void>();
        render(TextArea, { props: { onBlur: blur } });
        await userEvent.click(getTextArea());
        expect(blur).not.toHaveBeenCalled();
        await userEvent.tab();
        expect(blur).toHaveBeenCalledTimes(1);
        expect(blur.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
        expect(blur.mock.calls[0][0].type).toBe('focusout');
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-textarea-wrapper-focus`);
    });

    it('readonly', () => {
        render(TextArea, { props: { defaultValue: 'readonly text', readonly: true } });
        expect(getTextArea()).toHaveAttribute('readonly');
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-readonly`);
    });

    it('原生 readOnly 落到 textarea 上，不能编辑', async () => {
        render(TextArea, { props: { defaultValue: 'semi' }, attrs: { readOnly: true } });
        expect(getTextArea()).toHaveAttribute('readonly');
        await userEvent.type(getTextArea(), 'abc');
        expect(getTextArea()).toHaveValue('semi');
    });

    it('borderless', () => {
        render(TextArea, { props: { borderless: true } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-borderless`);
    });

    it('报错时对辅助技术标记为无效，与 Input 一致', async () => {
        const view = render(TextArea, { props: { validateStatus: 'error' } });
        expect(getTextArea()).toHaveAttribute('aria-invalid', 'true');
        await view.rerender({ validateStatus: 'warning' });
        expect(getTextArea()).not.toHaveAttribute('aria-invalid');
        view.unmount();
        render(TextArea, { attrs: { 'aria-invalid': 'true' } });
        expect(getTextArea()).toHaveAttribute('aria-invalid', 'true');
    });

    it('超出 maxCount 时对辅助技术标记为无效，回到范围内后取消', async () => {
        const view = render(TextArea, { props: { modelValue: 'abcd', maxCount: 3 } });
        expect(getTextArea()).toHaveAttribute('aria-invalid', 'true');
        await view.rerender({ modelValue: 'abc' });
        expect(getTextArea()).not.toHaveAttribute('aria-invalid');
    });

    it.each(['warning', 'error'] as const)('validateStatus=%s', (validateStatus) => {
        render(TextArea, { props: { validateStatus } });
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-${validateStatus}`);
    });

    it('keydown', async () => {
        const keydown = vi.fn<(event: KeyboardEvent) => void>();
        render(TextArea, { props: { onKeydown: keydown } });
        await fireEvent.keyDown(getTextArea(), { key: 'a' });
        expect(keydown).toHaveBeenCalledTimes(1);
    });

    it('rows', () => {
        render(TextArea, { props: { rows: 5 } });
        expect(getTextArea()).toHaveAttribute('rows', '5');
    });

    it('模板 ref 拿到 expose 的句柄', () => {
        const { handle } = renderWithHandle();
        expect(handle().textarea).toBe(getTextArea());
        expect(handle().nativeElement).toBe(getWrapper());
    });

    it('不带 maxCount 时的 showCounter', () => {
        render(TextArea, { props: { defaultValue: 'test', showCounter: true } });
        expect(getCounter()).toHaveTextContent(/^4$/);
        expect(getCounter()).not.toHaveClass(`${prefixCls}-textarea-counter-exceed`);
    });

    it('计数器有 id，textarea 以 aria-describedby 引用它并保留调用方的值', async () => {
        const view = render(TextArea, { props: { maxCount: 10 }, attrs: { 'aria-describedby': 'help' } });
        const counterId = getCounter().id;
        expect(counterId).not.toBe('');
        expect(getTextArea()).toHaveAttribute('aria-describedby', `help ${counterId}`);
        await view.rerender({ maxCount: undefined });
        expect(getTextArea()).toHaveAttribute('aria-describedby', 'help');
    });

    it('autosize 的行数写入自定义属性：minRows 缺省取 rows，maxRows 缺省不设', async () => {
        const minVar = `--${prefixCls}-textarea-min-rows`;
        const maxVar = `--${prefixCls}-textarea-max-rows`;
        const view = render(TextArea, { props: { autosize: { minRows: 2, maxRows: 6 } } });
        expect(getTextArea()).toHaveClass(`${prefixCls}-textarea-autosize`);
        expect(getTextArea()).toHaveStyle({ resize: 'none' });
        expect(getTextArea().style.getPropertyValue(minVar)).toBe('2');
        expect(getTextArea().style.getPropertyValue(maxVar)).toBe('6');
        await view.rerender({ autosize: true, rows: 3 });
        expect(getTextArea().style.getPropertyValue(minVar)).toBe('3');
        expect(getTextArea().style.getPropertyValue(maxVar)).toBe('');
        await view.rerender({ autosize: false });
        expect(getTextArea()).not.toHaveClass(`${prefixCls}-textarea-autosize`);
        expect(getTextArea().style.getPropertyValue(minVar)).toBe('');
    });

    it('resize 发出 { height, width }，首次观察不发出', async () => {
        const observer = mockResizeObserver();
        const resize = vi.fn<(size: { height: number; width?: number }) => void>();
        render(TextArea, { props: { resize: 'vertical', onResize: resize } });
        const textarea = getTextArea();
        await observer.fire(textarea, [resizeEntry(textarea, 100, 50)]);
        expect(resize).not.toHaveBeenCalled();
        await observer.fire(textarea, [resizeEntry(textarea, 100, 80)]);
        await vi.waitFor(() => expect(resize).toHaveBeenCalledWith({ height: 80, width: 100 }));
    });

    it('卸载时取消节流中的 resize', async () => {
        const observer = mockResizeObserver();
        const resize = vi.fn<(size: { height: number; width?: number }) => void>();
        const view = render(TextArea, { props: { resize: 'vertical', onResize: resize } });
        const textarea = getTextArea();
        await observer.fire(textarea, [resizeEntry(textarea, 100, 50)]);
        await observer.fire(textarea, [resizeEntry(textarea, 100, 80)]);
        view.unmount();
        await wait(30);
        expect(resize).not.toHaveBeenCalled();
    });

    it('非受控 TextArea 保留用户输入的内容', async () => {
        const change = vi.fn<Change>();
        render(TextArea, { props: { defaultValue: 'a', onChange: change } });
        await userEvent.type(getTextArea(), 'b');
        expect(getTextArea()).toHaveValue('ab');
        expect(change.mock.calls[0][0]).toBe('ab');
        expect(change.mock.calls[0][1].target).toBe(getTextArea());
    });

    it('受控值恢复为 undefined（表单重置）时清空 TextArea', async () => {
        const view = render(TextArea, { props: { modelValue: 'semi' } });
        await view.rerender({ modelValue: undefined });
        expect(getTextArea()).toHaveValue('');
    });

    it('清空已聚焦的 TextArea 时报告 change 与 clear，保持焦点，点击留在组件内', async () => {
        const blur = vi.fn<(event: FocusEvent) => void>();
        const change = vi.fn<Change>();
        const clear = vi.fn<(event: MouseEvent) => void>();
        const outer = vi.fn<() => void>();
        render(TextArea, {
            props: { defaultValue: 'semi', showClear: true, onBlur: blur, onChange: change, onClear: clear },
        });
        await userEvent.click(getTextArea());
        document.body.addEventListener('click', outer);
        onTestFinished(() => document.body.removeEventListener('click', outer));
        await userEvent.click(getClearBtn() as HTMLElement);
        expect(blur).not.toHaveBeenCalled();
        expect(change).toHaveBeenLastCalledWith('', expect.any(MouseEvent));
        expect(clear).toHaveBeenCalledTimes(1);
        expect(outer).not.toHaveBeenCalled();
        expect(getTextArea()).toHaveValue('');
        expect(getTextArea()).toHaveFocus();
    });

    it.each(['{Enter}', ' '])('Tab 可以到达具名的清空按钮，%s 清空后焦点回到 textarea', async (key) => {
        const clear = vi.fn<(event: MouseEvent) => void>();
        render(TextArea, { props: { defaultValue: 'semi', showClear: true, onClear: clear } });
        await userEvent.click(getTextArea());
        await userEvent.tab();
        const button = screen.getByRole('button', { name: zh_CN.Input.clear });
        expect(button).toHaveFocus();
        expect(button).toHaveAttribute('type', 'button');
        await userEvent.keyboard(key);
        expect(clear).toHaveBeenCalledTimes(1);
        expect(getTextArea()).toHaveValue('');
        expect(getTextArea()).toHaveFocus();
    });

    it('disabled 或 readonly 时不显示清空按钮', async () => {
        const view = render(TextArea, { props: { defaultValue: 'semi', disabled: true, showClear: true } });
        expect(getClearBtn()).toBeNull();
        await view.rerender({ disabled: false, readonly: true });
        expect(getClearBtn()).toBeNull();
        expect(getTextArea()).toHaveClass(`${prefixCls}-textarea-showClear`);
    });

    it('disabledEnterStartNewLine 阻止 Enter 但不阻止 Shift+Enter', () => {
        const enterPress = vi.fn<(event: KeyboardEvent) => void>();
        render(TextArea, { props: { disabledEnterStartNewLine: true, onEnterPress: enterPress } });
        expect(keyDownPrevented(getTextArea(), { key: 'Enter' })).toBe(true);
        expect(keyDownPrevented(getTextArea(), { key: 'Enter', shiftKey: true })).toBe(false);
        expect(enterPress).toHaveBeenCalledTimes(2);
        expect(getTextArea()).not.toHaveAttribute('disabledenterstartnewline');
    });

    it('点击计数器或外层容器时聚焦 TextArea，禁用时除外', async () => {
        const view = render(TextArea, { props: { defaultValue: 'semi', showCounter: true } });
        await fireEvent.click(getCounter());
        expect(getTextArea()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-focus`);
        view.unmount();
        render(TextArea, { props: { defaultValue: 'semi', disabled: true, showCounter: true } });
        await fireEvent.click(getWrapper());
        await fireEvent.click(getCounter());
        expect(getTextArea()).not.toHaveFocus();
    });

    it('未设置 getValueLength 时，输入法残留多余文本则在失焦时按 maxlength 截断', async () => {
        const change = vi.fn<Change>();
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(TextArea, { props: { maxlength: 2, onChange: change } });
        expect(getTextArea()).toHaveAttribute('maxlength', '2');
        await fireEvent.compositionStart(getTextArea());
        await fireEvent.update(getTextArea(), 'abc');
        await fireEvent.focusOut(getTextArea());
        expect(change.mock.calls.at(-1)?.[0]).toBe('ab');
        expect(change.mock.calls.at(-1)?.[1]).toBeInstanceOf(FocusEvent);
        expect(getTextArea()).toHaveValue('ab');
    });

    it('composition 受控且父组件拒绝组合结果时，组合结束后恢复为属性值', async () => {
        const view = render(TextArea, { props: { modelValue: '', composition: true, onChange: vi.fn<Change>() } });
        await fireEvent.compositionStart(getTextArea());
        await fireEvent.update(getTextArea(), 'ni');
        await fireEvent.compositionEnd(getTextArea(), { target: { value: '你' } });
        await view.rerender({ placeholder: 'later' });
        expect(getTextArea()).toHaveValue('');
    });

    it('输入法组合模式下，组合结束后只报告一次，并显示组合中的文本', async () => {
        const change = vi.fn<Change>();
        render(TextArea, { props: { modelValue: '', composition: true, onChange: change } });
        await fireEvent.compositionStart(getTextArea());
        await fireEvent.update(getTextArea(), 'ni');
        expect(change).not.toHaveBeenCalled();
        expect(getTextArea()).toHaveValue('ni');
        await fireEvent.compositionEnd(getTextArea(), { target: { value: '你' } });
        expect(change).toHaveBeenCalledTimes(1);
        expect(change.mock.calls[0][0]).toBe('你');
        expect(change.mock.calls[0][1]).toBeInstanceOf(CompositionEvent);
    });

    it('未声明属性与监听器落到原生 textarea，class 与 style 作用于外层容器', async () => {
        const paste = vi.fn<(event: ClipboardEvent) => void>();
        render(TextArea, {
            props: { textareaStyle: { color: 'blue' } },
            attrs: {
                name: 'desc',
                class: 'custom',
                style: { color: 'red' },
                'data-testid': 'desc',
                'aria-label': 'Description',
                tabindex: -1,
                onPaste: paste,
            },
        });
        const textarea = getTextArea();
        expect(screen.getByTestId('desc')).toBe(textarea);
        expect(textarea).toHaveAttribute('aria-label', 'Description');
        expect(textarea).toHaveAttribute('name', 'desc');
        expect(textarea).toHaveAttribute('tabindex', '-1');
        expect(textarea).toHaveStyle({ color: 'rgb(0, 0, 255)' });
        await fireEvent.paste(textarea);
        expect(paste).toHaveBeenCalledTimes(1);
        expect(getWrapper()).toHaveClass('custom');
        for (const attr of ['data-testid', 'aria-label', 'name', 'tabindex']) {
            expect(getWrapper()).not.toHaveAttribute(attr);
        }
    });

    it('autofocus 挂载时聚焦 textarea，不输出原生属性', () => {
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        render(TextArea, { props: { autofocus: true } });
        // Testing Library re-inserts the mounted nodes, which drops jsdom focus; the browser test checks real focus
        expect(focus.mock.contexts).toEqual([getTextArea()]);
        expect(getTextArea()).not.toHaveAttribute('autofocus');
    });

    it('句柄的 focus 与 blur 驱动焦点样式，select 选中文本', async () => {
        const { handle } = renderWithHandle({ defaultValue: 'semi' });
        handle().focus();
        await nextTick();
        expect(getTextArea()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-focus`);
        handle().select();
        expect([getTextArea().selectionStart, getTextArea().selectionEnd]).toEqual([0, 4]);
        handle().blur();
        await nextTick();
        expect(getTextArea()).not.toHaveFocus();
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-textarea-wrapper-focus`);
    });

    it('句柄只包含文档声明的方法与节点', () => {
        const { handle } = renderWithHandle();
        expect(Object.keys(handle()).sort()).toEqual(['blur', 'focus', 'nativeElement', 'select', 'setSelectionRange', 'textarea'].sort());
        for (const method of ['blur', 'focus', 'select', 'setSelectionRange'] as const) {
            expect(typeof handle()[method]).toBe('function');
        }
    });

    it('句柄的 setSelectionRange 移动选区，focus 透传其选项', () => {
        const focus = vi.spyOn(HTMLTextAreaElement.prototype, 'focus');
        const { handle } = renderWithHandle({ defaultValue: 'semi design' });
        handle().setSelectionRange(2, 6, 'backward');
        expect([getTextArea().selectionStart, getTextArea().selectionEnd, getTextArea().selectionDirection]).toEqual([2, 6, 'backward']);
        handle().focus({ preventScroll: true });
        expect(focus).toHaveBeenLastCalledWith({ preventScroll: true });
    });

    it('多次渲染后 autosize 保持句柄稳定', async () => {
        const view = renderWithHandle({ modelValue: 'a', autosize: true });
        const { handle, refFn } = view;
        await view.rerender({ modelValue: 'b', autosize: true });
        expect(new Set(refFn.mock.calls.map(([value]) => value)).size).toBe(1);
        expect(handle().textarea).toBe(getTextArea());
    });

    it('showLineNumber 重新挂载 textarea 后，句柄指向当前挂载的 textarea', async () => {
        const view = renderWithHandle({ defaultValue: 'a' });
        const { handle } = view;
        const mounted = handle();
        const before = getTextArea();
        await view.rerender({ defaultValue: 'a', showLineNumber: true });
        expect(getTextArea()).not.toBe(before);
        expect(handle()).toBe(mounted);
        expect(mounted.textarea).toBe(getTextArea());
        expect(mounted.nativeElement).toBe(getWrapper());
        mounted.focus();
        expect(getTextArea()).toHaveFocus();
    });

    it('resize 属性设置 textarea 样式与外层容器类名', async () => {
        const view = render(TextArea, { props: { resize: 'horizontal' } });
        expect(getTextArea()).toHaveStyle({ resize: 'horizontal' });
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-resizeX`);
        await view.rerender({ resize: 'vertical' });
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-resizeY`);
        await view.rerender({ autosize: true, resize: 'both' });
        expect(getTextArea()).toHaveStyle({ resize: 'none' });
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-textarea-wrapper-resizeX`);
    });

    it('showLineNumber 从 lineNumberStart 开始，每行一个行号，面板对辅助技术隐藏', () => {
        render(TextArea, {
            props: { lineNumberClassName: 'nums', defaultValue: 'a\nb\nc', lineNumberStart: 3, showLineNumber: true },
        });
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-withLineNumber`);
        const items = document.querySelectorAll(`.${prefixCls}-textarea-lineNumber-item`);
        expect([...items].map((item) => item.textContent?.trim())).toEqual(['3', '4', '5']);
        const panel = document.querySelector('.nums');
        expect(panel).toHaveClass(`${prefixCls}-textarea-lineNumber`);
        expect(panel).toHaveAttribute('aria-hidden', 'true');
    });

    it('负数 maxlength 不限制值', async () => {
        const change = vi.fn<Change>();
        render(TextArea, { props: { defaultValue: 'semi', maxlength: -1, onChange: change } });
        await fireEvent.update(getTextArea(), 'semi design');
        await fireEvent.focusOut(getTextArea());
        expect(change.mock.calls.map(([value]) => value)).toEqual(['semi design']);
        expect(getTextArea()).toHaveValue('semi design');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { TextArea: { rows: 2, showCounter: true } };
        const view = render(TextArea, { props: { defaultValue: 'semi' } });
        expect(getTextArea()).toHaveAttribute('rows', '2');
        expect(getCounter()).toHaveTextContent(/^4$/);
        view.unmount();
        render(TextArea, { props: { rows: 6 } });
        expect(getTextArea()).toHaveAttribute('rows', '6');
    });

    it('应用注入的 semiGlobal 默认值', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { TextArea: { rows: 3, showClear: true } };
        render(TextArea, { props: { defaultValue: 'semi' }, global: { provide: { [semiGlobalKey as symbol]: semi } } });
        expect(getTextArea()).toHaveAttribute('rows', '3');
        expect(getClearBtn()).not.toBeNull();
    });
});
