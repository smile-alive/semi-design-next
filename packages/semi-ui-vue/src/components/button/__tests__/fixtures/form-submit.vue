<script setup lang="ts">
    import Button from '../../index';

    const props = defineProps<{ loading?: boolean }>();
    const emit = defineEmits<{ submit: [] }>();
</script>

<template>
    <form @submit.prevent="emit('submit')">
        <Button htmlType="submit" :loading="props.loading">save</Button>
    </form>
</template>
