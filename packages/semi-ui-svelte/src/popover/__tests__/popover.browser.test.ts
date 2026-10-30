import { flushSync } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { clickOutside } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { PopoverProps } from '../interface';
import PopoverFixture from './popover-fixture.svelte';
import PopoverNested from './popover-nested.svelte';

function setup(props: Omit<PopoverProps, 'visible' | 'children' | 'child' | 'content'> = {}) {
    const store = createStore({ accept: true, log: [] as string[], shown: true, child: true, focus: false, actions: true, rtl: false, props: { motion: false, 'aria-label': 'Details', ...props } });
    render(PopoverFixture, { props: { mode: 'bind', store } });
    flushSync();
    return { store, trigger: screen.getByRole('button', { name: 'trigger' }) };
}

describe('Svelte Popover 浏览器', () => {
    it.each(['click', 'focus'] as const)('trigger=%s 方向键进入首尾控件，Escape 关闭', async (triggerType) => {
        const { trigger } = setup({ trigger: triggerType });
        const role = triggerType === 'click' ? 'dialog' : 'tooltip';
        if (triggerType === 'click') await userEvent.click(trigger);
        else trigger.focus();
        await screen.findByRole(role);
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(screen.getByRole('button', { name: 'first' })).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole(role)).toBe(null));
        if (triggerType === 'click') await userEvent.click(trigger);
        else {
            trigger.blur();
            trigger.focus();
        }
        await screen.findByRole(role);
        await userEvent.keyboard('{ArrowUp}');
        await waitFor(() => expect(screen.getByRole('button', { name: 'last' })).toHaveFocus());
    });

    it('默认 guardFocus 循环 Tab，Escape 返回触发器', async () => {
        const { trigger } = setup({ trigger: 'click' });
        await userEvent.click(trigger);
        await screen.findByRole('dialog');
        await userEvent.keyboard('{ArrowUp}');
        await waitFor(() => expect(screen.getByRole('button', { name: 'last' })).toHaveFocus());
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
        await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
        expect(screen.getByRole('button', { name: 'last' })).toHaveFocus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(trigger).toHaveFocus());
    });

    it('closeOnEsc=false 保持显示，returnFocusOnClose=false 不还原焦点', async () => {
        const { store, trigger } = setup({ trigger: 'click', closeOnEsc: false, returnFocusOnClose: false });
        await userEvent.click(trigger);
        await screen.findByRole('dialog');
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(screen.getByRole('button', { name: 'first' })).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        expect(screen.getByRole('dialog')).toBeVisible();
        store.props = { ...store.props, closeOnEsc: true };
        flushSync();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBe(null));
        expect(trigger).not.toHaveFocus();
    });

    it('内容中嵌套 Popover 的弹层点击不关闭祖先，外部点击全部关闭', async () => {
        render(PopoverNested, { props: { where: 'content', props: { trigger: 'click', motion: false } } });
        await userEvent.click(screen.getByRole('button', { name: 'outer trigger' }));
        await userEvent.click(await screen.findByRole('button', { name: 'inner trigger' }));
        await userEvent.click(await screen.findByRole('button', { name: 'inner action' }));
        expect(screen.getAllByRole('dialog')).toHaveLength(2);
        await clickOutside();
        await waitFor(() => expect(screen.queryAllByRole('dialog')).toHaveLength(0));
    });

    it.each(['topRight', 'rightBottom', 'bottomRight', 'leftBottom'] as const)('showArrow position=%s 弹层覆盖触发器中心', async (position) => {
        const { trigger } = setup({ trigger: 'click', position, showArrow: true });
        trigger.style.margin = '280px 0 0 420px';
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
