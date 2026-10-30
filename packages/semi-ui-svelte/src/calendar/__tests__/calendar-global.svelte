<script lang="ts">
    import { setContext } from 'svelte';
    import { type SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
    import Calendar from '../calendar.svelte';

    let { semi }: { semi: SemiGlobal } = $props();

    // an app-scoped instance supplied by an ancestor; the fixture's `semi` never changes, so the one-time read is intended
    const provide = () => setContext(semiGlobalKey, semi);
    provide();
</script>

<Calendar />
