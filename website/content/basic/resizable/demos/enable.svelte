<script lang="ts">
    import { Resizable, Switch, Typography } from '@fibrae/semi-ui-svelte';

    let enabled = $state(false);
</script>

<div style="width: 500px; height: 60%">
    <div style="display: flex; align-items: center; margin: 8px">
        <Switch aria-labelledby="resizable-enable-state" bind:checked={enabled} />
        <Typography.Title heading={6} id="resizable-enable-state" style="margin: 8px">
            {enabled ? 'able' : 'disable'}
        </Typography.Title>
    </div>
    <Resizable defaultSize={{ width: 200, height: 200 }} enable={{ left: enabled }} style="background-color: var(--semi-grey-1)">
        <div style="margin-inline-start: 20%">{'enable.left:' + enabled}</div>
    </Resizable>
</div>
