<script setup lang="ts">
    import { Transfer, type TransferDataItem, type TransferValue } from '@fibrae/semi-ui-vue';

    const data = Array.from({ length: 100 }, (_v, i) => ({
        label: `选项名称 ${i}`,
        value: i,
        disabled: false,
        key: `key-${i}`,
    }));

    const onChange = (values: TransferValue, items: TransferDataItem[]) => console.log(values, items);
</script>

<template>
    <Transfer :dataSource="data" :style="{ width: '568px', height: '416px' }" @change="onChange" />
</template>
