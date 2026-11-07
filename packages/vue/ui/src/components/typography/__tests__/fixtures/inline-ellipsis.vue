<script setup lang="ts">
    import Paragraph from '../../paragraph.vue';

    withDefaults(defineProps<{ text: string; tick?: number }>(), { tick: 0 });
</script>

<template>
    <Paragraph :data-tick="tick" :ellipsis="{ expandable: true, expandText: 'EX' }" :style="{ lineHeight: '20px' }">
        {{ text }}
    </Paragraph>
</template>
