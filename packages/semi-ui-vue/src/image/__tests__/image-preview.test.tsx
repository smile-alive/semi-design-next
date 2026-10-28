/** @jsxImportSource vue */
import { nextTick, type ComponentPublicInstance, type VNode } from 'vue';
import { fireEvent, screen, within } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import { render } from '@test/utils/vue';
import Image, { ImagePreview, type ImageProps, type MenuProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import CachedPreview from './fixtures/cached-preview.vue';
import Card from './fixtures/card.vue';
import Group from './fixtures/group.vue';
import Model from './fixtures/model.vue';

const prefixCls = `${BASE_CLASS_PREFIX}-image`;
const previewCls = `${prefixCls}-preview`;
const srcList = ['https://example.com/1.jpg', 'https://example.com/2.jpg', 'https://example.com/3.jpg'];
type Props = Record<string, unknown>;
type Slots = Record<string, (props: never) => unknown>;

const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
const getPreview = () => $(`div.${previewCls}`);
const previewImg = () => $(`.${previewCls}-image-img`) as HTMLImageElement;
const pageInfo = () => $(`.${previewCls}-footer-page`)?.textContent?.trim();
const footerIcon = (name: string) => $(`.${previewCls}-footer .${BASE_CLASS_PREFIX}-icon-${name}`) as HTMLElement;
const thumbs = () => document.querySelectorAll<HTMLImageElement>(`.${prefixCls}-img`);
const arrow = (side: 'prev' | 'next') => $(`.${previewCls}-${side}`) as HTMLElement;
const clickMask = async (x = 10, y = 10) => {
    await fireEvent.mouseDown(getPreview() as HTMLElement, { clientX: x, clientY: y });
    await fireEvent.mouseUp(getPreview() as HTMLElement, { clientX: x, clientY: y });
};
// a real key press starts at the focused element and bubbles through the document
const pressEsc = () => fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
// VTL's fireEvent waits on timers and does not return whether the default was prevented
const dispatch = async <E extends Event>(target: EventTarget, event: E) => {
    target.dispatchEvent(event);
    await nextTick();
    return event;
};
const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = document.activeElement ?? window) => dispatch(target, new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));
const click = (el: Element) => dispatch(el, new MouseEvent('click', { bubbles: true, cancelable: true }));
const advance = async (ms: number) => {
    vi.advanceTimersByTime(ms);
    await nextTick();
};

const renderPreview = async (props: Props = {}, slots: Slots = {}) => {
    const view = render(ImagePreview, { props: { src: srcList, visible: true, ...props }, slots });
    await nextTick();
    return view;
};
const renderGroup = (props: Props = {}, images: (ImageProps & { key?: string })[] = srcList.map((src) => ({ src }))) => render(Group, { props: { images, ...props } });
const withLocale = (locale: typeof en_US, node: () => VNode) => render(ConfigProvider, { props: { locale }, slots: { default: node } });

// jsdom has no layout: give the preview container and the preview image the sizes the zoom math reads
function mockLayout({ container = [1000, 800], natural = [2000, 1000] } = {}) {
    const sized = (el: HTMLElement) => el.classList?.contains(`${previewCls}-image`);
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        configurable: true,
        get(this: HTMLElement) {
            return sized(this) ? container[0] : 0;
        },
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
        configurable: true,
        get(this: HTMLElement) {
            return sized(this) ? container[1] : 0;
        },
    });
    const naturalWidth = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'naturalWidth');
    const naturalHeight = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'naturalHeight');
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', { configurable: true, get: () => natural[0] });
    Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', { configurable: true, get: () => natural[1] });
    return () => {
        delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth;
        delete (HTMLElement.prototype as { clientHeight?: number }).clientHeight;
        Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', naturalWidth as PropertyDescriptor);
        Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', naturalHeight as PropertyDescriptor);
    };
}

interface PreloadImage {
    requested: string[];
    onload: () => void;
    onerror: () => void;
}

// records the preloads the foundation starts with `new Image()`; `resolve` reads src back as a browser would
function stubPreloadImage(resolve: (src: string) => string = (src) => src) {
    const created: PreloadImage[] = [];
    vi.stubGlobal(
        'Image',
        class {
            #src = '';
            requested: string[] = [];
            constructor() {
                created.push(this);
            }
            onload = () => {};
            onerror = () => {};
            set src(value: string) {
                this.requested.push(value);
                this.#src = value;
            }
            get src() {
                return resolve(this.#src);
            }
        }
    );
    return created;
}

interface StubObserver {
    callback: (entries: { target: Element; isIntersecting: boolean }[]) => void;
    options: IntersectionObserverInit;
    elements: Set<Element>;
}

// observers that still watch an element; the stub never fires on its own
function stubIntersectionObserver() {
    const observers: StubObserver[] = [];
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            elements = new Set<Element>();
            callback: StubObserver['callback'];
            options: IntersectionObserverInit;
            constructor(callback: (entries: Parameters<StubObserver['callback']>[0], observer: unknown) => void, options: IntersectionObserverInit) {
                // the platform passes the observer as the second argument
                this.callback = (entries) => callback(entries, this);
                this.options = options;
                observers.push(this);
            }
            observe(el: Element) {
                this.elements.add(el);
            }
            unobserve(el: Element) {
                this.elements.delete(el);
            }
            disconnect() {
                this.elements.clear();
            }
        }
    );
    return {
        live: () => observers.filter((o) => o.elements.size > 0),
        watching: (el: Element) => observers.find((o) => o.elements.has(el)),
    };
}

let restoreLayout: (() => void) | null = null;
afterEach(() => {
    restoreLayout?.();
    restoreLayout = null;
    vi.useRealTimers();
    semiGlobal.config.overrideDefaultProps = {};
    document.body.style.overflow = '';
    document.body.style.paddingInlineEnd = '';
});

