<script setup lang="ts">
    import * as dateFns from 'date-fns';
    import { Avatar, Table, type ColumnProps } from '@fibrae/semi-ui-vue';

    interface Row {
        key: string;
        name: string;
        nameIconSrc: string;
        size?: number;
        owner: string;
        updateTime: string;
        avatarBg: 'grey' | 'red' | 'light-blue';
    }

    const figmaIconUrl = '/assets/placeholder/app.svg';
    const docIconUrl = '/assets/docs-icon.png';

    const columns: ColumnProps<Row>[] = [
        {
            title: '标题',
            dataIndex: 'name',
            width: 400,
        },
        {
            title: '大小',
            dataIndex: 'size',
            sorter: (r1, r2, order) => {
                const a = r1.size;
                const b = r2.size;
                if (typeof a === 'number' && typeof b === 'number') {
                    return a - b; // 数字正常比较大小
                } else if (typeof a === 'undefined') {
                    return order === 'ascend' ? 1 : -1; // undefined 在后面
                } else if (typeof b === 'undefined') {
                    return order === 'ascend' ? -1 : 1; // undefined 在后面
                } else {
                    return 0; // 保持原来的顺序
                }
            },
            showSortTip: true,
        },
        {
            title: '所有者',
            dataIndex: 'owner',
        },
        {
            title: '更新日期',
            dataIndex: 'updateTime',
        },
    ];

    const dataSource: Row[] = [
        {
            key: '1',
            name: 'Semi Design 设计稿.fig',
            nameIconSrc: figmaIconUrl,
            size: 3,
            owner: '姜鹏志',
            updateTime: '2020-02-02 05:13',
            avatarBg: 'grey',
        },
        {
            key: '2',
            name: 'Semi Design 分享演示文稿',
            nameIconSrc: docIconUrl,
            size: undefined,
            owner: '郝宣',
            updateTime: '2020-01-17 05:31',
            avatarBg: 'red',
        },
        {
            key: '3',
            name: '设计文档 3',
            nameIconSrc: docIconUrl,
            size: 1,
            owner: 'Zoey Edwards',
            updateTime: '2020-01-26 11:01',
            avatarBg: 'light-blue',
        },
        {
            key: '4',
            name: '设计文档 4',
            nameIconSrc: docIconUrl,
            size: 5,
            owner: 'Zoey Edwards',
            updateTime: '2020-01-26 11:01',
            avatarBg: 'light-blue',
        },
        {
            key: '5',
            name: '设计文档 5',
            nameIconSrc: docIconUrl,
            size: undefined,
            owner: 'Zoey Edwards',
            updateTime: '2020-01-26 11:01',
            avatarBg: 'light-blue',
        },
        {
            key: '6',
            name: '设计文档 6',
            nameIconSrc: docIconUrl,
            size: 2,
            owner: 'Zoey Edwards',
            updateTime: '2020-01-26 11:01',
            avatarBg: 'light-blue',
        },
    ];
</script>

<template>
    <Table :columns="columns" :dataSource="dataSource">
        <template #cell="{ column, record, text }">
            <div v-if="column.dataIndex === 'name'">
                <Avatar alt="" shape="square" size="small" :src="figmaIconUrl" :style="{ marginRight: '12px' }" />
                {{ text }}
            </div>
            <template v-else-if="column.dataIndex === 'size'">{{ text ? `${text} KB` : '未知' }}</template>
            <div v-else-if="column.dataIndex === 'owner'">
                <Avatar :color="record.avatarBg" size="small" :style="{ marginRight: '4px' }">
                    {{ typeof text === 'string' && text.slice(0, 1) }}
                </Avatar>
                {{ text }}
            </div>
            <template v-else-if="column.dataIndex === 'updateTime'">
                {{ dateFns.format(new Date(text), 'yyyy-MM-dd') }}
            </template>
        </template>
    </Table>
</template>
