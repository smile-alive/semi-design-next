<script setup lang="ts">
    import { Form, FormInput } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Form layout="horizontal" @valueChange="(values) => console.log(values)">
        <template #default="{ formState }">
            <FormInput field="Role" :style="{ width: '176px' }" />
            <FormInput field="UserName" :style="{ width: '80px' }" />
            <FormInput field="Password" :style="{ width: '176px' }" />
            <code :style="{ marginTop: '24px' }">{{ JSON.stringify(formState) }}</code>
        </template>
    </Form>
</template>
