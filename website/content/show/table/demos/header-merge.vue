<script setup lang="ts">
    import * as dateFns from 'date-fns';
    import { IconMore } from '@fibrae/semi-icons-vue';
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
            title: '基本信息',
            fixed: 'left',
            children: [
                {
                    title: '标题',
                    dataIndex: 'name',
                    width: 300,
                    fixed: true,
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
                    width: 100,
                    fixed: true,
                    sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
                },
            ],
        },
        {
            title: '其他信息',
            children: [
                {
                    title: '所有者',
                    dataIndex: 'owner',
                },
                {
                    title: '更新日期',
                    dataIndex: 'updateTime',
                    sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
                },
            ],
        },
        {
            title: '更多',
            fixed: 'right',
            width: 100,
            align: 'center',
            dataIndex: 'operate',
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

    const data = getData(46);
    const rowSelection = { fixed: true };
    const scroll = { x: 1000, y: 400 };
    const onChange = (changeInfo: unknown) => console.log(changeInfo);
</script>

<template>
    <Table :columns="columns" :dataSource="data" :rowSelection="rowSelection" :scroll="scroll" @change="onChange">
        <template #cell="{ column, text, record }">
            <span v-if="column.dataIndex === 'name'">
                <Avatar alt="" shape="square" size="small" :src="figmaIconUrl" :style="{ marginRight: '12px' }" />
                {{ text }}
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
            <IconMore v-else-if="column.dataIndex === 'operate'" />
        </template>
        <template #expandedRow="{ record }">
            <article>{{ record.name }}</article>
        </template>
    </Table>
</template>
