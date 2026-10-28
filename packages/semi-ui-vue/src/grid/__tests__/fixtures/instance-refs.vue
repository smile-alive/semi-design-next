<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import Col from '../../col.vue';
    import Row from '../../row.vue';

    const emit = defineEmits<{ els: [row: Element, col: Element] }>();
    const row = useTemplateRef('row');
    const col = useTemplateRef('col');
    onMounted(() => emit('els', row.value?.$el, col.value?.$el));
</script>

<template>
    <Row ref="row">
        <Col ref="col" />
    </Row>
</template>
