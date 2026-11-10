<script lang="ts">
    import type { Locale } from '@fibrae/semi-ui-svelte/locale';
    import { ConfigProvider } from '../../config-provider';
    import TabsFixture, { type FixtureStore } from './tabs-fixture.svelte';

    let { store, direction, locale }: { store: FixtureStore; direction?: 'ltr' | 'rtl'; locale?: Locale } = $props();
</script>

<ConfigProvider {direction} {locale}>
    <TabsFixture {store} />
</ConfigProvider>
