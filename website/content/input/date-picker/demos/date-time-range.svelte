<script lang="ts">
    import { DatePicker } from '@fibrae/semi-ui-svelte';

    const defaultPickerValue = [new Date('2022-08-08 00:00'), new Date('2022-08-09 12:00')];
</script>

<DatePicker onChange={console.log} style="width: 400px; margin-bottom: 8px" type="dateTimeRange" />
<DatePicker {defaultPickerValue} onChange={console.log} style="width: 400px" type="dateTimeRange" />
