<script lang="ts">
    import type { Locale } from '@fibrae/semi-ui-svelte/locale';
    import type { LocaleComponentName, LocaleResult } from '../interface';
    import LocaleConsumer from '../locale-consumer.svelte';
    import useLocale from '../use-locale.svelte';

    let { componentName = 'Modal', onSeen }: { componentName?: LocaleComponentName; onSeen?: (value: LocaleResult<Locale[LocaleComponentName]>) => void } = $props();

    const result = useLocale(() => componentName);

    $effect(() => {
        onSeen?.(result());
    });
</script>

<span data-testid="hook">{JSON.stringify(result())}</span>
<LocaleConsumer {componentName}>
    {#snippet children(value)}
        <span data-testid="consumer">{JSON.stringify(value)}</span>
    {/snippet}
</LocaleConsumer>
