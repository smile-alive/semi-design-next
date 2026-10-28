import { Activity, StrictMode, createRef } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { Cropper } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import { mockResizeObserver } from '@test/utils/react';
import type { CropperHandle, CropperProps } from '../index';

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
    return (width) => observer.fireLive((target) => ({ target, contentRect: { width, height: size.height } }));
}

const getRoot = (container) => container.querySelector('.semi-cropper');
const getImg = (container) => container.querySelector('.semi-cropper-img');
const getBox = (container) => container.querySelector('.semi-cropper-box');
const getViewBox = (container) => container.querySelector('.semi-cropper-view-box');
const getMask = (container) => container.querySelector('.semi-cropper-mask');
const getCorners = (container) => [...container.querySelectorAll('.semi-cropper-box-corner')].map((el) => el.dataset.dir);
const getCorner = (container, dir) => container.querySelector(`[data-dir="${dir}"]`);

// a browser sends a captured pointer's release, then lostpointercapture, to the element that was pressed
function release(el) {
    fireEvent.pointerUp(el);
    fireEvent.lostPointerCapture(el);
}

function loadImage(container, naturalWidth = 800, naturalHeight = 400) {
    const img = getImg(container);
    Object.defineProperty(img, 'naturalWidth', { value: naturalWidth, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: naturalHeight, configurable: true });
    fireEvent.load(img);
}

const imgStyle = (container) => {
    const { width, height, transform } = getImg(container).style;
    return { width, height, transform };
};
const boxStyle = (container) => {
    const { width, height, transform } = getBox(container).style;
    return { width, height, transform };
};

function renderLoaded(props = {}) {
    const result = render(<Cropper src="https://example.com/a.png" {...props} />);
    loadImage(result.container);
    return result;
}

