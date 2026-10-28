<script setup lang="ts">
    import Table from '../..';

    defineProps<{ dataSource: Record<string, unknown>[]; fields: string[] }>();
</script>

<template>
    <Table :dataSource="dataSource" :pagination="false">
        <Table.Column v-if="true" dataIndex="name" title="Name" />
        <Table.Column v-if="true" dataIndex="age" title="Age" />
        <Table.Column v-for="(field, i) in fields" :key="i" :dataIndex="field" :title="field" />
        <Table.Column key="op" title="Op" />
        <template #headerCell="{ column }">{{ String(column.key) }}</template>
    </Table>
</template>
