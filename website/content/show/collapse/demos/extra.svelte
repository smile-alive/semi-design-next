<script lang="ts">
    import { IconCopy } from '@fibrae/semi-icons-svelte';
    import { Collapse, Tag } from '@fibrae/semi-ui-svelte';
</script>

<Collapse>
    <Collapse.Panel itemKey="1">
        {#snippet header()}This is panel header 1{/snippet}
        {#snippet extra()}1234{/snippet}
        <p>Hi, bytedance dance dance. This is the docsite of Semi UI.</p>
    </Collapse.Panel>
    <Collapse.Panel itemKey="2">
        {#snippet header()}This is panel header 2{/snippet}
        {#snippet extra()}
            <IconCopy />
        {/snippet}
        <p>Hi, bytedance dance dance. This is the docsite of Semi UI.</p>
    </Collapse.Panel>
    <Collapse.Panel itemKey="3">
        {#snippet header()}This is panel header 3{/snippet}
        {#snippet extra()}
            <Tag color="violet" style="margin: 0">Recommended</Tag>
        {/snippet}
        <p>Hi, bytedance dance dance. This is the docsite of Semi UI.</p>
    </Collapse.Panel>
</Collapse>
