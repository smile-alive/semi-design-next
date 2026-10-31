<script lang="ts">
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import LocaleProvider from '../../locale/locale-provider.svelte';
    import type { PaginationProps } from '../interface';
    import Pagination from '../pagination.svelte';

    let { store }: { store: { props: PaginationProps; locale?: Locale; direction?: 'ltr' | 'rtl' } } = $props();
</script>

<ConfigProvider direction={store.direction}>
    <LocaleProvider locale={store.locale}>
        <Pagination {...store.props} />
    </LocaleProvider>
</ConfigProvider>
