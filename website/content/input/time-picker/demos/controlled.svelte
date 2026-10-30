<script lang="ts">
    import { TimePicker, type TimePickerBaseValueType } from '@fibrae/semi-ui-svelte';

    let value = $state<TimePickerBaseValueType | TimePickerBaseValueType[] | null>(null);
    const onChange = (time: unknown) => console.log(time);
</script>

<TimePicker bind:value {onChange} />
