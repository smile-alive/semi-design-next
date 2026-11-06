<script lang="ts">
    import { Button, ColorPicker } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <ColorPicker alpha onChange={(value) => console.log(value)} usePopover />
    <br />
    <div>自定义 trigger</div>
    <ColorPicker alpha onChange={(value) => console.log(value)} usePopover>
        <Button>Trigger</Button>
    </ColorPicker>
</div>
