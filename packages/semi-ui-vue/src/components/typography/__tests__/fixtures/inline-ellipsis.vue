<script setup lang="ts">
    import Paragraph from '../../paragraph.vue';

    const props = withDefaults(defineProps<{ text: string; tick?: number }>(), { tick: 0 });
</script>

<template>
    <Paragraph :data-tick="props.tick" :ellipsis="{ expandable: true, expandText: 'EX' }" :style="{ lineHeight: '20px' }">
        {{ props.text }}
    </Paragraph>
</template>
