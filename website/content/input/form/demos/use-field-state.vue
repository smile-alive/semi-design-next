<script setup lang="ts">
    import { defineComponent, h } from 'vue';
    import { Form, FormInput, useFieldState } from '@fibrae/semi-ui-vue';

    // useFieldState reads the Form from provide/inject, so it has to run in a component rendered inside the Form
    const ComponentUsingFieldState = defineComponent(
        (props: { field: string }) => {
            const fieldState = useFieldState(() => props.field);
            return () => h('div', [h('span', `【${props.field}】FieldState read by 【useFieldState】：`), h('code', JSON.stringify(fieldState.value))]);
        },
        { props: ['field'] }
    );
</script>

<template>
    <Form layout="horizontal">
        <div style="width: 400px">
            <FormInput field="name" initValue="mike" />
            <FormInput field="country" initValue="china" />
        </div>
        <div style="width: 500px; margin-top: 30px">
            <ComponentUsingFieldState field="name" />
            <ComponentUsingFieldState field="country" />
        </div>
    </Form>
</template>