describe('ImagePreview', () => {
    it('visible', async () => {
        const view = renderGroup({ visible: false });
        expect(getPreview()).toBeNull();

        await view.rerender({ visible: true });
        await nextTick();
        expect(getPreview()).not.toBeNull();
        expect(document.body.style.overflow).toEqual('hidden');

        await view.rerender({ visible: false });
        expect(document.body.style.overflow).not.toEqual('hidden');
        expect(getPreview()).toBeNull();
    });

    it('分组结构：class 与 style 在分组上，previewCls、previewStyle 与 zIndex 在预览上', async () => {
        const { container } = renderGroup({
            class: 'g',
            previewStyle: { color: 'blue' },
            style: { color: 'red' },
            previewCls: 'p',
            zIndex: 2000,
        });
        const group = container.firstElementChild;
        expect(group).toHaveClass(`${previewCls}-group`, 'g');
        expect(group).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        await fireEvent.click(thumbs()[0]);
        expect(getPreview()).toHaveClass('p');
        expect(getPreview()).toHaveStyle({ color: 'rgb(0, 0, 255)' });
        expect(getPreview()?.parentElement?.style.zIndex).toBe('2000');
    });

    it('非受控：点击分组中的图片在对应索引处打开，点击遮罩关闭，update 事件与普通事件同时发出', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const onUpdateVisible = vi.fn<(visible: boolean) => void>();
        const onChange = vi.fn<(index: number) => void>();
        const onUpdateCurrentIndex = vi.fn<(index: number) => void>();
        renderGroup({
            onChange,
            onVisibleChange,
            'onUpdate:visible': onUpdateVisible,
            'onUpdate:currentIndex': onUpdateCurrentIndex,
        });
        await fireEvent.click(thumbs()[1]);
        expect(onChange.mock.calls).toEqual([[1]]);
        expect(onUpdateCurrentIndex.mock.calls).toEqual([[1]]);
        expect(onVisibleChange.mock.calls).toEqual([[true]]);
        expect(onUpdateVisible.mock.calls).toEqual([[true]]);
        expect(pageInfo()).toBe('2/3');
        expect(previewImg()).toHaveAttribute('src', srcList[1]);

        await clickMask();
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
        expect(onUpdateVisible).toHaveBeenLastCalledWith(false);
        expect(getPreview()).toBeNull();
    });

    it('未设置 preview 的图片参与分组，:preview="false" 的图片不参与', async () => {
        render(ImagePreview, {
            slots: {
                default: () => (
                    <>
                        <Image src={srcList[0]} />
                        <Image preview={false} src={srcList[1]} />
                        <div>
                            <Image preview={{ src: 'https://example.com/big.jpg' }} src={srcList[2]} />
                        </div>
                    </>
                ),
            },
        });
        await fireEvent.click(thumbs()[2]);
        expect(pageInfo()).toBe('2/2');
        expect(previewImg()).toHaveAttribute('src', 'https://example.com/big.jpg');
        await clickMask();
        await fireEvent.click(thumbs()[1]);
        expect(getPreview()).toBeNull();
    });

    it('预览图使用所展示缩略图的 alt，没有 alt 时为空', async () => {
        renderGroup({}, [{ alt: 'first lamp', src: srcList[0] }, { src: srcList[1] }]);
        await fireEvent.click(thumbs()[0]);
        expect(previewImg()).toHaveAttribute('alt', 'first lamp');
        await fireEvent.click(arrow('next'));
        expect(previewImg()).toHaveAttribute('alt', '');
    });

    it('不带子图片的 src 列表；字符串 src', async () => {
        const view = await renderPreview();
        expect(pageInfo()).toBe('1/3');
        await view.rerender({ src: srcList[2] });
        expect(pageInfo()).toBe('1/1');
        expect(previewImg()).toHaveAttribute('src', srcList[2]);
        expect($(`.${previewCls}-prev`)).toBeNull();
        expect($(`.${previewCls}-next`)).toBeNull();
    });

    it('单向绑定的 visible：点击遮罩与 Esc 只通知', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const onClose = vi.fn<() => void>();
        await renderPreview({ onClose, onVisibleChange });
        await clickMask();
        expect(onVisibleChange).toHaveBeenCalledWith(false);
        expect(getPreview()).not.toBeNull();
        await pressEsc();
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onVisibleChange).toHaveBeenCalledTimes(2);
        expect(getPreview()).not.toBeNull();
    });

    it('单向绑定的 currentIndex：切换时只通知，由父组件决定', async () => {
        const onChange = vi.fn<(index: number) => void>();
        const view = await renderPreview({ currentIndex: 0, onChange });
        await fireEvent.click(arrow('next'));
        expect(onChange).toHaveBeenCalledWith(1);
        expect(pageInfo()).toBe('1/3');
        await view.rerender({ currentIndex: 2 });
        expect(pageInfo()).toBe('3/3');
        expect(previewImg()).toHaveAttribute('src', srcList[2]);
    });

    it('defaultCurrentIndex', async () => {
        await renderPreview({ defaultCurrentIndex: 2 });
        expect(pageInfo()).toBe('3/3');
    });

    it('上一张、下一张、底部箭头及其事件；除非 infinite，否则首尾隐藏箭头', async () => {
        const onPrev = vi.fn<(index: number) => void>();
        const onNext = vi.fn<(index: number) => void>();
        const view = renderGroup({ onNext, onPrev });
        await fireEvent.click(thumbs()[0]);
        expect($(`.${previewCls}-prev`)).toBeNull();
        expect(footerIcon('chevron_left')).toHaveClass(`${previewCls}-footer-disabled`);

        await fireEvent.click(arrow('next'));
        expect(onNext).toHaveBeenCalledWith(1);
        await fireEvent.click(footerIcon('chevron_right'));
        expect(onNext).toHaveBeenLastCalledWith(2);
        expect(pageInfo()).toBe('3/3');
        expect($(`.${previewCls}-next`)).toBeNull();
        await fireEvent.click(footerIcon('chevron_right'));
        expect(onNext).toHaveBeenCalledTimes(2);

        await fireEvent.click(footerIcon('chevron_left'));
        expect(onPrev).toHaveBeenCalledWith(1);
        await fireEvent.click(arrow('prev'));
        expect(onPrev).toHaveBeenLastCalledWith(0);
        expect(pageInfo()).toBe('1/3');

        await view.rerender({ infinite: true });
        await fireEvent.click(arrow('prev'));
        expect(pageInfo()).toBe('3/3');
        await fireEvent.click(arrow('next'));
        expect(pageInfo()).toBe('1/3');
    });

    it('非受控的单图预览：带 src 列表的 Image 自行切换', async () => {
        render(Image, { props: { preview: { src: srcList, visible: true }, src: srcList[0] } });
        await fireEvent.load(thumbs()[0]);
        await nextTick();
        expect(pageInfo()).toBe('1/3');
        await fireEvent.click(arrow('next'));
        expect(pageInfo()).toBe('2/3');
        expect(previewImg()).toHaveAttribute('src', srcList[1]);
    });

    it('Esc 关闭并发出 close，每次只通知一次；closeOnEsc 为 false 时保持打开；其他按键无效果', async () => {
        const onClose = vi.fn<() => void>();
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const view = renderGroup({ onClose, onVisibleChange });
        await fireEvent.click(thumbs()[0]);
        await press('Enter', {}, window);
        expect(pageInfo()).toBe('1/3');
        onVisibleChange.mockClear();
        await pressEsc();
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onVisibleChange.mock.calls).toEqual([[false]]);
        expect(getPreview()).toBeNull();
        view.unmount();

        renderGroup({ closeOnEsc: false });
        await fireEvent.click(thumbs()[0]);
        await pressEsc();
        expect(getPreview()).not.toBeNull();
    });

    it('遮罩：鼠标微小移动仍关闭，拖动或操作区域不关闭，maskClosable 为 false 时永不关闭', async () => {
        const view = renderGroup();
        await fireEvent.click(thumbs()[0]);
        const preview = getPreview() as HTMLElement;
        await fireEvent.mouseDown(preview, { clientX: 0, clientY: 0 });
        await fireEvent.mouseUp(preview, { clientX: 20, clientY: 0 });
        expect(getPreview()).not.toBeNull();
        await fireEvent.mouseDown(footerIcon('rotate'), { clientX: 0, clientY: 0 });
        await fireEvent.mouseUp(footerIcon('rotate'), { clientX: 0, clientY: 0 });
        expect(getPreview()).not.toBeNull();
        await fireEvent.mouseDown(preview, { clientX: 0, clientY: 0 });
        await fireEvent.mouseUp(preview, { clientX: 4, clientY: 5 });
        expect(getPreview()).toBeNull();

        await view.rerender({ maskClosable: false });
        await fireEvent.click(thumbs()[0]);
        await clickMask();
        expect(getPreview()).not.toBeNull();
    });

    it('header：关闭按钮、closable、#closeIcon、#title 与分组图片的 previewTitle', async () => {
        const onClose = vi.fn<() => void>();
        const children = () => (
            <>
                <Image preview={{ previewTitle: 'first' }} src={srcList[0]} />
                <Image src={srcList[1]} />
            </>
        );
        const first = render(ImagePreview, { props: { onClose }, slots: { default: children } });
        await fireEvent.click(thumbs()[0]);
        expect($(`.${previewCls}-header-title`)?.textContent).toBe('first');
        const close = $(`.${previewCls}-header-close`) as HTMLElement;
        await fireEvent.mouseDown(close, { clientX: 0, clientY: 0 });
        await fireEvent.mouseUp(close, { clientX: 0, clientY: 0 });
        expect(getPreview()).not.toBeNull();
        await fireEvent.click(close);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(getPreview()).toBeNull();
        first.unmount();

        const second = render(ImagePreview, {
            slots: {
                default: children,
                title: ({ title }: { title: string }) => <b class="h">{`T:${title}`}</b>,
                closeIcon: () => <i class="close-icon" />,
            },
        });
        await fireEvent.click(thumbs()[0]);
        expect($(`.${previewCls}-header-title .h`)?.textContent).toBe('T:first');
        expect($(`.${previewCls}-header-close .close-icon`)).not.toBeNull();
        second.unmount();

        render(ImagePreview, { props: { closable: false }, slots: { default: children } });
        await fireEvent.click(thumbs()[1]);
        expect($(`.${previewCls}-header-close`)).toBeNull();
    });

    it('#leftIcon、#rightIcon 与 #previewMenu', async () => {
        const previewMenu = vi.fn<(menu: MenuProps) => VNode>((menu) => <div class="menu">{menu.menuItems}</div>);
        await renderPreview(
            { defaultCurrentIndex: 1 },
            {
                leftIcon: ({ index }: { index: number }) => <i class={`left-${index}`} />,
                previewMenu,
                rightIcon: () => <i class="right" />,
            }
        );
        expect($(`.${previewCls}-prev .left-1`)).not.toBeNull();
        expect($(`.${previewCls}-next .right`)).not.toBeNull();
        expect($(`.${previewCls}-footer .menu`)).not.toBeNull();
        expect($(`.${previewCls}-footer`)).not.toHaveClass(`${previewCls}-footer-content`);
        const menu = previewMenu.mock.lastCall?.[0] as MenuProps;
        expect(menu).toMatchObject({ curPage: 2, totalNum: 3, min: 10, max: 500, step: 10, ratio: 'adaptation' });
        expect(menu.menuItems).toHaveLength(9);
        expect([menu.disabledZoomIn, menu.disabledZoomOut]).toEqual([false, true]);
        menu.onNext();
        await nextTick();
        expect(pageInfo()).toBe('3/3');
    });

    it('#previewMenu 的 menuItems 渲染出的默认按钮仍可用', async () => {
        await renderPreview({}, { previewMenu: (menu: MenuProps) => <div class="menu">{menu.menuItems.slice(0, 3)}</div> });
        const menu = $(`.${previewCls}-footer .menu`) as HTMLElement;
        expect(within(menu).getAllByRole('button')).toHaveLength(2);
        await fireEvent.click(footerIcon('chevron_right'));
        expect(pageInfo()).toBe('2/3');
    });

    it('zoom：加载后自适应，底部按钮、滑块上下限与事件', async () => {
        restoreLayout = mockLayout();
        const onZoomIn = vi.fn<(zoom: number) => void>();
        const onZoomOut = vi.fn<(zoom: number) => void>();
        await renderPreview({ onZoomIn, onZoomOut });
        await fireEvent.load(previewImg());
        // min((1000 - 80) / 2000, (800 - 80) / 1000) = 0.46, not reported
        expect(previewImg()).toHaveStyle({ width: '920px', height: '460px' });
        expect(onZoomIn).not.toHaveBeenCalled();
        expect(onZoomOut).not.toHaveBeenCalled();

        await fireEvent.click(footerIcon('plus'));
        expect(onZoomIn).toHaveBeenLastCalledWith(0.56);
        expect(previewImg()).toHaveStyle({ width: '1120px', height: '560px' });
        await fireEvent.click(footerIcon('minus'));
        expect(onZoomOut).toHaveBeenLastCalledWith(0.46);
        expect(previewImg()).toHaveStyle({ width: '920px' });
    });

    it('zoom 限制在 minZoom 与 maxZoom 之间；zoomStep', async () => {
        restoreLayout = mockLayout({ natural: [100, 100] });
        const onZoomIn = vi.fn<(zoom: number) => void>();
        await renderPreview({ maxZoom: 1.5, zoomStep: 0.5, onZoomIn });
        await fireEvent.load(previewImg());
        // 720 / 100 = 7.2 is clamped to maxZoom
        expect(previewImg()).toHaveStyle({ width: '150px' });
        expect(footerIcon('plus')).toHaveClass(`${previewCls}-footer-disabled`);
        await fireEvent.click(footerIcon('minus'));
        expect(previewImg()).toHaveStyle({ width: '100px' });
        await fireEvent.click(footerIcon('plus'));
        expect(onZoomIn).toHaveBeenLastCalledWith(1.5);
    });

    it('initialZoom 每张图片只生效一次', async () => {
        restoreLayout = mockLayout();
        await renderPreview({ initialZoom: 0.2 });
        await fireEvent.load(previewImg());
        expect(previewImg()).toHaveStyle({ width: '400px' });
        await fireEvent.click(arrow('next'));
        await fireEvent.load(previewImg());
        expect(previewImg()).toHaveStyle({ width: '400px' });
    });

    it('滚轮以包裹层为中心缩放，并阻止页面缩放', async () => {
        restoreLayout = mockLayout();
        const onZoomIn = vi.fn<(zoom: number) => void>();
        const onZoomOut = vi.fn<(zoom: number) => void>();
        await renderPreview({ onZoomIn, onZoomOut });
        await fireEvent.load(previewImg());
        const wheel = await dispatch(getPreview() as HTMLElement, new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -10 }));
        expect(wheel.defaultPrevented).toBe(true);
        expect(onZoomIn).toHaveBeenLastCalledWith(0.56);
        expect(previewImg()).toHaveStyle({ width: '1120px' });
        await fireEvent.wheel(getPreview() as HTMLElement, { deltaY: 10 });
        expect(onZoomOut).toHaveBeenLastCalledWith(0.46);
        expect(previewImg()).toHaveStyle({ width: '920px' });
    });

    it('滚轮缩放与按钮一样停在 maxZoom、minZoom 上，即使当前值不是步长的整数倍', async () => {
        restoreLayout = mockLayout();
        const view = await renderPreview({ maxZoom: 0.5 });
        await fireEvent.load(previewImg());
        expect(previewImg()).toHaveStyle({ width: '920px' });
        // 0.46 + 0.1 passes maxZoom
        await fireEvent.wheel(getPreview() as HTMLElement, { deltaY: -10 });
        expect(previewImg()).toHaveStyle({ width: '1000px' });

        await view.rerender({ minZoom: 0.42 });
        await fireEvent.wheel(getPreview() as HTMLElement, { deltaY: 10 });
        await fireEvent.wheel(getPreview() as HTMLElement, { deltaY: 10 });
        expect(previewImg()).toHaveStyle({ width: '840px' });
    });

    it('在图片上滚动时以指针所在点为中心缩放', async () => {
        restoreLayout = mockLayout();
        await renderPreview();
        await fireEvent.load(previewImg());
        await fireEvent.click(footerIcon('real_size_stroked'));
        // jsdom leaves offsetX and offsetY out of the event init
        const wheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -10 });
        Object.defineProperties(wheel, { offsetX: { value: 1500 }, offsetY: { value: 750 } });
        await dispatch(previewImg(), wheel);
        // 2000x1000 -> 2200x1100; the point 500px right and 250px below the centre moves out by a tenth
        expect(previewImg()).toHaveStyle({ width: '2200px', height: '1100px' });
        const [x, y] = (previewImg().style.transform.match(/-?[\d.]+(?=px)/g) ?? []).map(Number);
        expect(x).toBeCloseTo(-50);
        expect(y).toBeCloseTo(-25);
    });

    it('ratio：切换到真实尺寸再切回，ratioChange 的载荷', async () => {
        restoreLayout = mockLayout();
        const onRatioChange = vi.fn<(type: string) => void>();
        const onZoomIn = vi.fn<(zoom: number) => void>();
        await renderPreview({ onRatioChange, onZoomIn });
        await fireEvent.load(previewImg());
        await fireEvent.click(footerIcon('real_size_stroked'));
        expect(onRatioChange).toHaveBeenCalledWith('realSize');
        expect(onZoomIn).toHaveBeenLastCalledWith(1);
        expect(previewImg()).toHaveStyle({ width: '2000px', height: '1000px' });
        await fireEvent.click(footerIcon('window_adaption_stroked'));
        expect(onRatioChange).toHaveBeenLastCalledWith('adaptation');
        expect(previewImg()).toHaveStyle({ width: '920px' });
    });

    it('拖动可在边界内平移已缩放的图片', async () => {
        restoreLayout = mockLayout();
        await renderPreview();
        await fireEvent.load(previewImg());
        await fireEvent.click(footerIcon('real_size_stroked'));
        // 2000x1000 in 1000x800: x may move 500 either way, y 100
        // jsdom has no pointer capture; the capture keeps a drag going when the pointer leaves the image
        const setPointerCapture = vi.fn<(pointerId: number) => void>();
        previewImg().setPointerCapture = setPointerCapture;
        await fireEvent.pointerDown(previewImg(), { pointerId: 7, clientX: 100, clientY: 100 });
        expect(setPointerCapture).toHaveBeenCalledWith(7);
        await fireEvent.pointerMove(previewImg(), { clientX: 150, clientY: 130, buttons: 1 });
        expect(previewImg().style.transform).toBe('translate(50px, 30px) rotate(0deg)');
        await fireEvent.pointerMove(previewImg(), { clientX: 150, clientY: 330, buttons: 1 });
        expect(previewImg().style.transform).toBe('translate(50px, 100px) rotate(0deg)');
        // without the left button pressed nothing moves
        await fireEvent.pointerMove(previewImg(), { clientX: 400, clientY: 330, buttons: 0 });
        expect(previewImg().style.transform).toBe('translate(50px, 100px) rotate(0deg)');
    });

    it('只有可拖动的图片才禁用触屏手势', async () => {
        restoreLayout = mockLayout();
        await renderPreview();
        await fireEvent.load(previewImg());
        expect(previewImg().style.touchAction).toBe('');
        await fireEvent.click(footerIcon('real_size_stroked'));
        expect(previewImg().style.touchAction).toBe('none');
        await fireEvent.click(footerIcon('window_adaption_stroked'));
        expect(previewImg().style.touchAction).toBe('');
    });

    it('rotate：rotateLeft 的载荷，图片按旋转后的边界重新适配', async () => {
        restoreLayout = mockLayout();
        const onRotateLeft = vi.fn<(angle: number) => void>();
        const onZoomOut = vi.fn<(zoom: number) => void>();
        await renderPreview({ onRotateLeft, onZoomOut });
        await fireEvent.load(previewImg());
        await fireEvent.click(footerIcon('rotate'));
        expect(onRotateLeft).toHaveBeenCalledWith(-90);
        expect(previewImg().style.transform).toContain('rotate(-90deg)');
        // rotated bounds 1000x2000: min(920 / 1000, 720 / 2000) = 0.36
        expect(onZoomOut).toHaveBeenLastCalledWith(0.36);
        expect(previewImg()).toHaveStyle({ width: '720px' });
        await fireEvent.click(footerIcon('rotate'));
        expect(onRotateLeft).toHaveBeenLastCalledWith(-180);
    });

    it('切换或重新打开时重置旋转与 ratio，且不上报 zoom', async () => {
        restoreLayout = mockLayout();
        const onZoomIn = vi.fn<(zoom: number) => void>();
        const onZoomOut = vi.fn<(zoom: number) => void>();
        renderGroup({ onZoomIn, onZoomOut });
        await fireEvent.click(thumbs()[0]);
        await fireEvent.load(previewImg());
        await fireEvent.click(footerIcon('real_size_stroked'));
        await fireEvent.click(footerIcon('rotate'));
        onZoomIn.mockClear();
        onZoomOut.mockClear();

        await fireEvent.click(arrow('next'));
        expect(previewImg().style.transform).toContain('rotate(0deg)');
        expect(footerIcon('real_size_stroked')).not.toBeNull();
        await fireEvent.load(previewImg());
        expect(onZoomIn).not.toHaveBeenCalled();
        expect(onZoomOut).not.toHaveBeenCalled();

        await fireEvent.click(footerIcon('real_size_stroked'));
        await fireEvent.click(footerIcon('rotate'));
        await clickMask();
        onZoomIn.mockClear();
        onZoomOut.mockClear();
        await fireEvent.click(thumbs()[2]);
        expect(previewImg().style.transform).toContain('rotate(0deg)');
        expect(footerIcon('real_size_stroked')).not.toBeNull();
        await fireEvent.load(previewImg());
        expect(onZoomIn).not.toHaveBeenCalled();
        expect(onZoomOut).not.toHaveBeenCalled();
    });

    it('父组件修改受控 index 时重置 ratio', async () => {
        restoreLayout = mockLayout();
        const onZoomIn = vi.fn<(zoom: number) => void>();
        const view = await renderPreview({ currentIndex: 0, onZoomIn });
        await fireEvent.load(previewImg());
        await fireEvent.click(footerIcon('real_size_stroked'));
        onZoomIn.mockClear();
        await view.rerender({ currentIndex: 1 });
        expect(footerIcon('real_size_stroked')).not.toBeNull();
        expect(onZoomIn).not.toHaveBeenCalled();
    });

    it('非受控的单图预览切换图片后 ratio 回到适应页面', async () => {
        restoreLayout = mockLayout();
        render(Image, { props: { preview: { src: srcList, visible: true }, src: srcList[0] } });
        await fireEvent.load(thumbs()[0]);
        await nextTick();
        await fireEvent.load(previewImg());
        await fireEvent.click(footerIcon('real_size_stroked'));
        expect(footerIcon('window_adaption_stroked')).not.toBeNull();
        await fireEvent.click(arrow('next'));
        expect(footerIcon('real_size_stroked')).not.toBeNull();
    });

    it('download：download 与 downloadError 的载荷，setDownloadName', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn<() => Promise<{ ok: boolean }>>(() => Promise.resolve({ ok: false }))
        );
        const onDownload = vi.fn<(src: string, index: number) => void>();
        const onDownloadError = vi.fn<(src: string) => void>();
        const setDownloadName = vi.fn<(src: string) => string>(() => 'x.jpg');
        await renderPreview({ defaultCurrentIndex: 1, setDownloadName, onDownload, onDownloadError });
        await fireEvent.click(footerIcon('download'));
        expect(setDownloadName).toHaveBeenCalledWith(srcList[1]);
        expect(onDownload).toHaveBeenCalledWith(srcList[1], 1);
        expect(fetch).toHaveBeenCalledWith(srcList[1]);
        await vi.waitFor(() => expect(onDownloadError).toHaveBeenCalledWith(srcList[1]));
    });

    it('分组的 setDownloadName 为分组内图片的下载命名', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn<() => Promise<{ ok: boolean }>>(() => Promise.resolve({ ok: false }))
        );
        const setDownloadName = vi.fn<(src: string) => string>(() => 'x.jpg');
        renderGroup({ setDownloadName });
        await fireEvent.click(thumbs()[1]);
        await fireEvent.click(footerIcon('download'));
        expect(setDownloadName).toHaveBeenCalledWith(srcList[1]);
    });

    it('disableDownload 禁用下载按钮与图片的右键菜单', async () => {
        const onDownload = vi.fn<(src: string, index: number) => void>();
        await renderPreview({ disableDownload: true, onDownload });
        expect(footerIcon('download')).toHaveClass(`${previewCls}-footer-disabled`);
        await fireEvent.click(footerIcon('download'));
        expect(onDownload).not.toHaveBeenCalled();
        const contextMenu = await dispatch(previewImg(), new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
        expect(contextMenu.defaultPrevented).toBe(true);
    });

    it('没有图片时点击下载不调用 setDownloadName，也不发出 download', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn<() => Promise<{ ok: boolean }>>(() => Promise.resolve({ ok: false }))
        );
        const onDownload = vi.fn<(src: string, index: number) => void>();
        const setDownloadName = vi.fn<(src: string) => string>(() => 'x.jpg');
        await renderPreview({ src: [], setDownloadName, onDownload });
        await fireEvent.click(footerIcon('download'));
        expect(setDownloadName).not.toHaveBeenCalled();
        expect(onDownload).not.toHaveBeenCalled();
        expect(fetch).not.toHaveBeenCalled();
    });

    it('操作栏在 viewerVisibleDelay 后隐藏，鼠标移动时重新出现', async () => {
        vi.useFakeTimers();
        await renderPreview({ viewerVisibleDelay: 1000 });
        const header = () => $(`.${previewCls}-header`);
        expect(header()).not.toHaveClass(`${previewCls}-hide`);
        await advance(1000);
        expect(header()).toHaveClass(`${previewCls}-hide`);
        expect($(`.${previewCls}-footer`)).toHaveClass(`${previewCls}-hide`);
        await dispatch(getPreview() as HTMLElement, new MouseEvent('mousemove', { bubbles: true }));
        expect(header()).not.toHaveClass(`${previewCls}-hide`);
    });

    it('父组件以相同内容的新数组重渲染不重新开始 viewerVisibleDelay 计时，内容变化时重新开始', async () => {
        vi.useFakeTimers();
        const view = await renderPreview({ viewerVisibleDelay: 1000 });
        const footer = () => $(`.${previewCls}-footer`);
        await advance(600);
        await view.rerender({ src: [...srcList] });
        await advance(400);
        expect(footer()).toHaveClass(`${previewCls}-hide`);

        await dispatch(getPreview() as HTMLElement, new MouseEvent('mousemove', { bubbles: true }));
        await advance(600);
        await view.rerender({ src: [...srcList, 'https://example.com/4.jpg'] });
        await advance(400);
        expect(footer()).not.toHaveClass(`${previewCls}-hide`);
    });

    it('preLoad：第一张图加载后，依次预加载 preLoadGap 范围内的相邻图片', async () => {
        const created = stubPreloadImage();
        const list = ['a', 'b', 'c', 'd', 'e', 'f'].map((n) => `https://example.com/${n}.jpg`);
        await renderPreview({ currentIndex: 2, preLoadGap: 2, src: list });
        await fireEvent.load(previewImg());
        expect(created).toHaveLength(1);
        const [img] = created;
        expect(img.requested).toEqual([list[3]]);
        img.onload();
        img.onload();
        img.onerror();
        expect(img.requested).toEqual([list[3], list[1], list[4], list[0]]);
    });

    it('preLoad 为 false 时不预加载', async () => {
        const created = stubPreloadImage();
        await renderPreview({ preLoad: false });
        await fireEvent.load(previewImg());
        expect(created).toHaveLength(0);
    });

    it('body 滚动：可见时锁定，恢复之前的 overflow；使用 getPopupContainer 时不锁定', async () => {
        document.body.style.overflow = 'auto';
        const view = await renderPreview({ visible: false });
        await view.rerender({ visible: true });
        await nextTick();
        expect(document.body.style.overflow).toBe('hidden');
        await view.rerender({ visible: false });
        expect(document.body.style.overflow).toBe('auto');

        const container = document.createElement('div');
        document.body.appendChild(container);
        await view.rerender({ getPopupContainer: () => container, visible: true });
        await nextTick();
        expect(container.querySelector(`.${previewCls}`)).not.toBeNull();
        expect(getPreview()).toHaveClass(`${previewCls}-popup`);
        expect(document.body.style.overflow).toBe('auto');
        await view.rerender({ visible: false });
        container.remove();
    });

    it('getPopupContainer 返回 body 时与不传一样锁定 body 滚动，且没有 -popup 类', async () => {
        document.body.style.overflow = 'auto';
        const view = await renderPreview({ getPopupContainer: () => document.body, visible: false });
        await view.rerender({ visible: true });
        await nextTick();
        expect(document.body.style.overflow).toBe('hidden');
        expect(getPreview()).not.toHaveClass(`${previewCls}-popup`);
        expect(getPreview()?.parentElement?.style.position).toBe('');
        await view.rerender({ visible: false });
        expect(document.body.style.overflow).toBe('auto');
    });

    it('遮罩关闭只排除操作区：容器类名不影响，自定义 #title 内的点击不关闭', async () => {
        const view = render(ImagePreview, {
            props: { defaultVisible: true, src: srcList },
            slots: { title: () => <span class="custom-title">title</span> },
        });
        await nextTick();
        await fireEvent.mouseDown($('.custom-title') as HTMLElement, { clientX: 0, clientY: 0 });
        await fireEvent.mouseUp($('.custom-title') as HTMLElement, { clientX: 0, clientY: 0 });
        expect(getPreview()).not.toBeNull();
        view.unmount();

        const container = document.createElement('div');
        container.className = 'page-footer';
        document.body.appendChild(container);
        render(ImagePreview, { props: { defaultVisible: true, getPopupContainer: () => container, src: srcList } });
        await nextTick();
        await clickMask();
        expect(getPreview()).toBeNull();
        container.remove();
    });

    it('已是 hidden 的 overflow 保持不变', async () => {
        document.body.style.overflow = 'hidden';
        const view = await renderPreview();
        await view.rerender({ visible: false });
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('lazyLoad：以视口为 root 观察分组内的图片，相交时设置 src', async () => {
        const io = stubIntersectionObserver();
        const view = renderGroup({ lazyLoadMargin: '10px' });
        await nextTick();
        expect(io.live()).toHaveLength(1);
        const [observer] = io.live();
        expect(observer.options).toEqual({ root: null, rootMargin: '10px' });
        const [first] = thumbs();
        observer.callback([{ target: first, isIntersecting: true }]);
        await nextTick();
        expect(first).toHaveAttribute('src', srcList[0]);
        expect(first).not.toHaveAttribute('data-src');
        expect(observer.elements.has(first)).toBe(false);

        await view.rerender({ images: [...srcList, 'https://example.com/4.jpg'].map((src) => ({ key: src, src })) });
        await nextTick();
        expect(io.live().flatMap((o) => [...o.elements])).toContain(thumbs()[3]);
        view.unmount();
        expect(io.live()).toHaveLength(0);
    });

    it.each([
        ['默认预览', {}],
        [':preview="false"', { preview: false }],
        ['预览地址为独立的 preview.src', { preview: { src: 'https://example.com/big.jpg' } }],
    ])('lazyLoad：key 不变而缩略图 src 变化时，重新观察并写入新 src（%s）', async (_name, imageProps) => {
        const io = stubIntersectionObserver();
        const images = (src: string) => [{ key: '0', src, ...imageProps }];
        const view = renderGroup({}, images('https://example.com/a.jpg'));
        await nextTick();
        const [img] = thumbs();
        io.watching(img)?.callback([{ target: img, isIntersecting: true }]);
        await nextTick();
        expect(img).toHaveAttribute('src', 'https://example.com/a.jpg');
        expect(io.watching(img)).toBeUndefined();

        await view.rerender({ images: images('https://example.com/b.jpg') });
        await nextTick();
        expect(img).toHaveAttribute('data-src', 'https://example.com/b.jpg');
        const observer = io.watching(img);
        expect(observer).toBeDefined();
        observer?.callback([{ target: img, isIntersecting: true }]);
        await nextTick();
        expect(img).toHaveAttribute('src', 'https://example.com/b.jpg');
    });

    it('同时传 src 与子图片时，点击子图片打开的是它自己的图片', async () => {
        const onChange = vi.fn<(index: number) => void>();
        render(ImagePreview, {
            props: { src: [srcList[0]], onChange },
            slots: { default: () => <Image src={srcList[1]} /> },
        });
        await fireEvent.click(thumbs()[0]);
        expect(previewImg()).toHaveAttribute('src', srcList[1]);
        expect(pageInfo()).toBe('2/2');
        expect(onChange).toHaveBeenCalledWith(1);
    });

    it('封装组件内部渲染的 Image 加入分组，点击打开它自己', async () => {
        const onChange = vi.fn<(index: number) => void>();
        render(ImagePreview, {
            props: { src: [srcList[0]], onChange },
            slots: {
                default: () => (
                    <>
                        <Card alt="second" src={srcList[1]} />
                        <Card alt="third" src={srcList[2]} />
                    </>
                ),
            },
        });
        await fireEvent.click(thumbs()[1]);
        expect(onChange).toHaveBeenCalledWith(2);
        expect(pageInfo()).toBe('3/3');
        expect(previewImg()).toHaveAttribute('src', srcList[2]);
        expect(previewImg()).toHaveAttribute('alt', 'third');
    });

    it('preview.src 为数组的分组图片把各项依次加入预览，点击打开其中第一项', async () => {
        renderGroup({}, [{ src: srcList[0] }, { preview: { src: ['https://example.com/a.jpg', 'https://example.com/b.jpg'] }, src: srcList[1] }, { src: srcList[2] }]);
        await fireEvent.click(thumbs()[1]);
        expect(pageInfo()).toBe('2/4');
        expect(previewImg()).toHaveAttribute('src', 'https://example.com/a.jpg');
        await fireEvent.click(arrow('next'));
        expect(previewImg()).toHaveAttribute('src', 'https://example.com/b.jpg');
        await clickMask();
        await fireEvent.click(thumbs()[2]);
        expect(pageInfo()).toBe('4/4');
    });

    it('挂载后插入到前面的 Image 按文档顺序排在前面，卸载后移出分组', async () => {
        const images = (withFirst: boolean) => [withFirst ? { key: 'first', src: srcList[0] } : null, { key: 'second', src: srcList[1] }, { key: 'third', src: srcList[2] }].filter((image) => image !== null);
        const view = renderGroup({}, images(false));
        await view.rerender({ images: images(true) });
        await fireEvent.click(thumbs()[0]);
        expect(pageInfo()).toBe('1/3');
        expect(previewImg()).toHaveAttribute('src', srcList[0]);
        await clickMask();

        await view.rerender({ images: images(false) });
        await fireEvent.click(thumbs()[1]);
        expect(pageInfo()).toBe('2/2');
        expect(previewImg()).toHaveAttribute('src', srcList[2]);
    });

    it('缩放百分比不带浮点尾数', async () => {
        restoreLayout = mockLayout();
        await renderPreview();
        await fireEvent.load(previewImg());
        await fireEvent.click(footerIcon('plus'));
        // 0.46 + 0.1 = 0.56, and 0.56 * 100 is 56.00000000000001
        expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '56%');
    });

    it('因延迟隐藏的操作栏在下次打开时重新显示', async () => {
        vi.useFakeTimers();
        renderGroup({ viewerVisibleDelay: 1000 });
        await click(thumbs()[0]);
        await advance(1000);
        expect($(`.${previewCls}-header`)).toHaveClass(`${previewCls}-hide`);
        await press('Escape');
        await advance(5000);
        await click(thumbs()[1]);
        expect($(`.${previewCls}-header`)).not.toHaveClass(`${previewCls}-hide`);
    });

    it('v-model:visible 与 v-model:currentIndex 由预览更新父组件状态', async () => {
        render(Model, { props: { src: srcList } });
        await fireEvent.click(screen.getByRole('button', { name: 'open' }));
        expect(getPreview()).not.toBeNull();
        await fireEvent.click(arrow('next'));
        expect(pageInfo()).toBe('2/3');
        expect(screen.getByTestId('state')).toHaveTextContent('true:1');
        await clickMask();
        expect(getPreview()).toBeNull();
        expect(screen.getByTestId('state')).toHaveTextContent('false:1');
    });
});

