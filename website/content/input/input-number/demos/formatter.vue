<script setup lang="ts">
    import { InputNumber } from '@fibrae/semi-ui-vue';

    const log = (v: number | string) => {
        console.log(`Changed to: [${typeof v}] ${v}`);
    };

    const formatRmb = (value: number | string) => `￥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const parseRmb = (value: string) => value.replace(/￥\s?|(,*)/g, '');
    const formatCustom = (value: number | string) => String(value).split('').join('-');
    const parseCustom = (value: string) => value.replace(/-/g, '');
</script>

<template>
    <div style="width: 180px">
        <span id="inputnumber-formatter-rmb">人民币</span>
        <InputNumber aria-labelledby="inputnumber-formatter-rmb" :defaultValue="1000" :formatter="formatRmb" :min="0" :parser="parseRmb" @change="log" />
        <br />
        <br />

        <span id="inputnumber-formatter-custom">自定义串</span>
        <InputNumber aria-labelledby="inputnumber-formatter-custom" :defaultValue="1111" :formatter="formatCustom" :parser="parseCustom" @change="log" />
        <br />
    </div>
</template>
