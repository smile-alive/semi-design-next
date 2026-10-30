import { render, waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import type { CropperProps } from '../interface';
import CropperFixture from './cropper-fixture.svelte';

function query(container: Element, selector: string) {
    const found = container.querySelector<HTMLElement>(selector);
    if (!found) throw new Error(`missing ${selector}`);
    return found;
}

// a real image, so the box is laid out from its natural size the way a page sees it
const src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect width="800" height="400" fill="teal"/></svg>');

async function renderLoaded(props: CropperProps = {}) {
    const { container } = render(CropperFixture, { props: { props: { src, style: 'width: 400px; height: 300px', ...props } } });
    const root = query(container, '.semi-cropper');
    const box = query(container, '.semi-cropper-box');
    await waitFor(() => expect(box.style.width).not.toBe('0px'));
    return { container, root, box };
}

describe('Svelte Cropper（浏览器）', () => {
    it('拖动裁剪框时，指针移出裁剪器后仍持续跟随，松开后结束', async () => {
        const { box, root } = await renderLoaded();
        expect(getComputedStyle(root).touchAction).toBe('none');
        const outside = document.body.appendChild(document.createElement('div'));
        const { right, top } = root.getBoundingClientRect();
        outside.style.cssText = `position:fixed;left:${right + 20}px;top:${top}px;width:200px;height:300px`;

        await userEvent.dragAndDrop(box, outside);
        // the pointer ends past the right edge, so the box stops at the right edge of the cropper
        expect(box.getBoundingClientRect().right).toBeCloseTo(root.getBoundingClientRect().right, 0);

        const transform = box.style.transform;
        await userEvent.hover(box, { position: { x: 5, y: 5 } });
        expect(box.style.transform).toBe(transform);
        outside.remove();
    });

    it('拖动角点可调整裁剪框大小，松开后结束', async () => {
        const { container, box } = await renderLoaded();
        const corner = query(container, '[data-dir="br"]');
        const before = box.getBoundingClientRect();

        await userEvent.dragAndDrop(corner, box, { targetPosition: { x: 10, y: 10 } });
        const after = box.getBoundingClientRect();
        expect(after.width).toBeLessThan(before.width);
        expect(after.height).toBeLessThan(before.height);

        const width = box.style.width;
        await userEvent.hover(corner);
        expect(box.style.width).toBe(width);
    });

    it('方向键移动裁剪框时，右缘停在容器内容区的右边界（带边框的根元素）', async () => {
        const { root, box } = await renderLoaded({ aspectRatio: 1, style: 'width: 400px; height: 300px; border: 10px solid teal' });
        await tabTo(box);
        await userEvent.keyboard('{ArrowRight>20/}');
        const rect = box.getBoundingClientRect();
        expect(rect.right - root.getBoundingClientRect().left - root.clientLeft).toBeCloseTo(root.clientWidth, 0);
    });

    it('Tab 可到达裁剪框，并显示主题焦点环', async () => {
        const { box } = await renderLoaded();
        await tabTo(box);
        expectThemeFocusRing(box);
    });

    it('方向键移动裁剪框，Shift 加方向键调整大小', async () => {
        const { box } = await renderLoaded();
        await tabTo(box);
        const before = box.getBoundingClientRect();
        await userEvent.keyboard('{ArrowLeft}');
        expect(box.getBoundingClientRect().left).toBe(before.left - 10);
        await userEvent.keyboard('{Shift>}{ArrowLeft}{/Shift}');
        expect(box.getBoundingClientRect().width).toBe(before.width - 10);
    });
});