describe('ImagePreview 挂载、卸载与属性', () => {
    it('defaultVisible 在挂载时打开预览', async () => {
        render(ImagePreview, { props: { defaultVisible: true, src: srcList } });
        await nextTick();
        expect(getPreview()).not.toBeNull();
        await clickMask();
        expect(getPreview()).toBeNull();
    });

    it('只有子图片的分组在挂载时可见，打开在 defaultCurrentIndex 处并可切换', async () => {
        renderGroup({ defaultCurrentIndex: 1, defaultVisible: true });
        await nextTick();
        expect(pageInfo()).toBe('2/3');
        expect(previewImg()).toHaveAttribute('src', srcList[1]);
        await fireEvent.click(arrow('next'));
        expect(previewImg()).toHaveAttribute('src', srcList[2]);
        await fireEvent.click(arrow('prev'));
        expect(previewImg()).toHaveAttribute('src', srcList[1]);
    });

    it('每次切换发出一次 change', async () => {
        const onChange = vi.fn<(index: number) => void>();
        renderGroup({ onChange });
        await fireEvent.click(thumbs()[0]);
        onChange.mockClear();
        await fireEvent.click(arrow('next'));
        await fireEvent.click(footerIcon('chevron_right'));
        expect(onChange.mock.calls).toEqual([[1], [2]]);
    });

    it('可见时卸载，恢复 body 滚动并移除 Esc 监听，不发出 visibleChange', async () => {
        const onClose = vi.fn<() => void>();
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const view = await renderPreview({ onClose, onVisibleChange });
        expect(document.body.style.overflow).toBe('hidden');
        view.unmount();
        expect(document.body.style.overflow).toBe('');
        await pressEsc();
        expect(onClose).not.toHaveBeenCalled();
        expect(onVisibleChange).not.toHaveBeenCalled();
    });

    it('未声明属性落在分组元素上，$el 为分组元素，带 aria-label 时为 group 角色', () => {
        const { container } = renderGroup({ 'data-testid': 'group', 'aria-label': 'gallery' });
        const group = container.firstElementChild;
        expect(group).toHaveAttribute('data-testid', 'group');
        expect(group).toHaveAttribute('aria-label', 'gallery');
        expect(group).toHaveAttribute('role', 'group');
        expect(group).not.toHaveAttribute('zoomstep');
        expect(screen.getByRole('group', { name: 'gallery' })).toBe(group);

        let instance: ComponentPublicInstance | null = null;
        render(() => (
            <ImagePreview
                ref={(el: unknown) => {
                    instance = el as ComponentPublicInstance | null;
                }}
                class="own"
            />
        ));
        expect((instance as ComponentPublicInstance | null)?.$el).toBe($(`.${previewCls}-group.own`));
    });

    it('没有名称时分组没有角色，使用方的 role 优先', () => {
        const unnamed = renderGroup();
        expect(unnamed.container.firstElementChild).not.toHaveAttribute('role');
        unnamed.unmount();
        const listed = renderGroup({ 'aria-labelledby': 'heading', role: 'list' });
        expect(listed.container.firstElementChild).toHaveAttribute('role', 'list');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', async () => {
        semiGlobal.config.overrideDefaultProps = { ImagePreview: { closeOnEsc: false, infinite: true, zoomStep: 0.5 } };
        restoreLayout = mockLayout({ natural: [100, 100] });
        const onZoomOut = vi.fn<(zoom: number) => void>();
        renderGroup({ maxZoom: 3, onZoomOut });
        await fireEvent.click(thumbs()[0]);
        expect($(`.${previewCls}-prev`)).not.toBeNull();
        await fireEvent.load(previewImg());
        await fireEvent.click(footerIcon('minus'));
        expect(onZoomOut).toHaveBeenLastCalledWith(2.5);
        await pressEsc();
        expect(getPreview()).not.toBeNull();
    });

    it('读取函数类全局默认值 getPopupContainer 与 setDownloadName', async () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const setDownloadName = vi.fn<(src: string) => string>(() => 'x.jpg');
        vi.stubGlobal(
            'fetch',
            vi.fn<() => Promise<{ ok: boolean }>>(() => Promise.resolve({ ok: false }))
        );
        semiGlobal.config.overrideDefaultProps = {
            ImagePreview: { getPopupContainer: () => container, setDownloadName },
        };
        await renderPreview();
        expect(container.querySelector(`.${previewCls}`)).not.toBeNull();
        await fireEvent.click(footerIcon('download'));
        expect(setDownloadName).toHaveBeenCalledWith(srcList[0]);
        container.remove();
    });

    it('切换时不预加载已加载的图片', async () => {
        const created = stubPreloadImage();
        const list = ['a', 'b', 'c', 'd', 'e'].map((n) => `https://example.com/${n}.jpg`);
        await renderPreview({ defaultCurrentIndex: 0, preLoadGap: 1, src: list });
        await fireEvent.load(previewImg());
        created[0].onload();
        await fireEvent.click(arrow('next'));
        await fireEvent.load(previewImg());
        expect(created.at(-1)?.requested).toEqual([list[2]]);
        created.at(-1)?.onload();
        const count = created.length;
        await fireEvent.click(arrow('prev'));
        await fireEvent.load(previewImg());
        await fireEvent.click(arrow('next'));
        await fireEvent.load(previewImg());
        expect(created.slice(count).flatMap((img) => img.requested)).not.toContain(list[2]);
    });

    it('相对路径的图片经间隔预加载后，走回时不再重复请求', async () => {
        // a browser reads src back resolved against the document
        const created = stubPreloadImage((src) => new URL(src, 'https://example.com/').href);
        const list = ['a', 'b', 'c', 'd', 'e'].map((n) => `${n}.jpg`);
        await renderPreview({ defaultCurrentIndex: 2, preLoadGap: 1, src: list });
        await fireEvent.load(previewImg());
        created[0].onload();
        created[0].onload();
        expect(created[0].requested).toEqual([list[3], list[1]]);
        await fireEvent.click(arrow('next'));
        await fireEvent.load(previewImg());
        const count = created.length;
        await fireEvent.click(arrow('prev'));
        await fireEvent.load(previewImg());
        expect(created.slice(count).flatMap((img) => img.requested)).not.toContain(list[1]);
    });

    it('非受控列表的首次预加载从当前图片相邻处开始', async () => {
        const created = stubPreloadImage();
        render(Image, { props: { preview: { src: srcList, visible: true, preLoadGap: 1 }, src: srcList[0] } });
        await fireEvent.load(thumbs()[0]);
        await nextTick();
        await fireEvent.load(previewImg());
        expect(created[0].requested).toEqual([srcList[1]]);
    });

    it('lazy-load observer 只观察自身分组的图片', async () => {
        const io = stubIntersectionObserver();
        const { container } = render(() => (
            <>
                <Image class="outside" src={srcList[0]} />
                <Group images={srcList.map((src) => ({ src }))} />
            </>
        ));
        await nextTick();
        const observed = io.live().flatMap((o) => [...o.elements]);
        expect(observed).toHaveLength(3);
        expect(observed).not.toContain(container.querySelector('.outside img'));
    });
});

