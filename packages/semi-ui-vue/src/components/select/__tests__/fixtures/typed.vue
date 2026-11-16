<script setup lang="ts">
    import { ref } from 'vue';
    import { expectTypeOf } from 'vite-plus/test';
    import Select, { type SelectOptionProps } from '../..';

    // Type cases only: vue-tsc checks what the template infers from optionList, v-model and multiple; no test mounts it
    const one = ref<string | undefined>();
    const many = ref<string[]>([]);
    const flag = ref<boolean | undefined>();
    const optionList = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
    ];
    const onSingle = (_value?: string) => undefined;
    const onMultiple = (_value: string[]) => undefined;
    const onItem = (_value?: SelectOptionProps<string>) => undefined;
    const onItems = (_value: SelectOptionProps<string>[]) => undefined;
</script>

<template>
    <!-- v-model state without options: V comes from the state -->
    <Select v-model="one" @change="onSingle($event)" />
    <Select v-model="many" multiple @change="onMultiple($event)" />
    <Select v-model="flag" :optionList="[{ value: true }, { value: false }]" @change="expectTypeOf($event).toEqualTypeOf<boolean | undefined>()" />
    <!-- inline literal options give a literal union; a string state still fits -->
    <Select v-model="one" :optionList="[{ value: 'a' }, { value: 'b' }]" @change="expectTypeOf($event).toEqualTypeOf<'a' | 'b' | undefined>()" />
    <Select multiple :optionList="[{ value: 'a' }, { value: 'b' }]" @change="expectTypeOf($event).toEqualTypeOf<('a' | 'b')[]>()" />
    <!-- a list kept in a variable is widened by TypeScript -->
    <Select :optionList="optionList" @change="expectTypeOf($event).toEqualTypeOf<string | undefined>()" />
    <Select changeWithObject :optionList="optionList" @change="onItem($event)" />
    <Select changeWithObject multiple :optionList="optionList" @change="onItems($event)" />
    <Select :optionList="[{ value: 'a' }, { value: 'b' }]" @select="(value) => expectTypeOf(value).toEqualTypeOf<'a' | 'b'>()" />
    <!-- slot options only: V stays the default -->
    <Select @change="expectTypeOf($event).toEqualTypeOf<string | number | undefined>()" />
    <!-- @vue-expect-error a single-value handler on a multiple Select -->
    <Select v-model="many" multiple @change="onSingle($event)" />
    <!-- @vue-expect-error an array handler on a single Select -->
    <Select v-model="one" @change="onMultiple($event)" />
    <!-- @vue-expect-error changeWithObject is a boolean -->
    <Select changeWithObject="yes" />
    <!-- @vue-expect-error a number state does not fit string options -->
    <Select :modelValue="1" :optionList="optionList" />
</template>
