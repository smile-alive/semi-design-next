<script setup lang="ts">
    import { ref } from 'vue';
    import { debounce } from 'es-toolkit';
    import { Cascader, Spin, type CascaderData } from '@fibrae/semi-ui-vue';

    const fetchByKeyword = (keyword: string) =>
        new Promise<CascaderData[]>((resolve) => {
            const delay = 200 + Math.floor(Math.random() * 800);
            setTimeout(() => {
                if (!keyword) {
                    resolve([]);
                    return;
                }
                resolve([
                    { label: `${keyword} - 选项 A`, value: `${keyword}-a` },
                    { label: `${keyword} - 选项 B`, value: `${keyword}-b` },
                    { label: `${keyword} - 选项 C`, value: `${keyword}-c` },
                ]);
            }, delay);
        });

    const treeData = ref<CascaderData[]>([]);
    const loading = ref(false);

    let latestToken = 0;
    const handleSearch = debounce((input: string) => {
        if (!input) {
            treeData.value = [];
            loading.value = false;
            return;
        }
        latestToken += 1;
        const token = latestToken;
        loading.value = true;
        void fetchByKeyword(input).then((next) => {
            // Drop stale results that arrive after a newer request
            if (token !== latestToken) {
                return;
            }
            treeData.value = next;
            loading.value = false;
        });
    }, 300);
</script>

<template>
    <Spin :spinning="loading">
        <Cascader filterTreeNode placeholder="输入关键词远程搜索" remote style="width: 300px" :treeData="treeData" @change="(v) => console.log('selected:', v)" @search="handleSearch" />
    </Spin>
</template>
