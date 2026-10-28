<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { Checkbox, CheckboxGroup, type CheckboxEvent, type CheckboxValue } from '@fibrae/semi-ui-vue';

    const plainOptions = ['Photography', 'Movies', 'Running'];
    const checkedList = ref<CheckboxValue[]>(['Photography', 'Running']);
    const checkAll = computed(() => checkedList.value.length === plainOptions.length);
    const indeterminate = computed(() => checkedList.value.length > 0 && !checkAll.value);

    const onCheckAllChange = (e: CheckboxEvent) => {
        console.log(e);
        checkedList.value = e.target.checked ? plainOptions : [];
    };
</script>

<template>
    <div>
        <div :style="{ paddingBottom: '8px', borderBottom: '1px solid var(--semi-color-border)' }">
            <Checkbox aria-label="Checkbox 示例" :indeterminate="indeterminate" :modelValue="checkAll" @change="onCheckAllChange"> Check all </Checkbox>
        </div>
        <CheckboxGroup v-model="checkedList" aria-label="CheckboxGroup 示例" :options="plainOptions" :style="{ marginTop: '6px' }" />
    </div>
</template>
