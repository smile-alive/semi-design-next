<script setup lang="ts">
    import Table from '../..';

    defineProps<{ dataSource: Record<string, unknown>[] }>();
</script>

<template>
    <Table :dataSource="dataSource" :pagination="false">
        <Table.Column data-index="name" ellipsis fixed title="Name" :width="100" />
        <Table.Column data-index="age" title="Age" />
    </Table>
</template>
