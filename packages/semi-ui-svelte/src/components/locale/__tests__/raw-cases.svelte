<script lang="ts">
    import type { LocaleInput } from '@fibrae/semi-ui-svelte/locale';
    import LocaleProvider from '../locale-provider.svelte';
    import RawProbe from './raw-probe.svelte';

    let { locale, onSeen }: { locale: LocaleInput; onSeen: (locale: LocaleInput | null) => void } = $props();
</script>

<LocaleProvider><RawProbe {onSeen} /></LocaleProvider>
<LocaleProvider {locale}>
    <RawProbe {onSeen} />
    <LocaleProvider locale={undefined}><RawProbe {onSeen} /></LocaleProvider>
    <LocaleProvider locale={null}><RawProbe {onSeen} /></LocaleProvider>
</LocaleProvider>
<RawProbe {onSeen} />
