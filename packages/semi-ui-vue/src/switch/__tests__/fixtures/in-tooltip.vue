<script setup lang="ts">
    import Switch from '../..';
    import Tooltip from '../../../tooltip';
</script>

<template>
    <Tooltip :motion="false">
        <template #content>tip</template>
        <Switch aria-label="dark mode" />
    </Tooltip>
</template>
