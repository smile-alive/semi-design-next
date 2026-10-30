<script lang="ts">
    import type { Component } from 'svelte';
    import { IconAlarm, IconBookmark, IconCamera, IconDuration, IconEdit, IconFolder } from '@fibrae/semi-icons-svelte';
    import { OverflowList, Slider, Tag } from '@fibrae/semi-ui-svelte';

    interface Item {
        key: string;
    }

    const icons: Record<string, Component> = {
        alarm: IconAlarm,
        bookmark: IconBookmark,
        camera: IconCamera,
        duration: IconDuration,
        edit: IconEdit,
        folder: IconFolder,
    };
    const items: Item[] = Object.keys(icons).map((key) => ({ key }));
    let width = $state<number | number[]>(100);
</script>

<div>
    <Slider aria-label="Container width" bind:value={width} step={1} />
    <br />
    <br />
    <div style="width: {width}%">
        <OverflowList {items} minVisibleItems={3}>
            {#snippet item({ item })}
                {@const Icon = icons[item.key]}
                <Tag color="blue" style="margin-right: 8px; flex: 0 0 auto">
                    <Icon style="margin-right: 4px" />
                    <span>{item.key}</span>
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
