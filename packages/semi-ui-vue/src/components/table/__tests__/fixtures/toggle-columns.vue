<script setup lang="ts">
    import Table from '../..';

    const props = defineProps<{ dataSource: Record<string, unknown>[]; showAge: boolean; extra: string[] }>();
</script>

<template>
    <Table :dataSource="props.dataSource" :pagination="false">
        <Table.Column dataIndex="name" title="Name" />
        <Table.Column v-if="props.showAge" dataIndex="age" title="Age" />
        <Table.Column v-for="field in props.extra" :key="field" :dataIndex="field" :title="field" />
    </Table>
</template>
