<script setup lang="ts">
    import Rating from '../..';
    import Tooltip from '../../../tooltip';
</script>

<template>
    <Tooltip :motion="false">
        <template #content>tip</template>
        <Rating />
    </Tooltip>
</template>
