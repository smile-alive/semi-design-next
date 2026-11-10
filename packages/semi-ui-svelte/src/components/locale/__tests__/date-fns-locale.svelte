<script lang="ts">
    import { de } from 'date-fns/locale';
    import Calendar from '../../calendar/calendar.svelte';
    import { ConfigProvider } from '../../config-provider';
    import LocaleProvider from '../locale-provider.svelte';

    let { displayValue }: { displayValue: Date } = $props();
</script>

<Calendar {displayValue} mode="day" />
<LocaleProvider locale={{ code: 'ja-JP' }}>
    <Calendar {displayValue} mode="day" />
    <ConfigProvider dateFnsLocale={de}>
        <Calendar {displayValue} mode="day" />
    </ConfigProvider>
</LocaleProvider>
