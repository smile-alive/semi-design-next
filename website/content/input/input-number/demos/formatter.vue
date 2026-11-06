<script setup lang="ts">
    import { InputNumber } from '@fibrae/semi-ui-vue';

    const log = (v: number | string) => {
        console.log(`Changed to: [${typeof v}] ${v}`);
    };
</script>

<template>
    <div style="width: 180px">
        <span id="inputnumber-formatter-rmb">人民币</span>
        <InputNumber aria-labelledby="inputnumber-formatter-rmb" :defaultValue="1000" :formatter="(value) => `￥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')" :min="0" :parser="(value) => value.replace(/￥\s?|(,*)/g, '')" @change="log" />
        <br />
        <br />

        <span id="inputnumber-formatter-custom">自定义串</span>
        <InputNumber aria-labelledby="inputnumber-formatter-custom" :defaultValue="1111" :formatter="(value) => String(value).split('').join('-')" :parser="(value) => value.replace(/-/g, '')" @change="log" />
        <br />
    </div>
</template>
