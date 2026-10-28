<script setup lang="ts">
    import { Button, Form, FormInput, useForm } from '@fibrae/semi-ui-vue';

    const { formApi, formState, values } = useForm();

    const handleClick = () => {
        formApi.setValue('username', 'semi');
        console.log('当前表单值：', values.value);
    };
</script>

<template>
    <Button @click="handleClick">外部设置值</Button>
    <Button @click="formApi.reset()">重置表单</Button>

    <Form :form="formApi">
        <FormInput field="username" label="用户名" />
        <FormInput field="email" label="邮箱" />
    </Form>

    <div style="margin-top: 16px">
        <div>表单值：{{ JSON.stringify(values) }}</div>
        <div>touched 状态：{{ JSON.stringify(formState.touched) }}</div>
    </div>
</template>
