import { StrictMode, useState, type ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { Button, ConfigProvider, Image, ImagePreview } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { MenuProps } from '../interface';

const prefixCls = `${BASE_CLASS_PREFIX}-image`;
const previewCls = `${prefixCls}-preview`;
const srcList = ['https://example.com/1.jpg', 'https://example.com/2.jpg', 'https://example.com/3.jpg'];

function getImagePreview(imageProps?) {
    const props = imageProps ? imageProps : {};
    const srcList = ['https://example.com/abstract.jpg', 'https://example.com/sky.jpg', 'https://example.com/greenleaf.jpg', 'https://example.com/colorful.jpg'];
    return (
        <ImagePreview {...props}>
            {srcList.map((src, index) => {
                return <Image key={index} style={{ marginRight: 5 }} alt={`lamp${index + 1}`} src={src} width={200} />;
            })}
        </ImagePreview>
    );
}

function Group(props) {
    return (
        <ImagePreview {...props}>
            {srcList.map((src) => (
                <Image key={src} src={src} />
            ))}
        </ImagePreview>
    );
}

const $ = (selector) => document.querySelector(selector);
const getPreview = () => document.querySelector(`div.${BASE_CLASS_PREFIX}-image-preview`);
const previewImg = () => $(`.${previewCls}-image-img`);
const pageInfo = () => $(`.${previewCls}-footer-page`)?.textContent;
const footerIcon = (name) => $(`.${previewCls}-footer .${BASE_CLASS_PREFIX}-icon-${name}`);
const thumbs = () => document.querySelectorAll(`.${prefixCls}-img`);
function clickMask(x = 10, y = 10) {
    fireEvent.mouseDown(getPreview(), { clientX: x, clientY: y });
    fireEvent.mouseUp(getPreview(), { clientX: x, clientY: y });
}
// a real key press starts at the focused element and bubbles through the document
const pressEsc = () => fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });

// jsdom has no layout: give the preview container and the preview image the sizes the zoom math reads
function mockLayout({ container = [1000, 800], natural = [2000, 1000] } = {}) {
    const sized = (el) => el.classList?.contains(`${previewCls}-image`);
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        configurable: true,
        get() {
            return sized(this) ? container[0] : 0;
        },
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
        configurable: true,
        get() {
            return sized(this) ? container[1] : 0;
        },
    });
    const naturalWidth = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'naturalWidth');
    const naturalHeight = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'naturalHeight');
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', { configurable: true, get: () => natural[0] });
    Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', { configurable: true, get: () => natural[1] });
    return () => {
        // remove the own property defined above so the inherited jsdom getter is visible again
        delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth;
        delete (HTMLElement.prototype as { clientHeight?: number }).clientHeight;
        Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', naturalWidth);
        Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', naturalHeight);
    };
}

// records the preloads the foundation starts with `new Image()`
function stubPreloadImage() {
    const created = [];
    vi.stubGlobal(
        'Image',
        class {
            #src: string;
            requested: string[];
            constructor() {
                created.push(this);
                this.requested = [];
            }
            set src(value) {
                this.requested.push(value);
                this.#src = value;
            }
            get src() {
                return this.#src;
            }
        }
    );
    return created;
}

// observers that still watch an element; the stub never fires on its own
function stubIntersectionObserver() {
    const observers = [];
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            callback: (entries: unknown[]) => void;
            elements = new Set<Element>();
            constructor(callback) {
                // the platform passes the observer as the second argument
                this.callback = (entries) => callback(entries, this);
                observers.push(this);
            }
            observe(el) {
                this.elements.add(el);
            }
            unobserve(el) {
                this.elements.delete(el);
            }
            disconnect() {
                this.elements.clear();
            }
        }
    );
    return {
        watching: (el: Element) => observers.find((o) => o.elements.has(el)),
    };
}

let restoreLayout = null;
afterEach(() => {
    restoreLayout?.();
    restoreLayout = null;
    vi.useRealTimers();
    semiGlobal.config.overrideDefaultProps = {};
    document.body.style.overflow = '';
    document.body.style.paddingInlineEnd = '';
});

