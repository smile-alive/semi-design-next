/** @jsxImportSource vue */
import { createCommentVNode, nextTick, shallowRef } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconEyeClosed } from '@fibrae/semi-icons-vue';
import { endTransitions, render } from '@test/utils/vue';
import semiGlobal from '../../_utils/semi-global';
import Button from '../../button';
import ButtonGroup from '../../button/button-group.vue';
import ConfigProvider from '../../config-provider/config-provider.vue';
import type { SideSheetEmits, SideSheetHandle, SideSheetProps } from '../interface';
import SideSheet from '../side-sheet.vue';
import Cached from './fixtures/cached.vue';
import ConfigContainer from './fixtures/config-container.vue';
import Page from './fixtures/page.vue';
import PopupContainer from './fixtures/popup-container.vue';
import ToggleSlots from './fixtures/toggle-slots.vue';

type Props = SideSheetProps & Record<string, unknown>;
type SlotMap = Record<string, () => unknown>;
type View = ReturnType<typeof render>;

const prefix = 'semi-sidesheet';
const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
const getRoot = () => $(`div.${prefix}`) as HTMLElement;
const getInner = () => $(`.${prefix}-inner`) as HTMLElement;
const getMask = () => $(`.${prefix}-mask`) as HTMLElement;
const pressEsc = () => fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
const content = () => <p>This is content of basic sideSheet</p>;

// Portal renders a tick after mounting, so every render and update that may show the sheet waits one more tick.
async function renderSideSheet(props: Props = {}, slots: SlotMap = {}) {
    const view = render(SideSheet, { props, slots: { default: content, ...slots } as never });
    await nextTick();
    return view;
}

async function update(view: View, props: Props) {
    await view.rerender(props);
    await nextTick();
}

