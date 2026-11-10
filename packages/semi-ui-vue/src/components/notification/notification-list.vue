<script setup lang="ts">
    import { computed, onMounted, watch } from 'vue';
    import { FreshItems, type ListStoreState, readNoticeText } from '@fibrae/semi-foundation/base';
    import { cssClasses } from '@fibrae/semi-foundation/components/notification/constants';
    import { groupNoticesByPosition, noticePositions, type NotificationListProps } from '@fibrae/semi-foundation/components/notification/notification-list-foundation';
    import '@fibrae/semi-foundation/components/notification/notification.scss';
    import { useAnnouncer, useStoreSnapshot } from '../../composables/index';
    import useConfig from '../config-provider/use-config';
    import type { ListedNotice, RegisterNotice } from './context';
    import NoticeList from './notice-list.vue';

    const props = defineProps<NotificationListProps>();

    const config = useConfig();

    const elements = new Map<string, Element>();
    const fresh = new FreshItems();

    const snapshot = useStoreSnapshot(props.store);
    const { text: announcement, announcer } = useAnnouncer();

    const items = computed(() => snapshot.value.items);
    const updatedItems = computed(() => snapshot.value.updatedItems);
    const removedIds = computed(() => snapshot.value.removedItems.map((item) => item.id));

    const groups = computed(() => {
        // the offsets ride along from the options, which the foundation's notice type does not declare
        const grouped = groupNoticesByPosition(snapshot.value as ListStoreState<ListedNotice>, config.value.direction);
        return noticePositions.flatMap((placement) => (grouped[placement].length ? [{ placement, items: grouped[placement] }] : []));
    });

    const register: RegisterNotice = (id, element) => {
        elements.set(id, element);
        return () => {
            if (elements.get(id) === element) elements.delete(id);
        };
    };

    const announceFresh = () => {
        for (const { id } of fresh.pick(items.value, updatedItems.value)) {
            announcer.announce(id, () => readNoticeText(elements.get(id), cssClasses.NOTICE));
        }
    };

    watch([items, updatedItems], announceFresh, { flush: 'post' });

    onMounted(announceFresh);
</script>

<template>
    <!-- Stays mounted so it is registered as a live region before any message is written into it -->
    <div aria-atomic="true" aria-live="polite" :class="`${cssClasses.NOTICE}-announcer`">{{ announcement }}</div>
    <NoticeList v-for="group in groups" :key="group.placement" :items="group.items" :placement="group.placement" :register="register" :removedIds="removedIds" :stack="snapshot.stack" :store="props.store" :updatedItems="updatedItems" />
</template>