describe('ImagePreview', () => {
    it('visible', function () {
        const { rerender } = render(getImagePreview());
        expect(getPreview()).toBeNull();

        rerender(getImagePreview({ visible: true }));
        expect(getPreview()).not.toBeNull();
        expect(document.body.style.overflow).toEqual('hidden');

        rerender(getImagePreview({ visible: false }));
        expect(document.body.style.overflow).not.toEqual('hidden');
        expect(getPreview()).toBeNull();
    });

    it('分组结构：className 与 style 在分组上，previewCls、previewStyle 与 zIndex 在预览上', () => {
        const { container } = render(<Group className="g" previewStyle={{ color: 'blue' }} style={{ color: 'red' }} previewCls="p" zIndex={2000} />);
        const group = container.firstElementChild;
        expect(group).toHaveClass(`${previewCls}-group`, 'g');
        expect(group).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        fireEvent.click(thumbs()[0]);
        expect(getPreview()).toHaveClass('p');
        expect(getPreview()).toHaveStyle({ color: 'rgb(0, 0, 255)' });
        expect(getPreview().parentElement.style.zIndex).toBe('2000');
    });

    it('分组带 aria-label 或 aria-labelledby 时为 group 角色，没有名称时没有角色，使用方的 role 优先', () => {
        const named = render(<Group aria-label="gallery" />);
        expect(screen.getByRole('group', { name: 'gallery' })).toBe(named.container.firstElementChild);
        named.unmount();
        const unnamed = render(<Group />);
        expect(unnamed.container.firstElementChild).not.toHaveAttribute('role');
        unnamed.unmount();
        const toolbar = render(<Group aria-labelledby="heading" role="toolbar" />);
        expect(toolbar.container.firstElementChild).toHaveAttribute('role', 'toolbar');
    });

    it('非受控：点击分组中的图片在对应索引处打开，点击遮罩关闭', () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const onChange = vi.fn<(index: number) => void>();
        render(<Group onChange={onChange} onVisibleChange={onVisibleChange} />);
        fireEvent.click(thumbs()[1]);
        expect(onChange).toHaveBeenCalledWith(1);
        expect(onVisibleChange).toHaveBeenCalledWith(true);
        expect(pageInfo()).toBe('2/3');
        expect(previewImg()).toHaveAttribute('src', srcList[1]);

        clickMask();
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
        expect(getPreview()).toBeNull();
    });

    it('未设置 preview 的图片参与分组，preview={false} 的图片不参与', () => {
        render(
            <ImagePreview>
                <Image src={srcList[0]} />
                <Image preview={false} src={srcList[1]} />
                <div>
                    <Image preview={{ src: 'https://example.com/big.jpg' }} src={srcList[2]} />
                </div>
            </ImagePreview>
        );
        fireEvent.click(thumbs()[2]);
        expect(pageInfo()).toBe('2/2');
        expect(previewImg()).toHaveAttribute('src', 'https://example.com/big.jpg');
        clickMask();
        fireEvent.click(thumbs()[1]);
        expect(getPreview()).toBeNull();
    });

    it('预览图使用所展示缩略图的 alt，没有 alt 时为空', () => {
        render(
            <ImagePreview>
                <Image alt="first lamp" src={srcList[0]} />
                <Image src={srcList[1]} />
            </ImagePreview>
        );
        fireEvent.click(thumbs()[0]);
        expect(previewImg()).toHaveAttribute('alt', 'first lamp');
        fireEvent.click($(`.${previewCls}-next`));
        expect(previewImg()).toHaveAttribute('alt', '');
    });

    it('不带 children 的 src 列表；字符串 src', () => {
        const { rerender } = render(<ImagePreview src={srcList} visible />);
        expect(pageInfo()).toBe('1/3');
        rerender(<ImagePreview src={srcList[2]} visible />);
        expect(pageInfo()).toBe('1/1');
        expect(previewImg()).toHaveAttribute('src', srcList[2]);
        expect($(`.${previewCls}-prev`)).toBeNull();
        expect($(`.${previewCls}-next`)).toBeNull();
    });

    it('受控 visible：关闭时只通知', () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const onClose = vi.fn<() => void>();
        render(<ImagePreview src={srcList} visible onClose={onClose} onVisibleChange={onVisibleChange} />);
        clickMask();
        expect(onVisibleChange).toHaveBeenCalledWith(false);
        expect(getPreview()).not.toBeNull();
        pressEsc();
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(getPreview()).not.toBeNull();
    });

    it('受控 currentIndex：切换时只通知，由父组件决定', () => {
        const onChange = vi.fn<(index: number) => void>();
        const { rerender } = render(<ImagePreview currentIndex={0} src={srcList} visible onChange={onChange} />);
        fireEvent.click($(`.${previewCls}-next`));
        expect(onChange).toHaveBeenCalledWith(1);
        expect(pageInfo()).toBe('1/3');
        rerender(<ImagePreview currentIndex={2} src={srcList} visible onChange={onChange} />);
        expect(pageInfo()).toBe('3/3');
        expect(previewImg()).toHaveAttribute('src', srcList[2]);
    });

    it('defaultCurrentIndex', () => {
        render(<ImagePreview defaultCurrentIndex={2} src={srcList} visible />);
        expect(pageInfo()).toBe('3/3');
    });

    it('上一张、下一张、底部箭头及其回调；除非 infinite，否则首尾隐藏箭头', () => {
        const onPrev = vi.fn<(index: number) => void>();
        const onNext = vi.fn<(index: number) => void>();
        const { rerender } = render(<Group onNext={onNext} onPrev={onPrev} />);
        fireEvent.click(thumbs()[0]);
        expect($(`.${previewCls}-prev`)).toBeNull();
        expect(footerIcon('chevron_left')).toHaveClass(`${previewCls}-footer-disabled`);

        fireEvent.click($(`.${previewCls}-next`));
        expect(onNext).toHaveBeenCalledWith(1);
        fireEvent.click(footerIcon('chevron_right'));
        expect(onNext).toHaveBeenLastCalledWith(2);
        expect(pageInfo()).toBe('3/3');
        expect($(`.${previewCls}-next`)).toBeNull();
        fireEvent.click(footerIcon('chevron_right'));
        expect(onNext).toHaveBeenCalledTimes(2);

        fireEvent.click(footerIcon('chevron_left'));
        expect(onPrev).toHaveBeenCalledWith(1);
        fireEvent.click($(`.${previewCls}-prev`));
        expect(onPrev).toHaveBeenLastCalledWith(0);
        expect(pageInfo()).toBe('1/3');

        rerender(<Group infinite onNext={onNext} onPrev={onPrev} />);
        fireEvent.click($(`.${previewCls}-prev`));
        expect(pageInfo()).toBe('3/3');
        fireEvent.click($(`.${previewCls}-next`));
        expect(pageInfo()).toBe('1/3');
    });

    it('非受控的 PreviewInner：带 src 列表的 Image 自行切换', () => {
        render(<Image preview={{ src: srcList, visible: true }} src={srcList[0]} />);
        fireEvent.load(thumbs()[0]);
        expect(pageInfo()).toBe('1/3');
        fireEvent.click($(`.${previewCls}-next`));
        expect(pageInfo()).toBe('2/3');
        expect(previewImg()).toHaveAttribute('src', srcList[1]);
    });

    it('Esc 关闭并调用 onClose；closeOnEsc={false} 时保持打开；其他按键无效果', () => {
        const onClose = vi.fn<() => void>();
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const { unmount } = render(<Group onClose={onClose} onVisibleChange={onVisibleChange} />);
        fireEvent.click(thumbs()[0]);
        fireEvent.keyDown(window, { key: 'Enter' });
        expect(pageInfo()).toBe('1/3');
        pressEsc();
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
        expect(getPreview()).toBeNull();
        unmount();

        render(<Group closeOnEsc={false} />);
        fireEvent.click(thumbs()[0]);
        pressEsc();
        expect(getPreview()).not.toBeNull();
    });

    it('遮罩：鼠标微小移动仍关闭，拖动或操作区域不关闭，maskClosable={false} 时永不关闭', () => {
        const { rerender } = render(<Group />);
        fireEvent.click(thumbs()[0]);
        fireEvent.mouseDown(getPreview(), { clientX: 0, clientY: 0 });
        fireEvent.mouseUp(getPreview(), { clientX: 20, clientY: 0 });
        expect(getPreview()).not.toBeNull();
        fireEvent.mouseDown(footerIcon('rotate'), { clientX: 0, clientY: 0 });
        fireEvent.mouseUp(footerIcon('rotate'), { clientX: 0, clientY: 0 });
        expect(getPreview()).not.toBeNull();
        fireEvent.mouseDown(getPreview(), { clientX: 0, clientY: 0 });
        fireEvent.mouseUp(getPreview(), { clientX: 4, clientY: 5 });
        expect(getPreview()).toBeNull();

        rerender(<Group maskClosable={false} />);
        fireEvent.click(thumbs()[0]);
        clickMask();
        expect(getPreview()).not.toBeNull();
    });

    it('header：关闭按钮、closable、renderCloseIcon、renderHeader 与分组图片的 previewTitle', () => {
        const onClose = vi.fn<() => void>();
        const renderGroup = (props) => (
            <ImagePreview {...props}>
                <Image preview={{ previewTitle: 'first' }} src={srcList[0]} />
                <Image src={srcList[1]} />
            </ImagePreview>
        );
        const { rerender } = render(renderGroup({ onClose }));
        fireEvent.click(thumbs()[0]);
        expect($(`.${previewCls}-header-title`).textContent).toBe('first');
        // the button's own mouseup does not close through the mask
        fireEvent.mouseDown($(`.${previewCls}-header-close`), { clientX: 0, clientY: 0 });
        fireEvent.mouseUp($(`.${previewCls}-header-close`), { clientX: 0, clientY: 0 });
        expect(getPreview()).not.toBeNull();
        fireEvent.click($(`.${previewCls}-header-close`));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(getPreview()).toBeNull();

        rerender(
            renderGroup({
                renderHeader: (title) => <b className="h">{`T:${title}`}</b>,
                renderCloseIcon: () => <i className="close-icon" />,
            })
        );
        fireEvent.click(thumbs()[0]);
        expect($(`.${previewCls}-header-title .h`).textContent).toBe('T:first');
        expect($(`.${previewCls}-header-close .close-icon`)).not.toBeNull();
        clickMask();

        rerender(renderGroup({ closable: false }));
        fireEvent.click(thumbs()[1]);
        expect($(`.${previewCls}-header-close`)).toBeNull();
    });

    it('renderLeftIcon、renderRightIcon 与 renderPreviewMenu', () => {
        const renderPreviewMenu = vi.fn<(menu: MenuProps) => ReactNode>((menu) => <div className="menu">{menu.menuItems}</div>);
        render(<ImagePreview defaultCurrentIndex={1} src={srcList} visible renderLeftIcon={(index) => <i className={`left-${index}`} />} renderPreviewMenu={renderPreviewMenu} renderRightIcon={<i className="right" />} />);
        expect($(`.${previewCls}-prev .left-1`)).not.toBeNull();
        expect($(`.${previewCls}-next .right`)).not.toBeNull();
        expect($(`.${previewCls}-footer .menu`)).not.toBeNull();
        expect($(`.${previewCls}-footer`)).not.toHaveClass(`${previewCls}-footer-content`);
        const menu = renderPreviewMenu.mock.lastCall[0];
        expect(menu).toMatchObject({ curPage: 2, totalNum: 3, min: 10, max: 500, step: 10, ratio: 'adaptation' });
        expect(menu.menuItems).toHaveLength(9);
        expect([menu.disabledZoomIn, menu.disabledZoomOut]).toEqual([false, true]);
        act(() => menu.onNext());
        expect(pageInfo()).toBe('3/3');
    });

    it('zoom：加载后自适应，底部按钮、滑块上下限与回调', () => {
        restoreLayout = mockLayout();
        const onZoomIn = vi.fn<(zoom: number) => void>();
        const onZoomOut = vi.fn<(zoom: number) => void>();
        render(<ImagePreview src={srcList} visible onZoomIn={onZoomIn} onZoomOut={onZoomOut} />);
        fireEvent.load(previewImg());
        // min((1000 - 80) / 2000, (800 - 80) / 1000) = 0.46, not reported
        expect(previewImg()).toHaveStyle({ width: '920px', height: '460px' });
        expect(onZoomIn).not.toHaveBeenCalled();
        expect(onZoomOut).not.toHaveBeenCalled();

        fireEvent.click(footerIcon('plus'));
        expect(onZoomIn).toHaveBeenLastCalledWith(0.56);
        expect(previewImg()).toHaveStyle({ width: '1120px', height: '560px' });
        fireEvent.click(footerIcon('minus'));
        expect(onZoomOut).toHaveBeenLastCalledWith(0.46);
        expect(previewImg()).toHaveStyle({ width: '920px' });
    });

    it('zoom 限制在 minZoom 与 maxZoom 之间；zoomStep', () => {
        restoreLayout = mockLayout({ natural: [100, 100] });
        const onZoomIn = vi.fn<(zoom: number) => void>();
        render(<ImagePreview maxZoom={1.5} src={srcList} visible zoomStep={0.5} onZoomIn={onZoomIn} />);
        fireEvent.load(previewImg());
        expect(previewImg()).toHaveStyle({ width: '150px' });
        expect(footerIcon('plus')).toHaveClass(`${previewCls}-footer-disabled`);
        fireEvent.click(footerIcon('minus'));
        expect(previewImg()).toHaveStyle({ width: '100px' });
        fireEvent.click(footerIcon('plus'));
        expect(onZoomIn).toHaveBeenLastCalledWith(1.5);
    });

    it('initialZoom 每张图片只生效一次', () => {
        restoreLayout = mockLayout();
        render(<ImagePreview initialZoom={0.2} src={srcList} visible />);
        fireEvent.load(previewImg());
        expect(previewImg()).toHaveStyle({ width: '400px' });
        fireEvent.click($(`.${previewCls}-next`));
        fireEvent.load(previewImg());
        expect(previewImg()).toHaveStyle({ width: '400px' });
    });

    it('滚轮以包裹层为中心缩放，并阻止页面缩放', () => {
        restoreLayout = mockLayout();
        const onZoomIn = vi.fn<(zoom: number) => void>();
        const onZoomOut = vi.fn<(zoom: number) => void>();
        render(<ImagePreview src={srcList} visible onZoomIn={onZoomIn} onZoomOut={onZoomOut} />);
        fireEvent.load(previewImg());
        expect(fireEvent.wheel(getPreview(), { deltaY: -10 })).toBe(false);
        expect(onZoomIn).toHaveBeenLastCalledWith(0.56);
        expect(previewImg()).toHaveStyle({ width: '1120px' });
        fireEvent.wheel(getPreview(), { deltaY: 10 });
        expect(onZoomOut).toHaveBeenLastCalledWith(0.46);
        expect(previewImg()).toHaveStyle({ width: '920px' });
    });

    it('滚轮缩放与按钮一样停在 maxZoom、minZoom 上，即使当前值不是步长的整数倍', () => {
        restoreLayout = mockLayout();
        const { rerender } = render(<ImagePreview maxZoom={0.5} src={srcList} visible />);
        fireEvent.load(previewImg());
        expect(previewImg()).toHaveStyle({ width: '920px' });
        fireEvent.wheel(getPreview(), { deltaY: -10 });
        expect(previewImg()).toHaveStyle({ width: '1000px' });

        rerender(<ImagePreview maxZoom={0.5} minZoom={0.42} src={srcList} visible />);
        fireEvent.wheel(getPreview(), { deltaY: 10 });
        fireEvent.wheel(getPreview(), { deltaY: 10 });
        expect(previewImg()).toHaveStyle({ width: '840px' });
    });

    it('在图片上滚动时以指针所在点为中心缩放', () => {
        restoreLayout = mockLayout();
        render(<ImagePreview src={srcList} visible />);
        fireEvent.load(previewImg());
        fireEvent.click(footerIcon('real_size_stroked'));
        // jsdom leaves offsetX and offsetY out of the event init
        const wheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -10 });
        Object.defineProperties(wheel, { offsetX: { value: 1500 }, offsetY: { value: 750 } });
        act(() => {
            previewImg().dispatchEvent(wheel);
        });
        // 2000x1000 -> 2200x1100; the point 500px right and 250px below the centre moves out by a tenth
        expect(previewImg()).toHaveStyle({ width: '2200px', height: '1100px' });
        const [x, y] = previewImg()
            .style.transform.match(/-?[\d.]+(?=px)/g)
            .map(Number);
        expect(x).toBeCloseTo(-50);
        expect(y).toBeCloseTo(-25);
    });

    it('ratio：切换到真实尺寸再切回，onRatioChange', () => {
        restoreLayout = mockLayout();
        const onRatioChange = vi.fn<(type: string) => void>();
        const onZoomIn = vi.fn<(zoom: number) => void>();
        render(<ImagePreview src={srcList} visible onRatioChange={onRatioChange} onZoomIn={onZoomIn} />);
        fireEvent.load(previewImg());
        fireEvent.click(footerIcon('real_size_stroked'));
        expect(onRatioChange).toHaveBeenCalledWith('realSize');
        expect(onZoomIn).toHaveBeenLastCalledWith(1);
        expect(previewImg()).toHaveStyle({ width: '2000px', height: '1000px' });
        fireEvent.click(footerIcon('window_adaption_stroked'));
        expect(onRatioChange).toHaveBeenLastCalledWith('adaptation');
        expect(previewImg()).toHaveStyle({ width: '920px' });
    });

    it('拖动可在边界内平移已缩放的图片', () => {
        restoreLayout = mockLayout();
        render(<ImagePreview src={srcList} visible />);
        fireEvent.load(previewImg());
        fireEvent.click(footerIcon('real_size_stroked'));
        // 2000x1000 in 1000x800: x may move 500 either way, y 100
        // jsdom has no pointer capture; the capture keeps a drag going when the pointer leaves the image
        const setPointerCapture = vi.fn<(pointerId: number) => void>();
        previewImg().setPointerCapture = setPointerCapture;
        fireEvent.pointerDown(previewImg(), { pointerId: 7, clientX: 100, clientY: 100 });
        expect(setPointerCapture).toHaveBeenCalledWith(7);
        fireEvent.pointerMove(previewImg(), { clientX: 150, clientY: 130, buttons: 1 });
        expect(previewImg().style.transform).toBe('translate(50px, 30px) rotate(0deg)');
        fireEvent.pointerMove(previewImg(), { clientX: 150, clientY: 330, buttons: 1 });
        expect(previewImg().style.transform).toBe('translate(50px, 100px) rotate(0deg)');
        fireEvent.pointerMove(previewImg(), { clientX: 400, clientY: 330, buttons: 0 });
        expect(previewImg().style.transform).toBe('translate(50px, 100px) rotate(0deg)');
    });

    it('只有可拖动的图片才禁用触屏手势', () => {
        restoreLayout = mockLayout();
        render(<ImagePreview src={srcList} visible />);
        fireEvent.load(previewImg());
        expect(previewImg().style.touchAction).toBe('');
        fireEvent.click(footerIcon('real_size_stroked'));
        expect(previewImg().style.touchAction).toBe('none');
        fireEvent.click(footerIcon('window_adaption_stroked'));
        expect(previewImg().style.touchAction).toBe('');
    });

    it('rotate：onRotateLeft，图片按旋转后的边界重新适配', () => {
        restoreLayout = mockLayout();
        const onRotateLeft = vi.fn<(angle: number) => void>();
        const onZoomOut = vi.fn<(zoom: number) => void>();
        render(<ImagePreview src={srcList} visible onRotateLeft={onRotateLeft} onZoomOut={onZoomOut} />);
        fireEvent.load(previewImg());
        fireEvent.click(footerIcon('rotate'));
        expect(onRotateLeft).toHaveBeenCalledWith(-90);
        expect(previewImg().style.transform).toContain('rotate(-90deg)');
        // rotated bounds 1000x2000: min(920 / 1000, 720 / 2000) = 0.36
        expect(onZoomOut).toHaveBeenLastCalledWith(0.36);
        expect(previewImg()).toHaveStyle({ width: '720px' });
        fireEvent.click(footerIcon('rotate'));
        expect(onRotateLeft).toHaveBeenLastCalledWith(-180);
    });

    it('切换或重新打开时重置旋转与 ratio，且不上报 zoom', () => {
        restoreLayout = mockLayout();
        const onZoomIn = vi.fn<(zoom: number) => void>();
        const onZoomOut = vi.fn<(zoom: number) => void>();
        render(<Group onZoomIn={onZoomIn} onZoomOut={onZoomOut} />);
        fireEvent.click(thumbs()[0]);
        fireEvent.load(previewImg());
        fireEvent.click(footerIcon('real_size_stroked'));
        fireEvent.click(footerIcon('rotate'));
        onZoomIn.mockClear();
        onZoomOut.mockClear();

        fireEvent.click($(`.${previewCls}-next`));
        expect(previewImg().style.transform).toContain('rotate(0deg)');
        expect(footerIcon('real_size_stroked')).not.toBeNull();
        fireEvent.load(previewImg());
        expect(onZoomIn).not.toHaveBeenCalled();
        expect(onZoomOut).not.toHaveBeenCalled();

        fireEvent.click(footerIcon('real_size_stroked'));
        fireEvent.click(footerIcon('rotate'));
        clickMask();
        onZoomIn.mockClear();
        onZoomOut.mockClear();
        fireEvent.click(thumbs()[2]);
        expect(previewImg().style.transform).toContain('rotate(0deg)');
        expect(footerIcon('real_size_stroked')).not.toBeNull();
        fireEvent.load(previewImg());
        expect(onZoomIn).not.toHaveBeenCalled();
        expect(onZoomOut).not.toHaveBeenCalled();
    });

    it('父组件修改受控 index 时重置 ratio', () => {
        restoreLayout = mockLayout();
        const onZoomIn = vi.fn<(zoom: number) => void>();
        const { rerender } = render(<ImagePreview currentIndex={0} src={srcList} visible onZoomIn={onZoomIn} />);
        fireEvent.load(previewImg());
        fireEvent.click(footerIcon('real_size_stroked'));
        onZoomIn.mockClear();
        rerender(<ImagePreview currentIndex={1} src={srcList} visible onZoomIn={onZoomIn} />);
        expect(footerIcon('real_size_stroked')).not.toBeNull();
        expect(onZoomIn).not.toHaveBeenCalled();
    });

    it('非受控的单图预览切换图片后 ratio 回到适应页面', () => {
        restoreLayout = mockLayout();
        render(<Image preview={{ src: srcList }} src={srcList[0]} />);
        fireEvent.load(thumbs()[0]);
        fireEvent.click(thumbs()[0]);
        fireEvent.load(previewImg());
        fireEvent.click(footerIcon('real_size_stroked'));
        expect(footerIcon('window_adaption_stroked')).not.toBeNull();
        fireEvent.click($(`.${previewCls}-next`));
        expect(pageInfo()).toBe('2/3');
        expect(footerIcon('real_size_stroked')).not.toBeNull();
    });

    it('download：onDownload、setDownloadName、onDownloadError', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn<() => Promise<{ ok: boolean }>>(() => Promise.resolve({ ok: false }))
        );
        const onDownload = vi.fn<(src: string, index: number) => void>();
        const onDownloadError = vi.fn<(src: string) => void>();
        const setDownloadName = vi.fn<(src: string) => string>(() => 'x.jpg');
        render(<ImagePreview defaultCurrentIndex={1} setDownloadName={setDownloadName} src={srcList} visible onDownload={onDownload} onDownloadError={onDownloadError} />);
        fireEvent.click(footerIcon('download'));
        expect(setDownloadName).toHaveBeenCalledWith(srcList[1]);
        expect(onDownload).toHaveBeenCalledWith(srcList[1], 1);
        expect(fetch).toHaveBeenCalledWith(srcList[1]);
        await act(() => Promise.resolve());
        expect(onDownloadError).toHaveBeenCalledWith(srcList[1]);
    });

    it('disableDownload 禁用下载按钮与图片的右键菜单', () => {
        const onDownload = vi.fn<(src: string, index: number) => void>();
        render(<ImagePreview disableDownload src={srcList} visible onDownload={onDownload} />);
        expect(footerIcon('download')).toHaveClass(`${previewCls}-footer-disabled`);
        fireEvent.click(footerIcon('download'));
        expect(onDownload).not.toHaveBeenCalled();
        expect(fireEvent.contextMenu(previewImg())).toBe(false);
    });

    it('没有图片时下载按钮禁用，点击不下载也不通知', () => {
        vi.stubGlobal(
            'fetch',
            vi.fn<() => Promise<{ ok: boolean }>>(() => Promise.resolve({ ok: false }))
        );
        const onDownload = vi.fn<(src: string, index: number) => void>();
        const setDownloadName = vi.fn<(src: string) => string>(() => 'x.jpg');
        render(<ImagePreview setDownloadName={setDownloadName} src={[]} visible onDownload={onDownload} />);
        const download = footerIcon('download').closest('button');
        expect(download).toHaveAttribute('aria-disabled', 'true');
        fireEvent.click(download);
        expect(setDownloadName).not.toHaveBeenCalled();
        expect(onDownload).not.toHaveBeenCalled();
        expect(fetch).not.toHaveBeenCalled();
    });

    it('操作栏在 viewerVisibleDelay 后隐藏，鼠标移动时重新出现', () => {
        vi.useFakeTimers();
        render(<ImagePreview src={srcList} viewerVisibleDelay={1000} visible />);
        const header = () => $(`.${previewCls}-header`);
        expect(header()).not.toHaveClass(`${previewCls}-hide`);
        void act(() => vi.advanceTimersByTime(1000));
        expect(header()).toHaveClass(`${previewCls}-hide`);
        expect($(`.${previewCls}-footer`)).toHaveClass(`${previewCls}-hide`);
        fireEvent.mouseMove(getPreview());
        expect(header()).not.toHaveClass(`${previewCls}-hide`);
    });

    it('父组件以相同内容的新数组重渲染不重新开始 viewerVisibleDelay 计时', () => {
        vi.useFakeTimers();
        const renderGroup = () => <ImagePreview src={[...srcList]} viewerVisibleDelay={1000} visible />;
        const { rerender } = render(renderGroup());
        for (let i = 0; i < 4; i++) {
            void act(() => vi.advanceTimersByTime(300));
            rerender(renderGroup());
        }
        expect($(`.${previewCls}-header`)).toHaveClass(`${previewCls}-hide`);
    });

    it('preLoad：第一张图加载后，依次预加载 preLoadGap 范围内的相邻图片', () => {
        const created = stubPreloadImage();
        const list = ['a', 'b', 'c', 'd', 'e', 'f'].map((n) => `https://example.com/${n}.jpg`);
        render(<ImagePreview currentIndex={2} preLoadGap={2} src={list} visible />);
        fireEvent.load(previewImg());
        expect(created).toHaveLength(1);
        const [img] = created;
        expect(img.requested).toEqual([list[3]]);
        img.onload();
        img.onload();
        img.onerror();
        expect(img.requested).toEqual([list[3], list[1], list[4], list[0]]);
    });

    it('preLoad={false} 时不预加载', () => {
        const created = stubPreloadImage();
        render(<ImagePreview preLoad={false} src={srcList} visible />);
        fireEvent.load(previewImg());
        expect(created).toHaveLength(0);
    });

    it('body 滚动：可见时锁定，恢复之前的 overflow；使用 getPopupContainer 时不锁定', () => {
        document.body.style.overflow = 'auto';
        const { rerender } = render(<ImagePreview src={srcList} visible={false} />);
        rerender(<ImagePreview src={srcList} visible />);
        expect(document.body.style.overflow).toBe('hidden');
        rerender(<ImagePreview src={srcList} visible={false} />);
        expect(document.body.style.overflow).toBe('auto');

        const container = document.createElement('div');
        document.body.appendChild(container);
        rerender(<ImagePreview getPopupContainer={() => container} src={srcList} visible />);
        expect(container.querySelector(`.${previewCls}`)).not.toBeNull();
        expect(getPreview()).toHaveClass(`${previewCls}-popup`);
        expect(document.body.style.overflow).toBe('auto');
        rerender(<ImagePreview getPopupContainer={() => container} src={srcList} visible={false} />);
        container.remove();
    });

    it('getPopupContainer 返回 body 时与不传一样锁定 body 滚动', () => {
        document.body.style.overflow = 'auto';
        const getBody = () => document.body;
        const { rerender } = render(<ImagePreview getPopupContainer={getBody} src={srcList} visible={false} />);
        rerender(<ImagePreview getPopupContainer={getBody} src={srcList} visible />);
        expect(document.body.style.overflow).toBe('hidden');
        rerender(<ImagePreview getPopupContainer={getBody} src={srcList} visible={false} />);
        expect(document.body.style.overflow).toBe('auto');
    });

    it('getPopupContainer 返回 body 时与不传一样：没有 -popup 类，外层不设 position: static', () => {
        render(<ImagePreview getPopupContainer={() => document.body} src={srcList} visible />);
        expect(getPreview()).not.toHaveClass(`${previewCls}-popup`);
        expect(getPreview().parentElement.style.position).toBe('');
        expect(getPreview()).toHaveAttribute('aria-modal', 'true');
    });

    it('遮罩关闭只排除操作区：容器类名不影响，自定义 header 内的点击不关闭', () => {
        const { unmount } = render(<ImagePreview defaultVisible src={srcList} renderHeader={() => <span className="custom-title">title</span>} />);
        fireEvent.mouseDown($('.custom-title'), { clientX: 0, clientY: 0 });
        fireEvent.mouseUp($('.custom-title'), { clientX: 0, clientY: 0 });
        expect(getPreview()).not.toBeNull();
        unmount();

        const container = document.createElement('div');
        container.className = 'page-footer';
        document.body.appendChild(container);
        render(<ImagePreview defaultVisible getPopupContainer={() => container} src={srcList} />);
        clickMask();
        expect(getPreview()).toBeNull();
        container.remove();
    });

    it('已是 hidden 的 overflow 保持不变', () => {
        document.body.style.overflow = 'hidden';
        const { rerender } = render(<ImagePreview src={srcList} visible />);
        rerender(<ImagePreview src={srcList} visible={false} />);
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('lazyLoad：以视口为 root 观察分组内的图片，相交时设置 src', () => {
        const observers = [];
        vi.stubGlobal(
            'IntersectionObserver',
            class {
                callback: (entries: unknown[]) => void;
                options: unknown;
                elements: Set<Element>;
                constructor(callback, options) {
                    this.callback = (entries) => callback(entries, this);
                    this.options = options;
                    this.elements = new Set();
                    observers.push(this);
                }
                observe(el) {
                    this.elements.add(el);
                }
                unobserve(el) {
                    this.elements.delete(el);
                }
                disconnect() {
                    this.elements.clear();
                }
            }
        );
        const { container, rerender, unmount } = render(<Group lazyLoadMargin="10px" />);
        const live = () => observers.filter((o) => o.elements.size > 0);
        expect(live()).toHaveLength(1);
        const [observer] = live();
        // a group that does not scroll would intersect all of its own images at once
        expect(observer.options).toEqual({ root: null, rootMargin: '10px' });
        expect(observer.elements.size).toBe(container.querySelectorAll(`.${prefixCls}-img`).length);
        const [first] = thumbs();
        void act(() => observer.callback([{ target: first, isIntersecting: true }]));
        expect(first).toHaveAttribute('src', srcList[0]);
        expect(first).not.toHaveAttribute('data-src');
        expect(observer.elements.has(first)).toBe(false);

        rerender(
            <ImagePreview>
                {[...srcList, 'https://example.com/4.jpg'].map((src) => (
                    <Image key={src} src={src} />
                ))}
            </ImagePreview>
        );
        expect(live().flatMap((o) => [...o.elements])).toContain(thumbs()[3]);
        unmount();
        expect(live()).toHaveLength(0);
    });

    it.each([
        ['默认预览', {}],
        ['preview={false}', { preview: false }],
        ['预览地址为独立的 preview.src', { preview: { src: 'https://example.com/big.jpg' } }],
    ])('lazyLoad：key 不变而缩略图 src 变化时，重新观察并写入新 src（%s）', (_name, imageProps) => {
        const io = stubIntersectionObserver();
        const renderGroup = (src: string) => (
            <ImagePreview>
                <Image key={0} src={src} {...imageProps} />
            </ImagePreview>
        );
        const { rerender } = render(renderGroup('https://example.com/a.jpg'));
        const [img] = thumbs();
        void act(() => io.watching(img).callback([{ target: img, isIntersecting: true }]));
        expect(img).toHaveAttribute('src', 'https://example.com/a.jpg');
        expect(io.watching(img)).toBeUndefined();

        rerender(renderGroup('https://example.com/b.jpg'));
        expect(img).toHaveAttribute('data-src', 'https://example.com/b.jpg');
        const observer = io.watching(img);
        expect(observer).toBeDefined();
        void act(() => observer.callback([{ target: img, isIntersecting: true }]));
        expect(img).toHaveAttribute('src', 'https://example.com/b.jpg');
    });

    it('同时传 src 与子图片时，点击子图片打开的是它自己的图片', () => {
        const onChange = vi.fn<(index: number) => void>();
        render(
            <ImagePreview src={[srcList[0]]} onChange={onChange}>
                <Image src={srcList[1]} />
            </ImagePreview>
        );
        fireEvent.click(thumbs()[0]);
        expect(previewImg()).toHaveAttribute('src', srcList[1]);
        expect(pageInfo()).toBe('2/2');
    });

    it('分组内的函数 children 与单个元素 children 保持原样', () => {
        const seen = [];
        function Probe({ children }: { children?: ReactNode | (() => ReactNode) }) {
            seen.push(children);
            return <i data-testid="probe" />;
        }
        render(
            <ImagePreview>
                <Probe>{() => 'render-prop'}</Probe>
                <Probe>
                    <b data-testid="only" />
                </Probe>
            </ImagePreview>
        );
        expect(typeof seen[0]).toBe('function');
        expect(Array.isArray(seen[1])).toBe(false);
        expect((seen[1] as { type: string }).type).toBe('b');
    });

    it('封装组件内部渲染的 Image 加入分组，点击打开它自己', () => {
        function Card({ src, alt }: { src: string; alt: string }) {
            return (
                <figure>
                    <Image alt={alt} src={src} />
                </figure>
            );
        }
        const onChange = vi.fn<(index: number) => void>();
        render(
            <ImagePreview src={[srcList[0]]} onChange={onChange}>
                <Card alt="second" src={srcList[1]} />
                <Card alt="third" src={srcList[2]} />
            </ImagePreview>
        );
        fireEvent.click(thumbs()[1]);
        expect(onChange).toHaveBeenCalledWith(2);
        expect(pageInfo()).toBe('3/3');
        expect(previewImg()).toHaveAttribute('src', srcList[2]);
        expect(previewImg()).toHaveAttribute('alt', 'third');
    });

    it('preview.src 为数组的分组图片把各项依次加入预览，点击打开其中第一项', () => {
        render(
            <ImagePreview>
                <Image src={srcList[0]} />
                <Image preview={{ src: ['https://example.com/a.jpg', 'https://example.com/b.jpg'] }} src={srcList[1]} />
                <Image src={srcList[2]} />
            </ImagePreview>
        );
        fireEvent.click(thumbs()[1]);
        expect(pageInfo()).toBe('2/4');
        expect(previewImg()).toHaveAttribute('src', 'https://example.com/a.jpg');
        fireEvent.click($(`.${previewCls}-next`));
        expect(previewImg()).toHaveAttribute('src', 'https://example.com/b.jpg');
        clickMask();
        fireEvent.click(thumbs()[2]);
        expect(pageInfo()).toBe('4/4');
    });

    it('挂载后插入到前面的 Image 按文档顺序排在前面，卸载后移出分组', () => {
        const renderGroup = (withFirst: boolean) => (
            <ImagePreview>
                {withFirst && <Image key="first" src={srcList[0]} />}
                <Image key="second" src={srcList[1]} />
                <Image key="third" src={srcList[2]} />
            </ImagePreview>
        );
        const { rerender } = render(renderGroup(false));
        rerender(renderGroup(true));
        fireEvent.click(thumbs()[0]);
        expect(pageInfo()).toBe('1/3');
        expect(previewImg()).toHaveAttribute('src', srcList[0]);
        clickMask();

        rerender(renderGroup(false));
        fireEvent.click(thumbs()[1]);
        expect(pageInfo()).toBe('2/2');
        expect(previewImg()).toHaveAttribute('src', srcList[2]);
    });

    it('缩放百分比不带浮点尾数', () => {
        restoreLayout = mockLayout();
        render(<ImagePreview src={srcList} visible />);
        fireEvent.load(previewImg());
        fireEvent.click(footerIcon('plus'));
        // 0.46 + 0.1 = 0.56, and 0.56 * 100 is 56.00000000000001
        expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '56%');
    });

    it('StrictMode：打开，按一次 Esc 关闭，并恢复 body 滚动', () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        render(
            <StrictMode>
                <Group onVisibleChange={onVisibleChange} />
            </StrictMode>
        );
        fireEvent.click(thumbs()[1]);
        expect(pageInfo()).toBe('2/3');
        expect(document.body.style.overflow).toBe('hidden');
        onVisibleChange.mockClear();
        pressEsc();
        expect(onVisibleChange).toHaveBeenCalledTimes(1);
        expect(getPreview()).toBeNull();
        expect(document.body.style.overflow).toBe('');
    });

    it('因延迟隐藏的操作栏在下次打开时重新显示', () => {
        vi.useFakeTimers();
        render(<Group viewerVisibleDelay={1000} />);
        fireEvent.click(thumbs()[0]);
        void act(() => vi.advanceTimersByTime(1000));
        expect($(`.${previewCls}-header`)).toHaveClass(`${previewCls}-hide`);
        pressEsc();
        void act(() => vi.advanceTimersByTime(5000));
        fireEvent.click(thumbs()[1]);
        expect($(`.${previewCls}-header`)).not.toHaveClass(`${previewCls}-hide`);
    });

    it('父组件通过 onVisibleChange 控制 visible', () => {
        function Demo() {
            const [visible, setVisible] = useState(false);
            return (
                <>
                    <button onClick={() => setVisible(true)}>open</button>
                    <ImagePreview src={srcList} visible={visible} onVisibleChange={setVisible} />
                </>
            );
        }
        const { getByText } = render(<Demo />);
        fireEvent.click(getByText('open'));
        expect(getPreview()).not.toBeNull();
        clickMask();
        expect(getPreview()).toBeNull();
    });
});

