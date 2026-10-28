import type React from 'react';
import { Activity, StrictMode, createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconEyeClosed } from '@fibrae/semi-icons-react';
import { ConfigProvider, SideSheet } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { SideSheetReactProps, SideSheetState } from '../index';

type CancelHandler = NonNullable<SideSheetReactProps['onCancel']>;

function getSideSheet(SideSheetProps?, children?) {
    let props = SideSheetProps ? SideSheetProps : {};
    return <SideSheet {...props}>{children ? children : <p>This is content of basic sideSheet</p>}</SideSheet>;
}

function renderSideSheet(props?, children?) {
    const result = render(getSideSheet(props, children));
    return { ...result, rerender: (nextProps) => result.rerender(getSideSheet(nextProps, children)) };
}

const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
const getInner = () => $(`.${BASE_CLASS_PREFIX}-sidesheet-inner`);

describe('SideSheet', () => {
    it('className / style / maskStyle / bodyStyle / headerStyle / zIndex', () => {
        renderSideSheet({
            className: 'test',
            style: { color: 'red' },
            visible: true,
            maskStyle: { color: 'grey' },
            headerStyle: { color: 'green' },
            bodyStyle: { color: 'pink' },
            zIndex: 500,
        });
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet.test`)).not.toBeNull();
        expect(getInner()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-body`)).toHaveStyle({ color: 'rgb(255, 192, 203)' });
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-header`)).toHaveStyle({ color: 'rgb(0, 128, 0)' });
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-mask`)).toHaveStyle({ color: 'rgb(128, 128, 128)' });
        expect($(`.${BASE_CLASS_PREFIX}-portal`).style.zIndex).toEqual('500');
    });

    it('visible 属性', () => {
        const { rerender } = renderSideSheet();
        expect($(`div.${BASE_CLASS_PREFIX}-sidesheet`)).toBeNull();
        rerender({ visible: true });
        expect($(`div.${BASE_CLASS_PREFIX}-sidesheet`)).not.toBeNull();
    });

    it('基础用例', () => {
        renderSideSheet({ placement: 'bottom', visible: true });
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-bottom`)).not.toBeNull();
    });

    it('不同位置', () => {
        const { rerender } = renderSideSheet({ placement: 'top', visible: true });
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-top`)).not.toBeNull();
        rerender({ placement: 'bottom', visible: true });
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-bottom`)).not.toBeNull();
        rerender({ placement: 'left', visible: true });
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-left`)).not.toBeNull();
        rerender({ placement: 'right', visible: true });
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-right`)).not.toBeNull();
    });

    it('基础渲染', () => {
        renderSideSheet({ title: 'SemiTitle', visible: true });
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-title`).textContent).toEqual('SemiTitle');
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-body`).textContent).toEqual('This is content of basic sideSheet');
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
        let props = { width: '413px', visible: true };
        const { rerender } = renderSideSheet(props);
        const update = (nextProps) => {
            props = { ...props, ...nextProps };
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
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-close`)).not.toBeNull();
        unmount();

        renderSideSheet({ closable: false, visible: true });
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-close`)).toBeNull();
    });

    it('maskClosable', async () => {
        let spyOnCancel = vi.fn<CancelHandler>();
        let spyOnCancel2 = vi.fn<CancelHandler>();
        const { unmount } = renderSideSheet({
            maskClosable: true,
            visible: true,
            onCancel: spyOnCancel,
        });
        await userEvent.click($(`.${BASE_CLASS_PREFIX}-sidesheet-mask`));
        expect(spyOnCancel).toHaveBeenCalledTimes(1);
        unmount();

        renderSideSheet({
            maskClosable: false,
            visible: true,
            onCancel: spyOnCancel2,
        });
        await userEvent.click($(`.${BASE_CLASS_PREFIX}-sidesheet-mask`));
        expect(spyOnCancel2).not.toHaveBeenCalled();
    });

    it('onCancel', async () => {
        let spyOnCancel = vi.fn<CancelHandler>();
        renderSideSheet({
            visible: true,
            onCancel: spyOnCancel,
        });
        await userEvent.click($(`button.${BASE_CLASS_PREFIX}-sidesheet-close`));
        expect(spyOnCancel).toHaveBeenCalledTimes(1);
    });

    it('无遮罩', () => {
        renderSideSheet({
            mask: false,
            visible: true,
        });
        expect($(`div.${BASE_CLASS_PREFIX}-sidesheet`)).not.toBeNull();
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-mask`)).toBeNull();
    });

    it('getPopupContainer', () => {
        const { unmount } = render(
            <div
                className="sidesheet-container"
                style={{
                    height: 320,
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                <SideSheet getPopupContainer={() => document.querySelector('.sidesheet-container')} visible />
            </div>
        );
        const sideSheets = document.querySelectorAll<HTMLElement>(`div.${BASE_CLASS_PREFIX}-sidesheet`);
        expect(sideSheets).toHaveLength(1);
        expect($('.sidesheet-container')).toContainElement(sideSheets[0]);
        expect(document.body.style.overflow).not.toEqual('hidden');
        unmount();

        render(
            <div
                className="sidesheet-container"
                style={{
                    height: 320,
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                <SideSheet visible />
            </div>
        );
        expect($(`div.${BASE_CLASS_PREFIX}-sidesheet`)).not.toBeNull();
        expect($('.sidesheet-container').querySelector(`.${BASE_CLASS_PREFIX}-sidesheet`)).toBeNull();
    });

    it('motion 为 false', () => {
        const { rerender } = renderSideSheet({ placement: 'top', visible: true, motion: false });
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-top`)).not.toBeNull();
        expect(getInner().style.transform).toBe('');
        rerender({ placement: 'bottom', visible: true, motion: false });
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-bottom`)).not.toBeNull();
        expect(getInner().style.transform).toBe('');
        rerender({ placement: 'left', visible: true, motion: false });
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-left`)).not.toBeNull();
        expect(getInner().style.transform).toBe('');
        rerender({ placement: 'right', visible: true, motion: false });
        expect($(`.${BASE_CLASS_PREFIX}-sidesheet-right`)).not.toBeNull();
        expect(getInner().style.transform).toBe('');

        rerender({ placement: 'right', visible: false, motion: false });
        expect($(`div.${BASE_CLASS_PREFIX}-sidesheet`)).toBeNull();
    });

    it('closeIcon', () => {
        renderSideSheet({
            visible: true,
            closeIcon: <IconEyeClosed />,
        });
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-eye_closed`)).toHaveLength(1);
        expect(screen.getByRole('button', { name: zh_CN.SideSheet.close })).toContainElement($(`.${BASE_CLASS_PREFIX}-icon-eye_closed`));
    });
});

