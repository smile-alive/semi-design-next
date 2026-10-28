<script setup lang="ts">
    import { InputNumber } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div style="width: 280px">
        <span id="inputnumber-basic-more-default-value">设置了默认值 defaultValue=1 </span>
        <InputNumber aria-labelledby="inputnumber-basic-more-default-value" :defaultValue="1" />
        <br />
        <br />

        <span id="inputnumber-basic-more-disabled">禁用 disabled=true</span>
        <InputNumber aria-labelledby="inputnumber-basic-more-disabled" :defaultValue="2" disabled />
        <br />
        <br />

        <span id="inputnumber-basic-more-precision">设置了小数位数 precision=2 </span>
        <InputNumber aria-labelledby="inputnumber-basic-more-precision" :defaultValue="1.234" :precision="2" />
        <br />
        <br />

        <span id="inputnumber-basic-more-inner-buttons">设置了 innerButtons=true </span>
        <InputNumber aria-labelledby="inputnumber-basic-more-inner-buttons" :defaultValue="1" innerButtons style="width: 190px">
            <template #suffix>小时</template>
        </InputNumber>
        <br />
    </div>
</template>
