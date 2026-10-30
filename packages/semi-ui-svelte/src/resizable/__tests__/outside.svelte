<script lang="ts">
    import { Resizable, ResizeGroup, ResizeHandler, ResizeItem } from '..';

    let { mode }: { mode: 'single' | 'group' } = $props();
</script>

{#if mode === 'single'}
    <div style="display: flex; align-items: flex-start">
        <Resizable defaultSize={{ width: 200, height: 100 }} />
        <div data-testid="outside" style="width: 200px; height: 100px"></div>
    </div>
{:else}
    <div style="display: flex">
        <div style="width: 400px; height: 100px">
            <ResizeGroup>
                <ResizeItem />
                <ResizeHandler />
                <ResizeItem />
            </ResizeGroup>
        </div>
        <div data-testid="outside" style="width: 200px; height: 100px"></div>
    </div>
{/if}
