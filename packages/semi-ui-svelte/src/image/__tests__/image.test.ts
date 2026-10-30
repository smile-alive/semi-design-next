import { flushSync } from 'svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { ImageProps } from '../interface';
import GroupFixture from './group-fixture.svelte';
import { $, clickMask, dispatch, fire, footerIcon, getPreview, pressEsc, prefixCls, previewImg, srcList, thumbs } from './helpers';
import ImageFixture from './image-fixture.svelte';

const src = 'https://example.com/a.jpg';
const thumb = (container: Element) => container.querySelector(`.${prefixCls}-img`) as HTMLImageElement;
const root = (container: Element) => container.firstElementChild as HTMLElement;

function renderImage(props: ImageProps = {}, snippets: string[] = []) {
    const store = createStore<{ props: ImageProps; snippets: string[] }>({ props: { src, ...props }, snippets });
    const view = render(ImageFixture, { props: { store } });
    return { ...view, store };
}

async function loaded(props: ImageProps = {}) {
    const view = renderImage(props);
    await fire(fireEvent.load(thumb(view.container)));
    return view;
}

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
    document.body.style.overflow = '';
    document.body.style.paddingInlineEnd = '';
});

describe('Svelte Image', () => {
    it('自定义 imgCls 与 imgStyle', () => {
        const { container } = renderImage({ imgStyle: 'max-width: 300px', imgCls: 'custom-img-cls' });
        expect(thumb(container)).toHaveClass('custom-img-cls');
        expect(thumb(container)).toHaveStyle({ maxWidth: '300px' });
    });

    it('根元素与 img 结构：width、height、class、style、alt、crossOrigin', () => {
        const { container } = renderImage({ class: 'root-cls', style: 'color: red', alt: 'cat', crossOrigin: 'anonymous', height: 80, width: 120 });
        expect(root(container)).toHaveClass(prefixCls, 'root-cls');
        expect(root(container)).toHaveStyle({ width: '120px', height: '80px', color: 'rgb(255, 0, 0)' });
        const img = thumb(container);
        expect(img).toHaveAttribute('src', src);
        expect(img).toHaveAttribute('data-src', src);
        expect(img).toHaveAttribute('alt', 'cat');
        expect(img).toHaveAttribute('width', '120');
        expect(img).toHaveAttribute('height', '80');
        expect(img).toHaveAttribute('crossorigin', 'anonymous');
        expect(img).not.toHaveClass('root-cls');
    });

    it('使用方的 style 覆盖根元素的 width 与 height', () => {
        const { container } = renderImage({ style: 'width: 50%', width: 120 });
        expect(root(container)).toHaveStyle({ width: '50%' });
    });

    it('加载时显示骨架屏，随后遮罩消失并调用 onLoad', async () => {
        const onLoad = vi.fn<(event: Event) => void>();
        const { container } = renderImage({ height: 100, width: 100, onLoad });
        expect(container.querySelector(`.${prefixCls}-overlay .${BASE_CLASS_PREFIX}-skeleton-image`)).not.toBeNull();
        expect(thumb(container)).not.toHaveClass(`${prefixCls}-img-preview`);
        await fire(fireEvent.load(thumb(container)));
        expect(onLoad).toHaveBeenCalledTimes(1);
        expect(onLoad.mock.calls[0][0].type).toBe('load');
        expect(container.querySelector(`.${prefixCls}-overlay`)).toBeNull();
        expect(thumb(container)).toHaveClass(`${prefixCls}-img-preview`);
    });

    it('加载时 placeholder 片段替代骨架屏', () => {
        const { container } = renderImage({}, ['placeholder']);
        expect(container.querySelector(`.${prefixCls}-status .ph`)).not.toBeNull();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-skeleton-image`)).toBeNull();
    });

    it('出错时显示默认图标并调用 onError', async () => {
        const onError = vi.fn<(event: Event) => void>();
        const { container } = renderImage({ onError });
        await fire(fireEvent.error(thumb(container)));
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0].type).toBe('error');
        expect(container.querySelector(`.${prefixCls}-status .${BASE_CLASS_PREFIX}-icon-upload_error`)).not.toBeNull();
        expect(thumb(container)).toHaveClass(`${prefixCls}-img-error`);
    });

    it('fallback 字符串渲染为 img，fallback 片段原样渲染并优先', async () => {
        const first = renderImage({ fallback: 'https://example.com/fallback.jpg' });
        await fire(fireEvent.error(thumb(first.container)));
        const fallbackImg = first.container.querySelector(`.${prefixCls}-status img`);
        expect(fallbackImg).toHaveAttribute('src', 'https://example.com/fallback.jpg');
        expect(fallbackImg).toHaveAttribute('alt', zh_CN.Image.fallback);
        first.unmount();

        const second = renderImage({ fallback: 'https://example.com/fallback.jpg' }, ['fallback']);
        await fire(fireEvent.error(thumb(second.container)));
        expect(second.container.querySelector(`.${prefixCls}-status .fb`)).not.toBeNull();
        expect(second.container.querySelector(`.${prefixCls}-status img`)).toBeNull();
    });

    it('新的 src 重新开始加载', async () => {
        const { container, store } = renderImage();
        await fire(fireEvent.error(thumb(container)));
        expect(thumb(container)).toHaveClass(`${prefixCls}-img-error`);
        store.props.src = 'https://example.com/b.jpg';
        flushSync();
        expect(thumb(container)).not.toHaveClass(`${prefixCls}-img-error`);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-skeleton-image`)).not.toBeNull();
        await fire(fireEvent.load(thumb(container)));
        expect(container.querySelector(`.${prefixCls}-overlay`)).toBeNull();
    });

    it('点击已加载的图片打开预览，点击遮罩关闭；Esc 关闭后恢复 body 滚动', async () => {
        const onclick = vi.fn<(event: MouseEvent) => void>();
        const { container } = renderImage({ onclick });
        await fire(fireEvent.click(thumb(container)));
        expect(getPreview()).toBeNull();
        expect(onclick).toHaveBeenCalledTimes(1);

        await fire(fireEvent.load(thumb(container)));
        await fire(fireEvent.click(thumb(container)));
        expect(getPreview()).not.toBeNull();
        expect(previewImg()).toHaveAttribute('src', src);
        expect(document.body.style.overflow).toBe('hidden');

        await clickMask();
        expect(getPreview()).toBeNull();
        expect(document.body.style.overflow).toBe('');

        await fire(fireEvent.click(thumb(container)));
        expect(document.body.style.overflow).toBe('hidden');
        await pressEsc();
        expect(getPreview()).toBeNull();
        expect(document.body.style.overflow).toBe('');
    });

    it('加载完成前或加载失败时点击缩略图不记入打开状态，加载后预览不会自动弹出', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const { container, store } = renderImage({ preview: { onVisibleChange } });
        await fire(fireEvent.click(thumb(container)));
        await fire(fireEvent.load(thumb(container)));
        expect(getPreview()).toBeNull();
        expect(onVisibleChange).not.toHaveBeenCalled();

        store.props.src = 'https://example.com/b.jpg';
        flushSync();
        await fire(fireEvent.error(thumb(container)));
        await fire(fireEvent.click(thumb(container)));
        expect(onVisibleChange).not.toHaveBeenCalled();
        store.props.src = 'https://example.com/c.jpg';
        flushSync();
        await fire(fireEvent.load(thumb(container)));
        expect(getPreview()).toBeNull();
        expect(document.body.style.overflow).toBe('');
    });

    it('预览内的点击不会冒泡回缩略图而重复通知打开', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const { container } = await loaded({ preview: { onVisibleChange } });
        await fire(fireEvent.click(thumb(container)));
        expect(onVisibleChange).toHaveBeenCalledTimes(1);
        await fire(fireEvent.click(footerIcon('plus')));
        expect(onVisibleChange).toHaveBeenCalledTimes(1);
        expect(getPreview()).not.toBeNull();
    });

    it('键盘打开预览时与鼠标点击一样调用 onclick', async () => {
        const onclick = vi.fn<(event: MouseEvent) => void>();
        const { container } = await loaded({ onclick });
        await fire(fireEvent.keyDown(root(container), { key: 'Enter' }));
        expect(onclick).toHaveBeenCalledTimes(1);
        expect(onclick.mock.calls[0][0].type).toBe('click');
        expect(getPreview()).not.toBeNull();
    });

    it('缩略图重新加载不会卸载已打开的预览，受控 visible 不必等缩略图加载', async () => {
        const { container, store } = renderImage({ preview: { visible: true } });
        expect(getPreview()).not.toBeNull();
        store.props.src = 'https://example.com/b.jpg';
        flushSync();
        expect(getPreview()).not.toBeNull();
        await fire(fireEvent.load(thumb(container)));
        expect(getPreview()).not.toBeNull();
    });

    it('已加载的缩略图是可聚焦按钮，Enter 与 Space 可打开，预览图使用其 alt', async () => {
        const { container } = await loaded({ alt: 'cat' });
        const button = root(container);
        expect(button).toHaveAttribute('role', 'button');
        expect(button).toHaveAttribute('tabindex', '0');
        expect(button).toHaveAttribute('aria-haspopup', 'dialog');
        expect(button).not.toHaveAttribute('aria-label');
        const event = dispatch(button, new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
        expect(event.defaultPrevented).toBe(true);
        expect(getPreview()).not.toBeNull();
        expect(previewImg()).toHaveAttribute('alt', 'cat');
    });

    it('没有 alt 的缩略图按钮从语言包取名', async () => {
        const { container } = await loaded();
        expect(root(container)).toHaveAttribute('aria-label', zh_CN.Image.preview);
    });

    it('preview 为 false 时缩略图不在 Tab 顺序中，也永不打开', async () => {
        const { container } = await loaded({ preview: false });
        expect(root(container)).not.toHaveAttribute('role');
        expect(root(container)).not.toHaveAttribute('tabindex');
        await fire(fireEvent.click(thumb(container)));
        expect(getPreview()).toBeNull();
    });

    it('preview 对象：src、previewCls、previewStyle、crossOrigin 与受控的 visible', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const { container, store } = renderImage({ preview: { src: 'https://example.com/big.jpg', previewCls: 'custom-preview', previewStyle: 'color: red', crossOrigin: 'anonymous', visible: true, onVisibleChange } });
        expect(getPreview()).toHaveClass('custom-preview');
        expect(getPreview()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(previewImg()).toHaveAttribute('src', 'https://example.com/big.jpg');
        expect(previewImg()).toHaveAttribute('crossorigin', 'anonymous');
        await clickMask();
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
        expect(getPreview()).not.toBeNull();
        store.props.preview = { visible: false };
        flushSync();
        expect(getPreview()).toBeNull();
        expect(thumb(container)).toBeTruthy();
    });

    it('不带 visible 的 preview 对象为非受控，回调每次只调用一次', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const { container } = await loaded({ preview: { onVisibleChange } });
        await fire(fireEvent.click(thumb(container)));
        expect(onVisibleChange).toHaveBeenCalledTimes(1);
        expect(onVisibleChange).toHaveBeenLastCalledWith(true);
        await clickMask();
        expect(onVisibleChange).toHaveBeenCalledTimes(2);
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
        expect(getPreview()).toBeNull();
    });

    it('受控 visible 改回非受控时从最后的受控值继续', async () => {
        const { container, store } = await loaded({ preview: { visible: true } });
        expect(getPreview()).not.toBeNull();
        store.props.preview = {};
        flushSync();
        expect(getPreview()).not.toBeNull();
        await clickMask();
        expect(getPreview()).toBeNull();
        await fire(fireEvent.click(thumb(container)));
        expect(getPreview()).not.toBeNull();
    });

    it('preview 对象里的其他回调收到预览的事件', async () => {
        const onChange = vi.fn<(index: number) => void>();
        const onNext = vi.fn<(index: number) => void>();
        const onZoomIn = vi.fn<(zoom: number) => void>();
        const onClose = vi.fn<() => void>();
        await loaded({ preview: { src: srcList, visible: true, onChange, onNext, onZoomIn, onClose } });
        await fire(fireEvent.click($('.semi-image-preview-next') as HTMLElement));
        expect(onChange).toHaveBeenCalledWith(1);
        expect(onNext).toHaveBeenCalledWith(1);
        await fire(fireEvent.click(footerIcon('plus')));
        expect(onZoomIn).toHaveBeenCalledTimes(1);
        await pressEsc();
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('data-*、loading 与 click 监听落在 img 上，class 与 style 落在根元素', async () => {
        const onclick = vi.fn<(event: MouseEvent) => void>();
        const { container } = await loaded({ 'data-x': '1', loading: 'lazy', onclick, class: 'root-cls' } as ImageProps);
        expect(thumb(container)).toHaveAttribute('data-x', '1');
        expect(thumb(container)).toHaveAttribute('loading', 'lazy');
        expect(root(container)).not.toHaveAttribute('data-x');
        await fire(fireEvent.click(thumb(container)));
        expect(onclick).toHaveBeenCalledTimes(1);
    });

    it('读取 semiGlobal overrideDefaultProps，实例的属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { Image: { alt: 'global alt', imgCls: 'global-cls' } };
        const first = renderImage();
        expect(thumb(first.container)).toHaveAttribute('alt', 'global alt');
        expect(thumb(first.container)).toHaveClass('global-cls');
        first.unmount();
        const second = renderImage({ alt: 'own alt' });
        expect(thumb(second.container)).toHaveAttribute('alt', 'own alt');
    });

    it('读取函数类全局默认值 setDownloadName', async () => {
        const fetchMock = vi.fn<(src: string) => Promise<{ ok: boolean }>>(() => Promise.resolve({ ok: false }));
        vi.stubGlobal('fetch', fetchMock);
        const setDownloadName = vi.fn<(src: string) => string>(() => 'x.jpg');
        semiGlobal.config.overrideDefaultProps = { Image: { setDownloadName } };
        const { container } = await loaded();
        await fire(fireEvent.click(thumb(container)));
        await fire(fireEvent.click(footerIcon('download')));
        expect(setDownloadName).toHaveBeenCalledWith(src);
        vi.unstubAllGlobals();
    });
});

