<script setup lang="ts">
    import Tooltip from '../../tooltip.vue';
</script>

<template>
    <Tooltip :motion="false" position="top" trigger="custom" visible>
        <Tooltip :motion="false" position="bottom" trigger="custom" visible>
            <button :style="{ margin: '200px' }" type="button">trigger</button>
            <template #content>inner</template>
        </Tooltip>
        <template #content>outer</template>
    </Tooltip>
</template>
