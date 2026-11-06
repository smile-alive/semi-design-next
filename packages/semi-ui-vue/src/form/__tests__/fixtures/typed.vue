<script setup lang="ts">
    import * as z from 'zod';
    import { Form, SchemaForm, withField } from '../..';
    import type { InputChangeEvent } from '../../../input/interface';
    import { FormInput } from './fields';

    const onChange = (_value: string, _event: InputChangeEvent, _latest: Record<string, any>) => undefined;
    const onValue = (_value: number) => undefined;
    const onLatest = (_event: Event, _latest: Record<string, any>) => undefined;
    const onOutput = (_values: { age: number }) => undefined;
    const onInput = (_values: { age: string }) => undefined;
    // the key change emit is `input`, so the latest values come with @input, not with the native @change
    const NativeInput = withField('input', { valueKey: 'value', onKeyChangeFnName: 'input' });
    const ageSchema = z.object({ age: z.string().transform(Number) });
    const nameSchema = z.string().min(3);
    const rules = [{ required: true }];
    const validator = () => 'bad';
</script>

<template>
    <FormInput field="name" placeholder="name" @change="(value, event, latest) => onChange(value, event, latest)" />
    <!-- @vue-expect-error the value is a string -->
    <FormInput field="name" @change="onValue($event)" />
    <!-- @vue-expect-error the Form owns the value, so modelValue is not accepted -->
    <FormInput field="name" modelValue="x" />
    <!-- @vue-expect-error field is required -->
    <FormInput label="name" />
    <!-- @vue-expect-error trigger takes validation timings only -->
    <FormInput field="name" trigger="focus" />
    <NativeInput field="name" @input="(event, latest) => onLatest(event, latest)" />
    <!-- @vue-expect-error the native change has no latest values -->
    <NativeInput field="name" @change="(event, latest) => onLatest(event, latest)" />
    <FormInput field="name" :validator="nameSchema" />
    <!-- @vue-expect-error rules and validator are exclusive -->
    <FormInput field="name" :rules="rules" :validator="validator" />
    <Form :schema="ageSchema" @submit="(values) => onOutput(values)" />
    <!-- @vue-expect-error submit receives the schema output, not the input -->
    <Form :schema="ageSchema" @submit="(values) => onInput(values)" />
    <SchemaForm :schema="ageSchema" @submit="(values) => onOutput(values)" />
    <!-- @vue-expect-error submit receives the schema output, not the input -->
    <SchemaForm :schema="ageSchema" @submit="(values) => onInput(values)" />
</template>
