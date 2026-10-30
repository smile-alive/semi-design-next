<script lang="ts">
    import { onDestroy, type ComponentProps } from 'svelte';
    import { DragDropManager } from '@dnd-kit/dom';
    import { DragDropProvider, DragOverlay } from '@dnd-kit/svelte';
    import { isSortable } from '@dnd-kit/svelte/sortable';
    import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
    import { SortableAnnouncer } from '@fibrae/semi-foundation/sortable/accessibility';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { SortableProps } from './interface.js';
    import SortableItem from './sortable-item.svelte';

    type ProviderProps = ComponentProps<typeof DragDropProvider>;

    let { items, dragHandleLabel, prefix = `${BASE_CLASS_PREFIX}-sortable`, transition, dragOverlayClass, onSortEnd, onDragging, item, ...rest }: SortableProps = $props();

    const locale = useLocale('Sortable');

    // the announcements run at drag time and read the latest locale and item count through `update`
    const announcer = new SortableAnnouncer(locale().locale, 0);

    // @dnd-kit/svelte drops OptimisticSortingPlugin because it moves DOM nodes under Svelte's keyed each, so the order the
    // user sees during a drag is this list; it is cleared when the drag ends, leaving the parent's `items` the only truth
    let preview = $state.raw<(string | number)[] | null>(null);
    let list = $state<HTMLElement>();

    const ordered = $derived(preview ?? items);

    const plugins: ProviderProps['plugins'] = (defaults) => [...defaults, announcer.plugin];

    // DragDropProvider applies its `plugins` in an effect, after the items below have registered their handles under
    // dnd-kit's English announcer; a manager built with the plugin makes the handles register under ours.
    const manager = new DragDropManager({ plugins });

    const onDragOver: ProviderProps['onDragOver'] = ({ operation: { source, target } }) => {
        if (!isSortable(source) || !isSortable(target) || source.id === target.id) {
            return;
        }
        const next = [...ordered];
        const from = next.indexOf(source.id);
        const to = next.indexOf(target.id);
        if (from < 0 || to < 0) {
            return;
        }
        next.splice(to, 0, ...next.splice(from, 1));
        preview = next;
    };

    const onDragEnd: ProviderProps['onDragEnd'] = ({ canceled, operation: { source } }) => {
        const finalOrder = ordered;
        preview = null;
        onDragging?.(false);
        if (canceled || !isSortable(source)) {
            return;
        }
        const oldIndex = items.indexOf(source.id);
        const newIndex = finalOrder.indexOf(source.id);
        if (oldIndex !== newIndex) {
            onSortEnd?.({ oldIndex, newIndex });
        }
    };

    // DragOverlay renders its own element and takes no class, so the class goes on the sibling right after the list
    $effect(() => {
        const classes = dragOverlayClass?.split(/\s+/).filter(Boolean);
        const overlay = list?.nextElementSibling;
        if (!classes?.length || !overlay?.hasAttribute('data-dnd-overlay')) {
            return;
        }
        overlay.classList.add(...classes);
        return () => overlay.classList.remove(...classes);
    });

    $effect.pre(() => announcer.update(locale().locale, items.length));

    onDestroy(() => manager.destroy());
</script>

<!-- The list and the drag overlay stay siblings: the stylesheet finds the active item through `:has(~ [data-dnd-overlay])` -->
<DragDropProvider {manager} {onDragEnd} {onDragOver} onDragStart={() => onDragging?.(true)} {plugins}>
    <div bind:this={list} {...rest}>
        {#each ordered as id, index (id)}
            <SortableItem {id} {index} label={dragHandleLabel} {prefix} roleDescription={locale().locale.roleDescription} {transition}>
                {@render item?.({ id, index })}
            </SortableItem>
        {/each}
    </div>
    <!-- dnd-kit shows the overlay in the top layer, above any open popup -->
    <DragOverlay>
        {#snippet children(source)}
            {@render item?.({ id: source.id, index: items.indexOf(source.id) })}
        {/snippet}
    </DragOverlay>
</DragDropProvider>
