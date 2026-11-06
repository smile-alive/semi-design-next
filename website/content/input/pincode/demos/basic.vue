<script setup lang="ts">
    import { PinCode } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <PinCode aria-label="Verification code, small" defaultValue="123456" size="small" @change="(value: string) => console.log(value)" @complete="(value: string) => console.log('pincode: ', value)" />
        <br />
        <PinCode aria-label="Verification code, default" defaultValue="123456" size="default" @change="(value: string) => console.log(value)" @complete="(value: string) => console.log('pincode: ', value)" />
        <br />
        <PinCode aria-label="Verification code, large" defaultValue="123456" size="large" @change="(value: string) => console.log(value)" @complete="(value: string) => console.log('pincode: ', value)" />
    </div>
</template>
