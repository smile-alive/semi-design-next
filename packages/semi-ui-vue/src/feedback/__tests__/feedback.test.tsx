/** @jsxImportSource vue */
import { h, nextTick, type Component } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor, within } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { isFeedbackValueEmpty } from '@fibrae/semi-foundation/feedback/foundation';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { render } from '@test/utils/vue';
import semiGlobal, { semiGlobalKey } from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider/config-provider.vue';
import Feedback from '../feedback.vue';
import type { FeedbackEmits, FeedbackFullProps, FeedbackHandle, FeedbackProps } from '../interface';
import Cached from './fixtures/cached.vue';
import HandleHost from './fixtures/handle-host.vue';
import Model from './fixtures/model.vue';
import ToggleFooter from './fixtures/toggle-footer.vue';
import Two from './fixtures/two.vue';

type Props = Partial<FeedbackProps> & Record<string, unknown>;
type SlotMap = Record<string, (props?: never) => unknown>;
type View = ReturnType<typeof render>;

const prefix = `${BASE_CLASS_PREFIX}-feedback`;
const sheetCls = `${BASE_CLASS_PREFIX}-sidesheet`;
const modalCls = `${BASE_CLASS_PREFIX}-modal`;
const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
const submit = () => screen.getByRole('button', { name: '提交' });
const cancel = () => screen.getByRole('button', { name: '取消' });
const emojiItem = (glyph: string) => screen.getByText(glyph).closest(`.${prefix}-emoji-item`);
const visibleOutput = () => screen.getByLabelText('visible').textContent;
const options = [
    { label: 'A', value: 'a' },
    { label: 'B', value: 'b' },
];

// Portal renders a tick after mounting, so every render that may show the dialog waits one more tick.
async function renderFeedback(props: Props = {}, slots: SlotMap = {}) {
    const view = render(Feedback, { props, slots: slots as never });
    await nextTick();
    return view;
}

async function update(view: View, props: Props) {
    await view.rerender(props);
    await nextTick();
}

async function renderModel(props: Props = {}) {
    const view = render(Model, { props });
    await nextTick();
    return view;
}

const emitted = (view: View, name: string) => (view.emitted()[name] ?? []) as unknown[][];

