<script setup lang="ts">
    import { ref } from 'vue';
    import { IconSearch } from '@fibrae/semi-icons-vue';
    import { AutoComplete, Avatar } from '@fibrae/semi-ui-vue';

    interface ListItem {
        name: string;
        email: string;
        abbr: string;
        color: 'amber' | 'indigo' | 'blue' | 'cyan';
        value?: string;
        label?: string;
    }

    const list: ListItem[] = [
        { name: '夏可漫', email: 'xiakeman@example.com', abbr: 'XK', color: 'amber' },
        { name: '申悦', email: 'shenyue@example.com', abbr: 'SY', color: 'indigo' },
        { name: '曲晨一', email: 'quchenyi@example.com', abbr: 'CY', color: 'blue' },
        { name: '文嘉茂', email: 'wenjiamao@example.com', abbr: 'JM', color: 'cyan' },
    ];

    const data = ref<ListItem[]>([]);

    const handleStringSearch = (value: string) => {
        data.value = value ? list.map((item) => ({ ...item, value: item.name, label: item.email })) : [];
    };

    const renderSelectedItem = (option: ListItem) => option.email;
</script>

<template>
    <AutoComplete aria-label="搜索邮箱" :data="data" :renderSelectedItem="renderSelectedItem" showClear style="width: 280px" @search="handleStringSearch">
        <template #prefix>
            <IconSearch />
        </template>
        <template #item="{ item }">
            <Avatar :color="item.color" size="small">{{ item.abbr }}</Avatar>
            <div style="margin-left: 4px">
                <div style="font-size: 14px; margin-left: 4px">{{ item.name }}</div>
                <div style="margin-left: 4px">{{ item.email }}</div>
            </div>
        </template>
    </AutoComplete>
</template>
