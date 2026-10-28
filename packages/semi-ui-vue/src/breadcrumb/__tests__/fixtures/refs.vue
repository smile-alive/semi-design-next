<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import BreadcrumbItem from '../../breadcrumb-item.vue';
    import Breadcrumb from '../../breadcrumb.vue';

    const emit = defineEmits<{ ready: [nav: Element, item: Element] }>();
    const nav = useTemplateRef('nav');
    const item = useTemplateRef('item');
    onMounted(() => emit('ready', nav.value?.$el, item.value?.$el));
</script>

<template>
    <Breadcrumb ref="nav">
        <BreadcrumbItem ref="item">semi</BreadcrumbItem>
    </Breadcrumb>
</template>
