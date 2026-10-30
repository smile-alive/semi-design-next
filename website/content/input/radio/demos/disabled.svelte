<script lang="ts">
    import { Button, Radio } from '@fibrae/semi-ui-svelte';

    let disabled = $state(true);
</script>

<div>
    <Radio aria-label="单选示例" checked={false} {disabled} name="demo-radio-disabled">Disabled</Radio>
    <br />
    <Radio aria-label="单选示例" checked {disabled} name="demo-radio-defaultChecked-disabled">Disabled</Radio>
    <div style="margin-top: 20px">
        <Button type="primary" onclick={() => (disabled = !disabled)}>Toggle disabled</Button>
    </div>
</div>
