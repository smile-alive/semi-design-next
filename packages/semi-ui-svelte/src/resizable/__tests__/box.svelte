<script lang="ts">
    import { Resizable, type ResizableProps } from '..';

    let { wrapper = 'width: 1000px; height: 800px', content = false, ...props }: ResizableProps & { wrapper?: string; content?: boolean } = $props();
</script>

<div style={wrapper}>
    <Resizable {...props}>
        {#if content}
            <span class="child">content</span>
        {/if}
    </Resizable>
</div>
