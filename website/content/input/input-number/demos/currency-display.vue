<script setup lang="ts">
    import { InputNumber } from '@fibrae/semi-ui-vue';

    const defaultValue = 123456.78;
</script>

<template>
    <div>
        <div id="inputnumber-currency-display-code">🇨🇳 CNY ➕ code</div>
        <InputNumber aria-labelledby="inputnumber-currency-display-code" currency="CNY" currencyDisplay="code" :defaultValue="defaultValue" />
        <br />
        <br />
        <div id="inputnumber-currency-display-symbol">🇨🇳 CNY ➕ symbol</div>
        <InputNumber aria-labelledby="inputnumber-currency-display-symbol" currency="CNY" currencyDisplay="symbol" :defaultValue="defaultValue" />
        <br />
        <br />
        <div id="inputnumber-currency-display-name">🇨🇳 CNY ➕ name</div>
        <InputNumber aria-labelledby="inputnumber-currency-display-name" currency="CNY" currencyDisplay="name" :defaultValue="defaultValue" />
        <br />
        <br />
    </div>
</template>
