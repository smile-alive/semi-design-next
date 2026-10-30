import { flushSync } from 'svelte';
import { fireEvent, render as renderSvelte } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { mockResizeObserverCore } from '@test/utils/dom/resize-observer-core';
import { createStore } from '../../_base/__tests__/store.svelte';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import Cropper from '../cropper.svelte';
import type { CropperProps } from '../interface';
import ZoomModes from './zoom-modes.svelte';

const SRC = 'https://example.com/a.png';
const size = { width: 400, height: 300 };

// jsdom has no layout: every element reports the container size
function mockLayout() {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => size.width);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => size.height);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
        () =>
            ({
                x: 0,
                y: 0,
                left: 0,
                top: 0,
                right: size.width,
                bottom: size.height,
                width: size.width,
                height: size.height,
            }) as DOMRect
    );
}

function query(container: Element, selector: string) {
    const found = container.querySelector<HTMLElement>(selector);
    if (!found) throw new Error(`missing ${selector}`);
    return found;
}
const getRoot = (container: Element) => query(container, '.semi-cropper');
const getImg = (container: Element) => query(container, '.semi-cropper-img') as HTMLImageElement;
const getBox = (container: Element) => query(container, '.semi-cropper-box');
const getViewBox = (container: Element) => query(container, '.semi-cropper-view-box');
const getMask = (container: Element) => query(container, '.semi-cropper-mask');
const getCorners = (container: Element) => [...container.querySelectorAll<HTMLElement>('.semi-cropper-box-corner')].map((el) => el.dataset.dir);
const getCorner = (container: Element, dir: string) => query(container, `[data-dir="${dir}"]`);

// a browser sends a captured pointer's release, then lostpointercapture, to the element that was pressed
async function release(el: Element) {
    await fireEvent.pointerUp(el);
    await fireEvent.lostPointerCapture(el);
    flushSync();
}

async function pointer(el: Element, type: 'pointerDown' | 'pointerMove', init: PointerEventInit) {
    await fireEvent[type](el, init);
    flushSync();
}

// an 800 x 400 image fits the 400 x 300 container at scale 0.5: 400 x 200, centered
async function loadImage(container: Element, naturalWidth = 800, naturalHeight = 400) {
    const img = getImg(container);
    Object.defineProperty(img, 'naturalWidth', { value: naturalWidth, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: naturalHeight, configurable: true });
    await fireEvent.load(img);
    flushSync();
}

function imgStyle(container: Element) {
    const { width, height, transform } = getImg(container).style;
    return { width, height, transform };
}
function boxStyle(container: Element) {
    const { width, height, transform } = getBox(container).style;
    return { width, height, transform };
}
const offsets = (transform: string) => (transform.match(/-?[\d.e-]+(?=px)/g) ?? []).map(Number);

function dispatch(target: Element, event: Event) {
    target.dispatchEvent(event);
    flushSync();
    return event.defaultPrevented;
}
const wheel = (container: Element, init: WheelEventInit) => dispatch(getRoot(container), new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init }));
const key = (container: Element, k: string, init: KeyboardEventInit = {}) => dispatch(getBox(container), new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));

async function renderLoaded(props: CropperProps = {}, context?: Map<unknown, unknown>) {
    const view = renderSvelte(Cropper, { props: { src: SRC, ...props }, context });
    await loadImage(view.container);
    return view;
}

function globalWith(overrideDefaultProps: SemiGlobal['config']['overrideDefaultProps']) {
    const semi = new SemiGlobal();
    semi.config.overrideDefaultProps = overrideDefaultProps;
    return new Map<unknown, unknown>([[semiGlobalKey, semi]]);
}

