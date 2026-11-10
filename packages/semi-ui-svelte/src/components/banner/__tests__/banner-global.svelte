<script lang="ts">
    import { setContext } from 'svelte';
    import { type SemiGlobal, semiGlobalKey } from '@fibrae/semi-ui-svelte/utils';
    import Banner from '../banner.svelte';

    let { semi }: { semi: SemiGlobal } = $props();

    // an app-scoped instance supplied by an ancestor; the fixture's `semi` never changes, so the one-time read is intended
    const provide = () => setContext(semiGlobalKey, semi);
    provide();
</script>

<Banner />
<Banner fullMode type="success" />
