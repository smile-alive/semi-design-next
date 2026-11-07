<script setup lang="ts">
    import Input from '../..';
    import Tooltip from '../../../tooltip';
</script>

<template>
    <Tooltip :motion="false">
        <template #content>tip</template>
        <Input />
    </Tooltip>
</template>
