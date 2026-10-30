<script lang="ts">
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import { ConfigProvider } from '../../config-provider';
    import { LocaleProvider } from '../../locale';
    import Spin from '../spin.svelte';

    // a LocaleProvider outside, a ConfigProvider inside: ConfigProvider wins while its locale is set
    let { store }: { store: { locale?: Locale; configLocale?: Locale | null } } = $props();
</script>

<LocaleProvider locale={store.locale}>
    <ConfigProvider locale={store.configLocale}>
        <Spin />
    </ConfigProvider>
</LocaleProvider>
