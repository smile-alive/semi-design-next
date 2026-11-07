<script setup lang="ts">
    import { InputGroup } from '@fibrae/semi-ui-vue/input/index';
    import InputNumber from '../..';
</script>

<template>
    <InputGroup disabled size="large">
        <InputNumber aria-label="inherit" :defaultValue="1" />
        <InputNumber aria-label="own" :defaultValue="2" :disabled="false" />
    </InputGroup>
</template>
