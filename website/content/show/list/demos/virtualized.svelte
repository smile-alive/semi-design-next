<script lang="ts">
    import { untrack } from 'svelte';
    import { SvelteSet } from 'svelte/reactivity';
    import { createVirtualizer } from '@tanstack/svelte-virtual';
    import { Avatar, List, ListItem, Spin } from '@fibrae/semi-ui-svelte';

    interface Book {
        title: string;
    }

    const rowCount = 50;
    const rowHeight = 118;
    // Rows fetched ahead of the window so they arrive before they scroll into view
    const prefetch = 15;
    const dataList: Book[] = Array.from({ length: rowCount }, (_, i) => ({ title: `Semi Design Title ${i}` }));

    let scroller = $state<HTMLElement>();
    const loaded = new SvelteSet<number>();
    // A requested index is never fetched again, even while pending
    const requested = new SvelteSet<number>();
    const virtualizer = createVirtualizer<HTMLElement, Element>({ count: rowCount, getScrollElement: () => scroller ?? null, estimateSize: () => rowHeight, overscan: 2 });

    // The scroller exists only after mount, so the virtualizer is handed it then. setOptions updates the store this
    // effect would otherwise be subscribed to, so it runs untracked.
    $effect(() => {
        if (scroller) untrack(() => $virtualizer.setOptions({ getScrollElement: () => scroller ?? null }));
    });

    const items = $derived($virtualizer.getVirtualItems());
    // Indexes rather than virtual items: the items are new objects on every scroll
    const rows = $derived(items.filter((item) => loaded.has(item.index)).map((item) => item.index));

    $effect(() => {
        if (!items.length) return;
        const first = items[0].index;
        const last = Math.min(items[items.length - 1].index + prefetch, rowCount - 1);
        // requested is written here, so reading it must not make this effect depend on it
        const wanted = untrack(() => {
            const fresh: number[] = [];
            for (let i = first; i <= last; i++) {
                if (!requested.has(i)) {
                    requested.add(i);
                    fresh.push(i);
                }
            }
            return fresh;
        });
        if (!wanted.length) return;
        setTimeout(() => {
            for (const i of wanted) loaded.add(i);
        }, 1000);
    });
</script>

<div style="border: 1px solid var(--semi-color-border); padding: 10px">
    <section aria-label="虚拟滚动列表" bind:this={scroller} style="height: 500px; overflow: auto" tabindex="0">
        <List dataSource={rows} style="position: relative; height: {$virtualizer.getTotalSize()}px">
            <!-- Replaces the locale's empty text until a row of the window arrives -->
            {#snippet emptyContent()}
                <Spin />
            {/snippet}
            {#snippet item({ item: index })}
                <ListItem style="position: absolute; inset-inline: 0; top: {index * rowHeight}px; height: {rowHeight}px">
                    {#snippet header()}
                        <Avatar color="grey">SE</Avatar>
                    {/snippet}
                    {#snippet main()}
                        <div>
                            <span style="color: var(--semi-color-text-0); font-weight: 500">{dataList[index].title}</span>
                            <p style="color: var(--semi-color-text-2); margin: 4px 0">Semi Design 设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</p>
                        </div>
                    {/snippet}
                </ListItem>
            {/snippet}
        </List>
    </section>
</div>
