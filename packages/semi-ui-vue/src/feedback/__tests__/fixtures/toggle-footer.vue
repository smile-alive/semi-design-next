<script setup lang="ts">
    import Feedback from '../../feedback.vue';
    import type { FeedbackMode } from '../../interface';

    defineProps<{ mode: FeedbackMode; custom: boolean }>();
</script>

<template>
    <Feedback :mode="mode" :motion="false" title="Feedback" visible>
        <template v-if="custom" #footer>
            <span>own footer</span>
        </template>
    </Feedback>
</template>
