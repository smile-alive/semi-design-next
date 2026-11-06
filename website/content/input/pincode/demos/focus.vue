<script setup lang="ts">
    import { ref, useTemplateRef } from 'vue';
    import { Button, PinCode, type PinCodeHandle } from '@fibrae/semi-ui-vue';

    const value = ref('69af41');
    const pinCode = useTemplateRef<PinCodeHandle>('pinCode');
</script>

<template>
    <div>
        <Button @click="pinCode?.focus(2)">Focus Third Input</Button>
        <br />
        <br />
        <PinCode ref="pinCode" v-model="value" aria-label="Verification code" format="mixed" @change="(code: string) => console.log(code)" @complete="(code: string) => console.log('pincode: ', code)" />
    </div>
</template>