describe('Svelte Cropper', () => {
    beforeEach(() => {
        size.width = 400;
        size.height = 300;
        mockLayout();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('图片加载后适配容器，并绘制正方形裁剪框', async () => {
        const { container } = renderSvelte(Cropper, { props: { src: SRC } });
        expect(getImg(container)).toHaveAttribute('src', SRC);
        expect(getImg(container)).toHaveAttribute('crossorigin', 'anonymous');
        expect(getCorners(container)).toEqual([]);
        await loadImage(container);
        expect(imgStyle(container)).toEqual({ width: '400px', height: '200px', transform: 'translate(0px, 50px) rotate(0deg)' });
        expect(boxStyle(container)).toEqual({ width: '300px', height: '300px', transform: 'translate(50px, 0px)' });
        expect(getCorners(container)).toEqual(['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br']);
        const viewImg = query(container, '.semi-cropper-view-img');
        expect(viewImg).toHaveAttribute('src', SRC);
        expect(viewImg.style.transform).toBe('translate(-50px, 50px) rotate(0deg)');
        expect(viewImg).toHaveAttribute('draggable', 'false');
    });

    it('裁剪框尺寸依次由 aspectRatio、defaultAspectRatio 决定', async () => {
        const { container: wide } = await renderLoaded({ aspectRatio: 2 });
        expect(boxStyle(wide)).toEqual({ width: '400px', height: '200px', transform: 'translate(0px, 50px)' });
        const { container: tall } = await renderLoaded({ defaultAspectRatio: 0.5 });
        expect(boxStyle(tall)).toEqual({ width: '150px', height: '300px', transform: 'translate(125px, 0px)' });
    });

    it('class 与 style 应用到根元素', () => {
        const { container } = renderSvelte(Cropper, { props: { class: 'custom', style: 'height: 300px', src: 'a.png' } });
        expect(getRoot(container)).toHaveClass('semi-cropper', 'custom');
        expect(getRoot(container).style.height).toBe('300px');
    });

    it('imgProps 传给图片，同时保留裁剪所需的属性', async () => {
        const onload = vi.fn<(event: Event) => void>();
        const { container } = renderSvelte(Cropper, {
            props: {
                imgProps: { alt: 'avatar', crossorigin: 'use-credentials', class: 'custom-img', title: 'photo', src: 'https://example.com/other.png', style: 'opacity: 0.5; width: 1px', onload },
                src: SRC,
            },
        });
        const img = getImg(container);
        expect(img).toHaveAttribute('alt', 'avatar');
        expect(img).toHaveAttribute('crossorigin', 'use-credentials');
        expect(img).toHaveAttribute('title', 'photo');
        expect(img).toHaveClass('semi-cropper-img', 'custom-img');
        expect(img).toHaveAttribute('src', SRC);
        expect(img.style.opacity).toBe('0.5');
        await loadImage(container);
        expect(onload).toHaveBeenCalledTimes(1);
        expect(imgStyle(container).width).toBe('400px');
    });

    it('imgProps 的 alt 与 crossorigin 覆盖默认值', () => {
        const { container } = renderSvelte(Cropper, { props: { imgProps: { alt: 'photo', crossorigin: '' }, src: SRC } });
        expect(getImg(container)).toHaveAttribute('alt', 'photo');
        expect(getImg(container)).toHaveAttribute('crossorigin', '');
        expect(query(container, '.semi-cropper-view-img')).toHaveAttribute('alt', '');
    });

    it('shape 决定圆形类名与显示的缩放手柄', async () => {
        const { container: round } = await renderLoaded({ shape: 'round' });
        expect(getBox(round)).toHaveClass('semi-cropper-view-box-round');
        expect(getViewBox(round)).toHaveClass('semi-cropper-view-box-round');
        expect(getCorners(round)).toEqual(['tm', 'ml', 'mr', 'bm']);

        const { container: roundRect } = await renderLoaded({ shape: 'roundRect' });
        expect(getBox(roundRect)).not.toHaveClass('semi-cropper-view-box-round');
        expect(getViewBox(roundRect)).toHaveClass('semi-cropper-view-box-round');
        expect(getCorners(roundRect)).toHaveLength(8);

        const { container: rect } = await renderLoaded({ shape: 'rect' });
        expect(getBox(rect)).not.toHaveClass('semi-cropper-view-box-round');
        expect(getViewBox(rect)).not.toHaveClass('semi-cropper-view-box-round');
    });

    it('showResizeBox 为 false 时隐藏缩放手柄', async () => {
        const { container } = await renderLoaded({ showResizeBox: false });
        expect(getCorners(container)).toEqual([]);
    });

    it('cropperBoxStyle 与 cropperBoxCls 应用到裁剪框，并以其计算尺寸为准', async () => {
        const { container } = await renderLoaded({ cropperBoxCls: 'my-box', cropperBoxStyle: 'outline-color: red; width: 10px' });
        expect(getBox(container)).toHaveClass('semi-cropper-box', 'my-box');
        expect(getBox(container).style.outlineColor).toBe('red');
        expect(getBox(container).style.width).toBe('300px');
    });

    it('从 overrideDefaultProps 读取默认值，实例参数优先', async () => {
        const context = globalWith({ Cropper: { shape: 'round', showResizeBox: false, maxZoom: 1.5, zoomStep: 0.5 } });
        const { container } = await renderLoaded({}, context);
        expect(getBox(container)).toHaveClass('semi-cropper-view-box-round');
        expect(getCorners(container)).toEqual([]);
        wheel(container, { deltaY: -1, clientX: 200, clientY: 150 });
        wheel(container, { deltaY: -1, clientX: 200, clientY: 150 });
        expect(imgStyle(container).width).toBe('600px');

        const { container: own } = await renderLoaded({ shape: 'rect' }, context);
        expect(getBox(own)).not.toHaveClass('semi-cropper-view-box-round');
    });

    it('preview 的全局默认值生效', async () => {
        const node = document.createElement('div');
        document.body.append(node);
        await renderLoaded({}, globalWith({ Cropper: { preview: () => node } }));
        expect(node.querySelectorAll('img')).toHaveLength(1);
        node.remove();
    });

    describe('rotate 与 zoom', () => {
        it('图片加载后 rotate 绕裁剪框中心旋转图片，rotate 变化时继续绕中心转', async () => {
            const store = createStore<CropperProps>({ rotate: 90, src: 'a.png', zoom: 1 });
            const { container } = renderSvelte(Cropper, { props: store });
            await loadImage(container);
            expect(imgStyle(container).transform).toBe('translate(0px, 50px) rotate(90deg)');

            const mask = getMask(container);
            await pointer(mask, 'pointerDown', { clientX: 0, clientY: 0 });
            await pointer(mask, 'pointerMove', { clientX: 100, clientY: 0 });
            await release(mask);
            expect(imgStyle(container).transform).toBe('translate(100px, 50px) rotate(90deg)');

            store.rotate = 180;
            flushSync();
            const { transform } = imgStyle(container);
            const [x, y] = offsets(transform);
            expect(x).toBeCloseTo(0);
            expect(y).toBeCloseTo(150);
            expect(transform).toMatch(/rotate\(180deg\)$/);
        });

        it('zoom 绕裁剪框中心缩放图片', async () => {
            const store = createStore<CropperProps>({ rotate: 0, src: 'a.png', zoom: 2 });
            const { container } = renderSvelte(Cropper, { props: store });
            await loadImage(container);
            expect(imgStyle(container)).toEqual({ width: '800px', height: '400px', transform: 'translate(-200px, -50px) rotate(0deg)' });
            store.zoom = 1;
            flushSync();
            expect(imgStyle(container)).toEqual({ width: '400px', height: '200px', transform: 'translate(0px, 50px) rotate(0deg)' });
        });

        it('只 rotate 不 zoom 时图片尺寸保持不变', async () => {
            const { container } = await renderLoaded({ rotate: 90 });
            expect(imgStyle(container)).toEqual({ width: '400px', height: '200px', transform: 'translate(0px, 50px) rotate(90deg)' });
        });

        it('zoom 为 NaN 时不会无限重渲染', async () => {
            const { container } = await renderLoaded({ rotate: 0, zoom: NaN });
            expect(getImg(container)).toBeInTheDocument();
        });

        it('zoom 与 rotate 变回 undefined 时回到默认值', async () => {
            const store = createStore<CropperProps>({ rotate: 90, src: 'a.png', zoom: 2 });
            const { container } = renderSvelte(Cropper, { props: store });
            await loadImage(container);
            expect(imgStyle(container).width).toBe('800px');
            store.rotate = undefined;
            store.zoom = undefined;
            flushSync();
            expect(imgStyle(container)).toMatchObject({ width: '400px', height: '200px' });
            expect(imgStyle(container).transform).toMatch(/rotate\(0deg\)$/);
        });
    });

    describe('zoom 的四种写法', () => {
        const setup = (mode: 'bind' | 'function' | 'one-way' | 'uncontrolled', value?: number, accept = true) => {
            const store = createStore<{ value: number | undefined; accept: boolean; log: string[] }>({ value, accept, log: [] });
            const { container } = renderSvelte(ZoomModes, { props: { mode, store } });
            return { store, container };
        };
        const zoomIn = (container: Element) => wheel(container, { deltaY: -1, clientX: 200, clientY: 150 });

        it('非受控：滚轮缩放生效，onZoomChange 收到新值', async () => {
            const { store, container } = setup('uncontrolled');
            await loadImage(container);
            zoomIn(container);
            expect(store.log).toEqual(['change 1.1']);
            expect(parseFloat(imgStyle(container).width)).toBeCloseTo(440);
        });

        it('bind:zoom：滚轮缩放写回父级，父级改回 1 时图片回到 1', async () => {
            const { store, container } = setup('bind', 1);
            await loadImage(container);
            zoomIn(container);
            expect(store.value).toBe(1.1);
            expect(parseFloat(imgStyle(container).width)).toBeCloseTo(440);
            store.value = 1;
            flushSync();
            expect(imgStyle(container).width).toBe('400px');
        });

        it('bind:zoom 重置为 undefined 后回到默认缩放', async () => {
            const { store, container } = setup('bind', 1);
            await loadImage(container);
            zoomIn(container);
            store.value = undefined;
            flushSync();
            expect(imgStyle(container).width).toBe('400px');
        });

        it('函数绑定且 setter 拒绝：图片回到受控值，onZoomChange 只发出一次，不自翻转', async () => {
            const { store, container } = setup('function', 1, false);
            await loadImage(container);
            zoomIn(container);
            expect(store.log).toEqual(['set 1.1', 'change 1.1']);
            expect(store.value).toBe(1);
            expect(imgStyle(container).width).toBe('400px');
            flushSync();
            expect(imgStyle(container).width).toBe('400px');
            expect(store.log).toHaveLength(2);
        });

        it('函数绑定且 setter 接受：缩放生效', async () => {
            const { store, container } = setup('function', 1, true);
            await loadImage(container);
            zoomIn(container);
            expect(store.value).toBe(1.1);
            expect(parseFloat(imgStyle(container).width)).toBeCloseTo(440);
        });

        it('单向传值：组件在本地覆盖，父级值不变；父级再推值时以父级为准', async () => {
            const { store, container } = setup('one-way', 1);
            await loadImage(container);
            zoomIn(container);
            expect(store.value).toBe(1);
            expect(parseFloat(imgStyle(container).width)).toBeCloseTo(440);
            store.value = 2;
            flushSync();
            expect(imgStyle(container).width).toBe('800px');
        });
    });

    describe('滚轮缩放', () => {
        it('以指针为中心缩放，发出 onZoomChange，并阻止页面缩放', async () => {
            const onZoomChange = vi.fn<(zoom: number) => void>();
            const { container } = await renderLoaded({ onZoomChange });
            const prevented = wheel(container, { deltaY: -1, clientX: 0, clientY: 0 });
            expect(prevented).toBe(true);
            expect(onZoomChange.mock.calls).toEqual([[1.1]]);
            const { width, height, transform } = imgStyle(container);
            expect(parseFloat(width)).toBeCloseTo(440);
            expect(parseFloat(height)).toBeCloseTo(220);
            const [x, y] = offsets(transform);
            expect(x).toBeCloseTo(0);
            expect(y).toBeCloseTo(55);
            wheel(container, { deltaY: 1, clientX: 0, clientY: 0 });
            expect(onZoomChange.mock.lastCall).toEqual([1]);
            expect(imgStyle(container).width).toBe('400px');
        });

        it('wheel 监听是非 passive 的，卸载后移除', async () => {
            const add = vi.spyOn(EventTarget.prototype, 'addEventListener');
            const remove = vi.spyOn(EventTarget.prototype, 'removeEventListener');
            const view = await renderLoaded();
            const options = add.mock.calls.filter(([type, , option]) => type === 'wheel' && (option as AddEventListenerOptions | undefined)?.passive === false);
            expect(options).toHaveLength(1);
            view.unmount();
            expect(remove.mock.calls.some(([type, listener]) => type === 'wheel' && listener === options[0]?.[1])).toBe(true);
        });

        it('缩放到 maxZoom 与 minZoom 时停止', async () => {
            const onZoomChange = vi.fn<(zoom: number) => void>();
            const { container } = await renderLoaded({ zoomStep: 0.5, maxZoom: 2, minZoom: 0.5, onZoomChange });
            const step = (deltaY: number) => wheel(container, { deltaY, clientX: 200, clientY: 150 });
            step(-1);
            step(-1);
            step(-1);
            expect(onZoomChange.mock.calls).toEqual([[1.5], [2]]);
            expect(imgStyle(container).width).toBe('800px');
            for (let i = 0; i < 4; i++) step(1);
            expect(onZoomChange.mock.calls.slice(2)).toEqual([[1.5], [1], [0.5]]);
            expect(imgStyle(container).width).toBe('200px');
        });

        it('根元素带边框时，缩放中心按容器内坐标计算', async () => {
            vi.spyOn(Element.prototype, 'clientLeft', 'get').mockReturnValue(10);
            vi.spyOn(Element.prototype, 'clientTop', 'get').mockReturnValue(10);
            const { container } = await renderLoaded();
            wheel(container, { deltaY: -1, clientX: 10, clientY: 10 });
            const [x, y] = offsets(imgStyle(container).transform);
            expect(x).toBeCloseTo(0);
            expect(y).toBeCloseTo(55);
        });

        it('读取最新的 props', async () => {
            const onZoomChange = vi.fn<(zoom: number) => void>();
            const store = createStore<CropperProps>({ src: SRC, zoomStep: 0.1, onZoomChange });
            const { container } = renderSvelte(Cropper, { props: store });
            await loadImage(container);
            store.zoomStep = 0.5;
            flushSync();
            wheel(container, { deltaY: -1, clientX: 200, clientY: 150 });
            expect(onZoomChange.mock.calls).toEqual([[1.5]]);
        });

        it('图片加载前的滚轮不改变缩放，加载后仍按适配尺寸显示', async () => {
            const onZoomChange = vi.fn<(zoom: number) => void>();
            const { container } = renderSvelte(Cropper, { props: { src: SRC, onZoomChange } });
            wheel(container, { deltaY: -1, clientX: 200, clientY: 150 });
            expect(onZoomChange).not.toHaveBeenCalled();
            await loadImage(container);
            expect(imgStyle(container).width).toBe('400px');
            wheel(container, { deltaY: -1, clientX: 200, clientY: 150 });
            expect(onZoomChange.mock.calls).toEqual([[1.1]]);
        });
    });

    it('加载后改变 aspectRatio，裁剪框按新比例重排并保持在容器内', async () => {
        const store = createStore<CropperProps>({ src: SRC, aspectRatio: 1 });
        const { container } = renderSvelte(Cropper, { props: store });
        await loadImage(container);
        expect(boxStyle(container)).toEqual({ width: '300px', height: '300px', transform: 'translate(50px, 0px)' });
        store.aspectRatio = 2;
        flushSync();
        expect(boxStyle(container)).toEqual({ width: '400px', height: '200px', transform: 'translate(0px, 50px)' });
        store.aspectRatio = 0.5;
        flushSync();
        expect(boxStyle(container)).toEqual({ width: '100px', height: '200px', transform: 'translate(150px, 50px)' });
    });

    describe('拖拽', () => {
        it('鼠标非主按钮按下不开始拖动', async () => {
            const { container } = await renderLoaded();
            const surfaces = [
                [getBox(container), 'transform', boxStyle],
                [getCorner(container, 'br'), 'width', boxStyle],
                [getMask(container), 'transform', imgStyle],
            ] as const;
            for (const [surface, prop, read] of surfaces) {
                const before = read(container)[prop];
                for (const button of [1, 2]) {
                    await pointer(surface, 'pointerDown', { pointerType: 'mouse', button, clientX: 200, clientY: 150 });
                    await pointer(surface, 'pointerMove', { pointerType: 'mouse', clientX: 150, clientY: 100 });
                    await release(surface);
                }
                expect(read(container)[prop]).toBe(before);
            }
        });

        it('裁剪框在容器内移动，直到松开', async () => {
            const { container } = await renderLoaded();
            const box = getBox(container);
            await pointer(box, 'pointerDown', { clientX: 200, clientY: 150 });
            await pointer(box, 'pointerMove', { clientX: 210, clientY: 150 });
            expect(boxStyle(container).transform).toBe('translate(60px, 0px)');
            await pointer(box, 'pointerMove', { clientX: 500, clientY: 150 });
            expect(boxStyle(container).transform).toBe('translate(100px, 0px)');
            await release(box);
            await pointer(box, 'pointerMove', { clientX: 0, clientY: 150 });
            expect(boxStyle(container).transform).toBe('translate(100px, 0px)');
        });

        it('无 aspectRatio 时，缩放手柄可自由缩放裁剪框', async () => {
            const { container } = await renderLoaded();
            const corner = getCorner(container, 'br');
            await pointer(corner, 'pointerDown', { clientX: 350, clientY: 300 });
            await pointer(corner, 'pointerMove', { clientX: 300, clientY: 200 });
            expect(boxStyle(container)).toEqual({ width: '250px', height: '200px', transform: 'translate(50px, 0px)' });
            await release(corner);
            await pointer(corner, 'pointerMove', { clientX: 100, clientY: 100 });
            expect(boxStyle(container).width).toBe('250px');
        });

        it('缩放手柄保持 aspectRatio', async () => {
            const { container } = await renderLoaded({ aspectRatio: 1 });
            const corner = getCorner(container, 'br');
            await pointer(corner, 'pointerDown', { clientX: 350, clientY: 300 });
            await pointer(corner, 'pointerMove', { clientX: 0, clientY: 200 });
            expect(boxStyle(container)).toEqual({ width: '200px', height: '200px', transform: 'translate(50px, 0px)' });
            await release(corner);
        });

        it.each([
            ['tl', 70, 30, { width: '280px', height: '270px', transform: 'translate(70px, 30px)' }],
            ['tm', 200, 30, { width: '300px', height: '270px', transform: 'translate(50px, 30px)' }],
            ['tr', 330, 30, { width: '280px', height: '270px', transform: 'translate(50px, 30px)' }],
            ['ml', 70, 150, { width: '280px', height: '300px', transform: 'translate(70px, 0px)' }],
            ['mr', 330, 150, { width: '280px', height: '300px', transform: 'translate(50px, 0px)' }],
            ['bl', 70, 270, { width: '280px', height: '270px', transform: 'translate(70px, 0px)' }],
            ['bm', 200, 270, { width: '300px', height: '270px', transform: 'translate(50px, 0px)' }],
            ['br', 330, 270, { width: '280px', height: '270px', transform: 'translate(50px, 0px)' }],
        ])('无 aspectRatio 时 %s 手柄只移动自己的边', async (dir, x, y, expected) => {
            const { container } = await renderLoaded();
            const handle = getCorner(container, dir);
            await pointer(handle, 'pointerDown', { clientX: 200, clientY: 150 });
            await pointer(handle, 'pointerMove', { clientX: x, clientY: y });
            expect(boxStyle(container)).toEqual(expected);
            await release(handle);
        });

        it('未按下时悬停缩放手柄或裁剪框不产生变化', async () => {
            const { container } = await renderLoaded();
            const before = boxStyle(container);
            await pointer(getCorner(container, 'br'), 'pointerMove', { clientX: 300, clientY: 200 });
            await pointer(getBox(container), 'pointerMove', { clientX: 210, clientY: 150 });
            expect(boxStyle(container)).toEqual(before);
        });

        it('拖动遮罩会移动图片', async () => {
            const { container } = await renderLoaded();
            const mask = getMask(container);
            await pointer(mask, 'pointerDown', { clientX: 0, clientY: 0 });
            await pointer(mask, 'pointerMove', { clientX: 10, clientY: 20 });
            expect(imgStyle(container).transform).toBe('translate(10px, 70px) rotate(0deg)');
            await release(mask);
            await pointer(mask, 'pointerMove', { clientX: 50, clientY: 50 });
            expect(imgStyle(container).transform).toBe('translate(10px, 70px) rotate(0deg)');
        });

        it('每个拖拽区域捕获按下时的指针', async () => {
            const capture = vi.spyOn(Element.prototype, 'setPointerCapture');
            const { container } = await renderLoaded();
            for (const surface of [getBox(container), getCorner(container, 'br'), getMask(container)]) {
                await pointer(surface, 'pointerDown', { pointerId: 7, clientX: 200, clientY: 150 });
                expect(capture.mock.contexts.at(-1)).toBe(surface);
                expect(capture.mock.calls.at(-1)).toEqual([7]);
                await release(surface);
            }
            expect(capture).toHaveBeenCalledTimes(3);
        });
    });

    describe('根元素的属性', () => {
        it('data-*、aria-* 与原生监听落到根元素', async () => {
            const onclick = vi.fn<(event: MouseEvent) => void>();
            const onkeydown = vi.fn<(event: KeyboardEvent) => void>();
            const { container } = renderSvelte(Cropper, { props: { 'data-testid': 'cropper', 'aria-label': 'crop', onclick, onkeydown, src: 'a.png' } });
            const root = getRoot(container);
            expect(root).toHaveAttribute('data-testid', 'cropper');
            expect(root).toHaveAttribute('aria-label', 'crop');
            await fireEvent.click(root);
            await fireEvent.keyDown(root, { key: 'a' });
            expect(onclick).toHaveBeenCalledTimes(1);
            expect(onkeydown).toHaveBeenCalledTimes(1);
        });

        it('根元素有 aria-label 时带 role=group，使用方的 role 优先，无名称时没有 role', () => {
            const { container: named } = renderSvelte(Cropper, { props: { 'aria-label': 'crop', src: 'a.png' } });
            expect(getRoot(named)).toHaveAttribute('role', 'group');
            const { container: labelled } = renderSvelte(Cropper, { props: { 'aria-labelledby': 'x', src: 'a.png' } });
            expect(getRoot(labelled)).toHaveAttribute('role', 'group');
            const { container: own } = renderSvelte(Cropper, { props: { 'aria-label': 'crop', role: 'region', src: 'a.png' } });
            expect(getRoot(own)).toHaveAttribute('role', 'region');
            const { container: plain } = renderSvelte(Cropper, { props: { src: 'a.png' } });
            expect(getRoot(plain)).not.toHaveAttribute('role');
        });

        it('两个 Cropper 的 aria-describedby 指向各自唯一的说明元素', () => {
            const first = renderSvelte(Cropper, { props: { src: 'a.png' } });
            const second = renderSvelte(Cropper, { props: { src: 'a.png' } });
            const ids = [first, second].map(({ container }) => getBox(container).getAttribute('aria-describedby'));
            expect(new Set(ids).size).toBe(2);
            for (const id of ids) expect(document.querySelectorAll(`[id="${id}"]`)).toHaveLength(1);
        });
    });

    describe('容器尺寸', () => {
        it('跟随容器宽度变化', async () => {
            const observer = mockResizeObserverCore();
            const { container } = await renderLoaded();
            size.width = 800;
            size.height = 600;
            observer.fireLive((target) => ({ target }));
            flushSync();
            expect(imgStyle(container)).toEqual({ width: '800px', height: '400px', transform: 'translate(0px, 100px) rotate(0deg)' });
            expect(boxStyle(container)).toEqual({ width: '600px', height: '600px', transform: 'translate(100px, 0px)' });
        });

        it('图片加载前容器尺寸已变化，按加载时的尺寸布局', async () => {
            const observer = mockResizeObserverCore();
            const { container } = renderSvelte(Cropper, { props: { src: SRC } });
            size.width = 800;
            size.height = 600;
            observer.fireLive((target) => ({ target }));
            await loadImage(container);
            expect(imgStyle(container)).toEqual({ width: '800px', height: '400px', transform: 'translate(0px, 100px) rotate(0deg)' });
            expect(boxStyle(container)).toEqual({ width: '600px', height: '600px', transform: 'translate(100px, 0px)' });
        });

        it('挂载时容器宽高为 0，之后变大并重新适配，不出现 NaN', async () => {
            const observer = mockResizeObserverCore();
            size.width = 0;
            size.height = 0;
            const { container } = await renderLoaded();
            observer.fireLive((target) => ({ target }));
            size.width = 400;
            size.height = 300;
            observer.fireLive((target) => ({ target }));
            flushSync();
            expect(imgStyle(container)).toEqual({ width: '400px', height: '200px', transform: 'translate(0px, 50px) rotate(0deg)' });
            expect(boxStyle(container)).toEqual({ width: '300px', height: '300px', transform: 'translate(50px, 0px)' });
        });

        it('卸载时断开 ResizeObserver', async () => {
            mockResizeObserverCore();
            const disconnect = vi.spyOn(ResizeObserver.prototype, 'disconnect');
            const view = await renderLoaded();
            expect(disconnect).not.toHaveBeenCalled();
            view.unmount();
            expect(disconnect).toHaveBeenCalled();
        });
    });

    describe('getCropperCanvas', () => {
        const stubCanvas = () => {
            const getImageData = vi.fn<() => ImageData>(() => ({}) as ImageData);
            vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
                () =>
                    new Proxy({ getImageData } as Record<PropertyKey, unknown>, {
                        get: (target, k) => target[k] ?? (() => {}),
                        set: () => true,
                    }) as unknown as CanvasRenderingContext2D
            );
            return getImageData;
        };

        it('图片未加载时抛出带说明的错误', () => {
            stubCanvas();
            const { component } = renderSvelte(Cropper, { props: { src: 'a.png' } });
            expect(() => component.getCropperCanvas()).toThrow('[Semi] Cropper: getCropperCanvas called before the image loaded');
        });

        it('把 mr 边拖到 ml 边上时，裁剪框保持最小宽度，仍可取得画布', async () => {
            const getImageData = stubCanvas();
            const { container, component } = await renderLoaded();
            const edge = getCorner(container, 'mr');
            await pointer(edge, 'pointerDown', { clientX: 350, clientY: 150 });
            await pointer(edge, 'pointerMove', { clientX: 50, clientY: 150 });
            await release(edge);
            expect(boxStyle(container)).toEqual({ width: '10px', height: '300px', transform: 'translate(50px, 0px)' });
            expect(component.getCropperCanvas().width).toBe(20);
            expect(getImageData).toHaveBeenCalled();
        });

        it('按图片分辨率返回裁剪区域', async () => {
            // jsdom has no canvas implementation; the drawing calls are irrelevant here, only the canvas size is asserted
            stubCanvas();
            const { component } = await renderLoaded();
            const canvas = component.getCropperCanvas();
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(canvas.width).toBe(600);
            expect(canvas.height).toBe(600);
        });
    });

    describe('preview', () => {
        // the node's size follows its inline style, as a real layout does
        const createPreviewNode = (style = '') => {
            const node = document.createElement('div');
            node.style.cssText = style;
            node.getBoundingClientRect = () => ({ width: parseFloat(node.style.width) || 400, height: parseFloat(node.style.height) || 300 }) as DOMRect;
            document.body.append(node);
            return node;
        };

        it('将裁剪区域镜像到指定节点，卸载时移除', async () => {
            const node = createPreviewNode();
            const view = await renderLoaded({ preview: () => node });
            const previewImg = query(node, 'img');
            expect(previewImg).toHaveAttribute('src', SRC);
            expect(previewImg).toHaveAttribute('alt', '');
            expect(node.style.overflow).toBe('hidden');
            expect(node.style.width).toBe('300px');
            expect(node.style.height).toBe('300px');
            expect(previewImg.style.width).toBe('400px');
            expect(previewImg.style.transform).toBe('translate(-50px, 50px) rotate(0deg)');
            view.unmount();
            expect(node.querySelector('img')).toBeNull();
            node.remove();
        });

        it('预览节点为 null 时不镜像', async () => {
            const { container } = await renderLoaded({ preview: () => null });
            expect(getImg(container)).toBeInTheDocument();
        });

        it('卸载时还原节点原有的 overflow、width 与 height', async () => {
            const node = createPreviewNode('overflow: auto; width: 400px; height: 300px;');
            const view = await renderLoaded({ preview: () => node });
            expect(node.style.overflow).toBe('hidden');
            expect(node.style.width).toBe('300px');
            view.unmount();
            expect(node.style.overflow).toBe('auto');
            expect(node.style.width).toBe('400px');
            expect(node.style.height).toBe('300px');
            node.remove();
        });
    });

    describe('键盘操作', () => {
        it('裁剪框是可聚焦、有名称的 group，并描述其按键', async () => {
            const { container } = await renderLoaded();
            const box = getBox(container);
            expect(box).toHaveAttribute('role', 'group');
            expect(box).toHaveAttribute('tabindex', '0');
            expect(box).toHaveAttribute('aria-label', '裁剪区域');
            expect(box).toHaveAttribute('aria-roledescription', '裁剪框');
            const description = document.getElementById(box.getAttribute('aria-describedby') ?? '');
            expect(description).toHaveTextContent('方向键移动裁剪框，Shift 加方向键调整大小');
        });

        it('图片加载前不可聚焦', () => {
            const { container } = renderSvelte(Cropper, { props: { src: SRC } });
            expect(getBox(container)).not.toHaveAttribute('tabindex');
        });

        it('方向键每次移动裁剪框 10px，并在容器边缘停止', async () => {
            const { container } = await renderLoaded();
            key(container, 'ArrowRight');
            expect(boxStyle(container).transform).toBe('translate(60px, 0px)');
            key(container, 'ArrowDown');
            expect(boxStyle(container).transform).toBe('translate(60px, 0px)');
            for (let i = 0; i < 20; i++) key(container, 'ArrowRight');
            expect(boxStyle(container).transform).toBe('translate(100px, 0px)');
            for (let i = 0; i < 20; i++) key(container, 'ArrowLeft');
            expect(boxStyle(container).transform).toBe('translate(0px, 0px)');
        });

        it('Shift 加方向键从左上角缩放，且限制在容器内', async () => {
            const { container } = await renderLoaded();
            key(container, 'ArrowLeft', { shiftKey: true });
            expect(boxStyle(container)).toEqual({ width: '290px', height: '300px', transform: 'translate(50px, 0px)' });
            key(container, 'ArrowUp', { shiftKey: true });
            expect(boxStyle(container)).toEqual({ width: '290px', height: '290px', transform: 'translate(50px, 0px)' });
            for (let i = 0; i < 10; i++) key(container, 'ArrowRight', { shiftKey: true });
            expect(boxStyle(container).width).toBe('350px');
        });

        it('缩放时保持宽高比', async () => {
            const { container } = await renderLoaded({ aspectRatio: 2 });
            key(container, 'ArrowLeft', { shiftKey: true });
            expect(boxStyle(container)).toEqual({ width: '390px', height: '195px', transform: 'translate(0px, 50px)' });
            key(container, 'ArrowDown', { shiftKey: true });
            expect(boxStyle(container)).toEqual({ width: '400px', height: '200px', transform: 'translate(0px, 50px)' });
        });

        it('没有缩放手柄时不响应缩放', async () => {
            const { container } = await renderLoaded({ showResizeBox: false });
            key(container, 'ArrowLeft', { shiftKey: true });
            expect(boxStyle(container).width).toBe('300px');
            key(container, 'ArrowRight');
            expect(boxStyle(container).transform).toBe('translate(60px, 0px)');
        });

        it('Alt、Ctrl、Meta 加方向键不移动也不缩放裁剪框，并放行默认行为', async () => {
            const { container } = await renderLoaded();
            for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
                expect(key(container, 'ArrowRight', { [modifier]: true })).toBe(false);
                expect(key(container, 'ArrowLeft', { [modifier]: true, shiftKey: true })).toBe(false);
            }
            expect(boxStyle(container)).toEqual({ width: '300px', height: '300px', transform: 'translate(50px, 0px)' });
        });

        it('放行其他按键，并接管方向键', async () => {
            const { container } = await renderLoaded();
            expect(key(container, 'Tab')).toBe(false);
            expect(key(container, 'ArrowRight')).toBe(true);
        });
    });

    it('不渲染容器之外的任何内容：裁剪框外无其他兄弟根节点', async () => {
        const { container } = await renderLoaded();
        expect(container.children).toHaveLength(1);
    });
});
