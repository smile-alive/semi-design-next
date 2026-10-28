<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Select } from '@fibrae/semi-ui-vue';

    const options = ref([1, 2, 3, 4]);

    function add() {
        const length = Math.ceil(Math.random() * 10);
        options.value = Array.from({ length }, (_, i) => i + 1);
    }
</script>

<template>
    <Select aria-label="数字" :modelValue="4" placeholder="请选择" style="width: 180px">
        <Select.Option v-for="option in options" :key="option" :value="option">{{ option }}</Select.Option>
    </Select>
    <br />
    <br />
    <Button @click="add">changeOptions Dynamic</Button>
</template>
