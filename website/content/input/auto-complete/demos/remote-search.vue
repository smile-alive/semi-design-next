<script setup lang="ts">
    import { ref } from 'vue';
    import { debounce } from 'es-toolkit';
    import { IconSearch } from '@fibrae/semi-icons-vue';
    import { IconButton, IconForm, IconInput, IconSelect, IconTable } from '@fibrae/semi-icons-vue/lab';
    import { AutoComplete, type AutoCompleteDataItem } from '@fibrae/semi-ui-vue';

    interface ListItem {
        value: 'select' | 'input' | 'form' | 'button' | 'table';
        label: string;
    }

    const icons = {
        select: IconSelect,
        input: IconInput,
        form: IconForm,
        button: IconButton,
        table: IconTable,
    };

    const initList: ListItem[] = [
        { value: 'select', label: '选择器' },
        { value: 'input', label: '输入框' },
        { value: 'form', label: '表单' },
        { value: 'button', label: '按钮' },
        { value: 'table', label: '表格' },
    ];

    const loading = ref(false);
    const list = ref(initList);

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
        <template #item="{ item }">
            <div style="display: flex; align-items: center">
                <div style="font-size: 32px">
                    <component :is="icons[item.value]" />
                </div>
                <div style="margin-left: 12px">
                    <p>{{ item.value }}</p>
                    <p>{{ item.label }}</p>
                </div>
            </div>
        </template>
    </AutoComplete>
</template>
