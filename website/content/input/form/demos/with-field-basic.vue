<script setup lang="ts">
    import { defineComponent, h } from 'vue';
    import { Form, useFormState, withField } from '@fibrae/semi-ui-vue';

    const CustomInput = withField('input', {
        valueKey: 'value',
        onKeyChangeFnName: 'input',
        valuePath: 'target.value',
    });

    // useFormState reads the Form from provide/inject, so it has to run in a component rendered inside the Form
    const ComponentUsingFormState = defineComponent(() => {
        const formState = useFormState();
        return () => h('pre', h('code', JSON.stringify(formState.value)));
    });
</script>

<template>
    <Form>
        <CustomInput field="name" />
        <ComponentUsingFormState />
    </Form>
</template>
