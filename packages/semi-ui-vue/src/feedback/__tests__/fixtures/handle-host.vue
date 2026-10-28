<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import Feedback from '../../feedback.vue';
    import type { FeedbackHandle, FeedbackMode } from '../../interface';

    const props = defineProps<{ mode: FeedbackMode; visible: boolean; onReady: (handle: FeedbackHandle | null) => void }>();
    const feedback = useTemplateRef<FeedbackHandle>('feedback');
    onMounted(() => props.onReady(feedback.value));
</script>

<template>
    <Feedback ref="feedback" :mode="mode" :motion="false" title="Feedback" :visible="visible" />
</template>
