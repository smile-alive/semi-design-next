import { flushSync, tick } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { SideSheetProps } from '../interface';
import ConfigFixture from './config-fixture.svelte';
import ContainerFixture from './container-fixture.svelte';
import SideSheetFixture from './side-sheet-fixture.svelte';
import SideSheetModes from './side-sheet-modes.svelte';

type Store = NonNullable<Parameters<typeof SideSheetFixture>[1]>['store'];
type Cancel = (event: MouseEvent | KeyboardEvent) => void;

const prefix = 'semi-sidesheet';
const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
const getRoot = () => $(`div.${prefix}`) as HTMLElement;
const getInner = () => $(`.${prefix}-inner`) as HTMLElement;
const getMask = () => $(`.${prefix}-mask`) as HTMLElement;
const pressEsc = () => fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
const animationEnd = (node: Element) => node.dispatchEvent(new Event('animationend', { bubbles: true }));
// the setup stubs getAnimations() with [], which ends every run at once; a running animation keeps the sheet mounted
const holdAnimations = () => vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([{ animationName: 'running' } as unknown as Animation]);

function setup(props: SideSheetProps = {}, extra: Partial<Store> = {}) {
    const store = createStore<Store>({ props, ...extra });
    const view = render(SideSheetFixture, { props: { store } });
    flushSync();
    return { store, view };
}

