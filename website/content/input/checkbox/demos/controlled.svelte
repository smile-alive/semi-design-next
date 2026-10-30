<script lang="ts">
    import { Button, Checkbox, type CheckboxEvent } from '@fibrae/semi-ui-svelte';

    let checked = $state(true);
    let disabled = $state(false);
    const label = $derived(`${checked ? 'Checked' : 'Unchecked'} ${disabled ? 'Disabled' : 'Enabled'}`);

    const onChange = (e: CheckboxEvent) => console.log('checked = ', e.target.checked);
</script>

<div>
    <div style="margin-bottom: 20px">
        <Checkbox aria-label="Checkbox 示例" bind:checked {disabled} {onChange}>
            {label}
        </Checkbox>
    </div>
    <p>
        <Button size="small" type="primary" onclick={() => (checked = !checked)}>{!checked ? 'Check' : 'Uncheck'}</Button>
        <Button size="small" style="margin-left: 10px" type="primary" onclick={() => (disabled = !disabled)}>
            {!disabled ? 'Disable' : 'Enable'}
        </Button>
    </p>
</div>