describe('SideSheet', () => {
    it('class、style、maskStyle、bodyStyle、headerStyle 与 zIndex', async () => {
        await renderSideSheet({
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
        expect(getRoot()).not.toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect($(`.${prefix}-body`)).toHaveStyle({ color: 'rgb(255, 192, 203)' });
        expect($(`.${prefix}-header`)).toHaveStyle({ color: 'rgb(0, 128, 0)' });
        expect(getMask()).toHaveStyle({ color: 'rgb(128, 128, 128)' });
        expect($('.semi-portal')?.style.zIndex).toBe('500');
    });

    it('visible 控制渲染', async () => {
        const view = await renderSideSheet();
        expect(getRoot()).toBeNull();
        await update(view, { visible: true });
        expect(getRoot()).not.toBeNull();
    });

    it('placement 为 bottom', async () => {
        await renderSideSheet({ placement: 'bottom', visible: true });
        expect($(`.${prefix}-bottom`)).not.toBeNull();
    });

    it('不同位置', async () => {
        const view = await renderSideSheet({ placement: 'top', visible: true });
        expect($(`.${prefix}-top`)).not.toBeNull();
        for (const placement of ['bottom', 'left', 'right'] as const) {
            await update(view, { placement });
            expect($(`.${prefix}-${placement}`)).not.toBeNull();
        }
    });

    it('title 字符串渲染标题，正文为默认插槽', async () => {
        await renderSideSheet({ title: 'SemiTitle', visible: true });
        expect($(`.${prefix}-title`)?.textContent).toBe('SemiTitle');
        expect($(`.${prefix}-body`)?.textContent).toBe('This is content of basic sideSheet');
    });

    it('#title 插槽渲染标题', async () => {
        await renderSideSheet({ visible: true }, { title: () => <strong>SlotTitle</strong> });
        expect($(`.${prefix}-title strong`)?.textContent).toBe('SlotTitle');
        expect(screen.getByRole('dialog', { name: 'SlotTitle' })).toBe(getInner());
    });

    it('size', async () => {
        const view = await renderSideSheet({ size: 'small', visible: true });
        expect(getInner()).toHaveClass(`${prefix}-size-small`);
        await update(view, { size: 'medium' });
        expect(getInner()).toHaveClass(`${prefix}-size-medium`);
        await update(view, { size: 'large' });
        expect(getInner()).toHaveClass(`${prefix}-size-large`);
    });

    it('height 与 width', async () => {
        const view = await renderSideSheet({ width: '413px', visible: true });
        expect(getInner()).toHaveStyle({ width: '413px' });
        await update(view, { height: '413px' });
        expect(getInner()).toHaveStyle({ height: '100%' });

        await update(view, { placement: 'top' });
        expect(getInner()).toHaveStyle({ height: '413px' });
        expect(getInner()).toHaveStyle({ width: '100%' });

        await update(view, { placement: 'bottom' });
        expect(getInner()).toHaveStyle({ height: '413px' });
        expect(getInner()).toHaveStyle({ width: '100%' });
    });

    it('数字宽高转为 px', async () => {
        const view = await renderSideSheet({ width: 300, visible: true });
        expect(getInner().style.width).toBe('300px');
        await update(view, { placement: 'top', height: 200, canVerticalSetWidth: true });
        expect(getInner().style.height).toBe('200px');
        expect(getInner().style.width).toBe('300px');
    });

    it('disableScroll', async () => {
        const view = await renderSideSheet({ visible: true });
        expect(document.body.style.overflow).toBe('hidden');
        await update(view, { visible: false });
        expect(document.body.style.overflow).not.toBe('hidden');
        await update(view, { disableScroll: false, visible: true });
        expect(document.body.style.overflow).not.toBe('hidden');
    });

    it('closable', async () => {
        const view = await renderSideSheet({ closable: true, visible: true });
        expect($(`.${prefix}-close`)).not.toBeNull();
        view.unmount();
        await renderSideSheet({ closable: false, visible: true });
        expect($(`.${prefix}-close`)).toBeNull();
    });

    it('maskClosable', async () => {
        const view = await renderSideSheet({ maskClosable: true, visible: true });
        await userEvent.click(getMask());
        expect(view.emitted().cancel).toHaveLength(1);
        view.unmount();

        const second = await renderSideSheet({ maskClosable: false, visible: true });
        await userEvent.click(getMask());
        expect(second.emitted().cancel).toBeUndefined();
        expect(second.emitted()['update:visible']).toBeUndefined();
    });

    it('关闭按钮发出一次 cancel 与 update:visible(false)', async () => {
        const view = await renderSideSheet({ visible: true });
        await userEvent.click($(`button.${prefix}-close`) as HTMLElement);
        expect(view.emitted().cancel).toHaveLength(1);
        expect(view.emitted()['update:visible']).toEqual([[false]]);
    });

    it('无遮罩', async () => {
        await renderSideSheet({ mask: false, visible: true });
        expect(getRoot()).not.toBeNull();
        expect(getMask()).toBeNull();
    });

    it('getPopupContainer：容器与抽屉同批挂载时渲染进容器，不锁 body', async () => {
        render(PopupContainer, { props: { visible: true } });
        await nextTick();
        const sheets = document.querySelectorAll(`div.${prefix}`);
        expect(sheets).toHaveLength(1);
        expect($('.sidesheet-container')).toContainElement(sheets[0] as HTMLElement);
        expect(document.body.style.overflow).not.toBe('hidden');
    });

    it('没有 getPopupContainer 时渲染在 body', async () => {
        await renderSideSheet({ visible: true });
        expect($('.semi-portal')?.parentElement).toBe(document.body);
    });

    it('motion 为 false', async () => {
        const view = await renderSideSheet({ placement: 'top', visible: true, motion: false });
        expect($(`.${prefix}-top`)).not.toBeNull();
        expect(getInner().style.transform).toBe('');
        for (const placement of ['bottom', 'left', 'right'] as const) {
            await update(view, { placement });
            expect($(`.${prefix}-${placement}`)).not.toBeNull();
            expect(getInner().style.transform).toBe('');
        }
        await update(view, { visible: false });
        expect(getRoot()).toBeNull();
    });

    it('#closeIcon 插槽替换图标，按钮名称不变', async () => {
        await renderSideSheet({ visible: true }, { closeIcon: () => <IconEyeClosed /> });
        expect(document.querySelectorAll('.semi-icon-eye_closed')).toHaveLength(1);
        expect(screen.getByRole('button', { name: zh_CN.SideSheet.close })).toContainElement($('.semi-icon-eye_closed'));
    });
});

describe('SideSheet 行为', () => {
    beforeEach(() => {
        document.body.style.overflow = '';
        document.body.style.paddingInlineEnd = '';
    });

    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
        document.body.style.overflow = '';
        document.body.style.paddingInlineEnd = '';
        document.body.style.width = '';
    });

    it('离场动画期间保留 DOM，动画结束后卸载', async () => {
        const view = await renderSideSheet({ visible: true });
        expect(getInner()).toHaveClass(`${prefix}-animation-content_show_right`);
        expect(getMask()).toHaveClass(`${prefix}-animation-mask_show`);
        expect(view.emitted().afterVisibleChange).toBeUndefined();

        await update(view, { visible: false });
        expect(getRoot()).not.toBeNull();
        expect(getInner()).toHaveClass(`${prefix}-animation-content_hide_right`);
        expect(getMask()).toHaveClass(`${prefix}-animation-mask_hide`);
        expect(view.emitted().afterVisibleChange).toBeUndefined();

        await endTransitions();
        expect(getRoot()).toBeNull();
        expect(view.emitted().afterVisibleChange).toEqual([[false]]);

        await update(view, { visible: true });
        expect(view.emitted().afterVisibleChange).toEqual([[false], [true]]);
        expect(getInner()).toHaveClass(`${prefix}-animation-content_show_right`);
        await endTransitions();
        expect(view.emitted().afterVisibleChange).toHaveLength(2);
        expect(getInner()).not.toHaveClass(`${prefix}-animation-content_show_right`);
    });

    it('没有动画时每次可见性变化只报告一次，挂载时不报告', async () => {
        const view = await renderSideSheet({ visible: true, motion: false });
        expect(view.emitted().afterVisibleChange).toBeUndefined();
        await update(view, { visible: false });
        expect(getRoot()).toBeNull();
        expect(view.emitted().afterVisibleChange).toEqual([[false]]);
        await update(view, { visible: true });
        expect(view.emitted().afterVisibleChange).toEqual([[false], [true]]);

        const hidden = await renderSideSheet({ visible: false });
        expect(hidden.emitted().afterVisibleChange).toBeUndefined();
    });

    it.each(['left', 'right'] as const)('placement 为 %s 时占满高度，宽度取自 size', async (placement) => {
        await renderSideSheet({ visible: true, placement });
        expect(getRoot()).toHaveClass(`${prefix}-${placement}`);
        expect(getRoot()).not.toHaveClass(`${prefix}-horizontal`);
        expect(getInner()).toHaveClass(`${prefix}-size-small`);
        expect(getInner().style.height).toBe('100%');
        expect(getInner().style.width).toBe('');
    });

    it.each(['top', 'bottom'] as const)('placement 为 %s 时占满宽度，高度使用默认值', async (placement) => {
        await renderSideSheet({ visible: true, placement, width: 300 });
        expect(getRoot()).toHaveClass(`${prefix}-${placement}`);
        expect(getRoot()).toHaveClass(`${prefix}-horizontal`);
        expect(getInner().style.width).toBe('100%');
        expect(getInner().style.height).toBe('448px');
    });

    it('无遮罩时宽度设置在固定定位的外层容器上', async () => {
        await renderSideSheet({ visible: true, mask: false, width: 300 });
        expect(getRoot()).toHaveClass(`${prefix}-fixed`);
        expect(getRoot()).toHaveClass(`${prefix}-size-small`);
        expect(getRoot().style.width).toBe('300px');
        expect(getInner().style.width).toBe('100%');
    });

    it('渲染标题、页脚与正文，空插槽不渲染对应元素', async () => {
        const view = await renderSideSheet({ visible: true, title: 'T' }, { footer: () => 'F' });
        expect($(`.${prefix}-title`)).toHaveAttribute('x-semi-prop', 'title');
        expect($(`.${prefix}-footer`)).toHaveAttribute('x-semi-prop', 'footer');
        expect($(`.${prefix}-footer`)?.textContent).toBe('F');
        expect($(`.${prefix}-body`)).toHaveAttribute('x-semi-prop', 'children');
        expect(screen.getByRole('heading', { name: 'T' })).toHaveClass(`${prefix}-title`);
        expect(screen.getByRole('dialog', { name: 'T' })).toBe(getInner());
        view.unmount();

        const empty = () => [createCommentVNode('v-if')];
        await renderSideSheet({ visible: true }, { title: empty, footer: empty });
        expect($(`.${prefix}-title`)).toBeNull();
        expect($(`.${prefix}-footer`)).toBeNull();
        expect(getInner()).not.toHaveAttribute('aria-labelledby');
    });

    it('title 字符串与 #title 插槽同时给出时插槽优先；插槽为空时不渲染标题', async () => {
        const view = await renderSideSheet({ visible: true, title: 'Prop' }, { title: () => 'Slot' });
        expect(screen.getByRole('heading').textContent).toBe('Slot');
        expect(screen.getByRole('dialog', { name: 'Slot' })).toBe(getInner());
        view.unmount();

        await renderSideSheet({ visible: true, title: 'Prop' }, { title: () => [createCommentVNode('v-if')] });
        expect(screen.queryByRole('heading')).toBeNull();
        expect(getInner()).not.toHaveAttribute('aria-labelledby');
    });

    it('点击遮罩本身时关闭，点击面板内部时不关闭', async () => {
        const view = await renderSideSheet({ visible: true });
        await userEvent.click(getInner());
        expect(view.emitted().cancel).toBeUndefined();
        await userEvent.click(getMask());
        const events = view.emitted<SideSheetEmits['cancel']>('cancel');
        expect(events).toHaveLength(1);
        expect(events[0][0]).toBeInstanceOf(MouseEvent);
        expect(events[0][0].type).toBe('click');
        expect(getRoot()).not.toBeNull();
    });

    it('离场动画期间再次点击遮罩或关闭按钮不再发出 cancel 与 update:visible', async () => {
        const view = await renderSideSheet({ visible: true });
        await userEvent.click(getMask());
        expect(view.emitted('cancel')).toHaveLength(1);
        expect(view.emitted('update:visible')).toHaveLength(1);

        // jsdom fires no transition end, so the sheet stays mounted while leaving
        await update(view, { visible: false });
        expect(getRoot()).not.toBeNull();
        await userEvent.click(getMask());
        await userEvent.click(screen.getByRole('button', { name: zh_CN.SideSheet.close }));
        expect(view.emitted('cancel')).toHaveLength(1);
        expect(view.emitted('update:visible')).toHaveLength(1);
    });

    it('仅在可见且设置 closeOnEsc 时按 Esc 关闭，并读取最新属性', async () => {
        expectTypeOf<SideSheetEmits['cancel']>().toEqualTypeOf<[event: MouseEvent | KeyboardEvent]>();
        const view = await renderSideSheet({ visible: true });
        await pressEsc();
        expect(view.emitted().cancel).toBeUndefined();

        await update(view, { closeOnEsc: true });
        await pressEsc();
        const events = view.emitted<SideSheetEmits['cancel']>('cancel');
        expect(events).toHaveLength(1);
        expect(events[0][0]).toBeInstanceOf(KeyboardEvent);

        await update(view, { visible: false });
        await pressEsc();
        expect(view.emitted().cancel).toHaveLength(1);

        // emit() is a no-op after unmount, so a leaked layer is observed through its side effects instead
        const page = document.body.appendChild(document.createElement('main'));
        await update(view, { visible: true });
        expect(page.inert).toBe(true);
        view.unmount();
        await pressEsc();
        expect(page.inert).toBe(false);
        expect(document.body.style.overflow).not.toBe('hidden');
        page.remove();
    });

    it('closeOnEsc 为 true 时 Esc 发出 cancel 与 update:visible(false)，为 false 时不发', async () => {
        const view = await renderSideSheet({ visible: true, closeOnEsc: false });
        await pressEsc();
        expect(view.emitted().cancel).toBeUndefined();
        expect(view.emitted()['update:visible']).toBeUndefined();

        await update(view, { closeOnEsc: true });
        await pressEsc();
        expect(view.emitted().cancel).toHaveLength(1);
        expect(view.emitted()['update:visible']).toEqual([[false]]);
    });

    it('mask 为 false 时位于 body 的抽屉不锁 body 滚动', async () => {
        await renderSideSheet({ visible: true, mask: false });
        expect(document.body.style.overflow).not.toBe('hidden');
    });

    it('运行中增删 #title 与 #footer 插槽时同步更新', async () => {
        const view = render(ToggleSlots, { props: { shown: true } });
        await nextTick();
        expect($(`.${prefix}-title`)?.textContent).toBe('T');
        expect($(`.${prefix}-footer`)?.textContent).toBe('F');
        expect(screen.getByRole('dialog', { name: 'T' })).toBe(getInner());

        await update(view, { shown: false });
        expect($(`.${prefix}-title`)).toBeNull();
        expect($(`.${prefix}-footer`)).toBeNull();
        expect(getInner()).not.toHaveAttribute('aria-labelledby');
    });

    it('隐藏状态挂载时不监听 Esc', async () => {
        const view = await renderSideSheet({ visible: false, closeOnEsc: true });
        await pressEsc();
        expect(view.emitted().cancel).toBeUndefined();
    });

    it('keepDOM 从一开始就以隐藏状态渲染，关闭后保留内容', async () => {
        const view = await renderSideSheet({ visible: false, keepDOM: true, motion: false });
        expect(getRoot()).toHaveClass(`${prefix}-hidden`);
        await update(view, { visible: true });
        expect(getRoot()).not.toHaveClass(`${prefix}-hidden`);
        await update(view, { visible: false });
        expect(getRoot()).toHaveClass(`${prefix}-hidden`);
        expect($(`.${prefix}-body`)?.textContent).toBe('This is content of basic sideSheet');
    });

    it('keepDOM 有动画时，离场动画结束后隐藏', async () => {
        const view = await renderSideSheet({ visible: true, keepDOM: true });
        await update(view, { visible: false });
        expect(getRoot()).not.toHaveClass(`${prefix}-hidden`);
        await endTransitions();
        expect(getRoot()).toHaveClass(`${prefix}-hidden`);
        await update(view, { visible: true });
        expect(getRoot()).not.toHaveClass(`${prefix}-hidden`);
    });

    it('可见时锁定 body 滚动，并恢复之前的 overflow 和结束内边距', async () => {
        document.body.style.overflow = 'auto';
        document.body.style.paddingInlineEnd = '4px';
        const view = await renderSideSheet({ visible: true, motion: false });
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.body.style.paddingInlineEnd).not.toBe('4px');

        await update(view, { visible: false });
        expect(document.body.style.overflow).toBe('auto');
        expect(document.body.style.paddingInlineEnd).toBe('4px');
        await update(view, { visible: true });
        expect(document.body.style.overflow).toBe('hidden');
        view.unmount();
        expect(document.body.style.overflow).toBe('auto');
        expect(document.body.style.paddingInlineEnd).toBe('4px');
    });

    it('隐藏状态挂载或卸载，或已经隐藏时，不改动 body 滚动', async () => {
        const hidden = await renderSideSheet({ visible: false });
        document.body.style.overflow = 'scroll';
        hidden.unmount();
        expect(document.body.style.overflow).toBe('scroll');

        document.body.style.overflow = 'hidden';
        document.body.style.width = '80%';
        const view = await renderSideSheet({ visible: true, motion: false });
        expect(document.body.style.width).toBe('80%');
        await update(view, { visible: false });
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.body.style.width).toBe('80%');
    });

    it('渲染到 getPopupContainer 中，且定位为 static', async () => {
        const container = document.body.appendChild(document.createElement('div'));
        await renderSideSheet({ visible: true, getPopupContainer: () => container });
        expect(getRoot()).toHaveClass(`${prefix}-popup`);
        const portal = $('.semi-portal') as HTMLElement;
        expect(portal.parentElement).toBe(container);
        expect(portal.style.position).toBe('static');
        expect(portal.style.zIndex).toBe('1000');
        expect(document.body.style.overflow).toBe('');
        container.remove();
    });

    it('仅当遮罩覆盖整个页面时才设置 aria-modal，并与页面 inert 一致', async () => {
        const page = document.body.appendChild(document.createElement('main'));
        const container = document.body.appendChild(document.createElement('div'));
        const cases: [Props, string | null, boolean][] = [
            [{}, 'true', true],
            [{ mask: false }, null, false],
            [{ getPopupContainer: () => container }, null, false],
            [{ getPopupContainer: () => document.body }, 'true', true],
            [{ mask: false, 'aria-modal': 'true' }, 'true', false],
        ];
        for (const [props, ariaModal, inert] of cases) {
            const view = await renderSideSheet({ visible: true, title: 'Sheet', motion: false, ...props });
            expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe(ariaModal);
            expect(page.inert).toBe(inert);
            view.unmount();
        }
        page.remove();
        container.remove();
    });

    it('getPopupContainer 返回 body 时与默认一致：锁 body 滚动，不加 popup 类', async () => {
        await renderSideSheet({ visible: true, motion: false, getPopupContainer: () => document.body });
        expect(getRoot()).not.toHaveClass(`${prefix}-popup`);
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('KeepAlive 失活时释放 inert、body 滚动锁与焦点而不上报，激活后若仍可见重新获取', async () => {
        const page = document.body.appendChild(document.createElement('main'));
        const view = render(Cached, { props: { shown: true } });
        await nextTick();
        expect(document.body.style.overflow).toBe('hidden');
        expect(page.inert).toBe(true);
        expect(screen.getByRole('dialog', { name: 'Sheet' })).toContainElement(document.activeElement as HTMLElement);

        await view.rerender({ shown: false });
        await nextTick();
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(document.body.style.overflow).toBe('');
        expect(page.inert).toBe(false);

        await view.rerender({ shown: true });
        await nextTick();
        expect(document.body.style.overflow).toBe('hidden');
        expect(page.inert).toBe(true);
        expect(screen.getByRole('dialog', { name: 'Sheet' })).toContainElement(document.activeElement as HTMLElement);
        expect(view.emitted().change).toBeUndefined();
        page.remove();
    });

    it('data-* 属性设置在外层容器上', async () => {
        await renderSideSheet({ visible: true, 'data-testid': 'sheet', 'data-foo': 'bar' });
        const node = screen.getByTestId('sheet');
        expect(node).toBe(getRoot());
        expect(node).toHaveAttribute('data-foo', 'bar');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值，显式属性优先', async () => {
        semiGlobal.config.overrideDefaultProps = { SideSheet: { placement: 'left', closable: false } };
        const view = await renderSideSheet({ visible: true });
        expect(getRoot()).toHaveClass(`${prefix}-left`);
        expect($(`.${prefix}-close`)).toBeNull();
        view.unmount();
        await renderSideSheet({ visible: true, placement: 'top' });
        expect(getRoot()).toHaveClass(`${prefix}-top`);
    });

    it('全局默认值：mask、zIndex 与函数 prop getPopupContainer', async () => {
        const container = document.body.appendChild(document.createElement('div'));
        semiGlobal.config.overrideDefaultProps = {
            SideSheet: { mask: false, zIndex: 2000, getPopupContainer: () => container },
        };
        const view = await renderSideSheet({ visible: true });
        expect(getMask()).toBeNull();
        expect($('.semi-portal')?.style.zIndex).toBe('2000');
        expect($('.semi-portal')?.parentElement).toBe(container);
        view.unmount();
        await renderSideSheet({ visible: true, getPopupContainer: () => document.body });
        expect($('.semi-portal')?.parentElement).toBe(document.body);
        container.remove();
    });

    it('多次开关后按一次 Esc 只发一次 cancel，body 锁随关闭释放', async () => {
        document.body.style.overflow = 'auto';
        const view = await renderSideSheet({ visible: true, closeOnEsc: true, motion: false });
        for (const visible of [false, true, false, true]) {
            await update(view, { visible });
        }
        expect(document.body.style.overflow).toBe('hidden');
        await pressEsc();
        expect(view.emitted().cancel).toHaveLength(1);
        await update(view, { visible: false });
        expect(document.body.style.overflow).toBe('auto');
        view.unmount();
        expect(document.querySelectorAll('.semi-portal')).toHaveLength(0);
    });

    it('有遮罩时打开后获取焦点，页面设为 inert，关闭后归还焦点', async () => {
        const opener = document.body.appendChild(document.createElement('button'));
        opener.focus();
        const view = await renderSideSheet({ visible: true, motion: false, title: 'Sheet' });
        const dialog = screen.getByRole('dialog', { name: 'Sheet' });
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
        expect(opener.inert).toBe(true);
        await update(view, { visible: false });
        expect(opener.inert).toBe(false);
        expect(opener).toHaveFocus();
        opener.remove();
    });

    it('无遮罩时获取焦点但页面仍可用，且仅从面板内部关闭时归还焦点', async () => {
        const opener = document.body.appendChild(document.createElement('button'));
        const other = document.body.appendChild(document.createElement('button'));
        opener.focus();
        const view = await renderSideSheet({ visible: true, motion: false, mask: false, title: 'Sheet' });
        const dialog = screen.getByRole('dialog', { name: 'Sheet' });
        expect(dialog).not.toHaveAttribute('aria-modal');
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
        expect(opener.inert).toBeFalsy();
        await update(view, { visible: false });
        expect(opener).toHaveFocus();

        await update(view, { visible: true });
        other.focus();
        await update(view, { visible: false });
        expect(other).toHaveFocus();
        opener.remove();
        other.remove();
    });

    it('无遮罩时不锁 body 滚动', async () => {
        await renderSideSheet({ visible: true, motion: false, mask: false });
        expect(document.body.style.overflow).toBe('');
    });

    it('自定义容器中的遮罩不锁 Tab：打开时移入焦点，焦点已移到外部时关闭不抢回', async () => {
        const container = document.body.appendChild(document.createElement('div'));
        const opener = document.body.appendChild(document.createElement('button'));
        const other = document.body.appendChild(document.createElement('button'));
        opener.focus();
        const view = await renderSideSheet({
            visible: true,
            motion: false,
            title: 'Sheet',
            getPopupContainer: () => container,
        });
        expect(screen.getByRole('dialog', { name: 'Sheet' })).toContainElement(document.activeElement as HTMLElement);
        other.focus();
        await update(view, { visible: false });
        expect(other).toHaveFocus();
        for (const node of [container, opener, other]) node.remove();
    });

    it('打开时聚焦正文中带 autofocus 的元素，keepDOM 重开结果相同', async () => {
        const opener = document.body.appendChild(document.createElement('button'));
        opener.focus();
        const view = await renderSideSheet(
            { visible: true, motion: false, keepDOM: true, title: 'Sheet' },
            {
                default: () => (
                    <>
                        <button>first</button>
                        <input aria-label="name" autofocus />
                    </>
                ),
            }
        );
        const input = screen.getByRole('textbox', { name: 'name' });
        expect(input).toHaveFocus();
        await update(view, { visible: false });
        expect(opener).toHaveFocus();
        await update(view, { visible: true });
        expect(input).toHaveFocus();
        opener.remove();
    });
});

