<script setup lang="ts">
    import { ref } from 'vue';
    import { InputNumber, Slider } from '@fibrae/semi-ui-vue';

    const value = ref(10);

    const getSliderValue = (newValue: number | string | number[]) => {
        if (isNaN(Number(newValue))) {
            return;
        }
        value.value = Number(newValue);
    };
</script>

<template>
    <div>
        <div :style="{ width: '320px', marginRight: '15px' }">
            <Slider aria-label="数值" :modelValue="value" :step="1" @change="getSliderValue" />
        </div>
        <InputNumber aria-label="数值" :max="100" :min="0" :modelValue="value" :style="{ width: '100px' }" @change="getSliderValue" />
    </div>
</template>
