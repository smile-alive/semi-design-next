<script setup lang="ts">
    import { Button, Toast } from '@fibrae/semi-ui-vue';

    const show = () => {
        const id = 'toastid';
        Toast.info({ content: 'Update Content By Id', id });
        setTimeout(() => {
            Toast.success({ content: 'Id By Content Update', id });
        }, 1000);
    };
</script>

<template>
    <Button type="primary" @click="show">Update Content By Id</Button>
</template>
