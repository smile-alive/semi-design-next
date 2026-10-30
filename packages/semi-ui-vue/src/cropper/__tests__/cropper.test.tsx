/** @jsxImportSource vue */
import { createSSRApp, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { fireEvent, screen } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { mockResizeObserver, render } from '@test/utils/vue';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import Cropper from '../cropper.vue';
import type { CropperHandle, CropperProps } from '../interface';
import CachedCropper from './fixtures/cached-cropper.vue';
import HandleHost from './fixtures/handle-host.vue';
import ZoomModel from './fixtures/zoom-model.vue';
import ZoomOneWay from './fixtures/zoom-one-way.vue';

const SRC = 'https://example.com/a.png';
const size = { width: 400, height: 300 };

// jsdom has no layout: every element reports the container size, and the image its natural size once loaded
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

function observeContainer() {
    const observer = mockResizeObserver();
    return (width: number) => observer.fireLive((target) => ({ target, contentRect: { width, height: size.height } }));
}

function globalWith(overrideDefaultProps: SemiGlobal['config']['overrideDefaultProps']) {
    const semi = new SemiGlobal();
    semi.config.overrideDefaultProps = overrideDefaultProps;
    return { provide: { [semiGlobalKey]: semi } };
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
}

// an 800 x 400 image fits the 400 x 300 container at scale 0.5: 400 x 200, centered
async function loadImage(container: Element, naturalWidth = 800, naturalHeight = 400) {
    const img = getImg(container);
    Object.defineProperty(img, 'naturalWidth', { value: naturalWidth, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: naturalHeight, configurable: true });
    await fireEvent.load(img);
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

// VTL's fireEvent does not report whether the default was prevented, so these dispatch the event themselves
async function dispatch(target: Element, event: Event) {
    target.dispatchEvent(event);
    await nextTick();
    return event.defaultPrevented;
}
const wheel = (container: Element, init: WheelEventInit) => dispatch(getRoot(container), new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init }));
const key = (container: Element, k: string, init: KeyboardEventInit = {}) => dispatch(getBox(container), new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));

async function renderLoaded(props: CropperProps = {}, options: { global?: ReturnType<typeof globalWith> } = {}) {
    const view = render(Cropper, { props: { src: SRC, ...props }, ...options });
    await loadImage(view.container);
    return view;
}

