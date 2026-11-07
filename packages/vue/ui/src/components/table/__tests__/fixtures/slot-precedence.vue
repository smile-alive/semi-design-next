<script setup lang="ts">
    import Table from '../..';

    defineProps<{ dataSource: Record<string, unknown>[] }>();
</script>

<template>
    <Table :dataSource="dataSource" :pagination="false">
        <Table.Column dataIndex="name" title="Name" />
        <Table.Column dataIndex="age" title="Age">
            <template #cell="{ text }">
                <b>own {{ text }}</b>
            </template>
            <template #title>Own Age</template>
        </Table.Column>
        <Table.Column dataIndex="address" title="Address" />
        <template #cell="{ column, text }">
            <i v-if="column.dataIndex !== 'address'">table {{ text }}</i>
        </template>
        <template #headerCell="{ column }">
            <i v-if="column.dataIndex !== 'address'">H {{ column.title }}</i>
        </template>
    </Table>
</template>
