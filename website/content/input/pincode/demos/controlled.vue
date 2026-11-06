<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, PinCode } from '@fibrae/semi-ui-vue';

    const value = ref('69af41');
</script>

<template>
    <div>
        <Button @click="value = String(Math.floor(Math.random() * 100000000)).slice(0, 6)">Set Random Value</Button>
        <br />
        <br />
        <PinCode v-model="value" aria-label="Verification code" format="mixed" @change="(code: string) => console.log(code)" @complete="(code: string) => console.log('pincode: ', code)" />
    </div>
</template>
