<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import List, { ListItem } from '../..';

    defineProps<{ grid?: boolean }>();
    const emit = defineEmits<{ els: [list: Element, item: Element] }>();
    const list = useTemplateRef('list');
    const item = useTemplateRef('item');
    // The generic List instance type does not expose $el.
    onMounted(() => emit('els', (list.value as { $el: Element } | null)?.$el as Element, item.value?.$el));
</script>

<template>
    <List ref="list" :grid="grid ? { span: 12 } : undefined">
        <ListItem ref="item" />
    </List>
</template>
