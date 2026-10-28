<script setup lang="ts">
    import Radio from '../..';
    import Tooltip from '../../../tooltip';
</script>

<template>
    <Tooltip :motion="false">
        <template #content>tip</template>
        <Radio>A</Radio>
    </Tooltip>
</template>
