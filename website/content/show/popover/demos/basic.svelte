<script lang="ts">
    import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-icons-svelte/illustrations';
    import { Empty, Popover, Tag } from '@fibrae/semi-ui-svelte';
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

<Popover content={card}>
    <Tag>悬停此处</Tag>
</Popover>
