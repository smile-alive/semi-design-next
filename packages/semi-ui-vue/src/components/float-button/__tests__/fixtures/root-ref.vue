<script setup lang="ts">
    import { onMounted, ref, useTemplateRef, type ComponentPublicInstance } from 'vue';
    import FloatButtonGroup from '../../float-button-group.vue';
    import FloatButton from '../../float-button.vue';

    const button = useTemplateRef<ComponentPublicInstance>('button');
    const link = useTemplateRef<ComponentPublicInstance>('link');
    const group = useTemplateRef<ComponentPublicInstance>('group');
    const tags = ref('');
    onMounted(() => {
        tags.value = [button.value, link.value, group.value].map((instance) => instance?.$el.tagName).join(',');
    });
</script>

<template>
    <FloatButton ref="button" />
    <FloatButton ref="link" href="#top" />
    <FloatButtonGroup ref="group" :items="[]" />
    <output aria-label="tags">{{ tags }}</output>
</template>
