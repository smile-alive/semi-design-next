<script setup lang="ts">
    import { Button, Form, FormInput, type RuleItem } from '@fibrae/semi-ui-vue';

    const initValues = {
        name: 'semi',
        shortcut: 'se',
    };

    const style = { width: '100%' };

    const rules: RuleItem[] = [
        { required: true, message: 'required error' },
        { type: 'string', message: 'type error' },
        { validator: (_rule, value) => value === 'semi', message: 'should be semi' },
        {
            validator: (_rule, value) => Boolean(value && value.startsWith('se')),
            message: 'should startsWith se',
        },
    ];
</script>

<template>
    <Form :initValues="initValues">
        <FormInput field="name" :rules="rules" :style="style" trigger="blur" />
        <FormInput field="shortcut" :rules="rules" stopValidateWithError :style="style" />
        <Button htmlType="submit">提交</Button>
    </Form>
</template>
