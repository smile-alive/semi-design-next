<script lang="ts">
    import { Button, Popover, Space, Switch, Typography } from '@fibrae/semi-ui-svelte';

    let enabled = $state(true);
    const text = $derived(`condition is ${enabled ? 'true' : 'false'}`);
</script>

{#snippet content()}{text}{/snippet}

<Space align="center">
    <Typography.Text id="popover-condition-label">condition</Typography.Text>
    <Switch aria-labelledby="popover-condition-label" bind:checked={enabled} />
    <Popover condition={enabled} {content}>
        {#snippet child({ props })}
            <Button {...props}>Hover me</Button>
        {/snippet}
    </Popover>
    <Popover condition={enabled} {content} trigger="click">
        {#snippet child({ props })}
            <Button {...props}>Click me</Button>
        {/snippet}
    </Popover>
</Space>
