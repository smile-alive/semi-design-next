<script lang="ts">
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import type { LocaleComponentName, LocaleResult } from '../interface';
    import Nest, { type Layer } from './nest.svelte';
    import Probe from './probe.svelte';

    let { store }: { store: { chain: Layer[]; componentName?: LocaleComponentName; onSeen?: (value: LocaleResult<Locale[LocaleComponentName]>) => void } } = $props();
</script>

<Nest chain={store.chain}>
    <Probe componentName={store.componentName} onSeen={store.onSeen} />
</Nest>
