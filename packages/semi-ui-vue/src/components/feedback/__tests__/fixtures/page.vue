<script setup lang="ts">
    import { ref } from 'vue';
    import Button from '../../../button';
    import Feedback from '../../feedback.vue';
    import type { FeedbackMode } from '../../interface';

    defineProps<{ mode: FeedbackMode }>();
    const visible = ref(false);
</script>

<template>
    <Button @click="visible = true">Open</Button>
    <Feedback v-model:visible="visible" :mode="mode" :motion="false" title="Feedback" />
</template>
