<script lang="ts" module>
    // Custom component text joins the Locale type through declaration merging
    declare module '@fibrae/semi-foundation/locale/interface' {
        export interface Locale {
            ComponentA: { customKey: string };
        }
    }
</script>

<script lang="ts">
    import en_GB from '@fibrae/semi-foundation/locale/source/en_GB';
    import ko_KR from '@fibrae/semi-foundation/locale/source/ko_KR';
    import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
    import { LocaleConsumer, LocaleProvider } from '@fibrae/semi-ui-svelte';

    const locales = [
        { ...zh_CN, ComponentA: { customKey: 'semi' } },
        { ...ko_KR, ComponentA: { customKey: 'design' } },
        { ...en_GB, ComponentA: { customKey: 'dsm' } },
    ];
</script>

{#each locales as locale (`semi-${locale.code}`)}
    <LocaleProvider {locale}>
        <LocaleConsumer componentName="TimePicker">
            {#snippet children({ locale: timePicker, localeCode })}
                <div>{localeCode} : {timePicker.begin}</div>
            {/snippet}
        </LocaleConsumer>
    </LocaleProvider>
{/each}
{#each locales as locale (`custom-${locale.code}`)}
    <LocaleProvider {locale}>
        <LocaleConsumer componentName="ComponentA">
            {#snippet children({ locale: componentA })}
                <div>{componentA.customKey}</div>
            {/snippet}
        </LocaleConsumer>
    </LocaleProvider>
{/each}
