<script lang="ts">
    import { Button, ColorPicker, type ColorValue } from '@fibrae/semi-ui-svelte';

    let hex = $state('');

    const onChange = (value: ColorValue) => {
        hex = value.hex;
    };
</script>

<div>
    <ColorPicker alpha {onChange} usePopover />
    <br />
    <div>自定义 trigger</div>
    <ColorPicker alpha {onChange} usePopover>
        <Button>Trigger</Button>
    </ColorPicker>
    <p>当前颜色：{hex}</p>
</div>
