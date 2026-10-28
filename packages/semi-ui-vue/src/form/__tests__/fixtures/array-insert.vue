<script setup lang="ts">
    import { ref } from 'vue';
    import { ArrayField, Form, type FormApi } from '../..';
    import { FormInput } from './fields';

    withDefaults(defineProps<{ initValues?: Record<string, unknown> }>(), {
        initValues: () => ({ tasks: [{ name: 'task-0' }, { name: 'task-1' }, { name: 'task-2' }] }),
    });
    const formApi = ref<FormApi>();
    const values = ref('');
    const readValues = () => {
        values.value = JSON.stringify(formApi.value?.getValue('tasks'));
    };
</script>

<template>
    <Form :initValues="initValues" @getFormApi="formApi = $event">
        <ArrayField #default="{ arrayFields, onAdd, onAddWithInitValue }" field="tasks">
            <button data-testid="add-default" type="button" @click="onAdd()">add()</button>
            <button data-testid="add-at-0" type="button" @click="onAdd(0)">add(0)</button>
            <button data-testid="add-at-1" type="button" @click="onAdd(1)">add(1)</button>
            <button data-testid="add-at-end" type="button" @click="onAdd(arrayFields.length)">add(end)</button>
            <button data-testid="add-out-of-range" type="button" @click="onAdd(100)">add(100)</button>
            <button data-testid="add-negative" type="button" @click="onAdd(-5)">add(-5)</button>
            <button data-testid="add-direct" type="button" @click="onAdd">add</button>
            <button data-testid="add-with-init-at-0" type="button" @click="onAddWithInitValue({ name: 'inserted' }, 0)">addWithInitValue(0)</button>
            <button data-testid="add-with-init-default" type="button" @click="onAddWithInitValue({ name: 'appended' })">addWithInitValue()</button>
            <button data-testid="get-values" type="button" @click="readValues">getValues</button>
            <div v-for="(item, index) in arrayFields" :key="item.key" :data-testid="`task-${index}`">
                <FormInput :field="`${item.field}[name]`" noLabel />
                <button :data-testid="`remove-${index}`" type="button" @click="item.onRemove">remove</button>
            </div>
            <div data-testid="count">{{ arrayFields.length }}</div>
        </ArrayField>
        <div data-testid="form-values">{{ values }}</div>
    </Form>
</template>
