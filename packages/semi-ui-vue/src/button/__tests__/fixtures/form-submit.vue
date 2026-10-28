<script setup lang="ts">
    import Button from '../../index';

    defineProps<{ loading?: boolean }>();
    const emit = defineEmits<{ submit: [] }>();
</script>

<template>
    <form @submit.prevent="emit('submit')">
        <Button htmlType="submit" :loading="loading">save</Button>
    </form>
</template>
