<script setup lang="ts">
    import { IconClear, IconComment, IconMore, IconTickCircle } from '@fibrae/semi-icons-vue';
    import { Avatar, Table, Tag, type ColumnProps } from '@fibrae/semi-ui-vue';

    interface Row {
        key: string;
        name: string;
        nameIconSrc: string;
        size: string;
        owner: string;
        status: 'success' | 'pending' | 'wait';
        updateTime: string;
        avatarBg: 'grey' | 'red' | 'light-blue';
    }

    const tagConfig = {
        success: { color: 'green', icon: IconTickCircle, text: '已交付' },
        pending: { color: 'pink', icon: IconClear, text: '已延期' },
        wait: { color: 'cyan', icon: IconComment, text: '待评审' },
    } as const;

    const columns: ColumnProps<Row>[] = [
        {
            title: '标题',
            dataIndex: 'name',
        },
        {
            title: '大小',
            dataIndex: 'size',
        },
        {
            title: '交付状态',
            dataIndex: 'status',
        },
        {
            title: '所有者',
            dataIndex: 'owner',
        },
        {
            title: '更新日期',
            dataIndex: 'updateTime',
        },
        {
            title: '',
            dataIndex: 'operate',
        },
    ];

    const data: Row[] = [
        {
            key: '1',
            name: 'Semi Design 设计稿.fig',
            nameIconSrc: '/assets/placeholder/app.svg',
            size: '2M',
            owner: '姜鹏志',
            status: 'success',
            updateTime: '2020-02-02 05:13',
            avatarBg: 'grey',
        },
        {
            key: '2',
            name: 'Semi Design 分享演示文稿',
            nameIconSrc: '/assets/docs-icon.png',
            size: '2M',
            owner: '郝宣',
            status: 'pending',
            updateTime: '2020-01-17 05:31',
            avatarBg: 'red',
        },
        {
            key: '3',
            name: '设计文档',
            nameIconSrc: '/assets/docs-icon.png',
            size: '34KB',
            status: 'wait',
            owner: 'Zoey Edwards',
            updateTime: '2020-01-26 11:01',
            avatarBg: 'light-blue',
        },
    ];
</script>

<template>
    <Table :columns="columns" :dataSource="data" :pagination="false">
        <template #cell="{ column, record, text }">
            <div v-if="column.dataIndex === 'name'">
                <Avatar alt="" shape="square" size="small" :src="record.nameIconSrc" :style="{ marginRight: '12px' }" />
                {{ text }}
            </div>
            <Tag v-else-if="column.dataIndex === 'status'" :color="tagConfig[text as Row['status']].color" shape="circle" :style="{ userSelect: 'text' }">
                <template #prefixIcon>
                    <component :is="tagConfig[text as Row['status']].icon" />
                </template>
                {{ tagConfig[text as Row['status']].text }}
            </Tag>
            <div v-else-if="column.dataIndex === 'owner'">
                <Avatar :color="record.avatarBg" size="small" :style="{ marginRight: '4px' }">
                    {{ typeof text === 'string' && text.slice(0, 1) }}
                </Avatar>
                {{ text }}
            </div>
            <IconMore v-else-if="column.dataIndex === 'operate'" />
        </template>
    </Table>
</template>
