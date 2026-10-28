<script setup lang="ts">
    import * as dateFns from 'date-fns';
    import { Avatar, Table, type ColumnProps } from '@fibrae/semi-ui-vue';

    const DAY = 24 * 60 * 60 * 1000;
    const figmaIconUrl = '/assets/placeholder/app.svg';

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
            width: 300,
            filters: [
                {
                    text: 'Semi Design 设计稿',
                    value: 'Semi Design',
                },
                {
                    text: 'Semi Pro 设计稿',
                    value: 'Semi Pro',
                },
            ],
            onFilter: (value, record) => record.name.includes(value),
            filterMultiple: true,
            filterConfirmMode: 'confirm',
        },
        {
            title: '大小',
            dataIndex: 'size',
            sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
        },
        {
            title: '所有者',
            dataIndex: 'owner',
            filters: [
                {
                    text: '姜鹏志',
                    value: '姜鹏志',
                },
                {
                    text: '郝宣',
                    value: '郝宣',
                },
            ],
            onFilter: (value, record) => record.owner.includes(value),
            filterMultiple: true,
            filterConfirmMode: 'confirm',
        },
        {
            title: '更新日期',
            dataIndex: 'updateTime',
            sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
        },
    ];

    const getData = () => {
        const data: Row[] = [];
        for (let i = 0; i < 20; i++) {
            const isSemiDesign = i % 2 === 0;
            const randomNumber = (i * 1000) % 199;
            data.push({
                key: '' + i,
                name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi Pro 首页${i}.fig`,
                owner: isSemiDesign ? '姜鹏志' : '郝宣',
                size: randomNumber,
                updateTime: new Date('2024-01-25').valueOf() + randomNumber * DAY,
                avatarBg: isSemiDesign ? 'grey' : 'red',
            });
        }
        return data;
    };

    const dataSource = getData();
</script>

<template>
    <Table :columns="columns" :dataSource="dataSource">
        <template #cell="{ column, text, record }">
            <div v-if="column.dataIndex === 'name'">
                <Avatar alt="" shape="square" size="small" :src="figmaIconUrl" :style="{ marginRight: '12px' }" />
                {{ text }}
            </div>
            <template v-else-if="column.dataIndex === 'size'">{{ text }} KB</template>
            <div v-else-if="column.dataIndex === 'owner'">
                <Avatar :color="record.avatarBg" size="small" :style="{ marginRight: '4px' }">
                    {{ text.slice(0, 1) }}
                </Avatar>
                {{ text }}
            </div>
            <template v-else-if="column.dataIndex === 'updateTime'">
                {{ dateFns.format(new Date(text), 'yyyy-MM-dd') }}
            </template>
        </template>
    </Table>
</template>
