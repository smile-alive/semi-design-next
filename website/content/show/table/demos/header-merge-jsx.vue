<script setup lang="ts">
    import * as dateFns from 'date-fns';
    import { IconMore } from '@fibrae/semi-icons-vue';
    import { Avatar, Table } from '@fibrae/semi-ui-vue';

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

    const getData = (total: number) => {
        const data: Row[] = [];
        for (let i = 0; i < total; i++) {
            const isSemiDesign = i % 2 === 0;
            const randomNumber = (i * 1000) % 199;
            data.push({
                key: '' + i,
                name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi 设计稿${i}.fig`,
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
    const nameFilters = [
        {
            text: 'Semi Design 设计稿',
            value: 'Semi Design 设计稿',
        },
        {
            text: 'Semi 设计稿',
            value: 'Semi 设计稿',
        },
    ];
    const onChange = (changeInfo: unknown) => console.log(changeInfo);
</script>

<template>
    <Table :dataSource="data" :rowSelection="rowSelection" :scroll="scroll" @change="onChange">
        <Table.Column fixed="left" title="基本信息">
            <Table.Column dataIndex="name" :filters="nameFilters" fixed :onFilter="(value: string, record: Row) => record.name.includes(value)" title="标题" :width="300">
                <template #cell="cellProps">
                    <span>
                        <Avatar alt="" shape="square" size="small" :src="figmaIconUrl" :style="{ marginInlineEnd: '12px' }" />
                        {{ cellProps.text }}
                    </span>
                </template>
            </Table.Column>
            <Table.Column dataIndex="size" fixed :sorter="(a: Row, b: Row) => (a.size - b.size > 0 ? 1 : -1)" title="大小" :width="100">
                <template #cell="cellProps">{{ cellProps.text }} KB</template>
            </Table.Column>
        </Table.Column>
        <Table.Column title="其他信息">
            <Table.Column dataIndex="owner" title="所有者">
                <template #cell="cellProps">
                    <div>
                        <Avatar :color="cellProps.record.avatarBg" size="small" :style="{ marginInlineEnd: '4px' }">
                            {{ typeof cellProps.text === 'string' && cellProps.text.slice(0, 1) }}
                        </Avatar>
                        {{ cellProps.text }}
                    </div>
                </template>
            </Table.Column>
            <Table.Column dataIndex="updateTime" :sorter="(a: Row, b: Row) => (a.updateTime - b.updateTime > 0 ? 1 : -1)" title="更新日期">
                <template #cell="cellProps">{{ dateFns.format(new Date(cellProps.text), 'yyyy-MM-dd') }}</template>
            </Table.Column>
        </Table.Column>
        <Table.Column align="center" dataIndex="operate" fixed="right" title="更多" :width="100">
            <template #cell>
                <IconMore />
            </template>
        </Table.Column>
        <template #expandedRow="expandedProps">
            <article>{{ expandedProps.record.name }}</article>
        </template>
    </Table>
</template>
