<script setup lang="ts">
    import Tooltip from '@fibrae/semi-ui-vue/tooltip/index';
    import Rating from '../..';
</script>

<template>
    <Tooltip :motion="false">
        <template #content>tip</template>
        <Rating />
    </Tooltip>
</template>
