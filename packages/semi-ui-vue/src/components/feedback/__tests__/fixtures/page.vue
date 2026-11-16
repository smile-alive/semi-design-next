<script setup lang="ts">
    import { ref } from 'vue';
    import Button from '@fibrae/semi-ui-vue/button/index';
    import Feedback from '../../feedback.vue';
    import type { FeedbackMode } from '../../interface';

    const props = defineProps<{ mode: FeedbackMode }>();
    const visible = ref(false);
</script>

<template>
    <Button @click="visible = true">Open</Button>
    <Feedback v-model:visible="visible" :mode="props.mode" :motion="false" title="Feedback" />
</template>
