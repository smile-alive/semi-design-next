<script lang="ts">
    import { untrack } from 'svelte';
    import { SvelteMap } from 'svelte/reactivity';
    import { omit } from 'es-toolkit';
    import { FreshItems, getStackDepths, hasLostFocus, isStackExpanded, isStackHidden, readNoticeText } from '@fibrae/semi-foundation/base/list-store';
    import { cssClasses } from '@fibrae/semi-foundation/components/toast/constants';
    import type { ToastInstance } from '@fibrae/semi-foundation/components/toast/toast-foundation';
    import '@fibrae/semi-foundation/components/toast/toast.scss';
    import useAnnouncer from '../../hooks/use-announcer.svelte.js';
    import useStoreSnapshot from '../../hooks/use-store-snapshot.svelte.js';
    import watch from '../../hooks/watch.svelte.js';
    import { setToastListContext } from './context.js';
    import type { ToastItemProps, ToastListProps } from './interface.js';
    import Toast from './toast.svelte';

    // A list renders one store for its whole life
    let { store }: ToastListProps = $props();

    let innerWrapper = $state<HTMLDivElement>();
    let pointerInside = $state(false);
    let focusInside = $state(false);
    let stackExpanded = $state(false);
    const elements = new SvelteMap<string, Element>();
    const fresh = new FreshItems();

    const snapshot = useStoreSnapshot(store);
    const { text: announcement, announcer } = useAnnouncer();

    const prefix = cssClasses.PREFIX;
    const paused = $derived(pointerInside || focusInside);
    const view = $derived(snapshot());
    const shownItems = $derived(view.items);
    const updatedItems = $derived(view.updatedItems);
    const expanded = $derived(isStackExpanded(view.stack, stackExpanded, shownItems.length));

    // The shown toasts and the leaving ones in display order; a leaving toast keeps its place until its leave ends.
    const rows = $derived.by(() => {
        const items = new Map([...shownItems, ...view.removedItems].map((item) => [item.id, item]));
        const shown = new Set(shownItems.map((item) => item.id));
        const ids = view.order.filter((id) => items.has(id));
        const depths = getStackDepths(ids.toReversed(), shown);
        return ids.map((id) => ({
            id,
            // The store holds the options as given to the static API (ToastProps), not the foundation's ToastInstance
            // shape. List-level options would otherwise land on the toast element as attributes like zindex="1010".
            props: omit(items.get(id) as ToastInstance, ['top', 'bottom', 'left', 'right', 'zIndex', 'getPopupContainer', 'stack']) as ToastItemProps,
            leaving: !shown.has(id),
            depth: depths.get(id) ?? 0,
        }));
    });

    setToastListContext({
        get paused() {
            return paused;
        },
        get updatedItems() {
            return updatedItems;
        },
        get removedItems() {
            return view.removedItems;
        },
        register: (id, element) => {
            elements.set(id, element);
            return () => {
                if (elements.get(id) === element) elements.delete(id);
            };
        },
    });

    const enter = (source: 'pointer' | 'focus') => {
        if (source === 'pointer') pointerInside = true;
        else focusInside = true;
        if (view.stack) stackExpanded = true;
    };

    const leave = (source: 'pointer' | 'focus') => {
        if (source === 'pointer') pointerInside = false;
        else focusInside = false;
        if (!paused) stackExpanded = false;
    };

    const handleFocusOut = (event: FocusEvent) => {
        if (!(event.relatedTarget instanceof Node && innerWrapper?.contains(event.relatedTarget))) leave('focus');
    };

    $effect(() => {
        const items = shownItems;
        const updated = updatedItems;
        untrack(() => {
            for (const { id } of fresh.pick(items, updated)) {
                announcer.announce(id, () => readNoticeText(elements.get(id), prefix));
            }
        });
    });

    // The order changes when a leave ends. A removed focused toast fires no reliable focusout, which would keep every
    // countdown paused.
    watch(
        () => view.order,
        () => {
            // An emptied list may fire no mouseleave (the pointer did not move); without this the next batch would start expanded.
            if (!shownItems.length && !view.removedItems.length) stackExpanded = false;
            if (hasLostFocus(focusInside, innerWrapper)) leave('focus');
        }
    );
</script>

<!-- Stays mounted so it is registered as a live region before any message is written into it -->
<div aria-atomic="true" aria-live="polite" class={`${prefix}-announcer`}>{announcement()}</div>
<div bind:this={innerWrapper} class={[`${prefix}-innerWrapper`, { [`${prefix}-innerWrapper-hover`]: expanded }]} onfocusin={() => enter('focus')} onfocusout={handleFocusOut} onmouseenter={() => enter('pointer')} onmouseleave={() => leave('pointer')}>
    {#each rows as row (row.id)}
        <Toast
            {...row.props}
            class={[row.props.class, { [`${prefix}-stack-hidden`]: isStackHidden(expanded, row.depth) }]}
            close={(id) => store.remove(id)}
            leaving={row.leaving}
            onLeaveEnd={() => store.finishLeave(row.id)}
            positionInList={{ length: shownItems.length, index: shownItems.length - 1 - row.depth }}
            stack={view.stack > 0}
            stackExpanded={expanded && !row.leaving}
        />
    {/each}
</div>
