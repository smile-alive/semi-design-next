<script setup lang="ts">
    import { ref } from 'vue';
    import Select from '../..';

    // Type cases only: vue-tsc checks what the template infers from v-model and multiple; no test mounts it
    interface Item {
        value: string;
        label: string;
    }
    const one = ref<string | undefined>();
    const many = ref<string[]>([]);
    const item = ref<Item | undefined>();
    const items = ref<Item[]>([]);
    const onSingle = (_value: string | undefined) => undefined;
    const onMultiple = (_value: string[]) => undefined;
    const onItem = (_value: Item | undefined) => undefined;
    const onItems = (_value: Item[]) => undefined;
</script>

<template>
    <Select v-model="one" @change="onSingle($event)" />
    <Select v-model="many" multiple @change="onMultiple($event)" />
    <Select v-model="item" changeWithObject @change="onItem($event)" />
    <Select v-model="items" changeWithObject multiple @change="onItems($event)" />
    <!-- @vue-expect-error a single-value handler on a multiple Select -->
    <Select v-model="many" multiple @change="onSingle($event)" />
    <!-- @vue-expect-error an array handler on a single Select -->
    <Select v-model="one" @change="onMultiple($event)" />
    <!-- @vue-expect-error changeWithObject is a boolean -->
    <Select changeWithObject="yes" />
</template>
