/** @jsxImportSource vue */
import { shallowRef, type VNode } from 'vue';
import { screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconChevronLeft, IconChevronRight, IconDownload, IconMinus, IconPlus, IconRealSizeStroked, IconRotate, IconUploadError, IconWindowAdaptionStroked } from '@fibrae/semi-icons-vue';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Image, { ImagePreview, type ImageProps, type MenuProps } from '..';
import Button from '../../button';
import { Col, Row } from '../../grid';
import Group from './fixtures/group.vue';
import Model from './fixtures/model.vue';

const svg = (color: string, width = 96, height = 96) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="${color}"/></svg>`)}`;

const prefixCls = `${BASE_CLASS_PREFIX}-image`;
const previewCls = `${prefixCls}-preview`;

// Local stand-ins for the remote demo images, with the natural sizes the zoom assertions depend on
const abstractLite = svg('purple', 1440, 800);
const lion = svg('orange', 1080, 720);
const seaside = svg('steelblue', 1080, 720);
const beach = svg('khaki', 1080, 720);
const srcList1 = [lion, seaside, beach];
const lamps: ImageProps[] = srcList1.map((src, index) => ({ alt: `lamp${index + 1}`, src, width: 200 }));

const $ = (selector: string) => document.querySelector<HTMLElement>(selector) as HTMLElement;
const preview = () => document.querySelector<HTMLElement>(`.${previewCls}`);
const previewImg = () => $(`.${previewCls}-image-img`);
const footerIcon = (name: string) => $(`.${previewCls}-footer .${BASE_CLASS_PREFIX}-icon-${name}`);
const thumbnails = () => document.querySelectorAll<HTMLElement>(`.${prefixCls}-img-preview`);
const pageInfo = () => $(`.${previewCls}-footer-page`);
const renderGroup = (props: Record<string, unknown> = {}) => render(Group, { props: { images: lamps, ...props } });
const renderImage = (props: ImageProps) => render(Image, { props: { height: 200, src: abstractLite, width: 360, ...props } });

async function openPreview(index = 0) {
    await waitFor(() => expect(thumbnails()[index]).toBeInTheDocument());
    await userEvent.click(thumbnails()[index]);
    await waitFor(() => expect(preview()).toBeInTheDocument());
}

async function expectPreviewSize(width: number, height: number) {
    await waitFor(() => {
        const style = getComputedStyle(previewImg());
        expect(style.width).toBe(`${width}px`);
        expect(style.height).toBe(`${height}px`);
    });
}

const expectTooltip = (text: string) => waitFor(() => expect([...document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`)].map((el) => el.textContent)).toContain(text));

// The ratio icon is swapped in place inside the same Tooltip, so the pointer already rests on the new icon and the
// old tip is still open. Leave the footer so the next hover is a real pointer move, and wait until that tip has
// finished hiding: Tooltip ignores a show request while its hide animation is running
async function switchRatioAndMovePointerAway() {
    await userEvent.click(footerIcon('real_size_stroked'));
    await waitFor(() => expect(footerIcon('window_adaption_stroked')).toBeInTheDocument());
    await userEvent.hover($(`.${previewCls}-prev`));
    await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`)).toBeNull());
}

async function expectTips(tips: [string, string][]) {
    for (const [icon, tip] of tips) {
        await userEvent.hover(footerIcon(icon));
        await expectTooltip(tip);
        await userEvent.unhover(footerIcon(icon));
    }
}

