<script lang="ts">
    import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-illustrations-svelte';
    import { Empty, Popover, Space, Tag } from '@fibrae/semi-ui-svelte';

    const style = 'border: 2px solid var(--semi-color-border); padding-inline-start: 4px; padding-inline-end: 4px; border-radius: 4px';
</script>

{#snippet card()}
    <Empty style="width: 400px; margin: 0 auto; display: flex; padding: 20px" title="先进的设计 / 研发协作方式">
        {#snippet image()}
            <IllustrationSuccess style="width: 150px; height: 150px" />
        {/snippet}
        {#snippet darkModeImage()}
            <IllustrationSuccessDark style="width: 150px; height: 150px" />
        {/snippet}
        {#snippet description()}使用 Semi D2C 快速还原 Figma 设计稿，一键转代码{/snippet}
    </Empty>
{/snippet}

<Space>
    <Popover content={card}>
        <Tag {style}>Component</Tag>
    </Popover>
    <Popover content={card}>Text</Popover>
    <Popover content={card}>
        {#snippet child({ props })}
            <span {...props} {style}>DOM</span>
        {/snippet}
    </Popover>
</Space>
