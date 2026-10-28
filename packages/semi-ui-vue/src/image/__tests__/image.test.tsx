/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowRef, type ComponentPublicInstance } from 'vue';
import { fireEvent, screen } from '@testing-library/vue';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { render } from '@test/utils/vue';
import Image, { ImagePreview, type ImagePreviewProps, type ImageProps } from '..';
import semiGlobal from '../../_utils/semi-global';

const prefixCls = `${BASE_CLASS_PREFIX}-image`;
const src = 'https://example.com/a.jpg';
const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
const preview = () => $(`div.${prefixCls}-preview`);
const previewImg = () => $(`.${prefixCls}-preview-image-img`);
const thumb = (container: Element) => container.querySelector(`.${prefixCls}-img`) as HTMLImageElement;
const root = (container: Element) => container.firstElementChild as HTMLElement;

const renderImage = (props: Record<string, unknown> = {}, slots: Record<string, () => unknown> = {}) => render(Image, { props: { src, ...props }, slots });
const loaded = async (props: Record<string, unknown> = {}) => {
    const view = renderImage(props);
    await fireEvent.load(thumb(view.container));
    return view;
};
const clickMask = async () => {
    await fireEvent.mouseDown(preview() as HTMLElement, { clientX: 10, clientY: 10 });
    await fireEvent.mouseUp(preview() as HTMLElement, { clientX: 10, clientY: 10 });
};
const pressEsc = () => fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
// VTL's fireEvent does not return whether the default was prevented
const dispatchKey = async (target: Element, key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    await nextTick();
    return event;
};

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
    document.body.style.overflow = '';
    document.body.style.paddingInlineEnd = '';
});

