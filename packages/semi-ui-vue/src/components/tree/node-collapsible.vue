<script setup lang="ts">
    import { onMounted, shallowRef } from 'vue';
    import { useTimeout } from '../../composables/index';
    import Collapsible from '../collapsible';

    /**
     * Mounts in the `open` state and flips it once right after, so Collapsible animates the rows in or out. Later `open`
     * changes are ignored on purpose: the motion must not reverse, nor reopen rows that were collapsed.
     */
    const props = defineProps<{ open: boolean; motion: boolean; duration: number }>();
    const emit = defineEmits<{ motionEnd: [] }>();
    defineSlots<{ default?: () => unknown }>();

    const isOpen = shallowRef(props.open);

    const scheduleTimeout = useTimeout();

    onMounted(() =>
        scheduleTimeout(() => {
            isOpen.value = !isOpen.value;
        }, 0)
    );
</script>

<template>
    <Collapsible :duration="props.duration" :isOpen="isOpen" :motion="props.motion" @motionEnd="emit('motionEnd')">
        <slot />
    </Collapsible>
</template>
