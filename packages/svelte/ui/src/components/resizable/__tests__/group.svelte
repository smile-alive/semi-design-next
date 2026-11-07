<script lang="ts">
    import { ResizeGroup, ResizeHandler, ResizeItem, type ResizeHandlerProps, type ResizeItemProps } from '..';

    let { direction, items = [{}, {}], width = '1010px', height = '500px', handlerProps = {} }: { direction?: 'horizontal' | 'vertical'; items?: ResizeItemProps[]; width?: string; height?: string; handlerProps?: ResizeHandlerProps } = $props();
</script>

<div style={`width: ${width}; height: ${height}`}>
    <ResizeGroup class="custom" data-testid="group" {direction}>
        {#each items as item, i (i)}
            {#if i > 0}
                <ResizeHandler {...handlerProps} />
            {/if}
            <ResizeItem {...item}>item {i}</ResizeItem>
        {/each}
    </ResizeGroup>
</div>
