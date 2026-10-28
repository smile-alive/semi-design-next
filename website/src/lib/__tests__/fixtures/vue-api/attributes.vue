<script setup lang="ts">
    import type { HTMLAttributes } from 'vue';

    defineProps<{ label?: string; id?: string } & /* @vue-ignore */ Omit<HTMLAttributes, 'id'>>();
</script>

<template>
    <div :id="id">{{ label }}</div>
</template>