describe('Image', () => {
    it('自定义 imgCls 与 imgStyle', () => {
        const { container } = renderImage({ imgStyle: { maxWidth: '300px' }, imgCls: 'custom-img-cls' });
        expect(thumb(container)).toHaveClass('custom-img-cls');
        expect(thumb(container)).toHaveStyle({ maxWidth: '300px' });
    });

    it('根元素与 img 结构：width、height、class、style、alt、crossOrigin', () => {
        const { container } = renderImage({
            class: 'root-cls',
            style: { color: 'red' },
            alt: 'cat',
            crossOrigin: 'anonymous',
            height: 80,
            width: 120,
        });
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
        const { container } = renderImage({ style: { width: '50%' }, width: 120 });
        expect(root(container)).toHaveStyle({ width: '50%' });
    });

    it('加载时显示骨架屏，随后遮罩消失并发出 load 事件', async () => {
        const onLoad = vi.fn<(event: Event) => void>();
        const { container } = renderImage({ height: 100, width: 100, onLoad });
        expect(container.querySelector(`.${prefixCls}-overlay .${BASE_CLASS_PREFIX}-skeleton-image`)).not.toBeNull();
        expect(thumb(container)).not.toHaveClass(`${prefixCls}-img-preview`);
        await fireEvent.load(thumb(container));
        expect(onLoad).toHaveBeenCalledTimes(1);
        expect(onLoad.mock.calls[0][0]).toBeInstanceOf(Event);
        expect(onLoad.mock.calls[0][0].type).toBe('load');
        expect(container.querySelector(`.${prefixCls}-overlay`)).toBeNull();
        expect(thumb(container)).toHaveClass(`${prefixCls}-img-preview`);
    });

    it('加载时 #placeholder 插槽替代骨架屏', () => {
        const { container } = renderImage({}, { placeholder: () => <span class="ph">loading</span> });
        expect(container.querySelector(`.${prefixCls}-status .ph`)).not.toBeNull();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-skeleton-image`)).toBeNull();
    });

    it('出错时显示默认图标并发出 error 事件', async () => {
        const onError = vi.fn<(event: Event) => void>();
        const { container } = renderImage({ onError });
        await fireEvent.error(thumb(container));
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0].type).toBe('error');
        expect(container.querySelector(`.${prefixCls}-status .${BASE_CLASS_PREFIX}-icon-upload_error`)).not.toBeNull();
        expect(thumb(container)).toHaveClass(`${prefixCls}-img-error`);
    });

    it('fallback 字符串渲染为 img，#fallback 插槽原样渲染', async () => {
        const first = renderImage({ fallback: 'https://example.com/fallback.jpg' });
        await fireEvent.error(thumb(first.container));
        const fallbackImg = first.container.querySelector(`.${prefixCls}-status img`);
        expect(fallbackImg).toHaveAttribute('src', 'https://example.com/fallback.jpg');
        expect(fallbackImg).toHaveAttribute('alt', zh_CN.Image.fallback);
        first.unmount();

        const second = renderImage({}, { fallback: () => <span class="fb">failed</span> });
        await fireEvent.error(thumb(second.container));
        expect(second.container.querySelector(`.${prefixCls}-status .fb`)).not.toBeNull();
    });

    it('#fallback 插槽优先于 fallback 字符串', async () => {
        const { container } = renderImage({ fallback: 'https://example.com/fallback.jpg' }, { fallback: () => <span class="fb">failed</span> });
        await fireEvent.error(thumb(container));
        expect(container.querySelector(`.${prefixCls}-status .fb`)).not.toBeNull();
        expect(container.querySelector(`.${prefixCls}-status img`)).toBeNull();
    });

    it('新的 src 重新开始加载', async () => {
        const view = renderImage();
        const { container } = view;
        await fireEvent.error(thumb(container));
        expect(thumb(container)).toHaveClass(`${prefixCls}-img-error`);
        await view.rerender({ src: 'https://example.com/b.jpg' });
        expect(thumb(container)).not.toHaveClass(`${prefixCls}-img-error`);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-skeleton-image`)).not.toBeNull();
        await fireEvent.load(thumb(container));
        expect(container.querySelector(`.${prefixCls}-overlay`)).toBeNull();
    });

    it('点击已加载的图片打开预览，点击遮罩关闭；Esc 关闭后恢复 body 滚动', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const { container } = renderImage({ onClick });
        await fireEvent.click(thumb(container));
        expect(preview()).toBeNull();
        expect(onClick).toHaveBeenCalledTimes(1);

        await fireEvent.load(thumb(container));
        await fireEvent.click(thumb(container));
        expect(preview()).not.toBeNull();
        expect(previewImg()).toHaveAttribute('src', src);
        expect(document.body.style.overflow).toBe('hidden');

        await clickMask();
        expect(preview()).toBeNull();
        expect(document.body.style.overflow).toBe('');

        await fireEvent.click(thumb(container));
        expect(document.body.style.overflow).toBe('hidden');
        await pressEsc();
        expect(preview()).toBeNull();
        expect(document.body.style.overflow).toBe('');
    });

    it('加载完成前或加载失败时点击缩略图不记入打开状态，加载后预览不会自动弹出', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const view = renderImage({ preview: { onVisibleChange } });
        const { container } = view;
        await fireEvent.click(thumb(container));
        await fireEvent.load(thumb(container));
        expect(preview()).toBeNull();
        expect(onVisibleChange).not.toHaveBeenCalled();

        await view.rerender({ src: 'https://example.com/b.jpg' });
        await fireEvent.error(thumb(container));
        await fireEvent.click(thumb(container));
        expect(onVisibleChange).not.toHaveBeenCalled();
        await view.rerender({ src: 'https://example.com/c.jpg' });
        await fireEvent.load(thumb(container));
        expect(preview()).toBeNull();
        expect(document.body.style.overflow).toBe('');
    });

    it('预览内的点击不会冒泡回缩略图而重复通知打开', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const { container } = await loaded({ preview: { onVisibleChange } });
        await fireEvent.click(thumb(container));
        expect(onVisibleChange).toHaveBeenCalledTimes(1);
        await fireEvent.click($(`.${prefixCls}-preview-footer .${BASE_CLASS_PREFIX}-icon-plus`) as HTMLElement);
        expect(onVisibleChange).toHaveBeenCalledTimes(1);
        expect(preview()).not.toBeNull();
    });

    it('键盘打开预览时与鼠标点击一样调用 onClick', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const { container } = await loaded({ onClick });
        await fireEvent.keyDown(root(container), { key: 'Enter' });
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].type).toBe('click');
        expect(preview()).not.toBeNull();
    });

    it('缩略图重新加载不会卸载已打开的预览，受控 visible 不必等缩略图加载', async () => {
        const view = renderImage({ preview: { visible: true } });
        await nextTick();
        expect(preview()).not.toBeNull();
        await fireEvent.load(thumb(view.container));
        await view.rerender({ src: 'https://example.com/b.jpg' });
        expect(preview()).not.toBeNull();
        expect(previewImg()).toHaveAttribute('src', 'https://example.com/b.jpg');
        view.unmount();

        const second = await loaded();
        await fireEvent.click(thumb(second.container));
        await second.rerender({ src: 'https://example.com/c.jpg' });
        expect(previewImg()).toHaveAttribute('src', 'https://example.com/c.jpg');
    });

    it('缩略图未加载时受控 visible 由 true 改为 false，焦点回到打开它的元素', async () => {
        const visible = shallowRef(false);
        const Host = defineComponent({
            setup: () => () => (
                <div>
                    <button type="button">open</button>
                    <Image src={src} preview={{ visible: visible.value }} />
                </div>
            ),
        });
        const view = render(Host);
        const opener = view.getByRole('button', { name: 'open' });
        opener.focus();
        visible.value = true;
        await nextTick();
        await nextTick();
        expect(preview()).not.toBeNull();
        expect(opener).not.toHaveFocus();
        visible.value = false;
        await nextTick();
        await nextTick();
        expect(preview()).toBeNull();
        expect(opener).toHaveFocus();
    });

    it('已加载的缩略图是可聚焦按钮，Enter 与 Space 可打开，预览图使用其 alt', async () => {
        const { container } = renderImage({ alt: 'a lamp' });
        expect(root(container)).not.toHaveAttribute('role');
        expect(root(container)).not.toHaveAttribute('tabindex');

        await fireEvent.load(thumb(container));
        expect(root(container)).toHaveAttribute('role', 'button');
        expect(root(container)).toHaveAttribute('tabindex', '0');
        expect(root(container)).toHaveAttribute('aria-haspopup', 'dialog');
        await fireEvent.keyDown(root(container), { key: 'a' });
        expect(preview()).toBeNull();
        await fireEvent.keyDown(root(container), { key: 'Enter' });
        expect(preview()).not.toBeNull();
        expect(previewImg()).toHaveAttribute('alt', 'a lamp');
        await pressEsc();
        expect(preview()).toBeNull();
        expect((await dispatchKey(root(container), ' ')).defaultPrevented).toBe(true);
        expect(preview()).not.toBeNull();
    });

    it('没有 alt 的缩略图按钮从语言包取名，有 alt 的按钮由图片命名', async () => {
        const { container } = render(() => (
            <>
                <Image src={src} />
                <Image alt="a lamp" src={`${src}?b`} />
            </>
        ));
        for (const img of container.querySelectorAll('img')) {
            await fireEvent.load(img);
        }
        expect(screen.getByRole('button', { name: '预览' })).toBe(container.firstElementChild);
        expect(screen.getByRole('button', { name: 'a lamp' })).not.toHaveAttribute('aria-label');
    });

    it(':preview="false" 时缩略图不在 Tab 顺序中，也永不打开', async () => {
        const { container } = await loaded({ preview: false });
        expect(root(container)).not.toHaveAttribute('role');
        expect(root(container)).not.toHaveAttribute('tabindex');
        expect(thumb(container)).not.toHaveClass(`${prefixCls}-img-preview`);
        await fireEvent.click(thumb(container));
        expect(preview()).toBeNull();
    });

    it('preview 对象：src、previewCls、previewStyle、crossOrigin 与受控的 visible', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const big = 'https://example.com/big.jpg';
        const previewOf = (visible: boolean) => ({
            src: big,
            visible,
            onVisibleChange,
            previewCls: 'my-preview',
            previewStyle: { color: 'red' },
        });
        const view = await loaded({ crossOrigin: 'use-credentials', preview: previewOf(false) });
        const { container } = view;
        await fireEvent.click(thumb(container));
        expect(onVisibleChange).toHaveBeenCalledWith(true);
        expect(preview()).toBeNull();

        await view.rerender({ preview: previewOf(true) });
        await nextTick();
        expect(preview()).toHaveClass('my-preview');
        expect(preview()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(previewImg()).toHaveAttribute('src', big);
        expect(previewImg()).toHaveAttribute('crossorigin', 'use-credentials');

        await fireEvent.mouseDown(preview() as HTMLElement, { clientX: 0, clientY: 0 });
        await fireEvent.mouseUp(preview() as HTMLElement, { clientX: 0, clientY: 0 });
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
        expect(preview()).not.toBeNull();

        await view.rerender({ preview: previewOf(false) });
        expect(preview()).toBeNull();
    });

    it('preview 对象的 defaultCurrentIndex 决定首次打开的图片', async () => {
        const srcList = ['https://example.com/1.jpg', 'https://example.com/2.jpg', 'https://example.com/3.jpg'];
        const { container } = await loaded({ preview: { src: srcList, defaultCurrentIndex: 2 } });
        await fireEvent.click(thumb(container));
        expect(previewImg()).toHaveAttribute('src', srcList[2]);
        expect($(`.${prefixCls}-preview-footer-page`)).toHaveTextContent('3/3');
    });

    it('不带 visible 的 preview 对象为非受控，回调每次只调用一次', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const { container } = await loaded({ preview: { onVisibleChange } });
        await fireEvent.click(thumb(container));
        expect(onVisibleChange).toHaveBeenCalledTimes(1);
        expect(onVisibleChange).toHaveBeenCalledWith(true);
        expect(preview()).not.toBeNull();
        await clickMask();
        expect(onVisibleChange.mock.calls).toEqual([[true], [false]]);
        expect(preview()).toBeNull();
    });

    it('preview.visible 为 null 时是受控的隐藏，点击只通知', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const view = await loaded({ preview: { onVisibleChange } });
        const { container } = view;
        await fireEvent.click(thumb(container));
        expect(preview()).not.toBeNull();

        // null is outside the declared type on purpose: it is a controlled value at runtime
        await view.rerender({ preview: { visible: null as unknown as boolean, onVisibleChange } });
        expect(preview()).toBeNull();
        await fireEvent.click(thumb(container));
        expect(onVisibleChange).toHaveBeenLastCalledWith(true);
        expect(preview()).toBeNull();
    });

    it('受控 visible 改回非受控时从最后的受控值继续', async () => {
        const view = await loaded({ preview: { visible: true } });
        const { container } = view;
        await nextTick();
        expect(preview()).not.toBeNull();
        await view.rerender({ preview: {} });
        expect(preview()).not.toBeNull();
        await clickMask();
        expect(preview()).toBeNull();
        await fireEvent.click(thumb(container));
        expect(preview()).not.toBeNull();
    });

    it('preview 对象里的其他回调收到预览的事件', async () => {
        const onZoomIn = vi.fn<(zoom: number) => void>();
        const onClose = vi.fn<() => void>();
        const onNext = vi.fn<(index: number) => void>();
        const onChange = vi.fn<(index: number) => void>();
        const srcList = ['https://example.com/1.jpg', 'https://example.com/2.jpg'];
        const { container } = await loaded({ preview: { src: srcList, onZoomIn, onClose, onNext, onChange } });
        await fireEvent.click(thumb(container));
        await fireEvent.click($(`.${prefixCls}-preview-footer .${BASE_CLASS_PREFIX}-icon-plus`) as HTMLElement);
        expect(onZoomIn).toHaveBeenCalledTimes(1);
        await fireEvent.click($(`.${prefixCls}-preview-next`) as HTMLElement);
        expect(onNext).toHaveBeenCalledWith(1);
        expect(onChange).toHaveBeenCalledWith(1);
        await fireEvent.click($(`.${prefixCls}-preview-header-close`) as HTMLElement);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('setDownloadName 为单独预览的下载命名', async () => {
        const setDownloadName = vi.fn<(src: string) => string>(() => 'name.jpg');
        vi.stubGlobal(
            'fetch',
            vi.fn<() => Promise<{ ok: boolean }>>(() => Promise.resolve({ ok: false }))
        );
        const { container } = await loaded({ setDownloadName });
        await fireEvent.click(thumb(container));
        await fireEvent.click($(`.${prefixCls}-preview-footer .${BASE_CLASS_PREFIX}-icon-download`) as HTMLElement);
        expect(setDownloadName).toHaveBeenCalledWith(src);
        expect(fetch).toHaveBeenCalledWith(src);
    });

    it('data-*、title、loading 与 click 监听落在 img 上，class 与 style 落在根元素', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const { container } = renderImage({
            'data-testid': 'pic',
            title: 't',
            loading: 'lazy',
            class: 'c',
            onClick,
        });
        const img = thumb(container);
        expect(img).toHaveAttribute('data-testid', 'pic');
        expect(img).toHaveAttribute('title', 't');
        expect(img).toHaveAttribute('loading', 'lazy');
        expect(root(container)).not.toHaveAttribute('data-testid');
        expect(root(container)).toHaveClass('c');
        await fireEvent.click(root(container));
        expect(onClick).not.toHaveBeenCalled();
        await fireEvent.click(img);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('在懒加载分组中 img 没有 src 属性，等待 observer；分组外直接加载', () => {
        const { container } = render(() => (
            <>
                <ImagePreview>{() => <Image src={src} />}</ImagePreview>
                <ImagePreview lazyLoad={false}>{() => <Image src={src} />}</ImagePreview>
            </>
        ));
        const [lazy, eager] = container.querySelectorAll(`.${prefixCls}-img`);
        expect(lazy.hasAttribute('src')).toBe(false);
        expect(lazy).toHaveAttribute('data-src', src);
        expect(eager).toHaveAttribute('src', src);
    });

    it('组件模板 ref 的 $el 是缩略图根元素，img 在其中', () => {
        const image = shallowRef<ComponentPublicInstance | null>(null);
        const { container } = render(defineComponent({ setup: () => () => <Image ref={image} src={src} /> }));
        expect(image.value?.$el).toBe(root(container));
        expect((image.value?.$el as HTMLElement | undefined)?.querySelector('img')).toBe(thumb(container));
    });

    it('忽略默认插槽，不渲染到任何位置', () => {
        const { container } = renderImage({}, { default: () => 'child' });
        expect(thumb(container)).toBeEmptyDOMElement();
        expect(container).not.toHaveTextContent('child');
    });

    it('读取 semiGlobal overrideDefaultProps，分组内同样生效', async () => {
        semiGlobal.config.overrideDefaultProps = { Image: { preview: false } };
        const { container } = await loaded();
        await fireEvent.click(thumb(container));
        expect(preview()).toBeNull();

        render(ImagePreview, {
            slots: {
                default: () => (
                    <>
                        <Image preview src={src} />
                        <Image src="https://example.com/b.jpg" />
                    </>
                ),
            },
        });
        await fireEvent.click(document.querySelectorAll(`.${prefixCls}-preview-group .${prefixCls}-img`)[0]);
        expect($(`.${prefixCls}-preview-footer-page`)?.textContent).toBe('1/1');
    });

    it('读取函数类全局默认值 setDownloadName', async () => {
        const setDownloadName = vi.fn<(src: string) => string>(() => 'global.jpg');
        semiGlobal.config.overrideDefaultProps = { Image: { setDownloadName } };
        vi.stubGlobal(
            'fetch',
            vi.fn<() => Promise<{ ok: boolean }>>(() => Promise.resolve({ ok: false }))
        );
        const { container } = await loaded();
        await fireEvent.click(thumb(container));
        await fireEvent.click($(`.${prefixCls}-preview-footer .${BASE_CLASS_PREFIX}-icon-download`) as HTMLElement);
        expect(setDownloadName).toHaveBeenCalledWith(src);
    });

    it('单个 Image 的 preview 对象不接受不生效的属性', () => {
        type ImagePreviewProp = Exclude<ImageProps['preview'], boolean | undefined>;
        expectTypeOf<ImagePreviewProp>().toEqualTypeOf<ImagePreviewProps>();
        expectTypeOf<ImagePreviewProp>().not.toHaveProperty('lazyLoad');
        expectTypeOf<ImagePreviewProp>().not.toHaveProperty('lazyLoadMargin');
        expectTypeOf<ImagePreviewProp>().not.toHaveProperty('class');
        expectTypeOf<ImagePreviewProp>().not.toHaveProperty('style');
        expectTypeOf<ImagePreviewProp>().toHaveProperty('previewCls');
        expectTypeOf<ImagePreviewProp['previewTitle']>().toEqualTypeOf<string | undefined>();
    });
});

describe('Image 单图预览的插槽', () => {
    it('#title、#closeIcon、#leftIcon、#rightIcon、#previewMenu 转发给单图预览', async () => {
        const srcList = ['https://example.com/1.jpg', 'https://example.com/2.jpg', 'https://example.com/3.jpg'];
        const { container } = renderImage(
            { preview: { src: srcList, defaultCurrentIndex: 1, previewTitle: 'one' } },
            {
                title: (({ title, index }: { title: string; index: number }) => <b class="h">{`${title}:${index}`}</b>) as () => unknown,
                closeIcon: () => <i class="close-icon" />,
                leftIcon: (({ index }: { index: number }) => <i class={`left-${index}`} />) as () => unknown,
                rightIcon: () => <i class="right" />,
                previewMenu: (({ curPage }: { curPage: number }) => <div class="menu">{String(curPage)}</div>) as () => unknown,
            }
        );
        await fireEvent.load(thumb(container));
        await fireEvent.click(thumb(container));
        expect($(`.${prefixCls}-preview-header-title .h`)?.textContent).toBe('one:1');
        expect($(`.${prefixCls}-preview-header-close .close-icon`)).not.toBeNull();
        expect($(`.${prefixCls}-preview-prev .left-1`)).not.toBeNull();
        expect($(`.${prefixCls}-preview-next .right`)).not.toBeNull();
        expect($(`.${prefixCls}-preview-footer .menu`)?.textContent).toBe('2');
    });

    it('未传插槽时预览显示默认标题、图标与操作栏', async () => {
        const srcList = ['https://example.com/1.jpg', 'https://example.com/2.jpg', 'https://example.com/3.jpg'];
        const { container } = await loaded({ preview: { src: srcList, defaultCurrentIndex: 1, previewTitle: 'one' } });
        await fireEvent.click(thumb(container));
        expect($(`.${prefixCls}-preview-header-title`)?.textContent).toBe('one');
        expect($(`.${prefixCls}-preview-header-close .${BASE_CLASS_PREFIX}-icon-close`)).not.toBeNull();
        expect($(`.${prefixCls}-preview-prev .${BASE_CLASS_PREFIX}-icon-arrow_left`)).not.toBeNull();
        expect($(`.${prefixCls}-preview-next .${BASE_CLASS_PREFIX}-icon-arrow_right`)).not.toBeNull();
        expect($(`.${prefixCls}-preview-footer`)).toHaveClass(`${prefixCls}-preview-footer-content`);
    });

    it('撤回插槽后预览回到默认内容', async () => {
        const custom = shallowRef(true);
        const Host = defineComponent(() => () => (
            <Image src={src} preview={{ visible: true }}>
                {custom.value ? { title: () => <b class="h">custom</b>, closeIcon: () => <i class="x" /> } : {}}
            </Image>
        ));
        const { container } = render(Host);
        await fireEvent.load(thumb(container));
        expect($(`.${prefixCls}-preview-header-title .h`)).not.toBeNull();
        expect($(`.${prefixCls}-preview-header-close .x`)).not.toBeNull();
        custom.value = false;
        await nextTick();
        expect($(`.${prefixCls}-preview-header-title .h`)).toBeNull();
        expect($(`.${prefixCls}-preview-header-close .x`)).toBeNull();
        expect($(`.${prefixCls}-preview-header-close .${BASE_CLASS_PREFIX}-icon-close`)).not.toBeNull();
    });

    it('分组内的 Image 插槽不生效', async () => {
        render(ImagePreview, {
            slots: {
                default: () => (
                    <Image src={src}>
                        {{
                            title: () => <b class="h">ignored</b>,
                            closeIcon: () => <i class="x" />,
                        }}
                    </Image>
                ),
            },
        });
        await fireEvent.click(thumb(document.body));
        expect(preview()).not.toBeNull();
        expect($(`.${prefixCls}-preview-header-title .h`)).toBeNull();
        expect($(`.${prefixCls}-preview-header-close .x`)).toBeNull();
    });
});

describe('Image 在分组内的键盘可达性', () => {
    it('分组内尚未加载的缩略图同样是可聚焦按钮，Enter 打开分组预览', async () => {
        render(ImagePreview, { props: { lazyLoad: false }, slots: { default: () => <Image src={src} /> } });
        const button = screen.getByRole('button', { name: '预览' });
        expect(button).toHaveAttribute('tabindex', '0');
        expect(button).toHaveAttribute('aria-haspopup', 'dialog');
        expect(thumb(button)).toHaveClass(`${prefixCls}-img-preview`);
        await fireEvent.keyDown(button, { key: 'Enter' });
        expect(preview()).not.toBeNull();
    });

    it('分组内 :preview="false" 的缩略图不是按钮', () => {
        render(ImagePreview, { slots: { default: () => <Image preview={false} src={src} /> } });
        expect(screen.queryByRole('button')).toBeNull();
    });
});
