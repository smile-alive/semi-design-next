<script lang="ts">
    import { Button, Popconfirm, Tooltip } from '@fibrae/semi-ui-svelte';
</script>

<Popconfirm style="width: 320px">
    {#snippet child({ props })}
        <span {...props} style="display: inline-block" tabindex="-1">
            <Tooltip>
                {#snippet child({ props })}
                    <Button {...props} type="danger">删除</Button>
                {/snippet}
                {#snippet content()}删除评价{/snippet}
            </Tooltip>
        </span>
    {/snippet}
    {#snippet title()}确认{/snippet}
    {#snippet content()}是否确认删除{/snippet}
</Popconfirm>
