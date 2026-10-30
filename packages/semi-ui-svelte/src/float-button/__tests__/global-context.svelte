<script lang="ts">
    import { setContext } from 'svelte';
    import { type SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
    import FloatButtonGroup from '../float-button-group.svelte';
    import FloatButton from '../float-button.svelte';

    let { semi }: { semi: SemiGlobal } = $props();

    // an app-scoped instance supplied by an ancestor; the fixture's `semi` never changes, so the one-time read is intended
    const provide = () => setContext(semiGlobalKey, semi);
    provide();
</script>

<FloatButton />
<FloatButton shape="round" />
<FloatButton shape={undefined} />
<FloatButtonGroup items={[{ content: 'A' }]} />
<FloatButtonGroup disabled={false} items={[{ content: 'B' }]} />
