<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/pagination/constants';
    import VirtualList from '../_base/virtual-list.vue';
    import useConfig from '../config-provider/use-config';
    import useLocale from '../locale/use-locale';

    // The pages behind an ellipsis can number in the millions, so the list is virtualized. Rows are focusable buttons:
    // ArrowDown on the popover trigger moves focus into them, and the scroll container must not stop Tab.
    const props = defineProps<{ start: number; count: number }>();
    const emit = defineEmits<{ select: [page: number] }>();

    const config = useConfig();
    const locale = useLocale('Pagination');

    const prefix = cssClasses.PREFIX;

    // Equals $height-pagination_item in pagination.scss
    const itemHeight = 32;

    const pageLabel = (page: number) => locale.value.locale.pageN.replace('${page}', String(page));
</script>

<template>
    <VirtualList :class="`${prefix}-rest-list`" :height="itemHeight * Math.min(props.count, 5)" :itemCount="props.count" :itemSize="itemHeight" :style="{ direction: config.direction }" :width="78">
        <template #default="{ index, style }">
            <button :aria-label="pageLabel(props.start + index)" :class="`${prefix}-rest-item`" :style="style" type="button" @click="emit('select', props.start + index)">
                {{ props.start + index }}
            </button>
        </template>
    </VirtualList>
</template>
