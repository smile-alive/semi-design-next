<script lang="ts">
    import { InputNumber } from '@fibrae/semi-ui-svelte';
</script>

<div style="width: 280px">
    <span id="inputnumber-basic-simple">简单数字输入框</span>
    <InputNumber aria-labelledby="inputnumber-basic-simple" />
    <br />
    <br />

    <span id="inputnumber-basic-step">设置了步长 step=2 </span>
    <InputNumber aria-labelledby="inputnumber-basic-step" step={2} />
    <br />
    <br />

    <span id="inputnumber-basic-shift-step">设置 shiftStep=100， 按住 shift 同时点击按钮，可以一次增加/减少100 </span>
    <InputNumber aria-labelledby="inputnumber-basic-shift-step" shiftStep={100} />
    <br />
    <br />

    <span id="inputnumber-basic-range">设置了上下界 min=1,max=10</span>
    <InputNumber aria-labelledby="inputnumber-basic-range" max={10} min={1} value={1} />
    <br />
    <br />
</div>
