<script setup lang="ts">
    import { Button } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Button size="large" :style="{ marginRight: '8px' }">大尺寸</Button>
        <Button size="default" :style="{ marginRight: '8px' }">默认尺寸</Button>
        <Button size="small">小尺寸</Button>
    </div>
</template>
