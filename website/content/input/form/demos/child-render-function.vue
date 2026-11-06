<script setup lang="ts">
    import { Form, FormInput, FormSelect } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Form layout="horizontal" @valueChange="(values) => console.log(values)">
        <template #default="form">
            <FormSelect field="Role" label="角色" :style="{ width: '176px' }">
                <FormSelect.Option value="admin">管理员</FormSelect.Option>
                <FormSelect.Option value="user">普通用户</FormSelect.Option>
                <FormSelect.Option value="guest">访客</FormSelect.Option>
            </FormSelect>
            <FormInput field="UserName" label="用户名" :style="{ width: '80px' }" />
            <FormInput field="Password" label="密码" :style="{ width: '176px' }" />
            <code :style="{ marginBlockStart: '24px' }">{{ JSON.stringify(form.formState) }}</code>
        </template>
    </Form>
</template>
