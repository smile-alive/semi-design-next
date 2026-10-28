/** @jsxImportSource vue */
import { screen, waitFor } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { clickOutside } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import type { PopoverProps } from '../interface';
import Popover from '../popover.vue';
import Custom from './fixtures/custom.vue';
import Model from './fixtures/model.vue';

function renderPop(props: PopoverProps = {}) {
    return render(Popover, {
        props: { motion: false, ariaLabel: 'Details', ...props },
        slots: {
            default: () => <button type="button">trigger</button>,
            content: () => (
                <>
                    <button type="button">first</button>
                    <a href="https://semi.design">link</a>
                    <button type="button">last</button>
                </>
            ),
        },
    });
}

describe('Popover 浏览器', () => {
    it('ShadowRoot 内用键盘打开，焦点在弹层内时 Escape 关闭后焦点回到触发按钮', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(Popover, {
            container: mount,
            props: { ariaLabel: 'Details', motion: false, returnFocusOnClose: true, trigger: 'click' },
            slots: { default: () => <button>shadow trigger</button>, content: () => <input aria-label="shadow input" /> },
        });
        try {
            const trigger = shadow.querySelector('button');
            trigger?.focus();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(shadow.querySelector('input')).not.toBeNull());
            shadow.querySelector('input')?.focus();
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(shadow.querySelector('[popover]')).toBeNull());
            expect(shadow.activeElement).toBe(trigger);
        } finally {
            view.unmount();
            host.remove();
        }
    });

    it('custom 方向键进入首尾控件，Escape 由使用方关闭', async () => {
        render(Custom);
        const trigger = screen.getByRole('button', { name: 'trigger' });
        await userEvent.click(trigger);
        await screen.findByRole('dialog');
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(screen.getByRole('button', { name: 'first' })).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        await userEvent.click(trigger);
        await screen.findByRole('dialog');
        await userEvent.keyboard('{ArrowUp}');
        await waitFor(() => expect(screen.getByRole('button', { name: 'last' })).toHaveFocus());
    });

    it('后代 Popover 的 Teleport 点击不关闭祖先', async () => {
        render(Popover, {
            props: { trigger: 'click', motion: false, ariaLabel: 'Outer' },
            slots: {
                default: () => <button>outer</button>,
                content: () => (
                    <Popover trigger="click" motion={false} ariaLabel="Inner">
                        {{
                            default: () => <button>inner</button>,
                            content: () => <button>action</button>,
                        }}
                    </Popover>
                ),
            },
        });
        await userEvent.click(screen.getByRole('button', { name: 'outer' }));
        await userEvent.click(await screen.findByRole('button', { name: 'inner' }));
        await userEvent.click(await screen.findByRole('button', { name: 'action' }));
        expect(screen.getAllByRole('dialog')).toHaveLength(2);
        await clickOutside();
        await waitFor(() => expect(screen.queryAllByRole('dialog')).toHaveLength(0));
    });

    it.each(['click', 'focus'] as const)('trigger=%s 方向键进入首尾控件，Escape 关闭', async (triggerType) => {
        renderPop({ trigger: triggerType });
        const trigger = screen.getByRole('button', { name: 'trigger' });
        if (triggerType === 'click') await userEvent.click(trigger);
        else {
            await userEvent.keyboard('{Tab}');
        }
        await screen.findByRole(triggerType === 'click' ? 'dialog' : 'tooltip');
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(screen.getByRole('button', { name: 'first' })).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole(triggerType === 'click' ? 'dialog' : 'tooltip')).toBeNull());
        if (triggerType === 'click') await userEvent.click(trigger);
        else {
            trigger.blur();
            trigger.focus();
        }
        await screen.findByRole(triggerType === 'click' ? 'dialog' : 'tooltip');
        await userEvent.keyboard('{ArrowUp}');
        await waitFor(() => expect(screen.getByRole('button', { name: 'last' })).toHaveFocus());
    });

    it('默认 guardFocus 循环 Tab，Escape 返回触发器', async () => {
        renderPop({ trigger: 'click' });
        const trigger = screen.getByRole('button', { name: 'trigger' });
        await userEvent.click(trigger);
        await userEvent.keyboard('{ArrowUp}');
        await waitFor(() => expect(screen.getByRole('button', { name: 'last' })).toHaveFocus());
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
        await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
        expect(screen.getByRole('button', { name: 'last' })).toHaveFocus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(trigger).toHaveFocus());
    });

    it('initialFocusRef 的初始焦点与 v-model 同步', async () => {
        render(Model);
        await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
        await waitFor(() => expect(screen.getByRole('textbox', { name: 'initial' })).toHaveFocus());
        expect(screen.getByRole('status')).toHaveTextContent('true');
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(screen.getByRole('status')).toHaveTextContent('false');
    });

    it('closeOnEsc=false 保持显示，returnFocusOnClose=false 不还原焦点', async () => {
        const view = renderPop({ trigger: 'click', closeOnEsc: false, returnFocusOnClose: false });
        const trigger = screen.getByRole('button', { name: 'trigger' });
        await userEvent.click(trigger);
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(screen.getByRole('button', { name: 'first' })).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        expect(screen.getByRole('dialog')).toBeVisible();
        await view.rerender({ closeOnEsc: true });
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(trigger).not.toHaveFocus();
    });

    it.each(['topRight', 'rightBottom', 'bottomRight', 'leftBottom'] as const)('showArrow position=%s 弹层覆盖触发器中心', async (position) => {
        render(Popover, {
            props: { trigger: 'click', position, showArrow: true, motion: false, ariaLabel: 'Details' },
            slots: {
                default: () => <button style={{ margin: '280px 0 0 420px' }}>trigger</button>,
                content: () => <article style={{ width: '180px' }}>card</article>,
            },
        });
        const trigger = screen.getByRole('button');
        await userEvent.click(trigger);
        const popup = await screen.findByRole('dialog');
        await expect.element(popup).toBeVisible();
        await waitFor(() => {
            const triggerRect = trigger.getBoundingClientRect();
            const popupRect = popup.getBoundingClientRect();
            const x = triggerRect.left + triggerRect.width / 2;
            const y = triggerRect.top + triggerRect.height / 2;
            expect((popupRect.left <= x && popupRect.right >= x) || (popupRect.top <= y && popupRect.bottom >= y)).toBe(true);
        });
    });
});
