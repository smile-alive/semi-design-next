<script setup lang="ts">
    import { ref } from 'vue';
    import { AutoComplete } from '@fibrae/semi-ui-vue';

    const data = ref<string[]>([]);

    const change = (input: string) => {
        data.value = input ? ['gmail.com', '163.com', 'qq.com'].map((domain) => `${input}@${domain}`) : [];
    };
</script>

<template>
    <div>
        <AutoComplete :data="data" placeholder="选项菜单在上方显示" position="top" style="width: 200px; margin: 10px" @search="change" />
        <AutoComplete :data="data" placeholder="选项菜单在右侧显示" position="rightTop" style="width: 200px; margin: 10px" @search="change" />
    </div>
</template>
