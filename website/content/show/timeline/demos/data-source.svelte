<script lang="ts">
    import { IconAlertTriangle } from '@fibrae/semi-icons-svelte';
    import { Timeline, type TimelineData } from '@fibrae/semi-ui-svelte';

    const dataSource: TimelineData[] = [
        {
            time: '2019-07-14 10:35',
            extra: '节点辅助说明信息',
            content: '第一个节点内容',
            type: 'ongoing',
        },
        {
            time: '2019-06-13 16:17',
            extra: '节点辅助说明信息',
            content: '第二个节点内容',
            color: 'pink',
        },
        {
            time: '2019-05-14 18:34',
            extra: '节点辅助说明信息',
            content: '第三个节点内容',
            type: 'warning',
            dot: warningDot,
        },
        {
            time: '2019-05-09 09:12',
            extra: '节点辅助说明信息',
            content: '第四个节点内容',
            type: 'success',
        },
    ];
</script>

{#snippet warningDot()}<IconAlertTriangle />{/snippet}

<Timeline {dataSource} mode="alternate">
    {#snippet content({ item, index })}
        {#if index === 1}
            <span style="font-size: 18px">{item.content}</span>
        {:else}
            {item.content}
        {/if}
    {/snippet}
</Timeline>
