<script setup lang="ts">
    import { Transfer } from '@fibrae/semi-ui-vue';

    const data = Array.from({ length: 30 }, (_, i) => ({
        label: `选项名称 ${i}`,
        value: i,
        disabled: false,
        key: `key-${i}`,
    }));
</script>

<template>
    <Transfer :dataSource="data" :defaultValue="[2, 4]" draggable style="width: 568px; height: 416px" @change="(values, items) => console.log(values, items)" />
</template>
