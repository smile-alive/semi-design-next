<script lang="ts">
    import { format } from 'date-fns';
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import type { LocaleComponentName, LocaleResult } from '../interface';
    import LocaleConsumer from '../locale-consumer.svelte';
    import useLocale from '../use-locale.svelte';

    let { componentName = 'Modal', onSeen }: { componentName?: LocaleComponentName; onSeen?: (value: LocaleResult<Locale[LocaleComponentName]>) => void } = $props();

    const result = useLocale(() => componentName);

    $effect(() => {
        onSeen?.(result());
    });
</script>

<span data-testid="hook">{JSON.stringify({ ...result(), dateFnsLocale: result().dateFnsLocale?.code })}</span>
<span data-testid="date">{format(new Date(2026, 9, 13), 'EEEE', { locale: result().dateFnsLocale })}</span>
<LocaleConsumer {componentName}>
    {#snippet children(value)}
        <span data-testid="consumer">{JSON.stringify({ ...value, dateFnsLocale: value.dateFnsLocale?.code })}</span>
    {/snippet}
</LocaleConsumer>
