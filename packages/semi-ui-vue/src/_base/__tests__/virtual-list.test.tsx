/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowRef, type CSSProperties } from 'vue';
import { fireEvent, screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import VirtualList, { type VirtualListHandle, type VirtualListScrollArgs } from '../virtual-list.vue';

const items = (count: number) => Array.from({ length: count }, (_, i) => `row ${i}`);

function renderList(initial: Record<string, unknown> = {}) {
    const data = shallowRef(items(100));
    const extra = shallowRef<Record<string, unknown>>(initial);
    let handle: VirtualListHandle | null = null;
    const Host = defineComponent(() => () => (
        <VirtualList
            ref={(el: unknown) => {
                handle = el as VirtualListHandle | null;
            }}
            data-testid="outer"
            height={300}
            itemCount={data.value.length}
            itemSize={36}
            {...extra.value}
        >
            {{
                default: ({ index, style }: { index: number; style: CSSProperties }) => (
                    <div data-testid="row" style={style}>
                        {data.value[index]}
                    </div>
                ),
            }}
        </VirtualList>
    ));
    render(Host);
    const update = async (next: Record<string, unknown>) => {
        extra.value = { ...extra.value, ...next };
        await nextTick();
    };
    return { data, update, handle: () => handle, outer: () => screen.getByTestId('outer') };
}

const rowTexts = () => screen.queryAllByTestId('row').map((row) => row.textContent);

describe('VirtualList', () => {
    it('只渲染可视区加上 overscan 的行', () => {
        renderList();
        expect(rowTexts()).toEqual(items(11));
    });

    it('滚动容器、总高度占位与绝对定位行的结构，并把属性透传到滚动容器', () => {
        const { outer } = renderList({ class: 'list', 'aria-label': 'names', role: 'tree', tabindex: -1, width: 78 });
        expect(outer()).toHaveStyle({ height: '300px', width: '78px', overflow: 'auto' });
        expect(outer()).toHaveAttribute('tabindex', '-1');
        expect(outer()).toHaveClass('list');
        expect(outer()).toHaveAttribute('role', 'tree');
        expect(outer()).toHaveAttribute('aria-label', 'names');
        expect(outer().children).toHaveLength(1);
        expect(outer().firstElementChild).toHaveStyle({ height: '3600px' });
        expect(screen.getAllByTestId('row')[3]).toHaveStyle({ position: 'absolute', top: '108px', height: '36px' });
    });

    it('innerTag 与 innerAttrs 决定行容器，样式与总高度合并', () => {
        const { outer } = renderList({
            innerTag: 'ul',
            innerAttrs: { class: 'rows', role: 'none', style: { margin: 0 } },
        });
        const inner = outer().firstElementChild;
        expect(inner?.tagName).toBe('UL');
        expect(inner).toHaveClass('rows');
        expect(inner).toHaveAttribute('role', 'none');
        expect(inner).toHaveStyle({ height: '3600px', margin: '0px' });
    });

    it('使用方的 style 与内置样式合并，后者可被覆盖', () => {
        const { outer } = renderList({ style: { direction: 'rtl', overflow: 'hidden' } });
        expect(outer()).toHaveStyle({ direction: 'rtl', overflow: 'hidden', height: '300px' });
    });

    it('用户滚动后更新渲染的行，并报告方向与偏移', async () => {
        const onScroll = vi.fn<(args: VirtualListScrollArgs) => void>();
        const { outer } = renderList({ onScroll });
        // the virtualizer starts listening once the scroll container is mounted, in the flush after the first render
        await nextTick();

        outer().scrollTop = 360;
        await fireEvent.scroll(outer());
        expect(rowTexts()[0]).toBe('row 8');
        expect(onScroll).toHaveBeenLastCalledWith({
            scrollDirection: 'forward',
            scrollOffset: 360,
            scrollUpdateWasRequested: false,
        });

        outer().scrollTop = 0;
        await fireEvent.scroll(outer());
        expect(rowTexts()[0]).toBe('row 0');
        expect(onScroll).toHaveBeenLastCalledWith({
            scrollDirection: 'backward',
            scrollOffset: 0,
            scrollUpdateWasRequested: false,
        });
    });

    it('暴露 scrollTo、scrollToItem 与 measure', () => {
        const { handle } = renderList();
        expect(handle()).toMatchObject({
            scrollTo: expect.any(Function),
            scrollToItem: expect.any(Function),
            measure: expect.any(Function),
        });
    });

    it('height 从 0 变为正数后渲染出行', async () => {
        const { update } = renderList({ height: 0 });
        expect(rowTexts()).toEqual([]);
        await update({ height: 300 });
        expect(rowTexts()).toEqual(items(11));
    });

    it('固定行高变化后更新各行位置', async () => {
        const { update } = renderList();
        await update({ itemSize: 40 });
        expect(screen.getAllByTestId('row')[3]).toHaveStyle({ top: '120px', height: '40px' });
    });

    it('行高函数的返回值变化时，调用 measure 后更新各行位置', async () => {
        let size = 36;
        const { handle } = renderList({ itemSize: () => size });
        expect(screen.getAllByTestId('row')[3]).toHaveStyle({ top: '108px' });
        size = 40;
        handle()?.measure();
        await nextTick();
        expect(screen.getAllByTestId('row')[3]).toHaveStyle({ top: '120px', height: '40px' });
    });

    it('wrapperAttrs 在滚动容器与行容器之间渲染包装元素，#after 渲染在包装元素之后', () => {
        render(
            defineComponent(() => () => (
                <VirtualList data-testid="outer" height={300} itemCount={3} itemSize={36} wrapperAttrs={{ class: 'wrap', role: 'none', style: { width: '500px' } }} innerAttrs={{ class: 'rows' }}>
                    {{
                        default: ({ index, style }: { index: number; style: CSSProperties }) => <div data-testid="row" style={style}>{`row ${index}`}</div>,
                        after: () => <p class="empty">nothing</p>,
                    }}
                </VirtualList>
            ))
        );
        const outer = screen.getByTestId('outer');
        expect(Array.from(outer.children, (child) => child.className)).toEqual(['wrap', 'empty']);
        const wrapper = outer.firstElementChild;
        expect(wrapper).toHaveAttribute('role', 'none');
        expect(wrapper).toHaveStyle({ width: '500px' });
        expect(wrapper?.children).toHaveLength(1);
        expect(wrapper?.firstElementChild).toHaveClass('rows');
        expect(wrapper?.firstElementChild).toHaveStyle({ height: '108px' });
        expect(rowTexts()).toEqual(['row 0', 'row 1', 'row 2']);
    });

    it('按 itemKey 复用行的 DOM 节点', async () => {
        const { data, update } = renderList();
        await update({ itemKey: (index: number) => data.value[index] });
        const second = screen.getByText('row 1');
        data.value = data.value.slice(1);
        await nextTick();
        expect(rowTexts()[0]).toBe('row 1');
        expect(screen.getByText('row 1')).toBe(second);
    });
});
