<script setup lang="ts">
    import { InputNumber } from '@fibrae/semi-ui-vue';

    const defaultValue = 123456.78;
</script>

<template>
    <div>
        <div id="inputnumber-currency-locale-cny">🇨🇳 人民币</div>
        <InputNumber aria-labelledby="inputnumber-currency-locale-cny" currency="CNY" :defaultValue="defaultValue" localeCode="zh-CN" />
        <br />
        <br />
        <div id="inputnumber-currency-locale-eur">🇪🇺 欧元</div>
        <InputNumber aria-labelledby="inputnumber-currency-locale-eur" currency="EUR" :defaultValue="defaultValue" localeCode="de-DE" />
        <br />
        <br />
        <div id="inputnumber-currency-locale-jpy">🇯🇵 日元</div>
        <InputNumber aria-labelledby="inputnumber-currency-locale-jpy" currency="JPY" :defaultValue="defaultValue" localeCode="ja-JP" />
        <br />
        <br />
        <div id="inputnumber-currency-locale-vnd">🇻🇳 越南盾</div>
        <InputNumber aria-labelledby="inputnumber-currency-locale-vnd" currency="VND" :defaultValue="defaultValue" localeCode="vi-VN" />
        <br />
        <br />
    </div>
</template>
