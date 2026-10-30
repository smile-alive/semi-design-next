<script lang="ts">
    import { Tag, Tooltip, type Position } from '@fibrae/semi-ui-svelte';

    const tops: [Position, string][] = [
        ['topLeft', 'TL'],
        ['top', 'Top'],
        ['topRight', 'TR'],
    ];
    const lefts: [Position, string][] = [
        ['leftTop', 'LT'],
        ['left', 'Left'],
        ['leftBottom', 'LB'],
    ];
    const rights: [Position, string][] = [
        ['rightTop', 'RT'],
        ['right', 'Right'],
        ['rightBottom', 'RB'],
    ];
    const bottoms: [Position, string][] = [
        ['bottomLeft', 'BL'],
        ['bottom', 'Bottom'],
        ['bottomRight', 'BR'],
    ];
</script>

{#snippet bubble()}
    <article>
        <p>hi bytedance</p>
        <p>hi bytedance</p>
    </article>
{/snippet}

<div>
    <div style="margin-left: 80px; white-space: nowrap">
        {#each tops as [position, label] (position)}
            <Tooltip arrowPointAtCenter={false} content={bubble} {position}>
                <Tag style="margin: 8px; padding: 20px">{label}</Tag>
            </Tooltip>
        {/each}
    </div>
    <div style="width: 80px; float: left">
        {#each lefts as [position, label] (position)}
            <Tooltip arrowPointAtCenter={false} content={bubble} {position}>
                <Tag style="margin: 8px; padding: 20px; width: 60px">{label}</Tag>
            </Tooltip>
        {/each}
    </div>
    <div style="width: 40px; margin-left: 300px">
        {#each rights as [position, label] (position)}
            <Tooltip arrowPointAtCenter={false} content={bubble} {position}>
                <Tag style="margin: 8px; padding: 20px; width: 60px">{label}</Tag>
            </Tooltip>
        {/each}
    </div>
    <div style="margin-left: 80px; clear: both; white-space: nowrap">
        {#each bottoms as [position, label] (position)}
            <Tooltip arrowPointAtCenter={false} content={bubble} {position}>
                <Tag style="margin: 8px; padding: 20px; width: 60px">{label}</Tag>
            </Tooltip>
        {/each}
    </div>
</div>
