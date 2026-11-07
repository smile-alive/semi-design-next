<script setup lang="ts">
    import { ref } from 'vue';
    import Feedback from '../../feedback.vue';

    defineOptions({ inheritAttrs: false });
    const visible = ref(true);
</script>

<template>
    <Feedback v-bind="$attrs" v-model:visible="visible" title="Feedback" />
    <output aria-label="visible">{{ visible }}</output>
</template>
