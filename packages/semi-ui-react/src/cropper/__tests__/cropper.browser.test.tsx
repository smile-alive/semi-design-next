import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { Cropper } from '@fibrae/semi-ui-react';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';

const src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect width="800" height="400" fill="teal"/></svg>');

async function renderLoaded() {
    const { container } = render(
        <div style={{ display: 'flex' }}>
            <Cropper style={{ width: 400, height: 300 }} src={src} />
            <div style={{ width: 200, height: 300 }} data-testid="outside" />
        </div>
    );
    const box = container.querySelector<HTMLElement>('.semi-cropper-box');
    await waitFor(() => expect(box.style.width).not.toBe('0px'));
    return { container, box, outside: container.querySelector('[data-testid="outside"]') };
}

describe('Cropper（浏览器）', () => {
    it('拖动裁剪框时，指针移出裁剪器后仍持续跟随，松开后结束', async () => {
        const { box, outside } = await renderLoaded();
        const root = box.closest('.semi-cropper');
        expect(getComputedStyle(root).touchAction).toBe('none');

        await userEvent.dragAndDrop(box, outside);
        const rootRect = root.getBoundingClientRect();
        const boxRect = box.getBoundingClientRect();
        expect(boxRect.right).toBeCloseTo(rootRect.right, 0);

        const transform = box.style.transform;
        await userEvent.hover(box, { position: { x: 5, y: 5 } });
        expect(box.style.transform).toBe(transform);
    });

    it('拖动角点可调整裁剪框大小，松开后结束', async () => {
        const { container, box } = await renderLoaded();
        const corner = container.querySelector('[data-dir="br"]');
        const before = box.getBoundingClientRect();

        await userEvent.dragAndDrop(corner, box, { targetPosition: { x: 10, y: 10 } });
        const after = box.getBoundingClientRect();
        expect(after.width).toBeLessThan(before.width);
        expect(after.height).toBeLessThan(before.height);

        const width = box.style.width;
        await userEvent.hover(corner);
        expect(box.style.width).toBe(width);
    });
});

// the box lives in the padding box, so its coordinates start at the border's inner edge
async function renderBordered(props = {}) {
    const { container } = render(<Cropper style={{ width: 400, height: 300, border: '10px solid teal' }} src={src} {...props} />);
    const root = container.querySelector<HTMLElement>('.semi-cropper');
    const box = container.querySelector<HTMLElement>('.semi-cropper-box');
    await waitFor(() => expect(box.style.width).not.toBe('0px'));
    const edges = () => {
        const rect = box.getBoundingClientRect();
        const origin = root.getBoundingClientRect();
        const left = rect.left - origin.left - root.clientLeft;
        const top = rect.top - origin.top - root.clientTop;
        return { left, top, right: left + rect.width, bottom: top + rect.height };
    };
    return { container, root, box, edges };
}

const FREE_EDGES = {
    tl: ['left', 'top'],
    tm: ['top'],
    tr: ['right', 'top'],
    ml: ['left'],
    mr: ['right'],
    bl: ['left', 'bottom'],
    bm: ['bottom'],
    br: ['right', 'bottom'],
} as const;
const ASPECT_EDGES = {
    tl: ['top'],
    tm: ['top'],
    tr: ['top'],
    ml: ['left'],
    mr: ['right'],
    bl: ['bottom'],
    bm: ['bottom'],
    br: ['bottom'],
} as const;

describe('Cropper 根元素带边框', () => {
    describe.each([
        ['自由比例', undefined, FREE_EDGES],
        ['固定宽高比', 2, ASPECT_EDGES],
    ] as const)('%s', (_, aspectRatio, followed) => {
        it.each(Object.keys(followed))('拖动 %s 手柄，被拖的边跟随指针在容器内的坐标', async (dir) => {
            const { container, root, edges } = await renderBordered({ aspectRatio });
            const before = edges();
            const x = dir.includes('l') ? before.left + 40 : dir.includes('r') ? before.right - 40 : (before.left + before.right) / 2;
            const y = dir.includes('t') ? before.top + 40 : dir.includes('b') ? before.bottom - 40 : (before.top + before.bottom) / 2;

            await userEvent.dragAndDrop(container.querySelector(`[data-dir="${dir}"]`), root, {
                targetPosition: { x, y },
            });

            const after = edges();
            for (const edge of followed[dir]) {
                expect(after[edge]).toBeCloseTo(edge === 'left' || edge === 'right' ? x : y, 0);
            }
        });
    });

    it('方向键移动裁剪框时，右缘停在容器内容区的右边界', async () => {
        const { box, root, edges } = await renderBordered({ aspectRatio: 1 });
        await tabTo(box);

        await userEvent.keyboard('{ArrowRight>20/}');

        expect(edges().right).toBeCloseTo(root.clientWidth, 0);
    });
});

describe('Cropper 键盘操作', () => {
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
