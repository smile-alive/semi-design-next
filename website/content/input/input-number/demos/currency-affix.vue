<script setup lang="ts">
    import { InputNumber } from '@fibrae/semi-ui-vue';

    const defaultValue = 123456.78;
</script>

<template>
    <div>
        <div id="inputnumber-currency-affix-code">🇨🇳 CNY ➕ code</div>
        <InputNumber aria-labelledby="inputnumber-currency-affix-code" currency="CNY" :defaultValue="defaultValue" :showCurrencySymbol="false" style="width: 200px">
            <template #prefix>CNY</template>
        </InputNumber>
        <br />
        <br />
        <div id="inputnumber-currency-affix-symbol">🇨🇳 CNY ➕ symbol</div>
        <InputNumber aria-labelledby="inputnumber-currency-affix-symbol" currency="CNY" :defaultValue="defaultValue" :showCurrencySymbol="false" style="width: 200px">
            <template #prefix>￥</template>
        </InputNumber>
        <br />
        <br />
        <div id="inputnumber-currency-affix-name">🇨🇳 CNY ➕ name</div>
        <InputNumber aria-labelledby="inputnumber-currency-affix-name" currency="CNY" :defaultValue="defaultValue" :showCurrencySymbol="false" style="width: 200px">
            <template #suffix>人民币</template>
        </InputNumber>
        <br />
        <br />
    </div>
</template>
