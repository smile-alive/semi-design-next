<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { Form, FormCheckbox, FormCheckboxGroup, FormInput, FormInputNumber, FormLabel, FormRadio, FormRadioGroup, FormSelect, FormSwitch, Select, type FormProps, type RuleItem } from '@fibrae/semi-ui-vue';

    const labelPosition = ref<FormProps['labelPosition']>('left');
    const labelAlign = ref<FormProps['labelAlign']>('left');
    const labelWidth = computed(() => (labelPosition.value === 'left' ? '180px' : 'auto'));

    const rules: RuleItem[] = [
        { required: true, message: 'required error' },
        { type: 'string', message: 'type error' },
        { validator: (_rule, value) => value === 'semi', message: 'should be semi' },
    ];
</script>

<template>
    <div :style="{ borderBottom: '1px solid var(--semi-color-border)', paddingBottom: '12px' }">
        <FormLabel :style="{ marginLeft: '10px' }">切换Label位置:</FormLabel>
        <Select v-model="labelPosition" aria-label="labelPosition" :style="{ width: '200px' }">
            <template #prefix>labelPosition</template>
            <Select.Option value="top">top</Select.Option>
            <Select.Option value="left">left</Select.Option>
        </Select>
        <FormLabel :style="{ marginLeft: '10px' }">切换Label文本对齐方向:</FormLabel>
        <Select v-model="labelAlign" aria-label="labelAlign" :style="{ width: '200px' }">
            <template #prefix>labelAlign</template>
            <Select.Option value="left">left</Select.Option>
            <Select.Option value="right">right</Select.Option>
        </Select>
    </div>
    <Form :key="`${labelPosition}${labelAlign}`" :labelAlign="labelAlign" :labelPosition="labelPosition" :labelWidth="labelWidth" :style="{ padding: '10px', width: '600px' }">
        <FormInput field="input" label="手机号码" :rules="rules" :style="{ width: '200px' }" trigger="blur" />
        <FormSwitch field="agree" label="是否同意" />
        <FormInputNumber field="price" label="价格" :style="{ width: '200px' }" />
        <FormSelect field="name" label="姓名" :style="{ width: '200px' }">
            <FormSelect.Option value="mike">mike</FormSelect.Option>
            <FormSelect.Option value="jane">jane</FormSelect.Option>
            <FormSelect.Option value="kate">kate</FormSelect.Option>
        </FormSelect>
        <FormCheckboxGroup direction="horizontal" field="role" label="角色">
            <FormCheckbox value="admin">admin</FormCheckbox>
            <FormCheckbox value="user">user</FormCheckbox>
            <FormCheckbox value="guest">guest</FormCheckbox>
            <FormCheckbox value="root">root</FormCheckbox>
        </FormCheckboxGroup>
        <FormRadioGroup field="性别">
            <FormRadio value="1">man</FormRadio>
            <FormRadio value="2">woman</FormRadio>
        </FormRadioGroup>
    </Form>
</template>
