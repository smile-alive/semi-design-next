<script lang="ts">
    import type { SwitchProps } from '../interface';
    import Switch from '../switch.svelte';

    // the text snippets are passed only when `texts` is on, so absence stays observable
    let { store }: { store: { props: SwitchProps; texts?: boolean } } = $props();
</script>

{#snippet on()}<span>ON</span>{/snippet}
{#snippet off()}<span>OFF</span>{/snippet}

<Switch {...store.props} checkedText={store.texts ? on : undefined} uncheckedText={store.texts ? off : undefined} />
<button type="button">after</button>
