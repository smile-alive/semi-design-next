<script setup lang="ts">
    import Tooltip from '@fibrae/semi-ui-vue/tooltip/index';
    import PinCode from '../..';
</script>

<template>
    <Tooltip :motion="false">
        <template #content>tip</template>
        <PinCode :count="2" />
    </Tooltip>
</template>
