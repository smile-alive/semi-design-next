import { flushSync, tick } from 'svelte';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { FeedbackProps } from '../interface';
import ConfigFixture from './config-fixture.svelte';
import FeedbackFixture from './feedback-fixture.svelte';
import FeedbackModes from './feedback-modes.svelte';
import Two from './two.svelte';

type Store = NonNullable<Parameters<typeof FeedbackFixture>[1]>['store'];
type Handle = { getRoot: () => HTMLDivElement | null } | null;

const prefix = `${BASE_CLASS_PREFIX}-feedback`;
const sheetCls = `${BASE_CLASS_PREFIX}-sidesheet`;
const modalCls = `${BASE_CLASS_PREFIX}-modal`;
const loadingCls = `${BASE_CLASS_PREFIX}-button-loading`;
const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
const submit = () => screen.getByRole('button', { name: zh_CN.Feedback.submit });
const cancel = () => screen.getByRole('button', { name: zh_CN.Feedback.cancel });
const closeIcon = () => screen.getByRole('button', { name: zh_CN.SideSheet.close });
const emojiItem = (glyph: string) => screen.getByText(glyph).closest(`.${prefix}-emoji-item`);
const visibleOutput = () => screen.getByLabelText('visible').textContent;
const writesOutput = () => screen.getByLabelText('writes').textContent;
const counter = () => $(`.${BASE_CLASS_PREFIX}-input-textarea-counter`);
const options = [
    { label: 'A', value: 'a' },
    { label: 'B', value: 'b' },
];

// The Esc layer and the focus trap open once the dialog has been placed in the portal, a flush after it renders
async function placed() {
    await tick();
    await tick();
}

async function setup(props: Record<string, unknown> = {}, extra: Partial<Store> = {}) {
    const store = createStore<Store>({ props: { title: 'T', visible: true, ...props } as FeedbackProps, ...extra });
    const onReady = vi.fn<(handle: Handle) => void>();
    const view = render(FeedbackFixture, { props: { store, onReady } });
    flushSync();
    await placed();
    return { store, view, onReady };
}

function update(store: Store, props: Record<string, unknown>) {
    Object.assign(store.props, props);
    flushSync();
}

async function click(element: Element) {
    await userEvent.click(element);
    flushSync();
}

function typeText(element: Element, value: string) {
    void fireEvent.input(element, { target: { value } });
    flushSync();
}

function pressEsc() {
    void fireEvent.keyDown(document, { key: 'Escape' });
    flushSync();
}

function deferred() {
    let resolve!: () => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
    document.body.style.overflow = '';
    document.body.style.paddingInlineEnd = '';
});

describe('Svelte Feedback 渲染', () => {
    it('popup 模式渲染 SideSheet，且不把 Feedback 自己的属性泄漏到 DOM', async () => {
        await setup({
            type: 'text',
            'data-testid': 'feedback',
            mode: 'popup',
            afterClose: () => {},
            afterVisibleChange: () => {},
            onCancel: () => {},
            onOk: () => {},
            onValueChange: () => {},
            textAreaProps: { maxCount: 10 },
            radioGroupProps: { options },
            checkboxGroupProps: { options },
        });
        const root = $(`div.${sheetCls}`) as HTMLElement;
        expect(root).toHaveClass(prefix);
        expect(root).toHaveAttribute('data-testid', 'feedback');
        const names = [...root.attributes].map((attribute) => attribute.name);
        expect(names.filter((name) => /after|ok|cancel|valuechange|props|options/i.test(name))).toEqual([]);
    });

    it('默认为底部无遮罩的 emoji 弹层，带语言包页脚', async () => {
        await setup();
        expect($(`div.${sheetCls}`)).toHaveClass(prefix, `${prefix}-emoji`, `${sheetCls}-bottom`);
        expect($(`.${sheetCls}-mask`)).toBeNull();
        expect($(`.${sheetCls}-title`)).toHaveTextContent('T');
        expect($(`.${prefix}-footer`)).not.toBeNull();
        expect(cancel()).toBeEnabled();
        expect(submit()).toBeDisabled();
        expect(document.querySelectorAll(`.${prefix}-emoji-item`)).toHaveLength(3);
    });

    it('modal 模式渲染 Modal，确定按钮等待选择值', async () => {
        await setup({ type: 'text', mode: 'modal', motion: false });
        const root = $(`.${prefix}`) as HTMLElement;
        expect(root).toHaveClass(`${prefix}-text`);
        expect(root.querySelector(`.${modalCls}`)).not.toBeNull();
        expect($(`.${sheetCls}`)).toBeNull();
        expect($(`.${modalCls}-title`)).toHaveTextContent('T');
        expect(submit()).toBeDisabled();
        typeText(screen.getByRole('textbox'), 'hi');
        expect(submit()).toBeEnabled();
    });

    it('visible 默认为 false，不渲染对话框', async () => {
        const { store } = await setup({ visible: undefined });
        expect($(`.${sheetCls}`)).toBeNull();
        update(store, { visible: true });
        expect($(`.${sheetCls}`)).not.toBeNull();
    });

    it('placeholder 与按钮文字跟随语言包', async () => {
        render(ConfigFixture, { props: { props: { locale: ja_JP } } });
        flushSync();
        await placed();
        expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', ja_JP.Feedback.placeholder);
        expect(screen.getByRole('button', { name: ja_JP.Feedback.submit })).toBeInTheDocument();
    });

    it('type 与 mode 切换时内容跟着换', async () => {
        const { store } = await setup({ 'aria-label': 'x' });
        update(store, { type: 'text' });
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        update(store, { type: 'radio', radioGroupProps: { options } });
        expect(screen.getAllByRole('radio')).toHaveLength(2);
        update(store, { mode: 'modal', motion: false, type: 'emoji' });
        await placed();
        expect($(`.${modalCls}`)).not.toBeNull();
        expect(screen.getAllByRole('radio')).toHaveLength(3);
    });
});

