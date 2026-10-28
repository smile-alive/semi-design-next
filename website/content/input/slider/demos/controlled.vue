<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Slider } from '@fibrae/semi-ui-vue';

    const value = ref(10);

    const changeValue = () => {
        value.value += 10;
    };
</script>

<template>
    <div>
        <Button :style="{ marginRight: '20px' }" @click="changeValue">点击改变value值</Button>
        <br />
        <br />
        <Slider aria-label="受控滑块" :modelValue="value" />
    </div>
</template>
