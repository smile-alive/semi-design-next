<script setup lang="ts">
    import { normalizeClass } from 'vue';
    import * as dateFns from 'date-fns';
    import { addClass, removeClass } from '@fibrae/semi-foundation/utils/classnames';
    import { Avatar, Table, type ColumnProps, type TableResizableProps } from '@fibrae/semi-ui-vue';

    const DAY = 24 * 60 * 60 * 1000;
    const figmaIconUrl = '/assets/placeholder/app.svg';
    const pagination = { pageSize: 5 };

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
            width: 200,
            sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
        },
        {
            title: '所有者',
            width: 200,
            dataIndex: 'owner',
        },
        {
            title: '更新日期',
            dataIndex: 'updateTime',
            sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
        },
    ];

    const data: Row[] = [];
    for (let i = 0; i < 46; i++) {
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

    const resizable: TableResizableProps<Row> = {
        onResizeStart: (curColumn) => ({ class: addClass(normalizeClass(curColumn.class), 'my-resizing') }),
        onResizeStop: (curColumn) => ({ class: removeClass(normalizeClass(curColumn.class), 'my-resizing') }),
    };
</script>

<template>
    <div id="components-table-demo-resizable-column">
        <Table bordered :columns="columns" :dataSource="data" :pagination="pagination" :resizable="resizable">
            <template #cell="{ column, record, text }">
                <div v-if="column.dataIndex === 'name'">
                    <Avatar alt="" shape="square" size="small" :src="figmaIconUrl" :style="{ marginRight: '12px' }" />
                    {{ text }}
                </div>
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
        </Table>
    </div>
</template>
