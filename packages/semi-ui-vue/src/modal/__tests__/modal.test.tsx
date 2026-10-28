/** @jsxImportSource vue */
import { KeepAlive, defineComponent, nextTick, shallowRef, type VNode } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { IconEyeClosed } from '@fibrae/semi-icons-vue';
import { endTransitions, render } from '@test/utils/vue';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import Input from '../../input';
import LocaleProvider from '../../locale/locale-provider.vue';
import ConfirmModal from '../confirm-modal.vue';
import type { ModalConfirmProps, ModalHandle, ModalProps } from '../interface';
import Modal from '../modal.vue';
import ConfigContainer from './fixtures/config-container.vue';
import InContainer from './fixtures/in-container.vue';
import Model from './fixtures/model.vue';
import Stacked from './fixtures/stacked.vue';

const prefix = 'semi-modal';
const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
const getButtons = () => document.querySelectorAll<HTMLElement>('.semi-button');
const footerButtons = () => document.querySelectorAll<HTMLElement>(`.${prefix}-footer .semi-button`);
const loadingCls = 'semi-button-loading';
const body = () => <p>This is content of basic modal</p>;

type Props = ModalProps & Record<string, unknown>;
type SlotMap = Record<string, (...args: never[]) => unknown>;

// The dialog renders once Portal has mounted, a tick after the Modal itself.
async function renderModal(props: Props = {}, slots: SlotMap = {}) {
    const view = render(Modal, {
        props: { motion: false, ...props },
        slots: { default: body, ...slots } as never,
    });
    await nextTick();
    return {
        ...view,
        rerender: async (next: Props) => {
            await view.rerender({ motion: false, ...next });
            await nextTick();
        },
    };
}

