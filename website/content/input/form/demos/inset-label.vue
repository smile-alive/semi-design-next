<script setup lang="ts">
    import { Form, FormDatePicker, FormInput, FormSelect } from '@fibrae/semi-ui-vue';

    const today = new Date(2024, 4, 6, 10, 30, 0);
</script>

<template>
    <Form labelPosition="inset" layout="horizontal">
        <FormInput field="name" initValue="semi" label="姓名" placeholder="请输入姓名" :style="{ width: '250px' }" trigger="blur" />
        <FormSelect field="role" initValue="rd" label="角色" :style="{ width: '250px' }">
            <FormSelect.Option value="operate">运营</FormSelect.Option>
            <FormSelect.Option value="rd">开发</FormSelect.Option>
            <FormSelect.Option value="pm">产品</FormSelect.Option>
            <FormSelect.Option value="ued">设计</FormSelect.Option>
        </FormSelect>
        <FormDatePicker field="date" :initValue="today" label="开始日期" :style="{ width: '250px' }" />
    </Form>
</template>
