<script setup lang="ts">
    import { IconHelpCircle } from '@fibrae/semi-icons-vue';
    import { Form, FormInput, FormSelect, Tooltip } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Form layout="horizontal" @valueChange="(values) => console.log(values)">
        <FormInput field="UserName" label="用户名" :style="{ width: '80px' }" />
        <FormInput field="Password" label="密码" :style="{ width: '176px' }">
            <template #labelExtra>
                <Tooltip content="详情">
                    <IconHelpCircle aria-label="帮助" :style="{ color: 'var(--semi-color-text-2)' }" />
                </Tooltip>
            </template>
        </FormInput>
        <FormSelect field="Role" :label="{ text: '角色', optional: true }" :style="{ width: '176px' }">
            <FormSelect.Option value="admin">管理员</FormSelect.Option>
            <FormSelect.Option value="user">普通用户</FormSelect.Option>
            <FormSelect.Option value="guest">访客</FormSelect.Option>
        </FormSelect>
    </Form>
</template>
