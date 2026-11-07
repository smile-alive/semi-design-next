<script setup lang="ts">
    import { ref } from 'vue';
    import Table from '../..';

    withDefaults(defineProps<{ withExpandedRow?: boolean; resizable?: boolean }>(), { withExpandedRow: true, resizable: false });
    const keys = ref<(string | number)[]>(['1']);
    const keysInChange = ref('');
    const columns = [{ title: 'Name', dataIndex: 'name', width: 200 }];
    const dataSource = [
        { key: '1', name: 'Ann' },
        { key: '2', name: 'Bob' },
    ];
</script>

<template>
    <span data-testid="keys">{{ keys.join(',') }}</span>
    <span data-testid="keys-in-change">{{ keysInChange }}</span>
    <button type="button" @click="keys = ['2']">expand Bob</button>
    <Table v-model:expandedRowKeys="keys" :columns="columns" :dataSource="dataSource" :hideExpandedColumn="false" :pagination="false" :resizable="resizable" @expandedRowsChange="keysInChange = keys.join(',')">
        <template v-if="withExpandedRow" #expandedRow="{ record }">detail {{ record.name }}</template>
    </Table>
</template>
