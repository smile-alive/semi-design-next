import { flushSync, tick, type Snippet } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import { Modal } from '../index';
import type { ModalConfirmProps, ModalHookApi, ModalHookRef } from '../interface';
import HookHost from './hook-host.svelte';
import Snippets from './snippets.svelte';

const prefix = 'semi-modal';
const loadingCls = 'semi-button-loading';
const getConfirm = () => document.querySelector<HTMLElement>(`.${prefix}-confirm`);
const getButton = (name: string) => screen.getByRole('button', { name });
type Method = 'confirm' | 'info' | 'success' | 'warning' | 'error';
type SnippetSet = {
    bold: Snippet;
    footer: Snippet;
    closeIcon: Snippet;
    icon: Snippet;
    plainIcon: Snippet;
    counter: Snippet;
};

// The dialog renders once its Portal has mounted, a flush after the call; motion is off so closing unmounts at once
async function settle() {
    await tick();
    await tick();
}

async function openConfirm(method: Method, props: ModalConfirmProps = {}): Promise<ModalHookRef> {
    const handle = Modal[method]({ title: 'Semi', content: 'Content', motion: false, ...props });
    await settle();
    return handle;
}

async function renderHook(props: { reachable?: string; direction?: 'ltr' | 'rtl' } = {}) {
    let api!: ModalHookApi;
    let reach!: Snippet;
    const view = render(HookHost, {
        props: {
            ...props,
            onApi: (modal: ModalHookApi, reachable: Snippet) => {
                api = modal;
                reach = reachable;
            },
        },
    });
    await settle();
    return { api, reach, view };
}

function getSnippets() {
    const store = createStore({ count: 1 });
    let snippets!: SnippetSet;
    render(Snippets, { props: { store, onSnippets: (given: SnippetSet) => (snippets = given) } });
    return { snippets, store };
}

