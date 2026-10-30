<script lang="ts">
    import { omit } from 'es-toolkit';
    import { cssClasses, getStackThreshold } from '@fibrae/semi-foundation/notification/constants';
    import type { NoticeInstance, NoticePosition } from '@fibrae/semi-foundation/notification/notification-foundation';
    import type NotificationListStore from '@fibrae/semi-foundation/notification/notification-list-foundation';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import useDefaultProps from '../_base/use-default-props.js';
    import watch from '../_base/watch.svelte.js';
    import { type ListedNotice, setNoticeListContext } from './context.js';
    import Notice from './notice.svelte';

    interface NoticeListProps {
        placement: NoticePosition;
        /** The position's notices, newest first, leaving ones included */
        items: ListedNotice[];
        removedItems: readonly NoticeInstance[];
        updatedItems: readonly NoticeInstance[];
        store: NotificationListStore;
        announce: (key: string, read: () => string) => void;
    }

    // One list per position: pointer and focus state goes when the position empties, so an unmounted list cannot leave
    // notices paused. A leaving notice stays in `items` until its leave ends, so the list outlives it.
    let { announce, items, placement, removedItems, store, updatedItems }: NoticeListProps = $props();
    const defaults = useDefaultProps('Notification');

    let listEl = $state<HTMLDivElement>();
    let pointerInside = $state(false);
    let focusInside = $state(false);

    const paused = $derived(pointerInside || focusInside);
    const removedIds = $derived(new Set(removedItems.map((item) => item.id)));
    const shownCount = $derived(items.filter((item) => !removedIds.has(item.id)).length);
    const threshold = $derived(getStackThreshold(items[0].stack ?? defaults('stack')));
    const expanded = $derived(paused || shownCount <= threshold);

    // The newest notice decides the list's offsets
    const listStyle = $derived.by(() => {
        const newest = items[0];
        return {
            top: toCssLength(newest.top ?? defaults('top')),
            bottom: toCssLength(newest.bottom ?? defaults('bottom')),
            left: toCssLength(newest.left ?? defaults('left')),
            right: toCssLength(newest.right ?? defaults('right')),
        };
    });

    // A leaving notice keeps its place until its leave ends. Only shown notices count towards a depth, so the ones
    // behind a leaving notice do not sink and spring back when it goes.
    const rows = $derived.by(() => {
        let shownBefore = 0;
        return items.map((item, index) => {
            const leaving = removedIds.has(item.id);
            const depth = shownBefore;
            if (!leaving) shownBefore++;
            // List-level and unused options would otherwise land on the notice element as attributes like zindex="1010".
            const props = omit(item, ['top', 'bottom', 'left', 'right', 'zIndex', 'getPopupContainer', 'stack', 'position']);
            return { id: item.id, props, leaving, depth, layer: items.length - index };
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
        announce: (key, read) => announce(key, read),
    });

    const handleFocusOut = (event: FocusEvent) => {
        if (!(event.relatedTarget instanceof Node && listEl?.contains(event.relatedTarget))) focusInside = false;
    };

    // A focused notice that unmounts gives no reliable focusout, which would keep every countdown paused.
    watch(
        () => items,
        () => {
            if (focusInside && listEl && !listEl.contains(FocusTrapHandle.getActiveElement(listEl))) focusInside = false;
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
        <Notice {...row.props} close={(id) => store.remove(id)} depth={row.depth} layer={row.layer} leaving={row.leaving} onLeaveEnd={() => store.finishLeave(row.id)} {placement} stack={threshold > 0} stackExpanded={expanded} />
    {/each}
</div>
