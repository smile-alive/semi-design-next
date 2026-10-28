import { type JSX, createMemo, createSignal, onMount, splitProps } from 'solid-js';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import VirtualList, { type VirtualListHandle, type VirtualListProps, type VirtualListRowProps } from '../virtual-list';

function Row(props: VirtualListRowProps<string[]>) {
    return (
        <div style={props.style} data-testid="row">
            {props.data[props.index]}
        </div>
    );
}

const items = (count: number) => Array.from({ length: count }, (_, i) => `row ${i}`);

function List(props: Partial<VirtualListProps<string[]>>) {
    const [local, rest] = splitProps(props, ['itemData']);
    const data = () => local.itemData ?? items(100);
    return (
        <VirtualList height={300} itemCount={data().length} itemSize={36} {...rest} data-testid="outer" itemData={data()}>
            {Row}
        </VirtualList>
    );
}

const rowTexts = () => screen.queryAllByTestId('row').map((row) => row.textContent);

describe('VirtualList', () => {
    it('只渲染可视区加上 overscan 的行', () => {
        render(() => <List />);
        expect(rowTexts()).toEqual(items(11));
    });

    it('滚动容器、总高度占位与绝对定位行的结构，并把属性透传到滚动容器', () => {
        render(() => <List class="list" aria-label="names" role="tree" tabIndex={-1} />);
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
        render(() => <List onScroll={onScroll} />);
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

    it('ref 只在创建时收到一次句柄，height 与数据变化也不例外，卸载时收到 undefined', () => {
        const ref = vi.fn<(handle?: VirtualListHandle) => void>();
        const [data, setData] = createSignal(items(100));
        const [height, setHeight] = createSignal(300);
        const { unmount } = render(() => <List ref={ref} height={height()} itemData={data()} />);
        setData(items(50));
        setHeight(150);
        expect(ref).toHaveBeenCalledTimes(1);
        expect(ref.mock.calls[0][0]).toEqual({
            scrollTo: expect.any(Function),
            scrollToItem: expect.any(Function),
            measure: expect.any(Function),
        });
        unmount();
        expect(ref).toHaveBeenLastCalledWith(undefined);
    });

    it('height 从 0 变为正数后渲染出行', () => {
        const [height, setHeight] = createSignal(0);
        render(() => <List height={height()} />);
        expect(rowTexts()).toEqual([]);
        setHeight(300);
        expect(rowTexts()).toEqual(items(11));
    });

    it('固定行高变化后更新各行位置', () => {
        const [size, setSize] = createSignal(36);
        render(() => <List itemSize={size()} />);
        setSize(40);
        expect(screen.getAllByTestId('row')[3]).toHaveStyle({ top: '120px', height: '40px' });
    });

    it('父组件挂载时就改了固定行高与 height，行位置与行数跟随新值', () => {
        const [size, setSize] = createSignal(36);
        const [height, setHeight] = createSignal(300);
        render(() => {
            onMount(() => {
                setSize(40);
                setHeight(120);
            });
            return <List itemSize={size()} height={height()} />;
        });
        expect(screen.getAllByTestId('row')[3]).toHaveStyle({ top: '120px', height: '40px' });
        expect(rowTexts()).toEqual(items(5));
    });

    it('行高函数的返回值变化时，调用 measure 后更新各行位置', () => {
        let handle: VirtualListHandle | undefined;
        let size = 36;
        render(() => <List ref={(h) => (handle = h)} itemSize={() => size} />);
        expect(screen.getAllByTestId('row')[3]).toHaveStyle({ top: '108px' });
        size = 40;
        handle?.measure();
        expect(screen.getAllByTestId('row')[3]).toHaveStyle({ top: '120px', height: '40px' });
    });

    it('滚动时留在视口内的行不重新创建', () => {
        const renders = new Map<number, number>();
        const data = items(100);
        render(() => (
            <VirtualList data-testid="outer" height={300} itemCount={data.length} itemData={data} itemSize={36}>
                {(row) => {
                    renders.set(row.index, (renders.get(row.index) ?? 0) + 1);
                    return <Row {...row} />;
                }}
            </VirtualList>
        ));
        expect(renders.get(5)).toBe(1);
        const row5 = screen.getByText('row 5');
        const outer = screen.getByTestId('outer');
        outer.scrollTop = 72;
        fireEvent.scroll(outer);
        expect(rowTexts()).toContain('row 12');
        expect(renders.get(5)).toBe(1);
        expect(screen.getByText('row 5')).toBe(row5);
    });

    it('按 itemKey 复用行的 DOM 节点', () => {
        const itemKey = (index: number, data: string[]) => data[index];
        const [data, setData] = createSignal(items(100));
        render(() => <List itemData={data()} itemKey={itemKey} />);
        const second = screen.getByText('row 1');
        setData((list) => list.slice(1));
        expect(rowTexts()[0]).toBe('row 1');
        expect(screen.getByText('row 1')).toBe(second);
        expect(second).toHaveStyle({ top: '0px' });
    });

    it('数据与行数一起缩短时，itemKey 只收到新数据范围内的 index', () => {
        const itemKey = vi.fn<(index: number, data: string[]) => string>((index, data) => data[index].toUpperCase());
        const [data, setData] = createSignal(items(100));
        render(() => (
            <VirtualList height={300} itemCount={data().length} itemData={data()} itemKey={itemKey} itemSize={36}>
                {(row) => {
                    const text = createMemo(() => row.data[row.index]);
                    return (
                        <div style={row.style} data-testid="row">
                            {text()}
                        </div>
                    );
                }}
            </VirtualList>
        ));
        setData(items(3));
        setData(items(100));
        setData(items(3));
        for (const [index, list] of itemKey.mock.calls) {
            expect(index).toBeLessThan(list.length);
        }
        expect(rowTexts()).toEqual(items(3));
    });

    it('outerElementType 与 innerElementType 渲染滚动容器与行容器，outerRef 收到滚动容器', () => {
        let outerNode: HTMLDivElement | undefined;
        const Outer = (props: JSX.HTMLAttributes<HTMLDivElement>) => (
            <section>
                <div {...props} data-testid="outer" />
            </section>
        );
        const Inner = (props: JSX.HTMLAttributes<HTMLUListElement>) => <ul {...props} role="none" />;
        const data = items(100);
        render(() => (
            <VirtualList height={300} itemCount={data.length} itemData={data} itemSize={36} outerElementType={Outer} innerElementType={Inner} outerRef={(node) => (outerNode = node)}>
                {(row) => <li style={row.style}>{row.data[row.index]}</li>}
            </VirtualList>
        ));
        const outer = screen.getByTestId('outer');
        expect(outerNode).toBe(outer);
        expect(outer.firstElementChild?.tagName).toBe('UL');
        expect(outer.firstElementChild).toHaveStyle({ height: '3600px' });
        outer.scrollTop = 360;
        fireEvent.scroll(outer);
        expect(outer.querySelector('li')).toHaveTextContent('row 8');
    });
});
