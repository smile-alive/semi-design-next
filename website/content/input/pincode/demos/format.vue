<script setup lang="ts">
    import { PinCode, Typography } from '@fibrae/semi-ui-vue';

    const { Text } = Typography;

    const onComplete = (value: string) => console.log('pincode: ', value);
    const isLower = (char: string) => /[a-z]/.test(char);
</script>

<template>
    <div>
        <Text id="pincode-format-number">纯数字</Text>
        <PinCode aria-labelledby="pincode-format-number" format="number" @complete="onComplete" />
        <br />
        <Text id="pincode-format-mixed">字母和数字</Text>
        <PinCode aria-labelledby="pincode-format-mixed" format="mixed" @complete="onComplete" />
        <br />
        <Text id="pincode-format-upper">只大写字母</Text>
        <PinCode aria-labelledby="pincode-format-upper" :format="/[A-Z]/" @complete="onComplete" />
        <br />
        <Text id="pincode-format-lower">只小写字母(函数判断)</Text>
        <PinCode aria-labelledby="pincode-format-lower" :format="isLower" @complete="onComplete" />
    </div>
</template>
