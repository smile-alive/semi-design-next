<script setup lang="ts">
    import { PinCode } from '@fibrae/semi-ui-vue';
</script>

<template>
    <PinCode aria-label="Verification code" :count="4" defaultValue="6688" size="large" @change="(value: string) => console.log(value)" @complete="(value: string) => console.log('pincode: ', value)" />
</template>
