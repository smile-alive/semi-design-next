<script setup lang="ts">
    import { Form, FormSelect } from '../..';

    defineProps<{ options: string[] }>();
</script>

<template>
    <Form>
        <FormSelect field="city">
            <FormSelect.Option v-for="option in options" :key="option" :value="option">{{ option }}</FormSelect.Option>
        </FormSelect>
    </Form>
</template>
