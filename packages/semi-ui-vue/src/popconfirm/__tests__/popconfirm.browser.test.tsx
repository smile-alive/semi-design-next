/** @jsxImportSource vue */
import { screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { tab } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Button from '../../button';
import type { PopconfirmProps } from '../interface';
import Popconfirm from '../popconfirm.vue';
import ContentClick from './fixtures/content-click.vue';
import ContentFocus from './fixtures/content-focus.vue';
import Outside from './fixtures/outside.vue';

const footerButtons = () => document.querySelectorAll<HTMLElement>('.semi-popconfirm-footer .semi-button');
const loading = () => document.querySelector('.semi-button-loading');

function deferred<T = void>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

function renderPopconfirm(label: string, props: PopconfirmProps = {}) {
    return render(Popconfirm, {
        props,
        slots: {
            default: () => <Button>{() => label}</Button>,
            title: () => '确定是否要保存此修改？',
            content: () => '此修改将不可逆',
        },
    });
}

describe('Popconfirm 浏览器', () => {
    it('确认按钮焦点', async () => {
        renderPopconfirm('确认聚焦', { okButtonProps: { autoFocus: true, type: 'danger' } });
        const trigger = screen.getByRole('button', { name: '确认聚焦' });
        await userEvent.click(trigger);
        await waitFor(() => expect(footerButtons()[1]).toHaveFocus());
        await userEvent.click(footerButtons()[1]);
        await waitFor(() => expect(trigger).toHaveFocus());
    });

    it('取消按钮焦点', async () => {
        renderPopconfirm('取消聚焦', { cancelButtonProps: { autoFocus: true } });
        const trigger = screen.getByRole('button', { name: '取消聚焦' });
        await userEvent.click(trigger);
        await waitFor(() => expect(footerButtons()[0]).toHaveFocus());
        await userEvent.click(footerButtons()[0]);
        await waitFor(() => expect(trigger).toHaveFocus());
    });

    it('keepDOM 时第二次打开确认按钮仍获得 autoFocus', async () => {
        renderPopconfirm('保留', { keepDOM: true, okButtonProps: { autoFocus: true } });
        const trigger = screen.getByRole('button', { name: '保留' });
        await userEvent.click(trigger);
        await waitFor(() => expect(footerButtons()[1]).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(trigger).toHaveFocus());
        await userEvent.click(trigger);
        await waitFor(() => expect(footerButtons()[1]).toHaveFocus());
    });

    it('内容区焦点', async () => {
        render(ContentFocus);
        const trigger = screen.getByRole('button', { name: '内容聚焦' });
        await userEvent.click(trigger);
        await waitFor(() => expect(document.querySelector('.semi-popconfirm-body input')).toHaveFocus());
        await userEvent.click(screen.getByRole('button', { name: '关闭' }));
        await waitFor(() => expect(trigger).toHaveFocus());
    });

    it('按钮 autoFocus 与 initialFocusRef 同时指定时按钮优先', async () => {
        render(ContentFocus, { props: { okAutoFocus: true } });
        await userEvent.click(screen.getByRole('button', { name: '内容聚焦' }));
        await waitFor(() => expect(footerButtons()[1]).toHaveFocus());
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(footerButtons()[1]).toHaveFocus();
    });

    it('内容区 esc keydown-1', async () => {
        renderPopconfirm('content', { okButtonProps: { autoFocus: true, class: 'test-ok' } });
        await userEvent.click(screen.getByRole('button', { name: 'content' }));
        await waitFor(() => expect(document.querySelector('.test-ok')).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(document.querySelector('.test-ok')).toBeNull());
    });

    it('内容区 esc keydown-2', async () => {
        const onContentClick = vi.fn<() => void>();
        render(ContentClick, { props: { onContentClick } });
        await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
        await userEvent.click(await screen.findByText('此修改将不可逆'));
        expect(onContentClick).toHaveBeenCalledTimes(1);
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(document.querySelector('.test-ok')).toBeNull());
    });

    it('onConfirm 返回 Promise', async () => {
        const confirm = deferred();
        renderPopconfirm('保存', { onConfirm: () => confirm.promise });
        await userEvent.click(screen.getByRole('button', { name: '保存' }));
        await userEvent.click(await screen.findByText('确定'));
        await waitFor(() => expect(loading()).toHaveTextContent('确定'));
        confirm.resolve();
        await waitFor(() => expect(loading()).toBeNull());
    });

    it('onCancel 返回 Promise', async () => {
        const cancel = deferred();
        renderPopconfirm('保存', { onCancel: () => cancel.promise });
        await userEvent.click(screen.getByRole('button', { name: '保存' }));
        await userEvent.click(await screen.findByText('取消'));
        await waitFor(() => expect(loading()).toHaveTextContent('取消'));
        cancel.reject(new Error('no'));
        await waitFor(() => expect(loading()).toBeNull());
    });

    it('关闭后焦点还给触发器，点击外部输入框时不抢焦点', async () => {
        render(Outside);
        const trigger = screen.getByRole('button', { name: 'Save' });
        await userEvent.click(trigger);
        await screen.findByRole('dialog');
        await userEvent.click(screen.getByLabelText('outside'));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(screen.getByLabelText('outside')).toHaveFocus();
    });

    it('stopPropagation=false 时卡片内的点击仍不到达 document 上的 click 监听', async () => {
        const documentClick = vi.fn<() => void>();
        document.addEventListener('click', documentClick);
        try {
            renderPopconfirm('trigger', { stopPropagation: false });
            await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
            const documentClicksAfterOpen = documentClick.mock.calls.length;
            await userEvent.click(await screen.findByText('此修改将不可逆'));
            expect(documentClick).toHaveBeenCalledTimes(documentClicksAfterOpen);
        } finally {
            document.removeEventListener('click', documentClick);
        }
    });

    it('trigger 为 focus 时 Tab 离开后焦点停在下一个元素，不被拉回触发器', async () => {
        render({
            render: () => (
                <>
                    <Popconfirm trigger="focus" title="确定是否要保存此修改？">
                        {{
                            default: () => <Button>{() => 'focus confirm'}</Button>,
                        }}
                    </Popconfirm>
                    <Button>{() => 'after'}</Button>
                </>
            ),
        });
        screen.getByRole('button', { name: 'focus confirm' }).focus();
        await screen.findByRole('dialog');
        await tab();
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        // the close lands after mouseLeaveDelay (100ms); a focus pulled back would also reopen the dialog
        await new Promise((resolve) => setTimeout(resolve, 300));
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    });
});
