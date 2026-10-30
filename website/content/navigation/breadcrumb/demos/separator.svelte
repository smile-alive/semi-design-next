<script lang="ts">
    import { IconArrowRight } from '@fibrae/semi-icons-svelte';
    import { Breadcrumb, Tag } from '@fibrae/semi-ui-svelte';
</script>

<!-- Several breadcrumbs on one page are told apart by aria-label -->
<div>
    <Breadcrumb aria-label="文字分隔符" routes={['Semi-ui', 'Breadcrumb', 'Default']} separator=">" />
    <br />
    <Breadcrumb aria-label="图标分隔符" routes={['Semi-ui', 'Breadcrumb', 'Default']}>
        {#snippet separator()}
            <IconArrowRight size="small" />
        {/snippet}
    </Breadcrumb>
    <br />
    <Tag>v&gt;=1.16.0</Tag>
    <br />
    <Breadcrumb aria-label="单项分隔符" routes={[{ name: 'Semi-ui', separator: ':' }, 'Breadcrumb', 'Default']} />
</div>
