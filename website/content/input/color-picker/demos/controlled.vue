<script setup lang="ts">
    import { shallowRef } from 'vue';
    import { ColorPicker } from '@fibrae/semi-ui-vue';

    const value = shallowRef(ColorPicker.colorStringToValue('#39c5bb'));
</script>

<template>
    <div>
        <ColorPicker v-model="value" alpha />
    </div>
</template>
