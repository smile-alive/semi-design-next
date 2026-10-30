<script lang="ts">
    import { Button, Tooltip } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Tooltip position="topLeft">
        {#snippet child({ props })}
            <Button {...props} style="margin-right: 8px" type="secondary">指向元素中心</Button>
        {/snippet}
        {#snippet content()}semi design tooltip{/snippet}
    </Tooltip>
</div>

<div style="margin-top: 20px">
    <Tooltip arrowPointAtCenter={false} position="topLeft">
        {#snippet child({ props })}
            <Button {...props} style="margin-right: 8px; width: 120px" type="secondary">边缘对齐</Button>
        {/snippet}
        {#snippet content()}semi design tooltip{/snippet}
    </Tooltip>
</div>
