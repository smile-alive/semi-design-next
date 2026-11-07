<script setup lang="ts">
    import Tooltip from '@fibrae/semi-ui-vue/tooltip/index';
    import Input from '../..';
</script>

<template>
    <Tooltip :motion="false">
        <template #content>tip</template>
        <Input />
    </Tooltip>
</template>
