<script lang="ts" module>
    // Custom component text joins the Locale type through declaration merging
    declare module '@fibrae/semi-foundation/locale/interface' {
        export interface Locale {
            ComponentA: { customKey: string };
        }
    }
</script>

<script lang="ts">
    import { LocaleConsumer, LocaleProvider } from '@fibrae/semi-ui-svelte';
    import { en_US, zh_CN } from '@fibrae/semi-ui-svelte/locale';

    const locales = [
        { ...zh_CN, ComponentA: { customKey: 'semi' } },
        { ...en_US, ComponentA: { customKey: 'design' } },
    ];
</script>

{#each locales as locale (`semi-${locale.code}`)}
    <LocaleProvider {locale}>
        <LocaleConsumer componentName="TimePicker">
            {#snippet children(consumer)}
                <div>{consumer.localeCode} : {consumer.locale.begin}</div>
            {/snippet}
        </LocaleConsumer>
    </LocaleProvider>
{/each}
{#each locales as locale (`custom-${locale.code}`)}
    <LocaleProvider {locale}>
        <LocaleConsumer componentName="ComponentA">
            {#snippet children(consumer)}
                <div>{consumer.locale.customKey}</div>
            {/snippet}
        </LocaleConsumer>
    </LocaleProvider>
{/each}
