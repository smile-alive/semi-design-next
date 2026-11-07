<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import Descriptions, { DescriptionsItem } from '../../index';

    const emit = defineEmits<{ els: [root: Element, row: Element] }>();
    const root = useTemplateRef('root');
    const row = useTemplateRef('row');
    onMounted(() => emit('els', root.value?.$el, row.value?.$el));
</script>

<template>
    <Descriptions ref="root">
        <DescriptionsItem ref="row"><template #itemKey>a</template>1</DescriptionsItem>
    </Descriptions>
</template>
