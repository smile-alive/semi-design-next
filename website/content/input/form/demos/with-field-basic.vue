<script setup lang="ts">
    import { Form, withField } from '@fibrae/semi-ui-vue';

    const CustomInput = withField('input', {
        valueKey: 'value',
        onKeyChangeFnName: 'input',
        valuePath: 'target.value',
    });
</script>

<template>
    <Form>
        <template #default="{ formState }">
            <CustomInput field="name" />
            <pre><code>{{ JSON.stringify(formState) }}</code></pre>
        </template>
    </Form>
</template>
