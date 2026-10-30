import { flushSync, tick } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import Avatar from '../avatar.svelte';
import type { AvatarColor, AvatarProps } from '../interface';
import TopSlotSvg from '../top-slot-svg.svelte';
import AvatarFixture from './avatar-fixture.svelte';

const prefix = 'semi-avatar';
const src = 'https://example.com/avatar.png';
const root = (container: Element) => container.querySelector(`.${prefix}`) as HTMLElement;

type Store = AvatarProps & { label?: string; node?: boolean; hover?: string; top?: boolean; bottom?: boolean; customMarks?: boolean };

function setup(props: Store = {}) {
    const store = createStore<Store>(props);
    const view = render(AvatarFixture, { props: { store } });
    return { store, container: view.container, unmount: view.unmount };
}

afterEach(() => {
    semiGlobal.config = {};
    vi.restoreAllMocks();
});

describe('Svelte Avatar', () => {
    it('独立头像无列表语义，默认灰色中号圆形，透传原生属性', () => {
        const { container } = setup({ id: 'avatar', title: 'title', class: 'own', 'data-avatar': 'yes', style: 'margin: 4px' });
        expect(root(container)).toHaveClass(prefix, `${prefix}-grey`, `${prefix}-medium`, `${prefix}-circle`, 'own');
        expect(root(container)).toHaveAttribute('id', 'avatar');
        expect(root(container)).toHaveAttribute('data-avatar', 'yes');
        expect(root(container)).not.toHaveAttribute('role');
        expect(root(container)).toHaveStyle({ margin: '4px' });
        expect(screen.getByRole('img', { name: 'Semi' })).not.toHaveAttribute('tabindex');
    });

    it.each(['extra-extra-small', 'extra-small', 'small', 'default', 'medium', 'large', 'extra-large'])('支持预设尺寸 %s', (size) => {
        const { container } = setup({ size });
        expect(root(container)).toHaveClass(`${prefix}-${size}`);
    });

    it.each(['amber', 'blue', 'cyan', 'green', 'grey', 'indigo', 'light-blue', 'light-green', 'lime', 'orange', 'pink', 'purple', 'red', 'teal', 'violet', 'yellow'] satisfies AvatarColor[])('支持颜色 %s', (color) => {
        const { container } = setup({ color });
        expect(root(container)).toHaveClass(`${prefix}-${color}`);
    });

    it('没有图片也没有内容时渲染稳定，不反复切换文字层', async () => {
        const { container } = render(Avatar, { props: { size: 'extra-small', alt: '' } });
        for (let i = 0; i < 10; i++) {
            await tick();
        }
        let mutations = 0;
        const observer = new MutationObserver((records) => {
            mutations += records.length;
        });
        observer.observe(container, { childList: true, subtree: true, characterData: true });
        for (let i = 0; i < 20; i++) {
            await tick();
        }
        observer.disconnect();
        expect(mutations).toBe(0);
        expect(root(container).querySelector(`.${prefix}-label`)).toBeNull();
    });

    it('自定义尺寸与 style 只作用在外层，边框支持颜色与动画', () => {
        const { container } = setup({ size: '64px', shape: 'square', border: { color: 'red', motion: true }, style: 'margin: 4px' });
        const wrapper = container.querySelector(`.${prefix}-wrapper`) as HTMLElement;
        expect(wrapper).toHaveStyle({ width: '64px', height: '64px', margin: '4px' });
        expect(root(container)).not.toHaveStyle({ margin: '4px' });
        const rings = container.querySelectorAll(`.${prefix}-additionalBorder`);
        expect(rings).toHaveLength(2);
        expect(rings[1]).toHaveClass(`${prefix}-additionalBorder-animated`, `${prefix}-square`);
        expect(rings[1]).toHaveStyle({ borderColor: 'rgb(255, 0, 0)' });
    });

    it('图片有 alt、srcSet 与 imgAttr，出错一次只通知一次并回退到文字', async () => {
        const onError = vi.fn<NonNullable<AvatarProps['onError']>>();
        const { store, container } = setup({ src, srcSet: `${src} 2x`, alt: 'Bob', color: 'red', imgAttr: { draggable: false }, onError, label: 'B' });
        const image = screen.getByRole('img', { name: 'Bob' });
        expect(image).toHaveAttribute('src', src);
        expect(image).toHaveAttribute('srcset', `${src} 2x`);
        expect(image).toHaveAttribute('draggable', 'false');
        expect(root(container)).toHaveClass(`${prefix}-img`);
        await fireEvent.error(image);
        flushSync();
        expect(onError).toHaveBeenCalledExactlyOnceWith();
        expect(container.querySelector('img')).toBeNull();
        expect(screen.getByRole('img', { name: 'Bob' })).toHaveTextContent('B');
        expect(root(container)).toHaveClass(`${prefix}-red`);
        store.src = `${src}?new`;
        flushSync();
        expect(container.querySelector('img')).toHaveAttribute('src', `${src}?new`);
        await fireEvent.error(container.querySelector('img') as HTMLImageElement);
        expect(onError).toHaveBeenCalledTimes(2);
    });

    it('onError 返回 false 时保留图片', async () => {
        const { container } = setup({ src, onError: () => false });
        await fireEvent.error(container.querySelector('img') as HTMLImageElement);
        flushSync();
        expect(container.querySelector('img')).toHaveAttribute('src', src);
    });

    it('imgAttr.class 与可点击头像的焦点类合并，imgAttr.onerror 与内置回退都执行', async () => {
        const onImgError = vi.fn<() => void>();
        const { container } = setup({ src, alt: 'Bob', imgAttr: { class: 'my-img', onerror: onImgError }, onclick: () => {}, label: 'B' });
        const image = screen.getByRole('button', { name: 'Bob' });
        expect(image).toHaveClass('my-img', `${prefix}-no-focus-visible`);
        await fireEvent.error(image);
        flushSync();
        expect(onImgError).toHaveBeenCalledTimes(1);
        expect(container.querySelector('img')).toBeNull();
    });

    it('imgAttr 的 alt 覆盖组件 alt，包括显式 undefined', () => {
        const { store, container } = setup({ src, alt: '组件名称', imgAttr: { alt: '图片名称' } });
        expect(screen.getByRole('img', { name: '图片名称' })).toBeInTheDocument();
        store.imgAttr = { alt: undefined };
        flushSync();
        expect(container.querySelector('img')).not.toHaveAttribute('alt');
    });

    it('非文字内容原样回退，可点击元素有 alt 名称', async () => {
        const click = vi.fn<(event: MouseEvent) => void>();
        const { container } = setup({ src, alt: 'icon', onclick: click, node: true, label: 'B' });
        await fireEvent.error(container.querySelector('img') as HTMLImageElement);
        flushSync();
        await tick();
        expect(container.querySelector(`.${prefix}-content`)).toBeNull();
        const button = screen.getByRole('button', { name: 'icon' });
        await fireEvent.keyDown(button, { key: 'Enter' });
        expect(click).toHaveBeenCalledTimes(1);
    });

    it('文字内容在挂载后判定，元素内容回到无包装结构', async () => {
        const { store, container } = setup({ node: true });
        await tick();
        expect(container.querySelector(`.${prefix}-content`)).toBeNull();
        expect(root(container).querySelector('b')).toHaveTextContent('Semi');
        store.node = false;
        flushSync();
        await vi.waitFor(() => expect(screen.getByRole('img', { name: 'Semi' })).toBeInTheDocument());
    });

    it('click 监听从无到有时立即提供键盘按钮语义', async () => {
        const { store } = setup({ alt: '用户头像' });
        expect(screen.getByRole('img', { name: '用户头像' })).not.toHaveAttribute('tabindex');
        const click = vi.fn<(event: MouseEvent) => void>();
        store.onclick = click;
        flushSync();
        const button = screen.getByRole('button', { name: '用户头像' });
        expect(button).toHaveAttribute('tabindex', '0');
        await fireEvent.keyDown(button, { key: 'Enter' });
        expect(click).toHaveBeenCalledTimes(1);
        store.onclick = undefined;
        flushSync();
        expect(screen.queryByRole('button', { name: '用户头像' })).toBeNull();
        expect(screen.getByRole('img', { name: '用户头像' })).not.toHaveAttribute('tabindex');
    });

    it.each([false, true])('鼠标与键盘事件只通知一次，包装层=%s', async (border) => {
        const click = vi.fn<(event: MouseEvent) => void>();
        const enter = vi.fn<(event: MouseEvent) => void>();
        const leave = vi.fn<(event: MouseEvent) => void>();
        const { container } = setup({ border, alt: 'user', tabindex: 2, 'aria-describedby': 'help', onclick: click, onMouseEnter: enter, onMouseLeave: leave, label: 'Semi', hover: 'mask' });
        const eventRoot = border ? (container.querySelector(`.${prefix}-wrapper`) as HTMLElement) : root(container);
        await fireEvent.mouseEnter(eventRoot);
        flushSync();
        expect(enter).toHaveBeenCalledTimes(1);
        expect(enter.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
        expect(screen.getByText('mask')).toBeInTheDocument();
        await fireEvent.mouseLeave(eventRoot);
        flushSync();
        expect(leave).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('mask')).toBeNull();
        const control = screen.getByRole('button', { name: 'user' });
        expect(control).toHaveAttribute('tabindex', '2');
        expect(control).toHaveAttribute('aria-describedby', 'help');
        expect(root(container)).not.toHaveAttribute('tabindex');
        await fireEvent.keyDown(control, { key: 'Enter' });
        await fireEvent.keyDown(control, { key: ' ' });
        await fireEvent.keyDown(control, { key: 'Escape' });
        expect(click).toHaveBeenCalledTimes(2);
    });

    it('没有 hoverMask 时悬停不渲染遮罩层，有则随内容更新', async () => {
        const plain = setup();
        await fireEvent.mouseEnter(root(plain.container));
        flushSync();
        expect(plain.container.querySelector(`.${prefix}-hover`)).toBeNull();
        plain.unmount();
        const { store, container } = setup({ hover: 'mask' });
        await fireEvent.mouseEnter(root(container));
        flushSync();
        store.hover = 'new mask';
        flushSync();
        expect(screen.getByText('new mask')).toBeInTheDocument();
    });

    it('topSlot、bottomSlot 配置与文本内容', () => {
        const { store, container } = setup({ top: true, bottom: true, size: 'large', contentMotion: true, topSlot: { className: 'top', textColor: 'red' }, bottomSlot: { shape: 'square', className: 'bottom', bgColor: 'blue' } });
        expect(screen.getByText('直播')).toBeInTheDocument();
        expect(container.querySelector('.top')).toHaveClass(`${prefix}-animated`);
        expect(container.querySelector('.bottom')).toHaveClass(`${prefix}-bottom_slot-shape_square-large`);
        expect(container.querySelector('.bottom')).toHaveStyle({ backgroundColor: 'rgb(0, 0, 255)' });
        store.shape = 'square';
        flushSync();
        expect(screen.queryByText('直播')).toBeNull();
        expect(screen.getByText('NEW')).toBeInTheDocument();
        store.size = 'extra-extra-small';
        flushSync();
        expect(screen.queryByText('NEW')).toBeNull();
    });

    it('topSlot.render 与 bottomSlot.render 完整替换标记', () => {
        const { container } = setup({ customMarks: true });
        expect(screen.getByText('custom top')).toBeInTheDocument();
        expect(screen.getByText('custom bottom')).toBeInTheDocument();
        expect(container.querySelector(`.${prefix}-bottom_slot`)).toBeNull();
    });

    it('渐变 id 实例间唯一', () => {
        const first = render(TopSlotSvg, { props: { gradientStart: 'red', gradientEnd: 'blue' } });
        const second = render(TopSlotSvg, { props: { gradientStart: 'red', gradientEnd: 'blue' } });
        expect(first.container.querySelector('linearGradient')?.id).not.toBe(second.container.querySelector('linearGradient')?.id);
    });

    it('从全局默认值读取配置与 onError，显式配置优先', async () => {
        const onError = vi.fn<NonNullable<AvatarProps['onError']>>(() => false);
        semiGlobal.config = { overrideDefaultProps: { Avatar: { shape: 'square', color: 'red', onError } } };
        const view = render(Avatar, { props: { src } });
        expect(root(view.container)).toHaveClass(`${prefix}-square`);
        await fireEvent.error(view.container.querySelector('img') as HTMLImageElement);
        expect(onError).toHaveBeenCalledOnce();
        view.unmount();
        const explicit = render(Avatar, { props: { shape: 'circle' } });
        expect(root(explicit.container)).toHaveClass(`${prefix}-circle`);
    });

    it('初始文字与内容变化按 gap 重新缩放', async () => {
        vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
            return this.classList.contains(`${prefix}-content`) ? (this.textContent ?? '').length * 10 : this.classList.contains(prefix) ? 40 : 0;
        });
        const { store, container } = setup({ label: 'Semi Design', gap: 5 });
        await vi.waitFor(() => expect(container.querySelector(`.${prefix}-content`)).toHaveStyle({ transform: `scale(${30 / 110})` }));
        store.label = 'AB';
        await vi.waitFor(() => expect(container.querySelector(`.${prefix}-content`)).toHaveStyle({ transform: 'scale(1)' }));
    });
});
