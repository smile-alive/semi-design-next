<script setup lang="ts">
    import { Form, FormInput } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Form>
        <template #default="{ formState }">
            <FormInput field="name" initValue="semi" />
            <FormInput field="familyName" initValue="design" />
            <code>{{ JSON.stringify(formState) }}</code>
        </template>
    </Form>
</template>
