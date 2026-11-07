<script setup lang="ts">
    import Table from '../..';

    defineProps<{ dataSource: Record<string, unknown>[] }>();
</script>

<template>
    <Table :dataSource="dataSource">
        <Table.Column key="name" dataIndex="name" title="Name">
            <template #cell="{ text }">
                <a href="https://semi.design">{{ text }}</a>
            </template>
        </Table.Column>
        <Table.Column key="age" dataIndex="age" title="Age" />
        <Table.Column key="address" dataIndex="address" title="Address" />
    </Table>
</template>
