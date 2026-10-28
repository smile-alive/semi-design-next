import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import VirtualList, { type VirtualListHandle, type VirtualListProps, type VirtualListRowProps } from '../virtual-list';

function Row({ index, style, data }: VirtualListRowProps<string[]>) {
    return (
        <div style={style} data-testid="row">
            {data[index]}
        </div>
    );
}

const data = Array.from({ length: 100 }, (_, i) => `row ${i}`);

function renderList(props: Partial<VirtualListProps<string[]>> = {}) {
    const ref = createRef<VirtualListHandle>();
    render(
        <VirtualList ref={ref} data-testid="outer" height={300} itemCount={100} itemData={data} itemSize={36} {...props}>
            {Row}
        </VirtualList>
    );
    return { ref, outer: screen.getByTestId('outer') };
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
        const { ref, outer } = renderList();

        ref.current?.scrollToItem(50, 'center');
        // 50 * 36 + (36 - 300) / 2
        expect(outer.scrollTop).toBe(1668);

        outer.scrollTop = 0;
        ref.current?.scrollToItem(3);
        expect(outer.scrollTop).toBe(0);
        ref.current?.scrollToItem(20);
        expect(outer.scrollTop).toBe(21 * 36 - 300);

        outer.scrollTop = 0;
        ref.current?.scrollToItem(10, 'smart');
        expect(outer.scrollTop).toBe(11 * 36 - 300);
        outer.scrollTop = 0;
        ref.current?.scrollToItem(50, 'smart');
        expect(outer.scrollTop).toBe(1668);
    });

    it('height 变化后 smart 按新的可视区高度判断', () => {
        const ref = createRef<VirtualListHandle>();
        const list = (height: number) => (
            <VirtualList ref={ref} data-testid="outer" height={height} itemCount={100} itemData={data} itemSize={36}>
                {Row}
            </VirtualList>
        );
        const { rerender } = render(list(300));
        rerender(list(150));
        // over one 150px viewport away, so centered: 10 * 36 + (36 - 150) / 2
        ref.current?.scrollToItem(10, 'smart');
        expect(screen.getByTestId('outer').scrollTop).toBe(303);
    });

    it('scrollTo 滚动到指定偏移并渲染那里的行', async () => {
        const { ref, outer } = renderList();
        ref.current?.scrollTo(720);
        expect(outer.scrollTop).toBe(720);
        expect(await screen.findByText('row 20')).toBeInTheDocument();
    });

    it('句柄引起的滚动报告 scrollUpdateWasRequested，用户滚动和未移动的调用不报告', async () => {
        const onScroll = vi.fn<NonNullable<VirtualListProps<string[]>['onScroll']>>();
        const { ref, outer } = renderList({ onScroll });
        const lastRequested = () => onScroll.mock.lastCall?.[0].scrollUpdateWasRequested;

        ref.current?.scrollTo(720);
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

        ref.current?.scrollToItem(12);
        expect(outer.scrollTop).toBe(360);
        outer.scrollTop = 0;
        await expect.poll(() => onScroll.mock.lastCall?.[0].scrollOffset).toBe(0);
        expect(lastRequested()).toBe(false);
    });
});
