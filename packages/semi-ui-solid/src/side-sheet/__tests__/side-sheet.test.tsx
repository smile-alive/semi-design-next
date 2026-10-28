import { type JSX, createSignal, onMount } from 'solid-js';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, type MockInstance, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconEyeClosed } from '@fibrae/semi-icons-solid';
import SideSheet, { type SideSheetProps, type SideSheetState } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import { LocaleProvider } from '../../locale';
import { TooltipPopupsContext, type TooltipPopups } from '../../tooltip/context';

type CancelHandler = NonNullable<SideSheetProps['onCancel']>;
type VisibleHandler = NonNullable<SideSheetProps['afterVisibleChange']>;

const prefix = `${BASE_CLASS_PREFIX}-sidesheet`;

const defaultChildren = () => <p>This is content of basic sideSheet</p>;

// Props are spread from a signal, as a consumer does with a store: every key is notified on any change
type TestProps = SideSheetProps & { 'data-testid'?: string; 'data-foo'?: string };

function renderSideSheet(initial: TestProps = {}, children: () => JSX.Element = defaultChildren) {
    const [props, setProps] = createSignal<TestProps>(initial);
    const result = render(() => <SideSheet {...props()}>{children()}</SideSheet>);
    return { ...result, rerender: (next: TestProps) => setProps(next) };
}

const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
const getRoot = () => $(`div.${prefix}`);
const getInner = () => $(`.${prefix}-inner`) as HTMLElement;
const getMask = () => $(`.${prefix}-mask`) as HTMLElement;
const getPortal = () => $(`.${BASE_CLASS_PREFIX}-portal`) as HTMLElement;
const animationEnd = (node: Element) => node.dispatchEvent(new Event('animationend', { bubbles: true }));
const pressEsc = () => fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
// the setup stubs getAnimations() with [], which ends every run at once
const holdAnimations = () => vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([{ animationName: 'running' } as unknown as Animation]);

beforeEach(() => {
    document.body.style.overflow = '';
    document.body.style.paddingInlineEnd = '';
});

afterEach(() => {
    vi.restoreAllMocks();
    document.body.style.overflow = '';
    document.body.style.paddingInlineEnd = '';
});

