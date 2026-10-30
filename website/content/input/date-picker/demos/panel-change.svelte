<script lang="ts">
    import { DatePicker } from '@fibrae/semi-ui-svelte';

    const onPanelChange = (date: Date | Date[], dateString: string | string[]) => console.log(date, dateString);
</script>

<DatePicker {onPanelChange} style="width: 400px" syncSwitchMonth type="dateTimeRange" />
