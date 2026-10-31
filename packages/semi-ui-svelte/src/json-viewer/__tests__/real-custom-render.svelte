<script lang="ts">
    import Popover from '../../popover/popover.svelte';
    import Rating from '../../rating/rating.svelte';
    import type { JsonViewerCustomRenderArgs, JsonViewerOptions } from '../interface';
    import JsonViewer from '../json-viewer.svelte';

    let { value }: { value: string } = $props();

    const options: JsonViewerOptions = {
        readOnly: true,
        customRenderRule: [
            { name: 'name', match: 'Mark' },
            { name: 'age', match: (value, path) => typeof value === 'number' && path.endsWith('.age') },
        ],
    };
</script>

{#snippet details()}
    Mark details
{/snippet}

{#snippet token({ item, content: text }: JsonViewerCustomRenderArgs)}
    {#if item.name === 'name'}
        <Popover aria-label="Mark details" content={details} trigger="click"><span class="name-token">{text}</span></Popover>
    {:else}
        <Rating class="age-token" disabled size="small" value={Number(text)} />
    {/if}
{/snippet}

<JsonViewer customRender={token} height={200} {options} {value} width={700} />
