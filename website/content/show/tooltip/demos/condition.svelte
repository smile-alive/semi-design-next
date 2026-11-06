<script lang="ts">
    import { Button, Space, Switch, Tooltip, Typography } from '@fibrae/semi-ui-svelte';

    let enabled = $state(true);
    const text = $derived(`condition is ${enabled ? 'true' : 'false'}`);
</script>

<Space align="center">
    <Typography.Text id="tooltip-condition-label">condition</Typography.Text>
    <Switch aria-labelledby="tooltip-condition-label" bind:checked={enabled} />
    <Tooltip condition={enabled} trigger="hover">
        {#snippet child({ props })}
            <Button {...props}>Hover me</Button>
        {/snippet}
        {#snippet content()}{text}{/snippet}
    </Tooltip>
    <Tooltip condition={enabled} trigger="click">
        {#snippet child({ props })}
            <Button {...props}>Click me</Button>
        {/snippet}
        {#snippet content()}{text}{/snippet}
    </Tooltip>
</Space>