describe('Svelte Feedback type', () => {
    it('emoji：选择后上报表情，差评需要填写原因', async () => {
        const onValueChange = vi.fn<(value: unknown) => void>();
        await setup({ textAreaProps: { maxCount: 10 }, onValueChange });
        expect(screen.queryByRole('textbox')).toBeNull();

        await click(screen.getByText('😃'));
        expect(onValueChange).toHaveBeenLastCalledWith({ emoji: '😃' });
        expect(emojiItem('😃')).toHaveClass(`${prefix}-emoji-item-selected`);
        expect(screen.queryByRole('textbox')).toBeNull();
        expect(submit()).toBeEnabled();

        await click(screen.getByText('😞'));
        expect(onValueChange).toHaveBeenLastCalledWith({ emoji: '😞' });
        expect(emojiItem('😃')).not.toHaveClass(`${prefix}-emoji-item-selected`);
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveAttribute('placeholder', zh_CN.Feedback.placeholderOptional);

        typeText(textarea, 'slow');
        expect(onValueChange).toHaveBeenLastCalledWith({ emoji: '😞', text: 'slow' });
        expect(counter()).toHaveTextContent('4/10');
    });

    it('emoji：具名单选组，三个单选项带语言包名称（APG radio group）', async () => {
        const onValueChange = vi.fn<(value: unknown) => void>();
        await setup({ onValueChange });
        const group = screen.getByRole('radiogroup', { name: zh_CN.Feedback.rating });
        const radios = within(group).getAllByRole('radio');
        expect(radios.map((radio) => radio.getAttribute('aria-label'))).toEqual([zh_CN.Feedback.bad, zh_CN.Feedback.normal, zh_CN.Feedback.good]);
        expect(radios.every((radio) => !(radio as HTMLInputElement).checked)).toBe(true);

        await click(radios[0]);
        expect(onValueChange).toHaveBeenLastCalledWith({ emoji: '😞' });
        expect(radios[0]).toBeChecked();
        await click(radios[1]);
        expect(onValueChange).toHaveBeenLastCalledWith({ emoji: '😐' });
        expect(radios[1]).toBeChecked();
        expect(radios[0]).not.toBeChecked();
        expect(radios[1].closest(`.${prefix}-emoji-item`)).toHaveClass(`${prefix}-emoji-item-selected`);
    });

    it('text：输入后上报字符串，textAreaProps 传到 TextArea', async () => {
        const onValueChange = vi.fn<(value: unknown) => void>();
        await setup({ type: 'text', textAreaProps: { maxCount: 10 }, onValueChange });
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveAttribute('placeholder', zh_CN.Feedback.placeholder);
        typeText(textarea, 'good');
        expect(onValueChange).toHaveBeenLastCalledWith('good');
        expect(submit()).toBeEnabled();
        expect(counter()).toHaveTextContent('4/10');
    });

    it('radio：垂直分组上报所选值', async () => {
        const onValueChange = vi.fn<(value: unknown) => void>();
        const onChange = vi.fn<(event: { target: { value: unknown } }) => void>();
        await setup({ type: 'radio', radioGroupProps: { options, onChange }, onValueChange });
        expect($(`.${prefix}-radio-container .${BASE_CLASS_PREFIX}-radioGroup-vertical`)).not.toBeNull();
        await click(screen.getByRole('radio', { name: 'B' }));
        expect(onValueChange).toHaveBeenLastCalledWith('b');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].target.value).toBe('b');
        expect(submit()).toBeEnabled();
    });

    it('checkbox：垂直分组上报所选值；未选中任何项时禁用提交', async () => {
        const onValueChange = vi.fn<(value: unknown) => void>();
        const onChange = vi.fn<(value: unknown) => void>();
        await setup({ type: 'checkbox', checkboxGroupProps: { options, onChange }, onValueChange });
        expect($(`.${prefix}-checkbox-container .${BASE_CLASS_PREFIX}-checkboxGroup-vertical`)).not.toBeNull();
        await click(screen.getByRole('checkbox', { name: 'A' }));
        await click(screen.getByRole('checkbox', { name: 'B' }));
        expect(onValueChange).toHaveBeenLastCalledWith(['a', 'b']);
        expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
        expect(submit()).toBeEnabled();
        await click(screen.getByRole('checkbox', { name: 'A' }));
        await click(screen.getByRole('checkbox', { name: 'B' }));
        expect(onValueChange).toHaveBeenLastCalledWith([]);
        expect(submit()).toBeDisabled();
    });

    it('custom 渲染 children，其他 type 忽略 children', async () => {
        const { store } = await setup({ type: 'custom' }, { children: true });
        expect(screen.getByText('mine')).toBeInTheDocument();
        update(store, { type: 'text' });
        expect(screen.queryByText('mine')).toBeNull();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('同时存在的两个 Feedback，emoji 单选组互不影响', async () => {
        const onFirst = vi.fn<(value: unknown) => void>();
        const onSecond = vi.fn<(value: unknown) => void>();
        render(Two, { props: { onFirst, onSecond } });
        flushSync();
        await placed();
        const groups = screen.getAllByRole('radiogroup');
        const names = groups.map((group) => within(group).getAllByRole('radio')[0].getAttribute('name'));
        expect(names[0]).toBeTruthy();
        expect(names[0]).not.toBe(names[1]);
        const second = within(groups[1]).getAllByRole('radio');
        await click(second[1]);
        expect(second[1]).toBeChecked();
        expect(
            within(groups[0])
                .getAllByRole('radio')
                .some((radio) => (radio as HTMLInputElement).checked)
        ).toBe(false);
        expect(onFirst).not.toHaveBeenCalled();
        expect(onSecond).toHaveBeenCalledWith({ emoji: '😐' });
    });

    it('textAreaProps.value 作为输入框的初值', async () => {
        await setup({ type: 'text', textAreaProps: { value: 'fixed' } });
        expect(screen.getByRole('textbox')).toHaveValue('fixed');
    });

    it('textAreaProps.onChange 被调用，且不替换上报的值', async () => {
        const onValueChange = vi.fn<(value: unknown) => void>();
        const onChange = vi.fn<(value: string, event: Event) => void>();
        const { store } = await setup({ type: 'text', textAreaProps: { onChange }, onValueChange });
        typeText(screen.getByRole('textbox'), 'good');
        expect(onValueChange).toHaveBeenLastCalledWith('good');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('good', expect.objectContaining({ type: 'input' }));

        update(store, { type: 'emoji' });
        await click(screen.getByText('😞'));
        typeText(screen.getByRole('textbox'), 'slow');
        expect(onValueChange).toHaveBeenLastCalledWith({ emoji: '😞', text: 'slow' });
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('radioGroupProps.value 与 checkboxGroupProps.value 作为初值', async () => {
        const { store } = await setup({ type: 'radio', radioGroupProps: { options, value: 'a' } });
        expect(screen.getByRole('radio', { name: 'A' })).toBeChecked();
        update(store, { type: 'checkbox', checkboxGroupProps: { options, value: ['b'] } });
        expect(screen.getByRole('checkbox', { name: 'B' })).toBeChecked();
    });
});

describe('Svelte Feedback 提交与取消', () => {
    it('popup：提交与取消上报点击并清空值', async () => {
        const onOk = vi.fn<(event: MouseEvent) => void>();
        const onCancel = vi.fn<(event: MouseEvent | KeyboardEvent) => void>();
        const { store } = await setup({ onCancel, onOk });
        await click(screen.getByText('😃'));
        await click(submit());
        expect(onOk).toHaveBeenCalledTimes(1);
        expect(onOk.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
        expect(submit()).toBeDisabled();
        expect(emojiItem('😃')).not.toHaveClass(`${prefix}-emoji-item-selected`);

        await click(screen.getByText('😐'));
        await click(cancel());
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onCancel.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
        // cancel closes the sheet; the value is already gone when it opens again
        expect(store.props.visible).toBe(false);
        update(store, { visible: true });
        await placed();
        expect(submit()).toBeDisabled();
    });

    it('popup：text 提交与取消后输入框清空', async () => {
        await setup({ type: 'text' });
        const textarea = screen.getByRole('textbox');
        typeText(textarea, 'good');
        await click(submit());
        expect(textarea).toHaveValue('');
        expect(submit()).toBeDisabled();
        typeText(textarea, 'again');
        await click(cancel());
        expect(textarea).toHaveValue('');
    });

    it('popup：radio 提交后选项复位', async () => {
        await setup({ type: 'radio', radioGroupProps: { options } });
        await click(screen.getByRole('radio', { name: 'B' }));
        expect(screen.getByRole('radio', { name: 'B' })).toBeChecked();
        await click(submit());
        expect(screen.getByRole('radio', { name: 'B' })).not.toBeChecked();
        expect(submit()).toBeDisabled();
    });

    it('popup：checkbox 提交后选项复位', async () => {
        await setup({ type: 'checkbox', checkboxGroupProps: { options } });
        await click(screen.getByRole('checkbox', { name: 'A' }));
        expect(screen.getByRole('checkbox', { name: 'A' })).toBeChecked();
        await click(submit());
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
        const { store } = await setup({ type: 'text', onCancel: null, onOk: null });
        typeText(screen.getByRole('textbox'), 'good');
        await click(submit());
        typeText(screen.getByRole('textbox'), 'good');
        await click(cancel());
        update(store, { motion: false, visible: false });
        window.removeEventListener('error', onError);
        expect(errors).toEqual([]);
    });

    it('popup：关闭图标执行取消', async () => {
        const onCancel = vi.fn<() => void>();
        await setup({ onCancel });
        await click(closeIcon());
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('popup：Esc 关闭时 onCancel 收到原生 KeyboardEvent', async () => {
        const onCancel = vi.fn<(event: MouseEvent | KeyboardEvent) => void>();
        await setup({ closeOnEsc: true, onCancel });
        pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onCancel.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
    });

    it('popup：onOk 返回的 Promise 显示加载态，resolve 后清空值', async () => {
        const pending = deferred();
        const onOk = vi.fn<() => Promise<void>>(() => pending.promise);
        await setup({ onOk });
        await click(screen.getByText('😃'));
        await click(submit());
        expect(submit()).toHaveClass(loadingCls);
        expect(submit()).toBeEnabled();
        pending.resolve();
        await waitFor(() => expect(submit()).not.toHaveClass(loadingCls));
        expect(submit()).toBeDisabled();
    });

    it('popup：onCancel 返回的 Promise 在取消按钮上显示加载态', async () => {
        const pending = deferred();
        const onCancel = vi.fn<() => Promise<void>>(() => pending.promise);
        await setup({ onCancel });
        await click(screen.getByText('😃'));
        await click(cancel());
        expect(cancel()).toHaveClass(loadingCls);
        expect(submit()).toBeEnabled();
        pending.resolve();
        await waitFor(() => expect(cancel()).not.toHaveClass(loadingCls));
        expect(submit()).toBeDisabled();
    });

    it('modal：确定与取消上报点击并清空值', async () => {
        const onOk = vi.fn<(event: MouseEvent) => void>();
        const onCancel = vi.fn<(event: MouseEvent | KeyboardEvent) => void>();
        const { store } = await setup({ mode: 'modal', motion: false, onCancel, onOk });
        await click(screen.getByText('😃'));
        await click(submit());
        expect(onOk.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
        expect(submit()).toBeDisabled();

        await click(screen.getByText('😐'));
        await click(cancel());
        expect(onCancel.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
        expect(store.props.visible).toBe(false);
        update(store, { visible: true });
        await placed();
        expect(submit()).toBeDisabled();
    });

    it('modal：onOk 返回的 Promise 在 resolve 前保留值', async () => {
        const pending = deferred();
        const onOk = vi.fn<() => Promise<void>>(() => pending.promise);
        await setup({ mode: 'modal', motion: false, onOk });
        await click(screen.getByText('😃'));
        await click(submit());
        expect(submit()).toHaveClass(loadingCls);
        expect(emojiItem('😃')).toHaveClass(`${prefix}-emoji-item-selected`);
        pending.resolve();
        await waitFor(() => expect(submit()).toBeDisabled());
        expect(emojiItem('😃')).not.toHaveClass(`${prefix}-emoji-item-selected`);
    });
});

describe('Svelte Feedback visible', () => {
    it.each([
        ['取消按钮', () => click(cancel())],
        ['关闭图标', () => click(closeIcon())],
        ['Esc', async () => pressEsc()],
    ])('popup：%s 使 visible 变 false，且只写一次', async (_name, close) => {
        render(FeedbackModes, { props: { mode: 'get-set', feedbackMode: 'popup' } });
        flushSync();
        await placed();
        expect(visibleOutput()).toBe('true');
        await close();
        expect(writesOutput()).toBe('false');
        expect(visibleOutput()).toBe('false');
    });

    it('modal：取消按钮、关闭按钮、遮罩点击、Esc 都使 visible 变 false', async () => {
        const closers = [() => click(cancel()), () => click(screen.getByRole('button', { name: zh_CN.Modal.close })), () => click($(`.${modalCls}-wrap`) as HTMLElement), async () => pressEsc()];
        for (const close of closers) {
            const view = render(FeedbackModes, { props: { mode: 'bind' } });
            flushSync();
            await placed();
            expect(visibleOutput()).toBe('true');
            await close();
            await tick();
            expect(visibleOutput()).toBe('false');
            view.unmount();
        }
    });

    it('确定按钮不写 visible，关闭图标只写一次', async () => {
        render(FeedbackModes, { props: { mode: 'get-set', feedbackMode: 'popup' } });
        flushSync();
        await placed();
        await click(screen.getByText('😃'));
        await click(submit());
        expect(writesOutput()).toBe('');
        await click(closeIcon());
        expect(writesOutput()).toBe('false');
    });

    it('modal：onCancel 返回 Promise 时兑现后才写 visible', async () => {
        const pending = deferred();
        const { store } = await setup({ mode: 'modal', motion: false, onCancel: () => pending.promise });
        await click(cancel());
        expect(store.props.visible).toBe(true);
        pending.resolve();
        await waitFor(() => expect(store.props.visible).toBe(false));
    });

    it.each(['popup', 'modal'] as const)('%s：onCancel 返回的 Promise 被拒绝时保持打开，原因由 foundation 重新抛出', async (mode) => {
        const listeners = process.listeners('unhandledRejection');
        const reasons: unknown[] = [];
        process.removeAllListeners('unhandledRejection');
        process.on('unhandledRejection', (reason) => reasons.push(reason));
        try {
            const pending = deferred();
            const failure = new Error('cancel failed');
            const { store } = await setup({ mode, motion: false, onCancel: () => pending.promise });
            await click(cancel());
            pending.reject(failure);
            await pending.promise.catch(() => {});
            await new Promise((resolve) => setTimeout(resolve, 20));
            expect(store.props.visible).toBe(true);
            expect(cancel()).not.toHaveClass(loadingCls);
            expect(reasons).toEqual([failure]);
        } finally {
            process.removeAllListeners('unhandledRejection');
            for (const listener of listeners) {
                process.on('unhandledRejection', listener);
            }
        }
    });

    it('popup：onCancel 返回 Promise 时兑现后才写 visible', async () => {
        const pending = deferred();
        const { store } = await setup({ onCancel: () => pending.promise });
        await click(cancel());
        expect(store.props.visible).toBe(true);
        expect($(`.${sheetCls}`)).not.toBeNull();
        pending.resolve();
        await waitFor(() => expect(store.props.visible).toBe(false));
    });

    it('函数绑定：setter 拒绝关闭时对话框保持打开', async () => {
        render(FeedbackModes, { props: { mode: 'get-set', rejectClose: true, feedbackMode: 'popup' } });
        flushSync();
        await placed();
        await click(cancel());
        expect(writesOutput()).toBe('false');
        expect(visibleOutput()).toBe('true');
        expect($(`.${sheetCls}`)).not.toBeNull();
    });

    it('单向传值：取消后本地关闭，父级值不变；不传 visible 时不渲染', async () => {
        const view = render(FeedbackModes, { props: { mode: 'one-way', feedbackMode: 'popup' } });
        flushSync();
        await placed();
        await click(cancel());
        expect(visibleOutput()).toBe('true');
        expect($(`.${sheetCls}`)).toBeNull();
        view.unmount();

        render(FeedbackModes, { props: { mode: 'none', feedbackMode: 'popup' } });
        flushSync();
        await placed();
        expect($(`.${sheetCls}`)).toBeNull();
    });
});

describe('Svelte Feedback afterClose 与 afterVisibleChange', () => {
    it('modal：弹窗隐藏后执行一次 afterClose，不发 afterVisibleChange', async () => {
        const afterClose = vi.fn<() => void>();
        const afterVisibleChange = vi.fn<(visible: boolean) => void>();
        const { store } = await setup({ mode: 'modal', motion: false, afterClose, afterVisibleChange });
        expect(afterClose).not.toHaveBeenCalled();
        update(store, { visible: false });
        await placed();
        expect(afterClose).toHaveBeenCalledTimes(1);
        expect(afterVisibleChange).not.toHaveBeenCalled();
    });

    it('popup：抽屉隐藏后与 afterVisibleChange 一起执行一次 afterClose', async () => {
        const afterClose = vi.fn<() => void>();
        const afterVisibleChange = vi.fn<(visible: boolean) => void>();
        const { store } = await setup({ motion: false, afterClose, afterVisibleChange });
        expect(afterClose).not.toHaveBeenCalled();
        update(store, { visible: false });
        await placed();
        expect(afterClose).toHaveBeenCalledTimes(1);
        expect(afterVisibleChange).toHaveBeenLastCalledWith(false);
        update(store, { visible: true });
        await placed();
        expect(afterVisibleChange).toHaveBeenLastCalledWith(true);
        expect(afterClose).toHaveBeenCalledTimes(1);
    });
});

describe('Svelte Feedback 按钮属性', () => {
    it('popup：cancelButtonProps 的 class 与 okButtonProps 的 disabled 生效', async () => {
        await setup({ cancelButtonProps: { class: 'my-cancel' }, okButtonProps: { disabled: false } });
        expect(submit()).toBeEnabled();
        expect(cancel()).toHaveClass('my-cancel');
    });

    it('modal：okButtonProps 的 class 生效，未给 disabled 时仍按值禁用', async () => {
        const { store } = await setup({ mode: 'modal', motion: false, okButtonProps: { class: 'my-ok' } });
        expect(submit()).toHaveClass('my-ok');
        expect(submit()).toBeDisabled();
        update(store, { okButtonProps: { class: 'my-ok', disabled: false } });
        expect(submit()).toBeEnabled();
    });

    it.each(['popup', 'modal'] as const)('%s：使用方 okButtonProps.onclick 先调用，内置处理仍执行', async (mode) => {
        const order: string[] = [];
        const onOk = vi.fn<() => void>(() => void order.push('ok'));
        await setup({ mode, motion: false, okButtonProps: { onclick: () => order.push('click'), disabled: false }, onOk });
        await click(submit());
        expect(order).toEqual(['click', 'ok']);
    });

    it.each(['popup', 'modal'] as const)('%s：使用方 cancelButtonProps.onclick 先调用', async (mode) => {
        const order: string[] = [];
        await setup({ mode, motion: false, cancelButtonProps: { onclick: () => order.push('click') }, onCancel: () => void order.push('cancel') });
        await click(cancel());
        expect(order).toEqual(['click', 'cancel']);
    });

    it.each(['popup', 'modal'] as const)('%s：使用方 loading 与内置挂起态任一为真则加载', async (mode) => {
        const pending = deferred();
        const onOk = vi.fn<() => Promise<void>>(() => pending.promise);
        const { store } = await setup({ mode, motion: false, okButtonProps: { loading: false }, onOk });
        await click(screen.getByText('😃'));
        expect(submit()).not.toHaveClass(loadingCls);
        await click(submit());
        expect(submit()).toHaveClass(loadingCls);
        pending.resolve();
        await waitFor(() => expect(submit()).not.toHaveClass(loadingCls));
        update(store, { okButtonProps: { loading: true, disabled: false } });
        expect(submit()).toHaveClass(loadingCls);
    });

    it('popup：okButtonProps.autoFocus 使确定按钮带上 autofocus', async () => {
        await setup({ okButtonProps: { autoFocus: true, disabled: false } });
        expect(submit()).toHaveAttribute('autofocus');
    });

    it('单选值为 0 或 false 时提交按钮可用', async () => {
        const onValueChange = vi.fn<(value: unknown) => void>();
        await setup({
            type: 'radio',
            radioGroupProps: {
                options: [
                    { label: 'Zero', value: 0 },
                    { label: 'No', value: false },
                ],
            },
            onValueChange,
        });
        await click(screen.getByRole('radio', { name: 'Zero' }));
        expect(onValueChange).toHaveBeenLastCalledWith(0);
        expect(submit()).toBeEnabled();
        await click(screen.getByRole('radio', { name: 'No' }));
        expect(onValueChange).toHaveBeenLastCalledWith(false);
        expect(submit()).toBeEnabled();
    });
});

describe('Svelte Feedback snippet', () => {
    it.each(['popup', 'modal'] as const)('%s：footer snippet 替换默认页脚，null 隐藏页脚，不传恢复默认', async (mode) => {
        const { store } = await setup({ mode, motion: false }, { footer: 'custom' });
        expect(screen.getByText('own footer')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: zh_CN.Feedback.submit })).toBeNull();
        store.footer = undefined;
        flushSync();
        expect(screen.queryByText('own footer')).toBeNull();
        expect(submit()).toBeInTheDocument();
        store.footer = 'custom';
        flushSync();
        expect(screen.getByText('own footer')).toBeInTheDocument();
    });

    it.each(['popup', 'modal'] as const)('%s：footer 为 null 不渲染页脚区', async (mode) => {
        await setup({ mode, motion: false }, { footer: 'none' });
        expect(screen.queryByRole('button', { name: zh_CN.Feedback.submit })).toBeNull();
        expect($(`.${prefix}-footer`)).toBeNull();
        expect($(`.${modalCls}-footer`)).toBeNull();
        expect($(`.${sheetCls}-footer`)).toBeNull();
    });

    it('title snippet 优先于 title，closeIcon snippet 替换默认图标', async () => {
        await setup({ title: 'plain' }, { title: true, closeIcon: true });
        expect($(`.${sheetCls}-title`)).toHaveTextContent('slot title');
        expect(screen.getByRole('button', { name: zh_CN.SideSheet.close }).querySelector('.my-close')).not.toBeNull();
    });

    it('modal 专属的 header 与 modal 转发，popup 下无效', async () => {
        const extra = { header: true, modal: true };
        const first = await setup({ mode: 'modal', motion: false, 'aria-label': 'Feedback' }, extra);
        expect($('#own-header')).not.toBeNull();
        expect($('#wrap')).toContainElement(screen.getByRole('dialog'));
        first.view.unmount();
        await setup({}, extra);
        expect($('#own-header')).toBeNull();
        expect($('#wrap')).toBeNull();
    });

    it('icon 转发到 modal 标题图标区，popup 下无效', async () => {
        const first = await setup({ mode: 'modal', motion: false }, { icon: true });
        expect($('.semi-modal-icon-wrapper #own-icon')).not.toBeNull();
        first.view.unmount();
        await setup({}, { icon: true });
        expect($('#own-icon')).toBeNull();
    });

    it('content snippet 包裹内置内容，type 变化时包装节点不重挂载', async () => {
        const { store } = await setup({ type: 'text' }, { content: 'wrap' });
        const wrap = screen.getByTestId('wrap');
        expect(wrap).toContainElement(screen.getByRole('textbox'));
        update(store, { type: 'radio', radioGroupProps: { options } });
        expect(screen.getByTestId('wrap')).toBe(wrap);
        expect(within(wrap).getAllByRole('radio')).toHaveLength(2);
    });

    it('content snippet 可以忽略内置内容与 children', async () => {
        await setup({ type: 'custom' }, { content: 'only', children: true });
        expect(screen.getByText('only mine')).toBeInTheDocument();
        expect(screen.queryByText('mine')).toBeNull();
    });

    it('radioLabel 与 radioExtra 收到 { option, index }，未传时渲染 label 文本', async () => {
        const group = {
            options: [
                { label: 'A', value: 'a', extra: 'ea' },
                { label: 'B', value: 'b' },
            ],
        };
        const first = await setup({ type: 'radio', radioGroupProps: group });
        expect(screen.getByRole('radio', { name: /A/ })).toBeInTheDocument();
        first.view.unmount();
        await setup({ type: 'radio', radioGroupProps: group }, { radioParts: true });
        expect(screen.getByText('L0:A')).toBeInTheDocument();
        expect(screen.getByText('L1:B')).toBeInTheDocument();
        expect(screen.getByText('E0:ea')).toBeInTheDocument();
    });

    it('checkboxLabel 与 checkboxExtra 收到 { option, index }', async () => {
        await setup(
            {
                type: 'checkbox',
                checkboxGroupProps: {
                    options: [
                        { label: 'A', value: 'a', extra: 'ea' },
                        { label: 'B', value: 'b' },
                    ],
                },
            },
            { checkboxParts: true }
        );
        expect(screen.getByText('L1:B')).toBeInTheDocument();
        expect(screen.getByText('E0:ea')).toBeInTheDocument();
    });
});

describe('Svelte Feedback 透传', () => {
    it('style 与 data-* 落在 Modal 和 SideSheet 各自的位置', async () => {
        const first = await setup({ style: 'color: red', 'data-testid': 'fb' });
        expect(screen.getByTestId('fb')).toHaveClass(sheetCls);
        expect($(`.${sheetCls}-inner`)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        first.view.unmount();
        await setup({ style: 'color: red', 'data-testid': 'fb', mode: 'modal', motion: false });
        expect(screen.getByTestId('fb')).toHaveClass(prefix);
        expect($(`.${modalCls}`)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('两种模式下 class 都落在根元素上并与 semi-feedback 合并', async () => {
        const first = await setup({ class: 'mine' });
        expect($(`div.${sheetCls}`)).toHaveClass(prefix, 'mine');
        first.view.unmount();
        await setup({ class: 'mine', mode: 'modal', motion: false });
        expect($(`.${prefix}`)).toHaveClass('mine');
    });

    it.each(['popup', 'modal'] as const)('%s：aria-* 落在 role="dialog" 元素上', async (mode) => {
        await setup({ mode, motion: false, 'aria-label': 'Custom name', 'aria-describedby': 'desc' });
        const dialog = screen.getByRole('dialog', { name: 'Custom name' });
        expect(dialog).toHaveAttribute('aria-describedby', 'desc');
    });

    it('透传到 Modal 的属性', async () => {
        const { store } = await setup({ mode: 'modal', motion: false, width: 321, maskClosable: false, okText: 'Go' });
        expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
        expect($(`.${modalCls}`)?.style.width).toBe('321px');
        await click($(`.${modalCls}-wrap`) as HTMLElement);
        expect(store.props.visible).toBe(true);
    });

    it('popup：closeOnEsc 与 width 透传到 SideSheet', async () => {
        const { store } = await setup({ motion: false, placement: 'right', width: 321, closeOnEsc: true });
        expect($(`div.${sheetCls}`)).toHaveStyle({ width: '321px' });
        pressEsc();
        expect(store.props.visible).toBe(false);
    });

    it.each([
        ['popup', sheetCls],
        ['modal', modalCls],
    ] as const)('%s：motion 透传，false 时隐藏即同步卸载', async (mode, cls) => {
        const { store, view } = await setup({ mode, motion: false });
        expect($(`.${cls}`)).not.toBeNull();
        update(store, { visible: false });
        expect($(`.${cls}`)).toBeNull();
        view.unmount();
    });

    it('popup 的默认 placement、mask 可以被使用方覆盖', async () => {
        const first = await setup();
        expect($(`.${sheetCls}-bottom`)).not.toBeNull();
        expect($(`.${sheetCls}-mask`)).toBeNull();
        first.view.unmount();
        await setup({ placement: 'right', mask: true });
        expect($(`.${sheetCls}-right`)).not.toBeNull();
        expect($(`.${sheetCls}-mask`)).not.toBeNull();
    });

    it('显式传入 undefined 的 mask、okText、placement 仍使用内置值', async () => {
        const first = await setup({ mask: undefined, placement: undefined });
        expect($(`.${sheetCls}-bottom`)).not.toBeNull();
        expect($(`.${sheetCls}-mask`)).toBeNull();
        first.view.unmount();
        await setup({ mode: 'modal', motion: false, okText: undefined });
        expect(submit()).toBeTruthy();
    });

    it('未声明的监听器落到最外层元素', async () => {
        const onkeydown = vi.fn<(event: KeyboardEvent) => void>();
        const onclick = vi.fn<(event: MouseEvent) => void>();
        await setup({ 'data-testid': 'fb', onkeydown, onclick });
        await click(screen.getByTestId('fb'));
        expect(onclick).toHaveBeenCalled();
        void fireEvent.keyDown(screen.getByTestId('fb'), { key: 'a' });
        expect(onkeydown).toHaveBeenCalled();
    });
});

describe('Svelte Feedback 全局默认值', () => {
    it('从 semiGlobal 读取 mode、type 与 okButtonProps，传入值优先', async () => {
        semiGlobal.config.overrideDefaultProps = {
            Feedback: { mode: 'modal', type: 'text', okButtonProps: { class: 'global-ok' } },
            Modal: { motion: false },
        };
        const { store } = await setup({ mode: undefined, type: undefined });
        expect($(`.${prefix}.${prefix}-text`)).not.toBeNull();
        expect($(`.${modalCls}`)).not.toBeNull();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        expect(submit()).toHaveClass('global-ok');
        update(store, { mode: 'popup', type: 'emoji', okButtonProps: { class: 'mine' } });
        await placed();
        expect($(`.${sheetCls}`)).not.toBeNull();
        expect(submit()).toHaveClass('mine');
        expect(submit()).not.toHaveClass('global-ok');
    });

    it('全局 textAreaProps 生效，传入值整体替换', async () => {
        semiGlobal.config.overrideDefaultProps = { Feedback: { textAreaProps: { maxCount: 10 } } };
        const { store } = await setup({ type: 'text' });
        typeText(screen.getByRole('textbox'), 'good');
        expect(counter()).toHaveTextContent('4/10');
        update(store, { textAreaProps: { rows: 5 } });
        expect(counter()).toBeNull();
    });

    it('全局 onOk 回落', async () => {
        const globalOk = vi.fn<() => void>();
        semiGlobal.config.overrideDefaultProps = { Feedback: { onOk: globalOk } };
        await setup();
        await click(screen.getByText('😃'));
        await click(submit());
        expect(globalOk).toHaveBeenCalledTimes(1);
    });
});

describe('Svelte Feedback getRoot', () => {
    it('getRoot 指向 SideSheet 或 Modal 的外层包裹元素，未显示时为 null', async () => {
        const { store, onReady } = await setup({ mode: 'popup' });
        const root = () => onReady.mock.lastCall?.[0]?.getRoot() ?? null;
        expect(root()).toBe($(`div.${sheetCls}`));
        update(store, { visible: false, motion: false });
        await placed();
        expect(root()).toBeNull();
        update(store, { mode: 'modal', visible: true });
        await placed();
        expect(root()).toBe($(`.${prefix}`));
    });
});
