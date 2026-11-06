<script setup lang="ts">
    import * as dateFns from 'date-fns';
    import { Avatar, Table, type ColumnProps } from '@fibrae/semi-ui-vue';

    const figmaIconUrl = '/assets/placeholder/app.svg';
    const DAY = 24 * 60 * 60 * 1000;

    interface Row {
        key: string;
        name: string;
        owner: string;
        size: number;
        updateTime: number;
        avatarBg: 'grey' | 'red';
    }

    const columns: ColumnProps<Row>[] = [
        {
            title: '标题',
            dataIndex: 'name',
            width: 400,
            onCell: (_record, index) => {
                if (index === 0) {
                    return { colSpan: 4 };
                }
                if (index === 1) {
                    return { rowSpan: 2 };
                }
                if (index === 2) {
                    return { rowSpan: 0 };
                }
                return {};
            },
        },
        {
            title: '大小',
            dataIndex: 'size',
            onCell: (_record, index) => {
                if (index === 0) {
                    return { colSpan: 0 };
                }
                if (index === 1) {
                    return { rowSpan: 2 };
                }
                if (index === 2) {
                    return { rowSpan: 0 };
                }
                return {};
            },
        },
        {
            title: '所有者',
            dataIndex: 'owner',
            onCell: (_record, index) => (index === 0 ? { colSpan: 0 } : {}),
        },
        {
            title: '更新日期',
            dataIndex: 'updateTime',
            sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
            onCell: (_record, index) => {
                if (index === 0) {
                    return { colSpan: 0 };
                }
                if (index === 1) {
                    return { rowSpan: 2 };
                }
                if (index === 2) {
                    return { rowSpan: 0 };
                }
                return {};
            },
        },
    ];

    const dataSource: Row[] = [];
    for (let i = 0; i < 5; i++) {
        const isSemiDesign = i % 2 === 0;
        const randomNumber = (i * 1000) % 199;
        dataSource.push({
            key: '' + i,
            name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
            owner: isSemiDesign ? '姜鹏志' : '郝宣',
            size: randomNumber,
            updateTime: new Date(2024, 4, 6, 12).valueOf() + randomNumber * DAY,
            avatarBg: isSemiDesign ? 'grey' : 'red',
        });
    }
</script>

<template>
    <Table :columns="columns" :dataSource="dataSource" :pagination="false">
        <template #cell="cellProps">
            <div v-if="cellProps.column.dataIndex === 'name'">
                <Avatar alt="" shape="square" size="small" :src="figmaIconUrl" :style="{ marginInlineEnd: '12px' }" />
                {{ cellProps.text }}
            </div>
            <template v-else-if="cellProps.column.dataIndex === 'size'">{{ cellProps.text }} KB</template>
            <div v-else-if="cellProps.column.dataIndex === 'owner'">
                <Avatar :color="cellProps.record.avatarBg" size="small" :style="{ marginInlineEnd: '4px' }">
                    {{ typeof cellProps.text === 'string' && cellProps.text.slice(0, 1) }}
                </Avatar>
                {{ cellProps.text }}
            </div>
            <template v-else-if="cellProps.column.dataIndex === 'updateTime'">
                {{ dateFns.format(new Date(cellProps.text), 'yyyy-MM-dd') }}
            </template>
        </template>
    </Table>
</template>
