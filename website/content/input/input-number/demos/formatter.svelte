<script lang="ts">
    import { InputNumber } from '@fibrae/semi-ui-svelte';

    const log = (v: number | string) => {
        console.log(`Changed to: [${typeof v}] ${v}`);
    };
</script>

<div style="width: 180px">
    <span id="inputnumber-formatter-rmb">人民币</span>
    <InputNumber aria-labelledby="inputnumber-formatter-rmb" formatter={(value) => `￥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} min={0} onChange={log} parser={(value) => value.replace(/￥\s?|(,*)/g, '')} value={1000} />
    <br />
    <br />

    <span id="inputnumber-formatter-custom">自定义串</span>
    <InputNumber aria-labelledby="inputnumber-formatter-custom" formatter={(value) => String(value).split('').join('-')} onChange={log} parser={(value) => value.replace(/-/g, '')} value={1111} />
    <br />
</div>
