<script setup lang="ts">
    import { computed, ref } from 'vue';
    import * as dateFns from 'date-fns';
    import { IconClear, IconComment, IconTickCircle } from '@fibrae/semi-icons-vue';
    import { Avatar, Input, Space, Table, Tag, type ColumnProps } from '@fibrae/semi-ui-vue';

    const DAY = 24 * 60 * 60 * 1000;
    const figmaIconUrl = '/assets/placeholder/app.svg';

    interface Row {
        key: string;
        name: string;
        owner: string;
        size: number;
        status: 'success' | 'wait';
        updateTime: number;
        avatarBg: 'grey' | 'red';
    }

    const tagConfig = {
        success: { color: 'green', icon: IconTickCircle, text: '已交付' },
        pending: { color: 'pink', icon: IconClear, text: '已延期' },
        wait: { color: 'cyan', icon: IconComment, text: '待评审' },
    } as const;

    const getData = () => {
        const data: Row[] = [];
        for (let i = 0; i < 46; i++) {
            const isSemiDesign = i % 2 === 0;
            const randomNumber = (i * 1000) % 199;
            data.push({
                key: '' + i,
                name: isSemiDesign ? `Semi Design 设计稿${i}.fig` : `Semi D2C 首页${i}.fig`,
                owner: isSemiDesign ? '姜鹏志' : '郝宣',
                size: randomNumber,
                status: isSemiDesign ? 'success' : 'wait',
                updateTime: new Date('2024-01-25').valueOf() + randomNumber * DAY,
                avatarBg: isSemiDesign ? 'grey' : 'red',
            });
        }
        return data;
    };

    const dataSource = getData();
    const filteredValue = ref<string[]>([]);

    // composition makes the Input report the value once an IME composition ends
    const handleChange = (value: string) => {
        filteredValue.value = value ? [value] : [];
    };

    const columns = computed((): ColumnProps<Row>[] => [
        {
            title: '标题',
            dataIndex: 'name',
            width: 400,
            onFilter: (value, record) => record.name.includes(value),
            filteredValue: filteredValue.value,
        },
        {
            title: '大小',
            dataIndex: 'size',
            sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
        },
        {
            title: '交付状态',
            dataIndex: 'status',
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
    ]);
</script>

<template>
    <Table :columns="columns" :dataSource="dataSource">
        <template #headerCell="{ column, title }">
            <Space v-if="column.dataIndex === 'name'">
                <span>{{ title }}</span>
                <Input composition placeholder="请输入筛选值" showClear :style="{ width: '200px' }" @change="handleChange" />
            </Space>
        </template>
        <template #cell="{ column, record, text }">
            <div v-if="column.dataIndex === 'name'">
                <Avatar alt="" shape="square" size="small" :src="figmaIconUrl" :style="{ marginRight: '12px' }" />
                {{ text }}
            </div>
            <template v-else-if="column.dataIndex === 'size'">{{ text }} KB</template>
            <Tag v-else-if="column.dataIndex === 'status'" :color="tagConfig[text as Row['status']].color" shape="circle" :style="{ userSelect: 'text' }">
                <template #prefixIcon>
                    <component :is="tagConfig[text as Row['status']].icon" />
                </template>
                {{ tagConfig[text as Row['status']].text }}
            </Tag>
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
