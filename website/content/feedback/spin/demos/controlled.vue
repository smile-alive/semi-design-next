<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Spin } from '@fibrae/semi-ui-vue';

    const loading = ref(false);
</script>

<template>
    <div>
        <Button style="margin-right: 20px" @click="loading = !loading">受控的 Spin</Button>
        <Spin :spinning="loading" />
    </div>
</template>
