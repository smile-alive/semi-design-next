<script setup lang="ts">
    import { ref } from 'vue';
    import type { UserGuideStepItem } from '../../interface';
    import UserGuide from '../../user-guide.vue';

    defineProps<{ steps: UserGuideStepItem[]; mode?: 'popup' | 'modal' }>();
    const visible = ref(true);
    const current = ref(0);
</script>

<template>
    <UserGuide v-model:current="current" v-model:visible="visible" :mode="mode" :steps="steps" />
    <span data-testid="visible">{{ visible }}</span>
    <span data-testid="current">{{ current }}</span>
</template>
