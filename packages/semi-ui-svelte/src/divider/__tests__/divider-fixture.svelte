<script lang="ts">
    import Divider from '../divider.svelte';
    import type { DividerProps } from '../interface';

    let { store }: { store: { props: DividerProps; content?: 'text' | 'element' } } = $props();
</script>

{#snippet text()}title{/snippet}
{#snippet element()}<svg data-testid="icon"></svg>{/snippet}

<Divider {...store.props} children={store.content === 'text' ? text : store.content === 'element' ? element : undefined} />
