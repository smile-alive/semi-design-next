<script lang="ts">
    import { ColorPicker, colorStringToValue, type ColorValue } from '@fibrae/semi-ui-svelte';

    // a one-way value only seeds the picker, which then manages its own color
    const value = colorStringToValue('rgb(57,197,187)');

    let hex = $state(value.hex);

    const onChange = (next: ColorValue) => {
        hex = next.hex;
    };
</script>

<div>
    <ColorPicker alpha {onChange} {value} />
    <p>当前颜色：{hex}</p>
</div>
