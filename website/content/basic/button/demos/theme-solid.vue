<script setup lang="ts">
    import { Button } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Button :style="{ marginRight: '8px' }" theme="solid" type="primary">深色主要</Button>
    <Button :style="{ marginRight: '8px' }" theme="solid" type="secondary">深色次要</Button>
    <Button :style="{ marginRight: '8px' }" theme="solid" type="tertiary">深色第三</Button>
    <Button :style="{ marginRight: '8px' }" theme="solid" type="warning">深色警告</Button>
    <Button :style="{ marginRight: '8px' }" theme="solid" type="danger">深色危险</Button>
</template>