describe('SideSheet Vue 写法', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
        document.body.style.overflow = '';
        document.body.style.paddingInlineEnd = '';
    });

    it('expose().root 指向外层容器，未显示时为 null', async () => {
        const handle = shallowRef<SideSheetHandle | null>(null);
        const visible = shallowRef(false);
        render(() => <SideSheet ref={handle} visible={visible.value} />);
        await nextTick();
        expect(handle.value).not.toBeNull();
        expect(handle.value?.root).toBeNull();
        visible.value = true;
        await nextTick();
        await nextTick();
        expect(handle.value?.root).toBe(getRoot());
    });

    it('通过 aria-label 为对话框命名', async () => {
        await renderSideSheet({ visible: true, title: 'Title', 'aria-label': 'Settings' });
        expect(screen.getByRole('dialog', { name: 'Settings' })).toBe(getInner());
        expect(getInner()).not.toHaveAttribute('aria-labelledby');
        expect(getRoot()).not.toHaveAttribute('aria-label');
    });

    it('aria-labelledby、aria-describedby 和 aria-modal 落在对话框上，data-* 落在外层容器上', async () => {
        await renderSideSheet({
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

    it('其余 aria-* 也落在对话框上，外层容器没有', async () => {
        await renderSideSheet({ visible: true, 'aria-roledescription': 'sheet', 'aria-details': 'extra' });
        const dialog = screen.getByRole('dialog');
        for (const [name, value] of [
            ['aria-roledescription', 'sheet'],
            ['aria-details', 'extra'],
        ]) {
            expect(dialog).toHaveAttribute(name, value);
            expect(getRoot()).not.toHaveAttribute(name);
        }
    });

    it('未知属性与原生监听落在外层容器上；style 落在对话框并被计算宽度覆盖', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const view = await renderSideSheet({
            visible: true,
            id: 'sheet',
            role: 'presentation',
            width: 300,
            style: { color: 'red', width: '10px' },
            onClick,
        });
        expect(getRoot()).toHaveAttribute('id', 'sheet');
        expect(getRoot()).toHaveAttribute('role', 'presentation');
        expect(getInner()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getInner().style.width).toBe('300px');
        await userEvent.click(getInner());
        expect(onClick).toHaveBeenCalledTimes(1);
        await userEvent.click(getMask());
        expect(onClick).toHaveBeenCalledTimes(2);
        expect(view.emitted().cancel).toHaveLength(1);
    });

    it('显示中卸载时只报告一次 afterVisibleChange(false)，从未显示的不报告', async () => {
        const shown = await renderSideSheet({ motion: false, visible: true });
        expect(shown.emitted().afterVisibleChange).toBeUndefined();
        shown.unmount();
        expect(shown.emitted().afterVisibleChange).toEqual([[false]]);

        const hidden = await renderSideSheet({ visible: false });
        hidden.unmount();
        expect(hidden.emitted().afterVisibleChange).toBeUndefined();
    });

    it('v-model:visible：关闭按钮、遮罩与 Esc 都把模型写回 false，可再次打开', async () => {
        render(Page);
        const value = () => screen.getByLabelText('visible');
        const open = async () => {
            await userEvent.click(screen.getByRole('button', { name: 'Open' }));
            await nextTick();
            expect(screen.getByRole('dialog', { name: 'Sheet' })).toBeInTheDocument();
            expect(value()).toHaveTextContent('true');
        };
        const closes = [() => userEvent.click(screen.getByRole('button', { name: zh_CN.SideSheet.close })), () => userEvent.click(getMask()), () => pressEsc()];
        for (const close of closes) {
            await open();
            await close();
            await nextTick();
            expect(screen.queryByRole('dialog')).toBeNull();
            expect(value()).toHaveTextContent('false');
        }
    });

    it('单向 :visible 不自行关闭：三种方式各发 cancel 与 update:visible，同值重渲染仍打开', async () => {
        const view = await renderSideSheet({ visible: true, closeOnEsc: true, motion: false });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.SideSheet.close }));
        await userEvent.click(getMask());
        await pressEsc();
        expect(view.emitted().cancel).toHaveLength(3);
        expect(view.emitted()['update:visible']).toEqual([[false], [false], [false]]);
        await update(view, { visible: true });
        expect(getRoot()).not.toBeNull();
        await update(view, { visible: false });
        expect(getRoot()).toBeNull();
    });

    it('显式 visible: undefined 等同关闭', async () => {
        await renderSideSheet({ visible: undefined });
        expect(getRoot()).toBeNull();
    });

    it('空 #closeIcon 回落默认图标，closable=false 才去掉按钮', async () => {
        const view = await renderSideSheet({ visible: true }, { closeIcon: () => [createCommentVNode('v-if')] });
        const button = screen.getByRole('button', { name: zh_CN.SideSheet.close });
        expect(button.querySelector('.semi-icon-close')).not.toBeNull();
        await update(view, { closable: false });
        expect(screen.queryByRole('button', { name: zh_CN.SideSheet.close })).toBeNull();
    });

    it('ConfigProvider 的 getPopupContainer：渲染进容器，不锁 body，没有 aria-modal 与 inert', async () => {
        const page = document.body.appendChild(document.createElement('main'));
        render(ConfigContainer);
        await nextTick();
        const container = $('.config-container') as HTMLElement;
        expect(container).toContainElement(getRoot());
        expect(getRoot()).toHaveClass(`${prefix}-popup`);
        expect(($('.semi-portal') as HTMLElement).style.position).toBe('static');
        expect(document.body.style.overflow).toBe('');
        expect(screen.getByRole('dialog', { name: 'Sheet' })).not.toHaveAttribute('aria-modal');
        expect(page.inert).toBeFalsy();
        page.remove();
    });

    it('自身 getPopupContainer 优先于 ConfigProvider', async () => {
        render(ConfigContainer, { props: { ownContainer: () => document.body } });
        await nextTick();
        expect($('.semi-portal')?.parentElement).toBe(document.body);
        expect(screen.getByRole('dialog', { name: 'Sheet' })).toHaveAttribute('aria-modal', 'true');
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('ConfigProvider direction=rtl 时 portal 输出 dir="rtl"', async () => {
        render(() => <ConfigProvider direction="rtl">{() => <SideSheet visible />}</ConfigProvider>);
        await nextTick();
        expect($('.semi-portal')).toHaveAttribute('dir', 'rtl');
    });

    it('关闭按钮名称随语言包', async () => {
        render(() => <ConfigProvider locale={ja_JP}>{() => <SideSheet visible />}</ConfigProvider>);
        await nextTick();
        expect(screen.getByRole('button', { name: ja_JP.SideSheet.close })).toHaveClass(`${prefix}-close`);
    });

    it('放在 ButtonGroup 内时，抽屉中的 Button 不继承组的配置', async () => {
        render(() => (
            <ButtonGroup disabled type="danger">
                {() => <SideSheet visible>{() => <Button>{() => 'in sheet'}</Button>}</SideSheet>}
            </ButtonGroup>
        ));
        await nextTick();
        const button = screen.getByRole('button', { name: 'in sheet' });
        expect(button).toBeEnabled();
        expect(button).toHaveClass('semi-button-primary');
    });

    it('mask 运行中变化时 aria-modal 与 inert 同步', async () => {
        const page = document.body.appendChild(document.createElement('main'));
        const view = await renderSideSheet({ visible: true, motion: false, title: 'Sheet' });
        expect(getInner()).toHaveAttribute('aria-modal', 'true');
        expect(page.inert).toBe(true);
        await update(view, { visible: false });
        await update(view, { visible: true, mask: false });
        expect(getInner()).not.toHaveAttribute('aria-modal');
        expect(page.inert).toBe(false);
        page.remove();
    });

    it('props 运行时：Boolean 类型都有 default 键，函数 prop 默认值为 undefined', () => {
        const declared = (SideSheet as unknown as { props: Record<string, { type?: unknown; default?: unknown }> }).props;
        const missingDefault = Object.entries(declared)
            .filter(([, option]) => [option.type].flat().includes(Boolean) && !('default' in option))
            .map(([key]) => key);
        expect(missingDefault).toEqual([]);
        expect(declared.getPopupContainer.default).toBeUndefined();
    });

    it('事件载荷类型', () => {
        expectTypeOf<SideSheetEmits['afterVisibleChange']>().toEqualTypeOf<[visible: boolean]>();
        expectTypeOf<SideSheetEmits['update:visible']>().toEqualTypeOf<[visible: boolean]>();
    });
});

describe('SideSheet 对话框名称警告', () => {
    let warn: ReturnType<typeof vi.spyOn>;
    const nameWarnings = () => warn.mock.calls.filter(([message]: unknown[]) => String(message).includes('[Semi SideSheet]'));
    beforeEach(() => {
        warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
        warn.mockRestore();
        document.body.style.overflow = '';
        document.body.style.paddingInlineEnd = '';
    });

    it('没有名称打开时只警告一次', async () => {
        await renderSideSheet({ motion: false, visible: true });
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(nameWarnings()).toHaveLength(1);
    });

    it('有 title 时不警告', async () => {
        await renderSideSheet({ title: 'Named', motion: false, visible: true });
        expect(screen.getByRole('dialog', { name: 'Named' })).toBeInTheDocument();
        expect(nameWarnings()).toHaveLength(0);
    });
});
