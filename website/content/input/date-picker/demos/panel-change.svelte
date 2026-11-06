<script lang="ts">
    import { DatePicker } from '@fibrae/semi-ui-svelte';
</script>

<DatePicker onPanelChange={(date, dateString) => console.log(date, dateString)} style="width: 400px" syncSwitchMonth type="dateTimeRange" />
