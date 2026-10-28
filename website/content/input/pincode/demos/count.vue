<script setup lang="ts">
    import { PinCode } from '@fibrae/semi-ui-vue';

    const onComplete = (value: string) => console.log('pincode: ', value);
    const onChange = (value: string) => console.log(value);
</script>

<template>
    <PinCode aria-label="Verification code" :count="4" defaultValue="6688" size="large" @change="onChange" @complete="onComplete" />
</template>
