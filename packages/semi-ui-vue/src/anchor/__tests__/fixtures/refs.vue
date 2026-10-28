<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import AnchorLink from '../../anchor-link.vue';
    import Anchor from '../../anchor.vue';

    const emit = defineEmits<{ ready: [anchor: Element, item: Element] }>();
    const anchor = useTemplateRef('anchor');
    const item = useTemplateRef('item');
    onMounted(() => emit('ready', anchor.value?.$el, item.value?.$el));
</script>

<template>
    <Anchor ref="anchor">
        <AnchorLink ref="item" href="#a" title="a" />
    </Anchor>
</template>
