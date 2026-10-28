import { type ReactElement, useEffect } from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconSend } from '@fibrae/semi-icons-react';
import { ConfigProvider, Modal, type ModalHookApi } from '@fibrae/semi-ui-react';
import type { ModalReactProps } from '../modal';

const prefixCls = `${BASE_CLASS_PREFIX}-modal`;
const loadingCls = `${BASE_CLASS_PREFIX}-button-loading`;

const getConfirm = () => document.querySelector(`.${prefixCls}-confirm`);
const getButton = (name) => screen.getByRole('button', { name });
const closeName = '关闭';

// Modal.confirm renders into its own root outside Testing Library's container; motion is off so that closing
// unmounts the dialog synchronously instead of waiting for an animationend jsdom never fires
function openConfirm(method, props?) {
    let handle;
    act(() => {
        handle = Modal[method]({ title: 'Semi', content: 'Content', motion: false, ...props });
    });
    return handle;
}

function deferred() {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

describe('modal', () => {
    // Closing unmounts the confirm root in a microtask, so destroy calls go through an async act
    afterEach(async () => {
        await act(async () => {
            Modal.destroyAll();
        });
    });

    it('confirm title/contentß', async () => {
        let handle = openConfirm('confirm');
        let modal = getConfirm();
        expect(modal.querySelector(`.${prefixCls}-title`)).toHaveTextContent(/^Semi$/);
        expect(modal.querySelector(`.${prefixCls}-confirm-content`)).toHaveTextContent(/^Content$/);
        expect(modal.querySelector(`.${prefixCls}-confirm-icon`)).toHaveClass(`${BASE_CLASS_PREFIX}-icon-help_circle`);
        await act(async () => handle.destroy());
        expect(getConfirm()).toBeNull();

        for (const type of ['error', 'success', 'info', 'warning']) {
            handle = openConfirm(type);
            modal = getConfirm();
            expect(modal.querySelector(`.${prefixCls}-confirm-icon`)).toHaveClass(`${prefixCls}-${type}-icon`);
            await act(async () => handle.destroy());
            expect(getConfirm()).toBeNull();
        }
    });

    it('自定义图标', () => {
        openConfirm('confirm', { icon: <IconSend /> });
        expect(getConfirm().querySelector(`.${BASE_CLASS_PREFIX}-icon-send`)).not.toBeNull();
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

    it('confirm 确定回调返回值带 then 属性但不是 Promise 时直接关闭', async () => {
        openConfirm('confirm', { onOk: () => Object.assign({}, JSON.parse('{"then":1}')) });
        await userEvent.click(getButton('确定'));
        expect(getConfirm()).toBeNull();
    });

    it('confirm 确定回调返回 Promise 时的 loading', async () => {
        const { promise, resolve } = deferred();
        const spyOnOk = vi.fn<() => Promise<unknown>>(() => promise);
        openConfirm('confirm', { onOk: spyOnOk });
        await userEvent.click(getButton('确定'));
        expect(spyOnOk).toHaveBeenCalledTimes(1);
        expect(getButton('确定')).toHaveClass(loadingCls);
        expect(getConfirm()).not.toBeNull();

        await act(async () => {
            resolve();
            await promise;
        });
        expect(getConfirm()).toBeNull();
    });

    it('confirm 确定回调返回 Promise 失败时', async () => {
        const { promise, reject } = deferred();
        const spyOnOk = vi.fn<() => Promise<unknown>>(() => promise);
        openConfirm('confirm', { onOk: spyOnOk });
        await userEvent.click(getButton('确定'));
        expect(getButton('确定')).toHaveClass(loadingCls);

        await act(async () => {
            reject(new Error('something wrong'));
            await promise.catch(() => {});
        });
        expect(spyOnOk).toHaveBeenCalledTimes(1);
        expect(getButton('确定')).not.toHaveClass(loadingCls);
        expect(getConfirm()).not.toBeNull();
    });

    it('confirm 取消回调返回 Promise 时的 loading', async () => {
        const { promise, resolve } = deferred();
        const spyOnCancel = vi.fn<() => Promise<unknown>>(() => promise);
        openConfirm('confirm', { onCancel: spyOnCancel });
        await userEvent.click(getButton(closeName));
        expect(spyOnCancel).toHaveBeenCalledTimes(1);
        expect(getButton('取消')).toHaveClass(loadingCls);
        expect(getConfirm()).not.toBeNull();

        await act(async () => {
            resolve();
            await promise;
        });
        expect(getConfirm()).toBeNull();
    });

    it('confirm 取消回调返回 Promise 失败时', async () => {
        const { promise, reject } = deferred();
        const spyOnCancel = vi.fn<() => Promise<unknown>>(() => promise);
        openConfirm('confirm', { onCancel: spyOnCancel });
        await userEvent.click(getButton('取消'));
        expect(getButton('取消')).toHaveClass(loadingCls);

        await act(async () => {
            reject(new Error('something wrong'));
            await promise.catch(() => {});
        });
        expect(spyOnCancel).toHaveBeenCalledTimes(1);
        expect(getButton('取消')).not.toHaveClass(loadingCls);
        expect(getConfirm()).not.toBeNull();
    });

    it('destroy 关闭确认框，只调用一次 afterClose，并移除其根节点', async () => {
        const afterClose = vi.fn<() => void>();
        const before = document.body.children.length;
        const handle = openConfirm('confirm', { afterClose });
        expect(document.body.children.length).toBeGreaterThan(before);
        await act(async () => handle.destroy());
        expect(getConfirm()).toBeNull();
        expect(afterClose).toHaveBeenCalledTimes(1);
        expect(document.body.children.length).toBe(before);
    });

    it('首帧提交前 destroy，afterClose 调用一次且容器被移除', async () => {
        const afterClose = vi.fn<() => void>();
        const before = document.body.children.length;
        await act(async () => {
            const handle = Modal.confirm({ title: 'x', afterClose, motion: false });
            handle.destroy();
        });
        expect(afterClose).toHaveBeenCalledTimes(1);
        expect(document.body.children.length).toBe(before);
    });

    it('首帧提交前 destroyAll，afterClose 调用一次且容器被移除', async () => {
        const afterClose = vi.fn<() => void>();
        const before = document.body.children.length;
        await act(async () => {
            Modal.warning({ title: 'x', afterClose, motion: false });
            Modal.destroyAll();
        });
        expect(afterClose).toHaveBeenCalledTimes(1);
        expect(document.body.children.length).toBe(before);
    });

    it('显式传入 undefined 的 icon 等同未传，保留类型图标', () => {
        openConfirm('error', { icon: undefined });
        expect(getConfirm().querySelector(`.${prefixCls}-confirm-icon`)).toHaveClass(`${prefixCls}-error-icon`);
    });

    it('okButtonProps 中显式传入 undefined 的 type 不覆盖 error 的 danger', () => {
        openConfirm('error', { okButtonProps: { type: undefined } });
        expect(getConfirm().querySelectorAll(`.${BASE_CLASS_PREFIX}-button`)[2]).toHaveClass(`${BASE_CLASS_PREFIX}-button-danger`);
    });

    it('自定义 Semi 图标保留使用方的 className 与 size', () => {
        openConfirm('confirm', { icon: <IconSend className="mine" size="small" /> });
        const icon = getConfirm().querySelector(`.${BASE_CLASS_PREFIX}-icon-send`);
        expect(icon).toHaveClass('mine', `${prefixCls}-confirm-icon`);
        expect(icon).toHaveClass(`${BASE_CLASS_PREFIX}-icon-small`);
    });

    it('destroyAll 关闭所有已打开的确认框', async () => {
        openConfirm('info', { title: 'A' });
        openConfirm('warning', { title: 'B' });
        expect(document.querySelectorAll(`.${prefixCls}-confirm`)).toHaveLength(2);
        await act(async () => Modal.destroyAll());
        expect(document.querySelectorAll(`.${prefixCls}-confirm`)).toHaveLength(0);
    });

    it('update 可以修改按钮，类型图标类名保持不变', () => {
        const handle = openConfirm('error');
        expect(getConfirm().querySelector(`.${prefixCls}-error-icon`)).not.toBeNull();
        expect(getConfirm().querySelectorAll(`.${BASE_CLASS_PREFIX}-button`)[2]).toHaveClass(`${BASE_CLASS_PREFIX}-button-danger`);
        void act(() => handle.update({ okText: 'Fine', hasCancel: false }));
        const buttons = getConfirm().querySelectorAll(`.${prefixCls}-footer .${BASE_CLASS_PREFIX}-button`);
        expect(buttons).toHaveLength(1);
        expect(buttons[0]).toHaveTextContent('Fine');
    });

    it('useModal 渲染到其 contextHolder 中，destroy 调用 afterClose', () => {
        let modal;
        function Demo({ onApi }) {
            const [api, contextHolder] = Modal.useModal();
            useEffect(() => {
                onApi(api);
            });
            return <div data-testid="holder">{contextHolder}</div>;
        }
        render(<Demo onApi={(api) => (modal = api)} />);
        const afterClose = vi.fn<() => void>();
        let handle;
        act(() => {
            handle = modal.warning({ title: 'Hook', content: 'Body', motion: false, afterClose });
        });
        expect(getConfirm().querySelector(`.${prefixCls}-warning-icon`)).not.toBeNull();
        void act(() => handle.update({ title: 'Hook updated' }));
        expect(getConfirm().querySelector(`.${prefixCls}-confirm-title-text`)).toHaveTextContent('Hook updated');
        void act(() => handle.destroy());
        expect(getConfirm()).toBeNull();
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('useModal 在同一个 act 中先 confirm 后 update 再 destroy，使用最新的 afterClose 且不残留弹窗', async () => {
        let modal;
        function Demo({ onApi }) {
            const [api, contextHolder] = Modal.useModal();
            useEffect(() => {
                onApi(api);
            });
            return contextHolder;
        }
        render(<Demo onApi={(api) => (modal = api)} />);
        const first = vi.fn<() => void>();
        const latest = vi.fn<() => void>();
        await act(async () => {
            const handle = modal.confirm({ title: 'Hook', content: 'Body', motion: false, afterClose: first });
            handle.update({ afterClose: latest });
            handle.destroy();
        });
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(first).not.toHaveBeenCalled();
        expect(latest).toHaveBeenCalledTimes(1);
    });

    it('useModal 弹窗关闭后 update 的 afterClose 不再生效，destroy 与 update 不报错', async () => {
        let modal;
        function Demo({ onApi }) {
            const [api, contextHolder] = Modal.useModal();
            useEffect(() => {
                onApi(api);
            });
            return contextHolder;
        }
        render(<Demo onApi={(api) => (modal = api)} />);
        const afterClose = vi.fn<() => void>();
        let handle;
        act(() => {
            handle = modal.confirm({ title: 'Hook', content: 'Body', motion: false, afterClose });
        });
        await act(async () => handle.destroy());
        expect(afterClose).toHaveBeenCalledTimes(1);
        await act(async () => {
            handle.update({ visible: true });
            handle.destroy();
        });
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('useModal 返回的方法在重渲染后保持引用相等', () => {
        const apis: ModalHookApi[] = [];
        function Demo({ n }: { n: number }) {
            const [api, contextHolder] = Modal.useModal();
            apis.push(api);
            return <div data-n={n}>{contextHolder}</div>;
        }
        const { rerender } = render(<Demo n={1} />);
        rerender(<Demo n={2} />);
        expect(apis.length).toBeGreaterThan(1);
        expect(apis.at(-1)).toBe(apis[0]);
        expect(apis.at(-1)?.confirm).toBe(apis[0].confirm);
    });

    it('关闭并 afterClose 之后再 update，不会重建弹窗', async () => {
        const handle = openConfirm('confirm');
        await act(async () => handle.destroy());
        expect(getConfirm()).toBeNull();
        const childCount = document.body.children.length;
        await act(async () => handle.update({ visible: true }));
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(document.body.children.length).toBe(childCount);
    });

    it('useModal 弹窗跟随 ConfigProvider 的方向', () => {
        let modal;
        function Demo({ onApi }) {
            const [api, contextHolder] = Modal.useModal();
            useEffect(() => {
                onApi(api);
            });
            return contextHolder;
        }
        render(
            <ConfigProvider direction="rtl">
                <Demo onApi={(api) => (modal = api)} />
            </ConfigProvider>
        );
        act(() => {
            modal.confirm({ title: 'Hook', content: 'Body', motion: false });
        });
        expect(getConfirm()).toHaveAttribute('dir', 'rtl');
    });

    it('useModal 在同一个 act 中先 confirm 后 destroy 不会残留弹窗', async () => {
        let modal;
        function Demo({ onApi }) {
            const [api, contextHolder] = Modal.useModal();
            useEffect(() => {
                onApi(api);
            });
            return contextHolder;
        }
        render(<Demo onApi={(api) => (modal = api)} />);
        const afterClose = vi.fn<() => void>();
        await act(async () => {
            const handle = modal.confirm({ title: 'Hook', content: 'Body', motion: false, afterClose });
            handle.destroy();
        });
        expect(getConfirm()).toBeNull();
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('Modal.confirm 与 useModal 的 aria 属性落在对话框上，data-* 落在外层元素上', () => {
        const expectLanding = (root) => {
            const dialog = root.querySelector('[role="alertdialog"]');
            expect(dialog).toHaveAttribute('aria-label', 'Custom');
            expect(dialog).toHaveAttribute('aria-describedby', 'outside-desc');
            expect(dialog).not.toHaveAttribute('data-foo');
            expect(root).toHaveAttribute('data-foo', 'bar');
            expect(root).not.toHaveAttribute('aria-label');
            expect(root).not.toHaveAttribute('aria-describedby');
        };
        const props = { 'aria-label': 'Custom', 'aria-describedby': 'outside-desc', 'data-foo': 'bar' };
        openConfirm('confirm', props);
        expectLanding(getConfirm());

        let modal;
        function Demo({ onApi }) {
            const [api, contextHolder] = Modal.useModal();
            useEffect(() => {
                onApi(api);
            });
            return contextHolder;
        }
        render(<Demo onApi={(api) => (modal = api)} />);
        act(() => {
            modal.info({ title: 'Hook', content: 'Body', motion: false, ...props });
        });
        expectLanding(document.querySelectorAll(`.${prefixCls}-confirm`)[1]);
    });

    it('确认框为 alertdialog，由正文描述', () => {
        openConfirm('warning', { content: 'Delete it?' });
        const dialog = screen.getByRole('alertdialog', { name: 'Semi' });
        expect(dialog).toHaveAccessibleDescription('Delete it?');
    });

    it('update 合并的 motion 生效', async () => {
        const handle = openConfirm('info', { motion: true });
        void act(() => handle.update({ motion: false }));
        await act(async () => handle.destroy());
        expect(getConfirm()).toBeNull();
    });

    it('modal update', () => {
        const modal = openConfirm('confirm');
        const modalDom = getConfirm();
        expect(modalDom.querySelector(`.${prefixCls}-title`)).toHaveTextContent(/^Semi$/);
        expect(modalDom.querySelector(`.${prefixCls}-confirm-content`)).toHaveTextContent(/^Content$/);
        void act(() => modal.update({ title: 'Updated Semi', content: 'Updated Content' }));
        expect(modalDom.querySelector(`.${prefixCls}-confirm-title-text`)).toHaveTextContent(/^Updated Semi$/);
        expect(modalDom.querySelector(`.${prefixCls}-confirm-content`)).toHaveTextContent(/^Updated Content$/);
    });

    it('Modal.confirm 与 useModal 句柄的 update 接收 ModalReactProps，不要求 type', () => {
        type StaticUpdate = ReturnType<typeof Modal.confirm>['update'];
        type HookUpdate = ReturnType<ModalHookApi['confirm']>['update'];
        expectTypeOf<ReturnType<typeof Modal.useModal>>().toEqualTypeOf<[ModalHookApi, ReactElement]>();
        expectTypeOf<Parameters<StaticUpdate>[0]>().toEqualTypeOf<ModalReactProps>();
        expectTypeOf<Parameters<HookUpdate>[0]>().toEqualTypeOf<ModalReactProps>();
        expectTypeOf<Parameters<ReturnType<typeof Modal.info>['update']>[0]>().toEqualTypeOf<ModalReactProps>();
    });
});