describe('ImagePreview 模态谓词、焦点与 KeepAlive', () => {
    it('ConfigProvider 的 getPopupContainer：预览在该容器中，非模态，不锁 body、不设 inert', async () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        render(ConfigProvider, {
            props: { getPopupContainer: () => container },
            slots: { default: () => <ImagePreview src={srcList} visible /> },
        });
        await nextTick();
        const dialog = screen.getByRole('dialog');
        expect(container.contains(dialog)).toBe(true);
        expect(dialog).toHaveClass(`${previewCls}-popup`);
        expect(dialog).not.toHaveAttribute('aria-modal');
        expect(document.body.style.overflow).toBe('');
        expect([...document.body.children].some((el) => (el as HTMLElement).inert)).toBe(false);
        expect(document.activeElement).toBe(dialog);
        container.remove();
    });

    it('非模态预览关闭时，焦点已被移到页面别处则不归还', async () => {
        const container = document.createElement('div');
        const outside = document.createElement('button');
        document.body.append(container, outside);
        const trigger = document.createElement('button');
        document.body.append(trigger);
        trigger.focus();
        const view = await renderPreview({ getPopupContainer: () => container });
        expect(document.activeElement).toBe(screen.getByRole('dialog'));
        outside.focus();
        await view.rerender({ visible: false });
        expect(document.activeElement).toBe(outside);
        container.remove();
        outside.remove();
        trigger.remove();
    });

    it('模态预览设 inert，Tab 留在对话框内', async () => {
        const outside = document.createElement('div');
        document.body.append(outside);
        await renderPreview();
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
        expect(outside.inert).toBe(true);
        outside.remove();
    });

    it('打开时先聚焦带 autofocus 的元素', async () => {
        await renderPreview(
            {},
            {
                previewMenu: () => (
                    <div>
                        <input aria-label="note" autofocus />
                    </div>
                ),
            }
        );
        expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'note' }));
    });

    it('KeepAlive 失活时释放 inert 与 body 滚动锁，激活后恢复并移入焦点', async () => {
        const outside = document.createElement('div');
        document.body.append(outside);
        const view = render(CachedPreview, { props: { active: true, src: srcList } });
        await nextTick();
        expect(document.body.style.overflow).toBe('hidden');
        expect(outside.inert).toBe(true);

        await view.rerender({ active: false });
        expect(getPreview()).toBeNull();
        expect(document.body.style.overflow).toBe('');
        expect(outside.inert).toBe(false);
        await press('ArrowRight', {}, window);

        await view.rerender({ active: true });
        await nextTick();
        expect(document.body.style.overflow).toBe('hidden');
        expect(outside.inert).toBe(true);
        expect(document.activeElement).toBe(screen.getByRole('dialog'));
        expect(pageInfo()).toBe('1/3');
        outside.remove();
    });

    it('KeepAlive 失活再激活后关闭，焦点回到打开前的元素', async () => {
        const opener = document.createElement('button');
        document.body.append(opener);
        opener.focus();
        const view = render(CachedPreview, { props: { active: true, src: srcList } });
        await nextTick();
        expect(document.activeElement).toBe(screen.getByRole('dialog'));

        await view.rerender({ active: false });
        await view.rerender({ active: true });
        await nextTick();
        await view.rerender({ visible: false });
        await nextTick();
        expect(document.activeElement).toBe(opener);
        opener.remove();
    });
});

