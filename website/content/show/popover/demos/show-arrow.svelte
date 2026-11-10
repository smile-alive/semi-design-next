<script lang="ts">
    import { Popover, Tag, type Position } from '@fibrae/semi-ui-svelte';

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

{#snippet content()}
    <article>
        Hi Semi, this is a popover.
        <br />
        We have 2 lines.
    </article>
{/snippet}

<div class="tag-margin-right" style="padding-inline-start: 40px">
    <div style="margin-inline-start: 40px; white-space: nowrap">
        {#each tops as [position, label] (position)}
            <Popover {content} {position} showArrow>
                <Tag>{label}</Tag>
            </Popover>
        {/each}
    </div>
    <div style="width: 40px; float: left">
        {#each lefts as [position, label] (position)}
            <Popover {content} {position} showArrow>
                <Tag>{label}</Tag>
            </Popover>
        {/each}
    </div>
    <div style="width: 40px; margin-inline-start: 180px">
        {#each rights as [position, label] (position)}
            <Popover {content} {position} showArrow>
                <Tag>{label}</Tag>
            </Popover>
        {/each}
    </div>
    <div style="margin-inline-start: 40px; clear: both; white-space: nowrap">
        {#each bottoms as [position, label] (position)}
            <Popover {content} {position} showArrow>
                <Tag>{label}</Tag>
            </Popover>
        {/each}
    </div>
</div>
