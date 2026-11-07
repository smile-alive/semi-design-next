<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/notification/constants';
    import { groupNoticesByPosition, noticePositions } from '@fibrae/semi-foundation/components/notification/notification-list-foundation';
    import '@fibrae/semi-foundation/components/notification/notification.scss';
    import useAnnouncer from '../../hooks/use-announcer.svelte.js';
    import useStoreSnapshot from '../../hooks/use-store-snapshot.svelte.js';
    import { getConfigContext } from '../config-provider/context.js';
    import type { ListedNotice } from './context.js';
    import type { NotificationListProps } from './interface.js';
    import NoticeList from './notice-list.svelte';

    let { store }: NotificationListProps = $props();

    const config = getConfigContext();

    const snapshot = useStoreSnapshot(store);
    const { text: announcement, announcer } = useAnnouncer();

    const view = $derived(snapshot());

    const groups = $derived.by(() => {
        // The store's add() always has an id, which the foundation's optional field does not say.
        const grouped = groupNoticesByPosition(view as { notices: ListedNotice[]; removedItems: ListedNotice[]; order: string[] }, config.direction);
        return noticePositions.flatMap((placement) => (grouped[placement].length ? [{ placement, items: grouped[placement] }] : []));
    });
</script>

<!-- Stays mounted so it is registered as a live region before any message is written into it -->
<div aria-atomic="true" aria-live="polite" class={`${cssClasses.NOTICE}-announcer`}>{announcement()}</div>
{#each groups as group (group.placement)}
    <NoticeList announce={(key, read) => announcer.announce(key, read)} items={group.items} placement={group.placement} removedItems={view.removedItems} {store} updatedItems={view.updatedItems} />
{/each}
