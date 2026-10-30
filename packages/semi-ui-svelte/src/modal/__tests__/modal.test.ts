import { flushSync, tick } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { ModalProps } from '../interface';
import ConfigFixture from './config-fixture.svelte';
import ContainerFixture from './container-fixture.svelte';
import ModalFixture from './modal-fixture.svelte';

type Store = NonNullable<Parameters<typeof ModalFixture>[1]>['store'];

const prefix = 'semi-modal';
const loadingCls = 'semi-button-loading';
const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
const getRoot = () => $('.semi-portal > div') as HTMLElement;
const getBox = () => $(`.${prefix}`) as HTMLElement;
const getDialog = () => $(`.${prefix}-content`) as HTMLElement;
const getMask = () => $(`.${prefix}-mask`) as HTMLElement;
const getWrap = () => $(`.${prefix}-wrap`) as HTMLElement;
const footerButtons = () => document.querySelectorAll<HTMLElement>(`.${prefix}-footer .semi-button`);
// fireEvent dispatches synchronously and returns a promise that only waits for Svelte's flush, which flushSync does here
function fire(dispatch: () => unknown) {
    void dispatch();
    flushSync();
}
const pressEsc = () => fire(() => fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' }));
const click = (element: Element) => fire(() => fireEvent.click(element));
const mouseDown = (element: Element) => fire(() => fireEvent.mouseDown(element));
const mouseUp = (element: Element) => fire(() => fireEvent.mouseUp(element));
const animationEnd = (node: Element) => node.dispatchEvent(new Event('animationend', { bubbles: true }));
// the setup stubs getAnimations() with [], which ends every run at once; a running animation keeps the dialog mounted
const holdAnimations = () => vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([{ animationName: 'running' } as unknown as Animation]);

function deferred() {
    let resolve!: () => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

function setup(props: ModalProps = {}, extra: Partial<Store> = {}) {
    const store = createStore<Store>({ props: { motion: false, ...props }, ...extra });
    const view = render(ModalFixture, { props: { store } });
    flushSync();
    return { store, view };
}

function update(store: Store, props: ModalProps) {
    Object.assign(store.props, props);
    flushSync();
}

beforeEach(() => {
    document.body.style.overflow = '';
    document.body.style.paddingInlineEnd = '';
});

afterEach(() => {
    vi.restoreAllMocks();
    semiGlobal.config.overrideDefaultProps = {};
    document.body.style.overflow = '';
    document.body.style.paddingInlineEnd = '';
    document.body.style.width = '';
});

describe('Svelte Modal', () => {
    it('visible 控制渲染，关闭后卸载', () => {
        const { store } = setup();
        expect(getBox()).toBeNull();
        update(store, { visible: true });
        expect(getBox()).not.toBeNull();
        update(store, { visible: false });
        expect(getBox()).toBeNull();
    });

    it('class 与 data-* 落在外层元素，aria-* 与 role 落在对话框上，style 落在 .semi-modal', () => {
        setup({ visible: true, class: 'mine', style: 'color: red', 'data-foo': 'bar', 'aria-label': 'Custom', 'aria-describedby': 'desc', role: 'alertdialog' });
        expect(getRoot()).toHaveClass('mine');
        expect(getRoot()).toHaveAttribute('data-foo', 'bar');
        expect(getRoot()).not.toHaveAttribute('aria-label');
        expect(getBox()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        const dialog = screen.getByRole('alertdialog', { name: 'Custom' });
        expect(dialog).toBe(getDialog());
        expect(dialog).toHaveAttribute('aria-describedby', 'desc');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).not.toHaveAttribute('data-foo');
    });

    it('maskStyle、bodyStyle、zIndex、modalContentClass', () => {
        setup({ visible: true, maskStyle: 'color: grey', bodyStyle: 'color: pink', zIndex: 500, modalContentClass: 'inner-class', title: 'T' });
        expect(getMask()).toHaveStyle({ color: 'rgb(128, 128, 128)' });
        expect($(`.${prefix}-body`)).toHaveStyle({ color: 'rgb(255, 192, 203)' });
        expect($('.semi-portal')?.style.zIndex).toBe('500');
        expect(getDialog()).toHaveClass('inner-class');
    });

    it('title 字符串与 snippet 都命名对话框，没有标题时不设 aria-labelledby', () => {
        const { store } = setup({ visible: true, title: 'SemiTitle' });
        expect($(`.${prefix}-title`)?.textContent?.trim()).toBe('SemiTitle');
        expect(screen.getByRole('dialog', { name: 'SemiTitle' })).toBe(getDialog());
        expect($(`.${prefix}-title`)?.tagName).toBe('H2');
        store.title = true;
        flushSync();
        expect($(`.${prefix}-title strong`)?.textContent).toBe('SlotTitle');
        expect(screen.getByRole('dialog', { name: 'SlotTitle' })).toBe(getDialog());
        store.title = false;
        update(store, { title: undefined });
        expect(getDialog()).not.toHaveAttribute('aria-labelledby');
    });

    it('aria-label 优先于标题命名', () => {
        setup({ visible: true, title: 'SemiTitle', 'aria-label': 'Custom' });
        expect(getDialog()).not.toHaveAttribute('aria-labelledby');
        expect(screen.getByRole('dialog', { name: 'Custom' })).toBe(getDialog());
    });

    it('size、width、height、centered、fullScreen', () => {
        const { store } = setup({ visible: true, size: 'large' });
        expect(getBox()).toHaveClass(`${prefix}-large`);
        update(store, { size: 'medium', width: 300, height: '200px' });
        expect(getBox()).toHaveClass(`${prefix}-medium`);
        expect(getBox().style.width).toBe('300px');
        expect(getBox().style.height).toBe('200px');
        expect(getDialog()).toHaveClass(`${prefix}-content-height-set`);
        update(store, { centered: true });
        expect(getBox()).toHaveClass(`${prefix}-centered`);
        expect(getWrap()).toHaveClass(`${prefix}-wrap-center`);
        update(store, { fullScreen: true });
        expect(getDialog()).toHaveClass(`${prefix}-content-fullScreen`);
        expect(getBox().style.width).toBe('100%');
    });

    it('mask 为 false 时没有遮罩，也不加 aria-modal', () => {
        setup({ visible: true, mask: false });
        expect(getMask()).toBeNull();
        expect(getRoot()).toHaveClass(`${prefix}-no-mask`);
        expect(getDialog()).not.toHaveAttribute('aria-modal');
    });

    it('默认页脚：按语言包显示按钮文字，okText、cancelText、hasCancel、okType、footerFill', () => {
        const { store } = setup({ visible: true });
        expect([...footerButtons()].map((button) => button.textContent?.trim())).toEqual(['取消', '确定']);
        expect(footerButtons()[1]).toHaveClass('semi-button-primary');
        update(store, { okText: 'Yes', cancelText: 'No', okType: 'danger', footerFill: true });
        expect([...footerButtons()].map((button) => button.textContent?.trim())).toEqual(['No', 'Yes']);
        expect(footerButtons()[1]).toHaveClass('semi-button-danger');
        expect(footerButtons()[0]).toHaveClass('semi-button-block');
        expect($(`.${prefix}-footerfill`)).not.toBeNull();
        update(store, { hasCancel: false });
        expect(footerButtons()).toHaveLength(1);
    });

    it('页脚按钮：okButtonProps、cancelButtonProps 与 loading', () => {
        const { store } = setup({ visible: true, title: 'T', okButtonProps: { disabled: true }, cancelButtonProps: { type: 'danger' } });
        expect(footerButtons()[1]).toBeDisabled();
        expect(footerButtons()[0]).toHaveClass('semi-button-danger');
        update(store, { okButtonProps: undefined, confirmLoading: true, cancelLoading: true });
        expect(footerButtons()[0]).toHaveClass(loadingCls);
        expect(footerButtons()[1]).toHaveClass(loadingCls);
    });

    it('footer 为 null 时隐藏页脚，传 snippet 时替换页脚', () => {
        const { store } = setup({ visible: true });
        store.footer = 'none';
        flushSync();
        expect($(`.${prefix}-footer`)).toBeNull();
        store.footer = 'custom';
        flushSync();
        expect($(`.${prefix}-footer`)).toHaveTextContent('OwnFooter');
        expect(footerButtons()).toHaveLength(0);
    });

    it('header 为 null 时隐藏标题栏，传 snippet 时替换标题栏，icon 与 closeIcon', () => {
        const { store } = setup({ visible: true, title: 'T' });
        store.header = 'none';
        flushSync();
        expect($(`.${prefix}-header`)).toBeNull();
        expect(getDialog()).not.toHaveAttribute('aria-labelledby');
        store.header = 'custom';
        flushSync();
        expect(getDialog()).toHaveTextContent('OwnHeader');
        store.header = undefined;
        store.icon = true;
        store.closeIcon = true;
        flushSync();
        expect($(`.${prefix}-icon-wrapper .semi-icon-eye_closed`)).not.toBeNull();
        expect($(`.${prefix}-close .my-close`)).not.toBeNull();
        update(store, { closable: false });
        expect($(`.${prefix}-close`)).toBeNull();
    });

    it('modal snippet 包住对话框元素', () => {
        setup({ visible: true }, { modal: true });
        expect($('.wrapped > [role="dialog"]')).not.toBeNull();
    });

    it('关闭按钮的可访问名称取自语言包', () => {
        setup({ visible: true, title: 'T' });
        expect(screen.getByRole('button', { name: '关闭' })).toHaveClass(`${prefix}-close`);
    });

    it('点击确定调用 onOk，点击取消、关闭按钮与 Esc 调用 onCancel 并写回 visible', () => {
        const onOk = vi.fn<NonNullable<ModalProps['onOk']>>();
        const onCancel = vi.fn<NonNullable<ModalProps['onCancel']>>();
        const { store } = setup({ visible: true, onOk, onCancel, title: 'T' });
        click(footerButtons()[1]);
        expect(onOk).toHaveBeenCalledTimes(1);
        expect(onOk.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
        expect(store.props.visible).toBe(true);

        click(footerButtons()[0]);
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(store.props.visible).toBe(false);

        update(store, { visible: true });
        click(screen.getByRole('button', { name: '关闭' }));
        expect(onCancel).toHaveBeenCalledTimes(2);
        expect(store.props.visible).toBe(false);

        update(store, { visible: true });
        pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(3);
        expect(onCancel.mock.calls[2][0]).toBeInstanceOf(KeyboardEvent);
        expect(store.props.visible).toBe(false);
    });

    it('首次打开的同一轮渲染后，焦点已在对话框内，Esc 立即生效', () => {
        const onCancel = vi.fn<() => void>();
        setup({ visible: true, onCancel, title: 'T' });
        expect(getDialog().contains(document.activeElement)).toBe(true);
        pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('closeOnEsc 为 false 时 Esc 不关闭', () => {
        const onCancel = vi.fn<() => void>();
        setup({ visible: true, closeOnEsc: false, onCancel });
        pressEsc();
        expect(onCancel).not.toHaveBeenCalled();
        expect(getBox()).not.toBeNull();
    });

    it('点击遮罩关闭；在对话框内按下后在遮罩上松开不关闭', async () => {
        const onCancel = vi.fn<() => void>();
        setup({ visible: true, onCancel, title: 'T' });
        mouseDown(getBox());
        mouseUp(getWrap());
        click(getWrap());
        expect(onCancel).not.toHaveBeenCalled();
        // the press mark clears one task after the mouseup
        await new Promise((resolve) => setTimeout(resolve, 0));
        click(getWrap());
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('maskClosable 为 false 时点击遮罩不关闭', () => {
        const onCancel = vi.fn<() => void>();
        setup({ visible: true, maskClosable: false, onCancel, title: 'T' });
        click(getWrap());
        expect(onCancel).not.toHaveBeenCalled();
        expect(getBox()).not.toBeNull();
    });

    it('onCancel 返回 Promise：兑现后才关闭', async () => {
        const pending = deferred();
        const { store } = setup({ visible: true, onCancel: () => pending.promise });
        click(footerButtons()[0]);
        flushSync();
        expect(store.props.visible).toBe(true);
        expect(footerButtons()[0]).toHaveClass(loadingCls);
        pending.resolve();
        await pending.promise;
        await tick();
        expect(store.props.visible).toBe(false);
    });

    it('onCancel 返回的 Promise 被拒绝：保持打开，原因由 foundation 重新抛出', async () => {
        const listeners = process.listeners('unhandledRejection');
        const reasons: unknown[] = [];
        process.removeAllListeners('unhandledRejection');
        process.on('unhandledRejection', (reason) => reasons.push(reason));
        try {
            const pending = deferred();
            const failure = new Error('cancel failed');
            const { store } = setup({ visible: true, onCancel: () => pending.promise });
            click(footerButtons()[0]);
            pending.reject(failure);
            await pending.promise.catch(() => {});
            await new Promise((resolve) => setTimeout(resolve, 20));
            expect(store.props.visible).toBe(true);
            expect(footerButtons()[0]).not.toHaveClass(loadingCls);
            expect(reasons).toEqual([failure]);
        } finally {
            process.removeAllListeners('unhandledRejection');
            for (const listener of listeners) {
                process.on('unhandledRejection', listener);
            }
        }
    });

    it('onOk 返回 Promise 时确定按钮显示 loading，兑现后恢复', async () => {
        const pending = deferred();
        const onOk = vi.fn<() => Promise<void>>(() => pending.promise);
        setup({ visible: true, onOk });
        click(footerButtons()[1]);
        flushSync();
        expect(footerButtons()[1]).toHaveClass(loadingCls);
        pending.resolve();
        await pending.promise;
        await tick();
        expect(footerButtons()[1]).not.toHaveClass(loadingCls);
    });

    it('页脚按钮的 onclick 先于内置处理执行', () => {
        const order: string[] = [];
        setup({
            visible: true,
            onOk: () => order.push('onOk'),
            okButtonProps: { onclick: () => order.push('onclick') },
        });
        click(footerButtons()[1]);
        expect(order).toEqual(['onclick', 'onOk']);
    });

    it('afterClose：无动画时关闭即调用一次，初始 visible 为 false 时不调用', () => {
        const afterClose = vi.fn<() => void>();
        const { store } = setup({ afterClose });
        expect(afterClose).not.toHaveBeenCalled();
        update(store, { visible: true });
        expect(afterClose).not.toHaveBeenCalled();
        update(store, { visible: false });
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('有动画时离场动画结束才卸载并调用 afterClose', async () => {
        holdAnimations();
        const afterClose = vi.fn<() => void>();
        const { store } = setup({ visible: true, motion: true, afterClose });
        animationEnd(getDialog());
        animationEnd(getMask());
        flushSync();
        expect(getDialog()).not.toHaveClass(`${prefix}-content-animate-show`);
        update(store, { visible: false });
        await tick();
        expect(getDialog()).toHaveClass(`${prefix}-content-animate-hide`);
        expect(getMask()).toHaveClass(`${prefix}-mask-animate-hide`);
        expect(afterClose).not.toHaveBeenCalled();
        animationEnd(getDialog());
        await tick();
        flushSync();
        expect(getBox()).toBeNull();
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('页面取消动画（getAnimations 为空）时立即结束离场', async () => {
        const afterClose = vi.fn<() => void>();
        const { store } = setup({ visible: true, motion: true, afterClose });
        update(store, { visible: false });
        await tick();
        await tick();
        expect(getBox()).toBeNull();
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('keepDOM：关闭后保留节点并隐藏，再次打开恢复显示；lazyRender 默认到首次打开才渲染', () => {
        const { store } = setup({ keepDOM: true });
        expect(getBox()).toBeNull();
        update(store, { visible: true });
        expect(getBox()).not.toBeNull();
        update(store, { visible: false });
        expect(getBox()).not.toBeNull();
        expect(getRoot()).toHaveClass(`${prefix}-displayNone`);
        update(store, { visible: true });
        expect(getRoot()).not.toHaveClass(`${prefix}-displayNone`);
    });

    it('keepDOM 且 lazyRender 为 false 时一开始就渲染但隐藏', () => {
        setup({ keepDOM: true, lazyRender: false });
        expect(getBox()).not.toBeNull();
        expect(getRoot()).toHaveClass(`${prefix}-displayNone`);
    });

    it('带遮罩的对话框锁定 body 滚动，关闭后恢复', () => {
        const { store } = setup({ visible: true });
        expect(document.body.style.overflow).toBe('hidden');
        update(store, { visible: false });
        expect(document.body.style.overflow).toBe('');
    });

    it('无遮罩或 preventScroll 对应的对话框不锁 body', () => {
        setup({ visible: true, mask: false });
        expect(document.body.style.overflow).toBe('');
    });

    it('getPopupContainer：渲染进容器，不锁 body，没有 aria-modal', () => {
        render(ContainerFixture);
        flushSync();
        expect($('.modal-container')?.contains(getBox())).toBe(true);
        expect(document.body.style.overflow).toBe('');
        expect(getDialog()).not.toHaveAttribute('aria-modal');
        expect(getRoot()).toHaveClass(`${prefix}-popup`);
    });

    it('ConfigProvider 的 getPopupContainer 生效', () => {
        render(ContainerFixture, { props: { config: true } });
        flushSync();
        expect($('.modal-container')?.contains(getBox())).toBe(true);
    });

    it('自身 getPopupContainer 优先于 ConfigProvider', () => {
        const own = document.body.appendChild(document.createElement('div'));
        render(ContainerFixture, { props: { config: true, own: () => own } });
        flushSync();
        expect(own.contains(getBox())).toBe(true);
        expect($('.modal-container')?.contains(getBox())).toBe(false);
        own.remove();
    });

    it('ConfigProvider 的 direction 为 rtl 时 portal 输出 dir="rtl"', () => {
        render(ConfigFixture, { props: { props: { direction: 'rtl' } } });
        flushSync();
        expect($('.semi-portal')).toHaveAttribute('dir', 'rtl');
    });

    it('ConfigProvider 的 locale 决定内置文案', () => {
        render(ConfigFixture, { props: { props: { locale: ja_JP } } });
        flushSync();
        expect(screen.getByRole('button', { name: ja_JP.Modal.close })).not.toBeNull();
        expect(footerButtons()[1]).toHaveTextContent(ja_JP.Modal.confirm);
    });

    it('全局默认值：overrideDefaultProps.Modal 作为未传属性的默认', () => {
        semiGlobal.config.overrideDefaultProps = { Modal: { okText: 'Global', size: 'large' } };
        const { store } = setup({ visible: true });
        expect(footerButtons()[1]).toHaveTextContent('Global');
        expect(getBox()).toHaveClass(`${prefix}-large`);
        update(store, { okText: 'Own' });
        expect(footerButtons()[1]).toHaveTextContent('Own');
    });

    it('自动聚焦：内容里的 autofocus 元素优先，否则落在确定按钮上', () => {
        setup({ visible: true }, { content: 'autofocus' });
        expect(screen.getByLabelText('name')).toHaveFocus();
    });
});
