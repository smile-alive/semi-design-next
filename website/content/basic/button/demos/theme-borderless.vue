<script setup lang="ts">
    import { Button } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Button :style="{ marginRight: '8px' }" theme="borderless" type="primary">主要</Button>
    <Button :style="{ marginRight: '8px' }" theme="borderless" type="secondary">次要</Button>
    <Button :style="{ marginRight: '8px' }" theme="borderless" type="tertiary">第三</Button>
    <Button :style="{ marginRight: '8px' }" theme="borderless" type="warning">警告</Button>
    <Button :style="{ marginRight: '8px' }" theme="borderless" type="danger">危险</Button>
</template>
