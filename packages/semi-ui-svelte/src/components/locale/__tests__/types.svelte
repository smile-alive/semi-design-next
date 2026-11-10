<script lang="ts">
    import LocaleConsumer from '../locale-consumer.svelte';
    import useLocale from '../use-locale.svelte';

    // svelte-check verifies these types: the snippet's `locale` follows componentName, and only component names are accepted
    // @ts-expect-error 'code' is not a component's strings
    useLocale('code');
    // @ts-expect-error 'currency' is not a component's strings
    useLocale('currency');
    // @ts-expect-error 'Tabel' is not a component name
    useLocale('Tabel');
</script>

<LocaleConsumer componentName="Table">
    {#snippet children({ locale, currency, localeCode })}
        <span>{locale.emptyText} {currency} {localeCode}</span>
    {/snippet}
</LocaleConsumer>
