<script lang="ts">
    import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-illustrations-svelte';
    import { Empty, Popover, Tag, type Position } from '@fibrae/semi-ui-svelte';

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
    const imageStyle = 'width: 150px; height: 150px';
</script>

{#snippet content()}
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

<div>
    <div style="margin-left: 80px; white-space: nowrap">
        {#each tops as [position, label] (position)}
            <Popover {content} {position}>
                <Tag style="margin: 8px; padding: 20px">{label}</Tag>
            </Popover>
        {/each}
    </div>
    <div style="width: 80px; float: left">
        {#each lefts as [position, label] (position)}
            <Popover {content} {position}>
                <Tag style="margin: 8px; padding: 20px; width: 60px">{label}</Tag>
            </Popover>
        {/each}
    </div>
    <div style="width: 40px; margin-left: 300px">
        {#each rights as [position, label] (position)}
            <Popover {content} {position}>
                <Tag style="margin: 8px; padding: 20px; width: 60px">{label}</Tag>
            </Popover>
        {/each}
    </div>
    <div style="margin-left: 80px; clear: both; white-space: nowrap">
        {#each bottoms as [position, label] (position)}
            <Popover {content} {position}>
                <Tag style="margin: 8px; padding: 20px; width: 60px">{label}</Tag>
            </Popover>
        {/each}
    </div>
</div>
