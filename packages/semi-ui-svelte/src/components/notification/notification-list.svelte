<script lang="ts">
    import { untrack } from 'svelte';
    import { SvelteMap } from 'svelte/reactivity';
    import { FreshItems, type ListStoreState, readNoticeText } from '@fibrae/semi-foundation/base/list-store';
    import { cssClasses } from '@fibrae/semi-foundation/components/notification/constants';
    import { groupNoticesByPosition, noticePositions } from '@fibrae/semi-foundation/components/notification/notification-list-foundation';
    import '@fibrae/semi-foundation/components/notification/notification.scss';
    import useAnnouncer from '../../hooks/use-announcer.svelte.js';
    import useStoreSnapshot from '../../hooks/use-store-snapshot.svelte.js';
    import { getConfigContext } from '../config-provider/context.js';
    import type { ListedNotice, RegisterNotice } from './context.js';
    import type { NotificationListProps } from './interface.js';
    import NoticeList from './notice-list.svelte';

    let { store }: NotificationListProps = $props();

    const config = getConfigContext();

    const elements = new SvelteMap<string, Element>();
    const fresh = new FreshItems();

    const snapshot = useStoreSnapshot(store);
    const { text: announcement, announcer } = useAnnouncer();

    const view = $derived(snapshot());
    const shownItems = $derived(view.items);
    const updatedItems = $derived(view.updatedItems);

    const groups = $derived.by(() => {
        // the offsets ride along from the options, which the foundation's notice type does not declare
        const grouped = groupNoticesByPosition(view as ListStoreState<ListedNotice>, config.direction);
        return noticePositions.flatMap((placement) => (grouped[placement].length ? [{ placement, items: grouped[placement] }] : []));
    });

    const register: RegisterNotice = (id, element) => {
        elements.set(id, element);
        return () => {
            if (elements.get(id) === element) elements.delete(id);
        };
    };

    $effect(() => {
        const items = shownItems;
        const updated = updatedItems;
        untrack(() => {
            for (const { id } of fresh.pick(items, updated)) {
                announcer.announce(id, () => readNoticeText(elements.get(id), cssClasses.NOTICE));
            }
        });
    });
</script>

<!-- Stays mounted so it is registered as a live region before any message is written into it -->
<div aria-atomic="true" aria-live="polite" class={`${cssClasses.NOTICE}-announcer`}>{announcement()}</div>
{#each groups as group (group.placement)}
    <NoticeList items={group.items} placement={group.placement} {register} removedItems={view.removedItems} stack={view.stack} {store} {updatedItems} />
{/each}
