import { render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { tab } from '@test/utils/browser';
import Popconfirm from '..';
import Button from '../../button';

const prefix = `${BASE_CLASS_PREFIX}-popconfirm`;
const footerButtons = () => document.querySelectorAll<HTMLElement>(`.${prefix}-footer .${BASE_CLASS_PREFIX}-button`);

describe('Popconfirm（浏览器）', () => {
    it('确认按钮焦点', async () => {
        render(() => (
            <Popconfirm title="确定是否要保存此修改？" content="此修改将不可逆" okButtonProps={{ autoFocus: true, type: 'danger' }}>
                {(t) => <Button {...t()}>确认聚焦</Button>}
            </Popconfirm>
        ));
        const trigger = screen.getByRole('button', { name: '确认聚焦' });
        await userEvent.click(trigger);
        await waitFor(() => expect(footerButtons()[1]).toHaveFocus());
        await userEvent.click(footerButtons()[1]);
        await waitFor(() => expect(trigger).toHaveFocus());
    });

    it('取消按钮焦点', async () => {
        render(() => (
            <Popconfirm title="确定是否要保存此修改？" cancelButtonProps={{ autoFocus: true }} content="此修改将不可逆">
                {(t) => <Button {...t()}>取消聚焦</Button>}
            </Popconfirm>
        ));
        const trigger = screen.getByRole('button', { name: '取消聚焦' });
        await userEvent.click(trigger);
        await waitFor(() => expect(footerButtons()[0]).toHaveFocus());
        await userEvent.click(footerButtons()[0]);
        await waitFor(() => expect(trigger).toHaveFocus());
    });

    it('内容区焦点', async () => {
        render(() => (
            <Popconfirm title="确定是否要保存此修改？" content={({ initialFocusRef }) => <input ref={initialFocusRef} placeholder="focus here" />}>
                {(t) => <Button {...t()}>内容聚焦</Button>}
            </Popconfirm>
        ));
        const trigger = screen.getByRole('button', { name: '内容聚焦' });
        await userEvent.click(trigger);
        await waitFor(() => expect(document.querySelector(`.${prefix}-body input`)).toHaveFocus());
        await userEvent.click(document.querySelector(`.${prefix}-header .${BASE_CLASS_PREFIX}-button`) as Element);
        await waitFor(() => expect(trigger).toHaveFocus());
    });

    it('autoFocus 的按钮优先于内容区的初始焦点', async () => {
        render(() => (
            <Popconfirm title="确定是否要保存此修改？" content={({ initialFocusRef }) => <input ref={initialFocusRef} placeholder="focus here" />} okButtonProps={{ autoFocus: true }}>
                {(t) => <Button {...t()}>按钮优先</Button>}
            </Popconfirm>
        ));
        await userEvent.click(screen.getByRole('button', { name: '按钮优先' }));
        await waitFor(() => expect(footerButtons()[1]).toHaveFocus());
    });

    it('内容区 esc keydown-1', async () => {
        render(() => (
            <Popconfirm title="确定是否要保存此修改？" content="此修改将不可逆" okButtonProps={{ autoFocus: true, class: 'test-ok' }}>
                {(t) => <Button {...t()}>content</Button>}
            </Popconfirm>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'content' }));
        await waitFor(() => expect(document.querySelector('.test-ok')).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(document.querySelector('.test-ok')).toBeNull());
    });

    it('内容区 esc keydown-2', async () => {
        const onClick = vi.fn<() => void>();
        render(() => (
            <Popconfirm title="确定是否要保存此修改？" content={<div ref={(node) => node.addEventListener('click', onClick)}>此修改将不可逆</div>} okButtonProps={{ autoFocus: true, class: 'test-ok' }}>
                {(t) => <Button {...t()}>trigger</Button>}
            </Popconfirm>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
        await userEvent.click(await screen.findByText('此修改将不可逆'));
        expect(onClick).toHaveBeenCalledTimes(1);
        // Esc still closes the popup after a click on its non-focusable content
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(document.querySelector('.test-ok')).toBeNull());
    });

    it('onConfirm 返回 Promise', async () => {
        const confirm = Promise.withResolvers<number>();
        render(() => (
            <Popconfirm title="确定是否要保存此修改？" content="此修改将不可逆" onConfirm={() => confirm.promise}>
                {(t) => <Button {...t()}>保存</Button>}
            </Popconfirm>
        ));
        await userEvent.click(screen.getByRole('button', { name: '保存' }));
        await userEvent.click(await screen.findByText('确定'));
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-button-loading`)).toHaveTextContent('确定'));
        confirm.resolve(1);
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-button-loading`)).toBeNull());
    });

    it('onCancel 返回 Promise', async () => {
        const cancel = Promise.withResolvers<number>();
        render(() => (
            <Popconfirm title="确定是否要保存此修改？" content="此修改将不可逆" onCancel={() => cancel.promise}>
                {(t) => <Button {...t()}>保存</Button>}
            </Popconfirm>
        ));
        await userEvent.click(screen.getByRole('button', { name: '保存' }));
        await userEvent.click(await screen.findByText('取消'));
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-button-loading`)).toHaveTextContent('取消'));
        cancel.reject(1);
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-button-loading`)).toBeNull());
    });

    it('trigger 为 focus 时 Tab 离开后焦点停在下一个元素，不被拉回触发器', async () => {
        render(() => (
            <>
                <Popconfirm title="确定是否要保存此修改？" content="此修改将不可逆" trigger="focus">
                    {(t) => <Button {...t()}>focus confirm</Button>}
                </Popconfirm>
                <Button>after</Button>
            </>
        ));
        screen.getByRole('button', { name: 'focus confirm' }).focus();
        await screen.findByRole('dialog');
        await tab();
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        // the close lands after mouseLeaveDelay (100ms); a focus pulled back would also reopen the dialog
        await new Promise((resolve) => setTimeout(resolve, 300));
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    });
});
