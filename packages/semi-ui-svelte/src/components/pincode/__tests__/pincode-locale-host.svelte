<script lang="ts">
    import type { Locale } from '@fibrae/semi-ui-svelte/locale';
    import { LocaleProvider } from '../../locale';
    import type { PinCodeProps } from '../interface';
    import PinCode from '../pincode.svelte';

    let { locale, store }: { locale: Locale; store: { props: PinCodeProps } } = $props();
</script>

<LocaleProvider {locale}>
    <PinCode {...store.props} />
</LocaleProvider>