describe('Image（浏览器）', () => {
    it('宿主限制 img 的 max-width 时，预览图仍可放大超出容器宽度', async () => {
        // Tailwind Preflight caps img at max-width: 100%; the preview renders in a portal, outside .semi-image
        const reset = document.createElement('style');
        reset.textContent = '@layer semi.reset { img { max-width: 100%; height: auto; } }';
        document.head.append(reset);
        onTestFinished(() => reset.remove());

        render(ImagePreview, { props: { src: svg('red', 400, 400), visible: true } });
        await waitFor(() => expect(document.querySelector(`.${previewCls}-image-img`)).not.toBeNull());
        expect(getComputedStyle(previewImg()).maxWidth).toBe('none');
    });

    it('issue1526：挂载后添加到 ImagePreview 的懒加载图片会获得 src', async () => {
        const srcList = [svg('red'), svg('green'), svg('blue')];
        const view = render(Group, { props: { images: [] } });
        await view.rerender({ images: srcList.map((src) => ({ height: 96, key: src, src, width: 96 })) });

        const imgs = view.container.querySelectorAll(`.${prefixCls}-img`);
        expect(imgs).toHaveLength(3);
        await waitFor(() => expect([...imgs].map((img) => img.getAttribute('src'))).toEqual(srcList));
        imgs.forEach((img) => expect(img).not.toHaveAttribute('data-src'));
    });

    it('懒加载分组中 key 不变而 src 变化的可见图片换成新图', async () => {
        const images = (color: string) => [{ height: 96, key: 'only', src: svg(color), width: 96 }];
        const view = render(Group, { props: { images: images('red') } });
        const img = () => view.container.querySelector(`.${prefixCls}-img`);
        await waitFor(() => expect(img()).toHaveAttribute('src', svg('red')));
        await view.rerender({ images: images('green') });
        await waitFor(() => expect(img()).toHaveAttribute('src', svg('green')));
        expect(img()).not.toHaveAttribute('data-src');
    });
});

