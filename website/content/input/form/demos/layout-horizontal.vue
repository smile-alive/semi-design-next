<script setup lang="ts">
    import { Form, FormInput } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Form layout="horizontal">
        <FormInput field="phone" label="PhoneNumber" placeholder="Enter your phone number" />
        <FormInput field="password" label="Password" placeholder="Enter your password" />
    </Form>
</template>
