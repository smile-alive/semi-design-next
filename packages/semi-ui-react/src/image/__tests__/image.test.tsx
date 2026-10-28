import { StrictMode } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { Image, ImagePreview } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { ImageProps, PreviewImageProps, PreviewProps } from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-image`;
const src = 'https://example.com/a.jpg';
const $ = (selector) => document.querySelector(selector);
const preview = () => $(`div.${prefixCls}-preview`);
const thumb = (container) => container.querySelector(`.${prefixCls}-img`);

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
    document.body.style.overflow = '';
});

describe('Image', () => {
    it('自定义 imgCls 与 imgStyle', () => {
        const { container } = render(<Image imgStyle={{ maxWidth: 300 }} imgCls="custom-img-cls" src="https://example.com/abstract.jpg" />);
        const img = container.querySelector(`.${BASE_CLASS_PREFIX}-image-img`);
        expect(img).toHaveClass('custom-img-cls');
        expect(img).toHaveStyle({ maxWidth: '300px' });
    });

    it('根元素与 img 结构：width、height、className、style、alt、crossOrigin', () => {
        const { container } = render(<Image className="root-cls" style={{ color: 'red' }} alt="cat" crossOrigin="anonymous" height={80} src={src} width={120} />);
        const root = container.firstElementChild;
        expect(root).toHaveClass(prefixCls, 'root-cls');
        expect(root).toHaveStyle({ width: '120px', height: '80px', color: 'rgb(255, 0, 0)' });
        const img = thumb(container);
        expect(img).toHaveAttribute('src', src);
        expect(img).toHaveAttribute('data-src', src);
        expect(img).toHaveAttribute('alt', 'cat');
        expect(img).toHaveAttribute('width', '120');
        expect(img).toHaveAttribute('height', '80');
        expect(img).toHaveAttribute('crossorigin', 'anonymous');
    });

    it('加载时显示骨架屏，随后遮罩消失并调用 onLoad', () => {
        const onLoad = vi.fn<(event: React.SyntheticEvent<HTMLImageElement>) => void>();
        const { container } = render(<Image height={100} src={src} width={100} onLoad={onLoad} />);
        expect(container.querySelector(`.${prefixCls}-overlay .${BASE_CLASS_PREFIX}-skeleton-image`)).not.toBeNull();
        expect(thumb(container)).not.toHaveClass(`${prefixCls}-img-preview`);
        fireEvent.load(thumb(container));
        expect(onLoad).toHaveBeenCalledTimes(1);
        expect(onLoad.mock.calls[0][0].type).toBe('load');
        expect(container.querySelector(`.${prefixCls}-overlay`)).toBeNull();
        expect(thumb(container)).toHaveClass(`${prefixCls}-img-preview`);
    });

    it('加载时 placeholder 替代骨架屏', () => {
        const { container } = render(<Image placeholder={<span className="ph">loading</span>} src={src} />);
        expect(container.querySelector(`.${prefixCls}-status .ph`)).not.toBeNull();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-skeleton-image`)).toBeNull();
    });

    it('出错时显示默认图标并调用 onError', () => {
        const onError = vi.fn<(event: React.SyntheticEvent<HTMLImageElement>) => void>();
        const { container } = render(<Image src={src} onError={onError} />);
        fireEvent.error(thumb(container));
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0].type).toBe('error');
        expect(container.querySelector(`.${prefixCls}-status .${BASE_CLASS_PREFIX}-icon-upload_error`)).not.toBeNull();
        expect(thumb(container)).toHaveClass(`${prefixCls}-img-error`);
    });

    it('fallback：字符串渲染为 img，节点原样渲染', () => {
        const { container, rerender } = render(<Image fallback="https://example.com/fallback.jpg" src={src} />);
        fireEvent.error(thumb(container));
        const fallbackImg = container.querySelector(`.${prefixCls}-status img`);
        expect(fallbackImg).toHaveAttribute('src', 'https://example.com/fallback.jpg');
        expect(fallbackImg).toHaveAttribute('alt', zh_CN.Image.fallback);

        rerender(<Image fallback={<span className="fb">failed</span>} src={src} />);
        expect(container.querySelector(`.${prefixCls}-status .fb`)).not.toBeNull();
    });

    it('新的 src 重新开始加载', () => {
        const { container, rerender } = render(<Image src={src} />);
        fireEvent.error(thumb(container));
        expect(thumb(container)).toHaveClass(`${prefixCls}-img-error`);
        rerender(<Image src="https://example.com/b.jpg" />);
        expect(thumb(container)).not.toHaveClass(`${prefixCls}-img-error`);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-skeleton-image`)).not.toBeNull();
        fireEvent.load(thumb(container));
        expect(container.querySelector(`.${prefixCls}-overlay`)).toBeNull();
    });

    it('点击已加载的图片打开预览，点击遮罩关闭', () => {
        const onClick = vi.fn<(event: unknown) => void>();
        const { container } = render(<Image src={src} onClick={onClick} />);
        fireEvent.click(thumb(container));
        expect(preview()).toBeNull();
        expect(onClick).toHaveBeenCalledTimes(1);

        fireEvent.load(thumb(container));
        fireEvent.click(thumb(container));
        expect(preview()).not.toBeNull();
        expect($(`.${prefixCls}-preview-image-img`)).toHaveAttribute('src', src);
        expect(document.body.style.overflow).toBe('hidden');

        fireEvent.mouseDown(preview(), { clientX: 10, clientY: 10 });
        fireEvent.mouseUp(preview(), { clientX: 10, clientY: 10 });
        expect(preview()).toBeNull();
        expect(document.body.style.overflow).toBe('');
    });

    it('加载完成前或加载失败时点击缩略图不记入打开状态，加载后预览不会自动弹出', () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const { container, rerender } = render(<Image preview={{ onVisibleChange }} src={src} />);
        fireEvent.click(thumb(container));
        fireEvent.load(thumb(container));
        expect(preview()).toBeNull();
        expect(onVisibleChange).not.toHaveBeenCalled();

        rerender(<Image preview={{ onVisibleChange }} src="https://example.com/b.jpg" />);
        fireEvent.error(thumb(container));
        fireEvent.click(thumb(container));
        expect(onVisibleChange).not.toHaveBeenCalled();
        rerender(<Image preview={{ onVisibleChange }} src="https://example.com/c.jpg" />);
        fireEvent.load(thumb(container));
        expect(preview()).toBeNull();
        expect(document.body.style.overflow).toBe('');
    });

    it('预览内的点击不会冒泡回缩略图而重复通知打开', () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const { container } = render(<Image preview={{ onVisibleChange }} src={src} />);
        fireEvent.load(thumb(container));
        fireEvent.click(thumb(container));
        expect(onVisibleChange).toHaveBeenCalledTimes(1);
        fireEvent.click($(`.${prefixCls}-preview-footer .${BASE_CLASS_PREFIX}-icon-plus`));
        expect(onVisibleChange).toHaveBeenCalledTimes(1);
        expect(preview()).not.toBeNull();
    });

    it('已加载的缩略图是可聚焦按钮，Enter 与 Space 可打开，预览图使用其 alt', () => {
        const { container } = render(<Image alt="a lamp" src={src} />);
        const root = container.firstChild;
        expect(root).not.toHaveAttribute('role');
        expect(root).not.toHaveAttribute('tabindex');

        fireEvent.load(thumb(container));
        expect(root).toHaveAttribute('role', 'button');
        expect(root).toHaveAttribute('tabindex', '0');
        expect(root).toHaveAttribute('aria-haspopup', 'dialog');
        fireEvent.keyDown(root, { key: 'a' });
        expect(preview()).toBeNull();
        fireEvent.keyDown(root, { key: 'Enter' });
        expect(preview()).not.toBeNull();
        expect($(`.${prefixCls}-preview-image-img`)).toHaveAttribute('alt', 'a lamp');
        fireEvent.keyDown(document.activeElement, { key: 'Escape' });
        expect(preview()).toBeNull();
        expect(fireEvent.keyDown(root, { key: ' ' })).toBe(false);
        expect(preview()).not.toBeNull();
    });

    it('键盘打开预览时与鼠标点击一样调用 onClick', () => {
        const onClick = vi.fn<(event: unknown) => void>();
        const { container } = render(<Image src={src} onClick={onClick} />);
        fireEvent.load(thumb(container));
        fireEvent.keyDown(container.firstChild, { key: 'Enter' });
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0]).toMatchObject({ type: 'click' });
        expect(preview()).not.toBeNull();
    });

    it('缩略图重新加载不会卸载已打开的预览，受控 visible 不必等缩略图加载', () => {
        const { container, rerender, unmount } = render(<Image preview={{ visible: true }} src={src} />);
        expect(preview()).not.toBeNull();
        fireEvent.load(thumb(container));
        rerender(<Image preview={{ visible: true }} src="https://example.com/b.jpg" />);
        expect(preview()).not.toBeNull();
        expect($(`.${prefixCls}-preview-image-img`)).toHaveAttribute('src', 'https://example.com/b.jpg');
        unmount();

        const second = render(<Image src={src} />);
        fireEvent.load(thumb(second.container));
        fireEvent.click(thumb(second.container));
        second.rerender(<Image src="https://example.com/c.jpg" />);
        expect($(`.${prefixCls}-preview-image-img`)).toHaveAttribute('src', 'https://example.com/c.jpg');
    });

    it('缩略图未加载时受控 visible 由 true 改为 false，焦点回到打开它的元素', () => {
        const { getByRole, rerender } = render(
            <>
                <button type="button">open</button>
                <Image preview={{ visible: false }} src={src} />
            </>
        );
        const opener = getByRole('button', { name: 'open' });
        opener.focus();
        rerender(
            <>
                <button type="button">open</button>
                <Image preview={{ visible: true }} src={src} />
            </>
        );
        expect(preview()).not.toBeNull();
        expect(opener).not.toHaveFocus();
        rerender(
            <>
                <button type="button">open</button>
                <Image preview={{ visible: false }} src={src} />
            </>
        );
        expect(preview()).toBeNull();
        expect(opener).toHaveFocus();
    });

    it('没有 alt 的缩略图按钮从语言包取名，有 alt 的按钮由图片命名', () => {
        const { container, getByRole } = render(
            <>
                <Image src={src} />
                <Image alt="a lamp" src={`${src}?b`} />
            </>
        );
        container.querySelectorAll('img').forEach((img) => fireEvent.load(img));
        expect(getByRole('button', { name: '预览' })).toBe(container.firstChild);
        expect(getByRole('button', { name: 'a lamp' })).not.toHaveAttribute('aria-label');
    });

    it('preview={false} 时缩略图不在 Tab 顺序中', () => {
        const { container } = render(<Image preview={false} src={src} />);
        fireEvent.load(thumb(container));
        expect(container.firstChild).not.toHaveAttribute('role');
        expect(container.firstChild).not.toHaveAttribute('tabindex');
    });

    it('preview={false} 时永不打开', () => {
        const { container } = render(<Image preview={false} src={src} />);
        fireEvent.load(thumb(container));
        expect(thumb(container)).not.toHaveClass(`${prefixCls}-img-preview`);
        fireEvent.click(thumb(container));
        expect(preview()).toBeNull();
    });

    it('preview 对象：src、previewCls、previewStyle、crossOrigin 与受控的 visible', () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const big = 'https://example.com/big.jpg';
        const renderImage = (visible) => (
            <Image
                crossOrigin="use-credentials"
                preview={{
                    src: big,
                    visible,
                    onVisibleChange,
                    previewCls: 'my-preview',
                    previewStyle: { color: 'red' },
                }}
                src={src}
            />
        );
        const { container, rerender } = render(renderImage(false));
        fireEvent.load(thumb(container));
        fireEvent.click(thumb(container));
        expect(onVisibleChange).toHaveBeenCalledWith(true);
        expect(preview()).toBeNull();

        rerender(renderImage(true));
        expect(preview()).toHaveClass('my-preview');
        expect(preview()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect($(`.${prefixCls}-preview-image-img`)).toHaveAttribute('src', big);
        expect($(`.${prefixCls}-preview-image-img`)).toHaveAttribute('crossorigin', 'use-credentials');

        fireEvent.mouseDown(preview(), { clientX: 0, clientY: 0 });
        fireEvent.mouseUp(preview(), { clientX: 0, clientY: 0 });
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
        expect(preview()).not.toBeNull();

        rerender(renderImage(false));
        expect(preview()).toBeNull();
    });

    it('preview 对象的 defaultCurrentIndex 决定首次打开的图片', () => {
        const srcList = ['https://example.com/1.jpg', 'https://example.com/2.jpg', 'https://example.com/3.jpg'];
        const { container } = render(<Image preview={{ src: srcList, defaultCurrentIndex: 2 }} src={src} />);
        fireEvent.load(thumb(container));
        fireEvent.click(thumb(container));
        expect($(`.${prefixCls}-preview-image-img`)).toHaveAttribute('src', srcList[2]);
        expect($(`.${prefixCls}-preview-footer-page`)).toHaveTextContent('3/3');
    });

    it('不带 visible 的 preview 对象为非受控，且仍会通知', () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const { container } = render(<Image preview={{ onVisibleChange }} src={src} />);
        fireEvent.load(thumb(container));
        fireEvent.click(thumb(container));
        expect(onVisibleChange).toHaveBeenCalledWith(true);
        expect(preview()).not.toBeNull();
    });

    it('preview.visible 为 null 时是受控的隐藏，点击只通知', () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const { container, rerender } = render(<Image preview={{ onVisibleChange }} src={src} />);
        fireEvent.load(thumb(container));
        fireEvent.click(thumb(container));
        expect(preview()).not.toBeNull();

        rerender(<Image preview={{ visible: null, onVisibleChange }} src={src} />);
        expect(preview()).toBeNull();
        fireEvent.click(thumb(container));
        expect(onVisibleChange).toHaveBeenLastCalledWith(true);
        expect(preview()).toBeNull();
    });

    it('setDownloadName 为单独预览的下载命名', () => {
        const setDownloadName = vi.fn<(src: string) => string>(() => 'name.jpg');
        vi.stubGlobal(
            'fetch',
            vi.fn<() => Promise<{ ok: boolean }>>(() => Promise.resolve({ ok: false }))
        );
        const { container } = render(<Image setDownloadName={setDownloadName} src={src} />);
        fireEvent.load(thumb(container));
        fireEvent.click(thumb(container));
        fireEvent.click($(`.${prefixCls}-preview-footer .${BASE_CLASS_PREFIX}-icon-download`));
        expect(setDownloadName).toHaveBeenCalledWith(src);
        expect(fetch).toHaveBeenCalledWith(src);
        vi.unstubAllGlobals();
    });

    it('data-* 与其他 img 属性落在 img 上', () => {
        const { container } = render(<Image data-testid="pic" title="t" loading="lazy" src={src} />);
        const img = thumb(container);
        expect(img).toHaveAttribute('data-testid', 'pic');
        expect(img).toHaveAttribute('title', 't');
        expect(img).toHaveAttribute('loading', 'lazy');
        expect(container.firstElementChild).not.toHaveAttribute('data-testid');
    });

    it('在懒加载分组中 img 等待 observer；分组外直接加载', () => {
        const { container } = render(
            <>
                <ImagePreview>
                    <Image src={src} />
                </ImagePreview>
                <ImagePreview lazyLoad={false}>
                    <Image src={src} />
                </ImagePreview>
            </>
        );
        const [lazy, eager] = container.querySelectorAll(`.${prefixCls}-img`);
        expect(lazy).not.toHaveAttribute('src');
        expect(lazy).toHaveAttribute('data-src', src);
        expect(eager).toHaveAttribute('src', src);
    });

    it('分组内未加载或加载失败的缩略图与点击一样可用键盘打开分组预览', () => {
        const { container } = render(
            <ImagePreview>
                <Image alt="a lamp" src={src} />
            </ImagePreview>
        );
        const root = thumb(container).parentElement;
        expect(thumb(container)).not.toHaveAttribute('src');
        expect(root).toHaveAttribute('role', 'button');
        expect(root).toHaveAttribute('tabindex', '0');
        expect(root).toHaveAttribute('aria-haspopup', 'dialog');
        expect(thumb(container)).toHaveClass(`${prefixCls}-img-preview`);
        fireEvent.keyDown(root, { key: 'Enter' });
        expect(preview()).not.toBeNull();
        fireEvent.keyDown(document.activeElement, { key: 'Escape' });
        expect(preview()).toBeNull();

        fireEvent.error(thumb(container));
        expect(root).toHaveAttribute('role', 'button');
        fireEvent.keyDown(root, { key: ' ' });
        expect(preview()).not.toBeNull();
    });

    it('ref 指向 img', () => {
        const ref = { current: null };
        const { container } = render(<Image ref={ref} src={src} />);
        expect(ref.current).toBe(thumb(container));
    });

    it('忽略 children，不渲染进 void 的 img 中', () => {
        const { container } = render(<Image src={src}>child</Image>);
        expect(thumb(container)).toBeEmptyDOMElement();
    });

    it('读取 semiGlobal overrideDefaultProps，分组内同样生效', () => {
        semiGlobal.config.overrideDefaultProps = { Image: { preview: false } };
        const { container } = render(<Image src={src} />);
        fireEvent.load(thumb(container));
        fireEvent.click(thumb(container));
        expect(preview()).toBeNull();

        render(
            <ImagePreview>
                <Image preview src={src} />
                <Image src="https://example.com/b.jpg" />
            </ImagePreview>
        );
        fireEvent.click(document.querySelectorAll(`.${prefixCls}-preview-group .${prefixCls}-img`)[0]);
        expect($(`.${prefixCls}-preview-footer-page`).textContent).toBe('1/1');
    });

    it('单个 Image 的 preview 对象不接受不生效的属性', () => {
        type ImagePreviewProp = Exclude<ImageProps['preview'], boolean | undefined>;
        expectTypeOf<ImagePreviewProp>().not.toHaveProperty('lazyLoad');
        expectTypeOf<ImagePreviewProp>().not.toHaveProperty('lazyLoadMargin');
        expectTypeOf<ImagePreviewProp>().not.toHaveProperty('children');
        expectTypeOf<ImagePreviewProp>().not.toHaveProperty('className');
        expectTypeOf<ImagePreviewProp>().not.toHaveProperty('style');
        expectTypeOf<ImagePreviewProp>().toHaveProperty('previewCls');
        expectTypeOf<PreviewImageProps>().not.toHaveProperty('clickZoom');
        expectTypeOf<PreviewImageProps>().not.toHaveProperty('setRatio');
        expectTypeOf<PreviewImageProps>().not.toHaveProperty('style');
    });

    it('onLoad、onError 收到 img 上的合成事件，currentTarget 是 HTMLImageElement', () => {
        expectTypeOf<ImageProps['onLoad']>().toEqualTypeOf<React.ReactEventHandler<HTMLImageElement> | undefined>();
        expectTypeOf<ImageProps['onError']>().toEqualTypeOf<React.ReactEventHandler<HTMLImageElement> | undefined>();
        const onLoad: ImageProps['onLoad'] = (e) => e.currentTarget.naturalWidth;
        expect(onLoad).toBeTypeOf('function');
    });

    it('renderLeftIcon、renderRightIcon 只接受元素', () => {
        expectTypeOf<NonNullable<PreviewProps['renderLeftIcon']>>().toEqualTypeOf<React.ReactElement | ((index: number) => React.ReactElement)>();
        expectTypeOf<NonNullable<PreviewProps['renderRightIcon']>>().toEqualTypeOf<React.ReactElement | ((index: number) => React.ReactElement)>();
    });

    it('StrictMode：预览打开与关闭，body 滚动恢复', () => {
        const { container } = render(
            <StrictMode>
                <Image src={src} />
            </StrictMode>
        );
        fireEvent.load(thumb(container));
        fireEvent.click(thumb(container));
        expect(preview()).not.toBeNull();
        expect(document.body.style.overflow).toBe('hidden');
        fireEvent.keyDown(document.activeElement, { key: 'Escape' });
        expect(preview()).toBeNull();
        expect(document.body.style.overflow).toBe('');
    });
});
