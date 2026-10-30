<script lang="ts" module>
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import type { DatePickerProps } from '../interface';

    export interface ProviderFixtureStore {
        props: DatePickerProps;
        timeZone?: string | number;
        locale?: Locale;
    }
</script>

<script lang="ts">
    import { ConfigProvider } from '../../config-provider';
    import { LocaleProvider } from '../../locale';
    import DatePicker from '../date-picker.svelte';

    let { store }: { store: ProviderFixtureStore } = $props();
</script>

<ConfigProvider timeZone={store.timeZone}>
    <LocaleProvider locale={store.locale}>
        <DatePicker {...store.props} />
    </LocaleProvider>
</ConfigProvider>
