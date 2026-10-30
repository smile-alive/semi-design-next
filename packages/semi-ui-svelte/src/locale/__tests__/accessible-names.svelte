<script lang="ts">
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import { ConfigProvider } from '../../config-provider';
    import Spin from '../../spin/spin.svelte';
    import LocaleProvider from '../locale-provider.svelte';

    let { store }: { store: { locale?: Locale; configLocale?: Locale | null } } = $props();
</script>

<LocaleProvider locale={store.locale}>
    <ConfigProvider locale={store.configLocale}>
        <Spin />
    </ConfigProvider>
</LocaleProvider>
