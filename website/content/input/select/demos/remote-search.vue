<script setup lang="ts">
    import { ref } from 'vue';
    import { debounce } from 'es-toolkit';
    import { Select } from '@fibrae/semi-ui-vue';

    interface Item {
        value: string;
        label: string;
        type: number;
    }

    const mockSearch = (inputValue: string): Item[] => {
        const length = Math.ceil(Math.random() * 100);
        return Array.from({ length }, (_v, i) => {
            return { value: inputValue + i, label: `相近业务 ${inputValue}${i}`, type: i + 1 };
        });
    };

    const loading = ref(false);
    const list = ref<Item[]>([
        { value: 'video', label: '短视频', type: 1 },
        { value: 'retouch', label: '修图', type: 2 },
        { value: 'editing', label: '剪辑', type: 3 },
        { value: 'news', label: '资讯', type: 4 },
    ]);
    const value = ref<Item[]>([]);

    const handleSearch = debounce((inputValue: string) => {
        loading.value = true;
        if (inputValue) {
            const result = mockSearch(inputValue);
            setTimeout(() => {
                loading.value = false;
                list.value = result;
            }, 1000);
        } else {
            loading.value = false;
        }
    }, 1000);
</script>

<template>
    <Select v-model="value" aria-label="远程搜索" changeWithObject filter :loading="loading" multiple :optionList="list" remote style="width: 300px" @search="handleSearch">
        <template #emptyContent />
    </Select>
</template>
