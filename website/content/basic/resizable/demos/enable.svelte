<script lang="ts">
    import { Resizable, Switch, TypographyTitle } from '@fibrae/semi-ui-svelte';

    let enabled = $state(false);
</script>

<div style="width: 500px; height: 60%">
    <div style="display: flex; align-items: center; margin: 8px">
        <Switch aria-labelledby="resizable-enable-state" bind:checked={enabled} />
        <TypographyTitle heading={6} id="resizable-enable-state" style="margin: 8px">
            {enabled ? 'able' : 'disable'}
        </TypographyTitle>
    </div>
    <Resizable defaultSize={{ width: 200, height: 200 }} enable={{ left: enabled }} style="background-color: var(--semi-grey-1)">
        <div style="margin-left: 20%">{'enable.left:' + enabled}</div>
    </Resizable>
</div>