describe('ImagePreview 函数组件', () => {
    it('defaultVisible 在挂载时打开预览', () => {
        render(<ImagePreview defaultVisible src={srcList} />);
        expect(getPreview()).not.toBeNull();
        clickMask();
        expect(getPreview()).toBeNull();
    });

    it('只有子图片的分组在挂载时可见，打开在 defaultCurrentIndex 处并可切换', () => {
        render(<Group defaultCurrentIndex={1} defaultVisible />);
        expect(pageInfo()).toBe('2/3');
        expect(previewImg()).toHaveAttribute('src', srcList[1]);
        fireEvent.click($(`.${previewCls}-next`));
        expect(previewImg()).toHaveAttribute('src', srcList[2]);
        fireEvent.click($(`.${previewCls}-prev`));
        expect(previewImg()).toHaveAttribute('src', srcList[1]);
    });

    it('每次切换调用一次 onChange', () => {
        const onChange = vi.fn<(index: number) => void>();
        render(<Group onChange={onChange} />);
        fireEvent.click(thumbs()[0]);
        onChange.mockClear();
        fireEvent.click($(`.${previewCls}-next`));
        fireEvent.click(footerIcon('chevron_right'));
        expect(onChange.mock.calls).toEqual([[1], [2]]);
    });

    it('可见时卸载，恢复 body 滚动并移除 Esc 监听', () => {
        const onClose = vi.fn<() => void>();
        const { unmount } = render(<ImagePreview src={srcList} visible onClose={onClose} />);
        expect(document.body.style.overflow).toBe('hidden');
        unmount();
        expect(document.body.style.overflow).toBe('');
        pressEsc();
        expect(onClose).not.toHaveBeenCalled();
    });

    it('未声明属性落在分组元素上，ref 指向该元素', () => {
        const ref = { current: null };
        const { container } = render(<Group ref={ref} data-testid="group" aria-label="gallery" />);
        const group = container.firstElementChild;
        expect(group).toHaveAttribute('data-testid', 'group');
        expect(group).toHaveAttribute('aria-label', 'gallery');
        expect(ref.current).toBe(group);
        expect(group).not.toHaveAttribute('zoomstep');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { ImagePreview: { closeOnEsc: false, infinite: true } };
        render(<Group />);
        fireEvent.click(thumbs()[0]);
        expect($(`.${previewCls}-prev`)).not.toBeNull();
        pressEsc();
        expect(getPreview()).not.toBeNull();
    });

    it('切换时不预加载已加载的图片', () => {
        const created = stubPreloadImage();
        const list = ['a', 'b', 'c', 'd', 'e'].map((n) => `https://example.com/${n}.jpg`);
        render(<ImagePreview defaultCurrentIndex={0} preLoadGap={1} src={list} visible />);
        fireEvent.load(previewImg());
        created[0].onload();
        fireEvent.click($(`.${previewCls}-next`));
        fireEvent.load(previewImg());
        expect(created.at(-1).requested).toEqual([list[2]]);
        created.at(-1).onload();
        const count = created.length;
        fireEvent.click($(`.${previewCls}-prev`));
        fireEvent.load(previewImg());
        fireEvent.click($(`.${previewCls}-next`));
        fireEvent.load(previewImg());
        expect(created.slice(count).flatMap((img) => img.requested)).not.toContain(list[2]);
    });

    it('相对路径的图片经间隔预加载后，走回时不再重复请求', () => {
        const created = [];
        vi.stubGlobal(
            'Image',
            class {
                #src: string;
                requested: string[] = [];
                constructor() {
                    created.push(this);
                }
                set src(value) {
                    this.requested.push(value);
                    this.#src = value;
                }
                // a browser reads src back resolved against the document
                get src() {
                    return new URL(this.#src, 'https://example.com/').href;
                }
            }
        );
        const list = ['a', 'b', 'c', 'd', 'e'].map((n) => `${n}.jpg`);
        render(<ImagePreview defaultCurrentIndex={2} preLoadGap={1} src={list} visible />);
        fireEvent.load(previewImg());
        created[0].onload();
        created[0].onload();
        expect(created[0].requested).toEqual([list[3], list[1]]);
        fireEvent.click($(`.${previewCls}-next`));
        fireEvent.load(previewImg());
        const count = created.length;
        fireEvent.click($(`.${previewCls}-prev`));
        fireEvent.load(previewImg());
        expect(created.slice(count).flatMap((img) => img.requested)).not.toContain(list[1]);
    });

    it('非受控列表的首次预加载从当前图片相邻处开始', () => {
        const created = stubPreloadImage();
        render(<Image preview={{ src: srcList, visible: true, preLoadGap: 1 }} src={srcList[0]} />);
        fireEvent.load(thumbs()[0]);
        fireEvent.load(previewImg());
        expect(created[0].requested).toEqual([srcList[1]]);
    });

    it('lazy-load observer 只观察自身分组的图片', () => {
        const observed = [];
        vi.stubGlobal(
            'IntersectionObserver',
            class {
                observe(el) {
                    observed.push(el);
                }
                unobserve() {}
                disconnect() {}
            }
        );
        const { container } = render(
            <>
                <Image className="outside" src={srcList[0]} />
                <Group />
            </>
        );
        expect(observed).toHaveLength(3);
        expect(observed).not.toContain(container.querySelector('.outside img'));
    });
});

describe('ImagePreview 键盘与屏幕阅读器', () => {
    const press = (key, init = {}, target: Element | Window = document.activeElement) => fireEvent.keyDown(target, { key, ...init });
    const dialog = () => screen.getByRole('dialog');
    const names = () => screen.getAllByRole('button').map((button) => button.getAttribute('aria-label'));
    const withLocale = (node) => <ConfigProvider locale={en_US}>{node}</ConfigProvider>;

    it('每个控件都是以语言包命名的原生按钮，缩放滑块也有名称', () => {
        render(withLocale(<ImagePreview defaultCurrentIndex={1} src={srcList} visible />));
        for (const button of screen.getAllByRole('button')) {
            expect(button.tagName).toBe('BUTTON');
            expect(button).toHaveAttribute('type', 'button');
            expect(button).not.toHaveAttribute('tabindex', '-1');
        }
        expect(names()).toEqual(['Close', 'Previous', 'Next', 'Previous', 'Next', 'Zoom out', 'Zoom in', 'Original size', 'Rotate', 'Download']);
        const slider = screen.getByRole<HTMLInputElement>('slider', { name: 'Zoom' });
        expect(slider).toHaveAttribute('aria-valuetext', `${slider.value}%`);

        fireEvent.click(screen.getByRole('button', { name: 'Original size' }));
        expect(screen.getByRole('button', { name: 'Adapt to the page' })).toBeInTheDocument();
    });

    it('tip 属性为按钮命名；设置 showTooltip 时按钮为 Tooltip 触发器', () => {
        render(<ImagePreview nextTip="N" prevTip="P" rotateTip="R" showTooltip src={srcList} visible />);
        expect(screen.getAllByRole('button', { name: 'N' })).toHaveLength(2);
        expect(screen.getByRole('button', { name: 'P' })).toHaveAttribute('aria-disabled', 'true');
        expect(screen.getByRole('button', { name: '关闭' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'R' }).parentElement).toHaveClass(`${previewCls}-footer`);
    });

    it('禁用的底部按钮仍可聚焦，报告 aria-disabled 且无操作', () => {
        const onPrev = vi.fn<(index: number) => void>();
        render(withLocale(<ImagePreview disableDownload src={srcList} visible onPrev={onPrev} />));
        const footerPrev = screen.getByRole('button', { name: 'Previous' });
        expect(footerPrev).toHaveAttribute('aria-disabled', 'true');
        expect(screen.getByRole('button', { name: 'Download' })).toHaveAttribute('aria-disabled', 'true');
        for (const next of screen.getAllByRole('button', { name: 'Next' })) {
            expect(next).not.toHaveAttribute('aria-disabled');
        }
        footerPrev.focus();
        expect(document.activeElement).toBe(footerPrev);
        fireEvent.click(footerPrev);
        expect(onPrev).not.toHaveBeenCalled();
    });

    it('预览为模态对话框，以标题命名，无标题时以语言包命名', () => {
        const { rerender } = render(withLocale(<ImagePreview src={srcList} visible />));
        expect(dialog()).toHaveAttribute('aria-modal', 'true');
        expect(dialog()).toHaveAccessibleName('Preview');
        rerender(withLocale(<ImagePreview previewTitle="Album" src={srcList} visible />));
        expect(dialog()).toHaveAccessibleName('Album');
        expect(dialog()).not.toHaveAttribute('aria-label');
    });

    it('previewTitle 渲染在单独预览、单个 Image 及 src 列表之后的头部', () => {
        const { rerender } = render(<ImagePreview previewTitle="Album" src={srcList} visible />);
        expect($(`.${previewCls}-header-title`).textContent).toBe('Album');
        rerender(<ImagePreview previewTitle="Album" src={srcList} visible renderHeader={(title) => `T:${title}`} />);
        expect($(`.${previewCls}-header-title`).textContent).toBe('T:Album');
        rerender(<Image preview={{ visible: true, previewTitle: 'one' }} src={srcList[0]} />);
        fireEvent.load(thumbs()[0]);
        expect($(`.${previewCls}-header-title`).textContent).toBe('one');

        rerender(
            <ImagePreview currentIndex={1} previewTitle="Album" src={[srcList[0]]} visible>
                <Image preview={{ previewTitle: 'second' }} src={srcList[1]} />
            </ImagePreview>
        );
        expect($(`.${previewCls}-header-title`).textContent).toBe('second');
        rerender(
            <ImagePreview currentIndex={0} previewTitle="Album" src={[srcList[0]]} visible>
                <Image preview={{ previewTitle: 'second' }} src={srcList[1]} />
            </ImagePreview>
        );
        expect($(`.${previewCls}-header-title`).textContent).toBe('Album');
    });

    it('打开时焦点移入对话框，关闭时焦点回到触发器', () => {
        function Demo() {
            const [visible, setVisible] = useState(false);
            return (
                <>
                    <Button onClick={() => setVisible(true)}>open</Button>
                    <ImagePreview src={srcList} visible={visible} onVisibleChange={setVisible} />
                </>
            );
        }
        render(<Demo />);
        const trigger = screen.getByRole('button', { name: 'open' });
        trigger.focus();
        fireEvent.click(trigger);
        expect(document.activeElement).toBe(dialog());
        pressEsc();
        expect(getPreview()).toBeNull();
        expect(document.activeElement).toBe(trigger);

        fireEvent.click(trigger);
        fireEvent.click(screen.getByRole('button', { name: '关闭' }));
        expect(document.activeElement).toBe(trigger);
    });

    it('Tab 焦点留在对话框内', () => {
        render(withLocale(<ImagePreview src={srcList} visible />));
        const buttons = screen.getAllByRole('button');
        press('Tab', { shiftKey: true });
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Download' }));
        press('Tab');
        expect(document.activeElement).toBe(buttons[0]);
        press('Tab', { shiftKey: true });
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Download' }));
        dialog().focus();
        press('Tab');
        expect(document.activeElement).toBe(buttons[0]);
    });

    it('ConfigProvider 的 getPopupContainer：预览在该容器中，非模态，不锁 body、不设 inert', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const { unmount } = render(
            <ConfigProvider getPopupContainer={() => container}>
                <ImagePreview src={srcList} visible />
            </ConfigProvider>
        );
        expect(container.contains(dialog())).toBe(true);
        expect(dialog()).toHaveClass(`${previewCls}-popup`);
        expect(dialog().parentElement.style.position).toBe('static');
        expect(dialog()).not.toHaveAttribute('aria-modal');
        expect(document.body.style.overflow).toBe('');
        expect([...document.body.children].some((el) => (el as HTMLElement).inert)).toBe(false);
        expect(document.activeElement).toBe(dialog());
        unmount();
        container.remove();
    });

    it('自定义容器内的预览为非模态：不输出 aria-modal，Tab 不锁在对话框内', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const { unmount } = render(<ImagePreview getPopupContainer={() => container} src={srcList} visible />);
        expect(dialog()).not.toHaveAttribute('aria-modal');
        expect(document.activeElement).toBe(dialog());
        expect(press('Tab', { shiftKey: true })).toBe(true);
        expect(document.activeElement).toBe(dialog());
        unmount();
        container.remove();
    });

    it('非模态预览关闭时，焦点已被移到页面别处则不归还', () => {
        const container = document.createElement('div');
        const outside = document.createElement('button');
        const trigger = document.createElement('button');
        document.body.append(container, outside, trigger);
        trigger.focus();
        const renderPreview = (visible: boolean) => <ImagePreview getPopupContainer={() => container} src={srcList} visible={visible} />;
        const { rerender } = render(renderPreview(true));
        expect(document.activeElement).toBe(dialog());
        outside.focus();
        rerender(renderPreview(false));
        expect(document.activeElement).toBe(outside);

        rerender(renderPreview(true));
        rerender(renderPreview(false));
        expect(document.activeElement).toBe(outside);
        container.remove();
        outside.remove();
        trigger.remove();
    });

    it('预览之外的控件上的方向键不切换图片也不被拦截', () => {
        const container = document.createElement('div');
        const outside = document.createElement('button');
        document.body.append(container, outside);
        render(<ImagePreview getPopupContainer={() => container} src={srcList} visible />);
        outside.focus();
        expect(press('ArrowRight', {}, outside)).toBe(true);
        expect(pageInfo()).toBe('1/3');
        expect(press('ArrowRight', {}, document.body)).toBe(false);
        expect(pageInfo()).toBe('2/3');
        container.remove();
        outside.remove();
    });

    it('非模态预览的下标变化不会把使用方移到页面别处的焦点拉回对话框', () => {
        const container = document.createElement('div');
        const outside = document.createElement('button');
        document.body.append(container, outside);
        const renderPreview = (currentIndex: number) => <ImagePreview currentIndex={currentIndex} getPopupContainer={() => container} src={srcList} visible />;
        const { rerender } = render(renderPreview(0));
        outside.focus();
        rerender(renderPreview(1));
        expect(document.activeElement).toBe(outside);
        container.remove();
        outside.remove();
    });

    it('非主按钮的按下与抬起不关闭预览', () => {
        render(<Group />);
        fireEvent.click(thumbs()[0]);
        for (const button of [1, 2]) {
            fireEvent.mouseDown(getPreview(), { button, clientX: 10, clientY: 10 });
            fireEvent.mouseUp(getPreview(), { button, clientX: 10, clientY: 10 });
        }
        expect(getPreview()).not.toBeNull();
        clickMask();
        expect(getPreview()).toBeNull();
    });

    it('ArrowLeft 与 ArrowRight 切换图片；与按钮一致，除非 infinite，否则首尾停止', () => {
        const onPrev = vi.fn<(index: number) => void>();
        const onNext = vi.fn<(index: number) => void>();
        const { rerender } = render(<Group onNext={onNext} onPrev={onPrev} />);
        fireEvent.click(thumbs()[0]);
        press('ArrowLeft');
        expect(pageInfo()).toBe('1/3');
        expect(onPrev).not.toHaveBeenCalled();
        expect(press('ArrowRight')).toBe(false);
        expect(onNext).toHaveBeenCalledWith(1);
        press('ArrowRight');
        expect(pageInfo()).toBe('3/3');
        expect(press('ArrowRight')).toBe(true);
        expect(pageInfo()).toBe('3/3');
        press('ArrowLeft');
        expect(pageInfo()).toBe('2/3');
        expect(onPrev).toHaveBeenCalledWith(1);

        rerender(<Group infinite onNext={onNext} onPrev={onPrev} />);
        press('ArrowRight');
        press('ArrowRight');
        expect(pageInfo()).toBe('1/3');
        press('ArrowLeft');
        expect(pageInfo()).toBe('3/3');
    });

    it('单张图片时不切换', () => {
        const onChange = vi.fn<(index: number) => void>();
        render(<ImagePreview infinite src={srcList[0]} visible onChange={onChange} />);
        press('ArrowRight');
        press('ArrowLeft');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('RTL 下方向键互换', () => {
        render(
            <ConfigProvider direction="rtl">
                <ImagePreview defaultCurrentIndex={1} src={srcList} visible />
            </ConfigProvider>
        );
        press('ArrowLeft');
        expect(pageInfo()).toBe('3/3');
        press('ArrowRight');
        press('ArrowRight');
        expect(pageInfo()).toBe('1/3');
    });

    it('输入框、带修饰键的方向键与缩放滑块保留其方向键行为', () => {
        const renderPreviewMenu = (menu) => (
            <div>
                <input aria-label="note" />
                <textarea aria-label="long note" />
                <div className="rich" contentEditable />
                {menu.menuItems}
            </div>
        );
        render(<ImagePreview defaultCurrentIndex={1} src={srcList} visible renderPreviewMenu={renderPreviewMenu} />);
        const rich = $('.rich');
        // jsdom does not implement isContentEditable
        Object.defineProperty(rich, 'isContentEditable', { value: true });
        for (const field of [screen.getByRole('textbox', { name: 'note' }), screen.getByRole('textbox', { name: 'long note' }), rich]) {
            press('ArrowRight', {}, field);
            press('ArrowLeft', {}, field);
        }
        expect(pageInfo()).toBe('2/3');
        for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey']) {
            press('ArrowRight', { [modifier]: true });
        }
        expect(pageInfo()).toBe('2/3');
        press('ArrowRight', {}, screen.getByRole('slider'));
        expect(pageInfo()).toBe('2/3');
        press('ArrowRight', {}, window);
        expect(pageInfo()).toBe('3/3');
    });

    it('焦点落在隐藏的操作上时重新显示操作栏并保持显示', () => {
        vi.useFakeTimers();
        render(withLocale(<ImagePreview src={srcList} viewerVisibleDelay={1000} visible />));
        const footer = () => $(`.${previewCls}-footer`);
        void act(() => vi.advanceTimersByTime(1000));
        expect(footer()).toHaveClass(`${previewCls}-hide`);
        act(() => screen.getByRole('button', { name: 'Rotate' }).focus());
        expect(footer()).not.toHaveClass(`${previewCls}-hide`);
        void act(() => vi.advanceTimersByTime(1000));
        expect(footer()).not.toHaveClass(`${previewCls}-hide`);
        act(() => dialog().focus());
        void act(() => vi.advanceTimersByTime(1000));
        expect(footer()).toHaveClass(`${previewCls}-hide`);
        press('ArrowRight');
        expect(footer()).not.toHaveClass(`${previewCls}-hide`);
    });

    it('焦点在到达末尾后消失的上一张或下一张按钮上时，焦点移到对话框', () => {
        render(withLocale(<ImagePreview defaultCurrentIndex={1} src={srcList} visible />));
        const [arrowNext] = screen.getAllByRole('button', { name: 'Next' });
        arrowNext.focus();
        fireEvent.click(arrowNext);
        expect(pageInfo()).toBe('3/3');
        expect(document.activeElement).toBe(dialog());
    });

    it('每种语言都为关闭按钮与缩放滑块命名', () => {
        const locales = import.meta.glob<{ Image: { close: string; zoom: string } }>('@fibrae/semi-foundation/locale/source/*.ts', {
            eager: true,
            import: 'default',
        });
        expect(Object.keys(locales)).toHaveLength(57);
        for (const [file, locale] of Object.entries(locales)) {
            expect([file, typeof locale.Image.close, typeof locale.Image.zoom]).toEqual([file, 'string', 'string']);
            expect(locale.Image.close.length * locale.Image.zoom.length).toBeGreaterThan(0);
        }
    });
});
