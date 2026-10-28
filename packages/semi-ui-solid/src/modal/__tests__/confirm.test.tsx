import type { JSX } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconSend } from '@fibrae/semi-icons-solid';
import { sleep } from '@test/utils/solid';
import Modal, { type ModalHookApi, type ModalHookRef, type ModalProps } from '..';
import ConfigProvider from '../../config-provider';

const prefixCls = `${BASE_CLASS_PREFIX}-modal`;
const loadingCls = `${BASE_CLASS_PREFIX}-button-loading`;

const getConfirm = () => document.querySelector<HTMLElement>(`.${prefixCls}-confirm`);
const confirmEl = () => getConfirm() as HTMLElement;
const getButton = (name: string) => screen.getByRole('button', { name });
const closeName = '关闭';

type Method = 'info' | 'success' | 'error' | 'warning' | 'confirm';
type TestProps = ModalProps & { 'data-foo'?: string };

// Modal.confirm renders into its own root outside Testing Library's container; motion is off so that closing
// unmounts the dialog synchronously
const openConfirm = (method: Method, props?: TestProps) => Modal[method]({ title: 'Semi', content: 'Content', motion: false, ...props });

function deferred() {
    let resolve!: () => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

// A hook's dialogs render in the holder, which the caller places; they read the context around the hook's caller
function renderHookHolder(wrap: (holder: JSX.Element) => JSX.Element = (holder) => holder, around: (demo: () => JSX.Element) => JSX.Element = (demo) => demo()) {
    let api!: ModalHookApi;
    function Demo() {
        const [modal, contextHolder] = Modal.useModal();
        api = modal;
        return wrap(contextHolder);
    }
    render(() => around(() => <Demo />));
    return api;
}

describe('Modal 静态方法', () => {
    // the detached tree is released in a microtask after it closes
    afterEach(async () => {
        Modal.destroyAll();
        await sleep(0);
    });

    it('confirm 标题、正文与各类型图标', () => {
        let handle = openConfirm('confirm');
        expect(confirmEl().querySelector(`.${prefixCls}-title`)).toHaveTextContent(/^Semi$/);
        expect(confirmEl().querySelector(`.${prefixCls}-confirm-content`)).toHaveTextContent(/^Content$/);
        expect(confirmEl().querySelector(`.${prefixCls}-confirm-icon`)).toHaveClass(`${BASE_CLASS_PREFIX}-icon-help_circle`, `${BASE_CLASS_PREFIX}-icon-extra-large`);
        handle.destroy();
        expect(getConfirm()).toBeNull();

        for (const type of ['error', 'success', 'info', 'warning'] as const) {
            handle = openConfirm(type);
            expect(confirmEl().querySelector(`.${prefixCls}-confirm-icon`)).toHaveClass(`${prefixCls}-${type}-icon`);
            handle.destroy();
            expect(getConfirm()).toBeNull();
        }
    });

    it('自定义图标', () => {
        openConfirm('confirm', { icon: <IconSend /> });
        expect(confirmEl().querySelector(`.${BASE_CLASS_PREFIX}-icon-send`)).toHaveClass(`${prefixCls}-confirm-icon`, `${BASE_CLASS_PREFIX}-icon-extra-large`);
    });

    it('icon 为 null 时不渲染图标', () => {
        openConfirm('info', { icon: null });
        expect(confirmEl().querySelector(`.${prefixCls}-confirm-icon`)).toBeNull();
        expect(confirmEl().querySelector(`.${prefixCls}-confirm-content`)).not.toHaveClass(`${prefixCls}-confirm-content-withIcon`);
    });

    it('confirm 回调', async () => {
        const spyOnCancel = vi.fn<() => void>();
        const spyOnOk = vi.fn<() => void>();
        const props = { onOk: spyOnOk, onCancel: spyOnCancel };

        openConfirm('confirm', props);
        await userEvent.click(getButton(closeName));
        expect(spyOnCancel).toHaveBeenCalledTimes(1);
        expect(getConfirm()).toBeNull();

        openConfirm('confirm', props);
        await userEvent.click(getButton('取消'));
        expect(spyOnCancel).toHaveBeenCalledTimes(2);
        expect(getConfirm()).toBeNull();

        openConfirm('confirm', props);
        expect(getButton('取消')).not.toHaveClass(loadingCls);
        expect(getButton('确定')).not.toHaveClass(loadingCls);
        await userEvent.click(getButton('确定'));
        expect(spyOnOk).toHaveBeenCalledTimes(1);
        expect(spyOnCancel).toHaveBeenCalledTimes(2);
        expect(getConfirm()).toBeNull();
    });

    it('confirm 不传任何回调时点击确定与取消不抛错并关闭', async () => {
        openConfirm('confirm');
        await userEvent.click(getButton('取消'));
        expect(getConfirm()).toBeNull();

        openConfirm('confirm');
        await userEvent.click(getButton('确定'));
        expect(getConfirm()).toBeNull();
    });

    it('confirm 确定回调返回 Promise 时的 loading', async () => {
        const { promise, resolve } = deferred();
        const spyOnOk = vi.fn<() => Promise<void>>(() => promise);
        openConfirm('confirm', { onOk: spyOnOk });
        await userEvent.click(getButton('确定'));
        expect(spyOnOk).toHaveBeenCalledTimes(1);
        expect(getButton('确定')).toHaveClass(loadingCls);
        expect(getConfirm()).not.toBeNull();
        resolve();
        await sleep(0);
        expect(getConfirm()).toBeNull();
    });

    it('confirm 确定回调返回 Promise 失败时保持打开', async () => {
        const { promise, reject } = deferred();
        openConfirm('confirm', { onOk: () => promise });
        await userEvent.click(getButton('确定'));
        expect(getButton('确定')).toHaveClass(loadingCls);
        reject(new Error('something wrong'));
        await sleep(0);
        expect(getButton('确定')).not.toHaveClass(loadingCls);
        expect(getConfirm()).not.toBeNull();
    });

    it('confirm 取消回调返回 Promise 时的 loading', async () => {
        const { promise, resolve } = deferred();
        const spyOnCancel = vi.fn<() => Promise<void>>(() => promise);
        openConfirm('confirm', { onCancel: spyOnCancel });
        await userEvent.click(getButton(closeName));
        expect(spyOnCancel).toHaveBeenCalledTimes(1);
        expect(getButton('取消')).toHaveClass(loadingCls);
        expect(getConfirm()).not.toBeNull();
        resolve();
        await sleep(0);
        expect(getConfirm()).toBeNull();
    });

    it('confirm 取消回调返回 Promise 失败时保持打开', async () => {
        const { promise, reject } = deferred();
        openConfirm('confirm', { onCancel: () => promise });
        await userEvent.click(getButton('取消'));
        expect(getButton('取消')).toHaveClass(loadingCls);
        reject(new Error('something wrong'));
        await sleep(0);
        expect(getButton('取消')).not.toHaveClass(loadingCls);
        expect(getConfirm()).not.toBeNull();
    });

    it('destroy 关闭确认框，只调用一次 afterClose，并移除其根节点', async () => {
        const afterClose = vi.fn<() => void>();
        const before = document.body.children.length;
        const handle = openConfirm('confirm', { afterClose });
        expect(document.body.children.length).toBeGreaterThan(before);
        handle.destroy();
        expect(getConfirm()).toBeNull();
        expect(afterClose).toHaveBeenCalledTimes(1);
        await sleep(0);
        expect(document.body.children.length).toBe(before);
    });

    it('打开后立即 destroyAll，afterClose 调用一次且容器被移除', async () => {
        const afterClose = vi.fn<() => void>();
        const before = document.body.children.length;
        Modal.warning({ title: 'x', afterClose, motion: false });
        Modal.destroyAll();
        await sleep(0);
        expect(afterClose).toHaveBeenCalledTimes(1);
        expect(document.body.children.length).toBe(before);
    });

    it('显式传入 undefined 的 icon 等同未传，保留类型图标', () => {
        openConfirm('error', { icon: undefined });
        expect(confirmEl().querySelector(`.${prefixCls}-confirm-icon`)).toHaveClass(`${prefixCls}-error-icon`);
    });

    it('okButtonProps 中显式传入 undefined 的 type 不覆盖 error 的 danger', () => {
        openConfirm('error', { okButtonProps: { type: undefined } });
        expect(confirmEl().querySelectorAll(`.${BASE_CLASS_PREFIX}-button`)[2]).toHaveClass(`${BASE_CLASS_PREFIX}-button-danger`);
    });

    it('自定义 Semi 图标保留使用方的 class 与 size', () => {
        openConfirm('confirm', { icon: <IconSend class="mine" size="small" /> });
        const icon = confirmEl().querySelector(`.${BASE_CLASS_PREFIX}-icon-send`);
        expect(icon).toHaveClass('mine', `${prefixCls}-confirm-icon`, `${BASE_CLASS_PREFIX}-icon-small`);
    });

    it('destroyAll 关闭所有已打开的确认框', () => {
        openConfirm('info', { title: 'A' });
        openConfirm('warning', { title: 'B' });
        expect(document.querySelectorAll(`.${prefixCls}-confirm`)).toHaveLength(2);
        Modal.destroyAll();
        expect(document.querySelectorAll(`.${prefixCls}-confirm`)).toHaveLength(0);
    });

    it('update 可以修改按钮，类型图标类名保持不变', () => {
        const handle = openConfirm('error');
        expect(confirmEl().querySelector(`.${prefixCls}-error-icon`)).not.toBeNull();
        expect(confirmEl().querySelectorAll(`.${BASE_CLASS_PREFIX}-button`)[2]).toHaveClass(`${BASE_CLASS_PREFIX}-button-danger`);
        handle.update({ okText: 'Fine', hasCancel: false });
        const buttons = confirmEl().querySelectorAll(`.${prefixCls}-footer .${BASE_CLASS_PREFIX}-button`);
        expect(buttons).toHaveLength(1);
        expect(buttons[0]).toHaveTextContent('Fine');
        expect(confirmEl().querySelector(`.${prefixCls}-error-icon`)).not.toBeNull();
    });

    it('关闭并 afterClose 之后再 update，不会重建弹窗', async () => {
        const handle = openConfirm('confirm');
        handle.destroy();
        await sleep(0);
        expect(getConfirm()).toBeNull();
        const childCount = document.body.children.length;
        handle.update({ visible: true });
        await sleep(0);
        expect(screen.queryByRole('alertdialog')).toBeNull();
        expect(document.body.children.length).toBe(childCount);
    });

    it('确认框为 alertdialog，由正文描述', () => {
        openConfirm('warning', { content: 'Delete it?' });
        expect(screen.getByRole('alertdialog', { name: 'Semi' })).toHaveAccessibleDescription('Delete it?');
    });

    it('update 合并的 motion 生效', () => {
        const handle = openConfirm('info', { motion: true });
        handle.update({ motion: false });
        handle.destroy();
        expect(getConfirm()).toBeNull();
    });

    it('update 修改标题与正文', () => {
        const handle = openConfirm('confirm');
        const modalDom = confirmEl();
        handle.update({ title: 'Updated Semi', content: 'Updated Content' });
        expect(modalDom.querySelector(`.${prefixCls}-confirm-title-text`)).toHaveTextContent(/^Updated Semi$/);
        expect(modalDom.querySelector(`.${prefixCls}-confirm-content`)).toHaveTextContent(/^Updated Content$/);
    });

    it('静态方法读不到外部 ConfigProvider，direction 需自行传入', () => {
        render(() => <ConfigProvider direction="rtl">{null}</ConfigProvider>);
        openConfirm('info');
        expect(confirmEl()).not.toHaveAttribute('dir');
        openConfirm('info', { direction: 'rtl', title: 'R' });
        expect(document.querySelectorAll(`.${prefixCls}-confirm`)[1]).toHaveAttribute('dir', 'rtl');
    });

    it('useModal 渲染到其 contextHolder 中，update 与 destroy 生效并调用 afterClose', () => {
        const modal = renderHookHolder((holder) => <div data-testid="holder">{holder}</div>);
        const afterClose = vi.fn<() => void>();
        const handle = modal.warning({ title: 'Hook', content: 'Body', motion: false, afterClose });
        expect(screen.getByTestId('holder')).toBeInTheDocument();
        expect(confirmEl().querySelector(`.${prefixCls}-warning-icon`)).not.toBeNull();
        handle.update({ title: 'Hook updated' });
        expect(confirmEl().querySelector(`.${prefixCls}-confirm-title-text`)).toHaveTextContent('Hook updated');
        handle.destroy();
        expect(getConfirm()).toBeNull();
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('useModal 先 confirm 后 update 再 destroy，使用最新的 afterClose 且不残留弹窗', () => {
        const modal = renderHookHolder();
        const first = vi.fn<() => void>();
        const latest = vi.fn<() => void>();
        const handle = modal.confirm({ title: 'Hook', content: 'Body', motion: false, afterClose: first });
        handle.update({ afterClose: latest });
        handle.destroy();
        expect(screen.queryByRole('alertdialog')).toBeNull();
        expect(first).not.toHaveBeenCalled();
        expect(latest).toHaveBeenCalledTimes(1);
    });

    it('useModal 弹窗关闭后 update 不再生效，destroy 与 update 不报错', () => {
        const modal = renderHookHolder();
        const afterClose = vi.fn<() => void>();
        const handle = modal.confirm({ title: 'Hook', content: 'Body', motion: false, afterClose });
        handle.destroy();
        expect(afterClose).toHaveBeenCalledTimes(1);
        handle.update({ visible: true });
        handle.destroy();
        expect(screen.queryByRole('alertdialog')).toBeNull();
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('useModal 弹窗跟随 ConfigProvider 的方向', () => {
        const modal = renderHookHolder(undefined, (demo) => <ConfigProvider direction="rtl">{demo()}</ConfigProvider>);
        modal.confirm({ title: 'Hook', content: 'Body', motion: false });
        expect(confirmEl()).toHaveAttribute('dir', 'rtl');
    });

    it('Modal.confirm 与 useModal 的 aria 属性落在对话框上，data-* 落在外层元素上', () => {
        const expectLanding = (root: Element) => {
            const dialog = root.querySelector('[role="alertdialog"]');
            expect(dialog).toHaveAttribute('aria-label', 'Custom');
            expect(dialog).toHaveAttribute('aria-describedby', 'outside-desc');
            expect(dialog).not.toHaveAttribute('data-foo');
            expect(root).toHaveAttribute('data-foo', 'bar');
            expect(root).not.toHaveAttribute('aria-label');
            expect(root).not.toHaveAttribute('aria-describedby');
        };
        const props: TestProps = { 'aria-label': 'Custom', 'aria-describedby': 'outside-desc', 'data-foo': 'bar' };
        openConfirm('confirm', props);
        expectLanding(confirmEl());

        const modal = renderHookHolder();
        modal.info({ title: 'Hook', content: 'Body', motion: false, ...props });
        expectLanding(document.querySelectorAll(`.${prefixCls}-confirm`)[1]);
    });

    it('句柄的 update 接收 ModalProps，不要求 type', () => {
        type StaticUpdate = ReturnType<typeof Modal.confirm>['update'];
        type HookUpdate = ReturnType<ModalHookApi['confirm']>['update'];
        expectTypeOf<ReturnType<typeof Modal.useModal>>().toEqualTypeOf<[ModalHookApi, JSX.Element]>();
        expectTypeOf<ReturnType<typeof Modal.info>>().toEqualTypeOf<ModalHookRef>();
        expectTypeOf<Parameters<StaticUpdate>[0]>().toEqualTypeOf<ModalProps>();
        expectTypeOf<Parameters<HookUpdate>[0]>().toEqualTypeOf<ModalProps>();
    });
});
