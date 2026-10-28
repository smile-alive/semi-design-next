<script setup lang="ts">
    import * as dateFns from 'date-fns';
    import { Avatar, Table, type ColumnProps, type RowSelectionProps } from '@fibrae/semi-ui-vue';

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
            title: 'Name',
            dataIndex: 'name',
            width: 400,
            filters: [
                {
                    text: 'Semi Design 设计稿',
                    value: 'Semi Design 设计稿',
                },
                {
                    text: 'Semi D2C 设计稿',
                    value: 'Semi D2C 设计稿',
                },
            ],
            onFilter: (value, record) => record.name.includes(value),
            useFullRender: true,
        },
        {
            title: '大小',
            dataIndex: 'size',
            sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
        },
        {
            title: '所有者',
            dataIndex: 'owner',
        },
        {
            title: '更新日期',
            dataIndex: 'updateTime',
            sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
        },
    ];

    const getData = (total: number) => {
        const data: Row[] = [];
        for (let i = 0; i < total; i++) {
            const isSemiDesign = i % 2 === 0;
            const randomNumber = (i * 1000) % 199;
            data.push({
                key: '' + i,
                name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
                owner: isSemiDesign ? '姜鹏志' : '郝宣',
                size: randomNumber,
                updateTime: new Date(2024, 4, 6, 12).valueOf() + randomNumber * DAY,
                avatarBg: isSemiDesign ? 'grey' : 'red',
            });
        }
        return data;
    };

    const dataSource = getData(46);
    const pagination = { pageSize: 12 };
    const rowSelection: RowSelectionProps<Row> = {
        hidden: true,
        fixed: 'left',
    };
    const onChange = (changeInfo: unknown) => console.log(changeInfo);
</script>

<template>
    <Table :columns="columns" :dataSource="dataSource" :pagination="pagination" :rowSelection="rowSelection" @change="onChange">
        <template #headerCell="{ column, title, sorter, filter, selection }">
            <span v-if="column.dataIndex === 'name'" :style="{ display: 'inline-flex', alignItems: 'center', paddingLeft: '20px' }">
                <component :is="selection" />
                <span :style="{ marginLeft: '8px' }">{{ title }}</span>
                <component :is="sorter" />
                <component :is="filter" />
            </span>
        </template>
        <template #cell="{ column, text, record, expandIcon, selection, indentText }">
            <span v-if="column.dataIndex === 'name'" :style="{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }">
                <component :is="indentText" />
                <component :is="expandIcon" />
                <component :is="selection" />
                <span :style="{ marginLeft: '8px' }">
                    <Avatar alt="" shape="square" size="small" :src="figmaIconUrl" :style="{ marginRight: '12px' }" />
                    {{ text }}
                </span>
            </span>
            <template v-else-if="column.dataIndex === 'size'">{{ text }} KB</template>
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
        <template #expandedRow="{ record }">
            <article>{{ record.name }}</article>
        </template>
    </Table>
</template>
