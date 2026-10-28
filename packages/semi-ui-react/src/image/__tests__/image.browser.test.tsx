import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconChevronLeft, IconChevronRight, IconDownload, IconMinus, IconPlus, IconRealSizeStroked, IconRotate, IconUploadError, IconWindowAdaptionStroked } from '@fibrae/semi-icons-react';
import { Button, Col, Image, ImagePreview, Row } from '@fibrae/semi-ui-react';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';

const svg = (color, width = 96, height = 96) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="${color}"/></svg>`)}`;

describe('Image（浏览器）', () => {
    it('宿主限制 img 的 max-width 时，预览图仍可放大超出容器宽度', async () => {
        // Tailwind Preflight caps img at max-width: 100%; the preview renders in a portal, outside .semi-image
        const reset = document.createElement('style');
        reset.textContent = '@layer semi.reset { img { max-width: 100%; height: auto; } }';
        document.head.append(reset);
        onTestFinished(() => reset.remove());

        render(<ImagePreview src={svg('red', 400, 400)} visible />);
        const img = await waitFor(() => {
            const el = document.querySelector(`.${BASE_CLASS_PREFIX}-image-preview-image-img`);
            expect(el).not.toBeNull();
            return el;
        });
        expect(getComputedStyle(img).maxWidth).toBe('none');
    });

    it('issue1526：挂载后添加到 ImagePreview 的懒加载图片会获得 src', async () => {
        const srcList = [svg('red'), svg('green'), svg('blue')];
        const renderPreview = (list) => (
            <ImagePreview>
                {list.map((src) => (
                    <div key={src} style={{ display: 'inline-block' }}>
                        <Image height={96} src={src} width={96} />
                    </div>
                ))}
            </ImagePreview>
        );
        const { container, rerender } = render(renderPreview([]));
        rerender(renderPreview(srcList));

        const imgs = container.querySelectorAll(`.${BASE_CLASS_PREFIX}-image-img`);
        expect(imgs).toHaveLength(3);
        await waitFor(() => expect([...imgs].map((img) => img.getAttribute('src'))).toEqual(srcList));
        imgs.forEach((img) => expect(img).not.toHaveAttribute('data-src'));
    });
});

const prefixCls = `${BASE_CLASS_PREFIX}-image`;
const previewCls = `${prefixCls}-preview`;

// Local stand-ins for the remote demo images, with the natural sizes the zoom assertions depend on
const abstractLite = svg('purple', 1440, 800);
const lion = svg('orange', 1080, 720);
const seaside = svg('steelblue', 1080, 720);
const beach = svg('khaki', 1080, 720);
const srcList1 = [lion, seaside, beach];

const preview = () => document.querySelector(`.${previewCls}`);
const previewImg = () => document.querySelector(`.${previewCls}-image-img`);
const footerIcon = (name) => document.querySelector(`.${previewCls}-footer .${BASE_CLASS_PREFIX}-icon-${name}`);
const thumbnails = () => document.querySelectorAll(`.${prefixCls}-img-preview`);

async function openPreview(index = 0) {
    await waitFor(() => expect(thumbnails()[index]).toBeInTheDocument());
    await userEvent.click(thumbnails()[index]);
    await waitFor(() => expect(preview()).toBeInTheDocument());
}

// The preview image is sized once it has loaded, from its natural size and the container
async function expectPreviewSize(width, height) {
    await waitFor(() => {
        const style = getComputedStyle(previewImg());
        expect(style.width).toBe(`${width}px`);
        expect(style.height).toBe(`${height}px`);
    });
}

const expectTooltip = (text) => waitFor(() => expect([...document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`)].map((el) => el.textContent)).toContain(text));

// The ratio icon is swapped in place inside the same Tooltip, so the pointer already rests on the new icon and the
// old tip is still open. Leave the footer so the next hover is a real pointer move, and wait until that tip has
// finished hiding: Tooltip ignores a show request while its hide animation is running
async function switchRatioAndMovePointerAway() {
    await userEvent.click(footerIcon('real_size_stroked'));
    await waitFor(() => expect(footerIcon('window_adaption_stroked')).toBeInTheDocument());
    await userEvent.hover(document.querySelector(`.${previewCls}-prev`));
    await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`)).toBeNull());
}

const Group = (props) => (
    <ImagePreview {...props}>
        {srcList1.map((src, index) => (
            <Image key={index} alt={`lamp${index + 1}`} src={src} width={200} />
        ))}
    </ImagePreview>
);