describe('Feedback', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
        document.body.style.overflow = '';
        document.body.style.paddingInlineEnd = '';
    });

    describe('渲染', () => {
        // the SideSheet root receives unknown attrs, so Feedback must not hand it its own Modal-only props
        it('popup 模式渲染 SideSheet，且不把 Feedback 属性泄漏到 DOM', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            await renderFeedback({ type: 'text', 'data-testid': 'feedback', title: 'T', mode: 'popup', visible: true });
            const root = $(`div.${sheetCls}`);
            expect(root).toHaveClass(prefix);
            expect(root).toHaveAttribute('data-testid', 'feedback');
            expect(root).not.toHaveAttribute('afterclose');
            expect(root).not.toHaveAttribute('onok');
            expect(warn.mock.calls.filter(([message]) => String(message).includes('[Vue warn]'))).toEqual([]);
            warn.mockRestore();
        });

        it('默认为底部无遮罩的 emoji 弹层，带语言包页脚', async () => {
            await renderFeedback({ title: 'T', visible: true });
            expect($(`div.${sheetCls}`)).toHaveClass(prefix, `${prefix}-emoji`, `${sheetCls}-bottom`);
            expect($(`.${sheetCls}-mask`)).toBeNull();
            expect($(`.${sheetCls}-title`)).toHaveTextContent('T');
            expect($(`.${prefix}-footer`)).not.toBeNull();
            expect(cancel()).toBeEnabled();
            expect(submit()).toBeDisabled();
            expect(document.querySelectorAll(`.${prefix}-emoji-item`)).toHaveLength(3);
        });

        it('modal 模式渲染 Modal，确定按钮等待选择值', async () => {
            await renderFeedback({ type: 'text', title: 'T', mode: 'modal', motion: false, visible: true });
            const root = $(`.${prefix}`);
            expect(root).toHaveClass(`${prefix}-text`);
            expect(root?.querySelector(`.${modalCls}`)).not.toBeNull();
            expect($(`.${sheetCls}`)).toBeNull();
            expect($(`.${modalCls}-title`)).toHaveTextContent('T');
            expect(submit()).toBeDisabled();
            await fireEvent.update(screen.getByRole('textbox'), 'hi');
            expect(submit()).toBeEnabled();
        });

        it('visible 默认为 false，不渲染对话框', async () => {
            const view = await renderFeedback({ title: 'T' });
            expect($(`.${sheetCls}`)).toBeNull();
            await update(view, { visible: true });
            expect($(`.${sheetCls}`)).not.toBeNull();
        });

        it('placeholder 跟随语言包', async () => {
            render(() => <ConfigProvider locale={ja_JP}>{() => <Feedback type="text" title="T" visible />}</ConfigProvider>);
            await nextTick();
            expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', ja_JP.Feedback.placeholder);
            expect(screen.getByRole('button', { name: ja_JP.Feedback.submit })).toBeInTheDocument();
        });

        it('多个根的 type 不产生 Vue 告警', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const view = await renderFeedback({ title: 'T', visible: true, 'aria-label': 'x' });
            await update(view, { type: 'text' });
            await update(view, { type: 'radio', radioGroupProps: { options } });
            await update(view, { mode: 'modal', motion: false, type: 'emoji' });
            expect(warn.mock.calls.filter(([message]) => String(message).includes('[Vue warn]'))).toEqual([]);
            warn.mockRestore();
        });
    });

    describe('type', () => {
        it('emoji：选择后上报表情，差评需要填写原因', async () => {
            const onValueChange = vi.fn<(...args: unknown[]) => void>();
            await renderFeedback({ textAreaProps: { maxCount: 10 }, title: 'T', visible: true, onValueChange });
            expect(screen.queryByRole('textbox')).toBeNull();

            await userEvent.click(screen.getByText('😃'));
            expect(onValueChange).toHaveBeenLastCalledWith({ emoji: '😃' });
            expect(emojiItem('😃')).toHaveClass(`${prefix}-emoji-item-selected`);
            expect(screen.queryByRole('textbox')).toBeNull();
            expect(submit()).toBeEnabled();

            await userEvent.click(screen.getByText('😞'));
            expect(onValueChange).toHaveBeenLastCalledWith({ emoji: '😞' });
            expect(emojiItem('😃')).not.toHaveClass(`${prefix}-emoji-item-selected`);
            const textarea = screen.getByRole('textbox');
            expect(textarea).toHaveAttribute('placeholder', zh_CN.Feedback.placeholderOptional);

            await fireEvent.update(textarea, 'slow');
            expect(onValueChange).toHaveBeenLastCalledWith({ emoji: '😞', text: 'slow' });
            expect($(`.${BASE_CLASS_PREFIX}-input-textarea-counter`)).toHaveTextContent('4/10');
        });

        it('emoji：具名单选组，键盘可以到达并选中单选项（APG radio group）', async () => {
            const onValueChange = vi.fn<(...args: unknown[]) => void>();
            await renderFeedback({ title: 'T', visible: true, onValueChange });
            const group = screen.getByRole('radiogroup', { name: zh_CN.Feedback.rating });
            const radios = within(group).getAllByRole('radio');
            expect(radios.map((radio) => radio.getAttribute('aria-label'))).toEqual([zh_CN.Feedback.bad, zh_CN.Feedback.normal, zh_CN.Feedback.good]);
            expect(radios.every((radio) => !(radio as HTMLInputElement).checked)).toBe(true);

            radios[0].focus();
            await userEvent.keyboard(' ');
            expect(onValueChange).toHaveBeenLastCalledWith({ emoji: '😞' });
            expect(radios[0]).toBeChecked();
            await userEvent.keyboard('{ArrowRight}');
            expect(onValueChange).toHaveBeenLastCalledWith({ emoji: '😐' });
            expect(radios[1]).toBeChecked();
            expect(radios[1]).toHaveFocus();
            expect(radios[1].closest(`.${prefix}-emoji-item`)).toHaveClass(`${prefix}-emoji-item-selected`);
        });

        it('text：输入后上报字符串，textAreaProps 传到 TextArea', async () => {
            const onValueChange = vi.fn<(...args: unknown[]) => void>();
            await renderFeedback({
                type: 'text',
                textAreaProps: { maxCount: 10 },
                title: 'T',
                visible: true,
                onValueChange,
            });
            const textarea = screen.getByRole('textbox');
            expect(textarea).toHaveAttribute('placeholder', zh_CN.Feedback.placeholder);
            await fireEvent.update(textarea, 'good');
            expect(onValueChange).toHaveBeenLastCalledWith('good');
            expect(submit()).toBeEnabled();
            expect($(`.${BASE_CLASS_PREFIX}-input-textarea-counter`)).toHaveTextContent('4/10');
        });

        it('radio：垂直分组上报所选值', async () => {
            const onValueChange = vi.fn<(...args: unknown[]) => void>();
            const onChange = vi.fn<(event: { target: { value: unknown } }) => void>();
            await renderFeedback({
                type: 'radio',
                radioGroupProps: { options, onChange },
                title: 'T',
                visible: true,
                onValueChange,
            });
            expect($(`.${prefix}-radio-container .${BASE_CLASS_PREFIX}-radioGroup-vertical`)).not.toBeNull();
            await userEvent.click(screen.getByRole('radio', { name: 'B' }));
            expect(onValueChange).toHaveBeenLastCalledWith('b');
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange.mock.calls[0][0].target.value).toBe('b');
            expect(submit()).toBeEnabled();
        });

        it('checkbox：垂直分组上报所选值；未选中任何项时禁用提交', async () => {
            const onValueChange = vi.fn<(...args: unknown[]) => void>();
            const onChange = vi.fn<(...args: unknown[]) => void>();
            await renderFeedback({
                type: 'checkbox',
                checkboxGroupProps: { options, onChange },
                title: 'T',
                visible: true,
                onValueChange,
            });
            expect($(`.${prefix}-checkbox-container .${BASE_CLASS_PREFIX}-checkboxGroup-vertical`)).not.toBeNull();
            await userEvent.click(screen.getByRole('checkbox', { name: 'A' }));
            await userEvent.click(screen.getByRole('checkbox', { name: 'B' }));
            expect(onValueChange).toHaveBeenLastCalledWith(['a', 'b']);
            expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
            expect(submit()).toBeEnabled();
            await userEvent.click(screen.getByRole('checkbox', { name: 'A' }));
            await userEvent.click(screen.getByRole('checkbox', { name: 'B' }));
            expect(onValueChange).toHaveBeenLastCalledWith([]);
            expect(submit()).toBeDisabled();
        });

        it('custom 渲染默认插槽，其他 type 忽略默认插槽', async () => {
            const view = await renderFeedback({ type: 'custom', title: 'T', visible: true }, { default: () => <span>mine</span> });
            expect(screen.getByText('mine')).toBeInTheDocument();
            await update(view, { type: 'text' });
            expect(screen.queryByText('mine')).toBeNull();
            expect(screen.getByRole('textbox')).toBeInTheDocument();
        });

        it('同时存在的两个 Feedback，emoji 单选组互不影响', async () => {
            const view = render(Two);
            await nextTick();
            const groups = screen.getAllByRole('radiogroup');
            const names = groups.map((group) => within(group).getAllByRole('radio')[0].getAttribute('name'));
            expect(names[0]).not.toBe(names[1]);
            const second = within(groups[1]).getAllByRole('radio');
            second[0].focus();
            await userEvent.keyboard('{ArrowRight}');
            expect(second[1]).toBeChecked();
            expect(
                within(groups[0])
                    .getAllByRole('radio')
                    .some((radio) => (radio as HTMLInputElement).checked)
            ).toBe(false);
            expect(emitted(view, 'first')).toEqual([]);
            expect(emitted(view, 'second')).toEqual([[{ emoji: '😐' }]]);
        });

        it('textAreaProps.modelValue 不盖过 Feedback 的值', async () => {
            const onValueChange = vi.fn<(...args: unknown[]) => void>();
            const onChange = vi.fn<(...args: unknown[]) => void>();
            await renderFeedback({
                type: 'text',
                // @ts-expect-error modelValue is omitted from the type; the runtime must still let Feedback's own value win
                textAreaProps: { modelValue: 'fixed', onChange },
                title: 'T',
                visible: true,
                onValueChange,
            });
            const textarea = screen.getByRole('textbox');
            expect(textarea).toHaveValue('');
            await fireEvent.update(textarea, 'typed');
            expect(textarea).toHaveValue('typed');
            expect(onValueChange).toHaveBeenLastCalledWith('typed');
            expect(onChange).toHaveBeenCalledTimes(1);
        });

        it('textAreaProps.onChange 被调用，且不替换上报的值', async () => {
            const onValueChange = vi.fn<(...args: unknown[]) => void>();
            const onChange = vi.fn<(...args: unknown[]) => void>();
            const view = await renderFeedback({
                type: 'text',
                textAreaProps: { onChange },
                title: 'T',
                visible: true,
                onValueChange,
            });
            await fireEvent.update(screen.getByRole('textbox'), 'good');
            expect(onValueChange).toHaveBeenLastCalledWith('good');
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith('good', expect.objectContaining({ type: 'input' }));

            await update(view, { type: 'emoji' });
            await userEvent.click(screen.getByText('😞'));
            await fireEvent.update(screen.getByRole('textbox'), 'slow');
            expect(onValueChange).toHaveBeenLastCalledWith({ emoji: '😞', text: 'slow' });
            expect(onChange).toHaveBeenCalledTimes(2);
        });

        it('radioGroupProps.modelValue 不盖过 Feedback 的值', async () => {
            const onValueChange = vi.fn<(...args: unknown[]) => void>();
            const onChange = vi.fn<(...args: unknown[]) => void>();
            await renderFeedback({
                type: 'radio',
                // @ts-expect-error modelValue is omitted from the type; the runtime must still let Feedback's own value win
                radioGroupProps: { options, modelValue: 'a', onChange },
                title: 'T',
                visible: true,
                onValueChange,
            });
            expect(screen.getByRole('radio', { name: 'A' })).not.toBeChecked();
            await userEvent.click(screen.getByRole('radio', { name: 'B' }));
            expect(screen.getByRole('radio', { name: 'B' })).toBeChecked();
            expect(screen.getByRole('radio', { name: 'A' })).not.toBeChecked();
            expect(onValueChange).toHaveBeenLastCalledWith('b');
            expect(onChange).toHaveBeenCalledTimes(1);
        });

        it('checkboxGroupProps.modelValue 不盖过 Feedback 的值', async () => {
            const onValueChange = vi.fn<(...args: unknown[]) => void>();
            const onChange = vi.fn<(...args: unknown[]) => void>();
            await renderFeedback({
                type: 'checkbox',
                // @ts-expect-error modelValue is omitted from the type; the runtime must still let Feedback's own value win
                checkboxGroupProps: { options, modelValue: ['a'], onChange },
                title: 'T',
                visible: true,
                onValueChange,
            });
            expect(screen.getByRole('checkbox', { name: 'A' })).not.toBeChecked();
            await userEvent.click(screen.getByRole('checkbox', { name: 'B' }));
            expect(screen.getByRole('checkbox', { name: 'B' })).toBeChecked();
            expect(screen.getByRole('checkbox', { name: 'A' })).not.toBeChecked();
            expect(onValueChange).toHaveBeenLastCalledWith(['b']);
            expect(onChange).toHaveBeenLastCalledWith(['b']);
        });
    });

    describe('提交与取消', () => {
        it('popup：提交与取消上报点击并清空值', async () => {
            const onOk = vi.fn<(...args: unknown[]) => void>();
            const onCancel = vi.fn<(...args: unknown[]) => void>();
            await renderFeedback({ title: 'T', visible: true, onCancel, onOk });
            await userEvent.click(screen.getByText('😃'));
            await userEvent.click(submit());
            expect(onOk).toHaveBeenCalledTimes(1);
            expect(onOk.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
            expect(submit()).toBeDisabled();
            expect(emojiItem('😃')).not.toHaveClass(`${prefix}-emoji-item-selected`);

            await userEvent.click(screen.getByText('😐'));
            await userEvent.click(cancel());
            expect(onCancel).toHaveBeenCalledTimes(1);
            expect(onCancel.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
            expect(submit()).toBeDisabled();
        });

        it('popup：text 提交与取消后输入框清空', async () => {
            await renderFeedback({ type: 'text', title: 'T', visible: true });
            const textarea = screen.getByRole('textbox');
            await fireEvent.update(textarea, 'good');
            await userEvent.click(submit());
            expect(textarea).toHaveValue('');
            expect(submit()).toBeDisabled();
            await fireEvent.update(textarea, 'again');
            await userEvent.click(cancel());
            expect(textarea).toHaveValue('');
        });

        it('popup：radio 提交后选项复位', async () => {
            await renderFeedback({ type: 'radio', radioGroupProps: { options }, title: 'T', visible: true });
            await userEvent.click(screen.getByRole('radio', { name: 'B' }));
            expect(screen.getByRole('radio', { name: 'B' })).toBeChecked();
            await userEvent.click(submit());
            expect(screen.getByRole('radio', { name: 'B' })).not.toBeChecked();
            expect(submit()).toBeDisabled();
        });

        it('popup：checkbox 提交后选项复位', async () => {
            await renderFeedback({ type: 'checkbox', checkboxGroupProps: { options }, title: 'T', visible: true });
            await userEvent.click(screen.getByRole('checkbox', { name: 'A' }));
            expect(screen.getByRole('checkbox', { name: 'A' })).toBeChecked();
            await userEvent.click(submit());
            expect(screen.getByRole('checkbox', { name: 'A' })).not.toBeChecked();
            expect(submit()).toBeDisabled();
        });

        it('onOk 与 onCancel 显式传 null 时提交、取消不抛错', async () => {
            const errors: unknown[] = [];
            const onError = (event: ErrorEvent) => {
                errors.push(event.error);
                event.preventDefault();
            };
            window.addEventListener('error', onError);
            const view = await renderFeedback({
                type: 'text',
                title: 'T',
                visible: true,
                onCancel: null as never,
                onOk: null as never,
            });
            await fireEvent.update(screen.getByRole('textbox'), 'good');
            await userEvent.click(submit());
            await fireEvent.update(screen.getByRole('textbox'), 'good');
            await userEvent.click(cancel());
            await update(view, { motion: false, visible: false });
            window.removeEventListener('error', onError);
            expect(errors).toEqual([]);
        });

        it('popup：关闭图标执行取消', async () => {
            const onCancel = vi.fn<(...args: unknown[]) => void>();
            await renderFeedback({ title: 'T', visible: true, onCancel });
            await userEvent.click(screen.getByRole('button', { name: zh_CN.SideSheet.close }));
            expect(onCancel).toHaveBeenCalledTimes(1);
        });

        it('popup：Esc 关闭时 onCancel 收到原生 KeyboardEvent，类型声明与之一致', async () => {
            const onCancel = vi.fn<(...args: unknown[]) => void>();
            await renderFeedback({ title: 'T', closeOnEsc: true, visible: true, onCancel });
            await fireEvent.keyDown(document, { key: 'Escape' });
            expect(onCancel).toHaveBeenCalledTimes(1);
            expect(onCancel.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
            expectTypeOf<Parameters<NonNullable<FeedbackProps['onCancel']>>[0]>().toEqualTypeOf<MouseEvent | KeyboardEvent>();
            expectTypeOf<Parameters<NonNullable<FeedbackProps['onOk']>>[0]>().toEqualTypeOf<MouseEvent>();
        });

        it('popup：onOk 返回的 Promise 显示加载态，resolve 后清空值', async () => {
            let resolve!: () => void;
            const onOk = vi.fn<() => Promise<void>>(() => new Promise<void>((r) => (resolve = r)));
            await renderFeedback({ title: 'T', visible: true, onOk });
            await userEvent.click(screen.getByText('😃'));
            await userEvent.click(submit());
            expect(submit()).toHaveClass(`${BASE_CLASS_PREFIX}-button-loading`);
            expect(submit()).toBeEnabled();
            resolve();
            await waitFor(() => expect(submit()).not.toHaveClass(`${BASE_CLASS_PREFIX}-button-loading`));
            expect(submit()).toBeDisabled();
        });

        it('popup：onCancel 返回的 Promise 在取消按钮上显示加载态', async () => {
            let resolve!: () => void;
            const onCancel = vi.fn<() => Promise<void>>(() => new Promise<void>((r) => (resolve = r)));
            await renderFeedback({ title: 'T', visible: true, onCancel });
            await userEvent.click(screen.getByText('😃'));
            await userEvent.click(cancel());
            expect(cancel()).toHaveClass(`${BASE_CLASS_PREFIX}-button-loading`);
            expect(submit()).toBeEnabled();
            resolve();
            await waitFor(() => expect(cancel()).not.toHaveClass(`${BASE_CLASS_PREFIX}-button-loading`));
            expect(submit()).toBeDisabled();
        });

        it('modal：确定与取消上报点击并清空值', async () => {
            const onOk = vi.fn<(...args: unknown[]) => void>();
            const onCancel = vi.fn<(...args: unknown[]) => void>();
            await renderFeedback({ mode: 'modal', title: 'T', motion: false, visible: true, onCancel, onOk });
            await userEvent.click(screen.getByText('😃'));
            await userEvent.click(submit());
            expect(onOk.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
            expect(submit()).toBeDisabled();

            await userEvent.click(screen.getByText('😐'));
            await userEvent.click(cancel());
            expect(onCancel.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
            expect(submit()).toBeDisabled();
        });

        it('modal：onOk 返回的 Promise 在 resolve 前保留值', async () => {
            let resolve!: () => void;
            const onOk = vi.fn<() => Promise<void>>(() => new Promise<void>((r) => (resolve = r)));
            await renderFeedback({ mode: 'modal', title: 'T', motion: false, visible: true, onOk });
            await userEvent.click(screen.getByText('😃'));
            await userEvent.click(submit());
            expect(submit()).toHaveClass(`${BASE_CLASS_PREFIX}-button-loading`);
            expect(emojiItem('😃')).toHaveClass(`${prefix}-emoji-item-selected`);
            resolve();
            await waitFor(() => expect(submit()).toBeDisabled());
            expect(emojiItem('😃')).not.toHaveClass(`${prefix}-emoji-item-selected`);
        });
    });

    describe('v-model:visible', () => {
        it('popup：取消按钮、关闭图标、Esc 都使 visible 变 false，且各只发一次', async () => {
            for (const close of [() => userEvent.click(cancel()), () => userEvent.click(screen.getByRole('button', { name: zh_CN.SideSheet.close })), () => fireEvent.keyDown(document, { key: 'Escape' })]) {
                const onUpdate = vi.fn<(...args: unknown[]) => void>();
                const view = await renderFeedback({
                    closeOnEsc: true,
                    title: 'T',
                    visible: true,
                    'onUpdate:visible': onUpdate,
                });
                await close();
                await nextTick();
                expect(onUpdate.mock.calls).toEqual([[false]]);
                view.unmount();
            }
        });

        it('popup：v-model 路径下 Esc 使绑定的 visible 变 false', async () => {
            await renderModel({ closeOnEsc: true });
            await fireEvent.keyDown(document, { key: 'Escape' });
            expect(visibleOutput()).toBe('false');
        });

        it('modal：取消按钮、关闭按钮、遮罩点击、Esc 都使 visible 变 false', async () => {
            for (const close of [() => userEvent.click(cancel()), () => userEvent.click(screen.getByRole('button', { name: zh_CN.Modal.close })), () => userEvent.click($(`.${modalCls}-wrap`) as HTMLElement), () => fireEvent.keyDown(document, { key: 'Escape' })]) {
                const view = await renderModel({ mode: 'modal', motion: false });
                expect(visibleOutput()).toBe('true');
                await close();
                await nextTick();
                expect(visibleOutput()).toBe('false');
                view.unmount();
            }
        });

        it('update:visible 只发一次，确定按钮不发', async () => {
            const onUpdate = vi.fn<(...args: unknown[]) => void>();
            const view = await renderFeedback({ title: 'T', visible: true, 'onUpdate:visible': onUpdate });
            await userEvent.click(screen.getByText('😃'));
            await userEvent.click(submit());
            expect(onUpdate).not.toHaveBeenCalled();
            await userEvent.click(screen.getByRole('button', { name: zh_CN.SideSheet.close }));
            expect(onUpdate).toHaveBeenCalledTimes(1);
            expect(onUpdate).toHaveBeenCalledWith(false);
            expect(emitted(view, 'update:visible')).toEqual([[false]]);
        });

        it('modal：onCancel 返回 Promise 时 fulfill 后才发 update:visible，reject 不发', async () => {
            let resolve!: () => void;
            let reject!: (reason?: unknown) => void;
            const onUpdate = vi.fn<(...args: unknown[]) => void>();
            const promises = [new Promise<void>((r) => (resolve = r)), new Promise<void>((_, r) => (reject = r))];
            promises[1].catch(() => {});
            const onCancel = vi.fn<() => Promise<void>>(() => promises.shift() as Promise<void>);
            await renderFeedback({
                mode: 'modal',
                title: 'T',
                motion: false,
                visible: true,
                onCancel,
                'onUpdate:visible': onUpdate,
            });
            await userEvent.click(cancel());
            expect(onUpdate).not.toHaveBeenCalled();
            resolve();
            await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
            await userEvent.click(cancel());
            reject(new Error('no'));
            await nextTick();
            await nextTick();
            expect(onUpdate).toHaveBeenCalledTimes(1);
        });

        it('单向绑定：取消后仍显示，不自翻转', async () => {
            const onUpdate = vi.fn<(...args: unknown[]) => void>();
            const view = await renderFeedback({ title: 'T', visible: true, 'onUpdate:visible': onUpdate });
            await userEvent.click(cancel());
            expect(onUpdate).toHaveBeenCalledWith(false);
            expect($(`.${sheetCls}`)).not.toBeNull();
            await update(view, { visible: true });
            expect($(`.${sheetCls}`)).not.toBeNull();
        });
    });

    describe('afterClose 与 afterVisibleChange', () => {
        it('modal：弹窗隐藏后执行一次 afterClose，监听器不落到 DOM', async () => {
            const afterClose = vi.fn<(...args: unknown[]) => void>();
            const afterVisibleChange = vi.fn<(...args: unknown[]) => void>();
            const view = await renderFeedback({
                mode: 'modal',
                motion: false,
                title: 'T',
                visible: true,
                onAfterClose: afterClose,
                onAfterVisibleChange: afterVisibleChange,
            });
            expect(afterClose).not.toHaveBeenCalled();
            // Vue binds unknown onXxx attrs with addEventListener(hyphenated name), so dispatch to detect leaks.
            for (const el of document.body.querySelectorAll('*')) {
                el.dispatchEvent(new Event('after-visible-change'));
                el.dispatchEvent(new Event('after-close'));
            }
            expect(afterVisibleChange).not.toHaveBeenCalled();
            expect(afterClose).not.toHaveBeenCalled();
            await update(view, { visible: false });
            expect(afterClose).toHaveBeenCalledTimes(1);
        });

        it('popup：抽屉隐藏后与 afterVisibleChange 一起执行一次 afterClose', async () => {
            const afterClose = vi.fn<(...args: unknown[]) => void>();
            const afterVisibleChange = vi.fn<(...args: unknown[]) => void>();
            const props = {
                motion: false,
                title: 'T',
                onAfterClose: afterClose,
                onAfterVisibleChange: afterVisibleChange,
            };
            const view = await renderFeedback({ visible: true, ...props });
            expect(afterClose).not.toHaveBeenCalled();
            await update(view, { visible: false });
            expect(afterClose).toHaveBeenCalledTimes(1);
            expect(afterVisibleChange).toHaveBeenLastCalledWith(false);
            await update(view, { visible: true });
            expect(afterVisibleChange).toHaveBeenLastCalledWith(true);
            expect(afterClose).toHaveBeenCalledTimes(1);
        });

        it('modal 模式不发 afterVisibleChange', async () => {
            const afterVisibleChange = vi.fn<(...args: unknown[]) => void>();
            const view = await renderFeedback({
                mode: 'modal',
                motion: false,
                title: 'T',
                visible: true,
                onAfterVisibleChange: afterVisibleChange,
            });
            await update(view, { visible: false });
            expect(afterVisibleChange).not.toHaveBeenCalled();
        });

        it('事件载荷类型', () => {
            expectTypeOf<FeedbackEmits['update:visible']>().toEqualTypeOf<[visible: boolean]>();
            expectTypeOf<FeedbackEmits['afterVisibleChange']>().toEqualTypeOf<[visible: boolean]>();
        });
    });

    describe('按钮属性', () => {
        it('popup：cancelButtonProps 的 class 与 okButtonProps 的 disabled 生效', async () => {
            await renderFeedback({
                cancelButtonProps: { class: 'my-cancel' },
                okButtonProps: { disabled: false },
                title: 'T',
                visible: true,
            });
            expect(submit()).toBeEnabled();
            expect(cancel()).toHaveClass('my-cancel');
        });

        it('modal：okButtonProps 的 class 生效，未给 disabled 时仍按值禁用', async () => {
            const view = await renderFeedback({
                mode: 'modal',
                motion: false,
                okButtonProps: { class: 'my-ok' },
                title: 'T',
                visible: true,
            });
            expect(submit()).toHaveClass('my-ok');
            expect(submit()).toBeDisabled();
            await update(view, { okButtonProps: { class: 'my-ok', disabled: false } });
            expect(submit()).toBeEnabled();
        });

        it.each(['popup', 'modal'] as const)('%s：使用方 okButtonProps.onClick 先调用，内置处理仍执行', async (mode) => {
            const order: string[] = [];
            const onOk = vi.fn<() => void>(() => void order.push('ok'));
            await renderFeedback({
                mode,
                motion: false,
                okButtonProps: { onClick: () => order.push('click'), disabled: false },
                title: 'T',
                visible: true,
                onOk,
            });
            await userEvent.click(submit());
            expect(order).toEqual(['click', 'ok']);
        });

        it.each(['popup', 'modal'] as const)('%s：使用方 cancelButtonProps.onClick 先调用', async (mode) => {
            const order: string[] = [];
            await renderFeedback({
                mode,
                motion: false,
                cancelButtonProps: { onClick: () => order.push('click') },
                title: 'T',
                visible: true,
                onCancel: () => void order.push('cancel'),
            });
            await userEvent.click(cancel());
            expect(order).toEqual(['click', 'cancel']);
        });

        it.each(['popup', 'modal'] as const)('%s：使用方 loading 与内置挂起态任一为真则加载', async (mode) => {
            let resolve!: () => void;
            const onOk = vi.fn<() => Promise<void>>(() => new Promise<void>((r) => (resolve = r)));
            const view = await renderFeedback({
                mode,
                motion: false,
                okButtonProps: { loading: false },
                title: 'T',
                visible: true,
                onOk,
            });
            await userEvent.click(screen.getByText('😃'));
            expect(submit()).not.toHaveClass(`${BASE_CLASS_PREFIX}-button-loading`);
            await userEvent.click(submit());
            expect(submit()).toHaveClass(`${BASE_CLASS_PREFIX}-button-loading`);
            resolve();
            await waitFor(() => expect(submit()).not.toHaveClass(`${BASE_CLASS_PREFIX}-button-loading`));
            await update(view, { okButtonProps: { loading: true, disabled: false } });
            expect(submit()).toHaveClass(`${BASE_CLASS_PREFIX}-button-loading`);
        });

        it('popup：okButtonProps.autoFocus 使确定按钮在打开时获得焦点', async () => {
            await renderFeedback({ okButtonProps: { autoFocus: true, disabled: false }, title: 'T', visible: true });
            expect(submit()).toHaveAttribute('autofocus');
            await waitFor(() => expect(submit()).toHaveFocus());
        });

        it('单选值为 0 或 false 时提交按钮可用', async () => {
            const onValueChange = vi.fn<(...args: unknown[]) => void>();
            await renderFeedback({
                type: 'radio',
                radioGroupProps: {
                    options: [
                        { label: 'Zero', value: 0 },
                        { label: 'No', value: false },
                    ],
                },
                title: 'T',
                visible: true,
                onValueChange,
            });
            await userEvent.click(screen.getByRole('radio', { name: 'Zero' }));
            expect(onValueChange).toHaveBeenLastCalledWith(0);
            expect(submit()).toBeEnabled();
            await userEvent.click(screen.getByRole('radio', { name: 'No' }));
            expect(onValueChange).toHaveBeenLastCalledWith(false);
            expect(submit()).toBeEnabled();
        });

        it('判空函数：只有 null、undefined、空串、空数组为空', () => {
            expect([null, undefined, '', []].map((value) => isFeedbackValueEmpty(value))).toEqual([true, true, true, true]);
            expect([0, false, 'a', [0], {}, { emoji: '😃' }].map((value) => isFeedbackValueEmpty(value))).toEqual(Array(6).fill(false));
        });
    });

    describe('插槽', () => {
        it.each(['popup', 'modal'] as const)('%s：#footer 替换默认页脚，空 #footer 隐藏页脚', async (mode) => {
            const view = render(ToggleFooter, { props: { mode, custom: true } });
            await nextTick();
            expect(screen.getByText('own footer')).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: '提交' })).toBeNull();
            await view.rerender({ custom: false });
            await nextTick();
            expect(screen.queryByText('own footer')).toBeNull();
            expect(submit()).toBeInTheDocument();
            await view.rerender({ custom: true });
            await nextTick();
            expect(screen.getByText('own footer')).toBeInTheDocument();
        });

        it.each(['popup', 'modal'] as const)('%s：空 #footer 不渲染页脚区', async (mode) => {
            await renderFeedback({ mode, motion: false, title: 'T', visible: true }, { footer: () => [] });
            expect(screen.queryByRole('button', { name: '提交' })).toBeNull();
            expect($(`.${prefix}-footer`)).toBeNull();
            expect($(`.${modalCls}-footer`)).toBeNull();
            expect($(`.${sheetCls}-footer`)).toBeNull();
        });

        it('#title 优先于 title，#closeIcon 空内容回落默认图标', async () => {
            await renderFeedback({ title: 'plain', visible: true }, { title: () => <em>slot title</em>, closeIcon: () => [] });
            expect($(`.${sheetCls}-title`)).toHaveTextContent('slot title');
            expect(screen.getByRole('button', { name: zh_CN.SideSheet.close }).querySelector('svg')).not.toBeNull();
        });

        it('modal 专属的 #header、#icon、#modal 转发，popup 下无效', async () => {
            const slots: SlotMap = {
                header: () => <div id="own-header">own header</div>,
                icon: () => <i id="own-icon" />,
                modal: ((props: { modal: Component }) => <div id="wrap">{h(props.modal)}</div>) as never,
            };
            const view = await renderFeedback({ mode: 'modal', motion: false, title: 'T', visible: true }, slots);
            expect($('#own-header')).not.toBeNull();
            expect($('#wrap')).toContainElement(screen.getByRole('dialog'));
            view.unmount();
            await renderFeedback({ title: 'T', visible: true }, slots);
            expect($('#own-header')).toBeNull();
            expect($('#wrap')).toBeNull();
        });

        it('#icon 转发到 modal 标题图标区，popup 下无效', async () => {
            const slots: SlotMap = { icon: () => <i id="own-icon" /> };
            const view = await renderFeedback({ mode: 'modal', motion: false, title: 'T', visible: true }, slots);
            expect($('.semi-modal-icon-wrapper #own-icon')).not.toBeNull();
            view.unmount();
            await renderFeedback({ title: 'T', visible: true }, slots);
            expect($('#own-icon')).toBeNull();
        });

        it('#content 包裹内置内容', async () => {
            await renderFeedback(
                { type: 'text', title: 'T', visible: true },
                {
                    content: ((props: { content: Component }) => <div data-testid="wrap">{h(props.content)}</div>) as never,
                }
            );
            expect(screen.getByTestId('wrap')).toContainElement(screen.getByRole('textbox'));
        });

        it('#content 可以忽略内置内容，type 变化时包装节点不重挂载', async () => {
            const view = await renderFeedback(
                { type: 'text', title: 'T', visible: true },
                {
                    content: ((props: { content: Component }) => <div data-testid="wrap">{h(props.content)}</div>) as never,
                }
            );
            const wrap = screen.getByTestId('wrap');
            await update(view, { type: 'radio', radioGroupProps: { options } });
            expect(screen.getByTestId('wrap')).toBe(wrap);
            expect(within(wrap).getAllByRole('radio')).toHaveLength(2);

            const own = await renderFeedback({ type: 'custom', title: 'T', visible: true }, { content: () => <p>only mine</p>, default: () => <p>ignored</p> });
            expect(screen.getByText('only mine')).toBeInTheDocument();
            expect(screen.queryByText('ignored')).toBeNull();
            own.unmount();
        });

        it('#radioLabel 与 #radioExtra 收到 { option, index }，未传时渲染 label 文本', async () => {
            const view = await renderFeedback({
                type: 'radio',
                radioGroupProps: {
                    options: [
                        { label: 'A', value: 'a', extra: 'ea' },
                        { label: 'B', value: 'b' },
                    ],
                },
                title: 'T',
                visible: true,
            });
            expect(screen.getByRole('radio', { name: /A/ })).toBeInTheDocument();
            view.unmount();
            await renderFeedback(
                {
                    type: 'radio',
                    radioGroupProps: {
                        options: [
                            { label: 'A', value: 'a', extra: 'ea' },
                            { label: 'B', value: 'b' },
                        ],
                    },
                    title: 'T',
                    visible: true,
                },
                {
                    radioLabel: ((props: { option: { label: string }; index: number }) => <b>{`L${props.index}:${props.option.label}`}</b>) as never,
                    radioExtra: ((props: { option: { extra?: string }; index: number }) => <i>{`E${props.index}:${props.option.extra ?? '-'}`}</i>) as never,
                }
            );
            expect(screen.getByText('L0:A')).toBeInTheDocument();
            expect(screen.getByText('L1:B')).toBeInTheDocument();
            expect(screen.getByText('E0:ea')).toBeInTheDocument();
        });

        it('#checkboxLabel 与 #checkboxExtra 收到 { option, index }', async () => {
            await renderFeedback(
                {
                    type: 'checkbox',
                    checkboxGroupProps: {
                        options: [
                            { label: 'A', value: 'a', extra: 'ea' },
                            { label: 'B', value: 'b' },
                        ],
                    },
                    title: 'T',
                    visible: true,
                },
                {
                    checkboxLabel: ((props: { option: { label: string }; index: number }) => <b>{`L${props.index}:${props.option.label}`}</b>) as never,
                    checkboxExtra: ((props: { option: { extra?: string }; index: number }) => <i>{`E${props.index}:${props.option.extra ?? '-'}`}</i>) as never,
                }
            );
            expect(screen.getByText('L1:B')).toBeInTheDocument();
            expect(screen.getByText('E0:ea')).toBeInTheDocument();
        });
    });

    describe('attrs 与透传', () => {
        it('style 与 data-* 落在 Modal 和 SideSheet 各自的位置', async () => {
            const view = await renderFeedback({
                style: { color: 'red' },
                'data-testid': 'fb',
                title: 'T',
                visible: true,
            });
            expect(screen.getByTestId('fb')).toHaveClass(sheetCls);
            expect($(`.${sheetCls}-inner`)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
            view.unmount();
            await renderFeedback({
                style: { color: 'red' },
                'data-testid': 'fb',
                mode: 'modal',
                motion: false,
                title: 'T',
                visible: true,
            });
            expect(screen.getByTestId('fb')).toHaveClass(prefix);
            expect($(`.${modalCls}`)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        });

        it('两种模式下 class 都落在根元素上并与 semi-feedback 合并', async () => {
            const view = await renderFeedback({ class: 'mine', title: 'T', visible: true });
            expect($(`div.${sheetCls}`)).toHaveClass(prefix, 'mine');
            expect($('.class')).toBeNull();
            view.unmount();
            await renderFeedback({ class: 'mine', mode: 'modal', motion: false, title: 'T', visible: true });
            expect($(`.${prefix}`)).toHaveClass('mine');
            expect($('.class')).toBeNull();
        });

        it.each(['popup', 'modal'] as const)('%s：aria-* 落在 role="dialog" 元素上', async (mode) => {
            await renderFeedback({
                mode,
                motion: false,
                title: 'T',
                visible: true,
                'aria-label': 'Custom name',
                'aria-describedby': 'desc',
            });
            const dialog = screen.getByRole('dialog', { name: 'Custom name' });
            expect(dialog).toHaveAttribute('aria-describedby', 'desc');
        });

        it('透传到 Modal 的 kebab-case 键', async () => {
            const onUpdate = vi.fn<(...args: unknown[]) => void>();
            await renderFeedback({
                mode: 'modal',
                motion: false,
                title: 'T',
                visible: true,
                width: 321,
                'mask-closable': false,
                'ok-text': 'Go',
                'onUpdate:visible': onUpdate,
            });
            expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
            expect($(`.${modalCls}-wrap [style*="width: 321px"]`)).not.toBeNull();
            await userEvent.click($(`.${modalCls}-wrap`) as HTMLElement);
            expect(onUpdate).not.toHaveBeenCalled();
        });

        it('popup：close-on-esc 与 width 透传到 SideSheet', async () => {
            const onUpdate = vi.fn<(...args: unknown[]) => void>();
            await renderFeedback({
                title: 'T',
                visible: true,
                motion: false,
                placement: 'right',
                width: 321,
                'close-on-esc': '',
                'onUpdate:visible': onUpdate,
            });
            expect($(`div.${sheetCls}`)).toHaveStyle({ width: '321px' });
            await fireEvent.keyDown(document, { key: 'Escape' });
            expect(onUpdate.mock.calls).toEqual([[false]]);
        });

        it.each([
            ['popup', sheetCls],
            ['modal', modalCls],
        ] as const)('%s：motion 透传，false 时隐藏即同步卸载', async (mode, cls) => {
            const view = await renderFeedback({ mode, motion: false, title: 'T', visible: true });
            expect($(`.${cls}`)).not.toBeNull();
            await update(view, { visible: false });
            expect($(`.${cls}`)).toBeNull();
            view.unmount();
            const control = await renderFeedback({ mode, title: 'T', visible: true });
            await update(control, { visible: false });
            expect($(`.${cls}`)).not.toBeNull();
        });

        it('popup 的默认 placement、mask 可以被使用方覆盖', async () => {
            const view = await renderFeedback({ title: 'T', visible: true });
            expect($(`.${sheetCls}-bottom`)).not.toBeNull();
            expect($(`.${sheetCls}-mask`)).toBeNull();
            view.unmount();
            await renderFeedback({ title: 'T', visible: true, placement: 'right', mask: true });
            expect($(`.${sheetCls}-right`)).not.toBeNull();
            expect($(`.${sheetCls}-mask`)).not.toBeNull();
        });

        it('显式传入 undefined 的 mask、okText、placement 仍使用内置值', async () => {
            const view = await renderFeedback({ title: 'T', visible: true, mask: undefined, placement: undefined });
            expect($(`.${sheetCls}-bottom`)).not.toBeNull();
            expect($(`.${sheetCls}-mask`)).toBeNull();
            view.unmount();
            await renderFeedback({ mode: 'modal', title: 'T', visible: true, okText: undefined });
            expect(submit()).toBeTruthy();
        });

        it('未声明的监听器落到最外层元素', async () => {
            const onKeydown = vi.fn<(...args: unknown[]) => void>();
            const onClick = vi.fn<(...args: unknown[]) => void>();
            await renderFeedback({
                title: 'T',
                visible: true,
                'data-testid': 'fb',
                onKeydown,
                onClick,
            });
            await userEvent.click(screen.getByTestId('fb'));
            expect(onClick).toHaveBeenCalled();
            await fireEvent.keyDown(screen.getByTestId('fb'), { key: 'a' });
            expect(onKeydown).toHaveBeenCalled();
        });
    });

    describe('全局默认值', () => {
        it('从 semiGlobal 读取 mode、type 与 okButtonProps，传入值优先', async () => {
            semiGlobal.config.overrideDefaultProps = {
                Feedback: { mode: 'modal', type: 'text', okButtonProps: { class: 'global-ok' } },
                Modal: { motion: false },
            };
            const view = await renderFeedback({ title: 'T', visible: true });
            expect($(`.${prefix}.${prefix}-text`)).not.toBeNull();
            expect($(`.${modalCls}`)).not.toBeNull();
            expect(screen.getByRole('textbox')).toBeInTheDocument();
            expect(submit()).toHaveClass('global-ok');
            await update(view, { mode: 'popup', type: 'emoji', okButtonProps: { class: 'mine' } });
            expect($(`.${sheetCls}`)).not.toBeNull();
            expect(submit()).toHaveClass('mine');
            expect(submit()).not.toHaveClass('global-ok');
        });

        it('全局 textAreaProps 生效，传入值整体替换', async () => {
            semiGlobal.config.overrideDefaultProps = { Feedback: { textAreaProps: { maxCount: 10 } } };
            const view = await renderFeedback({ type: 'text', title: 'T', visible: true });
            await fireEvent.update(screen.getByRole('textbox'), 'good');
            expect($(`.${BASE_CLASS_PREFIX}-input-textarea-counter`)).toHaveTextContent('4/10');
            await update(view, { textAreaProps: { rows: 5 } });
            expect($(`.${BASE_CLASS_PREFIX}-input-textarea-counter`)).toBeNull();
        });

        it('全局 onOk 回落，app 级配置优先于模块级配置', async () => {
            const moduleOk = vi.fn<(...args: unknown[]) => void>();
            const appOk = vi.fn<(...args: unknown[]) => void>();
            semiGlobal.config.overrideDefaultProps = { Feedback: { onOk: moduleOk } };
            const view = await renderFeedback({ title: 'T', visible: true });
            await userEvent.click(screen.getByText('😃'));
            await userEvent.click(submit());
            expect(moduleOk).toHaveBeenCalledTimes(1);
            view.unmount();

            render(Feedback, {
                props: { title: 'T', visible: true },
                global: {
                    provide: {
                        [semiGlobalKey as symbol]: { config: { overrideDefaultProps: { Feedback: { onOk: appOk } } } },
                    },
                },
            });
            await nextTick();
            await userEvent.click(screen.getByText('😃'));
            await userEvent.click(submit());
            expect(appOk).toHaveBeenCalledTimes(1);
            expect(moduleOk).toHaveBeenCalledTimes(1);
        });
    });

    describe('ref 与 KeepAlive', () => {
        it('ref.root 指向 SideSheet 或 Modal 的外层包裹元素，未显示时为 null', async () => {
            const probe: { handle: FeedbackHandle | null } = { handle: null };
            const onReady = (handle: FeedbackHandle | null) => {
                probe.handle = handle;
            };
            const view = render(HandleHost, { props: { mode: 'popup', visible: true, onReady } });
            await nextTick();
            expect(probe.handle?.root).toBe($(`div.${sheetCls}`));
            await view.rerender({ mode: 'modal' });
            await nextTick();
            expect(probe.handle?.root).toBe($(`.${prefix}`));
            await view.rerender({ visible: false });
            await nextTick();
            expect(probe.handle?.root).toBeNull();
        });

        it.each(['popup', 'modal'] as const)('%s：KeepAlive 失活时释放 inert 与滚动锁，激活后恢复', async (mode) => {
            const page = document.body.appendChild(document.createElement('main'));
            const view = render(Cached, { props: { shown: true, mode } });
            await nextTick();
            const modal = mode === 'modal';
            expect(Boolean(page.inert)).toBe(modal);
            await view.rerender({ shown: false });
            await nextTick();
            expect(screen.queryByRole('dialog')).toBeNull();
            expect(Boolean(page.inert)).toBe(false);
            expect(document.body.style.overflow).toBe('');
            await view.rerender({ shown: true });
            await nextTick();
            expect(screen.getByRole('dialog', { name: 'Feedback' })).toBeInTheDocument();
            expect(Boolean(page.inert)).toBe(modal);
            page.remove();
        });
    });

    it('FeedbackFullProps 按 mode 判别', () => {
        expectTypeOf<Extract<FeedbackFullProps, { mode: 'modal' }>>().toHaveProperty('okText');
        expectTypeOf<Extract<FeedbackFullProps, { mode?: 'popup' }>>().toHaveProperty('placement');
    });
});

describe('Feedback 控制台', () => {
    let warn: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
        warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => warn.mockRestore());

    it('modal 模式下开发模式无 Vue 告警', async () => {
        await renderFeedback({
            mode: 'modal',
            motion: false,
            title: 'T',
            visible: true,
            'aria-label': 'x',
            class: 'c',
        });
        expect(warn.mock.calls.filter(([message]: unknown[]) => String(message).includes('[Vue warn]'))).toEqual([]);
    });
});
