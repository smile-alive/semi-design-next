<script setup lang="ts">
    import { PinCode, Typography } from '@fibrae/semi-ui-vue';

    const isLowerCase = (char: string) => /[a-z]/.test(char);
</script>

<template>
    <div>
        <Typography.Text id="pincode-format-number">纯数字</Typography.Text>
        <PinCode aria-labelledby="pincode-format-number" format="number" @complete="(value: string) => console.log('pincode: ', value)" />
        <br />
        <Typography.Text id="pincode-format-mixed">字母和数字</Typography.Text>
        <PinCode aria-labelledby="pincode-format-mixed" format="mixed" @complete="(value: string) => console.log('pincode: ', value)" />
        <br />
        <Typography.Text id="pincode-format-upper">只大写字母</Typography.Text>
        <PinCode aria-labelledby="pincode-format-upper" :format="/[A-Z]/" @complete="(value: string) => console.log('pincode: ', value)" />
        <br />
        <Typography.Text id="pincode-format-lower">只小写字母(函数判断)</Typography.Text>
        <PinCode aria-labelledby="pincode-format-lower" :format="isLowerCase" @complete="(value: string) => console.log('pincode: ', value)" />
    </div>
</template>
