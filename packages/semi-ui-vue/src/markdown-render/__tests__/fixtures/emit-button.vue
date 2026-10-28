<script setup lang="ts">
    const emit = defineEmits<{ click: [event: MouseEvent] }>();
</script>

<template>
    <button type="button" @click="emit('click', $event)">
        <slot />
    </button>
</template>
