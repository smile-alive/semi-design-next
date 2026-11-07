<script setup lang="ts">
    import { ref } from 'vue';
    import Transfer, { type TransferDataItem, type TransferValue } from '../..';

    const value = ref<TransferValue | undefined>(['a']);
    const changes = ref<TransferValue[]>([]);
    const dataSource: TransferDataItem[] = [
        { label: 'apple', value: 'a', key: 'a' },
        { label: 'banana', value: 'b', key: 'b' },
    ];
    const onChange = (values: TransferValue, items: TransferDataItem[]) => {
        changes.value.push(
            values,
            items.map((item) => item.value as string)
        );
    };
</script>

<template>
    <Transfer v-model="value" :dataSource="dataSource" @change="onChange" />
    <span data-testid="value">{{ JSON.stringify(value) }}</span>
    <span data-testid="changes">{{ JSON.stringify(changes) }}</span>
    <button type="button" @click="value = ['b']">set</button>
    <button type="button" @click="value = undefined">reset</button>
</template>
