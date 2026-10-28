import type React from 'react';
import { Activity, Component, Profiler, StrictMode, createRef, useEffect } from 'react';
import { render, screen, fireEvent, waitFor, act, createEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { IconEyeClosed } from '@fibrae/semi-icons-react';
import { ConfigProvider, Input, LocaleProvider, Modal } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { ModalReactProps } from '../modal';

function getModal(modalProps?, children?) {
    let props = modalProps ? modalProps : {};
    return (
        <Modal motion={false} {...props}>
            {children ? children : <p>This is content of basic modal</p>}
        </Modal>
    );
}

function renderModal(modalProps?, children?) {
    const result = render(getModal(modalProps, children));
    return { ...result, rerender: (nextProps) => result.rerender(getModal(nextProps, children)) };
}

const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
const getButtons = () => document.querySelectorAll(`.${BASE_CLASS_PREFIX}-button`);

describe('modal', () => {
    beforeEach(() => {
        vi.useRealTimers();
    });

    it('默认标题是 2 级标题，外观仍是 h5', () => {
        renderModal({ visible: true, title: 'Dialog title' });
        expect(screen.getByRole('heading', { level: 2, name: 'Dialog title' })).toHaveClass(`${BASE_CLASS_PREFIX}-typography-h5`);
    });

    it('footer 为 0 时照常渲染，null 时不渲染', () => {
        const { rerender } = renderModal({ visible: true, footer: 0 });
        expect($(`.${BASE_CLASS_PREFIX}-modal-footer`)).toHaveTextContent(/^0$/);
        rerender({ visible: true, footer: null });
        expect($(`.${BASE_CLASS_PREFIX}-modal-footer`)).toBeNull();
    });

    it('离场动画期间的点击不再触发 onCancel', async () => {
        const onCancel = vi.fn<NonNullable<ModalReactProps['onCancel']>>();
        const modal = (visible: boolean) => <Modal title="title" motion visible={visible} onCancel={onCancel} />;
        const { rerender } = render(modal(true));
        fireEvent.click(screen.getByRole('button', { name: '关闭' }));
        expect(onCancel).toHaveBeenCalledTimes(1);

        // jsdom fires no animationend, so the dialog stays mounted while leaving
        rerender(modal(false));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        // past the 100ms debounce of onCancel, which would otherwise let the second click through
        await new Promise((resolve) => setTimeout(resolve, 150));
        fireEvent.click(screen.getByRole('button', { name: '关闭' }));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('className / style / maskStyle / bodyStyle / zIndex', () => {
        renderModal({
            className: 'test',
            style: { color: 'red' },
            visible: true,
            maskStyle: { color: 'grey' },
            bodyStyle: { color: 'pink' },
            zIndex: 500,
        });
        expect($('div.test')).not.toBeNull();
        expect($(`.${BASE_CLASS_PREFIX}-modal`)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect($(`.${BASE_CLASS_PREFIX}-modal-body`)).toHaveStyle({ color: 'rgb(255, 192, 203)' });
        expect($(`.${BASE_CLASS_PREFIX}-modal-mask`)).toHaveStyle({ color: 'rgb(128, 128, 128)' });
        expect($(`.${BASE_CLASS_PREFIX}-portal`).style.zIndex).toEqual('500');
    });

    it('visible 属性', async () => {
        const { rerender } = renderModal();
        expect($(`div.${BASE_CLASS_PREFIX}-modal`)).toBeNull();
        rerender({ visible: true });
        expect($(`div.${BASE_CLASS_PREFIX}-modal`)).not.toBeNull();
        expect(document.body.style.overflow).toEqual('hidden');
        rerender({ visible: false });
        expect(document.body.style.overflow).not.toEqual('hidden');
        await waitFor(() => expect($(`div.${BASE_CLASS_PREFIX}-modal`)).toBeNull());
    });

    it('渲染基础内容', () => {
        renderModal({ title: 'SemiTitle', visible: true });
        expect($(`.${BASE_CLASS_PREFIX}-modal-title`).textContent).toEqual('SemiTitle');
        expect($(`.${BASE_CLASS_PREFIX}-modal-body`).textContent).toEqual('This is content of basic modal');
    });

    it('footer 与 header', () => {
        const { rerender } = renderModal({
            header: <p>This is a header</p>,
            footer: <p>This is a footer</p>,
            visible: true,
        });
        expect($(`.${BASE_CLASS_PREFIX}-modal-content`).children[0].outerHTML).toEqual('<p>This is a header</p>');
        expect($(`.${BASE_CLASS_PREFIX}-modal-footer`)).toContainElement(screen.getByText('This is a footer'));
        rerender({ header: null, footer: null, visible: true });
        let content = $(`.${BASE_CLASS_PREFIX}-modal-content`).children;
        expect(content).toHaveLength(1);
        expect(content[0].textContent).toEqual('This is content of basic modal');
    });

    it('header、footer 为 undefined 时与未传相同，渲染标题与默认按钮', () => {
        renderModal({ title: 'Title', header: undefined, footer: undefined, visible: true });
        expect(screen.getByRole('dialog')).toHaveAccessibleName('Title');
        expect(getButtons()).toHaveLength(3);
    });

    it('height 与 width', () => {
        renderModal({ width: '413px', height: '613px', visible: true });
        let dom = $(`.${BASE_CLASS_PREFIX}-modal`);
        expect(window.getComputedStyle(dom).width).toEqual('413px');
        expect(window.getComputedStyle(dom).height).toEqual('613px');
    });

    it('size 属性', () => {
        const { rerender } = renderModal({ size: 'small', visible: true });

        expect($(`.${BASE_CLASS_PREFIX}-modal-small`)).not.toBeNull();
        rerender({ size: 'medium', visible: true });
        expect($(`.${BASE_CLASS_PREFIX}-modal-medium`)).not.toBeNull();
        rerender({ size: 'large', visible: true });
        expect($(`.${BASE_CLASS_PREFIX}-modal-large`)).not.toBeNull();
        rerender({ size: 'full-width', visible: true });
        expect($(`.${BASE_CLASS_PREFIX}-modal-full-width`)).not.toBeNull();
    });

    it('closable 属性', () => {
        const { unmount } = renderModal({ closable: true, visible: true });
        expect($(`.${BASE_CLASS_PREFIX}-modal-close`)).not.toBeNull();
        unmount();

        renderModal({ closable: false, visible: true });
        expect($(`.${BASE_CLASS_PREFIX}-modal-close`)).toBeNull();
    });

    it('getPopupContainer', () => {
        render(
            <div
                className="modal-container"
                style={{
                    height: 320,
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                <Modal getPopupContainer={() => document.querySelector('.modal-container')} visible />
            </div>
        );
        const modals = document.querySelectorAll<HTMLElement>(`div.${BASE_CLASS_PREFIX}-modal`);
        expect(modals).toHaveLength(1);
        expect($('.modal-container')).toContainElement(modals[0]);
    });

    it('maskClosable', async () => {
        let spyOnCancel = vi.fn<() => void>();
        let spyOnCancel2 = vi.fn<() => void>();
        const { unmount } = renderModal({
            maskClosable: true,
            visible: true,
            onCancel: spyOnCancel,
        });
        await userEvent.click($(`.${BASE_CLASS_PREFIX}-modal-wrap`));
        expect(spyOnCancel).toHaveBeenCalledTimes(1);
        unmount();

        renderModal({
            maskClosable: false,
            visible: true,
            onCancel: spyOnCancel2,
        });
        await userEvent.click($(`.${BASE_CLASS_PREFIX}-modal-wrap`));
        expect(spyOnCancel2).not.toHaveBeenCalled();
    });

    it('按钮相关属性：cancelText / okText / okButtonProps / cancelButtonProps / hasCancel / confirmLoading', () => {
        const baseProps = {
            cancelText: 'cancel',
            okText: 'ok',
            okType: 'secondary',
            visible: true,
            // remove close btn to avoid selected by selector
            closable: false,
        };
        const { rerender } = renderModal(baseProps);

        let footerBtn = getButtons();
        expect(footerBtn[0]).toHaveTextContent(/^cancel$/);
        expect(footerBtn[1]).toHaveTextContent(/^ok$/);
        expect(footerBtn[1]).toHaveClass(`${BASE_CLASS_PREFIX}-button-secondary`);
        const buttonProps = {
            okButtonProps: { size: 'small', type: 'warning' },
            cancelButtonProps: { size: 'small', disabled: true },
        };
        rerender({ ...baseProps, ...buttonProps });
        footerBtn = getButtons();
        expect(footerBtn[0]).toHaveClass(`${BASE_CLASS_PREFIX}-button-disabled`, `${BASE_CLASS_PREFIX}-button-size-small`);
        expect(footerBtn[1]).toHaveClass(`${BASE_CLASS_PREFIX}-button-warning`, `${BASE_CLASS_PREFIX}-button-size-small`);
        rerender({ ...baseProps, ...buttonProps, hasCancel: false, confirmLoading: true });
        footerBtn = getButtons();
        expect(footerBtn).toHaveLength(1);
        expect(footerBtn[0]).toHaveClass(`${BASE_CLASS_PREFIX}-button-loading`);
    });

    it('onCancel / onOk', async () => {
        let spyOnCancel = vi.fn<() => void>();
        let spyOnOk = vi.fn<() => void>();
        renderModal({
            visible: true,
            onCancel: spyOnCancel,
            onOk: spyOnOk,
        });
        let btn = getButtons();
        await userEvent.click($(`button.${BASE_CLASS_PREFIX}-modal-close`));
        await userEvent.click(btn[1]);
        await userEvent.click(btn[2]);
        expect(spyOnCancel).toHaveBeenCalledTimes(2);
        expect(spyOnOk).toHaveBeenCalledTimes(1);
    });

    it('无遮罩', () => {
        renderModal({
            mask: false,
            visible: true,
        });
        expect($(`div.${BASE_CLASS_PREFIX}-modal`)).not.toBeNull();
        expect($(`.${BASE_CLASS_PREFIX}-modal-mask`)).toBeNull();
    });

    it('closeIcon', () => {
        renderModal({
            visible: true,
            closeIcon: <IconEyeClosed />,
        });
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-eye_closed`)).toHaveLength(1);
    });

    it('motion 为 false', () => {
        const { rerender } = renderModal({ visible: true, motion: false });
        expect($(`div.${BASE_CLASS_PREFIX}-modal`).style.transform).toBe('');
        rerender({ visible: false, motion: false });
        expect($(`div.${BASE_CLASS_PREFIX}-modal`)).toBeNull();
    });

    it('centered 属性', async () => {
        renderModal({ centered: true, visible: true, motion: true });
        await waitFor(() => expect($(`div.${BASE_CLASS_PREFIX}-modal-content`)).toHaveClass(`semi-modal-content-animate-show`));
    });

    it('无动效时的 centered', () => {
        renderModal({ centered: true, visible: true, motion: false });
        expect($(`div.${BASE_CLASS_PREFIX}-modal-wrap`)).toHaveClass(`${BASE_CLASS_PREFIX}-modal-wrap-center`);
    });

    it('keepDOM', () => {
        const { rerender } = renderModal({ keepDOM: true });
        expect($(`div.${BASE_CLASS_PREFIX}-modal`)).toBeNull();
        rerender({ keepDOM: true, visible: true });
        expect($(`div.${BASE_CLASS_PREFIX}-modal`)).not.toBeNull();
        expect($(`.${BASE_CLASS_PREFIX}-modal-displayNone`)).toBeNull();
        expect(document.body.style.overflow).toEqual('hidden');
        rerender({ keepDOM: true, visible: false });
        expect($(`.${BASE_CLASS_PREFIX}-modal-displayNone`)).not.toBeNull();
        expect($(`div.${BASE_CLASS_PREFIX}-modal`)).not.toBeNull();
    });

    it('keepDOM 与 lazyRender=false', () => {
        const { rerender } = renderModal({ keepDOM: true, lazyRender: false });
        expect($(`div.${BASE_CLASS_PREFIX}-modal`)).not.toBeNull();
        expect($(`.${BASE_CLASS_PREFIX}-modal-displayNone`)).not.toBeNull();
        rerender({ keepDOM: true, lazyRender: false, visible: true });
        expect($(`div.${BASE_CLASS_PREFIX}-modal`)).not.toBeNull();
        expect($(`.${BASE_CLASS_PREFIX}-modal-displayNone`)).toBeNull();
        expect(document.body.style.overflow).toEqual('hidden');
        rerender({ keepDOM: true, lazyRender: false, visible: false });
        expect($(`.${BASE_CLASS_PREFIX}-modal-displayNone`)).not.toBeNull();
        expect($(`div.${BASE_CLASS_PREFIX}-modal`)).not.toBeNull();
    });

    it('渲染 modal', () => {
        const testClass = 'modal-render-test';
        renderModal({
            visible: true,
            modalRender: (modal) => <div className={testClass}>{modal}</div>,
        });
        expect($(`div.${testClass}`)).not.toBeNull();
        expect($(`div.${testClass} .${BASE_CLASS_PREFIX}-modal-body`)).not.toBeNull();
    });

    it('多个 modal 打开时，Esc 只关闭最上层的 modal', () => {
        const onCancelOuter = vi.fn<(e: unknown) => void>();
        const onCancelInner = vi.fn<(e: unknown) => void>();
        class StackedModals extends Component {
            override state = {
                outerVisible: true,
                innerVisible: true,
            };

            handleOuterCancel = (e) => {
                onCancelOuter(e);
                this.setState({ outerVisible: false });
            };

            handleInnerCancel = (e) => {
                onCancelInner(e);
                this.setState({ innerVisible: false });
            };

            override render() {
                return (
                    <>
                        {getModal({ visible: this.state.outerVisible, onCancel: this.handleOuterCancel })}
                        {getModal({ visible: this.state.innerVisible, onCancel: this.handleInnerCancel })}
                    </>
                );
            }
        }

        render(<StackedModals />);

        fireEvent.keyDown(document, { key: 'Escape' });

        expect(onCancelInner).toHaveBeenCalledTimes(1);
        expect(onCancelOuter).toHaveBeenCalledTimes(0);
        expect(document.querySelectorAll(`div.${BASE_CLASS_PREFIX}-modal`)).toHaveLength(1);

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onCancelOuter).toHaveBeenCalledTimes(1);
        expect(document.querySelectorAll(`div.${BASE_CLASS_PREFIX}-modal`)).toHaveLength(0);
    });

    it('每个打开的 modal 都用自己的标题进行标注', () => {
        render(
            <>
                {getModal({ visible: true, title: 'First' }, <p>first body</p>)}
                {getModal({ visible: true, title: 'Second' }, <p>second body</p>)}
            </>
        );
        const dialogs = screen.getAllByRole('dialog');
        expect(dialogs).toHaveLength(2);
        const [first, second] = dialogs;
        expect(first).toHaveAccessibleName('First');
        expect(second).toHaveAccessibleName('Second');
    });

    // a dangling aria-labelledby points at nothing; without a title element there is nothing to reference
    it('缺少标题元素时不设置标注', () => {
        render(
            <>
                {getModal({ visible: true })}
                {getModal({ visible: true, title: 'Ignored', header: <div>custom header</div> })}
            </>
        );
        for (const dialog of screen.getAllByRole('dialog')) {
            expect(dialog).not.toHaveAttribute('aria-labelledby');
        }
    });
});

// jsdom has no AnimationEvent, so React listens for the prefixed name
const animationEnd = (node) => fireEvent(node, new Event('webkitAnimationEnd', { bubbles: true }));
const ESC = { key: 'Escape' };
const pressEsc = () => fireEvent.keyDown(document, ESC);
const footerButtons = () => document.querySelectorAll(`.${BASE_CLASS_PREFIX}-modal-footer .${BASE_CLASS_PREFIX}-button`);
const loadingCls = `${BASE_CLASS_PREFIX}-button-loading`;

function deferred() {
    let resolve;
    const promise = new Promise((res) => {
        resolve = res;
    });
    return { promise, resolve };
}

describe('modal 行为', () => {
    afterEach(() => {
        document.body.style.overflow = '';
        document.body.style.paddingInlineEnd = '';
    });

    it('Esc 关闭时 onCancel 收到原生 KeyboardEvent，类型声明与之一致', () => {
        const onCancel = vi.fn<NonNullable<ModalReactProps['onCancel']>>();
        renderModal({ visible: true, onCancel });
        pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(1);
        const event = onCancel.mock.calls[0][0];
        expect(event).toBeInstanceOf(KeyboardEvent);
        expect('nativeEvent' in event).toBe(false);
        expectTypeOf<Parameters<NonNullable<ModalReactProps['onCancel']>>[0]>().toEqualTypeOf<React.MouseEvent | KeyboardEvent>();
        expectTypeOf<ModalReactProps['direction']>().toEqualTypeOf<'ltr' | 'rtl' | undefined>();
    });

    it('afterClose 每次关闭只触发一次，挂载时与隐藏期间不触发', () => {
        const afterClose = vi.fn<() => void>();
        const { rerender, unmount } = renderModal({ afterClose });
        rerender({ afterClose, visible: true });
        expect(afterClose).not.toHaveBeenCalled();
        rerender({ afterClose, visible: false });
        expect(afterClose).toHaveBeenCalledTimes(1);
        rerender({ afterClose, visible: true });
        rerender({ afterClose, visible: false });
        expect(afterClose).toHaveBeenCalledTimes(2);
        unmount();
        expect(afterClose).toHaveBeenCalledTimes(2);
    });

    it('有动效时，隐藏会等待离开动画结束后再卸载并调用 afterClose', () => {
        const afterClose = vi.fn<() => void>();
        const { rerender } = renderModal({ afterClose, visible: true, motion: true });
        rerender({ afterClose, visible: false, motion: true });
        expect($(`.${BASE_CLASS_PREFIX}-modal-content`)).toHaveClass(`${BASE_CLASS_PREFIX}-modal-content-animate-hide`);
        expect(document.body.style.overflow).toBe('hidden');
        expect(afterClose).not.toHaveBeenCalled();
        animationEnd($(`.${BASE_CLASS_PREFIX}-modal-content`));
        expect($(`.${BASE_CLASS_PREFIX}-modal`)).toBeNull();
        expect(document.body.style.overflow).toBe('');
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('对话框内冒泡的 animationend 不会结束离开动画', () => {
        const afterClose = vi.fn<() => void>();
        const { rerender } = renderModal({ afterClose, visible: true, motion: true }, <span data-testid="inner">content</span>);
        rerender({ afterClose, visible: false, motion: true });
        // e.g. a Tooltip or Tabs pane inside the dialog finishing its own animation
        animationEnd(screen.getByTestId('inner'));
        expect($(`.${BASE_CLASS_PREFIX}-modal`)).not.toBeNull();
        expect(afterClose).not.toHaveBeenCalled();
        animationEnd($(`.${BASE_CLASS_PREFIX}-modal-content`));
        expect($(`.${BASE_CLASS_PREFIX}-modal`)).toBeNull();
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('onOk / onCancel 返回 Promise 时，按钮保持 loading 直至完成', async () => {
        const ok = deferred();
        const cancel = deferred();
        renderModal({ visible: true, onOk: () => ok.promise, onCancel: () => cancel.promise });
        await userEvent.click(footerButtons()[1]);
        expect(footerButtons()[1]).toHaveClass(loadingCls);
        expect(footerButtons()[0]).not.toHaveClass(loadingCls);
        await act(async () => {
            ok.resolve();
            await ok.promise;
        });
        expect(footerButtons()[1]).not.toHaveClass(loadingCls);

        await userEvent.click(footerButtons()[0]);
        expect(footerButtons()[0]).toHaveClass(loadingCls);
        await act(async () => {
            cancel.resolve();
            await cancel.promise;
        });
        expect(footerButtons()[0]).not.toHaveClass(loadingCls);
    });

    it('在对话框内按下、在遮罩上松开的操作不会关闭 modal', async () => {
        const onCancel = vi.fn<() => void>();
        renderModal({ visible: true, onCancel });
        const wrap = $(`.${BASE_CLASS_PREFIX}-modal-wrap`);
        fireEvent.mouseDown($(`.${BASE_CLASS_PREFIX}-modal`));
        fireEvent.mouseUp(wrap);
        fireEvent.click(wrap);
        expect(onCancel).not.toHaveBeenCalled();
        await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
        fireEvent.click(wrap);
        expect(onCancel).toHaveBeenCalledTimes(1);
        fireEvent.click($(`.${BASE_CLASS_PREFIX}-modal-body`));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('closeOnEsc', () => {
        const onCancel = vi.fn<() => void>();
        const { rerender } = renderModal({ visible: true, onCancel });
        pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(1);
        rerender({ visible: true, onCancel, closeOnEsc: false });
        pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('closeOnEsc 为 false 时从不通过 Esc 关闭', () => {
        const onCancel = vi.fn<() => void>();
        renderModal({ visible: true, onCancel, closeOnEsc: false });
        pressEsc();
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('closeOnEsc 为 false 时，最上层 modal 上的 Escape 不会传到下层 modal', () => {
        const onLowerCancel = vi.fn<() => void>();
        render(
            <>
                {getModal({ visible: true, onCancel: onLowerCancel, title: 'Lower' })}
                {getModal({ visible: true, closeOnEsc: false, title: 'Upper' })}
            </>
        );
        pressEsc();
        expect(onLowerCancel).not.toHaveBeenCalled();
    });

    it('modal 使其后的页面变为 inert，关闭时释放', () => {
        const page = document.body.appendChild(document.createElement('main'));
        const { rerender } = renderModal({ visible: true, title: 'Dialog' });
        expect(page.inert).toBe(true);
        rerender({ visible: false, title: 'Dialog' });
        expect(page.inert).toBe(false);
        page.remove();
    });

    it('仅当对话框阻挡整个页面时才设置 aria-modal', () => {
        const container = document.body.appendChild(document.createElement('div'));
        const dialogOf = (props) => {
            const view = renderModal({ visible: true, title: 'Dialog', ...props });
            const dialog = screen.getByRole('dialog');
            return { dialog, view };
        };
        const cases: [object, string | null][] = [
            [{}, 'true'],
            [{ mask: false }, null],
            [{ getPopupContainer: () => container }, null],
            [{ getPopupContainer: () => container, maskFixed: true }, 'true'],
            [{ mask: false, 'aria-modal': 'true' }, 'true'],
        ];
        for (const [props, expected] of cases) {
            const { dialog, view } = dialogOf(props);
            expect(dialog.getAttribute('aria-modal')).toBe(expected);
            view.unmount();
        }
        container.remove();
    });

    it('叠加的 modal 在最后一个关闭前保持 body 锁定，之后恢复', () => {
        const pair = (a, b) => (
            <>
                {getModal({ visible: a })}
                {getModal({ visible: b })}
            </>
        );
        const { rerender } = render(pair(true, false));
        expect(document.body.style.overflow).toBe('hidden');
        rerender(pair(true, true));
        expect(document.body.style.overflow).toBe('hidden');
        rerender(pair(true, false));
        expect(document.body.style.overflow).toBe('hidden');
        rerender(pair(false, false));
        expect(document.body.style.overflow).toBe('');
        expect(document.body.style.paddingInlineEnd).toBe('');
    });

    it('保留页面已设置的 overflow，在自定义容器中不锁定', () => {
        document.body.style.overflow = 'hidden';
        const { rerender, unmount } = renderModal({ visible: true });
        rerender({ visible: false });
        expect(document.body.style.overflow).toBe('hidden');
        unmount();
        document.body.style.overflow = '';

        const container = document.createElement('div');
        document.body.appendChild(container);
        const custom = renderModal({ visible: true, getPopupContainer: () => container });
        expect(document.body.style.overflow).toBe('');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-modal`)).not.toBeNull();
        expect($(`.${BASE_CLASS_PREFIX}-portal`).style.position).toBe('static');
        custom.unmount();
        container.remove();
    });

    it('打开时焦点移入对话框，关闭时回到之前的元素', () => {
        const trigger = document.createElement('button');
        document.body.appendChild(trigger);
        trigger.focus();
        const { rerender } = renderModal({ visible: true });
        expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
        expect(document.activeElement).toBe(footerButtons()[0]);
        rerender({ visible: false });
        expect(document.activeElement).toBe(trigger);
        trigger.remove();
    });

    it('没有 footer 时聚焦第一个可聚焦元素', () => {
        renderModal({ visible: true, title: 'T', footer: null });
        expect(document.activeElement).toBe($(`.${BASE_CLASS_PREFIX}-modal-close`));
    });

    it('closable={false} 且 footer={null} 没有可聚焦元素时，焦点落在 role=dialog 上', () => {
        renderModal({ visible: true, closable: false, footer: null, title: 'T' });
        const dialog = screen.getByRole('dialog');
        expect(dialog.querySelector('button')).toBeNull();
        expect(document.activeElement).toBe(dialog);
    });

    it('footerFill 时取消按钮用逻辑属性抵消起始间距', () => {
        renderModal({ visible: true, footerFill: true });
        const style = footerButtons()[0].getAttribute('style') ?? '';
        expect(style).toContain('margin-inline-start: unset');
        expect(style).not.toContain('margin-left');
    });

    it('按下与松开对话框不触发 ModalContent 重渲染', () => {
        const onRender = vi.fn<() => void>();
        render(
            <Profiler id="modal" onRender={onRender}>
                {getModal({ visible: true })}
            </Profiler>
        );
        onRender.mockClear();
        fireEvent.mouseDown($(`.${BASE_CLASS_PREFIX}-modal`));
        fireEvent.mouseUp($(`.${BASE_CLASS_PREFIX}-modal-wrap`));
        expect(onRender).not.toHaveBeenCalled();
    });

    it('maskClosable 由 false 改为 true 后，首次点击遮罩即关闭', () => {
        const onCancel = vi.fn<() => void>();
        const { rerender } = renderModal({ visible: true, maskClosable: false, onCancel });
        fireEvent.mouseDown($(`.${BASE_CLASS_PREFIX}-modal`));
        fireEvent.mouseUp($(`.${BASE_CLASS_PREFIX}-modal`));
        rerender({ visible: true, maskClosable: true, onCancel });
        fireEvent.click($(`.${BASE_CLASS_PREFIX}-modal-wrap`));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('一次渲染中 ModalContent 不再重复调用 getPopupContainer', () => {
        const container = vi.fn<() => HTMLElement>(() => document.body);
        const { rerender } = renderModal({ visible: true, getPopupContainer: container });
        container.mockClear();
        rerender({ visible: true, getPopupContainer: container, title: 'next' });
        // Modal's own check plus Portal's two lookups; ModalContent used to add two more
        expect(container.mock.calls.length).toBeLessThanOrEqual(3);
    });

    it('Activity 隐藏显示中的 modal 视同关闭：调用一次 afterClose 并解除 body 锁定，重新显示后再次锁定', async () => {
        const afterClose = vi.fn<() => void>();
        const view = (mode: 'visible' | 'hidden') => <Activity mode={mode}>{getModal({ visible: true, afterClose })}</Activity>;
        const { rerender } = render(view('visible'));
        expect(document.body.style.overflow).toBe('hidden');
        rerender(view('hidden'));
        await act(async () => {});
        expect(afterClose).toHaveBeenCalledTimes(1);
        expect(document.body.style.overflow).toBe('');
        rerender(view('visible'));
        await act(async () => {});
        expect(document.body.style.overflow).toBe('hidden');
        rerender(view('hidden'));
        await act(async () => {});
        expect(afterClose).toHaveBeenCalledTimes(2);
        expect(document.body.style.overflow).toBe('');
    });

    it('footer 按钮显示语言包文案', () => {
        const { unmount } = renderModal({ visible: true, closable: false });
        expect([...footerButtons()].map((b) => b.textContent)).toEqual(['取消', '确定']);
        unmount();
        render(
            <LocaleProvider locale={en_US}>
                <Modal closable={false} motion={false} visible />
            </LocaleProvider>
        );
        expect([...footerButtons()].map((b) => b.textContent)).toEqual(['Cancel', 'Confirm']);
    });

    it('关闭按钮名称跟随语言包', () => {
        const { unmount } = renderModal({ visible: true });
        expect($(`.${BASE_CLASS_PREFIX}-modal-close`)).toHaveAttribute('aria-label', '关闭');
        unmount();
        render(
            <LocaleProvider locale={en_US}>
                <Modal motion={false} visible />
            </LocaleProvider>
        );
        expect($(`.${BASE_CLASS_PREFIX}-modal-close`)).toHaveAttribute('aria-label', 'Close');
    });

    it('data-* 透传到 portal 中的外层元素，已声明的属性不落到 DOM', () => {
        renderModal({
            visible: true,
            className: 'outer',
            'data-testid': 'modal-root',
            content: 'content',
            footerFill: true,
            preventScroll: true,
            direction: 'ltr',
            okType: 'primary',
            maskFixed: false,
        });
        const root = screen.getByTestId('modal-root');
        expect(root).toHaveClass('outer');
        expect(root.parentElement).toHaveClass(`${BASE_CLASS_PREFIX}-portal`);
        expect(root).toContainElement($(`.${BASE_CLASS_PREFIX}-modal-mask`));
        expect(root).toContainElement($(`.${BASE_CLASS_PREFIX}-modal`));
        for (const name of ['content', 'footerfill', 'preventscroll', 'direction', 'oktype', 'maskfixed']) {
            expect(document.querySelector(`[${name}]`)).toBeNull();
        }
    });

    it('从 semiGlobal overrideDefaultProps.Modal 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Modal: { okText: 'Global OK', closable: false, motion: false } };
        try {
            render(<Modal title="T" visible />);
            expect($(`.${BASE_CLASS_PREFIX}-modal-close`)).toBeNull();
            expect(footerButtons()[1]).toHaveTextContent('Global OK');
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('StrictMode 下保持 body 锁定，单次 Esc 关闭，并恢复 body', () => {
        const onCancel = vi.fn<() => void>();
        const tree = (visible) => (
            <StrictMode>
                <Modal motion={false} visible={visible} onCancel={onCancel} />
            </StrictMode>
        );
        const { rerender } = render(tree(true));
        expect(document.body.style.overflow).toBe('hidden');
        pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(1);
        rerender(tree(false));
        expect(document.body.style.overflow).toBe('');
        expect($(`.${BASE_CLASS_PREFIX}-modal`)).toBeNull();
    });

    it('fullScreen 跟随属性', () => {
        const { rerender } = renderModal({ visible: true, fullScreen: true });
        expect($(`.${BASE_CLASS_PREFIX}-modal-content`)).toHaveClass(`${BASE_CLASS_PREFIX}-modal-content-fullScreen`);
        expect($(`.${BASE_CLASS_PREFIX}-modal`)).toHaveStyle({ width: '100%', height: '100%' });
        rerender({ visible: true, fullScreen: false });
        expect($(`.${BASE_CLASS_PREFIX}-modal-content`)).not.toHaveClass(`${BASE_CLASS_PREFIX}-modal-content-fullScreen`);
    });

    it('footerFill、modalContentClass、icon 与 getPopupContainer 的类名', () => {
        renderModal({ visible: true, footerFill: true, modalContentClass: 'mc', icon: <span>i</span> });
        expect($(`.${BASE_CLASS_PREFIX}-modal-footerfill`)).not.toBeNull();
        expect(footerButtons()[0]).toHaveClass(`${BASE_CLASS_PREFIX}-button-block`);
        expect($(`.${BASE_CLASS_PREFIX}-modal-content`)).toHaveClass('mc');
        expect($(`.${BASE_CLASS_PREFIX}-modal-icon-wrapper`)).toHaveTextContent('i');
    });
});

// Fixed in the function component; these fail on the class component
describe('modal 修复', () => {
    afterEach(() => {
        document.body.style.overflow = '';
        document.body.style.paddingInlineEnd = '';
    });

    it('footer 按钮以可见文本命名', () => {
        const { unmount } = renderModal({ visible: true, closable: false });
        expect(screen.getByRole('button', { name: '取消' })).toBe(footerButtons()[0]);
        expect(screen.getByRole('button', { name: '确定' })).toBe(footerButtons()[1]);
        unmount();
        renderModal({ visible: true, closable: false, okText: 'Go', cancelText: 'Back' });
        expect(screen.getByRole('button', { name: 'Back' })).toBe(footerButtons()[0]);
        expect(screen.getByRole('button', { name: 'Go' })).toBe(footerButtons()[1]);
    });

    it('隐藏的 keepDOM modal 忽略 Esc，并归还焦点', () => {
        const onCancel = vi.fn<() => void>();
        const trigger = document.createElement('button');
        document.body.appendChild(trigger);
        trigger.focus();
        const { rerender } = renderModal({ keepDOM: true, visible: true, onCancel });
        expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
        rerender({ keepDOM: true, visible: false, onCancel });
        expect(document.activeElement).toBe(trigger);
        pressEsc();
        expect(onCancel).not.toHaveBeenCalled();
        rerender({ keepDOM: true, visible: true, onCancel });
        expect($(`.${BASE_CLASS_PREFIX}-modal`)).toContainElement(document.activeElement as HTMLElement);
        pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(1);
        trigger.remove();
    });

    it('卸载隐藏的 modal 不影响其他 modal 的 body 锁定', () => {
        const pair = (a, b, showA = true) => (
            <>
                {showA && getModal({ visible: a })}
                {getModal({ visible: b })}
            </>
        );
        const { rerender } = render(pair(true, false));
        rerender(pair(false, false));
        expect(document.body.style.overflow).toBe('');
        rerender(pair(false, true));
        expect(document.body.style.overflow).toBe('hidden');
        rerender(pair(false, true, false));
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('离开动画期间重新打开，关闭后仍恢复 body', () => {
        const { rerender } = renderModal({ visible: true, motion: true });
        rerender({ visible: false, motion: true });
        rerender({ visible: true, motion: true });
        rerender({ visible: false, motion: true });
        animationEnd($(`.${BASE_CLASS_PREFIX}-modal-content`));
        expect($(`.${BASE_CLASS_PREFIX}-modal`)).toBeNull();
        expect(document.body.style.overflow).toBe('');
    });

    it('StrictMode 下打开时不调用 afterClose', () => {
        const afterClose = vi.fn<() => void>();
        const tree = (visible) => (
            <StrictMode>
                <Modal afterClose={afterClose} motion={false} visible={visible} />
            </StrictMode>
        );
        const { rerender } = render(tree(true));
        expect(afterClose).not.toHaveBeenCalled();
        rerender(tree(false));
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('StrictMode 下 useModal 保持打开，直至 destroy', () => {
        let modal;
        function Demo({ onApi }) {
            const [api, contextHolder] = Modal.useModal();
            useEffect(() => {
                onApi(api);
            });
            return contextHolder;
        }
        render(
            <StrictMode>
                <Demo onApi={(api) => (modal = api)} />
            </StrictMode>
        );
        let handle;
        act(() => {
            handle = modal.confirm({ title: 'Hook', content: 'Body', motion: false });
        });
        expect($(`.${BASE_CLASS_PREFIX}-modal-confirm`)).not.toBeNull();
        void act(() => handle.destroy());
        expect($(`.${BASE_CLASS_PREFIX}-modal-confirm`)).toBeNull();
    });

    it('ref 与其他未知属性透传到 portal 中的外层元素', () => {
        const ref = createRef();
        renderModal({ visible: true, ref, id: 'modal-root', 'data-foo': 'bar' });
        const root = document.getElementById('modal-root');
        expect(ref.current).toBe(root);
        expect(root).toHaveAttribute('data-foo', 'bar');
        expect(root.parentElement).toHaveClass(`${BASE_CLASS_PREFIX}-portal`);
        expect(root).toContainElement($(`.${BASE_CLASS_PREFIX}-modal`));
    });

    it('aria-label、aria-labelledby、aria-describedby 与 aria-modal 落在对话框上，data-* 落在外层元素上', () => {
        render(
            getModal(
                {
                    visible: true,
                    title: 'Title',
                    'aria-label': 'Custom label',
                    'aria-labelledby': 'outside-label',
                    'aria-describedby': 'outside-desc',
                    'aria-modal': 'false',
                    'data-foo': 'bar',
                },
                <p>body</p>
            )
        );
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-label', 'Custom label');
        expect(dialog).toHaveAttribute('aria-labelledby', 'outside-label');
        expect(dialog).toHaveAttribute('aria-describedby', 'outside-desc');
        expect(dialog).toHaveAttribute('aria-modal', 'false');
        expect(dialog).not.toHaveAttribute('data-foo');
        const root = $(`.${BASE_CLASS_PREFIX}-portal`).firstElementChild;
        expect(root).toHaveAttribute('data-foo', 'bar');
        for (const name of ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-modal']) {
            expect(root).not.toHaveAttribute(name);
        }
    });

    it('其余 aria-* 也落在对话框上，外层元素没有', () => {
        render(getModal({ visible: true, title: 'Title', 'aria-roledescription': 'sheet', 'aria-details': 'extra' }, <p>body</p>));
        const dialog = screen.getByRole('dialog');
        const root = $(`.${BASE_CLASS_PREFIX}-portal`).firstElementChild;
        for (const [name, value] of [
            ['aria-roledescription', 'sheet'],
            ['aria-details', 'extra'],
        ]) {
            expect(dialog).toHaveAttribute(name, value);
            expect(root).not.toHaveAttribute(name);
        }
    });

    it('调用方未传入时，保留生成的引用与 aria-modal', () => {
        render(getModal({ visible: true, title: 'Title' }, <p>body</p>));
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAccessibleName('Title');
    });

    it('aria-label 替换生成的标题引用', () => {
        render(getModal({ visible: true, title: 'Title', 'aria-label': 'Custom label' }));
        const dialog = screen.getByRole('dialog');
        expect(dialog).not.toHaveAttribute('aria-labelledby');
        expect(dialog).toHaveAccessibleName('Custom label');
    });

    // the unmount hook runs after StrictMode's simulated unmount, which must not report a close
    it('卸载已显示的 modal 时只调用一次 afterClose，隐藏或已关闭的不调用', async () => {
        const afterClose = vi.fn<() => void>();
        const shown = renderModal({ visible: true, afterClose });
        shown.unmount();
        await act(async () => {});
        expect(afterClose).toHaveBeenCalledTimes(1);

        const closed = renderModal({ visible: true, afterClose });
        closed.rerender({ visible: false, afterClose });
        expect(afterClose).toHaveBeenCalledTimes(2);
        closed.unmount();
        await act(async () => {});
        expect(afterClose).toHaveBeenCalledTimes(2);

        renderModal({ afterClose }).unmount();
        await act(async () => {});
        expect(afterClose).toHaveBeenCalledTimes(2);
    });

    it('离开动画期间卸载只调用一次 afterClose', async () => {
        const afterClose = vi.fn<() => void>();
        const { rerender, unmount } = renderModal({ visible: true, motion: true, afterClose });
        rerender({ visible: false, motion: true, afterClose });
        unmount();
        await act(async () => {});
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('StrictMode 下卸载已显示的 modal 只调用一次 afterClose', async () => {
        const afterClose = vi.fn<() => void>();
        const { unmount } = render(
            <StrictMode>
                <Modal afterClose={afterClose} motion={false} visible />
            </StrictMode>
        );
        await act(async () => {});
        expect(afterClose).not.toHaveBeenCalled();
        unmount();
        await act(async () => {});
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('onOk、onCancel、afterClose 传 null 时点击与关闭都不抛错', async () => {
        const nulls = { onOk: null, onCancel: null, afterClose: null } as unknown as ModalReactProps;
        const { rerender } = renderModal({ visible: true, ...nulls });
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await userEvent.click(screen.getByRole('button', { name: '取消' }));
        rerender({ visible: false, ...nulls });
        await act(async () => {});
        expect(screen.queryByRole('dialog')).toBeNull();
    });
});

describe('Modal 对话框名称警告', () => {
    let warn;
    const nameWarnings = () => warn.mock.calls.filter(([message]) => message.includes('[Semi Modal]'));
    beforeEach(() => {
        warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => warn.mockRestore());

    it('未命名打开时只警告一次', async () => {
        render(
            <Modal motion={false} visible>
                body
            </Modal>
        );
        await screen.findByRole('dialog');
        expect(nameWarnings()).toHaveLength(1);
    });

    it('有标题时不警告', async () => {
        render(
            <Modal title="Named" motion={false} visible>
                body
            </Modal>
        );
        expect(await screen.findByRole('dialog', { name: 'Named' })).toBeInTheDocument();
        expect(nameWarnings()).toHaveLength(0);
    });
});

describe('Modal 模态判断与初始焦点', () => {
    afterEach(() => {
        document.body.style.overflow = '';
    });

    it('ConfigProvider 的 getPopupContainer 与 Modal 自身的同样按实际容器判断', () => {
        const container = document.body.appendChild(document.createElement('div'));
        const page = document.body.appendChild(document.createElement('main'));
        render(<ConfigProvider getPopupContainer={() => container}>{getModal({ visible: true, title: 'Dialog' })}</ConfigProvider>);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-modal`)).not.toBeNull();
        expect(document.body.style.overflow).toBe('');
        expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal');
        expect(page.inert).toBeFalsy();
        expect($(`.${BASE_CLASS_PREFIX}-modal-popup`)).not.toBeNull();
        expect($(`.${BASE_CLASS_PREFIX}-portal`).style.position).toBe('static');
        page.remove();
        container.remove();
    });

    it('body 滚动锁与 aria-modal 用同一模态判断', () => {
        const container = document.body.appendChild(document.createElement('div'));
        const fixed = renderModal({ visible: true, title: 'T', getPopupContainer: () => container, maskFixed: true });
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
        expect(document.body.style.overflow).toBe('hidden');
        fixed.unmount();
        expect(document.body.style.overflow).toBe('');

        renderModal({ visible: true, title: 'T', mask: false });
        expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal');
        expect(document.body.style.overflow).toBe('');
        container.remove();
    });

    it('非模态时 Tab 不被锁在对话框内', () => {
        renderModal({ visible: true, title: 'T', mask: false });
        const [, ok] = footerButtons();
        (ok as HTMLElement).focus();
        const event = createEvent.keyDown(ok, { key: 'Tab' });
        fireEvent(ok, event);
        expect(event.defaultPrevented).toBe(false);
        expect(document.activeElement).toBe(ok);
    });

    // keepDOM keeps the dialog mounted, so the hiding commit runs the restore rather than unmounting the content
    it('非模态关闭时不夺回已移到页面其他位置的焦点', () => {
        const trigger = document.body.appendChild(document.createElement('button'));
        const other = document.body.appendChild(document.createElement('button'));
        trigger.focus();
        const props = { keepDOM: true, title: 'T', mask: false };
        const { rerender } = renderModal({ ...props, visible: true });
        expect(document.activeElement).toBe(footerButtons()[0]);
        other.focus();
        rerender({ ...props, visible: false });
        expect(document.activeElement).toBe(other);
        trigger.remove();
        other.remove();
    });

    it('keepDOM 重新显示时焦点仍落在取消按钮', () => {
        const trigger = document.body.appendChild(document.createElement('button'));
        trigger.focus();
        const { rerender } = renderModal({ keepDOM: true, visible: true, title: 'T' });
        expect(document.activeElement).toBe(footerButtons()[0]);
        rerender({ keepDOM: true, visible: false, title: 'T' });
        expect(document.activeElement).toBe(trigger);
        rerender({ keepDOM: true, visible: true, title: 'T' });
        expect(document.activeElement).toBe(footerButtons()[0]);
        trigger.remove();
    });

    it('okButtonProps.autoFocus 时每次打开都聚焦确定按钮', () => {
        const trigger = document.body.appendChild(document.createElement('button'));
        trigger.focus();
        const props = { keepDOM: true, title: 'T', okButtonProps: { autoFocus: true } };
        const { rerender } = renderModal({ ...props, visible: true });
        expect(document.activeElement).toBe(footerButtons()[1]);
        rerender({ ...props, visible: false });
        expect(document.activeElement).toBe(trigger);
        rerender({ ...props, visible: true });
        expect(document.activeElement).toBe(footerButtons()[1]);
        trigger.remove();
    });

    it('keepDOM 关闭再打开后，正文中 autoFocus 的元素仍持焦', () => {
        const trigger = document.body.appendChild(document.createElement('button'));
        trigger.focus();
        const props = { keepDOM: true, title: 'T' };
        const { rerender } = renderModal({ ...props, visible: true }, <Input aria-label="name" autoFocus />);
        const textbox = screen.getByRole('textbox', { name: 'name' });
        expect(document.activeElement).toBe(textbox);
        rerender({ ...props, visible: false });
        expect(document.activeElement).toBe(trigger);
        rerender({ ...props, visible: true });
        expect(document.activeElement).toBe(textbox);
        trigger.remove();
    });

    it('正文中 autoFocus 的元素优先于默认取消按钮', () => {
        renderModal({ visible: true, title: 'T' }, <Input aria-label="name" autoFocus />);
        expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'name' }));
    });

    it('组件版 Modal 默认不设置 aria-describedby', () => {
        render(getModal({ visible: true, title: 'Title' }, <p>body</p>));
        expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
    });

    it('cancelButtonProps、okButtonProps 的 onClick 先调用，再执行内置处理', async () => {
        const order: string[] = [];
        renderModal({
            visible: true,
            title: 'T',
            cancelButtonProps: { onClick: () => order.push('cancel click') },
            okButtonProps: { onClick: () => order.push('ok click') },
            onCancel: () => order.push('onCancel'),
            onOk: () => order.push('onOk'),
        });
        const [cancel, ok] = footerButtons();
        await userEvent.click(cancel);
        await userEvent.click(ok);
        expect(order).toEqual(['cancel click', 'onCancel', 'ok click', 'onOk']);
    });
});
