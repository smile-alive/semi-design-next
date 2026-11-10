<script lang="ts">
    import { omit } from 'es-toolkit';
    import { getStackDepths, hasLostFocus, isStackExpanded } from '@fibrae/semi-foundation/base/list-store';
    import { cssClasses } from '@fibrae/semi-foundation/components/notification/constants';
    import type { NoticeInstance, NoticePosition } from '@fibrae/semi-foundation/components/notification/notification-foundation';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import watch from '../../hooks/watch.svelte.js';
    import { type ListedNotice, type RegisterNotice, setNoticeListContext } from './context.js';
    import type { NotificationListProps } from './interface.js';
    import Notice from './notice.svelte';

    interface NoticeListProps extends NotificationListProps {
        placement: NoticePosition;
        items: ListedNotice[];
        removedItems: readonly NoticeInstance[];
        updatedItems: readonly NoticeInstance[];
        /** The store's stack threshold */
        stack: number;
        register: RegisterNotice;
    }

    // One list per position: pointer and focus state goes when the position empties, so an unmounted list cannot leave
    // notices paused. A leaving notice stays in `items` until its leave ends, so the list outlives it.
    let { items, placement, register, removedItems, stack, store, updatedItems }: NoticeListProps = $props();

    let listEl = $state<HTMLDivElement>();
    let pointerInside = $state(false);
    let focusInside = $state(false);

    const paused = $derived(pointerInside || focusInside);
    const removedIds = $derived(new Set(removedItems.map((item) => item.id)));
    const shownIds = $derived(new Set(items.flatMap((item) => (removedIds.has(item.id) ? [] : [item.id]))));
    const expanded = $derived(isStackExpanded(stack, paused, shownIds.size));

    const listStyle = $derived.by(() => {
        const newest = items[0];
        return {
            top: toCssLength(newest.top),
            bottom: toCssLength(newest.bottom),
            left: toCssLength(newest.left),
            right: toCssLength(newest.right),
        };
    });

    // A leaving notice keeps its place until its leave ends.
    const rows = $derived.by(() => {
        const depths = getStackDepths(
            items.map((item) => item.id),
            shownIds
        );
        return items.map((item, index) => {
            // List-level and unused options would otherwise land on the notice element as attributes like zindex="1010".
            const props = omit(item, ['top', 'bottom', 'left', 'right', 'zIndex', 'getPopupContainer', 'stack', 'position']);
            return { id: item.id, props, leaving: removedIds.has(item.id), depth: depths.get(item.id) ?? 0, layer: items.length - index };
        });
    });

    setNoticeListContext({
        get paused() {
            return paused;
        },
        get updatedItems() {
            return updatedItems;
        },
        get removedItems() {
            return removedItems;
        },
        register: (id, element) => register(id, element),
    });

    const handleFocusOut = (event: FocusEvent) => {
        if (!(event.relatedTarget instanceof Node && listEl?.contains(event.relatedTarget))) focusInside = false;
    };

    // A focused notice that unmounts gives no reliable focusout, which would keep every countdown paused.
    watch(
        () => items,
        () => {
            if (hasLostFocus(focusInside, listEl)) focusInside = false;
        }
    );
</script>

<div
    bind:this={listEl}
    class={cssClasses.LIST}
    style:bottom={listStyle.bottom}
    style:left={listStyle.left}
    style:right={listStyle.right}
    style:top={listStyle.top}
    {...{ 'x-placement': placement }}
    onfocusin={() => (focusInside = true)}
    onfocusout={handleFocusOut}
    onmouseenter={() => (pointerInside = true)}
    onmouseleave={() => (pointerInside = false)}
>
    {#each rows as row (row.id)}
        <Notice {...row.props} close={(id) => store.remove(id)} depth={row.depth} layer={row.layer} leaving={row.leaving} onLeaveEnd={() => store.finishLeave(row.id)} {placement} stack={stack > 0} stackExpanded={expanded} />
    {/each}
</div>
