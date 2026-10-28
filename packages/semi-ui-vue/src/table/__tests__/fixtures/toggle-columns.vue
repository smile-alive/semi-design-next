<script setup lang="ts">
    import Table from '../..';

    defineProps<{ dataSource: Record<string, unknown>[]; showAge: boolean; extra: string[] }>();
</script>

<template>
    <Table :dataSource="dataSource" :pagination="false">
        <Table.Column dataIndex="name" title="Name" />
        <Table.Column v-if="showAge" dataIndex="age" title="Age" />
        <Table.Column v-for="field in extra" :key="field" :dataIndex="field" :title="field" />
    </Table>
</template>
