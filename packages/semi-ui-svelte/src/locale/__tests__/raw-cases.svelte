<script lang="ts">
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import LocaleProvider from '../locale-provider.svelte';
    import RawProbe from './raw-probe.svelte';

    let { locale, onSeen }: { locale: Locale; onSeen: (locale: Locale | null) => void } = $props();
</script>

<LocaleProvider><RawProbe {onSeen} /></LocaleProvider>
<LocaleProvider {locale}>
    <RawProbe {onSeen} />
    <LocaleProvider locale={undefined}><RawProbe {onSeen} /></LocaleProvider>
    <LocaleProvider locale={null}><RawProbe {onSeen} /></LocaleProvider>
</LocaleProvider>
<RawProbe {onSeen} />