describe('Cropper', () => {
    beforeEach(() => {
        size.width = 400;
        size.height = 300;
        mockLayout();
    });

    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('图片加载后适配容器，并绘制正方形裁剪框', () => {
        const { container } = render(<Cropper src="https://example.com/a.png" />);
        expect(getImg(container)).toHaveAttribute('src', 'https://example.com/a.png');
        expect(getImg(container)).toHaveAttribute('crossorigin', 'anonymous');
        expect(getCorners(container)).toEqual([]);
        loadImage(container);
        expect(imgStyle(container)).toEqual({
            width: '400px',
            height: '200px',
            transform: 'translate(0px, 50px) rotate(0deg)',
        });
        expect(boxStyle(container)).toEqual({ width: '300px', height: '300px', transform: 'translate(50px, 0px)' });
        expect(getCorners(container)).toEqual(['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br']);
        const viewImg = container.querySelector<HTMLElement>('.semi-cropper-view-img');
        expect(viewImg).toHaveAttribute('src', 'https://example.com/a.png');
        expect(viewImg.style.transform).toBe('translate(-50px, 50px) rotate(0deg)');
    });

    it('裁剪框尺寸依次由 aspectRatio、defaultAspectRatio 决定', () => {
        const { container: wide } = renderLoaded({ aspectRatio: 2 });
        expect(boxStyle(wide)).toEqual({ width: '400px', height: '200px', transform: 'translate(0px, 50px)' });
        const { container: tall } = renderLoaded({ defaultAspectRatio: 0.5 });
        expect(boxStyle(tall)).toEqual({ width: '150px', height: '300px', transform: 'translate(125px, 0px)' });
    });

    it('加载后改变 aspectRatio，裁剪框按新比例重排并保持在容器内', () => {
        const { container, rerender } = renderLoaded({ aspectRatio: 1 });
        expect(boxStyle(container)).toEqual({ width: '300px', height: '300px', transform: 'translate(50px, 0px)' });
        rerender(<Cropper aspectRatio={2} src="https://example.com/a.png" />);
        expect(boxStyle(container)).toEqual({ width: '400px', height: '200px', transform: 'translate(0px, 50px)' });
        rerender(<Cropper aspectRatio={0.5} src="https://example.com/a.png" />);
        expect(boxStyle(container)).toEqual({ width: '100px', height: '200px', transform: 'translate(150px, 50px)' });
    });

    it('className 与 style 应用到根元素', () => {
        const { container } = render(<Cropper className="custom" style={{ height: 300 }} src="a.png" />);
        expect(getRoot(container)).toHaveClass('semi-cropper', 'custom');
        expect(getRoot(container).style.height).toBe('300px');
    });

    it('imgProps 传给图片，同时保留裁剪所需的属性', () => {
        const onLoad = vi.fn<() => void>();
        const { container } = render(
            <Cropper
                imgProps={{
                    alt: 'avatar',
                    crossOrigin: 'use-credentials',
                    className: 'custom-img',
                    title: 'photo',
                    src: 'https://example.com/other.png',
                    style: { opacity: 0.5, width: '1px' },
                    onLoad,
                }}
                src="https://example.com/a.png"
            />
        );
        const img = getImg(container);
        expect(img).toHaveAttribute('alt', 'avatar');
        expect(img).toHaveAttribute('crossorigin', 'use-credentials');
        expect(img).toHaveAttribute('title', 'photo');
        expect(img).toHaveClass('semi-cropper-img', 'custom-img');
        expect(img).toHaveAttribute('src', 'https://example.com/a.png');
        expect(img.style.opacity).toBe('0.5');
        loadImage(container);
        expect(onLoad).toHaveBeenCalledTimes(1);
        expect(imgStyle(container).width).toBe('400px');
    });

    it('shape 决定圆形类名与显示的缩放手柄', () => {
        const { container: round } = renderLoaded({ shape: 'round' });
        expect(getBox(round)).toHaveClass('semi-cropper-view-box-round');
        expect(getViewBox(round)).toHaveClass('semi-cropper-view-box-round');
        expect(getCorners(round)).toEqual(['tm', 'ml', 'mr', 'bm']);

        const { container: roundRect } = renderLoaded({ shape: 'roundRect' });
        expect(getBox(roundRect)).not.toHaveClass('semi-cropper-view-box-round');
        expect(getViewBox(roundRect)).toHaveClass('semi-cropper-view-box-round');
        expect(getCorners(roundRect)).toHaveLength(8);

        const { container: rect } = renderLoaded({ shape: 'rect' });
        expect(getBox(rect)).not.toHaveClass('semi-cropper-view-box-round');
        expect(getViewBox(rect)).not.toHaveClass('semi-cropper-view-box-round');
    });

    it('showResizeBox={false} 隐藏缩放手柄', () => {
        const { container } = renderLoaded({ showResizeBox: false });
        expect(getCorners(container)).toEqual([]);
    });

    it('cropperBoxStyle 与 cropperBoxCls 应用到裁剪框，并以其计算尺寸为准', () => {
        const { container } = renderLoaded({
            cropperBoxCls: 'my-box',
            cropperBoxStyle: { outlineColor: 'red', width: 10 },
        });
        expect(getBox(container)).toHaveClass('semi-cropper-box', 'my-box');
        expect(getBox(container).style.outlineColor).toBe('red');
        expect(getBox(container).style.width).toBe('300px');
    });

    it('从 semiGlobal.config.overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Cropper: { shape: 'round', showResizeBox: false } };
        const { container } = renderLoaded();
        expect(getBox(container)).toHaveClass('semi-cropper-view-box-round');
        expect(getCorners(container)).toEqual([]);
    });

    describe('受控的 rotate 与 zoom', () => {
        it('图片加载后 rotate 绕裁剪框中心旋转图片', () => {
            const { container, rerender } = render(<Cropper rotate={90} src="a.png" zoom={1} />);
            loadImage(container);
            expect(imgStyle(container).transform).toBe('translate(0px, 50px) rotate(90deg)');

            const mask = getMask(container);
            fireEvent.pointerDown(mask, { clientX: 0, clientY: 0 });
            fireEvent.pointerMove(mask, { clientX: 100, clientY: 0 });
            release(mask);
            expect(imgStyle(container).transform).toBe('translate(100px, 50px) rotate(90deg)');

            rerender(<Cropper rotate={180} src="a.png" zoom={1} />);
            const { transform } = imgStyle(container);
            const [x, y] = transform.match(/-?[\d.e-]+(?=px)/g).map(Number);
            expect(x).toBeCloseTo(0);
            expect(y).toBeCloseTo(150);
            expect(transform).toMatch(/rotate\(180deg\)$/);
        });

        it('zoom 绕裁剪框中心缩放图片', () => {
            const { container, rerender } = render(<Cropper rotate={0} src="a.png" zoom={2} />);
            loadImage(container);
            expect(imgStyle(container)).toEqual({
                width: '800px',
                height: '400px',
                transform: 'translate(-200px, -50px) rotate(0deg)',
            });
            rerender(<Cropper rotate={0} src="a.png" zoom={1} />);
            expect(imgStyle(container)).toEqual({
                width: '400px',
                height: '200px',
                transform: 'translate(0px, 50px) rotate(0deg)',
            });
        });

        it('不使用 rotate 时 zoom 也生效', () => {
            const { container } = renderLoaded({ zoom: 2 });
            expect(imgStyle(container).width).toBe('800px');
        });

        it('只 rotate 不 zoom 时图片尺寸保持不变', () => {
            const { container } = renderLoaded({ rotate: 90 });
            expect(imgStyle(container)).toEqual({
                width: '400px',
                height: '200px',
                transform: 'translate(0px, 50px) rotate(90deg)',
            });
        });

        it('zoom 为 NaN 时不会无限重渲染', () => {
            const { container } = renderLoaded({ rotate: 0, zoom: NaN });
            expect(getImg(container)).toBeInTheDocument();
        });

        it('父组件不接受滚轮缩放时，受控 zoom 会撤销该缩放', () => {
            const onZoomChange = vi.fn<(zoom: number) => void>();
            const { container } = renderLoaded({ rotate: 0, zoom: 1, onZoomChange });
            fireEvent.wheel(getRoot(container), { deltaY: -1, clientX: 200, clientY: 150 });
            expect(onZoomChange).toHaveBeenCalledWith(1.1);
            expect(imgStyle(container).width).toBe('400px');
        });
    });

    describe('滚轮缩放', () => {
        it('以指针为中心缩放，回报缩放值，并阻止页面缩放', () => {
            const onZoomChange = vi.fn<(zoom: number) => void>();
            const { container } = renderLoaded({ onZoomChange });
            const notCanceled = fireEvent.wheel(getRoot(container), { deltaY: -1, clientX: 0, clientY: 0 });
            expect(notCanceled).toBe(false);
            expect(onZoomChange).toHaveBeenLastCalledWith(1.1);
            const { width, height, transform } = imgStyle(container);
            expect(parseFloat(width)).toBeCloseTo(440);
            expect(parseFloat(height)).toBeCloseTo(220);
            const [x, y] = transform.match(/-?[\d.e-]+(?=px)/g).map(Number);
            expect(x).toBeCloseTo(0);
            expect(y).toBeCloseTo(55);
            fireEvent.wheel(getRoot(container), { deltaY: 1, clientX: 0, clientY: 0 });
            expect(onZoomChange).toHaveBeenLastCalledWith(1);
            expect(imgStyle(container).width).toBe('400px');
        });

        it('缩放到 maxZoom 与 minZoom 时停止', () => {
            const onZoomChange = vi.fn<(zoom: number) => void>();
            const { container } = renderLoaded({ onZoomChange, zoomStep: 0.5, maxZoom: 2, minZoom: 0.5 });
            const wheel = (deltaY) => fireEvent.wheel(getRoot(container), { deltaY, clientX: 200, clientY: 150 });
            wheel(-1);
            wheel(-1);
            wheel(-1);
            expect(onZoomChange.mock.calls.map(([zoom]) => zoom)).toEqual([1.5, 2]);
            expect(imgStyle(container).width).toBe('800px');
            onZoomChange.mockClear();
            wheel(1);
            wheel(1);
            wheel(1);
            wheel(1);
            expect(onZoomChange.mock.calls.map(([zoom]) => zoom)).toEqual([1.5, 1, 0.5]);
            expect(imgStyle(container).width).toBe('200px');
        });

        it('最后一步不足一个 zoomStep 时，直接停在 maxZoom 与 minZoom', () => {
            const onZoomChange = vi.fn<(zoom: number) => void>();
            const { container } = renderLoaded({ onZoomChange, zoomStep: 0.5, maxZoom: 1.75, minZoom: 0.8 });
            const wheel = (deltaY) => fireEvent.wheel(getRoot(container), { deltaY, clientX: 200, clientY: 150 });
            wheel(-1);
            wheel(-1);
            wheel(-1);
            expect(onZoomChange.mock.calls.map(([zoom]) => zoom)).toEqual([1.5, 1.75]);
            onZoomChange.mockClear();
            wheel(1);
            wheel(1);
            wheel(1);
            expect(onZoomChange.mock.calls.map(([zoom]) => zoom)).toEqual([1.25, 0.8]);
        });

        it('根元素带边框时，缩放中心按容器内坐标计算', () => {
            vi.spyOn(Element.prototype, 'clientLeft', 'get').mockReturnValue(10);
            vi.spyOn(Element.prototype, 'clientTop', 'get').mockReturnValue(10);
            const { container } = renderLoaded();
            fireEvent.wheel(getRoot(container), { deltaY: -1, clientX: 10, clientY: 10 });
            const [x, y] = imgStyle(container)
                .transform.match(/-?[\d.e-]+(?=px)/g)
                .map(Number);
            expect(x).toBeCloseTo(0);
            expect(y).toBeCloseTo(55);
        });

        it('读取最新的 props', () => {
            const first = vi.fn<(zoom: number) => void>();
            const second = vi.fn<(zoom: number) => void>();
            const { container, rerender } = renderLoaded({ onZoomChange: first });
            rerender(<Cropper src="https://example.com/a.png" zoomStep={0.5} onZoomChange={second} />);
            fireEvent.wheel(getRoot(container), { deltaY: -1, clientX: 200, clientY: 150 });
            expect(first).not.toHaveBeenCalled();
            expect(second).toHaveBeenCalledWith(1.5);
        });
    });

    describe('拖拽', () => {
        it('裁剪框在容器内移动，直到松开', () => {
            const { container } = renderLoaded();
            const box = getBox(container);
            fireEvent.pointerDown(box, { clientX: 200, clientY: 150 });
            fireEvent.pointerMove(box, { clientX: 210, clientY: 150 });
            expect(boxStyle(container).transform).toBe('translate(60px, 0px)');
            fireEvent.pointerMove(box, { clientX: 500, clientY: 150 });
            expect(boxStyle(container).transform).toBe('translate(100px, 0px)');
            release(box);
            fireEvent.pointerMove(box, { clientX: 0, clientY: 150 });
            expect(boxStyle(container).transform).toBe('translate(100px, 0px)');
        });

        it('鼠标非主按钮按下不开始拖动', () => {
            const { container } = renderLoaded();
            const surfaces = [
                [getBox(container), 'transform', boxStyle],
                [getCorner(container, 'br'), 'width', boxStyle],
                [getMask(container), 'transform', imgStyle],
            ] as const;
            for (const [surface, key, read] of surfaces) {
                const before = read(container)[key];
                for (const button of [1, 2]) {
                    fireEvent.pointerDown(surface, { pointerType: 'mouse', button, clientX: 200, clientY: 150 });
                    fireEvent.pointerMove(surface, { pointerType: 'mouse', clientX: 150, clientY: 100 });
                    release(surface);
                }
                expect(read(container)[key]).toBe(before);
            }
            const box = getBox(container);
            fireEvent.pointerDown(box, { pointerType: 'mouse', button: 0, clientX: 200, clientY: 150 });
            fireEvent.pointerMove(box, { pointerType: 'mouse', clientX: 210, clientY: 150 });
            expect(boxStyle(container).transform).toBe('translate(60px, 0px)');
        });

        it('无 aspectRatio 时，缩放手柄可自由缩放裁剪框', () => {
            const { container } = renderLoaded();
            const corner = getCorner(container, 'br');
            fireEvent.pointerDown(corner, { clientX: 350, clientY: 300 });
            fireEvent.pointerMove(corner, { clientX: 300, clientY: 200 });
            expect(boxStyle(container)).toEqual({ width: '250px', height: '200px', transform: 'translate(50px, 0px)' });
            release(corner);
            fireEvent.pointerMove(corner, { clientX: 100, clientY: 100 });
            expect(boxStyle(container).width).toBe('250px');
        });

        it('缩放手柄保持 aspectRatio', () => {
            const { container } = renderLoaded({ aspectRatio: 1 });
            const corner = getCorner(container, 'br');
            fireEvent.pointerDown(corner, { clientX: 350, clientY: 300 });
            fireEvent.pointerMove(corner, { clientX: 0, clientY: 200 });
            expect(boxStyle(container)).toEqual({ width: '200px', height: '200px', transform: 'translate(50px, 0px)' });
            release(corner);
        });

        it('保持 aspectRatio 时角点拖过对边，框从对边继续长出', () => {
            const { container } = renderLoaded({ aspectRatio: 1 });
            const corner = getCorner(container, 'br');
            fireEvent.pointerDown(corner, { clientX: 350, clientY: 300 });
            fireEvent.pointerMove(corner, { clientX: 350, clientY: 100 });
            release(corner);
            const box = getBox(container);
            fireEvent.pointerDown(box, { clientX: 100, clientY: 50 });
            fireEvent.pointerMove(box, { clientX: 150, clientY: 100 });
            release(box);
            expect(boxStyle(container)).toEqual({
                width: '100px',
                height: '100px',
                transform: 'translate(100px, 50px)',
            });

            fireEvent.pointerDown(corner, { clientX: 200, clientY: 150 });
            fireEvent.pointerMove(corner, { clientX: 200, clientY: 50 });
            expect(boxStyle(container)).toEqual({ width: '10px', height: '10px', transform: 'translate(100px, 50px)' });
            fireEvent.pointerMove(corner, { clientX: 200, clientY: 40 });
            expect(boxStyle(container)).toEqual({ width: '20px', height: '20px', transform: 'translate(90px, 40px)' });
            release(corner);
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
        ])('无 aspectRatio 时 %s 手柄只移动自己的边', (dir, x, y, expected) => {
            const { container } = renderLoaded();
            const handle = getCorner(container, dir);
            fireEvent.pointerDown(handle, { clientX: 200, clientY: 150 });
            fireEvent.pointerMove(handle, { clientX: x, clientY: y });
            expect(boxStyle(container)).toEqual(expected);
            release(handle);
        });

        it('未按下时悬停缩放手柄或裁剪框不产生变化', () => {
            const { container } = renderLoaded();
            const before = boxStyle(container);
            fireEvent.pointerMove(getCorner(container, 'br'), { clientX: 300, clientY: 200 });
            fireEvent.pointerMove(getBox(container), { clientX: 210, clientY: 150 });
            expect(boxStyle(container)).toEqual(before);
        });

        it('拖动遮罩会移动图片', () => {
            const { container } = renderLoaded();
            const mask = getMask(container);
            fireEvent.pointerDown(mask, { clientX: 0, clientY: 0 });
            fireEvent.pointerMove(mask, { clientX: 10, clientY: 20 });
            expect(imgStyle(container).transform).toBe('translate(10px, 70px) rotate(0deg)');
            release(mask);
            fireEvent.pointerMove(mask, { clientX: 50, clientY: 50 });
            expect(imgStyle(container).transform).toBe('translate(10px, 70px) rotate(0deg)');
        });

        it('每个拖拽区域捕获按下时的指针', () => {
            const capture = vi.spyOn(Element.prototype, 'setPointerCapture');
            const { container } = renderLoaded();
            for (const surface of [getBox(container), getCorner(container, 'br'), getMask(container)]) {
                fireEvent.pointerDown(surface, { pointerId: 7, clientX: 200, clientY: 150 });
                expect(capture.mock.contexts.at(-1)).toBe(surface);
                expect(capture.mock.calls.at(-1)).toEqual([7]);
                release(surface);
            }
            expect(capture).toHaveBeenCalledTimes(3);
        });
    });

    it('裁剪框内的图片不能触发原生拖拽', () => {
        const { container } = renderLoaded();
        expect(container.querySelector('.semi-cropper-view-img')).toHaveAttribute('draggable', 'false');
    });

    it('根元素有 aria-label 或 aria-labelledby 时带 role=group，使用方的 role 优先，无名称时没有 role', () => {
        const { container: named } = render(<Cropper aria-label="crop" src="a.png" />);
        expect(getRoot(named)).toHaveAttribute('role', 'group');
        const { container: labelled } = render(<Cropper aria-labelledby="x" src="a.png" />);
        expect(getRoot(labelled)).toHaveAttribute('role', 'group');
        const { container: own } = render(<Cropper aria-label="crop" role="note" src="a.png" />);
        expect(getRoot(own)).toHaveAttribute('role', 'note');
        const { container: plain } = render(<Cropper src="a.png" />);
        expect(getRoot(plain)).not.toHaveAttribute('role');
    });

    it('data-* 等未知属性传到根元素', () => {
        const { container } = render(<Cropper data-testid="cropper" aria-label="crop" src="a.png" />);
        expect(getRoot(container)).toHaveAttribute('data-testid', 'cropper');
        expect(getRoot(container)).toHaveAttribute('aria-label', 'crop');
    });

    it('跟随容器宽度变化', () => {
        const resize = observeContainer();
        const { container } = renderLoaded();
        resize(400);
        size.width = 800;
        size.height = 600;
        resize(800);
        expect(imgStyle(container)).toEqual({
            width: '800px',
            height: '400px',
            transform: 'translate(0px, 100px) rotate(0deg)',
        });
        expect(boxStyle(container)).toEqual({ width: '600px', height: '600px', transform: 'translate(100px, 0px)' });
    });

    it('图片加载前容器尺寸已变化，按加载时的尺寸布局', () => {
        const resize = observeContainer();
        const { container } = render(<Cropper src="https://example.com/a.png" />);
        size.width = 800;
        size.height = 600;
        resize(800);
        loadImage(container);
        expect(imgStyle(container)).toEqual({
            width: '800px',
            height: '400px',
            transform: 'translate(0px, 100px) rotate(0deg)',
        });
        expect(boxStyle(container)).toEqual({ width: '600px', height: '600px', transform: 'translate(100px, 0px)' });
    });

    it('挂载时容器宽高为 0，之后变大并重新适配，不出现 NaN', () => {
        const resize = observeContainer();
        size.width = 0;
        size.height = 0;
        const { container } = renderLoaded();
        resize(0);
        size.width = 400;
        size.height = 300;
        resize(400);
        expect(imgStyle(container)).toEqual({
            width: '400px',
            height: '200px',
            transform: 'translate(0px, 50px) rotate(0deg)',
        });
        expect(boxStyle(container)).toEqual({ width: '300px', height: '300px', transform: 'translate(50px, 0px)' });
    });

    it('图片加载前的滚轮不改变缩放，加载后仍按适配尺寸显示', () => {
        const onZoomChange = vi.fn<(zoom: number) => void>();
        const { container } = render(<Cropper src="https://example.com/a.png" onZoomChange={onZoomChange} />);
        fireEvent.wheel(getRoot(container), { deltaY: -1, clientX: 200, clientY: 150 });
        expect(onZoomChange).not.toHaveBeenCalled();
        loadImage(container);
        expect(imgStyle(container).width).toBe('400px');
        fireEvent.wheel(getRoot(container), { deltaY: -1, clientX: 200, clientY: 150 });
        expect(onZoomChange).toHaveBeenCalledWith(1.1);
    });

    it('受控的 zoom 与 rotate 变回 undefined 时回到默认值', () => {
        const { container, rerender } = render(<Cropper rotate={90} src="a.png" zoom={2} />);
        loadImage(container);
        expect(imgStyle(container).width).toBe('800px');
        rerender(<Cropper src="a.png" />);
        expect(imgStyle(container)).toMatchObject({ width: '400px', height: '200px' });
        expect(imgStyle(container).transform).toMatch(/rotate\(0deg\)$/);
    });

    describe('getCropperCanvas 的边界', () => {
        const stubCanvas = () => {
            const getImageData = vi.fn<() => ImageData>(() => ({}) as ImageData);
            vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
                () =>
                    new Proxy(
                        { getImageData },
                        {
                            get: (target, key) => target[key] ?? (() => {}),
                            set: () => true,
                        }
                    ) as unknown as CanvasRenderingContext2D
            );
            return getImageData;
        };

        it('图片未加载时抛出带说明的错误', () => {
            stubCanvas();
            const ref = createRef<CropperHandle>();
            render(<Cropper ref={ref} src="a.png" />);
            expect(() => ref.current.getCropperCanvas()).toThrow('[Semi] Cropper: getCropperCanvas called before the image loaded');
        });

        it('把 mr 边拖到 ml 边上时，裁剪框保持最小宽度，仍可取得画布', () => {
            const getImageData = stubCanvas();
            const ref = createRef<CropperHandle>();
            const { container } = render(<Cropper ref={ref} src="a.png" />);
            loadImage(container);
            const edge = getCorner(container, 'mr');
            fireEvent.pointerDown(edge, { clientX: 350, clientY: 150 });
            fireEvent.pointerMove(edge, { clientX: 50, clientY: 150 });
            release(edge);
            expect(boxStyle(container)).toEqual({ width: '10px', height: '300px', transform: 'translate(50px, 0px)' });
            const canvas = ref.current.getCropperCanvas();
            expect(canvas.width).toBe(20);
            expect(getImageData).toHaveBeenCalled();
        });

        it('保持 aspectRatio 时把边拖到对边上，裁剪框保持最小尺寸，仍可取得画布', () => {
            stubCanvas();
            const ref = createRef<CropperHandle>();
            const { container } = render(<Cropper ref={ref} aspectRatio={1} src="a.png" />);
            loadImage(container);
            const edge = getCorner(container, 'mr');
            fireEvent.pointerDown(edge, { clientX: 350, clientY: 150 });
            fireEvent.pointerMove(edge, { clientX: 50, clientY: 150 });
            release(edge);
            expect(boxStyle(container)).toEqual({ width: '10px', height: '10px', transform: 'translate(50px, 145px)' });
            expect(() => ref.current.getCropperCanvas()).not.toThrow();
        });
    });

    it('getCropperCanvas 按图片分辨率返回裁剪区域', () => {
        // jsdom has no canvas implementation; only the canvas size is asserted
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
            () =>
                new Proxy(
                    {},
                    {
                        get: (target, key) => target[key] ?? (() => {}),
                        set: () => true,
                    }
                ) as unknown as CanvasRenderingContext2D
        );
        const ref = createRef<CropperHandle>();
        const { container } = render(<Cropper ref={ref} src="a.png" />);
        loadImage(container);
        const canvas = ref.current.getCropperCanvas();
        expect(canvas).toBeInstanceOf(HTMLCanvasElement);
        expect(canvas.width).toBe(600);
        expect(canvas.height).toBe(600);
    });

    it('preview 返回 null 时不镜像，也不报错', () => {
        expectTypeOf<NonNullable<CropperProps['preview']>>().returns.toEqualTypeOf<HTMLElement | null>();
        const { container } = renderLoaded({ preview: () => null });
        expect(boxStyle(container).width).toBe('300px');
    });

    it('preview 将裁剪区域镜像到指定节点，卸载时移除', () => {
        const node = document.createElement('div');
        document.body.appendChild(node);
        const { unmount } = renderLoaded({ preview: () => node });
        const previewImg = node.querySelector('img');
        expect(previewImg).toHaveAttribute('src', 'https://example.com/a.png');
        expect(previewImg).toHaveAttribute('alt', '');
        expect(node.style.overflow).toBe('hidden');
        expect(node.style.width).toBe('300px');
        expect(node.style.height).toBe('300px');
        expect(previewImg.style.width).toBe('400px');
        expect(previewImg.style.transform).toBe('translate(-50px, 50px) rotate(0deg)');
        unmount();
        expect(node.querySelector('img')).toBeNull();
        node.remove();
    });

    describe('preview 节点', () => {
        function createPreviewNode(style = '') {
            const node = document.createElement('div');
            node.style.cssText = style;
            node.getBoundingClientRect = () =>
                ({
                    width: parseFloat(node.style.width) || 400,
                    height: parseFloat(node.style.height) || 300,
                }) as DOMRect;
            document.body.appendChild(node);
            return node;
        }

        it('图片重新加载时只保留一个预览 img，并按节点原本的尺寸重新测量', () => {
            const node = createPreviewNode();
            const { container, rerender } = renderLoaded({ preview: () => node, defaultAspectRatio: 2 });
            expect(node.style.height).toBe('200px');

            rerender(<Cropper defaultAspectRatio={0.5} preview={() => node} src="https://example.com/a.png" />);
            loadImage(container);

            expect(node.querySelectorAll('img')).toHaveLength(1);
            expect(node.style.width).toBe('150px');
            expect(node.style.height).toBe('300px');
            node.remove();
        });

        it('卸载时还原节点原有的 overflow、width 与 height', () => {
            const node = createPreviewNode('overflow: auto; width: 400px; height: 300px;');
            const { unmount } = renderLoaded({ preview: () => node });
            expect(node.style.overflow).toBe('hidden');
            expect(node.style.width).toBe('300px');

            unmount();

            expect(node.style.overflow).toBe('auto');
            expect(node.style.width).toBe('400px');
            expect(node.style.height).toBe('300px');
            node.remove();
        });

        it('Activity 隐藏后再显示时重建预览', () => {
            const node = createPreviewNode();
            const ui = (mode: 'visible' | 'hidden') => (
                <Activity mode={mode}>
                    <Cropper preview={() => node} src="https://example.com/a.png" />
                </Activity>
            );
            const { container, rerender } = render(ui('visible'));
            loadImage(container);
            expect(node.querySelectorAll('img')).toHaveLength(1);

            rerender(ui('hidden'));
            expect(node.querySelector('img')).toBeNull();
            rerender(ui('visible'));

            expect(node.querySelectorAll('img')).toHaveLength(1);
            expect(node.querySelector('img').style.width).toBe('400px');
            expect(node.style.width).toBe('300px');
            node.remove();
        });
    });

    describe('键盘操作', () => {
        const key = (container, k, init = {}) => fireEvent.keyDown(getBox(container), { key: k, ...init });

        it('裁剪框是可聚焦、有名称的 group，并描述其按键', () => {
            const { container } = renderLoaded();
            const box = getBox(container);
            expect(box).toHaveAttribute('role', 'group');
            expect(box).toHaveAttribute('tabindex', '0');
            expect(box).toHaveAttribute('aria-label', '裁剪区域');
            expect(box).toHaveAttribute('aria-roledescription', '裁剪框');
            const description = container.ownerDocument.getElementById(box.getAttribute('aria-describedby'));
            expect(description).toHaveTextContent('方向键移动裁剪框，Shift 加方向键调整大小');
            expect(description).toBeInTheDocument();
        });

        it('图片加载前不可聚焦', () => {
            const { container } = render(<Cropper src="https://example.com/a.png" />);
            expect(getBox(container)).not.toHaveAttribute('tabindex');
        });

        it('方向键每次移动裁剪框 10px，并在容器边缘停止', () => {
            const { container } = renderLoaded();
            key(container, 'ArrowRight');
            expect(boxStyle(container).transform).toBe('translate(60px, 0px)');
            key(container, 'ArrowDown');
            expect(boxStyle(container).transform).toBe('translate(60px, 0px)');
            for (let i = 0; i < 20; i++) {
                key(container, 'ArrowRight');
            }
            expect(boxStyle(container).transform).toBe('translate(100px, 0px)');
            for (let i = 0; i < 20; i++) {
                key(container, 'ArrowLeft');
            }
            expect(boxStyle(container).transform).toBe('translate(0px, 0px)');
        });

        it('Shift 加方向键从左上角缩放，且限制在容器内', () => {
            const { container } = renderLoaded();
            key(container, 'ArrowLeft', { shiftKey: true });
            expect(boxStyle(container)).toEqual({ width: '290px', height: '300px', transform: 'translate(50px, 0px)' });
            key(container, 'ArrowUp', { shiftKey: true });
            expect(boxStyle(container)).toEqual({ width: '290px', height: '290px', transform: 'translate(50px, 0px)' });
            for (let i = 0; i < 10; i++) {
                key(container, 'ArrowRight', { shiftKey: true });
            }
            expect(boxStyle(container).width).toBe('350px');
        });

        it('缩放时保持宽高比', () => {
            const { container } = renderLoaded({ aspectRatio: 2 });
            expect(boxStyle(container)).toEqual({ width: '400px', height: '200px', transform: 'translate(0px, 50px)' });
            key(container, 'ArrowLeft', { shiftKey: true });
            expect(boxStyle(container)).toEqual({ width: '390px', height: '195px', transform: 'translate(0px, 50px)' });
            key(container, 'ArrowDown', { shiftKey: true });
            expect(boxStyle(container)).toEqual({ width: '400px', height: '200px', transform: 'translate(0px, 50px)' });
        });

        it('没有缩放手柄时不响应缩放', () => {
            const { container } = renderLoaded({ showResizeBox: false });
            key(container, 'ArrowLeft', { shiftKey: true });
            expect(boxStyle(container).width).toBe('300px');
            key(container, 'ArrowRight');
            expect(boxStyle(container).transform).toBe('translate(60px, 0px)');
        });

        it('Alt、Ctrl、Meta 加方向键不移动也不缩放裁剪框，并放行默认行为', () => {
            const { container } = renderLoaded();
            for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
                expect(key(container, 'ArrowRight', { [modifier]: true })).toBe(true);
                expect(key(container, 'ArrowLeft', { [modifier]: true, shiftKey: true })).toBe(true);
            }
            expect(boxStyle(container)).toEqual({ width: '300px', height: '300px', transform: 'translate(50px, 0px)' });
        });

        it('放行其他按键，并接管方向键', () => {
            const { container } = renderLoaded();
            expect(key(container, 'Tab')).toBe(true);
            expect(key(container, 'ArrowRight')).toBe(false);
        });
    });

    it('StrictMode 下不会重复添加监听', () => {
        const onZoomChange = vi.fn<(zoom: number) => void>();
        const { container } = render(
            <StrictMode>
                <Cropper src="a.png" onZoomChange={onZoomChange} />
            </StrictMode>
        );
        loadImage(container);
        expect(boxStyle(container).width).toBe('300px');
        fireEvent.wheel(getRoot(container), { deltaY: -1, clientX: 200, clientY: 150 });
        expect(onZoomChange.mock.calls).toEqual([[1.1]]);
        const box = getBox(container);
        fireEvent.pointerDown(box, { clientX: 200, clientY: 150 });
        fireEvent.pointerMove(box, { clientX: 210, clientY: 150 });
        expect(boxStyle(container).transform).toBe('translate(60px, 0px)');
        release(box);
    });
});