describe('Svelte Image 单图预览的片段', () => {
    it('title、closeIcon、leftIcon、rightIcon、previewMenu 转发给单图预览', async () => {
        const { container } = renderImage({ preview: { src: srcList, visible: true, previewTitle: 'T' } }, ['title', 'closeIcon', 'leftIcon', 'rightIcon', 'previewMenu']);
        expect(container).toBeTruthy();
        expect($('.custom-title')?.textContent).toBe('0:T');
        expect($('.custom-close')).not.toBeNull();
        expect($('.custom-menu')?.textContent).toContain('1/3');
        await fire(fireEvent.click($('.semi-image-preview-next') as HTMLElement));
        expect($('.custom-right')).not.toBeNull();
        expect($('.custom-left')?.textContent).toBe('L1');
    });

    it('未传片段时预览显示默认标题、图标与操作栏', () => {
        renderImage({ preview: { src: srcList, visible: true, previewTitle: 'T' } });
        expect($('.semi-image-preview-header-title')?.textContent).toBe('T');
        expect($(`.${BASE_CLASS_PREFIX}-icon-close`)).not.toBeNull();
        expect($('.semi-image-preview-footer-page')?.textContent?.trim()).toBe('1/3');
        expect($('.custom-menu')).toBeNull();
    });

    it('撤回片段后预览回到默认内容', () => {
        const { store } = renderImage({ preview: { src: srcList, visible: true } }, ['closeIcon', 'previewMenu']);
        expect($('.custom-menu')).not.toBeNull();
        store.snippets = [];
        flushSync();
        expect($('.custom-menu')).toBeNull();
        expect($('.custom-close')).toBeNull();
        expect($(`.${BASE_CLASS_PREFIX}-icon-close`)).not.toBeNull();
    });
});