function update(store: Store, props: SideSheetProps) {
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

describe('Svelte SideSheet', () => {
    it('class、style、maskStyle、bodyStyle、headerStyle 与 zIndex', () => {
        setup({ class: 'test', style: 'color: red', visible: true, maskStyle: 'color: grey', headerStyle: 'color: green', bodyStyle: 'color: pink', zIndex: 500 });
        expect($(`.${prefix}.test`)).not.toBeNull();
        expect(getInner()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getRoot()).not.toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect($(`.${prefix}-body`)).toHaveStyle({ color: 'rgb(255, 192, 203)' });
        expect($(`.${prefix}-header`)).toHaveStyle({ color: 'rgb(0, 128, 0)' });
        expect(getMask()).toHaveStyle({ color: 'rgb(128, 128, 128)' });
        expect($('.semi-portal')?.style.zIndex).toBe('500');
    });

    it('visible 控制渲染', () => {
        const { store } = setup();
        expect(getRoot()).toBeNull();
        update(store, { visible: true });
        expect(getRoot()).not.toBeNull();
    });

    it('不同位置', () => {
        const { store } = setup({ placement: 'top', visible: true });
        expect($(`.${prefix}-top`)).not.toBeNull();
        for (const placement of ['bottom', 'left', 'right'] as const) {
            update(store, { placement });
            expect($(`.${prefix}-${placement}`)).not.toBeNull();
        }
    });

    it('title 字符串渲染标题，正文为 children', () => {
        setup({ title: 'SemiTitle', visible: true });
        expect($(`.${prefix}-title`)?.textContent?.trim()).toBe('SemiTitle');
        expect($(`.${prefix}-body`)?.textContent?.trim()).toBe('This is content of basic sideSheet');
        expect(getRoot()).not.toHaveAttribute('title');
    });

    it('title snippet 渲染标题并命名对话框', () => {
        setup({ visible: true }, { title: true });
        expect($(`.${prefix}-title strong`)?.textContent).toBe('SlotTitle');
        expect(screen.getByRole('dialog', { name: 'SlotTitle' })).toBe(getInner());
    });

    it('size', () => {
        const { store } = setup({ size: 'small', visible: true });
        expect(getInner()).toHaveClass(`${prefix}-size-small`);
        update(store, { size: 'medium' });
        expect(getInner()).toHaveClass(`${prefix}-size-medium`);
        update(store, { size: 'large' });
        expect(getInner()).toHaveClass(`${prefix}-size-large`);
    });

    it('height 与 width', () => {
        const { store } = setup({ width: '413px', visible: true });
        expect(getInner()).toHaveStyle({ width: '413px' });
        update(store, { height: '413px' });
        expect(getInner()).toHaveStyle({ height: '100%' });
        update(store, { placement: 'top' });
        expect(getInner()).toHaveStyle({ height: '413px', width: '100%' });
        update(store, { placement: 'bottom' });
        expect(getInner()).toHaveStyle({ height: '413px', width: '100%' });
    });

    it('数字宽高转为 px', () => {
        const { store } = setup({ width: 300, visible: true });
        expect(getInner().style.width).toBe('300px');
        update(store, { placement: 'top', height: 200, canVerticalSetWidth: true });
        expect(getInner().style.height).toBe('200px');
        expect(getInner().style.width).toBe('300px');
    });

    it.each(['left', 'right'] as const)('placement 为 %s 时占满高度，宽度取自 size', (placement) => {
        setup({ visible: true, placement });
        expect(getRoot()).toHaveClass(`${prefix}-${placement}`);
        expect(getRoot()).not.toHaveClass(`${prefix}-horizontal`);
        expect(getInner()).toHaveClass(`${prefix}-size-small`);
        expect(getInner().style.height).toBe('100%');
        expect(getInner().style.width).toBe('');
    });

    it.each(['top', 'bottom'] as const)('placement 为 %s 时占满宽度，高度使用默认值', (placement) => {
        setup({ visible: true, placement, width: 300 });
        expect(getRoot()).toHaveClass(`${prefix}-horizontal`);
        expect(getInner().style.width).toBe('100%');
        expect(getInner().style.height).toBe('448px');
    });

    it('无遮罩时宽度设置在固定定位的外层容器上', () => {
        setup({ visible: true, mask: false, width: 300 });
        expect(getRoot()).toHaveClass(`${prefix}-fixed`);
        expect(getRoot()).toHaveClass(`${prefix}-size-small`);
        expect(getRoot().style.width).toBe('300px');
        expect(getInner().style.width).toBe('100%');
        expect(getMask()).toBeNull();
    });

    it('closable', () => {
        const { view } = setup({ closable: true, visible: true });
        expect($(`.${prefix}-close`)).not.toBeNull();
        view.unmount();
        setup({ closable: false, visible: true });
        expect($(`.${prefix}-close`)).toBeNull();
    });

    it('closeIcon snippet 替换图标，按钮名称不变；closable 为 false 才去掉按钮', () => {
        const { store } = setup({ visible: true }, { closeIcon: true });
        expect(document.querySelectorAll('.semi-icon-eye_closed')).toHaveLength(1);
        expect(screen.getByRole('button', { name: zh_CN.SideSheet.close })).toContainElement($('.semi-icon-eye_closed'));
        store.closeIcon = false;
        flushSync();
        expect(screen.getByRole('button', { name: zh_CN.SideSheet.close }).querySelector('.semi-icon-close')).not.toBeNull();
        update(store, { closable: false });
        expect(screen.queryByRole('button', { name: zh_CN.SideSheet.close })).toBeNull();
    });

    it('渲染标题、页脚与正文，没有对应 snippet 时不渲染元素', () => {
        const { store } = setup({ visible: true }, { title: true, footer: true });
        expect($(`.${prefix}-title`)).toHaveAttribute('x-semi-prop', 'title');
        expect($(`.${prefix}-footer`)).toHaveAttribute('x-semi-prop', 'footer');
        expect($(`.${prefix}-body`)).toHaveAttribute('x-semi-prop', 'children');
        expect(screen.getByRole('heading', { name: 'SlotTitle' })).toHaveClass(`${prefix}-title`);
        store.title = false;
        store.footer = false;
        flushSync();
        expect($(`.${prefix}-title`)).toBeNull();
        expect($(`.${prefix}-footer`)).toBeNull();
        expect(getInner()).not.toHaveAttribute('aria-labelledby');
    });

    it('title 字符串与 snippet 同时给出时 snippet 优先', () => {
        setup({ visible: true, title: 'Prop' }, { title: true });
        expect(screen.getByRole('heading').textContent).toBe('SlotTitle');
    });

    it('没有 getPopupContainer 时渲染在 body', () => {
        setup({ visible: true });
        expect($('.semi-portal')?.parentElement).toBe(document.body);
    });

    it('motion 为 false 时没有动画类，关闭立即卸载', () => {
        const { store } = setup({ placement: 'top', visible: true, motion: false });
        expect(getInner().className).not.toContain('animation');
        for (const placement of ['bottom', 'left', 'right'] as const) {
            update(store, { placement });
            expect($(`.${prefix}-${placement}`)).not.toBeNull();
            expect(getInner().className).not.toContain('animation');
        }
        update(store, { visible: false });
        expect(getRoot()).toBeNull();
    });
});

describe('Svelte SideSheet 取消', () => {
    it('maskClosable', async () => {
        const cancel = vi.fn<Cancel>();
        const { view } = setup({ maskClosable: true, visible: true, onCancel: cancel });
        await fireEvent.click(getMask());
        expect(cancel).toHaveBeenCalledTimes(1);
        view.unmount();

        const second = vi.fn<Cancel>();
        setup({ maskClosable: false, visible: true, onCancel: second });
        await fireEvent.click(getMask());
        expect(second).not.toHaveBeenCalled();
        expect(getRoot()).not.toBeNull();
    });

    it('点击遮罩本身时关闭，点击面板内部时不关闭，onCancel 收到原生 click', async () => {
        const cancel = vi.fn<(event: MouseEvent | KeyboardEvent) => void>();
        setup({ visible: true, motion: false, onCancel: cancel });
        await fireEvent.click(getInner());
        expect(cancel).not.toHaveBeenCalled();
        await fireEvent.click(getMask());
        expect(cancel).toHaveBeenCalledTimes(1);
        expect(cancel.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
        expect(cancel.mock.calls[0][0].type).toBe('click');
    });

    it('关闭按钮调用一次 onCancel，并关闭抽屉', async () => {
        const cancel = vi.fn<Cancel>();
        setup({ visible: true, motion: false, title: 'Sheet', onCancel: cancel });
        await fireEvent.click($(`button.${prefix}-close`) as HTMLElement);
        expect(cancel).toHaveBeenCalledTimes(1);
        expect(getRoot()).toBeNull();
    });

    it('离场动画期间再次点击遮罩或关闭按钮不再调用 onCancel', async () => {
        holdAnimations();
        const cancel = vi.fn<Cancel>();
        const { store } = setup({ visible: true, onCancel: cancel });
        await fireEvent.click(getMask());
        expect(cancel).toHaveBeenCalledTimes(1);
        update(store, { visible: false });
        expect(getRoot()).not.toBeNull();
        await fireEvent.click(getMask());
        await fireEvent.click(screen.getByRole('button', { name: zh_CN.SideSheet.close }));
        expect(cancel).toHaveBeenCalledTimes(1);
    });

    it('仅在可见且设置 closeOnEsc 时按 Esc 关闭，并读取最新属性', async () => {
        const cancel = vi.fn<(event: MouseEvent | KeyboardEvent) => void>();
        const { store, view } = setup({ visible: true, onCancel: cancel });
        await pressEsc();
        expect(cancel).not.toHaveBeenCalled();

        update(store, { closeOnEsc: true });
        await pressEsc();
        expect(cancel).toHaveBeenCalledTimes(1);
        expect(cancel.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);

        update(store, { visible: false });
        await pressEsc();
        expect(cancel).toHaveBeenCalledTimes(1);

        // a leaked layer is observed through its side effects
        const page = document.body.appendChild(document.createElement('main'));
        update(store, { visible: true });
        expect(page.inert).toBe(true);
        view.unmount();
        await pressEsc();
        expect(page.inert).toBe(false);
        expect(document.body.style.overflow).not.toBe('hidden');
        page.remove();
    });

    it('隐藏状态挂载时不监听 Esc', async () => {
        const cancel = vi.fn<Cancel>();
        setup({ visible: false, closeOnEsc: true, onCancel: cancel });
        await pressEsc();
        expect(cancel).not.toHaveBeenCalled();
    });

    it('多次开关后按一次 Esc 只调用一次 onCancel，body 锁随关闭释放', async () => {
        document.body.style.overflow = 'auto';
        const cancel = vi.fn<Cancel>();
        const { store, view } = setup({ visible: true, closeOnEsc: true, motion: false, onCancel: cancel });
        for (const visible of [false, true, false, true]) {
            update(store, { visible });
        }
        expect(document.body.style.overflow).toBe('hidden');
        await pressEsc();
        expect(cancel).toHaveBeenCalledTimes(1);
        update(store, { visible: false });
        expect(document.body.style.overflow).toBe('auto');
        view.unmount();
        expect(document.querySelectorAll('.semi-portal')).toHaveLength(0);
    });
});

describe('Svelte SideSheet 动画与显示状态', () => {
    it('离场动画期间保留 DOM，动画结束后卸载并报告 afterVisibleChange', () => {
        holdAnimations();
        const { store } = setup({ visible: true }, { afterVisible: [] });
        expect(getInner()).toHaveClass(`${prefix}-animation-content_show_right`);
        expect(getMask()).toHaveClass(`${prefix}-animation-mask_show`);
        expect(store.afterVisible).toEqual([]);

        update(store, { visible: false });
        expect(getRoot()).not.toBeNull();
        expect(getInner()).toHaveClass(`${prefix}-animation-content_hide_right`);
        expect(getMask()).toHaveClass(`${prefix}-animation-mask_hide`);
        expect(store.afterVisible).toEqual([]);

        animationEnd(getInner());
        flushSync();
        expect(getRoot()).toBeNull();
        expect(store.afterVisible).toEqual([false]);

        update(store, { visible: true });
        expect(store.afterVisible).toEqual([false, true]);
        expect(getInner()).toHaveClass(`${prefix}-animation-content_show_right`);
        animationEnd(getInner());
        flushSync();
        expect(store.afterVisible).toHaveLength(2);
        expect(getInner()).not.toHaveClass(`${prefix}-animation-content_show_right`);
    });

    it('子元素冒泡上来的 animationend 不结束离场', () => {
        holdAnimations();
        const { store } = setup({ visible: true }, { footer: true });
        update(store, { visible: false });
        animationEnd($(`.${prefix}-footer span`) as HTMLElement);
        flushSync();
        expect(getRoot()).not.toBeNull();
    });

    it('页面取消动画时离场立即结束并卸载', async () => {
        const { store } = setup({ visible: true }, { afterVisible: [] });
        update(store, { visible: false });
        await tick();
        flushSync();
        expect(getRoot()).toBeNull();
        expect(store.afterVisible).toEqual([false]);
    });

    it('没有动画时每次可见性变化只报告一次，挂载时不报告', () => {
        const { store } = setup({ visible: true, motion: false }, { afterVisible: [] });
        expect(store.afterVisible).toEqual([]);
        update(store, { visible: false });
        expect(getRoot()).toBeNull();
        expect(store.afterVisible).toEqual([false]);
        update(store, { visible: true });
        expect(store.afterVisible).toEqual([false, true]);

        const hidden = setup({ visible: false }, { afterVisible: [] });
        expect(hidden.store.afterVisible).toEqual([]);
    });

    it('显示中卸载时只报告一次 afterVisibleChange(false)，从未显示的不报告', () => {
        const shown = setup({ motion: false, visible: true }, { afterVisible: [] });
        shown.view.unmount();
        expect(shown.store.afterVisible).toEqual([false]);

        const hidden = setup({ visible: false }, { afterVisible: [] });
        hidden.view.unmount();
        expect(hidden.store.afterVisible).toEqual([]);
    });

    it('keepDOM 从一开始就以隐藏状态渲染，关闭后保留内容', () => {
        const { store } = setup({ visible: false, keepDOM: true, motion: false });
        expect(getRoot()).toHaveClass(`${prefix}-hidden`);
        update(store, { visible: true });
        expect(getRoot()).not.toHaveClass(`${prefix}-hidden`);
        update(store, { visible: false });
        expect(getRoot()).toHaveClass(`${prefix}-hidden`);
        expect($(`.${prefix}-body`)?.textContent?.trim()).toBe('This is content of basic sideSheet');
    });

    it('keepDOM 有动画时，离场动画结束后隐藏，重开后可见', () => {
        holdAnimations();
        const { store } = setup({ visible: true, keepDOM: true });
        update(store, { visible: false });
        expect(getRoot()).not.toHaveClass(`${prefix}-hidden`);
        animationEnd(getInner());
        flushSync();
        expect(getRoot()).toHaveClass(`${prefix}-hidden`);
        update(store, { visible: true });
        expect(getRoot()).not.toHaveClass(`${prefix}-hidden`);
    });
});

describe('Svelte SideSheet 滚动锁、遮罩与焦点', () => {
    it('disableScroll', () => {
        const { store } = setup({ visible: true });
        expect(document.body.style.overflow).toBe('hidden');
        update(store, { visible: false });
        expect(document.body.style.overflow).not.toBe('hidden');
        update(store, { disableScroll: false, visible: true });
        expect(document.body.style.overflow).not.toBe('hidden');
    });

    it('可见时锁定 body 滚动，并恢复之前的 overflow 和结束内边距', () => {
        document.body.style.overflow = 'auto';
        document.body.style.paddingInlineEnd = '4px';
        const { store, view } = setup({ visible: true, motion: false });
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.body.style.paddingInlineEnd).not.toBe('4px');

        update(store, { visible: false });
        expect(document.body.style.overflow).toBe('auto');
        expect(document.body.style.paddingInlineEnd).toBe('4px');
        update(store, { visible: true });
        expect(document.body.style.overflow).toBe('hidden');
        view.unmount();
        expect(document.body.style.overflow).toBe('auto');
        expect(document.body.style.paddingInlineEnd).toBe('4px');
    });

    it('隐藏状态挂载或卸载，或已经隐藏时，不改动 body 滚动', () => {
        const hidden = setup({ visible: false });
        document.body.style.overflow = 'scroll';
        hidden.view.unmount();
        expect(document.body.style.overflow).toBe('scroll');

        document.body.style.overflow = 'hidden';
        document.body.style.width = '80%';
        const { store } = setup({ visible: true, motion: false });
        expect(document.body.style.width).toBe('80%');
        update(store, { visible: false });
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.body.style.width).toBe('80%');
    });

    it('无遮罩时位于 body 的抽屉不锁 body 滚动', () => {
        setup({ visible: true, motion: false, mask: false });
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
            const { view } = setup({ visible: true, title: 'Sheet', motion: false, ...props });
            expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe(ariaModal);
            expect(page.inert).toBe(inert);
            view.unmount();
        }
        page.remove();
        container.remove();
    });

    it('mask 运行中变化时 aria-modal 与 inert 同步', () => {
        const page = document.body.appendChild(document.createElement('main'));
        const { store } = setup({ visible: true, motion: false, title: 'Sheet' });
        expect(getInner()).toHaveAttribute('aria-modal', 'true');
        expect(page.inert).toBe(true);
        update(store, { visible: false });
        update(store, { visible: true, mask: false });
        expect(getInner()).not.toHaveAttribute('aria-modal');
        expect(page.inert).toBe(false);
        page.remove();
    });

    it('有遮罩时打开后获取焦点，页面设为 inert，关闭后归还焦点', () => {
        const opener = document.body.appendChild(document.createElement('button'));
        opener.focus();
        const { store } = setup({ visible: true, motion: false, title: 'Sheet' });
        const dialog = screen.getByRole('dialog', { name: 'Sheet' });
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
        expect(opener.inert).toBe(true);
        update(store, { visible: false });
        expect(opener.inert).toBe(false);
        expect(opener).toHaveFocus();
        opener.remove();
    });

    it('无遮罩时获取焦点但页面仍可用，且仅从面板内部关闭时归还焦点', () => {
        const opener = document.body.appendChild(document.createElement('button'));
        const other = document.body.appendChild(document.createElement('button'));
        opener.focus();
        const { store } = setup({ visible: true, motion: false, mask: false, title: 'Sheet' });
        const dialog = screen.getByRole('dialog', { name: 'Sheet' });
        expect(dialog).not.toHaveAttribute('aria-modal');
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
        expect(opener.inert).toBeFalsy();
        update(store, { visible: false });
        expect(opener).toHaveFocus();

        update(store, { visible: true });
        other.focus();
        update(store, { visible: false });
        expect(other).toHaveFocus();
        opener.remove();
        other.remove();
    });

    it('自定义容器中的遮罩不锁 Tab：打开时移入焦点，焦点已移到外部时关闭不抢回', () => {
        const container = document.body.appendChild(document.createElement('div'));
        const opener = document.body.appendChild(document.createElement('button'));
        const other = document.body.appendChild(document.createElement('button'));
        opener.focus();
        const { store } = setup({ visible: true, motion: false, title: 'Sheet', getPopupContainer: () => container });
        expect(screen.getByRole('dialog', { name: 'Sheet' })).toContainElement(document.activeElement as HTMLElement);
        other.focus();
        update(store, { visible: false });
        expect(other).toHaveFocus();
        for (const node of [container, opener, other]) node.remove();
    });

    it('打开时聚焦正文中带 autofocus 的元素，keepDOM 重开结果相同', () => {
        const opener = document.body.appendChild(document.createElement('button'));
        opener.focus();
        const { store } = setup({ visible: true, motion: false, keepDOM: true, title: 'Sheet' }, { content: 'autofocus' });
        const input = screen.getByRole('textbox', { name: 'name' });
        expect(input).toHaveFocus();
        update(store, { visible: false });
        expect(opener).toHaveFocus();
        update(store, { visible: true });
        expect(input).toHaveFocus();
        opener.remove();
    });
});

