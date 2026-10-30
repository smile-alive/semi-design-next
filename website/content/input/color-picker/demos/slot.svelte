<script lang="ts">
    import { ColorPicker, type ColorValue } from '@fibrae/semi-ui-svelte';

    let hex = $state('');

    const onChange = (value: ColorValue) => {
        hex = value.hex;
    };
</script>

<ColorPicker alpha {onChange}>
    {#snippet topSlot()}
        <div>TopSlot</div>
    {/snippet}
    {#snippet bottomSlot()}
        <div>Bottom Slot</div>
    {/snippet}
</ColorPicker>
<p>当前颜色：{hex}</p>
