<script setup lang="ts">
    import Tooltip from '@fibrae/semi-ui-vue/tooltip/index';
    import Checkbox from '../..';
</script>

<template>
    <Tooltip :motion="false">
        <template #content>tip</template>
        <Checkbox>label</Checkbox>
    </Tooltip>
</template>
