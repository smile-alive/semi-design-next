<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Spin } from '@fibrae/semi-ui-vue';

    const loading = ref(false);
</script>

<template>
    <div>
        <Button style="margin-right: 20px" @click="loading = !loading">延迟显示的spin</Button>
        <Spin :delay="1000" :spinning="loading" />
    </div>
</template>
