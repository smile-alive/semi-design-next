import type React from 'react';
import { StrictMode } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { Feedback, LocaleProvider } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { CheckboxGroupProps } from '@fibrae/semi-ui-react/checkbox/checkbox-group';
import type { TextAreaProps } from '@fibrae/semi-ui-react/input';
import type { RadioGroupProps } from '@fibrae/semi-ui-react/radio/radio-group';
import type { FeedbackModalProps, FeedbackProps, FeedbackSideSheetProps } from '../index';

const prefix = `${BASE_CLASS_PREFIX}-feedback`;
const $ = (selector) => document.querySelector(selector);
const submit = () => screen.getByRole('button', { name: '提交' });
const cancel = () => screen.getByRole('button', { name: '取消' });
const emojiItem = (glyph) => screen.getByText(glyph).closest(`.${prefix}-emoji-item`);
const options = [
    { label: 'A', value: 'a' },
    { label: 'B', value: 'b' },
];

describe('Feedback', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
        document.body.style.overflow = '';
        document.body.style.paddingInlineEnd = '';
    });

    // the SideSheet root receives unknown props, so Feedback must not hand it its own Modal-only props
    it('popup 模式渲染 SideSheet，且不把 Feedback 属性泄漏到 DOM', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<Feedback type="text" data-testid="feedback" title="T" mode="popup" visible />);
        const root = document.querySelector(`div.${BASE_CLASS_PREFIX}-sidesheet`);
        expect(root).toHaveClass(`${BASE_CLASS_PREFIX}-feedback`);
        expect(root).toHaveAttribute('data-testid', 'feedback');
        expect(root).not.toHaveAttribute('afterclose');
        expect(error).not.toHaveBeenCalled();
    });

    it('默认为底部无遮罩的 emoji 弹层，带语言包页脚', () => {
        render(<Feedback title="T" visible />);
        const root = $(`div.${BASE_CLASS_PREFIX}-sidesheet`);
        expect(root).toHaveClass(prefix, `${prefix}-emoji`, `${BASE_CLASS_PREFIX}-sidesheet-bottom`);
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-mask`)).toBeNull();
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-title`)).toHaveTextContent('T');
        expect($(`.${prefix}-footer`)).not.toBeNull();
        expect(cancel()).toBeEnabled();
        expect(submit()).toBeDisabled();
        expect(document.querySelectorAll(`.${prefix}-emoji-item`)).toHaveLength(3);
    });

    it('modal 模式渲染 Modal，确定按钮等待选择值', () => {
        render(<Feedback type="text" title="T" mode="modal" motion={false} visible />);
        const root = $(`.${prefix}`);
        expect(root).toHaveClass(`${prefix}-text`);
        expect(root.querySelector(`.${BASE_CLASS_PREFIX}-modal`)).not.toBeNull();
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet`)).toBeNull();
        expect($(`.${BASE_CLASS_PREFIX}-modal-title`)).toHaveTextContent('T');
        expect(submit()).toBeDisabled();
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hi' } });
        expect(submit()).toBeEnabled();
    });

    it('emoji：选择后上报表情，差评需要填写原因', () => {
        const onValueChange = vi.fn<NonNullable<FeedbackProps['onValueChange']>>();
        render(<Feedback textAreaProps={{ maxCount: 10 }} visible onValueChange={onValueChange} />);
        expect(screen.queryByRole('textbox')).toBeNull();

        fireEvent.click(screen.getByText('😃'));
        expect(onValueChange).toHaveBeenLastCalledWith({ emoji: '😃' });
        expect(emojiItem('😃')).toHaveClass(`${prefix}-emoji-item-selected`);
        expect(screen.queryByRole('textbox')).toBeNull();
        expect(submit()).toBeEnabled();

        fireEvent.click(screen.getByText('😞'));
        expect(onValueChange).toHaveBeenLastCalledWith({ emoji: '😞' });
        expect(emojiItem('😃')).not.toHaveClass(`${prefix}-emoji-item-selected`);
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveAttribute('placeholder', zh_CN.Feedback.placeholderOptional);

        fireEvent.change(textarea, { target: { value: 'slow' } });
        expect(onValueChange).toHaveBeenLastCalledWith({ emoji: '😞', text: 'slow' });
        expect($(`.${BASE_CLASS_PREFIX}-input-textarea-counter`)).toHaveTextContent('4/10');
    });

    it('emoji：具名单选组，键盘可以到达并选中单选项（APG radio group）', async () => {
        const onValueChange = vi.fn<NonNullable<FeedbackProps['onValueChange']>>();
        render(<Feedback visible onValueChange={onValueChange} />);
        const group = screen.getByRole('radiogroup', { name: zh_CN.Feedback.rating });
        const radios = within(group).getAllByRole('radio');
        expect(radios.map((radio) => radio.getAttribute('aria-label'))).toEqual([zh_CN.Feedback.bad, zh_CN.Feedback.normal, zh_CN.Feedback.good]);
        expect(radios.every((radio) => !(radio as HTMLInputElement).checked)).toBe(true);

        act(() => radios[0].focus());
        await userEvent.keyboard(' ');
        expect(onValueChange).toHaveBeenLastCalledWith({ emoji: '😞' });
        expect(radios[0]).toBeChecked();
        await userEvent.keyboard('{ArrowRight}');
        expect(onValueChange).toHaveBeenLastCalledWith({ emoji: '😐' });
        expect(radios[1]).toBeChecked();
        expect(radios[1]).toHaveFocus();
        expect(radios[1].closest(`.${prefix}-emoji-item`)).toHaveClass(`${prefix}-emoji-item-selected`);
    });

    it('text：输入后上报字符串，textAreaProps 传到 TextArea', () => {
        const onValueChange = vi.fn<NonNullable<FeedbackProps['onValueChange']>>();
        render(<Feedback type="text" textAreaProps={{ maxCount: 10 }} visible onValueChange={onValueChange} />);
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveAttribute('placeholder', zh_CN.Feedback.placeholder);
        fireEvent.change(textarea, { target: { value: 'good' } });
        expect(onValueChange).toHaveBeenLastCalledWith('good');
        expect(submit()).toBeEnabled();
        expect($(`.${BASE_CLASS_PREFIX}-input-textarea-counter`)).toHaveTextContent('4/10');
    });

    it('placeholder 跟随语言包', () => {
        render(
            <LocaleProvider locale={en_US}>
                <Feedback type="text" visible />
            </LocaleProvider>
        );
        expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Provide additional feedback');
    });

    it('radio：垂直分组上报所选值', () => {
        const onValueChange = vi.fn<NonNullable<FeedbackProps['onValueChange']>>();
        const onChange = vi.fn<NonNullable<RadioGroupProps['onChange']>>();
        render(<Feedback type="radio" radioGroupProps={{ options, onChange }} visible onValueChange={onValueChange} />);
        expect($(`.${prefix}-radio-container .${BASE_CLASS_PREFIX}-radioGroup-vertical`)).not.toBeNull();
        fireEvent.click(screen.getByRole('radio', { name: 'B' }));
        expect(onValueChange).toHaveBeenLastCalledWith('b');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].target.value).toBe('b');
        expect(submit()).toBeEnabled();
    });

    it('checkbox：垂直分组上报所选值；未选中任何项时禁用提交', () => {
        const onValueChange = vi.fn<NonNullable<FeedbackProps['onValueChange']>>();
        const onChange = vi.fn<NonNullable<CheckboxGroupProps['onChange']>>();
        render(<Feedback type="checkbox" checkboxGroupProps={{ options, onChange }} visible onValueChange={onValueChange} />);
        expect($(`.${prefix}-checkbox-container .${BASE_CLASS_PREFIX}-checkboxGroup-vertical`)).not.toBeNull();
        fireEvent.click(screen.getByRole('checkbox', { name: 'A' }));
        fireEvent.click(screen.getByRole('checkbox', { name: 'B' }));
        expect(onValueChange).toHaveBeenLastCalledWith(['a', 'b']);
        expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
        expect(submit()).toBeEnabled();
        fireEvent.click(screen.getByRole('checkbox', { name: 'A' }));
        fireEvent.click(screen.getByRole('checkbox', { name: 'B' }));
        expect(onValueChange).toHaveBeenLastCalledWith([]);
        expect(submit()).toBeDisabled();
    });

    it('custom 渲染 children，renderContent 包裹内容', () => {
        const { rerender } = render(
            <Feedback type="custom" visible>
                <span>mine</span>
            </Feedback>
        );
        expect(screen.getByText('mine')).not.toBeNull();
        rerender(<Feedback type="text" visible renderContent={(content) => <div data-testid="wrap">{content}</div>} />);
        expect(screen.getByTestId('wrap')).toContainElement(screen.getByRole('textbox'));
    });

    it('popup：提交与取消上报点击并清空值', () => {
        const onOk = vi.fn<() => void>();
        const onCancel = vi.fn<() => void>();
        render(<Feedback visible onCancel={onCancel} onOk={onOk} />);
        fireEvent.click(screen.getByText('😃'));
        fireEvent.click(submit());
        expect(onOk).toHaveBeenCalledTimes(1);
        expect(onOk).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));
        expect(submit()).toBeDisabled();
        expect(emojiItem('😃')).not.toHaveClass(`${prefix}-emoji-item-selected`);

        fireEvent.click(screen.getByText('😐'));
        fireEvent.click(cancel());
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onCancel).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));
        expect(submit()).toBeDisabled();
    });

    it('popup：text 提交与取消后输入框清空', () => {
        render(<Feedback type="text" visible />);
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: 'good' } });
        fireEvent.click(submit());
        expect(textarea).toHaveValue('');
        expect(submit()).toBeDisabled();
        fireEvent.change(textarea, { target: { value: 'again' } });
        fireEvent.click(cancel());
        expect(textarea).toHaveValue('');
    });

    it('popup：radio 提交后选项复位', () => {
        render(<Feedback type="radio" radioGroupProps={{ options }} visible />);
        fireEvent.click(screen.getByRole('radio', { name: 'B' }));
        expect(screen.getByRole('radio', { name: 'B' })).toBeChecked();
        fireEvent.click(submit());
        expect(screen.getByRole('radio', { name: 'B' })).not.toBeChecked();
        expect(submit()).toBeDisabled();
    });

    it('popup：checkbox 提交后选项复位', () => {
        render(<Feedback type="checkbox" checkboxGroupProps={{ options }} visible />);
        fireEvent.click(screen.getByRole('checkbox', { name: 'A' }));
        expect(screen.getByRole('checkbox', { name: 'A' })).toBeChecked();
        fireEvent.click(submit());
        expect(screen.getByRole('checkbox', { name: 'A' })).not.toBeChecked();
        expect(submit()).toBeDisabled();
    });

    it('使用方在 textAreaProps 中传入 value 时以使用方为准', () => {
        render(<Feedback type="text" textAreaProps={{ value: 'fixed' }} visible />);
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue('fixed');
        fireEvent.change(textarea, { target: { value: 'typed' } });
        expect(textarea).toHaveValue('fixed');
    });

    it('回调显式传 null 时提交、取消与关闭不抛错', () => {
        // React reports an error thrown in an event handler on window instead of rethrowing it from fireEvent
        const errors: unknown[] = [];
        const onError = (event: ErrorEvent) => {
            errors.push(event.error);
            event.preventDefault();
        };
        window.addEventListener('error', onError);
        const props = { onValueChange: null, onCancel: null, onOk: null, afterClose: null };
        const { rerender } = render(<Feedback type="text" title="T" visible {...props} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'good' } });
        fireEvent.click(submit());
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'good' } });
        fireEvent.click(cancel());
        rerender(<Feedback type="text" title="T" motion={false} visible={false} {...props} />);
        window.removeEventListener('error', onError);
        expect(errors).toEqual([]);
    });

    it('popup：关闭图标执行取消', () => {
        const onCancel = vi.fn<() => void>();
        render(<Feedback title="T" visible onCancel={onCancel} />);
        fireEvent.click(screen.getByRole('button', { name: zh_CN.SideSheet.close }));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('popup：Esc 关闭时 onCancel 收到原生 KeyboardEvent，类型声明与之一致', () => {
        type CancelHandler = NonNullable<FeedbackSideSheetProps['onCancel']>;
        const onCancel = vi.fn<CancelHandler>();
        render(<Feedback title="T" closeOnEsc visible onCancel={onCancel} />);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
        const event = onCancel.mock.calls[0][0];
        expect(event).toBeInstanceOf(KeyboardEvent);
        expect('nativeEvent' in event).toBe(false);
        expectTypeOf<Parameters<CancelHandler>[0]>().toEqualTypeOf<React.MouseEvent | KeyboardEvent>();
        expectTypeOf<Parameters<NonNullable<FeedbackModalProps['onCancel']>>[0]>().toEqualTypeOf<React.MouseEvent | KeyboardEvent>();
    });

    it('popup：onOk 返回的 Promise 显示加载态，resolve 后清空值', async () => {
        let resolve: () => void;
        const onOk = vi.fn<() => Promise<void>>(() => new Promise<void>((r) => (resolve = r)));
        render(<Feedback visible onOk={onOk} />);
        fireEvent.click(screen.getByText('😃'));
        fireEvent.click(submit());
        expect(submit()).toHaveClass(`${BASE_CLASS_PREFIX}-button-loading`);
        expect(submit()).toBeEnabled();
        await act(async () => resolve());
        expect(submit()).not.toHaveClass(`${BASE_CLASS_PREFIX}-button-loading`);
        expect(submit()).toBeDisabled();
    });

    it('popup：onCancel 返回的 Promise 在取消按钮上显示加载态', async () => {
        let resolve: () => void;
        const onCancel = vi.fn<() => Promise<void>>(() => new Promise<void>((r) => (resolve = r)));
        render(<Feedback visible onCancel={onCancel} />);
        fireEvent.click(screen.getByText('😃'));
        fireEvent.click(cancel());
        expect(cancel()).toHaveClass(`${BASE_CLASS_PREFIX}-button-loading`);
        expect(submit()).toBeEnabled();
        await act(async () => resolve());
        expect(cancel()).not.toHaveClass(`${BASE_CLASS_PREFIX}-button-loading`);
        expect(submit()).toBeDisabled();
    });

    it('popup：footer 替换默认按钮，确定与取消按钮属性生效', () => {
        const { rerender } = render(<Feedback footer={<span>own footer</span>} visible />);
        expect(screen.getByText('own footer')).not.toBeNull();
        expect(screen.queryByRole('button', { name: '提交' })).toBeNull();
        rerender(<Feedback cancelButtonProps={{ className: 'my-cancel' }} okButtonProps={{ disabled: false }} visible />);
        expect(submit()).toBeEnabled();
        expect(cancel()).toHaveClass('my-cancel');
    });

    it('modal：确定与取消上报点击并清空值', () => {
        const onOk = vi.fn<() => void>();
        const onCancel = vi.fn<() => void>();
        render(<Feedback mode="modal" motion={false} visible onCancel={onCancel} onOk={onOk} />);
        fireEvent.click(screen.getByText('😃'));
        fireEvent.click(submit());
        expect(onOk).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));
        expect(submit()).toBeDisabled();

        fireEvent.click(screen.getByText('😐'));
        fireEvent.click(cancel());
        expect(onCancel).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));
        expect(submit()).toBeDisabled();
    });

    it('modal：onOk 返回的 Promise 在 resolve 前保留值', async () => {
        let resolve: () => void;
        const onOk = vi.fn<() => Promise<void>>(() => new Promise<void>((r) => (resolve = r)));
        render(<Feedback mode="modal" motion={false} visible onOk={onOk} />);
        fireEvent.click(screen.getByText('😃'));
        fireEvent.click(submit());
        expect(submit()).toHaveClass(`${BASE_CLASS_PREFIX}-button-loading`);
        await act(async () => resolve());
        expect(submit()).toBeDisabled();
    });

    it('modal：okButtonProps 未给 disabled 时仍按值禁用，显式 disabled 以使用方为准', () => {
        const { rerender } = render(<Feedback mode="modal" motion={false} okButtonProps={{ className: 'my-ok' }} visible />);
        expect(submit()).toHaveClass('my-ok');
        expect(submit()).toBeDisabled();
        rerender(<Feedback mode="modal" motion={false} okButtonProps={{ className: 'my-ok', disabled: false }} visible />);
        expect(submit()).toBeEnabled();
    });

    it('popup：footer、mask、placement 显式为 undefined 时仍用内置值', () => {
        render(<Feedback footer={undefined} mask={undefined} placement={undefined} visible />);
        expect(submit()).toBeDisabled();
        expect(cancel()).toBeEnabled();
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-bottom`)).not.toBeNull();
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-mask`)).toBeNull();
    });

    it('modal：okText 显式为 undefined 时仍用语言包文案', () => {
        render(<Feedback mode="modal" motion={false} okText={undefined} visible />);
        expect(submit()).not.toBeNull();
    });

    it('okButtonProps.disabled 显式为 undefined 时仍按值禁用', () => {
        const { rerender } = render(<Feedback okButtonProps={{ disabled: undefined }} visible />);
        expect(submit()).toBeDisabled();
        rerender(<Feedback mode="modal" motion={false} okButtonProps={{ disabled: undefined }} visible />);
        expect(submit()).toBeDisabled();
    });

    it('radio：选项值为 0 或 false 时提交按钮可用', () => {
        const radioGroupProps = {
            options: [
                { label: '零', value: 0 },
                { label: '否', value: false },
            ],
        };
        render(<Feedback type="radio" radioGroupProps={radioGroupProps} visible />);
        expect(submit()).toBeDisabled();
        fireEvent.click(screen.getByRole('radio', { name: '零' }));
        expect(submit()).toBeEnabled();
        fireEvent.click(screen.getByRole('radio', { name: '否' }));
        expect(submit()).toBeEnabled();
    });

    it('popup：okButtonProps、cancelButtonProps 的 onClick 先于内置处理调用，不替换它', () => {
        const order: string[] = [];
        const onOk = vi.fn<() => void>(() => void order.push('onOk'));
        const onCancel = vi.fn<() => void>(() => void order.push('onCancel'));
        render(<Feedback cancelButtonProps={{ onClick: () => order.push('cancelClick') }} okButtonProps={{ onClick: () => order.push('okClick') }} visible onCancel={onCancel} onOk={onOk} />);
        fireEvent.click(screen.getByText('😃'));
        fireEvent.click(submit());
        fireEvent.click(cancel());
        expect(order).toEqual(['okClick', 'onOk', 'cancelClick', 'onCancel']);
        expect(submit()).toBeDisabled();
    });

    it('popup：okButtonProps.loading 与内置挂起态任一为真即显示加载态', async () => {
        let resolve: () => void;
        const onOk = vi.fn<() => Promise<void>>(() => new Promise<void>((r) => (resolve = r)));
        const loadingCls = `${BASE_CLASS_PREFIX}-button-loading`;
        const { rerender } = render(<Feedback okButtonProps={{ loading: false }} visible onOk={onOk} />);
        fireEvent.click(screen.getByText('😃'));
        fireEvent.click(submit());
        expect(submit()).toHaveClass(loadingCls);
        await act(async () => resolve());
        expect(submit()).not.toHaveClass(loadingCls);
        rerender(<Feedback okButtonProps={{ loading: true, disabled: false }} visible onOk={onOk} />);
        expect(submit()).toHaveClass(loadingCls);
    });

    it('类型：FeedbackProps 按 mode 判别，FeedbackValue 含 number 与 boolean', () => {
        // @ts-expect-error popup mode takes no Modal-only props
        const popupWithModalProp: FeedbackProps = { mode: 'popup', okText: 'x' };
        expectTypeOf<number>().toExtend<Parameters<NonNullable<FeedbackProps['onValueChange']>>[0]>();
        expectTypeOf<boolean>().toExtend<Parameters<NonNullable<FeedbackProps['onValueChange']>>[0]>();
        void popupWithModalProp;
    });

    it('modal：弹窗隐藏后执行一次 afterClose', () => {
        const afterClose = vi.fn<() => void>();
        const { rerender } = render(<Feedback afterClose={afterClose} mode="modal" motion={false} visible />);
        expect(afterClose).not.toHaveBeenCalled();
        rerender(<Feedback afterClose={afterClose} mode="modal" motion={false} visible={false} />);
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('style 与 data-* 落在 Modal 和 SideSheet 各自的位置', () => {
        const { unmount } = render(<Feedback style={{ color: 'red' }} data-testid="fb" visible />);
        expect(screen.getByTestId('fb')).toHaveClass(`${BASE_CLASS_PREFIX}-sidesheet`);
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-inner`)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        unmount();
        render(<Feedback style={{ color: 'red' }} data-testid="fb" mode="modal" motion={false} visible />);
        expect(screen.getByTestId('fb')).toHaveClass(prefix);
        expect($(`.${BASE_CLASS_PREFIX}-modal`)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('从 semiGlobal 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Feedback: { mode: 'modal', type: 'text', motion: false } };
        render(<Feedback visible />);
        expect($(`.${prefix}.${prefix}-text`)).not.toBeNull();
        expect($(`.${BASE_CLASS_PREFIX}-modal`)).not.toBeNull();
        expect(screen.getByRole('textbox')).not.toBeNull();
    });

    it('StrictMode 下正常工作', () => {
        const onValueChange = vi.fn<NonNullable<FeedbackProps['onValueChange']>>();
        render(
            <StrictMode>
                <Feedback visible onValueChange={onValueChange} />
            </StrictMode>
        );
        fireEvent.click(screen.getByText('😃'));
        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(emojiItem('😃')).toHaveClass(`${prefix}-emoji-item-selected`);
        expect(submit()).toBeEnabled();
    });

    it('两种模式下 className 都落在根元素上', () => {
        const { unmount } = render(<Feedback className="mine" visible />);
        expect($(`div.${BASE_CLASS_PREFIX}-sidesheet`)).toHaveClass(prefix, 'mine');
        expect($('.className')).toBeNull();
        unmount();
        render(<Feedback className="mine" mode="modal" motion={false} visible />);
        expect($(`.${prefix}`)).toHaveClass('mine');
        expect($('.className')).toBeNull();
    });

    it('popup：抽屉隐藏后与 afterVisibleChange 一起执行一次 afterClose', () => {
        const afterClose = vi.fn<() => void>();
        const afterVisibleChange = vi.fn<(visible: boolean) => void>();
        const props = { motion: false, afterClose, afterVisibleChange };
        const { rerender } = render(<Feedback visible {...props} />);
        expect(afterClose).not.toHaveBeenCalled();
        rerender(<Feedback visible={false} {...props} />);
        expect(afterClose).toHaveBeenCalledTimes(1);
        expect(afterVisibleChange).toHaveBeenLastCalledWith(false);
        rerender(<Feedback visible {...props} />);
        expect(afterVisibleChange).toHaveBeenLastCalledWith(true);
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('textAreaProps.onChange 被调用，且不替换上报的值', () => {
        const onValueChange = vi.fn<NonNullable<FeedbackProps['onValueChange']>>();
        const onChange = vi.fn<NonNullable<TextAreaProps['onChange']>>();
        const { unmount } = render(<Feedback type="text" textAreaProps={{ onChange }} visible onValueChange={onValueChange} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'good' } });
        expect(onValueChange).toHaveBeenLastCalledWith('good');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('good', expect.objectContaining({ type: 'change' }));
        unmount();

        render(<Feedback textAreaProps={{ onChange }} visible onValueChange={onValueChange} />);
        fireEvent.click(screen.getByText('😞'));
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'slow' } });
        expect(onValueChange).toHaveBeenLastCalledWith({ emoji: '😞', text: 'slow' });
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('ref 指向 SideSheet 或 Modal 的外层包裹元素', () => {
        const ref = { current: null };
        const { unmount } = render(<Feedback ref={ref} visible />);
        expect(ref.current).toBe($(`div.${BASE_CLASS_PREFIX}-sidesheet`));
        unmount();
        render(<Feedback ref={ref} mode="modal" motion={false} visible />);
        expect(ref.current).toBe($(`.${prefix}`));
    });
});
