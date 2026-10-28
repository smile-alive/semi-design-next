<script setup lang="ts">
    import { ref } from 'vue';
    import { IllustrationNoContent } from '@fibrae/semi-illustrations-vue';
    import { AutoComplete, Empty } from '@fibrae/semi-ui-vue';

    const data = ref<number[]>([]);
    const loading = ref(false);

    const fetchData = (input: string) => {
        loading.value = true;
        setTimeout(() => {
            data.value = input ? Array.from({ length: 5 }, () => Math.random()) : [];
            loading.value = false;
        }, 1000);
    };
</script>

<template>
    <AutoComplete aria-label="搜索" :data="data" :loading="loading" @search="fetchData">
        <template #emptyContent>
            <Empty style="padding: 12px; width: 300px">
                <template #image>
                    <IllustrationNoContent style="width: 150px; height: 150px" />
                </template>
                <template #description>暂无内容</template>
            </Empty>
        </template>
    </AutoComplete>
</template>
