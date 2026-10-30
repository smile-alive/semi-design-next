<script lang="ts">
    import { IconMinus, IconPlus } from '@fibrae/semi-icons-svelte';
    import { Collapse, CollapsePanel } from '@fibrae/semi-ui-svelte';
</script>

<Collapse>
    {#snippet expandIcon()}
        <IconPlus />
    {/snippet}
    {#snippet collapseIcon()}
        <IconMinus />
    {/snippet}
    <CollapsePanel itemKey="1">
        {#snippet header()}This is panel header 1{/snippet}
        <p>Hi, bytedance dance dance. This is the docsite of Semi UI.</p>
    </CollapsePanel>
    <CollapsePanel itemKey="2">
        {#snippet header()}This is panel header 2{/snippet}
        <p>Hi, bytedance dance dance. This is the docsite of Semi UI.</p>
    </CollapsePanel>
    <CollapsePanel itemKey="3">
        {#snippet header()}This is panel header 3{/snippet}
        <p>Hi, bytedance dance dance. This is the docsite of Semi UI.</p>
    </CollapsePanel>
</Collapse>
