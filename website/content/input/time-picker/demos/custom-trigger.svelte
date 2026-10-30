<script lang="ts">
    import * as dateFns from 'date-fns';
    import { IconTimePicker } from '@fibrae/semi-icons-svelte/lab';
    import { Tag, TimePicker, type TimePickerBaseValueType } from '@fibrae/semi-ui-svelte';

    const formatToken = 'HH:mm:ss';
    let time = $state<TimePickerBaseValueType | TimePickerBaseValueType[] | null>(new Date(2024, 0, 1, 10, 30, 0));
</script>

<TimePicker bind:value={time} format={formatToken}>
    {#snippet trigger({ placeholder })}
        <Tag color="cyan" shape="circle" size="large" style="padding: 12px; padding-right: 16px; font-size: 14px" type="light">
            {#snippet prefixIcon()}
                <IconTimePicker />
            {/snippet}
            {time instanceof Date ? dateFns.format(time, formatToken) : placeholder}
        </Tag>
    {/snippet}
</TimePicker>
