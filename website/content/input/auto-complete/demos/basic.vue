<script setup lang="ts">
    import { ref } from 'vue';
    import { IconSearch } from '@fibrae/semi-icons-vue';
    import { AutoComplete } from '@fibrae/semi-ui-vue';

    const stringData = ref<string[]>([]);
    const value = ref<string | number>('');

    const handleStringSearch = (input: string) => {
        stringData.value = input ? ['gmail.com', '163.com', 'qq.com'].map((domain) => `${input}@${domain}`) : [];
    };

    const handleChange = (input: string | number) => {
        console.log('onChange', input);
    };
</script>

<template>
    <AutoComplete v-model="value" :data="stringData" placeholder="搜索... " showClear style="width: 200px" @change="handleChange" @search="handleStringSearch">
        <template #prefix>
            <IconSearch />
        </template>
    </AutoComplete>
</template>
