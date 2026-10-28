<script setup lang="ts">
    import { defineComponent, h } from 'vue';
    import { Button, Form, FormInput, useFieldApi } from '@fibrae/semi-ui-vue';

    // useFieldApi reads the Form from provide/inject, so it has to run in a component rendered inside the Form
    const ComponentUsingFieldApi = defineComponent(() => {
        const nameFieldApi = useFieldApi('name');
        const change = () => {
            nameFieldApi.setValue(Math.random());
        };
        return () => h(Button, { onClick: change }, () => 'Click Me!!! changeNameBy【fieldApi】');
    });
</script>

<template>
    <Form>
        <FormInput field="name" initValue="mike" />
        <ComponentUsingFieldApi />
    </Form>
</template>
