<script setup lang="ts">
    import { Button, Form, FormInput, FormInputGroup, FormSelect } from '@fibrae/semi-ui-vue';

    const onSubmit = (values: unknown) => console.log(values);
</script>

<template>
    <Form labelPosition="top" :style="{ width: '400px' }" @submit="onSubmit">
        <FormInputGroup :label="{ text: '手机号码', required: true }" labelPosition="top">
            <FormSelect field="phonePrefix" initValue="+86" :rules="[{ required: true }]" showClear :style="{ width: '150px' }">
                <FormSelect.Option value="+1">美国+1</FormSelect.Option>
                <FormSelect.Option value="+852">香港+852</FormSelect.Option>
                <FormSelect.Option value="+86">中国+86</FormSelect.Option>
                <FormSelect.Option value="+81">日本+81</FormSelect.Option>
            </FormSelect>
            <FormInput field="phoneNumber" initValue="18912345678" :rules="[{ required: true }]" showClear :style="{ width: '250px' }" />
        </FormInputGroup>
        <FormInput field="姓名" initValue="Semi" trigger="blur" />
        <Button htmlType="submit">提交</Button>
    </Form>
</template>
