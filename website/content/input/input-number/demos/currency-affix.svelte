<script lang="ts">
    import { InputNumber } from '@fibrae/semi-ui-svelte';

    const value = 123456.78;
</script>

<div>
    <div id="inputnumber-currency-affix-code">🇨🇳 CNY ➕ code</div>
    <InputNumber aria-labelledby="inputnumber-currency-affix-code" currency="CNY" showCurrencySymbol={false} style="width: 200px" {value}>
        {#snippet prefix()}CNY{/snippet}
    </InputNumber>
    <br />
    <br />
    <div id="inputnumber-currency-affix-symbol">🇨🇳 CNY ➕ symbol</div>
    <InputNumber aria-labelledby="inputnumber-currency-affix-symbol" currency="CNY" showCurrencySymbol={false} style="width: 200px" {value}>
        {#snippet prefix()}￥{/snippet}
    </InputNumber>
    <br />
    <br />
    <div id="inputnumber-currency-affix-name">🇨🇳 CNY ➕ name</div>
    <InputNumber aria-labelledby="inputnumber-currency-affix-name" currency="CNY" showCurrencySymbol={false} style="width: 200px" {value}>
        {#snippet suffix()}人民币{/snippet}
    </InputNumber>
    <br />
    <br />
</div>
