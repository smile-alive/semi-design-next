<script setup lang="ts">
    import { shallowRef } from 'vue';
    import { Button, Form, FormInput, Toast, type FormApi } from '@fibrae/semi-ui-vue';

    const formApi = shallowRef<FormApi>();

    const usernameRules = [
        { required: true, message: '用户名不能为空' },
        { min: 3, message: '用户名至少 3 个字符' },
    ];
    const emailRules = [
        { required: true, message: '邮箱不能为空' },
        { type: 'email' as const, message: '邮箱格式不正确' },
    ];

    const handleSilentValidate = () => {
        formApi.value
            ?.validate({ silent: true })
            .then((values) => {
                Toast.success('表单校验通过，准备发起请求');
                console.log('发起后端请求:', values);
            })
            .catch((errors) => {
                Toast.error('表单校验未通过，但不显示错误提示');
                console.log('校验错误:', errors);
            });
    };

    const handleNormalValidate = () => {
        formApi.value
            ?.validate()
            .then(() => {
                Toast.success('表单校验通过');
            })
            .catch(() => {
                Toast.error('表单校验未通过，显示错误提示');
            });
    };
</script>

<template>
    <Form layout="horizontal" @getFormApi="formApi = $event">
        <FormInput field="username" label="用户名" :rules="usernameRules" />
        <FormInput field="email" label="邮箱" :rules="emailRules" />
        <div style="display: flex; gap: 12px; margin-top: 12px">
            <Button type="primary" @click="handleSilentValidate">静默校验（不显示错误）</Button>
            <Button @click="handleNormalValidate">普通校验（显示错误）</Button>
        </div>
    </Form>
</template>
