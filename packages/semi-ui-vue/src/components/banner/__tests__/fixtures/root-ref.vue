<script setup lang="ts">
    import { onMounted, ref, useTemplateRef } from 'vue';
    import Banner from '../../banner.vue';

    const banner = useTemplateRef('banner');
    const rootClass = ref('');
    onMounted(() => {
        rootClass.value = banner.value?.$el.className ?? '';
    });
</script>

<template>
    <Banner ref="banner" />
    <output aria-label="root-class">{{ rootClass }}</output>
</template>
