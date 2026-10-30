<script lang="ts">
    import { DatePicker, type DatePickerProps } from '@fibrae/semi-ui-svelte';

    const onConfirm: DatePickerProps['onConfirm'] = (...args) => {
        console.log('Confirmed: ', ...args);
    };
    const onCancel: DatePickerProps['onCancel'] = (...args) => {
        console.log('Canceled: ', ...args);
    };
    const onChange: DatePickerProps['onChange'] = (...args) => {
        console.log('Changed: ', ...args);
    };
</script>

<DatePicker needConfirm {onCancel} {onChange} {onConfirm} type="dateTime" />
