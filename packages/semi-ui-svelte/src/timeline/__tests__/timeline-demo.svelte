<script lang="ts">
    import { Timeline } from '../index';
    import type { TimelineProps } from '../interface';

    // `snippets` picks which Timeline snippets the fixture supplies
    let { snippets = [], ...props }: TimelineProps & { snippets?: Array<'content' | 'dot' | 'time' | 'extra' | 'button-extra'> } = $props();

    // 'dot' gives only the second item a dot snippet
    const dataSource = $derived(snippets.includes('dot') ? props.dataSource?.map((item, index) => (index === 1 ? { ...item, dot: ownDot } : item)) : props.dataSource);
</script>

{#snippet content({ item, index }: { item: { content?: string | number }; index: number })}
    {#if index === 1}<strong class="rich">{item.content}</strong>{:else}{item.content}{/if}
{/snippet}
{#snippet ownDot()}<i class="own-dot"></i>{/snippet}
{#snippet time({ item, index }: { item: { time?: string | number }; index: number })}
    {#if index === 0}<em>{item.time}!</em>{:else}{item.time}{/if}
{/snippet}
{#snippet extra({ item, index }: { item: { extra?: string | number }; index: number })}{index}:{item.extra}{/snippet}
{#snippet buttonExtra()}<button type="button">more</button>{/snippet}

<Timeline {...props} content={snippets.includes('content') ? content : undefined} {dataSource} extra={snippets.includes('extra') ? extra : snippets.includes('button-extra') ? buttonExtra : undefined} time={snippets.includes('time') ? time : undefined} />
