<script lang="ts">
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import LocaleProvider from '../../locale/locale-provider.svelte';
    import Calendar from '../calendar.svelte';
    import type { CalendarProps } from '../interface';

    let { locale, props }: { locale: Locale; props: CalendarProps } = $props();
</script>

<LocaleProvider {locale}>
    <Calendar {...props} />
</LocaleProvider>
