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

    const getData = () => {
        const data: Row[] = [];
        for (let i = 0; i < 46; i++) {
            const isSemiDesign = i % 2 === 0;
            const randomNumber = ((i * 1000) % 19) + 100;
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

    const data = getData();
    const scroll = { y: 480 };
    const rowKey = (record: Row) => `${record.owner.toLowerCase()}-${record.name.toLowerCase()}`;
    const onGroupedRow = (group: { groupKey: string | number; records: Row[] }, index: number) => ({
        onClick: () => {
            console.log(`Grouped row clicked: `, group, index);
        },
    });
</script>

<template>
    <div :style="{ padding: '20px 0px' }">
        <!-- clickGroupedRowToExpand: a click anywhere on the group row expands it -->
        <Table clickGroupedRowToExpand :columns="columns" :dataSource="data" groupBy="size" :onGroupedRow="onGroupedRow" :rowKey="rowKey" :scroll="scroll">
            <template #groupSection="groupProps">
                <strong>根据文件大小分组 {{ groupProps.groupKey }} KB</strong>
            </template>
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
    </div>
</template>
