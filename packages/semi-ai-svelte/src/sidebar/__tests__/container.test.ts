import { createRawSnippet, flushSync, tick } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { openLayer } from '@fibrae/semi-foundation/utils/layer';
import { createStore } from '@fibrae/semi-ui-svelte/_base/__tests__/store.svelte';
import type { ContainerProps } from '../container/interface';
import { Sidebar } from '../index';
import BindHost, { type BindHostStore } from './bind-host.svelte';

const Container = Sidebar.Container;
const prefix = 'semi-sidebar';
const text = zh_CN.Sidebar;
const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
const root = () => $(`.${prefix}-container`);
const resizableSelector = '.semi-resizable-resizable';
const closeButton = () => screen.queryByRole('button', { name: text.close });
const snippet = (html: string) => createRawSnippet(() => ({ render: () => html }));

function setup(props: ContainerProps = {}) {
    return render(Container, { props: { children: snippet('<p>内容</p>'), ...props } });
}

function bound(initial: Partial<BindHostStore> = {}) {
    const store = createStore<BindHostStore>({ kind: 'container', visible: true, log: [], ...initial });
    const view = render(BindHost, { props: { store } });
    return { store, view };
}

afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
});

describe('Svelte Sidebar.Container', () => {
    it('不可见时不渲染', () => {
        setup({ visible: false });
        expect(root()).toBeNull();
        expect(setup({}).component.getRoot()).toBeNull();
    });

    it('渲染标题、关闭按钮、内容，并透传 class 与 style', () => {
        setup({ visible: true, title: '标题', class: 'custom', style: 'color: red' });
        expect(root()).toHaveClass(`${prefix}-container`, 'custom');
        expect(root()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect($(`.${prefix}-container-header-title`)).toHaveTextContent('标题');
        expect($(`.${prefix}-container-content`)).toHaveTextContent('内容');
        expect(closeButton()).toBeInTheDocument();
    });

    it('title 可以是 snippet', () => {
        setup({ visible: true, title: snippet('<em>自定义</em>') });
        expect($(`.${prefix}-container-header-title em`)).toHaveTextContent('自定义');
    });

    it('showClose 为 false 时不渲染关闭按钮', () => {
        setup({ visible: true, showClose: false });
        expect(closeButton()).toBeNull();
    });

    it('header snippet 替换默认头部', () => {
        setup({ visible: true, title: '标题', header: snippet('<div class="mine">头</div>') });
        expect($('.mine')).toBeInTheDocument();
        expect($(`.${prefix}-container-header`)).toBeNull();
    });

    it('未声明的属性落在容器元素上，带 aria-label 时为 group', () => {
        setup({ visible: true, 'aria-label': '侧栏', 'data-test': 'x' } as ContainerProps);
        expect(root()).toHaveAttribute('data-test', 'x');
        expect(screen.getByRole('group', { name: '侧栏' })).toBe(root());
    });

    it('resizable 为 false 时不包 Resizable', () => {
        setup({ visible: true, resizable: false });
        expect($(resizableSelector)).toBeNull();
        expect(root()).toBeInTheDocument();
    });

    it('默认带 Resizable，宽度下限为 minWidth', () => {
        setup({ visible: true, minWidth: 200 });
        expect($(resizableSelector)).toContainElement(root());
        expect($(resizableSelector)).toHaveStyle({ minWidth: '200px' });
    });

    it('点击关闭按钮先写 visible=false 再触发 onCancel', async () => {
        const { store } = bound();
        await fireEvent.click(closeButton() as HTMLElement);
        expect(store.visible).toBe(false);
        expect(store.log).toEqual(['cancel']);
        await tick();
        expect(root()).toBeNull();
    });

    it('bind:visible 从外部关闭和重新打开', async () => {
        const { store } = bound({ visible: false });
        expect(root()).toBeNull();
        store.visible = true;
        flushSync();
        expect(root()).toBeInTheDocument();
        store.visible = false;
        flushSync();
        await vi.waitFor(() => expect(root()).toBeNull());
    });

    it('closeOnEsc 为 true 时 Esc 关闭，默认不关闭', async () => {
        const onCancel = vi.fn<NonNullable<ContainerProps['onCancel']>>();
        const view = setup({ visible: true, onCancel });
        await fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).not.toHaveBeenCalled();
        view.unmount();

        const onCancel2 = vi.fn<NonNullable<ContainerProps['onCancel']>>();
        setup({ visible: true, closeOnEsc: true, onCancel: onCancel2 });
        await fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel2).toHaveBeenCalledTimes(1);
    });

    it('卸载后 Esc 不再触发 onCancel', async () => {
        const onCancel = vi.fn<NonNullable<ContainerProps['onCancel']>>();
        const view = setup({ visible: true, closeOnEsc: true, onCancel });
        view.unmount();
        await fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('afterVisibleChange 在进入和离开动画结束后触发', async () => {
        const afterVisibleChange = vi.fn<NonNullable<ContainerProps['afterVisibleChange']>>();
        const view = setup({ visible: false, afterVisibleChange });
        await view.rerender({ visible: true });
        await vi.waitFor(() => expect(afterVisibleChange).toHaveBeenLastCalledWith(true));
        await view.rerender({ visible: false });
        await vi.waitFor(() => expect(afterVisibleChange).toHaveBeenLastCalledWith(false));
        expect(afterVisibleChange).toHaveBeenCalledTimes(2);
    });

    it('使用方传入的 onintroend、onoutroend 与组件自身的动画结束逻辑都会执行', async () => {
        const onintroend = vi.fn<NonNullable<ContainerProps['onintroend']>>();
        const onoutroend = vi.fn<NonNullable<ContainerProps['onoutroend']>>();
        const afterVisibleChange = vi.fn<NonNullable<ContainerProps['afterVisibleChange']>>();
        const view = setup({ visible: false, afterVisibleChange, onintroend, onoutroend });
        await view.rerender({ visible: true });
        await vi.waitFor(() => expect(afterVisibleChange).toHaveBeenLastCalledWith(true));
        expect(onintroend).toHaveBeenCalledTimes(1);
        await view.rerender({ visible: false });
        await vi.waitFor(() => expect(afterVisibleChange).toHaveBeenLastCalledWith(false));
        expect(onoutroend).toHaveBeenCalledTimes(1);
    });

    it('初始可见时不报告 afterVisibleChange', async () => {
        const afterVisibleChange = vi.fn<NonNullable<ContainerProps['afterVisibleChange']>>();
        setup({ visible: true, afterVisibleChange });
        await tick();
        expect(afterVisibleChange).not.toHaveBeenCalled();
    });

    it('关闭后焦点回到打开前的元素', async () => {
        const trigger = document.body.appendChild(document.createElement('button'));
        trigger.focus();
        const view = setup({ visible: false, motion: false });
        await view.rerender({ visible: true });
        const inner = document.createElement('button');
        root()?.appendChild(inner);
        inner.focus();
        await view.rerender({ visible: false });
        await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
    });

    it('同一帧内打开又关闭也会把焦点还回去', async () => {
        const trigger = document.body.appendChild(document.createElement('button'));
        trigger.focus();
        const view = setup({ visible: false, motion: false });
        await view.rerender({ visible: true });
        await view.rerender({ visible: false });
        await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
    });

    it('初始可见的容器关闭后也还焦点', async () => {
        const trigger = document.body.appendChild(document.createElement('button'));
        trigger.focus();
        const view = setup({ visible: true, motion: false });
        root()?.setAttribute('tabindex', '-1');
        root()?.focus();
        await view.rerender({ visible: false });
        await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
    });

    it.each([true, false])('关闭后焦点回到打开前的元素，焦点已移到页面其他位置时保持（motion=%s）', async (motion) => {
        const opener = document.body.appendChild(document.createElement('button'));
        const other = document.body.appendChild(document.createElement('button'));
        opener.focus();
        const view = setup({ visible: false, motion });
        await view.rerender({ visible: true });
        closeButton()?.focus();
        await view.rerender({ visible: false });
        await vi.waitFor(() => expect(opener).toHaveFocus());

        await view.rerender({ visible: true });
        other.focus();
        await view.rerender({ visible: false });
        await tick();
        expect(other).toHaveFocus();
    });

    it.each([true, false])('初始可见的容器关闭后焦点同样回到挂载前聚焦的元素（motion=%s）', async (motion) => {
        const opener = document.body.appendChild(document.createElement('button'));
        opener.focus();
        const view = setup({ visible: true, motion });
        await tick();
        closeButton()?.focus();
        await view.rerender({ visible: false });
        await vi.waitFor(() => expect(opener).toHaveFocus());
    });

    it('初始可见的容器在挂载的同一个 tick 内关闭，焦点回到挂载前聚焦的元素', async () => {
        const opener = document.body.appendChild(document.createElement('button'));
        opener.focus();
        const { store } = bound();
        closeButton()?.focus();
        store.visible = false;
        await tick();
        await vi.waitFor(() => expect(opener).toHaveFocus());
    });

    it('showClose 在挂载后变为 false 时移除关闭按钮', async () => {
        const view = setup({ visible: true });
        expect(closeButton()).toBeInTheDocument();
        await view.rerender({ showClose: false });
        expect(closeButton()).toBeNull();
    });

    it('关闭按钮的点击事件交给 onCancel', async () => {
        const onCancel = vi.fn<NonNullable<ContainerProps['onCancel']>>();
        setup({ visible: true, onCancel });
        await fireEvent.click(closeButton() as HTMLElement);
        expect(onCancel).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));
    });

    it('closeButton 带有关闭按钮的类名', () => {
        setup({ visible: true });
        expect(closeButton()).toHaveClass(`${prefix}-container-header-closeBtn`);
    });

    it('未声明属性落在容器 div 上，不落在 Resizable 外层', () => {
        setup({ visible: true, id: 'side' } as ContainerProps);
        expect($(resizableSelector)).not.toHaveAttribute('id');
        expect(root()).toHaveAttribute('id', 'side');
    });

    it('使用方的 role 优先于 group，未命名时没有 role', () => {
        setup({ visible: true, 'aria-label': 'S', role: 'region' } as ContainerProps);
        expect(root()).toHaveAttribute('role', 'region');
        document.body.innerHTML = '';
        setup({ visible: true });
        expect(root()).not.toHaveAttribute('role');
    });

    it('没有动画时隐藏后立即卸载，再显示后重新挂载', async () => {
        const view = setup({ visible: true, motion: false });
        expect(root()).toBeInTheDocument();
        await view.rerender({ visible: false });
        expect(root()).toBeNull();
        await view.rerender({ visible: true });
        expect(root()).toBeInTheDocument();
    });

    it('有动画时进入带显示动画类，离开播完后卸载，再显示重新带显示动画类', async () => {
        const view = setup({ visible: true });
        expect(root()).toHaveClass(`${prefix}-animation-content_show`);
        // the stubbed animation has no duration, so the hide class is asserted in the browser test
        await view.rerender({ visible: false });
        await vi.waitFor(() => expect(root()).toBeNull());
        await view.rerender({ visible: true });
        expect(root()).toHaveClass(`${prefix}-animation-content_show`);
    });

    it('离场动画期间重新显示时保持挂载', async () => {
        const view = setup({ visible: true });
        await view.rerender({ visible: false });
        await view.rerender({ visible: true });
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(root()).toBeInTheDocument();
    });

    it('closeOnEsc 在挂载后打开时才响应 Escape', async () => {
        const onCancel = vi.fn<NonNullable<ContainerProps['onCancel']>>();
        const view = setup({ visible: true, onCancel });
        await tick();
        await fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).not.toHaveBeenCalled();
        await view.rerender({ closeOnEsc: true });
        await fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('没有动画时 afterVisibleChange 同样报告隐藏和再次显示，初始可见不报告', async () => {
        const afterVisibleChange = vi.fn<NonNullable<ContainerProps['afterVisibleChange']>>();
        const view = setup({ visible: true, motion: false, afterVisibleChange });
        await tick();
        expect(afterVisibleChange).not.toHaveBeenCalled();
        await view.rerender({ visible: false });
        expect(afterVisibleChange.mock.calls).toEqual([[false]]);
        await view.rerender({ visible: true });
        expect(afterVisibleChange.mock.calls).toEqual([[false], [true]]);
    });

    it('Escape 图层随卸载释放，同一页面上再开一个容器仍可用 Escape 关闭', async () => {
        const first = setup({ visible: true, closeOnEsc: true, motion: false });
        first.unmount();
        const onCancel = vi.fn<NonNullable<ContainerProps['onCancel']>>();
        setup({ visible: true, closeOnEsc: true, motion: false, onCancel });
        await tick();
        await fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
    });
});

describe('Svelte Sidebar.Container 的 Resizable', () => {
    it('唯一启用的左边拖拽条是键盘可用的分隔符', () => {
        setup({ title: 'Title', motion: false, visible: true });
        const separator = screen.getByRole('separator');
        expect(separator).toHaveClass('semi-resizable-resizableHandler-left');
        expect(separator).toHaveAttribute('tabindex', '0');
        expect(separator).toHaveAttribute('aria-orientation', 'vertical');
        expect(separator).toHaveAccessibleName();
        expect(separator.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }))).toBe(false);
    });

    it('先打开的模态浮层不会让侧边栏自己的拖拽条变为 inert', async () => {
        const modal = document.body.appendChild(document.createElement('div'));
        const release = openLayer({ element: modal, modal: true });
        const view = setup({ title: 'Title', motion: false, visible: true });
        await Promise.resolve();
        const handle = $('.semi-resizable-resizableHandler-left');
        expect(handle).not.toBeNull();
        expect(handle?.parentElement?.inert).toBeFalsy();
        view.unmount();
        release();
    });
});
