<script lang="ts">
    import { InputNumber } from '@fibrae/semi-ui-svelte';

    const value = 123456.78;
</script>

<div>
    <div id="inputnumber-currency-locale-cny">🇨🇳 人民币</div>
    <InputNumber aria-labelledby="inputnumber-currency-locale-cny" currency="CNY" localeCode="zh-CN" {value} />
    <br />
    <br />
    <div id="inputnumber-currency-locale-eur">🇪🇺 欧元</div>
    <InputNumber aria-labelledby="inputnumber-currency-locale-eur" currency="EUR" localeCode="de-DE" {value} />
    <br />
    <br />
    <div id="inputnumber-currency-locale-jpy">🇯🇵 日元</div>
    <InputNumber aria-labelledby="inputnumber-currency-locale-jpy" currency="JPY" localeCode="ja-JP" {value} />
    <br />
    <br />
    <div id="inputnumber-currency-locale-vnd">🇻🇳 越南盾</div>
    <InputNumber aria-labelledby="inputnumber-currency-locale-vnd" currency="VND" localeCode="vi-VN" {value} />
    <br />
    <br />
</div>
