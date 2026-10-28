import { createEffect, For } from 'solid-js';
import { createStore } from 'solid-js/store';
import { createVirtualizer } from '@tanstack/solid-virtual';
import { Avatar, List, Spin } from '@fibrae/semi-ui-solid';

interface Book {
    title: string;
}

const rowCount = 50;
const rowHeight = 118;
// Rows fetched ahead of the window so they arrive before they scroll into view
const prefetch = 15;
const dataList: Book[] = Array.from({ length: rowCount }, (_, i) => ({ title: `Semi Design Title ${i}` }));

export default function ListDemo() {
    let scroller: HTMLElement | undefined;
    const [loaded, setLoaded] = createStore<Record<number, boolean>>({});
    // A requested index is never fetched again, even while pending
    const requested = new Set<number>();
    const virtualizer = createVirtualizer({ count: rowCount, getScrollElement: () => scroller ?? null, estimateSize: () => rowHeight, overscan: 2 });

    createEffect(() => {
        const items = virtualizer.getVirtualItems();
        if (!items.length) return;
        const wanted: number[] = [];
        for (let i = items[0].index; i <= Math.min(items[items.length - 1].index + prefetch, rowCount - 1); i++) {
            if (!requested.has(i)) {
                requested.add(i);
                wanted.push(i);
            }
        }
        if (!wanted.length) return;
        setTimeout(() => {
            for (const i of wanted) setLoaded(i, true);
        }, 1000);
    });

    // Indexes rather than virtual items: For keys rows by value, and the items are new objects on every scroll
    const rows = () => virtualizer.getVirtualItems().flatMap((item) => (loaded[item.index] ? [item.index] : []));

    return (
        <div style={{ border: '1px solid var(--semi-color-border)', padding: '10px' }}>
            <section ref={(node) => (scroller = node)} aria-label="虚拟滚动列表" tabIndex={0} style={{ height: '500px', overflow: 'auto' }}>
                <List style={{ position: 'relative', height: `${virtualizer.getTotalSize()}px` }} emptyContent={<Spin />}>
                    <For each={rows()}>
                        {(index) => (
                            <List.Item
                                style={{ position: 'absolute', 'inset-inline': '0', top: `${index * rowHeight}px`, height: `${rowHeight}px` }}
                                header={<Avatar color="grey">SE</Avatar>}
                                main={
                                    <div>
                                        <span style={{ color: 'var(--semi-color-text-0)', 'font-weight': '500' }}>{dataList[index].title}</span>
                                        <p style={{ color: 'var(--semi-color-text-2)', margin: '4px 0' }}>Semi Design 设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</p>
                                    </div>
                                }
                            />
                        )}
                    </For>
                </List>
            </section>
        </div>
    );
}
