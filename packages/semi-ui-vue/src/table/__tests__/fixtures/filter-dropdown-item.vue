<script setup lang="ts">
    import Table, { type ColumnProps, type TableChangeInfo } from '../..';
    import { DropdownItem } from '../../../dropdown';

    defineProps<{ onChange?: (info: TableChangeInfo) => void }>();
    const dataSource = [
        { key: '1', name: 'b' },
        { key: '2', name: 'a' },
        { key: '3', name: 'c' },
    ];
    const columns: ColumnProps[] = [
        {
            title: 'Name',
            dataIndex: 'name',
            filters: [
                { text: 'a', value: 'a' },
                { text: 'b', value: 'b' },
            ],
            onFilter: (value, record) => record.name === value,
        },
    ];
</script>

<template>
    <Table :columns="columns" :dataSource="dataSource" :pagination="false" @change="onChange?.($event)">
        <template #filterDropdownItem="{ text, value, checked, filteredValue, filterMultiple, level, onChange: toggle }">
            <DropdownItem @click="toggle">
                <span>
                    {{ text }}: {{ checked ? 'on' : 'off' }}, level {{ level }},
                    {{ filterMultiple ? 'multiple' : 'single' }}
                </span>
                <span v-if="value === 'a'" data-testid="filtered">{{ filteredValue.join(',') }}</span>
            </DropdownItem>
        </template>
    </Table>
</template>
