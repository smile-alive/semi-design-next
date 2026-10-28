<script setup lang="ts">
    import { Form, FormInput, FormSelect } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Form :labelCol="{ span: 2 }" labelAlign="right" labelPosition="left" :wrapperCol="{ span: 20 }">
        <FormInput field="name" label="姓名" placeholder="请输入姓名" style="width: 250px" trigger="blur" />
        <FormSelect field="role" label="角色" placeholder="请选择角色" style="width: 250px">
            <FormSelect.Option value="operate">运营</FormSelect.Option>
            <FormSelect.Option value="rd">开发</FormSelect.Option>
            <FormSelect.Option value="pm">产品</FormSelect.Option>
            <FormSelect.Option value="ued">设计</FormSelect.Option>
        </FormSelect>
    </Form>
</template>
