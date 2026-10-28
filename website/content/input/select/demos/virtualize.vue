<script setup lang="ts">
    import { Select } from '@fibrae/semi-ui-vue';

    const options = Array.from({ length: 3000 }, (_, i) => ({ label: `option-${i}`, value: i }));
    const virtualize = {
        height: 270,
        width: '100%',
        itemSize: 36,
    };
</script>

<template>
    <Select aria-label="virtualize" filter :optionList="options" placeholder="拥有3k个Option的Select" :style="{ width: '260px' }" :virtualize="virtualize" />
</template>
