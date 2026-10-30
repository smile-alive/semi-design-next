import { flushSync } from 'svelte';
import { fireEvent, render, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { ImageProps, PreviewProps } from '../interface';
import ConfigFixture from './config-fixture.svelte';
import GroupFixture from './group-fixture.svelte';
import { $, arrow, clickMask, dispatch, fire, footerIcon, getPreview, mockLayout, pageInfo, pressEsc, press, previewCls, previewImg, srcList, stubFailingFetch, stubPreloadImage, thumbs } from './helpers';
import PreviewModes from './preview-modes.svelte';

function renderGroup(props: PreviewProps = {}, images: ImageProps[] = srcList.map((src) => ({ src })), snippets: string[] = []) {
    const store = createStore<{ props: PreviewProps; images: ImageProps[]; snippets: string[] }>({ props: { src: srcList, ...props }, images, snippets });
    const view = render(GroupFixture, { props: { store } });
    return { ...view, store };
}

// The group without thumbnails, already open
const renderPreview = (props: PreviewProps = {}, snippets: string[] = []) => renderGroup({ visible: true, ...props }, [], snippets);

let restoreLayout: (() => void) | null = null;

afterEach(() => {
    restoreLayout?.();
    restoreLayout = null;
    vi.useRealTimers();
    vi.unstubAllGlobals();
    semiGlobal.config.overrideDefaultProps = {};
    document.body.style.overflow = '';
    document.body.style.paddingInlineEnd = '';
});

describe('Svelte ImagePreview 受控值（$bindable）', () => {
    const setupVisible = (mode: 'bind' | 'function' | 'one-way', accept = true) => {
        const store = createStore<{ visible: boolean | undefined; currentIndex: number | undefined; accept: boolean; log: string[] }>({ visible: true, currentIndex: undefined, accept, log: [] });
        render(PreviewModes, { props: { prop: 'visible', mode, src: srcList, store } });
        return store;
    };

    const setupIndex = (mode: 'bind' | 'function' | 'one-way' | 'uncontrolled', currentIndex?: number, accept = true) => {
        const store = createStore<{ visible: boolean | undefined; currentIndex: number | undefined; accept: boolean; log: string[] }>({ visible: undefined, currentIndex, accept, log: [] });
        render(PreviewModes, { props: { prop: 'currentIndex', mode, src: srcList, store } });
        return store;
    };

    it('visible bind：Esc 写回父级，父级再改值同步到预览', async () => {
        const store = setupVisible('bind');
        expect(getPreview()).not.toBeNull();
        await pressEsc();
        expect(store.visible).toBe(false);
        expect(store.log).toEqual(['visible false']);
        expect(getPreview()).toBeNull();
        store.visible = true;
        flushSync();
        expect(getPreview()).not.toBeNull();
    });

    it('visible 函数绑定：setter 拒绝时预览保持打开', async () => {
        const store = setupVisible('function', false);
        await pressEsc();
        expect(store.log).toEqual(['set false', 'visible false']);
        expect(store.visible).toBe(true);
        expect(getPreview()).not.toBeNull();
    });

    it('visible 函数绑定：setter 接受时预览关闭', async () => {
        const store = setupVisible('function', true);
        await pressEsc();
        expect(store.visible).toBe(false);
        expect(getPreview()).toBeNull();
    });

    it('visible 单向传值：交互在本地覆盖，父级再推新值时以父级为准', async () => {
        const store = setupVisible('one-way');
        await pressEsc();
        expect(getPreview()).toBeNull();
        expect(store.visible).toBe(true);
        store.visible = false;
        flushSync();
        store.visible = true;
        flushSync();
        expect(getPreview()).not.toBeNull();
    });

    it('currentIndex 非受控：点击切换，onChange 收到新值', async () => {
        const store = setupIndex('uncontrolled');
        expect(pageInfo()).toBe('1/3');
        await fire(fireEvent.click(arrow('next')));
        expect(pageInfo()).toBe('2/3');
        expect(store.log).toEqual(['change 1']);
    });

    it('currentIndex bind：切换写回父级，父级改值同步到预览', async () => {
        const store = setupIndex('bind', 0);
        await fire(fireEvent.click(arrow('next')));
        expect(store.currentIndex).toBe(1);
        expect(pageInfo()).toBe('2/3');
        store.currentIndex = 2;
        flushSync();
        expect(pageInfo()).toBe('3/3');
    });

    it('currentIndex 函数绑定：setter 拒绝时保持原值，接受时跟随', async () => {
        const rejected = setupIndex('function', 0, false);
        await fire(fireEvent.click(arrow('next')));
        expect(rejected.log).toEqual(['set 1', 'change 1']);
        expect(pageInfo()).toBe('1/3');
    });

    it('currentIndex 单向传值：切换在本地覆盖', async () => {
        const store = setupIndex('one-way', 1);
        expect(pageInfo()).toBe('2/3');
        await fire(fireEvent.click(arrow('next')));
        expect(pageInfo()).toBe('3/3');
        store.currentIndex = 0;
        flushSync();
        expect(pageInfo()).toBe('1/3');
    });
});

describe('Svelte ImagePreview', () => {
    it('visible', async () => {
        const { store } = renderGroup({ visible: false });
        expect(getPreview()).toBeNull();
        store.props.visible = true;
        flushSync();
        expect(getPreview()).not.toBeNull();
        store.props.visible = false;
        flushSync();
        expect(getPreview()).toBeNull();
    });

    it('分组结构：class 与 style 在分组上，previewCls、previewStyle 与 zIndex 在预览上', () => {
        const { container } = renderPreview({ class: 'group-cls', style: 'color: red', previewCls: 'preview-cls', previewStyle: 'color: blue', zIndex: 2000 });
        const group = container.querySelector(`.${BASE_CLASS_PREFIX}-image-preview-group`) as HTMLElement;
        expect(group).toHaveClass('group-cls');
        expect(group).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getPreview()).toHaveClass('preview-cls');
        expect(getPreview()).toHaveStyle({ color: 'rgb(0, 0, 255)' });
        expect(getPreview()?.parentElement).toHaveStyle({ zIndex: '2000' });
    });

    it('非受控：点击分组中的图片在对应索引处打开，点击遮罩关闭，两个回调各调用一次', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const onChange = vi.fn<(index: number) => void>();
        renderGroup({ onVisibleChange, onChange });
        expect(getPreview()).toBeNull();
        await fire(fireEvent.click(thumbs()[1]));
        expect(pageInfo()).toBe('2/3');
        expect(previewImg()).toHaveAttribute('src', srcList[1]);
        expect(onChange).toHaveBeenCalledWith(1);
        expect(onVisibleChange).toHaveBeenCalledWith(true);
        await clickMask();
        expect(getPreview()).toBeNull();
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('preview 为 false 的图片不打开分组预览', async () => {
        renderGroup({}, [{ src: srcList[0], preview: false }, { src: srcList[1] }]);
        await fire(fireEvent.click(thumbs()[0]));
        expect(getPreview()).toBeNull();
        await fire(fireEvent.click(thumbs()[1]));
        expect(pageInfo()).toBe('2/3');
    });

    it('预览图使用 alts 里所展示图片的 alt，没有时为空', async () => {
        renderGroup({ alts: ['first', undefined, 'third'] });
        await fire(fireEvent.click(thumbs()[0]));
        expect(previewImg()).toHaveAttribute('alt', 'first');
        await fire(fireEvent.click(arrow('next')));
        expect(previewImg()).toHaveAttribute('alt', '');
    });

    it('字符串 src', () => {
        renderPreview({ src: srcList[0] });
        expect(pageInfo()).toBe('1/1');
    });

    it('preview 为 true 的缩略图用 preview.src 的第一项在列表里定位', async () => {
        renderGroup({}, [{ src: 'https://example.com/thumb.jpg', preview: { src: srcList[2] } }]);
        await fire(fireEvent.click(thumbs()[0]));
        expect(pageInfo()).toBe('3/3');
        expect(previewImg()).toHaveAttribute('src', srcList[2]);
    });

    it('上一张、下一张、底部箭头及其事件；除非 infinite，否则首尾隐藏箭头', async () => {
        const onPrev = vi.fn<(index: number) => void>();
        const onNext = vi.fn<(index: number) => void>();
        const { store } = renderGroup({ onNext, onPrev });
        await fire(fireEvent.click(thumbs()[0]));
        expect($(`.${previewCls}-prev`)).toBeNull();
        expect(footerIcon('chevron_left')).toHaveClass(`${previewCls}-footer-disabled`);

        await fire(fireEvent.click(arrow('next')));
        expect(onNext).toHaveBeenCalledWith(1);
        await fire(fireEvent.click(footerIcon('chevron_right')));
        expect(onNext).toHaveBeenLastCalledWith(2);
        expect(pageInfo()).toBe('3/3');
        expect($(`.${previewCls}-next`)).toBeNull();
        await fire(fireEvent.click(footerIcon('chevron_right')));
        expect(onNext).toHaveBeenCalledTimes(2);

        await fire(fireEvent.click(footerIcon('chevron_left')));
        expect(onPrev).toHaveBeenCalledWith(1);
        await fire(fireEvent.click(arrow('prev')));
        expect(onPrev).toHaveBeenLastCalledWith(0);
        expect(pageInfo()).toBe('1/3');

        store.props.infinite = true;
        flushSync();
        await fire(fireEvent.click(arrow('prev')));
        expect(pageInfo()).toBe('3/3');
        await fire(fireEvent.click(arrow('next')));
        expect(pageInfo()).toBe('1/3');
    });

    it('Esc 关闭并调用 onClose，每次只通知一次；closeOnEsc 为 false 时保持打开；其他按键无效果', async () => {
        const onClose = vi.fn<() => void>();
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const view = renderGroup({ onClose, onVisibleChange });
        await fire(fireEvent.click(thumbs()[0]));
        press('Enter', {}, window);
        expect(pageInfo()).toBe('1/3');
        onVisibleChange.mockClear();
        await pressEsc();
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onVisibleChange.mock.calls).toEqual([[false]]);
        expect(getPreview()).toBeNull();
        view.unmount();

        renderGroup({ closeOnEsc: false });
        await fire(fireEvent.click(thumbs()[0]));
        await pressEsc();
        expect(getPreview()).not.toBeNull();
    });

    it('遮罩：鼠标微小移动仍关闭，拖动或操作区域不关闭，maskClosable 为 false 时永不关闭', async () => {
        const { store } = renderGroup();
        await fire(fireEvent.click(thumbs()[0]));
        const preview = getPreview() as HTMLElement;
        await fire(fireEvent.mouseDown(preview, { clientX: 0, clientY: 0 }));
        await fire(fireEvent.mouseUp(preview, { clientX: 20, clientY: 0 }));
        expect(getPreview()).not.toBeNull();
        await fire(fireEvent.mouseDown(footerIcon('rotate'), { clientX: 0, clientY: 0 }));
        await fire(fireEvent.mouseUp(footerIcon('rotate'), { clientX: 0, clientY: 0 }));
        expect(getPreview()).not.toBeNull();
        await fire(fireEvent.mouseDown(preview, { clientX: 0, clientY: 0 }));
        await fire(fireEvent.mouseUp(preview, { clientX: 4, clientY: 5 }));
        expect(getPreview()).toBeNull();

        store.props.maskClosable = false;
        flushSync();
        await fire(fireEvent.click(thumbs()[0]));
        await clickMask();
        expect(getPreview()).not.toBeNull();
    });

    it('header：关闭按钮、closable、closeIcon、title 片段与 titles', async () => {
        const onClose = vi.fn<() => void>();
        const first = renderGroup({ onClose, titles: ['first'] });
        await fire(fireEvent.click(thumbs()[0]));
        expect($(`.${previewCls}-header-title`)?.textContent?.trim()).toBe('first');
        const close = $(`.${previewCls}-header-close`) as HTMLElement;
        await fire(fireEvent.mouseDown(close, { clientX: 0, clientY: 0 }));
        await fire(fireEvent.mouseUp(close, { clientX: 0, clientY: 0 }));
        expect(getPreview()).not.toBeNull();
        await fire(fireEvent.click(close));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(getPreview()).toBeNull();
        first.unmount();

        const second = renderGroup({ titles: ['first'] }, undefined, ['title', 'closeIcon']);
        await fire(fireEvent.click(thumbs()[0]));
        expect($(`.${previewCls}-header-title .custom-title`)?.textContent).toBe('0:first');
        expect($(`.${previewCls}-header-close .custom-close`)).not.toBeNull();
        second.unmount();

        renderGroup({ closable: false });
        await fire(fireEvent.click(thumbs()[1]));
        expect($(`.${previewCls}-header-close`)).toBeNull();
    });

    it('leftIcon、rightIcon 与 previewMenu', async () => {
        renderPreview({ currentIndex: 1 }, ['leftIcon', 'rightIcon', 'previewMenu']);
        expect($(`.${previewCls}-prev .custom-left`)?.textContent).toBe('L1');
        expect($(`.${previewCls}-next .custom-right`)?.textContent).toBe('R1');
        expect($(`.${previewCls}-footer .custom-menu`)).not.toBeNull();
        expect($(`.${previewCls}-footer`)).not.toHaveClass(`${previewCls}-footer-content`);
        expect($('.custom-menu')?.textContent).toContain('2/3');
    });

    it('menuItems 渲染出的默认按钮在自定义菜单里仍可用', async () => {
        renderPreview({ currentIndex: 1 }, ['previewMenu']);
        const menu = $(`.${previewCls}-footer .custom-menu`) as HTMLElement;
        // prev, next, zoom out, zoom in, ratio, rotate, download plus the slider's own handle
        expect(within(menu).getAllByRole('button').length).toBeGreaterThanOrEqual(7);
        await fire(fireEvent.click(footerIcon('chevron_right')));
        expect(pageInfo()).toBe('3/3');
    });

    it('zoom：加载后自适应，底部按钮、滑块上下限与事件', async () => {
        restoreLayout = mockLayout();
        const onZoomIn = vi.fn<(zoom: number) => void>();
        const onZoomOut = vi.fn<(zoom: number) => void>();
        renderPreview({ onZoomIn, onZoomOut });
        await fire(fireEvent.load(previewImg()));
        // min((1000 - 80) / 2000, (800 - 80) / 1000) = 0.46, not reported
        expect(previewImg()).toHaveStyle({ width: '920px', height: '460px' });
        expect(onZoomIn).not.toHaveBeenCalled();
        expect(onZoomOut).not.toHaveBeenCalled();

        await fire(fireEvent.click(footerIcon('plus')));
        expect(onZoomIn).toHaveBeenLastCalledWith(0.56);
        expect(previewImg()).toHaveStyle({ width: '1120px', height: '560px' });
        await fire(fireEvent.click(footerIcon('minus')));
        expect(onZoomOut).toHaveBeenLastCalledWith(0.46);
        expect(previewImg()).toHaveStyle({ width: '920px' });
    });

    it('zoom 限制在 minZoom 与 maxZoom 之间；zoomStep', async () => {
        restoreLayout = mockLayout({ natural: [100, 100] });
        const onZoomIn = vi.fn<(zoom: number) => void>();
        renderPreview({ maxZoom: 1.5, zoomStep: 0.5, onZoomIn });
        await fire(fireEvent.load(previewImg()));
        // 720 / 100 = 7.2 is clamped to maxZoom
        expect(previewImg()).toHaveStyle({ width: '150px' });
        expect(footerIcon('plus')).toHaveClass(`${previewCls}-footer-disabled`);
        await fire(fireEvent.click(footerIcon('minus')));
        expect(previewImg()).toHaveStyle({ width: '100px' });
        await fire(fireEvent.click(footerIcon('plus')));
        expect(onZoomIn).toHaveBeenLastCalledWith(1.5);
    });

    it('initialZoom 每张图片只生效一次', async () => {
        restoreLayout = mockLayout();
        renderPreview({ initialZoom: 0.2 });
        await fire(fireEvent.load(previewImg()));
        expect(previewImg()).toHaveStyle({ width: '400px' });
        await fire(fireEvent.click(arrow('next')));
        await fire(fireEvent.load(previewImg()));
        expect(previewImg()).toHaveStyle({ width: '400px' });
    });

    it('滚轮以包裹层为中心缩放，并阻止页面缩放', async () => {
        restoreLayout = mockLayout();
        const onZoomIn = vi.fn<(zoom: number) => void>();
        const onZoomOut = vi.fn<(zoom: number) => void>();
        renderPreview({ onZoomIn, onZoomOut });
        await fire(fireEvent.load(previewImg()));
        const wheel = dispatch(getPreview() as HTMLElement, new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -10 }));
        expect(wheel.defaultPrevented).toBe(true);
        expect(onZoomIn).toHaveBeenLastCalledWith(0.56);
        expect(previewImg()).toHaveStyle({ width: '1120px' });
        await fire(fireEvent.wheel(getPreview() as HTMLElement, { deltaY: 10 }));
        expect(onZoomOut).toHaveBeenLastCalledWith(0.46);
        expect(previewImg()).toHaveStyle({ width: '920px' });
    });

    it('滚轮缩放与按钮一样停在 maxZoom、minZoom 上，即使当前值不是步长的整数倍', async () => {
        restoreLayout = mockLayout();
        const { store } = renderPreview({ maxZoom: 0.5 });
        await fire(fireEvent.load(previewImg()));
        expect(previewImg()).toHaveStyle({ width: '920px' });
        // 0.46 + 0.1 passes maxZoom
        await fire(fireEvent.wheel(getPreview() as HTMLElement, { deltaY: -10 }));
        expect(previewImg()).toHaveStyle({ width: '1000px' });

        store.props.minZoom = 0.42;
        flushSync();
        await fire(fireEvent.wheel(getPreview() as HTMLElement, { deltaY: 10 }));
        await fire(fireEvent.wheel(getPreview() as HTMLElement, { deltaY: 10 }));
        expect(previewImg()).toHaveStyle({ width: '840px' });
    });

    it('在图片上滚动时以指针所在点为中心缩放', async () => {
        restoreLayout = mockLayout();
        renderPreview();
        await fire(fireEvent.load(previewImg()));
        await fire(fireEvent.click(footerIcon('real_size_stroked')));
        // jsdom leaves offsetX and offsetY out of the event init
        const wheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -10 });
        Object.defineProperties(wheel, { offsetX: { value: 1500 }, offsetY: { value: 750 } });
        dispatch(previewImg(), wheel);
        // 2000x1000 -> 2200x1100; the point 500px right and 250px below the centre moves out by a tenth
        expect(previewImg()).toHaveStyle({ width: '2200px', height: '1100px' });
        const [x, y] = (previewImg().style.transform.match(/-?[\d.]+(?=px)/g) ?? []).map(Number);
        expect(x).toBeCloseTo(-50);
        expect(y).toBeCloseTo(-25);
    });

    it('ratio：切换到真实尺寸再切回，onRatioChange 的载荷', async () => {
        restoreLayout = mockLayout();
        const onRatioChange = vi.fn<(type: string) => void>();
        const onZoomIn = vi.fn<(zoom: number) => void>();
        renderPreview({ onRatioChange, onZoomIn });
        await fire(fireEvent.load(previewImg()));
        await fire(fireEvent.click(footerIcon('real_size_stroked')));
        expect(onRatioChange).toHaveBeenCalledWith('realSize');
        expect(onZoomIn).toHaveBeenLastCalledWith(1);
        expect(previewImg()).toHaveStyle({ width: '2000px', height: '1000px' });
        await fire(fireEvent.click(footerIcon('window_adaption_stroked')));
        expect(onRatioChange).toHaveBeenLastCalledWith('adaptation');
        expect(previewImg()).toHaveStyle({ width: '920px' });
    });

    it('拖动可在边界内平移已缩放的图片', async () => {
        restoreLayout = mockLayout();
        renderPreview();
        await fire(fireEvent.load(previewImg()));
        await fire(fireEvent.click(footerIcon('real_size_stroked')));
        // 2000x1000 in 1000x800: x may move 500 either way, y 100
        // jsdom has no pointer capture; the capture keeps a drag going when the pointer leaves the image
        const setPointerCapture = vi.fn<(pointerId: number) => void>();
        previewImg().setPointerCapture = setPointerCapture;
        await fire(fireEvent.pointerDown(previewImg(), { pointerId: 7, clientX: 100, clientY: 100 }));
        expect(setPointerCapture).toHaveBeenCalledWith(7);
        await fire(fireEvent.pointerMove(previewImg(), { clientX: 150, clientY: 130, buttons: 1 }));
        expect(previewImg().style.transform).toBe('translate(50px, 30px) rotate(0deg)');
        await fire(fireEvent.pointerMove(previewImg(), { clientX: 150, clientY: 330, buttons: 1 }));
        expect(previewImg().style.transform).toBe('translate(50px, 100px) rotate(0deg)');
        // without the left button pressed nothing moves
        await fire(fireEvent.pointerMove(previewImg(), { clientX: 400, clientY: 330, buttons: 0 }));
        expect(previewImg().style.transform).toBe('translate(50px, 100px) rotate(0deg)');
    });

    it('只有可拖动的图片才禁用触屏手势', async () => {
        restoreLayout = mockLayout();
        renderPreview();
        await fire(fireEvent.load(previewImg()));
        expect(previewImg().style.touchAction).toBe('');
        await fire(fireEvent.click(footerIcon('real_size_stroked')));
        expect(previewImg().style.touchAction).toBe('none');
        await fire(fireEvent.click(footerIcon('window_adaption_stroked')));
        expect(previewImg().style.touchAction).toBe('');
    });

    it('rotate：onRotateLeft 的载荷，图片按旋转后的边界重新适配', async () => {
        restoreLayout = mockLayout();
        const onRotateLeft = vi.fn<(angle: number) => void>();
        const onZoomOut = vi.fn<(zoom: number) => void>();
        renderPreview({ onRotateLeft, onZoomOut });
        await fire(fireEvent.load(previewImg()));
        await fire(fireEvent.click(footerIcon('rotate')));
        expect(onRotateLeft).toHaveBeenCalledWith(-90);
        expect(previewImg().style.transform).toContain('rotate(-90deg)');
        // rotated bounds 1000x2000: min(920 / 1000, 720 / 2000) = 0.36
        expect(onZoomOut).toHaveBeenLastCalledWith(0.36);
        expect(previewImg()).toHaveStyle({ width: '720px' });
        await fire(fireEvent.click(footerIcon('rotate')));
        expect(onRotateLeft).toHaveBeenLastCalledWith(-180);
    });

    it('切换或重新打开时重置旋转与 ratio，且不上报 zoom', async () => {
        restoreLayout = mockLayout();
        const onZoomIn = vi.fn<(zoom: number) => void>();
        const onZoomOut = vi.fn<(zoom: number) => void>();
        renderGroup({ onZoomIn, onZoomOut });
        await fire(fireEvent.click(thumbs()[0]));
        await fire(fireEvent.load(previewImg()));
        await fire(fireEvent.click(footerIcon('real_size_stroked')));
        await fire(fireEvent.click(footerIcon('rotate')));
        onZoomIn.mockClear();
        onZoomOut.mockClear();

        await fire(fireEvent.click(arrow('next')));
        expect(previewImg().style.transform).toContain('rotate(0deg)');
        expect(footerIcon('real_size_stroked')).not.toBeNull();
        await fire(fireEvent.load(previewImg()));
        expect(onZoomIn).not.toHaveBeenCalled();
        expect(onZoomOut).not.toHaveBeenCalled();

        await fire(fireEvent.click(footerIcon('real_size_stroked')));
        await fire(fireEvent.click(footerIcon('rotate')));
        await clickMask();
        onZoomIn.mockClear();
        onZoomOut.mockClear();
        await fire(fireEvent.click(thumbs()[2]));
        expect(previewImg().style.transform).toContain('rotate(0deg)');
        expect(footerIcon('real_size_stroked')).not.toBeNull();
        await fire(fireEvent.load(previewImg()));
        expect(onZoomIn).not.toHaveBeenCalled();
        expect(onZoomOut).not.toHaveBeenCalled();
    });

    it('父组件修改受控 index 时重置 ratio', async () => {
        restoreLayout = mockLayout();
        const onZoomIn = vi.fn<(zoom: number) => void>();
        const { store } = renderPreview({ currentIndex: 0, onZoomIn });
        await fire(fireEvent.load(previewImg()));
        await fire(fireEvent.click(footerIcon('real_size_stroked')));
        onZoomIn.mockClear();
        store.props.currentIndex = 1;
        flushSync();
        expect(footerIcon('real_size_stroked')).not.toBeNull();
        expect(onZoomIn).not.toHaveBeenCalled();
    });

    it('download：onDownload 与 onDownloadError 的载荷，setDownloadName', async () => {
        const fetchMock = stubFailingFetch();
        const onDownload = vi.fn<(src: string, index: number) => void>();
        const onDownloadError = vi.fn<(src: string) => void>();
        const setDownloadName = vi.fn<(src: string) => string>(() => 'x.jpg');
        renderPreview({ currentIndex: 1, setDownloadName, onDownload, onDownloadError });
        await fire(fireEvent.click(footerIcon('download')));
        expect(setDownloadName).toHaveBeenCalledWith(srcList[1]);
        expect(onDownload).toHaveBeenCalledWith(srcList[1], 1);
        expect(fetchMock).toHaveBeenCalledWith(srcList[1]);
        await vi.waitFor(() => expect(onDownloadError).toHaveBeenCalledWith(srcList[1]));
    });

    it('disableDownload 禁用下载按钮与图片的右键菜单', async () => {
        const onDownload = vi.fn<(src: string, index: number) => void>();
        renderPreview({ disableDownload: true, onDownload });
        expect(footerIcon('download')).toHaveClass(`${previewCls}-footer-disabled`);
        await fire(fireEvent.click(footerIcon('download')));
        expect(onDownload).not.toHaveBeenCalled();
        const contextMenu = dispatch(previewImg(), new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
        expect(contextMenu.defaultPrevented).toBe(true);
    });

    it('没有图片时点击下载不调用 setDownloadName，也不调用 onDownload', async () => {
        const fetchMock = stubFailingFetch();
        const onDownload = vi.fn<(src: string, index: number) => void>();
        const setDownloadName = vi.fn<(src: string) => string>(() => 'x.jpg');
        renderPreview({ src: [], setDownloadName, onDownload });
        await fire(fireEvent.click(footerIcon('download')));
        expect(setDownloadName).not.toHaveBeenCalled();
        expect(onDownload).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('操作栏在 viewerVisibleDelay 后隐藏，鼠标移动时重新出现', async () => {
        vi.useFakeTimers();
        renderPreview({ viewerVisibleDelay: 1000 });
        const header = () => $(`.${previewCls}-header`);
        expect(header()).not.toHaveClass(`${previewCls}-hide`);
        vi.advanceTimersByTime(1000);
        flushSync();
        expect(header()).toHaveClass(`${previewCls}-hide`);
        expect($(`.${previewCls}-footer`)).toHaveClass(`${previewCls}-hide`);
        dispatch(getPreview() as HTMLElement, new MouseEvent('mousemove', { bubbles: true }));
        expect(header()).not.toHaveClass(`${previewCls}-hide`);
    });

    it('相同内容的新数组不重新开始 viewerVisibleDelay 计时，内容变化时重新开始', async () => {
        vi.useFakeTimers();
        const { store } = renderPreview({ viewerVisibleDelay: 1000 });
        const footer = () => $(`.${previewCls}-footer`);
        vi.advanceTimersByTime(600);
        store.props.src = [...srcList];
        flushSync();
        vi.advanceTimersByTime(400);
        flushSync();
        expect(footer()).toHaveClass(`${previewCls}-hide`);

        dispatch(getPreview() as HTMLElement, new MouseEvent('mousemove', { bubbles: true }));
        vi.advanceTimersByTime(600);
        store.props.src = [...srcList, 'https://example.com/4.jpg'];
        flushSync();
        vi.advanceTimersByTime(400);
        flushSync();
        expect(footer()).not.toHaveClass(`${previewCls}-hide`);
    });

    it('preLoad：第一张图加载后，依次预加载 preLoadGap 范围内的相邻图片', async () => {
        const created = stubPreloadImage();
        const list = ['a', 'b', 'c', 'd', 'e', 'f'].map((n) => `https://example.com/${n}.jpg`);
        renderPreview({ currentIndex: 2, preLoadGap: 2, src: list });
        await fire(fireEvent.load(previewImg()));
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
        renderPreview({ preLoad: false });
        await fire(fireEvent.load(previewImg()));
        expect(created).toHaveLength(0);
    });

    it('body 滚动：可见时锁定，恢复之前的 overflow；使用 getPopupContainer 时不锁定', async () => {
        document.body.style.overflow = 'auto';
        const { store } = renderGroup({ visible: false });
        store.props.visible = true;
        flushSync();
        expect(document.body.style.overflow).toBe('hidden');
        store.props.visible = false;
        flushSync();
        expect(document.body.style.overflow).toBe('auto');

        const container = document.createElement('div');
        document.body.appendChild(container);
        store.props.getPopupContainer = () => container;
        store.props.visible = true;
        flushSync();
        expect(container.querySelector(`.${previewCls}`)).not.toBeNull();
        expect(getPreview()).toHaveClass(`${previewCls}-popup`);
        expect(document.body.style.overflow).toBe('auto');
        store.props.visible = false;
        flushSync();
        container.remove();
    });

    it('getPopupContainer 返回 body 时与不传一样锁定 body 滚动，且没有 -popup 类', async () => {
        document.body.style.overflow = 'auto';
        const { store } = renderGroup({ getPopupContainer: () => document.body, visible: false });
        store.props.visible = true;
        flushSync();
        expect(document.body.style.overflow).toBe('hidden');
        expect(getPreview()).not.toHaveClass(`${previewCls}-popup`);
        store.props.visible = false;
        flushSync();
        expect(document.body.style.overflow).toBe('auto');
    });

    it('遮罩关闭只排除操作区：自定义 title 内的点击不关闭', async () => {
        renderPreview({}, ['title']);
        await fire(fireEvent.mouseDown($('.custom-title') as HTMLElement, { clientX: 0, clientY: 0 }));
        await fire(fireEvent.mouseUp($('.custom-title') as HTMLElement, { clientX: 0, clientY: 0 }));
        expect(getPreview()).not.toBeNull();
    });

    it('可见时卸载，恢复 body 滚动并移除 Esc 监听，不调用 onVisibleChange', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const view = renderPreview({ onVisibleChange });
        expect(document.body.style.overflow).toBe('hidden');
        view.unmount();
        expect(document.body.style.overflow).toBe('');
        expect(getPreview()).toBeNull();
        await pressEsc();
        expect(onVisibleChange).not.toHaveBeenCalled();
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', async () => {
        semiGlobal.config.overrideDefaultProps = { ImagePreview: { closable: false, zoomStep: 0.5, maxZoom: 2 } };
        restoreLayout = mockLayout();
        renderPreview();
        expect($(`.${previewCls}-header-close`)).toBeNull();
        await fire(fireEvent.load(previewImg()));
        await fire(fireEvent.click(footerIcon('plus')));
        // 0.46 + 0.5, still under maxZoom 2
        expect(previewImg()).toHaveStyle({ width: '1920px' });
        renderPreview({ closable: true });
        expect(document.querySelectorAll(`.${previewCls}-header-close`)).toHaveLength(1);
    });

    it('ConfigProvider 的 getPopupContainer：预览渲染进该容器，非模态，不锁 body', () => {
        render(ConfigFixture, { props: { container: true } });
        flushSync();
        expect($('.preview-container')).toContainElement(getPreview());
        expect(getPreview()).toHaveClass(`${previewCls}-popup`);
        expect(getPreview()).not.toHaveAttribute('aria-modal');
        expect(document.body.style.overflow).toBe('');
    });

    it('自身 getPopupContainer 优先于 ConfigProvider', () => {
        render(ConfigFixture, { props: { container: true, own: () => document.body } });
        flushSync();
        expect(getPreview()).toHaveAttribute('aria-modal', 'true');
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('按钮名称随 ConfigProvider 的语言包', () => {
        render(ConfigFixture, { props: { props: { locale: ja_JP } } });
        flushSync();
        expect(arrow('next')).toHaveAttribute('aria-label', ja_JP.Image.nextTip);
        expect(footerIcon('rotate').closest('button')).toHaveAttribute('aria-label', ja_JP.Image.rotateTip);
        expect(getPreview()).toHaveAttribute('aria-label', ja_JP.Image.preview);
    });

    it('没有名称时分组没有角色，带 aria-label 时为 group 角色，未声明属性落在分组元素上', () => {
        const first = renderPreview({ 'data-x': '1' } as PreviewProps);
        const group = first.container.querySelector(`.${BASE_CLASS_PREFIX}-image-preview-group`) as HTMLElement;
        expect(group).not.toHaveAttribute('role');
        expect(group).toHaveAttribute('data-x', '1');
        first.unmount();
        const second = renderPreview({ 'aria-label': 'photos' } as PreviewProps);
        expect(second.container.querySelector(`.${BASE_CLASS_PREFIX}-image-preview-group`)).toHaveAttribute('role', 'group');
    });
});

describe('Svelte ImagePreview 键盘与屏幕阅读器', () => {
    it('每个控件都是以语言包命名的原生按钮，缩放滑块也有名称', async () => {
        renderPreview({ currentIndex: 1 });
        const dialog = getPreview() as HTMLElement;
        const { Image: names } = zh_CN;
        for (const name of [names.close, names.prevTip, names.nextTip, names.zoomInTip, names.zoomOutTip, names.rotateTip, names.downloadTip, names.originTip]) {
            expect(within(dialog).getAllByRole('button', { name }).length).toBeGreaterThan(0);
        }
        // the ratio button names the size it switches to
        await fire(fireEvent.click(within(dialog).getByRole('button', { name: names.originTip })));
        expect(within(dialog).getByRole('button', { name: names.adaptiveTip })).toBeInTheDocument();
        for (const button of within(dialog).getAllByRole('button')) {
            expect(button.tagName).toBe('BUTTON');
            expect(button.getAttribute('aria-label')).toBeTruthy();
        }
        expect(within(dialog).getByRole('slider', { name: names.zoom })).toBeInTheDocument();
    });

    it('tip 属性为按钮命名', () => {
        renderPreview({ currentIndex: 1, prevTip: 'back', nextTip: 'forward', rotateTip: 'turn' });
        expect(arrow('prev')).toHaveAttribute('aria-label', 'back');
        expect(arrow('next')).toHaveAttribute('aria-label', 'forward');
        expect(footerIcon('rotate').closest('button')).toHaveAttribute('aria-label', 'turn');
    });

    it('禁用的底部按钮仍可聚焦，报告 aria-disabled 且无操作', async () => {
        const onPrev = vi.fn<(index: number) => void>();
        renderPreview({ onPrev });
        const prev = footerIcon('chevron_left').closest('button') as HTMLButtonElement;
        expect(prev).toHaveAttribute('aria-disabled', 'true');
        expect(prev).not.toBeDisabled();
        await fire(fireEvent.click(prev));
        expect(onPrev).not.toHaveBeenCalled();
    });

    it('预览为模态对话框，以标题命名，无标题时以语言包命名', () => {
        const first = renderPreview({ previewTitle: 'Gallery' });
        const dialog = getPreview() as HTMLElement;
        expect(dialog).toHaveAttribute('role', 'dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby', $(`.${previewCls}-header-title`)?.id);
        expect(dialog).not.toHaveAttribute('aria-label');
        first.unmount();
        renderPreview();
        expect(getPreview()).toHaveAttribute('aria-label', zh_CN.Image.preview);
        expect(getPreview()).not.toHaveAttribute('aria-labelledby');
    });

    it('title 片段只替换标题文字，对话框名称不变', () => {
        renderPreview({ previewTitle: 'Gallery' }, ['title']);
        expect(getPreview()).toHaveAttribute('aria-labelledby', $(`.${previewCls}-header-title`)?.id);
        expect($(`.${previewCls}-header-title`)?.textContent).toBe('0:Gallery');
    });

    it('ArrowLeft 与 ArrowRight 切换图片；与按钮一致，除非 infinite，否则首尾停止', () => {
        const { store } = renderPreview();
        press('ArrowLeft');
        expect(pageInfo()).toBe('1/3');
        press('ArrowRight');
        press('ArrowRight');
        expect(pageInfo()).toBe('3/3');
        press('ArrowRight');
        expect(pageInfo()).toBe('3/3');
        store.props.infinite = true;
        flushSync();
        press('ArrowRight');
        expect(pageInfo()).toBe('1/3');
    });

    it('单张图片时不切换', () => {
        renderPreview({ src: [srcList[0]] });
        const event = press('ArrowRight');
        expect(event.defaultPrevented).toBe(false);
        expect(pageInfo()).toBe('1/1');
    });

    it('输入框与带修饰键的方向键保留其行为', () => {
        renderPreview();
        const input = document.createElement('input');
        document.body.appendChild(input);
        input.focus();
        expect(press('ArrowRight', {}, input).defaultPrevented).toBe(false);
        expect(pageInfo()).toBe('1/3');
        input.remove();
        expect(press('ArrowRight', { altKey: true }, getPreview() as HTMLElement).defaultPrevented).toBe(false);
        expect(pageInfo()).toBe('1/3');
    });

    it('预览之外的控件上的方向键不切换图片也不被拦截', () => {
        renderPreview();
        const outside = document.createElement('button');
        document.body.appendChild(outside);
        const event = press('ArrowRight', {}, outside);
        expect(event.defaultPrevented).toBe(false);
        expect(pageInfo()).toBe('1/3');
        outside.remove();
    });

    it('焦点落在隐藏的操作上时重新显示操作栏', async () => {
        vi.useFakeTimers();
        renderPreview({ viewerVisibleDelay: 1000 });
        vi.advanceTimersByTime(1000);
        flushSync();
        expect($(`.${previewCls}-footer`)).toHaveClass(`${previewCls}-hide`);
        await fire(fireEvent.focusIn(footerIcon('rotate').closest('button') as HTMLElement));
        expect($(`.${previewCls}-footer`)).not.toHaveClass(`${previewCls}-hide`);
    });

    it('非主按钮的按下与抬起不关闭预览', async () => {
        renderPreview();
        await fire(fireEvent.mouseDown(getPreview() as HTMLElement, { button: 2, clientX: 0, clientY: 0 }));
        await fire(fireEvent.mouseUp(getPreview() as HTMLElement, { button: 2, clientX: 0, clientY: 0 }));
        expect(getPreview()).not.toBeNull();
    });
});
