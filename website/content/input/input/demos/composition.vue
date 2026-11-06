<script setup lang="ts">
    import { ref } from 'vue';
    import { Input, TextArea } from '@fibrae/semi-ui-vue';

    const inputValue = ref('');
    const textAreaValue = ref('');
    const inputCount = ref(0);
    const textAreaCount = ref(0);
    const style = { width: '300px' };
    const counterStyle = { marginBlockStart: '8px', color: 'var(--semi-color-text-2)', fontSize: '12px' };
</script>

<template>
    <div>
        <h4>Input with composition</h4>
        <Input v-model="inputValue" composition placeholder="开启 composition，拼音输入时不会触发 onChange" :style="style" @change="inputCount++" />
        <div :style="counterStyle">onChange 触发次数: {{ inputCount }}</div>
        <br />
        <br />
        <h4>TextArea with composition</h4>
        <TextArea v-model="textAreaValue" composition placeholder="开启 composition，拼音输入时不会触发 onChange" :style="style" @change="textAreaCount++" />
        <div :style="counterStyle">onChange 触发次数: {{ textAreaCount }}</div>
    </div>
</template>
