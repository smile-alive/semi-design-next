<script lang="ts">
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import { LocaleProvider } from '../../locale';
    import Banner from '../banner.svelte';

    let { locale }: { locale: Locale } = $props();
</script>

<LocaleProvider {locale}>
    <Banner type="success" />
</LocaleProvider>
