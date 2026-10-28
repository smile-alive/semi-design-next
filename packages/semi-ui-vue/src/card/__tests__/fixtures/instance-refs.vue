<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import Card, { CardGroup, CardMeta } from '../..';

    const emit = defineEmits<{ els: [group: Element, card: Element, meta: Element] }>();
    const group = useTemplateRef('group');
    const card = useTemplateRef('card');
    const meta = useTemplateRef('meta');
    onMounted(() => emit('els', group.value?.$el, card.value?.$el, meta.value?.$el));
</script>

<template>
    <CardGroup ref="group">
        <Card ref="card">
            <CardMeta ref="meta">
                <template #title>m</template>
            </CardMeta>
        </Card>
    </CardGroup>
</template>
