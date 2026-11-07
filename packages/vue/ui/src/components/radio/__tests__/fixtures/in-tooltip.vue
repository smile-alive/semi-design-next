<script setup lang="ts">
    import Tooltip from '@fibrae/semi-ui-vue/tooltip/index';
    import Radio from '../..';
</script>

<template>
    <Tooltip :motion="false">
        <template #content>tip</template>
        <Radio>A</Radio>
    </Tooltip>
</template>
