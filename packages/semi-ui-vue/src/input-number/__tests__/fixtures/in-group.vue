<script setup lang="ts">
    import InputNumber from '../..';
    import { InputGroup } from '../../../input';
</script>

<template>
    <InputGroup disabled size="large">
        <InputNumber aria-label="inherit" :defaultValue="1" />
        <InputNumber aria-label="own" :defaultValue="2" :disabled="false" />
    </InputGroup>
</template>
