import { createSignal, onMount } from 'solid-js';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { mockResizeObserver } from '@test/utils/solid';
import { type TextAreaChangeEvent, type TextAreaProps, TextArea } from '..';
import semiGlobal from '../../_utils/semi-global';

type Change = NonNullable<TextAreaProps['onChange']>;

const prefixCls = `${BASE_CLASS_PREFIX}-input`;

const getValueLength = (str: string) => [...new Intl.Segmenter().segment(str)].length;

const getTextArea = () => screen.getByRole<HTMLTextAreaElement>('textbox');
const getWrapper = () => document.querySelector(`.${prefixCls}-textarea-wrapper`) as HTMLElement;
const getCounter = () => document.querySelector(`.${prefixCls}-textarea-counter`) as HTMLElement;
const getClearBtn = () => document.querySelector<HTMLElement>(`.${prefixCls}-clearbtn`);
const type = (value: string, init: InputEventInit = {}) => fireEvent.input(getTextArea(), { target: { value }, ...init });

function spyWarn() {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    onTestFinished(() => warn.mockRestore());
    return warn;
}

describe('TextArea', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('非受控时无关属性变化不清空输入的文本', () => {
        const [props, setProps] = createSignal<TextAreaProps>({});
        render(() => <TextArea {...props()} />);
        type('semi');
        setProps({ placeholder: 'name' });
        expect(getTextArea()).toHaveValue('semi');
    });

    it('整体替换 props 时保留 textarea 节点与焦点', () => {
        const [props, setProps] = createSignal<TextAreaProps>({});
        render(() => <TextArea {...props()} />);
        const textarea = getTextArea();
        textarea.focus();
        setProps({ placeholder: 'name' });
        expect(getTextArea()).toBe(textarea);
        expect(textarea).toHaveFocus();
    });

    it('父组件挂载时就把受控 value 改为 undefined，之后输入的文本照常显示', () => {
        function Demo() {
            const [value, setValue] = createSignal<string | undefined>('a');
            onMount(() => setValue(undefined));
            return <TextArea value={value()} />;
        }
        render(() => <Demo />);
        type('q');
        expect(getTextArea()).toHaveValue('q');
    });

    it('观察 textarea 本身，用于 autosize 与原生拖拽缩放手柄', () => {
        const { observed } = mockResizeObserver();
        const [props, setProps] = createSignal<TextAreaProps>({ autosize: true });
        render(() => <TextArea {...props()} />);
        expect(observed()).toEqual([getTextArea()]);
        setProps({ resize: 'vertical' });
        expect(observed()).toEqual([getTextArea()]);
    });

    it('class 与 style 落在外层容器', () => {
        render(() => <TextArea class="test" style={{ color: 'red' }} />);
        expect(getWrapper()).toHaveClass('test');
        expect(getWrapper()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('defaultValue', () => {
        render(() => <TextArea defaultValue="semi" />);
        expect(getTextArea()).toHaveValue('semi');
    });

    it('值变化时触发 onChange', () => {
        const onChange = vi.fn<Change>();
        render(() => <TextArea onChange={onChange} />);
        type('semi');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('semi');
        expect(getTextArea()).toHaveValue('semi');
    });

    it('显示 maxCount', () => {
        const [value, setValue] = createSignal<string>();
        render(() => <TextArea value={value()} maxCount={10} />);
        expect(getCounter()).toHaveTextContent(/^0\/10$/);
        setValue('semi');
        expect(getCounter()).toHaveTextContent(/^4\/10$/);
    });

    it('placeholder', () => {
        render(() => <TextArea placeholder="semi placeholder" />);
        expect(screen.getByPlaceholderText('semi placeholder')).toBe(getTextArea());
    });

    it('禁用状态', () => {
        render(() => <TextArea disabled />);
        expect(getTextArea()).toHaveClass(`${prefixCls}-textarea-disabled`);
        expect(getTextArea()).toBeDisabled();
    });

    it('showClear / onClear', async () => {
        const onClear = vi.fn<NonNullable<TextAreaProps['onClear']>>();
        render(() => <TextArea defaultValue="123" showClear onClear={onClear} />);
        await userEvent.click(getClearBtn() as HTMLElement);
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getTextArea()).toHaveValue('');
        expect(getClearBtn()).toBeNull();
    });

    it('onEnterPress', () => {
        const onEnterPress = vi.fn<NonNullable<TextAreaProps['onEnterPress']>>();
        render(() => <TextArea onEnterPress={onEnterPress} />);
        fireEvent.keyDown(getTextArea(), { key: 'a' });
        expect(onEnterPress).not.toHaveBeenCalled();
        fireEvent.keyDown(getTextArea(), { key: 'Enter' });
        expect(onEnterPress).toHaveBeenCalledTimes(1);
    });

    it('受控模式', () => {
        const onChange = vi.fn<Change>();
        const [value, setValue] = createSignal('semi');
        render(() => <TextArea value={value()} onChange={onChange} />);
        expect(getTextArea()).toHaveValue('semi');
        type('vita lemon');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('vita lemon');
        expect(getTextArea()).toHaveValue('semi');
        setValue('vita lemon');
        expect(getTextArea()).toHaveValue('vita lemon');
    });

    it('超出 maxCount', () => {
        const defaultValue = '💖💖💖💖💖💖💖💖💖💖';
        const [measure, setMeasure] = createSignal<TextAreaProps['getValueLength']>();
        render(() => <TextArea defaultValue={defaultValue} getValueLength={measure()} maxCount={10} />);
        expect(getCounter()).toHaveClass(`${prefixCls}-textarea-counter-exceed`);
        expect(getCounter()).toHaveTextContent(/^20\/10$/);
        setMeasure(() => getValueLength);
        expect(getCounter()).not.toHaveClass(`${prefixCls}-textarea-counter-exceed`);
        expect(getCounter()).toHaveTextContent(/^10\/10$/);
    });

    it('超出 maxCount 时对辅助技术标记为无效，回到范围内后取消', () => {
        const [value, setValue] = createSignal('abcd');
        render(() => <TextArea value={value()} maxCount={3} />);
        expect(getTextArea()).toHaveAttribute('aria-invalid', 'true');
        setValue('abc');
        expect(getTextArea()).not.toHaveAttribute('aria-invalid');
    });

    it('minLength', () => {
        const inputValue = '💖💖💖';
        const inputValue1 = '💖💖💖💖';
        const onChange = vi.fn<Change>();
        render(() => <TextArea minLength={4} getValueLength={getValueLength} onChange={onChange} />);
        type(inputValue);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe(inputValue);
        expect(getTextArea()).toHaveAttribute('minlength', String(inputValue.length + (4 - getValueLength(inputValue))));
        type(inputValue1);
        expect(onChange.mock.calls[1][0]).toBe(inputValue1);
        expect(getTextArea()).toHaveAttribute('minlength', '4');
    });

    it('同时设置 maxLength 与 minLength 时，输入后仍调整原生 minlength', () => {
        const inputValue = '💖💖💖';
        render(() => <TextArea maxLength={10} minLength={4} getValueLength={getValueLength} />);
        type(inputValue);
        expect(getTextArea()).toHaveAttribute('minlength', String(inputValue.length + (4 - getValueLength(inputValue))));
    });

    it('minLength 属性变化后，原生 minlength 随之变化', () => {
        const [minLength, setMinLength] = createSignal(5);
        render(() => <TextArea minLength={minLength()} />);
        expect(getTextArea()).toHaveAttribute('minlength', '5');
        setMinLength(2);
        expect(getTextArea()).toHaveAttribute('minlength', '2');
    });

    it('传 getValueLength 时，原生 minlength 按当前值换算，不等下一次输入', () => {
        const value = '💖💖';
        const [minLength, setMinLength] = createSignal(4);
        render(() => <TextArea minLength={minLength()} value={value} getValueLength={getValueLength} />);
        expect(getTextArea()).toHaveAttribute('minlength', String(value.length + 2));
        setMinLength(3);
        expect(getTextArea()).toHaveAttribute('minlength', String(value.length + 1));
    });

    it('受控值超过 maxLength 时只聚焦再失焦，不触发 onChange', () => {
        const onChange = vi.fn<Change>();
        render(() => <TextArea maxLength={3} value="abcdef" onChange={onChange} />);
        fireEvent.focusIn(getTextArea());
        fireEvent.focusOut(getTextArea());
        expect(onChange).not.toHaveBeenCalled();
        expect(getTextArea()).toHaveValue('abcdef');
    });

    it('maxLength 与 getValueLength 配合截断', () => {
        const truncate = (inputValue: string, maxLength: number) => {
            const onChange = vi.fn<Change>();
            const { unmount } = render(() => <TextArea maxLength={maxLength} getValueLength={getValueLength} onChange={onChange} />);
            type(inputValue);
            expect(onChange).toHaveBeenCalledTimes(1);
            const value = getTextArea().value;
            unmount();
            return value;
        };
        const cases: [string, number, string][] = [
            ['Semi', 5, 'Semi'],
            ['Semi Design', 4, 'Semi'],
            ['💖💖💖💖💖💖💖💖💖💖👨👩👧👦', 10, '💖💖💖💖💖💖💖💖💖💖'],
            ['💖', -1, '💖'],
            ['🆗', 1, '🆗'],
        ];
        for (const [value, length, result] of cases) {
            expect(truncate(value, length)).toBe(result);
        }
    });

    it('截断时 getValueLength 的调用次数按二分查找', () => {
        const truncate = (inputValue: string, maxLength: number) => {
            const measure = vi.fn<(value: string) => number>(getValueLength);
            const { unmount } = render(() => <TextArea maxLength={maxLength} getValueLength={measure} />);
            measure.mockClear();
            type(inputValue);
            // one call to detect the overflow, then log2(n) calls to binary-search the cut point
            expect(measure.mock.calls.length).toBeLessThanOrEqual(1 + Math.ceil(Math.log2(inputValue.length)));
            expect(getValueLength(getTextArea().value)).toBe(maxLength);
            unmount();
        };
        truncate('Semi Design', 4);
        truncate(Array.from({ length: 1000 }).fill('👨‍👩‍👧‍👦').join(''), 500);
    });

    it('onCompositionStart、onCompositionEnd、onCompositionUpdate 回调', () => {
        const onCompositionStart = vi.fn<(e: CompositionEvent) => void>();
        const onCompositionEnd = vi.fn<(e: CompositionEvent) => void>();
        const onCompositionUpdate = vi.fn<(e: CompositionEvent) => void>();
        render(() => <TextArea onCompositionEnd={onCompositionEnd} onCompositionStart={onCompositionStart} onCompositionUpdate={onCompositionUpdate} />);
        fireEvent.compositionStart(getTextArea(), { data: 'test' });
        fireEvent.compositionUpdate(getTextArea(), { data: 'test' });
        fireEvent.compositionEnd(getTextArea(), { data: 'test' });
        expect(onCompositionStart).toHaveBeenCalledTimes(1);
        expect(onCompositionUpdate).toHaveBeenCalledTimes(1);
        expect(onCompositionEnd).toHaveBeenCalledTimes(1);
    });

    it('onFocus 回调', async () => {
        const onFocus = vi.fn<NonNullable<TextAreaProps['onFocus']>>();
        render(() => <TextArea onFocus={onFocus} />);
        await userEvent.click(getTextArea());
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-focus`);
    });

    it('onBlur 回调', async () => {
        const onBlur = vi.fn<NonNullable<TextAreaProps['onBlur']>>();
        render(() => <TextArea onBlur={onBlur} />);
        await userEvent.click(getTextArea());
        expect(onBlur).not.toHaveBeenCalled();
        await userEvent.tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-textarea-wrapper-focus`);
    });

    it('readonly 属性', () => {
        render(() => <TextArea defaultValue="readonly text" readonly />);
        expect(getTextArea()).toHaveAttribute('readonly');
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-readonly`);
    });

    it('原生 readOnly 落到 textarea 上，不能编辑', async () => {
        render(() => <TextArea defaultValue="semi" readOnly />);
        expect(getTextArea()).toHaveAttribute('readonly');
        await userEvent.type(getTextArea(), 'abc');
        expect(getTextArea()).toHaveValue('semi');
    });

    it('borderless 属性', () => {
        render(() => <TextArea borderless />);
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-borderless`);
    });

    it('报错时对辅助技术标记为无效，与 Input 一致', () => {
        const [props, setProps] = createSignal<TextAreaProps>({ validateStatus: 'error' });
        render(() => <TextArea {...props()} />);
        expect(getTextArea()).toHaveAttribute('aria-invalid', 'true');
        setProps({ validateStatus: 'warning' });
        expect(getTextArea()).not.toHaveAttribute('aria-invalid');
        setProps({ 'aria-invalid': 'true' });
        expect(getTextArea()).toHaveAttribute('aria-invalid', 'true');
    });

    it('不同 validateStatus 的表现', () => {
        render(() => (
            <>
                <TextArea validateStatus="warning" />
                <TextArea validateStatus="error" />
            </>
        ));
        const [warning, error] = document.querySelectorAll(`.${prefixCls}-textarea-wrapper`);
        expect(warning).toHaveClass(`${prefixCls}-textarea-wrapper-warning`);
        expect(error).toHaveClass(`${prefixCls}-textarea-wrapper-error`);
    });

    it('onKeyDown 回调', () => {
        const onKeyDown = vi.fn<(e: KeyboardEvent) => void>();
        render(() => <TextArea onKeyDown={onKeyDown} />);
        fireEvent.keyDown(getTextArea(), { key: 'a' });
        expect(onKeyDown).toHaveBeenCalledTimes(1);
    });

    it('rows 属性', () => {
        render(() => <TextArea rows={5} />);
        expect(getTextArea()).toHaveAttribute('rows', '5');
    });

    it('ref 收到外层容器，textareaRef 收到原生 textarea', () => {
        let root: HTMLDivElement | undefined;
        let textarea: HTMLTextAreaElement | undefined;
        render(() => <TextArea ref={(node) => (root = node)} textareaRef={(node) => (textarea = node)} />);
        expect(root).toBe(getWrapper());
        expect(textarea).toBe(getTextArea());
    });

    it('showLineNumber 重新挂载 textarea 后，textareaRef 收到新节点', () => {
        const textareaRef = vi.fn<(node: HTMLTextAreaElement) => void>();
        const [showLineNumber, setShowLineNumber] = createSignal(false);
        render(() => <TextArea defaultValue="a" showLineNumber={showLineNumber()} textareaRef={textareaRef} />);
        const before = getTextArea();
        setShowLineNumber(true);
        expect(getTextArea()).not.toBe(before);
        expect(getTextArea()).toHaveValue('a');
        expect(textareaRef).toHaveBeenLastCalledWith(getTextArea());
    });

    it('不带 maxCount 时的 showCounter', () => {
        render(() => <TextArea defaultValue="test" showCounter />);
        expect(getCounter()).toHaveTextContent(/^4$/);
        expect(getCounter()).not.toHaveClass(`${prefixCls}-textarea-counter-exceed`);
    });

    it('autosize 的行数写入自定义属性：minRows 缺省取 rows，maxRows 缺省不设', () => {
        const minVar = `--${prefixCls}-textarea-min-rows`;
        const maxVar = `--${prefixCls}-textarea-max-rows`;
        const [props, setProps] = createSignal<TextAreaProps>({ autosize: { minRows: 2, maxRows: 6 } });
        render(() => <TextArea {...props()} />);
        expect(getTextArea()).toHaveClass(`${prefixCls}-textarea-autosize`);
        expect(getTextArea()).toHaveStyle({ resize: 'none' });
        expect(getTextArea().style.getPropertyValue(minVar)).toBe('2');
        expect(getTextArea().style.getPropertyValue(maxVar)).toBe('6');
        setProps({ autosize: true, rows: 3 });
        expect(getTextArea().style.getPropertyValue(minVar)).toBe('3');
        expect(getTextArea().style.getPropertyValue(maxVar)).toBe('');
        setProps({ autosize: false });
        expect(getTextArea()).not.toHaveClass(`${prefixCls}-textarea-autosize`);
        expect(getTextArea().style.getPropertyValue(minVar)).toBe('');
    });

    it('卸载时取消节流的 resize', () => {
        const { unmount } = render(() => <TextArea defaultValue="test" autosize />);
        expect(() => unmount()).not.toThrow();
        expect(screen.queryByRole('textbox')).toBeNull();
    });

    it('非受控 TextArea 保留用户输入的内容', async () => {
        const onChange = vi.fn<Change>();
        render(() => <TextArea defaultValue="a" onChange={onChange} />);
        await userEvent.type(getTextArea(), 'b');
        expect(getTextArea()).toHaveValue('ab');
        expect(onChange.mock.calls[0][0]).toBe('ab');
        expect((onChange.mock.calls[0][1] as InputEvent).target).toBe(getTextArea());
    });

    it('受控值恢复为 undefined（表单重置）时清空 TextArea', () => {
        const [value, setValue] = createSignal<string | undefined>('semi');
        render(() => <TextArea value={value()} />);
        setValue(undefined);
        expect(getTextArea()).toHaveValue('');
    });

    it('Form 注入的 validateStatus、insetLabel 不落到 DOM', () => {
        // Form injects these into every field, including ones that do not declare them
        const injected = { insetLabel: 'Desc', insetLabelId: 'label' } as TextAreaProps;
        render(() => <TextArea id="desc" validateStatus="error" {...injected} />);
        expect(getTextArea()).toHaveAttribute('id', 'desc');
        for (const attr of ['insetlabel', 'insetlabelid', 'validatestatus']) {
            expect(getTextArea()).not.toHaveAttribute(attr);
            expect(getWrapper()).not.toHaveAttribute(attr);
        }
    });

    it('清空已聚焦的 TextArea 时报告 change 与 clear，保持焦点，点击留在组件内', async () => {
        const onBlur = vi.fn<NonNullable<TextAreaProps['onBlur']>>();
        const onChange = vi.fn<Change>();
        const onClear = vi.fn<NonNullable<TextAreaProps['onClear']>>();
        const onOuterClick = vi.fn<() => void>();
        render(() => <TextArea defaultValue="semi" showClear onBlur={onBlur} onChange={onChange} onClear={onClear} />);
        await userEvent.click(getTextArea());
        document.body.addEventListener('click', onOuterClick);
        onTestFinished(() => document.body.removeEventListener('click', onOuterClick));
        await userEvent.click(getClearBtn() as HTMLElement);
        expect(onBlur).not.toHaveBeenCalled();
        expect(onChange).toHaveBeenLastCalledWith('', expect.anything());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onOuterClick).not.toHaveBeenCalled();
        expect(getTextArea()).toHaveValue('');
        expect(getTextArea()).toHaveFocus();
    });

    it.each(['{Enter}', ' '])('Tab 可以到达具名的清空按钮，%s 清空后焦点回到 textarea', async (key) => {
        const onClear = vi.fn<NonNullable<TextAreaProps['onClear']>>();
        render(() => <TextArea defaultValue="semi" showClear onClear={onClear} />);
        await userEvent.click(getTextArea());
        await userEvent.tab();
        const clear = screen.getByRole('button', { name: zh_CN.Input.clear });
        expect(clear).toHaveFocus();
        expect(clear).toHaveAttribute('type', 'button');
        await userEvent.keyboard(key);
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getTextArea()).toHaveValue('');
        expect(getTextArea()).toHaveFocus();
    });

    it('disabled 或 readonly 时不显示清空按钮', () => {
        const [props, setProps] = createSignal<TextAreaProps>({ disabled: true });
        render(() => <TextArea defaultValue="semi" showClear {...props()} />);
        expect(getClearBtn()).toBeNull();
        setProps({ readonly: true });
        expect(getClearBtn()).toBeNull();
        expect(getTextArea()).toHaveClass(`${prefixCls}-textarea-showClear`);
    });

    it('disabledEnterStartNewLine 阻止 Enter 但不阻止 Shift+Enter', () => {
        const onEnterPress = vi.fn<NonNullable<TextAreaProps['onEnterPress']>>();
        render(() => <TextArea disabledEnterStartNewLine onEnterPress={onEnterPress} />);
        expect(fireEvent.keyDown(getTextArea(), { key: 'Enter' })).toBe(false);
        expect(fireEvent.keyDown(getTextArea(), { key: 'Enter', shiftKey: true })).toBe(true);
        expect(onEnterPress).toHaveBeenCalledTimes(2);
        expect(getTextArea()).not.toHaveAttribute('disabledenterstartnewline');
    });

    it('点击计数器或外层容器时聚焦 TextArea，禁用时除外', () => {
        const { unmount } = render(() => <TextArea defaultValue="semi" showCounter />);
        fireEvent.click(getCounter());
        expect(getTextArea()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-focus`);
        unmount();
        render(() => <TextArea defaultValue="semi" disabled showCounter />);
        fireEvent.click(getWrapper());
        fireEvent.click(getCounter());
        expect(getTextArea()).not.toHaveFocus();
    });

    it('未设置 getValueLength 时，输入法残留多余文本则在失焦时按 maxLength 截断', () => {
        const onChange = vi.fn<Change>();
        spyWarn();
        render(() => <TextArea maxLength={2} onChange={onChange} />);
        expect(getTextArea()).toHaveAttribute('maxlength', '2');
        fireEvent.compositionStart(getTextArea());
        type('abc');
        fireEvent.focusOut(getTextArea());
        expect(onChange.mock.calls.at(-1)?.[0]).toBe('ab');
        expect(getTextArea()).toHaveValue('ab');
    });

    it('composition 受控且父组件拒绝组合结果时，组合结束后恢复为属性值', () => {
        render(() => <TextArea value="" composition onChange={() => {}} />);
        fireEvent.compositionStart(getTextArea());
        type('ni', { isComposing: true });
        fireEvent.compositionEnd(getTextArea(), { target: { value: '你' } });
        expect(getTextArea()).toHaveValue('');
    });

    it('输入法组合模式下，组合结束后只报告一次，并显示组合中的文本', () => {
        const onChange = vi.fn<Change>();
        render(() => <TextArea value="" composition onChange={onChange} />);
        fireEvent.compositionStart(getTextArea());
        type('ni', { isComposing: true });
        expect(onChange).not.toHaveBeenCalled();
        expect(getTextArea()).toHaveValue('ni');
        fireEvent.compositionEnd(getTextArea(), { target: { value: '你' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('你');
    });

    it('未知属性与 aria 属性透传到原生 textarea，class 与 style 作用于外层容器', () => {
        render(() => <TextArea name="desc" class="custom" style={{ color: 'red' }} textareaStyle={{ color: 'blue' }} data-testid="desc" aria-label="Description" tabIndex={-1} />);
        const textarea = getTextArea();
        expect(screen.getByTestId('desc')).toBe(textarea);
        expect(textarea).toHaveAttribute('aria-label', 'Description');
        expect(textarea).toHaveAttribute('name', 'desc');
        expect(textarea).toHaveAttribute('tabindex', '-1');
        expect(textarea).toHaveStyle({ color: 'rgb(0, 0, 255)' });
        expect(getWrapper()).toHaveClass('custom');
        for (const attr of ['data-testid', 'aria-label', 'name', 'tabindex']) {
            expect(getWrapper()).not.toHaveAttribute(attr);
        }
    });

    it('autofocus 在挂载时聚焦 TextArea，不输出原生属性', () => {
        render(() => <TextArea autofocus />);
        expect(getTextArea()).toHaveFocus();
        expect(getTextArea()).not.toHaveAttribute('autofocus');
    });

    it('resize 属性设置 textarea 样式与外层容器类名', () => {
        const [props, setProps] = createSignal<TextAreaProps>({ resize: 'horizontal' });
        render(() => <TextArea {...props()} />);
        expect(getTextArea()).toHaveStyle({ resize: 'horizontal' });
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-resizeX`);
        setProps({ resize: 'vertical' });
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-resizeY`);
        setProps({ autosize: true, resize: 'both' });
        expect(getTextArea()).toHaveStyle({ resize: 'none' });
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-textarea-wrapper-resizeX`);
    });

    it('showLineNumber 从 lineNumberStart 开始，每行渲染一个行号', () => {
        render(() => <TextArea lineNumberClassName="nums" defaultValue={'a\nb\nc'} lineNumberStart={3} showLineNumber />);
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-withLineNumber`);
        const items = document.querySelectorAll(`.${prefixCls}-textarea-lineNumber-item`);
        expect([...items].map((item) => item.textContent)).toEqual(['3', '4', '5']);
        expect(document.querySelector('.nums')).toHaveClass(`${prefixCls}-textarea-lineNumber`);
    });

    it('行号面板对辅助技术隐藏', () => {
        render(() => <TextArea defaultValue={'a\nb'} showLineNumber />);
        expect(document.querySelector(`.${prefixCls}-textarea-lineNumber`)).toHaveAttribute('aria-hidden', 'true');
    });

    it('计数器经 aria-describedby 关联到 textarea', () => {
        render(() => <TextArea defaultValue="abcd" maxCount={3} />);
        expect(getTextArea()).toHaveAccessibleDescription('4/3');
    });

    it('指针点击清除按钮时焦点不被抢进 textarea，键盘激活时交还', async () => {
        const user = userEvent.setup();
        render(() => (
            <>
                <button type="button">other</button>
                <TextArea defaultValue="semi" showClear />
            </>
        ));
        const other = screen.getByRole('button', { name: 'other' });
        other.focus();
        await user.click(getClearBtn() as HTMLElement);
        expect(other).toHaveFocus();
        await user.type(getTextArea(), 'a');
        (getClearBtn() as HTMLElement).focus();
        await user.keyboard('{Enter}');
        expect(getTextArea()).toHaveFocus();
    });

    it('每次按键只报告一次', async () => {
        const onChange = vi.fn<Change>();
        render(() => <TextArea onChange={onChange} />);
        await userEvent.type(getTextArea(), 'ab');
        expect(onChange.mock.calls.map(([value]) => value)).toEqual(['a', 'ab']);
        expect(getTextArea()).toHaveValue('ab');
    });

    it('负数 maxLength 不限制值', () => {
        const onChange = vi.fn<Change>();
        render(() => <TextArea defaultValue="semi" maxLength={-1} onChange={onChange} />);
        type('semi design');
        fireEvent.focusOut(getTextArea());
        expect(onChange.mock.calls.map(([value]) => value)).toEqual(['semi design']);
        expect(getTextArea()).toHaveValue('semi design');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { TextArea: { rows: 2, showCounter: true } };
        const { unmount } = render(() => <TextArea defaultValue="semi" />);
        expect(getTextArea()).toHaveAttribute('rows', '2');
        expect(getCounter()).toHaveTextContent(/^4$/);
        unmount();
        render(() => <TextArea rows={6} />);
        expect(getTextArea()).toHaveAttribute('rows', '6');
    });

    it('onChange 的事件类型涵盖清除按钮、输入法结束和失焦截断', async () => {
        const onChange = vi.fn<Change>();
        render(() => <TextArea defaultValue="semi" showClear onChange={onChange} />);
        await userEvent.click(getClearBtn() as HTMLElement);
        expect(onChange).toHaveBeenCalledWith('', expect.objectContaining({ type: 'click' }));
        expectTypeOf<MouseEvent>().toExtend<TextAreaChangeEvent>();
        expectTypeOf<CompositionEvent & { currentTarget: HTMLTextAreaElement; target: Element }>().toExtend<TextAreaChangeEvent>();
        expectTypeOf<FocusEvent>().toExtend<TextAreaChangeEvent>();
    });

    it('不声明从不调用的 onPressEnter，回车入口只有 onEnterPress', () => {
        expectTypeOf<TextAreaProps>().not.toHaveProperty('onPressEnter');
        expectTypeOf<TextAreaProps>().toHaveProperty('onEnterPress');
    });

    it('ref 的 focus 聚焦原生 textarea，blur 释放焦点', () => {
        let ref!: HTMLDivElement;
        render(() => <TextArea ref={(node) => (ref = node)} />);
        ref.focus();
        expect(getTextArea()).toHaveFocus();
        ref.blur();
        expect(document.body).toHaveFocus();
    });
});
