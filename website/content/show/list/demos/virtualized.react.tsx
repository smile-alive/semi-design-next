import { useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Avatar, List, Spin } from '@fibrae/semi-ui-react';

interface Book {
    title: string;
}

const rowCount = 50;
const rowHeight = 118;
// Rows fetched ahead of the window so they arrive before they scroll into view
const prefetch = 15;
const dataList: Book[] = Array.from({ length: rowCount }, (_, i) => ({ title: `Semi Design Title ${i}` }));

export default function ListDemo() {
    // useVirtualizer returns one mutable instance for the component's life; React Compiler's memoized reads of it would go stale
    'use no memo';

    const scrollRef = useRef<HTMLElement>(null);
    const [loaded, setLoaded] = useState<ReadonlySet<number>>(() => new Set());
    // A requested index is never fetched again, even while pending
    const requested = useRef(new Set<number>());
    const virtualizer = useVirtualizer({ count: rowCount, getScrollElement: () => scrollRef.current, estimateSize: () => rowHeight, overscan: 2 });
    const items = virtualizer.getVirtualItems();
    const start = items[0]?.index;
    const stop = items.at(-1)?.index;

    useEffect(() => {
        if (start === undefined || stop === undefined) return;
        const wanted: number[] = [];
        for (let i = start; i <= Math.min(stop + prefetch, rowCount - 1); i++) {
            if (!requested.current.has(i)) {
                requested.current.add(i);
                wanted.push(i);
            }
        }
        if (!wanted.length) return;
        setTimeout(() => setLoaded((prev) => new Set([...prev, ...wanted])), 1000);
    }, [start, stop]);

    return (
        <div style={{ border: '1px solid var(--semi-color-border)', padding: 10 }}>
            <section ref={scrollRef} aria-label="虚拟滚动列表" tabIndex={0} style={{ height: '500px', overflow: 'auto' }}>
                <List style={{ position: 'relative', height: virtualizer.getTotalSize() }} emptyContent={<Spin />}>
                    {items
                        .filter((item) => loaded.has(item.index))
                        .map((item) => (
                            <List.Item
                                key={item.index}
                                style={{ position: 'absolute', insetInline: 0, top: item.start, height: rowHeight }}
                                header={<Avatar color="grey">SE</Avatar>}
                                main={
                                    <div>
                                        <span style={{ color: 'var(--semi-color-text-0)', fontWeight: 500 }}>{dataList[item.index].title}</span>
                                        <p style={{ color: 'var(--semi-color-text-2)', margin: '4px 0' }}>Semi Design 设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</p>
                                    </div>
                                }
                            />
                        ))}
                </List>
            </section>
        </div>
    );
}
