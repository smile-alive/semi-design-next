<script setup lang="ts">
    import BreadcrumbItem from '../../breadcrumb-item.vue';
    import Breadcrumb from '../../breadcrumb.vue';
    import Counter from './counter.vue';

    const props = withDefaults(defineProps<{ order: string[]; maxItemCount?: number }>(), { maxItemCount: 10 });
</script>

<template>
    <Breadcrumb :maxItemCount="props.maxItemCount">
        <BreadcrumbItem v-for="id in props.order" :key="id"><Counter :id="id" /></BreadcrumbItem>
    </Breadcrumb>
</template>
