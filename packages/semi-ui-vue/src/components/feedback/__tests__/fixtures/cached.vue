<script setup lang="ts">
    import Feedback from '../../feedback.vue';
    import type { FeedbackMode } from '../../interface';

    const props = defineProps<{ shown: boolean; mode: FeedbackMode }>();
</script>

<template>
    <KeepAlive>
        <Feedback v-if="props.shown" :mode="props.mode" :motion="false" title="Feedback" visible />
        <p v-else>other</p>
    </KeepAlive>
</template>
