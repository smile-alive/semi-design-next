<script lang="ts">
    import { InputNumber } from '@fibrae/semi-ui-svelte';
</script>

<div style="width: 280px">
    <span id="inputnumber-basic-more-default-value">设置了默认值 value=1 </span>
    <InputNumber aria-labelledby="inputnumber-basic-more-default-value" value={1} />
    <br />
    <br />

    <span id="inputnumber-basic-more-disabled">禁用 disabled=true</span>
    <InputNumber aria-labelledby="inputnumber-basic-more-disabled" disabled value={2} />
    <br />
    <br />

    <span id="inputnumber-basic-more-precision">设置了小数位数 precision=2 </span>
    <InputNumber aria-labelledby="inputnumber-basic-more-precision" precision={2} value={1.234} />
    <br />
    <br />

    <span id="inputnumber-basic-more-inner-buttons">设置了 innerButtons=true </span>
    <InputNumber aria-labelledby="inputnumber-basic-more-inner-buttons" innerButtons style="width: 190px" value={1}>
        {#snippet suffix()}小时{/snippet}
    </InputNumber>
    <br />
</div>
