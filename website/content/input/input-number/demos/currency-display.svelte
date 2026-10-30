<script lang="ts">
    import { InputNumber } from '@fibrae/semi-ui-svelte';

    const value = 123456.78;
</script>

<div>
    <div id="inputnumber-currency-display-code">🇨🇳 CNY ➕ code</div>
    <InputNumber aria-labelledby="inputnumber-currency-display-code" currency="CNY" currencyDisplay="code" {value} />
    <br />
    <br />
    <div id="inputnumber-currency-display-symbol">🇨🇳 CNY ➕ symbol</div>
    <InputNumber aria-labelledby="inputnumber-currency-display-symbol" currency="CNY" currencyDisplay="symbol" {value} />
    <br />
    <br />
    <div id="inputnumber-currency-display-name">🇨🇳 CNY ➕ name</div>
    <InputNumber aria-labelledby="inputnumber-currency-display-name" currency="CNY" currencyDisplay="name" {value} />
    <br />
    <br />
</div>
