<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/notification/constants';
    import type NotificationListStore from '@fibrae/semi-foundation/components/notification/notification-list-foundation';
    import { groupNoticesByPosition, noticePositions } from '@fibrae/semi-foundation/components/notification/notification-list-foundation';
    import '@fibrae/semi-foundation/components/notification/notification.scss';
    import useAnnouncer from '../_base/use-announcer';
    import useStoreSnapshot from '../_base/use-store-snapshot';
    import useConfig from '../config-provider/use-config';
    import type { ListedNotice } from './context';
    import NoticeList from './notice-list.vue';

    const props = defineProps<{ store: NotificationListStore }>();

    const config = useConfig();

    const snapshot = useStoreSnapshot(props.store);
    const { text: announcement, announcer } = useAnnouncer();

    const removedIds = computed(() => snapshot.value.removedItems.map((item) => item.id as string));

    const groups = computed(() => {
        // The store's add() always has an id, which the foundation's optional field does not say.
        const grouped = groupNoticesByPosition(snapshot.value as { notices: ListedNotice[]; removedItems: ListedNotice[]; order: string[] }, config.value.direction);
        return noticePositions.flatMap((placement) => (grouped[placement].length ? [{ placement, items: grouped[placement] }] : []));
    });
</script>

<template>
    <!-- Stays mounted so it is registered as a live region before any message is written into it -->
    <div aria-atomic="true" aria-live="polite" :class="`${cssClasses.NOTICE}-announcer`">{{ announcement }}</div>
    <NoticeList v-for="group in groups" :key="group.placement" :announce="(key, read) => announcer.announce(key, read)" :items="group.items" :placement="group.placement" :removedIds="removedIds" :store="props.store" :updatedItems="snapshot.updatedItems" />
</template>
