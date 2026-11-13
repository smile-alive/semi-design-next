import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { expect, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { defineSpec, type SpecHandle, type SpecMount, type SpecOptions } from './shared/define-spec';

/**
 * Framework-free Tooltip props. The fixture renders a native `<button type="button">trigger</button>` as the trigger
 * (disabled with `triggerDisabled`), `content` as text and, with `contentButton`, a `<button>` after it.
 */
export interface TooltipSpecProps {
    content: string;
    contentButton?: string;
    triggerDisabled?: boolean;
    trigger?: 'hover' | 'focus' | 'click' | 'custom';
    /** `undefined` is uncontrolled */
    visible?: boolean;
    role?: 'tooltip' | 'dialog';
    /** Names a `role="dialog"` popup */
    popupLabel?: string;
    mouseEnterDelay?: number;
    mouseLeaveDelay?: number;
    closeOnEsc?: boolean;
    clickToHide?: boolean;
    clickTriggerToHide?: boolean;
    condition?: boolean;
    keepDOM?: boolean;
    returnFocusOnClose?: boolean;
    onVisibleChange?: (visible: boolean) => void;
    onClickOutSide?: (event: { type: string }) => void;
    onEscKeyDown?: (event: { type: string }) => void;
}

const popupSelector = `.${BASE_CLASS_PREFIX}-tooltip-wrapper`;
const shownSelector = `.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`;

const isMounted = () => document.querySelector(popupSelector) !== null;
const isShown = () => document.querySelector(shownSelector) !== null;

function addOutsideElement() {
    const outside = document.createElement('p');
    outside.textContent = 'outside';
    document.body.append(outside);
    onTestFinished(() => outside.remove());
    return outside;
}

export function tooltipSpec(mount: SpecMount<TooltipSpecProps>, options: SpecOptions = {}) {
    defineSpec('Tooltip（共享 spec）', options, (test) => {
        let handle: SpecHandle<TooltipSpecProps>;

        async function render(props: Partial<TooltipSpecProps> = {}) {
            handle = await mount({ content: 'content', trigger: 'click', mouseEnterDelay: 0, mouseLeaveDelay: 0, ...props });
            return within(document.body);
        }

        const callbacks = () => ({
            onVisibleChange: vi.fn<NonNullable<TooltipSpecProps['onVisibleChange']>>(),
            onClickOutSide: vi.fn<NonNullable<TooltipSpecProps['onClickOutSide']>>(),
            onEscKeyDown: vi.fn<NonNullable<TooltipSpecProps['onEscKeyDown']>>(),
        });

        const trigger = () => within(handle.container).getByRole('button', { name: 'trigger' });
        const waitShown = () => vi.waitFor(() => expect(isShown()).toBe(true));
        const waitClosed = () => vi.waitFor(() => expect(isMounted()).toBe(false));

        test('click 触发：点击打开，点击弹层内部保持打开，点击外部关闭；onVisibleChange 依次收到 true、false', async () => {
            const { onVisibleChange, onClickOutSide } = callbacks();
            const screen = await render({ onVisibleChange, onClickOutSide });
            const outside = addOutsideElement();
            expect(isMounted()).toBe(false);
            await userEvent.click(trigger());
            await waitShown();
            expect(screen.getByRole('tooltip')).toHaveTextContent('content');
            await userEvent.click(screen.getByRole('tooltip'));
            expect(isShown()).toBe(true);
            expect(onClickOutSide).not.toHaveBeenCalled();
            await userEvent.click(outside);
            await waitClosed();
            expect(onClickOutSide).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ type: 'mousedown' }));
            expect(onVisibleChange.mock.calls).toEqual([[true], [false]]);
        });

        test('hover 触发：指针移入打开，移出关闭', async () => {
            const { onVisibleChange } = callbacks();
            await render({ trigger: 'hover', onVisibleChange });
            await userEvent.hover(trigger());
            await waitShown();
            await userEvent.unhover(trigger());
            await waitClosed();
            expect(onVisibleChange.mock.calls).toEqual([[true], [false]]);
        });

        test('focus 触发：获得焦点打开，失去焦点关闭', async () => {
            await render({ trigger: 'focus' });
            trigger().focus();
            await waitShown();
            trigger().blur();
            await waitClosed();
        });

        test('focus 触发：打开与关闭各向 onVisibleChange 报告一次', async () => {
            const { onVisibleChange } = callbacks();
            await render({ trigger: 'focus', onVisibleChange });
            trigger().focus();
            await waitShown();
            trigger().blur();
            await waitClosed();
            expect(onVisibleChange.mock.calls).toEqual([[true], [false]]);
        });

        test('custom 触发：点击、悬停、聚焦都不打开，由 visible 控制', async () => {
            const { onVisibleChange } = callbacks();
            await render({ trigger: 'custom', onVisibleChange });
            await userEvent.click(trigger());
            await userEvent.hover(trigger());
            expect(isMounted()).toBe(false);
            await handle.update({ visible: true });
            await waitShown();
            await handle.update({ visible: false });
            await waitClosed();
            expect(onVisibleChange).not.toHaveBeenCalled();
        });

        test('触发器的 aria-describedby 只在弹层存在时指向它', async () => {
            await render();
            expect(trigger()).not.toHaveAttribute('aria-describedby');
            await userEvent.click(trigger());
            await waitShown();
            const popup = document.querySelector(popupSelector);
            expect(popup).toHaveAttribute('role', 'tooltip');
            expect(trigger()).toHaveAttribute('aria-describedby', popup?.id);
            expect(trigger()).toHaveAccessibleDescription('content');
            await userEvent.click(addOutsideElement());
            await waitClosed();
            expect(trigger()).not.toHaveAttribute('aria-describedby');
        });

        test('role 为 dialog：触发器带 aria-haspopup 与 aria-expanded，aria-controls 只在弹层存在时输出，弹层以 popupLabel 命名且触发器不加 aria-describedby', async () => {
            const screen = await render({ role: 'dialog', popupLabel: '对话框' });
            expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
            expect(trigger()).toHaveAttribute('aria-expanded', 'false');
            expect(trigger()).not.toHaveAttribute('aria-controls');
            await userEvent.click(trigger());
            await waitShown();
            const dialog = screen.getByRole('dialog', { name: '对话框' });
            expect(trigger()).toHaveAttribute('aria-expanded', 'true');
            expect(trigger()).toHaveAttribute('aria-controls', dialog.id);
            expect(trigger()).not.toHaveAttribute('aria-describedby');
        });

        test('Escape 关闭弹层，onEscKeyDown 收到 keydown 事件；closeOnEsc 为 false 时不关闭', async () => {
            const { onEscKeyDown, onVisibleChange } = callbacks();
            await render({ onEscKeyDown, onVisibleChange });
            await userEvent.click(trigger());
            await waitShown();
            await userEvent.keyboard('{Escape}');
            await waitClosed();
            expect(onEscKeyDown).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ type: 'keydown' }));
            expect(onVisibleChange.mock.calls).toEqual([[true], [false]]);

            await handle.update({ closeOnEsc: false });
            await userEvent.click(trigger());
            await waitShown();
            await userEvent.keyboard('{Escape}');
            expect(isShown()).toBe(true);
        });

        test('returnFocusOnClose：焦点在弹层内时按 Escape 关闭，焦点回到触发器', async () => {
            const screen = await render({ contentButton: 'inside', returnFocusOnClose: true });
            await userEvent.click(trigger());
            await waitShown();
            screen.getByRole('button', { name: 'inside' }).focus();
            await userEvent.keyboard('{Escape}');
            await waitClosed();
            expect(trigger()).toHaveFocus();
        });

        test('visible 受控为 true：点击外部与 Escape 只报告 onVisibleChange(false)，弹层保持；使用方改为 false 后关闭且不再报告', async () => {
            const { onVisibleChange } = callbacks();
            await render({ visible: true, onVisibleChange });
            await waitShown();
            await userEvent.click(addOutsideElement());
            trigger().focus();
            await userEvent.keyboard('{Escape}');
            expect(isShown()).toBe(true);
            expect(onVisibleChange.mock.calls).toEqual([[false], [false]]);

            await handle.update({ visible: false });
            await waitClosed();
            expect(onVisibleChange).toHaveBeenCalledTimes(2);
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

        test('visible 受控时使用方自行打开和关闭弹层，不调用 onVisibleChange', async () => {
            const { onVisibleChange } = callbacks();
            await render({ visible: false, onVisibleChange });
            await handle.update({ visible: true });
            await waitShown();
            await handle.update({ visible: false });
            await waitClosed();
            expect(onVisibleChange).not.toHaveBeenCalled();
        });

        test('visible 改回 undefined 后按非受控处理，点击照常开合并报告', async () => {
            const { onVisibleChange } = callbacks();
            await render({ visible: false, onVisibleChange });
            await handle.update({ visible: undefined });
            await userEvent.click(trigger());
            await waitShown();
            await userEvent.click(addOutsideElement());
            await waitClosed();
            expect(onVisibleChange.mock.calls).toEqual([[true], [false]]);
        });

        test('condition 为 false 时不打开；弹层打开后改为 false 则关闭', async () => {
            const { onVisibleChange } = callbacks();
            await render({ condition: false, onVisibleChange });
            await userEvent.click(trigger());
            expect(isMounted()).toBe(false);
            expect(onVisibleChange).not.toHaveBeenCalled();

            await handle.update({ condition: true });
            await userEvent.click(trigger());
            await waitShown();
            await handle.update({ condition: false });
            await waitClosed();
        });

        test('clickToHide：点击弹层内部关闭弹层', async () => {
            const screen = await render({ clickToHide: true });
            await userEvent.click(trigger());
            await waitShown();
            await userEvent.click(screen.getByRole('tooltip'));
            await waitClosed();
        });

        test('click 触发：默认再次点击触发器不关闭弹层', async () => {
            await render();
            await userEvent.click(trigger());
            await waitShown();
            await userEvent.click(trigger());
            await vi.waitFor(() => expect(isShown()).toBe(true));
        });

        test('clickTriggerToHide：再次点击触发器关闭弹层', async () => {
            await render({ clickTriggerToHide: true });
            await userEvent.click(trigger());
            await waitShown();
            await userEvent.click(trigger());
            await waitClosed();
        });

        test('keepDOM：关闭后保留弹层节点但不再显示，再次打开复用同一节点', async () => {
            await render({ keepDOM: true });
            await userEvent.click(trigger());
            await waitShown();
            const popup = document.querySelector(popupSelector);
            await userEvent.click(addOutsideElement());
            await vi.waitFor(() => expect(isShown()).toBe(false));
            expect(document.querySelector(popupSelector)).toBe(popup);
            await userEvent.click(trigger());
            await waitShown();
            expect(document.querySelector(shownSelector)).toBe(popup);
        });
    });
}
