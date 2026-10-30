import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Button, Popconfirm } from '@fibrae/semi-ui-react';
import { tab } from '@test/utils/browser';

const prefix = `${BASE_CLASS_PREFIX}-popconfirm`;
const footerButtons = () => document.querySelectorAll(`.${prefix}-footer .${BASE_CLASS_PREFIX}-button`);

function deferred() {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

describe('Popconfirm（浏览器）', () => {
    it('确认按钮焦点', async () => {
        render(
            <Popconfirm title="确定是否要保存此修改？" content="此修改将不可逆" okButtonProps={{ autoFocus: true, type: 'danger' }}>
                <Button>确认聚焦</Button>
            </Popconfirm>
        );
        const trigger = screen.getByRole('button', { name: '确认聚焦' });
        await userEvent.click(trigger);
        await waitFor(() => expect(footerButtons()[1]).toHaveFocus());
        await userEvent.click(footerButtons()[1]);
        await waitFor(() => expect(trigger).toHaveFocus());
    });

    it('取消按钮焦点', async () => {
        render(
            <Popconfirm title="确定是否要保存此修改？" cancelButtonProps={{ autoFocus: true }} content="此修改将不可逆">
                <Button>取消聚焦</Button>
            </Popconfirm>
        );
        const trigger = screen.getByRole('button', { name: '取消聚焦' });
        await userEvent.click(trigger);
        await waitFor(() => expect(footerButtons()[0]).toHaveFocus());
        await userEvent.click(footerButtons()[0]);
        await waitFor(() => expect(trigger).toHaveFocus());
    });

    it('内容区焦点', async () => {
        render(
            <Popconfirm title="确定是否要保存此修改？" content={({ initialFocusRef }) => <input ref={initialFocusRef} placeholder="focus here" />}>
                <Button>内容聚焦</Button>
            </Popconfirm>
        );
        const trigger = screen.getByRole('button', { name: '内容聚焦' });
        await userEvent.click(trigger);
        await waitFor(() => expect(document.querySelector(`.${prefix}-body input`)).toHaveFocus());
        await userEvent.click(document.querySelector(`.${prefix}-header .${BASE_CLASS_PREFIX}-button`));
        await waitFor(() => expect(trigger).toHaveFocus());
    });

    it('内容区 esc keydown-1', async () => {
        render(
            <Popconfirm title="确定是否要保存此修改？" content="此修改将不可逆" okButtonProps={{ autoFocus: true, className: 'test-ok' }}>
                <Button>content</Button>
            </Popconfirm>
        );
        await userEvent.click(screen.getByRole('button', { name: 'content' }));
        await waitFor(() => expect(document.querySelector('.test-ok')).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(document.querySelector('.test-ok')).toBeNull());
    });

    it('内容区 esc keydown-2', async () => {
        const onClick = vi.fn<() => void>();
        render(
            <Popconfirm
                title="确定是否要保存此修改？"
                content={
                    <div className="test-text" onClick={onClick}>
                        此修改将不可逆
                    </div>
                }
                okButtonProps={{ autoFocus: true, className: 'test-ok' }}
            >
                <Button>trigger</Button>
            </Popconfirm>
        );
        await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
        await userEvent.click(await screen.findByText('此修改将不可逆'));
        expect(onClick).toHaveBeenCalledTimes(1);
        // Esc still closes the popup after a click on its non-focusable content
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(document.querySelector('.test-ok')).toBeNull());
    });

    it('onConfirm 返回 Promise', async () => {
        const confirm = deferred();
        render(
            <Popconfirm title="确定是否要保存此修改？" content="此修改将不可逆" onConfirm={() => confirm.promise}>
                <Button>保存</Button>
            </Popconfirm>
        );
        await userEvent.click(screen.getByRole('button', { name: '保存' }));
        await userEvent.click(await screen.findByText('确定'));
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-button-loading`)).toHaveTextContent('确定'));
        confirm.resolve(1);
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-button-loading`)).toBeNull());
    });

    it('onCancel 返回 Promise', async () => {
        const cancel = deferred();
        render(
            <Popconfirm title="确定是否要保存此修改？" content="此修改将不可逆" onCancel={() => cancel.promise}>
                <Button>保存</Button>
            </Popconfirm>
        );
        await userEvent.click(screen.getByRole('button', { name: '保存' }));
        await userEvent.click(await screen.findByText('取消'));
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-button-loading`)).toHaveTextContent('取消'));
        cancel.reject(1);
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-button-loading`)).toBeNull());
    });

    it('trigger 为 focus 时 Tab 离开后焦点停在下一个元素，不被拉回触发器', async () => {
        render(
            <>
                <Popconfirm title="确定是否要保存此修改？" content="此修改将不可逆" trigger="focus">
                    <Button>focus confirm</Button>
                </Popconfirm>
                <Button>after</Button>
            </>
        );
        screen.getByRole('button', { name: 'focus confirm' }).focus();
        await screen.findByRole('dialog');
        await tab();
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        // the close lands after mouseLeaveDelay (100ms); a focus pulled back would also reopen the dialog
        await new Promise((resolve) => setTimeout(resolve, 300));
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    });
});
