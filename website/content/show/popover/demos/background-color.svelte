<script lang="ts">
    import { Popover, Tag } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Popover aria-label="Colorful Popover" position="right" showArrow style="background-color: var(--semi-blue-6); border-color: var(--semi-blue-6); color: var(--semi-color-white); border-width: 1px; border-style: solid" trigger="custom" visible>
        <Tag style="background-color: var(--semi-blue-6); color: var(--semi-color-white)">Colorful Popover</Tag>
        {#snippet content()}
            <article style="padding: 4px">Hi, Semi UI Popover.</article>
        {/snippet}
    </Popover>
</div>
