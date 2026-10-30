import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import Outside from './outside.svelte';

const query = <T extends Element = HTMLElement>(container: Element, selector: string) => container.querySelector<T>(selector) as T;

describe('Svelte Resizable（浏览器）', () => {
    it('拖动手柄时，即使指针移出盒子也继续缩放，松开后结束', async () => {
        const { container } = render(Outside, { props: { mode: 'single' } });
        const box = query(container, '.semi-resizable-resizable');
        const handle = query(container, '.semi-resizable-resizableHandler-right');
        expect(getComputedStyle(handle).touchAction).toBe('none');

        // forced: the drop target moves or is covered by the cursor layer while the drag is in progress
        await userEvent.dragAndDrop(handle, query(container, '[data-testid="outside"]'), { force: true });
        const width = box.offsetWidth;
        expect(width).toBeGreaterThan(200);

        await userEvent.hover(handle);
        expect(box.offsetWidth).toBe(width);
    });

    it('拖动分组手柄时，即使指针移出分组也继续缩放，松开后结束', async () => {
        const { container } = render(Outside, { props: { mode: 'group' } });
        const [first, second] = container.querySelectorAll<HTMLElement>('.semi-resizable-item');
        const handler = query(container, '.semi-resizable-handler');
        expect(getComputedStyle(handler).touchAction).toBe('none');

        await userEvent.dragAndDrop(handler, query(container, '[data-testid="outside"]'), { force: true });
        expect(second?.offsetWidth).toBe(0);
        const width = first?.offsetWidth;

        await userEvent.hover(query(container, '.semi-resizable-item'));
        expect(first?.offsetWidth).toBe(width);
    });
});
