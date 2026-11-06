<script lang="ts">
    import type { Component } from 'svelte';
    import { IconAlarm, IconBookmark, IconCamera, IconDuration, IconEdit, IconFolder } from '@fibrae/semi-icons-svelte';
    import { OverflowList, Slider, Tag } from '@fibrae/semi-ui-svelte';

    interface Item {
        icon: Component;
        key: string;
    }

    const items: Item[] = [
        { icon: IconAlarm, key: 'alarm' },
        { icon: IconBookmark, key: 'bookmark' },
        { icon: IconCamera, key: 'camera' },
        { icon: IconDuration, key: 'duration' },
        { icon: IconEdit, key: 'edit' },
        { icon: IconFolder, key: 'folder' },
    ];
    let width = $state<number | number[]>(100);
</script>

<div>
    <Slider aria-label="Container width" bind:value={width} step={1} />
    <br />
    <br />
    <div style="width: {width}%">
        <OverflowList {items} minVisibleItems={3}>
            {#snippet item({ item })}
                <Tag color="blue" style="margin-inline-end: 8px; flex: 0 0 auto">
                    <item.icon style="margin-inline-end: 4px" />
                    {item.key}
                </Tag>
            {/snippet}
            {#snippet overflow({ items: hidden })}
                {#if hidden.length}
                    <Tag style="flex: 0 0 auto; font-variant-numeric: tabular-nums">+{hidden.length}</Tag>
                {/if}
            {/snippet}
        </OverflowList>
    </div>
</div>
