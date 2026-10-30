<script lang="ts">
    import { InputNumber } from '@fibrae/semi-ui-svelte';

    const log = (v: number | string) => {
        console.log(`Changed to: [${typeof v}] ${v}`);
    };

    const formatRmb = (value: number | string) => `￥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const parseRmb = (value: string) => value.replace(/￥\s?|(,*)/g, '');
    const formatCustom = (value: number | string) => String(value).split('').join('-');
    const parseCustom = (value: string) => value.replace(/-/g, '');
</script>

<div style="width: 180px">
    <span id="inputnumber-formatter-rmb">人民币</span>
    <InputNumber aria-labelledby="inputnumber-formatter-rmb" formatter={formatRmb} min={0} onChange={log} parser={parseRmb} value={1000} />
    <br />
    <br />

    <span id="inputnumber-formatter-custom">自定义串</span>
    <InputNumber aria-labelledby="inputnumber-formatter-custom" formatter={formatCustom} onChange={log} parser={parseCustom} value={1111} />
    <br />
</div>
