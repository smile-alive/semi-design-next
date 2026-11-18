<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Spin } from '@fibrae/semi-ui-vue';
    import { useSpinDelay } from '@fibrae/semi-ui-vue/composables';

    const loading = ref(false);
    const visible = useSpinDelay(
        () => loading.value,
        () => ({ delay: 300, minDuration: 600 })
    );

    const load = (ms: number) => {
        loading.value = true;
        setTimeout(() => (loading.value = false), ms);
    };
</script>

<template>
    <div>
        <Button style="margin-inline-end: 12px" @click="load(200)">200ms 的请求</Button>
        <Button style="margin-inline-end: 20px" @click="load(800)">800ms 的请求</Button>
        <Spin :spinning="visible" />
    </div>
</template>
