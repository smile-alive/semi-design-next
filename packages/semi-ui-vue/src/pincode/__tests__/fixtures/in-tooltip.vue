<script setup lang="ts">
    import PinCode from '../..';
    import Tooltip from '../../../tooltip';
</script>

<template>
    <Tooltip :motion="false">
        <template #content>tip</template>
        <PinCode :count="2" />
    </Tooltip>
</template>
