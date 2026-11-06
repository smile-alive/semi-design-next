<script setup lang="ts">
    import { IconMore } from '@fibrae/semi-icons-vue';
    import { Avatar, Table, type ColumnProps } from '@fibrae/semi-ui-vue';

    interface Row {
        key: string;
        name: string;
        nameIconSrc: string;
        size: string;
        owner: string;
        updateTime: string;
        avatarBg: 'grey' | 'red' | 'light-blue';
    }

    const onHeaderCell = () => ({
        style: {
            backgroundColor: 'var(--semi-color-fill-0)',
        },
    });

    const columns: ColumnProps<Row>[] = [
        {
            title: '标题',
            dataIndex: 'name',
            width: 280,
        },
        {
            title: '大小',
            width: 100,
            dataIndex: 'size',
        },
        {
            title: '所有者',
            dataIndex: 'owner',
            width: 200,
        },
        {
            title: '更新日期',
            width: 300,
            dataIndex: 'updateTime',
        },
        {
            title: '',
            dataIndex: 'operate',
        },
    ].map((column) => ({ ...column, onHeaderCell }));

    const data: Row[] = [
        {
            key: '1',
            name: 'Semi Design 设计稿.fig',
            nameIconSrc: '/assets/placeholder/app.svg',
            size: '2M',
            owner: '姜鹏志',
            updateTime: '2020-02-02 05:13',
            avatarBg: 'grey',
        },
        {
            key: '2',
            name: 'Semi Design 分享演示文稿',
            nameIconSrc: '/assets/docs-icon.png',
            size: '2M',
            owner: '郝宣',
            updateTime: '2020-01-17 05:31',
            avatarBg: 'red',
        },
        {
            key: '3',
            name: '设计文档',
            nameIconSrc: '/assets/docs-icon.png',
            size: '34KB',
            owner: 'Zoey Edwards',
            updateTime: '2020-01-26 11:01',
            avatarBg: 'light-blue',
        },
    ];
</script>

<template>
    <Table :columns="columns" :dataSource="data" :pagination="false">
        <template #cell="cellProps">
            <div v-if="cellProps.column.dataIndex === 'name'">
                <Avatar alt="" shape="square" size="small" :src="cellProps.record.nameIconSrc" :style="{ marginInlineEnd: '12px' }" />
                {{ cellProps.text }}
            </div>
            <div v-else-if="cellProps.column.dataIndex === 'owner'">
                <Avatar :color="cellProps.record.avatarBg" size="small" :style="{ marginInlineEnd: '4px' }">
                    {{ typeof cellProps.text === 'string' && cellProps.text.slice(0, 1) }}
                </Avatar>
                {{ cellProps.text }}
            </div>
            <IconMore v-else-if="cellProps.column.dataIndex === 'operate'" />
        </template>
    </Table>
</template>
