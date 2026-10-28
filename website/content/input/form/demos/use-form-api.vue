<script setup lang="ts">
    import { defineComponent, h } from 'vue';
    import { Button, Form, FormInput, useFormApi } from '@fibrae/semi-ui-vue';

    // useFormApi reads the Form from provide/inject, so it has to run in a component rendered inside the Form
    const ComponentUsingFormApi = defineComponent(() => {
        const formApi = useFormApi();
        const change = () => {
            formApi.setValue('name', Math.random());
        };
        return () => h(Button, { onClick: change }, () => 'ChangeName By【formApi】');
    });
</script>

<template>
    <Form>
        <FormInput field="name" initValue="mike" />
        <ComponentUsingFormApi />
    </Form>
</template>
