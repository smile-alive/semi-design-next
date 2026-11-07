<script setup lang="ts">
    import Checkbox from '../..';
    import Tooltip from '../../../tooltip';
</script>

<template>
    <Tooltip :motion="false">
        <template #content>tip</template>
        <Checkbox>label</Checkbox>
    </Tooltip>
</template>
