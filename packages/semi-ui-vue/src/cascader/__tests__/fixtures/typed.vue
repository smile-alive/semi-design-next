<script setup lang="ts">
    import { ref } from 'vue';
    import Cascader, { type CascaderSimpleValue, type CascaderValue } from '../..';

    const path = ref<CascaderValue>();
    const onSingle = (_value: CascaderSimpleValue[]) => undefined;
    const onMultiple = (_value: CascaderSimpleValue[][]) => undefined;
</script>

<template>
    <!-- Inline handlers: the template checks a handler passed by reference loosely, an inline call strictly -->
    <Cascader :modelValue="['a', 'b']" @change="onSingle($event)" />
    <Cascader :modelValue="[['a', 'b']]" multiple @change="onMultiple($event)" />
    <Cascader v-model="path" :multiple="Math.random() > 0.5" />
    <!-- @vue-expect-error a single-mode handler on a multiple Cascader -->
    <Cascader multiple @change="onSingle($event)" />
    <!-- @vue-expect-error a multiple-mode handler on a single Cascader -->
    <Cascader @change="onMultiple($event)" />
    <!-- @vue-expect-error changeWithObject is a boolean -->
    <Cascader changeWithObject="yes" />
</template>
