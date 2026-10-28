<script setup lang="ts">
    import { ref } from 'vue';
    import { Transfer, ButtonGroup, Button } from '@fibrae/semi-ui-vue';

    const currentPage = ref(1);
    const data = Array.from({ length: 100 }, (_, i) => ({
        label: `选项名称 ${i}`,
        value: i,
        disabled: false,
        key: `key-${i}`,
    }));
</script>

<template>
    <div>
        <ButtonGroup style="margin-bottom: 12px">
            <Button @click="currentPage = 1">第1页</Button>
            <Button @click="currentPage = 2">第2页</Button>
            <Button @click="currentPage = 5">第5页</Button>
            <Button @click="currentPage = 10">第10页</Button>
        </ButtonGroup>
        <div>当前页码: {{ currentPage }}</div>
        <Transfer :dataSource="data" :pagination="{ pageSize: 10, currentPage, onPageChange: (page) => (currentPage = page) }" style="width: 568px; height: 416px" @change="(values, items) => console.log(values, items)" />
    </div>
</template>
