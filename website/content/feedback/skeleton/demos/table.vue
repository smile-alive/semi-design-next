<script setup lang="ts">
    import { Skeleton, Table, type ColumnProps } from '@fibrae/semi-ui-vue';

    const columns: ColumnProps[] = [
        {
            title: 'Name',
            dataIndex: 'name',
        },
        {
            title: 'Age',
            dataIndex: 'age',
        },
        {
            title: 'Address',
            dataIndex: 'address',
        },
    ];

    const dataSource = [
        {
            key: '1',
            name: 'John Brown',
            age: 32,
            address: 'New York No. 1 Lake Park, New York No. 1 Lake Park',
        },
        {
            key: '2',
            name: 'Jim Green',
            age: 42,
            address: 'London No. 1 Lake Park',
        },
        {
            key: '3',
            name: 'Joe Black',
            age: 32,
            address: 'Sidney No. 1 Lake Park',
        },
        {
            key: '4',
            name: 'Disabled User',
            age: 99,
            address: 'Sidney No. 1 Lake Park',
        },
    ];

    const placeholderColumns: ColumnProps[] = [1, 2, 3].map((key) => ({ dataIndex: `${key}` }));
    const placeholderDataSource = [1, 2, 3, 4].map((key) => ({ key }));
</script>

<template>
    <Skeleton loading>
        <template #placeholder>
            <div :style="{ position: 'relative' }">
                <Table :columns="placeholderColumns" :dataSource="placeholderDataSource" :pagination="false" :style="{ backgroundColor: 'var(--semi-color-bg-1)' }">
                    <template #headerCell>
                        <Skeleton.Title :style="{ width: '0' }" />
                    </template>
                    <template #cell="{ column }">
                        <Skeleton.Paragraph :rows="1" :style="{ width: `${50 * Number(column.dataIndex)}px` }" />
                    </template>
                </Table>
                <div :style="{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }" />
            </div>
        </template>
        <div>
            <Table :columns="columns" :dataSource="dataSource" :pagination="false" />
        </div>
    </Skeleton>
</template>
