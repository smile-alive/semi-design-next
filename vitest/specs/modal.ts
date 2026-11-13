import { createEvent, fireEvent, waitFor, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { checkPattern } from '../utils/apg';
import { defineSpec, type SpecHandle, type SpecMount, type SpecOptions } from './shared/define-spec';

/** A second dialog rendered as a sibling after the first, so it opens on top of it */
export interface ModalSpecStacked {
    visible?: boolean;
    title?: string;
    closeOnEsc?: boolean;
    onCancel?: (event: { type: string }) => void | Promise<void>;
}

/** Framework-free Modal props; the fixtures always pass `motion={false}` */
export interface ModalSpecProps {
    visible?: boolean;
    title?: string;
    content?: string;
    okText?: string;
    cancelText?: string;
    closable?: boolean;
    mask?: boolean;
    maskClosable?: boolean;
    closeOnEsc?: boolean;
    confirmLoading?: boolean;
    keepDOM?: boolean;
    lazyRender?: boolean;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    'data-foo'?: string;
    // `onCancel` and `onOk` may return a Promise: the button stays loading until it settles
    onOk?: (event: { type: string }) => void | Promise<void>;
    onCancel?: (event: { type: string }) => void | Promise<void>;
    afterClose?: () => void;
    stacked?: ModalSpecStacked;
}

const prefix = `${BASE_CLASS_PREFIX}-modal`;
const loadingClass = `${BASE_CLASS_PREFIX}-button-loading`;

const press = async (key: string) => {
    await userEvent.keyboard(key === 'Shift+Tab' ? '{Shift>}{Tab}{/Shift}' : key.length === 1 ? key : `{${key}}`);
};

function deferred() {
    let resolve!: () => void;
    const promise = new Promise<void>((res) => {
        resolve = res;
    });
    return { promise, resolve };
}

export function modalSpec(mount: SpecMount<ModalSpecProps>, options: SpecOptions = {}) {
    defineSpec('Modal（共享 spec）', options, (test) => {
        let handle: SpecHandle<ModalSpecProps>;
        const extras: HTMLElement[] = [];

        async function render(props: ModalSpecProps = {}) {
            handle = await mount({ title: 'Dialog', content: 'dialog body', okText: 'OK', cancelText: 'Cancel', ...props });
            return handle;
        }

        function outsideButton() {
            const button = document.body.appendChild(document.createElement('button'));
            extras.push(button);
            return button;
        }

        const view = () => within(document.body);
        const dialog = () => view().getByRole('dialog');
        const queryDialog = () => view().queryByRole('dialog');
        const okButton = () => view().getByRole('button', { name: 'OK' });
        const cancelButton = () => view().getByRole('button', { name: 'Cancel' });
        const closeButton = () => document.querySelector<HTMLElement>(`.${prefix}-close`);
        const wrap = () => document.querySelector<HTMLElement>(`.${prefix}-wrap`)!;
        const bodyLocked = () => document.body.style.overflow === 'hidden';
        const closeModal = () => handle.update({ visible: false });
        // `data-*` lands on the outermost element, which is neither the dialog nor inside it
        const dataOwner = () => document.querySelector('[data-foo]');

        afterEach(() => {
            extras.splice(0).forEach((element) => element.remove());
        });

        test('渲染 role=dialog，标题给对话框命名，正文在对话框内，默认带 aria-modal', async () => {
            await render({ visible: true });
            expect(dialog()).toHaveAccessibleName('Dialog');
            expect(dialog()).toHaveAttribute('aria-modal', 'true');
            expect(dialog()).toHaveTextContent('dialog body');
        });

        test('visible 受控：为 false 时不渲染，改为 true 后出现，改回 false 后卸载', async () => {
            await render();
            expect(queryDialog()).toBeNull();
            await handle.update({ visible: true });
            expect(dialog()).toBeInTheDocument();
            await closeModal();
            await waitFor(() => expect(queryDialog()).toBeNull());
        });

        test('点击确定调用 onOk，点击取消与关闭按钮调用 onCancel；受控的 visible 不因此改变', async () => {
            const onOk = vi.fn<NonNullable<ModalSpecProps['onOk']>>();
            const onCancel = vi.fn<NonNullable<ModalSpecProps['onCancel']>>();
            await render({ visible: true, onOk, onCancel });
            await userEvent.click(okButton());
            expect(onOk).toHaveBeenCalledTimes(1);
            expect(onOk.mock.calls[0][0].type).toBe('click');
            expect(onCancel).not.toHaveBeenCalled();

            await userEvent.click(cancelButton());
            expect(onCancel).toHaveBeenCalledTimes(1);
            await userEvent.click(closeButton()!);
            expect(onCancel).toHaveBeenCalledTimes(2);
            expect(dialog()).toBeInTheDocument();
        });

        test('closable 为 false 时没有关闭按钮', async () => {
            await render({ visible: true, closable: false });
            expect(closeButton()).toBeNull();
        });

        test('onOk 返回 Promise 时确定按钮保持 loading 直至兑现，取消按钮不受影响', async () => {
            const pending = deferred();
            await render({ visible: true, onOk: () => pending.promise });
            await userEvent.click(okButton());
            expect(okButton()).toHaveClass(loadingClass);
            expect(cancelButton()).not.toHaveClass(loadingClass);
            pending.resolve();
            await waitFor(() => expect(okButton()).not.toHaveClass(loadingClass));
        });

        test('confirmLoading 让确定按钮显示 loading', async () => {
            await render({ visible: true, confirmLoading: true });
            expect(okButton()).toHaveClass(loadingClass);
            await handle.update({ confirmLoading: false });
            expect(okButton()).not.toHaveClass(loadingClass);
        });

        test('按 Escape 调用 onCancel，参数是原生键盘事件', async () => {
            const onCancel = vi.fn<NonNullable<ModalSpecProps['onCancel']>>();
            await render({ visible: true, onCancel });
            await press('Escape');
            expect(onCancel).toHaveBeenCalledTimes(1);
            expect(onCancel.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
        });

        test('closeOnEsc 为 false 时 Escape 不关闭', async () => {
            const onCancel = vi.fn<NonNullable<ModalSpecProps['onCancel']>>();
            await render({ visible: true, closeOnEsc: false, onCancel });
            await press('Escape');
            expect(onCancel).not.toHaveBeenCalled();
        });

        test('点击遮罩调用 onCancel；maskClosable 为 false 时不调用', async () => {
            const onCancel = vi.fn<NonNullable<ModalSpecProps['onCancel']>>();
            await render({ visible: true, onCancel });
            await userEvent.click(wrap());
            expect(onCancel).toHaveBeenCalledTimes(1);

            await handle.update({ maskClosable: false });
            await userEvent.click(wrap());
            expect(onCancel).toHaveBeenCalledTimes(1);
        });

        test('在对话框内按下、在遮罩上松开不关闭，点击对话框内部也不关闭', async () => {
            const onCancel = vi.fn<NonNullable<ModalSpecProps['onCancel']>>();
            await render({ visible: true, onCancel });
            fireEvent.mouseDown(dialog());
            fireEvent.mouseUp(wrap());
            fireEvent.click(wrap());
            expect(onCancel).not.toHaveBeenCalled();
            await userEvent.click(view().getByText('dialog body'));
            expect(onCancel).not.toHaveBeenCalled();
        });

        test('mask 为 false 时没有遮罩，对话框不带 aria-modal', async () => {
            await render({ visible: true, mask: false });
            expect(document.querySelector(`.${prefix}-mask`)).toBeNull();
            expect(dialog()).not.toHaveAttribute('aria-modal');
        });

        test('打开时页面其余部分变为 inert，关闭后释放；非模态不设 inert', async () => {
            await render({ visible: true });
            expect(handle.container.inert).toBe(true);
            await closeModal();
            await waitFor(() => expect(handle.container.inert).toBe(false));

            await handle.update({ visible: true, mask: false });
            expect(handle.container.inert).toBe(false);
        });

        test('模态对话框锁定 body 滚动，关闭后恢复；mask 为 false 时不锁', async () => {
            await render({ visible: true });
            expect(bodyLocked()).toBe(true);
            await closeModal();
            await waitFor(() => expect(bodyLocked()).toBe(false));

            await handle.update({ visible: true, mask: false });
            expect(bodyLocked()).toBe(false);
        });

        test('打开时焦点进入对话框，关闭后焦点回到打开前的元素', async () => {
            const trigger = outsideButton();
            await render();
            trigger.focus();
            await handle.update({ visible: true });
            expect(dialog()).toContainElement(document.activeElement as HTMLElement);
            await closeModal();
            await waitFor(() => expect(trigger).toHaveFocus());
        });

        test('模态对话框内 Tab 与 Shift+Tab 在对话框内循环，不会离开', async () => {
            outsideButton();
            await render({ visible: true });
            const stops = [closeButton()!, cancelButton(), okButton()];
            stops[stops.length - 1].focus();
            await press('Tab');
            expect(stops[0]).toHaveFocus();
            await press('Shift+Tab');
            expect(stops[stops.length - 1]).toHaveFocus();
        });

        test('非模态对话框不拦截 Tab', async () => {
            await render({ visible: true, mask: false });
            const ok = okButton();
            ok.focus();
            expect(fireEvent(ok, createEvent.keyDown(ok, { key: 'Tab' }))).toBe(true);
            expect(ok).toHaveFocus();
        });

        test('符合 APG dialog 模式：命名、aria-modal、焦点进入并在内部循环', async () => {
            outsideButton();
            await render({ visible: true });
            await expect(checkPattern('dialog', document.body, { press, actions: false })).resolves.toBeUndefined();
        });

        test('aria-label、aria-labelledby、aria-describedby 落在 role=dialog 元素上，data-* 落在外层元素上', async () => {
            await render({ visible: true, 'aria-labelledby': 'outside-label', 'aria-describedby': 'outside-desc', 'data-foo': 'bar' });
            expect(dialog()).toHaveAttribute('aria-labelledby', 'outside-label');
            expect(dialog()).toHaveAttribute('aria-describedby', 'outside-desc');
            expect(dialog()).not.toHaveAttribute('data-foo');
            expect(dataOwner()).not.toBe(dialog());
            expect(dataOwner()).toContainElement(dialog());
            expect(dataOwner()).not.toHaveAttribute('aria-labelledby');
            expect(dataOwner()).not.toHaveAttribute('aria-describedby');
        });

        test('aria-label 作为对话框的名称，取代标题的引用', async () => {
            await render({ visible: true, 'aria-label': 'Custom label' });
            expect(dialog()).toHaveAttribute('aria-label', 'Custom label');
            expect(dialog()).not.toHaveAttribute('aria-labelledby');
            expect(dialog()).toHaveAccessibleName('Custom label');
            expect(dataOwner()).toBeNull();
        });

        test('afterClose 每次关闭只调用一次，挂载与打开时不调用', async () => {
            const afterClose = vi.fn<() => void>();
            await render({ afterClose });
            await handle.update({ visible: true });
            expect(afterClose).not.toHaveBeenCalled();
            await closeModal();
            await waitFor(() => expect(afterClose).toHaveBeenCalledTimes(1));
            await handle.update({ visible: true });
            await closeModal();
            await waitFor(() => expect(afterClose).toHaveBeenCalledTimes(2));
        });

        test('keepDOM 关闭后保留对话框节点并隐藏，再次打开恢复；首次打开前不渲染', async () => {
            await render({ keepDOM: true });
            expect(queryDialog()).toBeNull();
            expect(document.querySelector(`.${prefix}`)).toBeNull();
            await handle.update({ visible: true });
            expect(document.querySelector(`.${prefix}-displayNone`)).toBeNull();
            expect(dialog()).toBeInTheDocument();
            await closeModal();
            expect(document.querySelector(`.${prefix}-displayNone`)).not.toBeNull();
            expect(document.querySelector(`.${prefix}`)).not.toBeNull();
            expect(bodyLocked()).toBe(false);
            await handle.update({ visible: true });
            expect(document.querySelector(`.${prefix}-displayNone`)).toBeNull();
        });

        test('keepDOM 加 lazyRender 为 false 时一开始就渲染，但处于隐藏', async () => {
            await render({ keepDOM: true, lazyRender: false });
            expect(document.querySelector(`.${prefix}`)).not.toBeNull();
            expect(document.querySelector(`.${prefix}-displayNone`)).not.toBeNull();
            await handle.update({ visible: true });
            expect(document.querySelector(`.${prefix}-displayNone`)).toBeNull();
        });

        test('叠加两个对话框时 Escape 只作用于最上层的一个', async () => {
            const onCancel = vi.fn<NonNullable<ModalSpecProps['onCancel']>>();
            const onStackedCancel = vi.fn<NonNullable<ModalSpecProps['onCancel']>>();
            await render({ visible: true, onCancel, stacked: { visible: false, title: 'Top', onCancel: onStackedCancel } });
            await handle.update({ stacked: { visible: true, title: 'Top', onCancel: onStackedCancel } });
            await press('Escape');
            expect(onStackedCancel).toHaveBeenCalledTimes(1);
            expect(onCancel).not.toHaveBeenCalled();

            await handle.update({ stacked: { visible: false, title: 'Top', onCancel: onStackedCancel } });
            await waitFor(() => expect(view().getAllByRole('dialog')).toHaveLength(1));
            await press('Escape');
            expect(onCancel).toHaveBeenCalledTimes(1);
        });

        test('最上层对话框的 closeOnEsc 为 false 时，Escape 也不会传给下层对话框', async () => {
            const onCancel = vi.fn<NonNullable<ModalSpecProps['onCancel']>>();
            await render({ visible: true, onCancel, stacked: { visible: false, title: 'Top', closeOnEsc: false } });
            await handle.update({ stacked: { visible: true, title: 'Top', closeOnEsc: false } });
            await press('Escape');
            expect(onCancel).not.toHaveBeenCalled();
        });
    });
}
