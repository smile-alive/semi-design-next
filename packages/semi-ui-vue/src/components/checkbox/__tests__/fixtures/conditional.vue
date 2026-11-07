<script setup lang="ts">
    import Checkbox, { CheckboxGroup } from '../..';

    defineProps<{ show: boolean }>();
</script>

<template>
    <CheckboxGroup>
        <Checkbox v-if="show" key="x" value="x">X</Checkbox>
        <Checkbox key="a" value="a">A</Checkbox>
    </CheckboxGroup>
</template>