function deferred() {
    let resolve!: () => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

describe('Svelte Modal.confirm', () => {
    afterEach(async () => {
        Modal.destroyAll();
        await settle();
    });

    it('confirm 的 title 与 content，各类型的图标类名', async () => {
        let handle = await openConfirm('confirm');
        let modal = getConfirm();
        expect(modal?.querySelector(`.${prefix}-title`)).toHaveTextContent(/^Semi$/);
        expect(modal?.querySelector(`.${prefix}-confirm-content`)).toHaveTextContent(/^Content$/);
        expect(modal?.querySelector(`.${prefix}-confirm-icon`)).toHaveClass('semi-icon-help_circle');
        handle.destroy();
        await settle();
        expect(getConfirm()).toBeNull();

        for (const type of ['error', 'success', 'info', 'warning'] as const) {
            handle = await openConfirm(type);
            modal = getConfirm();
            expect(modal?.querySelector(`.${prefix}-confirm-icon`)).toHaveClass(`${prefix}-${type}-icon`);
            handle.destroy();
            await settle();
            expect(getConfirm()).toBeNull();
        }
    });

    it('自定义图标 snippet 被包在带类型样式的元素里', async () => {
        const { snippets } = getSnippets();
        await openConfirm('confirm', { icon: snippets.icon });
        expect(getConfirm()?.querySelector(`.${prefix}-confirm-icon .semi-icon-send`)).toHaveClass('mine', 'semi-icon-small');
    });

    it('图标为 null 时不渲染图标，显式传入 undefined 等同未传', async () => {
        await openConfirm('error', { icon: null });
        expect(getConfirm()?.querySelector(`.${prefix}-confirm-icon`)).toBeNull();
        expect(getConfirm()?.querySelector(`.${prefix}-confirm-content-withIcon`)).toBeNull();
        Modal.destroyAll();
        await settle();

        await openConfirm('error', { icon: undefined });
        expect(getConfirm()?.querySelector(`.${prefix}-confirm-icon`)).toHaveClass(`${prefix}-error-icon`);
    });

    it('okButtonProps 中显式传入 undefined 的 type 不覆盖 error 的 danger', async () => {
        await openConfirm('error', { okButtonProps: { type: undefined } });
        expect(getButton('确定')).toHaveClass('semi-button-danger');
    });

    it('confirm 回调', async () => {
        const onCancel = vi.fn<NonNullable<ModalConfirmProps['onCancel']>>();
        const onOk = vi.fn<NonNullable<ModalConfirmProps['onOk']>>();
        const props = { onOk, onCancel };

        await openConfirm('confirm', props);
        await fireEvent.click(getButton('关闭'));
        await settle();
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(getConfirm()).toBeNull();

        await openConfirm('confirm', props);
        await fireEvent.click(getButton('取消'));
        await settle();
        expect(onCancel).toHaveBeenCalledTimes(2);
        expect(getConfirm()).toBeNull();

        await openConfirm('confirm', props);
        expect(getButton('取消')).not.toHaveClass(loadingCls);
        expect(getButton('确定')).not.toHaveClass(loadingCls);
        await fireEvent.click(getButton('确定'));
        await settle();
        expect(onOk).toHaveBeenCalledTimes(1);
        expect(onCancel).toHaveBeenCalledTimes(2);
        expect(getConfirm()).toBeNull();
    });

    it('不传任何回调时点击确定与取消不抛错并关闭', async () => {
        await openConfirm('confirm');
        await fireEvent.click(getButton('取消'));
        await settle();
        expect(getConfirm()).toBeNull();

        await openConfirm('confirm');
        await fireEvent.click(getButton('确定'));
        await settle();
        expect(getConfirm()).toBeNull();
    });

    it('确定回调返回 Promise 时显示 loading，兑现后关闭', async () => {
        const { promise, resolve } = deferred();
        const onOk = vi.fn<() => Promise<void>>(() => promise);
        await openConfirm('confirm', { onOk });
        await fireEvent.click(getButton('确定'));
        await tick();
        expect(onOk).toHaveBeenCalledTimes(1);
        expect(getButton('确定')).toHaveClass(loadingCls);
        expect(getConfirm()).not.toBeNull();
        resolve();
        await promise;
        await settle();
        expect(getConfirm()).toBeNull();
    });

    it('确定回调返回的 Promise 被拒绝时保持打开并恢复按钮', async () => {
        const { promise, reject } = deferred();
        await openConfirm('confirm', { onOk: () => promise });
        await fireEvent.click(getButton('确定'));
        await tick();
        expect(getButton('确定')).toHaveClass(loadingCls);
        reject(new Error('something wrong'));
        await promise.catch(() => {});
        await settle();
        expect(getButton('确定')).not.toHaveClass(loadingCls);
        expect(getConfirm()).not.toBeNull();
    });

    it('取消回调返回 Promise 时取消按钮显示 loading，兑现后关闭', async () => {
        const { promise, resolve } = deferred();
        const onCancel = vi.fn<() => Promise<void>>(() => promise);
        await openConfirm('confirm', { onCancel });
        await fireEvent.click(getButton('关闭'));
        await tick();
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(getButton('取消')).toHaveClass(loadingCls);
        expect(getConfirm()).not.toBeNull();
        resolve();
        await promise;
        await settle();
        expect(getConfirm()).toBeNull();
    });

    it('同时打开的多个确认框各自拥有唯一 id，名称与描述互不串用', async () => {
        await openConfirm('confirm', { title: 'First title', content: 'First body' });
        await openConfirm('confirm', { title: 'Second title', content: 'Second body' });
        const [first, second] = screen.getAllByRole('alertdialog');
        expect(first).toHaveAccessibleName('First title');
        expect(first).toHaveAccessibleDescription('First body');
        expect(second).toHaveAccessibleName('Second title');
        expect(second).toHaveAccessibleDescription('Second body');
        const [firstId, secondId] = [...document.querySelectorAll(`.${prefix}`)].map((el) => el.id);
        expect(firstId).toBeTruthy();
        expect(firstId).not.toBe(secondId);
    });

    it('首次渲染前同步 destroy，仍调用一次 afterClose 并移除挂载节点', async () => {
        const afterClose = vi.fn<() => void>();
        const before = document.body.children.length;
        const handle = Modal.confirm({ title: 'Semi', content: 'Content', motion: false, afterClose });
        handle.destroy();
        await vi.waitFor(() => expect(afterClose).toHaveBeenCalledTimes(1));
        await settle();
        expect(document.body.children.length).toBe(before);
    });

    it('destroy 关闭确认框，只调用一次 afterClose，并移除挂载节点', async () => {
        const afterClose = vi.fn<() => void>();
        const before = document.body.children.length;
        const handle = await openConfirm('confirm', { afterClose });
        expect(document.body.children.length).toBeGreaterThan(before);
        handle.destroy();
        await settle();
        expect(getConfirm()).toBeNull();
        expect(afterClose).toHaveBeenCalledTimes(1);
        expect(document.body.children.length).toBe(before);
    });

    it('destroyAll 关闭所有已打开的确认框', async () => {
        await openConfirm('info', { title: 'A' });
        await openConfirm('warning', { title: 'B' });
        expect(document.querySelectorAll(`.${prefix}-confirm`)).toHaveLength(2);
        Modal.destroyAll();
        await settle();
        expect(document.querySelectorAll(`.${prefix}-confirm`)).toHaveLength(0);
    });

    it('update 可以修改按钮，类型图标类名保持不变', async () => {
        const handle = await openConfirm('error');
        expect(getConfirm()?.querySelector(`.${prefix}-error-icon`)).not.toBeNull();
        handle.update({ okText: 'Fine', hasCancel: false });
        await tick();
        const buttons = getConfirm()?.querySelectorAll(`.${prefix}-footer .semi-button`) ?? [];
        expect(buttons).toHaveLength(1);
        expect(buttons[0]).toHaveTextContent('Fine');
        expect(getConfirm()?.querySelector(`.${prefix}-error-icon`)).not.toBeNull();
    });

    it('update 修改 title 与 content', async () => {
        const handle = await openConfirm('confirm');
        handle.update({ title: 'Updated Semi', content: 'Updated Content' });
        await tick();
        expect(getConfirm()?.querySelector(`.${prefix}-confirm-title-text`)).toHaveTextContent(/^Updated Semi$/);
        expect(getConfirm()?.querySelector(`.${prefix}-confirm-content`)).toHaveTextContent(/^Updated Content$/);
    });

    it('关闭并 afterClose 之后再 update，不会重建弹窗', async () => {
        const handle = await openConfirm('confirm');
        handle.destroy();
        await settle();
        expect(getConfirm()).toBeNull();
        const childCount = document.body.children.length;
        handle.update({ visible: true });
        await settle();
        expect(screen.queryByRole('alertdialog')).toBeNull();
        expect(document.body.children.length).toBe(childCount);
    });

    it('同步先 confirm 后 update 再 destroy，使用最新的 afterClose', async () => {
        const first = vi.fn<() => void>();
        const latest = vi.fn<() => void>();
        const handle = Modal.confirm({ title: 'Semi', content: 'Content', motion: false, afterClose: first });
        handle.update({ afterClose: latest });
        handle.destroy();
        await settle();
        expect(screen.queryByRole('alertdialog')).toBeNull();
        expect(first).not.toHaveBeenCalled();
        expect(latest).toHaveBeenCalledTimes(1);
    });

    it('确认框为 alertdialog，由标题命名、由正文描述，aria-* 落在对话框上，data-* 落在外层元素上', async () => {
        await openConfirm('warning', { title: 'Delete?', content: 'It cannot be undone', 'data-foo': 'bar', 'aria-labelledby': undefined });
        const dialog = screen.getByRole('alertdialog', { name: 'Delete?' });
        expect(dialog).toHaveAccessibleDescription('It cannot be undone');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).not.toHaveAttribute('data-foo');
        expect(getConfirm()).toHaveAttribute('data-foo', 'bar');
    });

    it('自定义 aria-label 与 aria-describedby 覆盖默认', async () => {
        await openConfirm('confirm', { 'aria-label': 'Custom', 'aria-describedby': 'outside-desc' });
        const dialog = screen.getByRole('alertdialog', { name: 'Custom' });
        expect(dialog).toHaveAttribute('aria-describedby', 'outside-desc');
        expect(getConfirm()).not.toHaveAttribute('aria-label');
    });

    it('节点选项接受字符串与 snippet，header、footer 为 null 时隐藏', async () => {
        const { snippets } = getSnippets();
        await openConfirm('confirm', { title: snippets.bold, content: snippets.bold, footer: null, closeIcon: snippets.closeIcon });
        expect(getConfirm()?.querySelector(`.${prefix}-confirm-title-text b`)).toHaveTextContent('bold');
        expect(getConfirm()?.querySelector(`.${prefix}-confirm-content b`)).toHaveTextContent('bold');
        expect(getConfirm()?.querySelector(`.${prefix}-footer`)).toBeNull();
        expect(getConfirm()?.querySelector(`.${prefix}-close .my-close`)).not.toBeNull();
        Modal.destroyAll();
        await settle();

        await openConfirm('confirm', { header: null, footer: snippets.footer });
        expect(getConfirm()?.querySelector(`.${prefix}-header`)).toBeNull();
        expect(getConfirm()?.querySelector(`.${prefix}-footer`)).toHaveTextContent('Own');
    });
});