describe('ImagePreview 键盘与屏幕阅读器', () => {
    const dialog = () => screen.getByRole('dialog');
    const names = () => screen.getAllByRole('button').map((button) => button.getAttribute('aria-label'));
    const enPreview = async (props: Props = {}) => {
        const view = withLocale(en_US, () => <ImagePreview src={srcList} visible {...props} />);
        await nextTick();
        return view;
    };

    it('每个控件都是以语言包命名的原生按钮，缩放滑块也有名称', async () => {
        await enPreview({ defaultCurrentIndex: 1 });
        for (const button of screen.getAllByRole('button')) {
            expect(button.tagName).toBe('BUTTON');
            expect(button).toHaveAttribute('type', 'button');
            expect(button).not.toHaveAttribute('tabindex', '-1');
        }
        expect(names()).toEqual(['Close', 'Previous', 'Next', 'Previous', 'Next', 'Zoom out', 'Zoom in', 'Original size', 'Rotate', 'Download']);
        const slider = screen.getByRole<HTMLInputElement>('slider', { name: 'Zoom' });
        expect(slider).toHaveAttribute('aria-valuetext', `${slider.value}%`);

        await fireEvent.click(screen.getByRole('button', { name: 'Original size' }));
        expect(screen.getByRole('button', { name: 'Adapt to the page' })).toBeInTheDocument();
    });

    it('关闭按钮与缩放滑块的名称随语言切换', async () => {
        withLocale(ja_JP, () => <ImagePreview src={srcList} visible />);
        await nextTick();
        expect(screen.getByRole('button', { name: ja_JP.Image.close })).toBeInTheDocument();
        expect(screen.getByRole('slider', { name: ja_JP.Image.zoom })).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toHaveAccessibleName(ja_JP.Image.preview);
    });

    it('tip 属性为按钮命名；设置 showTooltip 时按钮为 Tooltip 触发器', async () => {
        await renderPreview({ nextTip: 'N', prevTip: 'P', rotateTip: 'R', showTooltip: true });
        expect(screen.getAllByRole('button', { name: 'N' })).toHaveLength(2);
        expect(screen.getByRole('button', { name: 'P' })).toHaveAttribute('aria-disabled', 'true');
        expect(screen.getByRole('button', { name: '关闭' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'R' }).parentElement).toHaveClass(`${previewCls}-footer`);
        expect(screen.getByRole('button', { name: 'R' })).toHaveClass(`${prefixCls}-tooltip-children-wrapper`);
    });

    it('禁用的底部按钮仍可聚焦，报告 aria-disabled 且无操作', async () => {
        const onPrev = vi.fn<(index: number) => void>();
        await enPreview({ disableDownload: true, onPrev });
        const footerPrev = screen.getByRole('button', { name: 'Previous' });
        expect(footerPrev).toHaveAttribute('aria-disabled', 'true');
        expect(screen.getByRole('button', { name: 'Download' })).toHaveAttribute('aria-disabled', 'true');
        for (const next of screen.getAllByRole('button', { name: 'Next' })) {
            expect(next).not.toHaveAttribute('aria-disabled');
        }
        footerPrev.focus();
        expect(document.activeElement).toBe(footerPrev);
        await fireEvent.click(footerPrev);
        expect(onPrev).not.toHaveBeenCalled();
    });

    it('预览为模态对话框，以标题命名，无标题时以语言包命名', async () => {
        const view = await enPreview();
        expect(dialog()).toHaveAttribute('aria-modal', 'true');
        expect(dialog()).toHaveAccessibleName('Preview');
        view.unmount();
        await enPreview({ previewTitle: 'Album' });
        expect(dialog()).toHaveAccessibleName('Album');
        expect(dialog()).not.toHaveAttribute('aria-label');
    });

    it('#title 只替换标题文字，对话框名称不变', async () => {
        await renderPreview({ previewTitle: 'Album' }, { title: ({ title, index }: { title: string; index: number }) => <b>{`T:${title}:${index}`}</b> });
        expect($(`.${previewCls}-header-title`)?.textContent).toBe('T:Album:0');
        expect(dialog()).toHaveAttribute('aria-labelledby', $(`.${previewCls}-header-title`)?.id);
    });

    it('#title 渲染为空时标题区为空，不回落到 previewTitle', async () => {
        await renderPreview({ previewTitle: 'Album' }, { title: () => null });
        expect($(`.${previewCls}-header-title`)?.textContent).toBe('');
        expect(dialog()).toHaveAttribute('aria-labelledby', $(`.${previewCls}-header-title`)?.id);
    });

    it('previewTitle 渲染在单独预览、单个 Image 及 src 列表之后的头部', async () => {
        const first = await renderPreview({ previewTitle: 'Album' });
        expect($(`.${previewCls}-header-title`)?.textContent).toBe('Album');
        first.unmount();

        const single = render(Image, { props: { preview: { visible: true, previewTitle: 'one' }, src: srcList[0] } });
        await fireEvent.load(thumbs()[0]);
        await nextTick();
        expect($(`.${previewCls}-header-title`)?.textContent).toBe('one');
        single.unmount();

        const view = await renderPreview({ currentIndex: 1, previewTitle: 'Album', src: [srcList[0]] }, { default: () => <Image preview={{ previewTitle: 'second' }} src={srcList[1]} /> });
        await nextTick();
        expect($(`.${previewCls}-header-title`)?.textContent).toBe('second');
        await view.rerender({ currentIndex: 0 });
        expect($(`.${previewCls}-header-title`)?.textContent).toBe('Album');
    });

    it('打开时焦点移入对话框，关闭时焦点回到触发器', async () => {
        render(Model, { props: { src: srcList } });
        const trigger = screen.getByRole('button', { name: 'open' });
        trigger.focus();
        await fireEvent.click(trigger);
        expect(document.activeElement).toBe(dialog());
        await pressEsc();
        expect(getPreview()).toBeNull();
        expect(document.activeElement).toBe(trigger);

        await fireEvent.click(trigger);
        await fireEvent.click(screen.getByRole('button', { name: '关闭' }));
        expect(document.activeElement).toBe(trigger);
    });

    it('Tab 焦点留在对话框内', async () => {
        await enPreview();
        const buttons = screen.getAllByRole('button');
        await press('Tab', { shiftKey: true });
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Download' }));
        await press('Tab');
        expect(document.activeElement).toBe(buttons[0]);
        await press('Tab', { shiftKey: true });
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Download' }));
        dialog().focus();
        await press('Tab');
        expect(document.activeElement).toBe(buttons[0]);
    });

    it('预览之外的控件上的方向键不切换图片也不被拦截', async () => {
        const container = document.createElement('div');
        const outside = document.createElement('button');
        document.body.append(container, outside);
        await renderPreview({ getPopupContainer: () => container });
        outside.focus();
        expect((await press('ArrowRight', {}, outside)).defaultPrevented).toBe(false);
        expect(pageInfo()).toBe('1/3');
        expect((await press('ArrowRight', {}, document.body)).defaultPrevented).toBe(true);
        expect(pageInfo()).toBe('2/3');
        container.remove();
        outside.remove();
    });

    it('非模态预览的下标变化不会把使用方移到页面别处的焦点拉回对话框', async () => {
        const container = document.createElement('div');
        const outside = document.createElement('button');
        document.body.append(container, outside);
        const view = await renderPreview({ currentIndex: 0, getPopupContainer: () => container });
        outside.focus();
        await view.rerender({ currentIndex: 1 });
        await nextTick();
        expect(document.activeElement).toBe(outside);
        container.remove();
        outside.remove();
    });

    it('非主按钮的按下与抬起不关闭预览', async () => {
        renderGroup();
        await fireEvent.click(thumbs()[0]);
        for (const button of [1, 2]) {
            await fireEvent.mouseDown(getPreview() as HTMLElement, { button, clientX: 10, clientY: 10 });
            await fireEvent.mouseUp(getPreview() as HTMLElement, { button, clientX: 10, clientY: 10 });
        }
        expect(getPreview()).not.toBeNull();
        await clickMask();
        expect(getPreview()).toBeNull();
    });

    it('ArrowLeft 与 ArrowRight 切换图片；与按钮一致，除非 infinite，否则首尾停止', async () => {
        const onPrev = vi.fn<(index: number) => void>();
        const onNext = vi.fn<(index: number) => void>();
        const view = renderGroup({ onNext, onPrev });
        await fireEvent.click(thumbs()[0]);
        await press('ArrowLeft');
        expect(pageInfo()).toBe('1/3');
        expect(onPrev).not.toHaveBeenCalled();
        expect((await press('ArrowRight')).defaultPrevented).toBe(true);
        expect(onNext).toHaveBeenCalledWith(1);
        await press('ArrowRight');
        expect(pageInfo()).toBe('3/3');
        expect((await press('ArrowRight')).defaultPrevented).toBe(false);
        expect(pageInfo()).toBe('3/3');
        await press('ArrowLeft');
        expect(pageInfo()).toBe('2/3');
        expect(onPrev).toHaveBeenCalledWith(1);

        await view.rerender({ infinite: true });
        await press('ArrowRight');
        await press('ArrowRight');
        expect(pageInfo()).toBe('1/3');
        await press('ArrowLeft');
        expect(pageInfo()).toBe('3/3');
    });

    it('单张图片时不切换', async () => {
        const onChange = vi.fn<(index: number) => void>();
        await renderPreview({ infinite: true, src: srcList[0], onChange });
        await press('ArrowRight');
        await press('ArrowLeft');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('RTL 下方向键互换', async () => {
        render(ConfigProvider, {
            props: { direction: 'rtl' },
            slots: { default: () => <ImagePreview defaultCurrentIndex={1} src={srcList} visible /> },
        });
        await nextTick();
        await press('ArrowLeft');
        expect(pageInfo()).toBe('3/3');
        await press('ArrowRight');
        await press('ArrowRight');
        expect(pageInfo()).toBe('1/3');
    });

    it('输入框、带修饰键的方向键与缩放滑块保留其方向键行为', async () => {
        await renderPreview(
            { defaultCurrentIndex: 1 },
            {
                previewMenu: (menu: MenuProps) => (
                    <div>
                        <input aria-label="note" />
                        <textarea aria-label="long note" />
                        <div class="rich" contenteditable="true" />
                        {menu.menuItems}
                    </div>
                ),
            }
        );
        const rich = $('.rich') as HTMLElement;
        // jsdom does not implement isContentEditable
        Object.defineProperty(rich, 'isContentEditable', { value: true });
        for (const field of [screen.getByRole('textbox', { name: 'note' }), screen.getByRole('textbox', { name: 'long note' }), rich]) {
            await press('ArrowRight', {}, field);
            await press('ArrowLeft', {}, field);
        }
        expect(pageInfo()).toBe('2/3');
        for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey']) {
            await press('ArrowRight', { [modifier]: true });
        }
        expect(pageInfo()).toBe('2/3');
        await press('ArrowRight', {}, screen.getByRole('slider'));
        expect(pageInfo()).toBe('2/3');
        await press('ArrowRight', {}, window);
        expect(pageInfo()).toBe('3/3');
    });

    it('焦点落在隐藏的操作上时重新显示操作栏并保持显示', async () => {
        vi.useFakeTimers();
        await enPreview({ viewerVisibleDelay: 1000 });
        const footer = () => $(`.${previewCls}-footer`);
        await advance(1000);
        expect(footer()).toHaveClass(`${previewCls}-hide`);
        screen.getByRole('button', { name: 'Rotate' }).focus();
        await nextTick();
        expect(footer()).not.toHaveClass(`${previewCls}-hide`);
        await advance(1000);
        expect(footer()).not.toHaveClass(`${previewCls}-hide`);
        dialog().focus();
        await advance(1000);
        expect(footer()).toHaveClass(`${previewCls}-hide`);
        await press('ArrowRight');
        expect(footer()).not.toHaveClass(`${previewCls}-hide`);
    });

    it('焦点在到达末尾后消失的上一张或下一张按钮上时，焦点移到对话框', async () => {
        await enPreview({ defaultCurrentIndex: 1 });
        const [arrowNext] = screen.getAllByRole('button', { name: 'Next' });
        arrowNext.focus();
        await fireEvent.click(arrowNext);
        expect(pageInfo()).toBe('3/3');
        expect(document.activeElement).toBe(dialog());
    });
});
