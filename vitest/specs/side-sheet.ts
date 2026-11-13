import { createEvent, fireEvent, waitFor, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { checkPattern } from '../utils/apg';
import { defineSpec, type SpecHandle, type SpecMount, type SpecOptions } from './shared/define-spec';

/** A second sheet rendered as a sibling after the first, so it opens on top of it */
export interface SideSheetSpecStacked {
    visible?: boolean;
    title?: string;
    closeOnEsc?: boolean;
    onCancel?: (event: { type: string }) => void;
}

/** Framework-free SideSheet props; the fixtures always pass `motion={false}` and render a button named "Inner" after `content` */
export interface SideSheetSpecProps {
    visible?: boolean;
    title?: string;
    content?: string;
    closable?: boolean;
    mask?: boolean;
    maskClosable?: boolean;
    closeOnEsc?: boolean;
    keepDOM?: boolean;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    'data-foo'?: string;
    onCancel?: (event: { type: string }) => void;
    afterVisibleChange?: (visible: boolean) => void;
    stacked?: SideSheetSpecStacked;
}

const prefix = `${BASE_CLASS_PREFIX}-sidesheet`;

const press = async (key: string) => {
    await userEvent.keyboard(key === 'Shift+Tab' ? '{Shift>}{Tab}{/Shift}' : key.length === 1 ? key : `{${key}}`);
};

export function sideSheetSpec(mount: SpecMount<SideSheetSpecProps>, options: SpecOptions = {}) {
    defineSpec('SideSheet（共享 spec）', options, (test) => {
        let handle: SpecHandle<SideSheetSpecProps>;
        const extras: HTMLElement[] = [];

        async function render(props: SideSheetSpecProps = {}) {
            handle = await mount({ title: 'Sheet', content: 'sheet body', ...props });
            return handle;
        }

        function outsideButton() {
            const button = document.body.appendChild(document.createElement('button'));
            extras.push(button);
            return button;
        }

        afterEach(() => {
            extras.splice(0).forEach((element) => element.remove());
        });

        const view = () => within(document.body);
        const dialog = () => view().getByRole('dialog');
        const queryDialog = () => view().queryByRole('dialog');
        const closeButton = () => document.querySelector<HTMLElement>(`.${prefix}-close`);
        const innerButton = () => view().getByRole('button', { name: 'Inner' });
        const mask = () => document.querySelector<HTMLElement>(`.${prefix}-mask`);
        const bodyLocked = () => document.body.style.overflow === 'hidden';
        const hide = () => handle.update({ visible: false });
        // `data-*` lands on the outermost element, which is neither the dialog nor inside it
        const dataOwner = () => document.querySelector('[data-foo]');

        test('渲染 role=dialog，标题给对话框命名，正文在对话框内，默认带 aria-modal', async () => {
            await render({ visible: true });
            expect(dialog()).toHaveAccessibleName('Sheet');
            expect(dialog()).toHaveAttribute('aria-modal', 'true');
            expect(dialog()).toHaveTextContent('sheet body');
        });

        test('visible 受控：为 false 时不渲染，改为 true 后出现，改回 false 后卸载', async () => {
            await render();
            expect(queryDialog()).toBeNull();
            await handle.update({ visible: true });
            expect(dialog()).toBeInTheDocument();
            await hide();
            await waitFor(() => expect(queryDialog()).toBeNull());
        });

        test('点击关闭按钮调用 onCancel；受控的 visible 不因此改变', async () => {
            const onCancel = vi.fn<NonNullable<SideSheetSpecProps['onCancel']>>();
            await render({ visible: true, onCancel });
            await userEvent.click(closeButton()!);
            expect(onCancel).toHaveBeenCalledTimes(1);
            expect(onCancel.mock.calls[0][0].type).toBe('click');
            expect(dialog()).toBeInTheDocument();
        });

        test('closable 为 false 时没有关闭按钮', async () => {
            await render({ visible: true, closable: false });
            expect(closeButton()).toBeNull();
        });

        test('点击遮罩调用 onCancel，maskClosable 为 false 时不调用，点击面板内部不调用', async () => {
            const onCancel = vi.fn<NonNullable<SideSheetSpecProps['onCancel']>>();
            await render({ visible: true, onCancel });
            await userEvent.click(view().getByText('sheet body'));
            expect(onCancel).not.toHaveBeenCalled();
            await userEvent.click(mask()!);
            expect(onCancel).toHaveBeenCalledTimes(1);

            await handle.update({ maskClosable: false });
            await userEvent.click(mask()!);
            expect(onCancel).toHaveBeenCalledTimes(1);
        });

        test('closeOnEsc 为 true 时 Escape 调用 onCancel，参数是原生键盘事件；为 false 时不调用', async () => {
            const onCancel = vi.fn<NonNullable<SideSheetSpecProps['onCancel']>>();
            await render({ visible: true, closeOnEsc: true, onCancel });
            await press('Escape');
            expect(onCancel).toHaveBeenCalledTimes(1);
            expect(onCancel.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);

            await handle.update({ closeOnEsc: false });
            await press('Escape');
            expect(onCancel).toHaveBeenCalledTimes(1);
        });

        test('隐藏时 Escape 不调用 onCancel', async () => {
            const onCancel = vi.fn<NonNullable<SideSheetSpecProps['onCancel']>>();
            await render({ visible: true, closeOnEsc: true, onCancel });
            await hide();
            await waitFor(() => expect(queryDialog()).toBeNull());
            await press('Escape');
            expect(onCancel).not.toHaveBeenCalled();
        });

        // the mask is the dialog's sibling, so the click of this press goes to their common ancestor, not the mask
        test('在对话框内按下、在遮罩上松开不关闭，点击对话框内部也不关闭', async () => {
            const onCancel = vi.fn<NonNullable<SideSheetSpecProps['onCancel']>>();
            await render({ visible: true, onCancel });
            await userEvent.pointer([{ keys: '[MouseLeft>]', target: view().getByText('sheet body') }, { target: mask()! }, { keys: '[/MouseLeft]' }]);
            expect(onCancel).not.toHaveBeenCalled();
            await userEvent.click(view().getByText('sheet body'));
            expect(onCancel).not.toHaveBeenCalled();
        });

        test('mask 为 false 时没有遮罩，对话框不带 aria-modal', async () => {
            await render({ visible: true, mask: false });
            expect(mask()).toBeNull();
            expect(dialog()).not.toHaveAttribute('aria-modal');
        });

        test('打开时页面其余部分变为 inert，关闭后释放；非模态不设 inert', async () => {
            await render({ visible: true });
            expect(handle.container.inert).toBe(true);
            await hide();
            await waitFor(() => expect(handle.container.inert).toBe(false));

            await handle.update({ visible: true, mask: false });
            expect(handle.container.inert).toBe(false);
        });

        test('模态抽屉锁定 body 滚动，关闭后恢复；mask 为 false 时不锁', async () => {
            await render({ visible: true });
            expect(bodyLocked()).toBe(true);
            await hide();
            await waitFor(() => expect(bodyLocked()).toBe(false));

            await handle.update({ visible: true, mask: false });
            expect(bodyLocked()).toBe(false);
        });

        test('打开时焦点进入抽屉，关闭后焦点回到打开前的元素', async () => {
            const trigger = outsideButton();
            await render();
            trigger.focus();
            await handle.update({ visible: true });
            expect(dialog()).toContainElement(document.activeElement as HTMLElement);
            await hide();
            await waitFor(() => expect(trigger).toHaveFocus());
        });

        test('非模态抽屉打开时焦点也进入抽屉，关闭后焦点回到打开前的元素', async () => {
            const trigger = outsideButton();
            await render({ mask: false });
            trigger.focus();
            await handle.update({ visible: true });
            expect(dialog()).toContainElement(document.activeElement as HTMLElement);
            await hide();
            await waitFor(() => expect(trigger).toHaveFocus());
        });

        test('非模态抽屉关闭时，焦点已移到页面其他位置则不抢回', async () => {
            const trigger = outsideButton();
            const other = outsideButton();
            await render({ mask: false, keepDOM: true });
            trigger.focus();
            await handle.update({ visible: true });
            other.focus();
            await hide();
            expect(other).toHaveFocus();
        });

        test('模态抽屉内 Tab 与 Shift+Tab 在抽屉内循环，不会离开', async () => {
            outsideButton();
            await render({ visible: true });
            innerButton().focus();
            await press('Tab');
            expect(closeButton()).toHaveFocus();
            await press('Shift+Tab');
            expect(innerButton()).toHaveFocus();
        });

        test('非模态抽屉不拦截 Tab', async () => {
            await render({ visible: true, mask: false });
            const inner = innerButton();
            inner.focus();
            expect(fireEvent(inner, createEvent.keyDown(inner, { key: 'Tab' }))).toBe(true);
            expect(inner).toHaveFocus();
        });

        test('符合 APG dialog 模式：命名、aria-modal、焦点进入并在内部循环', async () => {
            outsideButton();
            await render({ visible: true });
            await expect(checkPattern('dialog', document.body, { press, actions: false })).resolves.toBeUndefined();
        });

        test('aria-labelledby、aria-describedby 落在 role=dialog 元素上，data-* 落在外层元素上', async () => {
            await render({ visible: true, 'aria-labelledby': 'outside-label', 'aria-describedby': 'outside-desc', 'data-foo': 'bar' });
            expect(dialog()).toHaveAttribute('aria-labelledby', 'outside-label');
            expect(dialog()).toHaveAttribute('aria-describedby', 'outside-desc');
            expect(dialog()).not.toHaveAttribute('data-foo');
            expect(dataOwner()).not.toBe(dialog());
            expect(dataOwner()).toContainElement(dialog());
            expect(dataOwner()).not.toHaveAttribute('aria-labelledby');
            expect(dataOwner()).not.toHaveAttribute('aria-describedby');
        });

        test('aria-label 作为对话框的名称，落在 role=dialog 元素上', async () => {
            await render({ visible: true, title: undefined, 'aria-label': 'Settings' });
            expect(dialog()).toHaveAttribute('aria-label', 'Settings');
            expect(dialog()).toHaveAccessibleName('Settings');
            expect(dataOwner()).toBeNull();
        });

        test('afterVisibleChange 每次显示状态变化只报告一次，挂载时不报告', async () => {
            const afterVisibleChange = vi.fn<NonNullable<SideSheetSpecProps['afterVisibleChange']>>();
            await render({ visible: true, afterVisibleChange });
            expect(afterVisibleChange).not.toHaveBeenCalled();
            await hide();
            await waitFor(() => expect(afterVisibleChange).toHaveBeenCalledTimes(1));
            expect(afterVisibleChange).toHaveBeenLastCalledWith(false);
            await handle.update({ visible: true });
            await waitFor(() => expect(afterVisibleChange).toHaveBeenCalledTimes(2));
            expect(afterVisibleChange).toHaveBeenLastCalledWith(true);
        });

        test('keepDOM 从一开始就以隐藏状态渲染，打开后显示，关闭后保留节点并隐藏', async () => {
            const hidden = () => document.querySelector(`.${prefix}`)!.classList.contains(`${prefix}-hidden`);
            await render({ keepDOM: true });
            expect(hidden()).toBe(true);
            await handle.update({ visible: true });
            expect(hidden()).toBe(false);
            expect(dialog()).toBeInTheDocument();
            await hide();
            expect(hidden()).toBe(true);
            expect(document.body).toHaveTextContent('sheet body');
            expect(bodyLocked()).toBe(false);
            await handle.update({ visible: true });
            expect(hidden()).toBe(false);
        });

        test('叠加两个抽屉时 Escape 只作用于最上层的一个', async () => {
            const onCancel = vi.fn<NonNullable<SideSheetSpecProps['onCancel']>>();
            const onStackedCancel = vi.fn<NonNullable<SideSheetSpecProps['onCancel']>>();
            await render({ visible: true, closeOnEsc: true, onCancel, stacked: { visible: false, title: 'Top', closeOnEsc: true, onCancel: onStackedCancel } });
            await handle.update({ stacked: { visible: true, title: 'Top', closeOnEsc: true, onCancel: onStackedCancel } });
            await press('Escape');
            expect(onStackedCancel).toHaveBeenCalledTimes(1);
            expect(onCancel).not.toHaveBeenCalled();
        });
    });
}
