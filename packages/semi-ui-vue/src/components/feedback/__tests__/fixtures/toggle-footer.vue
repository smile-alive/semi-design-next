<script setup lang="ts">
    import Feedback from '../../feedback.vue';
    import type { FeedbackMode } from '../../interface';

    const props = defineProps<{ mode: FeedbackMode; custom: boolean }>();
</script>

<template>
    <Feedback :mode="props.mode" :motion="false" title="Feedback" visible>
        <template v-if="props.custom" #footer>
            <span>own footer</span>
        </template>
    </Feedback>
</template>
