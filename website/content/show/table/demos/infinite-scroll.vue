<script setup lang="ts">
    import { shallowRef } from 'vue';
    import * as dateFns from 'date-fns';
    import { Avatar, Table, type ColumnProps, type TableVirtualizedProps } from '@fibrae/semi-ui-vue';

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
            width: 200,
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
            width: 150,
            sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
        },
        {
            title: '所有者',
            dataIndex: 'owner',
        },
        {
            title: '更新日期',
            dataIndex: 'updateTime',
            fixed: 'right',
            width: 150,
            sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
        },
    ];

    const pageSize = 20; // 每次加载 20 条

    const getPage = (start: number) => {
        const page: Row[] = [];
        for (let i = start; i < start + pageSize; i++) {
            const isSemiDesign = i % 2 === 0;
            const randomNumber = (i * 1000) % 199;
            page.push({
                key: '' + i,
                name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi D2C 设计稿${i}.fig`,
                owner: isSemiDesign ? '姜鹏志' : '郝宣',
                size: randomNumber,
                updateTime: new Date(2024, 4, 6, 12).valueOf() + randomNumber * DAY,
                avatarBg: isSemiDesign ? 'grey' : 'red',
            });
        }
        return page;
    };

    const data = shallowRef(getPage(0));

    const scroll = { y: 600, x: 1000 };
    const style = { width: '750px', margin: '0 auto' };
    const itemSize = 56;
    const virtualized: TableVirtualizedProps = { itemSize };

    const loadMore = () => {
        data.value = [...data.value, ...getPage(data.value.length)];
    };

    const onScroll = ({ scrollDirection, scrollOffset, scrollUpdateWasRequested }: { scrollDirection: 'forward' | 'backward'; scrollOffset: number; scrollUpdateWasRequested: boolean }) => {
        if (scrollDirection === 'forward' && scrollOffset >= (data.value.length - Math.ceil(scroll.y / itemSize) * 1.5) * itemSize && !scrollUpdateWasRequested) {
            loadMore();
        }
    };
</script>

<template>
    <Table :columns="columns" :dataSource="data" :pagination="false" :scroll="scroll" :style="style" :virtualized="virtualized" @scroll="onScroll">
        <template #cell="{ column, text, record }">
            <div v-if="column.dataIndex === 'name'">{{ text }}</div>
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
</template>
