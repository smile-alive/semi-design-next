/** @jsxImportSource vue */
import { nextTick } from 'vue';
import { fireEvent } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import semiGlobal from '../../_utils/semi-global';
import Avatar from '../avatar.vue';
import type { AvatarColor, AvatarEmits, AvatarProps } from '../interface';
import TopSlotSvg from '../top-slot-svg.vue';
import AvatarRoot from './fixtures/avatar-root.vue';
import Fixture from './fixtures/avatar.vue';
import ClickListener from './fixtures/click-listener.vue';

const prefix = 'semi-avatar';
const src = 'https://example.com/avatar.png';
const root = (container: Element) => container.querySelector(`.${prefix}`) as HTMLElement;
afterEach(() => {
    semiGlobal.config = {};
});

describe('Avatar', () => {
    it('无包装头像的模板 ref.$el 始终是头像 span', async () => {
        const view = render(AvatarRoot);
        const element = root(view.container);
        expect(element.tagName).toBe('SPAN');
        expect(view.emitted<[Element]>('root')[0][0]).toBe(element);
        await view.rerender({ alt: '更新名称' });
        expect(view.emitted<[Element]>('root').at(-1)?.[0]).toBe(element);
    });
    it('切换边框与顶部插槽时根元素和事件落点保持一致', async () => {
        const view = render(AvatarRoot, { attrs: { 'data-avatar': 'avatar' } });
        await view.rerender({ border: true });
        const wrapper = view.container.querySelector(`.${prefix}-wrapper`) as HTMLElement;
        expect(view.emitted<[Element]>('root').at(-1)?.[0]).toBe(wrapper);
        expect(root(view.container)).toHaveAttribute('data-avatar', 'avatar');
        await fireEvent.click(root(view.container));
        expect(view.emitted<[MouseEvent]>('click')).toHaveLength(1);
        await fireEvent.mouseEnter(wrapper);
        expect(view.getByText('mask')).toBeInTheDocument();
        await fireEvent.mouseLeave(wrapper);
        expect(view.queryByText('mask')).toBeNull();
        await view.rerender({ border: false, top: true });
        expect(view.emitted<[Element]>('root').at(-1)?.[0]).toBe(wrapper);
        expect(view.getByText('直播')).toBeInTheDocument();
        await fireEvent.click(root(view.container));
        expect(view.emitted<[MouseEvent]>('click')).toHaveLength(2);
        await view.rerender({ top: false });
        expect(view.container.querySelector(`.${prefix}-wrapper`)).toBeNull();
        expect(view.emitted<[Element]>('root').at(-1)?.[0]).toBe(root(view.container));
        await fireEvent.click(root(view.container));
        expect(view.emitted<[MouseEvent]>('click')).toHaveLength(3);
    });
    it('只有 click 监听从无到有时立即提供键盘按钮语义', async () => {
        const view = render(ClickListener);
        expect(view.getByRole('img', { name: '用户头像' })).not.toHaveAttribute('tabindex');
        await fireEvent.click(view.getByRole('button', { name: '切换点击监听' }));
        const button = view.getByRole('button', { name: '用户头像' });
        expect(button).toHaveAttribute('tabindex', '0');
        await fireEvent.keyDown(button, { key: 'Enter' });
        expect(view.emitted<[MouseEvent]>('activate')).toHaveLength(1);
    });

    it('只有 click 监听移除时立即移除键盘按钮语义', async () => {
        const view = render(ClickListener, { props: { initialEnabled: true } });
        expect(view.getByRole('button', { name: '用户头像' })).toHaveAttribute('tabindex', '0');
        await fireEvent.click(view.getByRole('button', { name: '切换点击监听' }));
        expect(view.queryByRole('button', { name: '用户头像' })).toBeNull();
        expect(view.getByRole('img', { name: '用户头像' })).not.toHaveAttribute('tabindex');
    });
    it('独立头像无列表语义，默认灰色中号圆形，透传原生属性', () => {
        const view = render(Avatar, {
            attrs: { id: 'avatar', title: 'title', class: 'own', 'data-avatar': 'yes', style: { margin: '4px' } },
            slots: { default: () => 'U' },
        });
        expect(root(view.container)).toHaveClass(prefix, `${prefix}-grey`, `${prefix}-medium`, `${prefix}-circle`, 'own');
        expect(root(view.container)).toHaveAttribute('id', 'avatar');
        expect(root(view.container)).toHaveAttribute('data-avatar', 'yes');
        expect(root(view.container)).not.toHaveAttribute('role');
        expect(root(view.container)).toHaveStyle({ margin: '4px' });
        expect(view.getByRole('img', { name: 'U' })).not.toHaveAttribute('tabindex');
    });

    it.each(['extra-extra-small', 'extra-small', 'small', 'default', 'medium', 'large', 'extra-large'])('支持预设尺寸 %s', (size) => {
        const view = render(Avatar, { props: { size }, slots: { default: () => 'U' } });
        expect(root(view.container)).toHaveClass(`${prefix}-${size}`);
    });

    it.each(['amber', 'blue', 'cyan', 'green', 'grey', 'indigo', 'light-blue', 'light-green', 'lime', 'orange', 'pink', 'purple', 'red', 'teal', 'violet', 'yellow'] satisfies AvatarColor[])('支持颜色 %s', (color) => {
        const view = render(Avatar, { props: { color } });
        expect(root(view.container)).toHaveClass(`${prefix}-${color}`);
    });

    it('自定义尺寸与 style 只作用在外层，边框支持颜色与动画', () => {
        const view = render(Avatar, {
            props: { size: '64px', shape: 'square', border: { color: 'red', motion: true } },
            attrs: { style: { margin: '4px' } },
        });
        const wrapper = view.container.querySelector(`.${prefix}-wrapper`) as HTMLElement;
        expect(wrapper).toHaveStyle({ width: '64px', height: '64px', margin: '4px' });
        expect(root(view.container)).not.toHaveStyle({ margin: '4px' });
        const rings = view.container.querySelectorAll(`.${prefix}-additionalBorder`);
        expect(rings).toHaveLength(2);
        expect(rings[1]).toHaveClass(`${prefix}-additionalBorder-animated`, `${prefix}-square`);
        expect(rings[1]).toHaveStyle({ borderColor: 'rgb(255, 0, 0)' });
    });

    it('图片有 alt、srcSet 与 imgAttr，出错一次只通知一次并回退到文字', async () => {
        const onError = vi.fn<NonNullable<AvatarProps['onError']>>();
        const view = render(Avatar, {
            props: { src, srcSet: `${src} 2x`, alt: 'Bob', color: 'red', imgAttr: { draggable: false }, onError },
            slots: { default: () => 'B' },
        });
        const image = view.getByRole('img', { name: 'Bob' });
        expect(image).toHaveAttribute('src', src);
        expect(image).toHaveAttribute('srcset', `${src} 2x`);
        expect(image).toHaveAttribute('draggable', 'false');
        expect(root(view.container)).toHaveClass(`${prefix}-img`);
        await fireEvent.error(image);
        expect(onError).toHaveBeenCalledExactlyOnceWith();
        expect(view.container.querySelector('img')).toBeNull();
        expect(view.getByRole('img', { name: 'Bob' })).toHaveTextContent('B');
        expect(root(view.container)).toHaveClass(`${prefix}-red`);
        await view.rerender({ src: `${src}?new` });
        expect(view.container.querySelector('img')).toHaveAttribute('src', `${src}?new`);
        await fireEvent.error(view.container.querySelector('img') as HTMLImageElement);
        expect(onError).toHaveBeenCalledTimes(2);
    });

    it('onError 返回 false 时保留图片', async () => {
        const view = render(Avatar, { props: { src, onError: () => false } });
        await fireEvent.error(view.container.querySelector('img') as HTMLImageElement);
        expect(view.container.querySelector('img')).toHaveAttribute('src', src);
    });

    it('imgAttr.class 与可点击头像的焦点类合并，imgAttr.onError 与内置回退都执行', async () => {
        const onImgError = vi.fn<() => void>();
        const view = render(Avatar, {
            props: { src, alt: 'Bob', imgAttr: { class: 'my-img', onError: onImgError } },
            attrs: { onClick: () => {} },
            slots: { default: () => 'B' },
        });
        const image = view.getByRole('button', { name: 'Bob' });
        expect(image).toHaveClass('my-img', `${prefix}-no-focus-visible`);
        await fireEvent.error(image);
        expect(onImgError).toHaveBeenCalledTimes(1);
        expect(view.container.querySelector('img')).toBeNull();
    });

    it('多段文本 children 拼成一段文字，带名称与缩放容器', () => {
        const view = render(Avatar, { slots: { default: () => ['A', 1] } });
        expect(view.getByRole('img', { name: 'A1' })).toHaveTextContent('A1');
    });

    it('imgAttr 的 alt 覆盖组件 alt，包括显式 undefined', async () => {
        const view = render(Avatar, { props: { src, alt: '组件名称', imgAttr: { alt: '图片名称' } } });
        expect(view.getByRole('img', { name: '图片名称' })).toBeInTheDocument();
        await view.rerender({ imgAttr: { alt: undefined } });
        expect(view.container.querySelector('img')).not.toHaveAttribute('alt');
    });

    it('非字符串插槽原样回退，可点击元素有 alt 名称', async () => {
        const click = vi.fn<(event: MouseEvent) => void>();
        const view = render(Avatar, {
            props: { src, alt: 'icon' },
            attrs: { onClick: click },
            slots: { default: () => <b>B</b> },
        });
        await fireEvent.error(view.container.querySelector('img') as HTMLImageElement);
        expect(view.container.querySelector(`.${prefix}-content`)).toBeNull();
        const button = view.getByRole('button', { name: 'icon' });
        await fireEvent.keyDown(button, { key: 'Enter' });
        expect(click).toHaveBeenCalledTimes(1);
    });

    it('@click.once（onClickOnce）的头像是可聚焦的 button', () => {
        const view = render(Avatar, { attrs: { onClickOnce: vi.fn<(event: MouseEvent) => void>() }, slots: { default: () => 'O' } });
        expect(view.getByRole('button')).toHaveAttribute('tabindex', '0');
    });

    it.each([false, true])('鼠标与键盘事件只通知一次，包装层=%s', async (border) => {
        const click = vi.fn<(event: MouseEvent) => void>();
        const view = render(Avatar, {
            props: { border, alt: 'user' },
            attrs: { tabindex: 2, 'aria-describedby': 'help', onClick: click },
            slots: { default: () => 'Semi', hoverMask: () => 'mask' },
        });
        const eventRoot = border ? (view.container.querySelector(`.${prefix}-wrapper`) as HTMLElement) : root(view.container);
        await fireEvent.mouseEnter(eventRoot);
        expect(view.emitted<AvatarEmits['mouseEnter']>('mouseEnter')).toHaveLength(1);
        expect(view.getByText('mask')).toBeInTheDocument();
        const event = view.emitted<AvatarEmits['mouseEnter']>('mouseEnter')[0][0];
        expect(event).toBeInstanceOf(MouseEvent);
        await fireEvent.mouseLeave(eventRoot);
        expect(view.emitted<AvatarEmits['mouseLeave']>('mouseLeave')).toHaveLength(1);
        expect(view.queryByText('mask')).toBeNull();
        const control = view.getByRole('button', { name: 'user' });
        expect(control).toHaveAttribute('tabindex', '2');
        expect(control).toHaveAttribute('aria-describedby', 'help');
        expect(root(view.container)).not.toHaveAttribute('tabindex');
        await fireEvent.keyDown(control, { key: 'Enter' });
        await fireEvent.keyDown(control, { key: ' ' });
        await fireEvent.keyDown(control, { key: 'Escape' });
        expect(click).toHaveBeenCalledTimes(2);
    });

    it('没有 hoverMask 插槽时悬停不渲染遮罩层', async () => {
        const view = render(Avatar, { slots: { default: () => 'U' } });
        await fireEvent.mouseEnter(root(view.container));
        expect(view.container.querySelector(`.${prefix}-hover`)).toBeNull();
    });

    it('悬停内容随插槽更新', async () => {
        const view = render(Fixture);
        await fireEvent.mouseEnter(root(view.container));
        await view.rerender({ hover: 'new mask' });
        expect(view.getByText('new mask')).toBeInTheDocument();
    });

    it('topSlot、bottomSlot 配置与文本插槽、完整替换插槽', async () => {
        const view = render(Fixture, {
            props: {
                top: true,
                bottom: true,
                size: 'large',
                contentMotion: true,
                topSlot: { className: 'top', textColor: 'red' },
                bottomSlot: { shape: 'square', className: 'bottom', bgColor: 'blue' },
            },
        });
        expect(view.getByText('直播')).toBeInTheDocument();
        expect(view.container.querySelector('.top')).toHaveClass(`${prefix}-animated`);
        expect(view.container.querySelector('.bottom')).toHaveClass(`${prefix}-bottom_slot-shape_square-large`);
        expect(view.container.querySelector('.bottom')).toHaveStyle({ backgroundColor: 'rgb(0, 0, 255)' });
        await view.rerender({ shape: 'square' });
        expect(view.queryByText('直播')).toBeNull();
        expect(view.getByText('NEW')).toBeInTheDocument();
        await view.rerender({ size: 'extra-extra-small' });
        expect(view.queryByText('NEW')).toBeNull();
        view.unmount();
        const custom = render(Avatar, {
            slots: { topSlot: () => <em>custom top</em>, bottomSlot: () => <em>custom bottom</em> },
        });
        expect(custom.getByText('custom top')).toBeInTheDocument();
        expect(custom.getByText('custom bottom')).toBeInTheDocument();
        expect(custom.container.querySelector(`.${prefix}-bottom_slot`)).toBeNull();
    });

    it('渐变 id 实例间唯一且重渲染稳定', async () => {
        const first = render(TopSlotSvg, { props: { gradientStart: 'red', gradientEnd: 'blue' } });
        const before = first.container.querySelector('linearGradient')?.id;
        await first.rerender({ gradientStart: 'green' });
        expect(first.container.querySelector('linearGradient')?.id).toBe(before);
        const second = render(TopSlotSvg, { props: { gradientStart: 'red', gradientEnd: 'blue' } });
        expect(second.container.querySelector('linearGradient')?.id).not.toBe(before);
    });

    it('从全局默认值读取配置与 onError，显式配置优先', async () => {
        const onError = vi.fn<NonNullable<AvatarProps['onError']>>(() => false);
        semiGlobal.config = { overrideDefaultProps: { Avatar: { shape: 'square', color: 'red', onError } } };
        const view = render(Avatar, { props: { src } });
        expect(root(view.container)).toHaveClass(`${prefix}-square`);
        await fireEvent.error(view.container.querySelector('img') as HTMLImageElement);
        expect(onError).toHaveBeenCalledOnce();
        await view.rerender({ shape: 'circle' });
        expect(root(view.container)).toHaveClass(`${prefix}-circle`);
    });

    // Vue has no StrictMode double mount; the same measurement paths are covered through ordinary mount and updates.
    it('初始文字、内容变化与图片失败后的文字按 gap 重新缩放', async () => {
        vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
            return this.classList.contains(`${prefix}-content`) ? (this.textContent ?? '').length * 10 : this.classList.contains(prefix) ? 40 : 0;
        });
        const view = render(Fixture, { props: { label: 'Semi Design', gap: 5 } });
        await nextTick();
        expect(view.container.querySelector(`.${prefix}-content`)).toHaveStyle({ transform: `scale(${30 / 110})` });
        await view.rerender({ label: 'AB' });
        await nextTick();
        expect(view.container.querySelector(`.${prefix}-content`)).toHaveStyle({ transform: 'scale(1)' });
        await view.rerender({ src, label: 'Semi Design' });
        await fireEvent.error(view.container.querySelector('img') as HTMLImageElement);
        await nextTick();
        expect(view.container.querySelector(`.${prefix}-content`)).toHaveStyle({ transform: `scale(${30 / 110})` });
    });

    it('多个文本节点之间的空白保留在可访问名称里', () => {
        const view = render(Avatar, { slots: { default: () => ['A', ' ', 'B'] } });
        expect(view.getByRole('img')).toHaveAccessibleName('A B');
    });
    it('gap 占满整个头像时保留初始 scale', async () => {
        vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(40);
        const view = render(Avatar, { props: { gap: 20 }, slots: { default: () => 'Semi' } });
        await nextTick();
        expect(view.container.querySelector(`.${prefix}-content`)).toHaveStyle({ transform: 'scale(1)' });
    });
});
