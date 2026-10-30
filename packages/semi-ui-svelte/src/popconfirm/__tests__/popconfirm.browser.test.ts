import { flushSync } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { PopconfirmProps } from '../interface';
import PopconfirmFixture from './popconfirm-fixture.svelte';

const footerButtons = () => document.querySelectorAll<HTMLElement>('.semi-popconfirm-footer .semi-button');

function setup(props: Omit<PopconfirmProps, 'visible' | 'children' | 'child' | 'content' | 'icon'> = {}, content: 'text' | 'input' = 'text') {
    const store = createStore({
        accept: true,
        log: [] as string[],
        shown: true,
        rtl: false,
        titleSnippet: false,
        content,
        icon: 'default' as const,
        props: { title: '确定是否要保存此修改？', ...props },
    });
    render(PopconfirmFixture, { props: { store } });
    flushSync();
    return screen.getByRole('button', { name: 'Save' });
}

describe('Svelte Popconfirm 浏览器', () => {
    it.each([
        ['ok', 1],
        ['cancel', 0],
    ] as const)('%s 按钮 autoFocus 获焦，点击后焦点回到触发器', async (kind, index) => {
        const trigger = setup(kind === 'ok' ? { okButtonProps: { autoFocus: true, type: 'danger' } } : { cancelButtonProps: { autoFocus: true } });
        await userEvent.click(trigger);
        await waitFor(() => expect(footerButtons()[index]).toHaveFocus());
        await userEvent.click(footerButtons()[index]);
        await waitFor(() => expect(trigger).toHaveFocus());
    });

    it('keepDOM 时第二次打开确认按钮仍获得 autoFocus', async () => {
        const trigger = setup({ keepDOM: true, okButtonProps: { autoFocus: true } });
        await userEvent.click(trigger);
        await waitFor(() => expect(footerButtons()[1]).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(trigger).toHaveFocus());
        await userEvent.click(trigger);
        await waitFor(() => expect(footerButtons()[1]).toHaveFocus());
    });

    it('内容区 initialFocusRef 获焦', async () => {
        const trigger = setup({}, 'input');
        await userEvent.click(trigger);
        await waitFor(() => expect(screen.getByPlaceholderText('focus here')).toHaveFocus());
    });

    it('按钮 autoFocus 与 initialFocusRef 同时指定时按钮优先', async () => {
        const trigger = setup({ okButtonProps: { autoFocus: true } }, 'input');
        await userEvent.click(trigger);
        await waitFor(() => expect(footerButtons()[1]).toHaveFocus());
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(footerButtons()[1]).toHaveFocus();
    });

    it('关闭后点击外部输入框时不抢焦点', async () => {
        const trigger = setup();
        await userEvent.click(trigger);
        await screen.findByRole('dialog');
        await userEvent.click(screen.getByLabelText('outside'));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBe(null));
        expect(screen.getByLabelText('outside')).toHaveFocus();
    });

    it('trigger 为 focus 时 Tab 离开后焦点停在下一个元素，不被拉回触发器', async () => {
        const trigger = setup({ trigger: 'focus' });
        trigger.focus();
        await screen.findByRole('dialog');
        screen.getByRole('button', { name: 'focus' }).focus();
        await waitFor(() => expect(screen.queryByRole('dialog')).toBe(null));
        expect(screen.getByRole('button', { name: 'focus' })).toHaveFocus();
    });
});
