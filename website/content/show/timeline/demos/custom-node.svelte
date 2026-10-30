<script lang="ts">
    import { IconAlertTriangle } from '@fibrae/semi-icons-svelte';
    import { Timeline, type TimelineData } from '@fibrae/semi-ui-svelte';

    const dataSource: TimelineData[] = [
        { time: '2019-07-14 10:35', content: '默认样式的节点' },
        { time: '2019-06-13 16:17', content: '自定义图标', type: 'warning', dot: warningDot },
        { time: '2019-05-14 18:34', content: '自定义节点颜色', color: 'pink' },
        { time: '2019-04-10 12:20', content: '自定义节点样式' },
    ];
</script>

{#snippet warningDot()}<IconAlertTriangle />{/snippet}

<Timeline {dataSource}>
    {#snippet content({ item, index })}
        {#if index === 3}
            <span style="font-size: 18px">{item.content}</span>
        {:else}
            {item.content}
        {/if}
    {/snippet}
</Timeline>
