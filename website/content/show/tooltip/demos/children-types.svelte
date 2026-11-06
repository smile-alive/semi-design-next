<script lang="ts">
    import { Space, Tag, Tooltip } from '@fibrae/semi-ui-svelte';

    const style = 'border: 2px solid var(--semi-color-border); padding-inline-start: 4px; padding-inline-end: 4px; border-radius: 4px';
</script>

<Space>
    <Tooltip>
        <Tag {style}>Component</Tag>
        {#snippet content()}semi design{/snippet}
    </Tooltip>
    <Tooltip>
        Text
        {#snippet content()}semi design{/snippet}
    </Tooltip>
    <Tooltip>
        {#snippet child({ props })}
            <span {...props} {style}>DOM</span>
        {/snippet}
        {#snippet content()}semi design{/snippet}
    </Tooltip>
</Space>
