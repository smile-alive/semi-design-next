<script setup lang="ts">
    import Collapsible from '../..';

    defineProps<{ isOpen: boolean }>();
    const emit = defineEmits<{ updated: [height: string, duration: string] }>();

    const handleUpdated = () => {
        const wrapper = document.querySelector<HTMLElement>('.semi-collapsible-wrapper') as HTMLElement;
        emit('updated', wrapper.style.getPropertyValue('--semi-collapsible-height'), wrapper.style.transitionDuration);
    };
</script>

<template>
    <Collapsible :isOpen="isOpen" @vue:updated="handleUpdated">
        <div>hello</div>
    </Collapsible>
</template>
