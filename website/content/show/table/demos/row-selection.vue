<script setup lang="ts">
    import { IconClear, IconComment, IconMore, IconTickCircle } from '@fibrae/semi-icons-vue';
    import { Avatar, Table, Tag, type ColumnProps, type RowSelectionProps } from '@fibrae/semi-ui-vue';

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
            width: 400,
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
        {
            key: '4',
            name: 'Semi D2C 设计稿.fig',
            nameIconSrc: '/assets/placeholder/app.svg',
            size: '2M',
            owner: '姜鹏志',
            status: 'wait',
            updateTime: '2020-02-02 05:13',
            avatarBg: 'grey',
        },
        {
            key: '5',
            name: 'Semi D2C 分享演示文稿',
            nameIconSrc: '/assets/docs-icon.png',
            size: '2M',
            owner: '郝宣',
            status: 'pending',
            updateTime: '2020-01-17 05:31',
            avatarBg: 'red',
        },
        {
            key: '6',
            name: 'Semi D2C 设计文档',
            nameIconSrc: '/assets/docs-icon.png',
            size: '34KB',
            status: 'success',
            owner: 'Zoey Edwards',
            updateTime: '2020-01-26 11:01',
            avatarBg: 'light-blue',
        },
    ];

    const rowSelection: RowSelectionProps<Row> = {
        getCheckboxProps: (record) => ({
            disabled: record.name === '设计文档', // 这一行不可勾选
            name: record.name,
        }),
        onSelect: (record, selected) => {
            console.log(`select row: ${selected}`, record);
        },
        onSelectAll: (selected, selectedRows) => {
            console.log(`select all rows: ${selected}`, selectedRows);
        },
        onChange: (selectedRowKeys, selectedRows) => {
            console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
        },
    };

    const pagination = { pageSize: 3 };
</script>

<template>
    <Table :columns="columns" :dataSource="data" :pagination="pagination" :rowSelection="rowSelection">
        <template #cell="{ column, record, text }">
            <div v-if="column.dataIndex === 'name'">
                <Avatar alt="" shape="square" size="small" :src="record.nameIconSrc" :style="{ marginRight: '12px' }" />
                {{ text }}
            </div>
            <template v-else-if="column.dataIndex === 'size'">{{ text }}</template>
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
            <template v-else-if="column.dataIndex === 'updateTime'">{{ text }}</template>
            <IconMore v-else-if="column.dataIndex === 'operate'" />
        </template>
    </Table>
</template>
