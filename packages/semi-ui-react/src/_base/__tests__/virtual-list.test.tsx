import { createRef, memo } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import VirtualList, { type VirtualListHandle, type VirtualListProps, type VirtualListRowProps } from '../virtual-list';

function Row({ index, style, data }: VirtualListRowProps<string[]>) {
    return (
        <div style={style} data-testid="row">
            {data[index]}
        </div>
    );
}

const items = (count: number) => Array.from({ length: count }, (_, i) => `row ${i}`);

function List(props: Partial<VirtualListProps<string[]>>) {
    const data = props.itemData ?? items(100);
    return (
        <VirtualList height={300} itemCount={data.length} itemSize={36} {...props} data-testid="outer" itemData={data}>
            {Row}
        </VirtualList>
    );
}

const rowTexts = () => screen.queryAllByTestId('row').map((row) => row.textContent);

describe('VirtualList', () => {
    it('只渲染可视区加上 overscan 的行', () => {
        render(<List />);
        expect(rowTexts()).toEqual(items(11));
    });

    it('滚动容器、总高度占位与绝对定位行的结构，并把属性透传到滚动容器', () => {
        render(<List className="list" aria-label="names" role="tree" tabIndex={-1} />);
        const outer = screen.getByTestId('outer');
        expect(outer).toHaveStyle({ height: '300px', overflow: 'auto' });
        expect(outer).toHaveAttribute('tabindex', '-1');
        expect(outer).toHaveClass('list');
        expect(outer).toHaveAttribute('role', 'tree');
        expect(outer).toHaveAttribute('aria-label', 'names');
        expect(outer.children).toHaveLength(1);
        expect(outer.firstElementChild).toHaveStyle({ height: '3600px' });
        const rows = screen.getAllByTestId('row');
        expect(rows[3]).toHaveStyle({ position: 'absolute', top: '108px', height: '36px' });
    });

    it('用户滚动后更新渲染的行，并报告方向与偏移', () => {
        const onScroll = vi.fn<NonNullable<VirtualListProps<string[]>['onScroll']>>();
        render(<List onScroll={onScroll} />);
        const outer = screen.getByTestId('outer');

        outer.scrollTop = 360;
        fireEvent.scroll(outer);
        expect(rowTexts()[0]).toBe('row 8');
        expect(onScroll).toHaveBeenLastCalledWith({
            scrollDirection: 'forward',
            scrollOffset: 360,
            scrollUpdateWasRequested: false,
        });

        outer.scrollTop = 0;
        fireEvent.scroll(outer);
        expect(rowTexts()[0]).toBe('row 0');
        expect(onScroll).toHaveBeenLastCalledWith({
            scrollDirection: 'backward',
            scrollOffset: 0,
            scrollUpdateWasRequested: false,
        });
    });

    it('句柄在重新渲染间保持不变，height 变化也不例外', () => {
        const ref = vi.fn<(handle: VirtualListHandle | null) => void>();
        const { rerender } = render(<List ref={ref} />);
        rerender(<List ref={ref} itemData={items(50)} />);
        rerender(<List ref={ref} height={150} itemData={items(50)} />);
        expect(ref).toHaveBeenCalledTimes(1);
        const handle = ref.mock.calls[0][0];
        expect(handle).toEqual({
            scrollTo: expect.any(Function),
            scrollToItem: expect.any(Function),
            measure: expect.any(Function),
        });
    });

    it('height 从 0 变为正数后渲染出行', () => {
        const { rerender } = render(<List height={0} />);
        expect(rowTexts()).toEqual([]);
        rerender(<List height={300} />);
        expect(rowTexts()).toEqual(items(11));
    });

    it('固定行高变化后更新各行位置', () => {
        const { rerender } = render(<List />);
        rerender(<List itemSize={40} />);
        expect(screen.getAllByTestId('row')[3]).toHaveStyle({ top: '120px', height: '40px' });
    });

    it('行高函数的返回值变化时，调用 measure 后更新各行位置', () => {
        const ref = createRef<VirtualListHandle>();
        let size = 36;
        render(<List ref={ref} itemSize={() => size} />);
        expect(screen.getAllByTestId('row')[3]).toHaveStyle({ top: '108px' });
        size = 40;
        act(() => ref.current?.measure());
        expect(screen.getAllByTestId('row')[3]).toHaveStyle({ top: '120px', height: '40px' });
    });

    it('滚动时留在视口内的行收到同一个 style，memo 行不重新渲染', () => {
        const renders = new Map<number, number>();
        const MemoRow = memo(function MemoRow({ index, style, data }: VirtualListRowProps<string[]>) {
            renders.set(index, (renders.get(index) ?? 0) + 1);
            return (
                <div style={style} data-testid="row">
                    {data[index]}
                </div>
            );
        });
        const data = items(100);
        render(
            <VirtualList data-testid="outer" height={300} itemCount={data.length} itemData={data} itemSize={36}>
                {MemoRow}
            </VirtualList>
        );
        expect(renders.get(5)).toBe(1);
        const outer = screen.getByTestId('outer');
        outer.scrollTop = 72;
        fireEvent.scroll(outer);
        expect(rowTexts()).toContain('row 12');
        expect(renders.get(5)).toBe(1);
    });

    it('按 itemKey 复用行的 DOM 节点', () => {
        const itemKey = (index: number, data: string[]) => data[index];
        const data = items(100);
        const { rerender } = render(<List itemData={data} itemKey={itemKey} />);
        const second = screen.getByText('row 1');
        rerender(<List itemData={data.slice(1)} itemKey={itemKey} />);
        expect(rowTexts()[0]).toBe('row 1');
        expect(screen.getByText('row 1')).toBe(second);
    });
});