describe('Image', () => {
    afterEach(async () => {
        await page.viewport(1000, 660);
    });

    it('基础图片', async () => {
        const view = renderImage({});
        await expect.poll(() => thumbnails()[0]).toHaveStyle({ width: '360px', height: '200px' });
        await openPreview();
        await userEvent.click(preview() as HTMLElement);
        await waitFor(() => expect(preview()).toBeNull());

        await view.rerender({ preview: false });
        await userEvent.click($(`.${prefixCls}-img`));
        expect(preview()).toBeNull();
    });

    it('加载失败的 Image', async () => {
        const errorSrc = 'data:image/png;base64,AAAA';
        render(() => (
            <>
                <Image height={200} src={errorSrc} width={200} />
                <Image height={200} src={errorSrc} width={200}>
                    {{
                        fallback: () => <IconUploadError style={{ fontSize: '50px' }} />,
                    }}
                </Image>
            </>
        ));
        await waitFor(() => expect(document.querySelectorAll(`.${prefixCls}-status`)).toHaveLength(2));
        const [defaultStatus, customStatus] = document.querySelectorAll(`.${prefixCls}-status`);
        expect(defaultStatus.querySelector(`:scope > .${BASE_CLASS_PREFIX}-icon-upload_error`)).toBeInTheDocument();
        expect(customStatus.querySelector(':scope > span')).toHaveAttribute('style', expect.stringContaining('font-size: 50px;'));
    });

    it('受控单张预览', async () => {
        render(Model, { props: { src: [abstractLite] } });
        await userEvent.click(screen.getByText('open'));
        await waitFor(() => expect(preview()).toBeInTheDocument());
        await userEvent.click(preview() as HTMLElement);
        await waitFor(() => expect(preview()).toBeNull());
    });

    it('受控的 image show', async () => {
        const visible = shallowRef(false);
        render(() => (
            <Image
                height={200}
                preview={{
                    visible: visible.value,
                    onVisibleChange: (value: boolean) => {
                        visible.value = value;
                    },
                }}
                src={abstractLite}
                width={360}
            />
        ));
        await openPreview();
        await userEvent.click(preview() as HTMLElement);
        await waitFor(() => expect(preview()).toBeNull());
    });

    it('受控多张预览', async () => {
        render(Model, { props: { src: srcList1 } });
        await userEvent.click(screen.getByText('open'));
        await waitFor(() => expect(preview()).toBeInTheDocument());

        expect($(`.${previewCls}-next`)).toBeVisible();
        await userEvent.click($(`.${previewCls}-next`));
        await waitFor(() => expect(pageInfo()).toHaveTextContent('2/3'));
        expect(preview()).toBeInTheDocument();

        expect($(`.${previewCls}-prev`)).toBeVisible();
        await userEvent.click($(`.${previewCls}-prev`));
        await waitFor(() => expect(pageInfo()).toHaveTextContent('1/3'));
    });

    it('鼠标拖拽', async () => {
        // A 1440x800 image in a 1440x800 container starts at the adaptation zoom (800 - 80) / 800 = 0.9
        await page.viewport(1440, 800);
        renderImage({});
        await openPreview();
        await expectPreviewSize(1296, 720);

        await userEvent.click(footerIcon('plus'));
        await expectPreviewSize(1440, 800);
        await userEvent.click(footerIcon('plus'));
        await userEvent.click(footerIcon('plus'));
        await expectPreviewSize(1728, 960);

        // At zoom 1.2 the image can only move until its edge meets the container edge:
        // (1728 - 1440) / 2 = 144 and (960 - 800) / 2 = 80, so a 200x100 drag is clamped to translate(144px, 80px)
        const { width, height } = previewImg().getBoundingClientRect();
        await userEvent.dragAndDrop(previewImg(), previewImg(), {
            sourcePosition: { x: width / 2, y: height / 2 },
            targetPosition: { x: width / 2 + 200, y: height / 2 + 100 },
        });
        await waitFor(() => expect(previewImg().getAttribute('style')).toContain('translate(144px, 80px)'));
    });

    it('鼠标滚轮', async () => {
        await page.viewport(1440, 800);
        renderImage({});
        await openPreview();
        await expectPreviewSize(1296, 720);

        await userEvent.wheel(previewImg(), { delta: { y: -10 } });
        await expectPreviewSize(1440, 800);
        await userEvent.wheel(previewImg(), { delta: { y: 10 } });
        await expectPreviewSize(1296, 720);
    });

    it('自定义预览 Image', async () => {
        const small = svg('pink', 300, 200);
        const big = svg('crimson', 1200, 800);
        render(Image, { props: { height: 200, preview: { src: big }, src: small, width: 300 } });
        await waitFor(() => expect($(`.${prefixCls}-img`)).toHaveAttribute('src', small));
        await openPreview();
        expect(previewImg()).toHaveAttribute('src', big);
    });

    it('回调函数', async () => {
        await page.viewport(1200, 800);
        const callbacks = {
            onZoomIn: vi.fn<(zoom: number) => void>(),
            onZoomOut: vi.fn<(zoom: number) => void>(),
            onPrev: vi.fn<(index: number) => void>(),
            onNext: vi.fn<(index: number) => void>(),
            onRotateLeft: vi.fn<(angle: number) => void>(),
            onDownload: vi.fn<(src: string, index: number) => void>(),
        };
        renderGroup(callbacks);
        await openPreview(1);

        await userEvent.click(footerIcon('chevron_left'));
        expect(callbacks.onPrev).toHaveBeenCalledTimes(1);
        await userEvent.click(footerIcon('chevron_right'));
        expect(callbacks.onNext).toHaveBeenCalledTimes(1);

        await userEvent.click($(`.${BASE_CLASS_PREFIX}-icon-arrow_right`));
        expect(callbacks.onNext).toHaveBeenCalledTimes(2);
        await userEvent.click($(`.${BASE_CLASS_PREFIX}-icon-arrow_left`));
        expect(callbacks.onPrev).toHaveBeenCalledTimes(2);

        await userEvent.click(footerIcon('plus'));
        await userEvent.click(footerIcon('minus'));
        expect(callbacks.onZoomOut).toHaveBeenCalled();
        callbacks.onZoomIn.mockClear();
        await userEvent.click(footerIcon('plus'));
        expect(callbacks.onZoomIn).toHaveBeenCalled();

        const handle = () => $(`.${BASE_CLASS_PREFIX}-slider-handle`);
        const rail = $(`.${BASE_CLASS_PREFIX}-slider-rail`);
        // Drop on the slider itself: the filled track covers the rail, so the rail is not the element under the pointer
        const slider = $(`.${BASE_CLASS_PREFIX}-slider`);
        const railRect = rail.getBoundingClientRect();
        const sliderRect = slider.getBoundingClientRect();
        const railPoint = (x: number) => ({
            x: x - sliderRect.left,
            y: railRect.top + railRect.height / 2 - sliderRect.top,
        });
        callbacks.onZoomIn.mockClear();
        await userEvent.dragAndDrop(handle(), slider, { targetPosition: railPoint(railRect.right) });
        await waitFor(() => expect(callbacks.onZoomIn).toHaveBeenCalled());
        callbacks.onZoomOut.mockClear();
        await userEvent.dragAndDrop(handle(), slider, { targetPosition: railPoint(railRect.left) });
        await waitFor(() => expect(callbacks.onZoomOut).toHaveBeenCalled());

        await userEvent.click(footerIcon('download'));
        expect(callbacks.onDownload).toHaveBeenCalledTimes(1);

        await userEvent.click(footerIcon('rotate'));
        expect(callbacks.onRotateLeft).toHaveBeenCalledTimes(1);
    });

    it('无限加载', async () => {
        renderGroup({ infinite: true });
        await openPreview(1);
        await userEvent.click($(`.${previewCls}-prev`));
        await waitFor(() => expect(previewImg()).toHaveAttribute('src', lion));
        await userEvent.click($(`.${previewCls}-prev`));
        await waitFor(() => expect(previewImg()).toHaveAttribute('src', beach));
        await userEvent.click($(`.${previewCls}-next`));
        await waitFor(() => expect(previewImg()).toHaveAttribute('src', lion));
    });

    it('closeOnEsc', async () => {
        const view = renderImage({ preview: { closeOnEsc: true } });
        await openPreview();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(preview()).toBeNull());

        await view.rerender({ preview: { closeOnEsc: false } });
        await openPreview();
        await userEvent.keyboard('{Escape}');
        expect(preview()).toBeInTheDocument();
        await userEvent.click(preview() as HTMLElement);
        await waitFor(() => expect(preview()).toBeNull());
    });

    it('禁用下载', async () => {
        renderImage({ preview: { disableDownload: true } });
        await openPreview();
        expect(footerIcon('download')).toHaveClass(`${previewCls}-footer-disabled`);
    });

    it('maskClosable', async () => {
        renderImage({ preview: { maskClosable: false } });
        await openPreview();
        await userEvent.click(preview() as HTMLElement);
        expect(preview()).toBeInTheDocument();
        await userEvent.click($(`.${BASE_CLASS_PREFIX}-icon-close`));
        await waitFor(() => expect(preview()).toBeNull());
    });

    it('自定义容器', async () => {
        render(() => (
            <div id="container" style={{ height: '400px', position: 'relative', margin: '100px 200px' }}>
                <Group images={lamps} style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} getPopupContainer={() => document.getElementById('container') as HTMLElement} />
            </div>
        ));
        await openPreview(0);
        expect(preview()?.parentElement).toHaveClass(`${BASE_CLASS_PREFIX}-portal`);
        expect(preview()?.parentElement?.parentElement).toHaveAttribute('id', 'container');
    });

    it('自定义标题 #title', async () => {
        render(ImagePreview, {
            slots: {
                default: () => (
                    <div>
                        {lamps.map((image, index) => (
                            <Image key={index} {...image} preview={{ previewTitle: `lamp${index + 1}` }} />
                        ))}
                    </div>
                ),
                title: ({ title }: { title: string }) => <div>{title}</div>,
            },
        });
        await openPreview(0);
        const title = () => $(`.${previewCls}-header-title > div`);
        expect(title()).toHaveTextContent('lamp1');
        expect($(`.${previewCls}-next`)).toBeVisible();
        await userEvent.click($(`.${previewCls}-next`));
        await waitFor(() => expect(title()).toHaveTextContent('lamp2'));
    });

    it('自定义底部 #previewMenu', async () => {
        await page.viewport(1200, 800);
        const onDownload = vi.fn<(src: string, index: number) => void>();
        const menuButton = (label: string, icon: () => VNode, onClick: () => void) => (
            <Button aria-label={label} onClick={onClick}>
                {{ icon: () => [icon()] }}
            </Button>
        );
        const previewMenu = (menu: MenuProps) => (
            <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                {menuButton(
                    'prev',
                    () => (
                        <IconChevronLeft size="large" />
                    ),
                    menu.onPrev
                )}
                {menuButton(
                    'next',
                    () => (
                        <IconChevronRight size="large" />
                    ),
                    menu.onNext
                )}
                {menuButton(
                    'zoom out',
                    () => (
                        <IconMinus size="large" />
                    ),
                    menu.onZoomOut
                )}
                {menuButton(
                    'zoom in',
                    () => (
                        <IconPlus size="large" />
                    ),
                    menu.onZoomIn
                )}
                {menuButton('ratio', () => (menu.ratio === 'adaptation' ? <IconRealSizeStroked size="large" /> : <IconWindowAdaptionStroked size="large" />), menu.onRatioClick)}
                {menuButton(
                    'rotate right',
                    () => (
                        <IconRotate size="large" />
                    ),
                    menu.onRotateRight
                )}
                {menuButton(
                    'rotate left',
                    () => (
                        <IconRotate size="large" />
                    ),
                    menu.onRotateLeft
                )}
                {menuButton(
                    'download',
                    () => (
                        <IconDownload size="large" />
                    ),
                    menu.onDownload
                )}
            </div>
        );
        render(ImagePreview, {
            props: { onDownload },
            slots: { default: () => lamps.map((image, index) => <Image key={index} {...image} />), previewMenu },
        });
        await openPreview(0);
        const menuIcon = (name: string, index = 0) => document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-icon-${name}`)[index];

        await userEvent.click(menuIcon('chevron_right'));
        await waitFor(() => expect(previewImg()).toHaveAttribute('src', seaside));
        await userEvent.click(menuIcon('chevron_left'));
        await waitFor(() => expect(previewImg()).toHaveAttribute('src', lion));

        // lion is 1080x720; in a 1200x800 container the adaptation zoom is min(1120 / 1080, 720 / 720) = 1
        await expectPreviewSize(1080, 720);
        await userEvent.click(menuIcon('minus'));
        await expectPreviewSize(972, 648);
        await userEvent.click(menuIcon('plus'));
        await expectPreviewSize(1080, 720);
        await userEvent.click(menuIcon('plus'));
        await userEvent.click(menuIcon('plus'));
        await expectPreviewSize(1296, 864);

        await userEvent.click(menuIcon('real_size_stroked'));
        await expectPreviewSize(1080, 720);
        await userEvent.click(menuIcon('minus'));
        await userEvent.click(menuIcon('minus'));
        await expectPreviewSize(864, 576);
        await userEvent.click(menuIcon('window_adaption_stroked'));
        await expectPreviewSize(1080, 720);

        await userEvent.click(menuIcon('rotate', 0));
        await waitFor(() => expect(previewImg().getAttribute('style')).toContain('rotate(90deg)'));
        await userEvent.click(menuIcon('rotate', 1));
        await waitFor(() => expect(previewImg().getAttribute('style')).toContain('rotate(0deg)'));

        await userEvent.click(menuIcon('download'));
        expect(onDownload).toHaveBeenCalledTimes(1);
    });

    it('显示操作 tooltip', async () => {
        renderGroup({ showTooltip: true });
        await openPreview(1);
        await expectTips([
            ['chevron_left', '上一张'],
            ['chevron_right', '下一张'],
            ['minus', '缩小'],
            ['plus', '放大'],
            ['real_size_stroked', '原始尺寸'],
        ]);
        await switchRatioAndMovePointerAway();
        await expectTips([
            ['window_adaption_stroked', '适应页面'],
            ['rotate', '旋转'],
            ['download', '下载'],
        ]);
    });

    it('自定义操作 tooltip', async () => {
        renderGroup({
            adaptiveTip: 'Adaption',
            downloadTip: 'Download',
            nextTip: 'Next',
            originTip: 'Original size',
            prevTip: 'Prev',
            rotateTip: 'Rotate',
            showTooltip: true,
            zoomInTip: 'ZoomIn',
            zoomOutTip: 'ZoomOut',
        });
        await openPreview(1);
        await expectTips([
            ['chevron_left', 'Prev'],
            ['chevron_right', 'Next'],
            ['minus', 'ZoomOut'],
            ['plus', 'ZoomIn'],
            ['real_size_stroked', 'Original size'],
        ]);
        await switchRatioAndMovePointerAway();
        await expectTips([
            ['window_adaption_stroked', 'Adaption'],
            ['rotate', 'Rotate'],
            ['download', 'Download'],
        ]);
    });

    it('切换图片后的比例状态', async () => {
        renderGroup();
        await openPreview(0);
        await userEvent.click(footerIcon('real_size_stroked'));
        await waitFor(() => expect(footerIcon('window_adaption_stroked')).toBeInTheDocument());
        await userEvent.click(footerIcon('chevron_right'));
        await waitFor(() => expect(footerIcon('real_size_stroked')).toBeInTheDocument());
    });

    it('defaultCurrentIndex', async () => {
        const visible = shallowRef(false);
        render(() => (
            <>
                <Button onClick={() => (visible.value = !visible.value)}>{() => 'show multiple'}</Button>
                <ImagePreview
                    defaultCurrentIndex={1}
                    src={srcList1}
                    visible={visible.value}
                    onVisibleChange={(value: boolean) => {
                        visible.value = value;
                    }}
                />
            </>
        ));
        await userEvent.click(screen.getByText('show multiple'));
        await waitFor(() => expect(previewImg()).toHaveAttribute('src', seaside));
    });

    it('lazyLoad + lazyLoadMargin', async () => {
        const srcList2 = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'black'].map((color) => svg(color, 200, 200));
        // The group is shorter than a 200px row: a row starting exactly at the group's bottom edge is edge-adjacent,
        // which IntersectionObserver reports as intersecting
        render(() => (
            <ImagePreview lazyLoadMargin="0px" style={{ width: '848px', height: '190px', overflow: 'auto' }}>
                {() => (
                    <Row style={{ width: '800px' }}>
                        {() =>
                            srcList2.map((src, index) => (
                                <Col key={index} span={6} style={{ height: '200px' }}>
                                    {() => <Image alt={`lamp${index + 1}`} src={src} style={{ width: '200px', height: '200px' }} width={200} />}
                                </Col>
                            ))
                        }
                    </Row>
                )}
            </ImagePreview>
        ));
        const imgs = () => document.querySelectorAll(`.${prefixCls}-img`);
        await waitFor(() => expect(imgs()[0]).toHaveAttribute('src', srcList2[0]));
        expect(imgs()[4]).toHaveAttribute('data-src', srcList2[4]);
        expect(imgs()[4]).not.toHaveAttribute('src');
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-icon-upload_error`)).toBeNull();
        expect(imgs()[4].parentElement).toHaveAttribute('role', 'button');

        const group = $(`.${previewCls}-group`);
        group.scrollTop = group.scrollHeight;
        await waitFor(() => expect(imgs()[4]).toHaveAttribute('src', srcList2[4]));
        expect(imgs()[4]).not.toHaveAttribute('data-src');
    });

    // https://github.com/DouyinFE/semi-design/issues/1838
    it('小高度 Image', async () => {
        renderImage({ height: 10 });
        const img = $(`.${prefixCls}-img`) as HTMLImageElement;
        await waitFor(() => expect(img.complete && img.naturalWidth).toBeGreaterThan(0));
        expect(img.getBoundingClientRect().top).toBe($(`.${prefixCls}`).getBoundingClientRect().top);
    });

    it('previewCls 与 previewStyle', async () => {
        render(() => (
            <>
                <Image height={200} preview={{ previewCls: 'test-preview', previewStyle: { background: 'lightblue' } }} src={abstractLite} width={360} />
                <Group images={lamps} previewCls="test-imagePreview" previewStyle={{ background: 'lightgreen' }} />
            </>
        ));
        // the lone image only becomes a preview trigger once loaded; clicking earlier would hit the group's thumbnail
        await expect.poll(() => thumbnails()[0]).toHaveStyle({ width: '360px', height: '200px' });
        await openPreview(0);
        expect(preview()).toHaveClass('test-preview');
        expect(preview()?.getAttribute('style')).toContain('background: lightblue;');
        await userEvent.click(preview() as HTMLElement);
        await waitFor(() => expect(preview()).toBeNull());

        await openPreview(1);
        expect(preview()).toHaveClass('test-imagePreview');
        expect(preview()?.getAttribute('style')).toContain('background: lightgreen;');
    });

    it('键盘操作：Tab 可到达每个控件，Enter 与 Space 触发它们，方向键切换，Esc 返回焦点', async () => {
        render(Model, { props: { src: srcList1 } });
        const trigger = screen.getByRole('button', { name: 'open' });
        trigger.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(preview()).toBeInTheDocument());
        const dialog = screen.getByRole('dialog', { name: '预览' });
        expect(document.activeElement).toBe(dialog);

        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(pageInfo()).toHaveTextContent('2/3'));
        await userEvent.keyboard('{ArrowLeft}');
        await waitFor(() => expect(pageInfo()).toHaveTextContent('1/3'));

        const visited: (string | null)[] = [];
        for (let i = 0; i < 11; i++) {
            await userEvent.keyboard('{Tab}');
            const active = document.activeElement as HTMLElement;
            visited.push(active.getAttribute('aria-label') ?? active.getAttribute('role'));
        }
        expect(visited).toEqual(['关闭', '下一张', '上一张', '下一张', '缩小', '缩放', '放大', '原始尺寸', '旋转', '下载', '关闭']);
        expect(getComputedStyle(document.activeElement as HTMLElement).outlineStyle).toBe('solid');

        screen.getByRole('button', { name: '原始尺寸' }).focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.getByRole('button', { name: '适应页面' })).toBeInTheDocument());
        screen.getAllByRole('button', { name: '下一张' })[0].focus();
        await userEvent.keyboard(' ');
        await waitFor(() => expect(pageInfo()).toHaveTextContent('2/3'));

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(preview()).toBeNull());
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'open' }));
    });

    it('控件外观保持不变：没有原生按钮的边框、内边距或背景', async () => {
        renderGroup();
        await openPreview(1);
        for (const name of ['关闭', '上一张', '旋转']) {
            for (const button of screen.getAllByRole('button', { name })) {
                const style = getComputedStyle(button);
                expect([name, style.borderTopStyle, style.paddingTop]).toEqual([name, 'none', '0px']);
            }
        }
        const footerButton = screen.getByRole('button', { name: '旋转' });
        expect(getComputedStyle(footerButton).backgroundColor).toBe('rgba(0, 0, 0, 0)');
        const { width, height } = footerButton.getBoundingClientRect();
        const icon = (footerButton.querySelector(`.${BASE_CLASS_PREFIX}-icon`) as HTMLElement).getBoundingClientRect();
        expect([width, height]).toEqual([icon.width, icon.height]);
        expect(getComputedStyle($(`.${previewCls}-header-close`)).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    it('预览触发器在其盒子内显示主题焦点环', async () => {
        const { container } = render(Image, { props: { alt: 'red', height: 96, src: svg('red'), width: 96 } });
        const trigger = container.firstElementChild as HTMLElement;
        await tabTo(trigger);
        expectThemeFocusRing(trigger);
        // the thumbnail often sits flush in an overflow: hidden container, so the ring is drawn inside
        expect(getComputedStyle(trigger).outlineOffset).toBe('-2px');
    });

    it('非模态预览：在自定义容器中不锁定 body 滚动，页面其余部分保持可用', async () => {
        render(() => (
            <div>
                <button type="button">page action</button>
                <div id="host" style={{ height: '400px', position: 'relative' }}>
                    <Group images={lamps} getPopupContainer={() => document.getElementById('host') as HTMLElement} />
                </div>
            </div>
        ));
        await openPreview(0);
        const dialog = screen.getByRole('dialog', { name: '预览' });
        expect(dialog).not.toHaveAttribute('aria-modal');
        expect(document.activeElement).toBe(dialog);
        expect(getComputedStyle(document.body).overflow).not.toBe('hidden');
        const pageAction = screen.getByRole('button', { name: 'page action' });
        await userEvent.click(pageAction);
        expect(document.activeElement).toBe(pageAction);
    });
});
