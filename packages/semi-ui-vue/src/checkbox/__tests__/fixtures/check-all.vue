<script setup lang="ts">
    import { computed, ref } from 'vue';
    import Checkbox, { CheckboxGroup } from '../..';
    import type { CheckboxEvent, CheckboxValue } from '../../interface';

    const all = ['a', 'b', 'c'];
    const checkedList = ref<CheckboxValue[]>(['a']);
    const checkAll = computed(() => checkedList.value.length === all.length);
    const indeterminate = computed(() => checkedList.value.length > 0 && !checkAll.value);
    const onCheckAllChange = (event: CheckboxEvent) => {
        checkedList.value = event.target.checked ? all : [];
    };
</script>

<template>
    <Checkbox :indeterminate="indeterminate" :modelValue="checkAll" @change="onCheckAllChange">all</Checkbox>
    <CheckboxGroup v-model="checkedList" :options="all" />
</template>
