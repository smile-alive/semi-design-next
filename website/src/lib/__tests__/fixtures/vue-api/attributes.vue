<script setup lang="ts">
    import type { HTMLAttributes } from 'vue';

    const props = defineProps<{ label?: string; id?: string } & /* @vue-ignore */ Omit<HTMLAttributes, 'id'>>();
</script>

<template>
    <div :id="props.id">{{ props.label }}</div>
</template>