describe('Svelte SideSheet 容器与上下文', () => {
    it('getPopupContainer：容器与抽屉同批挂载时渲染进容器，定位为 static，不锁 body', () => {
        render(ContainerFixture);
        flushSync();
        const sheets = document.querySelectorAll(`div.${prefix}`);
        expect(sheets).toHaveLength(1);
        expect($('.sheet-container')).toContainElement(sheets[0] as HTMLElement);
        expect(getRoot()).toHaveClass(`${prefix}-popup`);
        expect(($('.semi-portal') as HTMLElement).style.position).toBe('static');
        expect(document.body.style.overflow).toBe('');
    });

    it('getPopupContainer 返回 body 时与默认一致：锁 body 滚动，不加 popup 类', () => {
        setup({ visible: true, motion: false, getPopupContainer: () => document.body });
        expect(getRoot()).not.toHaveClass(`${prefix}-popup`);
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('ConfigProvider 的 getPopupContainer：渲染进容器，不锁 body，没有 aria-modal 与 inert', () => {
        const page = document.body.appendChild(document.createElement('main'));
        render(ContainerFixture, { props: { config: true } });
        flushSync();
        expect($('.sheet-container')).toContainElement(getRoot());
        expect(screen.getByRole('dialog', { name: 'Sheet' })).not.toHaveAttribute('aria-modal');
        expect(document.body.style.overflow).toBe('');
        expect(page.inert).toBeFalsy();
        page.remove();
    });

    it('自身 getPopupContainer 优先于 ConfigProvider', () => {
        render(ContainerFixture, { props: { config: true, own: () => document.body } });
        flushSync();
        expect($('.semi-portal')?.parentElement).toBe(document.body);
        expect(screen.getByRole('dialog', { name: 'Sheet' })).toHaveAttribute('aria-modal', 'true');
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('ConfigProvider direction 为 rtl 时 portal 输出 dir="rtl"', () => {
        render(ConfigFixture, { props: { props: { direction: 'rtl' } } });
        flushSync();
        expect($('.semi-portal')).toHaveAttribute('dir', 'rtl');
    });

    it('关闭按钮名称随语言包', () => {
        render(ConfigFixture, { props: { props: { locale: ja_JP } } });
        flushSync();
        expect(screen.getByRole('button', { name: ja_JP.SideSheet.close })).toHaveClass(`${prefix}-close`);
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值，显式属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { SideSheet: { placement: 'left', closable: false } };
        const { view } = setup({ visible: true });
        expect(getRoot()).toHaveClass(`${prefix}-left`);
        expect($(`.${prefix}-close`)).toBeNull();
        view.unmount();
        setup({ visible: true, placement: 'top' });
        expect(getRoot()).toHaveClass(`${prefix}-top`);
    });

    it('全局默认值：mask、zIndex 与函数 prop getPopupContainer', () => {
        const container = document.body.appendChild(document.createElement('div'));
        semiGlobal.config.overrideDefaultProps = { SideSheet: { mask: false, zIndex: 2000, getPopupContainer: () => container } };
        const { view } = setup({ visible: true });
        expect(getMask()).toBeNull();
        expect($('.semi-portal')?.style.zIndex).toBe('2000');
        expect($('.semi-portal')?.parentElement).toBe(container);
        view.unmount();
        setup({ visible: true, getPopupContainer: () => document.body });
        expect($('.semi-portal')?.parentElement).toBe(document.body);
        container.remove();
    });
});

describe('Svelte SideSheet 属性落点', () => {
    it('data-* 与 class 落在外层容器上', () => {
        setup({ visible: true, class: 'test', 'data-testid': 'sheet', 'data-foo': 'bar' } as SideSheetProps);
        const node = screen.getByTestId('sheet');
        expect(node).toBe(getRoot());
        expect(node).toHaveClass('test');
        expect(node).toHaveAttribute('data-foo', 'bar');
        expect(getInner()).not.toHaveClass('test');
    });

    it('通过 aria-label 为对话框命名', () => {
        setup({ visible: true, title: 'Title', 'aria-label': 'Settings' });
        expect(screen.getByRole('dialog', { name: 'Settings' })).toBe(getInner());
        expect(getInner()).not.toHaveAttribute('aria-labelledby');
        expect(getRoot()).not.toHaveAttribute('aria-label');
    });

    it('aria-labelledby、aria-describedby 和 aria-modal 落在对话框上，data-* 落在外层容器上', () => {
        setup({
            visible: true,
            'aria-labelledby': 'outside-label',
            'aria-describedby': 'outside-desc',
            'aria-modal': 'true',
            'aria-roledescription': 'sheet',
            'data-foo': 'bar',
        } as SideSheetProps);
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBe(getInner());
        expect(dialog).toHaveAttribute('aria-labelledby', 'outside-label');
        expect(dialog).toHaveAttribute('aria-describedby', 'outside-desc');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-roledescription', 'sheet');
        expect(dialog).not.toHaveAttribute('data-foo');
        expect(getRoot()).toHaveAttribute('data-foo', 'bar');
        for (const name of ['aria-labelledby', 'aria-describedby', 'aria-modal', 'aria-roledescription']) {
            expect(getRoot()).not.toHaveAttribute(name);
        }
    });

    it('未知属性与原生监听落在外层容器上；style 落在对话框并被计算宽度覆盖', async () => {
        const onclick = vi.fn<(event: MouseEvent) => void>();
        const cancel = vi.fn<Cancel>();
        setup({ visible: true, id: 'sheet', role: 'presentation', width: 300, style: 'color: red; width: 10px', onclick, onCancel: cancel });
        expect(getRoot()).toHaveAttribute('id', 'sheet');
        expect(getRoot()).toHaveAttribute('role', 'presentation');
        expect(getInner()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getInner().style.width).toBe('300px');
        await fireEvent.click(getInner());
        expect(onclick).toHaveBeenCalledTimes(1);
        await fireEvent.click(getMask());
        expect(onclick).toHaveBeenCalledTimes(2);
        expect(cancel).toHaveBeenCalledTimes(1);
    });
});

describe('Svelte SideSheet 对话框名称警告', () => {
    const nameWarnings = (warn: ReturnType<typeof vi.spyOn>) => warn.mock.calls.filter(([message]: unknown[]) => String(message).includes('[Semi SideSheet]'));

    it('没有名称打开时只警告一次', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        setup({ motion: false, visible: true });
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(nameWarnings(warn)).toHaveLength(1);
    });

    it('有 title 时不警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        setup({ title: 'Named', motion: false, visible: true });
        expect(screen.getByRole('dialog', { name: 'Named' })).toBeInTheDocument();
        expect(nameWarnings(warn)).toHaveLength(0);
    });
});

describe('Svelte SideSheet 受控值（$bindable）', () => {
    const setupMode = (mode: 'bind' | 'function' | 'one-way' | 'uncontrolled', value?: boolean, accept = true) => {
        const store = createStore<{ value: boolean | undefined; accept: boolean; log: string[] }>({ value, accept, log: [] });
        render(SideSheetModes, { props: { mode, store } });
        flushSync();
        return store;
    };

    it('不传 visible：关闭，不渲染', () => {
        setupMode('uncontrolled');
        expect(getRoot()).toBeNull();
    });

    it('bind:visible：Esc 写回父级并关闭，父级再设为 true 重新打开', async () => {
        const store = setupMode('bind', true);
        expect(screen.getByRole('dialog', { name: 'Sheet' })).toBeInTheDocument();
        await pressEsc();
        expect(store.value).toBe(false);
        expect(store.log).toEqual(['cancel']);
        expect(getRoot()).toBeNull();
        store.value = true;
        flushSync();
        expect(getRoot()).not.toBeNull();
        store.value = undefined;
        flushSync();
        expect(getRoot()).toBeNull();
    });

    it('函数绑定：setter 拒绝时保持打开，接受时关闭', async () => {
        const rejected = setupMode('function', true, false);
        await pressEsc();
        expect(rejected.log).toEqual(['set false', 'cancel']);
        expect(rejected.value).toBe(true);
        expect(getRoot()).not.toBeNull();
    });

    it('函数绑定：setter 接受时跟随', async () => {
        const store = setupMode('function', true, true);
        await pressEsc();
        expect(store.value).toBe(false);
        expect(getRoot()).toBeNull();
    });

    it('单向 visible：交互时本地关闭且不写回，父级再推新值时以父级为准', async () => {
        const store = setupMode('one-way', true);
        await pressEsc();
        expect(store.log).toEqual(['cancel']);
        expect(getRoot()).toBeNull();
        expect(store.value).toBe(true);
        store.value = false;
        flushSync();
        store.value = true;
        flushSync();
        expect(getRoot()).not.toBeNull();
    });
});
