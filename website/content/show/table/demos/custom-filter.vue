<script setup lang="ts">
    import { nextTick, useTemplateRef } from 'vue';
    import * as dateFns from 'date-fns';
    import { Avatar, Button, Input, Space, Table, type ColumnProps, type InputHandle } from '@fibrae/semi-ui-vue';

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

    const getData = () => {
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
        return data;
    };

    const dataSource = getData();
    const nameInput = useTemplateRef<InputHandle>('nameInput');

    const columns: ColumnProps<Row>[] = [
        {
            title: '标题',
            dataIndex: 'name',
            width: 400,
            onFilter: (value, record) => record.name.includes(value),
            filterDropdown: true,
            onFilterDropdownVisibleChange: () => {
                // the panel is rendered after the visibility changes
                void nextTick(() => nameInput.value?.focus());
            },
        },
        {
            title: '大小',
            dataIndex: 'size',
            sorter: (a, b) => (a.size - b.size > 0 ? 1 : -1),
        },
        {
            title: '所有者',
            dataIndex: 'owner',
            onFilter: (value, record) => record.owner.includes(value),
            defaultFilteredValue: ['姜鹏志'],
            filterDropdown: true,
        },
        {
            title: '更新日期',
            dataIndex: 'updateTime',
            sorter: (a, b) => (a.updateTime - b.updateTime > 0 ? 1 : -1),
        },
    ];
</script>

<template>
    <Table :columns="columns" :dataSource="dataSource">
        <template #filterDropdown="{ column, tempFilteredValue, onTempFilteredValueChange, onConfirm, onClear, onClose }">
            <Space v-if="column.dataIndex === 'name'" align="start" :style="{ padding: '8px' }" vertical>
                <Input ref="nameInput" :modelValue="tempFilteredValue?.[0]" @update:modelValue="onTempFilteredValueChange($event ? [$event] : [])" />
                <Space>
                    <Button @click="onConfirm({ closeDropdown: true })">筛选 + 关闭</Button>
                    <Button @click="onClear({ closeDropdown: true })">清除 + 关闭</Button>
                    <Button @click="onClose()">直接关闭</Button>
                </Space>
            </Space>
            <Space v-else align="start" :style="{ padding: '8px' }" vertical>
                <Input :modelValue="tempFilteredValue?.[0]" @update:modelValue="onTempFilteredValueChange($event ? [$event] : [])" />
                <Space>
                    <Button @click="onConfirm({ closeDropdown: false })">筛选后不关闭</Button>
                    <Button @click="onClear({ closeDropdown: false })">清除后不关闭</Button>
                    <Button @click="onClose()">直接关闭</Button>
                </Space>
            </Space>
        </template>
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
</template>
