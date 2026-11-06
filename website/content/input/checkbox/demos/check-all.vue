<script setup lang="ts">
    import { ref } from 'vue';
    import { Checkbox, CheckboxGroup, type CheckboxEvent, type CheckboxValue } from '@fibrae/semi-ui-vue';

    const plainOptions = ['Photography', 'Movies', 'Running'];
    const checkedList = ref<CheckboxValue[]>(['Photography', 'Running']);
    const indeterminate = ref(true);
    const checkAll = ref(false);

    const onChange = (list: CheckboxValue[]) => {
        checkedList.value = list;
        indeterminate.value = !!list.length && list.length < plainOptions.length;
        checkAll.value = list.length === plainOptions.length;
    };
    const onCheckAllChange = (e: CheckboxEvent) => {
        console.log(e);
        checkedList.value = e.target.checked ? plainOptions : [];
        indeterminate.value = false;
        checkAll.value = e.target.checked;
    };
</script>

<template>
    <div>
        <div :style="{ paddingBottom: '8px', borderBottom: '1px solid var(--semi-color-border)' }">
            <Checkbox aria-label="Checkbox 示例" :indeterminate="indeterminate" :modelValue="checkAll" @change="onCheckAllChange"> Check all </Checkbox>
        </div>
        <CheckboxGroup aria-label="CheckboxGroup 示例" :modelValue="checkedList" :options="plainOptions" :style="{ marginTop: '6px' }" @change="onChange" />
    </div>
</template>
