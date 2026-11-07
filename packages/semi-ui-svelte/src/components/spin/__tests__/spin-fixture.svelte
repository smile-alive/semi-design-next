<script lang="ts">
    import type { SpinProps } from '../interface';
    import Spin from '../spin.svelte';

    // each snippet is passed only when its flag is on, so absence stays observable
    let { store }: { store: { props: SpinProps; content?: boolean; tip?: string; indicator?: boolean; button?: boolean } } = $props();
</script>

{#snippet indicator()}<i data-testid="indicator"></i>{/snippet}
{#snippet tip()}<span>{store.tip}</span>{/snippet}
{#snippet content()}
    {#if store.button}<button type="button">inside</button>{:else}<p>content</p>{/if}
{/snippet}

<Spin {...store.props} children={store.content || store.button ? content : undefined} indicator={store.indicator ? indicator : undefined} tip={store.tip ? tip : undefined} />
<button type="button">after</button>
