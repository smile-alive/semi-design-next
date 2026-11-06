<script setup lang="ts">
    import { shallowRef } from 'vue';
    import { debounce } from 'es-toolkit';
    import { IconSearch } from '@fibrae/semi-icons-vue';
    import { IconButton, IconForm, IconInput, IconSelect, IconTable } from '@fibrae/semi-icons-vue/lab';
    import { AutoComplete, type AutoCompleteDataItem } from '@fibrae/semi-ui-vue';

    const initList = [
        { value: 'select', label: '选择器', icon: IconSelect },
        { value: 'input', label: '输入框', icon: IconInput },
        { value: 'form', label: '表单', icon: IconForm },
        { value: 'button', label: '按钮', icon: IconButton },
        { value: 'table', label: '表格', icon: IconTable },
    ];

    type ListItem = (typeof initList)[number];

    const loading = shallowRef(false);
    const list = shallowRef<ListItem[]>(initList);

    const handleSearch = (inputValue: string) => {
        loading.value = true;
        const newList = inputValue ? initList.filter((item) => item.value.includes(inputValue)) : initList;
        setTimeout(() => {
            list.value = newList;
            loading.value = false;
        }, 1000);
    };

    const search = debounce(handleSearch, 200);

    const handleSelect = (value: string | number | AutoCompleteDataItem) => {
        console.log(value);
    };

    // Unlike Select, this can return only a string, not a node
    const renderSelectedItem = (item: ListItem) => item.value;
</script>

<template>
    <AutoComplete aria-label="搜索" :data="list" :loading="loading" :renderSelectedItem="renderSelectedItem" style="width: 250px" @search="search" @select="handleSelect">
        <template #prefix>
            <IconSearch />
        </template>
        <template #item="entry">
            <div style="display: flex; align-items: center">
                <div style="font-size: 32px">
                    <component :is="entry.item.icon" />
                </div>
                <div style="margin-inline-start: 12px">
                    <p>{{ entry.item.value }}</p>
                    <p>{{ entry.item.label }}</p>
                </div>
            </div>
        </template>
    </AutoComplete>
</template>
