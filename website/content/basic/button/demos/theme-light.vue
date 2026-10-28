<script setup lang="ts">
    import { Button } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Button :style="{ marginRight: '8px' }" theme="light" type="primary">浅色主要</Button>
    <Button :style="{ marginRight: '8px' }" theme="light" type="secondary">浅色次要</Button>
    <Button :style="{ marginRight: '8px' }" theme="light" type="tertiary">浅色第三</Button>
    <Button :style="{ marginRight: '8px' }" theme="light" type="warning">浅色警告</Button>
    <Button :style="{ marginRight: '8px' }" theme="light" type="danger">浅色危险</Button>
</template>
