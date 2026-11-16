<script setup lang="ts">
    import { Form, FormSelect } from '../..';

    const props = defineProps<{ options: string[] }>();
</script>

<template>
    <Form>
        <FormSelect field="city">
            <FormSelect.Option v-for="option in props.options" :key="option" :value="option">{{ option }}</FormSelect.Option>
        </FormSelect>
    </Form>
</template>
