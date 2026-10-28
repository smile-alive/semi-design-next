<script setup lang="ts">
    import * as dateFns from 'date-fns';
    import { IconMore } from '@fibrae/semi-icons-vue';
    import { Avatar, Table, TableColumn as Column } from '@fibrae/semi-ui-vue';

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
    const nameFilters = [
        {
            text: 'Semi Design 设计稿',
            value: 'Semi Design 设计稿',
        },
        {
            text: 'Semi D2C 设计稿',
            value: 'Semi D2C 设计稿',
        },
    ];
    const filterName = (value: string, record: Row) => record.name.includes(value);
    const sortSize = (a: Row, b: Row) => (a.size - b.size > 0 ? 1 : -1);
    const sortUpdateTime = (a: Row, b: Row) => (a.updateTime - b.updateTime > 0 ? 1 : -1);
    const onChange = (changeInfo: unknown) => console.log(changeInfo);
</script>

<template>
    <Table :dataSource="data" :rowSelection="rowSelection" :scroll="scroll" @change="onChange">
        <Column fixed="left" title="基本信息">
            <Column dataIndex="name" :filters="nameFilters" fixed :onFilter="filterName" title="标题" :width="300">
                <template #cell="{ text }">
                    <span>
                        <Avatar alt="" shape="square" size="small" :src="figmaIconUrl" :style="{ marginRight: '12px' }" />
                        {{ text }}
                    </span>
                </template>
            </Column>
            <Column dataIndex="size" fixed :sorter="sortSize" title="大小" :width="100">
                <template #cell="{ text }">{{ text }} KB</template>
            </Column>
        </Column>
        <Column title="其他信息">
            <Column dataIndex="owner" title="所有者">
                <template #cell="{ text, record }">
                    <div>
                        <Avatar :color="record.avatarBg" size="small" :style="{ marginRight: '4px' }">
                            {{ typeof text === 'string' && text.slice(0, 1) }}
                        </Avatar>
                        {{ text }}
                    </div>
                </template>
            </Column>
            <Column dataIndex="updateTime" :sorter="sortUpdateTime" title="更新日期">
                <template #cell="{ text }">{{ dateFns.format(new Date(text), 'yyyy-MM-dd') }}</template>
            </Column>
        </Column>
        <Column align="center" dataIndex="operate" fixed="right" title="更多" :width="100">
            <template #cell>
                <IconMore />
            </template>
        </Column>
        <template #expandedRow="{ record }">
            <article>{{ record.name }}</article>
        </template>
    </Table>
</template>
