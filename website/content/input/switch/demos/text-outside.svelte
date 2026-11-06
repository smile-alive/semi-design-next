<script lang="ts">
    import { Switch, Typography } from '@fibrae/semi-ui-svelte';

    let open = $state<boolean>();
</script>

<div style="display: flex; align-items: center">
    <Typography.Title heading={6} style="margin: 8px">{open ? '已开启' : '已关闭'}</Typography.Title>
    <Switch aria-label="a switch for demo" bind:checked={open} />
</div>
