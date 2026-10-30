<script lang="ts">
    import { Switch } from '@fibrae/semi-ui-svelte';

    let open = $state<boolean>();
</script>

<div style="display: flex; align-items: center">
    <span style="margin: 8px; font-weight: 600">{open ? '已开启' : '已关闭'}</span>
    <Switch aria-label="示例开关" bind:checked={open} />
</div>
