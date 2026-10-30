<script lang="ts">
    import { omit } from 'es-toolkit';
    import { cssClasses, numbers } from '@fibrae/semi-foundation/toast/constants';
    import type { ToastInstance } from '@fibrae/semi-foundation/toast/toast-foundation';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import '@fibrae/semi-foundation/toast/toast.scss';
    import useAnnouncer from '../_base/use-announcer.svelte.js';
    import useStoreSnapshot from '../_base/use-store-snapshot.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { setToastListContext } from './context.js';
    import type { ToastItemProps, ToastListProps } from './interface.js';
    import Toast from './toast.svelte';

    // A list renders one store for its whole life
    let { store }: ToastListProps = $props();

    let innerWrapper = $state<HTMLDivElement>();
    let pointerInside = $state(false);
    let focusInside = $state(false);
    let stackExpanded = $state(false);

    const snapshot = useStoreSnapshot(store);
    const { text: announcement, announcer } = useAnnouncer();

    const prefix = cssClasses.PREFIX;
    const paused = $derived(pointerInside || focusInside);
    const view = $derived(snapshot());
    const expanded = $derived(view.stack === 0 || stackExpanded || view.list.length <= view.stack);

    // The shown toasts and the leaving ones in display order; a leaving toast keeps its place until its leave ends.
    // Leaving toasts are not counted as newer, or the ones behind them would sink and spring back on removal.
    const rows = $derived.by(() => {
        const items = new Map([...view.list, ...view.removedItems].map((item) => [item.id, item]));
        const shown = new Set(view.list.map((item) => item.id));
        const ids = view.order.filter((id) => items.has(id));
        return ids.map((id, index) => ({
            id,
            // The store holds the options as given to the static API (ToastProps), not the foundation's ToastInstance
            // shape. List-level options would otherwise land on the toast element as attributes like zindex="1010".
            props: omit(items.get(id) as ToastInstance, ['top', 'bottom', 'left', 'right', 'zIndex', 'getPopupContainer', 'stack']) as ToastItemProps,
            leaving: !shown.has(id),
            newerShown: ids.slice(index + 1).filter((newer) => shown.has(newer)).length,
        }));
    });

    setToastListContext({
        get paused() {
            return paused;
        },
        get updatedItems() {
            return view.updatedItems;
        },
        get removedItems() {
            return view.removedItems;
        },
        announce: (key, read) => announcer.announce(key, read),
    });

    const enter = (source: 'pointer' | 'focus') => {
        if (source === 'pointer') pointerInside = true;
        else focusInside = true;
        if (view.stack) stackExpanded = true;
    };

    const leave = (source: 'pointer' | 'focus') => {
        if (source === 'pointer') pointerInside = false;
        else focusInside = false;
        if (!paused && view.stack && innerWrapper?.getBoundingClientRect().height) {
            stackExpanded = false;
        }
    };

    const handleFocusOut = (event: FocusEvent) => {
        if (!(event.relatedTarget instanceof Node && innerWrapper?.contains(event.relatedTarget))) leave('focus');
    };

    // The order changes when a leave ends. A removed focused toast fires no reliable focusout, which would keep every
    // countdown paused.
    watch(
        () => view.order,
        () => {
            // An emptied list has no height, so leave() never collapses it; without this the next batch would start expanded.
            if (!view.list.length && !view.removedItems.length) stackExpanded = false;
            if (focusInside && innerWrapper && !innerWrapper.contains(FocusTrapHandle.getActiveElement(innerWrapper))) leave('focus');
        }
    );
</script>

<!-- Stays mounted so it is registered as a live region before any message is written into it -->
<div aria-atomic="true" aria-live="polite" class={`${prefix}-announcer`}>{announcement()}</div>
<div bind:this={innerWrapper} class={[`${prefix}-innerWrapper`, { [`${prefix}-innerWrapper-hover`]: expanded }]} onfocusin={() => enter('focus')} onfocusout={handleFocusOut} onmouseenter={() => enter('pointer')} onmouseleave={() => leave('pointer')}>
    {#each rows as row (row.id)}
        <Toast
            {...row.props}
            class={[row.props.class, { [`${prefix}-stack-hidden`]: !expanded && !row.leaving && row.newerShown >= numbers.stackVisibleCount }]}
            close={(id) => store.remove(id)}
            leaving={row.leaving}
            onLeaveEnd={() => store.finishLeave(row.id)}
            positionInList={{ length: view.list.length, index: view.list.length - 1 - row.newerShown }}
            stack={view.stack > 0}
            stackExpanded={expanded && !row.leaving}
        />
    {/each}
</div>
