import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { expect, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { defineSpec, type SpecHandle, type SpecMount, type SpecOptions } from './shared/define-spec';

/** Framework-free Popconfirm props. The fixture renders a native `<button type="button">trigger</button>` as the trigger. */
export interface PopconfirmSpecProps {
    title: string;
    /** `undefined` is uncontrolled */
    visible?: boolean;
    disabled?: boolean;
    trigger?: 'hover' | 'focus' | 'click' | 'custom';
    okText?: string;
    cancelText?: string;
    onConfirm?: () => void | Promise<unknown>;
    onCancel?: () => void | Promise<unknown>;
    onVisibleChange?: (visible: boolean) => void;
    onEscKeyDown?: (event: { type: string }) => void;
}

const popupSelector = `.${BASE_CLASS_PREFIX}-popover-wrapper`;
const loadingClass = `${BASE_CLASS_PREFIX}-button-loading`;

const isMounted = () => document.querySelector(popupSelector) !== null;

function addOutsideElement() {
    const outside = document.createElement('p');
    outside.textContent = 'outside';
    document.body.append(outside);
    onTestFinished(() => outside.remove());
    return outside;
}

function deferred() {
    let resolve!: () => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

export function popconfirmSpec(mount: SpecMount<PopconfirmSpecProps>, options: SpecOptions = {}) {
    defineSpec('Popconfirm（共享 spec）', options, (test) => {
        let handle: SpecHandle<PopconfirmSpecProps>;

        async function render(props: Partial<PopconfirmSpecProps> = {}) {
            handle = await mount({ title: '确定保存？', trigger: 'click', okText: 'OK', cancelText: 'Cancel', ...props });
            return within(document.body);
        }

        const callbacks = () => ({
            onVisibleChange: vi.fn<NonNullable<PopconfirmSpecProps['onVisibleChange']>>(),
            onConfirm: vi.fn<NonNullable<PopconfirmSpecProps['onConfirm']>>(),
            onCancel: vi.fn<NonNullable<PopconfirmSpecProps['onCancel']>>(),
            onEscKeyDown: vi.fn<NonNullable<PopconfirmSpecProps['onEscKeyDown']>>(),
        });

        const trigger = () => within(handle.container).getByRole('button', { name: 'trigger' });
        const okButton = () => within(document.body).getByRole('button', { name: 'OK' });
        const cancelButton = () => within(document.body).getByRole('button', { name: 'Cancel' });
        const waitShown = () => vi.waitFor(() => expect(within(document.body).getByRole('dialog')).toBeVisible());
        const waitClosed = () => vi.waitFor(() => expect(isMounted()).toBe(false));

        test('click 触发：点击打开，弹层是以 title 命名的对话框，点击外部关闭；onVisibleChange 依次收到 true、false', async () => {
            const { onVisibleChange } = callbacks();
            const screen = await render({ onVisibleChange });
            expect(isMounted()).toBe(false);
            await userEvent.click(trigger());
            await waitShown();
            expect(screen.getByRole('dialog', { name: '确定保存？' })).toBeInTheDocument();
            await userEvent.click(addOutsideElement());
            await waitClosed();
            expect(onVisibleChange.mock.calls).toEqual([[true], [false]]);
        });

        test('触发器带 aria-haspopup 与 aria-expanded，aria-controls 只在弹层存在时指向对话框', async () => {
            const screen = await render();
            expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
            expect(trigger()).toHaveAttribute('aria-expanded', 'false');
            expect(trigger()).not.toHaveAttribute('aria-controls');
            await userEvent.click(trigger());
            await waitShown();
            expect(trigger()).toHaveAttribute('aria-expanded', 'true');
            expect(trigger()).toHaveAttribute('aria-controls', screen.getByRole('dialog').id);
            await userEvent.click(addOutsideElement());
            await waitClosed();
            expect(trigger()).toHaveAttribute('aria-expanded', 'false');
            expect(trigger()).not.toHaveAttribute('aria-controls');
        });

        test('确认：只调用 onConfirm，关闭弹层并把焦点还给触发器', async () => {
            const { onConfirm, onCancel, onVisibleChange } = callbacks();
            await render({ onConfirm, onCancel, onVisibleChange });
            await userEvent.click(trigger());
            await waitShown();
            await userEvent.click(okButton());
            await waitClosed();
            expect(onConfirm).toHaveBeenCalledTimes(1);
            expect(onCancel).not.toHaveBeenCalled();
            expect(onVisibleChange.mock.calls).toEqual([[true], [false]]);
            expect(trigger()).toHaveFocus();
        });

        test('取消：只调用 onCancel，关闭弹层并把焦点还给触发器', async () => {
            const { onConfirm, onCancel, onVisibleChange } = callbacks();
            await render({ onConfirm, onCancel, onVisibleChange });
            await userEvent.click(trigger());
            await waitShown();
            await userEvent.click(cancelButton());
            await waitClosed();
            expect(onCancel).toHaveBeenCalledTimes(1);
            expect(onConfirm).not.toHaveBeenCalled();
            expect(onVisibleChange.mock.calls).toEqual([[true], [false]]);
            expect(trigger()).toHaveFocus();
        });

        test('onConfirm 返回 Promise：确认按钮显示 loading 且不重入，resolve 后关闭', async () => {
            const pending = deferred();
            const onConfirm = vi.fn<() => Promise<void>>(() => pending.promise);
            await render({ onConfirm });
            await userEvent.click(trigger());
            await waitShown();
            await userEvent.click(okButton());
            await vi.waitFor(() => expect(okButton()).toHaveClass(loadingClass));
            await userEvent.click(okButton());
            expect(onConfirm).toHaveBeenCalledTimes(1);
            expect(isMounted()).toBe(true);
            pending.resolve();
            await waitClosed();
        });

        test('onCancel 返回 rejected Promise：取消按钮显示 loading，reject 后停止 loading 且保持打开', async () => {
            const pending = deferred();
            await render({ onCancel: () => pending.promise });
            await userEvent.click(trigger());
            await waitShown();
            await userEvent.click(cancelButton());
            await vi.waitFor(() => expect(cancelButton()).toHaveClass(loadingClass));
            pending.reject(new Error('no'));
            await vi.waitFor(() => expect(cancelButton()).not.toHaveClass(loadingClass));
            expect(isMounted()).toBe(true);
        });

        test('Escape 关闭弹层，onEscKeyDown 收到 keydown 事件', async () => {
            const { onEscKeyDown, onVisibleChange } = callbacks();
            await render({ onEscKeyDown, onVisibleChange });
            await userEvent.click(trigger());
            await waitShown();
            await userEvent.keyboard('{Escape}');
            await waitClosed();
            expect(onEscKeyDown).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ type: 'keydown' }));
            expect(onVisibleChange.mock.calls).toEqual([[true], [false]]);
        });

        test('hover 触发：指针移入打开，移出关闭', async () => {
            await render({ trigger: 'hover' });
            await userEvent.hover(trigger());
            await waitShown();
            await userEvent.unhover(trigger());
            await waitClosed();
        });

        test('custom 触发：点击不打开，由 visible 控制，使用方自行开合时不调用 onVisibleChange', async () => {
            const { onVisibleChange } = callbacks();
            await render({ trigger: 'custom', visible: false, onVisibleChange });
            await userEvent.click(trigger());
            expect(isMounted()).toBe(false);
            await handle.update({ visible: true });
            await waitShown();
            await handle.update({ visible: false });
            await waitClosed();
            expect(onVisibleChange).not.toHaveBeenCalled();
        });

        test('visible 受控为 false：点击触发器只报告 onVisibleChange(true)，不自行打开；使用方改为 true 后打开且不重复报告', async () => {
            const { onVisibleChange } = callbacks();
            await render({ visible: false, onVisibleChange });
            await userEvent.click(trigger());
            expect(isMounted()).toBe(false);
            expect(onVisibleChange.mock.calls).toEqual([[true]]);
            await handle.update({ visible: true });
            await waitShown();
            expect(onVisibleChange).toHaveBeenCalledTimes(1);
        });

        test('visible 受控为 true：Escape 只报告 onVisibleChange(false)，弹层保持；使用方改为 false 后关闭', async () => {
            const { onVisibleChange } = callbacks();
            await render({ visible: true, onVisibleChange });
            await waitShown();
            await userEvent.keyboard('{Escape}');
            await vi.waitFor(() => expect(onVisibleChange.mock.calls).toEqual([[false]]));
            expect(isMounted()).toBe(true);
            await handle.update({ visible: false });
            await waitClosed();
            expect(onVisibleChange).toHaveBeenCalledTimes(1);
        });

        test('disabled 时点击触发器不打开', async () => {
            const { onVisibleChange } = callbacks();
            await render({ disabled: true, onVisibleChange });
            await userEvent.click(trigger());
            expect(isMounted()).toBe(false);
            expect(onVisibleChange).not.toHaveBeenCalled();
        });
    });
}
