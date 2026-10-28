<script setup lang="ts">
    import { PinCode } from '@fibrae/semi-ui-vue';

    const onComplete = (value: string) => console.log('pincode: ', value);
    const onChange = (value: string) => console.log(value);
</script>

<template>
    <div>
        <PinCode aria-label="Verification code, small" defaultValue="123456" size="small" @change="onChange" @complete="onComplete" />
        <br />
        <PinCode aria-label="Verification code, default" defaultValue="123456" size="default" @change="onChange" @complete="onComplete" />
        <br />
        <PinCode aria-label="Verification code, large" defaultValue="123456" size="large" @change="onChange" @complete="onComplete" />
    </div>
</template>
