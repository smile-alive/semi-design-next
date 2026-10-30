import { createRef, StrictMode } from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import truncateValue from '@fibrae/semi-foundation/input/util/truncate-value';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { Form } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import { mockResizeObserver } from '@test/utils/react';
import TextArea, { type TextAreaChangeEvent, type TextAreaHandle, type TextAreaProps } from '../textarea';

const prefixCls = `${BASE_CLASS_PREFIX}-input`;

function getValueLength(str) {
    if (typeof str === 'string') {
        return [...new Intl.Segmenter().segment(str)].length;
    } else {
        return -1;
    }
}

const getTextArea = () => screen.getByRole<HTMLTextAreaElement>('textbox');
const getWrapper = () => document.querySelector(`.${prefixCls}-textarea-wrapper`);
const getCounter = () => document.querySelector(`.${prefixCls}-textarea-counter`);
const getClearBtn = () => document.querySelector(`.${prefixCls}-clearbtn`);

describe('TextArea', () => {
    it('观察 textarea 本身，用于 autosize 与原生拖拽缩放手柄', () => {
        const { observed } = mockResizeObserver();
        const { rerender } = render(<TextArea autosize />);
        expect(observed()).toEqual([getTextArea()]);

        rerender(<TextArea resize="vertical" />);
        expect(observed()).toEqual([getTextArea()]);
    });

    it('自定义 className 与 style 的 TextArea', () => {
        render(<TextArea className="test" style={{ color: 'red' }} />);
        expect(getWrapper()).toHaveClass('test');
        expect(getWrapper()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('TextArea defaultValue', () => {
        render(<TextArea defaultValue="semi" />);
        expect(getTextArea()).toHaveValue('semi');
    });

    it('值变化时触发 TextArea 的 onChange', () => {
        const onChange = vi.fn<NonNullable<TextAreaProps['onChange']>>();
        render(<TextArea onChange={onChange} />);
        fireEvent.change(getTextArea(), { target: { value: 'semi' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('semi');
        expect(getTextArea()).toHaveValue('semi');
    });

    it('显示 maxCount', () => {
        const { rerender } = render(<TextArea maxCount={10} />);
        expect(getCounter()).toHaveTextContent(/^0\/10$/);
        rerender(<TextArea value="semi" maxCount={10} />);
        expect(getCounter()).toHaveTextContent(/^4\/10$/);
    });

    it('带 placeholder 的 TextArea', () => {
        const placeholderText = 'semi placeholder';
        render(<TextArea placeholder={placeholderText} />);
        expect(screen.getByPlaceholderText(placeholderText)).toBe(getTextArea());
    });

    it('禁用状态的 TextArea', () => {
        render(<TextArea disabled />);
        expect(getTextArea()).toHaveClass(`${prefixCls}-textarea-disabled`);
        expect(getTextArea()).toBeDisabled();
    });

    it('showClear / onClear', async () => {
        const onClear = vi.fn<NonNullable<TextAreaProps['onClear']>>();
        render(<TextArea defaultValue="123" showClear onClear={onClear} />);
        await userEvent.click(getClearBtn());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getTextArea()).toHaveValue('');
        expect(getClearBtn()).toBeNull();
    });

    it('onEnterPress', () => {
        const onEnterPress = vi.fn<NonNullable<TextAreaProps['onEnterPress']>>();
        render(<TextArea onEnterPress={onEnterPress} />);
        fireEvent.keyDown(getTextArea(), { key: 'a' });
        expect(onEnterPress).not.toHaveBeenCalled();
        fireEvent.keyDown(getTextArea(), { key: 'Enter' });
        expect(onEnterPress).toHaveBeenCalledTimes(1);
    });

    it('受控模式', () => {
        const onChange = vi.fn<NonNullable<TextAreaProps['onChange']>>();
        const { rerender } = render(<TextArea value="semi" onChange={onChange} />);
        expect(getTextArea()).toHaveValue('semi');
        const newValue = 'vita lemon';
        fireEvent.change(getTextArea(), { target: { value: newValue } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe(newValue);
        expect(getTextArea()).toHaveValue('semi');
        rerender(<TextArea value={newValue} onChange={onChange} />);
        expect(getTextArea()).toHaveValue(newValue);
    });

    it('超出 maxCount', () => {
        const defaultValue = '💖💖💖💖💖💖💖💖💖💖';
        const { rerender } = render(<TextArea defaultValue={defaultValue} maxCount={10} />);
        expect(getCounter()).toHaveClass(`${prefixCls}-textarea-counter-exceed`);
        expect(getCounter()).toHaveTextContent(/^20\/10$/);
        rerender(<TextArea defaultValue={defaultValue} getValueLength={getValueLength} maxCount={10} />);
        expect(getCounter()).not.toHaveClass(`${prefixCls}-textarea-counter-exceed`);
        expect(getCounter()).toHaveTextContent(/^10\/10$/);
    });

    it('minLength', () => {
        const inputValue = '💖💖💖';
        const inputValue1 = '💖💖💖💖';
        const minLength = 4;
        const onChange = vi.fn<NonNullable<TextAreaProps['onChange']>>();
        render(<TextArea minLength={minLength} getValueLength={getValueLength} onChange={onChange} />);

        fireEvent.change(getTextArea(), { target: { value: inputValue } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe(inputValue);
        expect(getTextArea()).toHaveAttribute('minlength', String(inputValue.length + (minLength - getValueLength(inputValue))));

        fireEvent.change(getTextArea(), { target: { value: inputValue1 } });
        expect(onChange.mock.calls[1][0]).toBe(inputValue1);
        expect(getTextArea()).toHaveAttribute('minlength', String(minLength));
    });

    it('同时设置 maxLength 与 minLength 时，输入后仍调整原生 minlength', () => {
        const inputValue = '💖💖💖';
        const minLength = 4;
        render(<TextArea maxLength={10} minLength={minLength} getValueLength={getValueLength} />);
        fireEvent.change(getTextArea(), { target: { value: inputValue } });
        expect(getTextArea()).toHaveAttribute('minlength', String(inputValue.length + (minLength - getValueLength(inputValue))));
    });

    it('minLength 属性变化后，原生 minlength 随之变化', () => {
        const { rerender } = render(<TextArea minLength={5} />);
        expect(getTextArea()).toHaveAttribute('minlength', '5');
        rerender(<TextArea minLength={2} />);
        expect(getTextArea()).toHaveAttribute('minlength', '2');
    });

    it('传 getValueLength 时，原生 minlength 按当前值换算，不等下一次输入', () => {
        const value = '💖💖';
        const { rerender } = render(<TextArea minLength={4} value={value} getValueLength={getValueLength} />);
        expect(getTextArea()).toHaveAttribute('minlength', String(value.length + 2));
        rerender(<TextArea minLength={3} value={value} getValueLength={getValueLength} />);
        expect(getTextArea()).toHaveAttribute('minlength', String(value.length + 1));
    });

    it('受控值超过 maxLength 时只聚焦再失焦，不触发 onChange', () => {
        const onChange = vi.fn<NonNullable<TextAreaProps['onChange']>>();
        render(<TextArea maxLength={3} value="abcdef" onChange={onChange} />);
        fireEvent.focus(getTextArea());
        fireEvent.blur(getTextArea());
        expect(onChange).not.toHaveBeenCalled();
        expect(getTextArea()).toHaveValue('abcdef');
    });

    it('maxLength 与 truncateValue 配合', () => {
        const truncateValue = (inputValue, maxLength, getValueLength) => {
            const onChange = vi.fn<NonNullable<TextAreaProps['onChange']>>();
            const { unmount } = render(<TextArea maxLength={maxLength} getValueLength={getValueLength} onChange={onChange} />);
            fireEvent.change(getTextArea(), { target: { value: inputValue } });
            expect(onChange).toHaveBeenCalledTimes(1);
            const value = getTextArea().value;
            unmount();
            return value;
        };

        const testCases = [
            ['Semi', 5, getValueLength, 'Semi'],
            ['Semi Design', 4, getValueLength, 'Semi'],
            ['💖💖💖💖💖💖💖💖💖💖👨👩👧👦', 10, getValueLength, '💖💖💖💖💖💖💖💖💖💖'],
            ['💖', -1, getValueLength, '💖'],
            ['🆗', 1, getValueLength, '🆗'],
        ];

        for (let [value, length, fc, result] of testCases) {
            expect(truncateValue(value, length, fc)).toBe(result);
        }
    });

    it('truncateValue', () => {
        expect(truncateValue({ value: 'Semi Design', getValueLength, maxLength: 4 })).toBe('Semi');
        expect(truncateValue({ value: 'Semi', getValueLength, maxLength: 4 })).toBe('Semi');
        expect(truncateValue({ value: 'Se', getValueLength, maxLength: 1 })).toBe('S');
        expect(truncateValue({ value: 'S', getValueLength, maxLength: 2 })).toBe('S');
        expect(truncateValue({ value: '', getValueLength, maxLength: 2 })).toBe('');

        expect(truncateValue({ value: '💖💖💖💖💖', getValueLength, maxLength: 4 })).toBe('💖💖💖💖');
        expect(truncateValue({ value: '💖💖💖💖', getValueLength, maxLength: 4 })).toBe('💖💖💖💖');
        expect(truncateValue({ value: '💖', getValueLength, maxLength: 1 })).toBe('💖');
    });

    it('truncateValue 函数的调用时机', () => {
        const truncateValue = (inputValue, maxLength) => {
            const spyGetValueLength = vi.fn<NonNullable<TextAreaProps['getValueLength']>>((str) => {
                if (typeof str === 'string') {
                    return [...new Intl.Segmenter().segment(str)].length;
                } else {
                    return 0;
                }
            });

            const { unmount } = render(<TextArea maxLength={maxLength} getValueLength={spyGetValueLength} />);
            fireEvent.change(getTextArea(), { target: { value: inputValue } });
            // one call to detect the overflow, then log2(n) calls to binary-search the cut point
            const expectedValue = 1 + Math.ceil(Math.log2(inputValue.length));
            expect(spyGetValueLength.mock.calls.length).toBeLessThanOrEqual(expectedValue);
            const value = getTextArea().value;
            expect(spyGetValueLength(value)).toBe(maxLength);
            unmount();
            return value;
        };

        const testCases = [
            ['Semi Design', 4],
            [Array.from({ length: 1000 }).fill('👨‍👩‍👧‍👦').join(''), 500],
        ];

        for (let [value, length] of testCases) {
            truncateValue(value, length);
        }
    });

    it('onCompositionStart 回调', () => {
        const onCompositionStart = vi.fn<NonNullable<TextAreaProps['onCompositionStart']>>();
        render(<TextArea onCompositionStart={onCompositionStart} />);
        fireEvent.compositionStart(getTextArea(), { data: 'test' });
        expect(onCompositionStart).toHaveBeenCalledTimes(1);
    });

    it('onCompositionEnd 回调', () => {
        const onCompositionEnd = vi.fn<NonNullable<TextAreaProps['onCompositionEnd']>>();
        render(<TextArea onCompositionEnd={onCompositionEnd} />);
        fireEvent.compositionEnd(getTextArea(), { data: 'test' });
        expect(onCompositionEnd).toHaveBeenCalledTimes(1);
    });

    it('onCompositionUpdate 回调', () => {
        const onCompositionUpdate = vi.fn<NonNullable<TextAreaProps['onCompositionUpdate']>>();
        render(<TextArea onCompositionUpdate={onCompositionUpdate} />);
        fireEvent.compositionUpdate(getTextArea(), { data: 'test' });
        expect(onCompositionUpdate).toHaveBeenCalledTimes(1);
    });

    it('TextArea 的 onFocus 回调', async () => {
        const onFocus = vi.fn<NonNullable<TextAreaProps['onFocus']>>();
        render(<TextArea onFocus={onFocus} />);
        await userEvent.click(getTextArea());
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-focus`);
    });

    it('TextArea 的 onBlur 回调', async () => {
        const onBlur = vi.fn<NonNullable<TextAreaProps['onBlur']>>();
        render(<TextArea onBlur={onBlur} />);
        await userEvent.click(getTextArea());
        expect(onBlur).not.toHaveBeenCalled();
        await userEvent.tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-textarea-wrapper-focus`);
    });

    it('readonly 属性', () => {
        render(<TextArea defaultValue="readonly text" readonly />);
        expect(getTextArea()).toHaveAttribute('readonly');
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-readonly`);
    });

    it('原生 readOnly 落到 textarea 上，不能编辑', async () => {
        render(<TextArea defaultValue="semi" readOnly />);
        expect(getTextArea()).toHaveAttribute('readonly');
        await userEvent.type(getTextArea(), 'abc');
        expect(getTextArea()).toHaveValue('semi');
    });

    it('borderless 属性', () => {
        render(<TextArea borderless />);
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-borderless`);
    });

    it('报错时对辅助技术标记为无效，与 Input 一致', () => {
        const { rerender } = render(<TextArea validateStatus="error" />);
        expect(getTextArea()).toHaveAttribute('aria-invalid', 'true');
        rerender(<TextArea validateStatus="warning" />);
        expect(getTextArea()).not.toHaveAttribute('aria-invalid');
        rerender(<TextArea aria-invalid="true" />);
        expect(getTextArea()).toHaveAttribute('aria-invalid', 'true');
    });

    it('超出 maxCount 时对辅助技术标记为无效，回到范围内后取消', () => {
        const { rerender } = render(<TextArea value="abcd" maxCount={3} />);
        expect(getTextArea()).toHaveAttribute('aria-invalid', 'true');
        rerender(<TextArea value="abc" maxCount={3} />);
        expect(getTextArea()).not.toHaveAttribute('aria-invalid');
    });

    it('不同 validateStatus 的表现', () => {
        render(
            <>
                <TextArea validateStatus="warning" />
                <TextArea validateStatus="error" />
            </>
        );
        const [warning, error] = document.querySelectorAll(`.${prefixCls}-textarea-wrapper`);
        expect(warning).toHaveClass(`${prefixCls}-textarea-wrapper-warning`);
        expect(error).toHaveClass(`${prefixCls}-textarea-wrapper-error`);
    });

    it('onKeyDown 回调', () => {
        const onKeyDown = vi.fn<NonNullable<TextAreaProps['onKeyDown']>>();
        render(<TextArea onKeyDown={onKeyDown} />);
        fireEvent.keyDown(getTextArea(), { key: 'a' });
        expect(onKeyDown).toHaveBeenCalledTimes(1);
    });

    it('rows 属性', () => {
        render(<TextArea rows={5} />);
        expect(getTextArea()).toHaveAttribute('rows', '5');
    });

    it('ref 为函数时接收句柄', () => {
        let handle = null;
        const refFn = (value) => {
            handle = value;
        };
        render(<TextArea ref={refFn} />);
        expect(handle.textarea).toBe(getTextArea());
        expect(handle.nativeElement).toBe(getWrapper());
    });

    it('ref 为对象时接收句柄', () => {
        const refObj = createRef<TextAreaHandle>();
        render(<TextArea ref={refObj} />);
        expect(refObj.current.textarea).toBe(getTextArea());
        expect(refObj.current.nativeElement).toBe(getWrapper());
    });

    it('不带 maxCount 时的 showCounter', () => {
        render(<TextArea defaultValue="test" showCounter />);
        expect(getCounter()).toHaveTextContent(/^4$/);
        expect(getCounter()).not.toHaveClass(`${prefixCls}-textarea-counter-exceed`);
    });

    it('autosize 的行数写入自定义属性：minRows 缺省取 rows，maxRows 缺省不设', () => {
        const minVar = `--${prefixCls}-textarea-min-rows`;
        const maxVar = `--${prefixCls}-textarea-max-rows`;
        const { rerender } = render(<TextArea autosize={{ minRows: 2, maxRows: 6 }} />);
        expect(getTextArea()).toHaveClass(`${prefixCls}-textarea-autosize`);
        expect(getTextArea()).toHaveStyle({ resize: 'none' });
        expect(getTextArea().style.getPropertyValue(minVar)).toBe('2');
        expect(getTextArea().style.getPropertyValue(maxVar)).toBe('6');

        rerender(<TextArea autosize rows={3} />);
        expect(getTextArea().style.getPropertyValue(minVar)).toBe('3');
        expect(getTextArea().style.getPropertyValue(maxVar)).toBe('');

        rerender(<TextArea autosize={false} />);
        expect(getTextArea()).not.toHaveClass(`${prefixCls}-textarea-autosize`);
        expect(getTextArea().style.getPropertyValue(minVar)).toBe('');
    });

    it('componentWillUnmount 取消节流的 resize', () => {
        const { unmount } = render(<TextArea defaultValue="test" autosize />);
        expect(() => unmount()).not.toThrow();
        expect(screen.queryByRole('textbox')).toBeNull();
    });

    it('非受控 TextArea 保留用户输入的内容', async () => {
        const onChange = vi.fn<NonNullable<TextAreaProps['onChange']>>();
        render(<TextArea defaultValue="a" onChange={onChange} />);
        await userEvent.type(getTextArea(), 'b');
        expect(getTextArea()).toHaveValue('ab');
        expect(onChange.mock.calls[0][0]).toBe('ab');
        expect(onChange.mock.calls[0][1].target).toBe(getTextArea());
    });

    it('受控值恢复为 undefined（表单重置）时清空 TextArea', () => {
        const { rerender } = render(<TextArea value="semi" />);
        rerender(<TextArea value={undefined} />);
        expect(getTextArea()).toHaveValue('');
    });

    it('formApi.reset 后 Form.TextArea 清空，且 Form 属性不落到 DOM', async () => {
        let formApi;
        render(
            <Form getFormApi={(api) => (formApi = api)}>
                <Form.TextArea id="desc" field="desc" label="Desc" />
            </Form>
        );
        await userEvent.type(getTextArea(), 'semi');
        expect(formApi.getValue('desc')).toBe('semi');
        await act(() => formApi.reset());
        expect(getTextArea()).toHaveValue('');
        expect(getTextArea()).toHaveAttribute('id', 'desc');
        for (const attr of ['insetlabel', 'insetlabelid', 'validatestatus']) {
            expect(getTextArea()).not.toHaveAttribute(attr);
            expect(getWrapper()).not.toHaveAttribute(attr);
        }
    });

    it('清空已聚焦的 TextArea 时报告 change 与 clear，保持焦点，点击留在组件内', async () => {
        const onBlur = vi.fn<NonNullable<TextAreaProps['onBlur']>>();
        const onChange = vi.fn<NonNullable<TextAreaProps['onChange']>>();
        const onClear = vi.fn<NonNullable<TextAreaProps['onClear']>>();
        const onOuterClick = vi.fn<() => void>();
        render(<TextArea defaultValue="semi" showClear onBlur={onBlur} onChange={onChange} onClear={onClear} />);
        await userEvent.click(getTextArea());
        document.body.addEventListener('click', onOuterClick);
        try {
            await userEvent.click(getClearBtn());
        } finally {
            document.body.removeEventListener('click', onOuterClick);
        }
        expect(onBlur).not.toHaveBeenCalled();
        expect(onChange).toHaveBeenLastCalledWith('', expect.anything());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onOuterClick).not.toHaveBeenCalled();
        expect(getTextArea()).toHaveValue('');
        expect(getTextArea()).toHaveFocus();
    });

    it.each(['{Enter}', ' '])('Tab 可以到达具名的清空按钮，%s 清空后焦点回到 textarea', async (key) => {
        const onClear = vi.fn<NonNullable<TextAreaProps['onClear']>>();
        render(<TextArea defaultValue="semi" showClear onClear={onClear} />);
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
        const { rerender } = render(<TextArea defaultValue="semi" disabled showClear />);
        expect(getClearBtn()).toBeNull();
        rerender(<TextArea defaultValue="semi" readonly showClear />);
        expect(getClearBtn()).toBeNull();
        expect(getTextArea()).toHaveClass(`${prefixCls}-textarea-showClear`);
    });

    it('disabledEnterStartNewLine 阻止 Enter 但不阻止 Shift+Enter', () => {
        const onEnterPress = vi.fn<NonNullable<TextAreaProps['onEnterPress']>>();
        render(<TextArea disabledEnterStartNewLine onEnterPress={onEnterPress} />);
        expect(fireEvent.keyDown(getTextArea(), { key: 'Enter' })).toBe(false);
        expect(fireEvent.keyDown(getTextArea(), { key: 'Enter', shiftKey: true })).toBe(true);
        expect(onEnterPress).toHaveBeenCalledTimes(2);
        expect(getTextArea()).not.toHaveAttribute('disabledenterstartnewline');
    });

    it('点击计数器或外层容器时聚焦 TextArea，禁用时除外', () => {
        const { unmount } = render(<TextArea defaultValue="semi" showCounter />);
        fireEvent.click(getCounter());
        expect(getTextArea()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-focus`);
        unmount();
        render(<TextArea defaultValue="semi" disabled showCounter />);
        fireEvent.click(getWrapper());
        fireEvent.click(getCounter());
        expect(getTextArea()).not.toHaveFocus();
    });

    it('未设置 getValueLength 时，输入法残留多余文本则在失焦时按 maxLength 截断', () => {
        const onChange = vi.fn<NonNullable<TextAreaProps['onChange']>>();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            render(<TextArea maxLength={2} onChange={onChange} />);
            expect(getTextArea()).toHaveAttribute('maxlength', '2');
            fireEvent.compositionStart(getTextArea());
            fireEvent.change(getTextArea(), { target: { value: 'abc' } });
            fireEvent.blur(getTextArea());
            expect(onChange.mock.calls.at(-1)[0]).toBe('ab');
            expect(getTextArea()).toHaveValue('ab');
        } finally {
            warn.mockRestore();
        }
    });

    it('composition 受控且父组件拒绝组合结果时，组合结束后恢复为属性值', () => {
        render(<TextArea value="" composition onChange={() => {}} />);
        fireEvent.compositionStart(getTextArea());
        fireEvent.change(getTextArea(), { target: { value: 'ni' } });
        fireEvent.compositionEnd(getTextArea(), { target: { value: '你' } });
        fireEvent.focus(getTextArea());
        expect(getTextArea()).toHaveValue('');
    });

    it('输入法组合模式下，组合结束后只报告一次，并显示组合中的文本', () => {
        const onChange = vi.fn<NonNullable<TextAreaProps['onChange']>>();
        render(<TextArea value="" composition onChange={onChange} />);
        fireEvent.compositionStart(getTextArea());
        fireEvent.change(getTextArea(), { target: { value: 'ni' } });
        expect(onChange).not.toHaveBeenCalled();
        expect(getTextArea()).toHaveValue('ni');
        fireEvent.compositionEnd(getTextArea(), { target: { value: '你' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('你');
    });

    it('未知属性与 aria 属性透传到原生 textarea，className 与 style 作用于外层容器', () => {
        render(<TextArea name="desc" className="custom" style={{ color: 'red' }} textareaStyle={{ color: 'blue' }} data-testid="desc" aria-label="Description" tabIndex={-1} />);
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

    it('autoFocus 在挂载时聚焦 TextArea', () => {
        render(<TextArea autoFocus />);
        expect(getTextArea()).toHaveFocus();
    });

    it('ref 句柄的 focus 与 blur 驱动焦点样式，select 选中文本', () => {
        const ref = createRef<TextAreaHandle>();
        render(<TextArea ref={ref} defaultValue="semi" />);
        act(() => ref.current.focus());
        expect(getTextArea()).toHaveFocus();
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-focus`);
        ref.current.select();
        expect([getTextArea().selectionStart, getTextArea().selectionEnd]).toEqual([0, 4]);
        act(() => ref.current.blur());
        expect(getTextArea()).not.toHaveFocus();
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-textarea-wrapper-focus`);
    });

    it('ref 句柄只包含文档声明的方法与节点', () => {
        const ref = createRef<TextAreaHandle>();
        render(<TextArea ref={ref} />);
        expect(Object.keys(ref.current).toSorted()).toEqual(['blur', 'focus', 'nativeElement', 'select', 'setSelectionRange', 'textarea'].toSorted());
        for (const method of ['blur', 'focus', 'select', 'setSelectionRange']) {
            expect(typeof ref.current[method]).toBe('function');
        }
    });

    it('句柄的 setSelectionRange 移动选区，focus 透传其选项', () => {
        const ref = createRef<TextAreaHandle>();
        const focus = vi.spyOn(HTMLTextAreaElement.prototype, 'focus');
        render(<TextArea ref={ref} defaultValue="semi design" />);
        ref.current.setSelectionRange(2, 6, 'backward');
        expect([getTextArea().selectionStart, getTextArea().selectionEnd, getTextArea().selectionDirection]).toEqual([2, 6, 'backward']);
        ref.current.focus({ preventScroll: true });
        expect(focus).toHaveBeenLastCalledWith({ preventScroll: true });
        focus.mockRestore();
    });

    it('多次渲染后 autosize 保持句柄稳定', () => {
        const refFn = vi.fn<(handle: TextAreaHandle | null) => void>();
        const { rerender } = render(<TextArea ref={refFn} value="a" autosize />);
        rerender(<TextArea ref={refFn} value="b" autosize />);
        expect(refFn).toHaveBeenCalledTimes(1);
        expect(refFn.mock.calls[0][0].textarea).toBe(getTextArea());
    });

    it('showLineNumber 重新挂载 textarea 后，句柄指向当前挂载的 textarea', () => {
        const ref = createRef<TextAreaHandle>();
        const { rerender } = render(<TextArea ref={ref} defaultValue="a" />);
        const handle = ref.current;
        const before = getTextArea();
        rerender(<TextArea ref={ref} defaultValue="a" showLineNumber />);
        // the textarea moves into the line number content div, so React mounts a new node
        expect(getTextArea()).not.toBe(before);
        expect(ref.current).toBe(handle);
        expect(handle.textarea).toBe(getTextArea());
        expect(handle.nativeElement).toBe(getWrapper());
        act(() => handle.focus());
        expect(getTextArea()).toHaveFocus();
    });

    it('Form.TextArea 经 withField 透传 ref，因此同样得到句柄', () => {
        const ref = createRef<TextAreaHandle>();
        render(
            <Form>
                <Form.TextArea ref={ref} field="text" />
            </Form>
        );
        expect(ref.current.textarea).toBe(getTextArea());
        expect(ref.current.nativeElement).toBe(getWrapper());
    });

    it('resize 属性设置 textarea 样式与外层容器类名', () => {
        const { rerender } = render(<TextArea resize="horizontal" />);
        expect(getTextArea()).toHaveStyle({ resize: 'horizontal' });
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-resizeX`);
        rerender(<TextArea resize="vertical" />);
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-resizeY`);
        rerender(<TextArea autosize resize="both" />);
        expect(getTextArea()).toHaveStyle({ resize: 'none' });
        expect(getWrapper()).not.toHaveClass(`${prefixCls}-textarea-wrapper-resizeX`);
    });

    it('showLineNumber 从 lineNumberStart 开始，每行渲染一个行号', () => {
        render(<TextArea lineNumberClassName="nums" defaultValue={'a\nb\nc'} lineNumberStart={3} showLineNumber />);
        expect(getWrapper()).toHaveClass(`${prefixCls}-textarea-wrapper-withLineNumber`);
        const items = document.querySelectorAll(`.${prefixCls}-textarea-lineNumber-item`);
        expect([...items].map((item) => item.textContent)).toEqual(['3', '4', '5']);
        expect(document.querySelector('.nums')).toHaveClass(`${prefixCls}-textarea-lineNumber`);
    });

    it('行号面板对辅助技术隐藏', () => {
        render(<TextArea defaultValue={'a\nb'} showLineNumber />);
        expect(document.querySelector(`.${prefixCls}-textarea-lineNumber`)).toHaveAttribute('aria-hidden', 'true');
    });

    it('计数器经 aria-describedby 关联到 textarea', () => {
        render(<TextArea defaultValue="abcd" maxCount={3} />);
        expect(getTextArea()).toHaveAccessibleDescription('4/3');
    });

    it('指针点击清除按钮时焦点不被抢进 textarea，键盘激活时交还', async () => {
        const user = userEvent.setup();
        render(
            <>
                <button type="button">other</button>
                <TextArea defaultValue="semi" showClear />
            </>
        );
        const other = screen.getByRole('button', { name: 'other' });
        other.focus();
        await user.click(getClearBtn() as HTMLElement);
        expect(other).toHaveFocus();

        await user.type(getTextArea(), 'a');
        (getClearBtn() as HTMLElement).focus();
        await user.keyboard('{Enter}');
        expect(getTextArea()).toHaveFocus();
    });

    it('StrictMode 下每次按键只报告一次', async () => {
        const onChange = vi.fn<NonNullable<TextAreaProps['onChange']>>();
        render(
            <StrictMode>
                <TextArea onChange={onChange} />
            </StrictMode>
        );
        await userEvent.type(getTextArea(), 'ab');
        expect(onChange.mock.calls.map(([value]) => value)).toEqual(['a', 'ab']);
        expect(getTextArea()).toHaveValue('ab');
    });

    it('负数 maxLength 不限制值（旧实现会报告 undefined 并在失焦时清空）', () => {
        const onChange = vi.fn<NonNullable<TextAreaProps['onChange']>>();
        render(<TextArea defaultValue="semi" maxLength={-1} onChange={onChange} />);
        fireEvent.change(getTextArea(), { target: { value: 'semi design' } });
        fireEvent.blur(getTextArea());
        expect(onChange.mock.calls.map(([value]) => value)).toEqual(['semi design']);
        expect(getTextArea()).toHaveValue('semi design');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { TextArea: { rows: 2, showCounter: true } };
        try {
            const { unmount } = render(<TextArea defaultValue="semi" />);
            expect(getTextArea()).toHaveAttribute('rows', '2');
            expect(getCounter()).toHaveTextContent(/^4$/);
            unmount();
            render(<TextArea rows={6} />);
            expect(getTextArea()).toHaveAttribute('rows', '6');
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('onChange 的事件类型涵盖清除按钮、输入法结束和失焦截断', async () => {
        const onChange = vi.fn<NonNullable<TextAreaProps['onChange']>>();
        render(<TextArea defaultValue="semi" showClear onChange={onChange} />);
        await userEvent.click(getClearBtn());
        expect(onChange).toHaveBeenCalledWith('', expect.objectContaining({ type: 'click' }));
        expectTypeOf<React.MouseEvent<HTMLButtonElement>>().toExtend<TextAreaChangeEvent>();
        expectTypeOf<React.CompositionEvent<HTMLTextAreaElement>>().toExtend<TextAreaChangeEvent>();
        expectTypeOf<FocusEvent>().toExtend<TextAreaChangeEvent>();
    });

    it('不声明从不调用的 onPressEnter，回车入口只有 onEnterPress', () => {
        expectTypeOf<TextAreaProps>().not.toHaveProperty('onPressEnter');
        expectTypeOf<TextAreaProps>().toHaveProperty('onEnterPress');
    });
});