describe('Svelte Modal.useModal', () => {
    afterEach(async () => {
        Modal.destroyAll();
        await settle();
    });

    it('useModal 弹出确认框，update 与 destroy 生效，destroy 调用 afterClose', async () => {
        const { api } = await renderHook();
        const afterClose = vi.fn<() => void>();
        const handle = api.warning({ title: 'Hook', content: 'Body', motion: false, afterClose });
        await settle();
        expect(getConfirm()?.querySelector(`.${prefix}-warning-icon`)).not.toBeNull();
        handle.update({ title: 'Hook updated' });
        await tick();
        expect(getConfirm()?.querySelector(`.${prefix}-confirm-title-text`)).toHaveTextContent('Hook updated');
        handle.destroy();
        await settle();
        expect(getConfirm()).toBeNull();
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('同步先 confirm 后 update 再 destroy，使用最新的 afterClose 且不残留弹窗', async () => {
        const { api } = await renderHook();
        const first = vi.fn<() => void>();
        const latest = vi.fn<() => void>();
        const handle = api.confirm({ title: 'Hook', content: 'Body', motion: false, afterClose: first });
        handle.update({ afterClose: latest });
        handle.destroy();
        await settle();
        expect(screen.queryByRole('alertdialog')).toBeNull();
        expect(first).not.toHaveBeenCalled();
        expect(latest).toHaveBeenCalledTimes(1);
    });

    it('弹窗关闭后 update 的 afterClose 不再生效，destroy 与 update 不报错', async () => {
        const { api } = await renderHook();
        const afterClose = vi.fn<() => void>();
        const handle = api.confirm({ title: 'Hook', content: 'Body', motion: false, afterClose });
        await settle();
        handle.destroy();
        await settle();
        expect(afterClose).toHaveBeenCalledTimes(1);
        handle.update({ visible: true });
        handle.destroy();
        await settle();
        expect(screen.queryByRole('alertdialog')).toBeNull();
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('弹窗跟随 ConfigProvider 的方向', async () => {
        const { api } = await renderHook({ direction: 'rtl' });
        api.confirm({ title: 'Hook', content: 'Body', motion: false });
        await settle();
        expect(document.querySelector('.semi-portal')).toHaveAttribute('dir', 'rtl');
    });

    it('snippet 内容读得到调用 useModal 的组件所在位置的 context，静态调用读不到', async () => {
        const { api, reach } = await renderHook({ reachable: 'Host' });
        const handle = api.confirm({ title: 'T', content: reach, motion: false });
        await settle();
        expect(getConfirm()).toHaveTextContent('ReachableContext: Host');
        handle.destroy();
        await settle();

        Modal.confirm({ title: 'T', content: reach, motion: false });
        await settle();
        expect(getConfirm()).toHaveTextContent('ReachableContext: none');
    });

    it('调用 useModal 的组件销毁时，它打开的弹窗一并移除，并调用 afterClose', async () => {
        const afterClose = vi.fn<() => void>();
        const { api, view } = await renderHook();
        api.info({ title: 'Hook', content: 'Body', motion: false, afterClose });
        await settle();
        expect(getConfirm()).not.toBeNull();
        view.unmount();
        await settle();
        expect(getConfirm()).toBeNull();
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('组件销毁后弹窗已关闭的句柄再 destroy 不报错', async () => {
        const { api, view } = await renderHook();
        const handle = api.info({ title: 'Hook', content: 'Body', motion: false });
        await settle();
        view.unmount();
        await settle();
        expect(() => handle.destroy()).not.toThrow();
        flushSync();
    });
});