const prefix = `${BASE_CLASS_PREFIX}-sidesheet`;
const getRoot = () => $(`div.${prefix}`);
const getMask = () => $(`.${prefix}-mask`);
// jsdom has no AnimationEvent, which makes React listen for the webkit-prefixed event name
const animationEnd = (node) => fireEvent(node, new Event('webkitAnimationEnd', { bubbles: true }));
const pressEsc = () => fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });

describe('SideSheet 行为', () => {
    beforeEach(() => {
        document.body.style.overflow = '';
        document.body.style.paddingInlineEnd = '';
    });

    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
        document.body.style.overflow = '';
        document.body.style.paddingInlineEnd = '';
    });

    it('afterVisibleChange 显式为 null 时关闭不抛错', () => {
        const { rerender } = renderSideSheet({ visible: true, afterVisibleChange: null });
        rerender({ visible: false, afterVisibleChange: null });
        animationEnd(getInner());
        expect(getRoot()).toBeNull();
    });

    it('离场动画期间保留 DOM，动画结束后卸载', () => {
        const afterVisibleChange = vi.fn<(visible: boolean) => void>();
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

    it('没有动画时每次可见性变化只报告一次，挂载时不报告', () => {
        const afterVisibleChange = vi.fn<(visible: boolean) => void>();
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
        expect(afterVisibleChange).toHaveBeenCalledTimes(2);

        const onHiddenMount = vi.fn<(visible: boolean) => void>();
        renderSideSheet({ visible: false, afterVisibleChange: onHiddenMount });
        expect(onHiddenMount).not.toHaveBeenCalled();
    });

    it.each(['left', 'right'])('placement 为 %s 时占满高度，宽度取自 size', (placement) => {
        renderSideSheet({ visible: true, placement });
        expect(getRoot()).toHaveClass(`${prefix}-${placement}`);
        expect(getRoot()).not.toHaveClass(`${prefix}-horizontal`);
        expect(getInner()).toHaveClass(`${prefix}-size-small`);
        expect(getInner().style.height).toBe('100%');
        expect(getInner().style.width).toBe('');
    });

    it.each(['top', 'bottom'])('placement 为 %s 时占满宽度，高度使用默认值', (placement) => {
        renderSideSheet({ visible: true, placement, width: 300 });
        expect(getRoot()).toHaveClass(`${prefix}-${placement}`);
        expect(getRoot()).toHaveClass(`${prefix}-horizontal`);
        expect(getInner().style.width).toBe('100%');
        expect(getInner().style.height).toBe('448px');
    });

    it('无遮罩时宽度设置在固定定位的外层容器上', () => {
        renderSideSheet({ visible: true, mask: false, width: 300 });
        expect(getRoot()).toHaveClass(`${prefix}-fixed`);
        expect(getRoot()).toHaveClass(`${prefix}-size-small`);
        expect(getRoot().style.width).toBe('300px');
        expect(getInner().style.width).toBe('100%');
    });

    it('渲染标题、页脚和头部插槽', () => {
        const { rerender } = renderSideSheet({ visible: true, title: 'T', footer: 'F' });
        expect($(`.${prefix}-title`)).toHaveAttribute('x-semi-prop', 'title');
        expect($(`.${prefix}-footer`)).toHaveAttribute('x-semi-prop', 'footer');
        expect($(`.${prefix}-footer`).textContent).toBe('F');
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
        const onCancel = vi.fn<CancelHandler>();
        const { rerender } = renderSideSheet({ visible: true, onCancel });
        fireEvent.click(getMask());
        expect(onCancel).toHaveBeenCalledTimes(1);

        // jsdom fires no animationend, so the sheet stays in its leave state
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
        expect('nativeEvent' in onCancel.mock.calls[0][0]).toBe(false);
        expectTypeOf<Parameters<CancelHandler>[0]>().toEqualTypeOf<React.MouseEvent | KeyboardEvent>();

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
        expect($(`.${prefix}-body`).textContent).toBe('This is content of basic sideSheet');
    });

    it('keepDOM 有动画时，离场动画结束后隐藏', () => {
        const { rerender } = renderSideSheet({ visible: true, keepDOM: true });
        rerender({ visible: false, keepDOM: true });
        expect(getRoot()).not.toHaveClass(`${prefix}-hidden`);
        animationEnd(getMask());
        expect(getRoot()).toHaveClass(`${prefix}-hidden`);
        rerender({ visible: true, keepDOM: true });
        expect(getRoot()).not.toHaveClass(`${prefix}-hidden`);
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
    });

    it('渲染到 getPopupContainer 中，且定位为 static', () => {
        render(
            <div className="sidesheet-container">
                <SideSheet getPopupContainer={() => document.querySelector('.sidesheet-container')} visible />
            </div>
        );
        expect(getRoot()).toHaveClass(`${prefix}-popup`);
        const portal = $(`.${BASE_CLASS_PREFIX}-portal`);
        expect(portal.parentElement).toHaveClass('sidesheet-container');
        expect(portal.style.position).toBe('static');
        expect(portal.style.zIndex).toBe('1000');
        expect(document.body.style.overflow).toBe('');
    });

    it('仅当遮罩覆盖整个页面时才设置 aria-modal，并与页面 inert 一致', () => {
        const page = document.body.appendChild(document.createElement('main'));
        const container = document.body.appendChild(document.createElement('div'));
        const cases: [object, string | null, boolean][] = [
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
        render(
            <ConfigProvider getPopupContainer={() => container}>
                <SideSheet title="Sheet" motion={false} visible>
                    <p>content</p>
                </SideSheet>
            </ConfigProvider>
        );
        const dialog = screen.getByRole('dialog');
        expect(dialog).not.toHaveAttribute('aria-modal');
        expect(page.inert).toBeFalsy();
        expect(document.body.style.overflow).toBe('');
        expect(getRoot()).toHaveClass(`${prefix}-popup`);
        expect($(`.${BASE_CLASS_PREFIX}-portal`).style.position).toBe('static');
        page.remove();
        container.remove();
    });

    it('非模态抽屉不锁 Tab，关闭时焦点已移到别处则不抢回', () => {
        const container = document.body.appendChild(document.createElement('div'));
        const other = document.body.appendChild(document.createElement('button'));
        const { rerender } = renderSideSheet({
            visible: true,
            motion: false,
            title: 'Sheet',
            getPopupContainer: () => container,
        });
        const close = screen.getByRole('button', { name: zh_CN.SideSheet.close });
        close.focus();
        const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
        close.dispatchEvent(tab);
        expect(tab.defaultPrevented).toBe(false);
        other.focus();
        rerender({ visible: false, motion: false, title: 'Sheet', getPopupContainer: () => container });
        expect(other).toHaveFocus();
        other.remove();
        container.remove();
    });

    it('getPopupContainer 返回 body 时与默认一致：锁 body 滚动，不加 popup 类', () => {
        renderSideSheet({ visible: true, motion: false, getPopupContainer: () => document.body });
        expect(getRoot()).not.toHaveClass(`${prefix}-popup`);
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('Activity 隐藏显示中的 SideSheet 视同关闭：上报一次 afterVisibleChange(false) 并解除 body 锁定，重新显示后再次锁定', async () => {
        const afterVisibleChange = vi.fn<(visible: boolean) => void>();
        const view = (mode: 'visible' | 'hidden') => <Activity mode={mode}>{getSideSheet({ visible: true, motion: false, afterVisibleChange })}</Activity>;
        const { rerender } = render(view('visible'));
        expect(document.body.style.overflow).toBe('hidden');
        rerender(view('hidden'));
        await act(async () => {});
        expect(afterVisibleChange).toHaveBeenCalledWith(false);
        expect(afterVisibleChange.mock.calls.filter(([visible]) => !visible)).toHaveLength(1);
        expect(document.body.style.overflow).toBe('');
        rerender(view('visible'));
        await act(async () => {});
        expect(document.body.style.overflow).toBe('hidden');
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

    it('StrictMode 下锁定滚动，并且只注册一次 Esc 监听', () => {
        document.body.style.overflow = 'auto';
        const onCancel = vi.fn<CancelHandler>();
        const afterVisibleChange = vi.fn<(visible: boolean) => void>();
        const sheet = (visible) => (
            <StrictMode>
                <SideSheet afterVisibleChange={afterVisibleChange} closeOnEsc motion={false} visible={visible} onCancel={onCancel}>
                    content
                </SideSheet>
            </StrictMode>
        );
        const { rerender, unmount } = render(sheet(true));
        expect(document.querySelectorAll(`div.${prefix}`)).toHaveLength(1);
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-portal`)).toHaveLength(1);
        expect(document.body.style.overflow).toBe('hidden');
        pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(afterVisibleChange).not.toHaveBeenCalled();

        rerender(sheet(false));
        expect(document.body.style.overflow).toBe('auto');
        expect(afterVisibleChange).toHaveBeenCalledTimes(1);
        pressEsc();
        expect(onCancel).toHaveBeenCalledTimes(1);

        rerender(sheet(true));
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
        const { rerender } = renderSideSheet({ visible: true, motion: false, mask: false, title: 'Sheet' });
        const dialog = screen.getByRole('dialog', { name: 'Sheet' });
        expect(dialog).not.toHaveAttribute('aria-modal');
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
        expect(opener.inert).toBeFalsy();
        rerender({ visible: false, motion: false, mask: false, title: 'Sheet' });
        expect(opener).toHaveFocus();

        rerender({ visible: true, motion: false, mask: false, title: 'Sheet' });
        other.focus();
        rerender({ visible: false, motion: false, mask: false, title: 'Sheet' });
        expect(other).toHaveFocus();
        opener.remove();
        other.remove();
    });

    it('StrictMode 下隐藏状态挂载时，不改动已有的 body 锁定', () => {
        document.body.style.overflow = 'hidden';
        document.body.style.width = '80%';
        const { unmount } = render(
            <StrictMode>
                <SideSheet visible={false} />
            </StrictMode>
        );
        expect(document.body.style.overflow).toBe('hidden');
        unmount();
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.body.style.width).toBe('80%');
    });
});

describe('SideSheet 函数组件', () => {
    it('ref 绑定到 sidesheet 外层容器', () => {
        const ref = createRef<HTMLDivElement>();
        renderSideSheet({ visible: true, ref });
        expect(ref.current).toBe(getRoot());
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

    it('显示中卸载时只报告一次 afterVisibleChange(false)', async () => {
        const afterVisibleChange = vi.fn<(visible: boolean) => void>();
        const shown = render(
            <StrictMode>
                <SideSheet afterVisibleChange={afterVisibleChange} motion={false} visible />
            </StrictMode>
        );
        await Promise.resolve();
        expect(afterVisibleChange).not.toHaveBeenCalled();
        shown.unmount();
        await Promise.resolve();
        expect(afterVisibleChange).toHaveBeenCalledTimes(1);
        expect(afterVisibleChange).toHaveBeenLastCalledWith(false);

        const neverShown = vi.fn<(visible: boolean) => void>();
        const hidden = render(<SideSheet afterVisibleChange={neverShown} visible={false} />);
        hidden.unmount();
        await Promise.resolve();
        expect(neverShown).not.toHaveBeenCalled();
    });
});

describe('SideSheet 对话框名称警告', () => {
    let warn;
    const nameWarnings = () => warn.mock.calls.filter(([message]) => message.includes('[Semi SideSheet]'));
    beforeEach(() => {
        warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => warn.mockRestore());

    it('没有名称打开时只警告一次', () => {
        render(<SideSheet motion={false} visible />);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(nameWarnings()).toHaveLength(1);
    });

    it('有 title 时不警告', () => {
        render(<SideSheet title="Named" motion={false} visible />);
        expect(screen.getByRole('dialog', { name: 'Named' })).toBeInTheDocument();
        expect(nameWarnings()).toHaveLength(0);
    });

    it('SideSheetState 是空对象类型，没有字段', () => {
        expectTypeOf<keyof SideSheetState>().toBeNever();
    });
});