describe('Svelte Image 在分组内', () => {
    const group = (extra: Record<string, unknown> = {}, images: ImageProps[] = srcList.map((url) => ({ src: url }))) => {
        const store = createStore({ props: { src: srcList, ...extra }, images, snippets: [] as string[] });
        const view = render(GroupFixture, { props: { store } });
        return { ...view, store };
    };

    it('分组内尚未加载的缩略图同样是可聚焦按钮，Enter 打开分组预览', async () => {
        group();
        const first = thumbs()[1].parentElement as HTMLElement;
        expect(first).toHaveAttribute('role', 'button');
        await fire(fireEvent.keyDown(first, { key: 'Enter' }));
        expect(getPreview()).not.toBeNull();
        expect(previewImg()).toHaveAttribute('src', srcList[1]);
    });

    it('分组内 preview 为 false 的缩略图不是按钮，src 不在列表中的缩略图单独预览', async () => {
        group({}, [{ src: srcList[0], preview: false }, { src: 'https://example.com/other.jpg' }]);
        expect(thumbs()[0].parentElement).not.toHaveAttribute('role');
        await fire(fireEvent.load(thumbs()[1]));
        await fire(fireEvent.click(thumbs()[1]));
        expect(previewImg()).toHaveAttribute('src', 'https://example.com/other.jpg');
        expect($('.semi-image-preview-footer-page')?.textContent?.trim()).toBe('1/1');
    });

    it('分组内的 Image 片段不生效', async () => {
        group();
        await fire(fireEvent.click(thumbs()[0]));
        expect($('.custom-menu')).toBeNull();
    });

    it('懒加载分组中 img 没有 src 属性，等待 observer；lazyLoad 为 false 时直接加载', () => {
        const first = group();
        expect(thumbs()[0]).not.toHaveAttribute('src');
        expect(thumbs()[0]).toHaveAttribute('data-src', srcList[0]);
        first.unmount();
        group({ lazyLoad: false });
        expect(thumbs()[0]).toHaveAttribute('src', srcList[0]);
    });
});