function ControlledPreview({ src }) {
    const [visible, setVisible] = useState(false);
    return (
        <>
            <Button onClick={() => setVisible(!visible)}>{visible ? 'hide' : 'show'}</Button>
            <ImagePreview src={src} visible={visible} onVisibleChange={setVisible} />
        </>
    );
}

describe('Image', () => {
    afterEach(async () => {
        await page.viewport(1000, 660);
    });

    it('基础图片', async () => {
        const renderImage = (previewProps) => <Image height={200} preview={previewProps} src={abstractLite} width={360} />;
        const { rerender } = render(renderImage({}));
        await expect.poll(() => thumbnails()[0]).toHaveStyle({ width: '360px', height: '200px' });
        await openPreview();
        await userEvent.click(preview());
        await waitFor(() => expect(preview()).toBeNull());

        rerender(renderImage(false));
        await userEvent.click(document.querySelector(`.${prefixCls}-img`));
        expect(preview()).toBeNull();
    });

    it('加载失败的 Image', async () => {
        const errorSrc = 'data:image/png;base64,AAAA';
        render(
            <>
                <Image height={200} src={errorSrc} width={200} />
                <Image fallback={<IconUploadError style={{ fontSize: 50 }} />} height={200} src={errorSrc} width={200} />
            </>
        );
        await waitFor(() => expect(document.querySelectorAll(`.${prefixCls}-status`)).toHaveLength(2));
        const [defaultStatus, customStatus] = document.querySelectorAll(`.${prefixCls}-status`);
        expect(defaultStatus.querySelector(`:scope > .${BASE_CLASS_PREFIX}-icon-upload_error`)).toBeInTheDocument();
        expect(customStatus.querySelector(':scope > span')).toHaveAttribute('style', expect.stringContaining('font-size: 50px;'));
    });

    it('受控单张预览', async () => {
        render(<ControlledPreview src={abstractLite} />);
        await userEvent.click(screen.getByText('show'));
        await waitFor(() => expect(preview()).toBeInTheDocument());
        await userEvent.click(preview());
        await waitFor(() => expect(preview()).toBeNull());
    });

    it('受控的 image show', async () => {
        function Demo() {
            const [visible, setVisible] = useState(false);
            return <Image height={200} preview={{ visible, onVisibleChange: setVisible }} src={abstractLite} width={360} />;
        }
        render(<Demo />);
        await openPreview();
        await userEvent.click(preview());
        await waitFor(() => expect(preview()).toBeNull());
    });

    it('受控多张预览', async () => {
        render(<ControlledPreview src={srcList1} />);
        await userEvent.click(screen.getByText('show'));
        await waitFor(() => expect(preview()).toBeInTheDocument());
        const pageInfo = () => document.querySelector(`.${previewCls}-footer-page`);

        expect(document.querySelector(`.${previewCls}-next`)).toBeVisible();
        await userEvent.click(document.querySelector(`.${previewCls}-next`));
        await waitFor(() => expect(pageInfo()).toHaveTextContent('2/3'));
        expect(preview()).toBeInTheDocument();

        expect(document.querySelector(`.${previewCls}-prev`)).toBeVisible();
        await userEvent.click(document.querySelector(`.${previewCls}-prev`));
        await waitFor(() => expect(pageInfo()).toHaveTextContent('1/3'));
    });

    it('鼠标拖拽', async () => {
        // A 1440x800 image in a 1440x800 container starts at the adaptation zoom (800 - 80) / 800 = 0.9
        await page.viewport(1440, 800);
        render(<Image height={200} src={abstractLite} width={360} />);
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
        render(<Image height={200} src={abstractLite} width={360} />);
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
        render(<Image height={200} preview={{ src: big }} src={small} width={300} />);
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-img`)).toHaveAttribute('src', small));
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
        render(<Group {...callbacks} />);
        await openPreview(1);

        await userEvent.click(footerIcon('chevron_left'));
        expect(callbacks.onPrev).toHaveBeenCalledTimes(1);
        await userEvent.click(footerIcon('chevron_right'));
        expect(callbacks.onNext).toHaveBeenCalledTimes(1);

        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-icon-arrow_right`));
        expect(callbacks.onNext).toHaveBeenCalledTimes(2);
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-icon-arrow_left`));
        expect(callbacks.onPrev).toHaveBeenCalledTimes(2);

        await userEvent.click(footerIcon('plus'));
        await userEvent.click(footerIcon('minus'));
        expect(callbacks.onZoomOut).toHaveBeenCalled();
        callbacks.onZoomIn.mockClear();
        await userEvent.click(footerIcon('plus'));
        expect(callbacks.onZoomIn).toHaveBeenCalled();

        const handle = () => document.querySelector(`.${BASE_CLASS_PREFIX}-slider-handle`);
        const rail = document.querySelector(`.${BASE_CLASS_PREFIX}-slider-rail`);
        // Drop on the slider itself: the filled track covers the rail, so the rail is not the element under the pointer
        const slider = document.querySelector(`.${BASE_CLASS_PREFIX}-slider`);
        const railRect = rail.getBoundingClientRect();
        const sliderRect = slider.getBoundingClientRect();
        const railPoint = (x) => ({
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
        render(<Group infinite />);
        await openPreview(1);
        await userEvent.click(document.querySelector(`.${previewCls}-prev`));
        await waitFor(() => expect(previewImg()).toHaveAttribute('src', lion));
        await userEvent.click(document.querySelector(`.${previewCls}-prev`));
        await waitFor(() => expect(previewImg()).toHaveAttribute('src', beach));
        await userEvent.click(document.querySelector(`.${previewCls}-next`));
        await waitFor(() => expect(previewImg()).toHaveAttribute('src', lion));
    });

    it('基础图片', async () => {
        const renderImage = (closeOnEsc) => <Image height={200} preview={{ closeOnEsc }} src={abstractLite} width={360} />;
        const { rerender } = render(renderImage(true));
        await openPreview();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(preview()).toBeNull());

        rerender(renderImage(false));
        await openPreview();
        await userEvent.keyboard('{Escape}');
        expect(preview()).toBeInTheDocument();
        await userEvent.click(preview());
        await waitFor(() => expect(preview()).toBeNull());
    });

    it('禁用下载', async () => {
        render(<Image height={200} preview={{ disableDownload: true }} src={abstractLite} width={360} />);
        await openPreview();
        expect(footerIcon('download')).toHaveClass(`${previewCls}-footer-disabled`);
    });

    it('maskClosable', async () => {
        render(<Image height={200} preview={{ maskClosable: false }} src={abstractLite} width={360} />);
        await openPreview();
        await userEvent.click(preview());
        expect(preview()).toBeInTheDocument();
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-icon-close`));
        await waitFor(() => expect(preview()).toBeNull());
    });

    it('自定义容器', async () => {
        render(
            <div id="container" style={{ height: 400, position: 'relative', margin: '100px 200px' }}>
                <Group style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} getPopupContainer={() => document.getElementById('container')} />
            </div>
        );
        await openPreview(0);
        expect(preview().parentElement).toHaveClass(`${BASE_CLASS_PREFIX}-portal`);
        expect(preview().parentElement.parentElement).toHaveAttribute('id', 'container');
    });

    it('自定义顶部渲染', async () => {
        render(
            <ImagePreview renderHeader={(title) => <div>{title}</div>}>
                <div>
                    {srcList1.map((src, index) => (
                        <Image key={index} alt={`lamp${index + 1}`} preview={{ previewTitle: `lamp${index + 1}` }} src={src} width={200} />
                    ))}
                </div>
            </ImagePreview>
        );
        await openPreview(0);
        const title = () => document.querySelector(`.${previewCls}-header-title > div`);
        expect(title()).toHaveTextContent('lamp1');
        expect(document.querySelector(`.${previewCls}-next`)).toBeVisible();
        await userEvent.click(document.querySelector(`.${previewCls}-next`));
        await waitFor(() => expect(title()).toHaveTextContent('lamp2'));
    });

    it('自定义底部渲染', async () => {
        await page.viewport(1200, 800);
        const onDownload = vi.fn<(src: string, index: number) => void>();
        const renderPreviewMenu = (props) => (
            <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                <Button icon={<IconChevronLeft size="large" />} onClick={props.onPrev} />
                <Button icon={<IconChevronRight size="large" />} onClick={props.onNext} />
                <Button icon={<IconMinus size="large" />} onClick={props.onZoomOut} />
                <Button icon={<IconPlus size="large" />} onClick={props.onZoomIn} />
                <Button icon={props.ratio === 'adaptation' ? <IconRealSizeStroked size="large" /> : <IconWindowAdaptionStroked size="large" />} onClick={props.onRatioClick} />
                <Button icon={<IconRotate size="large" />} onClick={props.onRotateRight} />
                <Button icon={<IconRotate size="large" />} onClick={props.onRotateLeft} />
                <Button icon={<IconDownload size="large" />} onClick={props.onDownload} />
            </div>
        );
        render(<Group renderPreviewMenu={renderPreviewMenu} onDownload={onDownload} />);
        await openPreview(0);
        const menuIcon = (name, index = 0) => document.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-${name}`)[index];

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
        render(<Group showTooltip />);
        await openPreview(1);
        const tips = [
            ['chevron_left', '上一张'],
            ['chevron_right', '下一张'],
            ['minus', '缩小'],
            ['plus', '放大'],
            ['real_size_stroked', '原始尺寸'],
        ];
        for (const [icon, tip] of tips) {
            await userEvent.hover(footerIcon(icon));
            await expectTooltip(tip);
            await userEvent.unhover(footerIcon(icon));
        }
        await switchRatioAndMovePointerAway();
        for (const [icon, tip] of [
            ['window_adaption_stroked', '适应页面'],
            ['rotate', '旋转'],
            ['download', '下载'],
        ]) {
            await userEvent.hover(footerIcon(icon));
            await expectTooltip(tip);
            await userEvent.unhover(footerIcon(icon));
        }
    });

    it('自定义操作 tooltip', async () => {
        render(<Group adaptiveTip="Adaption" downloadTip="Download" nextTip="Next" originTip="Original size" prevTip="Prev" rotateTip="Rotate" showTooltip zoomInTip="ZoomIn" zoomOutTip="ZoomOut" />);
        await openPreview(1);
        const tips = [
            ['chevron_left', 'Prev'],
            ['chevron_right', 'Next'],
            ['minus', 'ZoomOut'],
            ['plus', 'ZoomIn'],
            ['real_size_stroked', 'Original size'],
        ];
        for (const [icon, tip] of tips) {
            await userEvent.hover(footerIcon(icon));
            await expectTooltip(tip);
            await userEvent.unhover(footerIcon(icon));
        }
        await switchRatioAndMovePointerAway();
        for (const [icon, tip] of [
            ['window_adaption_stroked', 'Adaption'],
            ['rotate', 'Rotate'],
            ['download', 'Download'],
        ]) {
            await userEvent.hover(footerIcon(icon));
            await expectTooltip(tip);
            await userEvent.unhover(footerIcon(icon));
        }
    });

    // Without a controlled or default ratio, switching to another image goes back to the adaptation ratio
    it('切换图片后的比例状态', async () => {
        render(<Group />);
        await openPreview(0);
        await userEvent.click(footerIcon('real_size_stroked'));
        await waitFor(() => expect(footerIcon('window_adaption_stroked')).toBeInTheDocument());
        await userEvent.click(footerIcon('chevron_right'));
        await waitFor(() => expect(footerIcon('real_size_stroked')).toBeInTheDocument());
    });

    it('defaultCurrentIndex', async () => {
        function Demo() {
            const [visible, setVisible] = useState(false);
            return (
                <>
                    <Button onClick={() => setVisible(!visible)}>show multiple</Button>
                    <ImagePreview defaultCurrentIndex={1} src={srcList1} visible={visible} onVisibleChange={setVisible} />
                </>
            );
        }
        render(<Demo />);
        await userEvent.click(screen.getByText('show multiple'));
        await waitFor(() => expect(previewImg()).toHaveAttribute('src', seaside));
    });

    it('lazyLoad + lazyLoadMargin', async () => {
        const srcList2 = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'black'].map((color) => svg(color, 200, 200));
        render(
            // The group is shorter than a 200px row: a row starting exactly at the group's bottom edge is
            // edge-adjacent, which IntersectionObserver reports as intersecting
            <ImagePreview style={{ width: 848, height: 190, overflow: 'auto' }} lazyLoadMargin="0px">
                <Row style={{ width: 800 }}>
                    {srcList2.map((src, index) => (
                        <Col key={index} style={{ height: 200 }} span={6}>
                            <Image style={{ width: 200, height: 200 }} alt={`lamp${index + 1}`} src={src} width={200} />
                        </Col>
                    ))}
                </Row>
            </ImagePreview>
        );
        const fifth = () => document.querySelectorAll(`.${prefixCls}-img`)[4];
        await waitFor(() => expect(document.querySelectorAll(`.${prefixCls}-img`)[0]).toHaveAttribute('src', srcList2[0]));
        expect(fifth()).toHaveAttribute('data-src', srcList2[4]);
        expect(fifth()).not.toHaveAttribute('src');

        const group = document.querySelector(`.${previewCls}-group`);
        group.scrollTop = group.scrollHeight;
        await waitFor(() => expect(fifth()).toHaveAttribute('src', srcList2[4]));
        expect(fifth()).not.toHaveAttribute('data-src');
    });

    it('lazyLoad：不滚动的分组相对视口懒加载，视口外的图片等待页面滚动', async () => {
        const below = svg('blue', 100, 100);
        render(
            <ImagePreview lazyLoadMargin="0px">
                <Image alt="top" height={100} src={svg('red', 100, 100)} width={100} />
                <div style={{ height: window.innerHeight * 2 }} />
                <Image alt="below" height={100} src={below} width={100} />
            </ImagePreview>
        );
        const [first, last] = document.querySelectorAll(`.${prefixCls}-img`);
        await waitFor(() => expect(first).toHaveAttribute('src'));
        expect(last).not.toHaveAttribute('src');
        last.scrollIntoView();
        onTestFinished(() => window.scrollTo(0, 0));
        await waitFor(() => expect(last).toHaveAttribute('src', below));
    });

    // https://github.com/DouyinFE/semi-design/issues/1838
    it('小高度 Image', async () => {
        render(<Image height={10} src={abstractLite} width={360} />);
        const img = document.querySelector<HTMLImageElement>(`.${prefixCls}-img`);
        await waitFor(() => expect(img.complete && img.naturalWidth).toBeGreaterThan(0));
        expect(img.getBoundingClientRect().top).toBe(document.querySelector(`.${prefixCls}`).getBoundingClientRect().top);
    });

    it('previewCls 与 previewStyle', async () => {
        render(
            <>
                <Image height={200} preview={{ previewCls: 'test-preview', previewStyle: { background: 'lightblue' } }} src={abstractLite} width={360} />
                <Group previewStyle={{ background: 'lightgreen' }} previewCls="test-imagePreview" />
            </>
        );
        // the lone image only becomes a preview trigger once loaded; clicking earlier would hit the group's thumbnail
        await expect.poll(() => thumbnails()[0]).toHaveStyle({ width: '360px', height: '200px' });
        await openPreview(0);
        expect(preview()).toHaveClass('test-preview');
        expect(preview().getAttribute('style')).toContain('background: lightblue;');
        await userEvent.click(preview());
        await waitFor(() => expect(preview()).toBeNull());

        await openPreview(1);
        expect(preview()).toHaveClass('test-imagePreview');
        expect(preview().getAttribute('style')).toContain('background: lightgreen;');
    });

    it('键盘操作：Tab 可到达每个控件，Enter 与 Space 触发它们，方向键切换，Esc 返回焦点', async () => {
        render(<ControlledPreview src={srcList1} />);
        const trigger = screen.getByRole('button', { name: 'show' });
        trigger.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(preview()).toBeInTheDocument());
        const dialog = screen.getByRole('dialog', { name: '预览' });
        expect(document.activeElement).toBe(dialog);
        const pageInfo = () => document.querySelector(`.${previewCls}-footer-page`);

        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(pageInfo()).toHaveTextContent('2/3'));
        await userEvent.keyboard('{ArrowLeft}');
        await waitFor(() => expect(pageInfo()).toHaveTextContent('1/3'));

        // Tab order: close, next arrow, then the footer; the slider handle is a stop of its own
        const visited = [];
        for (let i = 0; i < 11; i++) {
            await userEvent.keyboard('{Tab}');
            const active = document.activeElement;
            visited.push(active.getAttribute('aria-label') ?? active.getAttribute('role'));
        }
        expect(visited).toEqual(['关闭', '下一张', '上一张', '下一张', '缩小', '缩放', '放大', '原始尺寸', '旋转', '下载', '关闭']);
        expect(getComputedStyle(document.activeElement).outlineStyle).toBe('solid');

        screen.getByRole('button', { name: '原始尺寸' }).focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.getByRole('button', { name: '适应页面' })).toBeInTheDocument());
        screen.getAllByRole('button', { name: '下一张' })[0].focus();
        await userEvent.keyboard(' ');
        await waitFor(() => expect(pageInfo()).toHaveTextContent('2/3'));

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(preview()).toBeNull());
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'show' }));
    });

    it('控件外观保持不变：没有原生按钮的边框、内边距或背景', async () => {
        render(<Group />);
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
        const icon = footerButton.querySelector(`.${BASE_CLASS_PREFIX}-icon`).getBoundingClientRect();
        expect([width, height]).toEqual([icon.width, icon.height]);
        expect(getComputedStyle(document.querySelector(`.${previewCls}-header-close`)).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    it('预览触发器在其盒子内显示主题焦点环', async () => {
        const { container } = render(<Image alt="red" height={96} src={svg('red')} width={96} />);
        const trigger = container.firstChild as HTMLElement;
        await tabTo(trigger);
        expectThemeFocusRing(trigger);
        // the thumbnail often sits flush in an overflow: hidden container, so the ring is drawn inside
        expect(getComputedStyle(trigger).outlineOffset).toBe('-2px');
    });
});
