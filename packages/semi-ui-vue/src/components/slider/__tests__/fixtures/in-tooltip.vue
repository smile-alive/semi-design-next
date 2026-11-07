<script setup lang="ts">
    import Slider from '../..';
    import Tooltip from '../../../tooltip';
</script>

<template>
    <Tooltip :motion="false">
        <template #content>outer tip</template>
        <Slider aria-label="volume" :defaultValue="30" showBoundary style="width: 100px; height: 32px" />
    </Tooltip>
</template>
