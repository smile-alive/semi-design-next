<script setup lang="ts">
    import { Button, Form, FormInput } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Form>
        <template #default="{ formApi }">
            <FormInput field="name" initValue="semi" />
            <FormInput field="familyName" initValue="design" />
            <Button htmlType="submit" style="margin-right: 4px">submit</Button>
            <Button @click="formApi.setValue('name', Math.random())">Click Me!!! ChangeName By【formApi】</Button>
        </template>
    </Form>
</template>