describe('Cropper', () => {
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
        const { container } = render(Cropper, { props: { src: SRC } });
        expect(getImg(container)).toHaveAttribute('src', SRC);
        expect(getImg(container)).toHaveAttribute('crossorigin', 'anonymous');
        expect(getCorners(container)).toEqual([]);
        await loadImage(container);
        expect(imgStyle(container)).toEqual({
            width: '400px',
            height: '200px',
            transform: 'translate(0px, 50px) rotate(0deg)',
        });
        expect(boxStyle(container)).toEqual({ width: '300px', height: '300px', transform: 'translate(50px, 0px)' });
        expect(getCorners(container)).toEqual(['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br']);
        const viewImg = query(container, '.semi-cropper-view-img');
        expect(viewImg).toHaveAttribute('src', SRC);
        expect(viewImg.style.transform).toBe('translate(-50px, 50px) rotate(0deg)');
    });

    it('裁剪框尺寸依次由 aspectRatio、defaultAspectRatio 决定', async () => {
        const { container: wide } = await renderLoaded({ aspectRatio: 2 });
        expect(boxStyle(wide)).toEqual({ width: '400px', height: '200px', transform: 'translate(0px, 50px)' });
        const { container: tall } = await renderLoaded({ defaultAspectRatio: 0.5 });
        expect(boxStyle(tall)).toEqual({ width: '150px', height: '300px', transform: 'translate(125px, 0px)' });
    });

    it('class 与 style 应用到根元素', () => {
        const { container } = render(Cropper, {
            attrs: { class: 'custom', style: { height: '300px' } },
            props: { src: 'a.png' },
        });
        expect(getRoot(container)).toHaveClass('semi-cropper', 'custom');
        expect(getRoot(container).style.height).toBe('300px');
    });

    it('imgProps 传给图片，同时保留裁剪所需的属性', async () => {
        const onLoad = vi.fn<(event: Event) => void>();
        const { container } = render(Cropper, {
            props: {
                imgProps: {
                    alt: 'avatar',
                    crossorigin: 'use-credentials',
                    class: 'custom-img',
                    title: 'photo',
                    src: 'https://example.com/other.png',
                    style: { opacity: 0.5, width: '1px' },
                    onLoad,
                },
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
        expect(onLoad).toHaveBeenCalledTimes(1);
        expect(imgStyle(container).width).toBe('400px');
    });

    it('imgProps 的 alt 与 crossorigin 覆盖默认值', () => {
        const { container } = render(Cropper, { props: { imgProps: { alt: 'photo', crossorigin: '' }, src: SRC } });
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
        const { container } = await renderLoaded({
            cropperBoxCls: 'my-box',
            cropperBoxStyle: { outlineColor: 'red', width: '10px' },
        });
        expect(getBox(container)).toHaveClass('semi-cropper-box', 'my-box');
        expect(getBox(container).style.outlineColor).toBe('red');
        expect(getBox(container).style.width).toBe('300px');
    });

    it('cropperBoxStyle 接受字符串与数组', async () => {
        const { container: text } = await renderLoaded({ cropperBoxStyle: 'outline-color: red' });
        expect(getBox(text).style.outlineColor).toBe('red');
        const { container: list } = await renderLoaded({ cropperBoxStyle: [{ outlineColor: 'blue' }] });
        expect(getBox(list).style.outlineColor).toBe('blue');
    });

    it('从 overrideDefaultProps 读取默认值', async () => {
        const { container } = await renderLoaded({}, { global: globalWith({ Cropper: { shape: 'round', showResizeBox: false } }) });
        expect(getBox(container)).toHaveClass('semi-cropper-view-box-round');
        expect(getCorners(container)).toEqual([]);
    });

    it('app 级配置与实例参数：实例参数优先', async () => {
        const global = globalWith({ Cropper: { shape: 'round', maxZoom: 1.5, zoomStep: 0.5 } });
        const { container } = await renderLoaded({ shape: 'rect' }, { global });
        expect(getBox(container)).not.toHaveClass('semi-cropper-view-box-round');
        await wheel(container, { deltaY: -1, clientX: 200, clientY: 150 });
        await wheel(container, { deltaY: -1, clientX: 200, clientY: 150 });
        expect(imgStyle(container).width).toBe('600px');
    });

    it('preview 的全局默认值经 readSemiDefault 回落', async () => {
        const node = document.createElement('div');
        document.body.append(node);
        await renderLoaded({}, { global: globalWith({ Cropper: { preview: () => node } }) });
        expect(node.querySelectorAll('img')).toHaveLength(1);
        node.remove();
    });

    it('props 运行时：showResizeBox 有 default 键，preview 的默认值为 undefined', () => {
        const declared = (Cropper as unknown as { props: Record<string, { type?: unknown; default?: unknown }> }).props;
        const missingDefault = Object.entries(declared)
            .filter(([, option]) => [option.type].flat().includes(Boolean) && !('default' in option))
            .map(([key]) => key);
        expect(missingDefault).toEqual([]);
        expect('default' in declared.preview).toBe(true);
        expect(declared.preview.default).toBeUndefined();
    });

    describe('受控的 rotate 与 zoom', () => {
        it('图片加载后 rotate 绕裁剪框中心旋转图片', async () => {
            const view = render(Cropper, { props: { rotate: 90, src: 'a.png', zoom: 1 } });
            const { container } = view;
            await loadImage(container);
            expect(imgStyle(container).transform).toBe('translate(0px, 50px) rotate(90deg)');

            const mask = getMask(container);
            await fireEvent.pointerDown(mask, { clientX: 0, clientY: 0 });
            await fireEvent.pointerMove(mask, { clientX: 100, clientY: 0 });
            await release(mask);
            expect(imgStyle(container).transform).toBe('translate(100px, 50px) rotate(90deg)');

            await view.rerender({ rotate: 180, src: 'a.png', zoom: 1 });
            const { transform } = imgStyle(container);
            const [x, y] = offsets(transform);
            expect(x).toBeCloseTo(0);
            expect(y).toBeCloseTo(150);
            expect(transform).toMatch(/rotate\(180deg\)$/);
        });

        it('zoom 绕裁剪框中心缩放图片', async () => {
            const view = render(Cropper, { props: { rotate: 0, src: 'a.png', zoom: 2 } });
            const { container } = view;
            await loadImage(container);
            expect(imgStyle(container)).toEqual({
                width: '800px',
                height: '400px',
                transform: 'translate(-200px, -50px) rotate(0deg)',
            });
            await view.rerender({ rotate: 0, src: 'a.png', zoom: 1 });
            expect(imgStyle(container)).toEqual({
                width: '400px',
                height: '200px',
                transform: 'translate(0px, 50px) rotate(0deg)',
            });
        });

        it('不使用 rotate 时 zoom 也生效', async () => {
            const { container } = await renderLoaded({ zoom: 2 });
            expect(imgStyle(container).width).toBe('800px');
        });

        it('只 rotate 不 zoom 时图片尺寸保持不变', async () => {
            const { container } = await renderLoaded({ rotate: 90 });
            expect(imgStyle(container)).toEqual({
                width: '400px',
                height: '200px',
                transform: 'translate(0px, 50px) rotate(90deg)',
            });
        });

        it('zoom 为 NaN 时不会无限重渲染', async () => {
            const { container } = await renderLoaded({ rotate: 0, zoom: NaN });
            expect(getImg(container)).toBeInTheDocument();
        });

        it('受控的 zoom 与 rotate 变回 undefined 时回到默认值', async () => {
            const view = render(Cropper, { props: { rotate: 90, src: 'a.png', zoom: 2 } });
            await loadImage(view.container);
            expect(imgStyle(view.container).width).toBe('800px');
            await view.rerender({ rotate: undefined, zoom: undefined });
            expect(imgStyle(view.container)).toMatchObject({ width: '400px', height: '200px' });
            expect(imgStyle(view.container).transform).toMatch(/rotate\(0deg\)$/);
        });
    });

    describe('zoom 的双向与单向绑定', () => {
        it('v-model:zoom：滚轮缩放后宿主的值变为 1.1，宿主改回 1 时图片回到 1', async () => {
            const { container } = render(ZoomModel);
            await loadImage(container);
            await wheel(container, { deltaY: -1, clientX: 200, clientY: 150 });
            expect(screen.getByTestId('zoom')).toHaveTextContent('1.1');
            expect(parseFloat(imgStyle(container).width)).toBeCloseTo(440);
            await fireEvent.click(screen.getByText('reset'));
            expect(screen.getByTestId('zoom')).toHaveTextContent('1');
            expect(imgStyle(container).width).toBe('400px');
        });

        it('单向绑定且宿主不接受：图片回到受控值，zoomChange 只发出一次，不自翻转', async () => {
            const { container } = render(ZoomOneWay, { props: { accept: false } });
            await loadImage(container);
            await wheel(container, { deltaY: -1, clientX: 200, clientY: 150 });
            expect(screen.getByTestId('changes')).toHaveTextContent(/^1\.1$/);
            expect(imgStyle(container).width).toBe('400px');
            await nextTick();
            expect(imgStyle(container).width).toBe('400px');
            expect(screen.getByTestId('changes')).toHaveTextContent(/^1\.1$/);
        });

        it('单向绑定且宿主接受：缩放生效', async () => {
            const { container } = render(ZoomOneWay, { props: { accept: true } });
            await loadImage(container);
            await wheel(container, { deltaY: -1, clientX: 200, clientY: 150 });
            expect(screen.getByTestId('zoom')).toHaveTextContent('1.1');
            expect(parseFloat(imgStyle(container).width)).toBeCloseTo(440);
        });

        it('显式 zoom 为 undefined 视为非受控，滚轮生效', async () => {
            const { container } = await renderLoaded({ zoom: undefined });
            await wheel(container, { deltaY: -1, clientX: 200, clientY: 150 });
            expect(parseFloat(imgStyle(container).width)).toBeCloseTo(440);
        });
    });

    describe('滚轮缩放', () => {
        it('以指针为中心缩放，同时发出 update:zoom 与 zoomChange，并阻止页面缩放', async () => {
            const view = await renderLoaded();
            const { container } = view;
            const prevented = await wheel(container, { deltaY: -1, clientX: 0, clientY: 0 });
            expect(prevented).toBe(true);
            expect(view.emitted('update:zoom')).toEqual([[1.1]]);
            expect(view.emitted('zoomChange')).toEqual([[1.1]]);
            const { width, height, transform } = imgStyle(container);
            expect(parseFloat(width)).toBeCloseTo(440);
            expect(parseFloat(height)).toBeCloseTo(220);
            const [x, y] = offsets(transform);
            expect(x).toBeCloseTo(0);
            expect(y).toBeCloseTo(55);
            await wheel(container, { deltaY: 1, clientX: 0, clientY: 0 });
            expect(view.emitted('zoomChange')?.at(-1)).toEqual([1]);
            expect(imgStyle(container).width).toBe('400px');
        });

        it('wheel 监听是非 passive 的，卸载后移除', async () => {
            const add = vi.spyOn(EventTarget.prototype, 'addEventListener');
            const view = await renderLoaded();
            const options = add.mock.calls
                .filter(([type]) => type === 'wheel')
                .map(([, , option]) => option as AddEventListenerOptions | undefined)
                .filter((option) => option?.passive === false);
            expect(options).toHaveLength(1);
            expect(options[0]?.signal?.aborted).toBe(false);
            view.unmount();
            expect(options[0]?.signal?.aborted).toBe(true);
        });

        it('缩放到 maxZoom 与 minZoom 时停止', async () => {
            const view = await renderLoaded({ zoomStep: 0.5, maxZoom: 2, minZoom: 0.5 });
            const { container } = view;
            const step = (deltaY: number) => wheel(container, { deltaY, clientX: 200, clientY: 150 });
            await step(-1);
            await step(-1);
            await step(-1);
            expect(view.emitted('zoomChange')).toEqual([[1.5], [2]]);
            expect(imgStyle(container).width).toBe('800px');
            for (let i = 0; i < 4; i++) await step(1);
            expect(view.emitted('zoomChange')?.slice(2)).toEqual([[1.5], [1], [0.5]]);
            expect(imgStyle(container).width).toBe('200px');
        });

        it('最后一步不足一个 zoomStep 时，直接停在 maxZoom 与 minZoom', async () => {
            const view = await renderLoaded({ zoomStep: 0.5, maxZoom: 1.75, minZoom: 0.8 });
            const { container } = view;
            const step = (deltaY: number) => wheel(container, { deltaY, clientX: 200, clientY: 150 });
            for (let i = 0; i < 3; i++) await step(-1);
            expect(view.emitted('zoomChange')).toEqual([[1.5], [1.75]]);
            for (let i = 0; i < 3; i++) await step(1);
            expect(view.emitted('zoomChange')?.slice(2)).toEqual([[1.25], [0.8]]);
        });

        it('根元素带边框时，缩放中心按容器内坐标计算', async () => {
            vi.spyOn(Element.prototype, 'clientLeft', 'get').mockReturnValue(10);
            vi.spyOn(Element.prototype, 'clientTop', 'get').mockReturnValue(10);
            const { container } = await renderLoaded();
            // the pointer sits on the container's top-left corner, which is (10, 10) in viewport coordinates
            await wheel(container, { deltaY: -1, clientX: 10, clientY: 10 });
            const [x, y] = offsets(imgStyle(container).transform);
            expect(x).toBeCloseTo(0);
            expect(y).toBeCloseTo(55);
        });

        it('读取最新的 props', async () => {
            const view = await renderLoaded();
            await view.rerender({ src: SRC, zoomStep: 0.5 });
            await wheel(view.container, { deltaY: -1, clientX: 200, clientY: 150 });
            expect(view.emitted('zoomChange')).toEqual([[1.5]]);
        });

        it('图片加载前的滚轮不改变缩放，加载后仍按适配尺寸显示', async () => {
            const view = render(Cropper, { props: { src: SRC } });
            const { container } = view;
            await wheel(container, { deltaY: -1, clientX: 200, clientY: 150 });
            expect(view.emitted('zoomChange')).toBeUndefined();
            await loadImage(container);
            expect(imgStyle(container).width).toBe('400px');
            await wheel(container, { deltaY: -1, clientX: 200, clientY: 150 });
            expect(view.emitted('zoomChange')).toEqual([[1.1]]);
        });
    });

    it('加载后改变 aspectRatio，裁剪框按新比例重排并保持在容器内', async () => {
        const view = await renderLoaded({ aspectRatio: 1 });
        const { container } = view;
        expect(boxStyle(container)).toEqual({ width: '300px', height: '300px', transform: 'translate(50px, 0px)' });
        await view.rerender({ src: SRC, aspectRatio: 2 });
        expect(boxStyle(container)).toEqual({ width: '400px', height: '200px', transform: 'translate(0px, 50px)' });
        await view.rerender({ src: SRC, aspectRatio: 0.5 });
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
                    await fireEvent.pointerDown(surface, { pointerType: 'mouse', button, clientX: 200, clientY: 150 });
                    await fireEvent.pointerMove(surface, { pointerType: 'mouse', clientX: 150, clientY: 100 });
                    await release(surface);
                }
                expect(read(container)[prop]).toBe(before);
            }
            const box = getBox(container);
            await fireEvent.pointerDown(box, { pointerType: 'mouse', button: 0, clientX: 200, clientY: 150 });
            await fireEvent.pointerMove(box, { pointerType: 'mouse', clientX: 210, clientY: 150 });
            expect(boxStyle(container).transform).toBe('translate(60px, 0px)');
        });

        it('裁剪框在容器内移动，直到松开', async () => {
            const { container } = await renderLoaded();
            const box = getBox(container);
            await fireEvent.pointerDown(box, { clientX: 200, clientY: 150 });
            await fireEvent.pointerMove(box, { clientX: 210, clientY: 150 });
            expect(boxStyle(container).transform).toBe('translate(60px, 0px)');
            await fireEvent.pointerMove(box, { clientX: 500, clientY: 150 });
            expect(boxStyle(container).transform).toBe('translate(100px, 0px)');
            await release(box);
            await fireEvent.pointerMove(box, { clientX: 0, clientY: 150 });
            expect(boxStyle(container).transform).toBe('translate(100px, 0px)');
        });

        it('无 aspectRatio 时，缩放手柄可自由缩放裁剪框', async () => {
            const { container } = await renderLoaded();
            const corner = getCorner(container, 'br');
            await fireEvent.pointerDown(corner, { clientX: 350, clientY: 300 });
            await fireEvent.pointerMove(corner, { clientX: 300, clientY: 200 });
            expect(boxStyle(container)).toEqual({ width: '250px', height: '200px', transform: 'translate(50px, 0px)' });
            await release(corner);
            await fireEvent.pointerMove(corner, { clientX: 100, clientY: 100 });
            expect(boxStyle(container).width).toBe('250px');
        });

        it('缩放手柄保持 aspectRatio', async () => {
            const { container } = await renderLoaded({ aspectRatio: 1 });
            const corner = getCorner(container, 'br');
            await fireEvent.pointerDown(corner, { clientX: 350, clientY: 300 });
            await fireEvent.pointerMove(corner, { clientX: 0, clientY: 200 });
            expect(boxStyle(container)).toEqual({ width: '200px', height: '200px', transform: 'translate(50px, 0px)' });
            await release(corner);
        });

        it('保持 aspectRatio 时角点拖过对边，框从对边继续长出', async () => {
            const { container } = await renderLoaded({ aspectRatio: 1 });
            const corner = getCorner(container, 'br');
            await fireEvent.pointerDown(corner, { clientX: 350, clientY: 300 });
            await fireEvent.pointerMove(corner, { clientX: 350, clientY: 100 });
            await release(corner);
            const box = getBox(container);
            await fireEvent.pointerDown(box, { clientX: 100, clientY: 50 });
            await fireEvent.pointerMove(box, { clientX: 150, clientY: 100 });
            await release(box);
            expect(boxStyle(container)).toEqual({
                width: '100px',
                height: '100px',
                transform: 'translate(100px, 50px)',
            });

            await fireEvent.pointerDown(corner, { clientX: 200, clientY: 150 });
            await fireEvent.pointerMove(corner, { clientX: 200, clientY: 50 });
            expect(boxStyle(container)).toEqual({ width: '10px', height: '10px', transform: 'translate(100px, 50px)' });
            await fireEvent.pointerMove(corner, { clientX: 200, clientY: 40 });
            expect(boxStyle(container)).toEqual({ width: '20px', height: '20px', transform: 'translate(90px, 40px)' });
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
            await fireEvent.pointerDown(handle, { clientX: 200, clientY: 150 });
            await fireEvent.pointerMove(handle, { clientX: x, clientY: y });
            expect(boxStyle(container)).toEqual(expected);
            await release(handle);
        });

        it('未按下时悬停缩放手柄或裁剪框不产生变化', async () => {
            const { container } = await renderLoaded();
            const before = boxStyle(container);
            await fireEvent.pointerMove(getCorner(container, 'br'), { clientX: 300, clientY: 200 });
            await fireEvent.pointerMove(getBox(container), { clientX: 210, clientY: 150 });
            expect(boxStyle(container)).toEqual(before);
        });

        it('拖动遮罩会移动图片', async () => {
            const { container } = await renderLoaded();
            const mask = getMask(container);
            await fireEvent.pointerDown(mask, { clientX: 0, clientY: 0 });
            await fireEvent.pointerMove(mask, { clientX: 10, clientY: 20 });
            expect(imgStyle(container).transform).toBe('translate(10px, 70px) rotate(0deg)');
            await release(mask);
            await fireEvent.pointerMove(mask, { clientX: 50, clientY: 50 });
            expect(imgStyle(container).transform).toBe('translate(10px, 70px) rotate(0deg)');
        });

        it('每个拖拽区域捕获按下时的指针', async () => {
            const capture = vi.spyOn(Element.prototype, 'setPointerCapture');
            const { container } = await renderLoaded();
            for (const surface of [getBox(container), getCorner(container, 'br'), getMask(container)]) {
                await fireEvent.pointerDown(surface, { pointerId: 7, clientX: 200, clientY: 150 });
                expect(capture.mock.contexts.at(-1)).toBe(surface);
                expect(capture.mock.calls.at(-1)).toEqual([7]);
                await release(surface);
            }
            // the corner press bubbles to the box, which leaves it to the corner
            expect(capture).toHaveBeenCalledTimes(3);
        });
    });

    it('裁剪框内的图片不能触发原生拖拽', async () => {
        const { container } = await renderLoaded();
        expect(query(container, '.semi-cropper-view-img')).toHaveAttribute('draggable', 'false');
    });

    describe('根元素的属性', () => {
        it('data-*、aria-* 与原生监听落到根元素', async () => {
            const onClick = vi.fn<(event: MouseEvent) => void>();
            const onKeydown = vi.fn<(event: KeyboardEvent) => void>();
            const { container } = render(Cropper, {
                attrs: { 'data-testid': 'cropper', 'aria-label': 'crop', onClick, onKeydown },
                props: { src: 'a.png' },
            });
            const root = getRoot(container);
            expect(root).toHaveAttribute('data-testid', 'cropper');
            expect(root).toHaveAttribute('aria-label', 'crop');
            await fireEvent.click(root);
            await fireEvent.keyDown(root, { key: 'a' });
            expect(onClick).toHaveBeenCalledTimes(1);
            expect(onKeydown).toHaveBeenCalledTimes(1);
        });

        it('根元素有 aria-label 时带 role=group，使用方的 role 优先，无名称时没有 role', () => {
            const { container: named } = render(Cropper, { attrs: { 'aria-label': 'crop' }, props: { src: 'a.png' } });
            expect(getRoot(named)).toHaveAttribute('role', 'group');
            const { container: labelled } = render(Cropper, {
                attrs: { 'aria-labelledby': 'x' },
                props: { src: 'a.png' },
            });
            expect(getRoot(labelled)).toHaveAttribute('role', 'group');
            const { container: own } = render(Cropper, {
                attrs: { 'aria-label': 'crop', role: 'region' },
                props: { src: 'a.png' },
            });
            expect(getRoot(own)).toHaveAttribute('role', 'region');
            const { container: plain } = render(Cropper, { props: { src: 'a.png' } });
            expect(getRoot(plain)).not.toHaveAttribute('role');
        });

        it('两个 Cropper 的 aria-describedby 指向各自唯一的说明元素', () => {
            const first = render(Cropper, { props: { src: 'a.png' } });
            const second = render(Cropper, { props: { src: 'a.png' } });
            const ids = [first, second].map(({ container }) => getBox(container).getAttribute('aria-describedby'));
            expect(new Set(ids).size).toBe(2);
            for (const id of ids) expect(document.querySelectorAll(`[id="${id}"]`)).toHaveLength(1);
        });
    });

    describe('容器尺寸', () => {
        it('跟随容器宽度变化', async () => {
            const resize = observeContainer();
            const { container } = await renderLoaded();
            await resize(400);
            size.width = 800;
            size.height = 600;
            await resize(800);
            expect(imgStyle(container)).toEqual({
                width: '800px',
                height: '400px',
                transform: 'translate(0px, 100px) rotate(0deg)',
            });
            expect(boxStyle(container)).toEqual({
                width: '600px',
                height: '600px',
                transform: 'translate(100px, 0px)',
            });
        });

        it('图片加载前容器尺寸已变化，按加载时的尺寸布局', async () => {
            const resize = observeContainer();
            const { container } = render(Cropper, { props: { src: SRC } });
            size.width = 800;
            size.height = 600;
            await resize(800);
            await loadImage(container);
            expect(imgStyle(container)).toEqual({
                width: '800px',
                height: '400px',
                transform: 'translate(0px, 100px) rotate(0deg)',
            });
            expect(boxStyle(container)).toEqual({
                width: '600px',
                height: '600px',
                transform: 'translate(100px, 0px)',
            });
        });

        it('挂载时容器宽高为 0，之后变大并重新适配，不出现 NaN', async () => {
            const resize = observeContainer();
            size.width = 0;
            size.height = 0;
            const { container } = await renderLoaded();
            await resize(0);
            size.width = 400;
            size.height = 300;
            await resize(400);
            expect(imgStyle(container)).toEqual({
                width: '400px',
                height: '200px',
                transform: 'translate(0px, 50px) rotate(0deg)',
            });
            expect(boxStyle(container)).toEqual({ width: '300px', height: '300px', transform: 'translate(50px, 0px)' });
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
        const renderHandle = (cropperProps: CropperProps = {}) => {
            let handle: CropperHandle | undefined;
            const view = render(HandleHost, {
                props: {
                    cropperProps: { src: 'a.png', ...cropperProps },
                    onReady: (ready: CropperHandle) => (handle = ready),
                },
            });
            return {
                ...view,
                handle: () => {
                    if (!handle) throw new Error('handle not ready');
                    return handle;
                },
            };
        };

        it('图片未加载时抛出带说明的错误', () => {
            stubCanvas();
            const { handle } = renderHandle();
            expect(() => handle().getCropperCanvas()).toThrow('[Semi] Cropper: getCropperCanvas called before the image loaded');
        });

        it('把 mr 边拖到 ml 边上时，裁剪框保持最小宽度，仍可取得画布', async () => {
            const getImageData = stubCanvas();
            const { container, handle } = renderHandle();
            await loadImage(container);
            const edge = getCorner(container, 'mr');
            await fireEvent.pointerDown(edge, { clientX: 350, clientY: 150 });
            await fireEvent.pointerMove(edge, { clientX: 50, clientY: 150 });
            await release(edge);
            expect(boxStyle(container)).toEqual({ width: '10px', height: '300px', transform: 'translate(50px, 0px)' });
            const canvas = handle().getCropperCanvas();
            expect(canvas.width).toBe(20);
            expect(getImageData).toHaveBeenCalled();
        });

        it('保持 aspectRatio 时把边拖到对边上，裁剪框保持最小尺寸，仍可取得画布', async () => {
            stubCanvas();
            const { container, handle } = renderHandle({ aspectRatio: 1 });
            await loadImage(container);
            const edge = getCorner(container, 'mr');
            await fireEvent.pointerDown(edge, { clientX: 350, clientY: 150 });
            await fireEvent.pointerMove(edge, { clientX: 50, clientY: 150 });
            await release(edge);
            expect(boxStyle(container)).toEqual({ width: '10px', height: '10px', transform: 'translate(50px, 145px)' });
            expect(() => handle().getCropperCanvas()).not.toThrow();
        });

        it('按图片分辨率返回裁剪区域', async () => {
            // jsdom has no canvas implementation; the drawing calls are irrelevant here, only the canvas size is asserted
            stubCanvas();
            const { container, handle } = renderHandle();
            await loadImage(container);
            const canvas = handle().getCropperCanvas();
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
            node.getBoundingClientRect = () =>
                ({
                    width: parseFloat(node.style.width) || 400,
                    height: parseFloat(node.style.height) || 300,
                }) as DOMRect;
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

        it('图片重新加载时只保留一个预览 img，并按节点原本的尺寸重新测量', async () => {
            const node = createPreviewNode();
            const view = await renderLoaded({ preview: () => node, defaultAspectRatio: 2 });
            expect(node.style.height).toBe('200px');

            await view.rerender({ defaultAspectRatio: 0.5, preview: () => node, src: SRC });
            await loadImage(view.container);

            expect(node.querySelectorAll('img')).toHaveLength(1);
            // a 1:2 box is limited by height; measured against the node's own 400 x 300, not the 400 x 200 written before
            expect(node.style.width).toBe('150px');
            expect(node.style.height).toBe('300px');
            node.remove();
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

        it('KeepAlive 停用时撤回预览，重新激活后重建', async () => {
            const node = createPreviewNode();
            const preview = () => node;
            const view = render(CachedCropper, { props: { preview } });
            await loadImage(view.container);
            expect(node.querySelectorAll('img')).toHaveLength(1);

            await fireEvent.click(screen.getByText('toggle'));
            expect(node.querySelector('img')).toBeNull();
            expect(node.style.overflow).toBe('');

            await fireEvent.click(screen.getByText('toggle'));
            expect(node.querySelectorAll('img')).toHaveLength(1);
            expect(query(node, 'img').style.width).toBe('400px');
            expect(node.style.width).toBe('300px');
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
            expect(description).toBeInTheDocument();
        });

        it('图片加载前不可聚焦', () => {
            const { container } = render(Cropper, { props: { src: SRC } });
            expect(getBox(container)).not.toHaveAttribute('tabindex');
        });

        it('方向键每次移动裁剪框 10px，并在容器边缘停止', async () => {
            const { container } = await renderLoaded();
            await key(container, 'ArrowRight');
            expect(boxStyle(container).transform).toBe('translate(60px, 0px)');
            await key(container, 'ArrowDown');
            expect(boxStyle(container).transform).toBe('translate(60px, 0px)');
            for (let i = 0; i < 20; i++) await key(container, 'ArrowRight');
            expect(boxStyle(container).transform).toBe('translate(100px, 0px)');
            for (let i = 0; i < 20; i++) await key(container, 'ArrowLeft');
            expect(boxStyle(container).transform).toBe('translate(0px, 0px)');
        });

        it('Shift 加方向键从左上角缩放，且限制在容器内', async () => {
            const { container } = await renderLoaded();
            await key(container, 'ArrowLeft', { shiftKey: true });
            expect(boxStyle(container)).toEqual({ width: '290px', height: '300px', transform: 'translate(50px, 0px)' });
            await key(container, 'ArrowUp', { shiftKey: true });
            expect(boxStyle(container)).toEqual({ width: '290px', height: '290px', transform: 'translate(50px, 0px)' });
            for (let i = 0; i < 10; i++) await key(container, 'ArrowRight', { shiftKey: true });
            expect(boxStyle(container).width).toBe('350px');
        });

        it('缩放时保持宽高比', async () => {
            const { container } = await renderLoaded({ aspectRatio: 2 });
            expect(boxStyle(container)).toEqual({ width: '400px', height: '200px', transform: 'translate(0px, 50px)' });
            await key(container, 'ArrowLeft', { shiftKey: true });
            expect(boxStyle(container)).toEqual({ width: '390px', height: '195px', transform: 'translate(0px, 50px)' });
            await key(container, 'ArrowDown', { shiftKey: true });
            expect(boxStyle(container)).toEqual({ width: '400px', height: '200px', transform: 'translate(0px, 50px)' });
        });

        it('没有缩放手柄时不响应缩放', async () => {
            const { container } = await renderLoaded({ showResizeBox: false });
            await key(container, 'ArrowLeft', { shiftKey: true });
            expect(boxStyle(container).width).toBe('300px');
            await key(container, 'ArrowRight');
            expect(boxStyle(container).transform).toBe('translate(60px, 0px)');
        });

        it('Alt、Ctrl、Meta 加方向键不移动也不缩放裁剪框，并放行默认行为', async () => {
            const { container } = await renderLoaded();
            for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
                expect(await key(container, 'ArrowRight', { [modifier]: true })).toBe(false);
                expect(await key(container, 'ArrowLeft', { [modifier]: true, shiftKey: true })).toBe(false);
            }
            expect(boxStyle(container)).toEqual({ width: '300px', height: '300px', transform: 'translate(50px, 0px)' });
        });

        it('放行其他按键，并接管方向键', async () => {
            const { container } = await renderLoaded();
            expect(await key(container, 'Tab')).toBe(false);
            expect(await key(container, 'ArrowRight')).toBe(true);
        });
    });

    describe('卸载与服务端渲染', () => {
        it('卸载时断开 ResizeObserver', async () => {
            mockResizeObserver();
            const disconnect = vi.spyOn(ResizeObserver.prototype, 'disconnect');
            const view = await renderLoaded();
            expect(disconnect).not.toHaveBeenCalled();
            view.unmount();
            expect(disconnect).toHaveBeenCalled();
        });

        it('renderToString 输出图片与裁剪框，首帧裁剪框不可聚焦', async () => {
            const html = await renderToString(createSSRApp({ render: () => <Cropper src={SRC} /> }));
            const host = document.createElement('div');
            host.innerHTML = html;
            expect(host.querySelector('.semi-cropper-img')).toHaveAttribute('src', SRC);
            expect(host.querySelector('.semi-cropper-box')).not.toHaveAttribute('tabindex');
        });
    });
});