const pressEsc = () => fireEvent.keyDown(document, { key: 'Escape' });
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function deferred() {
    let resolve!: () => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

const Pair = defineComponent({
    props: { a: Boolean, b: Boolean, showA: { type: Boolean, default: true } },
    setup: (props) => () => (
        <>
            {props.showA ? (
                <Modal visible={props.a} motion={false}>
                    {body}
                </Modal>
            ) : null}
            <Modal visible={props.b} motion={false}>
                {body}
            </Modal>
        </>
    ),
});

afterEach(() => {
    document.body.style.overflow = '';
    document.body.style.paddingInlineEnd = '';
});

describe('Modal', () => {
    it('默认标题是 2 级标题，外观仍是 h5', async () => {
        await renderModal({ visible: true, title: 'Dialog title' });
        expect(screen.getByRole('heading', { level: 2, name: 'Dialog title' })).toHaveClass('semi-typography-h5');
    });

    it('离场动画期间的点击不再触发 onCancel', async () => {
        const onCancel = vi.fn<NonNullable<ModalProps['onCancel']>>();
        const view = await renderModal({ visible: true, motion: true, title: 'title', onCancel });
        const close = () => $(`.${prefix}-close`)?.click();
        close();
        expect(onCancel).toHaveBeenCalledTimes(1);

        // jsdom fires no transition end, so the dialog stays mounted while leaving
        await view.rerender({ visible: false, motion: true, title: 'title', onCancel });
        expect($(`.${prefix}-close`)).not.toBeNull();
        // past the 100ms debounce of onCancel, which would otherwise let the second click through
        await new Promise((resolve) => setTimeout(resolve, 150));
        close();
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('class / style / maskStyle / bodyStyle / zIndex', async () => {
        await renderModal({
            class: 'test',
            style: { color: 'red' },
            visible: true,
            maskStyle: { color: 'grey' },
            bodyStyle: { color: 'pink' },
            zIndex: 500,
        });
        expect($('div.test')).not.toBeNull();
        expect($(`.${prefix}`)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect($(`.${prefix}-body`)).toHaveStyle({ color: 'rgb(255, 192, 203)' });
        expect($(`.${prefix}-mask`)).toHaveStyle({ color: 'rgb(128, 128, 128)' });
        expect($('.semi-portal')?.style.zIndex).toBe('500');
    });

    it('visible 属性', async () => {
        const { rerender } = await renderModal();
        expect($(`div.${prefix}`)).toBeNull();
        await rerender({ visible: true });
        expect($(`div.${prefix}`)).not.toBeNull();
        expect(document.body.style.overflow).toBe('hidden');
        await rerender({ visible: false });
        expect(document.body.style.overflow).not.toBe('hidden');
        expect($(`div.${prefix}`)).toBeNull();
    });

    it('渲染基础内容', async () => {
        await renderModal({ title: 'SemiTitle', visible: true });
        expect($(`.${prefix}-title`)?.textContent).toBe('SemiTitle');
        expect($(`.${prefix}-body`)?.textContent).toBe('This is content of basic modal');
    });

    it('#footer 与 #header', async () => {
        const view = await renderModal({ visible: true }, { header: () => <p>This is a header</p>, footer: () => <p>This is a footer</p> });
        expect($(`.${prefix}-content`)?.children[0].outerHTML).toBe('<p>This is a header</p>');
        expect($(`.${prefix}-footer`)).toContainElement(screen.getByText('This is a footer'));
        view.unmount();
        await renderModal({ visible: true }, { header: () => [], footer: () => [] });
        const content = $(`.${prefix}-content`)?.children ?? [];
        expect(content).toHaveLength(1);
        expect(content[0].textContent).toBe('This is content of basic modal');
    });

    it('不传 #header、#footer 时渲染标题与默认按钮', async () => {
        await renderModal({ title: 'Title', visible: true });
        expect(screen.getByRole('dialog')).toHaveAccessibleName('Title');
        expect(getButtons()).toHaveLength(3);
    });

    it('height 与 width，数字按 px 处理', async () => {
        const view = await renderModal({ width: '413px', height: '613px', visible: true });
        expect(getComputedStyle($(`.${prefix}`) as HTMLElement).width).toBe('413px');
        expect(getComputedStyle($(`.${prefix}`) as HTMLElement).height).toBe('613px');
        view.unmount();
        await renderModal({ width: 413, height: 613, visible: true });
        expect($(`.${prefix}`)).toHaveStyle({ width: '413px', height: '613px' });
        expect($(`.${prefix}-content`)).toHaveClass(`${prefix}-content-height-set`);
    });

    it('size 属性', async () => {
        const { rerender } = await renderModal({ size: 'small', visible: true });
        expect($(`.${prefix}-small`)).not.toBeNull();
        await rerender({ size: 'medium', visible: true });
        expect($(`.${prefix}-medium`)).not.toBeNull();
        await rerender({ size: 'large', visible: true });
        expect($(`.${prefix}-large`)).not.toBeNull();
        await rerender({ size: 'full-width', visible: true });
        expect($(`.${prefix}-full-width`)).not.toBeNull();
    });

    it('closable 属性', async () => {
        const view = await renderModal({ closable: true, visible: true });
        expect($(`.${prefix}-close`)).not.toBeNull();
        view.unmount();
        await renderModal({ closable: false, visible: true });
        expect($(`.${prefix}-close`)).toBeNull();
    });

    it('getPopupContainer 指向同一模板中的元素', async () => {
        render(InContainer);
        await nextTick();
        const modals = document.querySelectorAll<HTMLElement>(`div.${prefix}`);
        expect(modals).toHaveLength(1);
        expect($('.modal-container')).toContainElement(modals[0]);
    });

    it('maskClosable', async () => {
        const onCancel = vi.fn<NonNullable<ModalProps['onCancel']>>();
        const view = await renderModal({ maskClosable: true, visible: true, onCancel });
        await userEvent.click($(`.${prefix}-wrap`) as HTMLElement);
        expect(onCancel).toHaveBeenCalledTimes(1);
        view.unmount();

        const onCancel2 = vi.fn<NonNullable<ModalProps['onCancel']>>();
        await renderModal({ maskClosable: false, visible: true, onCancel: onCancel2 });
        await userEvent.click($(`.${prefix}-wrap`) as HTMLElement);
        expect(onCancel2).not.toHaveBeenCalled();
    });

    it('按钮相关属性：cancelText / okText / okButtonProps / cancelButtonProps / hasCancel / confirmLoading', async () => {
        const baseProps: Props = {
            cancelText: 'cancel',
            okText: 'ok',
            okType: 'secondary',
            visible: true,
            closable: false,
        };
        const { rerender } = await renderModal(baseProps);
        let buttons = getButtons();
        expect(buttons[0]).toHaveTextContent(/^cancel$/);
        expect(buttons[1]).toHaveTextContent(/^ok$/);
        expect(buttons[1]).toHaveClass('semi-button-secondary');
        const buttonProps: Props = {
            okButtonProps: { size: 'small', type: 'warning' },
            cancelButtonProps: { size: 'small', disabled: true },
        };
        await rerender({ ...baseProps, ...buttonProps });
        buttons = getButtons();
        expect(buttons[0]).toHaveClass('semi-button-disabled', 'semi-button-size-small');
        expect(buttons[1]).toHaveClass('semi-button-warning', 'semi-button-size-small');
        await rerender({ ...baseProps, ...buttonProps, hasCancel: false, confirmLoading: true });
        buttons = getButtons();
        expect(buttons).toHaveLength(1);
        expect(buttons[0]).toHaveClass(loadingCls);
    });

    it('onCancel / onOk', async () => {
        const onCancel = vi.fn<NonNullable<ModalProps['onCancel']>>();
        const onOk = vi.fn<NonNullable<ModalProps['onOk']>>();
        await renderModal({ visible: true, onCancel, onOk });
        const buttons = getButtons();
        await userEvent.click($(`button.${prefix}-close`) as HTMLElement);
        await userEvent.click(buttons[1]);
        await userEvent.click(buttons[2]);
        expect(onCancel).toHaveBeenCalledTimes(2);
        expect(onOk).toHaveBeenCalledTimes(1);
        expect(onOk.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    });

    it('无遮罩', async () => {
        await renderModal({ mask: false, visible: true });
        expect($(`div.${prefix}`)).not.toBeNull();
        expect($(`.${prefix}-mask`)).toBeNull();
    });

    it('#closeIcon 替换关闭按钮内的图标，按钮名称不变', async () => {
        await renderModal({ visible: true }, { closeIcon: () => <IconEyeClosed /> });
        expect(document.querySelectorAll('.semi-icon-eye_closed')).toHaveLength(1);
        expect($(`.${prefix}-close .semi-icon-close`)).toBeNull();
        expect(screen.getByRole('button', { name: '关闭' })).toHaveClass(`${prefix}-close`);
    });

    it('motion 为 false', async () => {
        const { rerender } = await renderModal({ visible: true, motion: false });
        expect($(`div.${prefix}`)?.style.transform).toBe('');
        await rerender({ visible: false, motion: false });
        expect($(`div.${prefix}`)).toBeNull();
    });

    it('无动效关闭后改为有动效，不挂出隐藏的遮挡层也不锁滚动', async () => {
        const { rerender } = await renderModal({ visible: true, motion: false });
        await rerender({ visible: false, motion: false });
        await rerender({ visible: false, motion: true });
        expect($(`.${prefix}-wrap`)).toBeNull();
        expect(document.body.style.overflow).toBe('');
    });

    it('centered 属性', async () => {
        await renderModal({ centered: true, visible: true, motion: true });
        expect($(`div.${prefix}-content`)).toHaveClass(`${prefix}-content-animate-show`);
        expect($(`div.${prefix}`)).toHaveClass(`${prefix}-centered`);
    });

    it('无动效时的 centered', async () => {
        await renderModal({ centered: true, visible: true, motion: false });
        expect($(`div.${prefix}-wrap`)).toHaveClass(`${prefix}-wrap-center`);
    });

    it('keepDOM', async () => {
        const { rerender } = await renderModal({ keepDOM: true });
        expect($(`div.${prefix}`)).toBeNull();
        await rerender({ keepDOM: true, visible: true });
        expect($(`div.${prefix}`)).not.toBeNull();
        expect($(`.${prefix}-displayNone`)).toBeNull();
        expect(document.body.style.overflow).toBe('hidden');
        await rerender({ keepDOM: true, visible: false });
        expect($(`.${prefix}-displayNone`)).not.toBeNull();
        expect($(`div.${prefix}`)).not.toBeNull();
    });

    it('keepDOM 与 lazyRender=false', async () => {
        const { rerender } = await renderModal({ keepDOM: true, lazyRender: false });
        expect($(`div.${prefix}`)).not.toBeNull();
        expect($(`.${prefix}-displayNone`)).not.toBeNull();
        await rerender({ keepDOM: true, lazyRender: false, visible: true });
        expect($(`.${prefix}-displayNone`)).toBeNull();
        expect(document.body.style.overflow).toBe('hidden');
        await rerender({ keepDOM: true, lazyRender: false, visible: false });
        expect($(`.${prefix}-displayNone`)).not.toBeNull();
        expect($(`div.${prefix}`)).not.toBeNull();
    });

    it('#modal 插槽包住对话框元素', async () => {
        await renderModal({ visible: true }, { modal: ({ modal }: { modal: VNode }) => <div class="modal-render-test">{modal}</div> });
        expect($(`div.modal-render-test`)).not.toBeNull();
        expect($(`div.modal-render-test .${prefix}-body`)).not.toBeNull();
        expect($(`div.modal-render-test`)?.firstElementChild).toHaveAttribute('role', 'dialog');
    });

    it('#modal 与 #header 同时使用时，包住的对话框渲染自定义 header', async () => {
        await renderModal(
            { visible: true, title: 'T' },
            {
                header: () => <h3 class="custom-header">Custom</h3>,
                modal: ({ modal }: { modal: VNode }) => <div class="wrap">{modal}</div>,
            }
        );
        const dialog = screen.getByRole('dialog');
        expect(dialog.parentElement).toHaveClass('wrap');
        expect(dialog.firstElementChild).toHaveClass('custom-header');
        expect($(`.${prefix}-title`)).toBeNull();
        expect(footerButtons()).toHaveLength(2);
    });

    it('多个 modal 打开时，Esc 只关闭最上层的 modal', async () => {
        const onOuterCancel = vi.fn<NonNullable<ModalProps['onCancel']>>();
        const onInnerCancel = vi.fn<NonNullable<ModalProps['onCancel']>>();
        render(Stacked, { props: { onOuterCancel, onInnerCancel } });
        await nextTick();
        await pressEsc();
        expect(onInnerCancel).toHaveBeenCalledTimes(1);
        expect(onOuterCancel).not.toHaveBeenCalled();
        expect(document.querySelectorAll(`div.${prefix}`)).toHaveLength(1);
        await pressEsc();
        expect(onOuterCancel).toHaveBeenCalledTimes(1);
        expect(document.querySelectorAll(`div.${prefix}`)).toHaveLength(0);
    });

    it('每个打开的 modal 都用自己的标题标注，组件版不默认设置 aria-describedby', async () => {
        render(() => (
            <>
                <Modal visible motion={false} title="First">
                    {() => <p>first body</p>}
                </Modal>
                <Modal visible motion={false} title="Second">
                    {() => <p>second body</p>}
                </Modal>
            </>
        ));
        await nextTick();
        const [first, second] = screen.getAllByRole('dialog');
        expect(first).toHaveAccessibleName('First');
        expect(second).toHaveAccessibleName('Second');
        expect(first).not.toHaveAttribute('aria-describedby');
        expect(second).not.toHaveAttribute('aria-describedby');
    });

    it('没有标题的 modal 不由内容描述，使用方传入的 aria-describedby 照常生效', async () => {
        const view = await renderModal({ visible: true });
        expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
        view.unmount();
        render(() => (
            <>
                <p id="outside-desc">outside</p>
                <Modal visible motion={false} aria-describedby="outside-desc">
                    {body}
                </Modal>
            </>
        ));
        await nextTick();
        expect(screen.getByRole('dialog')).toHaveAccessibleDescription('outside');
    });

    it('缺少标题元素时不设置标注', async () => {
        render(() => (
            <>
                <Modal visible motion={false}>
                    {body}
                </Modal>
                <Modal visible motion={false} title="Ignored">
                    {{
                        default: body,
                        header: () => <div>custom</div>,
                    }}
                </Modal>
            </>
        ));
        await nextTick();
        for (const dialog of screen.getAllByRole('dialog')) {
            expect(dialog).not.toHaveAttribute('aria-labelledby');
        }
    });
});

describe('Modal 行为', () => {
    it('Esc 关闭时 onCancel 收到原生 KeyboardEvent，类型声明与之一致', async () => {
        const onCancel = vi.fn<NonNullable<ModalProps['onCancel']>>();
        await renderModal({ visible: true, onCancel });
        await pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onCancel.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
        expectTypeOf<Parameters<NonNullable<ModalProps['onCancel']>>[0]>().toEqualTypeOf<MouseEvent | KeyboardEvent>();
        expectTypeOf<ModalConfirmProps['direction']>().toEqualTypeOf<'ltr' | 'rtl' | undefined>();
    });

    it('afterClose 每次关闭只触发一次，挂载时与隐藏期间不触发', async () => {
        const onAfterClose = vi.fn<() => void>();
        const view = await renderModal({ onAfterClose });
        await view.rerender({ visible: true });
        expect(onAfterClose).not.toHaveBeenCalled();
        await view.rerender({ visible: false });
        expect(onAfterClose).toHaveBeenCalledTimes(1);
        await view.rerender({ visible: true });
        await view.rerender({ visible: false });
        expect(onAfterClose).toHaveBeenCalledTimes(2);
        view.unmount();
        expect(onAfterClose).toHaveBeenCalledTimes(2);
    });

    it('有动效时，隐藏会等待离开动画结束后再卸载并发出 afterClose', async () => {
        const onAfterClose = vi.fn<() => void>();
        const { rerender } = await renderModal({ onAfterClose, visible: true, motion: true });
        await rerender({ visible: false, motion: true });
        expect($(`.${prefix}-content`)).toHaveClass(`${prefix}-content-animate-hide`);
        expect($(`.${prefix}-mask`)).toHaveClass(`${prefix}-mask-animate-hide`);
        expect(document.body.style.overflow).toBe('hidden');
        expect(onAfterClose).not.toHaveBeenCalled();
        await endTransitions();
        expect($(`.${prefix}`)).toBeNull();
        expect(document.body.style.overflow).toBe('');
        expect(onAfterClose).toHaveBeenCalledTimes(1);
    });

    it('onOk / onCancel 返回 Promise 时，按钮保持 loading 直至完成', async () => {
        const ok = deferred();
        const cancel = deferred();
        await renderModal({ visible: true, onOk: () => ok.promise, onCancel: () => cancel.promise });
        await userEvent.click(footerButtons()[1]);
        expect(footerButtons()[1]).toHaveClass(loadingCls);
        expect(footerButtons()[0]).not.toHaveClass(loadingCls);
        ok.resolve();
        await ok.promise;
        await nextTick();
        expect(footerButtons()[1]).not.toHaveClass(loadingCls);

        await userEvent.click(footerButtons()[0]);
        expect(footerButtons()[0]).toHaveClass(loadingCls);
        cancel.resolve();
        await cancel.promise;
        await nextTick();
        expect(footerButtons()[0]).not.toHaveClass(loadingCls);
    });

    it('在对话框内按下、在遮罩上松开的操作不会关闭 modal', async () => {
        const onCancel = vi.fn<NonNullable<ModalProps['onCancel']>>();
        await renderModal({ visible: true, onCancel });
        const wrap = $(`.${prefix}-wrap`) as HTMLElement;
        await fireEvent.mouseDown($(`.${prefix}`) as HTMLElement);
        await fireEvent.mouseUp(wrap);
        await fireEvent.click(wrap);
        expect(onCancel).not.toHaveBeenCalled();
        await tick();
        await fireEvent.click(wrap);
        expect(onCancel).toHaveBeenCalledTimes(1);
        await fireEvent.click($(`.${prefix}-body`) as HTMLElement);
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('closeOnEsc', async () => {
        const onCancel = vi.fn<NonNullable<ModalProps['onCancel']>>();
        const { rerender } = await renderModal({ visible: true, onCancel });
        await pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(1);
        await rerender({ visible: true, onCancel, closeOnEsc: false });
        await pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('closeOnEsc 为 false 时从不通过 Esc 关闭', async () => {
        const onCancel = vi.fn<NonNullable<ModalProps['onCancel']>>();
        await renderModal({ visible: true, onCancel, closeOnEsc: false });
        await pressEsc();
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('closeOnEsc 为 false 时，最上层 modal 上的 Escape 不会传到下层 modal', async () => {
        const onLowerCancel = vi.fn<NonNullable<ModalProps['onCancel']>>();
        render(() => (
            <>
                <Modal visible motion={false} title="Lower" onCancel={onLowerCancel}>
                    {body}
                </Modal>
                <Modal visible motion={false} title="Upper" closeOnEsc={false}>
                    {body}
                </Modal>
            </>
        ));
        await nextTick();
        await pressEsc();
        expect(onLowerCancel).not.toHaveBeenCalled();
    });

    it('modal 使其后的页面变为 inert，关闭时释放', async () => {
        const page = document.body.appendChild(document.createElement('main'));
        const { rerender } = await renderModal({ visible: true, title: 'Dialog' });
        expect(page.inert).toBe(true);
        await rerender({ visible: false });
        expect(page.inert).toBe(false);
        page.remove();
    });

    it('仅当对话框阻挡整个页面时才设置 aria-modal', async () => {
        const container = document.body.appendChild(document.createElement('div'));
        const cases: [Props, string | null][] = [
            [{}, 'true'],
            [{ mask: false }, null],
            [{ getPopupContainer: () => container }, null],
            [{ getPopupContainer: () => container, maskFixed: true }, 'true'],
            [{ mask: false, 'aria-modal': 'true' }, 'true'],
        ];
        for (const [props, expected] of cases) {
            const view = await renderModal({ visible: true, title: 'Dialog', ...props });
            expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe(expected);
            view.unmount();
        }
        container.remove();
        render(ConfigContainer);
        await nextTick();
        expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal');
    });

    it('叠加的 modal 在最后一个关闭前保持 body 锁定，之后恢复', async () => {
        const view = render(Pair, { props: { a: true, b: false } });
        await nextTick();
        expect(document.body.style.overflow).toBe('hidden');
        await view.rerender({ a: true, b: true });
        expect(document.body.style.overflow).toBe('hidden');
        await view.rerender({ a: true, b: false });
        expect(document.body.style.overflow).toBe('hidden');
        await view.rerender({ a: false, b: false });
        expect(document.body.style.overflow).toBe('');
        expect(document.body.style.paddingInlineEnd).toBe('');
    });

    it('保留页面已设置的 overflow，在自定义容器中不锁定', async () => {
        document.body.style.overflow = 'hidden';
        const view = await renderModal({ visible: true });
        await view.rerender({ visible: false });
        expect(document.body.style.overflow).toBe('hidden');
        view.unmount();
        document.body.style.overflow = '';

        const container = document.body.appendChild(document.createElement('div'));
        const custom = await renderModal({ visible: true, getPopupContainer: () => container });
        expect(document.body.style.overflow).toBe('');
        expect(container.querySelector(`.${prefix}`)).not.toBeNull();
        expect($('.semi-portal')?.style.position).toBe('static');
        custom.unmount();
        container.remove();
    });

    it('body 中 mask 为 false 的 modal 不是模态，不锁 body 滚动', async () => {
        await renderModal({ visible: true, mask: false });
        expect(document.body.style.overflow).toBe('');
    });

    it('打开时焦点移入对话框，关闭时回到之前的元素', async () => {
        const trigger = document.body.appendChild(document.createElement('button'));
        trigger.focus();
        const { rerender } = await renderModal({ visible: true });
        expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
        expect(document.activeElement).toBe(footerButtons()[0]);
        await rerender({ visible: false });
        expect(document.activeElement).toBe(trigger);
        trigger.remove();
    });

    it('空 #footer 时聚焦第一个可聚焦元素', async () => {
        await renderModal({ visible: true, title: 'T' }, { footer: () => [] });
        expect(document.activeElement).toBe($(`.${prefix}-close`));
    });

    it('closable 为 false 且 #footer 为空时，焦点落在 role=dialog 上', async () => {
        await renderModal({ visible: true, closable: false, title: 'T' }, { footer: () => [] });
        const dialog = screen.getByRole('dialog');
        expect(dialog.querySelector('button')).toBeNull();
        expect(document.activeElement).toBe(dialog);
    });

    it('footerFill 时取消按钮用逻辑属性抵消起始间距', async () => {
        await renderModal({ visible: true, footerFill: true });
        const style = footerButtons()[0].getAttribute('style') ?? '';
        expect(style).toContain('margin-inline-start: unset');
        expect(style).not.toContain('margin-left');
    });

    it('maskClosable 由 false 改为 true 后，首次点击遮罩即关闭', async () => {
        const onCancel = vi.fn<NonNullable<ModalProps['onCancel']>>();
        const { rerender } = await renderModal({ visible: true, maskClosable: false, onCancel });
        await fireEvent.mouseDown($(`.${prefix}`) as HTMLElement);
        await fireEvent.mouseUp($(`.${prefix}`) as HTMLElement);
        await rerender({ visible: true, maskClosable: true, onCancel });
        await fireEvent.click($(`.${prefix}-wrap`) as HTMLElement);
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('显示中改其他属性时，每次渲染只调用一次 getPopupContainer', async () => {
        const container = vi.fn<() => HTMLElement>(() => document.body);
        const { rerender } = await renderModal({ visible: true, getPopupContainer: container });
        container.mockClear();
        await rerender({ visible: true, getPopupContainer: container, title: 'next' });
        expect(container).toHaveBeenCalledTimes(1);
    });

    it('footer 按钮显示语言包文案', async () => {
        const view = await renderModal({ visible: true, closable: false });
        expect([...footerButtons()].map((b) => b.textContent?.trim())).toEqual(['取消', '确定']);
        view.unmount();
        render(LocaleProvider, {
            props: { locale: en_US },
            slots: { default: () => <Modal closable={false} motion={false} visible /> },
        });
        await nextTick();
        expect([...footerButtons()].map((b) => b.textContent?.trim())).toEqual(['Cancel', 'Confirm']);
    });

    it('关闭按钮名称跟随语言包', async () => {
        const view = await renderModal({ visible: true });
        expect($(`.${prefix}-close`)).toHaveAttribute('aria-label', '关闭');
        view.unmount();
        render(LocaleProvider, {
            props: { locale: en_US },
            slots: { default: () => <Modal motion={false} visible /> },
        });
        await nextTick();
        expect($(`.${prefix}-close`)).toHaveAttribute('aria-label', 'Close');
    });

    it('data-* 透传到 portal 中的外层元素，已声明的属性不落到 DOM', async () => {
        await renderModal({
            visible: true,
            class: 'outer',
            'data-testid': 'modal-root',
            title: 'Declared',
            footerFill: true,
            preventScroll: true,
            okType: 'primary',
            maskFixed: false,
            modalContentClass: 'mc',
        });
        const root = screen.getByTestId('modal-root');
        expect(root).toHaveClass('outer');
        expect(root.parentElement).toHaveClass('semi-portal');
        expect(root).toContainElement($(`.${prefix}-mask`));
        expect(root).toContainElement($(`.${prefix}`));
        for (const name of ['title', 'footerfill', 'preventscroll', 'oktype', 'maskfixed', 'modalcontentclass']) {
            expect(document.querySelector(`[${name}]`)).toBeNull();
        }
    });

    it('从 semiGlobal overrideDefaultProps.Modal 读取默认值', async () => {
        semiGlobal.config.overrideDefaultProps = { Modal: { okText: 'Global OK', closable: false, motion: false } };
        try {
            render(Modal, { props: { title: 'T', visible: true } });
            await nextTick();
            expect($(`.${prefix}-close`)).toBeNull();
            expect(footerButtons()[1]).toHaveTextContent('Global OK');
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('fullScreen 跟随属性', async () => {
        const { rerender } = await renderModal({ visible: true, fullScreen: true, width: 300 });
        expect($(`.${prefix}-content`)).toHaveClass(`${prefix}-content-fullScreen`);
        expect($(`.${prefix}`)).toHaveStyle({ width: '100%', height: '100%' });
        await rerender({ visible: true, fullScreen: false });
        expect($(`.${prefix}-content`)).not.toHaveClass(`${prefix}-content-fullScreen`);
    });

    it('footerFill、modalContentClass 与 #icon 的类名', async () => {
        await renderModal({ visible: true, footerFill: true, modalContentClass: 'mc' }, { icon: () => <span>i</span> });
        expect($(`.${prefix}-footerfill`)).not.toBeNull();
        expect(footerButtons()[0]).toHaveClass('semi-button-block');
        expect($(`.${prefix}-content`)).toHaveClass('mc');
        expect($(`.${prefix}-icon-wrapper`)).toHaveTextContent('i');
        expect($(`.${prefix}-body`)).toHaveClass(`${prefix}-withIcon`);
    });
});

describe('Modal 修复', () => {
    it('footer 按钮以可见文本命名', async () => {
        const view = await renderModal({ visible: true, closable: false });
        expect(screen.getByRole('button', { name: '取消' })).toBe(footerButtons()[0]);
        expect(screen.getByRole('button', { name: '确定' })).toBe(footerButtons()[1]);
        view.unmount();
        await renderModal({ visible: true, closable: false, okText: 'Go', cancelText: 'Back' });
        expect(screen.getByRole('button', { name: 'Back' })).toBe(footerButtons()[0]);
        expect(screen.getByRole('button', { name: 'Go' })).toBe(footerButtons()[1]);
    });

    it('隐藏的 keepDOM modal 忽略 Esc 并归还焦点，再次显示时仍聚焦取消按钮', async () => {
        const onCancel = vi.fn<NonNullable<ModalProps['onCancel']>>();
        const trigger = document.body.appendChild(document.createElement('button'));
        trigger.focus();
        const { rerender } = await renderModal({ keepDOM: true, visible: true, onCancel, title: 'Kept' });
        expect(document.activeElement).toBe(footerButtons()[0]);
        await rerender({ keepDOM: true, visible: false, onCancel });
        expect(document.activeElement).toBe(trigger);
        await pressEsc();
        expect(onCancel).not.toHaveBeenCalled();
        await rerender({ keepDOM: true, visible: true, onCancel });
        expect(document.activeElement).toBe(footerButtons()[0]);
        await pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(1);
        trigger.remove();
    });

    it('卸载隐藏的 modal 不影响其他 modal 的 body 锁定', async () => {
        const view = render(Pair, { props: { a: true, b: false } });
        await nextTick();
        await view.rerender({ a: false, b: false });
        expect(document.body.style.overflow).toBe('');
        await view.rerender({ a: false, b: true });
        expect(document.body.style.overflow).toBe('hidden');
        await view.rerender({ a: false, b: true, showA: false });
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('离开动画期间重新打开，关闭后仍恢复 body', async () => {
        const { rerender } = await renderModal({ visible: true, motion: true });
        await rerender({ visible: false, motion: true });
        await rerender({ visible: true, motion: true });
        // jsdom ends an animation at once, so the cancelled leave's pending frame would end the next leave as well
        await endTransitions();
        await rerender({ visible: false, motion: true });
        await endTransitions();
        expect($(`.${prefix}`)).toBeNull();
        expect(document.body.style.overflow).toBe('');
    });

    it('组件 ref 的 root 是 portal 中的外层元素，未知属性落在它上面', async () => {
        let handle: ModalHandle | null = null;
        const setHandle = (instance: unknown) => {
            handle = instance as ModalHandle | null;
        };
        render(() => (
            <Modal ref={setHandle} visible motion={false} {...{ id: 'modal-root', 'data-foo': 'bar' }}>
                {body}
            </Modal>
        ));
        expect(handle).not.toBeNull();
        expect((handle as unknown as ModalHandle).root).toBeNull();
        await nextTick();
        const root = document.getElementById('modal-root');
        expect((handle as unknown as ModalHandle).root).toBe(root);
        expect(root?.parentElement).toHaveClass('semi-portal');
        expect(root).toHaveAttribute('data-foo', 'bar');
        expect(root).toContainElement($(`.${prefix}`));
    });

    it('aria-label、aria-labelledby、aria-describedby 与 aria-modal 落在对话框上，data-* 落在外层元素上', async () => {
        await renderModal(
            {
                visible: true,
                title: 'Title',
                'aria-label': 'Custom label',
                'aria-labelledby': 'outside-label',
                'aria-describedby': 'outside-desc',
                'aria-modal': 'false',
                'data-foo': 'bar',
            },
            { default: () => <p>body</p> }
        );
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-label', 'Custom label');
        expect(dialog).toHaveAttribute('aria-labelledby', 'outside-label');
        expect(dialog).toHaveAttribute('aria-describedby', 'outside-desc');
        expect(dialog).toHaveAttribute('aria-modal', 'false');
        expect(dialog).not.toHaveAttribute('data-foo');
        const root = $('.semi-portal')?.firstElementChild;
        expect(root).toHaveAttribute('data-foo', 'bar');
        for (const name of ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-modal']) {
            expect(root).not.toHaveAttribute(name);
        }
    });

    it('其余 aria-* 也落在对话框上，外层元素没有', async () => {
        await renderModal({
            visible: true,
            title: 'Title',
            'aria-roledescription': 'sheet',
            'aria-details': 'extra',
        });
        const dialog = screen.getByRole('dialog');
        const root = $('.semi-portal')?.firstElementChild;
        for (const [name, value] of [
            ['aria-roledescription', 'sheet'],
            ['aria-details', 'extra'],
        ]) {
            expect(dialog).toHaveAttribute(name, value);
            expect(root).not.toHaveAttribute(name);
        }
    });

    it('调用方未传入时，保留生成的标题引用与 aria-modal', async () => {
        await renderModal({ visible: true, title: 'Title' }, { default: () => <p>body</p> });
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAccessibleName('Title');
    });

    it('aria-label 替换生成的标题引用', async () => {
        await renderModal({ visible: true, title: 'Title', 'aria-label': 'Custom label' });
        const dialog = screen.getByRole('dialog');
        expect(dialog).not.toHaveAttribute('aria-labelledby');
        expect(dialog).toHaveAccessibleName('Custom label');
    });

    it('卸载已显示的 modal 时同步发出一次 afterClose，隐藏或已关闭的不发出', async () => {
        const onAfterClose = vi.fn<() => void>();
        const shown = await renderModal({ visible: true, onAfterClose });
        shown.unmount();
        expect(onAfterClose).toHaveBeenCalledTimes(1);

        const closed = await renderModal({ visible: true, onAfterClose });
        await closed.rerender({ visible: false, onAfterClose });
        expect(onAfterClose).toHaveBeenCalledTimes(2);
        closed.unmount();
        expect(onAfterClose).toHaveBeenCalledTimes(2);

        (await renderModal({ onAfterClose })).unmount();
        expect(onAfterClose).toHaveBeenCalledTimes(2);
    });

    it('离开动画期间卸载只发出一次 afterClose', async () => {
        const onAfterClose = vi.fn<() => void>();
        const view = await renderModal({ visible: true, motion: true, onAfterClose });
        await view.rerender({ visible: false, motion: true, onAfterClose });
        view.unmount();
        expect(onAfterClose).toHaveBeenCalledTimes(1);
    });

    it('onOk、onCancel 传 null 时点击不抛错，取消仍发出 update:visible', async () => {
        const onUpdate = vi.fn<(visible: boolean) => void>();
        await renderModal({
            visible: true,
            onOk: null,
            onCancel: null,
            'onUpdate:visible': onUpdate,
        } as unknown as Props);
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await userEvent.click(screen.getByRole('button', { name: '取消' }));
        expect(onUpdate).toHaveBeenCalledExactlyOnceWith(false);
    });
});

describe('Modal 对话框名称警告', () => {
    const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
    let warn: ReturnType<typeof spyWarn>;
    const nameWarnings = () => warn.mock.calls.filter(([message]) => String(message).includes('[Semi Modal]'));
    beforeEach(() => {
        warn = spyWarn();
    });

    it('未命名打开时只警告一次', async () => {
        await renderModal({ visible: true });
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(nameWarnings()).toHaveLength(1);
    });

    it('有标题时不警告', async () => {
        await renderModal({ visible: true, title: 'Named' });
        expect(screen.getByRole('dialog', { name: 'Named' })).toBeInTheDocument();
        expect(nameWarnings()).toHaveLength(0);
    });
});

describe('Modal（Vue）', () => {
    it('v-model:visible：点击取消按钮后父级 visible 变为 false，并发出 afterClose', async () => {
        render(Model);
        await nextTick();
        await userEvent.click(screen.getByRole('button', { name: '取消' }));
        expect(screen.getByRole('status', { name: 'visible' })).toHaveTextContent('false');
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(screen.getByRole('status', { name: 'closed' })).toHaveTextContent('1');
    });

    it('关闭按钮、遮罩与 Esc 各发出一次 update:visible(false)', async () => {
        const onUpdate = vi.fn<(visible: boolean) => void>();
        await renderModal({ visible: true, title: 'T', 'onUpdate:visible': onUpdate });
        await userEvent.click(screen.getByRole('button', { name: '关闭' }));
        expect(onUpdate).toHaveBeenCalledTimes(1);
        await userEvent.click($(`.${prefix}-wrap`) as HTMLElement);
        expect(onUpdate).toHaveBeenCalledTimes(2);
        await pressEsc();
        expect(onUpdate).toHaveBeenCalledTimes(3);
        expect(onUpdate.mock.calls.every(([visible]) => visible === false)).toBe(true);
    });

    it('单向绑定 visible 时 Esc 与取消只发出事件，显示不变', async () => {
        const onUpdate = vi.fn<(visible: boolean) => void>();
        await renderModal({ visible: true, 'onUpdate:visible': onUpdate });
        await pressEsc();
        await userEvent.click(screen.getByRole('button', { name: '取消' }));
        expect(onUpdate).toHaveBeenCalledTimes(2);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('onCancel 返回 Promise：fulfill 后才发出 update:visible', async () => {
        const pending = deferred();
        render(Model, { props: { onCancel: () => pending.promise } });
        await nextTick();
        await userEvent.click(screen.getByRole('button', { name: '取消' }));
        expect(screen.getByRole('status', { name: 'visible' })).toHaveTextContent('true');
        pending.resolve();
        await pending.promise;
        await nextTick();
        expect(screen.getByRole('status', { name: 'visible' })).toHaveTextContent('false');
    });

    it('onCancel 返回的 Promise reject：不发出 update:visible，保持显示，原因由 foundation 重新抛出', async () => {
        const listeners = process.listeners('unhandledRejection');
        const reasons: unknown[] = [];
        process.removeAllListeners('unhandledRejection');
        process.on('unhandledRejection', (reason) => reasons.push(reason));
        try {
            const pending = deferred();
            const failure = new Error('cancel failed');
            render(Model, { props: { onCancel: () => pending.promise } });
            await nextTick();
            await userEvent.click(screen.getByRole('button', { name: '取消' }));
            pending.reject(failure);
            await pending.promise.catch(() => {});
            await new Promise((resolve) => setTimeout(resolve, 20));
            expect(screen.getByRole('status', { name: 'visible' })).toHaveTextContent('true');
            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(reasons).toEqual([failure]);
        } finally {
            process.removeAllListeners('unhandledRejection');
            for (const listener of listeners) {
                process.on('unhandledRejection', listener);
            }
        }
    });

    it('确定按钮只调用 onOk，不发出 update:visible', async () => {
        const onOk = vi.fn<NonNullable<ModalProps['onOk']>>();
        render(Model, { props: { onOk } });
        await nextTick();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        expect(onOk).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('status', { name: 'visible' })).toHaveTextContent('true');
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('app.provide(semiGlobalKey) 的 Modal 默认值只作用于该 app，函数默认值同样生效', async () => {
        const container = document.body.appendChild(document.createElement('div'));
        const onOk = vi.fn<NonNullable<ModalProps['onOk']>>();
        const onCancel = vi.fn<NonNullable<ModalProps['onCancel']>>();
        const appSemi = new SemiGlobal();
        appSemi.config.overrideDefaultProps = {
            Modal: { okText: 'App OK', getPopupContainer: () => container, onOk, onCancel },
        };
        render(Modal, {
            props: { visible: true, motion: false },
            global: { provide: { [semiGlobalKey as symbol]: appSemi } },
        });
        await nextTick();
        expect(container.querySelector(`.${prefix}`)).not.toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'App OK' }));
        await userEvent.click(screen.getByRole('button', { name: '取消' }));
        expect(onOk).toHaveBeenCalledTimes(1);
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(semiGlobal.config.overrideDefaultProps?.Modal).toBeUndefined();
        container.remove();
    });

    it('#title 插槽优先于 title 属性，标题元素仍命名对话框；title 不落为原生属性', async () => {
        await renderModal({ visible: true, title: 'Prop' }, { title: () => <b>Slot title</b> });
        expect(screen.getByRole('dialog')).toHaveAccessibleName('Slot title');
        expect(screen.queryByText('Prop')).toBeNull();
        expect(document.querySelector('[title]')).toBeNull();
    });

    it('#header 有内容时原样渲染，对话框不生成标题引用', async () => {
        await renderModal({ visible: true, title: 'T' }, { header: () => <h3 class="custom-header">Custom</h3> });
        const dialog = screen.getByRole('dialog');
        expect(dialog.firstElementChild).toHaveClass('custom-header');
        expect(dialog).not.toHaveAttribute('aria-labelledby');
        expect($(`.${prefix}-close`)).toBeNull();
    });

    it('#footer 自定义按钮可点击，空 #footer 不输出 footer 区域', async () => {
        const onYes = vi.fn<() => void>();
        const view = await renderModal(
            { visible: true },
            {
                footer: () => (
                    <button type="button" onClick={onYes}>
                        Yes
                    </button>
                ),
            }
        );
        await userEvent.click(screen.getByRole('button', { name: 'Yes' }));
        expect(onYes).toHaveBeenCalledTimes(1);
        expect(footerButtons()).toHaveLength(0);
        view.unmount();
        await renderModal({ visible: true }, { footer: () => [] });
        expect($(`.${prefix}-footer`)).toBeNull();
    });

    it('#icon 落在标题前，#closeIcon 落在关闭按钮内', async () => {
        await renderModal({ visible: true, title: 'T' }, { icon: () => <i class="my-icon" />, closeIcon: () => <i class="my-close" /> });
        expect($(`.${prefix}-header > .${prefix}-icon-wrapper .my-icon`)).not.toBeNull();
        expect($(`.${prefix}-close .my-close`)).not.toBeNull();
    });

    it('#modal 包住对话框后，对话框仍获得焦点、Esc 仍关闭、aria-* 仍在对话框上', async () => {
        const onCancel = vi.fn<NonNullable<ModalProps['onCancel']>>();
        await renderModal({ visible: true, title: 'Wrapped', onCancel, 'aria-describedby': 'desc' }, { modal: ({ modal }: { modal: VNode }) => <div class="drag">{modal}</div> });
        const dialog = screen.getByRole('dialog', { name: 'Wrapped' });
        expect(dialog.parentElement).toHaveClass('drag');
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
        expect(dialog).toHaveAttribute('aria-describedby', 'desc');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        await pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('attrs 落点：class 与 onClick 在外层，style 在 .semi-modal，aria-* 在对话框，data-* 在外层', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        await renderModal({
            visible: true,
            title: 'T',
            class: 'outer',
            style: { color: 'red' },
            onClick,
            'aria-label': 'Named',
            'data-x': '1',
        });
        const root = $('.semi-portal')?.firstElementChild as HTMLElement;
        expect(root).toHaveClass('outer');
        expect(root).toHaveAttribute('data-x', '1');
        expect(root.getAttribute('style')).toBeNull();
        expect($(`.${prefix}`)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Named');
        await userEvent.click($(`.${prefix}-body`) as HTMLElement);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('按钮属性里的 onClick 先于内置处理调用，二者都执行；autoFocus 不落到 DOM', async () => {
        const order: string[] = [];
        await renderModal({
            visible: true,
            okButtonProps: { autoFocus: true, onClick: () => order.push('own ok') },
            cancelButtonProps: { onClick: () => order.push('own cancel') },
            onOk: () => {
                order.push('onOk');
            },
            onCancel: () => {
                order.push('onCancel');
            },
        });
        expect(document.querySelector('[autofocus]')).toBeNull();
        await userEvent.click(footerButtons()[1]);
        await userEvent.click(footerButtons()[0]);
        expect(order).toEqual(['own ok', 'onOk', 'own cancel', 'onCancel']);
    });

    it('okButtonProps.autoFocus 时打开聚焦确定按钮；cancelButtonProps.autoFocus 为 false 时聚焦第一个可聚焦元素', async () => {
        const view = await renderModal({ visible: true, okButtonProps: { autoFocus: true } });
        expect(document.activeElement).toBe(footerButtons()[1]);
        view.unmount();
        await renderModal({ visible: true, title: 'T', cancelButtonProps: { autoFocus: false } });
        expect(document.activeElement).toBe($(`.${prefix}-close`));
    });

    it('正文中带 autofocus 的元素优先于默认的取消按钮，每次打开结果相同', async () => {
        const { rerender } = await renderModal({ visible: true, keepDOM: true, title: 'T' }, { default: () => <input autofocus aria-label="name" /> });
        const input = screen.getByRole('textbox', { name: 'name' });
        expect(document.activeElement).toBe(input);
        await rerender({ visible: false, keepDOM: true });
        await rerender({ visible: true, keepDOM: true });
        expect(document.activeElement).toBe(input);
    });

    it('keepDOM 关闭再打开后，正文中 autofocus 的 Input 仍持焦', async () => {
        const trigger = document.body.appendChild(document.createElement('button'));
        trigger.focus();
        const { rerender } = await renderModal({ visible: true, keepDOM: true, title: 'T' }, { default: () => <Input autofocus aria-label="name" /> });
        const textbox = screen.getByRole('textbox', { name: 'name' });
        expect(document.activeElement).toBe(textbox);
        await rerender({ visible: false, keepDOM: true });
        expect(document.activeElement).toBe(trigger);
        await rerender({ visible: true, keepDOM: true });
        expect(document.activeElement).toBe(textbox);
        trigger.remove();
    });

    it('mask 为 false 时焦点移入对话框；关闭时焦点已移到页面其他位置则不拉回', async () => {
        const trigger = document.body.appendChild(document.createElement('button'));
        const elsewhere = document.body.appendChild(document.createElement('button'));
        trigger.focus();
        const { rerender } = await renderModal({ visible: true, mask: false, title: 'T' });
        expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
        elsewhere.focus();
        await rerender({ visible: false, mask: false });
        expect(document.activeElement).toBe(elsewhere);
        trigger.focus();
        await rerender({ visible: true, mask: false });
        await rerender({ visible: false, mask: false });
        expect(document.activeElement).toBe(trigger);
        trigger.remove();
        elsewhere.remove();
    });

    it('ConfigProvider 的 getPopupContainer 指向自定义容器：加 -popup 类、外层 static、不锁 body、页面不 inert', async () => {
        const page = document.body.appendChild(document.createElement('main'));
        render(ConfigContainer);
        await nextTick();
        const container = $('.config-container') as HTMLElement;
        expect(container.querySelector(`.${prefix}`)).not.toBeNull();
        expect(container.querySelector(`.${prefix}-popup`)).not.toBeNull();
        expect($('.semi-portal')?.style.position).toBe('static');
        expect(document.body.style.overflow).toBe('');
        expect(page.inert).toBeFalsy();
        page.remove();
    });

    it('getPopupContainer 返回 null 时报错', () => {
        // a deliberately invalid container: the type says it returns an element
        const getPopupContainer = () => null as unknown as HTMLElement;
        expect(() => render(Modal, { props: { visible: true, motion: false, getPopupContainer } })).toThrow('getPopupContainer returned no element');
    });

    it('KeepAlive 失活时释放页面 inert 与 body 锁且不发事件，激活后重新获取', async () => {
        const page = document.body.appendChild(document.createElement('main'));
        const onAfterClose = vi.fn<() => void>();
        const onUpdate = vi.fn<(visible: boolean) => void>();
        const Cached = defineComponent({
            name: 'Cached',
            setup: () => () => <Modal visible motion={false} title="Cached" onAfterClose={onAfterClose} onUpdate:visible={onUpdate} />,
        });
        const shown = shallowRef(true);
        render(() => (
            <KeepAlive>
                {{
                    default: () => [shown.value ? <Cached /> : <p>other</p>],
                }}
            </KeepAlive>
        ));
        await nextTick();
        expect(page.inert).toBe(true);
        expect(document.body.style.overflow).toBe('hidden');
        shown.value = false;
        await nextTick();
        await nextTick();
        expect(page.inert).toBe(false);
        expect(document.body.style.overflow).toBe('');
        expect(screen.queryByRole('dialog')).toBeNull();
        shown.value = true;
        await nextTick();
        await nextTick();
        expect(page.inert).toBe(true);
        expect(document.body.style.overflow).toBe('hidden');
        expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
        expect(onAfterClose).not.toHaveBeenCalled();
        expect(onUpdate).not.toHaveBeenCalled();
        page.remove();
    });

    it('Boolean prop 有 default，Function prop 的 default 为 undefined', () => {
        const violations: string[] = [];
        const functionProps: string[] = [];
        for (const component of [Modal, ConfirmModal]) {
            const options = (component as { props?: Record<string, { type?: unknown; default?: unknown }> }).props;
            for (const [name, option] of Object.entries(options ?? {})) {
                const types = [option.type].flat();
                if (types.includes(Function)) functionProps.push(name);
                if (types.includes(Boolean) && !Object.hasOwn(option, 'default')) violations.push(name);
                if (types.includes(Function) && option.default !== undefined) violations.push(name);
            }
        }
        expect(violations).toEqual([]);
        expect(functionProps).toEqual(expect.arrayContaining(['getPopupContainer', 'onOk', 'onCancel', 'content']));
    });
});
