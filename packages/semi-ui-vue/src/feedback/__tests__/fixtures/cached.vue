<script setup lang="ts">
    import Feedback from '../../feedback.vue';
    import type { FeedbackMode } from '../../interface';

    defineProps<{ shown: boolean; mode: FeedbackMode }>();
</script>

<template>
    <KeepAlive>
        <Feedback v-if="shown" :mode="mode" :motion="false" title="Feedback" visible />
        <p v-else>other</p>
    </KeepAlive>
</template>
