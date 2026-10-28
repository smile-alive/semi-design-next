<script setup lang="ts">
    import { InputNumber } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div style="width: 280px">
        <span id="inputnumber-scientific-default">启用科学计数法（默认阈值 15 位）</span>
        <InputNumber aria-labelledby="inputnumber-scientific-default" :defaultValue="123456789012345" scientificNotation />
        <br />
        <br />

        <span id="inputnumber-scientific-threshold">自定义阈值（10 位）</span>
        <InputNumber aria-labelledby="inputnumber-scientific-threshold" :defaultValue="1234567890" :scientificNotation="{ threshold: 10 }" />
        <br />
        <br />

        <span id="inputnumber-scientific-large">超大数字</span>
        <InputNumber aria-labelledby="inputnumber-scientific-large" :defaultValue="1e16" scientificNotation />
        <br />
        <br />

        <span id="inputnumber-scientific-decimal">小数场景</span>
        <InputNumber aria-labelledby="inputnumber-scientific-decimal" :defaultValue="0.000000123456789" :precision="10" scientificNotation />
        <br />
        <br />
    </div>
</template>
