<script setup lang="ts">
    import { ref } from 'vue';
    import Button from '../../../button';
    import UserGuide from '../../user-guide.vue';

    const props = withDefaults(defineProps<{ mask?: boolean; mode?: 'popup' | 'modal'; startVisible?: boolean }>(), {
        mask: undefined,
    });
    const visible = ref(props.startVisible ?? false);
    const steps = [
        { target: () => document.querySelector<HTMLElement>('#tour-a'), title: 'Step A' },
        { target: () => document.querySelector<HTMLElement>('#tour-b'), title: 'Step B' },
    ];
</script>

<template>
    <Button id="tour-a" @click="visible = true">Start</Button>
    <Button id="tour-b">Second</Button>
    <Button @click="visible = false">Elsewhere</Button>
    <UserGuide v-model:visible="visible" :mask="mask" :mode="mode" :steps="steps" />
</template>
