<script setup lang="ts">
    import { ref } from 'vue';
    import { Select } from '@fibrae/semi-ui-vue';

    const optionList = [
        { value: 'douyin', label: '抖音' },
        { value: 'jianying', label: '剪映' },
    ];

    const value = ref<string | undefined>('douyin');
</script>

<template>
    <Select
        v-model="value"
        :optionList="optionList"
    />
</template>
