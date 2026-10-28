import { type JSX, Show, createSignal } from 'solid-js';
import { createEvent, fireEvent, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { type MockInstance, afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { IconEyeClosed } from '@fibrae/semi-icons-solid';
import { sleep } from '@test/utils/solid';
import Modal, { type ModalProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import Input from '../../input';
import { LocaleProvider } from '../../locale';

type CancelHandler = NonNullable<ModalProps['onCancel']>;
type TestProps = ModalProps & { 'data-testid'?: string; 'data-foo'?: string; id?: string };

const p = `${BASE_CLASS_PREFIX}-modal`;
const defaultChildren = () => <p>This is content of basic modal</p>;

// Props are spread from a signal, as a consumer does with a store: every key is notified on any change
function renderModal(initial: TestProps = {}, children: () => JSX.Element = defaultChildren) {
    const [props, setProps] = createSignal<TestProps>(initial);
    const result = render(() => (
        <Modal motion={false} {...props()}>
            {children()}
        </Modal>
    ));
    return { ...result, rerender: (next: TestProps) => setProps(next) };
}

const $ = (selector: string) => document.querySelector<HTMLElement>(selector) as HTMLElement;
const getButtons = () => document.querySelectorAll(`.${BASE_CLASS_PREFIX}-button`);
const footerButtons = () => document.querySelectorAll<HTMLElement>(`.${p}-footer .${BASE_CLASS_PREFIX}-button`);
const loadingCls = `${BASE_CLASS_PREFIX}-button-loading`;
const animationEnd = (node: Element) => node.dispatchEvent(new Event('animationend', { bubbles: true }));
const pressEsc = () => fireEvent.keyDown(document, { key: 'Escape' });
// the setup stubs getAnimations() with [], which ends every run at once
const holdAnimations = () => vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([{ animationName: 'running' } as unknown as Animation]);

function deferred() {
    let resolve!: () => void;
    const promise = new Promise<void>((res) => {
        resolve = res;
    });
    return { promise, resolve };
}

beforeEach(() => {
    document.body.style.overflow = '';
    document.body.style.paddingInlineEnd = '';
});

afterEach(() => {
    vi.restoreAllMocks();
    document.body.style.overflow = '';
    document.body.style.paddingInlineEnd = '';
});

describe('Modal', () => {
    it('默认标题是 2 级标题，外观仍是 h5', () => {
        renderModal({ visible: true, title: 'Dialog title' });
        expect(screen.getByRole('heading', { level: 2, name: 'Dialog title' })).toHaveClass(`${BASE_CLASS_PREFIX}-typography-h5`);
    });

    it('footer 为 0 时照常渲染，null 时不渲染', () => {
        const { rerender } = renderModal({ visible: true, footer: 0 as unknown as JSX.Element });
        expect($(`.${p}-footer`)).toHaveTextContent(/^0$/);
        rerender({ visible: true, footer: null });
        expect($(`.${p}-footer`)).toBeNull();
    });

    it('离场动画期间的点击不再触发 onCancel', async () => {
        holdAnimations();
        const onCancel = vi.fn<CancelHandler>();
        const { rerender } = renderModal({ title: 'title', motion: true, visible: true, onCancel });
        fireEvent.click(screen.getByRole('button', { name: '关闭' }));
        expect(onCancel).toHaveBeenCalledTimes(1);

        rerender({ title: 'title', motion: true, visible: false, onCancel });
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        // past the 100ms debounce of onCancel, which would otherwise let the second click through
        await sleep(150);
        fireEvent.click(screen.getByRole('button', { name: '关闭' }));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('class / style / maskStyle / bodyStyle / zIndex', () => {
        renderModal({ class: 'test', style: { color: 'red' }, visible: true, maskStyle: { color: 'grey' }, bodyStyle: { color: 'pink' }, zIndex: 500 });
        expect($('div.test')).not.toBeNull();
        expect($(`.${p}`)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect($(`.${p}-body`)).toHaveStyle({ color: 'rgb(255, 192, 203)' });
        expect($(`.${p}-mask`)).toHaveStyle({ color: 'rgb(128, 128, 128)' });
        expect($(`.${BASE_CLASS_PREFIX}-portal`).style.zIndex).toEqual('500');
    });

    it('style 为字符串时与尺寸合并', () => {
        renderModal({ visible: true, style: 'color: red', width: 300, height: '200px' });
        expect($(`.${p}`)).toHaveStyle({ color: 'rgb(255, 0, 0)', width: '300px', height: '200px' });
        expect($(`.${p}-content`)).toHaveClass(`${p}-content-height-set`);
    });

    it('visible 属性', () => {
        const { rerender } = renderModal();
        expect($(`div.${p}`)).toBeNull();
        rerender({ visible: true });
        expect($(`div.${p}`)).not.toBeNull();
        expect(document.body.style.overflow).toEqual('hidden');
        rerender({ visible: false });
        expect(document.body.style.overflow).not.toEqual('hidden');
        expect($(`div.${p}`)).toBeNull();
    });

    it('渲染基础内容', () => {
        renderModal({ title: 'SemiTitle', visible: true });
        expect($(`.${p}-title`).textContent).toEqual('SemiTitle');
        expect($(`.${p}-body`).textContent).toEqual('This is content of basic modal');
    });

    it('footer 与 header', () => {
        const { rerender } = renderModal({ header: <p>This is a header</p>, footer: <p>This is a footer</p>, visible: true });
        expect($(`.${p}-content`).children[0].outerHTML).toEqual('<p>This is a header</p>');
        expect($(`.${p}-footer`)).toContainElement(screen.getByText('This is a footer'));
        rerender({ header: null, footer: null, visible: true });
        const content = $(`.${p}-content`).children;
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
        const dom = $(`.${p}`);
        expect(window.getComputedStyle(dom).width).toEqual('413px');
        expect(window.getComputedStyle(dom).height).toEqual('613px');
    });

    it('size 属性', () => {
        const { rerender } = renderModal({ size: 'small', visible: true });
        expect($(`.${p}-small`)).not.toBeNull();
        rerender({ size: 'medium', visible: true });
        expect($(`.${p}-medium`)).not.toBeNull();
        rerender({ size: 'large', visible: true });
        expect($(`.${p}-large`)).not.toBeNull();
        rerender({ size: 'full-width', visible: true });
        expect($(`.${p}-full-width`)).not.toBeNull();
    });

    it('closable 属性', () => {
        const { unmount } = renderModal({ closable: true, visible: true });
        expect($(`.${p}-close`)).not.toBeNull();
        unmount();
        renderModal({ closable: false, visible: true });
        expect($(`.${p}-close`)).toBeNull();
    });

    it('getPopupContainer', () => {
        render(() => (
            <div class="modal-container" style={{ height: '320px', overflow: 'hidden', position: 'relative' }}>
                <Modal getPopupContainer={() => $('.modal-container')} visible />
            </div>
        ));
        const modals = document.querySelectorAll<HTMLElement>(`div.${p}`);
        expect(modals).toHaveLength(1);
        expect($('.modal-container')).toContainElement(modals[0]);
    });

    it('挂载前不调用 getPopupContainer：它查询的节点挂载后才存在', () => {
        const found: boolean[] = [];
        const getContainer = () => {
            const container = document.querySelector<HTMLElement>('.modal-container');
            found.push(container !== null);
            return container as HTMLElement;
        };
        render(() => (
            <div class="modal-container">
                <Modal getPopupContainer={getContainer} visible />
            </div>
        ));
        expect(found.length).toBeGreaterThan(0);
        expect(found.every(Boolean)).toBe(true);
    });

    it('maskClosable', async () => {
        const spyOnCancel = vi.fn<CancelHandler>();
        const spyOnCancel2 = vi.fn<CancelHandler>();
        const { unmount } = renderModal({ maskClosable: true, visible: true, onCancel: spyOnCancel });
        await userEvent.click($(`.${p}-wrap`));
        expect(spyOnCancel).toHaveBeenCalledTimes(1);
        unmount();

        renderModal({ maskClosable: false, visible: true, onCancel: spyOnCancel2 });
        await userEvent.click($(`.${p}-wrap`));
        expect(spyOnCancel2).not.toHaveBeenCalled();
    });

    it('按钮相关属性：cancelText / okText / okButtonProps / cancelButtonProps / hasCancel / confirmLoading', () => {
        const baseProps: TestProps = { cancelText: 'cancel', okText: 'ok', okType: 'secondary', visible: true, closable: false };
        const { rerender } = renderModal(baseProps);
        let footerBtn = getButtons();
        expect(footerBtn[0]).toHaveTextContent(/^cancel$/);
        expect(footerBtn[1]).toHaveTextContent(/^ok$/);
        expect(footerBtn[1]).toHaveClass(`${BASE_CLASS_PREFIX}-button-secondary`);
        const buttonProps: TestProps = { okButtonProps: { size: 'small', type: 'warning' }, cancelButtonProps: { size: 'small', disabled: true } };
        rerender({ ...baseProps, ...buttonProps });
        footerBtn = getButtons();
        expect(footerBtn[0]).toHaveClass(`${BASE_CLASS_PREFIX}-button-disabled`, `${BASE_CLASS_PREFIX}-button-size-small`);
        expect(footerBtn[1]).toHaveClass(`${BASE_CLASS_PREFIX}-button-warning`, `${BASE_CLASS_PREFIX}-button-size-small`);
        rerender({ ...baseProps, ...buttonProps, hasCancel: false, confirmLoading: true });
        footerBtn = getButtons();
        expect(footerBtn).toHaveLength(1);
        expect(footerBtn[0]).toHaveClass(loadingCls);
    });

    it('onCancel / onOk', async () => {
        const spyOnCancel = vi.fn<CancelHandler>();
        const spyOnOk = vi.fn<() => void>();
        renderModal({ visible: true, onCancel: spyOnCancel, onOk: spyOnOk });
        const btn = getButtons();
        await userEvent.click($(`button.${p}-close`));
        await userEvent.click(btn[1]);
        await userEvent.click(btn[2]);
        expect(spyOnCancel).toHaveBeenCalledTimes(2);
        expect(spyOnOk).toHaveBeenCalledTimes(1);
    });

    it('无遮罩', () => {
        renderModal({ mask: false, visible: true });
        expect($(`div.${p}`)).not.toBeNull();
        expect($(`.${p}-mask`)).toBeNull();
    });

    it('closeIcon', () => {
        renderModal({ visible: true, closeIcon: <IconEyeClosed /> });
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-eye_closed`)).toHaveLength(1);
    });

    it('motion 为 false', () => {
        const { rerender } = renderModal({ visible: true, motion: false });
        expect($(`div.${p}`).style.transform).toBe('');
        rerender({ visible: false, motion: false });
        expect($(`div.${p}`)).toBeNull();
    });

    it('有动效时播放进场动画', () => {
        holdAnimations();
        renderModal({ centered: true, visible: true, motion: true });
        expect($(`div.${p}-content`)).toHaveClass(`${p}-content-animate-show`);
        expect($(`div.${p}-mask`)).toHaveClass(`${p}-mask-animate-show`);
    });

    it('无动效时的 centered', () => {
        renderModal({ centered: true, visible: true, motion: false });
        expect($(`div.${p}-wrap`)).toHaveClass(`${p}-wrap-center`);
    });

    it('keepDOM', () => {
        const { rerender } = renderModal({ keepDOM: true });
        expect($(`div.${p}`)).toBeNull();
        rerender({ keepDOM: true, visible: true });
        expect($(`div.${p}`)).not.toBeNull();
        expect($(`.${p}-displayNone`)).toBeNull();
        expect(document.body.style.overflow).toEqual('hidden');
        rerender({ keepDOM: true, visible: false });
        expect($(`.${p}-displayNone`)).not.toBeNull();
        expect($(`div.${p}`)).not.toBeNull();
    });

    it('keepDOM 与 lazyRender=false', () => {
        const { rerender } = renderModal({ keepDOM: true, lazyRender: false });
        expect($(`div.${p}`)).not.toBeNull();
        expect($(`.${p}-displayNone`)).not.toBeNull();
        rerender({ keepDOM: true, lazyRender: false, visible: true });
        expect($(`.${p}-displayNone`)).toBeNull();
        expect(document.body.style.overflow).toEqual('hidden');
        rerender({ keepDOM: true, lazyRender: false, visible: false });
        expect($(`.${p}-displayNone`)).not.toBeNull();
        expect($(`div.${p}`)).not.toBeNull();
    });

    it('modalRender 包裹对话框', () => {
        renderModal({ visible: true, modalRender: (modal) => <div class="modal-render-test">{modal}</div> });
        expect($(`div.modal-render-test .${p}-body`)).not.toBeNull();
        expect($(`div.modal-render-test`).querySelector('[role="dialog"]')).not.toBeNull();
    });

    it('多个 modal 打开时，Esc 只关闭最上层的 modal', () => {
        const onCancelOuter = vi.fn<(e: MouseEvent | KeyboardEvent) => void>();
        const onCancelInner = vi.fn<(e: MouseEvent | KeyboardEvent) => void>();
        const [outer, setOuter] = createSignal(true);
        const [inner, setInner] = createSignal(true);
        render(() => (
            <>
                <Modal
                    motion={false}
                    visible={outer()}
                    onCancel={(e) => {
                        onCancelOuter(e);
                        setOuter(false);
                    }}
                />
                <Modal
                    motion={false}
                    visible={inner()}
                    onCancel={(e) => {
                        onCancelInner(e);
                        setInner(false);
                    }}
                />
            </>
        ));
        pressEsc();
        expect(onCancelInner).toHaveBeenCalledTimes(1);
        expect(onCancelOuter).toHaveBeenCalledTimes(0);
        expect(document.querySelectorAll(`div.${p}`)).toHaveLength(1);
        pressEsc();
        expect(onCancelOuter).toHaveBeenCalledTimes(1);
        expect(document.querySelectorAll(`div.${p}`)).toHaveLength(0);
    });

    it('每个打开的 modal 都用自己的标题进行标注', () => {
        render(() => (
            <>
                <Modal motion={false} visible title="First">
                    <p>first body</p>
                </Modal>
                <Modal motion={false} visible title="Second">
                    <p>second body</p>
                </Modal>
            </>
        ));
        const [first, second] = screen.getAllByRole('dialog');
        expect(first).toHaveAccessibleName('First');
        expect(second).toHaveAccessibleName('Second');
    });

    // a dangling aria-labelledby points at nothing; without a title element there is nothing to reference
    it('缺少标题元素时不设置标注', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(() => (
            <>
                <Modal motion={false} visible />
                <Modal motion={false} visible title="Ignored" header={<div>custom header</div>} />
            </>
        ));
        for (const dialog of screen.getAllByRole('dialog')) {
            expect(dialog).not.toHaveAttribute('aria-labelledby');
        }
    });
});

describe('Modal 行为', () => {
    it('Esc 关闭时 onCancel 收到原生 KeyboardEvent，类型声明与之一致', () => {
        const onCancel = vi.fn<CancelHandler>();
        renderModal({ visible: true, onCancel });
        pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onCancel.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
        expectTypeOf<Parameters<CancelHandler>[0]>().toEqualTypeOf<MouseEvent | KeyboardEvent>();
        expectTypeOf<ModalProps['direction']>().toEqualTypeOf<'ltr' | 'rtl' | undefined>();
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
        holdAnimations();
        const afterClose = vi.fn<() => void>();
        const { rerender } = renderModal({ afterClose, visible: true, motion: true });
        animationEnd($(`.${p}-content`));
        rerender({ afterClose, visible: false, motion: true });
        expect($(`.${p}-content`)).toHaveClass(`${p}-content-animate-hide`);
        expect(document.body.style.overflow).toBe('hidden');
        expect(afterClose).not.toHaveBeenCalled();
        animationEnd($(`.${p}-content`));
        expect($(`.${p}`)).toBeNull();
        expect(document.body.style.overflow).toBe('');
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('对话框内冒泡的 animationend 不会结束离开动画', () => {
        holdAnimations();
        const afterClose = vi.fn<() => void>();
        const { rerender } = renderModal({ afterClose, visible: true, motion: true }, () => <span data-testid="inner">content</span>);
        rerender({ afterClose, visible: false, motion: true });
        // e.g. a Tooltip or Tabs pane inside the dialog finishing its own animation
        animationEnd(screen.getByTestId('inner'));
        expect($(`.${p}`)).not.toBeNull();
        expect(afterClose).not.toHaveBeenCalled();
        animationEnd($(`.${p}-content`));
        expect($(`.${p}`)).toBeNull();
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('onOk / onCancel 返回 Promise 时，按钮保持 loading 直至完成', async () => {
        const ok = deferred();
        const cancel = deferred();
        renderModal({ visible: true, onOk: () => ok.promise, onCancel: () => cancel.promise });
        await userEvent.click(footerButtons()[1]);
        expect(footerButtons()[1]).toHaveClass(loadingCls);
        expect(footerButtons()[0]).not.toHaveClass(loadingCls);
        ok.resolve();
        await ok.promise;
        await sleep(0);
        expect(footerButtons()[1]).not.toHaveClass(loadingCls);

        await userEvent.click(footerButtons()[0]);
        expect(footerButtons()[0]).toHaveClass(loadingCls);
        cancel.resolve();
        await cancel.promise;
        await sleep(0);
        expect(footerButtons()[0]).not.toHaveClass(loadingCls);
    });

    it('在对话框内按下、在遮罩上松开的操作不会关闭 modal', async () => {
        const onCancel = vi.fn<CancelHandler>();
        renderModal({ visible: true, onCancel });
        const wrap = $(`.${p}-wrap`);
        fireEvent.mouseDown($(`.${p}`));
        fireEvent.mouseUp(wrap);
        fireEvent.click(wrap);
        expect(onCancel).not.toHaveBeenCalled();
        await sleep(0);
        fireEvent.click(wrap);
        expect(onCancel).toHaveBeenCalledTimes(1);
        fireEvent.click($(`.${p}-body`));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('closeOnEsc', () => {
        const onCancel = vi.fn<CancelHandler>();
        const { rerender } = renderModal({ visible: true, onCancel });
        pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(1);
        rerender({ visible: true, onCancel, closeOnEsc: false });
        pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('closeOnEsc 为 false 时，最上层 modal 上的 Escape 不会传到下层 modal', () => {
        const onLowerCancel = vi.fn<CancelHandler>();
        render(() => (
            <>
                <Modal motion={false} visible title="Lower" onCancel={onLowerCancel} />
                <Modal motion={false} visible title="Upper" closeOnEsc={false} />
            </>
        ));
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
        const cases: [TestProps, string | null][] = [
            [{}, 'true'],
            [{ mask: false }, null],
            [{ getPopupContainer: () => container }, null],
            [{ getPopupContainer: () => container, maskFixed: true }, 'true'],
            [{ mask: false, 'aria-modal': 'true' }, 'true'],
        ];
        for (const [props, expected] of cases) {
            const view = renderModal({ visible: true, title: 'Dialog', ...props });
            expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe(expected);
            view.unmount();
        }
        container.remove();
    });

    it('叠加的 modal 在最后一个关闭前保持 body 锁定，之后恢复', () => {
        const [a, setA] = createSignal(true);
        const [b, setB] = createSignal(false);
        render(() => (
            <>
                <Modal motion={false} visible={a()} />
                <Modal motion={false} visible={b()} />
            </>
        ));
        expect(document.body.style.overflow).toBe('hidden');
        setB(true);
        expect(document.body.style.overflow).toBe('hidden');
        setB(false);
        expect(document.body.style.overflow).toBe('hidden');
        setA(false);
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

        const container = document.body.appendChild(document.createElement('div'));
        const custom = renderModal({ visible: true, getPopupContainer: () => container });
        expect(document.body.style.overflow).toBe('');
        expect(container.querySelector(`.${p}`)).not.toBeNull();
        expect($(`.${BASE_CLASS_PREFIX}-portal`).style.position).toBe('static');
        custom.unmount();
        container.remove();
    });

    it('打开时焦点移入对话框，关闭时回到之前的元素', () => {
        const trigger = document.body.appendChild(document.createElement('button'));
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
        expect(document.activeElement).toBe($(`.${p}-close`));
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

    it('cancelButtonProps.style 为字符串时与 footerFill 的间距合并', () => {
        renderModal({ visible: true, title: 'T', footerFill: true, cancelButtonProps: { style: 'color: red' } });
        const style = footerButtons()[0].getAttribute('style') ?? '';
        expect(style).toContain('margin-inline-start: unset');
        expect(style).toContain('color: red');
    });

    it('maskClosable 由 false 改为 true 后，首次点击遮罩即关闭', () => {
        const onCancel = vi.fn<CancelHandler>();
        const { rerender } = renderModal({ visible: true, maskClosable: false, onCancel });
        fireEvent.mouseDown($(`.${p}`));
        fireEvent.mouseUp($(`.${p}`));
        rerender({ visible: true, maskClosable: true, onCancel });
        fireEvent.click($(`.${p}-wrap`));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('footer 按钮显示语言包文案', () => {
        const { unmount } = renderModal({ visible: true, closable: false });
        expect([...footerButtons()].map((b) => b.textContent)).toEqual(['取消', '确定']);
        unmount();
        render(() => (
            <LocaleProvider locale={en_US}>
                <Modal closable={false} motion={false} visible />
            </LocaleProvider>
        ));
        expect([...footerButtons()].map((b) => b.textContent)).toEqual(['Cancel', 'Confirm']);
    });

    it('关闭按钮名称跟随语言包', () => {
        const { unmount } = renderModal({ visible: true });
        expect($(`.${p}-close`)).toHaveAttribute('aria-label', '关闭');
        unmount();
        render(() => (
            <LocaleProvider locale={en_US}>
                <Modal motion={false} visible />
            </LocaleProvider>
        ));
        expect($(`.${p}-close`)).toHaveAttribute('aria-label', 'Close');
    });

    it('data-* 透传到 portal 中的外层元素，已声明的属性不落到 DOM', () => {
        renderModal({
            visible: true,
            class: 'outer',
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
        expect(root).toContainElement($(`.${p}-mask`));
        expect(root).toContainElement($(`.${p}`));
        for (const name of ['content', 'footerfill', 'preventscroll', 'oktype', 'maskfixed']) {
            expect(document.querySelector(`[${name}]`)).toBeNull();
        }
    });

    it('从 semiGlobal overrideDefaultProps.Modal 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Modal: { okText: 'Global OK', closable: false, motion: false } };
        try {
            render(() => <Modal title="T" visible />);
            expect($(`.${p}-close`)).toBeNull();
            expect(footerButtons()[1]).toHaveTextContent('Global OK');
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('fullScreen 跟随属性', () => {
        const { rerender } = renderModal({ visible: true, fullScreen: true });
        expect($(`.${p}-content`)).toHaveClass(`${p}-content-fullScreen`);
        expect($(`.${p}`)).toHaveStyle({ width: '100%', height: '100%' });
        rerender({ visible: true, fullScreen: false });
        expect($(`.${p}-content`)).not.toHaveClass(`${p}-content-fullScreen`);
    });

    it('footerFill、modalContentClass、icon 的类名', () => {
        renderModal({ visible: true, footerFill: true, modalContentClass: 'mc', icon: <span>i</span> });
        expect($(`.${p}-footerfill`)).not.toBeNull();
        expect(footerButtons()[0]).toHaveClass(`${BASE_CLASS_PREFIX}-button-block`);
        expect($(`.${p}-content`)).toHaveClass('mc');
        expect($(`.${p}-icon-wrapper`)).toHaveTextContent('i');
    });

    it('一次更新中不重复调用 getPopupContainer', () => {
        const container = vi.fn<() => HTMLElement>(() => document.body);
        const { rerender } = renderModal({ visible: true, getPopupContainer: container });
        container.mockClear();
        rerender({ visible: true, getPopupContainer: container, title: 'next' });
        // Modal's own check plus the portal's lookup
        expect(container.mock.calls.length).toBeLessThanOrEqual(2);
    });

    it('按钮属性中的 children 不替换按钮文案', () => {
        renderModal({ visible: true, closable: false, okText: 'Go', okButtonProps: { children: 'ignored' }, cancelButtonProps: { children: 'ignored' } });
        expect([...footerButtons()].map((b) => b.textContent)).toEqual(['取消', 'Go']);
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
        const onCancel = vi.fn<CancelHandler>();
        const trigger = document.body.appendChild(document.createElement('button'));
        trigger.focus();
        const { rerender } = renderModal({ keepDOM: true, visible: true, onCancel });
        expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
        rerender({ keepDOM: true, visible: false, onCancel });
        expect(document.activeElement).toBe(trigger);
        pressEsc();
        expect(onCancel).not.toHaveBeenCalled();
        rerender({ keepDOM: true, visible: true, onCancel });
        expect($(`.${p}`)).toContainElement(document.activeElement as HTMLElement);
        pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(1);
        trigger.remove();
    });

    it('卸载隐藏的 modal 不影响其他 modal 的 body 锁定', () => {
        const [a, setA] = createSignal(true);
        const [b, setB] = createSignal(false);
        const [showA, setShowA] = createSignal(true);
        render(() => (
            <>
                <Show when={showA()}>
                    <Modal motion={false} visible={a()} />
                </Show>
                <Modal motion={false} visible={b()} />
            </>
        ));
        setA(false);
        expect(document.body.style.overflow).toBe('');
        setB(true);
        expect(document.body.style.overflow).toBe('hidden');
        setShowA(false);
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('离开动画期间重新打开，关闭后仍恢复 body', () => {
        holdAnimations();
        const { rerender } = renderModal({ visible: true, motion: true });
        rerender({ visible: false, motion: true });
        rerender({ visible: true, motion: true });
        rerender({ visible: false, motion: true });
        animationEnd($(`.${p}-content`));
        expect($(`.${p}`)).toBeNull();
        expect(document.body.style.overflow).toBe('');
    });

    it('ref 与其他未知属性透传到 portal 中的外层元素', () => {
        let ref: HTMLDivElement | undefined;
        render(() => (
            <Modal
                motion={false}
                visible
                ref={(node) => {
                    ref = node;
                }}
                id="modal-root"
                data-foo="bar"
            />
        ));
        const root = document.getElementById('modal-root');
        expect(ref).toBe(root);
        expect(root).toHaveAttribute('data-foo', 'bar');
        expect(root?.parentElement).toHaveClass(`${BASE_CLASS_PREFIX}-portal`);
        expect(root).toContainElement($(`.${p}`));
    });

    it('aria-label、aria-labelledby、aria-describedby 与 aria-modal 落在对话框上，data-* 落在外层元素上', () => {
        renderModal({
            visible: true,
            title: 'Title',
            'aria-label': 'Custom label',
            'aria-labelledby': 'outside-label',
            'aria-describedby': 'outside-desc',
            'aria-modal': 'false',
            'data-foo': 'bar',
        });
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
        renderModal({ visible: true, title: 'Title', 'aria-roledescription': 'sheet', 'aria-details': 'extra' });
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
        renderModal({ visible: true, title: 'Title' });
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAccessibleName('Title');
    });

    it('aria-label 替换生成的标题引用', () => {
        renderModal({ visible: true, title: 'Title', 'aria-label': 'Custom label' });
        const dialog = screen.getByRole('dialog');
        expect(dialog).not.toHaveAttribute('aria-labelledby');
        expect(dialog).toHaveAccessibleName('Custom label');
    });

    it('卸载已显示的 modal 时只调用一次 afterClose，隐藏或已关闭的不调用', () => {
        const afterClose = vi.fn<() => void>();
        renderModal({ visible: true, afterClose }).unmount();
        expect(afterClose).toHaveBeenCalledTimes(1);

        const closed = renderModal({ visible: true, afterClose });
        closed.rerender({ visible: false, afterClose });
        expect(afterClose).toHaveBeenCalledTimes(2);
        closed.unmount();
        expect(afterClose).toHaveBeenCalledTimes(2);

        renderModal({ afterClose }).unmount();
        expect(afterClose).toHaveBeenCalledTimes(2);
    });

    it('离开动画期间卸载只调用一次 afterClose', () => {
        holdAnimations();
        const afterClose = vi.fn<() => void>();
        const { rerender, unmount } = renderModal({ visible: true, motion: true, afterClose });
        rerender({ visible: false, motion: true, afterClose });
        unmount();
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('onOk、onCancel、afterClose 传 null 时点击与关闭都不抛错', async () => {
        const nulls = { onOk: null, onCancel: null, afterClose: null } as unknown as TestProps;
        const { rerender } = renderModal({ visible: true, ...nulls });
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await userEvent.click(screen.getByRole('button', { name: '取消' }));
        rerender({ visible: false, ...nulls });
        expect(screen.queryByRole('dialog')).toBeNull();
    });
});

describe('Modal 对话框名称警告', () => {
    const nameWarnings = (warn: MockInstance<typeof console.warn>) => warn.mock.calls.filter(([message]) => String(message).includes('[Semi Modal]'));

    it('未命名打开时同步警告一次', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(() => (
            <Modal motion={false} visible>
                body
            </Modal>
        ));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(nameWarnings(warn)).toHaveLength(1);
    });

    it('有标题时不警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(() => (
            <Modal title="Named" motion={false} visible>
                body
            </Modal>
        ));
        expect(screen.getByRole('dialog', { name: 'Named' })).toBeInTheDocument();
        expect(nameWarnings(warn)).toHaveLength(0);
    });
});

describe('Modal 模态判断与初始焦点', () => {
    it('ConfigProvider 的 getPopupContainer 与 Modal 自身的同样按实际容器判断', () => {
        const container = document.body.appendChild(document.createElement('div'));
        const page = document.body.appendChild(document.createElement('main'));
        render(() => (
            <ConfigProvider getPopupContainer={() => container}>
                <Modal motion={false} visible title="Dialog" />
            </ConfigProvider>
        ));
        expect(container.querySelector(`.${p}`)).not.toBeNull();
        expect(document.body.style.overflow).toBe('');
        expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal');
        expect(page.inert).toBeFalsy();
        expect($(`.${p}-popup`)).not.toBeNull();
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
        const ok = footerButtons()[1];
        ok.focus();
        const event = createEvent.keyDown(ok, { key: 'Tab' });
        fireEvent(ok, event);
        expect(event.defaultPrevented).toBe(false);
        expect(document.activeElement).toBe(ok);
    });

    // keepDOM keeps the dialog mounted, so hiding runs the restore rather than unmounting the content
    it('非模态关闭时不夺回已移到页面其他位置的焦点', () => {
        const trigger = document.body.appendChild(document.createElement('button'));
        const other = document.body.appendChild(document.createElement('button'));
        trigger.focus();
        const props: TestProps = { keepDOM: true, title: 'T', mask: false };
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

    it('okButtonProps.autoFocus 时每次打开都聚焦确定按钮，且不落到 DOM', () => {
        const trigger = document.body.appendChild(document.createElement('button'));
        trigger.focus();
        const props: TestProps = { keepDOM: true, title: 'T', okButtonProps: { autoFocus: true } };
        const { rerender } = renderModal({ ...props, visible: true });
        expect(document.activeElement).toBe(footerButtons()[1]);
        expect(footerButtons()[1]).not.toHaveAttribute('autofocus');
        rerender({ ...props, visible: false });
        expect(document.activeElement).toBe(trigger);
        rerender({ ...props, visible: true });
        expect(document.activeElement).toBe(footerButtons()[1]);
        trigger.remove();
    });

    it('keepDOM 关闭再打开后，正文中 autofocus 的元素仍持焦', () => {
        const trigger = document.body.appendChild(document.createElement('button'));
        trigger.focus();
        const props: TestProps = { keepDOM: true, title: 'T' };
        const { rerender } = renderModal({ ...props, visible: true }, () => <Input aria-label="name" autofocus />);
        const textbox = screen.getByRole('textbox', { name: 'name' });
        expect(document.activeElement).toBe(textbox);
        rerender({ ...props, visible: false });
        expect(document.activeElement).toBe(trigger);
        rerender({ ...props, visible: true });
        expect(document.activeElement).toBe(textbox);
        trigger.remove();
    });

    it('正文中 autofocus 的元素优先于默认取消按钮', () => {
        renderModal({ visible: true, title: 'T' }, () => <Input aria-label="name" autofocus />);
        expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'name' }));
    });

    it('正文中带 autofocus 属性的原生元素优先于默认取消按钮', () => {
        renderModal({ visible: true, title: 'T' }, () => <button autofocus>inner</button>);
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'inner' }));
    });

    it('组件版 Modal 默认不设置 aria-describedby', () => {
        renderModal({ visible: true, title: 'Title' });
        expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
    });

    it('cancelButtonProps、okButtonProps 的 onClick 先调用，再执行内置处理', async () => {
        const order: string[] = [];
        renderModal({
            visible: true,
            title: 'T',
            cancelButtonProps: { onClick: () => order.push('cancel click') },
            okButtonProps: { onClick: () => order.push('ok click') },
            onCancel: () => {
                order.push('onCancel');
            },
            onOk: () => {
                order.push('onOk');
            },
        });
        const [cancel, ok] = footerButtons();
        await userEvent.click(cancel);
        await userEvent.click(ok);
        expect(order).toEqual(['cancel click', 'onCancel', 'ok click', 'onOk']);
    });
});
