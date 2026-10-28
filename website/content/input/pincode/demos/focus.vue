<script setup lang="ts">
    import { ref, useTemplateRef } from 'vue';
    import { Button, PinCode, type PinCodeHandle } from '@fibrae/semi-ui-vue';

    const value = ref('69af41');
    const pinCode = useTemplateRef<PinCodeHandle>('pinCode');

    const onComplete = (code: string) => console.log('pincode: ', code);
    const onChange = (code: string) => console.log(code);
</script>

<template>
    <div>
        <Button @click="pinCode?.focus(2)">Focus Third Input</Button>
        <br />
        <br />
        <PinCode ref="pinCode" v-model="value" aria-label="Verification code" format="mixed" @change="onChange" @complete="onComplete" />
    </div>
</template>
