import { render, waitFor } from '@testing-library/svelte';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { keyboardClick, mouse } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { ImageProps, PreviewProps } from '../interface';
import GroupFixture from './group-fixture.svelte';
import { $, arrow, footerIcon, getPreview, pageInfo, prefixCls, previewCls, previewImg, thumbs } from './helpers';

const svg = (color: string, width = 96, height = 96) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="${color}"/></svg>`)}`;

const list = [svg('orange', 1080, 720), svg('steelblue', 1080, 720), svg('khaki', 1080, 720)];

function renderGroup(props: PreviewProps = {}, images: ImageProps[] = list.map((src) => ({ src, width: 120, height: 80 }))) {
    const store = createStore<{ props: PreviewProps; images: ImageProps[]; snippets: string[] }>({ props: { src: list, ...props }, images, snippets: [] });
    return { ...render(GroupFixture, { props: { store } }), store };
}

// The thumbnail's root is the button; Safari does not focus a clicked button, so open it from the keyboard
const thumbRoot = (index: number) => thumbs()[index].closest(`.${prefixCls}`) as HTMLElement;

async function openPreview(index = 0) {
    await keyboardClick(thumbRoot(index));
    await waitFor(() => expect(getPreview()).not.toBeNull());
}

// The preview image is sized once it has loaded and fitted into the container
const imageSized = () => waitFor(() => expect(previewImg().style.width).not.toBe(''));
const width = () => Number.parseFloat(previewImg().style.width);
const translateX = () => new DOMMatrix(getComputedStyle(previewImg()).transform).m41;

describe('Svelte ImagePreview 焦点（浏览器）', () => {
    it('Tab 保持在预览内，Esc 关闭后焦点回到打开它的缩略图', async () => {
        renderGroup();
        await openPreview(1);
        const dialog = getPreview() as HTMLElement;
        await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
        for (let i = 0; i < 12; i++) {
            await userEvent.keyboard('{Tab}');
            expect(dialog.contains(document.activeElement)).toBe(true);
        }
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPreview()).toBeNull());
        expect(thumbRoot(1)).toHaveFocus();
    });
});

describe('Svelte ImagePreview 交互（浏览器）', () => {
    it('ArrowLeft 与 ArrowRight 切换图片', async () => {
        renderGroup();
        await openPreview(0);
        expect(pageInfo()).toBe('1/3');
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(pageInfo()).toBe('2/3'));
        await userEvent.keyboard('{ArrowLeft}');
        await waitFor(() => expect(pageInfo()).toBe('1/3'));
        expect(previewImg()).toHaveAttribute('src', list[0]);
    });

    it('点击下一张箭头切换，首张时没有上一张箭头', async () => {
        renderGroup();
        await openPreview(0);
        expect($(`.${previewCls}-prev`)).toBeNull();
        await userEvent.click(arrow('next'));
        await waitFor(() => expect(pageInfo()).toBe('2/3'));
        expect(arrow('prev')).toBeInTheDocument();
    });

    it('滚轮放大再缩小，并阻止页面缩放', async () => {
        renderGroup();
        await openPreview(0);
        await imageSized();
        const fitted = width();
        const wheel = (deltaY: number) => {
            const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY });
            (getPreview() as HTMLElement).dispatchEvent(event);
            return event;
        };
        expect(wheel(-100).defaultPrevented).toBe(true);
        await waitFor(() => expect(width()).toBeGreaterThan(fitted));
        wheel(100);
        await waitFor(() => expect(width()).toBeCloseTo(fitted, 0));
    });

    it('放大到真实尺寸后可用鼠标拖动平移', async () => {
        const big = svg('purple', 3000, 2000);
        renderGroup({ src: [big] }, [{ src: big, width: 120, height: 80 }]);
        await openPreview(0);
        await imageSized();
        await userEvent.click(footerIcon('real_size_stroked'));
        await waitFor(() => expect(width()).toBe(3000));
        expect(translateX()).toBe(0);

        const { left, top, width: w, height: h } = previewImg().getBoundingClientRect();
        const x = left + w / 2;
        const y = top + h / 2;
        await mouse('move', x, y);
        await mouse('down', x, y);
        await mouse('move', x + 20, y);
        await mouse('move', x + 60, y);
        await mouse('up', x + 60, y);
        await waitFor(() => expect(translateX()).toBeCloseTo(60, 0));
    });

    it('src 不在列表中的缩略图单独预览，没有分组的页码跳转', async () => {
        const lone = svg('purple', 600, 400);
        const { container } = renderGroup({}, [{ src: lone, width: 120, height: 80 }]);
        // an image outside the list opens only once it has loaded
        await waitFor(() => expect(thumbRoot(0)).toHaveAttribute('role', 'button'));
        await openPreview(0);
        expect(previewImg()).toHaveAttribute('src', lone);
        expect(container.querySelector(`.${previewCls}-prev`)).toBeNull();
    });

    it('宿主限制 img 的 max-width 时，预览图仍可放大超出容器宽度', async () => {
        // Tailwind Preflight caps img at max-width: 100%; the preview renders in a portal, outside .semi-image
        const reset = document.createElement('style');
        reset.textContent = '@layer semi.reset { img { max-width: 100%; height: auto; } }';
        document.head.append(reset);
        onTestFinished(() => reset.remove());

        renderGroup({ visible: true, src: [svg('red', 400, 400)] }, []);
        await waitFor(() => expect(previewImg()).not.toBeNull());
        expect(getComputedStyle(previewImg()).maxWidth).toBe('none');
    });
});

describe('Svelte ImagePreview 懒加载（浏览器）', () => {
    it('分组 lazyLoad 时，进入视口的缩略图获得 src 并去掉 data-src', async () => {
        const small = [svg('red'), svg('green'), svg('blue')];
        const { container } = renderGroup(
            { lazyLoad: true, src: small },
            small.map((src) => ({ src, width: 96, height: 96 }))
        );
        const imgs = container.querySelectorAll(`.${prefixCls}-img`);
        expect(imgs).toHaveLength(3);
        await waitFor(() => expect([...imgs].map((img) => img.getAttribute('src'))).toEqual(small));
        for (const img of imgs) expect(img).not.toHaveAttribute('data-src');
    });

    it('挂载后加入分组的图片同样获得 src', async () => {
        const small = [svg('red'), svg('green')];
        const { container, store } = renderGroup({ lazyLoad: true, src: small }, []);
        store.images = small.map((src) => ({ src, width: 96, height: 96 }));
        await waitFor(() => expect([...container.querySelectorAll(`.${prefixCls}-img`)].map((img) => img.getAttribute('src'))).toEqual(small));
    });
});
