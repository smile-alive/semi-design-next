<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, PinCode } from '@fibrae/semi-ui-vue';

    const value = ref('69af41');

    const setRandomValue = () => {
        value.value = String(Math.floor(Math.random() * 100000000)).slice(0, 6);
    };
    const onComplete = (code: string) => console.log('pincode: ', code);
    const onChange = (code: string) => console.log(code);
</script>

<template>
    <div>
        <Button @click="setRandomValue">Set Random Value</Button>
        <br />
        <br />
        <PinCode v-model="value" aria-label="Verification code" format="mixed" @change="onChange" @complete="onComplete" />
    </div>
</template>
