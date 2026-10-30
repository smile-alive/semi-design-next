/** @jsxImportSource vue */
import { createApp, defineComponent, inject, nextTick, onMounted } from 'vue';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/vue';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { IconSend } from '@fibrae/semi-icons-vue';
import { render } from '@test/utils/vue';
import Modal from '../index';
import type { ModalConfirmProps, ModalHookApi, ModalHookRef } from '../interface';
import HookHost from './fixtures/hook-host.vue';
import { reachableKey } from './fixtures/reachable';

const prefix = 'semi-modal';
const loadingCls = 'semi-button-loading';
const getConfirm = () => document.querySelector<HTMLElement>(`.${prefix}-confirm`);
const getButton = (name: string) => screen.getByRole('button', { name });
const closeName = '关闭';
type Method = 'confirm' | 'info' | 'success' | 'warning' | 'error';

// Motion is off, so closing unmounts the dialog at once instead of after the leave transition's frames; the dialog
// renders once its Portal has mounted, a tick after the call.
async function openConfirm(method: Method, props: ModalConfirmProps = {}): Promise<ModalHookRef> {
    const handle = Modal[method]({ title: 'Semi', content: 'Content', motion: false, ...props });
    await nextTick();
    return handle;
}

async function renderHook(props: { reachable?: string; direction?: 'ltr' | 'rtl' } = {}) {
    let api!: ModalHookApi;
    render(HookHost, { props: { ...props, onApi: (modal: ModalHookApi) => (api = modal) } });
    await nextTick();
    return api;
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

describe('Modal.confirm', () => {
    afterEach(async () => {
        Modal.destroyAll();
        await nextTick();
    });

    it('confirm 的 title 与 content，各类型的图标类名', async () => {
        let handle = await openConfirm('confirm');
        let modal = getConfirm();
        expect(modal?.querySelector(`.${prefix}-title`)).toHaveTextContent(/^Semi$/);
        expect(modal?.querySelector(`.${prefix}-confirm-content`)).toHaveTextContent(/^Content$/);
        expect(modal?.querySelector(`.${prefix}-confirm-icon`)).toHaveClass('semi-icon-help_circle');
        handle.destroy();
        await nextTick();
        expect(getConfirm()).toBeNull();

        for (const type of ['error', 'success', 'info', 'warning'] as const) {
            handle = await openConfirm(type);
            modal = getConfirm();
            expect(modal?.querySelector(`.${prefix}-confirm-icon`)).toHaveClass(`${prefix}-${type}-icon`);
            handle.destroy();
            await nextTick();
            expect(getConfirm()).toBeNull();
        }
    });

    it('自定义图标', async () => {
        await openConfirm('confirm', { icon: <IconSend /> });
        expect(getConfirm()?.querySelector('.semi-icon-send')).toHaveClass(`${prefix}-confirm-icon`);
    });

    it('自定义 Semi 图标保留使用方的 class 与 size', async () => {
        await openConfirm('confirm', { icon: <IconSend class="mine" size="small" /> });
        const icon = getConfirm()?.querySelector('.semi-icon-send');
        expect(icon).toHaveClass('mine', `${prefix}-confirm-icon`, 'semi-icon-small');
    });

    it('显式传入 undefined 的 icon 等同未传，保留类型图标', async () => {
        await openConfirm('error', { icon: undefined });
        expect(getConfirm()?.querySelector(`.${prefix}-confirm-icon`)).toHaveClass(`${prefix}-error-icon`);
    });

    it('okButtonProps 中显式传入 undefined 的 type 不覆盖 error 的 danger', async () => {
        await openConfirm('error', { okButtonProps: { type: undefined } });
        expect(getConfirm()?.querySelectorAll('.semi-button')[2]).toHaveClass('semi-button-danger');
    });

    it('confirm 回调', async () => {
        const onCancel = vi.fn<NonNullable<ModalConfirmProps['onCancel']>>();
        const onOk = vi.fn<NonNullable<ModalConfirmProps['onOk']>>();
        const props = { onOk, onCancel };

        await openConfirm('confirm', props);
        await userEvent.click(getButton(closeName));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(getConfirm()).toBeNull();

        await openConfirm('confirm', props);
        await userEvent.click(getButton('取消'));
        expect(onCancel).toHaveBeenCalledTimes(2);
        expect(getConfirm()).toBeNull();

        await openConfirm('confirm', props);
        expect(getButton('取消')).not.toHaveClass(loadingCls);
        expect(getButton('确定')).not.toHaveClass(loadingCls);
        await userEvent.click(getButton('确定'));
        expect(onOk).toHaveBeenCalledTimes(1);
        expect(onCancel).toHaveBeenCalledTimes(2);
        expect(getConfirm()).toBeNull();
    });

    it('confirm 不传任何回调时点击确定与取消不抛错并关闭', async () => {
        await openConfirm('confirm');
        await userEvent.click(getButton('取消'));
        expect(getConfirm()).toBeNull();

        await openConfirm('confirm');
        await userEvent.click(getButton('确定'));
        expect(getConfirm()).toBeNull();
    });

    it('confirm 确定回调返回 Promise 时的 loading', async () => {
        const { promise, resolve } = deferred();
        const onOk = vi.fn<() => Promise<void>>(() => promise);
        await openConfirm('confirm', { onOk });
        await userEvent.click(getButton('确定'));
        expect(onOk).toHaveBeenCalledTimes(1);
        expect(getButton('确定')).toHaveClass(loadingCls);
        expect(getConfirm()).not.toBeNull();
        resolve();
        await promise;
        await nextTick();
        expect(getConfirm()).toBeNull();
    });

    it('confirm 确定回调返回 Promise 失败时', async () => {
        const { promise, reject } = deferred();
        const onOk = vi.fn<() => Promise<void>>(() => promise);
        await openConfirm('confirm', { onOk });
        await userEvent.click(getButton('确定'));
        expect(getButton('确定')).toHaveClass(loadingCls);
        reject(new Error('something wrong'));
        await promise.catch(() => {});
        await nextTick();
        expect(onOk).toHaveBeenCalledTimes(1);
        expect(getButton('确定')).not.toHaveClass(loadingCls);
        expect(getConfirm()).not.toBeNull();
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

    it('confirm 取消回调返回 Promise 时的 loading', async () => {
        const { promise, resolve } = deferred();
        const onCancel = vi.fn<() => Promise<void>>(() => promise);
        await openConfirm('confirm', { onCancel });
        await userEvent.click(getButton(closeName));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(getButton('取消')).toHaveClass(loadingCls);
        expect(getConfirm()).not.toBeNull();
        resolve();
        await promise;
        await nextTick();
        expect(getConfirm()).toBeNull();
    });

    it('confirm 取消回调返回 Promise 失败时', async () => {
        const { promise, reject } = deferred();
        const onCancel = vi.fn<() => Promise<void>>(() => promise);
        await openConfirm('confirm', { onCancel });
        await userEvent.click(getButton('取消'));
        expect(getButton('取消')).toHaveClass(loadingCls);
        reject(new Error('something wrong'));
        await promise.catch(() => {});
        await nextTick();
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(getButton('取消')).not.toHaveClass(loadingCls);
        expect(getConfirm()).not.toBeNull();
    });

    it('首次渲染前同步 destroy，仍调用一次 afterClose 并移除根节点', async () => {
        const afterClose = vi.fn<() => void>();
        const before = document.body.children.length;
        const handle = Modal.confirm({ title: 'Semi', content: 'Content', motion: false, afterClose });
        handle.destroy();
        await vi.waitFor(() => expect(afterClose).toHaveBeenCalledTimes(1));
        expect(document.body.children.length).toBe(before);
    });

    it('在 post flush 内（组件 onMounted）调用 confirm 并立即 destroy，仍调用一次 afterClose 并移除根节点', async () => {
        const afterClose = vi.fn<() => void>();
        const Host = defineComponent({
            setup() {
                onMounted(() => Modal.confirm({ title: 'Semi', content: 'Content', motion: false, afterClose }).destroy());
                return () => <div />;
            },
        });
        const before = document.body.children.length;
        render(Host);
        await vi.waitFor(() => expect(afterClose).toHaveBeenCalledTimes(1));
        // only the render container remains
        expect(document.body.children.length).toBe(before + 1);
    });

    it('destroy 关闭确认框，只调用一次 afterClose，并移除其根节点', async () => {
        const afterClose = vi.fn<() => void>();
        const before = document.body.children.length;
        const handle = await openConfirm('confirm', { afterClose });
        expect(document.body.children.length).toBeGreaterThan(before);
        handle.destroy();
        await nextTick();
        expect(getConfirm()).toBeNull();
        expect(afterClose).toHaveBeenCalledTimes(1);
        expect(document.body.children.length).toBe(before);
    });

    it('destroyAll 关闭所有已打开的确认框', async () => {
        await openConfirm('info', { title: 'A' });
        await openConfirm('warning', { title: 'B' });
        expect(document.querySelectorAll(`.${prefix}-confirm`)).toHaveLength(2);
        Modal.destroyAll();
        await nextTick();
        expect(document.querySelectorAll(`.${prefix}-confirm`)).toHaveLength(0);
    });

    it('update 可以修改按钮，类型图标类名保持不变', async () => {
        const handle = await openConfirm('error');
        expect(getConfirm()?.querySelector(`.${prefix}-error-icon`)).not.toBeNull();
        expect(getConfirm()?.querySelectorAll('.semi-button')[2]).toHaveClass('semi-button-danger');
        handle.update({ okText: 'Fine', hasCancel: false });
        await nextTick();
        const buttons = getConfirm()?.querySelectorAll(`.${prefix}-footer .semi-button`) ?? [];
        expect(buttons).toHaveLength(1);
        expect(buttons[0]).toHaveTextContent('Fine');
        expect(getConfirm()?.querySelector(`.${prefix}-error-icon`)).not.toBeNull();
    });

    it('useModal 渲染到 Holder 中，destroy 调用 afterClose', async () => {
        const modal = await renderHook();
        const afterClose = vi.fn<() => void>();
        const handle = modal.warning({ title: 'Hook', content: 'Body', motion: false, afterClose });
        await nextTick();
        await nextTick();
        expect(getConfirm()?.querySelector(`.${prefix}-warning-icon`)).not.toBeNull();
        handle.update({ title: 'Hook updated' });
        await nextTick();
        expect(getConfirm()?.querySelector(`.${prefix}-confirm-title-text`)).toHaveTextContent('Hook updated');
        handle.destroy();
        await nextTick();
        expect(getConfirm()).toBeNull();
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('useModal 同步先 confirm 后 update 再 destroy，使用最新的 afterClose 且不残留弹窗', async () => {
        const modal = await renderHook();
        const first = vi.fn<() => void>();
        const latest = vi.fn<() => void>();
        const handle = modal.confirm({ title: 'Hook', content: 'Body', motion: false, afterClose: first });
        handle.update({ afterClose: latest });
        handle.destroy();
        await nextTick();
        await nextTick();
        expect(screen.queryByRole('alertdialog')).toBeNull();
        expect(first).not.toHaveBeenCalled();
        expect(latest).toHaveBeenCalledTimes(1);
    });

    it('useModal 弹窗关闭后 update 的 afterClose 不再生效，destroy 与 update 不报错', async () => {
        const modal = await renderHook();
        const afterClose = vi.fn<() => void>();
        const handle = modal.confirm({ title: 'Hook', content: 'Body', motion: false, afterClose });
        await nextTick();
        await nextTick();
        handle.destroy();
        await nextTick();
        expect(afterClose).toHaveBeenCalledTimes(1);
        handle.update({ visible: true });
        handle.destroy();
        await nextTick();
        await nextTick();
        expect(screen.queryByRole('alertdialog')).toBeNull();
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('关闭并 afterClose 之后再 update，不会重建弹窗', async () => {
        const handle = await openConfirm('confirm');
        handle.destroy();
        await nextTick();
        expect(getConfirm()).toBeNull();
        const childCount = document.body.children.length;
        handle.update({ visible: true });
        await nextTick();
        await nextTick();
        expect(screen.queryByRole('alertdialog')).toBeNull();
        expect(document.body.children.length).toBe(childCount);
    });

    it('useModal 弹窗跟随 ConfigProvider 的方向', async () => {
        const modal = await renderHook({ direction: 'rtl' });
        modal.confirm({ title: 'Hook', content: 'Body', motion: false });
        await nextTick();
        await nextTick();
        expect(getConfirm()).toHaveAttribute('dir', 'rtl');
    });

    it('Modal.confirm 与 useModal 的 aria 属性落在对话框上，data-* 落在外层元素上', async () => {
        const expectLanding = (root?: Element | null) => {
            const dialog = root?.querySelector('[role="alertdialog"]');
            expect(dialog).toHaveAttribute('aria-label', 'Custom');
            expect(dialog).toHaveAttribute('aria-describedby', 'outside-desc');
            expect(dialog).not.toHaveAttribute('data-foo');
            expect(root).toHaveAttribute('data-foo', 'bar');
            expect(root).not.toHaveAttribute('aria-label');
            expect(root).not.toHaveAttribute('aria-describedby');
        };
        const props = { 'aria-label': 'Custom', 'aria-describedby': 'outside-desc', 'data-foo': 'bar' };
        await openConfirm('confirm', props);
        expectLanding(getConfirm());

        const modal = await renderHook();
        modal.info({ title: 'Hook', content: 'Body', motion: false, ...props });
        await nextTick();
        await nextTick();
        expectLanding(document.querySelectorAll(`.${prefix}-confirm`)[1]);
    });

    it('modal update', async () => {
        const modal = await openConfirm('confirm');
        const dom = getConfirm();
        expect(dom?.querySelector(`.${prefix}-title`)).toHaveTextContent(/^Semi$/);
        expect(dom?.querySelector(`.${prefix}-confirm-content`)).toHaveTextContent(/^Content$/);
        modal.update({ title: 'Updated Semi', content: 'Updated Content' });
        await nextTick();
        expect(dom?.querySelector(`.${prefix}-confirm-title-text`)).toHaveTextContent(/^Updated Semi$/);
        expect(dom?.querySelector(`.${prefix}-confirm-content`)).toHaveTextContent(/^Updated Content$/);
    });

    it('Modal.confirm 与 useModal 句柄的 update 接收 ModalConfirmProps，不要求 type', () => {
        type StaticUpdate = ReturnType<typeof Modal.confirm>['update'];
        type HookUpdate = ReturnType<ReturnType<typeof Modal.useModal>[0]['confirm']>['update'];
        expectTypeOf<Parameters<StaticUpdate>[0]>().toEqualTypeOf<ModalConfirmProps>();
        expectTypeOf<Parameters<HookUpdate>[0]>().toEqualTypeOf<ModalConfirmProps>();
        expectTypeOf<Parameters<ReturnType<typeof Modal.info>['update']>[0]>().toEqualTypeOf<ModalConfirmProps>();
    });
});

describe('Modal.confirm（Vue）', () => {
    afterEach(async () => {
        Modal.destroyAll();
        await nextTick();
    });

    it('确认框为 alertdialog，由标题命名、由正文描述', async () => {
        await openConfirm('warning', { title: 'Delete?', content: 'It cannot be undone' });
        const dialog = screen.getByRole('alertdialog', { name: 'Delete?' });
        expect(dialog).toHaveAccessibleDescription('It cannot be undone');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('节点选项接受 VNode 与函数，header、footer 为 null 时隐藏', async () => {
        await openConfirm('confirm', {
            title: () => <b>Fn title</b>,
            content: <i>VNode content</i>,
            footer: null,
            closeIcon: () => <span class="my-close" />,
        });
        expect(getConfirm()?.querySelector(`.${prefix}-confirm-title-text b`)).toHaveTextContent('Fn title');
        expect(getConfirm()?.querySelector(`.${prefix}-confirm-content i`)).toHaveTextContent('VNode content');
        expect(getConfirm()?.querySelector(`.${prefix}-footer`)).toBeNull();
        expect(getConfirm()?.querySelector(`.${prefix}-close .my-close`)).not.toBeNull();
        Modal.destroyAll();
        await nextTick();

        await openConfirm('confirm', { header: null, footer: () => <button type="button">Own</button> });
        expect(getConfirm()?.querySelector(`.${prefix}-header`)).toBeNull();
        expect(getConfirm()?.querySelector(`.${prefix}-footer`)).toHaveTextContent('Own');
    });

    it('modalRender 包住对话框元素', async () => {
        await openConfirm('info', { modalRender: (modal) => <div class="wrapped">{modal}</div> });
        expect(document.querySelector('.wrapped > [role="alertdialog"]')).not.toBeNull();
    });

    it('install 后静态确认框的函数型 content 能 inject 到 app.provide 的值，未 install 时 inject 不到', async () => {
        const read = () => `reachable: ${inject(reachableKey, 'none')}`;
        await openConfirm('confirm', { content: read });
        expect(getConfirm()).toHaveTextContent('reachable: none');
        Modal.destroyAll();
        await nextTick();

        const app = createApp({ render: () => null });
        app.provide(reachableKey, 'App');
        app.use(Modal);
        try {
            await openConfirm('confirm', { content: read });
            expect(getConfirm()).toHaveTextContent('reachable: App');
        } finally {
            Modal.destroyAll();
            // the installed app is module state; leave a context without provides for the other tests
            Modal.install(createApp({ render: () => null }));
        }
    });

    it('useModal 的函数型 content 能 inject 到 Holder 所在位置的 provide', async () => {
        const modal = await renderHook({ reachable: 'Holder' });
        modal.confirm({ content: () => `reachable: ${inject(reachableKey, 'none')}`, motion: false, title: 'T' });
        await nextTick();
        await nextTick();
        expect(getConfirm()).toHaveTextContent('reachable: Holder');
    });

    it('Holder 挂载前调用的 destroy 不残留弹窗', async () => {
        let api!: ModalHookApi;
        render(HookHost, {
            props: {
                onApi: (modal: ModalHookApi) => {
                    api = modal;
                    modal.confirm({ title: 'Early', motion: false }).destroy();
                },
            },
        });
        await nextTick();
        await nextTick();
        expect(api).toBeDefined();
        expect(screen.queryByRole('alertdialog')).toBeNull();
    });

    it('静态确认框的 update({ motion }) 生效', async () => {
        const handle = await openConfirm('confirm', { motion: true });
        handle.update({ motion: false });
        await nextTick();
        await userEvent.click(getButton('取消'));
        expect(getConfirm()).toBeNull();
    });
});
