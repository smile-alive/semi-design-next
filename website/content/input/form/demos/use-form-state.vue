<script setup lang="ts">
    import { defineComponent, h } from 'vue';
    import { Form, FormInput, useFormState } from '@fibrae/semi-ui-vue';

    // useFormState reads the Form from provide/inject, so it has to run in a component rendered inside the Form
    const ComponentUsingFormState = defineComponent(() => {
        const formState = useFormState();
        return () => h('pre', h('code', JSON.stringify(formState.value)));
    });
</script>

<template>
    <Form>
        <FormInput field="name" initValue="mike" />
        <h5>FormState read by 【useFormState】：</h5>
        <ComponentUsingFormState />
    </Form>
</template>
