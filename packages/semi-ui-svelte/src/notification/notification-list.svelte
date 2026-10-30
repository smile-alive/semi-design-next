<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/notification/constants';
    import type { NoticePosition } from '@fibrae/semi-foundation/notification/notification-foundation';
    import '@fibrae/semi-foundation/notification/notification.scss';
    import useAnnouncer from '../_base/use-announcer.svelte.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useStoreSnapshot from '../_base/use-store-snapshot.svelte.js';
    import { getConfigContext } from '../config-provider/context.js';
    import type { ListedNotice } from './context.js';
    import type { NotificationListProps } from './interface.js';
    import NoticeList from './notice-list.svelte';

    // A list renders one store for its whole life
    let { store }: NotificationListProps = $props();
    const defaults = useDefaultProps('Notification');

    const config = getConfigContext();

    const snapshot = useStoreSnapshot(store);
    const { text: announcement, announcer } = useAnnouncer();

    const positions: NoticePosition[] = ['top', 'topLeft', 'topRight', 'bottom', 'bottomLeft', 'bottomRight'];
    const view = $derived(snapshot());

    const groups = $derived.by(() => {
        const { notices, removedItems, order } = view;
        // The store's add() always has an id, which the foundation's optional field does not say.
        const byId = new Map([...notices, ...removedItems].map((item) => [item.id, item as ListedNotice]));
        const grouped = new Map<NoticePosition, ListedNotice[]>(positions.map((position) => [position, []]));
        for (const id of order) {
            const item = byId.get(id);
            if (!item) continue;
            const rtl = (item.direction || config.direction) === 'rtl';
            // A hook's notice carries no merged defaults, so the global default position is read here.
            const position = item.position || defaults('position') || (rtl ? 'topLeft' : 'topRight');
            grouped.get(position)?.push(item);
        }
        return positions.flatMap((placement) => {
            const items = grouped.get(placement) ?? [];
            return items.length ? [{ placement, items }] : [];
        });
    });
</script>

<!-- Stays mounted so it is registered as a live region before any message is written into it -->
<div aria-atomic="true" aria-live="polite" class={`${cssClasses.NOTICE}-announcer`}>{announcement()}</div>
{#each groups as group (group.placement)}
    <NoticeList announce={(key, read) => announcer.announce(key, read)} items={group.items} placement={group.placement} removedItems={view.removedItems} {store} updatedItems={view.updatedItems} />
{/each}
