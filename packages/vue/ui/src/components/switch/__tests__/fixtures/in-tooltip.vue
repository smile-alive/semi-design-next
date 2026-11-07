<script setup lang="ts">
    import Tooltip from '@fibrae/semi-ui-vue/tooltip/index';
    import Switch from '../..';
</script>

<template>
    <Tooltip :motion="false">
        <template #content>tip</template>
        <Switch aria-label="dark mode" />
    </Tooltip>
</template>
