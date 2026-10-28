<script setup lang="ts">
    import { Button, Form, FormCheckbox, FormInput, Toast } from '@fibrae/semi-ui-vue';

    const handleSubmit = (values: Record<string, unknown>) => {
        console.log(values);
        Toast.info('表单已提交');
    };
</script>

<template>
    <Form :style="{ width: '400px' }" @submit="handleSubmit">
        <template #default="{ values }">
            <FormInput field="phone" label="PhoneNumber" placeholder="Enter your phone number" :style="{ width: '100%' }" />
            <FormInput field="password" label="Password" placeholder="Enter your password" :style="{ width: '100%' }" />
            <FormCheckbox field="agree" noLabel>I have read and agree to the terms of service</FormCheckbox>
            <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }">
                <p>
                    <span>Or</span>
                    <Button :style="{ color: 'var(--semi-color-primary)', marginLeft: '10px', cursor: 'pointer' }" theme="borderless"> Sign up </Button>
                </p>
                <Button :disabled="!values.agree" htmlType="submit" type="tertiary">Log in</Button>
            </div>
        </template>
    </Form>
</template>