describe('SideSheet', () => {
    it('class / style / maskStyle / bodyStyle / headerStyle / zIndex', () => {
        renderSideSheet({
            class: 'test',
            style: { color: 'red' },
            visible: true,
            maskStyle: { color: 'grey' },
            headerStyle: { color: 'green' },
            bodyStyle: { color: 'pink' },
            zIndex: 500,
        });
        expect($(`.${prefix}.test`)).not.toBeNull();
        expect(getInner()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect($(`.${prefix}-body`)).toHaveStyle({ color: 'rgb(255, 192, 203)' });
        expect($(`.${prefix}-header`)).toHaveStyle({ color: 'rgb(0, 128, 0)' });
        expect(getMask()).toHaveStyle({ color: 'rgb(128, 128, 128)' });
        expect(getPortal().style.zIndex).toEqual('500');
    });

    it('style 为字符串时与尺寸合并', () => {
        renderSideSheet({ visible: true, style: 'color: red', width: 300 });
        expect(getInner()).toHaveStyle({ color: 'rgb(255, 0, 0)', width: '300px', height: '100%' });
    });

    it('visible 属性', () => {
        const { rerender } = renderSideSheet();
        expect(getRoot()).toBeNull();
        rerender({ visible: true });
        expect(getRoot()).not.toBeNull();
    });

    it('基础用例', () => {
        renderSideSheet({ placement: 'bottom', visible: true });
        expect($(`.${prefix}-bottom`)).not.toBeNull();
    });

    it('不同位置', () => {
        const { rerender } = renderSideSheet({ placement: 'top', visible: true });
        expect($(`.${prefix}-top`)).not.toBeNull();
        rerender({ placement: 'bottom', visible: true });
        expect($(`.${prefix}-bottom`)).not.toBeNull();
        rerender({ placement: 'left', visible: true });
        expect($(`.${prefix}-left`)).not.toBeNull();
        rerender({ placement: 'right', visible: true });
        expect($(`.${prefix}-right`)).not.toBeNull();
    });

    it('基础渲染', () => {
        renderSideSheet({ title: 'SemiTitle', visible: true });
        expect($(`.${prefix}-title`)?.textContent).toEqual('SemiTitle');
        expect($(`.${prefix}-body`)?.textContent).toEqual('This is content of basic sideSheet');
    });

    it('size 属性', () => {
        const { rerender } = renderSideSheet({ size: 'small', visible: true });
        expect(getInner()).toHaveClass('semi-sidesheet-size-small');
        rerender({ size: 'medium', visible: true });
        expect(getInner()).toHaveClass('semi-sidesheet-size-medium');
        rerender({ size: 'large', visible: true });
        expect(getInner()).toHaveClass('semi-sidesheet-size-large');
    });

    it('height / width', () => {
        let props: SideSheetProps = { width: '413px', visible: true };
        const { rerender } = renderSideSheet(props);
        const update = (next: SideSheetProps) => {
            props = { ...props, ...next };
            rerender(props);
        };
        expect(getInner()).toHaveStyle({ width: '413px' });
        update({ height: '413px' });
        expect(getInner()).toHaveStyle({ height: '100%' });

        update({ placement: 'right' });
        expect(getInner()).toHaveStyle({ width: '413px' });
        update({ height: '413px' });
        expect(getInner()).toHaveStyle({ height: '100%' });

        update({ height: '413px', placement: 'top' });
        expect(getInner()).toHaveStyle({ height: '413px' });
        update({ width: '413px' });
        expect(getInner()).toHaveStyle({ width: '100%' });

        update({ height: '413px', placement: 'bottom' });
        expect(getInner()).toHaveStyle({ height: '413px' });
        update({ width: '413px' });
        expect(getInner()).toHaveStyle({ width: '100%' });
    });

    it('disableScroll', () => {
        const { rerender } = renderSideSheet({ visible: true });
        expect(document.body.style.overflow).toEqual('hidden');
        rerender({ visible: false });
        expect(document.body.style.overflow).not.toEqual('hidden');

        rerender({ disableScroll: false, visible: true });
        expect(document.body.style.overflow).not.toEqual('hidden');
    });

    it('closable 属性', () => {
        const { unmount } = renderSideSheet({ closable: true, visible: true });
        expect($(`.${prefix}-close`)).not.toBeNull();
        unmount();

        renderSideSheet({ closable: false, visible: true });
        expect($(`.${prefix}-close`)).toBeNull();
    });

    it('maskClosable', async () => {
        const spyOnCancel = vi.fn<CancelHandler>();
        const spyOnCancel2 = vi.fn<CancelHandler>();
        const { unmount } = renderSideSheet({ maskClosable: true, visible: true, onCancel: spyOnCancel });
        await userEvent.click(getMask());
        expect(spyOnCancel).toHaveBeenCalledTimes(1);
        unmount();

        renderSideSheet({ maskClosable: false, visible: true, onCancel: spyOnCancel2 });
        await userEvent.click(getMask());
        expect(spyOnCancel2).not.toHaveBeenCalled();
    });

    it('onCancel', async () => {
        const spyOnCancel = vi.fn<CancelHandler>();
        renderSideSheet({ visible: true, onCancel: spyOnCancel });
        await userEvent.click($(`button.${prefix}-close`) as HTMLElement);
        expect(spyOnCancel).toHaveBeenCalledTimes(1);
    });

    it('无遮罩', () => {
        renderSideSheet({ mask: false, visible: true });
        expect(getRoot()).not.toBeNull();
        expect(getMask()).toBeNull();
    });

    it('getPopupContainer', () => {
        const container = () => document.querySelector<HTMLElement>('.sidesheet-container') as HTMLElement;
        const { unmount } = render(() => (
            <div class="sidesheet-container" style={{ height: '320px', overflow: 'hidden', position: 'relative' }}>
                <SideSheet getPopupContainer={container} visible />
            </div>
        ));
        const sideSheets = document.querySelectorAll<HTMLElement>(`div.${prefix}`);
        expect(sideSheets).toHaveLength(1);
        expect(container()).toContainElement(sideSheets[0]);
        expect(document.body.style.overflow).not.toEqual('hidden');
        unmount();

        render(() => (
            <div class="sidesheet-container" style={{ height: '320px', overflow: 'hidden', position: 'relative' }}>
                <SideSheet visible />
            </div>
        ));
        expect(getRoot()).not.toBeNull();
        expect(container().querySelector(`.${prefix}`)).toBeNull();
    });

    it('motion 为 false', () => {
        const { rerender } = renderSideSheet({ placement: 'top', visible: true, motion: false });
        expect($(`.${prefix}-top`)).not.toBeNull();
        expect(getInner().style.transform).toBe('');
        rerender({ placement: 'bottom', visible: true, motion: false });
        expect($(`.${prefix}-bottom`)).not.toBeNull();
        expect(getInner().style.transform).toBe('');
        rerender({ placement: 'left', visible: true, motion: false });
        expect($(`.${prefix}-left`)).not.toBeNull();
        expect(getInner().style.transform).toBe('');
        rerender({ placement: 'right', visible: true, motion: false });
        expect($(`.${prefix}-right`)).not.toBeNull();
        expect(getInner().style.transform).toBe('');

        rerender({ placement: 'right', visible: false, motion: false });
        expect(getRoot()).toBeNull();
    });

    it('closeIcon', () => {
        renderSideSheet({ visible: true, closeIcon: <IconEyeClosed /> });
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-eye_closed`)).toHaveLength(1);
        expect(screen.getByRole('button', { name: zh_CN.SideSheet.close })).toContainElement($(`.${BASE_CLASS_PREFIX}-icon-eye_closed`));
    });
});

describe('SideSheet 行为', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('afterVisibleChange 显式为 null 时关闭不抛错', () => {
        holdAnimations();
        const { rerender } = renderSideSheet({ visible: true, afterVisibleChange: null as unknown as VisibleHandler });
        rerender({ visible: false, afterVisibleChange: null as unknown as VisibleHandler });
        animationEnd(getInner());
        expect(getRoot()).toBeNull();
    });

    it('离场动画期间保留 DOM，动画结束后卸载', () => {
        holdAnimations();
        const afterVisibleChange = vi.fn<VisibleHandler>();
        const { rerender } = renderSideSheet({ visible: true, afterVisibleChange });
        expect(getInner()).toHaveClass(`${prefix}-animation-content_show_right`);
        expect(getMask()).toHaveClass(`${prefix}-animation-mask_show`);
        expect(afterVisibleChange).not.toHaveBeenCalled();

        rerender({ visible: false, afterVisibleChange });
        expect(getRoot()).not.toBeNull();
        expect(getInner()).toHaveClass(`${prefix}-animation-content_hide_right`);
        expect(getMask()).toHaveClass(`${prefix}-animation-mask_hide`);
        expect(afterVisibleChange).not.toHaveBeenCalled();

        animationEnd(getInner());
        expect(getRoot()).toBeNull();
        expect(afterVisibleChange).toHaveBeenCalledTimes(1);
        expect(afterVisibleChange).toHaveBeenLastCalledWith(false);

        rerender({ visible: true, afterVisibleChange });
        expect(afterVisibleChange).toHaveBeenCalledTimes(2);
        expect(afterVisibleChange).toHaveBeenLastCalledWith(true);
        animationEnd(getInner());
        animationEnd(getMask());
        expect(afterVisibleChange).toHaveBeenCalledTimes(2);
        expect(getInner()).not.toHaveClass(`${prefix}-animation-content_show_right`);
    });

    it('页面没有 CSS 动画时离场立即卸载', () => {
        const afterVisibleChange = vi.fn<VisibleHandler>();
        const { rerender } = renderSideSheet({ visible: true, afterVisibleChange });
        rerender({ visible: false, afterVisibleChange });
        expect(getRoot()).toBeNull();
        expect(afterVisibleChange).toHaveBeenCalledTimes(1);
        expect(afterVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('没有动画时每次可见性变化只报告一次，挂载时不报告', () => {
        const afterVisibleChange = vi.fn<VisibleHandler>();
        const { rerender, unmount } = renderSideSheet({ visible: true, motion: false, afterVisibleChange });
        expect(afterVisibleChange).not.toHaveBeenCalled();
        rerender({ visible: false, motion: false, afterVisibleChange });
        expect(getRoot()).toBeNull();
        expect(afterVisibleChange).toHaveBeenCalledTimes(1);
        expect(afterVisibleChange).toHaveBeenLastCalledWith(false);
        rerender({ visible: true, motion: false, afterVisibleChange });
        expect(afterVisibleChange).toHaveBeenCalledTimes(2);
        expect(afterVisibleChange).toHaveBeenLastCalledWith(true);
        unmount();
        expect(afterVisibleChange).toHaveBeenCalledTimes(3);
        expect(afterVisibleChange).toHaveBeenLastCalledWith(false);

        const onHiddenMount = vi.fn<VisibleHandler>();
        renderSideSheet({ visible: false, afterVisibleChange: onHiddenMount });
        expect(onHiddenMount).not.toHaveBeenCalled();
    });

    it('父组件挂载时就打开，报告 afterVisibleChange(true)', () => {
        const afterVisibleChange = vi.fn<VisibleHandler>();
        function Demo() {
            const [visible, setVisible] = createSignal(false);
            onMount(() => setVisible(true));
            return (
                <SideSheet visible={visible()} afterVisibleChange={afterVisibleChange}>
                    content
                </SideSheet>
            );
        }
        render(() => <Demo />);
        expect(getRoot()).not.toBeNull();
        expect(afterVisibleChange).toHaveBeenCalledTimes(1);
        expect(afterVisibleChange).toHaveBeenLastCalledWith(true);
    });

    it.each(['left', 'right'] as const)('placement 为 %s 时占满高度，宽度取自 size', (placement) => {
        renderSideSheet({ visible: true, placement });
        expect(getRoot()).toHaveClass(`${prefix}-${placement}`);
        expect(getRoot()).not.toHaveClass(`${prefix}-horizontal`);
        expect(getInner()).toHaveClass(`${prefix}-size-small`);
        expect(getInner().style.height).toBe('100%');
        expect(getInner().style.width).toBe('');
    });

    it.each(['top', 'bottom'] as const)('placement 为 %s 时占满宽度，高度使用默认值', (placement) => {
        renderSideSheet({ visible: true, placement, width: 300 });
        expect(getRoot()).toHaveClass(`${prefix}-${placement}`);
        expect(getRoot()).toHaveClass(`${prefix}-horizontal`);
        expect(getInner().style.width).toBe('100%');
        expect(getInner().style.height).toBe('448px');
    });

    it('canVerticalSetWidth 让上下抽屉使用 width', () => {
        renderSideSheet({ visible: true, placement: 'top', width: 300, canVerticalSetWidth: true });
        expect(getInner().style.width).toBe('300px');
    });

    it('无遮罩时宽度设置在固定定位的外层容器上', () => {
        renderSideSheet({ visible: true, mask: false, width: 300 });
        expect(getRoot()).toHaveClass(`${prefix}-fixed`);
        expect(getRoot()).toHaveClass(`${prefix}-size-small`);
        expect(getRoot()?.style.width).toBe('300px');
        expect(getInner().style.width).toBe('100%');
    });

    it('渲染标题、页脚和头部插槽', () => {
        const { rerender } = renderSideSheet({ visible: true, title: 'T', footer: 'F' });
        expect($(`.${prefix}-title`)).toHaveAttribute('x-semi-prop', 'title');
        expect($(`.${prefix}-footer`)).toHaveAttribute('x-semi-prop', 'footer');
        expect($(`.${prefix}-footer`)?.textContent).toBe('F');
        expect($(`.${prefix}-body`)).toHaveAttribute('x-semi-prop', 'children');
        expect(screen.getByRole('heading', { name: 'T' })).toHaveClass(`${prefix}-title`);
        expect(screen.getByRole('dialog', { name: 'T' })).toBe(getInner());
        rerender({ visible: true });
        expect($(`.${prefix}-title`)).toBeNull();
        expect($(`.${prefix}-footer`)).toBeNull();
    });

    it('点击遮罩本身时关闭，点击面板内部时不关闭', async () => {
        const onCancel = vi.fn<CancelHandler>();
        renderSideSheet({ visible: true, onCancel });
        await userEvent.click(getInner());
        expect(onCancel).not.toHaveBeenCalled();
        await userEvent.click(getMask());
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onCancel.mock.calls[0][0].type).toBe('click');
        expect(getRoot()).not.toBeNull();
    });

    it('title 与 footer 为 0 时照常渲染，对话框由 0 命名', () => {
        renderSideSheet({ visible: true, title: 0, footer: 0 });
        expect($(`.${prefix}-title`)).toHaveTextContent(/^0$/);
        expect($(`.${prefix}-footer`)).toHaveTextContent(/^0$/);
        expect(screen.getByRole('dialog', { name: '0' })).toBeInTheDocument();
    });

    it('离场动画期间再次点击遮罩或关闭按钮不再触发 onCancel', () => {
        holdAnimations();
        const onCancel = vi.fn<CancelHandler>();
        const { rerender } = renderSideSheet({ visible: true, onCancel });
        fireEvent.click(getMask());
        expect(onCancel).toHaveBeenCalledTimes(1);

        rerender({ visible: false, onCancel });
        expect(getRoot()).not.toBeNull();
        fireEvent.click(getMask());
        fireEvent.click(screen.getByRole('button', { name: zh_CN.SideSheet.close }));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('仅在可见且设置 closeOnEsc 时按 Esc 关闭，并读取最新属性', () => {
        const onCancel = vi.fn<CancelHandler>();
        const { rerender, unmount } = renderSideSheet({ visible: true, onCancel });
        pressEsc();
        expect(onCancel).not.toHaveBeenCalled();

        rerender({ visible: true, onCancel, closeOnEsc: true });
        pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onCancel.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
        expectTypeOf<Parameters<CancelHandler>[0]>().toEqualTypeOf<MouseEvent | KeyboardEvent>();

        const onCancel2 = vi.fn<CancelHandler>();
        rerender({ visible: true, onCancel: onCancel2, closeOnEsc: true });
        pressEsc();
        expect(onCancel2).toHaveBeenCalledTimes(1);

        rerender({ visible: false, onCancel: onCancel2, closeOnEsc: true });
        pressEsc();
        expect(onCancel2).toHaveBeenCalledTimes(1);

        rerender({ visible: true, onCancel: onCancel2, closeOnEsc: true });
        unmount();
        pressEsc();
        expect(onCancel2).toHaveBeenCalledTimes(1);
    });

    it('隐藏状态挂载时不监听 Esc', () => {
        const onCancel = vi.fn<CancelHandler>();
        renderSideSheet({ visible: false, closeOnEsc: true, onCancel });
        pressEsc();
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('keepDOM 从一开始就以隐藏状态渲染，关闭后保留内容', () => {
        const { rerender } = renderSideSheet({ visible: false, keepDOM: true, motion: false });
        expect(getRoot()).toHaveClass(`${prefix}-hidden`);
        rerender({ visible: true, keepDOM: true, motion: false });
        expect(getRoot()).not.toHaveClass(`${prefix}-hidden`);
        rerender({ visible: false, keepDOM: true, motion: false });
        expect(getRoot()).toHaveClass(`${prefix}-hidden`);
        expect($(`.${prefix}-body`)?.textContent).toBe('This is content of basic sideSheet');
    });

    it('keepDOM 有动画时，离场动画结束后隐藏', () => {
        holdAnimations();
        const { rerender } = renderSideSheet({ visible: true, keepDOM: true });
        rerender({ visible: false, keepDOM: true });
        expect(getRoot()).not.toHaveClass(`${prefix}-hidden`);
        animationEnd(getMask());
        expect(getRoot()).toHaveClass(`${prefix}-hidden`);
        rerender({ visible: true, keepDOM: true });
        expect(getRoot()).not.toHaveClass(`${prefix}-hidden`);
    });

    it('打开后又在进场动画结束前关闭，仍然播放离场动画', () => {
        holdAnimations();
        const { rerender } = renderSideSheet({ visible: false });
        rerender({ visible: true });
        rerender({ visible: false });
        expect(getRoot()).not.toBeNull();
        expect(getInner()).toHaveClass(`${prefix}-animation-content_hide_right`);
    });

    it('可见时锁定 body 滚动，并恢复之前的 overflow 和结束内边距', () => {
        document.body.style.overflow = 'auto';
        document.body.style.paddingInlineEnd = '4px';
        const { rerender, unmount } = renderSideSheet({ visible: true, motion: false });
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.body.style.paddingInlineEnd).not.toBe('4px');

        rerender({ visible: false, motion: false });
        expect(document.body.style.overflow).toBe('auto');
        expect(document.body.style.paddingInlineEnd).toBe('4px');

        rerender({ visible: true, motion: false });
        expect(document.body.style.overflow).toBe('hidden');
        unmount();
        expect(document.body.style.overflow).toBe('auto');
        expect(document.body.style.paddingInlineEnd).toBe('4px');
    });

    it('mask 为 false 时位于 body 的抽屉不锁 body 滚动', () => {
        renderSideSheet({ visible: true, mask: false, motion: false });
        expect(document.body.style.overflow).not.toBe('hidden');
    });

    it('隐藏状态挂载或卸载，或已经隐藏时，不改动 body 滚动', () => {
        const { unmount } = renderSideSheet({ visible: false });
        document.body.style.overflow = 'scroll';
        unmount();
        expect(document.body.style.overflow).toBe('scroll');

        document.body.style.overflow = 'hidden';
        document.body.style.width = '80%';
        const { rerender } = renderSideSheet({ visible: true, motion: false });
        expect(document.body.style.width).toBe('80%');
        rerender({ visible: false, motion: false });
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.body.style.width).toBe('80%');
        document.body.style.width = '';
    });

    it('渲染到 getPopupContainer 中，且定位为 static', () => {
        render(() => (
            <div class="sidesheet-container">
                <SideSheet getPopupContainer={() => document.querySelector<HTMLElement>('.sidesheet-container') as HTMLElement} visible />
            </div>
        ));
        expect(getRoot()).toHaveClass(`${prefix}-popup`);
        const portal = getPortal();
        expect(portal.parentElement).toHaveClass('sidesheet-container');
        expect(portal.style.position).toBe('static');
        expect(portal.style.zIndex).toBe('1000');
        expect(document.body.style.overflow).toBe('');
    });

    it('仅当遮罩覆盖整个页面时才设置 aria-modal，并与页面 inert 一致', () => {
        const page = document.body.appendChild(document.createElement('main'));
        const container = document.body.appendChild(document.createElement('div'));
        const cases: [SideSheetProps, string | null, boolean][] = [
            [{}, 'true', true],
            [{ mask: false }, null, false],
            [{ getPopupContainer: () => container }, null, false],
            [{ getPopupContainer: () => document.body }, 'true', true],
            [{ mask: false, 'aria-modal': 'true' }, 'true', false],
        ];
        for (const [props, ariaModal, inert] of cases) {
            const view = renderSideSheet({ visible: true, title: 'Sheet', motion: false, ...props });
            expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe(ariaModal);
            expect(page.inert).toBe(inert);
            view.unmount();
        }
        page.remove();
        container.remove();
    });

    it('ConfigProvider 提供的 getPopupContainer 与 prop 一样使抽屉非模态', () => {
        const page = document.body.appendChild(document.createElement('main'));
        const container = document.body.appendChild(document.createElement('div'));
        render(() => (
            <ConfigProvider getPopupContainer={() => container}>
                <SideSheet title="Sheet" motion={false} visible>
                    <p>content</p>
                </SideSheet>
            </ConfigProvider>
        ));
        const dialog = screen.getByRole('dialog');
        expect(dialog).not.toHaveAttribute('aria-modal');
        expect(page.inert).toBeFalsy();
        expect(document.body.style.overflow).toBe('');
        expect(getRoot()).toHaveClass(`${prefix}-popup`);
        expect(getPortal().style.position).toBe('static');
        expect(getPortal().parentElement).toBe(container);
        page.remove();
        container.remove();
    });

    it('ConfigProvider 的 direction 落在 portal 容器上', () => {
        render(() => (
            <ConfigProvider direction="rtl">
                <SideSheet title="Sheet" motion={false} visible />
            </ConfigProvider>
        ));
        expect(getPortal()).toHaveAttribute('dir', 'rtl');
    });

    it('关闭按钮的名称来自语言包', () => {
        render(() => (
            <LocaleProvider locale={en_US}>
                <SideSheet title="Sheet" motion={false} visible />
            </LocaleProvider>
        ));
        expect(screen.getByRole('button', { name: en_US.SideSheet.close })).toHaveClass(`${prefix}-close`);
    });

    it('非模态抽屉不锁 Tab，关闭时焦点已移到别处则不抢回', () => {
        const container = document.body.appendChild(document.createElement('div'));
        const other = document.body.appendChild(document.createElement('button'));
        const props = { motion: false, title: 'Sheet', getPopupContainer: () => container };
        const { rerender } = renderSideSheet({ visible: true, ...props });
        const close = screen.getByRole('button', { name: zh_CN.SideSheet.close });
        close.focus();
        const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
        close.dispatchEvent(tab);
        expect(tab.defaultPrevented).toBe(false);
        other.focus();
        rerender({ visible: false, ...props });
        expect(other).toHaveFocus();
        other.remove();
        container.remove();
    });

    it('getPopupContainer 返回 body 时与默认一致：锁 body 滚动，不加 popup 类', () => {
        renderSideSheet({ visible: true, motion: false, getPopupContainer: () => document.body });
        expect(getRoot()).not.toHaveClass(`${prefix}-popup`);
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('在 Tooltip 类弹层中打开时，向外层登记自己的容器', () => {
        const registered: (() => HTMLElement | undefined)[] = [];
        const unregister = vi.fn<() => void>();
        const popups: TooltipPopups = {
            register: (popup) => {
                registered.push(popup as () => HTMLElement | undefined);
                return unregister;
            },
            relay: () => {},
        };
        const view = renderSideSheet({ visible: true, motion: false });
        view.unmount();
        const { unmount } = render(() => (
            <TooltipPopupsContext.Provider value={popups}>
                <SideSheet title="Sheet" motion={false} visible />
            </TooltipPopupsContext.Provider>
        ));
        expect(registered).toHaveLength(1);
        expect(registered[0]()).toBe(getPortal());
        unmount();
        expect(unregister).toHaveBeenCalledTimes(1);
    });

    it('打开期间属性更新不重建弹层容器，焦点留在原处', () => {
        const container = document.body.appendChild(document.createElement('div'));
        const props = { visible: true, motion: false, title: 'Sheet', getPopupContainer: () => container };
        const { rerender } = renderSideSheet(props);
        const portal = getPortal();
        const close = screen.getByRole('button', { name: zh_CN.SideSheet.close });
        close.focus();
        rerender({ ...props, title: 'Renamed' });
        expect(getPortal()).toBe(portal);
        expect(close).toHaveFocus();
        container.remove();
    });

    it('data-* 属性设置在 sidesheet 外层容器上', () => {
        renderSideSheet({ visible: true, 'data-testid': 'sheet', 'data-foo': 'bar' });
        const node = screen.getByTestId('sheet');
        expect(node).toBe(getRoot());
        expect(node).toHaveAttribute('data-foo', 'bar');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { SideSheet: { placement: 'left', closable: false } };
        const { unmount } = renderSideSheet({ visible: true });
        expect(getRoot()).toHaveClass(`${prefix}-left`);
        expect($(`.${prefix}-close`)).toBeNull();
        unmount();
        renderSideSheet({ visible: true, placement: 'top' });
        expect(getRoot()).toHaveClass(`${prefix}-top`);
    });

    it('锁定滚动，并且只注册一次 Esc 监听', () => {
        document.body.style.overflow = 'auto';
        const onCancel = vi.fn<CancelHandler>();
        const afterVisibleChange = vi.fn<VisibleHandler>();
        const { rerender, unmount } = renderSideSheet({ afterVisibleChange, closeOnEsc: true, motion: false, visible: true, onCancel });
        expect(document.querySelectorAll(`div.${prefix}`)).toHaveLength(1);
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-portal`)).toHaveLength(1);
        expect(document.body.style.overflow).toBe('hidden');
        pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(afterVisibleChange).not.toHaveBeenCalled();

        rerender({ afterVisibleChange, closeOnEsc: true, motion: false, visible: false, onCancel });
        expect(document.body.style.overflow).toBe('auto');
        expect(afterVisibleChange).toHaveBeenCalledTimes(1);
        pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(1);

        rerender({ afterVisibleChange, closeOnEsc: true, motion: false, visible: true, onCancel });
        unmount();
        expect(document.body.style.overflow).toBe('auto');
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-portal`)).toHaveLength(0);
    });

    it('有遮罩时打开后获取焦点，页面设为 inert，关闭后归还焦点', () => {
        const opener = document.body.appendChild(document.createElement('button'));
        opener.focus();
        const { rerender } = renderSideSheet({ visible: true, motion: false, title: 'Sheet' });
        const dialog = screen.getByRole('dialog', { name: 'Sheet' });
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
        expect(opener.inert).toBe(true);
        rerender({ visible: false, motion: false, title: 'Sheet' });
        expect(opener.inert).toBe(false);
        expect(opener).toHaveFocus();
        opener.remove();
    });

    it('无遮罩时获取焦点但页面仍可用，且仅从面板内部关闭时归还焦点', () => {
        const opener = document.body.appendChild(document.createElement('button'));
        const other = document.body.appendChild(document.createElement('button'));
        opener.focus();
        const props = { motion: false, mask: false, title: 'Sheet' };
        const { rerender } = renderSideSheet({ visible: true, ...props });
        const dialog = screen.getByRole('dialog', { name: 'Sheet' });
        expect(dialog).not.toHaveAttribute('aria-modal');
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
        expect(opener.inert).toBeFalsy();
        rerender({ visible: false, ...props });
        expect(opener).toHaveFocus();

        rerender({ visible: true, ...props });
        other.focus();
        rerender({ visible: false, ...props });
        expect(other).toHaveFocus();
        opener.remove();
        other.remove();
    });

    it('autofocus 的元素在打开时获得焦点', () => {
        renderSideSheet({ visible: true, motion: false, title: 'Sheet' }, () => <input aria-label="name" autofocus />);
        expect(screen.getByLabelText('name')).toHaveFocus();
    });

    it('隐藏状态挂载时，不改动已有的 body 锁定', () => {
        document.body.style.overflow = 'hidden';
        document.body.style.width = '80%';
        const { unmount } = renderSideSheet({ visible: false });
        expect(document.body.style.overflow).toBe('hidden');
        unmount();
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.body.style.width).toBe('80%');
        document.body.style.width = '';
    });
});

describe('SideSheet 属性落点', () => {
    it('ref 绑定到 sidesheet 外层容器', () => {
        let ref: HTMLDivElement | undefined;
        renderSideSheet({ visible: true, ref: (node: HTMLDivElement) => (ref = node) });
        expect(ref).toBe(getRoot());
    });

    it('通过 aria-label 为对话框命名', () => {
        renderSideSheet({ visible: true, 'aria-label': 'Settings' });
        expect(screen.getByRole('dialog', { name: 'Settings' })).toBe(getInner());
        expect(getRoot()).not.toHaveAttribute('aria-label');
    });

    it('aria-labelledby、aria-describedby 和 aria-modal 落在对话框上，data-* 落在外层容器上', () => {
        renderSideSheet({
            visible: true,
            'aria-labelledby': 'outside-label',
            'aria-describedby': 'outside-desc',
            'aria-modal': 'true',
            'data-foo': 'bar',
        });
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBe(getInner());
        expect(dialog).toHaveAttribute('aria-labelledby', 'outside-label');
        expect(dialog).toHaveAttribute('aria-describedby', 'outside-desc');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).not.toHaveAttribute('data-foo');
        expect(getRoot()).toHaveAttribute('data-foo', 'bar');
        for (const name of ['aria-labelledby', 'aria-describedby', 'aria-modal']) {
            expect(getRoot()).not.toHaveAttribute(name);
        }
    });

    it('其余 aria-* 也落在对话框上，外层容器没有', () => {
        renderSideSheet({ visible: true, 'aria-roledescription': 'sheet', 'aria-details': 'extra' });
        const dialog = screen.getByRole('dialog');
        for (const [name, value] of [
            ['aria-roledescription', 'sheet'],
            ['aria-details', 'extra'],
        ]) {
            expect(dialog).toHaveAttribute(name, value);
            expect(getRoot()).not.toHaveAttribute(name);
        }
    });

    it('未知属性设置在 sidesheet 外层容器上', () => {
        renderSideSheet({ visible: true, id: 'sheet', role: 'presentation' });
        expect(getRoot()).toHaveAttribute('id', 'sheet');
        expect(getRoot()).toHaveAttribute('role', 'presentation');
    });

    it('显示中卸载时只报告一次 afterVisibleChange(false)', () => {
        const afterVisibleChange = vi.fn<VisibleHandler>();
        const shown = renderSideSheet({ afterVisibleChange, motion: false, visible: true });
        expect(afterVisibleChange).not.toHaveBeenCalled();
        shown.unmount();
        expect(afterVisibleChange).toHaveBeenCalledTimes(1);
        expect(afterVisibleChange).toHaveBeenLastCalledWith(false);

        const neverShown = vi.fn<VisibleHandler>();
        const hidden = renderSideSheet({ afterVisibleChange: neverShown, visible: false });
        hidden.unmount();
        expect(neverShown).not.toHaveBeenCalled();
    });
});

describe('SideSheet 对话框名称警告', () => {
    let warn: MockInstance<typeof console.warn>;
    const nameWarnings = () => warn.mock.calls.filter(([message]) => String(message).includes('[Semi SideSheet]'));

    beforeEach(() => {
        warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    it('没有名称打开时只警告一次', () => {
        render(() => <SideSheet motion={false} visible />);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(nameWarnings()).toHaveLength(1);
    });

    it('有 title 时不警告', () => {
        render(() => <SideSheet title="Named" motion={false} visible />);
        expect(screen.getByRole('dialog', { name: 'Named' })).toBeInTheDocument();
        expect(nameWarnings()).toHaveLength(0);
    });

    it('SideSheetState 是空对象类型，没有字段', () => {
        expectTypeOf<keyof SideSheetState>().toBeNever();
    });
});
