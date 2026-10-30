<script lang="ts">
    import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-illustrations-svelte';
    import { Empty, Popover, Tag } from '@fibrae/semi-ui-svelte';

    const imageStyle = 'width: 150px; height: 150px';
</script>

{#snippet card()}
    <Empty style="width: 400px; margin: 0 auto; display: flex; padding: 20px" title="先进的设计 / 研发协作方式">
        {#snippet image()}
            <IllustrationSuccess style={imageStyle} />
        {/snippet}
        {#snippet darkModeImage()}
            <IllustrationSuccessDark style={imageStyle} />
        {/snippet}
        {#snippet description()}使用 Semi D2C 快速还原 Figma 设计稿，一键转代码{/snippet}
    </Empty>
{/snippet}

<Popover content={card}>
    <Tag>悬停此处</Tag>
</Popover>
