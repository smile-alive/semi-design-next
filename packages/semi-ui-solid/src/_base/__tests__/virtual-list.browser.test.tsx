import { createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import VirtualList, { type VirtualListHandle, type VirtualListProps, type VirtualListRowProps } from '../virtual-list';

function Row(props: VirtualListRowProps<string[]>) {
    return (
        <div style={props.style} data-testid="row">
            {props.data[props.index]}
        </div>
    );
}

const data = Array.from({ length: 100 }, (_, i) => `row ${i}`);

function renderList(props: Partial<VirtualListProps<string[]>> = {}) {
    let handle: VirtualListHandle | undefined;
    render(() => (
        <VirtualList ref={(h) => (handle = h)} data-testid="outer" height={300} itemCount={100} itemData={data} itemSize={36} {...props}>
            {Row}
        </VirtualList>
    ));
    return { handle: () => handle as VirtualListHandle, outer: screen.getByTestId('outer') };
}

const firstRow = () => screen.getAllByTestId('row')[0].textContent;

describe('VirtualList', () => {
    it('真实滚动后渲染新的行', async () => {
        const { outer } = renderList();
        outer.scrollTop = 36 * 50;
        await expect.poll(firstRow).toBe('row 48');
        expect(screen.queryByText('row 0')).toBeNull();
    });

    it('scrollToItem 的 center、auto、smart 对齐', () => {
        const { handle, outer } = renderList();

        handle().scrollToItem(50, 'center');
        // 50 * 36 + (36 - 300) / 2
        expect(outer.scrollTop).toBe(1668);

        outer.scrollTop = 0;
        handle().scrollToItem(3);
        expect(outer.scrollTop).toBe(0);
        handle().scrollToItem(20);
        expect(outer.scrollTop).toBe(21 * 36 - 300);

        outer.scrollTop = 0;
        handle().scrollToItem(10, 'smart');
        expect(outer.scrollTop).toBe(11 * 36 - 300);
        outer.scrollTop = 0;
        handle().scrollToItem(50, 'smart');
        expect(outer.scrollTop).toBe(1668);
    });

    it('height 变化后 smart 按新的可视区高度判断', () => {
        const [height, setHeight] = createSignal(300);
        const { handle, outer } = renderList({
            get height() {
                return height();
            },
        });
        setHeight(150);
        // over one 150px viewport away, so centered: 10 * 36 + (36 - 150) / 2
        handle().scrollToItem(10, 'smart');
        expect(outer.scrollTop).toBe(303);
    });

    it('scrollTo 滚动到指定偏移并渲染那里的行', async () => {
        const { handle, outer } = renderList();
        handle().scrollTo(720);
        expect(outer.scrollTop).toBe(720);
        expect(await screen.findByText('row 20')).toBeInTheDocument();
    });

    it('句柄引起的滚动报告 scrollUpdateWasRequested，用户滚动和未移动的调用不报告', async () => {
        const onScroll = vi.fn<NonNullable<VirtualListProps<string[]>['onScroll']>>();
        const { handle, outer } = renderList({ onScroll });
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
