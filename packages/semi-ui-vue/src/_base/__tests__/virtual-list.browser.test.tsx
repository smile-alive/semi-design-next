/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowRef, type CSSProperties } from 'vue';
import { screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import VirtualList, { type VirtualListHandle, type VirtualListScrollArgs } from '../virtual-list.vue';

const data = Array.from({ length: 100 }, (_, i) => `row ${i}`);

async function renderList(initial: Record<string, unknown> = {}) {
    const extra = shallowRef<Record<string, unknown>>(initial);
    let handle: VirtualListHandle | null = null;
    const Host = defineComponent(() => () => (
        <VirtualList
            ref={(el: unknown) => {
                handle = el as VirtualListHandle | null;
            }}
            data-testid="outer"
            height={300}
            itemCount={100}
            itemSize={36}
            {...extra.value}
        >
            {{
                default: ({ index, style }: { index: number; style: CSSProperties }) => (
                    <div data-testid="row" style={style}>
                        {data[index]}
                    </div>
                ),
            }}
        </VirtualList>
    ));
    render(Host);
    // the virtualizer takes the scroll container in the flush after the first render
    await nextTick();
    return {
        handle: () => handle as VirtualListHandle,
        outer: screen.getByTestId('outer'),
        update: async (next: Record<string, unknown>) => {
            extra.value = { ...extra.value, ...next };
            await nextTick();
        },
    };
}

const firstRow = () => screen.getAllByTestId('row')[0].textContent;

describe('VirtualList', () => {
    it('真实滚动后渲染新的行', async () => {
        const { outer } = await renderList();
        outer.scrollTop = 36 * 50;
        await expect.poll(firstRow).toBe('row 48');
        expect(screen.queryByText('row 0')).toBeNull();
    });

    it('scrollToItem 的 center、auto、smart 对齐', async () => {
        const { handle, outer } = await renderList();

        handle().scrollToItem(50, 'center');
        // the row's middle meets the viewport's middle: 50 * 36 + (36 - 300) / 2
        expect(outer.scrollTop).toBe(1668);

        outer.scrollTop = 0;
        handle().scrollToItem(3);
        expect(outer.scrollTop).toBe(0);
        handle().scrollToItem(20);
        // least scroll: the row's bottom meets the viewport's bottom
        expect(outer.scrollTop).toBe(21 * 36 - 300);

        outer.scrollTop = 0;
        handle().scrollToItem(10, 'smart');
        expect(outer.scrollTop).toBe(11 * 36 - 300);
        outer.scrollTop = 0;
        handle().scrollToItem(50, 'smart');
        expect(outer.scrollTop).toBe(1668);
    });

    it('height 变化后 smart 按新的可视区高度判断', async () => {
        const { handle, update } = await renderList();
        await update({ height: 150 });
        // row 10 is more than one 150px viewport away from the top, so it is centered: 10 * 36 + (36 - 150) / 2
        handle().scrollToItem(10, 'smart');
        expect(screen.getByTestId('outer').scrollTop).toBe(303);
    });

    it('scrollTo 滚动到指定偏移并渲染那里的行', async () => {
        const { handle, outer } = await renderList();
        handle().scrollTo(720);
        expect(outer.scrollTop).toBe(720);
        expect(await screen.findByText('row 20')).toBeInTheDocument();
    });

    it('句柄引起的滚动报告 scrollUpdateWasRequested，用户滚动和未移动的调用不报告', async () => {
        const onScroll = vi.fn<(args: VirtualListScrollArgs) => void>();
        const { handle, outer } = await renderList({ onScroll });
        const lastRequested = () => onScroll.mock.lastCall?.[0].scrollUpdateWasRequested;

        handle().scrollTo(720);
        await expect
            .poll(() => onScroll.mock.lastCall?.[0])
            .toEqual({
                scrollDirection: 'forward',
                scrollOffset: 720,
                scrollUpdateWasRequested: true,
            });

        outer.scrollTop = 360;
        await expect.poll(() => onScroll.mock.lastCall?.[0].scrollOffset).toBe(360);
        expect(lastRequested()).toBe(false);

        handle().scrollToItem(12);
        expect(outer.scrollTop).toBe(360);
        outer.scrollTop = 0;
        await expect.poll(() => onScroll.mock.lastCall?.[0].scrollOffset).toBe(0);
        expect(lastRequested()).toBe(false);
    });
});
