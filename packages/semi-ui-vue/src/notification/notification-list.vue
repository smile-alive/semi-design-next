<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/notification/constants';
    import type { NoticePosition } from '@fibrae/semi-foundation/notification/notification-foundation';
    import type NotificationListStore from '@fibrae/semi-foundation/notification/notification-list-foundation';
    import '@fibrae/semi-foundation/notification/notification.scss';
    import { readSemiDefault, useSemiGlobal } from '../_base/semi-default';
    import useAnnouncer from '../_base/use-announcer';
    import useStoreSnapshot from '../_base/use-store-snapshot';
    import useConfig from '../config-provider/use-config';
    import type { ListedNotice } from './context';
    import NoticeList from './notice-list.vue';

    const props = defineProps<{ store: NotificationListStore }>();

    const semi = useSemiGlobal();
    const config = useConfig();

    const snapshot = useStoreSnapshot(props.store);
    const { text: announcement, announcer } = useAnnouncer();

    const positions: NoticePosition[] = ['top', 'topLeft', 'topRight', 'bottom', 'bottomLeft', 'bottomRight'];
    const removedIds = computed(() => snapshot.value.removedItems.map((item) => item.id as string));

    const groups = computed(() => {
        const { notices, removedItems, order } = snapshot.value;
        // The store's add() always has an id, which the foundation's optional field does not say.
        const byId = new Map([...notices, ...removedItems].map((item) => [item.id, item as ListedNotice]));
        const grouped = new Map<NoticePosition, ListedNotice[]>(positions.map((position) => [position, []]));
        for (const id of order) {
            const item = byId.get(id);
            if (!item) continue;
            const rtl = (item.direction || config.value.direction) === 'rtl';
            // A hook's notice carries no merged defaults, so the global default position is read here.
            const position = item.position || readSemiDefault(semi, 'Notification', 'position') || (rtl ? 'topLeft' : 'topRight');
            grouped.get(position)?.push(item);
        }
        return positions.flatMap((placement) => {
            const items = grouped.get(placement) ?? [];
            return items.length ? [{ placement, items }] : [];
        });
    });
</script>

<template>
    <!-- Stays mounted so it is registered as a live region before any message is written into it -->
    <div aria-atomic="true" aria-live="polite" :class="`${cssClasses.NOTICE}-announcer`">{{ announcement }}</div>
    <NoticeList v-for="group in groups" :key="group.placement" :announce="(key, read) => announcer.announce(key, read)" :items="group.items" :placement="group.placement" :removedIds="removedIds" :store="props.store" :updatedItems="snapshot.updatedItems" />
</template>
